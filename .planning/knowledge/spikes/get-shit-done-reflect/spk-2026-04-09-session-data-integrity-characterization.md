---
id: spk-2026-04-09-session-data-integrity-characterization
type: spike
project: get-shit-done-reflect
tags: [telemetry, session-meta, data-quality, integrity]
created: "2026-04-09T00:00:00Z"
updated: "2026-04-09T00:00:00Z"
durability: convention
status: active
hypothesis: "The majority (>80%) of session-meta files are clean and usable for baseline computation, but a meaningful minority (<20%) have data quality issues that would contaminate aggregate metrics if included undifferentiated."
outcome: confirmed
rounds: 1
phase: 57
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
---

## Hypothesis

The majority (>80%) of session-meta files are clean and usable for baseline computation, but a meaningful minority (<20%) have data quality issues that would contaminate aggregate metrics if included undifferentiated. Alternative hypotheses: quality issues are rare (<5%), pervasive (>30%), or version-dependent.

## Experiment

Research-mode spike (with empirical script execution). A Node.js analysis script (`analyze.js`) parsed all 268 session-meta files at `~/.claude/usage-data/session-meta/`, checked field presence for all 26 expected schema fields, computed file mtime vs. session start_time deltas, and characterized anomalies (extreme duration, zero-token sessions, empty tool_counts, user_response_times coverage). Each session classified into Clean / Caveated / Exclude trust tiers.

## Results

| Tier | Count | Pct |
|------|-------|-----|
| Clean | 229 | 85.4% |
| Caveated | 16 | 6.0% |
| Exclude | 23 | 8.6% |

Exclusion causes:
- 3 files: mid-write JSON truncation (parse failure)
- 20 files: ghost-initiation sessions (`assistant_message_count=0`, `output_tokens=0`, `first_prompt="No prompt"`)

All 26 schema fields present in 100% of parseable files. Schema is consistent — H-alt-2 (pervasive schema incompleteness) rejected.

Batch regeneration confirmed: 264/265 parseable sessions have mtime >24h after start_time. Median lag: 6.2 days. This is systemic but not a data-quality failure — content is valid, only timestamps are from the batch run.

user_response_times coverage gap: 54.3% of sessions have empty response times. Confirmed in Clean tier (52.8%). Architectural limitation, not corruption.

19,996-min duration session confirmed as genuine 14-day multi-day recording — timestamps validate exactly. 16 sessions have duration >1000 min; all are classified Caveated (not Excluded) due to non-zero turn counts.

## Decision

Use 229 Clean sessions as the Phase 57 baseline corpus (228 in conservative counting after identifying one borderline misclassification). 16 Caveated sessions available for non-duration-sensitive analyses. 23 sessions excluded.

Exclusion rules (deterministic):
1. JSON parse failure after null-byte trimming
2. `assistant_message_count = 0 AND output_tokens = 0`
3. Conservative: `output_tokens = 0 AND first_prompt = "No prompt"` regardless of assist_msgs count

Field trust: output_tokens HIGH, tool_counts HIGH, duration MEDIUM (use median not mean), user_response_times LOW-MEDIUM (45% coverage only).

## Consequences

- Phase 57 baselines can proceed on the 229-session clean corpus. Field-level exclusions not needed (schema consistent).
- duration_minutes should always use median, never mean, across the full corpus. The 16 extreme-duration sessions inflate mean significantly (p50=16 min, p95=1050 min, max=19,996 min).
- user_response_times metrics must always annotate N=121 (not N=268 or N=229).
- The 103 macOS sessions (/Users/ paths) are mixed into the corpus from machine "apollo". Cross-machine quality comparison is an open question.
- Ghost-initiation sessions (all in Feb-Mar 2026) may be version-specific. Monitor for recurrence.
- `input_tokens` field has semantically misleading values (median=45 in clean sessions) — it does not reflect full context window tokens. Spike A established this; this spike's distribution confirms it.
