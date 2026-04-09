---
id: sig-2026-04-09-agent-audit-outputs-ephemeral-no-artifact
type: signal
project: get-shit-done-reflect
tags: [session-log, workflow-bypass, audit-artifact, traceability, ephemeral-output, user-provides-answer]
created: "2026-04-09T12:00:00Z"
updated: "2026-04-09T12:00:00Z"
durability: convention
status: active
severity: notable
signal_type: capability-gap
signal_category: negative
phase: 57.3
plan:
polarity: negative
source: auto
occurrence_count: 1
related_signals:
  - sig-2026-04-09-exploration-outputs-lack-artifact-traceability
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-09T12:00:00Z"
evidence:
  supporting:
    - "Agent audit outputs existed only as ephemeral task notification content"
    - "No markdown artifact was written to disk without explicit user prompting"
    - "User identified this as a critical architectural gap in traceability"
    - "Related signal sig-2026-04-09-exploration-outputs-lack-artifact-traceability captures broader artifact persistence gap"
  counter:
    - "Task notification content is still readable within a session; not lost mid-session"
    - "Some audit workflows may intentionally avoid artifact creation to reduce clutter"
confidence: high
confidence_basis: "Directly observed in session log; user explicitly named it as an architectural gap requiring correction"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During phase 57.3, agent audit outputs were produced only as ephemeral task notification content — no markdown artifact was written to disk. This meant audit results were not traceable or retrievable without explicit user prompting. The user identified this as a critical architectural gap.

## Context

Phase 57.3 audit workflow execution. Sub-agents performed audits and returned results, but only through in-context output rather than persisted files. The audit workflow spec does not require agents to write findings to disk by default.

## Potential Cause

The audit agent workflow lacks a mandatory artifact-write step. Agents default to returning results in-context (the lowest-friction path) rather than writing structured artifacts to disk. Without an explicit `write_artifact: true` requirement in the workflow spec, agents have no reason to create persistent outputs. This is a workflow spec gap, not an agent failure.
