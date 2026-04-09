---
id: sig-2026-04-09-researcher-spawned-with-wrong-model-57-3
type: signal
project: get-shit-done-reflect
tags: [session-log, model-mismatch, repeated-instruction, user-correction, researcher-agent]
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
occurrence_count: 1
related_signals:
  - sig-2026-04-08-model-override-scope-leak-researcher-got-sonnet
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-09T12:00:00Z"
evidence:
  supporting:
    - "Orchestrator spawned gsdr-phase-researcher with model='sonnet' during 57.3 discuss-phase"
    - "Quality profile was set (inherit/Opus expected for researcher agents)"
    - "User had to correct this; documented as a recurrence from Phase 56"
    - "Prior signal sig-2026-04-08-model-override-scope-leak-researcher-got-sonnet recorded same pattern"
  counter:
    - "Correction was immediate and execution proceeded correctly after user intervention"
    - "Sonnet model may have produced adequate research output despite the mismatch"
confidence: high
confidence_basis: "Directly observed in session log; user correction documented; prior occurrence cross-referenced"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During phase 57.3 discuss-phase, the orchestrator spawned `gsdr-phase-researcher` using `model='sonnet'` despite the project operating under a quality profile where the researcher agent should inherit Opus-class model selection. The user had to correct this. This is documented as a recurrence from Phase 56 (see `sig-2026-04-08-model-override-scope-leak-researcher-got-sonnet`).

## Context

Phase 57.3, discuss-phase workflow. The orchestrator dispatched the researcher sub-agent. The model override scope instruction ("use Sonnet for sensors") appears to have bled into or overridden the researcher agent dispatch despite applying only to sensor agents.

## Potential Cause

The orchestrator is applying a broad model override that was intended for sensor agents specifically, but is leaking into researcher agent dispatch. The "use X for Y" scope constraint in the model-override instruction is either not being parsed correctly at dispatch time or is not stored with sufficient specificity to prevent scope bleed across agent types.
