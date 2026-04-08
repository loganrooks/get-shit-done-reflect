---
id: sig-2026-03-04-summary-md-no-executor-model-epistemic-gap-phase38
type: signal
project: get-shit-done-reflect
tags: [config, deviation]
created: "2026-03-04T20:00:37Z"
updated: "2026-03-04T20:00:37Z"
durability: convention
status: active
severity: notable
signal_type: epistemic-gap
signal_category: negative
phase: 38
plan: 1
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-03-03-epistemic-gap-executor-model-not-recorded-phase36
  - sig-2026-03-02-summary-md-lacks-executor-model-provenance
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-04T20:00:37Z"
evidence:
  supporting:
    - Both SUMMARY.md files contain no explicit model field
    - Config mismatch detection requires comparing model_profile against executor model -- impossible when not recorded
  counter: [SUMMARY.md template may not include a model field by design]
confidence: high
confidence_basis: The absence of model information in SUMMARY.md is directly observable.
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Both phase 38 SUMMARY.md files contain no executor model field. This creates an epistemic gap: config mismatch detection (SGNL-02) requires comparing the configured model_profile against the actual executor model, but this comparison is impossible when the executor model is not recorded in execution artifacts.

## Context

Phase 38, Plans 01 and 02. This is a recurrence of the same gap flagged in phase 36 (sig-2026-03-03-epistemic-gap-executor-model-not-recorded-phase36) and phase 34 (sig-2026-03-02-summary-md-lacks-executor-model-provenance). The SUMMARY.md template does not include a model field, and no mechanism exists for the executor to self-record its model identity.

## Potential Cause

The SUMMARY.md template was designed before model provenance tracking was introduced as a detection concern. The SUMMARY.md template would need a `model` field added (and executor agent instructions updated) to fill this gap. Until then, config mismatch detection for the executor model remains speculative, relying on sensor self-knowledge as an imperfect proxy.
