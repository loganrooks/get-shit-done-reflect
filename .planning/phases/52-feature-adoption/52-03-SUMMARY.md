---
phase: 52-feature-adoption
plan: 03
model: claude-opus-4-6
context_used_pct: 12
subsystem: workflows
tags: [discuss-phase, quick, upstream-sync, codebase-scouting, discuss-flag]
requires:
  - phase: 52-RESEARCH
    provides: "ADT-06/ADT-10 wholesale-replace safety analysis confirming steering brief lives in command layer"
provides:
  - "Code-aware discuss-phase workflow with codebase scouting and code_context output"
  - "Quick workflow with --discuss flag and composable flag system"
affects: [discuss-phase, quick, CONTEXT.md generation, phase workflows]
tech-stack:
  added: []
  patterns: [upstream-wholesale-replace, code-aware-discussion, composable-flags]
key-files:
  created: []
  modified:
    - get-shit-done/workflows/discuss-phase.md
    - get-shit-done/workflows/quick.md
key-decisions:
  - "Upstream wholesale replace verified safe -- fork's steering brief model lives in command layer (commands/gsd/discuss-phase.md), not workflow file"
  - "Upstream files use $HOME/.claude/get-shit-done/ paths which installer's replacePathsInContent() handles at install time"
duration: 2min
completed: 2026-03-28
---

# Phase 52 Plan 03: Workflow Wholesale Replace Summary

**Wholesale-replaced discuss-phase.md (1049 lines, codebase scouting + code_context) and quick.md (757 lines, --discuss flag + composable flags) with upstream versions**

## Performance
- **Duration:** 2min
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- ADT-06: discuss-phase.md now has scout_codebase step producing code_context in CONTEXT.md, plus prior context loading, cross-reference todos, batch/analyze/text/auto modes, and advisor research spawning
- ADT-10: quick.md now has --discuss flag enabling lightweight discussion before planning, composable with --research and --full flags
- DC-4: Fork's steering brief model confirmed safe in command layer (untouched by workflow replacement)
- Both files include upstream's C2 shell robustness (|| true guards) and C4 worktree isolation

## Task Commits
1. **Task 1: Wholesale-replace discuss-phase.md with upstream's code-aware version (ADT-06)** - `ef04368`
2. **Task 2: Wholesale-replace quick.md with upstream's --discuss version (ADT-10)** - `439dfdc`

## Files Created/Modified
- `get-shit-done/workflows/discuss-phase.md` - Replaced 408-line fork version with 1049-line upstream version; adds codebase scouting, code_context output, prior context loading, auto-advance, and enhanced CONTEXT.md template
- `get-shit-done/workflows/quick.md` - Replaced 351-line fork version with 757-line upstream version; adds --discuss flag, composable flag system, discussion-derived decision injection

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Both workflow source files ready for installer's replacePathsInContent() at install time
- Discuss-phase and quick workflows available for remaining Phase 52 plans that may reference discussion capabilities
- Command layer (commands/gsd/discuss-phase.md, commands/gsd/quick.md) compatible with new workflow versions

## Self-Check: PASSED
