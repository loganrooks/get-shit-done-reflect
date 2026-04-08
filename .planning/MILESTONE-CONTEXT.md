# Milestone Context: v1.20 Signal Infrastructure & Epistemic Rigor

**Created:** 2026-04-08
**Mode:** Exploratory (adapted from discuss-phase structure — no formal discuss-milestone workflow exists; see signal below)
**Evidence base:** Cross-platform session log audit (100 sessions, 165 findings, `.planning/audits/session-log-audit-2026-04-07/`)

## Milestone Boundary

v1.20 addresses the structural failures identified by the audit — every failed intervention used advisory text, not structural enforcement — while building the measurement and experimental infrastructure needed for evidence-based workflow improvement.

**In scope:** KB architecture evolution, spike methodology overhaul, structural gate enforcement, measurement/telemetry infrastructure, sensor pipeline (log + patch), cross-model review, workflow gap closure, cross-runtime parity (Claude Code + Codex CLI), parallel execution infrastructure.

**Not in scope:** Signal/issue ontology full design (v1.21), KB organization at scale (v1.21), continental philosophy of memory (v1.22+), automation loop ungating (v1.21), full Issue #17 cross-runtime drift (v1.21).

## Working Assumptions

These are current assumptions, not locked decisions. Research and phase-level discussion should test and revise them.

### KB Architecture
- **[open]** CLI vs MCP server vs both for KB query layer — downstream effects not yet mapped
- **[open]** File+SQLite index vs graph database vs hybrid — depends on relational query needs, zero-dependency philosophy, cross-machine access patterns
- **[grounded]** Files remain source of truth (human readable, version controllable, backward compatible) — query layer is a cache/index, not the canonical store
- **[open]** How to render KB accessible to developers — dashboard, CLI views, agent-accessible queries
- **[open]** Cross-machine KB discovery — MCP server enables remote queries, but SSH/rsync staging also works

### Signal Schema Evolution
- **[grounded]** Lifecycle states needed: proposed → in_progress → blocked → verified → remediated (audit evidence: 0% remediation rate, R11)
- **[grounded]** Signal polarity needed: negative / positive / mixed (audit evidence: 35 positive patterns currently unrecordable)
- **[working assumption]** Response disposition field: fix / formalize / monitor / investigate — anticipates signal→issue/opportunity promotion without building the full mechanism
- **[working assumption]** Qualification links: qualified-by, superseded-by fields for cross-signal and cross-spike references
- **[open]** How the schema relates to a future signal/issue/opportunity ontology — must not close doors

### Spike Methodology
- **[grounded]** Spike design reviewer agent needed (4 independent sources in spike gap analysis)
- **[grounded]** Three-level confidence framework: measurement / interpretation / extrapolation (3 independent derivations)
- **[grounded]** DECISION.md needs decided/provisional/deferred outcome types (audit + spike gap analysis)
- **[working assumption]** Spike programme/campaign infrastructure with shared assets and cross-spike qualification
- **[open]** How to operationalize Lakatos (research programmes, progressive vs degenerating), Duhem-Quine (auxiliary hypotheses, holism of testing), Mayo (severe testing) without creating rigid institutional procedures that suppress productive deviation
- **[open]** What philosophers of science say about the institutional procedures of research (peer review, replication, literature review) and their critiques — the agential equivalents should learn from these critiques, not reproduce the same flaws

### Measurement & Telemetry
- **[grounded]** Log sensor ready for integration (progressive deepening design validated by audit, already in source)
- **[grounded]** Token usage data already available in session-meta (268 sessions) and JSONL (per-message)
- **[working assumption]** Build extraction tooling now (gsd-tools subcommands), automated sensor later
- **[open]** Which metrics are actually predictive of quality? (telemetry survey "Still Open" items 1-4)
- **[open]** Prediction framework dimensions: functional, structural, interactional, temporal, risk — is this sufficient?
- **[working assumption]** Baselines before interventions — every v1.20 change should have measurable/observable predictions

### Cross-Runtime Parity
- **[grounded]** Focus on Claude Code + Codex CLI (the two active runtimes)
- **[open]** Which v1.20 features need full parity vs graceful degradation?
- **[open]** How to handle hook-dependent features on runtimes without hooks
- **[working assumption]** Patch compatibility checking before cross-runtime application

### Structural Enforcement
- **[grounded]** offer_next PR/CI gate — structural, not advisory (6+ occurrences of advisory fix failing)
- **[grounded]** --merge as default merge strategy — one-line fix
- **[grounded]** Quick task branch detection for runtime code
- **[grounded]** .continue-here consumption lifecycle
- **[working assumption]** Automation postlude as hook where available, loud advisory where not
- **[working assumption]** Incident self-signal hook for high-error-rate sessions

### Workflow Gaps
- **[grounded]** `/gsdr:revise-phase-scope` — highest-impact missing command (N02)
- **[grounded]** `/gsdr:cross-model-review` — strongest positive pattern, flexible protocol
- **[working assumption]** `/gsdr:research` — lightweight pre-milestone research command
- **[open]** Parallel phase execution on worktrees — STATE.md conflict resolution strategy unknown

## Derived Constraints (from session handoff)

1. Don't bake KB storage format assumptions into sensor pipeline
2. Don't hardcode single-machine paths
3. Don't merge signal and issue concepts prematurely
4. Don't design token tooling around current pricing
5. Don't over-formalize cross-model review

## Open Questions for Research

1. **KB Architecture:** What are the downstream effects of CLI vs MCP vs both? What does the epistemic-agency repo (F09, F14, F21) suggest about knowledge retrieval architectures? What can we learn from philograph-mcp's approach?
2. **Spike Epistemology:** How do Lakatos's research programmes, Duhem-Quine's holism, and Mayo's severe testing translate into concrete workflow design? What do philosophers of science critique about institutional research procedures (peer review, replication) that we should avoid reproducing?
3. **Parallel Execution:** How do multi-agent systems handle parallel workstream execution? What conflict-free state management approaches exist?
4. **Cross-Runtime:** What's the current capability matrix for Claude Code vs Codex CLI for v1.20 features? Where does parity matter vs graceful degradation?
5. **Patch Sensor:** How should source-vs-installed divergence detection work? What classification taxonomy (bug/customization/opportunity) is appropriate?

## Epistemic Guardrails

- **Don't operationalize naive falsificationism.** "What would falsify this?" is a starting point, not a methodology. Engage with the critical inheritance of Popper.
- **Don't treat metrics as self-evident.** Every metric needs interpretive context (telemetry survey epistemological caveats).
- **Don't over-formalize productive informality.** Cross-model review, user epistemic challenges, and trial-before-formalize work partly because they're context-responsive. Formalization should add structure without killing adaptiveness.
- **Predictions are multi-dimensional.** Not just quantitative/qualitative — also structural (what becomes possible), interactional (how changes combine), temporal (when effects manifest), and risk (what could degrade).

## Deferred Ideas

- Signal/issue/opportunity ontology full design — v1.21
- KB pruning, archiving, and re-reading mechanisms — v1.21
- Continental philosophy of memory as KB architecture foundation — v1.22+
- Automation ungating (0% → safe automatic) — v1.21
- Token sensor as automated agent with interpretive framing — v1.21
- Agentic memory systems literature survey (via arxiv-sanity-mcp) — v1.22+

## Key Artifacts to Ingest

| Artifact | Path | Relevance |
|----------|------|-----------|
| Opus negative synthesis | `.planning/audits/session-log-audit-2026-04-07/reports/opus-synthesis.md` | 42 findings, 8 clusters, 23 recommendations |
| Opus positive synthesis | `.planning/audits/session-log-audit-2026-04-07/reports/positive-opus-synthesis.md` | 35 positive patterns, formalization recommendations |
| Verification analysis A | `.planning/audits/session-log-audit-2026-04-07/reports/verification-analysis.md` | 13 RECURRED, priority ordering |
| Verification analysis B | `.planning/audits/session-log-audit-2026-04-07/reports/verification-analysis-b.md` | Cross-runtime distribution gap analysis |
| Pre-v1.20 deliberation | `.planning/deliberations/pre-v1.20-session-capture.md` | 11 deliberation threads |
| Telemetry survey | `.planning/audits/session-log-audit-2026-04-07/reports/telemetry-survey.md` | Data sources, derived metrics, open questions |
| Spike methodology gap analysis | `.planning/research/spike-methodology-gap-analysis.md` | 11 gaps, 5 failure patterns from arxiv-sanity-mcp |
| Session handoff | `.planning/audits/session-log-audit-2026-04-07/SESSION-HANDOFF.md` | Design constraints, forward orientation, v1.21/v1.22 sketch |

---

**Gap identified:** No formal `/gsdr:discuss-milestone` workflow exists. This MILESTONE-CONTEXT.md was created informally by adapting discuss-phase structure to milestone-level deliberation. The new-milestone workflow (Step 2) gathers goals through conversation but does not produce a structured steering brief. Phase-level discuss produces CONTEXT.md; milestone-level discuss has no equivalent artifact or workflow.
