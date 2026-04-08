---
id: sig-2026-03-03-unplanned-autofix-extractatrefs-trailing-asterisk
type: signal
project: get-shit-done-reflect
tags: [deviation, wiring-validation, testing]
created: "2026-03-03T00:00:00Z"
updated: "2026-03-03T00:00:00Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 36
plan: 1
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-02-28-cross-plan-test-count-not-updated
  - sig-2026-03-02-step-55-auto-trigger-never-exercised
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-03T00:00:00Z"
evidence:
  supporting:
    - "SUMMARY.md Auto-fixed Issues: Rule 1 - Bug: extractAtRefs trailing asterisk stripping"
    - "Root cause: gsd-executor.md contains markdown bold syntax leak in @-reference"
    - Not in PLAN.md task specifications
  counter: []
confidence: high
confidence_basis: SUMMARY.md explicitly records auto-fixed issues section
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

During Task 1 verification in phase 36, an unplanned auto-fix was applied: `extractAtRefs` was stripping trailing asterisks from @-references. This issue was not part of the PLAN.md task specifications. The root cause was identified as a markdown bold syntax leak in `gsd-executor.md` -- the `**` bold markers were bleeding into the @-reference parsing.

## Context

Phase 36 (foundation-fix) focused on wiring-validation test path corrections. While verifying Task 1, the executor discovered and fixed the `extractAtRefs` trailing asterisk stripping bug as an unplanned deviation. The fix was applied outside the original plan scope.

## Potential Cause

The `gsd-executor.md` file contains markdown bold syntax (`**`) adjacent to an @-reference, which caused `extractAtRefs` to include the trailing asterisk as part of the reference string. The original plan's scope did not cover this edge case in @-reference parsing, suggesting the verification pass caught a pre-existing latent bug rather than a regression introduced during this phase.
