---
phase: quick
plan: 18
duration: 2min
completed: 2026-03-06
---

# Quick Task 18: Fix +dev suffix to apply when installing from git repo, not just --local

**Executed inline (trivial task -- skipped planner+executor spawn)**

## Performance
- **Duration:** 2min
- **Tasks:** 1
- **Files modified:** 2

## Task Commits
1. **Fix +dev suffix for git repo installs** - `8232508`

## Files Modified
- `bin/install.js` - Detect `.git` dir to determine if installing from source
- `tests/integration/cross-runtime-kb.test.js` - Accept `+dev` suffix in VERSION regex
