---
id: sig-2026-03-20-yolo-mode-checkpoint-should-auto-verify
type: signal
project: get-shit-done-reflect
tags:
  - checkpoint
  - yolo-mode
  - orchestrator
  - verification
  - automation
created: "2026-03-20T05:15:00.000Z"
updated: "2026-03-20T05:15:00.000Z"
durability: convention
status: active
severity: notable
signal_type: custom
phase: 46
plan: 03
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.17.5+dev
detection_method: manual
origin: user-observation
---

## What Happened

During Phase 46 Plan 03 execution, the orchestrator presented a checkpoint with verification commands (wc -l, ls | wc -l, npm test) and waited for the user to approve. The user pointed out that in yolo mode, the orchestrator should run these commands itself and auto-approve if they pass, rather than asking the user to run them.

## Context

The execute-phase workflow's checkpoint handling presents verification steps to the user regardless of the project's autonomy mode. In yolo mode (config.mode = "yolo"), the user expects maximum automation. Checkpoint tasks with runnable verification commands (test suites, line counts, file counts) can be self-verified by the orchestrator before presenting results.

The distinction is between:
- **Subjective checkpoints** (design review, UX approval) — always need human input
- **Objective checkpoints** (test pass/fail, file count, line count) — can be auto-verified in yolo mode

## Potential Cause

The checkpoint handling in execute-phase.md does not consult config.mode when deciding whether to pause for user input. The `autonomous: false` flag on plans triggers user interaction regardless of yolo mode. The orchestrator should check if checkpoint verification is objective (runnable commands) and auto-run them when in yolo mode.
