---
phase: 14-knowledge-base-migration
plan: 02
subsystem: knowledge-base
tags: [kb-migration, gsd-home, symlink-bridge, installer, zero-data-loss]
requires:
  - phase: 14-01
    provides: "All source files reference ~/.gsd/knowledge/ instead of ~/.claude/gsd-knowledge/"
  - phase: 13-path-abstraction-capability-matrix
    provides: "Two-pass path replacement and require.main guard in installer"
provides:
  - "getGsdHome() resolves GSD_HOME env var with fallback to ~/.gsd"
  - "migrateKB() copies data from ~/.claude/gsd-knowledge/ to ~/.gsd/knowledge/ with zero data loss"
  - "Backward-compatible symlink bridge at ~/.claude/gsd-knowledge/ for Claude runtime"
  - "Idempotent re-run detection (existing symlink skips migration)"
  - "17 new tests covering all migration scenarios"
affects: [15-codex-integration, 16-continuity-handoff]
tech-stack:
  added: []
  patterns: ["Copy-then-symlink migration with entry count verification"]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
key-decisions:
  - "migrateKB() runs once before per-runtime install loop via installAllRuntimes()"
  - "Symlink bridge only created when Claude runtime is in selectedRuntimes"
  - "Migration backup preserved at old_path.migration-backup for rollback safety"
  - "Entry count verification aborts migration if destination has fewer entries than source"
patterns-established:
  - "Copy-then-symlink: recursive copy, verify entry count, rename to backup, create symlink"
  - "HOME env override: tests use process.env.HOME to isolate os.homedir() from real filesystem"
duration: 3min
completed: 2026-02-11
---

# Phase 14 Plan 02: KB Migration Logic in Installer Summary

**Copy-then-symlink migration with entry count verification, GSD_HOME override, and 17 new tests**

## Performance
- **Duration:** 3 minutes
- **Tasks:** 2/2
- **Files modified:** 2

## Accomplishments
- Added getGsdHome() with GSD_HOME env var support and tilde expansion
- Added countKBEntries() to count .md files across signals/spikes/lessons subdirectories
- Added migrateKB() implementing full copy-then-symlink migration pattern:
  - Fresh install: creates ~/.gsd/knowledge/{signals,spikes,lessons}
  - Migration: copies old data, verifies entry count, renames to backup, creates symlink
  - Re-run: detects existing symlink, skips migration (idempotent)
  - Claude-only symlink: only creates backward-compatible symlink when Claude runtime selected
- Integrated migrateKB() into installAllRuntimes() before per-runtime loop
- Added 17 new tests covering all migration scenarios
- Full test suite passes: 87 tests pass, 4 e2e skipped (expected)

## Task Commits
1. **Task 1: Add getGsdHome() and migrateKB() to installer** - `c46ee15`
2. **Task 2: Add migration tests and verify full test suite** - `171679a`

## Files Created/Modified
- `bin/install.js` - Added getGsdHome(), countKBEntries(), migrateKB() functions; integrated into installAllRuntimes(); exported for testing
- `tests/unit/install.test.js` - Added 17 new tests: 3 getGsdHome, 4 countKBEntries, 7 migrateKB, 1 GSD_HOME override, 2 integration

## Decisions & Deviations

None - plan executed exactly as written.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- KB migration is fully functional: source files reference new path (Plan 01), installer migrates data (Plan 02)
- Phase 14 is complete: both plans delivered
- Phase 15 (Codex integration) can proceed knowing KB infrastructure is runtime-agnostic
- GSD_HOME environment variable is fully supported for custom KB locations
- All exports (getGsdHome, migrateKB, countKBEntries, replacePathsInContent) available for future testing
