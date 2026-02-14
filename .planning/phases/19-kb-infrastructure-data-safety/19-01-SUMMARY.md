---
phase: 19-kb-infrastructure-data-safety
plan: 01
subsystem: infra
tags: [kb-scripts, installer, runtime-agnostic, bash, path-migration]

# Dependency graph
requires:
  - phase: 14-runtime-agnostic-kb
    provides: "KB at ~/.gsd/knowledge/ with installer migration"
provides:
  - "installKBScripts() function in bin/install.js"
  - "KB scripts installed to ~/.gsd/bin/ on every install"
  - "All workflow/agent path references updated to ~/.gsd/bin/"
affects: [20-runtime-portability, 21-workflow-refinements]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "KB scripts copied from source repo to ~/.gsd/bin/ during install"
    - "installKBScripts() runs once globally before per-runtime loop"

key-files:
  created: []
  modified:
    - bin/install.js
    - get-shit-done/workflows/signal.md
    - get-shit-done/workflows/reflect.md
    - get-shit-done/workflows/health-check.md
    - get-shit-done/references/spike-execution.md
    - get-shit-done/references/reflection-patterns.md
    - .claude/agents/gsd-signal-collector.md
    - .claude/agents/gsd-spike-runner.md
    - .claude/agents/gsd-reflector.md
    - tests/integration/kb-infrastructure.test.js

key-decisions:
  - "KB scripts copied to ~/.gsd/bin/ (not symlinked) for portability"
  - "Source scripts remain in .claude/agents/ as source of truth"
  - "installKBScripts() runs after migrateKB() in installAllRuntimes()"

patterns-established:
  - "Runtime-agnostic script path: ~/.gsd/bin/ for all KB management scripts"

# Metrics
duration: 4min
completed: 2026-02-14
---

# Phase 19 Plan 01: KB Script Installation & Path Migration Summary

**installKBScripts() copies kb-rebuild-index.sh and kb-create-dirs.sh to ~/.gsd/bin/ with all 15 path references updated across workflows, agent specs, and local-install copies**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-14T20:43:15Z
- **Completed:** 2026-02-14T20:47:37Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Added installKBScripts(gsdHome) function to bin/install.js that copies KB scripts to ~/.gsd/bin/ with executable permissions
- Updated all 15 path references from ~/.claude/agents/ and ./.claude/agents/ to ~/.gsd/bin/ across 14 files
- Added 5 new tests for KB script installation covering directory creation, file copying, permissions, and idempotency

## Task Commits

Each task was committed atomically:

1. **Task 1: Add installKBScripts() to installer and update all path references** - `1a79aea` (feat)
2. **Task 2: Add tests for KB script installation** - `28c9942` (test)

## Files Created/Modified
- `bin/install.js` - Added installKBScripts() function and wired into installAllRuntimes(), exported for testing
- `get-shit-done/workflows/signal.md` - Updated KB script path to ~/.gsd/bin/
- `get-shit-done/workflows/reflect.md` - Updated KB script path to ~/.gsd/bin/
- `get-shit-done/workflows/health-check.md` - Updated 2 KB script path references to ~/.gsd/bin/
- `get-shit-done/references/spike-execution.md` - Updated KB script path to ~/.gsd/bin/
- `get-shit-done/references/reflection-patterns.md` - Updated KB script path to ~/.gsd/bin/
- `.claude/agents/gsd-signal-collector.md` - Updated KB script path to ~/.gsd/bin/
- `.claude/agents/gsd-spike-runner.md` - Updated KB script path to ~/.gsd/bin/
- `.claude/agents/gsd-reflector.md` - Updated KB script path to ~/.gsd/bin/
- `tests/integration/kb-infrastructure.test.js` - Added 5 tests for installKBScripts()

## Decisions Made
- KB scripts copied (not symlinked) to ~/.gsd/bin/ for maximum portability across platforms
- Source scripts remain in .claude/agents/ as the source of truth; installer copies on every install
- installKBScripts() runs once globally after migrateKB() before the per-runtime loop, matching migrateKB's pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- KB scripts now installable to ~/.gsd/bin/ for all runtimes
- All workflow and agent references point to runtime-agnostic path
- Ready for Phase 20 (Runtime Portability) and Phase 21 (Workflow Refinements)

---
*Phase: 19-kb-infrastructure-data-safety*
*Completed: 2026-02-14*
