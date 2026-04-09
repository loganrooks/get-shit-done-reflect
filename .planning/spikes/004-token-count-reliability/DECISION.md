# Spike Decision: Token Count Reliability

**Completed:** 2026-04-09
**Question:** Are session-meta `input_tokens`/`output_tokens` post-caching residuals, gross API counts, or something else?
**Answer:** `input_tokens` in session-meta is the sum of post-cache residual "fresh" input tokens (typically 1-3 per API call), not gross input. `output_tokens` is the reliable count of actual generated tokens.

## Summary

Session-meta `input_tokens` represents the sum of `usage.input_tokens` across all assistant API calls in a session. Because Claude Code aggressively caches conversation history, `usage.input_tokens` per call is almost always 1-3 tokens (the small "delta" between the cached context and the new turn). The vast majority of input context -- hundreds of thousands to millions of tokens -- is served from cache and tracked separately as `cache_creation_input_tokens` and `cache_read_input_tokens`, which session-meta does not expose. As a result, a 513-minute session with 84 assistant messages correctly shows `input_tokens: 109` (approximately 1.3 tokens per call), not the millions of tokens that were actually processed.

`output_tokens` is more reliable because output is never cached. Across five clean sessions (no continuation inheritance or heavy duplication), `output_tokens` matched the JSONL-aggregated output within 0-8%. The variation in longer sessions is attributable to the JSONL receiving post-session writes (subagent replay data, continuation inheritance from `/continue`).

The anomaly that prompted this spike is therefore fully explained: `input_tokens: 109` for a 513-minute session is correct if 109 is the sum of tiny cache-miss residuals. There is no data corruption or measurement error.

## Findings

### Session-level comparison (10 sessions, varying duration)

| session_id | dur_min | meta_in | meta_out | jsonl_in | jsonl_out | cache_create | cache_read | in_ratio | notes |
|------------|---------|---------|----------|----------|-----------|--------------|------------|----------|-------|
| 094d7007 | 2 | 15 | 1,375 | 15 | 1,375 | 88,396 | 288,772 | 1.000 | exact match |
| bcf99297 | 155 | 4 | 205 | 4 | 205 | 22,450 | 32,748 | 1.000 | exact match |
| 58dd758d | 87 | 100 | 16,385 | 103 | 16,479 | 347,525 | 2,240,829 | 0.971 | near match |
| c60044b7 | 250 | 292 | 65,536 | 294 | 67,172 | 569,493 | 20,620,558 | 0.993 | near match |
| f69f7597 | 401 | 229 | 61,975 | 231 | 67,121 | 1,029,665 | 18,259,047 | 0.991 | near match |
| aef131f1 | 24 | 15,350 | 6,708 | 15,359 | 11,703 | 274,072 | 1,777,203 | 0.999 | JSONL modified post-meta |
| df9692db | 17 | 15 | 662 | 22 | 955 | 100,961 | 199,942 | 0.682 | JSONL modified post-meta |
| c16a65c9 | 66 | 142 | 43,290 | 9,547 | 98,816 | 1,722,872 | 15,035,098 | 0.015 | heavy multi-agent, JSONL inflation |
| 4fa824c7 | 525 | 23 | 1,396 | 210 | 60,955 | 554,989 | 12,502,702 | 0.110 | /continue inheritance in JSONL |
| 38a4e8f1 | 1,062 | 0 | 0 | 0 | 0 | 0 | 0 | — | zero-turn session |

### What session-meta input_tokens actually represents

Examination of JSONL files confirms that each `assistant` entry has:
- `usage.input_tokens`: 1-3 tokens (for cached turns) or higher (for fresh/uncached input)
- `usage.cache_creation_input_tokens`: thousands to millions
- `usage.cache_read_input_tokens`: tens of thousands to millions

Session-meta `input_tokens` = sum of `usage.input_tokens` across all assistant entries. The per-call averages across clean sessions:

| session | dur | meta_in | asst_msgs | avg_tokens_per_call |
|---------|-----|---------|-----------|---------------------|
| 094d7007 | 2 min | 15 | 11 | 1.36 |
| bcf99297 | 155 min | 4 | 3 | 1.33 |
| 58dd758d | 87 min | 100 | 49 | 2.04 |
| c60044b7 | 250 min | 292 | 254 | 1.15 |
| f69f7597 | 401 min | 229 | 161 | 1.42 |
| 00d25c0f | 513 min | 109 | 84 | 1.30 (anomalous session) |

The range 1.15-2.04 tokens/call confirms post-cache residual interpretation.

### Why meta values sometimes diverge from JSONL

Three causes of meta vs. JSONL mismatch:

1. **JSONL modified post-meta**: Session-meta files were created in batch jobs (142 files created at `2026-03-15 18:xx`, 126 at `2026-03-08 16:xx`). If a session's JSONL was modified after the batch ran, the meta reflects an earlier state. Sessions `df9692db` and `aef131f1` exhibit this: JSONL mtime is 2-3 days newer than meta mtime.

2. **Streaming duplication in JSONL**: Claude Code logs multiple incremental updates for the same API call as it streams. Entries with `stop_reason: null` are mid-stream updates of a message that later appears with `stop_reason: tool_use` or `end_turn`. Summing all JSONL entries overcounts if duplicates are included.

3. **`/continue` inheritance**: When a session is started with `/continue` or `resume-work`, the parent session's JSONL is inherited into the new session's JSONL file. Session `4fa824c7` shows `meta_in=23` (13 actual new messages) but `jsonl_in=210` (includes all inherited history). The JSONL is not a clean single-session record.

### Caching ratio across sessions

The effective cache-hit ratio is 99.3-100.0% across all sessions:

| session | gross_input | fresh_input | cache_ratio |
|---------|-------------|-------------|-------------|
| 094d7007 | 377,183 | 15 | 100.0% |
| 58dd758d | 2,588,457 | 103 | 100.0% |
| c60044b7 | 21,190,345 | 294 | 100.0% |
| f69f7597 | 19,288,943 | 231 | 100.0% |
| aef131f1 | 2,066,634 | 15,359 | 99.3% |

`meta_in` captures 0.001-0.74% of total input processed. It is meaningless as a workload proxy.

## Analysis

| Signal | Interpretation | Reliability | Use For |
|--------|---------------|-------------|---------|
| `meta.input_tokens` | Sum of cache-miss residuals per session | LOW for workload; HIGH for cache-miss count | Detecting cache-cold sessions |
| `meta.output_tokens` | Sum of generated tokens per session | HIGH (within 0-8% of JSONL for clean sessions) | Output workload proxy |
| `cache_creation + cache_read` | Actual input workload | NOT IN META; requires JSONL aggregation | Full token cost accounting |

The `output_tokens` field is the more useful signal for baseline design because:
- Output tokens scale with session complexity (more work = more generation)
- Output is never cached so the value is not affected by cache state
- Consistency with JSONL is high for non-inherited sessions

`input_tokens` can still be useful as a signal of cache efficiency: high values relative to `assistant_message_count` indicate a cold-cache session (unusual, warrants attention), while values of 1-3 per call are normal.

## Decision

**Chosen approach:** Use `output_tokens` as the primary token signal for Phase 57 baseline. Treat `input_tokens` as an auxiliary signal indicating cache-miss behavior, not workload.

**Rationale:** The hypothesis is confirmed. `input_tokens` in session-meta is a post-caching residual that typically equals 1-3 tokens per API call regardless of session length or complexity. A 513-minute session with 84 API calls shows `input_tokens: 109` because each call had approximately 1.3 fresh uncached tokens -- this is correct and expected behavior given Claude Code's heavy prompt caching. Using `input_tokens` as a workload proxy would produce misleading baselines where long complex sessions look equivalent to very short ones.

`output_tokens` is the actionable metric: it scales with actual generation work, is not affected by cache state, and matches JSONL-aggregated totals within 0-8% for normal sessions.

**Confidence:** HIGH

Evidence basis: 10 sessions examined, 5 with exact or near-exact match between meta and JSONL. The 1.15-2.04 tokens/call range is internally consistent across sessions spanning 2 to 525 minutes. The anomalous session (00d25c0f, 513 min, input_tokens=109) produces 1.30 tokens/call which falls squarely in the expected range.

## Implications

- **Phase 57 baseline design**: Do not use `input_tokens` as a session workload proxy. Use `output_tokens` as the primary token metric, with `input_tokens` as secondary cache-health indicator.

- **Cache-cold detection**: Sessions where `input_tokens / assistant_message_count > 100` are anomalous (cache cold or large fresh documents ingested). The `aef131f1` session with 5,105-token turns is an example. Flagging these as outliers prevents them from corrupting aggregate baselines.

- **True cost accounting**: `meta.input_tokens + meta.output_tokens` is NOT total API cost. Full cost requires: `input_tokens + cache_creation_input_tokens + cache_read_input_tokens + output_tokens` from JSONL. Session-meta does not expose cache token fields.

- **JSONL unreliability**: JSONL-based aggregation is also unreliable due to streaming duplication and `/continue` inheritance. Sessions using `/continue` or `resume-work` accumulate the entire parent conversation in their JSONL, inflating per-session counts.

- **Recommended metric hierarchy for Phase 57:**
  1. `output_tokens` — reliable, scales with work, use as primary
  2. `assistant_message_count` — turns taken, complements output tokens
  3. `input_tokens` — cache-miss indicator only, use as anomaly signal
  4. JSONL-derived gross tokens — not recommended without deduplication logic

## Metadata

**Spike duration:** ~1 hour research
**Iterations:** 1
**Originating phase:** 57
**Evidence type:** Research (existing data examination, no experiments built)
