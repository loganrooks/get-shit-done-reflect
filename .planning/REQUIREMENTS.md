# Requirements: GSD Reflect v1.20

**Defined:** 2026-04-08
**Core Value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

**Evidence base:** Cross-platform session log audit (100 sessions, 165 findings, 13 RECURRED), spike methodology gap analysis (11 gaps, 5 failure patterns), 9 research documents, pre-v1.20 deliberation (11 threads), upstream drift survey (304 commits, v1.30->v1.34.2).

**Milestone thesis:** v1.20 is a major infrastructure and methodology milestone -- replacing advisory quality controls with structural enforcement, building a queryable knowledge base, overhauling spike methodology with epistemological rigor, and establishing measurement infrastructure for evidence-based workflow improvement.

**Cross-runtime note:** Structural enforcement requirements (GATE-*) achieve full enforcement on Claude Code via hooks. On Codex CLI (no hook mechanism as of v0.118.0), enforcement degrades to workflow-level checks that depend on agent compliance -- the same advisory pattern the audit found unreliable. This is an accepted limitation for v1.20; Codex hook support is tracked as a dependency for full cross-runtime enforcement parity.

**Design constraint (SPIKE-11, moved from requirements):** Spike methodology must engage with Lakatos (progressive vs degenerating research programmes), Duhem-Quine (auxiliary hypotheses, holism of testing), Mayo (severity of testing), and institutional critique (three-tier enforce/encourage/warn -- Feyerabend/Longino). This is a governing design principle for SPIKE-01 through SPIKE-10, not a separate deliverable. See `.planning/research/spike-epistemology-research.md` and MILESTONE-CONTEXT.md for the full framework.

## v1.20 Requirements

### Upstream Mini-Sync

- [x] **SYNC-01**: Upstream correctness fixes integrated -- state locking (TOCTOU races, atomicWriteFileSync), milestone safety (999.x backlog preservation, data loss prevention), frontmatter quoted-comma fix, critical installer reliability fixes -- adopted from upstream v1.34.2 with thoughtful integration into fork extensions, not naive wholesale replace
  - *Motivation:* `research: upstream-drift-survey-2026-04-08.md -- 4 major versions of drift, correctness bugs in adopt-upstream modules affect v1.20 substrate`
  - *Dependencies:* None -- must precede all other v1.20 work

### Codex Substrate

- [ ] **CODEX-01**: Runtime capability resolver (`automation.cjs`) correctly identifies `codex-cli` capabilities -- task_tool, hooks status (under development), sandbox modes. Heuristic fallback does not default to "constrained" for Codex.
  - *Motivation:* GPT-5.4 audit confirmed `resolve-level --runtime codex-cli` returns capped result due to code only recognizing `claude-code` and `full`
  - *Dependencies:* None

- [ ] **CODEX-02**: Agent and sensor discovery works across `.md` (Claude Code) and `.toml` (Codex) formats, in both `.claude/` and `.codex/` paths. `sensors list`, `checkAgentsInstalled()`, and workflow sensor auto-discovery all handle both formats.
  - *Motivation:* Claude audit G2 (sensor glob), GPT-5.4 audit sections 2-3 (agent verification), confirmed with proof commands
  - *Dependencies:* None

- [ ] **CODEX-05**: `cross-runtime-parity-research.md` exists as a living document recording last-audited Codex CLI version, validation commands used, and expected artifact shapes. Post-install smoke test validates Codex artifacts against this document.
  - *Motivation:* GPT-5.4 drift audit monitoring section: "no durable record of what version was last audited"
  - *Dependencies:* None

### KB Infrastructure

Dependencies: KB-09 -> KB-04a -> KB-04b/KB-04c -> KB-07 -> KB-08

- [x] **KB-01**: Signal schema supports lifecycle states (detected -> triaged -> blocked -> remediated -> verified -> invalidated) with transition validation. `blocked` is an optional holding state between triaged and remediated; all other states follow the Phase 31 model
  - *Motivation:* `signal: sig-2026-03-04-signal-lifecycle-representation-gap` | `pattern: R11 -- 0% remediation rate, 171/187 stuck in active`
- [x] **KB-02**: Signal schema supports polarity (negative/positive/mixed) and response disposition (fix/formalize/monitor/investigate)
  - *Motivation:* `pattern: 35 positive patterns unrecordable in current schema` | `deliberation: Thread 1 signal/issue ontology -- anticipate future promotion without closing doors`
- [x] **KB-03**: Signal schema supports qualification links (qualified_by, superseded_by) for cross-signal and cross-spike references
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.5 -- 2 retracted, 7 qualified claims required manual cross-spike report`
- [ ] **KB-04a**: SQLite index built from signal files via node:sqlite with `gsd-tools kb rebuild` -- schema includes all frontmatter fields, kb.db gitignored, rebuildable from files
  - *Motivation:* `research: kb-architecture-research.md -- file+SQLite validated by 3 open-source precedents (MarkdownDB, Palinode, sqlite-memory)`
  - *Dependencies:* KB-09 (migration must complete before index build)
- [ ] **KB-04b**: FTS5 full-text search across signal content and lifecycle state queries via `gsd-tools kb query/search`
  - *Motivation:* `research: kb-architecture-research.md -- FTS5 confirmed working on Dionysus via node:sqlite`
  - *Dependencies:* KB-04a
- [ ] **KB-04c**: Relationship traversal for qualified_by/superseded_by links via `gsd-tools kb link`
  - *Motivation:* `research: spike-methodology-gap-analysis.md -- cross-spike qualification requires navigable links`
  - *Dependencies:* KB-04a, KB-03
- [x] **KB-05**: SQLite index is a derived cache -- files remain source of truth, dual-write invariant enforced on every lifecycle transition, kb.db gitignored, rebuildable from files at any time
  - *Motivation:* `signal: sig-2026-02-11-kb-data-loss-migration-gap -- direct historical precedent for cache-as-truth failure` | `research: PITFALLS.md C1`
  - *Note:* `~/.gsd/knowledge/` now houses both fork's subdirectory-based epistemic artifacts and upstream's flat JSON learnings -- document coexistence in implementation
- [ ] **KB-06a**: `gsd-tools kb` read operations: query, search, stats, health, rebuild
  - *Motivation:* `research: kb-architecture-research.md -- CLI-first validates query API; MCP wrapper deferred to v1.21`
- [ ] **KB-06b**: `gsd-tools kb` write operations: transition, link -- with dual-write invariant enforced per KB-05
  - *Motivation:* `research: PITFALLS.md C1 -- write operations have data integrity risk; read operations do not`
  - *Dependencies:* KB-05 (invariant must be established before write ops ship)
- [ ] **KB-07**: Signal lifecycle wiring completes the v1.16 `resolves_signals` feature -- collect-signals reads resolves_signals from completed plan frontmatter and auto-transitions matching signals to remediated
  - *Motivation:* `research: PITFALLS.md C2 -- resolves_signals has existed since Phase 34 and has never been read by anything`
  - *Dependencies:* KB-06b (transition command must exist)
- [ ] **KB-08**: KB surfacing in research/planning agents uses SQLite queries instead of grep-through-index for relevant signal/spike/lesson retrieval. Graceful fallback to grep when kb.db does not exist (fresh clone, first run)
  - *Motivation:* `research: ARCHITECTURE.md -- knowledge-surfacing.md updated to use kb query for structured retrieval`
  - *Dependencies:* KB-04b
- [x] **KB-09**: Existing signal files parse successfully with new schema. `source` field resolved to `detection_method` + `origin`. `kb rebuild` on current 198-signal corpus succeeds without data loss. Migration script provided for one-time field resolution
  - *Motivation:* `research: PITFALLS.md N5 -- source field ambiguity must be resolved before SQLite schema finalized`
  - *Dependencies:* KB-01, KB-02, KB-03 (schema must be defined before migration)
- [x] **KB-10**: `kb rebuild` and all query operations succeed against the current 198-signal corpus without file modification. New schema fields (lifecycle, polarity, disposition, qualified_by, superseded_by) default gracefully when absent from existing files
  - *Motivation:* `review: R8 -- no backward compatibility testing requirement existed`
- [x] **KB-11**: package.json engines.node updated to >=22.5.0. `kb.cjs` includes version guard with actionable error message on older Node versions. CHANGELOG documents the breaking change
  - *Motivation:* `review: R7 -- node:sqlite requires Node 22.5+, changing from >=16.7.0 is a breaking change`

### Measurement & Telemetry

Dependencies: TEL-01a -> TEL-01b -> TEL-02

- [ ] **TEL-01a**: `gsd-tools telemetry` basic extraction: summary (session overview), session (single session detail), phase (sessions within phase time window)
  - *Motivation:* `research: measurement-infrastructure-research.md -- 268 session-meta files + 109 facets files already available`
- [ ] **TEL-01b**: `gsd-tools telemetry` analytical operations: baseline (statistical computation producing `.planning/baseline.json`), enrich (facets join by session_id)
  - *Motivation:* `research: ARCHITECTURE.md -- baseline must precede intervention deployment`
  - *Dependencies:* TEL-01a
  - *Prerequisite:* Token count validation spike must confirm session-meta reliability against JSONL-aggregated counts before baselines are committed (see PITFALLS.md C3: 109 input_tokens for 513-minute session is implausibly low)
- [ ] **TEL-02**: Telemetry baseline captured in `.planning/baseline.json` before any v1.20 structural interventions ship -- preserves ability to attribute changes to specific interventions
  - *Motivation:* `research: ARCHITECTURE.md anti-pattern 4 -- post-intervention baselines are contaminated`
  - *Dependencies:* TEL-01b
- [ ] **TEL-04**: Facets data (109 AI-generated session quality assessments) joined with session-meta by session_id for quality signal enrichment
  - *Motivation:* `research: measurement-infrastructure-research.md -- facets is an underexplored asset; joining facets+session-meta is the highest-value first analysis`
- [ ] **TEL-05**: All telemetry outputs that include facets-derived data annotate those fields as AI-generated estimates with unknown accuracy. Facets data is hypothesis-generating, not hypothesis-confirming
  - *Motivation:* `review: R6 -- PITFALL M3 warns facets accuracy is unknown; metric reification risk`

### Structural Enforcement

- [ ] **GATE-01**: offer_next blocks phase advancement until PR is created and CI passes. User can provide explicit override with documented justification logged to session. On Codex (no hooks), offer_next requires manual confirmation of PR/CI status before proceeding
  - *Motivation:* `pattern: R01 -- 6+ occurrences of advisory fix failing, signal f5e6b2b6 still active`
- [ ] **GATE-02**: `--merge` is the structural default for PR merges -- passed explicitly in `gh pr merge` invocation, not documented as preference
  - *Motivation:* `pattern: R02 -- squash merge destroyed commit history, required force-push recovery`
- [ ] **GATE-03**: Quick task detects runtime code changes and requires branch+PR flow -- docs-only changes allowed direct to main
  - *Motivation:* `pattern: R08 -- quick task committed runtime code to main without CI gate`
- [ ] **GATE-04**: `.continue-here` files marked consumed on read and deleted/archived after session start. Staleness check if file predates last session. Adopt upstream's hard stop safety gates and anti-pattern severity levels (blocking/advisory with mandatory understanding checks for blocking items)
  - *Motivation:* `pattern: R09 -- 3 months of recurrence, 3+ signals, no fix` | `research: upstream-drift-survey -- upstream convergent with hard stops + severity`
- [ ] **GATE-05**: Sensor model selection echoed and logged before dispatch in all delegation workflows
  - *Motivation:* `pattern: R10 -- entire sensor batch stopped and relaunched because model selection was wrong and unverifiable`
- [ ] **GATE-06**: Automation postlude fires structurally -- SessionStop hook on Claude Code, workflow-enforced step on Codex -- rather than by agent discretion
  - *Motivation:* `pattern: R12 -- 0% fire rate across all sessions, 6/6 signal_collection skipped`
- [ ] **GATE-07**: Incident self-signal hook prompts signal creation when session metadata indicates high error rate, direction changes, or destructive events during execution
  - *Motivation:* `pattern: R04 -- agent failed to self-signal after 91-file cascade, headless version burn, CI bypass`
- [ ] **GATE-08**: Discuss-phase three-mode adoption completed -- verify current state against upstream's 671-line discuss-phase-assumptions.md, create missing `gsd-assumptions-analyzer` agent, add `docs/workflow-discuss-mode.md`, wire mode-aware gates in plan-phase.md and progress.md where absent. Adopt upstream's richer version with methodology loading
  - *Motivation:* `signal: sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop -- Issues #26, #32, #33 closed prematurely` | `research: upstream 671 lines vs fork 279 lines`

### Sensor Pipeline

- [ ] **SENS-01**: Log sensor integrated into collect-signals with progressive deepening (structural fingerprinting -> intelligent triage -> selective context expansion -> signal construction)
  - *Motivation:* `research: log sensor spec already in source, validated by audit (165 findings from 100 sessions)` | `signal: Issue #35 open`
- [ ] **SENS-02**: Log sensor cross-runtime adapter normalizes Claude Code JSONL and Codex JSONL to common fingerprint schema
  - *Motivation:* `research: cross-runtime-parity-research.md -- formats structurally different but semantically equivalent, Codex provides richer data`
- [ ] **SENS-03**: Codex session discovery uses state_5.sqlite for session metadata queries (cwd, tokens, git state, model, reasoning effort)
  - *Motivation:* `research: cross-runtime-parity-research.md -- state_5.sqlite is SQL-queryable, richer than Claude Code's filesystem-only discovery`
- [ ] **SENS-04**: Patch sensor detects source-vs-installed file divergence using installer manifest SHA256 comparison
  - *Motivation:* `deliberation: patches applied on Apollo never propagated to source -- the opening problem of the audit session`
- [ ] **SENS-05**: Patch sensor classifies divergences into taxonomy (bug/stale/customization/format-drift/feature-gap) with developer-facing report
  - *Motivation:* `research: cross-runtime-parity-research.md -- builds on existing saveLocalPatches() mechanism`
- [ ] **SENS-06**: Post-install cross-runtime parity verification runs automatically after `node bin/install.js` -- compares installed files across detected runtimes
  - *Motivation:* `pattern: R03 -- cross-runtime distribution gap; fixes ship in GSDR but don't reach projects running unpatched installs`
- [ ] **SENS-07**: Log sensor reports parse failures, format mismatches, and unexpected structures as warnings with diagnostic context rather than crashing or silently dropping data
  - *Motivation:* `review: R11 -- no sensor error handling requirement existed; sensor processes files from two runtimes with different schemas`

### Spike Methodology

Dependencies: SPIKE-02 -> SPIKE-01 -> SPIKE-09. SPIKE-08 gated on SPIKE-01 completion.

- [ ] **SPIKE-01**: Spike design reviewer agent evaluates experimental design before execution -- must use a different model from the designer (Longino independence requirement, F02 self-evaluation degeneracy), produces CRITIQUE.md not pass/fail verdict
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.1 -- plans get 11-dimension review; spike designs get auto-approval in YOLO` | `research: spike-epistemology-research.md -- Longino's transformative criticism conditions`
  - *Dependencies:* SPIKE-02 (confidence framework must exist for reviewer to reference)
- [ ] **SPIKE-02**: Three-level confidence framework replaces single-dimension HIGH/MEDIUM/LOW -- measurement validity (are the numbers accurate?), interpretation validity (do the numbers mean what we claim?), extrapolation validity (do findings generalize beyond test conditions?)
  - *Motivation:* `research: 3 independent derivations -- spike-methodology-gap-analysis.md, spike-epistemology-research.md, FEATURES.md`
- [ ] **SPIKE-03**: DECISION.md template supports decided/provisional/deferred outcome types -- "provisional" = pragmatic default with incomplete evidence, "deferred" = insufficient evidence requiring follow-up
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.4 -- mandatory "Chosen approach" field forces decisions when evidence warrants deferral`
- [ ] **SPIKE-04**: DESIGN.md template includes auxiliary hypothesis register -- what auxiliary assumptions is this experiment co-testing? Under what conditions would a failure be attributable to auxiliaries rather than the main hypothesis?
  - *Motivation:* `research: spike-epistemology-research.md -- Duhem-Quine: no single hypothesis tested in isolation`
- [ ] **SPIKE-05**: DESIGN.md template includes metric limitation documentation -- what each metric measures, what it cannot measure, known failure modes, when it misleads
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.2 -- Jaccard used as sole criterion across 3 spikes without documenting limitations`
- [ ] **SPIKE-06**: DESIGN.md template includes sample design section -- population size, sample size with justification, selectivity at sample vs deployment scale, representativeness argument
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.3 -- 100-paper pool with 20% selectivity when deployment selectivity is 0.1%`
- [ ] **SPIKE-07**: Cross-spike qualification mechanism -- when spike N qualifies or invalidates spike M's findings, qualification notes appended to spike M's artifacts and KB entry gets qualified_by link
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.5 -- 2 retracted, 7 qualified claims; cross-spike qualification report created ad-hoc`
- [ ] **SPIKE-08**: Protocol adherence checkpoints verify DESIGN.md-prescribed methodology was actually followed before synthesis -- adherence-based triggers, not just deviation-based. Gated on SPIKE-01 completion; auto-defers to v1.21 if SPIKE-01 ships late
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.8 -- 3 of 4 prescribed qualitative checkpoints skipped; when performed, they contradicted quantitative conclusions`
  - *Dependencies:* SPIKE-01 (design reviewer must be operational)
- [ ] **SPIKE-09**: Spike findings reviewer agent verifies conclusions follow from evidence, prescribed methodology was followed, confidence levels are justified -- cross-model, evidence-before-claims
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.9 -- no agent verifies DECISION.md claims match evidence`
  - *Dependencies:* SPIKE-01 (design reviewer pattern validated first)
- [ ] **SPIKE-10a**: Spike programme directory structure -- programme ROADMAP.md, shared data asset references, programme-level metadata
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.7 -- arxiv-sanity-mcp created own ROADMAP.md as workaround` | `user: lack of proper spike programme has been a blocker on other projects`
- [ ] **SPIKE-10b**: Cross-spike tracking within programmes -- qualification links between spikes, progressive refinement without 2-round per-spike limit applying to programme
  - *Motivation:* `research: spike-methodology-gap-analysis.md Pattern 5 -- forward dependency without backward propagation`
- [ ] **SPIKE-10c**: Programme lifecycle -- progressiveness assessment (Lakatosian ledger: is this programme progressive or degenerating?), programme-level DECISION.md for overall conclusions
  - *Motivation:* `research: spike-epistemology-research.md -- Lakatos: research programmes, not individual experiments, are the unit of evaluation`
- [ ] **SPIKE-12**: After 3 spikes complete under new methodology, evaluate: did premature closure rate decrease? Did DECISION.md quality improve? Did spike completion time increase disproportionately? If formalization shows compliance theater (forms filled but no quality change), simplify
  - *Motivation:* `review: G1 -- 11 spike requirements with no off-ramp if formalization proves counterproductive`

### Workflow Gaps

- [ ] **WF-01**: `/gsdr:cross-model-review` command launches background cross-model review with: (a) committed audit spec documenting what is being reviewed and by whom (traceability), (b) structured response template (accept/accept-with-nuance/dispute-with-evidence). Command is opt-in, model choice configurable not prescribed, review round count user-determined. The review protocol must remain flexible -- the command provides infrastructure, not a rigid procedure
  - *Motivation:* `pattern: strongest positive pattern across audit (P01-P08, 4 projects, 6+ sessions)` | `research: PITFALLS.md C6 -- over-formalization risk`
- [ ] **WF-02**: `/gsdr:revise-phase-scope` command -- formal path for mid-phase scope changes with ROADMAP.md and REQUIREMENTS.md update, commit, and re-discuss
  - *Motivation:* `pattern: N02 -- highest-impact missing command; user forced signal about missing /gsdr:revise-phase-scope`
- [ ] **WF-03**: `/gsdr:research` command -- lightweight pre-milestone research producing committed knowledge artifacts in `.planning/research/` without code changes or spike overhead. Output must cite sources, state confidence levels per finding, and note limitations
  - *Motivation:* `deliberation: Thread 11 -- telemetry survey didn't fit any existing workflow`
- [ ] **WF-04**: `/gsdr:discuss-milestone` workflow produces a MILESTONE-CONTEXT.md with structured steering brief (working assumptions, open questions, epistemic guardrails, derived constraints, deferred ideas) analogous to discuss-phase CONTEXT.md
  - *Motivation:* `signal: sig-2026-04-08-no-discuss-milestone-workflow -- gap identified and signaled during this milestone's scoping`
- [ ] **WF-05a**: `/gsdr:explore` command adopted from upstream `/gsd:explore` -- Socratic ideation skill with questioning.md reference, mid-session research offers, and artifact routing (notes, todos, seeds, requirements, phases). Minimal GSDR branding.
  - *Motivation:* `deliberation: explore-skill-adoption-and-dialogue-modes.md -- skill gap discovered during federated signal vision conversation`
- [ ] **WF-05b**: `/gsdr:explore` enhanced with GSDR-specific questioning methodology (epistemic practice probes, assumption-surfacing, constraint-challenging), signal-aware exploration (KB queries during sessions via Phase 59 infrastructure), domain probes for harness/signal/epistemic domains replacing upstream web-app probes, and "no artifact" as valid outcome
  - *Motivation:* `deliberation: explore-skill-adoption-and-dialogue-modes.md -- upstream explore is instrumentalized Socratic method; GSDR needs genuine inquiry where exploration itself has value beyond artifacts`

### Discuss-Phase Exploratory Mode

- [ ] **DISC-01**: Exploratory-mode `write_context` template includes structural sections for working assumptions, derived constraints, epistemic guardrails, and structured open questions — not just implementation decisions
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md -- audit found 0 guardrails, 0 working assumptions, 0 constraints across Phases 55-57 vs 4-9 guardrails in peak-era Phases 52-54`
- [ ] **DISC-02**: Typed claim states replace bare [grounded]/[open] binary — vocabulary distinguishes between traced-to-artifact claims, working assumptions, framework commitments, time-sensitive observations, unresolved questions, and locked decisions
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md -- pluralist epistemic analysis (Sellars, Brandom, Gadamer, Dewey, Longino, Wittgenstein) shows different claims have different epistemic situations that a binary cannot capture`
- [ ] **DISC-03**: Claims eligible for auto-progression during --auto require verifiable provenance (traceable citation to artifact, prior decision, requirement, or convention). Epistemic status labels are decoupled from auto-progression eligibility
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md + codex-gpt54-review.md -- [grounded] does double duty as epistemic status AND automation control token, creating Goodhart incentive to mark everything grounded`
- [ ] **DISC-04**: Lightweight citation checker flags phantom or unresolvable references in CONTEXT.md claim citations before downstream consumption
  - *Motivation:* `audit: rigorous-comparative-audit.md -- Phase 57 CONTEXT.md cites "Pitfall C3" which does not resolve to any document in the planning directory; phantom citations look like grounding but aren't`
- [ ] **DISC-05**: Upstream --chain flag (commit 5e88db95, PR #1445) cherry-picked into fork discuss-phase workflow. Discuss-phase commits CONTEXT.md output when `commit_docs: true` in config
  - *Motivation:* `audit: auto-progression-audit.md -- fork sync gap; --chain never merged. sig-2026-04-09-discuss-phase-workflow-gaps documents both issues`
- [ ] **DISC-06**: Main exploratory capture section renamed from "Implementation Decisions" to a framing that does not bias toward closure
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md + codex-gpt54-review.md -- "the system is asking the model to think one way and write another"`
- [ ] **DISC-07**: Research questions generated by exploratory CONTEXT.md use generative format (specifying research program, downstream decisions affected, reversibility) rather than binary yes/no format
  - *Motivation:* `audit: rigorous-comparative-audit.md Section B -- rich-era questions specify methodology ("Diff the two versions structurally"); thin-era questions ask yes/no ("Should Area 3 fixes be included?")`

### Audit Workflow

- [ ] **AUDIT-01**: Audit sessions produce date-first directories (`.planning/audits/YYYY-MM-DD-{slug}/`) containing task specs given to agents alongside agent outputs, with provenance metadata (agent model, launch context, session ID)
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md -- three audits during this session had ephemeral outputs, no task spec preservation, and fragile cross-model invocation`
- [ ] **AUDIT-02**: Audit task specs include explicit epistemic ground rules: every claim cites file:line, every finding tested against disconfirming evidence before writing, distinction between what was measured and what the measure captures
  - *Motivation:* `audit: rigorous-comparative-audit-task-spec.md -- third audit produced substantially better results after explicit anti-verificationist instructions; first two exhibited the epistemic failures being investigated`

### Cross-Runtime Parity

- [ ] **XRT-01**: Every hook-dependent v1.20 feature specifies its Codex CLI degradation path in phase CONTEXT.md before implementation begins. Cross-runtime capability matrix (`capability-matrix.md`) updated when v1.20 features ship
  - *Motivation:* `research: cross-runtime-parity-research.md -- Codex CLI v0.118.0 has zero hook mechanism`
- [ ] **XRT-02**: Patch compatibility checking validates patches against Codex CLI target runtime before cross-runtime application
  - *Motivation:* `pattern: patches applied to Claude without checking Codex compatibility`

### Parallel Execution

Dependencies: PAR-01 -> PAR-02 -> PAR-03

- [ ] **PAR-01**: Per-worktree state files (`.planning/state/{worktree-name}.json`) eliminate STATE.md merge conflicts during parallel phase execution. Adopt upstream's orchestrator-owns-writes pattern for intra-phase parallelism as complement
  - *Motivation:* `pattern: N10/N11 -- parallel execution repeatedly produces STATE.md merge conflicts` | `research: upstream-drift-survey -- upstream solved intra-phase with orchestrator-owns-writes (convergent)`
- [ ] **PAR-02**: `gsd-tools state` provides composite view across worktree state files -- aggregated progress, per-worktree status
  - *Motivation:* `research: ARCHITECTURE.md -- state json composite view for multi-worktree visibility`
- [ ] **PAR-03**: Phases with non-overlapping file scopes can execute in parallel on separate worktrees. Merge uses standard git merge from worktree branches. Overlapping file scope detected before parallel dispatch and blocks parallel execution for those phases. Adopt upstream's files_modified overlap detection and wave ordering
  - *Motivation:* `user: parallel phases should be regular practice` | `research: upstream-drift-survey -- upstream's overlap detection directly relevant`

## v1.21 Requirements (Deferred)

### Signal Ontology
- **ONT-01**: Signal-to-issue promotion mechanism with developer-controlled escalation
- **ONT-02**: Signal-to-opportunity promotion for positive patterns worth formalizing
- **ONT-03**: GitHub Issues integration (filing issues from signals, bidirectional sync)

### KB at Scale
- **KBS-01**: KB organization, pruning, archiving for 200+ signal collections
- **KBS-02**: MCP server wrapping KB CLI for cross-machine and agent-native access
- **KBS-03**: Reflection pipeline activation (198 signals, 0 lessons -- F21 dual memory gap)

### Automation
- **AUT-01**: Automation loop ungating -- safe automatic triggering with quality gates
- **AUT-02**: Full Issue #17 -- cross-runtime drift hardening (9 acceptance criteria)

### Upstream Candidates
- **UPS-01**: Global learnings store (learnings.cjs) -- complementary lightweight cross-phase observations
- **UPS-02**: Execution context profiles -- behavioral mode dimension orthogonal to model profiles
- **UPS-03**: Security enforcement layer -- threat-model verification, prompt injection scanning
- **UPS-04**: /gsd-explore (Socratic ideation), /gsd-undo (safe revert), /gsd:code-review + code-review-fix

## Out of Scope

| Feature | Reason |
|---------|--------|
| Vector embeddings for KB search | FTS5 sufficient at current scale; Palinode-style hybrid search is v1.22+ if needed |
| Token cost dashboard / web UI | CLI-first; GSD is terminal-native |
| Same-model spike design reviewer | Structurally insufficient per Longino + F02; cross-model is mandatory |
| Mandatory severity thresholds for automation | Pressure toward premature closure; advisory-only per three-tier model |
| Continental philosophy memory grounding | Requires arxiv-sanity-mcp operational for literature survey (v1.22+) |
| Automated code fixes from signals | Signals inform humans/agents, don't auto-patch |
| Graph database for KB | Categorically wrong for this scale (~200 entries); SQLite index is correct |
| Cross-project signal propagation | v1.22+; depends on cross-machine bridge not yet designed |
| gsd-tools complexity budget/refactoring | Monitor but no v1.20 requirement; modular architecture designed to scale |
| Automated telemetry sensor agent | v1.21; extraction tooling first, automated collection after interpretive framework designed |

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SYNC-01 | Phase 55 | Complete |
| KB-01 | Phase 56 | Complete |
| KB-02 | Phase 56 | Complete |
| KB-03 | Phase 56 | Complete |
| KB-04a | Phase 56 | Complete |
| KB-05 | Phase 56 | Complete |
| KB-09 | Phase 56 | Complete |
| KB-10 | Phase 56 | Complete |
| KB-11 | Phase 56 | Complete |
| TEL-01a | Phase 57 | Pending |
| TEL-01b | Phase 57 | Pending |
| TEL-02 | Phase 57 | Pending |
| TEL-04 | Phase 57 | Pending |
| TEL-05 | Phase 57 | Pending |
| GATE-01 | Phase 58 | Pending |
| GATE-02 | Phase 58 | Pending |
| GATE-03 | Phase 58 | Pending |
| GATE-04 | Phase 58 | Pending |
| GATE-05 | Phase 58 | Pending |
| GATE-06 | Phase 58 | Pending |
| GATE-07 | Phase 58 | Pending |
| GATE-08 | Phase 58 | Pending |
| XRT-01 | Phase 58 | Pending |
| KB-04b | Phase 59 | Pending |
| KB-04c | Phase 59 | Pending |
| KB-06a | Phase 59 | Pending |
| KB-06b | Phase 59 | Pending |
| KB-07 | Phase 59 | Pending |
| KB-08 | Phase 59 | Pending |
| SENS-01 | Phase 60 | Pending |
| SENS-02 | Phase 60 | Pending |
| SENS-03 | Phase 60 | Pending |
| SENS-04 | Phase 60 | Pending |
| SENS-05 | Phase 60 | Pending |
| SENS-06 | Phase 60 | Pending |
| SENS-07 | Phase 60 | Pending |
| XRT-02 | Phase 60 | Pending |
| CODEX-01 | Phase 55.2 | Pending |
| CODEX-02 | Phase 55.2 | Pending |
| CODEX-05 | Phase 55.2 | Pending |
| SPIKE-01 | Phase 61 | Pending |
| SPIKE-02 | Phase 61 | Pending |
| SPIKE-03 | Phase 61 | Pending |
| SPIKE-04 | Phase 61 | Pending |
| SPIKE-05 | Phase 61 | Pending |
| SPIKE-06 | Phase 61 | Pending |
| SPIKE-07 | Phase 61 | Pending |
| SPIKE-08 | Phase 61 | Pending |
| SPIKE-09 | Phase 61 | Pending |
| SPIKE-12 | Phase 61 | Pending |
| WF-01 | Phase 62 | Pending |
| WF-02 | Phase 62 | Pending |
| WF-03 | Phase 62 | Pending |
| WF-04 | Phase 62 | Pending |
| WF-05a | Phase 57.1 | Pending |
| WF-05b | Phase 62 | Pending |
| SPIKE-10a | Phase 63 | Pending |
| SPIKE-10b | Phase 63 | Pending |
| SPIKE-10c | Phase 63 | Pending |
| DISC-01 | Phase 57.2 | Pending |
| DISC-02 | Phase 57.2 | Pending |
| DISC-03 | Phase 57.2 | Pending |
| DISC-04 | Phase 57.2 | Pending |
| DISC-05 | Phase 57.2 | Pending |
| DISC-06 | Phase 57.2 | Pending |
| DISC-07 | Phase 57.2 | Pending |
| AUDIT-01 | Phase 57.3 | Pending |
| AUDIT-02 | Phase 57.3 | Pending |
| PAR-01 | Phase 64 | Pending |
| PAR-02 | Phase 64 | Pending |
| PAR-03 | Phase 64 | Pending |

**Coverage:**
- v1.20 requirements: 60 total
- Mapped to phases: 60
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 -- roadmap created, traceability populated*
