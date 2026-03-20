# Phase 47: Fork Module Extraction - Context

**Gathered:** 2026-03-20
**Status:** Ready for research

<domain>
## Phase Boundary

Extract the fork's inline command functions from `gsd-tools.cjs` into 5 dedicated modules (`sensors.cjs`, `backlog.cjs`, `manifest.cjs`, `automation.cjs`, `health-probe.cjs`) in `get-shit-done/bin/lib/`, each owning a coherent command set with no cross-module circular dependencies. Remove dead code (duplicate frontmatter helpers already in `frontmatter.cjs`).

**What this phase does NOT include:**
- Extending `frontmatter.cjs` or `init.cjs` with fork capabilities (Phase 48)
- Moving fork init overrides (`cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitTodos`, `cmdInitProgress`) out of `gsd-tools.cjs` (Phase 48)
- Moving fork command overrides (`cmdForkFrontmatterValidate`, `cmdForkListTodos`, `cmdForkConfigSet`, `cmdForkConfigGet`) — these stay inline until Phase 48
- Config migration or new feature adoption (Phases 49+)

</domain>

<assumptions>
## Working Model & Assumptions

**A1. The 5 new modules have no inter-dependencies.**
The fork's inline functions group cleanly into 5 command domains (sensors, backlog, manifest, automation, health-probe). Each group depends on `core.cjs` and optionally `frontmatter.cjs`, but none depend on each other.
- *Validate by:* Tracing all function calls within each group and confirming no cross-group calls exist.
- *Falsified if:* An automation command calls a backlog helper, or a health-probe function references manifest constants.

**A2. Frontmatter helpers in gsd-tools.cjs are duplicates of frontmatter.cjs exports.**
`extractFrontmatter()`, `reconstructFrontmatter()`, `spliceFrontmatter()`, and `parseMustHavesBlock()` are defined in both `gsd-tools.cjs` (lines 44-256) and `get-shit-done/bin/lib/frontmatter.cjs`. The upstream module versions are authoritative. New fork modules should `require('./frontmatter.cjs')` instead of carrying copies.
- *Validate by:* Diffing the two implementations to confirm they are identical or functionally equivalent.
- *Falsified if:* The fork's copy has behavioral differences that downstream commands rely on.

**A3. KB helpers belong exclusively to health-probe.cjs.**
`resolveKBDir()`, `findLatestRegimeChange()`, and `collectRegimeSignals()` (lines 1744-1873) are called only by health-probe commands. They are not shared with automation or any other command group.
- *Validate by:* Grep confirms only health-probe functions call these helpers. Already done: automation does NOT call them.
- *Falsified if:* Future research discovers indirect usage through a helper chain.

**A4. Tests remain insulated from module extraction.**
All tests invoke `gsd-tools.cjs` via subprocess (`execSync`). No test file `require()`s inline functions directly. Module extraction is invisible to tests as long as CLI behavior is identical.
- *Validate by:* Confirming no test file imports from `gsd-tools.cjs` or any `lib/*.cjs` module directly.
- *Falsified if:* Any test directly imports fork functions.

**A5. Dead code removal is safe.**
`parseMustHavesBlock()` in gsd-tools.cjs (line 192) is defined but never called — it's dead code. The authoritative copy lives in `frontmatter.cjs` and is used by `verify.cjs`. Similarly, `extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter` in gsd-tools.cjs are duplicates that will become unused once backlog commands import from `frontmatter.cjs`.
- *Validate by:* Grep for all call sites of these functions in gsd-tools.cjs — confirm all callers move to modules that import from frontmatter.cjs.
- *Falsified if:* An inline function that stays in gsd-tools.cjs calls one of these helpers.

</assumptions>

<decisions>
## Implementation Decisions

### Module-to-function assignment (from requirements MOD-04 through MOD-08)

| Module | Commands | Helpers/Constants |
|--------|----------|-------------------|
| `sensors.cjs` | `cmdSensorsList`, `cmdSensorsBlindSpots` | None |
| `backlog.cjs` | `cmdBacklogAdd`, `cmdBacklogList`, `cmdBacklogUpdate`, `cmdBacklogStats`, `cmdBacklogGroup`, `cmdBacklogPromote`, `cmdBacklogIndex` | `resolveBacklogDir`, `readBacklogItems` |
| `manifest.cjs` | `cmdManifestDiffConfig`, `cmdManifestValidate`, `cmdManifestGetPrompts`, `cmdManifestApplyMigration`, `cmdManifestLogMigration`, `cmdManifestAutoDetect` | `KNOWN_TOP_LEVEL_KEYS`, `coerceValue`, `formatMigrationEntry` |
| `automation.cjs` | `cmdAutomationResolveLevel`, `cmdAutomationTrackEvent`, `cmdAutomationLock`, `cmdAutomationUnlock`, `cmdAutomationCheckLock`, `cmdAutomationRegimeChange`, `cmdAutomationReflectionCounter` | `FEATURE_CAPABILITY_MAP` (exported) |
| `health-probe.cjs` | `cmdHealthProbeSignalMetrics`, `cmdHealthProbeSignalDensity`, `cmdHealthProbeAutomationWatchdog` | `resolveKBDir`, `findLatestRegimeChange`, `collectRegimeSignals` |

### What remains in gsd-tools.cjs after extraction

- **Requires block** (lines 1-41): Updated to add 5 new module requires
- **validateFieldType/validateFieldEnum** (lines 258-272): Used by inline `cmdForkFrontmatterValidate`
- **Fork init overrides** (lines 684-1025): `cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitTodos`, `cmdInitProgress` — stay until Phase 48
- **Fork command overrides** (lines 2374-2579): `cmdForkFrontmatterValidate`, `cmdForkListTodos`, `cmdForkConfigSet`, `cmdForkConfigGet` — stay inline
- **CLI Router** (lines 2581-3200): Updated to route through module functions

### Dead code removal

Remove from gsd-tools.cjs after extraction:
- `extractFrontmatter()` (lines 44-117) — duplicate of `frontmatter.cjs`
- `reconstructFrontmatter()` (lines 119-181) — duplicate of `frontmatter.cjs`
- `spliceFrontmatter()` (lines 183-190) — duplicate of `frontmatter.cjs`
- `parseMustHavesBlock()` (lines 192-256) — dead code, never called in gsd-tools.cjs

### Claude's Discretion
- Extraction order across plans (dependency order is flat — all 5 can go in any sequence)
- Whether to extract all 5 modules in one plan or split across multiple
- Internal organization within each module file (section ordering, comments)
- Whether `cmdForkFrontmatterValidate` should import `extractFrontmatter` from frontmatter.cjs (even though it stays inline) to enable dead code removal of the duplicate

</decisions>

<constraints>
## Derived Constraints

### From Phase 46 (completed 2026-03-20)
- `gsd-tools.cjs` is 3,200 lines with 11 upstream modules already in `lib/`
- The `module.exports.funcName` extension pattern was established for adding fork helpers to `core.cjs` — same pattern applies for new module exports
- Dispatcher uses `switch/case` with `module.cmdXxx(cwd, ..., raw)` calling convention
- 534 tests pass (350 vitest + 174 upstream + 10 fork) — this is the baseline
- core.cjs exports 24 functions (20 upstream + 4 fork helpers)
- Installer handles `lib/` subdirectory correctly (verified in Phase 46)

### From Phase 46 decisions
- Fork overrides use `module.exports.funcName` extension pattern, not modification of upstream exports block
- Fork init overrides remain inline — `cmdInitTodos` is the sole init fork override confirmed present

### From requirements
- **MOD-04**: sensors.cjs with `cmdSensorsList` and `cmdSensorsBlindSpots`
- **MOD-05**: backlog.cjs with 7 backlog command functions and 3 helpers
- **MOD-06**: manifest.cjs with 6 manifest command functions and 5 helpers
- **MOD-07**: automation.cjs with 7 automation command functions and `FEATURE_CAPABILITY_MAP`
- **MOD-08**: health-probe.cjs with 3 probe functions and 3 KB helpers

### From codebase reality (verified 2026-03-20)
- `frontmatter.cjs` already exports: `extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter`, `parseMustHavesBlock` — new modules should import from here, not duplicate
- KB helpers (`resolveKBDir`, `findLatestRegimeChange`, `collectRegimeSignals`) are called ONLY by health-probe commands — no shared dependency
- `FEATURE_CAPABILITY_MAP` is used ONLY by `cmdAutomationResolveLevel` — belongs in automation.cjs
- `KNOWN_TOP_LEVEL_KEYS`, `coerceValue`, `formatMigrationEntry` are used ONLY by manifest commands
- Inline `cmdForkFrontmatterValidate` uses `extractFrontmatter` (1 call at line 2387) and `validateFieldType`/`validateFieldEnum` — these must remain accessible after extraction

### From package/installer
- `package.json` `files` array includes `get-shit-done` directory — new modules auto-included in npm package
- `bin/install.js` uses `rmSync` + `copyWithPathReplacement` which handles nested `lib/` directory

</constraints>

<questions>
## Open Questions

### Q1. Are the duplicate frontmatter helpers identical?
- **Type:** material
- **Question:** Are `extractFrontmatter()`, `reconstructFrontmatter()`, `spliceFrontmatter()` in `gsd-tools.cjs` byte-identical to the versions in `frontmatter.cjs`? Or did the fork diverge?
- **Why it matters:** If identical, new modules simply `require('./frontmatter.cjs')` and the gsd-tools.cjs copies are safely removed. If divergent, we need to determine which version is correct and whether `frontmatter.cjs` needs updating.
- **Downstream decision:** Whether dead code removal is a simple deletion or requires frontmatter.cjs reconciliation
- **Reversibility:** High — can always keep both copies temporarily
- **Research should:** Diff the implementations line-by-line.

### Q2. Does cmdForkFrontmatterValidate need its own extractFrontmatter?
- **Type:** formal
- **Question:** After removing the duplicate `extractFrontmatter` from gsd-tools.cjs, can inline `cmdForkFrontmatterValidate` import it from `frontmatter.cjs` at the module level (it's already required at line 40)?
- **Why it matters:** If `cmdForkFrontmatterValidate` can use the already-required `frontmatter` module, the duplicate helper is cleanly removable. If it needs a different version, the duplicate must stay.
- **Downstream decision:** Whether all 4 duplicate helpers can be removed in Phase 47 or only 3
- **Reversibility:** High
- **Research should:** Check if `cmdForkFrontmatterValidate` calls `extractFrontmatter` with the same contract as `frontmatter.cjs`'s version. Already requires `frontmatter.cjs` at line 40 — just needs `frontmatter.extractFrontmatter(content)` instead of bare `extractFrontmatter(content)`.

### Q3. What is the expected line count after extraction?
- **Type:** efficient
- **Question:** How many lines should gsd-tools.cjs have after Phase 47 extraction? Current estimate: ~1,200 lines (header + validate helpers + init overrides + fork command overrides + router).
- **Why it matters:** A concrete target helps verification — if the file is significantly larger, something wasn't extracted.
- **Downstream decision:** Verification criteria for plan completion
- **Reversibility:** N/A (informational)
- **Research should:** Count precisely: which lines stay, which move, which are deleted.

### Q4. Should `FEATURE_CAPABILITY_MAP` be exported from automation.cjs?
- **Type:** formal
- **Question:** The roadmap requirement MOD-07 says automation.cjs "exports FEATURE_CAPABILITY_MAP". Currently it's only used internally by `cmdAutomationResolveLevel`. Should it be exported for external consumption (e.g., by Phase 53's deep integration)?
- **Why it matters:** If exported, other modules or future phases can import it. If kept internal, it's an implementation detail.
- **Downstream decision:** Module's public API surface
- **Reversibility:** High — can always export later
- **Research should:** Check if any code outside the automation command group references `FEATURE_CAPABILITY_MAP` or if Phase 53 requirements suggest external consumers.

</questions>

<guardrails>
## Epistemic Guardrails

**1. Verify frontmatter helper equivalence before deleting duplicates**
Do not assume the copies in gsd-tools.cjs and frontmatter.cjs are identical just because they look similar. Diff them. The fork may have added edge-case handling that upstream lacks.

**2. Behavioral equivalence is the primary gate**
Every command must produce identical CLI output before and after extraction. The test suite (534 tests) is the primary verification mechanism. Structural correctness (clean modules) is means, not ends.

**3. Do not extract fork init overrides or fork command overrides**
These belong to Phase 48. Extracting them now would violate phase boundary. They stay inline in gsd-tools.cjs even though it would be "cleaner" to move them.

**4. Verify each module's require chain is acyclic**
New modules require `core.cjs` and `frontmatter.cjs`. Neither of those should require the new modules. Circular dependencies would cause Node.js require failures.

**5. Validate the inline functions that stay in gsd-tools.cjs still work**
After removing duplicate helpers, the remaining inline functions (`cmdForkFrontmatterValidate`, `cmdForkListTodos`, `cmdForkConfigSet`, `cmdForkConfigGet`) must still have access to all helpers they need. `validateFieldType`/`validateFieldEnum` stay inline. `extractFrontmatter` can come from the already-required `frontmatter` module.

**6. Installer verification is required**
After extraction, run `node bin/install.js --local` and verify all 16 modules (11 upstream + 5 fork) appear in `.claude/get-shit-done-reflect/bin/lib/`.

</guardrails>

<specifics>
## Specific Ideas

**From Phase 46 execution patterns:**
- Phase 46 used `module.exports.funcName` extension pattern for core.cjs — same pattern for new module exports
- Phase 46 dispatcher rewiring followed: copy modules → update requires → rewire dispatcher → verify tests → remove dead code
- Phase 46 gap closure (plan 46-04) was needed because init.cjs routing was deferred — avoid creating similar gaps by extracting both functions AND dispatcher routing in the same plan

**Current line map of gsd-tools.cjs (3,200 lines):**
- Lines 1-41: Header + requires (stays, update with 5 new requires)
- Lines 42-256: Duplicate frontmatter helpers + dead code (REMOVE)
- Lines 258-272: validateFieldType/Enum (stays, used by inline fork override)
- Lines 274-347: Constants + helpers for manifest/automation (EXTRACT)
- Lines 349-682: Backlog helpers + commands (EXTRACT → backlog.cjs)
- Lines 684-1025: Fork init overrides (stays — Phase 48)
- Lines 1026-1360: Manifest commands (EXTRACT → manifest.cjs)
- Lines 1361-1743: Automation commands (EXTRACT → automation.cjs)
- Lines 1744-1873: KB helpers (EXTRACT → health-probe.cjs)
- Lines 1875-2218: Health probe commands (EXTRACT → health-probe.cjs)
- Lines 2219-2373: Sensor commands (EXTRACT → sensors.cjs)
- Lines 2374-2579: Fork command overrides (stays — Phase 48)
- Lines 2581-3200: CLI Router (stays, update routing)

**Estimated result:** gsd-tools.cjs drops from 3,200 → ~1,200 lines

</specifics>

<deferred>
## Deferred Ideas

- **Fork init override extraction** (cmdInitExecutePhase, cmdInitPlanPhase, cmdInitTodos, cmdInitProgress) — Phase 48
- **Fork command override extraction** (cmdForkFrontmatterValidate, cmdForkListTodos, cmdForkConfigSet, cmdForkConfigGet) — Phase 48
- **Frontmatter.cjs signal schema extension** (tiered validation) — Phase 48
- **Init.cjs --include flag extension** — Phase 48
- **Upstream test adoption** (node:test files that test module exports directly) — deferred requirement FUT-03

</deferred>

---

*Phase: 47-fork-module-extraction*
*Context gathered: 2026-03-20*
