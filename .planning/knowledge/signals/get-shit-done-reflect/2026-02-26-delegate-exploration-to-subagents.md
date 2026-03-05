---
id: sig-2026-02-26-delegate-exploration-to-subagents
type: signal
project: get-shit-done-reflect
tags: [context-management, agent-delegation, workflow-efficiency]
created: 2026-02-26T10:30:00Z
updated: 2026-02-26T10:30:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: quick-9
plan:
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.4
---

## What Happened

During quick-9 (fix installer local patch detection), the agent performed extensive inline codebase investigation — reading files, running diffs, tracing code paths, checking git state — all in the main conversation context. This accumulated ~15+ tool calls of exploration before arriving at a diagnosis. The conversation context grew significantly, reducing remaining capacity for actual implementation work.

## Context

The user asked the agent to explain its diagnosis grounded in the codebase and compare alternatives. Rather than spawning an Explore subagent to do the investigation (which would have kept the main context clean and returned a concise summary), the agent performed all reads, greps, and bash commands inline. This is the same pattern as doing research in the main thread instead of delegating.

## Potential Cause

Default behavior bias: when asked to "explain" or "investigate," the agent defaults to inline tool use rather than considering whether a Task/Explore agent would be more context-efficient. The instruction to use agents for "broader codebase exploration and deep research" applies here — tracing a multi-file code flow across install.js, git state, manifests, and path replacement is exactly the kind of deep exploration that benefits from delegation.
