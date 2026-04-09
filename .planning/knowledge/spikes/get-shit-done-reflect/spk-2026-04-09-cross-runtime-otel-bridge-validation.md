---
id: spk-2026-04-09-cross-runtime-otel-bridge-validation
type: spike
project: get-shit-done-reflect
tags: [telemetry, otel, codex, statusline, cross-runtime, token-accounting, rate-limits]
created: "2026-04-09T19:30:00Z"
updated: "2026-04-09T19:30:00Z"
durability: workaround
status: partial
phase: 57
hypothesis: "Both Claude Code and Codex CLI support OTel console exporters for local telemetry inspection; the statusline payload includes cost and rate limit fields that can extend the bridge file."
outcome: partial
rounds: 1
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.19.3+dev
---

## Hypothesis

Claude Code OTel console export and Codex CLI OTel console export both produce documentable metrics and events. The statusline payload includes `cost.total_cost_usd` and `rate_limits.*` fields, making bridge file extension feasible.

## Experiment

### Part 2: Codex CLI OTel
Added `[otel] exporter = "console"` to `~/.codex/config.toml`, ran `codex exec "List the files in the current directory and show git status"`.

Also ran `codex exec ... --json` to observe native streaming telemetry, and inspected the resulting `~/.codex/sessions/` JSONL file directly.

### Part 3: Statusline Bridge
Read `~/.claude/hooks/gsdr-statusline.js` source code. Inspected 3 live bridge files from `/tmp/claude-ctx-*.json`. Cross-referenced against telemetry-research-claude.md statusline payload schema.

### Part 1: Claude Code OTel (Partial)
A partial run captured one metric (`claude_code.session.count`) from a non-interactive session. Full interactive session characterization is pending.

## Results

### Codex OTel: Console exporter does not exist

The config value `exporter = "console"` is rejected at startup with a hard error:
```
Error loading config.toml: unknown variant `console`, expected one of `none`, `statsig`, `otlp-http`, `otlp-grpc`
```

Valid Codex OTel exporters in v0.118.0: `none`, `statsig` (opaque/internal), `otlp-http`, `otlp-grpc`. No lightweight local inspection path exists. An OTLP collector endpoint is required for any OTel observation.

### Codex native JSONL telemetry: Confirmed rich

The `token_count` event in `~/.codex/sessions/` JSONL files contains:
- `info.total_token_usage` and `info.last_token_usage`: input, cached_input, output, reasoning_output, total tokens
- `info.model_context_window`: 258400 (for gpt-5.4)
- `rate_limits.primary`: used_percent, window_minutes (300), resets_at
- `rate_limits.secondary`: used_percent, window_minutes (10080), resets_at
- `rate_limits.plan_type`: "pro"
- `rate_limits.credits`: null (on pro plan; may differ on other tiers)

The `--json` streaming mode provides a simpler per-turn `{"type":"turn.completed","usage":{...}}` with input, cached_input, and output tokens — no reasoning tokens or context window size.

Previously undocumented: `turn_context.truncation_policy = {"mode": "tokens", "limit": 10000}` — Codex applies 10K token truncation to context by default.

### Claude Code OTel: One metric confirmed

`claude_code.session.count` emitted as COUNTER with identity attributes: user.id (hashed), session.id, organization.id, user.email, user.account_uuid, user.account_id, terminal.type. Output format is JS object literal, not strict JSON.

### Statusline bridge: H3 confirmed

The statusline hook (`gsdr-statusline.js`) receives `cost.total_cost_usd`, `rate_limits.five_hour`, `rate_limits.seven_day`, `context_window.context_window_size`, and 10+ additional fields. Currently writes only: `session_id`, `remaining_percentage`, `used_pct`, `timestamp`.

Bridge extension is feasible — the write is at lines 41-46, wrapped in try/catch, localized.

## Decision

Treat Claude Code and Codex as structurally non-equivalent telemetry sources:
- Codex: use native JSONL `token_count` events (no OTel console path exists)
- Claude Code: OTel console exporter works but full characterization pending; statusline bridge is immediately usable
- Statusline bridge: extend to write the full available payload (cost, rate limits, context window size, model ID)

## Consequences

- The "common OTel normalization" assumption in Phase 57 CONTEXT.md is incorrect for the console/local case. Cross-runtime normalization must work across Claude OTel and Codex native JSONL.
- Statusline bridge extension (gsdr-statusline.js lines 41-46) is a high-value, low-risk change that unlocks cost and rate-limit data for all downstream hooks.
- Codex `truncation_policy` (10K token limit) is an undocumented constraint that may affect long-session telemetry completeness.
- The `credits` field in Codex rate_limits is null on pro — worth checking on other plan tiers for credit-based billing data.
- Part 1 (Claude Code OTel full characterization) remains open and should be completed in a separate manual session using `run-claude-otel.sh`.
