# Upstream Drift Classification Ledger

**Date:** 2026-03-24
**Prepared by:** Codex CLI (`gpt-5.4`)
**Reasoning effort:** not exposed by runtime
**Baseline:** `v1.22.4` (`a143ba0`)
**Comparison target:** `v1.28.0` (latest released) plus `upstream/main` (`60fda20`) as watchlist
**Upstream tags since baseline:** `v1.23.0`, `v1.24.0`, `v1.25.0`, `v1.25.1`, `v1.26.0`, `v1.27.0`, `v1.28.0`
**Drift totals:** 372 commits from `v1.22.4` to `upstream/main`; 228 touch current-milestone-relevant surfaces
**Classification summary:** `must-integrate-now` = 0, `fold-into-open-phase` = 9, `candidate-next-milestone` = 1, `defer` = 1
**Primary analysis:** See [48.1-RESEARCH.md](./48.1-RESEARCH.md), especially clusters `C1`-`C11`

## Classification Matrix

| Cluster | Description | Key Commits | Released? | Affected Surface | Bucket | Routes To | Rationale |
|---------|-------------|-------------|-----------|------------------|--------|-----------|-----------|
| C1 | Config preservation and Codex absolute agent paths | `9f8d11d` | Main-only | `bin/install.js` | `fold-into-open-phase` | Phase 51 | Installer hardening work already owns config-authority and runtime-path behavior. Important for Codex, but not urgent enough to break current phase boundaries. |
| C2 | Windows shell robustness, `findProjectRoot`, hook stdin safety | `58c2b1f` | Main-only | `core.cjs`, workflows, verifier, tests | `fold-into-open-phase` | Phase 50 + Phase 52 | The `core.cjs` root-detection fix belongs with migration/worktree authority testing; workflow shell guards belong with workflow adoption. Main-only status lowers immediate urgency. |
| C3 | Worktree-aware `.planning/` resolution and planning lock wiring | `0afffb1`, `5eb3c04` | Released (`v1.27.0+`) | `core.cjs`, `gsd-tools.cjs` | `fold-into-open-phase` | Phase 49 | This is a substrate/path-authority improvement that maps directly to config and planning-root authority work. It does not conflict with fork modularization decisions from Phases 45-48. |
| C4 | Worktree isolation for code-writing agents | `8380f31` | Released (`v1.28.0`) | 4 workflow files | `fold-into-open-phase` | Phase 52 | Workflow-level isolation belongs with workflow adoption and namespace rewriting, not with config migration. Useful, but not a reason to reopen already-landed runtime work. |
| C5 | `$HOME` / `HOME` path handling | `f9cb02e`, `ef4453e` | Released (`v1.28.0`) | `bin/install.js`, `init.cjs`, workflows, tests | `fold-into-open-phase` | Phase 49 + Phase 51 | The `init.cjs` portion fits the next init/core update; the installer path fix belongs in update/install hardening. This is exactly the kind of split routing 48.1 exists to make explicit. |
| C6 | Non-Claude model resolution | `02254db` | Released (`v1.28.0`) | `bin/install.js`, `core.cjs`, tests | `fold-into-open-phase` | Phase 49 + Phase 51 | The fork already has cross-runtime model profile logic, so this needs reconciliation rather than blind adoption. That reconciliation belongs where config/runtime authority is already being planned. |
| C7 | Hook field validation to avoid silent settings rejection | `c229259` | Main-only | `bin/install.js`, tests | `fold-into-open-phase` | Phase 51 | This is installer/output hardening, not a separate work package. It should land when Phase 51 revisits hook-safe upgrade behavior and install authority. |
| C8 | `commit_docs` gitignore auto-detection in `loadConfig()` | `28166e4` | Released (`v1.26.0`) | `core.cjs`, tests | `fold-into-open-phase` | Phase 49 | This changes config loading semantics and therefore belongs with config migration planning. It is additive and does not pressure the modular architecture itself. |
| C9 | `planningPaths()` helper adoption across planning modules | `c7954d1`, `1d4deb0` | Released (`v1.25.0+`) | `core.cjs`, `init.cjs`, `roadmap.cjs`, `state.cjs`, `verify.cjs` | `fold-into-open-phase` | Phase 49 | Centralized planning-path construction is relevant to the same authority questions as C3/C8. Research found low conflict risk with fork `loadProjectConfig()` but Phase 49 should check compatibility explicitly. |
| C10 | Security hardening stream | `62db008`, `e3a4272` | Released | new `security.cjs`, `core.cjs` | `candidate-next-milestone` | Next milestone | This is a coherent new capability stream, not a patch to current open phases. Valuable, but it should be adopted as deliberate security work rather than hidden inside v1.18 migration/update phases. |
| C11 | Broader feature additions and runtime/product expansion | `c83b69b`, `319f4bd`, `832b6e1`, `8579a30`, `afcd2a8`, `5c4d5e5`, `a4da216`, `a99caae` | Mixed | many files | `defer` | Defer | These do not materially block or degrade Phases 49-54 as currently scoped. They remain explicit non-current work rather than silent background pressure. |

## Routing By Destination Phase

| Destination | Routed Clusters |
|-------------|-----------------|
| Phase 49 | C3, C5 partial (`init.cjs` HOME), C6 partial (`core.cjs` model resolution), C8, C9 |
| Phase 50 | C2 partial (`findProjectRoot` / project-root detection in `core.cjs`) |
| Phase 51 | C1, C5 partial (`install.js` HOME), C6 partial (`install.js` model resolution), C7 |
| Phase 52 | C2 partial (workflow shell robustness), C4 |
| Phase 54 | No direct cluster assignment; reflects post-routing governance state |
| Next milestone | C10 |
| Deferred | C11 |

## Phase 45-48 Impact Assessment

No reopening is required.

Research found the fork additions from Phases 45-48 in orthogonal regions to the post-baseline upstream changes:

- Fork `core.cjs` additions (`parseIncludeFlag`, `loadManifest`, `loadProjectConfig`, `atomicWriteJson`) do not overlap the upstream `resolveWorktreeRoot`, `withPlanningLock`, `planningPaths`, or `findProjectRoot` work.
- Fork `init.cjs` `--include` and fork-specific init extensions are appended using the same extension pattern and do not conflict with upstream post-baseline changes.
- Fork `frontmatter.cjs` signal-schema validation does not overlap upstream frontmatter fixes.
- Fork `gsd-tools.cjs` router architecture remains valid; upstream worktree/root wiring can be folded into the router later without reopening modularization.

## New Upstream Modules Not In Fork

| Module | Lines | Purpose | v1.18 Relevance |
|--------|-------|---------|-----------------|
| `workstream.cjs` | 491 | Parallel milestone/workstream namespacing | Defer |
| `security.cjs` | 382 | Prompt-injection and path-traversal defenses | Candidate next milestone |
| `model-profiles.cjs` | 68 | Model alias/profile helpers | Candidate next milestone |
| `profile-output.cjs` | 952 | Profile output formatting pipeline | Candidate next milestone |
| `profile-pipeline.cjs` | 539 | Profile processing pipeline | Candidate next milestone |
| `uat.cjs` | 282 | Verification debt / UAT tracking | Candidate next milestone |

## Genuine Gaps

1. `loadConfig()` conflict potential is still medium risk: upstream config-loading changes may need reconciliation with the fork's manifest-based migrations during Phase 49 research.
2. `planningPaths()` versus `loadProjectConfig()` compatibility is low risk but should still be checked explicitly during Phase 49 planning.

## Validity And Refresh

This ledger is valid through approximately **2026-04-07**. Re-verify commit counts and main-only items when Phase 49 planning begins.

- Released routing authority should continue to use `v1.28.0` as the stable comparison target.
- `upstream/main` remains a watchlist because the 31 unreleased commits may still change before the next tag.
