# Review: Spike Epistemic Rigor and Framework Reflexivity

**Date:** 2026-03-21
**Artifact under review:** `spike-epistemic-rigor-and-framework-reflexivity.md`
**Review status:** Provisional
**Current caution:** This review is grounded in a real failure family, but it may still over-read one spike program into framework-wide conclusions if later spike work turns out to have different failure dynamics.

## 1. Scope and evidence reviewed

This review is based on four evidence layers, not just on the deliberation's own prose:

- The deliberation's core evidence and framing sections, especially the concrete failure chain at `spike-epistemic-rigor-and-framework-reflexivity.md:136-173`, the option analysis at `spike-epistemic-rigor-and-framework-reflexivity.md:175-274`, and the research-paradigm critique at `spike-epistemic-rigor-and-framework-reflexivity.md:287-376`.
- Arxiv-sanity local signals that directly motivated the deliberation:
  - `sig-2026-03-19-spike-framework-scope-gap.md`
  - `sig-2026-03-20-spike-experimental-design-rigor.md`
  - `sig-2026-03-20-premature-spike-decisions.md`
  - `sig-2026-03-20-deliberation-naming-convention.md`
- Arxiv-sanity global signals that reinforce the same pattern from adjacent spike work:
  - `2026-03-18-premature-spike002-closure.md`
  - `2026-03-19-circular-evaluation-bias.md`
  - `2026-03-19-gaps-not-proactively-identified.md`
  - `2026-03-19-measuring-wrong-thing-filtering.md`
  - `2026-03-19-untested-hypotheses-as-findings.md`
- Framework signals in `get-shit-done-reflect` that matter for operational translation:
  - `2026-02-11-premature-spiking-no-research-gate.md`
  - `2026-02-11-spike-design-missing-feasibility.md`
  - `2026-03-04-deliberation-skill-lacks-epistemic-verification.md`
  - `2026-03-06-plan-verification-misses-architectural-gaps.md`

The review also uses the cross-project signal survey in `2026-03-21-deliberation-signal-landscape.md` as a triangulation layer.

## 2. What this deliberation is doing unusually well

### A. It is anchored in a genuine failure sequence

This artifact does not start from abstract dissatisfaction. It starts from a chain of concrete failures:

- skipped qualitative checkpoints
- a thin extension experiment using Jaccard as a sole decision criterion
- evaluation entanglement around one model family
- a DECISION artifact whose qualifications undercut its own conclusions
- retroactive cross-spike qualification

That grounding matters. The arxiv-sanity signal family does not just document one bad write-up. It documents a recurring pattern:

- `sig-2026-03-20-premature-spike-decisions.md` shows the closure problem
- `sig-2026-03-20-spike-experimental-design-rigor.md` shows the design-review problem
- `2026-03-19-measuring-wrong-thing-filtering.md` shows the metric-substitution problem
- `2026-03-19-untested-hypotheses-as-findings.md` shows the causal-overreach problem
- `2026-03-19-gaps-not-proactively-identified.md` shows the missing-question-generation problem

So the deliberation's main move is justified: the spike workflow is not merely under-documented. It appears to have a real weakness around inquiry quality, review timing, and closure pressure.

### B. It distinguishes several possible causes instead of pretending to have isolated one

The strongest section in the deliberation is the interpretive-horizon question at `spike-epistemic-rigor-and-framework-reflexivity.md:171-173`. That section prevents a common design mistake: treating the first plausible cause as the actual cause.

The file keeps at least four live hypotheses in play:

- template pressure
- execution-context pressure
- agent disposition toward closure
- co-constitution between form, context, and operator behavior

That is a real strength. It means the deliberation is not simply blaming the `DECISION.md` template for everything that went wrong.

### C. It keeps critique from collapsing into certification

The option analysis is not just a feature list. Each option is evaluated for how it might neutralize the very thing it is supposed to protect. That is an important move for harness design.

Translated into technical language, the deliberation is warning against:

- review loops that become "approved therefore sound"
- new fields that merely create the appearance of reflexivity
- new signal types that preserve traces only by flattening them
- dynamic forms that still fail because users only annotate what the form already made visible

This is one of the artifact's most valuable contributions. It makes explicit that "more structure" and "better inquiry" are not the same thing.

### D. It correctly widens the problem from spike design to framework reflexivity

The `get-shit-done-reflect` signals strengthen that widening:

- `2026-03-04-deliberation-skill-lacks-epistemic-verification.md` shows that even deliberation can reproduce the same pattern of unsupported claims.
- `2026-02-11-premature-spiking-no-research-gate.md` shows that the workflow can begin in the wrong mode before design even starts.
- `2026-02-11-spike-design-missing-feasibility.md` shows the absence of a feasibility layer before experimentation.

So the deliberation is not wrong to ask whether the system can critically examine its own categories. There is signal support for that concern outside the arxiv-sanity spike family.

## 3. What this deliberation seems to be pushing toward in design terms

If translated out of the philosophical vocabulary and into harness language, the artifact seems to be arguing for:

- experiments that can end in qualified or deferred outcomes rather than forced closure
- pre-execution methodological challenge, not only post-hoc qualification
- explicit distinction between measurement quality, interpretation quality, and extrapolation scope
- a place to record when the problem is partly the framework's own representational choices
- review structures that generate questions rather than merely approvals
- a workflow that can shift from confirmatory mode to exploratory mode midstream without pretending that is a failure

That is a strong design program. It is also more specific than "be more rigorous." It describes several concrete failure classes the current workflow should become better at resisting.

## 4. Main gaps, underdeveloped areas, and risks

### A. Governance and source-of-truth ambiguity

The file says `project: arxiv-mcp` and points to a `~/.claude/...` canonical location while also claiming framework-level scope. That is not a cosmetic issue. It creates ambiguity about:

- who owns the artifact
- which repo should evolve it
- whether it is project evidence, framework deliberation, or both

This problem is reinforced by:

- `sig-2026-03-20-agent-acted-without-asking.md`
- `sig-2026-03-20-deliberation-naming-convention.md`
- `sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift.md`

Together they suggest that the framework still lacks a stable authority model for where deliberative material should live and how it should be discovered.

### B. The deliberation is deeper on diagnosis than on intervention staging

This is probably the biggest practical gap.

The file is strong at naming the problem, but weaker at sequencing remedies by reversibility and cost. It underplays thinner options such as:

- reusing existing checker patterns before inventing new reviewer subsystems
- changing spike statuses and artifact language before introducing new agent roles
- distinguishing spike-level fixes from general deliberation-system fixes
- adding one strong pre-execution design challenge step before a broader inquiry redesign

This is important because the signal field does not yet prove that a new subsystem is required. It proves that current spike practice is insufficient. That is not the same claim.

### C. The deliberation still lacks a clean way to distinguish three kinds of change

The artifact sometimes moves between these without fully separating them:

- changes to spike artifact language
- changes to spike workflow and review loops
- changes to the wider deliberation/signal apparatus

That matters because each has a different cost and dependency profile. If they stay blurred together, roadmap work will be hard to scope cleanly.

### D. "Dialogue matters" is persuasive but still under-operationalized

The file is probably right that the deepest critique came through sustained challenge rather than through a predefined template. But the current operational translation is still thin.

Possible operational meanings include:

- a required human review lane for certain spike classes
- cross-model critique before finalization
- question-generation passes instead of pass/fail review
- synchronous or semi-synchronous critique sessions for high-consequence spikes

The deliberation does not yet decide among these, and it may be too early to decide. But it still needs to be clearer that "dialogue" cannot remain only as a general remainder term.

### E. It does not yet integrate the "program/campaign" issue strongly enough

`sig-2026-03-19-spike-framework-scope-gap.md` shows that the problem is not only closure pressure. It is also that some investigations are not well modeled as single bounded spikes. The deliberation brushes this through the "experiment becomes exploratory" concern, but it does not yet fully engage the possibility that the framework needs a distinct campaign/program concept.

That could matter a lot. Some failures may come from trying to squeeze multi-wave inquiry into single-spike form.

## 5. Apparatus-change options opened by this deliberation

These are options under uncertainty, not settled recommendations.

### Option 1: Minimal spike hardening

Changes:

- allow explicit spike outcomes such as `deferred`, `qualified-local`, `follow-up-required`
- require pre-execution design challenge using current reviewer patterns
- require final artifacts to separate measured result from architectural implication

Why it seems plausible:

- directly addresses the premature-closure signals
- low cost and easy to stage
- allows a fast test of whether the spike problem is mostly procedural

What could make it insufficient:

- if the core problem is that multi-wave investigations are structurally outside the current spike model
- if the deeper issue is absence of question-producing challenge rather than absence of form fields

### Option 2: Moderate redesign with a question-producing spike review loop

Changes:

- design review before execution
- findings challenge before final decision language
- reviewer outputs framed as open questions, disconfirming possibilities, and required qualifications rather than approval stamps

Why it seems plausible:

- it preserves the deliberation's strongest lesson that critique should not become certification
- it is closer to existing GSD patterns than a total spike redesign

What could make it wrong:

- it may still proceduralize critique too much
- it may solve known failure modes while missing truly novel ones

### Option 3: Broader inquiry redesign

Changes:

- redesign spikes around iterative inquiry rather than one-shot decision artifacts
- potentially add a campaign/program layer for multi-wave work
- revise artifact ecology together: DESIGN, FINDINGS, DECISION, review, qualification, follow-up

Why it seems plausible:

- strongest fit to the evidence from Spike 003 and the campaign-scope signal

Why it may be premature:

- high design cost
- high risk of overbuilding before thinner interventions are tested
- current evidence is still concentrated in one project family

## 6. Roadmap implications and dependency map

### Current v1.18

My current reading is that this should not become a new v1.18 implementation phase.

Why:

- current phases 49-51 are already about migration, update hardening, and authority/preflight concerns
- these spike/inquiry questions are important, but they are a different workstream
- inserting them now would likely destabilize the current milestone rather than clarify it

The most current-v1.18 should do is acknowledge this as a next-milestone pressure in the relevant governance/docs closeout phase.

### Next milestone placement

This deliberation should influence the next milestone strongly, but not alone. Its dependencies suggest this order:

1. Deliberation artifact and discovery contract
2. Reflexive trace and overflow support
3. Spike challenge / qualified outcome redesign
4. Only then decide whether a spike program/campaign concept is warranted

Why that order currently seems sensible:

- the spike redesign work needs better artifact/discovery primitives anyway
- the signal field shows that deliberation, traceability, and framework-level observation already have unresolved infrastructure problems
- a campaign/program layer would be hard to design responsibly before those lower layers stabilize

### How it should affect existing roadmap direction

The main directional effect is not "insert a spike phase now." It is:

- next milestone should contain a real spike-methodology redesign track
- that redesign should be checker/challenge oriented, not only template oriented
- the redesign should remain open to the possibility that some problems are caused by scope mismatch, not only by weak review

## 7. What this deliberation is still missing

If this artifact is revised again, the most useful additions would be:

- a cleaner distinction between local spike evidence and framework-general claims
- an explicit treatment of the program/campaign possibility
- a staged intervention table ordered by cost, reversibility, and likely discriminative value
- a more explicit statement of what evidence would falsify the "template pressure matters materially" reading
- a stronger governance statement about where this artifact should actually live

## 8. Open tensions that should remain open

- whether the real culprit is template shape, workflow shape, operator behavior, or their interaction
- whether dialogue can be partially operationalized without being neutralized
- whether a stronger spike reviewer would genuinely help or merely create a new certification theater
- whether some spike failures are really campaign-shape failures

## 9. Current provisional judgment

This is the strongest of the four deliberations as an immediate driver of future framework change.

That does not mean it should dominate the whole roadmap by itself. It means:

- it has the strongest empirical grounding
- it names a real weakness in inquiry quality
- it should probably become one of the earliest design pressures in the next milestone

The most important caution is that its best ideas still need staging discipline and cleaner governance before they turn into roadmap work.
