# Phase 48: Module Extensions & Verification - Context

**Gathered:** 2026-03-20
**Status:** Ready for research

<domain>
## Phase Boundary

Extend upstream's `frontmatter.cjs` with the fork's signal schema and tiered validation, extend `init.cjs` with the fork's `--include` flag and modified init functions, and verify the entire modularization (Phases 45-48) is behaviorally equivalent to the pre-modularization monolith. All remaining fork overrides in `gsd-tools.cjs` should be absorbed into their natural module homes, leaving gsd-tools.cjs as a pure CLI router.

**What this phase does NOT include:**
- Config migration or depth-to-granularity rename (Phase 49)
- Migration test hardening (Phase 50)
- New feature adoption from upstream (Phase 52)
- Any new commands or capabilities

</domain>

<assumptions>
## Working Model & Assumptions

**A1. Frontmatter signal schema can be integrated into frontmatter.cjs's existing validate function.**
The fork's `cmdForkFrontmatterValidate` in gsd-tools.cjs (lines 413-492) already delegates non-signal schemas to `frontmatter.cmdFrontmatterValidate`. The signal schema's tiered validation (required/conditional/recommended) is a superset of the upstream schema's required-only pattern. Extending `frontmatter.cjs`'s `FRONTMATTER_SCHEMAS` and `cmdFrontmatterValidate` to handle tiered validation should be possible without breaking upstream schema validation for plan/summary/verification types.
- *Validate by:* Checking whether upstream's `cmdFrontmatterValidate` can be extended to handle conditional/recommended fields without changing its output contract for existing schema types.
- *Falsified if:* The tiered validation output format (with `warnings` array) is incompatible with existing callers that expect only `valid`/`missing`/`present`.

**A2. Init function signature divergence is additive.**
The fork's init overrides (`cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitProgress`) add an `includes` parameter and file content loading that upstream's versions lack. The fork's `cmdInitTodos` adds `priority`/`source`/`status` fields. These are strictly additive — the upstream versions are a subset.
- *Validate by:* Confirming no upstream caller depends on the 3-param signature or on the absence of include-related fields.
- *Falsified if:* An upstream test or module asserts specific output shape that the fork's enriched output would violate.

**A3. Fork command overrides (list-todos, config-set, config-get) can move to their upstream module counterparts.**
`cmdForkListTodos` enriches upstream's `list-todos` with priority/source/status fields — could extend commands.cjs. `cmdForkConfigSet`/`cmdForkConfigGet` add dot-notation nested key access — could extend config.cjs.
- *Validate by:* Checking that commands.cjs and config.cjs don't already export conflicting function names.
- *Falsified if:* Upstream already has `cmdConfigSet`/`cmdConfigGet` with different semantics.

**A4. Tests remain insulated from module changes.**
All tests invoke `gsd-tools.cjs` via subprocess. No test directly `require()`s init.cjs, frontmatter.cjs, or any module. Module-internal restructuring is invisible as long as CLI behavior is identical.
- *Validate by:* Grep test files for direct module requires.
- *Falsified if:* Fork-specific tests (10 tests) import from lib/*.cjs directly.

</assumptions>

<decisions>
## Implementation Decisions

### Signal schema integration (MOD-09)

- Move `FORK_SIGNAL_SCHEMA` from gsd-tools.cjs into frontmatter.cjs
- Extend `FRONTMATTER_SCHEMAS` to include the signal schema entry
- Extend `cmdFrontmatterValidate` to handle tiered validation (conditional/recommended fields) when processing the signal schema
- The output contract for signal validation includes `warnings` array alongside `valid`/`missing`/`present` — this is additive to the upstream format
- Remove `cmdForkFrontmatterValidate` from gsd-tools.cjs after integration
- The dispatcher's `frontmatter validate --schema signal` route goes directly to `frontmatter.cmdFrontmatterValidate` instead of fork override

### Init function consolidation (MOD-10)

- Replace upstream's 3-param init functions in init.cjs with the fork's 4-param versions that accept `includes`
- Functions to move: `cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitProgress`, `cmdInitTodos`
- init.cjs gains `require('./core.cjs')` for `parseIncludeFlag`, `safeReadFile`, `toPosixPath` (already has most core imports)
- The dispatcher calls `init.cmdInitExecutePhase(cwd, phase, includes, raw)` directly instead of local overrides
- Remove fork init overrides from gsd-tools.cjs

### Claude's Discretion
- Whether to refactor the existing upstream init functions or replace them wholesale with the fork's enriched versions
- How to organize the signal schema within frontmatter.cjs (inline object vs separate declaration)
- Whether backward_compat logic warrants its own helper function or stays inline in the validate function
- Whether to batch all extractions in one plan or split frontmatter/init/command-overrides across plans

</decisions>

<constraints>
## Derived Constraints

### From Phase 47 (completed 2026-03-20)
- gsd-tools.cjs is 1,239 lines: header (47 lines) + fork init overrides (lines 48-388, ~341 lines) + fork command overrides (lines 390-618, ~229 lines) + CLI router (lines 620-1239, ~619 lines)
- 16 modules exist in lib/ (11 upstream + 5 fork-extracted)
- All 534 tests pass (350 vitest + 174 upstream + 10 fork) — this is the baseline
- frontmatter.cjs is 299 lines, init.cjs is 710 lines
- `module.exports.funcName` extension pattern established for adding fork functionality

### From Phase 46 decisions
- Fork init overrides use 4-param signature: `(cwd, phase|area, includes, raw)` — upstream uses 3-param `(cwd, phase|area, raw)`
- `parseIncludeFlag` is already in core.cjs for shared access
- init.cjs already imports from core.cjs (`loadConfig`, `resolveModelInternal`, `findPhaseInternal`, etc.)

### From codebase reality (verified 2026-03-20)

**What moves to frontmatter.cjs:**
- `FORK_SIGNAL_SCHEMA` constant (lines 392-411) — defines required, conditional, recommended, optional fields
- Tiered validation logic from `cmdForkFrontmatterValidate` (lines 413-492) — handles backward_compat, evidence content validation

**What moves to init.cjs:**
- `cmdInitExecutePhase` (lines 50-120) — adds `includes` parameter, loads state/config/roadmap content on demand
- `cmdInitPlanPhase` (lines 122-216) — adds `includes` parameter, loads state/roadmap/requirements/context/research/verification/uat content
- `cmdInitTodos` (lines 218-281) — adds priority/source/status fields to todo items
- `cmdInitProgress` (lines 283-388) — adds `includes` parameter, loads state/roadmap/project/config content

**What moves to upstream module counterparts (scope to be confirmed):**
- `cmdForkListTodos` (lines 496-537) — enriched list-todos with priority/source/status
- `cmdForkConfigSet` (lines 541-589) — dot-notation nested key config set
- `cmdForkConfigGet` (lines 591-618) — dot-notation nested key config get

### From requirements
- **MOD-09**: frontmatter.cjs extended with signal schema (tiered validation: required/conditional/recommended)
- **MOD-10**: init.cjs extended with fork's --include flag and init function modifications
- **MOD-11**: All existing tests pass after modularization with zero behavioral changes
- The requirements reference "278 vitest tests" but actual baseline is 534 total (350 vitest + 174 upstream + 10 fork)

### From research flags (STATE.md)
- "init function signature compatibility needs validation during Phase 48" — the 3-param to 4-param change in init.cjs is the core of MOD-10

### From package/installer
- No new modules are created — only existing modules are extended
- init.cjs and frontmatter.cjs are already in the npm package and installed by `bin/install.js`

</constraints>

<questions>
## Open Questions

### Q1. Should fork command overrides (list-todos, config-set, config-get) also move?
- **Type:** formal
- **Question:** Phase 47 deferred these to Phase 48, but Phase 48's requirements (MOD-09, MOD-10, MOD-11) only mention frontmatter.cjs and init.cjs extensions. Should `cmdForkListTodos` → commands.cjs and `cmdForkConfigSet`/`cmdForkConfigGet` → config.cjs also be extracted in this phase?
- **Why it matters:** If they move, gsd-tools.cjs becomes a pure router (~619 lines). If they stay, ~229 lines of fork overrides remain inline.
- **Downstream decision:** Final gsd-tools.cjs size and whether Phase 49+ needs to account for remaining inline code
- **Reversibility:** High — can always extract later
- **Research should:** Check if commands.cjs already has a `cmdListTodos` function and if config.cjs has `cmdConfigSet`/`cmdConfigGet` that would conflict. Determine whether extracting these is a natural scope extension of "verification" or scope creep.

### Q2. How should frontmatter.cjs handle tiered vs simple validation?
- **Type:** formal
- **Question:** The current upstream `cmdFrontmatterValidate` only handles `required` field checks. The fork's signal schema adds `conditional`, `recommended`, `backward_compat`, and `optional` tiers. Should the validate function be generalized to handle tiered schemas for all types, or should signal be a special case with its own code path?
- **Why it matters:** Generalized tiered validation is more maintainable if future schemas need conditional fields. A special case is simpler but creates two validation paths.
- **Downstream decision:** How to structure `FRONTMATTER_SCHEMAS` entries and the validate function logic
- **Reversibility:** High — internal refactor, no API change
- **Research should:** Check whether any existing schema types (plan, summary, verification) would benefit from conditional/recommended tiers, or whether signal is uniquely complex.

### Q3. Can upstream init.cjs functions be replaced wholesale?
- **Type:** material
- **Question:** The fork's init functions are strict supersets of upstream's (same base output + includes support + enriched fields). Can the upstream 3-param functions be replaced with fork 4-param functions directly, or do we need both versions?
- **Why it matters:** If upstream callers exist that pass exactly 3 args and expect no `includes` handling, the 4-param version must gracefully handle `undefined` for includes. If no upstream callers exist (all routing goes through the dispatcher), replacement is safe.
- **Downstream decision:** Whether init.cjs contains 1 version or 2 versions of each function
- **Reversibility:** Medium — reverting would require restoring both the upstream and fork versions
- **Research should:** Grep for any code that calls `init.cmdInit*` directly (not through the dispatcher). Check if the 4-param functions handle `undefined` includes gracefully.

### Q4. What is the expected gsd-tools.cjs line count after Phase 48?
- **Type:** efficient
- **Question:** After extracting all fork overrides, gsd-tools.cjs should be header (few lines for requires) + CLI router. What is the precise expected size?
- **Why it matters:** A concrete target helps verification.
- **Downstream decision:** Verification criteria
- **Reversibility:** N/A (informational)
- **Research should:** Count precisely which lines stay, which move, which are deleted. If command overrides also move, estimate ~620-670 lines. If only init + frontmatter move, estimate ~850-870 lines.

</questions>

<guardrails>
## Epistemic Guardrails

**1. Verify output contract compatibility before extending frontmatter.cmdFrontmatterValidate.**
The extended validate function for signal schema returns a `warnings` array that upstream's validate does not. Verify that no caller of `frontmatter validate` for plan/summary/verification schemas breaks when the output shape potentially changes. The safest approach is to only add `warnings` for the signal schema path.

**2. Verify init function signature compatibility in both directions.**
After replacing 3-param functions with 4-param versions in init.cjs, verify: (a) the dispatcher passes includes correctly, (b) upstream init functions that are NOT overridden (`cmdInitNewProject`, `cmdInitNewMilestone`, `cmdInitQuick`, etc.) still work with their existing signatures, (c) no test relies on the specific output shape of the old functions.

**3. Run all 534 tests after each extraction, not just after the final change.**
Phase 46's gap closure (plan 46-04) was needed because init routing was deferred. Extract + verify in tight loops, not big-bang.

**4. Do not modify upstream functions that are not being extended.**
`cmdInitNewProject`, `cmdInitNewMilestone`, `cmdInitQuick`, `cmdInitResume`, `cmdInitVerifyWork`, `cmdInitPhaseOp`, `cmdInitMilestoneOp`, `cmdInitMapCodebase` remain as-is in init.cjs. Only the 4 fork-overridden functions change.

**5. Validate the dispatcher routes correctly after extraction.**
After moving fork overrides into modules, the dispatcher's `init` case must call `init.cmdInit*` for ALL init subcommands (no more local function references). Verify each route produces identical output.

**6. Confirm no circular dependencies introduced.**
frontmatter.cjs should not require anything that requires frontmatter.cjs. init.cjs's additional core.cjs imports (if any) must not create cycles.

</guardrails>

<specifics>
## Specific Ideas

**From Phase 47 deferred items (explicit Phase 48 scope):**
- Fork init override extraction (cmdInitExecutePhase, cmdInitPlanPhase, cmdInitTodos, cmdInitProgress) — deferred from Phase 47
- Fork command override extraction (cmdForkFrontmatterValidate, cmdForkListTodos, cmdForkConfigSet, cmdForkConfigGet) — deferred from Phase 47
- Frontmatter.cjs signal schema extension (tiered validation) — deferred from Phase 47
- Init.cjs --include flag extension — deferred from Phase 47

**Current line map of gsd-tools.cjs (1,239 lines):**
- Lines 1-47: Header + requires (stays, update to remove local function calls)
- Lines 48-120: Fork init: cmdInitExecutePhase (EXTRACT → init.cjs)
- Lines 122-216: Fork init: cmdInitPlanPhase (EXTRACT → init.cjs)
- Lines 218-281: Fork init: cmdInitTodos (EXTRACT → init.cjs)
- Lines 283-388: Fork init: cmdInitProgress (EXTRACT → init.cjs)
- Lines 390-492: Fork frontmatter: FORK_SIGNAL_SCHEMA + cmdForkFrontmatterValidate (EXTRACT → frontmatter.cjs)
- Lines 494-537: Fork list-todos: cmdForkListTodos (EXTRACT → commands.cjs if in scope)
- Lines 539-618: Fork config: cmdForkConfigSet, cmdForkConfigGet (EXTRACT → config.cjs if in scope)
- Lines 620-1239: CLI Router (stays, update routing)

**Estimated result (if all overrides extracted):** gsd-tools.cjs drops from 1,239 → ~640-670 lines (pure router)

</specifics>

<deferred>
## Deferred Ideas

- Config migration depth→granularity — Phase 49
- Migration test hardening — Phase 50
- Upstream test adoption (node:test files testing module exports directly) — deferred requirement FUT-03

</deferred>

---

*Phase: 48-module-extensions-verification*
*Context gathered: 2026-03-20*
