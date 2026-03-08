# Philosophical Deliberation: Ryle's Knowing-How and Knowing-That

**Tradition:** Ordinary Language Philosophy / Analytic Philosophy of Mind
**Key thinkers:** Gilbert Ryle (The Concept of Mind, 1949), Jason Stanley & Timothy Williamson ("Knowing How", 2001), Jeremy Fantl & Matthew McGrath (Knowledge in an Uncertain World, 2009)
**Created:** 2026-03-08
**Status:** Active

## Core Ideas

Ryle's *The Concept of Mind* (1949) is an extended argument against what he calls "the ghost in the machine" -- the Cartesian picture in which intelligent action requires a prior mental act of consulting a proposition, rule, or plan. The book's most consequential chapter, "Knowing How and Knowing That," draws a distinction that bears directly on whether a self-improving software system should aim to produce propositional lessons at all, or whether doing so is a category error.

### Knowing-How vs. Knowing-That

Ryle's central claim is that knowing-how (practical ability) is not reducible to knowing-that (propositional knowledge). The competent chess player does not first consult a set of propositions about chess strategy and then apply them to the board. The fluent speaker of French does not first retrieve grammatical rules and then construct sentences. Knowing how to ride a bicycle is not having a set of true propositions about balance, angular momentum, and steering correction. It is a capacity exercised in performance.

This is not the trivial observation that practice is different from theory. It is the stronger claim that practical knowledge is a *logically distinct kind* of knowledge, not a derivative or applied form of propositional knowledge. The competent practitioner may be unable to articulate the knowledge they exercise. But even when they can articulate it, the articulation is not the knowledge -- it is a secondary description of a primary ability.

Ryle motivates this with what is now called "the regress argument." Suppose, as the intellectualist claims, that intelligent action requires first knowing a proposition about how to act. Then applying that proposition is itself an act. If all intelligent acts require prior propositional knowledge, then the act of applying the proposition requires knowing a further proposition about how to apply it. And applying *that* proposition requires yet another. The regress is vicious: no action can ever begin, because an infinite series of propositional consultations must precede it. Therefore, the intellectualist premise is false. Some intelligent acts -- indeed, the most fundamental ones -- are exercises of ability, not applications of propositions.

### Dispositions and Intelligent Performance

For Ryle, intelligence is not a ghostly inner process that causes outward behavior. It is a *quality of behavior itself*. Calling someone's performance "intelligent" is commenting on *how* they act -- flexibly, attentively, responsively to feedback, adaptively to changing conditions -- not asserting that a prior mental act (consulting a rule, forming a plan) caused the behavior.

This has a specific logical form: dispositional rather than episodic. To say someone knows how to play chess is not to describe an episode (a moment of rule-consultation) but a disposition (a stable pattern of responding appropriately to chess positions). Dispositions are not reducible to any particular episode of their exercise. Knowing how to swim is not identical to any particular swim. It is the stable capacity that manifests across diverse swimming occasions.

Ryle is careful to distinguish "intelligent" from "habitual." A habit is a fixed pattern of response. Intelligent performance is *flexible* -- it adjusts to novel situations, corrects errors, takes advantage of opportunities. The habit of always opening with e4 in chess is not intelligent; intelligent opening play responds to the opponent, the tournament situation, and the player's preparation. Intelligence requires the ability to do things differently when the situation demands it.

### The Intellectualist Challenge (Stanley and Williamson)

The Ryle consensus held for roughly fifty years. In 2001, Jason Stanley and Timothy Williamson argued in "Knowing How" (*Journal of Philosophy*) that Ryle was wrong: knowing-how IS a species of knowing-that. Their argument is primarily linguistic. They observe that English ascriptions of knowing-how take the form of embedded questions: "Hannah knows how to ride a bicycle" has the same syntactic structure as "Hannah knows where the bicycle is." Embedded-question constructions uniformly denote propositional knowledge. Therefore, knowing-how ascriptions denote propositional knowledge.

Specifically, Stanley and Williamson propose: to know how to phi is to know, of some way w that is a way for one to phi, that w is a way for one to phi -- under a *practical mode of presentation*. The practical mode of presentation is the key concession: the proposition is entertained not theoretically but practically, in a way that is action-guiding. This allows Stanley and Williamson to explain why knowing-how is intimately connected to ability without abandoning the propositional framework.

The debate is live and unresolved. Subsequent contributions include Bengson and Moffett's *Knowing How: Essays on Knowledge, Mind, and Action* (2011), which collects arguments on both sides, and Pavese's work on practical representations. The intellectualist position has gained ground in analytic epistemology without achieving consensus. Fantl and McGrath's work on practical interests in knowledge further complicates the picture: even paradigmatic knowing-that is sensitive to practical stakes, blurring the boundary from the other direction.

This matters for GSD Reflect because the system's design implicitly takes a side. If the system produces propositional lessons as its primary output, it is betting on the intellectualist position: practical knowledge CAN be captured in propositions. If Ryle is right, this bet is a category error. The system would be producing knowing-that artifacts where knowing-how is needed.

### The Category Error

Ryle's broader argument against Cartesian dualism proceeds through the concept of a "category mistake" -- treating a concept that belongs to one logical type as though it belongs to another. The visitor who sees the colleges, libraries, and playing fields of Oxford and then asks "But where is the University?" is committing a category mistake: the University is not another institution alongside the colleges but the organization of them.

Applied to knowledge: if knowing-how is a different logical category from knowing-that, then asking "what proposition does this practical ability consist in?" is itself a category mistake. The ability does not consist in any proposition. It is exercised in performance, not stored in declarative form. The question is not "which proposition captures this ability?" but rather "is the propositional framework the right one for this kind of knowledge at all?"

## Relevance to GSD Reflect

GSD Reflect's signal-to-lesson pipeline is, under Ryle's analysis, an attempt to distill knowing-how into knowing-that. The system observes practical patterns (how phases went, where deviations occurred, what worked and what failed) and produces propositional lessons ("CI must be a blocking gate," "plans should sequence shared infrastructure modifications"). The question Ryle forces is whether these propositions *are* the practical knowledge, or whether the practical knowledge is something else that the propositions merely gesture toward.

**The regress argument applies directly to lesson application.** A lesson like "plans that modify shared infrastructure should be sequenced, not parallelized" is a proposition. Applying it requires judgment: *Is this plan modifying shared infrastructure? Is the overlap genuine or superficial? Is sequencing appropriate here, or does this case have features that make parallelization safe?* This judgment is itself knowing-how. If knowing-how requires knowing-that (per the intellectualist), then applying the lesson requires knowing further propositions about when the lesson applies, and applying those requires further propositions, ad infinitum. The regress suggests that at some point, the system (or the developer using it) must exercise practical judgment that is not itself propositional. Lessons cannot be self-applying.

**The disposition analysis reframes what the KB should store.** If practical knowledge is dispositional rather than episodic, then what the system accumulates through practice is not primarily a collection of propositions (lessons) but a set of dispositions (stable patterns of appropriate response). The system's "knowledge" of how to handle CI failures is not the lesson that says "CI failures should trigger signals" -- it is the accumulated behavioral pattern of detecting CI failures, surfacing them, and integrating them into planning. The lesson is at best a *description* of this disposition. Ryle would ask: does storing the description improve the disposition, or does it substitute description for ability?

**The intelligent-performance criterion challenges evaluation metrics.** Ryle's account of intelligence -- flexibility, responsiveness, error-correction, adaptation to novelty -- provides a richer standard for evaluating the system than artifact counting. A system that produces many lessons is not thereby intelligent. A system that applies lessons flexibly, adjusts when they do not fit, recognizes when a stored pattern is inappropriate, and adapts to novel situations IS displaying something like intelligent performance -- regardless of how many lessons it has stored.

**The Stanley/Williamson position offers a partial defense.** If knowing-how IS propositional under a practical mode of presentation, then lessons are not a category error -- they are propositions that, when entertained practically (in the context of planning and execution), constitute knowing-how. The key question becomes whether the system's lesson-surfacing mechanism provides the practical mode of presentation: does it surface the lesson *in a way that is action-guiding*, connected to the specific decision the developer is making? Or does it surface the lesson as an abstract proposition disconnected from the practical context? If Stanley and Williamson are right, the issue is not whether to produce propositions, but whether to produce them in a practically situated way.

**The honest displacement.** Ryle's examples are about individual human embodied abilities: riding bicycles, playing chess, speaking French. GSD Reflect's "knowing-how" is distributed across multiple loci: the LLM's training weights (which encode practical capacities for code generation, debugging, and planning), the accumulated signal history, the lesson KB, and the user's judgment. There is no single agent who "knows how" to run a good development phase. The knowing-how, if it exists, is distributed across a human-AI-system triad. Ryle's framework, built for individual human agents, does not straightforwardly accommodate distributed practical knowledge. This is a genuine limitation of the framework, not a problem with the system.

## Concept Mapping

| Framework Concept | GSD Reflect Analog | Current State | Praxis Implication |
|---|---|---|---|
| **Knowing-that** | Propositional lessons in the KB (`~/.gsd/knowledge/lessons/`) | 0 formal lessons despite 124 signals. The pipeline aims to produce propositions but has not succeeded. | The failure to produce lessons may not be purely a pipeline problem. It may reflect the genuine difficulty of propositionalizing practical knowledge. Consider whether propositional lessons are the right target. |
| **Knowing-how** | The practical ability to run good development phases, handle deviations, triage signals, and apply judgment about when rules apply | Distributed across developer judgment, LLM capabilities, and accumulated system state. Not captured in any single artifact. | Design the system to *support the exercise of knowing-how* (presenting relevant cases, surfacing context) rather than to *replace it with knowing-that* (propositional lessons). |
| **Intelligent performance** | Flexible, responsive signal triage and lesson application -- adjusting recommendations to context rather than applying them mechanically | Not implemented. Lesson surfacing (when it exists) does not adapt to context. Signal triage applies fixed severity heuristics regardless of project state. | Intelligence is in the *manner* of application, not in the quantity of stored propositions. A system with 5 well-applied lessons is more intelligent than one with 50 mechanically surfaced ones. Invest in contextual application, not lesson volume. |
| **Ryle's regress** | The infinite regress of application rules: applying a lesson requires judgment about when it applies, which would require another lesson, ad infinitum | Not addressed. Lessons are produced as context-free propositions with `when_this_applies` fields that are themselves propositions requiring interpretive judgment. | Accept that lesson application bottoms out in unformalized judgment. Make this explicit: every lesson should acknowledge the judgment required to apply it, rather than presenting itself as a self-applying rule. |
| **Dispositions** | The system's accumulated behavioral patterns -- how it characteristically handles CI failures, plans phases, triages signals -- across many development cycles | Embryonic. Accumulated signals form a dispositional record, but the system has no way to recognize or leverage its own behavioral patterns. | Track dispositional patterns across milestones: does the system characteristically over-plan? Under-test? Ignore CI? These patterns are the system's *hexis* (connecting to aristotle/hexis) and are more revealing than any individual lesson. |
| **Category mistake** | Treating the practical ability to develop software well as though it consists in a set of stored propositions (lessons) | The entire signal-to-lesson pipeline assumes that practical knowledge can be captured propositionally. This assumption is unexamined. | Examine the assumption. Not all practical knowledge resists propositionalization, but some does. The system should distinguish between knowledge that *can* be usefully stated as a proposition and knowledge that is better conveyed through cases, examples, or contextual prompts. |
| **Practical mode of presentation** | Surfacing lessons *in context* -- during the specific planning decision where they apply -- rather than as abstract recommendations | Not implemented. Lesson surfacing is keyword-based, not decision-context-based. | If Stanley/Williamson are right, the practical mode of presentation IS what makes a proposition into practical knowledge. Invest in contextual surfacing: present the lesson at the moment of decision, connected to the specific choice being made. |

## Concrete Examples

### Example 1: The Regress in Lesson Application

Consider the lesson that would emerge from the v1.16 CI failure pattern: "CI failures should not be bypassed via admin push without investigation."

This lesson is a proposition (knowing-that). To apply it, the developer needs to exercise knowing-how:

1. **Recognizing the situation.** Is this a CI failure that is being bypassed? Or is this a legitimate use of admin push (e.g., during a migration, a CI infrastructure outage, or a deliberate test exclusion)? The lesson says "should not be bypassed without investigation," but recognizing what counts as "investigation" and what counts as "bypass" requires judgment.

2. **Judging whether investigation is warranted.** The CI failure might be a known environment issue, a flaky test, or a genuine code defect. Knowing which requires practical familiarity with the test suite, the CI environment, and the recent development history. No proposition captures this judgment.

3. **Deciding what investigation looks like.** Should the developer read the CI logs, re-run the tests locally, check whether the failure is pre-existing, or review the test for relevance? Each of these is a practical skill, and the right choice depends on context.

At each step, the developer exercises knowing-how that cannot be captured in a further lesson without triggering the same regress. A system that tried to produce lessons for each step ("when to investigate CI failures," "how to determine if a CI failure is environmental," "which investigation steps to take for different failure types") would produce an unmanageable volume of increasingly specific propositions, each of which would still require judgment to apply.

The Rylean design response: instead of producing a propositional lesson, produce a *situated case*. Surface the v1.16 CI failure history -- what happened, what was bypassed, what the consequences were -- at the moment when the developer is considering a similar bypass. The case does not tell the developer what to do. It provides the subsidiary context (connecting to polanyi/subsidiary-provision) that supports the developer's own exercise of judgment. The developer sees a prior instance of the pattern they are about to repeat and decides for themselves whether the parallel holds.

### Example 2: The LLM's Knowing-How

The LLM that powers GSD Reflect has something that, functionally, resembles knowing-how. It can write code, debug errors, plan development phases, and generate coherent prose -- without consulting explicit propositions about how to do these things. Its training weights encode patterns that are deployed without full articulation. In Ryle's terms, the LLM displays intelligent performance: its outputs are flexible, responsive to context, and adaptive to novel inputs.

But there is a crucial disanalogy. Ryle's knowing-how is *normatively constrained*: the intelligent practitioner not only performs but performs *well*, and they can recognize and correct poor performance. The chess player who makes a bad move knows it was bad and adjusts. The LLM generates outputs that may or may not be good, and it has no independent capacity to evaluate them. Its "flexibility" is pattern-matching, not responsive correction in Ryle's sense.

This matters for the system's design. If the LLM has functional knowing-how, then the system's role is not to provide the LLM with propositional knowledge (which would be the intellectualist picture) but to create conditions under which the LLM's practical abilities are exercised well: good context, relevant prior cases, clear constraints, and human oversight for normative evaluation. The lesson KB, on this view, is less a repository of knowledge FOR the LLM than a mechanism for enriching the CONTEXT in which the LLM exercises its existing abilities.

If the LLM lacks genuine knowing-how (because its pattern-matching is not normatively self-correcting), then the system's role is different: it must supply the normative evaluation that the LLM cannot perform on itself. This is closer to the intellectualist picture, where explicit propositions (lessons, rules, checklists) constrain behavior that would otherwise lack normative direction.

The design can accommodate both views: surface lessons as contextual constraints (intellectualist), and present prior cases as occasions for the exercise of practical ability (Rylean). The system need not resolve the philosophical debate to build features that respect both possibilities.

### Example 3: Hedging the Debate in Output Design

The current deliberation asks what GSD Reflect's reflection pipeline should *produce*. The Ryle/Stanley-Williamson debate maps directly onto this design choice:

**Pure intellectualist output:** Propositional lessons with confidence scores, scope conditions, and application rules. This is the current design target. It assumes practical knowledge can be fully propositionalized.

**Pure Rylean output:** No propositions at all. Instead, curated collections of prior cases (signal clusters with outcomes), pattern visualizations, and contextual prompts that present relevant history without stating rules. This assumes practical knowledge must be exercised, not stated.

**Hedged output (recommended):** A layered structure that provides both:
- **Layer 1 (Rylean): Situated cases.** The specific signal clusters, with full context: what happened, what was tried, what worked, what failed. These are the "from" in Polanyi's from-to structure (connecting to polanyi/from-to-structure) -- subsidiary particulars that support focal integration by the developer.
- **Layer 2 (Intellectualist): Propositional abstractions.** Generalizations drawn from the cases: "CI failures that are bypassed for more than 3 consecutive pushes tend to indicate environmental issues rather than code defects." These are propositions that may or may not capture the practical knowledge. They are offered as hypotheses, not verdicts.
- **Layer 3 (Meta): Application notes.** Explicit acknowledgment of the judgment required to apply the proposition: "Applying this principle requires assessing whether the current CI failure is environmental or code-related, which depends on familiarity with the test suite and recent changes."

This layered output hedges the debate: it provides propositional abstractions for those who find them useful (Stanley/Williamson) while also providing the situated cases that Ryle's framework demands. It explicitly flags the regress problem by noting the judgment each proposition requires to apply.

## Tensions and Limitations

### 1. The Stanley/Williamson Debate Is Unresolved

The Rylean position cannot be simply asserted as correct. Stanley and Williamson's linguistic arguments are technically sophisticated, and the intellectualist position has significant support in contemporary analytic epistemology. Building the system entirely on Ryle's framework risks being refuted by the best available epistemology. Conversely, building it entirely on the intellectualist framework risks the category error Ryle identified.

**Mitigation:** Design for both. The hedged output model (Layer 1 + Layer 2 + Layer 3) does not require resolving the debate. It provides propositional lessons (intellectualist-compatible) alongside situated cases (Ryle-compatible). The system does not need to know whether knowing-how is propositional to produce outputs that serve practitioners regardless.

### 2. Ryle's Examples Are Individual and Embodied

Ryle's knowing-how examples -- riding bicycles, playing chess, speaking French -- are about individual human agents exercising embodied abilities. GSD Reflect's "knowing-how" is distributed across the LLM's training, the user's judgment, the accumulated system state, and the tool architecture. There is no single agent who "knows how" to develop software well. Ryle's framework does not address distributed practical knowledge, collective knowing-how, or the question of whether a human-AI system can jointly possess practical abilities that neither possesses alone.

**Mitigation:** Acknowledge the displacement explicitly. Use Ryle's framework for what it illuminates -- the regress of application rules, the limits of propositionalization, the distinction between intelligent and habitual performance -- without claiming that the system is a Rylean agent. The framework is diagnostic (it reveals category errors in the current design) rather than constructive (it does not tell us how to build a distributed knowing-how system).

### 3. The Partial Propositionalization Problem

Even if Ryle is right that knowing-how is not fully reducible to knowing-that, most practical knowledge may be *partially* propositional. The chess grandmaster cannot fully articulate their ability, but they can state many useful propositions about chess ("control the center," "develop pieces before attacking," "knight outposts on the sixth rank are strong"). These propositions do not constitute the ability, but they are not useless either. They are starting points, heuristics, partial articulations that support the development and exercise of the ability.

This suggests that the strong Rylean position (propositions are categorically wrong outputs) and the strong intellectualist position (propositions fully capture practical knowledge) are both too extreme. Most practical knowledge is a *mixture*: some aspects are propositionalizeable and benefit from articulation; others resist articulation and are best conveyed through cases, examples, and practice.

**Mitigation:** The system should aim for partial propositionalization -- extracting what CAN be usefully stated while acknowledging what cannot. Each lesson should be flagged with a "propositionalization confidence": high for clear procedural rules ("always run tests before pushing"), low for judgment-dependent patterns ("CI failures that persist for multiple phases usually indicate environmental issues"). Low-confidence propositions should be accompanied by cases rather than standing alone.

### 4. The LLM's Epistemic Status

The LLM complicates every aspect of the knowing-how/knowing-that debate. It produces outputs that display flexibility, context-sensitivity, and error-correction -- hallmarks of Ryle's intelligent performance. Yet it has no understanding, no normative self-evaluation, and no genuine stake in the outcomes. Whether it "knows how" to write code depends entirely on what "knowing how" means, which is precisely what Ryle and Stanley/Williamson disagree about.

The system design should not depend on resolving this question. Whether the LLM has knowing-how or merely simulates it, the practical question is the same: does providing it with propositional lessons improve its outputs? If so, the intellectualist picture is pragmatically vindicated for this use case. Does providing it with rich prior cases improve its outputs? If so, the Rylean picture is pragmatically vindicated. Both may be true simultaneously.

**Mitigation:** Treat the LLM's epistemic status as an empirical question rather than a philosophical one. Test both interventions (propositional lessons and situated cases) and track which produces better outcomes. This is not philosophically satisfying, but it is pragmatically sufficient (connecting to pragmatism/cash-value).

## Praxis Recommendations

1. **Produce layered outputs that hedge the knowing-how/knowing-that debate.** The reflection pipeline should produce both situated cases (signal clusters with full context and outcomes) and propositional abstractions (generalized lessons). Neither alone is sufficient. The cases cover Rylean ground by providing occasions for the exercise of practical judgment. The propositions cover intellectualist ground by stating actionable rules. The combination provides value regardless of which epistemological position is correct. *Cite: ryle/hedged-output, ryle/knowing-how-irreducibility.*

2. **Make the regress of application explicit in every lesson.** Each propositional lesson should include an "application judgment" field that acknowledges the knowing-how required to apply it. "This lesson applies when X, but determining whether X obtains requires familiarity with Y and Z." This transparency prevents the illusion that lessons are self-applying rules, which is the core of Ryle's regress argument. *Cite: ryle/regress-argument, ryle/intelligent-performance.*

3. **Evaluate system intelligence by manner of performance, not by lesson volume.** A system with many lessons mechanically applied is displaying habit, not intelligence. A system with few lessons flexibly applied is displaying intelligence. Track contextual appropriateness of lesson application (was the right lesson surfaced at the right moment?) rather than raw counts (how many lessons were surfaced?). *Cite: ryle/intelligent-performance, ryle/disposition-not-event.*

4. **Surface prior cases at decision points to support practical judgment.** When the developer faces a decision that resembles a prior situation (similar signal pattern, similar plan structure, similar deviation type), surface the prior case -- not as a rule to follow, but as an instance to consider. This supports the exercise of knowing-how without requiring that the knowing-how be articulated as knowing-that. The cases are subsidiaries for focal integration (connecting to polanyi/from-to-structure). *Cite: ryle/knowing-how-irreducibility, ryle/hedged-output.*

5. **Track dispositional patterns across milestones, not just individual lessons.** The system's practical knowledge is dispositional: it is the stable pattern of how phases are run, how signals are handled, how deviations are addressed. These patterns matter more than any individual proposition. Track whether the system's behavior improves over time (fewer deviations, faster resolution, better signal triage) as a measure of accumulated knowing-how, independent of how many propositional lessons the KB contains. *Cite: ryle/disposition-not-event, aristotle/hexis.*

6. **Test whether propositional lessons actually improve performance (empirical resolution).** The Ryle/Stanley-Williamson debate can be partially resolved empirically for GSD Reflect's purposes. Track whether phases that reference surfaced lessons have better outcomes than phases that do not. If propositional lessons improve outcomes, the intellectualist position is pragmatically vindicated. If situated cases improve outcomes but propositional lessons do not, the Rylean position gains support. Let the system's own practice adjudicate the philosophical question it cannot resolve theoretically. *Cite: ryle/intellectualist-challenge, pragmatism/cash-value.*

## Citable Principles

- **ryle/knowing-how-irreducibility**: Practical ability is not reducible to propositional knowledge. Intelligent performance is not preceded by theoretical acts of rule-consultation. A system that produces only propositional lessons may be producing the wrong kind of output for practical knowledge. This does not mean propositions are useless, but they may be insufficient -- they describe abilities without constituting them.

- **ryle/regress-argument**: If knowing-how required prior knowing-that (knowing the rule to apply), then applying the rule would itself require knowing-how, generating an infinite regress. This means lessons cannot be self-applying: every propositional rule requires unformalized judgment to apply, and that judgment cannot be captured in another rule without triggering the same regress. System design must acknowledge and plan for the judgment gap.

- **ryle/intelligent-performance**: Intelligence is displayed in the manner of performance -- flexibility, responsiveness to context, error-correction, adaptation to novelty -- not in the quantity of stored propositions. A system's intelligence should be evaluated by how appropriately it applies what it knows, not by how much it has stored. Mechanical application of many rules is habit, not intelligence.

- **ryle/disposition-not-event**: Practical knowledge is a disposition (a stable pattern of appropriate response across diverse situations), not an episodic mental event (a moment of rule-consultation). The system's knowing-how, to the extent it exists, is distributed across its accumulated behavioral patterns, not located in any individual lesson. Track dispositional patterns, not just propositional inventory.

- **ryle/intellectualist-challenge**: Stanley and Williamson argue that knowing-how IS a species of knowing-that, under a practical mode of presentation. The debate is live in analytic epistemology and unresolved. If the intellectualist position is correct, propositional lessons CAN capture practical knowledge -- but only when entertained practically (in context, connected to specific decisions). Context of presentation matters as much as propositional content.

- **ryle/hedged-output**: The system can hedge the Ryle/Stanley-Williamson debate by producing both situated cases (Rylean: occasions for the exercise of practical judgment) and propositional abstractions (intellectualist: action-guiding propositions). This layered output model serves practitioners regardless of which epistemological position is correct, and avoids committing the system to a philosophical position it cannot resolve.

---

*This deliberation should be referenced when: deciding what the reflection pipeline should produce (propositional lessons vs. situated cases vs. both); evaluating whether lesson volume is a meaningful metric; designing lesson-surfacing mechanisms (keyword-based vs. decision-context-based); assessing the LLM's epistemic status and what kind of input improves its performance; considering the fundamental limits of propositional knowledge in practical domains.*
