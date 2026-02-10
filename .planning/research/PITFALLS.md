# Domain Pitfalls: Upstream Fork Sync

**Domain:** Syncing a divergent fork (GSD Reflect) with upstream GSD (70 commits, v1.11.2 to v1.18.0)
**Researched:** 2026-02-09
**Overall confidence:** HIGH (grounded in actual git diff analysis of this codebase, not generic advice)

---

## Critical Pitfalls

Mistakes that cause data loss, broken releases, or multi-day recovery efforts.

### Pitfall 1: The install.js Three-Way Merge Trap

**What goes wrong:** `bin/install.js` has been modified by three independent change streams that all touch the same file:
1. **Our fork:** Branding changes (banner text, package name `get-shit-done-reflect-cc`, help text)
2. **Upstream memory add/revert:** af7a057 added MCP server registration, cc3c6ac reverted it -- but the revert also touched `install.js` (137 lines removed)
3. **Upstream post-revert changes:** Local patch preservation (ca03a06, +145 lines), `--include` flag, JSONC parser (+61 lines), hex color validation fix, statusline path fix, `gsd-file-manifest.json` writing

A naive `git merge upstream/main` will produce a conflict in `install.js` where the merge resolution must correctly keep our branding, adopt upstream's patch-preservation and JSONC parser, and NOT reintroduce the memory system code that was added then reverted.

**Why it happens:** Git's three-way merge sees the memory add and revert as a net-zero change from the fork point, but our fork diverged between those commits. The install.js diff from our fork point to upstream HEAD is 338 lines of changes across multiple functional areas mixed together.

**Warning signs:**
- `git merge upstream/main` produces a conflict marker spanning 100+ lines in install.js
- After resolving, the install script crashes with "crypto is not defined" (upstream added `const crypto = require('crypto')` for manifest hashing)
- After resolving, the banner still says "Get Shit Done" instead of "GSD Reflect"
- After resolving, `npx get-shit-done-reflect-cc --help` shows upstream's package name

**Prevention:**
- Merge install.js manually in a dedicated step, NOT as part of a bulk merge
- Use the semantic approach: read both versions, understand each functional section, reconstruct by hand
- Test the merged install.js in isolation: `HOME=$(mktemp -d) node bin/install.js --claude 2>&1` -- verify banner, package name, directory creation, manifest writing
- Specifically verify: (1) branding preserved, (2) crypto require present, (3) patch preservation functions present, (4) JSONC parser present, (5) NO gsd-memory references

**Severity:** HIGH -- install.js is the user-facing entry point. A broken installer means nobody can install the fork.

**Which phase should address it:** Must be the FIRST file resolved in the merge phase. Other files depend on install.js working correctly.

---

### Pitfall 2: The Thin Orchestrator Architecture Mismatch

**What goes wrong:** Upstream refactored ALL commands from fat self-contained specs to thin orchestrators that delegate to workflow files via `@~/.claude/get-shit-done/workflows/` references. This is the single largest architectural change (commit d44c7dc: 22,000+ tokens reduced across 15 commands, 22 workflows, 14 agents). Our fork's `commands/gsd/new-project.md` is still the fat version with 481 lines of inline logic PLUS our DevOps detection addition (+79 lines). Upstream's `new-project.md` is now 44 lines that just reference `workflows/new-project.md`.

If we merge upstream's thin `new-project.md` on top of our fat version, we lose our DevOps detection feature. If we keep our fat version, we're incompatible with the new gsd-tools CLI and all the workflow improvements upstream has made.

**Why it happens:** Our fork's "additive only" rule assumed upstream's file structure would remain stable. Instead, upstream moved the logic from `commands/` to `get-shit-done/workflows/`, fundamentally changing where code lives.

**Consequences:**
- Commands reference workflow files that don't exist (if we take upstream commands but miss workflow files)
- Commands that call `gsd-tools.js init` fail because gsd-tools doesn't exist in our installation
- Our DevOps detection feature silently disappears
- Agent specs become incompatible with workflow specs (agents are 50-70% smaller upstream)

**Warning signs:**
- After merge, any `/gsd:` command fails with "workflow file not found"
- Agent specs still reference old inline patterns while commands reference new workflow patterns
- gsd-tools.js is present but not in the npm `files` array
- Commands work but produce different output than expected (using old logic path)

**Prevention:**
- Adopt the thin orchestrator architecture wholesale -- this is not optional, it's the new foundation
- Port our DevOps detection from `commands/gsd/new-project.md` into `get-shit-done/workflows/new-project.md` as an additional section
- Verify every command/workflow/agent triple is internally consistent after merge
- Run the wiring validation test (`tests/integration/wiring-validation.test.js`) after merge -- this test was specifically built to catch broken references

**Severity:** HIGH -- architectural mismatch means nothing works, not just one feature.

**Which phase should address it:** Core merge phase, immediately after install.js. The architectural adoption must happen before porting any features.

---

### Pitfall 3: The Agent Spec Dual-Location Problem

**What goes wrong:** Our fork has agent specs in TWO locations:
- `agents/gsd-executor.md` (784 lines, upstream-compatible path, installed by installer)
- `.claude/agents/gsd-executor.md` (also 784 lines, local project path, only differs by 2 lines: `~/.claude/` to `./.claude/` path references)

Upstream's `agents/gsd-executor.md` is now 403 lines (48% smaller). It was rewritten to work with the thin orchestrator pattern, removing inline logic that moved to workflow files. Our fork's version at both locations is the OLD fat version plus our minor path modifications.

During merge, we need to update BOTH locations, but the `.claude/agents/` copies contain our fork's custom agents (reflector, signal-collector, spike-runner, knowledge-store) that upstream doesn't have. A careless merge might:
- Overwrite our custom agents in `.claude/agents/`
- Leave stale fat agent specs that reference patterns gsd-tools has replaced
- Create inconsistency between the two locations

**Warning signs:**
- Agents call `cat .planning/config.json | node -e "..."` instead of `node gsd-tools.js state load` (old pattern)
- Agents have inline bash for operations that gsd-tools now handles
- `.claude/agents/` has different versions than `agents/`
- Our custom agents (reflector, signal-collector) reference patterns that no longer exist in the updated upstream agents

**Prevention:**
- Update `agents/` to match upstream's new versions FIRST
- Then update `.claude/agents/` copies of upstream agents to match
- Leave our fork-unique agents (reflector, signal-collector, spike-runner, knowledge-store) untouched for now
- Verify our fork-unique agents don't reference upstream patterns that changed (they currently reference checkpoint.md which was rewritten)
- Add a test that verifies `agents/` and `.claude/agents/` are in sync for shared files

**Severity:** HIGH -- inconsistent agent specs cause silent failures where agents execute with wrong instructions.

**Which phase should address it:** Must be addressed in the same phase as the thin orchestrator adoption, since agent changes are coupled to the workflow changes.

---

### Pitfall 4: package.json Identity Collision

**What goes wrong:** Our fork's `package.json` has extensive identity changes:
- `name`: `get-shit-done-reflect-cc` (vs upstream's `get-shit-done-cc`)
- `version`: `1.12.2` (vs upstream's `1.18.0`)
- `description`: fork-specific
- `bin`: `get-shit-done-reflect-cc` (vs `get-shit-done-cc`)
- `keywords`: additional fork-specific keywords
- `repository`, `bugs`, `homepage`: point to our fork's GitHub repo
- `devDependencies`: we added vitest and @vitest/coverage-v8

Upstream's `package.json` at v1.18.0 has version `1.18.0` and may have added new fields, changed the `files` array (to include `get-shit-done/bin/gsd-tools.js`), or updated dependencies.

A git merge will conflict on nearly every field. The resolution must keep our identity but adopt upstream's structural changes (files array, any new dependencies, scripts).

**Warning signs:**
- After merge, `npm publish` publishes to the wrong package name
- `gsd-tools.js` not included in published package (missing from `files` array)
- Version number is wrong (either our old version or upstream's version)
- `npm test` fails because test scripts changed

**Prevention:**
- Resolve package.json entirely by hand, never accept either side wholesale
- Checklist for package.json resolution:
  1. Keep our `name`, `bin`, `description`, `repository`, `bugs`, `homepage`
  2. Adopt upstream's `files` array additions (especially `get-shit-done/bin/`)
  3. Keep our `devDependencies` (vitest), adopt any new upstream deps
  4. Set version to our next version (e.g., `1.13.0`), NOT upstream's version
  5. Keep our `keywords` superset
- After resolution, run `npm pack --dry-run` to verify the correct files are included
- Run `npm publish --dry-run` to verify package identity

**Severity:** HIGH -- wrong package identity means publishing to wrong npm package or breaking installs.

**Which phase should address it:** Early in merge phase, since other changes (gsd-tools) depend on the files array being correct.

---

### Pitfall 5: The Memory System Ghost

**What goes wrong:** Upstream added a full `gsd-memory/` directory (af7a057) then reverted it (cc3c6ac). Our fork was created AFTER the fork point (2347fca) which is before both the add and the revert. During merge, git's three-way merge sees:
- Base (2347fca): no gsd-memory/
- Ours (main): no gsd-memory/
- Theirs (upstream/main): no gsd-memory/ (added then reverted)

This should merge cleanly for the directory itself. But the REAL danger is in the files the memory system MODIFIED:
- `agents/gsd-phase-researcher.md` -- memory system added 38 lines of "query memory before Context7" instructions
- `agents/gsd-project-researcher.md` -- same 38-line addition
- `commands/gsd/new-project.md` -- added 20 lines of "register project with memory"
- `get-shit-done/workflows/complete-milestone.md` -- added 26 lines of "index milestone completion"
- `get-shit-done/workflows/execute-phase.md` -- added 16 lines of "index after execution"

The revert removed these additions, BUT then the thin orchestrator refactoring also rewrote these same files. The merge must handle the combined effect: memory add + memory revert + thin orchestrator rewrite.

**Warning signs:**
- After merge, agent specs contain references to `gsd_memory_search` or `gsd_memory_register`
- Workflow files mention "index with memory" operations
- install.js tries to configure MCP server for gsd-memory
- References to `~/.gsd/projects.json` (memory's project registry)

**Prevention:**
- After merge, grep for `memory`, `gsd_memory`, `gsd-memory`, `projects.json` across the entire codebase
- The result should be ZERO hits (except in our own knowledge base system which uses different naming)
- Pay special attention to the five files listed above during conflict resolution
- Our fork has its OWN knowledge system (`.claude/agents/knowledge-store.md`, `gsd-knowledge/`) which is architecturally different from upstream's reverted memory system -- do not confuse the two

**Severity:** HIGH -- ghost references to a removed system cause runtime errors.

**Which phase should address it:** Part of the core merge phase, specifically during conflict resolution of agent and workflow files.

---

## Moderate Pitfalls

Mistakes that cause delays, broken features, or technical debt.

### Pitfall 6: CI/CD Workflow Collision

**What goes wrong:** Our fork has three GitHub Actions workflows:
- `.github/workflows/ci.yml` -- runs tests on push/PR
- `.github/workflows/publish.yml` -- OIDC npm Trusted Publishing on release
- `.github/workflows/smoke-test.yml` -- install verification

Upstream added three NEW GitHub files:
- `.github/CODEOWNERS` -- requires @glittercowboy review (not our maintainer)
- `.github/ISSUE_TEMPLATE/bug_report.yml` -- references upstream's package name
- `.github/ISSUE_TEMPLATE/feature_request.yml` -- generic
- `.github/workflows/auto-label-issues.yml` -- auto-labels issues

Risks:
1. CODEOWNERS with `@glittercowboy` will block our PRs if we adopt it
2. Issue templates reference `get-shit-done-cc` package name
3. Auto-label workflow may conflict with our own issue management
4. Our OIDC publishing workflow is specifically configured for our npm package -- any interference breaks publishing

**Warning signs:**
- PRs blocked waiting for @glittercowboy review
- Issue templates show wrong package name
- npm publish fails because OIDC identity doesn't match

**Prevention:**
- Do NOT adopt `.github/CODEOWNERS` -- skip or replace with our own maintainer
- Update issue template to reference our package name if adopting
- Keep our three workflows untouched; they are entirely fork-specific
- Upstream's auto-label workflow is harmless to adopt but unnecessary
- After merge, run: `gh workflow list` to verify no duplicate or broken workflows

**Severity:** MEDIUM -- broken CI doesn't break the code but blocks releases.

**Which phase should address it:** Post-merge validation phase. CI/CD can be fixed after code merge is stable.

---

### Pitfall 7: The gsd-tools.js Adoption Gap

**What goes wrong:** Upstream's `get-shit-done/bin/gsd-tools.js` is a 1400+ line CLI utility that replaces inline bash patterns across 50+ files. It handles: config parsing, model resolution, phase lookup, git commits, summary verification, frontmatter CRUD, scaffolding, and more. Our fork has NONE of this.

After merge, commands and workflows will call `node ~/.claude/get-shit-done/bin/gsd-tools.js <command>` but:
1. gsd-tools.js may not be in the right location after installation
2. Our fork's installer may not copy it correctly
3. Commands that reference gsd-tools patterns we haven't tested will fail silently
4. gsd-tools has its own test suite (`gsd-tools.test.js`, using node:test) that runs separately from our vitest suite

**Warning signs:**
- Commands fail with "gsd-tools.js not found" or "ENOENT"
- Commands produce empty/undefined output where they should produce JSON
- `gsd-tools.js state load` fails because `.planning/config.json` has fork-specific fields it doesn't expect
- Test suite passes but gsd-tools tests were never run

**Prevention:**
- Verify gsd-tools.js is included in `package.json` `files` array
- Verify installer copies gsd-tools.js to the correct location
- Run gsd-tools.js test suite separately: `node --test get-shit-done/bin/gsd-tools.test.js`
- Test critical gsd-tools commands against our fork's `.planning/config.json`:
  - `state load` -- does it handle our `health_check` and `devops` config sections?
  - `resolve-model` -- does it work with our `model_profile: "quality"` setting?
  - `progress` -- does it render correctly with our project state?
- Add gsd-tools test run to our CI workflow

**Severity:** MEDIUM -- gsd-tools is now load-bearing for all workflows. Failure here means workflows break.

**Which phase should address it:** Must be validated immediately after the core merge, before testing any workflows.

---

### Pitfall 8: Test Suite Fragility During Merge

**What goes wrong:** Our fork has 42 tests across 5 test files:
- `tests/e2e/real-agent.test.js` (183 lines)
- `tests/integration/kb-infrastructure.test.js` (336 lines)
- `tests/integration/kb-write.test.js` (216 lines)
- `tests/integration/wiring-validation.test.js` (314 lines)
- `tests/unit/install.test.js` (129 lines)

The wiring validation test checks that agent specs, command files, and workflow files are internally consistent. After the thin orchestrator refactoring, this test will likely FAIL because:
- It expects command files to contain inline logic (old pattern)
- It may not know about new workflow files
- It may flag upstream's new agent names/paths as "unwired"

The KB tests reference knowledge store structures that are unchanged by the merge but may need path updates.

The install test checks the installer output, which will change with upstream's new features.

**Warning signs:**
- `npm test` fails immediately after merge with 20+ test failures
- Wiring validation reports "orphaned agent" or "missing workflow" for upstream's new files
- Install test fails because banner text or directory structure changed

**Prevention:**
- Accept that tests WILL break during merge -- this is expected, not a sign of bad merge
- Fix tests in a specific order:
  1. `install.test.js` first (installer is the foundation)
  2. `wiring-validation.test.js` second (validates structural integrity)
  3. KB tests last (least likely to be affected)
- Update wiring validation test to recognize the thin orchestrator pattern (commands reference workflows, not inline logic)
- Add upstream's `gsd-tools.test.js` to the test suite runner
- Do NOT skip failing tests to "fix later" -- they are the primary merge correctness signal

**Severity:** MEDIUM -- tests are the safety net. If we ignore them during merge, we ship broken code.

**Which phase should address it:** Dedicated test-fixing phase after the core merge, before any feature porting.

---

### Pitfall 9: Version Number Confusion

**What goes wrong:** Our fork is at v1.12.2. Upstream is at v1.18.0. After merge, what version are we?

If we keep v1.12.2, users don't know we incorporated upstream changes. If we jump to v1.18.0, our version number collides with upstream's and implies parity we don't have. If we use v1.13.0, it's unclear how much has changed.

**Warning signs:**
- `gsd-check-update.js` compares versions against the wrong npm package
- Users on v1.12.2 don't get prompted to update
- CHANGELOG.md doesn't reflect what changed
- npm version sort puts our package in the wrong position relative to upstream

**Prevention:**
- Use semantic versioning based on OUR fork's history, not upstream's:
  - v1.13.0: if the merge is a clean adoption of upstream + our existing features
  - v2.0.0: if the merge involves breaking changes to our fork's public API
- Document in CHANGELOG.md: "Synced with upstream GSD v1.18.0" with a summary of what we adopted
- Update `gsd-check-update.js` to check our npm package (`get-shit-done-reflect-cc`), not upstream's -- this is already done but verify after merge
- Set `gsd_reflect_version` in `.planning/config.json` to match

**Severity:** MEDIUM -- version confusion causes user confusion and broken update detection.

**Which phase should address it:** Final phase, after all code changes are validated and tests pass.

---

### Pitfall 10: The "Additive Only" Constraint Is Dead

**What goes wrong:** The fork was built on the assumption that we only ADD files, never modify upstream files. This assumption was already violated (12 files modified on both sides) and is now untenable because upstream's architecture moved code from the files we were trying to not modify.

If we try to maintain "additive only" during the merge, we will:
- Refuse to adopt the thin orchestrator pattern (our commands stay fat, upstream's workflow improvements are inaccessible)
- Have two parallel architectures in one codebase (fat commands + thin workflows for any new upstream commands we adopt)
- Be unable to sync again in the future because the divergence compounds

**Warning signs:**
- Team debates "should we really modify this upstream file?" on every conflict
- Merge produces a hybrid codebase where some commands are thin and some are fat
- Future upstream syncs become harder, not easier
- Development velocity drops because every change requires checking "is this additive?"

**Prevention:**
- Formally retire the "additive only" constraint and replace it with a new strategy:
  - **Upstream-tracked files:** We modify them, but track our modifications explicitly. Use upstream's new `gsd-file-manifest.json` and `reapply-patches` command to manage this.
  - **Fork-unique files:** Our agents, knowledge base, CI/CD, etc. remain ours.
  - **Sync contract:** We sync with upstream at each upstream minor version, accepting their architectural changes and porting our features onto their new structure.
- Document which files we intentionally diverge from upstream and WHY
- Upstream's own `reapply-patches` feature (ca03a06) was literally built for this use case -- leverage it

**Severity:** MEDIUM -- clinging to "additive only" makes the merge harder and future syncs impossible.

**Which phase should address it:** Must be decided BEFORE the merge begins. This is a strategic decision, not a merge decision.

---

## Minor Pitfalls

Mistakes that cause friction but are recoverable within hours.

### Pitfall 11: Hook Changes Clobbering Our Fork's Customization

**What goes wrong:** Upstream made two changes to hook files:
- `hooks/gsd-check-update.js`: added `detached: true` for Windows process detachment
- `hooks/gsd-statusline.js`: added try-catch around file system operations for crash resilience

Our fork modified `gsd-check-update.js` to check our npm package name instead of upstream's. A merge must keep our package name change AND adopt upstream's Windows fix.

**Prevention:**
- These are simple, non-overlapping changes. A three-way merge should handle them automatically.
- Verify after merge: `grep 'get-shit-done-reflect-cc' hooks/gsd-check-update.js` returns a match
- Verify after merge: `grep 'detached: true' hooks/gsd-check-update.js` returns a match

**Severity:** LOW -- hooks are small files with clear, non-overlapping changes.

---

### Pitfall 12: Upstream's Deleted Files Creating Confusion

**What goes wrong:** Upstream deleted three files:
- `CONTRIBUTING.md`
- `GSD-STYLE.md`
- `MAINTAINERS.md`

Our fork never modified these files, so the merge should delete them cleanly. But if anyone on our team added content to these files locally (or if they're referenced from our README), the deletion creates broken links.

**Prevention:**
- Verify our README.md and other docs don't link to these files
- Accept the deletions -- they're upstream's decision and don't affect our fork's functionality
- If we want contributing guidelines, create our own `CONTRIBUTING.md` with fork-specific content

**Severity:** LOW -- file deletions are harmless unless something references them.

---

### Pitfall 13: The Brave Search Integration Contamination

**What goes wrong:** Upstream added Brave Search integration for researchers (commit 60ccba9). This modifies researcher agent specs to include web search capabilities via Brave API. Our fork's researcher agents (in `.claude/agents/`) may or may not want this feature. If we adopt it without configuration, agents will try to call Brave Search API and fail if no API key is configured.

**Prevention:**
- Review the Brave Search additions in `agents/gsd-phase-researcher.md` and `agents/gsd-project-researcher.md`
- If we want the feature, ensure our config supports the Brave Search API key
- If we don't want it, ensure our fork's researcher agents explicitly skip the Brave Search path
- The feature should be gated on configuration, not always-on

**Severity:** LOW -- Brave Search integration gracefully degrades if no API key is present.

---

## Phase-Specific Warnings

| Phase/Step | Likely Pitfall | Mitigation | Severity |
|------------|---------------|------------|----------|
| Pre-merge strategy decision | P10: Additive-only constraint is dead | Formally retire it, adopt new sync strategy | MEDIUM |
| install.js merge | P1: Three-way merge trap | Manual semantic merge, test in isolation | HIGH |
| Architecture adoption | P2: Thin orchestrator mismatch | Adopt wholesale, port features onto new structure | HIGH |
| Agent spec merge | P3: Dual-location problem | Update both locations, protect custom agents | HIGH |
| Agent/workflow merge | P5: Memory system ghost | Grep for memory references, verify zero hits | HIGH |
| package.json merge | P4: Identity collision | Hand-resolve, verify with npm pack --dry-run | HIGH |
| gsd-tools adoption | P7: Adoption gap | Verify installation path, run gsd-tools tests | MEDIUM |
| CI/CD merge | P6: Workflow collision | Skip CODEOWNERS, update templates, keep our workflows | MEDIUM |
| Test fixing | P8: Test suite fragility | Fix in order: install -> wiring -> KB | MEDIUM |
| Version/release | P9: Version confusion | Use our semver, document upstream sync in CHANGELOG | MEDIUM |
| Hook merge | P11: Hook customization | Verify both our changes and upstream's are present | LOW |
| File cleanup | P12: Deleted files | Accept deletions, check for broken references | LOW |
| Feature adoption | P13: Brave Search | Gate on configuration, verify graceful degradation | LOW |

## Merge Strategy Recommendation

Based on this pitfall analysis, the safest merge approach is NOT a single `git merge upstream/main`. Instead:

**Recommended approach: Staged semantic merge**

1. **Create a sync branch** from `main`
2. **Cherry-pick upstream structural changes first** (gsd-tools.js, workflow files) -- these are pure additions with no conflicts
3. **Manually merge the 12 conflict files** one at a time, in dependency order:
   - `package.json` (identity foundation)
   - `bin/install.js` (installation foundation)
   - `commands/gsd/new-project.md` and other commands (adopt thin orchestrators)
   - Agent specs (adopt thin patterns)
   - Hooks (simple non-overlapping changes)
   - `CHANGELOG.md`, `README.md` (documentation, keep ours)
4. **Port fork features** onto the new architecture (DevOps detection into workflow, etc.)
5. **Fix tests** in order
6. **Validate CI/CD** in a test release
7. **Publish**

**Why NOT a single `git merge`:** With 70 upstream commits, 88 changed files, and 12 conflicts, a single merge produces an overwhelming conflict resolution session. Missing one detail in one file (e.g., a memory ghost in an agent spec) creates subtle runtime bugs. The staged approach ensures each change is understood and verified.

**Alternative considered: `git merge --no-commit upstream/main`** -- this would stage all non-conflicting changes and leave conflicts for manual resolution. This is faster but riskier because you can't verify intermediate states. Only use this if the team has high git merge experience and a comprehensive test suite to catch issues.

## Sources

- Direct git analysis of this repository (primary source for all codebase-specific findings)
- [Best Practices for Keeping a Forked Repository Up to Date (GitHub Community)](https://github.com/orgs/community/discussions/153608)
- [Stop Forking Around: Hidden Dangers of Fork Drift (Preset)](https://preset.io/blog/stop-forking-around-the-hidden-dangers-of-fork-drift-in-open-source-adoption/)
- [Friend Zone: Strategies for Friendly Fork Management (GitHub Blog)](https://github.blog/developer-skills/github/friend-zone-strategies-friendly-fork-management/)
- [Git Merge Strategy Options (Atlassian)](https://www.atlassian.com/git/tutorials/using-branches/merge-strategy)
- [Git Tricks for Maintaining a Long-Lived Fork (die-antwort.eu)](https://die-antwort.eu/techblog/2016-08-git-tricks-for-maintaining-a-long-lived-fork/)
- [Lessons Learned from Maintaining a Fork (DEV Community)](https://dev.to/bengreenberg/lessons-learned-from-maintaining-a-fork-48i8)
- [npm Trusted Publishing with OIDC (GitHub Changelog)](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/)
- [Soft Fork Strategy Handbook (Open Energy Transition)](https://open-energy-transition.github.io/handbook/docs/Engineering/SoftForkStrategy/)

---

*Pitfalls research for upstream sync: 2026-02-09*
