---
id: sig-2026-02-23-installer-clobbers-force-tracked-files
type: signal
project: get-shit-done-reflect
tags: [installer, file-deletion, force-tracked, plan-accuracy, deviation]
created: 2026-02-23T21:30:00Z
updated: 2026-02-23T21:30:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 29
plan: 02
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
---

## What Happened

Phase 29 Plan 02 stated "The installer does NOT touch `.claude/agents/` or `.claude/commands/gsd/`" -- this was incorrect. When `node bin/install.js --claude --local` ran, it removed and re-copied the entire `.claude/get-shit-done/` AND `.claude/agents/` directories from source. This deleted 15 force-tracked files that only exist in the deployed `.claude/` location (not in source):
- 3 restored agent specs (gsd-reflector.md, gsd-signal-collector.md, gsd-spike-runner.md) from Phase 28
- 2 restored command files (reflect.md, spike.md) from Phase 28
- 1 shared reference (agent-protocol.md) from Phase 22
- 9 modified agent specs with required_reading references from Phase 22

The executor auto-fixed by restoring all 15 files from HEAD using `git checkout HEAD -- <files>`.

## Context

Phase 29, Plan 02, Task 1. The plan was to redeploy the installer to close an 875-line gap between source and deployed gsd-tools.js. The plan's assumption about installer scope was wrong -- it assumed the installer only touches `get-shit-done/` contents, but the installer actually removes and recreates the entire `.claude/agents/` and `.claude/get-shit-done/` directories.

This is the same installer that was tested with 73 passing tests (install.test.js), but the test suite does not exercise the force-tracked file preservation scenario because tests use temporary directories without git history.

## Potential Cause

The plan author (planner agent during Phase 29 research) did not read the installer's `installSkills()` function deeply enough. The function calls `fs.rmSync(agentDest, { recursive: true })` before `copyWithPathReplacement(agentSrc, agentDest)`, which deletes the entire agents directory including force-tracked files that have no source equivalent. The plan's assertion about installer behavior was based on assumption rather than code reading.

This pattern -- plan assertions about tool behavior without verification -- has occurred before (see `SIG-20260222-loadmanifest-source-repo-path-gap`). Plans should verify assumptions about existing system behavior through code inspection or test runs, not rely on descriptions.
