---
phase: 41-health-score-automation
plan: 02
subsystem: health-check
tags: [health-probe, signal-metrics, signal-density, automation-watchdog, probe-executor]
requires:
  - phase: 41-01
    provides: 6 infrastructure probe files with YAML frontmatter contract, health-scoring.md reference, feature-manifest config schema
provides:
  - health-probe subcommand in gsd-tools.js with signal-metrics, signal-density, automation-watchdog sub-subcommands
  - Generic probe discovery/execution workflow replacing monolithic category executor
  - 3 workflow-dimension probe definition files (subcommand execution type)
  - Reduced health-check.md reference (output format and repair rules only)
  - UNMEASURED workflow dimension handling for dependency-gated probe failures
affects: [health-check-workflow, health-check-reference, session-start-hooks, fork-divergences]
tech-stack:
  added: []
  patterns: [probe-discovery-execution, regime-aware-signal-analysis, subcommand-probe-type]
key-files:
  created:
    - get-shit-done/references/health-probes/signal-metrics.md
    - get-shit-done/references/health-probes/signal-density.md
    - get-shit-done/references/health-probes/automation-watchdog.md
  modified:
    - get-shit-done/bin/gsd-tools.js
    - get-shit-done/workflows/health-check.md
    - get-shit-done/references/health-check.md
    - .planning/FORK-DIVERGENCES.md
    - tests/unit/install.test.js
key-decisions:
  - "Regime boundary resolution: no regime_change entries means all signal history is one regime"
  - "Signal density trend requires 3+ phases for non-stable determination"
  - "Automation watchdog uses 3x expected cadence as stale threshold"
patterns-established:
  - "Subcommand probe type: probes that delegate to gsd-tools.js health-probe for complex computation"
  - "Regime-aware analysis: signal analysis scoped to current observation regime boundaries"
duration: 9min
completed: 2026-03-06
---

# Phase 41 Plan 02: Health Probe Subcommand and Workflow Refactor Summary

**Regime-aware health-probe subcommand (signal-metrics, signal-density, automation-watchdog) with generic probe discovery/execution workflow replacing monolithic category executor**

## Performance
- **Duration:** 9min
- **Tasks:** 2/2 completed
- **Files modified:** 8

## Accomplishments
- Added `health-probe` top-level case to gsd-tools.js with three sub-subcommands: signal-metrics (HEALTH-08) computes signal-to-resolution ratio within current observation regime, signal-density (HEALTH-09) tracks per-phase signal accumulation trend, automation-watchdog (HEALTH-07) verifies automation features fire at expected cadence
- Refactored health-check workflow from monolithic 250-line category executor to generic probe discovery/execution system with dynamic probe scanning, tier/focus filtering, dependency-ordered execution, and UNMEASURED workflow dimension handling
- Reduced health-check.md reference from 497 to 200 lines by removing check definitions (now in probe files) while preserving output format, repair rules, signal integration, and configuration documentation
- Created 3 probe definition files with YAML frontmatter contract for subcommand-type probes

## Task Commits
1. **Task 1: Add health-probe subcommand to gsd-tools.js** - `c6c8210`
2. **Task 2: Refactor health-check workflow to generic probe executor** - `4808e7a`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added health-probe case with signal-metrics, signal-density, automation-watchdog sub-subcommands and shared helpers (resolveKBDir, findLatestRegimeChange, collectRegimeSignals)
- `get-shit-done/references/health-probes/signal-metrics.md` - Signal-to-resolution ratio probe definition (HEALTH-08)
- `get-shit-done/references/health-probes/signal-density.md` - Signal density trend probe definition (HEALTH-09)
- `get-shit-done/references/health-probes/automation-watchdog.md` - Automation timestamp watchdog probe definition (HEALTH-07)
- `get-shit-done/workflows/health-check.md` - Refactored to generic probe discovery/execution workflow
- `get-shit-done/references/health-check.md` - Reduced to output format, repair rules, signal integration
- `.planning/FORK-DIVERGENCES.md` - Updated Runtime section with health-probe case entry
- `tests/unit/install.test.js` - Updated OpenCode path rewriting test to reference probe file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated install test for health-check.md content change**
- **Found during:** Task 2 verification (npm test)
- **Issue:** Install test expected `$HOME/.gsd/knowledge` in health-check.md, but that content moved to probe files when Section 2 (shell patterns) was removed
- **Fix:** Updated test to read `kb-integrity.md` probe file instead, which contains the same `$HOME/.gsd/knowledge` paths
- **Files modified:** `tests/unit/install.test.js`
- **Commit:** `4808e7a` (included in Task 2 commit)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Plan 03 (session-start hooks and reactive triggers) can now consume:
- Health-probe subcommand for computing complex health metrics during session-start hooks
- Generic probe executor workflow for running health checks triggered by reactive thresholds
- 9 total probe files (6 infrastructure + 3 subcommand) for comprehensive workspace health assessment
- Cleanup marker step (`gsd-health-check-needed`) for statusline H? indicator lifecycle

## Self-Check: PASSED
