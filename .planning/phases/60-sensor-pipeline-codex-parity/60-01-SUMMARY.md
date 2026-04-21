---
phase: 60-sensor-pipeline-codex-parity
plan: "01"
signature:
  role: executor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.8+dev
  generated_at: "2026-04-21T20:39:30Z"
  session_id: "019db1c0-b6af-7300-abc1-80f5bc9ea16b"
  provenance_status:
    role: derived
    harness: derived
    platform: derived
    vendor: derived
    model: derived
    reasoning_effort: not_available
    profile: derived
    gsd_version: exposed
    generated_at: exposed
    session_id: exposed
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: runtime_context
    vendor: runtime_context
    model: runtime_context
    reasoning_effort: not_available
    profile: config
    gsd_version: installed_harness
    generated_at: writer_clock
    session_id: env:CODEX_THREAD_ID
context_used_pct: 34
subsystem: installer-parity
tags: [phase-60, codex, install-js, exports, parity-research]
requires:
  - phase: 58.1-codex-update-distribution-parity
    provides: "centralized runtime path resolution and the source-vs-installed parity discipline reused by this plan"
provides:
  - "cross-runtime parity research doc refreshed to the 2026-04-21 live audit facts"
  - "install.js exports the manifest, patch, runtime-path, and tool-map helpers downstream Phase 60 plans import"
  - "unit coverage locks the new module.exports surface so silent de-exports fail in CI"
affects: [phase-60-wave-2, 60-03, 60-04, 60-05, 60-06, XRT-02]
tech-stack:
  added: []
  patterns:
    - "additive module.exports expansion with no installer behavior change"
    - "structural regression guard for downstream require() surfaces"
key-files:
  created:
    - ".planning/phases/60-sensor-pipeline-codex-parity/60-01-SUMMARY.md"
  modified:
    - ".planning/research/cross-runtime-parity-research.md"
    - "bin/install.js"
    - "tests/unit/install.test.js"
    - ".planning/STATE.md"
key-decisions:
  - "Recorded the live-audit truth of 7 response_item payload types in §1.3 because the corpus re-check contradicted the plan text that still said 5."
  - "Kept the install.js change strictly additive: existing exports stayed in place and only the Phase 60 consumer helpers/constants were exposed."
patterns-established:
  - "Export-surface lock test: downstream install.js helper imports now have a dedicated unit assertion block."
duration: 5min
completed: 2026-04-21
---

# Phase 60 Plan 01: Audit Reconciliation + Installer Export Surface Summary

**Refreshed the Codex parity reference doc to the 2026-04-21 live audit and exposed the installer helpers that Phase 60's downstream consumers import, with a structural regression test guarding that export surface.**

## Performance

- **Duration:** 5min
- **Tasks:** 2 of 2 completed
- **Files modified:** 5

## Accomplishments

- Updated `.planning/research/cross-runtime-parity-research.md` with the current Codex facts: `0.121.0`, `logs_2.sqlite`, `multi_agent_v2`, refreshed validation commands, and the live session event vocabulary needed by the Phase 60 sensor work.
- Extended `bin/install.js` `module.exports` with `fileHash`, `generateManifest`, `writeManifest`, `saveLocalPatches`, `pruneRedundantPatches`, `reportLocalPatches`, `getGlobalDir`, `claudeToCodexTools`, `PATCHES_DIR_NAME`, and `MANIFEST_NAME` without changing installer behavior.
- Added `Phase 60: module.exports surface` coverage in `tests/unit/install.test.js` so downstream `require('../../bin/install.js')` consumers fail fast if that export surface regresses.

## Task Commits

1. **Task 1: Reconcile G-1 audit drift in cross-runtime-parity-research.md** - `ed9ade9f`
2. **Task 2: Extend bin/install.js module.exports with installer primitives Phase 60 consumers import, and ship regression coverage** - `ae86c796`

## Files Created/Modified

- `.planning/research/cross-runtime-parity-research.md` - refreshed the living parity audit doc to the 2026-04-21 Codex state and added validation commands for the new facts.
- `bin/install.js` - exported the existing manifest, patch, runtime-path, and tool-map helpers/constants required by downstream Phase 60 plans.
- `tests/unit/install.test.js` - added a structural module.exports regression test for the new helper surface.
- `.planning/phases/60-sensor-pipeline-codex-parity/60-01-SUMMARY.md` - execution summary for this plan.
- `.planning/STATE.md` - updated by the GSD state tooling after summary creation.

## Decisions & Deviations

- **Live-audit deviation:** the plan text expected 5 `response_item.payload.type` values, but the re-run corpus check produced 7 (`custom_tool_call`, `custom_tool_call_output`, `function_call`, `function_call_output`, `message`, `reasoning`, `web_search_call`). The summary and research doc record the live result rather than preserving the stale count.
- **Blocking issue auto-resolved:** a transient `.git/index.lock` appeared during Task 2 commit while parallel work was active in the repository. I verified the lock had cleared, then retried the commit without touching anyone else's files.
- **Concurrent work respected:** `tests/unit/verify-xrt-01-capability-matrix.test.js` was modified outside this plan's ownership boundary during execution; it was left untouched and excluded from my commits.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

Plans `60-03`, `60-04`, `60-05`, and `60-06` can now import the installer helpers they were blocked on, and the refreshed research doc is safe to cite for Codex version, storage layout, and event-vocabulary claims.

## Self-Check: PASSED

- `git log --oneline --all | grep -q 'ed9ade9f'` -> FOUND
- `git log --oneline --all | grep -q 'ae86c796'` -> FOUND
- `.planning/research/cross-runtime-parity-research.md` -> FOUND
- `bin/install.js` -> FOUND
- `tests/unit/install.test.js` -> FOUND
- `npx vitest run tests/unit/install.test.js` -> PASS (227 tests)
- `npm test` -> PASS (49 files passed, 1 skipped; 740 tests passed, 4 todo)
