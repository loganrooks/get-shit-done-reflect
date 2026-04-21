---
phase: 60-sensor-pipeline-codex-parity
plan: "04"
signature:
  role: executor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5
  reasoning_effort: xhigh
  profile: quality
  gsd_version: 1.19.8+dev
  generated_at: "2026-04-21T21:01:22Z"
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
context_used_pct: 42
subsystem: sensor-pipeline
tags:
  - patch-sensor
  - codex-parity
  - patch-classifier
  - sens-04
  - sens-05
requires:
  - phase: 60-01
    provides: exported installer primitives and shared phase 60 groundwork
  - phase: 60-02
    provides: supporting phase 60 context and verification substrate
provides:
  - shared patch-classifier library for sensor, CLI, and downstream parity plans
  - drop-a-file patch sensor with structured SENSOR OUTPUT payloads
  - developer-facing `gsd patches` report plus golden-history regression coverage
affects:
  - patch-sensor
  - sensor-pipeline
  - codex-runtime-parity
tech-stack:
  added:
    - node-stdlib
  patterns:
    - shared-classifier-dual-surface
    - capability-matrix-representability-check
    - installed-runtime-safe-optional-loading
key-files:
  created:
    - get-shit-done/bin/lib/patch-classifier.cjs
    - agents/gsd-patch-sensor.md
    - tests/unit/patch-classifier.test.js
    - tests/fixtures/codex-v1175-backup-meta.json
  modified:
    - get-shit-done/bin/gsd-tools.cjs
key-decisions:
  - "One shared classifier library owns patch taxonomy so the sensor and `gsd patches` cannot drift."
  - "Feature-gap versus format-drift is decided by representability from the capability matrix, not by inferred intent."
  - "Patch-classifier loading must degrade safely inside installed runtime mirrors, and `gsd-tools.cjs` only loads it lazily for the `patches` command."
patterns-established:
  - "Dual-surface sensor pattern: one library serves both collect-signals and a developer-facing CLI."
  - "Installed-runtime hardening: source-only installer helpers are optional dependencies with local fallbacks."
duration: 10min
completed: 2026-04-21
---

# Phase 60 Plan 04: Patch Sensor Parity Summary

**Shared patch classification now powers both the patch sensor and `gsd patches`, with capability-aware taxonomy and a 17-file historical regression guard.**

## Performance
- **Duration:** 10min
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments
- Added `get-shit-done/bin/lib/patch-classifier.cjs` as the shared classification library with dogfooding detection, taxonomy output, capability-matrix-aware representability checks, and reusable sensor / CLI entrypoints.
- Added `agents/gsd-patch-sensor.md` and wired `get-shit-done/bin/gsd-tools.cjs` to expose the same classifier through the new `gsd patches` subcommand.
- Added `tests/unit/patch-classifier.test.js` and the `tests/fixtures/codex-v1175-backup-meta.json` golden fixture to lock the five-class taxonomy, dogfooding downgrade, both patch-directory names, and the historical stale classification boundary.

## Task Commits
1. **Task 1: Ship the shared classifier library (get-shit-done/bin/lib/patch-classifier.cjs) with isDogfoodingRepo + classify + capability-matrix-aware Q6 boundary** - `00943c1e`
2. **Task 2: Add the patch sensor drop-a-file spec and the `gsd patches` subcommand surface** - `4369e5b3`
3. **Task 3: Ship unit-test coverage for the classifier library including the 17-file golden fixture** - `3869ce25`

## Files Created/Modified
- `get-shit-done/bin/lib/patch-classifier.cjs` - shared classifier, patch directory scan, capability lookup, sensor payload builder, and CLI formatter
- `agents/gsd-patch-sensor.md` - drop-a-file patch sensor spec that shells into the classifier and emits structured sensor output
- `get-shit-done/bin/gsd-tools.cjs` - new `patches` router branch with lazy classifier loading
- `tests/unit/patch-classifier.test.js` - regression coverage for taxonomy, dogfooding, capability checks, dual patch-directory scan, golden fixture, and sensor output shape
- `tests/fixtures/codex-v1175-backup-meta.json` - 17-entry historical Codex backup fixture used as the canonical stale-classification guard

## Decisions Made
- Kept one shared classifier library as the single source of truth so the sensor and CLI cannot diverge on taxonomy or evidence shape.
- Used `get-shit-done/references/capability-matrix.md` representability rather than guessed intent to separate `feature-gap` from `format-drift`.
- Hardened the classifier for installed runtime mirrors instead of assuming source-repo-only modules are always present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected source-path resolution for installed `get-shit-done-reflect/...` files**
- **Found during:** Task 3 verification while checking live `gsd patches` output against historical patch metadata
- **Issue:** Installed runtime paths were being resolved against the repo root, which recreated the known dogfooding false-positive pattern and misclassified historical entries whose source files moved into `get-shit-done/`
- **Fix:** Mapped installed `get-shit-done-reflect/...` paths back to source `get-shit-done/...` paths and treated historical local-patch-only entries with no installed hash as high-confidence `stale`
- **Files modified:** `get-shit-done/bin/lib/patch-classifier.cjs`
- **Commit:** `3869ce25`
- **Knowledge:** Informed by `sig-2026-02-24-local-patches-false-positive-dogfooding`

**2. [Rule 3 - Blocking Issue] Hardened patch-classifier loading so installed mirrors do not break unrelated commands**
- **Found during:** Task 3 full-suite verification (`npm test`)
- **Issue:** Installed runtime mirrors could not satisfy source-repo-only requires from `patch-classifier.cjs`, and top-level loading in `gsd-tools.cjs` made unrelated commands fail before reaching `patches`
- **Fix:** Added optional/fallback loading for source-only installer helpers in `patch-classifier.cjs` and lazy-loaded the classifier only inside `case 'patches'` in `gsd-tools.cjs`
- **Files modified:** `get-shit-done/bin/lib/patch-classifier.cjs`, `get-shit-done/bin/gsd-tools.cjs`
- **Commit:** `3869ce25`
- **Knowledge:** KB consulted, no relevant entries

## Verification
- `npx vitest run tests/unit/patch-classifier.test.js` -> passed (`27` tests)
- `grep -c "17" tests/unit/patch-classifier.test.js` -> `4`
- `grep -c "isDogfoodingRepo" tests/unit/patch-classifier.test.js` -> `6`
- `grep -c "low_confidence" tests/unit/patch-classifier.test.js` -> `2`
- `npm test` -> passed (`51` test files passed, `1` skipped; `780` tests passed, `4` todo)

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plans `60-05` and `60-06` can now import `get-shit-done/bin/lib/patch-classifier.cjs` as the shared taxonomy and directory-scan substrate. The remaining phase work can build on one stable classification vocabulary instead of duplicating patch drift logic.

## Self-Check: PASSED

- Found `get-shit-done/bin/lib/patch-classifier.cjs`
- Found `agents/gsd-patch-sensor.md`
- Found `tests/fixtures/codex-v1175-backup-meta.json`
- Found `tests/unit/patch-classifier.test.js`
- Found `.planning/phases/60-sensor-pipeline-codex-parity/60-04-SUMMARY.md`
- Found task commits `00943c1e`, `4369e5b3`, and `3869ce25`
