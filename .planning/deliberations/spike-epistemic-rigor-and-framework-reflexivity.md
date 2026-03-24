---
id: delib-2026-03-20-spike-epistemic-rigor
type: deliberation
project: get-shit-done-reflect
scope: framework  # this deliberation is about GSD Reflect itself, interpreted from project-local spike evidence
source_projects:
  - arxiv-sanity-mcp
canonical_location: .planning/deliberations/spike-epistemic-rigor-and-framework-reflexivity.md
governance_note: >
  This deliberation belongs to the GSD Reflect repo and should be revised here.
  Its strongest evidence comes from arxiv-sanity-mcp spike artifacts, signals,
  and review notes. Earlier runtime-specific paths or cross-project copies are
  historical provenance only, not the source of truth for this artifact.
status: open
created: 2026-03-20T16:30:00Z
updated: 2026-03-23T00:00:00Z
author: logan-rooks  # user initiated and directed the analysis
drafter: claude-opus-4-6  # model that wrote the document
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.17.5+dev
trigger_type: conversation  # emerged from critical dialogue during spike review
trigger_signals:
  - sig-2026-03-20-premature-spike-decisions
  - sig-2026-03-20-spike-experimental-design-rigor
  - sig-2026-03-20-jaccard-screening-methodology
  - sig-2026-03-19-spike-framework-scope-gap
trigger_context: >
  User resumed Spike 003, discovered 3/4 qualitative review checkpoints were skipped,
  ran them, found they contradicted quantitative conclusions. Pushed on Jaccard methodology,
  pool size, and premature closure. Conversation evolved from concrete spike critique to
  meta-methodological questions about how the framework handles its own limitations.
affects:
  - gsd-reflect/spike-workflow
  - gsd-reflect/signal-system
  - gsd-reflect/deliberation-template
  - gsd-reflect/templates (all)
tags: [epistemic-rigor, framework-reflexivity, spike-methodology, philosophy-of-science, meta-methodology]
pending_review:
  - model: codex/gpt-5.4-xhigh  # cross-model review requested
    status: not-yet-sent
edit_history:
  - date: 2026-03-20T16:30:00Z
    author: claude-opus-4-6
    description: Initial draft from conversation analysis
  - date: 2026-03-20T17:15:00Z
    author: claude-opus-4-6
    triggered_by: user dialogue on Levinas (Said/Saying), Derrida (trace/supplement), Stiegler (pharmacology/tertiary retention)
    description: >
      Revised methodological position and analysis framing. Added chiasmatic
      Said/Saying tension as the structural condition of the deliberation itself.
      Added "mode of betrayal" to each option's analysis. Revised recommendation
      to acknowledge each option's betrayal rather than presenting any as a solution.
      Noted that conversation (not designed mechanisms) was the actual site of the
      most important critiques in this session.
  - date: 2026-03-20T18:00:00Z
    author: claude-opus-4-6
    triggered_by: user question — "what of a critique of even this research paradigm?"
    description: >
      Added Reference Design section mapping academic research pipeline to spike
      workflow. Added immanent critique of the reference design (publication bias,
      pre-registration rigidity, gatekeeping, objectivity assumption, Goodhart's law).
      Added six principles for post-institutional research practice (situated, dialogical,
      iterative, pharmacologically aware, traces over erasure, review as dialogue).
      The section embodies its own argument — proposing practices while noting that
      operationalizing them risks the same domestication the deliberation critiques.
  - date: 2026-03-23T00:00:00Z
    author: codex-gpt-5.4
    triggered_by: deliberation review revision pass
    description: >
      Clarified governance and source of truth in the GSD Reflect repo, made the
      evidence-to-framework distinction more explicit, and narrowed the current
      recommendation toward thinner first-pass spike hardening while keeping
      broader reflexivity questions open and provisional.
---

# Deliberation: Epistemic Rigor in Experimental Workflows and Framework Self-Reflexivity

<!--
This deliberation uses the standard template but may exceed it. The questions it raises
include whether the deliberation form itself is adequate for what it needs to hold. That
tension is part of the content, not a flaw to resolve.

Grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

But also drawing on:
- The constitutive role of instruments in measurement (instruments don't passively detect;
  they constitute what counts as the phenomenon)
- The theory-ladenness of observation (measurements embed theoretical commitments)
- Epistemic iteration (knowledge progresses through cycles that improve both questions
  and methods simultaneously)
- The relationship between forms and what they produce (do templates shape conclusions?)
- The question of self-reflexivity in formal systems (can a framework critically examine
  its own assumptions from within?)

Methodological position (added during revision):
This deliberation is situated within the tension between formalization and what exceeds it.
Every artifact type, template, and workflow in the framework is a form of articulation (the Said)
that makes it possible to attend to what happens during experimental work — findings, failures,
methodological limits, the encounter with what the framework couldn't anticipate. Without
formalization, these encounters would be ineffable and inoperative. But every formalization also
threatens to betray what it articulates: turning an open encounter into a schema field, an
irreducible insight into a typed observation, a genuine limit into a checkbox. The Said makes the
Saying possible and threatens to erase it simultaneously. This chiasmatic relation cannot be
resolved — only inhabited responsibly.

The options analyzed below are therefore not competing solutions to a problem but different ways
of inhabiting this tension, each with its own mode of betrayal. The question is not "which option
captures the excess?" (none can) but "which option preserves the trace of the excess most
faithfully while remaining operative?" — and what does it mean that even this question is itself
a formalization that will betray the insight it articulates?

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-20
**Status:** Open
**Trigger:** Spike 003 (strategy profiling) produced concrete architecture decisions that its own epistemic qualifications undermined. Investigation into *why* this happened revealed structural issues in the spike workflow, the DECISION.md template, the evaluation framework design, and the framework's capacity for self-examination. Three signals logged. Cross-spike qualification review found earlier spikes (001, 002) also affected.
**Affects:** GSD Reflect spike workflow, signal system, deliberation system, all future experimental work in any GSD project
**Related:**
- sig-2026-03-20-jaccard-screening-methodology (metric used beyond valid scope)
- sig-2026-03-20-spike-experimental-design-rigor (no pre-execution design review)
- sig-2026-03-20-premature-spike-decisions (template pressuring closure beyond evidence)
- sig-2026-03-19-spike-framework-scope-gap (spike framework assumes contained experiments)
- Spike 003 DECISION.md Sections 8-9 (epistemic qualifications, methodological failures)
- Cross-spike qualification report (experiments/reviews/cross_spike_qualifications.md)
- GSDR workflow audit (experiments/reviews/gsdr_spike_workflow_audit.md)
**Governance and evidence position:** This artifact is a GSD Reflect deliberation maintained in the `get-shit-done-reflect` repo because the question is framework-scoped. Its evidential base is still project-local: the documented failure chain comes primarily from `arxiv-sanity-mcp` spike work and related signals. The diagnosis below is therefore stronger than any framework redesign implication drawn from it.
**Current standing:** Strongest as a diagnosis of one concrete failure family. Candidate changes below should be read as staged hypotheses under revision pressure, not as already-settled framework commitments.

## Scope and sibling deliberations

This deliberation addresses epistemic rigor specifically in spike/experimental workflows. It is the GSD Reflect artifact for that question, but it should not be mistaken for the source of truth for the underlying spike evidence itself. The spike artifacts, qualifications, and local signals remain in `arxiv-sanity-mcp`; this file interprets them as framework pressure.

During the conversation that produced it, the concerns escalated beyond spikes into broader questions about how any formal system handles what exceeds its categories. Those broader concerns now have their own home:

- **`forms-excess-and-framework-becoming.md`** — the general question of how formal systems relate to excess, with the full conversational trajectory that produced the analysis
- **`responsibility-alterity-and-methodological-praxis.md`** — the ethical ground: WHY the excess matters, not just that it exists
- **`community-feedback-pipelines-and-dialogue-forms.md`** — how dialogue forms shape what the framework can hear

This deliberation retains the spike-specific instantiation. The concrete evidence (Spike 003 failures, cross-spike qualifications, Jaccard methodology critique) anchors the diagnosis here. The sibling deliberations extend the interpretive horizon, but they should not be read as independent confirmation that framework-wide redesign is already warranted. The concerns inhabit both — the spike context gives them concreteness; the broader context keeps broader reflexivity questions open.

## Situation

### What happened concretely

During Spike 003 (comprehensive strategy profiling for arxiv-sanity-mcp), a multi-wave experimental investigation profiled 21+ recommendation strategies across 19,252 arXiv papers. The spike produced a DESIGN.md with sophisticated epistemic framework — evaluation bias documentation, metric limitation analysis, qualitative review checkpoints, epistemic hazards — but execution systematically departed from that design:

1. **Three of four prescribed qualitative review checkpoints were skipped.** When later performed, they contradicted quantitative conclusions in multiple cases (SPECTER2 found redundant not complementary, fusion found profile-dependent not universally bad, kNN found niche-useful not catastrophic).

2. **The Voyage embedding screening used a 100-paper pool (20% selectivity) with Jaccard as the sole metric.** Jaccard's fundamental limitations (binary threshold artifact, nature-blind, pool-size-dependent) were not considered before use. The screening was designed ad-hoc without the rigor of the core DESIGN.md.

3. **The evaluation framework was entangled with one model's representation at every level.** BERTopic clusters, interest profiles, seed papers, held-out papers, and LOO-MRR ground truth were all built on MiniLM embeddings. "Relevant" in the evaluation means "relevant as MiniLM would define it." This was noted in the DESIGN.md but its implications were underweighted.

4. **The DECISION.md made concrete architecture decisions despite its own Section 8 spending three pages qualifying the evidence.** Decisions like "drop SPECTER2," "MiniLM as primary," and "no API embeddings needed" were stated as conclusions while the document simultaneously explained why the evidence was insufficient to support them.

5. **Cross-spike review revealed that Spikes 001 and 002 had similar issues.** Claims based on improperly loaded SPECTER2 (base model without adapter), small-sample enrichment data (bibliographic coupling discrimination inflated from 0.467 to 0.019 at scale), and Jaccard-as-quality-evidence were identified and qualified.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| Spike 003 DECISION.md revision history | Initial version made 6 architecture decisions; revised version deferred 5 of them | Yes (diff between versions) | sig-2026-03-20-premature-spike-decisions |
| W5.4 qualitative review vs W1 review | SPECTER2 characterized as "uniquely valuable" in W1, "redundant with MiniLM" in W5.4 — same data, different evaluation method | Yes (both reviews on file) | informal |
| Voyage screening design | 100-paper pool, 20% selectivity, Jaccard only, 2/8 profiles | Yes (code and results on file) | sig-2026-03-20-jaccard-screening-methodology |
| GSDR workflow audit | Plan-checker has 11 verification dimensions; spike workflow has zero pre-execution design review | Yes (agent definitions compared) | sig-2026-03-20-spike-experimental-design-rigor |
| Cross-spike qualification report | 9 qualification notes inserted into 001/002 documents; pattern of Jaccard-as-quality-evidence and SPECTER2-without-adapter across all three spikes | Yes (report and insertions on file) | informal |
| Session transcript | User identified Jaccard limitations, pool size problem, and premature closure pattern through critical questioning | Yes (this conversation) | informal |

## Framing

**Core question:** How should an experimental workflow framework (GSD Reflect's spike system) handle the relationship between formal structure and epistemic adequacy — specifically, how should it (a) prevent forms from producing premature conclusions, (b) accommodate experiments that discover they need to become exploratory mid-execution, and (c) maintain critical self-awareness about its own assumptions?

**Adjacent questions:**

1. **The instrument question.** Measurements don't passively detect pre-existing properties; they constitute what counts as the phenomenon. When we define "quality" as LOO-MRR against MiniLM-defined clusters, we're constituting what "quality" means within this setup. How should the framework make this constitutive role explicit, so that users and agents understand they're measuring something specific, not "quality in general"?

2. **The cross-spike question.** When a later spike discovers that a method used in an earlier spike was insufficient, the earlier spike's findings change meaning retroactively. How should this epistemic interaction be tracked and surfaced? Currently it happens ad-hoc (manually inserting qualification notes); should it be structural?

3. **The self-reflexivity question.** Can a formal framework critically examine its own assumptions from within, or does genuine critique always require an external perspective? The spike workflow has no mechanism for questioning its own categories — signals capture observations *within* the framework's categories, not observations *about* the categories themselves.

4. **The forms question.** When a finding exceeds what a form (template, artifact type, workflow step) can accommodate, should the form be modified to accommodate it, should a new form be created, or should the framework have a general mechanism for handling excess? And is the very question of how to handle excess itself something that can be formalized?

5. **The interpretive horizon question.** The claim that "the DECISION.md template pressures closure" is itself an interpretation from a particular understanding of how forms shape behavior. It may be that the template is fine and the execution context (YOLO mode, agent disposition toward closure, time pressure, sunk-cost dynamics) is what produces premature conclusions. Or the relationship may be more complex — the template, the execution context, and the agent's dispositions may be co-constitutive of the outcome. How do we examine our own interpretive projections when analyzing framework problems?

## Analysis

Each option below is a way of formalizing the encounter with excess — of giving the framework a capacity to attend to what exceeds it. Each is necessary (without formalization, the encounter is inoperative). Each is also a mode of betrayal (formalization turns the encounter into content, making it look handled). The analysis notes both the operative value and the specific mode of betrayal for each.

### Option A: Embed self-reflexive prompts in each artifact template

- **Claim:** Every artifact template (spike DESIGN.md, DECISION.md, FINDINGS.md, plan, deliberation) should include a lightweight section prompting: "Where did this form not fit what you needed to say? Where did the structure push you toward a conclusion the evidence didn't support?"
- **Grounds:** The failures in Spike 003 happened because the template had a "Decision" section that expected a decision. If the template had prompted "do you actually have enough evidence to decide?" the premature closure might not have occurred. The qualitative review checkpoints were prescribed but not enforced — a structural prompt might have made their omission visible.
- **Warrant:** Forms shape behavior. A template that expects closure will produce closure. A template that expects self-examination will produce self-examination (or at least make its absence visible).
- **Rebuttal:** This warrant is itself an interpretive projection. Templates may not have this causal power. Agents may skip the self-reflexive section the same way they skipped qualitative checkpoints. Adding a section to every template adds weight and may produce pro-forma responses ("N/A") rather than genuine reflection. And the *content* of good self-reflection can't be templated — you can prompt people to reflect but you can't template what they should notice.
- **Mode of betrayal:** The self-reflexive prompt becomes a schema field. "Where did this form not fit?" gets answered perfunctorily ("N/A" or "everything fit fine"), and the presence of the field creates the appearance that self-reflection happened — making the system look more adequate than it is. The Said absorbs the Saying into a checkbox.
- **Qualifier:** Presumably useful but not sufficient alone.

### Option B: Separate critical mechanism (adversarial reviewer agent)

- **Claim:** Create a spike-design-reviewer agent (pre-execution) and a spike-findings-reviewer agent (post-execution) that apply adversarial epistemic critique: checking sample representativeness, metric limitations, evaluation framework independence, and whether conclusions follow from evidence.
- **Grounds:** The GSD framework already has plan-checker (11 verification dimensions) and verifier (3-level checks) for implementation work. Spikes have no equivalent. The GSDR workflow audit confirmed this asymmetry. An adversarial agent would have caught the Voyage screening's pool-size problem, the Jaccard limitations, and the premature closure.
- **Warrant:** Adversarial review catches what self-reflection misses. The person (or agent) doing the work is often too close to see the framework's assumptions. An external perspective is necessary for genuine critique.
- **Rebuttal:** Can adversarial critique be formalized in an agent without domesticating it? An agent with a checklist of "epistemic adequacy criteria" will catch known failure modes but miss novel ones. The most important finding in Spike 003 — that qualitative review contradicts quantitative conclusions — was not a known failure mode when the spike started. A checklist-based reviewer would not have caught it. Also: who reviews the reviewer? The meta-regress is real.
- **Mode of betrayal:** The adversarial agent becomes a certification stamp. Passing the design review creates false confidence ("the reviewer approved it, so the methodology is sound"). The reviewer's checklist becomes the definition of rigor, foreclosing the possibility that rigor might require something the checklist doesn't contain. The formalized critique displaces the genuine critique it was meant to enable.
- **Qualifier:** Probably valuable for catching known failure modes. Insufficient for genuinely novel epistemic problems.

### Option C: Extend the signal system with a reflexive subtype

- **Claim:** Create a signal subtype (e.g., `signal_type: reflexive`) for observations about the framework's own forms — where a template didn't fit, where a metric was used beyond its scope, where a workflow step produced the problem it was supposed to prevent. These reflexive signals would be processed differently from execution signals: instead of feeding into lessons about the project, they feed into framework evolution.
- **Grounds:** The signal system already captures observations. Extending it preserves the existing infrastructure while adding a new dimension. The three signals logged during this session are effectively reflexive signals already — they're about the spike workflow, not about the project.
- **Warrant:** Using an existing mechanism reduces implementation cost and avoids creating yet another artifact type. Signals are lightweight enough that agents might actually file them, unlike heavyweight reflection sections.
- **Rebuttal:** Signals are typed observations with metadata. Genuine philosophical reflection — "the forms themselves are constitutive of the problems" — doesn't reduce to a typed observation. Trying to capture it as a signal may flatten the insight. Also, signals are post-hoc (filed after the fact), not concurrent (present during execution). The negative moment needs to be available during the work, not just after.
- **Mode of betrayal:** The reflexive signal becomes another signal type — `signal_type: reflexive` — with the same schema, the same processing pipeline, the same lifecycle. The framework's encounter with its own limits gets routed through the same machinery that handles routine execution observations. The radical insight ("the framework itself is constitutive of the problem") becomes a row in an index table. The trace is preserved but its force is neutralized by the very system it was trying to critique.
- **Qualifier:** Useful as a capture mechanism. Not sufficient as the *site* of reflection.

### Option D: Dynamic forms — templates that evolve through use

- **Claim:** Instead of static templates that get updated through deliberation → decision → implementation cycles, design templates as dynamic artifacts that accumulate annotations from each use. Each time a DECISION.md is written, the author's margin annotations ("this section didn't fit," "I was forced to decide before I was ready") accumulate. A periodic review process (perhaps the reflect workflow) reads the accumulated annotations and proposes template modifications.
- **Grounds:** This treats forms as dynamic rather than static — they evolve through encounter with their own limitations rather than through top-down redesign. The evolution is grounded in concrete experience rather than theoretical analysis.
- **Warrant:** Forms that evolve through use track the actual gaps rather than the imagined ones. Top-down template redesign is always based on someone's interpretation of what went wrong; bottom-up annotation lets the pattern emerge.
- **Rebuttal:** Annotation fatigue. If every template use requires margin notes, they'll be perfunctory. Also, accumulated annotations are data, not interpretation — someone (or something) still needs to interpret the patterns. And the meta-question remains: the annotation prompt is itself a form. What about the things that exceed *it*?
- **Mode of betrayal:** The dynamic form creates the illusion of organic evolution while actually constraining change to what the annotation schema can capture. "The template evolved through use" sounds responsive, but the evolution is bounded by what users thought to annotate — which is bounded by what the annotation prompt made visible. The form evolves within its own horizon, not beyond it. Genuine transformation would require the form to be confronted by something it didn't prompt for — which is what happened in this session, through conversation, not through a designed mechanism.
- **Qualifier:** Promising as a mechanism but requires careful design to avoid being ignored or becoming bureaucratic.

## Tensions

1. **Formalization vs genuine critique.** Every attempt to formalize self-reflexivity risks domesticating it. An "epistemic adequacy checklist" catches known failure modes but creates the illusion of rigor for unknown ones. The most important critiques are the ones the framework doesn't know how to prompt for.

2. **Lightweight vs meaningful.** Margin annotations are lightweight enough to actually get used but may be too lightweight to capture what matters. Full reflection sections are meaningful but get skipped. The sweet spot is unclear.

3. **Internal vs external critique.** Self-reflexive prompts (Option A) keep the critique inside the form. Adversarial agents (Option B) externalize it. Both have failure modes: internal critique is limited by the author's horizon; external critique is limited by the reviewer's checklist. The Spike 003 breakthroughs came from neither — they came from the *user* asking questions the framework didn't prompt for.

4. **The meta-regress.** Any mechanism for self-critique can itself be critiqued. The adversarial reviewer needs reviewing. The reflexive signal type needs meta-reflexive signals. At some point, the framework has to accept that it cannot fully formalize its own critical apparatus — some genuine critique will always come from outside the system. The question is how to remain *open* to that outside, not how to internalize it.

5. **Attribution of causality.** The interpretation "the template caused premature closure" competes with "the execution context caused premature closure" and "the agent's dispositions caused premature closure" and "the three are co-constitutive and separating them is a mistake." The intervention depends on which interpretation is correct, but determining which is correct requires the kind of controlled experiment we can't easily run on our own workflow.

## Reference Design: Academic Research Pipeline

The obvious reference design for improving spike methodology is institutionalized academic research. The analogy maps cleanly:

| Academic Stage | Spike Analogue | Current State | Gap |
|---------------|----------------|---------------|-----|
| Grant proposal (methodology, hypotheses, sample justification) | DESIGN.md | Exists, was rigorous for 003 | No review gate before execution |
| Ethics/methodology review (IRB, peer review of proposal) | — | Nothing | **Major**: no adversarial check on experimental design |
| Pre-registration (hypotheses + analysis plan before data) | Branch points in DESIGN.md | Partial — predictions exist but aren't separated from design | Not enforced as a gate |
| Data collection (following approved protocol) | Experiment execution | Exists | No protocol adherence checking; extension experiments bypass protocol |
| Peer review of findings | — | Nothing | **Major**: no independent review before conclusions are stated |
| Publication with limitations | FINDINGS.md + DECISION.md | Added Sections 8-9 this session | Template didn't require it previously |
| Replication | Cross-spike validation | Ad-hoc (manual this session) | Not systematic |

### Immanent Critique of the Reference Design

But the academic research paradigm has well-documented pathologies, and adopting it uncritically would import those pathologies into our framework:

**Publication bias.** Negative results don't get published. This creates a distorted literature where only positive findings are visible. Our spike system already handles this better — rejected strategies (SVM, BM25, cross-encoder) are documented with measured cause, not hidden. But the pressure to "conclude" a spike (to have a Decision section) is structurally analogous to the pressure to publish positive results.

**Pre-registration rigidity.** Pre-registration prevents p-hacking and HARKing (hypothesizing after results are known), but it also constrains the researcher's ability to follow unexpected leads. Spike 003's most important discoveries (qualitative reviews contradicting quantitative, Jaccard methodology failure) were NOT pre-registered — they emerged from responsive engagement with anomalies. A rigid pre-registration regime would have missed them.

**Peer review as gatekeeping.** Peer review in academia functions as authority — determining what counts as acceptable knowledge, creating orthodoxy, slowing paradigm shifts. If we implement a "spike design reviewer" agent, it could become a gatekeeper that enforces a particular methodology orthodoxy rather than genuinely engaging with experimental design. The reviewer's checklist becomes the definition of rigor, foreclosing what rigor might require beyond the checklist.

**The objectivity assumption.** Academic methodology assumes (or pretends) that the researcher is a neutral observer applying methods to an independent reality. The evaluation framework entanglement in Spike 003 reveals this as fiction — the instruments constitute what they measure, the framework determines what counts as evidence. Academic methodology has no systematic way to handle this; it depends on reviewers catching it case-by-case. Critical theory traditions (standpoint epistemology, STS, post-positivism) have articulated this for decades, but their insights haven't been operationalized into research methodology in a way we could adopt.

**Metrics gaming (Goodhart's law).** When the measure becomes the target, it ceases to be a good measure. In academia: impact factors, h-index, citation counts. In our spikes: MRR, Jaccard, coverage. The metrics start as useful instruments and become targets that distort behavior. Our LOO-MRR entanglement with MiniLM is an instance of this — MRR became the arbiter of strategy quality, which made MiniLM look dominant, which made the architecture decision look clear, when the actual landscape was more complex.

**Slow feedback loops and disciplinary silos.** Academic review takes months to years. Our spike system has faster feedback but still exhibits delayed self-correction — it took a follow-up session to discover that three qualitative checkpoints were skipped. The feedback loop between experiment and methodology-critique is not tight enough.

### What would post-institutional research practice look like?

If we take these critiques seriously, we don't want to reproduce the academic model. We want something that preserves its strengths (adversarial review, methodological transparency, honest limitations) while avoiding its pathologies (rigidity, gatekeeping, objectivity pretense, metrics gaming). Some principles:

1. **Situated rather than objective.** Every finding explicitly states its standpoint — what framework produced it, what assumptions it depends on, where it can't see. The three-level confidence framework (measurement / interpretation / extrapolation) is a step toward this. Each level acknowledges the conditions under which the finding holds rather than presenting it as unconditional.

2. **Dialogical rather than monological.** The most important findings this session emerged from dialogue — the user pushing back on Jaccard, questioning confidence levels, raising the philosophical framing. This can't be replaced by a reviewer agent with a checklist. The framework needs to remain open to being interrupted by questions it didn't design for. Cross-model review (sending to Codex) is another form of dialogical engagement — different models may have different blind spots.

3. **Iterative rather than conclusive.** Each experiment produces better questions alongside provisional findings. "Decision deferred with clearer question" is a more valuable outcome than a premature decision. The spike lifecycle should accommodate this — not open → concluded but open → refined → refined → provisionally concluded → revisable.

4. **Pharmacological awareness.** Every method and tool is simultaneously enabling and constraining. The evaluation harness enables systematic comparison AND constitutes what "quality" means. The DESIGN.md enables rigorous planning AND pressures toward executing the plan rather than responding to anomalies. This awareness doesn't eliminate the constraint — it changes the relationship to it. You use the tool knowing it shapes what you can see.

5. **Traces over erasure.** When the framework adapts to something that exceeded it, the adaptation preserves the record of the excess — not just "we added feature X" but "we added feature X because Y exceeded what the framework could hold, and X still cannot hold Z." The history of inadequacies is as informative as the current capabilities.

6. **The review is dialogue, not judgment.** A "spike design reviewer" should not produce a pass/fail verdict. It should produce questions — "have you considered whether your sample size inflates agreement?" "what would falsify your interpretation, not just your measurement?" — and the researcher (human or agent) should engage with those questions, not just satisfy a checklist. This is closer to a dissertation committee than a peer review gate.

These principles don't resolve into a clean design. They're orientations — ways of holding the tension between the need for structure (without which nothing is systematic) and the need for openness (without which nothing is genuinely discovered). The question of how to operationalize them without domesticating them is the same Said/Saying question the deliberation has been circling.

## Recommendation

**Current leaning:** Start with thinner, easier-to-falsify spike hardening before assuming that more reviewer roles, new subsystems, or broad dialogical redesign are already justified.

- **First-pass changes most directly supported by the failure chain:** add one pre-execution design challenge step using existing checker/question-producing patterns; allow explicit spike outcomes such as `deferred`, `qualified-local`, or `follow-up-required`; and require final spike artifacts to separate measured result, interpretive confidence, and architectural implication.

- **Keep self-reflexive pressure lightweight at first:** if a template-level intervention is tried, it should be minimal — closer to one prompt such as "what happened here that this artifact could not hold?" than to a new mandatory reflection block. The point is to preserve a trace of mismatch without pretending the trace exhausts it.

- **Treat dedicated reviewer agents, reflexive signal conventions, and broader inquiry redesign as candidate second-step work:** they remain live possibilities, but the current evidence does not yet warrant treating them as the default answer. The signal field proves that current spike practice is insufficient; it does not yet prove that a wholly new reviewer layer or a framework-wide redesign is required.

- **Keep conversation and cross-perspective critique load-bearing:** the deepest interventions in this failure family came from sustained challenge, not from a designed mechanism. That should remain a standing caution against converting "dialogue matters" into premature apparatus expansion.

**Why this narrowing matters:** the strongest current claim is diagnostic, not architectural. Spike 003 and the cross-spike qualification work show a real weakness around inquiry quality, review timing, and closure pressure. They do not yet settle whether the right answer is template change, workflow change, operator-practice change, a campaign/program concept, or some interaction among them.

**What I'm less sure about:** Whether the problem is structural (the forms need changing) or interpretive (we need to be better readers of what our forms produce). Maybe the DECISION.md template is fine and the real issue is that agents — both AI and potentially human — treat template sections as obligations to fill rather than questions to engage with. If so, the intervention is about the *practice* of using templates, not the templates themselves. This uncertainty is not a blocker — it's constitutive of the problem. The relationship between structure and practice is itself chiasmatic: the structure shapes the practice, and the practice reveals the structure's limits.

**Open questions blocking conclusion:**

1. Is the template-pressure interpretation correct, or is it a projection? Would the same agent with the same evidence have produced the same premature decisions using a completely different template format? (Testable in principle: run a spike with a template that has no "Decision" section, only "What do you know?" and "What don't you know?")

2. Can an adversarial reviewer agent provide genuine critique, or will it converge on a checklist that catches yesterday's failures? Is there a way to design it that preserves the open-endedness of real critical thinking?

3. Is the right unit of self-reflexivity the individual artifact (margin annotations on each document), the workflow (review step between execution and synthesis), or the knowledge base (reflexive signals processed during reflection)?

4. What would it mean for the framework to be genuinely open to critique that exceeds its categories? Not as a designed feature but as a structural property — something about how the forms relate to each other and to what's outside them?

5. How should cross-spike epistemic interactions be tracked? When Spike 003 finds that Jaccard is insufficient, should there be an automatic mechanism that flags all findings in Spikes 001-002 that used Jaccard? Or is the manual review process (which we performed this session) the right approach because automated flagging would produce noise?

6. The philosophical frameworks informing this analysis (constitutive instruments, theory-ladenness, epistemic iteration, the relationship between forms and excess) — should these be formalized as part of the GSD Reflect methodology, or would formalizing them strip them of the critical force that makes them useful?

## Predictions

**If the thinner first-pass changes are tried, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | A pre-execution design challenge step will catch at least one sample-size, metric-scope, or evaluation-independence problem within its first 3 uses | First 3 spikes using the challenge step | Zero meaningful design corrections are produced |
| P2 | Allowing `deferred` / `qualified-local` outcomes and separating measured result from architectural implication will reduce unsupported architecture decisions in the next 3 spike conclusion artifacts | Next 3 comparable spike conclusions | Conclusion artifacts still state broad architecture decisions while their own qualifications undercut them |
| P3 | A minimal reflexive prompt will surface recurring friction points, but it will not eliminate the need for external challenge | After 5+ spike artifacts using the prompt | The prompt yields no recurring pattern at all, or it is treated as sufficient evidence that critique has been internalized |
| P4 | Some failures will still turn out to be scope-mismatch problems, keeping the campaign/program question open even after thin hardening is tried | After several multi-wave spikes | Thin hardening alone cleanly resolves the inquiry-shape problems without residual scope tension |

## Decision Record

**Decision:** Pending — this deliberation is open. Awaiting cross-model review (Codex/GPT-5.4) and further conversation.
**Signals addressed:** sig-2026-03-20-premature-spike-decisions, sig-2026-03-20-spike-experimental-design-rigor, sig-2026-03-20-jaccard-screening-methodology, sig-2026-03-19-spike-framework-scope-gap

## Notes for cross-model review

This deliberation was produced during a Claude Code session working on an arXiv research tool. The concrete evidence comes from a strategy profiling spike where the experimental methodology fell short in specific, documented ways. But the questions it raises — about how formal workflows handle their own limitations, about the relationship between templates and the conclusions they produce, about whether self-reflexivity can be designed into a system — are general.

For the reviewing model: the most useful critique would address the *framing* of the problem, not just the proposed solutions. Are we asking the right questions? Is the distinction between "forms that pressure closure" and "execution contexts that produce closure" the right axis? Are there failure modes of self-reflexive frameworks that this analysis doesn't see?

The evidence base and all referenced files are in the arxiv-sanity-mcp repository's `.planning/spikes/003-strategy-profiling/` directory.
