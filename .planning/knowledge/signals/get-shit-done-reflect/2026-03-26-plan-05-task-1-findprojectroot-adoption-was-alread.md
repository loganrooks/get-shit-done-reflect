---
id: sig-2026-03-26-plan-05-task-1-findprojectroot-adoption-was-alread
type: signal
project: get-shit-done-reflect
tags: [cross-plan-bleed, task-attribution, findProjectRoot, scope-drift]
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 50
plan: 5
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.17.5+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-03-29T08:00:00Z"
evidence:
  supporting:
    - "50-05-SUMMARY.md Deviations: 'Task 1 (findProjectRoot adoption) was already committed in prior plan execution (50-03, commit 24cfa8e) which bundled it with TST-05 crash-recovery tests.'"
    - "50-05-SUMMARY.md Task Commits: 'Task 1: Adopt findProjectRoot from upstream into core.cjs (C2 partial) - 24cfa8e (committed by prior plan 50-03)'"
    - The commit belongs to plan 50-03 but contained work scoped to plan 50-05, creating an attribution and sequencing gap
  counter:
    - The executor verified the implementation matched plan requirements exactly and created no duplicate commit
    - "The end result is correct: findProjectRoot exists in core.cjs as expected"
    - Both 50-03 and 50-05 SUMMARY files document this transparently
confidence: high
confidence_basis: Explicitly documented in 50-05 SUMMARY deviations section with specific commit reference
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 05 Task 1 (findProjectRoot adoption) was already committed during plan 50-03 execution, causing cross-plan task bleed

Evidence:
- 50-05-SUMMARY.md Deviations: 'Task 1 (findProjectRoot adoption) was already committed in prior plan execution (50-03, commit 24cfa8e) which bundled it with TST-05 crash-recovery tests.'
- 50-05-SUMMARY.md Task Commits: 'Task 1: Adopt findProjectRoot from upstream into core.cjs (C2 partial) - 24cfa8e (committed by prior plan 50-03)'
- The commit belongs to plan 50-03 but contained work scoped to plan 50-05, creating an attribution and sequencing gap

## Context

Phase 50, Plan 5 (artifact sensor).
Source artifact: .planning/phases/50-migration-test-hardening/50-05-SUMMARY.md

## Potential Cause

Plan underspecification or assumption mismatch between what was planned and what was required during execution.
