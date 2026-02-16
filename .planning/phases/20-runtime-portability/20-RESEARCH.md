# Phase 20: Runtime Portability - Research

**Researched:** 2026-02-14
**Domain:** Multi-runtime installer format conversion, Gemini CLI tool_permissions, Codex CLI MCP configuration
**Confidence:** HIGH

## Summary

Phase 20 closes Gaps 7-9 from the post-v1.14 analysis, making GSD agent spec content portable across all four runtimes. Phase 18 already fixed the installer to preserve MCP tool references and tool_permissions content in Gemini agent frontmatter. Phase 20 builds on that by: (1) ensuring agent spec body content references work in non-Claude runtimes, (2) mapping GSD's per-agent `allowed-tools` frontmatter to Gemini's `tools:` array with correct Gemini-native tool names, and (3) generating TOML-format MCP server configuration for Codex CLI when MCP references are present.

The work has three distinct areas. First, agent spec body content accessibility (Gap 7) -- the body text of agent specs references Claude Code tool names (Read, Write, Bash, Glob, Grep) and Claude-specific patterns (like @file references). The Gemini agent converter already handles frontmatter but does NOT perform body text tool name replacement. The Codex skill converter DOES perform body text replacement. The Gemini agent converter needs body text tool name conversion to match. Second, the Gemini tools mapping (Gap 8) is largely already addressed: `convertClaudeToGeminiAgent()` converts `allowed-tools` to a `tools:` YAML array with Gemini-native names, and sub-agent frontmatter `tools:` IS the per-agent restriction mechanism in Gemini CLI. The `tools.core`/`tools.exclude` in settings.json are session-level restrictions -- not per-agent. The only remaining work is verifying the current mapping is complete and handles edge cases. Third, the Codex MCP config generator (Gap 9) requires new functionality: detecting MCP server references in GSD source files and emitting `[mcp_servers.context7]` TOML configuration in `~/.codex/config.toml` during installation.

**Primary recommendation:** Three focused changes: (1) add body text tool name replacement to `convertClaudeToGeminiAgent()`, (2) verify/enhance the Gemini `tools:` frontmatter mapping is complete, and (3) add a Codex MCP config.toml generator to the installer.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | (project default) | Installer runtime | bin/install.js is CommonJS Node.js |
| Vitest | (project default) | Test runner | All 132 existing tests use vitest |
| fs/path/os | Node built-in | File operations in installer | Already used throughout install.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tests/helpers/tmpdir.js | project utility | Temp directory test fixtures | All installer tests use tmpdirTest() |

No new dependencies are needed. This phase operates entirely within the existing codebase.

## Architecture Patterns

### Installer Conversion Pipeline (Current State)

Understanding where each change fits in the existing pipeline:

```
Source files (Claude Code format, .md with YAML frontmatter)
    |
    +-- Agents (agents/gsd-*.md)
    |       |
    |       +-- Claude: replacePathsInContent() -> write .md as-is
    |       +-- OpenCode: replacePathsInContent() -> convertClaudeToOpencodeFrontmatter()
    |       +-- Gemini: replacePathsInContent() -> convertClaudeToGeminiAgent()  <-- ENHANCE (Gap 7)
    |       +-- Codex: SKIPPED (uses AGENTS.md instead)
    |
    +-- Commands (commands/gsd/*.md)
    |       |
    |       +-- Claude: copyWithPathReplacement() -> write .md as-is
    |       +-- OpenCode: copyFlattenedCommands() -> convertClaudeToOpencodeFrontmatter()
    |       +-- Gemini: copyWithPathReplacement() -> convertClaudeToGeminiToml()
    |       +-- Codex: copyCodexSkills() -> convertClaudeToCodexSkill()
    |
    +-- MCP Config (NEW for Codex)
            |
            +-- Codex: detectMcpReferences() -> generateCodexMcpConfig()  <-- NEW (Gap 9)
```

### Pattern 1: Gemini Agent Body Text Tool Name Replacement (Gap 7)

**What:** The Gemini agent converter (`convertClaudeToGeminiAgent`) currently only transforms frontmatter -- it converts `allowed-tools`/`tools` entries from Claude names (Read, Write, Bash) to Gemini names (read_file, write_file, run_shell_command). But the body text still references Claude tool names like "Use the Read tool" or "Run Bash to execute".

**Current behavior:**
```javascript
// convertClaudeToGeminiAgent() only touches frontmatter
// Body text passes through unchanged after stripSubTags()
return `---\n${newFrontmatter}\n---${stripSubTags(body)}`;
```

**Required behavior:** Apply tool name replacement to body text, similar to how `convertClaudeToCodexSkill()` does it:
```javascript
// convertClaudeToCodexSkill() replaces tool names in body text (line 792-797)
for (const [claudeTool, codexTool] of Object.entries(claudeToCodexTools)) {
  if (codexTool === null) continue;
  converted = converted.replace(new RegExp(`\\b${claudeTool}\\b`, 'g'), codexTool);
}
```

**Fix pattern:** Add body text tool name replacement to `convertClaudeToGeminiAgent()` using `claudeToGeminiTools` mapping, applied to the body portion after frontmatter extraction.

### Pattern 2: Gemini Per-Agent Tool Restrictions (Gap 8 - Largely Done)

**What:** Gemini CLI supports per-agent tool restrictions via the `tools:` YAML array in agent frontmatter. When `tools:` is specified, the sub-agent can ONLY use those listed tools. This is functionally identical to Claude Code's `allowed-tools:`.

**Current state:** `convertClaudeToGeminiAgent()` already:
- Converts `allowed-tools:` YAML arrays to `tools:` YAML arrays
- Maps Claude tool names to Gemini built-in names (Read -> read_file, etc.)
- Preserves MCP tools as-is (fixed in Phase 18)
- Excludes Task (Gemini auto-registers agents as tools)

**What's needed:** Verification that the mapping is complete and handles all GSD agent specs. The `tools.core`/`tools.exclude` in settings.json is NOT needed for per-agent restrictions -- it's a session-level mechanism. The agent frontmatter `tools:` array IS the correct mechanism.

**Important distinction:** Gemini's `tools.core`/`tools.exclude` (in settings.json) is for session-level restrictions. Gemini's `tools:` (in agent frontmatter) is for per-agent restrictions. GSD's `allowed-tools` maps to the latter, which is already implemented.

### Pattern 3: Codex MCP Config.toml Generator (Gap 9)

**What:** When GSD agent specs reference MCP tools (e.g., `mcp__context7__*`), the Codex installer should generate a `[mcp_servers.context7]` section in `~/.codex/config.toml` so the MCP server is configured for the runtime.

**Codex config.toml MCP format (verified from official docs):**
```toml
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
```

**Design considerations:**
1. GSD references `mcp__context7__*` in frontmatter -- we need to extract the server name ("context7") from the MCP tool reference pattern `mcp__<server>__<tool>`
2. We need to know the actual command to start the MCP server -- this is NOT derivable from the tool reference name alone
3. The installer should merge with any existing config.toml, not overwrite
4. The installer should be idempotent -- don't add duplicate MCP server entries

**Recommended approach:** Define a mapping of known MCP servers (GSD currently only uses context7) with their server commands. The installer scans source files for `mcp__` patterns, extracts server names, and generates TOML configuration entries for Codex.

```javascript
// Known MCP servers used by GSD
const gsdMcpServers = {
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp']
  }
};
```

### Pattern 4: Codex config.toml TOML Generation

**What:** Node.js needs to read/write TOML files for the Codex config.toml. The project does NOT currently have a TOML library.

**Options:**
1. Use a TOML library (e.g., `@iarna/toml`) -- adds a dependency
2. Hand-write simple TOML output -- the MCP server config is simple key-value pairs
3. String template approach -- generate TOML as a string with markers for idempotent updates

**Recommended approach:** Use a string template with GSD markers (like AGENTS.md uses `<!-- GSD:BEGIN -->`) for idempotent TOML section management. The config.toml structure for MCP is simple enough that a full TOML parser is overkill.

```toml
# GSD:BEGIN (get-shit-done-reflect-cc)
[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
# GSD:END (get-shit-done-reflect-cc)
```

### Anti-Patterns to Avoid

- **Adding `tools.core`/`tools.exclude` to Gemini settings.json for per-agent restrictions:** These are session-level, not per-agent. The agent frontmatter `tools:` array is the correct mechanism and is already implemented.
- **Adding a full TOML parser dependency for simple config generation:** The config.toml MCP section is simple key-value pairs. String templates with markers are sufficient and avoid adding a dependency.
- **Overwriting user's existing Codex config.toml:** Must merge, not overwrite. Use marker-based section replacement (same pattern as AGENTS.md).
- **Attempting to auto-discover MCP server commands from tool names:** The `mcp__context7__*` reference doesn't encode the server's startup command. Use a known-server mapping instead.
- **Replacing tool names in code blocks or URLs:** Body text tool name replacement should use word boundaries (`\b`) to avoid replacing inside code paths or configuration strings that happen to contain tool names.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TOML parsing/generation | Full TOML parser | String template with GSD markers | MCP config is simple k-v pairs; avoids adding dependency |
| Tool name mapping tables | New mapping tables | Existing `claudeToGeminiTools` and `claudeToCodexTools` | Already maintained and tested in install.js |
| Per-agent tool restrictions in Gemini | settings.json tools.core/tools.exclude | Agent frontmatter `tools:` array | tools.core is session-level; agent `tools:` is per-agent (already implemented) |
| MCP server discovery | Runtime MCP server detection | Static known-server mapping | GSD only uses context7; a static mapping is simpler and more reliable |

**Key insight:** The Gemini tool_permissions gap (Gap 8) is smaller than originally scoped because `convertClaudeToGeminiAgent()` already maps `allowed-tools` to agent frontmatter `tools:`. The remaining work is body text replacement and verification. The Codex MCP config generator (Gap 9) is new functionality but scoped to a known set of MCP servers.

## Common Pitfalls

### Pitfall 1: Confusing Gemini Session-Level vs Per-Agent Tool Restrictions

**What goes wrong:** Implementing `tools.core`/`tools.exclude` in settings.json when the correct mechanism is the agent frontmatter `tools:` array.
**Why it happens:** The success criteria says "maps GSD `allowed-tools` frontmatter to Gemini's `tools.core`/`tools.exclude` format." But per-agent restrictions use frontmatter `tools:`, not settings.json.
**How to avoid:** Understand that Gemini has TWO mechanisms: (a) `tools.core`/`tools.exclude` in settings.json for session-level restrictions, (b) `tools:` in agent .md frontmatter for per-agent restrictions. GSD's `allowed-tools` maps to (b), which is already implemented by `convertClaudeToGeminiAgent()`.
**Warning signs:** If you find yourself modifying settings.json in the Gemini install path for per-agent tool restrictions, you're using the wrong mechanism.

### Pitfall 2: Body Text Replacement Breaking MCP Tool References

**What goes wrong:** Word-boundary regex replacement of tool names in body text inadvertently modifies `mcp__context7__resolve-library-id` or other MCP references.
**Why it happens:** MCP tool names contain built-in tool substrings (e.g., the word "Read" might appear in an MCP tool name).
**How to avoid:** MCP tool names use `mcp__` prefix and double-underscore separators. The word boundary `\b` regex handles this correctly because underscores are word characters. Verify with test: `"mcp__context7__read_file".replace(/\bRead\b/g, 'read_file')` should NOT match (because it's `read_file` not `Read`). But be cautious with case-sensitive matching.
**Warning signs:** Tests showing MCP tool references being partially modified after body text replacement.

### Pitfall 3: Codex config.toml Corruption

**What goes wrong:** The installer overwrites the user's existing config.toml, losing their custom MCP servers and other settings.
**Why it happens:** Writing the whole file instead of merging. Or not handling the case where config.toml doesn't exist vs. exists with/without MCP sections.
**How to avoid:** Use the same marker-based section management pattern as `generateCodexAgentsMd()`: look for `# GSD:BEGIN` / `# GSD:END` markers, replace that section if found, append if not found, create file if it doesn't exist.
**Warning signs:** User-configured MCP servers disappearing after GSD install/upgrade.

### Pitfall 4: TOML Syntax Errors in Generated Config

**What goes wrong:** Generated TOML has invalid syntax (wrong quoting, missing brackets, bad array format).
**Why it happens:** Hand-writing TOML as strings without formal validation.
**How to avoid:** Test the generated TOML by parsing it with a validator or testing it against the Codex CLI. Keep the format extremely simple (use `JSON.stringify` for string values which produces valid TOML string literals). Write comprehensive unit tests for the generator.
**Warning signs:** Codex CLI fails to start with config parse errors after GSD install.

### Pitfall 5: Incomplete Gemini Tool Name Mapping for Body Text

**What goes wrong:** Body text references tools not in `claudeToGeminiTools` mapping, leaving Claude-specific names in Gemini agent body content.
**Why it happens:** The mapping table covers the main tools but may miss edge cases like `Edit`, `TodoWrite`, `AskUserQuestion`, `SlashCommand`, `Task`.
**How to avoid:** Verify all tool names used in GSD agent body text are covered by the mapping. The existing `claudeToGeminiTools` map covers: Read, Write, Edit, Bash, Glob, Grep, WebSearch, WebFetch, TodoWrite, AskUserQuestion. Missing from map: Task (should be excluded/replaced with agent name), SlashCommand (no Gemini equivalent).
**Warning signs:** Grep for `\bRead\b`, `\bWrite\b`, `\bBash\b` etc. in installed Gemini agent files finding unreplaced Claude tool names.

## Code Examples

### Body Text Tool Name Replacement for Gemini Agents

```javascript
// Source: bin/install.js - add to convertClaudeToGeminiAgent()
// Apply tool name replacement to body text (like Codex does)
function replaceGeminiToolNamesInBody(body) {
  let result = body;
  for (const [claudeTool, geminiTool] of Object.entries(claudeToGeminiTools)) {
    result = result.replace(new RegExp(`\\b${claudeTool}\\b`, 'g'), geminiTool);
  }
  // Replace /gsd:command with /gsd:command (Gemini uses same command syntax)
  // No change needed -- Gemini CLI uses same /command:name pattern as Claude
  return result;
}

// Modified convertClaudeToGeminiAgent() ending:
const newFrontmatter = newLines.join('\n').trim();
const processedBody = replaceGeminiToolNamesInBody(stripSubTags(body));
return `---\n${newFrontmatter}\n---${processedBody}`;
```

### Codex MCP Config Generator

```javascript
// Source: bin/install.js - new function
// Known MCP servers used by GSD
const gsdMcpServers = {
  context7: {
    command: 'npx',
    args: ['-y', '@upstash/context7-mcp']
  }
};

/**
 * Generate MCP server configuration for Codex CLI config.toml
 * Scans GSD source files for mcp__ references, generates TOML config
 * Uses marker-based section management for idempotent updates
 */
function generateCodexMcpConfig(targetDir) {
  const configPath = path.join(targetDir, 'config.toml');
  const GSD_BEGIN = '# GSD:BEGIN (get-shit-done-reflect-cc)';
  const GSD_END = '# GSD:END (get-shit-done-reflect-cc)';

  // Determine which MCP servers GSD needs
  const neededServers = Object.keys(gsdMcpServers);

  // Build TOML section
  let tomlSection = GSD_BEGIN + '\n';
  for (const serverName of neededServers) {
    const server = gsdMcpServers[serverName];
    tomlSection += `\n[mcp_servers.${serverName}]\n`;
    tomlSection += `command = ${JSON.stringify(server.command)}\n`;
    tomlSection += `args = [${server.args.map(a => JSON.stringify(a)).join(', ')}]\n`;
  }
  tomlSection += '\n' + GSD_END;

  if (fs.existsSync(configPath)) {
    let existing = fs.readFileSync(configPath, 'utf8');
    const beginIdx = existing.indexOf(GSD_BEGIN);
    const endIdx = existing.indexOf(GSD_END);

    if (beginIdx !== -1 && endIdx !== -1) {
      // Replace existing GSD section
      existing = existing.substring(0, beginIdx) + tomlSection +
                 existing.substring(endIdx + GSD_END.length);
    } else {
      // Append GSD section
      existing = existing.trimEnd() + '\n\n' + tomlSection + '\n';
    }
    fs.writeFileSync(configPath, existing);
  } else {
    fs.writeFileSync(configPath, tomlSection + '\n');
  }
}
```

### Test Example: Gemini Agent Body Text Tool Name Replacement

```javascript
it('converts Claude tool names to Gemini names in agent body text', () => {
  const input = `---
tools: Read, Write, Bash
---

Use the Read tool to read files.
Use Write to create new files.
Run Bash to execute commands.
Use Grep for searching and Glob for finding files.`

  const result = convertClaudeToGeminiAgent(input)

  // Body text should use Gemini tool names
  expect(result).toContain('read_file tool to read files')
  expect(result).toContain('Use write_file to create')
  expect(result).toContain('Run run_shell_command to execute')
  expect(result).toContain('Use search_file_content for searching')
  expect(result).toContain('glob for finding files')
  // Claude tool names should not remain in body
  expect(result).not.toMatch(/\bRead\b/)
  expect(result).not.toMatch(/\bWrite\b/)
  expect(result).not.toMatch(/\bBash\b/)
})
```

### Test Example: Codex MCP Config Generation

```javascript
it('generates config.toml with MCP server entries for Codex', () => {
  const configPath = path.join(tmpdir, 'config.toml')

  generateCodexMcpConfig(tmpdir)

  const content = fs.readFileSync(configPath, 'utf8')
  expect(content).toContain('[mcp_servers.context7]')
  expect(content).toContain('command = "npx"')
  expect(content).toContain('args = ["-y", "@upstash/context7-mcp"]')
  expect(content).toContain('# GSD:BEGIN')
  expect(content).toContain('# GSD:END')
})

it('merges with existing config.toml without losing user config', () => {
  const configPath = path.join(tmpdir, 'config.toml')
  fs.writeFileSync(configPath, `model = "o3-mini"\n\n[mcp_servers.my-server]\ncommand = "my-server"\n`)

  generateCodexMcpConfig(tmpdir)

  const content = fs.readFileSync(configPath, 'utf8')
  // User config preserved
  expect(content).toContain('model = "o3-mini"')
  expect(content).toContain('[mcp_servers.my-server]')
  // GSD config added
  expect(content).toContain('[mcp_servers.context7]')
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Gemini agent converter: frontmatter only | Gemini agent converter: frontmatter + body text | Phase 20 | Tool name references in body work in Gemini |
| No Codex MCP config | Auto-generate config.toml MCP entries | Phase 20 | MCP tools (context7) available in Codex CLI |
| tools.core/tools.exclude for per-agent | Agent frontmatter `tools:` for per-agent | Already correct | No settings.json changes needed for per-agent restrictions |

**Gemini agent frontmatter `tools:` array (verified):**
- Gemini sub-agents support `tools:` YAML array in frontmatter (source: official sub-agents docs)
- When `tools:` is specified, the agent can ONLY use listed tools (allowlist)
- Tool names must be exact registered names (e.g., `read_file`, not `Read`)
- MCP tools use `ServerName__tool_name` format with double underscore
- The existing `convertClaudeToGeminiAgent()` already handles this mapping correctly

**Codex CLI MCP config.toml (verified):**
- Codex uses `[mcp_servers.<name>]` TOML tables (source: official Codex MCP docs)
- Supports `command`, `args`, `env`, `cwd` for STDIO servers
- Supports `url`, `bearer_token_env_var`, `http_headers` for HTTP servers
- Supports `enabled_tools`, `disabled_tools` for per-server tool filtering
- Global config at `~/.codex/config.toml`, project-scoped at `.codex/config.toml`

## Specific Files to Modify

| File | Change | Complexity |
|------|--------|-----------|
| `bin/install.js` | Add body text tool name replacement to `convertClaudeToGeminiAgent()` | Small (follow existing pattern from Codex converter) |
| `bin/install.js` | Add `generateCodexMcpConfig()` function | Medium (new function, marker-based TOML management) |
| `bin/install.js` | Call `generateCodexMcpConfig()` in Codex install path | Trivial (1 line addition) |
| `bin/install.js` | Add `generateCodexMcpConfig` to module.exports | Trivial (1 addition to exports) |
| `tests/unit/install.test.js` | Add tests for Gemini body text tool name replacement | Small (3-4 new tests) |
| `tests/unit/install.test.js` | Add tests for Codex MCP config generation | Small (3-4 new tests) |
| `tests/integration/multi-runtime.test.js` | Add integration test for Gemini agent body text | Small (1-2 new tests) |
| `tests/integration/multi-runtime.test.js` | Add integration test for Codex config.toml MCP | Small (1-2 new tests) |

### Files That Do NOT Need Changes

| File | Why Not |
|------|---------|
| `get-shit-done/references/capability-matrix.md` | Already corrected in Phase 18 |
| `bin/install.js` `convertClaudeToGeminiToml()` | Gemini TOML commands correctly strip frontmatter; body text in TOML commands is a prompt string where tool names don't need conversion |
| `bin/install.js` `convertClaudeToCodexSkill()` | Already performs body text tool name replacement |
| `bin/install.js` `convertClaudeToOpencodeFrontmatter()` | OpenCode already performs body text replacement for critical tool names |
| Agent spec files (agents/*.md) | Source files are correct -- changes are in converters |
| Gemini settings.json generation | Per-agent restrictions use frontmatter `tools:`, not settings.json `tools.core`/`tools.exclude` |

## Open Questions

1. **Gemini tool name collision with body text prose**
   - What we know: Word-boundary regex replacement of tool names works well for most cases. Claude tool names (Read, Write, Edit) are common English words that could appear in agent body prose outside of tool-usage context.
   - What's unclear: How many false-positive replacements will occur. For example, "Read the RESEARCH.md file" would become "read_file the RESEARCH.md file" which changes the meaning.
   - Recommendation: Audit actual GSD agent body content for false-positive risks. The Codex converter has the same issue and has been shipping since Phase 15 without reported problems. Accept the tradeoff -- tool name replacement is more valuable than perfect prose preservation. If specific false positives are found, add exclusion patterns.

2. **Whether Codex config.toml should include MCP servers that the user hasn't installed**
   - What we know: GSD references `mcp__context7__*` but the user may not have context7 MCP server available (it requires `npx @upstash/context7-mcp`).
   - What's unclear: Whether adding a config.toml entry for an unavailable MCP server causes Codex CLI errors on startup.
   - Recommendation: Include the entry. Codex CLI docs show that servers can have `enabled = false` to disable without removing. By default, Codex will attempt to start the server -- if it fails, it logs a warning but continues. Use a comment in the generated TOML explaining the MCP server purpose. Do NOT set `required = true` (which would block Codex startup if the server fails).

3. **Whether Codex uninstall should clean up config.toml MCP entries**
   - What we know: The current `uninstall()` function handles skills, AGENTS.md, hooks, and settings.json for various runtimes.
   - What's unclear: Whether the uninstaller should remove the GSD MCP section from config.toml.
   - Recommendation: Yes, uninstall should remove the `# GSD:BEGIN` / `# GSD:END` section from config.toml, using the same marker-based approach. This is consistent with how AGENTS.md GSD sections are handled.

## Sources

### Primary (HIGH confidence)
- `bin/install.js` -- Direct source code inspection of all converter functions (lines 440-900, 1040-1135, 1750-1940)
- `get-shit-done/references/capability-matrix.md` -- Current corrected matrix (176 lines, Phase 18 verified)
- `tests/unit/install.test.js` -- Existing test patterns (132 tests including Phase 18 additions)
- `tests/integration/multi-runtime.test.js` -- Existing integration test patterns (including Gemini MCP test)
- `.planning/research/runtime-capabilities/RESEARCH.md` -- Prior capability verification research (2026-02-12)
- `.planning/phases/18-capability-matrix-installer-corrections/18-VERIFICATION.md` -- Phase 18 verified as complete
- [Codex MCP Documentation](https://developers.openai.com/codex/mcp/) -- Official Codex MCP config format
- [Codex Config Reference](https://developers.openai.com/codex/config-reference/) -- Full config.toml schema
- [Codex Sample Configuration](https://developers.openai.com/codex/config-sample/) -- Example config.toml with MCP sections
- [Gemini CLI Configuration](https://google-gemini.github.io/gemini-cli/docs/get-started/configuration.html) -- Full settings.json schema including tools.core/exclude
- [Gemini CLI Sub-agents](https://geminicli.com/docs/core/subagents/) -- Sub-agent definition with tools: frontmatter

### Secondary (MEDIUM confidence)
- [Gemini CLI Issue #17005](https://github.com/google-gemini/gemini-cli/issues/17005) -- MCP tool naming in agent frontmatter (ServerName__tool_name format)
- [Gemini CLI Discussion #8980](https://github.com/google-gemini/gemini-cli/discussions/8980) -- Tool name format requirements
- [Gemini CLI MCP Server docs](https://google-gemini.github.io/gemini-cli/docs/tools/mcp-server.html) -- MCP tool naming convention

### Tertiary (LOW confidence)
- None. All findings verified with primary or secondary sources.

## Knowledge Applied

Checked knowledge base (`~/.gsd/knowledge/index.md`). 7 signals exist, all from 2026-02-11. Reviewed for relevance:

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| (none relevant) | - | - | - |

The 7 signals cover KB migration (sig-kb-data-loss, sig-kb-script-location, sig-local-install-global-kb), context bloat (sig-signal-workflow, sig-agent-inline-research), and spike workflow (sig-premature-spiking, sig-spike-design-feasibility). None overlap with runtime format conversion, tool name mapping, or MCP configuration generation. No spikes or lessons exist.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all changes in existing codebase
- Architecture: HIGH -- direct source code inspection of all affected functions, verified Gemini/Codex docs
- Pitfalls: HIGH -- verified by inspecting existing code patterns and testing approaches
- Code examples: HIGH -- derived from existing converter patterns in install.js and verified official docs
- Gemini tool_permissions mechanism: HIGH -- official docs confirm per-agent `tools:` array in frontmatter; `tools.core`/`tools.exclude` is session-level
- Codex MCP config.toml format: HIGH -- verified from official docs, config reference, and sample configuration

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days -- installer code is stable; Gemini/Codex CLI formats are established)
