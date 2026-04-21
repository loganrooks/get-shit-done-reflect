---
id: sig-2026-03-01-duplicate-commit-hash-in-summary
type: signal
project: get-shit-done-reflect
tags:
  - deviation
  - summary-accuracy
  - commit-hygiene
  - plan-accuracy
  - audit-trail
created: "2026-03-01T23:03:00Z"
updated: "2026-03-01T23:03:00Z"
durability: workaround
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 34
plan: 3
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-02-22-commit-label-mismatch-022d068]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-01T23:03:00Z"
evidence:
  supporting:
    - "34-03-SUMMARY.md Task 1 commit hash: 65aadff"
    - "34-02-SUMMARY.md Task 2 commit hash: 65aadff"
    - Both summaries report the same commit hash for different tasks in different plans
  counter: []
confidence: medium
confidence_basis: Commit hashes are directly observable in both SUMMARY.md files. Could be a genuine shared commit (unlikely for separate plans) or a copy-paste error in the summary.
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

In the Phase 34 summaries, Plan 34-03 Task 1 reports commit hash `65aadff` and Plan 34-02 Task 2 also reports commit hash `65aadff`. This means either: (1) both tasks were somehow committed in the same git commit (unlikely since they modified different files in different plans), or (2) the commit hash was copy-pasted incorrectly in one of the summaries, compromising audit trail accuracy.

## Context

Phase 34 Plan 02 modified `agents/gsd-planner.md` and `get-shit-done/workflows/plan-phase.md`. Phase 34 Plan 03 modified `get-shit-done/workflows/execute-plan.md` and `agents/gsd-signal-synthesizer.md`. These are entirely different file sets, making a shared commit hash improbable.

## Potential Cause

Most likely a copy-paste error when generating the SUMMARY.md for Plan 34-03 -- the executor may have carried forward the commit hash from Plan 34-02's summary template. This is related to the existing signal about commit label mismatches (sig-2026-02-22-commit-label-mismatch-022d068), suggesting a pattern of summary accuracy issues.
