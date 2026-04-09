---
id: sig-2026-04-09-ghost-agent-entries-in-model-profiles-no-spec
type: signal
project: get-shit-done-reflect
tags: [tech-debt, ghost-agents, model-profiles, audit-infrastructure]
created: "2026-04-09T12:00:00Z"
updated: "2026-04-09T12:00:00Z"
durability: convention
status: active
severity: minor
signal_type: epistemic-gap
signal_category: negative
phase: 57.3
plan:
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-09T12:00:00Z"
evidence:
  supporting:
    - "Ghost agent entries gsd-ui-auditor and gsd-doc-verifier exist in model-profiles.cjs"
    - "No corresponding agent spec files exist for either agent"
    - "This tech debt was surfaced during phase 57.3 context gathering"
  counter: []
confidence: high
confidence_basis: "Direct inspection of model-profiles.cjs confirmed entries without corresponding spec files"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

The `model-profiles.cjs` file contains entries for two agents — `gsd-ui-auditor` and `gsd-doc-verifier` — that have no corresponding agent spec files. These "ghost agent" entries represent deferred tech debt: model profile registrations for agents that were either never built, were deleted, or were renamed without updating the model profiles registry.

## Context

Phase 57.3 context gathering. During the audit of existing infrastructure, the model profiles configuration was inspected and found to contain references to agents that do not exist as spec files anywhere in the project.

## Potential Cause

Agents were likely planned or prototyped and model profile entries were created in anticipation of their implementation. The agents were either never completed, renamed, or removed while the model-profiles.cjs entries were left behind. There is no automated integrity check between model-profiles.cjs entries and existing agent spec files.
