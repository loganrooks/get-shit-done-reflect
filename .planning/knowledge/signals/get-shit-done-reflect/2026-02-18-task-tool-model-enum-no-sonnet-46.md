---
id: sig-2026-02-18-task-tool-model-enum-no-sonnet-46
type: signal
project: get-shit-done-reflect
tags: [config, model-selection, task-tool]
created: 2026-02-18T16:00:00Z
updated: 2026-03-02T18:50:00Z
durability: workaround
status: active
severity: critical
signal_type: config-mismatch
phase: 22
plan: 0
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
lifecycle_state: triaged
lifecycle_log:
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: address -- Task tool model enum limitation caused wrong model selection, related to recurring config mismatch pattern"
evidence:
  supporting:
    - "Task tool model parameter accepts only enum of sonnet/opus/haiku, not specific model IDs"
    - "User requested claude-sonnet-4-6 but got Sonnet 4.5 via the sonnet enum value"
    - "Plans 22-02, 22-03, and 22-04 executed with wrong model"
  counter:
    - "Task tool enum limitation is an upstream platform constraint, not a GSD bug"
triage:
  decision: address
  rationale: "Critical config mismatch caused 3 plans to execute with wrong model. Part of recurring model selection pattern. Addressable via model provenance recording and documentation of Task tool limitations."
  priority: high
  by: reflector
  at: "2026-03-02T18:50:00Z"
---

## What Happened

User requested "use Sonnet 4.6" (claude-sonnet-4-6) for Phase 22 executor agents. The Task tool's model parameter only accepts an enum of `"sonnet"`, `"opus"`, `"haiku"` — there is no way to specify a specific model ID like `claude-sonnet-4-6`. The `"sonnet"` enum value mapped to Sonnet 4.5, not the newly-released Sonnet 4.6. Plans 22-02, 22-03, and 22-04 were executed with the wrong model.

## Context

Phase 22 execution, orchestrator level. User passed "(use Sonnet 4.6)" in the execute-phase command args. Orchestrator used `model: "sonnet"` which resolved to Sonnet 4.5. Three executor agents spawned with wrong model.

## Potential Cause

Task tool model parameter is a fixed enum that doesn't expose specific model versions. When new models release (Sonnet 4.6 released day before), the enum may not update immediately. No workaround exists within the current tool API.
