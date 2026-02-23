---
phase: 29-test-fixes-installer-deploy
plan: 02
subsystem: installer
tags: [gsd-tools, deployment, installer, binary-sync]
requires:
  - phase: 29-01
    provides: "All 256 tests passing across 3 runners (clean test baseline)"
provides:
  - "Deployed gsd-tools.js binary (repo-local) matching source"
  - "Deployed gsd-tools.js binary (global) matching source"
  - "875-line gap between source and deployed binaries closed"
affects: [gsd-tools, installer, CLI commands]
tech-stack:
  added: []
  patterns: [installer-deploy, hash-verification]
key-files:
  created: []
  modified:
    - ".claude/get-shit-done/bin/gsd-tools.js (deployed, untracked)"
    - "~/.claude/get-shit-done/bin/gsd-tools.js (deployed, global)"
    - ".claude/get-shit-done/workflows/collect-signals.md (source update)"
key-decisions:
  - "Restored force-tracked files clobbered by installer before committing (agents, commands, agent-protocol.md)"
  - "Accepted collect-signals.md source update (adds KB index rebuild after signal collection)"
duration: 2min
completed: 2026-02-23
---

# Phase 29 Plan 02: Installer Deploy Summary

**Closed 875-line gap between source and deployed gsd-tools.js by running installer for both local and global targets, verified all three copies are byte-identical**

## Performance
- **Duration:** 2min
- **Tasks:** 3 completed (Task 0: baseline, Task 1: install, Task 2: verify)
- **Files modified:** 1 tracked (collect-signals.md), 2 deployed binaries (untracked)

## Accomplishments
- Confirmed stale state: source 5472 lines vs deployed 4597 lines (875-line gap, different SHA hashes)
- Ran `node bin/install.js --claude --local` and `--global` successfully (exit 0)
- Verified all three gsd-tools.js copies are byte-identical: hash `916e7238093343974af7c70676f9309e86b2b61f`, 5472 lines each
- File permissions preserved (rwxr-xr-x) across all copies

## Task Commits
1. **Task 0: Confirm stale state** - (observation only, no commit needed)
2. **Task 1: Run installer for local and global targets** - `e3e9495`
3. **Task 2: Verify deployed binaries match source** - (verification only, no commit needed)

## Files Created/Modified
- `.claude/get-shit-done/bin/gsd-tools.js` - Deployed binary, now matches source (untracked/gitignored)
- `~/.claude/get-shit-done/bin/gsd-tools.js` - Global deployed binary, now matches source
- `.claude/get-shit-done/workflows/collect-signals.md` - Updated from source (adds KB index rebuild step)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Restored force-tracked files clobbered by installer**
- **Found during:** Task 1
- **Issue:** The installer removes and re-copies the entire `.claude/get-shit-done/` and `.claude/agents/` directories from source. This deleted 3 restored agent specs (gsd-reflector.md, gsd-signal-collector.md, gsd-spike-runner.md), 2 restored commands (reflect.md, spike.md), and agent-protocol.md -- all force-tracked files from Phase 28 and Phase 22 that don't exist in the source `get-shit-done/` directory.
- **Fix:** Restored all 15 affected files from HEAD using `git checkout HEAD -- <files>`. The plan incorrectly stated "The installer does NOT touch `.claude/agents/` or `.claude/commands/gsd/`" -- it does.
- **Files restored:** 3 deleted agents, 2 deleted commands, 1 deleted reference, 9 modified agents
- **Commit:** Part of `e3e9495`

## Baseline Measurements

| Metric | Before Install | After Install |
|--------|---------------|---------------|
| Source hash | `916e7238...` | `916e7238...` |
| Local deployed hash | `e716479a...` | `916e7238...` |
| Global deployed hash | `e716479a...` | `916e7238...` |
| Source lines | 5472 | 5472 |
| Local deployed lines | 4597 | 5472 |
| Global deployed lines | 4597 | 5472 |

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 29 is complete. All 256 tests pass (Plan 01) and all deployed binaries match source (Plan 02). Ready for Phase 30 or milestone completion.

## Self-Check: PASSED
- All 9 key files verified present on disk
- Commit e3e9495 verified in git log
- All three gsd-tools.js hashes match (916e7238093343974af7c70676f9309e86b2b61f)
- All three line counts match (5472)
