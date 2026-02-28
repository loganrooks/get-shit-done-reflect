---
phase: 31-signal-schema-foundation
plan: 01
subsystem: signal-schema
tags: [signal-lifecycle, epistemic-rigor, mutability-boundary, positive-signals, feature-manifest]
requires:
  - phase: 01-knowledge-store
    provides: Base knowledge-store.md specification with signal schema
provides:
  - Complete extended signal schema with lifecycle, epistemic, mutability, and positive signal specs
  - Updated signal creation template with all new fields and severity-based requirements
  - Five signal lifecycle project settings in feature-manifest.json
  - Agent specs with mutability boundary references replacing blanket immutability
affects: [32-signal-detection, 33-enhanced-reflector, 34-signal-plan-linkage, 35-spike-enhancements]
tech-stack:
  added: []
  patterns: [frozen-mutable-field-boundary, tiered-epistemic-rigor, lifecycle-state-machine]
key-files:
  created: []
  modified:
    - agents/knowledge-store.md
    - agents/kb-templates/signal.md
    - get-shit-done/feature-manifest.json
    - agents/gsd-signal-collector.md
    - agents/gsd-reflector.md
key-decisions:
  - "Four severity tiers (critical/notable/minor/trace) with proportional rigor requirements"
  - "Lifecycle state machine: detected->triaged->remediated->verified + invalidated terminal state"
  - "Mutability boundary: frozen detection payload + mutable lifecycle fields (agent-enforced)"
  - "signal_category is authoritative over polarity for positive/negative classification"
  - "Empty objects {} for unset triage/remediation/verification (not null, per reconstructFrontmatter pitfall)"
  - "Dismissed is a triage decision value, not a lifecycle state"
  - "lifecycle_log uses quoted strings to protect YAML special characters"
  - "Invalidated signals get status:archived simultaneously to exit active signal pool"
patterns-established:
  - "Frozen/mutable boundary: Detection payload frozen, lifecycle fields mutable -- agent-enforced via specs"
  - "Tiered epistemic rigor: Severity determines evidence requirements (critical requires counter-evidence)"
  - "Lifecycle state machine: Four states + invalidated terminal, with regression paths and skip rules"
duration: 4min
completed: 2026-02-28
---

# Phase 31 Plan 01: Signal Schema Foundation Summary

**Extended signal schema with lifecycle state machine, tiered epistemic rigor, frozen/mutable field boundary, and positive signal support in knowledge-store.md**

## Performance
- **Duration:** 4min
- **Tasks:** 3/3 completed
- **Files modified:** 5

## Accomplishments
- Extended knowledge-store.md with comprehensive lifecycle state machine (Section 4.2), epistemic rigor requirements (Section 4.3), positive signal specification (Section 4.4), and explicit frozen/mutable field boundary (Section 10)
- Updated signal template with all 13 new fields including lifecycle_state, evidence, confidence, triage, remediation, verification, and recurrence_of with sensible defaults
- Added signal_lifecycle feature entry to feature-manifest.json with 5 project settings (lifecycle_strictness, manual_signal_trust, rigor_enforcement, severity_conflict_handling, recurrence_escalation)
- Replaced blanket "signals are immutable" guidelines in both agent specs with nuanced mutability boundary references, including explicit authorized mutations per agent

## Task Commits
1. **Task 1: Extend knowledge-store.md with lifecycle, epistemic, and mutability specifications** - `a38a2d8`
2. **Task 2: Update signal template and add project settings to feature manifest** - `167310f`
3. **Task 3: Update agent spec immutability guidelines to reference mutability boundary** - `e9e6522`

## Files Created/Modified
- `agents/knowledge-store.md` - Authoritative signal schema spec: lifecycle state machine, epistemic rigor, mutability boundary, positive signals, 13 new extension fields
- `agents/kb-templates/signal.md` - Updated signal creation template with all lifecycle and epistemic fields plus severity-based requirements comment
- `get-shit-done/feature-manifest.json` - Added signal_lifecycle feature with 5 configurable project settings
- `agents/gsd-signal-collector.md` - Replaced immutability guideline with mutability boundary reference; collector creates only
- `agents/gsd-reflector.md` - Replaced immutability guideline with mutability boundary reference; authorized for triage mutations

## Decisions & Deviations

### Decisions Made
- Four severity tiers (critical/notable/minor/trace) replace the previous two (critical/notable), adding minor as middle ground and trace as collection-only
- Lifecycle state machine uses four core states plus invalidated terminal -- dismissed is a triage decision value, not a state
- Signal_category is the authoritative field for positive/negative classification; polarity retained for backward compatibility
- Empty objects {} used for unset triage/remediation/verification to avoid reconstructFrontmatter null-skipping (documented pitfall)
- lifecycle_log entries are quoted strings in YAML to protect colons and arrows
- Invalidated signals automatically get status:archived to remove from active pool

### Deviations from Plan
None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 31 Plan 02 (Signal Detection Sensors) can proceed -- the authoritative schema in knowledge-store.md defines all fields that sensors will populate. Phase 33 (Enhanced Reflector) is unblocked by the mutability boundary update -- the reflector can now modify triage/lifecycle fields without contradicting its own guidelines.

## Self-Check: PASSED

All 5 modified files exist. All 3 task commits verified (a38a2d8, 167310f, e9e6522). SUMMARY.md exists at expected path.
