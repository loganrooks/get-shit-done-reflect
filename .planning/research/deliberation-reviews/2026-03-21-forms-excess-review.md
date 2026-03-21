# Review: Forms, Excess, and the Becoming of the Framework

**Date:** 2026-03-21
**Artifact under review:** `forms-excess-and-framework-becoming.md`
**Review status:** Provisional
**Current caution:** This review may still be underestimating the possibility that some of the artifact's best contribution is precisely to resist conversion into a tidy implementation program.

## 1. Scope and evidence reviewed

This review draws on:

- The deliberation's emergence narrative and conversation trajectory at `forms-excess-and-framework-becoming.md:54-108`.
- The artifact-excess table and broader analysis at `forms-excess-and-framework-becoming.md:112-146`.
- Framework signals about traceability, surfacing, and representational gaps:
  - `2026-03-04-signal-lifecycle-representation-gap.md`
  - `2026-03-04-deliberation-skill-lacks-epistemic-verification.md`
  - `2026-03-03-plan-verification-misses-architectural-gaps.md`
  - `2026-03-06-planner-deliberation-auto-reference-gap.md`
  - `sig-2026-03-02-requirements-lack-motivation-traceability.md`
  - `sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift.md`
- Arxiv-sanity signals about deliberation naming and spike/program mismatch:
  - `sig-2026-03-20-deliberation-naming-convention.md`
  - `sig-2026-03-19-spike-framework-scope-gap.md`

The review also uses the cross-project signal survey in `2026-03-21-deliberation-signal-landscape.md`.

## 2. What this deliberation is doing especially well

### A. It sees the problem at the level of artifact ecology, not single-template bugfixes

This is the strongest of the four deliberations on the relation between artifact form and framework memory.

It does not stop at "the DECISION template pressured closure." It notices a broader recurring pattern:

- signals can capture observations but may not hold framework-level critique cleanly
- deliberations can hold some escalation but not the whole conversational path
- review protocols may preserve findings while still losing how those findings emerged

That broader scope is supported by the signal field. The relevant framework signals do not point to one isolated bug. They point to repeated failures of routing, traceability, and self-description:

- lifecycle states exist but are not exercised
- motivations do not stay linked to requirements
- deliberations are not automatically surfaced to planning
- KB authority drifts across global and local stores

So the deliberation is well-aimed when it treats "what the artifact could not hold" as a framework-level issue.

### B. It preserves the process trajectory rather than only the endpoint

The "How the conversation developed" section at `forms-excess-and-framework-becoming.md:74-94` is one of the most practically valuable pieces of writing in the set.

Why it matters technically:

- it shows how framing shifted
- it shows which questions were opened by which pushbacks
- it makes clear that some of the important conclusions were not prefigured in the initial task

That is exactly the sort of history the current artifact system often loses. The review plan and the signal field both reinforce this point.

### C. It keeps honest incompleteness available

The recommendation section is not pretending the tension can be solved once and for all. That is probably right. The deliberation is strongest where it argues that the framework needs ways of living with remainder, not just more ways of pretending it has absorbed remainder.

Translated into design language, that suggests:

- not every unresolved pressure should be forced into the main artifact body
- some artifacts may need sidecar traces or explicit overflow policies
- some documents are better treated as open orientation than as conclusion-seeking decision vehicles

## 3. What this deliberation seems to be pushing toward in design terms

The artifact seems to be arguing for a more layered memory model:

- primary artifacts for decisions or current positions
- process traces for how the position formed
- links across sibling artifacts when one document cannot hold the full question
- explicit room for artifacts that remain open and function as orientation rather than as decision machines
- some way of recording that an artifact's own form distorted, flattened, or excluded part of the work

This is highly relevant to GSD because several existing signals already show that the framework struggles with this:

- signal lifecycle states exist but misrepresent reality
- requirements are not traceable to motivations
- deliberations are easy to forget unless explicitly surfaced
- local/global KB splits lose authority and continuity

So this deliberation is not merely abstract. It is pressing on real framework pain.

## 4. Main gaps, underdeveloped areas, and risks

### A. It still lacks a strong decision rule for when the apparatus should change

This is the central unresolved gap.

The deliberation argues for:

- lightweight prompts
- conversational traces
- reflexive markers
- dialogue as practice
- honest incompleteness

But it does not yet decide clearly:

- what should become part of the apparatus
- what should stay as human practice
- what should become a sidecar artifact
- what should deliberately remain outside formal capture

That matters because different responses produce different failure modes:

- too much apparatus and remainder becomes bureaucracy
- too little apparatus and important history stays invisible or gets lost

### B. It risks becoming too universal

The deliberation is powerful partly because it generalizes. But that also creates a risk: if every problem is treated as a form/excess problem, the framework may lose the ability to distinguish:

- ordinary implementation bug
- missing routing or discovery mechanism
- weak workflow review
- genuinely deep representational limit

That distinction matters for roadmap discipline. Some problems call for code. Some call for template changes. Some call for a better social practice. Some call for restraint.

### C. It is better at diagnosis than staging

Like the spike deliberation, this artifact is better at describing the structural pressure than at ordering interventions by discriminative value.

For example:

- process trace support seems near-term and high value
- sidecar artifact policy seems plausible but needs careful indexing discipline
- reflexive flags across artifact classes are more ambiguous
- "dialogue as practice" is important but much harder to operationalize

The artifact would be stronger with a staged "what to test first" sequence.

## 5. How current GSD could hold this, and how it might need to change

### Option 1: Strengthen deliberation artifacts only

Changes:

- frontmatter and scope discipline
- required process-trace section
- relevant sibling-artifact section
- explicit legitimacy for open, orientation-level deliberations

Why it seems plausible:

- low cost
- directly supported by `sig-2026-03-20-deliberation-naming-convention.md`
- aligned with existing deliberation-frontmatter work already underway

What could make it insufficient:

- some remainder may still exceed even a better deliberation artifact
- the same trace problem may recur in spikes, findings, and signals

### Option 2: Add sidecar overflow/trace artifacts

Changes:

- primary artifact stays readable
- companion artifact preserves conversation trajectory, reframings, and overflow material
- index/discovery layer links them explicitly

Why it seems plausible:

- this matches what the artifact itself demonstrates: sometimes one document cannot hold both position and path

Main risk:

- artifact sprawl
- discovery failure if indexing stays weak
- could worsen the existing planning-surfacing problem if not paired with better routing

### Option 3: Add lightweight reflexive trace support across artifact types

Changes:

- artifacts can note what they could not hold
- signals or reflections can point to that remainder
- qualified open states can remain visible

Why it seems plausible:

- framework-wide applicability
- aligns with the signal-lifecycle and traceability gaps

Main risk:

- easy to degrade into ceremonial metadata

### Option 4: Deliberately keep some remainder extra-systemic

Why it seems plausible:

- prevents the framework from trying to formalize everything
- acknowledges that some generative dialogue will remain partly outside artifact capture

Main risk:

- important developmental history may vanish
- future agents may see only polished outputs and miss the reframing work that produced them

## 6. Roadmap implications and dependency map

### Current v1.18

This should not become a current-milestone implementation phase.

Reasons:

- v1.18 is already busy with authority, migration, and integration work
- the artifact is direction-setting, not yet a bounded build package
- several enabling concerns it depends on are still unresolved, especially KB authority and deliberation discovery

### Next milestone placement

This looks like one of the earliest next-milestone drivers.

A plausible order is:

1. Deliberation artifact contract and discovery
2. Trace and overflow policy
3. Reflexive routing across artifact types
4. Then, only if needed, broader workflow adaptations

Why this order currently seems strongest:

- the signal field already shows routing, discovery, and traceability failures
- the lowest-risk way to learn is to improve the artifact layer first
- broader process changes should probably wait until those thinner changes have been tested

### How it should affect existing roadmap direction

The main directional implication is that future roadmap work should not treat deliberations as only conclusion-seeking documents. The project probably needs a clearer place for:

- open orientation artifacts
- process-trace artifacts
- sibling constellations
- overflow material that should remain linked but not force-fitted into the main body

## 7. What this deliberation is still missing

The most useful next revision would add:

- a sharper apparatus-change decision rule
- a staged intervention plan ordered by cost and reversibility
- explicit criteria for when sidecar artifacts are warranted
- a clearer boundary between what should become policy and what should remain a practice of attentiveness

## 8. Open tensions that should remain open

- preserving remainder versus bureaucratizing remainder
- richer artifact memory versus artifact sprawl
- framework-wide generalization versus preserving local specificity
- formal trace support versus the possibility that some of the most important dialogue remains only partially recordable

## 9. Current provisional judgment

This is probably the most important of the four for future artifact-system design.

Its greatest practical value is that it names a whole class of framework failure that otherwise gets mistaken for isolated documentation or workflow bugs. Its greatest risk is that, if taken too quickly as a universal theory, it could blur actionable distinctions the roadmap still needs.
