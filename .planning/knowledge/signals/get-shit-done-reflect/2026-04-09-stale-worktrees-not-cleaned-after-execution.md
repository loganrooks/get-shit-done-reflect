---
id: sig-2026-04-09-stale-worktrees-not-cleaned-after-execution
type: signal
project: get-shit-done-reflect
tags:
  - execute-phase
  - orchestrator
  - worktree
  - cleanup
  - post-merge
created: "2026-04-09T21:35:00.000Z"
updated: "2026-04-09T21:35:00.000Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 57
plan: null
polarity: negative
source: manual
occurrence_count: 1
related_signals:
  - sig-2026-04-09-execute-phase-no-uncommitted-artifact-check
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.3+dev
---

## What Happened

After Phase 57 execution completed (2 plans across 2 waves), the execute-phase orchestrator merged worktree branches into the phase branch but left 4 stale worktrees on disk. The user had to ask "what worktrees are still active?" before the orchestrator noticed and cleaned them up.

Two worktrees were from plan execution (agent-add1323b, agent-ad0ded9a), and two were from sensor/verifier agents (agent-a7371bfa, agent-a79c24e8). One required `--force` removal due to modified/untracked files.

## Context

The execute-phase workflow merges worktree branches via `git merge worktree-agent-*` but has no cleanup step to remove the worktrees themselves. Worktrees accumulate across phase executions and consume disk space. The post-merge cleanup convention documented in project memory (checkout main, delete local branch, delete remote branch) doesn't extend to worktree removal.

## Potential Cause

The execute-phase workflow (`execute-phase.md`) handles branch merging but delegates worktree lifecycle to the Agent tool's isolation mechanism. There is no `git worktree remove` step in the workflow after merging. The assumption may be that Claude Code's worktree cleanup handles this, but it evidently does not for worktrees with changes.
