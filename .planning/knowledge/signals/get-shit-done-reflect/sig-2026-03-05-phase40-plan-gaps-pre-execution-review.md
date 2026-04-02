---
id: sig-2026-03-05-phase40-plan-gaps-pre-execution-review
type: signal
signal_type: plan-accuracy
project: get-shit-done-reflect
severity: critical
lifecycle: remediated
source: deliberation-trigger
tags: [plan-accuracy, pre-execution-review, reentrancy, double-fire, output-corruption, context-estimation, test-coverage, phase-40]
created: 2026-03-05T21:00:00Z
updated: 2026-04-02T22:00:00Z
status: remediated
phase_context: "40"
---

# Pre-Execution Plan Review Finds 5 Gaps in Phase 40 Plans

## Summary

Deep analysis of Phase 40 (Signal Collection Automation) plans before execution identified 2 bugs that would cause silent failures, 1 effectively non-functional requirement, and 2 convention violations.

## Findings

### Bug 1: Double-Fire in Plan 02 Steps 5-6 (HIGH)
Plan 02 step 5 calls `track-event signal_collection fire`, incrementing fires 0->1. Step 6 calls `track-event signal_collection fire` AGAIN to check if `fires === 1`, incrementing to 2. The first-run regime change detection (`fires === 1`) never matches. SIG-06 silently fails.

### Bug 2: Double output() on Stale Lock Removal (HIGH)
Plan 01 Task 1's `cmdAutomationLock` calls `output()` for stale removal, then falls through to call `output()` again for acquisition. Two JSON objects on stdout breaks JSON parsing for consumers.

### Gap 3: Context Estimate Always 40% Makes SIG-05 Non-Functional (MEDIUM)
Plan 02 hardcodes context estimate as 40. The deferral threshold is 60%. Since 40 < 60 always, context deferral never triggers. SIG-05 is syntactically satisfied but functionally dead.

### Gap 4: No Automated Tests for 4 New CLI Commands (MEDIUM)
Plan 01 adds lock/unlock/check-lock/regime-change commands with manual verification only. Every prior phase that added gsd-tools.js commands also added automated tests (Phase 37: automation.test.js, Phase 38: sensors tests). This breaks the project's testing convention.

### Gap 5: Lockfile Not Gitignored (LOW)
`.planning/.signal_collection.lock` has no gitignore entry. Stale locks show in `git status`.

## Detection Method

Manual deep analysis of plan files against codebase, tracing implicit dependency chains and second-order consequences. Not detectable by the current plan checker (which validates structural correctness, not semantic correctness of proposed code).

## Disconfirmation Conditions

- Bug 1 would be falsified if `track-event` has a read-only mode or `output()` calls `process.exit()` (it doesn't)
- Bug 2 would be falsified if `output()` has dedup logic or returns without writing (it doesn't -- it's a simple JSON writer)

## Remediation

Phase 40 executed successfully. No follow-up signals about the gaps identified in pre-execution review.
