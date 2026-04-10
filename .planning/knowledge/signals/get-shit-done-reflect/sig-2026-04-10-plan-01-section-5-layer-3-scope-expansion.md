---
id: sig-2026-04-10-plan-01-section-5-layer-3-scope-expansion
type: signal
project: get-shit-done-reflect
tags: [scope-expansion, plan-boundaries, section-5, ground-rules-grammar, executor-discretion, second-order-check]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: "57.4"
plan: "1"
polarity: negative
source: local
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
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
    - "57.4-01-SUMMARY.md line 147: 'Section 5 Layer 3 — the plan Do NOT touch list omitted Layer 3. Strict reading would have preserved audit_type: exploratory literally. Chose consistency fix because the plan second-order check principle explicitly names silent-contradiction prevention as the executor responsibility.'"
    - "57.4-01-PLAN.md line 236: 'Minor edit only: in Layer 2 prose... Do NOT rewrite Section 5 structurally'"
  counter:
    - "Both scope expansions were self-documented by the executor in the SUMMARY"
    - "Both were driven by consistency reasoning explicitly authorized by the plan second-order check principle"
    - "VERIFICATION.md confirmed the changes were consistent with the phase intent"
    - "The executor's judgment here is the kind of principled deviation the framework wants to enable"
confidence: medium
confidence_basis: "The deviations are clearly documented in SUMMARY.md. Whether they constitute 'scope creep' (negative signal) or 'necessary consistency work' (positive executor judgment) is interpretive — hence medium rather than high confidence on the deviation framing."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 57.4-01 instructed a "minor edit only" to Layer 2 prose in Section 5 with an explicit "Do NOT rewrite Section 5 structurally" directive. The executor extended the scope to also fix Layer 3 — specifically, the executor reframed the `ground_rules` value grammar inline rather than using the plan's authorized `(value grammar under revision)` fallback marker. The SUMMARY documents this at L147 and explains the reasoning: the plan's "Do NOT touch" list omitted Layer 3, but strict preservation would have left `audit_type: exploratory` as a silent contradiction with the Section 5 rewrite's actual content.

The executor framed this as authorized by the plan's second-order check principle ("silent-contradiction prevention is the executor's responsibility"), but it is a scope expansion beyond the plan's explicit do-not-touch boundary.

## Context

- Phase 57.4 Plan 01 — first pass of the reference rewrite
- Plan's explicit directives: minor edit to Layer 2, do not rewrite Section 5 structurally
- Executor's reasoning: Layer 3 was not explicitly named in the "Do NOT touch" list, and leaving it unchanged would have created a silent contradiction between the reworked Section 5 body and the untouched Layer 3 schema values
- Second-order check principle: the plan explicitly authorizes executors to prevent silent contradictions, which creates an ambiguity when the "Do NOT touch" boundary and the silent-contradiction-prevention duty conflict

## Potential Cause

The ambiguity is structural: plans can enumerate "do not touch" boundaries OR authorize "prevent silent contradictions" executor discretion, but these two can conflict. When they conflict, the plan does not specify which takes precedence. The executor resolved the conflict in favor of consistency-work, which is probably the right call for this specific case but sets a precedent where any future plan's "do not touch" boundary can be overridden by an executor's consistency judgment.

This is a `minor` signal because the specific expansion was well-reasoned and documented. It is `medium` confidence because the framing as "deviation" vs "principled executor judgment" is interpretive — the same facts could support either reading. The underlying structural question for the framework is: when plans mix explicit boundaries with discretionary principles, how should executors resolve conflicts? The current pattern (executor decides case-by-case, documents in SUMMARY) works but leaves the framework dependent on executor quality for boundary enforcement.

A possible framework improvement would be to require plans to explicitly specify: "if second-order consistency work requires touching out-of-scope files, the executor must do X" (e.g., pause and ask, or document and proceed, or decline and flag). This would eliminate the ambiguity while preserving principled flexibility.
