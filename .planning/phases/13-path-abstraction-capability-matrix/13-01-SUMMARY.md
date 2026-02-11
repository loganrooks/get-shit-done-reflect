---
phase: 13-path-abstraction-capability-matrix
plan: 01
subsystem: installer
tags: [path-replacement, two-pass, knowledge-base, multi-runtime, regex]
requires:
  - phase: none
    provides: existing installer with 4 inline path replacement points
provides:
  - centralized replacePathsInContent() two-pass function
  - KB paths correctly routed to ~/.gsd/knowledge/ shared location
  - $HOME/.claude/ variant handling for bash code blocks
  - require.main guard enabling direct unit testing of install.js exports
affects: [14-shared-knowledge-migration, 15-codex-runtime]
tech-stack:
  added: []
  patterns: [two-pass-replacement, negative-lookahead-safety-guard, require-main-guard]
key-files:
  created: []
  modified: [bin/install.js, tests/unit/install.test.js]
key-decisions:
  - "Pass 1 transforms KB paths to ~/.gsd/knowledge/ (not protection-only)"
  - "Pass 2 uses negative lookahead as safety guard even after Pass 1"
  - "Added require.main guard to install.js to enable direct module import for testing"
  - "Removed inline path replacement from convertClaudeToOpencodeFrontmatter to eliminate double-replacement"
patterns-established:
  - "Two-pass path replacement: shared paths first, runtime-specific second"
  - "require.main guard: enables CJS module export alongside CLI script"
duration: 6min
completed: 2026-02-11
---

# Phase 13 Plan 01: Two-Pass Path Replacement Summary

**Centralized replacePathsInContent() with KB/runtime path split, $HOME variant handling, and 14 new tests**

## Performance
- **Duration:** 6min
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Created `replacePathsInContent()` function implementing two-pass path replacement: Pass 1 transforms KB paths (`~/.claude/gsd-knowledge` -> `~/.gsd/knowledge`), Pass 2 transforms remaining runtime-specific paths with negative lookahead safety guard
- Handles both `~/` and `$HOME/` path variants (3 files use `$HOME/.claude/gsd-knowledge` in bash blocks)
- Refactored all 3 active call sites (copyWithPathReplacement, copyFlattenedCommands, agent copy loop) to use centralized function
- Removed inline path replacement from `convertClaudeToOpencodeFrontmatter()` eliminating the double-replacement bug (Pitfall 3 from research)
- Added `require.main` guard to install.js enabling direct `require()` import for unit testing without CLI side effects
- Added 14 new tests: 10 unit tests for replacePathsInContent() and 4 integration tests verifying full installer behavior

## Task Commits
1. **Task 1: Create replacePathsInContent() and refactor all 4 replacement points** - `0311afc`
2. **Task 2: Add two-pass path replacement tests** - `fbdb9fa`

## Files Created/Modified
- `bin/install.js` - Added replacePathsInContent() function, refactored 3 call sites, removed path replacement from convertClaudeToOpencodeFrontmatter, added require.main guard, added module.exports
- `tests/unit/install.test.js` - Added 14 tests covering unit and integration testing of two-pass replacement

## Decisions & Deviations

### Decisions
- **KB path transformation vs protection:** Plan specified Pass 1 should replace KB paths with `~/.gsd/knowledge/` (transform), not merely protect them. This means even Claude installs will have KB paths pointing to the shared location. Phase 14 will create the directory and symlinks.
- **$HOME absolute path handling:** When pathPrefix is an absolute path (global installs), the `$HOME` replacement derives the HOME-relative suffix by stripping `os.homedir()` from the prefix, avoiding double-absolute-path bugs.

### Deviations
**[Rule 3 - Blocking] Added require.main guard for testability**
- **Found during:** Task 2
- **Issue:** install.js has top-level side effects (banner print, CLI routing) that execute on `require()`, making direct function testing impossible
- **Fix:** Wrapped banner/help display and main routing logic in `if (require.main === module)` guard, keeping function definitions accessible for module import
- **Files modified:** bin/install.js
- **Commit:** fbdb9fa

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `replacePathsInContent()` is in place and tested for Phase 14 (shared knowledge migration)
- Phase 14 can update source files to reference `~/.gsd/knowledge/` directly, at which point Pass 1 transforms become no-ops (source files will already use the shared path)
- The `module.exports` pattern is established for future install.js unit testing
