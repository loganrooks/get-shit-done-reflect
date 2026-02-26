---
phase: quick
plan: 9
duration: ~5min
completed: 2026-02-26
---

# Quick Task 9: Fix installer local patch detection (false positives)

**Executed inline (trivial task -- skipped planner+executor spawn)**

## Problem

The installer's `saveLocalPatches()` function backs up files whose hashes differ from the manifest written during the previous install. When files were already at the target version (common in dev repos where `node bin/install.js --local` is run during development), all files were flagged as "locally modified" — producing 15 false-positive patches on v1.15.1→v1.15.3 update.

## Solution

Added `pruneRedundantPatches(configDir)` that runs after `writeManifest()` and before `reportLocalPatches()`. For each backed-up patch, it compares the patch hash against the newly installed file's hash. If they match, the "modification" was just the file already being at the target version — not a real user patch. Removes false positives and cleans up `gsd-local-patches/` entirely when no real patches remain.

## Performance
- **Duration:** ~5min
- **Tasks:** 1
- **Files modified:** 1

## Task Commits
1. **Fix installer local patch detection** - `b979680`

## Files Modified
- `bin/install.js` — added `pruneRedundantPatches()` function + calls in both Codex and main install paths
