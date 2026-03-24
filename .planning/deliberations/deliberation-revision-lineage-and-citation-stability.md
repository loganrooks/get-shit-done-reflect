---
title: Deliberation Revision, Lineage, and Citation Stability
status: open
date: 2026-03-22
scope: roadmap
planning_role: constrain
trigger_type: conversation-observation
trigger: >-
  Live discussion raised a follow-on problem from deliberation consumption:
  once deliberations become routable and roadmap-relevant, the framework also
  needs a principled way to revise them, cite them, and preserve lineage
  without silently rewriting project memory.
created_by:
  runtime: codex-cli
  model: gpt-5.4
  reasoning_effort: xhigh
  workflow: gsdr-deliberate
  participants:
    - user
    - codex
affects:
  - deliberation lifecycle semantics
  - deliberation citation practice
  - ROADMAP.md deliberation references
  - STATE.md deliberation context
  - CONTEXT.md deliberation synthesis
  - gsdr-deliberate
  - gsdr-discuss-phase
  - gsdr-plan-phase
related:
  - ./deliberation-frontmatter-provenance-and-workflow-consumption.md
  - ./deliberation-system-design.md
  - ./cross-runtime-upgrade-install-and-kb-authority.md
  - ./structural-norms-practical-judgment-and-harness-embodiment.md
  - ./metaphor-awareness-framing-critique-and-harness-reflexivity.md
---

# Deliberation: Deliberation Revision, Lineage, and Citation Stability

## Situation

The project is moving toward a stronger deliberation contract:

- deliberations can remain open across phases
- roadmap and context formation may need to surface them formally
- planning may need to treat some deliberations as background, some as
  constraints, and some as blockers

That improvement creates a second-order problem. If deliberations become
important enough to steer roadmap and planning, then their own change-history
can no longer remain informal.

The live questions are practical and architectural:

1. When an old deliberation is revised, is the same artifact updated, or should
   a new sibling be created?
2. If a deliberation changes substantially, does it "reopen," become
   "revised-open," or remain the same object with new trace entries?
3. How should roadmap and phase references behave if the deliberation they point
   to later changes?
4. Should citations point to a stable file path, to a file plus commit hash, or
   to an explicit version marker?
5. How much revision history belongs inside the artifact, and how much should be
   left to Git history or sidecar records?
6. How can the system preserve enough lineage for trustworthy planning,
   reflection, and audit without making ordinary work pay unnecessary token or
   context costs every time a deliberation is read?

Without a better answer, the framework risks two opposite failures:

- silent rewriting: the same deliberation path means different things over time,
  but later readers cannot tell
- archive proliferation: every meaningful update creates a new file, and the
  deliberation graph becomes unreadable

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| [deliberation-frontmatter-provenance-and-workflow-consumption.md](./deliberation-frontmatter-provenance-and-workflow-consumption.md) | The project already recognizes that deliberations need scope, planning role, provenance, process trace, and workflow surfacing; it leaves revision/citation mechanics largely open | Yes — file reviewed directly | informal |
| [deliberation-system-design.md](./deliberation-system-design.md) | The original lifecycle exists (`open -> concluded -> adopted -> evaluated -> superseded`), but revision mechanics and citation stability are not specified | Yes — file reviewed directly | informal |
| [cross-runtime-upgrade-install-and-kb-authority.md](./cross-runtime-upgrade-install-and-kb-authority.md) | An open deliberation can already explicitly affect future phases, showing that roadmap and phase planning may need to cite deliberations before they are concluded | Yes — file reviewed directly | informal |
| Current roadmap structure in `ROADMAP.md` | Phase definitions currently do not carry a formal `Relevant Deliberations` section, so deliberation relevance still depends heavily on memory and manual mention | Yes — file reviewed directly | informal |
| Current practice in this repo | New deliberations have been added, older ones have been refined, and some artifacts now function as project memory across sessions, but revision lineage is still inferred from prose and Git rather than declared as part of the artifact contract | Yes — repo history and files reviewed directly | informal |
| [v1.17-plus-roadmap-deliberation.md](./v1.17-plus-roadmap-deliberation.md) | The roadmap already named meta-observability, token efficiency, and context consumption as things the system should measure, but this remained design intent rather than delivered capability | Yes — file reviewed directly | informal |
| [v1.17-REQUIREMENTS.md](../milestones/v1.17-REQUIREMENTS.md) | Deferred requirements already call for metrics capture, token/context trending, and model-use visibility, showing the problem was recognized but not yet implemented | Yes — file reviewed directly | informal |
| [CONCERNS.md](../codebase/CONCERNS.md) | Codebase analysis explicitly says actual context-window usage is not measured and recommends capturing execution-time usage for data-driven optimization | Yes — file reviewed directly | informal |
| [reflect-2026-03-02.md](../knowledge/reflections/get-shit-done-reflect/reflect-2026-03-02.md) | Reflection already proposed a concrete context-budget baseline spike, but no evidence of follow-through is visible here yet | Yes — file reviewed directly | informal |

## Framing

The narrow question is not just "how should we edit old deliberations?"

The deeper question is how a deliberation system should preserve **identity over
time**:

- enough stability that roadmap references and later planning can rely on it
- enough explicit change trace that later readers can tell what changed
- enough flexibility that inquiry can continue without creating a new file for
  every sharpened thought
- enough economy that the common case does not require multi-hop lineage
  traversal unless the task actually needs deep historical audit

**Core question:** What revision, lineage, and citation model should deliberations use so they can remain stable enough for roadmap/planning references while preserving visible change history, interpretive traceability, and lifecycle clarity?

**Adjacent questions:**

- Should substantial revision reopen a deliberation, or should it produce a
  superseding deliberation?
- When should a deliberation remain one evolving artifact, and when should it
  fork into a sibling or successor?
- How should `ROADMAP.md`, `STATE.md`, and `CONTEXT.md` cite deliberations so
  those references remain meaningful after updates?
- Is Git history sufficient for audit, or does the artifact need explicit
  revision markers inside it?
- Should citation practice differ for ordinary planning reference versus formal
  audit/reflection work?
- At what granularity, if any, should token or context-cost information be
  available so the project can tell whether richer traceability is buying enough
  value to justify its retrieval cost?

## Analysis

### Option A: Treat the file path as the enduring deliberation identity, with explicit revision trace inside the artifact

- **Claim:** A deliberation should usually remain one stable path while open; the artifact itself should record updates through `updated`, `Process Trace`, and possibly a `Revision Notes` section.
- **Grounds:** Planning and roadmap references work best when they point to a stable location. Requiring a new file for every change would make discovery and continuation harder.
- **Warrant:** If the same inquiry is still recognizably the same inquiry, preserving one path avoids fragmentation while explicit revision markers preserve interpretability.
- **Rebuttal:** A stable file path can still hide major reframing if revision discipline is weak. Git history exists, but many planning consumers will not inspect it.
- **Qualifier:** Strong candidate for incremental development within one inquiry.

### Option B: Create a new deliberation whenever the framing changes materially

- **Claim:** Major reframings should create a new deliberation file, with the old one left intact and the new one linked through `supersedes` / `superseded_by`.
- **Grounds:** This maximizes historical transparency and avoids overwriting the conceptual horizon that earlier roadmap or planning references originally meant.
- **Warrant:** If the object of inquiry changed, preserving a separate artifact better captures that change than mutating the old one until it quietly means something else.
- **Rebuttal:** This can easily produce deliberation sprawl, especially when good inquiry often refines the question rather than replacing it entirely.
- **Qualifier:** Strong candidate when framing, scope, or object of inquiry changes enough that earlier references would become misleading.

### Option C: Rely mostly on Git for change history and keep the artifact light

- **Claim:** Deliberation files should remain simple; Git history already preserves edits, and explicit in-file lineage should be minimal.
- **Grounds:** Version control already solves historical trace, and extra in-file revision machinery may be duplicative.
- **Warrant:** If the project team is comfortable using Git as the audit surface, the artifact itself can stay readable.
- **Rebuttal:** Many later consumers of deliberations will read the file, not the commit graph. If the artifact itself gives no clue that its meaning changed, Git is too indirect as the primary interpretive surface.
- **Qualifier:** Useful as a supporting layer, weak as the whole answer.

## Provisional Recommendations and Reasoning

These are not final conclusions. They are current readings of the design space
under incomplete evidence and should remain open to revision.

### Assumptions and Possible Misreadings

- This reading may overstate the need for explicit revision structure because the
  current deliberation set is unusually active and philosophically self-aware.
- It may understate how much Git already does for the small number of people who
  actually audit artifact history closely.
- It may privilege planner convenience over authoring ease.
- It may also be assuming that "stable citation" is always desirable, when in
  some cases visible discontinuity may be more honest.

### 1. Roadmap and context probably should reference deliberations directly

**Current provisional recommendation:** yes, but with lightweight semantics.

The current evidence suggests that open deliberations should not remain merely
discoverable by memory. If a deliberation materially concerns a phase or a
roadmap slice, the roadmap should be able to point to it directly.

That seems especially clear for:

- [cross-runtime-upgrade-install-and-kb-authority.md](./cross-runtime-upgrade-install-and-kb-authority.md), which already says it affects Phases 49-51
- the deliberation-frontmatter/workflow-consumption line, which likely affects
  how future `discuss-phase` and `plan-phase` work should ingest deliberations

**Why this currently seems plausible:**

- planning cannot integrate relevant deliberations if the roadmap never points to
  them
- open deliberations can matter before they are concluded
- the existing manual-only model is already documented as insufficient

**Current caution:** roadmap references should not launder open deliberations
into settled scope. A roadmap citation should mean "this phase should consider
this deliberation," not "this phase has already adopted its conclusions."

### 2. A stable path plus explicit in-file revision trace currently seems like the best default

**Current provisional recommendation:** while a deliberation remains the same
recognizable inquiry, keep one file path and record meaningful changes inside
the artifact.

That would likely mean:

- keep the path stable
- update `updated` when materially revised
- record revision milestones in `Process Trace`
- optionally add a short `Revision Notes` subsection only when a later change
  materially changes framing, scope, or recommendation

**Why this currently seems plausible:**

- roadmap and `CONTEXT.md` references stay stable
- continued inquiry does not automatically produce file sprawl
- the artifact itself preserves enough history for later readers who do not
  inspect Git

**What could make this wrong:**

- if revisions routinely become so extensive that the old and new artifact are
  effectively different questions
- if in-file revision markers become bloated or ceremonial

### 3. Reopening vs superseding likely needs a threshold distinction, not one rule

**Current provisional recommendation:** distinguish between:

- `continuation/revision of the same inquiry`
- `successor inquiry with materially changed framing`

Possible current threshold:

- **same file, same deliberation** when the core question and object of inquiry
  remain recognizably the same, even if the analysis or leaning changes
- **new successor deliberation** when one or more of these changes materially:
  - the core question
  - the scope
  - the planning role
  - the object being governed
  - the intended consumers

That suggests:

- ordinary revision does **not** reopen a concluded artifact automatically; it
  may instead become `open` again only if the same inquiry has genuinely become
  active once more
- supersession should be used when a new artifact is now the better home for the
  inquiry

This area is still underdetermined. The threshold will likely need examples
before it can be trusted.

### 4. Citation practice probably needs two levels

**Current provisional recommendation:** distinguish:

- **operational citation**
  - stable file path reference in `ROADMAP.md`, `STATE.md`, `CONTEXT.md`
  - purpose: discoverability and routing
- **audit-grade citation**
  - file path plus commit hash or revision marker when the exact version matters
  - purpose: reflection, evaluation, or controversy over what an artifact said
    at a particular time

**Why this currently seems plausible:**

- most planning consumers need stable discoverability, not archival precision
- some review/reflection contexts absolutely do need to know which version of a
  deliberation was being read

This split seems better than making every roadmap reference carry full version
syntax, which would quickly become unreadable.

### 5. Git should remain supporting infrastructure, not the sole interpretive surface

**Current provisional recommendation:** Git is necessary but not sufficient.

Git is excellent for:

- audit
- exact reconstruction
- diff inspection
- historical blame/trace

But it is too indirect to be the primary mechanism by which planners or future
contributors learn that a deliberation changed materially. The artifact itself
should surface enough of that history to be intelligible on its own.

### 6. Token and context efficiency should become an explicit acceptance criterion

**Current provisional recommendation:** revision and citation design should not
be judged only by traceability and interpretive richness. It should also be
judged by whether the common retrieval path is cheap enough for routine work.

There is already partial precedent for this in the repo:

- the old roadmap deliberation explicitly proposed meta-observability around
  token efficiency and context consumption
- v1.17 requirements deferred metrics capture and token/context trending
- codebase analysis later identified the lack of actual measurement as a live
  weakness
- reflection work already suggested a baseline spike for context-budget
  measurement

So the present gap is not that the project never noticed token cost. It is that
token-cost sensitivity has not yet been integrated into deliberation lineage and
consumption design itself.

**What this currently seems to imply:**

- routine planning should usually read the current effective deliberation plus a
  short "what changed" capsule, not the full predecessor chain
- deeper predecessor traversal should be exceptional and task-motivated
- roadmap citations should normally resolve to the current effective artifact,
  not force historical chain-walking
- audit or controversy work can still escalate to exact-version citation and
  full lineage traversal

**Current caution:** this should not collapse into "fewer tokens is always
better." The aim is cheaper access to the same practical understanding, not
compression for its own sake.

**Possible inspiration from RL-style thinking, used cautiously:**

- the analogy to credit-assignment is real: which added trace, lineage marker,
  or metric actually improved later planning or auditing?
- but the environment here is sparse, delayed, and heavily confounded
- naive reward-style optimization would likely overfit to easy proxies such as
  shorter context or faster completion rather than better judgment

So RL is more useful here as an analogy for hard attribution problems than as a
ready-made solution.

## Tensions

1. **Stable identity vs historical honesty:** one enduring file path helps
   routing, but too much mutation can make old references ambiguous.

2. **Artifact readability vs revision visibility:** explicit revision trace
   helps interpretation, but too much machinery makes the artifact harder to use.

3. **Roadmap consumption vs premature authority:** citing deliberations in the
   roadmap improves discovery, but can make open questions look adopted if the
   citation semantics are weak.

4. **Git sufficiency vs artifact self-description:** Git preserves history, but
   not all consumers will inspect it.

5. **Traceability vs routine token cost:** richer lineage helps audit and
   reflection, but ordinary planning should not need to pay multi-hop history
   cost just to find the current effective position.

## Recommendation

**Current leaning:** a hybrid between Option A and a thresholded use of Option B.

That means, provisionally:

- roadmap and phase definitions should be allowed to carry `Relevant
  Deliberations`
- those references should usually point to stable file paths
- open and concluded deliberations should record meaningful revisions inside the
  artifact itself
- major reframings should create successor deliberations linked by
  `supersedes` / `superseded_by`
- audit/reflection work should cite a specific version or commit when exact
  wording matters
- ordinary planning should normally resolve to the current effective artifact
  plus a bounded delta, reserving full lineage traversal for audit, reflection,
  or controversy

This is not yet a final framework rule. It is a current attempt to balance
traceability, usability, and lineage without either silent rewriting or runaway
artifact proliferation.

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Adding roadmap-level deliberation references will make relevant open deliberations show up more reliably in later phase context formation | Compare future CONTEXT creation before and after adoption | Relevant deliberations still depend on manual mention at roughly the same rate |
| P2 | A stable-path plus explicit-revision model will reduce ambiguity without causing major file sprawl | Observe next 5-10 substantive deliberation updates | Either updates remain opaque or new-file proliferation still becomes the norm |
| P3 | Two-level citation practice will keep roadmap references readable while still supporting precise audit later | Use it in at least one roadmap/planning cycle and one reflection/audit cycle | Either operational citations become too vague or audit citations still cannot recover what mattered |
| P4 | A current-effective-plus-bounded-delta access pattern will preserve most planning utility while reducing unnecessary lineage traversal | Compare a few planning/audit tasks before and after adoption | Routine planning still regularly requires multi-hop deliberation reading to recover the right context |

## Genesis

This deliberation emerged directly from a follow-on question in the ongoing
deliberation-consumption thread: once the roadmap and planning system start
referencing deliberations, how should revisions to those deliberations be
handled without losing traceability or misleading later readers?

The specific concern was not only technical versioning. It was also how to
leave intelligible traces of status changes, revisions, and citation meaning so
that future planning and reflection can understand what the artifact meant at
the time it was used.

## Process Trace

1. **Initial framing:** maybe this belongs inside the existing lifecycle/frontmatter deliberation.
2. **Framing shift:** the missing question is more specific: revision mechanics,
   lineage, and citation stability.
3. **Key distinction:** roadmap consumption and artifact revision are related but
   not identical problems.
4. **Key proposal:** use stable file paths for ordinary routing, but preserve
   exact-version citation for audit when needed.
5. **Open uncertainty:** the threshold between "same inquiry revised" and
   "successor deliberation" is not yet settled.

## Consumption Contract

Until this deliberation is concluded and adopted:

- `ROADMAP.md` may reference it only as an open roadmap-scoped design question.
- `gsdr-discuss-phase` and `gsdr-plan-phase` should treat it as background when
  planning changes to deliberation discovery, CONTEXT synthesis, or roadmap
  deliberation references.
- it should not yet be treated as settled citation policy.

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
