---
id: sig-2026-03-01-verification-gaps-require-human-testing
type: signal
project: get-shit-done-reflect
tags:
  - epistemic-gap
  - verification
  - human-testing
  - runtime-behavior
  - workflow
created: "2026-03-01T23:04:00Z"
updated: "2026-03-01T23:04:00Z"
durability: convention
status: active
severity: notable
signal_type: epistemic-gap
signal_category: negative
phase: 34
plan: 0
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-01T23:04:00Z"
evidence:
  supporting:
    - "34-VERIFICATION.md identifies 3 items requiring human test runs: planner signal awareness, automatic remediation triggering, passive verification after N phases"
    - These items 'cannot be verified programmatically and require a human test run'
    - The lifecycle demo in 34-04 used manual-verification rather than the passive absence-of-recurrence path, leaving the automated path unverified
    - Plan-phase workflow step 7b, execute-plan update_resolved_signals, and synthesizer Step 4c are all documented but untested in real execution
  counter:
    - All code paths are fully specified in agent specs and workflow documentation with clear logic
    - The verifier confirmed 5/5 must-have truths via static analysis, and the manual lifecycle demo proved the data model works
    - Specification-level verification may be sufficient for documentation-only changes
confidence: low
confidence_basis: The epistemic gap is directly identified by the verifier itself. Low confidence because we are flagging what we do not know -- whether the runtime behavior matches the specification.
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Phase 34 VERIFICATION.md explicitly identifies 3 items that cannot be verified through static analysis and require human test runs: (1) whether the planner correctly recommends resolves_signals during /gsd:plan-phase, (2) whether automatic remediation triggers on real plan completion, and (3) whether passive verification fires after N phases. These are the core runtime behaviors that Phase 34 was designed to enable, yet they remain unverified at the specification level.

## Context

Phase 34 is primarily a specification/documentation phase -- it modifies agent specs and workflows, not executable code. The verifier correctly identifies that static analysis of markdown specifications cannot confirm runtime behavior. The lifecycle demo in 34-04 proved the data model works (signals can transition through states) but used manual verification rather than the automated pathways.

## Potential Cause

The GSD workflow verification model is designed for code verification (checking that files exist, contain expected patterns, and pass tests). Specification-heavy phases that modify agent behavior via documentation face an inherent verification gap -- the behavior is only observable when agents execute in future sessions. This is a structural limitation of the verification approach, not a deficiency in Phase 34's implementation.
