---
id: sig-2026-04-09-execute-phase-no-uncommitted-artifact-check
type: signal
project: get-shit-done-reflect
tags:
  - execute-phase
  - orchestrator
  - uncommitted-artifacts
  - worktree
  - planning-docs
created: "2026-04-09T21:30:00.000Z"
updated: "2026-04-09T21:30:00.000Z"
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
  - sig-2026-04-09-orchestrator-skipped-log-sensor-despite-discovery
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.3+dev
---

## What Happened

During Phase 57 execution, the two PLAN.md files (57-01-PLAN.md and 57-02-PLAN.md) had uncommitted modifications from the planning session. The execute-phase orchestrator spawned worktree-based executor agents without noticing or committing these dirty files. The modifications (minor text corrections like "two" → "three" edits) were carried as dirty working-directory state through the entire execution — both plan executions, verification, signal collection, and all postludes — without ever being committed.

The user discovered the issue post-execution when asking about working directory state: `git status` showed 4 uncommitted files including both plans and config.json (automation stats).

## Context

The execute-phase workflow's worktree isolation architecture means executor agents work on clean worktree copies based on the committed state. Any uncommitted changes in the main repo's working directory are invisible to executors. This is normally a feature (isolation), but it becomes a gap when planning artifacts from a prior session are left uncommitted — the executors work against stale plan content.

In this case the plan text corrections were trivial (no impact on execution), but a more substantial uncommitted change (e.g., a corrected task action or modified verification command) would have caused the executor to follow an outdated plan without any indication.

This is related to a prior signal about CONTEXT.md files being left uncommitted after discuss-phase (sig in log sensor output, session f13b8b3f — user noted "this is like the second time").

## Potential Cause

The execute-phase workflow has no pre-flight check for uncommitted files in the phase directory before spawning agents. The workflow reads PLAN.md files to determine wave grouping (via `phase-plan-index`), but this reads from disk (seeing current content) while executors work from the last committed state (via worktree). The gap between "what the orchestrator sees" and "what executors get" is undetected.

A simple `git status --short {phase_dir}` check before the first agent spawn would surface this.
