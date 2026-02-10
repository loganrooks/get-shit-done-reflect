# Phase 8: Core Merge & Conflict Resolution - Research

**Researched:** 2026-02-10
**Domain:** Git merge conflict resolution, fork maintenance
**Confidence:** HIGH

## Summary

Phase 8 merges 70 upstream commits (v1.11.2 to v1.18.0) into the fork via `git merge upstream/main` on the `sync/v1.13-upstream` branch. The research investigated every file that could conflict, compared fork and upstream versions, and determined the actual scope of work.

The key finding is that only **11 files will actually conflict** (not the estimated 12 from FORK-DIVERGENCES.md). Six fork-modified files have no corresponding upstream changes, so they will merge cleanly. The most complex conflict is `bin/install.js`, where upstream added ~200 lines of patch persistence infrastructure, JSONC parsing, and bug fixes to a file the fork has significantly customized with REFLECT branding. The second complexity factor is the upstream "thin orchestrator" refactoring, which shrank commands like `new-project.md` from ~1000 lines to ~40 lines by delegating to workflow files -- but the fork's inline version must be preserved until Phase 9 migrates to the new architecture.

**Primary recommendation:** Resolve conflicts by risk tier (HIGH first, then MEDIUM+LOW) using the fork's version as the base for `install.js` and the fork's inline versions for command files, surgically adopting specific upstream additions. Use `git checkout --ours` for the 3 fork-wins files. Regenerate `package-lock.json` after `package.json` is resolved.

## Standard Stack

This phase uses git operations and Node.js tooling -- no new libraries are needed.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| `git merge` | System git | Execute the upstream merge | Standard git merge preserves both commit histories; already decided in Phase 7 |
| `git config merge.conflictstyle diff3` | System git | Show common ancestor in conflicts | Critical for understanding what each side intended; shows the 3-way diff |
| `vitest` | ^3.0.0 (fork devDep) | Run fork's 42 tests post-merge | Already configured in vitest.config.js |
| `node --test` | Node.js built-in | Run upstream's 63 gsd-tools tests | Upstream's test runner; no additional deps needed |
| `npm install` | System npm | Regenerate package-lock.json | Required after package.json merge resolution |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `git checkout --ours <file>` | Resolve fork-wins files | README.md, CHANGELOG.md, gsd-check-update.js |
| `git diff --name-only --diff-filter=U` | List conflicting files | After `git merge` to identify actual conflicts |
| `git add <file>` | Stage resolved files | After each file is resolved |
| `grep -r` | Ghost reference check | Post-merge verification for memory system remnants |

### Alternatives Considered
None -- git merge was the locked decision from Phase 7.

## Architecture Patterns

### Conflict Resolution by Risk Tier

The per-file approach, ordered from highest to lowest risk:

```
Plan 08-02 (HIGH risk):
├── package.json       # Identity + upstream additions
├── new-project.md     # Fork inline vs upstream thin orchestrator
└── install.js         # Fork branding + upstream features (most complex)

Plan 08-03 (MEDIUM + LOW risk):
├── help.md            # MEDIUM: thin orchestrator conversion
├── update.md          # MEDIUM: thin orchestrator conversion
├── planning-config.md # MEDIUM: gsd-tools CLI references
├── research.md        # LOW: upstream added user_constraints section
├── .gitignore         # LOW: upstream added 2 entries
├── README.md          # Fork wins (auto-resolve)
├── CHANGELOG.md       # Fork wins (auto-resolve)
└── gsd-check-update.js# Fork wins (auto-resolve)
```

### Merge Conflict Resolution Pattern

For each conflicting file, the resolution follows this pattern:

```
1. Read the conflict markers (with diff3 showing common ancestor)
2. Identify what fork changed from common ancestor
3. Identify what upstream changed from common ancestor
4. Apply merge stance from FORK-DIVERGENCES.md:
   - fork-wins: git checkout --ours
   - hybrid-merge: combine both, fork identity takes priority
   - case-by-case: evaluate each block
5. Stage the resolved file: git add <file>
```

### Anti-Patterns to Avoid
- **Blindly accepting upstream for thin orchestrator commands:** Commands like help.md, update.md, new-project.md were massively restructured by upstream to delegate to workflow files. The fork does NOT have these workflow files customized yet. Accepting upstream's thin version would break these commands until Phase 9 completes the migration.
- **Resolving package-lock.json manually:** Never hand-edit. Always regenerate via `npm install` after package.json is finalized.
- **Mixing merge resolution with architecture adoption:** Phase 8 resolves conflicts. Phase 9 adopts the thin orchestrator pattern. These are separate concerns.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| package-lock.json conflicts | Manual JSON editing | `npm install` after package.json resolved | Binary-like file; manual edits always break integrity |
| Finding actual conflicts | Guessing from FORK-DIVERGENCES.md | `git diff --name-only --diff-filter=U` after merge | Predictions are wrong (see findings: 11 not 12) |
| Verifying merge completeness | Manual commit counting | `git log --oneline upstream/main..HEAD` | Git natively tracks ancestry |
| Ghost reference detection | Manual file inspection | `grep -r "gsd_memory\|gsd-memory\|projects\.json" --include="*.md" --include="*.js"` | Automated, exhaustive, repeatable |

**Key insight:** The actual merge tells you exactly what conflicts. Pre-merge predictions are useful for planning but should not override what git reports.

## Common Pitfalls

### Pitfall 1: Accepting Upstream Thin Orchestrator Prematurely
**What goes wrong:** Upstream restructured commands (help.md, new-project.md, update.md) from inline logic (~1000 lines) to thin orchestrators (~40 lines) that delegate to workflow files. Accepting upstream's version means the command becomes a stub pointing to workflow files that have upstream references, not fork customizations.
**Why it happens:** The upstream version looks "cleaner" and newer, so there's a temptation to accept it.
**How to avoid:** For Phase 8, preserve the fork's inline versions of commands. Add upstream's new features (like --auto flag) to the fork's inline version if desired. Phase 9 handles the thin orchestrator migration.
**Warning signs:** A resolved command file that is under 50 lines when the fork version was 500+ lines.

### Pitfall 2: Upstream Package Names Leaking Into Fork
**What goes wrong:** During conflict resolution, upstream references to `get-shit-done-cc`, `npx get-shit-done-cc`, or upstream GitHub URLs slip into the merged code.
**Why it happens:** Conflict resolution involves choosing blocks of text from upstream, and those blocks contain upstream's package name.
**How to avoid:** After resolving each file, grep for `get-shit-done-cc` (without `reflect`) and upstream URLs. The fork package name is `get-shit-done-reflect-cc`.
**Warning signs:** grep for `npx get-shit-done-cc[^-]` in any resolved file.

### Pitfall 3: Losing Fork Hook Registration in install.js
**What goes wrong:** The fork's install.js registers `gsd-version-check.js` hook in addition to upstream's hooks. During hybrid merge, this registration can be lost.
**Why it happens:** Upstream's version doesn't have this hook, so it's only in the fork's "ours" side.
**How to avoid:** Verify the resolved install.js contains the `gsd-version-check.js` hook registration block (around line 1270-1285 in current fork version).
**Warning signs:** Missing `gsd-version-check` string in the resolved install.js.

### Pitfall 4: Merge State Corruption
**What goes wrong:** Interrupting a merge resolution (e.g., aborting partway through, or committing prematurely) leaves the repo in a broken state.
**Why it happens:** git merge state is fragile -- you're either in a merge or you're not.
**How to avoid:** Resolve ALL conflicts before running `git commit`. If something goes wrong, use `git merge --abort` to cleanly restart. The `v1.12.2-pre-sync` tag is the immutable rollback point.
**Warning signs:** `git status` shows "both modified" files alongside "Changes to be committed".

### Pitfall 5: package-lock.json Merge Conflicts
**What goes wrong:** Git cannot meaningfully merge JSON lockfiles. Any attempt produces corrupt JSON.
**Why it happens:** The fork has 2885 lines (vitest deps) while upstream has 488 lines (esbuild only).
**How to avoid:** After package.json is resolved, run `npm install` to regenerate. Stage the new lockfile.
**Warning signs:** package-lock.json with conflict markers.

### Pitfall 6: Missing Bug Fix Code in install.js
**What goes wrong:** Two bug fixes (FIX-07: statusline crash/color validation, FIX-08: statusline reference update) modify install.js. If the hybrid merge for install.js starts from the fork version and adds upstream features, these fixes could be missed.
**Why it happens:** The fixes are small changes embedded in a large file with many other changes.
**How to avoid:** Cross-reference the specific commit diffs (9d7ea9c, 074b2bc) against the resolved install.js to verify the fix code is present.
**Warning signs:** The `cleanupOrphanedHooks` function still uses `cleaned` instead of `cleanedHooks`, or the statusline update code block is missing.

## Code Examples

### Executing the Merge (Plan 08-01)

```bash
# Switch to sync branch
git checkout sync/v1.13-upstream

# Set diff3 conflict style (shows common ancestor)
git config merge.conflictstyle diff3

# Verify upstream remote
git remote -v | grep upstream
git fetch upstream

# Execute the merge
git merge upstream/main
# This will report conflicts

# List actual conflicting files
git diff --name-only --diff-filter=U
```

### Resolving Fork-Wins Files (Plan 08-03)

```bash
# These files are fully owned by the fork
git checkout --ours README.md
git checkout --ours CHANGELOG.md
git checkout --ours hooks/gsd-check-update.js

# Stage them
git add README.md CHANGELOG.md hooks/gsd-check-update.js
```

### Hybrid Merge Pattern for install.js (Plan 08-02)

The install.js hybrid merge strategy: start from the fork's version, then surgically add upstream features.

Upstream additions to adopt:
1. `const crypto = require('crypto');` -- needed for patch manifest hashing
2. Color validation fix in `convertClaudeToOpencodeFrontmatter` (~6 lines)
3. `cleanedHooks` variable rename in `cleanupOrphanedHooks` (~3 lines)
4. Statusline reference update fix block in `cleanupOrphanedHooks` (~12 lines)
5. `parseJsonc()` function (~60 lines) -- JSONC parser for opencode.json
6. Updated `configureOpencodePermissions()` to use parseJsonc + better error handling (~12 lines)
7. Windows backslash normalization in `pathPrefix` (~1 line)
8. Entire patch persistence system: `fileHash`, `generateManifest`, `writeManifest`, `saveLocalPatches`, `reportLocalPatches` (~130 lines)
9. `saveLocalPatches(targetDir)` call in `install()` function (~2 lines)
10. `writeManifest(targetDir)` + `reportLocalPatches(targetDir)` calls at end of `install()` (~5 lines)

Fork additions to preserve:
1. REFLECT ASCII banner (lines 108-124)
2. Package name `get-shit-done-reflect-cc` in banner, help text, and all references
3. `gsd-version-check.js` hook registration (lines 1270-1285)
4. Fork-specific description in banner
5. All fork-specific help text examples using `npx get-shit-done-reflect-cc`

### Hybrid Merge Pattern for package.json (Plan 08-02)

```json
{
  "name": "get-shit-done-reflect-cc",
  "version": "1.12.2",
  "description": "A self-improving AI coding system that learns from its mistakes. Built on GSD by TACHES.",
  "bin": {
    "get-shit-done-reflect-cc": "bin/install.js"
  },
  "files": [
    "bin",
    "commands",
    "get-shit-done",
    "agents",
    "hooks/dist",
    "scripts"
  ],
  "keywords": [
    "claude", "claude-code", "ai", "meta-prompting",
    "context-engineering", "spec-driven-development",
    "gemini", "gemini-cli",
    "knowledge-base", "signal-tracking", "self-improving",
    "reflection", "gsd-reflect"
  ],
  "author": "TACHES",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/loganrooks/get-shit-done-reflect.git"
  },
  "homepage": "https://github.com/loganrooks/get-shit-done-reflect",
  "bugs": {
    "url": "https://github.com/loganrooks/get-shit-done-reflect/issues"
  },
  "engines": {
    "node": ">=16.7.0"
  },
  "dependencies": {},
  "devDependencies": {
    "@vitest/coverage-v8": "^3.0.0",
    "esbuild": "^0.24.0",
    "vitest": "^3.0.0"
  },
  "scripts": {
    "build:hooks": "node scripts/build-hooks.js",
    "prepublishOnly": "npm run build:hooks",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:infra": "vitest run tests/integration/kb-infrastructure.test.js tests/integration/wiring-validation.test.js",
    "test:smoke": "bash tests/smoke/run-smoke.sh",
    "test:smoke:quick": "SMOKE_TIER=quick bash tests/smoke/run-smoke.sh",
    "test:smoke:full": "SMOKE_TIER=full bash tests/smoke/run-smoke.sh",
    "test:upstream": "node --test get-shit-done/bin/gsd-tools.test.js"
  }
}
```

Note: The `files` array already covers gsd-tools.js via the `get-shit-done` entry. Upstream's test script is added as `test:upstream` to avoid overriding the fork's vitest-based `test` script.

### Resolving .gitignore (Plan 08-03)

```
# Fork has: benchmark results
# Upstream adds: reports/ and RAILROAD_ARCHITECTURE.md
# Resolution: keep both (additive, no conflicts conceptually)
```

### Post-Merge Validation (Plan 08-04)

```bash
# 1. Verify merge completeness
git log --oneline upstream/main..HEAD | head -5
# Should show upstream commits as ancestors

# 2. Ghost reference check
grep -r "gsd_memory\|gsd-memory\|projects\.json" --include="*.md" --include="*.js" .
# Should return zero hits (excluding .planning/)

# 3. Fork branding verification
grep "get-shit-done-reflect-cc" package.json
grep "REFLECT" bin/install.js
grep "get-shit-done-reflect" bin/install.js

# 4. Run fork tests
npx vitest run

# 5. Run smoke tests
SMOKE_TIER=quick bash tests/smoke/run-smoke.sh

# 6. Run upstream tests (informational)
node --test get-shit-done/bin/gsd-tools.test.js

# 7. Regenerate package-lock.json
npm install
```

## Verified Conflict Predictions

Research verified which of the 17 fork-modified files will actually conflict by checking whether BOTH sides changed the file from the common ancestor (`2347fca`).

### Files That WILL Conflict (11 files)

| File | Fork Changes | Upstream Changes | Risk | Merge Stance |
|------|-------------|------------------|------|--------------|
| `bin/install.js` | REFLECT banner, package name, help text, version-check hook | Patch persistence, JSONC, statusline fix, color validation, Windows fixes | HIGH | Hybrid merge |
| `package.json` | Fork identity, devDeps, scripts | Version bump, test script | HIGH | Hybrid merge |
| `commands/gsd/new-project.md` | Added DevOps Phase 5.7 | Thin orchestrator (1089->42 lines) | HIGH | Case-by-case |
| `commands/gsd/help.md` | Package name refs, GSD Reflect section | Thin orchestrator (481->22 lines) | MEDIUM | Case-by-case |
| `commands/gsd/update.md` | Package name refs (5 occurrences) | Thin orchestrator (172->37 lines) | MEDIUM | Case-by-case |
| `get-shit-done/references/planning-config.md` | Added knowledge_debug, knowledge_surfacing_config | gsd-tools CLI references replacing bash patterns | MEDIUM | Hybrid merge |
| `get-shit-done/templates/research.md` | Enhanced open_questions structure | Added user_constraints section | LOW | Case-by-case |
| `.gitignore` | Added benchmark results | Added reports/, RAILROAD_ARCHITECTURE.md | LOW | Combine both |
| `README.md` | Complete rewrite | Badge updates, install command updates | LOW | Fork wins |
| `CHANGELOG.md` | Fork changelog | Upstream changelog updates | LOW | Fork wins |
| `hooks/gsd-check-update.js` | Package name changed | Added `detached: true` for Windows | LOW | Fork wins |

### Files That Will NOT Conflict (6 files -- fork changed but upstream did NOT)

| File | Fork Change | Why No Conflict |
|------|-------------|-----------------|
| `get-shit-done/templates/config.json` | Added gsd_reflect_version, health_check, devops | Upstream didn't modify this file |
| `get-shit-done/templates/context.md` | Added open_questions | Upstream didn't modify this file |
| `get-shit-done/templates/project.md` | Added open_questions | Upstream didn't modify this file |
| `get-shit-done/templates/codebase/concerns.md` | Added DevOps Gaps | Upstream didn't modify this file |
| `scripts/build-hooks.js` | Added gsd-version-check.js | Upstream didn't modify this file |
| `package-lock.json` | Fork's vitest deps | Will conflict but resolved via regeneration |

### Upstream-Only New Files (36 files)

These are added by upstream and do NOT exist in the fork. They merge cleanly with no conflicts:

| Category | Count | Key Files |
|----------|-------|-----------|
| Workflows | 16 | help.md, new-project.md, update.md, add-phase.md, quick.md, plan-phase.md, etc. |
| CLI tooling | 2 | gsd-tools.js (4,597 lines), gsd-tools.test.js (2,033 lines) |
| References | 4 | decimal-phase-calculation.md, git-planning-commit.md, model-profile-resolution.md, phase-argument-parsing.md |
| Templates | 3 | summary-complex.md, summary-minimal.md, summary-standard.md |
| Commands | 1 | reapply-patches.md |
| GitHub/Community | 6 | CODEOWNERS, issue templates, auto-label, SECURITY.md |
| Assets | 2 | Logo PNG and SVG |
| Backup | 1 | new-project.md.bak (upstream's old inline version) |
| Deleted | 3 | CONTRIBUTING.md, GSD-STYLE.md, MAINTAINERS.md |

### Upstream-Modified But Fork-Unmodified Files (40+ files)

These are files upstream modified but the fork has not touched. They merge cleanly:
- 9 agent specs (gsd-executor.md, gsd-planner.md, gsd-debugger.md, etc.)
- 15+ command files (execute-phase.md, plan-phase.md, debug.md, etc.)
- 5+ workflow files (verify-phase.md, transition.md, etc.)
- Several reference files

## Upstream Changes Deep Dive

### install.js: Upstream Additions Breakdown

| Addition | Lines | Purpose | Adoption Priority |
|----------|-------|---------|-------------------|
| `crypto` require | 1 | SHA256 hashing for manifest | Required (dependency of patch system) |
| `parseJsonc()` | ~60 | Strip JSONC comments from opencode.json | Adopt (prevents data loss) |
| Patch persistence (`saveLocalPatches`, `writeManifest`, etc.) | ~130 | Detect/backup user modifications before install | Adopt (FEAT-01 dependency) |
| Statusline reference update | ~12 | Fix #330: old statusline.js -> gsd-statusline.js | Adopt (FIX-08) |
| Color validation | ~6 | Validate hex color format | Adopt (FIX-07 partial) |
| `cleanedHooks` rename | ~3 | Renamed variable for clarity | Adopt (minor) |
| Windows backslash fixes | ~3 | Normalize paths for Windows | Adopt (compatibility) |
| Improved opencode.json error handling | ~8 | Don't overwrite on parse error | Adopt (FEAT-06 related) |

### Thin Orchestrator Impact

Upstream refactored commands from inline logic to workflow delegation:

| File | Before | After | Impact on Fork |
|------|--------|-------|----------------|
| `commands/gsd/help.md` | 481 lines (full reference inline) | 22 lines (delegates to workflows/help.md) | Fork has 46-line modification with fork branding |
| `commands/gsd/new-project.md` | ~1000 lines (full process inline) | 42 lines (delegates to workflows/new-project.md) | Fork has 1089 lines with DevOps Phase 5.7 |
| `commands/gsd/update.md` | 172 lines (full update logic inline) | 37 lines (delegates to workflows/update.md) | Fork has 48-line modification with package refs |

**Phase 8 Resolution:** Keep fork's inline versions. The thin orchestrator migration happens in Phase 9 (MERGE-03, ARCH-02).

### New Upstream Dependencies Introduced

**npm dependencies:** None. Upstream added zero new npm packages.

**Node.js built-in dependencies:** `crypto` module (added to install.js for SHA256 hashing).

**New files that commands reference:** 16 workflow files in `get-shit-done/workflows/`. These are added by the merge as new files (no conflicts) but the fork's command files won't reference them until Phase 9.

## Bug Fix Verification Map

How each of the 11 upstream bug fixes lands during merge:

| Fix | Commit | Files Modified | Conflict? | Verification |
|-----|--------|---------------|-----------|--------------|
| FIX-01: Executor verification | f380275 | agents/gsd-executor.md, commands/gsd/execute-phase.md, 2 workflow files | No (upstream-only files) | Verify agent spec mentions completion verification |
| FIX-02: Context fidelity | ecbc692 | agents/gsd-phase-researcher.md, agents/gsd-planner.md, templates/research.md | research.md conflicts | Verify research.md has user_constraints section |
| FIX-03: Parallelization config | 4267c6c | workflows/execute-phase.md | No (new file) | Verify workflow checks parallelization setting |
| FIX-04: Research writes RESEARCH.md | 161aa61 | agents/gsd-phase-researcher.md | No (upstream-only) | Verify agent spec includes unconditional write |
| FIX-05: commit_docs=false | 01c9115 | agents/gsd-debugger.md, gsd-tools.js, 3 reference files | planning-config.md conflicts | Verify gsd-tools.js commit command checks setting |
| FIX-06: Auto-create config.json | 4dff989 | commands/gsd/set-profile.md, commands/gsd/settings.md | No (upstream thin versions) | Verify command handles missing config |
| FIX-07: Statusline crash | 9d7ea9c | bin/install.js, hooks/gsd-statusline.js, others | install.js conflicts | Verify color validation in resolved install.js |
| FIX-08: Statusline reference | 074b2bc | bin/install.js | install.js conflicts | Verify statusline.js -> gsd-statusline.js update code |
| FIX-09: API key prevention | f53011c | agents/gsd-codebase-mapper.md, 1 workflow | No (upstream-only) | Verify mapper agent excludes sensitive files |
| FIX-10: subagent_type | 4249506 | workflows/execute-phase.md | No (new file) | Verify workflow specifies gsd-executor |
| FIX-11: classifyHandoffIfNeeded | 4072fd2 | 3 workflow files | No (new files) | Verify workaround present in workflow files |

**Key finding:** Only 3 of 11 bug fixes touch files that will conflict (FIX-02, FIX-05, FIX-07, FIX-08 -- all in install.js or planning-config.md). The other 8 land cleanly via the merge.

## Discretion Recommendations

Areas where CONTEXT.md grants Claude discretion, with research-backed recommendations:

### Commit Strategy During Merge
**Recommendation:** The merge itself produces a single merge commit (standard git behavior). After resolving all conflicts and completing the merge commit, use additional targeted commits for any fix-up work discovered during validation. Do not attempt to split the merge into multiple commits -- git merge is atomic.

### File Resolution Order Within Each Plan
**Recommendation for Plan 08-02 (HIGH):**
1. `package.json` -- Simplest HIGH-risk file; establishes fork identity for rest of session
2. `commands/gsd/new-project.md` -- Evaluate upstream changes, make decision
3. `bin/install.js` -- Most complex; benefits from having package.json settled first

**Recommendation for Plan 08-03 (MEDIUM+LOW):**
1. Fork-wins auto-resolve first: `README.md`, `CHANGELOG.md`, `hooks/gsd-check-update.js`
2. `.gitignore` -- Trivial additive merge
3. `get-shit-done/templates/research.md` -- Small change, quick evaluation
4. `get-shit-done/references/planning-config.md` -- Moderate, gsd-tools references
5. `commands/gsd/update.md` -- Thin orchestrator decision
6. `commands/gsd/help.md` -- Thin orchestrator decision (same pattern as update.md)

### package-lock.json Regeneration Timing
**Recommendation:** Regenerate in Plan 08-04 (validation), after ALL conflict resolution is complete but before running tests. Reasoning: `npm install` needs the final package.json state, and running it prematurely (e.g., in Plan 08-02) would need re-running if package.json gets further edits.

### Pre-Flight Scope
**Recommendation:** Quick verification only. Phase 7 already validated the sync branch state. Pre-flight should:
1. Verify on `sync/v1.13-upstream` branch (or switch to it)
2. Verify `upstream` remote is reachable (`git fetch upstream`)
3. Set `git config merge.conflictstyle diff3`
4. Verify clean working tree (`git status`)
5. Skip re-running tests (Phase 7 validated those)

### Bug Fix Verification Depth
**Recommendation:** Spot-check level. Most fixes land cleanly via merge (8 of 11). For the 3 that touch conflicting files:
- FIX-07/FIX-08 in install.js: Verify during install.js hybrid merge by checking the specific code blocks exist
- FIX-02/FIX-05 in planning-config.md: Verify the gsd-tools references are present after merge

For the other 8, file presence in the merged tree is sufficient verification. Detailed functional verification belongs to Phase 10-11.

### FORK-DIVERGENCES.md Update Timing
**Recommendation:** Plan 08-04. After the merge is complete, the divergence manifest is out of date (some files may no longer be modified, new divergences may exist). Update it as part of validation.

### Sync Branch to Main Merge Timing
**Recommendation:** Only after Plan 08-04 passes ALL blocking criteria (vitest green, smoke tests green, ghost check clean, branding verified). Do NOT merge to main with any failing tests. Recommend as final step of Phase 8 or first step of Phase 9.

### Merge Decision Log Population
**Recommendation:** Populate after each file is resolved (per-file), not in a batch. This ensures the rationale is fresh and accurate. Write entries to FORK-STRATEGY.md's Merge Decision Log table.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline command logic | Thin orchestrator + workflow files | Upstream v1.12.0-v1.14.0 | Commands shrunk 90%; logic moved to workflows |
| Manual bash patterns | gsd-tools.js CLI | Upstream v1.12.0 | Centralized config parsing, commits, state management |
| No patch preservation | Manifest + backup + reapply-patches | Upstream v1.16.0 | Users can preserve modifications across updates |
| JSON-only config parsing | JSONC support in installer | Upstream v1.16.0 | OpenCode users with commented configs no longer lose data |

## Open Questions

1. **Will all 11 predicted conflicts actually materialize?**
   - What we know: Analysis of both-sides-changed files predicts 11 conflicts
   - What's unclear: Git's merge algorithm may auto-resolve some if changes are in non-overlapping regions
   - Recommendation: The actual `git merge` in Plan 08-01 resolves this definitively

2. **How will the fork's inline command versions handle upstream's new workflow references?**
   - What we know: The fork keeps inline commands (Phase 8). Upstream's workflow files are added as new files.
   - What's unclear: Whether any fork-retained inline command references `@~/.claude/get-shit-done/workflows/` paths that will now exist but contain upstream (not fork) content
   - Recommendation: Check during resolution; if so, ensure inline version doesn't accidentally delegate to upstream workflow

3. **Will upstream's gsd-tools.test.js tests pass without Phase 9 configuration?**
   - What we know: gsd-tools.js is a standalone CLI tool with its own test file. It uses Node.js built-in test runner.
   - What's unclear: Whether tests require a .planning/ directory or fork-specific config
   - Recommendation: Run in Plan 08-04 as informational; failures documented but don't block

4. **Sync branch is 3 commits behind main**
   - What we know: main has 3 docs-only commits (Phase 8 context/planning) not on sync branch
   - What's unclear: Whether to update sync branch from main before merge
   - Recommendation: These are .planning/ docs that won't conflict. Either (a) merge main into sync first, or (b) proceed and handle after. Option (a) is cleaner.

## Sources

### Primary (HIGH confidence)
- Direct git analysis of fork repository (`git diff`, `git log`, `git show`)
- Fork files: `bin/install.js`, `package.json`, `commands/gsd/new-project.md`
- Upstream files: `upstream/main:bin/install.js`, `upstream/main:package.json`, etc.
- Planning artifacts: `FORK-DIVERGENCES.md`, `FORK-STRATEGY.md`, `STATE.md`, `ROADMAP.md`

### Secondary (MEDIUM confidence)
- Upstream commit messages for bug fix intent
- Upstream CHANGELOG entries for feature descriptions

### Tertiary (LOW confidence)
- None -- all findings verified against actual codebase

## Metadata

**Confidence breakdown:**
- Conflict predictions: HIGH -- verified by actual git diff analysis of both sides
- install.js merge strategy: HIGH -- line-by-line comparison of both versions
- Bug fix landing analysis: HIGH -- verified which files each commit touches
- Thin orchestrator impact: HIGH -- verified file sizes and content on both sides
- Discretion recommendations: MEDIUM -- based on analysis but judgment calls

**Research date:** 2026-02-10
**Valid until:** Until the merge is executed (findings are snapshot-in-time of current branch states)
