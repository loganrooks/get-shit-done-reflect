---
phase: 20-fix-hooks-failing-in-git-worktrees
plan: 01
subsystem: installer
tags: [hooks, worktree, shell-guard, settings.json]

requires:
  - phase: none
    provides: n/a
provides:
  - Worktree-safe hook commands (test -f guard pattern)
  - buildLocalHookCommand() helper function
  - Hook upgrade logic in installer for existing unguarded commands
affects: [installer, hooks, worktree-isolation]

tech-stack:
  added: []
  patterns: ["test -f {path} && node {path} || true shell guard for worktree safety"]

key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js

key-decisions:
  - "buildLocalHookCommand() extracted as DRY helper near buildHookCommand()"
  - "ensureHook() helper consolidates add-or-upgrade logic for SessionStart hooks"
  - "Statusline upgrade handled in finishInstall() to cover non-interactive reinstall path"

patterns-established:
  - "Worktree-safe guard: test -f {path} && node {path} || true for all local hook commands"

requirements-completed: [QUICK-20]

duration: 6min
completed: 2026-03-08
---

# Quick Task 20: Fix Hooks Failing in Git Worktrees Summary

**Shell existence guards on all 5 local hook commands so hooks exit 0 silently when .claude/ is absent in git worktrees**

## Performance

- **Duration:** 6 min
- **Started:** 2026-03-08T23:50:03Z
- **Completed:** 2026-03-08T23:56:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Added `buildLocalHookCommand()` that wraps hook invocations with `test -f ... && node ... || true`
- Replaced 5 inline local hook command strings with `buildLocalHookCommand()` calls
- Added upgrade logic so existing unguarded hook commands get upgraded on reinstall
- Added 6 new tests (unit + integration) for worktree-safe hook behavior
- All 274 tests pass across the full suite

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): Add failing tests for worktree-safe hooks** - `1d49da8` (test)
2. **Task 1 (GREEN): Implement buildLocalHookCommand and use in local paths** - `8ef6aae` (feat)
3. **Task 2: Upgrade existing hooks to worktree-safe guards on reinstall** - `617483a` (feat)

_Note: Task 1 used TDD flow (RED then GREEN commits)_

## Files Created/Modified
- `bin/install.js` - Added `buildLocalHookCommand()`, `ensureHook()`, statusline upgrade logic
- `tests/unit/install.test.js` - 6 new tests for guard pattern, all hooks, integration

## Decisions Made
- Extracted `buildLocalHookCommand()` as a named helper near `buildHookCommand()` for discoverability
- Consolidated 4 separate hook add/check blocks into `ensureHook()` helper (DRY, -30 lines)
- Statusline upgrade in `finishInstall()` because `handleStatusline()` skips on non-interactive + existing statusline
- Exported `buildLocalHookCommand` for direct unit testing (added to module.exports)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added hook upgrade logic for existing settings**
- **Found during:** Task 2 (reinstall and verify)
- **Issue:** Dedup checks (`hasGsdUpdateHook` etc.) detected existing hooks by substring match, preventing re-addition. Existing unguarded commands would never be updated.
- **Fix:** Replaced 4 separate if-not-found-push blocks with `ensureHook()` helper that both adds missing hooks and upgrades unguarded existing hooks. Added statusline upgrade in `finishInstall()`.
- **Files modified:** bin/install.js
- **Verification:** `node bin/install.js --local` shows "Upgraded X hook (worktree-safe guard)" for all 5 hooks; settings.json has 5 `test -f` occurrences
- **Committed in:** 617483a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 missing critical)
**Impact on plan:** Plan anticipated this issue and provided guidance. The ensureHook() consolidation was a cleaner implementation than the plan's suggestion to modify individual dedup checks.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Hooks are now worktree-safe for all local installs
- Global installs unchanged (absolute paths always exist)
- Pattern is extensible for any future hooks

---
*Quick Task: 20-fix-hooks-failing-in-git-worktrees*
*Completed: 2026-03-08*

## Self-Check: PASSED

- [x] bin/install.js exists
- [x] tests/unit/install.test.js exists
- [x] 20-SUMMARY.md exists
- [x] Commit 1d49da8 (RED: failing tests) exists
- [x] Commit 8ef6aae (GREEN: implementation) exists
- [x] Commit 617483a (Task 2: upgrade logic) exists
