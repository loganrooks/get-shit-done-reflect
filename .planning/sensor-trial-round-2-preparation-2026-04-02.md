# Sensor Trial Round 2: Preparation Notes

## Deviation Testimony

This artifact records the preparatory interpretive work done between Round 1 and Round 2 of the sensor prototype trials. It captures readings of primary sources (SIG-* signals, philosophical deliberations, specific signals for re-reading) and the interpretive engagement those readings produce. It has no formal workflow home.

---

## 1. Reading the SIG-* Signals on Apollo

### What They Are

15 manually curated signals created on 2026-02-22 and 2026-02-23 during Phases 24-27 (CLI subcommand development). They use a separate naming format (SIG-260222-NNN) predating the standard signal schema. 10 are positive observations, 4 are negative, 1 is resolved.

### What They Capture That Auto-Generated Signals Don't

**Architecture decision records as observations.** SIG-260222-002 (no number-to-boolean coercion), SIG-260222-003 (same-directory tmp for atomic rename), SIG-260222-005 (zero-touch manifest) — these document design decisions with their rationale, impact, and recommendations for future developers. They're not "what went wrong" but "what was decided and why it was right."

**Development patterns as reusable knowledge.** SIG-260222-001 and SIG-260222-010 document TDD as a practice that produces zero-deviation execution. SIG-260222-011 documents the silent helper pattern. SIG-260223-015 documents embedded pitfall mitigations. These are practices, not problems.

### Why the Practice Died

The SIG-* signals were created during the first intensive code-building phases. The sensor pipeline (Phase 38, 2026-03-04) automated signal creation, and auto-generated signals are overwhelmingly about deviations. The KB developed a **negativity bias**: it captures what went wrong but not what went right.

The practice lasted exactly 2 days. It was born in a specific moment of intensive code development where architectural decisions were being made rapidly and the developer wanted to capture them. It died when the framework formalized signal collection into an automated pipeline that couldn't recognize positive patterns.

This is the forms-excess problem in miniature: the sensor pipeline formalized signal creation and in doing so betrayed the positive-curation practice. The automated system detects deviations from plans; it cannot recognize when something is done *well* in a way worth remembering.

### What This Opens

- Should positive-pattern curation be part of the framework? Not as an automated sensor (automation is precisely what killed the practice) but as a prompted practice — "what went right that's worth recording?"
- The SIG-* signals are architecture decision records. ADRs are a known pattern in software development. Should the KB have an ADR type alongside signals, reflections, and spikes?
- The 2-day lifespan suggests the practice needs structural support to sustain itself, but the structural support must not automate the judgment that makes it valuable.

---

## 2. Reading the Philosophical Deliberations

### forms-excess-and-framework-becoming.md

**Core insight for the trials:** "Every proposed 'solution' (new artifact type, new template section, new agent) is itself a formalization that will have its own excess. The question isn't 'what form captures everything?' (none can) but 'what relationship should the framework have to its own constitutive inadequacy?'"

**What it demands of Round 2:** The trials are formalizations. Each trial's formal structure (predictions, classifications, correlation clusters) has its own excess — what the trial couldn't see or classify. Trial G's non-occurrence IS the excess of the trial framework. If Round 2 tries to "fix" this by making Trial G a discrete step with completion criteria, it will formalize the interpretive practice and thereby betray it. The alternative: Round 2 should have interpretive engagement embedded throughout, not separated into a designated step.

**The conversational trace is data.** The deliberation explicitly argues that the path of escalation through which insights developed — from specific metric → experimental design → template structure → artifact types → forms and excess → ethical grounding → the deliberation's own inadequacy — is itself evidence. The trials produced no such traces. Their findings arrive fully formed in prediction tables. The reasoning that produced the classifications is invisible.

### structural-norms-practical-judgment-and-harness-embodiment.md

**The three-layer distinction diagnoses the trial methodology:**
- Declarative: the roadmap stated what we valued (qualifications, exposed assumptions, hermeneutic reading)
- Procedural: the execution followed procedural steps (dispatch agents, evaluate predictions)
- Structural: the roadmap's structure (discrete steps, completion criteria, delegated agents) made breadth easy and dwelling hard

**"Some values probably need to become structural, not merely stated":** This applies to Round 2 design. If interpretive engagement is important, it needs to be structurally supported — not just declared as important and then ignored when execution pressure rises. But the structural-norms deliberation also warns: "procedural norms can become bureaucratic theater, simulating rigor rather than producing it." The challenge is structural support without structural capture.

**"Non-premature closure" as structural norm:** The trials closed prematurely. Trial B evaluated 1 deliberation and declared the practice "definitely formalize." Trial A classified 39 signals and produced a taxonomy. These are premature closures — drawing conclusions from single samples or limited corpora. Round 2 should resist closure more aggressively.

---

## 3. Trial G: Hermeneutic Re-Reading

### Signal: "Handoffs Convey Content, Not Weight" (sig-2026-03-30)

**Beyond its classification:** This signal is classified as "capability-gap" with severity "notable." But what it carries is a philosophical diagnosis of a fundamental limitation of text-based knowledge transfer: you can write down what you learned, but you can't write down how much it matters.

**What it says to the trials:** The trial roadmap conveyed Trial G's purpose (content) without making it mandatory (weight). The CI gates in zlibrary-mcp existed (content) without enforcement testing (weight). Both are the same structural condition — the gap between awareness and enforcement.

**What it says to the forms-excess deliberation:** This signal is an instance of what the deliberation calls "the Said betraying the Saying." The .continue-here.md formalizes what was learned (the Said) but cannot carry the force of the learning (the Saying). The frustration in the user's quoted words — "yea wait what the fuck" — is the trace of the Saying that the formal structure can't hold. The remediation section (3 mechanisms) is the attempt to compensate structurally for what text can't convey. But those mechanisms are themselves text — more Said. The recursion is constitutive.

### Signal: "Silent CI Failure Masking" (sig-2026-03-20, zlibrary-mcp)

**Trial A classified this as STALE** because commit 7e20480 fixed the bugs. Re-reading: the bugs are fixed but the *principle* — "verify the enforcement path, not just the configuration" — has not been structurally embodied. Nothing in the GSDR framework forces verifiers to test failure conditions rather than just checking artifact existence.

**What it says to the trials:** Trial A itself didn't test its own enforcement path. We checked that the staleness detector could classify signals correctly. We didn't test what happens when the classification is wrong (a signal that should be stale but isn't detected, or vice versa). Zero false positives sounds like a success. This signal warns: untested enforcement paths are exactly where silent failures live.

**What it says to Thread 8:** The signal lifecycle isn't just about marking signals as remediated when code changes. It's about verifying that the *principle* the signal articulated has been structurally embodied. Remediation of the code bug isn't remediation of the insight.

### Signal: SIG-260222-005 (Zero-Touch Manifest Architecture, apollo)

**What it said then:** Adding a new feature to GSD requires only adding it to feature-manifest.json. Zero workflow changes. This was celebrated as an architecture achievement.

**What it says now, in the context of 21 threads:** The zero-touch ideal assumes features fit the manifest schema. But Threads 20 (thread lifecycle), 21 (deviation testimony), and the forms-excess deliberation all concern things that *don't fit*. Threads aren't features. Deviation testimony isn't a manifest entry. Philosophical deliberations aren't configurable. The manifest-driven architecture works for what it was designed for (feature configuration), but the most interesting things in the framework are now happening outside its design space.

This signal is not stale. It's *differently legible* in 2026-04 than it was in 2026-02. The architecture it celebrates is still correct for its domain. But the domain has expanded — and the expansion is precisely what the 21 threads are trying to articulate.

---

## 4. Examining the Evaluation Practice's Effects

Trial B caught that zlibrary-mcp Issue #11 was dropped. What does this produce?

**In the immediate context:** We know about it. But the user is on dionysus, working on get-shit-done-reflect. The follow-up (respond to Torrchy) requires switching contexts to zlibrary-mcp and doing human interaction. Will that happen? This finding might become another piece of content without weight.

**For the evaluation practice itself:** The finding validates that evaluation *reveals* gaps. But revelation without structural follow-up is the exact problem the "content not weight" signal describes. If we formalize deliberation evaluation as a milestone checkpoint, we need to formalize the follow-up too — otherwise evaluation produces findings that are themselves weightless.

**The perverse incentive concern is real.** If predictions are evaluated, future deliberations might hedge their predictions — make them vague enough to avoid falsification. The zlibrary-mcp deliberation had specific predictions (P1: <50 files, <5MB) alongside vague ones (P4: "catches a real regression"). The specific ones produced clear verdicts; the vague ones produced ambiguity. If developers learn that specific predictions are riskier (might be falsified), they might write only vague ones.

---

## 5. Threads That Can Only Be Deepened Through Interpretive Work

These threads cannot be advanced by dispatching agents. They require sustained, interpretive engagement:

1. **Thread 11/18 (signal hermeneutics)** — by definition requires reading, not counting
2. **Thread 10 (philosophical operationalization)** — Trace 008 prescriptions need reading in light of trial findings
3. **Thread 20 (thread lifecycle)** — requires observing threads develop, not classifying them retroactively
4. **Thread 7 (discuss-phase semantic gap)** — synthesis of two approaches requires engaging with both
5. **Thread 17 (user feedback and community design)** — requires imagining absent stakeholders
6. **Emerging Thread 22 (quantitative-interpretive tension)** — IS about what agent dispatches can't do
7. **Emerging Thread 23 (archaeological stratum)** — reading pre-schema signals requires dwelling

Threads that CAN be advanced by agent dispatches (quantitative work):
- Thread 8 (staleness) — more signals, more projects, refine the taxonomy
- Thread 9 (deliberation lifecycle) — evaluate more deliberations
- Thread 13 (KB bridge) — implement rsync, test it
- Thread 19 (signal ontology) — extract and classify more relationships

Threads that need BOTH:
- Thread 12 (unified lifecycle) — design needs interpretation, implementation needs dispatches
- Thread 21 (deviation accountability) — the structural placement gap is defined, but testing the testimony practice requires interpretive engagement with real deviations

---

## Implications for Round 2 Roadmap

Round 2 should not repeat Round 1's structure (sequential discrete trials with agent dispatches). Instead:

1. **Interpretive work should be primary, not supplementary.** The 7 interpretive-only threads should structure the round, not be deferred.

2. **Agent dispatches should serve interpretive questions,** not the other way around. Instead of "dispatch agent to count X, then interpret results," start with "what do we want to understand about X?" and only dispatch if the understanding requires data the agent can provide.

3. **The roadmap should carry weight, not just content.** If a step is important, it should be structurally unmissable — not advisory, not "ongoing," but gated.

4. **Predictions should be made for interpretive work too,** even though they'll be harder to evaluate. "We predict that re-reading the SIG-* signals will reveal a positive-curation practice worth formalizing" is evaluable even if the evaluation is qualitative.

5. **The emerging threads (22-25) should be developed,** not just noted. They arose from the margins of Round 1 and may carry the most important insights.

---

*Date: 2026-04-02 | Session: pre-v1.19 deliberation (session 2) | This document records interpretive engagement with primary sources, not agent-dispatched analysis.*
