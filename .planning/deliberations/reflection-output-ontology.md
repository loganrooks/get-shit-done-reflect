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

After 5 milestones (v1.12-v1.17), ~124 signals, 13 detected patterns, 0 formal lesson entries, and 2 reflection runs:
- **~114 signals untriaged** (53 lack lifecycle_state entirely, 61 explicitly "detected") — raw observations with no action taken
- **10 signals triaged** — the only lifecycle progression achieved
- **0 signals remediated** — despite phases actively addressing signal-identified issues
- **0 signals verified** — the system cannot confirm whether interventions worked
- **0 lesson files in KB** — reflection reports *propose* lessons (4 confidence updates, 2 new candidates in the latest run) but `lessons_created: 0` — they exist only as prose sections within reports, never formalized as standalone KB entries
- **The self-improvement loop is open** — knowledge accumulates but practice doesn't change. The situation is worse than "wrong kind of knowledge" — the pipeline doesn't reliably produce even the knowledge it claims to

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

Section A4 defined reflect's purpose as "what does it mean" (cross-phase interpretation) with output as "REFLECTION.md artifact + updated lesson entries + triage decisions." Section B1 described "Workflow Introspection & Adaptive Customization" as a future milestone — framed primarily as observation of *user interaction patterns* (command frequency, skipped steps, interruptions), not as reflection output that changes workflows. However, B1 introduced the **"patches" metaphor**: "User-specific overlays on `.claude/` files. Runtime customizations for a given user." This mechanism — modifying system files based on observed patterns — is conceptually adjacent to what this deliberation explores, but B1's *source* was user behavior observation while ours is reflection/signal analysis. The mechanism was envisioned; the connection to reflection output was not.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| KB signal files: 124 files, ~114 untriaged, 10 triaged, 0 remediated, 0 verified | Pipeline produces observations but no behavioral change; lifecycle never progresses beyond triage | Yes — grepped lifecycle_state across all 124 files (53 lack field entirely, 61 explicit "detected", 10 "triaged") | sig-2026-03-04-signal-lifecycle-representation-gap |
| Reflection report: `lessons_created: 0`, KB index: Lessons (0) | **No lesson files exist.** Lessons proposed in report prose (4 updates, 2 candidates) but never written as KB entries. Pipeline doesn't produce even the knowledge it claims to. | Yes — checked KB index, global+local lesson dirs, report frontmatter. **Original claim "6 lessons" falsified → corrected to "0 formal lessons, 6 lesson activities in report prose"** | informal |
| v1.16 deliberation Section B1 (line 250) | Workflow adaptation envisioned for *user* interaction patterns; introduced "patches" metaphor (file overlays). Mechanism relevant, but source (user behavior) differs from this deliberation (reflection/signal analysis) | Yes — read B1 directly. **Nuanced: patches concept is relevant, connection to reflection was not made** | informal |
| Prior closed-loop deliberation | Concluded that execution is broken (agent instructions unreliable → programmatic automation) but didn't question whether output type is correct | Yes (file read) | — |
| Conversation: user raised two-audience problem | Developer needs differ from end-user needs | Informal (conversation) | informal |
| Conversation: user requested philosophical grounding | Pragmatism, phronesis, dialectics explicitly invoked | Informal (conversation) | informal |

## Framing

**Step 2.5 complete.** Severe testing revealed the situation is worse than initially framed: lessons don't even exist as formal KB entries (0 files), only as prose in reflection reports. The pipeline's output problem is not "wrong kind of knowledge" but "knowledge that doesn't materialize into any actionable form."

**Core question:** Given that the reflection pipeline currently produces prose reports that don't materialize as formal artifacts, don't change agent behavior, and don't close the loop for either developers or users — what should reflection *concretely produce*, and through what mechanism should that output change how the system works?

**Adjacent questions:**
- Is the lesson→retrieval model (produce knowledge, surface it later) fundamentally adequate, or do we need a lesson→patch model (produce behavioral changes directly)?
- What is the Aristotelian distinction between phronesis and techne saying about our system's limits? Can a rule-based system achieve phronesis, or only approximate techne?
- How does Gadamer's concept of application (understanding always involves applying to one's situation) reshape what "local supplementation" means?
- Is the two-audience split real, or does it collapse under examination? (GSD developers ARE end users during dogfooding)
- What would Dewey's pragmatism say about knowledge that doesn't change practice? Is the cash-value of a "lesson" zero if it never modifies behavior?
- Does B1's "patches" mechanism apply here — could reflection produce file overlays that modify agent behavior, and if so, what's the boundary between helpful adaptation and Habermas's "colonization" (system logic overriding user judgment)?

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
