# Philosophical Deliberation: Polanyi's Tacit Knowledge

**Tradition:** Personal Knowledge / Philosophy of Science
**Key thinkers:** Michael Polanyi (Personal Knowledge, 1958; The Tacit Dimension, 1966), Andy Clark & David Chalmers ("The Extended Mind", 1998), Harry Collins (Tacit and Explicit Knowledge, 2010)
**Created:** 2026-03-08
**Status:** Active

## Core Ideas

Michael Polanyi's philosophy of personal knowledge, developed across *Personal Knowledge* (1958) and *The Tacit Dimension* (1966), begins with a deceptively simple observation: "We know more than we can tell." We can recognize a face in a crowd of a thousand without being able to specify the features that made it recognizable. We can ride a bicycle without being able to articulate the physics of balance. We can diagnose a patient's condition from a constellation of symptoms without being able to list the inferential chain that led to the diagnosis. This is not a contingent limitation -- not inarticulate knowledge waiting to be made explicit with enough patience or precision. It is knowledge that is *structurally resistant* to full articulation. The structure of tacit knowing is such that making it fully explicit would destroy it.

### The From-To Structure

Tacit knowing is not formless. It has a definite structure that Polanyi calls "from-to" awareness. In any act of knowing, we attend *from* subsidiary particulars *to* a focal whole. The physician attends from individual symptoms (skin color, heart rate, pupil dilation, verbal reports) to a diagnosis. The pianist attends from finger positions, key resistance, and pedal timing to the music. The reader attends from individual letters and words to the meaning of a sentence.

The critical insight is that the subsidiary particulars function only *as subsidiaries*. If we shift our focal attention to a subsidiary -- if the pianist starts thinking about individual finger movements, if the reader stares at individual letters -- the focal whole disintegrates. The pianist stumbles; the reader loses the sentence's meaning. This is not a failure of concentration but a structural feature of how tacit knowing works. The subsidiaries must remain subsidiarily attended to in order to perform their integrative function. Making them focal -- which is what articulation or explicitation does -- disrupts the integration they support.

Polanyi draws an analogy to stereoscopic vision. Each eye provides a flat image (subsidiary). When we attend through both images to the scene, we perceive depth (focal whole). If we attend to one eye's image directly, the depth perception collapses. The subsidiary contributions cannot be summed to produce the focal whole; the whole emerges from the integrated attending-through that constitutes tacit knowing.

### The Body as Ultimate Instrument

For Polanyi, the body occupies a unique epistemic position. It is the primary instrument through which we know the world. We do not perceive our body as an object (most of the time); we perceive *through* our body to the world. The hand does not feel itself; it feels the surface it touches. The eye does not see itself; it sees the scene before it. The body is subsidiarily attended to -- attended from, not attended to.

This is the ground of tacit knowing. Because we dwell in our bodies, using them to attend to the world without attending to them, we have a primitive and irreducible form of knowing that cannot be fully articulated. Articulation requires making something focal, but the body-as-instrument functions precisely by remaining subsidiary. To fully articulate bodily knowing would require making the body an object of focal attention, which would destroy its function as an instrument of knowing.

The absence of a body is therefore not a minor implementation detail for an AI system. It is the absence of the *ground* of tacit knowing in Polanyi's framework. A system without a body lacks the primary instrument through which tacit knowledge is acquired and exercised. Whether functional analogues can substitute -- whether the LLM's training weights are a "body" in some extended sense -- is a question Polanyi's framework raises but cannot answer.

### Indwelling and Tool Transparency

Polanyi extends the body-as-instrument analysis to tools. When a blind person uses a cane, they do not feel the cane in their hand (or rather, they attend from the cane-in-hand to what the cane contacts). The cane becomes an extension of the body -- an instrument dwelt in. The surgeon's probe, the carpenter's hammer, the cyclist's bicycle: in skilled use, all of these become transparent. The user attends *through* the tool to the world, not *at* the tool.

Polanyi calls this "indwelling": we extend our bodily awareness into the tool, incorporating it into our subsidiary framework. The tool becomes part of the "from" through which we attend to the "to." Indwelling is not metaphorical. It describes a real change in the structure of awareness: the tool ceases to be an object of focal attention and becomes a medium of perception.

The transparency of skilled tool use has a direct corollary: a tool that *demands* focal attention is a tool that has not been mastered, or a tool that is poorly designed. The beginner cyclist attends to the handlebars, the pedals, the balance point. The experienced cyclist attends through the bicycle to the road, the traffic, the route. The ideal tool is one that disappears from awareness in use.

This provides a design criterion for GSD Reflect: the ideal system is one the developer attends *through* to their project, not *at*. Currently, the system demands focal attention for its own outputs -- reports must be read, signals must be triaged, lessons must be evaluated. Each of these demands pulls the developer's attention from their project (the "to") to the system (the "from"). A system designed for indwelling would surface its knowledge subsidiarily: contextual prompts during decisions, relevant prior cases alongside current code, signal patterns visible at the periphery of the development experience rather than foregrounded in dedicated reports.

### The Paradox of Explicitation

Polanyi's framework generates a genuine paradox for any system that aims to make knowledge explicit. If tacit knowledge is structurally resistant to articulation -- if making it explicit destroys the integration that constitutes it -- then a system whose purpose is to distill tacit knowledge into explicit lessons is engaged in a self-defeating project. Each successful articulation destroys some of the knowledge it articulates.

This is not the same as saying that articulation is useless. Polanyi acknowledges that explicit knowledge plays a crucial role in guiding inquiry, communicating discoveries, and training novices. But he insists that explicit knowledge is always parasitic on tacit knowledge: you need tacit knowledge to *understand* explicit knowledge, to *apply* it, and to *judge* when it applies. A formula in physics is explicit knowledge, but understanding what the formula means, when it applies, and how to use it in a new situation requires tacit knowledge that the formula itself does not contain.

For GSD Reflect, this means that lessons -- even well-formed, evidence-based, correctly scoped lessons -- are not self-sufficient. They require tacit knowledge (the developer's practical judgment) to be understood, applied, and evaluated. The lesson "CI failures that persist for more than 3 consecutive pushes should trigger investigation" requires tacit knowledge of what "investigation" means in this context, what counts as a "CI failure" (as opposed to an environment issue), and what the appropriate scope of investigation is. The lesson is a tool -- a subsidiary -- that supports practical judgment. It is not a substitute for it.

## Relevance to GSD Reflect

GSD Reflect is a system that attempts to make practical knowledge explicit. It observes development practice (signals), identifies patterns (reflection), and distills general principles (lessons). Polanyi's framework asks whether this project is coherent, and the answer is: partially.

**The system has no tacit knowledge under Polanyi's phenomenological definition.** It has no body, no subsidiary awareness, no indwelling, no from-to structure of attending. It does not attend from signals to a focal diagnosis; it processes text inputs and produces text outputs. There is no moment of integration, no gestalt perception, no "aha" of recognizing what a pattern means. The system's "pattern detection" is syntactic, not perceptual. It identifies recurring signal types by string matching, not by perceiving the significance of a recurrence.

**Under a functionalist definition, the question is more interesting.** The LLM's training weights encode patterns deployed in context-sensitive ways without full articulability. The LLM "knows" how to write a good function -- in the sense that it reliably produces good functions -- without being able to articulate the complete set of rules it follows. It "knows more than it can tell" in a functional sense. Whether this constitutes tacit knowledge or merely mimics its behavioral profile is a philosophical question that Polanyi's framework does not resolve, because Polanyi's framework is built on the assumption of embodied, conscious agents.

Harry Collins's taxonomy in *Tacit and Explicit Knowledge* (2010) is useful here. Collins distinguishes three kinds of tacit knowledge: **relational** (tacit because it hasn't been made explicit yet, but could be), **somatic** (tacit because it depends on the body), and **collective** (tacit because it is constituted by social practices). The LLM might have something analogous to relational tacit knowledge -- patterns that could in principle be articulated but haven't been. It lacks somatic tacit knowledge entirely. And collective tacit knowledge -- the kind that constitutes knowing how to participate in a software development practice -- is precisely what GSD Reflect's lesson pipeline tries to capture. Collins's framework suggests this is the hardest kind to make explicit, because it depends on ongoing participation in the practice, not on any individual's knowledge.

**The strongest application of Polanyi to GSD Reflect is negative.** The most valuable insight is not about what the system can do, but about what the *user* possesses that the system cannot capture. The developer has tacit knowledge of their project: an intuitive sense of which parts of the codebase are fragile, which tests are flaky, which architectural decisions were compromises, which "code smells" are deliberate tradeoffs. This knowledge is structurally resistant to articulation. The system cannot extract it through signals, distill it through reflection, or store it as lessons. It can, however, *support* it -- by providing high-quality subsidiaries (context, prior cases, relevant patterns) that the developer attends through to their focal judgment.

**The tool-transparency ideal reframes system design.** Currently, GSD Reflect demands focal attention: the developer must read signal reports, triage findings, evaluate lessons, and consult reflection outputs. Each interaction makes the system an object of focal attention rather than a medium of perception. A Polanyian redesign would aim for transparency: the system's knowledge should appear subsidiarily, as contextual information available during development decisions, not as standalone reports that interrupt the development flow. The ideal GSD Reflect is one the developer barely notices -- because it has been successfully indwelt, incorporated into the developer's subsidiary framework for attending to their project.

**The extended mind thesis complicates the picture.** Clark and Chalmers's "extended mind" thesis (1998) argues that cognitive processes can extend beyond the brain into the environment. If a notebook reliably stores and provides information that the agent treats as part of their cognitive apparatus, the notebook is part of the agent's mind. Applied to GSD Reflect: if the developer reliably uses the KB, the signal history, and the reflection outputs as part of their development cognition, then the system is part of the developer's extended mind. The tacit knowledge in this extended system is not in the system alone or in the developer alone -- it is in the *coupling*. The developer's ability to attend from the system's outputs to their project decisions constitutes a distributed from-to structure. The tacit knowing is in the integration, not in either component.

This is speculative, and Polanyi himself would likely resist it -- his framework is deeply individualist and embodied. But the extended mind thesis suggests that the right unit of analysis for tacit knowledge in human-AI collaboration is not the human or the AI but the coupled system. The design question becomes: how do we optimize the coupling?

## Concept Mapping

| Framework Concept | GSD Reflect Analog | Current State | Praxis Implication |
|---|---|---|---|
| **Tacit knowledge** | The developer's practical judgment about their project -- which parts are fragile, which decisions were compromises, which patterns matter | Not represented in the system. The system captures explicit observations (signals) but not the developer's tacit understanding that contextualizes them. | The system should not try to capture tacit knowledge (this is self-defeating). Instead, it should provide rich subsidiaries that support the developer's tacit integration. Cases > propositions for this purpose. |
| **Subsidiary awareness** | Signals, patterns, prior cases, and contextual information that inform the developer's decision without being the focus of it | Currently foregrounded. Signals are presented in dedicated reports that demand focal attention. They are not integrated into the development flow as background context. | Redesign surfacing to be subsidiary: contextual side-panels during planning, inline annotations during code review, ambient pattern indicators rather than standalone reports. The information should be *available* without being *demanded*. |
| **Focal awareness** | The developer's current decision or action -- the plan they are building, the code they are writing, the problem they are solving | Not modeled. The system has no representation of what the developer is currently focused on, so it cannot tailor subsidiary information to the current focal task. | Introduce focal-task awareness: during planning, the system knows the current plan scope; during execution, it knows the current task. Subsidiary information should be filtered and prioritized by relevance to the focal task. |
| **Indwelling** | The developer working *through* the system's tools -- using GSD Reflect's signal history, lesson KB, and reflection outputs as extensions of their own development cognition | Not achieved. The system is an external tool that requires dedicated interaction, not an extension of the developer's cognitive apparatus. | Move toward indwelling by reducing the friction of system interaction. Automatic signal collection (SIG-01) is a step: the developer no longer has to consciously invoke collection. Contextual surfacing would be the next step: the system provides relevant information without being asked. |
| **Tool transparency** | A system that surfaces context without demanding focal attention -- the developer perceives their project *through* the system, not *at* it | Not achieved. Every interaction with GSD Reflect requires the developer to shift focal attention from their project to the system's outputs. | The transparency ideal may be unachievable for a text-based CLI system, but approximations are possible: shorter outputs, inline context during planning prompts, progressive disclosure (summary by default, detail on demand). |
| **From-to structure** | System provides the "from" (subsidiary context: signals, cases, patterns); developer provides the "to" (focal judgment about what to do) | The system provides subsidiaries (signals, lessons) but does not present them AS subsidiaries. They are presented as focal objects requiring evaluation, not as background context supporting a forward-looking decision. | Reframe system outputs as subsidiaries. Instead of "here is a lesson for you to evaluate" (focal), present "while you are planning X, here is what happened last time" (subsidiary). The shift is from system-centered presentation (evaluate my output) to developer-centered presentation (here is context for your decision). |
| **Explicitation paradox** | Making tacit knowledge explicit (distilling lessons from signals) may destroy the knowledge by removing it from the practical context that gives it meaning | The lesson pipeline is designed to do exactly what Polanyi warns against: extract practical knowledge from its context and store it as explicit propositions. | Accept partial explicitation: some knowledge can be usefully made explicit (procedural rules, threshold values, configuration patterns). Other knowledge resists explicitation (judgment about when rules apply, intuitive project understanding, aesthetic sense of code quality). Design the system to handle both: explicit lessons for the former, situated cases for the latter. |
| **Extended mind** | The developer + GSD Reflect as a coupled cognitive system, where tacit knowing is distributed across both | The coupling is loose. The system is used intermittently, not as a continuous extension of development cognition. | Tighter coupling would support extended tacit knowing: persistent system presence during development, continuous (not periodic) signal awareness, and bidirectional feedback (the developer's actions inform the system's context, and the system's context informs the developer's actions). |

## Concrete Examples

### Example 1: The From-To Structure in Signal Triage

Consider the current signal triage workflow. The developer runs `/gsd:collect-signals`, which produces a report listing detected signals with severity, type, and description. The developer reads the report, evaluates each signal, and decides how to triage it: dismiss, acknowledge, or escalate.

In Polanyi's framework, this workflow inverts the from-to structure. The signals should be *subsidiaries* -- background information that supports the developer's focal attention on their project. Instead, the workflow makes the signals *focal*: the developer must stop thinking about their project, shift focal attention to the signal report, evaluate each signal as an object of direct scrutiny, and then (after triage is complete) return focal attention to the project.

A from-to redesign would look different:

**Current (inverted):** Developer attends TO signals (focal) FROM project context (subsidiary, if available at all).

**Redesigned (from-to):** Developer attends FROM signals (subsidiary) TO their next planning decision (focal). Concretely: when the developer begins planning a new phase, relevant signals from prior phases are surfaced *in the context of the planning prompt*. "You are planning Phase 44. In Phases 41-43, these patterns were observed: [signal summary]. The following prior case is relevant: [case summary]." The developer does not evaluate the signals separately; they absorb them as subsidiaries while making their planning decisions.

The difference is not cosmetic. It changes what the developer cognitively does with the information. In the current workflow, they are *evaluating the system's output*. In the redesigned workflow, they are *planning their project*, with the system's output serving as context. The from-to structure determines whether the system supports or interrupts the developer's practical knowing.

### Example 2: The Explicitation Paradox in Lesson Distillation

The v1.16 development experience produced 124 signals and 0 lessons. One reading: the lesson pipeline is broken (technically). Another reading, informed by Polanyi: the pipeline is attempting something partially self-defeating.

Consider the tacit knowledge a developer has after completing 7 phases of v1.16 development. They know, tacitly, which parts of the codebase tend to break together, which tests are reliable indicators of real problems vs. environment noise, which architectural patterns resist modification, and which development sequences tend to produce clean phases. This knowledge was exercised throughout v1.16 -- it guided decisions, prevented errors, and shaped the development experience.

Now the reflection pipeline tries to make this knowledge explicit. It reads the signal history and attempts to distill general principles. But the general principles, once extracted from the development context, lose precisely the contextual richness that made them useful. "Plans should sequence shared infrastructure modifications" is a pale shadow of the developer's tacit understanding of *which* infrastructure is shared, *how* modifications interact, *when* sequencing matters and when it doesn't, and *why* this project's architecture makes this particularly important. The lesson is not wrong, but it is thin -- it has been stripped of the subsidiaries that gave the original knowledge its practical power.

Polanyi would predict that this thin lesson, when surfaced in a future planning session, would be less useful than a rich case description: "In v1.16 Phase 3, the installer was modified in parallel with the agent system. The installer's `replacePathsInContent()` function depended on agent file structure, so the parallel modification caused cascading failures: [specific description]. Resolution required backing out the agent changes and sequencing the modifications." This case preserves the subsidiaries -- the specific functions, the specific dependencies, the specific failure mode -- that the propositional lesson strips away.

The design implication: the reflection pipeline should produce *both* cases and propositions. The cases preserve subsidiary richness. The propositions provide quick reference. The developer attends from the case details to their current decision; the proposition serves as an index or summary, not as the knowledge itself.

### Example 3: Tool Transparency and the Reflection Report

The current reflection pipeline produces prose reports (`.planning/deliberations/reflections/`). These reports are substantial documents requiring dedicated reading time. In Polanyi's terms, they demand focal attention: the developer must stop working, open the report, read and evaluate it, and then return to work. The report is an opaque tool -- one that demands attention to itself rather than enabling attention through itself to the project.

Consider the contrast with a transparent alternative. Instead of a standalone reflection report, the system could integrate its reflection outputs into the existing workflow touchpoints:

- During `/gsd:plan`, the planning agent would incorporate relevant reflection findings into its planning context, without the developer needing to have read a separate report.
- During `/gsd:execute`, the execution agent would have access to relevant patterns and prior cases, surfacing them as inline annotations when they become relevant to the current task.
- During `/gsd:verify`, the verification agent would check not only test outcomes but also whether patterns identified in prior reflections were avoided or addressed.

In each case, the reflection output is not a separate artifact requiring focal attention. It is a subsidiary input to an existing focal activity. The developer never reads "the reflection report" -- they plan, execute, and verify their project, with reflection findings available *through* the workflow tools.

This is the Polanyian ideal: the system disappears into use. Its knowledge is exercised transparently, through the tools the developer already uses, rather than foregrounded in dedicated outputs that interrupt the development flow.

The ideal is probably unachievable in its pure form -- some system outputs will always require focal attention, especially when the system detects something genuinely novel or alarming. But the direction is clear: minimize the focal-attention demand of system outputs, maximize their subsidiary availability during existing workflow activities.

## Tensions and Limitations

### 1. The Functionalist Challenge

Does the LLM have tacit knowledge in a functional sense? Its training weights encode patterns that are deployed without full articulability. It "knows more than it can tell" -- it can generate correct code without being able to articulate the complete set of rules governing its generation. If tacit knowledge is defined functionally (by its behavioral profile: context-sensitive deployment of knowledge that resists articulation), then the LLM has it. If tacit knowledge is defined phenomenologically (by the structure of subsidiary-focal awareness in a conscious agent), then it does not.

Polanyi's own framework is ambiguous. His descriptions of tacit knowing emphasize the phenomenological structure (attending from... to...), which requires consciousness. But his examples often turn on functional properties: the ability to recognize faces, the ability to ride bicycles, the ability to diagnose diseases. These functional properties could in principle be instantiated without consciousness.

Collins's distinction between somatic, relational, and collective tacit knowledge partially resolves this: the LLM may have relational tacit knowledge (patterns that could be articulated but haven't been) without having somatic tacit knowledge (body-dependent skills) or collective tacit knowledge (practice-dependent social knowing). This is a useful middle ground, but it leaves open the question of whether relational tacit knowledge is "really" tacit in Polanyi's sense or merely not-yet-explicit.

**Mitigation:** Design the system to respect both possibilities. Provide the LLM with rich context (cases, signal history, project state) to support whatever functional tacit knowledge it may have. Simultaneously, provide explicit propositions (lessons, rules) to supplement what may be absent. The system does not need to resolve the functionalist debate to serve both possibilities.

### 2. Can the System Provide Useful Subsidiaries Without Having Focal Awareness?

Polanyi's from-to structure assumes a conscious agent who attends from subsidiaries to a focal whole. The system has no focal awareness -- it does not attend *to* anything. Can it nonetheless provide useful subsidiaries for the developer's focal integration?

The answer is probably yes, but the analogy is strained. The system can provide *information* that the developer uses as subsidiaries. But it cannot curate that information the way a conscious subsidiary-provider would, because it has no understanding of what the developer is attending to. Without knowing the developer's focal concern, the system cannot determine which of its many signals, lessons, and patterns would function as useful subsidiaries. It can only provide information and hope the developer integrates the relevant parts.

**Mitigation:** Introduce focal-task awareness. If the system knows what the developer is currently working on (which plan, which task, which file), it can filter its outputs to those most likely to be useful as subsidiaries. This is a crude approximation of the tacit awareness that a human collaborator would have, but it is better than providing all information indiscriminately.

### 3. The Paradox of Explicitation: Should the System Avoid Formalizing Lessons at All?

If making tacit knowledge explicit destroys it (Polanyi's paradox), and if the most valuable knowledge in software development is tacit (judgment, intuition, experience), then the lesson pipeline may be counterproductive. Each lesson it produces strips away the subsidiary context that made the original knowledge useful.

But this cannot be the whole story. Explicit knowledge -- documentation, checklists, rules, procedures -- is manifestly useful in software development. The question is not whether explicitation is ever valuable, but where the line falls between knowledge that benefits from explicitation and knowledge that is harmed by it.

**Mitigation:** Distinguish between procedural knowledge (which benefits from explicitation: "always run tests before pushing," "CI must be green before merge") and judgment knowledge (which resists it: "when to investigate a CI failure vs. when to bypass it," "whether a deviation warrants a plan change or is absorbable"). Produce explicit lessons for the former and situated cases for the latter. The line is not sharp, but the distinction is real and designable.

### 4. The Extended Mind Question

Clark and Chalmers's extended mind thesis suggests that the developer + GSD Reflect might constitute a coupled cognitive system in which tacit knowledge is distributed. The developer's ability to attend from the system's outputs to their project decisions is a from-to structure that spans the human-system boundary. The tacit knowing is in the coupling, not in either component.

This is philosophically interesting but practically difficult. The coupling is currently weak: the developer interacts with GSD Reflect intermittently, through explicit commands, in a text-only medium. The coupled system has low bandwidth and high latency. For the extended mind thesis to apply in a meaningful sense, the coupling would need to be much tighter: continuous, bidirectional, and low-friction.

**Mitigation:** Move toward tighter coupling if the extended mind thesis is taken seriously. Continuous signal awareness (not periodic collection), persistent context across sessions, and bidirectional feedback (developer actions automatically inform system context) would increase the bandwidth and reduce the latency of the coupling. Whether this achieves genuine "extended tacit knowing" or merely more efficient information exchange is an empirical question.

### 5. Polanyi's Framework Is Individualist

Polanyi's tacit knowing is the knowing of an *individual* person, grounded in their individual body, their individual experience, their individual practice. Software development is increasingly collaborative (developer + AI + team + toolchain), and the knowing that matters is often distributed across multiple agents. Polanyi's framework does not account for distributed knowing, collective tacit knowledge (though Collins extends it in this direction), or the question of how tacit knowledge transfers between individuals.

GSD Reflect's cross-project KB is an attempt to transfer something like tacit knowledge across projects: lessons learned in one project are surfaced in another. Polanyi would be skeptical -- tacit knowledge, by his account, cannot be transferred through explicit articulation. It is acquired through practice, through indwelling, through sustained engagement with the domain. A lesson surfaced from a different project is explicit knowledge that the developer must interpret using their own tacit knowledge of their current project. The transfer is mediated by the developer's tacit integration, not achieved by the system's explicit transmission.

**Mitigation:** Design cross-project knowledge transfer as *context enrichment*, not as *knowledge transfer*. When a lesson from Project A is surfaced in Project B, it is not a piece of transferable knowledge but a piece of context that the Project B developer must evaluate using their own tacit understanding. Present it as such: "This was learned in a different project under these conditions. Judge for yourself whether it applies here." This respects the irreducibility of tacit knowledge to explicit transfer while still making cross-project experience available.

## Praxis Recommendations

1. **Redesign system outputs for subsidiary availability, not focal demand.** The from-to structure should guide output design: system outputs are subsidiaries that support the developer's focal attention on their project. Concretely: embed signal summaries and pattern indicators in planning prompts rather than requiring separate report reading. Provide progressive disclosure (summary by default, detail on demand). Minimize the number of dedicated system-interaction moments that interrupt development flow. *Cite: polanyi/from-to-structure, polanyi/tool-transparency.*

2. **Produce situated cases alongside (not instead of) propositional lessons.** Cases preserve subsidiary richness -- the specific context, the specific failure mode, the specific resolution -- that propositional lessons strip away. When the reflection pipeline identifies a pattern, it should produce both a case description (what happened, in detail, with context) and a propositional summary (the general principle, stated concisely). The case supports tacit integration; the proposition supports quick reference. *Cite: polanyi/explicitation-paradox, polanyi/subsidiary-provision, ryle/hedged-output.*

3. **Distinguish procedural knowledge from judgment knowledge in the KB.** Not all knowledge resists explicitation equally. Procedural knowledge ("always run tests before pushing") benefits from explicit articulation. Judgment knowledge ("when to investigate a CI failure vs. bypass it") is harmed by premature propositionalization. Tag lessons with a "tacitness indicator" that reflects how much unformalized judgment is required to apply them. High-tacitness lessons should always be accompanied by cases. *Cite: polanyi/explicitation-paradox, ryle/regress-argument.*

4. **Introduce focal-task awareness to improve subsidiary relevance.** The system cannot provide good subsidiaries without knowing what the developer is attending to. Track the current focal task (which plan, which phase, which task) and use it to filter and prioritize system outputs. A signal about CI failures is a useful subsidiary when the developer is planning a CI-related phase; it is noise when they are planning a documentation update. *Cite: polanyi/from-to-structure, polanyi/subsidiary-provision.*

5. **Move toward tool transparency by reducing interaction friction.** Automatic signal collection (SIG-01) is a transparency step: the developer no longer has to consciously invoke collection. Extend this pattern: automatic lesson surfacing during planning, automatic pattern indicators during execution, automatic verification prompts during testing. Each automation step moves the system closer to transparency -- the developer attends through the system to their project, rather than stopping to interact with the system as an opaque object. *Cite: polanyi/tool-transparency.*

6. **Design cross-project knowledge transfer as context enrichment.** When surfacing a lesson from another project, present it as context for the developer's judgment, not as a transferable rule. Include the source project's characteristics, the conditions under which the lesson was learned, and the ways the current project differs. The developer's tacit knowledge of their current project is the only mechanism that can evaluate cross-project applicability. Respect this by presenting cross-project lessons as evidence, not as recommendations. *Cite: polanyi/tacit-dimension, polanyi/subsidiary-provision.*

7. **Accept that the system's most important knowledge contribution is negative.** The system cannot capture or possess the developer's tacit knowledge. What it CAN do is prevent the developer from having to re-derive explicit knowledge that has already been articulated. The system's value is in handling the explicit layer -- procedural rules, threshold configurations, historical records -- so that the developer's tacit capacities are freed for the judgment work that only they can do. This is the subsidiary-provision role: the system handles the "from," the developer handles the "to." *Cite: polanyi/subsidiary-provision, polanyi/from-to-structure, aristotle/techne-phronesis-distinction.*

8. **Consider the coupling quality as a system health metric.** If the extended mind thesis applies, the quality of the developer-system coupling is as important as the quality of either component. Track coupling indicators: how frequently the developer consults system outputs, how often surfaced lessons influence decisions, how seamlessly system information integrates into workflow. Low coupling means the system is not functioning as a cognitive extension; high coupling means it is approaching the indwelling ideal. *Cite: polanyi/tool-transparency, polanyi/from-to-structure.*

## Citable Principles

- **polanyi/tacit-dimension**: We know more than we can tell. Practical knowledge is structurally resistant to full articulation, not merely awaiting better articulation methods. A system that assumes all valuable knowledge can be made explicit misunderstands the nature of practical knowing. Some knowledge functions only as subsidiary awareness and loses its character when made focal.

- **polanyi/from-to-structure**: Tacit knowing attends FROM subsidiary particulars TO a focal whole. The subsidiaries function only AS subsidiaries; making them focal destroys the integration they support. System outputs should be designed as subsidiaries for the developer's focal attention on their project, not as focal objects demanding independent evaluation.

- **polanyi/tool-transparency**: Skilled tool use involves indwelling -- the tool becomes transparent, attended through rather than at. A well-designed system disappears into use: the developer perceives their project through the system's tools, not the tools themselves. A system that demands focal attention for its own outputs has failed the transparency test.

- **polanyi/subsidiary-provision**: A system that cannot possess tacit knowledge can still support it by providing high-quality subsidiaries for the developer's focal integration. The system's role is to handle the explicit layer (signals, patterns, procedural rules, historical records) so that the developer's tacit capacities are freed for the judgment work that only tacit knowing can perform.

- **polanyi/explicitation-paradox**: Making tacit knowledge explicit may destroy it by stripping away the subsidiary context that gave it meaning. Propositional lessons that articulate practical judgment may be thinner and less useful than situated cases that preserve the context. The system should produce both, recognizing that propositions serve as indexes and cases serve as knowledge.

- **polanyi/body-as-instrument**: The body is the ultimate instrument of tacit knowing -- the primary medium through which we attend to the world. Systems without bodies lack the ground of tacit knowledge in Polanyi's sense. Whether functional analogues (training weights, accumulated state) constitute a "body" in an extended sense is unresolved, but the absence of embodiment is a genuine epistemic limitation, not a minor implementation detail.

---

*This deliberation should be referenced when: designing output formats for the reflection pipeline (subsidiary vs. focal presentation); deciding whether to produce propositional lessons, situated cases, or both; evaluating whether cross-project knowledge transfer is knowledge transfer or context enrichment; considering the developer-system coupling as a design dimension; assessing the limits of explicitation for different kinds of practical knowledge; designing tool interfaces for transparency and indwelling.*
