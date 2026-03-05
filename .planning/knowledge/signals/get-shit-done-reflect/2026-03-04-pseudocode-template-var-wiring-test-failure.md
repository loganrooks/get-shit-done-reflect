---
id: sig-2026-03-04-pseudocode-template-var-wiring-test-failure
type: signal
project: get-shit-done-reflect
tags: [deviation, testing, workaround]
created: 2026-03-04T20:00:37Z
updated: 2026-03-04T20:00:37Z
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 38
plan: 1
polarity: negative
source: auto
occurrence_count: 2
related_signals:
  - sig-2026-03-03-unplanned-autofix-extractatrefs-trailing-asterisk
  - sig-2026-02-28-cross-plan-test-count-not-updated
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.16.0+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-04T20:00:37Z"
evidence:
  supporting:
    - "SUMMARY.md Auto-fixed Issues section: 'Fixed wiring validation test failure from template variable in pseudocode'"
    - "The subagent_type=\"gsd-{NAME}-sensor\" pseudocode string was matched by the wiring validation test regex as a literal agent name"
    - "Fix required an extra commit (4c88229) beyond the primary task commit (5bd915b)"
  counter:
    - "The test caught a real issue (wiring test was doing its job correctly)"
    - "Fix was straightforward and low-risk -- changed variable name in pseudocode comment"
    - "Plan 02 had zero deviations, suggesting this was an isolated issue not a pattern"
confidence: high
confidence_basis: "Auto-fixed issue explicitly documented in SUMMARY.md Deviations from Plan section with commit reference."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During plan 01 of phase 38, a pseudocode template variable in the agent spec (`subagent_type="gsd-{NAME}-sensor"`) was matched by the wiring validation test regex as a literal agent name. This caused a test failure that required an extra auto-fix commit (4c88229) beyond the primary implementation commit (5bd915b).

## Context

Phase 38, Plan 01 involved rewriting the collect-signals.md workflow and updating feature-manifest.json to support the extensible sensor architecture. The SUMMARY.md Deviations from Plan section explicitly documents: "Fixed wiring validation test failure from template variable in pseudocode." The wiring validation test was correctly doing its job -- it found what appeared to be an agent reference with a non-standard name format.

## Potential Cause

The pseudocode in the new agent spec used a template placeholder (`gsd-{NAME}-sensor`) that happened to match the pattern the wiring validation test uses to identify agent name references. The test could not distinguish between a real agent name and a pseudocode placeholder. This is a recurrence of the pattern seen in phase 36 where auto-fixes are required due to test infrastructure sensitivity to implementation details in spec files.
