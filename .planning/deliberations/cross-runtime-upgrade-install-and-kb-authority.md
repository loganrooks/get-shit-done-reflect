# Deliberation: Cross-Runtime Upgrade, Install, and KB Authority

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-20
**Status:** Open
**Trigger:** GitHub Issue #17 plus direct audit of Codex-era projects revealed that GSD Reflect's actual upgrade/install/KB behavior is broader and messier than manifest-only config migration. In practice, project-local installs are not authoritative, KB fallback is inconsistent, and hook-based upgrade detection is Claude-centric.
**Affects:** v1.18 Phases 49-51, `upgrade-project`, `new-project`, `health-check`, install precedence, KB path resolution, Codex/Claude parity
**Related:**
- Issue #17: Harden cross-runtime upgrade/install drift and make project KB authoritative
- [sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift](../knowledge/signals/get-shit-done-reflect/sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift.md)
- [sig-2026-02-11-local-install-global-kb-model](../knowledge/signals/get-shit-done-reflect/2026-02-11-local-install-global-kb-model.md)
- [project-local-knowledge-base.md](./project-local-knowledge-base.md)
- [platform-change-monitoring.md](./platform-change-monitoring.md)
- [deployment-parity-v1.17.2.md](./deployment-parity-v1.17.2.md)

## Situation

The project already decided one important principle: project-local knowledge should be primary, with user-global fallback as a compatibility layer. That decision was correct, but the current system does not actually enforce it as an operational invariant across runtimes.

What we have instead is a split model:

1. **Manifest-driven config migration** works for additive schema gaps and is genuinely useful.
2. **Version drift detection** is still documented as hook-primary, which only really exists on Claude.
3. **Install precedence** is not consistently resolved at command/runtime level, so project-local installs are not actually authoritative.
4. **Knowledge-base writes** still leak to `~/.gsd/knowledge/` through fallback behavior and at least one hardcoded skill path.
5. **Path resolution** still depends on current working directory in some places, so project-local assets can be bypassed from subdirectories.

This creates a broader drift class than "config is out of date." A project can be manifest-clean and still be operationally wrong about:

- which install it is using
- whether local KB is authoritative
- whether the runtime can auto-detect version drift
- whether commands are resolving project paths from the repo root

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `references/version-migration.md` vs live Codex runtime | The spec still presents SessionStart hook auto-detect as primary, but Codex has no hook support in practice | Yes — spec read and runtime install checked | sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift |
| `~/.claude/hooks/gsdr-version-check.js` | Claude does have an installed version-check hook, but it writes cache only; it does not itself prompt the user | Yes — read installed hook | sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift |
| `upgrade-project.md` and `new-project.md` | Workflows still invoke the global Codex install path directly, so project-local install is not authoritative in workflow execution | Yes — read workflow files | sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift |
| `gsdr-deliberate` skill | Codex deliberate still hardcodes writes to `~/.gsd/knowledge/signals/{project}/` and reads `~/.gsd/knowledge/index.md` directly | Yes — skill file read directly | sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift |
| `bin/install.js` `createProjectLocalKB()` | Project-local KB creation happens during installer execution when `.planning/` already exists; it is not guaranteed by project init/upgrade itself | Yes — code read directly | sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift |
| Root vs subdirectory KB check in this repo | From repo root, `.planning/knowledge` resolves local; from `get-shit-done/` subdir the same check falls back global | Yes — shell check run directly | sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift |
| `manifest diff-config --raw` on this repo | Config migration detects several missing features/fields and legacy unknown fields, proving config drift is real but only part of the problem | Yes — command run directly | sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift |
| `.planning/config.json` in this repo vs installed VERSION files | Self-hosting drift is present now: project config is `1.12.2` while installed Codex/Claude copies are `1.17.5+dev` | Yes — files read directly | sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift |
| [project-local-knowledge-base.md](./project-local-knowledge-base.md) | The project had already concluded that project-local KB should be primary with fallback; the remaining failure is operational enforcement, not location philosophy | Yes — prior deliberation reviewed | informal |
| [platform-change-monitoring.md](./platform-change-monitoring.md) | Platform change detection is already known to be Claude/Codex asymmetric; the current issue extends that asymmetry into upgrade prompting and install authority | Yes — prior deliberation reviewed | sig-2026-03-17-no-platform-change-detection |

## Framing

The earlier KB deliberation answered "where should project knowledge live?" It did **not** answer "what runtime-neutral mechanism guarantees that the project actually uses its own install, config, and KB correctly on every command?"

**Core question:** What should be the authoritative cross-runtime preflight model for version drift, install precedence, and project-scoped KB resolution, given that hooks are not universally available and config migration alone is insufficient?

**Adjacent questions:**
- Should project-scoped writes ever fall back to `~/.gsd/knowledge`, or should missing local KB trigger creation/migration instead?
- Should workflows and skills resolve their install/tooling path from a project-local install first, with global only as explicit fallback?
- Should drift detection be centralized in `gsd-tools`/command preflight rather than scattered across hooks, workflow prose, and runtime-specific skills?
- Is `templates/config.json` still an authoritative artifact, or should config shape be generated from `gsd-tools` + manifest only?

## Analysis

Prior deliberations have already resolved two pieces of the surrounding space:

- [project-local-knowledge-base.md](./project-local-knowledge-base.md) concluded that project-local KB should be primary.
- [platform-change-monitoring.md](./platform-change-monitoring.md) concluded that Claude-style hooks cannot be treated as the only serious monitoring mechanism.

The remaining gap is therefore not the philosophy of local KB or the value of platform monitoring. It is the **authority model** tying together install resolution, command preflight, migration prompting, and KB writes across runtimes.

### Option A: Command-Level Authority Layer

- **Claim:** Every `gsdr-*` command should run a single runtime-neutral preflight that resolves repo root, active install, version drift, KB root, and runtime capabilities before doing work.
- **Grounds:** Hooks are not cross-runtime. Manifest migration covers only config schema. Current fallback behavior and hardcoded paths prove that decentralized resolution leaks.
- **Warrant:** If the authority decision is made once, at command entry, then workflows and skills stop making ad-hoc guesses about install root, KB root, and upgrade state.
- **Rebuttal:** This likely touches many workflow and tooling paths and may feel like architecture work rather than a narrow migration patch. It also risks duplicating logic if implemented partly in `gsd-tools` and partly in workflow prose.
- **Qualifier:** Strongest long-term candidate. Probably necessary if cross-runtime consistency is a real requirement.

### Option B: Patch Each Drift Surface Separately

- **Claim:** Keep the current architecture but close the obvious gaps one by one: create local KB during init/upgrade, remove hardcoded global KB writes, add more warnings to health-check, and update docs/specs.
- **Grounds:** The system already has manifest migration, installer KB creation, and health-check infrastructure. Incremental fixes reduce risk.
- **Warrant:** If each known leak is closed, the system might become "good enough" without a larger authority abstraction.
- **Rebuttal:** This is close to the pattern that produced the current mess: each piece was locally sensible, but together they never formed a single authoritative model. Risk of more split-brain behavior remains high.
- **Qualifier:** Plausible as a short-term patching strategy, weak as a durable design.

### Option C: Re-center User-Global State as Primary

- **Claim:** Treat `~/.gsd/knowledge` and global installs as the real source of truth, with project-local config/KB only as optional replicas or exports.
- **Grounds:** A user-global model is simpler for cross-project access and historically matches how parts of GSD were built.
- **Warrant:** One shared store and one shared install reduce some duplication and migration complexity.
- **Rebuttal:** This directly conflicts with the already-concluded project-local KB decision, weakens remote execution and repo-native auditability, and does not solve no-hook Codex drift. It also keeps project-scoped state outside the repo by default.
- **Qualifier:** Weak. Included mainly to make the rejection explicit.

## Tensions

1. **Single authority vs incremental patching:** A unified preflight model is architecturally cleaner, but more invasive. Incremental fixes are cheaper, but may preserve the split-brain system.

2. **Project-local authority vs cross-project utility:** Making project-local KB authoritative improves correctness and auditability, but weakens the old intuition that `~/.gsd/knowledge` is the natural cross-project memory layer.

3. **Runtime-neutrality vs richer Claude UX:** Claude hooks can still provide a better session experience. The question is whether that richer UX should be a secondary enhancement or a defining architecture assumption.

4. **Manifest as config source vs legacy tolerated drift:** The manifest-driven approach works well for additive fields, but the framework still tolerates legacy/non-manifest fields. The design question is how much tolerated drift is healthy before "lenient compatibility" becomes "no single source of truth."

## Recommendation

**Current leaning:** Option A. The evidence so far suggests the real missing thing is a command-level authority layer that makes install root, KB root, and migration state explicit before work begins. Without that, fix-after-fix will keep preserving fragmented assumptions.

**Open questions blocking conclusion:**
1. Should project-scoped writes be allowed to fall back to `~/.gsd/knowledge` at all, or should the system auto-create/migrate `.planning/knowledge` instead?
2. Where should the authority layer live: `gsd-tools`, workflow wrappers, or both?
3. How should project-local vs global install precedence behave when both exist but versions differ?
4. Is `templates/config.json` meant to survive as a human-facing artifact, or should it be generated/removed to eliminate config split-brain?
5. How much of this belongs in Phase 49 (config migration) versus Phase 51 (update system hardening)?

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | A command-level authority/preflight layer will eliminate project-scoped writes to `~/.gsd/knowledge` for repos that already have `.planning/knowledge` | Audit several `gsdr-*` commands from repo root and subdirectories after implementation | Any command still writes project-scoped entries to user-global KB when local KB exists |
| P2 | Making project-local install authoritative will surface self-hosting version drift immediately in `get-shit-done-reflect`, instead of leaving `.planning/config.json` quietly stale at `1.12.2` | First post-implementation run in this repo | Repo still runs without surfacing the version mismatch |
| P3 | Converging on one config authority will reduce cases where template/workflow/default-writer disagree about config shape | Compare `templates/config.json`, `new-project`, `gsd-tools`, and migrated configs after implementation | The same split config shapes remain after the work is declared complete |
| P4 | Cross-runtime behavior will become more similar: Claude may keep hooks as extra UX, but Codex should still get the same substantive upgrade/install drift warnings through command preflight | Compare Claude and Codex invocation behavior on a deliberately drifted test project | Codex still silently misses drift that Claude surfaces |

## Decision Record

**Decision:** {pending}
**Decided:** {pending}
**Implemented via:** not yet implemented
**Signals addressed:** sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift, sig-2026-02-11-local-install-global-kb-model, sig-2026-03-17-no-platform-change-detection

## Evaluation

**Evaluated:** {pending}
**Evaluation method:** {pending}

| Prediction | Outcome | Match? | Explanation |
|-----------|---------|--------|-------------|
| P1: {pending} | {pending} | {pending} | {pending} |

**Was this progressive or degenerating?** (Lakatos)
{pending}

**Lessons for future deliberations:**
{pending}

## Supersession

**Superseded by:** {pending}
**Reason:** {pending}
