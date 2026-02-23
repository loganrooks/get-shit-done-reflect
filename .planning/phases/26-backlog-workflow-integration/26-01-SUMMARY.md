---
phase: 26-backlog-workflow-integration
plan: 01
subsystem: backlog
tags: [milestone, multi-status-filter, backlog, schema-extension]
requires:
  - phase: 25-backlog-system-core
    provides: "backlog CRUD commands, readBacklogItems, regenerateBacklogIndex, createBacklogItem helper"
provides:
  - "milestone field in backlog add/read/promote/update/index"
  - "comma-separated multi-status filter for backlog list"
  - "backward compatibility for pre-Phase-26 items without milestone field"
affects: [26-02-PLAN, 26-03-PLAN]
tech-stack:
  added: []
  patterns: [string-null-coercion-for-frontmatter]
key-files:
  created: []
  modified:
    - get-shit-done/bin/gsd-tools.js
    - get-shit-done/bin/gsd-tools.test.js
key-decisions:
  - "milestone stored as string 'null' in frontmatter (same pattern as promoted_to) to survive reconstructFrontmatter null-skipping"
  - "milestone coercion in readBacklogItems and regenerateBacklogIndex follows identical pattern to promoted_to"
  - "multi-status filter uses split(',').includes() for comma-separated values"
patterns-established:
  - "String-null frontmatter pattern: fields needing null representation in YAML use string 'null' and are coerced on read"
duration: 13min
completed: 2026-02-23
---

# Phase 26 Plan 01: Milestone Field + Multi-Status Filter Summary

**Milestone field across all backlog commands with string-null frontmatter pattern, plus comma-separated multi-status filtering for backlog list**

## Performance
- **Duration:** 13min
- **Tasks:** 2 (RED + GREEN, no REFACTOR needed)
- **Files modified:** 2

## Accomplishments
- Added `milestone` field to backlog schema (add, read, promote, update, index)
- Implemented `--milestone` flag for promote and update CLI commands
- Added Milestone column to backlog index table generation
- Enabled comma-separated `--status` values for multi-status filtering (e.g., `--status captured,triaged`)
- Maintained backward compatibility for pre-Phase-26 items without milestone field
- 14 new tests: 7 feature behaviors + 4 multi-case tests + 3 backward-compat tests
- Zero regressions on existing test suite

## Task Commits
1. **RED: 14 failing tests for milestone field and multi-status filter** - `e70340c`
2. **GREEN: implement milestone field and multi-status filter** - `edf01f6`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added milestone field to readBacklogItems, cmdBacklogAdd, cmdBacklogPromote, regenerateBacklogIndex; multi-status filter in cmdBacklogList; --milestone in CLI dispatch for promote and update
- `get-shit-done/bin/gsd-tools.test.js` - 14 new tests across 7 describe blocks; updated createBacklogItem helper with milestone field

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test assertions using --raw flag incorrectly**
- **Found during:** GREEN phase
- **Issue:** Tests used `--raw` flag then tried to JSON.parse the output; `--raw` causes plain-text output (count/id), not JSON
- **Fix:** Removed `--raw` from tests that need JSON output
- **Files modified:** get-shit-done/bin/gsd-tools.test.js
- **Commit:** edf01f6

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- milestone field available for BINT-02 (promote with milestone tracking)
- multi-status filter available for BINT-04 (workflow filtering for captured,triaged items)
- createBacklogItem helper updated for downstream test use

## Self-Check: PASSED
- Files: gsd-tools.js FOUND, gsd-tools.test.js FOUND, 26-01-SUMMARY.md FOUND
- Commits: e70340c FOUND, edf01f6 FOUND
- Tests: 14 new tests passing, 0 regressions (2 pre-existing backlog stats failures unchanged)
