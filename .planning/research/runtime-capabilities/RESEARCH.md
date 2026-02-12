# Runtime Capability Matrix Verification - Research

**Researched:** 2026-02-12
**Domain:** OpenAI Codex CLI and Google Gemini CLI runtime capabilities
**Overall Confidence:** MEDIUM (significant evolution since matrix was authored; several claims now stale)

## Summary

This research verifies 8 cells in GSD's capability matrix (4 capabilities x 2 runtimes) against current official documentation, changelogs, and GitHub issues as of February 2026. The investigation reveals that **4 of 8 cells are stale or incorrect** -- the matrix significantly understates both Codex CLI and Gemini CLI capabilities.

The most impactful finding: Codex CLI now supports MCP servers (confirmed via official docs), and Gemini CLI now supports MCP servers (confirmed via official docs with rich transport options). Both capabilities are documented as N in the current matrix. Additionally, Codex CLI has nascent hooks support (the `notify` system), and Gemini CLI has a mature tool restriction system (`tools.core`, `tools.allowed`, `tools.exclude`) that constitutes meaningful tool_permissions.

Gemini CLI's subagent support (task_tool = Y) is confirmed but with important caveats: it is experimental, operates in YOLO mode, and parallel subagent execution is not yet available (issue #17749 tracks this, 0/4 subtasks complete as of Feb 2026). Codex CLI's subagent support remains under active development and is NOT available in the stable release.

**Primary recommendation:** Update the capability matrix for 4 cells immediately (HIGH/MEDIUM confidence changes). Schedule a hands-on spike for 2 cells where the evidence is mixed (Codex hooks, Codex task_tool). Gemini CLI task_tool should be annotated as "Y (experimental, sequential only)" until parallel execution lands.

## Capability Verification Matrix

### Current Matrix (claimed)

| Capability       | Codex CLI (claimed) | Gemini CLI (claimed) |
|------------------|:-------------------:|:--------------------:|
| task_tool        |          N          |          Y           |
| hooks            |          N          |          Y           |
| tool_permissions |          N          |          N           |
| mcp_servers      |          N          |          N           |

### Verified Matrix (recommended update)

| Capability       | Codex CLI (verified) | Gemini CLI (verified) |
|------------------|:--------------------:|:---------------------:|
| task_tool        |     N (confirmed)    |   Y (experimental)    |
| hooks            |     N* (partial)     |   Y (confirmed)       |
| tool_permissions |     N (confirmed)    |   Y** (STALE - was N) |
| mcp_servers      |  Y*** (STALE - was N)|   Y*** (STALE - was N) |

**Legend:**
- N* = Codex has `notify` config (single event type), not full hooks system
- Y** = Gemini has `tools.core`, `tools.allowed`, `tools.exclude` -- granular tool restriction
- Y*** = Both runtimes now have full MCP server support

### Cell-by-Cell Verification

| # | Runtime | Capability | Matrix Claim | Verified Value | Status | Confidence |
|---|---------|------------|:------------:|:--------------:|--------|:----------:|
| 1 | Codex CLI | task_tool | N | N | CONFIRMED | HIGH |
| 2 | Codex CLI | hooks | N | N* (partial) | CONFIRMED with nuance | MEDIUM |
| 3 | Codex CLI | tool_permissions | N | N | CONFIRMED | HIGH |
| 4 | Codex CLI | mcp_servers | N | **Y** | **STALE** | HIGH |
| 5 | Gemini CLI | task_tool | Y | Y (experimental) | CONFIRMED with caveats | MEDIUM |
| 6 | Gemini CLI | hooks | Y | Y | CONFIRMED | HIGH |
| 7 | Gemini CLI | tool_permissions | N | **Y** | **STALE** | HIGH |
| 8 | Gemini CLI | mcp_servers | N | **Y** | **STALE** | HIGH |

**Stale cells requiring matrix update: 4, 7, 8 (HIGH confidence -- update immediately)**
**Cells needing annotation update: 2, 5 (MEDIUM confidence -- add caveats)**
**Confirmed cells: 1, 3, 6 (no change needed)**

---

## Codex CLI Detailed Findings

### Cell 1: task_tool (Subagent Spawning) -- CONFIRMED N

**Matrix claim: N -- Verdict: CONFIRMED (N)**
**Confidence: HIGH**

Codex CLI does NOT have a stable, shipping subagent/task spawning system as of v0.99.0 (February 11, 2026).

**Evidence:**
- GitHub issue #2604 (opened Aug 23, 2025) is the primary tracking issue for subagent support. As of Jan 25, 2026, an OpenAI maintainer confirmed it is "under active development" but not released. (Source: [Issue #2604](https://github.com/openai/codex/issues/2604))
- GitHub issue #9846 (Jan 25, 2026) was closed as duplicate of #2604 with comment: "We're tracking this feature in #2604. This feature is under active development." (Source: [Issue #9846](https://github.com/openai/codex/issues/9846))
- PR #3655 implementing multi-subagent orchestration was submitted Sept 15, 2025 but remains closed/unmerged. (Source: [PR #3655](https://github.com/openai/codex/pull/3655))
- Issue #9748 (Jan 23, 2026) reports a bug with concurrent subagent launching draining Pro plan quota. An OpenAI contributor clarified the feature "hasn't been officially announced for experimental use" and remains "under active development." (Source: [Issue #9748](https://github.com/openai/codex/issues/9748))
- The official Codex CLI features page does NOT document subagent support. (Source: [Codex CLI Features](https://developers.openai.com/codex/cli/features/))
- The v0.99.0 changelog (Feb 11, 2026) does not include subagent spawning in its release notes. (Source: [Codex Changelog](https://developers.openai.com/codex/changelog/))

**What about "collaboration" mode?** Codex has a "collaboration" feature for multi-agent workflows, but this operates through the Agents SDK + MCP server pattern (exposing Codex as an MCP server), NOT through native Task() spawning within the CLI itself. This is an external orchestration pattern, not an internal capability.

**What about the `child_agents_md` feature flag?** This flag relates to AGENTS.md file scope and precedence handling, NOT to spawning child agent processes. It enhances how Codex interprets AGENTS.md documentation across directories.

**GSD impact:** Codex CLI correctly remains in "sequential execution" degraded mode for plan execution. No change needed.

### Cell 2: hooks -- CONFIRMED N (with nuance)

**Matrix claim: N -- Verdict: N (partial capability exists but does not meet GSD's hooks definition)**
**Confidence: MEDIUM**

Codex CLI has a minimal `notify` configuration that fires an external program on specific events, but this is NOT equivalent to the hooks system that GSD uses (SessionStart, BeforeTool, AfterTool, etc.).

**Evidence:**
- The `notify` config key runs an external program when Codex completes a task. Configured as: `notify = ["notify-send", "Codex"]` in config.toml. (Source: [Advanced Configuration](https://developers.openai.com/codex/config-advanced/))
- Currently supports only the `agent-turn-complete` event type. An OpenAI maintainer confirmed this limitation in Discussion #2150 (Nov 30, 2025). (Source: [Discussion #2150](https://github.com/openai/codex/discussions/2150))
- GitHub Issue #2109 requests full event hooks. Community members noted competing tools (Claude Code, Gemini CLI) already have this. (Source: [Issue #2109](https://github.com/openai/codex/issues/2109))
- A reference to PR #11067 (Feb 8, 2026) suggests expanded hooks functionality may be forthcoming, but this is unconfirmed. (Source: [Discussion #2150](https://github.com/openai/codex/discussions/2150))
- The v0.99.0 changelog mentions "Add hooks implementation and wire up to `notify`" (#9691) -- but the detailed changelog does not list hooks as a shipped feature, and the features documentation does not document a hooks system.

**Why this remains N for GSD purposes:** GSD's hooks capability requires SessionStart hooks (for update checks at session start) and potentially BeforeTool/AfterTool hooks. Codex's `notify` only fires on `agent-turn-complete`, which is insufficient for GSD's use case. The `notify` system could potentially be used for post-task notifications, but that does not constitute the hooks capability GSD relies on.

**Recommendation:** Keep as N in the matrix. Add a note: "Has `notify` config for agent-turn-complete events; does not support SessionStart or tool lifecycle hooks."

### Cell 3: tool_permissions -- CONFIRMED N

**Matrix claim: N -- Verdict: CONFIRMED (N)**
**Confidence: HIGH**

Codex CLI does NOT support per-agent/per-skill granular tool allow/deny lists in the way GSD defines tool_permissions.

**Evidence:**
- The official security docs describe three permission layers: sandbox modes (read-only, workspace-write, danger-full-access), approval policies (on-request, untrusted, never), and enterprise requirements.toml constraints. None of these provide per-agent tool restriction. (Source: [Codex Security](https://developers.openai.com/codex/security/))
- MCP server configuration supports `enabled_tools` and `disabled_tools` per MCP server, but these restrict which MCP tools are exposed, NOT which built-in tools a specific agent can use. (Source: [Codex MCP](https://developers.openai.com/codex/mcp/))
- The Skills system has `allow_implicit_invocation` (controls whether Codex can auto-invoke a skill) but no tool restriction lists per skill. (Source: [Codex Skills](https://developers.openai.com/codex/skills/))
- The config reference does NOT include per-agent tool permission settings. (Source: [Codex Config Reference](https://developers.openai.com/codex/config-reference/))

**GSD impact:** Installer correctly strips tool permission frontmatter for Codex CLI format conversion. No change needed.

### Cell 4: mcp_servers -- **STALE** (was N, should be Y)

**Matrix claim: N -- Verdict: Y (STALE -- must update)**
**Confidence: HIGH**

Codex CLI has FULL MCP server support. This is a well-documented, first-class feature with dedicated documentation, CLI commands, and multiple transport types.

**Evidence:**
- Official MCP documentation page exists: [developers.openai.com/codex/mcp/](https://developers.openai.com/codex/mcp/)
- Supports STDIO servers (local processes via command) and Streamable HTTP servers (network endpoints)
- Configuration via `~/.codex/config.toml` under `[mcp_servers]` section, or via `codex mcp add` CLI commands
- Project-scoped configuration supported at `.codex/config.toml`
- Per-server controls: `enabled_tools`, `disabled_tools`, `startup_timeout_sec`, `tool_timeout_sec`, `required` flag
- OAuth authentication: `codex mcp login <server-name>` for servers requiring OAuth
- Bearer token auth for HTTP servers
- v0.97.0 (Feb 5, 2026) added session-scoped "Allow and remember" for MCP/App tool approvals
- MCP action caching implemented for reduced load latency
- Codex can also BE an MCP server (expose itself for Agents SDK orchestration)
- Source: [Codex MCP Docs](https://developers.openai.com/codex/mcp/), [Codex Config Reference](https://developers.openai.com/codex/config-reference/), [Codex Changelog](https://developers.openai.com/codex/changelog/)

**GSD impact:** This is a significant capability upgrade. The installer should NOT strip MCP tool references for Codex CLI format conversion. MCP-dependent GSD features (like Context7 queries) could be available in Codex CLI. The capability_check for MCP should now include Codex CLI in the supported list.

---

## Gemini CLI Detailed Findings

### Cell 5: task_tool (Subagent Spawning) -- CONFIRMED Y (experimental)

**Matrix claim: Y -- Verdict: Y (confirmed, but with important caveats)**
**Confidence: MEDIUM**

Gemini CLI has subagent support, but it is explicitly marked as **experimental**, operates in **YOLO mode** (no per-step user confirmation), and parallel execution is **NOT yet available**.

**Evidence:**
- Official sub-agents documentation: [geminicli.com/docs/core/subagents/](https://geminicli.com/docs/core/subagents/)
- Sub-agents are "experimental" and must be explicitly enabled in settings.json
- Built-in sub-agents: Codebase Investigator, CLI Help Agent, Generalist Agent
- Custom agents via `.gemini/agents/*.md` or `~/.gemini/agents/*.md` with YAML frontmatter
- Sub-agents support: isolated system prompts, restricted/specialized tool access, independent context windows, max turns (default 15), timeout (default 5 min)
- The `delegate_to_agent` tool is the spawning mechanism (registered as a core tool) -- Source: [Issue #16994](https://github.com/google-gemini/gemini-cli/issues/16994)
- Parallel execution is NOT yet available: Issue #17749 (open, 0/4 subtasks complete, maintainer-only) tracks this -- Source: [Issue #17749](https://github.com/google-gemini/gemini-cli/issues/17749)
- Issue #14963 was closed as "completed" (Jan 28, 2026) but this appears to refer to basic sequential subagent support, not parallel execution -- Source: [Issue #14963](https://github.com/google-gemini/gemini-cli/issues/14963)

**YOLO mode concern:** Sub-agents execute tools without individual user confirmation. This means GSD workflows running through subagents bypass the normal approval flow. For GSD's use case (spawning gsd-executor agents), this is actually acceptable since GSD plans are pre-approved during planning.

**Parallel execution gap:** GSD's wave-based execution assumes Task() calls run concurrently. In Gemini CLI, subagents currently execute sequentially (the main agent calls delegate_to_agent, waits for completion, then calls the next). This means Gemini CLI's task_tool = Y is functionally closer to sequential execution for multi-plan waves, though single-task delegation works.

**Recommendation:** Keep as Y but add annotation: "Y (experimental, sequential only). Parallel subagent execution tracked in issue #17749. YOLO mode -- no per-step confirmation in subagents."

### Cell 6: hooks -- CONFIRMED Y

**Matrix claim: Y -- Verdict: Y (confirmed, mature system)**
**Confidence: HIGH**

Gemini CLI has a comprehensive, well-documented hooks system with 10+ lifecycle events.

**Evidence:**
- Official hooks documentation: [geminicli.com/docs/hooks/](https://geminicli.com/docs/hooks/)
- Official hooks reference: [geminicli.com/docs/hooks/reference/](https://geminicli.com/docs/hooks/reference/)
- Official Google blog post: [Tailor Gemini CLI to your workflow with hooks](https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/)
- Supported events: SessionStart, SessionEnd, BeforeAgent, AfterAgent, BeforeModel, AfterModel, BeforeToolSelection, BeforeTool, AfterTool, PreCompress, Notification
- Hooks enabled by default as of v0.26.0+
- Configuration in settings.json under `hooks` object
- Hooks execute synchronously (CLI waits for completion)
- Security: project-level hooks are fingerprinted to detect untrusted changes
- Stable API: designed to remain compatible across SDK updates

**GSD impact:** Confirmed. GSD's SessionStart hook for update checks and tool lifecycle hooks are fully supported. No change needed.

### Cell 7: tool_permissions -- **STALE** (was N, should be Y)

**Matrix claim: N -- Verdict: Y (STALE -- must update)**
**Confidence: HIGH**

Gemini CLI has a mature tool restriction system that provides granular tool allow/deny capabilities.

**Evidence:**
- `tools.core` (array): Restricts built-in tools via allowlist. When set, ONLY listed tools are available. Supports prefix matching (e.g., `"run_shell_command(git)"`). Source: [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html)
- `tools.exclude` (array): Denylist that takes precedence over allowlists. Explicitly blocks named tools from discovery. Source: [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html)
- `tools.allowed` (array): Bypasses confirmation dialog for trusted tools. Source: [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html)
- Precedence: `tools.exclude` is always checked first, overriding `tools.core` and `tools.allowed`. Source: [Issue #15428](https://github.com/google-gemini/gemini-cli/issues/15428)
- Custom sub-agents also support restricted tool access via their YAML frontmatter configuration.
- MCP servers have `includeTools` and `excludeTools` per server.

**Important distinction:** These are session-level or settings-level restrictions, not per-command/per-agent frontmatter restrictions like Claude Code's `allowed-tools` list. However, sub-agent definitions DO support per-agent tool restriction via their markdown configuration. This is functionally equivalent to GSD's tool_permissions concept.

**GSD impact:** The installer should NOT strip tool permission frontmatter for Gemini CLI format conversion (at minimum for sub-agent definitions). GSD agent specs that restrict tools (e.g., read-only researchers) could have those restrictions honored in Gemini CLI.

### Cell 8: mcp_servers -- **STALE** (was N, should be Y)

**Matrix claim: N -- Verdict: Y (STALE -- must update)**
**Confidence: HIGH**

Gemini CLI has comprehensive MCP server support with multiple transport types, OAuth, and rich content support.

**Evidence:**
- Official MCP documentation: [geminicli.com/docs/tools/mcp-server/](https://geminicli.com/docs/tools/mcp-server/)
- GitHub docs: [github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)
- Official Google blog: [Gemini CLI + FastMCP integration](https://developers.googleblog.com/gemini-cli-fastmcp-simplifying-mcp-server-development/)
- Three transport types: STDIO (subprocess via stdin/stdout), SSE (Server-Sent Events), Streamable HTTP
- Configuration in settings.json under `mcpServers` object
- Per-server controls: `includeTools`, `excludeTools`, `trust`, `timeout`, OAuth, environment variables
- Rich content support: text, images, audio, binary data in tool responses
- Resource discovery: automatic detection of MCP server resources, prompts, and tools
- MCP prompts exposed as slash commands
- Security: environment variable redaction by default for STDIO servers

**GSD impact:** This is a significant capability upgrade. MCP-dependent features (like Context7 queries via MCP) could work in Gemini CLI. The installer should preserve MCP tool references in Gemini CLI format conversion. The capability_check for MCP should include Gemini CLI.

---

## Recommended Matrix Update

### Updated Quick Reference

| Capability       | Claude Code | OpenCode | Gemini CLI | Codex CLI | Impact When Missing |
|------------------|:-----------:|:--------:|:----------:|:---------:|---------------------|
| task_tool        |      Y      |    Y     |   Y [1]    |     N     | Sequential execution |
| hooks            |      Y      |    N     |     Y      |     N [2] | Skip hook features   |
| tool_permissions |      Y      |    Y     |   Y [3]    |     N     | All tools available  |
| mcp_servers      |      Y      |    Y     |   Y [4]    |   Y [5]   | Skip MCP features    |

**Notes:**
1. Gemini CLI: Experimental, sequential only. Parallel subagent execution not yet available (tracked: google-gemini/gemini-cli#17749). Sub-agents run in YOLO mode.
2. Codex CLI: Has `notify` config for `agent-turn-complete` events only. Does not support SessionStart or tool lifecycle hooks required by GSD.
3. Gemini CLI: Via `tools.core` (allowlist), `tools.exclude` (denylist), and per-sub-agent tool restrictions in agent YAML frontmatter. Session/settings-level, not per-command frontmatter.
4. Gemini CLI: STDIO, SSE, and Streamable HTTP transports. OAuth support. Rich content.
5. Codex CLI: STDIO and Streamable HTTP transports. OAuth support. Per-server tool allow/deny lists. Can also serve AS an MCP server.

### Changes from Current Matrix

| Cell | Old | New | Type | Confidence |
|------|:---:|:---:|------|:----------:|
| Gemini CLI: tool_permissions | N | Y | STALE (upgrade) | HIGH |
| Gemini CLI: mcp_servers | N | Y | STALE (upgrade) | HIGH |
| Codex CLI: mcp_servers | N | Y | STALE (upgrade) | HIGH |
| Gemini CLI: task_tool | Y | Y [annotated] | ANNOTATION needed | MEDIUM |

### Installer Impact

The following installer behaviors need updating based on matrix corrections:

| Runtime | Current Behavior | Required Change |
|---------|-----------------|-----------------|
| Codex CLI | Strips MCP tool references | **Stop stripping** -- Codex supports MCP |
| Gemini CLI | Strips MCP tool references | **Stop stripping** -- Gemini supports MCP |
| Gemini CLI | Strips tool permission frontmatter | **Stop stripping** -- Gemini has tool restrictions |

### Degraded Behavior Summary Updates

**Codex CLI** should be updated from "most constrained" to reflect MCP support:

| Feature | Old Status | New Status | Adaptation |
|---------|:----------:|:----------:|------------|
| Parallel agents (task_tool) | N | N | Sequential plan execution (unchanged) |
| Hooks | N | N | Update checks on command invocation (unchanged) |
| Tool permissions | N | N | All tools available (unchanged) |
| MCP servers | N | **Y** | **MCP features available** |

**Gemini CLI** should be updated to reflect tool_permissions and MCP:

| Feature | Old Status | New Status | Adaptation |
|---------|:----------:|:----------:|------------|
| Tool permissions | N | **Y** | **Tool restrictions honored** |
| MCP servers | N | **Y** | **MCP features available** |

---

## Open Questions / Gaps Requiring Spike

### 1. Codex CLI Hooks Evolution (MEDIUM priority)

**What we know:** PR #9691 "Add hooks implementation and wire up to notify" was referenced in the v0.99.0 changelog metadata. The features page and advanced config do not document a full hooks system.

**What is unclear:** Whether the hooks implementation in PR #9691 shipped in v0.99.0 as a hidden/undocumented feature, or whether it was infrastructure work that will ship in a future release.

**Recommendation:** LOW priority spike -- monitor Codex releases for the next 30 days. If hooks ship with SessionStart support, update matrix to Y. For now, keep as N.

### 2. Codex CLI Subagent Timeline (LOW priority)

**What we know:** Feature is "under active development" per OpenAI maintainer (Jan 25, 2026). Rate-limiting bugs exist (issue #9748). No official release date.

**What is unclear:** Whether subagent support will ship in the next 1-3 months and what form it will take.

**Recommendation:** No spike needed. Monitor Codex changelog. The matrix correctly reflects current state (N).

### 3. Gemini CLI tool_permissions Mapping to GSD Frontmatter (HIGH priority)

**What we know:** Gemini CLI has `tools.core`, `tools.exclude`, and per-sub-agent tool restrictions. GSD currently defines tool_permissions as per-agent `allowed-tools` in command/agent frontmatter.

**What is unclear:** Whether the installer can map GSD's per-agent `allowed-tools` to Gemini CLI's sub-agent tool restriction format during format conversion. The mechanism exists but the mapping may require design work.

**Recommendation:** Include as scope item in gap-closing work. The installer's Gemini format converter needs to be reviewed/updated.

### 4. Gemini CLI Parallel Subagent Timeline (MEDIUM priority)

**What we know:** Issue #17749 is open with 0/4 subtasks complete. Marked as "maintainer only."

**What is unclear:** When parallel execution will ship. GSD's wave-based execution benefits from parallel spawning.

**Recommendation:** No spike needed. GSD workflows already handle sequential fallback via capability_check. The annotation on task_tool = Y should note this limitation.

### 5. Codex CLI MCP Configuration Format for Installer (HIGH priority)

**What we know:** Codex uses TOML (`config.toml`) for MCP server configuration. GSD's current installer strips MCP references for Codex format.

**What is unclear:** Exact format mapping from GSD's MCP tool references to Codex's config.toml MCP server declarations. This needs design work in the installer.

**Recommendation:** Include as scope item in gap-closing work. The installer needs an MCP configuration generator for Codex CLI.

---

## State of the Art

| Old Understanding | Current Reality | When Changed | Impact |
|-------------------|----------------|--------------|--------|
| Codex CLI has no MCP support | Full MCP support with STDIO + HTTP | At least by v0.97.0 (Feb 5, 2026) | Must stop stripping MCP refs in installer |
| Gemini CLI has no MCP support | Full MCP support with STDIO + SSE + HTTP | Documented in official docs (date unclear) | Must stop stripping MCP refs in installer |
| Gemini CLI has no tool_permissions | Has tools.core, tools.exclude, per-agent restrictions | Documented in official docs | Must stop stripping tool permissions |
| Codex CLI has no hooks | Has `notify` (single event) | Present in current docs | Not sufficient for GSD -- keep as N |
| Gemini CLI subagents are production-ready | Experimental, sequential only, YOLO mode | Current docs explicitly state "experimental" | Add caveats to matrix annotation |

---

## Sources

### Primary (HIGH confidence)
- [Codex MCP Documentation](https://developers.openai.com/codex/mcp/) -- Official docs confirming MCP support with transport types, auth, config
- [Codex Config Reference](https://developers.openai.com/codex/config-reference/) -- Official config reference listing MCP server settings
- [Codex Advanced Configuration](https://developers.openai.com/codex/config-advanced/) -- Notify/hooks system documentation
- [Codex Security](https://developers.openai.com/codex/security/) -- Sandbox modes, approval policies, enterprise requirements
- [Codex Changelog](https://developers.openai.com/codex/changelog/) -- Version history through v0.99.0 (Feb 11, 2026)
- [Codex Skills](https://developers.openai.com/codex/skills/) -- Skill system without per-agent tool restrictions
- [Gemini CLI Sub-agents](https://geminicli.com/docs/core/subagents/) -- Official experimental subagent documentation
- [Gemini CLI MCP Server](https://geminicli.com/docs/tools/mcp-server/) -- Official MCP integration documentation
- [Gemini CLI Hooks](https://geminicli.com/docs/hooks/) -- Official hooks documentation
- [Gemini CLI Hooks Reference](https://geminicli.com/docs/hooks/reference/) -- Complete hook event reference
- [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html) -- Full config reference with tools.core, tools.exclude

### Secondary (MEDIUM confidence)
- [Codex Issue #2604](https://github.com/openai/codex/issues/2604) -- Primary subagent tracking issue (OpenAI maintainer responses)
- [Codex Issue #9846](https://github.com/openai/codex/issues/9846) -- Duplicate subagent request, maintainer confirmed "under active development"
- [Codex Issue #9748](https://github.com/openai/codex/issues/9748) -- Subagent quota bug, maintainer confirmed "not yet released"
- [Codex Discussion #2150](https://github.com/openai/codex/discussions/2150) -- Hooks feature request, maintainer confirmed notify limitation
- [Gemini CLI Issue #14963](https://github.com/google-gemini/gemini-cli/issues/14963) -- Parallel subagent execution (closed as completed)
- [Gemini CLI Issue #17749](https://github.com/google-gemini/gemini-cli/issues/17749) -- Parallel subagent execution v1 (open, 0/4 subtasks)
- [Gemini CLI Issue #16994](https://github.com/google-gemini/gemini-cli/issues/16994) -- delegate_to_agent tool registration bug
- [Gemini CLI Issue #15428](https://github.com/google-gemini/gemini-cli/issues/15428) -- tools.allowed scope clarification
- [Google Blog: Hooks](https://developers.googleblog.com/tailor-gemini-cli-to-your-workflow-with-hooks/) -- Official blog post on hooks
- [Google Blog: FastMCP](https://developers.googleblog.com/gemini-cli-fastmcp-simplifying-mcp-server-development/) -- Official blog post on MCP integration

### Tertiary (LOW confidence)
- [Codex PR #3655](https://github.com/openai/codex/pull/3655) -- Multi-subagent orchestration PR (closed/unmerged, community contribution)
- [Codex Issue #2109](https://github.com/openai/codex/issues/2109) -- Event hooks feature request
- WebSearch results referencing v0.99.0 hooks/subagent infrastructure (could not fully verify from detailed changelog)

## Knowledge Applied

Checked knowledge base (`~/.gsd/knowledge/index.md`). No relevant entries found for this research domain -- the KB contains 7 signals related to KB migration, install model, context bloat, and spike workflow, none of which overlap with runtime capability verification. No spikes or lessons exist.

## Metadata

**Confidence breakdown:**
- Codex CLI mcp_servers = Y: HIGH -- verified via official documentation page, config reference, changelog
- Gemini CLI mcp_servers = Y: HIGH -- verified via official documentation page, GitHub docs, Google blog
- Gemini CLI tool_permissions = Y: HIGH -- verified via official configuration docs, GitHub issues confirming behavior
- Codex CLI task_tool = N: HIGH -- verified via multiple GitHub issues with maintainer responses
- Codex CLI tool_permissions = N: HIGH -- verified via security docs, config reference, skills docs
- Codex CLI hooks = N: MEDIUM -- notify exists but is single-event; changelog hints at hooks infra but features page doesn't document it
- Gemini CLI task_tool = Y: MEDIUM -- confirmed experimental with sequential-only limitation
- Gemini CLI hooks = Y: HIGH -- verified via official docs, reference, blog post

**Research date:** 2026-02-12
**Valid until:** 2026-03-12 (30 days -- both runtimes are actively evolving; Codex especially is releasing frequently)
