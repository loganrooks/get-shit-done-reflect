---
phase: 36-foundation-fix
plan: 01
subsystem: testing
tags: [ci, wiring-validation, test-hygiene, dual-directory]
requires:
  - phase: 36-RESEARCH
    provides: "Line-by-line inventory of .claude/ assertion paths needing change"
provides:
  - "All wiring-validation assertions target agents/ (npm source) not .claude/agents/ (install target)"
  - "Meta-test preventing recurrence of .claude/ primary assertion paths in any test file"
  - "CI-trustworthy wiring tests (no longer depend on force-tracked .claude/ files)"
affects: [ci-pipeline, wiring-validation]
tech-stack:
  added: []
  patterns: ["npm-source-first assertion", "meta-test recurrence guard"]
key-files:
  created: []
  modified:
    - tests/integration/wiring-validation.test.js
key-decisions:
  - "Three specific regex patterns for meta-test detection (readMdFiles, path.join, pathExists) rather than broad .claude/ grep to avoid false positives"
  - "Four exempt files in meta-test: install.test.js, multi-runtime.test.js, cross-runtime-kb.test.js, kb-infrastructure.test.js"
  - "Fixed extractAtRefs to strip trailing asterisks from @-references (markdown bold syntax leak)"
patterns-established:
  - "npm-source-first assertion: Tests assert against agents/ (canonical source), not .claude/agents/ (derived copy)"
  - "Meta-test recurrence guard: Automated scan of all test files prevents reintroduction of anti-patterns"
duration: 3min
completed: 2026-03-03
---

# Phase 36 Plan 01: Fix Wiring Test Assertion Paths Summary

**All wiring-validation assertions now target agents/ (npm source) with a meta-test preventing recurrence of .claude/ assertion paths**

## Performance
- **Duration:** 3min
- **Tasks:** 2/2 completed
- **Files modified:** 1

## Accomplishments
- Fixed 13 `.claude/agents/` primary assertion paths in wiring-validation.test.js to use `agents/` (npm source)
- Fixed `refToRepoPath` to map `~/.claude/agents/` to `agents/` instead of `.claude/agents/`
- Simplified reflect/spike command tests to read directly from `commands/gsd/` without `.claude/` fallback
- Added meta-test under 'test hygiene' that scans all test files for `.claude/` primary assertion patterns
- Test count increased from 155 to 156 (all passing)

## Task Commits
1. **Task 1: Fix all .claude/ primary assertion paths to use agents/ (npm source)** - `07b7dd1`
2. **Task 2: Add meta-test to prevent .claude/ assertion path recurrence** - `632fd18`

## Files Created/Modified
- `tests/integration/wiring-validation.test.js` - Fixed 13 assertion paths from .claude/agents/ to agents/, added extractAtRefs asterisk stripping, simplified reflect/spike command tests, added meta-test recurrence guard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed extractAtRefs trailing asterisk stripping**
- **Found during:** Task 1 verification
- **Issue:** `gsd-executor.md` contains `@~/.claude/get-shit-done/references/checkpoints.md**` (markdown bold syntax). The `extractAtRefs` function's punctuation strip regex (`/[`.,;:]+$/`) did not include `*`, causing the reference to resolve as `checkpoints.md**` (non-existent file).
- **Fix:** Added `*` to the trailing punctuation strip regex: `/[`.,;:*]+$/`
- **Files modified:** tests/integration/wiring-validation.test.js
- **Commit:** 07b7dd1

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
CI pipeline is now trustworthy for wiring validation. The meta-test will prevent any future test from reintroducing `.claude/` as a primary assertion path. Phase 37 (Automation Framework) can proceed without CI integrity concerns.

## Self-Check: PASSED
- tests/integration/wiring-validation.test.js: FOUND
- 36-01-SUMMARY.md: FOUND
- Commit 07b7dd1: FOUND
- Commit 632fd18: FOUND
