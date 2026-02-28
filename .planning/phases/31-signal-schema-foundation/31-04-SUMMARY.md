---
phase: 31-signal-schema-foundation
plan: 04
subsystem: signal-validation
tags: [backward-compat, schema-validation, evidence, gap-closure]
requires:
  - phase: 31-03
    provides: "FRONTMATTER_SCHEMAS.signal with conditional validation and cmdFrontmatterValidate"
provides:
  - "backward_compat schema field keyed on lifecycle_state absence"
  - "Evidence content validation (empty evidence objects rejected)"
  - "Phase 33 triage constraint documented in code, spec, and tests"
  - "Updated fork divergence tracking"
affects: [signal-validation, knowledge-store, fork-divergences]
tech-stack:
  added: []
  patterns: [backward-compat-indicator, conditional-downgrade-to-warning]
key-files:
  created: []
  modified:
    - get-shit-done/bin/gsd-tools.js
    - get-shit-done/bin/gsd-tools.test.js
    - agents/knowledge-store.md
    - .planning/FORK-DIVERGENCES.md
key-decisions:
  - "backward_compat keyed on lifecycle_state absence -- pre-Phase 31 signals lack this field, new signals always have it"
  - "Evidence content validation checks supporting array length -- empty evidence objects are epistemically empty"
  - "Counter-evidence emptiness is warning-only, not hard fail -- signal creator may document no counter-evidence narratively"
patterns-established:
  - "backward_compat indicator: schema field that downgrades conditional require to recommend based on presence/absence of a sentinel field"
duration: 4min
completed: 2026-02-28
---

# Phase 31 Plan 04: Backward Compatibility Gap Closure Summary

**backward_compat validation with lifecycle_state indicator allowing 6 pre-existing critical signals to pass while maintaining strict enforcement for new signals**

## Performance
- **Duration:** 4min
- **Tasks:** 4/4 completed
- **Files modified:** 4

## Accomplishments
- Added `backward_compat: { field: 'lifecycle_state' }` to FRONTMATTER_SCHEMAS.signal, enabling pre-Phase 31 signals without lifecycle_state to receive warnings instead of hard failures on conditional require fields
- Implemented evidence content validation: empty evidence objects (`evidence: {}` or `evidence: { supporting: [], counter: [] }`) now fail validation for new critical signals
- Updated existing test to add `lifecycle_state: detected` and added 4 new tests covering backward compat downgrade, strict enforcement with lifecycle_state, empty evidence rejection, and Phase 33 constraint verification
- Documented backward_compat validation behavior and Phase 33 triage constraint in knowledge-store.md Section 4.2
- Updated FORK-DIVERGENCES.md gsd-tools.js entry with backward_compat and evidence content validation

## Task Commits
1. **Task 1: Add backward_compat schema field, evidence content validation, and Phase 33 warning** - `f9c7365`
2. **Task 2: Update and add tests for backward compatibility and evidence content validation** - `7ad63a4`
3. **Task 3: Document backward_compat validation behavior in knowledge-store.md** - `0f0715f`
4. **Task 4: Update FORK-DIVERGENCES.md with backward_compat note** - `db0b70c`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added backward_compat field to signal schema, backwardCompat detection in cmdFrontmatterValidate, conditional downgrade logic, and evidence content validation
- `get-shit-done/bin/gsd-tools.test.js` - Updated existing critical signal test, added 4 new tests (backward compat downgrade, strict enforcement, empty evidence, Phase 33 constraint)
- `agents/knowledge-store.md` - Documented backward_compat validation behavior and Phase 33 triage constraint in Section 4.2
- `.planning/FORK-DIVERGENCES.md` - Updated gsd-tools.js divergence entry with backward_compat and evidence content validation

## Decisions & Deviations

### Decisions Made
1. **backward_compat keyed on lifecycle_state absence** -- Pre-Phase 31 signals lack lifecycle_state; new signals from the template always include it. This is a reliable sentinel.
2. **Evidence content validation checks supporting array** -- An empty evidence object is structurally present but epistemically empty. At minimum one supporting entry required.
3. **Counter-evidence emptiness is warning-only** -- A signal creator may legitimately document "no counter-evidence found" narratively rather than with structured counter entries.

### Deviations from Plan

None - plan executed exactly as written. The expected test failure in the "invalid critical signal without evidence" test between Task 1 and Task 2 was anticipated by the plan (Task 2 updates this test).

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 31 is now fully complete (4/4 plans). All 46 existing signals remain valid without migration. The signal schema foundation is ready for Phase 32 (Signal Sensors).

## Self-Check: PASSED

All 4 files verified present. All 4 task commits verified in git log.
