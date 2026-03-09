# Deliberation: Deliberative Council & Epistemic Framework for AI-Assisted Design

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation -> problematization -> hypothesis -> test -> warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open -> concluded -> adopted -> evaluated -> superseded
-->

**Date:** 2026-03-08
**Status:** Open
**Trigger:** During deliberation on reflection output ontology, user proposed a council of agents for structured deliberation — specialized agents (software engineer, AI researcher, domain philosophers) backed by MCP servers for retrieving relevant papers and texts. This expanded into questions about the epistemic status of AI research, how to adopt empirical findings given the instability of the field, and what philosophical frameworks help navigate these issues.
**Affects:** M-C (Deliberation Intelligence) scope, next milestone design, council architecture, knowledge surfacing pipeline, agent spec design
**Related:**
- .planning/deliberations/reflection-output-ontology.md (active — council proposal emerged from this deliberation)
- .planning/deliberations/v1.17-plus-roadmap-deliberation.md (M-C scope will need revision)
- .planning/deliberations/deliberation-system-design.md (existing deliberation system design)
- philosophy: sellars-brandom/deontic-scorekeeping — multi-agent accountability model
- philosophy: gadamer/fusion-of-horizons — productive encounter between perspectives
- philosophy: habermas/colonization — power dynamics between agent perspectives
- philosophy: peirce/community-of-inquiry — truth as convergence across investigators
- philosophy: cartwright/scope-conditions — capacity claims and nomological machines
- philosophy: polanyi/from-to-structure — council as subsidiary for developer's focal judgment

## Situation

### The Proposal

During the reflection output ontology deliberation, the user proposed that future deliberations (possibly starting with the next milestone) should be conducted by a **council of agents**, each with explicit domain expertise:

- A **software engineering** agent with deep technical knowledge and practical constraints
- An **AI researcher** agent with access to current literature and empirical findings
- **Philosophy** agents with expertise in relevant traditions (epistemology, philosophy of technology, philosophy of mind, philosophy of science)
- Potentially other domain specialists as needed

Each agent would eventually be supplemented by **MCP servers** for retrieving relevant papers, texts, and guides. The council might also include a **mediator** agent guided by philosophies of dialogue and intersubjective communication.

### The Motivation

The current deliberation process (a single conversation between user and Claude) produces genuinely rich philosophical-technical thinking — the reflection output ontology deliberation demonstrates this. But it has limitations:

1. **No persistent expertise**: Each session starts from scratch on domain knowledge. The philosophy files help, but they're static reference, not active intellectual engagement.
2. **No adversarial pressure**: A single interlocutor tends toward consensus. Genuine deliberation requires perspectives that resist each other — the engineer who says "technically infeasible" challenged by the philosopher who asks "is that a real constraint or a failure of imagination?"
3. **No epistemic diversity**: Technical, philosophical, and empirical perspectives need to be held in *tension*, not translated into a single framework. Translation strips out what makes each perspective distinctive.
4. **No systematic access to literature**: AI research, philosophical texts, and technical documentation could be retrieved and evaluated in real-time through MCP servers, rather than relying on training data.

### The Deeper Epistemic Question

The user raised a critical issue about **how to navigate AI research claims**:

- AI research varies in quality, and as a body of knowledge becomes more unstable as complexity increases
- The epistemic processes that produce papers (incentive structures, compute inequality, publication bias) shape the knowledge they contain
- Findings may not transfer across scales, architectures, or contexts
- The field may be pre-paradigmatic (Kuhn) — no consensus on fundamentals
- The question of whether AI research constitutes a "science" in any robust sense remains open

This is not just a practical question about literature review — it's an epistemological question about what kind of knowledge the council's AI researcher agent would bring, and under what qualifications.

## Key Tensions Explored

### 1. The Council as Resolution vs. The Council as Tension-Holder

Two models:

**(a) Resolution model:** The council deliberates and produces a verdict — a recommendation that the developer adopts. This is the Habermasian model: discourse produces consensus through the force of the better argument.

**(b) Tension-holding model:** The council deliberates and produces a *map of tensions* — showing where perspectives agree, where they genuinely conflict, and what's at stake in each conflict. The developer integrates this map through tacit judgment (Polanyi). The council is the subsidiary; the developer's judgment is the focal.

The user's emphasis on "bringing into tension with technical constraints" rather than "translating philosophical concerns into technical language" suggests model (b). Translation is reductive — it strips what makes each perspective distinctive. Tension is productive — it preserves disagreement as information.

**Connection to Polanyi/Sellars-Brandom tension:** If the council produces explicit inferential recommendations (Sellars-Brandom), it risks pre-structuring the developer's perception in ways that distort judgment. If it produces only raw case material (Polanyi), it may be unusable without enormous interpretive effort. The tension-holding model might be a third option: structured enough to navigate, open enough to leave integration to the developer.

### 2. Mediator Design

Four models for the mediator role were explored:

1. **Habermasian discourse ethics**: Mediator enforces procedural fairness — all claims contestable, no appeal to authority, power asymmetries surfaced. Mediator is a *procedure*, not a perspective.

2. **Socratic elenchus**: Mediator's role is elicitation — exposing hidden assumptions, contradictions, and unexamined commitments. No substantive position; only a method.

3. **Hegelian dialectics**: No mediator — the contradiction itself is productive. Thesis and antithesis produce synthesis through internal logic. The "mediator" is the dialectical process.

4. **Deweyan inquiry**: Mediator frames the *problematic situation* — not the answer but the question. Prevents premature closure without adjudicating.

A **Socratic-Deweyan composition** was sketched (frames the problem, then elicits contradictions in proposed solutions) but recognized as potentially too tidy — it doesn't account for power dynamics between agents. If the engineer has privileged access to "what's technically feasible," it can shut down philosophical challenges by appeal to implementation constraints (Habermas's colonization of the lifeworld by instrumental reason).

### 3. The Epistemic Status of AI Research

AI research has distinctive epistemic features that require philosophical navigation:

**Benchmarking as a style of reasoning (Hacking):** The dominant justification mode ("method X achieves SOTA on benchmark Y") is a historically specific style that defines what counts as evidence. It produces knowledge that something works, not why it works or when it will fail.

**Findings as capacity claims (Cartwright):** Every benchmark result is true within a specific nomological machine (dataset, architecture, hyperparameters, compute). Outside that machine, findings are capacities — tendencies that may or may not manifest. Scope conditions are almost never specified in papers.

**Pre-paradigmatic instability (Kuhn):** No unified theory of learning, understanding, or intelligence. Multiple competing frameworks with limited inter-translation. Findings carry less weight than in normal science because there's no shared paradigm to give them meaning.

**Programme trajectory (Lakatos):** Are scaling laws a progressive programme (novel predictions corroborated) or degenerating (auxiliary hypotheses — data quality, RLHF, instruction tuning — increasingly needed to explain why raw scaling doesn't deliver)?

**Industry capture (Longino/social epistemology):** Research produced under commercial incentives has compromised epistemic integrity. Publication bias, compute inequality, and career incentives shape what gets accepted as knowledge. Evaluate the *community* that produced the finding, not just the finding.

**Complexity-instability (Ashby/Cartwright):** As AI systems scale, emergent behaviors invalidate smaller-scale findings. The knowledge base is not cumulative (older findings remain valid) but contextual (findings are valid within their technological era). Scope conditions include the technological context, which shifts rapidly.

**Replication through multiple lenses:**
- Popper: unreplicable findings haven't survived severe testing
- Lakatos: replication failures signal programme degeneration or anomaly absorption
- Cartwright: replication failures are expected if scope conditions differ
- Kuhn: cross-paradigm comparison is incommensurable

### 4. Translation vs. Tension (The Meta-Methodological Question)

The user explicitly resisted the common move of "translating" philosophical insights into engineering requirements. Translation strips out what makes philosophy interesting — the distinctions, the tensions, the challenges to engineering assumptions.

The alternative: **holding philosophical and technical perspectives in tension**. This means:

- The philosopher says "this finding is a capacity claim with scope conditions X" and the engineer says "we need to use it anyway because no alternative exists" — and both are right. The tension is managed, not resolved.
- The AI researcher says "this technique improves performance by 15%" and the philosopher asks "does the benchmark measure what you think it measures?" — and the answer might be "no, but it's the best proxy." The tension persists.
- The philosopher of technology says "adopting this risks proletarianization" and the engineer says "but outcomes genuinely improve" — and the question becomes "adopt with what safeguards?" not "adopt or don't adopt."

This connects to the broader Polanyi insight: the developer's tacit integration of tensions IS the practical wisdom. The council provides material for integration; the developer provides the integration itself.

### 5. Can AI Agents Engage with Philosophy Honestly?

A lurking meta-question: what does it mean for an LLM to "channel" Longino or Kuhn? The Dennettian answer (intentional stance: treat it as if it understands, judge by outcomes) is available but may be too easy. If the agent's "Longino" is a compressed caricature, is that better or worse than no Longino at all?

The user's framing ("certain qualifications of 'findings'") suggests awareness that AI agents engaging with philosophy requires careful epistemic hygiene — neither dismissing the attempt as impossible nor accepting it uncritically.

This question itself deserves deliberation, potentially as part of the council's self-reflective capacity.

## Philosophers Needed for Corpus

The existing philosophy corpus (21 frameworks) covers much of the needed ground. Gaps identified:

| Thinker | Why Needed | Priority |
|---------|-----------|----------|
| **Kuhn** (paradigms, normal science, pre-paradigmatic fields) | Essential for characterizing AI research maturity and evaluating the weight of its findings | High |
| **Longino** (social epistemology, contextual empiricism) | Essential for evaluating the community/institutional context of AI research production | High |
| **Hacking** (styles of scientific reasoning, experimental realism) | Needed for characterizing benchmarking as a historically specific style; experiments create phenomena | Medium |
| **Feyerabend** (Against Method, methodological pluralism) | Descriptive of AI research's actual methodology; less prescriptive utility | Low |

## Connection to Existing Deliberations

### Reflection Output Ontology

The council proposal emerged FROM the reflection output ontology deliberation and should be understood as continuous with it. Key connections:

- The **Millikan-Dewey antinomy** (consumer-first vs. situation-driven inquiry) applies to the council itself: who consumes council output?
- The **Polanyi/Sellars-Brandom tension** (subsidiary vs. inferential) shapes whether the council produces structured recommendations or rich case material
- The council might BE the mechanism through which reflection output gains content — the council is the consumer that Millikan says is needed

### v1.17+ Roadmap (M-C Revision)

M-C was originally scoped as "Deliberation & Conversation Intelligence" — formalize deliberation capture, extract decisions from session logs, link deliberations to requirements. The council proposal significantly expands M-C's scope:

- From "capture deliberations" to "conduct deliberations with multi-agent perspectives"
- From "extract decisions" to "produce tension maps and epistemic evaluations"
- From "search past deliberations" to "retrieve and evaluate external literature (papers, texts) through MCP servers"

The v1.17+ roadmap deliberation should be updated to reflect this expanded scope. M-C may need to be split:
- M-C1: Deliberation infrastructure (capture, index, search — the original scope)
- M-C2: Deliberative council (multi-agent, MCP-backed, philosophically structured — the new scope)

Or M-C2 might become its own milestone entirely.

## Open Questions

| Question | Why It Matters | Status |
|----------|---------------|--------|
| Should the council produce verdicts or tension maps? | Determines output ontology of the entire system | Explored, leaning toward tension maps |
| What mediator model works? | Procedural (Habermas) vs. elicitative (Socratic) vs. dialectical (Hegel) vs. pragmatic (Dewey) | Four options sketched, composition explored |
| How does the AI researcher agent qualify its claims? | Determines epistemic integrity of empirical input | Framework identified (Cartwright + Lakatos + Longino), not yet operationalized |
| Can AI agents engage with philosophy honestly? | Meta-question about the entire enterprise | Raised, not yet deliberated |
| Does the council replace or supplement human deliberation? | Stiegler's proletarianization risk at the meta level | Raised, not yet resolved |
| What MCP servers are needed? | Semantic Scholar, arXiv, PhilPapers, philosophy text retrieval | Not yet researched |
| How do we handle findings that decay as AI context shifts? | Temporal scope conditions on all empirical claims | Cartwrightian approach sketched |
| Should the council be synchronous (agents debating in real-time) or asynchronous (agents producing position papers)? | Architectural decision with philosophical implications | Not yet explored |
| How does this connect to the existing signal/reflection pipeline? | Council could be the "consumer" that Millikan says signals need | Connection identified, not yet designed |

## Design Space (Preliminary)

Not yet formalized with Toulmin structure. Three positions were sketched during the reflection output ontology deliberation:

### Position A: Advisory Council
Agents produce independent position papers. Developer reads and integrates. No inter-agent dialogue. Simple to implement; loses the productive tension between perspectives.

### Position B: Structured Debate
Agents engage in structured dialogue (possibly Habermasian procedural rules). Mediator manages turn-taking and ensures all perspectives are heard. Richer output; more complex to implement; risk of performative dialogue that appears rigorous but isn't.

### Position C: Dialectical Encounter
No fixed roles. Agents respond to each other's claims with challenges, counter-evidence, and alternative framings. The process is generative — new ideas emerge from the collision. Most philosophically ambitious; hardest to control; highest potential for genuine insight.

**Not yet decided.** These need Toulmin formalization and the user's input before any design commits.

## Predictions

**PENDING — to be recorded before implementation per Lakatos.**

## Decision Record

**PENDING**

## Evaluation

<!-- Filled when status moves to evaluated -->

## Supersession

<!-- Filled when status moves to superseded -->

---

*This deliberation was created 2026-03-08 from a philosophical conversation during the reflection output ontology deliberation. It captures the user's proposal for a multi-agent deliberative council, the epistemic framework needed for evaluating AI research claims, and the philosophical tensions that should inform the design. It should be cross-referenced with the reflection output ontology and v1.17+ roadmap deliberations.*
