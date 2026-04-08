---
id: sig-2026-03-06-ci-test-regression-parse-inconclusive
type: signal
project: get-shit-done-reflect
tags: [ci, test-regression, parsing-limitation]
created: "2026-03-06T23:30:00Z"
updated: "2026-03-06T23:30:00Z"
durability: convention
status: active
severity: minor
signal_type: epistemic-gap
signal_category: negative
phase: 42
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-06T23:30:00Z"
evidence:
  supporting: []
  counter: []
confidence: low
confidence_basis: 
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

The CI sensor was unable to parse test counts from CI logs to perform test regression detection. The analysis was inconclusive -- it could not determine whether the test count changed between CI runs.

## Context

The CI sensor attempts to extract test counts from GitHub Actions logs to detect test regressions (tests being removed or counts decreasing). When log formats are non-standard or test output is not structured, the parser cannot extract counts.

## Potential Cause

CI log output format may not include structured test count summaries that the sensor can reliably parse. Vitest output format or log truncation in GitHub Actions may prevent reliable extraction. This is a sensor capability limitation, not a CI issue.
