---
phase: 07-fork-strategy-pre-merge-setup
plan: 01
subsystem: infra
tags: [fork-maintenance, divergence-tracking, merge-strategy, upstream-sync]

# Dependency graph
requires:
  - phase: none (first v1.13 execution plan)
    provides: N/A
provides:
  - FORK-STRATEGY.md -- authoritative fork maintenance reference
  - FORK-DIVERGENCES.md -- manifest of all 17 fork divergences
  - PROJECT.md update -- retired additive-only, adopted tracked-modifications
affects: [08-core-merge, future upstream syncs]

# Tech tracking
tech-stack:
  added: []
  patterns: [tracked-modifications fork strategy, categorized divergence manifest, merge-stance classification]

key-files:
  created:
    - .planning/FORK-STRATEGY.md
    - .planning/FORK-DIVERGENCES.md
  modified:
    - .planning/PROJECT.md

key-decisions:
  - "Tracked-modifications replaces additive-only constraint"
  - "Merge stance per file: fork wins, hybrid merge, case-by-case, or regenerate"
  - "Traditional git merge (not rebase) on dedicated sync branch"
  - "Conflict risk assessment: 3 HIGH, 4 MEDIUM, 9 LOW, 1 N/A"

patterns-established:
  - "Divergence manifest: categorized table with merge stance and conflict risk per file"
  - "Strategy document as living reference updated per sync cycle"

# Metrics
duration: 3min
completed: 2026-02-10
---

# Phase 7 Plan 01: Fork Strategy & Divergence Documentation Summary

**Tracked-modifications fork strategy with 17-file divergence manifest, conflict resolution runbook, and retired additive-only constraint**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-10T15:57:55Z
- **Completed:** 2026-02-10T16:00:56Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Created FORK-STRATEGY.md as a comprehensive, 10-section fork maintenance reference covering merge strategy, conflict resolution runbook, patch preservation adoption, sync cadence, and contingencies
- Created FORK-DIVERGENCES.md listing all 17 modified upstream files categorized by type (identity/commands/templates/build) with merge stance and conflict risk for each
- Formally retired the "additive only" fork constraint in PROJECT.md, replacing it with the tracked-modifications strategy and cross-references to the new documents

## Task Commits

Each task was committed atomically:

1. **Task 1: Create FORK-STRATEGY.md** - `2ea70fe` (docs)
2. **Task 2: Create FORK-DIVERGENCES.md** - `522e2ac` (docs)
3. **Task 3: Retire "additive only" constraint in PROJECT.md** - `a14b4b8` (docs)

## Files Created/Modified

- `.planning/FORK-STRATEGY.md` - Authoritative fork maintenance strategy (10 sections: fork relationship, tracked-modifications strategy, divergence management, merge strategy, conflict resolution runbook, patch preservation, sync cadence, merge decision log, review gate, contingencies)
- `.planning/FORK-DIVERGENCES.md` - Manifest of all 17 modified upstream files with category, rationale, merge stance, and conflict risk assessment
- `.planning/PROJECT.md` - Constraints section updated, Key Decisions table updated, last-updated line updated

## Decisions Made

- **Tracked-modifications over additive-only:** The fork has 17 modified upstream files; pretending they don't exist is no longer viable. Explicit tracking with merge stances gives Phase 8 a principled basis for conflict resolution.
- **Four divergence categories:** Identity, Commands, Templates, Build -- matches how merge decisions actually differ (identity files are fork-wins, commands are hybrid, templates are case-by-case).
- **Three conflict risk levels:** HIGH (3 files), MEDIUM (4 files), LOW (9 files) + N/A (1 file). Based on whether upstream also changed the same file significantly.
- **Traditional merge over rebase:** 145 fork commits + 17 modified files makes rebase painful; merge handles it in one operation.

## Deviations from Plan

None -- plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FORK-STRATEGY.md and FORK-DIVERGENCES.md are ready for Phase 8 (Core Merge) to reference during conflict resolution
- The Merge Decision Log table in FORK-STRATEGY.md is empty and will be populated during Phase 8 execution
- Plan 07-02 (pre-merge snapshot and sync branch setup) can proceed -- it depends on this plan's artifacts being in place

---
*Phase: 07-fork-strategy-pre-merge-setup*
*Completed: 2026-02-10*
