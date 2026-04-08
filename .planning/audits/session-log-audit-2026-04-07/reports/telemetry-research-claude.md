# Claude Code Telemetry Research — Filesystem + Web

**Date:** 2026-04-08
**Status:** Complete
**Scope:** Research questions 1, 2, 3, 7 from telemetry-survey.md
**Method:** Direct filesystem inspection + official documentation fetch

---

## Research Question 1: Where does `/effort` persist?

### Answer: `~/.claude/settings.json` as `effortLevel`

**Confirmed location:** `/home/rookslog/.claude/settings.json`, line 277:
```json
"effortLevel": "high"
```

**Full persistence rules (from official model-config docs):**

| Method | Scope | Survives session? |
|--------|-------|-------------------|
| `effortLevel` in `~/.claude/settings.json` | Global default | Yes |
| `effortLevel` in `.claude/settings.json` (project) | Project default | Yes |
| `/effort <level>` command (low/medium/high) | Session | Yes — low/medium/high persist across sessions |
| `/effort max` command | Session only | No — max does NOT persist |
| `--effort <level>` flag at startup | Single session | No |
| `CLAUDE_CODE_EFFORT_LEVEL` env var | Overrides everything | Survives if set in shell profile |
| Skill/subagent frontmatter `effort:` field | Per-invocation | No |

**Priority order:** env var > settings file > model default

**Key finding:** `max` effort is special — it cannot be saved to settings. The issue #30726 on GitHub documents that "Settings effortLevel 'max' is silently downgraded when user interacts with effort selection UI." There is also a feature request #33937 for Max plan subscribers to persist `max` in settings.json.

**No project-level settings.json files exist** in any of the inspected project directories (confirmed: no `settings.json` files under `~/.claude/projects/*/`).

### `/effort` in session JSONL

The `/effort` command appears in session JSONL as a `user` type entry with this structure:
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "<command-name>/effort</command-name>\n            <command-message>effort</command-message>\n            <command-args>max</command-args>"
  },
  "timestamp": "2026-04-07T23:39:23.503Z",
  "sessionId": "9af8f0ae-f2cb-4fd7-9e69-47c58190b6d4"
}
```

Followed immediately by a second `user` entry with the response:
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": "<local-command-stdout>Set effort level to max (this session only): Maximum capability with deepest reasoning (Opus 4.6 only)</local-command-stdout>"
  }
}
```

**What this means for a sensor:** The initial effort level (from settings) is NOT in the JSONL. Only effort *changes* during a session appear. The default can be read from `~/.claude/settings.json` at session start. Mid-session changes are detectable via `command-args` parsing. No field in the `assistant` entry records what effort level was active when a response was generated.

### Adaptive thinking environment variables

- `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING=1` — disables adaptive reasoning, reverts to fixed budget
- When disabled, `MAX_THINKING_TOKENS` controls the fixed budget
- Effort is supported on Opus 4.6 and Sonnet 4.6 only

---

## Research Question 2: Undocumented JSONL Entry Types

Sampled 6 session files across 5 different projects. Here is the complete catalog of all discovered entry types:

### Primary Entry Types

#### `assistant`
The core response entry. Present in every session.

**Fields:**
- `parentUuid`, `isSidechain`, `type`, `uuid`, `timestamp`
- `userType`, `entrypoint`, `cwd`, `sessionId`, `version`, `gitBranch`
- `requestId` — the Anthropic API request ID (e.g., `"req_011CZqJisMzr24ED2bTE3fTm"`)
- `slug` — human-readable session name (e.g., `"bubbly-cooking-moore"`)
- `isApiErrorMessage` — boolean, present on error responses
- `error` — error string, present on API error messages

**`message` sub-object fields:**
- `model` — full model ID (e.g., `"claude-opus-4-6"`)
- `id` — message ID from API
- `type` — always `"message"`
- `role` — always `"assistant"`
- `content` — array of content blocks
- `stop_reason` — `"tool_use"` | `"end_turn"` | `"stop_sequence"` | `null`
- `stop_sequence` — stop sequence string or null
- `stop_details` — additional stop info (rarely populated; null in all sampled sessions)
- `usage` — token usage object (see below)

**`usage` sub-object fields (CONFIRMED):**
```json
{
  "input_tokens": 3,
  "cache_creation_input_tokens": 26717,
  "cache_read_input_tokens": 0,
  "cache_creation": {
    "ephemeral_5m_input_tokens": 0,
    "ephemeral_1h_input_tokens": 26717
  },
  "output_tokens": 59,
  "service_tier": "standard",
  "inference_geo": "not_available"
}
```

**`content` block types observed:**
- `text` — text block with `text` string
- `tool_use` — tool call with `id`, `name`, `input` fields
- `thinking` — thinking block with `thinking` (redacted/empty string) and `signature` fields

Note: thinking blocks appear in the JSONL but `thinking` content is always an empty string (redacted). The `signature` field is present.

#### `user`
User messages, tool results, and system injections.

**Fields vary by subtype:**
- `promptId` — groups a user turn
- `isMeta` — boolean, marks system/meta messages
- `origin` — present on some entries (e.g., `"human"`)
- `permissionMode` — active permission mode string
- `toolUseResult` — tool result content (string or JSON)
- `mcpMeta` — MCP-specific metadata (e.g., structuredContent from sequential-thinking)
- `sourceToolAssistantUUID` — UUID of assistant message that requested the tool
- `sourceToolUseID` — tool_use ID from the assistant message

#### `system`
Metadata and hook result entries. Uses `subtype` to distinguish.

**Subtypes confirmed:**

| subtype | description | key fields |
|---------|-------------|------------|
| `stop_hook_summary` | Hook execution summary after assistant stops | `hookCount`, `hookInfos[]` (command, durationMs), `hookErrors[]`, `preventedContinuation`, `stopReason`, `hasOutput`, `toolUseID` |
| `turn_duration` | Wall-clock time for a complete turn | `durationMs`, `messageCount` |
| `local_command` | Result of a local slash command | `content` (stdout), `level` |
| `bridge_status` | Remote control session URL | `content`, `url`, `upgradeNudge` (optional) |

#### `attachment`
Injected metadata attachments. NOT in the conversation context sent to the model.

**Confirmed attachment types:**

| attachment.type | description | key fields |
|----------------|-------------|------------|
| `deferred_tools_delta` | Tools added to available set | `addedNames[]`, `addedLines[]` |
| `companion_intro` | Companion configuration | `name`, `species` |
| `skill_listing` | Available skills list | `content` (markdown string) |

#### `progress`
In-progress hook execution tracking. Only seen in projects with SessionStart hooks.

**Fields:** `data.type` (e.g., `"hook_progress"`), `data.hookEvent`, `data.hookName`, `data.command`, `parentToolUseID`, `toolUseID`

#### `queue-operation`
Message queue management entries.

**Operations:**
- `enqueue` — adds a message to the queue; has `content` field
- `dequeue` — removes from queue
- `remove` — removes specific item

#### `file-history-snapshot`
File content snapshots for change tracking.

**Fields:** `messageId`, `snapshot` (object mapping file paths to content), `isSnapshotUpdate`

#### `last-prompt`
Records the last user prompt text. Present as final entry in some sessions.

**Fields:** `type`, `lastPrompt` (string), `sessionId`

### Summary: Field gaps relevant to token/efficiency sensor

**CONFIRMED NOT IN JSONL:**
- Effort level active during a response (no field in `assistant` entries)
- Context window size or % at time of response
- Thinking token count (thinking blocks are redacted)
- Cost in USD (must compute externally from pricing table)
- `budget_tokens` parameter sent to API
- Rate limit state

**CONFIRMED IN JSONL (directly usable):**
- `usage.input_tokens`, `usage.output_tokens`
- `usage.cache_creation_input_tokens`, `usage.cache_read_input_tokens`
- `usage.cache_creation.ephemeral_5m_input_tokens`, `usage.cache_creation.ephemeral_1h_input_tokens`
- `usage.service_tier`, `usage.inference_geo`
- `message.model` (full model ID)
- `message.stop_reason`
- `requestId` (for cross-referencing)
- `system:turn_duration` `durationMs` and `messageCount`
- `system:stop_hook_summary` hook execution metrics

### Additional telemetry: `~/.claude/usage-data/`

An underdocumented directory with pre-computed session analytics:

**`~/.claude/usage-data/session-meta/{session_id}.json`** fields:
```
session_id, project_path, start_time, duration_minutes,
user_message_count, assistant_message_count,
tool_counts (per tool), languages (per language),
git_commits, git_pushes,
input_tokens, output_tokens,
first_prompt, user_interruptions,
user_response_times[], user_message_timestamps[],
tool_errors, tool_error_categories,
uses_task_agent, uses_mcp, uses_web_search, uses_web_fetch,
lines_added, lines_removed, files_modified, message_hours[]
```

Note: `input_tokens` and `output_tokens` in session-meta appear to be aggregated differently from raw JSONL (possibly partial — one sample showed only 109/12189 vs expected larger values). Treat as supplementary, not authoritative.

**`~/.claude/usage-data/facets/{session_id}.json`** — AI-generated session analysis:
```
underlying_goal, goal_categories, outcome, user_satisfaction_counts,
claude_helpfulness, session_type, friction_counts, friction_detail,
primary_success, brief_summary, session_id
```

**`~/.claude/stats-cache.json`** — Daily aggregates:
```
dailyActivity[]: { date, messageCount, sessionCount, toolCallCount }
```

### Context bridge files at `/tmp/`

The statusline hook writes context state to `/tmp/claude-ctx-{session_id}.json`:
```json
{
  "session_id": "9af8f0ae-...",
  "remaining_percentage": 73,
  "used_pct": 32,
  "timestamp": 1775626749
}
```

This is a live-updating file written after every assistant message (when the statusline runs). It contains the raw `remaining_percentage` from the statusline payload and a normalized `used_pct` that accounts for the ~16.5% autocompact buffer reservation.

---

## Research Question 3: Does Claude Code log full API response details anywhere?

### Debug logs: `~/.claude/debug/`

Debug logging is activated by the `/debug` command. Files are named `{uuid}.txt` with a `latest` symlink to the most recent file.

**What debug logs contain:**
- Hook lifecycle events (Hooks: Found N hooks, Matched N hooks)
- API client creation: `[API:request] Creating client`
- Auth token checks: `[API:auth] OAuth token check starting/complete`
- Attribution header: `attribution header x-anthropic-billing-header: cc_version=...`
- MCP tool calls and completions
- File encoding detection
- High write ratio / screen rendering metrics
- Fast mode availability status

**What debug logs DO NOT contain:**
- Full API request body (model, messages, temperature, budget_tokens, etc.)
- Full API response body
- Token counts per response
- Effort level sent to API
- Response headers

**How to enable:** Use the `/debug` command in Claude Code. This is the only documented way. There are no `CLAUDE_DEBUG`, `CLAUDE_VERBOSE`, or `LOG_LEVEL` environment variables that expose raw API traffic.

**Relevant environment variables confirmed present:**
```
CLAUDECODE=1              (always set when running in Claude Code)
CLAUDE_CODE_SSE_PORT=27412  (port for SSE bridge)
CLAUDE_CODE_ENTRYPOINT=cli
```

None of these enable verbose API logging.

### Conclusion on API response logging

**Raw API responses are NOT logged anywhere accessible.** The JSONL session files contain the parsed response data (model, usage, content) but not the full HTTP response. Debug mode adds process/hook lifecycle information but not API payloads.

**The closest available data is the statusline payload**, which Claude Code computes from its internal state and exposes to the statusline command. This is richer than the JSONL (includes cost, rate limits) but only accessible to the statusline script, not to hooks.

---

## Research Question 7: What runtime state is available to hooks?

### Hook event types (complete list from official docs)

Claude Code exposes 24 hook event types as of 2026-W14:

| Event | When it fires |
|-------|--------------|
| `SessionStart` | Session begins (startup, resume, /clear, compact) |
| `InstructionsLoaded` | CLAUDE.md file loaded |
| `UserPromptSubmit` | User submits a message |
| `PreToolUse` | Before any tool executes |
| `PermissionRequest` | Permission check required |
| `PermissionDenied` | Permission was denied |
| `PostToolUse` | After tool completes successfully |
| `PostToolUseFailure` | After tool fails |
| `Notification` | System notification event |
| `SubagentStart` | Subagent spawned |
| `SubagentStop` | Subagent completes |
| `TaskCreated` | Task created (Teams feature) |
| `TaskCompleted` | Task completed (Teams feature) |
| `Stop` | Assistant stops responding |
| `StopFailure` | Stop event with error |
| `TeammateIdle` | Teammate idle (Teams feature) |
| `PreCompact` | Before context compaction |
| `PostCompact` | After context compaction |
| `Elicitation` | MCP elicitation dialog |
| `ElicitationResult` | MCP elicitation result |
| `SessionEnd` | Session ends |
| `CwdChanged` | Working directory changed |
| `FileChanged` | Tracked file changed |
| `WorktreeCreate` | Worktree created |
| `WorktreeRemove` | Worktree removed |
| `ConfigChange` | Settings changed |

### Common fields (all hook payloads)

```json
{
  "session_id": "string",
  "transcript_path": "string (path to JSONL file)",
  "cwd": "string",
  "permission_mode": "default|plan|acceptEdits|auto|dontAsk|bypassPermissions",
  "hook_event_name": "string",
  "agent_id": "string (optional, subagent only)",
  "agent_type": "string (optional, subagent only)"
}
```

### Key hook payloads for telemetry sensor

**SessionStart** — fires at session beginning:
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "hook_event_name": "SessionStart",
  "source": "startup|resume|clear|compact",
  "model": "string (model ID)"
}
```
Note: provides `model` at session start. Effort level is NOT in this payload — must be read from settings.json separately.

**PostToolUse** — fires after every tool call:
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "permission_mode": "string",
  "hook_event_name": "PostToolUse",
  "tool_name": "string",
  "tool_input": "object",
  "tool_response": "object",
  "tool_use_id": "string"
}
```
Note: No token data. No model info. No context window state.

**Stop** — fires when assistant stops:
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "permission_mode": "string",
  "hook_event_name": "Stop"
}
```
Note: Very minimal. No token data.

**SubagentStop** — richer than Stop:
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "permission_mode": "string",
  "hook_event_name": "SubagentStop",
  "stop_hook_active": "boolean",
  "agent_id": "string",
  "agent_type": "string",
  "agent_transcript_path": "string",
  "last_assistant_message": "string"
}
```

**PreCompact / PostCompact** — context compaction events:
```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "hook_event_name": "PreCompact|PostCompact",
  "compaction_trigger": "manual|auto"
}
```

### Critical finding: Hooks have NO token data

As of 2026-04-08, **hooks receive zero token or cost information**. GitHub issue #11008 explicitly tracks this gap:

> PostToolUse hooks could access usage data like `.usage.total_tokens` and `.usage.total_cost_usd` to monitor context limits and costs in real time. Currently hooks are "blind to session costs."

Requested fields (not yet available):
```json
{
  "usage": {
    "total_tokens": 45230,
    "input_tokens": 38000,
    "output_tokens": 7230,
    "cache_read_tokens": 12000,
    "cache_creation_tokens": 5000,
    "total_cost_usd": 0.87,
    "percentage_of_context_window": 22.6
  },
  "limits": {
    "context_window_tokens": 200000,
    "session_remaining_tokens": 1250000,
    "weekly_remaining_tokens": 8500000
  }
}
```

### The statusline workaround (currently in use)

The statusline command receives a MUCH richer payload than hooks. The existing `gsdr-statusline.js` hook exploits this: it writes context metrics to `/tmp/claude-ctx-{session_id}.json`, and the `PostToolUse` hook reads that bridge file.

**Statusline payload (full schema):**
```json
{
  "cwd": "string",
  "session_id": "string",
  "session_name": "string (optional)",
  "transcript_path": "string",
  "model": {
    "id": "string",
    "display_name": "string"
  },
  "workspace": {
    "current_dir": "string",
    "project_dir": "string",
    "added_dirs": []
  },
  "version": "string",
  "output_style": { "name": "string" },
  "cost": {
    "total_cost_usd": 0.01234,
    "total_duration_ms": 45000,
    "total_api_duration_ms": 2300,
    "total_lines_added": 156,
    "total_lines_removed": 23
  },
  "context_window": {
    "total_input_tokens": 15234,
    "total_output_tokens": 4521,
    "context_window_size": 200000,
    "used_percentage": 8,
    "remaining_percentage": 92,
    "current_usage": {
      "input_tokens": 8500,
      "output_tokens": 1200,
      "cache_creation_input_tokens": 5000,
      "cache_read_input_tokens": 2000
    }
  },
  "exceeds_200k_tokens": false,
  "rate_limits": {
    "five_hour": {
      "used_percentage": 23.5,
      "resets_at": 1738425600
    },
    "seven_day": {
      "used_percentage": 41.2,
      "resets_at": 1738857600
    }
  },
  "vim": { "mode": "NORMAL" },
  "agent": { "name": "string" },
  "worktree": {
    "name": "string",
    "path": "string",
    "branch": "string",
    "original_cwd": "string",
    "original_branch": "string"
  }
}
```

**Key fields the statusline gets that hooks don't:**
- `cost.total_cost_usd` — actual dollar cost
- `context_window.used_percentage` / `remaining_percentage` — pre-calculated
- `context_window.context_window_size` — 200000 or 1000000
- `context_window.current_usage` — per-call token breakdown
- `context_window.total_input_tokens` / `total_output_tokens` — cumulative
- `rate_limits.five_hour.used_percentage` / `seven_day.used_percentage` — rate limit consumption
- `rate_limits.*.resets_at` — reset timestamps

**Statusline update cadence:** Fires after each new assistant message, when permission mode changes, or when vim mode toggles. Debounced at 300ms.

**Note on `context_window.used_percentage`:** Calculated from input-only tokens: `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`. Does NOT include `output_tokens`. This matches what the GSDR statusline uses.

### Hook output options for telemetry injection

Hooks can inject context back into the conversation via `additionalContext`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "string message visible to agent"
  }
}
```

This is how `gsdr-context-monitor.js` injects context warnings — it reads from the statusline bridge file and emits warnings when `remaining_percentage` drops below thresholds.

---

## Synthesis: What the statusline bridge pattern enables

The existing GSDR infrastructure has already solved the fundamental problem of getting rich telemetry into hooks: the statusline writes a bridge file that PostToolUse hooks read. A token/efficiency sensor could extend this pattern:

**Current bridge file** (`/tmp/claude-ctx-{session_id}.json`):
```json
{ "session_id", "remaining_percentage", "used_pct", "timestamp" }
```

**Extended bridge file** (what a sensor could write):
```json
{
  "session_id": "...",
  "model_id": "claude-opus-4-6",
  "model_display": "Opus",
  "remaining_percentage": 73,
  "used_percentage": 27,
  "context_window_size": 200000,
  "current_input_tokens": 8500,
  "current_output_tokens": 1200,
  "current_cache_creation_tokens": 5000,
  "current_cache_read_tokens": 2000,
  "total_input_tokens": 54321,
  "total_output_tokens": 12345,
  "cost_usd": 0.234,
  "rate_limit_5h_pct": 23.5,
  "rate_limit_7d_pct": 41.2,
  "timestamp": 1775626749
}
```

This gives a PostToolUse or Stop hook access to all the telemetry data needed for a token/efficiency sensor without any API interception.

**Effort level** would still need to be read from `~/.claude/settings.json` at session start (via SessionStart hook) and tracked in memory or a separate state file, since it does not appear in any runtime payload.

---

## Summary of Gaps

| Desired metric | Available? | Source | Notes |
|----------------|-----------|--------|-------|
| Effort level (initial) | Yes | `~/.claude/settings.json` `effortLevel` | Read at SessionStart |
| Effort level (changes) | Partial | JSONL `user` entries with `command-args` | Only if /effort is used mid-session |
| Model ID | Yes | JSONL `assistant.message.model` | Per response |
| Input tokens | Yes | JSONL `usage.input_tokens` | Per response |
| Output tokens | Yes | JSONL `usage.output_tokens` | Per response |
| Cache creation tokens | Yes | JSONL `usage.cache_creation_input_tokens` | Per response |
| Cache read tokens | Yes | JSONL `usage.cache_read_input_tokens` | Per response |
| Thinking token count | No | — | Thinking blocks are redacted in JSONL |
| Context window % | Yes (live) | Statusline payload → bridge file | Not in hooks directly |
| Context window size | Yes (live) | Statusline `context_window.context_window_size` | 200000 or 1000000 |
| Session cost USD | Yes (live) | Statusline `cost.total_cost_usd` | Not in hooks or JSONL |
| Rate limit state | Yes (live) | Statusline `rate_limits.*` | Pro/Max only |
| Stop reason | Yes | JSONL `assistant.message.stop_reason` | Per response |
| Turn duration | Yes | JSONL `system:turn_duration.durationMs` | Per turn |
| Per-tool token breakdown | No | — | Not logged anywhere |

---

## Sources

- Official hooks reference: https://code.claude.com/docs/en/hooks
- Official statusline docs: https://code.claude.com/docs/en/statusline
- Official model-config docs: https://code.claude.com/docs/en/model-config
- Hook schemas gist: https://gist.github.com/FrancisBourre/50dca37124ecc43eaf08328cdcccdb34
- Feature request (token data in hooks): https://github.com/anthropics/claude-code/issues/11008
- Bug report (effortLevel max silently downgraded): https://github.com/anthropics/claude-code/issues/30726
- Feature request (persist max effort): https://github.com/anthropics/claude-code/issues/33937
- ccusage (JSONL usage analyzer): https://github.com/ryoppippi/ccusage
