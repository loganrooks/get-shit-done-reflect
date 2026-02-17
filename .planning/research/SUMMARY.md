# Project Research Summary

**Project:** GSD Reflect v1.15 — Backlog System, Feature Manifest, Update Experience, Agent Boilerplate
**Domain:** CLI-native workflow enhancement for AI-assisted development
**Researched:** 2026-02-16
**Confidence:** HIGH

## Executive Summary

This research covers four interconnected enhancements to GSD Reflect: a tagged backlog system, feature manifest/config schema, improved update experience, and agent spec boilerplate extraction. All features are achievable with **zero new dependencies**, maintaining GSD's portability across 4 runtimes. The backlog system extends the proven `todos/` pattern with richer metadata (tags, priority, status, milestone) stored in both `.planning/backlog/` (project-scoped) and `~/.gsd/backlog/` (global). The feature manifest is a static JSON file that makes config initialization declarative, replacing hardcoded migration logic with data-driven workflows. Update experience improvements connect the install, upgrade, and new-project flows through manifest-driven gap detection. Agent boilerplate extraction consolidates 6,600 lines of duplicated protocol across 11 agents into a shared reference, reducing maintenance burden while requiring careful testing to avoid behavior changes.

**The recommended approach is build-first-test-first**: start with agent extraction (mechanical refactor, no dependencies), then feature manifest (foundation for config), then config migration integration, then backlog system, then backlog workflow integration. This order minimizes risk by establishing stable foundations before building dependent features. **The key risk is data loss during migration** — the v1.14 knowledge base migration lost 13 signals + 3 lessons because migration logic existed in only one code path. This milestone must enumerate all readers/writers of todo/config data and ensure migration updates all paths atomically with pre/post verification.

**Critical mitigations**: (1) Never replace existing systems — extend them. The backlog augments todos, not replaces them. (2) Config schema validation must be lenient (warn, never reject). (3) All migrations require pre-migration backup, item count verification, and migration-log.md audit trail. (4) Agent extraction requires before/after output comparison testing for each agent. (5) Feature manifest scope boundary must be explicit: installer handles user-level files, commands handle project-level config.

## Key Findings

### Recommended Stack

All four features use **only Node.js built-ins** — no new npm dependencies. The backlog system extends the existing Markdown + YAML frontmatter pattern used by todos, signals, and lessons. Storage follows the established two-tier pattern: `.planning/backlog/` for project-scoped items, `~/.gsd/backlog/` for global items (mirroring the knowledge base structure). Feature manifest is a static JSON file shipped with GSD at `.claude/get-shit-done/feature-manifest.json`, consumed by install.js, new-project, and upgrade-project workflows. Config migration extends the existing version-migration.md additive-only pattern but becomes data-driven (reading manifest schema instead of hardcoded field additions).

**Core technologies (unchanged):**
- Node.js >= 18.x — runtime for gsd-tools.js, all features are file I/O and JSON manipulation
- Markdown + YAML frontmatter — backlog items follow same schema as todos/signals (existing `extractFrontmatter()` parser handles all cases)
- JSON — feature manifest and config.json (native parsing, zero dependencies)
- gsd-tools.js — all new functionality implemented as subcommands (backlog add/list/promote, manifest diff-config/validate, etc.)

**New files (not dependencies):**
- `.planning/backlog/items/YYYY-MM-DD-slug.md` — project-scoped backlog items
- `~/.gsd/backlog/items/YYYY-MM-DD-slug.md` — global backlog items
- `.claude/get-shit-done/feature-manifest.json` — declarative feature registry
- `.claude/get-shit-done/references/agent-protocol.md` — shared agent execution protocol (extracted boilerplate)

**Estimated code impact:**
- **Backlog:** ~300-400 lines in gsd-tools.js, ~200 lines workflows/templates
- **Feature manifest:** ~200-300 lines in gsd-tools.js, ~150 lines manifest file
- **Update experience:** ~50-100 lines gsd-tools.js, ~100 lines workflow changes
- **Agent extraction:** 0 lines code, ~800 lines conventions doc, **net -5,800 lines** (600 lines x 11 agents eliminated)
- **Total:** ~550-800 new lines, net **-4,550 lines** system-wide

### Expected Features

**Must have (table stakes):**
- **Structured idea capture with metadata** — users expect ideas to have title, area, priority, origin (current flat bullets in STATE.md lose context)
- **Backlog-to-milestone pipeline** — ideas captured during work must flow into `/gsd:new-milestone` planning (without this, ideas get lost between milestones)
- **Feature-aware config gap detection** — after update, features needing new config should tell the user (currently silent)
- **Additive-only config patching** — upgrades never break existing settings (already implemented, must maintain pattern)
- **Post-update next steps** — users need to know if project-level action is needed (currently shows "restart Claude Code" only)
- **Non-destructive upgrade path** — users fear losing customizations (installer already backs up to `gsd-local-patches/`, must communicate this prominently)

**Should have (differentiators):**
- **AI-context-aware capture** — todos capture conversation context, referenced files, agent state at capture time (existing `add-todo` does this, extend to backlog)
- **Backlog-to-requirements pipeline** — present grouped backlog items during `new-milestone`, auto-generate requirements from selected items (no CLI backlog tool does this)
- **Feature manifest system** — features self-declare config needs, new features get initialized during setup, existing projects get prompted during upgrade
- **Smart post-update flow** — automatically detect new features, show what config they need, offer guided initialization (not just "restart")
- **Idea triage during milestone planning** — present backlog items with AI recommendations: "This seems related to [area], priority [X]. Include in milestone?"

**Defer (v2+):**
- **Cross-project backlog** — shared backlog across projects at `~/.gsd/backlog/` (needs clear use case beyond "my projects share ideas")
- **Backlog analytics** — capture rate, triage rate, graduation-to-milestone rate (needs MCP server for efficient metrics collection)
- **External issue tracker sync** — import from GitHub Issues, Linear, etc. (violates zero-dependency principle unless done as optional integration)

### Architecture Approach

The system integrates via four components that layer onto GSD's existing architecture without modifying core data flow. **Backlog system** uses two-tier storage (project at `.planning/backlog/`, global at `~/.gsd/backlog/`) with status-based lifecycle (frontmatter `status` field, not directory movement like todos). Items flow: capture → review/triage → `/gsd:new-milestone` selection → promote to requirements. **Feature manifest** is a static JSON file declaring config schema per feature, consumed by new-project (initial setup), upgrade-project (migration), and update (gap detection). **Update experience** becomes a connected pipeline: update installs files → manifest diff detects gaps → displays new features → offers upgrade-project (auto-runs in YOLO mode). **Agent boilerplate extraction** moves 600 lines of shared protocol (git safety, structured returns, tool conventions) from each of 11 agents into `references/agent-protocol.md`, loaded via `<required_reading>` pattern.

**Major components:**
1. **Backlog storage** — Markdown files with frontmatter schema (id, title, tags, theme, priority, status, promoted_to, source) in two-tier directories, auto-generated index.md
2. **Feature manifest** — JSON declaring {features: {name: {scope, config_section, schema: {field: {type, enum, default}}, init_prompts, auto_detect}}}
3. **Config migration engine** — manifest-driven replacement for hardcoded version-migration.md patches (diffs manifest vs config.json, adds missing sections with prompts or defaults)
4. **Agent protocol reference** — Shared execution conventions loaded at agent spawn time (git safety, commit patterns, error reporting, structured returns)

**Key design patterns:**
- **Manifest-driven configuration**: Single source of truth for feature config requirements (one manifest edit vs 3 workflow edits per new feature)
- **Two-tier storage**: Data survives milestone archival (`.planning/`) AND travels with user (`~/.gsd/`)
- **Status-based lifecycle**: Backlog items use frontmatter `status` field rather than directory movement (supports multi-stage: captured → promoted → deferred → rejected)
- **Additive-only migration**: New fields added with defaults, existing fields never renamed/removed (lenient validation warns but never rejects)

### Critical Pitfalls

1. **Backlog replaces working todo system** — The system has TWO idea-capture paths: `add-todo` writes to `.planning/todos/pending/` with frontmatter, STATE.md `### Pending Todos` shows quick-reference bullets. Consolidating these loses either the quick-reference property (STATE.md) or structured detail (todo files). **Avoid by**: extending existing todos with backlog fields (priority, status, milestone), keeping STATE.md as index with links, testing `/gsd:resume-work` surfaces items after changes.

2. **Config schema validation breaks existing projects** — Adding strict validation (required fields, type checking, unknown field rejection) breaks every project with config.json from older versions. This project's config.json has `"gsd_reflect_version": "1.12.2"` and `"parallelization": true` (boolean), while template has `"1.13.0"` and `"parallelization": { "enabled": true }` (object). **Avoid by**: lenient validation (warn on unknown, never reject), coerce types where possible, fill missing with defaults, version-gate requirements (new fields optional until explicit upgrade).

3. **The v1.14 data loss pattern repeats** — v1.14 lost 13 signals + 3 lessons because migration logic existed only in installer, not in all code paths reading KB data. Multiple readers exist for todo/idea data: gsd-tools.js init, STATE.md readers, check-todos, resume-work, future backlog commands. **Avoid by**: enumerate ALL readers/writers before migration, atomic migration (all paths see new location or none do), copy-then-symlink pattern, pre-migration backup, post-migration verification counting items before/after.

4. **Feature manifest creates dual source of truth** — Manifest describes what config.json SHOULD contain (schema), but config.json is what user CHOSE (document). When they drift, which is authoritative? When user adds custom field not in manifest, does upgrade delete it? **Avoid by**: manifest is additive-only (describes what CAN exist, not MUST), unknown fields always preserved (pass-through), manifest version tracked in config.json, upgrade shows diff and asks confirmation (never silent mutation).

5. **Agent extraction changes behavior silently** — Agents are prompts, not code. When shared protocol loads via `@`-reference instead of inline, LLM attention patterns change (inline text at top gets stronger weight, referenced text may get less). Override resolution is unpredictable (if executor contradicts shared protocol, which wins?). **Avoid by**: extract only truly shared protocol (not behavior instructions), test extraction incrementally (one agent at a time, compare output to baseline), keep agent-specific overrides ABOVE reference import, measure before/after SUMMARY.md quality.

6. **Install path replacement collides with manifest** — `install.js` does two-pass replacement: Pass 1 `~/.claude/gsd-knowledge` → `~/.gsd/knowledge`, Pass 2 remaining `~/.claude/` → runtime path. New manifest-related paths like `~/.gsd/manifests/` could trigger cascading replacement bugs. Installer operates at user-level scope (commands, agents, workflows), but feature manifest bridges user-level and project-level (config.json). **Avoid by**: clear scope boundary (installer handles user-level only, commands handle project-level), manifest uses `~/.gsd/` prefix untouched by replacement, installer never reads/writes `.planning/config.json`.

## Implications for Roadmap

Based on combined research, **6 phases** emerge with clear dependency ordering and risk stratification.

### Phase 1: Agent Boilerplate Extraction
**Rationale:** No dependencies on other features. Mechanical refactor (extract text, add `@`-references). Reduces agent sizes before any modifications to backlog/config workflows. Low risk if tested incrementally.

**Delivers:**
- `references/agent-protocol.md` with shared execution protocol
- All 11 agents reduced by ~600 lines each (net -5,800 lines system-wide)
- Extraction registry documenting what moved where

**Addresses:** Tech debt (large agent files from CONCERNS.md), maintenance burden (11 files to update per protocol change)

**Avoids:** Pitfall #5 — requires before/after comparison testing per agent to verify behavior unchanged

**Research flag:** Standard pattern (text extraction), skip `/gsd:research-phase`

---

### Phase 2: Feature Manifest Foundation
**Rationale:** Foundation that all config-related phases depend on. Must exist before update UX or config migration changes. Establishes scope boundary (installer vs commands) before implementation.

**Delivers:**
- `feature-manifest.json` with schemas for existing features (health_check, devops) + new feature (release)
- `references/feature-manifest.md` schema documentation
- gsd-tools.js manifest validation commands (diff-config, validate-config, get-prompts)
- install.js manifest file copying

**Uses:** JSON (Node.js native parsing), existing config.json structure

**Avoids:** Pitfall #4 (dual source of truth) — manifest is additive-only, unknown fields preserved, version tracked

**Research flag:** Standard pattern (JSON schema + file operations), skip `/gsd:research-phase`

---

### Phase 3: Manifest-Driven Config Migration
**Rationale:** Depends on Phase 2 (manifest exists). Modifies three workflows to consume manifest instead of hardcoded migration logic. Must precede any feature adding new config fields.

**Delivers:**
- upgrade-project.md using manifest-driven patches (replaces hardcoded actions)
- new-project.md Step 5.5 for manifest-driven feature config gathering
- update.md post-update manifest diff check (detects gaps, offers upgrade)
- version-migration.md simplified (manifest IS the migration spec)

**Implements:** Manifest-driven configuration pattern (single source of truth)

**Avoids:** Pitfall #2 (schema breaks projects) — lenient validation, defaults on missing fields; Pitfall #6 (scope collision) — installer user-level only, commands project-level only

**Research flag:** Needs research — integration complexity, error recovery paths, migration edge cases warrant `/gsd:research-phase`

---

### Phase 4: Backlog System Core
**Rationale:** No dependency on manifest (backlog uses its own storage). Can run parallel with Phase 3 if resources allow. Establishes storage, schema, CRUD operations before workflow integration.

**Delivers:**
- Backlog item schema (frontmatter: id, title, tags, theme, priority, status, promoted_to, source)
- `commands/gsd/backlog.md`, `workflows/backlog.md`, `templates/backlog-item.md`
- gsd-tools.js backlog subcommands (add, list, group, update, promote, stats, index)
- Directory structures: `.planning/backlog/`, `~/.gsd/backlog/`
- STATE.md backlog count in accumulated context

**Addresses:** Table stakes (structured idea capture, status lifecycle, filtering/sorting)

**Avoids:** Pitfall #1 (replaces todos) — backlog extends todos, STATE.md stays as index; Pitfall #3 (data loss) — migration plan with pre/post verification

**Research flag:** Standard pattern (frontmatter files + directory indexing, proven by todos/signals/lessons), skip `/gsd:research-phase`

---

### Phase 5: Backlog Workflow Integration
**Rationale:** Depends on Phase 4 (backlog exists). Connects backlog to existing workflows (new-milestone, check-todos, complete-milestone). Differentiators come from this integration.

**Delivers:**
- `/gsd:new-milestone` Step 2 surfaces backlog items grouped by theme, updates selected to `status: promoted`
- `/gsd:check-todos` "promote to backlog" action
- High-severity signals auto-promote to backlog
- `/gsd:complete-milestone` backlog review step

**Addresses:** Differentiators (backlog-to-requirements pipeline, AI-assisted triage)

**Implements:** Backlog lifecycle (capture → triage → milestone scoping → promote to requirements)

**Avoids:** Pitfall #3 (data loss) — enumerate all readers (init, STATE.md, check-todos, resume-work, backlog commands), atomic migration

**Research flag:** Needs research — milestone scoping UX, auto-grouping algorithms, triage recommendation logic warrant `/gsd:research-phase`

---

### Phase 6: Workflow DX and Reliability
**Rationale:** Independent of backlog/manifest. Groups remaining improvements. Benefits from all preceding refactors (manifest exists, backlog exists, agents streamlined).

**Delivers:**
- Lightweight `/gsd:quick` fast-path (detect trivial tasks, skip planner, execute inline)
- Installer hardening (try-catch, validation, error recovery tests)
- Shell script portability fixes

**Addresses:** DX improvements from v1.15 candidate Pillar 3

**Research flag:** Standard patterns (heuristic detection, error handling), skip `/gsd:research-phase`

---

### Phase Ordering Rationale

**Dependency chain:**
```
Phase 1 (Agent Extraction) ─────────────────────────────────> Phase 6 (DX)
                                                                    ^
Phase 2 (Manifest Foundation) ──> Phase 3 (Config Migration)       |
                                                                    |
Phase 4 (Backlog Core) ─────────> Phase 5 (Backlog Integration) ───+
```

- **Phases 1, 2, 4 have no mutual dependencies** — can begin in any order or parallel
- **Phase 3 requires Phase 2** — config migration reads manifest
- **Phase 5 requires Phase 4** — workflow integration needs backlog storage
- **Phase 6 last** — benefits from all preceding simplifications

**Risk stratification:**
- **Low risk:** Phases 1, 2, 4, 6 (mechanical changes, standard patterns, no migration)
- **Medium risk:** Phase 3 (config migration — additive but touches multiple workflows)
- **High risk:** Phase 5 (backlog integration — workflow UX, data flow across sessions)

**Pitfall avoidance:**
- Phase 1 addresses Pitfall #5 via incremental testing
- Phase 2 establishes foundation to avoid Pitfall #6 (scope boundary)
- Phase 3 implements mitigations for Pitfalls #2 and #4 (lenient validation, additive-only)
- Phase 4 design prevents Pitfall #1 (extension not replacement)
- Phase 5 requires explicit prevention of Pitfall #3 (data loss via enumeration + verification)

### Research Flags

**Needs `/gsd:research-phase` during planning:**
- **Phase 3 (Config Migration)** — integration complexity, error recovery paths, edge cases in manifest-driven patching
- **Phase 5 (Backlog Integration)** — milestone scoping UX design, auto-grouping algorithms, AI triage recommendation logic

**Standard patterns (skip research):**
- **Phase 1** — text extraction, `@`-reference loading (established pattern)
- **Phase 2** — JSON schema, file operations (Node.js built-ins)
- **Phase 4** — frontmatter files, directory indexing (proven by todos/signals/lessons)
- **Phase 6** — heuristic detection, error handling (common patterns)

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | **HIGH** | All recommendations build on verified existing patterns; zero new dependencies required; implementation paths clear via codebase analysis |
| Features | **HIGH** | Domain well-understood; competitor analysis (backlog.md, todo.txt, git-issue) validates feature set; existing system gap analysis is comprehensive |
| Architecture | **HIGH** | Direct codebase analysis of todos, config, installer, workflows; two-tier storage proven by knowledge base; manifest pattern common in CLI tools |
| Pitfalls | **HIGH** | Grounded in real incidents (v1.14 data loss, version drift in actual config.json); codebase analysis identified multiple reader paths; ecosystem research validates migration risks |

**Overall confidence:** **HIGH**

All research is grounded in existing codebase analysis (PRIMARY sources: STATE.md, config.json, gsd-tools.js, install.js, ARCHITECTURE.md, CONCERNS.md, migration-log.md). Ecosystem research (backlog.md, JSON Schema evolution, Nx migrations) validates patterns but does not drive decisions. The zero-dependency constraint is load-bearing and inviolable. Implementation paths are clear because all four features extend existing proven patterns (frontmatter files, JSON config, workflow orchestration, agent spawning).

### Gaps to Address

**Minor gaps requiring validation during planning/execution:**

- **Backlog auto-grouping algorithm** — research identifies "group by tags using set intersection, then scope, then priority" but doesn't specify tie-breaking rules or multi-tag handling. Phase 4 planning should define concrete grouping logic.

- **Agent extraction scope** — research identifies ~600 lines of shared protocol per agent but doesn't enumerate exact sections to extract. Phase 1 planning should create extraction manifest listing sections per agent.

- **Manifest auto-detect edge cases** — research defines file-existence checks for version_file detection (package.json, Cargo.toml, etc.) but doesn't handle conflicts (both package.json AND Cargo.toml exist). Phase 2 planning should define precedence rules.

- **Backlog stale item threshold** — research mentions "30 days" but doesn't justify this choice or make it configurable. Phase 4 should either validate 30 days or make threshold configurable in feature manifest.

- **Config migration rollback** — research identifies rollback as often-missing but doesn't specify implementation (git revert? migration-log.md undo script?). Phase 3 planning should define rollback mechanism.

**None of these gaps block roadmap creation.** All can be resolved during phase-level planning or execution.

## Sources

### Primary (HIGH confidence — direct codebase analysis)
- `.planning/STATE.md` — Pending Todos format, dual-storage pattern
- `.planning/config.json` — Real config with version drift (`1.12.2` vs template `1.13.0`)
- `get-shit-done/templates/config.json` — Template config, different shape than project config
- `get-shit-done/workflows/add-todo.md`, `check-todos.md`, `new-milestone.md`, `upgrade-project.md`, `update.md` — Current workflows
- `.claude/get-shit-done/bin/gsd-tools.js` — `loadConfig()`, `extractFrontmatter()`, todo commands, config-ensure-section
- `bin/install.js` — Two-pass path replacement, `migrateKB()`, scope boundary
- `.planning/codebase/ARCHITECTURE.md`, `CONCERNS.md`, `STRUCTURE.md`, `INTEGRATIONS.md` — System architecture
- `.planning/migration-log.md` — Migration tracking format
- `.planning/phases/14-knowledge-base-migration/14-RESEARCH.md`, `19-kb-infrastructure-data-safety/19-RESEARCH.md` — KB migration patterns, data safety
- `.planning/todos/pending/2026-02-17-feature-manifest-system-for-declarative-feature-initialization.md` — Feature manifest problem statement
- `.planning/milestones/v1.15-CANDIDATE.md` — Pillar 6 design

### Secondary (MEDIUM confidence — ecosystem research)
- [backlog.md](https://github.com/MrLesk/Backlog.md) — Markdown-native task manager with YAML frontmatter, AI integration
- [todo.txt](http://todotxt.org/) — Plain-text task format specification
- [git-issue](https://github.com/dspinellis/git-issue) — Git-based issue management
- [json-schema-org: Backward Compatibility](https://github.com/json-schema-org/json-schema-spec/issues/1242) — JSON Schema evolution challenges
- [Creek Service: JSON Schema Evolution](https://www.creekservice.org/articles/2024/01/08/json-schema-evolution-part-1.html) — Open/closed content models
- [Nx: Automate Updating Dependencies](https://nx.dev/docs/features/automate-updating-dependencies) — CLI migration patterns
- [Agilemania: Managing Large Backlogs](https://agilemania.com/how-to-manage-large-complex-product-backlog) — Backlog growth limits
- [ESLint flat config migration](https://eslint.org/docs/latest/use/configure/migration-guide) — Additive config migration

---
*Research completed: 2026-02-16*
*Ready for roadmap: yes*
