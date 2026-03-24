# Phase 46: Upstream Module Adoption - Context

**Gathered:** 2026-03-19
**Status:** Ready for research

<domain>
## Phase Boundary

Adopt upstream's 11 `lib/*.cjs` modules into `get-shit-done/bin/lib/`, rewrite the CLI dispatcher in `gsd-tools.cjs` to `require()` those modules instead of defining command handlers inline, and extract 4 shared helpers (`loadManifest`, `loadProjectConfig`, `atomicWriteJson`, `parseIncludeFlag`) into `core.cjs` so downstream fork modules (Phase 47) can import them.

**What this phase does NOT include:**
- Extracting fork-specific functions into new modules (Phase 47)
- Extending `frontmatter.cjs` or `init.cjs` with fork capabilities (Phase 48)
- Creating new fork modules like `backlog.cjs`, `sensors.cjs`, etc. (Phase 47)

Fork-specific command handlers remain in `gsd-tools.cjs` temporarily. They are called by the dispatcher's fork-specific `case` blocks but are not yet extracted into their own modules.

</domain>

<assumptions>
## Working Model & Assumptions

**A1. Upstream modules are adoptable wholesale.**
The modular migration research (2026-03-10) recommends taking upstream's 11 modules as-is rather than reconciling function-level differences. The fork's monolith contains older copies of the same upstream functions. Adopting current upstream modules is an intentional upgrade.
- *Validate by:* Comparing upstream module function signatures against the fork's monolith copies. If signatures diverge, the dispatcher calling convention may need adjustment.
- *Falsified if:* Upstream modules depend on new core.cjs exports that don't exist in the fork, or upstream changed function signatures in ways the fork's dispatcher doesn't expect.

**A2. The dispatcher rewrite preserves all fork command routing.**
Upstream's dispatcher handles upstream commands only. The fork's dispatcher must additionally route backlog, manifest, automation, sensors, and health-probe commands. These fork cases must be retained in the rewritten dispatcher.
- *Validate by:* Enumerating all `case` blocks in the current fork dispatcher and confirming each has a target in either an upstream module or the remaining inline fork functions.
- *Falsified if:* Upstream restructured its command routing in a way that conflicts with the fork's case structure.

**A3. Tests are insulated from the refactoring.**
All fork tests (vitest and node:test) invoke `gsd-tools.cjs` as a subprocess via `execSync`. They never `require()` modules directly. Module extraction is invisible to them as long as CLI behavior is identical.
- *Validate by:* Confirming no test file uses `require()` on `gsd-tools.cjs` or any `lib/*.cjs` module.
- *Falsified if:* Any test directly imports from the monolith.

**A4. The 4 shared helpers can be added to core.cjs as pure extensions.**
`loadManifest()`, `loadProjectConfig()`, `atomicWriteJson()`, and `parseIncludeFlag()` are currently defined in the fork's monolith. Adding them to `core.cjs` exports should not conflict with upstream's existing exports.
- *Validate by:* Reading upstream's `core.cjs` export list and confirming no name collisions.
- *Falsified if:* Upstream already exports functions with the same names but different signatures.

</assumptions>

<decisions>
## Implementation Decisions

### Module adoption strategy
- Take upstream's 11 modules wholesale from `upstream/main:get-shit-done/bin/lib/` — do not cherry-pick or reconcile individual functions
- This is an upgrade: upstream has had bug fixes and improvements the fork lacks

### Fork command handlers: temporary inline retention
- Fork-specific functions (backlog, manifest, automation, sensors, health-probe) stay defined in `gsd-tools.cjs` for now
- The dispatcher routes fork commands to these inline functions, not to modules
- Phase 47 will extract them into dedicated modules

### Claude's Discretion
- Exact dispatcher structure (switch/case, function map, or hybrid)
- Whether to adopt upstream's dispatcher verbatim and extend it, or write a new one that merges both
- Ordering of module extraction within the plan (core.cjs extension before or after module adoption)
- Whether to adopt upstream's module-level tests alongside the modules

</decisions>

<constraints>
## Derived Constraints

### From Phase 45 (completed 2026-03-19)
- `gsd-tools.cjs` is the runtime entry point (rename complete, verified)
- All 66 source files reference `.cjs` — no `.js` references remain
- Installer regex `\bgsd-(?!tools)/g` is extension-agnostic — no installer changes needed for new `.cjs` modules in `lib/`
- Current test count is 354 vitest + 174 upstream + 10 fork tests

### From requirements
- **MOD-02**: Upstream's 11 `lib/*.cjs` modules adopted with dispatcher rewritten
- **MOD-03**: 4 shared helpers extracted to `core.cjs`
- The 11 upstream modules are: `commands.cjs`, `config.cjs`, `core.cjs`, `frontmatter.cjs`, `init.cjs`, `milestone.cjs`, `phase.cjs`, `roadmap.cjs`, `state.cjs`, `template.cjs`, `verify.cjs`

### From STATE.md research flags
- "upstream function drift magnitude unknown — may affect Phase 46 effort" — this is the primary risk factor

### From modular migration research
- Research recommends Step 1 (adopt modules) + Step 2 (extend core.cjs) as the sequence for Phase 46
- The dependency graph is acyclic: all modules depend on `core.cjs`, some on `frontmatter.cjs`, none depend on each other
- Upstream's dispatcher (`gsd-tools.cjs`) is ~592 lines vs the fork's ~6,651-line monolith

### From installer behavior (Phase 45 verification)
- `bin/install.js` uses `rmSync` + `copyWithPathReplacement` which automatically handles new subdirectories
- `package.json` `files` array includes `get-shit-done` directory — `lib/` subdirectory will be included in npm package automatically

</constraints>

<questions>
## Open Questions

### Q1. Upstream function drift magnitude
- **Type:** material
- **Question:** How many of the fork's copies of upstream functions have behavioral differences from the current upstream module versions? Which functions changed signatures?
- **Why it matters:** If drift is minimal, adoption is drop-in. If significant, the dispatcher calling convention or test expectations may need adjustment.
- **Downstream decision:** Determines whether Plan 01 is a straightforward copy or requires reconciliation work
- **Reversibility:** High — can always revert to monolith
- **Research should:** Diff each upstream module's exported function signatures against the fork's monolith copies. Enumerate behavioral changes (new parameters, changed return values, renamed functions).

### Q2. Upstream core.cjs export interface
- **Type:** formal
- **Question:** What does upstream's `core.cjs` currently export? Do any of the 4 fork helpers (`loadManifest`, `loadProjectConfig`, `atomicWriteJson`, `parseIncludeFlag`) collide with existing exports?
- **Why it matters:** Name collisions would require renaming or namespacing, changing the approach for Phase 47's module imports.
- **Downstream decision:** Whether helpers are added as new exports or need wrapper functions
- **Reversibility:** High
- **Research should:** Read upstream's `core.cjs` export list and compare against the 4 fork helper names.

### Q3. Upstream dispatcher structure
- **Type:** formal
- **Question:** How does upstream's `gsd-tools.cjs` dispatcher route commands to modules? Does it use a switch/case, a command registry, or a function map pattern?
- **Why it matters:** The fork must extend this pattern to also route fork-specific commands. Understanding the pattern determines whether we adopt-and-extend or rewrite.
- **Downstream decision:** Dispatcher design in Plan 01
- **Reversibility:** Medium — dispatcher design affects all subsequent phases
- **Research should:** Read upstream's `gsd-tools.cjs` dispatcher section and document the routing pattern.

### Q4. New upstream commands
- **Type:** material
- **Question:** Has upstream added new commands or subcommands in the 11 modules that the fork doesn't currently handle? (e.g., the recent `stats` command from commit 944df19)
- **Why it matters:** New commands must be routed by the dispatcher. If the fork's test suite doesn't cover them, they may silently break.
- **Downstream decision:** Whether new upstream commands are adopted or deferred
- **Reversibility:** High — new commands can be added later
- **Research should:** Compare upstream's command set (all `case` blocks across 11 modules) against the fork's current command set.

### Q5. Installer handling of lib/ subdirectory
- **Type:** efficient
- **Question:** Does `bin/install.js` correctly copy the `lib/` subdirectory when it copies `get-shit-done/bin/`? Or does it only copy files at the top level?
- **Why it matters:** If the installer doesn't handle subdirectories, the installed `.claude/` copy will be missing all modules.
- **Downstream decision:** Whether installer changes are needed in this phase
- **Reversibility:** High
- **Research should:** Read the `installSkills()` function in `bin/install.js` to confirm recursive directory copy behavior. Check if `copyWithPathReplacement` handles nested directories.

</questions>

<guardrails>
## Epistemic Guardrails

**1. Verify upstream module compatibility before committing to adoption** (from STATE.md research flag)
- Do not assume upstream modules are drop-in replacements. Research must enumerate function signature differences.
- "Upstream function drift magnitude unknown" is an explicit risk flag from roadmap creation.

**2. Verify assumptions against code, not descriptions** (from `sig-2026-02-23-installer-clobbers-force-tracked-files`, `sig-2026-03-01-plan-checker-misses-second-order-effects`)
- Claims about installer behavior must be verified against actual `installSkills()` code
- Claims about core.cjs exports must cite specific lines

**3. Plan for what the plan-checker can't see** (from `sig-2026-03-06-plan-verification-misses-architectural-gaps`)
- Installer's handling of nested `lib/` directory is an integration concern the plan-checker won't catch
- The dispatcher's fork-command routing is invisible to the plan-checker's requirement coverage check

**4. Behavioral equivalence is the primary gate, not structural correctness**
- The dispatcher rewrite must produce identical CLI output for all existing commands
- Structural changes (module boundaries) are means, not ends — tests validate behavior, not structure

**5. Fork-specific functions must remain callable after dispatcher rewrite**
- The monolith currently defines fork functions and calls them from the same file
- After the rewrite, the dispatcher `require()`s upstream modules but fork functions are still inline
- The dispatcher must correctly route to both `require()`d modules AND inline functions

</guardrails>

<specifics>
## Specific Ideas

**From modular migration research (MODULAR-MIGRATION.md):**
- Research recommends Steps 1-2 of the 7-step migration for this phase
- "Do NOT try to reconcile function-level differences at this step. Take upstream's modules wholesale."
- The fork's monolith structure is documented: shared helpers (lines 146-612), upstream functions (613-3776), fork functions (3778-6102), CLI router (6103-6651)
- Upstream's dispatcher is ~592 lines; target for the fork's dispatcher is ~700 lines (extra fork routing)

**From upstream codebase (confirmed via git show):**
- The 11 modules confirmed present at `upstream/main:get-shit-done/bin/lib/`
- Upstream has recent activity including `stats` command (944df19) and UI features (9481fdf)

</specifics>

<deferred>
## Deferred Ideas

- **Fork module extraction** (backlog, sensors, manifest, automation, health-probe) — Phase 47
- **Upstream module extensions** (frontmatter signal schema, init --include flag) — Phase 48
- **Upstream test adoption** (12 node:test files that test module exports directly) — deferred requirement FUT-03
- **New upstream feature adoption** (stats command, UI features) — Phase 52

</deferred>

---

*Phase: 46-upstream-module-adoption*
*Context gathered: 2026-03-19*
