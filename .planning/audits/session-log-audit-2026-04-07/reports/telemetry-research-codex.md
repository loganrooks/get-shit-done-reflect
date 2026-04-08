# Codex CLI Telemetry Research

**Date:** 2026-04-08
**Scope:** Answer survey questions 4, 5, 6, and 8 from `./.planning/audits/session-log-audit-2026-04-07/reports/telemetry-survey.md`, plus adjacent findings on config defaults, debug logging, `codex debug`, and exec vs interactive session files.

## Local Sources Inspected

- `./.planning/audits/session-log-audit-2026-04-07/reports/telemetry-survey.md`
- `~/.codex/config.toml`
- `~/.codex/sessions/2026/04/08/rollout-2026-04-08T01-39-02-019d6b99-ea46-7e12-9b5b-c3c054fe710b.jsonl`
- `~/.codex/sessions/2026/04/07/rollout-2026-04-07T14-49-51-019d6947-9417-7843-99de-f868867aa0f6.jsonl`
- `~/.codex/sessions/2026/04/08/rollout-2026-04-08T01-41-11-019d6b9b-e1a3-7dc0-9420-67dbc23884c6.jsonl`
- `codex --help`
- `codex exec --help`
- `codex debug --help`
- `codex debug app-server --help`
- `codex debug app-server send-message-v2 --help`

## 4. Token Usage Granularity: Per Tool Call or Per Turn?

**Finding:** Codex session logs expose token usage as per-turn or per-progress snapshots, not per individual tool execution.

### Evidence

In the current exec session, three tool calls occur before one `token_count` event:

- File: `~/.codex/sessions/2026/04/08/rollout-2026-04-08T01-39-02-019d6b99-ea46-7e12-9b5b-c3c054fe710b.jsonl`
- Lines 12-14: three `response_item` entries with `payload.type = "function_call"` and `payload.name = "exec_command"`
- Line 15: one `event_msg` with `payload.type = "token_count"`

Exact field names and example values from line 15:

- `payload.info.total_token_usage.input_tokens = 25994`
- `payload.info.total_token_usage.cached_input_tokens = 3456`
- `payload.info.total_token_usage.output_tokens = 825`
- `payload.info.total_token_usage.reasoning_output_tokens = 516`
- `payload.info.total_token_usage.total_tokens = 26819`
- `payload.info.last_token_usage.total_tokens = 26819`
- `payload.info.model_context_window = 258400`

The older exec sample shows the same pattern at a larger scale:

- File: `~/.codex/sessions/2026/04/07/rollout-2026-04-07T14-49-51-019d6947-9417-7843-99de-f868867aa0f6.jsonl`
- Lines 170-173: four `function_call` entries
- Line 174: one `token_count` entry

Example values from line 174:

- `payload.info.last_token_usage.input_tokens = 230627`
- `payload.info.last_token_usage.cached_input_tokens = 230144`
- `payload.info.last_token_usage.output_tokens = 807`
- `payload.info.last_token_usage.reasoning_output_tokens = 309`
- `payload.info.last_token_usage.total_tokens = 231434`

### What Is Not Present

I did **not** find any per-tool token fields such as:

- `tool_name`
- `tool_token_usage`
- `call_id` attached to `token_count`
- `reasoning_output_tokens` split by tool

The `token_count` event schema is usage-only plus rate limits:

- `payload.info.total_token_usage.*`
- `payload.info.last_token_usage.*`
- `payload.info.model_context_window`
- `payload.rate_limits.*`

### Conclusion

For Codex CLI session logs, token accounting is currently usable at the turn/progress level, not at individual tool-call granularity. A sensor can correlate token deltas with a cluster of tool calls in the same turn, but cannot reliably attribute tokens to one specific tool call when multiple calls happen before the next `token_count` event.

## 5. Pricing Data Needed for Cross-Platform Cost Normalization

**Finding:** A cross-platform cost model needs more than raw token counts. It needs provider/model pricing metadata, cache semantics, long-context modifiers, and a policy for reasoning tokens.

### Minimum normalization fields

At minimum, the sensor should normalize to a schema like:

- `provider`
- `observed_model`
- `pricing_model`
- `pricing_source_url`
- `pricing_effective_date`
- `input_tokens`
- `cached_input_tokens`
- `output_tokens`
- `reasoning_output_tokens`
- `cache_write_tokens_5m` or equivalent, if available
- `cache_write_tokens_1h` or equivalent, if available
- `cache_read_tokens`
- `input_cost_per_mtoken`
- `cached_input_cost_per_mtoken`
- `output_cost_per_mtoken`
- `reasoning_cost_per_mtoken`
- `long_context_threshold_tokens`
- `long_context_input_cost_per_mtoken`
- `long_context_output_cost_per_mtoken`
- `pricing_mode`

`reasoning_cost_per_mtoken` should usually be an alias of output-token pricing, not a separate table, unless the provider documents otherwise.

### OpenAI: current pricing relevant to Codex

Official pricing page: <https://developers.openai.com/api/docs/pricing>

From the current pricing page:

- `gpt-5.4` standard short-context: input `$2.50 / 1M`, cached input `$0.25 / 1M`, output `$15.00 / 1M`
- `gpt-5.4-pro` standard short-context: input `$30.00 / 1M`, output `$180.00 / 1M`

OpenAI also documents the long-context rule explicitly on the GPT-5.4 model page:

- Source: <https://developers.openai.com/api/docs/models/gpt-5.4-pro>
- Rule: for `gpt-5.4` and `gpt-5.4-pro`, prompts with `>272K` input tokens on the `1.05M` context window are priced at `2x` input and `1.5x` output for the full session

Inference from that rule:

- `gpt-5.4` long-context effective rates become input `$5.00 / 1M`, cached input `$0.50 / 1M`, output `$22.50 / 1M`
- `gpt-5.4-pro` long-context effective rates become input `$60.00 / 1M`, output `$270.00 / 1M`

The pricing pages also distinguish pricing modes such as batch, flex, and priority. Even when a sensor does not have the exact per-mode table cached locally, it still needs a `pricing_mode` field in its normalization schema because the same token counts can price differently depending on mode.

### OpenAI reasoning token pricing

Official reasoning guide: <https://developers.openai.com/api/docs/guides/reasoning>

OpenAI explicitly states:

- reasoning tokens are separate from visible output in the usage object
- reasoning tokens occupy context window space
- reasoning tokens are billed as output tokens

Exact field/example from the reasoning guide:

- `usage.output_tokens_details.reasoning_tokens = 1024`

This means a Codex session field such as:

- `payload.info.last_token_usage.reasoning_output_tokens`

should be priced at the model's **output token rate**, not a separate rate.

### OpenAI o-series pricing currently visible

Model reference pages currently show:

- `o3`: input `$2.00 / 1M`, cached input `$0.50 / 1M`, output `$8.00 / 1M`
  - Source: <https://developers.openai.com/api/docs/models/o3>
- `o4-mini`: input `$1.10 / 1M`, cached input `$0.275 / 1M`, output `$4.40 / 1M`
  - Source: <https://developers.openai.com/api/docs/models/o4-mini>

Inference: because OpenAI states reasoning tokens are billed as output tokens, `o3` reasoning tokens should price at `$8.00 / 1M` and `o4-mini` reasoning tokens at `$4.40 / 1M`.

### Anthropic: current pricing needed for normalization

Official pricing page: <https://platform.claude.com/docs/en/about-claude/pricing>

Current per-model token rates from the pricing docs/search crawl:

- `Claude Sonnet 4.5`: base input `$3 / MTok`, 5m cache write `$3.75 / MTok`, 1h cache write `$6 / MTok`, cache read `$0.30 / MTok`, output `$15 / MTok`
- `Claude Sonnet 4`: base input `$3 / MTok`, 5m cache write `$3.75 / MTok`, 1h cache write `$6 / MTok`, cache read `$0.30 / MTok`, output `$15 / MTok`
- `Claude Haiku 4.5`: base input `$1 / MTok`, 5m cache write `$1.25 / MTok`, 1h cache write `$2 / MTok`, cache read `$0.10 / MTok`, output `$5 / MTok`
- `Claude Haiku 3.5`: base input `$0.80 / MTok`, 5m cache write `$1 / MTok`, 1h cache write `$1.6 / MTok`, cache read `$0.08 / MTok`, output `$4 / MTok`
- `Claude Opus 3`: base input `$15 / MTok`, 5m cache write `$18.75 / MTok`, 1h cache write `$30 / MTok`, cache read `$1.50 / MTok`, output `$75 / MTok`

The pricing page also states:

- cache reads cost `10%` of base input price
- 5-minute cache writes cost `1.25x` base input
- 1-hour cache writes cost `2x` base input

Long-context pricing is also a normalization input:

- for supported 1M-context Claude models, pricing changes when input exceeds `200K` tokens
- example from the current docs crawl:
  - `Claude Opus 4.6`: input `$5 / MTok` up to `200K`, then `$10 / MTok` above `200K`; output `$25 / MTok` up to `200K`, then `$37.50 / MTok`
  - `Claude Sonnet 4.5 / 4`: input `$3 / MTok` up to `200K`, then `$6 / MTok`; output `$15 / MTok` up to `200K`, then `$22.50 / MTok`

### Anthropic reasoning-token implication

I did **not** find a separate published Anthropic price line for "thinking" or "reasoning" tokens on the pricing page. For normalization, the safe implementation is:

- preserve any provider-specific "thinking" token breakdown if a runtime exposes it
- price Claude output-like reasoning at the normal output rate unless Anthropic publishes a distinct rate

That last sentence is an inference from the absence of a separate pricing column, not an explicit Anthropic statement.

### Practical recommendation

For a unified sensor, normalize costs by **provider-native billing semantics**, not by pretending tokens are cross-model equivalent. Raw token counts remain useful for efficiency reporting, but cost comparison needs:

- provider-specific cache semantics
- reasoning-output treatment
- long-context thresholds
- pricing mode modifiers such as batch, flex, priority, and data residency

## 6. How Existing Projects Handle Cross-Model Normalization

### `claude-spend`

Repo: <https://github.com/writetoaniketparihar-collab/claude-spend>

README summary:

- reads local Claude Code session files from `~/.claude/`
- shows token usage per conversation, per day, and per model
- keeps data local

Parser implementation:

- Source: <https://raw.githubusercontent.com/writetoaniketparihar-collab/claude-spend/main/src/parser.js>
- Hardcoded table name: `MODEL_PRICING`
- Example keys: `input`, `output`, `cacheWrite`, `cacheRead`
- Example model buckets: `'opus-4.5'`, `'opus-4.6'`, `sonnet`, `'haiku-4.5'`, `'haiku-3.5'`

Important behavior:

- reads provider-native usage fields from Claude session logs
- computes cost directly from a local price map
- collects tool names from `tool_use` blocks, but does **not** assign token usage per tool

This is useful precedent for a local telemetry parser, but it is **Claude-specific**, not a general cross-provider normalization framework.

### LangSmith

Docs: <https://docs.langchain.com/langsmith/ls-metadata-parameters>

LangSmith standardizes cost tracking through metadata and token counts:

- provider key: `ls_provider`
- model key: `ls_model_name`
- optional config keys: `ls_temperature`, `ls_max_tokens`, `ls_stop`, `ls_invocation_params`

Cost tracking dependencies documented by LangSmith:

- `run_type = "llm"`
- token usage present as `prompt_tokens` and `completion_tokens`
- provider/model must match pricing DB or custom pricing

Pattern:

- normalize model identity first
- keep token counts in a provider-agnostic schema
- compute cost from a pricing database keyed by provider + model

This is closer to what we need than `claude-spend`.

### Langfuse

Docs: <https://langfuse.com/docs/observability/sdk/overview>

Langfuse's key normalization concept is the `generation` observation:

- `model`
- `model_parameters`
- `usage_details`
- `cost_details`

It also separates tool calls from model generations at the trace level:

- LLM call observation type: `generation`
- tool call observation type: `tool`

Pattern:

- token/cost tracking is attached to model-generation spans, not all spans
- tools are modeled separately for observability, not through per-tool token billing fields

This is relevant to Codex because Codex also emits tool calls distinctly but does not bill them separately in session logs.

### W&B Weave

Docs: <https://docs.wandb.ai/weave/guides/tracking/costs/>

Weave exposes explicit custom-cost registration:

- `client.add_cost(llm_id=..., prompt_token_cost=..., completion_token_cost=...)`

It then aggregates costs in trace summaries:

- `call.summary["weave"]["costs"]`
- `prompt_tokens_total_cost`
- `completion_tokens_total_cost`

Pattern:

- separate model identity from price table
- keep prompt vs completion cost as first-class dimensions
- allow custom price overrides when provider defaults are not enough

### LiteLLM

Repo pricing map: <https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json>

This is the clearest open-source example of a cross-provider normalization schema. Its sample fields include:

- `input_cost_per_token`
- `output_cost_per_token`
- `input_cost_per_audio_token`
- `computer_use_input_cost_per_1k_tokens`
- `computer_use_output_cost_per_1k_tokens`
- `file_search_cost_per_1k_calls`
- `litellm_provider`
- `max_input_tokens`
- `max_output_tokens`

Pattern:

- keep a canonical per-model pricing registry
- include both token costs and tool-call costs
- treat context-window metadata as part of the pricing/normalization lookup

### Synthesis

Across these projects, the dominant pattern is:

1. Preserve provider-native usage counts.
2. Normalize model identity into a priceable key.
3. Apply a provider/model pricing table.
4. Keep tool traces separate from token-cost traces unless the provider exposes real per-tool billing.

The mature tools are cost-normalized, not "token-equivalent" normalized.

## 8. Are `codex exec -c` Overrides Reflected in Session Logs?

**Finding:** The session log captures the **effective resolved settings**, but not the raw `-c key=value` argument itself.

### Default config

File: `~/.codex/config.toml`

Relevant defaults:

- `model = "gpt-5.4"`
- `model_reasoning_effort = "xhigh"`
- `plan_mode_reasoning_effort = "xhigh"`

### Current exec session

File: `~/.codex/sessions/2026/04/08/rollout-2026-04-08T01-39-02-019d6b99-ea46-7e12-9b5b-c3c054fe710b.jsonl`

`session_meta` fields:

- `payload.originator = "codex_exec"`
- `payload.source = "exec"`
- `payload.cli_version = "0.118.0"`
- `payload.model_provider = "openai"`

`turn_context` fields:

- `payload.model = "gpt-5.4"`
- `payload.collaboration_mode.settings.model = "gpt-5.4"`
- `payload.collaboration_mode.settings.reasoning_effort = "high"`
- `payload.effort = "high"`
- `payload.approval_policy = "never"`
- `payload.sandbox_policy.type = "danger-full-access"`

### Interpretation

This session used `-c model_reasoning_effort=...` and the effective session value is clearly `high`, while the default config value is `xhigh`.

Therefore:

- yes, the override is reflected in the session log
- no, the literal config key string `model_reasoning_effort` is not persisted as such

I confirmed this by searching the session JSONL:

- `reasoning_effort` appears
- `effort` appears
- `model_reasoning_effort` does **not** appear

### Practical implication

A sensor can recover **effective runtime behavior** from session logs, but cannot always prove **where** a setting came from:

- default config
- profile
- `-c` override
- another config layer

If the effective value differs from the default config, that strongly suggests an override, but the log does not preserve the original command-line provenance.

## Additional Findings

### `~/.codex/config.toml` defaults relevant to telemetry

The local config file exposes defaults a sensor may want to record alongside session logs:

- `personality = "pragmatic"`
- `model = "gpt-5.4"`
- `model_reasoning_effort = "xhigh"`
- `plan_mode_reasoning_effort = "xhigh"`

The TUI config also shows the CLI already surfaces some telemetry to the human user:

- `[tui].status_line = ["model-with-reasoning", "context-remaining", "current-dir", "project-root", "git-branch", "five-hour-limit", "weekly-limit", "context-window-size", "used-tokens"]`

### Debug / verbose logging modes

I did **not** find a documented verbose or telemetry-debug mode in the local CLI surface:

- `codex --help`: no `--verbose`, `--trace`, or telemetry flag
- `codex exec --help`: no verbose flag
- `codex debug --help`: no session-inspection or telemetry subcommand
- search through `~/.codex/config.toml` and local Codex markdown/toml docs found no relevant `verbose`, `telemetry`, or `RUST_LOG` setting
- `strings "$(command -v codex)"` did not reveal obvious hidden telemetry/debug env vars

The closest thing to extra visibility is:

- `codex exec --json`
  - streams events to stdout as JSONL
- `codex exec --ephemeral`
  - disables session-file persistence

So the practical telemetry surfaces appear to be:

- persisted JSONL session logs
- live JSONL event streaming via `--json`

### What `codex debug` provides

Current help output shows:

- `codex debug`
  - `app-server`
- `codex debug app-server`
  - `send-message-v2`

This appears to be app-server troubleshooting, not telemetry introspection. I found no built-in debug subcommand for:

- reading session logs
- exposing richer token accounting
- dumping hidden runtime telemetry

### Exec vs interactive session files

The JSONL schema appears materially the same between exec and interactive runs.

Exec sample:

- File: `~/.codex/sessions/2026/04/08/rollout-2026-04-08T01-39-02-019d6b99-ea46-7e12-9b5b-c3c054fe710b.jsonl`
- `session_meta.payload.originator = "codex_exec"`
- `session_meta.payload.source = "exec"`

Interactive sample:

- File: `~/.codex/sessions/2026/04/08/rollout-2026-04-08T01-41-11-019d6b9b-e1a3-7dc0-9420-67dbc23884c6.jsonl`
- `session_meta.payload.originator = "codex-tui"`
- `session_meta.payload.source = "cli"`

The interactive sample captured the same major event families:

- `session_meta`
- `event_msg` with `task_started`
- `turn_context`
- `response_item`
- `event_msg` with `token_count`

The main differences are effective runtime settings, not schema:

- interactive sample:
  - `approval_policy = "on-request"`
  - `sandbox_policy.type = "workspace-write"`
  - `sandbox_policy.network_access = false`
  - `effort = "xhigh"`
- exec sample:
  - `approval_policy = "never"`
  - `sandbox_policy.type = "danger-full-access"`
  - `effort = "high"`

Conclusion: a unified parser can likely handle both exec and interactive logs with one schema branch, keyed mainly on `session_meta.payload.source`.

## Implications For A Codex Sensor

- Use `turn_context` plus `token_count` as the primary telemetry source.
- Treat `reasoning_output_tokens` as separately reportable but costed at output-token rates for OpenAI models.
- Do not attempt exact per-tool token attribution from session logs alone.
- Record effective session settings from `turn_context`; do not assume command-line flags are recoverable.
- Maintain an external pricing registry keyed by provider + pricing model + mode + long-context tier.

## Web Sources

- OpenAI pricing: <https://developers.openai.com/api/docs/pricing>
- OpenAI reasoning guide: <https://developers.openai.com/api/docs/guides/reasoning>
- OpenAI GPT-5.4 pro model page: <https://developers.openai.com/api/docs/models/gpt-5.4-pro>
- OpenAI o3 model page: <https://developers.openai.com/api/docs/models/o3>
- OpenAI o4-mini model page: <https://developers.openai.com/api/docs/models/o4-mini>
- Anthropic pricing: <https://platform.claude.com/docs/en/about-claude/pricing>
- `claude-spend` repo: <https://github.com/writetoaniketparihar-collab/claude-spend>
- `claude-spend` parser: <https://raw.githubusercontent.com/writetoaniketparihar-collab/claude-spend/main/src/parser.js>
- LangSmith metadata parameters: <https://docs.langchain.com/langsmith/ls-metadata-parameters>
- Langfuse SDK overview: <https://langfuse.com/docs/observability/sdk/overview>
- W&B Weave custom costs: <https://docs.wandb.ai/weave/guides/tracking/costs/>
- LiteLLM pricing/context map: <https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json>
