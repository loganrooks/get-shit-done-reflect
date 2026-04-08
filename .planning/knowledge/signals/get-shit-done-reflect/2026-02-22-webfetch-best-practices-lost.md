---
id: sig-2026-02-22-webfetch-best-practices-lost
type: signal
project: get-shit-done-reflect
tags:
  - extraction
  - content-loss
  - webfetch
  - researcher-agents
  - protocol
created: "2026-02-22T00:00:00Z"
updated: "2026-03-02T18:50:00Z"
durability: convention
status: active
severity: notable
signal_type: quality-issue
phase: 22
plan: 3
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-02-22-knowledge-surfacing-silently-removed]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
lifecycle_state: triaged
lifecycle_log:
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: dismiss -- addressed by les-2026-02-28-extraction-plans-need-exhaustive-keep-lists (point 4: content-by-content reconciliation), no recurrence"
triage:
  decision: dismiss
  rationale: "Addressed by existing lesson les-2026-02-28-extraction-plans-need-exhaustive-keep-lists (point 4: require content-by-content reconciliation). No recurrence since Phase 22."
  priority: low
  by: reflector
  at: "2026-03-02T18:50:00Z"
detection_method: automated
origin: collect-signals
---

## What Happened

During extraction of the `<tool_strategy>` sections from gsd-phase-researcher.md and gsd-project-researcher.md, approximately 4 specific WebFetch best practices guidelines were not captured in agent-protocol.md's Tool Conventions section (Section 8). The researcher agents' tool_strategy sections contained detailed WebFetch guidance that was more specific than what ended up in the protocol.

The protocol's Tool Conventions section covers the general tool priority table (Context7 > WebFetch > WebSearch), Context7 flow, and WebSearch tips, but the specific WebFetch behavioral guidelines from the researchers were lost rather than consolidated. No fix commit addressed this gap.

## Context

Plan 22-03 Task 2 extracted ~90 lines of tool_strategy from phase-researcher and ~72 lines from project-researcher. The plan said to "REMOVE the entire `<tool_strategy>` section" and rely on Protocol Sections 8-10. The extraction was a bulk removal rather than a content-by-content reconciliation. The WebFetch guidelines that were unique to the researchers (not duplicated from other content already in the protocol) were discarded rather than migrated.

## Potential Cause

The executor agent treated "remove the section, it's now in the protocol" as permission for bulk deletion without verifying that all unique content from the section was actually present in the protocol. The plan's instructions were directional ("REMOVE the entire section") without a verify step that checked each guideline individually. The result is a net loss of specific operational guidance for WebFetch usage in research contexts.
