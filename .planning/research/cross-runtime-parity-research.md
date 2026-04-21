---
document_type: living-reference
last_audited: "2026-04-21"
last_audited_codex_version: "0.121.0"
last_audited_claude_code_version: "2.1.116"
audit_method: "GPT-5.4 cross-model drift audit + live CLI verification"
next_audit_due: "2026-05-05"
validation_status: current
---

# Cross-Runtime Parity Research: Claude Code vs Codex CLI for v1.20

**Date:** 2026-04-08
**Mode:** Custom Research (cross-runtime parity, sensor design, patch compatibility) (living document -- re-validate using Validation Commands section when auditing)
**Overall Confidence:** MEDIUM-HIGH (filesystem evidence + installed artifacts; Codex CLI documentation is sparse, so behavioral claims rely on observed session data)

---

## Validation Commands

Run these commands to re-verify parity claims. If any output contradicts the document, update the relevant section and bump `last_audited`.

| Claim | Validation Command | Expected Output |
|-------|--------------------|-----------------|
| Codex version | `codex --version` | 0.121.0 or later |
| Codex hooks available | `codex features list \| grep codex_hooks` | `codex_hooks under development true` |
| Codex multi-agent | `codex features list \| grep multi_agent` | `multi_agent stable true` |
| Codex multi-agent v2 | `codex features list \| grep multi_agent_v2` | `multi_agent_v2 under development false` |
| Codex config location | `ls ~/.codex/config.toml` | File exists |
| Project-local .codex | `ls .codex/config.toml` | File exists (in GSD dev repo) |
| Claude Code hooks | `cat .claude/settings.json \| grep -c hooks` | Non-zero count |
| Agent TOML files | `ls .codex/agents/*.toml` | Lists .toml agent files |
| Skill directory format | `ls .codex/skills/*/SKILL.md` | Lists SKILL.md files in subdirectories |
| Codex logs DB filename | `ls ~/.codex/logs_*.sqlite` | Expect `logs_2.sqlite` (as of 2026-04-21); Codex revs the suffix |
| Session event-type enumeration | `for f in $(find ~/.codex/sessions -name '*.jsonl' | head -100); do jq -rcs '.[] | .payload.type // .type' < "$f"; done | sort -u` | Expect the 17 event_msg types + 7 response_item types enumerated in §1.3 |

---

## 1. Capability Matrix for v1.20-Relevant Features

### 1.1 Core Infrastructure Comparison

| Capability | Claude Code | Codex CLI | Parity Impact for v1.20 |
|-----------|-------------|-----------|-------------------------|
| **Hooks (SessionStart, PostToolUse)** | YES -- 4 SessionStart hooks, 1 PostToolUse hook configured | YES (under development) -- SessionStart, Stop, PreToolUse, PostToolUse, UserPromptSubmit via hooks.json; requires codex_hooks feature flag | MEDIUM: hooks available but under development flag; GSD hook installation to Codex deferred to Phase 60 |
| **Agent/Task dispatch** | YES -- `Task()` style spawning, parallel waves | YES (different shape) -- Codex subagents/threads, parallel capable | MEDIUM: dispatch works but delegation patterns differ |
| **MCP servers** | YES -- STDIO, SSE, Streamable HTTP | YES -- STDIO, Streamable HTTP | LOW: both support MCP; minor transport gap (no SSE in Codex) |
| **Tool permissions** | YES -- `allowed-tools` frontmatter | NO -- all tools always available | LOW: GSD agents designed to work without restrictions |
| **Session log format** | JSONL in `~/.claude/projects/{encoded-path}/` | JSONL in `~/.codex/sessions/YYYY/MM/DD/` + SQLite state db | HIGH: log sensor needs format adapter |
| **Token usage data** | Per-message in `progress` events: `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`, `service_tier`, `inference_geo` | Per-turn in `token_count` events: `total_token_usage`, `last_token_usage` with `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`, `model_context_window` | MEDIUM: both provide usage data but field names and granularity differ |
| **Config format** | `settings.json` (project-scoped) | `config.toml` (global + per-project trust) | LOW: installer already handles conversion |
| **Command/skill format** | `commands/gsd/*.md` with YAML frontmatter | `skills/gsdr-*/SKILL.md` with simplified frontmatter | LOW: installer handles conversion |
| **Agent spec format** | `agents/gsdr-*.md` with YAML frontmatter | `agents/gsdr-*.toml` (TOML with developer_instructions) | LOW: installer handles conversion |
| **File manifest** | `gsd-file-manifest.json` in `.claude/` | `gsd-file-manifest.json` in `.codex/` | NONE: identical mechanism |
| **Local patches backup** | `gsdr-local-patches/` | `gsd-local-patches/` (old naming) | LOW: directory name divergence; Codex still using pre-v1.18.1 name |
| **Non-interactive execution** | `cat prompt | claude --print` | `codex exec "prompt"` | LOW: both support headless; different invocation |
| **Session state DB** | None (flat JSONL files) | `state_5.sqlite` with `threads` table tracking sessions, tokens, git state | MEDIUM: Codex has richer session metadata queryable via SQL |
| **Background agent detection** | Process list + session files | `state_5.sqlite` threads table with `source`, `cwd`, `archived` | MEDIUM: different detection mechanisms |

### 1.2 Hook Availability Detail

**Claude Code hooks configured** (from `.claude/settings.json`):

| Hook Type | Script | Purpose | v1.20 Relevance |
|-----------|--------|---------|-----------------|
| SessionStart | `gsdr-check-update.js` | Check for npm updates on session start | Update detection |
| SessionStart | `gsdr-version-check.js` | Fork version validation | Version parity |
| SessionStart | `gsdr-ci-status.js` | Pull CI status at session start | CI awareness |
| SessionStart | `gsdr-health-check.js` | Run health probes at session start | Health monitoring |
| PostToolUse | `gsdr-context-monitor.js` | Context bridge file tracking after Bash/Edit/Write/Agent/Task | Automation deferral, context tracking |
| statusLine | `gsdr-statusline.js` | Persistent status display | UX feedback |

**Codex CLI hooks available (as of v0.121.0, under development):**

| Hook Type | Codex Version Added | Discovery | Notes |
|-----------|-------------------|-----------|-------|
| SessionStart | v0.115.0 | `~/.codex/hooks.json` or `<repo>/.codex/hooks.json` | Fires at session initialization |
| SessionStop | v0.115.0 | Same as above | Fires at session end |
| UserPromptSubmit | v0.116.0 | Same as above | Fires when user submits a prompt |
| PreToolUse | v0.117.0 | Same as above | Fires before tool execution |
| PostToolUse | v0.117.0 | Same as above | Fires after tool execution |

Codex hooks require the `codex_hooks` feature flag to be enabled in `config.toml` (currently `codex_hooks = true` under `[features]`). The feature flag status is "under development" -- hooks are functional but the API may change before graduating to "stable." Global hooks live at `~/.codex/hooks.json`, project-level hooks at `<repo>/.codex/hooks.json`.

**Implication:** Codex hooks now exist but GSD does not yet install `hooks.json` for Codex. GSD hook installation to Codex is deferred to Phase 60 pending feature flag stabilization. In the interim, v1.20 features that rely on hooks must still have an alternative enforcement path for Codex. The capability matrix documents the degradation pattern: "Configure hooks.json when codex_hooks feature flag stable." For v1.20, several NEW features are hook-dependent:

| v1.20 Feature | Hook Dependency | Degradation Strategy |
|---------------|----------------|---------------------|
| Automation postlude (incident self-signal) | PostToolUse or session-end hook | Workflow step in execute-phase postlude (advisory) |
| `.continue-here` consumption/deletion | SessionStart or session-end hook | resume-work workflow gate (structural) |
| offer_next PR/CI gate | PostToolUse after verify-work | Workflow step in execute-phase (structural via workflow text) |
| Quick task branch detection | SessionStart or PostToolUse | CLI subcommand check at workflow invocation |
| Context monitor for automation deferral | PostToolUse | Not available on Codex; automation decisions must use alternative signals |

### 1.3 Session Log Format Comparison

**Claude Code JSONL** (`~/.claude/projects/{encoded-path}/{session-id}.jsonl`):
- Top-level event types: `system`, `user`, `assistant`, `progress`, `file-history-snapshot`, `summary`
- Session identification: `sessionId` field on each event
- Token usage: embedded in `progress.data.message.message.usage` with `input_tokens`, `cache_creation_input_tokens`, `cache_read_input_tokens`, `output_tokens`, `service_tier`, `inference_geo`
- File organization: one directory per project (encoded path), one file per session
- No separate session metadata record -- context is in each event

**Codex CLI JSONL** (`~/.codex/sessions/YYYY/MM/DD/rollout-{timestamp}-{session-id}.jsonl`):
- Top-level event types: `session_meta`, `event_msg`, `response_item`, `turn_context`, `compacted`
- `event_msg.payload.type` values observed: `agent_message`, `collab_agent_interaction_end`, `collab_agent_spawn_end`, `collab_close_end`, `collab_waiting_end`, `context_compacted`, `exec_command_end`, `item_completed`, `mcp_tool_call_end`, `patch_apply_end`, `task_complete`, `task_started`, `thread_rolled_back`, `token_count`, `turn_aborted`, `user_message`, `web_search_end`
- `response_item.payload.type` values observed: `custom_tool_call`, `custom_tool_call_output`, `function_call`, `function_call_output`, `message`, `reasoning`, `web_search_call`
- Added 2026-04-21 after live-corpus survey of 100 sessions / 12,204 events. Adapters must recognize these as KNOWN (counted or ignored) — classifying them as unknown triggers SENS-07 for every occurrence (Pitfall 1 in phase-60 RESEARCH.md).
- Session metadata: first event is `session_meta` with `id`, `cwd`, `source` (exec/cli), `cli_version`, `model_provider`, `base_instructions`
- Token usage: `event_msg` with `payload.type = "token_count"` containing `total_token_usage` and `last_token_usage` with `input_tokens`, `cached_input_tokens`, `output_tokens`, `reasoning_output_tokens`, `total_tokens`, `model_context_window`
- Rate limit data: included in every `token_count` event (`rate_limits.primary.used_percent`, `secondary.used_percent`)
- Tool calls: `response_item` with `payload.type = "function_call"` using `exec_command` (not separate tool names)
- File organization: date-partitioned directories, filename encodes timestamp and session ID
- Additional: SQLite database (`state_5.sqlite`) indexes all sessions with `threads` table

**Key differences for log sensor:**

| Aspect | Claude Code | Codex CLI | Sensor Impact |
|--------|-------------|-----------|---------------|
| Session-to-project mapping | Encoded path in directory name | `cwd` field in `session_meta` + `state_5.sqlite` | Need different discovery logic |
| User messages | `type: "user"` with `message.content` | `response_item` with `payload.role: "user"` AND `event_msg` with `payload.type: "user_message"` | Different extraction paths |
| Assistant messages | `type: "assistant"` with `message.content` | `response_item` with `payload.role: "assistant"` (text in `output_text` blocks) + `event_msg` with `payload.type: "agent_message"` | Different extraction paths |
| Tool calls | `assistant.message.content[].type = "tool_use"` with `name` | `response_item.payload.type = "function_call"` with `name = "exec_command"` | Codex wraps all tools as `exec_command` |
| Tool results | `assistant.message.content[].type = "tool_result"` | `response_item.payload.type = "function_call_output"` | Different schema |
| Interruptions | Inferred from message flow | `event_msg` with explicit types possible | Need behavioral heuristics |
| Direction changes | Text pattern matching on user messages | Same approach but different message extraction | Shared detection logic |
| Token usage location | Nested in `progress.data.message.message.usage` | Dedicated `token_count` event at top level | Cleaner in Codex |
| Reasoning tokens | Not broken out | `reasoning_output_tokens` field | Codex provides more granular breakdown |
| Session discovery | `ls ~/.claude/projects/{encoded-path}/*.jsonl` | `SELECT * FROM ~/.codex/state_5.sqlite WHERE cwd = ...` or date-partitioned directories | SQL is more reliable for Codex |

---

## 2. Patch Sensor Design

### 2.1 Current Patch Detection Mechanism

The installer already has a `saveLocalPatches()` function (install.js lines 2398-2433) that:

1. Reads `gsd-file-manifest.json` containing SHA256 hashes of all installed files
2. Compares current file hashes against the manifest
3. Backs up modified files to `gsdr-local-patches/` (Claude) or `gsd-local-patches/` (Codex -- old naming)
4. Writes `backup-meta.json` with timestamp, source version, and list of modified files

This runs BEFORE each install, capturing local modifications before they get overwritten. The mechanism is identical across runtimes (same code path in installer, same manifest format).

**Current state on Codex** (from `~/.codex/gsd-local-patches/backup-meta.json`):
- 17 files were backed up from version 1.17.5
- Includes workflows, references, templates, and the old monolithic `gsd-tools.js`
- This backup predates the v1.18 modularization -- the backed-up `gsd-tools.js` no longer exists

### 2.2 Patch Sensor Architecture

The patch sensor should operate at two layers:

**Layer 1: Source vs Installed Divergence Detection**

Compare npm source files (`agents/`, `get-shit-done/`, `commands/`) against installed runtime files (`.claude/`, `.codex/`) using hash comparison. This detects:
- Installer bugs (like the $HOME path doubling from v1.18.1)
- Failed installations (partial writes, permission errors)
- Stale installs (source updated but `node bin/install.js` not re-run)
- Format conversion errors (YAML-to-TOML, tool name remapping)

**Layer 2: Cross-Runtime Installed Divergence Detection**

Compare installed files across `.claude/` and `.codex/` directories. After accounting for expected format differences (YAML vs TOML, tool name remapping, path prefixes), detect:
- Missing files in one runtime
- Content divergence beyond format conversion
- Feature drift (one runtime has a capability the other lacks)

### 2.3 Patch Classification Taxonomy

| Classification | Meaning | Example | Action |
|---------------|---------|---------|--------|
| **Bug** | Unintended divergence from source -- installer error, conversion failure | `$HOME` path doubling, missing TOML escape | Fix in installer, re-install |
| **Stale** | Source updated but installed copy not refreshed | v1.19.0 discuss-phase fix not in `.codex/` install | Re-run `node bin/install.js --codex` |
| **Customization** | User intentionally modified installed files | Custom workflow tweaks, added instructions | Preserve via `gsdr-local-patches/`, flag for reapply |
| **Format-drift** | Expected format difference but content semantically diverged | TOML agent spec missing a field that exists in MD source | Check converter completeness |
| **Feature-gap** | Source file exists for one runtime but not the other | Hook script with no Codex equivalent | Document in capability matrix, implement degradation path |

### 2.4 Patch Sensor Implementation Approach

```
Sensor Input:
  - Source directories: agents/, get-shit-done/, commands/
  - Installed directories per runtime: .claude/, .codex/
  - File manifests: gsd-file-manifest.json per runtime
  - Backup directories: gsdr-local-patches/ per runtime

Sensor Output:
  - List of patches with classification, affected runtime(s), severity
  - Stale-install age (time since last install vs source changes)
  - Cross-runtime delta summary

Algorithm:
  1. For each runtime:
     a. Hash all installed GSD files
     b. Compare against manifest (detects local modifications)
     c. Compare against source (detects stale installs)
  2. Cross-runtime comparison:
     a. For each source file, check both runtime installs exist
     b. For matching files, compare after normalizing expected format differences
     c. Flag semantic divergence vs expected format conversion
  3. Classify each detected patch
  4. Return structured signal candidates
```

**Key design decision:** The patch sensor should run as a gsd-tools subcommand (`gsd patch-check` or `gsd divergence-check`), not as an automated sensor in the collect-signals pipeline. Rationale:
- Patch checking requires access to source files (the npm package), which are only present in the GSDR development repo
- For end-user installs, the manifest-based detection (`saveLocalPatches`) already runs on each install
- Automated sensing would add overhead to every collect-signals run without clear benefit

### 2.5 Patch Compatibility Checking Design

Before applying any patch (workflow fix, agent spec update, template change), the system should check:

1. **Runtime compatibility:** Does the patch use hooks, tool permissions, or other runtime-specific features? If so, does the target runtime support them?
2. **Format compatibility:** Is the patch in the correct format for the target runtime? (MD vs TOML, YAML vs simplified frontmatter)
3. **Version compatibility:** Does the patch target the current installed version, or is there a version mismatch?
4. **Cross-runtime propagation:** If the patch fixes a bug, does it need to be applied to all runtimes?

**Proposed workflow:**
```
1. Developer makes fix in source (agents/, commands/, get-shit-done/)
2. Run `node bin/install.js --local` (installs to .claude/)
3. Run `node bin/install.js --codex` (installs to .codex/)
4. Patch sensor detects if only one runtime was updated
5. Signal raised if cross-runtime divergence detected
```

The R3 finding (discuss-phase --auto recurrence) demonstrates the failure mode: fix shipped in GSDR v1.19.0, installed to `.claude/` on Apollo, but never reached `.codex/` on Dionysus, and never reached non-GSDR projects using global GSD. The patch sensor catches layer 1 (source vs installed) but cannot address the cross-project distribution gap (see section 4).

---

## 3. Log Sensor Cross-Runtime Adaptation

### 3.1 Architecture: Adapter Pattern

The log sensor (agents/gsd-log-sensor.md) currently assumes Claude Code JSONL format. For cross-runtime operation, implement a format adapter layer:

```
Log Sensor Pipeline:
  1. Session Discovery (runtime-specific)
  2. Format Adapter (normalizes to common schema)
  3. Structural Fingerprinting (runtime-agnostic)
  4. Intelligent Triage (runtime-agnostic)
  5. Progressive Context Expansion (uses adapter for reads)
  6. Signal Construction (runtime-agnostic)
```

Only stages 1, 2, and the read operations in stage 5 need runtime-specific code. Stages 3, 4, and 6 operate on normalized data.

### 3.2 Session Discovery Adapter

**Claude Code:**
```bash
ENCODED_PATH=$(pwd | sed 's|/|-|g')
LOG_DIR="$HOME/.claude/projects/${ENCODED_PATH}"
ls "$LOG_DIR"/*.jsonl
```

**Codex CLI:**
```bash
# Option A: SQLite query (more reliable)
sqlite3 ~/.codex/state_5.sqlite \
  "SELECT rollout_path FROM threads WHERE cwd = '$(pwd)' ORDER BY created_at DESC"

# Option B: Filesystem scan (no SQL dependency)
find ~/.codex/sessions/ -name "*.jsonl" -exec grep -l "\"cwd\":\"$(pwd)\"" {} \;
```

**Recommendation:** Use Option A (SQLite) for Codex. The `state_5.sqlite` database is the authoritative session index. It provides:
- `id`: Session UUID
- `rollout_path`: Path to the JSONL file
- `cwd`: Working directory (for project filtering)
- `created_at`, `updated_at`: Timestamps (for time window filtering)
- `tokens_used`: Total token count (useful for pre-filtering expensive sessions)
- `model`, `reasoning_effort`: Model configuration
- `source`: "exec" vs "cli" (interactive vs non-interactive)
- `git_sha`, `git_branch`: Git state at session time

This is RICHER than Claude Code's session discovery, which requires parsing JSONL headers.

### 3.3 Fingerprint Extraction Adapter

The `extract-session-fingerprints.py` script needs a Codex adapter. The normalized fingerprint schema should include:

| Field | Claude Code Source | Codex CLI Source |
|-------|-------------------|-----------------|
| session_id | `user.sessionId` | `session_meta.payload.id` |
| start_time | First event timestamp | `session_meta.payload.timestamp` |
| end_time | Last event timestamp | Last event timestamp |
| user_message_count | Count of `type: "user"` events | Count of `event_msg.payload.type = "user_message"` |
| assistant_message_count | Count of `type: "assistant"` events | Count of `response_item.payload.role = "assistant"` AND `response_item.payload.type = "message"` |
| tool_call_count | Count of `tool_use` content blocks | Count of `response_item.payload.type = "function_call"` |
| tool_error_count | Count of `is_error: true` tool results | Count of error indicators in `function_call_output` |
| total_tokens | Sum of `progress.data.message.message.usage` | Final `token_count.info.total_token_usage.total_tokens` |
| model | From `progress` events | From `turn_context.payload.model` or `session_meta` |
| interruptions | Inferred from message flow patterns | Same inference |
| direction_changes | Text pattern matching on user messages | Same pattern matching on extracted user text |
| reasoning_tokens | Not available | `reasoning_output_tokens` from `token_count` events |

### 3.4 Message Extraction for Progressive Deepening

**Claude Code narrow read:**
```python
# Direct: events are typed as user/assistant at top level
obj = json.loads(line)
if obj['type'] == 'user':
    text = obj['message']['content']
elif obj['type'] == 'assistant':
    content = obj['message']['content']
    text = ' '.join(c['text'] for c in content if c['type'] == 'text')
```

**Codex CLI narrow read:**
```python
# Indirect: events are wrapped in response_item or event_msg
obj = json.loads(line)
if obj['type'] == 'response_item':
    payload = obj['payload']
    if payload.get('role') == 'user':
        text = ' '.join(c['text'] for c in payload['content'] if c['type'] == 'input_text')
    elif payload.get('role') == 'assistant' and payload.get('type') == 'message':
        text = ' '.join(c['text'] for c in payload['content'] if c['type'] == 'output_text')
elif obj['type'] == 'event_msg':
    if obj['payload'].get('type') == 'agent_message':
        text = obj['payload']['message']
```

### 3.5 Codex-Specific Sensing Opportunities

Codex exposes data that Claude Code does not:

1. **Reasoning tokens:** `reasoning_output_tokens` enables detecting "thinking hard but producing little" patterns
2. **Rate limit proximity:** Every `token_count` event includes `rate_limits.primary.used_percent` and `secondary.used_percent` -- useful for detecting sessions approaching rate limits
3. **Model context window utilization:** `model_context_window` field in `token_count` enables computing how full the context is
4. **Collaboration mode:** `turn_context.payload.collaboration_mode` captures whether the session uses default/auto/manual collaboration modes
5. **Effort level:** `turn_context.payload.effort` captures reasoning effort setting per turn
6. **Session source discrimination:** `source: "exec"` vs `source: "cli"` distinguishes headless from interactive sessions -- critical for interpreting patterns differently

These should be included in the Codex adapter as additional fingerprint fields, available for Codex sessions but gracefully absent for Claude Code sessions.

---

## 4. Cross-Runtime Distribution Gap

### 4.1 The Problem

R3 from the verification analysis documents the core issue:
- GSDR v1.19.0 fix (three-mode discuss) shipped
- Fix applied to Claude Code on Apollo (local GSDR install)
- Codex CLI on Dionysus did NOT get the fix because:
  1. Non-GSDR projects use global GSD (v1.30.0 upstream) which lacks GSDR features
  2. Even GSDR-installed projects need manual `node bin/install.js` after each release
  3. Cross-machine: fix on Apollo doesn't reach Dionysus automatically

This is not just a discuss-phase problem. ANY fix shipped in GSDR is vulnerable to this gap:
- Patches to agent specs
- Workflow improvements
- Template changes
- Reference document updates

### 4.2 Approach A: Auto-Update Detection at Workflow Invocation

Since Codex lacks hooks, update detection must happen when GSD commands are invoked. The `gsdr-check-update.js` hook already does version checking for Claude Code at SessionStart. For Codex:

**Design:**
```
On any $gsdr-* skill invocation:
  1. Read VERSION file from installed get-shit-done-reflect/
  2. Compare against latest npm version (cached for 1 hour)
  3. If update available, print advisory message
  4. Optionally: compare installed file hashes against manifest
```

**Implementation path:** Add a version check preamble to the Codex AGENTS.md or to each skill's SKILL.md. This is advisory (not structural) but covers the "installation lag" dimension.

**Limitation:** This tells the user an update is available but doesn't address the "non-GSDR projects using global GSD" dimension.

### 4.3 Approach B: Post-Install Cross-Runtime Verification

After `node bin/install.js --local`, automatically check if other runtime installs exist and offer to update them:

**Design:**
```
After installing to .claude/:
  1. Check if .codex/ exists and has GSD installed
  2. If yes, compare installed versions
  3. If divergent, offer: "Codex CLI install is at v1.17.5, just installed v1.19.0 to Claude Code. Run --codex to update?"
  4. Same for .gemini/, .opencode/
```

**Implementation path:** Add a `checkCrossRuntimeParity()` function to install.js that runs after successful installation. This addresses installation lag for projects where multiple runtimes are installed.

**Limitation:** Only works within a single project. Cross-project and cross-machine gaps remain.

### 4.4 Approach C: Patch Sensor as Distribution Monitor

Extend the patch sensor (section 2) to operate as a distribution monitor:

**Design:**
```
gsd-tools subcommand: `gsd distribution-check`
  1. Enumerate all runtime install directories in current project
  2. Compare installed versions and file hashes
  3. Report divergence with actionable remediation commands
  4. Optionally: scan other projects for stale installs

Output:
  Claude Code (.claude/): v1.19.0, 137 files, current
  Codex CLI (.codex/): v1.17.5, 134 files, STALE (17 patches backed up)
  
  Remediation: node bin/install.js --codex
```

**Implementation path:** New gsd-tools subcommand. Can be invoked manually or by the artifact sensor during collect-signals.

### 4.5 Recommendation

Use Approach B (post-install cross-runtime verification) as the primary fix and Approach C (distribution monitor) as the detection layer.

- Approach A is already partially implemented via the update-check hook but only works on Claude Code and is advisory
- Approach B prevents the most common failure mode (developer installs to one runtime, forgets the other) with minimal overhead
- Approach C provides visibility into the broader distribution state and can surface signals about stale installs across the project ecosystem

Approach B should be implemented in the installer itself (Phase-level effort: low). Approach C should be a gsd-tools subcommand (Phase-level effort: medium). Together they close the R3-class distribution gap for single-project multi-runtime scenarios.

The cross-project distribution gap (non-GSDR projects using global GSD) is a v1.21 concern per MILESTONE-CONTEXT.md scope.

---

## 5. Where Parity Matters vs Graceful Degradation

### 5.1 Full Parity Required

These features must work identically on both runtimes because they affect data integrity, workflow correctness, or development quality:

| Feature | Why Parity Required |
|---------|-------------------|
| **Agent specs content** (after format conversion) | Agents must behave identically regardless of runtime |
| **Workflow text** (after format conversion) | Workflow steps must produce the same outcomes |
| **Signal schema and KB writes** | Signals must be comparable across runtimes |
| **File manifest and patch detection** | Must detect modifications on both runtimes |
| **gsd-tools CLI** | Same subcommands, same behavior |
| **State management** (STATE.md, ROADMAP.md) | State files are runtime-agnostic, stored in `.planning/` |

### 5.2 Graceful Degradation Acceptable

These features can degrade on Codex without significant impact:

| Feature | Degradation | Why Acceptable |
|---------|-------------|----------------|
| **Session start hooks** (update check, CI status, health) | Run on GSD command invocation instead | Same information, different trigger timing |
| **PostToolUse context-monitor** | Not available on Codex | Automation deferral uses alternative signals |
| **Statusline** | Not available on Codex | UX convenience, not functional |
| **Tool permissions in agent specs** | All tools available on Codex | Agents designed to work correctly without restrictions |
| **Reasoning token breakdown** | Not available on Claude Code | Codex-only metric, useful but not critical |
| **SSE transport for MCP** | Not available on Codex | STDIO covers all current MCP servers |

### 5.3 New v1.20 Features: Parity Assessment

| v1.20 Feature | Parity Strategy |
|---------------|----------------|
| **Log sensor** | Full parity via adapter pattern (section 3). Both runtimes produce JSONL with sufficient data for all sensing stages. |
| **Patch sensor** | Full parity -- manifest mechanism is runtime-agnostic. |
| **offer_next PR/CI gate** | Full parity -- workflow text enforcement, not hook-dependent. |
| **`.continue-here` lifecycle** | Full parity on resume-work workflow gate. Degraded on deletion (no post-session hook on Codex -- manual or workflow-step deletion). |
| **Automation postlude (incident self-signal)** | Degraded on Codex -- workflow-step advisory instead of hook. Acceptable because structural gates elsewhere reduce need. |
| **`/gsdr:revise-phase-scope`** | Full parity -- pure workflow command, no runtime-specific dependencies. |
| **Cross-model review** | Full parity -- actually enhanced on Codex because the user already uses Codex for cross-model review. |
| **Quick task branch detection** | Degraded on Codex -- CLI check at workflow invocation instead of hook. |
| **KB authority enforcement** | Full parity -- KB is filesystem-based, runtime-agnostic. |
| **Signal lifecycle automation** | Full parity -- gsd-tools subcommands, runtime-agnostic. |

---

## 6. Installer Cross-Runtime Mechanics

### 6.1 Current Flow

The installer (`bin/install.js`) handles four runtimes with format conversion:

1. **Runtime selection:** `--claude`, `--codex`, `--gemini`, `--opencode`, `--all`
2. **Path resolution:**
   - Claude: `~/.claude/` or `$CLAUDE_CONFIG_DIR`
   - Codex: `~/.codex/` or `$CODEX_CONFIG_DIR`
3. **Format conversion pipeline:**
   - Tool name remapping: `Read -> read_file`, `Write -> apply_patch`, `Edit -> apply_patch`, `Bash -> shell`, `Glob -> list_dir`, `Grep -> grep_files`, `WebSearch -> web_search`, `WebFetch -> null` (dropped)
   - Command prefix: `/gsdr:command-name` -> `$gsdr-command-name`
   - File references: `@~/.claude/path` -> `Read the file at ~/.codex/path`
   - Frontmatter: YAML -> simplified YAML (SKILL.md) for skills, YAML -> TOML for agents
   - Agent sandbox levels: mapped from Claude tool permissions to Codex sandbox modes
4. **AGENTS.md generation:** Writes `~/.codex/AGENTS.md` with GSD overview and capability notes
5. **Config.toml agent registration:** Appends `[agents.gsdr-*]` sections to `config.toml`
6. **Manifest + patches:** Same mechanism on both runtimes

### 6.2 Conversion Gaps Identified

| Gap | Impact | Severity |
|-----|--------|----------|
| `WebFetch` mapped to `null` (dropped) | Agent specs referencing WebFetch will have tool name removed but instruction context preserved | LOW -- rare in GSD agents |
| Codex patches dir still named `gsd-local-patches/` | Inconsistent with Claude's `gsdr-local-patches/` | LOW -- functional but confusing |
| No automated verification after conversion | Format conversion errors (e.g., TOML escaping) go undetected | MEDIUM -- patch sensor would catch this |
| Agent sandbox mapping is static | `CODEX_AGENT_SANDBOX` hardcoded at top of install.js; new agents need manual addition | LOW -- rare addition of new agents |

---

## 7. Codex CLI Runtime Details

### 7.1 Installed Version and Configuration

- **Version:** 0.121.0 (installed via npm at `~/.npm-global/bin/codex`)
- **Model:** GPT-5.4 with `model_reasoning_effort = "xhigh"` and `plan_mode_reasoning_effort = "xhigh"`
- **Personality:** "pragmatic"
- **Trust:** Multiple projects set to `trust_level = "trusted"` including GSDR
- **MCP:** Context7 configured via `[mcp_servers.context7]`

### 7.2 Session Storage Architecture

```
~/.codex/
  config.toml              # Global config
  AGENTS.md                # GSD overview (generated by installer)
  agents/                  # Agent TOML specs (22 agents)
  skills/                  # Skill SKILL.md files (30+ skills)
  get-shit-done-reflect/   # GSD runtime files (workflows, references, templates)
  
  history.jsonl            # Flat user-message-only log (all sessions)
  session_index.jsonl      # Thread name index
  state_5.sqlite           # Session state DB (threads, logs)
  logs_2.sqlite            # Structured runtime logs (tracing/debug). Codex revs this filename suffix on schema changes (`logs_1.sqlite` → `logs_2.sqlite` observed 2026-04-21, size ~1.1GB); consumers should glob `logs_*.sqlite` rather than hardcode the suffix.
  
  sessions/YYYY/MM/DD/     # Full session JSONL files (date-partitioned)
  gsd-file-manifest.json   # Install manifest (SHA256 hashes)
  gsd-local-patches/       # Backed-up user modifications
  
  memories/                # Codex memory system
  instructions.md          # User instructions (machine-level)
  auth.json                # Auth credentials
  models_cache.json        # Model list cache
  version.json             # CLI version tracking
```

### 7.3 Codex SQLite Schema Highlights

The `state_5.sqlite` `threads` table provides rich metadata:

```sql
CREATE TABLE threads (
    id TEXT PRIMARY KEY,
    rollout_path TEXT NOT NULL,     -- path to session JSONL
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    source TEXT NOT NULL,           -- "exec" or "cli"
    model_provider TEXT NOT NULL,   -- "openai"
    cwd TEXT NOT NULL,              -- working directory
    title TEXT NOT NULL,            -- session title/first message
    tokens_used INTEGER NOT NULL DEFAULT 0,
    git_sha TEXT,
    git_branch TEXT,
    git_origin_url TEXT,
    cli_version TEXT NOT NULL DEFAULT '',
    first_user_message TEXT NOT NULL DEFAULT '',
    agent_nickname TEXT,
    model TEXT,
    reasoning_effort TEXT,
    agent_path TEXT
);
```

This is strictly richer than Claude Code's session discovery mechanism. For the log sensor, querying this table provides: project filtering (via `cwd`), time window filtering (via `created_at`), token pre-filtering (via `tokens_used`), and source discrimination (via `source`).

---

## 8. Confidence Assessment

| Area | Confidence | Basis |
|------|-----------|-------|
| Hook availability comparison | HIGH | Direct inspection of `.claude/settings.json` and `~/.codex/config.toml`; Codex CLI v0.121.0 confirmed hook support remains behind the `codex_hooks` feature flag |
| Session log format comparison | HIGH | Direct parsing of actual session JSONL files from both runtimes on this machine |
| Installer cross-runtime mechanics | HIGH | Source code read of `bin/install.js` |
| Patch sensor design | MEDIUM-HIGH | Based on existing `saveLocalPatches` mechanism + patch backup evidence; classification taxonomy is proposed, not validated |
| Log sensor adapter design | MEDIUM | Format analysis is solid; actual extraction code needs testing against edge cases (very long sessions, subagent sessions, interrupted sessions) |
| Codex CLI future hook support | LOW | No public roadmap found; training data suggests feature-flag churn remains possible; current v0.121.0 confirms hooks are present but still marked under development |
| Cross-runtime distribution gap approaches | MEDIUM | Approaches are design proposals; implementation complexity estimates are rough |

---

## Beyond Formal Scope

### Codex SQLite as Sensor Data Source

The `state_5.sqlite` database is an underexplored asset. Beyond session discovery, it could enable:
- **Cross-project session analysis:** Query all threads for a time window regardless of project, then filter
- **Token efficiency baselines:** Aggregate `tokens_used` by project, model, reasoning_effort to establish cost baselines before any code-level analysis
- **Git correlation:** `git_sha` and `git_branch` per session enable correlating session quality with code state
- **Agent tracking:** `agent_path` and `agent_nickname` fields (when populated) could track which GSD agents are actually invoked

The `logs_2.sqlite` database contains structured runtime traces (log level, target, module_path, file, line, thread_id) that could be useful for debugging Codex-specific failures but is likely too low-level for the signal pipeline.

**Next audit due:** 2026-05-05 or at the next Codex version bump, whichever comes first.

### history.jsonl as Cross-Session Pattern Source

Codex's `history.jsonl` contains ALL user messages across ALL sessions with timestamps and session IDs. This is a unique data source that Claude Code lacks (Claude stores per-project, not aggregated). For cross-session pattern detection (the log sensor's stated blind spot), this file could serve as a lightweight first pass before opening individual session JSONLs.

### Codex `codex exec` as Sensor Runner

The telemetry research session (session `019d6b99`) demonstrates that Codex exec mode works well for analytical tasks:
- Used 2.8M tokens on a research task
- Successfully read files, queried databases, and produced a structured report
- The `codex exec` invocation provides a clean non-interactive interface

This suggests sensor agents could be dispatched via `codex exec` on Dionysus while Claude Code runs the orchestrator on Apollo. Cross-model sensor diversity (Claude sensors + GPT sensors) was the strongest positive pattern in the audit.

### SKILL.md vs Command .md: Invocation Friction

Codex skills use `$gsdr-command-name` syntax (dollar-sign prefix). Claude commands use `/gsdr:command-name` (slash-colon). The user has been observed using both patterns and sometimes confusing them. The capability matrix notes this but does not capture the UX friction. Consider whether the sensor spec should normalize command invocation patterns in fingerprinting.

### Codex Memories vs Claude Code Memory

Codex has a `memories/` directory (currently present at `~/.codex/memories/`). Claude Code has `MEMORY.md` per project. These are different memory architectures that could cause behavioral divergence -- an agent on Codex might "remember" something that an agent on Claude Code does not, and vice versa. The KB (`.planning/knowledge/`) is the canonical shared memory, but runtime-specific memory systems create a shadow knowledge layer. This is worth tracking but is a v1.21+ concern.

### PID Management for Concurrent Sessions

N4 from the verification analysis documents PID-based process cleanup killing the wrong project's session. For v1.20, concurrent Codex sessions (e.g., parallel phase execution via `codex exec`) need a safer identification mechanism than PIDs. The `state_5.sqlite` threads table provides session-level identification with `id`, `cwd`, and `rollout_path` -- query by `cwd` and `archived = 0` rather than scanning process lists.

### WebFetch Null Mapping

The tool mapping `WebFetch -> null` means Codex agents cannot fetch web content via the mapped tool name. They can still use `exec_command` to run `curl` or use MCP-based web fetch tools. But any agent spec that explicitly references WebFetch for documentation lookup will silently lose that instruction on Codex. The log sensor spec itself includes web search references for research -- verify this does not create a gap on Codex.
