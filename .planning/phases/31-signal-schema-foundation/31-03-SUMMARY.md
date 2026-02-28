---
phase: 31-signal-schema-foundation
plan: 03
subsystem: signal-validation
tags: [signal-schema, frontmatter-validation, tiered-rigor, backward-compatibility, lifecycle-state]
requires:
  - phase: 31-01
    provides: "Extended signal schema in knowledge-store.md with lifecycle, epistemic, and mutability specs"
  - phase: 31-02
    provides: "Updated signal-detection.md and reflection-patterns.md with four-tier severity"
provides:
  - "Machine-enforceable signal schema in FRONTMATTER_SCHEMAS with required/conditional/recommended tiered validation"
  - "Extended cmdFrontmatterValidate with conditional requirement and recommended field warning support"
  - "7 signal validation tests covering all severity tiers, conditional evidence, and backward compatibility"
  - "kb-rebuild-index.sh lifecycle_state column with detected default"
  - "Fork divergence entry for gsd-tools.js signal schema"
affects: [32-signal-detection, 33-enhanced-reflector, 34-signal-plan-linkage]
tech-stack:
  added: []
  patterns: [conditional-schema-validation, recommended-field-warnings, tiered-frontmatter-validation]
key-files:
  created: []
  modified:
    - get-shit-done/bin/gsd-tools.js
    - get-shit-done/bin/gsd-tools.test.js
    - .claude/agents/kb-rebuild-index.sh
    - .planning/FORK-DIVERGENCES.md
key-decisions:
  - "Conditional validation: critical severity requires evidence (validation failure); notable severity recommends evidence (warning only)"
  - "Recommended fields produce warnings array in output but never fail validation"
  - "Existing schemas (plan/summary/verification) unaffected -- warnings is empty array for schemas without conditional/recommended"
  - "kb-rebuild-index.sh source of truth is .claude/agents/ for .sh scripts (not agents/), per installer comment"
patterns-established:
  - "Conditional schema validation: FRONTMATTER_SCHEMAS entries can define conditional requirements triggered by field values"
  - "Recommended field warnings: Schema recommended fields surface in warnings array without failing validation"
duration: 6min
completed: 2026-02-28
---

# Phase 31 Plan 03: Signal Schema Validation Summary

**Machine-enforceable signal schema in gsd-tools.js with conditional evidence requirements for critical signals, recommended field warnings, 7 validation tests, and lifecycle_state column in knowledge base index**

## Performance
- **Duration:** 6 minutes
- **Tasks:** 2/2 completed
- **Files modified:** 4

## Accomplishments
- Added `signal` entry to FRONTMATTER_SCHEMAS with 7 required fields, 2 conditional rules (critical requires evidence; notable recommends evidence/confidence), 4 recommended fields, and 15 optional fields
- Extended `cmdFrontmatterValidate` with conditional requirement checking (causes validation failure when condition matches) and recommended field warning support (produces warnings array without failing)
- Added 7 signal validation tests: valid critical/notable/minor signals, invalid missing required field, invalid critical without evidence, backward-compatible date-slug format signal, and recommended field warnings
- Fixed pre-existing feature manifest test to expect 4 features (signal_lifecycle added in Phase 31-01)
- Updated kb-rebuild-index.sh to extract lifecycle_state field with "detected" default, adding a Lifecycle column to the signals table
- Tracked fork divergence for gsd-tools.js signal schema addition with keep-fork merge stance

## Task Commits
1. **Task 1: Extend FRONTMATTER_SCHEMAS and validation in gsd-tools.js** - `ecfd3ee`
2. **Task 2: Add signal validation tests and update kb-rebuild-index.sh** - `3b007b1`

## Files Created/Modified
- `get-shit-done/bin/gsd-tools.js` - Added signal schema to FRONTMATTER_SCHEMAS; extended cmdFrontmatterValidate with conditional/recommended support
- `get-shit-done/bin/gsd-tools.test.js` - Added 7 signal validation tests in new describe block; fixed feature manifest count from 3 to 4
- `.claude/agents/kb-rebuild-index.sh` - Added lifecycle_state extraction with "detected" default; added Lifecycle column to signal table header and rows
- `.planning/FORK-DIVERGENCES.md` - Added Runtime section with gsd-tools.js signal schema divergence entry; updated modified file count to 18

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] kb-rebuild-index.sh path correction**
- **Found during:** Task 2
- **Issue:** Plan references `agents/kb-rebuild-index.sh` but the file only exists at `.claude/agents/kb-rebuild-index.sh`. The installer comment (line 369) documents that `.claude/agents/` is the source of truth for `.sh` scripts, unlike `.md` agent specs which live in `agents/`.
- **Fix:** Edited `.claude/agents/kb-rebuild-index.sh` directly as the canonical source location.
- **Files modified:** `.claude/agents/kb-rebuild-index.sh`
- **Commit:** `3b007b1`

**2. [Rule 1 - Bug] Feature manifest test count mismatch**
- **Found during:** Task 2
- **Issue:** Existing test `real manifest is valid JSON with expected structure` expected exactly 3 features, but Phase 31-01 added `signal_lifecycle` as a 4th feature to `feature-manifest.json`. Test was failing with `4 !== 3`.
- **Fix:** Updated test to expect 4 features and added assertion for `signal_lifecycle`.
- **Files modified:** `get-shit-done/bin/gsd-tools.test.js`
- **Commit:** `3b007b1`

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Phase 31 (Signal Schema Foundation) is complete. All three plans delivered:
- 31-01: Schema specification in knowledge-store.md, signal template, feature manifest, agent spec updates
- 31-02: Reference document updates (signal-detection.md, reflection-patterns.md)
- 31-03: Machine-enforceable validation in gsd-tools.js, tests, index lifecycle column

Phase 32 (Signal Detection Sensors) can proceed -- the signal schema is now both documented and machine-enforceable. New signals created by the collector can be validated with `frontmatter validate <file> --schema signal`.

## Self-Check: PASSED
