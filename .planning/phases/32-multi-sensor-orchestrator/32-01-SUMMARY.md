---
phase: 32-multi-sensor-orchestrator
plan: 01
subsystem: signal-collection
tags: [sensor, artifact-sensor, log-sensor, feature-manifest, deprecation]
requires:
  - phase: 31-signal-schema-foundation
    provides: "Signal schema with lifecycle, severity tiers, epistemic rigor"
provides:
  - "Standalone artifact sensor agent spec extracted from gsd-signal-collector"
  - "Disabled log sensor stub with documented spike question (SENSOR-07)"
  - "signal_collection feature in manifest with per-sensor enabled/model config"
  - "Deprecation wrapper for gsd-signal-collector pointing to new architecture"
affects: [signal-collection, feature-manifest, signal-workflow]
tech-stack:
  added: []
  patterns: ["delimited sensor output (## SENSOR OUTPUT / ## END SENSOR OUTPUT)", "per-sensor enabled/model configuration"]
key-files:
  created:
    - agents/gsd-artifact-sensor.md
    - agents/gsd-log-sensor.md
  modified:
    - agents/gsd-signal-collector.md
    - get-shit-done/feature-manifest.json
    - get-shit-done/workflows/signal.md
    - get-shit-done/bin/gsd-tools.test.js
key-decisions:
  - "Artifact sensor returns ALL candidates including trace -- synthesizer is single enforcement point for trace non-persistence"
  - "Log sensor ships disabled with spike question rather than being omitted entirely -- documents the unknown"
  - "signal_collection feature uses _gate prompt pattern for optional configuration"
patterns-established:
  - "Delimited sensor output: structured JSON wrapped in ## SENSOR OUTPUT / ## END SENSOR OUTPUT markers for reliable orchestrator extraction"
  - "Sensor-only tools: Read, Bash, Glob, Grep (no Write) -- sensors never write to KB"
duration: 4min
completed: 2026-02-28
---

# Phase 32 Plan 01: Sensor Agent Infrastructure Summary

**Artifact sensor extracted with all detection logic from signal-collector, log sensor stub with spike question, feature manifest extended with per-sensor configuration, signal-collector converted to deprecation wrapper.**

## Performance
- **Duration:** 4min
- **Tasks:** 2 completed
- **Files modified:** 6

## Accomplishments
- Extracted artifact sensor from signal-collector with all detection logic (SGNL-01 deviation, SGNL-02 config mismatch, SGNL-03 struggle) but no KB write/index/filter/cap steps
- Artifact sensor returns structured JSON with delimited output format for orchestrator extraction
- Created disabled log sensor stub documenting spike question about session log location and format
- Extended feature manifest with signal_collection feature: 3 sensors (artifact enabled, git enabled, log disabled), synthesizer_model, per_phase_cap
- Converted signal-collector to deprecation wrapper preserving backward compatibility
- Updated signal workflow references from gsd-signal-collector to new sensor agents
- Updated test assertions from 4 to 5 features -- all 155 tests pass

## Task Commits
1. **Task 1: Extract artifact sensor and create log sensor stub** - `a809db9`
2. **Task 2: Update signal-collector deprecation wrapper and extend feature manifest** - `eae6d6d`

## Files Created/Modified
- `agents/gsd-artifact-sensor.md` - Standalone artifact sensor with detection logic, returns structured JSON
- `agents/gsd-log-sensor.md` - Disabled stub with spike question for SENSOR-07
- `agents/gsd-signal-collector.md` - Deprecation wrapper pointing to new multi-sensor architecture
- `get-shit-done/feature-manifest.json` - Added signal_collection feature (5th feature)
- `get-shit-done/workflows/signal.md` - Updated consumer references to new agent names
- `get-shit-done/bin/gsd-tools.test.js` - Updated feature count assertion from 4 to 5

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plans 02 and 03 can proceed independently: Plan 02 (git sensor) and Plan 03 (signal synthesizer)
- The artifact sensor output format (## SENSOR OUTPUT delimiters with JSON) establishes the contract that git sensor (Plan 02) must follow
- The feature manifest signal_collection schema establishes the configuration contract for the orchestrator (Plan 04)

## Self-Check: PASSED
- All 7 created/modified files verified present on disk
- Both task commits verified in git history (a809db9, eae6d6d)
- All 155 tests passing
