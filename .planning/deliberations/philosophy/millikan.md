# Philosophical Deliberation: Millikan's Teleosemantics

**Tradition:** Naturalized Philosophy of Mind / Biosemantics
**Key thinkers:** Ruth Garrett Millikan (Language, Thought, and Other Biological Categories, 1984; Varieties of Meaning, 2004), Karen Neander (A Mark of the Mental, 2017), David Papineau (Representation and Explanation, 1993)
**Created:** 2026-03-08
**Status:** Active

## Core Ideas

Millikan's teleosemantics provides a naturalized account of representation -- what it means for something to have content (meaning) -- grounded not in resemblance, correlation, or interpretive convention, but in biological function. The framework was developed to answer the problem of intentionality without invoking irreducible mental properties. Its central innovation is that *meaning is constituted by function*, and function is constituted by *selection history*. Applied to GSD Reflect, this framework delivers the strongest available diagnosis of the signal pipeline problem: 114 signals that never trigger remediation are not merely neglected observations but semantically empty outputs. The argument is not normative ("we should act on signals") but constitutive ("signals that don't lead to action don't mean anything").

### Proper Functions

Millikan's central concept is the "proper function." A trait has a proper function when it was selected for -- by natural selection, learning, or design -- *because* it performed that function. The heart's proper function is to pump blood, not because it currently pumps blood (a heart that is malfunctioning still has pumping as its proper function), but because pumping blood is the activity that explains why hearts were reproduced across generations. Proper functions are *historical* and *etiological*, not *dispositional*. What something *does* right now is not what determines its proper function. What matters is the history of selection that explains why things of this type exist.

This distinction is critical. A malfunctioning heart -- one that fails to pump -- still has pumping as its proper function. The malfunction is intelligible precisely because there is a function the heart is failing to perform. But consider a random lump of tissue that has never been selected for anything: it has no proper function at all. It is not malfunctioning (that would imply a function it fails to perform); it is simply non-functional. The difference between *malfunctioning* (having a function and failing at it) and *being non-functional* (having no function) is the distinction that does the most work when applied to GSD Reflect's signal pipeline.

Neander extends Millikan's account with careful attention to the explanatory role proper functions play in the sciences, arguing that proper function attributions are not merely philosophical constructions but are implicit in how biologists, psychologists, and neuroscientists actually explain behavior. When a neuroscientist says a neural circuit "detects edges," they are making a proper function claim -- this circuit was shaped (by evolution, development, or learning) to detect edges, and that is why it exists in its current form.

### Teleosemantics

Representations, on Millikan's account, have content (meaning) in virtue of their proper function. Consider the classic example: the frog's fly-detector. Certain neurons in the frog's visual system fire in response to small, dark, moving objects. These neurons are popularly said to "represent flies." But Millikan asks: what makes them fly-representations rather than representations of small-dark-moving-things-in-general? After all, the neurons fire for BBs, shadows, and small debris just as readily as for flies.

The answer, for Millikan, lies not in what *causes* the neurons to fire (the producer side) but in what the *consuming system* needs the firing to mean (the consumer side). The frog's tongue-striking behavior -- the consumer of the representation -- was selected because it enabled catching flies. The content of the neural signal is "fly" (not "small dark moving thing") because the consumer system's proper function is to catch flies, and it is the consumer's function that fixes the content.

This is a radical move. It means that content is not determined by the causal relationship between representation and world (what causes the signal) but by the functional relationship between representation and consumer (what the signal is for). A representation that has no consumer -- or whose consumer never uses it -- has no content. It is not a representation at all in any functionally meaningful sense.

### Producer-Consumer Semantics

Millikan's mature framework (especially in *Varieties of Meaning*) develops a systematic producer-consumer model. A representation requires two cooperating systems:

1. **The producer** generates representations. It maps world-states to representational vehicles (signals, symbols, patterns). The producer's proper function is to generate representations that covary with the relevant features of the world.

2. **The consumer** uses representations to guide action. It maps representational vehicles to behavioral responses. The consumer's proper function is to respond appropriately to what the representation means -- to catch flies when the fly-signal fires, to flee when the predator-signal fires.

Content is determined by the consumer side: what the consumer needs to extract from the representation to perform its proper function. The producer's job is to provide representations that the consumer can use, but the *meaning* of those representations is fixed by what the consumer does with them.

This has a striking consequence: if there is no consumer, or if the consumer never uses the representations, the representations have no content. A producer that generates signals with no consumer to act on them is not producing meaningful representations -- it is producing noise in a format that resembles representation. The signals may be syntactically well-formed, causally produced by real events, and stored in a knowledge base. But if no system ever consumes them to guide action, they have no teleosemantic content.

Papineau reaches a similar conclusion from a slightly different angle: mental representations get their content from the learning history that shaped the connection between representation and action. Representations that were never connected to action through any selection or learning process have no content to speak of.

### Derived vs. Direct Proper Functions

Millikan distinguishes between *direct* proper functions (established by natural selection over evolutionary time) and *derived* proper functions (established by design, convention, or intentional creation). A heart has a direct proper function: pumping blood was naturally selected. A screwdriver has a derived proper function: turning screws was the intention of its designer.

Derived proper functions are genuine proper functions -- a screwdriver really is *for* turning screws, and it can malfunction (a screwdriver with a stripped tip is a malfunctioning screwdriver). But derived proper functions are *weaker* than direct ones in an important respect: they can be changed by redesign. If someone redesigns the screwdriver as a pry bar, its proper function changes. Direct proper functions, backed by deep evolutionary history, resist such easy reassignment.

This distinction matters for GSD Reflect because signals have *derived*, not direct, proper functions. They were designed (by engineers) to trigger triage, remediation, and behavioral change. Their proper function is stipulated, not evolved. The teleosemantic argument still applies -- signals without consumers are contentless -- but with less metaphysical force. We could say signals are "supposed" to lead to action without invoking Millikan at all; any designer could tell you that. What Millikan adds is the constitutive claim: if content is determined by function, and the function is systematically unfulfilled, then the outputs are not merely *unused* but *empty*.

## Relevance to GSD Reflect

GSD Reflect's signal pipeline is, in Millikan's terms, a producer-consumer system with a missing consumer. The sensors and reflector are producers: they detect workflow deviations (file churn, fix-fix-fix chains, CI failures, scope creep) and emit signals. These signals are stored in the knowledge base. But the consumer side -- the system that reads signals, triages them, generates remediation actions, and verifies behavioral change -- does not exist, or exists only as a manual process that is never executed.

**The 114 contentless signals.** As of v1.16, 114 signals have been collected but never triaged. No lessons have been formally produced. No signals have been remediated. In Millikan's framework, these signals are not merely "unprocessed" -- a framing that implies they have content waiting to be consumed. They are *contentless*. Their designed proper function is to trigger a feedback loop: signal -> triage -> lesson -> remediation -> verification -> behavioral change. Since no element of this feedback loop has ever consumed a signal, the signals have no consumer, and representations without consumers have no content. They are syntactically well-formed descriptions of real events that, in functional terms, describe nothing -- because description without function is not description.

This is the strongest available framing of the pipeline problem. Other framings are weaker:

- "We have signals but haven't acted on them" (operational: implies the signals are fine and we just need to get around to them)
- "The feedback loop is open" (cybernetic: identifies the structural problem but doesn't characterize what it means for the outputs)
- "The signals are untested claims" (falsificationist: true but addresses epistemic status, not semantic content)

The teleosemantic framing says: the pipeline does not just fail to complete. It fails to *produce anything meaningful*. The outputs are not claims, not observations, not evidence. They are noise formatted to look like signal. This is not a matter of degree -- it is a categorical distinction between contentful representations (which have consumers) and contentless ones (which do not).

**The argument against purely advisory systems.** The deliberation on pipeline architecture (Position A vs. Position B in the ontology deliberation) considers whether the system should be purely advisory -- producing reports and recommendations that the developer reads and acts on at their discretion. Millikan's framework provides the strongest argument against this position: a system whose outputs are routinely ignored does not just fail practically. It produces outputs with no semantic content. The developer who reads a signal report, nods, and does nothing has not "received information and chosen not to act." They have participated in a producer system with no consumer function. The signal was not consumed in the teleosemantic sense -- consumption requires the representation to guide action through the consumer's proper function, not merely to be perceived.

This is not to say that advisory systems are never appropriate. It is to say that an advisory system must be designed so that its advice is *actually consumed* -- integrated into decision-making, acted upon, or at minimum genuinely deliberated about. A system that routinely produces advice that is routinely ignored has a design flaw, not a user compliance problem. The design flaw is the absence of a consumer.

**Consumer-side design.** The implication is direct: the system needs to build the consumer side of the pipeline, not just improve the producer side. More sensors, better signal formatting, richer metadata, more frequent collection -- all of these improve the producer. But without a consumer (an agent or process that reads signals, triages them, generates remediation actions, and verifies outcomes), better production creates more contentless output. Millikan's framework redirects design attention from "how do we detect more?" to "how do we ensure what we detect gets consumed?"

## Concept Mapping

| Framework Concept | GSD Reflect Analog | Current State | Praxis Implication |
|---|---|---|---|
| **Proper function** | A signal's designed role in the feedback loop: trigger triage, produce lessons, remediate deviations, verify behavioral change. This is what signals are *for*. | Signals are collected and stored. Their designed proper function (triggering triage and remediation) is never exercised. The function exists by design intent but has no history of successful execution. | The proper function of signals must be exercised, not merely specified. A designed function that has never been performed is a promissory note, not an established function. Build the consumer that fulfills the function. |
| **Teleosemantic content** | The meaning of a signal, constituted not by what the signal "describes" (what caused it) but by its functional role -- what the consuming system needs it to mean in order to act. | Signals describe real events (CI failures, scope deviations, file churn). But their content is determined by what a consumer extracts from them. With no consumer, the descriptions have no teleosemantic content. | Stop treating signals as inherently meaningful descriptions that merely need to be "processed." Their meaning is constituted by consumption. Design the consumer first, then evaluate whether the producer generates what the consumer needs. |
| **Producer** | Sensors and the reflector: systems that detect workflow deviations and emit signals. They map project states to representational vehicles (signal files with metadata). | Well-developed. Multiple sensors (artifact, CI, dependency), reflector with pattern detection, structured output format. The producer side of the pipeline is the most mature component. | The producer side is not the bottleneck. Further producer improvements (more sensors, richer formats) without consumer improvements produce more contentless output. Redirect design effort toward consumption. |
| **Consumer** | The agent or process that reads signals, triages them, generates remediation actions, and verifies behavioral change. The system component whose proper function is to *act on* signals. | Missing. No automated consumer exists. The developer is the nominal consumer but has never performed triage on the accumulated signals. The consumer side of the pipeline is a design specification, not an implementation. | This is the critical gap. Build the consumer: automated or semi-automated triage, remediation action generation, verification of behavioral change. The consumer's design determines what the signals mean. |
| **Contentless representations** | The 114 untriaged signals: syntactically well-formed, causally produced by real events, stored in the knowledge base, but lacking teleosemantic content because no consumer has ever extracted anything from them. | 114 signals, 0 triaged, 0 lessons, 0 remediations. The signals exist as files but function as nothing. | The "signal backlog" is not a queue of meaningful items awaiting processing. It is a collection of contentless artifacts. Processing them retroactively may be less valuable than building the consumer and generating new signals that are consumed from the start. |
| **Derived proper function** | The designed (not evolved) function of signals in the feedback loop. Signals were created by engineers to serve a purpose, not selected by evolutionary pressure. | The function is stipulated in design documents (SIG-01, REFL-01, etc.) but has no execution history. It is a derived function with zero instances of successful performance. | Derived functions are genuine but weaker than evolved ones. They can be redesigned. If the current signal format does not serve the consumer's needs, redesign the signals -- their function is stipulated, not fixed by deep history. |
| **Malfunctioning vs. contentless** | A signal that fails to transmit its content (e.g., corrupted metadata, wrong severity classification) is *malfunctioning* -- it has content but fails to convey it. A signal with no consumer is *contentless* -- there is no content to transmit. | The 114 signals are not malfunctioning. Their metadata is well-formed, their descriptions are accurate, their severity classifications are reasonable. They are contentless: no consumer means no content. | The distinction matters for diagnosis. The problem is not signal quality (malfunctioning producer) but signal consumption (absent consumer). Improving signal quality (better metadata, richer descriptions) addresses the wrong problem. |
| **Selection history** | The history of successful function performance that establishes and reinforces a proper function. For biological traits, this is natural selection. For designed artifacts, it is the history of successful use. | Zero selection history. No signal has ever successfully triggered the full feedback loop. There is no history of successful consumption to establish or reinforce the function. | Begin building selection history by running the full loop on a small number of signals. Each successful triage-remediation-verification cycle strengthens the functional claim and begins to give signals genuine (not merely stipulated) proper functions. |

## Concrete Examples

### Example 1: The Fly-Detector Without a Tongue

Consider the frog's visual system. Neurons fire when small dark objects cross the visual field. The tongue strikes. Flies are caught. The system works because producer (visual neurons) and consumer (tongue-striking mechanism) are functionally coupled. Now imagine a frog whose tongue-striking mechanism has been completely severed from its visual system. The neurons still fire when flies pass. The pattern of activation is identical. But the neural firings no longer represent flies -- because there is no consumer that uses the representation to guide fly-catching behavior. The firings are caused by flies, but they do not *mean* flies.

GSD Reflect's signal pipeline is this severed frog. The sensors (producers) fire correctly: they detect CI failures, scope deviations, file churn, fix-fix-fix chains. The signals are caused by real workflow problems, just as the neural firings are caused by real flies. But the consumer side -- the triage process, the lesson engine, the remediation workflow, the verification step -- is severed. The signals fire and nothing happens. They are caused by problems but do not mean anything about those problems, because meaning requires a consumer that acts on the representation.

The analogy has a precise limit: the severed frog's visual neurons had content *before* the severance, because they had a history of successful consumption. GSD Reflect's signals have *never* been successfully consumed. They have no history of functional coupling. In Millikan's terms, they lack even the selection history that would give them content to lose. They were designed to have content (derived proper function), but that design has never been realized.

### Example 2: Building Selection History Through Triage

Suppose Phase 43 implements a triage process: the system reads accumulated signals, clusters them by theme, assigns severity, and generates candidate lessons. One cluster contains 7 signals about scope creep across v1.15-v1.16. The triage process produces a candidate lesson: "Plans that modify shared infrastructure should include explicit scope boundaries in the plan document." This lesson is applied in Phase 44. The system verifies: did the next plan touching shared infrastructure include scope boundaries? It did. The lesson functioned.

This single cycle does something important in Millikan's framework: it begins to establish a *selection history* for signals. The scope-creep signals were consumed (triage extracted their content), acted upon (a lesson was generated), and verified (the lesson changed behavior). These specific signals now have a functional history -- they were used to do something, and that use was successful. Future scope-creep signals inherit a derived proper function that has been *exercised*, not merely *stipulated*.

The lesson for system design: start small. Run the full loop on a handful of signals. Each successful cycle strengthens the functional foundation. Do not attempt to triage all 114 signals at once. The goal is not to clear the backlog but to build the consumer and begin establishing selection history.

## Tensions and Limitations

### 1. Derived Functions Are Weaker Than Evolved Functions

The teleosemantic argument has maximum force when applied to representations whose function was established by natural selection over evolutionary time. The frog's fly-detector has millions of years of selection history behind its proper function. GSD Reflect's signals have *design documents*. The derived proper function of signals is genuine (Millikan explicitly accommodates designed artifacts), but it is weaker in an important respect: it can be changed by redesign without any evolutionary consequence.

This matters because the "contentless" claim is strongest when backed by deep selection history. Saying that the frog's fly-detector is contentless when severed from the tongue is a strong claim: the function that constitutes its content has millions of years of backing. Saying that GSD Reflect's signals are contentless when no one triages them is a weaker claim: the function that should constitute their content is a design specification that was written months ago and has never been tested.

The honest assessment: the teleosemantic argument illuminates the pipeline problem and reframes it productively (from operational failure to semantic emptiness). But the "contentless" claim should be held with appropriate modesty. We are applying a framework designed for evolved biological representations to engineered text files. The translation is productive but imperfect.

**Mitigation:** Use the teleosemantic framing as a diagnostic tool and design heuristic, not as a metaphysical claim. "These signals are contentless" is a useful provocation that redirects attention from producer improvements to consumer design. It is not a literal claim about the ontological status of text files.

### 2. Signals May Have Consumers We Are Not Counting

The strict claim -- signals have no consumer -- may be too strong. The developer reads signal reports. The reflector analyzes signals and produces pattern summaries. The deliberation documents cite specific signals as evidence. These are forms of consumption: the signals are being used by systems (human and automated) to guide reasoning and decision-making.

Millikan would ask: do these consumption events constitute the proper function of the signals? If the signals were designed to trigger the full feedback loop (triage -> lesson -> remediation -> verification), then reading them in a report is not the consumption they were designed for. It is like using a screwdriver as a pry bar: the screwdriver is being used, but not for its proper function. The signals are being consumed, but not by the consumer they were designed to serve.

However, this raises a question about whether the proper function of signals should be narrowly defined (the full feedback loop) or broadly defined (informing development practice in any way). If broadly defined, the signals DO have consumers, and the "contentless" claim falls apart.

**Mitigation:** Be precise about which function is at issue. The claim is not that signals are unused (they appear in reports and deliberations) but that their *designed* proper function -- triggering formal triage, lesson generation, remediation, and verification -- has never been fulfilled. The consumer that was designed for does not exist. Partial consumption by other systems is real but does not constitute the function the signals were built to serve.

### 3. Biological Frameworks Applied to Text Files

Millikan's framework was developed to explain biological representation -- how neural states in organisms come to have content about the external world. Applying it to text files in a software project's knowledge base is a significant translation. Neural states are physically coupled to behavior through neural circuits. Text files in a knowledge base are coupled to nothing except the (contingent, unreliable) reading practices of developers and AI agents.

The translation works because Millikan's framework is *structurally* general: any system with producers, consumers, and representations that mediate between them can be analyzed in teleosemantic terms. But the force of the analysis depends on how tightly the producer-consumer coupling is maintained, and in a software system, this coupling is much looser than in a biological organism.

**Mitigation:** Acknowledge the translation gap explicitly when citing teleosemantic principles. The framework is being used as an *analytical tool*, not as a claim that software signals are literally the same kind of thing as neural representations. The structural analogy is productive; the literal identification is false.

### 4. Is "Contentless" Too Strong?

The strongest claim -- signals with no consumer have no content -- may overstate the case. Consider a signal that reads: "CI failed 5 consecutive times between phases 31-35. All failures were test environment misconfigurations, not code defects." This signal *describes* a real state of affairs. It has propositional content in the ordinary linguistic sense: it makes a claim about the world that is true or false. Does it really have "no content" just because no automated system acts on it?

Millikan would maintain the distinction: the signal has *linguistic* content (it is a sentence in English with truth conditions) but no *teleosemantic* content (it has no function that fixes its content qua representation in a producer-consumer system). The linguistic content depends on the conventions of English, not on any producer-consumer coupling. The teleosemantic content -- what the signal means *as a signal in the GSD pipeline* -- depends on whether the pipeline's consumer uses it to guide action.

This is a subtle point, and it may be too fine-grained for practical design purposes. The useful takeaway is not that signals are literally meaningless but that their *functional* meaning -- their meaning as components of a self-improving system -- is constituted by consumption, not by description.

**Mitigation:** Distinguish linguistic content (what the signal says in English) from functional content (what the signal means in the pipeline). The claim that signals are "contentless" applies to functional content, not linguistic content. This distinction prevents the objection that signals obviously describe real events.

### 5. Self-Modifying Functions

If the system redesigns its own pipeline -- adding a consumer, implementing triage, closing the feedback loop -- does this constitute a form of functional self-selection? Millikan's framework presupposes that proper functions are established by *external* selection (evolution) or *external* design (an engineer). A system that designs its own consumers and thereby establishes its own proper functions is a novel case that Millikan's framework does not straightforwardly accommodate.

This is not a fatal objection (Millikan explicitly allows derived proper functions from intentional design, and there is no principled reason the designer cannot be the system itself -- or the developer acting through the system). But it raises interesting questions about whether self-designed functions have the same status as externally designed ones, and whether a system that bootstraps its own consumer is genuinely establishing content or merely stipulating it.

**Mitigation:** Treat self-modification as a feature, not a problem. The system's ability to redesign its own pipeline is analogous to a practice that evolves its own standards (MacIntyre's internal goods). The proper functions are derived and self-stipulated, which is philosophically interesting but practically unproblematic. What matters is whether the consumer, once built, actually functions -- not who built it.

## Praxis Recommendations

1. **Build the consumer side of the pipeline before improving the producer side.** The producer (sensors, reflector, signal collection) is mature. The consumer (triage, lesson generation, remediation, verification) does not exist. Further producer improvements (more sensors, richer formats, more frequent collection) without a consumer produce more contentless output. The immediate design priority is not "better signals" but "anything that consumes signals." *Cite: millikan/producer-consumer, millikan/consumer-side-design.*

2. **Start small to build selection history.** Run the full feedback loop (triage -> lesson -> remediation -> verification) on a small number of signals -- perhaps 5-10 from the most recurring themes. Each successful cycle establishes functional history, giving signals genuine (exercised, not merely stipulated) proper functions. Do not attempt to process the entire backlog; the goal is to build the consumer and demonstrate that it works. *Cite: millikan/proper-function, millikan/derived-function.*

3. **Design the consumer to determine signal content.** In Millikan's framework, the consumer's needs fix the content of representations. Design the triage process first, then evaluate whether the current signal format provides what triage needs. If it does not, redesign the signal format to serve the consumer -- not the other way around. The consumer's requirements are the specification for what signals should contain. *Cite: millikan/producer-consumer, millikan/function-constitutes-meaning.*

4. **Distinguish malfunctioning signals from contentless signals in diagnostic reasoning.** When evaluating the pipeline's performance, ask: is this signal failing to transmit content it has (malfunction -- fix the signal), or does it have no consumer and therefore no content (contentless -- build the consumer)? These diagnoses call for different interventions. The current pipeline's problem is almost entirely on the consumer side, not the producer side. *Cite: millikan/contentless-output, millikan/producer-consumer.*

5. **Use the teleosemantic framing to evaluate advisory system proposals.** When considering whether a feature should be advisory (produce a report) or active (trigger an action), apply the teleosemantic test: will the advisory output have a consumer that acts on it? If the evidence suggests the output will be read and ignored (as the signal reports have been), an advisory design produces contentless output by design. Active designs that ensure consumption are semantically superior even if they constrain developer autonomy. *Cite: millikan/contentless-output, millikan/function-constitutes-meaning.*

6. **Accept the derived-function limitation honestly.** The teleosemantic argument applies to designed systems with less force than to evolved ones. When citing teleosemantic principles, acknowledge that signals have derived (designed) proper functions, not direct (evolved) ones. This weakens the metaphysical claim but preserves the design insight: content requires function, and function requires a consumer. *Cite: millikan/derived-function, millikan/proper-function.*

## Citable Principles

- **millikan/proper-function**: A representation's meaning is constituted by the function it was selected (or designed) to perform, not by what causes it. A signal's proper function is its designed role in the feedback loop -- triggering triage, generating lessons, remediating deviations, verifying behavioral change. A signal that has never performed this function has a stipulated but unexercised proper function.

- **millikan/producer-consumer**: Meaning requires both a producer (that generates representations) and a consumer (that uses them to guide action). Content is determined by what the consumer needs to extract. Representations without consumers have no content. A signal pipeline with producers (sensors, reflector) but no consumer (triage, remediation, verification) produces representations that are syntactically well-formed but semantically empty.

- **millikan/contentless-output**: Outputs that systematically fail to function are not merely ineffective but semantically empty. The 114 untriaged signals are not a backlog of meaningful items awaiting processing; they are contentless artifacts whose designed function has never been exercised. The distinction between "unused but meaningful" and "contentless" is the distinction between a malfunctioning system (content exists but fails to transmit) and a non-functional one (no content to transmit).

- **millikan/consumer-side-design**: Building better producers (more sensors, more signals, richer formats) without building consumers (agents that act on signals) produces more contentless output, not more knowledge. Design effort should be directed toward the consumer side of the pipeline until consumption exists, then iteratively improved by evaluating whether the producer generates what the consumer needs.

- **millikan/derived-function**: Designed functions (like signal roles in the feedback loop) are genuine proper functions but weaker than evolved ones. They can be changed by redesign without evolutionary consequence. The teleosemantic argument applies to designed systems but with less metaphysical force. This is a reason for modesty about the "contentless" claim, not a reason to abandon it.

- **millikan/function-constitutes-meaning**: The pipeline problem is not operational ("we fail to act on signals") but semantic ("signals without consumers don't mean anything"). This reframes the design priority from "how do we process the backlog?" to "how do we build a system in which signals have functional content?" The answer is: build the consumer. Content follows function; function follows consumption.

---

*This deliberation should be referenced when: evaluating the semantic status of pipeline outputs that have no consumer; arguing for consumer-side design priority over producer-side improvements; assessing advisory vs. active system architectures; diagnosing whether signal quality or signal consumption is the bottleneck; considering the limits of applying biological frameworks to engineered systems; distinguishing malfunctioning representations from contentless ones.*
