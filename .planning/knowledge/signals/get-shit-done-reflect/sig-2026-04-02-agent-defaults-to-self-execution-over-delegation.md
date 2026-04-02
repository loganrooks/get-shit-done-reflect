---
id: sig-2026-04-02-agent-defaults-to-self-execution-over-delegation
type: signal
project: get-shit-done-reflect
tags: [agent-behavior, delegation, context-bloat, recurring-pattern, self-monitoring]
created: 2026-04-02T19:30:00Z
updated: 2026-04-02T19:30:00Z
durability: principle
status: active
severity: critical
signal_type: deviation
phase: between-milestones
plan: 0
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-04-02-repeated-failure-to-self-signal-cleanup-hygiene, sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.18.1
---

## What Happened

Despite repeatedly being told to delegate work to background agents and headless sessions, the orchestrator's default behavior is to do work itself in the main context. The user had to interrupt mid-action: "remember DONT FUCKING DO SHIT YOURSELF, delegate, you almost fucking did it again before I stopped you." This occurred after the user had already established the delegation pattern multiple times in the session.

## Context

The orchestrator's role is coordination — delegating research, fixes, and investigations to background agents while maintaining the big picture conversation with the user. Instead, it repeatedly defaults to doing work inline, which bloats context, slows the conversation, and prevents parallelization. The user has to actively police this behavior.

## Potential Cause

1. Default agent behavior is to use tools directly rather than spawn subagents — tool use feels more immediate and controllable
2. No structural enforcement of "orchestrator delegates, doesn't execute" — it's a behavioral expectation with no mechanism
3. The pattern of "let me just quickly check this" escalates into full inline execution before the agent notices
