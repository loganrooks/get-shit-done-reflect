---
phase: 06-production-readiness
plan: 01
subsystem: infra
tags: [health-check, workspace-validation, kb-integrity, config-validation, stale-artifacts]

# Dependency graph
requires:
  - phase: 01-knowledge-store
    provides: KB directory structure, index format, entry schemas
  - phase: 02-signal-collector
    provides: Signal detection reference, collect-signals command pattern
provides:
  - Health check reference specification with 5 check categories
  - Health check workflow for workspace validation orchestration
  - /gsd:health-check command for user-facing workspace validation
affects: [06-02-version-migration, 06-03-devops-init, reflection-engine]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tiered check execution (default/full/focused) mirroring benchmark tiers"
    - "Mechanical checks only (binary pass/fail, no subjective assessment)"
    - "Categorized checklist output format with pass/warning/fail per category"
    - "Repair rules differentiated by YOLO/interactive autonomy mode"

key-files:
  created:
    - get-shit-done/references/health-check.md
    - get-shit-done/workflows/health-check.md
    - commands/gsd/health-check.md
  modified: []

key-decisions:
  - "Health check output uses hybrid categorized checklist format (pass/warning/fail per category)"
  - "Thin routing command delegates entirely to workflow (established pattern)"
  - "Checks are purely mechanical -- no subjective quality assessment"
  - "Signal integration allows health findings to feed reflection engine"
  - "Repair actions differentiated: repairable (auto or prompted) vs non-repairable (report only)"

patterns-established:
  - "Health check tiered execution: default (KB, config, stale), full (+ planning, drift), focused (single category)"
  - "Category-level status: PASS (all pass), WARNING (no fails), FAIL (any fail)"
  - "Early termination: skip dependent checks when prerequisite fails"

# Metrics
duration: 4min
completed: 2026-02-09
---

# Phase 6 Plan 1: Health Check Foundation Summary

**Workspace health-check command with 5 check categories, tiered execution modes, repair rules, and signal integration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-09T19:39:06Z
- **Completed:** 2026-02-09T19:43:06Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- Reference specification defining all health check behavior: 5 check categories (KB Integrity, Config Validity, Stale Artifacts, Planning Consistency, Config Drift) with shell patterns for each
- Workflow with full orchestration flow: argument parsing, config loading, scope determination, check execution, reporting, repair, and signal integration
- Thin routing command following the established collect-signals.md pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Create health-check reference specification** - `2a83441` (feat)
2. **Task 2: Create health-check workflow and command** - `a5008a5` (feat)

## Files Created/Modified
- `get-shit-done/references/health-check.md` - Authoritative reference defining all checks, thresholds, output format, repair rules, signal integration, and configuration (444 lines)
- `get-shit-done/workflows/health-check.md` - Orchestration logic with 9-step process flow (248 lines)
- `commands/gsd/health-check.md` - Thin routing command with YAML frontmatter and flag documentation (46 lines)

## Decisions Made
- Health check output uses hybrid categorized checklist format with pass/warning/fail status per category and aggregated summary counts
- Command follows thin routing layer pattern -- delegates entirely to workflow (consistent with collect-signals.md, signal.md)
- All checks are purely mechanical: file existence, JSON parsability, count matching, timestamp comparison. No subjective assessment.
- Signal integration: health findings persist as signals (notable severity) enabling reflection engine to detect recurring workspace issues
- Repair actions split into repairable (KB index mismatch, missing config fields, orphaned files) and non-repairable (missing config.json, abandoned debug sessions, incomplete spikes)
- Early termination within categories: if prerequisite check fails (e.g., config exists), skip dependent checks

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Health check command ready for use via `/gsd:health-check`
- Reference specification available for version migration plan (06-02) to reference for config drift detection
- Signal integration enables reflection engine to detect recurring workspace issues
- Config fields documented: `health_check.frequency`, `health_check.stale_threshold_days`, `health_check.blocking_checks`

---
*Phase: 06-production-readiness*
*Completed: 2026-02-09*
