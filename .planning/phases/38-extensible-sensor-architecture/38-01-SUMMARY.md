---
phase: 38-extensible-sensor-architecture
plan: 01
subsystem: signal-collection
tags: [auto-discovery, sensor-contract, extensibility]
requires:
  - phase: 37-automation-framework
    provides: track-event mechanism for per-sensor stats
provides:
  - Auto-discovery of sensors via gsd-*-sensor.md file system glob
  - Sensor contract specification (input, output, timeout, config_schema, blind_spots)
  - Dynamic sensor spawning loop replacing hardcoded Task() blocks
  - Default-enabled semantics for discovered sensors without config entries
  - Per-sensor timeout tracking and inline warnings
  - Stats tracking via automation track-event (fire/skip per sensor)
affects: [signal-collection, sensor-agents, feature-manifest]
tech-stack:
  added: []
  patterns: [file-system-discovery, contract-based-extensibility, default-enabled-semantics]
key-files:
  created: []
  modified:
    - get-shit-done/workflows/collect-signals.md
    - get-shit-done/feature-manifest.json
key-decisions:
  - "Default timeout 45s for sensors without declared timeout_seconds"
  - "Empty object {} as manifest sensor default -- file system is source of truth for sensor existence"
  - "Sensors not listed in config default to enabled (drop-a-file activation)"
patterns-established:
  - "Auto-discovery: scan for gsd-*-sensor.md files to find available sensors"
  - "Contract-based extensibility: frontmatter metadata defines sensor capabilities"
  - "Default-enabled semantics: discovered sensors active unless explicitly disabled in config"
duration: 3min
completed: 2026-03-04
---

# Phase 38 Plan 01: Sensor Auto-Discovery and Contract Definition Summary

**Dynamic sensor discovery via gsd-*-sensor.md glob replacing hardcoded 3-sensor spawning with contract-based extensibility and default-enabled config semantics**

## Performance
- **Duration:** 3min
- **Tasks:** 2 completed
- **Files modified:** 2

## Accomplishments
- Rewrote collect-signals.md workflow with `discover_sensors` step that scans for `gsd-*-sensor.md` files
- Documented the sensor contract (input, output, error handling, timeout, config_schema, blind_spots) in the workflow architecture notes
- Replaced three hardcoded Task() spawn blocks with a dynamic FOR EACH loop over enabled sensors
- Added per-sensor timeout tracking and inline warnings for failed/timed-out sensors
- Wired up Phase 37 track-event for per-sensor stats (fire on success, skip with reason on failure/timeout)
- Added standing caveat in present_results referencing blind spots and `gsd sensors blind-spots` command
- Changed feature-manifest sensors default from hardcoded `{artifact, git, log}` to empty object `{}`
- Config now provides overrides only; file system is the sole source of truth for sensor existence

## Task Commits
1. **Task 1: Define sensor contract and rewrite collect-signals for auto-discovery** - `5bd915b`
   - Fix: `4c88229` (wiring test pseudocode variable reference)
2. **Task 2: Update feature-manifest sensor defaults for auto-discovery compatibility** - `9de87b6`

## Files Created/Modified
- `get-shit-done/workflows/collect-signals.md` - Rewritten with auto-discovery, sensor contract, dynamic spawning, timeout tracking, stats tracking
- `get-shit-done/feature-manifest.json` - sensors.default changed to {} with updated description

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed wiring validation test failure from template variable in pseudocode**
- **Found during:** Task 1 verification (npm test)
- **Issue:** The `subagent_type="gsd-{NAME}-sensor"` pseudocode string was matched by the wiring validation test regex as a literal agent name, causing test failure
- **Fix:** Changed pseudocode to use a variable reference (`subagent_type=SENSOR_AGENT_TYPE`) with a comment explaining the dynamic construction
- **Files modified:** get-shit-done/workflows/collect-signals.md
- **Commit:** 4c88229

## User Setup Required
None - no external service configuration required. Projects upgrading from pre-v1.17 that had the log sensor disabled by default should add `"log": {"enabled": false}` to their `signal_collection.sensors` config to preserve that behavior.

## Next Phase Readiness
Plan 02 can proceed to retrofit existing sensor agent specs with contract frontmatter fields (timeout_seconds, config_schema), add blind_spots sections, and implement the `sensors list` and `sensors blind-spots` CLI commands.
