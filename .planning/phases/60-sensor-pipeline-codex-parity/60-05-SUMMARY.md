---
phase: 60-sensor-pipeline-codex-parity
plan: "05"
signature:
  role: executor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5
  reasoning_effort: xhigh
  profile: quality
  gsd_version: 1.19.8+dev
  generated_at: "2026-04-21T21:11:46Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: derived
    reasoning_effort: derived
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: derived_from_harness
    platform: derived_from_harness
    vendor: derived_from_harness
    model: runtime_context
    reasoning_effort: codex_profile_resolution
    profile: config
    gsd_version: repo_mirror
    generated_at: writer_clock
    session_id: not_available
context_used_pct: 47
subsystem: installer-parity
tags:
  - installer
  - cross-runtime
  - codex-parity
  - sens-06
  - tests
requires:
  - phase: 60-01
    provides: exported installer primitives and shared phase groundwork
  - phase: 60-04
    provides: wave-ordering substrate for parity and drift follow-through
provides:
  - post-install parity detection for Claude and Codex installs
  - `gsd-parity-report.json` as the programmatic parity surface
  - unit and integration regression coverage for honest-skip and divergence cases
affects:
  - bin/install.js
  - installer
  - codex-runtime-parity
tech-stack:
  added:
    - node-stdlib
  patterns:
    - advisory-post-install-parity-report
    - honest-skip-reason-reporting
    - testable-runtime-directory-override
key-files:
  created:
    - tests/unit/cross-runtime-parity.test.js
  modified:
    - bin/install.js
    - tests/integration/multi-runtime.test.js
key-decisions:
  - "Parity checks stay advisory-only and never block or prompt during install."
  - "The parity report reads installed VERSION data first and still writes an artifact for honest skips."
  - "checkCrossRuntimeParity accepts an optional other-runtime directory override so integration tests can exercise real temp installs without stubbing getGlobalDir."
patterns-established:
  - "Installer parity artifact: each runtime install writes its own `gsd-parity-report.json` beside the manifest."
  - "Honest skip semantics: missing or unreadable peer installs produce explicit `reason` values instead of silent success."
duration: 6min
completed: 2026-04-21
---

# Phase 60 Plan 05: Cross-Runtime Parity Summary

**Post-install parity checks now emit advisory JSON reports and remediation commands whenever Claude and Codex drift.**

## Performance
- **Duration:** 6min
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `checkCrossRuntimeParity()` to `bin/install.js`, wired immediately after `reportLocalPatches()` on both the Claude and Codex install branches, and exported it for direct regression coverage.
- Shipped `gsd-parity-report.json` as the installer-side programmatic surface for divergence and honest-skip outcomes, with advisory stdout only when versions diverge.
- Added dedicated unit coverage and multi-runtime integration coverage for divergence detection, skip reasons, remediation commands, symmetric Codex/Claude behavior, and install-time report wiring.

## Task Commits
1. **Task 1: Implement `checkCrossRuntimeParity()` and wire insertion points in `bin/install.js`** - `a7280835`
2. **Task 2: Unit + integration test coverage for cross-runtime parity** - `3d24b06b`

## Files Created/Modified
- `bin/install.js` - parity helper, report-writing helpers, Claude/Codex install wiring, and module export
- `tests/unit/cross-runtime-parity.test.js` - direct unit coverage for divergence, honest skips, advisory output, and reverse-direction calls
- `tests/integration/multi-runtime.test.js` - installer-driven parity checks for absent-runtime skips and divergent cross-runtime reports

## Decisions Made
- Kept parity checks advisory-only in v1.20, matching the plan’s CI-safe requirement and deferring any TTY prompt behavior.
- Read installed `VERSION` files first so parity reports reflect what each runtime actually has on disk, while still falling back to manifest data if needed.
- Added a narrow `otherRuntimeDir` override for tests instead of stubbing path-resolution helpers, so integration coverage operates on real temp install directories.

## Deviations from Plan

None in shipped code. During execution, an initial local Task 2 commit accidentally staged three out-of-boundary 60-06 files that were untracked in the worktree; I corrected that immediately with a non-destructive `git reset --mixed HEAD^` and re-committed only the two owned test files as `3d24b06b`.

## Verification
- `grep -c "function checkCrossRuntimeParity" bin/install.js` -> `1`
- `grep -c "checkCrossRuntimeParity(targetDir" bin/install.js` -> `2`
- `grep -c "gsd-parity-report.json" bin/install.js` -> `3`
- `grep -c "other_runtime_not_installed" bin/install.js` -> `1`
- `grep -c "other_manifest_unreadable" bin/install.js` -> `1`
- `node -e "const e = require('./bin/install.js'); console.log(typeof e.checkCrossRuntimeParity)"` -> `function`
- `npx vitest run tests/unit/cross-runtime-parity.test.js` -> passed (`7` tests)
- `npx vitest run tests/integration/multi-runtime.test.js` -> passed (`24` tests)
- `npm test` -> passed (`52` test files, `789` tests; `1` file skipped, `4` todo)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plan `60-06` can rely on the shipped parity artifact and installer-side drift detection without reintroducing version/path probing. Phase 60 now has both the patch classifier substrate from `60-04` and the installer parity surface needed to close the single-project cross-runtime drift loop.

## Self-Check: PASSED

- Found `.planning/phases/60-sensor-pipeline-codex-parity/60-05-SUMMARY.md`
- Found task commits `a7280835` and `3d24b06b`
