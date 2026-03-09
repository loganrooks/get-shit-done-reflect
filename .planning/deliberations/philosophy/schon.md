# Philosophical Deliberation: Schon's Reflective Practice

**Tradition:** Professional Learning / Philosophy of Practice
**Key thinkers:** Donald Schon (The Reflective Practitioner, Educating the Reflective Practitioner), Chris Argyris (Organizational Learning, Theory in Practice), Karl Weick (Sensemaking in Organizations -- for organizational parallels)
**Created:** 2026-03-08
**Status:** Active

## Core Ideas

Donald Schon's work on reflective practice, developed primarily in The Reflective Practitioner (1983) and Educating the Reflective Practitioner (1987), addresses a question that is deceptively simple and deeply consequential for GSD Reflect: when does reflection happen, and why does the timing matter? Schon's answer -- that the most powerful form of professional learning happens *during* practice, not after it, and that this in-action reflection has a phenomenological structure that retrospective analysis cannot replicate -- poses a direct challenge to a system whose primary reflective mechanism (`/gsdr:reflect`) operates exclusively after the fact.

### Reflection-in-Action vs. Reflection-on-Action

The central distinction in Schon's work is between two temporalities of reflection:

**Reflection-on-action** is what most people mean by "reflection": thinking about practice after it is complete. The developer finishes a phase, reviews what happened, identifies what went well and what did not, extracts lessons for next time. This is retrospective, analytical, and deliberate. It produces explicit knowledge -- articulable principles, documented lessons, updated procedures. GSD Reflect's signal collection, pattern detection, and reflection reports are all forms of reflection-on-action. They occur after execution, they analyze what happened, and they produce artifacts (signals, patterns, lessons) that codify the analysis.

**Reflection-in-action** is something different. It is thinking *within* the activity, prompted by something unexpected -- what Schon calls "surprise." The architect is sketching a building layout and notices that the placement of a stairwell creates an unexpected sight line. The musician is improvising and hears a dissonance that suggests a new harmonic direction. The developer is implementing a feature and encounters a dependency that reshapes their understanding of the module structure. In each case, the practitioner does not stop practicing to reflect. The reflection happens *within* the practice, modifying it in real time.

Reflection-in-action has several distinctive features:

- It is triggered by **surprise** -- a discrepancy between what was expected and what occurred. The practitioner's tacit expectations are violated, and this violation provokes reflection.
- It involves **reframing** -- not just adjusting within the current frame, but potentially reconceiving the problem. The architect does not just move the stairwell; they reconceive the building's circulation pattern.
- It is **embodied in the action** -- the reflection is not a separate cognitive act that precedes action. It is woven into the action itself. The musician's fingers adjust as the ear perceives.
- It produces **tacit knowledge** -- knowledge that is embedded in the practitioner's future practice without necessarily being articulated. The developer who encounters the dependency learns something about the module structure that shapes their future work, even if they never write it down.

Schon argues that reflection-in-action is where the most powerful professional learning happens. Reflection-on-action is necessary and valuable -- it produces shareable, explicit knowledge -- but it is insufficient. The knowledge that matters most for practice is the knowledge that is produced *in* practice, by the practitioner's ongoing conversation with the situation.

### The Conversation with Materials

Schon's most evocative concept is the idea that practice is a *conversation with materials*. The architect does not simply impose a design on inert materials. The materials "talk back": the site has a slope that resists the planned layout, the structural requirements of the span create constraints that suggest new formal possibilities, the sketch on paper reveals relationships that were not visible in the architect's imagination.

This conversation has a structure:

1. The practitioner makes a move (sketches a layout, writes a function, drafts a plan).
2. The situation responds -- the materials "talk back." The sketch reveals unexpected relationships. The code exposes hidden dependencies. The plan, when confronted with reality, generates surprises.
3. The practitioner listens to the backtalk and adjusts. This adjustment is not mere error-correction (fixing a mistake within the original frame). It may involve reframing: the practitioner sees the problem differently because the materials have revealed something about its structure.

The key phenomenological claim is that the materials' backtalk is *informative* in a way that retrospective analysis cannot fully capture. The architect sees the unexpected sight line *while sketching*, in the context of the design activity, with all the tacit knowledge of the ongoing design session active. Reviewing the sketch later, after the session, the sight line may be visible but its significance -- its relationship to the flow of the design process, the decisions that preceded it, the alternatives that were live at that moment -- is diminished.

### Technical Rationality vs. Reflective Practice

Schon positions his work as a critique of what he calls "Technical Rationality" -- the dominant epistemology of professional practice inherited from positivism. Under Technical Rationality, professional practice is the application of theoretical knowledge to practical problems. The engineer applies physics. The doctor applies biology. The manager applies organizational theory. The relationship between theory and practice is one-directional: theory is produced in the academy and applied in the field.

Schon argues that this model profoundly misrepresents what practitioners actually do. Professional practice involves:

- **Ill-structured problems**: Real problems do not arrive pre-formatted for the application of theory. They are messy, ambiguous, and entangled with other problems. The practitioner must *set* the problem before solving it -- and problem-setting is itself a form of reflection that no theory dictates.
- **Unique situations**: Every practice situation is in some respects unique. The standard theory covers the general case, but practice deals with the particular case, which always has features the theory does not address.
- **Value conflicts**: Practice involves competing values that theory cannot adjudicate. The architect must balance aesthetics, cost, function, and client preference. The developer must balance code quality, delivery speed, maintainability, and team capacity. Theory provides no algorithm for value trade-offs.

Reflective practice replaces Technical Rationality with a different model: the practitioner as someone who navigates unique, ill-structured, value-laden situations through ongoing reflection -- a conversation with the situation that produces knowledge not reducible to the application of prior theory.

### Reframing

When reflection-in-action reveals something unexpected, the most powerful response is not to solve the problem within the existing frame but to *reframe the problem*. Reframing is the act of seeing the situation under a different description -- one that transforms what counts as a solution.

Schon's classic example: a group of product designers trying to improve a synthetic paintbrush. Within the frame "make the synthetic bristles more like natural ones," progress was incremental and unsatisfying. Reframing -- "a paintbrush is a kind of pump that distributes paint through capillary channels" -- opened entirely new design possibilities. The problem was not "better bristles" but "better channels."

Reframing is not optional decoration on top of problem-solving. It is often the decisive move. Most professional learning consists not in finding better solutions to well-framed problems but in discovering better frames for ill-structured situations.

### Translation to GSD: Honest Displacement

Translating Schon's framework to an automated system requires an honest accounting of what survives the translation and what does not.

**What is lost:**

- **Surprise as a felt quality.** Schon's surprise is phenomenological: the practitioner *feels* the discrepancy between expectation and reality. This felt quality is what makes surprise informative -- it directs attention, motivates reframing, and carries tacit information about the practitioner's expectations. A system that detects a deviation between plan and execution has identified a discrepancy, but it has not been surprised. The affective dimension is absent.
- **Backtalk from materials.** Schon's conversation with materials is bidirectional: the practitioner acts, the materials respond, the practitioner is changed by the response. A system that processes codebase state does not receive "backtalk" -- it processes data. The phenomenological structure of a conversation, in which both parties are changed by the exchange, is absent.
- **Genuine reframing.** Reframing requires seeing the situation *anew* -- under a description that was not available within the previous frame. This requires a kind of creative perception that breaks with existing categories. The system can present alternative framings from its training data and case history, but generating a genuinely novel frame -- one that neither the user nor the system's training anticipated -- is not something the system can be designed to do reliably.

**What survives:**

- **The temporal structure.** The distinction between information available during execution and information available after execution is real, design-relevant, and independent of phenomenology. A signal surfaced during phase execution (while the developer is making decisions) is more actionable than the same signal surfaced in a post-phase reflection report. The timing dimension of Schon's framework translates directly to system design.
- **Prediction error as a functional analogue to surprise.** Under predictive processing frameworks (Friston, Clark), surprise is operationalized as prediction error: the discrepancy between what was predicted and what was observed. GSD Reflect can detect prediction errors: the plan said 3 files would be modified, execution touched 7. Whether this constitutes "surprise" depends on whether one adopts a phenomenological definition (it does not -- there is no felt quality) or a functionalist definition (it does -- there is a measurable prediction error with informational content). The system can detect, measure, and surface prediction errors. It cannot be surprised.
- **The support role.** The honest translation of Schon to GSD Reflect is this: the system is not the reflective practitioner. It is the *associated context that feeds the practitioner's in-action reflection*. When the developer is mid-execution and encounters something unexpected, the system can surface relevant knowledge -- prior signals from similar situations, lessons that may apply, patterns that the current situation resembles. This supports the developer's reflection-in-action without claiming to perform it. The system is the research assistant who hands the architect relevant precedents while the architect is sketching.

### Double-Loop Learning

Chris Argyris, Schon's longtime collaborator, developed the distinction between single-loop and double-loop learning that is directly relevant to GSD Reflect's architecture:

**Single-loop learning:** Detecting and correcting error within existing goals, norms, and frames. The thermostat detects temperature deviation and adjusts heating. The system detects plan-execution divergence and surfaces a signal. The action is adjusted, but the governing frame is not questioned. "We deviated from the plan. How do we prevent that next time?"

**Double-loop learning:** Questioning the governing frame itself. Not "how do we prevent plan deviation?" but "is the plan the right frame? Are we planning at the right granularity? Are the success criteria themselves the problem?" Double-loop learning modifies the norms, values, and assumptions that govern single-loop learning.

GSD Reflect's signal collection, pattern detection, and lesson extraction are single-loop: they detect problems and propose corrections within the existing framework. The system's *deliberation* mechanism (`.planning/deliberations/`) is where double-loop learning happens -- where the framework itself is examined and potentially revised. The philosophical deliberations in this directory are themselves instances of double-loop learning: questioning what "reflection" means, what "improvement" requires, whether the system's categories are adequate.

The Argyris extension of Schon's framework makes explicit what is implicit in the reflection-in-action / reflection-on-action distinction: reflection-on-action tends toward single-loop learning (analyzing what happened and adjusting within the frame), while reflection-in-action is more likely to produce double-loop learning (reframing the problem because the situation's backtalk reveals that the frame is inadequate). This is another reason why reflection-in-action is the more powerful form: it is more likely to produce the kind of learning that changes the frame, not just the actions within it.

## Relevance to GSD Reflect

GSD Reflect is named for reflection. Schon's framework reveals that the system currently implements only one of two temporal modes of reflection -- the less powerful one.

**`/gsdr:reflect` is reflection-on-action.** The reflection command runs after phase execution. It analyzes accumulated signals, identifies patterns, generates a report. This is valuable: it produces explicit, shareable knowledge that persists across sessions. But it is retrospective. The developer has already made the decisions that the reflection evaluates. The lessons extracted are available for *future* phases, not for the phase just completed. This is exactly Schon's reflection-on-action: necessary, but insufficient for the kind of learning that transforms practice.

**Knowledge surfacing during execution would be reflection-in-action support.** If the system could surface relevant context *during* phase execution -- "you are about to modify the installer; the last three times installer modifications were planned, scope expanded by 2x" or "this pattern of rapid file creation without tests has preceded quality issues in phases 28 and 34" -- it would support the developer's reflection-in-action. The developer, mid-execution, could adjust in real time based on relevant precedent. The system would not be performing reflection-in-action (it cannot be surprised, it cannot reframe), but it would be providing the contextual enrichment that makes the developer's reflection-in-action more informed.

**The timing dimension matters as much as the content dimension.** Schon's framework reveals that *the same information* has different value depending on when it arrives. A signal noting scope expansion is more valuable during the phase (when the developer can adjust) than after it (when the developer can only document). The system's current architecture treats all signals as equivalent regardless of timing. A Schon-informed design would distinguish between signals that should be surfaced immediately (during execution) and signals that can wait for the reflection report (after execution).

**Double-loop learning maps to deliberation.** Signal collection and pattern detection are single-loop: they detect deviations and propose corrections. Deliberation (`.planning/deliberations/`) is double-loop: it questions the system's own categories, assumptions, and frameworks. The current system architecture separates these clearly -- signals are collected automatically, deliberations are initiated by the developer. Schon would approve of this separation while noting that the most powerful double-loop learning happens when single-loop detection reveals something that challenges the frame, triggering reframing in real time. The system's ability to escalate from single-loop detection to double-loop reframing is currently limited to human-initiated deliberation.

## Concept Mapping

| Framework Concept | GSD Reflect Analog | Current State | Praxis Implication |
|---|---|---|---|
| **Reflection-on-action** | `/gsdr:reflect` + signal reports: retrospective analysis of what happened during execution, producing explicit lessons and documented patterns | Fully implemented. The reflection command generates comprehensive reports. Signal collection occurs after phases. Patterns are identified across accumulated signals. | Reflection-on-action is the system's strength. Continue investing in its quality: richer signal context, more nuanced pattern detection, better lesson extraction. But recognize it as the less powerful temporal mode and design for its inherent limitation (retrospective knowledge cannot change past decisions). *Cite: schon/reflection-on-action.* |
| **Reflection-in-action** | Context surfacing at decision points during execution: presenting relevant precedents, similar signals, applicable lessons *while* the developer is making decisions | Currently absent. No mechanism surfaces knowledge during phase execution. The developer must explicitly query the KB or remember prior lessons. All signal analysis is post-hoc. | This is the most significant architectural gap Schon's framework reveals. Design mechanisms for surfacing relevant context during execution -- not as interruptions but as available enrichment. The system cannot reflect in action, but it can support the developer's in-action reflection by making relevant knowledge accessible at the moment of decision. *Cite: schon/reflection-in-action.* |
| **Conversation with materials** | System-codebase interaction during execution: the system acts (modifies files, creates artifacts), the codebase responds (tests pass or fail, dependencies resolve or break, scope expands or contracts) | The system modifies the codebase and observes results (test outcomes, file states), but there is no feedback loop that treats codebase responses as "backtalk" informing the next move within a phase. Each action is planned in advance; codebase responses are noted but do not reshape the plan in real time. | Model phase execution as an ongoing conversation, not a one-directional plan execution. When the codebase "responds" to a modification (a test fails, a dependency is revealed, scope implications become visible), treat this as informative backtalk that should be surfaced to the developer, not merely logged for post-hoc analysis. *Cite: schon/conversation-with-materials.* |
| **Reframing** | Deliberation: questioning the frame of the problem rather than optimizing within the current frame. When signals consistently indicate a problem that the current categories do not adequately capture, the response should be reframing (changing the categories) rather than adjustment (better solutions within the categories). | Reframing occurs in deliberation documents (this philosophy directory is an example: reframing "what should reflection produce?" instead of "how to make reflection reports better"). No automated mechanism detects when reframing is needed. | Surface indicators that reframing may be needed: signals that resist classification, patterns that do not fit existing categories, recurring problems that persist despite lessons. These are heuristic indicators that the frame may be inadequate, not triggers for automatic reframing (which the system cannot do). *Cite: schon/reframing.* |
| **Technical rationality** | Rigid rule application: applying lessons, thresholds, and automation rules as if they were theoretical knowledge being applied to practice. The assumption that better rules = better practice. | The system's architecture is broadly Technical Rationality: rules (lessons, sensors, thresholds) are formulated and applied to cases. The deliberation system is the exception -- it questions the rules. | Resist the assumption that the system's primary need is better rules. Schon argues that practice is not improved primarily by better theory (better rules, more sensors, finer-grained thresholds) but by better reflective capacity. Invest in the system's ability to support contextual judgment alongside its rule-application mechanisms. *Cite: schon/technical-rationality-critique.* |
| **Single-loop learning** | Signal detection, pattern identification, lesson extraction: detecting problems and proposing corrections within the existing framework. "CI failed 5 times. Lesson: monitor CI failures." | Well-implemented. The signal-to-lesson pipeline is the system's core single-loop mechanism. It detects deviations, identifies recurrence, and extracts corrective lessons. | Single-loop learning is necessary and the system does it well. But recognize its limitation: it optimizes within the frame without questioning whether the frame is adequate. When single-loop corrections accumulate without resolving the underlying issue, this is evidence that double-loop learning (reframing) is needed. *Cite: schon/double-loop-learning.* |
| **Double-loop learning** | Deliberation: questioning the framework's own assumptions, categories, and goals. "Are we detecting the right things? Are our categories adequate? Is 'reflection' the right concept for what we're building?" | Implemented through `.planning/deliberations/`, which explicitly questions the system's assumptions. Not automated -- requires human initiation. No mechanism detects when double-loop learning is needed. | Develop heuristic triggers for double-loop learning: persistent signals that resist resolution, lessons that are repeatedly surfaced but never reduce the problem, categories that accumulate edge cases. These heuristics cannot replace the developer's judgment about when reframing is needed, but they can flag conditions under which the frame may be inadequate. *Cite: schon/double-loop-learning, schon/reframing.* |

## Concrete Examples

### Example 1: The Absent Conversation with Materials in Phase 38

Phase 38 (installer resilience) illustrates both the power and the current absence of reflection-in-action support. The plan specified modifications to 3 files. During execution, the developer encountered cascading dependency changes that expanded the scope to 7 files. This is precisely Schon's "backtalk from materials": the codebase responded to the planned modifications by revealing dependency relationships that the plan did not anticipate.

In Schon's model, this backtalk should trigger reflection-in-action: the developer, mid-execution, perceives the dependency cascade, reframes the task ("this is not a 3-file change but a 7-file systemic modification"), and adjusts their approach accordingly. In practice, this probably happened -- the developer surely noticed the scope expansion and adapted. But the system played no role in supporting this in-action reflection.

What the system could have done: after the 4th file was modified (exceeding the plan's 3-file specification), surface a contextual note: "Scope expansion detected: 4 files modified against 3 planned. In phases 22 and 31, similar scope expansion was associated with incomplete test coverage. Consider pausing to update the plan or add test cases for the additional files." This is not reflection-in-action (the system is not surprised, does not reframe). It is reflection-in-action *support*: providing the developer with relevant precedent at the moment when it is actionable.

Instead, the scope expansion was captured as a signal (`sig-2026-03-04-phase38-scope-expansion`) during post-phase signal collection -- reflection-on-action. The information was preserved but was not available when it could have influenced the developer's in-action decisions.

### Example 2: Double-Loop Learning in the Reflection Output Deliberation

The current deliberation about what reflection should produce is itself an instance of double-loop learning. The single-loop question would be: "How do we make reflection reports more accurate?" This accepts the frame (reflection produces reports) and optimizes within it.

The double-loop question -- the one this deliberation is actually addressing -- is: "What should reflection produce? Is a report the right output? Are we reflecting on the right things?" This questions the frame itself.

Schon would note that this double-loop deliberation was triggered by the accumulation of single-loop evidence: 124 signals, 13 patterns, multiple reflection reports that raised questions about their own adequacy. The single-loop mechanism worked well enough to reveal its own limitations. Signals and patterns accumulated to the point where the question shifted from "what do these signals tell us?" (single-loop) to "are signals the right unit of observation?" (double-loop).

Argyris would add: the transition from single-loop to double-loop was not automatic. It required a human decision to initiate a deliberation that questioned the framework. The system collected signals that hinted at framework inadequacy, but it could not itself decide that the framework needed questioning. Designing heuristic triggers that detect conditions favorable to double-loop learning -- persistent unresolved signals, lessons that do not reduce problem recurrence, categories that accumulate exceptions -- would make the single-loop to double-loop transition more supported, though still ultimately dependent on human judgment.

### Example 3: Technical Rationality in Lesson Application

The system's lesson engine exemplifies Technical Rationality in Schon's sense. A lesson is a general principle extracted from specific experience: "Plans that modify shared infrastructure should be sequenced, not parallelized." The lesson engine applies this principle to future cases by matching situational features to the lesson's conditions.

Schon's critique: this treats lessons as theory to be applied to practice. But practice is always more particular than theory. The lesson says "shared infrastructure should be sequenced." The current situation involves modifying the reflection output format. Is this shared infrastructure? The lesson-as-theory gives no guidance on this particular case.

A reflective practitioner would not apply the lesson mechanically. They would engage in a conversation with the situation: "The reflection output is consumed by multiple features... but the modification is additive, not breaking... and the consumers are loosely coupled... this is not the same kind of sharing as the installer, where a break cascades catastrophically." This conversation with the materials (the code, the architecture, the dependency graph) produces a judgment that the lesson does not apply -- not because the lesson is wrong, but because this situation is different from the situations that generated the lesson.

The system's current architecture does not support this kind of conversational lesson-application. Lessons are surfaced and either applied or not. The system should present lessons as *starting points for a conversation with the situation*, not as directives. Include the original context, the conditions under which the lesson was learned, and explicit questions about whether the current situation matches.

## Tensions and Limitations

### 1. Can a System "Converse with Materials" or Only Process Them?

Schon's conversation with materials is phenomenological: the practitioner is changed by the encounter. The architect who sees the unexpected sight line is not the same architect who sat down to sketch. The conversation produces mutual transformation -- of the materials (the sketch is modified) and of the practitioner (their understanding of the design problem is changed).

The system processes codebase state. It detects file modifications, test results, dependency changes. It can surface these observations. But it is not *changed* by the encounter in the way Schon describes. The system after processing the codebase is the same system as before -- it has more data but not a transformed understanding. The phenomenological structure of conversation (mutual transformation through encounter) is absent.

The functionalist response: if the system updates its internal state (accumulates a new signal, adjusts a pattern's weight, surfaces a relevant lesson) in response to codebase changes, this is functionally a conversation -- information flows bidirectionally, and both "parties" are modified. Whether the modification constitutes "transformation" in Schon's sense depends on whether one requires phenomenological transformation (which the system cannot achieve) or functional state change (which the system routinely achieves).

For design purposes: the system can implement the *structure* of conversation with materials (act, observe response, adjust) even if it cannot replicate the phenomenological *content*. This structural implementation is valuable -- it is what enables reflection-in-action support.

### 2. Is the Temporal Distinction Sufficient Without the Phenomenological Content?

Schon's distinction between reflection-in-action and reflection-on-action is not merely about timing. Reflection-in-action has a distinctive phenomenological structure: surprise, attention redirection, reframing, adjusted action -- all happening within the flow of practice without stepping out of it. The system can replicate the timing (surfacing information during execution rather than after) but not the phenomenological structure.

The question is whether the timing alone is sufficient to justify citing Schon. If "reflection-in-action" is reduced to "information available during execution," the concept loses most of its philosophical content. Schon would likely object that the temporal distinction is inseparable from the phenomenological content -- that *why* in-action reflection is more powerful than on-action reflection is precisely because of the surprise, the backtalk, the reframing, and the embodied adjustment.

Our position: the temporal distinction is valuable in its own right, even stripped of phenomenological content. Information available during execution genuinely is more actionable than information available after execution. This is an empirical claim about decision-making, not a phenomenological claim about consciousness. We cite Schon for the temporal insight while being explicit that the phenomenological content does not translate: the system supports the timing of reflection-in-action without performing it.

### 3. Reframing Requires Seeing the Situation Anew -- Can the System Reframe, or Only the User?

Reframing is perhaps the most philosophically demanding concept in Schon's framework. To reframe is to see the situation under a genuinely new description -- one that was not available within the previous frame. The paintbrush designers did not deduce "pump" from "bristles." They *saw* the paintbrush differently.

The system can present alternative frames drawn from its training data and accumulated cases. If a situation resembles one that was previously reframed in the project's history, the system can surface that reframing as a precedent. But generating a genuinely novel frame -- one that neither the training data nor the project history contains -- requires a creative perception that the system may not possess.

The LLM can produce outputs that *look like* reframing: "instead of thinking about this as a sensor architecture problem, consider it as a data flow problem." But whether this is genuine reframing (seeing the situation anew) or sophisticated recombination of existing framings (producing a novel-seeming output from training patterns) is the functionalism-phenomenology question again. For practical purposes: the system can *propose* reframings and *present* alternative frames. Whether the reframing is genuine -- whether it actually captures something new about the situation -- requires the user's judgment.

## Praxis Recommendations

1. **Design mechanisms for surfacing relevant context during execution, not only after it.** The system's current architecture is exclusively reflection-on-action: all analysis happens post-phase. A Schon-informed design would add reflection-in-action support: surfacing relevant precedents, applicable lessons, and similar-case histories *during* phase execution, at points where the developer is making decisions. This does not require the system to perform reflection-in-action (it cannot). It requires the system to provide the contextual enrichment that supports the developer's in-action reflection. *Cite: schon/reflection-in-action, schon/reflection-on-action.*

2. **Treat codebase responses during execution as informative backtalk, not merely as data to log.** When execution reveals something unexpected -- scope expansion, unanticipated dependencies, test failures in unexpected areas -- surface this information immediately rather than deferring it to post-phase analysis. The backtalk's informational value is highest at the moment it occurs, when the developer's contextual understanding of the session is richest. Post-hoc signal collection preserves the *content* of the backtalk but loses the *context* of the ongoing conversation. *Cite: schon/conversation-with-materials, schon/reflection-in-action.*

3. **Distinguish between signal timing categories: immediate-actionable vs. retrospective-analytical.** Not all signals have equal temporal urgency. A signal noting scope expansion beyond plan (the plan said 3 files, execution is at file 5) is immediately actionable: the developer can adjust now. A signal noting that the phase's file-modification pattern resembles a prior phase's pattern is retrospective-analytical: it informs future planning but does not require in-phase adjustment. Design the signal system to distinguish between these temporal categories and surface immediate-actionable signals during execution. *Cite: schon/reflection-in-action, schon/reflection-on-action.*

4. **Develop heuristic triggers for double-loop learning.** Single-loop learning (signal detection, lesson extraction) is well-implemented. Double-loop learning (questioning the frame) currently requires human initiation. Design heuristic indicators that conditions may favor reframing: lessons that are repeatedly surfaced but do not reduce problem recurrence (the "same lesson, same problem" pattern), signals that resist existing classification categories, persistent issues that survive multiple corrective cycles. These indicators cannot automate reframing, but they can prompt the developer to initiate deliberation. *Cite: schon/double-loop-learning, schon/reframing.*

5. **Present lessons as starting points for conversation, not as directives.** Schon's critique of Technical Rationality implies that lessons (general principles from past practice) should not be applied mechanically to new situations. When surfacing a lesson, present it alongside its originating context, conditions of applicability, and questions about whether the current situation matches. The lesson is an invitation to reflect, not an instruction to follow. *Cite: schon/technical-rationality-critique, schon/conversation-with-materials.*

6. **Resist the assumption that more signals and more lessons constitute better reflection.** Schon's framework suggests that reflection quality is not about quantity of observations but about the temporal and contextual richness of reflection. A system that surfaces one highly relevant precedent at the moment of decision may produce more learning than a system that generates a comprehensive 50-signal retrospective report. Design for relevance and timing, not comprehensiveness. *Cite: schon/reflection-in-action, schon/technical-rationality-critique.*

7. **Maintain explicit architectural separation between single-loop and double-loop mechanisms.** Signal collection and lesson extraction (single-loop) serve different purposes than deliberation (double-loop) and should not be conflated. Single-loop mechanisms optimize within the frame; double-loop mechanisms question the frame. A system that treats deliberation as "more thorough signal analysis" has collapsed double-loop into single-loop. Preserve the distinction: signals detect and correct; deliberation reframes and reconceives. *Cite: schon/double-loop-learning, schon/reframing.*

## Citable Principles

- **schon/reflection-in-action**: Adjusting mid-practice based on what unfolds during the activity itself. More powerful than reflection-on-action because it operates when the practitioner's contextual understanding is richest and when adjustments are still actionable. Involves surprise (expectation violation), attention redirection, and potentially reframing. The most transformative professional learning happens in this temporal mode.

- **schon/reflection-on-action**: Retrospective analysis of practice after it is complete. Produces explicit, shareable knowledge (lessons, documented patterns, updated procedures). Necessary for knowledge preservation and transfer but insufficient for the kind of learning that transforms practice, because it operates after decisions have been made and the contextual richness of the practice moment has faded.

- **schon/conversation-with-materials**: Practice is a dialogue between practitioner and situation, not a one-directional application of theory to materials. The practitioner acts; the situation responds ("talks back"); the practitioner is changed by the response and adjusts. This bidirectional structure is what makes practice a source of knowledge, not merely an application of it. Systems that treat execution as one-directional plan-application miss the informational value of the situation's response.

- **schon/reframing**: Learning happens when the problem is reframed -- seen under a new description that transforms what counts as a solution -- not just when a better solution is found within the existing frame. Reframing is the hallmark of reflective practice and the mechanism by which reflection-in-action produces genuinely new understanding. It cannot be reduced to optimization within an existing frame.

- **schon/technical-rationality-critique**: Professional practice is not the application of theoretical knowledge to practical problems. Practice is messier than theory: problems are ill-structured, unique, and value-laden. Practitioners navigate through reflection, not through applied theory. Systems that model practice as theory-application (rules applied to cases) embody the Technical Rationality model and inherit its limitations.

- **schon/double-loop-learning**: Questioning the governing frame (goals, norms, assumptions, categories) rather than just optimizing actions within it. Single-loop learning detects and corrects errors within the frame; double-loop learning questions whether the frame is adequate. The most consequential organizational learning is double-loop: discovering that the problem is the frame, not the performance within it. (Developed primarily by Argyris; integrated with Schon's framework in Theory in Practice and Organizational Learning.)

---

*This deliberation should be referenced when: designing the temporal architecture of knowledge surfacing (when to surface vs. what to surface); evaluating the system's reflective capabilities (on-action vs. in-action); distinguishing between single-loop optimization and double-loop reframing; designing lesson-surfacing mechanisms (directive vs. conversational); considering the relationship between signal collection timing and informational value; assessing whether the system's categories need reframing rather than refinement.*
