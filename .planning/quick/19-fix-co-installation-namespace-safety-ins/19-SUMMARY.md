---
phase: quick
plan: 19
duration: ~15min
completed: 2026-03-06
---

# Quick Task 19: Fix co-installation namespace safety

**Executed retroactively (agent bypassed /gsdr:quick workflow initially — see sig-2026-03-06-agent-bypassed-quick-cycle-for-coinstall-fix)**

## Performance
- **Duration:** ~15min
- **Tasks:** 3
- **Files modified:** 3

## Task Commits
1. **Fix installer co-installation safety + broken @-references** - `842887f`
2. **Remove old gsd namespace tracked files** - `dab0236`

## Files Modified
- `bin/install.js` — added `isLegacyReflectInstall()`, guarded 6 cleanup locations
- `tests/unit/install.test.js` — added co-installation preservation test, updated legacy upgrade test
- `get-shit-done/workflows/run-spike.md` — fixed @-reference paths (`.claude/` -> `~/.claude/`)
