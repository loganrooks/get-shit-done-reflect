# Architecture Research

**Domain:** Backlog management, feature manifest, and update UX integration for GSD Reflect
**Researched:** 2026-02-16
**Confidence:** HIGH (analysis of existing codebase -- no external research needed)

## System Overview: How New Features Integrate

The three new subsystems integrate with GSD's existing layered architecture. Each adds new files at specific layers without modifying the core Command -> Workflow -> Agent data flow.

```
                         EXISTING LAYERS
                         ===============
  ┌────────────────────────────────────────────────────────────────────┐
  │  Command Layer: commands/gsd/*.md                                  │
  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐ │
  │  │ NEW:     │  │ MODIFIED: │  │ MODIFIED:    │  │ MODIFIED:    │ │
  │  │ backlog  │  │ update    │  │ new-project  │  │ upgrade-     │ │
  │  │          │  │           │  │              │  │ project      │ │
  │  └────┬─────┘  └────┬──────┘  └──────┬───────┘  └──────┬───────┘ │
  ├───────┴──────────────┴───────────────┴──────────────────┴─────────┤
  │  Workflow Layer: get-shit-done/workflows/*.md                      │
  │  ┌──────────┐  ┌───────────┐  ┌──────────────┐  ┌──────────────┐ │
  │  │ NEW:     │  │ MODIFIED: │  │ MODIFIED:    │  │ MODIFIED:    │ │
  │  │ backlog  │  │ update    │  │ new-project  │  │ upgrade-     │ │
  │  │          │  │           │  │              │  │ project      │ │
  │  └────┬─────┘  └─────┬─────┘  └──────┬───────┘  └──────┬───────┘ │
  ├───────┴───────────────┴──────────────┴──────────────────┴─────────┤
  │  Reference Layer: get-shit-done/references/*.md                    │
  │  ┌──────────────────────┐  ┌────────────────────────────────────┐ │
  │  │ NEW:                 │  │ MODIFIED:                          │ │
  │  │ feature-manifest.md  │  │ version-migration.md               │ │
  │  └──────────────────────┘  └────────────────────────────────────┘ │
  ├───────────────────────────────────────────────────────────────────┤
  │  Runtime Layer: bin/install.js, gsd-tools.js                      │
  │  ┌──────────────────────────────────────────────────────────────┐ │
  │  │ MODIFIED: install.js reads feature-manifest.json             │ │
  │  │ MODIFIED: gsd-tools.js gains backlog subcommands             │ │
  │  └──────────────────────────────────────────────────────────────┘ │
  ├───────────────────────────────────────────────────────────────────┤
  │  Data Layer: .planning/*, ~/.gsd/*                                │
  │  ┌──────────────────┐  ┌──────────────────────────────────────┐  │
  │  │ NEW:             │  │ NEW:                                 │  │
  │  │ .planning/       │  │ ~/.gsd/backlog/                     │  │
  │  │  backlog/        │  │  items/                             │  │
  │  │   items/         │  │   YYYY-MM-DD-slug.md                │  │
  │  └──────────────────┘  └──────────────────────────────────────┘  │
  └───────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | New vs Modified |
|-----------|----------------|-----------------|
| Backlog system | Persistent idea capture across milestones | **NEW** -- command, workflow, data dirs |
| Feature manifest | Declarative feature config registration | **NEW** -- JSON manifest, reference doc |
| Update UX | Post-update awareness, project upgrade | **MODIFIED** -- update workflow, upgrade workflow |
| `/gsd:new-project` | Manifest-driven config gathering | **MODIFIED** -- reads manifest for init questions |
| `/gsd:new-milestone` | Backlog item surfacing during scoping | **MODIFIED** -- reads backlog, groups by theme |
| gsd-tools.js | Backlog CRUD, manifest validation | **MODIFIED** -- new subcommands |
| install.js | Manifest-aware file installation | **MODIFIED** -- reads manifest for user-level setup |

## Component 1: Backlog System

### Problem
The current todo system (`/gsd:add-todo`, `.planning/todos/`) is scoped to the current project and milestone. When a milestone completes, todos in `.planning/` may get archived or lost. There is no global idea capture that survives across milestones and projects.

### Architecture: Two-Tier Storage

The backlog lives in two locations, mirroring the existing knowledge base dual-tier pattern (`~/.gsd/knowledge/` for global, `.planning/` for project):

```
~/.gsd/backlog/                          # Global backlog (cross-project)
  items/
    YYYY-MM-DD-slug.md                   # Global idea (not project-specific)
  index.md                               # Auto-generated index (same pattern as KB)

.planning/backlog/                       # Project backlog (project-specific)
  items/
    YYYY-MM-DD-slug.md                   # Project-specific idea
  index.md                               # Auto-generated project index
```

**Why two-tier:** The existing `.planning/todos/` system works for "do this now during this milestone" tasks. The backlog is different -- it captures ideas that may span milestones or apply to other projects. The global tier follows the `~/.gsd/` pattern established by the knowledge base. The project tier follows the `.planning/` pattern for project-scoped artifacts.

**Why NOT extend `.planning/todos/`:** Todos are transient work items (moved to `done/` when worked on). Backlog items are persistent ideas that get promoted into milestones, not "done." Mixing the two semantics in one directory creates confusion about lifecycle.

### Backlog Item Schema

```yaml
---
id: back-YYYY-MM-DD-slug
title: "Human-readable title"
created: 2026-02-16T14:30:00Z
updated: 2026-02-16T14:30:00Z
scope: project | global
project: get-shit-done-reflect    # only for project-scoped items
tags: [ux, performance, feature]
theme: "Descriptive theme name"   # for auto-grouping
priority: high | medium | low     # user-set or auto-inferred
status: captured | promoted | deferred | rejected
promoted_to: "v1.16 Phase 3"     # set when item enters a milestone
source: signal | todo | user | session
source_ref: "sig-2026-02-17-..."  # optional link to originating signal/todo
---

## Idea

[Description of the idea, problem it solves, why it matters]

## Notes

[Any additional context, links, related items]
```

**Key design choices:**
- `theme` field enables auto-grouping during `/gsd:new-milestone` scoping
- `status` tracks lifecycle without physical file movement (unlike todos which move to `done/`)
- `source_ref` creates traceability from signals/todos to backlog items
- Schema mirrors KB entry patterns (YAML frontmatter + markdown body)

### Data Flow: Idea Capture to Milestone Scoping

```
CAPTURE                    STORAGE                    SCOPING
=======                    =======                    =======

User says idea             .planning/backlog/items/   /gsd:new-milestone
       |                          |                        |
       +- /gsd:backlog add ----->|                        |
       |    (inline args)         |                        |
       |                          |                        |
Signal detected ---------->|      |    +-------------------+
       |  (auto-promote   |      |    | Read all items     |
       |   high-severity  |      |    | with status:       |
       |   signals)       |      |    | captured/deferred  |
       |                  |      |    |                    |
Todo promoted ------------>|      |    | Group by theme     |
       |  (/gsd:backlog   |      |    |                    |
       |   promote)       |      |    | Present grouped    |
       |                  |      |    | items to user      |
                          |      |    |                    |
~/.gsd/backlog/items/     |      |    | User selects       |
  (global items)----------+      |    | items for          |
                                 |    | milestone          |
                                 |    |                    |
                                 |    | Selected items:    |
                                 |    | status: promoted   |
                                 |    | promoted_to: v1.16 |
                                 |    +--------------------+
```

### Command Surface

| Command | Purpose | Maps To |
|---------|---------|---------|
| `/gsd:backlog add [idea]` | Capture an idea | NEW command + workflow |
| `/gsd:backlog list [--theme X] [--tag Y]` | Browse backlog | NEW command + workflow |
| `/gsd:backlog promote [item]` | Promote todo/signal to backlog | NEW command + workflow |
| `/gsd:backlog review` | Review + triage backlog items | NEW command + workflow |

**Implementation note:** Rather than 4 separate commands, use a single `/gsd:backlog` command with subcommand routing (same pattern as `/gsd:settings`). The workflow handles routing based on the first argument.

### Integration Points with Existing System

| System | Integration | Direction |
|--------|-------------|-----------|
| `/gsd:add-todo` | "Promote to backlog" action in check-todos | Todo -> Backlog |
| `/gsd:signal` | Auto-promote high-severity signals | Signal -> Backlog |
| `/gsd:new-milestone` | Read backlog, group by theme, present for scoping | Backlog -> Milestone |
| `/gsd:complete-milestone` | Review unaddressed backlog items | Milestone -> Backlog |
| STATE.md | Backlog count in "### Accumulated Context" | Backlog -> State |
| gsd-tools.js | `backlog add`, `backlog list`, `backlog promote`, `backlog stats` | CLI operations |

### gsd-tools.js Extensions

New subcommands following existing patterns (e.g., `todo complete`, `phase add`):

```
backlog add <title> [--scope project|global] [--theme X] [--tags t1,t2] [--priority med]
backlog list [--scope project|global|all] [--theme X] [--tag Y] [--status captured]
backlog promote <source-path> [--scope project|global]
backlog update <id> --field <key> --value <val>
backlog stats [--scope project|global|all]
backlog index [--scope project|global|all]   # rebuild index
```

## Component 2: Feature Manifest System

### Problem
Adding new GSD features (like `/gsd:release`) requires:
1. Manually coding config questions into `/gsd:new-project` workflow
2. Manually adding migration logic to version-migration.md
3. Manually adding gap detection to `/gsd:upgrade-project` workflow

Each new feature duplicates this pattern. The feature manifest makes it declarative.

### Architecture: Static JSON Manifest

The manifest is a **static JSON file** shipped with GSD, not dynamically generated. It declares what config each feature needs, and existing workflows read it.

```
get-shit-done/
  feature-manifest.json        # NEW: declarative feature config registry
  references/
    feature-manifest.md        # NEW: reference doc explaining manifest schema
```

**Why JSON (not YAML/Markdown):** The manifest is consumed by `install.js` (Node.js) and `gsd-tools.js` (Node.js), which natively parse JSON. YAML would require a dependency. Markdown would require parsing. JSON is zero-dependency and already used for `config.json`.

### Manifest Schema

```json
{
  "$schema": "feature-manifest-v1",
  "features": {
    "health_check": {
      "version_introduced": "1.12.0",
      "scope": "project",
      "required": false,
      "config_section": "health_check",
      "schema": {
        "frequency": {
          "type": "string",
          "enum": ["milestone-only", "on-resume", "every-phase", "explicit-only"],
          "default": "milestone-only",
          "description": "How often health checks run"
        },
        "stale_threshold_days": {
          "type": "number",
          "default": 7,
          "description": "Days before STATE.md is considered stale"
        },
        "blocking_checks": {
          "type": "boolean",
          "default": false,
          "description": "Whether health warnings block execution"
        }
      },
      "init_prompts": [
        {
          "field": "frequency",
          "question": "How often should health checks run?",
          "options": [
            { "value": "milestone-only", "label": "Milestone only (default)", "description": "Check at milestone boundaries" },
            { "value": "on-resume", "label": "On resume", "description": "Check when resuming work" },
            { "value": "every-phase", "label": "Every phase", "description": "Check before each phase" },
            { "value": "explicit-only", "label": "Explicit only", "description": "Only when you run /gsd:health-check" }
          ]
        }
      ]
    },
    "release": {
      "version_introduced": "1.15.0",
      "scope": "project",
      "required": false,
      "config_section": "release",
      "schema": {
        "version_file": {
          "type": "string",
          "default": "package.json",
          "description": "File containing project version"
        },
        "changelog": {
          "type": "string",
          "default": "CHANGELOG.md",
          "description": "Changelog file path"
        },
        "changelog_format": {
          "type": "string",
          "enum": ["keepachangelog", "conventional", "freeform"],
          "default": "keepachangelog",
          "description": "Changelog format"
        },
        "ci_trigger": {
          "type": "string",
          "enum": ["github-release", "git-tag", "manual", "none"],
          "default": "none",
          "description": "What triggers CI/CD on release"
        },
        "registry": {
          "type": "string",
          "default": "none",
          "description": "Package registry (npm, pypi, crates.io, none)"
        },
        "branch": {
          "type": "string",
          "default": "main",
          "description": "Branch releases are made from"
        }
      },
      "init_prompts": [
        {
          "field": "version_file",
          "question": "Where is your version number stored?",
          "options": [
            { "value": "package.json", "label": "package.json", "description": "Node.js / JavaScript" },
            { "value": "Cargo.toml", "label": "Cargo.toml", "description": "Rust" },
            { "value": "pyproject.toml", "label": "pyproject.toml", "description": "Python" },
            { "value": "VERSION", "label": "VERSION file", "description": "Plain text version file" }
          ]
        }
      ],
      "auto_detect": {
        "version_file": [
          { "check": "file_exists", "path": "package.json", "value": "package.json" },
          { "check": "file_exists", "path": "Cargo.toml", "value": "Cargo.toml" },
          { "check": "file_exists", "path": "pyproject.toml", "value": "pyproject.toml" }
        ]
      }
    }
  }
}
```

### How the Manifest Flows Through the System

```
MANIFEST SOURCE                CONSUMERS                     EFFECT
==============                 =========                     ======

get-shit-done/                 /gsd:new-project              Step 5 iterates manifest
  feature-manifest.json ------>  (workflow reads manifest)    features with scope:project
         |                        |                           Asks init_prompts[]
         |                        |                           Writes config.json sections
         |                        v
         |                     .planning/config.json          Contains all feature configs
         |
         +-------------------->/gsd:upgrade-project           Diffs manifest schema
         |                      (workflow reads manifest)     against existing config.json
         |                        |                           Adds missing sections
         |                        |                           Runs init_prompts for new
         |                        v
         |                     .planning/config.json          Patched with new features
         |
         +-------------------->version-migration.md           No longer needs per-version
         |                      (simplified)                  migration actions hardcoded
         |                                                    Manifest IS the migration spec
         |
         +-------------------->install.js                     Reads manifest for user-level
                                (future: scope:user)          features (currently none)
```

### Key Design Decisions

**Manifest is read-only at runtime.** The manifest ships with GSD and describes what features exist and what config they need. It is never modified by user workflows. Only `config.json` is written to.

**Manifest replaces hardcoded migration actions.** Currently, `version-migration.md` lists specific fields to add per version. With the manifest, `/gsd:upgrade-project` simply diffs `feature-manifest.json` against `config.json` -- any declared section missing from config gets initialized. No per-version migration code needed.

**`auto_detect` enables smart defaults.** For features like `release`, the manifest declares file-existence checks. During `/gsd:new-project` or `/gsd:upgrade-project`, these auto-detect rules run first. If detection succeeds, the user is shown the detected value as the default rather than being asked.

**Backward compatibility.** Existing `config.json` files without manifest-declared sections continue to work. Features check for their config section and fall back to defaults if absent. The manifest only adds -- never removes or renames.

## Component 3: Update Experience Improvements

### Problem
The current update flow has gaps:
1. `/gsd:update` installs new files but does not trigger `/gsd:upgrade-project`
2. User must manually run `/gsd:upgrade-project` after updating
3. No awareness of what new features need project-level initialization

### Architecture: Connected Update Pipeline

```
/gsd:update                        /gsd:upgrade-project
===========                        ====================

1. Check npm version               1. Read installed VERSION
2. Show changelog                   2. Read config.json version
3. User confirms                    3. Load feature-manifest.json
4. Run npx install                  4. Diff manifest vs config
5. Clear update cache               5. For each missing section:
6. --- NEW ------------------>         a. Run auto_detect rules
   Check if project needs              b. Ask init_prompts (interactive)
   upgrade (manifest diff)                OR apply defaults (YOLO/auto)
7. If yes: suggest                     c. Write to config.json
   /gsd:upgrade-project             6. Update gsd_reflect_version
   OR auto-run if YOLO              7. Log migration
                                    8. Report changes
```

### Modified: update.md Workflow

After the install step succeeds, add a new step:

```
<step name="check_project_upgrade">
After update completes, check if the project needs a config upgrade:

1. Read feature-manifest.json from the newly installed files
2. Read .planning/config.json (if exists)
3. If config.json exists AND manifest has features not in config:
   - Display: "New features available: [list]. Run /gsd:upgrade-project to configure."
   - If YOLO mode: auto-run upgrade-project workflow with --auto
</step>
```

### Modified: upgrade-project.md Workflow

Replace the hardcoded migration actions in step 5 ("Apply Additive Config Patches") with manifest-driven logic:

```
<step name="apply_manifest_patches">
1. Load feature-manifest.json
2. Load .planning/config.json
3. For each feature in manifest where scope == "project":
   a. If config_section NOT in config.json:
      - Feature is uninitialized
      - In interactive mode: run init_prompts via AskUserQuestion
      - In YOLO/auto mode: apply schema defaults
      - Write section to config.json
   b. If config_section IS in config.json:
      - Check for new fields (added in later versions)
      - Add missing fields with defaults only
4. Update gsd_reflect_version
5. Log migration
</step>
```

### Modified: new-project.md Workflow

Replace hardcoded Step 5 ("Workflow Preferences") with manifest-driven config gathering:

**Before (hardcoded):**
```
Step 5: Ask about mode, depth, parallelization, commit_docs,
        research, plan_check, verifier, model_profile
        (all questions hardcoded in workflow)
```

**After (manifest-driven):**
```
Step 5: Core config (STAYS hardcoded: mode, depth, parallelization,
        commit_docs, model_profile, workflow agents)
        These are core GSD settings, not features.

Step 5.5 (NEW): Load feature-manifest.json
        For each feature where scope == "project":
          Run auto_detect rules
          Ask init_prompts (or apply defaults if --auto)
        Write collected config to .planning/config.json
```

**Backward compatibility note:** The core workflow settings (mode, depth, parallelization, commit_docs, model_profile, workflow agents) are NOT features -- they are core config. These remain hardcoded in the workflow. Only additional feature-specific sections (health_check, devops, release, etc.) use the manifest.

## Component 4: Agent Spec Boilerplate Extraction

### Problem
11 agent specs share ~600 lines of common protocol (role definition, tool strategy, execution flow, structured returns). Changes to the protocol require updating all 11 files.

### Architecture: Shared Protocol Reference

```
get-shit-done/
  references/
    agent-protocol.md        # NEW: shared agent execution protocol
```

Each agent spec removes the duplicated sections and adds an `@`-reference:

```markdown
---
name: gsd-executor
# ... frontmatter
---

<required_reading>
@./.claude/get-shit-done/references/agent-protocol.md
</required_reading>

<role>
[Agent-specific role definition -- NOT shared]
</role>

<execution>
[Agent-specific execution steps -- NOT shared]
</execution>
```

**What moves to agent-protocol.md:**
- Git safety protocol (shared across all agents that commit)
- Structured return format (SUCCESS/BLOCKED)
- Tool usage conventions
- File path handling rules
- Commit message formatting
- Error reporting conventions

**What stays in each agent:**
- Role definition and purpose
- Allowed tools (YAML frontmatter -- already agent-specific)
- Execution steps
- Agent-specific output formats

**Estimated reduction:** From ~600 shared lines per agent to ~50 lines of `@`-references + agent-specific content. 11 agents * 550 lines saved = ~6,050 lines eliminated system-wide.

## Recommended Project Structure (New Files)

```
get-shit-done/
  feature-manifest.json                    # NEW: declarative feature registry
  references/
    feature-manifest.md                    # NEW: manifest schema reference
    agent-protocol.md                      # NEW: shared agent execution protocol
  workflows/
    backlog.md                             # NEW: backlog operations workflow
  templates/
    backlog-item.md                        # NEW: backlog item template

commands/gsd/
    backlog.md                             # NEW: /gsd:backlog command

.planning/                                 # Per-project (user's repo)
  backlog/
    items/
      YYYY-MM-DD-slug.md                   # Project-scoped backlog items

~/.gsd/                                    # Global (user's home)
  backlog/
    items/
      YYYY-MM-DD-slug.md                   # Global backlog items
    index.md                               # Auto-generated index
```

### Structure Rationale

- **`feature-manifest.json` at `get-shit-done/` root:** Co-located with other top-level config (VERSION, CHANGELOG.md). Installed alongside them.
- **`backlog/` at `.planning/`:** Follows the `.planning/todos/` pattern for project-scoped captures.
- **`backlog/` at `~/.gsd/`:** Follows the `~/.gsd/knowledge/` pattern for cross-project data.
- **Single `backlog.md` command:** Subcommand routing avoids command proliferation (matches existing `/gsd:settings` pattern).

## Architectural Patterns

### Pattern 1: Manifest-Driven Configuration

**What:** A static JSON file declares what config each feature needs. Workflows read this file and generate config from it rather than hardcoding questions.

**When to use:** When multiple entry points (new-project, upgrade-project, update) need the same feature configuration logic.

**Trade-offs:**
- PRO: Single source of truth for feature config requirements
- PRO: Adding a new feature's config is one manifest edit, not 3 workflow edits
- PRO: Auto-detect rules make smart defaults possible
- CON: Adds indirection (workflow reads manifest reads schema)
- CON: JSON schema is less expressive than inline code for complex conditions

**Example:**
```javascript
// In gsd-tools.js or workflow logic:
const manifest = JSON.parse(fs.readFileSync('feature-manifest.json', 'utf8'));
const config = JSON.parse(fs.readFileSync('.planning/config.json', 'utf8'));

for (const [featureName, feature] of Object.entries(manifest.features)) {
  if (feature.scope === 'project' && !config[feature.config_section]) {
    // Feature needs initialization
    const defaults = {};
    for (const [field, schema] of Object.entries(feature.schema)) {
      defaults[field] = schema.default;
    }
    config[feature.config_section] = defaults;
  }
}
```

### Pattern 2: Two-Tier Storage (Project + Global)

**What:** Data that spans milestones lives in both `.planning/` (project-scoped) and `~/.gsd/` (global). Same pattern already used by the knowledge base.

**When to use:** When data needs to survive milestone archival AND be accessible across projects.

**Trade-offs:**
- PRO: Familiar pattern (KB already works this way)
- PRO: Project backlog committed to git with project
- PRO: Global backlog travels with user
- CON: Two directories to manage
- CON: Index rebuild must scan both tiers

### Pattern 3: Status-Based Lifecycle (Not Directory-Based)

**What:** Backlog items use a `status` field in frontmatter rather than moving between directories (unlike todos which move from `pending/` to `done/`).

**When to use:** When items have a multi-stage lifecycle (captured -> promoted -> deferred -> rejected) rather than a binary state (pending/done).

**Trade-offs:**
- PRO: No file moves on status change (simpler git history)
- PRO: Supports more lifecycle states than 2 directories
- PRO: Query by status via grep (fast)
- CON: "Active" items not immediately obvious from directory listing
- CON: Requires filtering in list operations

## Data Flow

### Backlog Item Lifecycle

```
[User idea / Signal / Todo]
         |
         v
  /gsd:backlog add          status: captured
         |                  scope: project or global
         v
  /gsd:backlog review       User triages:
         |                    - Keep as captured
         +- Defer ----------> status: deferred
         +- Reject ----------> status: rejected
         +- Keep ------------> status: captured (unchanged)
         |
         v
  /gsd:new-milestone        Items presented grouped by theme
         |                  User selects items for milestone
         v
  Selected items            status: promoted
                            promoted_to: "v1.16 Phase 3"
                            (items become REQUIREMENTS in new milestone)
```

### Feature Config Initialization

```
[GSD ships with feature-manifest.json]
         |
         v
  /gsd:new-project
         |
         +- Step 5: Core config (hardcoded: mode, depth, etc.)
         |
         +- Step 5.5: Feature config (manifest-driven)
         |     |
         |     +- Load manifest
         |     +- For each scope:project feature:
         |     |     +- Run auto_detect (check file existence)
         |     |     +- Ask init_prompts (interactive) or apply defaults (auto)
         |     |     +- Write to config.json
         |     +- Commit config.json
         |
         v
  .planning/config.json     (contains all feature sections)
```

### Update-to-Upgrade Pipeline

```
/gsd:update
  |
  +- Install new files (npx)
  +- Clear update cache
  |
  +- NEW: Check manifest diff
  |     |
  |     +- Load new feature-manifest.json
  |     +- Load .planning/config.json
  |     +- Compare: find features with no config section
  |     |
  |     +- If gaps found AND YOLO mode:
  |     |     +- Auto-run /gsd:upgrade-project --auto
  |     |
  |     +- If gaps found AND interactive:
  |           +- Display: "Run /gsd:upgrade-project to configure new features"
  |
  +- Display restart reminder
```

## Anti-Patterns

### Anti-Pattern 1: Merging Todos and Backlog

**What people do:** Try to extend `.planning/todos/` with backlog semantics (tags, themes, promotion).

**Why it's wrong:** Todos are transient work items with a binary lifecycle (pending/done). Backlog items are persistent ideas with a multi-stage lifecycle. Mixing them creates confusion about when an item is "done" vs "promoted." Todo `done/` directory implies completion, but promoted backlog items are just beginning their journey.

**Do this instead:** Keep todos for immediate work. Backlog for persistent ideas. Provide a "promote to backlog" action in `/gsd:check-todos` for items that deserve longer-term tracking.

### Anti-Pattern 2: Hardcoding Feature Config in Workflows

**What people do:** Add new config questions directly into `new-project.md` and new migration actions into `version-migration.md` for each feature.

**Why it's wrong:** N features * 3 entry points (new-project, upgrade-project, update) = 3N code locations to maintain. Each new feature requires editing 3+ files.

**Do this instead:** Declare the feature in `feature-manifest.json`. Let the manifest-reading logic in workflows handle initialization, migration, and gap detection generically.

### Anti-Pattern 3: Storing Backlog in STATE.md

**What people do:** Embed backlog items directly in STATE.md's "Accumulated Context" section.

**Why it's wrong:** STATE.md has a 100-line size constraint. It's a digest, not a store. Backlog can grow unbounded. Embedding it violates the "read once, know where we are" contract.

**Do this instead:** Store backlog items as individual files. Reference only the count and a pointer in STATE.md: "12 backlog items -- see /gsd:backlog list".

## Integration Points

### New Files Created/Modified per Component

**Backlog System (NEW):**

| File | Layer | Purpose |
|------|-------|---------|
| `commands/gsd/backlog.md` | Command | NEW: `/gsd:backlog` command |
| `get-shit-done/workflows/backlog.md` | Workflow | NEW: backlog operations orchestration |
| `get-shit-done/templates/backlog-item.md` | Template | NEW: backlog item file template |

**Feature Manifest (NEW):**

| File | Layer | Purpose |
|------|-------|---------|
| `get-shit-done/feature-manifest.json` | Reference | NEW: declarative feature registry |
| `get-shit-done/references/feature-manifest.md` | Reference | NEW: manifest schema docs |

**Update Experience (MODIFIED):**

| File | Layer | Change |
|------|-------|--------|
| `get-shit-done/workflows/update.md` | Workflow | ADD: post-update manifest diff check |
| `get-shit-done/workflows/upgrade-project.md` | Workflow | REPLACE: hardcoded patches with manifest-driven logic |
| `get-shit-done/workflows/new-project.md` | Workflow | ADD: Step 5.5 for manifest-driven feature config |
| `get-shit-done/workflows/new-milestone.md` | Workflow | ADD: backlog item surfacing during Step 2 |
| `get-shit-done/references/version-migration.md` | Reference | SIMPLIFY: remove hardcoded migration actions |

**Agent Boilerplate (MODIFIED):**

| File | Layer | Change |
|------|-------|--------|
| `get-shit-done/references/agent-protocol.md` | Reference | NEW: shared execution protocol |
| `agents/gsd-executor.md` | Agent | REDUCE: extract shared protocol |
| `agents/gsd-planner.md` | Agent | REDUCE: extract shared protocol |
| `agents/gsd-verifier.md` | Agent | REDUCE: extract shared protocol |
| `agents/gsd-debugger.md` | Agent | REDUCE: extract shared protocol |
| (+ 7 other agent specs) | Agent | REDUCE: extract shared protocol |

**Runtime (MODIFIED):**

| File | Layer | Change |
|------|-------|--------|
| `bin/install.js` | Runtime | ADD: copy feature-manifest.json during install |
| `bin/gsd-tools.js` | Runtime | ADD: backlog subcommands |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Backlog <-> Milestone scoping | Workflow reads backlog files, updates status in frontmatter | Read during new-milestone Step 2 |
| Backlog <-> Todos | "Promote" action reads todo, creates backlog item, optionally marks todo done | Cross-workflow file operation |
| Backlog <-> Signals | Auto-promote high-severity signals | Signal workflow checks severity, creates backlog item |
| Manifest <-> Config | Manifest defines schema, config stores values | Manifest is read-only reference; config is read-write state |
| Manifest <-> Install | install.js copies manifest to target dir | Same mechanism as CHANGELOG.md, VERSION |
| Update <-> Upgrade | Update detects gaps via manifest, suggests/triggers upgrade | Post-update hook, not automatic by default |

## Suggested Build Order

Build order is driven by dependency chains. Features built first are consumed by features built later.

### Phase 1: Agent Boilerplate Extraction
**Rationale:** No dependencies on other new features. Reduces agent spec sizes before any modifications. Changes are mechanical (extract shared text, add `@`-references). Low risk.
- Create `references/agent-protocol.md`
- Extract shared sections from all 11 agents
- Verify agents still function with `@`-reference pattern

### Phase 2: Feature Manifest System
**Rationale:** Foundation that `/gsd:upgrade-project` and `/gsd:new-project` modifications depend on. Must exist before update UX changes.
- Create `feature-manifest.json` with existing features (health_check, devops)
- Create `references/feature-manifest.md` (schema reference)
- Add `release` feature to manifest
- Add gsd-tools.js manifest validation subcommand
- Modify install.js to copy manifest file

### Phase 3: Feature Manifest Integration
**Rationale:** Depends on Phase 2 (manifest exists). Modifies three workflows to consume the manifest.
- Modify `upgrade-project.md` to use manifest-driven patches
- Modify `new-project.md` to add Step 5.5 (manifest-driven feature config)
- Modify `update.md` to add post-update manifest diff check
- Simplify `version-migration.md` (remove hardcoded migration actions)

### Phase 4: Backlog System Core
**Rationale:** No dependency on manifest (backlog uses its own storage). Can be built in parallel with Phase 3 if resources allow.
- Create backlog item schema and template
- Create `commands/gsd/backlog.md` and `workflows/backlog.md`
- Add gsd-tools.js backlog subcommands (add, list, update, stats, index)
- Create `.planning/backlog/` and `~/.gsd/backlog/` directory structures
- Add backlog count to STATE.md accumulated context

### Phase 5: Backlog Integration
**Rationale:** Depends on Phase 4 (backlog exists). Connects backlog to existing workflows.
- Modify `/gsd:new-milestone` to surface backlog items during scoping
- Add "promote to backlog" action in `/gsd:check-todos`
- Add auto-promote for high-severity signals
- Modify `/gsd:complete-milestone` to review unaddressed backlog

### Phase 6: Workflow DX and Reliability
**Rationale:** Independent of backlog/manifest. Can be scheduled flexibly. Groups remaining DX improvements.
- Lighten `/gsd:quick` (fast path for simple tasks)
- Installer hardening (try-catch, validation, error tests)
- Shell script fixes (portability)

**Dependency graph:**
```
Phase 1 (Boilerplate) ─────────────────────────────────────> Phase 6 (DX)
                                                                  ^
Phase 2 (Manifest) ──> Phase 3 (Manifest Integration)            |
                                                                  |
Phase 4 (Backlog) ───> Phase 5 (Backlog Integration) ────────────+
```

Phases 1, 2, and 4 have no mutual dependencies and can begin in any order. Phase 3 requires Phase 2. Phase 5 requires Phase 4. Phase 6 has no dependencies but should come last to benefit from all preceding refactors.

## Sources

- Existing codebase analysis: `.planning/codebase/ARCHITECTURE.md`, `STRUCTURE.md`, `INTEGRATIONS.md`
- Todo: `.planning/todos/pending/2026-02-17-feature-manifest-system-for-declarative-feature-initialization.md`
- Milestone candidate: `.planning/milestones/v1.15-CANDIDATE.md`
- Workflow files: `workflows/new-project.md`, `workflows/upgrade-project.md`, `workflows/update.md`, `workflows/new-milestone.md`, `workflows/complete-milestone.md`
- Runtime: `bin/install.js` (file copy logic, manifest system), `bin/gsd-tools.js` (CLI subcommands)
- Knowledge store: `agents/knowledge-store.md` (two-tier storage pattern)
- State template: `templates/state.md` (size constraint, accumulated context)
- Existing todo/check-todos system: `workflows/add-todo.md`, `workflows/check-todos.md`

---
*Architecture research for: GSD Reflect v1.15 Backlog, Feature Manifest, and Update UX*
*Researched: 2026-02-16*
