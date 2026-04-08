---
id: sig-2026-03-26-plans-specified-test-assertions-using-internal-imp
type: signal
project: get-shit-done-reflect
tags: [plan-underspecification, testing, deviation]
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: minor
signal_type: struggle
signal_category: negative
phase: 51
plan: 1
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
  supporting:
    - "Plan 01 Task 2 specified: 'assert Content contains run-upgrade-project or the action callout text' — the 'or' hedge suggests the plan author was uncertain which form to assert"
    - Executor chose the wrong option (raw field value) and had to fix it after the function rendered a human-readable form
    - This pattern of specifying expected test output using raw internal values (rather than what a user would observe) can cause test fragility
  counter:
    - Only one test assertion was affected — not a widespread issue in this phase
    - Plan's 'or' clause shows awareness of the ambiguity, just picked the wrong branch
confidence: medium
confidence_basis: The auto-fix documents the specific mismatch. The plan's own 'or' clause reveals uncertainty about the rendered form, suggesting the plan author did not verify what generateMigrationGuide actually outputs before specifying the assertion.
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Plans specified test assertions using internal implementation details (raw JSON field values) rather than observable rendered output

Evidence:
- Plan 01 Task 2 specified: 'assert Content contains run-upgrade-project or the action callout text' — the 'or' hedge suggests the plan author was uncertain which form to assert
- Executor chose the wrong option (raw field value) and had to fix it after the function rendered a human-readable form
- This pattern of specifying expected test output using raw internal values (rather than what a user would observe) can cause test fragility

## Context

Phase 51, Plan 1 (artifact sensor).
Source artifact: .planning/phases/51-update-system-hardening/51-01-PLAN.md

## Potential Cause

Implementation complexity exceeded plan assumptions, requiring adaptive solutions or workarounds.
