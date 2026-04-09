# Deliberation: Exploratory Discuss-Phase Quality Regression

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-04-09
**Status:** Concluded
**Trigger:** User observation during Phase 57 discuss-phase (--auto, exploratory mode) — the CONTEXT.md produced locked nearly everything as [grounded] with only 3 open questions, zero guardrails, zero working assumptions, zero derived constraints. This represents a structural collapse from the peak-quality CONTEXT.md files produced during Phases 52-54.
**Affects:** All future phases using discuss-phase exploratory mode, Phase 57.1 or 57.2 scope, CONTEXT.md template, discuss-phase workflow, potentially a dedicated exploration agent
**Related:**
- sig-2026-04-09-exploratory-mode-epistemic-quality-regression (critical, manual)
- sig-2026-04-09-discuss-phase-workflow-gaps (notable, manual)
- sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop (detected)
- sig-2026-03-27-plan-03-adopted-discuss-phase-md-without-detecting (detected)
- .planning/audits/2026-04-09-discuss-phase-exploration-quality/exploration-quality-audit.md
- .planning/audits/2026-04-09-discuss-phase-exploration-quality/auto-progression-audit.md
- Upstream Issue #33 (first-class exploratory discuss mode)
- Upstream Issue #26 (discuss-phase --auto semantics)
- Upstream Issue #1620 (--chain flag breaks after discuss-phase)
- Upstream Issue #1507 (auto-mode self-discuss loops — the opposite extreme)
- .planning/deliberations/epistemic-health-and-variety.md (F45: premature convergence as cybernetic variety problem)

## Situation

### The observation

During the Phase 57 discuss-phase run (--auto, exploratory mode), the produced CONTEXT.md exhibited a pattern the user identified as quality regression: nearly everything locked as [grounded], only 3 open questions, no epistemic guardrails, no working assumptions section, no derived constraints, no iterative grey area discovery. The user characterized this as "not really exploring and just locking down and claiming grounded."

### The comparative evidence

A quality audit compared all 32 CONTEXT.md files across the project's history. The structural collapse is quantified:

**Peak era (Phases 52-54, interactive, March 26-28):**
- 6-9 structured sections per CONTEXT.md
- 4-9 explicit epistemic guardrails
- 5-7 working assumptions with falsification criteria
- 7+ derived constraints with source citations
- Typed open questions with downstream decision annotations
- Grey areas generating sub-questions (iterative deepening)

**Current era (Phases 55-57, --auto exploratory, April 8-9):**
- 4-5 sections (domain, decisions, specifics, deferred, maybe open Qs)
- 0 guardrails across all four phases
- 0 working assumptions sections
- 0 derived constraints sections
- Open questions as flat 3-row table (terminal, not generative)
- 19 [grounded] markers, 2 [open] in Phase 57

### Three co-occurring issues

1. **Epistemic quality regression** (critical): The exploratory mode produces shallow locked-down specs instead of genuine explorations. This is the primary concern.

2. **Auto-progression gap** (notable): --auto does not chain to plan-phase. Root cause: upstream --chain flag (PR #1445, commit 5e88db95) was never merged into fork. Fork sync gap, 6-line fix.

3. **CONTEXT.md not committed** (notable): The discuss-phase does not git-commit its output despite `commit_docs: true` in config.

### Evidence Base

<!--
Corroborated? column tracks whether claims survived falsification attempts.
Signal ID column tracks whether evidence has been formalized as a KB signal.
-->

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| CONTEXT.md comparison (32 files) | Structural collapse: 6-9 sections → 4-5 sections, guardrails 4-9 → 0, working assumptions 5-7 → 0 | Yes — audit agent counted sections across all files | sig-2026-04-09-exploratory-mode-epistemic-quality-regression |
| Git timeline (commit e4ae09b0) | Three-mode system introduced April 2, but write_context template NOT updated with exploratory sections | Yes — grep confirms template lacks assumptions/constraints/guardrails sections | sig-2026-04-09-exploratory-mode-epistemic-quality-regression |
| Upstream Issue #33 | Exploratory mode was intended to produce a different class of document with "preserved uncertainty" | Yes — issue body read, closing comment references spec update but not output validation | informal |
| Upstream Issue #26 | --auto exploratory should "open uncertainty up for research, bias toward open questions/assumptions/guardrails" | Yes — issue body read | informal |
| discuss-phase.md philosophy section | Correctly specifies "working assumptions, not decisions" and "epistemic guardrails" | Yes — grep confirmed lines 56-63 | informal |
| discuss-phase.md write_context template | Template has NO sections for assumptions, constraints, guardrails, or structured questions | Yes — grep confirmed lines 906-1002 | informal |
| Phase 57 [grounded] claims | Many lack traceable citations; some cite phantom references (e.g., "Pitfall C3" not in research doc) | Yes — audit agent checked cross-references | sig-2026-04-09-exploratory-mode-epistemic-quality-regression |
| Upstream commit 5e88db95 | --chain flag exists in upstream but is NOT an ancestor of fork HEAD | Yes — git merge-base --is-ancestor returns false | sig-2026-04-09-discuss-phase-workflow-gaps |
| Phases 52-54 were interactive | Three-mode system didn't exist until April 2; these phases ran before that | Yes — commit dates verified | informal |
| Peak-era quality was never encoded in template | The rich sections were produced by interactive conversation, not by template instructions | Yes — pre-three-mode template identical to post-three-mode template | informal |

## Framing

**Core question:** The exploratory discuss-phase was designed to preserve uncertainty and set up a rich research space, but it produces shallow locked-down specs instead. The write_context template was never updated to structurally require the outputs the philosophy section describes. How should we fix this — template fix, dedicated agent, or both — and what should the standard of "grounded" actually be?

**Adjacent questions:**
- Should there be a dedicated exploration agent (like gsdr-phase-researcher, gsdr-planner) rather than running exploration inline in the orchestrator?
- What should [grounded] require as evidence? Is self-certification sufficient or should it require traceable citations?
- How do we prevent the --auto flag from creating a perverse incentive to mark everything [grounded]?
- Should the CONTEXT.md template be a separate file (like other templates) rather than inline in the workflow?
- How do we avoid the opposite extreme (Issue #1507: 34 passes, 7 hours, zero code) while still enabling genuine exploration?
- Should we group these fixes into Phase 57.1, create a 57.2, or handle them differently?

## Analysis

### The root cause is multi-causal (corrected after cross-model review)

The initial framing was "structural, not philosophical" — the write_context template lacks exploratory sections. The GPT-5.4 review (`.planning/audits/2026-04-09-discuss-phase-exploration-quality/codex-gpt54-review.md`) correctly identified this as too narrow. The regression has four contributing causes:

1. **Structural:** The write_context template (lines 906-1002) was never updated with exploratory-mode sections. The philosophy section (lines 56-63) says "produce working assumptions and epistemic guardrails" but the template has no `<assumptions>` or `<guardrails>` sections. This is advisory text without structural enforcement — the harness's recurring anti-pattern.

2. **Incentive-driven:** `[grounded]` does double duty as epistemic status AND auto-progression gate. Under --auto, the agent is incentivized to mark everything [grounded] because that's the token that unlocks forward motion. This is a Goodhart problem: the measure (grounded count) becomes the target.

3. **Interaction-regime-dependent:** Phases 52-54 were interactive; 55-57 were --auto. The peak-era quality was produced by human-agent dialogue, not by the template. The exploratory mode was supposed to preserve this quality in --auto, but it can't — the interactive richness was never systematized.

4. **Validation-poor:** Phantom citations (e.g., "Pitfall C3" not traceable to any document), unverified grounding claims, no mechanism for downstream readers to challenge a [grounded] assertion. The system has no citation integrity checking.

### What should "grounded" mean? A pluralist epistemic analysis

Traceability (citing a source file, a prior decision, a requirement ID) is a necessary but not sufficient condition for a claim to be genuinely grounded. Multiple philosophical traditions illuminate different aspects of epistemic risk that a single harmonized standard would flatten:

**Sellars — The Myth of the Given.** Marking something [grounded] by assertion is exactly the Myth of the Given: treating a claim as self-evidently supported without inferential work. Nothing is simply "given" as foundational. Grounding requires the claim to be inferentially articulated — connected to other claims that support it — not just stamped with a confidence label.

**Brandom — Inferentialism.** To be grounded is to occupy a position in the space of reasons. A grounded claim is one where the asserter commits to defending it if challenged, where inferential connections to other commitments are visible, and where incompatible commitments are flagged. The "game of giving and asking for reasons." Current [grounded] claims aren't in that game — nobody can challenge them, and the agent doesn't expose what else it's committed to by making the claim.

**Gadamer — Prejudice and Horizon.** All understanding involves Vorurteile (pre-judgments). Being grounded isn't about achieving a view from nowhere — it's about making your pre-judgments explicit so they can be tested against the subject matter. "This looks grounded *from within a framing where X, Y, Z are assumed*" is epistemically honest. Bare [grounded] pretends the framing doesn't exist.

**Dewey — Warranted Assertibility.** The process of inquiry is what warrants the claim, not the end-state citation. Was this claim produced through genuine investigation — doubt, hypothesis, test — or was it already believed before the "exploration" started? The Phase 57 [grounded] claims fail Dewey's test. They were asserted, not inquired into.

**Longino — Social Epistemology.** Knowledge requires transformative criticism from perspectives with different assumptions. Self-certification — the agent marking its own claims as grounded — is epistemically vacuous by Longino's standard. This connects directly to the idea of a dedicated exploration agent as interlocutor, and to the cross-model review pattern already identified as the strongest positive audit finding.

**Wittgenstein — "On Certainty."** Some claims function as hinge propositions — they're not grounded by evidence but serve as the framework within which evidence becomes possible. "We follow the gsd-tools module pattern" is arguably a hinge — it's not investigated, it's the backdrop against which implementation decisions make sense. Acknowledging some claims as framework commitments rather than pretending they're empirically grounded would be more honest.

**The key insight from the plurality:** These traditions see *different things*. Brandom sees inferential commitments. Gadamer sees horizonal assumptions. Longino sees the absence of external criticism. Wittgenstein sees framework commitments masquerading as empirical claims. They are not converging on the same object from different angles — they illuminate different aspects of epistemic risk. A single harmonized standard would flatten exactly the distinctions that make them useful.

### Response to the plurality: probes, not criteria

Rather than reducing these voices to a unified grounding standard ("[grounded] requires conditions A, B, C" — which invites checklist compliance), the response should be **a practice that keeps multiple epistemic concerns in play without resolving them into a unified theory.**

The exploratory mode should apply *probes* drawn from different traditions. Each probe surfaces a different kind of vulnerability in a claim:

- **Inferential probe** (Brandom): What else are you committed to by asserting this? What's incompatible with it?
- **Inquiry probe** (Dewey): Was this produced through genuine doubt and investigation, or was it already believed before the "exploration" started?
- **Horizon probe** (Gadamer): What framing makes this appear obvious? What would someone with a different framing see?
- **Criticism probe** (Longino): Has any perspective with different assumptions examined this?
- **Hinge probe** (Wittgenstein): Is this actually a framework commitment masquerading as an empirical claim? If so, name it as such.

Not every probe applies to every claim. A convention like "follow the module pattern" calls for the hinge probe — acknowledge it as framework, don't pretend it's investigated. A novel design choice like "use 8 metrics" calls for the inquiry and horizon probes — what framing produced this set, and was it investigated or inherited?

**The probes don't need to agree.** A claim might survive the inferential probe (it's well-connected to other commitments) but fail the horizon probe (the framing that makes it look good is never questioned). That *tension is information*. The exploratory mode should surface it, not resolve it. "This claim is inferentially coherent within the current framing, but the framing itself hasn't been examined" is more epistemically honest than either [grounded] or [open].

### Option A: Template fix with epistemic landscape section

- **Claim:** Update the write_context template with exploratory-mode branching. Replace the bare [grounded]/[open] binary with a richer epistemic vocabulary. Add structural sections for `<assumptions>`, `<constraints>`, `<guardrails>`, and `<questions>`. Include an Epistemic Landscape section that surfaces the epistemic situation of significant claims rather than stamping them with binary labels.
- **Grounds:** The audit shows the template gap is the direct cause. The philosophical analysis shows [grounded]/[open] is too thin. The template should structurally require epistemic articulation — not "is this grounded?" (binary, reductive) but "what is the epistemic situation of this claim?" (multidimensional, honest). Example section:
  ```
  ## Epistemic Landscape
  For each significant claim or working assumption:
  - What it rests on (inferential connections)
  - What framing makes it appear natural (horizon)
  - What hasn't been checked (criticism gap)
  - Whether it's a framework commitment or an investigated claim
  ```
- **Warrant:** Structural enforcement works where advisory text fails. But the structure should embody pluralist epistemics, not reduce them to a checklist. The probes provide structure without collapsing the distinctions between traditions.
- **Rebuttal:** Template sections can be filled with boilerplate. An "Epistemic Landscape" section can be filled with generic text that doesn't actually do epistemic work. The probes become a checklist if the agent treats them as boxes to check rather than genuine questions to engage. Structure is necessary but the quality ultimately depends on the agent's epistemic behavior.
- **Qualifier:** Probably sufficient for the immediate regression. Uncertain whether it produces Phase-52-level quality without either interactive input or a dedicated interlocutor.

### Option B: Dedicated discuss-phase exploration subagent as epistemic interlocutor

**Note on naming:** This is NOT the `/gsdr:explore` skill (Phase 57.1 — a standalone Socratic ideation command). This is a *subagent spawned by the discuss-phase workflow* during exploratory --auto mode, analogous to how gsdr-phase-researcher is spawned by plan-phase. It is part of the discuss-phase pipeline, not a separate command. Whether it should leverage the explore skill's Socratic questioning infrastructure (connecting 57.1, 62/WF-05b, and this concept) is an open design question.

- **Claim:** Create a dedicated discuss-phase exploration subagent that functions not as a reviewer or evaluator but as an *interlocutor* — an agent that speaks from a different epistemic position and asks the questions that the primary agent's position makes invisible. Spawned during discuss-phase when mode is exploratory. This is Longino's transformative criticism operationalized.
- **Grounds:** The orchestrator context is under completion pressure. A dedicated subagent with a different system prompt can be designed to resist premature closure, surface assumptions, and rotate through different epistemic stances — sometimes asking "what's the inferential structure here?" (Brandom), sometimes "what assumptions are we bringing?" (Gadamer), sometimes "has this been challenged by a different perspective?" (Longino). The pattern already exists — we spawn dedicated agents for research and planning.
- **Warrant:** The epistemic-agency findings (F45: premature convergence is a cybernetic variety problem, Ashby's Law) suggest architectural variety, not behavioral correction. The cross-model review pattern (strongest positive audit finding) works precisely because different models have different blind spots. A dedicated exploration agent extends this principle to the discuss-phase. The agent is not a judge checking compliance — it's an interlocutor whose assumptions differ enough to see what the first agent can't.
- **Rebuttal:** More agents means more context, latency, and complexity. Adding an agent spawn may hit the Issue #1507 problem (runaway exploration) unless bounded. The peak-era quality was produced by human-agent interaction — perhaps only a human interlocutor provides genuine transformative criticism, and a second agent just produces more of the same epistemic position. If both agents share the same training data and disposition, Longino's diversity requirement is not met.
- **Qualifier:** The right long-term architecture if the interlocutor genuinely occupies a different epistemic position. Needs careful design — the agent spec must embody the probes as genuine questions, not as a checklist to run through. The bounding mechanism (preventing Issue #1507) needs design work. May require cross-model deployment (different model for the interlocutor) to achieve genuine perspectival diversity.

### Option C: Template fix + probes now, interlocutor agent as committed phase (progressive)

- **Claim:** Ship the template fix with epistemic landscape section now. Implement the probe vocabulary (replacing bare [grounded]/[open]) now. Design the dedicated interlocutor agent as a committed phase in v1.20 with a concrete deliverable (agent spec + DESIGN.md), build in v1.21.
- **Grounds:** The template fix addresses the immediate structural regression. The probe vocabulary addresses the epistemic thinness. The interlocutor agent addresses the deeper problem (self-certification, lack of transformative criticism) but needs design work that shouldn't block the immediate fix.
- **Warrant:** Progressive refinement that preserves a concrete commitment to the harder problem. The template fix is testable (prediction P1). The agent design is a deliverable, not a todo.
- **Rebuttal:** "Progressive" can mean "we fix the easy thing and never get to the hard thing." The interlocutor agent is where the real epistemic work happens; the template fix may produce well-structured mediocrity. Shipping the template first risks anchoring on its output quality as "good enough."
- **Qualifier:** Probably the pragmatic path. The prediction P3 ("template alone won't achieve Phase-52 quality") is designed to force the question: if the template fix produces compliance without substance, the agent becomes urgent rather than deferred.

## Tensions

1. **Exploration depth vs completion pressure**: Genuine exploration takes time and resists closure. --auto mode exists precisely because the user wants to move faster. These are in tension. Issue #1507 (7 hours of exploration, zero code) is the cautionary tale of unbounded exploration. The solution must navigate between premature closure and runaway exploration.

2. **Structural enforcement vs organic quality**: The peak-era CONTEXT.md quality was organic — produced by interactive conversation, not by template sections. Attempting to capture organic quality in structural templates risks producing compliance (sections filled) without substance (genuine epistemic work). The template is necessary but the quality ultimately depends on the agent's epistemic behavior.

3. **[grounded] as information vs [grounded] as gatekeeping**: Currently [grounded] means "I the agent believe this is well-supported." The user wants it to mean "here is the traceable evidence chain." The first is useful as an agent confidence signal. The second is useful as a verification mechanism. Making [grounded] require citations adds rigor but also adds friction — every decision needs a paper trail.

4. **Fork-specific quality vs upstream compatibility**: These improvements (template sections, grounding standard, dedicated agent) are fork-specific. Upstream GSD doesn't have "exploratory" mode at all (per Issue #1879, upstream only has "discuss" and "assumptions"). Deep fork-specific investment in exploratory mode increases fork divergence.

## Cross-Model Review

GPT-5.4 (Codex CLI, reasoning effort: xhigh) reviewed this deliberation. Full review at `.planning/audits/2026-04-09-discuss-phase-exploration-quality/codex-gpt54-review.md`. Key contributions and our response:

**Accepted (sharpened the intervention):**
- [grounded] does double duty as epistemic status AND automation control token — a Goodhart problem. Fix: decouple epistemic status from auto-progression eligibility.
- Typed claim states (`anchored`, `assumed`, `framework`, `observed`, `open`, `decided`) are operationally superior to bare [grounded]/[open] or open-ended prose probes.
- Lightweight citation checker for phantom/unresolvable references.
- Missing predictions: citation integrity, downstream effect, cost bound, anti-runaway, inter-rater agreement.

**Partially pushed back:**
- "Philosophy seminar" risk: The philosophical analysis was generative — it produced the insight that different claims have different epistemic situations, which is WHY typed states are better than a binary. The types cash out the philosophy. We accept the direction (more operational) without accepting the framing (that the philosophy was excess).
- Dedicated agent as "weakest option": The review is right that same-model-family doesn't guarantee perspectival diversity (Longino). But it underweights that exploration and coordination are structurally different cognitive modes. The agent idea is under-evidenced, not weak.
- "Local intellectual taste": Every lens stack is situated. The engineering lens the review brings is equally situated. We acknowledge situatedness without treating it as deficiency.

**Rigorous audit findings (third audit, with epistemic ground rules):**

Full audit at `.planning/audits/2026-04-09-discuss-phase-exploration-quality/rigorous-comparative-audit.md`. Key findings that survived scrutiny:

1. **[grounded] forecloses unevenly.** Phase 57's 8-metric selection is grounded in availability ("from available data"), not fitness for detecting post-intervention change. No "Why this metric rather than alternatives" analysis exists. Phase 56's lifecycle conflict was correctly [open] and properly resolved. The problem is specific, not universal.

2. **Research question format shifted from generative to confirmatory.** Phase 52 Q1 specifies methodology: "Diff the two versions structurally. Identify which upstream additions are purely additive vs which conflict." Phase 55's equivalent asks yes/no: "Should Area 3 fixes be included?" The structural pressure toward generative investigation disappeared.

3. **Signal collection gap is automation level, not CONTEXT.md quality.** `automation resolve-level signal_collection` returns `effective: 1 (nudge)`. Execute-phase at level 1 skips collection. Phase 55 had 12 deviations → 0 signals. Separate issue from discuss-phase quality.

4. **Pre-work artifacts are user-initiated, not automated workflow products.** No `/gsdr:drift-survey` command exists. Git commits are user-authored. The prior audit fabricated a "normal workflow product" narrative without checking.

5. **Plan quality measured as technical detail is a category error.** A technically detailed plan that implements unexamined [grounded] decisions is not a high-quality plan. Phase 57 Plan 01 implements all 8 metrics without questioning them because CONTEXT.md marked them [grounded]. The [grounded] label is an instruction to the planner to treat the decision as settled.

## Emerging Design Space

The following ideas emerged during deliberation but should NOT be locked here. They are the exploration mandate for Phase 57.2's discuss-phase (which must itself be genuinely exploratory):

### Two-document output
Should the discuss-phase produce both a CONTEXT.md (compact steering brief for downstream agents) and a CONTEXT-RATIONALE.md (the epistemic audit trail — justification chains, alternatives considered, assumption dependencies, grounding evidence)? The first is actionable; the second is traceable. Currently a [grounded] claim has no visible justification behind it.

### Complexity-adaptive discussion depth
Not every phase needs the same exploration depth. A mechanical sync phase needs less than an architectural design phase involving measurement philosophy. The ROADMAP could annotate phases with exploration depth indicators based on: decision reversibility, dependency count, uncertainty level, novelty, downstream impact. The discuss-phase would adapt behavior accordingly — deeper grey-area exploration for high-complexity phases, lighter for mechanical ones.

### Mode redesign
The current three modes (exploratory, discuss, assumptions) don't map to epistemic situations effectively. `exploratory` with `--auto` collapsed into `discuss` in practice. Modes SHOULD map to: "we know what to build" (discuss), "we don't understand the problem space yet" (explore), "we want to infer from codebase" (assumptions). The template and auto-progression mechanism need to differentiate structurally, not just philosophically.

### ROADMAP annotations for autonomy
If the ROADMAP marks a phase as high-complexity/load-bearing/hard-to-reverse, the autonomous pipeline allocates more epistemic effort proportionally. Low-complexity phases run --auto safely. High-complexity phases require interactive input or at minimum the two-document output. This is Ashby's Law operationalized: the harness matches its epistemic variety to the variety of the situation.

### Regret-aversion as design principle
The cost of under-exploring a critical decision (building on weak foundations, hard to reverse, many downstream dependencies) is asymmetrically higher than the cost of over-exploring a simple one (some wasted time). The adaptive harness should be biased toward more exploration when uncertainty is high and decisions are load-bearing. This isn't a preference — it's a rational response to the asymmetry of epistemic regret. The current system applies uniform exploration depth regardless of stakes, which means it systematically under-explores critical decisions and over-explores trivial ones.

### Adaptive harness as its own phase
The above ideas constitute a substantial design challenge — how to make the harness responsive to the singular demands of every situation. This is likely its own phase (v1.20 or v1.21), not something to stuff into 57.2. Upstream GSD's `granularity` config (coarse/standard/fine) is the closest existing accommodation but was never properly operationalized.

## Recommendation

**Conclusion: Two-phase response — immediate fix (57.2) + design exploration (later phase)**

### Phase 57.2: Discuss-Phase Exploratory Mode Overhaul (immediate)

**Goal:** Overhaul the discuss-phase exploratory mode so that --auto produces genuinely exploratory CONTEXT.md files — with working assumptions, epistemic guardrails, derived constraints, generative questions, and traceable grounding — rather than the shallow locked-down specs the current mode produces.

**Scope includes both structural fixes AND subagent design discussion.** The 57.2 discuss-phase should explore the full intervention space, not prematurely commit to structural fixes alone:

Structural fixes (decided — these address the acute regression):
1. Template fix: add exploratory-mode sections (assumptions, constraints, guardrails, structured questions) to `write_context` in discuss-phase.md
2. Typed claim states: replace bare [grounded]/[open] with a richer epistemic vocabulary
3. Verifiable provenance: require traceable citation for claims that auto-lock during --auto
4. Incentive decoupling: separate epistemic status labels from auto-progression eligibility (the Goodhart fix)
5. Lightweight citation checker: flag phantom/unresolvable references
6. Auto-progression cherry-pick: merge upstream --chain flag (commit 5e88db95, 6-line fix)
7. CONTEXT.md commit gap: ensure discuss-phase commits output when `commit_docs: true`
8. Rename main exploratory section from "Implementation Decisions" to something that doesn't bias toward closure

Subagent design (to explore — may or may not result in implementation):
9. Whether a dedicated discuss-phase exploration subagent is needed, or whether the structural fixes are sufficient
10. If needed: how the subagent integrates into the discuss-phase workflow, how it's bounded (Issue #1507 cautionary tale), whether it connects to the `/gsdr:explore` skill's Socratic questioning infrastructure (connecting 57.1 and 62/WF-05b)
11. Whether the discuss-phase needs multiple subagents (like plan-phase has researcher + planner + checker) or a single exploration subagent

P4 tests whether structural fixes alone are sufficient. If 57.2 ships structural fixes and P4 shows they're not enough, the subagent design work from 57.2's discussion becomes the basis for a follow-up phase.

Derived from: `.planning/deliberations/exploratory-discuss-phase-quality-regression.md`
Audit evidence: `.planning/audits/2026-04-09-discuss-phase-exploration-quality/` (7 audit artifacts)
Signals: sig-2026-04-09-exploratory-mode-epistemic-quality-regression, sig-2026-04-09-discuss-phase-workflow-gaps

**Open questions for Phase 57.2 discuss-phase to explore (not to lock):**
1. What should the typed claim vocabulary be? The GPT-5.4 review proposed 6 types — should be examined, not adopted wholesale
2. How should the provenance citation format work in practice?
3. Should the output be one document or two (CONTEXT.md + CONTEXT-RATIONALE.md)? What are the tradeoffs?
4. What does "rename the main section" look like for downstream consumers?
5. Is a dedicated discuss-phase exploration subagent needed, or are structural fixes sufficient? (P4 tests this empirically, but the design discussion should happen in 57.2 regardless)
6. If a subagent is designed: how does it connect to the explore skill (57.1) and its enhancement (62/WF-05b)?
7. How should the subagent be bounded to prevent runaway exploration (Issue #1507)?

### Deferred items with explicit dispositions

**Adaptive Harness Design → 999.x backlog item:**
The broader design challenge — complexity-responsive discussion depth, ROADMAP annotations for exploration depth, mode redesign, regret-aversion operationalization — is v1.21+ scope. Added to backlog as 999.x. Reviewed at next milestone planning. Requires Phase 57.2 fixes to be properly explored (the tool to explore better should precede using that tool to design the adaptive system).

**Audit Workflow → Phase 57.3 (immediately after 57.2):**
Structured audit workflow (date-first directories, task specs + agent outputs preserved, session metadata, cross-model review invocation, epistemic ground rules for audit agents). Depends on 57.2 for the typed claim vocabulary and provenance format which audit specs should use. Small focused phase so that Phase 58+ benefits from proper audit infrastructure. Scope includes formalizing the conventions informally established during this session's audit attempts, and the anti-verificationist ground rules that made the third audit substantially better than the first two.

## Predictions

<!--
Predictions make the deliberation falsifiable (Lakatos). If adopted, what should we
observe? If we don't observe it, the deliberation's reasoning was flawed.
Record predictions BEFORE implementation so they can't be retrofitted.
-->

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | After template fix, exploratory --auto CONTEXT.md files will have assumptions, constraints, guardrails, and structured questions sections | Next phase using --auto exploratory after 57.2 ships | CONTEXT.md still has only 4-5 sections |
| P2 | Typed claim states will distribute claims across multiple types rather than concentrating in [grounded]; specifically, claims currently marked [grounded] will split roughly into anchored (~30%), framework (~25%), assumed (~30%), decided (~15%) | Next 3 exploratory CONTEXT.md files | >60% of claims still concentrate in a single type (indicating the vocabulary isn't doing epistemic work) |
| P3 | A random sample of 5 `anchored` claims in post-fix CONTEXT.md files will have zero phantom citations (every cited artifact exists and the cited passage supports the claim) | Independent audit after next 3 phases | Any phantom citations found in anchored claims |
| P4 | The discuss-phase will NOT achieve Phase-52-level generative question quality without either interactive input or a dedicated exploration agent — typed claims and template sections improve structure but not the quality of questions asked | Next 3 phases with --auto after 57.2 | CONTEXT.md question quality matches Phase 52-54 (generative, methodology-specifying) with template fix alone |
| P5 | Decoupling epistemic status from auto-progression eligibility will reduce the [grounded]-everything incentive — phases run with --auto after the fix will have more `assumed` and `open` claims than before | Next 3 --auto phases | --auto phases still show >80% of claims in auto-progression-eligible states |
| P6 | Plans generated from post-fix CONTEXT.md files will show at least one instance of questioning a CONTEXT.md assumption (rather than treating all claims as settled) per phase | Next 3 phases | All plans implement all CONTEXT.md claims without questioning any |
| P7 | If a dedicated exploration agent is built (future phase), it will produce more open questions and working assumptions than locked decisions per CONTEXT.md — the agent's epistemic posture will differ structurally from the orchestrator's | First phase using the agent | Agent produces more locked decisions than open questions, or output is indistinguishable from orchestrator-produced CONTEXT.md |

## Decision Record

<!--
Filled when status moves to `concluded` or `adopted`.
-->

**Decision:** Two-phase response: Phase 57.2 (Exploratory Mode Repair) for immediate structural fix + future phase (v1.20 or v1.21) for adaptive harness design. See Recommendation section for full scope.
**Decided:** 2026-04-09
**Implemented via:** Phase 57.2 (to be added to ROADMAP.md); adaptive harness phase TBD
**Signals addressed:** sig-2026-04-09-exploratory-mode-epistemic-quality-regression, sig-2026-04-09-discuss-phase-workflow-gaps

### Meta-observation: the audit process itself exhibited the problem

Three audits were conducted during this deliberation. Each exhibited epistemic failures mirroring the discuss-phase regression being investigated:

- **Audit 1** (outcome-comparison-audit.md): Counted signals without reading them. Measured plan quality by technical detail (category error). Treated verification pass rates as evidence of plan quality when verification checks spec compliance, not spec quality. Listed 4 "possible explanations" for signal density drop without investigating any.
- **Audit 2** (audit-review-and-deepening.md): Claimed pre-work artifacts were "automated workflow products" without checking whether the cited workflows exist (they don't — no `/gsdr:drift-survey` command exists). Claimed "Phase 56 planner corrected CONTEXT.md" without reading the CONTEXT.md (which had the lifecycle question correctly marked as [open]).
- **Audit 3** (rigorous-comparative-audit.md): After explicit anti-verificationist instructions, produced substantially better work — quoted file:line, tested disconfirming evidence, corrected prior errors.

This progression is itself evidence: the quality of epistemic investigation depends on the quality of the investigation's scoping and ground rules. An audit dispatched with a shallow task spec produces shallow results with confident-sounding qualifications. An audit dispatched with explicit epistemic ground rules, anti-patterns to avoid, and disconfirming-evidence requirements produces traceable, honest findings. The same lesson applies to the discuss-phase: structural requirements for epistemic rigor produce more rigorous output than advisory instructions.

## Evaluation

<!--
Filled when status moves to `evaluated`.
-->

**Evaluated:** —
**Evaluation method:** —

## Supersession

<!--
Filled when status moves to `superseded`.
-->

**Superseded by:** —
**Reason:** —
