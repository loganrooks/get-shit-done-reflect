# Research Summary: v1.20 Signal Infrastructure & Epistemic Rigor

**Project:** GSD Reflect v1.20
**Domain:** Agentic workflow harness — KB infrastructure, spike methodology, measurement tooling, structural enforcement
**Researched:** 2026-04-08
**Confidence:** HIGH (9 research documents, all grounded in codebase evidence and live verification)

---

## Executive Summary

GSD Reflect v1.20 is not a feature expansion — it is an infrastructure correction. The cross-platform session-log audit of 100 sessions produced a single sharp finding: every failed advisory intervention had zero effect on behavior, and the 13 RECURRED findings are recurred precisely because the fixes were text, not structure. The milestone simultaneously addresses three interlocking deficits: (1) a knowledge base that can detect failures but cannot query them relationally, track their remediation, or link them to experimental evidence; (2) a spike workflow that prescribes methodological rigor but has no mechanism to enforce it, producing patterns of self-aware failure documented across 4 spikes in arxiv-sanity-mcp; and (3) a measurement gap so complete that there are no baselines against which any intervention's effect can be observed.

The recommended approach treats these three deficits as a dependency chain rather than independent workstreams. The KB infrastructure (File + SQLite index via node:sqlite built-in) and signal schema extensions must come first because they are the foundation for lifecycle tracking and agent query capability. Structural workflow gates (offer_next PR/CI enforcement, .continue-here lifecycle, quick task branch detection) are the highest-urgency fixes because they address the most-recurred failure patterns. Spike methodology overhaul — centered on a cross-model design reviewer, three-level confidence framework, and DECIDED/PROVISIONAL/DEFERRED outcome types derived from Lakatos/Duhem-Quine/Mayo — addresses the experimental infrastructure needed for evidence-grounded improvement. Measurement infrastructure (telemetry baselines from 268 session-meta files + 109 facets files) must be computed before any v1.20 intervention is deployed, to preserve the ability to attribute changes to specific interventions.

The three primary risks are: (1) over-formalization of productive informal practices, specifically cross-model review — the audit's single strongest positive pattern — which must remain opt-in and flexible or usage drops; (2) the SQLite index treated as source of truth rather than derived cache, repeating the KB data loss incident from sig-2026-02-11; (3) the token count reliability problem in session-meta (observed value of 109 input tokens for a 23-message/84-assistant-message session is implausibly low), which must be validated against JSONL-aggregated counts before baselines are trusted. MILESTONE-CONTEXT.md includes spike programme infrastructure in scope while FEATURES.md recommends deferring D-7 to v1.21 — this is a genuine tension that needs resolution during roadmap planning based on capacity.

---

## Key Findings

### Recommended Stack

The v1.20 stack requires zero new npm dependencies. The critical unlock is node:sqlite — a Node.js built-in added in v22.5.0 that provides synchronous SQLite access with FTS5 support, matching the existing gsd-tools.cjs synchronous execution model exactly. Both primary machines (Dionysus: Node 22.22.1, Apollo: expected LTS 22+) satisfy the constraint. The package.json engines.node field must be updated from >=16.7.0 to >=22.5.0. node:sqlite was live-tested on Dionysus: FTS5 virtual tables, prepared statement API (all(), get(), iterate(), run()), and transaction execution via db.exec('BEGIN; ...; COMMIT;') all confirmed working. The only visible artifact is an ExperimentalWarning on stderr (suppressed with --no-warnings; does not affect stdout JSON output).

**Core technologies:**
- node:sqlite (Node.js built-in, >=22.5.0): SQLite KB index + Codex state_5.sqlite queries — zero npm dependency, synchronous API, FTS5 confirmed
- node:fs, node:path, node:os, node:crypto (built-ins): telemetry module, patch sensor, cross-runtime adapters — already used throughout gsd-tools.cjs
- Markdown + YAML frontmatter (no change): signal files remain source of truth; SQLite is derived cache
- Inline JSONL parsing (split/filter/map): Codex session log parsing — no library needed

**What NOT to add:** better-sqlite3 (native compilation), ccusage (reads different data paths, no GSD phase correlation), js-yaml (existing frontmatter.cjs sufficient), Python dependency in npm package.

### Expected Features

**Must have (table stakes — closes audit's top RECURRED findings):**
- TS-1: --merge as default PR merge strategy (one-line fix)
- TS-2/TS-3: offer_next PR/CI gate (structural) + .continue-here consumption lifecycle
- TS-4: Quick task branch detection in runtime code
- TS-5: Signal lifecycle state machine wired to workflows (reads resolves_signals from completed plans)
- TS-6: Signal schema extensions (lifecycle, disposition, qualified_by, superseded_by, polarity:mixed, remediation)
- TS-7/TS-8: gsd-tools kb rebuild (SQLite index) + gsd-tools kb query
- TS-9: Log sensor cross-runtime adapter (Codex JSONL format, state_5.sqlite session discovery)
- TS-10: Post-install cross-runtime parity verification
- TS-11: /gsdr:revise-phase-scope command (highest-impact missing command N02)
- TS-12: Three-level confidence framework (measurement/interpretation/extrapolation)
- TS-13: Spike design reviewer agent (cross-model mandatory; critique document not pass/fail verdict)

**Should have (differentiators):**
- D-1: gsd-tools telemetry subcommand family (needs token count validation spike first)
- D-2/D-3: gsd-tools kb stats dashboard + kb transition lifecycle commands
- D-4: Signal qualified_by/superseded_by link traversal
- D-5: Spike findings reviewer agent (depends on TS-13 stable)
- D-6: /gsdr:cross-model-review command (opt-in, flexible — must not be over-formalized)
- D-8: Auxiliary hypothesis register in DESIGN.md template
- D-10: Patch sensor / gsd-tools distribution-check
- D-12: DECIDED/PROVISIONAL/DEFERRED outcome types in DECISION.md

**Defer to v1.21:**
- D-7: Spike programme infrastructure (Lakatosian research programme concept — correct architecture, premature to formalize broadly)
- D-9: Parallel execution infrastructure (only valuable when parallel phases are a regular workflow)
- Signal-to-issue promotion mechanism
- MCP server for KB (CLI-first validates query API; MCP wrapper is ~200 lines once CLI exists)
- Automated telemetry sensor

**Anti-features (explicitly excluded):** Vector embeddings for KB, token cost dashboard, same-model spike design reviewer, mandatory severity thresholds, continental philosophy memory grounding (v1.22+).

### Architecture Approach

The v1.20 architecture adds four capability domains to the existing 5-layer system (Command → Workflow → Agent → CLI modules → Knowledge Store) without changing the layer structure. New CLI modules (kb.cjs, telemetry.cjs) follow the established pattern exactly. The critical architectural invariant: SQLite is a derived cache (kb.db in .gitignore, reconstructable from .md files at any time). Every write operation that touches signal lifecycle state must update BOTH the .md frontmatter AND the SQLite row atomically.

**Major components:**
1. lib/kb.cjs — SQLite index: rebuild, query, stats, health, transition, link, search; new case 'kb': in gsd-tools.cjs router
2. lib/telemetry.cjs — session-meta + facets extraction; joins 268 session-meta with 109 facets by session_id; filters by project via resolveWorktreeRoot(); produces .planning/baseline.json
3. agents/gsd-spike-design-reviewer.md — cross-model reviewer invoked between DESIGN.md completion and execution; produces CRITIQUE.md; designer responds (accept/acknowledge/dispute all valid)
4. agents/gsd-log-sensor.md (modified) — runtime adapter layer: Claude Code via encoded path, Codex via state_5.sqlite; normalized fingerprint schema after adapter stage
5. agents/gsd-patch-sensor.md — two-layer divergence detection: source-vs-installed (installer manifest) and cross-runtime installed comparison
6. Signal lifecycle wiring in collect-signals.md — reads resolves_signals from completed plans, calls gsd-tools kb transition
7. execute-phase.md modifications — offer_next gate structural, .continue-here lifecycle enforced, quick task branch detection
8. bin/install.js modification — checkCrossRuntimeParity() after successful install

**Build order:** Phase A (schema + SQLite + telemetry) → Phase B (lifecycle wiring + workflow gates) → Phase C (log sensor + spike reviewer + patch sensor) → Phase D (workflow commands) → Phase E (parallel execution, separately gated).

### Critical Pitfalls

1. **C1: SQLite index treated as source of truth** — dual-write invariant: every kb transition updates both .md frontmatter AND SQLite row; kb.db in .gitignore immediately; add roundtrip write test. KB data loss incident (sig-2026-02-11) is the direct historical precedent.

2. **C2: Lifecycle wiring silently does nothing** — resolves_signals plan field has existed since Phase 34 and has never been read by anything; write an end-to-end integration test before shipping; run gsd-tools kb stats after phase to verify signals advanced from detected.

3. **C3: Token count reliability used without validation** — 109 input_tokens for a 23-message/84-assistant-message session is implausibly low; validate against JSONL-aggregated counts for same sessions before any baseline is committed.

4. **C4: Hook-dependent features silently degrade on Codex** — Codex CLI v0.118.0 has no hook mechanism (confirmed by direct inspection); every hook-dependent feature must specify its Codex degradation path before implementation begins.

5. **C5: Spike design reviewer becomes a checklist agent** — must produce a critique document, use a different model from the designer, have METHODOLOGY.md lenses as context; if DECISION.md quality does not improve post-introduction, the reviewer is a rubber stamp.

6. **C6: Over-formalization kills cross-model review** — the audit's single strongest positive pattern; /gsdr:cross-model-review must remain opt-in and flexible; monitor invocation frequency post-formalization.

---

## Implications for Roadmap

### Tensions to Resolve Before Finalization

**Tension 1: Spike programme infrastructure scope**
MILESTONE-CONTEXT.md includes D-7 in v1.20 scope. FEATURES.md recommends deferral: only one project has exercised multi-spike programmes. If included, it belongs in a late phase with optional-scaffolding framing. Needs explicit roadmap decision.

**Tension 2: Telemetry baseline sequencing**
ARCHITECTURE.md anti-pattern 4 is unambiguous: baseline must precede intervention deployment. This means telemetry CLI tools ship in Phase 1 (earliest) so baseline.json is committed before Phase 2 structural gates go live.

**Tension 3: Parallel execution priority**
MILESTONE-CONTEXT.md marks D-9 in scope. FEATURES.md rates it Tier 3. Resolved by making Phase 6 separately gated — not scheduled automatically, only triggered when parallel execution becomes a regular workflow pattern.

### Phase 1: Foundation Infrastructure
**Rationale:** Everything depends on this. Schema extensions enable lifecycle wiring. SQLite index enables relational queries and transitions. Telemetry CLI must ship here to capture baseline before structural changes are deployed.
**Delivers:** lib/kb.cjs (rebuild, query, stats, health, transition, link, search), lib/telemetry.cjs (summary, session, phase, baseline, enrich), signal schema extensions, .planning/baseline.json, kb.db alongside index.md, updated knowledge-surfacing.md
**Addresses:** TS-5, TS-6, TS-7, TS-8, D-1, D-2, D-3
**Avoids:** C1 (dual-write invariant established), C3 (token validation spike runs before baselines committed), N5 (source field ambiguity resolved before SQLite schema finalized), N1 (kb.db gitignored immediately)
**Research flag:** D-1 requires token count validation spike before baselines committed; internal Phase 1 gate, not a phase blocker

### Phase 2: Structural Workflow Gates
**Rationale:** Highest-urgency RECURRED failure pattern fixes. All are workflow-text changes with no new module dependencies. Ship as a cohesive batch targeting the execute-phase/resume-work postlude chain.
**Delivers:** execute-phase.md with offer_next PR/CI structural gate and quick task branch detection, resume-work.md with .continue-here consumption lifecycle, --merge default (one-line fix), checkCrossRuntimeParity() in bin/install.js
**Addresses:** TS-1, TS-2, TS-3, TS-4, TS-10
**Avoids:** C4 (each gate specifies Codex degradation path before implementation)
**Research flag:** NONE — insertion points clear; Codex degradation paths documented in cross-runtime-parity-research.md

### Phase 3: Sensor Pipeline and Cross-Runtime Adaptation
**Rationale:** Mid-complexity independent workstreams. Log sensor adapter and patch sensor both follow existing sensor contract. TS-9 is the largest single engineering effort in the milestone.
**Delivers:** gsd-log-sensor.md with Codex adapter (state_5.sqlite discovery, message extraction, normalized fingerprint schema), gsd-patch-sensor.md (source-vs-installed + cross-runtime comparison), gsd-tools distribution-check subcommand
**Addresses:** TS-9, D-10
**Avoids:** C4 (log sensor adapter defines Codex sensing path), M6 (patch sensor scope documented: in-project only; cross-project gap is v1.21)
**Research flag:** TS-9 LIKELY NEEDS PHASE-LEVEL RESEARCH — Codex JSONL edge cases (subagent sessions, compacted sessions, very long sessions) require testing; format adapter completeness for Codex-specific fields not fully validated

### Phase 4: Spike Methodology Overhaul
**Rationale:** Three-level confidence vocabulary (TS-12) is logically prior to design reviewer (TS-13), findings reviewer (D-5), and auxiliary register (D-8). Design reviewer must be designed correctly to avoid checklist theater. Cross-model review command can be built in parallel.
**Delivers:** agents/gsd-spike-design-reviewer.md (cross-model, critique document, three-tier enforcement), updated run-spike.md (design reviewer as mandatory gate), DESIGN.md template with auxiliary hypothesis register, DECISION.md template with decided/provisional/deferred and three-level confidence, /gsdr:cross-model-review command (opt-in, flexible)
**Addresses:** TS-12, TS-13, D-6, D-8, D-12
**Avoids:** C5 (reviewer produces critique not checklist), C6 (cross-model-review remains opt-in), M4 (programme infrastructure is optional scaffolding), M5 (deferred outcome type requires specification of what question and what investigation)
**Research flag:** TS-13 NEEDS PHASE-LEVEL RESEARCH — cross-model invocation mechanism, Longino-compatible prompt design, how to prevent 9-dimension spec from collapsing into a checklist; SPIKE-DESIGN-REVIEW-SPEC.md from arxiv-sanity-mcp is the starting point

### Phase 5: Workflow Commands and KB Enrichment
**Rationale:** Quick wins that should not be blocked. /gsdr:revise-phase-scope is pure workflow with no module dependencies. Signal qualification links are schema-ready after Phase 1. Findings reviewer depends on TS-13 stable.
**Delivers:** /gsdr:revise-phase-scope command, signal qualified_by/superseded_by link traversal queries, spike findings reviewer agent (if TS-13 validated)
**Addresses:** TS-11, D-4, D-5
**Research flag:** D-5 NEEDS PHASE-LEVEL RESEARCH — findings reviewer must assess evidence before seeing designer's claims; cross-model dispatch; protocol adherence verification

### Phase 6: Parallel Execution Infrastructure (Separately Gated)
**Rationale:** Only needed when parallel phase execution becomes regular. Gate on actual need. Per-worktree state file approach uses existing resolveWorktreeRoot() and atomicWriteJson() — engineering is straightforward once the decision is made.
**Delivers:** Per-worktree state files (state/{worktree-name}.json), writeStateMd() routing via resolveWorktreeRoot(), gsd-tools state json composite view
**Addresses:** D-9
**Avoids:** M1 (locking is explicitly the wrong approach; per-worktree files are correct)
**Research flag:** MAYBE — Approach 1 design is clear; risk is in STATE.md migration compatibility

### Phase Ordering Rationale

- Phase 1 must precede all others — schema extensions and SQLite index are foundational
- Phase 1 must capture baseline.json before Phase 2 ships — ARCHITECTURE.md anti-pattern 4 constraint
- Phases 3 and 4 can proceed in parallel after Phase 2 — independent workstreams
- Phase 5 is a catch-up phase; some items may ship earlier if capacity allows
- Phase 6 is independently gated; do not schedule automatically

### Research Flags

Phases needing deeper research:
- **Phase 3 (log sensor adapter):** Codex JSONL edge cases need testing against real files
- **Phase 4 (spike design reviewer):** Cross-model invocation mechanism, Longino-compatible prompt design
- **Phase 5 (spike findings reviewer):** Evidence-before-claims independence, cross-model dispatch pattern

Phases with standard patterns (research not needed):
- **Phase 1 (SQLite KB):** MarkdownDB/Palinode pattern well-validated; node:sqlite API verified on target machine
- **Phase 2 (workflow gates):** Insertion points clear; Codex degradation paths fully documented
- **Phase 6 (parallel execution):** Approach 1 design clear from measurement-infrastructure-research.md

---

## Consensus Findings Across All Research Documents

| Finding | Sources |
|---------|---------|
| Advisory text consistently fails; structural enforcement required | FEATURES.md, PITFALLS.md, spike-methodology-gap-analysis.md, MILESTONE-CONTEXT.md |
| Cross-model review is structurally necessary (F02: self-evaluation degenerates under shared noise) | FEATURES.md, spike-epistemology-research.md, PITFALLS.md, ARCHITECTURE.md |
| Three-level confidence framework independently derived in 3 sources | FEATURES.md, spike-methodology-gap-analysis.md, spike-epistemology-research.md |
| SQLite + files (not MCP server) is the right KB architecture for v1.20 | kb-architecture-research.md, STACK.md, ARCHITECTURE.md, FEATURES.md, PITFALLS.md |
| Telemetry baseline must precede intervention deployment | measurement-infrastructure-research.md, ARCHITECTURE.md, PITFALLS.md |
| resolves_signals plan field has existed since Phase 34 and has never been read by anything | kb-architecture-research.md, ARCHITECTURE.md, PITFALLS.md, MILESTONE-CONTEXT.md |
| Codex CLI v0.118.0 has no hook mechanism; hook-dependent features need degradation paths | cross-runtime-parity-research.md, FEATURES.md, PITFALLS.md |
| Over-formalization of cross-model review is a specific named risk | PITFALLS.md (C6), FEATURES.md (AF-6), ARCHITECTURE.md, spike-epistemology-research.md |
| Session-meta token counts suspect; validation spike required before use | measurement-infrastructure-research.md, STACK.md, PITFALLS.md (C3) |
| source field ambiguity must be resolved before SQLite schema is finalized | kb-architecture-research.md, PITFALLS.md (N5) |

---

## Disagreements and Tensions

| Tension | Position A | Position B | Resolution |
|---------|-----------|-----------|------------|
| Spike programme (D-7) scope | MILESTONE-CONTEXT.md: in scope | FEATURES.md: defer to v1.21 | Roadmap decision needed; if included, mark as optional scaffolding in late phase |
| Telemetry D-1 timing | FEATURES.md: Tier 3 | ARCHITECTURE.md: baseline must precede all other interventions | Build telemetry CLI in Phase 1 for baseline capture; defer automated sensor to v1.21 |
| Parallel execution (D-9) | MILESTONE-CONTEXT.md: in scope | FEATURES.md: Tier 3, only valuable if parallel is regular | Phase 6 separately gated; not automatically scheduled |
| Spike findings reviewer (D-5) timing | FEATURES.md: depends on TS-13 stable | ARCHITECTURE.md: Phase D | Phase 5, with explicit gate: TS-13 must be validated first |

---

## Open Questions Needing Resolution

1. **Token count validation (pre-Phase 1 spike):** Are session-meta input_tokens post-caching residuals or gross counts? Compare 5 sessions against JSONL-aggregated counts. Determines primary vs supplementary source for baselines.

2. **Cross-model invocation mechanism (pre-Phase 4):** How does run-spike.md dispatch the design reviewer to a different model? Via agent frontmatter model spec, explicit workflow step naming the model, or separate codex exec / claude -p invocation?

3. **Spike programme scope decision:** Include D-7 in v1.20 or defer to v1.21? Needs explicit roadmap decision.

4. **node:sqlite ExperimentalWarning in hook context:** Does --no-warnings need to be added to every hook script node invocation? Check whether any hook script processes stderr output.

5. **Apollo Node.js version:** Confirmed 22.22.1 on Dionysus; Apollo assumed LTS 22+ but not directly verified. Confirm before updating package.json engines constraint.

6. **source field backward-compatibility:** Resolving source -> detection_method + origin is a schema breaking change for 198 existing signal files. Confirm migration strategy handles all existing values without data loss.

7. **Bridge file / spike E dependency:** If bridge file extension (cost/rate-limit fields in statusline) is in v1.20 scope, spike E needs explicit scheduling.

---

## Beyond Formal Scope (for Future Milestones)

**For v1.21:**
- Codex state_5.sqlite as cross-project session analysis source; cross-session aggregate token baselines
- Codex history.jsonl as cross-session user message pattern source (unique: Claude Code lacks equivalent)
- Reflection pipeline activation: 198 signals, 0 lessons; reflection engine exists but never runs; F21 (dual memory) identifies this as the highest-impact unbuilt improvement
- Facets data correlation analysis: join facets outcome with session-meta features to answer "what metrics predict quality?"
- Palinode-style hybrid search (BM25 + sqlite-vec with RRF) as migration path from FTS5 at scale
- Codex memories vs Claude Code MEMORY.md divergence as shadow knowledge layer problem

**For v1.22+:**
- Continental philosophy grounding for KB (Stiegler, Ricoeur, Bergson, Derrida)
- Kuhn normal vs revolutionary spike type distinction
- Agentic memory systems literature survey via arxiv-sanity-mcp infrastructure

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack (node:sqlite, module patterns) | HIGH | Live-tested on Dionysus; integration points verified; zero new npm dependencies |
| Features (table stakes) | HIGH | Grounded in audit findings (R11, 6+ offer_next recurrences, R3), signal data, codebase |
| Features (differentiators) | MEDIUM-HIGH | Grounded in arxiv-sanity-mcp spike corpus, epistemic-agency findings |
| Architecture (build order, integration) | HIGH | All components read; custom research fully ingested; integration points verified |
| Architecture (spike design reviewer quality) | MEDIUM-HIGH | 4 independent sources; agent implementation details need Phase 4 validation |
| Pitfalls (critical C1-C6) | HIGH | Each grounded in historical precedent or direct inspection |
| Cross-runtime format analysis | HIGH | Direct parsing of actual JSONL files from both runtimes; state_5.sqlite schema confirmed |
| Cross-runtime extraction edge cases | MEDIUM | Format analysis solid; code needs testing against subagent/compacted sessions |
| Telemetry (session-meta schema) | HIGH | Documented from actual files, 2 samples compared |
| Telemetry (token count reliability) | LOW | Suspiciously low values; validation spike required |
| Spike epistemology (philosophical framework) | MEDIUM-HIGH | Framework well-grounded in primary sources; translation to agentic workflow design is novel |

**Overall confidence:** HIGH for what to build and in what order; MEDIUM for implementation details of high-complexity components (TS-9, TS-13).

### Gaps to Address

- **Token count reliability:** Validation spike before Phase 1 baselines committed
- **Cross-model invocation mechanism:** Architectural decision needed before Phase 4
- **Spike programme scope:** Roadmap-level decision (D-7 in v1.20 or v1.21)
- **Apollo Node version:** Quick verification before package.json engines constraint update
- **Bridge file / spike E dependency:** Schedule spike E if bridge file extension is in scope
- **Log sensor edge cases:** Subagent sessions, compacted sessions, very long sessions — test against real Codex files

---

## Sources

### Primary (HIGH confidence)

- `.planning/research/kb-architecture-research.md` — SQLite architecture, schema evolution, F21/F32/F37/F46
- `.planning/research/measurement-infrastructure-research.md` — session-meta/facets schema, telemetry tooling, STATE.md conflict approaches
- `.planning/research/cross-runtime-parity-research.md` — capability matrix, log sensor adapter, patch sensor, Codex SQLite schema
- `.planning/research/spike-methodology-gap-analysis.md` — 11 gaps, 5 patterns from arxiv-sanity-mcp 4-spike corpus
- `.planning/research/spike-epistemology-research.md` — Lakatos/Duhem-Quine/Mayo/Longino/Feyerabend applied; three-tier enforcement model
- `.planning/research/STACK.md` — node:sqlite live verification, Node version constraints, module architecture
- `.planning/research/FEATURES.md` — table stakes/differentiator classification, MVP tiers, anti-features
- `.planning/research/ARCHITECTURE.md` — component inventory, build order, data flow changes, anti-patterns
- `.planning/research/PITFALLS.md` — 6 critical pitfalls, 7 moderate pitfalls, phase-specific warnings
- `.planning/MILESTONE-CONTEXT.md` — working assumptions, derived constraints, open questions, scope boundaries

### Secondary (MEDIUM-HIGH confidence)

- Node.js 22 sqlite docs — experimental built-in, stable behavior on 22.22.1
- MarkdownDB (github.com/datopian/markdowndb) — file+SQLite pattern validation
- Palinode (github.com/Paul-Kyle/palinode) — git-native memory with SQLite-vec + FTS5
- sqlite-memory (github.com/sqliteai/sqlite-memory) — Markdown-based AI agent memory
- Epistemic-agency repo — F02, F09, I09, F21, F32, F37, F46 directly applicable

### Tertiary (referenced, not directly verified)

- Lakatos: via SEP, Rubin 2024 secondary sources
- Mayo: via NDPR review, error statistics papers
- Duhem-Quine: via SEP, Fairfield ch.5
- Longino: primary texts, secondary application

---

*Research completed: 2026-04-08*
*Ready for roadmap: yes*
