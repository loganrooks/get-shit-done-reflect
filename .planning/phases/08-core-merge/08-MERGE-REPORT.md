# Phase 8: Upstream Merge Report

**Date:** 2026-02-10
**Branch:** sync/v1.13-upstream
**Merge commit:** f97291a
**Upstream range:** v1.11.2 to v1.18.0 (commits 8d2651d through b85247a)
**Total upstream commits merged:** 70
**Merge type:** Traditional merge (not rebase)

## 1. Conflict Resolution Summary

8 files conflicted out of 99 total files in the merge (91 auto-merged cleanly).

| File | Predicted Risk | Resolution Strategy | Key Decisions | Resolving Plan |
|------|---------------|---------------------|---------------|----------------|
| `package.json` | HIGH | Hybrid merge | Fork identity (name, repo, description, bin) sacred; upstream files[], esbuild devDep, test:upstream script adopted | 08-02 |
| `commands/gsd/new-project.md` | HIGH | Adopt upstream thin stub | Upstream 42-line stub accepted; fork DevOps Context (Step 5.7) ported to workflows/new-project.md | 08-02 |
| `commands/gsd/help.md` | MEDIUM | Adopt upstream thin stub | Upstream 22-line stub accepted; GSD Reflect section (6 commands) added to workflows/help.md | 08-02 |
| `commands/gsd/update.md` | MEDIUM | Adopt upstream thin stub | Upstream 37-line stub accepted; fork branding updated in workflows/update.md | 08-02 |
| `.gitignore` | LOW | Combine both sides | Fork benchmark results + upstream reports/ and RAILROAD_ARCHITECTURE.md | 08-03 |
| `README.md` | LOW (fork-wins) | Fork wins | Fork's complete README preserved; upstream changes discarded | 08-03 |
| `CHANGELOG.md` | LOW (fork-wins) | Fork wins | Fork's changelog preserved; content updates deferred to Phase 12 | 08-03 |
| `package-lock.json` | N/A (regenerate) | Accept ours + regenerate | Conflict cleared via --ours; npm install regenerated in 08-04 | 08-03 + 08-04 |

### Prediction Accuracy

Research predicted 11 conflicts; git produced 8. Three predicted conflicts auto-resolved because fork and upstream changes were in non-overlapping regions:

| File | Predicted Risk | Why Auto-Resolved |
|------|---------------|-------------------|
| `bin/install.js` | HIGH | Fork branding and upstream additions (patch persistence, JSONC, bug fixes) in different code regions |
| `get-shit-done/references/planning-config.md` | MEDIUM | Fork knowledge config and upstream gsd-tools references in different sections |
| `get-shit-done/templates/research.md` | LOW | Fork open_questions and upstream user_constraints in different areas |

Additionally, `hooks/gsd-check-update.js` (predicted LOW, fork-wins) auto-resolved: fork's package name change and upstream's `detached: true` in different locations.

## 2. New Upstream Additions (by Category)

### CLI Tooling (2 files)
| File | Lines | Purpose |
|------|-------|---------|
| `get-shit-done/bin/gsd-tools.js` | ~4,597 | Centralized CLI tool: commits, state, config parsing, phase management |
| `get-shit-done/bin/gsd-tools.test.js` | ~2,033 | Node.js built-in test runner tests (75 tests) |

### Workflow Files (16 new files)
Commands now delegate to workflow files via "thin orchestrator" pattern:

| File | Corresponding Command |
|------|-----------------------|
| `get-shit-done/workflows/help.md` | commands/gsd/help.md |
| `get-shit-done/workflows/new-project.md` | commands/gsd/new-project.md |
| `get-shit-done/workflows/update.md` | commands/gsd/update.md |
| `get-shit-done/workflows/add-phase.md` | commands/gsd/add-phase.md |
| `get-shit-done/workflows/add-todo.md` | commands/gsd/add-todo.md |
| `get-shit-done/workflows/audit-milestone.md` | commands/gsd/audit-milestone.md |
| `get-shit-done/workflows/check-todos.md` | commands/gsd/check-todos.md |
| `get-shit-done/workflows/insert-phase.md` | commands/gsd/insert-phase.md |
| `get-shit-done/workflows/new-milestone.md` | commands/gsd/new-milestone.md |
| `get-shit-done/workflows/pause-work.md` | commands/gsd/pause-work.md |
| `get-shit-done/workflows/plan-milestone-gaps.md` | commands/gsd/plan-milestone-gaps.md |
| `get-shit-done/workflows/plan-phase.md` | commands/gsd/plan-phase.md |
| `get-shit-done/workflows/progress.md` | commands/gsd/progress.md |
| `get-shit-done/workflows/quick.md` | commands/gsd/quick.md |
| `get-shit-done/workflows/remove-phase.md` | commands/gsd/remove-phase.md |
| `get-shit-done/workflows/research-phase.md` | commands/gsd/research-phase.md |
| `get-shit-done/workflows/set-profile.md` | commands/gsd/set-profile.md |
| `get-shit-done/workflows/settings.md` | commands/gsd/settings.md |

### New Commands (1 file)
| File | Purpose |
|------|---------|
| `commands/gsd/reapply-patches.md` | LLM-guided restoration of user patches after update |

### New References (4 files)
| File | Purpose |
|------|---------|
| `get-shit-done/references/decimal-phase-calculation.md` | Decimal phase numbering rules |
| `get-shit-done/references/git-planning-commit.md` | Git commit protocol for planning docs |
| `get-shit-done/references/model-profile-resolution.md` | Model profile resolution logic |
| `get-shit-done/references/phase-argument-parsing.md` | Phase argument parsing rules |

### New Templates (3 files)
| File | Purpose |
|------|---------|
| `get-shit-done/templates/summary-complex.md` | Complex summary template |
| `get-shit-done/templates/summary-minimal.md` | Minimal summary template |
| `get-shit-done/templates/summary-standard.md` | Standard summary template |

### GitHub / Community (6 files)
| File | Purpose |
|------|---------|
| `.github/CODEOWNERS` | Review requirements |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Bug report template |
| `.github/ISSUE_TEMPLATE/feature_request.yml` | Feature request template |
| `.github/workflows/auto-label-issues.yml` | Auto-label new issues |
| `SECURITY.md` | Security disclosure policy |
| `commands/gsd/new-project.md.bak` | Upstream's old inline version backup |

### Assets (2 files)
| File | Purpose |
|------|---------|
| `assets/gsd-logo-2000-transparent.png` | GSD logo (PNG) |
| `assets/gsd-logo-2000-transparent.svg` | GSD logo (SVG) |

### Deleted by Upstream (3 files)
| File | Reason |
|------|--------|
| `CONTRIBUTING.md` | Consolidated elsewhere |
| `GSD-STYLE.md` | Consolidated elsewhere |
| `MAINTAINERS.md` | Consolidated elsewhere |

### Modified by Upstream (auto-merged, 44 files)
Major categories of upstream modifications that merged cleanly:
- **9 agent specs** (gsd-executor.md, gsd-planner.md, gsd-debugger.md, gsd-verifier.md, etc.)
- **15+ command files** (execute-phase.md, plan-phase.md, debug.md, etc.)
- **5+ workflow files** (verify-phase.md, transition.md, execute-plan.md, etc.)
- **References and templates** (checkpoints.md, git-integration.md, etc.)
- **Hooks** (gsd-statusline.js, gsd-check-update.js)

## 3. Bug Fix Status

All 11 upstream bug fixes from the research phase were tracked through the merge:

| Fix ID | Description | Landed Cleanly | Verification |
|--------|-------------|---------------|--------------|
| FIX-01 | Executor completion verification | Yes (upstream-only files) | agents/gsd-executor.md and workflows/execute-phase.md present |
| FIX-02 | Context fidelity (user_constraints) | Yes (auto-merged) | `user_constraints` section present in research.md (lines 18, 39) |
| FIX-03 | Parallelization config respect | Yes (new workflow file) | workflows/execute-phase.md present |
| FIX-04 | Research writes RESEARCH.md | Yes (upstream-only) | Agent spec updated |
| FIX-05 | commit_docs=false support | Yes (auto-merged) | gsd-tools.js present with commit command; planning-config.md auto-merged |
| FIX-06 | Auto-create config.json | Yes (upstream thin versions) | Commands updated |
| FIX-07 | Statusline crash + color validation | Yes (install.js auto-merged) | `cleanedHooks` variable and statusline update code present in install.js |
| FIX-08 | Statusline reference update | Yes (install.js auto-merged) | statusline.js to gsd-statusline.js migration code present |
| FIX-09 | API key prevention in mapper | Yes (upstream-only) | Agent spec updated |
| FIX-10 | subagent_type specification | Yes (new workflow file) | workflows/execute-phase.md present |
| FIX-11 | classifyHandoffIfNeeded workaround | Yes (new workflow files) | Workflow files present |

All 11 fixes landed successfully. Zero required manual intervention during conflict resolution.

## 4. Fork Identity Verification

| Check | Status | Evidence |
|-------|--------|----------|
| Package name in package.json | PASS | `"name": "get-shit-done-reflect-cc"` |
| Fork repo URL | PASS | `git+https://github.com/loganrooks/get-shit-done-reflect.git` |
| REFLECT branding in installer | PASS | Package name in help text and usage examples |
| Fork package name in installer | PASS | `npx get-shit-done-reflect-cc` in all examples |
| Upstream parseJsonc function | PASS | Present in install.js |
| Upstream saveLocalPatches | PASS | Present in install.js |
| Upstream gsd-statusline fix | PASS | statusline migration code present |
| files[] array in package.json | PASS | `["bin", "commands", "get-shit-done", "agents", "hooks/dist", "scripts"]` |
| esbuild devDependency | PASS | `"esbuild": "^0.24.0"` |

## 5. Ghost Reference Check

```
grep -r "gsd_memory|gsd-memory|projects\.json" *.md *.js (excluding .planning/ and node_modules/)
```

**Result: PASS -- Zero hits in source files.**

All matches were in `.planning/` documentation (research notes discussing the ghost check itself). No ghost references leaked into the merged codebase.

## 6. Test Results

### Fork Tests (BLOCKING)
```
npx vitest run
  4 passed | 1 skipped (5 test files)
  42 passed | 4 skipped (46 tests)
  Duration: 1.07s
```
**Result: ALL PASS.** 4 e2e tests skipped (require API keys -- expected).

### Upstream Tests (INFORMATIONAL)
```
node --test get-shit-done/bin/gsd-tools.test.js
  18 suites, 75 tests
  75 pass, 0 fail
  Duration: 3.49s
```
**Result: ALL PASS.** Upstream's gsd-tools.js works correctly in the fork environment.

## 7. Open Items for Phase 9+

### Architecture Adoption (Phase 9)
- **Thin orchestrator migration:** 3 commands already adopted (new-project, help, update). Remaining commands still use upstream's thin stubs but may need fork customization in their workflow files.
- **gsd-tools.js integration:** CLI tool landed and tests pass. Fork commands/workflows should adopt it for commits, state management, and config parsing.
- **Summary template variants:** Three new templates (complex, minimal, standard) landed. Evaluate which the fork should use.

### Feature Validation (Phase 10)
- **Patch preservation system:** saveLocalPatches/writeManifest/reapply-patches landed. Needs end-to-end validation with fork's install flow.
- **New references:** 4 new reference docs (decimal-phase-calculation, git-planning-commit, model-profile-resolution, phase-argument-parsing) landed. Review for fork compatibility.

### Testing (Phase 11)
- **Upstream test integration:** 75 upstream tests all pass. Consider adding to CI pipeline.
- **Fork smoke tests:** Validate full workflow chain post-merge.

### Release (Phase 12)
- **README.md update:** Currently fork-wins (Phase 8). Needs updating to reflect newly adopted upstream features.
- **CHANGELOG.md update:** Needs entry for v1.13 upstream sync.
- **Version bump:** From 1.12.2 to next version.

### GitHub/Community Files
- `.github/CODEOWNERS` references `@glittercowboy` (upstream maintainer). Fork may want to update.
- Issue templates reference upstream. Fork may want to customize.
- `SECURITY.md` may need fork-specific contact info.
- `new-project.md.bak` is upstream's backup file. Consider removing if not needed.

---
*Generated: 2026-02-10*
*Phase: 08-core-merge*
