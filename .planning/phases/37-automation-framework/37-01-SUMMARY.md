---
phase: 37-automation-framework
plan: 01
subsystem: automation
tags: [automation, feature-manifest, cli, config-schema]
requires:
  - phase: 36-foundation-fix
    provides: stable test infrastructure and wiring validation
provides:
  - automation feature declaration in feature-manifest.json with full schema
  - automation resolve-level CLI subcommand with global level resolution
  - config_key "automation" detected by manifest validation system
affects: [37-02, 37-03, 38-extensible-sensors, 39-trigger-engine]
tech-stack:
  added: []
  patterns: [subcommand-group-routing, feature-name-normalization]
key-files:
  created: []
  modified:
    - get-shit-done/feature-manifest.json
    - get-shit-done/bin/gsd-tools.js
key-decisions:
  - "Automation feature uses manifest config_key detection (not KNOWN_TOP_LEVEL_KEYS), consistent with all other manifest features"
  - "Default automation level is 1 (nudge) - safe default that provides value without surprising auto-actions"
  - "cmdAutomationResolveLevel placed in dedicated Automation section before CLI Router, case block after backlog"
patterns-established:
  - "Automation resolution chain: global level as base, extensible for overrides/context/runtime in 37-02"
  - "Feature name normalization: hyphens to underscores for config_key consistency"
duration: 3min
completed: 2026-03-03
---

# Phase 37 Plan 01: Automation Feature Declaration and Resolve-Level Subcommand Summary

**Automation config schema in feature-manifest.json with 4-level enum (manual/nudge/prompt/auto) and CLI resolve-level subcommand returning effective level with default nudge**

## Performance
- **Duration:** 3min
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Added automation feature to feature-manifest.json with level (enum 0-3, default 1=nudge), overrides (object), context_threshold_pct (number 20-90, default 60), and stats (object)
- Implemented `automation resolve-level <feature>` subcommand returning JSON with configured, override, effective, reasons, and level_names fields
- Feature name normalization converts hyphens to underscores for config_key consistency
- Manifest validate and diff-config correctly detect automation as a declared feature
- All 156 existing tests pass without regressions

## Task Commits
1. **Task 1: Add automation feature to feature-manifest.json** - `5f66ec1`
2. **Task 2: Implement basic automation resolve-level subcommand in gsd-tools.js** - `a72befc`

## Files Created/Modified
- `get-shit-done/feature-manifest.json` - Added automation feature entry with full schema (level, overrides, context_threshold_pct, stats) and init_prompts
- `get-shit-done/bin/gsd-tools.js` - Added cmdAutomationResolveLevel function and automation case in CLI router switch

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 37-02 can extend cmdAutomationResolveLevel with override resolution (reading overrides object from config), context deferral (using options.contextPct against context_threshold_pct), and runtime capping
- Plan 37-03 can implement track-event to populate the stats object
- The automation config_key is live in the manifest system - consuming phases (38-43) can call `automation resolve-level <feature>` to get effective level

## Self-Check: PASSED

All files verified present. All commits verified in git log.
