---
phase: 50-migration-test-hardening
plan: 01
model: claude-opus-4-6
context_used_pct: 25
subsystem: testing
tags: [vitest, namespace, snapshot, regression, installer]
requires:
  - phase: 49-config-migration
    provides: "Completed namespace migration with replacePathsInContent rewriting pipeline"
provides:
  - "TST-01: Full-corpus namespace scan covering all installed file types"
  - "TST-09: Inline snapshot regression tests for replacePathsInContent"
affects: [migration-test-hardening, installer]
tech-stack:
  added: []
  patterns: [inline-snapshot-regression, full-corpus-scan, upstream-runtime-exclusion]
key-files:
  created: []
  modified:
    - tests/unit/install.test.js
key-decisions:
  - "Excluded upstream runtime files (bin/*.cjs, settings.json, CHANGELOG.md) from TST-01 scan since they are intentionally not namespace-rewritten"
  - "Used replacePathsInContent-compatible patterns for hook corpus snapshot (not hook installer's inline regexes)"
patterns-established:
  - "Upstream runtime exclusion: bin/, settings.json, CHANGELOG.md are copied as-is by installer and should not be scanned for stale namespace refs"
duration: 6min
completed: 2026-03-27
---

# Phase 50 Plan 01: Full-corpus namespace scan and snapshot regression tests

**TST-01 full-corpus scan + TST-09 inline snapshot regression for replacePathsInContent across 5 representative corpora**

## Performance
- **Duration:** 6min
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments
- TST-01: Full-corpus namespace scan recursively walks all installed files under .claude/, scanning for stale /gsd:, gsd- prefix, and get-shit-done/ path references
- TST-01 properly excludes upstream runtime modules (bin/), generated config (settings.json), and historical docs (CHANGELOG.md) that are intentionally not namespace-rewritten
- TST-09: 5 inline snapshot regression tests capture replacePathsInContent output for agent, workflow, hook, false-positive boundary, and mixed content corpora
- All 365 vitest tests pass (6 new + 359 existing)

## Task Commits
1. **Task 1: TST-01 full-corpus namespace scan test** - `91c738a`
2. **Task 2: TST-09 snapshot regression tests** - `24eaf74`

## Files Created/Modified
- `tests/unit/install.test.js` - Added TST-01 full-corpus scan test and TST-09 inline snapshot regression tests (186 lines added)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Refined TST-01 scan to exclude upstream runtime files**
- **Found during:** Task 1
- **Issue:** Plan's regex patterns matched legitimate upstream references in bin/lib/*.cjs (upstream module code), settings.json (gsd-test permission patterns), and CHANGELOG.md (historical version entries). These files are intentionally NOT rewritten by replacePathsInContent.
- **Fix:** Added isUpstreamRuntime() exclusion function that filters bin/ subtree, settings.json, settings.local.json, and CHANGELOG.md from the stale-reference scan. Added assertions verifying both rewritten and upstream file populations exist.
- **Files modified:** tests/unit/install.test.js
- **Commit:** 91c738a

**2. [Rule 1 - Bug] Fixed TST-09 hook corpus snapshot to match actual replacePathsInContent behavior**
- **Found during:** Task 2
- **Issue:** Plan specified quoted path.join args ('get-shit-done') as hook corpus input, but replacePathsInContent does NOT rewrite quoted strings without trailing slash -- that transformation is done by the hook installer's inline regex. Snapshot expectation was wrong.
- **Fix:** Changed hook corpus input to use get-shit-done/ paths (with trailing slash) that replacePathsInContent actually handles, producing correct snapshots.
- **Files modified:** tests/unit/install.test.js
- **Commit:** 24eaf74

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TST-01 and TST-09 provide regression safety net for remaining Phase 50 plans (50-02 through 50-05)
- Full corpus scan will catch any future namespace leaks across all installed file types
- Snapshot tests will surface any changes to replacePathsInContent behavior as inline diffs

## Self-Check: PASSED
- 50-01-SUMMARY.md: FOUND
- Commit 91c738a (Task 1): FOUND
- Commit 24eaf74 (Task 2): FOUND
- tests/unit/install.test.js: FOUND
