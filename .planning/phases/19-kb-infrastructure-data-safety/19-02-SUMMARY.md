---
phase: 19-kb-infrastructure-data-safety
plan: 02
subsystem: infra
tags: [kb-backup, provenance, gsd-version, data-safety, templates]

# Dependency graph
requires:
  - phase: 19-kb-infrastructure-data-safety
    plan: 01
    provides: "installKBScripts() and KB path migration"
  - phase: 16-cross-runtime-continuity
    provides: "Signal template with runtime/model fields"
provides:
  - "Pre-migration backup with verification in migrateKB()"
  - "gsd_version field on all 3 KB entry templates"
  - "runtime/model provenance fields on spike and lesson templates"
  - "Provenance fields documented in common base schema"
  - "Version detection instructions in all 3 KB-writing agent specs"
affects: [20-runtime-portability, 21-workflow-refinements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Timestamped backup before destructive KB operations"
    - "Provenance fields (runtime, model, gsd_version) as common base schema"

key-files:
  created: []
  modified:
    - bin/install.js
    - .claude/agents/kb-templates/signal.md
    - .claude/agents/kb-templates/spike.md
    - .claude/agents/kb-templates/lesson.md
    - .claude/agents/knowledge-store.md
    - .claude/agents/gsd-signal-collector.md
    - .claude/agents/gsd-spike-runner.md
    - .claude/agents/gsd-reflector.md
    - tests/integration/kb-infrastructure.test.js

key-decisions:
  - "Backup uses knowledge.backup-YYYY-MM-DDTHHMMSS naming (ISO timestamp with colons/periods replaced by hyphens)"
  - "Backup integrity verified by entry count comparison; migration aborts if backup incomplete"
  - "Old backups not auto-cleaned; accumulate for manual cleanup"
  - "runtime/model moved from signal-only extensions to common base schema in knowledge-store.md"
  - "All provenance fields optional for backward compatibility"
  - "gsd_version read from VERSION file with config.json fallback"

patterns-established:
  - "Pre-migration backup: safety net before any KB data operations"
  - "Provenance tracking: runtime + model + gsd_version on all KB entry types"

# Metrics
duration: 4min
completed: 2026-02-14
---

# Phase 19 Plan 02: Pre-Migration Backup & Provenance Fields Summary

**Timestamped pre-migration backup in migrateKB() with integrity verification, plus gsd_version/runtime/model provenance fields on all KB entry types with schema and agent spec updates**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-14T20:49:22Z
- **Completed:** 2026-02-14T20:53:11Z
- **Tasks:** 3
- **Files modified:** 9

## Accomplishments
- Added pre-migration backup to migrateKB() that creates timestamped copy of ~/.gsd/knowledge/ before any operations
- Backup integrity verified by comparing entry counts; migration aborts if backup is incomplete
- Added gsd_version field to all 3 KB templates (signal, spike, lesson)
- Added runtime and model fields to spike and lesson templates (signals already had them)
- Moved runtime/model from signal-only extensions to common base schema in knowledge-store.md
- Added provenance field documentation (runtime, model, gsd_version) to common base schema
- Added version detection instructions to all 3 KB-writing agent specs
- 8 new tests covering backup (creation, preservation, skip-empty, skip-missing) and provenance fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Add pre-migration backup with verification to migrateKB()** - `1a8c992` (feat)
2. **Task 2: Add gsd_version and provenance fields to KB templates, schema, and agent specs** - `a539ba2` (feat)
3. **Task 3: Add tests for pre-migration backup and provenance fields** - `d5e999c` (test)

## Files Created/Modified
- `bin/install.js` - Added pre-migration backup logic at top of migrateKB()
- `.claude/agents/kb-templates/signal.md` - Added gsd_version field
- `.claude/agents/kb-templates/spike.md` - Added runtime, model, gsd_version fields
- `.claude/agents/kb-templates/lesson.md` - Added runtime, model, gsd_version fields
- `.claude/agents/knowledge-store.md` - Provenance fields in common base schema; runtime/model removed from signal-only extensions
- `.claude/agents/gsd-signal-collector.md` - Added provenance field instructions with version detection
- `.claude/agents/gsd-spike-runner.md` - Added provenance field instructions with version detection
- `.claude/agents/gsd-reflector.md` - Added provenance field instructions with version detection
- `tests/integration/kb-infrastructure.test.js` - 8 new tests for backup and provenance (27 total)

## Decisions & Deviations

### Decisions Made
- Backup uses `knowledge.backup-YYYY-MM-DDTHHMMSS` naming pattern with ISO timestamp sanitized for filesystem safety
- Backup integrity verified by entry count comparison; migration aborts if backup fails verification
- Old backups intentionally not auto-cleaned to maximize safety
- runtime/model promoted from signal-only to common base schema since all types now carry these fields
- All provenance fields remain optional for backward compatibility with existing entries
- gsd_version sourced from VERSION file with config.json `gsd_reflect_version` as fallback

### Deviations from Plan

**1. [Rule 1 - Bug] Fixed migrateKB test isolation with runtimes parameter**
- **Found during:** Task 3
- **Issue:** Tests passing `['claude']` as runtimes parameter caused migrateKB to attempt symlink creation at real `~/.claude/gsd-knowledge` path (hardcoded `os.homedir()`), failing with EEXIST on machines where that symlink already exists
- **Fix:** Changed test calls to use `migrateKB(tmpdir, [])` to avoid Claude symlink creation, since backup tests only need to exercise the backup logic
- **Files modified:** tests/integration/kb-infrastructure.test.js

## Issues Encountered

None beyond the test isolation fix documented above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Pre-migration backup ensures data safety for any future KB migrations
- All KB entry types now carry consistent provenance fields
- All agent specs include version detection instructions
- 27 tests passing for KB infrastructure
- Ready for Phase 20 (Runtime Portability) and Phase 21 (Workflow Refinements)

---
*Phase: 19-kb-infrastructure-data-safety*
*Completed: 2026-02-14*
