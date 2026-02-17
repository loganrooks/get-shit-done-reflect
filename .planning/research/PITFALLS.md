# Pitfalls Research: Backlog Management, Config Migration, and Upgrade UX

**Domain:** Adding structured backlog, feature manifest/config schema, update experience, and agent spec extraction to existing file-based CLI-native workflow system
**Researched:** 2026-02-16
**Confidence:** HIGH (grounded in actual codebase analysis, real data loss incident from v1.14 KB migration, existing system architecture review, and ecosystem research)

---

## Critical Pitfalls

### Pitfall 1: Backlog Replaces Working Todo System and Breaks Mid-Flight

**What goes wrong:**
The system currently has TWO working idea-capture paths: (1) `/gsd:add-todo` writes structured markdown files to `.planning/todos/pending/` with frontmatter, area inference, and duplicate detection; (2) Pending Todos bullet list in STATE.md under `### Pending Todos`. A new "backlog" system that replaces either path creates a migration gap where in-flight ideas exist in the old format but the new system expects the new format. Worse, the STATE.md bullets serve a different purpose than the todo files -- they are quick-reference items visible during every session (STATE.md is loaded on resume), while todo files are for detailed captures. Merging these into a single "backlog" system loses the quick-reference property of STATE.md bullets OR the structured detail of todo files.

**Why it happens:**
The temptation is to see `### Pending Todos` in STATE.md and `.planning/todos/pending/` as redundant. They are not. STATE.md bullets are session-visible context (loaded by `/gsd:resume-work`, read by every orchestrator via `gsd-tools.js init`). Todo files are detailed captures with frontmatter metadata, file references, and problem/solution sections. A backlog system that consolidates them must serve BOTH purposes or it degrades one.

**How to avoid:**
- Keep STATE.md `### Pending Todos` as a lightweight index/reference (title + one-liner + link to detail)
- Keep `.planning/todos/pending/` as the detail store
- New backlog features (prioritization, tagging, promotion to phase) should extend the existing todo system, not replace it
- Migration: existing todos already have valid frontmatter -- add optional `priority`, `status`, `milestone` fields without requiring them
- Test: `/gsd:resume-work` still sees pending items after migration; `/gsd:add-todo` still works unchanged

**Warning signs:**
- Design doc mentions "replacing" or "consolidating" the todo system
- STATE.md Pending Todos section goes empty while backlog grows elsewhere
- `/gsd:resume-work` no longer surfaces pending ideas
- Todo files lose their structured frontmatter in favor of a flat list

**Phase to address:** First phase -- define backlog as extension of existing `.planning/todos/`, not replacement

---

### Pitfall 2: Config Schema Validation Breaks Existing Projects on Update

**What goes wrong:**
config.json is currently a permissive JSON blob read by `gsd-tools.js loadConfig()` with hardcoded defaults as fallback. There is no schema validation -- any key can exist, missing keys get defaults. Adding strict schema validation (required fields, type checking, rejection of unknown fields) immediately breaks every existing project that has a config.json from an older version. The user runs `/gsd:update`, gets new code that validates config.json, and their existing config fails validation because it lacks fields added in v1.15 (e.g., `release`, `backlog`, `feature_manifest`).

The actual config.json in this project has `"gsd_reflect_version": "1.12.2"` while the template has `"gsd_reflect_version": "1.13.0"` -- version drift is already real. The project config has `"mode": "yolo"` and `"parallelization": true` (flat boolean), while the template has `"mode": "interactive"` and `"parallelization": { "enabled": true, ... }` (nested object). Schema validation would reject the existing project config.

**Why it happens:**
Developers add schema validation to catch errors but forget that validation is a breaking change for systems that previously accepted anything. The "additive only" principle of backward compatibility is violated when validation rejects configs that worked yesterday.

**How to avoid:**
- Schema validation must be LENIENT by default: warn on unknown fields, never reject; coerce types where possible; fill defaults for missing fields
- Use the existing `loadConfig()` pattern: hardcoded defaults merged with whatever is in config.json
- Schema is for documentation and migration, not gatekeeping
- `config-ensure-section` already exists in gsd-tools.js -- extend it to handle schema migration (add missing sections with defaults, never remove existing sections)
- Version-gate schema requirements: new fields are optional until the user explicitly runs `/gsd:upgrade-project` which migrates config with user prompts
- Append to `migration-log.md` on every schema migration for auditability

**Warning signs:**
- Config validation uses `throw` or `process.exit` on unknown fields
- Tests create configs from scratch instead of testing with real legacy configs
- No migration path documented from current config shape to new config shape
- `loadConfig()` changes from lenient to strict without a deprecation period

**Phase to address:** Early phase -- define config schema as permissive/additive; migration logic before any features that depend on new config fields

---

### Pitfall 3: The v1.14 Data Loss Pattern Repeats in Backlog Migration

**What goes wrong:**
In v1.14, 13 signals + 3 lessons were lost during KB migration because the migration logic existed only in the installer (`install.js`), not in the workflow system. When code paths that write/read KB data were updated but the actual data was not migrated, the system looked for data at the new path and found nothing. The same pattern threatens backlog migration: if STATE.md `### Pending Todos` bullets are migrated to structured todo files, but the migration runs only in one code path (e.g., only in `/gsd:upgrade-project` but not in `gsd-tools.js init todos`), then workflows that read the old location see nothing while the data sits in the new location.

**Why it happens:**
Multiple code paths read the same data. Migration updates one path but not all of them. The system has at minimum these readers of todo/idea data:
1. `gsd-tools.js init todos` -- reads `.planning/todos/pending/`
2. STATE.md `### Pending Todos` -- read by every orchestrator
3. `/gsd:check-todos` -- reads todo files
4. `/gsd:resume-work` -- reads STATE.md
5. Any future backlog command -- needs to find ALL historical ideas

A migration that moves data from one location but only updates paths in 3 of 5 readers causes silent data invisibility.

**How to avoid:**
- Enumerate ALL code paths that read/write todo/idea data before migration design
- Migration must be atomic: either all readers see the new location or none do
- Copy-then-symlink pattern (proven in KB migration): keep old location as redirect to new
- Pre-migration backup: snapshot `.planning/todos/` and STATE.md `### Pending Todos` section before migration
- Post-migration verification: count items before and after, alert if mismatch
- Never delete the old format until at least one full milestone cycle confirms the new format works

**Warning signs:**
- `/gsd:check-todos` returns 0 items when items exist in STATE.md bullets
- STATE.md Pending Todos and `.planning/todos/pending/` show different item counts
- `/gsd:resume-work` mentions no pending work but todo files exist
- Migration code has no verification step counting items before/after

**Phase to address:** Backlog phase -- migration is a plan-level concern with explicit verification criteria

---

### Pitfall 4: Feature Manifest Creates a Second Source of Truth for Config

**What goes wrong:**
The feature manifest system proposes that each GSD feature declares its config schema. This creates a manifest file (or set of files) that describes what config.json SHOULD contain. Now config.json is the actual config, and the manifest is the desired config. If they drift apart, which is authoritative? When `/gsd:upgrade-project` reads the manifest and discovers a missing section in config.json, does it add it silently, prompt the user, or fail? When a user manually edits config.json to add a custom field not in the manifest, does the next upgrade delete it?

The fundamental tension: the manifest is a SCHEMA (what's allowed), but config.json is a DOCUMENT (what the user chose). Schema and document must stay in sync, but they live in different places (manifest in the npm package, config in the user's project). Every version bump can create drift.

**Why it happens:**
Declarative manifest systems assume a clean initialization path. But GSD already has hundreds of projects with existing config.json files that were created before the manifest existed. The manifest must retroactively describe config that was created ad-hoc.

**How to avoid:**
- Manifest is ADDITIVE ONLY: it describes what CAN exist, not what MUST exist
- Unknown fields in config.json are always preserved (pass-through)
- Manifest version must be tracked in config.json (`manifest_version: 1`) so upgrade logic knows what migrations to apply
- `/gsd:upgrade-project` presents a diff of what will change and asks for confirmation -- never silent mutation
- Manifest defaults are the same as `loadConfig()` defaults -- single source of truth for "what happens when a field is missing"
- Consider: manifest could live IN config.json as a `$schema` reference rather than as a separate file tree

**Warning signs:**
- Manifest and `loadConfig()` defaults diverge
- `upgrade-project` adds fields without user confirmation
- Custom user fields in config.json disappear after upgrade
- Manifest validation rejects configs that `loadConfig()` would accept

**Phase to address:** Feature manifest phase -- design manifest as extension of existing `loadConfig()` defaults, not a parallel system

---

### Pitfall 5: Agent Boilerplate Extraction Changes Agent Behavior Silently

**What goes wrong:**
11 agent specs share ~600 lines of boilerplate (role definition, tool strategy, execution flow protocol, structured returns). Extracting this into a shared reference file (`agent-protocol.md`) reduces duplication. But agents are prompts, not code. When an agent loads `@~/.claude/get-shit-done/references/agent-protocol.md`, the LLM processes the shared protocol text in a different context position than when it was inline. This changes:
1. **Attention patterns:** Inline text at the top of an agent spec gets strong positional attention. Referenced text loaded later may get less weight.
2. **Override behavior:** If agent-specific instructions contradict the shared protocol (e.g., executor has a different commit pattern than the default), the LLM must resolve the conflict. With inline text, the specific overrides the general naturally. With referenced text, the resolution is unpredictable.
3. **Context budget:** The shared protocol still consumes context tokens. It does not save tokens -- it saves maintenance effort. If the shared reference is 600 lines and each agent still loads it, total token consumption per agent is unchanged. The savings are in human maintenance, not LLM context.

**Why it happens:**
Developers think of agent specs as code (DRY principle: extract shared logic). But agent specs are prompts. DRY for prompts is different from DRY for code. Code deduplication saves compute. Prompt deduplication saves human maintenance but can degrade LLM behavior because the positional and contextual properties of the text change.

**How to avoid:**
- Extract ONLY truly shared protocol (structured return format, tool naming conventions, state file paths) -- NOT behavior-shaping instructions like "be concise" or "commit after each task"
- Test extraction incrementally: extract one section, run the affected agents through a real phase, compare output quality to baseline
- Keep agent-specific overrides ABOVE the shared reference `@` import so they get stronger positional attention
- Measure: before and after extraction, run the same plan through the executor and compare SUMMARY.md quality
- Maintain an "extraction registry" documenting what was moved where, so future editors know that modifying the shared protocol affects all 11 agents
- Consider: instead of runtime reference loading, use a build step that inlines the shared protocol into each agent spec at install time (saves runtime loading, maintains single source for maintenance)

**Warning signs:**
- Agent produces different output format after extraction (especially structured returns)
- Executor stops creating per-task commits (commit protocol was in extracted section)
- Planner creates plans with wrong frontmatter format (template was in extracted section)
- Agent "forgets" shared protocol instructions in long context (reference loaded but not attended to)

**Phase to address:** Agent extraction phase -- must include before/after comparison testing as verification criteria

---

### Pitfall 6: Install Two-Pass Path Replacement Collides with Feature Manifest Paths

**What goes wrong:**
`install.js` does two-pass path replacement: Pass 1 replaces `~/.claude/gsd-knowledge` with `~/.gsd/knowledge`; Pass 2 replaces remaining `~/.claude/` with the runtime-specific path. A feature manifest system likely introduces new paths like `~/.gsd/manifests/` or `~/.gsd/config/`. If manifest-related files reference `~/.gsd/` paths in their content, and those files are installed via the same `copyWithPathReplacement()` pipeline, the regex replacement could corrupt them. The Pass 2 regex (`/~\/\.claude\/(?!gsd-knowledge)/g`) would not touch `~/.gsd/` paths, but any NEW pass or regex pattern added for manifest paths could create cascading replacement bugs.

Additionally, the installer currently runs migrateKB() ONCE before per-runtime installation. Feature manifest initialization might need to run both per-runtime AND per-project. But the installer operates on global/local scope, not project scope. There is no mechanism in `install.js` to modify `.planning/config.json` -- that is a project-level concern handled by commands, not the installer.

**Why it happens:**
The installer and the command system operate at different scopes:
- Installer: `~/.claude/`, `~/.gsd/`, `~/.config/opencode/` (user-level)
- Commands: `.planning/` (project-level)
Feature manifests bridge both scopes. Attempting to handle project-level config in the installer, or user-level file installation in commands, creates scope confusion.

**How to avoid:**
- Clear scope boundary: installer handles user-level files only (commands, agents, workflows, hooks, KB scripts at `~/.gsd/bin/`)
- Feature manifest lives in the npm package (`get-shit-done/manifests/` or embedded in config template)
- `/gsd:new-project` and `/gsd:upgrade-project` read the manifest from the installed files and apply project-level config changes
- The installer does NOT read, write, or validate `.planning/config.json`
- New paths in manifest files should use `~/.gsd/` prefix which is NOT touched by either Pass 1 or Pass 2 of the replacement system
- Test: run installer, verify manifest-related content is NOT corrupted by path replacement

**Warning signs:**
- `install.js` gains a Pass 3 or additional regex for manifest paths
- Installer starts reading or writing `.planning/config.json`
- Feature manifest files installed to `~/.claude/get-shit-done/` have their `~/.gsd/` paths corrupted
- Scope confusion between what the installer does vs what commands do

**Phase to address:** Feature manifest phase -- explicit scope boundary documentation as first task

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Inline backlog priority in STATE.md bullet text | Quick to implement | Fragile parsing, no structured query, priorities drift as STATE.md grows | Never -- use frontmatter in todo files |
| Config validation as hard rejection | Catches errors early | Breaks every existing project on update | Never in v1.15 -- use lenient validation with warnings |
| Feature manifest as separate JSON files per feature | Clean separation | Multiple files to read, parse, merge; ordering conflicts; no single view | Only if features exceed 10; otherwise single manifest object in config template |
| Shared agent protocol as runtime @-reference | Reduces maintenance duplication | Changes LLM attention patterns, unpredictable override resolution | Acceptable if tested against baseline; prefer build-time inlining |
| Backlog items as pure markdown without frontmatter | Simpler to write | Cannot query, filter, sort, or aggregate programmatically | Never -- existing todo system already uses frontmatter, maintain that |
| Silent config migration on update | Frictionless upgrade | User unaware of changes; surprises when config behaves differently | Only for adding fields with safe defaults; never for changing existing field semantics |

## Integration Gotchas

Common mistakes when connecting new features to the existing system.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Backlog + STATE.md | Storing backlog state only in new files, orphaning STATE.md Pending Todos | Keep STATE.md as index with links; backlog detail in todo files |
| Config schema + gsd-tools.js | Adding validation in `loadConfig()` that rejects old configs | Validation warns but never rejects; missing fields get defaults |
| Feature manifest + installer | Having installer read/write project-level config | Installer handles user-level only; commands handle project-level |
| Agent extraction + existing agents | Extracting shared text then modifying it without testing all 11 agents | Extract, test each agent against baseline, only then modify shared text |
| `/gsd:upgrade-project` + `/gsd:update` | Both commands trying to migrate config simultaneously | `/gsd:update` installs files only; `/gsd:upgrade-project` handles config migration |
| Backlog + `/gsd:plan-phase` | Backlog items automatically promoted to phase plans without user approval | Backlog surfaces candidates; user explicitly promotes to phase |
| Config migration + migration-log.md | Forgetting to append to migration-log.md after config changes | Every automated config change gets a migration-log.md entry |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Reading all todo files on every `init todos` call | Slow init when todo count grows | Cache todo count; lazy-load details only when needed | 50+ pending todos |
| Manifest validation on every command invocation | Every `/gsd:*` command adds 100ms for manifest read+validate | Validate only in `/gsd:upgrade-project` and `/gsd:new-project` | Immediate -- validation adds latency to every command |
| Full STATE.md rewrite on every todo add | STATE.md grows large, regex replacement becomes fragile | Use `gsd-tools.js state add-todo` for atomic section update | 20+ items in Pending Todos section |
| Loading shared agent protocol file in every agent spawn | Token cost multiplied by agent count per phase | Build-time inlining; or load protocol only for agents that actually need it | 5+ agents spawned per phase |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Backlog becomes a dumping ground with no cleanup | Items accumulate, user stops checking backlog, it becomes noise | Auto-stale after 30 days; periodic prompt during milestone start: "review stale backlog items" |
| Config migration asks too many questions | User abandons upgrade midway; partially migrated config | Smart defaults with confirmation; batch questions; allow "accept all defaults" |
| Upgrade shows no diff of what changed | User uncertain what happened to their config | Show before/after diff; log changes to migration-log.md |
| Feature manifest forces initialization of features user does not use | Unnecessary config bloat; user confused by irrelevant settings | Features declare "required" vs "optional"; optional features initialized on first use, not on upgrade |
| Agent spec changes happen silently | User notices degraded output quality but cannot identify cause | CHANGELOG entry for any agent spec change; version bump on shared protocol changes |
| Backlog priority system is too complex | User assigns priorities once, never updates them, priorities become meaningless | Simple three-tier: now / later / someday; or no priorities, just recency |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Backlog system:** Often missing STATE.md integration -- verify `/gsd:resume-work` surfaces backlog items
- [ ] **Config migration:** Often missing migration-log.md entry -- verify every automated config change is logged
- [ ] **Config migration:** Often missing rollback path -- verify user can revert to pre-migration config
- [ ] **Feature manifest:** Often missing "unknown field preservation" -- verify custom user config fields survive upgrade
- [ ] **Feature manifest:** Often missing manifest version tracking -- verify config.json records which manifest version was applied
- [ ] **Agent extraction:** Often missing baseline comparison testing -- verify each agent's output format matches pre-extraction baseline
- [ ] **Agent extraction:** Often missing extraction registry -- verify documentation of what moved where
- [ ] **Backlog cleanup:** Often missing stale item handling -- verify items older than 30 days are flagged or surfaced
- [ ] **Upgrade UX:** Often missing error recovery -- verify interrupted upgrade leaves config in valid state (not half-migrated)
- [ ] **Config schema:** Often missing `loadConfig()` default synchronization -- verify schema defaults match `loadConfig()` fallbacks exactly

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Backlog migration loses STATE.md bullets | LOW | Git history preserves STATE.md; `git show HEAD~N:.planning/STATE.md` recovers bullets |
| Config schema validation breaks existing project | MEDIUM | Roll back gsd-tools.js to previous version; restore config.json from git; disable validation |
| Agent extraction degrades output quality | MEDIUM | Revert shared protocol extraction; re-inline text in affected agents; re-test |
| Feature manifest deletes custom config fields | HIGH | Restore config.json from git; but changes since last commit are lost; prevention: pre-migration backup |
| Data loss during backlog migration (v1.14 pattern repeat) | HIGH | If pre-migration backup exists: restore from backup. If not: recover from git history. If data was in STATE.md bullets only (no git commit): likely unrecoverable. |
| Install path replacement corrupts manifest files | LOW | Re-run installer; manifest files are read-only copies from npm package |
| Upgrade interrupted mid-migration | MEDIUM | migration-log.md shows what was applied; re-run upgrade to apply remaining migrations; config.json should be valid at every migration step (each step is atomic) |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Backlog replaces working todo system (#1) | Backlog design phase | `/gsd:add-todo` still works unchanged; STATE.md still has Pending Todos; `/gsd:resume-work` surfaces items |
| Config schema breaks existing projects (#2) | Config schema phase (must precede feature manifest) | Real project configs from v1.12, v1.13, v1.14 all pass through new `loadConfig()` without error |
| Data loss during migration (#3) | Backlog migration plan | Pre/post item count verification; migration-log.md entry; rollback test |
| Feature manifest dual source of truth (#4) | Feature manifest phase | Manifest defaults == `loadConfig()` defaults; unknown fields preserved; manifest version tracked |
| Agent extraction changes behavior (#5) | Agent extraction phase | Before/after SUMMARY.md comparison for each extracted agent; structured return format validation |
| Installer scope collision (#6) | Feature manifest phase (scope boundary design) | Installer does NOT read/write `.planning/config.json`; manifest files survive path replacement |
| Backlog becomes noise (UX) | Backlog cleanup phase or milestone workflow | Stale items flagged; milestone-start includes backlog review prompt |
| Config migration asks too many questions (UX) | Config migration phase | "Accept all defaults" option works; migration completes in < 30 seconds for typical config |

## Phase Ordering Implications

Based on pitfall analysis, the following ordering constraints emerge:

1. **Config schema (lenient) must come before feature manifest** -- the manifest depends on a config system that can be extended without breaking; the lenient schema pattern must be established first
2. **Backlog design must come before backlog migration** -- design the extension to the existing todo system before migrating any data
3. **Agent extraction must include testing phase** -- extraction without before/after testing risks silent degradation; this should not be rushed
4. **Feature manifest must establish scope boundary before implementation** -- installer vs. command scope confusion is the #1 integration risk
5. **Config migration infrastructure must come before any feature that adds new config fields** -- every new feature that touches config.json should use the migration system, not ad-hoc field additions

## Sources

### Primary (HIGH confidence -- direct codebase analysis)

- `.planning/STATE.md` -- Actual Pending Todos format, dual-storage pattern
- `.planning/config.json` -- Real config with version drift from template (`1.12.2` vs template `1.13.0`)
- `get-shit-done/templates/config.json` -- Template config with different shape than project config
- `get-shit-done/workflows/add-todo.md` -- Current todo capture workflow with frontmatter, area inference
- `.claude/get-shit-done/bin/gsd-tools.js` -- `loadConfig()` with hardcoded defaults, `init todos` reader, `config-ensure-section`
- `bin/install.js` -- Two-pass path replacement (lines 609-635), `migrateKB()` with copy-then-symlink, scope boundary
- `.planning/codebase/CONCERNS.md` -- Documented tech debt: large agent files, path regex fragility, file-based state parsing
- `.planning/codebase/ARCHITECTURE.md` -- System layers, data flow, scope boundaries
- `.planning/milestones/v1.15-CANDIDATE.md` -- Pillar 6 feature manifest design, agent boilerplate extraction plan
- `.planning/phases/14-knowledge-base-migration/14-RESEARCH.md` -- KB migration patterns, copy-then-symlink, verification
- `.planning/phases/19-kb-infrastructure-data-safety/19-RESEARCH.md` -- Pre-migration backup pattern, script relocation
- `.planning/migration-log.md` -- Existing migration tracking format
- `.planning/todos/pending/2026-02-17-feature-manifest-system-for-declarative-feature-initialization.md` -- Feature manifest problem statement

### Secondary (MEDIUM confidence -- ecosystem research)

- [Agilemania: Managing Large Product Backlogs](https://agilemania.com/how-to-manage-large-complex-product-backlog) -- Backlog growth limits (150 items), 2-year retirement rule
- [Perforce: Backlog Management Techniques](https://www.perforce.com/blog/hns/backlog-management-6-tips-make-your-backlog-lean) -- Lean backlog principles, grooming burden
- [BayTech: Importance of Backlog Management](https://www.baytechconsulting.com/blog/the-importance-of-backlog-management-from-a-developer) -- Developer perspective on backlog abandonment
- [json-schema-org: Backward Compatibility](https://github.com/json-schema-org/json-schema-spec/issues/1242) -- JSON Schema evolution challenges
- [Creek Service: Evolving JSON Schemas](https://www.creekservice.org/articles/2024/01/08/json-schema-evolution-part-1.html) -- Open/closed content models for schema evolution
- [Nx: Automate Updating Dependencies](https://nx.dev/docs/features/automate-updating-dependencies) -- Automated migration patterns for CLI tools

---
*Pitfalls research for: GSD Reflect v1.15 Backlog & Update Experience*
*Researched: 2026-02-16*
