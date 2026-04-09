---
id: sig-2026-04-09-state-md-stale-after-worktree-merge
type: signal
project: get-shit-done-reflect
tags: [state-sync, worktree, merge-conflict, execute-phase, orchestrator-gap]
created: "2026-04-09T01:50:00.000Z"
updated: "2026-04-09T01:50:00.000Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: "55.1"
plan: ""
polarity: negative
source: manual
detection_method: user-prompted
origin: conversation
occurrence_count: 2
related_signals: [sig-2026-03-28-state-md-progress-was-stale-at-91-plan]
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.19.1"
---

## What Happened

After execute-phase completed Phase 55.1 (2 waves, 2 plans, worktree isolation), STATE.md contained:
1. **Wrong current phase:** Showed "Phase 57" instead of "Phase 55.2" (next phase)
2. **Garbled quick task table row:** `| Phase 55.1 P02 | 7min | 2 tasks | 8 files |` injected into the Quick Tasks table by the executor agent
3. **Stale session continuity:** Pointed at "Completed 55.1-02-PLAN.md" instead of phase completion status

The user had to manually prompt "anything to finish up before I clear?" to trigger cleanup. Without this prompt, the next session would have resumed with incorrect project state.

## Context

- Phase 55.1 executed via worktree isolation (2 waves, each spawning a gsdr-executor in a worktree)
- Wave 1 merge had a STATE.md conflict resolved with `--theirs` (taking the worktree version)
- Wave 2 commits landed directly on the phase branch (worktree auto-merged)
- The execute-phase orchestrator's `update_roadmap` step updated ROADMAP.md plan checkboxes and progress table but did NOT perform a comprehensive STATE.md reconciliation
- The orchestrator assumed STATE.md would be correct after executor updates, but executors only update their local view (plan position, timing), not the overall phase/milestone position

## Potential Cause

**Root cause:** The execute-phase workflow's `update_roadmap` step does not include STATE.md reconciliation after all worktree merges complete. Each executor updates STATE.md within its worktree, but these updates reflect plan-level state, not phase-level state. When merges resolve conflicts with `--theirs`, the orchestrator's STATE.md context (which had the correct phase position from init) gets overwritten.

**Contributing factor:** The `--theirs` merge conflict resolution for STATE.md is a blunt instrument. It takes the executor's version wholesale, losing any orchestrator-side edits (session continuity, current position updates from between waves).

**Recurrence pattern:** This is the second STATE.md staleness signal (related: sig-2026-03-28). The previous signal was about stale progress percentage. This one is about stale position and garbled content — a more severe variant of the same underlying gap.

**Fix direction:** The orchestrator should perform a STATE.md reconciliation pass after the final wave completes and before `update_roadmap` commits. This pass should set: current phase position, session continuity, and validate table integrity (no garbled rows from executor side-effects).
