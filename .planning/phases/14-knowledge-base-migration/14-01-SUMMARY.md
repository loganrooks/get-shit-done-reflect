---
phase: 14-knowledge-base-migration
plan: 01
subsystem: knowledge-base
tags: [kb-paths, gsd-home, path-migration, runtime-agnostic]
requires:
  - phase: 13-path-abstraction-capability-matrix
    provides: "Two-pass path replacement architecture in installer"
provides:
  - "All source files reference ~/.gsd/knowledge/ instead of ~/.claude/gsd-knowledge/"
  - "Shell scripts support GSD_HOME override via ${GSD_HOME:-$HOME/.gsd}/knowledge"
  - "All test files updated to match new path structure"
  - "Installer Pass 1 regex preserved as safety guard for legacy paths"
affects: [14-02 installer migration logic, 15-codex-integration]
tech-stack:
  added: []
  patterns: ["GSD_HOME env var override in shell scripts"]
key-files:
  created: []
  modified:
    - get-shit-done/references/knowledge-surfacing.md
    - get-shit-done/references/signal-detection.md
    - get-shit-done/references/health-check.md
    - get-shit-done/references/spike-execution.md
    - get-shit-done/references/reflection-patterns.md
    - get-shit-done/workflows/health-check.md
    - get-shit-done/workflows/collect-signals.md
    - get-shit-done/workflows/reflect.md
    - get-shit-done/workflows/signal.md
    - .claude/agents/gsd-signal-collector.md
    - .claude/agents/gsd-debugger.md
    - .claude/agents/gsd-phase-researcher.md
    - .claude/agents/gsd-reflector.md
    - .claude/agents/knowledge-store.md
    - .claude/agents/gsd-executor.md
    - .claude/agents/gsd-planner.md
    - .claude/agents/gsd-spike-runner.md
    - .claude/agents/kb-create-dirs.sh
    - .claude/agents/kb-rebuild-index.sh
    - .claude/agents/kb-templates/spike-decision.md
    - tests/unit/install.test.js
    - tests/integration/kb-infrastructure.test.js
    - tests/integration/kb-write.test.js
    - tests/e2e/real-agent.test.js
    - tests/smoke/run-smoke.sh
    - tests/benchmarks/tasks/standard-signal.js
key-decisions:
  - "Source files now use ~/.gsd/knowledge/ making installer Pass 1 a no-op safety guard"
  - "Shell scripts use ${GSD_HOME:-$HOME/.gsd}/knowledge for env var override"
  - "Markdown prose uses $HOME/.gsd/knowledge without GSD_HOME (power-user feature documented elsewhere)"
  - "Legacy safety guard tests preserved in install.test.js to validate Pass 1 still works on old paths"
patterns-established:
  - "GSD_HOME override: Shell scripts use ${GSD_HOME:-$HOME/.gsd}/knowledge for configurable KB location"
duration: 8min
completed: 2026-02-11
---

# Phase 14 Plan 01: KB Path Migration in Source Files Summary

**Migrated 26 files from ~/.claude/gsd-knowledge/ to ~/.gsd/knowledge/ with GSD_HOME shell override support**

## Performance
- **Duration:** 8 minutes
- **Tasks:** 2/2
- **Files modified:** 26

## Accomplishments
- Updated all 9 get-shit-done/ reference and workflow files (32 tilde-variant occurrences, 5 $HOME-variant occurrences)
- Updated all 11 .claude/agents/ spec files, shell scripts, and templates (22 tilde-variant occurrences, 2 $HOME-variant occurrences with GSD_HOME)
- Updated all 6 test files with new path structure
- Added no-op and legacy safety guard test cases to install.test.js
- Full test suite passes: 70 tests pass, 4 e2e skipped (expected)

## Task Commits
1. **Task 1: Update all get-shit-done/ and .claude/agents/ source files** - `5229eb1`
2. **Task 2: Update all test files and verify test suite passes** - `ea9c715`

## Files Created/Modified

### Source files (Task 1 - 20 files)
- `get-shit-done/references/knowledge-surfacing.md` - 10 path references updated
- `get-shit-done/references/signal-detection.md` - 2 path references updated
- `get-shit-done/references/health-check.md` - 3 tilde + 1 $HOME reference updated
- `get-shit-done/references/spike-execution.md` - 1 path reference updated
- `get-shit-done/references/reflection-patterns.md` - 4 tilde + 1 $HOME reference updated
- `get-shit-done/workflows/health-check.md` - 1 path reference updated
- `get-shit-done/workflows/collect-signals.md` - 3 path references updated
- `get-shit-done/workflows/reflect.md` - 3 tilde + 1 $HOME reference updated
- `get-shit-done/workflows/signal.md` - 5 path references updated
- `.claude/agents/gsd-signal-collector.md` - 5 path references updated
- `.claude/agents/gsd-debugger.md` - 3 path references updated
- `.claude/agents/gsd-phase-researcher.md` - 3 path references updated
- `.claude/agents/gsd-reflector.md` - 3 path references updated
- `.claude/agents/knowledge-store.md` - 3 path references updated
- `.claude/agents/gsd-executor.md` - 2 path references updated
- `.claude/agents/gsd-planner.md` - 1 path reference updated
- `.claude/agents/gsd-spike-runner.md` - 1 path reference updated
- `.claude/agents/kb-create-dirs.sh` - KB_DIR now uses ${GSD_HOME:-$HOME/.gsd}/knowledge
- `.claude/agents/kb-rebuild-index.sh` - KB_DIR now uses ${GSD_HOME:-$HOME/.gsd}/knowledge
- `.claude/agents/kb-templates/spike-decision.md` - 1 path reference updated

### Test files (Task 2 - 6 files)
- `tests/unit/install.test.js` - Updated test inputs for migrated paths; added no-op and legacy safety guard tests
- `tests/integration/kb-infrastructure.test.js` - 14 path references updated (.claude/gsd-knowledge -> .gsd/knowledge)
- `tests/integration/kb-write.test.js` - 7 path references updated (gsd-knowledge -> .gsd/knowledge)
- `tests/e2e/real-agent.test.js` - 1 path reference updated
- `tests/smoke/run-smoke.sh` - 8 path references updated (tilde + $HOME variants)
- `tests/benchmarks/tasks/standard-signal.js` - 1 path reference updated

## Decisions & Deviations

None - plan executed exactly as written.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All source files now reference ~/.gsd/knowledge/ (canonical runtime-agnostic path)
- Installer Pass 1 regex preserved as safety guard for any remaining legacy references
- Plan 02 can now add migration logic to the installer knowing source files are already correct
- Shell scripts support GSD_HOME environment variable for custom KB locations
