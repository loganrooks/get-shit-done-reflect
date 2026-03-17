---
phase: quick-22
plan: 01
model: claude-opus-4-6
context_used_pct: 25
subsystem: installer
tags: codex, toml, agent-generation, backslash-safety
requires:
  - phase: v1.17
    provides: "Codex runtime support with AGENTS.md composite and skill generation"
provides:
  - "convertClaudeToCodexAgentToml() function for TOML literal string generation"
  - "Individual agent .toml files installed for Codex runtime"
  - "Agent parity across all 4 runtimes (Claude, OpenCode, Gemini, Codex)"
affects: [installer, codex-runtime, multi-runtime-tests]
tech-stack:
  added: []
  patterns: ["TOML literal multi-line strings (''') for backslash-safe content"]
key-files:
  created: []
  modified:
    - "bin/install.js"
    - "tests/unit/install.test.js"
    - "tests/integration/multi-runtime.test.js"
key-decisions:
  - "Used TOML literal strings (''') instead of basic strings (\"\"\") to avoid backslash escape processing"
  - "Agent .toml files supplement AGENTS.md (not replace) -- both are generated for Codex"
  - "Triple single quote edge case handled by replacing ''' with space-separated quotes in body"
patterns-established:
  - "Codex agent TOML generation: same source .md files, same transforms, TOML literal string output"
duration: 8min
completed: 2026-03-17
---

# Quick Task 22: Fix Codex Agent TOML Generation (Issue #15) Summary

**TOML literal multi-line strings (''') for Codex agent files, preserving backslash patterns in bash/regex content verbatim**

## Performance
- **Duration:** 8min
- **Tasks:** 3/3 completed
- **Files modified:** 3

## Accomplishments
- Created `convertClaudeToCodexAgentToml()` function that generates valid TOML using literal multi-line strings, avoiding the backslash escape issue that broke Codex agent invocations
- Wired Codex agent TOML generation into the installer's agent block, producing 19 `gsdr-*.toml` files alongside the existing AGENTS.md composite
- Added 6 unit tests covering basic conversion, backslash preservation (the critical Issue #15 case), no-frontmatter input, triple-quote escaping, description fallback, and real agent content
- Updated integration tests: runtime layout verification, agent parity across all 4 runtimes, and a focused literal string safety test
- All 284 tests pass (7 test files, 0 failures)

## Task Commits
1. **Task 1: Create convertClaudeToCodexAgentToml() and wire into installer** - `03ecbce`
2. **Task 2: Add unit tests for convertClaudeToCodexAgentToml()** - `291ef76`
3. **Task 3: Update integration tests for Codex agent TOML layout and parity** - `23b1fd0`

## Files Created/Modified
- `bin/install.js` - Added convertClaudeToCodexAgentToml() function, wired Codex agent TOML generation into install block, exported for testing
- `tests/unit/install.test.js` - 6 new unit tests for convertClaudeToCodexAgentToml(), updated Codex layout test to expect agents/ directory
- `tests/integration/multi-runtime.test.js` - Updated verifyRuntimeLayout for Codex, added Codex to agent parity check, new literal string safety test

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed template literal backtick escaping in test**
- **Found during:** Task 2
- **Issue:** The backslash preservation test used a JS template literal, which interprets `\`` as just `` ` ``, causing the assertion to look for `` `backtick` `` instead of `\`backtick\``
- **Fix:** Changed to string concatenation (`'...' + '...'`) to preserve literal backslash-backtick sequences
- **Files modified:** tests/unit/install.test.js
- **Commit:** 291ef76

**2. [Rule 1 - Bug] Updated unit test Codex layout assertion**
- **Found during:** Task 3
- **Issue:** Existing unit test `--codex --global installs complete file layout` asserted `agentsDirExists` was `false` for Codex, but Task 1 now creates agents/ with .toml files
- **Fix:** Changed assertion to expect agents/ directory exists with gsdr-*.toml files
- **Files modified:** tests/unit/install.test.js
- **Commit:** 23b1fd0

## User Setup Required
None - no external service configuration required.

## Issue Resolution
- **GitHub Issue:** #15 (Codex agent TOML files break on backslash patterns)
- **Root cause:** Codex CLI generated agent `.toml` files using TOML basic multi-line strings (`"""`), which interpret backslash sequences as escapes
- **Fix:** GSD installer now generates agent TOML files using literal multi-line strings (`'''`), which pass backslashes through verbatim

## Self-Check: PASSED
- All 3 modified files exist on disk
- All 3 task commits verified in git history (03ecbce, 291ef76, 23b1fd0)
- Full test suite: 284 passed, 0 failed
