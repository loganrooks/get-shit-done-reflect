<!-- XRT-01 discipline (Phase 58 Plan 18): this file is updated per phase close
     when hook-dependent or cross-runtime features ship. Any phase that introduces
     a feature affecting one of the capability rows below (Claude Code / Codex CLI
     / OpenCode [D] / Gemini CLI [D]) MUST update the row as part of its closeout.
     The verifier `gsd-tools verify ledger <phase>` diffs this file against the
     phase-start state and blocks closeout when the phase touched capability
     surface without refreshing the matrix. See REQUIREMENTS.md:419 (XRT-01) and
     `get-shit-done/bin/lib/verify.cjs` `verifyCapabilityMatrix` for the closeout
     check. Companion to the plan-phase assertion at `plan-phase.md` Step 4.6,
     which blocks planning on hook-dependent CONTEXT.md without a Codex path. -->

# Runtime Capability Matrix

> Reference document for GSD workflow orchestrators. Declares which features
> are available across the runtime columns tracked here. Workflows use
> `has_capability()` patterns to branch behavior based on this matrix.

> **Deprecation Notice (v1.20):** Gemini CLI and OpenCode columns are retained for
> reference but are **community-maintained and not tested by the GSD Reflect team**.
> The two supported runtimes are **Claude Code** and **Codex CLI**. The `--gemini`
> and `--opencode` installer flags, along with the legacy installer `--both` flag,
> now fail with migration guidance instead of installing unsupported runtimes. New
> workflows use binary Claude/Codex branching only -- no new `<capability_check>`
> blocks will be added for Gemini CLI or OpenCode.

## Quick Reference

| Capability | Claude Code | OpenCode [D] | Gemini CLI [D] | Codex CLI | Impact When Missing |
|------------|:-----------:|:--------:|:----------:|:---------:|---------------------|
| task_tool  |      Y      |    Y     |   Y [1]    |   Y [2]   | Sequential execution |
| hooks      |      Y      |    N     |     Y      |  Y [6]    | Skip hook features   |
| tool_permissions | Y     |    Y     |   Y [3]    |     N     | All tools available  |
| mcp_servers|      Y      |    Y     |   Y [4]    |   Y [5]   | Skip MCP features    |

> [1] Experimental, sequential only. Parallel subagent execution not yet available.
> [2] Stable multi-agent support via Codex subagents/threads. The capability exists, but the runtime-native interface differs from Claude's `Task()`-style spawning and needs Codex-specific orchestration patterns.
> [3] Via tools.core (allowlist), tools.exclude (denylist), and per-sub-agent restrictions.
> [4] STDIO, SSE, and Streamable HTTP transports. OAuth support.
> [5] STDIO and Streamable HTTP transports. OAuth support.
> [6] Conditional. Codex runtime hooks require `codex_hooks = true` in the active scope's `config.toml`. The runtime exposes SessionStart, Stop, PreToolUse, PostToolUse, and UserPromptSubmit. Phase 57.9 ships only the shared `Stop` closeout hook via `hooks.json`; unsupported or ambiguous scopes record an explicit waiver in `.planning/config.json`.
> [D] Deprecated: community-maintained, not tested by GSD Reflect team. See deprecation notice above.

## Format Reference

| Property | Claude Code | OpenCode | Gemini CLI | Codex CLI |
|----------|-------------|----------|------------|-----------|
| frontmatter | YAML | YAML (tools as map) | TOML | TOML (agents), SKILL.md (skills) |
| commands | commands/gsd/*.md | command/gsdr-*.md | commands/gsd/*.toml | skills/*/SKILL.md |
| agents | agents/gsdr-*.md | agents/gsdr-*.md | agents/gsdr-*.md | agents/*.toml (config.toml registration) |
| config | settings.json | opencode.json | settings.json | config.toml |

## Capability Details

### task_tool

Can delegate bounded subtasks to child agents for parallel execution. The exact mechanism is runtime-specific: Claude/OpenCode use explicit task-style spawning, while Codex uses native subagent workflows and agent threads.

**Available in:** Claude Code, OpenCode, Gemini CLI [1], Codex CLI [2]

> [1] Gemini CLI task_tool support is experimental and sequential only. Parallel subagent execution is not yet available -- plans within a wave execute one at a time rather than concurrently.
> [2] Codex CLI now exposes stable subagent workflows. They can run in parallel, but the control surface is thread-based rather than Claude's `Task()` call pattern.

**Degraded behavior when missing:**
Execute plans sequentially in the main context. The orchestrator reads plan files directly and executes tasks one at a time instead of spawning gsdr-executor agents per wave. Wave grouping and parallel spawning are skipped. Plans execute in dependency order, and each plan's tasks are completed before moving to the next plan.

**How orchestrators adapt:**
Use `<capability_check name="parallel_execution">` before wave execution logic. If task_tool is available, delegate via the runtime-native child-agent mechanism. Otherwise, execute plans sequentially following the execute-plan.md flow inline.

### hooks

Pre/post tool execution hooks (SessionStart, Stop, etc.). Used for automatic update checks at session start, statusline integration, and closeout postlude capture. Historical planning language may mention `SessionStop`; the live shared closeout event is `Stop`. Claude also exposes `SessionEnd` as an additional closeout surface.

**Available in:** Claude Code, Gemini CLI
**Missing in:** OpenCode
**Conditional in:** Codex CLI (requires `codex_hooks` support evidenced for the active scope's `config.toml`; GSD currently installs only the shared `Stop` closeout hook and records an explicit waiver otherwise)

**Degraded behavior when missing:**
Skip hook-dependent features entirely. No automatic update checks at session start, no statusline integration. Version checking happens on explicit GSD command invocation instead of automatically via session hooks. This is a graceful degradation -- the user still gets update notifications, just triggered differently.

**Degraded behavior when conditional (Codex CLI):**
Hooks are available but gated behind the `codex_hooks` feature flag. When support is evidenced for the active scope, Codex uses `hooks.json` (global at `~/.codex/hooks.json`, project-level at `<repo>/.codex/hooks.json`) and GSD installs the shared `Stop` closeout hook there. When support is unavailable or ambiguous, GSD skips hook installation, writes explicit waiver markers in `.planning/config.json`, and falls back to command-invocation behavior for features that would otherwise rely on automatic closeout firing. Phase 57.9 owns and ships this install-or-waiver closure.

**How orchestrators adapt:**
Use `<capability_check name="hooks_support">` before hook configuration. If hooks are available (Claude Code, Gemini CLI), configure them normally. If hooks are conditionally available (Codex CLI with evidenced `codex_hooks` support), configure only the installer-supported closeout substrate on `Stop`. If hooks are absent (OpenCode) or Codex support is unavailable/ambiguous, skip hook setup, record the degraded state explicitly, and note that update checks run on command invocation.

### tool_permissions

Granular tool allow/deny lists in agent/command frontmatter. Allows restricting which tools an agent can use (e.g., read-only agents that cannot write files).

**Available in:** Claude Code (allowed-tools list), OpenCode (permission map in YAML), Gemini CLI (tools.core allowlist, tools.exclude denylist)
**Missing in:** Codex CLI

**Degraded behavior when missing:**
All tools are available to all agents (Codex CLI). There is no mechanism to restrict tool access at the agent/command level. This is generally safe -- GSD agents are designed to operate correctly without restrictions -- but means that tool sandboxing relies on runtime-level controls rather than per-agent configuration.

**How orchestrators adapt:**
No orchestrator adaptation needed. The installer preserves tool permission frontmatter for runtimes that support it (Claude Code, OpenCode, Gemini CLI) and strips it for runtimes that do not (Codex CLI). Agents function correctly with all tools available.

### mcp_servers

MCP (Model Context Protocol) server integration. Allows agents to access external tools and services via the MCP protocol.

**Available in:** Claude Code, OpenCode, Gemini CLI, Codex CLI
**Status:** Available in both supported runtimes and the deprecated reference runtimes listed here.

**Transport support by runtime:**
- Claude Code: STDIO, SSE, Streamable HTTP
- OpenCode: STDIO, SSE, Streamable HTTP
- Gemini CLI: STDIO, SSE, Streamable HTTP. OAuth support.
- Codex CLI: STDIO, Streamable HTTP. OAuth support.

**Degraded behavior (informational):**
Both supported runtimes, plus the deprecated Gemini/OpenCode reference columns, currently support MCP servers. This section is retained for documentation purposes -- if a future runtime lacks MCP support, the degraded behavior is: MCP-dependent features are skipped, MCP tool references in agent specs are excluded during format conversion, and agents function with their built-in tools only.

**How orchestrators adapt:**
No orchestrator adaptation needed. The installer preserves MCP tool references for all runtimes. MCP server configuration is handled at the runtime config level (settings.json, opencode.json, config.toml).

## Degraded Behavior Summary

### Codex CLI (most constrained)

| Feature | Status | Adaptation |
|---------|--------|------------|
| Parallel agents (task_tool) | Y [1] | Use Codex subagents/threads rather than Claude-style `Task()` spawning |
| Hooks | Y (conditional) [6] | Install the `Stop` closeout hook when support is evidenced; otherwise record an explicit waiver and fall back to command-invocation behavior |
| Tool permissions | N | All tools available to all agents |
| MCP servers | Y | Full MCP support via STDIO and Streamable HTTP |

> [1] Codex subagents are now a stable capability, but GSD orchestrators still need Codex-specific delegation flows instead of assuming Claude-style `Task()` semantics.

Codex CLI no longer lacks parallel delegation outright. Its main remaining runtime gap is per-agent tool-permission controls. Session hooks are conditionally available via the `codex_hooks` feature flag; Phase 57.9 now ships the installer-side closeout substrate by wiring the shared `Stop` hook when support is evidenced and recording an explicit waiver when it is not. Multi-agent execution uses Codex-native subagent/thread flows rather than Claude's pane-centric task flow. GSD intentionally limits Codex installer wiring to closeout rather than promising full tool-hook parity.

### Gemini CLI

> **Deprecated:** Community-maintained, not tested by GSD Reflect team.

| Feature | Status | Adaptation |
|---------|--------|------------|
| Parallel agents (task_tool) | Y [1] | Experimental, sequential only -- no parallel subagent execution |

> [1] task_tool is available but limited. Subagents execute sequentially rather than in parallel waves.

Gemini CLI is near-full capability. It supports tool permissions (via tools.core/tools.exclude), MCP servers (STDIO, SSE, Streamable HTTP), and hooks. The only limitation is that task_tool support is experimental and sequential -- parallel subagent execution is not yet available.

### OpenCode

> **Deprecated:** Community-maintained, not tested by GSD Reflect team.

| Feature | Status | Adaptation |
|---------|--------|------------|
| Hooks | N | Update checks on GSD command invocation |

OpenCode is near-full capability. The only limitation is the lack of session hooks, which means update checks happen on explicit GSD command invocation rather than automatically at session start.

### Claude Code

Full capability -- no degradation. All features available.

## Feature Detection Convention

Workflows use a prose-based feature detection pattern. This is a **convention for LLM-read specifications**, not a programmatic API. When an LLM executes a workflow, it reads the capability check and branches behavior accordingly.

### The `has_capability()` Pattern

Workflows express capability checks using this prose pattern:

```
If has_capability("feature_name"):
  [Standard behavior when feature is available]

Else:
  [Degraded behavior when feature is missing]
```

The LLM executing the workflow reads the capability matrix (this document) to determine which features are available in its runtime, then follows the appropriate branch.

### The `<capability_check>` XML Tag

Capability checks are wrapped in `<capability_check>` XML tags for grep-ability and clear scoping:

```markdown
<capability_check name="parallel_execution">
Check the runtime capability matrix (get-shit-done-reflect/references/capability-matrix.md):

If has_capability("task_tool"):
  Delegate each plan in the wave via the runtime-native child-agent mechanism.
  Track agent progress, collect results, proceed to next wave.

Else:
  Note to user (first occurrence only): "Note: Running sequentially -- this runtime doesn't support parallel agents."
  For each plan in execution order:
  1. Read the plan file directly
  2. Execute each task in sequence
  3. Create SUMMARY.md after all tasks complete
  4. Proceed to next plan
</capability_check>
```

### Design Principles

1. **Always wrap in `<capability_check>` tags** -- enables discovery via `grep capability_check`
2. **Include a descriptive `name` attribute** -- makes checks identifiable and grep-able
3. **Standard behavior first** -- the if/else always presents the full-capability path first, then the degraded path
4. **Inform once, then adapt silently** -- on first encounter of a missing capability in a session, emit a brief note to the user. Subsequent occurrences adapt without comment
5. **Degraded paths must be functionally complete** -- degraded is not broken. The system works correctly, just differently
6. **Capability checks live in orchestrators only** -- agent specs stay clean and capability-agnostic. They describe WHAT to do, not WHETHER to do it
7. **Feature detection, not runtime detection** -- use `has_capability("task_tool")`, never `if runtime === "codex"`. Feature detection survives new runtimes being added
