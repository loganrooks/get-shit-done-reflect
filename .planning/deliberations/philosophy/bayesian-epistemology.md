# Philosophical Deliberation: Bayesian Epistemology

**Tradition:** Formal Epistemology / Probability Theory
**Key thinkers:** Thomas Bayes, Pierre-Simon Laplace, Bruno de Finetti, Frank Ramsey, Richard Jeffrey, James Joyce
**Created:** 2026-03-03
**Status:** Active

## Core Ideas

Bayesian epistemology is the view that rational belief is a matter of *degree*, not kind, and that the rational way to revise beliefs in light of evidence is governed by the probability calculus — specifically, Bayes' theorem. It is the dominant framework in formal epistemology for modeling how an agent should manage uncertainty over time.

### Beliefs as Credences

The foundational move is to replace the binary "believe / don't believe" with a continuum: a rational agent assigns a *credence* (degree of belief) between 0 and 1 to every proposition. These credences must satisfy the probability axioms — they must be *coherent* in the technical sense. The Dutch book argument (Ramsey, de Finetti) establishes why: an agent with incoherent credences can be offered a set of bets that guarantee a loss regardless of outcome. Coherence is not optional; it is a requirement of rationality.

This matters for a self-improving system because it immediately reframes the question. The question is not "is this lesson true?" but "how confident should we be in this lesson, given everything we have seen?" A lesson with confidence 0.7 is not "probably true" — it is a claim about the system's epistemic state, about how much evidence supports this lesson relative to alternatives.

### Bayes' Theorem as Update Rule

The heart of the framework is conditionalization. When evidence E arrives, a rational agent updates their credence in hypothesis H according to:

```
P(H|E) = P(E|H) * P(H) / P(E)
```

Where:
- **P(H)** is the *prior* — the credence in H before seeing E
- **P(E|H)** is the *likelihood* — how expected E is, given H is true
- **P(E)** is the *marginal likelihood* — how expected E is overall
- **P(H|E)** is the *posterior* — the updated credence after seeing E

The ratio P(E|H) / P(E|not-H), called the *likelihood ratio*, captures the *diagnosticity* of the evidence. Evidence is confirming when it is more expected under H than under not-H. Evidence is disconfirming when it is less expected under H. Evidence that is equally expected either way — likelihood ratio of 1 — provides zero update. This last point is critical: not all observations are evidence, even relevant-seeming ones.

### The Problem of Priors

Bayesian epistemology has a well-known vulnerability: where do priors come from? Bayes' theorem tells you how to update, but it says nothing about where to start. Two agents with different priors will reach different posteriors even after seeing the same evidence, though they converge over time (the *merging of opinions* theorem, under mild assumptions).

**Subjective Bayesianism** (de Finetti) holds that any coherent prior is rationally permissible. Your prior reflects your epistemic state before the evidence, and there is no uniquely correct starting point. **Objective Bayesianism** (Jaynes, Williamson) argues that priors should reflect maximum entropy — maximum ignorance given known constraints. The practical difference: subjective Bayesians accept that two reasonable agents can disagree; objective Bayesians insist there is a fact of the matter about what credence to assign.

For a self-improving system, the problem of priors manifests concretely: when a new lesson is distilled from three signals, what should its initial confidence be? The system currently assigns categorical confidence (low/medium/high) based on evidence count. This is a prior-setting policy. The question is whether it is a good one.

### The Old Evidence Problem

Glymour (1980) raised a problem that is directly relevant to GSD Reflect: if evidence E is already known when hypothesis H is formulated, then P(E) = 1, which means P(H|E) = P(H). Old evidence provides no Bayesian confirmation. But intuitively, the evidence that motivated the hypothesis should count in its favor.

This is not merely a technical curiosity. In GSD Reflect, a lesson is created *because of* certain signals. Those founding signals are the reason the lesson exists. Yet in a strict Bayesian framework, they provide zero confirmatory update — they are already "priced in" to the prior. Only new signals (or the absence of expected recurrences) constitute genuine evidence for or against the lesson.

The standard resolution is *counterfactual updating*: ask not "how surprised am I by E?" but "would E have been surprising if I hadn't already known it?" This preserves the intuition that founding evidence matters while keeping the update mechanics coherent.

### Jeffrey Conditionalization

Standard conditionalization assumes evidence arrives as certainty: you either observe E or you do not. Richard Jeffrey generalized this to handle uncertain evidence. If your credence in E shifts from P(E) to P'(E) without reaching certainty, Jeffrey conditionalization prescribes:

```
P'(H) = P(H|E) * P'(E) + P(H|not-E) * P'(not-E)
```

This is relevant because much of GSD Reflect's evidence is uncertain. A signal with confidence "low" is not established fact — it is an uncertain observation. A verification-by-absence result (no recurrence after 3 phases) is suggestive but not conclusive. Jeffrey conditionalization says: update proportionally to how much your evidence shifts your credence, not all-or-nothing.

### Bayesian Confirmation Theory

An observation E *confirms* hypothesis H (in the Bayesian sense) when P(H|E) > P(H) — seeing E raises your credence in H. The *degree of confirmation* can be measured several ways (ratio measure, difference measure, log-likelihood ratio). What matters for praxis is the qualitative point: confirmation is relative to the hypothesis AND the background knowledge. The same observation can confirm one hypothesis and disconfirm another.

This gives formal grounding to counter-evidence seeking. The system already seeks counter-evidence during reflection (Section 2.5 of reflection-patterns.md). Bayesian confirmation theory explains why: a hypothesis that has survived attempts at disconfirmation is better supported than one that has merely accumulated agreeing instances. Evidence that *could have* disconfirmed H but did not is more confirming than evidence that was never at risk of doing so. This is the Bayesian reconstruction of the Popperian intuition about severe testing.

### Bayesian vs Frequentist Approaches

The frequentist tradition interprets probability as long-run relative frequency. A signal severity is "critical" not because of anyone's credence but because a specific proportion of signals with those characteristics lead to failures. The Bayesian interprets the same number as a degree of belief.

For GSD Reflect, the distinction matters in one practical way: frequentist reasoning requires large sample sizes to be meaningful, while Bayesian reasoning works with any sample size (at the cost of prior-dependence). With 79 signals and 7 lessons, the system does not have frequentist-scale data. Bayesian reasoning is the more appropriate framework at this scale because it explicitly handles small samples by making the prior's influence visible rather than pretending it does not exist.

## Relevance to GSD Reflect

GSD Reflect is already implicitly Bayesian in several ways:

1. **Confidence is categorical, not binary** — lessons carry low/medium/high confidence, which approximates a credence scale
2. **Evidence accumulates** — signals are gathered, patterns are detected, counter-evidence is sought
3. **Weighted scoring exists** — confidence-weighted pattern detection (high=2.0, medium=1.0, low=0.5) is a form of credence-sensitive aggregation
4. **Verification updates status** — passive verification-by-absence updates remediation status after configurable phase windows

But the system is not yet Bayesian in the ways that matter most:

1. **Confidence is static** — once a lesson is created with confidence "medium," it stays "medium" forever, regardless of subsequent evidence
2. **No update rule** — there is no mechanism to increase confidence when predictions succeed or decrease it when they fail
3. **No diagnosticity assessment** — all confirming signals are treated equally; there is no notion of how *surprising* a signal is under the lesson vs. without it
4. **Old evidence conflated with new** — founding signals (which created the lesson) are listed alongside later signals without distinguishing their evidential status
5. **No base rate tracking** — the system does not know what proportion of "medium confidence" lessons turn out to be accurate, so it cannot calibrate its confidence assignments
6. **No prediction tracking** — lessons generate implicit predictions (this pattern will recur / this fix will hold), but outcomes are not systematically recorded against those predictions

A Bayesian GSD Reflect would treat every lesson as a hypothesis under continuous evaluation. Each milestone, each verification window, each new signal would be an occasion for updating confidence — upward or downward — based on how well the lesson's predictions match reality.

## Concept Mapping

| Framework Concept | GSD Reflect Analog | Current State | Praxis Implication |
|---|---|---|---|
| **Prior probability** | Initial lesson confidence at creation | Set categorically by evidence count (6+ signals = high) | Should also consider evidence diversity, signal severity mix, and base rate of lesson accuracy for this category |
| **Posterior probability** | Updated lesson confidence after new evidence | Does not exist — confidence is immutable after creation | Introduce a confidence update mechanism triggered by milestone boundaries, verification outcomes, and new signal matches |
| **Likelihood ratio** | How diagnostic a signal or outcome is for/against a lesson | Not assessed — all confirming signals weighted equally | Distinguish between signals that are *expected under the lesson* vs. *expected regardless*; only the former confirm |
| **Evidence / observation** | New signals, verification results, prediction outcomes | Signals accumulate but do not feed back into lesson confidence | Close the loop: verification success/failure and new signal matches should update the lessons they relate to |
| **The problem of priors** | How to set initial confidence for new lessons | Categorical assignment by evidence count alone | Incorporate evidence diversity (independent sources vs. same-root-cause cluster), severity distribution, and historical base rates |
| **Conditionalization** | How to update lesson confidence after each milestone | No update mechanism exists | Define a directional update rule: confirming evidence raises confidence one step; disconfirming evidence lowers it; neutral evidence (expected either way) leaves it unchanged |
| **Old evidence problem** | Founding signals that created the lesson | Listed in `evidence:` field alongside later signals, no distinction | Separate `founding_evidence` from `confirming_evidence` in lesson schema; only the latter provides genuine Bayesian updates |
| **Jeffrey conditionalization** | Updating on uncertain/low-confidence signals | Low-confidence signals contribute to pattern detection but not to lesson updates | Weight updates by signal confidence — a high-confidence disconfirming signal warrants a larger downward revision than a low-confidence one |
| **Coherence / Dutch book** | Internal consistency of confidence assignments across lessons | No cross-lesson consistency check | If lesson A (high confidence) contradicts lesson B (medium confidence), one must be wrong — the system should detect and flag such tensions |
| **Convergence / merging of opinions** | System calibration over time | No longitudinal tracking of confidence accuracy | Track prediction outcomes to measure calibration: do "high confidence" lessons actually hold more often than "low confidence" ones? |
| **Bayesian confirmation** | Counter-evidence seeking in reflection | Exists (Section 2.5 of reflection-patterns.md) but only adjusts confidence downward | Formalize as bidirectional: counter-evidence lowers confidence, but *absence of expected counter-evidence* (severe test passed) should raise it |
| **Base rate / prior probability of the prior** | Historical accuracy rate for lessons in each confidence tier | Not tracked | Record lesson outcomes (validated/invalidated/superseded) to build empirical base rates that inform future prior assignments |

## Concrete Examples

### Example 1: Confidence Updating for Lessons

Consider `les-2026-02-28-plans-must-verify-system-behavior-not-assume`, a workflow lesson created with 6 founding signals. Under the current system, it likely receives high confidence and that confidence never changes.

**Bayesian treatment:**

*Prior assignment:* The lesson has 6 evidence signals, which is substantial. But 4 of those signals come from Phase 22 (the extraction debacle) and share a common root cause — they are not independent observations. True evidential diversity is lower than the count suggests. A Bayesian prior would discount correlated evidence: 6 signals from 2 independent root causes is less informative than 6 signals from 6 independent root causes. Initial confidence: medium-high, not the automatic "high" that 6+ signals would normally trigger.

*First update (milestone v1.16):* During v1.16, the plan checker was introduced. If the plan checker catches a violation of this lesson (a plan that assumes behavior without verifying), that is a *confirming prediction* — the lesson predicted this pattern would recur, and it did. Confidence should increase.

Direction: MEDIUM-HIGH moves to HIGH.

*Second update (milestone v1.17):* Suppose the plan checker runs for an entire milestone and catches zero instances of this pattern. Two interpretations are possible: (a) the lesson successfully changed behavior (plans now verify instead of assuming), or (b) the particular conditions that triggered the pattern have not arisen. These have different evidential weight. If plans in v1.17 are spec-only phases (which do not typically verify system behavior), the absence is uninformative — likelihood ratio near 1. If plans in v1.17 include implementation phases that previously would have assumed behavior, the absence is genuine negative evidence for recurrence (good news — the lesson worked).

Direction: If the evidence is diagnostic (implementation phases with no violations), confidence STAYS AT HIGH with a note that the lesson appears to have been internalized. If uninformative, no update.

*Third update (counter-evidence):* A signal arrives indicating that an executor assumed a tool subcommand existed without checking — directly violating this lesson's recommendation. This is disconfirming evidence. But the lesson is about *plans* verifying behavior, not executors. The diagnosticity depends on whether the lesson's scope covers executors. If it does, confidence decreases. If the scope is narrow (plans only), the signal is not relevant and provides no update.

Direction: If in-scope, HIGH moves to MEDIUM-HIGH. If out-of-scope, no update. The system must assess *relevance* before updating — not all signals about related topics are evidence for a specific lesson.

### Example 2: Prior Selection for New Lessons

When v1.17's reflection produces a new lesson from accumulated automation-related signals, the current system sets confidence based on evidence count. Three signals yield "low," four-to-five yield "medium," six-plus yield "high."

**What Bayesian thinking adds:**

The evidence count heuristic is a crude prior-setting policy. It treats all evidence as equal and independent. A Bayesian approach asks three additional questions:

1. **Base rate:** What proportion of past lessons in the "workflow" category have proven durable? If 5 out of 7 workflow lessons are still active and validated after two milestones, the base rate for workflow lessons is roughly 70%. A new workflow lesson starts with this as context — independent of its specific evidence. If 1 out of 3 "architecture" lessons has been superseded, architecture lessons start lower. This is the *prior of the prior*.

2. **Evidence independence:** Three signals that all stem from the same CI failure are effectively one piece of evidence observed three times. Three signals from three different phases, catching three different manifestations of the same underlying pattern, are genuinely independent. Independent evidence is more informative. The system should assess whether founding signals share root causes.

3. **Severity composition:** Three critical signals are more informative than three minor signals, not because criticality implies truth, but because critical signals are more carefully investigated (lower false-positive rate) and their consequences are more observable (easier to verify). A lesson founded on critical signals starts with a higher prior than one founded on minor signals, even at the same evidence count.

**Concrete comparison:**

*Current system:* Lesson X has 3 signals, gets "low" confidence. Lesson Y has 3 signals, gets "low" confidence. They are treated identically.

*Bayesian system:* Lesson X has 3 signals — all from Phase 34, all about the same plan checker gap, all minor severity. Effective independence: ~1.2 independent observations. Prior: LOW.

Lesson Y has 3 signals — from Phases 28, 31, and 34, each about a different manifestation of executor assumption failures, two critical and one notable severity. Effective independence: ~2.8 independent observations. Prior: MEDIUM.

The Bayesian system captures what the experienced developer already intuits: not all three-signal lessons are equally credible.

### Example 3: The Old Evidence Problem in Signal Detection

`les-2026-03-02-context-bloat-requires-progressive-disclosure` was distilled from signals about context window exhaustion. Those founding signals — the ones that revealed the pattern — *cannot also be used to confirm the lesson*. This is the old evidence problem in practice.

**The trap:** Suppose during the next reflection cycle, the system encounters the founding signals again (they are still in the knowledge base). If it counts them as "confirming evidence," it double-counts: the signals justified creating the lesson AND confirming it. The lesson's confidence inflates without any new information.

**The correct treatment:**

The founding signals establish the prior. They are the reason P(lesson) is not zero. Subsequent confirmation requires *new* evidence — observations made after the lesson was created, whose occurrence was predicted (or whose absence was predicted) by the lesson.

For this specific lesson, genuine confirming evidence would be:
- A *new* signal (post-creation) reporting context exhaustion in a workflow that did not use progressive disclosure
- A *positive signal* reporting that a workflow using progressive disclosure completed within context budget
- Verification-by-absence: phases using progressive disclosure show no context exhaustion signals over a window of N phases

Genuine disconfirming evidence would be:
- A *new* signal reporting context exhaustion in a workflow that *did* use progressive disclosure (the lesson's recommendation failed)
- A finding that progressive disclosure added overhead (extra tool calls, latency) that negated its context savings

The system needs a temporal boundary: evidence created before the lesson's `created` timestamp is founding evidence (locked into the prior). Evidence after that timestamp is updating evidence (available for conditionalization).

## Tensions and Limitations

### The Problem of Priors in Practice

Even with base rates and independence assessment, initial confidence remains partly subjective. Two developers reviewing the same three signals might reasonably disagree about the lesson's starting confidence. Subjective Bayesianism says this is fine — the important thing is that both update coherently going forward, and their credences will converge as evidence accumulates. But for a system that produces machine-readable confidence values, this subjectivity is uncomfortable. The pragmatic resolution: be transparent about the prior-setting policy, make it configurable, and track calibration over time so the policy can be improved empirically.

### Computational Tractability

Actual Bayesian updating requires specifying likelihoods — P(evidence | lesson is true) and P(evidence | lesson is false). GSD Reflect cannot compute these. It operates in natural language over Markdown files. Any "Bayesian" reasoning will necessarily be *directional* (confidence goes up, down, or stays the same) rather than *quantitative* (confidence moves from 0.72 to 0.78). This is a fundamental limitation. The system can implement Bayesian-flavored heuristics, not Bayesian computation.

### The Old Evidence Problem Has No Clean Solution

The old evidence problem is genuinely hard. Counterfactual updating ("would this evidence have been surprising if I hadn't known it?") requires the system to reason about a state of knowledge it never occupied. In practice, the temporal boundary (pre-creation = founding, post-creation = updating) is the best operational proxy. It is imperfect — a signal created one minute after the lesson but based on the same root cause investigation is founding evidence in spirit — but temporal boundaries are at least mechanically implementable.

### Tension with Popper

Popper rejected probabilistic confirmation entirely. For Popper, theories are never confirmed, only corroborated by surviving attempts at falsification. The Bayesian framework says confirmation is real — P(H|E) > P(H) — and that corroboration is just a special case of confirmation (evidence that could easily have disconfirmed H but did not provides a large likelihood ratio, hence a large update).

GSD Reflect's counter-evidence seeking is Popperian in spirit: it actively looks for disconfirming evidence. The Bayesian integration would be to formalize what happens when counter-evidence is *not found*: a severe test that the lesson survives is itself confirming evidence. Currently, "0 counter-evidence found" results in "Pattern confirmed at current confidence" — no upward revision. A Bayesian system would increase confidence when a genuine attempt at falsification fails, because the absence of expected counter-evidence is informative (likelihood ratio > 1 when P(no counter-evidence | lesson true) > P(no counter-evidence | lesson false)).

### The Coherence Tax

Bayesian coherence across the entire knowledge base — ensuring all lesson confidences form a consistent probability distribution — is infeasible. Lessons are not mutually exclusive hypotheses; they are loosely related principles that may partially overlap or tension with each other. The practical compromise is *local* coherence: when two lessons contradict each other, at least one must have its confidence reduced. Global coherence across 50 lessons is not achievable or necessary.

### The Calibration Bootstrap

To use base rates for prior-setting, you need historical data on lesson accuracy. But to assess lesson accuracy, you need to track predictions and outcomes. And to track predictions, you need a prediction-tracking mechanism that does not yet exist. This is a bootstrap problem. The system must start somewhere — perhaps with uniform priors (all new lessons start at "medium") — and build calibration data over time. The first few milestones will operate with poorly calibrated priors, and that is acceptable as long as the system tracks enough data to improve.

## Praxis Recommendations

### 1. Introduce Mutable Confidence with Update Logs

Lesson confidence should not be frozen at creation. Add an `updates` field to the lesson schema that records each confidence change:

```yaml
confidence: medium
confidence_history:
  - confidence: low
    reason: "initial (3 signals, 2 independent roots)"
    date: 2026-03-03
  - confidence: medium
    reason: "prediction confirmed: v1.17 CI sensor caught pattern (sig-2026-04-01-...)"
    date: 2026-04-01
```

The current confidence reflects all evidence to date. The history provides an audit trail and makes the system's reasoning inspectable.

### 2. Separate Founding Evidence from Updating Evidence

In the lesson schema, distinguish between signals that created the lesson and signals that subsequently confirmed or disconfirmed it:

```yaml
founding_evidence: [sig-001, sig-002, sig-003]
confirming_evidence: [sig-010, sig-015]
disconfirming_evidence: [sig-012]
```

The temporal boundary is the lesson's `created` timestamp. Founding evidence establishes the prior. Only updating evidence (confirming or disconfirming) drives confidence revisions. This prevents the double-counting problem identified in the old evidence analysis.

### 3. Define a Directional Update Rule

Since quantitative Bayesian computation is infeasible, define a categorical update rule:

| Event | Direction | Magnitude |
|---|---|---|
| New signal matches lesson prediction | UP | +1 step if signal is high-confidence; +0.5 if medium; +0 if low |
| New signal contradicts lesson prediction | DOWN | -1 step if signal is high-confidence; -0.5 if medium; -0 if low |
| Verification-by-absence succeeds (no recurrence over N phases) | UP | +0.5 step |
| Severe test passed (counter-evidence sought, none found) | UP | +0.5 step |
| Counter-evidence found during reflection | DOWN | -1 step per counter-evidence item |
| Lesson prediction not testable in this milestone | NONE | No update — uninformative evidence |

Steps operate on an internal ordinal scale (e.g., 1-5), with thresholds mapping to the categorical labels: 1-2 = low, 3 = medium, 4-5 = high. This preserves backward compatibility with the existing three-tier system while enabling finer-grained tracking internally.

### 4. Assess Evidence Independence at Lesson Creation

When distilling a lesson, assess whether founding signals are independent:

- Signals from different phases = likely independent
- Signals from the same plan = likely correlated
- Signals with different root causes = independent
- Signals with the same root cause = correlated (treat as ~1 observation)

Report effective independence alongside raw count: "6 signals (3 independent roots)." Use effective independence, not raw count, for initial confidence assignment. This addresses the Bayesian concern about correlated evidence inflating priors.

### 5. Track Prediction Outcomes for Calibration

Each lesson implicitly predicts something: a pattern will recur (or not), a recommendation will prevent a class of errors, a convention will hold across projects. Make these predictions explicit and track outcomes:

```yaml
predictions:
  - prediction: "Plans without explicit verification steps will produce executor deviations"
    made: 2026-02-28
    outcome: confirmed
    evidence: sig-2026-03-15-...
    resolved: 2026-03-15
```

Over time, this builds the calibration data needed to evaluate whether "medium confidence" lessons are confirmed at the expected rate (~50-70%) and whether "high confidence" lessons hold (~80-95%). If high-confidence lessons are confirmed only 60% of the time, the prior-setting policy is miscalibrated and should be adjusted.

### 6. Implement Bidirectional Counter-Evidence Updates

The current counter-evidence system (Section 2.5 of reflection-patterns.md) only revises confidence downward when counter-evidence is found. It does not revise upward when counter-evidence is sought and not found. This is half-Bayesian.

A severe test that a lesson survives is itself evidence. "Counter-evidence (0 found)" should move confidence up, not leave it unchanged. The update should be proportional to how hard the system looked — a perfunctory search that found nothing is less informative than an exhaustive search across multiple milestones.

In practice: after each reflection cycle's counter-evidence phase, record the search scope (how many signals examined, how many phases covered) and the result. "Searched 40 signals across 3 phases, 0 counter-evidence found" is more confirming than "Searched 5 signals in current phase, 0 found."

### 7. Detect Lesson Contradictions (Local Coherence)

When two active lessons make conflicting recommendations, at least one must have its confidence reduced or its scope narrowed. This is a minimal coherence requirement. The system should flag contradictions during reflection:

- Lesson A says "always use progressive disclosure for context efficiency"
- Lesson B says "inline all context for executor self-containment"

These cannot both be unconditionally true. The resolution might be scope restriction (A applies to research agents, B applies to executors) or confidence adjustment (the better-evidenced lesson retains its confidence, the other is downgraded).

### 8. Use Uninformativeness as a Reason Not to Update

Not every milestone produces evidence relevant to every lesson. The system should explicitly recognize when a milestone is *uninformative* for a given lesson (the conditions under which the lesson's prediction is testable did not arise) and make no update. This prevents the false confidence that comes from interpreting silence as confirmation. Absence of evidence is not evidence of absence — unless the system was actively looking and the evidence had a reasonable chance of appearing.

## Citable Principles

- **bayesian/belief-updating**: Lesson confidence must update with evidence; a confidence value that never changes is not a credence but a label.
- **bayesian/prior-sensitivity**: Initial confidence depends on evidence independence, severity composition, and base rates — not on raw signal count alone.
- **bayesian/evidence-independence**: Correlated evidence (same root cause, same phase) counts less than independent evidence; effective independence, not raw count, determines evidential weight.
- **bayesian/old-evidence-separation**: Signals that created a lesson (founding evidence) cannot also confirm it; only post-creation observations provide genuine Bayesian updates.
- **bayesian/diagnosticity**: Evidence that is equally expected whether the lesson is true or false provides zero update; the system must assess how *surprising* an observation is under the lesson vs. without it.
- **bayesian/bidirectional-update**: Absence of expected counter-evidence is itself confirming evidence; surviving a severe test should increase confidence, not leave it unchanged.
- **bayesian/calibration-tracking**: Track prediction outcomes to measure whether confidence labels correspond to actual accuracy rates; miscalibration reveals a broken prior-setting policy.
- **bayesian/local-coherence**: Contradictory lessons cannot both be high-confidence; the system must detect and resolve tensions rather than tolerating incoherence across the knowledge base.
- **bayesian/uninformativeness**: When conditions for testing a lesson's prediction did not arise, make no update; silence is not confirmation unless the system was actively listening in the right conditions.

---

*This deliberation provides the epistemological foundation for treating lesson confidence as a living, evidence-responsive quantity rather than a static label. It should be cited when designing confidence update mechanisms, prediction tracking, and calibration systems in future milestones.*
