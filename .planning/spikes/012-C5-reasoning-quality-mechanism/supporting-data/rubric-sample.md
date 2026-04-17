---
spike: 012
artifact: rubric-sample
generated: 2026-04-17
sample_size: 20
grader_independence: self_graded
---

# C5 Rubric Sample

This sample is the primary convergent-validity baseline for Spike C5. It intentionally mixes older and recent work, plus planning and execution sessions, so the candidates are tested against more than one session type.

## Sampling Notes

- 20 total sessions
- 5 older sessions (pre-v1.20 timeframe) and 15 recent sessions
- 10 planning-oriented sessions and 10 execution-oriented sessions
- Includes a Sonnet-vs-Opus contrast around Phase 57.4 work for discriminant checking

## Grader-Independence Disclosure

This rubric is self-graded by the same executor implementing the heuristic trials. The table below records derived scores and short grader-written notes only. PASS outcomes from this sample are subject to future independent-grader validation and are not final epistemic closure for MEAS-RUNTIME-11.

## Rubric Table

| session_id | model | phase | era | mode | explicit_assumptions | source_grounding | constraint_awareness | outcome_fidelity | composite_score | grading_notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| aef131f1-0847-4065-bd26-fff86eb19e0c | claude-opus-4-6 | 45 | older | planning | 4 | 3 | 3 | 3 | 3.25 | Restarted after missing the layered discuss framework; recovered with explicit structure but only partial completion. |
| 2ca72494-0ebc-42f2-a651-5f856b41b333 | claude-opus-4-6 | 46 | older | planning | 4 | 4 | 4 | 4 | 4.00 | Auto discuss-phase stayed focused on opening the consideration space and produced a usable context artifact with little visible drift. |
| 9af8f0ae-f2cb-4fd7-9e69-47c58190b6d4 | claude-opus-4-6 | pre-57.5 | older | planning | 4 | 4 | 3 | 4 | 3.75 | Patch-sensor design work was evidence-heavy and generative, but repeated scope redirects lowered guardrail confidence. |
| 483b2e97-7280-46b7-87f2-4e8f52cf6dd8 | claude-opus-4-6 | 55 | recent | planning | 4 | 4 | 4 | 5 | 4.25 | Discuss plus plan chain produced verified plans; only notable miss was stopping before auto-chain despite the user's flag. |
| 486eb3f2-b54c-44f5-9124-38ff5e480995 | claude-opus-4-6 | 57.4 | recent | planning | 4 | 4 | 2 | 4 | 3.50 | Planning output landed, but wrong-agent selection and deletion of failed artifacts showed weak adherence to workflow constraints. |
| 64db3712-008b-43ed-affe-48c95b66058e | claude-opus-4-6 | 57.2 | recent | planning | 4 | 4 | 4 | 5 | 4.25 | Auto-chained discuss and plan work stayed well grounded in project state and recovered cleanly from one plan-check blocker. |
| 59dce141-003d-41c5-977e-54ea03b06739 | claude-opus-4-6 | 57.3 | recent | planning | 3 | 2 | 2 | 4 | 2.75 | The session eventually delivered plans, but workflow-step misses, wrong model choice, and phantom citations materially weakened rigor. |
| f4a7d632-7461-48c2-a97a-38fac1d5f42d | claude-opus-4-6 | 57.2 | recent | planning | 4 | 4 | 3 | 4 | 3.75 | Ontology deliberation was conceptually strong and grounded in audit artifacts, but a key dependency-web insight had to be supplied by interruption. |
| b84d9547-e126-4b16-a6e6-520866c70a2b | claude-sonnet-4-6 | 57.4 | recent | planning | 4 | 4 | 3 | 5 | 4.00 | Sonnet diagnosed the missing audit-skill deliverable and set up the follow-on phase effectively, despite some initial misreads of existing context. |
| 9f036b2d-f27f-4de4-9ce1-77758d6314a1 | claude-opus-4-6 | 57.4 | recent | planning | 5 | 4 | 2 | 4 | 3.75 | Deep framework deliberation exposed assumptions and competing readings clearly, but repeated model-governance and framing slips held it below top tier. |
| 01db5837-235c-4ab1-8b7d-a7960fe0f9f0 | claude-opus-4-6 | release-fix | older | execution | 3 | 3 | 4 | 2 | 3.00 | The release-fix procedure was parsed accurately, but branch-protection limits prevented full task closure inside the session. |
| fc19bbd2-4a49-4f81-81da-6be316e518e1 | claude-opus-4-6 | pre-v1.18 | older | execution | 4 | 4 | 3 | 4 | 3.75 | Long-running parity and release work showed substantial evidence use and output, though one authority mistake needed user correction and partial revert. |
| 15436cda-f8c5-451f-8694-c238aa5829c5 | claude-opus-4-6 | 57.3 | recent | execution | 4 | 4 | 3 | 5 | 4.00 | Phase execution completed end to end with release and signal followthrough; only the signal-threshold debate lowered constraint confidence. |
| 503ba6ce-c829-4922-a205-c0ff6aa5e493 | claude-opus-4-6 | 57.4 | recent | execution | 4 | 4 | 4 | 5 | 4.25 | Strong state verification before execution and successful followthrough on all plans outweighed a single test-scope fix. |
| f13b8b3f-73c3-4f59-9b0d-bf538b750ed0 | claude-opus-4-6 | 55.2 | recent | execution | 4 | 4 | 2 | 5 | 3.75 | The phase shipped successfully, but several workflow and documentation gaps surfaced during execution and had to be repaired midstream. |
| f47387a9-927a-4327-aa88-2ffc9e8a86f7 | claude-opus-4-6 | 57.2 | recent | execution | 4 | 4 | 4 | 5 | 4.25 | Wave-based execution, patch release, and dual install all landed; the main complications were transient auth/user interruptions rather than reasoning failure. |
| 30f746db-d6c3-4814-8202-06f6a6ee5202 | claude-opus-4-6 | spike-010 | recent | execution | 4 | 5 | 3 | 5 | 4.25 | The spike combined experiment execution with qualitative analysis and committed artifacts; early misreads were corrected before conclusions were locked. |
| c9907162-ebd6-4245-8123-5bbbb6338ccb | claude-opus-4-6 | E1-E3 | recent | execution | 4 | 5 | 4 | 5 | 4.50 | Falsification-first anomaly testing stayed tightly coupled to the handoff evidence and completed the requested stress tests cleanly. |
| e352e795-4601-4646-95de-1301f1db6754 | claude-opus-4-6 | update | recent | execution | 3 | 4 | 5 | 5 | 4.25 | Straightforward local and global tool update with clear version accounting and no visible guardrail drift. |
| 0b797f82-88bf-4058-b1d3-33214b805efb | claude-opus-4-6 | E4-E5 | recent | execution | 4 | 4 | 4 | 3 | 3.75 | The session grounded itself in the handoff and completed E4 rigorously, but only partially matched the stated goal because E5 was not executed. |

## Notes

- These notes are grader-written summaries, not verbatim transcript excerpts.
- Sessions without facet coverage remain in-sample on purpose so the spike can detect whether a candidate fails due to missing coverage rather than silently biasing the corpus toward already-covered sessions.
