# Phase 7: Fork Strategy & Pre-Merge Setup - Research

**Researched:** 2026-02-10
**Domain:** Fork maintenance, divergence tracking, upstream sync preparation, patch preservation
**Confidence:** HIGH

## Summary

Phase 7 is a documentation and branch preparation phase -- no product code changes. The research investigated three domains: (1) how upstream's reapply-patches mechanism works, (2) the exact scope of fork divergences to track, and (3) best practices for fork maintenance strategies from real-world large forks (Git for Windows, Microsoft/git, GitHub/git).

The upstream reapply-patches feature (commit ca03a06) is a SHA256 manifest-based file backup system with LLM-assisted restore. It is well-suited for adoption because it already handles the core problem of detecting and preserving modifications across updates. The fork has 17 modified upstream files and 166 added files, with modifications falling into clear categories (identity/branding, commands, templates, config, build). The current test suite has 4 failing tests due to recently deleted files that must be fixed before the pre-merge snapshot.

**Primary recommendation:** Use a traditional merge strategy (not rebase) on a dedicated sync branch, with a manifest-based divergence tracking document at `.planning/FORK-DIVERGENCES.md` that categorizes all 17 modified files. Tag the current state before any merge begins. Fix the 4 failing tests first.

## Standard Stack

### Core

This phase produces only documentation and git operations. No libraries or runtime code.

| Component | Technology | Purpose | Why Standard |
|-----------|-----------|---------|--------------|
| Strategy document | Markdown | Fork maintenance reference | Matches all existing .planning/ docs |
| Divergence manifest | Markdown table | Track modified upstream files | Human + agent readable, version-controlled |
| Git tags | `git tag` | Pre-merge snapshot | Lightweight, built-in, sufficient |
| Git branches | `git branch` | Sync workspace | Standard fork maintenance pattern |
| Test runner | Vitest | Pre-snapshot validation | Already configured in project |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `git diff --name-status upstream/main...HEAD` | Generate divergence list | Building the initial manifest |
| `git diff upstream/main...HEAD -- <file>` | Understand per-file changes | Classifying and describing each divergence |
| `git merge-base HEAD upstream/main` | Identify fork point | Documenting sync history |
| `git log --oneline upstream/main` | Understand upstream changes | Context for strategy decisions |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Traditional merge | Rebase onto upstream | Merge preserves fork history; rebase is cleaner but riskier with 17 modified files and 145 fork commits |
| Markdown manifest | JSON manifest | Markdown is human-readable and matches project conventions; JSON would need tooling to maintain |
| Git tag for snapshot | Git branch for snapshot | Tag is immutable (correct for snapshots); branch could be accidentally modified |
| `.planning/` location | Repo root | Consistent with all existing project documentation |

## Architecture Patterns

### Recommended Document Structure

```
.planning/
  FORK-STRATEGY.md           # NEW - authoritative fork maintenance reference
  FORK-DIVERGENCES.md        # NEW - manifest of all modified upstream files
  phases/07-fork-strategy-pre-merge-setup/
    07-CONTEXT.md             # EXISTS
    07-RESEARCH.md            # THIS FILE
    07-01-PLAN.md             # TBD by planner
```

### Pattern 1: Divergence Manifest as Categorized Table

**What:** A single Markdown file listing every upstream file the fork has modified, categorized by type, with rationale for each modification.

**When to use:** Every sync cycle. Updated per-phase during active development.

**Structure:**

```markdown
# Fork Divergence Manifest

## Summary
- Modified upstream files: 17
- Added fork-only files: 166
- Fork point: 2347fca (upstream v1.11.1)
- Last sync: [date]

## Modified Upstream Files

### Identity (fork branding)
| File | What Changed | Why | Merge Stance |
|------|-------------|-----|--------------|
| README.md | Complete rewrite for GSD Reflect | Fork identity | Fork wins |
| CHANGELOG.md | Fork-specific changelog | Fork identity | Fork wins |
| package.json | Name, repo, description, scripts | Fork identity + extensions | Hybrid merge |
| bin/install.js | Banner, package refs, version-check hook | Fork branding + fork feature | Hybrid merge |

### Behavior (fork functionality changes)
| File | What Changed | Why | Merge Stance |
| ... | ... | ... | Case-by-case |

### Config (templates and defaults)
| File | What Changed | Why | Merge Stance |
| ... | ... | ... | Case-by-case |
```

### Pattern 2: Strategy Document as Living Reference

**What:** A document that serves both human and Claude agents equally, explaining how the fork manages divergences, when to sync, and how to handle conflicts.

**When to use:** Referenced before every upstream sync. Updated after each sync with lessons learned.

**Key sections:**
- Fork relationship and history
- Current divergence summary (points to FORK-DIVERGENCES.md)
- Merge strategy and branch workflow
- Conflict resolution runbook
- Patch preservation approach (reapply-patches adoption)
- Decision log for merge decisions
- Sync cadence policy

### Pattern 3: Sync Branch Workflow

**What:** Dedicated branch for performing upstream merge, validated before merging to main.

**Workflow:**
```
main ─────────────────────────────── (tag: v1.12.2-pre-sync)
  └── sync/v1.13-upstream ── merge upstream/main ── resolve conflicts ── validate ── merge to main
```

### Anti-Patterns to Avoid

- **Rebase-based sync for this fork size:** With 145 fork commits and 17 modified files, rebase would require replaying every fork commit onto the new upstream. Traditional merge handles this in one operation with explicit conflict resolution.
- **Tracking divergences only in git history:** History shows what changed but not why or what the merge stance is. An explicit manifest is essential for LLM agents that need to make merge decisions.
- **Blanket merge rules ("upstream always wins"):** The user explicitly decided case-by-case evaluation. Different files have different stances.
- **Deferring test fixes to after snapshot:** The snapshot must be clean (tests passing) per success criteria. Fix failing tests before tagging.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Detecting modified upstream files | Manual file comparison | `git diff --diff-filter=M --name-only upstream/main...HEAD` | Git already knows exactly which files diverge |
| Patch preservation across updates | Custom backup system | Upstream's reapply-patches mechanism (manifest + backup + LLM merge) | Already built, tested, and integrated with install.js |
| Snapshot immutability | Separate branch copy | `git tag v1.12.2-pre-sync` | Tags are immutable by design; branches are not |
| Conflict style during merge | Manual diff reading | `git config merge.conflictstyle diff3` | Shows common ancestor in conflicts, makes resolution clearer |

**Key insight:** The upstream reapply-patches mechanism (ca03a06) already solves the core patch preservation problem. It uses SHA256 file hashing for modification detection, file-level backup to `gsd-local-patches/`, and an LLM-guided `/gsd:reapply-patches` command for restoration. Adopt this rather than building a parallel system.

## Common Pitfalls

### Pitfall 1: Snapshotting with Failing Tests

**What goes wrong:** Taking a "pre-merge snapshot" when tests already fail means you cannot distinguish pre-existing failures from merge-introduced failures.
**Why it happens:** The current test suite has 4 failures due to recently deleted agent/command files (gsd-signal-collector.md, gsd-reflector.md, reflect.md, spike.md). These are uncommitted deletions visible in `git status`.
**How to avoid:** Fix the 4 failing wiring validation tests BEFORE creating the snapshot tag. Either restore the deleted files or update the tests to reflect the new file locations.
**Warning signs:** `npx vitest run` shows failures. Current output: "1 failed | 3 passed | 1 skipped (5 files), 4 failed | 38 passed | 4 skipped (46 tests)".

### Pitfall 2: Merge Strategy Mismatch

**What goes wrong:** Using `git rebase` instead of `git merge` for a fork with many divergent commits causes painful conflict resolution on every replayed commit.
**Why it happens:** Rebase is often recommended for "staying up to date" but is designed for small, linear patch stacks, not 145 commits with 17 modified upstream files.
**How to avoid:** Use `git merge upstream/main` on the sync branch. One merge commit, one round of conflict resolution.
**Warning signs:** If someone suggests `git rebase upstream/main`, flag it.

### Pitfall 3: Incomplete Divergence Tracking

**What goes wrong:** Tracking only code files and missing agents, configs, workflows, or templates that were also modified.
**Why it happens:** Easy to think "divergence = source code changes" but this fork's modifications are primarily Markdown specifications and JSON configs.
**How to avoid:** The user explicitly decided to track ALL modified files, not just JS/TS. The `git diff --diff-filter=M --name-only` output shows all 17 files including templates, commands, and build scripts.
**Warning signs:** Divergence manifest that only lists `.js` files.

### Pitfall 4: Losing Pre-Merge State

**What goes wrong:** After a bad merge, wanting to go back to the exact pre-merge state but not having a clean reference point.
**Why it happens:** Without a tag, the pre-merge state exists only in git history and requires knowing the exact commit hash.
**How to avoid:** Create an annotated tag `v1.12.2-pre-sync` on main before creating the sync branch. This is immutable and named.
**Warning signs:** Starting the sync branch without tagging first.

### Pitfall 5: Confusing Reapply-Patches Scope

**What goes wrong:** Thinking upstream's reapply-patches is for fork-to-upstream sync. It is actually for end-user patch preservation during `/gsd:update`.
**Why it happens:** The name "reapply-patches" sounds like a fork maintenance tool, but it is designed for users who modify installed GSD files locally.
**How to avoid:** Understand the mechanism clearly: manifest records file hashes at install time; on next install, modified files are backed up; `/gsd:reapply-patches` merges them back. For fork maintenance, we ADOPT this mechanism as inspiration for our own tracking, but the actual fork merge uses standard git merge.
**Warning signs:** Trying to run `/gsd:reapply-patches` as part of the upstream sync process.

## Code Examples

### Generating the Divergence Manifest

```bash
# Source: git diff documentation
# List all files modified by fork (not added, not deleted -- only modified upstream files)
git diff --diff-filter=M --name-only upstream/main...HEAD

# Output (current state):
# .gitignore
# CHANGELOG.md
# README.md
# bin/install.js
# commands/gsd/help.md
# commands/gsd/new-project.md
# commands/gsd/update.md
# get-shit-done/references/planning-config.md
# get-shit-done/templates/codebase/concerns.md
# get-shit-done/templates/config.json
# get-shit-done/templates/context.md
# get-shit-done/templates/project.md
# get-shit-done/templates/research.md
# hooks/gsd-check-update.js
# package-lock.json
# package.json
# scripts/build-hooks.js
```

### Creating the Pre-Merge Snapshot

```bash
# Ensure all tests pass first
npx vitest run

# Tag the current state (annotated tag with message)
git tag -a v1.12.2-pre-sync -m "Pre-upstream-sync snapshot: fork state before v1.13 merge"

# Push tag to origin
git push origin v1.12.2-pre-sync
```

### Creating the Sync Branch

```bash
# Create sync branch from current main
git checkout -b sync/v1.13-upstream main

# Push to remote with tracking
git push -u origin sync/v1.13-upstream

# Later (Phase 8): perform the merge on this branch
git merge upstream/main
# Resolve conflicts...
# Validate...
# Then merge sync branch to main
```

### Upstream Reapply-Patches Mechanism (Reference)

```javascript
// Source: upstream commit ca03a06, bin/install.js

// 1. After install, write manifest with SHA256 hashes of all installed files
function writeManifest(configDir) {
  // Hashes: get-shit-done/*, commands/gsd/*, agents/gsd-*.md
  // Stored as: gsd-file-manifest.json
}

// 2. Before next install, detect modifications by comparing hashes
function saveLocalPatches(configDir) {
  // Compare current file hash vs manifest hash
  // If different: backup to gsd-local-patches/{relative-path}
  // Write backup-meta.json with version info and file list
}

// 3. After install, report backed-up patches
function reportLocalPatches(configDir) {
  // Read backup-meta.json
  // Display which files were backed up
  // Point user to /gsd:reapply-patches
}

// 4. /gsd:reapply-patches (separate command file)
// LLM reads both backed-up version and newly installed version
// Identifies user's modifications
// Applies them to new version
// Reports: Merged / Skipped / Conflict per file
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Additive-only fork constraint | Tracked-modifications strategy | Phase 7 (this phase) | Can now modify upstream files directly, with explicit tracking |
| Manual merge tracking | Manifest-based divergence document | Phase 7 (this phase) | Agents and humans know exactly what diverges and why |
| No patch preservation | Upstream's reapply-patches mechanism | Upstream v1.16.0 (ca03a06) | End-user modifications survive updates automatically |
| Single-branch development | Sync branch workflow | Phase 7 (this phase) | Merge happens in isolation, main stays stable until validated |

## Upstream Reapply-Patches: Detailed Analysis

**Commit:** ca03a06 (upstream, 2026-02-08)
**PR:** #481 "feat: preserve local patches across GSD updates"
**Files changed:** bin/install.js (+145 lines), commands/gsd/reapply-patches.md (new, 110 lines), get-shit-done/workflows/update.md (+17 lines)

### How It Works

1. **Manifest creation:** After `install()` runs, `writeManifest()` generates SHA256 hashes of every file in `get-shit-done/`, `commands/gsd/`, and `agents/gsd-*.md`. Stored as `gsd-file-manifest.json` in the config directory.

2. **Modification detection:** Before the next install wipes files, `saveLocalPatches()` compares each file's current hash against the manifest. Files with different hashes are copied to `gsd-local-patches/{relative-path}`.

3. **Backup metadata:** A `backup-meta.json` records: backed_up_at timestamp, from_version (previous GSD version), and list of modified files.

4. **Restoration:** The `/gsd:reapply-patches` command (LLM-guided, not automated):
   - Reads backed-up version and newly installed version
   - Identifies user's additions/modifications
   - Applies them to new version
   - Handles upstream-also-changed cases by flagging conflicts for user decision
   - Reports per-file status: Merged, Skipped (already upstream), or Conflict

### Relevance to Fork (FORK-02)

This mechanism is designed for end-users who modify installed GSD files. For our fork, we adopt it as:
- **Conceptual model:** Track what we've changed, detect when upstream changes the same files, merge intelligently
- **Actual tool:** After Phase 8 merge, our fork will inherit this mechanism for our own downstream users who install get-shit-done-reflect-cc and modify files
- **Not for fork sync itself:** The fork-to-upstream sync uses standard `git merge`, not reapply-patches

## Fork Divergence Audit

### Summary Statistics

| Metric | Count |
|--------|-------|
| Fork commits since fork point | 145 |
| Upstream commits since fork point | 70 |
| Files modified (upstream files changed by fork) | 17 |
| Files added (fork-only) | 166 |
| Files deleted from upstream | 0 |
| Fork point commit | 2347fca |
| Upstream version at fork | v1.11.1 |
| Upstream current version | v1.18.0 |
| Fork current version | v1.12.2 |

### Modified Upstream Files by Category

**Identity/Branding (6 files):**

| File | What Fork Changed | Merge Stance |
|------|------------------|--------------|
| `README.md` | Complete rewrite: GSD Reflect branding, feature table, learning loop description | Fork wins |
| `CHANGELOG.md` | Fork-specific changelog, removed upstream history | Fork wins |
| `package.json` | Name (get-shit-done-reflect-cc), repo URLs, description, scripts, devDependencies | Hybrid: keep fork identity, adopt upstream structural additions |
| `package-lock.json` | Generated from fork's package.json | Regenerate after package.json merge |
| `bin/install.js` | Banner (REFLECT ASCII art), package name refs, help text, version-check hook registration, uninstall hook list | Hybrid: keep fork branding, adopt upstream additions (manifest, patch preservation, JSONC parsing) |
| `hooks/gsd-check-update.js` | npm package name: get-shit-done-reflect-cc | Fork wins (one-line change) |

**Command Files (3 files):**

| File | What Fork Changed | Merge Stance |
|------|------------------|--------------|
| `commands/gsd/help.md` | Package name refs, install command, GSD Reflect section with reflect-specific commands | Hybrid: adopt upstream command additions, preserve fork branding and reflect section |
| `commands/gsd/new-project.md` | Added Phase 5.7 DevOps Context section, added devops-detection.md reference | Hybrid: adopt upstream additions (--auto flag), preserve fork's DevOps section |
| `commands/gsd/update.md` | Package name refs (5 occurrences), changelog URL | Fork wins on branding; adopt upstream additions (patch check step) |

**Templates and References (5 files):**

| File | What Fork Changed | Merge Stance |
|------|------------------|--------------|
| `get-shit-done/references/planning-config.md` | Added knowledge_debug config, knowledge_surfacing_config section | Hybrid: adopt upstream additions, preserve fork config extensions |
| `get-shit-done/templates/config.json` | Added gsd_reflect_version, health_check, devops sections | Hybrid: merge both sets of additions |
| `get-shit-done/templates/context.md` | Added open_questions section | Adopt upstream if they also added this; otherwise preserve fork version |
| `get-shit-done/templates/project.md` | Added open_questions section | Same as context.md |
| `get-shit-done/templates/research.md` | Enhanced open_questions with resolved/gaps/spike/still-open structure | Preserve fork's more detailed version |

**Build and Config (3 files):**

| File | What Fork Changed | Merge Stance |
|------|------------------|--------------|
| `get-shit-done/templates/codebase/concerns.md` | Added DevOps Gaps section to template and example | Preserve fork addition |
| `scripts/build-hooks.js` | Added gsd-version-check.js to HOOKS_TO_COPY array | Preserve fork addition |
| `.gitignore` | Added benchmark results exclusion | Preserve fork addition; adopt any upstream additions |

## Current Test Status (Pre-Snapshot Blocker)

**4 tests failing** in `tests/integration/wiring-validation.test.js`:

| Test | Failure Reason | Fix Required |
|------|---------------|--------------|
| subagent_type values match agent files | `gsd-signal-collector.md` and `gsd-reflector.md` deleted from `.claude/agents/` | Restore files OR update test expectations |
| reflect command exists | `.claude/commands/gsd/reflect.md` deleted | Restore file OR update test |
| spike command exists | `.claude/commands/gsd/spike.md` deleted | Restore file OR update test |

**Root cause:** Git status shows these files as deleted in the working tree (`D` status). They appear to be uncommitted deletions. The snapshot requires these tests passing.

**Recommendation:** Investigate why these files were deleted. If intentional (files moved elsewhere or consolidated), update the wiring validation tests. If accidental, restore them with `git checkout -- <path>`.

## Smoke Test Coverage

The smoke test (`tests/smoke/run-smoke.sh`) validates:

| Tier | What It Tests | Requirement for Snapshot |
|------|--------------|--------------------------|
| Tier 2 (Core Regression) | Project init, plan phase, execute phase, knowledge surfacing regression | Not required (expensive, needs claude CLI) |
| Tier 3 Quick | Manual signal, signal collection | Not required |
| Tier 3 Standard | + Reflection, KB surfacing | Not required |
| Tier 3 Full | + Spike experiment | Not required |

**Recommendation:** The smoke test is expensive (requires claude CLI, API calls, minutes to run). For the pre-merge snapshot, `npx vitest run` passing (unit + integration) is sufficient. Smoke tests can be run after Phase 8 merge as a comprehensive validation.

## Claude's Discretion Recommendations

### Divergence Tracking Method

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Marking method | Manifest file (`.planning/FORK-DIVERGENCES.md`) | Inline comments pollute code; manifest is centralized and agent-readable |
| Tracking update cadence | Per-phase | Natural workflow cadence; per-commit is too frequent, at-sync-time misses intermediate changes |
| Categorize by type | Yes: identity, behavior, additive, config | Makes merge stance decisions systematic; same categories used in this research |
| Include rationale | Yes, one sentence per file | Agents making merge decisions need to know WHY something was changed |
| Lifecycle tracking | Simple removal (not active/resolved) | When a divergence is resolved (upstream adopts our change, or we adopt theirs), remove from manifest. Simpler than tracking status. |

### Strategy Document

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Location | `.planning/FORK-STRATEGY.md` | Consistent with all other project docs |
| Historical context | Brief paragraph | Explains why additive-only existed and why it's being retired; important for agents reading the doc later |
| Merge conflict runbook | Yes, include | Phase 8 needs it immediately; saves repeating conflict resolution patterns |
| Decision log | Yes, template section | Audit trail for merge decisions; populated during Phase 8 |
| Sync cadence | Ad-hoc with criteria | No fixed schedule; sync when: upstream has meaningful changes, security fixes, or fork falls behind by a major version |
| Contingencies | Brief section | Address "what if upstream fundamentally changes direction" with one-paragraph guidance |
| Living vs stable | Living document, updated per sync | Each sync adds to decision log and updates divergence count |

### Patch Identification Approach

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Patch format | File list with descriptions (in FORK-DIVERGENCES.md) | LLM-assisted merge reads files directly; .patch files add unnecessary tooling complexity |
| Classification | Modified upstream files vs. fork additions | The `git diff --diff-filter=M` vs `--diff-filter=A` distinction is the natural split |
| Risk assessment | Yes: low/medium/high per modified file | Based on whether upstream also changed the file. Files changed by both = high risk. See risk table below. |

**Conflict Risk Assessment:**

| File | Upstream Also Changed? | Risk | Notes |
|------|----------------------|------|-------|
| `bin/install.js` | Yes (extensively: +145 lines for patches, JSONC parsing) | HIGH | Both sides added significant code |
| `package.json` | Yes (version bumps, files array) | HIGH | Both structural and identity changes |
| `commands/gsd/new-project.md` | Yes (--auto flag, --include flag) | HIGH | Both added new sections |
| `commands/gsd/help.md` | Yes (new commands added) | MEDIUM | Additive from both sides, likely clean merge |
| `commands/gsd/update.md` | Yes (patch check step) | MEDIUM | Fork branding + upstream additions |
| `get-shit-done/templates/config.json` | Yes (new fields) | MEDIUM | Both added new fields, should merge cleanly |
| `get-shit-done/references/planning-config.md` | Yes (new sections) | MEDIUM | Both added new config documentation |
| `README.md` | Yes (badges, content changes) | LOW | Fork wins entirely, no merge needed |
| `CHANGELOG.md` | Yes (upstream entries) | LOW | Fork wins entirely |
| `hooks/gsd-check-update.js` | No | LOW | Single-line fork change |
| `scripts/build-hooks.js` | No | LOW | Single-line fork addition |
| `.gitignore` | Not significantly | LOW | Both added entries, clean merge |
| `get-shit-done/templates/research.md` | No significant overlap | LOW | Fork enhanced existing section |
| `get-shit-done/templates/context.md` | No significant overlap | LOW | Fork added new section |
| `get-shit-done/templates/project.md` | No significant overlap | LOW | Fork added new section |
| `get-shit-done/templates/codebase/concerns.md` | No significant overlap | LOW | Fork added new section |
| `package-lock.json` | N/A | N/A | Regenerated; not manually merged |

### Branch & Snapshot Setup

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| Sync branch name | `sync/v1.13-upstream` | Clear purpose, version-scoped, follows GSD's branch template pattern |
| Snapshot method | Annotated tag: `v1.12.2-pre-sync` | Immutable, named, includes message. Branch snapshots can be accidentally modified. |
| Work on sync branch vs incremental | Work on sync branch | Isolates merge risk from main; main stays stable for any hotfixes needed |
| Rollback strategy | Reset sync branch to pre-sync tag; main is untouched until final merge | Two-layer safety: tag preserves state, sync branch is disposable |
| Upstream remote | Permanent (already configured as `upstream`) | Already set up correctly pointing to `git@github.com:gsd-build/get-shit-done.git` |

### Review Gate Configuration

| Decision | Recommendation | Rationale |
|----------|---------------|-----------|
| For v1.13 | Hardcode the review step in Phase 8 plan | User explicitly wants review before merge |
| For future syncs | Add `review_gate` field to `.planning/config.json` | User suggested this; make it a boolean in config, default true |
| Implementation | `"sync": { "review_gate": true }` in config.json | Minimal addition, respects existing config pattern |

## Open Questions

### Resolved

- **How does upstream's reapply-patches mechanism work?** SHA256 manifest-based backup with LLM-guided restore. Fully understood from commit ca03a06 analysis.
- **What does the current smoke test validate?** Three tiers (core regression, reflect features, spike) requiring claude CLI. Unit/integration tests sufficient for pre-snapshot validation.
- **What is the current fork divergence scope?** 17 modified files, 166 added files, categorized and risk-assessed above.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Why were gsd-signal-collector.md, gsd-reflector.md, reflect.md, and spike.md deleted? | Medium | Investigate before snapshot. If intentional migration, update tests. If accidental, restore. |
| Should review gate become a config.json setting or onboarding question? | Low | Defer to Phase 12 (release). For now, hardcode in plan. |
| Will `git merge upstream/main` produce a manageable number of conflicts? | Low | Accept risk. The 17 modified files and risk assessment above give good predictability. HIGH-risk files (3) will need careful manual resolution. |

## Sources

### Primary (HIGH confidence)

- Upstream commit ca03a06: Full diff analysis of reapply-patches mechanism (3 files, 271 lines)
- `git diff --diff-filter=M --name-only upstream/main...HEAD`: Complete list of 17 modified files
- `git diff upstream/main...HEAD -- <file>`: Per-file diff analysis for all 17 files
- `npx vitest run`: Current test suite output (4 failures identified)
- `tests/smoke/run-smoke.sh`: Full smoke test source (575 lines)

### Secondary (MEDIUM confidence)

- [GitHub Blog: Strategies for Friendly Fork Management](https://github.blog/developer-skills/github/friend-zone-strategies-friendly-fork-management/) - Three real-world fork maintenance strategies from Git for Windows, Microsoft/git, GitHub/git
- [History-preserving fork maintenance with git](https://amboar.github.io/notes/2021/09/16/history-preserving-fork-maintenance-with-git.html) - Merge + rebase pattern for downstream patches

### Tertiary (LOW confidence)

- [Git Fork Best Practices (Gofore)](https://gofore.com/en/best-practices-for-forking-a-git-repo/) - General fork maintenance guidance
- [Reuse and maintenance practices among divergent forks (Springer)](https://link.springer.com/article/10.1007/s10664-021-10078-2) - Academic study on fork divergence patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All tools are git built-ins and existing project infrastructure
- Architecture: HIGH - Document structure follows established .planning/ conventions exactly
- Pitfalls: HIGH - Based on actual current test failures and verified git state
- Upstream mechanism: HIGH - Direct source code analysis of ca03a06 commit
- Fork maintenance patterns: MEDIUM - Based on GitHub Blog article and general best practices
- Risk assessment: MEDIUM - Based on diff analysis but actual merge conflicts depend on upstream's internal changes

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (stable -- fork divergence data may change if commits are made before Phase 7 execution)
