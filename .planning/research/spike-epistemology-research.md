# Spike Epistemology Research: Philosophy of Science for Experimental Workflow Design

**Date:** 2026-04-08
**Mode:** Custom Research (Philosophy of Science Application)
**Overall Confidence:** MEDIUM-HIGH
**Evidence base:** Lakatos (SEP, Rubin 2024, secondary sources), Mayo (NDPR review, error statistics papers), Duhem-Quine (SEP, Fairfield ch.5), Longino (social epistemology), Feyerabend (Against Method), epistemic-agency repo (47 findings from 154 papers), spike methodology gap analysis (11 gaps, 5 patterns), arxiv-sanity-mcp methodology docs (6 lenses, 26 principles), positive synthesis (35 patterns, 8 clusters)

---

## 1. The Central Tension

The spike workflow must navigate between two failure modes:

**Under-structured:** The current state. Spikes execute with minimal methodological enforcement, producing Pattern A (self-awareness without enforcement), Pattern 1 (premature closure), and Pattern 2 (metric reification). The DESIGN.md prescribes but does not enforce. The framework contains advisory wisdom that agents routinely bypass.

**Over-structured:** The institutional failure mode that philosophy of science warns about. Peer review becomes gatekeeping. Replication requirements become busywork. Methodology standards become conformity pressures that suppress productive deviation. This is the failure mode that Feyerabend diagnoses, that Lakatos's methodology was designed to avoid, and that the user explicitly flagged as a risk.

The question is not "how much structure?" but "what kind of structure?" The three philosophers engaged here -- Lakatos, Mayo, Duhem-Quine -- each diagnose a different failure mode of experimental practice and offer a different structural response. Together they produce a framework that is more sophisticated than any one of them alone.

---

## 2. Lakatos: Research Programmes and Spike Campaigns

### 2.1 The Core Insight

Lakatos's central contribution is shifting the unit of assessment from the individual experiment to the research programme -- the sequence of theories connected by a shared hard core. A single anomalous result does not refute a programme. What matters is whether the programme is **progressive** (each modification predicts novel facts that some are corroborated) or **degenerating** (each modification merely accommodates known anomalies without predicting anything new).

This maps directly onto the spike campaign concept identified in Gap 2.7. The arxiv-sanity-mcp experience (Spikes 001-004) was a research programme in miniature: a shared hard core (embedding-based paper recommendation works), a protective belt of auxiliary hypotheses (MiniLM is sufficient, SPECTER2 adds citation structure, Jaccard measures quality), and a trajectory that was sometimes progressive (Spike 003's qualitative review discoveries) and sometimes degenerating (iterating on Jaccard-based comparisons that told the same story from different angles).

### 2.2 What a Lakatosian Spike Programme Looks Like

**Hard core declaration.** Before a spike programme begins, the programme must declare its hard core: the assumptions it will not test within this programme, but will protect by modifying auxiliary hypotheses. This is not a weakness -- it is honest about what is being investigated and what is being held constant. The hard core is revisable, but revising it starts a new programme, not a new spike.

Example from arxiv-sanity-mcp: "Embedding similarity is a viable mechanism for finding papers a researcher would value" was the hard core. Everything else -- which embeddings, what metrics, what evaluation method -- was protective belt.

**Protective belt tracking.** Each spike's DESIGN.md should identify which auxiliary hypotheses it tests and which it assumes. When a spike finds an anomaly, the question becomes: do we modify the protective belt (adjust the auxiliary hypothesis), or does this anomaly suggest the hard core needs revision? The METHODOLOGY.md Lens 6 (Duhem-Quine analysis) already asks this question but lacks the vocabulary to answer it.

**Progressiveness assessment.** After each spike, ask: did this spike predict novel facts (things we did not know before designing the experiment) that were at least partially corroborated? If yes, the programme is progressive. If the spike only accommodated anomalies from the previous spike without generating new predictions, it is degenerating.

This directly addresses **Pattern 5 (forward dependency without backward propagation)** and **Gap 2.5 (no cross-spike dependency propagation)**. In a Lakatosian frame, backward propagation is not just a bookkeeping task -- it is the mechanism by which the programme's trajectory becomes visible. Without it, you cannot assess whether you are in a progressive or degenerating phase.

### 2.3 Concrete Design Recommendation

**Add a `programme` layer to spike infrastructure.** A spike programme has:

1. **Programme declaration:** Hard core assumptions, research question scope, shared data assets
2. **Spike sequence tracking:** Ordered list of spikes with their modifications to the protective belt
3. **Progressiveness ledger:** After each spike, a one-paragraph assessment: "This spike was progressive/degenerating because [novel predictions made and their fate / anomalies merely accommodated]"
4. **Backward propagation:** When Spike N qualifies Spike M, the qualification is recorded in the programme ledger, not just in Spike N's artifacts

The programme is not a rigid plan. Its positive heuristic ("partially articulated set of suggestions or hints on how to change, develop the refutable variants") means the programme evolves as it learns. This is why SPIKE-DESIGN-PRINCIPLES.md Principle 21 ("The DESIGN.md is a plan, not a contract") is correct and should be understood as a feature, not a gap.

**What should be structural vs cultural:**
- **Structural:** Programme declaration exists before multi-spike investigation begins. Progressiveness ledger is a mandatory section in any DECISION.md that belongs to a programme. Backward propagation notes are prompted (not required) when spike findings touch prior spikes.
- **Cultural:** The assessment of progressive vs degenerating is a judgment call, not a metric. The hard core is revisable by declaration, not by committee vote.

### 2.4 What Lakatos Warns Against

Lakatos himself warns against two things the framework should internalize:

1. **Premature abandonment.** Popper's naive falsificationism says: anomaly detected, theory rejected. Lakatos says: a programme can rationally persist through anomalies if it is still generating novel predictions. The current spike workflow's "max 2 rounds" rule enforces premature abandonment in the Popperian mode. Within a programme, individual spikes can have 2-round limits, but the programme itself must be allowed to persist through anomalous spikes.

2. **The illusion of instant rational appraisal.** You cannot tell whether a programme is progressive or degenerating at the moment of the anomaly. Sometimes it takes years. Lakatos was explicit: "one may rationally stick to a degenerating programme until it is overtaken by a rival and even after." This means the progressiveness ledger is retrospective -- you update it as you learn more, and early assessments are provisional.

This connects directly to the DECISION.md template revision (Gap 2.4): the decided/provisional/deferred distinction maps onto the Lakatosian insight that decisions happen at programme-level temporal scales, not individual-spike scales. A single spike declaring "DECIDED: drop SPECTER2" is a Popperian move within what should be a Lakatosian process.

---

## 3. Duhem-Quine: Holism and Auxiliary Hypothesis Management

### 3.1 The Core Insight

The Duhem-Quine thesis states that no hypothesis is tested in isolation. Every empirical test involves the target hypothesis *plus* a web of auxiliary assumptions (background knowledge, measurement instruments, sample construction, evaluation framework). When an experiment produces a negative result, the failure could lie in the target hypothesis *or* in any auxiliary. You never test h; you test h-and-b, where b is the background.

The arxiv-sanity-mcp spike experience provides textbook illustrations. When Spike 002 found Jaccard < 0.5 between backends and declared H1 "FALSIFIED," what was actually tested was: [H1: backends return similar results] AND [A1: Jaccard measures similarity adequately] AND [A2: the sample is representative] AND [A3: the query set captures typical usage]. The failure could lie in any of these. Spike 003's discovery that Jaccard has fundamental limitations as a quality measure (it detects overlap, not quality) retroactively showed that the "falsification" was actually a failure of A1, not H1.

### 3.2 Operationalizing Duhem-Quine

The METHODOLOGY.md already contains Lens 6 (Duhem-Quine analysis) with the instruction: "For each finding, identify which auxiliary assumptions are load-bearing. Design experiments that vary one auxiliary at a time to disentangle." This is correct but insufficient. The current workflow has no structural support for tracking auxiliaries or enforcing their identification.

**Auxiliary hypothesis register.** Each spike DESIGN.md should contain a section listing the auxiliary assumptions the experiment depends on. For each auxiliary, state:

| Auxiliary | Status | Risk if wrong |
|-----------|--------|---------------|
| Jaccard measures quality | Assumed, not tested | High -- all comparative conclusions depend on it |
| 100-paper sample represents 19K corpus | Assumed, not tested | High -- selectivity is 20%, needs to be ~0.1% |
| MiniLM neighborhoods define relevance | Assumed (evaluation framework) | Critical -- circular if MiniLM is also being evaluated |

This is not bureaucratic overhead -- it is the information that Pattern 2 (metric reification) and Pattern 3 (evaluation framework entanglement) demonstrate is missing. The Jaccard story shows what happens when auxiliaries are invisible: the experiment appears to answer the question when it actually answers a different question conditioned on unexamined assumptions.

**Auxiliary variation as experimental design.** When a finding depends on a specific auxiliary, the finding's confidence should be reported as conditional: "Conditional on [auxiliary], we found [result]." The spike designer should then ask: "Can we vary this auxiliary?" If yes, designing a variation experiment is not optional completionism -- it is the minimum necessary to distinguish a finding about the target hypothesis from a finding about the auxiliary.

This connects to Gap 2.6 (no structured limitations section) and the three-level confidence framework: the distinction between measurement confidence and interpretation confidence is precisely the Duhem-Quine distinction between "the numbers are accurate" (target hypothesis under fixed auxiliaries) and "the numbers mean what we say" (target hypothesis holding across auxiliary variations).

### 3.3 Concrete Design Recommendation

**Add an auxiliary hypothesis register to DESIGN.md template.** Required for any spike that makes causal or comparative claims. Each auxiliary has:
- What it assumes
- Whether it will be tested in this spike (and if not, why not)
- What would change about the findings if this auxiliary is wrong

**Connect the register to the findings reviewer agent.** The findings reviewer should check: for each major claim in DECISION.md, which auxiliaries does it depend on? Were any of those auxiliaries varied? If not, the claim should be reported as conditional, not unconditional.

**What should be structural vs cultural:**
- **Structural:** The auxiliary register exists as a section in DESIGN.md. The findings reviewer checks claims against the register.
- **Cultural:** Identifying the right auxiliaries is a judgment call. Some auxiliaries are invisible until a later spike reveals them (the MiniLM entanglement was not obvious in Spike 001). The register is acknowledged as incomplete.

### 3.4 What Duhem-Quine Warns Against

The strong reading of Duhem-Quine leads to underdetermination: if every test involves auxiliaries, no experiment can ever definitively confirm or refute any single hypothesis. This is theoretically correct but practically paralyzing. The operational response is not to deny holism but to manage it:

1. **Not all auxiliaries are equally suspect.** Some are well-established (Python's datetime library works). Others are novel and untested (Jaccard measures quality for this use case). The register should distinguish load-bearing auxiliaries from background assumptions.

2. **Convergence across varied auxiliaries is the escape.** Mayo calls this "lift-off." When multiple experiments with different auxiliaries converge on the same conclusion, the conclusion is robust in a way no single experiment can achieve. This is why SPIKE-DESIGN-PRINCIPLES.md Principle 20 ("Vary auxiliary assumptions to test finding robustness") is the single most important methodological principle in the document.

3. **Holism does not mean skepticism.** "We cannot test h in isolation" does not mean "we cannot learn about h." It means we learn about h gradually, through a programme of experiments that systematically vary auxiliaries. This is another reason why the programme concept (Section 2) is essential: individual spikes cannot resolve Duhem-Quine problems, but spike programmes can.

---

## 4. Mayo: Severe Testing and the Severity Requirement

### 4.1 The Core Insight

Mayo's severity principle: **a claim is warranted only to the extent that it has been subjected to and passed a test that probably would have found flaws, were they present.** The key word is "probably would have found flaws." A test that could not have detected the error, even if the claim were wrong, provides no evidence -- no matter how impressive the data look.

This is not naive falsification. Naive falsification asks: "Did the prediction come true?" Mayo asks: "Was the test capable of detecting the error?" A test where the data would look the same regardless of whether the hypothesis is true or false has zero severity, even if the prediction is confirmed.

### 4.2 Severity vs Naive Falsification in Spike Design

The current spike workflow's falsification approach (Gap Analysis Section 6.2) correctly notes that pre-registering falsification criteria is valuable. But the gap analysis also identifies that "the problem was not absence of falsification criteria but absence of mechanisms to prevent overclaiming when the criterion was met." Spike 002's "H1 FALSIFIED" based on Jaccard < 0.5 is a case where the falsification criterion was met but the test was not severe.

Why wasn't it severe? Because the test could not distinguish between "backends return different results" and "Jaccard is a poor measure of similarity for this domain." The probability that the test would have produced Jaccard > 0.5 even if the backends genuinely returned different results was unknown. The severity of the test was never assessed.

Mayo's framework demands that for each claim, we ask: **what is the probability that this test would have produced a result this favorable to the claim, if the claim were false?** If that probability is high, the test has low severity and the claim is not warranted despite passing the test.

### 4.3 Operationalizing Severe Testing

**Severity assessment in DECISION.md.** For each major finding, the findings reviewer (or the spike author) should assess:

1. **What was the test?** (The specific experiment and its outcome)
2. **What would count as the test detecting the error?** (What outcome would have made us reject the claim?)
3. **How likely was that error-detecting outcome, if the claim were false?** (The severity)
4. **What errors could the test NOT have detected?** (The test's blind spots)

This is more demanding than binary falsification but less demanding than full Bayesian analysis. It does not require computing actual probabilities -- it requires honest assessment of whether the test could have caught the error. Many of the spike gap analysis patterns reduce to failures of severity:

- **Pattern 2 (metric reification):** Jaccard as sole criterion. Severity assessment: "Could this test have produced a different result if Jaccard were a poor measure?" Answer: No, because there was no independent quality measure. Therefore: LOW severity for any claim about quality based solely on Jaccard.

- **Pattern 3 (evaluation framework entanglement):** MiniLM evaluating MiniLM. Severity assessment: "Could this test have detected that MiniLM was being favored by the evaluation framework?" Answer: No, because the evaluation framework was built on MiniLM. Therefore: LOW severity for any claim about MiniLM's superiority.

- **Pattern 4 (self-awareness without enforcement):** Qualitative checkpoints prescribed but skipped. Severity assessment: "Could we have detected interpretive errors without the qualitative review?" Answer: No, because quantitative metrics alone have known blind spots (the whole point of the checkpoints). Therefore: findings from waves where prescribed checkpoints were skipped have LOW severity.

### 4.4 Concrete Design Recommendation

**Add severity assessment as a dimension of the three-level confidence framework.** Currently proposed:
- Measurement confidence: Did we accurately measure what the instrument detects?
- Interpretation confidence: Does the measurement mean what we say?
- Extrapolation confidence: Does it hold beyond testing conditions?

Add a **severity** dimension that cross-cuts all three: **Was this test capable of detecting the error at this level?** A measurement can have HIGH measurement confidence but LOW severity if the measurement instrument was not capable of distinguishing the hypothesis from a plausible alternative.

**Connect severity to the design reviewer agent.** The design reviewer should assess each experiment in DESIGN.md for severity *before execution*: "If the hypothesis is wrong, would this experiment detect it? How?" This is the pre-execution equivalent of Mayo's severity requirement. It catches Pattern 3 (circular evaluation) and Pattern 4 (decorative methodology) at design time rather than post-hoc.

**What should be structural vs cultural:**
- **Structural:** The design reviewer includes severity as a review dimension. The findings reviewer checks whether severity was maintained during execution (prescribed checkpoints actually performed, independent metrics actually measured).
- **Cultural:** Severity assessment is qualitative, not quantitative. "Could this test have caught the error?" admits of degree, not binary answers. The reviewer exercises judgment, not a checklist.

### 4.5 What Mayo Warns Against

Mayo explicitly warns against two things relevant to this design:

1. **Confusing "passed a test" with "severely tested."** A spike that confirms its predictions has not necessarily been severely tested. The test must have been capable of detecting the error. This is why SPIKE-DESIGN-PRINCIPLES.md Principle 13 (report probability shifts, not binary verdicts) is necessary but not sufficient -- you also need to assess the severity of the test that produced the shift.

2. **Using severity as post-hoc rationalization.** The severity assessment should be prospective (designed before the experiment) not retrospective (argued after the result is known). Post-hoc severity claims are susceptible to the same biases that make p-hacking problematic. The design reviewer catches this by assessing severity at design time.

---

## 5. Institutional Critique: What Philosophy of Science Says About Research Procedures

### 5.1 The Problem Space

The proposed spike improvements include structural review gates: a design reviewer agent, a findings reviewer agent, protocol adherence checkpoints, cross-spike qualification mechanisms. These are the agential equivalents of institutional research procedures: peer review, replication, literature review. Philosophy of science has extensive critiques of these institutions that the spike workflow should learn from rather than reproduce.

### 5.2 Longino: Objectivity Requires Genuine Diversity, Not Formal Review

Helen Longino argues that scientific objectivity is not an individual achievement but a social one. Objectivity requires **transformative criticism** -- criticism that can actually change the work, not just approve or reject it. She identifies four conditions for transformative criticism to function:

1. **Public forums for criticism** -- the criticism must be accessible, not private
2. **Uptake to criticism** -- the recipient must be structurally responsive to the criticism
3. **Publicly recognized standards** -- the criteria for assessment must be shared and explicit
4. **Equality of intellectual authority** -- all participants must have standing to critique

**Application to spike review agents:** A design reviewer agent that applies a fixed checklist satisfies conditions 1 and 3 but fails conditions 2 and 4. Uptake requires that the spike designer can respond to criticism and that the response changes the design -- not just acknowledges the critique. Equality of authority means the reviewer's findings are not automatically overruled by the designer's preferences.

But Longino's deeper insight is that diversity of perspective, not rigor of procedure, is what makes criticism transformative. Two agents running the same model produce "criticism" that shares all the same blind spots. Cross-model review (positive pattern P01-P08, the strongest pattern in the audit) is more Longino-compatible than same-model review because different models genuinely differ in what they detect -- GPT-5.4 catches code paths Claude misses, Claude catches assumption structures GPT misses. The diversity is architectural, not just procedural.

**Design implication:** The spike design reviewer should NOT be the same model that designed the spike. Cross-model review is not a luxury for important spikes -- it is the structural basis for objectivity in Longino's framework. A same-model reviewer creates the appearance of review without the epistemic benefit.

This connects directly to epistemic-agency finding **F02 (self-evaluation degenerates under shared noise)** and **I09 (variety amplification: human provides independent noise distribution AI cannot generate for itself)**. The Longino framework and the empirical agentic AI literature converge: genuine independence in review is architecturally necessary, not a nice-to-have.

### 5.3 Feyerabend: Methodology Must Not Suppress Productive Deviation

Feyerabend's critique of methodology has been caricatured as "anything goes," but his actual argument is more precise: **the imposition of universal methodological rules suppresses the very deviations that produce scientific breakthroughs.** Historical cases -- Galileo's defense of heliocentrism against then-accepted data, Boltzmann's atomism persisting through a degenerating period -- show that "breaking the rules" was sometimes productive.

**Application to spike workflow:** Every structural enforcement mechanism risks suppressing productive deviation. The max-2-rounds rule prevents rabbit holes but also prevents Spike 003's qualitative review discoveries, which only emerged in Wave 3. Protocol adherence checkpoints catch Pattern 4 (prescribed checkpoints skipped) but could also punish contextual adaptation to unexpected findings.

The operational response is not to abandon structure but to distinguish between:

1. **Enforcement that protects the epistemic base** (severity requirements, auxiliary tracking, cross-model review) -- these should be structural because their absence produces systematic errors that the agent cannot self-correct (F02, I05).

2. **Guidance that shapes good practice** (qualitative review encouragement, Bayesian updating, reference design survey) -- these should be cultural because they require contextual judgment and their rigid application produces compliance without insight.

3. **Constraints that prevent known failure modes** (Jaccard as sole criterion, circular evaluation, premature closure) -- these should be anti-pattern warnings with structural detection (the design reviewer flags them) but not structural prohibition (the designer can override with justification).

This three-tier distinction (enforce / encourage / warn) maps Feyerabend's insight onto practical workflow design: the methodology has structure, but the structure is not uniform, and the non-structural parts are explicitly designed to allow productive deviation.

**The deviation testimony pattern already in the codebase** (feedback_deviation_testimony.md: "artifacts outside formal workflows must explain WHY they deviate and what workflow was inadequate") is exactly the right response to Feyerabend. Deviation is allowed but must leave a trace. The trace feeds back into methodology improvement. This is already a Feyerabendian practice -- it should be recognized as such and extended to spike execution, where deviations from DESIGN.md protocol should be documented rather than hidden or punished.

### 5.4 Institutional Research Critique: Peer Review and Its Failures

Philosophy of science identifies several failure modes of institutional peer review that map directly onto the proposed spike review gates:

**Gatekeeping vs. quality improvement.** Pre-publication peer review increasingly functions as a gatekeeping mechanism (deciding whether work is published) rather than a quality-improvement mechanism (helping work become better). The spike design reviewer should be designed for quality improvement: its output is critique that improves the design, not a pass/fail gate. The designer can proceed against the reviewer's recommendations -- with documented justification (the Feyerabendian escape valve).

**Reviewer monoculture.** When all reviewers share the same training, they share the same blind spots. The most common critique missed by peer review is the one that requires expertise the reviewers lack. For spike design review, this means the reviewer's prompt should include the METHODOLOGY.md lenses (which represent different epistemic perspectives), not just a methodology checklist.

**Speed vs. rigor tradeoff.** Institutional peer review is slow because it requires finding qualified reviewers, managing the review process, and handling revisions. The spike design reviewer should be fast (agent execution) but genuinely independent (cross-model). This is where the agential equivalent has an advantage over the institutional one: cross-model review is faster than human peer review while providing genuine perspective diversity.

**Suppression of dissent.** Institutional peer review can suppress dissenting views, especially when reviewers have stakes in the dominant paradigm. The spike findings reviewer should not have access to the original DESIGN.md predictions when assessing findings -- it should assess the evidence on its own terms, then compare with the designer's claims. This prevents the reviewer from confirming the designer's narrative.

### 5.5 Concrete Design Recommendation from Institutional Critique

**Design the review agents for quality improvement, not gatekeeping.** Specifically:

1. The design reviewer produces a **critique document**, not a pass/fail verdict. The critique identifies: severity gaps, auxiliary assumptions untested, evaluation framework entanglements, missing perspectives, progressiveness assessment.

2. The spike designer **responds** to the critique. The response can be: accept (modify design), acknowledge (note limitation, proceed anyway with justification), or dispute (argue the critique is wrong). All three are legitimate.

3. The response is **recorded** alongside the critique. Future spikes in the programme can read both the critique and the response, creating an audit trail that enables retrospective assessment of whether critiques were warranted.

4. The findings reviewer assesses evidence **independently** before comparing with the designer's claims. Its assessment includes: severity of each test, auxiliary conditions, whether prescribed methodology was followed, and what the evidence actually supports (which may differ from what the designer claims).

**What should be structural vs cultural:**
- **Structural:** Review happens (the design reviewer is invoked). Cross-model review (different model from the designer). Critique and response are recorded as artifacts.
- **Cultural:** The response to critique is the designer's judgment call. Proceeding against critique is legitimate with justification. The findings reviewer's assessment is advisory, not a veto.

---

## 6. Synthesis: The Epistemological Framework for Spike Programmes

### 6.1 How the Three Philosophers Interact

| Philosopher | Unit of Assessment | Failure Mode Diagnosed | Structural Response |
|---|---|---|---|
| Lakatos | Research programme (spike sequence) | Premature abandonment (Popperian) and invisible degeneration | Programme declaration, progressiveness ledger, backward propagation |
| Duhem-Quine | Individual experiment + its auxiliary web | Mistaking auxiliary failure for hypothesis failure | Auxiliary register, conditional claims, convergence through variation |
| Mayo | Individual test + its error-detection capacity | Tests that cannot detect the error they purport to test | Severity assessment, pre-execution severity design, independent metrics |
| Longino | Community of inquiry | Criticism that shares the same blind spots as the work | Cross-model review, diversity of perspective, uptake requirement |
| Feyerabend | Methodology itself | Structure that suppresses productive deviation | Three-tier enforcement (enforce/encourage/warn), deviation testimony |

These are not competing frameworks -- they operate at different scales and address different failure modes. A well-designed spike workflow needs all of them:

- **Lakatos** at the programme level (are we making progress or spinning?)
- **Duhem-Quine** at the design level (what are we actually testing?)
- **Mayo** at the execution level (could this test have caught the error?)
- **Longino** at the review level (is the criticism genuinely independent?)
- **Feyerabend** at the meta level (is the methodology itself suppressing insight?)

### 6.2 Mapping to Gap Analysis Patterns

| Failure Pattern | Primary Philosopher | Design Response |
|---|---|---|
| Pattern 1: Premature closure | Lakatos (decisions happen at programme scale, not spike scale) | decided/provisional/deferred + programme-level assessment |
| Pattern 2: Metric reification | Mayo (test severity) + Duhem-Quine (metric as auxiliary) | Severity assessment + auxiliary register for metrics |
| Pattern 3: Evaluation framework entanglement | Duhem-Quine (evaluation framework as load-bearing auxiliary) + Mayo (circular test has zero severity) | Auxiliary register flags evaluation dependencies; design reviewer checks severity |
| Pattern 4: Self-awareness without enforcement | Mayo (severity at design time) + Longino (external review) | Design reviewer checks prescribed methodology before execution; cross-model for genuine independence |
| Pattern 5: Forward dependency without backward propagation | Lakatos (programme trajectory requires backward updating) | Programme ledger with backward propagation notes |

### 6.3 The Three-Tier Enforcement Model

Drawing from the institutional critique and Feyerabend's warning:

**Tier 1: Structural (enforced by workflow)**
- Design reviewer is invoked before execution (catches Pattern 3, Pattern 4 prospectively)
- Cross-model review for design and findings (Longino's diversity requirement, F02/I09)
- Auxiliary register exists in DESIGN.md (Duhem-Quine tracking)
- Programme declaration exists before multi-spike investigation
- Critique and response are recorded as artifacts

**Tier 2: Cultural (encouraged by prompts and templates)**
- Severity assessment for each major finding (Mayo)
- Progressiveness assessment after each spike in a programme (Lakatos)
- Bayesian updating instead of binary verdicts (METHODOLOGY.md Lens 1)
- Qualitative review of quantitative findings (SPIKE-DESIGN-PRINCIPLES.md 9-11)
- Reference design survey before architectural spikes

**Tier 3: Anti-pattern detection (warned, overridable with justification)**
- Single metric as sole decision criterion (Pattern 2)
- Evaluation framework entangled with approach being evaluated (Pattern 3)
- Prescribed checkpoints not performed (Pattern 4)
- Decision framed as CONFIRMED/FALSIFIED without severity assessment
- Proceeding against design reviewer critique without documented response

The anti-pattern tier is crucial. These are not prohibitions -- they are detection triggers. The design reviewer flags them, the spike designer responds, and the response is recorded. Feyerabend's insight is preserved: deviation is possible, documented, and feeds back into methodology improvement.

### 6.4 Connection to Epistemic-Agency Findings

Several findings from the epistemic-agency repo (47 findings from 154 agentic AI papers) directly support this framework:

- **F02 (self-evaluation degenerates under shared noise):** Validates cross-model review as structural necessity, not luxury. Same-model review shares noise distribution and cannot catch the errors it shares.

- **F34 (specialist sub-agents prevent feedback corruption):** Separating the design reviewer from the designer, and the findings reviewer from the executor, prevents the sunk-cost and narrative-investment biases that produce Pattern 4.

- **F36 (evaluation infrastructure needs its own testing):** The evaluation framework is itself an auxiliary hypothesis (Duhem-Quine). When the evaluation framework is untested, all findings that depend on it have conditional confidence at best.

- **F46 (MAPE blind spot: detect plan-conformance deviations, miss planning failures):** The current spike workflow detects execution deviations (checkpoint triggers) but not design failures. The design reviewer addresses this -- it catches planning failures before execution, not just execution deviations from the plan.

- **F47 (automation proletarianization gradient):** Severity assessment and progressiveness assessment are judgment-rich activities that should not be fully automated. They belong in Tier 2 (culturally encouraged) not Tier 1 (structurally enforced). The design and findings reviewers are structural, but their output is advisory -- the judgment remains with the designer/executor.

- **I08 (tertiary retention and path dependency):** The programme declaration and auxiliary register are themselves forms of tertiary retention (Stiegler). They shape what future spikes in the programme can think about by making certain assumptions visible and others invisible. This is constitutive, not neutral. The meta-level Feyerabendian escape valve (the methodology itself is subject to critique) is the response: the programme's own assumptions should be periodically revisited, not treated as permanent.

- **I09 (variety amplification is architecturally necessary):** Human epistemic challenges (positive pattern P09-P15) provide the independent noise distribution that same-model agents cannot generate. The user's role as epistemic guardian is not replaceable by adding more agents of the same type. Cross-model review helps but does not fully substitute for human challenge at key decision points.

---

## 7. Recommendations for Roadmap

### 7.1 Priority Ordering

1. **Design reviewer agent with severity dimension** (addresses Patterns 3, 4; operationalizes Mayo and Longino). This is the highest-leverage intervention because it catches methodological problems before execution, when they are cheapest to fix.

2. **Auxiliary hypothesis register in DESIGN.md** (addresses Pattern 2, 3; operationalizes Duhem-Quine). Low implementation cost, high information value. Forces explicit acknowledgment of what is assumed vs what is tested.

3. **Programme infrastructure** (addresses Pattern 5, Gap 2.7; operationalizes Lakatos). Higher implementation cost but enables the multi-spike investigations that the framework currently cannot support. Includes progressiveness ledger and backward propagation.

4. **Findings reviewer agent with independent assessment** (addresses Pattern 1, 4; operationalizes Mayo and Longino). Catches post-execution problems: claims unsupported by evidence, prescribed methodology not followed, severity not maintained.

5. **Three-tier enforcement model** (operationalizes Feyerabend's institutional critique). This is a framing decision for all the above: which elements are enforced, which are encouraged, which are warned. Should be decided early because it shapes the implementation of 1-4.

### 7.2 Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Design reviewer implementation | Becomes a checklist instead of genuine critique | Use cross-model review; include METHODOLOGY.md lenses as reviewer context; reviewer produces critique document, not pass/fail |
| Auxiliary register | Becomes boilerplate nobody reads | Keep it short (3-5 load-bearing auxiliaries, not exhaustive list); findings reviewer checks claims against register |
| Programme infrastructure | Over-engineering for simple spikes | Programme layer is optional; simple single-spike usage is unaffected; programme activates only when declared |
| Findings reviewer | Rubber-stamps the designer's narrative | Reviewer assesses evidence independently before seeing designer's claims; cross-model from designer |
| Severity assessment | Becomes post-hoc rationalization | Severity is assessed at design time by the design reviewer; execution-time assessment checks whether design-time severity was maintained |

### 7.3 What NOT To Build

- **Automated progressiveness scoring.** Whether a spike programme is progressive or degenerating is a judgment that requires understanding the research question, the domain, and the history. Automating it would produce a number without meaning.

- **Mandatory severity thresholds.** "All findings must have severity > X" would produce gaming (designing tests to hit the threshold) rather than genuine error detection. Severity is qualitative.

- **Findings reviewer veto power.** The findings reviewer provides assessment, not judgment. The designer can proceed against the assessment with justification. Veto power reproduces the gatekeeping failure of institutional peer review.

- **Rigid programme structure.** The programme declaration is a lightweight artifact (a few paragraphs), not a heavyweight planning document. Programmes emerge when multiple related spikes are needed, not as upfront architecture.

---

## 8. Beyond Formal Scope

### 8.1 The Pharmacology of Methodology

Stiegler's concept of the pharmakon -- every technology is simultaneously remedy and poison -- applies directly to the spike methodology itself. The design reviewer is a remedy for Pattern 4 (self-awareness without enforcement) and a poison for productive deviation (it adds a gate that might suppress valuable rule-breaking). The auxiliary register is a remedy for invisible assumptions and a poison for fluid exploratory thinking (naming your assumptions can make you over-cautious about them).

The three-tier model (enforce/encourage/warn) is the pharmacological response: calibrate the dosage. Enforcement where the poison of absence is worse than the poison of structure (review independence, because F02 shows self-evaluation fails). Encouragement where the poison of rigidity would kill the cure (severity assessment, because it requires contextual judgment). Warning where the cure might be worse than the disease (anti-pattern detection with override, because Feyerabend shows that sometimes the "wrong" method works).

This connects to I08 (tertiary retention and path dependency): the methodology itself is a form of externalized memory that shapes what future spikes can think about. Every structural enforcement is a commitment that closes some doors while opening others. The meta-level awareness that methodology is constitutive, not neutral, should be part of the framework's self-understanding.

### 8.2 The Absent Researcher Problem

The arxiv-sanity-mcp METHODOLOGY.md Lens 2 (standpoint epistemology) identifies the "absent researcher" -- the human user whose values and research context are not present during automated spike execution. The spike produces findings for a researcher who is not there to say "actually, I care about X more than Y."

This connects to Longino's condition 4 (equality of intellectual authority) in a troubling way: in the agential context, the human has ultimate authority but is intermittently present. The agent acts in the human's absence but cannot fully represent the human's standpoint. The severity assessment, the progressiveness judgment, the decision between progressive and degenerating -- all of these are partially about values (what counts as progress? what counts as a novel prediction?) that the agent can approximate but not fully inhabit.

I09 (variety amplification) suggests the response: the human's intervention at key decision points is architecturally necessary, not merely convenient. The user's epistemic challenges (P09-P15) are the most reliable quality mechanism in the audit data. The spike workflow should not try to automate the human out of the loop but should identify the moments where human judgment is irreplaceable and make those moments structurally salient.

### 8.3 Kuhn's Normal Science and the Risk of Paradigmatic Spike Design

Kuhn's distinction between normal science (puzzle-solving within an accepted paradigm) and revolutionary science (paradigm-challenging) maps onto spike types. Most spikes are "normal science" -- they ask questions within the framework of accepted assumptions (which embedding model is better? which backend is faster?). A few spikes should be "revolutionary" -- they ask whether the assumptions themselves are right (does embedding similarity even measure what we care about?).

The METHODOLOGY.md Lens 3 (paradigm analysis) already flags this, but the spike type taxonomy (binary, comparative, exploratory, open inquiry) does not distinguish between paradigm-internal and paradigm-challenging spikes. A paradigm-challenging spike needs different evaluation criteria: it is not trying to find the best answer within the current frame, it is trying to determine whether the frame itself is adequate.

This is a v1.21+ concern, but it should inform the programme infrastructure design: a programme that consists entirely of paradigm-internal spikes may be productive (progressive in Lakatos's terms) but may also be accumulating anomalies that suggest the hard core needs revision. The progressiveness ledger should track not just "are we making progress?" but "are we making progress on the right question?"

### 8.4 The Replication Crisis as a Resource

The recent literature connecting Lakatos to the replication crisis (Rubin 2024) offers a productive reframing. Under Popper, a failed replication is a crisis -- the theory is falsified. Under Lakatos, a failed replication is information about the protective belt -- which auxiliary conditions differ between the original and the replication? This reframing makes replication failure productive rather than destructive.

For spikes, this means: when a later spike produces results that contradict an earlier spike, the response should not be "the earlier spike was wrong" (Popperian) but "what auxiliary conditions differ between the two spikes?" (Lakatosian). The backward propagation mechanism should record not just "Spike 003 qualifies Spike 001's claim" but "Spike 003 found that Spike 001's claim depended on [auxiliary condition] that does not hold under [different conditions]."

This preserves the earlier spike's contribution while correctly scoping its applicability -- exactly what the cross-spike qualification report in arxiv-sanity-mcp did manually and what the framework should support structurally.

### 8.5 On the Impossibility of a Complete Methodology

Feyerabend's deepest point is not "anything goes" but "no finite set of rules can capture what makes science work." There will always be situations where the correct methodological move is the one no existing rule prescribes. The spike methodology should be understood as a living document that improves through the same iterative process it governs (SPIKE-DESIGN-PRINCIPLES.md Principle 26). The programmes it supports should be understood as provisional structures that serve inquiry until they need revision.

This is not a weakness of the framework. It is a feature. A methodology that could not be revised would be a degenerating research programme in Lakatos's own terms -- accommodating anomalies without predicting novel improvements. The meta-level aspiration is that the spike methodology is itself progressive: each version predicts improvements that some are corroborated by actual spike experience.

---

## Sources

### Primary Philosophical Sources
- [Imre Lakatos (Stanford Encyclopedia of Philosophy)](https://plato.stanford.edu/entries/lakatos/)
- [Mayo: Statistical Inference as Severe Testing (Notre Dame Review)](https://ndpr.nd.edu/reviews/statistical-inference-as-severe-testing-how-to-get-beyond-the-statistics-wars/)
- [Mayo: Error Statistics and Philosophy Blog](https://errorstatistics.com/)
- [Mayo & Spanos: Severe Testing as Basic Concept (British Journal for Philosophy of Science)](https://www.journals.uchicago.edu/doi/10.1093/bjps/axl003)
- [Duhem-Quine Thesis (Wikipedia)](https://en.wikipedia.org/wiki/Duhem%E2%80%93Quine_thesis)
- [Quine-Duhem Thesis and Scientific Method (Fairfield)](http://faculty.fairfield.edu/rdewitt/Psci/Ch05.pdf)
- [Paul Feyerabend (Stanford Encyclopedia of Philosophy)](https://plato.stanford.edu/entries/feyerabend/)
- [Defending Longino's Social Epistemology (WCP)](https://www.bu.edu/wcp/Papers/TKno/TKnoWray.htm)

### Replication Crisis and Lakatos
- [Rubin: The Replication Crisis is Less of a Crisis in Lakatos than in Popper](https://markrubin.substack.com/p/popper-lakatos-and-the-replication-crisis)
- [Rubin (2024): European Journal for Philosophy of Science](https://link.springer.com/article/10.1007/s13194-024-00629-x)
- [Stagnant Lakatosian Research Programmes (arXiv 2024)](https://arxiv.org/html/2404.18307v2)

### Institutional Critique
- [Epistemic Gatekeepers and Epistemic Injustice by Design](https://philarchive.org/archive/KAHEGA-2)
- [Is Peer Review a Good Idea? (British Journal for Philosophy of Science)](https://www.journals.uchicago.edu/doi/full/10.1093/bjps/axz029)
- [Gatekeeping Failures and Degenerative Consensus Dynamics (Synthese 2025)](https://link.springer.com/article/10.1007/s11229-025-05423-7)
- [Longino: Critical Contextual Empiricism for Busy People (Topoi 2025)](https://link.springer.com/article/10.1007/s11245-025-10198-0)
- [Philosophy of Science and the Replicability Crisis (Romero 2019)](https://compass.onlinelibrary.wiley.com/doi/10.1111/phc3.12633)

### Internal Evidence Base
- Spike methodology gap analysis: `.planning/research/spike-methodology-gap-analysis.md`
- arxiv-sanity-mcp METHODOLOGY.md: 6 critical lenses for spike design
- arxiv-sanity-mcp SPIKE-DESIGN-PRINCIPLES.md: 26 practical principles
- Positive synthesis: `.planning/audits/session-log-audit-2026-04-07/reports/positive-opus-synthesis.md`
- Epistemic-agency knowledge base: 47 findings from 154 papers (INDEX.md)
- Epistemic-agency operational lenses: 7 lenses + meta-lens for cross-lens disagreement
