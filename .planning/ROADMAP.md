# Roadmap: GSD Reflect

## Milestones

- <details><summary>v1.12 GSD Reflect (Phases 0-6) -- SHIPPED 2026-02-09</summary>See milestones/v1.12-ROADMAP.md</details>
- <details><summary>v1.13 Upstream Sync & Validation (Phases 7-12) -- SHIPPED 2026-02-11</summary>See milestones/v1.13-ROADMAP.md</details>
- <details><summary>v1.14 Multi-Runtime Interop (Phases 13-21) -- SHIPPED 2026-02-16</summary>See milestones/v1.14-ROADMAP.md</details>
- <details><summary>v1.15 Backlog & Update Experience (Phases 22-30) -- SHIPPED 2026-02-23</summary>See milestones/v1.15-ROADMAP.md</details>
- <details><summary>v1.16 Signal Lifecycle & Reflection (Phases 31-35) -- SHIPPED 2026-03-02</summary>See milestones/v1.16-ROADMAP.md</details>
- <details><summary>v1.17 Automation Loop (Phases 36-44) -- SHIPPED 2026-03-09</summary>See milestones/v1.17-ROADMAP.md</details>
- <details><summary>v1.18 Upstream Sync & Deep Integration (Phases 45-54 + 48.1) -- SHIPPED 2026-03-30</summary>See milestones/v1.18-ROADMAP.md</details>

## v1.20 Signal Infrastructure & Epistemic Rigor

**Milestone Goal:** Replace advisory quality controls with structural enforcement, mature the signal system from detection-only to full lifecycle management with a queryable knowledge base, overhaul spike methodology with epistemologically rigorous experimental design, and establish measurement infrastructure for evidence-based workflow improvement.

**Phases:** 15 (Phases 55-64 + 55.1, 55.2, 57.1, 57.2, 57.3)
**Granularity:** Fine
**Requirements:** 71 mapped

## Phases

- [x] **Phase 55: Upstream Mini-Sync** - Integrate upstream correctness fixes (state locking, milestone safety, frontmatter, installer) before any v1.20 work begins
- [x] **Phase 56: KB Schema & SQLite Foundation** - Signal schema evolution and SQLite index creation establish the queryable knowledge base substrate
- [ ] **Phase 57: Measurement & Telemetry Baseline** - Telemetry extraction tooling and baseline capture before any structural interventions ship
- [x] **Phase 57.1: Explore Skill Adoption** - Quick adopt upstream /gsd:explore as /gsdr:explore with minimal GSDR branding (completed 2026-04-09)
- [x] **Phase 57.2: Discuss-Phase Exploratory Mode Overhaul** - Typed claims (7 types + verification dimension), context-checker agent, DISCUSSION-LOG.md as justificatory sidecar, researcher update, claim dependency webs, template enrichment
- [ ] **Phase 57.3: Audit Workflow Infrastructure** - Formalize audit conventions: date-first directories, task spec preservation, epistemic ground rules for audit agents
- [ ] **Phase 58: Structural Enforcement Gates** - Replace advisory workflow controls with structural enforcement for the 8 most-recurred failure patterns
- [ ] **Phase 59: KB Query, Lifecycle Wiring & Surfacing** - Full-text search, relationship traversal, lifecycle automation, and agent-accessible KB queries
- [ ] **Phase 60: Sensor Pipeline & Codex Parity** - Log sensor, patch sensor, and cross-runtime parity verification (can proceed in parallel with Phase 61)
- [ ] **Phase 61: Spike Methodology Overhaul** - Three-level confidence, cross-model design reviewer, template revisions, and findings verification (can proceed in parallel with Phase 60)
- [ ] **Phase 62: Workflow Commands** - Five commands closing workflow gaps identified by audit and deliberation
- [ ] **Phase 63: Spike Programme Infrastructure** - Programme-level spike management with Lakatosian progressiveness assessment
- [ ] **Phase 64: Parallel Execution** - Per-worktree state files and overlap detection for parallel phase execution (separately gated)

## Phase Details

### Phase 55: Upstream Mini-Sync
**Goal**: v1.20 builds on a correct substrate -- upstream TOCTOU, milestone safety, frontmatter, and installer fixes integrated before any new work begins
**Depends on**: Nothing (must precede all other v1.20 work)
**Requirements**: SYNC-01
**Success Criteria** (what must be TRUE):
  1. `gsd-tools` state operations use atomic writes that prevent TOCTOU race conditions
  2. Milestone safety preserves 999.x backlog items during transitions without data loss
  3. Frontmatter parsing handles quoted-comma values correctly
  4. Installer reliability fixes applied and validated by existing test suite (628 tests pass)
**Plans:** 4 plans
Plans:
- [x] 55-01-PLAN.md -- Adopt model-profiles.cjs and wholesale-replace 4 pure upstream modules
- [x] 55-02-PLAN.md -- Hybrid-merge core.cjs, frontmatter.cjs, and config.cjs
- [x] 55-03-PLAN.md -- Replace phase.cjs/roadmap.cjs with re-adjustments, hybrid-merge installer
- [x] 55-04-PLAN.md -- Update router, adopt upstream tests, validate all 3 suites, run installer

### Phase 55.1: Upstream Bug Patches (INSERTED)

**Goal:** Patch three upstream-reported bugs that affect ROADMAP integrity (#2005 details-wrapped corruption), file write safety (#1972 incomplete atomicWriteFileSync), and worktree data loss (#1981 reset --soft)
**Requirements**: SYNC-01 (continuation)
**Depends on:** Phase 55
**Plans:** 2 plans

Plans:
- [x] 55.1-01-PLAN.md -- Fix ROADMAP corruption when milestone wrapped in details (#2005)
- [x] 55.1-02-PLAN.md -- Extend atomicWriteFileSync to 3 modules (#1972) and add worktree_branch_check (#1981)

### Phase 55.2: Codex Runtime Substrate (INSERTED)

**Goal:** The harness correctly detects, adapts to, and verifies Codex CLI capabilities -- runtime detection is code-level accurate, agent/sensor discovery works across formats, and parity monitoring prevents silent drift.
**Depends on:** Phase 55.1 (upstream bugs patched first)
**Requirements:** CODEX-01, CODEX-02, CODEX-05
**Success Criteria** (what must be TRUE):
  1. Runtime capability resolver (`automation.cjs`) correctly identifies `codex-cli` capabilities without falling back to "constrained" heuristic
  2. Agent and sensor discovery handles both `.md` (Claude Code) and `.toml` (Codex) formats in both `.claude/` and `.codex/` paths
  3. Brownfield detection excludes `.codex/` directory from false-positive triggers
  4. Documentation in capability-matrix.md accurately reflects live Codex CLI runtime behavior (config.toml not codex.toml, hooks under development, SKILL.md format, agents/*.toml registration)
  5. `cross-runtime-parity-research.md` exists as living document recording last-audited Codex version and validation commands
**Plans:** 3 plans

Plans:
- [x] 55.2-01-PLAN.md -- Runtime capability resolver, brownfield exclusion, agent TOML detection
- [x] 55.2-02-PLAN.md -- Multi-directory multi-format sensor discovery
- [x] 55.2-03-PLAN.md -- Capability matrix corrections and parity living document




### Phase 56: KB Schema & SQLite Foundation
**Goal**: Signal files support full lifecycle tracking, and a SQLite index makes the knowledge base queryable by structured fields
**Depends on**: Phase 55
**Requirements**: KB-01, KB-02, KB-03, KB-04a, KB-05, KB-09, KB-10, KB-11
**Success Criteria** (what must be TRUE):
  1. `gsd-tools kb rebuild` processes the existing 198-signal corpus without errors, producing a SQLite index with all frontmatter fields indexed
  2. Signal files support lifecycle states (detected/triaged/blocked/remediated/verified/invalidated), polarity (negative/positive/mixed), response disposition (fix/formalize/monitor/investigate), and qualification links (qualified_by/superseded_by)
  3. Existing signal files with old schema parse successfully -- new fields default gracefully when absent, `source` field resolved to `detection_method` + `origin` via migration script
  4. kb.db is gitignored and rebuildable from files at any time -- SQLite is a derived cache, files remain source of truth
  5. package.json engines.node updated to >=22.5.0 with actionable error message on older Node versions
**Plans**: 3 plans
Plans:
- [x] 56-01-PLAN.md -- Create kb.cjs module with SQLite schema, rebuild, stats, migrate + align KB-01 lifecycle states
- [x] 56-02-PLAN.md -- Wire router, update package.json engines, gitignore kb.db, validate on real corpus
- [x] 56-03-PLAN.md -- KB test suite + run source field migration on 199-signal corpus

### Phase 57: Measurement & Telemetry Baseline
**Goal**: Telemetry extraction tooling captures a pre-intervention baseline so that structural changes in subsequent phases can be attributed to specific interventions
**Depends on**: Phase 56
**Requirements**: TEL-01a, TEL-01b, TEL-02, TEL-04, TEL-05
**Success Criteria** (what must be TRUE):
  1. `gsd-tools telemetry summary` shows session overview, `telemetry session` shows single session detail, and `telemetry phase` shows sessions within a phase time window
  2. `gsd-tools telemetry baseline` produces `.planning/baseline.json` with statistical computation from session-meta data
  3. `.planning/baseline.json` is committed before any Phase 58 structural gates are deployed
  4. Facets data (AI-generated session quality assessments) joined with session-meta by session_id, with all facets-derived fields annotated as AI-generated estimates with unknown accuracy
**Plans**: 3 plans
Plans:
- [ ] 57-01-PLAN.md -- Create telemetry.cjs module with helpers, 3 subcommands (summary/session/enrich), and router wiring
- [ ] 57-02-PLAN.md -- Add phase correlation command, baseline command with 8 metrics, and inline token validation
- [ ] 57-03-PLAN.md -- Telemetry test suite and baseline.json capture/commit

### Phase 57.2: Discuss-Phase Exploratory Mode Overhaul (INSERTED)

**Goal:** CONTEXT.md becomes a rich research-guiding artifact with typed claims, dependency webs, and justificatory sidecar — not a shallow locked-down spec. The researcher gets a mandate to investigate assumptions, explore open questions, and check forward projections. A context-checker agent verifies claim integrity before planning begins.
**Depends on:** Phase 55.2 (runtime substrate complete). Effectiveness revisited post-Phase 57 (telemetry baseline provides metrics to evaluate whether interventions helped)
**Requirements:** DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, DISC-08, DISC-09, DISC-10
**Success Criteria** (what must be TRUE):
  1. Exploratory-mode `write_context` template includes structural sections for working assumptions, derived constraints, epistemic guardrails, and structured open questions (DISC-01)
  2. 7 typed claim states (evidenced, decided, assumed, open, projected, stipulated, governing) + 3-level verification dimension (cited, reasoned, bare) replace bare [grounded]/[open]. Shared reference doc `references/claim-types.md` defines the ontology (DISC-02)
  3. DISCUSSION-LOG.md enhanced as justificatory sidecar: per-claim justification meeting type-specific demands, claim dependency chains, context-checker verification log (DISC-03, DISC-08)
  4. Context-checker agent runs post-discuss, pre-plan: verifies type assignments, surfaces untyped claims, checks citations, traces dependency chains, fixes CONTEXT.md in-place (DISC-04)
  5. Upstream --chain flag merged and CONTEXT.md committed when `commit_docs: true` (DISC-05)
  6. Main exploratory section renamed from "Implementation Decisions" to research-guiding framing (DISC-06)
  7. Research questions use generative format specifying research program, downstream decisions, reversibility (DISC-07)
  8. Researcher agent updated with type-to-action mapping consuming typed claims (DISC-09)
  9. CONTEXT.md includes claim dependency section; decided claims resting on assumed claims flagged as vulnerabilities (DISC-10)
Derived from: `.planning/deliberations/exploratory-discuss-phase-quality-regression.md`, `.planning/deliberations/pipeline-enrichment-step-architecture.md`, `.planning/deliberations/claim-type-ontology.md`
Audit evidence: `.planning/audits/2026-04-09-discuss-phase-exploration-quality/` (7 artifacts), `.planning/audits/2026-04-09-*claim-audit*` (6 exploratory audits, 12 projects, ~85 CONTEXT.md files)
**Plans:** 3 plans

Plans:
- [x] 57.2-01-PLAN.md -- Create claim-types.md reference doc, cherry-pick upstream --chain flag, fix CONTEXT.md commit
- [x] 57.2-02-PLAN.md -- Restructure discuss-phase.md write_context template, update context.md template examples
- [x] 57.2-03-PLAN.md -- DISCUSSION-LOG.md justificatory sidecar, context-checker agent, researcher 7-type update

### Phase 57.3: Audit Workflow Infrastructure (INSERTED)

**Goal:** Audit sessions have proper infrastructure — date-first directories, task specs preserved alongside agent outputs, provenance metadata, epistemic ground rules for audit agents — so that audit findings are traceable, reproducible, and epistemically reliable.
**Depends on:** Phase 57.2 (typed claim vocabulary and provenance format inform audit spec standards)
**Requirements:** AUDIT-01, AUDIT-02, AUDIT-03
**Success Criteria** (what must be TRUE):
  1. Audit sessions produce date-first directories with task specs alongside agent outputs and provenance metadata
  2. Audit task specs include explicit epistemic ground rules (cite file:line, test disconfirming evidence, distinguish measure from measured)
Derived from: `.planning/deliberations/exploratory-discuss-phase-quality-regression.md` (meta-observation: three audits during deliberation exhibited the epistemic failures being investigated)
**Plans:** 2 plans

Plans:
- [x] 57.3-01-PLAN.md -- Create audit ground rules and conventions reference documents, add AUDIT-03 to REQUIREMENTS.md
- [x] 57.3-02-PLAN.md -- Migrate ~43 existing scattered audit artifacts to new conventions

### Phase 57.1: Explore Skill Adoption (INSERTED)

**Goal:** The `/gsdr:explore` command exists and provides Socratic ideation sessions that route outputs to GSD artifacts (notes, todos, seeds, requirements, phases)
**Depends on:** Nothing (standalone skill adoption, can proceed after any completed phase)
**Requirements:** WF-05a
**Success Criteria** (what must be TRUE):
  1. `/gsdr:explore` command, workflow, and reference files (questioning.md, domain-probes.md) are synced from upstream and installed locally
  2. The skill launches a Socratic conversation, offers mid-session research, and routes crystallized outputs to appropriate artifacts
  3. Existing upstream tests (if any) pass; manual verification of one explore session
**Plans:** 1/1 plans complete
Plans:
- [x] 57.1-01-PLAN.md -- Adopt upstream explore skill files, create vitest test, verify installer

### Phase 58: Structural Enforcement Gates
**Goal**: The 8 most-recurred advisory failure patterns are replaced with structural enforcement that cannot be circumvented by agent discretion
**Depends on**: Phase 57 (baseline must be captured first)
**Requirements**: GATE-01, GATE-02, GATE-03, GATE-04, GATE-05, GATE-06, GATE-07, GATE-08, XRT-01
**Success Criteria** (what must be TRUE):
  1. Phase advancement via offer_next blocks until PR is created and CI passes -- user can override with documented justification logged to session
  2. `gh pr merge` invocations pass `--merge` explicitly as the structural default, and quick task detects runtime code changes requiring branch+PR flow
  3. `.continue-here` files are consumed on read and archived after session start, with staleness checks and upstream-adopted hard stop safety gates
  4. Automation postlude fires structurally (SessionStop hook on Claude Code, workflow-enforced step on Codex) rather than by agent discretion
  5. Every hook-dependent v1.20 feature specifies its Codex CLI degradation path in phase CONTEXT.md before implementation begins, and capability-matrix.md is updated
**Plans**: TBD

### Phase 59: KB Query, Lifecycle Wiring & Surfacing
**Goal**: The knowledge base is fully queryable, signal lifecycle transitions are automated, and research/planning agents use structured queries instead of grep
**Depends on**: Phase 56 (SQLite index must exist)
**Requirements**: KB-04b, KB-04c, KB-06a, KB-06b, KB-07, KB-08
**Success Criteria** (what must be TRUE):
  1. `gsd-tools kb search` performs FTS5 full-text search across signal content, and `gsd-tools kb query` filters by lifecycle state and other structured fields
  2. `gsd-tools kb link` traverses qualified_by/superseded_by relationships between signals and spikes
  3. `gsd-tools kb transition` updates both the .md frontmatter AND the SQLite row atomically (dual-write invariant per KB-05)
  4. When a plan with `resolves_signals` completes, collect-signals auto-transitions matching signals to remediated state
  5. Research and planning agents use SQLite queries for KB retrieval, with graceful fallback to grep when kb.db does not exist
**Plans**: TBD

### Phase 60: Sensor Pipeline & Codex Parity
**Goal**: Log sensor and patch sensor are operational across Claude Code and Codex CLI, with automated parity verification after installation
**Depends on**: Phase 58 (structural gates provide enforcement context for sensors)
**Requirements**: SENS-01, SENS-02, SENS-03, SENS-04, SENS-05, SENS-06, SENS-07, XRT-02
**Success Criteria** (what must be TRUE):
  1. Log sensor integrates into collect-signals with progressive deepening (structural fingerprinting, intelligent triage, selective context expansion, signal construction) and reports parse failures as warnings rather than crashing
  2. Log sensor cross-runtime adapter normalizes Claude Code JSONL and Codex JSONL to a common fingerprint schema, with Codex session discovery using state_5.sqlite
  3. Patch sensor detects source-vs-installed file divergence using installer manifest SHA256, classifies divergences (bug/stale/customization/format-drift/feature-gap), and produces a developer-facing report
  4. Post-install cross-runtime parity verification runs automatically after `node bin/install.js`, comparing installed files across detected runtimes
  5. Patch compatibility checking validates patches against target runtime before cross-runtime application
**Plans**: TBD
**Note**: Can proceed in parallel with Phase 61 after Phase 58 completes -- independent workstreams with no shared dependencies

### Phase 61: Spike Methodology Overhaul
**Goal**: Spike experimental design is epistemologically rigorous -- designs are reviewed cross-model before execution, confidence is multi-dimensional, and findings are verified against evidence
**Depends on**: Phase 58 (structural enforcement patterns inform reviewer agent design)
**Requirements**: SPIKE-01, SPIKE-02, SPIKE-03, SPIKE-04, SPIKE-05, SPIKE-06, SPIKE-07, SPIKE-08, SPIKE-09, SPIKE-12
**Success Criteria** (what must be TRUE):
  1. Spike design reviewer agent (cross-model, different model from designer) evaluates experimental design before execution and produces CRITIQUE.md, not a pass/fail verdict
  2. DECISION.md supports decided/provisional/deferred outcome types with three-level confidence (measurement validity, interpretation validity, extrapolation validity)
  3. DESIGN.md includes auxiliary hypothesis register (Duhem-Quine), metric limitation documentation, and sample design section with representativeness argument
  4. Cross-spike qualification mechanism appends qualification notes when spike N qualifies or invalidates spike M, with KB qualified_by links
  5. After 3 spikes complete under new methodology, an evaluation assesses whether premature closure decreased and DECISION.md quality improved -- if formalization shows compliance theater, simplify
**Plans**: TBD
**Note**: Can proceed in parallel with Phase 60 after Phase 58 completes -- independent workstreams with no shared dependencies. SPIKE-08 (protocol adherence checkpoints) is gated on SPIKE-01 completion; auto-defers to v1.21 if SPIKE-01 ships late in this phase

### Phase 62: Workflow Commands
**Goal**: Five workflow gaps identified by audit and deliberation are closed with commands that integrate into existing GSD patterns
**Depends on**: Phase 59 (KB query layer enables structured retrieval in research and explore commands)
**Requirements**: WF-01, WF-02, WF-03, WF-04, WF-05b
**Success Criteria** (what must be TRUE):
  1. `/gsdr:cross-model-review` launches background cross-model review with committed audit spec and structured response template -- opt-in, model choice configurable, review round count user-determined
  2. `/gsdr:revise-phase-scope` performs mid-phase scope changes with ROADMAP.md and REQUIREMENTS.md update, commit, and re-discuss
  3. `/gsdr:research` produces committed knowledge artifacts in `.planning/research/` with source citations, per-finding confidence levels, and stated limitations -- no code changes or spike overhead
  4. `/gsdr:discuss-milestone` produces MILESTONE-CONTEXT.md with structured steering brief (working assumptions, open questions, epistemic guardrails, derived constraints, deferred ideas)
  5. `/gsdr:explore` enhanced with GSDR-specific questioning.md (epistemic practice probes, assumption-surfacing), signal-aware exploration (KB queries during sessions), and "no artifact" as valid outcome
**Plans**: TBD

### Phase 63: Spike Programme Infrastructure
**Goal**: Multi-spike research programmes have proper infrastructure -- shared assets, cross-spike tracking, and Lakatosian progressiveness assessment
**Depends on**: Phase 61 (spike methodology must be operational)
**Requirements**: SPIKE-10a, SPIKE-10b, SPIKE-10c
**Success Criteria** (what must be TRUE):
  1. Spike programmes have a directory structure with programme ROADMAP.md, shared data asset references, and programme-level metadata
  2. Cross-spike tracking within programmes supports qualification links and progressive refinement without the 2-round per-spike limit applying at programme level
  3. Programme lifecycle includes progressiveness assessment (Lakatosian ledger: is this programme progressive or degenerating?) and programme-level DECISION.md for overall conclusions
**Plans**: TBD

### Phase 64: Parallel Execution (Separately Gated)
**Goal**: Non-overlapping phases can execute in parallel on separate worktrees without STATE.md merge conflicts
**Depends on**: Phase 59 (state management infrastructure must be stable)
**Requirements**: PAR-01, PAR-02, PAR-03
**Success Criteria** (what must be TRUE):
  1. Per-worktree state files (`.planning/state/{worktree-name}.json`) eliminate STATE.md merge conflicts, with upstream's orchestrator-owns-writes pattern adopted for intra-phase parallelism
  2. `gsd-tools state` provides a composite view across worktree state files showing aggregated progress and per-worktree status
  3. Phases with non-overlapping file scopes can execute in parallel on separate worktrees, with overlapping file scope detected and blocked before parallel dispatch
**Plans**: TBD
**Note**: Separately gated -- only triggered when parallel phase execution becomes a regular workflow pattern. Not automatically scheduled after Phase 63

## Progress

**Execution Order:**
Phases execute sequentially 55 through 55.2, then 57.1 → 57.2 → 57.3 (patch releases), then 57 → 58-59, then 60 and 61 can proceed in parallel, then 62 through 64 sequentially. Phase 64 is separately gated. Phase 57.1 can proceed after any completed phase (no blocking dependencies). Phase 57.2 ships before Phase 57 as a patch (regression fix); effectiveness revisited post-telemetry. Phase 57.3 depends on Phase 57.2.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 55. Upstream Mini-Sync | 4/4 | Complete | 2026-04-08 |
| 55.1. Upstream Bug Patches | 2/2 | Complete | 2026-04-09 |
| 55.2. Codex Runtime Substrate | 3/3 | Complete | 2026-04-09 |
| 56. KB Schema & SQLite Foundation | 3/3 | Complete | 2026-04-08 |
| 57. Measurement & Telemetry Baseline | 0/3 | Planned | - |
| 57.1. Explore Skill Adoption | 1/1 | Complete   | 2026-04-09 |
| 57.2. Discuss-Phase Exploratory Mode Overhaul | 3/3 | Complete | 2026-04-09 |
| 57.3. Audit Workflow Infrastructure | 2/2 | Complete | 2026-04-09 |
| 58. Structural Enforcement Gates | 0/TBD | Not started | - |
| 59. KB Query, Lifecycle Wiring & Surfacing | 0/TBD | Not started | - |
| 60. Sensor Pipeline & Codex Parity | 0/TBD | Not started | - |
| 61. Spike Methodology Overhaul | 0/TBD | Not started | - |
| 62. Workflow Commands | 0/TBD | Not started | - |
| 63. Spike Programme Infrastructure | 0/TBD | Not started | - |
| 64. Parallel Execution | 0/TBD | Not started | - |

## Overall Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.12 GSD Reflect | 0-6 | 25 | Complete | 2026-02-09 |
| v1.13 Upstream Sync | 7-12 | 18 | Complete | 2026-02-11 |
| v1.14 Multi-Runtime | 13-21 | 18 | Complete | 2026-02-16 |
| v1.15 Backlog & Update | 22-30 | 24 | Complete | 2026-02-23 |
| v1.16 Signal Lifecycle | 31-35 | 20 | Complete | 2026-03-02 |
| v1.17 Automation Loop | 36-44 | 24 | Complete | 2026-03-09 |
| v1.18 Upstream Sync & Deep Integration | 45-54 + 48.1 | 37 | Complete | 2026-03-30 |
| v1.20 Signal Infrastructure & Epistemic Rigor | 55-64 + 55.1, 55.2, 57.1, 57.2, 57.3 | TBD | In progress | - |

**Totals:** 8 milestones, 67 phases (57 complete, 10 in progress), 173 plans completed

## Backlog

### Phase 999.1: Pipeline Enrichment Step Between Discuss and Plan (BACKLOG)

**Goal:** Fork-specific pipeline stage between discuss-phase and plan-phase that produces EXPLORATION.md with epistemic challenges, working assumptions, and investigation mandates for the researcher/planner. Separates fork epistemic work from upstream discuss-phase workflow.
**Trigger:** Post-telemetry evaluation — quality regression deliberation P4 tests whether discuss-phase modification alone achieves Phase-52-level quality. If not, this becomes urgent.
**Derived from:** `.planning/deliberations/pipeline-enrichment-step-architecture.md` (concluded), `.planning/deliberations/exploratory-discuss-phase-quality-regression.md` (concluded)
**Connected to:** epistemic-health Prescription 2 (adversarial deliberation), plan-phase "Decisions = LOCKED" contract rethink, adaptive harness design (complexity-responsive exploration depth)
**Requirements:** TBD
**Plans:** 0 plans

Plans:
- [ ] TBD (promote with /gsd-review-backlog when ready)
