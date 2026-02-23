---
phase: 25-backlog-system-core
plan: 01
subsystem: backlog-crud
tags: [backlog, cli, tdd, frontmatter]
requires:
  - phase: 24-manifest-driven-config-migration
    provides: "CLI subcommand dispatch pattern, extractFrontmatter/reconstructFrontmatter, generateSlugInternal"
provides:
  - "resolveBacklogDir helper for two-tier path resolution"
  - "readBacklogItems shared reader with frontmatter parsing"
  - "backlog add command with collision handling and full frontmatter"
  - "backlog list command with priority/status/tags filtering"
  - "backlog update command with field modification and timestamp"
  - "backlog stats command with counts by status and priority"
  - "CLI dispatch for backlog subcommands"
  - "Todo auto-defaults for priority/source/status fields"
affects: [25-02, 25-03, 26-backlog-integration]
tech-stack:
  added: []
  patterns: [backlog-item-frontmatter, two-tier-storage-resolution, auto-default-missing-fields]
key-files:
  created: []
  modified: [get-shit-done/bin/gsd-tools.js, get-shit-done/bin/gsd-tools.test.js]
key-decisions:
  - "promoted_to stored as string 'null' to survive reconstructFrontmatter null-skipping"
  - "backlog stats aggregates local items only (global requires GSD_HOME which is not set in tests)"
  - "TDD approach: 17 tests written first (RED), then implementation to pass all (GREEN)"
patterns-established:
  - "Backlog item format: Markdown with YAML frontmatter (id, title, tags, theme, priority, status, source, promoted_to, created, updated)"
  - "Backlog filename: YYYY-MM-DD-slug.md with numeric suffix for collisions"
  - "Backlog ID: blog-YYYY-MM-DD-slug"
  - "Todo auto-defaults: missing priority defaults to MEDIUM, source to unknown, status to pending"
duration: 8min
completed: 2026-02-22
---

# Phase 25 Plan 01: Core Backlog CRUD Summary

**TDD-driven backlog add/list/update/stats commands with two-tier path resolution, collision handling, and todo auto-defaults for priority/source/status**

## Performance
- **Duration:** 8min
- **Tasks:** 2 completed (TDD RED + GREEN)
- **Files modified:** 2

## Accomplishments
- Built complete backlog CRUD system: add, list, update, stats commands
- resolveBacklogDir supports project-local and global (--global) storage tiers
- readBacklogItems shared reader parses frontmatter from all .md files in items directory
- backlog add creates Markdown files with 10-field YAML frontmatter, handles filename collisions
- backlog list supports filtering by priority, status, and tags
- backlog update modifies fields and auto-updates the updated timestamp
- backlog stats reports total, local, global counts grouped by status and priority
- Extended cmdListTodos and cmdInitTodos to include priority/source/status with auto-defaults
- CLI router dispatches all backlog subcommands following manifest command pattern
- 17 new tests pass, 115 existing tests pass, zero regressions

## Task Commits
1. **Task 1: Write failing tests (TDD RED)** - `b3c55c9`
2. **Task 2: Implement backlog commands (TDD GREEN)** - `a0d297f`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added resolveBacklogDir, readBacklogItems, cmdBacklogAdd, cmdBacklogList, cmdBacklogUpdate, cmdBacklogStats functions and CLI dispatch (+241 lines)
- `get-shit-done/bin/gsd-tools.test.js` - Added 17 tests across 5 describe blocks with createBacklogItem helper (+382 lines)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] promoted_to null handling with reconstructFrontmatter**
- **Found during:** Task 2
- **Issue:** reconstructFrontmatter skips null values (line 335), so `promoted_to: null` would not appear in output
- **Fix:** Store promoted_to as string `'null'` instead of JavaScript null so it survives serialization
- **Files modified:** get-shit-done/bin/gsd-tools.js
- **Commit:** a0d297f

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can build on resolveBacklogDir, readBacklogItems, and CLI dispatch to add group, promote, global, and index commands
- Plan 03 can extend add-todo.md workflow to include optional priority/source fields

## Self-Check: PASSED
- All files exist: gsd-tools.js, gsd-tools.test.js, 25-01-SUMMARY.md
- All commits verified: b3c55c9, a0d297f
