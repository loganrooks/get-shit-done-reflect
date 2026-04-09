---
id: sig-2026-04-09-exploration-outputs-lack-artifact-traceability
type: signal
project: get-shit-done-reflect
tags:
  - traceability
  - exploration
  - agent-output
  - artifact-persistence
created: "2026-04-09T09:05:00.000Z"
updated: "2026-04-09T09:05:00.000Z"
durability: convention
status: active
severity: notable
signal_type: capability-gap
phase: "57.2"
plan: n/a
polarity: negative
source: manual
occurrence_count: 1
related_signals:
  - sig-2026-03-02-requirements-lack-motivation-traceability
  - sig-2026-04-02-dev-version-suffix-lacks-commit-traceability
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.1+dev
---

## What Happened

During a discussion about Phase 57.2 architectural alternatives, three Explore agents were launched to research GitHub issues, workflow architecture, and deliberation history. Their findings returned only in ephemeral agent output streams (JSONL task files), not as persisted markdown artifacts. Extracting the results required parsing raw JSONL — the findings are effectively lost after the conversation ends and unreferenceable by downstream phases.

User expressed strong frustration: "for fuck sakes the agents aren't done what made you think they were done, and they should have written to a markdown file, that is so crucial" and "traceability is so important and it is constantly being neglected in this harness."

## Context

This is a recurring pattern, not an isolated incident. Research and exploration work produces valuable findings that inform downstream planning and execution, but the harness has no mechanism to ensure agent outputs are persisted as traceable artifacts. The Agent tool returns results to the parent conversation only — there is no convention or enforcement for writing findings to files that can be referenced by future sessions, deliberations, or phases.

The pattern is especially acute for:
- Explore agents gathering codebase context
- Research agents producing domain analysis
- Audit agents generating findings

All produce ephemeral results that disappear with the conversation context window.

## Potential Cause

1. **No agent output persistence convention:** The Agent tool protocol doesn't require subagents to write findings to disk. Results are returned as conversation messages only.
2. **Structural gap in exploration workflows:** discuss-phase, plan-phase, and execute-phase all produce persisted artifacts (CONTEXT.md, PLAN.md, SUMMARY.md). Ad-hoc exploration has no equivalent output contract.
3. **Traceability treated as optional:** The harness enforces traceability for formal workflow outputs but not for the research/exploration work that informs them — the very work where traceability matters most for epistemic integrity.
