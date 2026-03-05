---
id: sig-2026-02-17-resume-work-misses-non-phase-handoffs
type: signal
project: get-shit-done-reflect
tags: [resume-work, continue-here, pause-work, milestone-setup, workflow-gap]
created: 2026-02-17T05:43:39Z
updated: 2026-02-17T05:43:39Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase:
plan:
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-02-16-stale-continue-here-files-not-cleaned]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.14.2
---

## What Happened

`/gsd:resume-work` workflow only searches for `.continue-here.md` files within `.planning/phases/*/` directories. When work is paused during between-milestone activities (like mid `/gsd:new-milestone` workflow), the handoff file is written to `.planning/.continue-here.md` (the project root of `.planning/`). The resume workflow cannot find this file because it only scans phase subdirectories.

This means `/gsd:resume-work` fails to restore context for any work paused outside of phase execution — including milestone setup, milestone completion, research phases, and other orchestrator-level workflows.

## Context

Discovered during v1.15 milestone setup. The `/gsd:new-milestone` workflow was paused at Step 9 (requirements scoping) after completing research. `/gsd:pause-work` correctly wrote the handoff to `.planning/.continue-here.md`, but `/gsd:resume-work` would not find it because it only globs `phases/*/.continue-here.md`.

## Potential Cause

The `pause-work.md` and `resume-work.md` workflows were designed during phase execution (v1.12) when all work happened within phase directories. The workflows assume `.continue-here.md` always lives in a phase directory. Between-milestone work (new-milestone, complete-milestone, map-codebase) was not considered as a pause/resume scenario.

Fix: `resume-work.md` should search both `.planning/phases/*/.continue-here.md` AND `.planning/.continue-here.md` for handoff files.
