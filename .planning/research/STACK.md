# Stack Research: Backlog System, Feature Manifest, Update Experience, Agent Boilerplate

**Domain:** CLI-native workflow enhancement -- backlog management, declarative config schemas, update UX, and spec deduplication for an existing zero-dependency Node.js + Markdown system
**Researched:** 2026-02-16
**Confidence:** HIGH (all recommendations build on verified existing patterns; no new dependencies required)

---

## Executive Summary

All four target features (tagged backlog, feature manifest, update experience, agent boilerplate extraction) are achievable with **zero new npm dependencies**. The existing stack -- Node.js built-ins, Markdown + YAML frontmatter, JSON for config, and the gsd-tools.js CLI -- provides every primitive needed. The backlog system extends the proven `todos/` pattern with richer frontmatter (tags, priority, scope). The feature manifest is a JSON schema embedded in a new file that the installer, upgrade-project, and new-project workflows all read. Config migration extends the existing version-migration.md additive-only pattern. Agent boilerplate extraction is pure Markdown refactoring with a shared reference document.

**The single most important stack decision: do NOT add a dependency.** GSD Reflect's zero-dependency constraint is load-bearing -- it ensures the system works on any Node.js installation across 4 runtimes without npm install in the target project. Every feature must use `fs`, `path`, `os`, `crypto`, and the existing hand-rolled YAML frontmatter parser in gsd-tools.js.

---

## Recommended Stack

### Core Technologies (No Changes)

| Technology | Version | Purpose | Why Unchanged |
|------------|---------|---------|---------------|
| Node.js | >= 18.x | Runtime for gsd-tools.js, install.js, hooks | Already required; all new features are file I/O and JSON manipulation |
| Markdown + YAML frontmatter | N/A | Data format for backlog items, signals, lessons, todos | Proven pattern; backlog items follow same schema conventions as todos/signals |
| JSON | N/A | Config format (config.json, feature-manifest.json) | Feature manifest and config schema validation are JSON-native operations |
| gsd-tools.js | current | CLI for state, frontmatter, commits, scaffolding | All new commands extend existing command patterns |

### New Files (Not Dependencies)

These are new data files and reference documents within the existing system, not npm packages.

| File | Purpose | Consumed By |
|------|---------|-------------|
| `~/.gsd/backlog/{project}/` | Per-project backlog items (Markdown + frontmatter) | `/gsd:backlog`, `/gsd:new-milestone`, gsd-tools.js |
| `~/.gsd/backlog/_global/` | Cross-project backlog items | Same as above |
| `.claude/get-shit-done/feature-manifest.json` | Declarative feature registry with config schemas | install.js, upgrade-project, new-project workflows |
| `.claude/get-shit-done/references/agent-conventions.md` | Shared agent protocol (extracted boilerplate) | All 11 gsd-* agent specs |
| `~/.gsd/backlog/index.md` | Auto-generated backlog index (same pattern as KB index) | `/gsd:new-milestone`, backlog listing |

### Supporting Libraries (None Added)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **None** | N/A | N/A | The zero-dependency constraint holds for all v1.15 features |

### Development Tools (No Changes)

| Tool | Purpose | Notes |
|------|---------|-------|
| Vitest | Test runner | Add tests for new gsd-tools.js commands (backlog CRUD, manifest validation) |
| GitHub Actions | CI/CD | No changes needed; existing test workflow covers new code |

---

## Stack Decisions by Feature

### 1. Tagged Backlog System

**Data format:** Markdown with YAML frontmatter (same as todos, signals, lessons)

**Why not SQLite/JSON-lines/other structured stores:**
- Frontmatter is the established pattern for ALL GSD data (signals, lessons, spikes, todos, plans, summaries)
- Human-readable, git-trackable, agent-friendly
- The existing `extractFrontmatter()` / `reconstructFrontmatter()` in gsd-tools.js (lines 252-397) handles all parsing
- No new parser needed

**Storage location:** `~/.gsd/backlog/` (parallel to `~/.gsd/knowledge/`)

**Why `~/.gsd/` and not `.planning/todos/`:**
- Backlog is cross-session, cross-milestone, potentially cross-project -- just like the knowledge base
- The existing `todos/` system is project-scoped and session-scoped (quick capture during work). Backlog is the persistent, curated layer above that
- `~/.gsd/` is already the runtime-agnostic shared directory with established conventions
- Per-project subdirectories (`~/.gsd/backlog/{project-name}/`) follow the signals pattern exactly

**Backlog item frontmatter schema:**

```yaml
---
id: bl-{YYYY-MM-DD}-{slug}
title: "Feature or improvement description"
project: {project-name} | _global
tags: [ux, performance, dx, installer, ...]
priority: high | medium | low
scope: feature | bug | improvement | idea | debt
status: open | in-progress | done | wontfix
source: manual | todo-promote | signal-derived | milestone-review
created: 2026-02-16T14:30:00Z
updated: 2026-02-16T14:30:00Z
milestone: null | "v1.15"
---
```

**Auto-grouping implementation:** Pure JavaScript in gsd-tools.js. Group by `tags` using set intersection, then by `scope`, then by `priority`. No ML, no clustering library -- deterministic grouping rules.

**Index file:** `~/.gsd/backlog/index.md` following the same pattern as `~/.gsd/knowledge/index.md`. Auto-generated on write, lists all items with frontmatter fields for fast scanning.

**New gsd-tools.js commands needed:**

| Command | Purpose | Implementation |
|---------|---------|----------------|
| `backlog add <title> [--tags t1,t2] [--priority p] [--scope s] [--project p]` | Create backlog item | Write frontmatter + body to `~/.gsd/backlog/{project}/` |
| `backlog list [--project p] [--tags t] [--scope s] [--priority p] [--status s]` | List/filter backlog | Read + filter frontmatter from backlog directory |
| `backlog group [--project p] [--by tags\|scope\|priority]` | Auto-group for milestone scoping | Read all items, group by field, return grouped JSON |
| `backlog update <id> [--status s] [--milestone m] [--priority p]` | Update item fields | Read, modify frontmatter, write back |
| `backlog promote <todo-file>` | Convert todo to backlog item | Read todo, create backlog item with `source: todo-promote` |
| `backlog stats [--project p]` | Summary counts by scope/priority/status | Aggregate frontmatter fields |
| `init backlog [--project p]` | Compound init for backlog workflows | Load backlog items + config + state |

**Estimated new code:** ~300-400 lines in gsd-tools.js (comparable to the todo system at ~100 lines + the frontmatter system at ~200 lines).

### 2. Feature Manifest / Config Schema System

**Format:** JSON file at `.claude/get-shit-done/feature-manifest.json`

**Why JSON and not YAML or Markdown:**
- Config schemas need to be machine-parsed reliably; JSON is native to Node.js
- The existing `config.json` is JSON; the manifest validates JSON against JSON
- `JSON.parse()` is a built-in -- zero dependencies
- Schema definitions map directly to the config.json structure they validate

**Why not JSON Schema (the spec) or Ajv/Zod:**
- Adding Ajv (168KB) or Zod (87KB) violates the zero-dependency constraint
- The validation needs are simple: check field existence, type, enum membership, defaults
- A hand-rolled validator (50-100 lines) suffices. The existing `FRONTMATTER_SCHEMAS` pattern at line 2109 of gsd-tools.js already does this for frontmatter; extend the same pattern for config
- If validation grows complex in later milestones (MCP server), Zod could be reconsidered as a dev dependency only

**Manifest structure:**

```json
{
  "manifest_version": "1.0",
  "features": {
    "health_check": {
      "scope": "project",
      "introduced": "1.12.0",
      "config_key": "health_check",
      "schema": {
        "frequency": { "type": "string", "enum": ["milestone-only", "on-resume", "every-phase", "explicit-only"], "default": "milestone-only" },
        "stale_threshold_days": { "type": "number", "default": 7 },
        "blocking_checks": { "type": "boolean", "default": false }
      },
      "prompts": [
        { "key": "frequency", "question": "How often should health checks run?", "options_from": "enum" },
        { "key": "blocking_checks", "question": "Should health check warnings block execution?" }
      ]
    },
    "devops": {
      "scope": "project",
      "introduced": "1.12.0",
      "config_key": "devops",
      "schema": {
        "ci_provider": { "type": "string", "enum": ["none", "github-actions", "gitlab-ci", "circleci", "jenkins", "other"], "default": "none" },
        "deploy_target": { "type": "string", "enum": ["none", "vercel", "docker", "fly-io", "railway", "other"], "default": "none" },
        "commit_convention": { "type": "string", "enum": ["freeform", "conventional"], "default": "freeform" },
        "environments": { "type": "array", "default": [] }
      },
      "prompts": [
        { "key": "_gate", "question": "Configure DevOps context now?", "options": ["skip", "configure"], "skip_value": "skip" }
      ]
    },
    "release": {
      "scope": "project",
      "introduced": "1.15.0",
      "config_key": "release",
      "schema": {
        "version_file": { "type": "string", "enum": ["package.json", "Cargo.toml", "pyproject.toml", "VERSION", "none"], "default": "none" },
        "changelog": { "type": "string", "default": "CHANGELOG.md" },
        "changelog_format": { "type": "string", "enum": ["keepachangelog", "conventional", "none"], "default": "keepachangelog" },
        "ci_trigger": { "type": "string", "enum": ["github-release", "tag-push", "manual", "none"], "default": "none" },
        "registry": { "type": "string", "enum": ["npm", "crates", "pypi", "none"], "default": "none" },
        "branch": { "type": "string", "default": "main" }
      },
      "prompts": [
        { "key": "version_file", "question": "Where is your version tracked?" },
        { "key": "changelog_format", "question": "Changelog format?" }
      ]
    },
    "backlog": {
      "scope": "user",
      "introduced": "1.15.0",
      "config_key": null,
      "init_action": "ensure_directory",
      "init_path": "~/.gsd/backlog/",
      "schema": {}
    }
  }
}
```

**Key design decisions:**
- `scope: "project"` means config lives in `.planning/config.json` -- initialized by new-project, migrated by upgrade-project
- `scope: "user"` means infrastructure lives in `~/.gsd/` -- set up by installer (install.js)
- `prompts` array drives mini-onboarding in new-project and upgrade-project
- `introduced` version enables the migration system to know which features are new relative to a project's `gsd_reflect_version`

**New gsd-tools.js commands needed:**

| Command | Purpose | Implementation |
|---------|---------|----------------|
| `manifest list-features` | List all features with scope and introduced version | Read manifest, output JSON |
| `manifest diff-config` | Compare manifest against project's config.json | Read both, return missing features/fields |
| `manifest validate-config` | Validate config.json against manifest schemas | Type + enum + required checks per feature |
| `manifest get-prompts <feature>` | Return prompts for a feature's config | Used by new-project and upgrade-project |
| `manifest apply-defaults <feature>` | Write default config for a feature | Used by upgrade-project in auto mode |

**Estimated new code:** ~200-300 lines in gsd-tools.js.

### 3. CLI Update Experience Improvements

**Config migration approach:** Extend the existing version-migration.md pattern, now driven by the feature manifest instead of hardcoded migration actions.

**Current migration flow:**
1. `gsd-version-check.js` hook detects version mismatch on session start (cached)
2. `upgrade-project.md` workflow reads cache, compares versions, applies additive patches
3. Patches are hardcoded in the workflow per version (e.g., "add health_check section if absent")

**New migration flow (manifest-driven):**
1. `gsd-version-check.js` hook detects version mismatch (unchanged)
2. `upgrade-project.md` runs `manifest diff-config` to find features introduced after project version
3. For each missing feature: apply defaults (auto mode) or run prompts (interactive mode)
4. Update `gsd_reflect_version` last (unchanged safety mechanism)

**Post-update awareness:**
- After `/gsd:update` runs the installer, check if any project-level features are uninitialized
- The `manifest diff-config` command makes this a single call
- Display: "New features available. Run `/gsd:upgrade-project` to configure: [feature list]"
- This extends the existing update.md workflow (step after install completes)

**No new hooks needed.** The existing `gsd-version-check.js` and `gsd-check-update.js` SessionStart hooks already cover detection. The improvement is in the workflow logic, not the detection mechanism.

**Release infrastructure config:**
- `/gsd:new-project` gains a "Release infrastructure" question set driven by `manifest get-prompts release`
- `/gsd:release` reads `config.release` instead of hardcoding npm/package.json/CHANGELOG.md
- This is a workflow change (Markdown), not a stack change

**Estimated new code:** ~50-100 lines in gsd-tools.js (manifest commands handle the heavy lifting), plus workflow Markdown changes.

### 4. Agent Spec Boilerplate Extraction

**Approach:** Pure Markdown refactoring. No code changes needed.

**Current state:** 11 agent specs (gsd-executor, gsd-planner, gsd-debugger, gsd-verifier, gsd-phase-researcher, gsd-project-researcher, gsd-research-synthesizer, gsd-codebase-mapper, gsd-plan-checker, gsd-integration-checker, gsd-roadmapper) each contain ~600 lines of shared protocol:
- Structured return format
- Error handling conventions
- Tool usage patterns
- State management boilerplate
- Commit patterns

**Solution:** Extract shared content into `.claude/get-shit-done/references/agent-conventions.md`. Each agent spec references it with a `<required_reading>` tag (the established pattern for reference loading).

**Why a reference document and not a template:**
- References are loaded at agent spawn time (established pattern)
- Templates are for file generation (different purpose)
- The existing `required_reading` convention means agents already know to read referenced files
- No code change needed to make this work

**Estimated savings:** ~600 lines x 11 agents = 6,600 lines total, minus the ~800-line conventions doc = net ~5,800 lines eliminated from duplicated agent specs. Target: 30-50% reduction per agent spec.

---

## Installation

```bash
# No new packages needed. Zero-dependency constraint maintained.
# All features use existing Node.js built-ins.

# The following directories are created by the features themselves:
# ~/.gsd/backlog/              (backlog system, created on first use)
# ~/.gsd/backlog/{project}/    (per-project backlog, created on first use)
# ~/.gsd/backlog/_global/      (cross-project items, created on first use)

# The following files are added to the GSD distribution:
# .claude/get-shit-done/feature-manifest.json    (feature registry)
# .claude/get-shit-done/references/agent-conventions.md  (shared agent protocol)
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not Alternative |
|-------------|-------------|---------------------|
| Hand-rolled JSON validator (~50 lines) | Ajv JSON Schema validator | Adds 168KB dependency; violates zero-dep constraint; validation needs are simple (type + enum + required) |
| Hand-rolled JSON validator (~50 lines) | Zod schema validation | Adds 87KB dependency; requires TypeScript mindset; overkill for field-level checks |
| Markdown + frontmatter for backlog | SQLite database | Adds native dependency; not human-readable; not git-trackable; breaks pattern consistency |
| Markdown + frontmatter for backlog | JSON-lines (.jsonl) | Not human-editable; no established GSD pattern; loses the `## Description` body section |
| `~/.gsd/backlog/` storage | `.planning/backlog/` storage | Backlog is cross-milestone, potentially cross-project; `.planning/` is project-scoped and resets per milestone |
| `~/.gsd/backlog/` storage | `.planning/todos/` extension | Todos are quick captures during work; backlog is curated, persistent, tagged -- different lifecycle |
| Single `feature-manifest.json` | Per-feature JSON files | Single file is simpler to parse, ship, and version; features are few enough (~10-20 max) |
| Reference doc for agent conventions | Build-time template expansion | Adds build step complexity; agents already load references at runtime; no benefit |
| Existing `extractFrontmatter()` | gray-matter npm package | External dependency; existing parser handles all current patterns; add edge cases as needed |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Any npm dependency for these features | Violates the zero-dependency constraint that enables 4-runtime portability | Node.js built-ins (`fs`, `path`, `os`, `crypto`, `JSON`) |
| YAML parser library (js-yaml, yaml) | The existing regex-based frontmatter parser in gsd-tools.js works for GSD's subset of YAML | Extend `extractFrontmatter()` if new patterns arise |
| Database (SQLite, LevelDB, etc.) | Adds native compilation dependency; not human-readable; overkill for ~100s of items | Markdown files with directory-based indexing |
| TypeScript for new code | gsd-tools.js is JavaScript; mixing languages adds complexity | Continue with JavaScript + JSDoc type comments |
| Configuration file formats beyond JSON | config.json is established; TOML/YAML would fragment the config story | JSON with JSONC support (already in place) |
| Separate microservices or processes | The hook system already runs as background spawned processes | Extend existing gsd-tools.js with new subcommands |

---

## Stack Patterns by Feature

**If building backlog system:**
- Follow the `~/.gsd/knowledge/signals/{project}/` directory pattern exactly
- Use the same `id: {prefix}-{date}-{slug}` naming convention as signals/lessons
- Auto-generate `index.md` on write (same pattern as KB index)
- Extend `extractFrontmatter()` only if new YAML patterns are needed (unlikely)

**If building feature manifest:**
- Store at `.claude/get-shit-done/feature-manifest.json` (shipped with GSD, not project-specific)
- Read with `JSON.parse(fs.readFileSync(...))` -- zero error risk for well-formed shipped file
- Validation logic follows `FRONTMATTER_SCHEMAS` pattern (line 2109 of gsd-tools.js)
- Migration logic follows `version-migration.md` additive-only rules

**If building post-update awareness:**
- After installer completes, run `manifest diff-config` to detect uninitialized features
- Display results in the existing update.md step_display_result step
- No new hook; leverage existing `gsd-version-check.js` cache

**If extracting agent boilerplate:**
- Create `references/agent-conventions.md` containing shared protocol sections
- Each agent spec adds `<required_reading>` reference (existing convention)
- Test: verify each agent still produces correct structured output after extraction
- Size target: conventions doc < 1,000 lines; each agent spec reduced by 30-50%

---

## Version Compatibility

| Component | Compatible With | Notes |
|-----------|-----------------|-------|
| New gsd-tools.js commands | Node.js >= 18.x | Uses only built-in modules; no new APIs beyond what gsd-tools.js already uses |
| feature-manifest.json | gsd-tools.js current | New commands read manifest; existing commands unaffected |
| Backlog frontmatter schema | extractFrontmatter() current | Uses same YAML patterns as signals/todos (key: value, arrays, no nested objects beyond one level) |
| agent-conventions.md | All 4 runtimes | Markdown reference loaded by `<required_reading>` convention; runtime-agnostic |
| config.json extensions | version-migration.md | New fields follow additive-only pattern; existing `gsd_reflect_version` comparison unchanged |

---

## Integration Points

### gsd-tools.js Extensions

New subcommand families to add to the CLI dispatch:

```
backlog add|list|group|update|promote|stats
manifest list-features|diff-config|validate-config|get-prompts|apply-defaults
init backlog
```

These follow the established pattern of `case 'backlog':` in the main dispatch switch (line ~4200 of gsd-tools.js), delegating to `cmdBacklogAdd()`, `cmdBacklogList()`, etc.

### Workflow Touchpoints

| Existing Workflow | Change Needed | Why |
|-------------------|---------------|-----|
| `new-project.md` | Add feature manifest prompts (release config, etc.) | New projects get all feature config at init time |
| `upgrade-project.md` | Replace hardcoded migrations with `manifest diff-config` | Config migration becomes data-driven |
| `update.md` | Add post-update `manifest diff-config` check | Users learn about new features after update |
| `new-milestone.md` | Add backlog presentation step (call `backlog group`) | Milestone scoping draws from accumulated backlog |
| `add-todo.md` | Add option to promote to backlog | Bridge between quick captures and persistent backlog |
| `check-todos.md` | Add option to promote to backlog | Same bridge |
| `complete-milestone.md` | Add backlog review step | Archive resolved items, carry forward remaining |

### Installer Touchpoints

| Installer Area | Change Needed | Why |
|----------------|---------------|-----|
| `install.js` | Ensure `~/.gsd/backlog/` directory exists | Same pattern as `~/.gsd/knowledge/` creation |
| `install.js` | Ship `feature-manifest.json` to install target | New file in the GSD distribution |
| `install.js` | Ship `references/agent-conventions.md` to install target | New reference document |

---

## Estimated Implementation Effort

| Feature | New gsd-tools.js Code | New Markdown/JSON | Tests |
|---------|----------------------|-------------------|-------|
| Backlog system | ~300-400 lines | ~200 lines (workflows + templates) | ~30-40 tests |
| Feature manifest | ~200-300 lines | ~150 lines (manifest file) | ~20-30 tests |
| Update experience | ~50-100 lines | ~100 lines (workflow changes) | ~10-15 tests |
| Agent boilerplate | 0 lines | ~800 lines (conventions doc), net -5,800 lines | ~5-10 verification tests |
| **Total** | **~550-800 lines** | **net -4,550 lines** | **~65-95 tests** |

The net effect is a **reduction** in total system size due to agent boilerplate extraction, while adding significant new capabilities.

---

## Sources

- **gsd-tools.js** (lines 252-397): Existing frontmatter parser and reconstructor -- verified by direct code reading
- **gsd-tools.js** (lines 516-551): Existing todo list implementation -- pattern for backlog listing
- **gsd-tools.js** (lines 571-665): Existing config management -- pattern for manifest validation
- **gsd-tools.js** (lines 2109-2126): Existing `FRONTMATTER_SCHEMAS` validation -- pattern for manifest schema checks
- **knowledge-store.md**: KB directory layout, common base schema, indexing conventions -- pattern for backlog storage
- **version-migration.md**: Additive-only migration rules, version detection, migration log -- pattern for manifest-driven migration
- **upgrade-project.md**: Current migration workflow -- touchpoint for manifest integration
- **update.md**: Current update workflow -- touchpoint for post-update awareness
- **v1.15-CANDIDATE.md**: Milestone scope and phase sketch -- context for feature requirements
- **PROJECT.md**: Zero-dependency constraint, architecture overview -- governing constraints
- [Ajv JSON Schema Validator](https://ajv.js.org/) -- considered and rejected (dependency constraint)
- [Zod](https://zod.dev/) -- considered and rejected (dependency constraint)

---
*Stack research for: GSD Reflect v1.15 -- Backlog, Feature Manifest, Update Experience, Agent Boilerplate*
*Researched: 2026-02-16*
