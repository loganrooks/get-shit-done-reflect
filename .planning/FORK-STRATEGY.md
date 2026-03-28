# Fork Maintenance Strategy

## Fork Relationship

GSD Reflect is a fork of [GSD](https://github.com/gsd-build/get-shit-done) (Get Shit Done). The fork was created at commit `2347fca` (upstream v1.11.1), with the upstream remote configured as `upstream` pointing to `git@github.com:gsd-build/get-shit-done.git`. The fork is currently at v1.17.5, with upstream at v1.30.0. The last sync baseline was v1.22.4 (2026-03-10 fork audit freeze).

The fork adds signal tracking, a knowledge base, spike workflows, a reflection engine, health probes, automation gating, and knowledge surfacing on top of the base GSD workflow system. The v1.18 milestone (Phases 45-53) modularized the runtime from a monolithic 3,200-line gsd-tools.js into a thin CLI router (676 lines) plus 16 `lib/*.cjs` modules, then adopted and deeply integrated 5 upstream features into the fork's epistemic pipeline.

**Module architecture (post v1.18):**
- 5 fork-only modules: automation, backlog, health-probe, manifest, sensors
- 6 hybrid modules: core, init, commands, config, frontmatter, + phase/roadmap
- 5 pure/mostly upstream modules: milestone, state, template, verify, + phase/roadmap
- 6 upstream-only modules not yet in fork: workstream, security, model-profiles, profile-output, profile-pipeline, uat

See [FORK-DIVERGENCES.md](./FORK-DIVERGENCES.md) for the complete module inventory and per-file merge stances.

## Tag Strategy

Fork tags use the `reflect-` prefix (e.g., `reflect-v1.15.0`) to avoid collision with upstream's version tags. When upstream was merged during v1.13, all upstream tags (v1.0.x through v1.18.0) entered the fork's history. Since both repos use `v1.X.Y` semver, tags like `v1.15.0` collide.

**Convention:**
- Fork release tags: `reflect-v1.X.Y` (e.g., `reflect-v1.15.0`)
- Pre-sync snapshot tags: `reflect-vX.Y.Z-pre-sync`
- Upstream tags: not fetched (remote configured with `--no-tags`)

**Configuration:**
```
git config remote.upstream.tagOpt --no-tags
```

This prevents upstream tags from re-entering the local repo on future fetches. The `/gsd:release` command should be updated to use the `reflect-` prefix when creating tags.

**Migrated in v1.15:** All prior fork tags (v1.12 through v1.14.2) were renamed to `reflect-*` prefix and upstream tags were deleted locally. See commit `chore: migrate fork tags to reflect-* namespace`.

## Strategy: Tracked Modifications

All fork modifications to upstream files are explicitly tracked in [FORK-DIVERGENCES.md](./FORK-DIVERGENCES.md). Post-modularization (v1.18 Phases 45-48), tracking operates at two levels:

1. **Module level:** Each of the 16 `lib/*.cjs` modules has a category (fork-only, hybrid, pure upstream) and a merge stance (keep-fork, hybrid, adopt-upstream). This is the primary merge surface during sync.

2. **File level:** Non-module files (identity, commands, templates, hooks, build) are tracked individually with per-file merge stances as before.

The modular architecture significantly reduced sync friction compared to the pre-modularization monolith. Fork additions are isolated in 5 fork-only modules (zero conflict risk), while 5 pure upstream modules sync trivially. Most sync risk is concentrated in the 6 hybrid modules where fork extensions overlay upstream code via the `module.exports.funcName` extension pattern.

## Divergence Management

The current manifest of all fork divergences is maintained in [FORK-DIVERGENCES.md](./FORK-DIVERGENCES.md). That document lists every upstream module and file the fork has modified, along with files and modules added by the fork.

### Divergence Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Module (fork-only)** | Entire modules with no upstream equivalent | automation.cjs, health-probe.cjs, sensors.cjs |
| **Module (hybrid)** | Fork extensions layered on upstream module base | core.cjs, init.cjs, frontmatter.cjs |
| **Module (pure upstream)** | Adopted without modification | milestone.cjs, state.cjs, template.cjs |
| **Identity** | Branding, naming, package identity | README.md, package.json, CHANGELOG.md |
| **Commands** | Modifications to command specifications | discuss-phase.md, new-project.md, quick.md |
| **Templates** | Changes to templates and reference docs | config.json template, research.md template |
| **Hooks** | CI, health, and context monitoring hooks | gsd-ci-status.js, gsd-statusline.js, gsd-context-monitor.js |
| **Build** | Build scripts, tooling, config files | build-hooks.js, .gitignore |

### Merge Stance Options

| Stance | Meaning | When to Use |
|--------|---------|-------------|
| **Fork wins** | Fork version is kept entirely; upstream changes to this file are discarded | Identity files where fork has completely rewritten the content (README, CHANGELOG) |
| **Keep-fork** | Module is fork-only; upstream has no version to merge | Fork-only modules with no upstream equivalent |
| **Hybrid merge** | Combine upstream additions with fork modifications | Files and hybrid modules where both sides add value |
| **Adopt-upstream** | Take upstream version directly on sync | Pure/mostly upstream modules with zero or trivial fork changes |
| **Case-by-case** | Evaluate per sync based on what each side changed | Templates and configs where the better implementation should win |
| **Regenerate** | File is generated, not manually merged | package-lock.json |

### Update Cadence

The divergence manifest is updated per-phase during active development. When a phase modifies an upstream file (or creates a new divergence), FORK-DIVERGENCES.md is updated in that phase's execution. Between development cycles, the manifest is updated at sync time.

## Merge Strategy

Use traditional `git merge` (not rebase) on a dedicated sync branch. Preserve individual commits using `--merge` (not `--squash`) when merging PRs.

### Why Merge Over Rebase

The fork has hundreds of atomic per-task commits. Rebasing would require replaying every fork commit onto the new upstream base, resolving conflicts potentially dozens of times. A merge handles this in one operation: one merge commit, one round of conflict resolution. The fork's commit history is preserved intact, which matters for `git blame`, `git bisect`, and the SUMMARY.md commit hash references that track what each plan produced.

### Why Merge Over Squash

The fork's commit protocol creates atomic per-task commits, and SUMMARY.md files reference specific commit hashes. Squashing destroys this granularity, making the commit log and summaries less useful for understanding phase-by-phase evolution. This was identified as a v1.18 sync-round issue (see [54-RETROSPECTIVE.md](phases/54-sync-retrospective-governance/54-RETROSPECTIVE.md)).

### Sync Branch Workflow

```
1. Tag current state:     git tag -a reflect-vX.Y.Z-pre-sync -m "Pre-sync snapshot"
2. Create sync branch:    git checkout -b sync/vX.Y-upstream main
3. Set conflict style:    git config merge.conflictstyle diff3
4. Merge upstream tag:    git merge v1.X.Y  (a specific tag, NOT upstream/main)
5. Resolve conflicts:     (see Conflict Resolution Runbook below)
6. Validate:              npx vitest run && manual smoke check
7. Merge to main:         git checkout main && git merge --no-ff sync/vX.Y-upstream
8. Clean up:              git branch -d sync/vX.Y-upstream
```

Use `git config merge.conflictstyle diff3` before merging. This shows the common ancestor version in conflict markers alongside both sides, making it much easier to understand what each side intended.

**Important:** Always merge to a specific upstream tag (step 4), never to `upstream/main`. See Baseline-Freeze Rules below.

## Conflict Resolution Runbook

Step-by-step guide for resolving conflicts during an upstream merge. Consult FORK-DIVERGENCES.md for each file's merge stance before resolving.

### Step 1: Identify All Conflicts

```bash
git merge v1.X.Y
# Git will report conflicting files
git diff --name-only --diff-filter=U
```

### Step 2: Resolve by Merge Stance

**For "fork wins" / "keep-fork" files** (README.md, CHANGELOG.md, fork-only modules):

```bash
git checkout --ours <file>
git add <file>
```

The fork version is kept entirely. No need to inspect upstream changes -- these files are fully owned by the fork.

**For "adopt-upstream" files** (milestone.cjs, state.cjs, template.cjs, verify.cjs):

```bash
git checkout --theirs <file>
git add <file>
```

Take the upstream version directly. These modules have zero or trivial fork changes.

**For "hybrid merge" files** (bin/install.js, package.json, hybrid modules, command files):

1. Open the file and find conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
2. With `diff3` style, the `|||||||` section shows the common ancestor
3. Keep fork modifications (branding, fork-specific features, `module.exports.funcName` extensions)
4. Adopt upstream additions (new features, bug fixes, structural improvements)
5. Resolve each conflict block individually
6. `git add <file>` when done

**For "case-by-case" files** (templates, build scripts):

1. Read both versions in the conflict markers
2. Understand what upstream changed and why (check upstream commit messages)
3. Decide which implementation is better, or combine both
4. If the fork's version is clearly superior, take ours
5. If upstream's version adds something valuable, adopt it
6. `git add <file>` when done

**For "regenerate" files** (package-lock.json):

```bash
git checkout --ours package.json
npm install
git add package-lock.json
```

### Step 3: Validate After Resolution

```bash
# Run full test suite
npx vitest run

# Verify fork branding is intact
grep "get-shit-done-reflect-cc" package.json
grep "REFLECT" bin/install.js

# Verify fork features are functional
grep "gsd_reflect_version" get-shit-done/templates/config.json
grep "health_check" get-shit-done/templates/config.json

# Verify module structure
ls get-shit-done/bin/lib/*.cjs | wc -l  # Should be >= 16
```

### Step 4: If Merge Goes Badly

If the merge produces an unrecoverable mess:

```bash
# Abort the merge (if still in merge state)
git merge --abort

# Or reset the sync branch to the pre-sync tag
git checkout sync/vX.Y-upstream
git reset --hard reflect-vX.Y.Z-pre-sync
```

Main is untouched until the sync branch is explicitly merged in. The pre-sync tag provides an immutable restore point.

## Patch Preservation (Reapply-Patches)

Upstream introduced a patch preservation mechanism in commit `ca03a06` (v1.16.0). This is relevant to the fork in two ways.

### How It Works (Upstream Mechanism)

1. **Manifest creation:** After installation, `writeManifest()` generates SHA256 hashes of all installed files and stores them as `gsd-file-manifest.json`.
2. **Modification detection:** Before the next install, `saveLocalPatches()` compares current file hashes against the manifest. Files with different hashes are backed up to `gsd-local-patches/`.
3. **Backup metadata:** A `backup-meta.json` records timestamp, version info, and list of backed-up files.
4. **Restoration:** The `/gsd:reapply-patches` command (LLM-guided) reads backed-up files and newly installed files, identifies user modifications, and applies them to the new version. Reports per-file status: Merged, Skipped, or Conflict.

### Fork Adoption

The fork inherits this mechanism for its own downstream users. When someone installs `get-shit-done-reflect-cc` and modifies files (adding custom commands, tweaking templates), the manifest + backup + reapply-patches flow preserves their changes across upgrades.

For the fork-to-upstream sync itself, we use standard `git merge`. The reapply-patches mechanism is not designed for fork maintenance -- it is designed for end-user patch preservation during `/gsd:update`. These are different problems with different tools.

## Sync Cadence

### Policy (formalized from v1.18 experience)

**Trigger-based, not calendar-based.** Syncs happen when one or more conditions are met, not on a fixed schedule.

**Sync triggers:**
1. **Security-critical upstream change** -- Evaluate within 1 week of disclosure
2. **Upstream tagged release with features matching fork's "behind" gaps** (see What-to-Adopt Criteria)
3. **Upstream version drift exceeds 3 major versions** -- Risk of accumulating irreconcilable divergence
4. **Fork milestone boundary** -- Natural checkpoint to evaluate upstream state

**Sync scope:**
- Each sync targets a specific upstream tagged release (not HEAD)
- Scope is frozen at the target release before planning begins
- Post-freeze drift is handled by an explicit retriage phase (see Baseline-Freeze Rules)

**Evidence:** v1.18 synced to v1.22.4 baseline over 19 days (10 phases, 32 plans, ~169 minutes execution). The modular architecture (Phases 45-48) makes future syncs more granular: pure upstream modules take upstream directly, hybrid modules merge at localized extension points, fork-only modules are unaffected. See [54-RETROSPECTIVE.md](phases/54-sync-retrospective-governance/54-RETROSPECTIVE.md) for detailed retrospective.

**Post-modularization sync surface:**

| Module Category | Count | Sync Effort | Risk |
|-----------------|-------|-------------|------|
| Pure upstream | 5 | Trivial (take upstream) | None |
| Fork-only | 5 | None (no upstream version) | None |
| Hybrid | 6 | Medium (merge extensions) | Localized |

## Baseline-Freeze Rules

Established during Phase 48.1 and validated by the v1.18 experience.

**Rule 1: Freeze at a tagged release.**
Choose a specific upstream version tag (e.g., v1.22.4) as the sync baseline. All planning, research, and audit work references this frozen baseline. Never sync to a moving target (HEAD, main branch tip).

**Rule 2: No silent scope expansion.**
If upstream releases new versions during the sync, those releases are NOT automatically in scope. They require explicit triage before entering the milestone.

**Rule 3: Budget one retriage phase for syncs spanning >2 weeks.**
If the sync takes longer than ~2 weeks, upstream will have moved. Plan for an explicit retriage phase (like Phase 48.1) to classify post-baseline drift and route it to open or future phases.

**Rule 4: Drift ledger as living document.**
The retriage phase produces a drift ledger that classifies post-baseline changes into clusters with dispositions (fold-into, candidate-next-milestone, defer). This ledger is the authoritative record of what was evaluated and decided.

**Evidence:** Phase 48.1 triaged 372 post-baseline commits into 11 clusters. 9 were folded into open phases (49-52), 1 was candidate-next-milestone, 1 was deferred. By Phase 54, 40 additional commits shipped (v1.29.0, v1.30.0) requiring a ledger extension with 3 new clusters (C12-C14). The retriage cost was minimal (4 minutes for Phase 48.1) but prevented weeks of implicit scope creep. See [54-OUTSTANDING-CHANGES.md](phases/54-sync-retrospective-governance/54-OUTSTANDING-CHANGES.md) for the extended assessment.

## What-to-Adopt Criteria

Decision framework for evaluating upstream features for adoption. Grounded in the feature overlap analysis ([54-FEATURE-OVERLAP.md](phases/54-sync-retrospective-governance/54-FEATURE-OVERLAP.md)).

### Step 1: Classify the Gap

| Classification | Meaning | Action |
|---------------|---------|--------|
| Behind | Fork agrees with the need, hasn't implemented | Strong adoption candidate |
| Intentionally different | Fork's philosophy produces a different approach | Do NOT adopt; maintain fork version |
| Converging | Both sides building same thing, may merge | Evaluate merge path; adopt if compatible |
| Complementary | Different angles on same concern | Adopt alongside fork's version |
| Not applicable | Irrelevant to fork's use case | Skip |

### Step 2: Evaluate Integration Depth

For any "behind" or "converging" candidate:
- Does the feature connect to the fork's epistemic pipeline? (signals, automation, health, reflection)
- If yes: plan deep integration as part of adoption
- If no: can it be adopted standalone, or is shallow adoption acceptable?

See Integration Depth Standard below for the minimum bar.

### Step 3: Assess Merge Effort

| Module Category | Typical Effort | Risk |
|-----------------|---------------|------|
| Pure upstream module (new) | Low -- copy and register | Low |
| Upstream change to pure-upstream module | Low -- take upstream version | Low |
| Upstream change to hybrid module | Medium -- merge then re-apply fork extensions | Medium |
| Upstream change to fork-heavy module | High -- careful reconciliation | High |

### Step 4: Decision

Adopt if: (classification is "behind" or "converging") AND (integration depth is achievable within a milestone) AND (merge effort is justified by the value).

Do NOT adopt if: classification is "intentionally different" OR integration would require abandoning fork's design philosophy.

**Evidence:** v1.18 classified features using a 6-disposition framework (converging, complementary, redundant, divergent, behind, not-applicable). 4 "behind" gaps were identified (security scanning, UAT debt tracking, cross-phase regression testing, requirements coverage gate). 6 features were classified "intentionally different" (full autonomous execution, runtime breadth, quality monitoring approach, knowledge management, extensibility model, developer profiling). See [54-FEATURE-OVERLAP.md](phases/54-sync-retrospective-governance/54-FEATURE-OVERLAP.md) for the complete inventory.

## Integration Depth Standard

Established by Phase 53 (Deep Integration) and formalized as policy.

**Standard:** Every adopted upstream feature MUST connect to at least one of the fork's epistemic subsystems: signals, automation, health probes, or reflection/knowledge base.

**Why:** Shallow adoption (copy file, register command) creates feature islands that don't participate in the fork's value proposition. The system learns from what it observes -- features that don't generate observable data are invisible to the epistemic pipeline.

**Examples from v1.18:**

| Adopted Feature | Integration Point | Connection |
|----------------|------------------|------------|
| Context-monitor | Automation | Bridge file data feeds automation deferral decisions (replaced wave-count estimation) |
| Nyquist auditor | Signals + Health | VALIDATION.md gaps detected by artifact sensor, flow into KB; validation-coverage health probe |
| Discuss-phase (codebase scouting) | Knowledge | KB knowledge surfacing during codebase scouting |
| Cleanup workflow | Health | FORK_PROTECTED_DIRS prevents deletion of .planning/knowledge/, deliberations/, backlog/ |

**Minimum bar:** For each adopted feature, the adoption plan must include at least one task connecting the feature to the fork's pipeline. If no connection is feasible, document why in the plan and flag for future integration.

**Evidence:** Phase 53 required 4 plans and 11 minutes to achieve deep integration of 5 adopted features. Without this step, the adopted features would have been technically present but epistemically invisible. The integration standard was the most significant quality decision of v1.18. See [54-RETROSPECTIVE.md](phases/54-sync-retrospective-governance/54-RETROSPECTIVE.md) for how this standard was derived.

## Merge Decision Log

Populated during each upstream sync. Records the actual merge decision made for each conflicting file.

### v1.13 Sync (2026-02-10)

| File | Decision | Rationale | Sync Version |
|------|----------|-----------|--------------|
| `bin/install.js` | Auto-merged (no conflict) | Fork branding and upstream additions (patch persistence, JSONC, bug fixes) in non-overlapping regions; git 3-way merge handled correctly | v1.13 |
| `package.json` | Hybrid: fork identity + upstream structural | Fork name/repo/description/bin sacred; upstream files[], esbuild, test:upstream adopted | v1.13 |
| `commands/gsd/new-project.md` | Adopt upstream thin stub + fork novelty in workflow | Upstream's mature thin orchestrator pattern adopted; fork DevOps Context (Step 5.7) ported to workflows/new-project.md | v1.13 |
| `commands/gsd/help.md` | Adopt upstream thin stub + fork novelty in workflow | GSD Reflect section (6 commands) added to workflows/help.md | v1.13 |
| `commands/gsd/update.md` | Adopt upstream thin stub + fork branding in workflow | Fork branding (package name, GitHub URL) updated in workflows/update.md | v1.13 |
| `.gitignore` | Combined both sides | Fork benchmark exclusion + upstream reports/ and RAILROAD_ARCHITECTURE.md; purely additive | v1.13 |
| `README.md` | Fork wins | Fork's complete README preserved; content updates deferred to Phase 12 | v1.13 |
| `CHANGELOG.md` | Fork wins | Fork's changelog preserved; upstream entries not needed (different product) | v1.13 |
| `package-lock.json` | Regenerated via npm install | Accept ours to clear conflict; npm install regenerated fresh lockfile matching resolved package.json | v1.13 |

### v1.18 Sync (2026-03-10 to 2026-03-28)

v1.18 used a fundamentally different approach than v1.13. Rather than a single `git merge`, v1.18 adopted upstream's modular structure through a staged transformation (Phases 45-48) and then selectively adopted features (Phases 52-53). Key structural decisions:

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 45 | CJS rename (gsd-tools.js to .cjs) | Match upstream module convention before module adoption |
| 46 | Adopt 11 upstream modules wholesale | Wholesale adoption of upstream's modular architecture; fork helpers extracted to core.cjs |
| 47 | Extract 5 fork modules | Fork-specific logic isolated in dedicated modules with clean interfaces |
| 48 | Extend frontmatter.cjs + init.cjs | Fork additions layered via module.exports.funcName extension pattern |
| 48.1 | Freeze scope at v1.22.4, retriage 372 post-baseline commits | Prevented silent scope expansion during 19-day sync |
| 49-51 | Config migration, test hardening, update system | Foundation work informed by drift ledger cluster routing (C1-C9) |
| 52 | Adopt 5 upstream features with namespace rewriting | Context-monitor, Nyquist auditor, discuss-phase scouting, 4 workflows, shell robustness |
| 53 | Deep integration into epistemic pipeline | Every adopted feature connected to signals/automation/health/reflection |

## Review Gate

Before each upstream merge, a patch plan is presented for user approval. The plan lists all modified files, their proposed resolution strategy (fork wins / hybrid / case-by-case), and the specific upstream changes being evaluated.

For the v1.13 sync, this review step was hardcoded in the Phase 8 plan as a checkpoint. For v1.18, the review was embedded in the research and planning phases for each execution wave. For future syncs, this behavior is controlled by the `sync.review_gate` setting in `.planning/config.json` (default: `true`). When enabled, the merge plan must be approved before conflict resolution begins.

## Contingencies

### Current Assessment (2026-03-28)

Upstream is evolving from an interactive development workflow tool into a **platform for automated project execution**. The trajectory from v1.22.4 through v1.30.0 shows three clear vectors: (1) runtime breadth (7 runtimes), (2) autonomous execution (SDK, headless CLI, auto-advance), and (3) community scale (i18n, multi-developer, workstreams, enterprise features). See [54-UPSTREAM-ANALYSIS.md](phases/54-sync-retrospective-governance/54-UPSTREAM-ANALYSIS.md) for the full analysis.

This trajectory is **complementary to, not conflicting with**, the fork's direction. The fork optimizes for epistemic self-improvement (signals, knowledge base, health probes, deliberations); upstream optimizes for adoption breadth and user autonomy. The two philosophies serve fundamentally different goals and produce different feature priorities.

### Risk Scenarios

| Scenario | Likelihood | Fork Response |
|----------|-----------|---------------|
| Upstream changes shared substrate (gsd-tools.cjs, installer, modules) | High | Adopt via hybrid merge; modular architecture localizes impact |
| Upstream adds features irrelevant to fork | High (already happening) | Skip; classify as "not applicable" in What-to-Adopt Criteria |
| Upstream architectural direction makes sync impractical | Low | Freeze at last compatible tag; evolve independently with snapshot reference |
| Upstream abandons the project | Low | Fork operates independently; all runtime code is local |
| Upstream changes break fork's hybrid modules | Medium | Retriage and re-apply fork extensions; the module.exports.funcName pattern is designed for exactly this |

### Divergence Growth Indicator

If the number of hybrid modules grows beyond 8-10 (currently 6), or if the diff lines in hybrid modules grow faster than the fork's unique value added, re-evaluate whether continued tracking is worthwhile versus a clean break. The post-modularization architecture makes this assessment concrete: fork value concentrates in the 5 fork-only modules plus the hybrid extensions, not in the shared substrate.

---
*Living document. Updated per sync cycle. Last updated: 2026-03-28 (v1.18 sync policy formalized -- sync cadence, baseline-freeze rules, what-to-adopt criteria, integration depth standard).*
