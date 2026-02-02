# Architecture

**Analysis Date:** 2026-02-02

## Pattern Overview

**Overall:** Command orchestration system with multi-agent subagent pattern

**Key Characteristics:**
- Thin command wrappers delegate to specialized agent workflows
- Multi-layer XML+Markdown hybrid documents (semantic XML containers, markdown content)
- Context engineering through aggressive document splitting and state preservation
- Subagent spawning for parallel research, planning, and execution
- Atomic commits per task with state tracking across sessions

## Layers

**Command Layer:**
- Purpose: User-facing interface, thin wrappers delegating to workflows
- Location: `commands/gsd/*.md`
- Contains: YAML frontmatter (metadata), XML objectives, @-references to workflows
- Depends on: Workflows, templates, references
- Used by: Claude Code / OpenCode / Gemini CLI runtimes

**Workflow Layer:**
- Purpose: Orchestration logic, decision routing, agent spawning
- Location: `get-shit-done/workflows/*.md`
- Contains: XML process steps, conditionals, Task tool spawning
- Depends on: Templates, references, state files
- Used by: Commands, other workflows, subagents

**Template Layer:**
- Purpose: Reusable output structures, artifact templates
- Location: `get-shit-done/templates/*.md`
- Contains: Markdown structures with placeholder patterns
- Depends on: References (style guidance)
- Used by: Agents filling templates for PROJECT.md, PLAN.md, SUMMARY.md, etc.

**Reference Layer:**
- Purpose: Deep guidance, patterns, principles
- Location: `get-shit-done/references/*.md`
- Contains: Pattern documentation, questioning frameworks, git conventions
- Depends on: None
- Used by: Workflows, agents when detailed decision-making needed

**Agent Layer:**
- Purpose: Specialized execution for research, planning, executing, verification
- Location: `agents/gsd-*.md`
- Contains: YAML frontmatter (tools allowed), role specification, detailed execution steps
- Depends on: Workflows, templates, references
- Used by: Commands and workflows via Task tool spawning

**Runtime Layer:**
- Purpose: Installation, CLI translation, environment setup
- Location: `bin/install.js`, `scripts/build-hooks.js`
- Contains: Node.js scripts handling multi-runtime deployment
- Depends on: None (pure Node.js filesystem/config)
- Used by: `npm install` global or local

**Hooks Layer:**
- Purpose: Background tasks, status display, update checking
- Location: `hooks/*.js` (source), `hooks/dist/*.js` (bundled)
- Contains: Node.js scripts run on Claude Code session start
- Depends on: None (pure Node.js)
- Used by: Claude Code settings.json hook registration

## Data Flow

**Project Initialization Flow:**

1. `/gsd:new-project` command invoked
2. Workflow calls `gsd-project-researcher` agent (parallel research)
3. Workflow creates REQUIREMENTS.md and ROADMAP.md templates
4. User approves, ROADMAP.md committed, STATE.md created
5. `.planning/config.json` written with workflow settings

**Phase Execution Flow:**

1. `/gsd:plan-phase N` invoked
2. Workflow reads ROADMAP.md for phase N definition
3. Workflow reads CONTEXT.md if exists (user vision)
4. Workflow spawns `gsd-planner` agent
5. Planner creates `.planning/phases/NN-name/NN-YY-PLAN.md`
6. Planner may spawn `gsd-plan-checker` for verification
7. Plans written to disk, STATE.md updated
8. `/gsd:execute-phase N` invoked
9. Execute-phase workflow discovers all NN-YY-PLAN.md files
10. Groups by `wave:` frontmatter value
11. Spawns `gsd-executor` agents per wave (parallel within wave)
12. Each executor reads PLAN.md, executes tasks sequentially
13. Per-task git commits created automatically
14. Each executor writes `.planning/phases/NN-YY-SUMMARY.md`
15. Execute-phase collects summaries, updates STATE.md, ROADMAP.md

**State Management:**

- **STATE.md** — Living project memory (phase, plan, position, decisions)
- **ROADMAP.md** — Phase breakdown and completion tracking
- **config.json** — Workflow settings (depth, mode, profile, git strategy)
- **PLAN.md** — Executable task specifications with verification criteria
- **SUMMARY.md** — Execution results, commits, output artifacts
- **CONTEXT.md** — User's vision for a phase (optional but recommended)

## Key Abstractions

**Command (Markdown + YAML):**
- Purpose: User-invokable slash commands that load into Claude Code
- Examples: `commands/gsd/new-project.md`, `commands/gsd/execute-phase.md`
- Pattern: YAML frontmatter (metadata) + XML objective + execution steps

**Workflow (XML + Markdown):**
- Purpose: Reusable orchestration sequences
- Examples: `get-shit-done/workflows/execute-phase.md`, `get-shit-done/workflows/discover-issues.md`
- Pattern: `<step>` elements with bash operations, Task spawning, conditional logic

**Agent (YAML + XML + Markdown):**
- Purpose: Specialized Claude instances with specific allowed tools
- Examples: `agents/gsd-executor.md`, `agents/gsd-planner.md`
- Pattern: Tool restrictions via frontmatter, execution role, detailed procedures

**@-Reference:**
- Purpose: Lazy loading signals for files to read
- Usage: `@.planning/PROJECT.md`, `@~/.claude/get-shit-done/references/git-integration.md`
- Pattern: File paths tell Claude what to load and read during execution

**Task Tool (XML):**
- Purpose: Spawn subagent with fresh context window
- Format: `<task>` with type (auto / checkpoint:human-verify / checkpoint:decision)
- Output: Subagent executes autonomously, returns structured result

## Entry Points

**CLI Entry Point:**
- Location: `bin/install.js`
- Triggers: `npx get-shit-done-cc`
- Responsibilities: Interactive/non-interactive install, uninstall, config directory setup

**Command Entry Point:**
- Location: `commands/gsd/*.md`
- Triggers: `/gsd:command-name` in Claude Code / OpenCode / Gemini
- Responsibilities: Load user context, parse arguments, delegate to workflow

**Project Initialization Entry Point:**
- Location: `commands/gsd/new-project.md`
- Triggers: `/gsd:new-project`
- Responsibilities: Questions → research → requirements → roadmap creation

**Brownfield Entry Point:**
- Location: `commands/gsd/map-codebase.md`
- Triggers: `/gsd:map-codebase`
- Responsibilities: Analyze existing codebase, spawn parallel explorers, create `.planning/codebase/` docs

**Phase Execution Entry Points:**
- Location: `commands/gsd/plan-phase.md`, `commands/gsd/execute-phase.md`
- Triggers: `/gsd:plan-phase N`, `/gsd:execute-phase N`
- Responsibilities: Phase discovery, plan creation/execution, state management

**Session Hooks:**
- Location: `hooks/gsd-statusline.js`, `hooks/gsd-check-update.js`
- Triggers: Configured in settings.json `hooks.SessionStart` array
- Responsibilities: Display status in Claude Code, check for updates periodically

## Error Handling

**Strategy:** Checkpoint-based deviation handling. Autonomy until checkpoint, manual intervention at checkpoint.

**Patterns:**

**Task-level failures:**
- Executor catches errors, continues to next task
- Logs error in SUMMARY.md with diagnostic context
- Can retry or skip based on task type

**Checkpoint handling:**
- Pattern A: `type="checkpoint:human-verify"` — Executor stops, presents what was built
- Pattern B: `type="checkpoint:decision"` — Executor stops, presents decision options
- User interaction happens at checkpoint, then executor resumes or restarts

**Plan failures:**
- Plan checker verifies plan achieves phase goals before execution
- If check fails, planner refines and regenerates
- Never execute a plan that didn't pass verification

**State recovery:**
- STATE.md tracks current position, decisions, blockers
- If session resets, `/gsd:resume-work` reads STATE.md and restores context
- Subagents survive `/clear` via persistent .planning/ files

## Cross-Cutting Concerns

**Logging:**
- Execution logged via `<verify>` and `<done>` fields in PLAN.md
- Bash command output captured and included in SUMMARY.md
- No verbose logging — only verification and results

**Validation:**
- Plan checker validates tasks before execution
- CONTEXT.md validation against requirements in plan-phase
- Git history validation to ensure commits exist after task execution

**Authentication:**
- No authentication in GSD itself (empty dependencies in package.json)
- Auth patterns documented in references for user's projects

**Multi-runtime support:**
- Claude Code: Standard installation, markdown commands in `~/.claude/commands/gsd/`
- OpenCode: Flattened command structure (`/gsd-command` not `/gsd:command`), tool mapping via install.js
- Gemini: Agent frontmatter conversion, TOML command format for compatibility
- bin/install.js handles all conversion at installation time

---

*Architecture analysis: 2026-02-02*
