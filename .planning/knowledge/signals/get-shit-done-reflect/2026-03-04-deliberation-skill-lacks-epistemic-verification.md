---
id: sig-2026-03-04-deliberation-skill-lacks-epistemic-verification
type: signal
project: get-shit-done-reflect
tags: [deliberation, epistemic-rigor, capability-gap, verification, meta-observability]
created: 2026-03-04T00:00:00Z
updated: 2026-03-04T00:00:00Z
durability: convention
status: active
severity: critical
signal_type: capability-gap
phase: 38
plan:
polarity: negative
source: deliberation-trigger
occurrence_count: 1
related_signals:
  - sig-2026-03-04-signal-lifecycle-representation-gap
  - sig-2026-03-05-askuserquestion-phantom-answers
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
---

## What Happened

During the first dog-food of `/gsd:deliberate` on the signal lifecycle gap, three epistemic failures occurred:

1. **False factual claims:** The agent claimed "no workflow integration triggers lifecycle transitions" and "passive verification was never implemented." Both are false — execute-plan.md has an `update_resolved_signals` step and gsd-signal-synthesizer.md has passive verification logic (Step 4c). The claims were based on observing "0 remediated, 0 verified" in the KB and concluding "therefore no automation exists" without checking the codebase.

2. **Prior deliberation amnesia:** The agent explored a design space (4 options for closing the lifecycle loop) without first checking whether previous deliberations had already designed solutions. Three prior deliberations had — and the solutions were already built in v1.16.

3. **Phantom AskUserQuestion:** The agent used AskUserQuestion in the Signal Gate step, received a phantom empty response, and proceeded as if the user had answered "yes." A known signal (sig-2026-03-05-askuserquestion-phantom-answers) documents this exact failure mode but was not consulted.

## Context

The deliberation skill (`commands/gsd/deliberate.md`) has no epistemic verification step. After the Situation section is drafted with factual claims, nothing prompts verification against the codebase. The Evidence Base table tracks sources but does not distinguish "verified against code" from "inferred from observation." The skill also does not require checking prior deliberations before exploring the design space.

## Potential Cause

The deliberation skill was designed as v1 — "deliberately minimal, convention before automation." Epistemic rigor was treated as an agent behavior expectation, not a structural requirement of the skill. The v1.16 deliberation's "Epistemic Rigor" design principle argued that "epistemic rigor must be structural, not advisory" — but the deliberation skill itself was not designed with this principle applied to its own process.

## Systemic Pattern

This is the same class of failure as the signal lifecycle gap itself: the system designs epistemic safeguards (counter-evidence fields in signal schema, verification-by-absence in synthesizer) but doesn't apply those safeguards to its own deliberation process. The meta-system is not self-observing.
