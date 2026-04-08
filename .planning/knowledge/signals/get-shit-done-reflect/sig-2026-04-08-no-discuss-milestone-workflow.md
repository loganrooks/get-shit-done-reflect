---
id: sig-2026-04-08-no-discuss-milestone-workflow
title: "No formal discuss-milestone workflow exists — milestone scoping lacks structured steering brief"
severity: notable
type: capability-gap
status: active
detected_at: "2026-04-08"
detected_by: user + agent during v1.20 milestone scoping
project: get-shit-done-reflect
polarity: negative
response_disposition: formalize
---

## Observation

The new-milestone workflow (Step 2) gathers milestone goals through conversation but does not produce a structured steering brief. Phase-level scoping has `/gsdr:discuss-phase` which creates CONTEXT.md — a structured artifact with locked decisions, open questions, epistemic guardrails, deferred ideas, and derived constraints. Milestone-level scoping has no equivalent.

## Evidence

During v1.20 scoping, extensive deliberation occurred (KB architecture options, spike epistemological framework, measurement infrastructure design, cross-runtime parity strategy) that needed to be captured for researchers to ingest. A MILESTONE-CONTEXT.md was created informally by adapting discuss-phase structure. This worked but was ad-hoc — the next milestone will face the same gap.

## Impact

Without a milestone-level steering brief:
- Researchers launched at Step 8 have no structured context beyond PROJECT.md goals
- Open design questions identified during scoping are lost or scattered in conversation
- Epistemic guardrails and derived constraints aren't captured for downstream phases
- The milestone-level deliberation quality depends on the agent remembering to create an artifact, not on the workflow requiring it

## Recommendation

Add `/gsdr:discuss-milestone` as a formal workflow step before `/gsdr:new-milestone` Step 8 (research decision). It should produce MILESTONE-CONTEXT.md with the same structural rigor as phase-level CONTEXT.md but scoped to milestone-level concerns: themes, open design questions, design constraints, epistemic guardrails, deferred work, and key artifacts.
