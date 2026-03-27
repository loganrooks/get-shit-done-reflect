---
phase: 49-config-migration
plan: 01
model: claude-opus-4-6
context_used_pct: 18
subsystem: manifest-migration
tags: [config, migration, rename, manifest, granularity]
requires:
  - phase: 48-modularization-verify
    provides: modularized manifest.cjs with cmdManifestApplyMigration
provides:
  - Declarative rename_field migration type in manifest migration system
  - depth-to-granularity migration entry in feature-manifest.json
  - Updated KNOWN_TOP_LEVEL_KEYS (granularity replaces depth)
  - field_renamed change type in formatMigrationEntry
affects: [49-02, 50-migration-test-hardening]
tech-stack:
  added: []
  patterns: [declarative-migration-entry, value-map-rename, both-keys-cleanup]
key-files:
  created: []
  modified:
    - get-shit-done/feature-manifest.json
    - get-shit-done/bin/lib/manifest.cjs
key-decisions:
  - "manifest_version bumped from 1 to 2 to signal migrations[] availability"
  - "Both-keys-present edge case handled by always deleting old key when it exists"
patterns-established:
  - "Declarative rename migration: migrations[] array entries drive field renames with optional value_map"
duration: 2min
completed: 2026-03-26
---

# Phase 49 Plan 01: Declarative Rename Migration Infrastructure Summary

**Declarative rename_field migration type with depth-to-granularity as first entry, including value_map transformation and both-keys-present cleanup**

## Performance
- **Duration:** 2min
- **Tasks:** 1/1
- **Files modified:** 2

## Accomplishments
- Added `migrations[]` array to feature-manifest.json with depth-to-granularity `rename_field` entry including `value_map` for old-to-new value conversion
- Bumped `manifest_version` from 1 to 2 to signal the new migrations capability
- Updated `KNOWN_TOP_LEVEL_KEYS` in manifest.cjs: replaced `depth` with `granularity`
- Added rename migration processing in `cmdManifestApplyMigration` with safe both-keys-present cleanup (always deletes old key when present)
- Added `field_renamed` change type handler in `formatMigrationEntry` for human-readable migration log output

## Task Commits
1. **Task 1: Add migrations[] array to feature-manifest.json and implement rename migration in manifest.cjs** - `2b7eba7`

## Files Created/Modified
- `get-shit-done/feature-manifest.json` - Added manifest_version: 2, migrations[] with rename_field entry
- `get-shit-done/bin/lib/manifest.cjs` - KNOWN_TOP_LEVEL_KEYS update, rename migration processing, field_renamed formatting

## Deviations from Plan

None - plan executed exactly as written.

## Decisions & Deviations
None - followed plan as specified.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Migration infrastructure is ready for 49-02 (test coverage for rename migrations)
- `cmdManifestApplyMigration` now processes declarative rename entries from the manifest
- Projects with stale `depth` key will be cleaned up when apply-migration runs

## Self-Check: PASSED
