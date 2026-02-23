---
phase: 26-backlog-workflow-integration
plan: 02
subsystem: workflows
tags: [backlog, new-milestone, check-todos, complete-milestone, workflow-integration]
requires:
  - phase: 25-backlog-system-core
    provides: "backlog CLI commands (add, list, group, promote, update, stats)"
  - phase: 26-01
    provides: "milestone field in backlog schema, multi-status filter for backlog list"
provides:
  - "Step 1b (backlog review for scoping) and Step 9b (promote selected items) in new-milestone workflow"
  - "Promote-to-backlog action and priority/status filter support in check-todos workflow"
  - "Backlog review step with keep/defer/discard triage in complete-milestone workflow"
affects: [26-03-PLAN]
tech-stack:
  added: []
  patterns: [two-phase-promote, additive-filter-args, skippable-review-step]
key-files:
  created: []
  modified:
    - get-shit-done/workflows/new-milestone.md
    - get-shit-done/workflows/check-todos.md
    - get-shit-done/workflows/complete-milestone.md
key-decisions:
  - "Two-phase promote: select in Step 1b, promote in Step 9b after REQ-IDs exist"
  - "Deduplication by item ID after multi-select to handle multi-tag group overlap"
  - "Backlog review always skippable -- never gates milestone completion"
  - "Planned items offered for done-marking after milestone ships"
  - "Priority/status filters additive (AND logic) on check-todos"
patterns-established:
  - "Two-phase promote: select items early in workflow, promote later when target IDs exist"
  - "Skippable review: backlog triage steps always offer skip/keep-all options"
duration: 3min
completed: 2026-02-23
---

# Phase 26 Plan 02: Workflow Integration Summary

**Backlog integration into new-milestone (scoping + promote), check-todos (promote-to-backlog action), and complete-milestone (review/triage step) workflows**

## Performance
- **Duration:** 3min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Inserted Step 1b (Review Backlog Items) into new-milestone workflow for backlog-aware milestone scoping with multi-select
- Inserted Step 9b (Promote Selected Backlog Items) into new-milestone workflow with two-phase promote pattern
- Added --priority and --status argument filters to check-todos workflow (additive filtering)
- Added "Promote to backlog" action to both roadmap-match and no-match action lists in check-todos
- Added promote-to-backlog handler with `backlog add` CLI and todo done/keep question
- Inserted backlog_review step into complete-milestone workflow after evolve_project_full_review
- Backlog review surfaces unpromoted items (captured/triaged) with keep/defer/discard/skip options
- Backlog review also handles planned items (offer to mark as done after milestone ships)

## Task Commits
1. **Task 1: Add backlog integration to new-milestone workflow** - `e2007b2`
2. **Task 2: Add backlog integration to check-todos and complete-milestone workflows** - `24bdf80`

## Files Created/Modified
- `get-shit-done/workflows/new-milestone.md` - Steps 1b (backlog review for scoping) and 9b (promote selected items)
- `get-shit-done/workflows/check-todos.md` - Priority/status filters, promote-to-backlog action and handler
- `get-shit-done/workflows/complete-milestone.md` - Backlog review step with keep/defer/discard triage and planned item handling

## Decisions & Deviations
None - followed plan as specified. All workflow instructions use existing CLI commands from Phases 25 and 26-01.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three workflow integration points operational (BINT-01, BINT-03, BINT-04)
- Ready for Plan 03 (reader enumeration and verification)

## Self-Check: PASSED
- Files: new-milestone.md FOUND, check-todos.md FOUND, complete-milestone.md FOUND, 26-02-SUMMARY.md FOUND
- Commits: e2007b2 FOUND, 24bdf80 FOUND
