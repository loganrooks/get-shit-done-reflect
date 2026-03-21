---
title: Deliberation Frontmatter, Provenance, and Workflow Consumption
status: open
date: 2026-03-20
scope: roadmap
planning_role: constrain
trigger_type: conversation-observation
trigger: >-
  Discussion in Epistemic Agency surfaced a design gap: deliberations can remain
  open and relevant across phases and even across roadmap decisions, but the
  current workflow treats them as manually discovered prose. The user also
  challenged the current format as too conclusion-oriented and insufficiently
  traceable.
created_by:
  runtime: codex-cli
  model: gpt-5.4
  reasoning_effort: xhigh
  workflow: gsdr-deliberate
  participants:
    - user
    - codex
affects:
  - deliberation template
  - gsdr-deliberate
  - gsdr-discuss-phase
  - gsdr-plan-phase
  - ROADMAP.md deliberation references
  - STATE.md deliberation context
  - CONTEXT.md steering contract
related:
  - ./deliberation-system-design.md
  - ./development-workflow-gaps.md
  - ./cross-runtime-upgrade-install-and-kb-authority.md
  - ./deployment-parity-v1.17.2.md
  - ../knowledge/signals/get-shit-done-reflect/sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift.md
---

# Deliberation: Deliberation Frontmatter, Provenance, and Workflow Consumption

## Situation

GSD Reflect already has a deliberation convention, but not yet a strong
deliberation contract.

There are really two separate gaps:

1. **Workflow-consumption gap:** open and concluded deliberations can matter to
   planning, but they are only surfaced by manual mention or ad hoc references.
2. **Trace/provenance gap:** the current markdown format records some context,
   but not enough structured information to reliably answer:
   - what kind of deliberation this is
   - who or what created it
   - which workflow/runtime/model produced it
   - what scope it governs
   - whether it should merely inform planning or actively constrain it
   - how the deliberation unfolded, revised its framing, and responded to
     counterevidence

The user's objection is correct: a deliberation is not merely a telos or a
conclusion. It is an unfolding inquiry. If we preserve only the final
recommendation, we lose the reasoning path, framing shifts, and falsified turns
that make the recommendation interpretable later.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| [deliberation-system-design.md](./deliberation-system-design.md) | The core gap is already named explicitly: deliberations are produced but "never formally consumed by the planning workflow" | Yes — file reviewed directly | informal |
| [deliberation-system-design.md](./deliberation-system-design.md) | The existing design already anticipates lifecycle tracking and asks how planners should discover deliberations, but leaves this unresolved | Yes — file reviewed directly | informal |
| [/home/rookslog/.codex/skills/gsdr-deliberate/SKILL.md](/home/rookslog/.codex/skills/gsdr-deliberate/SKILL.md) | Current workflow integration is indirect: planners only read deliberations when they are referenced in CONTEXT.md or ROADMAP.md | Yes — skill reviewed directly | informal |
| [STATE.md](../STATE.md) | Current state tracking uses a single manual "Deliberation context" pointer rather than a structured list of active deliberations with scope/status | Yes — file reviewed directly | informal |
| [/home/rookslog/.codex/get-shit-done-reflect/templates/deliberation.md](/home/rookslog/.codex/get-shit-done-reflect/templates/deliberation.md) | The standard template has header fields for date/status/trigger/affects/related, but no YAML frontmatter, no scope field, no planning-role field, no provenance fields, and no explicit process-history section | Yes — template reviewed directly | informal |
| Deliberation file inventory under `.planning/deliberations/` | Current status conventions are inconsistent (`Open`, `open`, `Active`, `Concluded (revised)`), which makes machine surfacing and filtered consumption unreliable | Yes — repo inventory checked directly | informal |
| [development-workflow-gaps.md](./development-workflow-gaps.md) | This gap was already noticed earlier as "deliberations are read manually, not automatically surfaced during milestone scoping" | Yes — prior deliberation reviewed directly | informal |
| [cross-runtime-upgrade-install-and-kb-authority.md](./cross-runtime-upgrade-install-and-kb-authority.md) | Cross-runtime same-repo work is currently frictionful because install authority, KB authority, and upgrade surfacing are not yet runtime-neutral invariants | Yes — prior deliberation reviewed directly | informal |
| [deployment-parity-v1.17.2.md](./deployment-parity-v1.17.2.md) | The project has already treated Codex/Claude/OpenCode/Gemini parity as a first-class concern for deployed artifacts, which strengthens the case that deliberation consumption should also not silently diverge by runtime | Yes — prior deliberation reviewed directly | informal |

## Framing

The narrow question is not just "should deliberations have YAML frontmatter?"

The deeper question is how deliberations should function as enduring inquiry
artifacts: rich enough to preserve provenance and diachronic development, but
structured enough that planning and roadmap work can actually discover and use
them.

**Core question:** What metadata and process-trace contract should deliberations carry so they remain discoverable, interpretable, and properly consumed by discuss-phase, plan-phase, and roadmap work without collapsing living inquiry into sterile conclusion logs?

**Adjacent questions:**
- Which fields belong in frontmatter versus the markdown body?
- Which metadata should be mandatory, optional, or derived?
- How should open roadmap-scoped deliberations influence phase CONTEXT without automatically blocking planning?
- Should the system preserve full transcripts, or only a curated process trace?
- How much backfill should be required for existing deliberations?
- How should deliberation surfacing behave when a user moves between Codex and Claude in the same repo and expects the same project memory with minimal friction?

## Analysis

Prior deliberations already establish that deliberation matters and that it is
currently under-integrated. The remaining gap is not whether deliberations
should exist, but how to make them legible and consumable without destroying the
fact that deliberation is an unfolding dialogue.

### Option A: Keep the Current Header-Only Convention

- **Claim:** Keep the current markdown structure and manual references; improve usage discipline rather than the artifact format.
- **Grounds:** Existing deliberations are readable, and the current skills already allow ROADMAP/CONTEXT/STATE references.
- **Warrant:** If human operators simply become more diligent about mentioning deliberations during discuss/plan workflows, the system may remain flexible without additional schema overhead.
- **Rebuttal:** This leaves the exact failure mode already observed: manual discovery, inconsistent statuses, weak traceability, and poor distinction between phase-scoped and roadmap-scoped deliberations.
- **Qualifier:** Weak. Adequate only if deliberations remain rare and manually curated.

### Option B: Add YAML Frontmatter Plus Curated Process Trace

- **Claim:** Standardize deliberations around YAML frontmatter for routing/provenance and require a body section that preserves the inquiry's unfolding, not just its conclusion.
- **Grounds:** Planning needs structured fields such as `status`, `scope`, and `planning_role`; later interpretation needs provenance such as runtime/model/workflow and a durable record of framing shifts, falsified claims, and revisions.
- **Warrant:** Frontmatter solves discoverability and filtering; a process-trace section preserves the irreducibly dialogical character of deliberation.
- **Rebuttal:** More structure increases writing burden and may tempt false precision, especially around agent provenance or "responsibility" when the human and system jointly produce the artifact.
- **Qualifier:** Strongest candidate. Balances operational usefulness with epistemic honesty.

**Likely frontmatter fields:**
- `title`
- `status`
- `date`
- `updated`
- `scope` (`phase`, `milestone`, `roadmap`, `project`, `cross_project`)
- `planning_role` (`inform`, `constrain`, `block`)
- `trigger_type`
- `trigger`
- `created_by.runtime`
- `created_by.model`
- `created_by.reasoning_effort`
- `created_by.workflow`
- `created_by.participants`
- `affects`
- `related`
- `supersedes`
- `superseded_by`

**Likely body additions beyond the existing template:**
- `Genesis`
  - what conversation, signal, verification gap, or reflection produced this deliberation
- `Process Trace`
  - key framing shifts
  - falsified assumptions
  - major option turns
  - revision milestones
- `Consumption Contract`
  - how discuss-phase / plan-phase / roadmap should use it while it remains open

### Option C: Full Transcript or Event Log as the Primary Deliberation Artifact

- **Claim:** Preserve complete conversational transcripts or event logs so the full deliberative history is available rather than summarized.
- **Grounds:** The user's philosophical point is real: dialogue exceeds summary, and the reduction from living discussion to polished document can erase important tensions.
- **Warrant:** If the complete unfolding is what matters, the system should not privilege compressed artifacts over original discourse.
- **Rebuttal:** Full transcripts are noisy, expensive, privacy-sensitive, hard to consume in planning, and likely to encourage indiscriminate archival rather than practical interpretation. They are better as optional supporting artifacts than as the primary workflow object.
- **Qualifier:** Useful as an optional attachment model, not as the default deliberation artifact.

## Provisional Recommendations and Reasoning

This section is intentionally not a final conclusion. It records the current
best recommendations, the reasons for them, and the parts that still need to be
tested or challenged.

These are not being presented as settled findings. They are current readings of
the design space based on the evidence reviewed so far. They may be misframed if
important usage context, historical constraints, or runtime behavior has not yet
been surfaced.

### Assumptions and Possible Misreadings

- This reading may over-weight artifacts and under-weight lived workflow
  practice. The files show what the system says about itself, not necessarily
  the whole reality of how maintainers actually use it.
- This reading may over-state the need for formalization because the pain is
  presently salient. Some of what looks like missing structure may instead be a
  missing habit of reference or review.
- This reading may under-estimate the value of fuller transcript preservation
  for some kinds of philosophical or architectural deliberation.
- This reading may conflate two problems that should remain partly separate:
  deliberation artifact quality and cross-runtime install/authority behavior.
- This reading may privilege neat routing semantics over authoring friction.
  A format that is elegant for later planners may still be too heavy for
  day-to-day use.

### 1. Metadata Contract: Add Frontmatter, but Separate Authority from Exhaustiveness

**Provisional recommendation:** Deliberations should gain YAML frontmatter, but
the frontmatter should carry only the fields that materially improve discovery,
scope interpretation, and auditability.

**Why this currently seems plausible:**

- The current artifact is too weak for routing. `Status`, `Trigger`, and
  `Affects` exist, but only in prose form and with inconsistent value shapes.
  That makes filtered discovery unreliable.
- Frontmatter is the cleanest place for fields whose primary consumer is the
  workflow rather than the reader of the prose.
- The important distinction is not "metadata or no metadata." It is
  "authoritative routing metadata" versus "everything we might someday wish we
  had." Only the former should be mandatory.

**Current provisional split:**

Mandatory:
- `title`
- `status`
- `date`
- `scope`
- `planning_role`
- `trigger_type`
- `trigger`
- `affects`
- `related`

Best-effort provenance:
- `created_by.runtime`
- `created_by.workflow`
- `created_by.model`
- `created_by.reasoning_effort`
- `created_by.participants`

Optional lifecycle:
- `updated`
- `supersedes`
- `superseded_by`

**Why not make more mandatory right away:**

- Some older deliberations do not have reconstructable agent provenance.
- The system should not refuse to create useful deliberations just because some
  provenance detail is unavailable.
- Overly strict mandatory fields would encourage fake precision, especially for
  shared human/agent authorship.

**Important caution:** provenance fields should be framed as production context,
not as final authority or blame. A deliberation produced in `codex-cli` by
`gpt-5.4 xhigh` is still a human-guided artifact. The metadata should help
later interpretation, not falsely imply that agency is fully machine-local.

**What could make this reading wrong:**

- If maintainers routinely need other fields first, such as decision ownership,
  review state, or links to discussion artifacts, then this split is too narrow.
- If backfilling best-effort provenance proves practically impossible, even the
  proposed "best-effort" set may be too ambitious.
- If the workflow can discover and consume deliberations adequately from body
  conventions alone, frontmatter may be less important than this reading
  suggests.

### 2. History Contract: Preserve Inquiry as a Curated Trace, Not a Final Memo

**Provisional recommendation:** Require a curated `Genesis` plus `Process Trace`
section in every nontrivial deliberation. Do not require full transcripts as
the primary artifact.

**Why this currently seems plausible:**

- The user's philosophical objection is sound. A deliberation is not identical
  with its recommendation. The framing shifts, failed assumptions, and option
  turns are part of the content.
- The current template already partially reflects inquiry structure
  (`Situation`, `Framing`, `Analysis`, `Predictions`), but it does not make the
  historical path explicit enough.
- Later continuation and evaluation depend on understanding not only what the
  current leaning is, but how it got there.

**Why a curated trace instead of full transcripts:**

- Full transcripts preserve too much. They are hard to read, hard to compare,
  and too easy to confuse with authoritative artifacts.
- A curated trace preserves the features that matter to future reasoning:
  - the starting unease
  - what evidence changed the framing
  - which assumptions were falsified
  - what options were seriously entertained
  - where the present open questions came from
- This keeps the artifact usable by planning and roadmap work.

**What the trace should capture minimally:**

- initial framing
- evidence that changed the framing
- substantive option shifts
- falsified or abandoned assumptions
- revision milestones

**What it should not try to do:**

- reproduce every conversational turn
- substitute for raw chat archives
- create a fictionalized narrative that hides disagreement or uncertainty

**What could make this reading wrong:**

- If future continuation work repeatedly needs details that a curated trace
  omits, then the curation layer may be too lossy.
- If writing good process traces proves too interpretive or burdensome, this may
  create the very artifact reluctance it is trying to solve.
- If some deliberation classes are inherently transcript-like, then one history
  contract may be too uniform.

### 3. Workflow Consumption: Open Deliberations Should Be Surfaced, Not Laundered into Decisions

**Provisional recommendation:** Formalize a discovery rule for deliberations,
but make `scope` and `planning_role` determine how they are consumed.

**Why this currently seems plausible:**

- The current gap is not merely that deliberations exist. It is that they are
  discoverable only by memory, manual mention, or lucky re-reading.
- At the same time, treating every open deliberation as binding would be
  disastrous. Planning would become hostage to unresolved thought.

**Current provisional behavior:**

- `open + inform`
  - may be surfaced in `CONTEXT.md` as background context or an active design
    question
- `open + constrain`
  - should be surfaced when relevant as a guardrail or unresolved tension that
    planning must at least acknowledge
- `open + block`
  - should force explicit handling: resolve, narrow, or consciously defer
- `concluded`
  - should behave as default steering unless challenged by new evidence
- `roadmap` / `project` scoped deliberations
  - should live in `STATE.md`, `ROADMAP.md`, or `PROJECT.md` references, then be
    selectively pulled into phase `CONTEXT.md`

**Why this is better than a simple open/closed rule:**

- Some open deliberations are exploratory and should not control execution.
- Some open deliberations represent serious unresolved architecture tension and
  should not be silently ignored.
- `planning_role` captures that distinction directly.

**What could make this reading wrong:**

- If `planning_role` proves too interpretive or unstable, it may produce false
  confidence rather than clarity.
- If planners treat any surfaced deliberation as de facto binding regardless of
  metadata, then the schema will not solve the social/workflow problem.
- If this distinction is better represented in ROADMAP/CONTEXT curation than in
  deliberation metadata itself, the proposal may be assigning the burden to the
  wrong artifact.

### 4. Cross-Runtime Parity: Deliberation Consumption Must Not Depend on Which Deployment the User Happens to Be Using

**Provisional recommendation:** A user should be able to move between Codex and
Claude in the same repo with minimal friction and see materially the same
project deliberation context. Deliberation surfacing should therefore depend on
repo-local artifacts and runtime-neutral discovery rules, not runtime-specific
memory or install quirks.

**Why this currently seems important:**

- The same-repo / multi-runtime expectation is not a side issue. It is one of
  the main tests of whether deliberation handling is truly project-scoped.
- If Codex sees one set of active deliberations and Claude sees another because
  of install precedence, KB location, or surfacing asymmetry, then the
  deliberation system is not functioning as shared project memory.
- This directly intersects the cross-runtime authority problem in
  [cross-runtime-upgrade-install-and-kb-authority.md](./cross-runtime-upgrade-install-and-kb-authority.md).

**What this implies:**

- deliberations should remain project-local artifacts
- surfacing logic should resolve from repo root, not runtime-local cwd accidents
- discuss/plan workflows should use the same discovery contract across runtimes
- hooks may improve UX on Claude, but must not be the sole source of
  deliberation visibility

**Important boundary:** this deliberation should not pretend to solve install
authority or upgrade prompting by itself. But it should explicitly require that
deliberation discovery be compatible with the broader cross-runtime authority
design.

**What could make this reading wrong:**

- If the main source of same-repo friction is entirely install authority and not
  deliberation handling, then this deliberation may be importing parity concerns
  too early.
- If runtimes legitimately need different surfacing idioms while still sharing
  the same underlying project context, then "material parity" may need to be
  defined more carefully than "looks the same."

## Tensions

1. **Trace richness vs workflow usability:** richer history makes interpretation better, but too much transcript-like material makes planning harder.

2. **Schema discipline vs deliberative openness:** metadata improves routing and discovery, but deliberation quality still depends on judgment, not schema compliance.

3. **Open inquiry vs accidental authority:** if an open deliberation is always surfaced, planners may treat it as binding even when it is exploratory; if it is never surfaced, it gets forgotten.

4. **Curated trace vs full history:** a curated process trace is more practical, but it always involves interpretation and omission.

5. **Project memory vs runtime behavior:** if deliberation discovery differs by
   Codex vs Claude deployment, the same repo effectively has different active
   memory depending on the runtime, which breaks the point of project-local
   deliberation artifacts.

## Recommendation

**Current leaning:** Option B, but only with a disciplined frontmatter contract
and an explicit refusal to reduce deliberations to final recommendations alone.

The current reading is that deliberations would likely benefit from a structured
frontmatter contract plus a required process-trace section. If that reading is
sound, the frontmatter would support discovery, scoping, and planning
consumption, while the process trace would preserve the historical unfolding:
where the framing began, what was falsified, what shifted, and why the current
recommendation or open question looks the way it does.

If this reading is sound, it would also imply a workflow rule:

- `open` deliberations remain open and can still be relevant
- `scope` and `planning_role` determine how they are surfaced
- `discuss-phase` should include a `Relevant Deliberations` section in CONTEXT.md
- roadmap- or project-scoped open deliberations should be referenceable from
  `PROJECT.md`, `ROADMAP.md`, and `STATE.md`, not forced into a single phase

It may also imply a parity rule:

- switching between Codex and Claude in the same repo should not materially
  change which deliberations are visible, relevant, or treated as active
  project context

**Open questions blocking conclusion:**
1. Which frontmatter fields should be mandatory versus best-effort?
2. Should `updated` and revision history live in frontmatter, body, or both?
3. Should full transcript/event-log attachments be supported as optional companion artifacts?
4. How much existing deliberation backfill is necessary before the system can rely on frontmatter-based discovery?
5. Where should the actual surfacing logic live: `gsdr-deliberate`, `gsdr-discuss-phase`, `gsdr-plan-phase`, or a shared preflight/indexing layer?
6. How should same-repo multi-runtime parity be tested so that Codex and Claude do not drift in deliberation surfacing?

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Relevant open deliberations will be surfaced more reliably during discuss-phase and roadmap work because `scope` and `planning_role` allow filtering | Compare CONTEXT/ROADMAP creation before and after adoption | Deliberations still need manual mention at roughly the same rate |
| P2 | Deliberation provenance and responsibility context will become easier to audit because runtime/workflow/model and trigger context are explicit | Inspect a later batch of deliberations after adoption | Reviewers still cannot tell who/what created a deliberation or why it was opened |
| P3 | The addition of a process-trace section will preserve framing shifts and falsified starts that are currently lost in conclusion-heavy summaries | Review future deliberations during continuation/evaluation | Later sessions still need to reconstruct the deliberative history from memory or chat logs |
| P4 | Status normalization plus frontmatter will reduce inconsistent open/active/concluded labels and make surfacing logic less brittle | Compare future deliberation inventory against current mixed status labels | Status drift remains ad hoc and difficult to query |

## Genesis

This deliberation emerged from a live design discussion in `epistemic-agency`
while evaluating how `get-shit-done-reflect` should handle roadmap-scoped open
questions. The immediate spark was the user's concern that some deliberations
are not phase-level at all and therefore disappear if the workflow only thinks
in terms of phase context.

That conversation then deepened into a second objection: even if deliberations
are surfaced, the current artifact format does not preserve enough of how the
deliberation came to be. The user explicitly rejected the idea that a
deliberation can be adequately represented by its final conclusion alone.

## Process Trace

1. **Initial framing:** Should open deliberations be optionally considered by discuss-phase and carried into CONTEXT?
2. **Evidence check:** Existing docs already acknowledge the consumption gap and manual nature of current surfacing.
3. **Framing shift:** The real problem is broader than open/closed status. It is about artifact legibility, provenance, and historical trace.
4. **Key inference:** Scope and planning-role metadata are needed so open deliberations can inform planning without automatically blocking it.
5. **Key philosophical correction:** A deliberation is not merely a decision memo. The artifact needs a durable record of its unfolding, not just its endpoint.
6. **Parity extension:** If deliberations are project memory, then a switch from Codex to Claude in the same repo should not silently produce a different deliberation horizon.

## Consumption Contract

Until this deliberation is concluded and adopted:

- `ROADMAP.md` and `STATE.md` may reference it as an active roadmap-scoped design tension.
- `gsdr-discuss-phase` should treat it as background when a phase depends on deliberation discovery, CONTEXT composition, or roadmap-level steering.
- `gsdr-plan-phase` should not treat it as binding policy yet, but should not ignore the questions it raises when planning changes to deliberation handling.

## Decision Record

**Decision:** {pending}
**Decided:** {pending}
**Implemented via:** not yet implemented
**Signals addressed:** none yet

## Evaluation

**Evaluated:** {pending}
**Evaluation method:** {pending}

| Prediction | Outcome | Match? | Explanation |
|-----------|---------|--------|-------------|
| P1: {pending} | {pending} | {pending} | {pending} |

**Was this progressive or degenerating?** (Lakatos)
{pending}

**Lessons for future deliberations:**
{pending}

## Supersession

**Superseded by:** {pending}
**Reason:** {pending}
