---
id: sig-2026-03-03-epistemic-gap-executor-model-not-recorded-phase36
type: signal
project: get-shit-done-reflect
tags: [config, deviation]
created: "2026-03-03T00:00:00Z"
updated: "2026-03-03T00:00:00Z"
durability: convention
status: active
severity: minor
signal_type: epistemic-gap
signal_category: negative
phase: 36
plan: 1
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-03-02-summary-md-lacks-executor-model-provenance
  - sig-2026-03-02-config-quality-profile-executor-model-speculative
  - sig-2026-03-02-quality-profile-sonnet-executor-mismatch
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-03T00:00:00Z"
evidence:
  supporting: []
  counter: []
confidence: low
confidence_basis: Low confidence by design -- flagging absence of evidence, not presence of a problem
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Phase 36 configuration specifies `model_profile: quality`, which expects an opus-class executor. However, SUMMARY.md does not record which model was actually used during execution. It is therefore impossible to confirm whether the quality profile requirement was satisfied or whether a mismatch occurred.

## Context

Phase 36 (foundation-fix) ran with the quality model profile active. The executor model provenance gap recurs across multiple phases (see related signals from phase 35). Without the executor model recorded in SUMMARY.md, config mismatch detection for quality-profile plans cannot be performed reliably.

## Potential Cause

SUMMARY.md generation does not consistently capture the executor model identifier. This is a recurring omission that creates a systematic blind spot for config mismatch analysis on quality-profile phases. The gap may be inherent to how Claude Code reports its model identity at execution time.
