---
id: sig-2026-02-28-cross-plan-test-count-not-updated
type: signal
project: get-shit-done-reflect
tags:
  - deviation
  - testing
  - cross-plan-dependency
  - plan-accuracy
  - auto-fix
created: "2026-02-28T18:30:00Z"
updated: "2026-02-28T18:30:00Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 31
plan: 3
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.15.6
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-collector at 2026-02-28T18:30:00Z"
evidence:
  supporting:
    - "31-03-SUMMARY.md auto-fix #2: 'Existing test real manifest is valid JSON with expected structure expected exactly 3 features, but Phase 31-01 added signal_lifecycle as a 4th feature to feature-manifest.json. Test was failing with 4 !== 3.'"
    - Plan 31-01 added signal_lifecycle to feature-manifest.json but its SUMMARY.md does not mention updating the test that counts features
    - Plan 31-03 should have been written with awareness that a feature count assertion existed in the test suite, since it depends on 31-01
  counter:
    - Plan 31-03 was not responsible for managing test count assertions -- those belong to the plan that adds the feature (31-01). The dependency was implicit, not explicit.
    - The feature count assertion is a brittle test pattern; any future feature addition will hit the same issue regardless of plan coordination
confidence: medium
confidence_basis: Detection from SUMMARY.md auto-fix log is clear. Root cause assessment (cross-plan dependency not captured) is reasonable inference from plan structure.
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

During Plan 31-03 Task 2, an existing test assertion `expect(features.length).toBe(3)` failed because Plan 31-01 had added `signal_lifecycle` as a 4th feature to `feature-manifest.json` without updating the test. The test was located in a "real manifest is valid JSON with expected structure" describe block and expected exactly 3 features. The executor applied a Rule 1 auto-fix (bug fix) by updating the test to expect 4 features and adding an assertion for `signal_lifecycle`.

## Context

Phase 31, Plan 03, Task 2 -- adding signal validation tests to gsd-tools.test.js. Plan 31-03 depends on Plan 31-01 having completed. Plan 31-01 added the `signal_lifecycle` feature to feature-manifest.json but the implicit side-effect on the feature count test assertion was not tracked. Plan 31-03 was written without knowledge of this test assertion.

## Potential Cause

The feature count assertion is a brittle test pattern: any time a feature is added to feature-manifest.json, this test will fail for any subsequent plan that runs npm test. The root cause is that the test captures a point-in-time count rather than testing structural properties (e.g., "all features have required fields"). Plans that add features should include updating related count assertions, or the assertion should be refactored to not be count-sensitive.
