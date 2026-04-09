# Audit Skill Gap Analysis: What Phase 57 Revealed About Audit Design

**Date:** 2026-04-09
**Context:** Phase 57 produced a result that didn't match expectations. The user wanted to investigate what happened. No `/gsdr:audit` command existed (57.3 gap). When we looked at the audit type taxonomy, no existing type matched the investigation needed. The investigation we improvised revealed both a specific problem (Phase 57 scope) and a general problem (audit types can smuggle in assumptions about what went wrong before the investigation begins).

---

## Part 1: What We Actually Needed

Something went wrong with Phase 57. The CONTEXT.md described a rich vision for active measurement infrastructure. The implementation is a session-meta file reader. We wanted to understand what happened.

The investigation we ran (ad hoc, via an Explore agent) read the artifact chain in sequence: REQUIREMENTS → CONTEXT → RESEARCH → DISCUSSION-LOG → PLAN → IMPLEMENTATION. It found correlations — the scope appeared to narrow at each stage — and proposed a causal story: "three-stage narrowing by omission."

But that causal story was already shaped by how we framed the investigation. We asked "where was the vision lost?" which presupposes that something was lost, that it happened at a locatable stage, and that the mechanism was loss rather than, say, legitimate scope management, agent capability limits, or a reasonable interpretation of ambiguous requirements. The investigation found what we were looking for — which is exactly the problem.

---

## Part 2: What the Current Taxonomy Offers (and Why None of It Fits)

| Existing Type | Why It Doesn't Match |
|---|---|
| `phase_verification` | Checks if a phase achieved its stated goal. Phase 57 "passed" 10/10. The problem isn't that it failed — it's that the goal may itself have been wrong, or the right goal at a different scope than expected. We don't know yet. |
| `codebase_forensics` | Structural understanding of code. This isn't about code. |
| `comparative_quality` | Compares quality across outputs. Closer — but already assumes quality is the axis. Maybe the issue is scope, or authority, or agent capability. |
| `requirements_review` | Checks requirements coverage. Part of the picture — but presupposes requirements are the right unit of analysis. |
| `claim_integrity` | Checks typed claims resolve. Could catch unanswered `[open]` questions, but the scope is broader. |
| `exploratory` | Open-ended, follow the question. This WORKS as an escape hatch but provides no structure for the specific thing we needed: reading a sequence of artifacts and understanding what happened between them. |

The deeper problem: every existing type presupposes a **form of failure** — structural (does it work?), epistemic (is it well-reasoned?), compliance (does it follow the rules?). What we needed was an investigation that didn't presuppose the form of failure — that could discover it.

---

## Part 3: The Missing Audit Type: Investigatory

### Why not "Pipeline Fidelity"

Our first attempt at naming this type was `pipeline_fidelity` — "checking whether upstream intent survived translation through the artifact pipeline." This framing already contains the diagnosis:

- "pipeline" assumes the artifact chain is the relevant unit of analysis
- "fidelity" assumes the problem is faithfulness of transmission
- "upstream intent" assumes there was a clear intent that should have been preserved
- The implied cause is "information loss" — a knowledge transmission failure

But we don't know any of that before the investigation. Maybe the requirements were correctly scoped and the CONTEXT.md was aspirational beyond what was feasible. Maybe the planner made a sound judgment call that wasn't documented. Maybe the problem isn't in the pipeline at all but in how we write requirements before discuss-phase runs. The framing shapes what the auditor looks for and what it can find.

### What "Investigatory" means

An **investigatory audit** starts from a discrepancy, anomaly, or concern — something that doesn't look right — and tries to understand what happened. It does NOT start from a hypothesis about the form of failure.

**When to use it:**
- "Something went wrong but I don't know what"
- "This doesn't match what I expected"
- "How did we end up here?"
- "I want to understand what happened before deciding what to fix"

**What makes it distinct:**
- It's **pre-diagnostic** — the audit discovers the form of the problem, it doesn't presuppose it
- It's **cross-artifact** when needed — but only because the investigation leads there, not because the type mandates it
- It tolerates **multiple explanations** — findings should present competing interpretations, not collapse to a single root cause
- It's **reflexive about its own framing** — see Part 4

**Key investigation questions (starting points, not script):**
1. What was expected? What was delivered? What's the discrepancy?
2. What artifacts are relevant? (Let the discrepancy guide artifact selection, not a fixed chain)
3. For each relevant artifact: what does it say, what does it not say, what might explain the gap?
4. What are at least two competing explanations for what happened?
5. What evidence would distinguish between them?
6. What do we still not know?

**Ground rules needed (beyond core):**
- **I1: Start from the discrepancy, not from a theory.** Describe what was expected and what was delivered before reading any artifacts. The gap between them is the investigation target — not a presupposed mechanism.
- **I2: Let the investigation guide artifact selection.** Don't mandate which artifacts to read in advance. Follow the evidence — if the discrepancy points to the planning stage, read planning artifacts. If it points to requirements, read requirements. The artifact chain is a finding, not an input.
- **I3: Present competing explanations.** For each finding, offer at least two interpretations. "The research narrowed scope" could mean the researcher made an error, OR the researcher correctly applied constraints the investigator hasn't understood yet. Don't collapse to one.
- **I4: Name what the investigation cannot see.** Every investigation is conducted from a position with blind spots. What does this framing make visible? What might it obscure? What would a differently-framed investigation look for?

**Body template:**

```
## The Discrepancy
[What was expected vs. what was delivered — no causal claims yet]

## What Was Examined
[Which artifacts, in what order, and why those artifacts]

## What Was Found
[Observations from each artifact — what it says, what it doesn't say]

## Competing Explanations
[At least two interpretations of the findings]

## What Distinguishes Them
[What evidence would favor one explanation over another]

## What Remains Unknown
[Questions the investigation opened but could not answer]

## Position of This Investigation
[What this framing made visible; what it might have obscured; what a different investigation might find]
```

---

## Part 4: A General Concern About Audit Types and Prejudgment

This gap analysis revealed something that applies beyond the `investigatory` type: **every audit type smuggles in assumptions about the form of failure, and those assumptions shape what the auditor can find.**

- A `phase_verification` audit assumes the phase goal is the right standard. If the goal itself is wrong, verification passes and the real problem is invisible.
- A `comparative_quality` audit assumes quality is the relevant axis and that comparison is the right method. If the problem is scope rather than quality, the audit finds nothing.
- A `claim_integrity` audit assumes the typed claim vocabulary captures the relevant distinctions. Claims that don't fit the vocabulary are invisible.
- A `requirements_review` assumes requirements are the authoritative scope source. If context/discussion should override requirements in certain cases, the audit can't see that.

This isn't a flaw to fix — all inquiry is prejudiced in the Gadamerian sense. You can't ask a question without assumptions about what kind of answer you're looking for. But **certain prejudices are wrong for certain inquiries.** A structural audit is wrong when the problem is epistemic. A fidelity audit is wrong when the problem isn't about fidelity.

**Suggestion for the audit skill:** Every audit type should include, either in its ground rules or as a final reflection step, a version of the question: *"What did the choice of this audit type make visible, and what might it have obscured? If the findings feel too clean or too expected, consider whether the type itself shaped the investigation toward a predetermined conclusion."*

This is not the same as Rule 4 (escape hatch), which asks "what didn't fit the template." This is more fundamental: "was this the right template to begin with?" Rule 4 catches excess within the frame. This catches whether the frame itself was appropriate.

---

## Part 5: Implications for `/gsdr:audit` Design

### 1. Add `investigatory` as a new audit type

Family: this is the question — it doesn't fit neatly into structural, epistemic, or compliance. It's pre-diagnostic. It might be its own family, or it might be the audit type you use when you don't yet know which family the problem belongs to. For now, treat it as its own category alongside the three families and the `exploratory` escape hatch.

Ground rules: Core + I1, I2, I3, I4 (investigatory-specific, above)

### 2. The type inference table

| Context clue | Inferred type |
|---|---|
| "what happened", "how did we end up here", "something went wrong", "doesn't match what I expected", "I want to understand before fixing" | investigatory |

### 3. Distinguish from `exploratory`

`exploratory` is open-ended but forward-looking — "what should we think about X?" `investigatory` is open-ended but backward-looking — "what happened with X?" The body templates reflect this: exploratory asks "what might it mean," investigatory asks "what are competing explanations."

### 4. Add a frame-reflexivity step to ALL audit types

Not just investigatory — every type. A lightweight version of I4 as a closing step:

> "Did the choice of audit type shape what you found? What would a differently-typed audit have looked for?"

This could be a sentence or a paragraph. It doesn't need to be a full section for every audit. But the question should be asked.

### 5. Consider frame-reflexivity for other GSD workflows

The same concern applies beyond audits. The verifier presupposes that plan must-haves are the right standard. The signal synthesizer presupposes that sensor-detected patterns are the right signals. The planner presupposes that requirements are the authoritative scope. Each of these framings is productive — and each has blind spots. Making those blind spots visible is a design principle, not just an audit feature.

---

## Part 6: What This Doesn't Cover (Known Limitations)

- This analysis is grounded in one incident (Phase 57). The `investigatory` type and its ground rules need testing against other cases before formalizing.
- The relationship between `investigatory` and `exploratory` is deliberately left unresolved — they may merge, they may stay distinct, usage will clarify.
- The frame-reflexivity step (Part 4) is a suggestion, not a tested practice. It could become performative (agents writing "I considered my biases" without actually doing so) if not grounded in specific questions about specific blind spots.
- Whether `investigatory` should be its own family or a modifier applicable to any type ("run a phase_verification audit in investigatory mode") is an open design question.
- The Heideggerian observation — that the form of questioning already determines what can show up as an answer — is philosophically deep but operationally hard to encode. Ground rules I1-I4 are a pragmatic approximation, not a full response. A fuller response would require the audit system to support mid-audit type switching when the investigation reveals the original type was wrong.
