---
title: "Explore Skill Adoption and Dialogue Modes in GSDR"
status: open
date: 2026-04-09
scope: roadmap
planning_role: inform
trigger_type: conversation-observation
trigger: >-
  User compared GitHub Issues to the signal system and began articulating a vision
  for federated signals. The conversation itself was the kind of open-ended ideation
  that the upstream /gsd:explore skill is designed for — but explore wasn't installed.
  Discovering the skill prompted a deeper question: what does it mean to explore an
  idea in GSDR's philosophical context, and how does Socratic dialogue relate to
  other modes of inquiry the harness could support?
created_by:
  runtime: claude-code
  model: claude-opus-4-6
  workflow: conversation
  participants:
    - user
    - claude
affects:
  - workflow commands (Phase 62)
  - signal ontology
  - federated signal vision
  - dialogue infrastructure
  - questioning methodology
signals:
  - sig-2026-04-09-stale-claude-md-kb-path-misleads-agents
related_deliberations:
  - structural-norms-practical-judgment-and-harness-embodiment.md
---

## Context

Upstream GSD recently added `/gsd:explore` — a Socratic ideation skill that guides
users through open-ended thinking before committing to plans. The skill uses a
questioning.md reference for Socratic technique and domain-probes.md for domain-specific
follow-ups, then routes crystallized outputs to GSD artifacts (notes, todos, seeds,
requirements, phases).

The skill was not synced to the GSDR fork. Its absence was noticed during a conversation
that would have benefited from it — exploring the federated signal system vision.

## The Question

How should GSDR adopt and enhance the explore skill? Three sub-questions:

### 1. Quick Adoption vs. Deep Integration

**Decision (preliminary):** Two-stage approach.

- **Stage 1 (Phase 57.1):** Quick upstream adopt. Copy command, workflow, references.
  Rename to `gsdr:explore`. Minimal GSDR branding. One plan, quick execution. Gives
  the user basic explore immediately.

- **Stage 2 (Phase 62, WF-05):** Deep GSDR enhancement. Rewrite questioning.md for
  epistemic practice. Replace domain-probes.md with harness/signal/epistemic probes.
  Add signal-aware exploration (query KB during sessions). Allow "no artifact" as
  valid outcome. Connect to deliberation and signal workflows.

This split avoids the trap of trying to do philosophical design work as a quick task,
while giving immediate access to the basic skill.

### 2. What Makes GSDR Explore Different from GSD Explore?

The upstream explore is **instrumentalized Socratic method** — questioning serves
requirements extraction. The four-item checklist (what, why, who, done) is the real
structure; everything else makes getting there feel more natural.

GSDR's explore should differ in three ways:

**a) The exploration itself has value beyond artifacts.**
Upstream always routes to an artifact. GSDR should allow for the possibility that
the conversation's outcome is changed understanding — you think differently about
the problem even if you don't write anything down. This is Socratic *purpose*
(aporia, discovering what you don't know) vs. Socratic *technique* (asking good
questions to extract information).

**b) The questioner's assumptions are at risk.**
Upstream questions probe the *user's* vagueness. GSDR questions should also probe
the *harness's* assumptions — what does the signal system assume about how knowledge
works? What does the workflow assume about how development works? The explore session
can surface signals about the harness itself.

**c) Signal awareness.**
An explore session should be able to query the KB: "have we seen this pattern before?"
"what signals exist about X?" This requires Phase 59's KB query infrastructure for
the full version, which is why Stage 2 is in Phase 62 (post-59).

### 3. Dialogue Modes Beyond Socratic

The conversation surfaced a mapping of existing GSDR skills to philosophical dialogue
traditions:

| Mode | Tradition | GSDR Skill | Purpose |
|------|-----------|------------|---------|
| Socratic | Plato | `/gsdr:explore` | Reveal assumptions, discover unknowns |
| Dialectical | Hegel | `/gsdr:deliberate` | Thesis/antithesis, converge on decisions |
| Experimental | Peirce | `/gsdr:spike` | Test hypotheses empirically |
| Hermeneutic | Gadamer | *gap* | Interpret across contexts, fusion of horizons |
| Abductive | Peirce | *partly in reflect* | Inference to best explanation from patterns |

The **hermeneutic gap** is notable. When interpreting a signal from one project in
the context of another (the federated signal use case), that's a hermeneutic act.
The signal system supports detection and classification but not interpretation.
Whether this gap warrants a dedicated skill or is addressed by enhancing explore
and reflect is an open question.

The broader pattern: different modes of inquiry serve different purposes, and the
harness could support multiple dialogue modes rather than forcing everything through
one. This doesn't mean building five skills immediately — it means designing explore
with awareness that it's one mode among several, and that the questioning.md reference
should be explicit about what mode it's operating in.

## Open Questions

1. Should Stage 1 (quick adopt) include the upstream domain-probes.md as-is, or
   strip it and ship explore without domain probes until Stage 2?
2. How does explore interact with discuss-phase? Discuss is already Socratic-ish
   for phase-scoped questions. Does explore become the pre-discuss ideation step,
   or do they overlap?
3. The federated signal vision that triggered this deliberation — should it be
   captured as a seed (with trigger conditions for a future milestone) or as
   requirements for v1.21?
4. Is the hermeneutic gap a real gap or an intellectual indulgence? What concrete
   workflow failures would a hermeneutic skill prevent?

## Preliminary Recommendation

Proceed with Option B (two-stage). Insert Phase 57.1 for quick adopt. Add WF-05
to Phase 62 for GSDR enhancement. Capture the federated signal vision as a seed
targeting v1.21 or v1.22. Revisit the dialogue modes question when explore has been
used enough times to know what's actually missing vs. what's theoretically interesting.
