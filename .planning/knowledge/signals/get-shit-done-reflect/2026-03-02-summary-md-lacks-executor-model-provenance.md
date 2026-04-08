---
id: sig-2026-03-02-summary-md-lacks-executor-model-provenance
type: signal
project: get-shit-done-reflect
tags: [config, deviation]
created: "2026-03-02T00:00:00Z"
updated: "2026-03-02T00:00:00Z"
durability: convention
status: active
severity: minor
signal_type: epistemic-gap
signal_category: negative
phase: 34
polarity: negative
occurrence_count: 1
related_signals:
  - sig-2026-03-02-config-quality-profile-executor-model-speculative
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-02T00:00:00Z"
evidence:
  supporting:
    - "34-01 through 34-04 SUMMARY.md: no 'model' or 'executor' field in frontmatter or body"
  counter:
    - The summary template may not require executor model recording -- this may be a template gap, not an execution gap
confidence: medium
confidence_basis: Direct observation across all four SUMMARY.md files in Phase 34
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

All four SUMMARY.md files in Phase 34 contain no executor model information -- neither in frontmatter nor in any body section. There is no `model` or `executor` field recorded anywhere in the plan artifact trail. This creates a blind spot in provenance tracking, particularly relevant when the project config specifies `model_profile: quality` and model compliance cannot be confirmed after execution.

## Context

Phase 34 implemented the signal lifecycle pipeline and included `model` as a provenance field in the signal schema itself. The irony is that the phase that added model provenance tracking to signals did not record its own executor model in any plan artifact. The SUMMARY.md template is the natural recording point for executor model information.

## Potential Cause

The SUMMARY.md template does not include an executor model field. Without a required field in the template, executor model information is not recorded. Adding a `model:` field to the SUMMARY.md frontmatter template (or a standardized body section) would close this gap for all future phases.
