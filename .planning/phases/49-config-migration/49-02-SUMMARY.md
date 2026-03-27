---
phase: 49-config-migration
plan: 02
model: claude-opus-4-6
context_used_pct: 35
subsystem: config-migration
tags: [config, granularity, depth-rename, workflows, references, health-probes]
requires:
  - phase: 49-01
    provides: "rename_field migration type in feature-manifest.json and runtime migration in core.cjs/config.cjs"
provides:
  - "Zero config-field depth references in workflow/reference files"
  - "Shell grep in reflect.md searches for granularity"
  - "Spike sensitivity derivation uses granularity enum values"
  - "Health probe validates granularity with coarse/standard/fine"
  - "Controlled-exception mechanism documented in version-migration.md"
affects: [workflows, references, health-probes, version-migration]
tech-stack:
  added: []
  patterns: [controlled-exception-field-rename]
key-files:
  created: []
  modified:
    - get-shit-done/workflows/plan-phase.md
    - get-shit-done/workflows/reflect.md
    - get-shit-done/workflows/new-project.md
    - get-shit-done/workflows/run-spike.md
    - get-shit-done/templates/roadmap.md
    - get-shit-done/references/spike-integration.md
    - get-shit-done/references/milestone-reflection.md
    - get-shit-done/references/reflection-patterns.md
    - get-shit-done/references/spike-execution.md
    - get-shit-done/references/health-probes/config-validity.md
    - get-shit-done/references/version-migration.md
key-decisions:
  - "discovery-phase.md and discuss-phase.md correctly left unchanged -- their depth references are workflow parameters and content-depth concepts, not config fields"
  - "new-project.md AskUserQuestion header 'Depth' left unchanged -- UI label not a config field reference"
  - "version-migration.md historical example retains 'depth' as the old field name being documented"
duration: 5min
completed: 2026-03-27
---

# Phase 49 Plan 02: Workflow and Reference File Updates Summary

**Depth-to-granularity rename propagated across 11 markdown files with controlled-exception mechanism documented**

## Performance
- **Duration:** 5min
- **Tasks:** 2/2 completed
- **Files modified:** 11

## Accomplishments
- Updated 5 workflow/template files (plan-phase, reflect, new-project, run-spike, roadmap template) from depth to granularity terminology
- Updated 5 reference files (spike-integration, milestone-reflection, reflection-patterns, spike-execution, config-validity probe) from depth to granularity
- Documented controlled-exception mechanism for field renames in version-migration.md with the depth-to-granularity example
- Health probe config-validity.md now validates granularity field with coarse|standard|fine enum
- Shell grep in reflect.md now searches for granularity instead of depth
- Spike sensitivity derivation in plan-phase.md and spike-integration.md uses granularity: coarse/standard/fine

## Task Commits
1. **Task 1: Update workflow files from depth to granularity terminology** - `d36a956`
2. **Task 2: Update reference files and document controlled-exception mechanism** - `00c0a62`

## Files Created/Modified
- `get-shit-done/workflows/plan-phase.md` - Spike sensitivity derivation uses config.granularity
- `get-shit-done/workflows/reflect.md` - Shell grep searches granularity; enum docs updated
- `get-shit-done/workflows/new-project.md` - Config template and success criteria use granularity
- `get-shit-done/workflows/run-spike.md` - Sensitivity input derived from granularity
- `get-shit-done/templates/roadmap.md` - Phase count guideline uses granularity enum
- `get-shit-done/references/spike-integration.md` - Sensitivity derivation and matrix use granularity
- `get-shit-done/references/milestone-reflection.md` - Config examples and depth reference updated
- `get-shit-done/references/reflection-patterns.md` - Config integration field list updated
- `get-shit-done/references/spike-execution.md` - Sensitivity derivation and override example updated
- `get-shit-done/references/health-probes/config-validity.md` - Validates granularity with coarse|standard|fine
- `get-shit-done/references/version-migration.md` - Controlled-exception mechanism for field renames

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All workflow and reference files now use granularity terminology
- Config migration phase ready for Plan 03 (if applicable) or verification
- The installed .claude/ copies will need updating via `node bin/install.js --local` after all source changes are complete

## Self-Check: PASSED
