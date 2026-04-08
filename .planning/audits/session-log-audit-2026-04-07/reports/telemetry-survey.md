# Runtime Telemetry Survey — Pre-Milestone Research

**Date:** 2026-04-08
**Status:** In progress
**Purpose:** Inventory all available telemetry data sources across Claude Code and Codex CLI to inform token/efficiency sensor design for v1.20 milestone scoping.
**Workflow note:** This task doesn't fit existing GSDR workflows (spike, quick, research-phase). It's informal pre-milestone research — a gap the harness should address. See Thread 3 in `pre-v1.20-session-capture.md` and the broader forms-excess deliberation.

## Known Data Sources (from this session)

### Claude Code Session Logs (`~/.claude/projects/{slug}/{session}.jsonl`)

**Per assistant message:**
- `model` (e.g., "claude-opus-4-6")
- `usage.input_tokens`, `usage.output_tokens`
- `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`
- `usage.cache_creation.ephemeral_5m_input_tokens`, `usage.cache_creation.ephemeral_1h_input_tokens`
- `usage.service_tier` (e.g., "standard")
- `usage.inference_geo`
- `message.content[]` — tool_use blocks with tool names, text blocks, thinking blocks

**Per session (metadata entries):**
- `version` (Claude Code CLI version)
- `cwd`, `sessionId`, `entrypoint` ("cli")
- `gitBranch` (if in a repo)

**NOT exposed:**
- Reasoning effort level (no field for /effort setting)
- Context window size
- Rate limit state
- Reasoning token breakdown (thinking is in content but not tokenized separately)

**Possible indirect sources (NEEDS INVESTIGATION):**
- `/effort` command appears as `command-message` entry type — may indicate effort changes mid-session
- `settings.json` may record the default effort level
- Hook context may expose runtime config
- `~/.claude/history.jsonl` may have session-level metadata
- API response headers (if logged in verbose/debug mode)

### Codex CLI Session Logs (`~/.codex/sessions/{date}/rollout-{ts}-{id}.jsonl`)

**Per turn (`turn_context` type):**
- `model` (e.g., "gpt-5.4")
- `effort` (e.g., "xhigh") — reasoning effort IS exposed
- `model_context_window` (e.g., 258400)
- `approval_policy`, `sandbox_policy`
- `truncation_policy` (mode, limit)
- `collaboration_mode.settings.reasoning_effort`
- `personality`, `realtime_active`

**Per turn (`token_count` event type):**
- `total_token_usage`: input, cached_input, output, reasoning_output, total (cumulative)
- `last_token_usage`: same fields (per-turn delta)
- `model_context_window`
- `rate_limits.primary`: used_percent, window_minutes, resets_at
- `rate_limits.secondary`: same
- `rate_limits.plan_type` (e.g., "pro")

**Per session (`session_meta` type):**
- `cli_version`, `source` ("exec" vs interactive), `originator`
- `cwd`, `git` (commit_hash, branch, repository_url)
- `model_provider` ("openai")

**NOT exposed (NEEDS INVESTIGATION):**
- Per-tool-call token breakdown
- Cost in dollars (would need external pricing table)
- Whether reasoning tokens are further broken down by type

### Codex History (`~/.codex/history.jsonl`)
- Minimal: `session_id`, `ts`, `text` (prompt text only)
- No token data, no model info

## Research Questions for Online Phase

1. **Claude Code reasoning effort persistence:** Where does the `/effort` setting live between sessions? Is it in `settings.json`, a session config file, or only in-memory?

2. **Claude Code undocumented JSONL fields:** Are there entry types we haven't seen? The sample we inspected was from one session — other sessions may have different attachment types or metadata entries.

3. **Claude Code API response details:** Does Claude Code log the full API response anywhere (which would include model version, stop reason details, etc.)?

4. **Codex per-tool-call granularity:** Does Codex break down token usage per tool execution, or only per turn?

5. **Cross-platform cost normalization:** What pricing data is needed to convert token counts to comparable costs across Claude and GPT models?

6. **Open source telemetry patterns:** How do projects like claude-spend, llm-cost-tracker, and LLM observability platforms (LangSmith, W&B Traces) handle cross-model normalization?

7. **Active telemetry via hooks:** What runtime state is available to Claude Code hooks (SessionStart, PostToolUse)? Can hooks capture effort level, context utilization, model selection?

8. **Codex exec configuration capture:** When launching `codex exec` with `-c` flags, are those settings reflected in the session log or only in the process args?

## Spike Candidates (to be designed after online research)

- **Spike A:** Write a minimal hook that captures effort level + model + context utilization at SessionStart and writes to a telemetry sidecar file
- **Spike B:** Parse a sample of Claude Code sessions to find ALL entry types and undocumented fields
- **Spike C:** Build a unified token extraction adapter that normalizes Claude + Codex session data into a common schema
- **Spike D:** Prototype a cost-per-phase calculation using session logs + external pricing table
