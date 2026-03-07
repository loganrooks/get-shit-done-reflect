# Deliberation: Reflection Output Ontology

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation -> problematization -> hypothesis -> test -> warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open -> concluded -> adopted -> evaluated -> superseded
-->

**Date:** 2026-03-07
**Status:** Open
**Trigger:** Conversation observation during `/gsdr:reflect --all` — user observed that after 123 signals, 13 patterns, 6 lessons, and 2 reflection runs, the system accumulates knowledge but produces no behavioral change. Questioned whether "lessons" are the right output category and whether the self-improvement loop serves both GSD developers and end users.
**Affects:** Reflection architecture, knowledge base design, self-improvement pipeline, user-facing workflows, next milestone scope
**Related:**
- .planning/deliberations/signal-lifecycle-closed-loop-gap.md (concluded — addresses lifecycle transitions but not output ontology)
- .planning/deliberations/v1.16-signal-lifecycle-and-beyond.md (designed the pipeline architecture)
- .planning/knowledge/reflections/get-shit-done-reflect/reflect-2026-03-07T053824.md (reflection that triggered this)
- sig-2026-03-04-signal-lifecycle-representation-gap (0 remediated signals after 5 milestones)
- philosophy: aristotle/phronesis — practical wisdom vs theoretical knowledge
- philosophy: aristotle/techne-phronesis-distinction — formalized rules vs situated judgment
- philosophy: pragmatism/cash-value — knowledge is meaningful only insofar as it changes practice
- philosophy: pragmatism/knowledge-through-use — understanding comes through application
- philosophy: dialectics/praxis — unity of theory and practice
- philosophy: cybernetics/requisite-variety — controller must match complexity of controlled
- philosophy: cybernetics/second-order-observation — system observing its own observation
- philosophy: gadamer/application — understanding always involves applying to one's own situation
- philosophy: habermas/colonization — when system logic overrides lifeworld concerns

## Situation

### The Observation

After 5 milestones (v1.12-v1.17), 123 signals, 13 detected patterns, 6 lesson candidates, and 2 reflection runs:
- **97 signals stuck at "detected"** — raw observations with no action taken
- **0 signals remediated** — despite phases actively addressing signal-identified issues
- **0 signals verified** — the system cannot confirm whether interventions worked
- **Lessons are declarative knowledge** ("X causes Y, do Z") that don't change agent behavior
- **The self-improvement loop is open** — knowledge accumulates but practice doesn't change

### The User's Deeper Question

The user raised two distinct concerns:

1. **Output ontology:** Should reflection produce "lessons" (declarative knowledge) or something more directly tied to development workflows (patches, config changes, workflow amendments)?

2. **Two audiences:** The system must serve both:
   - **(a) GSD developers** building the system itself — reflection tells them what to build next
   - **(b) GSD end users** in their own projects — reflection should help them work better *now*, through local supplements (retrieved lessons, local patches, workflow adaptations)

3. **Philosophical grounding:** The user explicitly called for drawing on "relevant and critical philosophy" in the deliberation, not just engineering analysis.

### Prior Deliberation Context

The **signal-lifecycle-closed-loop-gap** deliberation (concluded 2026-03-04) addressed WHY lifecycle transitions don't fire (agent instructions are unreliable; programmatic automation needed). It concluded with Options A+B+C (reconciliation script, KB watchdog, deliberation hardening).

But that deliberation assumed the pipeline's output (lessons) was correct and only the execution was broken. THIS deliberation questions the output itself: even if lessons were properly produced and lifecycle states properly tracked, would "lessons" actually close the loop?

The **v1.16-signal-lifecycle-and-beyond** deliberation (2026-02-25) designed the full pipeline architecture:
```
DETECT -> TRIAGE -> REMEDIATE -> VERIFY -> RECURRENCE CHECK -> LESSON
```

Section A4 defined reflect's purpose as "what does it mean" (cross-phase interpretation) with output as "REFLECTION.md artifact + updated lesson entries + triage decisions." Section B1 described "Workflow Intelligence & Adaptive Customization" as a future milestone — but framed it as observation of user interaction patterns, not as reflection output that changes workflows.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| KB index: 97 detected, 10 triaged, 0 remediated | Pipeline produces knowledge but no behavioral change | Untested (needs Step 2.5) | sig-2026-03-04-signal-lifecycle-representation-gap |
| Reflection report: 6 lessons, all declarative | Lessons are episteme (knowing-that), not phronesis (knowing-how) | Untested | informal |
| v1.16 deliberation Section B1 | Workflow adaptation was envisioned but deferred and not connected to reflection output | Untested | informal |
| Prior closed-loop deliberation | Concluded that execution is broken but didn't question whether output type is correct | Yes (file read) | — |
| Conversation: user raised two-audience problem | Developer needs differ from end-user needs | Informal (conversation) | informal |
| Conversation: user requested philosophical grounding | Pragmatism, phronesis, dialectics explicitly invoked | Informal (conversation) | informal |

## Framing

**PENDING — Step 2.5 (Severe Testing) and Step 3 (Question Framing) not yet completed.**

**Draft core question:** What should reflection produce — and how should its output close the self-improvement loop differently for GSD developers (who build the system) and end users (who use the system in their own projects)?

**Adjacent questions:**
- Is the lesson→retrieval model (produce knowledge, surface it later) fundamentally adequate, or do we need a lesson→patch model (produce behavioral changes directly)?
- What is the Aristotelian distinction between phronesis and techne saying about our system's limits?
- How does Gadamer's concept of application (understanding always involves applying to one's situation) reshape what "local supplementation" means?
- Is the two-audience split real, or does it collapse under examination? (GSD developers ARE end users during dogfooding)
- What would Dewey's pragmatism say about knowledge that doesn't change practice?

## Analysis

**PENDING — requires severe testing of claims and question framing first.**

## Tensions

**PENDING**

## Recommendation

**Current leaning:** Not yet formed — deliberation paused before analysis.

**Open questions blocking conclusion:**
1. Are the factual claims in the Situation section corroborated? (Step 2.5 pending)
2. What is the right framing? (Step 3 pending)
3. What options exist in the design space? (Step 5 pending)

## Predictions

**PENDING — recorded before implementation per Lakatos.**

## Decision Record

**PENDING**

## Evaluation

<!-- Filled when status moves to evaluated -->

## Supersession

<!-- Filled when status moves to superseded -->
