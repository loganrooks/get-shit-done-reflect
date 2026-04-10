---
id: sig-2026-04-10-composition-principle-q1-untested-epistemic-gap
type: signal
project: get-shit-done-reflect
tags: [composition-principle, untested, audit-ground-rules, investigatory, hermeneutic, q1-spike-candidate, epistemic-disclosure]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: principle
status: active
severity: notable
signal_type: epistemic-gap
signal_category: negative
phase: "57.4"
plan: "2"
polarity: negative
source: local
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
environment:
  os: linux
  node_version: unknown
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-10T21:55:15Z"
evidence:
  supporting:
    - "57.4-02-SUMMARY.md line 165: 'Q1 untested warning carried forward from CONTEXT.md — the first investigatory audits conducted under this framework are the test'"
    - "57.4-VERIFICATION.md line 39: 'Composition Principle at Section 5 (L239-252) as hermeneutic 4-step prose engagement with Untested acknowledgment (L252)'"
    - "57.4-06-SUMMARY.md line 176: 'Q1 (composition principle engagement measurement) — first 2-3 investigatory audits dispatched through /gsdr:audit should be reviewed for collapse to one side behavior'"
    - "audit-ground-rules.md Section 5 ships with an explicit 'Q1 untested' acknowledgment — the framework ships with the tension acknowledged rather than hidden"
  counter:
    - "The Untested label is honest epistemic disclosure, not a defect"
    - "The composition principle is grounded in the retrospective analysis of 13 audit sessions"
    - "The framework ships with the tension acknowledged and Q1 formalized as a spike candidate"
    - "Shipping untested-but-acknowledged is better than shipping untested-and-hidden"
confidence: high
confidence_basis: "Multiple artifacts (CONTEXT.md, Plan 02 SUMMARY, VERIFICATION.md, Plan 06 SUMMARY) explicitly acknowledge the untested status and name it as a spike candidate. This is a structural property of the framework as shipped, not an interpretive inference."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Phase 57.4 shipped `audit-ground-rules.md` Section 5 (the Composition Principle) with an explicit "Q1 untested" acknowledgment: no investigatory audits have yet been run through the `/gsdr:audit` command to validate whether agents engage the composition principle hermeneutically (as a 4-step prose engagement) or collapse to treating it as a precedence rule. This is a deliberate epistemic gap — the framework ships with the tension acknowledged and Q1 formalized as a spike candidate for future validation.

The signal is not that the framework is untested; it is that the framework's central claim about investigatory rigor rests on an empirically untested behavioral hypothesis about how agents engage hermeneutic prose principles under real audit conditions.

## Context

- Phase 57.4 objective: rewrite `audit-conventions.md` and `audit-ground-rules.md` to introduce the investigatory audit type and the composition principle
- Composition Principle (Section 5 of audit-ground-rules.md): agents are expected to engage a 4-step hermeneutic prose flow when multiple audit concerns are in tension, rather than collapsing to a precedence hierarchy
- Motivating use case: the `/gsdr:audit` command shipped in the same phase is designed to audit Phase 57 itself for the same failure patterns this framework is designed to catch
- Q1 (the spike candidate): measure whether the first 2-3 investigatory audits dispatched through `/gsdr:audit` engage the composition principle as designed or collapse to one-side behavior
- Framework state: ships with the Untested acknowledgment visible in Section 5 line 252

## Potential Cause

The framework could not ship with Q1 already answered because the `/gsdr:audit` command is the delivery vehicle for the framework, and the framework itself is the thing Q1 is testing. The only way to answer Q1 is to run audits through `/gsdr:audit` against real phase artifacts — which requires the framework to ship first. This is a bootstrap ordering constraint, not a design flaw.

However, the epistemic gap is real and has two distinct risk dimensions:

1. **Hermeneutic collapse risk.** Agents may read "engage the composition principle" as "apply rule X when condition Y" and collapse to precedence reasoning that the principle is specifically designed to avoid. If this happens, the entire framework collapses to a procedural checklist and loses its investigatory character.

2. **Measurement gap.** The phase ships without a clear operationalization of what "engaged hermeneutically" vs "collapsed to precedence" looks like in agent output. Q1 as a spike should produce such an operationalization before running the empirical audits, otherwise the audit results themselves will be interpretively ambiguous.

This is a `notable` signal because the gap is explicitly acknowledged and the framework ships with honest disclosure, but the absence of a pre-ship operationalization makes post-ship measurement harder. Resolution path: dispatch 2-3 investigatory audits through `/gsdr:audit` against Phase 57 artifacts (the motivating use case), review the outputs for collapse behavior, and either validate the composition principle or revise it. This validation work should be treated as a spike rather than a normal phase because its outputs will shape whether the framework survives or needs structural revision.
