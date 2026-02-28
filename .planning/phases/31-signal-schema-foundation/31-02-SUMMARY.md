---
phase: 31-signal-schema-foundation
plan: 02
subsystem: signal-detection, reflection-patterns
tags: [signal-schema, severity-tiers, positive-signals, epistemic-gaps, confidence, lifecycle]
requires:
  - phase: 02-signal-collector
    provides: "Original signal-detection.md reference with two-tier severity and schema extensions"
  - phase: 04-reflection-engine
    provides: "Original reflection-patterns.md reference with pattern detection and confidence expression"
provides:
  - "signal-detection.md updated for four-tier severity, positive signal detection, epistemic gap detection, signal_category, lifecycle fields"
  - "reflection-patterns.md updated for four-tier severity thresholds, lowercase confidence, lifecycle mutability boundary, signal_category clustering"
affects: [signal-collector, reflector, signal-synthesizer]
tech-stack:
  added: []
  patterns: [four-tier-severity, positive-signal-detection, epistemic-gap-detection, signal-category-clustering]
key-files:
  created: []
  modified:
    - get-shit-done/references/signal-detection.md
    - get-shit-done/references/reflection-patterns.md
key-decisions:
  - "Moved single auto-fix, minor file differences, task order changes from trace to minor severity (these are now persisted to KB)"
  - "signal_category replaces polarity as primary positive/negative indicator; polarity retained for backward compatibility"
  - "Trace non-persistence enforcement deferred to Phase 32 synthesizer; documented explicitly"
  - "Positive and negative signals cluster separately; epistemic gaps may cross-cluster with related signals"
  - "Anti-pattern 10.6 updated from full immutability to detection-payload-frozen / lifecycle-fields-mutable boundary"
patterns-established:
  - "Four-tier severity model: critical/notable/minor/trace with proportional rigor requirements"
  - "Signal category clustering: positive and negative signals never cluster together"
duration: 4min
completed: 2026-02-28
---

# Phase 31 Plan 02: Reference Document Updates Summary

**Updated signal-detection.md and reflection-patterns.md to align with Phase 31 extended signal schema -- four-tier severity, positive signals, epistemic gaps, signal_category, and lifecycle-aware confidence.**

## Performance
- **Duration:** 4 minutes
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- signal-detection.md expanded to four-tier severity (critical/notable/minor/trace) with per-tier epistemic rigor requirements
- Added signal_category field, positive signal detection rules (baseline/improvement/good-pattern), and epistemic gap detection section
- Documented trace non-persistence enforcement point (Phase 32 synthesizer) as explicit gap note
- Added lifecycle and evidence fields to signal schema extensions table
- reflection-patterns.md severity thresholds aligned with signal schema (replacing high/medium/low with critical/notable/minor/trace)
- Confidence expression converted to lowercase three-tier model matching schema field values
- Anti-pattern 10.6 updated to reflect new mutability boundary (detection payload frozen, lifecycle fields mutable)
- Clustering rules updated to respect signal_category (positive and negative signals cluster separately)

## Task Commits
1. **Task 1: Update signal-detection.md with four-tier severity, positive signals, and epistemic gaps** - `2fd836d`
2. **Task 2: Update reflection-patterns.md with four-tier severity and lifecycle-aware confidence** - `c8d7e09`

## Files Created/Modified
- `get-shit-done/references/signal-detection.md` - Updated severity enum, added signal_category/lifecycle/evidence fields, positive signal detection section, epistemic gap detection section, version 1.2.0
- `get-shit-done/references/reflection-patterns.md` - Updated severity thresholds, lowercase confidence, lifecycle mutability in anti-patterns, signal_category clustering, version 1.1.0

## Deviations from Plan

None -- plan executed exactly as written.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Both reference documents are now consistent with the Phase 31 extended signal schema. The signal-collector and reflector agents will produce signals conforming to the four-tier severity model with signal_category, epistemic gap support, and lifecycle-aware confidence. Plan 31-03 (validation and testing) can proceed.

## Self-Check: PASSED

- FOUND: get-shit-done/references/signal-detection.md
- FOUND: get-shit-done/references/reflection-patterns.md
- FOUND: .planning/phases/31-signal-schema-foundation/31-02-SUMMARY.md
- FOUND: 2fd836d (Task 1 commit)
- FOUND: c8d7e09 (Task 2 commit)
