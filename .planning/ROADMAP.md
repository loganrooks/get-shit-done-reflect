# Roadmap: GSD Reflect

## Milestones

- <details><summary>v1.12 GSD Reflect (Phases 0-6) -- SHIPPED 2026-02-09</summary>See milestones/v1.12-ROADMAP.md</details>
- <details><summary>v1.13 Upstream Sync & Validation (Phases 7-12) -- SHIPPED 2026-02-11</summary>See milestones/v1.13-ROADMAP.md</details>
- <details><summary>v1.14 Multi-Runtime Interop (Phases 13-21) -- SHIPPED 2026-02-16</summary>See milestones/v1.14-ROADMAP.md</details>
- **v1.15 Backlog & Update Experience** - Phases 22-27 (in progress)

## v1.15 Backlog & Update Experience

**Milestone Goal:** Give users a structured way to capture, organize, and surface ideas across sessions and milestones, and make the update/upgrade experience smooth with declarative feature configuration.

### Phases

**Phase Numbering:**
- Integer phases (22, 23, 24...): Planned milestone work
- Decimal phases (22.1, 22.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 22: Agent Boilerplate Extraction** - Extract shared execution protocol from 11 agent specs into single reference ✓ 2026-02-22
- [x] **Phase 23: Feature Manifest Foundation** - Declarative feature config schema with typed defaults and manifest tooling ✓ 2026-02-22
- [ ] **Phase 24: Manifest-Driven Config Migration** - Upgrade, new-project, and update workflows consume manifest for config gap detection
- [ ] **Phase 25: Backlog System Core** - Structured idea capture with two-tier storage, rich metadata, and CLI tooling
- [ ] **Phase 26: Backlog Workflow Integration** - Connect backlog to milestone planning, todo promotion, and completion review
- [ ] **Phase 27: Workflow DX & Reliability** - Lighter quick-task flow, installer hardening, shell script portability

### Phase Details

#### Phase 22: Agent Boilerplate Extraction
**Goal**: Agent specs are lean and maintainable -- shared execution protocol lives in one place, changes propagate to all 11 agents via a single edit
**Depends on**: Nothing (independent entry point)
**Requirements**: AGENT-01, AGENT-02, AGENT-03, AGENT-04, AGENT-05
**Success Criteria** (what must be TRUE):
  1. A shared `references/agent-protocol.md` exists containing git safety, structured returns, tool conventions, and state file path conventions -- and all 11 agent specs load it via `<required_reading>` instead of inline duplication
  2. Each agent's spec-specific overrides appear ABOVE the shared protocol reference, so agent-specific instructions take priority over shared conventions
  3. An extraction registry artifact documents exactly which sections moved from which agents, enabling audit of what changed
  4. Running each agent (executor, planner, debugger, etc.) on a representative task produces equivalent output quality to pre-extraction behavior -- verified via before/after comparison for at least 3 agents
**Plans:** 5 plans
Plans:
- [ ] 22-01-PLAN.md -- Create shared agent-protocol.md + extraction registry
- [ ] 22-02-PLAN.md -- Extract from executor + planner specs
- [ ] 22-03-PLAN.md -- Extract from debugger + researcher specs
- [ ] 22-04-PLAN.md -- Extract from remaining 6 agent specs
- [ ] 22-05-PLAN.md -- Before/after verification + final metrics

#### Phase 23: Feature Manifest Foundation
**Goal**: Features declare their config requirements in a single JSON manifest, enabling data-driven initialization and upgrade instead of hardcoded migration logic
**Depends on**: Nothing (independent entry point)
**Requirements**: MANF-01, MANF-02, MANF-03, MANF-04, MANF-05
**Success Criteria** (what must be TRUE):
  1. `feature-manifest.json` exists with typed schemas (type, default, enum, scope) for all existing configurable features (health_check, devops, release) and is shipped by the installer alongside other GSD files
  2. Running `gsd-tools manifest diff-config` against a project's config.json reports which manifest-declared fields are missing, which have type mismatches, and which config fields are unknown to the manifest -- unknown fields are reported as informational warnings, never errors
  3. Running `gsd-tools manifest validate` on a config.json with extra unknown fields passes validation (warns but does not reject), confirming the manifest is additive-only
  4. A manifest version field is tracked in config.json so the system can detect when the installed manifest is newer than what the project was last configured against
**Plans:** 2 plans
Plans:
- [ ] 23-01-PLAN.md -- Create feature-manifest.json and manifest subcommands (diff-config, validate, get-prompts)
- [ ] 23-02-PLAN.md -- Tests, installer verification, and manifest_version tracking

#### Phase 24: Manifest-Driven Config Migration
**Goal**: Upgrading, creating, and updating projects uses the manifest as single source of truth for config requirements -- no more hardcoded field additions scattered across workflows
**Depends on**: Phase 23 (manifest must exist before workflows can consume it)
**Requirements**: MIGR-01, MIGR-02, MIGR-03, MIGR-04, MIGR-05, MIGR-06
**Research flag**: NEEDS `/gsd:research-phase` (integration complexity across 3 workflows, error recovery paths)
**Success Criteria** (what must be TRUE):
  1. Running `/gsd:upgrade-project` on a project with outdated config detects missing sections via manifest diff and initializes them with defaults or user prompts -- existing config values are never modified or removed
  2. Running `/gsd:new-project` gathers feature configuration using manifest-declared prompts and schemas instead of hardcoded initialization logic
  3. After running `/gsd:update`, the post-install step detects the manifest version gap, displays a count of new/changed features, and offers to run `/gsd:upgrade-project`
  4. Config validation is lenient: unknown fields are preserved, type mismatches are coerced where possible (e.g., boolean string "true" to boolean true), missing fields are filled with defaults -- config is never rejected
  5. Every automated config change (whether from upgrade-project, new-project, or update) appends an entry to `migration-log.md` with timestamp and description of what changed
  6. If a migration is interrupted mid-execution (e.g., context loss), config.json remains in a valid, loadable state -- each field addition is atomic
**Plans:** 3 plans
Plans:
- [ ] 24-01-PLAN.md -- Core migration engine (coerceValue, atomicWriteJson, apply-migration command + tests)
- [ ] 24-02-PLAN.md -- Migration logging + auto-detect commands with tests
- [ ] 24-03-PLAN.md -- Workflow integration (upgrade-project, new-project, update)

#### Phase 25: Backlog System Core
**Goal**: Users can capture, organize, and retrieve ideas with structured metadata across sessions and projects -- ideas no longer get lost in flat STATE.md bullets
**Depends on**: Nothing (independent entry point)
**Requirements**: BLOG-01, BLOG-02, BLOG-03, BLOG-04, BLOG-05, BLOG-06, BLOG-07
**Success Criteria** (what must be TRUE):
  1. Running `gsd-tools backlog add --title "idea" --tags "auth,ux" --priority HIGH` creates a Markdown file with YAML frontmatter (id, title, tags, theme, priority, status, source) in `.planning/backlog/items/`, and `--global` flag creates it in `~/.gsd/backlog/items/` instead
  2. Running `gsd-tools backlog list` displays backlog items with filtering by priority, status, and tags; `backlog group` clusters items by theme/tags; `backlog stats` shows counts by status and priority
  3. The `/gsd:add-todo` command accepts optional `priority` and `source` fields, and existing todos without these fields are readable with auto-defaulted values (priority: MEDIUM, source: unknown, status: pending) -- no migration required
  4. STATE.md `### Pending Todos` section continues to function as a lightweight index with links to detail files -- it is NOT replaced or restructured by the backlog system
  5. Auto-generated `index.md` files exist in both `.planning/backlog/` and `~/.gsd/backlog/` directories, matching the pattern used by the knowledge base
**Plans**: TBD

#### Phase 26: Backlog Workflow Integration
**Goal**: Backlog items flow naturally into milestone planning, todo management, and milestone completion -- the capture-to-requirements pipeline is connected end-to-end
**Depends on**: Phase 25 (backlog storage and CLI must exist before workflow integration)
**Requirements**: BINT-01, BINT-02, BINT-03, BINT-04, BINT-05
**Research flag**: NEEDS `/gsd:research-phase` (milestone scoping UX, auto-grouping logic, data reader enumeration)
**Success Criteria** (what must be TRUE):
  1. During `/gsd:new-milestone`, Step 2 reads backlog items, groups them by theme/tags, displays them with priority, and lets the user multi-select items for milestone scope -- selected items are updated to `status: planned` with `promoted_to` linking to the generated requirement ID
  2. Running `/gsd:check-todos` offers a "promote to backlog" action for any pending todo, and supports filtering by priority and status
  3. During `/gsd:complete-milestone`, a backlog review step surfaces un-promoted items and asks the user whether to keep, defer, or discard them
  4. All code paths that read todo or backlog data are enumerated and verified working (init, STATE.md rendering, check-todos, resume-work, backlog commands) -- preventing the v1.14 pattern where migration updated one reader but broke others
**Plans**: TBD

#### Phase 27: Workflow DX & Reliability
**Goal**: Common tasks are faster, errors are clearer, and scripts work across environments without surprises
**Depends on**: Nothing (independent, benefits from all preceding phases)
**Requirements**: DX-01, DX-02, DX-03, DX-04
**Success Criteria** (what must be TRUE):
  1. Running `/gsd:quick` with a trivial task description (short, single concern) skips the planner agent spawn and executes inline -- user observes faster completion for simple tasks
  2. Running `/gsd:quick` with a complex task description (multi-step, multiple concerns) falls back to the full planner+executor flow unchanged -- no regression in quality for complex work
  3. Installer file operations (fs.mkdirSync, fs.cpSync, fs.renameSync) are wrapped in try-catch blocks that produce descriptive error messages identifying the operation, source path, and destination path on failure
  4. Shell scripts use portable constructs: `${GSD_HOME:-$HOME/.gsd}` for home directory, portable `mktemp`, and `set -o pipefail` for error propagation
**Plans**: TBD

### Dependency Graph

```
Phase 22 (Agent Extraction) ────────────────────────────────> Phase 27 (DX)
                                                                    ^
Phase 23 (Manifest Foundation) ──> Phase 24 (Config Migration)     |
                                                                    |
Phase 25 (Backlog Core) ─────────> Phase 26 (Backlog Integration) ─+
```

Phases 22, 23, 25 have NO mutual dependencies -- can begin in any order.

### Deferred (Monitor Only)

These depend on external runtime vendor changes. No phases needed -- revisit when capabilities ship:
- Codex CLI hooks evolution -- monitor next 30 days (PR #9691 hints at expanded hooks)
- Codex CLI subagents -- "under active development", no ETA (issue #2604)
- Gemini CLI parallel subagents -- issue #17749 open, 0/4 subtasks complete

### Progress

**Execution Order:**
Phases execute in numeric order: 22 -> 23 -> 24 -> 25 -> 26 -> 27

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 22. Agent Boilerplate Extraction | 5/5 | ✓ Complete | 2026-02-22 |
| 23. Feature Manifest Foundation | 2/2 | ✓ Complete | 2026-02-22 |
| 24. Manifest-Driven Config Migration | 0/3 | Not started | - |
| 25. Backlog System Core | 0/TBD | Not started | - |
| 26. Backlog Workflow Integration | 0/TBD | Not started | - |
| 27. Workflow DX & Reliability | 0/TBD | Not started | - |

## Overall Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|---------------|--------|-----------|
| 0-6 | v1.12 | 25/25 | Complete | 2026-02-09 |
| 7-12 | v1.13 | 18/18 | Complete | 2026-02-11 |
| 13-21 | v1.14 | 18/18 | Complete | 2026-02-16 |
| 22-27 | v1.15 | 7/TBD | In progress | - |

**Totals:** 3 milestones shipped, 24 phases complete, 68 plans completed
