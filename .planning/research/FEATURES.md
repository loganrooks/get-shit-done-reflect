# Feature Research: Multi-Runtime CLI Interop

**Domain:** Cross-runtime AI coding agent orchestration (Codex CLI support, shared KB, runtime switching)
**Researched:** 2026-02-11
**Confidence:** HIGH for Codex CLI capabilities (verified via official docs), MEDIUM for cross-runtime patterns (novel territory, limited prior art)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist once "Codex CLI support" is advertised. Missing these means the runtime feels broken or second-class.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Codex CLI command installation | Users expect `npx get-shit-done-reflect-cc --codex` to work like `--claude`/`--gemini` | MEDIUM | Existing installer architecture in `bin/install.js` | Codex uses Skills (SKILL.md in `~/.codex/skills/` or `.agents/skills/`) as its command system. Custom prompts (`~/.codex/prompts/*.md`) are deprecated. Commands must be converted to SKILL.md format with YAML frontmatter (name, description) |
| Codex command invocation | All `/gsd:*` commands must be invocable in Codex CLI | MEDIUM | Command installation above | Codex does not support custom slash commands -- only built-in `/` commands. GSD commands would be invoked as `$gsd-new-project` (skill mention) rather than `/gsd:new-project`. This is a fundamental UX difference from Claude/Gemini |
| Codex AGENTS.md integration | Codex reads AGENTS.md for project context; GSD should generate/update this | LOW | None | Codex has a hierarchical AGENTS.md system (global `~/.codex/AGENTS.md`, project `.AGENTS.md`, per-directory). GSD can write an AGENTS.md that includes GSD workflow context. Max 32 KiB default, configurable via `project_doc_max_bytes` |
| Codex config.toml setup | Installer should configure Codex for GSD (sandbox, model, MCP if needed) | LOW | None | Codex stores config at `~/.codex/config.toml` (TOML, not JSON). Project-level at `.codex/config.toml`. Key settings: `approval_policy`, `sandbox_mode`, `model` |
| Tool name mapping for Codex | Agent files must reference Codex tool names | MEDIUM | Existing tool mapping pattern in `install.js` | Codex tool names differ from Claude. Need to map: Read, Write, Bash, Glob, Grep, etc. to Codex equivalents. Codex uses apply_patch, shell, file_read, file_write, etc. -- exact names need verification via Codex docs or runtime testing |
| .planning/ state readable from Codex | STATE.md, ROADMAP.md, config.json must work from Codex | NONE (already works) | .planning/ is filesystem-based | Project-local `.planning/` is runtime-agnostic. No changes needed -- Codex can read these files directly |
| /gsd:resume-work from Codex | User pauses in Claude, resumes in Codex. Must work | MEDIUM | Codex command installation, .continue-here.md format | The `.continue-here.md` and `STATE.md` files are plain markdown -- readable by any runtime. The challenge is that resume-work references `~/.claude/get-shit-done/workflows/resume-project.md` which Codex won't have at that path |
| Path abstraction in workflows | Workflows reference `~/.claude/` paths; Codex uses `~/.codex/` | MEDIUM | Existing path replacement in `install.js` | Current installer replaces `~/.claude/` with runtime-specific paths. Must extend to `~/.codex/` for Codex. All `@~/.claude/get-shit-done/...` references must resolve correctly |

### Differentiators (Competitive Advantage)

Features that no existing tool provides. These make GSD Reflect uniquely valuable.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| Cross-runtime session continuity | Pause in Claude Code, resume in Codex CLI (or any supported runtime). No other tool does this | HIGH | Codex command installation, KB migration, runtime-agnostic state | The `.planning/` directory is already runtime-agnostic. The challenge is (a) user-level KB at `~/.claude/gsd-knowledge/` is runtime-specific, (b) workflow references embed runtime-specific paths. Solution: runtime-aware path resolution at execution time, not install time |
| Shared knowledge base across runtimes | Signals, lessons, spikes learned in Claude sessions available when using Codex | HIGH | KB path abstraction, cross-runtime KB write/read | Currently hardcoded to `~/.claude/gsd-knowledge/`. Must either: (1) use a runtime-agnostic location like `~/.gsd/knowledge/`, or (2) symlink from each runtime config, or (3) resolve dynamically at read/write time |
| Runtime-aware installer with unified package | Single `npx` command installs to all selected runtimes with correct format conversion per runtime | MEDIUM | Codex skill conversion logic | Current installer already does this for Claude/OpenCode/Gemini. Extending to Codex is incremental, but the Codex format (SKILL.md in directory structure) differs significantly from Claude (commands/*.md), OpenCode (flattened command/*.md), and Gemini (TOML) |
| AGENTS.md generation for Codex projects | Auto-generate AGENTS.md from GSD project context (PROJECT.md, ROADMAP.md) so Codex understands the project | LOW | Codex installation | AGENTS.md is the emerging cross-tool standard (40K+ repos, Linux Foundation governance). Claude Code may eventually support it too (issue #6235 with 2,520+ upvotes). Generating AGENTS.md positions GSD as cross-tool from the start |
| Codex Skills for complex workflows | Package GSD workflows as Codex Skills with scripts, references, and assets | HIGH | Deep Codex Skills understanding | Skills support `scripts/`, `references/`, `assets/` directories alongside SKILL.md. Could package GSD agents as skills with their workflow scripts. This is the most Codex-native approach but requires significant research into how skills interact with each other |
| Cross-runtime KB index with provenance | Track which runtime produced each signal/lesson for debugging and trust calibration | LOW | Shared KB | Add `runtime: codex-cli` or `runtime: claude-code` field to signal/lesson frontmatter. Enables filtering by runtime origin and understanding model-specific patterns |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems in the cross-runtime domain.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time session sync between runtimes | "I want to switch runtimes mid-conversation without pausing" | Each runtime has its own conversation model (Claude uses conversation history, Codex uses JSONL rollout files). Real-time sync would require intercepting internal state that neither runtime exposes via API. The complexity is extreme for marginal benefit | Use explicit pause/resume: `/gsd:pause-work` captures state to `.planning/`, `/gsd:resume-work` restores it. 30-second overhead, 100% reliable |
| Unified conversation history across runtimes | "Show me everything I did across all runtimes" | Conversation formats are incompatible (Claude stores in `~/.claude/`, Codex in `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`). Merging them would require parsing internal formats that change between versions | Track work at the `.planning/` level via STATE.md, SUMMARY.md, and commit history. These are runtime-agnostic and already capture what matters |
| Runtime auto-detection for resume | "Just run /gsd:resume-work and it figures out which runtime I'm in" | Detecting the current runtime from within a session is fragile (environment variable checks, process tree inspection). Each runtime evolves independently -- detection heuristics break | Installer already knows the runtime at install time. Commands are already runtime-specific. The right abstraction is runtime-agnostic state files, not runtime detection |
| Codex CLI subagent spawning via Task tool | "Package GSD agents so they spawn as Codex subagents like Claude's Task tool" | Codex does not have an equivalent to Claude Code's Task tool for spawning subagents with fresh context windows. Codex agents are registered tools, not context-window-isolated subprocesses. Faking this with `codex exec` would lose conversational context | Use Codex's native skill system for complex workflows. Accept that Codex workflows will be more linear (single context window) than Claude's parallel subagent approach. Design workflows that degrade gracefully without Task tool |
| Mirror every Claude Code feature in Codex | "Codex support should be feature-complete with Claude support" | Codex lacks: Task tool (subagent spawning), SlashCommand tool (command chaining), session hooks (SessionStart), statusline, MCP tool auto-naming (mcp__*). Trying to replicate these creates a maintenance nightmare | Codex gets "core workflow support" -- project init, planning, execution, state management. Advanced features (parallel subagents, statusline, hooks) remain Claude-specific. Document the capability matrix clearly |
| Convert Claude CLAUDE.md to Codex AGENTS.md automatically | "Just translate my CLAUDE.md for Codex" | CLAUDE.md and AGENTS.md serve different purposes and have different audiences. CLAUDE.md contains Claude-specific instructions (memory, tool preferences). AGENTS.md is tool-agnostic guidance | Generate AGENTS.md from GSD project state (PROJECT.md, conventions) independently. Let users maintain CLAUDE.md for Claude-specific instructions separately |

## Feature Dependencies

```
Codex Runtime Support (FOUNDATION)
    |
    +-- Codex config directory detection (~/.codex/)
    |       |
    |       +-- Codex config.toml setup
    |       +-- Codex skill installation paths
    |
    +-- Codex command format conversion (commands/*.md -> skills/*/SKILL.md)
    |       |
    |       +-- Tool name mapping (Claude -> Codex)
    |       +-- Path replacement (~/.claude/ -> ~/.codex/)
    |       +-- YAML frontmatter conversion (allowed-tools -> Codex format)
    |
    +-- Codex agent conversion
            |
            +-- Agent file format adaptation

KB Path Abstraction (FOUNDATION for sharing)
    |
    +-- Runtime-agnostic KB location (e.g., ~/.gsd/knowledge/)
    |       |
    |       +-- Migration from ~/.claude/gsd-knowledge/
    |       +-- All workflow path references updated
    |
    +-- KB read/write from any runtime
            |
            +-- Index rebuild from any runtime
            +-- Signal collection from any runtime
            +-- Lesson generation from any runtime

Cross-Runtime Session Continuity
    |
    +-- Codex runtime support (commands work)
    |
    +-- KB path abstraction (knowledge accessible)
    |
    +-- .continue-here.md format (already runtime-agnostic)
    |
    +-- STATE.md format (already runtime-agnostic)
    |
    +-- Runtime field in state files (track which runtime paused)

AGENTS.md Generation (INDEPENDENT -- can be built anytime)
    |
    +-- Read PROJECT.md, ROADMAP.md, conventions
    |
    +-- Generate standard AGENTS.md
```

### Dependency Notes

- **Codex command conversion requires understanding Skills deeply:** Skills use SKILL.md (YAML frontmatter + markdown body) in a directory structure. Each GSD command becomes a skill directory under `.agents/skills/gsd/` or `~/.codex/skills/gsd/`. This is structurally different from Claude (single .md files in commands/gsd/) and Gemini (TOML files in commands/gsd/)
- **KB path abstraction is the hardest dependency:** Currently, 30+ workflow/reference files hardcode `~/.claude/gsd-knowledge/`. Changing this affects Claude Code users (the primary user base). Must be backward-compatible or use symlinks
- **Cross-runtime session continuity requires both foundations:** Commands must work AND KB must be accessible. Half-measures (commands work but KB is invisible) create a confusing experience
- **AGENTS.md generation is independent:** Can be built at any time since it reads from `.planning/` (already runtime-agnostic) and writes to the project root

## Codex CLI Capability Matrix

Critical comparison of what Codex CLI supports vs what GSD Reflect needs.

| GSD Capability | Claude Code | OpenCode | Gemini CLI | Codex CLI | Notes |
|----------------|-------------|----------|------------|-----------|-------|
| Custom slash commands | `/gsd:*` via `commands/gsd/*.md` | `/gsd-*` via `command/gsd-*.md` | `/gsd:*` via `commands/gsd/*.toml` | `$gsd-*` via Skills (SKILL.md) | Codex invokes skills via `$` mention, not `/` slash |
| Agent definitions | YAML frontmatter with allowed-tools | YAML with lowercase tool names | YAML with Gemini tool names | Skills with SKILL.md | Codex agents are skills, not separate agent files |
| Subagent spawning (Task tool) | YES (fresh context window) | YES (skill tool) | YES (agents as tools) | NO equivalent | Codex has no Task tool. Single context window per session. Major architectural difference |
| Session hooks (startup) | SessionStart hooks in settings.json | Not supported | Not supported | Not supported | Statusline and update checks are Claude-specific |
| MCP servers | Configured in settings.json | Configured in opencode.json | Configured in settings.json | Configured in config.toml | All runtimes support MCP but with different config formats |
| Project-level config | `.claude/settings.json` | `.opencode/` | `.gemini/settings.json` | `.codex/config.toml` | Each runtime has its own project-level config |
| Instruction files | CLAUDE.md | Not standardized | GEMINI.md | AGENTS.md | AGENTS.md is the emerging cross-tool standard |
| Web search | Built-in WebSearch tool | Plugin-dependent | google_web_search tool | Built-in (cached or live) | All have web search but different tool names |
| File operations | Read, Write, Edit, Glob, Grep | read, write, edit, glob, grep | read_file, write_file, replace, glob, search_file_content | file_read, file_write, apply_patch, list_dir, text_search | Tool name mapping needed for each runtime |
| Shell execution | Bash tool | bash tool | run_shell_command | shell tool | Different names, same capability |
| Non-interactive execution | Not supported | Not supported | Not supported | `codex exec` | Codex uniquely supports scripted/CI execution |
| Session resume | `/gsd:resume-work` (custom) | `/gsd-resume-work` (custom) | `/gsd:resume-work` (custom) | `codex resume` (built-in) + `$gsd-resume-work` (custom) | Codex has native resume; GSD adds project-level resume |
| Config format | JSON | JSON | JSON | TOML | Codex is the only TOML-based runtime |

## MVP Definition

### Launch With (v1 -- this milestone)

Minimum viable Codex CLI support that validates the cross-runtime concept.

- [ ] **Codex installer path** -- `npx get-shit-done-reflect-cc --codex` installs to `~/.codex/` with correct format conversion. This means Skills directories at `~/.codex/skills/gsd-*/SKILL.md` for commands, and workflow/reference/template files at `~/.codex/get-shit-done/`
- [ ] **Core command set in Codex** -- At minimum: new-project, plan-phase, execute-phase, resume-work, pause-work, progress, help. These cover the primary workflow loop
- [ ] **Tool name mapping for Codex** -- Map Claude tool names to Codex equivalents in all agent/workflow files installed to `~/.codex/`
- [ ] **Path replacement for Codex** -- All `~/.claude/` references replaced with `~/.codex/` in installed files
- [ ] **AGENTS.md generation** -- Installer creates a starter AGENTS.md that references GSD workflows. Or a command generates it from project state
- [ ] **KB path abstraction** -- Move knowledge base to `~/.gsd/knowledge/` (runtime-agnostic) with backward-compatible symlinks from `~/.claude/gsd-knowledge/`
- [ ] **Cross-runtime pause/resume** -- Pause in Claude, resume in Codex. The `.continue-here.md` and `STATE.md` already work; need to verify workflow resolution from Codex paths

### Add After Validation (v1.x)

Features to add once core Codex support works.

- [ ] **Full command set in Codex** -- All 27 commands converted, not just core 7
- [ ] **Codex-optimized workflows** -- Workflows that account for single-context-window execution (no Task tool). May need Codex-specific workflow variants for execute-phase (sequential instead of parallel subagent spawning)
- [ ] **config.toml management** -- GSD commands that read/write `.codex/config.toml` for Codex-specific settings
- [ ] **Runtime provenance in KB** -- `runtime:` field in signal/lesson frontmatter to track which runtime generated each entry
- [ ] **AGENTS.md auto-update** -- Update AGENTS.md when project state changes (new phase, decisions, etc.)

### Future Consideration (v2+)

Features to defer until cross-runtime is proven.

- [ ] **Codex Skills with scripts** -- Package complex GSD workflows as Skills with executable scripts (replaces the need for Task tool in some cases)
- [ ] **Codex exec integration** -- Use `codex exec` for non-interactive GSD operations (CI/CD pipeline integration)
- [ ] **Cross-runtime KB conflict resolution** -- When Claude and Codex both generate signals from the same session, detect and merge duplicates
- [ ] **OpenCode revival** -- Revisit OpenCode support quality with lessons learned from Codex integration
- [ ] **Unified runtime registry** -- Single configuration file listing all installed runtimes and their capabilities, enabling runtime-aware feature degradation

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Phase Implication |
|---------|------------|---------------------|----------|-------------------|
| Codex installer path | HIGH | MEDIUM | P1 | Early -- unblocks everything |
| Core command conversion to Skills | HIGH | MEDIUM | P1 | Early -- validates approach |
| Tool name mapping for Codex | HIGH | LOW | P1 | Part of installer |
| Path replacement for Codex | HIGH | LOW | P1 | Part of installer |
| KB path abstraction | HIGH | HIGH | P1 | Must happen before cross-runtime KB |
| Cross-runtime pause/resume | HIGH | MEDIUM | P1 | Key differentiator to validate |
| AGENTS.md generation | MEDIUM | LOW | P2 | Nice addition, not blocking |
| Full command set | MEDIUM | MEDIUM | P2 | After core validated |
| Codex-optimized workflows | MEDIUM | HIGH | P2 | After discovering pain points |
| Runtime provenance in KB | LOW | LOW | P3 | Polish feature |
| Codex Skills with scripts | LOW | HIGH | P3 | Advanced Codex integration |
| Codex exec for CI | LOW | MEDIUM | P3 | Novel use case |

## Codex CLI Integration Specifics

### Command-to-Skill Conversion

Claude Code commands are Markdown files with YAML frontmatter:

```yaml
---
name: gsd:new-project
description: Initialize a new GSD project
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
---
```

Codex Skills are directories with SKILL.md:

```
~/.codex/skills/gsd-new-project/
    SKILL.md        # Required: name, description, instructions
    references/     # Optional: reference docs
    scripts/        # Optional: executable scripts
    assets/         # Optional: templates, resources
```

SKILL.md format:

```yaml
---
name: gsd-new-project
description: Initialize a new GSD project with research, requirements, and roadmap
---

[Instructions that were in the command body, with tool names converted]
```

Key differences:
- **No allowed-tools**: Codex does not restrict tool access per skill
- **No Task tool**: Cannot spawn subagents. Workflows must be adapted
- **Directory structure**: Each skill is a directory, not a single file
- **Invocation**: `$gsd-new-project` (skill mention) not `/gsd:new-project` (slash command)
- **Implicit invocation**: Codex may auto-select skills based on description matching task context

### AGENTS.md for GSD Projects

GSD should generate an AGENTS.md at the project root that helps Codex (and eventually other tools) understand the project:

```markdown
# Project: [name]

## Build & Test
[from codebase analysis if available]

## GSD Workflow
This project uses GSD Reflect for structured development.
- Project state: .planning/STATE.md
- Phase roadmap: .planning/ROADMAP.md
- Current config: .planning/config.json

## Conventions
[from .planning/codebase/CONVENTIONS.md if available]

## Key Decisions
[from .planning/PROJECT.md Key Decisions if available]
```

### Knowledge Base Path Strategy

Current state: KB lives at `~/.claude/gsd-knowledge/`

Three options evaluated:

| Option | Approach | Pros | Cons | Recommendation |
|--------|----------|------|------|----------------|
| A. Move to `~/.gsd/knowledge/` | New runtime-agnostic location | Clean separation, future-proof | Breaking change for existing users, symlinks needed | RECOMMENDED |
| B. Symlink from each runtime | `~/.codex/gsd-knowledge/ -> ~/.claude/gsd-knowledge/` | No migration, backward compatible | Claude Code remains "primary", asymmetric | Acceptable fallback |
| C. Dynamic resolution | Detect runtime at execution time, resolve path | Most flexible | Complex, fragile, debugging nightmare | Avoid |

**Recommendation: Option A with backward-compatible symlinks.** Move the canonical KB to `~/.gsd/knowledge/`, create symlinks from `~/.claude/gsd-knowledge/` (for existing users) and `~/.codex/gsd-knowledge/` (for Codex users). The installer handles this migration. All new workflow references use `~/.gsd/knowledge/` path.

## Competitor Feature Analysis

No direct competitors exist for cross-runtime AI agent orchestration. The closest comparisons:

| Feature | Aider | Continue.dev | GSD Reflect (proposed) |
|---------|-------|--------------|------------------------|
| Multi-model support | YES (via config) | YES (via config) | YES (via runtime) |
| Custom commands | No | Limited | YES (full workflow system) |
| Project state management | Git-based | None | `.planning/` directory |
| Session continuity | Conversation history | None | STATE.md + .continue-here.md |
| Cross-tool state sharing | N/A (single tool) | N/A (single tool) | YES (via .planning/) |
| Learning/KB system | No | No | YES (signals, lessons, spikes) |
| Structured workflow | No (freeform) | No (freeform) | YES (phase-based roadmap) |

GSD Reflect is the only tool attempting structured cross-runtime orchestration. The risk is being first -- there is no prior art to learn from. The reward is being the only option if it works.

## Sources

- [Codex CLI Slash Commands](https://developers.openai.com/codex/cli/slash-commands/) -- Built-in commands, no custom slash command support
- [Codex Agent Skills](https://developers.openai.com/codex/skills) -- Skill format, invocation, storage locations
- [Codex AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/) -- Hierarchical instruction system, override behavior
- [Codex Configuration Reference](https://developers.openai.com/codex/config-reference/) -- Complete config.toml reference
- [Codex Config Basics](https://developers.openai.com/codex/config-basic/) -- Configuration layering and precedence
- [Codex Advanced Configuration](https://developers.openai.com/codex/config-advanced/) -- Profiles, project-scoped config
- [Codex CLI Features](https://developers.openai.com/codex/cli/features/) -- Session management, tools, automation
- [Codex CLI Reference](https://developers.openai.com/codex/cli/reference/) -- All flags and subcommands
- [Codex Custom Prompts (Deprecated)](https://developers.openai.com/codex/custom-prompts/) -- Deprecated in favor of Skills
- [AGENTS.md Standard](https://agents.md/) -- Open format specification, cross-tool compatibility
- [Claude Code AGENTS.md Support Request](https://github.com/anthropics/claude-code/issues/6235) -- 2,520+ upvotes, not yet implemented
- [Gemini CLI Custom Commands](https://geminicli.com/docs/cli/custom-commands/) -- TOML format, namespacing
- [Codex GitHub Repository](https://github.com/openai/codex) -- Source code and documentation

---
*Feature research for: Multi-runtime CLI tool interop*
*Researched: 2026-02-11*
