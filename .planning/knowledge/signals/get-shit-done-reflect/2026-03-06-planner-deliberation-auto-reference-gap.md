---
id: sig-2026-03-06-planner-deliberation-auto-reference-gap
type: signal
project: get-shit-done-reflect
tags:
  - capability-gap
  - planner
  - deliberation
  - context-surfacing
  - workflow-integration
created: "2026-03-06T00:00:00Z"
updated: "2026-03-06T00:00:00Z"
durability: convention
status: active
severity: notable
signal_type: capability-gap
phase: 41
plan: 
polarity: neutral
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
detection_method: manual
origin: user-observation
---

## What Happened

During a deliberation about health check maintainability, the resulting deliberation document (`.planning/deliberations/health-check-maintainability.md`) was created with the expectation that the Phase 41 planner would read it. However, the planner has no automatic mechanism to discover relevant deliberations. The user must manually tell the planner to reference the deliberation, or it may be missed entirely.

The planner already has a pattern for loading per-phase context: it reads `CONTEXT.md` files from the phase directory. But there is no equivalent auto-discovery for deliberations that reference the current phase or its requirements.

## Context

The deliberation system design (`.planning/deliberations/deliberation-system-design.md`) and the workflow integration section of the deliberation skill both note that the planner should read deliberations, but the mechanism is manual: "When running `/gsdr:plan-phase`, mention this deliberation." This creates a dependency on human memory for connecting deliberation conclusions to planning.

## Potential Cause

The deliberation system was designed separately from the planning workflow. The integration point was conceived as manual reference (user tells planner about deliberation) rather than automatic discovery (planner scans for deliberations that reference the current phase). This is a workflow integration gap -- both systems exist but the connection between them relies on the user remembering to bridge them.

A simple enhancement: the planner or researcher could scan `.planning/deliberations/*.md` for files whose `Affects:` field mentions the current phase number, and load those automatically alongside CONTEXT.md.
