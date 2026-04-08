---
phase: 55-upstream-mini-sync
plan: 03
model: claude-sonnet-4-6
context_used_pct: 55
subsystem: upstream-sync
tags: [upstream, phase-module, roadmap-module, installer, reliability, atomic-writes, locking, hook-safety]
requires:
  - phase: 55-upstream-mini-sync
    plan: 02
    provides: core.cjs, frontmatter.cjs, config.cjs at v1.34.2 with fork extensions; atomicWriteFileSync + withPlanningLock available to phase.cjs and roadmap.cjs
provides:
  - phase.cjs at v1.34.2: readModifyWriteStateMd, withPlanningLock, updatePerformanceMetricsSection, phaseTokenMatches, readdirSync hoist, milestone-scoped ROADMAP parsing
  - roadmap.cjs at v1.34.2: withPlanningLock + atomicWriteFileSync for atomic roadmap writes, searchPhaseInContent helper, stripShippedMilestones/extractCurrentMilestone, readdirSync hoist
  - complete-milestone.md at v1.34.2: data-loss prevention, requirements completion check with 3-option gate, UI artifact archival, backlog_review step, comprehensive rollback protocol
  - bin/install.js: 7 upstream reliability fixes (hook path anchoring, per-hook uninstall granularity, fs.existsSync guards, manifest cleanup, USER-PROFILE.md preservation)
affects: [55-upstream-mini-sync, Plan 04 (test adoption + validation)]
tech-stack:
  added: []
  patterns: [CLAUDE_PROJECT_DIR-anchored local hooks, per-hook-granularity uninstall filter, preserveUserArtifacts/restoreUserArtifacts pattern, existsSync-guarded hook registration]
key-files:
  created: []
  modified:
    - get-shit-done/bin/lib/phase.cjs
    - get-shit-done/bin/lib/roadmap.cjs
    - get-shit-done/workflows/complete-milestone.md
    - get-shit-done/bin/lib/core.cjs
    - bin/install.js
    - tests/unit/install.test.js
key-decisions:
  - "phase.cjs and roadmap.cjs: wholesale replaced from upstream v1.34.2; fork had no unique additions (fork versions were simplified subsets of upstream, not extensions)"
  - "complete-milestone.md: C2 shell robustness guards (|| true, [ -e ] || continue) already present in upstream v1.34.2 -- no re-application needed"
  - "installer: applied 7 of 11 upstream fixes; 4 not applicable (3 for .sh hooks fork doesn't use, 1 for package.json not install.js); medium-risk hybrid with all fork extensions preserved"
  - "buildLocalHookCommand: adopted $CLAUDE_PROJECT_DIR anchor (#1906) combined with existing test -f worktree guard -- both protections active for local installs"
  - "uninstall: per-hook granularity filter covers both gsdr- (fork) and gsd- (legacy) namespaces to handle pre-reflect installs correctly"
  - "core.cjs opus->inherit fix: included in Task 1 commit as it was documented in 55-02 SUMMARY but accidentally omitted from f74ca0a9"
duration: 9min
completed: 2026-04-08
---

# Phase 55 Plan 03: Upstream Mini-Sync Mostly-Upstream Modules + Installer Summary

**Wholesale-replaced phase.cjs and roadmap.cjs with upstream v1.34.2 (gaining locking, atomic writes, milestone-scoped operations), adopted complete-milestone.md with data-loss prevention, and hybrid-merged bin/install.js with 7 upstream reliability fixes while preserving all fork extensions.**

## Performance

- **Duration:** ~9 minutes
- **Tasks:** 2/2 completed
- **Files modified:** 6 (phase.cjs, roadmap.cjs, complete-milestone.md, core.cjs, bin/install.js, install.test.js)

## Accomplishments

### Task 1: Replace phase.cjs, roadmap.cjs, adopt complete-milestone.md

**phase.cjs (908 -> 943 lines):**
- Wholesale replaced with upstream v1.34.2 base
- Gains: `readModifyWriteStateMd` (locked read-modify-write for TOCTOU safety), `withPlanningLock`, `stateExtractField`/`stateReplaceField`/`stateReplaceFieldWithFallback`, `updatePerformanceMetricsSection`, `phaseTokenMatches` (replaces `d.startsWith()` for fuzzy matching), readdirSync hoist, `warnings`/`has_warnings` result fields, milestone-scoped ROADMAP parsing via `extractCurrentMilestone`/`replaceInCurrentMilestone`
- Fork had no unique additions -- current fork version was a simplified subset of upstream

**roadmap.cjs (305 -> 360 lines):**
- Wholesale replaced with upstream v1.34.2 base
- Gains: `withPlanningLock` + `atomicWriteFileSync` for atomic roadmap writes (no more `fs.writeFileSync` directly), `searchPhaseInContent()` helper extracted to top-level function, `stripShippedMilestones`/`extractCurrentMilestone` for milestone-scoped search, readdirSync hoist (Area 3 perf fix), plan checkbox marking in `cmdRoadmapUpdatePlanProgress`
- Fork had no unique additions -- current fork version was a simplified subset of upstream

**complete-milestone.md (716 -> 799 lines):**
- Adopted upstream v1.34.2: data-loss prevention, requirements completion check with 3-option gate (proceed/audit/abort), UI artifact archival step, `backlog_review` step, `cleanup_milestone_handoffs` step, comprehensive rollback protocol with `git reset HEAD .planning/` guards
- Fork's C2 shell robustness guards (`|| true`, `[ -e "$summary" ] || continue`) already present in upstream v1.34.2 -- upstream had adopted them in a later commit

**core.cjs (deviation from 55-02):**
- Added `opus->inherit` conversion in `resolveModelInternal` for Claude Code compatibility
- Fix was documented in 55-02 SUMMARY (Deviation #2) but accidentally omitted from `f74ca0a9`
- Included here to keep the working directory clean before 55-03 work

### Task 2: Hybrid-merge installer with upstream reliability fixes

Applied 7 of 11 upstream Area 4 reliability fixes to the fork's 3,294-line install.js:

**Fix 1 (#1906): $CLAUDE_PROJECT_DIR anchor for local hook paths**
- `buildLocalHookCommand()` now prefixes paths with `"$CLAUDE_PROJECT_DIR"/`
- Local hooks resolve correctly regardless of shell cwd (prevents hook failures after `cd subdir`)
- Retained the existing `test -f ... || true` worktree guard -- both protections active

**Fix 4 (#1755 followup): Per-hook granularity in uninstall settings cleanup**
- Replaced coarse entry-level filtering with per-hook filtering via `isGsdrHookCommand()`
- User hooks sharing a settings.json entry with a GSD hook are now preserved on uninstall
- Covers all 5 hook events; handles both `gsdr-` (current) and `gsd-` (legacy) namespaces

**Fix 6 (#1754/#1878): fs.existsSync guards for .js hook registration**
- `ensureHook()` checks hook file exists before registering in settings.json
- Context monitor registration also guarded with `existsSync`
- Emits skip warning when hook file is absent (prevents "hook error on every tool invocation")

**Fix 9 (#1908): Remove gsd-file-manifest.json on uninstall**
- Added manifest removal at end of `uninstall()` cleanup sequence
- Uses existing `MANIFEST_NAME` constant

**Fix 12 (#1924): Preserve USER-PROFILE.md on re-install**
- Added `preserveUserArtifacts()`/`restoreUserArtifacts()` helpers
- `copyWithPathReplacement()` saves/restores `USER-PROFILE.md` around destructive wipes

**Not applicable (4 fixes):**
- Fix 3 (#1817) + Fix 2 within Fix 5: `.sh` hook guards -- fork uses `.js`-only hook names
- Fix 8 (#1844): shell hook copy loop -- fork doesn't deploy `.sh` hooks
- Fix 10 (#1864): package.json `files` field -- not install.js

## Task Commits

1. **Task 1: module replacements + core.cjs deviation** - `46c831b2`
2. **Task 2: installer hybrid merge** - `4cc48450`

## Files Created/Modified

- `get-shit-done/bin/lib/phase.cjs` - 908 -> 943 lines; upstream v1.34.2 with locking + milestone-scoped operations
- `get-shit-done/bin/lib/roadmap.cjs` - 305 -> 360 lines; upstream v1.34.2 with atomic roadmap writes
- `get-shit-done/workflows/complete-milestone.md` - 716 -> 799 lines; upstream v1.34.2 with data-loss prevention
- `get-shit-done/bin/lib/core.cjs` - resolveModelInternal opus->inherit fix (deviation from 55-02)
- `bin/install.js` - 3,294 -> 3,348 lines; 7 upstream reliability fixes integrated
- `tests/unit/install.test.js` - 3 test assertions updated for $CLAUDE_PROJECT_DIR anchor behavior

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] core.cjs opus->inherit fix missing from 55-02 commit**
- **Found during:** Pre-task review (git status showed uncommitted changes to core.cjs)
- **Issue:** 55-02 SUMMARY documented "Deviation #2: resolveModelInternal opus->inherit conversion" with commit `f74ca0a9`, but that commit only touched frontmatter.cjs, config.cjs, model-profiles.cjs, and gsd-tools.cjs. The core.cjs fix was in working directory but not committed.
- **Fix:** Included core.cjs in Task 1 commit with clear attribution ("deviation from 55-02")
- **Files modified:** `get-shit-done/bin/lib/core.cjs`
- **Commit:** `46c831b2`

**2. [Rule 1 - Bug] buildLocalHookCommand test assertions outdated after $CLAUDE_PROJECT_DIR adoption**
- **Found during:** Task 2 verification (3 vitest tests failed after applying Fix 1)
- **Issue:** Tests for `buildLocalHookCommand` asserted the old format (`test -f .claude/hooks/...`). After adopting `$CLAUDE_PROJECT_DIR` anchor, the format changed to `test -f "$CLAUDE_PROJECT_DIR"/.claude/hooks/...`
- **Fix:** Updated 3 test assertions in `install.test.js` to assert the new anchored format; integration test that only checks `toContain('test -f')` and `toContain('|| true')` already passes
- **Files modified:** `tests/unit/install.test.js`
- **Commit:** `4cc48450`

**3. [Rule 1 - Scope] FORK-DIVERGENCES.md "+17/-1"/"+15/-1" characterization outdated**
- **Found during:** Task 1 start (diff vs upstream was 1172 and 348 lines respectively, not 17 and 15)
- **Root cause:** FORK-DIVERGENCES.md was written against v1.22.4 baseline; upstream v1.34.2 had grown significantly. The fork's phase.cjs and roadmap.cjs were simplified subsets of upstream (missing locking, milestone-scoped operations, etc.) -- not extensions.
- **Resolution:** Wholesale replace was correct; no unique fork additions needed re-applying
- **Impact:** No file change needed; documentation discrepancy only

## Self-Check: PASSED

- `get-shit-done/bin/lib/phase.cjs` - FOUND (943 lines, upstream v1.34.2 with locking confirmed)
- `get-shit-done/bin/lib/roadmap.cjs` - FOUND (360 lines, withPlanningLock + atomicWriteFileSync confirmed)
- `get-shit-done/workflows/complete-milestone.md` - FOUND (799 lines, backlog_review + data-loss prevention confirmed)
- `bin/install.js` - FOUND (3348 lines, replacePathsInContent x8 + fork marker preserved)
- `.planning/phases/55-upstream-mini-sync/55-03-SUMMARY.md` - FOUND
- Commit `46c831b2` - FOUND (feat(55-03): replace phase.cjs, roadmap.cjs)
- Commit `4cc48450` - FOUND (feat(55-03): hybrid-merge installer)
- All 652 tests pass: 443 vitest + 191 upstream node:test + 18 fork node:test
