---
phase: 33-enhanced-reflector
plan: 01
subsystem: reflection
tags: [confidence-weighted-scoring, counter-evidence, spike-pipeline, pattern-detection]
requires:
  - phase: 31-signal-schema-foundation
    provides: "Signal schema with confidence field, lifecycle states, severity tiers"
  - phase: 32-multi-sensor-orchestrator
    provides: "Multi-sensor architecture producing lifecycle-aware signals"
provides:
  - "Confidence-weighted scoring formula (confidence_weight * severity_multiplier) replacing raw count thresholds"
  - "Secondary clustering fallback for cross-signal_type pattern detection"
  - "Counter-evidence seeking protocol with bounded 3-example search"
  - "Reflect-to-spike pipeline criteria with three trigger conditions"
  - "Authoritative category taxonomy with legacy mappings"
affects: [33-enhanced-reflector, reflector-agent, reflection-workflow]
tech-stack:
  added: []
  patterns: [confidence-weighted-scoring, counter-evidence-seeking, spike-candidate-pipeline]
key-files:
  created: []
  modified:
    - get-shit-done/references/reflection-patterns.md
key-decisions:
  - "Weighted score thresholds set at 3.0/4.0/5.0 for critical/notable/minor (calibrated so 3 high-confidence critical signals qualify but 5 low-confidence minor signals do not)"
  - "Secondary clustering uses 0.8x score multiplier to penalize weaker signal_type coherence"
  - "Counter-evidence search bounded to 3 examples per pattern using index-first approach"
  - "Section 8 category taxonomy declared authoritative with explicit legacy mappings (debugging->testing, performance->architecture, other->workflow)"
  - "Spike candidate triggers: investigate triage, low confidence after counter-evidence, marginal score within 20% of threshold"
patterns-established:
  - "Confidence-weighted scoring: Replace raw occurrence counts with weighted scores that account for signal confidence and severity"
  - "Index-first bounded search: Use index metadata to identify counter-evidence candidates before reading full signal files"
duration: 4min
completed: 2026-02-28
---

# Phase 33 Plan 01: Confidence-Weighted Detection Rules Summary

**Confidence-weighted scoring formula, counter-evidence seeking protocol, and reflect-to-spike pipeline criteria in reflection-patterns.md v1.2.0**

## Performance
- **Duration:** 4min
- **Tasks:** 2/2 completed
- **Files modified:** 1

## Accomplishments
- Replaced raw count thresholds (2/3/5 occurrences) with confidence-weighted scoring formula (confidence_weight * severity_multiplier) in Section 2.1
- Added secondary clustering fallback (same project + 3+ overlapping tags, any signal_type) with 0.8x score multiplier for cross-type clusters
- Added Section 2.5: Counter-Evidence Seeking (REFLECT-03) with bounded 3-example search and index-first search protocol
- Added Section 12: Reflect-to-Spike Pipeline (REFLECT-08) with three trigger conditions and spike candidate output format
- Declared Section 8 category taxonomy as authoritative with legacy category mappings
- Updated Section 9.1 confidence levels to reference weighted score impact
- Bumped reflection-patterns.md from v1.1.0 to v1.2.0

## Task Commits
1. **Task 1: Replace raw count thresholds with confidence-weighted scoring** - `f098121`
2. **Task 2: Add counter-evidence seeking and reflect-to-spike pipeline** - `82d779c`

## Files Created/Modified
- `get-shit-done/references/reflection-patterns.md` - Updated from v1.1.0 to v1.2.0 with confidence-weighted scoring (Section 2.1), secondary clustering (Section 2.2), counter-evidence seeking (Section 2.5), authoritative taxonomy (Section 8), and reflect-to-spike pipeline (Section 12)

## Deviations from Plan

None -- plan executed exactly as written.

## Decisions & Deviations
- Legacy signals (missing `confidence` field) default to `medium` weight (1.0) -- neutral rather than penalizing
- Counter-evidence output format includes both original and adjusted confidence for transparency
- Spike candidate marginal score threshold calculated as 80% of full threshold (threshold * 0.8)
- Pattern output format updated to include Confidence and Severity columns per signal (not just cluster-level)

## User Setup Required
None -- no external service configuration required.

## Next Phase Readiness
- reflection-patterns.md v1.2.0 provides the detection rules foundation for Plan 03 (reflector agent rewrite)
- Plan 02 can proceed with reflect workflow updates using the detection rules established here
- The confidence-weighted scoring formula, counter-evidence protocol, and spike pipeline criteria are documented and ready for agent implementation

## Self-Check: PASSED
- File `get-shit-done/references/reflection-patterns.md`: FOUND
- File `.planning/phases/33-enhanced-reflector/33-01-SUMMARY.md`: FOUND
- Commit `f098121` (Task 1): FOUND
- Commit `82d779c` (Task 2): FOUND
