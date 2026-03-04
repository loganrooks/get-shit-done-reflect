# Deliberation: Signal Lifecycle Closed-Loop Gap

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-04
**Status:** Open
**Trigger:** Conversation observation — during Phase 38 signal collection, observed that all 127 signals remain in detected/triaged state despite interventions having been implemented across 5 milestones. The system's self-model diverges from reality.
**Affects:** v1.17 Automation Loop (Phases 39-43), signal lifecycle architecture, reflection quality, knowledge base integrity, deliberation skill design
**Related:**
- sig-2026-03-04-signal-lifecycle-representation-gap (deliberation-trigger signal)
- sig-2026-03-04-deliberation-skill-lacks-epistemic-verification (discovered during this deliberation)
- sig-2026-03-05-askuserquestion-phantom-answers (recurrence during this deliberation demonstrated knowledge-action gap)
- .planning/deliberations/v1.16-signal-lifecycle-and-beyond.md (designed the lifecycle — Section A2, A4, A5)
- .planning/deliberations/development-workflow-gaps.md (same pattern class: representations drift from reality)
- .planning/deliberations/deliberation-system-design.md (meta-relevant: deliberation lifecycle itself untracked)
- .planning/deliberations/v1.17-plus-roadmap-deliberation.md (scoped automation loop without noting lifecycle transition gap)
- philosophy: cybernetics/feedback-loops — actuator exists but doesn't fire
- philosophy: falsificationism/severe-tests — passive verification implemented but never tested (zero signals reach "remediated" to trigger it)
- philosophy: dialectics/determinate-negation — the improvement (lifecycle machinery) created a new contradiction (machinery that never fires)
- philosophy: aristotle/phronesis-not-techne — agent instructions cannot guarantee execution quality

## Situation

### Initial Observation (unverified)

After 5 milestones (v1.12-v1.16), 105 completed plans, and 127 accumulated signals, zero signals have been remediated or verified. The lifecycle state machine (detected → triaged → remediated → verified → invalidated) was designed in v1.16 Phase 34, and the `resolves_signals` field was added to plan schemas.

### Initial (False) Hypothesis

The initial deliberation hypothesized that "no workflow integration point triggers lifecycle transitions" and "the schema exists; the wiring doesn't." This was presented as fact without codebase verification.

### Verification Against Codebase (corrected understanding)

Verification revealed the initial hypothesis was **false**. The wiring DOES exist:

1. **execute-plan.md** has an `update_resolved_signals` step (lines 335-397) that reads `resolves_signals` from plan frontmatter and updates signals to `lifecycle_state: "remediated"` with full metadata (resolved_by_plan, approach, timestamp, lifecycle_log)
2. **gsd-signal-synthesizer.md** Step 4c implements passive verification-by-absence: after `verification_window` phases with no recurrence, promotes remediated signals to `lifecycle_state: "verified"`
3. **gsd-reflector.md** Step 5 implements triage with write capability (10 signals have been triaged)
4. **gsd-planner.md** has a `<signal_awareness>` section that instructs the planner to populate `resolves_signals` when triaged signals match the plan's work
5. **plan-phase.md** loads triaged signals and passes them to the planner as `<triaged_signals>` context

### The Actual Gap

The machinery exists AND has been invoked. Plan 36-01 declared `resolves_signals: [sig-2026-03-02-ci-failures-ignored-throughout-v116]`. The plan was executed and completed (SUMMARY.md and VERIFICATION.md exist). But the signal's `lifecycle_state` remains `detected`. The `update_resolved_signals` step in execute-plan.md should have fired but apparently didn't.

**Root cause (verified):** Lifecycle transitions are implemented as **agent instructions in workflow specs**, not as programmatic automation. They depend on the executor agent faithfully following every step of a long workflow document. When the agent skips a step — which is routine under context pressure — the transition silently doesn't happen. No error, no warning, no fallback.

This is the same failure class as "agent edited `.claude/` instead of source" (development-workflow-gaps.md Issue #1) — agent instructions are inherently unreliable at ensuring every step in a long sequence executes.

**Why only 1 of 10 post-machinery plans declared `resolves_signals`:** Plans 35-01 through 35-04 (pre-Phase-36) and 37-01 through 38-02 did not declare `resolves_signals`. Only 36-01 did. This could mean: (a) the planner correctly determined those plans didn't address triaged signals, or (b) the planner didn't follow its `<signal_awareness>` section. This is unverified.

### Meta-Failure: This Deliberation's Own Epistemic Gaps

This deliberation reproduced three failure modes it was analyzing:

1. **False claims presented as facts.** The agent stated "no workflow integration triggers lifecycle transitions" without checking execute-plan.md, gsd-planner.md, or the synthesizer agent. Two codebase checks would have falsified this claim.

2. **Prior deliberation amnesia.** Four options for closing the lifecycle loop were explored without first checking whether previous deliberations had already designed and built solutions. Three prior deliberations had — and the solutions were already implemented.

3. **AskUserQuestion phantom answer.** The agent used AskUserQuestion in the Signal Gate step, received a phantom empty response, and proceeded as if the user had answered "yes." Signal sig-2026-03-05-askuserquestion-phantom-answers documents this exact failure mode but was not consulted.

This reveals a gap in the deliberation skill itself: no epistemic verification step exists between drafting claims and presenting them as the basis for analysis. See sig-2026-03-04-deliberation-skill-lacks-epistemic-verification.

### Evidence Base

| Source | What it shows | Verified? | Signal ID |
|--------|--------------|-----------|-----------|
| KB index: 89 detected, 10 triaged, 0 remediated/verified | Lifecycle state machine never exercises past triage | Yes (KB query) | sig-2026-03-04-signal-lifecycle-representation-gap |
| execute-plan.md `update_resolved_signals` step | Remediation automation EXISTS in workflow spec | Yes (code read) | — |
| gsd-signal-synthesizer.md Step 4c | Passive verification EXISTS in agent spec | Yes (code read) | — |
| gsd-planner.md `<signal_awareness>` section | Planner CAN populate resolves_signals | Yes (code read) | — |
| Plan 36-01 declares resolves_signals with sig-2026-03-02-ci-failures-ignored-throughout-v116 | Machinery WAS invoked at least once | Yes (file read) | — |
| sig-2026-03-02-ci-failures-ignored-throughout-v116 lifecycle_state = "detected" | Despite plan completion, signal was NOT updated | Yes (file read) | — |
| AskUserQuestion phantom answer during this session | Known failure mode recurred without KB consultation | Yes (observed) | sig-2026-03-05-askuserquestion-phantom-answers |
| 3 prior deliberations designed lifecycle solutions | This problem was already identified and addressed (in spec) | Yes (file read) | — |
| Deliberation skill has no verification step | False claims entered the analysis unchecked | Yes (observed) | sig-2026-03-04-deliberation-skill-lacks-epistemic-verification |

## Framing

### Original Framing (partially wrong)

Three layers were proposed: representation gap, meta-observability, knowledge-action gap. The representation gap framing assumed the wiring was missing. It isn't — the wiring exists but the agent doesn't reliably execute it.

### Corrected Framing

**Layer 1 — Agent Instruction Reliability (immediate):** Lifecycle transitions are specified as agent instructions. Agents skip steps. How do we ensure critical state transitions actually fire?

**Layer 2 — Meta-Observability (structural):** No mechanism detected that lifecycle transitions weren't firing for 5 milestones. The gap between "machinery exists" and "machinery fires" is invisible to the system.

**Layer 3 — Epistemic Self-Application (fundamental):** The system designs epistemic safeguards (counter-evidence fields, verification-by-absence) but doesn't apply those safeguards to its own processes (deliberation, planning, signal analysis). The meta-system is not self-observing.

**Core question:** How do we make critical state transitions reliable when the execution substrate (AI agent following instructions) is inherently unreliable at ensuring every step fires?

**Adjacent questions:**
- Should lifecycle transitions be moved from agent instructions to programmatic automation (gsd-tools.js or hooks)?
- How do we detect when agent-instruction-based automation silently fails?
- Should the deliberation skill include epistemic verification as a structural requirement?
- How many of the 101 signals have actually been addressed but never marked?

## Analysis

### Option A: Programmatic Lifecycle Transitions

- **Claim:** Move lifecycle transitions from agent instructions (execute-plan.md step) to programmatic automation (post-commit hook or gsd-tools.js subcommand) that reads `resolves_signals` from plan frontmatter and updates signal files mechanically.
- **Grounds:** Plan 36-01 declared `resolves_signals` but the executor agent didn't execute the `update_resolved_signals` step. A programmatic hook would fire reliably regardless of agent behavior.
- **Warrant:** Critical state transitions should not depend on the most unreliable component in the system (agent instruction following). Moving them to deterministic code eliminates the failure mode.
- **Rebuttal:** This only addresses the remediation transition. Triage still requires agent judgment (reflect). Verification-by-absence still requires the synthesizer to run and check. Also: adding programmatic automation adds code complexity and another integration point that itself could fail.
- **Qualifier:** Probably correct for the remediation transition specifically.

### Option B: Verification Watchdog (Meta-Observability)

- **Claim:** Add a KB health check (either in `/gsd:health-check` or as a sensor) that detects when lifecycle transitions should have fired but didn't — e.g., plans with `resolves_signals` where referenced signals remain in `detected` state.
- **Grounds:** The gap persisted for 5 milestones because nothing checked whether the machinery was working. A watchdog would detect the gap early.
- **Warrant:** Rather than trying to make agent instructions perfectly reliable (impossible), detect when they fail and surface the failure. This is the cybernetics principle: close the loop with observation, not with control.
- **Rebuttal:** A watchdog adds another layer of machinery that also depends on being executed. If the system already can't reliably execute lifecycle transitions, why would it reliably execute the watchdog?
- **Qualifier:** Presumably correct as a complement to other approaches, but insufficient alone (turtles all the way down problem).

### Option C: Deliberation Skill Epistemic Hardening

- **Claim:** Modify the deliberation skill to include a mandatory verification step: after the Situation section is drafted, all factual claims about the codebase must be verified with tool calls before proceeding to Analysis. Also require checking prior deliberations before exploring the design space.
- **Grounds:** This deliberation made two false claims that would have been caught by reading two files. The skill's design trusted agent epistemic behavior rather than structuring it.
- **Warrant:** The v1.16 epistemic rigor principle states "epistemic rigor must be structural, not advisory." The deliberation skill violated this principle in its own design — it advises good epistemic practice but doesn't structurally require it.
- **Rebuttal:** Structural requirements in a skill are still agent instructions. The agent might skip the verification step too. Also, requiring verification of every claim slows the deliberation process significantly.
- **Qualifier:** Probably correct — structural prompting is more reliable than advisory, even if not perfectly reliable. And the cost of deliberating on false premises is higher than the cost of verification checks.

### Option D: Backfill + Forward Fix

- **Claim:** Two-part approach: (1) manually reconcile the 101 signals against completed plans/phases to identify which ones have been effectively addressed, and (2) for the forward fix, combine Options A and C — programmatic remediation transitions plus epistemic hardening of the deliberation skill.
- **Grounds:** The backlog of 101 potentially-stale signals degrades every future reflection run. Even perfect forward automation won't fix the existing data quality problem.
- **Warrant:** The system needs accurate data to reason well. Garbage in, garbage out applies to the self-improvement loop.
- **Rebuttal:** Manual reconciliation of 101 signals is a significant effort. Many signals may be genuinely unresolved — the assumption that "most have been addressed" is itself unverified.
- **Qualifier:** Probably correct but labor-intensive. A sampling approach (reconcile the 10 triaged signals first, then extrapolate) would test the hypothesis before committing to full reconciliation.

## Tensions

1. **Reliability vs. Complexity:** Moving transitions to programmatic code (Option A) increases reliability but adds code that must be maintained. Agent instructions are unreliable but zero-maintenance.

2. **Structural vs. Advisory:** The system keeps designing structural safeguards (counter-evidence fields, verification steps) but those structures are themselves agent instructions that can be skipped. At some point, the structural/advisory distinction collapses for a system implemented as AI agent specs.

3. **Verification depth vs. Velocity:** Requiring epistemic verification of every claim (Option C) slows deliberation. But deliberating on false premises wastes everything downstream. The cost function is asymmetric.

4. **Self-observation paradox:** The system that would detect its own meta-failures is built from the same substrate (agent instructions) that produces those failures. Cybernetics warns about this (von Foerster's second-order cybernetics): the observer is part of the observed system.

5. **Degenerating vs. Progressive (Lakatos):** Is this pattern — designing solutions that don't fully fire — a sign of degenerating programme shift? Counter-evidence: the solutions DO partially work (triage fires, 10 signals triaged; planner CAN populate resolves_signals, 36-01 did). The trajectory is toward working; the gap is in the last mile of reliability.

## Recommendation

**Current leaning:** Options A + C as minimum viable fix, with B as the meta-observability layer.

- **Option A (programmatic remediation):** Move the `update_resolved_signals` logic from execute-plan.md agent instructions to a gsd-tools.js subcommand or post-execution hook that fires deterministically. This is the highest-impact, narrowest fix.
- **Option C (deliberation epistemic hardening):** Add a verification step to the deliberation skill between Situation and Analysis. Require that factual claims about the codebase are verified with tool calls and that prior deliberations are checked before exploring the design space.
- **Option B (KB health watchdog):** Add signal lifecycle health metrics to `/gsd:health-check` — e.g., "N plans with resolves_signals where referenced signals remain detected."

**Defer Option D (backfill):** The manual reconciliation of 101 signals is labor-intensive and premature until the forward fix is in place. Once transitions work reliably, a reflection run can assess the backlog.

**Open questions blocking conclusion:**
1. Is Option A feasible within gsd-tools.js (upstream file, fork shouldn't modify) or does it need a hook/separate script?
2. For Option C, what specific structural changes to the deliberation skill would work? (Not just "add a verification step" but what exactly does it check?)
3. Should the deliberation skill also guard against AskUserQuestion phantom answers?

## Predictions

<!-- To be filled before concluding -->

## Decision Record

**Decision:** TBD
**Decided:** TBD
**Implemented via:** TBD
**Signals addressed:** sig-2026-03-04-signal-lifecycle-representation-gap, sig-2026-03-04-deliberation-skill-lacks-epistemic-verification

## Evaluation

<!-- Filled when status moves to evaluated -->

## Supersession

<!-- Filled when status moves to superseded -->
