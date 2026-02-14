# Phase 18: Capability Matrix & Installer Corrections - Research

**Researched:** 2026-02-14
**Domain:** GSD installer format conversion pipeline and capability matrix accuracy
**Confidence:** HIGH

## Summary

This phase corrects 4 stale cells in the capability matrix and fixes the installer's format conversion functions that incorrectly strip MCP and tool_permissions content for runtimes that now support them. The prior research (runtime-capabilities/RESEARCH.md, dated 2026-02-12) already verified with HIGH confidence that Codex CLI supports MCP servers, Gemini CLI supports MCP servers, and Gemini CLI supports tool_permissions. This phase implements those corrections.

The work involves two distinct areas: (1) updating the static reference document `get-shit-done/references/capability-matrix.md` with corrected values and annotations, and (2) modifying three installer functions in `bin/install.js` that currently strip content they should preserve. The installer changes are surgical -- each function has a specific code path that returns `null` or skips content based on now-outdated capability assumptions.

The test suite (127 tests across 6 files) provides good coverage of the installer, but none of the existing tests verify MCP tool preservation or Gemini tool_permissions preservation. New tests are required for each correction.

**Primary recommendation:** Make 4 targeted changes (1 matrix file update, 3 installer function fixes) with corresponding test additions. No architectural changes needed -- this is corrective maintenance.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | (project default) | Installer runtime | bin/install.js is CommonJS Node.js |
| Vitest | (project default) | Test runner | Already used for all 127 existing tests |
| fs/path/os | Node built-in | File operations in installer | Already used throughout install.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tests/helpers/tmpdir.js | project utility | Temp directory test fixtures | All installer tests use tmpdirTest() |

No new dependencies are needed. This phase operates entirely within the existing codebase.

## Architecture Patterns

### Installer Conversion Pipeline

The installer has a well-defined conversion pipeline for each runtime. Understanding these paths is critical for knowing WHERE to make changes:

```
Source files (Claude Code format)
    |
    +-- Commands (commands/gsd/*.md)
    |       |
    |       +-- Claude: copyWithPathReplacement() -> write .md as-is
    |       +-- OpenCode: copyFlattenedCommands() -> convertClaudeToOpencodeFrontmatter()
    |       +-- Gemini: copyWithPathReplacement() -> convertClaudeToGeminiToml() -> write .toml
    |       +-- Codex: copyCodexSkills() -> convertClaudeToCodexSkill() -> write SKILL.md
    |
    +-- Agents (agents/gsd-*.md)
    |       |
    |       +-- Claude: replacePathsInContent() -> write .md as-is
    |       +-- OpenCode: replacePathsInContent() -> convertClaudeToOpencodeFrontmatter()
    |       +-- Gemini: replacePathsInContent() -> convertClaudeToGeminiAgent()  <-- FIX HERE
    |       +-- Codex: SKIPPED (uses AGENTS.md instead)
    |
    +-- Reference docs (get-shit-done/**/*.md)
            |
            +-- Claude: copyWithPathReplacement() -> write .md as-is
            +-- OpenCode: copyWithPathReplacement() -> convertClaudeToOpencodeFrontmatter()
            +-- Gemini: copyWithPathReplacement() -> stripSubTags() + convertClaudeToGeminiToml()
            +-- Codex: NOT directly copied (reference docs go to ~/.codex/get-shit-done/)
```

### Pattern 1: Gemini Agent MCP Tool Stripping (THE BUG)

**What:** `convertGeminiToolName()` at line 485 returns `null` for all `mcp__*` tools, which causes `convertClaudeToGeminiAgent()` to exclude them from the output tools array.

**Where it's called:** `convertClaudeToGeminiAgent()` at lines 549 and 565.

**Current code (bin/install.js:485-488):**
```javascript
function convertGeminiToolName(claudeTool) {
  // MCP tools: exclude -- auto-discovered from mcpServers config at runtime
  if (claudeTool.startsWith('mcp__')) {
    return null;  // <-- THIS IS THE BUG: returns null, tool gets dropped
  }
  // ...
}
```

**Fix pattern:** Return the MCP tool name as-is instead of null. Gemini CLI supports MCP and uses the same `mcp__server__tool` naming convention.

```javascript
function convertGeminiToolName(claudeTool) {
  // MCP tools: preserve -- Gemini CLI supports MCP servers
  if (claudeTool.startsWith('mcp__')) {
    return claudeTool;  // Keep MCP tool references as-is
  }
  // ...
}
```

### Pattern 2: Gemini Agent tool_permissions Stripping (THE BUG)

**What:** `convertClaudeToGeminiAgent()` converts `allowed-tools:` YAML arrays to Gemini `tools:` arrays. This conversion already works correctly for built-in tools. But when MCP tools were being stripped (Pattern 1 above), the effective result was that the tools list was incomplete. Fixing Pattern 1 automatically fixes this -- MCP tools will flow through to the output `tools:` array.

**Additionally:** The Gemini TOML command converter (`convertClaudeToGeminiToml()`) strips ALL frontmatter including `allowed-tools`. This is correct behavior because Gemini TOML commands do not have an `allowed-tools` equivalent -- tool restrictions for Gemini commands are configured at the settings.json level, not per-command. No fix needed for TOML commands.

### Pattern 3: Codex Skill MCP Tool Stripping (THE BUG)

**What:** `convertClaudeToCodexSkill()` strips the entire `allowed-tools:` frontmatter block for Codex skills (lines 787-795). This is CORRECT -- Codex skills do not support per-skill tool restrictions. However, MCP tool references in **body text** need to be preserved because Codex now supports MCP.

**Current behavior analysis:** The body text replacement iterates over `claudeToCodexTools` entries (line 749). Since `mcp__context7__*` is NOT in that map, MCP references in body text are actually ALREADY PRESERVED. They pass through unchanged.

**Where MCP references appear in body text:**
- `agents/gsd-phase-researcher.md` -- lines referencing `mcp__context7__resolve-library-id` and `mcp__context7__query-docs`
- `agents/gsd-project-researcher.md` -- same MCP tool references
- `agents/gsd-planner.md` -- `mcp__context7__*` in tools field
- `commands/gsd/plan-phase.md` -- `mcp__context7__*` in allowed-tools
- `get-shit-done/workflows/discovery-phase.md` -- MCP tool usage instructions

But wait: Codex agents are NOT installed as .md files -- they go through AGENTS.md generation. And Codex commands become Skills that strip `allowed-tools`. The body text MCP references survive. So for Codex, the fix is NOT in the skill converter but rather ensuring the capability matrix and related documentation (like the MCP section in capability-matrix.md) reflect that Codex supports MCP.

### Pattern 4: Capability Matrix Update Pattern

**What:** The capability-matrix.md file at `get-shit-done/references/capability-matrix.md` is a static markdown document read by LLMs at runtime. It has three sections that need updates:
1. Quick Reference table (4 cells)
2. Capability Details sections (mcp_servers, tool_permissions prose)
3. Degraded Behavior Summary tables (Codex CLI, Gemini CLI)

### Anti-Patterns to Avoid

- **Changing the matrix without updating the prose sections:** The matrix has both a Quick Reference table AND detailed sections per capability. Both must be updated or they'll contradict each other.
- **Changing installer behavior without updating tests:** The existing test suite has 127 tests. New behavior needs new test coverage.
- **Removing the null-return pattern entirely:** `convertGeminiToolName()` returning null for `Task` is correct (Gemini auto-registers agents as tools). Only the MCP null-return is wrong.
- **Adding MCP tools to claudeToCodexTools map:** The Codex tool map is for body text replacement of built-in tool names. MCP tools should NOT be added here -- they use a different naming convention that is runtime-agnostic.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Capability matrix format | Custom DSL or config format | Keep as static markdown | Matrix is a reference doc for LLMs, not a programmatic config file. The existing format works. |
| Test fixtures | New test infrastructure | Existing tmpdirTest() helper | All 64 unit tests use this pattern already |
| Gemini tool name mapping | New mapping table for MCP | Pass through as-is | MCP tool names are protocol-standard -- same format across all runtimes |

**Key insight:** The fixes are minimal because the architecture is already correct -- the only problem is that capability assumptions baked into the converter functions are now stale.

## Common Pitfalls

### Pitfall 1: Incomplete Matrix Update

**What goes wrong:** Updating the Quick Reference table but leaving contradictory information in the Capability Details sections, Degraded Behavior Summary, or the prose descriptions.
**Why it happens:** The capability-matrix.md has 162 lines with the same information expressed in multiple places.
**How to avoid:** After updating, grep the file for "N" next to "mcp_servers" and "tool_permissions" and for phrases like "Missing in: Gemini CLI" to find all locations that reference the old capability values.
**Warning signs:** A `grep -c` for "Gemini CLI" returns more than expected -- some may be in wrong-capability-value contexts.

### Pitfall 2: Gemini Tool Name Passthrough Breaking

**What goes wrong:** Passing MCP tool names through to Gemini format but MCP tools using underscore-separated names that conflict with Gemini's tool naming conventions.
**Why it happens:** Claude Code uses `mcp__server__tool` format. Gemini uses `mcp__server__tool` too (same MCP protocol standard). The double-underscore separator is part of the MCP protocol, not runtime-specific.
**How to avoid:** Verify by checking Gemini CLI's MCP documentation format for tool naming. The prior research (MEDIUM confidence) indicates same naming convention.
**Warning signs:** If Gemini CLI docs show a different MCP tool naming pattern.

### Pitfall 3: Over-Scoping Codex Changes

**What goes wrong:** Attempting to add MCP tool preservation to Codex skill frontmatter when Codex skills genuinely don't support per-skill tool restrictions.
**Why it happens:** Confusing "Codex supports MCP" (true -- at the runtime level via config.toml) with "Codex skills support tool restrictions" (false).
**How to avoid:** Remember that Codex MCP support is a RUNTIME capability configured in config.toml, not a per-skill capability. The skill converter correctly strips `allowed-tools`. The fix for Codex is limited to: (a) matrix update, (b) documentation updates in capability-matrix.md, and (c) ensuring body text MCP references survive (they already do).
**Warning signs:** If you find yourself adding an `mcp__` entry to `claudeToCodexTools`.

### Pitfall 4: Missing Annotation on Gemini task_tool

**What goes wrong:** Updating mcp_servers and tool_permissions but forgetting the task_tool annotation change (Y -> Y with experimental/sequential caveats).
**Why it happens:** The annotation change is easy to overlook because the cell value stays "Y" -- only the annotation changes.
**How to avoid:** The phase success criteria explicitly lists this as item #1: "Gemini task_tool annotated as experimental/sequential."
**Warning signs:** Quick Reference table shows plain "Y" for Gemini task_tool without a footnote marker.

### Pitfall 5: Test Regression from MCP Preservation

**What goes wrong:** Existing tests that implicitly verify MCP stripping behavior fail after the fix.
**Why it happens:** Tests may assert that output does NOT contain `mcp__` prefixed tools.
**How to avoid:** Search test files for `mcp` references before making changes. Current search shows NO existing tests check for MCP tool behavior -- so this risk is low but should be verified.
**Warning signs:** Test failures in `convertClaudeToGeminiAgent` or `convertGeminiToolName` related tests.

## Code Examples

### Fix 1: convertGeminiToolName() MCP Preservation

```javascript
// Source: bin/install.js, line 485
// BEFORE (current -- strips MCP tools):
function convertGeminiToolName(claudeTool) {
  // MCP tools: exclude -- auto-discovered from mcpServers config at runtime
  if (claudeTool.startsWith('mcp__')) {
    return null;
  }
  // Task: exclude -- agents are auto-registered as callable tools
  if (claudeTool === 'Task') {
    return null;
  }
  if (claudeToGeminiTools[claudeTool]) {
    return claudeToGeminiTools[claudeTool];
  }
  return claudeTool.toLowerCase();
}

// AFTER (preserves MCP tools):
function convertGeminiToolName(claudeTool) {
  // MCP tools: preserve as-is -- Gemini CLI supports MCP servers
  if (claudeTool.startsWith('mcp__')) {
    return claudeTool;
  }
  // Task: exclude -- agents are auto-registered as callable tools
  if (claudeTool === 'Task') {
    return null;
  }
  if (claudeToGeminiTools[claudeTool]) {
    return claudeToGeminiTools[claudeTool];
  }
  return claudeTool.toLowerCase();
}
```

### Fix 2: Update Comment in convertClaudeToGeminiAgent()

```javascript
// Source: bin/install.js, line 518
// BEFORE:
 * - mcp__* tools: must be excluded (auto-discovered at runtime)

// AFTER:
 * - mcp__* tools: preserved as-is (Gemini CLI supports MCP servers)
```

### Fix 3: Capability Matrix Quick Reference Table Update

```markdown
<!-- Source: get-shit-done/references/capability-matrix.md -->
<!-- BEFORE: -->
| Capability | Claude Code | OpenCode | Gemini CLI | Codex CLI | Impact When Missing |
|------------|:-----------:|:--------:|:----------:|:---------:|---------------------|
| task_tool  |      Y      |    Y     |     Y      |     N     | Sequential execution |
| hooks      |      Y      |    N     |     Y      |     N     | Skip hook features   |
| tool_permissions | Y     |    Y     |     N      |     N     | All tools available  |
| mcp_servers|      Y      |    Y     |     N      |     N     | Skip MCP features    |

<!-- AFTER: -->
| Capability | Claude Code | OpenCode | Gemini CLI | Codex CLI | Impact When Missing |
|------------|:-----------:|:--------:|:----------:|:---------:|---------------------|
| task_tool  |      Y      |    Y     |   Y [1]    |     N     | Sequential execution |
| hooks      |      Y      |    N     |     Y      |     N     | Skip hook features   |
| tool_permissions | Y     |    Y     |   Y [2]    |     N     | All tools available  |
| mcp_servers|      Y      |    Y     |   Y [3]    |   Y [4]   | Skip MCP features    |

[1] Experimental, sequential only. Parallel subagent execution not yet available.
[2] Via tools.core (allowlist), tools.exclude (denylist), and per-sub-agent restrictions.
[3] STDIO, SSE, and Streamable HTTP transports. OAuth support.
[4] STDIO and Streamable HTTP transports. OAuth support.
```

### Test Example: Gemini Agent MCP Tool Preservation

```javascript
// New test for convertClaudeToGeminiAgent() -- MCP tool preservation
it('preserves MCP tools in Gemini agent frontmatter', () => {
  const input = `---
name: gsd-phase-researcher
description: Researches phase domain
tools: Read, Write, Bash, Grep, Glob, WebSearch, WebFetch, mcp__context7__*
---

Research content here.`;

  const result = convertClaudeToGeminiAgent(input);

  // MCP tools should be preserved
  expect(result).toContain('mcp__context7__*');
  // Built-in tools should be converted
  expect(result).toContain('read_file');
  expect(result).toContain('run_shell_command');
});
```

### Test Example: Gemini Agent Allowed-Tools MCP Preservation

```javascript
// New test for convertClaudeToGeminiAgent() -- allowed-tools array with MCP
it('preserves MCP tools from allowed-tools array in Gemini agent', () => {
  const input = `---
name: gsd-planner
description: Plans phases
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - mcp__context7__*
---

Planning content here.`;

  const result = convertClaudeToGeminiAgent(input);

  // MCP tools should be preserved
  expect(result).toContain('mcp__context7__*');
  // Task should still be excluded (Gemini auto-registers agents as tools)
  expect(result).not.toContain('Task');
  // Built-in tools should be converted
  expect(result).toContain('read_file');
});
```

## State of the Art

| Old Understanding | Current Reality | When Changed | Impact |
|-------------------|----------------|--------------|--------|
| Codex CLI has no MCP support (matrix says N) | Full MCP with STDIO + HTTP transports | By v0.97.0 (Feb 5, 2026) | Matrix cell update, documentation update |
| Gemini CLI has no MCP support (matrix says N) | Full MCP with STDIO + SSE + HTTP | Documented in official docs | Matrix cell update, stop stripping MCP in agent converter |
| Gemini CLI has no tool_permissions (matrix says N) | Has tools.core, tools.exclude, per-agent restrictions | Documented in official docs | Matrix cell update, stop stripping tool_permissions in agent converter |
| Gemini task_tool is plain Y | Experimental, sequential only, YOLO mode | Current docs state "experimental" | Annotation update |

**Prior research that established these findings:**
- `.planning/research/runtime-capabilities/RESEARCH.md` (2026-02-12) -- HIGH confidence cell-by-cell verification

## Specific Files to Modify

| File | Change | Complexity |
|------|--------|-----------|
| `get-shit-done/references/capability-matrix.md` | Update 4 cells, add annotations, update Capability Details sections, update Degraded Behavior Summary | Medium (many locations in one file) |
| `bin/install.js` | Fix `convertGeminiToolName()` to preserve MCP tools instead of returning null | Trivial (1 line change + comment update) |
| `bin/install.js` | Update `convertClaudeToGeminiAgent()` JSDoc comment re: MCP tools | Trivial (comment update) |
| `tests/unit/install.test.js` | Add tests for MCP tool preservation in Gemini agent conversion | Small (2-3 new test cases) |
| `tests/integration/multi-runtime.test.js` | Add test verifying Gemini agents retain MCP tool references after install | Small (1-2 new test cases) |

### Files That Do NOT Need Changes

| File | Why Not |
|------|---------|
| `bin/install.js` `convertClaudeToCodexSkill()` | Codex skills correctly strip `allowed-tools` (Codex has no per-skill tool restrictions). MCP body text references already survive. |
| `bin/install.js` `convertClaudeToGeminiToml()` | Gemini TOML commands correctly strip frontmatter. Tool restrictions for Gemini commands are at settings.json level. |
| `bin/install.js` `convertToolName()` (OpenCode) | OpenCode already preserves MCP tools (returns `claudeTool` as-is for `mcp__*` prefix). |
| `bin/install.js` `replacePathsInContent()` | Path replacement is unaffected by capability changes. |
| Agent spec files (agents/*.md) | Source files are correct -- the bug is in the converter, not the source. |

## Open Questions

1. **Gemini CLI MCP tool naming convention confirmation**
   - What we know: Claude Code uses `mcp__server__tool` format. The MCP protocol defines this naming convention. Gemini CLI supports MCP.
   - What's unclear: Whether Gemini CLI exposes MCP tools using the exact same `mcp__server__tool` naming in agent frontmatter, or uses a different format.
   - Recommendation: LOW risk -- the MCP protocol standard defines the naming convention, and passing through as-is is the safest approach. If Gemini uses a different convention, agents will simply not have those specific tool restrictions, which is the same as the current (broken) behavior. Add a code comment noting this assumption.

2. **Whether convertClaudeToGeminiAgent needs to be exported for testing**
   - What we know: Currently only `replacePathsInContent`, `getGsdHome`, `migrateKB`, `countKBEntries`, `convertClaudeToCodexSkill`, `copyCodexSkills`, `generateCodexAgentsMd` are exported (line 2250).
   - What's unclear: Whether direct unit testing of `convertGeminiToolName` / `convertClaudeToGeminiAgent` is needed or if integration testing via the full install is sufficient.
   - Recommendation: Export `convertClaudeToGeminiAgent` for direct unit testing. This enables precise assertions without running the full installer. Add to exports on line 2250.

## Sources

### Primary (HIGH confidence)
- `bin/install.js` -- Direct source code inspection of all converter functions (lines 460-810, 1040-1090, 1770-1840)
- `get-shit-done/references/capability-matrix.md` -- Current matrix document (162 lines)
- `tests/unit/install.test.js` -- Existing test patterns (64 unit tests)
- `tests/integration/multi-runtime.test.js` -- Existing integration test patterns (13 tests)
- `.planning/research/runtime-capabilities/RESEARCH.md` -- Prior capability verification research (2026-02-12)
- `.planning/v1.14-MILESTONE-AUDIT.md` -- v1.14 audit confirming 127 passing tests
- `.planning/ROADMAP.md` -- Phase 18 success criteria definition

### Secondary (MEDIUM confidence)
- Agent spec files (`agents/gsd-*.md`, `commands/gsd/plan-phase.md`) -- Verified which files contain MCP tool references
- `.planning/phases/13-path-abstraction-capability-matrix/13-RESEARCH.md` -- Original capability matrix design rationale

## Knowledge Applied

Checked knowledge base (`~/.gsd/knowledge/index.md`). 7 signals exist, all from 2026-02-11. Reviewed the following for relevance:

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-11-local-install-global-kb-model | signal | Local install vs global KB path resolution | Confirmed this phase is scoped to global install only (no impact) |

The remaining 6 signals (context-bloat, premature-spiking, spike-design, kb-data-loss, kb-script-location, signal-workflow) are not relevant to capability matrix or installer format conversion work. No spikes or lessons exist.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all changes in existing codebase
- Architecture: HIGH -- direct source code inspection of all affected functions
- Pitfalls: HIGH -- verified by searching existing tests and code paths
- Code examples: HIGH -- derived directly from current source code
- Capability claims: HIGH -- based on prior verified research (runtime-capabilities/RESEARCH.md)

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days -- the installer code is stable; capability matrix updates are one-time corrections)
