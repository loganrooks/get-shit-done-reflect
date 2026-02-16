---
phase: quick-3
plan: 3
title: "Fix 6 Critical PR#4 Bugs"
subsystem: installer, workflows
tags: [bugfix, installer, codex, symlink, capability-guard, PR-review]
dependency-graph:
  requires: [quick-2]
  provides: [PR#4 merge-ready fixes]
  affects: [PR#4 merge to main]
tech-stack:
  patterns: [runtime-capability-guard, collision-safe-backup, dangling-symlink-detection]
key-files:
  modified:
    - bin/install.js
    - .claude/get-shit-done/workflows/collect-signals.md
    - .claude/get-shit-done/workflows/reflect.md
    - .claude/get-shit-done/workflows/run-spike.md
metrics:
  duration: "~3min"
  completed: "2026-02-16"
---

# Quick Task 3: Fix 6 Critical PR#4 Bugs Summary

**One-liner:** Fixed installer edge cases (backup collision, dangling symlink, absolute path regex) and added runtime capability guards to 3 workflow files for Codex CLI compatibility.

## Tasks Completed

| # | Task | Commit | Key Change |
|---|------|--------|------------|
| 1 | C1: migrateKB backup collision check | 56de066 | Append timestamp suffix when `.migration-backup` already exists |
| 2 | C2: migrateKB dangling symlink handling | e0f556d | Detect dangling symlinks via lstatSync before existsSync check |
| 3 | C3: Codex @ file reference regex for absolute paths | 5c07c21 | Dynamic regex from pathPrefix param, tilde fallback preserved |
| 4 | C4: Capability guard for collect-signals.md | e084cb5 | Inline fallback when Task tool unavailable |
| 5 | C5: Capability guard for reflect.md | 6a9de8e | Inline fallback when Task tool unavailable |
| 6 | C6: Capability guard for run-spike.md | 509936e | Inline fallback when Task tool unavailable |

## Verification

- `npm test`: 155 passed, 0 failures, 4 skipped (e2e tests)
- All 3 workflow files confirmed to have `Runtime capability check` guards
- No syntax errors in install.js
- Existing `convertClaudeToCodexSkill` tests pass with optional 3rd param (backward compatible)

## Technical Details

### Task 1: Backup Collision (bin/install.js)
When `fs.renameSync(oldKBDir, backupDir)` would crash if `.migration-backup` already existed (re-running installer after partial migration), now checks `fs.existsSync(backupDir)` first and appends ISO timestamp suffix on collision.

### Task 2: Dangling Symlink (bin/install.js)
`fs.existsSync()` returns `false` for dangling symlinks, causing the code to skip migration and then fail at Step 3 (symlink creation, path already occupied). Added `fs.lstatSync()` check before `existsSync` to detect and remove dangling symlinks, then recreate pointing to the new location.

### Task 3: Absolute Path Regex (bin/install.js)
`convertClaudeToCodexSkill()` now accepts an optional `pathPrefix` parameter. When provided, builds a dynamic regex from the escaped prefix to match `@/absolute/path/.codex/...` patterns. The tilde fallback regex (`@~/.codex/...`) is always applied for backward compatibility with tests that pass only 2 arguments.

### Tasks 4-6: Capability Guards (workflow files)
All three workflow files (`collect-signals.md`, `reflect.md`, `run-spike.md`) now wrap their agent spawn code in a prose-level capability guard. Runtimes without Task tool support (Codex CLI) get inline execution instructions that reference the agent spec directly.

## Deviations from Plan

None -- plan executed exactly as written.

## What's Next

All 6 critical bugs from PR #4 review are fixed. PR #4 is ready for re-review and merge.
