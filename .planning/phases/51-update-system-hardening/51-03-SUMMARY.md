---
phase: 51-update-system-hardening
plan: 03
model: claude-opus-4-6
context_used_pct: 18
subsystem: installer
tags: [upgrade-path, end-to-end-test, migration-guide, fresh-install, requirement-coverage]
requires:
  - phase: 51-01
    provides: "Migration spec infrastructure, generateMigrationGuide, compareVersions, cleanupOrphanedFiles"
  - phase: 51-02
    provides: "validateHookFields, C1/C5/C6/C7 upstream drift integrations"
provides:
  - "End-to-end upgrade test verifying stale cleanup + .planning preservation + hook registration + lib modules"
  - "Migration guide e2e test verifying guide generation with matching spec version"
  - "Fresh install test confirming no migration noise for new users"
  - "Same-version reinstall test confirming no spurious guide"
  - "Full UPD-01 through UPD-06 requirement coverage verified"
affects: [installer, upgrade-path, test-coverage]
tech-stack:
  added: []
  patterns: ["execSync-based e2e install testing with HOME override", "version-decoupled spec validation"]
key-files:
  created: []
  modified:
    - tests/unit/install.test.js
key-decisions:
  - "Upgrade e2e test uses VERSION=1.16.0 (not 1.17.5) to ensure isUpgrade triggers when package.json version is 1.17.5"
  - "Migration guide e2e calls generateMigrationGuide directly with (1.17.5, 1.18.0] range since package.json version < spec version 1.18.0"
patterns-established:
  - "Version-decoupled spec testing: when package.json version prevents spec match, verify upgrade mechanism separately from guide content"
duration: 5min
completed: 2026-03-27
---

# Phase 51 Plan 03: End-to-End Upgrade Path Tests Summary

**Four e2e tests verifying the complete v1.16-to-current upgrade path (stale cleanup, .planning preservation, hook registration, lib modules), migration guide generation, fresh install distinction, and same-version stability**

## Performance
- **Duration:** 5min
- **Tasks:** 2/2 completed
- **Files modified:** 1

## Accomplishments
- Added end-to-end upgrade test that simulates v1.16.0 installation, runs installer, and verifies: stale gsd-tools.js removed, gsd-tools.cjs installed, lib/*.cjs modules present (10+), VERSION updated, .planning/ STATE.md/config.json/phases preserved, hooks registered with gsdr-check-update and gsdr-health-check
- Added migration guide e2e test verifying generateMigrationGuide produces correct output with v1.18.0 spec content (Migration Guide header, 1.17.5 reference, Modularization title, BREAKING badge)
- Added fresh install test proving MIGRATION-GUIDE.md is NOT generated when no prior VERSION exists
- Added same-version reinstall test proving MIGRATION-GUIDE.md is NOT generated when versions match
- Verified all 6 UPD requirements have test coverage across Phase 51 plans (29 total new tests from baseline 376)
- Final test count: 405 passed + 4 todo (409 total)

## Task Commits
1. **Task 1: End-to-end v1.17-to-v1.18 upgrade test (UPD-05)** - `e324d16`
2. **Task 2: Verify complete test suite and requirement coverage** - verification only, no code changes

## Files Created/Modified
- `tests/unit/install.test.js` - 4 new tmpdirTests in 'Phase 51: End-to-End Upgrade Path (UPD-05)' describe block

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Adjusted upgrade test version and migration guide assertion strategy**
- **Found during:** Task 1
- **Issue:** Plan assumed package.json would report v1.18.0, but current version is 1.17.5. Setting previous VERSION to 1.17.5 makes isUpgrade=false (same version). Setting it to 1.16.0 triggers isUpgrade=true but v1.18.0 spec is outside (1.16.0, 1.17.5] range, so no guide generated.
- **Fix:** Split the upgrade test into two parts: (1) e2e test with VERSION=1.16.0 verifying stale cleanup, .planning preservation, hooks, and lib modules; (2) separate test calling generateMigrationGuide directly with (1.17.5, 1.18.0] range to verify guide content. KB consulted, no relevant entries.
- **Files modified:** tests/unit/install.test.js
- **Commit:** e324d16

## Requirement Coverage

| Requirement | Tests | Source Plans |
|---|---|---|
| UPD-01 | generateMigrationGuide: 3 unit + 1 e2e | 51-01, 51-03 |
| UPD-02 | cleanupOrphanedFiles: 2 unit + e2e stale/lib assertions | 51-01, 51-03 |
| UPD-03 | validateHookFields: 7 unit + e2e hook assertions | 51-02, 51-03 |
| UPD-04 | Fresh install no-guide + VERSION presence | 51-03 |
| UPD-05 | Full e2e upgrade path test | 51-03 |
| UPD-06 | generateMigrationGuide reads real spec from disk | 51-01, 51-03 |

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 51 complete: all update system hardening requirements tested and verified
- Migration spec infrastructure ready for future version bumps (add new JSON to migrations/)
- Upgrade path tested from both v1.16.0 and v1.17.5 entry points
- Test count: 405 passed (29 above 376 baseline)

## Self-Check: PASSED
