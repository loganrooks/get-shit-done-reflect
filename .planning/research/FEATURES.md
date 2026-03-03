# Feature Landscape: Automation Loop (v1.17)

**Domain:** Developer workflow automation -- CI integration, hook-based auto-triggering, intelligent plan validation, automated reflection scheduling
**Researched:** 2026-03-02
**Overall confidence:** HIGH (system internals are well-documented; Claude Code hooks API verified against official docs)

## Context

GSD Reflect v1.16 shipped a complete signal lifecycle (detected -> triaged -> remediated -> verified) with manual commands (`/gsd:collect-signals`, `/gsd:reflect`, `/gsd:health-check`) and a plan checker agent (`gsd-plan-checker`) that validates structural completeness. The critical gap: everything requires human memory to invoke. Five consecutive CI failures went unnoticed during v1.16 development. The plan checker approved plans with wrong tool subcommands and invalid config keys.

This feature analysis focuses exclusively on what the v1.17 Automation Loop milestone needs to close the detect -> act -> verify loop automatically.

---

## Table Stakes

Features the automation loop must have to fulfill its purpose. Without these, the system remains manual and the v1.16 CI failure pattern repeats.

| # | Feature | Why Expected | Complexity | Dependencies | Notes |
|---|---------|--------------|------------|--------------|-------|
| TS-1 | **Auto-trigger signal collection after phase execution** | The whole point of signals is post-execution analysis. Requiring manual `/gsd:collect-signals` means it gets skipped. | Med | execute-phase workflow, collect-signals workflow | Modify execute-phase to call collect-signals as a postlude step after verification completes |
| TS-2 | **CI sensor (GitHub Actions status)** | v1.16 had 5 consecutive CI failures that went unnoticed. Without a CI sensor, the system cannot detect its own broken builds. | Med | `gh` CLI, devops.ci_provider config, signal-detection rules | New sensor agent (`gsd-ci-sensor`) using `gh run list --status failure` |
| TS-3 | **CI status check at session start** | If CI is red, the developer should know before writing more code. This is the minimum viable awareness. | Low | SessionStart hook, `gh` CLI, devops.ci_provider config | New hook script: `gsd-ci-status.js` in hooks/ |
| TS-4 | **Health check auto-trigger via hooks** | Health check config already has `on-resume` and `every-phase` frequency options but no hook wiring. The config schema promises it but doesn't deliver. | Med | SessionStart hook, execute-phase workflow, health_check.frequency config | Wire the existing frequencies to actual hook triggers |
| TS-5 | **Plan checker semantic validation: tool subcommand existence** | Plan checker approved a plan with `gsd-tools.js verify plan-structure` when the actual subcommand is different. Plans with wrong tool APIs waste execution context. | Med | gsd-plan-checker agent, gsd-tools.js CLI help output | Add validation dimension: parse tool invocations from plan `<action>` blocks, verify subcommands exist |
| TS-6 | **Plan checker semantic validation: config key existence** | Plans referenced config keys that don't exist (e.g., `signal_collection.sensors.ci` before it was added). | Med | gsd-plan-checker agent, feature-manifest.json, config.json schema | Add validation dimension: extract config references from plan actions, validate against manifest schema |
| TS-7 | **Fix CI wiring test failure** | `wiring-validation.test.js` checks `.claude/agents/` which doesn't exist in CI (it's a local install target). This is the immediate broken test that blocks CI from being green. | Low | tests/integration/wiring-validation.test.js | Change test to check `agents/` (npm source dir) instead of `.claude/agents/` |

## Differentiators

Features that go beyond closing the basic loop. Not strictly required but significantly improve the automation value.

| # | Feature | Value Proposition | Complexity | Dependencies | Notes |
|---|---------|-------------------|------------|--------------|-------|
| D-1 | **Auto-trigger reflection after N phases** | Reflection accumulates value over time. Auto-triggering at configurable intervals (every 3 phases, at milestone boundaries) prevents signal debt from growing. | Med | reflect workflow, execute-phase workflow, new config key: `signal_lifecycle.auto_reflect_interval` | Add interval counter to STATE.md or config, check in execute-phase postlude |
| D-2 | **CI sensor: branch protection bypass detection** | Detecting when commits bypassed branch protection (admin push) catches governance gaps. The 5 v1.16 failures were all admin-pushed. | Low | CI sensor (TS-2), `gh api` for branch protection status | Extension of CI sensor: `gh api repos/{owner}/{repo}/branches/{branch}/protection` |
| D-3 | **CI sensor: test regression detection** | Beyond pass/fail, detect when test count drops between runs (tests removed or skipped). | Med | CI sensor (TS-2), `gh run view` for step details | Parse test output from CI run logs, compare counts across runs |
| D-4 | **Plan checker semantic validation: directory existence** | Plans reference directories that don't exist yet (e.g., `get-shit-done/hooks/` when no hooks dir exists). | Low | gsd-plan-checker agent, filesystem | Add validation: check `<files>` paths have valid parent directories |
| D-5 | **Plan checker semantic validation: cross-plan dependency correctness** | Plans reference outputs from other plans that haven't been created yet, or declare `resolves_signals` for signal IDs that don't exist. | Med | gsd-plan-checker agent, signal KB index | Validate signal IDs in `resolves_signals` frontmatter against KB index |
| D-6 | **Configurable auto-trigger opt-out** | Some users may not want auto-collection or auto-reflection. Respect the existing `explicit-only` health check frequency pattern for signals too. | Low | feature-manifest.json, config.json | New config keys: `signal_collection.auto_collect` (boolean, default true), `signal_lifecycle.auto_reflect` (boolean, default false) |
| D-7 | **PostToolUse hook for SUMMARY.md writes** | Instead of modifying execute-phase workflow directly, use a PostToolUse hook on Write tool that triggers signal collection when a SUMMARY.md file is written. More decoupled. | Med | PostToolUse hook, Write tool matcher | Hook script checks if `tool_input.file_path` matches `*-SUMMARY.md`, triggers collection. But: hooks run synchronously and signal collection is heavyweight -- workflow postlude is more appropriate. |
| D-8 | **Stop hook for execute-phase completion** | Auto-trigger signal collection when the main agent stops after execute-phase, using the Stop hook. | Med | Stop hook, last_assistant_message parsing | Parse `last_assistant_message` for "Phase X: Complete" pattern to conditionally trigger. Fragile -- depends on output format. |

## Anti-Features

Features to explicitly NOT build in this milestone. These are tempting but wrong for v1.17.

| # | Anti-Feature | Why Avoid | What to Do Instead |
|---|--------------|-----------|-------------------|
| AF-1 | **Real-time CI webhook listener** | Would require a running server process. GSD is a CLI tool, not a service. Adds operational complexity far beyond the value. | Poll CI status at session start and during signal collection. `gh` CLI is sufficient. |
| AF-2 | **Auto-remediation (fix issues without human)** | Premature automation. The detect -> triage -> remediate flow needs human judgment in the loop. Auto-fixing risks masking root causes. | Keep remediation as suggestions that surface during `/gsd:plan-phase`. The human decides what to fix. |
| AF-3 | **Log sensor implementation** | Documented as M-B (Meta-Observability) scope. Requires spike for session log format and location. Mixing it into M-A creates scope creep. | Keep log sensor disabled. Build it in M-B. |
| AF-4 | **Metrics sensor / token tracking** | Also M-B scope. Token usage tracking needs infrastructure that doesn't exist yet. | Defer to M-B milestone. |
| AF-5 | **Cross-project CI monitoring** | Monitoring CI across multiple projects adds complexity without clear value for a single-developer workflow tool. | Keep CI sensor scoped to current project's repository. |
| AF-6 | **Plan checker: code quality assessment** | Plan checker validates plans, not code. Adding linting or code quality checks blurs the boundary with `gsd-verifier` (post-execution) and established CI tools. | Let CI handle code quality. Plan checker validates plan structure and semantics. |
| AF-7 | **Auto-trigger via PostToolUse hooks (for signal collection)** | PostToolUse hooks fire synchronously and block the tool response from reaching Claude. Signal collection spawns multiple subagents and takes 30-60 seconds. This would freeze the session. | Use workflow postlude in execute-phase (after verification, before "offer next"). Signal collection runs as a workflow step, not a hook side-effect. |
| AF-8 | **Continuous background CI monitoring during session** | Running `gh run list` on a timer during the session would be noisy, consume API rate limits, and provide marginal value beyond session-start check. | Check CI once at session start. Check again during signal collection. |

---

## Feature Dependencies

```
TS-7 (Fix CI wiring test)
  Independent, do first to unblock CI green status

TS-3 (CI status at session start)
  Independent, new hook script only

TS-2 (CI sensor)
  Depends on: signal-detection.md rules (need new detection type)
  Depends on: devops.ci_provider config (already exists in manifest)
  Feeds into: TS-1 (auto-trigger includes CI sensor in collection)

TS-1 (Auto-trigger signal collection)
  Depends on: execute-phase workflow (modification point)
  Benefits from: TS-2 (CI sensor available for collection)
  Feeds into: D-1 (auto-reflect interval tracking)

TS-4 (Health check auto-trigger)
  Depends on: SessionStart hook infrastructure (already exists)
  Depends on: health_check.frequency config (already exists)

TS-5 (Plan checker: tool subcommands)
  Depends on: gsd-plan-checker agent (modification)

TS-6 (Plan checker: config keys)
  Depends on: gsd-plan-checker agent (modification)
  Depends on: feature-manifest.json (read for schema validation)

D-1 (Auto-trigger reflection)
  Depends on: TS-1 (auto-trigger signal collection must work first)
  Depends on: execute-phase workflow or milestone boundary detection

D-2 (Branch protection bypass detection)
  Depends on: TS-2 (CI sensor, extension)

D-3 (Test regression detection)
  Depends on: TS-2 (CI sensor, extension)

D-4 (Plan checker: directory existence)
  Depends on: TS-5/TS-6 (plan checker enhancement infrastructure)

D-5 (Plan checker: cross-plan signal validation)
  Depends on: TS-5/TS-6 (plan checker enhancement infrastructure)

D-6 (Configurable auto-trigger opt-out)
  Depends on: TS-1, TS-4 (auto-triggers must exist before opt-out)
```

### Execution Order Implications

**Wave 1 (independent, no dependencies):**
- TS-7 (fix wiring test) -- unblocks CI immediately
- TS-3 (CI session start hook) -- standalone hook script
- TS-5, TS-6, D-4 (plan checker enhancements) -- agent modification only

**Wave 2 (depends on Wave 1 or needs new sensor):**
- TS-2 (CI sensor) -- new agent, needs signal-detection rules update
- TS-4 (health check auto-trigger) -- needs hook wiring

**Wave 3 (depends on Wave 2):**
- TS-1 (auto-trigger signal collection) -- needs execute-phase modification, benefits from CI sensor
- D-2, D-3 (CI sensor extensions) -- need CI sensor base

**Wave 4 (depends on Wave 3):**
- D-1 (auto-trigger reflection) -- needs auto-trigger collection working
- D-6 (opt-out config) -- needs auto-triggers to exist

---

## MVP Recommendation

**Must include (table stakes):**
1. **TS-7** -- Fix CI wiring test. Immediate, unblocks CI. Trivial change.
2. **TS-3** -- CI status at session start. Most visible, highest user impact. Low complexity.
3. **TS-2** -- CI sensor. Core new capability that prevents the v1.16 failure pattern.
4. **TS-1** -- Auto-trigger signal collection. Closes the primary automation gap.
5. **TS-4** -- Health check auto-trigger. Delivers on existing config promises.
6. **TS-5 + TS-6** -- Plan checker semantic validation. Prevents wasted execution context from bad plans.

**Strongly recommended differentiators:**
7. **D-1** -- Auto-trigger reflection at intervals. Prevents signal debt.
8. **D-6** -- Configurable opt-out. Respects user autonomy.

**Defer to later phases within the milestone:**
- D-2, D-3 (CI sensor extensions) -- nice but not critical for MVP loop closure
- D-4, D-5 (plan checker extensions) -- valuable but lower priority than core semantic checks
- D-7, D-8 (hook-based triggering alternatives) -- workflow postlude is simpler and better

---

## Detailed Feature Specifications

### TS-1: Auto-Trigger Signal Collection After Phase Execution

**Trigger point:** Execute-phase workflow, after `verify_phase_goal` step completes (before `offer_next`).

**Implementation approach:** Add a new step `collect_phase_signals` in the execute-phase workflow between `update_roadmap` and `offer_next`:

```
<step name="collect_phase_signals">
  Check if signal collection is enabled (signal_collection.auto_collect config, default true).
  If enabled and phase verification passed or gaps_found:
    Run signal collection for the completed phase using the collect-signals workflow.
    Report: "Signals collected: {N} persisted, {M} filtered"
  If verification is human_needed:
    Skip signal collection (wait for human input).
</step>
```

**Key decisions:**
- Run inline in execute-phase context (not a separate session) because we need the phase number context
- Skip if verification needs human input (signals from partial work are misleading)
- Report collection results in the execute-phase completion output
- Respect `signal_collection.auto_collect` config (default: true, can disable)

**Config addition to feature manifest:**
```json
"auto_collect": {
  "type": "boolean",
  "default": true,
  "description": "Automatically collect signals after phase execution"
}
```

### TS-2: CI Sensor (GitHub Actions Status)

**Architecture:** New sensor agent `gsd-ci-sensor.md` following the same pattern as `gsd-artifact-sensor.md` and `gsd-git-sensor.md`. Returns structured JSON to the signal synthesizer.

**Detection capabilities:**
1. **Failed workflow runs:** `gh run list --status failure --limit 10 --json databaseId,conclusion,headBranch,name,createdAt,headSha`
2. **Consecutive failures:** Count sequential failures without an intervening success on the current branch
3. **Recent failures correlated with phase commits:** Match failed run commit SHAs against phase commit range

**Signal types produced:**
- `ci-failure`: Individual CI failure (minor severity for 1, notable for 2-3, critical for 4+)
- `ci-consecutive-failures`: Consecutive failures pattern (critical severity)
- `ci-bypass`: Commits pushed despite CI failure (critical severity, requires D-2)

**Prerequisites:**
- `gh` CLI must be available and authenticated
- `devops.ci_provider` must be `github-actions` (graceful no-op for other providers)
- Repository must have GitHub Actions workflows

**Error handling:**
- If `gh` CLI not available: return empty signals with note "gh CLI not found"
- If not authenticated: return empty signals with note "gh auth status check failed"
- If no workflows configured: return empty signals (not an error)

**Config addition to feature manifest (under `signal_collection.sensors`):**
```json
"ci": { "enabled": true, "model": "auto" }
```

### TS-3: CI Status Check at Session Start

**Architecture:** New SessionStart hook script `gsd-ci-status.js` in hooks/ directory.

**Behavior:**
1. Read `.planning/config.json` for `devops.ci_provider`
2. If not `github-actions`, exit silently
3. Run `gh run list --branch {current-branch} --limit 1 --json conclusion,name,createdAt,url`
4. If last run conclusion is `failure`:
   - Output JSON with `additionalContext`: "WARNING: Last CI run failed ({workflow-name}, {time-ago}). Consider investigating before continuing. Run URL: {url}"
5. If `gh` CLI unavailable or not authenticated, exit silently (non-blocking)

**Hook registration (settings.json):**
```json
{
  "matcher": "startup|resume",
  "hooks": [{
    "type": "command",
    "command": "node .claude/hooks/gsd-ci-status.js",
    "timeout": 15
  }]
}
```

**Key decisions:**
- Run only on `startup` and `resume` (not `clear` or `compact` -- those are mid-session)
- 15-second timeout (gh CLI can be slow on first auth)
- Output as `additionalContext` so Claude sees it and can mention it, not just user
- Non-blocking: exit 0 always, never exit 2 (CI being red should not block the session)

### TS-4: Health Check Auto-Trigger via Hooks

**Current state:** Health check has frequency config (`milestone-only`, `on-resume`, `every-phase`, `explicit-only`) but no hook wiring. The config is read and respected only by explicit `/gsd:health-check` invocation.

**Implementation:**

For `on-resume`:
- Add SessionStart hook with matcher `resume` that checks `health_check.frequency` config
- If frequency is `on-resume`, output additionalContext suggesting Claude run health check
- This is a "nudge" approach (context injection) rather than forced execution because hooks cannot invoke slash commands

For `every-phase`:
- Add a step in execute-phase workflow (before plan execution) that checks `health_check.frequency`
- If frequency is `every-phase`, run health check inline
- Report results as part of phase execution output

**Key decision -- nudge vs force:**
- SessionStart hooks can inject context but cannot force Claude to run commands
- The `additionalContext` approach adds "Health check configured for on-resume. Consider running /gsd:health-check." to Claude's context
- Claude will typically follow the suggestion, but it is not guaranteed
- For `every-phase`, embedding in execute-phase workflow is more reliable (workflow step, not hook)

### TS-5 + TS-6: Plan Checker Semantic Validation

**New verification dimensions added to gsd-plan-checker:**

**Dimension 8: Tool API Validity**
- Parse `<action>` blocks for `gsd-tools.js` invocations
- Extract subcommand (e.g., `verify plan-structure`, `frontmatter get`, `commit`)
- Validate subcommand exists by running `node gsd-tools.js help` and parsing available commands
- Flag unknown subcommands as blockers

**Dimension 9: Config Key Validity**
- Parse `<action>` blocks for config key references (patterns: `config.{key}`, `config.json`, config field names)
- Cross-reference against feature-manifest.json schema
- Flag references to non-existent config keys as warnings
- Flag references to config keys from features not yet introduced as blockers

**Dimension 10: Directory/Path Validity (differentiator D-4, include if time permits)**
- Parse `<files>` elements for file paths
- Validate parent directories exist on disk
- Flag paths with non-existent parent directories as warnings (may be created by the plan)
- Distinguish "will be created" paths (parent exists) from "broken" paths (parent doesn't exist)

**Implementation approach:**
- Add dimensions to the existing verification flow in gsd-plan-checker.md
- Run after existing 7 dimensions (structural checks first, semantic checks second)
- Use existing issue format and severity levels
- Tool API validation: shell out to `gsd-tools.js help` for command list
- Config validation: read feature-manifest.json and parse schema keys

### D-1: Auto-Trigger Reflection at Intervals

**Mechanism:** Counter-based, checked in execute-phase workflow after signal collection.

**Config addition:**
```json
"auto_reflect_interval": {
  "type": "number",
  "default": 0,
  "min": 0,
  "max": 20,
  "description": "Auto-trigger reflection every N phases (0 = disabled)"
}
```

**State tracking:** Add `phases_since_last_reflect` counter to STATE.md or a lightweight state file.

**Trigger logic:**
1. After signal collection completes in execute-phase postlude
2. Increment `phases_since_last_reflect`
3. If counter >= `auto_reflect_interval` AND `auto_reflect_interval` > 0:
   - Run reflection workflow with project scope (not cross-project)
   - Reset counter
   - Report: "Auto-reflection triggered ({N} phases since last reflection)"

**Milestone boundary trigger:** Always trigger reflection at milestone completion regardless of interval, via complete-milestone workflow.

---

## Hook System Capabilities (Verified)

Based on official Claude Code hooks documentation (verified 2026-03-02):

**Available hook events (16 total):**
SessionStart, UserPromptSubmit, PreToolUse, PermissionRequest, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, TeammateIdle, TaskCompleted, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact, SessionEnd

**Key constraints for GSD automation:**
- SessionStart hooks can inject `additionalContext` into Claude's context (exit 0, JSON stdout)
- PostToolUse hooks fire after tool completion but cannot inject follow-up commands
- Stop hooks can prevent Claude from stopping (exit 2) but this risks infinite loops
- Hooks receive `tool_input` and `tool_response` on PostToolUse (can inspect what was written)
- Hooks run synchronously -- heavyweight operations (signal collection) should NOT be hooks
- `async: true` is available for command hooks (runs in background, non-blocking)
- SubagentStop hooks fire when subagents complete, can inspect `last_assistant_message`

**Implication for auto-triggering approach:**
- Signal collection should be a workflow postlude step, NOT a hook
- CI status check at session start is ideal for hooks (fast, non-blocking)
- Health check nudge via SessionStart hook is appropriate (context injection)
- Health check enforcement via execute-phase workflow step is more reliable

## Claude Code Hook Input Available for Decision-Making

| Hook Event | Key Fields Available | Useful For |
|------------|---------------------|------------|
| SessionStart | `source` (startup/resume/clear/compact), `model` | CI status check, health check nudge |
| PostToolUse (Write) | `tool_input.file_path`, `tool_response.success` | Detecting SUMMARY.md writes (but not recommended for triggering) |
| SubagentStop | `agent_type`, `last_assistant_message` | Detecting executor completion (fragile, depends on output format) |
| Stop | `last_assistant_message`, `stop_hook_active` | Detecting execute-phase completion (fragile) |

**Recommendation:** Use workflow modification (adding steps to execute-phase.md) for reliable triggering. Use hooks only for lightweight, non-blocking checks (CI status, health check nudge). The workflow approach is deterministic; the hook approach depends on parsing free-text output.

---

## Sources

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Verified 2026-03-02, official documentation for all 16 hook events, matchers, input/output schemas
- [Claude Code Settings](https://code.claude.com/docs/en/settings) -- Hook configuration locations and scope
- [GitHub CLI `gh run list`](https://cli.github.com/manual/gh_run_list) -- CI status querying
- [GitHub Blog: Work with GitHub Actions in your terminal with GitHub CLI](https://github.blog/news-insights/product-news/work-with-github-actions-in-your-terminal-with-github-cli/) -- `gh run` subcommands
- Internal: `.claude/settings.json` -- existing hook configuration (SessionStart: update check, version check; StatusLine: statusline)
- Internal: `get-shit-done/workflows/execute-phase.md` -- current execution flow, modification points
- Internal: `get-shit-done/workflows/collect-signals.md` -- signal collection orchestration
- Internal: `get-shit-done/workflows/reflect.md` -- reflection workflow with trigger modes
- Internal: `agents/gsd-plan-checker.md` -- current 7 verification dimensions
- Internal: `get-shit-done/feature-manifest.json` -- config schemas, sensor configuration
- Internal: `.planning/deliberations/v1.17-plus-roadmap-deliberation.md` -- milestone scope and signals driving M-A
