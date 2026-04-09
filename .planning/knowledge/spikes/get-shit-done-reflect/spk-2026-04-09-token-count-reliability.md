---
id: spk-2026-04-09-token-count-reliability
type: spike
project: get-shit-done-reflect
tags: [telemetry, session-meta, tokens, data-quality, caching]
created: "2026-04-09T00:00:00Z"
updated: "2026-04-09T19:10:50Z"
durability: convention
status: active
hypothesis: "Session-meta token counts are post-caching residuals (only counting non-cached input tokens), which explains why input_tokens: 109 appears for a 513-minute session with 84 assistant messages."
outcome: confirmed
rounds: 1
phase: 57
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
---

## Hypothesis

Session-meta `input_tokens` is the sum of post-cache residual "fresh" input tokens per API call (typically 1-3 per call due to aggressive prompt caching), not gross input token count.

## Experiment

Research-mode. Examined 10 sessions from `~/.claude/usage-data/session-meta/` (get-shit-done-reflect project, 2-1062 min duration) with matching JSONL files at `~/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/*.jsonl`. Compared `session-meta.input_tokens` and `output_tokens` to JSONL-aggregated sums of `usage.input_tokens`, `usage.output_tokens`, `cache_creation_input_tokens`, and `cache_read_input_tokens`. Computed per-call averages and caching ratios.

## Results

**Hypothesis confirmed.** Session-meta `input_tokens` = sum of `usage.input_tokens` (post-cache residuals) across all API calls in the session:

- Per-call average: 1.15-2.04 tokens/call across 5 clean sessions (2-401 min duration)
- Anomalous session (513 min, 84 messages): `input_tokens=109` = 1.30 tokens/call — within normal range
- Caching ratio: 99.3-100.0% of all input tokens served from cache across all sessions
- `output_tokens` is reliable: matches JSONL within 0-8% for sessions without continuation inheritance

JSONL-aggregated `input_tokens` diverges from meta for two reasons:
1. **Streaming duplication**: JSONL logs multiple incremental states for each API call (stop_reason=None entries); raw JSONL sum overcounts
2. **`/continue` inheritance**: Resume-work sessions copy parent JSONL into child JSONL; meta counts only new turns

Session-meta files were created in bulk batch jobs (142 files at 2026-03-15 18:xx), not real-time at session close.

## Decision

Do NOT use `session-meta.input_tokens` as a workload proxy for Phase 57 baseline design. Use `output_tokens` as the primary token metric.

- `input_tokens` captures cache-miss behavior only; a 500K-token session shows identical values to a 1K-token session if both are fully cached
- `output_tokens` scales with actual generation work and is not affected by cache state
- `input_tokens / assistant_message_count > 100` signals cache-cold session (anomaly worth flagging)
- True cost accounting requires JSONL-derived `input + cache_creation + cache_read` — not available from session-meta

## Consequences

- Phase 57 baseline: use `output_tokens` as primary, `assistant_message_count` as secondary, `input_tokens` as cache-health anomaly detector only
- Sessions using `/continue` or `resume-work` accumulate parent history in JSONL; JSONL-based aggregation requires deduplication and boundary detection to be reliable
- `input_tokens` values in the 1-3 range per call are healthy (aggressive cache hits); values >100/call may indicate cold cache or large fresh document ingest — worth separate analysis
- The anomaly that prompted this spike (`input_tokens: 109` for 513-min session) is fully explained and correct behavior
