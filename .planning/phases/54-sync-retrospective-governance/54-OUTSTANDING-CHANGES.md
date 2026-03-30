# Outstanding Upstream Changes Assessment

**Assessment date:** 2026-03-28
**Scope:** All upstream changes since v1.22.4 baseline NOT yet addressed by the fork
**Drift ledger reference:** UPSTREAM-DRIFT-LEDGER.md (Phase 48.1, classified through v1.28.0)
**Upstream analysis reference:** [54-UPSTREAM-ANALYSIS.md](54-UPSTREAM-ANALYSIS.md) (release timeline, design philosophy, post-ledger classification)
**Feature overlap reference:** [54-FEATURE-OVERLAP.md](54-FEATURE-OVERLAP.md) (disposition analysis for all overlapping features)

## Drift Ledger Extension (v1.29.0 - v1.30.0)

The Phase 48.1 drift ledger classified 372 commits (v1.22.4 through v1.28.0) into 11 clusters (C1-C11). Since then, upstream shipped 2 additional releases (v1.29.0 on 2026-03-25, v1.30.0 on 2026-03-27) plus 1 post-release fix on main, adding approximately 71 commits. This section extends the classification using the same framework.

### New Clusters

| Cluster | Version | Content | Classification | Rationale |
|---------|---------|---------|---------------|-----------|
| C12 | v1.29.0 | Windsurf runtime support, agent skill injection via `agent_skills` config, UI-phase/UI-review in autonomous workflow | candidate-next-milestone | Extends runtime breadth (fork monitors but doesn't adopt immediately). Agent skill injection is a novel extensibility mechanism that could inform the fork's feature-manifest capability gating. |
| C13 | v1.30.0 | GSD SDK (`@gsd-build/sdk`) with `gsd-sdk init` and `gsd-sdk auto`, `--sdk` installer flag, auto `--init`, prompt sanitizer, headless prompt overhaul | defer | Represents upstream's strategic move toward autonomous execution and CI/CD integration. Substantially different from fork's human-in-the-loop graduated automation philosophy. See 54-UPSTREAM-ANALYSIS.md for design philosophy analysis. |
| C14 | v1.29.0 | i18n documentation (Korean, Portuguese, Japanese), org rename `glittercowboy` to `gsd-build` | defer | Internationalization is not relevant to single-user scholarly fork. Org rename is cosmetic. |

### C10 Extension: Security CI Scanning

**Source:** v1.29.0 (2026-03-25), extending C10 (security hardening) from the original ledger.
**New additions:**
- Prompt injection scanning in CI
- Base64 content scanning
- Secret scanning workflows
- `.secretscanignore` for plan-phase false positives
- Security scan self-detection and Windows compatibility

**Classification:** Remains `candidate-next-milestone` (strengthened case)
**Rationale:** The CI scanning additions reinforce the case for security adoption. The fork has zero security scanning (confirmed as a genuine blind spot by 54-SIGNAL-CROSSREF.md). The original C10 included `security.cjs` (382 lines) for runtime protection; v1.29.0 adds CI-time scanning for defense-in-depth.

### Bug Fixes Assessment (v1.29.0 + v1.30.0)

| Fix | Fork Relevance | Status |
|-----|---------------|--------|
| Frontmatter `must_haves` parser handles any YAML indentation width | Medium | Track for future adoption -- fork has own frontmatter parsing in frontmatter.cjs |
| `findProjectRoot` returns startDir when it already has `.planning/` | Already adopted | Folded in via Phase 50 (C2 partial) |
| Begin-phase preserves Status/LastActivity/Progress | Medium | Track for future -- fork's state management may benefit |
| Missing GSD agents detected with warning on subagent fallback | Low | Fork uses different agent spawning via feature manifest |
| Codex re-install repairs trapped non-boolean keys under `[features]` | Low | Fork's Codex support is converter-based |
| Hook field validation prevents silent settings.json rejection | Already adopted | Folded in via Phase 51 (C7) |
| Codex preserves top-level config keys (>=0.116) | Low | Fork's Codex is converter-based |
| Repo-local gsd-tools.cjs resolution (#1425) | Low | Fork already uses local resolution |
| Invalid `\Z` regex anchor replaced | Low | Not in fork's code path |
| Brownfield project detection expanded | Low | Fork is single-project |
| Worktree agents get `permissionMode: acceptEdits` | Low | Fork does not use worktree agents |
| Auto `--init` flag, prompt sanitizer | Low | SDK-specific, not relevant to fork |

**Assessment:** Most v1.29-v1.30 bug fixes address cross-runtime or SDK-specific issues with low relevance to the fork. Two medium-relevance fixes (frontmatter indentation, begin-phase field preservation) are worth tracking for potential future adoption when those modules next need attention.

## Cluster Status Summary (C1 - C14)

This table tracks the status of all 14 clusters from the original drift ledger (C1-C11) and the v1.29/v1.30 extension (C12-C14).

| Cluster | Description | Original Classification | Status | Addressed In | Notes |
|---------|-------------|------------------------|--------|-------------|-------|
| C1 | Config preservation, Codex absolute agent paths | fold-into-open-phase | **Addressed** | Phase 51 | Absolute Codex paths integrated via installer hardening |
| C2 | Windows shell robustness, findProjectRoot, hook stdin safety | fold-into-open-phase | **Addressed** | Phase 50 (findProjectRoot), Phase 52 (shell robustness, worktree isolation) | Split routing: root detection in Phase 50, shell guards in Phase 52 |
| C3 | Worktree-aware planning resolution, planning lock | fold-into-open-phase | **Addressed** | Phase 49 | planningPaths() adoption with workstream-aware signatures for forward compatibility |
| C4 | Worktree isolation for code-writing agents | fold-into-open-phase | **Addressed** | Phase 52 | Applied to 22 fork workflows alongside C2 shell robustness |
| C5 | `$HOME`/`HOME` path handling | fold-into-open-phase | **Addressed** | Phase 49 (init.cjs HOME), Phase 51 (install.js pathPrefix) | path.basename(targetDir) with $HOME prefix for shell compatibility |
| C6 | Non-Claude model resolution | fold-into-open-phase | **Addressed** | Phase 49 (MODEL_ALIAS_MAP), Phase 51 (resolve_model_ids "omit") | MODEL_ALIAS_MAP adopted additively; resolve_model_ids uses "omit" for non-Claude runtimes, complementary to fork's MODEL_PROFILES |
| C7 | Hook field validation (silent settings rejection) | fold-into-open-phase | **Addressed** | Phase 51 | validateHookFields() two-pass approach wired at settings load and finishInstall write |
| C8 | `commit_docs` gitignore auto-detection | fold-into-open-phase | **Addressed** | Phase 49 | loadConfig() change folded into config migration work |
| C9 | `planningPaths()` helper across planning modules | fold-into-open-phase | **Addressed** | Phase 49 | Centralized planning-path construction adopted with workstream-aware signatures |
| C10 | Security hardening (security.cjs + CI scanning) | candidate-next-milestone | **Outstanding** | -- | 382-line security.cjs + v1.29.0 CI scanning additions. Genuine fork blind spot confirmed by 54-SIGNAL-CROSSREF.md. |
| C11 | Broader feature/runtime expansion | defer | **Deferred** | -- | Runtime breadth, developer profiling, SDK precursors. Not relevant to fork's design philosophy. |
| C12 | Windsurf runtime, agent skill injection | candidate-next-milestone | **Outstanding** | -- | New in v1.29.0. Windsurf extends multi-runtime pattern; agent skills are a novel extensibility mechanism. |
| C13 | GSD SDK / headless automation | defer | **Outstanding (deferred)** | -- | New in v1.30.0. Different product direction from fork's human-in-the-loop approach. |
| C14 | i18n (Korean, Portuguese, Japanese) | defer | **Outstanding (deferred)** | -- | New in v1.29.0. Not relevant to single-user English-language tool. |

**Summary:** 9 of 11 original clusters (C1-C9) have been fully addressed during v1.18 Phases 49-52. C10 remains the strongest outstanding candidate. C11 and C12-C14 are deferred or awaiting evaluation.

## Priority Assessment

### Priority 1: Evaluate for Next Milestone

| Item | Source | Why Prioritize | Effort Estimate | Fork Alignment |
|------|--------|---------------|-----------------|----------------|
| security.cjs adoption + CI scanning | C10 + C10-ext (v1.29.0) | Fork blind spot -- zero security hardening. Universally valuable regardless of threat model. Both 54-SIGNAL-CROSSREF.md and 54-FEATURE-OVERLAP.md identify this as a genuine gap, not a philosophical difference. | Medium (new module, no conflict with existing fork modules) | High -- security of the epistemic pipeline itself |
| model-profiles.cjs reconciliation | Drift ledger + 54-FEATURE-OVERLAP.md | Fork has partial equivalent in core.cjs MODEL_PROFILES (QT32). Upstream's model-profiles.cjs (68 lines) is a complementary approach. Reconciliation before further divergence would reduce future sync friction. | Low-Medium (68-line module, reconcile with existing MODEL_PROFILES) | Medium -- shared concern, converging implementations |
| Begin-phase field preservation fix | v1.29.0 bug fix | STATE.md Status/LastActivity/Progress preservation during begin-phase. Fork's state management may be affected (progress telemetry staleness was identified in 54-RETROSPECTIVE.md). | Low (targeted bug fix) | High -- relates to known progress tracking issue |

### Priority 2: Monitor / Evaluate

| Item | Source | Why Monitor | Fork Impact |
|------|--------|------------|-------------|
| Windsurf runtime | C12 (v1.29.0) | Extends multi-runtime support to 7 runtimes. Fork monitors but uses converter approach. If Windsurf becomes relevant, add a converter rather than native support. | Low (additive, converter-based) |
| Agent skill injection | C12 (v1.29.0) | Alternative to fork's feature-manifest capability gating. Config-driven `agent_skills` vs fork's declarative manifest. Worth watching for interface reconciliation. | Low (philosophical difference in extensibility model) |
| uat.cjs adoption | Drift ledger | Per-phase verification debt tracking. Fork has health probes but not structured UAT debt. Would complement health-probe.cjs. Evaluate whether it adds value beyond existing probes. | Medium (complementary to health-probe pipeline) |
| Cross-phase regression gate | v1.26.0 (54-FEATURE-OVERLAP.md) | Execute-phase runs prior phases' test suites. Fork catches regressions post-hoc via signals; this would add pre-hoc prevention. | Medium (quality improvement) |
| Frontmatter indentation fix | v1.29.0 bug fix | Must_haves parser handles any YAML indentation width. Fork has own frontmatter.cjs parsing. | Low (targeted fix if fork encounters the issue) |

### Priority 3: Defer / Not Applicable

| Item | Source | Why Defer | Revisit When |
|------|--------|-----------|--------------|
| GSD SDK / headless CLI | C13 (v1.30.0) | Different product direction. Fork's graduated automation philosophy is incompatible with fully headless execution. | If fork ever needs CI/CD integration (would build different solution preserving human judgment) |
| i18n | C14 (v1.29.0) | Single-user English-language scholarly tool | Never (unless fork gains community) |
| Workstream namespacing | C11 subset | Fork is single-project, single-user | If fork ever manages multiple projects |
| Developer profiling pipeline | C11 subset (profile-output.cjs, profile-pipeline.cjs) | Single user with known preferences | Never (unless fork gains community) |
| Additional runtimes (Copilot, Antigravity, Cursor) | C11 subset | Fork uses converter approach. Native support adds maintenance surface for marginal benefit. | If specific runtime becomes primary for fork user |
| SDK-related bug fixes | v1.30.0 | Only applicable to headless SDK execution | Only if SDK direction is adopted |

## Recommendation for Next Sync Cycle

Based on this assessment, the next upstream sync milestone should focus on three areas, ordered by priority:

### 1. Security Hardening (P1 -- Genuine Gap)

Adopt `security.cjs` (382 lines) and evaluate CI scanning workflows. This is the single strongest candidate because:
- Identified as a genuine blind spot by three independent analyses (54-FEATURE-OVERLAP.md behind classification, 54-SIGNAL-CROSSREF.md blind spot analysis, 54-RETROSPECTIVE.md lesson)
- Zero fork signals about security concerns in the KB (the pipeline does not observe what it cannot detect)
- The fork's epistemic pipeline is only as trustworthy as its inputs -- if agent specifications can be manipulated through prompt injection, the entire self-improvement system is vulnerable
- The module is fork-independent (no conflicts with existing modules)

**Recommended scope:** Adopt security.cjs with fork-appropriate threat model scoping. The fork's single-user trusted environment means some upstream protections (untrusted community input scanning) may be unnecessary, but basic prompt injection and path traversal guards protect the agent layer.

### 2. Model Profile Reconciliation (P1 -- Convergence Opportunity)

Reconcile core.cjs MODEL_PROFILES (QT32) with upstream's model-profiles.cjs (68 lines) before further divergence makes reconciliation harder. Both solve the same problem (which model for which agent on which runtime) with different implementations. Early reconciliation prevents a "behind" gap from becoming a "divergent" gap.

### 3. Selective Bug Fix Adoption (P1-P2 -- Low Effort, High Value)

Adopt the begin-phase field preservation fix, which relates to the progress telemetry staleness issue identified in 54-RETROSPECTIVE.md. This is a targeted fix that addresses a known problem.

### What to Skip

The SDK direction (C13), additional runtimes beyond converters (C11/C12), developer profiling (C11), i18n (C14), and workstream namespacing are all correctly classified as deferred or not-applicable. They serve upstream's adoption-breadth strategy, which is complementary to but different from the fork's epistemic-depth strategy. See 54-UPSTREAM-ANALYSIS.md for the philosophical analysis underpinning this assessment.

### Sync Strategy Note

The v1.18 retrospective (54-RETROSPECTIVE.md) recommends freezing the baseline at a tagged release and budgeting one retriage phase for any sync spanning more than 2 weeks. The next sync should:
1. Freeze at a specific upstream tag (e.g., v1.30.0 or whatever is current at sync start)
2. Scope to the P1 items above plus any new upstream module fixes to pure-upstream modules (milestone.cjs, state.cjs, template.cjs, verify.cjs)
3. Budget a retriage phase at the halfway point if execution spans more than 2 weeks

---
*Assessment date: 2026-03-28*
*Artifact: INF-09 outstanding changes assessment*
*Extends: UPSTREAM-DRIFT-LEDGER.md (Phase 48.1, C1-C11) with C12-C14 classification*
*References: 54-UPSTREAM-ANALYSIS.md, 54-FEATURE-OVERLAP.md, 54-SIGNAL-CROSSREF.md, 54-RETROSPECTIVE.md*
