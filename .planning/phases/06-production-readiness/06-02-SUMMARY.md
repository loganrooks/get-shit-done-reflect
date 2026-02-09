---
phase: 06-production-readiness
plan: 02
subsystem: infra
tags: version-migration, hooks, config, onboarding

# Dependency graph
requires:
  - phase: 00-deployment-infrastructure
    provides: Hook system (gsd-check-update.js pattern), build-hooks.js, install.js
provides:
  - Version migration reference specification
  - SessionStart version check hook (gsd-version-check.js)
  - Explicit upgrade-project command
  - Updated config template with gsd_reflect_version, health_check, devops fields
affects: [06-01-health-check, 06-03-devops-init, future-version-bumps]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Additive-only migration: new config fields with defaults, never remove"
    - "Background version check hook pattern (spawn + cache + unref)"
    - "Mini-onboarding: prompt for new feature preferences during migration"

key-files:
  created:
    - get-shit-done/references/version-migration.md
    - hooks/gsd-version-check.js
    - commands/gsd/upgrade-project.md
  modified:
    - get-shit-done/templates/config.json
    - scripts/build-hooks.js
    - bin/install.js

key-decisions:
  - "Hook detects only, does not migrate -- cache result for consumers"
  - "Migration rules are always additive (never remove or modify existing values)"
  - "gsd_reflect_version updated LAST to enable partial migration retry"
  - "Version check hook registered as separate SessionStart entry (not combined with update check)"

patterns-established:
  - "Version migration pattern: detect via hook cache, migrate via command, log to migration-log.md"
  - "Config template extension: new fields added at end of JSON object with backward-compatible defaults"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 6 Plan 2: Version Migration Summary

**Additive version migration system with SessionStart auto-detect hook, explicit upgrade-project command, and config template extension for gsd_reflect_version/health_check/devops fields**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T19:40:23Z
- **Completed:** 2026-02-09T19:44:27Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created comprehensive version-migration reference specification (213 lines, 7 sections) covering version detection, additive migration rules, mini-onboarding, migration log format, auto-detect mechanism, and error handling
- Built SessionStart hook (gsd-version-check.js) following the exact gsd-check-update.js pattern: background spawn, cache write to ~/.claude/cache/, non-blocking, local file reads only
- Created upgrade-project command for explicit migration with interactive mini-onboarding or YOLO silent defaults
- Extended config template with gsd_reflect_version, health_check, and devops sections while preserving all existing fields
- Registered new hook in build-hooks.js and install.js (both install and uninstall paths)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create version-migration reference and update config template** - `46f679c` (feat)
2. **Task 2: Create version check hook and upgrade-project command** - `6dacecd` (feat)

## Files Created/Modified
- `get-shit-done/references/version-migration.md` - Authoritative migration specification (version detection, rules, mini-onboarding, log format, auto-detect, error handling)
- `get-shit-done/templates/config.json` - Updated template with gsd_reflect_version, health_check, devops fields
- `hooks/gsd-version-check.js` - SessionStart hook comparing installed vs project version, writes cache
- `commands/gsd/upgrade-project.md` - Explicit migration command with mini-onboarding
- `scripts/build-hooks.js` - Added gsd-version-check.js to hooks list
- `bin/install.js` - Hook registration (install) and cleanup (uninstall) for version check

## Decisions Made
- Hook writes to cache only -- does not trigger migration directly. Consumers (health-check, upgrade-project) read cache and act. This keeps the hook non-intrusive and sub-millisecond.
- `gsd_reflect_version` field is updated LAST during migration, so partial migrations are retried on next run (fields already added won't be re-added due to existence checks).
- Version check hook registered as a separate SessionStart entry (not combined into the update check entry) for clean separation of concerns.
- Install.js updated to handle version-check hook in both install and uninstall paths, including the orphan filter for settings cleanup.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated install.js and build-hooks.js for hook registration**
- **Found during:** Task 2
- **Issue:** The plan noted "hook needs to be added to esbuild config in scripts/build-hooks.js" but also needed install.js registration (SessionStart hook setup) and uninstall cleanup to be functional
- **Fix:** Added hook to build-hooks.js HOOKS_TO_COPY array, added versionCheckCommand construction and SessionStart registration in install.js, added hook to uninstall cleanup list and settings filter
- **Files modified:** scripts/build-hooks.js, bin/install.js
- **Verification:** grep confirms hook registered in all paths
- **Committed in:** 6dacecd (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for the hook to actually be installed and cleaned up properly. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Version migration system is complete and ready for use
- Health check (06-01) can now read version-check cache to report version mismatches
- DevOps init (06-03) will populate the devops config section added here
- Config template ready for new projects with all Phase 6 fields

---
*Phase: 06-production-readiness*
*Completed: 2026-02-09*
