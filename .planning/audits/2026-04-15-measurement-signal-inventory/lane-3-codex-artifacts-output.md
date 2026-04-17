# Lane 3: Codex CLI Artifacts — Signal Inventory

**Lane:** 3 of 4
**Domain:** Codex CLI session artifacts and data
**Audited:** 2026-04-15
**Auditor:** Parallel research agent (claude-sonnet-4-6)

---

## 1. Prior Research Summary (Phase 55.2)

**Source:** `.planning/phases/55.2-codex-runtime-substrate/55.2-CONTEXT.md` and `55.2-RESEARCH.md`, researched 2026-04-09.

Phase 55.2 was focused on cross-runtime *capability detection* in the GSD harness, not measurement signal inventory. Its signal-relevant findings:

**Config file locations confirmed (cited-from-research, 55.2-RESEARCH.md):**
- Global config: `~/.codex/config.toml` (not `codex.toml` — prior docs were wrong)
- Project-local config: `<repo>/.codex/config.toml`
- Hooks file: `~/.codex/hooks.json` or `<repo>/.codex/hooks.json`
- Agents directory: `~/.codex/agents/*.toml` (TOML format, not YAML)
- Skills directory: `~/.codex/skills/*/SKILL.md` (directory-per-skill)

**Agent file format (cited-from-research):** Top-level TOML keys are `description`, `sandbox_mode`, `developer_instructions`. No YAML frontmatter. Sensor contract fields (`sensor_name`, `timeout_seconds`, `config_schema`) live inside `developer_instructions`, not as top-level TOML keys.

**Env var detection: confirmed absent (cited-from-research):** `CODEX_MANAGED_BY_NPM` is set on the Codex CLI process but filtered by the sandbox's `shell_environment_policy`. Not accessible from within tool calls. Runtime detection must use config file presence, not env vars.

**Hooks status at research time (cited-from-research):** SessionStart, Stop, PreToolUse, PostToolUse, UserPromptSubmit hooks added in v0.115.0–v0.117.0. At v0.118.0, `codex features list` showed `codex_hooks under development true`.

**What Phase 55.2 did NOT map (gaps for this audit):**
- `state_5.sqlite` schema was not inventoried
- `logs_2.sqlite` schema was not inventoried
- Session JSONL event taxonomy was not documented
- Token accounting breakdown fields were not examined
- Multi-agent spawn/close event structure was not documented

---

## 2. Artifacts Found on This Machine

### 2.1 Codex CLI Installation

**Path:** `/home/rookslog/.npm-global/bin/codex`
**Version:** `codex-cli 0.120.0` (sampled 2026-04-15)
**Note:** Phase 55.2 research was against v0.118.0. Current version is 0.120.0.

### 2.2 Global Config Directory: `~/.codex/`

**Path:** `/home/rookslog/.codex/`
**Sampled:** 2026-04-15

| File/Dir | Size | Description |
|----------|------|-------------|
| `config.toml` | 7.7KB | Global Codex configuration |
| `state_5.sqlite` | ~3.1MB (+WAL 4.1MB) | Session/thread state database |
| `logs_2.sqlite` | ~60.8MB (+WAL 486KB) | Structured event log database |
| `history.jsonl` | 420KB, 1531 lines | Per-session user input history |
| `session_index.jsonl` | 2 lines | Lightweight session index |
| `sessions/` | 971 JSONL files | Full session rollout logs |
| `shell_snapshots/` | 9 files, ~72KB | Shell environment snapshots |
| `memories/` | 1 file | Persistent agent memories |
| `rules/default.rules` | (approval rules) | Per-command approval decisions |
| `agents/` | 24 TOML files | Registered agent definitions |
| `skills/` | 45 skill dirs | Installed skill directories |
| `plugins/` | Plugin cache | OpenAI curated plugins |
| `version.json` | Latest version check result |
| `models_cache.json` | 183KB | Available model manifest |

**Session date range (sampled):** 2026-02-26 to 2026-04-15
**Total JSONL session files:** 971 (across sessions/ directory tree)
**Sessions by month:** Feb-26: 12, Mar-17: 3, Mar-18: 11, Mar-19: 65, Mar-20: 76, Mar-22+: 17, Apr-07: 22, Apr-08: 104, Apr-09: 6, Apr-10: 31, Apr-11: 50, Apr-12: 428, Apr-13: 40, Apr-14: 55, Apr-15: 51

### 2.3 Project-Local `.codex/` Directories

Two projects have project-level `.codex/` directories:
- `/home/rookslog/workspace/projects/get-shit-done-reflect/.codex/`
- `/home/rookslog/workspace/projects/prix-guesser/.codex/` (implied by trust config)

Both contain `config.toml` (agent registration), `agents/` (TOML agent files), `skills/`, and `AGENTS.md`. These are configuration artifacts, not session artifacts.

### 2.4 `state_5.sqlite` Schema

**Sampled directly.** Full schema:

**Table: `threads`** — primary session/thread record
```
id TEXT PRIMARY KEY
rollout_path TEXT          -- path to session JSONL file
created_at INTEGER         -- Unix timestamp ms
updated_at INTEGER
source TEXT                -- 'cli', 'exec', 'vscode', or JSON subagent descriptor
model_provider TEXT        -- 'openai'
cwd TEXT                   -- working directory when session started
title TEXT                 -- first_user_message or auto-generated
sandbox_policy TEXT        -- JSON: {"type":"danger-full-access"} etc.
approval_mode TEXT         -- 'never', 'on-request'
tokens_used INTEGER        -- aggregate token count for session
has_user_event INTEGER
archived INTEGER
archived_at INTEGER
git_sha TEXT               -- git commit SHA at session start
git_branch TEXT            -- git branch at session start
git_origin_url TEXT        -- git remote URL
cli_version TEXT           -- Codex CLI version that created this thread
first_user_message TEXT    -- first user prompt (truncated)
agent_nickname TEXT        -- name assigned to spawned subagent
agent_role TEXT            -- role/type assigned to spawned subagent
memory_mode TEXT           -- 'enabled' (only value observed)
model TEXT                 -- model name used (e.g., 'gpt-5.4')
reasoning_effort TEXT      -- 'xhigh', 'high', 'medium', 'low', null
agent_path TEXT            -- agent config path for subagents
```

**Record counts (sampled):**
- threads: 813
- thread_spawn_edges: 214 (174 closed, 40 open)
- stage1_outputs: (compaction summaries, count not sampled but populated)
- jobs: 0
- agent_jobs: 0
- agent_job_items: 0
- remote_control_enrollments: (not counted)

**Thread distributions (sampled):**

| Field | Values (count) |
|-------|----------------|
| model | gpt-5.4 (370), gpt-5.4-mini (354), gpt-5.4-medium (7), o3 (2), o4-mini (1), null (78) |
| reasoning_effort | high (543), xhigh (183), medium (8), low (1), null (78) |
| approval_mode | never (803), on-request (10) |
| sandbox_policy | danger-full-access (761), read-only (9), workspace-write variants (11) |
| source | exec (510), cli (28), vscode (2), subagent JSON (273) |

**Table: `thread_spawn_edges`** — parent/child agent relationships
```
parent_thread_id TEXT
child_thread_id TEXT PRIMARY KEY
status TEXT                -- 'open', 'closed'
```

**Table: `stage1_outputs`** — memory compaction outputs
```
thread_id TEXT PRIMARY KEY
source_updated_at INTEGER
raw_memory TEXT            -- full memory text
rollout_summary TEXT       -- session summary
generated_at INTEGER
rollout_slug TEXT
usage_count INTEGER
last_usage INTEGER
selected_for_phase2 INTEGER
```

**Table: `jobs` / `agent_jobs` / `agent_job_items`** — batch agent job tracking (0 records; Codex Cloud feature, not used locally)

### 2.5 `logs_2.sqlite` Schema

**Sampled directly.** Single table:

```
id INTEGER PRIMARY KEY AUTOINCREMENT
ts INTEGER                 -- Unix timestamp seconds
ts_nanos INTEGER           -- nanosecond precision timestamp
level TEXT                 -- 'DEBUG', 'INFO', 'WARN', 'ERROR', 'TRACE'
target TEXT                -- Rust module path (e.g., 'codex_core::plugins::manifest')
feedback_log_body TEXT     -- structured log message body (nullable)
module_path TEXT
file TEXT
line INTEGER
thread_id TEXT             -- links to state_5.sqlite threads.id (nullable)
process_uuid TEXT
estimated_bytes INTEGER
```

**Record counts (sampled):**
- Total: 64,095 log entries
- Timestamp range: 1775951345–1776307070 (approximately Feb–Apr 2026)
- Level breakdown: WARN (35,861), DEBUG (18,660), INFO (5,800), TRACE (3,700), ERROR (74)

**Most active log targets (sampled):**
- `codex_core::plugins::manifest` (35,493) — plugin manifest loading warnings
- `opentelemetry_sdk` (18,411) — telemetry framework
- `codex_core::stream_events_utils` (5,410) — event streaming
- `hyper_util::client::legacy::pool` (2,662) — HTTP client pool
- `codex_tui::app::app_server_adapter` (354) — TUI app server

**Signal quality assessment:** The dominant log target (plugins::manifest) appears to be noise — largely repeated "ignoring interface.defaultPrompt: prompt must be at most 128 characters" warnings from plugin JSON files. Useful signal-bearing logs are in ERROR (74 records) and targeted INFO entries.

### 2.6 Session JSONL Files

**Location:** `~/.codex/sessions/YYYY/MM/DD/rollout-{ISO8601}-{thread_id}.jsonl`
**Size range:** From 1 line (exec sessions) to 20,386 lines (long interactive sessions)
**Total lines across corpus:** 175,091 (sampled from `wc -l` across all files)

**Top-level event types (sampled from large session `019d8487`, 20,386 lines):**

| Type | Count | Description |
|------|-------|-------------|
| `response_item/function_call` | 2,806 | Tool call invocations (shell, patch, etc.) |
| `response_item/function_call_output` | 2,806 | Tool call results |
| `event_msg/token_count` | 2,657 | Token usage per turn |
| `response_item/message` | 2,646 | User/assistant/developer messages |
| `event_msg/exec_command_end` | 2,258 | Shell command completion events |
| `response_item/reasoning` | 1,866 | Model reasoning traces (encrypted) |
| `event_msg/agent_message` | 1,744 | Agent commentary/final messages |
| `event_msg/user_message` | 534 | User input events |
| `turn_context` | 480 | Per-turn session context snapshots |
| `event_msg/task_started` | 456 | Turn start events |
| `response_item/custom_tool_call` | 370 | apply_patch and custom tools |
| `response_item/custom_tool_call_output` | 370 | Custom tool results |
| `event_msg/patch_apply_end` | 346 | File patch application events |
| `event_msg/task_complete` | 282 | Turn completion events |
| `event_msg/turn_aborted` | 173 | Aborted turns |
| `event_msg/collab_agent_spawn_end` | 153 | Child agent spawn confirmations |
| `event_msg/collab_close_end` | 138 | Child agent close/completion |
| `event_msg/collab_waiting_end` | 118 | Parallel agent wait completions |
| `event_msg/web_search_end` | 40 | Web search results |
| `compacted` | 33 | Context compaction events |
| `event_msg/context_compacted` | 33 | Context compaction notifications |
| `event_msg/collab_agent_interaction_end` | 20 | Status probe results |
| `event_msg/mcp_tool_call_end` | 6 | MCP tool completions |
| `session_meta` | 1 | Session-level metadata (always first) |
| `event_msg/item_completed` | 1 | Plan item completion |

### 2.7 `history.jsonl`

**Schema:** `{"session_id": "uuid", "ts": unix_epoch_seconds, "text": "user message"}`
**Records:** 1,531
**Purpose:** Lightweight input history for shell-level recall across sessions

### 2.8 `session_index.jsonl`

**Schema:** `{"id": "uuid", "thread_name": "string", "updated_at": "ISO8601Z"}`
**Records:** 2 (very sparse — appears to be a legacy or supplemental index, not comprehensive)

### 2.9 `shell_snapshots/`

**Naming:** `{thread_id}.{nanosecond_timestamp}.sh`
**Content:** Shell environment snapshots (functions, setopts, aliases, exports)
**Purpose:** Codex restores shell state between turns
**Signal relevance:** Contains `CODEX_MANAGED_BY_NPM=1` env var (confirming Phase 55.2 finding that it IS set at process level, but filtered inside sandbox)

### 2.10 Feature Flags (v0.120.0)

**Source:** `codex features list` output, sampled 2026-04-15

| Feature | Status | Enabled |
|---------|--------|---------|
| `codex_hooks` | under development | true |
| `multi_agent` | stable | true |
| `multi_agent_v2` | under development | false |
| `shell_tool` | stable | true |
| `shell_snapshot` | stable | true |
| `plugins` | stable | true |
| `fast_mode` | stable | true |
| `personality` | stable | true |
| `apps` | stable | true |
| `memories` | under development | false |
| `runtime_metrics` | under development | false |
| `general_analytics` | under development | false |
| `enable_request_compression` | stable | true |
| `remote_control` | under development | false |

**Note on `runtime_metrics` and `general_analytics`:** Both are `under development` and `false`. These are the flags most directly relevant to measurement infrastructure. They are not yet active on this installation.

---

## 3. Codex Signal Inventory

### 3.1 Structured Signals (state_5.sqlite — `threads` table)

| Signal | Field | Type | Reliability | Coverage | Notes |
|--------|-------|------|-------------|----------|-------|
| Session ID | `id` | UUID string | High | 100% | UUIDv7 — monotonically sortable by timestamp |
| Session start time | `created_at` | Integer (ms) | High | 100% | |
| Session last activity | `updated_at` | Integer (ms) | High | 100% | |
| Working directory | `cwd` | String (path) | High | 100% | Absolute path at session start |
| Model used | `model` | String | High | ~90% | Null for 78/813 threads (old vscode sessions) |
| Reasoning effort | `reasoning_effort` | String enum | High | ~90% | `xhigh`, `high`, `medium`, `low`; null for same 78 |
| Token count (aggregate) | `tokens_used` | Integer | High | 98% | Only 19/813 show 0; cumulative for session |
| CLI version | `cli_version` | String | High | ~90% | Version that created the thread |
| Approval mode | `approval_mode` | String | High | 100% | `never` or `on-request` |
| Sandbox policy | `sandbox_policy` | JSON string | High | 100% | Structured: type + writable_roots + network_access |
| First user message | `first_user_message` | String | High | ~90% | Truncated prompt |
| Git context | `git_sha`, `git_branch`, `git_origin_url` | String | High | ~70% | Present when git repo detected |
| Session origin | `source` | String/JSON | High | 100% | `cli`, `exec`, `vscode`, or subagent JSON |
| Agent nickname | `agent_nickname` | String | High | subagents only | Only populated for spawned agents |
| Agent role | `agent_role` | String | High | subagents only | Agent type, e.g., `gsdr-auditor` |
| Memory mode | `memory_mode` | String | High | 100% | Only value observed: `enabled` |
| Agent path | `agent_path` | String | Medium | sparse | Path to agent TOML config |

### 3.2 Structured Signals (state_5.sqlite — `thread_spawn_edges`)

| Signal | Field | Type | Reliability | Coverage |
|--------|-------|------|-------------|----------|
| Parent-child relationship | `parent_thread_id`, `child_thread_id` | UUID | High | 100% of spawned agents |
| Agent status | `status` | String | High | 100% | `open` or `closed` |

**Note:** 214 spawn edges from 813 threads = ~26% of sessions are subagents. The `source` field in `threads` encodes parent_id, depth, agent_nickname, and agent_role as a JSON blob for subagents — redundant with `thread_spawn_edges` but richer.

### 3.3 Structured Signals (state_5.sqlite — `stage1_outputs`)

| Signal | Type | Reliability | Notes |
|--------|------|-------------|-------|
| Raw memory text | Text (Markdown) | Medium | Auto-generated memory from session; quality varies |
| Rollout summary | Text (Markdown) | Medium | Auto-generated session summary |
| Last usage timestamp | Integer | High | When memory was last accessed |
| Usage count | Integer | High | How many times memory was reused |

### 3.4 Structured Signals (logs_2.sqlite)

| Signal | Field | Type | Reliability | Notes |
|--------|-------|------|-------------|-------|
| Log timestamp (ns precision) | `ts`, `ts_nanos` | Integer | High | Nanosecond granularity |
| Log level | `level` | String | High | DEBUG/INFO/WARN/ERROR/TRACE |
| Rust module origin | `target` | String | High | e.g., `codex_core::tools::router` |
| Log message | `feedback_log_body` | String | Medium | Nullable; structured text, not JSON |
| Thread association | `thread_id` | UUID | High | Links to `threads` table; nullable |
| Error events | `level='ERROR'` subset | String | High | 74 records across corpus |

### 3.5 Semi-structured Signals (Session JSONL)

#### Per-Turn Token Accounting (`event_msg/token_count`)

**Epistemic status: Sampled**
```json
{
  "type": "token_count",
  "info": {
    "total_token_usage": {
      "input_tokens": 36207,
      "cached_input_tokens": 4480,
      "output_tokens": 1205,
      "reasoning_output_tokens": 765,
      "total_tokens": 37412
    },
    "last_token_usage": { ... same fields, per-turn ... }
  },
  "rate_limits": {
    "limit_id": "codex",
    "primary": { "used_percent": 0.0, "window_minutes": 300, "resets_at": ... },
    "secondary": { "used_percent": 10.0, "window_minutes": 10080, "resets_at": ... },
    "plan_type": "pro"
  }
}
```

**Signals extractable:**
- `input_tokens` — context size this turn
- `cached_input_tokens` — prompt cache hits (efficiency signal)
- `output_tokens` — generation size
- `reasoning_output_tokens` — reasoning trace token cost (distinct from output)
- `total_token_usage` vs `last_token_usage` — cumulative vs per-turn delta (both present)
- Rate limit consumption percentage (primary = 5hr window, secondary = 7-day window)
- `plan_type` — subscription tier

#### Session Metadata (`session_meta`, always first event)

**Epistemic status: Sampled**

Contains full session context including: `id`, `timestamp`, `cwd`, `originator` (`codex-tui`/`exec`), `cli_version`, `source`, `model_provider`, full `base_instructions` text, and complete git context (`commit_hash`, `branch`, `repository_url`).

#### Per-Turn Context (`turn_context`)

**Epistemic status: Sampled**

Contains: `turn_id`, `cwd`, `current_date`, `timezone`, `approval_policy`, `sandbox_policy` (detailed JSON), `model`, `personality`, and full `collaboration_mode` descriptor (mode name, model override, reasoning_effort, developer_instructions text).

**Key signal:** collaboration_mode encodes the per-turn model and reasoning_effort overrides, which may differ from session defaults.

#### Shell Command Events (`event_msg/exec_command_end`)

**Epistemic status: Sampled**
Fields: `call_id`, `process_id`, `turn_id`, `command` (array), `cwd`, `parsed_cmd`, `source`, `stdout`, `stderr`, `aggregated_output`, `exit_code`, `duration` (structured object), `formatted_output`, `status`.

**Signals extractable:** exit code, command array (tool use pattern), execution cwd, stdout/stderr content.

#### Multi-Agent Spawn Events (`event_msg/collab_agent_spawn_end`)

**Epistemic status: Sampled**
Fields: `call_id`, `sender_thread_id`, `new_thread_id`, `new_agent_nickname`, `new_agent_role`, `prompt` (full prompt text).

**Signals extractable:** parent→child thread linkage, agent role taxonomy, full spawning prompt (enables analysis of task decomposition).

#### Multi-Agent Close Events (`event_msg/collab_close_end`)

**Epistemic status: Sampled**
Fields: `call_id`, `sender_thread_id`, `receiver_thread_id`, `receiver_agent_nickname`, `receiver_agent_role`, `status` (text description of completion).

**Signals extractable:** Completion status text, agent identity on close.

#### Reasoning (`response_item/reasoning`)

**Epistemic status: Sampled**
Fields: `type`, `summary` (array, always empty in observed records), `content` (null), `encrypted_content` (AES-encrypted blob).

**Signal availability:** Reasoning content is fully encrypted in all sampled sessions. `encrypted_content` is present but opaque. No summary text observed. This is a hard wall — reasoning traces are inaccessible from local artifacts.

#### File Patch Events (`event_msg/patch_apply_end`)

**Epistemic status: Sampled**
Fields: `call_id`, `turn_id`, `stdout` (success message + file list), `stderr`, `success` (boolean), `changes` (map of path → {type, content}).

**Signals extractable:** files modified/added/deleted per turn, success/failure, diff content.

#### Context Compaction (`event_msg/context_compacted`, `compacted`)

**Epistemic status: Sampled**
The `compacted` event contains `replacement_history` — a condensed conversation history replacing the original context. Signals a context window pressure event.

#### MCP Tool Events (`event_msg/mcp_tool_call_end`)

**Epistemic status: Sampled**
Fields: `call_id`, `invocation` (server, tool, arguments), `duration` (secs+nanos), `result` (Ok/Err with content).

**Signals extractable:** MCP server name, tool name, arguments, duration, success/failure.

#### Web Search Events (`event_msg/web_search_end`, `response_item/web_search_call`)

**Epistemic status: Sampled**
Fields: query, queries array, action type.

#### Plan Item Completion (`event_msg/item_completed`)

**Epistemic status: Sampled (sparse, 1 observed)**
Fields: `thread_id`, `turn_id`, `item` (type: `Plan`, full plan text).

#### `history.jsonl`

**Epistemic status: Sampled**
Schema: `{session_id, ts, text}`. Raw user input text only. Session linkage via `session_id`. No model, no response, no tool use.

---

## 4. Cross-Platform Asymmetry Map

The following table compares Codex CLI signals to what is known or expected from Claude Code. Lane 1 will have the Claude Code detail; this lane provides the Codex side and notes the asymmetry.

| Category | Claude Code | Codex CLI | Asymmetry | Impact on Measurement | Mitigation |
|----------|-------------|-----------|-----------|----------------------|------------|
| **Session ID format** | Unknown format (Lane 1) | UUIDv7 — monotonically sortable by creation time | Possibly different formats | If formats differ, cross-runtime session joining must use timestamp not ID | Feature-engineer a canonical session timestamp field |
| **Session metadata location** | `~/.claude/projects/.../` JSONL (Lane 2) | `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl` | Date-partitioned path vs project-partitioned path | Codex natively groups by date; Claude by project | Ingest both; normalize to (project, date, session_id) key |
| **Token counts — total** | Unknown (Lane 1/2) | `threads.tokens_used` (INTEGER, aggregate per session) | Unknown | If Claude Code exposes aggregate tokens, both can be compared | Verify Claude Code equivalent |
| **Token counts — breakdown** | Unknown | `event_msg/token_count`: input, cached_input, output, reasoning_output, total (per-turn, cumulative+delta) | **Codex has richer breakdown**: input/cached/output/reasoning split | If Claude Code only exposes total, reasoning token cost is Codex-unique | **Codex-unique signal**: reasoning token consumption measurable on Codex side only |
| **Model identification** | Unknown | `threads.model` (string, e.g., `gpt-5.4`) + `turn_context.model` (per-turn) | Unknown | Model-stratified performance analysis requires model field in both | Likely symmetric — Claude Code almost certainly logs model |
| **Reasoning effort level** | Unknown | `threads.reasoning_effort` (`xhigh`, `high`, `medium`, `low`) | **Codex-unique** — Claude Code has no equivalent knob | Reasoning effort × quality correlation is measurable on Codex only | No mitigation; register as Codex-unique |
| **Sandbox mode** | Unknown — hooks exist but sandbox model unclear | `sandbox_policy` JSON: type (danger-full-access, workspace-write, read-only) + writable_roots + network_access | Sandbox model differs: Claude Code uses permissions in `settings.json`; Codex uses typed sandbox policies | If measuring agent behavior by permission level, the classification schemes differ | Normalize to abstract permission tiers: (full, write-restricted, read-only) |
| **Approval mode** | Claude Code uses `settings.json` hooks to control approval | `threads.approval_mode`: `never` or `on-request` | Claude Code hooks are richer (per-tool, regex-gated); Codex has binary approval mode + `rules/default.rules` | Per-tool approval data richer in Claude Code | Codex: binary flag. Claude Code: richer rule structure. Not directly comparable |
| **Git context at session start** | Lane 2 to determine | `git_sha`, `git_branch`, `git_origin_url` in `threads` table + `session_meta.git` in JSONL | Likely symmetric | Cross-runtime repo-stratified analysis possible if both have it | Verify Claude Code equivalent |
| **Multi-agent spawn events** | Unknown (Lane 1/2) | `collab_agent_spawn_end` with parent_id, child_id, agent_role, full prompt | Full spawn graph reconstructible | Agent performance per role type measurable if Claude Code has equivalent | Claude Code uses Task tool; event structure unknown |
| **Agent parent-child graph** | Unknown | `thread_spawn_edges` table (parent_id, child_id, status) | Unknown | Complete spawn tree is reconstructible from Codex state_5.sqlite | Verify Claude Code Task tool creates equivalent linkage |
| **Agent nicknames** | Unknown | `agent_nickname` string per thread (e.g., `Harvey`, `Raman`) | Codex assigns human-readable names to agents | Enables tracking of individual agent instances across turns | Claude Code agents may not have nicknames |
| **Agent role taxonomy** | Unknown | `agent_role` string (e.g., `gsdr-auditor`, `worker`) | Unknown | Role-stratified performance analysis requires role field | Verify Claude Code Task tool exposes agent type |
| **Reasoning traces** | Unknown | Encrypted (`encrypted_content` blob). Inaccessible. | Both likely encrypt reasoning | Reasoning content cannot be analyzed in either runtime from local artifacts | Not available. Register as hard limit. |
| **Conversation content** | Stored in project JSONL (Lane 2) | Full message history in session JSONL `response_item/message` records | Both store conversation | Cross-runtime conversation analysis possible if formats normalized | Different schema; normalization required |
| **Tool use patterns** | Unknown | `exec_command_end` (shell), `patch_apply_end` (file edits), `mcp_tool_call_end` (MCP), `web_search_end` (web search) | Tool ecosystems differ: Codex uses exec + apply_patch as primitives; Claude uses different tool names | Tool use frequency/pattern comparison requires name normalization | Map Codex exec_command → Claude Bash, apply_patch → Claude Edit/Write, etc. |
| **Context window size** | Unknown | `model_context_window` in `task_started` event (e.g., 258400 tokens) | Unknown | Context window pressure analysis requires this field | Verify Claude Code equivalent |
| **Context compaction events** | Unknown | `compacted` event + `event_msg/context_compacted` | Unknown | Compaction frequency is a context pressure signal | Verify Claude Code equivalent |
| **Per-turn timing** | Unknown | `exec_command_end.duration` (structured), `mcp_tool_call_end.duration` (secs+nanos) | Unknown | Tool execution latency measurable from Codex logs | Verify Claude Code equivalent |
| **Rate limit consumption** | Unknown | `token_count.rate_limits`: primary (5hr window, %) + secondary (7-day window, %) + plan_type | Likely Codex-specific | Rate limit pressure as a proxy for usage intensity | **Likely Codex-unique** — Claude Code uses different subscription/billing model |
| **Session origin type** | Unknown | `source`: `cli`, `exec`, `vscode`, or subagent JSON blob | Unknown | Can distinguish interactive vs headless vs IDE sessions | Verify Claude Code equivalent |
| **Shell environment snapshot** | Not applicable | `shell_snapshots/*.sh` — full shell env per session | Claude Code does not snapshot shell | Not a measurement signal; context for reproducibility | No equivalent needed |
| **Prompt cache efficiency** | Unknown | `cached_input_tokens` in `token_count` | Unknown | Cache hit rate measurable from Codex; unknown for Claude | Likely asymmetric — Claude Code may not expose cache hits |
| **Input history** | Unknown | `history.jsonl`: session_id, ts, text (no model/response) | Unknown | Raw input history without context is low-signal | Not useful for measurement |
| **Session compaction memory** | Unknown | `stage1_outputs`: raw_memory, rollout_summary, usage_count | Unknown | Agent memory quality measurable if Claude Code stores similar artifacts | Claude Code has project-level memory; unclear if similar compaction |
| **MCP tool call events** | Unknown | `mcp_tool_call_end`: server, tool, arguments, duration, result | Claude Code has MCP integration too | MCP usage patterns measurable in Codex; assume Claude Code equivalent | Verify Claude Code MCP event logging |
| **Web search events** | Unknown | `web_search_end` / `web_search_call` | Unknown | Web search usage pattern measureable; Claude Code uses WebSearch tool differently | May be symmetric with different event name |
| **Plan item tracking** | Unknown | `event_msg/item_completed` with full plan text | Unknown | Task completion events rare but present | Sparse in sample; may not be reliable measurement source |
| **Plugin events** | Unknown | Plugin manifest warnings dominate logs_2.sqlite | Claude Code does not have plugins | Plugin-related errors measurable but mostly noise | Codex-specific; no Claude equivalent |

---

## 5. Codex-Unique Capabilities

These signals exist in Codex CLI artifacts with no apparent Claude Code counterpart. All claims are **sampled** unless otherwise noted.

### 5.1 Reasoning Effort Level (sampled)

`reasoning_effort` field in `threads` table: `xhigh`, `high`, `medium`, `low`. This is an explicit quality dial with no Claude Code equivalent. Enables:
- Reasoning effort × output quality correlation
- Reasoning effort × token cost analysis (reasoning_output_tokens × effort level)
- Cost-effectiveness analysis: is `xhigh` justified vs `high`?

Distribution in 813-thread corpus: high (543), xhigh (183), medium (8), low (1), null (78).

### 5.2 Reasoning Token Separation (sampled)

`reasoning_output_tokens` is reported separately from `output_tokens` in `event_msg/token_count`. Claude Code uses Claude models which may not expose this distinction. This enables:
- Actual thinking cost isolation
- Reasoning efficiency: quality achieved per reasoning token
- Comparison across effort levels

### 5.3 Rate Limit Window Exposure (sampled)

`token_count.rate_limits` provides:
- Primary window: 5-hour rolling, `used_percent`, `resets_at`
- Secondary window: 7-day rolling, `used_percent`, `resets_at`
- `plan_type` (observed: `pro`)

This directly exposes Codex subscription pressure. No Claude Code equivalent is known. Enables:
- Rate limit proximity as a session context signal
- Weekly usage pattern analysis
- Session intensity tracking

### 5.4 Multi-Agent Nickname System (sampled)

Each spawned agent receives a human-readable nickname (`Harvey`, `Raman`, `Huygens`, etc.) stored in `agent_nickname`. This enables:
- Individual agent instance tracking across turns within a session
- Identifying which named agent produced which output
- Agent re-spawning pattern detection (same role, different nickname)

Claude Code Task tool spawns likely do not have nicknames.

### 5.5 Sandbox Policy as Structured Data (sampled)

`sandbox_policy` in `threads` is stored as JSON (not a simple string): `{"type": "danger-full-access"}`, `{"type": "workspace-write", "writable_roots": [...], "network_access": false, "exclude_tmpdir_env_var": false}`. This is richer than a simple permission flag. The `writable_roots` array and `network_access` boolean enable fine-grained permission analysis.

### 5.6 Collab Status Probe Events (sampled)

`event_msg/collab_agent_interaction_end` records status probes sent from orchestrator to child agent, with `status` field indicating whether the child is `running`, `blocked`, or `completed`. Claude Code Task tool has no known equivalent "are you alive" probe event.

### 5.7 Prompt Caching Visibility (sampled)

`cached_input_tokens` in `token_count` gives per-turn prompt cache hit count. This is measurable and reveals:
- Whether long-context sessions benefit from caching
- Cache efficiency as sessions grow
- Context vs. cost tradeoff

Status for Claude Code: **unknown** (Lane 1/2 to determine).

---

## 6. Gaps and Unknowns

### 6.1 Cannot verify without running more Codex sessions

- **`runtime_metrics` feature flag (inferred):** The `runtime_metrics` feature is listed as `under development, false`. If enabled, it may expose structured per-turn latency, queue time, and other performance data not currently in JSONL events. Unknown what fields it would add. **Epistemic status: speculative.**

- **`general_analytics` feature flag (inferred):** Similarly disabled. May expose aggregate analytics data. **Epistemic status: speculative.**

- **`exec_command_end.duration` structure:** The `duration` field exists (observed), but its exact type (milliseconds integer vs. secs/nanos struct) was not fully resolved in sampling. For MCP calls, `duration` is `{secs: N, nanos: N}`. For shell commands, the field type may differ. **Epistemic status: inferred from partial sampling.**

- **`agent_jobs` table (inferred):** The schema exists but 0 records were found. This is Codex Cloud batch job infrastructure. On a local non-cloud install, this table is always empty. Its signals (`instruction`, `output_schema_json`, `input_csv_path`, etc.) are **unknown** in practice because they require Codex Cloud access.

- **`thread_dynamic_tools` table (verified absent):** 0 records found despite schema existing. This table tracks tools dynamically added to a thread (beyond the standard set). No instances observed in 813 sessions. Likely unused in current GSD/GSDR workflows.

- **Hooks output:** `codex_hooks = true` is set in global `config.toml` and the feature is enabled. Hook execution events would appear in session JSONL if hooks fire. No hook-specific event subtype was found in sampled sessions, suggesting either (a) no hooks.json is installed, or (b) hooks fired but their events merge into existing event types. **Epistemic status: unknown — hooks are configured at the feature level but no hooks.json was found in `~/.codex/` during this audit.**

- **v0.120.0 vs v0.118.0 schema changes:** Phase 55.2 was researched against v0.118.0. Current version is v0.120.0 (2 minor versions ahead). Schema changes between these versions are **unknown** — no changelog was examined. The thread schema has a history of additive column additions (e.g., `model`, `reasoning_effort`, `agent_path` are noted as later additions in the SQL). Additional fields may exist in v0.120.0 that were absent in Phase 55.2.

### 6.2 Verified absent

- **Plaintext reasoning content:** All `response_item/reasoning` records have `encrypted_content` and null `content`. No unencrypted reasoning was found in any sampled session. This is confirmed absent, not just unsampled.

- **`session_index.jsonl` as comprehensive index:** Only 2 records found despite 813 sessions in `state_5.sqlite` and 971 JSONL files in `sessions/`. This file does not serve as a complete session registry. It is not a reliable signal source.

- **Any Codex equivalent of Claude Code's `~/.claude/settings.json` hook events:** Claude Code triggers hooks (PreToolUse, PostToolUse, Stop, etc.) that produce structured event records. Codex hooks are configured via `hooks.json` but no hook execution events were found in sampled sessions. No `hooks.json` file was found in `~/.codex/`. Codex hooks are enabled at the feature level but not functionally installed for GSD workflows.

---

## 7. Feedback Loop Mapping

### 7.1 Agent Performance Loop

**Question:** Can we compare agent performance across runtimes with available data?

**Codex signals available:**
- `threads.tokens_used` — session-level cost proxy
- `event_msg/token_count` — per-turn token breakdown
- `threads.reasoning_effort` × `reasoning_output_tokens` — effort-calibrated cost
- `event_msg/task_complete` / `event_msg/turn_aborted` counts — completion rate
- `event_msg/patch_apply_end.success` — file edit success rate
- `exec_command_end.exit_code` — command success rate
- `threads.agent_role` — role-stratified performance

**Cross-runtime comparison:** Partially possible. Token count comparison is possible if Claude Code exposes total tokens. Role-stratified comparison requires matching agent role taxonomy across runtimes. Reasoning effort has no Claude Code equivalent — Codex-side-only signal.

**Limitation:** GSD runs primarily on Claude Code. The Codex corpus is from adjacent projects (`prix-guesser`, `f1-modeling`). Cross-runtime agent performance comparison would mix projects, not just runtimes. A controlled experiment (same task, both runtimes) would be needed for valid comparison.

### 7.2 Cross-Runtime Comparison Loop

**What comparisons are possible with symmetric data:**
- Session count, duration, working directory — likely symmetric
- Model used per session — likely symmetric  
- Git context (repo, branch, SHA) — both present in Codex; likely in Claude Code
- Tool invocation counts (normalized by name) — requires normalization
- File edit counts — measurable in both
- Error rates (exit_code != 0, turn_aborted) — likely symmetric

**What comparisons are impossible due to asymmetry:**
- Reasoning effort stratification — Codex-only
- Reasoning token cost isolation — Codex-only (if Claude Code doesn't separate)
- Rate limit pressure — Codex-only window structure
- Sandbox policy type — different classification schemes
- Agent nickname tracking — Codex-only

### 7.3 Intervention Lifecycle Loop

Codex provides:
- `event_msg/context_compacted` / `compacted` events: detect sessions that hit context pressure. A context compaction event is a signal that the session was long enough to require compaction — relevant to evaluating whether interventions increase or decrease session length.
- `stage1_outputs.usage_count` — memory reuse count tracks whether generated memories are being consumed by later sessions.

### 7.4 Pipeline Integrity Loop

Codex provides:
- `event_msg/turn_aborted.reason` — interrupted vs error distinction
- `exec_command_end.exit_code` non-zero — failed shell operations
- `patch_apply_end.success = false` — failed file edits
- `logs_2.sqlite ERROR` records (74 total) — runtime errors with module-path attribution
- `collab_agent_interaction_end.status` — subagent liveness (running/blocked/completed)
- `thread_spawn_edges.status` — open (orphaned?) vs closed agents

**Reliability:** Error events in `logs_2.sqlite` are linkable to sessions via `thread_id`. This enables per-session error attribution.

### 7.5 Signal Quality Loop (meta)

Codex-specific:
- `rate_limits.primary.used_percent` — if high at session start, sessions may be interrupted by rate limits. A signal about signal collection conditions.
- `reasoning_effort` × output quality — signals about the measurement system's own cost calibration (if sensors use high/xhigh unnecessarily, this is measurable).

### 7.6 Cross-Session Pattern Loop

Codex provides:
- `thread_spawn_edges` — complete agent spawn graph across a session corpus. Can reconstruct which orchestrator sessions spawned which sensor sessions.
- `threads.source` — for subagents, encodes parent_thread_id, depth, agent_nickname, agent_role as JSON. Full genealogy is reconstructible.
- `stage1_outputs.usage_count` + `last_usage` — which sessions' memories were reused and how often.

**Codex-unique capability:** The multi-agent spawn graph in Codex is fully persisted in the `thread_spawn_edges` table. Claude Code Task tool spawn relationships are unknown (Lane 1/2 to verify). If Claude Code does not persist spawn edges in a queryable table, Codex has a structural advantage for multi-agent workflow analysis.

---

## Appendix: Evidence Provenance

All findings in this document cite actual artifacts observed on this machine unless explicitly marked otherwise.

**Files directly read:**
- `/home/rookslog/.codex/config.toml` — read in full
- `/home/rookslog/.codex/state_5.sqlite` — schema dumped, records sampled
- `/home/rookslog/.codex/logs_2.sqlite` — schema dumped, records sampled
- `/home/rookslog/.codex/sessions/2026/04/12/rollout-2026-04-12T21-48-56-019d8487-0c27-7582-b8c1-07e168cf219f.jsonl` — full event inventory (20,386 lines)
- `/home/rookslog/.codex/sessions/2026/04/11/rollout-2026-04-11T00-02-32-019d7ab4-a456-7ed3-bfba-5308910178fc.jsonl` — sampled
- `/home/rookslog/.codex/sessions/2026/03/17/rollout-2026-03-17T02-46-36-019cfa8b-de1a-7943-97e2-65c37608bc3d.jsonl` — reasoning field check
- `/home/rookslog/.codex/shell_snapshots/019d8487-0c27-7582-b8c1-07e168cf219f.1776044936255041601.sh` — sampled
- `/home/rookslog/.codex/history.jsonl` — schema sampled
- `/home/rookslog/.codex/session_index.jsonl` — read in full (2 records)
- `.planning/phases/55.2-codex-runtime-substrate/55.2-CONTEXT.md` — read in full
- `.planning/phases/55.2-codex-runtime-substrate/55.2-RESEARCH.md` — read in full
- `.planning/phases/55.2-codex-runtime-substrate/55.2-01-SUMMARY.md` — read in full

**Commands executed:**
- `codex --version` → `codex-cli 0.120.0`
- `codex features list` → full feature flag table
- `sqlite3 state_5.sqlite .schema` → complete schema
- `sqlite3 logs_2.sqlite .schema` → complete schema
- Multiple `sqlite3` SELECT queries for record counts and samples
- `find ~/.codex -name "*.jsonl"` → 971 files found
- Python3 analysis of JSONL event types and subtypes
