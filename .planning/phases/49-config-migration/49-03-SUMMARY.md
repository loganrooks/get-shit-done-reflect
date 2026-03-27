---
phase: 49-config-migration
plan: 03
model: claude-opus-4-6
context_used_pct: 25
subsystem: core-infrastructure
tags: [upstream-drift, core.cjs, init.cjs, worktree, planning-paths, model-alias]
requires:
  - phase: 48.1
    provides: "Upstream drift ledger routing C3, C5, C6, C8, C9 to Phase 49"
provides:
  - "planningPaths() and planningDir() workstream-aware helpers in core.cjs"
  - "commit_docs gitignore auto-detection in loadConfig()"
  - "resolveWorktreeRoot() for linked worktree resolution"
  - "MODEL_ALIAS_MAP for profile alias to full model ID mapping"
  - "Cross-platform code detection in init.cjs (no Unix find dependency)"
affects: [core.cjs, init.cjs, loadConfig, model-resolution]
tech-stack:
  added: []
  patterns: ["IIFE config auto-detection", "execGit-based worktree resolution", "cross-platform fs.readdirSync code detection"]
key-files:
  created: []
  modified:
    - "get-shit-done/bin/lib/core.cjs"
    - "get-shit-done/bin/lib/init.cjs"
key-decisions:
  - "C6 resolve_model_ids behavioral change deferred to Phase 51 due to conflict with fork cross-runtime model handling"
  - "MODEL_ALIAS_MAP adopted as additive non-conflicting export from C6"
  - "Used upstream workstream-aware signatures for planningPaths/planningDir for forward compatibility"
  - "Removed unused execSync import from init.cjs after find command replacement"
patterns-established:
  - "IIFE auto-detection in loadConfig: self-contained config inference pattern using isGitIgnored"
  - "Workstream-aware path helpers: planningDir(cwd, ws) with GSD_WORKSTREAM env var fallback"
duration: 5min
completed: 2026-03-26
---

# Phase 49 Plan 03: Upstream Drift Cluster Integration Summary

**Absorbed five upstream drift clusters (C3, C5, C6 partial, C8, C9) into core.cjs and init.cjs as compatible patches with zero test regressions**

## Performance
- **Duration:** 5min
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Integrated C9: planningPaths() and planningDir() workstream-aware helpers with forward-compatible signatures
- Integrated C8: commit_docs auto-detection using IIFE pattern with existing isGitIgnored helper
- Integrated C3: resolveWorktreeRoot() using execGit helper for linked worktree detection
- Integrated C5 partial: Replaced Unix-only find command with cross-platform fs.readdirSync recursive walk, broader language/build file detection, and cross-platform HOME detection
- Integrated C6 partial: Added MODEL_ALIAS_MAP for profile alias to full Claude model ID mapping
- All 350 existing tests pass, all fork exports preserved

## Task Commits
1. **Task 1: Integrate C9 (planningPaths) and C8 (commit_docs auto-detect)** - `75ed533`
2. **Task 2: Integrate C3 (worktree resolution), C5 partial (init.cjs HOME), and C6 partial (model alias map)** - `7841456`

## Files Created/Modified
- `get-shit-done/bin/lib/core.cjs` - Added planningPaths, planningDir, resolveWorktreeRoot, MODEL_ALIAS_MAP; updated loadConfig commit_docs with IIFE auto-detect
- `get-shit-done/bin/lib/init.cjs` - Replaced Unix find with cross-platform code detection, cross-platform HOME, expanded language/build file coverage, removed unused execSync import

## Decisions & Deviations

### Decisions
- **C6 partial scope:** The upstream's `resolve_model_ids: 'omit'` support and removal of the `opus -> inherit` mapping in resolveModelInternal conflict with the fork's cross-runtime model handling (Quick 32). Only the additive MODEL_ALIAS_MAP was adopted. The behavioral changes are deferred to Phase 51 (Update System Hardening) where the fork's model resolution strategy can be reconciled with upstream's.
- **Workstream-aware signatures:** Adopted upstream's `planningDir(cwd, ws)` and `planningPaths(cwd, ws)` signatures (with GSD_WORKSTREAM env var support) for forward compatibility, even though the fork does not currently use workstreams.
- **init.cjs execSync cleanup:** Removed the unused `execSync` import after replacing the find command, since no other code in init.cjs uses it.

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Expanded package file detection in init.cjs**
- **Found during:** Task 2 (C5 integration)
- **Issue:** Upstream init.cjs detects 16 build/package file types; fork only detected 5
- **Fix:** Adopted upstream's broader coverage (build.gradle, pom.xml, Gemfile, composer.json, etc.)
- **Files modified:** get-shit-done/bin/lib/init.cjs
- **Commit:** 00c0a62

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- core.cjs now exports planningPaths, planningDir, resolveWorktreeRoot, and MODEL_ALIAS_MAP for downstream consumers
- C6 reconciliation flagged for Phase 51 (resolve_model_ids behavior vs fork cross-runtime handling)
- All fork-specific exports (parseIncludeFlag, loadManifest, loadProjectConfig, atomicWriteJson) confirmed intact

## Self-Check: PASSED

- core.cjs: FOUND
- init.cjs: FOUND
- 49-03-SUMMARY.md: FOUND
- Commit 75ed533: FOUND
- Commit 7841456: FOUND
