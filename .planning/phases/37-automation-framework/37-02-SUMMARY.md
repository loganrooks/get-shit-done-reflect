---
phase: 37-automation-framework
plan: 02
subsystem: automation
tags: [automation, resolve-level, capability-map, overrides, context-deferral, runtime-cap]
requires:
  - phase: 37-01
    provides: basic resolve-level subcommand with global level resolution and feature name normalization
provides:
  - full 4-step resolve-level resolution chain (global -> override -> context deferral -> runtime cap)
  - FEATURE_CAPABILITY_MAP defining hook/task_tool requirements per feature
  - fine-grained knob reading from automation.<feature>.* config
  - 27 comprehensive tests covering all resolution scenarios
affects: [37-03, 38-extensible-sensors, 39-trigger-engine]
tech-stack:
  added: []
  patterns: [resolution-chain-ordering, runtime-capability-heuristic, context-aware-deferral]
key-files:
  created:
    - tests/unit/automation.test.js
  modified:
    - get-shit-done/bin/gsd-tools.js
key-decisions:
  - "Resolution chain order: override BEFORE deferral BEFORE runtime cap -- each step can only reduce or maintain the level"
  - "Context deferral only applies to level 3 (auto) -- levels 0-2 are not context-sensitive"
  - "Runtime heuristic checks .claude/settings.json hooks key for capability detection when --runtime flag not provided"
  - "FEATURE_CAPABILITY_MAP is a module-level constant near KNOWN_TOP_LEVEL_KEYS for discoverability"
patterns-established:
  - "Resolution chain ordering: override -> context deferral -> runtime cap, each step reduces or maintains"
  - "Runtime capability heuristic: .claude/settings.json hooks key presence implies hooks available"
  - "Fine-grained knobs: informational in resolve-level output, consumed by downstream workflows"
duration: 3min
completed: 2026-03-03
---

# Phase 37 Plan 02: Resolve-Level Full Resolution Chain Summary

**4-step automation level resolution with per-feature overrides, context-aware deferral to nudge at high context usage, runtime capability capping via FEATURE_CAPABILITY_MAP, and fine-grained knob passthrough**

## Performance
- **Duration:** 3min
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Extended cmdAutomationResolveLevel with full 4-step resolution chain: global level -> per-feature override -> context-aware deferral -> runtime capability cap
- Added FEATURE_CAPABILITY_MAP defining hook_dependent_above and task_tool_dependent requirements for signal_collection, reflection, health_check, and ci_status
- Per-feature overrides from automation.overrides[feature] take precedence over global level
- Context deferral downgrades level 3 to 1 (nudge) when context usage exceeds automation.context_threshold_pct (default 60%)
- Runtime capability capping uses either explicit --runtime flag or heuristic detection via .claude/settings.json hooks key
- Fine-grained knobs from automation[feature] config included in output for downstream workflow consumption
- Created 27 comprehensive end-to-end tests covering all resolution scenarios via CLI execSync

## Task Commits
1. **Task 1: Add FEATURE_CAPABILITY_MAP and extend resolve-level with full resolution chain** - `15cef50`
2. **Task 2: Add tests for automation resolve-level resolution chain** - `97ece81`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added FEATURE_CAPABILITY_MAP constant and extended cmdAutomationResolveLevel with override, deferral, runtime cap, and knob logic
- `tests/unit/automation.test.js` - 27 end-to-end tests covering global level, overrides, context deferral, runtime capping, knobs, and integration

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 37-03 can implement track-event subcommand to populate automation.stats
- All consuming workflows (Phases 38-43) can call `automation resolve-level <feature>` to get the correct effective automation level with full resolution chain
- FEATURE_CAPABILITY_MAP is extensible -- new features can be added as sensor/trigger phases define them

## Self-Check: PASSED

All files verified present. All commits verified in git log.
