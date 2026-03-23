---
id: delib-2026-03-20-community-feedback-pipelines
type: deliberation
project: get-shit-done-reflect
scope: framework
status: open
created: 2026-03-20T19:10:00Z
updated: 2026-03-23T00:00:00Z
author: logan-rooks
drafter: claude-opus-4-6
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.17.5+dev
trigger_type: conversation
trigger_signals: []
trigger_context: >
  During a session reviewing Spike 003's methodology, the question arose of how to share
  framework-level deliberations with developers. Currently the developer and user are the
  same person, but the framework is deployed across platforms and may have broader users.
  GitHub issues enforce a particular conversational form (reporter → triager → implementer)
  that doesn't accommodate deliberations, philosophical critiques, or sustained dialogue.
  What feedback pipelines would enable the kinds of exchange the framework needs?
affects:
  - gsd-reflect/community
  - gsd-reflect/contribution-workflow
  - gsd-reflect/feedback-integration
tags: [community, feedback-pipelines, dialogue, github-issues, discord, contribution-workflow]
related_deliberations:
  - spike-epistemic-rigor-and-framework-reflexivity.md
edit_history:
  - date: 2026-03-20T19:10:00Z
    author: claude-opus-4-6
    description: Initial framing from conversation
  - date: 2026-03-23T00:00:00Z
    author: codex-gpt-5.4
    description: >
      Revised after the stabilized review set to make the artifact's later-stage status
      explicit. Narrowed current implications toward orientation and future routing
      design, while emphasizing that internal traceability and planning integration
      should mature before broader community pathways are treated as near-term work.
---

# Deliberation: Community Feedback Pipelines and Dialogue Forms

<!--
Grounded in:
- Dewey's inquiry cycle
- Toulmin's argument structure
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism

Note: This deliberation is about the forms of dialogue themselves — which means it
is also about its own form. A deliberation about feedback pipelines is itself a
feedback artifact that may not fit the pipeline it's analyzing.
-->

**Date:** 2026-03-20
**Status:** Open
**Trigger:** Framework-level deliberations, philosophical critiques, and sustained methodological dialogue have no clear pathway from users to developers. GitHub issues handle bug reports and feature requests but enforce a conversational form that flattens richer kinds of engagement.
**Affects:** GSD Reflect community design, contribution workflow, feedback integration into development
**Related:**
- `spike-epistemic-rigor-and-framework-reflexivity.md` (sibling deliberation — raised the question)
- GSD upstream Discord exists (`https://discord.gg/gsd` per README)

## Situation

GSD Reflect is currently developed by one person who is also its primary user. The feedback loop is simplified: insights from use (like the Spike 003 methodology critique) feed directly into development because both roles are occupied by the same person. This won't scale.

At the same time, this remains a later-stage concern. The framework is still
effectively being used by a very small number of highly engaged participants,
and the internal routing, traceability, and deliberation-surfacing machinery is
not yet mature enough to responsibly support a broader community pathway. That
does not make the question unreal; it means the current artifact should be read
primarily as orientation and future design pressure, not as a near-term program
commitment.

The framework is deployed across multiple platforms (Claude Code, OpenCode, Gemini CLI, Codex CLI). As usage grows, users will encounter the same kinds of issues surfaced in this session — methodology gaps, template inadequacies, philosophical questions about the framework's assumptions — and will need ways to communicate these to developers.

GitHub issues exist as a feedback channel (upstream GSD has 1200+ issues). But issues enforce a particular form on dialogue:

- **Reporter → triager → implementer pipeline.** The user reports, a maintainer triages, someone implements. This works for bugs and feature requests. It doesn't work for deliberations (which are exploratory and multi-perspective), philosophical critiques (which resist reduction to actionable items), or sustained dialogue (which requires back-and-forth, not report-and-wait).

- **Atomic problem assumption.** Issues assume a discrete problem with a discrete solution. Many framework-level concerns aren't discrete — they're orientations, tensions, ongoing questions. "The spike workflow incentivizes premature closure" isn't a bug to fix; it's a structural observation that requires sustained engagement.

- **Flattened feedback types.** An issue about "Jaccard is insufficient for embedding comparison" and an issue about "the Said/Saying tension in formalization" would occupy the same form, but they require completely different kinds of engagement.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| This session's dialogue | Sustained philosophical-critical dialogue produced insights (Said/Saying framing, modes of betrayal, post-institutional research principles) that no issue form could hold | Yes — the deliberation it produced demonstrates the gap | informal |
| GSD upstream issues (1200+) | Bug reports and feature requests are well-served; no philosophical/methodological critiques visible in issue history | Untested — may exist but be invisible due to form constraints | informal |
| GSD upstream Discord | Exists but unknown whether it enables the kinds of dialogue discussed here | Untested | informal |
| sig-2026-03-20-premature-spike-decisions | Framework-level critique that originated as a signal but needed a deliberation to develop | Yes | sig-2026-03-20-premature-spike-decisions |

## Framing

**Core question:** What feedback pipelines — venues, formats, workflows — would enable users to engage with the framework in the different ways the framework's own use demands, and how would developer workflows integrate these?

**Adjacent questions:**

- To what extent can GitHub issues handle the feedback types that matter, and where do they fail?
- Would Discord (or a similar community platform) enable the kinds of dialogue GitHub can't? What would it gain and lose?
- Could multiple vectors work together — issues for bugs, Discord for quick feedback, a forum or shared document space for deliberations and sustained critique?
- How do we integrate non-issue feedback into development workflows? If a user produces a deliberation, how does it enter the developer's planning?
- Can we draw on reference designs from outside software engineering — academic peer review, editorial processes, philosophical colloquia, design crits — for how communities handle different kinds of intellectual exchange?
- The particular form of each feedback venue enables certain dialogues and forecloses others. How do we choose forms that enable what we need without pretending any single form is sufficient?

## How this question emerged

This deliberation was created during a session where the question of venue arose concretely. The session had produced a framework-level deliberation (spike epistemic rigor) and three signals about framework methodology. The natural question: how do we share this with the framework's developers?

The immediate answer — "file a GitHub issue" — prompted the user to observe that an issue couldn't hold what the deliberation contained. The deliberation was exploratory, philosophical, multi-perspective, and explicitly inconclusive. GitHub issues expect a problem and (ideally) a proposed solution. Trying to file "the Said/Saying tension in formalization as it applies to spike workflows" as an issue would either flatten it into a feature request ("add a reflexive signal type") or produce an issue so long and abstract that no maintainer would engage with it.

The user then asked about Discord, forums, and other venues. But the deeper question emerged: "I also don't really understand your ask" — challenging whether ANY existing venue was appropriate. The user observed that different kinds of engagement require different forms, and the particular form of each venue shapes what can be said within it. A Discord thread enables rapid exchange but loses depth. A forum preserves depth but lacks the back-and-forth fluidity that produced the actual insights. An issue tracks toward resolution when the question might resist resolution.

The user also connected this to the broader concern about forms and excess: the feedback pipeline is itself a form, and choosing it is choosing what kinds of feedback you'll receive. The venue you don't build is the feedback you'll never hear. This connects this deliberation to the forms-excess deliberation and to the responsibility deliberation — the absent voices that the framework's feedback forms can't accommodate are the absent Others whose needs shape (or should shape) the framework's development.

## Analysis

### Feedback types and their venue affordances

| Feedback type | Example | What it needs | GitHub issue | Discord | Forum | Shared docs |
|--------------|---------|--------------|-------------|---------|-------|-------------|
| Bug report | "signal creation fails when..." | Discrete, reproducible, actionable | Good | Bad (lost) | Overkill | Overkill |
| Feature request | "add spike design reviewer" | Discrete proposal, discussion | Good | OK (quick) | OK | Overkill |
| Methodological critique | "Jaccard is insufficient" | Evidence, nuance, qualification | Too structured | Too ephemeral | Good | Good |
| Philosophical reflection | "Said/Saying tension in formalization" | Sustained, revisable, multi-perspective | Wrong form | Too ephemeral | Possible | Best |
| Quick observation | "this template section feels forced" | Low friction, captured for later | Heavy | Good | Heavy | Heavy |
| Sustained dialogue | Back-and-forth like this session | Real-time or near-real-time, iterative | Bad | Possible | Possible | Possible |
| Deliberation submission | User-authored deliberation about framework | Long-form, structured, reviewable | Bad | Bad | Possible | Good |

No single venue covers all types well. The question is whether to optimize for one type (and accept the others are poorly served) or to build a multi-venue system (and accept the coordination cost).

### What existing communities do

This section is intentionally sparse — these are reference designs worth investigating, not analyzed options. The deliberation needs research here before it can evaluate.

- **Open-source projects with RFCs** (Rust, Python PEPs, React RFCs): Long-form proposals that get community feedback before implementation. Closer to deliberations than issues. But still assume a proposal → decision pipeline.
- **Academic preprint commentary** (PubPeer, arXiv comments): Critique of published work, sometimes sustained. Low participation rates.
- **Design communities** (Figma community, Dribbble): Show work, get feedback. Visual, not textual.
- **Philosophy colloquia**: Presenter shares work-in-progress, audience asks questions, presenter revises. Closest to what this session looked like. Not digitally native.
- **Discourse forums** (many open-source projects): Threaded, long-form, persistent. Better than Discord for sustained discussion. Heavier to maintain.
- **Discord with structured channels**: Quick feedback, community building, real-time dialogue. Ephemeral. GSD upstream already has one.

### Technical integration questions

- Can Discord messages/threads be integrated into development workflows? (Bots, webhooks, channel → issue pipelines)
- Can user-authored deliberations be submitted as PRs to a deliberations directory? (GitHub-native, but imposes Git literacy)
- Can signals from deployed instances be aggregated to a developer-facing dashboard? (Telemetry-like but for epistemic observations, not usage metrics)
- What consent/privacy considerations apply to feedback aggregation?

## Tensions

1. **Persistence vs fluidity.** Deliberations and philosophical critiques need persistent, revisable form. But the dialogue that produces them is fluid and iterative. Any venue that preserves the product loses the process; any venue that captures the process (chat logs) overwhelms with noise.

2. **Accessibility vs depth.** Low-friction feedback (Discord reactions, quick signals) captures more observations but at lower depth. High-depth feedback (deliberations, sustained critique) captures richer insights but from fewer participants. Optimizing for one sacrifices the other.

3. **Integration vs independence.** Feedback that integrates directly into development workflows (GitHub issues, PRs) is actionable. Feedback that remains independent (forum discussions, deliberations) preserves its critical distance. Integrating critique into the development pipeline risks domesticating it; keeping it separate risks ignoring it.

4. **Form shapes content.** This is the recursive problem: every feedback venue is a form that enables certain kinds of exchange and forecloses others. Choosing a venue is choosing what kinds of feedback you'll receive. The venue you don't build is the feedback you'll never hear.

### The ethical dimension of venue choice

This connects to the responsibility deliberation. Choosing a feedback venue is not a neutral infrastructure decision — it determines whose voices the framework can hear. A framework that only accepts GitHub issues will only hear from developers comfortable with GitHub. A framework that only has a Discord will only hear from people who join Discord servers. The feedback pipeline IS the framework's ear, and the ear's shape determines what the framework can listen to.

The absent voices — users who don't file issues, who don't join Discords, who don't write deliberations, whose experience of the framework is private — are the third in the community deliberation's terms. They're affected by the framework's design but have no pathway to influence it. The venue question is therefore also a responsibility question: how do we design feedback pathways that can hear from people who don't naturally participate in open-source community structures?

This session itself is evidence of the gap. The most productive feedback — the philosophical critique, the methodological pushback, the insistence on epistemic rigor — came through a Claude Code conversation, not through any designed feedback channel. It entered the framework's development because the user happens to also be the developer. If they weren't, this entire session's insights would have no pathway to influence the framework.

### What this session demonstrated about dialogue form

The session lasted many hours and produced four deliberations, seven signals, a revised spike DECISION.md, a new spike DESIGN.md, and cross-spike qualification notes. The insights emerged through sustained back-and-forth — pushbacks, corrections, escalations, philosophical turns that neither participant anticipated. No async venue (issues, forums, PRs) would have produced this. The real-time, iterative, responsive character of the conversation was constitutive of the insights, not just a convenient channel for delivering them.

This suggests that the framework's community design should include a venue for sustained synchronous dialogue — not just async artifacts. But synchronous dialogue doesn't scale (one conversation at a time, high attention cost). And it's ephemeral — the conversation's traces are in this context window, partially captured in the deliberations, but the conversational dynamics (the exact pushback that opened a new line of thinking, the correction that prevented overcorrection) are largely lost.

The tension between the productivity of real-time dialogue and the persistence of written artifacts may be irreducible. What we can do: ensure that the artifacts produced from dialogue carry traces of the dialogue's development (as these deliberations are now attempting), so that the written form is not a flattened summary but a document that shows its path.

## Recommendation

**Current leaning:** Multiple venues serving different feedback types remains
plausible, but this should currently be read as later-stage orientation rather
than as a near-term roadmap demand. Internal routing, traceability, and
deliberation integration probably need to improve first.

If the framework later reaches a scale where broader intake becomes timely, a
multi-venue design still seems more plausible than a single-channel answer,
with explicit awareness that each venue forecloses certain voices:

1. **GitHub issues** for bug reports and discrete feature requests — they work well for this and shouldn't be replaced.
2. **A deliberation submission pathway** (PRs to a deliberations directory, or a dedicated space) for framework-level critique and philosophical engagement — for users who want to contribute sustained thinking, not just problem reports.
3. **Discord or equivalent** for quick observations, community building, and lightweight dialogue — acknowledging it's ephemeral and not everyone joins.
4. **An explicit acknowledgment** that no venue combination is sufficient. Some
   feedback will never arrive because the available forms don't accommodate it.
   This isn't a problem to solve but a condition to name — the framework's
   community design should include a statement of whose voices it probably
   can't hear and why.

What this should currently change is narrower:

- future roadmap and context work should keep this as a later-stage pressure
- internal deliberation/signal routing should improve before broadening intake
- any later community design should preserve blind-spot channels rather than
  only collecting neat structured submissions

**Open questions blocking conclusion:**

1. What does the existing GSD Discord community look like? What kinds of exchange happen there? What's missing?
2. Would a `deliberations/community/` directory in the GSD Reflect repo — where users can submit deliberations as PRs — serve the long-form critique need? Does Git literacy create an accessibility barrier?
3. Is there appetite in the GSD community for meta-methodological engagement, or is the user base primarily interested in practical workflow improvements? (If the latter, the philosophical deliberation pathway may go unused — but its absence would still foreclose a kind of contribution.)
4. What's the minimum viable feedback pipeline that serves more than just bug reports?
5. Can we learn from how other frameworks (Rust RFCs, Python PEPs, Nix RFCs) handle community-driven design evolution?
6. How do we design for voices that don't naturally participate in open-source community structures?
7. Can an MCP server for planning operations (signals, deliberations, KB queries) lower the friction for structured feedback? Would exposing `create_signal` and `submit_deliberation` as MCP tools make it easier for agents and users to contribute without learning the framework's file conventions?
8. At what scale of real usage would this shift from anticipatory orientation to
   something worth concrete implementation work?

## Predictions

*Deferred until analysis is further developed.*

## Decision Record

**Decision:** Pending
**Signals addressed:** None directly — this deliberation is anticipatory, not reactive.
**Related deliberations:** `responsibility-alterity-and-methodological-praxis.md` (ethical dimension of venue choice), `forms-excess-and-framework-becoming.md` (form shapes content).
