---
id: sig-2026-03-02-quality-profile-sonnet-executor-mismatch
type: signal
project: get-shit-done-reflect
tags: [config, deviation]
created: 2026-03-02T00:00:00Z
updated: 2026-03-02T18:50:00Z
durability: convention
status: active
severity: critical
signal_type: config-mismatch
signal_category: negative
phase: 35
plan: 0
polarity: negative
source: auto
occurrence_count: 2
related_signals:
  - sig-2026-03-02-config-quality-profile-executor-model-speculative
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.15.6+dev"
lifecycle_state: triaged
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-02T00:00:00Z"
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: address -- critical config mismatch, recent recurrence, no runtime validation exists"
evidence:
  supporting:
    - ".planning/config.json sets model_profile: 'quality' which expects opus-class executor"
    - "The sensor agent executing this analysis is claude-sonnet-4-6, a sonnet-class model"
    - "Signal detection rules state: 'quality profile but sonnet-class executor was used: flag as critical'"
    - "The SUMMARY.md files do not state which model class executed them"
  counter:
    - "Execution artifacts do not explicitly state the executor model, so the executor during plan execution may have been opus-class"
    - "All four plans completed successfully with 12/12 must-haves verified"
    - "The sensor role does not benefit equally from opus-class models"
confidence: medium
confidence_basis: "Config mismatch for the sensor agent is confirmed directly from self-knowledge vs config.json. Executor model during plan execution cannot be determined from artifacts."
triage:
  decision: address
  rationale: "Critical config mismatch with recent recurrence (Phase 34 and 35). No runtime validation exists to detect model_profile violations. Needs executor model provenance in SUMMARY.md and model-profile validation warning."
  priority: high
  by: reflector
  at: "2026-03-02T18:50:00Z"
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

The project config (`config.json`) specifies `model_profile: "quality"`, which per signal-detection.md Section 3 expects an opus-class executor (claude-opus-4-6 or equivalent). The sensor agent executing this phase 35 signal analysis is claude-sonnet-4-6, a sonnet-class model. Per signal detection rules, this constitutes a critical config mismatch.

This is a recurrence of the same pattern observed in phase 34 (sig-2026-03-02-config-quality-profile-executor-model-speculative).

## Context

Phase 35, post-execution signal synthesis. The sensor is running under the synthesizer invocation in phase 35, analyzing artifact outputs from plans 35-01 through 35-04. The mismatch is confirmed via the sensor's self-reported model identity vs the project config expectation.

## Potential Cause

The synthesizer/sensor was spawned as a sonnet-class model despite the project config requesting quality-class execution. This may reflect a runtime model selection override, a sub-agent context that doesn't inherit the top-level model preference, or the user invoking the session without an explicit opus-class model selection.
