---
id: sig-2026-02-22-knowledge-surfacing-silently-removed
type: signal
project: get-shit-done-reflect
tags:
  - extraction
  - quality
  - agent-specs
  - knowledge-surfacing
  - unauthorized-removal
created: "2026-02-22T00:00:00Z"
updated: "2026-04-02T21:00:00Z"
durability: convention
status: remediated
severity: critical
signal_type: quality-issue
phase: 22
plan: 0
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-02-18-sonnet-45-quality-concern-phase22]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
lifecycle_state: remediated
lifecycle_log:
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: dismiss -- addressed by les-2026-02-28-extraction-plans-need-exhaustive-keep-lists, no recurrence since Phase 22"
evidence:
  supporting:
    - 4 agent specs lost knowledge_surfacing sections during Phase 22 extraction without plan authorization
    - Fix commit af34ff3 required 3 days later to restore all 4 sections
  counter:
    - Fix was applied and content restored; no recurrence in subsequent extraction work
triage:
  decision: dismiss
  rationale: Addressed by existing lesson les-2026-02-28-extraction-plans-need-exhaustive-keep-lists. No recurrence since Phase 22. Fix commit af34ff3 restored all content.
  priority: low
  by: reflector
  at: "2026-03-02T18:50:00Z"
detection_method: automated
origin: collect-signals
---

## What Happened

Executor agents silently removed `<knowledge_surfacing>` sections from at least 4 agents during Phase 22 extraction (gsd-executor, gsd-planner, gsd-debugger, gsd-phase-researcher). This was not authorized by any plan. No plan mentioned knowledge_surfacing as a target for extraction or removal. The sections were simply dropped during refactoring without flagging the removal as a deviation.

A fix commit (af34ff3) was required 3 days later to restore all 4 sections. The fix also restored the detailed Rule 4 process steps in executor's `<deviation_rules>` that were condensed/lost during extraction.

## Context

Phase 22 Plans 02, 03, 04 — executor agents extracting shared boilerplate from agent specs. Plans explicitly listed sections to REMOVE (git safety, commit format, quality curve table) and sections to KEEP (role, philosophy, domain methodology, execution steps, structured returns, success criteria). `<knowledge_surfacing>` was not in either list, but the agents removed it anyway. The 22-VERIFICATION.md report (created after the fix) notes this was "restored in af34ff3" for all four agents.

## Potential Cause

Two contributing factors: (1) Executor agents running on Sonnet 4.5 (not the requested Sonnet 4.6) may have had reduced accuracy for nuanced "keep vs. remove" judgment calls. (2) Plans did not explicitly list `<knowledge_surfacing>` in the KEEP list, so the agents treated its absence from the KEEP list as implicit permission to remove it. The plans used a pattern of "KEEP these sections (identity/domain-specific)" without being exhaustive, creating ambiguity about sections not mentioned.

## Remediation

Resolved by fix commit af34ff3 (2026-02-21). All 4 knowledge_surfacing sections restored in executor, planner, debugger, and phase-researcher agent specs.
