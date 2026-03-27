---
phase: 51-update-system-hardening
plan: 02
model: claude-opus-4-6
context_used_pct: 25
subsystem: installer
tags: [hook-validation, codex-paths, shell-compatibility, model-resolution, upstream-drift]
requires:
  - phase: 51-01
    provides: "Migration spec infrastructure, version comparison helpers, stale file cleanup"
provides:
  - "validateHookFields strips invalid hook entries before settings.json write"
  - "generateCodexConfigBlock produces absolute agent paths with targetDir param"
  - "Global install pathPrefix uses $HOME for shell compatibility"
  - "Non-Claude runtimes get resolve_model_ids omit in defaults.json"
affects: [installer, settings-json, codex-config, cross-runtime]
tech-stack:
  added: []
  patterns: ["two-pass hook validation", "optional targetDir for absolute path resolution", "$HOME shell variable in pathPrefix"]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
key-decisions:
  - "validateHookFields uses two-pass approach (filter then prune) to avoid mutation during iteration"
  - "C6 resolve_model_ids placed in install() after hook registration, before writeManifest"
  - "C5 pathPrefix uses path.basename(targetDir) with $HOME prefix rather than full absolute path"
patterns-established:
  - "Hook field validation: validateHookFields called both at settings load and before finishInstall write"
  - "Optional param extension: generateCodexConfigBlock(agents, targetDir) backward-compatible with no targetDir"
duration: 4min
completed: 2026-03-27
---

# Phase 51 Plan 02: Upstream Drift Cluster Integration Summary

**Four upstream drift fixes (C1 absolute Codex paths, C5 $HOME pathPrefix, C6 resolve_model_ids, C7 hook validation) integrated into installer with 14 new tests**

## Performance
- **Duration:** 4min
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Added `validateHookFields()` function with two-pass validation: filters entries missing required `hooks` array or lacking `prompt`/`command` fields, then prunes empty event types and hooks property
- Wired validateHookFields into both settings load path (after cleanupOrphanedHooks) and finishInstall path (before writeSettings)
- Extended `generateCodexConfigBlock(agents, targetDir)` to produce absolute `config_file` paths when targetDir provided, for Codex >= 0.116 AbsolutePathBuf requirement
- Changed global install pathPrefix from literal absolute path to `$HOME/{basename}/` for shell compatibility in double-quoted contexts
- Added C6 resolve_model_ids logic: non-Claude runtimes (OpenCode, Gemini, Codex) write `resolve_model_ids: "omit"` to `~/.gsd/defaults.json`
- Test suite grew from 387 to 401 (14 new tests across all four drift clusters)

## Task Commits
1. **Task 1: Integrate C1, C5, C6, C7 into installer** - `adb1192`
2. **Task 2: Tests for upstream drift cluster integrations** - `9320980`

## Files Created/Modified
- `bin/install.js` - validateHookFields function, generateCodexConfigBlock targetDir param, $HOME pathPrefix, resolve_model_ids for non-Claude runtimes, new export
- `tests/unit/install.test.js` - 14 new tests: 7 C7 validateHookFields, 3 C1 Codex absolute paths, 1 C5 $HOME pathPrefix, 3 C6 resolve_model_ids

## Deviations from Plan

None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All four upstream drift clusters (C1, C5, C6, C7) now integrated and tested
- Ready for 51-03 (remaining upstream sync and hardening work)
- validateHookFields exported and available for external testing
- Test count at 401 passed + 4 todo (405 total)

## Self-Check: PASSED
