---
id: sig-2026-02-22-debugger-git-add-a-bug-corrected
type: signal
project: get-shit-done-reflect
tags: [bug-fix, git-safety, debugger, extraction, positive-finding]
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
durability: convention
status: active
severity: notable
signal_type: pattern
phase: 22
plan: 3
polarity: positive
source: automated
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
---

## What Happened

During Phase 22 extraction of gsd-debugger.md, the executor agent discovered and corrected a bug: the debugger's `archive_session` section contained `git add -A` — a blanket staging command that violates the git safety rules now consolidated in agent-protocol.md Section 1. The extraction process, which required reading and understanding the git safety rules before editing the agent, created the awareness needed to catch this inconsistency.

The bug fix was included in the extraction commit (022d068) as part of the normal extraction work. This is a case where the extraction process's side effect (enforcing shared conventions by extracting them) produced a quality improvement beyond the stated scope.

## Context

gsd-debugger.md's `archive_session` execution step used `git add -A` for staging files before committing the debug session archive. All other agents and the shared protocol explicitly prohibit `git add -A` or `git add .`, requiring individual file staging instead. The extraction process caught this because the executor was actively looking for git-related content to remove/update.

## Potential Cause

The original debugger spec predated the formal git safety convention (later consolidated in agent-protocol.md Section 1). The bug persisted because the debugger was a standalone spec with no cross-agent consistency checks. The extraction process served as an implicit audit — reading the git safety rules and then editing the agent created a natural context for catching the violation. This demonstrates a positive side effect of the shared-protocol extraction pattern: it forces cross-agent consistency review.
