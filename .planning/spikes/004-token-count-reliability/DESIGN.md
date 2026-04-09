---
status: complete
round: 1
mode: research
type: binary
---

# Spike Design: Token Count Reliability

**Phase:** 57
**Created:** 2026-04-09

## Open Question

Are session-meta `input_tokens`/`output_tokens` post-caching residuals, gross API counts, or something else?

## Type

Binary

## Hypothesis

Session-meta token counts are post-caching residuals (only counting non-cached input tokens), which explains why `input_tokens: 109` appears for a 513-minute session with 84 assistant messages.

## Success Criteria

Compare at least 5 sessions' session-meta tokens vs JSONL-aggregated tokens. If session-meta tokens consistently differ from JSONL aggregates by >10%, classify as unreliable for baseline purposes.

## Experiment Plan

Research mode — no BUILD or RUN phases.

1. Find 5 session-meta files for the get-shit-done-reflect project (filter by `project_path` containing "get-shit-done-reflect")
2. For each session, extract `input_tokens`, `output_tokens`, `session_id`
3. Find corresponding JSONL files in `~/.claude/projects/` and sum `message.usage.input_tokens` and `message.usage.output_tokens` across `type: "assistant"` entries
4. Compare session-meta totals vs JSONL-aggregated totals; compute ratio
5. Check whether session-meta tokens match post-cache `usage.input_tokens` or gross (including `cache_read_input_tokens` + `cache_creation_input_tokens`)

## Evidence Sources

- `~/.claude/usage-data/session-meta/*.json` — session-level summaries
- `~/.claude/projects/{project-hash}/*.jsonl` — per-turn message logs
