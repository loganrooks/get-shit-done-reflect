---
phase: 17-validation-release
plan: 01
subsystem: testing
tags: [vitest, integration-tests, multi-runtime, installer-validation, opencode, gemini, codex]
requires:
  - phase: 15-codex-cli
    provides: "4-runtime installer with Codex CLI support (64 tests)"
  - phase: 14-kb-migration
    provides: "Runtime-agnostic KB at ~/.gsd/knowledge/ with two-pass path replacement"
provides:
  - "Deep integration tests for OpenCode installation correctness (VALID-01)"
  - "Deep integration tests for Gemini installation correctness (VALID-02)"
  - "Comprehensive --all multi-runtime install validation (VALID-03)"
  - "Reusable helpers: verifyRuntimeLayout, verifyNoLeakedPaths, verifyKBPathsShared"
affects: [17-02-cross-runtime-kb]
tech-stack:
  added: []
  patterns: [tmpdir-isolated-installer-validation, recursive-content-scanning]
key-files:
  created:
    - tests/integration/multi-runtime.test.js
  modified: []
key-decisions:
  - "Separate test file (multi-runtime.test.js) rather than extending install.test.js to keep validation concerns isolated"
  - "Reusable assertion helpers for runtime layout, path leakage, and KB path verification"
  - "Used .todo() placeholders for VALID-03 in Task 1 to keep intermediate commits green"
patterns-established:
  - "verifyRuntimeLayout(rootDir, runtime, configHome): validates full file tree per runtime"
  - "verifyNoLeakedPaths(runtimeDir, runtime): recursive content scan for cross-runtime path leakage"
  - "verifyKBPathsShared(runtimeDir): ensures KB references use shared ~/.gsd/knowledge/ path"
duration: 3min
completed: 2026-02-11
---

# Phase 17 Plan 01: Multi-Runtime Deep Validation Summary

**13 deep integration tests validating OpenCode, Gemini, and --all install correctness with content-level path, format, and layout assertions**

## Performance
- **Duration:** 3 minutes
- **Tasks:** 2/2
- **Files created:** 1 (501 lines)

## Accomplishments
- VALID-01: OpenCode installation validated with 4 tests -- layout, path transformation from ~/.claude/ to XDG path, flat gsd-*.md naming, KB path shared
- VALID-02: Gemini installation validated with 4 tests -- layout, path transformation from ~/.claude/ to ~/.gemini/, .toml command format, KB path shared
- VALID-03: Multi-runtime --all install validated with 5 tests -- all 4 runtimes have correct layouts, no cross-runtime path leakage, format-correct command files per runtime, shared KB directory with correct structure, consistent VERSION files
- Full test suite: 127 passing (up from 105 baseline), zero regressions
- Three reusable helper functions for future validation tests

## Task Commits
1. **Task 1: Create per-runtime deep validation tests (VALID-01, VALID-02)** - `84eae8a`
2. **Task 2: Add multi-runtime --all deep validation tests (VALID-03)** - `3244820`

## Files Created/Modified
- `tests/integration/multi-runtime.test.js` - 501 lines, 13 tests covering VALID-01, VALID-02, VALID-03 with reusable helpers for layout/path/KB validation

## Decisions & Deviations

### Decisions Made
1. Created `tests/integration/multi-runtime.test.js` as a standalone file rather than extending `install.test.js` to keep validation concerns separate from unit tests
2. Used `tmpdirTest.todo()` placeholders for VALID-03 in Task 1 to keep intermediate commits green (Vitest errors on empty describe blocks)
3. Parameterized `verifyRuntimeLayout` with optional `configHome` for OpenCode's XDG path determinism

### Deviations from Plan
None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All VALID-01, VALID-02, VALID-03 requirements fully tested
- Reusable helpers available for 17-02 (cross-runtime KB validation, VALID-04)
- Test infrastructure proven: tmpdir isolation, execSync with HOME override, recursive content scanning
- Full suite green at 127 tests
