---
title: Deliberation Workflow Stratification and Research Routing
status: open
date: 2026-03-24
scope: roadmap
planning_role: constrain
trigger_type: conversation-observation
trigger: >-
  Live discussion surfaced a design mismatch in the current deliberation system:
  some deliberations are exploratory and question-forming, some are trying to
  resolve concrete design choices, some are interpretive or orienting, and some
  are roadmap-routing artifacts. The user observed that these should not all be
  treated under one workflow, and asked whether deliberations need a proper
  research workflow that varies by type.
created_by:
  runtime: codex-cli
  workflow: gsdr-deliberate
  model: gpt-5.4
  reasoning_effort: not-exposed
  participants:
    - user
    - codex
affects:
  - gsdr-deliberate
  - deliberation template
  - deliberation workflow routing
  - discuss-phase / plan-phase deliberation consumption
  - roadmap references to deliberations
  - future deliberation-related roadmap work
related:
  - ./deliberation-system-design.md
  - ./deliberation-frontmatter-provenance-and-workflow-consumption.md
  - ./deliberation-revision-lineage-and-citation-stability.md
  - ./forms-excess-and-framework-becoming.md
  - ./spike-epistemic-rigor-and-framework-reflexivity.md
  - ./development-workflow-gaps.md
  - ./cross-model-pr-review-routing-and-automation.md
---

# Deliberation: Deliberation Workflow Stratification and Research Routing

## Situation

The current deliberation system has become richer at the artifact level than at
the workflow level.

The active deliberation workflow now carries strong expectations around severe
testing, evidence bases, lifecycle status, provenance, and later planning
consumption. But the operational path is still mostly one generalized loop:
identify a trigger, gather context, test claims, frame the question, explore
options, record predictions, and optionally conclude.

That generalized loop is useful, but it is now carrying multiple kinds of
inquiry that are not actually the same:

1. **Exploratory / question-forming deliberations**
   - not trying to decide yet
   - mainly clarifying what the real question is
2. **Decision-oriented design deliberations**
   - comparing options and trying to reach a recommendation
3. **Interpretive / orientation deliberations**
   - clarifying lenses, boundary pressures, or philosophical constraints
   - not always reducible to immediate implementation decisions
4. **Roadmap / workflow-routing deliberations**
   - deciding where something should land in phases, context, or governance

The user’s observation is that these are being over-unified. That seems right.
The system already distinguishes deliberations by scope, planning role, and
lifecycle, but the actual workflow still behaves as though all deliberations
want the same progression and the same research posture.

The specific question about research sharpens the gap. Some deliberations need
no separate research pass because their job is to formulate a better design
question from existing project evidence. Others do need structured research,
especially when they are making comparative claims, importing outside reference
designs, or trying to settle a concrete design choice with non-local evidence.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `/home/rookslog/.codex/skills/gsdr-deliberate/SKILL.md` | The active workflow provides one generalized deliberation path with mode detection by lifecycle/status, but no explicit deliberation-type classification or differentiated research route | Yes — skill reviewed directly on 2026-03-24 | informal |
| [deliberation-system-design.md](./deliberation-system-design.md) | The original design already says deliberation should be structured convention, human-led, and lifecycle-aware, but leaves open where it fits and how it should vary by kind of inquiry | Yes — file reviewed directly | informal |
| [deliberation-frontmatter-provenance-and-workflow-consumption.md](./deliberation-frontmatter-provenance-and-workflow-consumption.md) | The project has already added scope, planning role, provenance, and workflow-consumption concerns, which implies deliberations already differ in how they are meant to be used | Yes — file reviewed directly | informal |
| [deliberation-revision-lineage-and-citation-stability.md](./deliberation-revision-lineage-and-citation-stability.md) | Planning may need to treat some deliberations as background, some as constraints, and some as blockers, reinforcing that one uniform consumption model is inadequate | Yes — file reviewed directly | informal |
| Deliberation inventory under `.planning/deliberations/` | Current deliberations already span multiple scopes (`framework`, `roadmap`) and planning roles (`inform`, `constrain`), and status/frontmatter conventions remain mixed across the corpus | Yes — repo inventory checked directly on 2026-03-24 | informal |
| [development-workflow-gaps.md](./development-workflow-gaps.md) | The older problem was storage and surfacing. That is only part of the current problem; the newer question is how different deliberation kinds should route through workflow | Yes — file reviewed directly | informal |
| [forms-excess-and-framework-becoming.md](./forms-excess-and-framework-becoming.md) | Some deliberations function more as design pressure and diagnosis than as staged intervention programs, so forcing all deliberations toward decision closure distorts their role | Yes — file reviewed directly | informal |
| [spike-epistemic-rigor-and-framework-reflexivity.md](./spike-epistemic-rigor-and-framework-reflexivity.md) | The framework already worries that reviewer/checklist formalisms can become false-certification theater, which applies here too if deliberation workflow types are over-standardized | Yes — file reviewed directly | informal |

## Framing

The narrow question is: "Should deliberations have a research workflow?"

The broader and more useful question is: "What kinds of deliberation does the
framework actually perform, and how should research, closure, and planning
consumption vary across those kinds?"

**Core question:** Should GSD Reflect stratify deliberations by inquiry role, with research as a conditional subworkflow rather than a universal stage?

**Adjacent questions:**
- What is the smallest workable deliberation type system that improves routing without causing artifact bureaucracy?
- Which deliberation types are expected to conclude into recommendations, and which are allowed to remain open as orientation?
- Should research be a separate sidecar artifact, an embedded section, or only a triggered escalation?
- How should planners and roadmap consumers read different deliberation types differently?
- When does a question-forming deliberation become a decision-oriented one?

## Analysis

### Option A: Keep One Deliberation Workflow, Improve It Incrementally

- **Claim:** Retain a single generalized deliberation workflow and only improve metadata, prompts, and consumption semantics.
- **Grounds:** The current workflow already supports multiple trigger types, severe testing, predictions, and lifecycle states. Keeping one workflow avoids fragmentation and cognitive overhead.
- **Warrant:** A single path is easier to teach and maintain. Many inquiries do share a family resemblance, even if their emphases differ.
- **Rebuttal:** The problem is no longer only missing metadata. The workflow now implicitly pressures all deliberations toward the same shape: evidence base, option comparison, recommendation, predictions. That shape fits some deliberations well and others poorly.
- **Qualifier:** Still viable for a small system, but increasingly strained.

### Option B: Stratify Deliberations by Type, With Distinct Workflow Variants

- **Claim:** Introduce a small set of deliberation types, each with its own workflow emphasis and expected outputs.
- **Grounds:** The artifact corpus already shows functional differentiation: some deliberations constrain roadmap/planning, some orient interpretation, some compare design options, and some mainly sharpen the question itself.
- **Warrant:** If inquiries have different aims, the workflow should not treat them as though they all want the same kind of completion. Type-aware routing would let the system ask different questions and require different evidence depending on the inquiry.
- **Rebuttal:** Too many types would create taxonomy theater. The framework could spend more time classifying deliberations than using them.
- **Qualifier:** Strong candidate if the type system stays small and operational.

### Option C: Keep One Deliberation Artifact, But Add Research as an Escalation Gate

- **Claim:** Do not split deliberation types formally yet. Instead, add a triage gate that asks whether the deliberation needs a dedicated research pass.
- **Grounds:** The user’s research question may be the highest-leverage correction. Some deliberations are adequately grounded in project-local evidence; others need reference designs, literature, or product/platform research before option comparison is warranted.
- **Warrant:** Research need may be easier to detect operationally than a full type system. This improves rigor without redesigning the whole artifact ecology immediately.
- **Rebuttal:** Research need is only one axis. Even with a research gate, the workflow may still push interpretive or question-forming deliberations toward inappropriate closure mechanics.
- **Qualifier:** Good intermediate step, but may not fully solve the over-unification problem.

### Option D: Split the Current Deliberation Family Into Separate Artifact Families

- **Claim:** Question-forming notes, design deliberations, interpretive essays, and roadmap-routing memos should become distinct artifact families rather than different kinds of "deliberation."
- **Grounds:** The current family is doing several jobs at once, and the language of deliberation may be too broad to preserve those differences cleanly.
- **Warrant:** Distinct artifact families make purpose legible immediately and allow specialized templates/workflows.
- **Rebuttal:** This risks premature institutionalization. The project is still learning what these inquiry forms are. Splitting too early could harden distinctions that are still fluid and productive.
- **Qualifier:** Potentially right later, but likely too strong right now.

## Tensions

- **Operational clarity vs taxonomy sprawl:** More workflow differentiation helps fit, but too much typing becomes framework overhead.
- **Rigor vs liveliness:** Research gates and structured outputs can improve warrant, but may flatten exploratory inquiry or interpretive work.
- **Question formation vs premature decisionism:** Some deliberations exist precisely because the real question is not yet known; pushing them too quickly into recommendations distorts them.
- **Planning utility vs philosophical excess:** Roadmap consumers need legible outputs, but some deliberations produce design pressure rather than decision packages.
- **Reusable workflow vs mode-appropriate inquiry:** One workflow is maintainable; differentiated workflows may be more truthful to what the system is actually doing.

## Recommendation

**Current leaning:** Option B with Option C nested inside it.

That means:

1. **Introduce a small deliberation type system**
   - `framing`
   - `decision`
   - `routing`
   - `orientation`

2. **Keep one artifact family for now**
   - do not split into multiple artifact families yet
   - use type-aware frontmatter/workflow behavior instead

3. **Make research conditional by type and evidence need**
   - `framing`: usually project-local investigation only; research uncommon
   - `decision`: research often needed when claims extend beyond local evidence
   - `routing`: research rare; usually consumes existing deliberations/audits
   - `orientation`: research optional and often lighter, aimed at grounding lenses rather than settling designs

4. **Do not require all types to conclude the same way**
   - `decision` and some `routing` deliberations may conclude into recommendations
   - `framing` deliberations may conclude by producing a sharper question
   - `orientation` deliberations may remain open as an active interpretive resource

**Open questions blocking conclusion:**
1. Are these four types enough, or is one important mode missing?
2. Should the type affect only prompts and expectations, or also file template sections?
3. When should a `framing` deliberation be superseded by a `decision` deliberation versus revised in place?
4. What is the lightest viable research sidecar for decision deliberations?
5. How should `plan-phase` and `discuss-phase` consume each type differently?

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Adding a small deliberation type system will reduce mismatches between artifact purpose and workflow expectations in the next 5-8 new deliberations | Review next deliberation artifacts for whether they read as forced into the wrong shape | New deliberations still regularly need ad hoc caveats explaining that the standard workflow does not fit their purpose |
| P2 | A conditional research gate will improve decision-oriented deliberations without making framing/orientation deliberations noticeably heavier | Compare authoring friction and evidential quality across a few new deliberations by type | Either decision deliberations remain weakly grounded or exploratory deliberations become bureaucratically heavy |
| P3 | Planners and roadmap work will consume deliberations more reliably once deliberation role is legible from type plus planning_role | Observe future CONTEXT/ROADMAP references after type-aware routing is introduced | Deliberation discovery and usage still depend on memory at roughly the same rate |
| P4 | Keeping one artifact family while differentiating workflow behavior will preserve enough simplicity for near-term adoption | Observe next 3-5 workflow revisions and user sessions | The type-aware system still feels too overloaded, pushing the project toward separate artifact families anyway |

## Decision Record

**Decision:** Pending — open deliberation
**Decided:** -
**Implemented via:** not yet implemented
**Signals addressed:** none yet formalized

## Evaluation

**Evaluated:** -
**Evaluation method:** not yet evaluated

| Prediction | Outcome | Match? | Explanation |
|-----------|---------|--------|-------------|
| P1: TBD | - | - | Not yet adopted |

**Was this progressive or degenerating?** (Lakatos)
Not yet evaluable.

**Lessons for future deliberations:**
The system’s current problem is no longer just that deliberations are unsurfaced.
It is that the framework has learned enough about deliberation to need
mode-appropriate workflows rather than a single generalized path.

## Supersession

**Superseded by:** -
**Reason:** -
