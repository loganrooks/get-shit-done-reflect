---
phase: 47-fork-module-extraction
plan: 01
model: claude-opus-4-6
context_used_pct: 45
subsystem: modularization
tags: [cjs, module-extraction, dead-code-removal, dispatcher-rewiring]
requires:
  - phase: 46-upstream-module-adoption
    provides: "11 upstream lib modules, core.cjs fork helpers, dispatcher pattern"
provides:
  - "sensors.cjs module (2 sensor commands)"
  - "backlog.cjs module (7 backlog commands + 3 helpers)"
  - "health-probe.cjs module (3 probe commands + 3 KB helpers)"
  - "Dead code removal of 4 duplicate frontmatter helpers from gsd-tools.cjs"
  - "cmdForkFrontmatterValidate updated to use frontmatter module"
affects: [47-fork-module-extraction, gsd-tools.cjs, installer]
tech-stack:
  added: []
  patterns: [fork-module-extraction, frontmatter-import-replacement]
key-files:
  created:
    - get-shit-done/bin/lib/sensors.cjs
    - get-shit-done/bin/lib/backlog.cjs
    - get-shit-done/bin/lib/health-probe.cjs
  modified:
    - get-shit-done/bin/gsd-tools.cjs
    - get-shit-done/bin/gsd-tools-fork.test.js
key-decisions:
  - "Backlog functions use frontmatter.extractFrontmatter() via module require, not bare calls to removed duplicates"
  - "Fork roundtrip test updated to require from frontmatter.cjs instead of regex-extracting from gsd-tools.cjs source"
patterns-established:
  - "Fork module extraction: copy functions verbatim, add require, rewire dispatcher, remove inline"
  - "Frontmatter import replacement: bare extractFrontmatter() -> frontmatter.extractFrontmatter()"
duration: 13min
completed: 2026-03-20
---

# Phase 47 Plan 01: Sensors/Backlog/Health-Probe Module Extraction Summary

**Extract 3 fork command groups (sensors, backlog, health-probe) into dedicated CJS modules with frontmatter import replacement and dead code removal**

## Performance
- **Duration:** 13min
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments
- Created sensors.cjs with cmdSensorsList and cmdSensorsBlindSpots (130 lines)
- Created backlog.cjs with 7 backlog commands + 3 private helpers (310 lines), replacing 6 bare extractFrontmatter and 3 bare reconstructFrontmatter calls with frontmatter module imports
- Created health-probe.cjs with 3 probe commands + 3 private KB helpers (370 lines)
- All 12 dispatcher calls rewired (2 sensors + 7 backlog + 3 health-probe) through module-qualified names
- Removed 4 duplicate frontmatter helpers (extractFrontmatter, reconstructFrontmatter, spliceFrontmatter, parseMustHavesBlock) from gsd-tools.cjs
- Updated cmdForkFrontmatterValidate to use frontmatter.extractFrontmatter(content)
- gsd-tools.cjs reduced from 3,200 to 1,239 lines (combined with parallel 47-02 execution)
- Installer deploys 16 lib modules (11 upstream + 5 fork)
- All 534 tests pass (350 vitest + 174 upstream + 10 fork)

## Task Commits
1. **Task 1: Create sensors.cjs, backlog.cjs, and health-probe.cjs modules** - `c62cc83`
2. **Task 2: Rewire dispatcher, remove dead code, verify tests** - `09b184a` (completed by parallel 47-02 executor which also handled manifest/automation dead code removal)

## Files Created/Modified
- `get-shit-done/bin/lib/sensors.cjs` - Sensor discovery and blind spot reporting (2 commands)
- `get-shit-done/bin/lib/backlog.cjs` - Backlog CRUD, grouping, promotion, index (7 commands + 3 helpers)
- `get-shit-done/bin/lib/health-probe.cjs` - Signal metrics, density, automation watchdog (3 commands + 3 helpers)
- `get-shit-done/bin/gsd-tools.cjs` - Dispatcher rewired, dead code removed (3200 -> 1239 lines)
- `get-shit-done/bin/gsd-tools-fork.test.js` - Roundtrip test updated to use frontmatter.cjs module

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated fork roundtrip test to use frontmatter module**
- **Found during:** Task 2 verification
- **Issue:** Fork test (gsd-tools-fork.test.js) extracted extractFrontmatter/reconstructFrontmatter/spliceFrontmatter from gsd-tools.cjs source via regex+eval. After dead code removal, regex returned null causing TypeError.
- **Fix:** Changed test to require functions from frontmatter.cjs module directly instead of regex extraction from gsd-tools.cjs
- **Files modified:** get-shit-done/bin/gsd-tools-fork.test.js
- **Commit:** 09b184a

### Execution Note

A parallel executor completed plan 47-02 (manifest.cjs and automation.cjs extraction) during this plan's execution. The 47-02 executor's Task 2 commit (09b184a) encompassed ALL dead code removal and dispatcher rewiring for all 5 modules, making this plan's Task 2 modifications redundant (git showed no diff). The combined result is correct: gsd-tools.cjs contains only fork init overrides, fork command overrides, and the CLI router.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- 5 fork modules extracted (sensors, backlog, health-probe, manifest, automation)
- gsd-tools.cjs is 1,239 lines (fork init overrides + fork command overrides + router)
- Ready for Phase 47 Plan 02 (manifest/automation extraction -- already completed by parallel executor)
- Ready for Phase 48 (fork init/command override extraction and module extension)

## Self-Check: PASSED
- All 3 created module files exist
- SUMMARY.md exists
- Both task commits (c62cc83, 09b184a) verified in git history
