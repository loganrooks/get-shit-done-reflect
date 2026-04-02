---
id: sig-2026-04-02-quick-task-code-changes-committed-directly-to-main
type: signal
project: get-shit-done-reflect
tags: [quick-task, branching, ci-quality-gate, workflow-gap, git-workflow]
created: 2026-04-02T23:25:00.000Z
updated: 2026-04-02T23:25:00.000Z
durability: convention
status: active
severity: critical
signal_type: deviation
phase: n/a
plan: n/a
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-03-28-squash-merge-destroys-commit-history]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.18.2+dev
---

## What Happened

Quick task 260402-qnh (fix model resolver gsdr- prefix, Issue #30) committed runtime code changes (`core.cjs`, `commands.cjs`) and new tests directly to `main` without a branch, PR, or CI quality gate. The fix modified model resolution logic that affects all agent spawning across both Claude Code and Codex runtimes. This was caught by the user during post-execution review and required manual branch surgery: creating a branch from HEAD, resetting main, and opening PR #31.

## Context

The quick task workflow (`workflows/quick.md`) uses `init quick` which returns a `branch_name` based on the project's branching strategy config (`"branching_strategy": "phase"`). The `"phase"` strategy only generates branch names for phase work, not quick tasks — so `branch_name` was empty and the workflow committed directly to main.

This is appropriate for documentation-only quick tasks (STATE.md updates, signal commits, deliberation notes). But quick task 260402-qnh changed runtime code that should have gone through CI before reaching main. The workflow makes no distinction between docs-only and code-changing quick tasks.

## Potential Cause

The branching strategy config is too coarse — it distinguishes "phase vs quick" but not "code-changing vs docs-only." Options:

1. **Always branch quick tasks** — safest but adds ceremony to trivial docs updates
2. **Detect code file changes in plan** — if the plan's `files_modified` includes non-docs files (`.cjs`, `.js`, `.ts`, etc.), auto-branch
3. **Add a `--branch` flag to quick tasks** — manual opt-in for code changes
4. **Change default** — make `"phase"` strategy also branch quick tasks, add a `"phase-only"` for the old behavior

Option 2 (auto-detect) is the most robust. The plan already declares `files_modified` in frontmatter — the workflow could inspect those paths and branch when any are non-documentation files.
