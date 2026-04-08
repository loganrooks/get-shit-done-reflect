---
id: sig-2026-02-11-signal-workflow-context-bloat
type: signal
project: get-shit-done-reflect
tags:
  - context-bloat
  - workflow-overhead
  - signal-workflow
  - token-cost
created: "2026-02-11T22:01:00Z"
updated: "2026-02-11T22:01:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: post-17
plan: 0
runtime: claude-code
model: claude-opus-4-6
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-02-11-agent-inline-research-context-bloat]
detection_method: manual
origin: user-observation
---

## What Happened

The /gsd:signal command loads signal.md (246 lines) + signal-detection.md (230 lines) + knowledge-store.md (359 lines) + signal template (29 lines) as required_reading before recording a single signal. That's ~864 lines of context consumed just to write a short markdown file. The signal workflow is itself a source of context bloat.

## Context

User invoked /gsd:signal during a resume-work session to record an observation. The skill execution loaded 4 reference files into context before the workflow even started. User questioned whether this overhead is justified for what is essentially: parse description, fill template, write file, rebuild index.

## Potential Cause

The signal workflow was designed for completeness — dedup checking, cap enforcement, severity auto-assignment, frustration detection all require reference material. But most of this logic could be internalized by the agent without loading full reference docs every time. The workflow could use a "lean mode" that skips loading signal-detection.md and knowledge-store.md when the agent already knows the conventions, or the workflow itself could be significantly condensed.
