# Deliberation: Phase Scope Translation Loss — Audit Capability Gap

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-04-09
**Status:** Open
**Trigger:** Post-execution reflection — Phase 57.3 (audit-workflow-infrastructure) completed and passed 5/5 verification, but produced only reference documents and artifact migration. No `/gsdr:audit` invocable skill was built. When the user needed to run an investigatory audit on Phase 57, there was no command to invoke. User observation: "I needed that audit skill now, and somehow that wasn't conveyed. Perhaps the process inevitably led to it."
**Affects:** Phase scoping conventions, verification success criteria, REQUIREMENTS.md (AUDIT category), potential new phase for `/gsdr:audit` command, pipeline-level question of how user needs survive requirement capture
**Related:**
- `sig-2026-04-09-phase-573-deferred-audit-skill-no-command` (notable, manual — direct trigger)
- `sig-2026-04-09-agent-audit-outputs-ephemeral-no-artifact` (notable — adjacent failure mode)
- `sig-2026-04-09-discuss-context-written-without-reading-research` (notable — discuss-phase quality gap)
- `.planning/deliberations/forms-excess-and-framework-becoming.md` (open — governing: how formal systems handle what exceeds their categories)
- `.planning/deliberations/exploratory-discuss-phase-quality-regression.md` (concluded — adjacent: discuss-phase produces shallow specs)
- `philosophy: ryle/knowing-that-vs-knowing-how`
- `philosophy: schon/reflection-in-action`
- `philosophy: pragmatism/warranted-assertibility`

## Situation

Phase 57.3 was scoped, planned, executed, and verified as "Audit Workflow Infrastructure." The phase's guardrail G-3 explicitly stated: "Infrastructure in this phase means conventions, templates, and metadata — not new agent implementations or workflow rewrites." The invocable audit command was placed in the deferred section: "`gsd-tools audit` command suite — tooling is a future phase." No follow-on phase was inserted to build it. No requirement was written for it.

When the user needed to audit Phase 57 mid-session, there was no skill to invoke. The infrastructure was complete; the operational capability was absent.

The failure has three identifiable loci:

1. **Requirement capture gap** — No requirement for an invocable `/gsdr:audit` command was ever written. AUDIT-01 and AUDIT-02 are infrastructure requirements (directories, task specs, ground rules). WF-01 (Phase 62) covers `/gsdr:cross-model-review`, not a general audit dispatch. The user's operational need was never formalized.

2. **Scope translation** — The discuss-phase for 57.3 translated "audit capability" into "audit conventions" without flagging the gap. The deferred section named the command explicitly, but deferring with no insertion means the need falls off the roadmap.

3. **Verification scope** — The verification checked what was built (5 reference files, migration count) but not whether what was built was sufficient to enable the user's actual workflow. Passing verification ≠ satisfying operational need.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `.planning/phases/57.3-audit-workflow-infrastructure/57.3-CONTEXT.md` deferred section | Audit command explicitly deferred: "gsd-tools audit command suite — tooling is a future phase" | Yes — read file | `sig-2026-04-09-phase-573-deferred-audit-skill-no-command` |
| `.planning/phases/57.3-audit-workflow-infrastructure/57.3-VERIFICATION.md` | 5/5 truths all about file existence (reference docs, migration counts, frontmatter fields) — nothing about invocability | Yes — read file | informal |
| `.planning/REQUIREMENTS.md` audit section | AUDIT-01, AUDIT-02, AUDIT-03 are infrastructure; no AUDIT-04 or WF-* entry covers general audit dispatch | Yes — searched file | informal |
| `.planning/ROADMAP.md` Phases 58-64 | WF-01 (Phase 62) is `/gsdr:cross-model-review` — not a general audit skill. No phase assigned to build `/gsdr:audit` | Yes — searched file | informal |
| Current conversation | User needed an investigatory audit command mid-session; none existed | Yes — direct observation | `sig-2026-04-09-phase-573-deferred-audit-skill-no-command` |

## Framing

**Core question:** How does the pipeline allow a phase to be scoped, planned, verified, and "passed" without the user's operational need being built — and what structural intervention prevents this?

The specific instance is Phase 57.3, but the user's framing ("perhaps the process inevitably led to it") suggests the question is systemic. Three adjacent questions surface:

**Adjacent questions:**
- Is this a one-time scoping failure, or a structural pattern where "infrastructure first" phases systematically defer the operational capability indefinitely?
- At what point in the pipeline should a deferred item trigger a roadmap insertion requirement, vs. simply existing in a deferred list?
- Is the verification success criterion ("does the phase build what it said it would?") too narrow — should it include "can the user do what motivated the phase?"
- What should `/gsdr:audit` actually do? (Design question — downstream of the process question but necessary to resolve before building it)

## Analysis

*Left open for future deliberation session. Key design tensions to explore:*

### Option A: Requirement-level fix — every deferral must have a phase or backlog entry

- **Claim:** The process should require that anything placed in a phase's "deferred" section either gets a roadmap phase inserted or a formal backlog entry added. Deferred ≠ dropped.
- **Grounds:** Phase 57.3's deferred section named the audit command explicitly. The roadmap never received a corresponding entry. The gap was silent.
- **Warrant:** If deferred items are tracked formally, the pipeline surfaces them. If they're only in a phase CONTEXT.md, they vanish after the phase closes.
- **Rebuttal:** Not every deferred item is worth tracking — some are genuinely "nice to have." Adding mandatory tracking may create noise.
- **Qualifier:** Presumably — needs investigation of how often deferred items matter vs. are truly optional.

### Option B: Verification scope expansion — check operational sufficiency, not just artifact existence

- **Claim:** Verification success criteria should include at least one check that the phase enables the user to do something, not just that files exist.
- **Grounds:** All 5/5 verification truths for Phase 57.3 were file-existence checks. None asked "can the user invoke an audit?"
- **Warrant:** Passing verification on artifact existence while missing operational capability is a category error — `ryle/knowing-that-vs-knowing-how`. The phase delivered know-that (reference docs) but the user needed know-how (invocable skill).
- **Rebuttal:** Not every phase delivers a user-invocable capability. Infrastructure phases legitimately check for file existence.
- **Qualifier:** Presumably — the check should be context-sensitive, not universal.

### Option C: Discuss-phase gap — scope should be evaluated against the motivating need

- **Claim:** The discuss-phase should explicitly surface whether the proposed scope satisfies the user's motivating need, not just whether it satisfies the stated requirements.
- **Grounds:** The discuss-phase for 57.3 defined "infrastructure only" as the scope. No step asked "if this phase completes as scoped, can the user do what they originally needed?"
- **Warrant:** Per `schon/reflection-in-action`: the pipeline had extensive backward-looking reflection (audit-of-audits, taxonomy design) but no forward-looking check on whether the scope met the live operational need.
- **Rebuttal:** The discuss-phase reads requirements, not user intentions. Requirements are the pipeline's articulation of user intentions — the gap may be upstream at requirement capture.
- **Qualifier:** Possibly — the root cause may be in requirement capture (Option A) rather than discuss-phase (Option C).

## Tensions

- **Infrastructure-first vs. capability-first**: "Infrastructure first, tooling later" is a sound engineering pattern. But when "later" is indefinite and the user needs the tool now, the pattern fails. The tension is between good sequencing discipline and operational readiness.
- **Verification scope vs. verification simplicity**: Expanding verification to check operational sufficiency adds complexity and subjectivity. Simpler file-existence checks are reliably automatable. A mixed standard may be harder to enforce.
- **Deferred list as design space vs. deferred list as graveyard**: The deferred section exists to capture ideas that are out of scope without losing them. But without a forcing function to promote deferred items to roadmap entries, they become a graveyard of intentions.

## Recommendation

*Open — not yet concluded. To be revisited when evaluating v1.20 framework patterns post-milestone.*

**Current leaning:** The root cause is requirement capture (Option A) — the operational need was never written down, so no phase was ever obligated to build it. The discuss-phase and verification gaps (Options B and C) are compounding factors but not the root.

**Open questions blocking conclusion:**
1. Is the "deferred → graveyard" pattern specific to Phase 57.3 or a recurring pattern? (Check how often deferred items from past phases became requirements vs. were silently dropped)
2. What should `/gsdr:audit` actually do? (Design question — necessary before a new phase can be scoped)
3. Is the right intervention at requirement capture, discuss-phase, or verification — or all three at different severity levels?

## Predictions

*(To be filled when the deliberation concludes and an option is adopted)*

## Decision Record

*(To be filled when concluded)*

---

*Deliberation: open*
*File: .planning/deliberations/phase-scope-translation-loss-audit-capability-gap.md*
*Signals referenced: sig-2026-04-09-phase-573-deferred-audit-skill-no-command*
