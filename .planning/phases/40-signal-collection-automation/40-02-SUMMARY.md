---
phase: 40-signal-collection-automation
plan: 02
subsystem: automation
tags: [auto-collection, postlude, execute-phase, signal-collection, cross-runtime]
requires:
  - phase: 40-signal-collection-automation
    plan: 01
    provides: "lock/unlock/check-lock/regime-change automation subcommands"
  - phase: 37-automation-framework
    provides: "resolve-level and track-event automation subcommands"
  - phase: 38-extensible-sensor-architecture
    provides: "collect-signals workflow with auto-discovery"
provides:
  - "auto_collect_signals postlude step in execute-phase.md"
  - "Automatic signal collection after successful phase verification"
  - "Cross-runtime signal auto-collection (workflow postlude, not hook-based)"
affects: [execute-phase, signal-collection, collect-signals]
tech-stack:
  added: []
  patterns: [workflow-postlude, reentrancy-guard, context-aware-deferral, wave-based-context-estimation]
key-files:
  created: []
  modified:
    - "get-shit-done/workflows/execute-phase.md"
    - "package.json (vite pin for Node 18 compat)"
key-decisions:
  - "Postlude pattern (workflow step) instead of hook-based triggering for cross-runtime compatibility"
  - "Wave count as context percentage proxy: min(40 + (waves * 10), 80)"
  - "Pin vite@6 as devDependency to prevent Node 18 ESM breakage from auto-upgrade to v7"
patterns-established:
  - "Workflow postlude: adding steps to execute-phase.md between verification and roadmap update for cross-runtime automation"
duration: 4min
completed: 2026-03-06
---

# Phase 40 Plan 02: Auto-Collection Postlude Integration Summary

**Workflow postlude step in execute-phase.md that auto-triggers signal collection after phase verification with reentrancy guard, automation level resolution, and context-aware deferral**

## Performance
- **Duration:** 4min
- **Tasks:** 2/2 completed
- **Files modified:** 3

## Accomplishments
- Added `auto_collect_signals` step to execute-phase.md between `reconcile_signal_lifecycle` and `update_roadmap`
- Step implements full signal auto-collection flow: reentrancy check, automation level resolution, level branching (manual/nudge/prompt/auto), lock acquisition, collect-signals workflow invocation, lock release, event tracking, and first-run regime change detection
- Context deferral uses wave-based proxy estimation (not hardcoded) to make SIG-05 functional
- CI sensor inclusion is automatic via collect-signals auto-discovery (SIG-02)
- Cross-runtime compatibility is inherent -- all runtimes read the same workflow file (SIG-04)
- Pinned vite@6 as devDependency to fix Node 18 ESM compatibility issue
- Verified local install syncs step with correct path replacement (~/.claude/ to ./.claude/)
- All 233 tests pass

## Task Commits
1. **Task 1: Add auto_collect_signals postlude step to execute-phase.md** - `df82edb`
2. **Task 2: Reinstall locally and verify end-to-end** - `cd13485`

## Files Created/Modified
- `get-shit-done/workflows/execute-phase.md` - Added auto_collect_signals step (121 lines) between reconcile_signal_lifecycle and update_roadmap
- `package.json` - Pinned vite@6 as devDependency for Node 18 compatibility
- `package-lock.json` - Updated lockfile for vite pin

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pinned vite@6 for Node 18 ESM compatibility**
- **Found during:** Task 1 verification
- **Issue:** vitest's dependency vite auto-upgraded to v7.3.1 which requires ESM-only, breaking vitest config loading on Node 18 (ERR_REQUIRE_ESM)
- **Fix:** Pinned vite@^6.4.1 as devDependency to keep CJS compatibility with Node 18
- **Files modified:** package.json, package-lock.json
- **Commit:** cd13485
- **KB consulted, no relevant entries.**

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Phase 40 (Signal Collection Automation) is now complete. Both plans delivered:
- Plan 01: CLI primitives (lock/unlock/check-lock/regime-change)
- Plan 02: Workflow integration (auto_collect_signals postlude step)

The execute-phase workflow now auto-triggers signal collection after successful phase verification, satisfying SIG-01 (auto-trigger), SIG-02 (CI sensor in parallel), SIG-04 (cross-runtime fallback), and SIG-05 (context deferral).

## Self-Check: PASSED
