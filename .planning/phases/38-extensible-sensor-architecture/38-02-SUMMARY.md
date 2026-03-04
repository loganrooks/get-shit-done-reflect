---
phase: 38-extensible-sensor-architecture
plan: 02
subsystem: signal-collection
tags: [sensor-contract, blind-spots, cli-observability, extensibility]
requires:
  - phase: 38-01
    provides: auto-discovery loop, sensor contract specification, default-enabled semantics
provides:
  - Sensor contract frontmatter (sensor_name, timeout_seconds, config_schema) on all 3 sensors
  - Blind spots documentation on all 3 sensors via <blind_spots> sections
  - CLI sensors list command showing discovered sensors with status, stats, and config
  - CLI sensors blind-spots command extracting blind spots from agent specs
  - 11 unit tests covering sensors CLI commands
affects: [signal-collection, sensor-agents, gsd-tools]
tech-stack:
  added: []
  patterns: [frontmatter-contract-metadata, blind-spots-documentation, file-system-sensor-discovery]
key-files:
  created:
    - tests/unit/sensors.test.js
  modified:
    - agents/gsd-artifact-sensor.md
    - agents/gsd-git-sensor.md
    - agents/gsd-log-sensor.md
    - get-shit-done/bin/gsd-tools.js
key-decisions:
  - "Sensor discovery tries .claude/agents/ first, falls back to agents/ for dev environments"
  - "Default enabled=true when no config entry exists (consistent with 38-01 default-enabled semantics)"
  - "Last status inferred from fires/skips heuristic -- sufficient for Phase 38 observability"
patterns-established:
  - "CLI sensor observability: sensors list and blind-spots commands for runtime inspection"
  - "Blind spots documentation: each sensor declares what it structurally cannot detect"
duration: 3min
completed: 2026-03-04
---

# Phase 38 Plan 02: Sensor Contract Retrofit and CLI Observability Summary

**Retrofitted all 3 sensors with standardized contract frontmatter and blind spots, added sensors list and sensors blind-spots CLI commands with 11 unit tests**

## Performance
- **Duration:** 3min
- **Tasks:** 2 completed
- **Files modified:** 5

## Accomplishments
- Added sensor contract frontmatter (sensor_name, timeout_seconds, config_schema) to artifact, git, and log sensor agent specs per EXT-02
- Documented structural blind spots for each sensor in <blind_spots> sections per EXT-07
- Implemented cmdSensorsList in gsd-tools.js: discovers sensors via gsd-*-sensor.md glob, cross-references config for enable/disable, shows automation stats (fires, skips, last_triggered, signal count)
- Implemented cmdSensorsBlindSpots in gsd-tools.js: extracts blind spots from sensor agent specs with optional sensor name filter
- Added sensors routing in CLI switch block with list and blind-spots subcommands
- Created 11 unit tests covering discovery, config integration, stats display, graceful error handling, blind spots extraction and filtering
- Updated usage string to include sensors command

## Task Commits
1. **Task 1: Add contract frontmatter and blind spots to all sensor agent specs** - `143e892`
2. **Task 2: Add sensors list and sensors blind-spots CLI commands to gsd-tools.js** - `7eb3a5c`

## Files Created/Modified
- `agents/gsd-artifact-sensor.md` - Added sensor contract frontmatter and blind spots section
- `agents/gsd-git-sensor.md` - Added sensor contract frontmatter and blind spots section
- `agents/gsd-log-sensor.md` - Added sensor contract frontmatter and blind spots section
- `get-shit-done/bin/gsd-tools.js` - Added cmdSensorsList, cmdSensorsBlindSpots functions and CLI routing
- `tests/unit/sensors.test.js` - 11 unit tests for sensors list and blind-spots commands

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 38 (Extensible Sensor Architecture) is complete. All existing sensors conform to the contract, CLI observability is in place, and blind spots are documented. The extensible architecture supports drop-a-file sensor addition: any new gsd-*-sensor.md file with contract frontmatter will be auto-discovered by the collect-signals workflow and visible via sensors list without config or code changes.
