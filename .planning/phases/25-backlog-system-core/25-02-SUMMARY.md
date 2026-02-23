---
phase: 25-backlog-system-core
plan: 02
subsystem: backlog-commands
tags: [backlog, cli, tdd, group, promote, index, global]
requires:
  - phase: 25-backlog-system-core
    provides: "resolveBacklogDir, readBacklogItems, cmdBacklogAdd/List/Update/Stats, CLI dispatch, extractFrontmatter/reconstructFrontmatter"
provides:
  - "cmdBacklogGroup for theme-based and tag-based clustering"
  - "cmdBacklogPromote for transitioning items to planned status with optional target"
  - "cmdBacklogIndex for generating sorted Markdown table index"
  - "regenerateBacklogIndex silent helper for auto-regeneration"
  - "--global flag support for backlog index command"
  - "Auto-regeneration of index.md after add, update, and promote operations"
affects: [25-03, 26-backlog-integration]
tech-stack:
  added: []
  patterns: [silent-helper-pattern, auto-regeneration-on-write, multi-group-by-tag]
key-files:
  created: []
  modified: [get-shit-done/bin/gsd-tools.js, get-shit-done/bin/gsd-tools.test.js]
key-decisions:
  - "regenerateBacklogIndex extracted as silent helper (no output()) to avoid double-output during add/update/promote"
  - "Items appear in multiple tag groups when they have multiple tags (not deduplicated)"
  - "Index sort: priority (HIGH > MEDIUM > LOW) then date (newest first within same priority)"
patterns-established:
  - "Silent helper pattern: extract core logic from command into non-output function, command wraps with output()"
  - "Auto-regeneration: write operations call regenerateBacklogIndex() in try/catch to rebuild index silently"
duration: 5min
completed: 2026-02-22
---

# Phase 25 Plan 02: Backlog Group, Promote, Index + Global Summary

**TDD-driven backlog group/promote/index commands with auto-regeneration of index.md and --global flag for cross-project storage**

## Performance
- **Duration:** 5min
- **Tasks:** 2 completed (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Built backlog group command: clusters items by theme (default) or tags (--by tags)
- Built backlog promote command: sets status to planned, optionally sets promoted_to target
- Built backlog index command: generates Markdown table sorted by priority then date
- Extracted regenerateBacklogIndex as silent helper to avoid double-output
- Added auto-regeneration of index.md after add, update, and promote operations
- Wired group, promote, index into CLI router as backlog subcommands
- Added --global flag support for backlog index (add/list already had it from Plan 01)
- 11 new tests: 3 group + 3 promote + 2 index + 3 global flag
- runGsdToolsWithEnv test helper for custom environment variables
- All 143 tests pass (132 existing + 11 new), zero regressions

## Task Commits
1. **Task 1: Write failing tests (TDD RED)** - `90a02ef`
2. **Task 2: Implement backlog group, promote, index + auto-regeneration (TDD GREEN)** - `fa9a242`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added cmdBacklogGroup, cmdBacklogPromote, cmdBacklogIndex, regenerateBacklogIndex functions, CLI router wiring, auto-regeneration in add/update (+156 lines)
- `get-shit-done/bin/gsd-tools.test.js` - Added 11 tests across 4 describe blocks with runGsdToolsWithEnv helper (+304 lines)

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 03 can extend add-todo.md workflow to include backlog integration
- All backlog commands (add, list, update, stats, group, promote, index) are fully tested and operational
- regenerateBacklogIndex pattern available for any future write operations that should trigger index rebuild

## Self-Check: PASSED
- All files exist: gsd-tools.js, gsd-tools.test.js, 25-02-SUMMARY.md
- All commits verified: 90a02ef, fa9a242
