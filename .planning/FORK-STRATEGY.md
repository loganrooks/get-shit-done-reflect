# Fork Maintenance Strategy

## Fork Relationship

GSD Reflect is a fork of [GSD](https://github.com/gsd-build/get-shit-done) (Get Shit Done). The fork was created at commit `2347fca` (upstream v1.11.1), with the upstream remote configured as `upstream` pointing to `git@github.com:gsd-build/get-shit-done.git`. At the time of this document's creation, the fork is at v1.12.2 and upstream is at v1.18.0. The fork adds signal tracking, a knowledge base, spike workflows, a reflection engine, and knowledge surfacing on top of the base GSD workflow system.

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

All fork modifications to upstream files are explicitly tracked in [FORK-DIVERGENCES.md](./FORK-DIVERGENCES.md). Each modified file is recorded with its category (identity, commands, templates, build), a rationale for the modification, a merge stance (fork wins, hybrid merge, or case-by-case), and a conflict risk assessment.

The fork previously operated under an "additive only" constraint: all changes had to be new files or new commands, never modifying existing upstream files. This kept merges trivially clean -- upstream changes could be pulled in without conflicts. However, the fork has outgrown this constraint. Branding changes (README, installer banner, package identity), behavior changes (DevOps context in new-project, open_questions in templates), and deeper integration (version-check hook, knowledge config) all require modifying upstream files. Rather than pretending these modifications don't exist or working around them with fragile wrappers, the tracked-modifications strategy records every divergence explicitly so merge decisions are principled and auditable.

## Divergence Management

The current manifest of all fork divergences is maintained in [FORK-DIVERGENCES.md](./FORK-DIVERGENCES.md). That document lists every upstream file the fork has modified, along with files added by the fork.

### Divergence Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Identity** | Branding, naming, package identity | README.md, package.json, CHANGELOG.md |
| **Commands** | Modifications to command specifications | help.md, new-project.md, update.md |
| **Templates** | Changes to templates and reference docs | config.json template, research.md template |
| **Build** | Build scripts, tooling, config files | build-hooks.js, .gitignore |

### Merge Stance Options

| Stance | Meaning | When to Use |
|--------|---------|-------------|
| **Fork wins** | Fork version is kept entirely; upstream changes to this file are discarded | Identity files where fork has completely rewritten the content (README, CHANGELOG) |
| **Hybrid merge** | Combine upstream additions with fork modifications | Files where both sides add value (install.js, package.json, command files) |
| **Case-by-case** | Evaluate per sync based on what each side changed | Templates and configs where the better implementation should win |
| **Regenerate** | File is generated, not manually merged | package-lock.json |

### Update Cadence

The divergence manifest is updated per-phase during active development. When a phase modifies an upstream file (or creates a new divergence), FORK-DIVERGENCES.md is updated in that phase's execution. Between development cycles, the manifest is updated at sync time.

## Merge Strategy

Use traditional `git merge` (not rebase) on a dedicated sync branch.

### Why Merge Over Rebase

The fork has 145 commits and 17 modified upstream files. Rebasing would require replaying every fork commit onto the new upstream base, resolving conflicts potentially dozens of times as each commit is replayed. A merge handles this in one operation: one merge commit, one round of conflict resolution. The fork's commit history is preserved intact, which matters for `git blame` and `git bisect` when debugging fork-specific features.

### Sync Branch Workflow

```
1. Tag current state:     git tag -a reflect-vX.Y.Z-pre-sync -m "Pre-sync snapshot"
2. Create sync branch:    git checkout -b sync/v1.13-upstream main
3. Set conflict style:    git config merge.conflictstyle diff3
4. Merge upstream:        git merge upstream/main
5. Resolve conflicts:     (see Conflict Resolution Runbook below)
6. Validate:              npx vitest run && manual smoke check
7. Merge to main:         git checkout main && git merge sync/v1.13-upstream
8. Clean up:              git branch -d sync/v1.13-upstream
```

Use `git config merge.conflictstyle diff3` before merging. This shows the common ancestor version in conflict markers alongside both sides, making it much easier to understand what each side intended.

## Conflict Resolution Runbook

Step-by-step guide for resolving conflicts during an upstream merge. Consult FORK-DIVERGENCES.md for each file's merge stance before resolving.

### Step 1: Identify All Conflicts

```bash
git merge upstream/main
# Git will report conflicting files
git diff --name-only --diff-filter=U
```

### Step 2: Resolve by Merge Stance

**For "fork wins" files** (README.md, CHANGELOG.md, hooks/gsd-check-update.js):

```bash
git checkout --ours <file>
git add <file>
```

The fork version is kept entirely. No need to inspect upstream changes -- these files are fully owned by the fork.

**For "hybrid merge" files** (bin/install.js, package.json, commands/gsd/*.md, templates):

1. Open the file and find conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
2. With `diff3` style, the `|||||||` section shows the common ancestor
3. Keep fork modifications (branding, fork-specific features)
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
```

### Step 4: If Merge Goes Badly

If the merge produces an unrecoverable mess:

```bash
# Abort the merge (if still in merge state)
git merge --abort

# Or reset the sync branch to the pre-sync tag
git checkout sync/v1.13-upstream
git reset --hard v1.12.2-pre-sync
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

Syncs are ad-hoc, not on a fixed schedule. Trigger criteria:

- **Upstream has meaningful features:** New commands, architectural improvements, or significant enhancements worth adopting.
- **Security fixes:** Any upstream security patch should be evaluated promptly.
- **Version drift:** If the fork falls more than one major version behind upstream, sync to avoid accumulating too much divergence.

Current sync: v1.12.2 to v1.18.0 (overdue -- catching up after initial fork development focused on shipping v1.12 features).

## Merge Decision Log

Populated during each upstream sync. Records the actual merge decision made for each conflicting file.

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

## Review Gate

Before each upstream merge, a patch plan is presented for user approval. The plan lists all modified files, their proposed resolution strategy (fork wins / hybrid / case-by-case), and the specific upstream changes being evaluated.

For the v1.13 sync, this review step is hardcoded in the Phase 8 plan as a checkpoint. For future syncs, this behavior is controlled by the `sync.review_gate` setting in `.planning/config.json` (default: `true`). When enabled, the merge plan must be approved before conflict resolution begins.

## Contingencies

If upstream fundamentally changes direction -- switching to a different language, adopting an incompatible architecture, or abandoning the Markdown-native approach that makes GSD work -- the fork should evaluate whether continued tracking is worthwhile. The options at that point are: (1) adapt to the new upstream architecture if it's better, (2) freeze at the last compatible upstream version and evolve independently, or (3) contribute patches upstream to influence the direction. The tracked-modifications manifest makes this evaluation concrete: if the divergence count grows unboundedly with each sync, the fork is effectively independent regardless of what we call it.

---
*Living document. Updated per sync cycle. Last updated: 2026-02-10 (v1.18.0 merge decision log populated).*
