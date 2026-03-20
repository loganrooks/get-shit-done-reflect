---
phase: 48-module-extensions-verification
plan: 01
model: claude-sonnet-4-6
context_used_pct: 35
subsystem: gsd-tools-modularization
tags: [frontmatter, init, signal-schema, tiered-validation, module-extraction]
requires:
  - phase: 47-fork-module-extraction
    provides: gsd-tools.cjs reduced to 1,239 lines retaining fork init overrides and fork frontmatter override
  - phase: 46-upstream-module-adoption
    provides: frontmatter.cjs and init.cjs adopted as upstream modules with dispatcher wiring
provides:
  - FORK_SIGNAL_SCHEMA constant and tiered validation in frontmatter.cjs
  - --include support merged into all 4 init functions in init.cjs
  - gsd-tools.cjs reduced from 1,239 to 794 lines (fork overrides eliminated)
affects: [frontmatter-validate, init-execute-phase, init-plan-phase, init-todos, init-progress]
tech-stack:
  added: []
  patterns: [in-place-merge (upstream body + fork additions), tiered-validation-by-schema-properties]
key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/frontmatter.cjs
    - get-shit-done/bin/lib/init.cjs
    - get-shit-done/bin/gsd-tools.cjs
key-decisions:
  - "Tiered validation detection by schema properties (conditional/recommended), not schema name — future-proof for new tiered schemas"
  - "Merge strategy: edit upstream function bodies in-place (add includes param + content loading block), never wholesale-replace"
  - "priority default uses MEDIUM (uppercase) to match upstream test fixture expectations"
patterns-established:
  - "In-place merge: preserve upstream function body exactly, append fork extension block before output() call"
  - "Schema-property-based dispatch: detect tiered vs simple validation by checking schema.conditional/schema.recommended"
duration: 9min
completed: 2026-03-20
---

# Phase 48 Plan 01: Module Extensions (Signal Schema + Init --include) Summary

**Signal schema and tiered validation moved into frontmatter.cjs; fork init --include support merged into init.cjs; gsd-tools.cjs reduced by 445 lines to 794 total.**

## Performance
- **Duration:** 9min
- **Tasks:** 2 completed
- **Files modified:** 3

## Accomplishments
- Added `FORK_SIGNAL_SCHEMA` constant to frontmatter.cjs with `signal` entry in `FRONTMATTER_SCHEMAS`
- Extended `cmdFrontmatterValidate` with tiered validation path (conditional requirements, backward_compat, recommended fields) detected by schema properties
- Simple schemas (plan/summary/verification) produce identical output to before — no `warnings` field
- Signal schema produces output with `warnings` array
- Merged `--include` support into `cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitProgress` (new `includes` parameter + content loading block)
- Enriched `cmdInitTodos` with `priority`, `source`, `status` fields per todo item
- Removed fork init overrides section (4 functions, ~340 lines) from gsd-tools.cjs
- Removed fork frontmatter validation section (FORK_SIGNAL_SCHEMA + cmdForkFrontmatterValidate, ~103 lines) from gsd-tools.cjs
- Rewired dispatcher: all 4 init subcommands now call `init.cmdInitXxx()`, frontmatter validate now calls `frontmatter.cmdFrontmatterValidate()`
- All upstream fields verified to survive the merge (no field loss)

## Task Commits
1. **Task 1: Extend frontmatter.cjs with signal schema and tiered validation** - `780509a`
2. **Task 2: Merge fork init functions into init.cjs and rewire dispatcher** - `efe66e4`

## Files Created/Modified
- `get-shit-done/bin/lib/frontmatter.cjs` - Added FORK_SIGNAL_SCHEMA, signal entry in FRONTMATTER_SCHEMAS, tiered validation code path in cmdFrontmatterValidate
- `get-shit-done/bin/lib/init.cjs` - Updated imports, extended 4 functions with includes parameter and --include content loading blocks, enriched cmdInitTodos with priority/source/status
- `get-shit-done/bin/gsd-tools.cjs` - Removed fork init overrides section, removed fork frontmatter section, updated header comment, rewired dispatcher calls

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed priority default case to uppercase MEDIUM**
- **Found during:** Task 2 - upstream test failure after merge
- **Issue:** Plan specified `'medium'` (lowercase) as default for priority in cmdInitTodos, but upstream test fixture asserts `'MEDIUM'` (uppercase)
- **Fix:** Changed default from `'medium'` to `'MEDIUM'` in init.cjs to match upstream test expectations
- **Files modified:** `get-shit-done/bin/lib/init.cjs`
- **Commit:** efe66e4 (included in task 2 commit)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 48 Plan 02 (MOD-11: verification) can now proceed. The three files modified by 48-01 are the verification targets:
- `frontmatter.cjs` has FORK_SIGNAL_SCHEMA and tiered validation
- `init.cjs` has merged functions with --include support and all upstream fields
- `gsd-tools.cjs` has no fork init overrides and no fork frontmatter override
All 534 tests pass confirming behavioral equivalence.
