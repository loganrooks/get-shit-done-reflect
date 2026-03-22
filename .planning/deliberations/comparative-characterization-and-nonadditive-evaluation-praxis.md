# Deliberation: Comparative Characterization and Non-Additive Evaluation Praxis

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Additional philosophical orientation used in this deliberation:
- van Fraassen on empirical adequacy and epistemic stance
- Mayo on severe testing
- Cartwright on patchy capacities and local validity

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-21
**Status:** Open
**Trigger:** Review of Spike 004's design and subsequent user dialogue clarified that the project wants more rigor and repeatability than a conventional benchmark often supplies, not less. The question is how to operationalize that rigor without collapsing the research program into a narrow winner-picking benchmark or an additive spike sequence.
**Affects:** Spike 004 framing and execution, future spike methodology, evaluation asset design, Open Question 12, downstream architectural decision discipline
**Source Project Context:**
- This deliberation belongs to the `arxiv-sanity-mcp` project at `/home/rookslog/workspace/projects/arxiv-sanity-mcp`.
- Relative paths in this document such as `.planning/...` and `docs/...` are relative to that repository root, not to `get-shit-done-reflect`.
- A symlink exists in `get-shit-done-reflect` for cross-project reflection and methodological traceability; that symlink should not be read as meaning the deliberation originated in the GSDR repo.
- Cross-project references into `get-shit-done-reflect` are methodological context only, especially the linked deliberation on spike epistemic rigor and framework reflexivity.
**Creation Context:**
- This deliberation was created during a live conversation that began as a review of Spike 004's design and then widened into a methodological dispute about what rigor should mean for this project's spike program.
- The immediate pressure came from a mismatch between two framings: "avoid turning the spike into a benchmark study" versus the user's insistence that rigor and repeatability remain non-negotiable and may require something more demanding than a conventional benchmark, not less.
- The conversation then shifted from a local Spike 004 critique toward a broader research-program question: whether evaluation should be additive or whether later experiments must be allowed to qualify, split, or supersede earlier claims.
- A further turn in the discussion introduced a van Fraassen-inflected orientation, then expanded into a mixed praxis also drawing on Mayo, Dewey, Cartwright, and Lakatos to avoid both metric absolutism and soft anti-foundationalism.
**Intended Use:**
- Provide a methodological frame for revising Spike 004 so its protocol produces comparative characterization rather than a premature winner-picking verdict.
- Give future spikes and evaluation assets a clearer structure for claim-local rigor, condition-sensitive interpretation, and non-additive claim revision.
- Serve as a cross-project reflection artifact for GSDR workflow adaptation, especially around what deliberation documents can and cannot preserve from dialogical inquiry.
**Related:**
- `.planning/spikes/004-embedding-model-evaluation/DESIGN.md`
- `.planning/spikes/004-embedding-model-evaluation/reviews/2026-03-21-codex-design-review.md`
- `.planning/spikes/003-strategy-profiling/DECISION.md`
- `.planning/spikes/003-strategy-profiling/FINDINGS.md`
- `.planning/spikes/003-strategy-profiling/experiments/reviews/cross_spike_qualifications.md`
- `.planning/knowledge/signals/arxiv-mcp/sig-2026-03-20-jaccard-screening-methodology.md`
- `.planning/knowledge/signals/arxiv-mcp/sig-2026-03-20-spike-experimental-design-rigor.md`
- `.planning/knowledge/signals/arxiv-mcp/sig-2026-03-20-premature-spike-decisions.md`
- `docs/01-project-vision.md`
- `docs/02-product-principles.md`
- `docs/05-architecture-hypotheses.md`
- `docs/08-evaluation-and-experiments.md`
- `docs/10-open-questions.md`
- `/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/deliberations/spike-epistemic-rigor-and-framework-reflexivity.md`

## Situation

The project's spike program has already shown that later work can change the meaning of earlier work rather than simply add to it.

- Spike 001 advanced strong claims about SPECTER2 complementarity that later became untenable after the adapter issue was corrected and qualitative review was expanded.
- Spike 002 measured backend divergence honestly but still let Jaccard dominate the presentation logic beyond what the evidence supported.
- Spike 003 produced important knowledge but also exposed that a spike can be methodologically self-aware while still yielding premature conclusions if the workflow pressures closure.
- Spike 004 is a substantial improvement, but its current framing still tends toward "does candidate model add value over MiniLM and should architecture change?" rather than "what is the comparative profile of these strategies across conditions, and which claims are warranted under which conditions?"

The user's clarification in conversation sharpened the issue:

1. Rigor is non-negotiable.
2. Repeatability is non-negotiable.
3. Rejecting benchmark authority as sufficient does **not** mean accepting weaker certainty.
4. The goal is a comparative, critical, repeatable, condition-sensitive picture of strategy capacities and limits.
5. Experimental understanding should be allowed to be **non-additive**: later experiments may qualify, split, or supersede earlier claims rather than merely accumulate on top of them.

The design question is therefore not "benchmark or anti-benchmark?" It is: what evaluation praxis gives this project repeatable rigor while remaining open to critique, redesign, and non-monotonic learning?

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `.planning/spikes/003-strategy-profiling/DECISION.md` | Spike 003 ultimately separated supported decisions from deferred questions, but only after premature-closure issues surfaced | Yes (document read) | sig-2026-03-20-premature-spike-decisions |
| `.planning/spikes/003-strategy-profiling/experiments/reviews/cross_spike_qualifications.md` | Later spike findings changed the meaning and force of claims in Spikes 001 and 002 | Yes (document read) | informal |
| `docs/08-evaluation-and-experiments.md` | Project already prefers structured qualitative review and multi-dimensional evaluation over leaderboard-style scalarism | Yes (document read) | informal |
| `docs/02-product-principles.md` | Project values multiple relatedness operators, explainability, cost-awareness, and keeping open questions visible | Yes (document read) | informal |
| `.planning/spikes/004-embedding-model-evaluation/reviews/2026-03-21-codex-design-review.md` | Spike 004 is stronger than prior spikes but still tends toward architecture-facing closure and under-specified comparative protocol | Yes (document read) | informal |
| Conversation on 2026-03-21 | User explicitly rejected the idea that avoiding narrow benchmark formalism means accepting less rigor; clarified desire for a richer comparative characterization program | Yes (this conversation) | informal |
| `/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/deliberations/spike-epistemic-rigor-and-framework-reflexivity.md` | Formal systems risk domesticating critique; rigor mechanisms must not become false certificates of adequacy | Yes (document read) | sig-2026-03-20-spike-experimental-design-rigor |

## Framing

The immediate problem is not only how to improve Spike 004. The deeper problem is how this project should understand the epistemic object of its evaluation work.

If the object is:
- "pick a winner," then a conventional benchmark logic follows.

If the object is:
- "understand comparative capacities, limits, failure modes, and operational tradeoffs under multiple conditions," then the evaluation artifact must be different.

**Core question:** How should this project operationalize a repeatable, critical, non-additive comparative characterization program for retrieval and recommendation strategies, and what does that imply for Spike 004 specifically?

**Adjacent questions:**
- What should count as a repeatable unit of knowledge: a benchmark score, a characterization card, or a condition-local claim?
- How should later spikes revise earlier claims without producing a chaotic archive?
- What kind of human review is calibration rather than premature institutionalization?
- How much philosophical modesty is productive before it becomes indecision?
- Should Spike 004 remain a spike, or become the first phase in a larger evaluation program?

## Analysis

### Option A: Keep the current spike model, but with stronger caveats and better protocol discipline

- **Claim:** The existing spike structure is basically sound. We should tighten protocol, improve design review, and keep using spikes as the main evaluation vehicle.
- **Grounds:** Spike 004 is already much better than 001-003. The project has a working spike practice, and adding claim cards or program-level machinery may slow execution.
- **Warrant:** Improving an existing form is cheaper and more likely to remain operational than replacing it with a more ambitious research-program structure.
- **Rebuttal:** This does not really address the non-additive nature of learning already visible in the spike program. It still treats each spike as a mostly self-contained artifact with a Decision-shaped gravity well.
- **Qualifier:** Useful as an immediate patch, but probably insufficient as the long-term methodology.

### Option B: Formal benchmark program with richer metrics and stronger repeatability controls

- **Claim:** The project should create a formal benchmark asset and treat strategy evaluation as a controlled benchmark effort, with pinned datasets, fixed protocols, repeated runs, and stronger comparative certainty.
- **Grounds:** Repeatability matters, and conventional benchmark discipline is good at freezing protocol and controlling variance.
- **Warrant:** When evaluation is noisy and claims matter, benchmark structure prevents drift and makes results easier to reproduce and compare.
- **Rebuttal:** A benchmark tends to narrow the phenomenon to what the benchmark can stably measure. This project's core questions include discovery usefulness, qualitative strategy character, operational burden, and context sensitivity. Those are not well-served by a single benchmark frame. A narrow benchmark also risks creating false authority and premature winner-picking.
- **Qualifier:** Strong for measurement discipline, weak as the whole epistemic frame.

### Option C: van Fraassen-style empirical adequacy program

- **Claim:** The project should operationalize a stance-focused, empirically adequate evaluation style: record what strategies do at the level of observable recommendation behavior under specified conditions, avoid stronger realism claims about the "true" signal, and preserve multiple interpretations where the evidence underdetermines them.
- **Grounds:** This matches the project's discomfort with metric authority and with hidden metaphysical leaps from outputs to "real semantic superiority." It also fits the need for condition-local claims.
- **Warrant:** If the actual product concern is what a strategy surfaces, how it behaves, and whether that behavior is adequate for use, then empirical adequacy is a better target than global truth claims.
- **Rebuttal:** On its own, this can become too permissive. It may preserve rival interpretations without strongly enough distinguishing severe tests from weak ones, and it may underweight mechanism and protocol pathology.
- **Qualifier:** Necessary as part of the answer, but not sufficient by itself.

### Option D: Mixed praxis — comparative characterization program with severe testing and non-additive claim management

- **Claim:** The project should explicitly adopt a mixed evaluation praxis:
  - van Fraassen for empirical adequacy and stance-awareness
  - Mayo for severe testing
  - Dewey for iterative redesign in response to anomaly
  - Cartwright for local, patchy capacities rather than universal superiority
  - Lakatos for judging whether the evaluation program is becoming more progressive or merely protecting prior commitments

- **Grounds:** This mixed approach fits what the project is already learning in practice:
  - later experiments can supersede earlier interpretations
  - fixed metrics are informative but not sovereign
  - strategy strengths are conditional and local
  - anomalies should reshape the experiment, not merely be noted as caveats

- **Warrant:** No single philosophical framework fully captures the demands of this research program. The project needs:
  - repeatability
  - comparative sharpness
  - humility about claims
  - room for redesign
  - a formal way to handle supersession of earlier claims

- **Rebuttal:** A mixed praxis can become rhetorically rich but operationally vague. Without concrete artifact forms, it risks becoming a meta-methodological style rather than a working method.
- **Qualifier:** Probably the most fruitful direction, provided it is concretized in actual spike artifacts and evaluation schemas.

## Tensions

1. **Repeatability vs richness**
   A highly repeatable benchmark tends to freeze the phenomenon. A richer qualitative-comparative program risks protocol drift unless repeatability is built into the right level of the artifact.

2. **Condition-local claims vs architecture pressure**
   The project needs local and qualified claims, but the development process keeps pulling those claims toward architecture-wide conclusions.

3. **Openness to critique vs operational tractability**
   If every result remains permanently open, nothing guides design. If everything is forced into decision, the framework overclaims.

4. **Protocol stability vs redesign**
   The more severe and repeatable a protocol is, the more tempting it is to keep using it even when anomalies suggest it is measuring the wrong thing.

5. **Empirical adequacy vs mechanism**
   Output behavior matters most for product evaluation, but protocol and representational details can still invalidate comparisons if ignored.

## Recommendation

**Current leaning:** Option D — operationalize a mixed comparative-characterization praxis and use Spike 004 as the first deliberate instantiation of it.

This means a few concrete shifts.

### 1. The unit of knowledge should become the claim, not the spike-level verdict

Each meaningful finding should be recorded as a **claim card** rather than buried in synthesis prose.

Suggested schema:

| Field | Purpose |
|------|---------|
| `claim_id` | Stable reference for future qualification/supersession |
| `phenomenon` | What observable behavior is being described |
| `strategy_or_model` | What strategy the claim concerns |
| `condition` | Under what condition set the claim holds |
| `claim_text` | The actual statement |
| `evidence` | Quantitative + qualitative support |
| `measurement_confidence` | Did the instrument detect what it detects? |
| `interpretation_confidence` | Does the evidence support this interpretation? |
| `extrapolation_confidence` | Where else might it hold? |
| `rival_interpretations` | Plausible alternative readings |
| `failure_modes` | What would weaken or overturn the claim |
| `decision_relevance` | Why this matters for product or architecture |
| `status` | `holds`, `qualified`, `inconclusive`, `superseded` |

This allows later spikes to revise earlier claims without pretending the program is simply additive.

### 2. The experiment should be organized by a condition matrix, not just by model list

Spike 004 currently has profiles, but profiles are not yet the same thing as an explicit condition matrix.

Initial condition matrix for 004:

| Dimension | Values |
|----------|--------|
| Seed count | `1`, `3`, `5+` |
| Interest breadth | `narrow`, `medium`, `broad` |
| Lexical regime | `high overlap`, `vocabulary mismatch` |
| Operational mode | `local-only`, `API-dependent` |
| Candidate pool regime | `sample`, `full-corpus spot check` |
| Domain regime | `core CS/ML`, `adjacent/interdisciplinary` |

Not every Cartesian product needs to be tested. The point is to declare the relevant condition space and sample it deliberately, rather than letting context remain implicit.

### 3. The execution should be two-layered

**Layer 1: Screening**
- broad, repeatable, protocol-fixed
- quantitative pass across all selected models and condition cells
- enough to detect anomalies, divergences, and candidate cells for deeper review

**Layer 2: Deep characterization**
- qualitative and mixed-method follow-up only on important or anomalous cells
- characterize what kind of papers are surfaced, how sets differ, and what operational burdens matter

This avoids making the entire program either thinly quantitative or exhaustively qualitative.

### 4. The archive should become explicitly non-additive

Claims need a lifecycle:
- introduced
- narrowed
- qualified
- split into more local claims
- superseded

The project already does this informally through qualification notes and revised decisions. It should be made explicit rather than remaining a retrospective cleanup operation.

### 5. Architecture implications should be separated from empirical characterization

Spike outputs should not jump straight from evidence to architecture revision.

Recommended output classes for 004 and future comparative spikes:
- `retain current provisional default`
- `offer as optional experimental view`
- `candidate for follow-up under different conditions`
- `revise provisional default`
- `evidence insufficient`

This keeps architecture choices downstream of characterization rather than collapsing the two.

### 6. Human review should be calibration, not institutionalized authority

A small human review layer can be operationalized as:
- blind packet review
- only for architecture-relevant or anomalous cells
- one human reviewer acceptable for now
- explicitly recorded as calibration, not gold truth

This preserves the absent-researcher issue as a live constraint without pretending it is fully solved.

## Implications for Spike 004

If this deliberation's leaning is adopted, Spike 004 should be reformulated from:

> Do embedding models beyond MiniLM capture signal MiniLM misses, and should the architecture change?

to something closer to:

> What comparative behavioral, qualitative, and operational profiles do MiniLM, SPECTER2, Voyage-4, Stella v5, Qwen3-Embedding, and GTE-large exhibit under deployment-relevant recommendation conditions for this project, and which claims about use are warranted under which conditions?

That would imply:

1. **Replace single-spike verdict orientation with claim-card outputs**
2. **Make the condition matrix explicit**
3. **Bring TF-IDF into the architecture-facing decision frame when needed**
4. **Define protocol details tightly enough for repeatability**
5. **Separate characterization from architecture recommendation**

## Concrete Operational Proposal

### A. Minimal claim card template

```yaml
claim_id: clm-004-001
phenomenon: "broad-profile expansion behavior"
strategy_or_model: "voyage-4"
condition:
  seed_count: 5
  breadth: broad
  lexical_regime: vocabulary-mismatch
  candidate_pool: sample
claim_text: >
  Voyage-4 surfaces broader exploratory neighbors than MiniLM under broad,
  heterogeneous seeds, with higher operational cost and lower reproducibility.
evidence:
  quantitative:
    - kendalls_tau: ...
    - jaccard_k20: ...
    - category_recall: ...
  qualitative:
    - review_packet: ...
measurement_confidence: medium
interpretation_confidence: medium
extrapolation_confidence: low
rival_interpretations:
  - "sample artifact"
  - "prompt/protocol artifact"
failure_modes:
  - "full-corpus spot check collapses divergence"
  - "blind review finds unique papers low-value"
decision_relevance: "supports optional exploration view, not default replacement"
status: holds
```

### B. Minimal condition matrix for 004

004 does not need the whole matrix. It needs a declared subset.

Suggested cells:

| Cell | Purpose |
|------|---------|
| `3 seeds / medium breadth / core CS-ML / sample` | baseline comparison |
| `1 seed / narrow / core CS-ML / sample` | cold-start behavior |
| `5 seeds / broad / core CS-ML / sample` | broad-interest behavior |
| `5 seeds / vocabulary mismatch / sample` | where lexical complement matters most |
| `5 seeds / broad / full-corpus spot check` | sample-to-full-corpus robustness |
| `5 seeds / adjacent/interdisciplinary / sample` | probe domain-bound redundancy claims |

### C. Revised Spike 004 outline

1. **Question**
   - comparative characterization, not winner-picking

2. **Observable phenomena**
   - overlap/divergence
   - rank behavior
   - set-level landscape coverage
   - false-positive character
   - operational cost and reproducibility

3. **Condition matrix**
   - explicit cells chosen and why

4. **Protocol**
   - exact embedding recipe
   - ranking and aggregation method
   - version/provenance capture
   - stability checks

5. **Layer 1 screening**
   - all models x selected cells

6. **Layer 2 deep characterization**
   - only interesting/anomalous cells
   - AI qualitative review plus optional human calibration

7. **Outputs**
   - claim cards
   - model characterization cards
   - condition summary table
   - architecture implications using constrained result vocabulary

## Open questions blocking conclusion

1. What is the right storage location and format for claim cards if this becomes a standing program artifact rather than a one-off appendix?
2. How much human calibration is enough before the process becomes over-institutionalized?
3. Should 004 be revised in place, or should a follow-up design artifact be created that supersedes the current 004 framing?
4. Does Open Question 12 need to be split into:
   - benchmark asset
   - comparative characterization asset
5. Should future spikes explicitly declare whether they are:
   - measurement spikes
   - characterization spikes
   - decision spikes

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Future strategy findings will become narrower, more condition-local, and easier to revise without whole-spike confusion | After 2+ future comparative spikes | New spikes still collapse into broad architecture verdicts with heavy qualification sections |
| P2 | Later evaluation work will supersede earlier claims more cleanly because claims, not only spike summaries, are referenceable | After first use of claim cards across 004+ | Supersession still has to happen via ad-hoc review memos and document caveats |
| P3 | Repeatability will improve because protocol variance is captured at the claim/condition level, not only as global caveat text | After first rerun or replication pass | Reruns still expose undocumented protocol ambiguity |
| P4 | This approach will reduce premature-closure pressure without reducing decision usefulness | After 004 synthesis and next architecture-facing deliberation | Outputs become either indecisive mush or still overclaim in the same way as 003 |

## Appended Note: Meta-Reflection on Workflow Fit

**Appended:** 2026-03-21
**Context:** User asked whether anything from the conversation could not be adequately expressed through the deliberation artifact and workflow.

This deliberation captures the substantive methodological proposal reasonably well, but it does not fully capture the **process by which that proposal became thinkable**. Several things were partially flattened in the transition from dialogue to artifact:

1. **Conversational turning points.**
   The artifact records the refined position, but not the moments where a user objection or reframing changed the trajectory of inquiry. Those interventions were not merely "inputs"; they were methodologically productive events.

2. **Rejected framings.**
   The final document preserves the current framing better than the paths we explicitly moved away from:
   - benchmark vs non-benchmark as a false binary
   - additive spike accumulation as a default model of learning
   - "better model" as the primary evaluative object rather than comparative characterization

3. **Dialogue as the site of critique.**
   The workflow still treats the written artifact as the primary durable object and the conversation as source material. In this inquiry, the conversation itself was a critical mechanism. The questions, interruptions, and philosophical corrections were constitutive of the result, not just precursors to it.

4. **Residue and unresolved excess.**
   The artifact marks some questions as open, but it still makes them appear cleaner and more stable than they felt in conversation. Some tensions are being intentionally preserved, not merely left unresolved pending more evidence.

5. **Nonlinear evolution of confidence.**
   The inquiry changed not only the content of conclusions but also the kinds of claims that seemed legitimate to make. The movement from "benchmark rigor" toward "comparative characterization rigor" was not just additive refinement; it was a re-description of the epistemic task itself.

6. **Meta-methodological yield.**
   We were not only discussing retrieval/model evaluation. We were simultaneously testing whether GSDR's reflective forms can hold this mode of inquiry. That second-order experiment is only partly visible in the current deliberation template.

### Implications for GSDR adaptation

If this workflow is to better support this style of reflection, the current deliberation form may benefit from lightweight additions such as:

- **Conversational Turning Points**
  - what intervention changed the inquiry
  - what assumption it disrupted
  - what path it opened

- **Rejected Framings**
  - framing considered
  - why it failed
  - what replaced it

- **What This Artifact Cannot Hold**
  - a short explicit residue section for tensions that resist clean formalization

- **Claim Genealogy**
  - introduced
  - narrowed
  - revised
  - superseded
  - still open

- **Dialogue Contributions**
  - how the user, prior signals, prior artifacts, and the model each contributed to the inquiry's development

- **Meta-Methodological Yield**
  - what this deliberation taught us about the workflow or form itself

### Current assessment

The present deliberation artifact is useful and worth keeping. But if the project is experimenting with reflective practice in order to adapt GSDR to its workflows, then one important lesson from this session is:

> The workflow can preserve conclusions and rationale better than it can preserve the dialogical process that generated them.

That gap does not invalidate the deliberation. It identifies a likely next frontier for improving the reflective workflow.

## Decision Record

**Decision:** Pending — deliberation open
**Decided:** —
**Implemented via:** not yet implemented
**Signals addressed:** sig-2026-03-20-jaccard-screening-methodology, sig-2026-03-20-spike-experimental-design-rigor, sig-2026-03-20-premature-spike-decisions

## Evaluation

<!--
Filled when status moves to `evaluated`.
-->

## Supersession

<!--
Filled when status moves to `superseded`.
-->
