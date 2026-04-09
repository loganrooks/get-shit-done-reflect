# Spike Decision: Cross-Runtime OTel & Bridge Validation

**Completed:** 2026-04-09 (Parts 2 and 3; Part 1 partially executed)
**Question:** What do Claude Code's OTel export and Codex CLI's OTel export actually produce? How do they compare to each other and to session-meta? Does the statusline payload actually include cost and rate limit fields?
**Answer:** Codex has no console OTel exporter — the documented `exporter = "console"` config value is rejected at startup. Real Codex telemetry lives in session JSONL `token_count` events and `--json` streaming, not OTel. Claude Code OTel console exporter works but produces sparse output from a non-interactive session. The statusline hook receives the full rich payload including cost and rate limits but currently writes only 4 fields to the bridge file — leaving 12+ actionable fields unwritten.

## Summary

The Codex OTel experiment revealed an immediate documentation gap: the value `"console"` for `[otel].exporter` is silently rejected by Codex 0.118.0 with a hard error (`unknown variant 'console', expected one of 'none', 'statsig', 'otlp-http', 'otlp-grpc'`). The documentation we fetched described a console exporter path that does not exist in the shipping binary. What Codex does provide is rich session-level telemetry through two channels: persisted JSONL session files (already characterized in telemetry-research-codex.md) and a live `--json` streaming mode that exposes per-turn token usage, rate limits, reasoning token counts, and context window size directly. These are not OTel — they are Codex-native event streams.

Claude Code's console OTel exporter does work (Part 1, partially executed in a separate terminal). The partial log captured confirms that `claude_code.session.count` emits as a COUNTER with rich identity attributes. However the session was a non-interactive `--print` run that failed immediately, so only the session.count metric fired and no tool-use, api_request, or token metrics were observed. A full interactive session with the `OTEL_METRICS_EXPORTER=console` env vars is still required to characterize the complete metric set.

The statusline bridge is the most concrete finding: the telemetry-research-claude.md documented the full statusline payload schema with cost, rate limits, and context window fields. Direct inspection of live bridge files confirms these are written in a minimal 4-field format currently. The source code of gsdr-statusline.js confirms it receives all the rich fields but only persists `session_id`, `remaining_percentage`, `used_pct`, and `timestamp` — leaving `cost.total_cost_usd`, `context_window.context_window_size`, `rate_limits.five_hour`, `rate_limits.seven_day`, and 8+ additional fields available but unwritten.

## Findings

### Experiment: Codex OTel Console Exporter Validation

**Result:** FAILED — `console` is not a valid exporter value in Codex 0.118.0

**Data from stderr:**
```
Error loading config.toml: unknown variant `console`, expected one of `none`, `statsig`, `otlp-http`, `otlp-grpc`
in `otel.exporter`
```

**Valid exporter values (as of Codex 0.118.0):**
- `none` — no OTel export
- `statsig` — OpenAI's internal analytics (opaque, user-inaccessible)
- `otlp-http` — OTLP over HTTP (requires external collector infrastructure)
- `otlp-grpc` — OTLP over gRPC (requires external collector infrastructure)

**Implication:** The "console OTel exporter" path documented in our Phase 57 CONTEXT.md does not exist for Codex. There is no lightweight local-inspection path analogous to Claude Code's `OTEL_METRICS_EXPORTER=console`. Observing Codex OTel output requires standing up an OTLP collector endpoint, which is out of scope for this spike.

**Alternative telemetry channel discovered:** Running `codex exec ... --json` streams JSONL events to stdout including a `turn.completed` event with a `usage` object:

```json
{"type":"turn.completed","usage":{"input_tokens":61533,"cached_input_tokens":33792,"output_tokens":492}}
```

This is structurally similar to the session JSONL `token_count` event but delivered live via stdout rather than persisted to `~/.codex/sessions/`.

### Experiment: Codex Session JSONL Token Telemetry (via --json mode)

**Result:** CONFIRMED — session JSONL `token_count` events contain rate limits and token data not documented in the spike's OTel target

**Evidence from `rollout-2026-04-09T15-23-20-019d73b2-f0c3-7a40-bd16-d0c4c038d352.jsonl`:**

Session structure (20 lines):
- Line 1: `session_meta` — provider, cli_version, originator, cwd, git state
- Line 2: `event_msg/task_started`
- Lines 3-6: `response_item/message` (pre-turn system messages)
- Line 5: `turn_context` — effective runtime settings
- Lines 8, 14, 19: `event_msg/token_count` — per-turn token usage + rate limits

**token_count event structure (complete schema from live session):**

```json
{
  "type": "token_count",
  "info": {
    "total_token_usage": {
      "input_tokens": 61533,
      "cached_input_tokens": 33792,
      "output_tokens": 492,
      "reasoning_output_tokens": 119,
      "total_tokens": 62025
    },
    "last_token_usage": {
      "input_tokens": 31403,
      "cached_input_tokens": 30336,
      "output_tokens": 214,
      "reasoning_output_tokens": 0,
      "total_tokens": 31617
    },
    "model_context_window": 258400
  },
  "rate_limits": {
    "limit_id": "codex",
    "limit_name": null,
    "primary": {
      "used_percent": 0.0,
      "window_minutes": 300,
      "resets_at": 1775780589
    },
    "secondary": {
      "used_percent": 0.0,
      "window_minutes": 10080,
      "resets_at": 1776367389
    },
    "credits": null,
    "plan_type": "pro"
  }
}
```

**Notable:** The first `token_count` in a session has `info: null` and only `rate_limits`. Subsequent events have both. This means rate limit state is available even before any tokens are consumed.

**response_item types observed:**
- `message` — text from model
- `reasoning` — encrypted reasoning content (`encrypted_content` field; not inspectable)
- `function_call` — tool invocation with `name`, `call_id`, `arguments`
- `function_call_output` — tool result with `call_id`, `output`

**turn_context effective settings (confirmed):**
- `model`, `effort`, `approval_policy`, `sandbox_policy`, `personality`
- `truncation_policy` — `{"mode": "tokens", "limit": 10000}` — undocumented in prior research
- `realtime_active: false`
- `summary: "none"`

**--json streaming usage object (simpler schema):**
```json
{"type": "turn.completed", "usage": {"input_tokens": 61533, "cached_input_tokens": 33792, "output_tokens": 492}}
```
Note: the `--json` streaming usage omits `reasoning_output_tokens` and `model_context_window` that appear in the JSONL session file's `token_count` events. The JSONL session file is richer.

### Experiment: Claude Code OTel Console Exporter (Partial — Part 1)

**Status:** PARTIAL — non-interactive session only; interactive session pending manual execution

**What was captured (claude-otel-output.log, 28 lines):**

One metric emitted before the session failed (ran as `--print` with no stdin):

```javascript
{
  descriptor: {
    name: "claude_code.session.count",
    type: "COUNTER",
    description: "Count of CLI sessions started",
  },
  dataPoints: [{
    attributes: {
      "user.id": "e877fabc...",
      "session.id": "0e50c8c2-...",
      "organization.id": "5687783b-...",
      "user.email": "logan.rooks@mail.utoronto.ca",
      "user.account_uuid": "eacd0be9-...",
      "user.account_id": "user_01Vzfa...",
      "terminal.type": "vscode",
    },
    value: 1
  }]
}
```

**Confirmed:** Claude Code OTel console exporter works. The `OTEL_METRICS_EXPORTER=console` path is valid. Output format is JavaScript-style object literal, not strict JSON.

**Identity attributes on session.count:** user.id (hashed), session.id, organization.id, user.email, user.account_uuid, user.account_id, terminal.type. These are richer identity fields than what appears in session JSONL.

**Not yet observed:** api_request counter, token.usage metrics, tool-related metrics, log events. These require an interactive session with actual API calls. Full characterization requires Part 1 manual execution.

### Experiment: Statusline Bridge Field Inventory

**Result:** CONFIRMED — statusline receives the full documented payload; bridge file writes only 4 of the available fields

**Bridge file actual content (observed across multiple live sessions):**

```json
{
  "session_id": "a60f5b0b-3c14-4ba3-89c1-85e9f586ce7a",
  "remaining_percentage": 75,
  "used_pct": 30,
  "timestamp": 1775762527
}
```

Also observed: `-warned.json` variant files with different schema:
```json
{"callsSinceWarn": 3, "lastLevel": "warning"}
```
These are written by the context-monitor hook, not the statusline hook.

**Statusline payload fields RECEIVED but NOT written to bridge file:**

From `gsdr-statusline.js` source analysis — the hook reads these from `data` but does not write them:

| Field | Path in payload | Current bridge | What writing it enables |
|-------|----------------|----------------|------------------------|
| Model ID | `data.model.id` | absent | Model tracking across sessions |
| Model display name | `data.model.display_name` | absent | Human-readable model labeling |
| Context window size | `data.context_window?.context_window_size` | absent | Distinguish 200k vs 1M windows |
| Total input tokens | `data.context_window?.total_input_tokens` | absent | Cumulative session token accounting |
| Total output tokens | `data.context_window?.total_output_tokens` | absent | Cumulative session token accounting |
| Session cost USD | `data.cost?.total_cost_usd` | absent | Direct cost tracking |
| Total duration ms | `data.cost?.total_duration_ms` | absent | Session time budgeting |
| 5h rate limit % | `data.rate_limits?.five_hour?.used_percentage` | absent | Rate limit awareness for sensors |
| 5h reset timestamp | `data.rate_limits?.five_hour?.resets_at` | absent | Rate limit timing |
| 7d rate limit % | `data.rate_limits?.seven_day?.used_percentage` | absent | Rate limit awareness for sensors |
| 7d reset timestamp | `data.rate_limits?.seven_day?.resets_at` | absent | Rate limit timing |
| Version | `data.version` | absent | Runtime version tracking |
| Session name | `data.session_name` | absent | Human-readable session labeling |
| Workspace project dir | `data.workspace?.project_dir` | absent | Project-scoped attribution |

**Fields currently written to bridge:**

| Field | Purpose |
|-------|---------|
| `session_id` | Session correlation |
| `remaining_percentage` | Raw context % from payload |
| `used_pct` | Normalized context % (accounts for 16.5% autocompact buffer) |
| `timestamp` | Unix epoch for cache invalidation |

**Code location of bridge write:** `gsdr-statusline.js` lines 41-46. The write is already wrapped in try/catch with silent fail behavior. Extension requires only adding fields to the `bridgeData` object at that site.

## Analysis

### Cross-Runtime OTel Comparison

| Dimension | Claude Code OTel | Codex OTel |
|-----------|-----------------|------------|
| Console exporter | Yes (`OTEL_METRICS_EXPORTER=console`) | No — `console` is rejected; only `statsig`, `otlp-http`, `otlp-grpc`, `none` |
| Local inspection without infrastructure | Yes | No (requires OTLP collector for `otlp-http`/`otlp-grpc`) |
| Output format | JS-style object literal | N/A (not accessible) |
| Rate limits in OTel | Unknown (Part 1 incomplete) | N/A |
| Token data in native telemetry | In session JSONL (confirmed) | In session JSONL `token_count` events (confirmed) |
| Reasoning token visibility | Unknown (OTel) / Redacted (JSONL) | `reasoning_output_tokens` in `token_count` (confirmed) |
| Rate limits in native telemetry | In statusline payload (confirmed) | In `token_count.rate_limits` (confirmed) |
| Cost in USD | In statusline `cost.total_cost_usd` | Not present in any Codex telemetry surface |

### H1 Assessment (Claude Code OTel)

**Partially testable.** The console exporter is valid. One metric confirmed. Full characterization requires a complete interactive session. The `session.count` metric includes identity attributes not present in session JSONL, suggesting OTel does add value beyond JSONL.

### H2 Assessment (Codex OTel)

**Falsified** for the console exporter path. The Codex OTel documentation describes a `console` exporter that does not exist in the shipping binary. What exists is:
- `statsig` — opaque, user-inaccessible
- `otlp-http` / `otlp-grpc` — require external collector
- Native JSONL session files — confirmed rich (documented in telemetry-research-codex.md)
- `--json` streaming — confirmed works, slightly less rich than JSONL

The hypothesis that Codex OTel would provide "token-level data comparable to its JSONL turn_context" is vacuously true in that the native JSONL already provides that data — but not via OTel.

### H3 Assessment (Statusline bridge feasibility)

**Confirmed.** The statusline payload includes `cost.total_cost_usd`, `rate_limits.five_hour`, `rate_limits.seven_day`, and `context_window.context_window_size`. These are all available to `gsdr-statusline.js`. Bridge extension is feasible with a localized code change at the bridge write site.

### H-alt-3 Relevance (Fundamentally incompatible OTel schemas)

This hypothesis becomes moot for Codex given the console exporter does not exist. The "common OTel normalization" assumption in CONTEXT.md Q1 needs to be reframed: Codex does not offer OTel as a local telemetry surface. Any cross-runtime normalization must work across Claude Code OTel + Codex native JSONL, which are structurally different.

## Decision

**Chosen approach:** Treat Codex and Claude Code as structurally non-equivalent telemetry sources, not as two OTel streams requiring common normalization.

For Codex: use native JSONL session files as the primary telemetry source. The `token_count` event schema is confirmed rich and includes rate limits, reasoning tokens, model context window, and cumulative/per-turn token accounting. The `--json` streaming mode provides live access to a subset of this during execution.

For Claude Code: the OTel console exporter path is valid but uncharacterized at the full metric/event level (pending Part 1 manual execution). The statusline bridge is an immediately usable telemetry channel that already receives cost, rate limits, and context window data.

For the statusline bridge: extend the bridge file to write the full available payload. The extension point is localized (lines 41-46 of `gsdr-statusline.js`), the receive infrastructure already exists in hooks that read the bridge, and the data is confirmed present in the statusline payload.

**Confidence:** MEDIUM-HIGH for Codex (direct empirical confirmation); MEDIUM for Claude Code OTel (partial — one metric confirmed, full catalog pending).

## Implications

- The Phase 57 CONTEXT.md assumption that both runtimes can be unified under an OTel normalization schema is incorrect for the local/console case. Codex does not support console OTel. Any normalization schema must accommodate Claude Code OTel as one source and Codex native JSONL as a separate source.

- The `truncation_policy` field in Codex `turn_context` is undocumented in prior research: `{"mode": "tokens", "limit": 10000}` reveals that Codex applies aggressive context truncation (10K tokens) by default. This is a significant constraint for long-running sessions that the telemetry-research-codex.md did not document.

- The Codex `token_count` events include a `credits` field that is currently `null` on a `pro` plan. This field warrants investigation on other plan tiers — it may expose credit-based billing data.

- The `-warned.json` bridge files are written by the context-monitor hook with a different schema than the statusline bridge. Two separate bridge file patterns coexist in `/tmp/` that are easy to confuse. A consolidated bridge file would simplify the downstream hook architecture.

- Reasoning tokens (`reasoning_output_tokens`) are present and non-zero in Codex session logs. The first turn had 119 reasoning tokens; the second had 0. This variation suggests reasoning effort is non-deterministic at the session level, not just a per-invocation parameter.

- The statusline bridge extension is low-risk because the existing write is already wrapped in a try/catch with silent-fail behavior. No error handling changes are needed. The cost is additional bytes per bridge write; the benefit is all downstream hooks gaining access to cost, rate limits, and context window size.

## Opened Territory

- **Codex console OTel gap**: Can the `otlp-http` exporter be pointed at a localhost OTLP receiver for lightweight experimentation? This was out of scope for this spike but would complete the Codex OTel characterization.
- **`credits` field**: Is `null` on pro. What does it contain on other plan tiers? Relevant to cost normalization.
- **`truncation_policy` consequences**: The `limit: 10000` token truncation in Codex `turn_context` may silently drop context in long sessions. Does this appear in session logs or only in the truncated turn_context? Is it configurable?
- **OTel metric cadence**: The one Claude Code metric we captured shows a 1.7-second measurement window. How frequently do metrics export in a real interactive session? Does the `OTEL_METRIC_EXPORT_INTERVAL=10000` env var actually control this?
- **Part 1 completion**: The full Claude Code OTel characterization (api_request, token.usage, tool metrics) remains pending. The run-claude-otel.sh script is ready.

## Self-Critique

This spike confirmed H3 (statusline fields are present) and falsified H2 (Codex console OTel) but left H1 (Claude Code OTel completeness) unresolved. The Codex OTel finding is a clean negative result: the documentation described something that does not exist in the binary. However, the spike's framing assumed both runtimes would have OTel as the characterization surface. The more interesting finding — that Codex native JSONL and `--json` streaming are already richer than OTel would have been — was not in the original hypothesis space.

The statusline field inventory was the most actionable output of this spike. It required no experiment execution, just careful reading of the source code. The original spike design treated this as secondary (Part 3) but it is arguably the most immediately usable finding.

A limitation: only one short `codex exec` session was run. The `token_count` schema seen here is consistent with prior research, but the `credits: null` field and `plan_type: "pro"` are observations from a single plan tier. The spike makes no claim about Max or Teams plan telemetry differences.

## Metadata

**Spike duration:** ~2 hours (Parts 2 and 3 plus bridge analysis)
**Iterations:** 1
**Originating phase:** 57
**Part 1 status:** Partial — one metric (session.count) captured; full interactive session pending manual execution
**Evidence type:** Empirical (direct execution and binary inspection) for Parts 2 and 3; documentary (source code analysis) for statusline
