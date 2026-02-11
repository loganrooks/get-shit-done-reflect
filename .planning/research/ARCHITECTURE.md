# Architecture: Upstream Integration Strategy (v1.11.2 to v1.18.0)

**Domain:** Fork synchronization -- merging 70 upstream commits across a diverged fork
**Researched:** 2026-02-09
**Overall confidence:** HIGH (direct analysis of both codebases via git diff)

## Executive Summary

The upstream GSD codebase underwent a major architectural shift between v1.11.2 and v1.18.0: commands were hollowed out into thin orchestrators that delegate to workflow files, a new `gsd-tools.js` CLI (4597 lines) replaced inline bash patterns, and agent specs were condensed by ~60%. Meanwhile, the fork made targeted branding changes and added fork-specific features (signals, spikes, knowledge base) as additive-only files.

The core challenge: **the fork's "additive only" constraint held for fork-specific features but not for branding**. The fork also edited 12 files that upstream modified. However, the fork's edits to shared files are mostly shallow (branding swaps, package name changes), while upstream's edits are deep (architectural restructuring). This means the merge strategy should be: **accept upstream versions of most shared files, then selectively re-apply fork branding**.

## The 12 Overlapping Files: Detailed Analysis

### File-by-File Conflict Assessment

#### 1. `.gitignore`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Added `tests/benchmarks/results.json` | Low -- test artifact exclusion |
| Upstream | Replaced `tests/benchmarks/results.json` with `reports/` and `RAILROAD_ARCHITECTURE.md` | Low -- internal doc exclusion |

**Conflict type:** Textual conflict (both modified same region)
**Resolution:** Accept upstream. Fork's test benchmark exclusion is no longer relevant (upstream removed vitest test infrastructure; fork will adopt upstream's `node --test` approach).
**Difficulty:** Trivial

---

#### 2. `bin/install.js`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Branding: added "REFLECT" ASCII art, changed package name to `get-shit-done-reflect-cc`, added `gsd-version-check.js` hook | Medium -- branding + fork-specific hook |
| Upstream | Added `crypto` import, JSONC parser, hex color validation, statusline path fix, `detached: true` for Windows, removed `gsd-version-check.js` from uninstall list | High -- bug fixes + new features |

**Conflict type:** Moderate textual conflicts in banner region and hook lists
**Resolution:** Accept upstream version, then re-apply fork branding overlay:
1. Take upstream's `install.js` (gets JSONC parser, color validation, Windows fixes)
2. Re-apply "REFLECT" ASCII art banner
3. Re-apply package name change (`get-shit-done-reflect-cc`)
4. Re-add `gsd-version-check.js` hook registration if fork still needs it
**Difficulty:** Medium (requires careful manual merge)

---

#### 3. `CHANGELOG.md`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Replaced full upstream changelog with fork-specific changelog (GSD Reflect v1.12.x entries, link to upstream changelog) | High -- entirely different content |
| Upstream | Added entries for v1.12.0 through v1.18.0 (many new features, gsd-tools, verification suite, etc.) | High -- extensive additions |

**Conflict type:** Complete divergence -- both sides replaced the entire file
**Resolution:** Keep fork's CHANGELOG.md structure (fork-specific entries + link to upstream). Do NOT merge upstream's changelog content. The fork changelog documents what GSD Reflect changed; upstream changes are referenced by link.
**Difficulty:** Easy (keep fork version entirely)

---

#### 4. `commands/gsd/help.md`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Added "GSD Reflect" section with signal/collect-signals/health-check/upgrade-project commands; changed install command to `get-shit-done-reflect-cc` | Medium -- fork-specific command documentation |
| Upstream | Completely replaced inline help content with thin orchestrator pattern (now delegates to `workflows/help.md`); only 21 lines remain | High -- architectural change |

**Conflict type:** Fork added content to a file that upstream gutted
**Resolution:** Accept upstream's thin orchestrator version. The help content now lives in `get-shit-done/workflows/help.md`. Fork-specific commands need to be added to that workflow file instead, or the fork maintains a separate help workflow that extends the upstream one.
**Difficulty:** Medium (fork content must migrate to workflow layer)

---

#### 5. `commands/gsd/new-project.md`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Added `devops-detection.md` reference and Phase 5.7 (DevOps Context detection) | Medium -- new conditional phase |
| Upstream | Gutted to thin orchestrator (~30 lines); all logic moved to `workflows/new-project.md`; added `--auto` flag | High -- architectural change |

**Conflict type:** Fork added content to a file that upstream gutted
**Resolution:** Accept upstream's thin orchestrator version. Fork's DevOps Context phase must be added to the workflow layer (`get-shit-done/workflows/new-project.md`) rather than the command file. This is architecturally correct -- the fork was adding logic to the wrong layer.
**Difficulty:** Medium (DevOps detection logic must migrate to workflow)

---

#### 6. `commands/gsd/update.md`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Changed package name references to `get-shit-done-reflect-cc` in inline logic | Low -- branding only |
| Upstream | Gutted to thin orchestrator (~37 lines); all logic moved to `workflows/update.md` | High -- architectural change |

**Conflict type:** Fork edited inline logic that upstream removed entirely
**Resolution:** Accept upstream's thin orchestrator version. The workflow (`get-shit-done/workflows/update.md`) references `get-shit-done-cc`; fork needs to override the package name in the workflow or use a configuration-based approach.
**Difficulty:** Easy (accept upstream, apply package name in workflow)

---

#### 7. `get-shit-done/references/planning-config.md`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Added `knowledge_debug` config option and `<knowledge_surfacing_config>` section | Medium -- fork-specific config documentation |
| Upstream | Replaced bash config parsing with `gsd-tools.js` CLI calls; removed `knowledge_debug` | High -- architectural pattern change |

**Conflict type:** Fork added a section that upstream doesn't know about; upstream changed the config retrieval pattern throughout
**Resolution:** Accept upstream version (gets gsd-tools.js patterns). Re-append the `<knowledge_surfacing_config>` section. The fork's `knowledge_debug` config key is still valid for fork features -- it just needs to document retrieval via gsd-tools or direct JSON parsing.
**Difficulty:** Easy (accept upstream, append fork section)

---

#### 8. `get-shit-done/templates/research.md`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Added expanded Open Questions format with Spike integration sections (Resolved, Genuine Gaps, Resolved by Spike, Still Open, Legacy format) | Medium -- spike workflow integration |
| Upstream | Added `<user_constraints>` section at top (locked decisions from CONTEXT.md); simplified Open Questions to basic format | Medium -- context fidelity improvement |

**Conflict type:** Both sides modified the Open Questions section; upstream added a new section
**Resolution:** Accept upstream version (gets user_constraints). Then re-add the fork's spike-related sections (Resolved by Spike, Genuine Gaps with Spike recommendation). The upstream's simpler Open Questions format should be the base, with spike sections appended as additional subsections.
**Difficulty:** Medium (manual merge of both additions)

---

#### 9. `hooks/gsd-check-update.js`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Changed npm package name to `get-shit-done-reflect-cc` | Low -- branding |
| Upstream | Changed same line back to `get-shit-done-cc`; added `detached: true` for Windows | Low -- branding + Windows fix |

**Conflict type:** Both modified the same line (package name)
**Resolution:** Accept upstream version for the Windows fix (`detached: true`), then re-apply fork package name. Two-line change.
**Difficulty:** Trivial

---

#### 10. `package.json`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Changed name/description/bin/repository/homepage/bugs to fork values; added vitest + coverage deps; added test scripts (vitest, smoke) | High -- identity + test infrastructure |
| Upstream | Changed version to 1.18.0; kept upstream identity; removed vitest, switched to `node --test`; added gsd-tools test | Medium -- version + test approach change |

**Conflict type:** Both modified same fields with different values
**Resolution:** Keep fork identity fields (name, description, bin, repository, homepage, bugs). Accept upstream's version bump approach (will set to fork version). Accept upstream's test approach (`node --test` for gsd-tools.test.js). Keep fork's vitest for fork-specific tests (KB infrastructure, smoke tests). Merge devDependencies from both.
**Difficulty:** Medium (field-by-field merge)

---

#### 11. `package-lock.json`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Reflects fork's package.json (vitest deps, fork name) | Generated file |
| Upstream | Reflects upstream's package.json (no vitest, upstream name) | Generated file |

**Conflict type:** Generated file, always conflicts
**Resolution:** Regenerate after package.json merge. Run `npm install` with the merged package.json to produce a clean lock file.
**Difficulty:** Trivial (regenerate)

---

#### 12. `README.md`

| Side | Change | Significance |
|------|--------|-------------|
| Fork | Complete rewrite: "GSD Reflect" branding, learning loop explanation, feature comparison table, fork-specific install commands | High -- entirely different document |
| Upstream | Complete rewrite: New marketing copy, testimonials, $GSD token badge, Dexscreener link, Development Installation section, expanded permissions section | High -- entirely different document |

**Conflict type:** Complete divergence -- both sides have entirely different content
**Resolution:** Keep fork's README.md entirely. The fork README explains what GSD Reflect is, how it differs from upstream, and how to install it. Upstream's README is irrelevant to fork users.
**Difficulty:** Easy (keep fork version entirely)

---

## Upstream Architectural Changes: Impact Assessment

### Change 1: Thin Orchestrator Pattern

**What changed:** Commands (`.claude/commands/gsd/*.md`) were reduced from 200-1000+ lines to 20-40 lines. All logic moved to workflow files (`get-shit-done/workflows/*.md`).

**Structure before (v1.11.2):**
```
commands/gsd/execute-phase.md   (~300 lines, contains full logic)
  references: get-shit-done/references/*.md
```

**Structure after (v1.18.0):**
```
commands/gsd/execute-phase.md   (~30 lines, thin orchestrator)
  delegates to: get-shit-done/workflows/execute-phase.md   (~200+ lines, full logic)
  references: get-shit-done/references/ui-brand.md
```

**Impact on fork:**
- The fork's approach of "commands route to fork-specific workflows" is now ALIGNED with upstream's architecture. Previously the fork was doing this as a workaround; now it's the standard pattern.
- Fork-specific commands (`signal.md`, `collect-signals.md`, `health-check.md`, `upgrade-project.md`) already follow this pattern -- they are thin orchestrators pointing to fork workflows.
- The fork's modifications to `help.md`, `new-project.md`, `update.md` were adding logic to command files. Upstream moved that logic to workflow files. The fork needs to follow suit.

**Action required:**
1. Accept upstream's thin command files
2. Create fork-specific workflow files for any logic the fork added to commands
3. Fork's DevOps detection (from new-project.md) moves to a workflow extension

### Change 2: gsd-tools.js CLI

**What changed:** A new Node.js CLI (`get-shit-done/bin/gsd-tools.js`, 4597 lines) centralizes deterministic operations that were previously done with inline bash:

- State management (`state load`, `state update`, `state get`, `state patch`)
- Phase operations (`phase add`, `phase insert`, `phase remove`, `phase complete`)
- Roadmap operations (`roadmap get-phase`, `roadmap analyze`)
- Milestone operations (`milestone complete`)
- Validation (`validate consistency`)
- Verification suite (`verify plan-structure`, `verify phase-completeness`, etc.)
- Frontmatter CRUD (`frontmatter get/set/merge/validate`)
- Template filling (`template fill summary/plan/verification`)
- Compound init commands (`init execute-phase`, `init plan-phase`)
- Progress reporting (`progress`)
- Scaffolding (`scaffold context/uat/verification/phase-dir`)

**Impact on fork:**
- All upstream agent specs and workflows now call `gsd-tools.js` instead of using inline bash for config parsing, state updates, and git commits
- The fork's agents that were modified from upstream (executor, planner, phase-researcher, debugger) need to adopt the gsd-tools patterns
- The fork's own agents (signal-collector, spike-runner, reflector, knowledge-store) can optionally use gsd-tools for state management and commits
- The `commit` command in gsd-tools handles `commit_docs` checking automatically, replacing manual bash conditionals

**Action required:**
1. Accept gsd-tools.js and its test file as new additions
2. Update fork-specific agents to use gsd-tools where appropriate (state loading, commits)
3. Verify gsd-tools doesn't conflict with fork's config.json extensions (`health_check`, `devops`, `gsd_reflect_version`, `knowledge_debug`)

### Change 3: Agent Spec Condensation

**What changed:** All agent specs were condensed by ~60% (net -2298 lines across 9 agents). Same behavior, fewer tokens. Key changes:

| Agent | Before | After | Key Changes |
|-------|--------|-------|-------------|
| gsd-executor | 842 lines | ~350 lines | Uses `init execute-phase` for context loading; condensed deviation rules; same behavior |
| gsd-planner | 1437 lines | ~700 lines | Added `<context_fidelity>` section for honoring CONTEXT.md decisions; condensed philosophy/task_breakdown; same methodology |
| gsd-phase-researcher | 763 lines | ~350 lines | Condensed tool strategy and philosophy; added user constraints section; same research approach |
| gsd-plan-checker | 744 lines | ~350 lines | Condensed verification dimensions; same 6-dimension check |
| gsd-verifier | 990 lines | ~500 lines | Condensed verification flow; same goal-backward approach |
| gsd-debugger | 1260 lines | ~1237 lines | Minor condensation |
| gsd-project-researcher | 915 lines | ~450 lines | Condensed; same 4-mode research |
| gsd-research-synthesizer | ~200 lines | ~176 lines | Minor condensation |
| gsd-codebase-mapper | ~300 lines | ~270 lines | Minor condensation |

**Impact on fork:**
- The fork did NOT modify any agent specs from their v1.11.2 state (git diff confirms zero fork changes to `agents/`). This means the fork's agents are at the v1.11.2 baseline.
- The fork DOES have agents in `.claude/agents/` (the installed copies): `gsd-debugger.md`, `gsd-executor.md`, `gsd-phase-researcher.md`, `gsd-planner.md`, `gsd-reflector.md`, `gsd-signal-collector.md`, `gsd-spike-runner.md`. These are marked as deleted in upstream diff because upstream doesn't have the `.claude/agents/` copies or the fork-specific agents.
- The upstream agents now reference `gsd-tools.js init` commands for context loading. The fork agents at v1.11.2 still use inline bash. Accepting upstream's agent versions is safe because the fork didn't modify them.

**Action required:**
1. Accept all upstream agent spec changes (clean replacement, no conflicts)
2. Fork-specific agents (reflector, signal-collector, spike-runner, knowledge-store) remain untouched -- they are additive
3. The `.claude/agents/` installed copies are managed by the installer, not the repo. The repo copies in `agents/` are the source of truth.

### Change 4: New Upstream Commands and Workflows

**New commands in upstream (not in fork):**
- `commands/gsd/reapply-patches.md` -- merges local patches back after update
- `commands/gsd/new-project.md.bak` -- backup of old inline version

**New workflows in upstream (not in fork):**
- 19 new workflow files extracted from commands (add-phase, add-todo, audit-milestone, check-todos, help, insert-phase, new-milestone, new-project, pause-work, plan-milestone-gaps, plan-phase, progress, quick, remove-phase, research-phase, set-profile, settings, update)

**New references in upstream:**
- `decimal-phase-calculation.md`, `git-planning-commit.md`, `model-profile-resolution.md`, `phase-argument-parsing.md`

**New templates in upstream:**
- `summary-complex.md`, `summary-minimal.md`, `summary-standard.md`

**Impact on fork:** All additive. No conflicts. These files are new in upstream and don't exist in fork. Accept all.

### Change 5: Upstream Deleted Fork-Specific Files

The diff shows upstream "deleting" many files that only exist in the fork:
- `.claude/agents/gsd-reflector.md`, `gsd-signal-collector.md`, `gsd-spike-runner.md`, `knowledge-store.md`
- `.claude/agents/kb-*` scripts and templates
- `.claude/commands/gsd/reflect.md`, `spike.md`
- `.github/workflows/` (CI/CD)
- `.planning/` (project state -- fork's own project management)
- `tests/` (fork's test infrastructure)
- `get-shit-done/workflows/reflect.md`, `run-spike.md`

These are NOT actually deleted by upstream -- they never existed there. They appear in the diff because the fork has them and upstream doesn't. A merge will preserve them.

### Change 6: Upstream Deleted Files That Fork Also Has

**Files upstream removed from its own history:**
- `vitest.config.js` (replaced with node --test)
- Various test files in `tests/` (fork has different test files)
- `.planning/` artifacts from upstream's own development (fork has its own `.planning/`)

These should not conflict. The fork's test infrastructure (vitest) and planning artifacts are independent.

## Merge Strategy Recommendation

### Approach: `git merge upstream/main` with Targeted Manual Resolution

**Why merge (not rebase or cherry-pick):**

1. **Rebase rejected:** 70 commits would need individual conflict resolution. The fork has 20+ commits. Rebase rewrites fork history and makes future merges harder.

2. **Cherry-pick rejected:** 70 individual cherry-picks is impractical. Many upstream commits are interdependent (e.g., gsd-tools creation + agent updates that use it).

3. **Merge preferred:** A single merge commit captures the sync point. Future syncs start from this merge base. Git can auto-resolve most conflicts (additive files on both sides). Only the 12 overlapping files need manual attention.

**Pre-merge preparation (critical):**

```bash
# 1. Create a sync branch from fork main
git checkout main
git checkout -b sync/upstream-v1.18.0

# 2. Attempt the merge
git merge upstream/main --no-commit

# 3. Resolve conflicts file by file (see resolution table below)

# 4. Test the merged state

# 5. Commit the merge
git commit -m "merge: sync with upstream GSD v1.18.0 (70 commits)"
```

### Conflict Resolution Table

| # | File | Strategy | Rationale |
|---|------|----------|-----------|
| 1 | `.gitignore` | Accept upstream | Fork's test exclusion no longer relevant |
| 2 | `bin/install.js` | Accept upstream + re-apply branding | Gets JSONC parser, Windows fixes, color validation; re-add REFLECT banner and package name |
| 3 | `CHANGELOG.md` | Keep fork version | Entirely different document purpose |
| 4 | `commands/gsd/help.md` | Accept upstream | Thin orchestrator; fork help content migrates to workflow layer |
| 5 | `commands/gsd/new-project.md` | Accept upstream | Thin orchestrator; DevOps detection migrates to workflow layer |
| 6 | `commands/gsd/update.md` | Accept upstream + fork package name in workflow | Thin orchestrator; package name goes in workflow |
| 7 | `get-shit-done/references/planning-config.md` | Accept upstream + append fork section | Gets gsd-tools patterns; re-add knowledge_surfacing_config |
| 8 | `get-shit-done/templates/research.md` | Accept upstream + add spike sections | Gets user_constraints; re-add spike integration |
| 9 | `hooks/gsd-check-update.js` | Accept upstream + fork package name | Gets Windows fix; one-line package name swap |
| 10 | `package.json` | Manual field merge | Fork identity + upstream version approach + merged deps |
| 11 | `package-lock.json` | Regenerate | Run `npm install` after package.json merge |
| 12 | `README.md` | Keep fork version | Entirely different document |

### Post-Merge Fork Adaptations

After the merge resolves the 12 conflicting files, the fork needs additional work to fully integrate with upstream's new architecture:

**Phase A: Workflow Layer Migration**

The fork added logic to command files that are now thin orchestrators. That logic must move:

1. **DevOps Context detection** (from `new-project.md`) --> Create `get-shit-done/workflows/new-project-reflect.md` or add to upstream's `new-project.md` workflow
2. **Fork help content** (from `help.md`) --> Add GSD Reflect commands to `get-shit-done/workflows/help.md`
3. **Update package name** --> Set in `get-shit-done/workflows/update.md`

**Phase B: Agent Alignment**

The fork's installed agent copies in `.claude/agents/` are at v1.11.2. After merge, the source agents in `agents/` will be at v1.18.0 (condensed, gsd-tools-aware). The installer will pick up the updated versions automatically on next install.

Fork-specific agents (reflector, signal-collector, spike-runner) need no changes -- they are additive and don't conflict.

**Phase C: gsd-tools Integration**

The fork's knowledge base operations could benefit from gsd-tools patterns:
- Use `gsd-tools.js commit` instead of manual git add/commit in KB operations
- Use `gsd-tools.js state load` for config retrieval in fork agents
- But this is OPTIONAL -- fork agents can continue using their own patterns

## Suggested Build Order

Given the dependencies and conflict complexity:

```
Phase 1: Pre-merge preparation
  - Document current fork state (snapshot)
  - Verify all fork tests pass before merge
  - Create sync branch

Phase 2: Execute merge + resolve 12 conflicts
  - Run git merge upstream/main --no-commit
  - Resolve each file per the resolution table above
  - Group by difficulty:
    - Trivial (4 files): .gitignore, hooks/gsd-check-update.js, package-lock.json, CHANGELOG.md
    - Easy (3 files): README.md, update.md, planning-config.md
    - Medium (5 files): bin/install.js, help.md, new-project.md, research.md, package.json

Phase 3: Verify merge integrity
  - Run fork tests (vitest)
  - Run upstream tests (node --test gsd-tools.test.js)
  - Manual smoke test: /gsd:help, /gsd:new-project flow
  - Verify fork-specific commands still work

Phase 4: Workflow layer migration
  - Move DevOps detection to workflow layer
  - Add fork commands to help workflow
  - Update package references in update workflow

Phase 5: Validation + commit
  - Full test suite
  - Commit merge
```

**Estimated effort:** Phase 2 is the core work (~2-3 hours of careful manual merging). Phases 3-4 add ~1-2 hours of testing and adaptation.

## Impact on Fork-Specific Features

### Signal Tracking System
**Impact:** LOW. Signal collector and related agents are entirely additive files. Upstream's changes don't touch any signal-related code. The upstream agent condensation doesn't affect signal integration because signals hook at the workflow layer (wrapper workflows), not at the agent layer.

### Spike/Experiment Workflow
**Impact:** LOW. Spike runner and related files are entirely additive. The research template change (upstream added user_constraints, simplified open questions) requires re-adding the spike-related sections to the template.

### Knowledge Base
**Impact:** LOW-MEDIUM. The knowledge store files (`.claude/agents/knowledge-store.md`, KB templates, scripts) are entirely fork-specific and won't conflict. However, the `planning-config.md` reference needs the `knowledge_surfacing_config` section re-appended after accepting upstream's version. And any fork agents that read config via bash patterns should eventually migrate to gsd-tools patterns.

### Health Check / Upgrade Project
**Impact:** LOW. These are fork-specific commands with their own workflow files. No upstream conflict.

## Architectural Alignment Assessment

The upstream's architectural evolution actually VALIDATES the fork's approach:

1. **Thin orchestrator pattern:** The fork was already routing commands to fork-specific workflows. Upstream now mandates this pattern for ALL commands. The fork's approach was ahead of upstream.

2. **Additive files:** The fork's constraint of "no upstream file edits" is now easier to maintain because upstream's thin orchestrators have less content to conflict with.

3. **gsd-tools centralization:** The fork's knowledge store operations (file writes, index management) could eventually use gsd-tools patterns, but this is not urgent.

4. **Workflow layer as extension point:** Upstream's architecture now has a clear extension point (workflow files) where the fork can add reflect-specific logic without touching command files.

The net result: **this merge makes future syncs easier, not harder**. The thin orchestrator pattern means fewer lines in command files to conflict on, and the workflow layer provides a natural extension point.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Silent behavioral regression after merge | Medium | High | Run both test suites; manual smoke test critical flows |
| gsd-tools.js incompatible with fork config extensions | Low | Medium | Fork config keys (`health_check`, `devops`, `knowledge_debug`) are ignored by gsd-tools, not rejected |
| Installer behavior change breaks fork install | Medium | High | Test `node bin/install.js` with fork branding after merge |
| Fork agents reference old bash patterns that upstream removed | Low | Low | Fork agents are self-contained; they don't reference upstream workflow internals |
| package-lock.json merge creates broken dependency tree | Low | Medium | Always regenerate lock file after package.json merge |

## Sources

- HIGH confidence: Direct git diff analysis of all 12 overlapping files (both fork and upstream sides)
- HIGH confidence: Upstream agent diffs showing condensation patterns
- HIGH confidence: Upstream command/workflow restructuring verified via git ls-tree and git show
- HIGH confidence: Fork change analysis verified via git diff from fork-point to main
- HIGH confidence: gsd-tools.js command inventory from file header comments
