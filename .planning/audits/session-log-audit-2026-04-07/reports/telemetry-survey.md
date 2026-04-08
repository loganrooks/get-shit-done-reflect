# Runtime Telemetry Survey — Pre-Milestone Research

**Date:** 2026-04-08
**Status:** Open — research phase complete, derived metrics identified, further deliberation needed
**Purpose:** Inventory all available telemetry data sources across Claude Code and Codex CLI to inform token/efficiency sensor design for v1.20 milestone scoping.
**Workflow note:** This task doesn't fit existing GSDR workflows (spike, quick, research-phase). It's informal pre-milestone research — a gap the harness should address. See Thread 11 in `pre-v1.20-session-capture.md`.

**Important:** The question of what measurements are relevant, important, and epistemically sound is still open and requires further deliberation. What follows is an inventory of what's *available* — not a claim about what's *useful*. Any metric can be misread: "fewer interruptions" could mean better code or user disengagement; "lower token usage" could mean efficiency or premature termination. The sensor design must pair measurements with interpretive context, not treat numbers as self-evident signals.

## Data Source Summary (Post-Research)

### Claude Code — Three Data Layers

**Layer 1: Pre-computed analytics (`~/.claude/usage-data/session-meta/*.json`)**
268 sessions with per-session aggregates. Fields include:
- `user_interruptions` — already a first-class metric (!)
- `user_response_times` — array of wait times between agent output and user input
- `tool_counts` — per-tool breakdown (Bash, Read, Grep, Agent, etc.)
- `tool_errors`, `tool_error_categories` (Command Failed, File Not Found, etc.)
- `input_tokens`, `output_tokens` — session totals
- `user_message_count`, `assistant_message_count`
- `git_commits`, `git_pushes`, `lines_added`, `lines_removed`, `files_modified`
- `languages` — detected languages and line counts
- `duration_minutes`, `message_hours` — timing distribution
- `uses_task_agent`, `uses_mcp`, `uses_web_search`, `uses_web_fetch`
- `first_prompt` — the opening user message

**Layer 2: AI-generated summaries (`~/.claude/usage-data/facets/*.json`)**
Per-session AI summaries. Contents not yet fully inventoried — needs further investigation.

**Layer 3: Raw session logs (`~/.claude/projects/{slug}/{session}.jsonl`)**
Per-message granularity. Entry types discovered:
- `user`, `assistant` — conversation messages with content blocks
- `attachment` — subtypes: `deferred_tools_delta`, `companion_intro`, `skill_listing`
- `system` — subtypes: `bridge_status`, `turn_duration` (with `durationMs`, `messageCount`)
- `queue-operation` — message queue management (enqueue/dequeue/remove)
- `progress` — progress indicators
- `file-history-snapshot` — file content snapshots for undo tracking
- `last-prompt` — session close marker

Per assistant message: `model`, `usage` (input/output/cache tokens), `content[]` (thinking, text, tool_use blocks)

**Layer 4: Statusline bridge files (`/tmp/claude-ctx-{session}.json`)**
Written by GSDR's statusline hook on every render. Contains:
- `remaining_percentage` — raw from Claude Code's statusline payload (`data.context_window.remaining_percentage`)
- `used_pct` — normalized (subtracts 16.5% autocompact buffer, scales to usable range)
- `timestamp` — seconds since epoch

The statusline hook receives from Claude Code: `data.context_window.remaining_percentage`, `data.model.display_name`, `data.session_id`, `data.workspace.current_dir`. Note: the statusline payload reportedly also includes `cost.total_cost_usd` and `rate_limits.*` but our hook currently only writes context % to the bridge file.

### Codex CLI — Two Data Layers

**Layer 1: Per-session logs (`~/.codex/sessions/{date}/rollout-{ts}-{id}.jsonl`)**
Entry types:
- `session_meta` — CLI version, source (exec/interactive), cwd, git state, model_provider
- `turn_context` — per-turn: model, effort level, context_window, approval/sandbox/truncation policy, collaboration_mode
- `token_count` — per-turn: total_token_usage, last_token_usage (both with input/cached/output/reasoning_output/total), model_context_window, rate_limits (primary/secondary used%, window, reset time, plan_type)
- `response_item` — message content (user/assistant/developer)
- `event_msg` — task_started, task_complete, token_count events

**Layer 2: History index (`~/.codex/history.jsonl`)**
Minimal: `session_id`, `ts`, `text` (prompt only). No token data.

### Effort Level — Cross-Platform Comparison

| | Claude Code | Codex CLI |
|---|---|---|
| Persisted default | `~/.claude/settings.json` → `effortLevel` ("low"/"medium"/"high") | `~/.codex/config.toml` |
| "max" persistence | Bug: silently downgrades to "high" (GitHub #30726) | N/A (uses "xhigh") |
| Env var override | `CLAUDE_CODE_EFFORT_LEVEL` | Via `-c` flag |
| Per-message in logs | NOT recorded on assistant entries | ✓ `turn_context.effort` per turn |
| Mid-session changes | Detectable: `/effort` commands appear as `command-message` entries | ✓ `turn_context` updates |
| Inference approach | Read `settings.json` for default; scan JSONL for `/effort` command entries to detect changes; between changes, assume the last-set level applies | Direct: read `turn_context.effort` |

## Derived / Second-Order Metrics

These are metrics we can *calculate* from available raw data. They don't require new instrumentation — just computation. The question of which are epistemically meaningful is open.

### Computable Now

| Metric | Computation | Source | Epistemological caveat |
|--------|-------------|--------|----------------------|
| **Cache efficiency ratio** | `cache_read / (cache_read + cache_creation)` per message | JSONL usage fields | High ratio = efficient reuse OR session doing the same thing repeatedly |
| **Context utilization trajectory** | Plot `used_pct` from bridge files over time | Bridge files (timestamped) | Steady growth = normal; thrashing = possible problem; but "problem" depends on task |
| **Token-per-tool attribution** | Correlate per-message usage with tool_use blocks in same message | JSONL | Approximate — multiple tool calls per message blur attribution |
| **Interruption-to-message ratio** | `user_interruptions / user_message_count` | session-meta | Low ratio ≠ quality; user may have stopped pushing back |
| **Tool error rate** | `tool_errors / total_tool_calls` | session-meta | High error rate during exploration is different from high error rate during execution |
| **Effort level at any point** | `settings.json` default + `/effort` command entries in JSONL | settings.json + JSONL | Between explicit changes, effort is assumed constant — may not reflect headless/subagent sessions |
| **Cost per session** | Sum per-message tokens × model pricing | JSONL + external pricing table | Pricing changes over time; cache pricing differs from fresh tokens |
| **Reasoning token ratio** (Codex) | `reasoning_output_tokens / output_tokens` | Codex JSONL | High ratio = deep thinking OR spinning; interpretation requires context |
| **Turn duration** | `system:turn_duration` entries with `durationMs` | Claude JSONL | Long turns may indicate complex work OR being stuck |
| **User response time patterns** | `user_response_times` array | session-meta | Long waits may indicate thinking, frustration, or multitasking |

### Requires New Instrumentation

| Metric | What's needed | Effort |
|--------|--------------|--------|
| **Context window absolute size** | Extend statusline hook to write `context_window.total` to bridge file | Trivial — data already in statusline payload |
| **Cost in USD (real-time)** | Extend statusline hook to write `cost.total_cost_usd` to bridge file | Trivial — data reportedly in payload, needs verification |
| **Rate limit state** (Claude) | Extend statusline hook to write rate limit fields | Trivial — needs verification that statusline payload includes this |
| **Per-phase token aggregation** | Sum session-meta tokens for sessions within phase time window | Medium — needs phase↔session time correlation |
| **Cross-machine aggregation** | SSH/rsync bridge files or session-meta from remote machines | Medium — infrastructure, not computation |
| **Active effort tracking** | SessionStart hook writes effort level to a sidecar file | Low — hook already has session_id, just needs to read settings.json |

## Research Questions — Resolved

| # | Question | Answer | Source |
|---|----------|--------|--------|
| 1 | Where does /effort persist? | `~/.claude/settings.json` as `effortLevel`. "max" doesn't persist (bug). Env var `CLAUDE_CODE_EFFORT_LEVEL` overrides. | telemetry-research-claude.md |
| 2 | Undocumented JSONL types? | 7 types found + `usage-data/session-meta/` and `facets/` directories | telemetry-research-claude.md |
| 3 | Full API response logged? | No. Debug logs have lifecycle events but no request/response bodies. | telemetry-research-claude.md |
| 4 | Codex per-tool-call tokens? | No. Token counts are per-turn, not per tool call. | telemetry-research-codex.md |
| 5 | Cross-platform cost normalization? | Needs provider/model pricing metadata, cache semantics, reasoning token pricing. | telemetry-research-codex.md |
| 6 | Open source patterns? | claude-spend reads ~/.claude/ for aggregates. LangSmith/W&B use API-level hooks. | telemetry-research-codex.md |
| 7 | Hook runtime state? | Hooks get session_id, cwd, permission_mode, tool data. NO token data (open request #11008). Statusline bridge is the workaround. | telemetry-research-claude.md |
| 8 | Codex -c flags in logs? | Yes — turn_context captures model, effort, sandbox policy, all overrides. | telemetry-research-codex.md |

## Research Questions — Still Open

These require further deliberation, not just investigation:

1. **What metrics are actually predictive of quality?** We can measure many things. The question is which measurements correlate with outcomes we care about (code quality, workflow rigor, user satisfaction, reduced rework). This is an empirical question that requires longitudinal data.

2. **How should derived metrics be interpreted?** Every metric has multiple explanations. A sensor that reports numbers without interpretive framing risks false confidence. How do we pair metrics with the context needed to interpret them?

3. **What's the right granularity?** Session-level (session-meta), turn-level (JSONL), or phase-level (aggregated)? Different consumers need different granularity. The reflection engine needs phase-level trends; the context monitor needs real-time turn-level data.

4. **Active vs passive tradeoff.** Active sensing (hooks writing telemetry during execution) adds overhead and changes the system being observed. Passive sensing (analyzing logs after the fact) misses real-time opportunities. Where is each appropriate?

5. **Cross-platform normalization.** Claude and Codex expose different fields with different semantics. What's the common schema? Is forced normalization lossy in ways that matter?

6. **What does the continental philosophy of memory literature say about how "remembering" should work in an agentic system?** Stiegler, Ricoeur, Bergson, Derrida all have relevant frameworks. Deferred until arxiv-sanity-mcp is operational for proper research grounding.

## Spike Candidates (Updated Post-Research)

Some original spike candidates are now trivial (data already available) or unnecessary (answered by research). Updated list:

| Spike | Status | Notes |
|-------|--------|-------|
| A: Hook for effort + model + context | **Partially unnecessary** — bridge file already has context %. Effort available via settings.json. Spike reduced to: extend bridge file with cost + rate limits + effort. | Trivial extension |
| B: Parse all JSONL entry types | **Done** — research phase found 7 types + undocumented directories | No spike needed |
| C: Unified token extraction adapter | **Still needed** — normalize Claude (per-message) + Codex (per-turn) into common schema | Medium effort, high value |
| D: Cost-per-phase calculation | **Still needed** — requires pricing table + phase↔session time correlation | Medium effort |
| NEW E: Validate statusline payload fields | **Quick spike** — confirm `cost.total_cost_usd` and `rate_limits.*` are in the statusline payload, extend hook to write them | Low effort, unlocks real-time cost tracking |
| NEW F: Explore `usage-data/facets/` | **Quick investigation** — read the AI-generated session summaries, assess whether they're useful for signal detection | Low effort |

## Detailed Research Reports

Full findings from the platform-specific research agents:
- `telemetry-research-claude.md` — Claude Code: effort persistence, JSONL types, debug logs, hook payloads, undocumented directories
- `telemetry-research-codex.md` — Codex CLI: per-turn granularity, pricing requirements, config capture, exec vs interactive differences
