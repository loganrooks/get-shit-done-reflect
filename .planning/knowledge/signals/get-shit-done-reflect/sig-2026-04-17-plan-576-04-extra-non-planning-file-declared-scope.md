---
id: sig-2026-04-17-plan-576-04-extra-non-planning-file-declared-scope
type: signal
project: get-shit-done-reflect
tags: [scope-creep, plan-accuracy, measurement, tests]
created: "2026-04-17T01:13:15Z"
updated: "2026-04-17T01:13:15Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: "57.6"
plan: "4"
polarity: negative
source: auto
occurrence_count: 3
related_signals:
  - sig-2026-03-02-plan-scope-declaration-mismatch-35-03-and-04
  - sig-2026-03-05-undeclared-claude-dir-scope-creep-plan02
  - sig-2026-03-26-core-cjs-modified-in-plan-50-03-execution
  - sig-2026-03-26-plan-51-01-files-modified-omits-tests-unit
  - sig-2026-03-27-plan-05-adopted-undeclared-agent-gsd-advisor-resea
  - sig-2026-03-27-plan-53-04-declared-zero-file-modifications-but
  - sig-2026-03-28-plan-01-declared-4-files-modified-but-only
  - sig-2026-04-10-plan-03-scope-extension-wiring-validation-undeclared
runtime: claude-code
model: gpt-5.4
gsd_version: "1.18.2+dev"
detection_method: sensor-git
origin: local
environment:
  os: linux
  node_version: "v22.22.1"
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-17T01:13:15Z"
evidence:
  supporting:
    - "`57.6-04-PLAN.md` declared 6 non-planning files under `files_modified`."
    - "Task commit `018d192be411b567946ad3b2959156b399c4fdd0` touched 7 non-planning files."
    - "Unexpected extra file in the task commit: `tests/unit/measurement-codex.test.js`."
    - "`57.6-04-SUMMARY.md` corroborates the extra shared-test edit as required Codex test alignment work."
  counter:
    - "Extra files may represent legitimate auto-fixes (deviation Rules 1-3) or necessary supporting changes."
confidence: medium
confidence_basis: "Direct comparison of the plan declaration against the plan's task commit shows exactly one extra non-planning file; the phase summary independently explains why that shared test had to change."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 57.6-04 declared six non-planning files, but the task commit landed seven. The extra file was `tests/unit/measurement-codex.test.js`, which had to move with the extractor work even though it was outside the manifest.

The summary confirms this was not random drift: the shared Codex measurement test had to be aligned with the new extractor count after the plan code changed.

## Context

This came from the git sensor's comparison of Plan 57.6-04 against task commit `018d192be411b567946ad3b2959156b399c4fdd0` in phase directory `.planning/phases/57.6-multi-loop-coverage-human-interface-inserted`. The task ran on the shared 57.6 branch and the summary explicitly documents the shared-test edit as part of closing out the plan.

This signal links to a long-running pattern in the KB where `files_modified` manifests undercount downstream test or integration changes once real execution begins.

## Potential Cause

The plan boundary captured the intended feature files but not the working-tree reality created by shared test coupling. Once the extractor count changed, the shared measurement test became part of the true execution surface, and the plan manifest lagged that dependency.
