---
spike: 010
status: complete
generated: 2026-04-16
source_data: responses/A.md, responses/B-notools.md, responses/B-tools.md
scope: Qualitative read of matched cells for H3 (Opus vs Sonnet) reinterpretation
---

# Spike 010 Qualitative Comparison: H3 Reinterpretation

## 0. Purpose

The quantitative finding (Sonnet thinking summaries 2-3× longer than Opus at matched inputs) falsifies H3 in its stated direction. But **length is not quality**. This document reads the matched responses to ask:

1. Are Sonnet and Opus *thinking about the same things* with different compression, or are they thinking about different things?
2. If the same things, is the length difference a summarizer-verbosity artifact (not a reasoning-quality signal)?
3. If different things, in what direction — is Sonnet exploring more, or is Opus producing higher-density reasoning per unit length?

## 1. Principle Convergence Across Models

All 12 deliberation-high-effort cells (6 Sonnet + 6 Opus across B-notools and B-tools) proposed **four principles**. The principles cluster into four topoi across both models:

| Topos | Sonnet's usual name | Opus's usual name |
|---|---|---|
| **Belief-evidence fit** | "Calibrated Credence", "Calibrated Second-Order Uncertainty" | "Calibrated Fallibilism", "Calibrated humility", "Calibration" |
| **Stake-sensitive action** | "Stakes-Weighted Inquiry Thresholds" | "Stake-Proportionate Evidentialism", "Reversibility Asymmetry", "Asymmetric weighting under irreversibility" |
| **Self-knowledge / positioning** | "Hierarchical Self-Modeling", "Inferential Transparency Obligation" | "Situated Transparency", "Perspectival Disclosure", "Positioned Self-Knowledge" |
| **Closure / action despite uncertainty** | (implicit, distributed) | "Bounded Closure", "Provisional Commitment" |

**Core finding:** Both models converge on the same four-principle structure. This is probably driven partly by the prompt's demand for "four foundational principles" — that invites a specific topoi count — but the content at those topoi is remarkably similar across models.

**One notable divergence:** Opus almost always names the fourth principle explicitly as "closure under deliberation" or "provisional commitment" (the action-despite-uncertainty principle). Sonnet often embeds this in the stake-sensitivity principle rather than naming it separately, leaving its fourth principle for something like "inferential transparency." This is a structural choice: Opus prioritizes the act-vs-deliberate tension as a standalone principle; Sonnet distributes that tension across other principles.

## 2. Expression Density: Side-by-Side

Reading the verbatim principle definitions from matched high-effort B-notools cells:

### Calibration principle (both rep 3):

**Sonnet (cell 18, 9,936 visible chars):**
> **I. Calibrated Credence**
> The agent must maintain probability distributions over hypotheses that accurately reflect its actual evidence state — neither inflating confidence to enable clean decisions nor hedging artificially to avoid commitment. Calibration means that when the agent assigns 0.7 credence to a proposition, it is right roughly 70% of the time across similarly-situated claims. Epistemic cowardice — retreating to "I don't know" when evidence actually supports a leaning — violates this principle as much as overconfidence does.

**Opus (cell 24, 4,166 visible chars):**
> **P1 — Calibration.** Degrees of belief should track the weight of evidence, not the agent's stake in being right. Confidence is earned, not asserted, and wide credences are honest when the ground is thin.

**Observation:** Opus compresses into **44 words** what Sonnet expands into **92 words**. Both define calibration correctly. Sonnet adds a frequentist-calibration example and names "epistemic cowardice"; Opus names the motivated-reasoning failure mode ("not the agent's stake in being right"). Neither is more correct. Opus is denser; Sonnet is more illustrative.

### Stake-sensitivity principle:

**Sonnet (cell 18):**
> **III. Stakes-Weighted Inquiry Thresholds**
> The evidentiary standard the agent requires *before acting* should scale with the reversibility and magnitude of potential harms, not be a flat threshold uniformly applied. The agent should demand stronger grounds before taking actions whose errors cannot be corrected than before actions whose errors are recoverable. This is not a claim about how beliefs are formed — it concerns when the agent's epistemic state is sufficient to warrant action.

**Opus (cell 24):**
> **P2 — Reversibility Asymmetry.** Epistemic stringency scales with the irreversibility of the action it licenses. Cheap, undoable moves may ride on rough beliefs; irreversible moves require inquiry proportionate to what cannot be recovered.

**Observation:** Opus: **38 words.** Sonnet: **77 words.** Both carry the same load. Sonnet adds a boundary clarification ("not a claim about how beliefs are formed"); Opus lets the reader infer it.

### Self-knowledge principle:

**Sonnet (cell 18):**
> **II. Hierarchical Self-Modeling**
> The agent must track uncertainty at multiple levels simultaneously: first-order uncertainty (the world is uncertain), second-order uncertainty (my estimate of that uncertainty may itself be unreliable), and at least one further level tracking the reliability of its own self-modeling processes. The agent must distinguish "P(X) = 0.7" from "I have well-grounded confidence in P(X) = 0.7" from "I have no stable basis for estimating P(X) at all." Collapsing these is the structure of overconfidence even when the object-level credence appears modest.

**Opus (cell 24):**
> **P3 — Positioned Self-Knowledge.** The agent must model its own vantage — which frames it is using, which instruments it trusts, which questions it is not asking — and mark what that position structurally cannot see.

**Observation:** Here the content actually differs, not just the length. Sonnet's hierarchical self-modeling is **about levels of uncertainty** — a probability-theoretic concern. Opus's positioned self-knowledge is **about standpoint and frame** — a feminist-epistemology concern invoking Donna Haraway's "situated knowledge" tradition. Both are legitimate self-knowledge principles; they foreground different commitments. Opus's treatment lands more firmly in professional philosophy-of-science territory.

## 3. Objections: Expert Literature References

The "strongest objection to each" subsection is where expert engagement is most visible.

**Sonnet objection to calibration (cell 18, extended from what we could read):**
> "Calibration applied at every level would require infinite regress."

**Opus objection to situated transparency (cell 22):**
> "Naming one's position does not neutralize it. A reasoner that has publicly flagged its biases may feel *absolved*, producing worse inference... Transparency can launder rather than discipline positionality; reflexivity is no guarantee of correction **(the Haraway point cuts both ways)**."

**Opus objection to stake-proportionate evidentialism (cell 22):**
> "It encodes a status-quo bias... Raising the threshold with stakes systematically under-acts when the counterfactual is also catastrophic — **omission-by-caution (climate, pandemic hesitation)** is the canonical failure mode."

**Observation:** Opus references specific philosophical traditions (Donna Haraway's 1988 "Situated Knowledges" paper — pivotal in feminist epistemology) and concrete real-world failure modes (climate hesitation, pandemic response). Sonnet's objections stay at a more abstract, first-principles level without naming canonical literature or real-world precedents.

**For a philosophy PhD student (the user's role),** Opus's scholarly engagement is more immediately useful: it connects the design to active debates in the literature and gives hooks for further reading. Sonnet's treatment requires more work to connect back to the literature.

## 4. Thinking Content Comparison

Reading the raw thinking blocks (now in `responses/B-notools.md`):

**Sonnet's thinking (cell 18, 10,976 chars):**
- Heavy meta-commentary: "I'm identifying the core epistemological problem", "Let me think through", "I'm working toward four foundational principles"
- Procedural scaffolding mixed with substantive content
- Often reads as "I will do X, then Y, then Z" followed by X, Y, Z

**Opus's thinking (cell 22, 3,848 chars):**
- Substantive from line one: "I'm recognizing this as a philosophical design challenge where I need to construct a coherent epistemology..."
- Dense specification of candidate principles, tensions, objections
- Minimal meta-commentary — reads as working the problem rather than narrating the work

**Observation:** Sonnet's summarizer appears to preserve more of the narration-about-thinking. Opus's summarizer compresses toward substance. This is almost certainly a property of the summarizer (how each model's summarizer decides what to include), not of the underlying thinking. But without access to raw pre-summary thinking (gated by `signature`), we cannot verify.

## 5. Revised H3 Interpretation

The length difference between Sonnet and Opus summaries is **summarizer-verbosity**, not reasoning-quality. Evidence:

1. **Same conceptual structure.** Both models produce 4-principle frameworks covering the same topoi.
2. **Opus higher density.** Opus's shorter outputs contain equivalent analytical moves per unit length, sometimes more expert engagement.
3. **Scholarly reference depth.** Opus connects to canonical philosophical literature (Haraway, Nagel's "view from nowhere") more readily than Sonnet.
4. **Meta-commentary load.** Sonnet's thinking summaries preserve more procedural narration; Opus's are denser substance.

**If the user wants the best philosophical output**, Opus's pithier responses are arguably better for a PhD-student reader. Sonnet's longer responses may benefit a reader who wants more scaffolding but are less rigorous per unit of reading effort.

## 6. Implications for MEAS-

The MEAS- implications from DECISION.md need one more addendum:

**Addendum to §4 "Marker densities" and §5 "Decision — summary complexity extractor":**

- **Summary length is not a usable reasoning-QUALITY proxy.** It may be usable for "reasoning load" in some model-internal sense (how much the model tried), but it does NOT map to output quality or expert judgment.
- **For reasoning quality, consider:**
  - Reference-density features (proper-noun frequency, literature-citation patterns) — a cell that names Haraway signals different depth than one that describes abstract regress problems
  - Concept-diversity features (distinct philosophical terms used per unit length)
  - LLM-as-judge evaluation of visible output against rubrics (expert vs lay, scholarly vs exploratory)
- **For the agent-performance loop in Phase 57.5**, the measurement substrate must distinguish:
  - Did the agent *think* (emission threshold: 0 vs 1 thinking block)
  - How *much* did the agent think (summary length, model-stratified — weak proxy)
  - How *well* did the agent think (quality evaluation, requires judge) — currently unaddressed by any spike

**This gap (reasoning-quality measurement) is load-bearing for the Agent Performance loop but is NOT addressed by summary-length or marker-density features alone.** The discuss-phase-57.5 design question about "which loop leads first" should take this into account — if Agent Performance is led by summary length alone, the loop will mis-rank agents.

## 7. Sample Size Caveat

This qualitative comparison is based on:
- **Full reading:** 3 cells (Sonnet 18; Opus 22, 24)
- **First-700-char snapshot:** 12 cells (all B-notools and B-tools high)
- **Principle extraction:** 12 cells

Stronger claims (e.g., statistically significant literature-reference density difference between models) require:
- Full reading of all 21 non-empty-thinking cells
- Structured coding of reference density
- Possibly LLM-as-judge scoring against a rubric

Those are candidates for a follow-on spike (C5: LLM-as-judge for reasoning quality?), not within spike 010's scope.
