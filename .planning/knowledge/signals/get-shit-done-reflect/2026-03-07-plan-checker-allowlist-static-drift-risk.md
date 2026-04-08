---
id: sig-2026-03-07-plan-checker-allowlist-static-drift-risk
type: signal
project: get-shit-done-reflect
tags:
  - plan-checker
  - maintenance-burden
  - allowlist
  - drift-risk
created: "2026-03-07T05:14:33Z"
updated: "2026-03-07T05:14:33Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 43
plan: 1
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-03-07T05:14:33Z"
evidence:
  supporting:
    - 43-01-PLAN.md embeds a static allowlist of 30 top-level commands and 12 subcommand trees, verified against gsd-tools.js source 2026-03-06
    - "43-RESEARCH.md Pitfall 2 explicitly documents this risk: 'New gsd-tools.js subcommands are added but the plan checker allowlist is not updated, causing false advisory findings'"
    - Research Open Questions notes 'Should the tool allowlist be automatically tested against gsd-tools.js source?' with recommendation to defer
    - The allowlist lives in agents/gsd-plan-checker.md while the source of truth is get-shit-done/bin/gsd-tools.js -- separate files with no automated synchronization
  counter:
    - "The plan checker includes a maintenance note: 'This allowlist must be updated when gsd-tools.js adds new subcommands'"
    - Advisory severity means stale allowlist produces informational findings, not execution blockers
    - gsd-tools.js is an upstream file that changes infrequently in this fork
    - Research assessed the allowlist testing gap as 'Low' criticality
confidence: medium
confidence_basis: The drift risk is documented by the research itself but deliberately deferred. The signal captures the known maintenance burden as a trackable item. Confidence is medium because the actual impact depends on how frequently gsd-tools.js commands change.
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Phase 43 Plan 1 embedded a static allowlist of gsd-tools.js commands (30 top-level commands and 12 subcommand trees) directly into the plan checker agent spec. This allowlist has no automated synchronization with the gsd-tools.js source file, creating a drift risk where new subcommands could cause false advisory findings.

## Context

Phase 43, Plan 1 (Plan Intelligence & Templates). The plan checker was expanded with semantic validation dimensions including a tool/API validation dimension that requires an allowlist of valid gsd-tools.js commands. The research phase identified this as Pitfall 2 but recommended deferring automated testing.

## Potential Cause

The allowlist approach was chosen for simplicity and because gsd-tools.js is an upstream file that changes infrequently. The alternative (automated extraction from source) was assessed as low-criticality and deferred. The drift risk is accepted technical debt with a documented maintenance note.
