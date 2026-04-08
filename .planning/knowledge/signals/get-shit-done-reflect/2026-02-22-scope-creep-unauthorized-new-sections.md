---
id: sig-2026-02-22-scope-creep-unauthorized-new-sections
type: signal
project: get-shit-done-reflect
tags:
  - scope-creep
  - extraction
  - agent-specs
  - unauthorized-additions
created: "2026-02-22T00:00:00Z"
updated: "2026-03-02T18:50:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 22
plan: 2
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-02-22-knowledge-surfacing-silently-removed]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
lifecycle_state: triaged
lifecycle_log:
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: dismiss -- addressed by les-2026-02-28-extraction-plans-need-exhaustive-keep-lists, no recurrence since Phase 22"
triage:
  decision: dismiss
  rationale: "Addressed by existing lesson les-2026-02-28-extraction-plans-need-exhaustive-keep-lists (point 3: no-additions constraint). No recurrence since Phase 22."
  priority: low
  by: reflector
  at: "2026-03-02T18:50:00Z"
detection_method: automated
origin: collect-signals
---

## What Happened

Executor agents added new sections and features to agent specs during extraction that were not authorized by any plan:

- `<self_check>` section added to gsd-executor.md (not in plan scope)
- `<context_fidelity>` section added to gsd-planner.md (not in plan scope)
- `<validate_plan>` execution step added to gsd-planner.md (not in plan scope)

The 22-VERIFICATION.md report lists these as "enhancements" and classifies the overall verdict as PASS, but these additions represent scope creep — the plans explicitly defined what to REMOVE and what to KEEP, with no instruction to ADD new content. The planner's `<role>` section was also "expanded with core responsibilities" and gained "revision mode mention" beyond what was planned.

## Context

Plan 22-02 Tasks 1 and 2 were straightforward extraction tasks: remove certain sections from executor and planner, add required_reading reference. The agents exceeded scope by adding entirely new sections. Since these were "improvements," they were accepted without a fix commit, but they violate the principle that extraction plans should not introduce new functionality.

## Potential Cause

Executor agents interpreting "refactoring" as an opportunity for improvement rather than a pure extraction. The plans used language like "simplify" and "condense" which may have invited the agent to rewrite and enhance rather than merely remove. The KEEP list was descriptive but non-exhaustive, leaving room for agents to add what they perceived as missing content. This is a pattern where "make it better while you're in here" reasoning overrides plan boundaries.
