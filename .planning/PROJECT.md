# GSD Reflect

## What This Is

A self-improving, runtime-agnostic enhancement to the GSD (Get Shit Done) workflow system. Features a complete signal lifecycle (detect, triage, remediate, verify, recurrence check) with multi-sensor collection (artifact + git + CI sensors), confidence-weighted reflection that distills lessons from accumulated signals, and epistemic rigor (counter-evidence seeking, tiered validation) built into every stage. The automation loop is self-triggering: signal collection auto-fires after phase execution, reflection auto-triggers after configurable phase counts, health checks run at session start, and CI failures surface immediately — all governed by a 4-level automation system (manual/nudge/prompt/auto) with per-feature overrides and context-aware deferral. Includes a persistent knowledge base (project-local at `.planning/knowledge/` with `~/.gsd/knowledge/` fallback), a structured spike/experiment workflow for resolving design uncertainty empirically, and knowledge surfacing that retrieves relevant lessons during research and planning. Signal-plan linkage closes the loop: plans declare which signals they fix, completion auto-updates remediation status, and passive verification confirms fixes after configurable phase windows. Plan intelligence validates plans semantically before execution (tool/config/dir/signal reference checking). Health scoring provides two-dimensional assessment (infrastructure + workflow) with traffic-light statusline display and rogue file detection. Supports 4 runtimes (Claude Code, OpenCode, Gemini CLI, OpenAI Codex CLI) with cross-runtime pause/resume, shared state, per-runtime capability detection, and GSDR namespace co-installation alongside upstream GSD. Includes a structured backlog system (per-project + global), a declarative feature manifest for config-driven upgrades, and a shared agent protocol for maintainable agent specs. Synchronized with upstream GSD v1.18.0 including the gsd-tools CLI, thin orchestrator architecture, and 11 bug fixes. Includes production tooling: workspace health checks with probe-based architecture, version migration, DevOps context capture, and installer hardening with safeFs error reporting.

## Core Value

The system never makes the same mistake twice — signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

## Requirements

### Validated

- ✓ Command orchestration with multi-agent subagent pattern — existing
- ✓ Parallel research, planning, and execution workflows — existing
- ✓ State management via .planning/ directory (STATE.md, ROADMAP.md, config.json) — existing
- ✓ Atomic commits per task with session recovery — existing
- ✓ Multi-runtime support (Claude Code, OpenCode, Gemini CLI) — existing
- ✓ Checkpoint-based deviation handling — existing
- ✓ Codebase mapping for brownfield projects — existing
- ✓ Signal tracking: automatic detection of workflow deviations — v1.12
- ✓ Signal tracking: implicit signal capture from user frustration — v1.12
- ✓ Signal tracking: self-reflection on agent performance (debugging struggles, plan deviations) — v1.12
- ✓ Signal tracking: informative trace logging that enables root cause diagnosis — v1.12
- ✓ Spike workflow: translate design uncertainty into testable hypotheses — v1.12
- ✓ Spike workflow: structured experimental design with defined metrics — v1.12
- ✓ Spike workflow: iterative narrowing support (max 2 rounds) — v1.12
- ✓ Spike workflow: produce ADR-style decision records — v1.12
- ✓ Knowledge base: persistent store of signals, spike results, and distilled lessons — v1.12
- ✓ Knowledge base: automatic querying during research phases — v1.12
- ✓ Knowledge base: cross-project lesson surfacing — v1.12
- ✓ Knowledge base: spike result reuse — v1.12
- ✓ Self-improvement loop: system reflects on performance after phases — v1.12
- ✓ Self-improvement loop: pattern detection across accumulated signals — v1.12
- ✓ Self-improvement loop: workflow improvement suggestions from signal patterns — v1.12
- ✓ Production: workspace health check command — v1.12
- ✓ Production: version migration and upgrade-project command — v1.12
- ✓ Production: DevOps context capture during project initialization — v1.12
- ✓ Production: fork-specific README and CHANGELOG — v1.12
- ✓ Fork strategy: tracked-modifications with documented divergences — v1.13
- ✓ Upstream sync: 70 commits merged (v1.11.2→v1.18.0) with 8 conflicts resolved — v1.13
- ✓ Architecture: gsd-tools CLI adopted with thin orchestrator pattern across 29 commands — v1.13
- ✓ Bug fixes: 11 upstream fixes applied (executor verification, context fidelity, parallelization, commit_docs, etc.) — v1.13
- ✓ Features: 7 upstream features adopted (--auto, --include, Brave Search, reapply-patches, JSONC, update detection, config persistence) — v1.13
- ✓ Testing: 135 tests passing (53 fork vitest + 75 upstream gsd-tools + 7 fork gsd-tools) — v1.13
- ✓ Dogfooding: knowledge base validated in production (13 signals, 3 lessons, KB comparison) — v1.13
- ✓ Runtime abstraction: installer splits paths into runtime-specific vs shared with two-pass replacement — v1.14
- ✓ Runtime capability matrix declaring per-runtime tool availability for 4 runtimes — v1.14
- ✓ Feature detection (has_capability) in workflows instead of runtime name checks — v1.14
- ✓ Degraded behavior documented per runtime with graceful fallbacks — v1.14
- ✓ Knowledge base migrated to runtime-agnostic ~/.gsd/knowledge/ with GSD_HOME override — v1.14
- ✓ Backward-compatible symlink bridge and automated migration with pre-migration backup — v1.14
- ✓ OpenAI Codex CLI as 4th runtime with Skills format, AGENTS.md, and MCP config.toml — v1.14
- ✓ Cross-runtime pause/resume with semantic handoff files and runtime detection — v1.14
- ✓ Signal entries enriched with runtime/model provenance and capability-gap type — v1.14
- ✓ All 4 runtimes validated end-to-end with 54 new tests (159 total) — v1.14
- ✓ KB provenance fields (runtime, model, gsd_version) in all entry types — v1.14
- ✓ Gemini/Codex format converters for agent body text and MCP configuration — v1.14
- ✓ Signal command context reduced 7.6x (888→116 lines) with self-contained pattern — v1.14
- ✓ Spike workflow enhanced with feasibility section and research-first advisory gate — v1.14
- ✓ Shared agent execution protocol extracted into agent-protocol.md, referenced by all agent specs — v1.15
- ✓ Feature manifest system with typed config schemas and manifest-driven upgrade/new-project/update flows — v1.15
- ✓ Manifest-driven config migration with lenient validation, atomic writes, and migration logging — v1.15
- ✓ Backlog system with two-tier storage, Markdown+YAML items, 7 CLI subcommands, and auto-indexing — v1.15
- ✓ Backlog workflow integration: milestone scoping, todo promotion, completion review — v1.15
- ✓ Workflow DX: /gsd:quick complexity gate, safeFs() installer hardening, portable shell scripts — v1.15
- ✓ 256 tests passing (163 gsd-tools + 73 install + 20 wiring) — v1.15

- ✓ Multi-sensor collect-signals orchestrator (artifact, git sensors with synthesizer dedup) — v1.16
- ✓ Signal lifecycle metadata (triage, remediation tracking, verification, recurrence linking) — v1.16
- ✓ Enhanced /gsd:reflect with lifecycle awareness, confidence-weighted pattern detection, counter-evidence seeking — v1.16
- ✓ Signal-plan linkage: resolves_signals, auto-remediation, passive verification-by-absence — v1.16
- ✓ Spike system: lightweight research mode, end-to-end execution, reflect-to-spike pipeline — v1.16
- ✓ Epistemic rigor: counter-evidence fields, positive signals, confidence tracking, tiered validation — v1.16
- ✓ Full signal lifecycle demonstrated end-to-end (detected → triaged → remediated → verified) — v1.16
- ✓ 329 tests passing (155 fork + 174 upstream) — v1.16

- ✓ CI wiring test fixed with meta-test preventing recurrence — v1.17
- ✓ Automation framework: 4-level system (manual/nudge/prompt/auto) with per-feature overrides, runtime capping, context-aware deferral — v1.17
- ✓ Extensible sensor architecture with auto-discovery, standardized contract, enable/disable config — v1.17
- ✓ Project-local knowledge base at .planning/knowledge/ with ~/.gsd/knowledge/ fallback — v1.17
- ✓ CI sensor detecting failed runs, branch protection bypass, test regression with graceful degradation — v1.17
- ✓ Signal collection automation: postlude-triggered after phase execution with reentrancy protection and regime tracking — v1.17
- ✓ Health score: two-dimensional scoring (infrastructure + workflow), traffic light statusline display, probe-based architecture — v1.17
- ✓ Health check automation: session-start hook trigger, reactive threshold, rogue file detection — v1.17
- ✓ Reflection automation: counter-based triggering with threshold gating, confidence evolution, report chaining — v1.17
- ✓ Plan intelligence: semantic validation (tool/config/dir/signal refs), advisory severity policy — v1.17
- ✓ Template provenance: model/context_used_pct in summaries, requirement linkage in reflections, Internal Tensions in feature specs — v1.17
- ✓ GSDR namespace co-installation: install-time namespace rewriting, side-by-side with upstream GSD — v1.17
- ✓ Worktree-safe hooks with shell existence guards — v1.17
- ✓ 278 tests passing (vitest) — v1.17

- ✓ Modular CLI architecture — 5,400-line monolith restructured to 674-line router + 16 lib/*.cjs modules (11 upstream + 5 fork) — v1.18
- ✓ Manifest-driven config migration with declarative field renames (depth→granularity) and multi-version upgrade chains — v1.18
- ✓ Migration test hardening — 9 requirements covering namespace scan, idempotency, crash recovery, behavioral equivalence, project-root authority — v1.18
- ✓ Update system hardening — per-release migration specs, stale cleanup, hook validation, fresh-vs-upgrade detection — v1.18
- ✓ Feature adoption — context-monitor, Nyquist auditor, code-aware discuss-phase, 4 workflows, CLAUDE_CONFIG_DIR, shell robustness, worktree isolation — v1.18
- ✓ Deep integration — adopted features woven into signal/automation/health/reflection pipeline; context-monitor drives automation deferral, Nyquist gaps flow into KB — v1.18
- ✓ Durable sync governance — upstream trajectory analysis, feature overlap inventory, sync retrospective, formalized sync policy in FORK-STRATEGY.md — v1.18
- ✓ CI cache scoped per-project preventing cross-project pollution — v1.18
- ✓ 628 tests passing (419 vitest + 191 upstream + 18 fork) — v1.18

### Active

## Current Milestone: v1.20 Signal Infrastructure & Epistemic Rigor

**Goal:** Replace advisory quality controls with structural enforcement, mature the signal system from detection-only to full lifecycle management with a queryable knowledge base, overhaul spike methodology with epistemically rigorous experimental design, and establish measurement infrastructure for evidence-based workflow improvement.

**Target features:**

**KB Architecture & Signal System**
- KB query layer (architecture TBD via spike: CLI, MCP server, or both) with SQLite index over file-based storage
- Signal schema evolution: lifecycle states, polarity (negative/positive/mixed), response disposition (fix/formalize/monitor/investigate), qualification links (qualified-by, superseded-by)
- Signal-to-issue/opportunity escalation model with developer control
- KB developer experience: queryable, filterable, navigable signal/issue/opportunity views
- Cross-machine KB discovery mechanism
- Patch sensor: detect source vs installed divergence, classify as bug/customization/opportunity

**Measurement & Telemetry**
- Token usage extraction tooling from session-meta and JSONL data
- Measurement baseline establishment for evidence-based intervention evaluation
- Prediction framework: quantitative, qualitative, structural, interaction, temporal, and risk dimensions
- Log sensor integration into collect-signals (progressive deepening, validated by audit)

**Spike Methodology Overhaul**
- Spike design reviewer agent (analogous to plan-checker for experiments)
- Spike findings reviewer agent (analogous to verifier for experiments)
- Spike programme/campaign infrastructure: shared assets, programme ROADMAP, cross-spike qualification
- Template revisions: DECISION.md three-tier outcomes (decided/provisional/deferred), three-level confidence (measurement/interpretation/extrapolation), metric limitation documentation, sample design section
- Epistemological framework informed by Lakatos (research programmes), Duhem-Quine (auxiliary hypotheses), Mayo (severe testing) — not naive Popperian falsificationism
- Protocol adherence checkpoints: verify DESIGN.md methodology was actually followed
- Cross-spike backward propagation and qualification mechanism

**Structural Enforcement**
- Gate enforcement: offer_next PR/CI, merge --merge default, quick task branch detection, .continue-here consumption lifecycle
- Sensor model echo before dispatch
- Automation postlude structural fix (hook where available, advisory where not)
- Incident self-signal hook for cascade/destructive failures
- Discuss-phase adoption completion (5 missing files from upstream adoption)

**Workflow Gaps**
- `/gsdr:cross-model-review` command with flexible protocol
- `/gsdr:revise-phase-scope` for mid-phase scope changes
- `/gsdr:research` lightweight pre-milestone research command
- Parallel phase execution on worktrees for non-overlapping phases

**Cross-Runtime Parity (Claude Code + Codex CLI)**
- Enforce proper parity or graceful degradation for all new features across both runtimes
- Codex CLI operational knowledge: parameters, context window, reasoning effort, prompt style differences
- Patch compatibility checking before cross-runtime application
- PID management and process lifecycle for concurrent Codex sessions
- Cross-runtime distribution gap: ensure GSDR fixes reach projects running global GSD

**Design constraints (from session handoff — things v1.20 must NOT do):**
1. Don't bake KB storage format assumptions into the sensor pipeline — signals output in format a future graph-based KB could consume
2. Don't hardcode single-machine paths — use abstraction layer extensible for cross-machine bridge
3. Don't merge signal and issue concepts prematurely — build escalation, don't collapse the distinction
4. Don't design token tooling around current pricing — capture raw counts + model identifiers, cost calculation separate and swappable
5. Don't over-formalize cross-model review — the pattern works partly because it's informal

### Out of Scope

- User-facing dashboard or web UI — GSD is CLI-native
- Multi-user collaboration on shared knowledge base — start with per-user, consider later
- Automated code fixes based on signals — signals inform humans/agents, don't auto-patch
- ML-based signal classification — heuristic rules are sufficient and debuggable
- Continuous background monitoring — event-driven checkpoints instead
- Signal/issue ontology full design (promotion mechanisms, GitHub integration) — v1.21, informed by v1.20 schema groundwork
- KB organization at scale (pruning, archiving, re-reading) — v1.21, after query layer establishes access patterns
- Continental philosophy of memory grounding (Stiegler, Ricoeur, Bergson, Derrida) — v1.22+, requires arxiv-sanity-mcp operational for literature survey
- Full Issue #17 completion (cross-runtime drift hardening, 9 acceptance criteria) — v1.21, v1.20 addresses KB authority subset
- Automation loop ungating (0% fire rate → safe automatic triggering) — v1.21, after v1.20 postlude structural fix establishes reliable trigger
- A parallel shadow CLI (`gsd-reflect-tools.js` / `fork-tools.js`) used to avoid upstream integration — v1.18 standard is upstream module adoption plus minimal in-place fork extensions where required
- Full subagent parity in Codex CLI — Codex has no Task tool equivalent; graceful degradation instead
- Windows-specific runtime support — macOS/Linux focus; Windows fixes from upstream can be adopted later
- Runtime-specific test suites per runtime — validated via Claude Code + mechanical installer tests
- Web UI / Kanban board for backlog — GSD is CLI-native, zero-dependency
- Automatic priority scoring for backlog — priority is subjective, auto-scoring creates false confidence
- Backlog item dependencies — over-engineering; dependencies belong in roadmap phases
- Config migration rollback scripts — config changes are additive with defaults; nothing to undo

## Context

Shipped v1.18 Upstream Sync & Deep Integration. v1.19 version slot burned by commit prefix incident (patch release used feat: prefix). v1.20 scoped from the most comprehensive audit the project has conducted: 100 sessions across 10 projects on 2 machines, 165 findings (42 negative, 35 positive unique patterns), 13 RECURRED findings where advisory-text fixes failed, model comparison experiment (5 models, clean vs contaminated prompts), and telemetry data source survey.

**Evidence base:** `.planning/audits/session-log-audit-2026-04-07/` — 32 reports, verification analyses, synthesis documents, model comparison data. Key structural finding: every failed intervention used advisory text, not structural enforcement.

**Open design questions for v1.20 research:**
- KB architecture: CLI vs MCP server vs both? File+SQLite vs graph DB? What downstream effects does each choice have?
- Spike epistemological framework: how to operationalize Lakatos (research programmes), Duhem-Quine (auxiliary hypotheses), Mayo (severe testing) without creating rigid institutional procedures
- Parallel execution infrastructure: STATE.md conflict resolution, phase dependency mapping, worktree merge strategy
- Signal/issue/opportunity exposure model: what do developers see? how does escalation work?
- Token telemetry interpretive framework: which metrics are predictive of quality? (telemetry survey "Still Open" items 1-4)
Tech stack: Node.js, Markdown specifications, YAML frontmatter, shell scripts, modular `gsd-tools.cjs` CLI router (674 lines) plus 16 `bin/lib/*.cjs` runtime modules (8,824 lines total).
Architecture: Commands (thin orchestrators) → Workflows → Templates/References → Agents (with shared agent-protocol.md), Runtime layer (Node.js) for installation and hooks. Multi-sensor signal collection (artifact + git + CI sensors → synthesizer → KB). Health probes (modular .md specs executed by probe executor, including validation-coverage probe). Automation framework (4-level system with per-feature overrides, context-aware deferral via bridge files). Context-monitor hook for usage-based automation decisions.
Knowledge base: `.planning/knowledge/` (project-local, version-controlled) with `~/.gsd/knowledge/` fallback. Contains `signals/`, `spikes/`, `reflections/` subdirectories, auto-generated `index.md`, lifecycle state machine, and provenance fields.
Backlog: Two-tier storage (`.planning/backlog/items/` per-project, `~/.gsd/backlog/items/` global) with Markdown+YAML items, 7 CLI subcommands, auto-indexed.
Test suite: 628 tests (419 vitest + 191 upstream node:test + 18 fork node:test), CI/CD via GitHub Actions with branch protection.
7 milestones shipped (v1.12-v1.18), 55 phases, 166 plans completed.

**Fork status (post-v1.18):**
- Fork at v1.18.0, upstream at v1.30.0 (as of 2026-03-28 analysis)
- v1.18 adopted upstream's modular architecture and 10 features with deep integration
- GSDR namespace co-installation enables side-by-side with upstream GSD
- Tracked-modifications strategy with FORK-DIVERGENCES.md documenting per-module merge stances (16 modules)
- 4 runtimes supported: Claude Code, OpenCode, Gemini CLI, OpenAI Codex CLI
- Durable sync policy formalized: trigger-based cadence, baseline-freeze rules, 5-class gap taxonomy, integration depth standard
- Outstanding upstream work prioritized: security hardening (P1), new modules (P2), test infrastructure (P3)
- Fork-upstream relationship characterized as complementary divergence — shared substrate, different higher-level concerns

## Constraints

- **Architecture**: Must follow existing GSD patterns (Markdown commands, XML workflows, agent specs) — no new runtime dependencies
- **Storage**: Knowledge base must be file-based (no databases) to maintain GSD's zero-dependency philosophy
- **Compatibility**: Must work across Claude Code, OpenCode, Gemini CLI, and OpenAI Codex CLI runtimes
- **Context**: Signal logging and knowledge base queries must not bloat agent context windows — lazy loading is critical
- **Non-invasive**: Signal tracking must not slow down or interrupt normal workflow execution
- **Fork maintenance**: This is a fork of GSD upstream — divergences from upstream files are tracked in FORK-DIVERGENCES.md with explicit category, rationale, and merge stance. See FORK-STRATEGY.md for the full maintenance approach

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| File-based knowledge base (not database) | Matches GSD's zero-dependency, Markdown-native architecture | ✓ Good — `~/.claude/gsd-knowledge/` with Markdown + YAML frontmatter |
| Per-user knowledge base location (~/.gsd/) | Knowledge should travel with user across projects, accessible by all runtimes | ✓ Good — migrated from ~/.claude/ to ~/.gsd/knowledge/ in v1.14 |
| Implicit signal capture (not just explicit) | Users express frustration without invoking commands; system should notice | ✓ Good — frustration detection via pattern matching in /gsd:signal |
| Spike as first-class workflow (/gsd:spike) | Experimentation needs structure to avoid derailing the main workflow | ✓ Good — isolated workspace with ADR-style decision output |
| Knowledge base queried during research phase | Most natural integration point; researchers already search for context | ✓ Good — all 4 agents (researcher, planner, debugger, executor) query KB |
| Tracked-modifications fork strategy (supersedes additive-only) | Additive-only kept merges clean but became impractical as fork needed branding, behavior changes, and deeper integration. Tracked-modifications explicitly records all divergences with merge stances. | Evolved v1.13 -- see FORK-STRATEGY.md and FORK-DIVERGENCES.md |
| Vitest over Jest | ESM-native, faster, simpler config | ✓ Good — 42 tests running cleanly |
| Three-tier benchmark system | Different cost profiles for different validation depths | ✓ Good — quick/standard/comprehensive tiers |
| Spikes produce findings, not decisions | Existing layers (CONTEXT.md, RESEARCH.md) make decisions | ✓ Good — clean separation of concerns |
| Max 2 iteration rounds per spike | Prevents rabbit holes while allowing refinement | ✓ Good — convergence constraint |
| Severity-weighted pattern detection for reflection | Critical signals surface faster than trace | ✓ Good — threshold-based with categorical confidence |
| Pull-based KB retrieval with token budget | Prevents context bloat in agents | ✓ Good — ~500 tokens researcher/debugger, ~200 executor |
| Health check purely mechanical | No subjective quality assessment | ✓ Good — actionable pass/warning/fail results |
| Migrations always additive | Never remove or modify existing config fields | ✓ Good — backward compatible upgrades |
| Traditional merge over rebase for sync | 145 fork commits + 17 modified files makes rebase painful | ✓ Good — single merge commit f97291a |
| Adopt upstream CLI modules and extend them in place where warranted | A shadow fork CLI would preserve divergence and block deep integration; upstream modules should remain the substrate while fork behavior is layered with minimal targeted edits | ✓ Good — Phases 45-48 landed upstream module adoption, fork extraction, and in-place extension via `bin/lib/*.cjs` |
| Upstream drift routed to existing phases, not new inserted phases | 9 fold-into clusters map naturally to Phase 49-52 boundaries; zero must-integrate-now items; adding more phases here would fragment coherent work packages | ✓ Good — confirmed by function-level overlap analysis in `48.1-RESEARCH.md` |
| Thin orchestrator pattern for all commands | Upstream architecture: commands delegate to workflows | ✓ Good — 29 commands converted, cleaner separation |
| Upstream for substrate, fork for epistemic behavior | Architectural/runtime/safety improvements should usually be adopted from upstream; fork-specific epistemic loops, KB semantics, automation, and reflection remain fork-owned unless an explicit bridge is designed | ✓ Good — fork audit and v1.18 routing use this as the working adoption filter |
| GitHub Discussions as fork community link | No fork Discord; GitHub Discussions is built-in and zero-setup | ✓ Good — replaced join-discord with community command |
| File-based KB over upstream's reverted MCP Memory | Production data confirms: file-based approach has lower friction, works cross-project | ✓ Good — KB-COMPARISON.md documents evidence |

| Runtime-agnostic KB at ~/.gsd/knowledge/ | ~/.claude/gsd-knowledge/ ties KB to one runtime; shared location enables cross-runtime interop | ✓ Good — two-pass path replacement, symlink bridge, GSD_HOME support |
| OpenAI Codex CLI as 4th runtime | User's primary secondary runtime alongside Claude Code | ✓ Good — Skills format, AGENTS.md, MCP config.toml generation |
| Full continuity handoff across runtimes | /gsd:pause-work and /gsd:resume-work should work cross-runtime | ✓ Good — semantic handoff files with path-prefix runtime detection |
| Two-pass path replacement in installer | KB paths need shared location, runtime paths need per-runtime prefix | ✓ Good — replacePathsInContent() with Pass 1 (KB→~/.gsd/) then Pass 2 (runtime-specific) |
| Static capability matrix as reference doc | Per-runtime tool availability needs to be declared but not configured | ✓ Good — capability-matrix.md with has_capability() prose pattern |
| Signal command self-contained pattern | Loading full reference docs bloated signal context by 888 lines | ✓ Good — 7.6x reduction, rules inlined into command file |
| Provenance fields in all KB entry types | Cross-runtime debugging needs runtime/model/version context | ✓ Good — optional fields in common base schema, backward compatible |
| KB scripts copied (not symlinked) to ~/.gsd/bin/ | Runtime-agnostic access to management scripts | ✓ Good — installKBScripts() copies on install |
| Pre-migration backup before KB migration | Data safety net for existing installations | ✓ Good — timestamped backup with integrity verification |
| Research-first advisory gate for spikes | Prevent premature spiking when research would suffice | ✓ Good — non-blocking advisory, orchestrator-triggered spikes already have research |
| Monolithic agent-protocol.md (not split) | 534 lines is manageable; splitting adds indirection without benefit at this scale | ✓ Good — single file, single edit propagates to all 11 agents |
| Feature manifest as additive-only schema | Manifest describes what CAN exist, not what MUST; unknown config fields always preserved | ✓ Good — lenient validation, zero breaking changes on upgrade |
| Manifest-driven config migration | Hardcoded field additions scattered across workflows were unmaintainable | ✓ Good — manifest is single source of truth for config requirements |
| Two-tier backlog storage (project + global) | Ideas should be capturable anywhere; global ideas travel across projects | ✓ Good — mirrors KB two-tier pattern with GSD_HOME support |
| Backlog review always skippable | Never gate milestone completion on backlog triage | ✓ Good — nudge, don't block |
| safeFs thunk pattern for installer | Wrapping every fs call individually duplicates API signatures | ✓ Good — lambda-based, logging only, always re-throws |
| Complexity gate for /gsd:quick | Trivial tasks don't need planner spawn; complex tasks need full flow | ✓ Good — word-boundary matching for multi-step indicators |
| Frozen detection payload + mutable lifecycle fields | Signal observations are historical facts; lifecycle progression is separate from detection | ✓ Good — mutability boundary enforced by agents, not code |
| Confidence-weighted pattern detection | Raw occurrence counts miss quality; high-confidence signals should weight more | ✓ Good — 3 high-confidence criticals surface faster than 5 low-confidence minors |
| Single KB writer (synthesizer) | Multiple sensors writing concurrently causes races and duplicates | ✓ Good — sensors return candidates, synthesizer is sole writer with dedup |
| Passive verification-by-absence | Requiring explicit verification of every fix is impractical; no recurrence after N phases is strong evidence | ✓ Good — configurable verification_window (default 3 phases) |
| Lightweight research spike mode | Full BUILD/RUN cycle is overkill for "which format does X use?" questions | ✓ Good — option 4 in run-spike.md, completed Spike 002 end-to-end |
| Per-run triage cap of 10 signals | First reflection on 78 signals would modify too many files in one session | ✓ Good — bounds blast radius, user can run reflect again |

| 5 milestone themes from post-v1.16 deliberation | Sequential analysis of dependency graph identified M-A (Automation Loop) as foundational | ✓ Good — v1.17 shipped, M-B through M-E follow |
| Critical state transitions must be programmatic (scripts/hooks), not agent instructions | Agent instructions are unreliable at ensuring every step fires in long sequences -- executor skipped update_resolved_signals despite code existing in execute-plan.md | ✓ Good — reconcile-signal-lifecycle.sh replaces agent-instruction-based transitions |
| 4-level automation with per-feature overrides | Scattered boolean toggles don't scale; unified levels + overrides + fine-grained knobs | ✓ Good — automation.level + automation.overrides + per-feature thresholds |
| Postlude pattern over hooks for auto-triggering | Cross-runtime compatibility (2/4 runtimes lack hooks); workflow steps work everywhere | ✓ Good — execute-phase postlude for signal collection and health checks |
| Probe-based health check architecture | Monolithic health check was unmaintainable; modular probes enable independent evolution | ✓ Good — 11 probe specs with frontmatter contract, probe executor in gsd-tools |
| Project-local KB at .planning/knowledge/ | Version control, remote execution access, knowledge auditability | ✓ Good — primary location with ~/.gsd/knowledge/ fallback |
| GSDR namespace for co-installation | Source files unchanged (merge compatibility); all differentiation at install time | ✓ Good — replacePathsInContent() handles namespace rewriting |
| Advisory severity for semantic plan validation | Plans describe future state; blocking on predictions is over-confident | ✓ Good — typed finding IDs (TOOL/CFG/DIR/SIG) for future correlation |
| Regime tracking for observation changes | Signal baselines shift when auto-collection is enabled; trend analysis invalid across boundaries | ✓ Good — regime_change KB entries with timestamps and impact |
| Counter-based reflection triggering | Simple, predictable, configurable; avoids complex heuristics | ✓ Good — phases_since_last_reflect with threshold gating |
| Install-time model resolution per runtime | Claude auto-resolves symbolic names; Codex needs explicit model+reasoning_effort pairs; no single strategy covers all platforms | ✓ Good — source files use cross-runtime tier language with Per-Runtime Resolution table; installer deploys same content to all platforms |
| Critical state transitions must be programmatic | Agent instructions are unreliable at ensuring every step fires in long sequences (proven by lifecycle gap, QT29) | ✓ Good — design principle from signal-lifecycle-closed-loop-gap deliberation |
| Manifest-driven config migration with field renames | Hardcoded rename logic scattered across upgrade paths was unmaintainable; declarative migrations[] array in feature-manifest.json | ✓ Good — depth→granularity absorbed programmatically, multi-version upgrade chains tested |
| Durable sync policy with trigger-based cadence | Ad-hoc sync timing created drift anxiety; formalized policy grounds decisions in evidence from v1.18 experience | ✓ Good — FORK-STRATEGY.md sections: cadence, baseline-freeze, what-to-adopt, integration depth |
| Deep integration standard for adopted features | Adopting features as isolated patches wastes their observational value; weaving into signal/automation/health/reflection pipeline creates epistemic value | ✓ Good — context-monitor → automation deferral, Nyquist → KB signals, discuss-phase → KB surfacing |
| Audit severity must distinguish "workaround available" from "feature works as specified" | v1.18 audit classified broken CLI commands as "low" because a different code path compensated; conflating workaround availability with low severity undermines audit integrity | ✓ Good — signal logged, lesson applied to fix both items before milestone completion |
| Complementary divergence characterization for fork-upstream relationship | Binary "behind/ahead" framing misrepresents a fork with genuinely different higher-level concerns; 6-disposition taxonomy (converging, complementary, redundant, divergent, behind, N/A) provides nuanced classification | ✓ Good — feature overlap inventory used in v1.18 governance analysis |

---
*Last updated: 2026-04-08 after v1.20 milestone start*
