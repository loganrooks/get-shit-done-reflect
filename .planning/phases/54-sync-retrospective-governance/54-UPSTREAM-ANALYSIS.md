# Upstream Trajectory Analysis

**Analysis date:** 2026-03-28
**Baseline:** v1.22.4 (2026-03-10, fork audit freeze)
**Current upstream:** v1.30.0 (2026-03-27) + 1 post-release fix on main
**Delta:** 412 commits, 8 releases since baseline (v1.23.0 through v1.30.0)
**Post-drift-ledger delta:** 71 commits, 2 releases since v1.28.0 (the ledger's comparison target)

## Release Timeline

| Version | Date | Key Changes | Strategic Direction |
|---------|------|-------------|---------------------|
| v1.23.0 | 2026-03-15 | UI-phase/UI-review commands, Copilot runtime, `/gsd:stats`, node repair operator, mandatory `read_first`/`acceptance_criteria` in plans | Verification depth, runtime breadth (Copilot) |
| v1.24.0 | 2026-03-15 | Quick research flag, `inherit` model profile for OpenCode, persistent debug KB, programmatic set-profile | Developer tooling ergonomics |
| v1.25.0 | 2026-03-16 | Antigravity runtime, `/gsd:do` natural language router, `/gsd:note`, comprehensive docs directory | Runtime breadth (Antigravity), user ergonomics |
| v1.25.1 | 2026-03-16 | Patch: model resolution test fixes | Stability |
| v1.26.0 | 2026-03-18 | Developer profiling pipeline, `/gsd:ship`, `/gsd:next`, cross-phase regression gate, requirements coverage gate, session handoff artifact, interactive executor, MCP tool awareness, Codex hooks | Autonomous execution pipeline, developer profiling |
| v1.27.0 | 2026-03-20 | Advisor mode, multi-repo workspace, Cursor runtime, `/gsd:fast`, `/gsd:review`, `/gsd:plant-seed`, `/gsd:pr-branch`, `/gsd:audit-uat`, worktree-aware planning, security hardening | Runtime breadth (Cursor), enterprise scale (multi-repo, worktrees), security |
| v1.28.0 | 2026-03-22 | Workstream namespacing, multi-project workspace, `/gsd:forensics`, `/gsd:milestone-summary`, worktree isolation, multi-runtime installer, temp reaper | Enterprise scale (workstreams, multi-project), infrastructure hardening |
| v1.29.0 | 2026-03-25 | Windsurf runtime, agent skill injection, security scanning CI, i18n (Korean, Portuguese, Japanese), UI-phase in autonomous workflow | Runtime breadth (Windsurf), extensibility (skills), internationalization |
| v1.30.0 | 2026-03-27 | GSD SDK (headless CLI with `init` + `auto`), `--sdk` installer flag, auto `--init`, prompt sanitizer | Autonomous execution, SDK/API surface |

**Release cadence:** 8 releases in 18 days (one every ~2.25 days). This is exceptionally fast, reflecting a project in rapid growth mode with strong community contribution pressure.

## What Is Upstream Responding To?

Analysis of the 50 most recent issues (2026-03-22 through 2026-03-28) reveals the following theme distribution:

### Issue Themes

| Theme | Open | Closed | Total | Representative Issues |
|-------|------|--------|-------|-----------------------|
| **Cross-runtime bugs** | 3 | 5 | 8 | #1351 (Codex out-of-box), #1376 (Codex config break), #1379 (Codex config error), #1392 (node v25 ENOENT), #1430 (installer path replacement) |
| **Verification quality** | 4 | 0 | 4 | #1418 (SC scope reduction), #1431 (unvalidated assumptions as decisions), #1457 (verifier accepts circular tests), #1459 (phases marked Complete without verification) |
| **Feature requests** | 7 | 2 | 9 | #1395 (multi-developer), #1399 (language preference), #1400 (manager passthrough flags), #1413 (subagent automation), #1420 (Playwright verification), #1449 (Playwright dimensional UI), #1390 (Qwencode support) |
| **SDK/headless bugs** | 0 | 3 | 3 | #1424 (SDK MODULE_NOT_FOUND), #1433 (v1.30 broke GSD), #1435 (tilde expansion) |
| **Installer issues** | 3 | 0 | 3 | #1421 (cache wrong directory), #1423 (update removes USER-PROFILE.md), #1430 (unreplaced .claude paths) |
| **Agent quality** | 2 | 1 | 3 | #1388 (ignores Context7 MCP), #1441 ($gsd-next non-existent skill), #1453 (manager bypasses skill pipeline) |
| **Worktree problems** | 1 | 1 | 2 | #1334 (worktree edit permissions), #1451 (worktree merge overwrites changes) |
| **Workflow bugs** | 2 | 1 | 3 | #1365 (begin-phase destroys fields), #1389 (double namespace prefix), #1446 (phase-complete updates) |
| **Documentation/i18n** | 1 | 0 | 1 | #1438 (inconsistent todo archive directory name) |
| **Upstream/external** | 0 | 1 | 1 | #1335 (VSCode version incompatibility) |

### What This Reveals

1. **Cross-runtime complexity is the dominant pain point.** 8 of 50 issues relate to runtime-specific bugs, primarily Codex. Each new runtime adds surface area for edge cases that are difficult to test exhaustively.

2. **Verification quality is emerging as a concern.** Four independent issues (#1418, #1431, #1457, #1459) all point to the same root problem: phases pass verification without meeting their stated criteria. Upstream users are discovering that breadth-first development creates verification gaps.

3. **SDK shipped with immediate breakage.** Three SDK-related issues filed within 24 hours of v1.30.0 suggest the headless CLI was shipped before stabilization. This is consistent with the fast release cadence.

4. **Feature requests outpace stabilization.** 9 feature requests in 6 days, including requests for new runtimes (Qwencode, LM Studio), multi-developer support, and automated UI verification. The community is growing faster than the project can stabilize.

5. **The issue tracker is reactive, not proactive.** Issues are filed by users encountering problems in production. There is no signal pipeline, health monitoring, or systematic quality tracking equivalent to the fork's epistemic infrastructure.

### PR Patterns

30 most recent PRs show:
- **16 open PRs** (unmerged) -- indicates a growing backlog or community contributions awaiting review
- **8 merged** in the last 5 days -- high velocity, primarily SDK and autonomous workflow features
- **6 closed without merge** -- duplicate PRs or superseded approaches (e.g., #1414, #1416 were closed in favor of #1415, #1417)

The PR pattern confirms rapid development with occasional false starts (closed PRs representing abandoned approaches).

## Design Philosophy (Derived from Evidence)

Upstream's design philosophy is not explicitly stated but is clearly visible in their development choices:

### Upstream: Maximize Adoption Surface

| Signal | What It Reveals |
|--------|----------------|
| 7 runtimes (Claude Code, Codex, Gemini, Windsurf, Copilot, Antigravity, Cursor) | Breadth over depth -- serve every AI coding assistant |
| GSD SDK (headless CLI) | Moving toward automation/CI integration -- GSD as a build tool, not just an interactive workflow |
| Agent skill injection (#1355) | User extensibility without forking -- lower the barrier to customization |
| Developer profiling pipeline (v1.26.0) | User experience personalization at scale |
| Security scanning CI | Hardening for a broader, less-trusted user base |
| i18n (Korean, Portuguese, Japanese) | International community growth |
| Workstream namespacing, multi-repo | Enterprise and team use cases |
| ~37 issues in 6 days (Mar 22-28) | Rapidly growing user base generating proportional support burden |
| 16 open PRs | Community contributions at a pace that strains review capacity |

**Philosophy synthesis:** Upstream optimizes for **adoption breadth and user autonomy**. Every new runtime, every new command, every new flag serves the goal of making GSD work for more people in more environments. Quality is addressed **reactively** -- user-reported bugs drive fixes -- rather than **proactively** through systematic monitoring.

The SDK direction (v1.30.0) is particularly significant: it moves GSD from "interactive workflow tool" toward "programmable build system." This is a strategic shift toward CI/CD integration and autonomous execution pipelines.

### Fork: Epistemic Self-Improvement

| Signal | What It Reveals |
|--------|----------------|
| "Never make the same mistake twice" | Core value: process learns from its own failures |
| Signal pipeline (capture -> classify -> synthesize -> KB) | Systematic extraction of process lessons from deviations |
| Knowledge base (cross-project, surfacing, lessons, spikes) | Institutional memory that persists across sessions and milestones |
| Health probes (signal-density, automation-watchdog, validation-coverage) | Proactive quality monitoring, not just reactive bug-fixing |
| Deliberations (persistent design thinking, revision lineage) | Architectural decisions are first-class artifacts with provenance |
| Automation framework (FEATURE_CAPABILITY_MAP, level-based triggering) | Graduated automation based on project maturity, not binary on/off |
| Cross-runtime converters (Gemini, OpenCode, Codex) | Pragmatic multi-runtime support as converters from Claude Code, not native runtimes |
| 1 runtime (Claude Code), deep integration | Depth over breadth -- master one environment completely |

**Philosophy synthesis:** The fork optimizes for **process quality and self-improvement**. Every feature exists to make the development process itself better: signals catch mistakes before they compound, the knowledge base prevents repeating them, health probes monitor epistemic health proactively, and deliberations preserve the reasoning behind architectural choices.

### Philosophical Comparison

| Dimension | Upstream | Fork |
|-----------|----------|------|
| **Primary goal** | Serve the most users | Serve one user deeply |
| **Quality approach** | Reactive (issues drive fixes) | Proactive (signals, health probes, KB) |
| **Runtime strategy** | Native support for 7 runtimes | One runtime + converters for 3 others |
| **Automation model** | Full autonomy (SDK, headless, `--auto`) | Graduated autonomy (maturity-gated, human-in-the-loop) |
| **Verification** | Structural (does it compile/pass tests?) | Epistemic (does the process work well?) |
| **Extensibility** | User skills, config-driven injection | Fork-level customization, KB-driven adaptation |
| **Community** | International, multi-contributor, open issues | Single-user scholarly tool, no community |
| **Release cadence** | Every 2 days | Milestone-driven (multi-week) |

**Both philosophies are valid.** They serve fundamentally different goals. Upstream needs breadth because its success is measured by adoption. The fork needs depth because its success is measured by whether its user (a philosophy PhD student) wastes less time on repeated mistakes.

This difference **explains** most feature gaps. When upstream and the fork face the same problem (e.g., "how should health checking work?"), they solve it differently because they optimize for different outcomes.

## Fork Design Philosophy (for Contrast)

The fork's core value -- "the system never makes the same mistake twice" -- manifests in a pipeline:

```
Signal (deviation captured) -> Classification -> Synthesis -> Knowledge Base -> Surfacing
```

This pipeline is the fork's central contribution. Everything else -- health probes, automation gating, deliberations -- exists to make this pipeline more reliable.

Key expressions:
- **139 signals** captured across 7 milestones, categorized by theme (deviation: 38, testing: 13, config: 12, plan-accuracy: 10, CI: 8, workflow-gap: 4)
- **Health probes** measure epistemic health (signal density, automation watchdog, validation coverage), not just structural integrity
- **Deliberations** preserve design reasoning with revision lineage for citation stability
- **Knowledge base** surfaces relevant lessons before they are needed, scoped to the current task

Upstream has no equivalent to any of these. The closest analog is upstream's `/gsd:health` command, which checks structural integrity (`.planning/` directory validity) -- a different concern entirely (see 54-FEATURE-OVERLAP.md for the worked example).

## Post-Drift-Ledger Assessment (v1.29.0, v1.30.0)

The drift ledger (Phase 48.1, 2026-03-24) classified 372 commits through v1.28.0 into 11 clusters (C1-C11). Since then, 71 additional commits shipped in two releases plus fixes on main. This section extends the classification using the same framework.

### New Cluster: C12 -- Windsurf Runtime + Agent Skill Injection

**Source:** v1.29.0 (2026-03-25)
**Key changes:**
- Windsurf (Codeium) runtime support with full installation and command conversion
- Agent skill injection via `agent_skills` config section (#1355)
- UI-phase and UI-review steps in autonomous workflow

**Classification:** `candidate-next-milestone`
**Rationale:** Windsurf runtime extends the existing multi-runtime pattern (C11). Agent skill injection is a novel extensibility feature that could inform the fork's automation framework. Neither is urgent but both have potential value for future milestones.

### New Cluster: C13 -- GSD SDK / Headless Automation

**Source:** v1.30.0 (2026-03-27)
**Key changes:**
- GSD SDK as TypeScript package (`@gsd-build/sdk`) with `gsd-sdk init` and `gsd-sdk auto` commands
- `--sdk` installer flag for optional SDK installation
- Auto `--init` flag for non-interactive project initialization
- Prompt sanitizer for headless execution
- Headless prompt overhaul for SDK-driven lifecycle

**Classification:** `defer`
**Rationale:** The SDK represents upstream's strategic move toward autonomous execution and CI/CD integration. This is substantially different from the fork's human-in-the-loop epistemic approach. The fork's graduated automation (FEATURE_CAPABILITY_MAP, maturity gating) is philosophically incompatible with fully headless execution. Deferring is not a rejection -- it acknowledges that the fork and upstream are solving different problems with different design constraints.

### New Cluster: C14 -- Internationalization / Community Documentation

**Source:** v1.29.0 (2026-03-25)
**Key changes:**
- Korean (ko-KR) documentation (12 translated files)
- Portuguese (pt-BR) documentation
- Japanese (ja-JP) documentation
- Korean translations refined from formal to natural style
- Repository references updated from `glittercowboy` to `gsd-build`

**Classification:** `defer`
**Rationale:** Internationalization is not relevant to the fork's single-user scholarly use case. The `glittercowboy` to `gsd-build` org rename is cosmetic and does not affect functionality.

### C10 Extension: Security CI

**Source:** v1.29.0 (2026-03-25)
**Key changes:**
- Prompt injection scanning in CI
- Base64 content scanning
- Secret scanning workflows
- `.secretscanignore` for plan-phase false positives
- Security scan self-detection and Windows compatibility

**Classification:** Remains `candidate-next-milestone`
**Rationale:** Security CI is an extension of the C10 security hardening stream already classified as candidate-next-milestone. The fork lacks security scanning entirely; this is a "behind" gap, not a philosophical difference.

### Bug Fixes Assessment (v1.29.0 + v1.30.0)

| Fix | Fork Relevance | Notes |
|-----|---------------|-------|
| Frontmatter `must_haves` parser handles any YAML indentation width | Medium | Fork has its own frontmatter parsing; may benefit from the regex improvement |
| `findProjectRoot` returns startDir when it already has `.planning/` | Already adopted | Folded in via Phase 50 (C2) |
| Begin-phase preserves Status/LastActivity/Progress | Medium | Fork's state management may be affected |
| Missing GSD agents detected with warning on subagent fallback | Low | Fork uses different agent spawning |
| Codex re-install repairs trapped non-boolean keys under `[features]` | Low | Fork's Codex support is converter-based |
| Hook field validation prevents silent settings.json rejection | Already adopted | Folded in via Phase 51 (C7) |
| Codex preserves top-level config keys (>=0.116) | Low | Fork's Codex is converter-based |
| Repo-local gsd-tools.cjs resolution (#1425) | Low | Fork already uses local resolution |

**Assessment:** Most v1.29-v1.30 bug fixes address cross-runtime or SDK-specific issues with low relevance to the fork. The frontmatter and begin-phase fixes are the only ones worth tracking for potential future adoption.

## New Upstream Modules Not in Fork

Upstream has added 6 modules to `lib/` that do not exist in the fork (plus `workstream.cjs` which was already tracked in the ledger):

| Module | Lines | Purpose | Fork Equivalent | Assessment |
|--------|-------|---------|----------------|------------|
| `workstream.cjs` | 491 | Parallel milestone/workstream namespacing for multi-project scale | None -- fork is single-project | **Defer.** Multi-project workstreams are irrelevant to the fork's single-user scholarly use case. |
| `security.cjs` | 382 | Prompt injection guards, path traversal prevention, input validation | None | **Evaluate.** The fork lacks security scanning entirely. This is a "behind" gap -- both projects need security hardening. However, the fork's threat model (single trusted user) is different from upstream's (untrusted community input). |
| `model-profiles.cjs` | 68 | Model alias/profile helpers | `core.cjs` MODEL_PROFILES (QT32) | **Evaluate.** The fork already has cross-runtime model profile logic in core.cjs. These may converge or complement each other. |
| `profile-output.cjs` | 952 | Profile output formatting pipeline (developer profiling) | None | **Defer.** Developer profiling is a user-experience feature for multi-user adoption. Not relevant to a single-user scholarly tool. |
| `profile-pipeline.cjs` | 539 | Profile processing pipeline (developer profiling) | None | **Defer.** Same rationale as profile-output.cjs. |
| `uat.cjs` | 282 | Verification debt / UAT tracking per phase | Verification workflows + health probes | **Evaluate.** The fork has verification workflows but no structured UAT debt tracking. The concepts are complementary -- the fork tracks epistemic health while upstream tracks test debt. |

**Summary:** Of 6 new upstream modules, 3 are not applicable (workstream, profile-output, profile-pipeline), 2 warrant evaluation (security, uat), and 1 may converge with existing fork functionality (model-profiles).

## Upstream Direction Summary

Upstream is evolving from an interactive development workflow tool into a **platform for automated project execution**. The trajectory from v1.22.4 through v1.30.0 shows three clear vectors: (1) runtime breadth (now 7 runtimes), (2) autonomous execution (SDK, headless CLI, auto-advance), and (3) community scale (i18n, multi-developer, workstreams, enterprise features).

This trajectory is complementary to, not conflicting with, the fork's direction. The fork's value proposition -- epistemic self-improvement through signals, knowledge, and proactive quality monitoring -- occupies a different niche entirely. Upstream is heading toward "make GSD work everywhere for everyone"; the fork is heading toward "make GSD learn from its own mistakes."

The practical implication for sync policy is that **selective adoption based on shared concerns** (security hardening, verification quality, bug fixes in shared modules) is more appropriate than "keep up with upstream." Many upstream features (SDK, workstreams, developer profiling, additional runtimes) serve goals the fork does not share. Conversely, the fork's core features (signals, KB, health probes, deliberations) solve problems upstream has not yet addressed.

The relationship is best characterized as **complementary divergence**: both projects improve a shared substrate (gsd-tools.cjs, the modular runtime, the installer) but layer different concerns on top. Sync should focus on the shared substrate and selectively evaluate higher-level features based on the fork's own design philosophy.
