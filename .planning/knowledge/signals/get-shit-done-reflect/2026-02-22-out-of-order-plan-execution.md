---
id: sig-2026-02-22-out-of-order-plan-execution
type: signal
project: get-shit-done-reflect
tags:
  - execution-order
  - wave-execution
  - ordering
  - commit-timing
created: "2026-02-22T00:00:00Z"
updated: "2026-02-22T00:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 22
plan: 0
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-02-22-plan-22-03-incomplete-interrupted]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
detection_method: automated
origin: collect-signals
---

## What Happened

The Phase 22 wave-2 plans (22-02, 22-03, 22-04) executed in an unexpected order. Based on commit timestamps, Plan 22-04's first commit (022d068, 16:02:04) occurred BEFORE Plan 22-03's commit (0b51f15, 16:04:33). The commit labeled as Plan 22-04 Task 1 ran 2.5 minutes before Plan 22-03's only commit. Plan 22-04's Task 2 commit (c369df3, 16:02:40) also preceded Plan 22-03.

This means plans ran in the order: 22-02 → [22-04] → [22-03 partial] rather than the expected parallel or independent order. The 22-04 executor was working on (or had already committed) its tasks while 22-03 had not yet completed Task 1.

## Context

Phase 22 wave-2 consisted of Plans 22-02, 22-03, and 22-04, all depending only on 22-01. The orchestrator spawned all three as parallel tasks. The commit timestamps show 22-04 work completing before 22-03 work, suggesting either: (a) 22-04 was spawned first, or (b) 22-04 ran faster and completed while 22-03 was mid-execution. The result is that the debugger extraction (a 22-03 task) was included in a 22-04 commit with a mismatched commit message.

## Potential Cause

Parallel task spawning without guaranteed execution order. When an orchestrator spawns wave-2 plans simultaneously, agent execution speed determines completion order rather than plan number. This is expected behavior for wave-parallel execution, but it caused cross-contamination when Plan 22-03's scope (debugger) ended up being executed by the 22-04 agent instead. The root cause of the cross-contamination is Plan 22-03's interruption mid-execution.
