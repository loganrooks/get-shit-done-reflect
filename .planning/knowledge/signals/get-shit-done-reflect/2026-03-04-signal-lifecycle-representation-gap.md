---
id: sig-2026-03-04-signal-lifecycle-representation-gap
type: signal
project: get-shit-done-reflect
tags: [signal-lifecycle, meta-observability, representation-gap, capability-gap, feedback-loop, epistemic-gap]
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T00:00:00Z
durability: convention
status: active
severity: critical
signal_type: capability-gap
phase: 38
plan:
polarity: negative
source: deliberation-trigger
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
---

## What Happened

After 5 milestones (v1.12-v1.16) and 105 completed plans, the knowledge base contains 127 signals: 89 detected, 10 triaged, 0 remediated, 0 verified, 0 invalidated. The lifecycle schema supports 5 states but only 2 have ever been used.

However, the system HAS responded to signals — v1.16 was scoped by deliberating on signal patterns, plans have cited signals, design decisions were made in direct response to observed problems. The gap is not that the system fails to act, but that it fails to track that it acted. The lifecycle metadata is never updated when an intervention addresses a signal.

This is a representation gap: the system's self-model (KB state) diverges from reality (signals were addressed but appear unaddressed). Consequences:

1. Cannot verify whether interventions worked (no before/after comparison)
2. Cannot learn from intervention success/failure (reflection sees stale state)
3. Cannot distinguish "never addressed" from "addressed but unmarked"
4. Reflection operates on 127 "open" signals when many are effectively closed
5. The self-improvement loop is open where it should be closed

## Context

- v1.16 built signal-plan linkage (`resolves_signals` field in plans) but no workflow step triggers lifecycle transitions
- The `collect-signals` workflow detects new signals but never checks whether existing signals have been resolved
- The `execute-phase` workflow commits plans but doesn't update referenced signals
- The `reflect` command triages signals but cannot mark them remediated (no intervention tracking)
- 14 signals have malformed/missing lifecycle fields (data quality gap compounds the representation gap)

## Potential Cause

No workflow integration point exists to trigger lifecycle transitions. The schema was designed (v1.16 Phase 34) but the automation to exercise it was deferred to v1.17. The `resolves_signals` field in plans exists but nothing reads it post-execution to update signal status. This is the gap between "designed the state machine" and "wired the transitions."

Additionally: the system that would detect this gap (signal collection) is itself part of the system that has the gap — a second-order observability problem. No sensor looks at the KB's own health. The observation came from a human noticing "wait, why are all 127 signals still open?"
