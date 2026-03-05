---
phase: 39-ci-awareness
plan: 02
subsystem: hooks, statusline, installer
tags: [ci, hooks, statusline, session-start, installer, background-spawn]
requires:
  - phase: 39-ci-awareness
    plan: 01
    provides: "CI sensor agent spec (gsd-ci-sensor.md)"
provides:
  - "SessionStart hook (gsd-ci-status.js) for background CI status caching"
  - "Statusline red CI FAIL indicator from cached CI status"
  - "Installer hook registration and uninstall cleanup for gsd-ci-status"
affects: [hooks, statusline, installer]
tech-stack:
  patterns: [background-spawn-cache, cache-file-staleness, silent-degradation]
key-files:
  created: [hooks/gsd-ci-status.js]
  modified: [hooks/gsd-statusline.js, bin/install.js]
key-decisions:
  - "Background spawn + cache file pattern (matching gsd-check-update.js) -- session start never blocked"
  - "Cache staleness threshold: 1 hour (3600s) -- older cache ignored to prevent stale CI status"
  - "Only show CI FAIL for conclusion=failure, not cancelled/skipped/degraded"
  - "Silent degradation: no console output from hook, all communication via cache file"
patterns-established:
  - "CI status cache: background hook writes JSON cache, statusline reads it -- same pattern as update check"
duration: 4min
completed: 2026-03-05
---

# Phase 39 Plan 02: SessionStart Hook and CI Status Display Summary

**SessionStart hook for background CI status caching, statusline CI FAIL indicator, and installer hook registration/cleanup**

## Performance
- **Duration:** 4min
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- Created `hooks/gsd-ci-status.js` SessionStart hook that spawns background process to query CI status via `gh run list`
- Hook writes result to `~/.claude/cache/gsd-ci-status.json` with branch, latest_run, and checked timestamp
- Silent degradation: exits cleanly when gh CLI missing, writes degraded:true when auth fails
- Updated `hooks/gsd-statusline.js` with red "CI FAIL" indicator when cached CI status shows conclusion=failure
- Cache staleness check: only shows indicator if cache is less than 1 hour old
- Updated `bin/install.js` with hook registration (ciStatusCommand, hasGsdCiHook guard)
- Updated uninstall cleanup: gsd-ci-status.js in gsdHooks array AND gsd-ci-status in SessionStart filter
- Hook registered in settings.json as SessionStart hook (skipped for opencode)

## Task Commits
1. **Task 1: Create SessionStart hook for CI status caching** - `fff0bc9`
2. **Task 2: Wire statusline CI indicator and update installer** - `99af7b4`

## Files Created/Modified
- `hooks/gsd-ci-status.js` - New SessionStart hook with background spawn, pre-flight checks, cache writing
- `hooks/gsd-statusline.js` - Added ciStatus block reading cache, CI FAIL indicator in output lines
- `bin/install.js` - ciStatusCommand definition, hasGsdCiHook registration, uninstall cleanup (2 locations)

## Decisions & Deviations

### Decisions
- Matched exact background spawn pattern from gsd-check-update.js for consistency
- Timeouts: 3s (command check), 5s (auth), 10s (run list) -- proportional to expected latency
- Red ANSI color (\x1b[31m) for CI FAIL -- matches urgency level

### Deviations
None - plan executed as written.

## Self-Check: PASSED

- [x] `hooks/gsd-ci-status.js` syntax check passes
- [x] `hooks/gsd-statusline.js` syntax check passes
- [x] `bin/install.js` syntax check passes
- [x] `node bin/install.js --local` succeeds
- [x] `gsd-ci-status` registered in `.claude/settings.json`
- [x] `npm test` passes (214 tests, 0 failures)
- [x] Installer has gsd-ci-status in both gsdHooks array and SessionStart filter
