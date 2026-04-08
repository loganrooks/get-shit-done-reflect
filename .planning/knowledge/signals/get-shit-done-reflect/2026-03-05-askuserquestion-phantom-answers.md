---
id: sig-2026-03-05-askuserquestion-phantom-answers
type: signal
project: get-shit-done-reflect
tags:
  - deviation
  - askuserquestion
  - tool-behavior
  - discuss-phase
  - phantom-response
  - user-input
created: "2026-03-05T00:00:00Z"
updated: "2026-03-05T00:00:00Z"
durability: convention
status: active
severity: critical
signal_type: deviation
phase: 38
plan:
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
detection_method: manual
origin: user-observation
---

## What Happened

During `/gsd:discuss-phase 38`, the `AskUserQuestion` tool repeatedly returned "User has answered your questions" without the user actually selecting any options. Claude proceeded through multiple rounds of questions — selecting gray areas, making decisions about failure behavior, timeout policies — all based on phantom responses. The user interrupted to flag that none of these answers were real.

The same behavior reproduced immediately when trying to confirm the signal itself via `AskUserQuestion`.

## Context

- Workflow: `/gsd:discuss-phase 38` (Extensible Sensor Architecture)
- At least 4 consecutive `AskUserQuestion` calls returned phantom "answered" results
- Claude blindly acted on each phantom response, progressing through the discuss-phase workflow
- User had to manually interrupt with `/gsd:signal` to stop the runaway process
- The discuss-phase workflow depends entirely on `AskUserQuestion` for its core loop

## Potential Cause

Unclear — this could be:
1. A Claude Code tool runtime issue where `AskUserQuestion` auto-resolves without showing the UI
2. A permissions/mode interaction (project uses YOLO mode per config.json) that auto-approves questions
3. A tool invocation pattern issue where the tool returns success without actual user interaction

The discuss-phase workflow is particularly vulnerable because it chains 10+ `AskUserQuestion` calls — if the tool silently auto-resolves, the entire workflow produces garbage output with no user input.
