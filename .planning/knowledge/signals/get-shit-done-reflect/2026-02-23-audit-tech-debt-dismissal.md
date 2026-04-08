---
id: sig-2026-02-23-audit-tech-debt-dismissal
type: signal
project: get-shit-done-reflect
tags:
  - audit
  - tech-debt
  - agent-behavior
  - dismissal
  - thoroughness
  - milestone-completion
created: "2026-02-23T10:30:00Z"
updated: "2026-02-23T10:30:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 27
plan: 0
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.0
detection_method: manual
origin: user-observation
---

## What Happened

After running `/gsd:audit-milestone` for v1.15, the agent ran `/gsd:plan-milestone-gaps` and immediately dismissed all tech debt items because the YAML frontmatter `gaps.requirements`, `gaps.integration`, and `gaps.flows` arrays were empty. The agent recommended proceeding directly to `/gsd:complete-milestone` without investigating the 6 tech debt items.

When the user pushed back ("expand on that... this is all within v1.15 scope"), the agent then properly investigated and found:
- Installation binary 875 lines behind source (entire backlog + manifest subsystems missing from deployed copy)
- 15+ dangling references to 3 deleted agent specs across workflows, references, and commands
- 4 wiring validation test failures from the incomplete refactor
- 2 test isolation failures in backlog stats
- 7 pending human verification items

All of these accrued during v1.15 execution. The agent's initial response treated "no formal gaps" as "nothing to do" — conflating the audit workflow's structured gap categories with the broader set of tech debt items that warranted attention.

## Context

Post-milestone audit for v1.15 (Backlog & Update Experience). All 33 requirements satisfied, all 6 phases verified, but 6 tech debt items accumulated during execution. The `/gsd:plan-milestone-gaps` workflow only checks `gaps.requirements/integration/flows` arrays, so when those were empty, the agent took the literal path and dismissed everything else.

## Potential Cause

1. **Literal workflow interpretation:** The plan-milestone-gaps workflow defines gaps narrowly (requirements, integration, flows). The agent followed the workflow's error path ("No audit gaps found") without considering that tech debt items in the same audit file also need attention before milestone completion.
2. **Completion bias:** The milestone showed 33/33 requirements and 6/6 phases complete. The agent optimized for "move forward" rather than "investigate thoroughly."
3. **Missing workflow coverage:** The plan-milestone-gaps workflow has no step for evaluating tech debt items — it only handles the three structured gap categories. This is a workflow design gap, not just an agent judgment gap.
