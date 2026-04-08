---
id: sig-2026-03-04-quality-profile-executor-model-unverifiable-phase38
type: signal
project: get-shit-done-reflect
tags: [config, deviation]
created: "2026-03-04T20:00:37Z"
updated: "2026-04-02T20:00:00Z"
durability: convention
status: remediated
severity: critical
signal_type: config-mismatch
signal_category: negative
phase: 38
plan: 1
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-03-02-quality-profile-sonnet-executor-mismatch
  - sig-2026-03-02-config-quality-profile-executor-model-speculative
  - sig-2026-03-02-summary-md-lacks-executor-model-provenance
  - sig-2026-03-02-plan-04-files-modified-lists-runtime-not-source
  - sig-2026-03-03-epistemic-gap-executor-model-not-recorded-phase36
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-04T20:00:37Z"
evidence:
  supporting:
    - config.json model_profile is 'quality', which per detection rules expects opus-class executor
    - This sensor agent is confirmed to be running as claude-sonnet-4-6
    - SUMMARY.md files do not explicitly name the executor model
  counter:
    - SUMMARY.md files contain no explicit model reference -- the mismatch is inferred from sensor self-knowledge, not from execution artifacts
    - The sensor agent and the plan executor are different agents -- the sensor being sonnet-class does not prove the plan executor was sonnet-class
    - Both plans completed with 10/10 verification pass and zero test regressions
    - Phase completed in 3 minutes per plan -- consistent with either model class
confidence: low
confidence_basis: Cannot confirm executor model from artifacts alone. SUMMARY.md files contain no explicit model references. Inference is based on sensor's own model identity, but sensors and executors may run different models.
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

The project config.json has `model_profile: quality`, which by detection rules expects an opus-class executor (claude-opus-*). The artifact sensor, running as claude-sonnet-4-6, flagged a potential mismatch. However, SUMMARY.md files for both phase 38 plans contain no explicit executor model field, making it impossible to confirm whether the plan executor was sonnet-class or opus-class from artifacts alone.

## Context

Phase 38, Plans 01 and 02. Both plans achieved 10/10 verification pass on first attempt with zero test regressions, completed in approximately 3 minutes each. The sensor's self-knowledge (sonnet-4-6) does not necessarily reflect the executor's model since sensors and executors are spawned independently.

## Potential Cause

This is a recurring pattern (related to sig-2026-03-02-quality-profile-sonnet-executor-mismatch and sig-2026-03-03-epistemic-gap-executor-model-not-recorded-phase36). The root epistemic gap is that SUMMARY.md files do not record the executor model, making config mismatch detection unreliable. The signal is flagged at critical severity per detection rules for quality-profile + sonnet-class discrepancy, but the low confidence reflects that the evidence is indirect.

## Remediation

Resolved by Phase 43-02 (commit 26061d1, 2026-03-06). model and context_used_pct fields added to all SUMMARY.md templates and executor spec. All Phase 45+ summaries include model field.
