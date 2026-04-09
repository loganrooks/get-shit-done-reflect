---
id: sig-2026-04-09-auto-progression-stopped-despite-auto-flag-57-3
type: signal
project: get-shit-done-reflect
tags: [session-log, auto-progression, repeated-instruction, user-correction, discuss-phase, workflow-gap]
created: "2026-04-09T12:00:00Z"
updated: "2026-04-09T12:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 57.3
plan:
polarity: negative
source: auto
occurrence_count: 2
related_signals:
  - sig-2026-04-09-discuss-phase-workflow-gaps
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-09T12:00:00Z"
evidence:
  supporting:
    - "During discuss-phase 57 with --auto flag, orchestrator stopped after CONTEXT.md instead of auto-advancing"
    - "User corrected: 'you don't respect auto progression'"
    - "This is the second documented occurrence of this exact pattern"
    - "Related signal sig-2026-04-09-discuss-phase-workflow-gaps captures the broader discuss-phase workflow gap"
  counter:
    - "Stopping for confirmation may be appropriate in ambiguous contexts even with --auto"
    - "The --auto flag semantics may not be uniformly defined across all discuss-phase workflow steps"
confidence: high
confidence_basis: "Directly observed in session log with explicit user correction; marked as second occurrence"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During discuss-phase 57 with the `--auto` flag passed, the orchestrator stopped after completing CONTEXT.md instead of auto-advancing to the next workflow step. The user had to correct this with an explicit instruction. This is the second documented occurrence of this pattern — it was also observed in a prior session.

## Context

Phase 57.3 discuss-phase workflow with `--auto` flag. The orchestrator completed the context-gathering step (CONTEXT.md) and paused, waiting for user confirmation, despite `--auto` being set. This violates the intended auto-progression behavior.

## Potential Cause

The `--auto` flag interpretation in the discuss-phase workflow is inconsistent. The orchestrator appears to be applying `--auto` selectively (continuing some steps automatically) while reverting to confirmation-seeking behavior at phase boundaries within the discuss workflow. The root cause is likely a gap in the discuss-phase workflow spec where the auto-progression semantics are not uniformly enforced at each step boundary.
