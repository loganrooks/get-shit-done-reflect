---
id: sig-2026-03-27-tests-unit-install-test-js-modified-in-8
type: signal
project: get-shit-done-reflect
tags: [file-churn, hotspot, test-corpus, install-coverage]
created: 2026-03-29T08:00:00Z
updated: 2026-03-29T08:00:00Z
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 53
plan: ""
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.17.5+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-03-29T08:00:00Z"
evidence:
  supporting: []
  counter: []
confidence: 0.7
confidence_basis: Modification count (8/100) crosses the 5-threshold for churn detection, but diff shape analysis shows all changes are additive test accumulation rather than repeated correction of the same code. The file is the installer integration test corpus intentionally grown across multiple phases.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

tests/unit/install.test.js modified in 8 of last 100 commits -- at churn threshold but pattern is planned accumulation, not instability

## Context

Phase 53 (git sensor).

## Potential Cause

Plan underspecification or assumption mismatch between what was planned and what was required during execution.
