---
phase: quick-15
plan: 01
subsystem: testing
tags: [parity, multi-runtime, hooks, build]
dependency-graph:
  requires: []
  provides: [cross-runtime-parity-tests, glob-hook-discovery]
  affects: [scripts/build-hooks.js, tests/integration/multi-runtime.test.js]
tech-stack:
  added: []
  patterns: [glob-based-discovery, name-parity-testing, registration-sync-testing]
key-files:
  created: []
  modified:
    - scripts/build-hooks.js
    - tests/integration/multi-runtime.test.js
    - .planning/deliberations/cross-runtime-parity-testing.md
decisions:
  - Glob-based hook discovery replaces hardcoded HOOKS_TO_COPY array
  - Hook registration sync test validates settings.json -> file direction only (not all hooks are registered via settings.json)
  - Gemini workflows use .toml extension, handled via per-runtime extension in parity test
  - Command name normalization adds gsd- prefix to Claude/Gemini commands (nested in gsd/ subdir) for comparison with OpenCode/Codex (flat gsd-* naming)
metrics:
  duration: 3min
  completed: 2026-03-05
---

# Quick Task 15: Cross-Runtime Parity Testing Summary

Glob-based hook discovery in build-hooks.js plus 3 new parity test categories covering name sets, Gemini tool names, and hook registration sync.

## What Was Done

### Task 1: Fix build-hooks.js and add parity tests

**Part A - build-hooks.js glob discovery:** Replaced hardcoded `HOOKS_TO_COPY` array with `fs.readdirSync(HOOKS_DIR).filter(f => f.startsWith('gsd-') && f.endsWith('.js'))`. This automatically discovers new hooks without manual list maintenance. The `dist/` subdirectory is naturally excluded by the `.js` extension filter. After rebuild, hooks/dist/ now contains all 4 hooks including gsd-ci-status.js.

**Part B - Name parity test:** Added test that installs `--all --global`, collects file names per category (agents, workflows, commands, hooks) per applicable runtime, strips extensions, and asserts exact set equality. Handles runtime-specific extensions (Gemini .toml for workflows/commands) and naming conventions (Claude/Gemini nested in gsd/ subdir vs OpenCode/Codex flat gsd-* prefix).

**Part C - All-agent Gemini tool name check:** Added test that reads ALL gsd-*.md agents in Gemini install and asserts body text contains no Claude tool names (`\bRead\b`, `\bBash\b`, `\bWrite\b`, `\bGlob\b`, `\bGrep\b`). Extends existing single-agent test to cover all agents.

**Part D - Hook registration sync test:** Added test that parses settings.json for Claude and Gemini, extracts registered hook filenames from nested hooks structure, and asserts every registered hook has a corresponding file. Tests one direction only (registered -> file exists) since some hooks like gsd-statusline.js are notification hooks not registered via settings.json.

**Commit:** d1f2e2f

### Task 2: Update deliberation status

Updated cross-runtime-parity-testing.md deliberation from Open to Adopted with complete decision record.

**Commit:** 2323a4f

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Gemini workflows use .toml extension**
- **Found during:** Task 1 test execution
- **Issue:** Parity test used `.md` for all workflow runtimes, but Gemini converts workflows to `.toml` format
- **Fix:** Used per-runtime extension: `.toml` for Gemini, `.md` for others
- **Files modified:** tests/integration/multi-runtime.test.js

**2. [Rule 1 - Bug] Settings.json hooks have nested structure**
- **Found during:** Task 1 test execution
- **Issue:** Hook registration extraction assumed flat `hooks.EventType[].command` but actual structure is `hooks.EventType[].hooks[].command` (nested array)
- **Fix:** Added inner loop for nested hooks array; also changed to one-directional assertion (registered -> file exists) since gsd-statusline.js is not registered via settings.json
- **Files modified:** tests/integration/multi-runtime.test.js

**3. [Rule 1 - Bug] Command name normalization needed for both Claude and Gemini**
- **Found during:** Task 1 test execution
- **Issue:** Claude and Gemini both use nested `commands/gsd/` directory (no gsd- prefix on filenames), while OpenCode and Codex use flat gsd-* naming. Initial normalization only handled Claude.
- **Fix:** Applied gsd- prefix normalization to both Claude and Gemini command name sets
- **Files modified:** tests/integration/multi-runtime.test.js

## Verification

- `npm run build:hooks` copies 4 hooks (gsd-check-update.js, gsd-ci-status.js, gsd-statusline.js, gsd-version-check.js)
- `npm test -- tests/integration/multi-runtime.test.js` -- all 19 tests pass
- `npm test` -- full suite passes (217 tests, 0 failures)

## Self-Check: PASSED
