---
id: sig-2026-04-10-phase-574-context-md-missing-reading-order
type: signal
project: get-shit-done-reflect
tags: [session-log, user-correction, process-friction, context-checker-blind-spot, self-referential-gap, reading-order]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: "57.4"
plan: "0"
polarity: negative
source: local
occurrence_count: 1
related_signals:
  - sig-2026-04-10-discuss-phase-authority-weighting-gap
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
environment:
  os: linux
  node_version: unknown
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-10T21:55:15Z"
evidence:
  supporting:
    - "Session 09422ed4 L423 USER: 'have you indicated that reading order in the context'"
    - "Session 09422ed4 L426 ASSIST: 'No. I put the reading order in STATE.md Session Continuity and in my response to you, but not in CONTEXT.md itself. That is a gap — CONTEXT.md is what a fresh plan-phase session reads'"
    - "Session 09422ed4 L438 ASSIST: 'the framing correction was self-referential (it documented a pattern but did not close the loop by putting its own lesson in the place a planner would encounter it first).'"
  counter:
    - "This was caught and fixed in the same session before execution began"
    - "The user caught this efficiently (one question)"
    - "No plan artifact was written against the incomplete context"
confidence: high
confidence_basis: "Direct log evidence from session 09422ed4 L423-438 with the assistant's own acknowledgment of the gap as a self-referential failure."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During Phase 57.4 planning context preparation, the orchestrator documented the authority-weighting lesson (deliberations > reference files) in STATE.md's Session Continuity and in the conversation itself, but did not place it in CONTEXT.md. The user caught this at session 09422ed4 L423 with a single question: "have you indicated that reading order in the context". The orchestrator acknowledged at L426: "No. I put the reading order in STATE.md Session Continuity and in my response to you, but not in CONTEXT.md itself. That is a gap — CONTEXT.md is what a fresh plan-phase session reads."

The orchestrator named this a self-referential gap at L438: "the framing correction was self-referential (it documented a pattern but did not close the loop by putting its own lesson in the place a planner would encounter it first)."

## Context

- Phase 57.4 planning context preparation (session 09422ed4)
- Documents involved: STATE.md (Session Continuity section), CONTEXT.md (phase context document), and conversational response
- Gap: the authority-weighting lesson was placed in 2 of 3 relevant locations, missing CONTEXT.md
- Recovery: the user caught the gap with one question, the orchestrator fixed it before execution began

## Potential Cause

The orchestrator treated "documenting the lesson" as complete when the lesson was recorded in the most prominent status tracker (STATE.md) and in the conversational exchange with the user. But the most relevant audience for the lesson was a fresh plan-phase session reader, and that reader's primary context source is CONTEXT.md — not STATE.md's Session Continuity, not the conversation log.

This is a specific instance of a more general pattern: orchestrators distinguish between "recorded" and "placed in the right location for the reader who needs it." Recording is necessary but not sufficient; placement is what closes the loop. The gap is self-referential in an instructive way: the lesson being documented was "the most recent deliberations should be weighted more heavily" (authority-weighting), and the gap was a failure to weight the most relevant location highly enough to put the lesson there.

This is `minor` because the recovery cycle was fast (user → orchestrator acknowledgment → fix, all in one session). But the self-referential nature is noteworthy: the orchestrator had just finished documenting a lesson about context-placement, and then failed to place that very lesson in context. This kind of gap suggests the orchestrator's context-placement reasoning is not recursive — it applies the lesson to future plans but not to the current session's own artifacts.

Possible framework improvement: after any "lesson documented" event, run a quick check of the form "is this lesson placed in the location a first-time reader would encounter?" — effectively forcing the orchestrator to re-apply the newly-documented lesson to its own current work.
