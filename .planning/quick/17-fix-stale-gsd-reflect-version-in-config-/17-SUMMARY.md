---
phase: quick-17
plan: 01
subsystem: build-tooling
tags: [version-stamping, config-template, release-automation]
requires:
  - phase: none
    provides: n/a
provides:
  - Automated version stamping for config.json template
  - Release workflow integration for version consistency
affects: [release-workflow, npm-publish, installer]
tech-stack:
  added: []
  patterns: [prepublishOnly-chain, version-stamping]
key-files:
  created:
    - scripts/stamp-version.js
  modified:
    - get-shit-done/templates/config.json
    - package.json
    - get-shit-done/workflows/release.md
key-decisions:
  - "Stamp-version runs FIRST in prepublishOnly chain (before build:hooks) to ensure version is set before any other build steps"
patterns-established:
  - "Version stamping: single-source-of-truth pattern where package.json version propagates to config template automatically"
duration: 1min
completed: 2026-03-06
---

# Quick Task 17: Fix Stale gsd_reflect_version in Config Summary

**Automated version stamping script fixes stale config.json template (1.13.0 -> 1.16.0) and prevents future drift via prepublishOnly and release workflow integration**

## Performance
- **Duration:** 1min
- **Tasks:** 2 completed
- **Files modified:** 4

## Accomplishments
- Fixed stale gsd_reflect_version in config.json template (was 1.13.0, now 1.16.0)
- Created scripts/stamp-version.js that reads version from package.json and stamps it into the config template
- Wired stamp-version into prepublishOnly (runs before build:hooks)
- Updated release workflow Step 5 to run stamp-version after version bump
- Updated release workflow Step 7 to stage config.json in release commits

## Task Commits
1. **Task 1: Create stamp-version.js and wire into prepublishOnly** - `52411c9`
2. **Task 2: Add stamp-version step to release workflow** - `c78b1c8`

## Files Created/Modified
- `scripts/stamp-version.js` - New script that stamps package.json version into config template's gsd_reflect_version field
- `get-shit-done/templates/config.json` - Fixed stale version 1.13.0 -> 1.16.0
- `package.json` - prepublishOnly now runs stamp-version.js before build:hooks
- `get-shit-done/workflows/release.md` - Step 5 stamps config, Step 7 stages config.json

## Decisions & Deviations

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Verification Results
1. `node scripts/stamp-version.js` - reports "already up to date: 1.16.0"
2. Config template gsd_reflect_version - "1.16.0"
3. prepublishOnly - "node scripts/stamp-version.js && npm run build:hooks"
4. Release workflow references stamp-version - 1 match
5. Release workflow git add includes config.json - confirmed
6. npm test - 217 passed, 0 failed

## Self-Check: PASSED
