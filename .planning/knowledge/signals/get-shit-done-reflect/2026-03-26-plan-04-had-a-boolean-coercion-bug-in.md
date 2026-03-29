---
id: sig-2026-03-26-plan-04-had-a-boolean-coercion-bug-in
type: signal
project: get-shit-done-reflect
tags: [boolean-coercion, assertion-bug, auto-fix, vitest]
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: minor
signal_type: struggle
signal_category: negative
phase: 50
plan: 4
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
  supporting:
    - "50-04-SUMMARY.md Auto-fix 2: 'automationFeature.schema.reflection returns an object (the schema definition), which when used in || expression produced the object rather than true, causing .toBe(true) to fail'"
    - "Fix required adding !! coercion to convert truthy object to boolean"
  counter:
    - This is a common JavaScript truthiness pitfall and was caught at verification time before commit
    - "The fix is minimal (adding !!)"
confidence: high
confidence_basis: Directly documented in SUMMARY auto-fix section with exact cause
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 04 had a boolean coercion bug in reflection feature assertion: truthy object from schema lookup caused .toBe(true) to fail

Evidence:
- 50-04-SUMMARY.md Auto-fix 2: 'automationFeature.schema.reflection returns an object (the schema definition), which when used in || expression produced the object rather than true, causing .toBe(true) to fail'
- Fix required adding !! coercion to convert truthy object to boolean

## Context

Phase 50, Plan 4 (artifact sensor).
Source artifact: .planning/phases/50-migration-test-hardening/50-04-SUMMARY.md

## Potential Cause

Implementation complexity exceeded plan assumptions, requiring adaptive solutions or workarounds.
