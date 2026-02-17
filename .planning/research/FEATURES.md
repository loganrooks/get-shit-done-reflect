# Feature Research

**Domain:** CLI-native backlog management, config migration, and update UX for AI coding workflow system
**Researched:** 2026-02-16
**Confidence:** HIGH (domain well-understood, existing system thoroughly analyzed, ecosystem patterns verified)

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist in a backlog/config/update system. Missing these = product feels broken.

#### Backlog Management

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Structured idea capture with metadata | Current flat bullets in STATE.md lose context; users expect ideas to have title, area, priority, and origin | LOW | Existing `add-todo` already creates YAML frontmatter files in `todos/pending/`; needs `priority` and `source` fields added |
| Status lifecycle (pending -> triaged -> planned -> done) | Users need to see where an idea sits in its journey; backlog.md and todo.txt both implement status tracking | LOW | Currently only pending/done directories; add `status` frontmatter field instead of relying on directory location |
| List/filter/sort by area, priority, age | Users need to find relevant ideas quickly; every CLI tracker (git-issue, backlog.md, todo.txt) supports filtering | LOW | Existing `check-todos` has area filter; extend to priority and age sort |
| Backlog -> milestone pipeline | Ideas captured during work must flow into `/gsd:new-milestone` planning; without this, ideas get lost between milestones | MEDIUM | `new-milestone` Step 2 reads STATE.md pending todos; needs to also read `todos/pending/*.md` and present them grouped |
| Duplicate detection across backlog | Users accidentally re-capture the same idea; `add-todo` has grep-based duplicate check but it is keyword-only | LOW | Improve matching to compare title similarity, not just grep keywords |

#### Config Migration

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Additive-only config patching | Users expect upgrades to never break existing settings; already implemented in `upgrade-project` workflow | LOW | Already works; pattern is solid. Extend to new config sections. |
| Feature-aware config gap detection | After update, features that need new config should tell the user; currently silent -- user discovers missing config when command fails | MEDIUM | The feature manifest todo describes this exactly. Each feature declares its config requirements. |
| Sensible defaults that preserve behavior | New config fields must default to "system worked like this before"; users shouldn't need to act | LOW | Already the pattern. Maintain it for all new sections (backlog, release, etc.) |
| Migration logging | Users need an audit trail of what changed; already implemented in `migration-log.md` | LOW | Already works. No changes needed. |

#### Update Experience

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Show what changed (changelog) | Users need to know what they are getting; already implemented in `/gsd:update` | LOW | Already works. Could be enhanced with feature highlights vs raw changelog. |
| Post-update next steps | After updating, users need to know if project-level action is needed; currently shows "restart Claude Code" only | LOW | Add: "Run `/gsd:upgrade-project` to adopt new features" when project version trails installed version |
| Non-destructive upgrade path | Users fear losing customizations; installer already backs up to `gsd-local-patches/` | LOW | Already works. Communicate it more prominently. |
| Version mismatch detection | Users should know when their project config is behind; session-start hook already caches this | LOW | Already works via `gsd-version-check.js` hook. Surface it more visibly. |

### Differentiators (Competitive Advantage)

Features that set GSD apart from backlog.md, todo.txt, git-issue, and generic project management. These leverage GSD's unique position as an AI-workflow-native system.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| AI-context-aware capture | Unlike backlog.md or todo.txt, GSD todos capture the conversation context, referenced files, and agent state at capture time -- future Claude sessions can reconstruct why the idea matters | LOW | Existing `add-todo` already extracts conversation context. Add `source` field (which command/phase spawned the capture). |
| Backlog-to-requirements pipeline | No CLI backlog tool connects ideas to milestone planning. GSD can present grouped backlog items during `new-milestone` and auto-generate requirements from selected items. | MEDIUM | This is the "ideas flow into planning" core value. `new-milestone` Step 2 should read todos, group by area, let user select/reject for milestone scope. |
| Feature manifest system | Features self-declare their config needs. New features get config initialized during project setup; existing projects get prompted during upgrade. No other CLI tool does this. | HIGH | Per the existing todo: each feature declares config schema, scope (user vs project), defaults, migration path. Foundational architecture change. |
| Config schema with typed defaults | config.json becomes self-documenting: schema validates fields, provides descriptions, and enables `/gsd:settings` to show all configurable options without hardcoding. | MEDIUM | Currently config is freeform JSON. Adding a JSON Schema alongside it enables validation and auto-documentation. |
| Smart post-update flow | After `/gsd:update`, automatically detect what new features are available, what config they need, and offer guided initialization -- not just "restart". The update-notifier pattern applied to a workflow system. | MEDIUM | Chain: update -> detect version gap -> show new features -> offer upgrade-project -> mini-onboard for new features. |
| Lightweight quick mode | `/gsd:quick` spawns planner (1,157L) + executor (403L) for tasks that often need 5 lines of changes. A direct-execute path for trivial tasks would halve context usage. | MEDIUM | Detect "trivial" tasks (e.g., single-file edit, under ~100 words) and skip planner spawn. Execute inline with commit. |
| Idea triage during milestone planning | During `/gsd:new-milestone`, present backlog items with recommendation: "This seems related to [area], priority [X]. Include in milestone?" AI-assisted triage, not just a list. | MEDIUM | Requires backlog items to have enough metadata (area, priority) for intelligent grouping. |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full Kanban board / web UI | backlog.md has one; visual boards are appealing | GSD is CLI-native, zero-dependency. Adding a web UI creates maintenance burden, breaks the "works in any AI assistant" promise, adds a runtime dependency. | Keep backlog as files. Use `/gsd:check-todos` for interactive browsing. Users who want visual boards can use backlog.md alongside GSD. |
| Automatic priority scoring | AI could auto-assign priorities based on impact/effort | Priority is subjective and context-dependent. Auto-scoring creates false confidence and users stop reading scores. | Suggest priority during capture ("This seems HIGH because it blocks [X]"), but always require user confirmation. |
| Real-time sync across sessions | Todos could sync across Claude sessions in real-time | GSD is file-based and git-committed. Real-time sync requires a server, WebSocket, or shared state mechanism that violates zero-dependency. | Git commit + git pull is the sync mechanism. Each session reads current state from disk. |
| Mandatory backlog grooming sessions | Force users to review backlog before starting milestones | Users have different workflows. Mandatory grooming gates slow down users who already know what they want to build. | Surface backlog count in `/gsd:new-milestone` banner. Offer triage as optional step. Nudge, don't block. |
| Config migration scripts per version | Versioned migration scripts (migrate-1.12-to-1.13.js, etc.) like database migrations | Creates maintenance burden and ordering complexity. Current additive-only approach (check if field exists, add if missing) is simpler and handles any-version-to-current jumps. | Keep the current pattern: single migration function that checks for each field/section and adds what is missing. Version stamp updated last for retry safety. |
| Undo/rollback for config changes | Users might want to undo a config migration | Config changes are additive (only new fields). There is nothing to undo -- the old behavior is preserved by defaults. Adding rollback creates complexity for a scenario that does not occur. | Migration log provides audit trail. If a user wants to revert, they can manually remove the new fields (they are inert with defaults). |
| Backlog item dependencies | Track "idea A blocks idea B" | Over-engineering for a capture system. Dependencies belong in the roadmap (phases have depends_on), not in the raw backlog. Adding dependency tracking to todos creates a second project management system. | Capture dependency notes in the todo's "Solution" section as free text. Formalize dependencies when ideas graduate to roadmap phases. |

## Feature Dependencies

```
[Backlog metadata enrichment (priority, source, status)]
    |
    +--requires--> [add-todo field additions]
    |
    +--enables--> [Backlog-to-milestone pipeline]
    |                 |
    |                 +--enables--> [Idea triage during milestone planning]
    |
    +--enables--> [Smart filtering/sorting in check-todos]

[Feature manifest system]
    |
    +--requires--> [Config schema definition]
    |
    +--enables--> [Feature-aware config gap detection]
    |                 |
    |                 +--enables--> [Smart post-update flow]
    |
    +--enables--> [New feature mini-onboarding in upgrade-project]
    |
    +--enables--> [Config-driven /gsd:release]

[Lightweight quick mode]
    |
    +--independent (no dependencies on backlog or config features)

[Post-update next steps]
    |
    +--requires--> [Version mismatch detection (exists)]
    +--enhanced-by--> [Feature-aware config gap detection]
```

### Dependency Notes

- **Backlog metadata enrichment requires add-todo field additions:** Cannot filter by priority if todos do not have a priority field. The field additions are the foundation.
- **Backlog-to-milestone pipeline requires metadata enrichment:** The pipeline presents grouped/prioritized items. Without metadata, it is just a flat list (no better than current STATE.md bullets).
- **Feature manifest requires config schema:** The manifest declares what config a feature needs. Without a schema definition format, there is nothing to declare against.
- **Smart post-update flow enhanced by feature-aware gap detection:** Post-update can work without the manifest (just show changelog + remind to upgrade), but the manifest enables "here are 3 new features that need config."
- **Lightweight quick mode is independent:** Can be built in any order. No dependency on backlog or config features.

## MVP Definition

### Launch With (v1.15)

Minimum viable backlog + config + update improvements for this milestone.

- [ ] **Backlog metadata enrichment** -- Add `priority` (HIGH/MEDIUM/LOW), `source` (command/phase/conversation), and `status` (pending/triaged/planned/done) fields to todo frontmatter. Existing todos auto-default to `priority: MEDIUM, source: unknown, status: pending`.
- [ ] **Backlog-to-milestone pipeline** -- `/gsd:new-milestone` Step 2 reads `todos/pending/*.md`, groups by area, presents with priority, lets user select items for milestone scope. Selected items get `status: planned`. Rejected items stay pending.
- [ ] **Feature manifest system (minimal)** -- JSON manifest file declaring config schema for 3-5 features (release, health_check, devops, backlog). `/gsd:upgrade-project` reads manifest, diffs against config.json, initializes missing sections.
- [ ] **Post-update guided flow** -- After `/gsd:update` completes, detect project version gap, surface count of new features needing config, and offer `/gsd:upgrade-project` inline.
- [ ] **Lightweight quick fast-path** -- For tasks with description under ~100 words and no file dependencies, skip planner spawn. Execute directly with commit. Fall back to full planner for complex tasks.

### Add After Validation (v1.15.x)

Features to add once core is working and patterns are validated.

- [ ] **Config schema validation** -- JSON Schema that validates config.json structure. `/gsd:settings` reads schema to show all configurable options. Trigger: after manifest system proves the pattern works.
- [ ] **Idea triage AI suggestions** -- During `/gsd:new-milestone`, AI suggests which backlog items to include based on milestone theme, area alignment, and priority. Trigger: after backlog-to-milestone pipeline is used for 1-2 milestones.
- [ ] **Backlog age alerts** -- Items older than N days get surfaced in `/gsd:health-check`. Trigger: after backlog has accumulated items across 2+ milestones.
- [ ] **Release config initialization** -- `/gsd:new-project` asks about release infrastructure (version file, changelog format, CI trigger). Config.json gains a `release` section. Trigger: after feature manifest pattern is stable.

### Future Consideration (v2+)

Features to defer until the system has more usage data.

- [ ] **Cross-project backlog** -- Shared backlog across projects at `~/.gsd/backlog/`. Defer: needs clear use case beyond "my projects share ideas."
- [ ] **Backlog analytics** -- Capture rate, triage rate, graduation-to-milestone rate. Defer: needs MCP server for efficient metrics collection (Pillar 2 of v1.15 candidate).
- [ ] **External issue tracker sync** -- Import from GitHub Issues, Linear, etc. Defer: violates zero-dependency principle unless done as optional integration.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Depends On |
|---------|------------|---------------------|----------|------------|
| Backlog metadata enrichment | HIGH | LOW | P1 | Nothing (foundation) |
| Backlog-to-milestone pipeline | HIGH | MEDIUM | P1 | Metadata enrichment |
| Post-update guided flow | HIGH | LOW | P1 | Version detection (exists) |
| Feature manifest system (minimal) | HIGH | HIGH | P1 | Config schema definition |
| Lightweight quick fast-path | MEDIUM | MEDIUM | P2 | Nothing (independent) |
| Config schema validation | MEDIUM | MEDIUM | P2 | Feature manifest |
| Idea triage AI suggestions | MEDIUM | LOW | P2 | Backlog pipeline |
| Backlog age alerts | LOW | LOW | P3 | Backlog metadata |
| Release config initialization | MEDIUM | MEDIUM | P2 | Feature manifest |
| Cross-project backlog | LOW | HIGH | P3 | Backlog system stable |

**Priority key:**
- P1: Must have for this milestone
- P2: Should have, add when possible within milestone
- P3: Nice to have, defer to future milestone

## Competitor Feature Analysis

| Feature | backlog.md | todo.txt | git-issue | GSD Reflect (proposed) |
|---------|-----------|----------|-----------|----------------------|
| **Data format** | Markdown + YAML frontmatter in `backlog/` directory | Single `todo.txt` flat file with inline metadata | Plain text files in git branch (`issues/` tree) | Markdown + YAML frontmatter in `todos/pending/` (already exists) |
| **Status tracking** | `status` field: backlog, todo, inprogress, done, archive | Completion marker (`x`) + priority `(A)` | Open/closed with tags | `status` field: pending, triaged, planned, done (proposed) |
| **Tagging** | `project`, `type`, `priority` in frontmatter | `+Project` `@Context` inline | Tags as separate files per issue | `area`, `priority`, `source` in frontmatter (proposed) |
| **Filtering** | CLI search + query commands | `grep` + `sort` on flat file | `git issue list --label` | `/gsd:check-todos [area]` (extend to priority/sort) |
| **Planning integration** | Manual (user reads board, creates tasks) | None (standalone tracker) | None (standalone tracker) | **Automatic: backlog feeds `/gsd:new-milestone`** (unique differentiator) |
| **AI integration** | MCP server for AI agents, AGENTS.md instruction file | None | None | **Native: capture from AI conversation, AI-assisted triage** (unique differentiator) |
| **Config migration** | N/A (no config evolution story) | N/A | N/A | **Additive migration with manifest-driven gap detection** (unique) |
| **Update experience** | `npm update` + manual review | Manual update | `git pull` | **Guided: changelog + gap detection + mini-onboarding** (unique differentiator) |
| **Web UI** | React web interface + TUI | Third-party apps (SwiftoDo, etc.) | None | **None (anti-feature)** -- CLI-only by design |
| **Dependencies** | Bun/Node.js runtime | Shell script only | Git + shell | Zero external dependencies (Node.js for gsd-tools only) |

**Key takeaway:** backlog.md is the closest competitor in approach (Markdown, YAML, git-native, AI-aware). GSD Reflect differentiates by deeply integrating the backlog into the milestone planning pipeline rather than treating it as a standalone board. GSD's backlog is a funnel into roadmap phases, not a parallel tracking system.

## Existing System Gap Analysis

What the current system has vs what is needed, identifying minimal changes.

### add-todo (exists, needs extension)

**Current frontmatter:**
```yaml
created: [timestamp]
title: [title]
area: [area]
files:
  - [file:lines]
```

**Proposed frontmatter:**
```yaml
created: [timestamp]
title: [title]
area: [area]
priority: [HIGH/MEDIUM/LOW]
source: [command/phase/conversation]
status: [pending/triaged/planned/done]
milestone: [version, set when status=planned]
files:
  - [file:lines]
```

**Gap:** 3 new fields. `add-todo` workflow needs to infer priority (suggest based on context, confirm with user) and set source automatically from the calling context. Status defaults to `pending`.

### check-todos (exists, needs extension)

**Current:** Lists by area, offers actions (work now, add to phase, brainstorm, put back).
**Needed:** Sort by priority within area groups. Show status. Add "triage" action to set priority/status without starting work. Support `--priority HIGH` filter.
**Gap:** Mostly display changes + a new triage action. Low complexity.

### new-milestone (exists, needs extension)

**Current Step 2:** Reads STATE.md pending todos. Asks "What do you want to build next?"
**Needed Step 2:** Also reads `todos/pending/*.md`. Groups by area. Shows priority. Lets user multi-select items for this milestone. Updates selected items to `status: planned, milestone: vX.Y`.
**Gap:** Medium complexity. Needs to parse todo frontmatter, display grouped selection, update files.

### upgrade-project (exists, needs extension)

**Current:** Reads version-migration.md for migration actions. Applies additive patches.
**Needed:** Also reads feature manifest. For each feature in manifest, checks if config.json has the required section. If missing, adds with defaults (or prompts in interactive mode).
**Gap:** Medium complexity. Needs manifest file format, manifest reader, diff logic.

### update workflow (exists, needs extension)

**Current:** Shows changelog, confirms, runs installer, shows "restart Claude Code".
**Needed:** After installer completes, also check project version vs installed version. If gap exists, show "N new features available. Run `/gsd:upgrade-project` to configure."
**Gap:** Low complexity. Add a step after the existing Step 6.

### quick workflow (exists, needs fast-path)

**Current:** Always spawns planner (1,157L spec) + executor (403L spec). Minimum 2 agent spawns.
**Needed:** Detect trivial tasks (short description, no dependencies, single concern). For trivial: skip planner, execute directly, commit, update STATE.md. For complex: fall back to current behavior.
**Gap:** Medium complexity. Needs trivial-task detection heuristic and inline execution path.

## Sources

- [backlog.md](https://github.com/MrLesk/Backlog.md) -- Markdown-native task manager with YAML frontmatter, git-native storage, AI agent integration [MEDIUM confidence -- WebSearch verified with GitHub]
- [todo.txt](http://todotxt.org/) -- Plain-text task format specification with CLI tool [HIGH confidence -- long-established standard]
- [git-issue](https://github.com/dspinellis/git-issue) -- Git-based decentralized issue management [MEDIUM confidence -- WebSearch verified with GitHub]
- [update-notifier](https://www.npmjs.com/package/update-notifier) -- Standard npm package for CLI update notifications [HIGH confidence -- npm registry]
- [ESLint flat config migration](https://eslint.org/docs/latest/use/configure/migration-guide) -- Example of additive config migration with backwards compatibility [HIGH confidence -- official docs]
- [backlog.md Hacker News discussion](https://news.ycombinator.com/item?id=44483530) -- Community reception and feature discussion [LOW confidence -- community discussion]
- Existing GSD codebase analysis: `add-todo.md`, `check-todos.md`, `upgrade-project.md`, `update.md`, `version-migration.md`, `config.json`, `STATE.md`, `new-milestone.md`, `quick.md` [HIGH confidence -- primary source]

---
*Feature research for: CLI-native backlog management, config migration, and update UX*
*Researched: 2026-02-16*
