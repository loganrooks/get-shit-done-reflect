---
phase: 46-upstream-module-adoption
plan: 04
model: claude-opus-4-6
context_used_pct: 18
subsystem: cli-dispatcher
tags: [init, modularization, gap-closure, dead-code-removal]
requires:
  - phase: 46-01
    provides: "11 upstream lib/*.cjs modules adopted wholesale, init.cjs present but orphaned"
  - phase: 46-02
    provides: "Dispatcher rewrite routing most commands through modules (missed init subcommands)"
provides:
  - "8 non-fork init subcommands routed through init.cjs module functions"
  - "313 lines of inline dead code removed from gsd-tools.cjs"
  - "init.cjs no longer orphaned -- fully wired in dispatcher"
affects: [cli-dispatcher, init-workflows]
tech-stack:
  added: []
  patterns: [module-routing]
key-files:
  created: []
  modified:
    - get-shit-done/bin/gsd-tools.cjs
key-decisions:
  - "cmdInitTodos remains inline as the sole init fork override (priority/source/status fields)"
  - "4 other fork overrides (execute-phase, plan-phase, progress, todos) unchanged"
patterns-established:
  - "Init module routing: all non-fork init subcommands call init.cmdXxx() instead of inline copies"
duration: 3min
completed: 2026-03-20
---

# Phase 46 Plan 04: Init Module Gap Closure Summary

**Route 8 non-fork init subcommands through init.cjs and remove 313 lines of inline duplicates, closing the two remaining VERIFICATION.md gaps**

## Performance
- **Duration:** 3min
- **Tasks:** 2 completed
- **Files modified:** 1

## Accomplishments
- Wired 8 init dispatcher routes (new-project, new-milestone, quick, resume, verify-work, phase-op, milestone-op, map-codebase) to call init.cmdXxx() module functions instead of inline copies
- Removed 8 inline cmdInit* function definitions (313 lines of dead code)
- Reduced gsd-tools.cjs from 3,513 to 3,200 lines
- init.cjs is no longer an orphaned import -- all 8 module functions are now called by the dispatcher
- Preserved cmdInitTodos as the sole init fork override (adds priority/source/status fields)
- All 534 tests pass (350 vitest + 174 upstream + 10 fork), confirming behavioral equivalence

## Task Commits
1. **Task 1: Route 8 non-fork init subcommands through init.cjs and remove inline duplicates** - `82b671d`
2. **Task 2: Run full test suite to verify behavioral equivalence** - (verification only, no code changes)

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.cjs` - 8 dispatcher routes changed from inline to init.cmdXxx(), 8 inline function definitions removed (313 lines)

## Decisions & Deviations

### Decisions
- cmdInitTodos kept inline as documented fork override (priority/source/status fields that upstream lacks)
- 4 other fork overrides (execute-phase, plan-phase, progress, todos) left untouched per plan

### Deviations
None -- plan executed exactly as written.

## Verification Results

| Check | Expected | Actual |
|-------|----------|--------|
| `init.cmdInit*` calls in dispatcher | 8 | 8 |
| Removed inline cmdInit* definitions | 0 remaining | 0 remaining |
| cmdInitTodos fork override | 1 | 1 |
| gsd-tools.cjs line count | ~3,170 | 3,200 |
| vitest tests | pass | 350 pass |
| upstream tests | pass | 174 pass |
| fork tests | pass | 10 pass |
| init.cjs live call (new-project keys) | >0 | 14 |

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 46 verification gaps are now fully closed. All 8/8 observable truths from 46-VERIFICATION.md should now pass. Ready for Phase 47 (Fork Module Extraction).

## Self-Check: PASSED
- FOUND: get-shit-done/bin/gsd-tools.cjs
- FOUND: 46-04-SUMMARY.md
- FOUND: 82b671d (Task 1 commit)
