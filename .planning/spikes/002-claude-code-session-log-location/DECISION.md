---
created: 2026-03-01
spike: 002
status: decided
decision: enable-with-known-paths
confidence: high
---

# Spike 002 Decision: Claude Code Session Log Location

## Question

Where does Claude Code store session logs, and can they be programmatically accessed for signal detection?

## One-Line Answer

Claude Code stores comprehensive session data in `~/.claude/projects/{path-encoded-project}/` as JSONL files and debug logs in `~/.claude/debug/`, both readable by the current user and suitable for a log sensor.

## Research Findings

### Primary Log Locations Discovered

**1. Session Conversation Logs: `~/.claude/projects/{project-path-encoded}/{session-uuid}.jsonl`**
- Contains full conversation history per session per project
- Project path is encoded by replacing `/` with `-` (e.g., `-Users-rookslog-Development-get-shit-done-reflect`)
- Each session is a UUID-named JSONL file
- Message types found: `user`, `assistant`, `system`, `progress`, `queue-operation`, `file-history-snapshot`
- Each entry includes: `type`, `uuid`, `timestamp`, `sessionId`, `cwd`, `gitBranch`, `version`, `message`
- Assistant messages embed the full API response including model, content blocks, tool calls
- Permissions: `0600` (owner read/write only) -- readable by the same user running Claude Code
- Scale: 181 session files totaling 442MB for one project

**2. Debug Logs: `~/.claude/debug/{session-uuid}.txt`**
- Plain text, timestamped log lines with level tags (`[DEBUG]`, `[ERROR]`)
- Contains: startup sequence, MCP server connections, auth flows, LSP operations, hook execution, API requests
- Permissions: `0644` (world-readable) -- even more accessible than session data
- Scale: 326 debug files totaling 218MB across all projects

**3. Command History: `~/.claude/history.jsonl`**
- Global JSONL file with user input history across all projects
- Each entry: `display` (command text), `timestamp`, `project`, `sessionId`
- Not conversation content -- just what the user typed

**4. Other Data Stores:**
- `~/.claude/file-history/{session-uuid}/` -- file snapshots per session
- `~/.claude/session-env/{session-uuid}/` -- environment snapshots
- `~/.claude/shell-snapshots/` -- shell state captures
- `~/.claude/stats-cache.json` -- aggregate daily statistics (message counts, session counts, tool calls)
- `~/.claude/telemetry/` -- Statsig telemetry events (opt-in)
- `~/Library/Caches/claude-cli-nodejs/{project-path}/` -- CLI cache data

### Log Format Assessment

| Source | Format | Structure | Signal-Relevant |
|--------|--------|-----------|----------------|
| Session JSONL | JSONL (structured) | Typed messages with metadata | HIGH -- contains errors, tool outputs, conversation flow |
| Debug logs | Plain text | Timestamped `[LEVEL] message` | MEDIUM -- contains errors, warnings, startup issues |
| history.jsonl | JSONL (structured) | User commands with timestamps | LOW -- input only, no outcomes |
| stats-cache.json | JSON | Daily aggregates | LOW -- summary only, no detail |

### Programmatic Access Feasibility

- **Permissions:** Session data is `0600` (owner-only), debug logs are `0644`. Since GSD runs as the same user as Claude Code, both are fully readable.
- **Format:** JSONL is ideal for streaming/parsing -- each line is a complete JSON object. No special libraries needed beyond built-in JSON parsing.
- **Stability:** The file structure uses UUIDs and has been consistent across versions 2.1.49 through 2.1.63 (observed in this investigation). However, this is an internal storage format with no stability guarantees from Anthropic.
- **Performance:** Files can be large (individual sessions up to 11MB, project total 442MB). A sensor must use streaming reads and/or only process recent sessions (by modification time).
- **Project scoping:** Data is already organized by project path, making it trivial to read only the relevant project's sessions.

## Decision

**ENABLE the log sensor with the following paths and approach:**

1. **Primary source:** `~/.claude/projects/{encoded-project-path}/*.jsonl` -- session conversation data
2. **Secondary source:** `~/.claude/debug/*.txt` -- debug/error logs
3. **Skip:** `history.jsonl` (low signal value), `stats-cache.json` (too aggregated), `telemetry/` (opt-in, external format)

### Implementation Recommendations

- Read only recent sessions (e.g., sessions modified within the current phase's time window)
- Parse JSONL entries for `type: "assistant"` messages containing error indicators, tool failures, or repeated patterns
- Parse debug logs for `[ERROR]` lines
- Handle the format as best-effort (no stability guarantees) with graceful degradation if the format changes
- Encode project path using the same dash-encoding scheme Claude Code uses

### Caveats

- **No API contract:** These are internal storage formats. Anthropic may change them at any time.
- **Size management:** Session files can be very large. The sensor must stream, not load entire files into memory.
- **Privacy:** Session data contains full conversation content. The sensor should extract patterns/signals, not store raw content.

## Confidence

**HIGH** -- The log locations were directly confirmed by filesystem inspection. The file format was verified by parsing actual files. The data contains the types of information (errors, tool outputs, conversation patterns) that would be valuable for signal detection. The only uncertainty is long-term format stability, which is an inherent risk with any undocumented internal format.

## Implications for SENSOR-07

SENSOR-07 (log sensor shipped disabled) can now be enabled with:
- Known file paths for session and debug data
- Confirmed JSONL/text formats
- Verified read permissions
- Clear implementation approach (stream recent sessions, extract error/failure patterns)

The sensor should remain configurable (path override via config) in case Anthropic moves the storage location in a future version.
