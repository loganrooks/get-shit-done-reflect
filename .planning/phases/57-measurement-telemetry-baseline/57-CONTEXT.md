# Phase 57: Measurement & Telemetry Baseline - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Exploratory --auto --chain — preserving uncertainty, auto-progression by type rules

<domain>
## Phase Boundary

Telemetry extraction tooling captures a pre-intervention baseline so that structural changes in subsequent phases can be attributed to specific interventions. Delivers `gsd-tools telemetry` subcommands (summary, session, phase, baseline, enrich) and a committed `.planning/baseline.json` before Phase 58 begins.

This is NOT a token-counting utility. It is a measurement infrastructure for understanding how the harness is performing, how interventions change that performance, and what stories the data tells at progressively deeper levels of specificity. Token usage is one dimension among many.

Requirements: TEL-01a, TEL-01b, TEL-02, TEL-04, TEL-05

</domain>

<working_model>
## Working Model & Assumptions

### Data Source Strategy

**Current state:** Claude Code stores pre-computed session analytics in `~/.claude/usage-data/session-meta/` (268 files) and AI-generated quality assessments in `~/.claude/usage-data/facets/` (109 files). Raw JSONL at `~/.claude/projects/` contains per-message detail. Claude Code now also supports official OTel export (8 metrics, 5 event types). Codex CLI stores per-session JSONL at `~/.codex/sessions/` and supports OTel via TOML config.

- [evidenced:cited] Session-meta files contain rich behavioral data beyond tokens: `user_interruptions`, `user_response_times[]`, `tool_counts` (per-tool), `tool_errors`, `tool_error_categories` (Command Failed, File Not Found, etc.), `git_commits`, `lines_added/removed`, `message_hours[]` — confirmed by measurement-infrastructure-research.md §1
- [evidenced:cited] Facets files provide AI-generated session quality signals: `outcome` (fully_achieved/partially_achieved), `friction_counts` + `friction_detail`, `session_type`, `user_satisfaction_counts`, `claude_helpfulness` — confirmed by measurement-infrastructure-research.md §2
- [evidenced:cited] Claude Code now supports official OTel telemetry with `CLAUDE_CODE_ENABLE_TELEMETRY=1`: 8 metrics (session.count, lines_of_code, pull_request, commit, cost.usage, token.usage with type breakdown, code_edit_tool.decision, active_time.total), 5 event types (user_prompt, tool_result, api_request with cost_usd, api_error, tool_decision) — confirmed by https://code.claude.com/docs/en/monitoring-usage
- [evidenced:cited] Codex CLI supports OTel via TOML `[otel]` section: 5 metrics (api_request counter, api_request.duration_ms, sse_event, tool.call counter, tool.call.duration_ms), 8 event types — confirmed by https://developers.openai.com/codex/config-advanced#observability-and-telemetry
- [evidenced:cited] Session logs (JSONL) are 442MB+ per project with no format stability guarantees — sig-2026-03-02-claude-code-session-logs-large-unstable
- [decided:reasoned] Session-meta is the primary historical data source for Claude Code baseline — OTel captures going-forward only, no retroactive historical data; session-meta has 268 pre-computed sessions ready for analysis
- [decided:reasoned] JSONL is NOT a primary data source for routine extraction due to size and stability constraints — use session-meta pre-aggregates instead, with JSONL reserved for drill-down investigation
- [assumed:reasoned] The telemetry module should design its normalized output schema to be compatible with OTel conventions — even though this phase reads session-meta files, the schema should not preclude future OTel integration
- [projected:reasoned] Phase 60 (Sensor Pipeline & Codex Parity) will build the Codex session data adapter and automated collection — this phase builds Claude Code adapter and the normalization schema that Codex plugs into
- [open] Should the telemetry module include a `telemetry export` subcommand that writes OTel-compatible event data from session-meta? Or is OTel strictly a going-forward collection mechanism?

### Cross-Runtime Normalization

**Current state:** Claude Code and Codex CLI expose fundamentally different telemetry surfaces. Claude Code has pre-computed session-meta (268 files), AI-generated facets (109 files), and rich JSONL. Codex CLI has per-turn JSONL with `token_count` events and `turn_context` but no equivalent of session-meta or facets. OTel support exists for both but with different metric surfaces.

- [decided:cited] Focus on Claude Code + Codex CLI as the two active runtimes — per MILESTONE-CONTEXT.md §Cross-Runtime Parity; Gemini CLI and OpenCode deprecated
- [evidenced:cited] Claude Code session-meta provides per-session aggregates (tool_counts, tool_errors, user_interruptions, tokens, git metrics) while Codex provides per-turn token snapshots and turn_context metadata — confirmed by telemetry-research-codex.md §4
- [evidenced:cited] Codex token accounting is per-turn, not per-tool-call — multiple tool calls occur before one `token_count` event; per-tool token attribution is not possible from Codex session logs — confirmed by telemetry-research-codex.md §4
- [assumed:reasoned] Common normalized schema should capture the intersection: session_id, runtime, model, duration, token_totals, tool_call_counts, error_counts, error_categories — with runtime-specific extensions for fields only one runtime provides
- [assumed:reasoned] This phase builds the Claude Code adapter and defines the normalization schema; Codex adapter is Phase 60 scope — but the schema must be designed now to accommodate Codex's different data shape (per-turn vs per-session)
- [open] How should the normalization schema represent data that only one runtime provides? E.g., `user_interruptions` (Claude Code only), `reasoning_output_tokens` (Codex only), `facets.outcome` (Claude Code only). Null fields? Runtime-specific extension objects? The schema design has downstream implications for every consumer.
- [open] Codex session discovery uses date-structured directories (`~/.codex/sessions/{YYYY}/{MM}/{DD}/`) vs Claude Code's flat `session-meta/`. How should session enumeration be abstracted?

### Progressive Metric Design

**Current state:** Prior CONTEXT.md listed 8 flat baseline dimensions. The user explicitly wants metrics that reveal progressively deeper stories — not just "errors per session" but "what types of errors, in what contexts, telling what story about what interventions are needed."

- [governing:reasoned] Metrics must be designed for progressive refinement: each aggregate metric should decompose into typed sub-metrics that reveal the story behind the number. "Errors per session" → "error types per session" → "error rate by tool" → "error rate by tool in context (testing vs. file manipulation)." The refinement levels make interventions more determinate — fewer competing interpretations to sift through. This is a design principle, not a per-metric requirement.
- [governing:reasoned] Every metric needs interpretive context — numbers are not self-evident. A low interruption rate could mean quality work OR user disengagement. A high tool error rate during exploration is categorically different from high errors during execution. The telemetry system must pair measurements with the context needed to interpret them responsibly. — per MILESTONE-CONTEXT.md epistemic guardrail
- [decided:reasoned] Token usage metrics must span multiple granularities: per-session, per-phase, per-milestone, and out-of-phase/milestone (infrastructure, maintenance, exploration sessions that don't map to a phase). Different granularities tell different stories about where tokens go.
- [evidenced:cited] Session-meta already provides error taxonomy via `tool_error_categories` (e.g., "Command Failed": 3, "File Not Found": 1) — this is the existing progressive refinement data; confirmed by measurement-infrastructure-research.md §1
- [evidenced:cited] Session-meta provides per-tool attribution via `tool_counts` (Bash: 28, Read: 8, Agent: 4, etc.) — enabling tool-specific error rates (tool_errors_for_tool / tool_count_for_tool), though this requires JSONL correlation for per-tool error breakdown
- [assumed:reasoned] Behavioral metrics beyond tokens are first-class: `user_interruptions` as frustration signal, `user_response_times[]` as engagement pattern, `tool_error_categories` as intervention targeting, `session_type` (from facets) as context segmentation. These are not secondary to tokens — they may be MORE informative about harness effectiveness.
- [open] Can we derive a meaningful "harness effectiveness" metric — or is effectiveness necessarily multi-dimensional and domain-specific? Research should investigate whether there's a defensible composite, or whether keeping dimensions separate is more epistemically honest.
- [open] What additional behavioral patterns can be reliably extracted from session-meta? E.g., can `first_prompt` text analysis detect GSD command usage patterns? Can `message_hours[]` distribution reveal session fragmentation? Can `user_response_times[]` variance indicate frustration vs. thoughtful deliberation?

### Philosophical Grounding for Measurement Design

**Current state:** The MILESTONE-CONTEXT warns "don't treat metrics as self-evident" and the telemetry-survey notes every metric has multiple explanations. The user wants philosophers brought into the discussion to ground responsible metric design.

- [governing:reasoned] **Goodhart's Law** (Charles Goodhart): "When a measure becomes a target, it ceases to be a good measure." If we optimize for reducing error rate, agents might suppress errors rather than fix root causes. Telemetry metrics must be monitored indicators, not optimization targets — the distinction must be architecturally enforced, not just documented. This governs how metrics are surfaced to agents and automation.
- [governing:reasoned] **Theory-ladenness of observation** (Kuhn/Hanson): What we choose to measure embeds assumptions about what a "good" session looks like. No metric is theory-neutral. The telemetry system should make its measurement theory explicit: we measure X because we believe X indicates Y, and here is how X could mislead us. DISCUSSION-LOG.md should record the interpretive framework for each metric.
- [governing:reasoned] **Severity of testing** (Deborah Mayo): A metric only counts as evidence for an intervention's effectiveness if the metric COULD HAVE shown the opposite result. If our baseline can't distinguish intervention effects from natural variation, the baseline is not evidence. This constrains statistical methodology: distributions, not just medians; confidence intervals, not just point estimates.
- [governing:reasoned] **Representing vs. Intervening** (Ian Hacking): Metrics both represent the system AND intervene in it — measuring changes what developers and agents attend to. The telemetry system should be reflexive about its own effects on the workflow it measures. When we add a metric, ask: "How will knowledge of this metric change behavior, and is that change desirable?"
- [governing:reasoned] **Metric reflexivity and openness** — the measurement framework must be open to its own revision. When a scenario or situation reveals that current metrics are insufficient, misleading, or asking the wrong question, the system should support adding, modifying, or retiring metrics without treating the current measurement set as canonical. Good measurement design includes the metacognitive capacity to question whether you're measuring the right things.
- [stipulated:reasoned] **Epistemic humility convention**: Every metric output (human-readable and JSON) includes an `interpretive_notes` field documenting what the metric measures, what it does NOT measure, and at least one way the metric could mislead. This is a floor requirement per the governing principles above, not optional documentation.

### Baseline Scope and Format

**Current state:** Research identified 8 baseline dimensions with statistical distributions. Token reliability is flagged as a blocker in STATE.md.

- [decided:reasoned] `.planning/baseline.json` must be committed before Phase 58 structural gates ship — preserves ability to attribute changes to specific interventions; this is the core purpose of the phase (TEL-02)
- [evidenced:cited] Token count reliability RESOLVED by Spike A (spk-004): `input_tokens` is post-cache residual (1-3 tokens/call), NOT a workload proxy. `output_tokens` IS reliable (0-8% JSONL match). Recommended hierarchy: output_tokens (primary) > assistant_message_count > input_tokens (cache-miss indicator only). See spike findings section for full characterization and caveats. STATE.md blocker cleared.
- [assumed:reasoned] baseline.json includes a `token_validation` section documenting which token source was used, comparison methodology, and known limitations — transparency about data quality is non-negotiable given the token reliability concern
- [assumed:reasoned] Statistical distributions (min, p25, median, p75, p90, max) for numeric fields — standard approach for baseline characterization that supports severity-of-testing (Mayo) by showing the full distribution, not just central tendency
- [stipulated:reasoned] Facets-derived metrics computed on facets-matched subset only (109 of 268 sessions = 41% coverage), with n explicitly reported — acknowledged sampling limitation per TEL-05 annotation requirement. 41% is sufficient for hypothesis generation, not for definitive claims.
- [assumed:reasoned] baseline.json should include per-metric `interpretive_notes` consistent with the epistemic humility convention — each baseline dimension annotated with what it measures, what it doesn't, and how it could mislead
- [open] What format should the cross-runtime baseline take when Codex adapter arrives in Phase 60? Should baseline.json include a `runtime` dimension now (all current data is Claude Code), or wait until Phase 60 to introduce runtime segmentation?

### Output Format and CLI Design

**Current state:** gsd-tools follows established conventions: `--raw` for JSON, human-readable tables by default, output()/error() from core.cjs.

- [decided:reasoned] `--raw` flag for JSON output; default is human-readable tables — follows established gsd-tools convention (kb.cjs, sensors.cjs)
- [decided:reasoned] Module follows `lib/telemetry.cjs` pattern with `cmdTelemetry{Subcommand}(cwd, options, raw)` signatures — consistent with existing 18 lib modules
- [decided:reasoned] Uses `output()` and `error()` from core.cjs, `atomicWriteJson()` for baseline file writes — existing infrastructure
- [decided:reasoned] Router addition: `case 'telemetry':` in gsd-tools.cjs switch statement — consistent with `case 'kb':` at line 684

### Claude's Discretion
- Exact table formatting and column widths for human-readable output
- Statistical computation implementation (streaming vs in-memory)
- Test fixture design for telemetry.test.js
- Whether to include sparkline-style distribution visualization in CLI output
- Internal helper function decomposition within telemetry.cjs

### Pre-Research Spike Findings (Landscape Characterizations)

These findings come from three pre-research spikes (A, C, E) run as research-mode data analysis. They characterize the data landscape — they are NOT locked decisions. The researcher should feel free to challenge correlations, propose confounders, and investigate the opened territory. Full audit: `57-SPIKE-AUDIT.md`.

**Methodological caveats applying to ALL spike findings below:**
- Designs were embedded in agent prompts rather than reviewed as separate DESIGN.md files before execution (process deviation — orchestrator should write DESIGN.md first)
- DECISION.md framing is too closure-oriented; findings below are reframed as landscape characterizations
- No confounders were systematically investigated beyond obvious ones
- No confidence intervals or p-values reported (correlations are likely significant at N=106-264 but this is assumed, not demonstrated)
- Multiple comparisons across 4+ correlations per spike inflate false discovery rate — individual findings may not survive correction
- Pearson r on non-normal data (entropy bounded, tool_errors zero-inflated) may overstate linear relationships

#### Spike A: Token Count Reliability — RESOLVED (spk-004)
**Landscape:** `input_tokens` in session-meta = sum of post-cache residuals, typically 1-3 tokens per API call. Captures 0.001-0.74% of actual input processed. Cache hit ratio is 99.3-100%. `output_tokens` is reliable — matches JSONL within 0-8% for clean sessions, scales with actual generation work.
- [evidenced:cited] `input_tokens` is NOT a workload proxy — a 513-min session showing 109 is correct (84 calls × ~1.3 tokens/call of cache-miss residual). Confirmed across 10 sessions. — spk-004 DECISION.md
- [evidenced:cited] `output_tokens` IS a reliable workload proxy — never cached, matches JSONL within 0-8% for non-inherited sessions. — spk-004 DECISION.md
- [evidenced:cited] JSONL aggregation is ALSO unreliable — streaming duplication (multiple entries per API call) and `/continue` inheritance (parent session appended) inflate counts. — spk-004 DECISION.md
- **What this opens:** `input_tokens` could be repurposed as a cache-cold detection signal (values >100/call are anomalous). True cost accounting requires JSONL with deduplication logic — neither session-meta alone nor JSONL alone gives a clean picture.
- **What could undermine this:** If Claude Code changes its caching strategy, the 99.3% cache-hit ratio may not hold. If session-meta generation changes (currently batch-processed, timestamps suggest periodic recomputation), the relationship between meta and JSONL may shift.

#### Spike C: Facets Accuracy — PARTIAL SIGNAL (spk-005)
**Landscape:** Facets contain validated signal in two dimensions and orthogonal-to-errors holistic judgments in two others. This is not "noise" vs "signal" — it's different constructs measuring different things.
- [evidenced:cited] `friction_counts` ↔ `user_interruptions`: Spearman rho=0.55 (N=106). Zero-friction sessions have 87.5% zero-interruption rate vs 63.8% for friction>0. Monotonic progression across friction bins. — spk-005 DECISION.md
- [evidenced:cited] `session_type` ↔ `duration_minutes`: 10x median span (single_task 6min vs multi_task 76min). Types are behaviorally distinguishable. — spk-005 DECISION.md
- [evidenced:cited] `outcome` ↔ `tool_errors`: NOT correlated (fully_achieved mean 1.15 vs partially_achieved 1.21). Outcome is a holistic AI judgment orthogonal to error accumulation. — spk-005 DECISION.md
- [evidenced:cited] `claude_helpfulness` ↔ error rate: Counterintuitively inverse — "unhelpful" sessions have 0 errors because they are abandoned/zero-work. Confounded by session complexity. — spk-005 DECISION.md
- **Unexamined confounders:** Session length may drive both friction accumulation and interruption probability (rho=0.55 could be partially spurious). No session-length partial correlation was computed.
- **What this opens:** What IS "quality" for an agentic session? Outcome ≠ errors. The question of quality constructs (technical quality vs goal achievement vs user experience) is unresolved and important.

#### Spike E: Behavioral Metrics — CONFIRMED, 2 NEW DIMENSIONS (spk-006)
**Landscape:** Two strong behavioral metrics discoverable from session-meta: session focus (entropy of message_hours) and session type (first_prompt categorization).
- [evidenced:cited] `message_hours_entropy` is the strongest predictor found: Pearson r=0.48 with tool_errors, r=0.45 with interruptions (N=264, 99.6% coverage). Fragmented sessions have 5.6x tool errors of focused. — spk-006 DECISION.md
- [evidenced:cited] `first_prompt_category` separates GSD (1.14 errors avg) from ad-hoc (2.26 errors avg, 2x differential), 47% fewer interruptions. 81.1% of sessions have classifiable first_prompt. — spk-006 DECISION.md
- [evidenced:cited] `user_response_times` has weak signal (CV↔interruptions r=0.33) but 54% missing data and nearly no extreme-CV cases. Deferred. — spk-006 DECISION.md
- **Unexamined confounders:** GSD vs ad-hoc error differential may be selection bias — structured tasks that naturally use GSD might inherently have fewer errors regardless of harness. Causation not established. Session fragmentation ↔ errors direction unknown (does fragmentation cause errors via context loss, or do error-prone tasks cause users to take breaks?). Pearson r on non-normal distributions (entropy bounded [0,~2.5], tool_errors zero-inflated with 55% zeros) may overstate linear relationship.
- **What this opens:** Harness effectiveness — is it real or selection bias? Fragmentation root cause — which direction does causation flow? Collection gap archaeology — why is response_times missing in 54%?

</working_model>

<constraints>
## Derived Constraints

- **DC-1:** [evidenced:cited] Zero external dependencies — project uses vanilla Node.js only, no npm packages for telemetry parsing. Follows existing pattern (kb.cjs uses node:sqlite built-in) — per PROJECT.md philosophy
- **DC-2:** [evidenced:cited] Node.js >= 22.5.0 required — already enforced by KB-11 for node:sqlite; telemetry.cjs inherits this floor — per REQUIREMENTS.md KB-11
- **DC-3:** [decided:cited] Codex session data adapter is Phase 60 scope — build Claude Code adapter first, design normalization schema that Codex can plug into — per ROADMAP.md Phase 60 description
- **DC-4:** [decided:cited] Cost calculation excluded from this phase — presentation-layer concern requiring pricing table maintenance; raw token counts are the Phase 57 deliverable, cost derivation is downstream — per measurement-infrastructure-research.md §3 recommendation
- **DC-5:** [evidenced:cited] Token reliability must be validated before baseline commit — `input_tokens: 109` for 513-min session is a known data quality issue; inline validation is a blocker, not optional — per STATE.md Blockers
- **DC-6:** [governing:cited] "Don't design token tooling around current pricing" — per MILESTONE-CONTEXT.md Derived Constraint 4. Schema should be pricing-agnostic.
- **DC-7:** [governing:cited] "Don't bake KB storage format assumptions into sensor pipeline" — per MILESTONE-CONTEXT.md Derived Constraint 1. Telemetry output should be consumable by multiple downstream systems.

</constraints>

<guardrails>
## Epistemic Guardrails

- **G-1:** [governing:reasoned] Metrics are indicators, not optimization targets. Surface them for human interpretation and agent awareness, but do not create automation loops that optimize directly for metric improvement. Goodhart's Law applies to agentic systems with particular force because agents can game metrics faster than humans can detect gaming.
- **G-2:** [governing:reasoned] Every metric has multiple explanations. The telemetry system must resist premature causal attribution. "Interruption rate decreased after Phase 58" does not mean Phase 58 caused the decrease without controlling for other variables (different tasks, different effort levels, user mood). Correlation reporting, not causation claiming.
- **G-3:** [governing:reasoned] Facets data is hypothesis-generating, not hypothesis-confirming. All facets-derived fields annotated as "AI-generated estimates with unknown accuracy" (TEL-05). Do not treat `outcome: "fully_achieved"` as ground truth for session quality — it is one AI's assessment.
- **G-4:** [governing:reasoned] The measurement framework is provisional and revisable. If experience reveals that current metrics are asking the wrong questions, the system must support adding, modifying, or retiring metrics. Resist treating the v1.20 metric set as canonical. Build extensibility into the schema, not just the code.
- **G-5:** [governing:reasoned] Progressive refinement serves epistemic honesty, not just convenience. When an aggregate metric shows a concerning trend, the ability to drill down into typed sub-metrics is what prevents premature intervention based on misleading aggregates. Design drill-down as a first-class feature, not an afterthought.

</guardrails>

<questions>
## Open Questions

### Q1: OTel integration architecture for future collection
**Research program:** Survey how the new Claude Code OTel export (monitoring-usage docs) and Codex TOML OTel config interact with local session-meta data. Can OTel-exported data be consumed by gsd-tools as an alternative to file-based session-meta? What would a `telemetry export` subcommand look like that bridges session-meta → OTel format? Check if OTel event schema maps cleanly to our normalized schema.
**Downstream decisions affected:** Whether telemetry.cjs should include OTel format output; whether Phase 60 Codex adapter should use OTel rather than direct JSONL parsing
**Reversibility:** MEDIUM — schema design now constrains future OTel integration. Getting it wrong means refactoring, not rebuilding.

### Q2: Cross-runtime normalization schema design
**Research program:** Define a concrete normalized schema that accommodates both Claude Code session-meta (per-session aggregates with behavioral metrics) and Codex JSONL (per-turn token snapshots with turn_context). Test the schema against real data from both runtimes. Specifically resolve: how to represent runtime-only fields (user_interruptions, reasoning_output_tokens), how to abstract session enumeration across different directory structures, how to handle the per-session vs per-turn granularity difference.
**Downstream decisions affected:** Phase 60 Codex adapter design, every downstream consumer of telemetry data, baseline comparison across runtimes
**Reversibility:** LOW — the normalization schema is foundational. Changing it after Phase 60 means migrating all existing baselines and consumers.

### Q3: Additional behavioral metrics from session-meta
**Research program:** Systematically enumerate all derivable behavioral metrics from the 268 session-meta files beyond the 8 identified in prior research. Specifically investigate: `first_prompt` text analysis for GSD command patterns (does harness usage correlate with outcomes?), `message_hours[]` distribution for session fragmentation (do fragmented sessions have worse outcomes?), `user_response_times[]` variance as engagement signal, tool usage patterns across session types. Cross-reference with facets where available to test whether behavioral metrics correlate with AI-assessed outcomes.
**Downstream decisions affected:** Which metrics go into baseline.json, which become Phase 60 sensor targets, which need JSONL correlation (and thus are deferred)
**Reversibility:** HIGH — adding metrics later is straightforward; the schema is extensible by design.

### Q4: Harness effectiveness as metric vs. multi-dimensional profile
**Research program:** Investigate whether a composite "harness effectiveness" metric is defensible or whether effectiveness is necessarily multi-dimensional. Look at existing composite metrics in software engineering (DORA metrics, SPACE framework) for precedent on what works and what collapses meaningful signal into noise. Consider: would a composite metric violate the progressive refinement principle by hiding important sub-metric variation?
**Downstream decisions affected:** Whether baseline.json includes an effectiveness score or only dimensional profiles; how the reflection engine consumes telemetry data
**Reversibility:** HIGH — can always add a composite later; harder to remove one that automation depends on.

### Q5: Cross-runtime baseline format for Phase 60
**Research program:** Determine whether baseline.json should include a `runtime` dimension now (treating current data as "Claude Code" segment) or whether runtime segmentation should wait for Phase 60 when Codex data is actually available. Consider: does including `runtime` now create false parity expectations? Does omitting it make Phase 60 migration harder?
**Downstream decisions affected:** baseline.json schema version, Phase 60 migration effort, Phase 58 gate enforcement (which reads baseline.json)
**Reversibility:** MEDIUM — adding runtime dimension later requires baseline.json schema migration.

</questions>

<dependencies>
## Claim Dependencies

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| [decided] Session-meta is primary data source | [evidenced] 268 files exist with rich schema | LOW — empirically confirmed |
| [decided] baseline.json before Phase 58 | [decided] Inline token validation | MEDIUM — if validation reveals session-meta tokens are unusable, baseline scope may need narrowing |
| [assumed] Normalized schema compatible with OTel | [open] Q1 OTel architecture | MEDIUM — if OTel conventions conflict with session-meta-derived schema, refactoring needed |
| [assumed] Behavioral metrics are first-class | [evidenced] session-meta has user_interruptions, tool_error_categories | LOW — data exists; question is interpretive value |
| [governing] Progressive refinement design | [evidenced] tool_error_categories provides type breakdown | LOW — existing data supports the pattern |
| [stipulated] Facets on 41% subset with n reported | [evidenced] 109 of 268 sessions have facets | LOW — coverage is what it is; transparency handles it |
| [projected] Phase 60 Codex adapter | [open] Q2 normalization schema | HIGH — schema designed now constrains Phase 60 implementation |
| [governing] Goodhart's Law constraint | [governing] Metrics as indicators, not targets | LOW — meta-level principle, not empirical dependency |

</dependencies>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary Research
- `.planning/research/measurement-infrastructure-research.md` — Session-meta schema (§1), facets schema (§2), tooling design comparison (§3), baseline strategy (§4), prediction framework (§5), cross-platform normalization (§8)
- `.planning/audits/session-log-audit-2026-04-07/reports/telemetry-survey.md` — Data source inventory, 10 computable-now metrics with epistemological caveats, 6 still-open research questions
- `.planning/audits/session-log-audit-2026-04-07/reports/telemetry-research-claude.md` — Complete session-meta schema, JSONL entry types, hook payloads, statusline bridge pattern, gaps table
- `.planning/audits/session-log-audit-2026-04-07/reports/telemetry-research-codex.md` — Per-turn token granularity, pricing normalization requirements, exec vs interactive differences

### External Documentation (New — not in prior research)
- `https://code.claude.com/docs/en/monitoring-usage` — Claude Code OTel support: 8 metrics, 5 event types, env var configuration, attribute schemas
- `https://code.claude.com/docs/en/costs` — Claude Code cost data: $6/dev/day average, /cost command schema, team rate limits
- `https://developers.openai.com/codex/config-advanced#observability-and-telemetry` — Codex CLI OTel: TOML config schema, 5 metrics, 8 event types, opt-out options

### Project Context
- `.planning/MILESTONE-CONTEXT.md` §Measurement & Telemetry — Working assumptions, derived constraints, epistemic guardrails
- `.planning/REQUIREMENTS.md` §TEL — TEL-01a through TEL-05 specifications
- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-02-claude-code-session-logs-large-unstable.md` — Why JSONL is not primary: 442MB+, no stability guarantees
- `.planning/spikes/002-claude-code-session-log-location/DECISION.md` — Discovery of ~/.claude/usage-data/ data layer
- `.planning/deliberations/pre-v1.20-session-capture.md` — Thread 3 (metrics), Thread 10 (sensor ecosystem), Thread 11 (informal research gap)

### Prior Artifacts (archived for comparison)
- `.planning/phases/57-measurement-telemetry-baseline/pre-upgrade-archive/` — Pre-upgrade CONTEXT, RESEARCH, 3 PLANs from before discuss-phase skill overhaul (Phase 57.2)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `get-shit-done/bin/lib/kb.cjs` — Closest module pattern: lazy node:sqlite require, output()/error() from core.cjs, frontmatter parsing, atomicWriteJson. Reference implementation for telemetry.cjs.
- `get-shit-done/bin/lib/core.cjs` — `output()`, `error()`, `atomicWriteFileSync()`, `atomicWriteJson()`, `resolveWorktreeRoot()` — all needed by telemetry module
- `get-shit-done/bin/lib/state.cjs` — STATE.md read for phase↔session time correlation (`cmdStateRecordMetric` timestamps)
- `get-shit-done/bin/lib/frontmatter.cjs` — `extractFrontmatter()` if baseline.json gets YAML frontmatter (unlikely but available)

### Established Patterns
- Module pattern: `lib/*.cjs` with `cmd{Command}(cwd, options, raw)` exports, router wiring via `case '{command}':` in gsd-tools.cjs
- 18 existing lib modules — telemetry.cjs would be #19
- `--raw` flag convention: JSON output for machine consumption, tables for humans
- `atomicWriteJson()` for safe file writes (no partial writes on crash)

### Integration Points
- Router: `case 'telemetry':` in gsd-tools.cjs (adjacent to `case 'kb':` at line 684)
- STATE.md: Phase time windows from performance metrics table for `telemetry phase` correlation
- Sensors: `get-shit-done/bin/lib/sensors.cjs` — future telemetry sensor could feed into sensor pipeline
- Health probe: `get-shit-done/bin/lib/health-probe.cjs` — "token health" could become a health dimension

</code_context>

<specifics>
## Specific Ideas

- "Our telemetry shouldn't be reduced to just token usage" — user explicitly wants behavioral, quality, and harness effectiveness metrics alongside token metrics
- Token usage at multiple granularities: per-session, per-phase, per-milestone, and out-of-phase/milestone (infrastructure sessions that don't map to any phase)
- "Frustration words, interruptions, or other creative/useful ways to represent and monitor how our harness is doing" — user_interruptions is already a first-class field in session-meta
- Error metrics should progressively refine: errors per session → error types → error rate by tool → error rate by tool in context. Each level gives more actionable information and makes interventions more determinate.
- "We aren't just developing this for Claude but also Codex" — cross-runtime is a first-class design concern, not a future consideration
- Metrics should help us understand "how our interventions and changes are doing" — before/after comparison is the core use case
- "Be epistemically humble, use metrics responsibly, and be open and responsive to when scenarios call for more, different metrics" — the measurement framework itself should be revisable
- RTK (rtk-ai/rtk) mentioned as potential tool for testing token usage reduction — user expressed interest in a decimal phase (57.4) to test it

</specifics>

<deferred>
## Deferred Ideas

- **RTK integration testing** — `https://github.com/rtk-ai/rtk` for measuring actual token usage reduction. User expressed interest as Phase 57.4 — evaluate after baseline captured.
- **Automated token sensor** — MILESTONE-CONTEXT working assumption: "extraction tooling now, automated sensor later." Token/telemetry sensor as automated agent is v1.21.
- **Cost calculation** — Presentation-layer concern requiring pricing table maintenance (models change frequently). Raw token counts are Phase 57; cost derivation is downstream (DC-4).
- **OTel collector integration** — Real-time telemetry collection via OTel exporters. Going-forward mechanism; Phase 57 works with historical data.
- **Bridge file extension** — Extending statusline bridge file with cost + rate limits + effort level. Needs spike validation (telemetry-survey spike candidate E).
- **Health-probe token-health dimension** — Token usage as a health scoring input. Downstream consumer of baseline data.
- **Quality-predictive metric identification** — Which metrics actually predict quality? Empirical question requiring longitudinal data. MILESTONE-CONTEXT open question, not Phase 57 scope.
- **Continental philosophy of memory** — Stiegler, Ricoeur, Bergson, Derrida frameworks for agentic memory. Deferred to v1.22+ per MILESTONE-CONTEXT.

</deferred>

<spikes>
## Pre-Research Spike Candidates

Spikes to run BEFORE research-phase to resolve critical [open] claims and STATE.md blockers. Results update this CONTEXT.md directly, converting [open] claims to [evidenced] or [decided]. Additional spikes may surface during research (researcher proposes at step 5.5 of plan-phase).

### Tier 1: Critical — Run Now

#### Spike A: Token Count Reliability (STATE.md blocker)
- **Question:** Are session-meta `input_tokens`/`output_tokens` post-caching residuals, gross API counts, or something else?
- **Method:** Compare 5 sessions' session-meta token totals vs JSONL-aggregated `usage.input_tokens` across all assistant entries. Compute ratio, characterize the discrepancy pattern.
- **Outcome type:** Binary — reliable (use as-is) or unreliable (document limitations, recommend alternative source)
- **Resolves:** STATE.md blocker, DC-5, [open] claim on token reliability
- **Status:** Run now (pure data analysis, no setup needed)

#### Spike C: Facets Accuracy Validation
- **Question:** Do facets AI-generated assessments correlate with observable session-meta behavioral metrics?
- **Method:** Cross-correlate across the 109 facets-matched sessions: `outcome` vs `tool_errors`, `friction_counts` vs `user_interruptions`, `session_type` vs `duration_minutes` and `tool_counts` patterns. Report correlation coefficients and notable outliers.
- **Outcome type:** Exploratory — characterize signal-to-noise ratio of facets data
- **Resolves:** G-3 calibration (how much weight to give facets), [stipulated] 41% coverage sufficiency
- **Status:** Run now (pure data analysis on existing 109-session overlap)

### Tier 2: Important — Run Before Planning

#### Spike B: OTel Data Quality
- **Question:** What does Claude Code's OTel export actually produce? Does it overlap with session-meta behavioral data or is it orthogonal?
- **Method:** Enable `CLAUDE_CODE_ENABLE_TELEMETRY=1` with `OTEL_METRICS_EXPORTER=console` and `OTEL_LOGS_EXPORTER=console`, run a short session with tool use, inspect console output against session-meta fields for same session.
- **Outcome type:** Comparative — characterize overlap, unique fields per source, data quality
- **Resolves:** Q1 (OTel integration architecture)
- **Status:** Requires manual env var setup — run separately

#### Spike E: Behavioral Metric Signal-to-Noise
- **Question:** Can we derive useful behavioral signals from `first_prompt` text, `message_hours[]` distribution, and `user_response_times[]` variance? Or is variance too high for these to be informative?
- **Method:** Exploratory analysis across all 268 session-meta files. Compute: first_prompt GSD command frequency, message_hours entropy (session fragmentation), user_response_times variance and outlier patterns. Cross-reference with facets outcomes where available (109-session subset) to test whether behavioral patterns correlate with session quality.
- **Outcome type:** Exploratory — characterize which derived behavioral metrics have enough signal to include in baseline
- **Resolves:** Q3 (additional behavioral metrics from session-meta), informs baseline dimension selection
- **Status:** Run now (pure data analysis)

#### Spike F: Statusline Bridge Extension Validation (telemetry-survey Spike E)
- **Question:** Does the Claude Code statusline payload actually include `cost.total_cost_usd` and `rate_limits.*` as documented? Can we extend the bridge file to write these?
- **Method:** Inspect the live statusline payload during a session (the telemetry-research-claude.md documented the full schema but noted some fields "reportedly" exist — needs empirical confirmation). Check our existing `gsdr-statusline.js` hook to verify what fields it receives vs what it writes.
- **Outcome type:** Binary — fields exist (extend bridge) or don't (document gap)
- **Resolves:** Deferred idea "Bridge file extension", telemetry-survey spike candidate E
- **Status:** Quick — can run alongside OTel spike (same session)

### Tier 3: Conditional — Evaluate During Research

#### Spike D: Reference Design Pattern Extraction (CONDITIONAL)
- **Question:** What normalization patterns, pricing abstractions, or cross-runtime schemas do existing telemetry tools use that we should learn from?
- **Candidates:** ccusage (Claude JSONL parser), claude-spend (pricing table), LiteLLM (cross-provider normalization)
- **Outcome type:** Open inquiry — extract design principles, not adopt a solution
- **Evaluation gate:** Only worth spiking if research identifies a GENUINELY promising, well-maintained tool. Criteria:
  - Up-to-date and actively maintained (check last commit, issue responsiveness)
  - Meaningful community adoption (but old+stars ≠ good, new+viral ≠ good)
  - Solves a problem we actually have (not just interesting)
  - Audit for quality: issues, responsiveness, architecture decisions
- **Important caveat:** This is reference design extraction, NOT adoption. We have our own needs, requirements, and guiding philosophies. Never determine the whole approach around someone else's solution.
- **Resolves:** Q2 (normalization schema), but research-phase may resolve this without spiking
- **Status:** Defer to research — researcher evaluates whether any candidate is promising enough to warrant the investigation cost. If not, skip entirely.

### Spike-Derived Follow-Up Candidates (Opened Territory)

These emerged from Tier 1 spike findings. They are NOT closed questions — they are areas of inquiry that the spikes *opened up*. Each represents demonstrated (not hypothetical) phenomena that the researcher or further spikes should explore. Spike findings should expand the design space, not collapse it.

#### From Spike C (Facets Accuracy):
- **Data integrity characterization** — 3 malformed session-meta files found (6f97ee28, 8576521c, 96ae5fc5), 9 sessions with >1000 min duration that are multi-day resumed contexts. How widespread are data quality issues across the 268-session corpus? What's the "clean" subset? Every baseline metric depends on this.
- **Abandoned session detection** — "Unhelpful" facets sessions cluster with 0 tool errors because they're abandoned/zero-work, not actually unhelpful. Can we reliably detect and filter these? They contaminate behavioral baselines if included undifferentiated.
- **What does "quality" mean?** — Outcome ↔ errors are NOT correlated. A "fully_achieved" session can have many errors (iterative debugging is productive error), and a "partially_achieved" session can have zero errors (clean execution that didn't finish). This challenges naive quality metrics and deserves deeper investigation.

#### From Spike E (Behavioral Metrics):
- **Harness effectiveness — causal or selection?** — GSD sessions have 53% fewer errors and 47% fewer interruptions than ad-hoc. Headline finding. But is the harness reducing errors, or do structured tasks (which tend to use GSD) inherently produce fewer errors? Understanding the causal structure matters for how we interpret this metric.
- **Session fragmentation root cause** — Fragmented sessions have 5.6x tool errors. But direction of causation is unknown: does fragmentation cause errors (context loss), or do error-prone tasks cause fragmentation (user takes breaks from frustrating work)? Different causes → different interventions.
- **Collection gap archaeology** — 54% of sessions missing `user_response_times`. Why? Are there session types that never populate it? Is it a Claude Code version issue? Understanding the gap informs whether to include response_time metrics in baseline or flag as unreliable.
- **"Question" sessions as a distinct category** — N=11 sessions starting with questions have 3.64 avg tool errors (highest category). These appear to be debugging/clarification sessions where the harness is used for exploratory work outside structured workflows. A distinct pattern worth tracking.

### Spike Execution Summary
- **Completed:** Spikes C (facets — partial signal), E (behavioral — confirmed, 2 new baseline dimensions)
- **Running:** Spike A (token reliability — awaiting results)
- **Before planning:** Spike B + F together (requires env var setup)
- **Conditional:** Spike D — researcher evaluates during research
- **Spike-derived follow-ups:** Available for researcher or further spikes as warranted

</spikes>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| Are session-meta token counts post-caching residuals or gross counts? | Determines whether baseline token metrics are meaningful | Critical | Spike A running — awaiting results |
| What is the "clean" subset of session-meta data? | Malformed files + duration artifacts affect ALL baseline metrics | High | Spike-derived — 3 malformed files + 9 >1000min sessions found |
| Is GSD effectiveness causal or selection bias? | 53% fewer errors is a headline finding — interpretation affects how we use the metric | Medium | Spike-derived — opened by Spike E |
| Does session fragmentation cause errors or vice versa? | 5.6x error differential — direction of causation changes intervention design | Medium | Spike-derived — opened by Spike E |
| What does "session quality" actually mean? | Facets outcome ≠ error count. Naive quality metrics may mislead | High | Spike-derived — opened by Spike C |
| How does Claude Code OTel data compare to session-meta? | Determines future data source strategy | Medium | [open] — Q1, Spike B planned |
| What normalized schema accommodates both runtimes? | Foundational for Phase 60 and all downstream consumers | High | [open] — Q2 in generative questions above |
| Why is user_response_times missing in 54% of sessions? | Determines whether response_time metrics belong in baseline | Medium | Spike-derived — opened by Spike E |

---

*Phase: 57-measurement-telemetry-baseline*
*Context gathered: 2026-04-09*
*Mode: exploratory --auto --chain (typed claims, auto-progression by type rules, open questions preserved for researcher)*
