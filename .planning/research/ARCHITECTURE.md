# Architecture Research: Multi-Runtime CLI Interop

**Domain:** Multi-runtime CLI tool interoperability -- adding 4th runtime, shared KB, cross-runtime handoff
**Researched:** 2026-02-11
**Confidence:** HIGH (direct codebase analysis + official Codex CLI documentation)

## Executive Summary

GSD Reflect currently supports 3 runtimes (Claude Code, OpenCode, Gemini CLI) via a transformation pipeline in `bin/install.js` that converts Claude Code-native markdown commands, agent specs, and path references into runtime-specific formats at install time. The knowledge base lives at `~/.claude/gsd-knowledge/` with hardcoded paths in 20+ workflow and reference files. Adding Codex CLI as a 4th runtime, migrating KB to `~/.gsd/knowledge/`, and enabling cross-runtime handoff requires changes across 3 architectural boundaries: the installer, the KB path layer, and the state/handoff system.

The core architectural insight: **the installer already does path replacement** (`~/.claude/` to runtime-specific paths) for commands and agents. The KB path problem is that KB paths were never routed through this transformation -- they are hardcoded in workflow and reference files that the installer copies but does not path-transform for KB. The fix is not to add more path replacement; it is to move KB to a runtime-agnostic location (`~/.gsd/knowledge/`) so no runtime-specific translation is needed.

## System Overview: Current Architecture

```
                          INSTALLATION TIME
                          (bin/install.js)
                                |
              +-----------------+------------------+
              |                 |                  |
              v                 v                  v
        ~/.claude/        ~/.config/opencode/   ~/.gemini/
        commands/gsd/     command/gsd-*.md      commands/gsd/
        agents/gsd-*      (flat + tool map)     (TOML + tool map)
        get-shit-done/    get-shit-done/        get-shit-done/
        hooks/            (no hooks)            hooks/
        settings.json     opencode.json         settings.json
              |                                     |
              +------ All reference ~/.claude/ ------+
              |       paths in content files         |
              |       (already transformed by        |
              |        install.js per runtime)        |
              v
        ~/.claude/gsd-knowledge/   <-- NOT TRANSFORMED
        signals/                        hardcoded in 20+ files
        spikes/
        lessons/
        index.md
```

### Current Path Transformation Pipeline

The installer (`bin/install.js` lines 655-698, `copyWithPathReplacement`) performs a regex replacement on all `.md` files:

```javascript
const claudeDirRegex = /~\/\.claude\//g;
content = content.replace(claudeDirRegex, pathPrefix);
```

This transforms `~/.claude/get-shit-done/workflows/foo.md` to the correct runtime-specific path. However, **KB paths (`~/.claude/gsd-knowledge/`) get caught in this same regex**, which means:

- **Claude Code install:** KB path stays `~/.claude/gsd-knowledge/` (correct)
- **OpenCode install:** KB path becomes `~/.config/opencode/gsd-knowledge/` (wrong -- KB does not exist there)
- **Gemini install:** KB path becomes `~/.gemini/gsd-knowledge/` (wrong -- KB does not exist there)

This is an existing bug: multi-runtime KB access was never properly addressed because KB was built assuming Claude Code as the only runtime.

## Recommended Architecture: Post-Migration

```
                          INSTALLATION TIME
                          (bin/install.js)
                                |
              +--------+--------+--------+--------+
              |        |        |        |        |
              v        v        v        v        v
        ~/.claude/  ~/.config/  ~/.gemini/ ~/.codex/  ~/.gsd/
        commands/   opencode/   commands/  skills/    knowledge/
        agents/     command/    (TOML)     gsd/       signals/
        get-shit-  get-shit-   agents/    SKILL.md    spikes/
        done/      done/       get-shit-  AGENTS.md   lessons/
        hooks/     (no hooks)  done/      (no hooks)  index.md
        settings   opencode    settings                cache/
        .json      .json       .json                   config.toml
              |        |        |        |              |
              +--------+--------+--------+--------------+
                       All runtimes reference
                       ~/.gsd/knowledge/ directly
                       (no path transformation needed)
```

### Component Responsibilities

| Component | Responsibility | Changes for v1.14 |
|-----------|----------------|-------------------|
| `bin/install.js` | Multi-runtime installer: path replacement, format conversion, hook registration | Add Codex CLI runtime; add `~/.gsd/` directory creation; add KB migration logic |
| `~/.gsd/knowledge/` | Runtime-agnostic knowledge base | NEW -- replaces `~/.claude/gsd-knowledge/` |
| `~/.gsd/config.toml` | Cross-runtime GSD configuration | NEW -- stores active runtimes, KB location, migration state |
| Workflow files (20+) | KB access paths | Change `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/` |
| Reference files (5+) | KB documentation and patterns | Change KB path references |
| `kb-rebuild-index.sh` | Index regeneration | Update KB path |
| `.planning/` state files | Project state, continue-here, STATE.md | Already runtime-agnostic (no changes needed) |
| `continue-here.md` template | Cross-session handoff | Add optional `runtime:` field for cross-runtime handoff |

## Detailed Component Changes

### 1. New Component: `~/.gsd/` Directory

**Purpose:** Runtime-agnostic GSD home directory for data that should be shared across all runtimes.

```
~/.gsd/
  knowledge/           # Migrated from ~/.claude/gsd-knowledge/
    signals/
      {project}/
        {date}-{slug}.md
    spikes/
      {project}/
        {date}-{slug}.md
    lessons/
      {category}/
        {name}.md
    index.md           # Auto-generated index
  cache/               # Shared cache (update checks, etc.)
    gsd-update-check.json
  config.toml          # Cross-runtime config (optional, future)
```

**Why `~/.gsd/` not `~/.config/gsd/`:**
- Consistency with existing pattern (`~/.claude/`, `~/.gemini/`, `~/.codex/`)
- Simpler than XDG for a tool that already uses dotfile directories
- Short path reduces context token cost in agent prompts
- Environment variable override: `GSD_HOME` (defaults to `~/.gsd`)

**Creation:** The installer creates `~/.gsd/knowledge/` during any runtime installation. This is a shared resource, not runtime-specific.

### 2. Modified Component: `bin/install.js`

**Changes needed:**

#### a. Add Codex CLI runtime support

```javascript
// New runtime detection and directory mapping
function getDirName(runtime) {
  if (runtime === 'opencode') return '.opencode';
  if (runtime === 'gemini') return '.gemini';
  if (runtime === 'codex') return '.codex';  // NEW
  return '.claude';
}

function getGlobalDir(runtime, explicitDir = null) {
  // ... existing code ...
  if (runtime === 'codex') {
    if (explicitDir) return expandTilde(explicitDir);
    if (process.env.CODEX_HOME) return expandTilde(process.env.CODEX_HOME);
    return path.join(os.homedir(), '.codex');
  }
  // ... existing code ...
}
```

#### b. Codex CLI command format conversion

Codex CLI uses a **skills** system, not markdown commands:

| Aspect | Claude Code | OpenCode | Gemini | Codex CLI |
|--------|-------------|----------|--------|-----------|
| Command format | `commands/gsd/*.md` | `command/gsd-*.md` | `commands/gsd/*.toml` | `.agents/skills/gsd-*/SKILL.md` or `~/.codex/skills/gsd-*/SKILL.md` |
| Command invocation | `/gsd:help` | `/gsd-help` | `/gsd:help` | `$gsd-help` or implicit |
| Agent format | `agents/gsd-*.md` (YAML frontmatter) | Same (tool mapping) | Same (tool mapping) | Via AGENTS.md + skills |
| Config format | `settings.json` | `opencode.json` | `settings.json` | `config.toml` (TOML) |
| Instructions | Built into commands | Built into commands | Built into commands | `AGENTS.md` (layered) |
| Tool names | `Read`, `Write`, `Bash`, `Grep`, `Glob` | lowercase equivalents | snake_case equivalents | Not specified (likely similar to Claude) |
| Hook system | `settings.json` hooks.SessionStart | N/A | Same as Claude | N/A (no hook system found) |
| Subagent spawning | Task tool | Skill tool | Agents (experimental) | Skills (implicit/explicit) |

**Codex skill structure for GSD commands:**

```
~/.codex/skills/
  gsd-new-project/
    SKILL.md          # Frontmatter: name, description + instructions
  gsd-plan-phase/
    SKILL.md
  gsd-execute-phase/
    SKILL.md
  ...
```

Or project-level (recommended for project-scoped commands):
```
.agents/skills/
  gsd-new-project/
    SKILL.md
  ...
```

**SKILL.md format:**
```markdown
---
name: gsd-new-project
description: Initialize a new GSD project with research, requirements, and roadmap. Use when starting fresh project planning.
---

[Command instructions -- equivalent to command .md body content]
```

**Key difference:** Codex skills support implicit invocation (Codex auto-selects based on task description matching). This means GSD commands could be auto-triggered without explicit `/gsd:` invocation. The `description` field is critical for controlling when skills activate.

#### c. New conversion function: `convertClaudeToCodexSkill()`

```javascript
function convertClaudeToCodexSkill(content, commandName) {
  // Extract body (after frontmatter)
  // Create SKILL.md with:
  //   name: gsd-{commandName}
  //   description: from existing YAML description field
  // Body: command instructions with path replacement
  // Tool names: likely no mapping needed (Codex uses similar names)
  // Replace /gsd: references with $gsd- for skill invocation
}
```

#### d. AGENTS.md generation for Codex

Codex reads `AGENTS.md` for custom instructions (equivalent to Claude's system prompt). The installer should generate:

- `~/.codex/AGENTS.md` -- global GSD instructions (equivalent to the get-shit-done reference docs)
- `.agents/AGENTS.md` -- project-level instructions (generated on `/gsd:new-project`)

This replaces the agent spec model. Instead of individual agent files with YAML frontmatter, Codex uses a single layered AGENTS.md. The GSD agent specs would need to be consolidated into AGENTS.md sections or converted to skills.

#### e. KB migration logic

```javascript
function migrateKB() {
  const oldKBDir = path.join(os.homedir(), '.claude', 'gsd-knowledge');
  const newKBDir = path.join(os.homedir(), '.gsd', 'knowledge');

  if (fs.existsSync(oldKBDir) && !fs.existsSync(newKBDir)) {
    // Copy (not move) to preserve backward compatibility during transition
    copyRecursive(oldKBDir, newKBDir);
    // Write migration marker
    fs.writeFileSync(
      path.join(newKBDir, '.migrated-from'),
      `Migrated from ${oldKBDir} on ${new Date().toISOString()}\n`
    );
    console.log('Migrated knowledge base to ~/.gsd/knowledge/');
  }

  // Create symlink at old location for backward compatibility
  if (fs.existsSync(newKBDir) && !fs.existsSync(oldKBDir)) {
    fs.symlinkSync(newKBDir, oldKBDir);
    console.log('Created symlink ~/.claude/gsd-knowledge/ -> ~/.gsd/knowledge/');
  }
}
```

### 3. Modified Component: KB Path References (20+ files)

**Scope of change:** Every file that references `~/.claude/gsd-knowledge/` must change to `~/.gsd/knowledge/`.

**Files requiring path changes:**

| Category | Files | Path Pattern |
|----------|-------|-------------|
| Workflows | `signal.md`, `collect-signals.md`, `reflect.md`, `health-check.md` | `~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/` |
| References | `knowledge-surfacing.md`, `signal-detection.md`, `reflection-patterns.md`, `health-check.md`, `spike-execution.md` | Same |
| Scripts | `kb-rebuild-index.sh` | `$HOME/.claude/gsd-knowledge` -> `$HOME/.gsd/knowledge` |
| Tests | `kb-infrastructure.test.js`, `kb-write.test.js`, `run-smoke.sh`, `standard-signal.js` | Same |
| Agent specs | `.claude/agents/knowledge-store.md` (installed copy) | Handled by installer path replacement |

**Strategy:** Since these files are in the repo (source of truth), change them in the repo. The installer's existing `~/.claude/` path replacement will NOT affect `~/.gsd/` paths, which is exactly what we want -- KB paths should be the same across all runtimes.

**Important consideration:** The installer currently does `content.replace(/~\/\.claude\//g, pathPrefix)`. This would NOT catch `~/.gsd/` paths, meaning KB paths will correctly pass through unchanged for all runtimes. This is the desired behavior.

### 4. Modified Component: Continue-Here Template

**Current template** (`get-shit-done/templates/continue-here.md`):

```yaml
---
phase: XX-name
task: 3
total_tasks: 7
status: in_progress
last_updated: 2025-01-15T14:30:00Z
---
```

**Proposed addition for cross-runtime handoff:**

```yaml
---
phase: XX-name
task: 3
total_tasks: 7
status: in_progress
last_updated: 2025-01-15T14:30:00Z
runtime: claude-code           # NEW: which runtime created this
runtime_version: "1.0.23"      # NEW: runtime version for context
---
```

The `runtime` field is informational, not functional. It tells the resuming agent "this handoff was created by Claude Code" so it can note any runtime-specific context. The `.planning/` state is already runtime-agnostic -- all state files are plain markdown with YAML frontmatter that any runtime can read.

### 5. No Change Needed: `.planning/` State System

The `.planning/` directory is already runtime-agnostic:

- **STATE.md** -- Plain markdown, no runtime-specific paths
- **ROADMAP.md** -- Plain markdown
- **config.json** -- JSON with workflow settings, no runtime paths
- **PLAN.md** -- Markdown task specs
- **SUMMARY.md** -- Execution results
- **continue-here.md** -- Session handoff (adding optional `runtime:` field)

The `@~/.claude/get-shit-done/` references in commands/agents are NOT in `.planning/` files -- they are in the GSD system files that get path-transformed by the installer. The `.planning/` files contain only project state with no references to runtime-specific directories.

**Validation:** Grepped all `.planning/` files and confirmed zero references to `~/.claude/get-shit-done/` in any STATE.md, ROADMAP.md, config.json, PLAN.md, or SUMMARY.md. The only `~/.claude/` references in `.planning/` are in historical phase research docs referencing `~/.claude/gsd-knowledge/` (the KB path), which is the separate migration concern.

### 6. New Component: Runtime Detection Utility

For cross-runtime handoff, the system needs to know which runtime is currently active. This enables:
- Setting the `runtime:` field in continue-here.md
- Displaying runtime context in resume-work
- Conditionally adjusting behavior (e.g., Codex has no hook system)

**Implementation:** Add a `detectRuntime()` function to `gsd-tools.js` or a new `gsd-reflect-tools.js`:

```javascript
function detectRuntime() {
  // Check environment variables set by each runtime
  if (process.env.CLAUDE_CODE_VERSION) return 'claude-code';
  if (process.env.OPENCODE_VERSION) return 'opencode';
  if (process.env.GEMINI_CLI_VERSION) return 'gemini';
  if (process.env.CODEX_VERSION || process.env.CODEX_HOME) return 'codex';

  // Fallback: check which config directory loaded the commands
  // (This is determined by the path prefix the installer used)
  return 'unknown';
}
```

**Confidence:** LOW on the exact environment variables -- each runtime sets different env vars. This needs verification during implementation. The fallback approach of checking the path prefix is more reliable.

## Architectural Patterns

### Pattern 1: Runtime Adapter Pattern

**What:** Each runtime has a transformation adapter in `install.js` that converts GSD's Claude Code-native format to the runtime's native format.

**When to use:** Adding any new runtime.

**Current adapters:**
- Claude Code: identity (no transformation)
- OpenCode: `convertClaudeToOpencodeFrontmatter()` -- flat naming, tool mapping, path swap
- Gemini: `convertClaudeToGeminiToml()` + `convertClaudeToGeminiAgent()` -- TOML commands, tool mapping, strip color
- Codex: NEW -- `convertClaudeToCodexSkill()` -- SKILL.md format, AGENTS.md generation

**Trade-offs:**
- Pro: Each runtime gets native-feeling commands
- Pro: New runtimes can be added without changing core GSD files
- Con: Claude Code is the "source of truth" format -- changes must propagate
- Con: Transformation complexity grows with each runtime

### Pattern 2: Shared Data Directory Pattern

**What:** Data that should be accessible from any runtime lives in a runtime-agnostic directory (`~/.gsd/`).

**When to use:** Any data that needs cross-runtime access (KB, cache, cross-runtime config).

**Trade-offs:**
- Pro: No path transformation needed for shared data
- Pro: Data survives runtime uninstallation
- Pro: Single source of truth for KB
- Con: Adds another directory to manage
- Con: Migration needed for existing users

### Pattern 3: Progressive Migration Pattern

**What:** Migrate data from old location to new location using copy + symlink, not move.

**When to use:** Any path migration where backward compatibility matters.

**Steps:**
1. Copy data to new location
2. Create symlink at old location pointing to new location
3. Update all path references in source files
4. After N versions, remove symlink support

**Trade-offs:**
- Pro: Zero downtime -- old paths still work via symlink
- Pro: Users who don't update immediately are not broken
- Con: Symlink management adds complexity
- Con: Eventual cleanup needed

## Data Flow

### Installation Flow (Updated for 4 Runtimes)

```
npx get-shit-done-reflect-cc
        |
        v
  [Runtime Selection]
  1) Claude Code  2) OpenCode  3) Gemini  4) Codex CLI  5) All
        |
        +---> [Create ~/.gsd/knowledge/ if not exists]
        +---> [Migrate ~/.claude/gsd-knowledge/ if exists]
        |
        +---> [Per-runtime install loop]
              |
              +---> Claude: copyWithPathReplacement(~/.claude/)
              +---> OpenCode: copyFlattenedCommands(~/.config/opencode/)
              +---> Gemini: copyWithPathReplacement(~/.gemini/) + TOML
              +---> Codex: convertToSkills(~/.codex/skills/) + AGENTS.md
              |
              +---> [Hook registration per runtime]
                    Claude: settings.json hooks
                    Gemini: settings.json hooks
                    OpenCode: N/A (no hooks)
                    Codex: N/A (no hook system)
```

### KB Access Flow (Post-Migration)

```
Any Runtime (Claude/OpenCode/Gemini/Codex)
        |
        v
  [Agent reads workflow/reference file]
        |
        v
  [Path: ~/.gsd/knowledge/index.md]  <-- same for all runtimes
        |
        v
  [Read index, select entries]
        |
        v
  [Path: ~/.gsd/knowledge/lessons/{category}/{file}.md]
        |
        v
  [Apply knowledge to current task]
```

### Cross-Runtime Handoff Flow

```
Runtime A (e.g., Claude Code)
        |
  /gsd:pause-work
        |
        v
  [Write .planning/phases/XX/.continue-here.md]
  [Write .planning/STATE.md update]
  [Git commit as WIP]
        |
        v
  [User switches to Runtime B (e.g., Codex CLI)]
        |
  /gsd:resume-work (or $gsd-resume-work in Codex)
        |
        v
  [Read .planning/STATE.md]
  [Read .continue-here.md]
  [Note: "Handoff from claude-code"]
  [Resume work normally]
```

**Key insight:** Cross-runtime handoff already works in principle because `.planning/` is runtime-agnostic and git-committed. The main gaps are:
1. KB not accessible from non-Claude runtimes (fixed by `~/.gsd/` migration)
2. No runtime metadata in handoff file (fixed by optional `runtime:` field)
3. Codex CLI has no equivalent commands installed (fixed by skills conversion)

## Anti-Patterns

### Anti-Pattern 1: Runtime-Specific Paths in Shared Data

**What people do:** Hardcode `~/.claude/` in files that are shared across runtimes.
**Why it is wrong:** The path only works for Claude Code. Other runtimes get broken paths after the installer's regex replacement converts `~/.claude/` to `~/.config/opencode/` etc., pointing KB operations to non-existent directories.
**Do this instead:** Use a runtime-agnostic path (`~/.gsd/`) for shared data that does not get caught by the installer's path replacement regex.

### Anti-Pattern 2: Full Agent Spec Conversion to Skills

**What people do:** Try to convert every GSD agent spec (with YAML frontmatter, tool restrictions, spawning logic) into a Codex skill 1:1.
**Why it is wrong:** Codex skills have a different model. They do not have tool restrictions, they do not spawn subagents the same way (no Task tool equivalent), and they use implicit matching instead of explicit invocation.
**Do this instead:** Convert GSD **commands** to Codex skills (they are the user-facing entry points). Use AGENTS.md for agent-level instructions. Accept that subagent spawning may work differently in Codex -- focus on the user-facing commands first.

### Anti-Pattern 3: Move Instead of Copy for Migration

**What people do:** Use `fs.renameSync` to move KB from old location to new location.
**Why it is wrong:** Users who have not yet updated their GSD installation will have commands pointing to the old location. Moving breaks them immediately.
**Do this instead:** Copy to new location, symlink old to new. Both paths work. Clean up symlink in a future version.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Codex CLI | Skills in `~/.codex/skills/gsd-*/SKILL.md` | New runtime; skills are Codex's command mechanism |
| Codex CLI | AGENTS.md in `~/.codex/AGENTS.md` | Global instructions; equivalent to agent specs |
| npm Registry | Update check via `gsd-check-update.js` | No change; Codex has no hook system so no auto-update check |

### Internal Boundaries

| Boundary | Communication | Changes for v1.14 |
|----------|---------------|-------------------|
| Installer <-> Runtime configs | File writes to runtime-specific directories | Add Codex runtime output |
| Commands <-> KB | File reads/writes via paths in markdown | All paths change from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/` |
| Commands <-> `.planning/` | File reads/writes via relative paths | No change (already runtime-agnostic) |
| Installer <-> `~/.gsd/` | Directory creation, KB migration | NEW boundary |
| Handoff <-> Resume | `.continue-here.md` and `STATE.md` via git | Add optional `runtime:` metadata |

## Codex CLI: Detailed Integration Assessment

### What Works Natively

- **File reading/writing:** Codex can read/write markdown files, including `.planning/` state
- **Shell commands:** Codex can run bash commands (with sandbox policy approval)
- **Git operations:** Codex can run git commands
- **Web search:** Built-in web search capability
- **MCP integration:** Can use MCP tools if configured

### What Needs Adaptation

| GSD Feature | Claude Code | Codex CLI Equivalent | Adaptation Needed |
|-------------|-------------|---------------------|-------------------|
| Slash commands | `/gsd:command` | `$gsd-command` (skill mention) | Convert commands to skills |
| Agent specs | `agents/gsd-*.md` with YAML | `AGENTS.md` + skills | Consolidate or convert |
| Task tool (subagent) | `Task(prompt, subagent_type)` | No direct equivalent | Skills can invoke other skills, but no isolated subagent context window |
| Hooks (SessionStart) | `settings.json` hooks | None | Skip hooks for Codex; no auto-update check |
| Tool restrictions | `allowed-tools:` in frontmatter | Not applicable | Codex does not restrict tools per-command |
| `@` file references | `@~/.claude/get-shit-done/file.md` | No equivalent -- Codex reads files via shell | Convert `@` references to explicit read instructions |

### Critical Limitation: No Subagent Spawning

Codex CLI does not have a direct equivalent of Claude Code's `Task` tool for spawning isolated subagent instances with fresh context windows. This means:

- **Plan execution with wave-based parallelism** will not work the same way
- **Researcher/planner/executor chain** cannot spawn parallel agents
- **Workaround:** Codex `exec` subcommand can run non-interactive tasks, and skills can invoke other skills, but the isolation model is different

**Recommendation:** For v1.14, support Codex CLI for **individual command execution** (one command at a time) but do NOT promise full orchestrated workflow execution (multi-wave plan execution with parallel agents). This matches how most users would use a secondary runtime anyway -- for quick tasks, reviews, and resuming work, not for orchestrating an entire phase execution pipeline.

### Codex CLI Specific Files to Generate

| File | Location | Purpose |
|------|----------|---------|
| `SKILL.md` per command | `~/.codex/skills/gsd-{command}/SKILL.md` | User-facing commands |
| `AGENTS.md` | `~/.codex/AGENTS.md` | Global GSD instructions and agent behaviors |
| `get-shit-done/` | `~/.codex/get-shit-done/` | Reference docs, templates, workflows (same as other runtimes) |

## Suggested Build Order

Given dependencies between components, the recommended phase structure:

```
Phase 1: KB Migration (Foundation)
  - Create ~/.gsd/knowledge/ directory structure
  - Add migration logic to installer (copy + symlink)
  - Update all 20+ source files: ~/.claude/gsd-knowledge/ -> ~/.gsd/knowledge/
  - Update kb-rebuild-index.sh
  - Update tests
  - Verify: KB operations work with new paths
  Dependencies: None (can start immediately)

Phase 2: Cross-Runtime State Audit
  - Verify .planning/ has no runtime-specific paths
  - Add runtime: field to continue-here template
  - Add runtime detection utility
  - Update pause-work and resume-work workflows
  - Verify: pause in one runtime, resume in another
  Dependencies: Phase 1 (KB paths must be fixed first)

Phase 3: Codex CLI Runtime Support
  - Add 'codex' to installer runtime selection
  - Implement convertClaudeToCodexSkill() conversion
  - Generate AGENTS.md from agent specs
  - Install get-shit-done/ reference docs to ~/.codex/
  - Handle Codex-specific limitations (no hooks, no Task tool)
  - Verify: basic commands work in Codex CLI
  Dependencies: Phase 1 (KB paths), Phase 2 (state audit)

Phase 4: Existing Runtime Audit
  - Verify OpenCode installation still works correctly
  - Verify Gemini CLI installation still works correctly
  - Test multi-runtime install (--all flag with 4 runtimes)
  - Verify KB accessible from all runtimes
  Dependencies: Phase 1, Phase 3

Phase 5: Integration Testing & Polish
  - End-to-end: install all 4 runtimes, create project in Claude, resume in Codex
  - KB operations from each runtime
  - Update README, CHANGELOG
  - Version bump
  Dependencies: All previous phases
```

**Ordering rationale:**
- KB migration is the foundation because it unblocks all cross-runtime KB access
- State audit is second because it validates the handoff mechanism before adding a new runtime
- Codex CLI is third because it builds on the fixed KB paths and validated state system
- Existing runtime audit is fourth to catch any regressions from the changes
- Integration testing is last as the verification phase

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 2-3 runtimes | Current approach works -- installer handles per-runtime transformation |
| 4-5 runtimes | Current approach still works but conversion functions multiply. Consider extracting runtime adapters to separate modules. |
| 6+ runtimes | Installer becomes unwieldy. Consider a plugin architecture where each runtime provides its own adapter module. Not needed for v1.14. |

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Codex skill format changes before v1.14 ships | Medium | Medium | Skills API is documented and stable per official docs; pin to current format |
| KB migration breaks existing installations | Low | High | Copy + symlink approach preserves both paths; never destructive |
| Path replacement regex breaks with new `~/.gsd/` paths | Low | Medium | `~/.gsd/` is never caught by `~/.claude/` regex -- verified by regex analysis |
| Codex subagent limitation blocks core workflows | Medium | High | Scope Codex support to individual commands, not full orchestration |
| OpenCode/Gemini regressions from installer changes | Low | Medium | Run existing test suite + manual smoke test after changes |
| AGENTS.md size exceeds Codex 32KiB limit | Medium | Medium | Keep global AGENTS.md to essentials; use skills for detailed instructions |

## Sources

- HIGH confidence: Direct codebase analysis of `bin/install.js` (1765 lines), all workflow/reference files with KB paths
- HIGH confidence: Codex CLI official documentation at [developers.openai.com/codex/cli](https://developers.openai.com/codex/cli/)
- HIGH confidence: Codex CLI config reference at [developers.openai.com/codex/config-reference](https://developers.openai.com/codex/config-reference/)
- HIGH confidence: Codex CLI skills documentation at [developers.openai.com/codex/skills](https://developers.openai.com/codex/skills)
- HIGH confidence: Codex AGENTS.md documentation at [developers.openai.com/codex/guides/agents-md](https://developers.openai.com/codex/guides/agents-md/)
- HIGH confidence: Codex CLI slash commands at [developers.openai.com/codex/cli/slash-commands](https://developers.openai.com/codex/cli/slash-commands/)
- MEDIUM confidence: Runtime detection via environment variables (needs verification during implementation)
- LOW confidence: Exact Codex tool name mapping (not documented; likely similar to Claude Code)

---
*Architecture research for: Multi-Runtime CLI Interop (v1.14)*
*Researched: 2026-02-11*
