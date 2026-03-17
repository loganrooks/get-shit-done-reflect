---
phase: QT-27
plan: 01
model: claude-opus-4-6
context_used_pct: 18
subsystem: installer
tags: [codex, gemini, copyWithPathReplacement, runtime-conversion]
requires:
  - phase: QT-26
    provides: Codex deployment parity (sandbox modes, config.toml registration)
provides:
  - "convertClaudeToCodexMarkdown function for workflow/reference/template content conversion"
  - "6-param copyWithPathReplacement signature matching upstream (isCommand, isGlobal)"
  - "Gemini isCommand gating: only commands get TOML conversion"
  - "Codex branch in copyWithPathReplacement applying markdown content conversion"
affects: [installer, codex-runtime, gemini-runtime]
tech-stack:
  added: []
  patterns: [isCommand-gated-conversion]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
    - tests/integration/multi-runtime.test.js
key-decisions:
  - "Export copyWithPathReplacement for direct testing rather than testing only indirectly"
  - "Gemini workflow parity test updated from .toml to .md (intentional behavior change)"
patterns-established:
  - "isCommand gating: runtime-specific conversion logic now checks file category before applying format conversion"
duration: 8min
completed: 2026-03-17
---

# Quick Task 27: copyWithPathReplacement Upgrade Summary

**Upgraded copyWithPathReplacement to 6-param signature with Codex content conversion and Gemini isCommand gating**

## Performance
- **Duration:** 8min
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments
- Added `convertClaudeToCodexMarkdown()` function that converts `/gsdr:command-name` to `$gsdr-command-name` and `$ARGUMENTS` to `{{GSD_ARGS}}` for Codex-compatible workflow/reference/template files
- Upgraded `copyWithPathReplacement` signature from 4 to 6 parameters (`isCommand=false`, `isGlobal=false`) matching upstream
- Fixed Gemini branch to only TOML-convert when `isCommand=true` -- workflow/reference/template files now stay as `.md`
- Added Codex branch in `copyWithPathReplacement` that applies `convertClaudeToCodexMarkdown` content conversion
- Updated both call sites: commands pass `isCommand=true`, skills pass `isCommand=false`
- Recursive directory traversal propagates `isCommand` and `isGlobal` through all levels
- 13 new tests: 6 unit tests for `convertClaudeToCodexMarkdown`, 7 for `copyWithPathReplacement` runtime branching

## Task Commits
1. **Task 1: Add convertClaudeToCodexMarkdown and upgrade copyWithPathReplacement signature** - `75b5977`
2. **Task 2: Add tests for convertClaudeToCodexMarkdown and upgraded copyWithPathReplacement** - `eec0ae1`

## Files Created/Modified
- `bin/install.js` - New convertClaudeToCodexMarkdown function, upgraded copyWithPathReplacement with 6-param signature, Codex and fixed Gemini branches, updated call sites and exports
- `tests/unit/install.test.js` - 13 new tests for convertClaudeToCodexMarkdown unit tests and copyWithPathReplacement runtime behavior
- `tests/integration/multi-runtime.test.js` - Fixed Gemini workflow parity assertion (`.toml` -> `.md`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Updated multi-runtime parity test for Gemini workflows**
- **Found during:** Task 2
- **Issue:** `multi-runtime.test.js` line 665 expected Gemini workflow files to use `.toml` extension, but the plan's behavior change means they now stay as `.md`
- **Fix:** Changed Gemini workflow extension from `.toml` to `.md` in the parity test
- **Files modified:** `tests/integration/multi-runtime.test.js`
- **Commit:** `eec0ae1`

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
The upgraded `copyWithPathReplacement` signature and `convertClaudeToCodexMarkdown` function are ready for use by downstream installer features. All 346 tests pass.

## Self-Check: PASSED
