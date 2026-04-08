# Requirements: GSD Reflect v1.20

**Defined:** 2026-04-08
**Core Value:** The system never makes the same mistake twice — signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

**Evidence base:** Cross-platform session log audit (100 sessions, 165 findings, 13 RECURRED), spike methodology gap analysis (11 gaps, 5 failure patterns), 9 research documents, pre-v1.20 deliberation (11 threads).

**Milestone thesis:** v1.20 is an infrastructure correction, not a feature expansion. Every failed advisory intervention had zero effect on behavior. The three interlocking deficits — a KB that cannot query or track remediation, a spike workflow that prescribes but cannot enforce rigor, and a measurement gap that leaves no baselines — must be addressed as a dependency chain.

## v1.20 Requirements

### KB Infrastructure

- [ ] **KB-01**: Signal schema supports lifecycle states (proposed → in_progress → blocked → verified → remediated) with transition validation
  - *Motivation:* `signal: sig-2026-03-04-signal-lifecycle-representation-gap` | `pattern: R11 — 0% remediation rate, 171/187 stuck in active`
- [ ] **KB-02**: Signal schema supports polarity (negative/positive/mixed) and response disposition (fix/formalize/monitor/investigate)
  - *Motivation:* `pattern: 35 positive patterns unrecordable in current schema` | `deliberation: Thread 1 signal/issue ontology — anticipate future promotion without closing doors`
- [ ] **KB-03**: Signal schema supports qualification links (qualified_by, superseded_by) for cross-signal and cross-spike references
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.5 — 2 retracted, 7 qualified claims required manual cross-spike report`
- [ ] **KB-04**: SQLite index built from signal files via node:sqlite with FTS5 full-text search, lifecycle state queries, and relationship traversal
  - *Motivation:* `research: kb-architecture-research.md — file+SQLite validated by 3 open-source precedents (MarkdownDB, Palinode, sqlite-memory)`
- [ ] **KB-05**: SQLite index is a derived cache — files remain source of truth, dual-write invariant enforced on every lifecycle transition, kb.db gitignored, rebuildable from files at any time
  - *Motivation:* `signal: sig-2026-02-11-kb-data-loss-migration-gap — direct historical precedent for cache-as-truth failure` | `research: PITFALLS.md C1`
- [ ] **KB-06**: `gsd-tools kb` CLI provides query, stats, health, transition, link, search, and rebuild subcommands
  - *Motivation:* `research: kb-architecture-research.md — CLI-first validates query API; MCP wrapper deferred to v1.21`
- [ ] **KB-07**: Signal lifecycle wiring completes the v1.16 `resolves_signals` feature — collect-signals reads resolves_signals from completed plan frontmatter and auto-transitions matching signals to remediated
  - *Motivation:* `research: PITFALLS.md C2 — resolves_signals has existed since Phase 34 and has never been read by anything`
- [ ] **KB-08**: KB surfacing in research/planning agents uses SQLite queries instead of grep-through-index for relevant signal/spike/lesson retrieval
  - *Motivation:* `research: ARCHITECTURE.md — knowledge-surfacing.md updated to use kb query for structured retrieval`

### Measurement & Telemetry

- [ ] **TEL-01**: `gsd-tools telemetry` subcommand family extracts session-level metrics from session-meta and JSONL (summary, session, phase, baseline, enrich)
  - *Motivation:* `research: measurement-infrastructure-research.md — 268 session-meta files + 109 facets files already available, no new instrumentation needed`
- [ ] **TEL-02**: Telemetry baseline captured in `.planning/baseline.json` before any v1.20 structural interventions ship — preserves ability to attribute changes to specific interventions
  - *Motivation:* `research: ARCHITECTURE.md anti-pattern 4 — post-intervention baselines are contaminated` | `deliberation: every intervention should come with predictions`
- [ ] **TEL-03**: Token count validation spike confirms session-meta input_tokens/output_tokens reliability against JSONL-aggregated per-message counts before baselines are trusted
  - *Motivation:* `research: measurement-infrastructure-research.md — 109 input_tokens for 23-message/513-minute session is implausibly low` | `research: PITFALLS.md C3`
- [ ] **TEL-04**: Facets data (109 AI-generated session quality assessments) joined with session-meta by session_id for quality signal enrichment
  - *Motivation:* `research: measurement-infrastructure-research.md — facets is an underexplored asset; joining facets+session-meta is the highest-value first analysis`

### Structural Enforcement

- [ ] **GATE-01**: offer_next enforces PR creation and CI verification before phase advancement — structural gate, not advisory text
  - *Motivation:* `pattern: R01 — 6+ occurrences of advisory fix failing, signal f5e6b2b6 still active`
- [ ] **GATE-02**: `--merge` is the structural default for PR merges — passed explicitly in `gh pr merge` invocation, not documented as preference
  - *Motivation:* `pattern: R02 — squash merge destroyed commit history, required force-push recovery`
- [ ] **GATE-03**: Quick task detects runtime code changes and requires branch+PR flow — docs-only changes allowed direct to main
  - *Motivation:* `pattern: R08 — quick task committed runtime code to main without CI gate`
- [ ] **GATE-04**: `.continue-here` files marked consumed on read and deleted/archived after session start — staleness check if file predates last session
  - *Motivation:* `pattern: R09 — 3 months of recurrence, 3+ signals, no fix`
- [ ] **GATE-05**: Sensor model selection echoed and logged before dispatch in all delegation workflows
  - *Motivation:* `pattern: R10 — entire sensor batch stopped and relaunched because model selection was wrong and unverifiable`
- [ ] **GATE-06**: Automation postlude fires structurally — SessionStop hook on Claude Code, workflow-enforced step on Codex — rather than by agent discretion
  - *Motivation:* `pattern: R12 — 0% fire rate across all sessions, 6/6 signal_collection skipped`
- [ ] **GATE-07**: Incident self-signal hook prompts signal creation when session metadata indicates high error rate, direction changes, or destructive events during execution
  - *Motivation:* `pattern: R04 — agent failed to self-signal after 91-file cascade, headless version burn, CI bypass`
- [ ] **GATE-08**: Discuss-phase adoption completed — 5 missing files from upstream adoption (discuss-phase-assumptions.md, gsd-assumptions-analyzer, config routing, docs, discuss_mode routing) created and wired
  - *Motivation:* `signal: sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop — Issues #26, #32, #33 closed prematurely`

### Sensor Pipeline

- [ ] **SENS-01**: Log sensor integrated into collect-signals with progressive deepening (structural fingerprinting → intelligent triage → selective context expansion → signal construction)
  - *Motivation:* `research: log sensor spec already in source, validated by audit (165 findings from 100 sessions)` | `signal: Issue #35 open`
- [ ] **SENS-02**: Log sensor cross-runtime adapter normalizes Claude Code JSONL and Codex JSONL to common fingerprint schema — Codex adapter handles response_item/event_msg container types
  - *Motivation:* `research: cross-runtime-parity-research.md — formats structurally different but semantically equivalent, Codex provides richer data`
- [ ] **SENS-03**: Codex session discovery uses state_5.sqlite for session metadata queries (cwd, tokens, git state, model, reasoning effort)
  - *Motivation:* `research: cross-runtime-parity-research.md — state_5.sqlite is SQL-queryable, richer than Claude Code's filesystem-only discovery`
- [ ] **SENS-04**: Patch sensor detects source-vs-installed file divergence using installer manifest SHA256 comparison
  - *Motivation:* `deliberation: patches applied on Apollo never propagated to source — the opening problem of the audit session`
- [ ] **SENS-05**: Patch sensor classifies divergences into taxonomy (bug/stale/customization/format-drift/feature-gap) with developer-facing report
  - *Motivation:* `research: cross-runtime-parity-research.md — builds on existing saveLocalPatches() mechanism`
- [ ] **SENS-06**: Post-install cross-runtime parity verification runs automatically after `node bin/install.js` — compares installed files across detected runtimes
  - *Motivation:* `pattern: R03 — cross-runtime distribution gap; fixes ship in GSDR but don't reach projects running unpatched installs`

### Spike Methodology

- [ ] **SPIKE-01**: Spike design reviewer agent evaluates experimental design before execution — must use a different model from the designer (Longino independence requirement, F02 self-evaluation degeneracy), produces CRITIQUE.md not pass/fail verdict
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.1 — plans get 11-dimension review; spike designs get auto-approval in YOLO` | `research: spike-epistemology-research.md — Longino's transformative criticism conditions`
- [ ] **SPIKE-02**: Three-level confidence framework replaces single-dimension HIGH/MEDIUM/LOW — measurement validity (are the numbers accurate?), interpretation validity (do the numbers mean what we claim?), extrapolation validity (do findings generalize beyond test conditions?)
  - *Motivation:* `research: 3 independent derivations — spike-methodology-gap-analysis.md, spike-epistemology-research.md, FEATURES.md`
- [ ] **SPIKE-03**: DECISION.md template supports decided/provisional/deferred outcome types — "provisional" = pragmatic default with incomplete evidence, "deferred" = insufficient evidence requiring follow-up
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.4 — mandatory "Chosen approach" field forces decisions when evidence warrants deferral`
- [ ] **SPIKE-04**: DESIGN.md template includes auxiliary hypothesis register — what auxiliary assumptions is this experiment co-testing? Under what conditions would a failure be attributable to auxiliaries rather than the main hypothesis?
  - *Motivation:* `research: spike-epistemology-research.md — Duhem-Quine: no single hypothesis tested in isolation; vigil session c4c15beb falsification nearly concluded "Swift is broken" from contaminated test environment`
- [ ] **SPIKE-05**: DESIGN.md template includes metric limitation documentation — what each metric measures, what it cannot measure, known failure modes, when it misleads
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.2 — Jaccard used as sole criterion across 3 spikes without documenting limitations`
- [ ] **SPIKE-06**: DESIGN.md template includes sample design section — population size, sample size with justification, selectivity at sample vs deployment scale, representativeness argument
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.3 — 100-paper pool with 20% selectivity when deployment selectivity is 0.1%`
- [ ] **SPIKE-07**: Cross-spike qualification mechanism — when spike N qualifies or invalidates spike M's findings, qualification notes appended to spike M's artifacts and KB entry gets qualified_by link
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.5 — 2 retracted, 7 qualified claims; cross-spike qualification report created ad-hoc`
- [ ] **SPIKE-08**: Protocol adherence checkpoints verify DESIGN.md-prescribed methodology was actually followed before synthesis — adherence-based triggers, not just deviation-based
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.8 — 3 of 4 prescribed qualitative checkpoints skipped; when performed, they contradicted quantitative conclusions`
- [ ] **SPIKE-09**: Spike findings reviewer agent verifies conclusions follow from evidence, prescribed methodology was followed, confidence levels are justified — cross-model, evidence-before-claims
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.9 — no agent verifies DECISION.md claims match evidence`
- [ ] **SPIKE-10**: Spike programme infrastructure — programme directory with ROADMAP.md, shared data assets, cross-spike tracking, progressive refinement across multiple related spikes without the 2-round limit applying to the programme
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.7 — arxiv-sanity-mcp created its own ROADMAP.md, METHODOLOGY.md, DESIGN-PRINCIPLES.md as workarounds` | `user: lack of proper spike programme has been a blocker on starting and making progress on other projects`
- [ ] **SPIKE-11**: Epistemological framework operationalizes Lakatos (progressiveness ledger for research programmes — progressive vs degenerating assessment), Mayo (severity assessment as confidence dimension — could this test have caught the error?), and institutional critique (three-tier enforce/encourage/warn model — Feyerabend's warning against suppressing productive deviation) without rigid procedures
  - *Motivation:* `research: spike-epistemology-research.md — each philosopher produces concrete design recommendations; framework must not reduce to naive falsificationism`

### Workflow Gaps

- [ ] **WF-01**: `/gsdr:cross-model-review` command with committed audit spec before launch, background execution, structured response protocol (accept/accept-with-nuance/dispute-with-evidence) — opt-in and flexible, must not be over-formalized
  - *Motivation:* `pattern: strongest positive pattern across audit (P01-P08, 4 projects, 6+ sessions)` | `research: PITFALLS.md C6 — over-formalization risk explicitly named`
- [ ] **WF-02**: `/gsdr:revise-phase-scope` command — formal path for mid-phase scope changes with ROADMAP.md and REQUIREMENTS.md update, commit, and re-discuss
  - *Motivation:* `pattern: N02 — highest-impact missing command; user forced signal about missing /gsdr:revise-phase-scope`
- [ ] **WF-03**: `/gsdr:research` command — lightweight pre-milestone research producing committed knowledge artifacts in `.planning/research/` without code changes or spike overhead
  - *Motivation:* `deliberation: Thread 11 — telemetry survey didn't fit any existing workflow; informal research as workflow gap`

### Cross-Runtime Parity

- [ ] **XRT-01**: Every hook-dependent v1.20 feature specifies its Codex CLI degradation path in phase CONTEXT.md before implementation begins
  - *Motivation:* `research: cross-runtime-parity-research.md — Codex CLI v0.118.0 has zero hook mechanism confirmed by direct inspection`
- [ ] **XRT-02**: Patch compatibility checking validates patches against target runtime before cross-runtime application
  - *Motivation:* `pattern: patches applied to Claude without checking Codex compatibility`
- [ ] **XRT-03**: Cross-runtime distribution gap addressed for within-project GSDR installs — post-install verification confirms installed files match source
  - *Motivation:* `pattern: R03 — discuss-phase fix shipped in GSDR v1.19.0 but unreachable by projects without local GSDR install`

### Parallel Execution

- [ ] **PAR-01**: Per-worktree state files (`.planning/state/{worktree-name}.json`) eliminate STATE.md merge conflicts during parallel phase execution
  - *Motivation:* `pattern: N10/N11 — parallel execution repeatedly produces STATE.md merge conflicts` | `research: measurement-infrastructure-research.md — Approach 1 uses existing resolveWorktreeRoot() infrastructure`
- [ ] **PAR-02**: `gsd-tools state` provides composite view across worktree state files — aggregated progress, per-worktree status
  - *Motivation:* `research: ARCHITECTURE.md — state json composite view for multi-worktree visibility`
- [ ] **PAR-03**: Phases with non-overlapping file scopes can execute in parallel on separate worktrees with coordinated merge
  - *Motivation:* `user: parallel phases should be regular practice, not exceptional`

## v1.21 Requirements (Deferred)

### Signal Ontology
- **ONT-01**: Signal-to-issue promotion mechanism with developer-controlled escalation
- **ONT-02**: Signal-to-opportunity promotion for positive patterns worth formalizing
- **ONT-03**: GitHub Issues integration (filing issues from signals, bidirectional sync)

### KB at Scale
- **KBS-01**: KB organization, pruning, archiving for 200+ signal collections
- **KBS-02**: MCP server wrapping KB CLI for cross-machine and agent-native access
- **KBS-03**: Reflection pipeline activation (198 signals, 0 lessons — F21 dual memory gap)

### Automation
- **AUT-01**: Automation loop ungating — safe automatic triggering with quality gates
- **AUT-02**: Full Issue #17 — cross-runtime drift hardening (9 acceptance criteria)

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

## Traceability

Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated by roadmapper) | | |

**Coverage:**
- v1.20 requirements: 46 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 46

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-08 after research synthesis*
