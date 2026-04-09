# Phase 57: Measurement & Telemetry Baseline - Discussion Log

> **Justificatory sidecar.** Consumed by gsdr-context-checker for claim verification.
> Also serves as human-readable audit trail of discuss-phase decisions.

**Date:** 2026-04-09
**Phase:** 57-measurement-telemetry-baseline
**Mode:** exploratory --auto --chain
**Areas discussed:** Data source strategy, Cross-runtime normalization, Progressive metric design, Philosophical grounding, Baseline scope and format, Output format and CLI design
**Notable context:** This is a re-discussion with the upgraded discuss-phase skill (Phase 57.2). Prior artifacts archived in `pre-upgrade-archive/` for comparison. User provided substantial pre-discussion input about measurement philosophy, progressive metrics, and cross-runtime requirements.

***

## Gray Areas (Audit Trail)

### Data Source Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Session-meta primary | Use pre-computed session-meta files as primary data source | ✓ |
| JSONL primary | Parse raw session logs for maximum granularity | |
| OTel primary | Use new OTel export as primary going-forward mechanism | |
| Hybrid | Session-meta for historical, OTel for going-forward | |

**Auto-selection:** [decided:reasoned] Session-meta primary — 268 files already available with rich behavioral data; OTel is going-forward only with no historical data; JSONL is 442MB+ with stability risks.
**Notes:** The landscape has changed significantly since prior CONTEXT.md was written. Claude Code now supports official OTel export (8 metrics, 5 event types). The schema should be OTel-compatible for future integration even though this phase reads session-meta files. User referenced monitoring-usage docs, costs docs, and Codex OTel config docs as canonical inputs.

### Cross-Runtime Normalization

| Option | Description | Selected |
|--------|-------------|----------|
| Claude-only, Codex later | Build Claude adapter now, defer Codex entirely to Phase 60 | |
| Schema-first | Design normalization schema now for both runtimes, implement Claude adapter only | ✓ |
| Dual adapter | Build both adapters now | |

**Auto-selection:** [assumed:reasoned] Schema-first — user explicitly stated "we aren't just developing this for Claude but also Codex." Designing the schema now while implementing only the Claude adapter is the pragmatic middle ground that respects both the cross-runtime design concern and the Phase 60 dependency.
**Notes:** The fundamental challenge is granularity mismatch: Claude Code session-meta provides per-session aggregates, Codex provides per-turn snapshots. The normalization schema must bridge this without lossy abstraction.

### Progressive Metric Design

| Option | Description | Selected |
|--------|-------------|----------|
| Flat metrics | 8 aggregate dimensions, no drill-down | |
| Progressive refinement | Metrics decompose into typed sub-metrics revealing deeper stories | ✓ |
| Hierarchical tree | Full metric taxonomy with arbitrary depth | |

**Auto-selection:** [governing:reasoned] Progressive refinement — user explicitly described the pattern: "errors per session → error types → error rate by tool → error rate by tool in context." This is a governing design principle, not just a feature request. It makes interventions "more determinate — fewer competing interpretations."
**Notes:** Session-meta already supports this: `tool_errors` (aggregate) → `tool_error_categories` (typed breakdown). The telemetry module should expose both levels and be extensible for deeper drill-down when JSONL correlation is available.

### Philosophical Grounding

| Option | Description | Selected |
|--------|-------------|----------|
| No philosophical framing | Pure engineering metrics | |
| Light touch | Document interpretive caveats per metric | |
| Integrated philosophy | Governing principles from measurement philosophy shape design | ✓ |

**Auto-selection:** [governing:reasoned] Integrated philosophy — user explicitly requested philosophers in the discussion: "bring in relevant philosophers... how we should design a 'telemetry' system and how we should relate to, interpret, respond to metrics." This is consistent with the project's epistemic rigor theme throughout v1.20.
**Notes:** Five philosophical principles grounded in Goodhart, Kuhn/Hanson, Mayo, Hacking, and a meta-principle of metric reflexivity. These are not decorative — they constrain design decisions (e.g., metrics as indicators not targets, epistemic humility convention for every metric output).

### Baseline Scope and Format

| Option | Description | Selected |
|--------|-------------|----------|
| Tokens only | Token metrics with distributions | |
| 8 dimensions | Prior research recommendation | |
| Extended with interpretive notes | 8+ dimensions with per-metric epistemic annotations | ✓ |

**Auto-selection:** [assumed:reasoned] Extended with interpretive notes — consistent with governing principles (every metric needs interpretive context) and user's emphasis on epistemic humility. The interpretive_notes field is the floor, not the ceiling.
**Notes:** baseline.json includes `token_validation` section (data quality transparency), `interpretive_notes` per metric (epistemic humility), and explicit n for facets-matched subsets (sampling transparency).

### Output Format and CLI Design

| Option | Description | Selected |
|--------|-------------|----------|
| JSON only | Machine-readable output | |
| Tables only | Human-readable output | |
| Convention-following | --raw for JSON, tables by default | ✓ |

**Auto-selection:** [decided:reasoned] Convention-following — established gsd-tools pattern used by all 18 existing lib modules. No reason to deviate.

### Claude's Discretion

- Exact table formatting and column widths
- Statistical computation implementation (streaming vs in-memory)
- Test fixture design
- Sparkline visualization decision
- Internal helper decomposition

### Deferred Ideas

- RTK integration testing as Phase 57.4 (user-suggested)
- Automated token sensor (v1.21)
- Cost calculation (downstream)
- OTel collector integration (going-forward)
- Bridge file extension (needs spike)
- Health-probe token-health dimension
- Quality-predictive metric identification
- Continental philosophy of memory (v1.22+)

***

## Claim Justifications

### Data Source Strategy

**[evidenced:cited] Session-meta files contain rich behavioral data beyond tokens**
- **Citation:** measurement-infrastructure-research.md §1, confirmed schema from 2 files with differing profiles
- **Verification:** Schema confirmed from actual files; 268 files enumerated at ~/.claude/usage-data/session-meta/

**[evidenced:cited] Facets files provide AI-generated session quality signals**
- **Citation:** measurement-infrastructure-research.md §2; 109 files at ~/.claude/usage-data/facets/
- **Verification:** Schema confirmed from actual files; fields include outcome, friction_counts, session_type

**[evidenced:cited] Claude Code now supports official OTel telemetry**
- **Citation:** https://code.claude.com/docs/en/monitoring-usage — fetched 2026-04-09
- **Verification:** Documented 8 metrics, 5 event types, env var configuration. This is NEW information not in prior research.

**[evidenced:cited] Codex CLI supports OTel via TOML config**
- **Citation:** https://developers.openai.com/codex/config-advanced#observability-and-telemetry — fetched 2026-04-09
- **Verification:** Documented TOML [otel] section, 5 metrics, 8 event types. This is NEW information not in prior research.

**[evidenced:cited] Session logs (JSONL) are 442MB+ with no stability guarantees**
- **Citation:** sig-2026-03-02-claude-code-session-logs-large-unstable
- **Verification:** Signal from Spike 002, confirmed by direct filesystem inspection

**[decided:reasoned] Session-meta is the primary historical data source**
- **Alternatives considered:** JSONL (too large/unstable), OTel (going-forward only), hybrid (adds complexity without clear benefit for baseline)
- **Why rejected:** JSONL has size/stability risks; OTel has no historical data; hybrid adds complexity for the first baseline
- **User said:** User provided monitoring-usage docs suggesting OTel awareness but did not override session-meta as primary

**[decided:reasoned] JSONL is NOT a primary data source**
- **Alternatives considered:** JSONL as primary (maximum granularity), JSONL as secondary drill-down
- **Why rejected:** 442MB+ size, no format stability guarantees, session-meta provides pre-computed aggregates
- **User said:** No direct statement, but user's emphasis on behavioral metrics (interruptions, response times) aligns with session-meta over raw JSONL

**[assumed:reasoned] Schema should be compatible with OTel conventions**
- **Challenge protocol:** If OTel conventions conflict with session-meta-derived schema, this assumption breaks
- **Evidence checked:** OTel metric naming (dot-separated, e.g., claude_code.token.usage) vs session-meta field names (snake_case). Some mapping needed but not fundamentally incompatible.
- **Why reasonable:** OTel is the industry standard for telemetry; Claude Code and Codex both support it; designing for compatibility now avoids refactoring later

**[projected:reasoned] Phase 60 will build Codex adapter**
- **Basis:** ROADMAP.md Phase 60 description: "Sensor Pipeline & Codex Parity" with requirement XRT-02
- **Future phase:** Phase 60, confirmed in ROADMAP.md, status: Not started

**[open] OTel export subcommand**
- **What's been tried:** Fetched Claude Code monitoring-usage docs; surveyed OTel metric/event schemas
- **Why unresolved:** Unclear whether OTel is strictly a collection mechanism or also useful as an export format from historical data
- **Research delegation:** Researcher should investigate whether OTel event format can represent session-meta records, and whether any downstream consumer would prefer OTel format over the native JSON

### Cross-Runtime Normalization

**[decided:cited] Focus on Claude Code + Codex CLI**
- **Citation:** MILESTONE-CONTEXT.md §Cross-Runtime Parity: "Focus on Claude Code + Codex CLI (the two active runtimes)"
- **Alternatives considered:** Including Gemini CLI and OpenCode
- **Why rejected:** Both deprecated as tested runtimes per deliberation `drop-gemini-opencode-focus-codex.md`

**[evidenced:cited] Different telemetry surfaces per runtime**
- **Citation:** telemetry-research-codex.md §4; measurement-infrastructure-research.md §1
- **Verification:** Claude Code has per-session aggregates; Codex has per-turn token snapshots. Confirmed by direct file inspection.

**[evidenced:cited] Codex token accounting is per-turn, not per-tool**
- **Citation:** telemetry-research-codex.md §4 — "three tool calls occur before one token_count event"
- **Verification:** Confirmed from two Codex session files (exec and interactive samples)

**[assumed:reasoned] Common normalized schema captures intersection**
- **Challenge protocol:** If the intersection is too small to be useful, separate schemas may be better
- **Evidence checked:** Both runtimes provide: session_id, duration, token counts, tool call information, model identity. Intersection is substantial.
- **Why reasonable:** Consumers (baseline, reflection, health) need a common interface. Runtime-specific extensions handle the differences.

**[open] Representation of runtime-only fields**
- **What's been tried:** Identified which fields are runtime-specific (user_interruptions Claude-only, reasoning_output_tokens Codex-only)
- **Why unresolved:** Multiple valid approaches (null fields, extension objects, runtime-specific sections) with different downstream implications
- **Research delegation:** Researcher should compare patterns from LangSmith, Langfuse, LiteLLM normalization approaches (documented in telemetry-research-codex.md §6)

**[open] Session enumeration abstraction**
- **What's been tried:** Documented directory structures (Claude: flat session-meta/, Codex: date-structured sessions/{Y}/{M}/{D}/)
- **Why unresolved:** Need to decide whether enumeration abstraction lives in telemetry.cjs or a shared helper
- **Research delegation:** Researcher should propose an enumeration interface that both runtime adapters can implement

### Progressive Metric Design

**[governing:reasoned] Progressive refinement principle**
- **Source:** User directive: "errors per session → error types → error rate by tool → error rate by tool in context"
- **Scope of governance:** Constrains metric design — every aggregate must have at least one typed decomposition. Prevents flat metric lists.

**[governing:reasoned] Every metric needs interpretive context**
- **Source:** MILESTONE-CONTEXT.md epistemic guardrail; telemetry-survey.md §"Important" preamble; user directive on epistemic humility
- **Scope of governance:** Constrains output format — every metric in human-readable and JSON output includes interpretive notes

**[decided:reasoned] Token usage at multiple granularities**
- **Alternatives considered:** Per-session only (simplest), per-phase only (most useful for intervention attribution)
- **Why rejected:** User explicitly wants all levels: "usage per session, usage per phase, usage per milestone, usage outside of phase and/or milestone"
- **User said:** Direct quote from pre-discussion input

**[evidenced:cited] Session-meta provides error taxonomy**
- **Citation:** measurement-infrastructure-research.md §1: `tool_error_categories` field confirmed with categories like "Command Failed", "File Not Found"
- **Verification:** Confirmed from actual session-meta files

**[assumed:reasoned] Behavioral metrics are first-class**
- **Challenge protocol:** If behavioral metrics (interruptions, response times) don't correlate with any meaningful outcome, they may be noise
- **Evidence checked:** user_interruptions is a dedicated field Claude Code chose to pre-compute, suggesting it's considered informative by the platform team. Facets correlation not yet tested.
- **Why reasonable:** User explicitly requested behavioral metrics; session-meta provides them; even without proven correlation, they are hypothesis-generating

**[open] Harness effectiveness metric**
- **What's been tried:** Reviewed DORA metrics, SPACE framework as precedents for composite engineering metrics
- **Why unresolved:** Composite metrics risk hiding important sub-metric variation (violating progressive refinement principle); but they also serve as useful summary indicators
- **Research delegation:** Researcher should evaluate whether a defensible composite exists or whether effectiveness is necessarily multi-dimensional

**[open] Additional behavioral patterns from session-meta**
- **What's been tried:** Enumerated all session-meta fields; identified first_prompt, message_hours[], user_response_times[] as candidates
- **Why unresolved:** Need empirical investigation across 268 sessions to determine which derived metrics are informative vs noise
- **Research delegation:** Researcher should run exploratory analysis on the 268-file corpus

### Philosophical Grounding

**[governing:reasoned] Goodhart's Law**
- **Source:** Charles Goodhart (1975), generalized by Marilyn Strathern. User directive: "use metrics responsibly"
- **Scope of governance:** Prevents metrics from becoming optimization targets in automation loops. Constrains how metrics are surfaced to agents.

**[governing:reasoned] Theory-ladenness of observation**
- **Source:** Thomas Kuhn (1962), N.R. Hanson (1958). User directive: "be epistemically humble"
- **Scope of governance:** Requires explicit measurement theory documentation — why we measure X, what X indicates, how X could mislead.

**[governing:reasoned] Severity of testing (Mayo)**
- **Source:** Deborah Mayo, "Statistical Inference as Severe Testing" (2018). Connects to MILESTONE-CONTEXT epistemic guardrail.
- **Scope of governance:** Constrains statistical methodology — distributions over point estimates, ability to show intervention failure, not just success.

**[governing:reasoned] Representing vs. Intervening (Hacking)**
- **Source:** Ian Hacking, "Representing and Intervening" (1983). User directive: "how we should relate to, interpret, respond to metrics"
- **Scope of governance:** Requires reflexivity about the telemetry system's own effects on the workflow it measures.

**[governing:reasoned] Metric reflexivity and openness**
- **Source:** User directive: "be open and responsive to when scenarios / situations call for more, different metrics instead of just naively accepting what we are measuring"
- **Scope of governance:** The measurement framework must support self-revision. Build extensibility into schema, not just code.

**[stipulated:reasoned] Epistemic humility convention (interpretive_notes)**
- **Acknowledged as choice:** Yes — this is a design choice to make interpretive context a structural requirement rather than optional documentation
- **Calibration evidence:** MILESTONE-CONTEXT.md and telemetry-survey.md both identify metric misinterpretation as a real risk
- **Reasonable range:** Could range from free-text notes (minimum) to structured interpretation templates (maximum). Free-text is the floor.

### Baseline Scope and Format

**[decided:reasoned] baseline.json before Phase 58**
- **Alternatives considered:** Baseline after Phase 58 (would contaminate data), rolling baseline (more complex)
- **Why rejected:** ARCHITECTURE.md anti-pattern 4: post-intervention baselines are contaminated. Rolling baseline adds complexity without clear benefit for v1.20.
- **User said:** No objection; consistent with requirements TEL-02

**[evidenced:cited] Token reliability questionable**
- **Citation:** measurement-infrastructure-research.md §1: "109 input_tokens for 23 user messages / 84 assistant messages"; STATE.md blocker
- **Verification:** Confirmed from actual session-meta file. 109 input_tokens for a 513-minute session with 84 assistant messages is implausibly low.

**[decided:reasoned] Inline validation task**
- **Alternatives considered:** Formal spike (heavier), skip validation (risky), defer baseline to after validation (delays Phase 58)
- **Why rejected:** Formal spike is too heavy for a bounded binary question; skipping validation would commit potentially misleading baselines; deferring would block Phase 58
- **User said:** No objection; aligns with STATE.md blocker language

**[assumed:reasoned] token_validation section in baseline.json**
- **Challenge protocol:** If token validation reveals session-meta tokens are perfectly reliable, the section is unnecessary overhead
- **Evidence checked:** Current evidence strongly suggests unreliability (109 vs expected thousands)
- **Why reasonable:** Even if tokens are reliable, documenting the validation methodology is good practice

**[assumed:reasoned] Statistical distributions for numeric fields**
- **Challenge protocol:** If the distribution is highly skewed or multimodal, standard percentiles may be misleading
- **Evidence checked:** Session duration distribution is likely skewed (some sessions are minutes, others are hours)
- **Why reasonable:** Reporting min/p25/median/p75/p90/max captures shape better than mean±std. Additional distribution characterization (skewness, modality) is Claude's discretion.

**[stipulated:reasoned] 41% facets coverage, n reported**
- **Acknowledged as choice:** Yes — 41% is the coverage we have; reporting n makes the limitation transparent
- **Calibration evidence:** 109 of 268 sessions have facets data. Coverage is determined by Claude Code's facets generation, not by us.
- **Reasonable range:** Any coverage >0 is useful for hypothesis generation; >30% supports exploratory statistics. 41% is adequate for this purpose.

**[open] Cross-runtime baseline format**
- **What's been tried:** Reviewed current baseline.json schema from pre-upgrade-archive
- **Why unresolved:** Including runtime dimension now creates empty structure; omitting it requires schema migration in Phase 60
- **Research delegation:** Researcher should evaluate migration cost vs. premature abstraction tradeoff

### Claim Dependencies

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| [decided] Session-meta is primary data source | [evidenced] 268 files exist with rich schema | LOW |
| [decided] baseline.json before Phase 58 | [decided] Inline token validation | MEDIUM |
| [assumed] Schema compatible with OTel | [open] Q1 OTel architecture | MEDIUM |
| [assumed] Behavioral metrics are first-class | [evidenced] session-meta has user_interruptions, tool_error_categories | LOW |
| [governing] Progressive refinement design | [evidenced] tool_error_categories provides type breakdown | LOW |
| [stipulated] Facets on 41% subset | [evidenced] 109 of 268 sessions have facets | LOW |
| [projected] Phase 60 Codex adapter | [open] Q2 normalization schema | HIGH |
| [governing] Goodhart's Law constraint | [governing] Metrics as indicators, not targets | LOW |

***

## Context-Checker Verification Log

**Checked:** 2026-04-09
**Agent:** gsdr-context-checker

### Typed Claim Verification

| Claim | Type | Verification | Status | Issue |
|-------|------|-------------|--------|-------|
| Session-meta files contain rich behavioral data... | evidenced | cited | PASS | Citation resolves: measurement-infrastructure-research.md exists; §1 content confirmed (tool_error_categories, user_interruptions confirmed present) |
| Facets files provide AI-generated session quality signals | evidenced | cited | PASS | Citation resolves: measurement-infrastructure-research.md §2 confirmed; 109 files counted at filesystem path |
| Claude Code now supports official OTel telemetry | evidenced | cited | PASS | URL cited; cannot directly resolve web URL, but claim is corroborated by spk-008 DECISION.md which confirms session.count emitted. NOTE: full 8-metric catalog not yet confirmed -- only session.count observed. WARN-level: claim asserts "8 metrics" per documentation but empirical confirmation is partial. |
| Codex CLI supports OTel via TOML [otel] section | evidenced | cited | WARN | URL cited; Codex [otel] section existence confirmed by spk-008 DECISION.md (error message lists valid values). However, CONTEXT.md line 23 "supports OTel via TOML config" omits that console exporter does not work and local inspection requires OTLP infrastructure. The claim is technically accurate (the config section exists) but partially misleading given Spike 008 findings. Caveat is preserved in Spike section (line 170) but not in the Current State paragraph (line 23). |
| Session logs (JSONL) are 442MB+ per project | evidenced | cited | PASS | Signal file confirms: sig-2026-03-02-claude-code-session-logs-large-unstable.md explicitly records 181 sessions = 442MB for one project |
| Session-meta is the primary historical data source | decided | reasoned | PASS | Alternatives considered: JSONL (too large), OTel (going-forward only), hybrid (complexity). DISCUSSION-LOG records all three. Justification complete. |
| JSONL is NOT a primary data source | decided | reasoned | PASS | Alternatives considered in DISCUSSION-LOG. Justification adequate. |
| Schema should be compatible with OTel conventions | assumed | reasoned | PASS | Challenge protocol recorded: "If OTel conventions conflict with session-meta-derived schema, this assumption breaks." Reasonable. |
| Phase 60 will build Codex adapter | projected | reasoned | PASS | ROADMAP.md Phase 60 confirmed to exist with status "Not started"; XRT-02 requirement confirmed. |
| OTel export subcommand | open | bare | PASS | Research delegation recorded. What-has-been-tried documented. |
| Focus on Claude Code + Codex CLI as two active runtimes | decided | cited | PASS | MILESTONE-CONTEXT.md §Cross-Runtime Parity confirmed to exist; deliberation drop-gemini-opencode-focus-codex.md confirmed to exist. |
| Different telemetry surfaces per runtime | evidenced | cited | PASS | telemetry-research-codex.md §4 confirmed; per-turn vs per-session confirmed in file. |
| Codex token accounting is per-turn, not per-tool | evidenced | cited | PASS | telemetry-research-codex.md §4 line confirmed: "three tool calls occur before one token_count event" |
| Common normalized schema captures intersection | assumed | reasoned | PASS | Challenge protocol: "If intersection too small..." Evidence checked. Reasonable. |
| Progressive refinement principle | governing | reasoned | PASS | Source attributed to user directive. Scope of governance defined. |
| Every metric needs interpretive context | governing | reasoned | PASS | Source: MILESTONE-CONTEXT.md epistemic guardrail confirmed. |
| Token usage at multiple granularities | decided | reasoned | PASS | Alternatives: per-session only, per-phase only. Rejected because user explicitly stated all levels. Direct quote cited in DISCUSSION-LOG. |
| Session-meta provides error taxonomy | evidenced | cited | PASS | measurement-infrastructure-research.md §1 confirmed: tool_error_categories field with example values present. |
| Behavioral metrics are first-class | assumed | reasoned | PASS | Challenge protocol recorded. Evidence checked (user_interruptions field exists). Reasonable. |
| Harness effectiveness metric (open) | open | bare | PASS | Research program recorded. What-has-been-tried documented. |
| Goodhart Law, Theory-ladenness, Mayo severity, Hacking, reflexivity | governing | reasoned | PASS | Sources named (Goodhart 1975, Kuhn 1962, Hanson 1958, Mayo 2018, Hacking 1983). Scope defined per claim. |
| Epistemic humility convention (interpretive_notes) | stipulated | reasoned | PASS | Acknowledged as design choice. Calibration evidence cited. Reasonable range stated. |
| baseline.json before Phase 58 | decided | reasoned | PASS | Alternatives considered: post-Phase-58 (contaminated), rolling (complex). ARCHITECTURE.md anti-pattern 4 verified to exist at .planning/research/ARCHITECTURE.md line 563. |
| Token count reliability RESOLVED by Spike A | evidenced | cited | PASS | spk-004 DECISION.md confirmed to exist. Numbers match: 513-min session with 109 input_tokens, 84 API calls, 1.30 tokens/call. 0-8% output match confirmed. |
| token_validation section in baseline.json | assumed | reasoned | PASS | Challenge protocol: if tokens are reliable, section unnecessary but still good practice. |
| Statistical distributions for numeric fields | assumed | reasoned | PASS | Challenge protocol: if distribution skewed/multimodal, percentiles mislead. Evidence of likely skew noted. |
| Facets on 41% subset with n reported (stipulated) | stipulated | reasoned | PASS | Acknowledged as choice. Coverage confirmed: 109/268 = 40.7% confirmed by filesystem count. |
| DC-1: Zero external dependencies | evidenced | cited | PASS | PROJECT.md confirms zero-dependency philosophy (lines 178, 215, 225). kb.cjs uses node:sqlite built-in confirmed. |
| DC-2: Node.js >= 22.5.0 | evidenced | cited | PASS | REQUIREMENTS.md KB-11 confirmed at line 74. |
| DC-3: Codex adapter is Phase 60 scope | decided | cited | PASS | ROADMAP.md Phase 60 confirmed. |
| DC-4: Cost calculation excluded | decided | cited | PASS | measurement-infrastructure-research.md §3 area confirmed (constraint from MILESTONE-CONTEXT mentioned). |
| DC-5: Token reliability resolved | evidenced | cited | PASS | Duplicate of Spike A claim -- both resolve to spk-004 DECISION.md. |
| DC-6: Don't design token tooling around current pricing | governing | cited | PASS | MILESTONE-CONTEXT.md Derived Constraint 4 confirmed at line 74: "Don't design token tooling around current pricing" |
| DC-7: Don't bake KB storage format into sensor pipeline | governing | cited | PASS | MILESTONE-CONTEXT.md Derived Constraint 1 confirmed at line 71. |
| input_tokens is NOT a workload proxy | evidenced | cited | PASS | spk-004 DECISION.md confirmed. Numbers match: 513-min session, 109 tokens, 84 calls, cache-hit 99.3-100%. |
| output_tokens IS a reliable workload proxy | evidenced | cited | PASS | spk-004 DECISION.md confirmed. 0-8% JSONL match for clean sessions. |
| JSONL aggregation is ALSO unreliable | evidenced | cited | PASS | spk-004 DECISION.md confirmed: streaming duplication and /continue inheritance documented. |
| friction_counts vs user_interruptions rho=0.55 N=106 | evidenced | cited | PASS | spk-005 DECISION.md confirmed. Exact rho=0.55, N=106 (109 facets - 3 malformed), zero-friction 87.5% zero-interruption. |
| session_type vs duration 10x span | evidenced | cited | PASS | spk-005 DECISION.md confirmed. single_task 6min vs multi_task 76min median. |
| outcome vs tool_errors NOT correlated | evidenced | cited | PASS | spk-005 DECISION.md confirmed. fully_achieved mean 1.15 vs partially_achieved 1.21. |
| claude_helpfulness inverse relationship | evidenced | cited | PASS | spk-005 DECISION.md confirmed. unhelpful sessions = 0 errors because abandoned/zero-work. |
| message_hours_entropy r=0.48 N=264 | evidenced | cited | PASS | spk-006 DECISION.md confirmed. Pearson r=0.4805 with tool_errors, r=0.4513 with interruptions, N=264. |
| first_prompt_category: GSD 1.14 vs ad-hoc 2.26, 47% fewer interruptions | evidenced | cited | PASS | spk-006 DECISION.md confirmed. GSD commanded=1.14, Ad-hoc=2.26, 47% fewer interruptions ("~50% lower tool error rates and ~47% lower interruption rates"). |
| user_response_times weak signal r=0.33, 54% missing | evidenced | cited | PASS | spk-006 DECISION.md confirmed. r=0.3321, 45.7% coverage (=54.3% missing -- CONTEXT.md rounds to 54%). |
| 229/268 sessions (85.4%) clean; 16 caveated; 23 excluded | evidenced | cited | PASS | spk-007 DECISION.md confirmed. Exact numbers match. |
| Ghost-initiation sessions date-clustered (2026-02-26 to 2026-03-15) | evidenced | cited | PASS | spk-007 DECISION.md confirmed. Date range exact match. |
| 19,996-minute session is genuine 14-day recording | evidenced | cited | PASS | spk-007 DECISION.md confirmed. user_message_timestamps validate span. |
| Session-meta files batch-regenerated (264/265 have mtime 1.9-39 days after start_time) | evidenced | cited | PASS | spk-007 DECISION.md confirmed. 264/265 parseable sessions confirmed. Median mtime lag 6.2 days, p95=28.2 days. |
| 54% user_response_times gap confirmed in clean subset | evidenced | cited | PASS | spk-007 DECISION.md confirmed. 52.8% missing in clean subset (121/229). |
| 103/265 sessions have macOS /Users/ paths | evidenced | cited | PASS | spk-007 DECISION.md line 200 confirmed: "103/265 sessions have /Users/rookslog/ project paths (macOS)". |
| Trust tier rules (deterministic) | evidenced | cited | PASS | spk-007 DECISION.md confirmed. Rules: exclude if JSON parse failure OR (assistant_message_count=0 AND output_tokens=0). 421fa72b borderline slipthrough documented. Already typed by prior context-checker run. |
| Codex v0.118.0 rejected exporter=console | evidenced | cited | PASS | spk-008 DECISION.md confirmed. Exact error message documented. Valid values: none, statsig, otlp-http, otlp-grpc. |
| Codex JSONL token_count events confirmed rich | evidenced | cited | PASS | spk-008 DECISION.md confirmed. per-turn tokens, reasoning_output_tokens, model_context_window, rate_limits with plan_type. |
| Codex 10K token context truncation (turn_context.truncation_policy) | evidenced | cited | PASS | spk-008 DECISION.md confirmed. "mode: tokens, limit: 10000" documented as undocumented finding. |
| Claude Code console OTel works -- session.count emitted | evidenced | cited | PASS | spk-008 DECISION.md confirmed. claude_code.session.count COUNTER confirmed with identity attributes. |
| gsdr-statusline.js writes only 4 of 14+ fields to bridge file | evidenced | cited | PASS | spk-008 DECISION.md confirmed. Lines 41-46 extension point. 4 fields written, 12+ unwritten. |
| [assumed:reasoned] Tier 2 spikes produce better science than Tier 1 | assumed | reasoned | PASS | Already typed by prior context-checker run. Challenge: "assumes Tier 2 improvement not due to confounders" noted. |
| router case kb at line 684 in gsd-tools.cjs | decided | reasoned | PASS | grep confirmed: line 684 of gsd-tools.cjs contains "case 'kb':" |
| 18 existing lib modules | decided | reasoned | PASS | Filesystem count confirmed: 18 .cjs files in get-shit-done/bin/lib/ |

### Untyped Claims Surfaced

| Claim Text | Proposed Type | Location | Severity | Rationale |
|-----------|---------------|----------|----------|-----------|
| "GSD sessions have 53% fewer errors and 47% fewer interruptions than ad-hoc" (Spike-derived follow-up, line 405) | [assumed:bare] | spikes section, From Spike E, line 405 | WARN | Load-bearing: drives Q4 and the causal research program. The "53%" figure is NOT in spk-006 DECISION.md, which says "~50% lower tool error rates" (1.14 vs 2.26 = 49.6%). Source of "53%" is unknown -- likely overstated. Should be corrected to ~50% and cited. Tagged in CONTEXT.md with correction comment. |
| "Spike A (token reliability -- awaiting results)" under Spike Execution Summary (line 411-412) | stale fact | spikes section, Spike Execution Summary | WARN | Internal contradiction: lines 89, 128, and the Resolved table (line 424) all confirm Spike A is RESOLVED. The Spike Execution Summary still says "Running." This is a stale update artifact. Tagged in CONTEXT.md. |
| "Some of the most valuable metrics are things neither Claude Code nor Codex tracks -- they can only be computed by us" (Current state preamble, line 74) | [assumed:bare] | working_model Progressive Metric Design current state | WARN | Load-bearing: justifies the entire "harness-computed metrics" design direction (phase-correlated metrics, harness effectiveness metrics). Not typed, not evidenced, not challenged. The Spike E finding (first_prompt_category, message_hours_entropy) is correctly cited as demonstration, but the broader claim that computed metrics are "most valuable" is an assumption, not a finding. The subsequent typed bullets [assumed:reasoned] on phase-correlated and harness-effectiveness metrics are correctly typed -- but the preamble sentence making the broader claim is untyped. INFO-level since the typed bullets immediately below it carry the epistemic weight. |
| "Codex CLI stores per-session JSONL at ~/.codex/sessions/ and supports OTel via TOML config" (Current state, line 23) | [evidenced:bare] | working_model Data Source Strategy current state | INFO | Partially supported by spk-008 (Codex JSONL confirmed) and external docs (TOML section exists). The OTel part is misleading without the caveat that console exporter is unavailable. Not load-bearing since the typed bullets below fully qualify this. The Spike 008 section and Q1 carry the caveat forward correctly. |

### Dependency Chain Audit

| Chain | Verdict |
|-------|---------|
| [decided] Session-meta primary -> [evidenced] 268 files with rich schema | PASS: LOW vulnerability is accurate. 268 files confirmed at filesystem, schema confirmed in measurement-infrastructure-research.md. |
| [decided] baseline.json before Phase 58 -> [decided] Inline token validation | PASS: MEDIUM vulnerability is accurate. Both decided claims. Token validation is now moot given Spike A resolved token reliability -- but the decision to do inline validation is still reasonable. |
| [assumed] Normalized schema compatible with OTel -> [open] Q1 OTel architecture | PASS: MEDIUM vulnerability is accurate. Spike 008 has partially updated Q1 (Codex OTel console unavailable; normalization must bridge OTel + JSONL). The assumed claim is now more tenuous given Spike 008 findings, but vulnerability is correctly marked MEDIUM. |
| [assumed] Behavioral metrics first-class -> [evidenced] session-meta has user_interruptions, tool_error_categories | PASS: LOW vulnerability accurate. Fields confirmed in measurement-infrastructure-research.md. |
| [governing] Progressive refinement -> [evidenced] tool_error_categories provides type breakdown | PASS: LOW vulnerability accurate. Governing principle not fragile. |
| [stipulated] Facets 41% subset -> [evidenced] 109 of 268 have facets | PASS: LOW vulnerability accurate. 109/268 = 40.7% confirmed by filesystem count. |
| [projected] Phase 60 Codex adapter -> [open] Q2 normalization schema | PASS: HIGH vulnerability is accurate. Phase 60 exists in ROADMAP.md but schema is unresolved. Spike 008 makes schema harder (must bridge OTel + native JSONL, not just two OTel streams). HIGH is correct and may be understated. |
| [governing] Goodhart Law -> [governing] Metrics as indicators not targets | PASS: LOW vulnerability accurate. Meta-level principle; no empirical dependency. |
| Unrecorded dependency: [evidenced:cited] Codex console OTel rejected -> [assumed:reasoned] Schema compatible with OTel | WARN: The Spike 008 finding that Codex has no console OTel and normalization must bridge structurally different sources directly weakens the [assumed:reasoned] schema-OTel-compatibility claim. This dependency is not in the dependency table. The claim acknowledges OTel architecture as MEDIUM vulnerability (Q1), so it is captured implicitly, but the specific spike finding that changes the normalization picture is not explicitly recorded as a dependency update. |

### Spike Caveat Preservation Audit

The user explicitly requested verification that spike caveats are not stripped in downstream presentation.

| Caveat | Preserved? | Location |
|--------|-----------|----------|
| Spike 008 CRITICAL CAVEAT: Codex console rejection may reflect our test setup error, not Codex limitation | YES | CONTEXT.md line 170, Q1 (line 213), Still Open table (line 435) |
| Spike 008: Claude Code OTel catalog incomplete (only session.count observed) | YES | CONTEXT.md line 164, Still Open table (line 441) |
| Spike E unexamined confounders: GSD vs ad-hoc may be selection bias, causation not established | YES | CONTEXT.md line 150 (Unexamined confounders), line 404-405, Still Open table (line 432) |
| Spike E: Pearson r on non-normal distributions may overstate linear relationship | YES | CONTEXT.md line 150 |
| Spike C unexamined confounder: session length may drive rho=0.55 (partially spurious) | YES | CONTEXT.md line 130 |
| Spike 007 self-critique: classification may be too permissive for token-sensitive analysis | YES | CONTEXT.md line 151 |
| Tier 1 spike methodology caveats: no confidence intervals, no systematic confounders, multiple comparison inflation | YES | CONTEXT.md lines 104-110 |

All seven spike caveats confirmed preserved. Codex OTel CRITICAL CAVEAT is explicitly maintained in three locations and not presented as settled anywhere.

### Summary

- **Typed claims checked:** 55
- **Pass:** 53 | **Warn:** 2 | **Fail:** 0
- **Untyped claims surfaced:** 4 (1 WARN load-bearing, 1 WARN stale-status, 1 INFO preamble, 1 INFO current-state)
- **Dependency vulnerabilities:** 1 unrecorded (Spike 008 -> assumed OTel compatibility); 8 recorded chains all accurate
- **Spike caveat preservation:** 7/7 caveats confirmed preserved including Codex OTel CRITICAL CAVEAT
- **Citation integrity:** All file-based citations resolve. Web URL citations (2) unverifiable by filesystem but corroborated by spike findings.
- **Key finding:** "53% fewer errors" claim (line 405) does not appear in source spike (spk-006 says "~50%"). Tagged in CONTEXT.md. Not FAIL because it is in free-text prose (Spike-derived follow-up section), not an [evidenced:cited] typed claim. But it is a load-bearing number that drives the headline causal question.
- **Internal inconsistency:** Spike Execution Summary says Spike A "Running" but rest of document (3 locations) shows it RESOLVED. Tagged in CONTEXT.md.
- **Overall severity:** WARN
