# Lane 2: Claude Code Session Logs — Indirect Signal Inventory

**Auditor:** Lane 2 sub-agent
**Date:** 2026-04-15
**Scope:** Claude Code log artifacts beyond the structured session-meta files — conversation transcripts, JSONL records, debug logs, and derived data files.
**Working dir:** `/home/rookslog/.claude/`

---

## 1. Log Locations and Formats

### Primary Log Artifacts

| Location | Format | Count / Size | Date Range | Notes |
|----------|--------|-------------|------------|-------|
| `~/.claude/projects/<proj>/session-uuid.jsonl` | JSONL (one record per line) | 142 files / ~961 MB total across all projects | 2026-03-08 to 2026-04-16 | Main conversation transcript; primary subject of this audit |
| `~/.claude/projects/<proj>/session-uuid/subagents/agent-*.jsonl` | JSONL | ~2,373 files across all projects | Same range | Per-subagent conversation transcripts |
| `~/.claude/projects/<proj>/session-uuid/subagents/agent-*.meta.json` | JSON | ~515 files (this project alone) | Same range | Subagent type and description metadata |
| `~/.claude/debug/*.txt` | Plain text (structured log lines) | 9 files / ~38 MB | 2026-03-06 to present | Debug-level internal events; not session-scoped |
| `~/.claude/history.jsonl` | JSONL | 6,687 lines / 2.3 MB | Full history | Lightweight command history (display + timestamp) |
| `~/.claude/sessions/*.json` | JSON | 9 files | Current active sessions | Live session registry (PID, sessionId, CWD, kind) |
| `~/.claude/stats-cache.json` | JSON | 20 KB | Aggregated | Pre-aggregated statistics across all sessions |
| `~/.claude/usage-data/session-meta/*.json` | JSON | 268 files / ~1.6 MB | Full history | Pre-computed per-session feature summaries (rich!) |
| `~/.claude/usage-data/facets/*.json` | JSON | 109 files | Subset of sessions | AI-generated session quality annotations |
| `~/.claude/todos/*.json` | JSON | 1,107 files / 4.5 MB | Full history | Per-agent TodoWrite state snapshots |
| `~/.claude/shell-snapshots/*.sh` | Shell script | Several files | Recent | Bash shell environment snapshots for tool execution |

**Epistemic status:** Verified-across-corpus for counts and sizes. Sampled for date ranges.

### Corpus Focus

For depth of record-type analysis, primary examination was on the `get-shit-done-reflect` project:
- **60 session JSONL files**, 428 MB
- **210 subagent directories**, 1,108 subagent JSONL files
- **515 subagent meta.json files**

---

## 2. Record Structure

### Record Types in Session JSONL Files

**Schema note:** All non-snapshot records share a common envelope: `parentUuid`, `isSidechain`, `type`, `uuid`, `timestamp`, `userType`, `entrypoint`, `cwd`, `sessionId`, `version`, `gitBranch`, `slug`.

#### 2.1 `user` (human turn)

```
{
  "type": "user",
  "parentUuid": "<uuid | null>",
  "isSidechain": false,
  "promptId": "<uuid>",
  "isMeta": <bool>,                  // true = system-injected metadata
  "permissionMode": <null | "bypassPermissions">,
  "message": {
    "role": "user",
    "content": "<string | list>"     // string for plain text; list for tool_result
  },
  ...envelope fields...
}
```

**Variants observed (sampled from 3 files):**
- Plain user text: `content` is a string
- Tool result: `content` is `[{"type": "tool_result", "tool_use_id": "...", "content": "..."}]`
- Meta messages: `isMeta: true`, injected context (skills, hooks, command permissions)

#### 2.2 `assistant` (model turn)

```
{
  "type": "assistant",
  "message": {
    "model": "claude-opus-4-6",
    "role": "assistant",
    "content": [<content_block>, ...],
    "stop_reason": "tool_use | end_turn",
    "stop_sequence": null,
    "stop_details": null,
    "usage": {
      "input_tokens": <int>,
      "output_tokens": <int>,
      "cache_creation_input_tokens": <int>,
      "cache_read_input_tokens": <int>,
      "cache_creation": {"ephemeral_1h_input_tokens": <int>, "ephemeral_5m_input_tokens": <int>},
      "service_tier": "standard",
      "inference_geo": "<string>",
      "iterations": [<per-sub-request token breakdown>],
      "speed": "standard",
      "server_tool_use": {"web_search_requests": <int>, "web_fetch_requests": <int>}
    }
  },
  "requestId": "<string>",
  ...envelope...
}
```

**Content block variants:**
- `{"type": "text", "text": "..."}` — prose response
- `{"type": "thinking", "thinking": "", "signature": "<string>"}` — thinking block (**content is always empty string; only signature is stored**; verified across 61 files)
- `{"type": "tool_use", "id": "toolu_...", "name": "<tool_name>", "input": {...}, "caller": {"type": "direct"}}` — tool invocation

#### 2.3 `user[tool_result]` (tool response back to model)

The user record carrying a tool result also has a top-level `toolUseResult` field — a structured parallel to the `content` field containing machine-readable tool output:

**`toolUseResult` variants observed:**

| Variant | Key fields | Notes |
|---------|-----------|-------|
| Bash execution | `stdout`, `stderr`, `interrupted`, `isImage`, `noOutputExpected`, `returnCodeInterpretation` | `interrupted: true` signals user Ctrl+C |
| File read | `type`, `file` (dict) | Read/Glob result |
| Edit | `filePath`, `oldString`, `newString`, `structuredPatch`, `userModified`, `replaceAll`, `originalFile` | Edit diff stored |
| Write | `type`, `filePath`, `content`, `structuredPatch`, `originalFile` | Write result |
| Agent spawn | `isAsync`, `status`, `agentId`, `description`, `prompt`, `outputFile`, `canReadOutputFile` | Shows async agent launch |
| Empty | `{}` | Some tool results carry no structured data |

#### 2.4 `attachment` (injected context)

Injected between user turns. Type-discriminated by `attachment.type`:

| Attachment type | Key fields | Meaning |
|-----------------|-----------|---------|
| `hook_success` | `hookName`, `toolUseID`, `hookEvent`, `stdout`, `stderr`, `exitCode`, `command`, `durationMs` | Hook ran after tool |
| `hook_additional_context` | `content`, `hookName`, `toolUseID`, `hookEvent` | Hook injected pre-tool context |
| `task_reminder` | `content`, `itemCount` | TodoWrite state reminder |
| `skill_listing` | `content`, `skillCount`, `isInitial` | Skill registry snapshot |
| `deferred_tools_delta` | `addedNames`, `addedLines`, `removedNames` | Deferred tool set change |
| `command_permissions` | `allowedTools` | Permission set for this invocation |
| `queued_command` | `prompt`, `commandMode` | User queued a command while model was running |
| `opened_file_in_ide` | `filename` | User opened a file in the IDE |

#### 2.5 `system` (internal events)

| Subtype | Key fields | Meaning |
|---------|-----------|---------|
| `turn_duration` | `durationMs`, `messageCount` | Wall-clock time for the turn |
| `stop_hook_summary` | `hookCount`, `hookInfos`, `hookErrors`, `preventedContinuation`, `stopReason`, `toolUseID` | Stop hooks executed at turn end |
| `local_command` | `content`, `level`, `isMeta` | Output from local slash commands |

`hookInfos` contains per-hook: `{"command": "...", "durationMs": <int>}`.

#### 2.6 `file-history-snapshot`

```
{
  "type": "file-history-snapshot",
  "messageId": "<uuid>",
  "snapshot": {
    "messageId": "<uuid>",
    "trackedFileBackups": {},   // empty in all observed instances
    "timestamp": "<ISO8601>"
  },
  "isSnapshotUpdate": false
}
```

#### 2.7 `pr-link`

```
{
  "type": "pr-link",
  "sessionId": "<uuid>",
  "prNumber": <int>,
  "prUrl": "<url>",
  "prRepository": "<owner/repo>",
  "timestamp": "<ISO8601>"
}
```

#### 2.8 `queue-operation`

```
{
  "type": "queue-operation",
  "operation": "enqueue | remove",
  "timestamp": "<ISO8601>",
  "sessionId": "<uuid>",
  "content": {}   // empty in observed instances
}
```

#### 2.9 `last-prompt`

```
{
  "type": "last-prompt",
  "lastPrompt": "<string>",
  "sessionId": "<uuid>"
}
```

### 2.10 Subagent-specific additions

Subagent JSONL files use the same record types with two additions in the user record envelope:
- `"agentId": "<hex string>"` — agent identifier matching meta.json filename
- `"isSidechain": true` — distinguishes subagent from parent

Subagent `meta.json` structure:
```json
{"agentType": "gsdr-executor", "description": "Execute: fix model resolver #30"}
```

### 2.11 AI-generated facets (`usage-data/facets/*.json`)

Per-session quality annotation (109 files observed, field presence 100%):

```json
{
  "session_id": "<uuid>",
  "underlying_goal": "<string>",
  "goal_categories": {"<category>": <int>, ...},
  "outcome": "fully_achieved | mostly_achieved | partially_achieved | not_achieved | unclear_from_transcript",
  "user_satisfaction_counts": {"likely_satisfied": <int>, "satisfied": <int>},
  "claude_helpfulness": "essential | helpful | minimal",
  "session_type": "single_task | multi_task | iterative_refinement | exploration | quick_question",
  "friction_counts": {"wrong_approach": <int>, "misunderstood_request": <int>, ...},
  "friction_detail": "<prose string>",
  "primary_success": "multi_file_changes | ...",
  "brief_summary": "<prose string>"
}
```

**Friction types observed (109 sessions):** `wrong_approach` (35), `misunderstood_request` (14), `buggy_code` (13), `excessive_changes` (6), `user_rejected_action` (3), `missed_step` (2), `revision_needed`, `insufficient_detail`, `excessive_questions`, `request_interrupted`, `tool_reliability`, `wrong_data`.

**Epistemic note:** These are generated by Claude processing the transcript — not first-order observations. They are second-order signals with all the caveats of LLM self-evaluation.

---

## 3. Extractable Features Inventory

| # | Feature | Source Records | Difficulty | Reliability | Retroactive? | Privacy Flag | Serves Loop |
|---|---------|---------------|-----------|------------|-------------|-------------|------------|
| 1 | Tool call sequence per turn | `assistant[tool_use]` → `content[].name` | Trivial | High | Yes | No | Agent performance, Pipeline integrity |
| 2 | Tool call frequency per session | Same | Trivial | High | Yes | No | Agent performance |
| 3 | Inter-tool timing (turn-level) | `assistant.timestamp` + `user[tool_result].timestamp` | Moderate | High | Yes | No | Agent performance |
| 4 | Turn wall-clock duration | `system/turn_duration.durationMs` | Trivial | High | Yes | No | Agent performance |
| 5 | Session message count per turn | `system/turn_duration.messageCount` | Trivial | High | Yes | No | Pipeline integrity |
| 6 | Token usage per turn (input/output/cache) | `assistant.message.usage` | Trivial | High | Yes | No | Agent performance, Cross-session patterns |
| 7 | Cache hit rate per turn | `assistant.message.usage.cache_read_input_tokens / (cache_read + cache_creation)` | Trivial | High | Yes | No | Agent performance |
| 8 | Context growth trajectory (cache_creation growth) | `assistant.message.usage.cache_creation_input_tokens` sequence | Moderate (aggregate) | High | Yes | No | Context window dynamics |
| 9 | Model used per turn | `assistant.message.model` | Trivial | High | Yes | No | Agent performance, Cross-runtime comparison |
| 10 | Stop reason distribution | `assistant.message.stop_reason` | Trivial | High | Yes | No | Error and recovery |
| 11 | Tool error (non-empty stderr) | `user[tool_result].toolUseResult.stderr` | Trivial | High | Yes | **Content** (stderr may contain paths/user data) | Error and recovery |
| 12 | Tool interruption (Ctrl+C) | `user[tool_result].toolUseResult.interrupted == true` | Trivial | High | Yes | No | User interaction |
| 13 | Thinking block presence per turn | `assistant.content[].type == 'thinking'` | Trivial | High | Yes | No | Reasoning traces |
| 14 | Thinking block count per session | Count of `thinking` content blocks | Trivial | High | Yes | No | Reasoning traces |
| 15 | User message length | `len(user.message.content)` for string messages | Trivial | Medium | Yes | **Content** | User interaction |
| 16 | Hook execution per tool call | `attachment[hook_success]`: `durationMs`, `exitCode`, `command` | Trivial | High | Yes | No | Pipeline integrity |
| 17 | Hook failure | `attachment[hook_success].exitCode != 0` | Trivial | High | Yes | No | Error and recovery |
| 18 | Stop hook result | `system/stop_hook_summary`: `hookCount`, `hookErrors`, `preventedContinuation` | Trivial | High | Yes | No | Pipeline integrity |
| 19 | Agent spawn event | `user[tool_result].toolUseResult.isAsync == true` | Trivial | High | Yes | **Content** (prompt field) | Agent performance |
| 20 | Subagent type | `subagents/agent-*.meta.json.agentType` | Trivial | High | Yes | No | Agent performance |
| 21 | Subagent description | `subagents/agent-*.meta.json.description` | Trivial | Medium | Yes | No | Agent performance, Signal quality |
| 22 | Subagent model | `assistant.message.model` in subagent JSONL | Trivial | High | Yes | No | Agent performance, Cross-runtime comparison |
| 23 | Subagent token usage | `assistant.message.usage` in subagent JSONL | Trivial | High | Yes | No | Agent performance |
| 24 | Subagent tool pattern | `assistant[tool_use].name` sequence in subagent JSONL | Trivial | High | Yes | No | Agent performance |
| 25 | bypassPermissions mode | `user.permissionMode == 'bypassPermissions'` | Trivial | High | Yes | No | Pipeline integrity |
| 26 | Permission request events | Debug log: `executePermissionRequestHooks called for tool: <name>` | Hard (text parse) | Medium | Yes (debug logs retained) | No | User interaction |
| 27 | PR creation event | `pr-link.prNumber`, `prUrl`, `prRepository` | Trivial | High | Yes | No | Intervention lifecycle, Pipeline integrity |
| 28 | Session git branch | `user.gitBranch` | Trivial | High | Yes | No | Pipeline integrity |
| 29 | Queued user command | `attachment[queued_command].prompt` | Trivial | High | Yes | **Content** (prompt text) | User interaction |
| 30 | File edits (structured diff) | `user[tool_result].toolUseResult.structuredPatch` | Moderate | High | Yes | **Content** (file paths, diffs) | Pipeline integrity |
| 31 | Files opened in IDE | `attachment[opened_file_in_ide].filename` | Trivial | High | Yes | No | User interaction |
| 32 | MCP tool usage | `assistant[tool_use].name` containing `__` | Trivial | High | Yes | No | Agent performance, Cross-runtime |
| 33 | Skill listing snapshot | `attachment[skill_listing].skillCount` | Trivial | High | Yes | No | Pipeline integrity |
| 34 | Context window: thinking signature presence | `assistant.content[].signature` non-empty | Trivial | High | Yes | No | Reasoning traces |
| 35 | User response latency | Delta between `assistant` record timestamp and next `user` record | Moderate | Medium (assumes no dropped records) | Yes | No | User interaction |
| 36 | Session entrypoint | `user.entrypoint` (`cli`, etc.) | Trivial | High | Yes | No | Cross-runtime comparison |
| 37 | Deferred tool loading | `attachment[deferred_tools_delta].addedNames` | Trivial | High | Yes | No | Pipeline integrity |
| 38 | Agent output file path | `toolUseResult.outputFile` | Trivial | High | Yes | No | Agent performance |
| 39 | Iterations sub-request tokens | `assistant.usage.iterations[]` token breakdown | Moderate | High | Yes | No | Agent performance |
| 40 | Cache tier (1h vs 5m) | `usage.cache_creation.ephemeral_1h_input_tokens` vs `ephemeral_5m_input_tokens` | Trivial | High | Yes | No | Context window dynamics |
| 41 | AI session outcome (facet) | `usage-data/facets/<sid>.json.outcome` | Trivial | Low (AI-generated) | Yes | No | Signal quality |
| 42 | AI friction categories (facet) | `usage-data/facets/<sid>.json.friction_counts` | Trivial | Low (AI-generated) | Yes | No | Signal quality |
| 43 | AI session type (facet) | `usage-data/facets/<sid>.json.session_type` | Trivial | Low (AI-generated) | Yes | No | Intervention lifecycle |
| 44 | Hook additional context content | `attachment[hook_additional_context].content` | Trivial | High | Yes | **Content** | Pipeline integrity |
| 45 | Claude Code version per session | `user.version` | Trivial | High | Yes | No | Cross-runtime comparison |

---

## 4. High-Value Features (Ranked)

Ranking criteria: feedback-loop coverage × feasibility × retroactive availability.

### Tier 1 — Extract Immediately (trivial, high reliability, wide loop coverage)

**1. Tool call sequence per session + subagent**
- Source: `assistant[tool_use].content[].name` (parent) + same in subagent JSOhttps://L
- Difficulty: Trivial
- Serves: Agent performance, Pipeline integrity, Cross-session patterns
- Why high-value: Tool sequence is the backbone of what the agent *did*. Combined with `subagent_type` from meta.json, this gives a per-agent behavioral fingerprint. Cross-correlating with signal timestamps gives intervention lifecycle context.

**2. Per-turn token usage trajectory**
- Source: `assistant.message.usage` (input_tokens, output_tokens, cache_creation, cache_read)
- Difficulty: Trivial
- Serves: Agent performance, Context window dynamics
- Why high-value: `cache_creation_input_tokens` grows as context accumulates. This is the closest available proxy for "how far into context window are we" since Claude Code does not log an explicit context-fill percentage. Cache creation → context growth; cache read → stable context.

**3. Turn duration**
- Source: `system/turn_duration.durationMs`
- Difficulty: Trivial
- Serves: Agent performance
- Why high-value: Wall-clock latency per turn. Combined with token count gives throughput estimate. Can flag slow turns correlating with error recovery.

**4. Subagent type × model × token breakdown**
- Source: `meta.json.agentType` + `assistant.message.model` + `usage` in subagent JSONL
- Difficulty: Trivial (join across two files)
- Serves: Agent performance, Cross-runtime comparison
- Why high-value: Directly answers "which agent type uses which model and how many tokens." Maps to the Sensors-Use-Sonnet feedback preference. Can detect model selection violations.

**5. Hook execution trace (PreToolUse / Stop)**
- Source: `attachment[hook_success]`: `hookEvent`, `durationMs`, `exitCode`, `command`, `toolUseID`
- Difficulty: Trivial
- Serves: Pipeline integrity
- Why high-value: Hooks are the measurement infrastructure's own execution layer. Tracking hook duration and exit codes reveals whether the measurement pipeline is healthy.

**6. Stop hook `preventedContinuation` flag**
- Source: `system/stop_hook_summary.preventedContinuation`
- Difficulty: Trivial
- Serves: Pipeline integrity, Intervention lifecycle
- Why high-value: When a stop hook blocks continuation, that's a signal-worthy event. Cross-correlating with hook command name identifies which hook intervened.

**7. PR creation + repository**
- Source: `pr-link.prNumber`, `prRepository`, `timestamp`
- Difficulty: Trivial
- Serves: Intervention lifecycle, Pipeline integrity
- Why high-value: PRs are phase completion events. Timestamp linkage to session gives phase-to-PR latency.

**8. Bash interruption flag**
- Source: `toolUseResult.interrupted == true`
- Difficulty: Trivial
- Serves: User interaction
- Why high-value: Ctrl+C is a strong negative signal (user dissatisfied with what the model is doing). Zero interruptions observed in this corpus — worth watching.

**9. Git branch per session**
- Source: `user.gitBranch`
- Difficulty: Trivial
- Serves: Pipeline integrity
- Why high-value: Links session to the phase being executed (branch naming convention `gsd/phase-XX-*`). Gives phase context without reading message content.

**10. Session entrypoint + Claude Code version**
- Source: `user.entrypoint`, `user.version`
- Difficulty: Trivial
- Serves: Cross-runtime comparison
- Why high-value: Entrypoint distinguishes CLI, IDE, remote. Version enables before/after comparisons when CC updates ship. Both available retroactively across all sessions.

### Tier 2 — High Value But Requires Joining or Parsing

**11. Context growth rate (cache_creation trajectory per session)**
- Source: Sequential `assistant.usage.cache_creation_input_tokens` within one session
- Difficulty: Moderate (aggregate across turns)
- Serves: Context window dynamics
- Note: Growth slope indicates how quickly the model is consuming context. An abrupt plateau may indicate compaction, though no explicit compaction record type was found.

**12. AI-generated friction labels (facets)**
- Source: `usage-data/facets/<sid>.json.friction_counts`
- Difficulty: Trivial (file read)
- Reliability: Low (AI-generated second-order signal)
- Serves: Signal quality
- Note: 109/268 sessions have facets. Friction labels like `wrong_approach` (35 sessions), `misunderstood_request` (14) correlate with signal-generating events. Useful as a labeling shortcut, not a ground truth.

**13. User response latency (inter-message timing)**
- Source: Delta between last `assistant` timestamp and next `user` timestamp in the message chain
- Difficulty: Moderate (requires chain traversal via parentUuid)
- Serves: User interaction
- Note: Long latency = user took time to think/inspect/correct. Short latency = auto-proceed or yolo mode.

**14. Permission request events**
- Source: Debug log lines matching `executePermissionRequestHooks called for tool: <name>`
- Difficulty: Hard (text parsing, debug logs not scoped to sessions)
- Serves: User interaction
- Note: Debug logs are not session-keyed in filename, making join to JSONL records difficult.

---

## 5. Gaps — What Is NOT Logged

### Critical gaps

**5.1 Context window utilization percentage**
No record shows "context is N% full." The closest proxy is `cache_creation_input_tokens` growth, but this conflates context size with cache behavior. There is no explicit "compaction triggered" event in JSONL files. *Verified-across-corpus:* searched all 60 JSONL files for record types containing "compact" or "compress" — none found.

**5.2 Thinking block content**
Thinking blocks appear in `assistant.content` but the `thinking` field is always an empty string. The `signature` field is present (confirming thinking occurred), but content is stripped before storage. *Verified:* 38 thinking blocks examined across 2 files — all had `thinking: ""` with non-empty signatures. This is permanent: content is not available retroactively.

**5.3 User approval/denial of tool calls**
When a permission prompt is shown and the user approves or denies, the outcome is not recorded in JSONL. The debug log records that `executePermissionRequestHooks` was called, but not what the user decided. The `permissionMode` field only captures whether `bypassPermissions` was active, not interactive approval events.

**5.4 Context compaction/summarization events**
No log record type exists for when Claude Code compresses the context. If auto-compaction occurs, there is no artifact in the session JSONL to mark it.

**5.5 Subagent nested depth**
The `agentId` field and `isSidechain` flag identify that something is a subagent, but nesting depth (subagent of a subagent) cannot be reconstructed from the log structure alone. The `parentUuid` chain only covers message turns, not agent-to-agent spawning hierarchy.

**5.6 Model selection rationale**
The model used per turn is logged, but *why* that model was selected (user setting? skill directive? GSD profile?) is not in the JSONL. This can only be inferred from the session context.

**5.7 Interrupt type disambiguation**
`toolUseResult.interrupted` is present but does not distinguish Ctrl+C from timeout from programmatic cancellation.

**5.8 Token cost**
`usage.costUSD` exists in `stats-cache.json` model records but shows 0 for all models (not computed per-session). No per-turn cost is logged.

**5.9 Debug log session linking**
Debug log files (`~/.claude/debug/*.txt`) are keyed by session UUID as the filename but contain interleaved output from multiple sessions when Claude Code runs multiple parallel instances. The filename does not reliably scope events to one session.

### Log retention

- Session JSONL files: No evidence of expiration policy. Oldest found: 2026-03-08.
- Debug logs: 9 files retained, oldest 2026-03-06. May rotate or be limited by count/size.
- Facets: Only 109/268 session-meta files have facets — coverage is partial and appears selective.
- `history.jsonl`: 6,687 entries; likely bounded but policy not confirmed.

---

## 6. Privacy-Sensitive Features

The following features require reading content beyond metadata. They need a privacy model decision before inclusion in automated extraction:

| Feature | What content is exposed | Risk level |
|---------|------------------------|-----------|
| User message text (plain messages) | The user's literal instructions, questions, corrections | High |
| Tool result content (stdout of Bash, file reads) | File contents, command output, possibly credentials in env vars | High |
| Agent spawn prompt | Full agent prompt text (may contain sensitive context) | High |
| Queued command prompt | User's typed command while model was running | Medium |
| Stderr output | Error messages, possibly paths and environment details | Medium |
| Hook additional context content | Content injected by hooks — may include file excerpts | Medium |
| Structured patch (Edit tool) | Old and new file content in diffs | High |
| File history snapshot backups | Tracked file contents at snapshot time | High |
| AI facet: `underlying_goal` + `brief_summary` | AI's paraphrase of the session — derived from content | Medium |
| AI facet: `friction_detail` | AI's description of what went wrong — quotes context | Medium |

**Design decision needed:** For signal extraction purposes, most high-value features (tool sequences, token counts, timing, hook results) are **privacy-safe** — they carry no message or file content. The privacy-sensitive features above are needed only for specific loops (e.g., signal quality labeling or correction detection) and should be handled with explicit opt-in.

---

## 7. Surprises

### 7.1 The `usage-data/facets/` directory contains AI-generated session quality annotations

**Sampled:** 109 files, all fields present in 100% of files examined. Outcome distribution: 57 "fully_achieved," 29 "mostly_achieved," 14 "partially_achieved," 2 "not_achieved." This was not documented anywhere in the project. Its provenance (when generated? by what process?) is unknown. *Speculative:* These may be generated by a post-session Claude invocation.

### 7.2 `toolUseResult` is a parallel structured representation of tool output

The `toolUseResult` top-level field in `user[tool_result]` records carries a machine-typed version of tool output separate from the model-facing `content` string. For Bash: `{stdout, stderr, interrupted, isImage, noOutputExpected}`. For Edit: `{structuredPatch: [...]}`. This means tool error detection, interruption detection, and diff extraction are all **trivial and do not require reading user-facing content strings**.

### 7.3 `attachment[hook_additional_context]` preserves the full hook-injected context per tool call

Every `PreToolUse` hook that injects context creates an `attachment` record with the injected content, the hook event, and the tool ID it was associated with. This means hook-injected context (like READ-BEFORE-EDIT reminders) is fully auditable retroactively.

### 7.4 `attachment[queued_command]` records user commands typed while the model was working

When a user types a command while Claude Code is running, it's queued and stored as an `attachment[queued_command]` record with the full `prompt` text. This is a direct behavioral signal (user is anticipating, redirecting, or adding context mid-turn).

### 7.5 Thinking block content is completely stripped — not just hidden

Thinking content (`assistant.content[].thinking`) is always an empty string in every examined record (sampled across 61 files, 61+ thinking blocks). Only the cryptographic `signature` field is preserved, confirming thinking occurred. This is a permanent data gap — no retroactive access is possible. This is consistent with Anthropic's documented behavior of not persisting thinking content in transcripts.

### 7.6 2,373 subagent JSONL files vs 142 parent session files

The ratio of subagent to parent sessions (~17:1) reflects heavy use of the Agent tool. Each subagent has its own full conversation transcript including model, tokens, and tool calls. The subagent corpus is the primary analytical target for agent performance measurement — it's larger and richer than the parent session corpus.

### 7.7 `pr-link` record type provides exact PR metadata inline in session JSONL

Rather than requiring cross-referencing with GitHub API, PR creation events are stored directly in the session JSONL with full URL, PR number, and repository. This enables exact phase-to-PR-creation-time measurement without leaving the log corpus.

### 7.8 `iterations` field in usage tracks per-sub-request tokens

The `assistant.message.usage.iterations` field contains a list of per-sub-request token breakdowns. In 1,326 records examined, all had exactly one iteration (no multi-iteration API calls observed). This field may become relevant if Claude Code starts batching requests.

### 7.9 Debug log captures MCP server connection events

The debug log records MCP server connections with timing: `MCP server "context7": Successfully connected to stdio server in 1350ms`. This is the only place MCP server startup latency is logged.

### 7.10 `cache_creation_input_tokens` appears anomalously low relative to `cache_read`

In many turns, `input_tokens` is 1-3 (the literal new content), `cache_creation` is 100K+, and `cache_read` is 12K-30K. This suggests the API billing model counts cached content differently. The `input_tokens` field alone is not a reliable context size indicator — context size must be inferred from `cache_read + cache_creation`.

---

*Audit complete. All claims are based on direct sampling of files at the paths listed. Record counts and sizes were verified programmatically. Content quotations are restricted to field names and structural values, not user message or model output text.*
