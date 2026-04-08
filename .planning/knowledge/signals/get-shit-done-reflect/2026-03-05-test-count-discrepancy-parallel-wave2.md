---
id: sig-2026-03-05-test-count-discrepancy-parallel-wave2
type: signal
project: get-shit-done-reflect
tags: [test-count, parallel-execution, wave-dependency]
created: "2026-03-05T06:15:00Z"
updated: "2026-03-05T06:15:00Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 38.1
plan: 3
polarity: negative
occurrence_count: 1
related_signals: []
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-05T06:15:00Z"
evidence:
  supporting:
    - Plan 02 reports 214 tests, Plan 03 reports 206 tests
    - Both are wave 2, Plan 03 depends only on Plan 01
  counter:
    - Expected behavior for parallel execution
    - Verification confirms 214 after merge
confidence: medium
confidence_basis: 
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Plan 02 and Plan 03 ran in parallel as wave-2 plans. Plan 02 added 8 new tests (bringing count to 214), but Plan 03 only depended on Plan 01 and reported 206 tests. The test counts diverged during parallel execution because Plan 03 did not include Plan 02's test additions.

## Context

Phase 38.1 (project-local knowledge base), Plans 02 and 03 in wave 2. Plan 03 declared dependency only on Plan 01, not Plan 02, so it executed against the pre-Plan-02 codebase.

## Potential Cause

This is inherent to parallel wave execution: plans in the same wave run independently and each sees only the state after their declared dependencies. The final merged state (214 tests) is correct. The discrepancy is cosmetic -- it appears in per-plan summaries but resolves after merge.
