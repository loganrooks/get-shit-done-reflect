---
phase: 29-test-fixes-installer-deploy
plan: 01
subsystem: testing
tags: [test-isolation, GSD_HOME, backlog-stats, node-test]
requires:
  - phase: 25-backlog-core
    provides: "backlog stats command and runGsdToolsWithEnv helper"
provides:
  - "GSD_HOME-isolated backlog stats tests that pass regardless of global ~/.gsd/backlog/items/ content"
  - "Full green test suite: 256 tests across 3 runners with 0 failures"
affects: [get-shit-done/bin/gsd-tools.test.js]
tech-stack:
  added: []
  patterns: [GSD_HOME env isolation for global backlog dir]
key-files:
  created: []
  modified: [get-shit-done/bin/gsd-tools.test.js]
key-decisions:
  - "Only backlog stats tests need GSD_HOME isolation (stats merges local+global items; list/group/add operate on local only)"
duration: 4min
completed: 2026-02-23
---

# Phase 29 Plan 01: Fix Backlog Stats Test Isolation Summary

**GSD_HOME env override on 2 backlog stats tests eliminates global item pollution causing non-deterministic failures**

## Performance
- **Duration:** 4min
- **Tasks:** 3 completed (Task 0 RED baseline, Task 1 GREEN fix, Task 2 full suite verification)
- **Files modified:** 1

## Accomplishments
- Confirmed exactly 2 test failures caused by 1 real item in ~/.gsd/backlog/items/ polluting backlog stats aggregation
- Changed 2 `runGsdTools('backlog stats')` calls to `runGsdToolsWithEnv` with `GSD_HOME` pointing to nonexistent path
- Verified all 3 test suites pass: gsd-tools.test.js (163), install.test.js (73), wiring-validation.test.js (20) = 256 total, 0 failures
- Audited all 28 `runGsdTools('backlog ...')` calls; confirmed only `backlog stats` needs isolation (only command merging local+global items)

## Task Commits
1. **Task 0: RED baseline** - No commit (confirmation only, no file changes)
2. **Task 1: GREEN fix** - `1e89120`
3. **Task 2: Full suite verification** - No commit (verification only, no file changes)

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.test.js` - Changed lines 3280 and 3292 from `runGsdTools` to `runGsdToolsWithEnv` with GSD_HOME isolation

## Deviations from Plan

None - plan executed exactly as written.

## Decisions & Deviations
- Only `backlog stats` tests need GSD_HOME isolation. Audit confirmed `backlog list`, `backlog group`, `backlog add`, `backlog promote`, and `backlog index` all operate on local items only (or pass explicit `isGlobal` flag) and do not aggregate from `~/.gsd/backlog/items/`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Test suite is fully green, ready for Plan 02 (installer deployment)

## Self-Check: PASSED
- FOUND: get-shit-done/bin/gsd-tools.test.js
- FOUND: 29-01-SUMMARY.md
- FOUND: commit 1e89120
