# Phase 57: Measurement & Telemetry Baseline - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning
**Mode:** Exploratory (--auto, grounded selections only)

<domain>
## Phase Boundary

Telemetry extraction tooling captures a pre-intervention baseline so that structural changes in subsequent phases can be attributed to specific interventions. Delivers `gsd-tools telemetry` subcommands (summary, session, phase, baseline, enrich) and a committed `.planning/baseline.json` before Phase 58 begins.

Requirements: TEL-01a, TEL-01b, TEL-02, TEL-04, TEL-05

</domain>

<decisions>
## Implementation Decisions

### Token Count Reliability Strategy
- [grounded] Validation task (5-session comparison of session-meta tokens vs JSONL-aggregated tokens) must complete before baseline.json is committed
- [grounded] This is an inline research task within Phase 57, not a formal /gsdr:spike — scope is bounded and binary
- [grounded] If session-meta tokens are unreliable, the tooling must support JSONL-aggregated token counts as an alternative source
- [grounded] baseline.json annotates which token source was used and any known limitations
- Basis: STATE.md blocker ("validation spike required before baselines committed in Phase 57"), Pitfall C3

### Output Format
- [grounded] `--raw` flag for JSON output; default is human-readable tables — follows established gsd-tools convention
- [grounded] Module follows `lib/telemetry.cjs` pattern with `cmdTelemetry{Subcommand}(cwd, options, raw)` signatures
- [grounded] Uses `output()` and `error()` from core.cjs, `atomicWriteJson()` for baseline file writes
- [grounded] Router addition: `case 'telemetry':` in gsd-tools.cjs switch statement

### Project Filtering
- [grounded] `--project` flag filters sessions by project_path; `resolveWorktreeRoot()` normalizes worktree paths to main project root
- [grounded] Baseline output reports matched vs filtered session counts (e.g., "42 of 268 sessions matched project filter")
- Basis: Pitfall N2 (wrong project scope), Research Observation 8 (worktree path normalization)

### Baseline Dimensions
- [grounded] All 8 proposed metrics from research: tokens/session, token-to-commit ratio, tool error rate, interruption rate, session outcome distribution, friction frequency, session duration distribution, agent usage rate
- [grounded] Statistical distributions: min, p25, median, p75, p90, max for numeric fields
- [grounded] Token-based metrics carry reliability caveat until inline validation confirms source accuracy
- [grounded] Facets-based metrics (outcome distribution, friction frequency) computed on facets-matched subset only, with n reported

### Facets Integration
- [grounded] Left-join facets by session_id; sessions without facets retain null for quality fields — not excluded from non-quality metrics
- [grounded] Every facets-derived field annotated as "AI-generated estimate with unknown accuracy" in both human-readable and raw output
- [grounded] Baseline reports facets coverage: "n=109 of 268 sessions have quality data" (or equivalent for filtered set)
- Basis: TEL-04, TEL-05, Pitfall M3

### Phase Correlation
- [grounded] `telemetry phase <phase-num>` matches session timestamps to STATE.md performance metrics time windows
- [grounded] Uses `session_meta.project_path` + `session_meta.start_time` to correlate with `cmdStateRecordMetric()` entries

### Scope Exclusions (Fixed)
- Cost calculation excluded from schema — presentation-layer concern (Derived constraint 4)
- Codex session data adapter is Phase 60 scope — build for Claude Code session-meta first
- Bridge file extension needs spike E validation — not this phase
- Health-probe token-health integration is a downstream consumer — not this phase

### Claude's Discretion
- Exact table formatting and column widths for human-readable output
- Statistical computation implementation (streaming vs in-memory)
- Test fixture design for telemetry.test.js
- Whether to include sparkline-style distribution visualization in CLI output

</decisions>

<specifics>
## Specific Ideas

- Session-meta data directory: `~/.claude/usage-data/session-meta/` (268 files as of research date)
- Facets data directory: `~/.claude/usage-data/facets/` (109 files as of research date)
- JSONL session data: `~/.claude/projects/` (for token validation comparison)
- Subcommand mapping from research Section 3:
  - `telemetry summary [--project P] [--since DATE] [--until DATE]` — session overview
  - `telemetry session <id>` — single session detail (session-meta + facets)
  - `telemetry phase <phase-num>` — sessions within phase time window
  - `telemetry baseline [--project P]` — produce `.planning/baseline.json`
  - `telemetry enrich <session-id>` — join session-meta + facets into enriched record
- Cross-platform normalization schema defined in research Section 8 — implement the schema but only the Claude Code adapter for now

</specifics>

<deferred>
## Deferred Ideas

- Cost calculation with versioned pricing table — presentation-layer, not baseline scope
- Codex session data adapter (state_5.sqlite) — Phase 60: Sensor Pipeline & Codex Parity
- Bridge file extension for real-time cost/rate data — needs spike E validation, not committed
- Health-probe token-health dimension — downstream consumer of baseline data
- Telemetry sensor (automated collection) — MILESTONE-CONTEXT working assumption: "extraction tooling now, automated sensor later"
- Quality-predictive metric identification — MILESTONE-CONTEXT open question, not Phase 57 scope

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| Are session-meta token counts post-caching residuals or gross counts? | Determines whether baseline token metrics are meaningful | Critical | Blocked — inline validation task will resolve |
| Is 41% facets coverage sufficient for statistical analysis of quality metrics? | Affects confidence level of quality baseline | Medium | [open] — report n, let consumer decide |
| Which metrics are actually predictive of session quality? | Informs which baseline dimensions to prioritize in future phases | Low (for Phase 57) | [open] — hypothesis-generating, not this phase's job |

---

*Phase: 57-measurement-telemetry-baseline*
*Context gathered: 2026-04-09*
*Mode: exploratory --auto (grounded selections only; open questions documented)*
