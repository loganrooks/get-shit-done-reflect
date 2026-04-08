# Upstream Drift Survey — 2026-04-08

**Surveyed by:** Claude Sonnet 4.6 (automated)
**Baseline:** v1.30.0 (commit `0fde35ac`, 2026-03-27, fork audit freeze)
**Upstream HEAD:** f7549d43 — v1.34.2 (2026-04-07)
**Fork HEAD:** 481eec47 (research/planning phase, v1.20 not started)
**Common ancestor:** `b85247a3` (early GitHub workflow setup — very deep in shared history)

---

## Executive Summary

### How Far Behind

Since the fork's v1.30.0 baseline freeze:
- **4 upstream releases shipped:** v1.31.0, v1.32.0, v1.33.0, v1.34.x
- **304 commits total** (244 non-merge) landed on `upstream/main`
- **Breakdown:** 61 feat, 121 fix, 30 docs, 4 perf, 11 test, 9 ci/chore/refactor

This is a **medium-high drift level** — larger than the C1-C11 cluster from v1.18 (372 commits spanning v1.22.4–v1.28.0), but more concentrated: upstream has been in a stability/polish cycle rather than architectural expansion.

### Risk Level: MEDIUM

The upstream trajectory has shifted from architectural expansion (v1.29–v1.30 SDK, headless automation) toward stability hardening: **locking correctness, atomic writes, milestone data safety, performance, and installer reliability**. This is good news for the fork. The high-risk architectural divergences (SDK/headless, developer profiling, workstreams) were already classified as "defer" or "not applicable" in the v1.18 drift ledger. The new commits largely fall into:

- **Bug fixes to modules the fork can adopt wholesale** (state, phase, milestone — all `adopt-upstream` stance)
- **New features the fork has no equivalent for** — some worth considering for v1.21 or v1.22
- **Changes to hybrid modules** — localized and non-overlapping with fork extensions in most cases

### Key Findings for v1.20

1. **Upstream's global learnings store (`~/.gsd/knowledge/`) is NOT a conflict with v1.20 KB-04/KB-05.** Upstream stores `.json` files flat in `~/.gsd/knowledge/`; the fork uses subdirectories (`signals/`, `spikes/`, `lessons/`). No file collision. But design awareness is needed — both systems use the same root path for different structures.

2. **Upstream solved the parallel execution STATE.md problem with a different approach than PAR-01.** `workflow.use_worktrees` toggle (v1.31.0) and orchestrator-owns-writes pattern (v1.31.0) address the same root cause. The fork's PAR-01 (per-worktree state files) may be superseded or complementary — deserves explicit comparison before implementation.

3. **Upstream added a STATE.md locking overhaul** (v1.34.0) that touches `state.cjs`, `config.cjs`, and `core.cjs` — all modules the fork tracks. The fork's `state.cjs` has `adopt-upstream` stance and should take this directly.

4. **Upstream added `atomicWriteFileSync`** to `core.cjs` (v1.34.0) — directly relevant since the fork's hybrid `core.cjs` is where `atomicWriteJson` lives. This will need hybrid merge attention.

5. **No overlap with KB-04 (SQLite)** — upstream's intelligence system uses flat JSON files (intel.cjs) and the learnings store uses `{id}.json` files, not SQLite. The fork's SQLite KB index is architecturally independent.

6. **Upstream's security module remains unmerged in fork** — now significantly enhanced (v1.32.0, v1.33.0). Still a "behind" gap but not blocking v1.20.

---

## Commit Inventory by Area

### Area 1: Atomic Writes / Locking Correctness (HIGH sync priority)

These are correctness fixes to pure/mostly-upstream modules:

| Commit | Area | Files | Fork Impact |
|--------|------|-------|-------------|
| `4dd35f6b` | TOCTOU races in state, config locking | `state.cjs`, `config.cjs`, `core.cjs` | **Adopt** — state.cjs is pure upstream; config.cjs and core.cjs need hybrid merge |
| `60fa2936` | `atomicWriteFileSync` to prevent kill-truncation | `state.cjs`, `config.cjs`, `core.cjs` | **Adopt** — core.cjs has fork additions; merge required |
| `7bc66685` | `readModifyWriteStateMd` for phase transitions | `phase.cjs`, `state.cjs` | **Adopt** — phase.cjs is mostly-upstream |
| `839ea22d` | Cross-platform `Atomics.wait` instead of shell sleep | `core.cjs` | **Adopt** — direct fix to shared utility |
| `d4859220` | Concurrency safety and atomic state writes | Multiple | **Adopt** — foundational correctness |

**Fork impact:** The most important cluster in this survey. State corruption bugs affect all users. The fork's state.cjs and phase.cjs have `adopt-upstream` stance — take these directly. core.cjs and config.cjs need hybrid merge (fork extensions overlay upstream base), but the conflict surface is localized (fork adds functions, upstream fixes existing ones — non-overlapping regions likely).

### Area 2: Milestone Safety (HIGH sync priority)

| Commit | Description | Files | Fork Impact |
|--------|-------------|-------|-------------|
| `f6a7b9f4` | Prevent data loss and Backlog drop on milestone completion | `complete-milestone.md` | **Adopt** — fork has no special changes here |
| `6d429da6` | Fix global regex lastIndex bug in milestone | `milestone.cjs` | **Adopt** — milestone.cjs is pure upstream |
| `09e56893` | Preserve 999.x backlog phases during phases clear | `milestone.cjs`, `phase.cjs` | **Adopt** — directly relevant to fork's backlog model |
| `e6d2dc3b` | Skip 999.x backlog in phase-add numbering | `phase.cjs` | **Adopt** — matches fork's backlog numbering convention |
| `13faf661` | Preserve USER-PROFILE.md on re-install | `bin/install.js` | **Hybrid merge** — installer is medium-risk hybrid |

**Fork impact:** The backlog-related fixes (999.x) are especially relevant since the fork has `backlog.cjs` and backlog numbering conventions. These upstream fixes align with the fork's approach.

### Area 3: Performance (LOW sync priority)

| Commit | Description | Fork Impact |
|--------|-------------|-------------|
| `d12d31f8` | .planning/ sentinel check before config read in context monitor | **Adopt** — hooks/gsd-context-monitor.js is hybrid but this is a guard |
| `4334e494` | Hoist readdirSync out of phase loop in manager | **Adopt** — init.cjs is hybrid |
| `28517f7b` | Hoist readdirSync out of phase loop in roadmap | **Adopt** — roadmap.cjs is mostly-upstream |
| `9679e18e` | Cache isGitIgnored result per process lifetime | **Adopt** — core.cjs utility |

### Area 4: Installer Fixes (MEDIUM sync priority)

Many installer fixes since v1.30.0. The fork's `bin/install.js` is a MEDIUM-risk hybrid merge file:

| Commit | Description | Fork Impact |
|--------|-------------|-------------|
| `8021e860` | Anchor local hook paths to $CLAUDE_PROJECT_DIR | **Adopt** — fixes local install paths |
| `00c6a5ea` | Preserve non-array hook entries during uninstall | **Adopt** — prevents install damage |
| `b185529f` | Guard .sh hook registration with fs.existsSync | **Adopt** — prevents fresh install failures |
| `175d89ef` | Uninstall hook safety — per-hook granularity | **Adopt** — improves uninstall reliability |
| `84de0cc7` | Comprehensive audit cleanup of hook copy, uninstall, manifest | **Adopt** — important correctness fix |
| `5c1f9022` | Handle missing reference files during fresh install | **Adopt** — fresh install reliability |
| `c0145018` | Deploy commands directory in local installs | **Adopt** — local install fix |
| `5884a24d` | Deploy missing shell hook scripts to hooks directory | **Adopt** — package completeness fix |
| `3895178c` | Remove gsd-file-manifest.json on uninstall | **Adopt** — cleanup correctness |
| `0e06a44d` | Include hooks/*.sh files in npm package | **Adopt** — package completeness |
| `e9ede997` | Prioritize .claude in detectConfigDir search order | **Adopt** — affects fork's update detection |

### Area 5: New Features — Learnings Store (ASSESS for v1.21)

`feat(tools): add global learnings store with CRUD library and CLI support (#1831)` — `f25ae33d`

Upstream added:
- `learnings.cjs` — 378-line module storing JSON entries at `~/.gsd/knowledge/`
- CLI: `gsd-tools learnings write/read/list/query/delete/copy/prune`
- Auto-copy from LEARNINGS.md to global store at phase completion
- Auto-inject into planner context when `features.global_learnings: true`

**Disposition: Complementary (v1.21 candidate)**

The fork's KB stores signals/spikes/lessons as `.md` files in subdirectories. Upstream's learnings store is a parallel JSON-based short-form lesson store. They serve different granularities:
- Fork KB: structured epistemic artifacts (signals with lifecycle states, spike DESIGN/FINDINGS/DECISION, lessons from reflections)
- Upstream learnings: lightweight cross-phase observations stored as JSON

**v1.20 interaction:** No conflict with KB-04 (SQLite index over fork's `.md` files). The `~/.gsd/knowledge/` path is shared but file structure doesn't collide (fork uses `signals/`, `spikes/`, `lessons/` subdirs; upstream writes flat `.json` files). The `learnings list` scan only reads `*.json` files at the top level — does not recurse into fork's subdirectories.

**However:** When upstream's `execute-phase.md` runs `learnings copy`, it reads from `.planning/LEARNINGS.md` — a file the fork doesn't currently use. No interference with existing fork KB workflow.

### Area 6: New Features — Intel System (NOT APPLICABLE)

`feat(intel): add queryable codebase intelligence system (#1728)` — `7b369d2d`

Adds `intel.cjs` with persistent codebase metadata snapshots in `.planning/intel/`:
- `files.json`, `apis.json`, `deps.json`, `stack.json`, `arch.md`
- Opt-in via `intel.enabled: true` in config.json
- Refreshes via agent-based updater

**Disposition: Not applicable**

The fork's codebase is already well-understood and the `gsd-codebase-mapper` agent covers mapping needs. The intel system is designed for larger teams needing persistent codebase context across sessions. Single-project single-user doesn't need a separate intelligence cache. File in "consider for v1.22+" if codebase complexity grows.

### Area 7: New Features — Hard Stop Safety Gates (CONVERGENT with GATE-04)

`feat(next): add hard stop safety gates and consecutive-call guard (#1784)` — `3a277f8b`

Upstream added three hard stops to `/gsd-next`:
1. Unresolved `.continue-here.md` from previous session
2. Error/failed state in STATE.md
3. Unresolved FAIL items in VERIFICATION.md

Plus consecutive-call budget guard (6-call limit before prompting).

**Disposition: Convergent with GATE-04**

v1.20's GATE-04 requires `.continue-here` files to be marked consumed on read and deleted after session start. Upstream's approach is complementary — it prevents advancement when stale handoffs exist rather than deleting them. These are different mechanisms at different points in the workflow, but both address the stale-handoff problem (pattern R09).

**Assessment:** Adopt upstream's safety gates into the fork's `next.md` workflow as part of GATE-04 work. The mechanisms aren't in conflict — upstream's gate checks presence, fork's GATE-04 adds staleness detection and lifecycle management.

### Area 8: New Features — Parallel Execution Fixes (DIRECTLY RELEVANT to PAR-01)

| Commit | Description |
|--------|-------------|
| `d1ff0437` | `workflow.use_worktrees` toggle to disable worktree isolation |
| `ec7bf04a` | Orchestrator-owns-writes for STATE.md/ROADMAP.md in parallel mode |
| `0b43cfd3` | Detect files_modified overlap, enforce wave ordering |

**Disposition: Convergent with PAR-01**

This is the most important design collision in this survey. Upstream addressed STATE.md parallel execution conflicts with:
1. An escape hatch (`use_worktrees: false` runs all plans sequentially on main worktree)
2. Orchestrator ownership of STATE.md writes (executor agents don't touch STATE.md)
3. Intra-wave files_modified overlap detection

The fork's PAR-01 proposes per-worktree state files (`.planning/state/{worktree-name}.json`). This is a different architectural solution:
- **Upstream approach:** Centralize STATE.md writes in orchestrator, add escape hatch
- **Fork PAR-01 approach:** Distribute state into per-worktree files, composite view

**Design decision needed before implementing PAR-01:** The upstream approach (orchestrator-owns-writes) may be sufficient for the fork's use case. If so, PAR-01 could be simplified to adopting upstream's pattern plus the composite view for PAR-02. The per-worktree-file approach adds infrastructure complexity for marginal gain if orchestrator-owns-writes already resolves the conflicts.

**Recommended action:** Before implementing PAR-01, evaluate whether adopting upstream's `0b43cfd3` + `ec7bf04a` into execute-phase.md resolves the fork's observed STATE.md conflict patterns. If yes, PAR-01 scope reduces significantly.

### Area 9: New Features — Context Profiles (ASSESS for v1.21)

`feat(config): add execution context profiles for mode-specific agent output (#1827)` — `e107b4e2`

Adds `contexts/` directory with `dev.md`, `research.md`, `review.md` profiles. Config key `context: dev|research|review` modifies agent behavior for the active context.

**Disposition: Complementary (v1.21 candidate)**

The fork's model-profiles.md already handles model selection per agent. Context profiles add a separate dimension: behavioral mode regardless of model. This is complementary to the fork's approach but requires evaluating whether it interacts with the fork's `automation.cjs` level-based triggering or health probe context. Not needed for v1.20; track for v1.21.

### Area 10: New Features — Gates Taxonomy (CONVERGENT with GATE requirements)

`feat(references): add gates taxonomy with 4 canonical gate types (#1781)` — `2a3fe4fd`

Upstream formalized four gate types: pre-flight, revision, escalation, abort. Added `references/gates.md` with gate matrix for plan-phase and execute-phase workflows.

**Disposition: Complementary / Convergent**

The fork's GATE-01 through GATE-08 requirements are structural enforcement mechanisms. Upstream's gates taxonomy is a reference document for agents. These are compatible — the fork should adopt the gates.md reference and use it as context when implementing GATE-01 through GATE-08. The taxonomy provides vocabulary the fork's agents can reference.

**Recommended action:** Adopt `references/gates.md` from upstream as part of GATE requirements implementation. Low-effort, directly relevant.

### Area 11: New Features — Methodology Artifact Type (CONVERGENT with SPIKE requirements)

`feat: add methodology artifact type with consumption mechanisms (#1488)` — `bdf6b5ef`

Upstream added:
- `references/artifact-types.md` — canonical catalog of all GSD artifact types
- `METHODOLOGY.md` artifact type at `.planning/METHODOLOGY.md` — standing reference of named interpretive lenses
- `discuss-phase-assumptions.md` now loads METHODOLOGY.md before assumption analysis
- `pause-work.md` Required Reading template includes METHODOLOGY.md

**Disposition: Complementary with SPIKE-11**

The fork's SPIKE-11 requires operationalizing Lakatos, Mayo, and institutional critique as an epistemological framework. Upstream's METHODOLOGY.md artifact type provides an almost-exact structural home for this. The fork should adopt the methodology artifact type and store the epistemological framework in METHODOLOGY.md.

**Impact on SPIKE-11:** This reduces the implementation burden — instead of designing a new artifact type, the fork can use upstream's pattern. SPIKE-11 becomes "populate METHODOLOGY.md with epistemological framework + wire into spike workflow" rather than inventing the artifact type from scratch.

### Area 12: New Features — Anti-Pattern Severity Levels (COMPLEMENTARY to GATE-04)

`feat: add anti-pattern severity levels and mandatory understanding checks at resume (#1491)` — `d8ea1956`

Upstream added `blocking` vs `advisory` severity to `.continue-here.md` anti-patterns, with mandatory understanding checks for blocking items before workflow resumes.

**Disposition: Adopt as part of GATE-04**

The fork's GATE-04 requires `.continue-here` lifecycle management. Upstream's severity levels add a quality enforcement dimension. These fit together: GATE-04 manages the lifecycle; severity levels control what the agent must acknowledge before proceeding. Adopt both.

### Area 13: New Features — Expand Pause-Work / Richer Handoffs (ADOPT)

`feat(workflows): expand pause-work for non-phase contexts and richer handoffs (#1608)` — `bb74bd96`

Upstream added to `pause-work.md`:
- Detects spike/deliberation/research context and writes handoff to appropriate path
- Required Reading, Anti-Patterns, and Infrastructure State sections in continue-here template
- Pre-execution design critique gate for design→execution transitions

**Disposition: Adopt — directly relevant**

The fork uses pause-work heavily for session handoffs (6+ handoff documents in recent session history). The upstream expansion adds context-aware handoff paths that would benefit the fork's spike and deliberation workflows. The `infrastructure state` section is particularly relevant to v1.20's GATE-06 (automation postlude structural enforcement).

**Note:** The fork's `pause-work.md` is in the workflow source and doesn't appear in FORK-DIVERGENCES.md as a modified file — it should be an easy adopt. Check for any fork-specific postlude additions before merging.

### Area 14: New Features — Shared Behavioral Docs (ADOPT for GATE/SPIKE agent work)

`feat(references): add shared behavioral docs and wire into workflows (#1658)` — `9bf9fc29`

Six new reference documents:
- `universal-anti-patterns.md` — 27 behavioral rules across 8 categories
- `context-budget.md` — 4-tier context window management system
- `gate-prompts.md` — 14 named prompt patterns for decision points
- `revision-loop.md` — Check-Revise-Escalate with stall detection
- `domain-probes.md` — domain-specific follow-up questions
- `agent-contracts.md` — completion markers for all 21 GSD agents

**Disposition: Adopt — agents are fork-only additions, but reference docs are shared**

The fork has fork-specific agents (`gsdr-executor.md`, `gsdr-planner.md`, etc.) that don't share upstream agent names. However, the shared reference docs are additive and context-useful. The fork's spike reviewer agents (SPIKE-01, SPIKE-09) should reference `universal-anti-patterns.md` and `gate-prompts.md` during v1.20 work.

### Area 15: Bug Fixes — Discuss-Phase (ADOPT — active fork hybrid target)

| Commit | Description |
|--------|-------------|
| `383007dc` | Conditional thinking partner at decision points |
| `3d2c7ba3` | `--power` flag for file-based bulk question answering |
| `d8ea1956` | Anti-pattern severity levels and mandatory understanding checks |
| `0782b5bd` | Prevent infinite self-discuss loop in auto/headless mode |
| `5e88db95` | `--chain` flag for interactive discuss with auto plan+execute |
| `5011ff15` | Show /clear before command in Next Up blocks |
| `e8063ac9` | Preserve chain flag across discuss→plan→execute |

**Fork impact:** `discuss-phase.md` is a hybrid merge file with fork additions (KB surfacing, three-mode discuss system). The `--power`, `--chain`, anti-pattern severity, and self-discuss guard commits touch the same file. These need careful hybrid merging but are all clearly valuable. The thinking partner and stall detection features are independently valuable.

**Note on GATE-08:** The discuss-phase-assumptions.md in upstream (671 lines) is significantly larger than the fork's version (279 lines). The upstream version has the `load_methodology` step added (from Area 11 above) and other enhancements. This is directly relevant to GATE-08 (complete discuss-phase adoption).

### Area 16: New Commands Added Upstream (ASSESS individually)

| Command | Commit | Description | Fork Disposition |
|---------|--------|-------------|-----------------|
| `/gsd-scan` | `4c8719d8` | Rapid single-focus codebase assessment | Complementary — fork already has `/gsdr:reflect` and sensors |
| `/gsd-explore` | `790cbbd0` | Socratic ideation and idea routing | **Adopt candidate** — no fork equivalent for ideation routing |
| `/gsd-undo` | `567736f2` | Safe git revert | **Adopt** — universally useful, no fork equivalent |
| `/gsd-import` | `02d2533e` | External plan import | Not applicable — fork uses its own planning structure |
| `/gsd-audit-fix` | `f0f0f685` | Autonomous audit-to-fix pipeline | Assess — fork has individual audit commands |
| `/gsd:code-review` | `99c089bf` | Code review with structured feedback | **Adopt candidate** — complements WF-01 cross-model-review |
| `/gsd:code-review-fix` | `99c089bf` | Auto-fix from code review | Complementary to code-review |
| `/gsd:analyze-dependencies` | `8fce0972` | Detect phase dependencies | Complementary — fork has analyze-dependencies already? |
| `/gsd:docs-update` | `067d411c` | Verified documentation generation | **Adopt** — no fork equivalent |

### Area 17: Security Module Enhancements (BEHIND — v1.21 candidate)

| Commit | Description |
|--------|-------------|
| `13c635f7` | Improved prompt injection scanner (Unicode, encoding obfuscation, entropy analysis) |
| `8d29ecd0` | Add missing 'act as' injection pattern |
| `2154e6bb` | Security-first enforcement layer with threat-model-anchored verification |
| `523c7199` | Path traversal validation for planningDir |

The fork has not yet adopted `security.cjs`. The module has grown substantially since the v1.18 classification. The threat-model enforcement layer (SECURITY.md artifact, security-auditor agent, secure-phase workflow) is a significant addition that would benefit the fork's verification pipeline. Still classified as "behind" — elevated priority for v1.21 given the scope of enhancements.

### Area 18: Other Notable Fixes for Adopt-Upstream Modules

| Commit | Description | Module | Priority |
|--------|-------------|--------|----------|
| `fa57a14e` | REG-04 — frontmatter inline array parser respects quoted commas | `frontmatter.cjs` | **HIGH** — fork uses frontmatter heavily |
| `4645328e` | Verifier filters gaps addressed in later milestone phases | `verify.cjs` | Medium — pure upstream |
| `70d8bbcd` | Phase resolution uses exact token matching | `phase.cjs` | Medium |
| `cc6689ac` | Research gate blocks planning on unresolved open questions | `plan-phase.md` | **Adopt** — directly relevant to fork's research gates |
| `4302d440` | `model_profile "inherit"` treated as pass-through | `core.cjs` | Medium — affects model resolution |
| `a452c4a0` | Scan ROADMAP.md entries in next-decimal to prevent collisions | `phase.cjs` | Medium |
| `12a45451` | Warn on unrecognized config keys instead of silent drop | `config.cjs` | **Adopt** — important for fork's config extensions |

---

## Overlap Analysis with v1.20 Scope

### KB Infrastructure (KB-01 through KB-08)

| Upstream Feature | v1.20 Requirement | Assessment |
|-----------------|-------------------|------------|
| Learnings store (`~/.gsd/knowledge/*.json`) | KB-04, KB-05 (SQLite index) | No conflict. Different file types, different structure. Both use `~/.gsd/knowledge/` as root — document the coexistence explicitly in KB-05 design. |
| Intel system (`.planning/intel/` JSON files) | KB-04, KB-06 (kb CLI) | No conflict. Different subdirectory. Intel is codebase metadata; KB is epistemic artifacts. |
| Auto-copy learnings at phase completion | KB-07 (resolves_signals wiring) | Parallel pattern. KB-07 hooks into `resolves_signals` frontmatter; upstream learnings copies from LEARNINGS.md. These serve different signals-as-artifacts vs notes-as-learnings use cases. |

**Bottom line for KB design:** The fork's SQLite KB index is architecturally independent of upstream's additions. No design changes required. Document that `~/.gsd/knowledge/` now houses two parallel structures: fork's subdirectory-based epistemic artifacts and upstream's flat JSON learnings — and that these don't interfere.

### Measurement & Telemetry (TEL-01 through TEL-04)

Upstream has no equivalent telemetry infrastructure for session-level metrics extraction. No overlap, no conflict.

### Structural Enforcement (GATE-01 through GATE-08)

| Upstream Feature | v1.20 Requirement | Assessment |
|-----------------|-------------------|------------|
| Hard stop safety gates in next.md | GATE-04 (.continue-here lifecycle) | **Convergent** — upstream checks presence, fork adds staleness/lifecycle. Adopt upstream gates AND implement GATE-04 lifecycle management. |
| Anti-pattern severity + mandatory understanding checks | GATE-04 | **Adopt** — enhance GATE-04 implementation with severity model |
| State locking overhaul | GATE-06 (automation postlude structural) | Independent — upstream fixes race conditions in existing commands; GATE-06 is about postlude fire rate |
| Research gate blocks planning on open questions | GATE-01 (PR+CI before advancement) | Different gate, different trigger — no conflict |
| discuss-phase-assumptions.md enhancements | GATE-08 (discuss-phase adoption) | **Direct relevance** — upstream's 671-line version is the target for GATE-08's 5 missing files. Fork's 279-line version is significantly behind. |

**Note on GATE-08:** Upstream's discuss-phase-assumptions.md has grown 2.4x since the fork's version. The `gsd-assumptions-analyzer` agent, the `load_methodology` step, and additional behavioral docs are all present upstream. GATE-08's 5 missing files may partly be the delta between fork's 279-line and upstream's 671-line version of this file.

### Sensor Pipeline (SENS-01 through SENS-06)

No upstream equivalent for the log sensor, Codex session discovery, or patch sensor. No overlap, no conflict.

### Spike Methodology (SPIKE-01 through SPIKE-11)

| Upstream Feature | v1.20 Requirement | Assessment |
|-----------------|-------------------|------------|
| Methodology artifact type (METHODOLOGY.md) | SPIKE-11 (epistemological framework) | **Adopt and use** — upstream provides the structural home; fork populates with epistemological content |
| Gates taxonomy (gates.md) | SPIKE-01 (design reviewer) | Complementary — gates.md provides vocabulary for the reviewer gate |
| Reachability check in planner | SPIKE-03, SPIKE-04 | Upstream added reachability_check to gsd-planner; fork's spike workflow is separate |

### Workflow Gaps (WF-01 through WF-03)

| Upstream Feature | v1.20 Requirement | Assessment |
|-----------------|-------------------|------------|
| `/gsd:code-review` + `/gsd:code-review-fix` | WF-01 (cross-model-review) | **Complementary** — upstream adds code-review as a tool; fork's WF-01 is a dedicated cross-model audit workflow with committed spec. These are different scopes. |
| Expand pause-work + richer handoffs | WF-03 (research command) | Partially — upstream's detect-context addition to pause-work helps; WF-03 is about a dedicated research command |

### Cross-Runtime Parity (XRT-01 through XRT-03)

| Upstream Feature | v1.20 Requirement | Assessment |
|-----------------|-------------------|------------|
| Augment Code runtime support | XRT-01, XRT-02 | Not directly applicable — fork is Claude Code + Codex focused |
| Kilo CLI runtime support | Not in v1.20 scope | Not applicable |
| `use_worktrees` toggle | XRT-01 (hook degradation paths) | Relevant — `use_worktrees: false` is a degradation path for Codex where worktrees may not work |

### Parallel Execution (PAR-01 through PAR-03)

| Upstream Feature | v1.20 Requirement | Assessment |
|-----------------|-------------------|------------|
| Orchestrator-owns-writes (STATE.md/ROADMAP.md) | PAR-01 (per-worktree state files) | **CONVERGENT — design decision needed** — see detailed analysis in Area 8 |
| files_modified overlap detection + wave ordering | PAR-01, PAR-03 | **Adopt** — this is directly relevant to PAR-03's non-overlapping file scope requirement |
| `workflow.use_worktrees` toggle | PAR-01 | Provides escape hatch; fork may adopt this as PAR-01's fallback path |

---

## Files That Both Upstream and v1.20 Plan to Touch

These are the highest conflict-risk files for v1.20 planning:

| File | Upstream Changes Since v1.30 | v1.20 Plans to Change | Risk |
|------|------------------------------|----------------------|------|
| `get-shit-done/workflows/execute-phase.md` | 5 commits (auto-copy learnings, protect orchestrator, anti-pattern enforcement, agent contracts, code-review gate) | GATE-01, GATE-06, SENS-01 postlude, PAR-01 | **HIGH** |
| `get-shit-done/bin/lib/core.cjs` | 3 commits (TOCTOU/locking, atomicWriteFileSync, isGitIgnored cache) | KB-04 may extend core utilities | MEDIUM |
| `get-shit-done/bin/lib/config.cjs` | 6 commits (locking, config-get --default, learnings features, context profiles, etc.) | GATE-03 may extend config keys | MEDIUM |
| `get-shit-done/bin/lib/state.cjs` | 5 commits (TOCTOU fixes, programmatic gates, STATE.md repairs) | PAR-01/PAR-02 (per-worktree state) | **HIGH** |
| `get-shit-done/bin/lib/phase.cjs` | 4 commits (backlog skip, atomic phase transitions, STATE.md gate) | PAR-01 phase coordination | MEDIUM |
| `get-shit-done/workflows/discuss-phase.md` | 7 commits (thinking partner, --power, --chain, anti-pattern enforcement, i18n) | GATE-08 | MEDIUM |
| `get-shit-done/workflows/discuss-phase-assumptions.md` | Multiple (methodology artifact, upstream grown 2.4x) | GATE-08 | **HIGH** |
| `get-shit-done/workflows/pause-work.md` | 2 commits (non-phase contexts, anti-pattern severity) | WF-03 / handoff work | LOW |
| `bin/install.js` | 11+ commits | GATE-03, SENS-06, XRT-03 | MEDIUM |
| `get-shit-done/bin/lib/frontmatter.cjs` | 2 commits (quoted-comma fix, concurrency safety) | KB-01/KB-02 (signal schema extensions) | MEDIUM |

---

## Recommendations

### Adopt Now (Before v1.20 Work Begins)

These fixes should be pulled into the fork immediately to avoid building on a broken substrate. They are all in `adopt-upstream` or trivially hybrid modules:

1. **State/locking correctness cluster** (`4dd35f6b`, `60fa2936`, `7bc66685`, `839ea22d`) — adopt `state.cjs`, `phase.cjs`, and then hybrid-merge the `core.cjs` changes. These prevent data loss and corruption.

2. **Milestone safety cluster** (`f6a7b9f4`, `6d429da6`, `09e56893`, `e6d2dc3b`) — adopt `milestone.cjs`, `complete-milestone.md`. The 999.x backlog fixes directly affect fork's backlog model.

3. **Frontmatter quoted-comma fix** (`fa57a14e`) — the fork's frontmatter.cjs has fork extensions; this bug is in the base parser. Hybrid merge required, but the fix is essential for any signal frontmatter with array values.

4. **Installer reliability cluster** — the most impactful installer fixes (`8021e860`, `00c6a5ea`, `b185529f`, `5c1f9022`, `c0145018`) should be adopted before the fork's next release.

**Rationale:** These are correctness fixes, not features. Building v1.20 on top of state corruption bugs and installer failures compounds risk unnecessarily. A mini sync (baseline: `upstream/main` as of today, i.e., v1.34.2) before v1.20 implementation would clear this technical debt.

### Adopt as Part of v1.20 Phase Work

These upstream additions should be incorporated during the relevant v1.20 phases:

| When | Upstream Item | v1.20 Requirement |
|------|---------------|-------------------|
| GATE-04 impl | Hard stop safety gates + anti-pattern severity levels | GATE-04 |
| GATE-08 impl | Upstream discuss-phase-assumptions.md (671-line version) | GATE-08 |
| SPIKE-11 impl | Methodology artifact type (upstream's structural pattern) | SPIKE-11 |
| GATE-01 impl | Gates taxonomy (references/gates.md) | GATE-01 vocabulary |
| PAR-01 design | Wave ordering + orchestrator-owns-writes pattern | PAR-01 (evaluate before implementing) |
| New agent work | Shared behavioral docs, gate-prompts, revision-loop | All new agents |

### Consider for v1.21

| Feature | Disposition | Rationale |
|---------|-------------|-----------|
| Global learnings store (`learnings.cjs`) | **Complementary** | Lightweight cross-phase lesson capture; would integrate with KB-08's surfacing pipeline |
| Execution context profiles | **Complementary** | Adds behavioral mode dimension orthogonal to model profiles |
| Intel system (`intel.cjs`) | **Not applicable now** | Single-project, well-understood codebase; revisit at v1.22+ |
| `/gsd-explore` (Socratic ideation) | **Adopt** | No fork equivalent; complements deliberation workflow |
| `/gsd:code-review` + `/gsd:code-review-fix` | **Adopt** | Complements WF-01 cross-model-review |
| Security enforcement layer (`2154e6bb`) | **Behind** | Threat-model verification is relevant to fork's rigor requirements |

### Ignore

| Feature | Disposition |
|---------|-------------|
| Workstream/multi-project features | Not applicable — single-project fork |
| Developer profiling (profile-output, profile-pipeline) | Not applicable — single-user |
| Trae, Augment, Kilo runtime support | Not applicable — fork targets Claude Code + Codex |
| SDK/headless automation | Intentionally different — fork's graduated automation philosophy |
| i18n (response_language config) | Not applicable — single-language workflow |

---

## Key Design Decisions Needed Before v1.20 Implementation

### Decision 1: PAR-01 Architecture

**Question:** Is upstream's orchestrator-owns-writes pattern sufficient to resolve the fork's STATE.md merge conflicts, or does per-worktree state (PAR-01) provide additional value?

**Evidence:**
- Upstream solution: orchestrator writes STATE.md/ROADMAP.md; executor agents don't (commits `ec7bf04a`, `0b43cfd3`)
- Fork PAR-01 design: per-worktree `.planning/state/{name}.json` files with composite view (PAR-02)
- Pattern R10/N10/N11: STATE.md merge conflicts observed repeatedly in fork sessions

**Recommendation:** Adopt upstream's wave ordering + orchestrator-owns-writes first (low effort, targeted fix). Observe whether conflicts persist. If they do, implement per-worktree state. PAR-01 as currently specified may be over-engineered for the actual failure mode.

### Decision 2: KB-04 Path Coexistence with Upstream Learnings

**Question:** How should the fork's KB design document the coexistence of upstream learnings (flat JSON at `~/.gsd/knowledge/*.json`) with fork signals/spikes/lessons (subdirectories)?

**Evidence:**
- Upstream learnings: `{id}.json` files, scanned with `.filter(f => f.endsWith('.json'))` — does NOT recurse into subdirs
- Fork KB: `signals/`, `spikes/`, `lessons/` subdirectories
- No current collision, but `learnings list` will return zero results (no flat JSON) on fork-only installs

**Recommendation:** Document the coexistence in KB-05's implementation notes. Add a note to FORK-DIVERGENCES.md that `~/.gsd/knowledge/` is now used by both upstream (flat JSON) and fork (subdirectory structure). Consider whether the fork's v1.21 learnings integration should use upstream's format or translate signals to upstream's format.

### Decision 3: GATE-08 Scope

**Question:** Does GATE-08's "5 missing files from upstream adoption" include the 392-line gap between fork's discuss-phase-assumptions.md (279 lines) and upstream's (671 lines)?

**Evidence:**
- signal `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop` closes Issues #26, #32, #33
- Upstream discuss-phase-assumptions.md is 2.4x larger with methodology artifact loading, enhanced agent contracts, and gsd-assumptions-analyzer updates
- The GATE-08 requirement says "5 missing files" — these may be separate files, not content gaps in existing files

**Recommendation:** Before implementing GATE-08, diff the fork's discuss-phase-assumptions.md against upstream's 671-line version to determine how much of GATE-08 is covered by this delta vs. truly missing files.

---

## Summary Table: All 244 Non-Merge Commits Classified

| Category | Count | Fork Action |
|----------|-------|-------------|
| State/locking correctness | 8 | Adopt immediately |
| Milestone safety | 5 | Adopt immediately |
| Installer reliability | 11 | Adopt before next release |
| Performance | 4 | Adopt (trivial) |
| Frontmatter/core fixes | 4 | Adopt (hybrid merge) |
| Discuss-phase fixes | 7 | Adopt as part of GATE-08 |
| Parallel execution fixes | 3 | Adopt / inform PAR-01 design |
| New: Gates taxonomy | 3 | Adopt for GATE work |
| New: Methodology artifact | 2 | Adopt for SPIKE-11 |
| New: Shared behavioral docs | 2 | Adopt for new agent work |
| New: Anti-pattern severity | 2 | Adopt for GATE-04 |
| New: Pause-work expansion | 2 | Adopt |
| New: Hard stop gates | 2 | Adopt for GATE-04 |
| New: Learnings store | 4 | v1.21 candidate |
| New: Context profiles | 3 | v1.21 candidate |
| New: Intel system | 3 | Not applicable |
| New: Commands (explore, undo, etc.) | 8 | Adopt undo; assess others |
| Security enhancements | 4 | v1.21 candidate |
| Config key additions | 6 | Adopt |
| Other bug fixes | 39 | Mostly adopt |
| Docs only | 30 | Reference |
| CI/chore | 9 | Not applicable |
| Runtime support (Kilo, Augment, etc.) | 15 | Not applicable |
| i18n, workstreams, SDK, profiles | 18 | Not applicable / Intentionally different |

---

## Sync Trigger Assessment

Per FORK-STRATEGY.md trigger-based cadence:

| Trigger | Status |
|---------|--------|
| Security-critical upstream change | Not identified — prompt injection improvements are stability, not new vulnerability |
| Tagged release with "behind" gap features | v1.32.0 (security) matches; v1.31.0 (worktrees) partially matches | 
| Upstream version drift exceeds 3 major versions | **TRIGGERED** — v1.30 → v1.34 is 4 major versions |
| Fork milestone boundary | v1.20 is starting — natural checkpoint |

**Recommendation:** The version drift trigger is met (4 major versions). However, initiating a full sync before v1.20 implementation would consume the milestone's momentum. The recommended path:

1. **Mini adopt-set** (pre-v1.20): pull the correctness/safety cluster (state locking, milestone safety, frontmatter fix, installer reliability) as a maintenance PR. This takes 1-2 phases, clears critical substrate bugs.
2. **v1.20 proceeds** with the correctness substrate fixed.
3. **Post-v1.20 full sync** targets v1.34.2 with the full 244-commit inventory classified per the clusters in this document.

The mini adopt-set is scoped to pure-upstream and trivially-hybrid files only — no workflow conflicts, no GATE-08 complexity.

---

*Survey date: 2026-04-08*
*Baseline: v1.30.0 (commit `0fde35ac`)*
*Upstream HEAD: v1.34.2 (commit `f7549d43`)*
*Survey method: git log analysis, selective file inspection, requirements cross-reference*
*Classification methodology: FORK-STRATEGY.md 5-class gap taxonomy (behind, intentionally different, converging, complementary, not applicable)*
