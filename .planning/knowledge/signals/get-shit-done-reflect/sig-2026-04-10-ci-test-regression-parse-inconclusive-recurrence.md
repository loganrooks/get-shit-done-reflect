---
id: sig-2026-04-10-ci-test-regression-parse-inconclusive-recurrence
type: signal
project: get-shit-done-reflect
tags: [ci, test-regression, epistemic-gap, parsing-limitation, sensor-capability-gap]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: minor
signal_type: epistemic-gap
signal_category: negative
phase: "57.4"
plan: "0"
polarity: negative
source: local
occurrence_count: 2
related_signals:
  - sig-2026-03-06-ci-test-regression-parse-inconclusive
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
environment:
  os: linux
  node_version: unknown
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-10T21:55:15Z"
evidence:
  supporting:
    - "Phase branch CI run 24263555363 log shows '502 passed'"
    - "Previous completed CI run 24215794461 was for a different PR — not directly comparable"
    - "CI sensor could not derive a regression signal from the run data"
    - "Prior occurrence: sig-2026-03-06-ci-test-regression-parse-inconclusive (same sensor limitation in Phase 42)"
  counter:
    - "502 passing tests on the phase branch is consistent with a healthy test suite"
    - "The sensor correctly reported the gap rather than fabricating a conclusion"
confidence: low
confidence_basis: "Test count parsing from vitest logs is format-dependent and prior-run comparison requires same-PR baseline. The CI sensor's parsing logic is known to hit this epistemic wall when the most-recent prior run is for a different PR."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

The CI sensor attempted to derive a test-regression signal for Phase 57.4 but could not: the phase branch CI run 24263555363 shows 502 passing tests, but the previous completed run (24215794461) was for a different PR and is not directly comparable. The sensor reported the gap as an `epistemic-gap` signal rather than fabricating a conclusion.

This is the 2nd recorded occurrence of the same sensor capability gap. The prior occurrence (`sig-2026-03-06-ci-test-regression-parse-inconclusive`) documented the same issue at Phase 42.

## Context

- CI provider: GitHub Actions
- Test framework: vitest
- Sensor logic: compare current run's passing count to most-recent prior run's passing count
- Failure mode: when the most-recent prior run is for a different PR, the comparison baseline is wrong and the sensor cannot derive a valid regression signal
- Recurrence: Phase 42 hit this exact gap on 2026-03-06, Phase 57.4 hits it again on 2026-04-10

## Potential Cause

The sensor's baseline comparison logic is too naive. It assumes "most recent prior run = valid baseline" but this is only true when the prior run was for the same branch or same PR. When the prior run was for a different PR (which is common because CI runs are interleaved across PRs), the baseline is not comparable.

Possible fixes:

1. **Compare to same-branch baseline.** Query `gh run list --branch main --limit 1` for the most recent main-branch run and compare against that. This gives a stable baseline (main is the merge target) and avoids cross-PR contamination.

2. **Compare to same-PR history.** Use the PR's own run history as the baseline. Query `gh pr checks {PR}` for the PR's check history and compare the current run to the previous run on the same PR. This catches regression-within-PR patterns.

3. **Report "no baseline available" explicitly.** The current behavior (reporting an epistemic-gap signal) is honest and correct, but produces noise. A cleaner pattern would be to only emit the signal if a valid baseline exists, and skip silently otherwise.

This is a known sensor capability gap (now 2nd recorded occurrence) — not a Phase 57.4 problem. The recurrence count of 2 suggests it is worth investing in a sensor improvement rather than continuing to generate epistemic-gap signals on every phase.
