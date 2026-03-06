---
phase: 44-gsdr-namespace-co-installation
plan: 01
subsystem: installer
tags: [namespace, co-installation, install-time-rewriting]
dependency_graph:
  requires: []
  provides: [gsdr-namespace-rewriting, install-time-isolation]
  affects: [bin/install.js, tests/unit/install.test.js, tests/integration/multi-runtime.test.js, tests/integration/cross-runtime-kb.test.js]
tech_stack:
  added: []
  patterns: [install-time-namespace-rewriting, negative-lookahead-protection]
key_files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
    - tests/integration/multi-runtime.test.js
    - tests/integration/cross-runtime-kb.test.js
decisions:
  - "Pass 3 ordering: 3a (directory) before 3c (prefix) to avoid partial matches"
  - "(?!tools) negative lookahead protects gsd-tools.js filename across 237 occurrences"
  - "Uninstall updated to handle both gsd-* and gsdr-* for upgrade path (Rule 3 deviation)"
metrics:
  duration: 14min
  completed: 2026-03-06
  tasks: 3
  files: 4
---

# Phase 44 Plan 01: Install Path Namespace Rewriting Summary

Extended replacePathsInContent() with 4 GSDR namespace rewriting passes and updated install() to write all output to gsdr-namespaced paths with agent/hook file renaming and content replacement.

## Tasks Completed

| # | Task | Commit | Key Changes |
|---|------|--------|-------------|
| 1 | Extend replacePathsInContent() with GSDR namespace rewriting rules | 1f07f47 | 4 new passes (3a-3d) after existing Pass 2 |
| 2 | Update install() for GSDR namespace destinations, filenames, and hook registration | eaf88c4 | Dest dirs, agent rename, hook rename+content, hook registration |
| 3 | Write unit tests proving namespace rewriting edge cases + update assertions | ee4305b | 23 new tests, updated integration test assertions |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated uninstall() for GSDR namespace**
- **Found during:** Task 3 (test execution)
- **Issue:** Install creates gsdr-* files but uninstall looked for gsd-* -- integration tests failed because uninstall couldn't find installed files
- **Fix:** Updated uninstall() to handle both gsdr-* (current) and gsd-* (upgrade path) for: Codex skills, OpenCode commands, Claude/Gemini commands, agents, runtime directory, hooks, settings.json cleanup
- **Files modified:** bin/install.js
- **Commit:** ee4305b

**2. [Rule 3 - Blocking] Updated writeManifest() for GSDR namespace**
- **Found during:** Task 3 (test execution)
- **Issue:** Manifest referenced get-shit-done/ and commands/gsd/ but actual files at get-shit-done-reflect/ and commands/gsdr/
- **Fix:** Updated path prefixes in writeManifest() to match installed directory names
- **Files modified:** bin/install.js
- **Commit:** ee4305b

**3. [Rule 3 - Blocking] Updated configureOpencodePermissions() for GSDR namespace**
- **Found during:** Task 3 (test execution)
- **Issue:** OpenCode permission path referenced get-shit-done/* instead of get-shit-done-reflect/*
- **Fix:** Updated gsdPath to use get-shit-done-reflect/*
- **Files modified:** bin/install.js
- **Commit:** ee4305b

**4. [Rule 3 - Blocking] Updated cleanupOrphanedHooks() for GSDR namespace**
- **Found during:** Task 3 (test execution)
- **Issue:** Old statusline.js upgrade path pointed to gsd-statusline.js instead of gsdr-statusline.js
- **Fix:** Updated upgrade path to use gsdr-statusline.js, added guard for both old and new patterns
- **Files modified:** bin/install.js
- **Commit:** ee4305b

**5. [Rule 3 - Blocking] Updated integration test assertions for GSDR namespace**
- **Found during:** Task 3 (test execution)
- **Issue:** 14 integration test failures across multi-runtime.test.js and cross-runtime-kb.test.js due to hardcoded gsd-* prefixes and get-shit-done/ paths
- **Fix:** Updated all assertions to expect gsdr-* filenames and get-shit-done-reflect/ directories
- **Files modified:** tests/integration/multi-runtime.test.js, tests/integration/cross-runtime-kb.test.js
- **Commit:** ee4305b

## Verification Results

1. `node -c bin/install.js` passes (syntax check)
2. No stale gsd-statusline.js or gsd-check-update.js in install() (only in upgrade-path cleanup code)
3. replacePathsInContent() has Pass 3a-3d after Pass 2, with (?!tools) in 3c
4. Hook copy loop reads content + replaces paths (not fs.copyFileSync)
5. Agent copy renames gsd-*.md to gsdr-*.md
6. All 256 tests pass (23 new + 233 existing, 4 todo)
7. `npm test` passes with 0 failures

## Self-Check: PASSED
