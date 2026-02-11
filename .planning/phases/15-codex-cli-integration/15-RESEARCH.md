# Phase 15: Codex CLI Integration - Research

**Researched:** 2026-02-11
**Domain:** OpenAI Codex CLI runtime integration -- installer extension, Skills format conversion, AGENTS.md generation, `codex exec` non-interactive support
**Confidence:** HIGH

## Summary

Phase 15 adds OpenAI Codex CLI as the 4th GSD runtime. The installer (`bin/install.js`) must be extended with a `--codex` flag that installs GSD commands as Codex Skills (SKILL.md directories), generates a global `~/.codex/AGENTS.md` with GSD workflow instructions, installs reference docs to `~/.codex/get-shit-done/`, and converts all `~/.claude/` paths to `~/.codex/`. The `--all` flag must be updated to include Codex. Codex capability limitations (no Task tool, no hooks, no tool restrictions enforcement) are already documented in the capability matrix from Phase 13.

The critical finding from this research is that **Codex custom prompts are officially deprecated in favor of Skills**. Skills support `name`, `description`, `license`, `allowed-tools`, and `metadata` as frontmatter fields, and can be invoked explicitly via `/skills` or `$skill-name` syntax, or implicitly by task-matching. Skills are discovered from `~/.agents/skills` (primary) with `~/.codex/skills` as a legacy compatibility path. GSD commands should be installed as Skills at the `~/.codex/skills/` path for maximum compatibility with current and future Codex versions, since GSD users may not have `~/.agents/` set up.

The `codex exec` subcommand enables non-interactive scripted/CI usage (CODEX-07). It accepts a prompt string, runs to completion without the TUI, and supports `--json`, `--full-auto`, `--sandbox`, and `--output-last-message` flags. GSD can document how to invoke GSD commands via `codex exec "run the gsd-plan-phase skill for phase 15"` for CI workflows.

**Primary recommendation:** Install GSD commands as Skills in `~/.codex/skills/gsd-*/SKILL.md` using the documented SKILL.md format. Generate a concise `~/.codex/AGENTS.md` with GSD workflow awareness. Follow the established pattern of runtime adapter functions (`convertClaudeToCodexSkill()`) and extend the `install()` function with a Codex code path.

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js | 18+ | Installer runtime (bin/install.js) | Already used, CommonJS module |
| Vitest | Current | Test framework | Already configured in project (vitest.config.js) |
| `fs` (built-in) | N/A | Directory creation, file writes | Zero-dependency; Skills are directories with SKILL.md files |
| `path` (built-in) | N/A | Cross-platform path joining | Already used throughout installer |
| `os` (built-in) | N/A | Home directory resolution | Already used for getGlobalDir() |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `replacePathsInContent()` | Two-pass path replacement (existing) | All content transformation for Codex -- reuse, do not duplicate |
| `processAttribution()` | Co-authored-by attribution (existing) | Applied to all installed files |
| `fs.mkdirSync(..., { recursive: true })` | Skill directory creation | Each GSD command needs `~/.codex/skills/gsd-commandname/` |
| `getGsdHome()` | GSD_HOME resolution (existing) | KB migration runs once before per-runtime loop |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Skills (`~/.codex/skills/`) | Custom prompts (`~/.codex/prompts/`) | Custom prompts are deprecated; skills are the forward path despite implicit invocation complexity |
| `~/.codex/skills/` path | `~/.agents/skills/` path | `~/.agents/skills/` is the newer preferred path (Codex 0.95+), but `~/.codex/skills/` has guaranteed compatibility and is the expected per-runtime config location |
| AGENTS.md for all instructions | Skills only | AGENTS.md provides session-start context; skills provide on-demand commands. Use both: AGENTS.md for awareness, skills for commands |

**No new npm dependencies needed.**

## Architecture Patterns

### Current Installer Architecture (Post-Phase 14)

```
bin/install.js
├── CLI flags: --claude, --opencode, --gemini, --all
├── installAllRuntimes()
│   ├── getGsdHome() + migrateKB()         # Once, before runtime loop
│   └── for each runtime: install()
│       ├── OpenCode path: copyFlattenedCommands() + convertClaudeToOpencodeFrontmatter()
│       ├── Claude/Gemini path: copyWithPathReplacement() + convertClaudeToGeminiToml()
│       ├── Agent copy loop (per runtime conversion)
│       ├── Hook registration (Claude/Gemini only)
│       └── finishInstall()
├── replacePathsInContent()                 # Centralized two-pass path replacement
├── convertClaudeToOpencodeFrontmatter()    # OpenCode adapter
├── convertClaudeToGeminiToml()             # Gemini adapter
└── convertClaudeToGeminiAgent()            # Gemini agent adapter
```

### Proposed Codex Extension

```
bin/install.js (MODIFIED)
├── CLI flags: --claude, --opencode, --gemini, --codex, --all  # NEW: --codex
├── selectedRuntimes includes 'codex'                           # NEW
├── getDirName('codex') → '.codex'                              # NEW
├── getGlobalDir('codex') → CODEX_HOME || ~/.codex              # NEW
├── installAllRuntimes()
│   └── for each runtime: install()
│       ├── ... existing paths ...
│       ├── Codex path (NEW):
│       │   ├── copyCodexSkills()           # Commands → Skills
│       │   ├── get-shit-done/ via copyWithPathReplacement()    # Reuse existing
│       │   ├── generateCodexAgentsMd()     # AGENTS.md generation
│       │   ├── Skip agents (Codex uses AGENTS.md, not agent files)
│       │   ├── Skip hooks (Codex has no hook system)
│       │   └── Skip settings.json (Codex uses config.toml)
│       └── finishInstall() with Codex-specific completion message
├── convertClaudeToCodexSkill()             # NEW: Codex adapter
├── generateCodexAgentsMd()                 # NEW: AGENTS.md generator
└── uninstall() extended for Codex          # NEW: cleanup skills + AGENTS.md
```

### Codex Installation File Layout

```
~/.codex/
├── skills/                       # GSD commands as Skills
│   ├── gsd-help/
│   │   └── SKILL.md              # Converted from commands/gsd/help.md
│   ├── gsd-new-project/
│   │   └── SKILL.md
│   ├── gsd-plan-phase/
│   │   └── SKILL.md
│   ├── gsd-execute-phase/
│   │   └── SKILL.md
│   ├── gsd-resume-work/
│   │   └── SKILL.md
│   └── ... (32 total commands)
├── get-shit-done/                # Reference docs, workflows, templates
│   ├── workflows/
│   ├── references/
│   ├── templates/
│   ├── CHANGELOG.md
│   └── VERSION
├── AGENTS.md                     # GSD workflow instructions (global)
└── config.toml                   # NOT touched by GSD installer
```

### Pattern 1: SKILL.md Conversion from Claude Command

**What:** Convert a Claude Code command (`.md` with YAML frontmatter) into a Codex Skill directory with SKILL.md
**When to use:** Every GSD command during Codex installation

**Input** (Claude Code `commands/gsd/new-project.md`):
```yaml
---
name: gsd:new-project
description: Initialize a new project with deep context gathering and PROJECT.md
argument-hint: "[--auto]"
allowed-tools:
  - Read
  - Bash
  - Write
  - Task
  - AskUserQuestion
---
[Command body]
```

**Output** (Codex `~/.codex/skills/gsd-new-project/SKILL.md`):
```yaml
---
name: gsd-new-project
description: Initialize a new project with deep context gathering and PROJECT.md. Use when starting fresh project planning.
---
[Command body with path replacements and tool name substitutions]
```

**Conversion rules:**
1. `name:` -- Convert `gsd:command-name` to `gsd-command-name` (hyphen-case, lowercase)
2. `description:` -- Keep, but trim to max 1024 chars; no angle brackets
3. `allowed-tools:` -- **Drop** (Skills support `allowed-tools` in schema, but Codex does not enforce per-skill tool restrictions in the same way. Custom prompts never supported them. Simpler to omit -- Codex capability matrix already states `tool_permissions: N`)
4. `argument-hint:` -- Drop (not a valid SKILL.md field; embed argument info in description or body)
5. `color:` -- Drop (not supported)
6. Body: Apply `replacePathsInContent()` for paths, tool name mapping for inline references, command invocation pattern changes
7. Directory: Create `~/.codex/skills/gsd-command-name/SKILL.md`

### Pattern 2: AGENTS.md Generation

**What:** Generate a global `~/.codex/AGENTS.md` with GSD workflow awareness
**When to use:** During Codex installation

**Strategy:** AGENTS.md has a 32 KiB default limit (`project_doc_max_bytes`). It should be concise -- providing GSD workflow awareness and command discovery, NOT the full agent spec content (which would exceed 32KB). Skills handle the detailed command instructions.

```markdown
# GSD Workflow System

GSD (Get Shit Done) is installed as Codex skills for structured project planning and execution.

## Available Commands

Use `/skills` or type `$gsd-` to see available GSD commands:

- `$gsd-help` -- Show all commands and usage
- `$gsd-new-project` -- Initialize a new project
- `$gsd-plan-phase N` -- Plan phase N
- `$gsd-execute-phase N` -- Execute phase N
- `$gsd-resume-work` -- Resume work from last session
- `$gsd-pause-work` -- Save state for later resumption
- ... (key commands listed)

## Workflow Conventions

- All project state lives in `.planning/` (git-committed)
- Follow existing ROADMAP.md phases in order
- Verify each task before marking complete
- Use atomic git commits per task

## Knowledge Base

The shared knowledge base is at `~/.gsd/knowledge/`. Read `~/.gsd/knowledge/index.md` before starting work to surface relevant lessons and spike decisions.

## Runtime Note

This runtime has limited capabilities compared to Claude Code:
- No parallel agent execution (plans execute sequentially)
- No session hooks (update checks happen on command invocation)
- No per-command tool restrictions (all tools available)

See `~/.codex/get-shit-done/references/capability-matrix.md` for details.
```

**Installer behavior:**
- If `~/.codex/AGENTS.md` does NOT exist: write it
- If `~/.codex/AGENTS.md` EXISTS: check for GSD marker comment. If present, replace the GSD section. If absent, append GSD section with clear delimiter markers

### Pattern 3: Tool Name Mapping for Codex

**What:** Replace Claude Code tool name references in command body text
**When to use:** In `convertClaudeToCodexSkill()` content transformation

```javascript
// Tool name mapping from Claude Code to Codex CLI
// Source: Codex CLI tool system (codex-rs)
const claudeToCodexTools = {
  Read: 'read_file',
  Write: 'apply_patch',
  Edit: 'apply_patch',
  Bash: 'shell',
  Glob: 'list_dir',
  Grep: 'grep_files',
  WebSearch: 'web_search',
  WebFetch: null,            // Not available in Codex
  AskUserQuestion: 'request_user_input',
  Task: null,                // Not directly available (sequential degradation)
  TodoWrite: 'update_plan',
  SlashCommand: null,        // No equivalent
};
```

**Important:** Tool name mapping applies to inline body text references only (e.g., "use the Read tool" becomes "use the read_file tool"). Skills do not enforce tool restrictions via frontmatter like Claude Code does, so frontmatter tool mapping is not needed.

**Confidence:** MEDIUM on exact tool names -- derived from codex-rs source analysis and DeepWiki, not official tool name documentation. The tool names `read_file`, `apply_patch`, `shell` are well-attested. `list_dir`, `grep_files` are less certain. Validation during implementation is recommended.

### Pattern 4: Command Invocation Pattern Changes

**What:** Replace `/gsd:command` references with Codex-appropriate `$gsd-command` or `/skills` references
**When to use:** In body text of converted skills and reference docs

```javascript
// Replace /gsd:command-name with $gsd-command-name for Codex skill mention syntax
content = content.replace(/\/gsd:([a-z0-9-]+)/g, '$gsd-$1');
```

This parallels the existing OpenCode pattern (`/gsd:` -> `/gsd-`).

### Anti-Patterns to Avoid

- **Installing commands as custom prompts:** Custom prompts are officially deprecated. Use Skills even though the invocation pattern differs slightly.
- **Putting full agent specs in AGENTS.md:** The 32KB limit means AGENTS.md should provide awareness and discovery, not full agent specifications. Skills handle detailed instructions.
- **Writing to `~/.codex/config.toml`:** Codex manages its own configuration. GSD only installs skills, AGENTS.md, and reference docs.
- **Reusing `copyFlattenedCommands()` for Codex:** The OpenCode flat copy function is similar but produces different output (`.md` files in `command/` vs directories in `skills/`). Write a dedicated `copyCodexSkills()` function.
- **Installing agent files for Codex:** Codex has its own agent system. GSD agent specs should NOT be installed to `~/.codex/agents/`. Agent-level instructions go in AGENTS.md and workflow reference docs.
- **Using `~/.agents/skills/` instead of `~/.codex/skills/`:** While `~/.agents/skills/` is the newer path, it crosses the boundary of the Codex config directory. Each runtime's installer should install to ITS OWN config directory. Using `~/.codex/skills/` maintains the established pattern from Claude/OpenCode/Gemini where files go under the runtime's config dir.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Path replacement | Custom Codex-specific regex | `replacePathsInContent(content, '~/.codex/')` | Centralized two-pass function already handles KB protection + runtime paths |
| YAML frontmatter parsing | Full YAML parser | Line-by-line parsing (existing pattern) | Same approach used for OpenCode and Gemini converters; handles all GSD frontmatter |
| Skill name validation | Custom regex | Codex naming rules: `^[a-z0-9-]+$`, max 64 chars, no leading/trailing/consecutive hyphens | GSD command names already conform (`gsd-help`, `gsd-new-project`, etc.) |
| AGENTS.md section management | Full markdown parser | Delimiter comments: `<!-- GSD:BEGIN -->` ... `<!-- GSD:END -->` | Simple string operations for idempotent section replacement |
| Tool name mapping | Runtime introspection | Static mapping object (same pattern as `claudeToOpencodeTools` and `claudeToGeminiTools`) | Tool names are stable; runtime detection is unreliable |
| `codex exec` integration | Custom CLI wrapper | Documentation-only (reference doc) | `codex exec "prompt"` is already the standard pattern; GSD just needs to document it |

**Key insight:** This phase follows the exact same architectural pattern as the existing OpenCode and Gemini integrations -- a conversion function, a copy function, and runtime-specific install logic in `install()`. The only genuinely new component is AGENTS.md generation, which has no equivalent in other runtimes.

## Common Pitfalls

### Pitfall 1: Skills Triggering Implicitly on Unrelated Tasks

**What goes wrong:** Codex implicitly activates a GSD skill (e.g., `gsd-plan-phase`) because the user's prompt matches the skill description, even when they did not intend to use GSD.
**Why it happens:** Skills are designed for implicit invocation -- Codex selects skills based on description matching. If `gsd-plan-phase` has description "Plan a project phase," any prompt about "planning" might trigger it.
**How to avoid:** Write skill descriptions that are NARROW and include negative triggers. Example: "Plan a specific GSD phase by number (requires an active .planning/ directory with ROADMAP.md). Do NOT use for general project planning." The description should make it clear this skill requires GSD project context.
**Warning signs:** Users report GSD skills activating during non-GSD work in Codex.

### Pitfall 2: AGENTS.md Exceeding 32KB Limit

**What goes wrong:** The GSD AGENTS.md section is too large, and when concatenated with other AGENTS.md content from the project and parent directories, the total exceeds the 32KB `project_doc_max_bytes` limit. Codex silently truncates.
**Why it happens:** Over-engineering the AGENTS.md with full workflow specs, agent behaviors, and reference content.
**How to avoid:** Keep the GSD AGENTS.md section under 4KB (leaves room for project-level AGENTS.md). Include only: command discovery, workflow conventions, KB location, runtime capability notes. Detailed instructions belong in skills and reference docs.
**Warning signs:** The generated AGENTS.md section exceeds 4KB; users report Codex missing GSD context.

### Pitfall 3: Forgetting to Create Skill Directories

**What goes wrong:** Writing `gsd-help.md` directly to `~/.codex/skills/` instead of creating `~/.codex/skills/gsd-help/SKILL.md`. Codex does not recognize flat files as skills -- it requires a directory structure.
**Why it happens:** Following the OpenCode flat-file pattern (`command/gsd-help.md`) instead of the Codex directory-per-skill pattern.
**How to avoid:** The `copyCodexSkills()` function must create a directory per command, then write `SKILL.md` inside it.
**Warning signs:** Codex `/skills` listing shows no GSD skills despite files existing.

### Pitfall 4: `--all` Flag Not Including Codex

**What goes wrong:** Running `npx get-shit-done-reflect-cc --all --global` installs for Claude, OpenCode, and Gemini but not Codex.
**Why it happens:** The `--all` array (`selectedRuntimes = ['claude', 'opencode', 'gemini']`) was not updated.
**How to avoid:** Update the `--all` code path: `selectedRuntimes = ['claude', 'opencode', 'gemini', 'codex']`. Update the interactive prompt to show 5 options (4 individual + All). Update help text.
**Warning signs:** `--all` output shows 3 runtimes instead of 4.

### Pitfall 5: Double Path Replacement for `@~/.claude/` File References

**What goes wrong:** Claude Code's `@~/.claude/get-shit-done/file.md` file reference syntax gets path-replaced to `@~/.codex/get-shit-done/file.md`, but Codex does not support the `@` file reference syntax.
**Why it happens:** `replacePathsInContent()` replaces `~/.claude/` inside `@~/.claude/...` references because the `@` is not part of the match.
**How to avoid:** For Codex, convert `@~/.codex/path/to/file.md` references to explicit read instructions: "Read the file at `~/.codex/path/to/file.md`" or remove the `@` prefix. This conversion should happen in `convertClaudeToCodexSkill()`.
**Warning signs:** Codex skills contain `@~/.codex/...` references that Codex cannot resolve.

### Pitfall 6: Skill Name Validation Failures

**What goes wrong:** A GSD command name that does not conform to Codex's skill naming rules (`^[a-z0-9-]+$`, max 64 chars) fails validation.
**Why it happens:** GSD command names like `gsd:help` use colons, which are not valid in skill names.
**How to avoid:** All GSD commands are under `commands/gsd/` with filenames like `help.md`, `new-project.md`. The skill name becomes `gsd-help`, `gsd-new-project`. These already conform to Codex naming rules. Verify no edge cases exist (e.g., filenames with underscores or special characters).
**Warning signs:** Codex rejects a skill with a validation error about the name field.

### Pitfall 7: Uninstall Not Cleaning Up Skill Directories

**What goes wrong:** Running `--uninstall --codex` removes individual files but leaves empty `gsd-*/` directories in `~/.codex/skills/`.
**Why it happens:** The uninstall function uses `fs.unlinkSync()` for files, but Skills are directories.
**How to avoid:** The Codex uninstall path must use `fs.rmSync(skillDir, { recursive: true })` to remove skill directories, not just files. Pattern: iterate `~/.codex/skills/`, find directories starting with `gsd-`, remove them recursively.
**Warning signs:** After uninstall, `ls ~/.codex/skills/gsd-*` still shows directories.

## Code Examples

### Example 1: convertClaudeToCodexSkill()

```javascript
// Source: Derived from existing convertClaudeToOpencodeFrontmatter() + Codex Skills docs
function convertClaudeToCodexSkill(content, commandName) {
  // Step 1: Replace tool name references in body text
  let converted = content;
  for (const [claudeTool, codexTool] of Object.entries(claudeToCodexTools)) {
    if (codexTool === null) continue; // Skip tools that don't exist in Codex
    // Use word boundary to avoid partial matches
    converted = converted.replace(new RegExp(`\\b${claudeTool}\\b`, 'g'), codexTool);
  }

  // Step 2: Replace /gsd:command with $gsd-command for Codex skill mention
  converted = converted.replace(/\/gsd:([a-z0-9-]+)/g, '\\$gsd-$1');

  // Step 3: Convert @~/.codex/ file references to explicit read instructions
  // (After path replacement has already changed ~/.claude/ to ~/.codex/)
  converted = converted.replace(/@(~\/\.codex\/[^\s]+)/g, 'Read the file at `$1`');

  // Step 4: Parse frontmatter and rebuild as SKILL.md format
  if (!converted.startsWith('---')) {
    // No frontmatter -- create minimal SKILL.md
    return `---\nname: ${commandName}\ndescription: GSD command: ${commandName}\n---\n\n${converted}`;
  }

  const endIndex = converted.indexOf('---', 3);
  if (endIndex === -1) return converted;

  const frontmatter = converted.substring(3, endIndex).trim();
  const body = converted.substring(endIndex + 3);

  // Parse frontmatter fields
  let description = '';
  const lines = frontmatter.split('\n');
  let inArrayField = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('description:')) {
      description = trimmed.substring(12).trim();
      inArrayField = false;
      continue;
    }

    // Skip fields not in SKILL.md schema
    if (trimmed.startsWith('name:') ||
        trimmed.startsWith('allowed-tools:') ||
        trimmed.startsWith('argument-hint:') ||
        trimmed.startsWith('color:')) {
      inArrayField = trimmed.startsWith('allowed-tools:');
      continue;
    }

    // Skip array items from allowed-tools
    if (inArrayField && trimmed.startsWith('- ')) {
      continue;
    } else if (inArrayField && !trimmed.startsWith('-')) {
      inArrayField = false;
    }
  }

  // Truncate description to 1024 chars, no angle brackets
  description = description.replace(/[<>]/g, '').substring(0, 1024);
  if (!description) {
    description = `GSD command: ${commandName}`;
  }

  return `---\nname: ${commandName}\ndescription: ${description}\n---${body}`;
}
```

### Example 2: copyCodexSkills()

```javascript
// Source: Derived from existing copyFlattenedCommands() pattern
function copyCodexSkills(srcDir, destDir, prefix, pathPrefix) {
  if (!fs.existsSync(srcDir)) return;

  // Clean existing GSD skills before copying new ones
  if (fs.existsSync(destDir)) {
    for (const entry of fs.readdirSync(destDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith(`${prefix}-`)) {
        fs.rmSync(path.join(destDir, entry.name), { recursive: true });
      }
    }
  } else {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);

    if (entry.isDirectory()) {
      // Recurse: commands/gsd/debug/start.md -> skills/gsd-debug-start/SKILL.md
      copyCodexSkills(srcPath, destDir, `${prefix}-${entry.name}`, pathPrefix);
    } else if (entry.name.endsWith('.md')) {
      const baseName = entry.name.replace('.md', '');
      const skillName = `${prefix}-${baseName}`;
      const skillDir = path.join(destDir, skillName);

      fs.mkdirSync(skillDir, { recursive: true });

      let content = fs.readFileSync(srcPath, 'utf8');
      content = replacePathsInContent(content, pathPrefix);
      content = processAttribution(content, getCommitAttribution('codex'));
      content = convertClaudeToCodexSkill(content, skillName);

      fs.writeFileSync(path.join(skillDir, 'SKILL.md'), content);
    }
  }
}
```

### Example 3: generateCodexAgentsMd()

```javascript
// Source: Codex AGENTS.md guide (developers.openai.com/codex/guides/agents-md/)
function generateCodexAgentsMd(targetDir, pathPrefix) {
  const agentsMdPath = path.join(targetDir, 'AGENTS.md');
  const GSD_BEGIN = '<!-- GSD:BEGIN -->';
  const GSD_END = '<!-- GSD:END -->';

  const gsdSection = `${GSD_BEGIN}
# GSD Workflow System

GSD (Get Shit Done) is installed as Codex skills for structured project planning and execution.

## Available Commands

Use \`/skills\` or type \`$gsd-\` to discover GSD commands:

| Command | Purpose |
|---------|---------|
| \`$gsd-help\` | Show all commands and usage |
| \`$gsd-new-project\` | Initialize a new project |
| \`$gsd-plan-phase\` | Plan a project phase |
| \`$gsd-execute-phase\` | Execute a planned phase |
| \`$gsd-resume-work\` | Resume from last session |
| \`$gsd-pause-work\` | Save state for later |
| \`$gsd-progress\` | Show project progress |
| \`$gsd-signal\` | Record a signal (insight, mistake, etc.) |

## Workflow Conventions

- All project state lives in \`.planning/\` (git-committed, runtime-agnostic)
- Follow existing ROADMAP.md phases in order
- Verify each task before marking complete
- Use atomic git commits per completed task
- Read \`~/.gsd/knowledge/index.md\` before starting work for relevant lessons

## Runtime Capabilities

This runtime operates with limited capabilities:
- **No parallel agents** -- plans execute sequentially in the main context
- **No session hooks** -- update checks happen on command invocation
- **No per-command tool restrictions** -- all tools available

See \`${pathPrefix}get-shit-done/references/capability-matrix.md\` for the full matrix.

## Non-Interactive Usage

For scripted/CI workflows: \`codex exec --full-auto "use the gsd-execute-phase skill for phase N"\`
${GSD_END}`;

  if (fs.existsSync(agentsMdPath)) {
    let existing = fs.readFileSync(agentsMdPath, 'utf8');
    const beginIdx = existing.indexOf(GSD_BEGIN);
    const endIdx = existing.indexOf(GSD_END);

    if (beginIdx !== -1 && endIdx !== -1) {
      // Replace existing GSD section
      existing = existing.substring(0, beginIdx) + gsdSection +
                 existing.substring(endIdx + GSD_END.length);
    } else {
      // Append GSD section
      existing = existing.trimEnd() + '\n\n' + gsdSection + '\n';
    }
    fs.writeFileSync(agentsMdPath, existing);
  } else {
    fs.writeFileSync(agentsMdPath, gsdSection + '\n');
  }
}
```

### Example 4: Install Function Codex Path

```javascript
// Source: Derived from install() function pattern for OpenCode/Gemini
// In install(isGlobal, runtime = 'claude'):

const isCodex = runtime === 'codex';

// Codex-specific labels
if (isCodex) runtimeLabel = 'Codex CLI';

// Command installation
if (isCodex) {
  // Codex: Skills in skills/ directory
  const skillsDir = path.join(targetDir, 'skills');
  fs.mkdirSync(skillsDir, { recursive: true });
  const gsdSrc = path.join(src, 'commands', 'gsd');
  copyCodexSkills(gsdSrc, skillsDir, 'gsd', pathPrefix);
  const count = fs.readdirSync(skillsDir).filter(d =>
    d.startsWith('gsd-') && fs.statSync(path.join(skillsDir, d)).isDirectory()
  ).length;
  console.log(`  ${green}+${reset} Installed ${count} skills to skills/`);
} else if (isOpencode) {
  // ... existing OpenCode path ...
}

// Agent installation -- skip for Codex
if (!isCodex) {
  // ... existing agent copy loop ...
}

// AGENTS.md generation -- Codex only
if (isCodex) {
  generateCodexAgentsMd(targetDir, pathPrefix);
  console.log(`  ${green}+${reset} Generated AGENTS.md`);
}

// Hook registration -- skip for Codex (no hook system)
if (!isOpencode && !isCodex) {
  // ... existing hook registration ...
}
```

### Example 5: Codex Uninstall

```javascript
// Source: Derived from existing uninstall() function pattern
// In uninstall():

if (isCodex) {
  // Remove GSD skills (directories, not flat files)
  const skillsDir = path.join(targetDir, 'skills');
  if (fs.existsSync(skillsDir)) {
    for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
      if (entry.isDirectory() && entry.name.startsWith('gsd-')) {
        fs.rmSync(path.join(skillsDir, entry.name), { recursive: true });
        removedCount++;
      }
    }
    console.log(`  ${green}+${reset} Removed GSD skills`);
  }
} else if (isOpencode) {
  // ... existing ...
}

// Remove GSD section from AGENTS.md
if (isCodex) {
  const agentsMdPath = path.join(targetDir, 'AGENTS.md');
  if (fs.existsSync(agentsMdPath)) {
    let content = fs.readFileSync(agentsMdPath, 'utf8');
    const beginIdx = content.indexOf('<!-- GSD:BEGIN -->');
    const endIdx = content.indexOf('<!-- GSD:END -->');
    if (beginIdx !== -1 && endIdx !== -1) {
      content = content.substring(0, beginIdx) +
                content.substring(endIdx + '<!-- GSD:END -->'.length);
      content = content.trim();
      if (content.length === 0) {
        fs.unlinkSync(agentsMdPath);
      } else {
        fs.writeFileSync(agentsMdPath, content + '\n');
      }
      console.log(`  ${green}+${reset} Removed GSD section from AGENTS.md`);
    }
  }
}
```

### Example 6: Test for Codex Skill Installation

```javascript
// Source: Derived from existing install.test.js patterns
tmpdirTest('--codex flag installs skills to codex config directory', async ({ tmpdir }) => {
  execSync(`node "${installScript}" --codex --global`, {
    env: { ...process.env, HOME: tmpdir },
    cwd: tmpdir,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000
  });

  const codexDir = path.join(tmpdir, '.codex');

  // Verify skills directory with gsd-*/SKILL.md structure
  const skillsDir = path.join(codexDir, 'skills');
  expect(fs.existsSync(skillsDir)).toBe(true);

  // Check at least one skill exists with correct structure
  const helpSkill = path.join(skillsDir, 'gsd-help', 'SKILL.md');
  expect(fs.existsSync(helpSkill)).toBe(true);

  // Verify SKILL.md has correct frontmatter
  const skillContent = fs.readFileSync(helpSkill, 'utf8');
  expect(skillContent).toMatch(/^---\nname: gsd-help/);
  expect(skillContent).toContain('description:');
  // No disallowed frontmatter fields
  expect(skillContent).not.toMatch(/^allowed-tools:/m);
  expect(skillContent).not.toMatch(/^color:/m);

  // Verify paths are transformed
  expect(skillContent).not.toContain('~/.claude/');
  // KB paths should reference ~/.gsd/knowledge/ (already migrated in source)
  if (skillContent.includes('gsd-knowledge') || skillContent.includes('.gsd/knowledge')) {
    expect(skillContent).toContain('~/.gsd/knowledge');
    expect(skillContent).not.toContain('~/.codex/gsd-knowledge');
  }

  // Verify get-shit-done reference docs installed
  const gsdDir = path.join(codexDir, 'get-shit-done');
  expect(fs.existsSync(gsdDir)).toBe(true);

  // Verify AGENTS.md generated
  const agentsMd = path.join(codexDir, 'AGENTS.md');
  expect(fs.existsSync(agentsMd)).toBe(true);
  const agentsContent = fs.readFileSync(agentsMd, 'utf8');
  expect(agentsContent).toContain('<!-- GSD:BEGIN -->');
  expect(agentsContent).toContain('$gsd-help');

  // Verify NO agents directory (Codex uses AGENTS.md instead)
  const agentsDir = path.join(codexDir, 'agents');
  const hasGsdAgents = fs.existsSync(agentsDir) &&
    fs.readdirSync(agentsDir).some(f => f.startsWith('gsd-'));
  expect(hasGsdAgents).toBe(false);

  // Verify NO hooks directory (Codex has no hook system)
  const hooksDir = path.join(codexDir, 'hooks');
  expect(fs.existsSync(hooksDir)).toBe(false);
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom prompts (`~/.codex/prompts/*.md`) | Skills (`~/.codex/skills/*/SKILL.md`) | Codex 0.94+ (Feb 2026) | Custom prompts deprecated; Skills are the forward path |
| `~/.codex/skills/` discovery only | `~/.agents/skills/` as primary, `~/.codex/skills/` as legacy | Codex 0.95 (Feb 2026) | Both paths work; `~/.codex/skills/` is still supported |
| SKILL.toml format | SKILL.md with YAML frontmatter | Codex 0.93 (Jan 2026) | TOML format removed; Markdown is now standard |
| 3 runtimes in `--all` | 4 runtimes in `--all` | Phase 15 (this phase) | Codex joins Claude, OpenCode, Gemini |

**Deprecated/outdated:**
- **Custom prompts:** Officially deprecated in favor of Skills. Do not use `~/.codex/prompts/`.
- **SKILL.toml:** Removed in Codex 0.93. Only SKILL.md with YAML frontmatter is supported.
- Prior STACK.md research recommended custom prompts -- this is now outdated.

## Open Questions

1. **Exact Codex Tool Names**
   - What we know: `read_file`, `apply_patch`, `shell` are well-attested from codex-rs source. `web_search` confirmed by documentation.
   - What's unclear: Whether `list_dir`, `grep_files`, `request_user_input`, `update_plan` are the exact current names. Codex CLI updates frequently (Rust-based).
   - Recommendation: Use the documented/attested names. Include a mapping object that is easy to update. Tool name references in body text are advisory (LLMs understand semantic equivalents), so minor inaccuracies do not break functionality.

2. **`@` File Reference Syntax in Codex**
   - What we know: Claude Code uses `@~/.claude/path/file.md` for file inclusion. Codex does not document this syntax.
   - What's unclear: Whether Codex has any file reference syntax, or if the `@` references will simply be ignored/treated as text.
   - Recommendation: Convert `@~/.codex/path` to explicit "Read the file at `~/.codex/path`" instructions. This is safe regardless of whether Codex supports `@` references.

3. **Skills Discovery Path: `~/.codex/skills/` vs `~/.agents/skills/`**
   - What we know: Codex 0.95+ prefers `~/.agents/skills/` but supports `~/.codex/skills/` for backward compatibility. There is also work on `$AGENTS_HOME/skills`.
   - What's unclear: Whether `~/.codex/skills/` will remain supported long-term, and whether installing to `~/.agents/skills/` would conflict with other tools.
   - Recommendation: Install to `~/.codex/skills/` for now. It keeps GSD files under the runtime's config directory (consistent with Claude, OpenCode, Gemini pattern). If Codex deprecates this path, a future phase can migrate. The path is a single constant in the installer and easy to change.

4. **Implicit Skill Invocation Control**
   - What we know: Skills can be implicitly triggered by Codex based on description matching. This could cause GSD skills to activate unexpectedly.
   - What's unclear: How aggressively Codex auto-activates skills, and whether there is a way to mark skills as explicit-only.
   - Recommendation: Write narrow, precise descriptions with negative triggers. Monitor user reports. If implicit activation is problematic, investigate whether `metadata` frontmatter can control this (not documented), or consider providing an opt-in mechanism.

5. **`codex exec` with Skills**
   - What we know: `codex exec "prompt"` runs non-interactively. Skills are loaded during all sessions.
   - What's unclear: Whether `codex exec` can explicitly invoke a specific skill (e.g., `codex exec "$gsd-plan-phase 5"`), or if the prompt must describe the task naturally and hope Codex selects the right skill.
   - Recommendation: Document both approaches in the reference doc. For CI: `codex exec --full-auto "Use the gsd-execute-phase skill to execute phase N of the project"`. The skill description matching should trigger the right skill.

6. **AGENTS.md Section Management on Re-install**
   - What we know: The installer uses `<!-- GSD:BEGIN/END -->` markers for idempotent section replacement.
   - What's unclear: Whether other tools use similar marker patterns in AGENTS.md, and whether our markers could conflict.
   - Recommendation: Use a distinctive marker: `<!-- GSD:BEGIN (get-shit-done-reflect-cc) -->`. This is unique enough to avoid conflicts.

## Sources

### Primary (HIGH confidence)
- [Codex Agent Skills](https://developers.openai.com/codex/skills) -- SKILL.md format, directory structure, discovery paths, invocation methods
- [Codex Custom Prompts (deprecated)](https://developers.openai.com/codex/custom-prompts/) -- Confirmed deprecated, frontmatter format reference
- [Codex AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/) -- Discovery order, layering, 32KB limit, override mechanism
- [Codex CLI Reference](https://developers.openai.com/codex/cli/reference/) -- `codex exec` flags, non-interactive mode
- [Codex Non-Interactive Mode](https://developers.openai.com/codex/noninteractive/) -- `codex exec` usage, CI patterns, `--full-auto`
- [Codex Config Reference](https://developers.openai.com/codex/config-reference/) -- TOML schema, sandbox modes, approval policies
- [Codex Changelog](https://developers.openai.com/codex/changelog/) -- Version history: 0.93 (SKILL.toml removed), 0.94 (skills from .agents/), 0.95 (~/.agents/skills/ + ~/.codex/skills/ compat)
- `bin/install.js` -- Direct codebase analysis of all conversion functions, install paths, export patterns (1924 lines)
- `get-shit-done/references/capability-matrix.md` -- Existing Codex capability declarations (Phase 13)

### Secondary (MEDIUM confidence)
- [SKILL.md Format Specification (DeepWiki)](https://deepwiki.com/openai/skills/8.1-skill.md-format-specification) -- Allowed frontmatter fields: name, description, license, allowed-tools, metadata. Validation rules.
- [Codex Tool System (DeepWiki)](https://deepwiki.com/openai/codex/6-node.js-implementation-(codex-cli)) -- Tool name registry reference
- Phase 13 and Phase 14 RESEARCH.md -- Prior research on path replacement system, capability matrix, KB migration
- `.planning/research/STACK.md` -- Original Codex integration research (custom prompts recommendation now outdated)
- `.planning/research/ARCHITECTURE.md` -- Codex integration architecture, AGENTS.md design
- `.planning/research/PITFALLS.md` -- Codex impedance mismatch analysis

### Tertiary (LOW confidence)
- Exact Codex tool names (`list_dir`, `grep_files`, `request_user_input`) -- derived from codex-rs source analysis, not official API documentation. May change between Codex versions.

## Knowledge Applied

Checked knowledge base (`~/.claude/gsd-knowledge/index.md`) -- knowledge base directory does not exist. No KB entries to surface.

## Metadata

**Confidence breakdown:**
- Installer architecture: HIGH -- complete understanding from Phase 13/14 research + direct codebase analysis of all 1924 lines
- SKILL.md format: HIGH -- verified via official Codex Skills documentation + DeepWiki format specification + changelog version tracking
- Custom prompts deprecation: HIGH -- explicitly stated in official docs: "Custom prompts are deprecated. Use skills."
- AGENTS.md design: HIGH -- verified via official guide; 32KB limit confirmed; layering mechanism documented
- Tool name mapping: MEDIUM -- some names verified via source code (read_file, apply_patch, shell), others from community analysis
- `codex exec` integration: HIGH -- official documentation confirms non-interactive mode with `--full-auto`, `--json`, `--sandbox` flags
- Skill discovery paths: HIGH -- changelog confirms `~/.codex/skills/` compat in 0.95

**Research date:** 2026-02-11
**Valid until:** 2026-02-25 (Codex CLI updates frequently; skill system is new and may evolve)
