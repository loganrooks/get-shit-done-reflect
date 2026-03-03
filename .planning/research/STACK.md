# Technology Stack: v1.17 Automation Loop

**Project:** GSD Reflect v1.17
**Researched:** 2026-03-02
**Confidence:** HIGH (all recommendations verified against official Claude Code hooks documentation and existing codebase patterns)

---

## Executive Summary

The v1.17 Automation Loop features -- CI sensor via `gh` CLI, hook-based auto-triggering (PostToolUse, Stop), plan checker semantic validation, and auto-reflection scheduling -- require **zero new npm dependencies**. Every capability needed is satisfied by Claude Code's expanded hooks API (17 lifecycle events as of March 2026), the GitHub CLI (`gh` v2.86.0 already installed), and extensions to existing gsd-tools.js commands.

**The key technical unlock for v1.17:** Claude Code hooks now support `PostToolUse` with tool-name matchers and `Stop` with blocking decisions (`decision: "block"` + `reason`). This means hooks can fire after specific tool completions (e.g., after Write creates a SUMMARY.md) and prevent Claude from stopping until conditions are met (e.g., signal collection hasn't run yet). Combined with the existing hook infrastructure (3 hooks in settings.json), this enables fully automated signal collection and reflection triggering without modifying workflow Markdown files.

**What NOT to add:** No scheduling libraries (cron, node-schedule), no CI API clients (octokit, @actions/github), no JSON schema validators (ajv). The zero-dependency constraint holds.

---

## Recommended Stack

### Core Framework (No Changes)

| Technology | Version | Purpose | Why Unchanged |
|------------|---------|---------|---------------|
| Node.js | >= 18.x (host: 25.2.1) | Runtime for hooks and gsd-tools.js | All new hooks are pure Node.js scripts reading JSON from stdin |
| Markdown + YAML frontmatter | N/A | Data storage, workflow specs, signal files | All config additions use existing frontmatter/JSON patterns |
| Shell scripts (bash) | N/A | KB index rebuild, hook scripts | Hook commands can invoke bash or node directly |
| Git CLI | >= 2.x | Version control + sensor data source | Already in use; no changes needed |

### New Capabilities (Zero New Dependencies)

| Capability | Technology | Integration Point | Why This Approach |
|------------|-----------|-------------------|-------------------|
| CI status querying | `gh run list --json` | New `gsd-ci-sensor.md` agent + `gsd-ci-check.js` hook | `gh` is pre-installed (v2.86.0), returns structured JSON, supports `--workflow` and `--status` filters |
| Post-execution auto-trigger | Claude Code `PostToolUse` hook | New `gsd-auto-collect.js` hook in `hooks/` | Fires after every Write/Bash; script checks if a SUMMARY.md was just written, then queues signal collection |
| Stop-gate for signal collection | Claude Code `Stop` hook | New `gsd-stop-gate.js` hook in `hooks/` | Can block Claude from stopping with `decision: "block"` + reason to trigger collection |
| Auto-reflection scheduling | State file counter + `Stop` hook logic | Counter in `.planning/config.json` or `.gsd/state.json` | Increment counter after each phase; trigger reflection when threshold reached |
| Plan checker semantic validation | `gsd-tools.js` new subcommands | Extend `verify plan-structure` in gsd-tools.js | Validate tool subcommand names against known API, config keys against manifest schema |
| CI status at session start | Claude Code `SessionStart` hook | New `gsd-ci-check.js` hook | Queries `gh run list` in background, writes result to cache file for statusline display |

---

## Detailed Technology Decisions

### 1. GitHub CLI (`gh`) for CI Integration

**Confidence:** HIGH (verified on local machine, tested with actual repo)

**Why `gh` CLI, not Octokit or GitHub REST API:**
- `gh` v2.86.0 is already installed on the development machine
- Zero dependency -- it's a standalone binary, not an npm package
- Built-in authentication via `gh auth login` (already configured)
- `--json` flag provides structured output without parsing HTML/tables
- Consistent with the zero-dependency constraint

**Verified commands for CI sensor:**

```bash
# List recent runs with structured JSON output
gh run list --limit 5 --json conclusion,status,workflowName,headBranch,createdAt,headSha,url

# Filter by branch
gh run list --branch main --limit 5 --json conclusion,status,workflowName

# Filter by workflow name
gh run list --workflow CI --limit 3 --json conclusion,status

# Filter by status (failure only)
gh run list --status failure --limit 5 --json conclusion,workflowName,headBranch,createdAt

# View specific run details
gh run view <run-id> --json conclusion,jobs
```

**Available JSON fields:** attempt, conclusion, createdAt, databaseId, displayTitle, event, headBranch, headSha, name, number, startedAt, status, updatedAt, url, workflowDatabaseId, workflowName

**Tested output (2026-03-02):**
```json
[
  {"conclusion":"success","createdAt":"2026-03-03T01:03:18Z","headBranch":"reflect-v1.16.0","status":"completed","workflowName":"Publish to npm"},
  {"conclusion":"success","createdAt":"2026-03-03T01:02:54Z","headBranch":"main","status":"completed","workflowName":"CI"},
  {"conclusion":"success","createdAt":"2026-03-02T20:58:56Z","headBranch":"main","status":"completed","workflowName":"CI"}
]
```

**Runtime availability check for non-dev machines:**
```javascript
const { execSync } = require('child_process');
try {
  execSync('gh --version', { stdio: 'ignore' });
  // gh available
} catch {
  // gh not available -- emit capability-gap signal, skip CI sensor
}
```

**Cross-runtime consideration:** `gh` CLI works regardless of AI runtime (Claude Code, Codex, Gemini CLI, OpenCode). The CI sensor is a tool-agnostic capability unlike Claude Code-specific hooks.

### 2. Claude Code PostToolUse Hook for Auto-Triggering Signal Collection

**Confidence:** HIGH (verified against official Claude Code hooks documentation at code.claude.com/docs/en/hooks, March 2026)

**Hook event:** `PostToolUse`
**Matcher:** `Write` (fires after every file write)
**Handler type:** `command` (deterministic rule, no LLM judgment needed)

**How it works:**
1. After every Write tool call, Claude Code passes JSON to the hook on stdin
2. The JSON includes `tool_input.file_path` (what was written) and `tool_response.success`
3. The hook checks if the written file matches `*-SUMMARY.md` pattern
4. If yes, it writes a state marker (e.g., `.planning/.pending-signal-collection`) with the phase number
5. The state marker is consumed by a Stop hook that prompts Claude to run signal collection

**PostToolUse JSON input (from official docs):**
```json
{
  "session_id": "abc123",
  "transcript_path": "/Users/.../.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/.../get-shit-done-reflect",
  "permission_mode": "default",
  "hook_event_name": "PostToolUse",
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/35-04-SUMMARY.md",
    "content": "---\nphase: 35\nplan: 04\n..."
  },
  "tool_response": {
    "filePath": "/path/to/35-04-SUMMARY.md",
    "success": true
  },
  "tool_use_id": "toolu_01ABC123..."
}
```

**PostToolUse decision control:**
- Cannot block (tool already ran), but can provide `additionalContext` to influence Claude's next steps
- Can return `decision: "block"` with `reason` to prompt Claude about something

**Configuration in settings.json:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/gsd-auto-collect.js"
          }
        ]
      }
    ]
  }
}
```

**Why PostToolUse on Write, not Bash:**
- SUMMARY.md creation always uses the Write tool (executors write markdown)
- Matching on Write is more specific than Bash (fewer false fires)
- The hook script does its own filtering on `file_path` pattern

**Critical design choice: PostToolUse provides feedback, Stop gates completion.**
PostToolUse cannot prevent Claude from stopping -- it can only add context. The actual gating requires a Stop hook. PostToolUse's role is to SET a state flag; Stop's role is to CHECK it.

### 3. Claude Code Stop Hook for Gating Phase Completion

**Confidence:** HIGH (verified against official docs)

**Hook event:** `Stop`
**Matcher:** None (Stop does not support matchers -- fires on every stop)
**Handler type:** `command`

**How it works:**
1. Claude finishes responding (about to stop)
2. Stop hook fires, receiving `stop_hook_active`, `last_assistant_message` on stdin
3. Hook checks for pending state markers (`.planning/.pending-signal-collection`, `.planning/.pending-reflection`)
4. If marker exists AND `stop_hook_active` is `false` (first check, not already gating):
   - Return `{"decision": "block", "reason": "Signal collection pending for phase X. Run /gsd:collect-signals X before finishing."}`
   - Claude receives the reason and continues working
5. If no markers or `stop_hook_active` is `true`: exit 0 (allow stop)

**Stop JSON input (from official docs):**
```json
{
  "session_id": "abc123",
  "transcript_path": "~/.claude/projects/.../transcript.jsonl",
  "cwd": "/Users/.../get-shit-done-reflect",
  "permission_mode": "default",
  "hook_event_name": "Stop",
  "stop_hook_active": false,
  "last_assistant_message": "Phase 35 execution complete. All 4 plans..."
}
```

**Stop decision control:**
```json
{
  "decision": "block",
  "reason": "Signal collection pending for phase 35. Please run: /gsd:collect-signals 35"
}
```

**CRITICAL: Prevent infinite loops.**
The `stop_hook_active` field is `true` when Claude is already continuing due to a Stop hook. The hook MUST check this and return exit 0 when `stop_hook_active` is true. Without this check, the hook could block indefinitely.

**Configuration in settings.json:**
```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/gsd-stop-gate.js"
          }
        ]
      }
    ]
  }
}
```

### 4. CI Sensor Implementation via `gh` CLI

**Confidence:** HIGH (tested gh commands against real repo)

**Architecture:** New agent spec `gsd-ci-sensor.md` following the existing sensor pattern (artifact-sensor, git-sensor).

**What the CI sensor detects:**

| Detection | `gh` Command | Signal Type | Severity |
|-----------|-------------|-------------|----------|
| Failed CI run on current branch | `gh run list --branch $(git branch --show-current) --status failure --limit 5 --json ...` | `deviation` | `critical` (CI red) |
| Bypassed branch protection | `gh api repos/{owner}/{repo}/branches/main/protection` + commit history analysis | `deviation` | `critical` |
| Test regression (run was green, now red) | Compare consecutive `gh run list` conclusions | `deviation` | `notable` |
| CI run never triggered (commits without runs) | Compare `git log` commits vs `gh run list` timestamps | `deviation` | `notable` |
| Consecutive CI failures (N+ in a row) | `gh run list --branch main --limit 10 --json conclusion` | `deviation` | `critical` (3+) |

**Integration with existing sensor framework:**
- Returns JSON in the same `{ sensor: 'ci', phase: N, signals: [...] }` format
- Uses `## SENSOR OUTPUT` / `## END SENSOR OUTPUT` delimiters
- Spawned by `collect-signals.md` orchestrator alongside artifact and git sensors
- Enabled/disabled via `signal_collection.sensors.ci` config

**Manifest addition:**
```json
{
  "signal_collection": {
    "sensors": {
      "ci": { "enabled": true, "model": "auto" }
    }
  }
}
```

### 5. SessionStart Hook for CI Status Warning

**Confidence:** HIGH (extends existing hook pattern from gsd-check-update.js)

**Pattern:** Identical to the existing `gsd-check-update.js` SessionStart hook:
1. Spawn background child process (`spawn` + `detached: true` + `unref()`)
2. Child runs `gh run list --branch main --limit 1 --json conclusion,workflowName`
3. Write result to `~/.claude/cache/gsd-ci-status.json`
4. Statusline hook reads cache file and displays warning if CI is red

**Cache file format:**
```json
{
  "ci_status": "failure",
  "workflow": "CI",
  "branch": "main",
  "last_run": "2026-03-02T20:58:56Z",
  "checked": 1709424000
}
```

**Statusline integration:**
Add CI status indicator to existing `gsd-statusline.js`:
```
DEV | Claude Opus 4.6 | Phase 35 | get-shit-done-reflect | CI: RED | [progressbar] 45%
```

### 6. Auto-Reflection Scheduling

**Confidence:** HIGH (pure state management, no new technology)

**Approach:** Counter-based, not time-based. Track phases completed since last reflection in a state file.

**Why counter-based, not cron/timer:**
- GSD Reflect runs in interactive sessions, not as a daemon
- Phases are the natural unit of work (1 phase = meaningful analysis unit)
- No need for `node-cron`, `node-schedule`, or OS-level timers
- Counter persists across sessions via file (unlike in-memory timers)

**State tracking:**
```json
// .planning/config.json (extend existing)
{
  "automation": {
    "auto_collect_signals": true,
    "auto_reflect": true,
    "reflect_after_phases": 3,
    "phases_since_last_reflect": 0
  }
}
```

**How it works:**
1. PostToolUse hook detects SUMMARY.md write -> increments `phases_since_last_reflect` counter
2. Stop hook checks: if counter >= `reflect_after_phases` threshold AND `auto_reflect` is true
3. If threshold met: block stop with reason "Reflection is due after {N} completed phases. Run /gsd:reflect"
4. After reflection runs, counter resets to 0

**Why NOT use milestone boundaries only:**
- v1.16 had 5 phases in 20 plans. Reflecting only at milestone end means 20+ plans between reflections.
- Counter-based allows configurable granularity: every 3 phases (default), every phase, or every 5.
- Can still trigger at milestone boundaries (count resets naturally).

### 7. Plan Checker Semantic Validation

**Confidence:** HIGH (extends existing gsd-tools.js verify command)

**What the plan checker currently validates (v1.16):**
- Frontmatter field presence (phase, plan, type, wave, etc.)
- Task element structure (files, action, verify, done)
- Dependency graph (cycles, missing references)
- Scope sanity (tasks/plan, files/plan)
- Requirement coverage mapping

**What it DOES NOT validate (v1.17 additions):**
1. Tool subcommand names referenced in plan tasks
2. Config keys referenced in plan tasks
3. File paths that should exist before execution
4. Cross-plan artifact references

**Implementation approach for semantic validation:**

**a) Tool API verification:**

Add `gsd-tools.js verify tool-refs <plan-file>` that:
1. Extracts bash command references from `<action>` and `<verify>` elements
2. Matches against known gsd-tools.js subcommands (parsed from gsd-tools.js itself)
3. Reports unknown subcommands as warnings

```javascript
// Known gsd-tools.js commands (extract from source at validation time)
const KNOWN_COMMANDS = [
  'init', 'commit', 'frontmatter', 'verify', 'roadmap',
  'phase-plan-index', 'websearch', 'state', 'config'
];
// Parse plan action blocks for: node gsd-tools.js <subcommand>
// Flag unknown subcommands
```

**b) Config key validation:**

Add `gsd-tools.js verify config-refs <plan-file>` that:
1. Extracts config.json key references from plan tasks
2. Validates against `feature-manifest.json` schema
3. Reports unknown config keys as blockers

```javascript
// Load manifest, extract all valid config paths
const manifest = JSON.parse(fs.readFileSync('get-shit-done/feature-manifest.json'));
const validKeys = extractAllConfigPaths(manifest);
// Parse plan for config.json references, validate against validKeys
```

**c) Directory/file existence pre-checks:**

Add `gsd-tools.js verify file-refs <plan-file>` that:
1. Extracts `files_modified` from plan frontmatter
2. Checks parent directories exist (warns if creating files in non-existent dirs)
3. Checks for conflicting paths across plans in the same phase

**Integration with plan checker agent:**
The plan checker agent already calls `gsd-tools.js verify plan-structure`. The new semantic validation commands are additive -- the agent calls them in sequence:

```bash
# Existing
PLAN_STRUCTURE=$(node gsd-tools.js verify plan-structure "$PLAN_PATH")
# New v1.17
TOOL_REFS=$(node gsd-tools.js verify tool-refs "$PLAN_PATH")
CONFIG_REFS=$(node gsd-tools.js verify config-refs "$PLAN_PATH")
FILE_REFS=$(node gsd-tools.js verify file-refs "$PLAN_PATH")
```

---

## Hook Registration Strategy

### Current settings.json (3 hooks)

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-check-update.js" }] },
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-version-check.js" }] }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "node .claude/hooks/gsd-statusline.js"
  }
}
```

### Proposed settings.json (7 hooks)

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-check-update.js" }] },
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-version-check.js" }] },
      { "hooks": [{ "type": "command", "command": "node .claude/hooks/gsd-ci-check.js" }] }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/gsd-auto-collect.js" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/gsd-stop-gate.js" }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "node .claude/hooks/gsd-statusline.js"
  }
}
```

**New hooks added:**
| Hook | Event | Purpose | Runtime |
|------|-------|---------|---------|
| `gsd-ci-check.js` | SessionStart | Background CI status check, writes cache | < 100ms (spawns background process) |
| `gsd-auto-collect.js` | PostToolUse (Write) | Detects SUMMARY.md writes, sets collection flag | < 10ms (file path check only) |
| `gsd-stop-gate.js` | Stop | Gates stop until signal collection/reflection runs | < 10ms (file existence check) |

**Performance budget:**
- PostToolUse fires on EVERY Write call. The hook MUST be fast (< 50ms).
- Stop fires on EVERY stop. The hook MUST be fast (< 50ms).
- SessionStart hooks already spawn background processes; adding one more is negligible.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| CI data source | `gh` CLI | Octokit REST client | Adds npm dependency; `gh` is already installed, handles auth |
| CI data source | `gh` CLI | GitHub MCP server | MCP not available in all runtimes; `gh` is runtime-agnostic |
| Auto-trigger mechanism | PostToolUse + Stop hooks | Modify execute-phase.md workflow | Workflow changes affect all runtimes; hooks are Claude Code-specific but non-invasive |
| Auto-trigger mechanism | PostToolUse + Stop hooks | SubagentStop hook on gsd-executor | Could work, but SubagentStop fires inside Task() context, not at orchestrator level |
| Reflection scheduling | Counter-based in config.json | Time-based (node-cron) | GSD runs in sessions, not as daemon; counter survives session restarts |
| Reflection scheduling | Counter-based in config.json | SessionStart hook checking time since last reflection | Time-based misses: if no sessions for a week then 5 phases in one session, only the time check fires |
| Semantic validation | Extend gsd-tools.js | Separate validation tool | Concentrated API surface; existing verify subcommand pattern; no new entrypoints |
| Config key validation | Parse feature-manifest.json | Hardcode known keys | Manifest is the source of truth; hardcoding drifts |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `octokit` or `@actions/github` npm package | Violates zero-dependency constraint; `gh` CLI provides same data | `child_process.execSync('gh run list ...')` |
| `node-cron` or `node-schedule` | System is session-based, not daemon-based; timers don't survive session restarts | Counter in config.json, checked by Stop hook |
| `ajv` or `joi` for config validation | Validation surface is small (manifest + config keys); custom code is simpler | Pattern matching against manifest schema keys |
| Prompt-type hooks | LLM judgment adds latency and non-determinism; all GSD hooks are deterministic rules | Command-type hooks with JSON stdin parsing |
| Agent-type hooks | Agent hooks spawn a full subagent; overkill for file existence checks | Command hooks with Node.js scripts |
| HTTP hooks | No external service to call; everything is local | Command hooks |
| Async hooks for PostToolUse | State flag must be set synchronously before Stop hook checks it | Synchronous command hooks (async flag NOT set) |

---

## New Files Created by v1.17

| File | Type | Purpose |
|------|------|---------|
| `hooks/gsd-ci-check.js` | Hook script | SessionStart CI status check (background) |
| `hooks/gsd-auto-collect.js` | Hook script | PostToolUse SUMMARY.md detection |
| `hooks/gsd-stop-gate.js` | Hook script | Stop gate for pending collection/reflection |
| `agents/gsd-ci-sensor.md` | Agent spec | CI sensor (parallel with artifact/git sensors) |
| `hooks/dist/gsd-ci-check.js` | Built hook | Installed copy of CI check hook |
| `hooks/dist/gsd-auto-collect.js` | Built hook | Installed copy of auto-collect hook |
| `hooks/dist/gsd-stop-gate.js` | Built hook | Installed copy of stop-gate hook |

**Modified files:**
| File | Change |
|------|--------|
| `hooks/gsd-statusline.js` | Add CI status indicator from cache |
| `get-shit-done/feature-manifest.json` | Add `automation` config schema, `ci` sensor config |
| `get-shit-done/workflows/collect-signals.md` | Add CI sensor to spawn list |
| `agents/gsd-plan-checker.md` | Add semantic validation dimensions |
| `get-shit-done/bin/gsd-tools.js` | Add `verify tool-refs`, `verify config-refs`, `verify file-refs` subcommands |
| `scripts/build-hooks.js` | Add new hooks to `HOOKS_TO_COPY` array |
| `bin/install.js` | Register new hooks in settings.json during install |

---

## Cross-Runtime Compatibility

| Feature | Claude Code | OpenCode | Gemini CLI | Codex CLI |
|---------|-------------|----------|------------|-----------|
| CI sensor (gh CLI) | Full | Full | Full | Full |
| PostToolUse hook | Full | N/A (no hooks) | N/A | N/A |
| Stop hook | Full | N/A | N/A | N/A |
| SessionStart CI check | Full | N/A | N/A | N/A |
| Auto-reflection (counter) | Full (hook-driven) | Manual only | Manual only | Manual only |
| Plan checker semantic | Full | Full | Full | Full |
| CI status in statusline | Full | N/A (no statusline) | N/A | N/A |

**Degradation strategy:** For non-Claude-Code runtimes, auto-triggering features degrade to manual invocation. CI sensor and plan checker semantic validation work everywhere because they don't depend on hooks. The capability-gap signal pattern (trace severity, not persisted) from v1.16 handles this.

---

## Version Compatibility

| Component | Required Version | Verified | Notes |
|-----------|-----------------|----------|-------|
| Node.js | >= 18.x | v25.2.1 on host | `child_process.spawn` for background, `fs` for state files |
| Git | >= 2.x | Available | Used by existing sensors |
| GitHub CLI (`gh`) | >= 2.x | v2.86.0 on host | `--json` flag, `gh run list`, `gh api` |
| Claude Code | Hooks API v2 (2026) | Current | PostToolUse, Stop, matchers, decision control |
| jq | >= 1.6 | v1.8.1 on host | Optional: hook scripts can use Node.js JSON parsing instead |
| gsd-tools.js | Current (~5,400 lines) | v1.16 | All extensions are additive |

---

## Installation

No new npm packages. Build hooks copies new files to dist:

```bash
# After creating new hook scripts:
node scripts/build-hooks.js    # Copies hooks to hooks/dist/

# After local install:
node bin/install.js --local    # Copies dist hooks to .claude/hooks/
                               # Updates .claude/settings.json with new hook registrations
```

---

## Sources

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Official documentation, verified 2026-03-02. All 17 hook events, JSON input/output schemas, decision control patterns. HIGH confidence.
- [GitHub CLI gh run list](https://cli.github.com/manual/gh_run_list) -- Official documentation. JSON output fields, filtering flags. HIGH confidence.
- [GitHub CLI gh workflow run](https://cli.github.com/manual/gh_workflow_run) -- Official documentation. Workflow dispatch. HIGH confidence.
- **Local verification:** `gh run list --limit 3 --json conclusion,status,workflowName,headBranch,createdAt` tested against `loganrooks/get-shit-done-reflect` repo, returned valid JSON. HIGH confidence.
- **Local verification:** `gh --version` returns v2.86.0, `jq --version` returns v1.8.1. HIGH confidence.
- **Existing codebase:** `hooks/gsd-check-update.js` (SessionStart background spawn pattern), `hooks/gsd-statusline.js` (cache file reading pattern), `.claude/settings.json` (hook registration pattern). HIGH confidence.
- **Existing codebase:** `agents/gsd-git-sensor.md` (sensor JSON output format), `get-shit-done/workflows/collect-signals.md` (sensor orchestration), `agents/gsd-plan-checker.md` (verification dimensions). HIGH confidence.
- **Existing codebase:** `get-shit-done/feature-manifest.json` (config schema pattern for new automation feature). HIGH confidence.
- [Claude Code Hooks Guide](https://claude.com/blog/how-to-configure-hooks) -- Anthropic blog post on hook configuration. MEDIUM confidence (blog vs docs).

---

*Stack research for: Automation Loop (v1.17)*
*Researched: 2026-03-02*
