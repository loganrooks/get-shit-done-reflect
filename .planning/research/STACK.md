# Stack Research: Codex CLI Integration, Shared KB, Cross-Runtime Continuity

**Domain:** Multi-runtime CLI tool interop -- adding OpenAI Codex CLI as 4th runtime, migrating KB to shared location, enabling cross-runtime state
**Researched:** 2026-02-11
**Confidence:** HIGH (official OpenAI docs verified via WebFetch, cross-referenced with multiple sources)

---

## Executive Summary

Adding OpenAI Codex CLI as a fourth runtime requires understanding three distinct integration surfaces: (1) command installation format, (2) agent/tool name mapping, and (3) config directory conventions. Codex CLI uses `~/.codex/` as its home (`CODEX_HOME`), TOML for configuration, Markdown with YAML frontmatter for custom prompts (deprecated) and SKILL.md for skills, and a different set of built-in tool names than Claude Code, OpenCode, or Gemini CLI. The knowledge base migration from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/` is a filesystem-only change requiring no new dependencies. Cross-runtime continuity is achievable through the shared `~/.gsd/` directory since all four runtimes can read/write arbitrary filesystem paths.

**Critical finding:** Codex CLI has TWO command extension mechanisms -- custom prompts (`~/.codex/prompts/*.md`, invoked as `/prompts:name`) and skills (`~/.codex/skills/*/SKILL.md`, invoked implicitly or via `/skills`). Custom prompts are **deprecated in favor of skills**. However, skills use a different invocation model (implicit triggering based on description matching, not explicit `/command` invocation). GSD commands need explicit invocation. **Recommendation: Use the custom prompts mechanism** despite deprecation, because it maps directly to slash commands (`/prompts:gsd-help`), matching how GSD works on other runtimes. Skills are designed for implicit context injection, not explicit command dispatch.

**No new npm dependencies needed.** The entire integration is achievable with Node.js built-ins (`fs`, `path`, `os`), consistent with the zero-dependency philosophy.

---

## Recommended Stack

### Core Technologies (No Changes)

| Technology | Version | Purpose | Why Unchanged |
|------------|---------|---------|---------------|
| Node.js | >=16.7.0 | Installer runtime, hooks, gsd-tools | No Codex-specific Node features needed |
| JavaScript (CommonJS) | ES2020 | All scripting | Codex CLI is Rust-based; our tooling remains JS |
| Markdown + YAML frontmatter | N/A | Command definitions | Codex prompts use same format as Claude Code commands |
| esbuild | 0.24.0 | Hook bundling (dev only) | No change |

### New Integration Surface: Codex CLI

| Component | Value | Confidence | Source |
|-----------|-------|------------|--------|
| Config directory | `~/.codex/` (overridable via `CODEX_HOME`) | HIGH | [Official config docs](https://developers.openai.com/codex/config-basic/) |
| Config format | TOML (`~/.codex/config.toml`) | HIGH | [Config reference](https://developers.openai.com/codex/config-reference/) |
| Custom prompts dir | `~/.codex/prompts/` | HIGH | [Custom prompts docs](https://developers.openai.com/codex/custom-prompts/) |
| Custom prompt format | Markdown with YAML frontmatter (`description:`, `argument-hint:`) | HIGH | [Custom prompts docs](https://developers.openai.com/codex/custom-prompts/) |
| Custom prompt invocation | `/prompts:filename` (e.g., `/prompts:gsd-help`) | HIGH | [Custom prompts docs](https://developers.openai.com/codex/custom-prompts/) |
| Skills dir | `~/.codex/skills/*/SKILL.md` | HIGH | [Skills docs](https://developers.openai.com/codex/skills/) |
| AGENTS.md location | `~/.codex/AGENTS.md` (global) or `.codex/AGENTS.md` (project) | HIGH | [AGENTS.md guide](https://developers.openai.com/codex/guides/agents-md/) |
| Settings format | TOML (not JSON like Claude/Gemini) | HIGH | [Config reference](https://developers.openai.com/codex/config-reference/) |
| Env var override | `CODEX_HOME` (replaces `~/.codex`) | HIGH | [Advanced config](https://developers.openai.com/codex/config-advanced/) |
| Prompt deprecation | Custom prompts deprecated in favor of skills | MEDIUM | [Custom prompts docs](https://developers.openai.com/codex/custom-prompts/) |

### New Shared Directory: `~/.gsd/`

| Component | Path | Purpose | Why This Location |
|-----------|------|---------|-------------------|
| Shared root | `~/.gsd/` | Runtime-agnostic GSD home | Not inside any runtime's config dir; equally accessible to all 4 runtimes |
| Knowledge base | `~/.gsd/knowledge/` | Signals, spikes, lessons | Currently at `~/.claude/gsd-knowledge/`; must be runtime-neutral |
| KB index | `~/.gsd/knowledge/index.md` | Auto-generated signal/lesson index | Same format, new location |
| KB signals | `~/.gsd/knowledge/signals/{project}/` | Per-project signal files | Same structure |
| KB spikes | `~/.gsd/knowledge/spikes/` | Spike investigation results | Same structure |
| KB lessons | `~/.gsd/knowledge/lessons/` | Distilled lessons from reflection | Same structure |
| Cache | `~/.gsd/cache/` | Update check cache, shared across runtimes | Currently `~/.claude/cache/gsd-update-check.json` |

---

## Codex CLI Command Format: Detailed Specification

### Custom Prompts (Recommended for GSD Commands)

Codex custom prompts use Markdown files in `~/.codex/prompts/`. Each file becomes a slash command:

**File:** `~/.codex/prompts/gsd-help.md`
**Invocation:** `/prompts:gsd-help`

```yaml
---
description: Show GSD help and available commands
argument-hint: [COMMAND="specific command to get help for"]
---
```

```markdown
[Command body -- same content as Claude Code command, with path replacements]
```

**Frontmatter fields:**
- `description:` (required) -- shown in slash command menu, max ~200 chars
- `argument-hint:` (optional) -- documents expected parameters

**Placeholder system:**
- `$1` through `$9` -- positional arguments (space-separated)
- `$ARGUMENTS` -- all arguments
- `$NAME` -- named parameter (supplied as `NAME=value`)
- `$$` -- literal dollar sign

**Key differences from Claude Code commands:**

| Aspect | Claude Code | Codex CLI |
|--------|-------------|-----------|
| Directory | `commands/gsd/` (nested) | `prompts/` (flat) |
| File naming | `help.md` in `gsd/` subdir | `gsd-help.md` (flat, prefixed) |
| Invocation | `/gsd:help` | `/prompts:gsd-help` |
| Frontmatter | `allowed-tools:`, `description:`, `name:`, `color:` | `description:`, `argument-hint:` |
| Tool restrictions | Via `allowed-tools:` YAML array | Not supported in custom prompts |
| Agent support | Via `agents/gsd-*.md` with frontmatter | Not applicable (Codex has its own agent system) |

### Skills (NOT Recommended for GSD Commands)

Skills use `SKILL.md` with a different paradigm:

```yaml
---
name: gsd-help
description: When the user asks about GSD workflow commands or needs help with project planning, show available GSD commands.
---
```

**Why NOT skills for GSD:**
1. Skills trigger **implicitly** based on description matching -- GSD commands need **explicit** invocation
2. Skills have restricted frontmatter (`name`, `description`, `license`, `allowed-tools`, `metadata` only)
3. Skills use progressive disclosure (loaded on-demand) which conflicts with GSD's "load full command spec" model
4. The `/skills` invocation requires knowing to look there; `/prompts:gsd-*` is discoverable via `/` menu
5. Skill names are hyphen-case only (`^[a-z0-9-]+$`, max 64 chars) -- works for GSD but adds constraints

**When skills WOULD make sense:** If GSD wanted to provide always-available context (like "when user mentions project planning, load GSD patterns") rather than explicit commands. This could be a future enhancement for knowledge surfacing but should not replace the command system.

### AGENTS.md (Supplementary, Not Commands)

Codex reads `~/.codex/AGENTS.md` at session start for global instructions. This is where GSD's "always-on" instructions could go (equivalent to Claude Code's `CLAUDE.md`), but it does not replace commands.

**Discovery order:**
1. `~/.codex/AGENTS.override.md` (if exists)
2. `~/.codex/AGENTS.md`
3. Per directory from git root to CWD: `AGENTS.override.md` > `AGENTS.md` > fallback names
4. Configurable fallback: `project_doc_fallback_filenames = ["CLAUDE.md"]` in config.toml

**Installer action:** Write a `~/.codex/AGENTS.md` that includes GSD's standard preamble (workflow conventions, commit style, etc.) if one does not already exist. If one exists, do not overwrite.

---

## Codex CLI Tool Name Mapping

Codex CLI uses different built-in tool names than Claude Code, OpenCode, or Gemini. Since custom prompts do NOT support `allowed-tools:` restrictions, tool name mapping is only needed for content references within command/workflow text (not frontmatter).

### Built-in Tool Names (from codex-rs source)

| Claude Code | OpenCode | Gemini CLI | Codex CLI | Notes |
|-------------|----------|------------|-----------|-------|
| Read | read | read_file | read_file | |
| Write | write | write_file | apply_patch | Codex uses apply_patch for all file writes |
| Edit | edit | replace | apply_patch | Codex uses apply_patch for edits too |
| Bash | bash | run_shell_command | shell / exec_command | `shell` for simple, `exec_command` for PTY |
| Glob | glob | glob | list_dir | Codex uses list_dir for directory listing |
| Grep | grep | search_file_content | grep_files | |
| WebSearch | websearch | google_web_search | web_search | |
| WebFetch | webfetch | web_fetch | (N/A - not built-in) | Codex has web_search but not web_fetch |
| AskUserQuestion | question | ask_user | request_user_input | |
| Task | task | (auto) | spawn_agent | Codex agent spawning |
| TodoWrite | todowrite | write_todos | update_plan | |
| SlashCommand | skill | (N/A) | (N/A) | No equivalent in Codex |

**Important:** Since Codex custom prompts do not support `allowed-tools:` frontmatter, the installer does NOT need to map tool names in frontmatter. Tool name mapping is only needed for inline text references (e.g., "use the Read tool" becomes "use the read_file tool").

### Installer Transformation: Content-Only Mapping

```javascript
// Tool name mapping from Claude Code to Codex CLI
// Only needed for content text, not frontmatter (Codex prompts don't support allowed-tools)
const claudeToCodexTools = {
  Read: 'read_file',
  Write: 'apply_patch',
  Edit: 'apply_patch',
  Bash: 'shell',
  Glob: 'list_dir',
  Grep: 'grep_files',
  WebSearch: 'web_search',
  AskUserQuestion: 'request_user_input',
  Task: 'spawn_agent',
  TodoWrite: 'update_plan',
};
```

---

## Installer Changes Required

### New Runtime: `codex`

The installer (`bin/install.js`) needs a fourth runtime option. The pattern follows the existing OpenCode/Gemini patterns with Codex-specific transformations.

| Installer Component | Change Needed |
|---------------------|---------------|
| CLI flags | Add `--codex` flag |
| Runtime selection menu | Add option 5: "Codex CLI (~/.codex)" |
| `--all` flag | Include `codex` in all-runtimes array |
| `getDirName('codex')` | Returns `.codex` |
| `getGlobalDir('codex')` | Returns `CODEX_HOME` or `~/.codex` |
| `getGlobalDir` env var | `CODEX_CONFIG_DIR` > `CODEX_HOME` > `~/.codex` |
| Command installation | Flat to `prompts/` as `gsd-*.md` |
| Command invocation prefix | `/prompts:gsd-*` (not `/gsd:*`) |
| Frontmatter conversion | Strip `allowed-tools:`, `name:`, `color:`; keep `description:` |
| Agent installation | Skip -- Codex has its own agent system |
| Content path replacement | `~/.claude/` -> `~/.codex/` (or actual CODEX_HOME) |
| Hook installation | Skip -- Codex does not support session hooks |
| Settings configuration | Skip -- Codex uses TOML, not JSON settings |
| AGENTS.md | Write/merge GSD preamble into `~/.codex/AGENTS.md` |
| `get-shit-done/` dir | Install to `~/.codex/get-shit-done/` (reference docs) |
| Uninstall | Remove `prompts/gsd-*.md`, `get-shit-done/`, GSD lines from AGENTS.md |

### New Frontmatter Converter: `convertClaudeToCodexPrompt()`

```javascript
function convertClaudeToCodexPrompt(content) {
  // 1. Strip frontmatter fields not supported by Codex prompts:
  //    - allowed-tools (not supported)
  //    - name (Codex uses filename)
  //    - color (not supported)
  //    Keep: description (required), add argument-hint if applicable

  // 2. Replace tool name references in body text
  //    Read -> read_file, Bash -> shell, etc.

  // 3. Replace command invocation patterns
  //    /gsd:command -> /prompts:gsd-command

  // 4. Replace config path references
  //    ~/.claude/ -> ~/.codex/ (or CODEX_HOME path)

  // 5. Process Co-Authored-By attribution
}
```

### New Command Copier: `copyCodexPrompts()`

Similar to `copyFlattenedCommands()` for OpenCode, but targets `prompts/` directory:

```javascript
function copyCodexPrompts(srcDir, destDir, prefix, pathPrefix) {
  // Source: commands/gsd/*.md (nested)
  // Dest: prompts/gsd-*.md (flat)
  // Transform: convertClaudeToCodexPrompt()
  // Note: NO agents copied (Codex has its own agent system)
}
```

### KB Path Migration in Installer

The installer should handle `~/.gsd/knowledge/` directory creation and optionally migrate existing data:

```javascript
function setupSharedKB() {
  const gsdHome = path.join(os.homedir(), '.gsd');
  const kbDir = path.join(gsdHome, 'knowledge');

  // Create directory structure
  fs.mkdirSync(path.join(kbDir, 'signals'), { recursive: true });
  fs.mkdirSync(path.join(kbDir, 'spikes'), { recursive: true });
  fs.mkdirSync(path.join(kbDir, 'lessons'), { recursive: true });

  // Check for existing KB at old location
  const oldKB = path.join(os.homedir(), '.claude', 'gsd-knowledge');
  if (fs.existsSync(oldKB) && !fs.existsSync(path.join(kbDir, 'index.md'))) {
    // Offer migration (interactive) or auto-migrate (non-interactive)
    // Copy contents, then create symlink at old location for backward compat
  }
}
```

---

## Shared `~/.gsd/` Directory Convention

### Directory Structure

```
~/.gsd/
  knowledge/           # Shared knowledge base (was ~/.claude/gsd-knowledge/)
    index.md           # Auto-generated index
    signals/
      {project}/
        sig-*.md       # Signal entries
    spikes/
      spk-*.md         # Spike results
    lessons/
      les-*.md         # Distilled lessons
  cache/
    gsd-update-check.json  # Update check cache (was ~/.claude/cache/)
  config.json          # Optional: shared GSD config (future)
```

### Why `~/.gsd/` and Not XDG

| Option | Path | Pros | Cons |
|--------|------|------|------|
| `~/.gsd/` | `~/.gsd/` | Simple, discoverable, consistent across platforms, matches `~/.claude/` pattern | Not XDG-compliant |
| XDG | `~/.local/share/gsd/` | Standards-compliant | Different on macOS vs Linux, harder to find, overkill for a few Markdown files |
| `~/.config/gsd/` | `~/.config/gsd/` | Familiar to Linux users | macOS uses ~/Library, not ~/.config |

**Recommendation: `~/.gsd/`** because:
1. All four runtimes use dotdir conventions (`~/.claude/`, `~/.codex/`, `~/.gemini/`, `~/.config/opencode/`)
2. GSD's knowledge base is data, not configuration -- XDG would put it in `~/.local/share/` which is less discoverable
3. The installer already handles `~` expansion cross-platform
4. Users need to find and sometimes manually edit KB entries -- a visible dotdir is better than buried XDG paths

### Environment Variable Override

```javascript
// GSD_HOME env var overrides ~/.gsd
function getGsdHome() {
  if (process.env.GSD_HOME) {
    return expandTilde(process.env.GSD_HOME);
  }
  return path.join(os.homedir(), '.gsd');
}
```

### Migration Strategy

**Phase 1 (this milestone):** Update all workflows/commands/agents to use `~/.gsd/knowledge/` path. Installer creates the directory structure. If old `~/.claude/gsd-knowledge/` exists, copy contents to new location.

**Phase 2 (optional, later):** Create symlink at old location pointing to new location for any external tools that reference the old path. Or remove old directory after confirming migration.

**Backward compatibility:** The installer should detect an existing `~/.claude/gsd-knowledge/` and offer to migrate. In non-interactive mode, migrate automatically. After migration, the old directory can be kept as a symlink.

---

## Cross-Runtime Path References

All four runtimes need to reference the same shared paths. The installer's path replacement must handle this:

| Source (in repo) | Claude Code | OpenCode | Gemini CLI | Codex CLI |
|------------------|-------------|----------|------------|-----------|
| `~/.claude/gsd-knowledge/` | `~/.gsd/knowledge/` | `~/.gsd/knowledge/` | `~/.gsd/knowledge/` | `~/.gsd/knowledge/` |
| `~/.claude/get-shit-done/` | `~/.claude/get-shit-done/` | `~/.config/opencode/get-shit-done/` | `~/.gemini/get-shit-done/` | `~/.codex/get-shit-done/` |
| `~/.claude/cache/` | `~/.gsd/cache/` | `~/.gsd/cache/` | `~/.gsd/cache/` | `~/.gsd/cache/` |

**Key insight:** The knowledge base path becomes universal (`~/.gsd/knowledge/`) across all runtimes. The `get-shit-done/` reference docs path remains runtime-specific (each runtime installs its own copy). The cache path becomes shared.

---

## What NOT to Add

### No New npm Dependencies

| Temptation | Why Avoid | Built-in Alternative |
|------------|-----------|---------------------|
| `toml` parser library | Codex config is TOML but we don't need to parse it | We write AGENTS.md (Markdown), not config.toml |
| `js-yaml` for frontmatter | Already have inline YAML parsing in install.js | Existing line-by-line parser handles all cases |
| `glob` library | Might want for KB file discovery | `fs.readdirSync` with recursion (existing pattern) |
| `symlink` library | For KB migration backward compat | `fs.symlinkSync` is built-in |
| `chalk` for colors | Installer already uses ANSI codes | Existing escape code constants work fine |

### No Codex Agent Files

Codex CLI has its own agent system (`spawn_agent` tool) that works differently from Claude Code's Task-based subagents. Do NOT try to map GSD agent specs to Codex agent format. GSD commands for Codex will operate as single-context prompts. Users running complex multi-agent workflows should use Claude Code or OpenCode.

### No Codex Skills for Commands

Skills are the wrong abstraction for explicit commands. They are designed for implicit context injection based on task matching. Using skills would mean GSD commands trigger unpredictably when the user's prompt happens to match a description. Use custom prompts (explicit `/prompts:gsd-*` invocation) instead.

### No Codex Hook Integration

Codex CLI does not have a hook system equivalent to Claude Code's `SessionStart` hooks. Do not attempt to configure update checking or statusline for Codex. The update check can happen when a GSD command is explicitly invoked instead.

### No TOML Configuration Writes

Do not write to `~/.codex/config.toml`. Codex manages its own configuration. GSD's integration is limited to:
1. Writing prompts to `~/.codex/prompts/`
2. Writing reference docs to `~/.codex/get-shit-done/`
3. Optionally writing `~/.codex/AGENTS.md`

---

## Codex CLI Limitations for GSD

### What Works Differently

| GSD Feature | Claude Code Behavior | Codex CLI Behavior | Impact |
|-------------|---------------------|-------------------|--------|
| Subagent spawning | `Task` tool creates isolated agents | `spawn_agent` exists but different model | GSD multi-agent workflows may not work identically |
| Tool restrictions | `allowed-tools:` in frontmatter | Not supported in custom prompts | Commands run with full tool access |
| Statusline | Custom JS hook in settings.json | Not available | No GSD statusline |
| Session hooks | `SessionStart` array in settings.json | Not available | No auto-update checks |
| Nested commands | `/gsd:debug:start` via directory nesting | `/prompts:gsd-debug-start` via flat naming | Works but different invocation pattern |
| Agent color coding | `color:` in agent frontmatter | Not supported | Agents have no visual distinction |
| Knowledge surfacing | Auto-injects via hooks | Must be via AGENTS.md or explicit command | Less seamless knowledge integration |

### What Works the Same

| Feature | How It Works | Notes |
|---------|-------------|-------|
| Slash commands | `/prompts:gsd-help` triggers command | Different prefix but same UX |
| File reading | `read_file` tool | Same capability |
| Shell execution | `shell` tool | Same capability |
| Web search | `web_search` tool | Same capability |
| File system access | Full filesystem access in `workspace-write` mode | Matches Claude Code behavior |
| Git operations | Via shell tool | Same as other runtimes |
| `.planning/` state | Read/write via filesystem tools | Fully compatible |
| KB file access | Read/write `~/.gsd/knowledge/` | Works identically |

---

## Version Compatibility

| Component | Minimum Version | Notes |
|-----------|----------------|-------|
| Node.js | >=16.7.0 | No change from current requirement |
| Codex CLI | Any current version | Custom prompts supported since early releases |
| npm | Any | No change |
| macOS/Linux/Windows | All | `~/.gsd/` works on all platforms via `os.homedir()` |

**Codex CLI versioning note:** Codex CLI updates frequently (Rust-based, compiled binary). The custom prompts API has been stable. Skills are newer and still experimental. By using custom prompts, we avoid depending on experimental features.

---

## Sources

### HIGH Confidence (Official Documentation)

- [Codex CLI Reference](https://developers.openai.com/codex/cli/reference/) -- CLI flags, subcommands, CODEX_HOME
- [Config Reference](https://developers.openai.com/codex/config-reference/) -- Full TOML schema, all settings
- [Config Basics](https://developers.openai.com/codex/config-basic/) -- ~/.codex/config.toml location
- [Advanced Config](https://developers.openai.com/codex/config-advanced/) -- CODEX_HOME, project scoping
- [Custom Prompts](https://developers.openai.com/codex/custom-prompts/) -- Prompt format, frontmatter, placeholders, deprecation notice
- [Slash Commands](https://developers.openai.com/codex/cli/slash-commands/) -- Built-in commands, invocation pattern
- [AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/) -- Discovery order, layering, override mechanism
- [Agent Skills](https://developers.openai.com/codex/skills/) -- SKILL.md format, directory structure, progressive disclosure
- [Sample Config](https://developers.openai.com/codex/config-sample/) -- Full config.toml example

### MEDIUM Confidence (Cross-Referenced)

- [SKILL.md Format Spec (DeepWiki)](https://deepwiki.com/openai/skills/8.1-skill.md-format-specification) -- Frontmatter schema details, validation rules
- [Codex Tool System (DeepWiki)](https://deepwiki.com/openai/codex/6-node.js-implementation-(codex-cli)) -- Tool name registry
- [codex-rs spec.rs (GitHub)](https://github.com/openai/codex/blob/main/codex-rs/core/src/tools/spec.rs) -- Built-in tool identifiers

### LOW Confidence (Community, Needs Validation)

- [Codex Settings Examples (GitHub)](https://github.com/feiskyer/codex-settings) -- Community config examples
- [Skills in Codex (blog.fsck.com)](https://blog.fsck.com/2025/12/19/codex-skills/) -- Early skills experience report

---

*Stack research for: Codex CLI integration, shared KB migration, cross-runtime continuity*
*Researched: 2026-02-11*
