---
phase: 55-upstream-mini-sync
plan: 01
model: claude-sonnet-4-6
context_used_pct: 18
subsystem: upstream-sync
tags: [upstream, state-locking, model-profiles, atomic-writes, milestone-safety]
requires:
  - phase: 54-sync-retrospective-governance
    provides: FORK-DIVERGENCES.md with merge stances for all modules; confirmed zero fork diff on pure upstream modules
provides:
  - model-profiles.cjs: new upstream module adopted into fork lib/; exports MODEL_PROFILES table and getAgentToModelMapForProfile
  - state.cjs at v1.34.2: TOCTOU-safe locking with acquireStateLock/releaseStateLock, readModifyWriteStateMd, Atomics.wait cross-platform busy-wait, _heldStateLocks process cleanup
  - milestone.cjs at v1.34.2: 999.x backlog preservation during transitions, global regex lastIndex bug fix
  - template.cjs at v1.34.2: upstream correctness fixes applied
  - verify.cjs at v1.34.2: upstream correctness fixes applied
affects: [55-upstream-mini-sync, core.cjs hybrid merge (Plan 02), config.cjs hybrid merge (Plan 03)]
tech-stack:
  added: [model-profiles.cjs (new upstream module)]
  patterns: [read-modify-write locking cycle, SharedArrayBuffer Atomics.wait busy-wait, process.on exit lock cleanup]
key-files:
  created:
    - get-shit-done/bin/lib/model-profiles.cjs
  modified:
    - get-shit-done/bin/lib/state.cjs
    - get-shit-done/bin/lib/milestone.cjs
    - get-shit-done/bin/lib/template.cjs
    - get-shit-done/bin/lib/verify.cjs
key-decisions:
  - "Adopted model-profiles.cjs as-is from upstream f7549d43; plan mentioned resolveModel but upstream exports getAgentToModelMapForProfile -- file is correct upstream version"
  - "Single commit for all 5 files per plan's commit strategy (one commit per merge category: pure upstream adoption)"
patterns-established:
  - "readModifyWriteStateMd: all state writes now go through locked read-modify-write cycle to prevent TOCTOU races"
  - "acquireStateLock with Atomics.wait: cross-platform busy-wait with jitter prevents thundering herd on state lock contention"
duration: 1min
completed: 2026-04-08
---

# Phase 55 Plan 01: Upstream Mini-Sync Foundation Summary

**Adopted model-profiles.cjs (new upstream dependency) and wholesale-replaced 4 pure upstream modules from v1.34.2, bringing TOCTOU-safe state locking and 999.x backlog preservation into the fork.**

## Performance
- **Duration:** ~1 minute
- **Tasks:** 2/2 completed
- **Files modified:** 5 (1 created, 4 replaced)

## Accomplishments
- Adopted model-profiles.cjs (68 lines) from upstream f7549d43 -- new dependency required by core.cjs and config.cjs hybrid merges in Plans 02/03
- Replaced state.cjs (721 -> 1415 lines): acquireStateLock/releaseStateLock with stale lock detection, readModifyWriteStateMd TOCTOU-safe pattern, Atomics.wait cross-platform busy-wait, _heldStateLocks process.on('exit') cleanup
- Replaced milestone.cjs (241 -> 283 lines): 999.x backlog preservation during milestone transitions, global regex lastIndex bug fix
- Replaced template.cjs and verify.cjs with upstream v1.34.2 content
- All 5 files confirmed as zero fork diff -- pure upstream adoption, no fork-specific content lost

## Task Commits
1. **Tasks 1+2: Adopt model-profiles.cjs and replace 4 pure upstream modules** - `08352f3e`

## Files Created/Modified
- `get-shit-done/bin/lib/model-profiles.cjs` - New upstream module: MODEL_PROFILES table (17 agents), VALID_PROFILES, getAgentToModelMapForProfile, formatAgentToModelMapAsTable
- `get-shit-done/bin/lib/state.cjs` - TOCTOU-safe state locking: acquireStateLock, releaseStateLock, readModifyWriteStateMd, Atomics.wait busy-wait (18 occurrences of key locking patterns)
- `get-shit-done/bin/lib/milestone.cjs` - 999.x backlog preservation: `!/^999(?:\.|$)/` filter on milestone transitions
- `get-shit-done/bin/lib/template.cjs` - Upstream v1.34.2 content (222 lines, unchanged structure)
- `get-shit-done/bin/lib/verify.cjs` - Upstream v1.34.2 content (1032 lines, upstream correctness fixes)

## Decisions & Deviations

### Plan Description Discrepancy (auto-noted, not a deviation)
The plan's frontmatter truth says model-profiles.cjs "exports MODEL_PROFILES and resolveModel." The actual upstream file at f7549d43 exports `getAgentToModelMapForProfile` instead of `resolveModel`. The file was adopted as-is from upstream without modification -- the plan description was inaccurate, not the implementation. The file is functionally correct.

### Commit Strategy
Tasks 1 and 2 are committed in a single atomic commit as specified in the plan: "one commit per merge category." Both tasks belong to "pure upstream adoption."

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Plan 02 (core.cjs hybrid merge) and Plan 03 (config.cjs hybrid merge) can now proceed. model-profiles.cjs is in place as required. The foundation layer (pure upstream modules) is at v1.34.2 baseline. The fork's hybrid modules (core.cjs, config.cjs) can be merged knowing that state.cjs now provides readModifyWriteStateMd and that model-profiles.cjs is available for their require() calls.

## Self-Check: PASSED
- `get-shit-done/bin/lib/model-profiles.cjs` - FOUND (71 lines, exports MODEL_PROFILES + getAgentToModelMapForProfile)
- `get-shit-done/bin/lib/state.cjs` - FOUND (1415 lines, acquireStateLock confirmed)
- `get-shit-done/bin/lib/milestone.cjs` - FOUND (283 lines, 999.x pattern confirmed)
- `get-shit-done/bin/lib/template.cjs` - FOUND (222 lines, module.exports confirmed)
- `get-shit-done/bin/lib/verify.cjs` - FOUND (1032 lines, module.exports confirmed)
- Commit `08352f3e` - FOUND (feat(55-01): adopt model-profiles.cjs and replace 4 pure upstream modules from v1.34.2)
