# Deliberation: Deliberation System Design

**Date:** 2026-03-03
**Status:** Open (preliminary design thinking)
**Trigger:** Phase 37 post-completion discussion revealed that the self-improvement loop (v1.17's focus) lacks a formalized deliberation stage. Design thinking about architectural gaps produced 4 new philosophical frameworks (Toulmin, Habermas, Gadamer, Aristotle) with direct implications for how deliberation should work.
**Affects:** Phase 38+ (extensible sensor architecture, automation features), and potentially a future milestone (M-C: Deliberation Intelligence)
**Related:**
- `.planning/deliberations/philosophy/toulmin.md` — argument structure for proposals
- `.planning/deliberations/philosophy/habermas.md` — limits of automated deliberation
- `.planning/deliberations/philosophy/gadamer.md` — cross-context knowledge transfer
- `.planning/deliberations/philosophy/aristotle.md` — practical wisdom cannot be formalized
- `.planning/deliberations/philosophy/INDEX.md` — full citable principles index (~97 principles)
- `.planning/deliberations/development-workflow-gaps.md` — Issue #3 (deliberation storage gap)

## The Gap

GSD Reflect's self-improvement pipeline currently has these stages:

```
Detect (sensors) → Collect (synthesizer) → Triage (reflect) → Remediate (plan linkage) → Verify (passive)
```

Missing from this pipeline: **deliberation** — the structured thinking that happens between "we detected a problem" and "here's what we'll do about it." Currently this happens ad-hoc in conversation, producing `.planning/deliberations/` files that are read manually but never formally consumed by the planning workflow.

The gap manifests concretely:
1. Signals surface issues, but the *design thinking* about how to address them has no formal home in the pipeline
2. Philosophy files contain rich design constraints (e.g., "multi-agent deliberation should cap at level 2") but planners never see them
3. Cross-phase design decisions get lost between sessions unless someone manually re-reads deliberation files

## Philosophical Constraints on Design

Four frameworks converge on a single conclusion: **deliberation should be a structured convention, not an automated multi-agent process.**

### Habermas: Automated deliberation is structurally limited

Multi-agent deliberation (agents arguing from different perspectives) is a *simulation* of communicative action, not genuine discourse. AI agents cannot satisfy the sincerity validity claim — they cannot genuinely mean what they say. This doesn't make the simulation worthless, but it caps the useful automation level:

- **Level 0-1 (manual/nudge):** Human deliberates, system provides structure and surfaces relevant context
- **Level 2 (prompt):** System presents multiple perspectives, asks human to weigh them
- **Level 3 (auto):** System conducts multi-agent debate — **capped here** because sincerity is impossible

*Cite:* `philosophy: habermas/communicative-vs-strategic` — automated agents are structurally strategic, never communicative

### Aristotle: Phronesis cannot be automated

Practical wisdom (phronesis) is the capacity to perceive what a particular situation demands. It is non-algorithmic (Nussbaum) and develops through habituated practice (hexis), not configuration. The system can structure deliberation but cannot guarantee its quality. Euboulia (excellence in deliberation) requires deliberating about the right ends, in the right way, at the right time — judgments no formal system captures.

*Cite:* `philosophy: aristotle/phronesis-not-techne` — deliberation quality is judgment, not schema compliance

### Toulmin: Proposals need explicit argument structure

Every deliberation proposal is an implicit argument. Making the argument structure explicit (claim, grounds, warrant, rebuttal) is the single highest-leverage improvement for deliberation quality. The warrant (why these facts support this conclusion) is almost always unstated and is where most arguments fail.

*Cite:* `philosophy: toulmin/warrant-explication` — implicit warrants are untestable; explicit warrants enable diagnosis

### Gadamer: Cross-project knowledge transfer requires interpretation

Surfacing a lesson from Project A in Project B is not information retrieval — it's a hermeneutic act. The lesson carries its producing horizon (architecture, phase, constraints). Naive surfacing (keyword match → inject) either erases the producing context or is ignored for surface-level mismatch. Fusion of horizons requires asking: "What question was this an answer to? Does an analogous question arise here?"

*Cite:* `philosophy: gadamer/fusion-of-horizons` — knowledge transfer without interpretation is cargo-culting

## Design Principles (Preliminary)

Based on the philosophical analysis and the user's stated preference for manual-first:

1. **Convention before automation.** Start with a file format and naming convention for deliberation files. Automation (if any) comes later, after the convention proves its value through use.

2. **Human deliberation, system support.** The system surfaces relevant context (signals, prior deliberations, philosophical constraints), structures the conversation, and records the output. The human does the actual deliberating.

3. **Explicit warrants.** Deliberation proposals should make their inferential bridge explicit: "We should do X (claim) because Y (grounds) and Y→X because Z (warrant), unless W (rebuttal)."

4. **Lifecycle tracking.** Deliberation states: `open → concluded → adopted → evaluated → superseded`. An open deliberation is active thinking. A concluded deliberation has a recommendation. An adopted deliberation's recommendation was implemented. An evaluated deliberation's outcome was assessed. A superseded deliberation was replaced by better thinking.

5. **Scoping clarity.** Deliberations belong in `.planning/deliberations/` (project-scoped) when they're about this project's design. They belong in the KB (`~/.gsd/knowledge/`) when their conclusions are cross-project.

## Open Questions

1. **How do planners discover relevant deliberations?** Currently: they don't, unless someone manually reads them. Options:
   - Phase researcher scans `.planning/deliberations/` as standard step (low effort, high impact)
   - ROADMAP.md phase descriptions reference relevant deliberations (manual but reliable)
   - Deliberation files declare which phases/requirements they affect (self-indexing)
   - CONTEXT.md per-phase includes pointers to relevant deliberations (discuss-phase creates these)

2. **Should deliberation quality be assessed?** Aristotle warns that euboulia is an achievement, not a schema. But Toulmin suggests structural completeness (warrant + rebuttal) is checkable. Minimum viable: check for warrant and rebuttal presence, don't assess quality.

3. **Where does deliberation fit in the pipeline?** Candidates:
   - After signal collection, before planning (signal triggers deliberation about approach)
   - During discuss-phase (deliberation IS the context-gathering conversation)
   - As a standalone activity (/gsd:deliberate) that produces files consumed later

4. **KB vs .planning/ for deliberation storage?** The philosophy files are project-scoped (they arose from this project's needs) but their conclusions are universal. The development-workflow-gaps deliberation is project-specific. Maybe: deliberation files live in `.planning/deliberations/`, concluded deliberation *lessons* get promoted to KB.

## Recommendation for v1.17

**Do not add a deliberation phase to v1.17.** The milestone scope (8 phases, automation loop) is already defined. Instead:

1. Continue using `.planning/deliberations/` as the convention (it's working — 5 deliberation files, 12 philosophy frameworks, ~97 citable principles)
2. When planning Phase 38+, manually reference this file and the philosophy files
3. Track "planner deliberation surfacing" as a requirement for the M-C milestone (Deliberation Intelligence)
4. If the convention proves valuable through v1.17, it validates the design for M-C

The user's instinct is correct: manual testing before automation, convention before system. The deliberation convention exists and works. Formalizing it is a future milestone concern.

## Practical Workaround for Planner Loading

Until the phase researcher is enhanced to scan deliberations:

1. When running `/gsd:discuss-phase N`, mention relevant deliberations — the CONTEXT.md it produces will carry them forward to planning
2. When running `/gsd:plan-phase N`, the human can mention "see deliberation file X" — the researcher will read what it's told to
3. This file's existence in `.planning/deliberations/` means any future session that runs `/gsd:resume-work` can surface it during status review
