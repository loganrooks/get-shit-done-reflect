# Feature Landscape: v1.20 Signal Infrastructure & Epistemic Rigor

**Domain:** Agentic workflow harness — signal infrastructure, experimental methodology, measurement tooling, structural enforcement
**Researched:** 2026-04-08
**Replaces:** Previous FEATURES.md (v1.17 Automation Loop — archived context)
**Overall confidence:** HIGH (custom research on codebase evidence + audit data; ecosystem validation from research files)

---

## Context

v1.20 addresses a fundamental finding from the session-log audit (100 sessions, 165 findings): every failed advisory intervention had exactly zero effect on behavior. The audit's sharpest finding is not "these features are broken" but "advisory text does not enforce." The milestone has two distinct but interacting problems:

1. **Structural enforcement gap:** Workflow gates exist as text suggestions; agents bypass them under execution pressure.
2. **Epistemic infrastructure gap:** The system detects failures but cannot measure them, cannot qualify them with experimental evidence, and cannot track whether fixes hold.

The five feature clusters below address these gaps. Table stakes are what a workflow harness needs to stop repeating known failures. Differentiators are what make this system distinctively evidence-grounded rather than advice-heavy.

**Custom research already completed (read before interpreting this document):**
- KB architecture: `kb-architecture-research.md` — SQLite index design, schema evolution
- Measurement infrastructure: `measurement-infrastructure-research.md` — telemetry schema, baseline strategy
- Cross-runtime parity: `cross-runtime-parity-research.md` — capability matrix, log sensor adapter
- Spike epistemology: `spike-epistemology-research.md` — Lakatos/Duhem-Quine/Mayo framework
- Spike methodology gaps: `spike-methodology-gap-analysis.md` — 11 gaps, 5 failure patterns

---

## Table Stakes

Features the workflow harness must have to stop repeating known failure patterns. Not having these means the audit's 13 RECURRED findings will continue to recur.

| # | Feature | Why Expected | Complexity | Existing Infra | Audit Evidence |
|---|---------|--------------|------------|----------------|----------------|
| TS-1 | **`--merge` as default PR merge strategy** | Squash merges destroy individual commits; recurring deviation documented twice in project memory | Low | `gh pr merge` call exists | Post-merge cleanup deviation ×2 |
| TS-2 | **`offer_next` PR/CI gate (structural, not advisory)** | Current advisory text has zero enforcement; agents proceed to `offer_next` before CI is green | Med | execute-phase workflow exists | 6+ recurrences across audit |
| TS-3 | **`.continue-here` lifecycle enforcement** | Files accumulate undeleted; consume-on-resume is advisory only | Med | resume-work workflow exists | sig: continue-here not deleted ×2 |
| TS-4 | **Quick task branch detection in runtime code** | Agents create branches for quick tasks; detection is currently manual | Low | `resolveWorktreeRoot()` exists | sig: branch-not-deleted ×2 |
| TS-5 | **Signal lifecycle state machine wired to workflows** | 0% remediation tracking across 198 signals; `resolves_signals` plan field exists but nothing reads it post-execution | Med | Plan frontmatter field exists | Audit R11 (0% remediation) |
| TS-6 | **Signal schema: `lifecycle`, `disposition`, `polarity: mixed`** | Current binary `status` field cannot represent "fix in progress" vs "verified held"; no routing for what to do with a signal | Med | Existing signal files, backward-compatible | Audit R11; kb-architecture-research §2 |
| TS-7 | **`gsd-tools kb rebuild` — SQLite index replacing shell script** | Current `kb-rebuild-index.sh` is O(all files), breaks at 1000+ entries; agents cannot do relational queries via grep on `index.md` | Med | `kb-rebuild-index.sh`, SQLite universally available | kb-architecture-research §1 |
| TS-8 | **`gsd-tools kb query` — structured queries against SQLite** | Agents currently grep `index.md`; no tag-based or lifecycle-based filtering possible | Med | Depends on TS-7 | kb-architecture-research §3 |
| TS-9 | **Log sensor cross-runtime adaptation** | Log sensor exists for Claude Code only; cross-runtime parity requires Codex adapter | High | `gsd-log-sensor.md` exists in source | cross-runtime-parity-research §3 |
| TS-10 | **Post-install cross-runtime parity verification** | Codex install goes stale silently; R3 (discuss-phase fix shipped to Claude Code, never reached Codex) is a recurring class | Low | Installer `saveLocalPatches()` exists | Verification analysis R3 |
| TS-11 | **`/gsdr:revise-phase-scope` command** | Highest-impact missing command (N02); phase scope changes currently require manual STATE.md surgery | Med | STATE.md management exists | MILESTONE-CONTEXT.md N02 |
| TS-12 | **Three-level confidence framework in DECISION.md** | Single-dimension HIGH/MEDIUM/LOW conflates measurement accuracy with interpretation validity with extrapolation scope; independently derived in 3 sources | Low | DECISION.md template exists | spike-methodology-gap-analysis §6.3 |
| TS-13 | **Spike design reviewer agent** | No independent review of experimental designs before execution; YOLO mode auto-approves all designs; same failure mode as plans without plan-checker | High | `gsd-plan-checker` analogy, SPIKE-DESIGN-REVIEW-SPEC.md written by user | spike-methodology-gap-analysis §7.1 (4 independent sources) |

---

## Differentiators

Features that make v1.20 distinctively evidence-grounded. Expected in mature workflow research systems but not baseline. Complexity and research uncertainty are higher.

| # | Feature | Value Proposition | Complexity | Dependencies | Notes |
|---|---------|-------------------|------------|--------------|-------|
| D-1 | **`gsd-tools telemetry` subcommand family** | Baseline measurement before any intervention; sessions correlated with phases; facets quality labels enable correlation analysis | High | session-meta (268 files), facets (109 files) | measurement-infrastructure-research §3; Option A (native module) recommended over ccusage wrapper |
| D-2 | **`gsd-tools kb stats` — KB health dashboard** | Visibility into lifecycle state distribution, remediation rate, polarity breakdown; currently invisible | Low | Depends on TS-7 (SQLite index) | kb-architecture-research §3 |
| D-3 | **`gsd-tools kb transition` — lifecycle state transitions** | Enables moving signals from `detected` → `in_progress` → `remediated` → `verified`; closes R11 | Med | Depends on TS-7, TS-6 | kb-architecture-research §3 |
| D-4 | **Signal `qualified_by` / `superseded_by` links** | Enables spike-qualified-by-signal cross-referencing; without this, spike findings sit in isolation from KB signals | Low | Depends on TS-6 | kb-architecture-research §2 |
| D-5 | **Spike findings reviewer agent** | Post-execution verification that conclusions follow from evidence; analogue to `gsd-verifier` for spikes | High | Depends on TS-13 (design reviewer), three-level confidence framework | spike-methodology-gap-analysis §7.2 |
| D-6 | **`/gsdr:cross-model-review` command** | Strongest positive pattern in audit (P01-P08 cluster); different model provides genuinely independent error detection that same-model review cannot | Med | No new infra needed; command formalizes existing ad-hoc practice | spike-epistemology-research §5.2 (Longino); MILESTONE-CONTEXT.md |
| D-7 | **Spike programme infrastructure** | Multi-spike investigations (arxiv-sanity-mcp experience) need shared data assets, progressiveness ledger, backward propagation | High | Depends on TS-12, TS-13, D-4 | spike-epistemology-research §2; spike-methodology-gap-analysis §6.5 |
| D-8 | **Auxiliary hypothesis register in DESIGN.md template** | Makes load-bearing assumptions explicit before execution; catches Pattern 2 (metric reification) and Pattern 3 (circular evaluation) at design time | Med | Depends on TS-13 (design reviewer checks register) | spike-epistemology-research §3.2 (Duhem-Quine) |
| D-9 | **Parallel phase execution infrastructure** | STATE.md conflict resolution for worktree-based parallel execution; enables concurrent phase work | High | `resolveWorktreeRoot()`, `atomicWriteJson()` | measurement-infrastructure-research §6; Approach 1 (per-worktree state files) recommended |
| D-10 | **Patch sensor / distribution monitor** | Detects source-vs-installed divergence and cross-runtime stale installs; classifies divergence (bug/stale/customization) | Med | Installer `saveLocalPatches()` already exists | cross-runtime-parity-research §2, §4.4 |
| D-11 | **Incident self-signal hook (automation postlude)** | When a session has high error rate, automatically surface a signal candidate; structural on Claude Code (PostToolUse hook), advisory on Codex | Med | PostToolUse hook (Claude Code only); Codex degrades to workflow step | MILESTONE-CONTEXT.md structural enforcement cluster |
| D-12 | **DECIDED/PROVISIONAL/DEFERRED outcome types in DECISION.md** | Eliminates premature-closure pressure; spike with insufficient evidence can state "DEFERRED" rather than forcing a weak "DECIDED" | Low | Depends on TS-12 | spike-methodology-gap-analysis §7.4 |

---

## Anti-Features

Features to explicitly NOT build in v1.20. Each has a tempting rationale that should be resisted.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| AF-1 | **MCP server for KB query layer** | Over-engineering for 199 entries; adds process management, offline failure mode, per-machine config; problem is not cross-machine access yet (117 signals on apollo are a migration problem, not a live query problem) | Build SQLite + CLI first (TS-7, TS-8); MCP wrapper is ~200 lines once CLI exists — defer to v1.21 when cross-machine access is genuinely needed |
| AF-2 | **Vector embeddings for KB search** | Semantic similarity search is not needed at 199 entries; FTS5 + tag matching covers all current query patterns | Use SQLite FTS5 for full-text search; if embeddings become valuable at scale, Palinode-style sqlite-vec extension is a migration path without storage model change |
| AF-3 | **Signal-to-issue promotion mechanism** | Merges signal (observation) and issue (named problem) concepts prematurely; closing the door on v1.21 ontology design | Reserve `promoted_to` field name in schema; do NOT implement the promotion logic; v1.21 designs the signal/issue/opportunity ontology with full deliberation |
| AF-4 | **Token cost dashboard / pricing table** | Pricing changes frequently; building a pricing table is ongoing maintenance overhead; cost calculation is a presentation concern | Extract token counts; apply pricing table at report time with a static JSON file; flag staleness; borrow ccusage's MIT-licensed pricing data if needed |
| AF-5 | **Automated sensor for telemetry** | Build extraction tooling first; sensor before baselines is infrastructure before problem definition | Ship `gsd-tools telemetry` CLI subcommands; use them manually for baselines; automate in v1.21 once value of specific metrics is validated |
| AF-6 | **Full Lakatos formalization as institutional procedure** | The risk of over-formalization (Feyerabend's critique) is real; rigid progressiveness assessment as a mandatory gate creates compliance without insight | Implement as vocabulary (progressive/degenerating in progressiveness ledger), not as gate; programme declaration is structural, progressiveness assessment is cultural judgment |
| AF-7 | **Same-model spike design reviewer** | A same-model reviewer shares the blind spots of the spike designer; Longino's critique applies — it creates the appearance of review without epistemic benefit | Cross-model review is the minimum for genuine independence; the reviewer MUST use a different model than the designer (Longino §5.2, F02, I09) |
| AF-8 | **Bayesian updating formalism for all spikes** | Binary spikes (does X work?) have binary verdicts that are fine; Bayesian updating is valuable for comparative and exploratory spikes but imposes unnecessary overhead on simple ones | Apply three-level confidence and severity assessment universally; apply Bayesian probability-shift reporting for comparative/exploratory spikes only |
| AF-9 | **Cross-project distribution gap closure** | Non-GSDR projects using global GSD (v1.30.0 upstream) cannot receive GSDR patches; closing this requires upstream coordination | Patch sensor (D-10) detects and reports the gap; resolution is v1.21 scope (automation loop ungating, upstream coordination) |
| AF-10 | **Continental philosophy grounding for KB** | Stiegler, Ricoeur, Bergson, Derrida on memory and retention are the right long-term framework, but applying them now prematurely formalizes concepts that are not yet stable | Signal schema additions (TS-6) should not close ontological doors; explicitly reserve field names for v1.21+ without implementing; v1.22+ for full philosophical grounding |

---

## Feature Dependencies

### Structural dependencies (must be in place before dependent feature)

```
TS-7 (SQLite index rebuild)
  → TS-8 (KB query subcommands)
  → D-2 (KB stats dashboard)
  → D-3 (lifecycle transitions)

TS-6 (signal schema extension)
  → D-3 (lifecycle transitions — needs fields)
  → D-4 (qualified_by links — needs fields)
  → TS-5 (lifecycle wiring — needs lifecycle field)

TS-12 (three-level confidence)
  → TS-13 (design reviewer — needs vocabulary to apply)
  → D-12 (DECIDED/PROVISIONAL/DEFERRED — extends same template)
  → D-5 (findings reviewer — uses confidence framework)

TS-13 (spike design reviewer)
  → D-5 (findings reviewer — parallel gate on exit)
  → D-7 (programme infrastructure — design review is per-spike, programme tracks cross-spike)
  → D-8 (auxiliary register — design reviewer checks it)
```

### Enabling dependencies (feature provides more value when combined)

```
D-1 (telemetry baselines)
  + TS-2 (offer_next gate) — baselines show whether gate reduces wasted sessions
  + D-6 (cross-model review) — baselines measure review's effect on outcome quality
  + D-11 (incident self-signal) — telemetry data triggers the signal

D-6 (cross-model review)
  + TS-13 (spike design reviewer) — cross-model IS the review model; both reinforce each other
  + D-5 (findings reviewer) — findings review uses cross-model as the independence mechanism

D-7 (spike programme)
  + D-4 (qualified_by links) — programme backward propagation uses qualification links
  + TS-12, D-12 (confidence, deferral) — programme tracks provisional decisions over time
```

### Independent (can be built in any order)

```
TS-1 (--merge default) — one-line change, no dependencies
TS-11 (/gsdr:revise-phase-scope) — workflow command, no new infra needed
TS-10 (post-install parity check) — install.js extension, no dependencies
D-9 (parallel execution) — per-worktree state files; depends on existing resolveWorktreeRoot only
D-10 (patch sensor) — extends installer mechanism; can be built standalone
```

---

## Complexity Assessment

| Feature | Implementation Complexity | Epistemic Complexity | Reason |
|---------|--------------------------|---------------------|--------|
| TS-1 | Trivial (one flag) | Low | No design decisions |
| TS-2 | Medium | Low | Workflow modification, clear insertion point |
| TS-3 | Medium | Low | State machine in workflow text |
| TS-4 | Low | Low | CLI check in `resolveWorktreeRoot()` |
| TS-5 | Medium | Low | Reads `resolves_signals` field, updates signal file frontmatter + SQLite |
| TS-6 | Low-Med | Low | Schema addition; backward-compatible; migration is defaults-based |
| TS-7 | Medium | Low | Node.js YAML frontmatter parser → SQLite; well-validated pattern |
| TS-8 | Medium | Low | SQL queries + JSON output formatter |
| TS-9 | High | Medium | Two format adapters; edge cases (subagent sessions, very long sessions); Codex JSONL schema differs significantly |
| TS-10 | Low | Low | Hash comparison in installer post-install step |
| TS-11 | Medium | Low | Workflow command; STATE.md manipulation well-understood |
| TS-12 | Low | HIGH | The epistemic design is substantive; implementation (template edit) is trivial; getting the three levels right requires spike epistemology research absorption |
| TS-13 | High | HIGH | Agent design requires Longino-compatible independence (cross-model); 9 review dimensions; must produce critique documents not pass/fail verdicts |
| D-1 | High | Medium | Session-meta + facets join; phase correlation via STATE.md timestamps; token count reliability validation spike needed |
| D-2 | Low | Low | SQL aggregation queries; output formatting |
| D-3 | Medium | Low | Read/modify/write signal frontmatter YAML; SQLite row update; idempotent |
| D-4 | Low | Medium | Schema field addition; link traversal queries |
| D-5 | High | HIGH | Must assess evidence independently before comparing with designer's claims; cross-model required; protocol adherence checking |
| D-6 | Medium | Medium | Command formalizes existing practice; key design: over-formalization risk (don't kill adaptiveness) |
| D-7 | High | HIGH | Programme declaration, progressiveness ledger, backward propagation, shared assets; Lakatosian design without Popperian rigidity |
| D-8 | Low-Med | HIGH | Template section is trivial; getting the right auxiliary categories requires understanding Duhem-Quine operationalization |
| D-9 | High | Medium | Per-worktree JSON state files; migration from STATE.md; resolveWorktreeRoot routing |
| D-10 | Medium | Low | Hash comparison + classification taxonomy; `gsd-tools distribution-check` subcommand |
| D-11 | Medium | Low | PostToolUse hook on Claude Code; workflow-step advisory on Codex |
| D-12 | Low | Medium | DECISION.md template edit; three outcome types with guidance |

---

## MVP Recommendation

### Tier 1: Must ship (closes audit's top failure patterns, unblocks everything else)

1. **TS-1** — one-line fix, ships first, removes recurring deviation
2. **TS-2 + TS-3** — structural gates at PR/CI point (offer_next gate + continue-here lifecycle)
3. **TS-6** — schema extension; foundational for KB and lifecycle work
4. **TS-7 + TS-8** — SQLite index + queries; foundational for KB health and agent surfacing
5. **TS-5** — lifecycle wiring (resolves_signals → signal state transition); closes R11
6. **TS-12** — three-level confidence; low implementation cost, high epistemic payoff, unlocks TS-13
7. **TS-13** — spike design reviewer; highest-evidence improvement in gap analysis (4 independent sources)

### Tier 2: High value, builds on Tier 1

8. **TS-9** — log sensor cross-runtime adapter (high complexity but enables cross-runtime signal parity)
9. **TS-10 + D-10** — post-install parity check + patch sensor (closes R3 class)
10. **TS-11** — `/gsdr:revise-phase-scope` (highest-impact missing command)
11. **D-2 + D-3** — KB dashboard + lifecycle transitions (low complexity, high visibility)
12. **D-6** — `/gsdr:cross-model-review` (formalize strongest positive pattern)
13. **D-12** — DECIDED/PROVISIONAL/DEFERRED (completes spike DECISION.md overhaul)

### Tier 3: Significant but higher complexity or lower urgency

14. **D-1** — telemetry baselines (high value but needs token count validation spike first)
15. **D-4** — qualification links (schema is ready via TS-6; integration with programme is v1.21)
16. **D-5** — findings reviewer (depends on TS-13 being stable)
17. **D-8** — auxiliary hypothesis register (extends spike DESIGN.md; value proportional to spike volume)
18. **D-9** — parallel execution infrastructure (high complexity; only valuable if parallel phases become regular workflow)
19. **D-11** — incident self-signal hook (medium complexity; hook-dependent, Codex degrades)

### Defer to v1.21

20. **D-7** — spike programme infrastructure (correct architecture; only one project has exercised multi-spike programmes; premature to formalize broadly)

---

## Phase-Specific Research Flags

| Feature Cluster | Likely Needs Phase-Level Research | Reason |
|----------------|-----------------------------------|--------|
| TS-13 (spike design reviewer) | YES | Cross-model invocation mechanism; Longino-compatible prompt design; 9-dimension spec |
| TS-9 (log sensor cross-runtime) | YES | Codex JSONL edge cases (subagent sessions, compacted sessions, very long sessions); format adapter testing |
| D-1 (telemetry baselines) | YES — validation spike first | Token count reliability (suspiciously low values in session-meta); must validate against JSONL aggregation before trusting session-meta as primary source |
| D-7 (spike programmes) | YES | Lakatosian design without institutional over-formalization; progressiveness assessment design |
| D-9 (parallel execution) | MAYBE | Approach 1 (per-worktree state files) is relatively clear; risk is in STATE.md migration compatibility |
| TS-2 (offer_next gate) | NO | Insertion point in execute-phase is clear; enforcement mechanism is workflow text + conditional step |
| TS-7/TS-8 (SQLite KB) | NO | MarkdownDB/Palinode pattern is well-validated; schema is designed in kb-architecture-research.md |
| TS-12 (three-level confidence) | NO | Template edit; vocabulary from spike epistemology research is ready |

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Table stakes identification | HIGH | Grounded in audit findings (R11, 6+ offer_next recurrences, R3), signal data, and codebase inspection |
| Differentiator value | MEDIUM-HIGH | Grounded in arxiv-sanity-mcp spike corpus (4 spikes, 11 gaps, 5 patterns), epistemic-agency findings (F02, I09, F21, F32) |
| Implementation complexity estimates | MEDIUM | Based on codebase inspection; actual complexity emerges during implementation |
| Anti-feature rationale | HIGH | Each anti-feature has specific audit evidence, derived constraint, or philosophical argument |
| Spike epistemology features (TS-12, TS-13, D-5, D-7, D-8) | MEDIUM | Philosophical framework is well-grounded; translation to agentic workflow design has no precedent in literature — these are novel applications |
| Telemetry feature (D-1) | MEDIUM | Schema and tooling design is solid; token count reliability is LOW confidence (needs validation spike) |
| Cross-runtime parity features (TS-9, TS-10, D-10) | MEDIUM-HIGH | Format analysis is thorough; adapter implementation needs testing against edge cases |

---

## Sources

**Audit evidence (direct codebase):**
- `.planning/audits/session-log-audit-2026-04-07/reports/opus-synthesis.md` — 42 findings, 8 clusters
- `.planning/audits/session-log-audit-2026-04-07/reports/positive-opus-synthesis.md` — 35 positive patterns
- `.planning/audits/session-log-audit-2026-04-07/reports/verification-analysis.md` — 13 RECURRED findings
- `.planning/MILESTONE-CONTEXT.md` — working assumptions, derived constraints, open questions

**Custom research (read these for implementation details):**
- `.planning/research/kb-architecture-research.md` — SQLite schema, migration strategy, epistemic-agency findings F21/F32/F37/F46
- `.planning/research/measurement-infrastructure-research.md` — session-meta schema, facets schema, telemetry tooling design, STATE.md conflict resolution
- `.planning/research/cross-runtime-parity-research.md` — capability matrix, Codex JSONL format, patch sensor design, distribution gap approaches
- `.planning/research/spike-epistemology-research.md` — Lakatos/Duhem-Quine/Mayo/Longino/Feyerabend applied to spike design
- `.planning/research/spike-methodology-gap-analysis.md` — 11 gaps from arxiv-sanity-mcp corpus, 5 failure patterns, priority matrix

**Ecosystem validation:**
- MarkdownDB, Palinode, sqlite-memory — file+SQLite pattern validation (kb-architecture-research §1)
- ccusage v17.0.0 — considered and rejected as primary telemetry source (measurement-infrastructure-research §3)
- Epistemic-agency repo — F02, F09, I09, F21, F32, F37 directly applicable (multiple research files)
