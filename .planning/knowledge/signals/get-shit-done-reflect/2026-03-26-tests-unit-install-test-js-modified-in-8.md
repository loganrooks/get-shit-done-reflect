---
id: sig-2026-03-26-tests-unit-install-test-js-modified-in-8
type: signal
project: get-shit-done-reflect
tags: [file-churn, hotspot, test-maintenance]
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 50
plan: {}
polarity: negative
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
confidence_basis: Statistical frequency analysis over last 100 commits; churn is distributed across test/feature additions rather than fix iterations, suggesting expected growth rather than instability.
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

tests/unit/install.test.js modified in 8 of last 100 commits — persistent churn hotspot across phases 50–53

## Context

Phase 50 (git sensor).

## Potential Cause

Plan underspecification or assumption mismatch between what was planned and what was required during execution.
