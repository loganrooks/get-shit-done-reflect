---
phase: 40-signal-collection-automation
plan: 01
subsystem: automation
tags: [reentrancy, lockfile, regime-change, signal-collection, gsd-tools]
requires:
  - phase: 37-automation-framework
    provides: "resolve-level and track-event automation subcommands"
  - phase: 38.1-knowledge-base-infrastructure
    provides: "KB path fallback pattern (.planning/knowledge/ primary, ~/.gsd/ fallback)"
provides:
  - "automation lock/unlock/check-lock subcommands for reentrancy protection"
  - "automation regime-change subcommand for KB regime_change entries"
  - "auto_collect and reentrancy config fields in signal_collection manifest schema"
  - ".planning/.*.lock gitignore pattern"
affects: [signal-collection-automation, execute-phase-postlude]
tech-stack:
  added: []
  patterns: [lockfile-reentrancy, mtime-based-stale-detection, single-json-output]
key-files:
  created:
    - "tests/unit/automation.test.js (16 new tests)"
  modified:
    - "get-shit-done/bin/gsd-tools.js"
    - "get-shit-done/feature-manifest.json"
    - ".gitignore"
key-decisions:
  - "Lock stale detection uses file mtime comparison rather than timestamp in lock content"
  - "Single JSON output per lock invocation (stale + acquire combined) to avoid double-output bug"
  - "KB rebuild script runs from project cwd (not KB root) since script uses relative .planning/knowledge path"
patterns-established:
  - "Lockfile reentrancy: .planning/.{feature}.lock with mtime-based TTL staleness detection"
  - "Regime change entries: regime-{date}-{slug} ID format in KB signals directory"
duration: 8min
completed: 2026-03-06
---

# Phase 40 Plan 01: Reentrancy Lockfile and Regime Change CLI Primitives Summary

**Lockfile-based reentrancy guard with TTL stale detection plus regime_change KB entry writing as CLI primitives for execute-phase postlude**

## Performance
- **Duration:** 8min
- **Tasks:** 3/3 completed
- **Files modified:** 4

## Accomplishments
- Added three lockfile subcommands (lock, unlock, check-lock) with mtime-based stale detection and configurable TTL
- Added regime-change subcommand for writing regime_change entries to KB signals directory with proper frontmatter
- Added auto_collect boolean and reentrancy config object to signal_collection manifest schema
- Added .planning/.*.lock to .gitignore to prevent lockfiles in git status
- 16 new tests covering all lock/unlock/check-lock/regime-change behaviors (suite now 233 tests)

## Task Commits
1. **Task 1: Reentrancy lockfile commands and auto_collect manifest config** - `05d8150`
2. **Task 2: Regime change KB entry command** - `745f0f7`
3. **Task 3: Automated tests for lock/unlock/check-lock/regime-change** - `800a1da`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added cmdAutomationLock, cmdAutomationUnlock, cmdAutomationCheckLock, cmdAutomationRegimeChange functions and CLI routing
- `get-shit-done/feature-manifest.json` - Added auto_collect and reentrancy fields to signal_collection schema
- `.gitignore` - Added .planning/.*.lock pattern
- `tests/unit/automation.test.js` - 16 new tests for lock/unlock/check-lock/regime-change

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed KB rebuild script cwd**
- **Found during:** Task 2
- **Issue:** Initial implementation ran kb-rebuild-index.sh from KB root directory, but the script uses relative `.planning/knowledge` path detection from project cwd
- **Fix:** Changed execSync cwd from kbRoot to project cwd
- **Files modified:** get-shit-done/bin/gsd-tools.js
- **Commit:** 745f0f7

**2. [Rule 3 - Blocking] Test argument quoting for multi-word strings**
- **Found during:** Task 3
- **Issue:** Shell command string in test helper split multi-word arguments (e.g., "Auto-collection enabled") into separate argv entries
- **Fix:** Added quoting for arguments containing spaces in runAutomation helper
- **Files modified:** tests/unit/automation.test.js
- **Commit:** 800a1da

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
All CLI primitives needed by Plan 02 (execute-phase postlude integration) are available and tested:
- `automation lock <feature> --source <source> --ttl <seconds>` for reentrancy guard
- `automation unlock <feature>` for lock release
- `automation check-lock <feature> --ttl <seconds>` for read-only status check
- `automation regime-change <desc> --impact <impact> --prior <prior>` for KB entries
- `auto_collect` config field for enabling auto-collection per project

## Self-Check: PASSED
