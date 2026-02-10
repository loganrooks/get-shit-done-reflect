# Technology Stack: Upstream gsd-tools CLI Analysis

**Project:** GSD Reflect — Upstream Sync (v1.11.2 to v1.18.0)
**Researched:** 2026-02-09
**Overall confidence:** HIGH (direct source analysis of upstream code)
**Research mode:** Stack dimension — gsd-tools adoption analysis

---

## Executive Summary

Upstream GSD introduced `gsd-tools.js`, a 4,597-line zero-dependency Node.js CLI that extracts repetitive bash patterns from ~50 command/workflow/agent files into a single deterministic tool. It is the most significant architectural change in the 70-commit delta between our fork point and upstream HEAD.

**The core insight:** Commands and workflows were spending 30-50% of their context budget on bash snippets for config parsing, state management, phase discovery, and git operations. gsd-tools moves all of that to a single `node gsd-tools.js <command>` call that returns structured JSON, reducing each workflow's initialization from dozens of bash lines to one call.

**Recommendation: ADOPT fully.** gsd-tools is additive (new file in `get-shit-done/bin/`), maintains zero-dependency philosophy, and provides infrastructure our fork-specific features (signals, knowledge base, reflection) can extend. Rejecting it means maintaining divergent command patterns that will make every future upstream sync exponentially harder.

---

## gsd-tools Architecture

### File Location and Dependencies

| Attribute | Value |
|-----------|-------|
| Path | `~/.claude/get-shit-done/bin/gsd-tools.js` |
| Size | 4,597 lines |
| Language | Node.js (CommonJS) |
| Dependencies | **Zero external** — only `fs`, `path`, `child_process`, `os` |
| Test file | `~/.claude/get-shit-done/bin/gsd-tools.test.js` (2,033 lines) |
| Test framework | `node:test` (built-in, no jest/mocha) |
| Invocation | `node ~/.claude/get-shit-done/bin/gsd-tools.js <command> [args] [--raw]` |
| Output format | JSON by default, `--raw` flag for plain text (single values) |

### Dependency Verification (HIGH confidence)

The file uses exactly four Node.js built-in modules:

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
// Plus inline: require('os').homedir() in two functions
```

No `package.json`, no `node_modules`, no external packages. This fully preserves the zero-dependency philosophy. The test file uses `node:test` and `node:assert` — also built-in.

---

## Command Taxonomy (63 functions)

gsd-tools contains 63 `cmd*` functions organized into 10 categories. Understanding these categories is essential for assessing adoption impact.

### Category 1: State Management (12 functions)

Operations on `.planning/STATE.md` — the most frequently duplicated bash patterns.

| Command | What it replaces |
|---------|-----------------|
| `state load` | 15+ lines of config.json reading + STATE.md parsing per workflow |
| `state update <field> <value>` | Regex-based field replacement in STATE.md |
| `state get [section]` | Section/field extraction from STATE.md |
| `state patch --field val ...` | Batch updates (was multiple sequential sed calls) |
| `state advance-plan` | Plan counter increment + status transition logic |
| `state record-metric` | Performance metrics table row insertion |
| `state update-progress` | Progress bar recalculation from phase summaries |
| `state add-decision` | Decision log section append |
| `state add-blocker` | Blocker section append |
| `state resolve-blocker` | Blocker removal by text match |
| `state record-session` | Session continuity fields update |
| `state-snapshot` | Full structured parse of STATE.md to JSON |

**Fork impact:** Our fork's signal-tracking and reflection commands read STATE.md for phase/plan context. Currently they do this with inline bash. Adopting gsd-tools means they can call `state-snapshot` for a clean JSON object instead.

### Category 2: Compound Init Commands (12 functions)

The highest-value category. Each `init <workflow>` command pre-computes ALL context a workflow needs in a single call, returning a JSON object.

| Command | What it pre-computes |
|---------|---------------------|
| `init execute-phase <N>` | executor_model, verifier_model, config flags, phase info, plan inventory, branch name, file existence |
| `init plan-phase <N>` | researcher/planner/checker models, workflow flags, phase artifacts, file contents via `--include` |
| `init new-project` | models, brownfield detection, git state, brave search availability |
| `init new-milestone` | models, current milestone info, file existence |
| `init quick <desc>` | models, quick task numbering, paths |
| `init resume` | file existence, interrupted agent state |
| `init verify-work <N>` | models, phase info, verification artifact existence |
| `init phase-op <N>` | config, phase info, all artifact existence flags |
| `init todos [area]` | config, todo inventory with metadata |
| `init milestone-op` | milestone info, phase counts, archive state |
| `init map-codebase` | mapper model, config, existing maps |
| `init progress` | models, milestone, phase overview, current/next phase |

**Key design: `--include` flag.** For init commands that need file contents (not just metadata), the `--include state,roadmap,requirements` flag causes the tool to read and embed file contents in the JSON response. This eliminates redundant file reads — the workflow gets everything in one bash call.

**Fork impact:** Our fork-specific workflows (collect-signals, signal, reflect) would benefit from similar init commands. These could be added as extensions (e.g., `init collect-signals <N>`, `init reflect`) without modifying the upstream file.

### Category 3: Phase Operations (8 functions)

Full lifecycle management of phases — discovery, creation, insertion, removal, completion.

| Command | What it does |
|---------|-------------|
| `find-phase <N>` | Finds phase directory, returns plans/summaries/artifacts |
| `phase next-decimal <N>` | Calculates next decimal phase (e.g., 02.1, 02.2) |
| `phase add <desc>` | Appends phase to ROADMAP.md + creates directory |
| `phase insert <after> <desc>` | Inserts decimal phase after existing |
| `phase remove <N> [--force]` | Removes phase, renumbers all subsequent phases + files |
| `phase complete <N>` | Marks complete, transitions STATE.md to next phase |
| `phase-plan-index <N>` | Indexes all plans with wave grouping and completion status |
| `phases list [--type] [--phase]` | Lists phase directories/files with filtering |

**Fork impact:** None of our fork features need custom phase operations. Full adoption, no adaptation needed.

### Category 4: Roadmap Operations (2 functions)

| Command | What it does |
|---------|-------------|
| `roadmap get-phase <N>` | Extracts a phase section from ROADMAP.md with goal/name |
| `roadmap analyze` | Full roadmap parse: all phases, disk status, progress, milestone info |

### Category 5: Frontmatter CRUD (4 functions)

Replaces the fragile inline YAML parsing that was scattered across workflows.

| Command | What it does |
|---------|-------------|
| `frontmatter get <file> [--field]` | Extract frontmatter as JSON |
| `frontmatter set <file> --field --value` | Update single field |
| `frontmatter merge <file> --data '{json}'` | Merge JSON into frontmatter |
| `frontmatter validate <file> --schema` | Validate against plan/summary/verification schemas |

**Fork impact:** HIGH value. Our knowledge base entries use YAML frontmatter. Our signal collection parses SUMMARY.md frontmatter. Currently this is done with custom bash/regex. gsd-tools provides tested, robust frontmatter parsing we can reuse.

### Category 6: Verification Suite (6 functions)

| Command | What it does |
|---------|-------------|
| `verify plan-structure <file>` | Checks PLAN.md structure, `<task>` elements, frontmatter |
| `verify phase-completeness <N>` | Checks all plans have summaries |
| `verify references <file>` | Checks @-refs and backtick paths resolve |
| `verify commits <h1> [h2] ...` | Batch verify commit hashes exist in git |
| `verify artifacts <plan-file>` | Checks must_haves.artifacts from plan frontmatter |
| `verify key-links <plan-file>` | Checks must_haves.key_links connections |

### Category 7: Template/Scaffold (5 functions)

| Command | What it does |
|---------|-------------|
| `template select <plan>` | Heuristic template selection (minimal/standard/complex) |
| `template fill summary/plan/verification` | Pre-filled template creation with frontmatter |
| `scaffold context/uat/verification/phase-dir` | Directory and file scaffolding |

### Category 8: Config Management (2 functions)

| Command | What it does |
|---------|-------------|
| `config-ensure-section` | Creates default config.json if missing |
| `config-set <key.path> <value>` | Dot-notation config updates |

### Category 9: Utilities (6 functions)

| Command | What it does |
|---------|-------------|
| `generate-slug <text>` | URL-safe slug generation |
| `current-timestamp [format]` | ISO timestamp (full/date/filename) |
| `list-todos [area]` | Todo counting and listing |
| `verify-path-exists <path>` | File/directory existence check |
| `history-digest` | Aggregate all SUMMARY.md data across phases |
| `summary-extract <path>` | Extract structured data from a SUMMARY.md |

### Category 10: Lifecycle (4 functions)

| Command | What it does |
|---------|-------------|
| `milestone complete <version>` | Archive milestone, create MILESTONES.md entry |
| `validate consistency` | Check phase numbering, disk/roadmap sync |
| `progress [json/table/bar]` | Render progress in various formats |
| `todo complete <filename>` | Move todo from pending to completed |

### Category 11: External (1 function, async)

| Command | What it does |
|---------|-------------|
| `websearch <query>` | Brave Search API integration (silent no-op without API key) |

---

## The "Thin Orchestrator" Pattern

This is the most important architectural concept to understand.

### Before gsd-tools (our fork's current state)

Commands contained ALL logic inline. Example: `settings.md` was 148 lines with:
- Config file reading and parsing (bash)
- AskUserQuestion with option construction
- Answer parsing and config merging
- File writing
- Confirmation display

Each command was a self-contained script. Workflows embedded similar patterns.

### After gsd-tools (upstream's new pattern)

Commands become thin routing layers:

```markdown
# settings.md (upstream, 33 lines)

<objective>
Routes to the settings workflow which handles:
- Config existence ensuring
- Current settings reading and parsing
- Interactive 5-question prompt
- Config merging and writing
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/settings.md
</execution_context>

<process>
Follow the settings workflow from @~/.claude/get-shit-done/workflows/settings.md.
</process>
```

The command file went from 148 lines to 33 lines. The logic moved to a workflow file, and the workflow uses gsd-tools for deterministic operations:

```markdown
# In workflow file:
## 1. Initialize

```bash
INIT=$(node ~/.claude/get-shit-done/bin/gsd-tools.js init plan-phase "$PHASE" --include state,roadmap,requirements)
```

Parse JSON for: researcher_model, planner_model, checker_model, ...
```

### What moved where

| Responsibility | Before | After |
|---------------|--------|-------|
| Argument parsing | Command file | Workflow file |
| Config reading | Inline bash (each command) | `gsd-tools state load` or `init <workflow>` |
| Model resolution | Inline MODEL_PROFILES lookup | `gsd-tools resolve-model <agent>` |
| Phase discovery | Inline bash (ls, grep, awk) | `gsd-tools find-phase <N>` |
| State updates | Inline sed/regex | `gsd-tools state update/patch` |
| Git commits | Inline git add/commit | `gsd-tools commit <msg>` |
| Frontmatter parsing | Custom regex per file | `gsd-tools frontmatter get/set` |
| Template generation | Inline heredocs | `gsd-tools template fill` |
| Progress calculation | Inline counting logic | `gsd-tools state update-progress` |
| Phase transitions | Multi-step inline logic | `gsd-tools phase complete` |

### What stays in commands/workflows

| Responsibility | Where it lives |
|---------------|---------------|
| User interaction (AskUserQuestion) | Workflow files |
| Subagent spawning (Task tool) | Workflow files |
| Routing decisions (if/else) | Workflow files |
| Display formatting (banners, tables) | Workflow files |
| Domain-specific logic (what to research, how to plan) | Agent files |

---

## Testing Story

### Structure (HIGH confidence — direct source analysis)

The test file (`gsd-tools.test.js`, 2,033 lines) uses Node.js built-in test runner (`node:test`):

```javascript
const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
```

**Test approach:** Black-box CLI testing. Each test:
1. Creates a temp directory with `.planning/` structure
2. Writes fixture files (ROADMAP.md, STATE.md, PLAN.md, etc.)
3. Executes `node gsd-tools.js <command>` via `execSync`
4. Parses JSON output
5. Asserts on output structure and values
6. Cleans up temp directory

### Test Coverage by Category

| Category | Tests | Key scenarios |
|----------|-------|--------------|
| history-digest | 6 | Empty, nested frontmatter, multiple phases, malformed, backward compat, inline arrays |
| phases list | 6 | Empty, numeric sort, decimal sort, plan filtering, summary filtering, phase filtering |
| roadmap get-phase | 5 | Extract, missing, decimal, full section, missing roadmap |
| phase next-decimal | 5 | First decimal, increment, gaps, single digit, missing base |
| phase-plan-index | 6 | Empty, single plan, wave grouping, incomplete detection, checkpoints, missing |
| state-snapshot | 6 | Missing, basic fields, decisions table, blockers, session, paused |
| summary-extract | 5 | Missing, full extraction, selective fields, missing frontmatter, rationale parsing |
| init --include | 7 | Execute-phase with/without include, plan-phase multi-include, verification/uat, progress, missing files, partial |
| roadmap analyze | 3 | Missing, full parse, goals/dependencies |
| phase add | 2 | Add after highest, empty roadmap |
| phase insert | 3 | Insert decimal, increment sibling, missing target |
| phase remove | 4 | Remove+renumber, reject with summaries, decimal removal, STATE update |
| phase complete | 2 | Complete+transition, last phase detection |
| milestone complete | 2 | Archive+create milestones, append to existing |
| validate consistency | 3 | Consistent, disk-only warning, gap warning |

**Total: ~63 tests across 15 describe blocks.**

### Fork Implications

The test suite is self-contained. Running tests requires only `node --test gsd-tools.test.js`. No external test runner needed. If we extend gsd-tools with fork-specific commands, we can add tests in the same pattern to a parallel test file.

---

## Adoption Analysis

### Option 1: ADOPT (Recommended)

**What it means:** Take gsd-tools.js as-is from upstream. Update our fork's commands and workflows to use the thin orchestrator pattern. Add fork-specific extensions as separate files or appended commands.

**Pros:**
- Future upstream syncs become trivial for core commands (they all use gsd-tools now)
- Massive context budget savings for our fork's commands too
- Tested infrastructure for frontmatter parsing, state management, phase ops
- Zero-dependency philosophy preserved
- Our fork features (signals, KB, reflection) can call gsd-tools for the deterministic parts

**Cons:**
- One-time effort to update our fork-specific commands (collect-signals, signal, reflect, health-check, etc.)
- Need to decide how to extend gsd-tools (modify upstream file vs. separate fork-tools.js)

**Risk:** LOW. gsd-tools is purely additive (new file). Our fork's "additive only" constraint is satisfied.

### Option 2: ADAPT (Take concepts, keep patterns)

**What it means:** Don't adopt gsd-tools.js. Instead, apply the thin orchestrator pattern to our fork's commands manually, using our own bash patterns.

**Pros:**
- No dependency on upstream CLI
- Full control over implementation

**Cons:**
- Duplicates 4,597 lines of tested infrastructure
- Every upstream sync now requires manually reconciling two different patterns
- No shared frontmatter parsing, state management, or phase operations
- Our fork commands remain bloated, context-expensive

**Risk:** HIGH. This path creates permanent divergence that compounds with every upstream sync.

### Option 3: SKIP (Reject gsd-tools)

**What it means:** Keep our fork's commands in their current verbose form. Ignore the thin orchestrator pattern.

**Pros:**
- Zero effort now

**Cons:**
- Upstream commands no longer match our fork's command patterns
- Git merge conflicts on EVERY command file going forward
- Context budgets remain bloated
- Fork becomes unmaintainable within 2-3 upstream releases

**Risk:** CRITICAL. This is a fork death sentence.

---

## Recommended Adoption Strategy

### Phase 1: Direct Adoption (sync milestone)

1. **Accept `get-shit-done/bin/gsd-tools.js` and test file as-is** from upstream
2. **Accept all upstream command/workflow changes** that use the thin orchestrator pattern
3. **Update our fork-specific commands** to use gsd-tools where applicable:
   - `collect-signals.md` — use `gsd-tools state-snapshot` for phase context, `gsd-tools frontmatter get` for SUMMARY.md parsing
   - `signal.md` — use `gsd-tools state get` for current phase/plan context
   - `health-check.md` — use `gsd-tools validate consistency` + `gsd-tools roadmap analyze`
   - `progress.md` (if fork-customized) — use `gsd-tools progress`

### Phase 2: Fork Extensions (post-sync milestone)

Create `gsd-reflect-tools.js` (separate file, additive) with fork-specific commands:

| Proposed Command | Purpose |
|-----------------|---------|
| `reflect init` | Load signal/KB context for reflection engine |
| `reflect signals --phase <N>` | List signals for a phase |
| `reflect kb-search --tags <tags>` | Search knowledge base by tags |
| `reflect kb-stats` | Knowledge base statistics |
| `reflect health` | Extended health check including signal/KB health |

**Why a separate file instead of modifying gsd-tools.js:** Preserves the "no upstream file edits" constraint. The fork-specific tool file can import/call gsd-tools functions if needed, or operate independently.

---

## Integration Implications for Fork Features

### Signal Tracking

**Current pattern:** Inline bash reads STATE.md, parses SUMMARY.md frontmatter, constructs signal entries.

**With gsd-tools:**
```bash
# Before: 20+ lines of bash
PHASE=$(grep "Current Phase" .planning/STATE.md | sed ...)
PLAN=$(grep "Current Plan" .planning/STATE.md | sed ...)
# ...

# After: 1 line
SNAPSHOT=$(node ~/.claude/get-shit-done/bin/gsd-tools.js state-snapshot)
# Parse JSON for current_phase, current_plan, status, etc.
```

**Signal collection from SUMMARY.md:**
```bash
# Before: Custom regex parsing of frontmatter
# After:
SUMMARY_DATA=$(node ~/.claude/get-shit-done/bin/gsd-tools.js summary-extract .planning/phases/01-setup/01-01-SUMMARY.md)
# Returns: one_liner, key_files, tech_added, patterns, decisions as structured JSON
```

### Knowledge Base

**Current pattern:** Custom frontmatter parsing in knowledge-store.md agent.

**With gsd-tools:**
```bash
# Read KB entry frontmatter
ENTRY=$(node ~/.claude/get-shit-done/bin/gsd-tools.js frontmatter get .claude/agents/kb-templates/signal.md)
# Validate structure
VALID=$(node ~/.claude/get-shit-done/bin/gsd-tools.js frontmatter validate kb-entry.md --schema signal)
```

Note: Would need custom schema added for KB entries (not in upstream's `plan|summary|verification` schema set).

### Reflection Engine

**Current pattern:** Reads multiple files, aggregates data, produces insights.

**With gsd-tools:**
```bash
# One call for all phase history
DIGEST=$(node ~/.claude/get-shit-done/bin/gsd-tools.js history-digest)
# Returns: all phases with provides/affects/patterns/decisions + tech_stack aggregate

# One call for roadmap overview
ANALYSIS=$(node ~/.claude/get-shit-done/bin/gsd-tools.js roadmap analyze)
# Returns: phase status, progress, current/next phase
```

---

## What NOT to Adopt (and Why)

### Do NOT modify gsd-tools.js directly

Our fork constraint is "additive only — no upstream file edits." Even though gsd-tools is new, it will receive upstream updates. Modifying it creates merge conflicts. Fork extensions belong in a separate file.

### Do NOT replicate the MODEL_PROFILES table for fork agents

gsd-tools has `MODEL_PROFILES` for upstream agents only. If we add fork-specific agents (e.g., `gsd-signal-analyzer`, `gsd-reflector`), their model profiles should be in our separate fork-tools file, not patched into the upstream table.

### Do NOT adopt the Brave Search integration unless needed

`websearch` command integrates Brave Search API. This is optional (silent no-op without API key) and irrelevant to our fork's core features. Accept it passively but don't invest in configuring it.

### Do NOT over-engineer fork-specific init commands initially

The `init <workflow>` pattern is powerful but each init command is ~50-80 lines of carefully tuned context gathering. For the sync milestone, have fork-specific commands use atomic gsd-tools commands (state-snapshot, frontmatter get, etc.) rather than building full init commands. Build init commands later when patterns stabilize.

---

## Model Profile Table (from gsd-tools)

For reference — this is how upstream resolves agent models:

| Agent | Quality | Balanced | Budget |
|-------|---------|----------|--------|
| gsd-planner | opus | opus | sonnet |
| gsd-roadmapper | opus | sonnet | sonnet |
| gsd-executor | opus | sonnet | sonnet |
| gsd-phase-researcher | opus | sonnet | haiku |
| gsd-project-researcher | opus | sonnet | haiku |
| gsd-research-synthesizer | sonnet | sonnet | haiku |
| gsd-debugger | opus | sonnet | sonnet |
| gsd-codebase-mapper | sonnet | haiku | haiku |
| gsd-verifier | sonnet | sonnet | haiku |
| gsd-plan-checker | sonnet | sonnet | haiku |
| gsd-integration-checker | sonnet | sonnet | haiku |

Our fork's config currently uses `"model_profile": "quality"` — all agents get opus or sonnet depending on role.

---

## Config Schema Changes

Upstream's `config.json` defaults have evolved. Our fork's config is:

```json
{
  "mode": "yolo",
  "depth": "comprehensive",
  "parallelization": true,
  "commit_docs": true,
  "model_profile": "quality",
  "workflow": { "research": true, "plan_check": true, "verifier": true },
  "health_check": { ... },
  "devops": { ... },
  "gsd_reflect_version": "1.12.2"
}
```

Upstream's defaults now include:
```json
{
  "search_gitignored": false,
  "branching_strategy": "none",
  "phase_branch_template": "gsd/phase-{phase}-{slug}",
  "milestone_branch_template": "gsd/{milestone}-{slug}",
  "brave_search": false
}
```

gsd-tools' `loadConfig()` handles missing fields gracefully (defaults applied). Our fork's extra fields (`health_check`, `devops`, `gsd_reflect_version`, `mode`, `depth`) will be ignored by gsd-tools, which is correct. No config migration needed.

---

## Sources

All findings are from direct source analysis (HIGH confidence):

- `git show upstream/main:get-shit-done/bin/gsd-tools.js` — Full 4,597-line source
- `git show upstream/main:get-shit-done/bin/gsd-tools.test.js` — Full 2,033-line test suite
- `git show upstream/main:commands/gsd/settings.md` — Thin orchestrator command example
- `git show upstream/main:commands/gsd/check-todos.md` — Thin orchestrator command example
- `git show upstream/main:commands/gsd/execute-phase.md` — Workflow delegation example
- `git show upstream/main:commands/gsd/plan-phase.md` — Workflow delegation example
- `git show upstream/main:get-shit-done/workflows/execute-phase.md` — gsd-tools init usage
- `git show upstream/main:get-shit-done/workflows/plan-phase.md` — gsd-tools init + --include usage
- `git diff 2347fca35ead..upstream/main -- commands/gsd/settings.md` — Before/after diff showing 148 to 33 lines
- `git log upstream/main --grep="gsd-tools"` — 14 commits tracking gsd-tools evolution
