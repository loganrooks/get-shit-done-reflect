---
phase: 11-test-suite-repair
plan: 03
subsystem: testing
tags: [ci-cd, github-actions, install-test, vitest, node-test, gsd-tools]

# Dependency graph
requires:
  - phase: 11-test-suite-repair
    provides: "Wiring validation tests (Plan 01) and fork config tests (Plan 02)"
  - phase: 08-core-merge
    provides: "Merged installer with --claude/--opencode/--gemini runtime flags"
provides:
  - "CI pipeline running vitest + upstream gsd-tools + fork gsd-tools test suites"
  - "Publish pipeline gating on upstream and fork tests before npm publish"
  - "Install test coverage for merged installer runtime flag behavior"
  - "Locally verified all-green test battery on sync branch"
affects: [12-release-prep]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Subprocess install testing via execSync with HOME/XDG_CONFIG_HOME override"
    - "CI pipeline test ordering: vitest -> infra -> upstream -> fork -> install verification"

key-files:
  created: []
  modified:
    - .github/workflows/ci.yml
    - .github/workflows/publish.yml
    - tests/unit/install.test.js

key-decisions:
  - "Used --global flag in subprocess install tests to bypass interactive prompts"
  - "Tested --opencode via XDG_CONFIG_HOME env var override for controlled output location"

patterns-established:
  - "Three-tier test pipeline: vitest (fork unit/integration) + node --test (upstream) + node --test (fork gsd-tools)"

# Metrics
duration: 3min
completed: 2026-02-11
---

# Phase 11 Plan 03: CI/CD Workflow Updates & Install Flag Tests Summary

**CI/CD pipelines updated to run upstream and fork gsd-tools tests alongside vitest, plus subprocess-based install flag tests validating --claude/--opencode/--gemini runtime behavior**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-11T07:27:35Z
- **Completed:** 2026-02-11T07:30:45Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Added upstream gsd-tools and fork gsd-tools test steps to CI workflow (after infra tests, before install verification)
- Added upstream and fork test gates to publish workflow (before npm publish step)
- Created 4 subprocess-based install tests covering --claude, --opencode, --claude --opencode, and non-TTY default behavior
- Verified complete test battery locally: 53 vitest + 75 upstream + 7 fork = 135 total tests passing

## Task Commits

Each task was committed atomically:

1. **Task 1: Add upstream and fork test steps to CI and publish workflows** - `b5f41aa` (feat)
2. **Task 2: Update install.test.js with merged installer flag tests** - `dbfd15f` (test)
3. **Task 3: Run complete test battery and verify all-green** - verification only, no code changes

**Plan metadata:** (committed with this summary)

## Files Created/Modified
- `.github/workflows/ci.yml` - Added "Run upstream gsd-tools tests" and "Run fork gsd-tools tests" steps
- `.github/workflows/publish.yml` - Added "Run upstream tests before publish" and "Run fork tests before publish" steps
- `tests/unit/install.test.js` - Added "merged installer flags" describe block with 4 subprocess tests

## Decisions Made
- **Used --global flag in subprocess tests:** Passing `--global` alongside `--claude`/`--opencode` bypasses the interactive prompt location flow, making tests deterministic without TTY. The non-TTY default test verifies the fallback behavior without any flags.
- **Tested --opencode via XDG_CONFIG_HOME override:** Set `XDG_CONFIG_HOME` to a temp directory to control the opencode config output location, avoiding writes to the real `~/.config/opencode`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All three test suites passing: vitest (53 tests), upstream gsd-tools (75 tests), fork gsd-tools (7 tests)
- CI pipeline will run full test battery on PR to main
- Publish pipeline gates on all test suites before npm publish
- Phase 11 complete; ready for Phase 12 (Release Preparation)
- Sync branch is CI-ready for merge to main

---
*Phase: 11-test-suite-repair*
*Completed: 2026-02-11*
