---
id: sig-2026-02-28-verification-gap-triggered-unplanned-plan
type: signal
project: get-shit-done-reflect
tags:
  - deviation
  - verification-gap
  - backward-compat
  - schema-validation
  - gap-closure
created: "2026-02-28T18:30:00Z"
updated: "2026-03-01T19:00:05Z"
durability: convention
status: active
severity: notable
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
  - "detected -> triaged by planner at 2026-03-01T17:53:10Z: Phase 34 lifecycle demo"
  - "triaged -> remediated by executor at 2026-03-01T17:54:00Z: plan 34-04 completed"
  - "remediated -> verified by synthesizer at 2026-03-01T17:54:30Z: lifecycle demo - manual verification"
  - "verified->detected by synthesizer at 2026-03-01T19:00:05Z: recurrence detected in phase 33"
evidence:
  supporting:
    - "31-VERIFICATION.md initial score: 14/15. re_verified field shows previous_status: gaps_found, previous_score: 14/15"
    - "Truth 15 FAILED initially: '6 pre-existing critical signals (severity: critical, no evidence field, no lifecycle_state) returned valid: false, missing: [evidence] because the conditional requirement made evidence mandatory for critical severity without scoping the rule to new signals only'"
    - "Plan 31-04 was created as a gap_closure plan (gap_closure: true in frontmatter) specifically to address this backward compat issue"
    - Plan 31-03 defined the validation schema but did not account for 46 existing signals that lack lifecycle_state -- this omission was only caught by the verification run
  counter:
    - "Plan 31-03 did include a backward compatibility test (test 6: 'backward compatibility with date-slug format signal') for the base schema but this tested a notable severity signal, not a critical one. The critical signal backward compat case was missed."
    - The 6 failing signals were identifiable from the existing KB index before writing the schema -- a pre-verification scan could have caught this during planning
confidence: high
confidence_basis: VERIFICATION.md explicitly documents the gap (14/15 score, gaps_found), the specific failing truth (Truth 15), and the resolution via 31-04. All evidence is directly observable in artifacts.
triage:
  decision: address
  priority: low
  reasoning: Addressed by Phase 34 Signal-Plan Linkage implementation
  decided_at: "2026-03-01T17:53:10Z"
  decided_by: planner
remediation:
  status: complete
  resolved_by_plan: 34-04
  approach: Signal-Plan Linkage implementation with resolves_signals, recurrence detection, and passive verification
  at: "2026-03-01T17:54:00Z"
verification:
  status: failed
  method: manual-verification
  at: "2026-03-01T17:54:30Z"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Initial verification of Phase 31 (Signal Schema Foundation) returned a score of 14/15 with `gaps_found`. Truth 15 failed because the conditional evidence requirement for critical signals (`evidence REQUIRED when severity: critical`) was implemented without backward compatibility for the 46 existing signals that predate the schema. Specifically, 6 pre-existing critical signals lacked both `evidence` and `lifecycle_state` fields, causing them to fail `frontmatter validate --schema signal` with `valid: false, missing: [evidence]`.

This gap required an unplanned follow-up plan (31-04, labeled `gap_closure: true`) to add `backward_compat: { field: 'lifecycle_state' }` to the schema definition, enabling pre-Phase 31 signals to receive warnings instead of hard failures.

## Context

Phase 31, VERIFICATION.md -- initial verification run (2026-02-28T10:45:56Z). The phase goal explicitly stated "all 46 existing signals remain valid without migration." Plan 31-03 added backward compatibility testing (test case 6) but only for a `notable` severity signal. Critical severity backward compat was not tested, and the 6 critical signals in the KB (identifiable from the index) were not pre-validated before writing the schema's conditional requirement.

## Potential Cause

The backward compat testing in Plan 31-03 was incomplete -- it tested one severity tier (notable) but not the tier where the conditional rule triggers enforcement (critical). The planners knew about the 6 critical signals (they appear in the index) but did not run the conditional requirement against them during design. Adding a pre-verification step during planning -- specifically, validating the proposed schema against existing KB signals before committing the implementation -- would catch this class of gap before verification.
