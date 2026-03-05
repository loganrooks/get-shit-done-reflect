---
id: sig-2026-03-02-lifecycle-behaviors-unverifiable-without-runtime
type: signal
project: get-shit-done-reflect
tags: [testing, deviation, workaround]
created: 2026-03-02T00:00:00Z
updated: 2026-03-02T00:00:00Z
durability: convention
status: active
severity: notable
signal_type: epistemic-gap
signal_category: negative
phase: 34
plan: 4
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-02T00:00:00Z"
evidence:
  supporting:
    - "VERIFICATION.md 'Human Verification Required' section lists 3 items that 'cannot be verified programmatically'"
    - "Item 1: End-to-End Planner Signal Awareness"
    - "Item 2: Automatic Remediation Triggering"
    - "Item 3: Passive Verification Triggering"
    - "All three are workflow-level behaviors specified as instructions to agents, not code implementations"
  counter:
    - "The static verification of all 5 must-have truths passed (5/5 score)"
    - "The lifecycle demo manually walked through all four lifecycle transitions, providing partial behavioral evidence"
    - "The phase's documentation-only approach was a deliberate design choice accepted at planning time"
confidence: high
confidence_basis: "The VERIFICATION.md explicitly identifies these as unverifiable at static analysis time, and the behaviors are implemented as agent instructions rather than testable code paths"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Three lifecycle behaviors shipped in Phase 34 cannot be verified without human runtime testing: (1) end-to-end planner signal awareness, (2) automatic remediation triggering when a plan with `resolves_signals` completes, and (3) passive verification-by-absence triggering when the verification window elapses. The VERIFICATION.md explicitly categorizes these under "Human Verification Required" with the note that they "cannot be verified programmatically."

## Context

Phase 34 implemented the signal lifecycle pipeline as a documentation and instruction layer -- agent specs, synthesizer instructions, and planner guidance -- rather than as executable code. Static verification (schema validation, file existence checks, content auditing) can confirm the instructions are present and well-formed, but cannot confirm that agents will execute the behaviors correctly at runtime. The VERIFICATION.md passed 5/5 must-have truths at the static level.

## Potential Cause

The documentation-only implementation approach is the root cause. When system behaviors are implemented as natural language instructions to agents rather than as code, they are inherently untestable by static analysis. The gap is structural: there is no test harness for agent instruction compliance, and creating one would require actual agent runtime execution under controlled conditions.
