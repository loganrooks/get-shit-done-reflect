---
phase: 39-ci-awareness
plan: 01
subsystem: signal-collection
tags: [ci, github-actions, gh-cli, sensor, signal-detection]
requires:
  - phase: 38-extensible-sensor-architecture
    provides: "Sensor contract (EXT-02), auto-discovery via gsd-*-sensor.md glob, config_schema field"
provides:
  - "CI sensor agent spec (gsd-ci-sensor.md) conforming to Phase 38 sensor contract"
  - "First non-null config_schema validating extensibility (EXT-06)"
  - "Pre-flight auth check with degraded output (CI-04)"
  - "Failure detection for current branch and main (CI-03)"
  - "Branch protection bypass detection via check-runs API (CI-05)"
  - "Test regression detection with LOW confidence (CI-06)"
affects: [collect-signals, signal-synthesis]
tech-stack:
  added: [gh-cli]
  patterns: [pre-flight-degradation, config-schema-override, delimited-sensor-output]
key-files:
  created: [agents/gsd-ci-sensor.md]
  modified: []
key-decisions:
  - "CI sensor is the first with non-null config_schema (repo + workflow overrides), validating Phase 38 extensibility"
  - "Pre-flight checks return degraded:true with warning, never clean empty signals -- core CI-04 requirement"
  - "Test regression detection marked LOW confidence due to log-parsing fragility"
patterns-established:
  - "Pre-flight degradation: check external tool availability before use, return degraded output with warning on failure"
  - "Config schema override: sensor-specific config knobs declared in frontmatter, applied at runtime"
duration: 3min
completed: 2026-03-05
---

# Phase 39 Plan 01: CI Sensor Agent Spec Summary

**CI sensor agent spec with gh CLI pre-flight, failure detection, branch protection bypass detection, and test regression detection conforming to Phase 38 sensor contract**

## Performance
- **Duration:** 3min
- **Tasks:** 1 completed
- **Files modified:** 1

## Accomplishments
- Created CI sensor agent spec (`agents/gsd-ci-sensor.md`) with 7 execution steps
- First sensor with non-null `config_schema` (repo + workflow overrides), validating EXT-06
- Pre-flight auth check (CI-04) prevents silent false-negatives with `degraded: true` output
- Failure detection queries current branch + main for failed GitHub Actions runs (CI-03)
- Branch protection bypass detection via commit check-runs API (CI-05)
- Test regression detection comparing test counts between consecutive CI runs (CI-06, LOW confidence)
- Sensor auto-discovered by `sensors list` as enabled -- no changes to collect-signals.md needed

## Task Commits
1. **Task 1: Create CI sensor agent spec with pre-flight and failure detection** - `1fb03b9`

## Files Created/Modified
- `agents/gsd-ci-sensor.md` - CI sensor agent spec with sensor contract frontmatter, 7-step execution flow, guidelines, blind spots

## Decisions & Deviations

### Decisions
- Used `red` color for CI sensor (matches urgency of CI failure signals)
- Matched exact section order and XML tag structure of artifact and git sensors
- Test regression detection explicitly marked LOW confidence with skip-on-parse-failure behavior

### Deviations
None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required. The CI sensor requires `gh` CLI to be installed and authenticated (`gh auth login`), but this is checked at runtime via pre-flight and degrades gracefully.

## Self-Check: PASSED

- [x] `agents/gsd-ci-sensor.md` exists
- [x] `.planning/phases/39-ci-awareness/39-01-SUMMARY.md` exists
- [x] Commit `1fb03b9` exists in git log

## Next Phase Readiness
- CI sensor spec complete and auto-discoverable
- Ready for Plan 02: SessionStart hook for CI status display, installer integration
