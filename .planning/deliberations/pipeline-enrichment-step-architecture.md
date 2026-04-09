# Deliberation: Pipeline Enrichment Step — Fork-Specific Stage Between Discuss and Plan

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
**Trigger:** User observation during Phase 57.2 scoping — the current 57.2 plan (Discuss-Phase Exploratory Mode Overhaul) requires heavy modification of discuss-phase.md, which is primarily upstream code. User proposed an architectural alternative: insert a fork-specific enrichment step between discuss-phase and plan-phase, keeping discuss-phase close to upstream while doing the epistemic enrichment work in a new fork-only workflow. This reframe addresses both the quality regression AND fork maintenance cost.
**Affects:** Phase 57.2 scope, discuss-phase.md, plan-phase pipeline, --chain workflow, ROADMAP.md (potentially all future phases)
**Related:**
- `.planning/deliberations/exploratory-discuss-phase-quality-regression.md` (concluded — this deliberation may partially supersede its recommendation)
- `.planning/deliberations/epistemic-health-and-variety.md` (open — Prescription 2: adversarial deliberation step)
- `.planning/deliberations/deliberative-council-and-epistemic-framework.md` (open — multi-agent council as mature form)
- sig-2026-04-09-exploratory-mode-epistemic-quality-regression (critical)
- sig-2026-04-09-discuss-phase-workflow-gaps (notable)
- sig-2026-04-09-auto-flag-scoping-ambiguity-discuss-vs-chain (notable)
- sig-2026-04-09-exploration-outputs-lack-artifact-traceability (notable)
- sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop (high)
- sig-2026-03-27-plan-03-adopted-discuss-phase-md-without-detecting (notable)
- `.planning/FORK-DIVERGENCES.md`
- Upstream Issue #33 (first-class exploratory discuss mode)
- Upstream Issue #26 (discuss-phase --auto semantics)
- Upstream Issue #36 (future_awareness in CONTEXT.md)

## Situation

### The architectural tension

Phase 57.2 was scoped as "Discuss-Phase Exploratory Mode Overhaul" — 8 structural fixes and 3 subagent design explorations, all modifying `discuss-phase.md`. The quality regression deliberation (concluded 2026-04-09) identified four root causes for the exploratory mode producing shallow locked-down specs:

1. **Structural:** write_context template (lines 906-1002) lacks exploratory sections (assumptions, guardrails, constraints, structured questions)
2. **Incentive-driven:** [grounded] does double duty as epistemic status AND auto-progression gate (Goodhart problem)
3. **Interaction-regime-dependent:** peak-era quality was interactive, never systematized
4. **Validation-poor:** phantom citations, no citation integrity checking

The 57.2 plan addresses all four by modifying discuss-phase.md. But discuss-phase.md is primarily upstream code — both source and installed copies are 1,208 lines, with only 85 lines of namespace substitution between them. The three-mode system was a fork addition (commit e4ae09b0, April 2), and the upstream sync gap is already a maintenance concern (sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop: Phase 52's wholesale-replace adopted only 1 of 8 discuss_mode feature components).

The user's insight: **rather than making discuss-phase.md even more fork-divergent, extract the epistemic enrichment work into a new fork-specific pipeline stage.** This keeps discuss-phase close to upstream and puts all fork-specific epistemic work in a file that will never conflict during upstream syncs.

### The current pipeline

```
/gsdr:discuss-phase <phase>
  ├── ... (upstream steps: scout, analyze, discuss, etc.)
  ├── write_context → {PADDED}-CONTEXT.md
  ├── confirm_creation (manual: shows "Next Up: plan-phase")
  └── auto_advance (--auto/--chain: Skill("gsd:plan-phase"))
        └── plan-phase receives CONTEXT.md as steering input
```

The insertion point is between write_context output and plan-phase invocation — either:
- In auto_advance: before `Skill("gsd:plan-phase")` at line 1150
- In confirm_creation: in the "Also available" block at lines 1037-1041

### The proposed pipeline

```
/gsdr:discuss-phase <phase>
  ├── ... (upstream steps — minimal modifications)
  ├── write_context → {PADDED}-CONTEXT.md
  ├── [NEW] enrichment step → enriched CONTEXT.md (or companion doc)
  ├── confirm_creation (updated: show enrichment step as next/done)
  └── auto_advance (updated: chain through enrichment before plan)
        └── plan-phase receives enriched output
```

### Fork divergence cost comparison

**Current 57.2 plan (modify discuss-phase.md):**
- write_context template: add ~6 exploratory sections (~60-80 lines)
- Typed claim states: replace [grounded]/[open] throughout workflow (~20+ locations)
- Rename "Implementation Decisions" section header
- Add citation checker logic
- Add incentive decoupling mechanism
- Cherry-pick --chain (DISC-05, 7 lines)
- CONTEXT.md commit gap fix (~5 lines)
- **Total estimated: 100+ lines modified in upstream-derived file**

**Proposed alternative (new enrichment step):**
- discuss-phase.md: cherry-pick --chain (7 lines), commit gap fix (5 lines), routing to enrichment step (~15 lines)
- New fork-only workflow file: all epistemic enrichment logic (~200-400 lines, zero merge conflicts)
- **Total discuss-phase.md modification: ~27 lines**

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| discuss-phase.md (both copies, 1208 lines) | File is primarily upstream code; 85-line diff is pure namespace substitution | Yes — agent diffed both copies | informal |
| auto_advance step (lines 1116-1185) | Insertion point exists: Skill("gsd:plan-phase") at line 1150, confirm_creation "Also available" at lines 1037-1041 | Yes — read both steps directly | informal |
| write_context template (lines 906-1002) | Template has 6 sections (domain, decisions, canonical_refs, code_context, specifics, deferred); missing assumptions, guardrails, constraints, structured questions | Yes — read template directly | sig-2026-04-09-exploratory-mode-epistemic-quality-regression |
| config.json workflow keys | Per-step gating pattern exists: skip_discuss, auto_advance, research_before_questions, discuss_mode | Yes — read config.json | informal |
| FORK-DIVERGENCES.md | Fork maintenance tracks merge stance per module; discuss-phase.md currently has no explicit stance but is "Modified upstream file" | Yes — read manifest | informal |
| Quality regression deliberation | Identified 4 root causes; recommended 8 structural fixes + 3 subagent explorations, all in discuss-phase.md | Yes — read deliberation (concluded) | sig-2026-04-09-exploratory-mode-epistemic-quality-regression |
| Epistemic-health deliberation Prescription 2 | Proposes adversarial step after initial convergence — structurally similar to enrichment step concept | Yes — read deliberation (open) | informal |
| sig-2026-04-03 discuss-mode adoption gap | Phase 52 wholesale-replace lost 7 of 8 discuss_mode components — evidence that heavy modifications to upstream-derived files create maintenance hazards | Yes — signal documented | sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop |
| GitHub Issues 26, 32, 33 (closed v1.19.0) | Three-mode system formalized as upstream-compatible config; already shipped | Yes — agent read issues | informal |
| GitHub Issue 36 (open) | Proposes future_awareness section in CONTEXT.md — another case of wanting to enrich discuss-phase output | Yes — agent read issue | informal |

## Framing

**Core question:** Should Phase 57.2 shift from "overhaul discuss-phase.md directly" to "insert a fork-specific enrichment step between discuss and plan" — moving the epistemic enrichment work out of upstream-derived code and into a fork-only workflow that runs by default in the --chain pipeline?

**Adjacent questions:**
- What should the enrichment step be called? (e.g., `enrich-context`, `deepen-context`, `challenge-context`)
- Does it transform CONTEXT.md in-place, or produce a companion document (CONTEXT-RATIONALE.md)?
- How does it connect to the explore skill (57.1) and its Socratic questioning infrastructure?
- How does it connect to the adversarial deliberation prescription (epistemic-health Prescription 2)?
- Should it be skippable per-phase, and if so, what determines when to skip?
- Does the ROADMAP eventually annotate phases with complexity/exploration-depth indicators?
- What happens to the quality regression deliberation's recommendations — are some still in-scope for discuss-phase.md, or do all epistemic improvements move to the enrichment step?
- What is the enrichment step's relationship to a future dedicated discuss-phase exploration subagent (quality regression deliberation Option B)?

## Analysis

### Option A: Current 57.2 plan — modify discuss-phase.md directly

- **Claim:** Implement all 8 structural fixes and 3 subagent explorations directly in discuss-phase.md as the quality regression deliberation recommends. This includes template sections, typed claim states, probes, citation checker, incentive decoupling, section rename, --chain fix, and commit gap fix.
- **Grounds:** The discuss-phase is where CONTEXT.md is produced. Fixing the template where it lives is the most direct intervention. The quality regression deliberation's analysis is thorough and well-grounded (4 root causes, 7 predictions, cross-model review).
- **Warrant:** Fix the problem at the source. The discuss-phase is responsible for producing quality output; making it produce better output is logically coherent.
- **Rebuttal:** discuss-phase.md is upstream-derived code. Every line modified increases merge conflict risk during upstream syncs. The Phase 52 wholesale-replace (sig-2026-04-03) already demonstrated the hazard: 7 of 8 discuss_mode components were silently dropped. The more we modify discuss-phase.md, the harder future syncs become. Additionally, this approach couples fork-specific epistemic philosophy to upstream workflow structure — if upstream restructures discuss-phase, all our additions must be re-applied.
- **Qualifier:** Probably sufficient for the quality regression fix, but accrues fork maintenance debt proportional to the modification scope.

### Option B: Fork-specific enrichment step between discuss and plan

- **Claim:** Keep discuss-phase.md close to upstream (only --chain fix + commit gap + routing, ~27 lines). Move all epistemic enrichment work — assumptions, guardrails, constraints, structured questions, typed claim states, probes, citation checking — into a new fork-only workflow file that runs between discuss-phase and plan-phase. This step runs by default for --chain and --auto, is offered manually after discuss, and is configurable (eventually ROADMAP-annotatable per-phase).
- **Grounds:** A new fork-only file has zero merge conflict risk with upstream. The insertion point exists cleanly (auto_advance Skill call at line 1150, confirm_creation "Also available" at lines 1037-1041). The config pattern for per-step gating already exists (skip_discuss, auto_advance, etc.). This architectural pattern mirrors how plan-phase already works: researcher subagent + planner subagent + checker — separate steps with separate concerns.
- **Warrant:** Fork maintenance discipline (FORK-DIVERGENCES.md merge stance system) already establishes the principle: put fork-specific logic in fork-only files (keep-fork stance) rather than modifying upstream files (which require hybrid merge). The enrichment step is purely fork philosophy — upstream GSD doesn't have "exploratory mode epistemic enrichment." It should live in a fork-only file, not be grafted onto upstream workflow.
- **Rebuttal:** Adds a pipeline stage. More moving parts. The enrichment step must understand the CONTEXT.md structure well enough to modify or extend it — coupling to the output format even if not coupled to the producing code. If upstream changes the CONTEXT.md structure, the enrichment step breaks silently (it reads/modifies a format it doesn't control). Also: discuss-phase still has the Goodhart incentive problem ([grounded] as progression gate) — if the enrichment step can fix that, fine; but if it requires changing the auto_advance logic in discuss-phase.md, some modification is unavoidable.
- **Qualifier:** Probably the right architecture. The merge conflict reduction is concrete and significant. The output format coupling is real but manageable (CONTEXT.md structure is already a de facto contract between discuss-phase and plan-phase).

### Option C: Hybrid — workflow fixes in discuss-phase, epistemic work in enrichment step

- **Claim:** Split the 57.2 scope: small workflow fixes stay in discuss-phase.md (--chain flag, commit gap, Goodhart incentive decoupling in auto_advance); all epistemic enrichment (template sections, typed claims, probes, citations, structured questions) goes in the new enrichment step.
- **Grounds:** The --chain flag (DISC-05) and commit gap fix are clearly discuss-phase bugs, not epistemic enrichment. The Goodhart fix (decoupling [grounded] from auto-progression) touches the auto_advance step, which is in discuss-phase.md regardless. These are ~25-30 lines of changes that fix workflow mechanics, not epistemic philosophy.
- **Warrant:** Clean separation of concerns: discuss-phase handles workflow mechanics (mode routing, codebase scouting, gray area discussion, auto-progression); enrichment step handles epistemic quality (assumptions, guardrails, probes, citation integrity). Each file owns one concern.
- **Rebuttal:** The Goodhart fix might be deeper than "change auto_advance." If typed claim states replace [grounded]/[open] throughout the workflow, that's not just auto_advance — it's discuss_areas, write_context, and elsewhere. Whether this is a "workflow fix" or "epistemic enrichment" depends on where the typed vocabulary is introduced. If discuss-phase still uses [grounded]/[open] and the enrichment step converts to typed states, there's a translation layer. If discuss-phase is updated to use typed states natively, that's back in Option A territory.
- **Qualifier:** Presumably the right split, contingent on the Goodhart fix being achievable with minimal discuss-phase.md changes.

## Tensions

1. **Output format ownership:** discuss-phase produces CONTEXT.md. The enrichment step modifies or extends it. Who owns the format? If upstream changes CONTEXT.md structure, does the enrichment step silently break? This is the same coupling problem as grafting onto discuss-phase.md, just shifted one layer out.

2. **Typed claim states scope:** The quality regression deliberation's typed states (anchored, assumed, framework, observed, open, decided) replace [grounded]/[open]. If these are introduced in the enrichment step, discuss-phase still uses [grounded]/[open] internally — creating a translation boundary. If introduced in discuss-phase, that's a significant modification to upstream code. Where does the vocabulary live?

3. **Enrichment step as the adaptive harness seed:** The user envisions this step as eventually ROADMAP-annotatable — simple phases skip it, complex phases run it, load-bearing phases get deeper exploration. This is the "adaptive harness" from the quality regression deliberation's emerging design space. Building the enrichment step now seeds that architecture. But: adaptive behavior requires per-phase metadata that doesn't exist yet. The step can be configurable globally (on/off) now; per-phase adaptivity is future work.

4. **Connection to explore skill (57.1) and adversarial deliberation:** The enrichment step, the explore skill's Socratic questioning, and the epistemic-health deliberation's adversarial step are three designs converging on the same space: "challenge the output before it becomes input to planning." Should the enrichment step USE the explore skill's infrastructure? Should it BE the adversarial step? Or are these three distinct tools for different contexts?

5. **Naming signals intent:** "enrich-context" implies additive (we make it better). "challenge-context" implies adversarial (we probe its weaknesses). "deepen-context" implies analytical (we go deeper). The name shapes what the step becomes. The quality regression deliberation's analysis suggests it should do all three — but the primary need is adversarial: the discuss-phase is too quick to mark things as settled.

## Recommendation

**Conclusion: Defer enrichment step. Proceed with discuss-phase modification (Option A) for 57.2.**

The enrichment step architecture (Option B/C) is sound but premature. The deliberation surfaced important design insights — particularly that CONTEXT.md's locking mechanism is a two-sided problem (output format + plan-phase consumption contract), and that a separate pipeline stage could cleanly separate fork epistemic work from upstream workflow. However:

1. **Immediate need is simpler:** CONTEXT.md already does valuable non-decision-locking work (environmental context, code context, references, design grey areas). The acute problem is that the template lacks sections for assumptions, guardrails, and structured questions. Adding those to discuss-phase.md is the direct fix.
2. **Premature without telemetry:** We don't yet have measurement to know whether the discuss-phase modification is sufficient or whether a separate step is needed. Phase 57 (telemetry baseline) will provide that.
3. **Plan-phase contract needs rethinking too:** The "Decisions = LOCKED" contract may need modification to handle working assumptions and challenged decisions. That's a broader change that should be designed after the discuss-phase improvements are in place and measured.
4. **The enrichment step idea is preserved:** This deliberation captures the full design space. When telemetry shows whether discuss-phase modification alone is sufficient (quality regression deliberation P4 tests this), the enrichment step can be revisited with data.

**What 57.2 should focus on:**
- Enhance CONTEXT.md template with non-decision-locking content: working assumptions, epistemic guardrails, derived constraints, design grey areas as genuinely open, structured questions
- Workflow fixes: --chain flag (DISC-05), CONTEXT.md commit gap
- Typed claim states and citation integrity within discuss-phase
- Expose problem context and situational context more richly

**Deferred to post-telemetry (backlog 999.x):**
- Enrichment step as separate pipeline stage (Option B/C from this deliberation)
- Plan-phase contract modification ("Decisions = LOCKED" rethink)
- ROADMAP annotations for per-phase exploration depth
- Two-document output (CONTEXT.md + EXPLORATION.md)

## Predictions

<!--
Predictions make the deliberation falsifiable (Lakatos). If adopted, what should we
observe? If we don't observe it, the deliberation's reasoning was flawed.
Record predictions BEFORE implementation so they can't be retrofitted.
-->

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Upstream syncs of discuss-phase.md after the enrichment step ships will require resolving fewer merge conflicts than they would under the current 57.2 plan (Option A) | Next upstream sync that touches discuss-phase.md | The enrichment step architecture requires MORE discuss-phase.md modifications than Option A to function |
| P2 | The enrichment step will produce CONTEXT.md files with the structural sections the quality regression identified as missing (assumptions, guardrails, constraints, structured questions) | First 3 phases run through the enrichment step | CONTEXT.md files still lack these sections |
| P3 | Plan-phase will not need modification to consume enriched CONTEXT.md — the existing "Decisions = LOCKED" contract extends naturally to the new sections | First plan-phase run after enrichment step ships | Plan-phase fails to read or act on enriched sections, requiring plan-phase modifications |
| P4 | The enrichment step will surface at least 1 assumption or weakness per CONTEXT.md that discuss-phase marked as settled — demonstrating that the step adds epistemic value, not just structural compliance | First 5 phases | Enrichment step rubber-stamps all discuss-phase outputs without surfacing any new concerns |
| P5 | Fork maintenance cost for discuss-phase.md will decrease (measured by diff-lines-from-upstream remaining stable or shrinking across syncs) | Next 2 upstream syncs | Diff-lines-from-upstream increases despite the architectural change |

## Decision Record

<!--
Filled when status moves to `concluded` or `adopted`.
-->

**Decision:** Defer enrichment step architecture. Proceed with discuss-phase modification (Phase 57.2 as originally scoped from quality regression deliberation). Enrichment step preserved as backlog item for post-telemetry evaluation.
**Decided:** 2026-04-09
**Implemented via:** Phase 57.2 (discuss-phase modification); enrichment step deferred to backlog 999.x
**Signals addressed:** sig-2026-04-09-exploratory-mode-epistemic-quality-regression (via 57.2), sig-2026-04-09-discuss-phase-workflow-gaps (via 57.2)

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
