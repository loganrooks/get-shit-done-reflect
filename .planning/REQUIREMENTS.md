# Requirements: GSD Reflect v1.20

**Defined:** 2026-04-08
**Core Value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

**Evidence base:** Cross-platform session log audit (100 sessions, 165 findings, 13 RECURRED), spike methodology gap analysis (11 gaps, 5 failure patterns), 9 research documents, pre-v1.20 deliberation (11 threads), upstream drift survey (304 commits, v1.30->v1.34.2).

**Milestone thesis:** v1.20 is a major infrastructure and methodology milestone -- replacing advisory quality controls with structural enforcement, building a queryable knowledge base, overhauling spike methodology with epistemological rigor, and establishing measurement infrastructure for evidence-based workflow improvement.

**Cross-runtime note:** Structural enforcement requirements must declare per-gate substrate and per-gate Codex behavior. The old blanket assumption that "Codex has no hook mechanism" is stale; Claude Code hook surfaces are mature, and Codex hook support exists behind evolving `codex_hooks` surfaces. Hook-dependent requirements therefore must either (a) ship installer-wired Codex hook support, (b) degrade to a named workflow/CI gate, or (c) be explicitly waived with reason in phase CONTEXT and verification artifacts. Phase 57.9 owns closure of the unresolved hook / closeout substrate gap; downstream live incident consumption remains separate downstream work.

**Design constraint (SPIKE-11, moved from requirements):** Spike methodology must engage with Lakatos (progressive vs degenerating research programmes), Duhem-Quine (auxiliary hypotheses, holism of testing), Mayo (severity of testing), and institutional critique (three-tier enforce/encourage/warn -- Feyerabend/Longino). This is a governing design principle for SPIKE-01 through SPIKE-10, not a separate deliverable. See `.planning/research/spike-epistemology-research.md` and MILESTONE-CONTEXT.md for the full framework.

## v1.20 Requirements

### Governance

- [ ] **GOV-01**: Investigation requirements (research-gated, spike-gated, or otherwise scoped as exploratory) carry an **extraction contract** — findings must be converted into declarative child requirements before the parent requirement is marked satisfied. A produced artifact alone (research document, spike DECISION.md) does not close an investigation requirement. Parent requirement text names the extraction deliverable explicitly: "produces artifact X AND child requirements Y.1, Y.2, ... added to REQUIREMENTS.md before planning proceeds." Planning of downstream work that depends on investigation findings blocks until child requirements exist or the parent is explicitly deferred with a named follow-up phase
  - *Motivation:* `pattern: investigation-without-closure -- research/spike requirements produce artifacts that get cited but do not reliably update REQUIREMENTS.md; scope-narrowing cascades discovered by Phase 57 vision-drop audit are one manifestation` | `precedent: GATE-09 scope-translation ledger catches the same failure mode for CONTEXT claims; GOV-01 extends the principle to investigation outputs` | `deliberation-worthy` -- first codification of investigation-to-requirement closure as a framework constraint

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

Dependencies: KB-09 -> KB-04a -> KB-04b/KB-04c/KB-04d -> KB-06a/KB-06b -> KB-07 -> KB-08

- [x] **KB-01**: Signal schema supports lifecycle states (detected -> triaged -> blocked -> remediated -> verified -> invalidated) with transition validation. `blocked` is an optional holding state between triaged and remediated; all other states follow the Phase 31 model
  - *Motivation:* `signal: sig-2026-03-04-signal-lifecycle-representation-gap` | `pattern: R11 -- 0% remediation rate, 171/187 stuck in active`
- [x] **KB-02**: Signal schema supports polarity (negative/positive/mixed) and response disposition (fix/formalize/monitor/investigate)
  - *Motivation:* `pattern: 35 positive patterns unrecordable in current schema` | `deliberation: Thread 1 signal/issue ontology -- anticipate future promotion without closing doors`
- [x] **KB-03**: Signal schema supports qualification links (qualified_by, superseded_by) for cross-signal and cross-spike references
  - *Motivation:* `research: spike-methodology-gap-analysis.md Gap 2.5 -- 2 retracted, 7 qualified claims required manual cross-spike report`
- [ ] **KB-04a**: SQLite index built from signal files via node:sqlite with `gsd-tools kb rebuild` -- schema includes all frontmatter fields, kb.db gitignored, rebuildable from files
  - *Motivation:* `research: kb-architecture-research.md -- file+SQLite validated by 3 open-source precedents (MarkdownDB, Palinode, sqlite-memory)`
  - *Dependencies:* KB-09 (migration must complete before index build)
- [x] **KB-04b**: FTS5 full-text search across signal content and lifecycle state queries via `gsd-tools kb query/search`
  - *Motivation:* `research: kb-architecture-research.md -- FTS5 confirmed working on Dionysus via node:sqlite`
  - *Dependencies:* KB-04a
  - *Closed by:* Phase 59 Plan 02 (`kb query` + `kb search` with FTS5 external-content contentless rewrite; Plan 01 substrate)
- [x] **KB-04c**: Relationship traversal exposes both outbound and inbound edges via an explicit read surface (`gsd-tools kb link show --outbound/--inbound` or equivalent), with traversal semantics named for the current edge vocabulary instead of relying on source-file frontmatter alone
  - *Motivation:* `research: spike-methodology-gap-analysis.md -- cross-spike qualification requires navigable links` | `audit: 2026-04-20-phase-59-kb-architecture-gap-audit Finding A4 / Recommendation 7.1.2`
  - *Dependencies:* KB-04a, KB-03
  - *Closed by:* Phase 59 Plan 02 (`kb link show` read-only traversal + idx_signal_links_target from Plan 01)
- [x] **KB-04d**: `kb rebuild` reports edge integrity for the live corpus — counts by link_type, counts whose targets resolve to known artifacts, counts of orphaned targets, and hard failure on malformed targets after migration. One-time repair migration cleans existing malformed edge targets before the gate is declared complete
  - *Motivation:* `audit: 2026-04-20-phase-59-kb-architecture-gap-audit Finding A1 / Recommendation 7.1.1 + 7.1.4`
  - *Dependencies:* KB-04a, KB-03
  - *Closed by:* Phase 59 Plan 01 (`kb rebuild` edge-integrity report + `kb repair --malformed-targets` verb; 107 live malformed edges cleaned)
- [x] **KB-05**: SQLite index is a derived cache -- files remain source of truth, dual-write invariant enforced on every lifecycle transition, kb.db gitignored, rebuildable from files at any time
  - *Motivation:* `signal: sig-2026-02-11-kb-data-loss-migration-gap -- direct historical precedent for cache-as-truth failure` | `research: PITFALLS.md C1`
  - *Note:* `~/.gsd/knowledge/` now houses both fork's subdirectory-based epistemic artifacts and upstream's flat JSON learnings -- document coexistence in implementation
- [x] **KB-06a**: `gsd-tools kb` read operations: query, search, stats, health, rebuild, and read-only link surfacing. `kb health` has a concrete contract: edge integrity, lifecycle-vs-plan consistency, dual-write status, and `depends_on` freshness summary
  - *Motivation:* `research: kb-architecture-research.md -- CLI-first validates query API; MCP wrapper deferred to v1.21`
  - *Closed by:* Phase 59 Plans 02+03 (read surface + four-check `kb health` watchdog with exit-code bitmask)
- [x] **KB-06b**: `gsd-tools kb` write operations are verb-disambiguated (`transition`, `link create`, `link delete`, or equivalent) rather than overloading one `link` verb for both traversal and mutation. Dual-write invariant remains enforced per KB-05 on every mutating path
  - *Motivation:* `research: PITFALLS.md C1 -- write operations have data integrity risk; read operations do not` | `audit: 2026-04-20-phase-59-kb-architecture-gap-audit Finding F1 / Recommendation 7.1.3`
  - *Dependencies:* KB-05 (invariant must be established before write ops ship)
  - *Closed by:* Phase 59 Plan 04 (`kb transition` + `kb link create/delete` with BEGIN IMMEDIATE dual-write + .bak sidecar rollback)
- [x] **KB-07**: Signal lifecycle wiring completes the v1.16 `resolves_signals` feature -- collect-signals reads resolves_signals from completed plan frontmatter and auto-transitions matching signals to remediated. The phase must explicitly reconcile this path with the existing `reconcile-signal-lifecycle.sh` fallback (replace, complement, or deprecate) rather than letting both paths drift independently
  - *Motivation:* `research: PITFALLS.md C2 -- resolves_signals has existed since Phase 34 and has never been read by anything` | `deliberation: signal-lifecycle-closed-loop-gap.md` | `audit: 2026-04-20-phase-59-kb-architecture-gap-audit Finding B1 / Recommendation 7.1.6`
  - *Dependencies:* KB-06b (transition command must exist)
  - *Closed by:* Phase 59 Plan 04 (collect-signals `reconcile_signal_lifecycle` step + bash reconcile deprecated with Linux guard + v1.21 sunset)
- [x] **KB-08**: KB surfacing in research/planning agents uses SQLite queries instead of grep-through-index for relevant signal/spike/reflection retrieval, and the surfacing protocol fetches inbound edge context alongside outbound links when available. Graceful fallback to grep when kb.db does not exist (fresh clone, first run)
  - *Motivation:* `research: ARCHITECTURE.md -- knowledge-surfacing.md updated to use kb query for structured retrieval` | `audit: 2026-04-20-phase-59-kb-architecture-gap-audit Findings C2 + A4 / Recommendation 7.1.2 + 7.1.5`
  - *Dependencies:* KB-04b
  - *Closed by:* Phase 59 Plan 05 (knowledge-surfacing.md v2.0.0 rewrite; structural inbound-edge fetch via `kb link show --inbound`; grep fallback documented as fresh-clone degraded path)
- [x] **KB-09**: Existing signal files parse successfully with new schema. `source` field resolved to `detection_method` + `origin`. `kb rebuild` on the current live corpus succeeds without data loss (198 signals at original closeout; 267 as of 2026-04-20; re-verify against live count at implementation time). Migration script provided for one-time field resolution
  - *Motivation:* `research: PITFALLS.md N5 -- source field ambiguity must be resolved before SQLite schema finalized`
  - *Dependencies:* KB-01, KB-02, KB-03 (schema must be defined before migration)
- [x] **KB-10**: `kb rebuild` and all query operations succeed against the current live corpus without file modification. New schema fields (lifecycle, polarity, disposition, qualified_by, superseded_by) default gracefully when absent from existing files, and corpus-drift re-verification is rerun against the live signal count at implementation time
  - *Motivation:* `review: R8 -- no backward compatibility testing requirement existed`
- [x] **KB-11**: package.json engines.node updated to >=22.5.0. `kb.cjs` includes version guard with actionable error message on older Node versions. CHANGELOG documents the breaking change
  - *Motivation:* `review: R7 -- node:sqlite requires Node 22.5+, changing from >=16.7.0 is a breaking change`

#### Deferred KB Architecture Extensions

- [ ] **KB-12**: Edge-as-entity model — edges become first-class knowledge entries (for example under `.planning/knowledge/edges/`) with source_kind/target_kind/link_subtype, rationale, confidence, author/at provenance, and lifecycle. Current `signal_links` becomes a derived projection with a migration path from node-frontmatter edge fields
  - *Motivation:* `audit: 2026-04-20-phase-59-kb-architecture-gap-audit §3.2 + §7.2 -- principled fix for one-way relation / immutable-node tension`
- [ ] **KB-13**: Retrieval attribution — KB entries record programmatic retrieval events (`retrieval_count`, `last_retrieved`, or equivalent) from a `kb surfaced` path rather than agent self-report. Future telemetry integration can join these retrieval events to plan/phase outcomes
  - *Motivation:* `audit: 2026-04-20-phase-59-kb-architecture-gap-audit Finding D1 / Recommendation 7.2`
- [ ] **KB-14**: Non-signal artifact indexing — deliberations, audits, and reflections are indexed as first-class KB entries with cross-type edges rather than remaining grep-only peers outside the SQLite surface
  - *Motivation:* `audit: 2026-04-20-phase-59-kb-architecture-gap-audit Findings C1 + 4.4 / Recommendation 7.2`
- [ ] **KB-15**: Federation substrate — schema and CLI preserve room for cross-project / cross-machine knowledge sharing by distinguishing local vs imported origin and carrying KB origin metadata in the storage layer
  - *Motivation:* `audit: 2026-04-20-phase-59-kb-architecture-gap-audit Finding E1 / Recommendation 7.2`
- [ ] **KB-16**: Edge vocabulary extension — current link semantics grow beyond the minimal set into richer relation kinds / qualifiers with explicit shallow-vs-transitive traversal rules
  - *Motivation:* `audit: 2026-04-20-phase-59-kb-architecture-gap-audit §5.2 + §5.3 / Recommendation 7.2`
- [ ] **KB-17**: Contested / under-review signal state — the KB can represent challenged signals before they are remediated or invalidated, either as an explicit lifecycle state or via the KB-12 edge-as-entity model
  - *Motivation:* `audit: 2026-04-20-phase-59-kb-architecture-gap-audit §4.2 / Recommendation 7.2`

> See `.planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-DEFERRALS.md` for the GATE-09 ledger-consumable deferral table covering KB-12..KB-17 (phase target, load-bearing classification, rationale). The DEFERRALS file is the authoritative reconciliation point; this section carries the requirement rows themselves.

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

### Measurement Infrastructure

**Authority:** `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md` §3 (Design Principles) and §4 (Architectural Commitments) are the primary authority for MEAS- requirements. Extractor-specific requirements are grounded in audit artifacts: `.planning/audits/2026-04-15-measurement-signal-inventory/` (4-lane signal inventory + correction-and-extensions-2026-04-16.md + anomaly-stress-tests.md E1–E6 + E5.8), `.planning/spikes/009-thinking-summary-as-reasoning-proxy/`, and `.planning/spikes/010-parent-session-thinking-summary-proxy/`.

**Three-subfamily source split** (established by anomaly stress-tests E2/E5):
- **MEAS-RUNTIME-*** — extractors against Claude/Codex JSONL transcripts (canonical source of truth; subject to era boundaries v2.1.69 redaction + v2.1.78 meta cutoff)
- **MEAS-DERIVED-*** — extractors against `/insights`-produced artifacts (`session-meta/*.json`, `facets/*.json`, `report.html`); on-demand refresh, NOT continuous telemetry
- **MEAS-GSDR-*** — extractors against our own artifacts (`.planning/config.json.automation`, `.planning/knowledge/kb.db`, signal files); versioned via `manifest_version`

#### Architectural Commitments (MEAS-ARCH-*)

- [ ] **MEAS-ARCH-01**: Three-layer separation — raw layer (durable append-only capture per runtime's native format, no premature unification); extractor layer (pure functions registered in a catalog, runtime-scoped, reliability-tiered); interpretation/query layer (structured objects carrying competing interpretations, distinguishing features, anomaly registers)
  - *Motivation:* `deliberation: measurement-infrastructure-epistemic-foundations.md §4.1`
- [ ] **MEAS-ARCH-02**: Extractor registry as extensibility point — each entry declares `name`, `raw_sources`, `runtimes`, `reliability_tier`, `features_produced`, `serves_loop`, `distinguishes` (pairs of interpretations this extractor's output discriminates between). Adding an extractor = writing a pure function and registering it; no core code changes
  - *Motivation:* `deliberation §4.2, P3 (adaptability = extractor-as-unit-of-extension)`
- [ ] **MEAS-ARCH-03**: Retroactive applicability — collection decoupled from extraction; raw data preserved; new extractors run over historical corpus without re-collection
  - *Motivation:* `deliberation P5`
- [ ] **MEAS-ARCH-04**: Runtime dimension model — runtime identity (Claude Code, Codex CLI) and per-runtime capability asymmetry are data, not noise. Four-class symmetry markers: `symmetric_available`, `symmetric_unavailable`, `asymmetric_derived`, `asymmetric_only`. Plus per-feature status: `exposed` / `derived` / `not_available` / `not_applicable`
  - *Motivation:* `deliberation §4.3, P4 (cross-platform as first-class); correction-and-extensions-2026-04-16.md §5.1 (four-class refinement)`
- [ ] **MEAS-ARCH-05**: Resolution-on-demand — capture fine-grained raw data; aggregate on query. Never pre-aggregate the canonical store. Coarse metrics are derivable from fine; the reverse is not true
  - *Motivation:* `deliberation §2.4, P2`
- [ ] **MEAS-ARCH-06**: Epistemic reliability tiers — every feature carries a tier: `direct_observation` / `artifact_derived` / `inferred` / `cross_runtime`. The query layer refuses high-confidence claims from low-reliability data
  - *Motivation:* `deliberation P8`
- [ ] **MEAS-ARCH-07**: Named feedback loops — six loops (intervention-lifecycle, pipeline-integrity, agent-performance, signal-quality, cross-session patterns, cross-runtime comparison) each declare named metrics, a theory of change, and distinguishing features. Orphaned metrics are technical debt
  - *Motivation:* `deliberation §4.4, P9`
- [ ] **MEAS-ARCH-08**: Dual interface — agents consume structured queries (JSON); humans consume text-first visualization (markdown tables, ASCII charts, terminal rendering) as v1. Richer visualization follows when humans articulate what they want
  - *Motivation:* `deliberation P6`
- [ ] **MEAS-ARCH-09**: Post-Popperian epistemic machinery — interpretations carry: competing interpretations (multi-framing by default); distinguishing features (extractors whose output discriminates between competing readings; surface gap when uncomputed); anomaly register (rate-tracked); revision classification (progressive vs degenerating per Lakatos); intervention-outcome pairs (strongest epistemic status). An interpretation is never "verified" — it carries its full epistemic provenance summary
  - *Motivation:* `deliberation §2.3, §4.1, P1`
- [ ] **MEAS-ARCH-10**: Metadata richness for causal attribution — every session record includes model ID, reasoning level, GSD version, profile (quality/balanced/budget), runtime identity, timestamps. Without these, patterns are detectable but not diagnosable
  - *Motivation:* `deliberation P7`

#### MEAS-RUNTIME-* (Claude/Codex JSONL transcript extractors)

- [ ] **MEAS-RUNTIME-01**: Thinking-summary composite extractor — produces `thinking_emitted` (bool primary feature), `thinking_total_chars` (model-stratified), `thinking_over_visible_ratio`. Four-status return: `exposed` / `not_emitted` / `not_applicable` (Haiku) / `not_available` (dispatch-gated). Preconditions stacked as three-level gate: model-family → dispatch-context (subagent=`not_available`, headless/interactive proceed) → emission-threshold
  - *Motivation:* `correction-and-extensions-2026-04-16.md §6.1, §5.2; spike 010 DECISION §5–6; spike 009 dispatch-context gate`
- [ ] **MEAS-RUNTIME-02**: Settings-state + dispatch-args snapshot at session start — capture `showThinkingSummaries`, `effortLevel` from settings.json; capture `--effort` flag value from dispatch metadata (overrides settings for that session); attach as `settings_at_start`. `effort_level` is a required stratification variable for all reasoning metrics
  - *Motivation:* `correction-and-extensions-2026-04-16.md §6.3; spike 010 DESIGN (--effort autonomous toggle)`
- [ ] **MEAS-RUNTIME-03**: JSONL-based token extractor (`session_tokens_jsonl`) — produces `input_tokens_total`, `output_tokens_total`, `cache_creation_tokens_total`, `cache_read_tokens_total`, `total_context_tokens` via `max(usage.*)` per unique `msg_id` for streaming dedup. Canonical token source. Returns `not_available` when parent JSONL is missing (257/268 sessions per E3 coverage)
  - *Motivation:* `anomaly-stress-tests.md §6.17; E4 falsification pass (4/7 meta tokens have no JSONL-derivable formula)`
- [ ] **MEAS-RUNTIME-04**: Reject session-meta tokens as first-class MEAS- source — `meta.input_tokens` / `meta.output_tokens` SHALL NOT appear as MEAS- metric fields nor as normalizers. E4 empirically showed 4/7 sessions match a "contiguous slice of length amc" formula; 3/7 have no derivable formula (including one clean pre-cutoff session). Insufficient reliability for cross-session aggregation
  - *Motivation:* `anomaly-stress-tests.md §6.16; E4 evidence chain`
- [ ] **MEAS-RUNTIME-05**: Phantom-thinking-token reconciler — compute `raw_thinking_tokens = output_tokens − tokens(visible_output) − tokens(thinking_summary)` for Claude; use direct `token_count.reasoning_output_tokens` for Codex; report on common `reasoning_tokens` axis. Flag sessions with negative delta. Blocked on real tokenizer (spike C3); schema is specifiable now
  - *Motivation:* `correction-and-extensions-2026-04-16.md §4, §6.2, §6.5 (billing asymmetry A9 promotion)`
- [ ] **MEAS-RUNTIME-06**: Marker-density features (REVISED) — KEEP `marker_self_correction_density` + `marker_uncertainty_density` (both track effort per spike 010 finding #5). DROP `marker_branching_density` + `marker_dead_end_density` (regex matched zero cells across 21 non-empty-thinking samples; unfit for Claude's summary vocabulary; redesign requires empirical calibration per spike C4)
  - *Motivation:* `correction-and-extensions-2026-04-16.md §6.1 revised; spike 010 findings #4–#5`
- [ ] **MEAS-RUNTIME-07**: Compaction-event extractor (`MEAS-RUNTIME-COMPACT`) — cross-runtime. Claude: scan JSONL for `type:system + subtype:compact_boundary`, extract `compact_metadata.{trigger, pre_tokens}`; also scan `isCompactSummary:true` flag on assistant messages (locates the summary text itself). Codex: scan for `compacted` + `event_msg/context_compacted`, extract `replacement_history`. Features: `compaction_count`, `compaction_trigger_mix`, `pre_compact_token_count`, `has_compaction`. Restores cross-runtime symmetry falsely denied by synthesis §4.3 "ABSENT"
  - *Motivation:* `anomaly-stress-tests.md §6.22; E6 evidence chain (binary introspection + authoritative docs)`
- [ ] **MEAS-RUNTIME-08**: Clear-invocation feature — `clear_invocation_count` per session (scan user-message content for `<command-name>/clear`). Operator-habit signal that substitutes pre-emptively for compaction (this project: 49 `/clear` vs 0 `/compact` in 211 sessions). Measurable regardless of whether compaction fires
  - *Motivation:* `anomaly-stress-tests.md §E6.4 (side-signal)`
- [ ] **MEAS-RUNTIME-09**: Human-turn-count extractor — operates on JSONL with 4-filter rule: `user` role AND NOT `isMeta` AND NOT `isSidechain` AND content not tool_result list AND content not prefixed with `<command-name>` / `<command-message>` / `<local-command-caveat>` / `<local-command-stdout>`. Complements (does NOT replace) MEAS-DERIVED-05's `user_message_count`; orthogonal semantics. Returns `not_available` when parent JSONL absent — MUST NOT fall back to meta_umc
  - *Motivation:* `anomaly-stress-tests.md §6.13; E3 evidence chain + Test 3 formula identification`
- [ ] **MEAS-RUNTIME-10**: Era-boundary registry — `user.version` partitions the corpus into epistemically non-comparable eras: `v<2.1.69` (thinking unconditional); `v≥2.1.69` (thinking gated by `showThinkingSummaries`, `tengu_quiet_hollow` rollout ~2026-03-12); session-meta `/insights` lifecycle (generation is manual-invocation, not architectural per E5 reframe). Queries spanning boundaries warn the user
  - *Motivation:* `correction-and-extensions-2026-04-16.md §6.6; anomaly-stress-tests.md E5 reframe (subsystem-shutdown → /insights-invocation)`
- [ ] **MEAS-RUNTIME-11**: Reasoning-quality measurement — PLACEHOLDER requirement signalling a gap in the Agent Performance loop. Summary length is NOT a quality proxy even when model-stratified (spike 010 qualitative finding #6). Candidate mechanisms: reference-density, concept-diversity, LLM-as-judge against rubric. Implementation deferred to Phase 57.7 pending spike C5; facets (MEAS-DERIVED-02) is a candidate substitute
  - *Motivation:* `spike 010 qualitative_comparison.md; correction doc candidate #7`

#### MEAS-DERIVED-* (/insights-product extractors)

- [ ] **MEAS-DERIVED-01**: Reclassify session-meta as `DERIVED` (not `RUNTIME`) — annotate with `scope: derived_from_jsonl_via_insights_command`, `lifecycle: last_insights_run_at_{mtime}`, `refresh_policy: on_manual_invocation_of_/insights`, `dependency: /insights subsystem (active in v2.1.110, bug-fixed at v2.1.101)`. Original Lane-1 classification as runtime telemetry was wrong per E5
  - *Motivation:* `anomaly-stress-tests.md §6.18; E5 /insights reframe`
- [ ] **MEAS-DERIVED-02**: `facets/*.json` as first-class MEAS- source — LLM-extracted per-session semantic summaries: `underlying_goal`, `goal_categories`, `outcome`, `user_satisfaction_counts`, `claude_helpfulness`, `session_type`, `friction_counts`, `friction_detail`, `primary_success`, `brief_summary`. Candidate substrate for Agent Performance loop's reasoning-quality measure. Mandatory coverage-stratification clause: aggregate analysis MUST stratify by session size (E5.8: 25.6% new vs 40.7% historical coverage; mean `user_msg` 20.1 with facets vs 5.4 without — non-uniform size-correlated budget filter)
  - *Motivation:* `anomaly-stress-tests.md §6.19 + E5.8 Finding C`
- [ ] **MEAS-DERIVED-03**: Write-path provenance metadata (`MEAS-DERIVED-WRITE-PATH`) — record whether a file's mtime came from a bulk cluster (≥5 files within 2s — `/insights` mass-rewrite) or a single write (separate per-session-end trigger, discovered E5.8). Annotate every DERIVED extraction with `provenance.write_path ∈ {bulk, single}`
  - *Motivation:* `anomaly-stress-tests.md §6.21; E5.8 Finding A (two-path write model)`
- [ ] **MEAS-DERIVED-04**: `/insights` mass-rewrite as sampling-boundary artifact — every `/insights` invocation stamps a new mtime-cluster across ~100-150 files. Expose as observable provenance: detect stale analysis (mtime old, content changed), group sessions by /insights-generation batch (shared mtime ±1s), audit coverage drift
  - *Motivation:* `anomaly-stress-tests.md §6.20`
- [ ] **MEAS-DERIVED-05**: session-meta field annotations — `user_message_count` tagged `scope = non_tool_result_user_records` AND `lifecycle = frozen_at_last_insights_run_for_sessions_still_running` (E3 Test 3 identified the formula: count of user records where content is a string). `input_tokens` / `output_tokens` tagged `uncorrelated_with_jsonl_for_42_percent_of_sample` + same lifecycle tag. Downstream guidance: do not consume for quantitative measurement; use MEAS-RUNTIME-03 / MEAS-RUNTIME-09 instead
  - *Motivation:* `anomaly-stress-tests.md §6.14 refinement + §6.16 corollary; E3/E4 evidence chains`
- [ ] **MEAS-DERIVED-06**: Session-meta ↔ JSONL coverage audit — one-time investigation producing a coverage matrix (matched / session-dir-only / truly-orphaned) by machine, era, session-length, subagent-dispatch-host. E3 baseline: 11 matched, 175 dir-only, 82 truly orphaned of 268. Shapes extractor-priority decisions downstream
  - *Motivation:* `anomaly-stress-tests.md §6.15; E3 Test 2 three-state distribution`

#### MEAS-GSDR-* (our-own-artifact extractors)

- [ ] **MEAS-GSDR-01**: Automation-health extractor — reads `.planning/config.json.automation.stats` and produces per feature_key: `fires`, `skips`, `skip_rate`, `last_triggered`, `last_skip_reason`, `call_path` (postlude vs user-invoked), `configured_level` (resolved from `automation.level` + `overrides[feature]`). Serves Pipeline Integrity loop primarily. MUST NOT assume parity across feature keys when computing aggregate health (sensor_log was introduced later than sensor_artifact/git/ci per E1 Test 2)
  - *Motivation:* `anomaly-stress-tests.md §6.7; E1 evidence chain`
- [ ] **MEAS-GSDR-02**: Implement `last_signal_count` write path — Phase 38 specified this but never shipped the write. Two options: (a) extend `automation track-event` to accept `--metadata signal_count=N` and merge into stats; (b) have `collect-signals.md` workflow run `config-set automation.stats.sensor_<name>.last_signal_count <N>` after counting sensor output. Closes the per-sensor signal-yield gap
  - *Motivation:* `anomaly-stress-tests.md §6.8; Phase 38 plan reference`
- [ ] **MEAS-GSDR-03**: Canonicalize `skip_reason` vocabulary — define enum in `feature-manifest.json` or `automation-schema.json`; validate at `track-event` write time (warn, not fail — backward-compatible). Downstream MEAS-GSDR-01 groups by canonical reason
  - *Motivation:* `anomaly-stress-tests.md §6.9`
- [ ] **MEAS-GSDR-04**: kb.db as first-class MEAS- extractor source — `kb_signal_stats` wraps `gsd-tools.cjs kb stats` or issues SQL directly. Surfaces counts by severity, polarity, runtime, project, status, lifecycle_state; computes temporal features (signals-per-week, age-of-oldest-active-signal). Replaces grep-over-frontmatter for signal-quality loop. Preconditions: kb.db exists + fresh (see MEAS-GSDR-05)
  - *Motivation:* `anomaly-stress-tests.md §6.10; E2 schema + aggregation verification`
- [ ] **MEAS-GSDR-05**: Fix kb.db freshness automation — BLOCKS MEAS-GSDR-04. No workflow call site invokes `gsd-tools.cjs kb rebuild`; all invoke `kb-rebuild-index.sh` which only updates the markdown index (naming-collision bug). Recommended fix: have `kb-rebuild-index.sh` also invoke `node gsd-tools.cjs kb rebuild` internally — one call site, two artifacts updated, no agent/workflow edits. Alternative: replace all call sites explicitly
  - *Motivation:* `anomaly-stress-tests.md §6.11; E2 Layer 4 root-cause; signal sig-2026-04-16-kb-db-freshness-automation-missing`
- [x] **MEAS-GSDR-06**: Fix or remove FTS5 — `signal_fts` virtual table declared but never populated; external-content mode references nonexistent `title`/`body` columns on `signals`. Three options: (a) add title/body + INSERT path; (b) drop FTS5 entirely and use ripgrep (smallest change, recommended for now); (c) rewrite as contentless FTS5. Revisit when a concrete MEAS- feature needs full-text search (resolved in Phase 57.7 Plan 03 — option (b) drop signal_fts)
  - *Motivation:* `anomaly-stress-tests.md §6.12; E2 Layer 5; signal sig-2026-04-16-fts5-declared-but-unused`

### Structural Enforcement

#### Structural Enforcement Substrate

Dependencies: HOOK-01 -> HOOK-02/HOOK-03

- [x] **HOOK-01**: Installer wires SessionStop / closeout hook substrate for Claude Code from source, not by manual runtime patching. The installed hook path is treated as authoritative for GATE-06 and any future postlude gates
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 2.6 + Recommendation 9.1 -- GATE-06 depends on SessionStop substrate the installer does not currently write`
- [x] **HOOK-02**: Installer detects Codex hook availability and, when the runtime supports it, writes the Codex hook surface needed for structural closeout gates. When unavailable, the installer records an explicit degradation / waiver marker rather than silently pretending parity
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit §5 -- blanket "Codex has no hooks" framing is stale; per-gate Codex behavior must be explicit`
- [x] **HOOK-03**: Closeout / incident hook substrate exposes a canonical load-bearing source contract for the session-level counters or markers needed by GATE-06 and GATE-07 (`postlude-fired`, `error-rate`, `direction-change`, `destructive-event`, or explicit `not_available` markers), so downstream measurement / gate consumers do not depend on ad hoc runtime reads
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 2.7 + §4.2 -- incident self-signal and structural postlude both require substrate that does not yet exist`

- [ ] **GATE-01**: offer_next blocks phase advancement until a PR exists, required CI checks pass, and any override is logged with explicit justification. The requirement must name the blocking substrate (hook, CI rule, or workflow gate) and the Codex behavior; manual confirmation alone does not satisfy structural enforcement
  - *Motivation:* `pattern: R01 -- 6+ occurrences of advisory fix failing, signal f5e6b2b6 still active`
- [ ] **GATE-02**: `--merge` is the structural default for PR merges in every workflow / command surface that invokes `gh pr merge`, and CI verifies that `--squash` is absent and `--merge` is explicit
  - *Motivation:* `pattern: R02 -- squash merge destroyed commit history, required force-push recovery`
- [ ] **GATE-03**: Quick task uses an explicit detection rule for runtime-facing changes (source code, installer/runtime mirrors, workflow control surfaces, planning-authority files) and requires branch+PR flow for those changes. Pure prose docs may still go direct to main
  - *Motivation:* `pattern: R08 -- quick task committed runtime code to main without CI gate`
- [ ] **GATE-04a**: `.continue-here` files are consumed on read and archived or deleted after session start; the workflow leaves a durable trace rather than silently reusing stale handoff files
  - *Motivation:* `pattern: R09 -- recurrence driven by stale handoff state surviving across sessions`
- [ ] **GATE-04b**: `.continue-here` staleness is a structural hard stop when the file predates the last session or conflicts with newer project state
  - *Motivation:* `pattern: R09 -- stale handoff files repeatedly re-open the wrong working set`
- [ ] **GATE-04c**: Upstream anti-pattern severity levels (blocking / advisory) ship with mandatory understanding checks for blocking items, so hard-stop safety gates are not advisory prose
  - *Motivation:* `pattern: R09 -- 3 months of recurrence, 3+ signals, no fix` | `research: upstream-drift-survey -- upstream convergent with hard stops + severity`
- [ ] **GATE-05**: Model selection is echoed and logged before dispatch in every named delegation surface that can materially affect output (`collect-signals`, research / planning delegation, discuss-phase delegation, audit delegation, and other spawned batch workflows). The requirement enumerates the sites rather than relying on "all delegation workflows" as prose
  - *Motivation:* `pattern: R10 -- entire sensor batch stopped and relaunched because model selection was wrong and unverifiable`
- [ ] **GATE-06**: Automation postlude fires structurally via installed hook / closeout substrate rather than by agent discretion. The phase must specify the Claude substrate, the Codex substrate or waiver path, and a measurable fire-event for verification
  - *Motivation:* `pattern: R12 -- 0% fire rate across all sessions, 6/6 signal_collection skipped`
- [ ] **GATE-07**: Incident self-signal hook prompts signal creation when session metadata or hook trace indicates high error rate, major direction changes, or destructive events during execution. The trigger source must be named, not assumed
  - *Motivation:* `pattern: R04 -- agent failed to self-signal after 91-file cascade, headless version burn, CI bypass`
- [ ] **GATE-08a**: Discuss-phase current state is verified against upstream's richer discuss-phase-assumptions surface before adoption work is declared complete
  - *Motivation:* `signal: sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop -- closed issues masked missing work`
- [ ] **GATE-08b**: Missing `gsd-assumptions-analyzer` / equivalent assumptions-analyzer agent is created and wired into the discuss-phase contract
  - *Motivation:* `research: upstream richer discuss assumptions flow includes analyzer surface missing in fork`
- [ ] **GATE-08c**: `docs/workflow-discuss-mode.md` (or equivalent canonical discuss-mode documentation) exists and matches the shipped workflow
  - *Motivation:* `research: upstream 671 lines vs fork 279 lines -- mode semantics are currently under-documented`
- [ ] **GATE-08d**: `plan-phase` and `progress` ship mode-aware discuss gates where the richer discuss-phase contract requires them
  - *Motivation:* `signal: sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop -- mode adoption failed partly because downstream gates were absent`
- [ ] **GATE-08e**: The upstream richer discuss-phase-assumptions surface, including methodology loading where relevant, is adopted or explicitly narrowed with a named rationale
  - *Motivation:* `signal: sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop -- Issues #26, #32, #33 closed prematurely` | `research: upstream 671 lines vs fork 279 lines`
- [ ] **GATE-09a**: Scope-translation ledger exists as a named artifact / schema, not a prose convention. Every load-bearing CONTEXT claim maps at phase close to `implemented_this_phase` / `explicitly_deferred` / `rejected_with_reason` / `left_open_blocking_planning`
  - *Motivation:* `deliberation: measurement-infrastructure-epistemic-foundations.md §7.4 -- meta-fix for the Phase 57 scope-narrowing cascade documented by .planning/audits/2026-04-10-phase-57-vision-drop-investigation/`
- [ ] **GATE-09b**: Any `[open]` scope-boundary question in CONTEXT that affects what the phase is supposed to build is resolved or deferred with a named downstream phase before planning proceeds
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 2.9 -- planning gate was bundled into ledger prose and would otherwise disappear`
- [ ] **GATE-09c**: If RESEARCH or PLAN narrows scope relative to CONTEXT, it cites the originating CONTEXT claim and records the narrowing as a decision with provenance
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit §7.3 -- the ledger itself can be silently narrowed unless narrowing decisions are first-class`
- [ ] **GATE-09d**: Verification checks the ledger and fails silent disappearance of load-bearing CONTEXT claims even when executable work passes
  - *Motivation:* `deliberation: measurement-infrastructure-epistemic-foundations.md §7.4 -- executable truth is not sufficient when scope commitments vanish silently`
- [ ] **GATE-10**: Phase-closeout reconciliation is structural — `STATE.md`, the active ROADMAP phase row, phase plan checkboxes, and any touched planning-authority sidecars are reconciled before the phase is treated as complete
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 3.1 -- closeout reconciliation gap recurred immediately after 57.8`
- [ ] **GATE-11**: Release-boundary assertion is structural — when a phase branch merges, the PR/CI/merge/tag/release boundary is either advanced or explicitly deferred with reason; stale release lag is surfaced rather than silently tolerated
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 3.1 + 3.6 -- release follow-through is part of the same seam, not a separate optional chore`
- [ ] **GATE-12**: Failed or interrupted agent output is archived rather than deleted before redispatch, so partial evidence survives audit / recovery
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 3.2 -- in-flight evidence preservation has no owning gate`
- [ ] **GATE-13**: Delegation contracts are restated at spawn sites (agent type, model, reasoning effort, required inputs, output path) so auto-compact / context compression cannot silently change the dispatch semantics
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 3.3 -- delegation drift under compaction remains unowned`
- [ ] **GATE-14**: Direct pushes to `main` are structurally blocked for gated work, and CI status is enforced beyond PR creation
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 3.5 -- PR creation alone does not close CI bypass / direct-push recurrence`
- [ ] **GATE-15**: Source-vs-installed mirror parity is verified after runtime-facing changes so a workflow cannot pass with drift between source and installed surfaces
  - *Motivation:* `audit: 2026-04-20-phase-58-structural-gates-gap-audit Finding 3.7 -- source/install drift is still a bypass surface`

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

- [ ] **WF-01**: Cross-model audit delegation is supported as an `audit_delegation: cross_model:{model_id}` mode within the `/gsdr:audit` command (Phase 57.4). This absorbs the cross-model review capability into the audit workflow rather than shipping it as a separate standalone command. The command composes a fully-formed task spec (obligations, ground rules, fit assessment) and dispatches to the target model's CLI (e.g., `codex exec` for GPT). The cross-model path ships as **experimental** in Phase 57.4 with a `--trust-cross-model` opt-in requirement for `--auto` mode, a user warning about known fragility (environment setup, early exit, instruction degradation), stdout teeing to a log file, and explicit output file verification. A post-implementation spike (Q2 candidate) will measure dispatch reliability and determine whether the experimental flag can be removed. Command is opt-in, model choice configurable not prescribed; audit round count is user-determined via `--continue`. The delegation must remain flexible -- the command provides infrastructure, not a rigid procedure. See `get-shit-done/references/audit-conventions.md` Section 3.3 (Axis 3: Delegation) and `get-shit-done/references/audit-ground-rules.md` Section 3.3 (dispatch hygiene obligation).
  - *Motivation:* `pattern: strongest positive pattern across audit (P01-P08, 4 projects, 6+ sessions)` | `research: PITFALLS.md C6 -- over-formalization risk` | `deliberation: audit-taxonomy-three-axis-obligations.md -- WF-01 absorbed as cross_model delegation mode per 57.4 scope`
- [ ] **WF-02**: `/gsdr:revise-phase-scope` command -- formal path for mid-phase scope changes with ROADMAP.md and REQUIREMENTS.md update, commit, and re-discuss
  - *Motivation:* `pattern: N02 -- highest-impact missing command; user forced signal about missing /gsdr:revise-phase-scope`
- [ ] **WF-03**: `/gsdr:research` command -- lightweight pre-milestone research producing committed knowledge artifacts in `.planning/research/` without code changes or spike overhead. Output must cite sources, state confidence levels per finding, and note limitations
  - *Motivation:* `deliberation: Thread 11 -- telemetry survey didn't fit any existing workflow`
- [ ] **WF-04**: `/gsdr:discuss-milestone` workflow produces a MILESTONE-CONTEXT.md with structured steering brief (working assumptions, open questions, epistemic guardrails, derived constraints, deferred ideas) analogous to discuss-phase CONTEXT.md
  - *Motivation:* `signal: sig-2026-04-08-no-discuss-milestone-workflow -- gap identified and signaled during this milestone's scoping`
- [x] **WF-05a**: `/gsdr:explore` command adopted from upstream `/gsd:explore` -- Socratic ideation skill with questioning.md reference, mid-session research offers, and artifact routing (notes, todos, seeds, requirements, phases). Minimal GSDR branding.
  - *Motivation:* `deliberation: explore-skill-adoption-and-dialogue-modes.md -- skill gap discovered during federated signal vision conversation`
- [ ] **WF-05b**: `/gsdr:explore` enhanced with GSDR-specific questioning methodology (epistemic practice probes, assumption-surfacing, constraint-challenging), signal-aware exploration (KB queries during sessions via Phase 59 infrastructure), domain probes for harness/signal/epistemic domains replacing upstream web-app probes, and "no artifact" as valid outcome
  - *Motivation:* `deliberation: explore-skill-adoption-and-dialogue-modes.md -- upstream explore is instrumentalized Socratic method; GSDR needs genuine inquiry where exploration itself has value beyond artifacts`

### Discuss-Phase Exploratory Mode

- [ ] **DISC-01**: Exploratory-mode `write_context` template includes structural sections for working assumptions, derived constraints, epistemic guardrails, and structured open questions — not just implementation decisions
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md -- audit found 0 guardrails, 0 working assumptions, 0 constraints across Phases 55-57 vs 4-9 guardrails in peak-era Phases 52-54`
- [ ] **DISC-02**: Typed claim states replace bare [grounded]/[open] binary with 7 primary types (evidenced, decided, assumed, open, projected, stipulated, governing) + 3-level verification dimension (cited, reasoned, bare). Shared reference doc `references/claim-types.md` defines types, assignment criteria, researcher actions, justificatory expectations, and claim dependency recording
  - *Motivation:* `deliberation: claim-type-ontology.md -- 6 exploratory audits across 12 projects (~85 CONTEXT.md files) found 40 named groupings converging on 7 recurrent patterns. Each type has distinct researcher action and justificatory demand. Claim dependencies form inferential webs that the checker traces.`
- [ ] **DISC-03**: Verifiable provenance recorded in DISCUSSION-LOG.md (the justificatory sidecar). Each typed claim has justification meeting its type-specific demand: evidenced claims cite artifacts, decided claims record alternatives considered, assumed claims specify challenge protocols, stipulated claims acknowledge the number is a choice. Epistemic status labels decoupled from auto-progression eligibility
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md + claim-type-ontology.md -- [grounded] does double duty as epistemic status AND automation control token; justificatory work belongs in the sidecar, not inline`
- [ ] **DISC-04**: Context-checker agent runs after discuss-phase write_context, before plan-phase. Verifies claim type assignments, surfaces untyped claims doing significant epistemic work, checks citation integrity, traces claim dependency chains, flags type-specific justification gaps in DISCUSSION-LOG.md. Fixes CONTEXT.md in-place, appends verification log to DISCUSSION-LOG.md
  - *Motivation:* `deliberation: claim-type-ontology.md -- "invisible load-bearing assumptions" identified as #1 blind spot across all audits; phantom citations found in 3 of 7 this-repo CONTEXT.md files; batch-3 found most common claim type is "empirical without method" which ages silently`
- [ ] **DISC-05**: Upstream --chain flag (commit 5e88db95, PR #1445) cherry-picked into fork discuss-phase workflow. Discuss-phase commits CONTEXT.md output when `commit_docs: true` in config
  - *Motivation:* `audit: auto-progression-audit.md -- fork sync gap; --chain never merged. sig-2026-04-09-discuss-phase-workflow-gaps documents both issues`
- [ ] **DISC-06**: Main exploratory capture section renamed from "Implementation Decisions" to a framing that does not bias toward closure
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md + codex-gpt54-review.md -- "the system is asking the model to think one way and write another"`
- [ ] **DISC-07**: Research questions generated by exploratory CONTEXT.md use generative format (specifying research program, downstream decisions affected, reversibility) rather than binary yes/no format
  - *Motivation:* `audit: rigorous-comparative-audit.md Section B -- rich-era questions specify methodology ("Diff the two versions structurally"); thin-era questions ask yes/no ("Should Area 3 fixes be included?")`

- [ ] **DISC-08**: DISCUSSION-LOG.md enhanced from human-reference-only audit trail to justificatory sidecar consumed by the context-checker. Records per-claim justification meeting type-specific demands, claim dependency chains (which claims support which), and verification log from the context-checker
  - *Motivation:* `deliberation: pipeline-enrichment-step-architecture.md + claim-type-ontology.md -- DISCUSSION-LOG.md already exists as sidecar; repurposing it for justificatory work avoids creating a new document while giving provenance a home outside CONTEXT.md`
- [ ] **DISC-09**: Researcher agent (`gsdr-phase-researcher.md`) updated to consume typed claims from CONTEXT.md. Type-to-action mapping: evidenced=verify+build, decided=honor+implement, assumed=investigate+test, open=research+propose, projected=check-need+flag, stipulated=note-choice+calibrate, governing=respect+note-constraints. Reference doc path included in agent's `<upstream_input>`
  - *Motivation:* `deliberation: claim-type-ontology.md + discussion -- researcher currently treats all CONTEXT.md claims as locked decisions ("Don't explore alternatives to locked decisions"); typed claims give the researcher a richer mandate`
- [ ] **DISC-10**: CONTEXT.md includes a claim dependency section recording which claims depend on which other claims. The context-checker traces these dependencies: a decided claim resting on an assumed claim is flagged as a vulnerability. DISCUSSION-LOG.md records the full dependency web
  - *Motivation:* `deliberation: claim-type-ontology.md -- claims form inferential webs (Brandom); scope boundaries rest on assumptions, thresholds depend on premises, projections depend on assessments. Individual claim typing misses dependency vulnerabilities`

### Audit Workflow

- [ ] **AUDIT-01**: Audit sessions produce date-first directories (`.planning/audits/YYYY-MM-DD-{slug}/`) containing task specs given to agents alongside agent outputs, with provenance metadata (agent model, launch context, session ID)
  - *Motivation:* `deliberation: exploratory-discuss-phase-quality-regression.md -- three audits during this session had ephemeral outputs, no task spec preservation, and fragile cross-model invocation`
- [ ] **AUDIT-02**: Audit task specs include explicit epistemic ground rules: every claim cites file:line, every finding tested against disconfirming evidence before writing, distinction between what was measured and what the measure captures
  - *Motivation:* `audit: rigorous-comparative-audit-task-spec.md -- third audit produced substantially better results after explicit anti-verificationist instructions; first two exhibited the epistemic failures being investigated`
- [ ] **AUDIT-03**: Existing scattered audit artifacts (~43 files across `.planning/audits/`, `.planning/fork-audit/`, `.planning/` root) migrated to new conventions: files moved to `.planning/audits/` with date-first naming, YAML frontmatter added per audit-conventions.md schema, content preserved without rewriting. Sensor trial files categorized separately (not audits)
  - *Motivation:* `discuss-phase 57.3: user directed migration as in-scope -- "the existing mess in .planning/audits/ and .planning/ root" must be addressed alongside forward-looking infrastructure`
- [x] **AUDIT-04**: Audit taxonomy is a three-orthogonal-axis model -- subject (what is being audited: 9 subjects including `process_review` and `artifact_analysis`), orientation (from what stance: `standard` / `investigatory` / `exploratory`), delegation (who does it: `self` / `cross_model:{model_id}`). The axes compose orthogonally. Frontmatter uses three fields (`audit_subject`, `audit_orientation`, `audit_delegation`) replacing the v1 `audit_type` enum; `audit_type` is retained as an optional legacy field for backward compatibility. `audit_subject` is optional for `investigatory` and `exploratory` orientations. Implemented in `get-shit-done/references/audit-conventions.md` Sections 2-3.
  - *Motivation:* `deliberation: audit-taxonomy-three-axis-obligations.md -- 3-axis decomposition replaces flat 8-type taxonomy, validated against 13 audit sessions by retrospective` | `retrospective: audit-taxonomy-retrospective-analysis.md` | `context: 57.4-CONTEXT.md DC-4 -- frontmatter schema v2`
- [x] **AUDIT-05**: Non-standard orientation audits use an **obligations paradigm** (obligations are things to engage with, not sections to write) instead of per-type body templates. Obligations compose across axes into a flat list: core (Rules 1-5) + orientation (standard / investigatory I1-I4 / exploratory) + subject (if named) + cross-cutting (conditional on chain or cross-model dispatch). The hermeneutic composition principle governs tension between obligations: name the tension, name what about the situation creates it, show how you navigated it -- responsive to both demands, not cleanly picking one side. Standard routine audits may use suggested scaffolds (templates-as-scaffolding, not templates-as-mandate). Implemented in `get-shit-done/references/audit-conventions.md` Section 4 and `get-shit-done/references/audit-ground-rules.md` Section 2.
  - *Motivation:* `deliberation: audit-taxonomy-three-axis-obligations.md Composition Principle` | `retrospective: audit-taxonomy-retrospective-analysis.md -- validates three populations (template/obligations/multi-agent)`
- [x] **AUDIT-06**: Audit core rules include **Rule 5 (frame-reflexivity)**: "Did the framing shape what you found?" Distinct from Rule 4 (within-frame escape): Rule 5 catches whether the frame itself was appropriate. Lightweight closing step for standard orientation; full section for investigatory. Grounded in specific questions (not generic prompts) to prevent compliance theater -- e.g., "If this audit had been classified differently, what would it have looked for that you didn't?" Empty Rule 5 answers are a signal that the frame is invisible to the auditor, not a signal of neutrality. Implemented in `get-shit-done/references/audit-ground-rules.md` Section 1 (Rule 5).
  - *Motivation:* `review: pre-phase-archive/REVIEW.md Part 4 lines 103-116 -- frame-reflexivity Rule 5 argument` | `deliberation: audit-taxonomy-three-axis-obligations.md` | `guardrail: G-3 -- rules must not become compliance theater`
- [x] **AUDIT-07**: Investigatory orientation carries four additional ground rules (**I1-I4**): (I1) start from the discrepancy, not a theory -- the choice of comparison point is already an interpretive act; (I2) let the investigation guide artifact selection -- the artifact chain is a finding, not an input; (I3) present competing explanations -- at least two interpretations per finding, do not collapse to one; (I4) name the position of the investigation -- every investigation is conducted from somewhere. Plus: show what remains unknown; show how you navigated any tensions between obligations. Implemented in `get-shit-done/references/audit-ground-rules.md` Section 2 (Investigatory Orientation).
  - *Motivation:* `review: pre-phase-archive/REVIEW.md Part 3 lines 70-74 -- I1-I4 investigatory ground rules` | `deliberation: audit-taxonomy-three-axis-obligations.md`
- [x] **AUDIT-08**: Three cross-cutting audit obligations apply conditionally: **chain integrity** (for audits that use predecessor audit findings as evidence, re-verify each predecessor claim independently before incorporating it); **dispatch hygiene** (for `cross_model` delegation, verify the delegation prompt does not contain framing that systematically biases findings -- comparative framing, target counts, desired conclusions); **framework invisibility** (for investigatory and exploratory audits, name a concrete finding that would not appear no matter how rigorously conducted because of how the audit's scope was framed). Implemented in `get-shit-done/references/audit-ground-rules.md` Section 3 (Cross-Cutting Obligations).
  - *Motivation:* `retrospective: audit-taxonomy-retrospective-analysis.md Gaps 4, 5, 7 -- chain failures, dispatch contamination, framework limits` | `deliberation: audit-taxonomy-three-axis-obligations.md`
- [x] **AUDIT-09**: An invocable audit skill exists as `/gsdr:audit` (orchestrator command at `commands/gsd/audit.md`) + `gsdr-auditor` executor agent (at `agents/gsdr-auditor.md`) + `gsd-auditor` model profile entry. The command reads conversation context, infers a 3-axis classification, composes obligations, creates a session directory at `.planning/audits/YYYY-MM-DD-{slug}/`, writes a fully-formed task spec with all ground rules and obligations copied inline per DC-2, and dispatches the agent (self) or `codex exec` (cross_model, experimental). The agent spec embodies the hermeneutic epistemic stance from the deliberations, grounds Rule 5 and framework invisibility in specific questions, and writes audit output to disk per the task spec. Closes the Phase 57.3 deferred audit skill gap.
  - *Motivation:* `signal: sig-2026-04-09-phase-573-deferred-audit-skill-no-command -- capability gap from Phase 57.3` | `signal: sig-2026-04-09-agent-audit-outputs-ephemeral-no-artifact -- session directory convention addresses traceability` | `deliberation: phase-scope-translation-loss-audit-capability-gap.md`

### Signal Provenance

**Authority:** `.planning/audits/2026-04-16-signal-provenance-audit/signal-provenance-audit-output.md` — investigatory process_review audit identifying four findings (hybrid provenance payload, stale version precedence, asymmetric artifact signatures, telemetry-as-latent-source) and five recommendations.

**Phase 57.8 (declarative, narrow audit fix — Findings 1, 2, 3; Recommendations 1, 2, 5):**

- [ ] **PROV-01**: Signal schema supports role-split provenance for both auto-collected and manual signals — `about_work[]` (array of artifact signatures implicated in the signal; length-1 when single role implicated), `detected_by` (sensor or manual observer identity), `written_by` (synthesizer or manual writer identity). Array semantics decided by fiat in 57.8 CONTEXT.md per audit §"What the Obligations Didn't Capture"; single-artifact vs. graph representation deferred to v1.21 if the array shape proves insufficient. Legacy flat `runtime/model/gsd_version` retained as deprecated for one milestone cycle per PROV-08
  - *Motivation:* `audit: signal-provenance-audit Finding 1 (hybrid payload) + Recommendation 1 (role-split)` | `deliberation-worthy`: array vs. graph for complex signals is an open design question carried into CONTEXT.md
- [ ] **PROV-02**: PLAN.md, SUMMARY.md, VERIFICATION.md frontmatter carries a uniform `signature` block — role, harness, platform, vendor, model, reasoning_effort, profile, gsd_version, generated_at, session_id (when available), provenance_status marker per field (`exposed` / `derived` / `not_available`). Populated via `resolveModelInternal` at orchestration time (see `get-shit-done/bin/lib/init.cjs:333-336` which already resolves planner_model / executor_model / verifier_model but does not persist). Artifact schemas in `frontmatter.cjs` extended to declare signature block as required
  - *Motivation:* `audit: signal-provenance-audit Finding 3 (partial/asymmetric artifact signatures) + Recommendation 2 (first-class signature blocks)`
- [ ] **PROV-03**: Writer-side `gsd_version` precedence fixed — prefer active installed harness VERSION and `.planning/config.json` `gsd_reflect_version` over stale repo-local mirror (`.codex/get-shit-done-reflect/VERSION` is no longer authoritative). `gsdr-signal-synthesizer` task spec and matching manual `/gsdr:signal` write guidance are updated; every signature-block and signal `gsd_version` field carries a provenance marker indicating source
  - *Motivation:* `audit: signal-provenance-audit Finding 2 (stale 1.18.2+dev recorded for 1.19.4+dev workspace) + Recommendation 5`
- [ ] **PROV-04**: Automated signal-writing surfaces (`agents/gsdr-artifact-sensor.toml`, `agents/gsdr-signal-synthesizer.toml`, and the `collect-signals.md` workflow) plus the manual `/gsdr:signal` command / install-generated skill surfaces are updated to stamp or teach role-split fields. Current specs (audit §1 citations) explicitly instruct sensors to stamp flat `runtime/model`, and the missed manual-command surface showed the same drift can survive unless command / skill surfaces are named explicitly — signal outputs and instructions will not conform to PROV-01 until both automated and manual seams change
  - *Motivation:* `audit: signal-provenance-audit Finding 1 (mixed payload comes from sensor prompt + synthesizer prompt disagreement)`
- [ ] **PROV-05**: Signal schema migration is additive with `provenance_schema: v1_legacy` marker on pre-57.8 signals. KB rebuild handles both schemas without errors; `kb.db` columns extended for role-split fields (parallels KB-09 `source` field migration from Phase 56); dual-write invariant maintained per KB-05
  - *Motivation:* `audit: signal-provenance-audit §"What Remains Unknown" (migration strategy open)` | `precedent: Phase 56 KB-09 source→detection_method+origin migration`
- [ ] **PROV-06**: The nine committed Phase 57.6 signals annotated with `provenance_status: legacy_mixed` — substantive content preserved, flat provenance fields flagged as non-authoritative for role attribution. Audit explicitly recommends this and says "the nine committed signals may still contain useful substantive observations, but their `runtime/model/gsd_version` fields are not reliable for attributing planner/executor/verifier responsibility"
  - *Motivation:* `audit: signal-provenance-audit Recommendation 4`
- [ ] **PROV-07**: Reference and command documentation (`get-shit-done/references/signal-detection.md`, `knowledge-store.md`, and the manual `/gsdr:signal` command / installed-skill surface) updated to document role-split provenance semantics. Current schema text (audit cites `signal-detection.md:183-187`) will contradict the implemented code without this update, and manual-command drift must not remain implicit
  - *Motivation:* `audit: signal-provenance-audit Finding 1 (spec text defines runtime/model as signal-generation provenance, not artifact-under-judgment provenance — ambiguity is in the spec itself)`
- [ ] **PROV-08**: Legacy flat `runtime` / `model` / `gsd_version` fields remain readable and writable by legacy consumers for one milestone cycle; deprecation notice added in 57.8; removal scheduled for v1.21. KB queries surface both legacy and role-split fields transparently
  - *Motivation:* `audit: signal-provenance-audit §"What Remains Unknown" (existing reflection/dedup consumer coupling)` | `principle: conservative migration per KB-05 dual-write discipline`

**Phase 60.1 (research-gated + declarative, wider integration — Finding 4; Recommendation 3):**

- [ ] **PROV-09**: Integration surface survey — produces `.planning/research/provenance-integration-surface.md` enumerating every workflow/command/sensor/agent/reflection consumer that could integrate measurement telemetry identity beyond the sensor pipeline (current audit cited only sensors + reflection). This enumeration explicitly includes manual `/gsdr:signal` and install-generated command / skill mirrors when they materially transform the manual-signal contract. **Extraction contract per GOV-01**: each viable integration point becomes a child requirement `PROV-09.1`, `PROV-09.2`, ... (or is explicitly deferred to v1.21 with a named reason); survey is not satisfied by document existence alone. Planning of 60.1 blocks until child requirements exist or are deferred
  - *Motivation:* `audit: signal-provenance-audit Finding 4 ("telemetry probably can expose a large fraction of the signature the user wants. The gap is that the workflow does not yet normalize that telemetry into artifact signatures") — audit named the gap but did not enumerate the full surface` | `governance: GOV-01 extraction contract`
- [ ] **PROV-10**: Log sensor and artifact sensor consume `buildSessionIdentityValue()` from `get-shit-done/bin/lib/measurement/extractors/runtime.cjs:208` and the Codex equivalent from `extractors/codex.cjs:202` instead of self-stamping. Provenance derives from live telemetry where exposed; falls back to orchestration-time signing where logs are silent (per audit Recommendation 3)
  - *Motivation:* `audit: signal-provenance-audit Finding 4 + Recommendation 3 ("treat telemetry as a source, not the whole answer")`
- [ ] **PROV-11**: Reflection (`gsdr-reflector` agent + `reflect` workflow) stratifies signal aggregates by `model × profile × reasoning_effort` via `measurement/stratify.cjs`. Agent-performance attribution (signal count by role / model / profile) ships operational — currently impossible because signals carry only detector identity
  - *Motivation:* `audit: signal-provenance-audit Finding 3 (asymmetric signatures prevent role attribution)` | `enables: MEAS-ARCH-08 agent-consumable queries for agent-performance loop`
- [ ] **PROV-12**: Intervention-outcome schema extended with `predicted_outcome` field (Plan 07 shipped `outcome_status` only because it had no grounded interventions to test against). Signal lifecycle transitions (`triaged → remediated → verified`) join as measured interventions carrying predicted and actual outcomes. Closes the loop between "signal detected" and "intervention-measured-effective"
  - *Motivation:* `audit: signal-provenance-audit Recommendation 3` | `phase-57.7-10-DEMO-REPORT.md §4 (grounded_in_0_interventions gap — no confirmed interventions exist to ground the metric)` | `audit-ref: post-popperian-machinery-audit recommends intervention-outcome pairs as strongest epistemic status`
- [ ] **PROV-13**: `tests/e2e/real-agent.test.js` `it.todo()` stubs replaced with working end-to-end chain tests (discuss → plan → execute → verify → collect-signals) against live agents. Opt-in via `RUN_REAL_AGENT_TESTS=true`; skipped in default `npm test`; runs on release tags in CI. Coverage includes: (1) signal collection chain produces role-split provenance; (2) signature blocks persist across all artifact stages; (3) cross-runtime parity holds when Claude and Codex both run the chain; and (4) downstream regression coverage explicitly exercises manual `/gsdr:signal` parity so the manual command / installed-skill path cannot silently drift from the automated chain
  - *Motivation:* `gap: the measurement substrate shipped through Phase 57.7 without automated E2E of the full workflow chain; tests/e2e/real-agent.test.js exists but is all it.todo()` | `enables: regression coverage for PROV-01..12 + future signal-system changes`
- [ ] **PROV-14**: Cross-runtime provenance parity — Claude and Codex both produce equivalent role-split provenance for the same phase executed on each runtime. Asymmetries surface explicitly in `measurement report cross_runtime_comparison` rather than failing silently or appearing as coincidental alignment
  - *Motivation:* `audit: signal-provenance-audit Finding 4 ("telemetry coverage is runtime-specific and asymmetric")` | `continuity: MEAS-ARCH-04 four-class symmetry markers apply to provenance fields too`
- [ ] **PROV-09.x**: *(placeholders — Stage-2 child requirements produced by PROV-09 per GOV-01 extraction contract; count and content TBD until Stage 1 research closes)*

### Cross-Runtime Parity

- [ ] **XRT-01**: Every hook-dependent v1.20 feature specifies its per-runtime substrate and Codex degradation / waiver path in phase CONTEXT.md before implementation begins. `capability-matrix.md` is updated when the feature ships, and stale blanket assumptions about hook absence are not acceptable evidence
  - *Motivation:* `research: cross-runtime-parity-research.md -- Codex hook availability is conditional / evolving, not flatly absent` | `audit: 2026-04-20-phase-58-structural-gates-gap-audit §5 -- per-gate Codex behavior must be explicit`
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
| GATE-09 | Phase 58 | Pending |
| XRT-01 | Phase 58 | Pending |
| MEAS-ARCH-01 | Phase 57.5 | Complete |
| MEAS-ARCH-02 | Phase 57.5 | Complete |
| MEAS-ARCH-03 | Phase 57.5 | Complete |
| MEAS-ARCH-04 | Phase 57.5 | Complete |
| MEAS-ARCH-05 | Phase 57.5 | Complete |
| MEAS-ARCH-06 | Phase 57.5 | Complete |
| MEAS-ARCH-07 | Phase 57.5 | Complete |
| MEAS-ARCH-08 | Phase 57.6 | Pending |
| MEAS-ARCH-09 | Phase 57.7 | Pending |
| MEAS-ARCH-10 | Phase 57.5 | Complete |
| MEAS-RUNTIME-01 | Phase 57.6 | Pending |
| MEAS-RUNTIME-02 | Phase 57.5 | Complete |
| MEAS-RUNTIME-03 | Phase 57.5 | Complete |
| MEAS-RUNTIME-04 | Phase 57.5 | Complete |
| MEAS-RUNTIME-05 | Phase 57.7 | Pending |
| MEAS-RUNTIME-06 | Phase 57.6 | Pending |
| MEAS-RUNTIME-07 | Phase 57.6 | Pending |
| MEAS-RUNTIME-08 | Phase 57.6 | Pending |
| MEAS-RUNTIME-09 | Phase 57.5 | Complete |
| MEAS-RUNTIME-10 | Phase 57.5 | Complete |
| MEAS-RUNTIME-11 | Phase 57.7 | Pending |
| MEAS-DERIVED-01 | Phase 57.5 | Complete |
| MEAS-DERIVED-02 | Phase 57.6 | Pending |
| MEAS-DERIVED-03 | Phase 57.6 | Pending |
| MEAS-DERIVED-04 | Phase 57.6 | Pending |
| MEAS-DERIVED-05 | Phase 57.5 | Complete |
| MEAS-DERIVED-06 | Phase 57.5 | Complete |
| MEAS-GSDR-01 | Phase 57.5 | Complete |
| MEAS-GSDR-02 | Phase 57.5 | Complete |
| MEAS-GSDR-03 | Phase 57.6 | Pending |
| MEAS-GSDR-04 | Phase 57.5 | Complete |
| MEAS-GSDR-05 | Phase 57.5 | Complete |
| MEAS-GSDR-06 | Phase 57.7 | Complete |
| KB-04b | Phase 59 | Complete |
| KB-04c | Phase 59 | Complete |
| KB-04d | Phase 59 | Complete |
| KB-06a | Phase 59 | Complete |
| KB-06b | Phase 59 | Complete |
| KB-07 | Phase 59 | Complete |
| KB-08 | Phase 59 | Complete |
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
| WF-01 | Phase 57.4 (pulled forward) | Pending |
| WF-02 | Phase 62 | Pending |
| WF-03 | Phase 62 | Pending |
| WF-04 | Phase 62 | Pending |
| WF-05a | Phase 57.1 | Complete |
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
| DISC-08 | Phase 57.2 | Pending |
| DISC-09 | Phase 57.2 | Pending |
| DISC-10 | Phase 57.2 | Pending |
| AUDIT-01 | Phase 57.3 | Pending |
| AUDIT-02 | Phase 57.3 | Pending |
| PAR-01 | Phase 64 | Pending |
| PAR-02 | Phase 64 | Pending |
| PAR-03 | Phase 64 | Pending |

**Coverage:**
- v1.20 requirements: 94 total
- Mapped to phases: 94
- Unmapped: 0

---
*Requirements defined: 2026-04-08*
*Last updated: 2026-04-16 -- added MEAS- family (34 requirements) + GATE-09 from measurement-infrastructure-epistemic-foundations deliberation and anomaly-stress-tests E1-E6 + E5.8*
