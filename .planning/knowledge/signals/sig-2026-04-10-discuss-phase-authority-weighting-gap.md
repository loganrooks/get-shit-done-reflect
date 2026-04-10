---
id: sig-2026-04-10-discuss-phase-authority-weighting-gap
type: signal
severity: high
phase: 57.4
detected_by: human
detection_method: conversation-review
origin: phase-execution
date: 2026-04-10
lifecycle: detected
polarity: negative
tags:

  - discuss-phase
  - authority-weighting
  - deliberation-synthesis
  - context-checker-blind-spot
  - reference-doc-staleness
  - framing-failure
  - epistemic-gap

occurrence_count: 2
updated: "2026-04-10T21:55:15Z"
status: active
project: get-shit-done-reflect
created: "2026-04-10T00:00:00Z"
signal_type: capability-gap
signal_category: negative
lifecycle_state: detected
confidence: high
confidence_basis: Two independent observations in same phase, direct log evidence from session 09422ed4, original signal from direct user observation in session 9f036b2d.
---

# Signal: Discuss-Phase Synthesize Under-Weights Recent Deliberations When Older Reference Files Exist

## What Happened

Phase 57.4 v2 discuss-phase produced `57.4-CONTEXT.md` that was structurally rigorous — 55 typed claims, dependency webs, justificatory sidecar, ground rules applied, context-checker run, all of the Phase 57.2 infrastructure engaged correctly. The document framed the phase as **"extending Phase 57.3"**: `audit-conventions.md` and `audit-ground-rules.md` were cited as evidenced authority via DC-1 through DC-5 and listed in canonical_refs under "Audit infrastructure (from Phase 57.3 — what this phase extends)".

In fact, the `audit-taxonomy-three-axis-obligations.md` deliberation had **superseded** the flat 8-type taxonomy, template-based output paradigm, and ground rule set of those reference files. The reference files were not a base being extended; they were a prior design being reconstructed. The user caught this during post-checker review:

> "audit-conventions unfortunately is outdated... there was a whole deliberation about why those two are actually insufficient, and now I am worried that they will be traced as authoritative... This phase isn't just about adding a skill and an agent, it is radically rethinking the formalization of the auditing workflow."

The framing failure propagated into:

- CONTEXT.md `<domain>` section — "Update audit-conventions.md and audit-ground-rules.md" framed as additive polishing rather than reconstructive rewrite
- CONTEXT.md `<working_model>` — restructuring described as restructuring, but the "Current state:" prose treated the reference files as the ground truth being modified
- CONTEXT.md DC-1 through DC-5 — five derived constraints with `[evidenced:cited]` markers pointing at the superseded sections of the reference files
- CONTEXT.md `<canonical_refs>` — reference files listed under "what this phase extends" rather than "what this phase supersedes and rewrites"
- ROADMAP.md Phase 57.4 goal text — rewritten during the same session to reflect v2 design; inherited the "restructure from A to B" framing
- The phase manifest / scope summary — same framing drift

## Why This Matters

**1. It passed structural verification.** The Phase 57.2 context-checker caught a type misassignment on DC-4 (`[evidenced:cited]` applied to a claim that conflated base schema with planned extension) but did NOT catch the broader authority-tracing failure. The checker's verification dimension is *citation integrity* — does the cited file exist at the named line? It is not *authority weighting* — is the cited file actually authoritative in the face of more recent deliberations? The checker was operating inside the same framing as the agent it was checking.

**2. It is a silent failure mode.** A downstream planner reading CONTEXT.md DC-4 would reasonably assume the extended frontmatter schema already exists in `audit-conventions.md` Section 2 and proceed to implement against a stale mental model. A downstream implementer copying "ground rules from `audit-ground-rules.md` Section 4" into a task spec would be copying the pre-Rule-5 set, missing frame-reflexivity entirely. The error surfaces only at implementation time, after trust has already been placed in the document.

**3. It is the exact kind of failure the discuss-phase exploratory overhaul was supposed to prevent.** Phase 57.2 built typed claims, dependency webs, and the context-checker precisely to prevent epistemic silent failures. This case shows the infrastructure catches *type errors* (DC-4) while missing *framing errors* (the entire document's authority direction). The fix isn't "better type checking"; it's a synthesize-step capability the workflow does not currently have.

**4. It correlates with the sig-2026-04-09 convergence-pattern signal.** The shared-reference-doc pattern works well when references are stable. When references are in flux (as here — reference files superseded by in-flight deliberations), the convergence pattern *inverts*: agents converge on stale authority with high fidelity. The good pattern becomes a bad pattern when authority is moving.

## Root Cause

The discuss-phase synthesize step follows a default rule of thumb: **reference docs in `get-shit-done/references/` are authoritative unless explicitly marked otherwise**. This is correct in the common case. But it fails when:

1. A deliberation has superseded reference content
2. The deliberation is in `.planning/deliberations/`, not in `get-shit-done/references/`
3. The reference file has no supersession marker
4. The phase in question is the phase that will *implement* the supersession

In this topology, the synthesize step sees: "here is a reference file (authoritative), and here is a deliberation (one of many inputs), and the deliberation proposes changes to the reference file." It interprets this as "the phase extends the reference file based on deliberation input" — additive. The actual epistemic status is "the deliberation reconstructs what the reference file should be, and the phase rewrites the reference file to match." — reconstructive.

The workflow has no step that asks: *which artifact is more recent, and what is each artifact's authority status at this moment?* Without that step, recency and authority decouple, and older files continue to be treated as ground truth.

## Evidence

- `.planning/phases/57.4-audit-skill-investigatory-type/57.4-CONTEXT.md` — pre-correction version, lines 10-17 (domain), 142-148 (DC-1 through DC-5), 210-214 (canonical_refs "what this phase extends")
- `.planning/phases/57.4-audit-skill-investigatory-type/57.4-DISCUSSION-LOG.md` — Context-Checker Verification Log (lines 279-396) caught DC-4 type misassignment but not the broader framing
- `.planning/deliberations/audit-taxonomy-three-axis-obligations.md` — the superseding deliberation, open (fed forward, not concluded)
- `.planning/deliberations/audit-taxonomy-retrospective-analysis.md` — validates the 3-axis model against 13 audit sessions
- User observation during post-checker review, 2026-04-10 — the correction that triggered this signal
- `get-shit-done/references/audit-conventions.md` and `audit-ground-rules.md` — the stale-but-unmarked reference files as of 2026-04-10

## Implications

- **Discuss-phase synthesize step needs an authority-weighting capability.** Specifically, a check that asks: "for each reference doc cited as authority, is there a more recent deliberation that has superseded its substantive content? If yes, the deliberation is primary authority and the reference doc is either (a) still valid at the meta level, or (b) a to-be-rewritten artifact — not a citable ground truth."
- **Context-checker needs an authority-layer verification dimension.** Citation integrity is necessary but not sufficient. The checker should also ask: "is the cited artifact authoritative at this moment, or has it been superseded?"
- **Reference files in transition should carry supersession banners.** When a deliberation supersedes part of a reference file's content, the reference file should get a lightweight banner at the top pointing at the deliberation as primary authority until the rewrite lands. The banner is a pre-implementation correctness patch that prevents authority tracing into stale content.
- **The "extending Phase N-1" framing in phase scoping needs scrutiny.** When a phase is preceded by deliberation work that reconstructs prior-phase outputs, "extending" is the wrong framing. The correct framing is "superseding core design commitments while preserving compatible meta-rules" or "reconstructing what Phase N-1 formalized". This distinction affects how the goal text, CONTEXT.md, and the plan are written.

## Remediation Applied In-Session

The user and Claude applied a lightweight correction before proceeding to planning:

1. Logged this signal (this file).
2. Added conservative supersession banners to `get-shit-done/references/audit-conventions.md` and `audit-ground-rules.md`.
3. Rewrote CONTEXT.md `<domain>`, DC-1 through DC-5, and `<canonical_refs>` to flow authority from deliberations.
4. Rewrote ROADMAP.md Phase 57.4 goal text to frame the phase as radical reconstruction, not extension.
5. Appended a framing-correction note to `57.4-DISCUSSION-LOG.md` documenting the follow-up to context-checker.

## Limitations

- **One observation does not establish a pattern.** This is a single case from a single phase. The "discuss-phase under-weights recent deliberations" hypothesis needs additional observations before it generalizes. Phases 57.2, 57.3, and 57.4 all involve references + deliberations; a retrospective across those phases could test the hypothesis.
- **The root cause is speculative.** The "no authority-weighting step" explanation fits the evidence but isn't confirmed. An alternative: the agent DID weight deliberations correctly but chose the extension framing for narrative clarity, not epistemic accuracy. Need to inspect more discuss-phase outputs to distinguish.
- **The fix (banners + CONTEXT.md rewrite) is reactive, not preventive.** The workflow gap still exists. A future phase with a similar topology will repeat the failure unless the synthesize step gains an authority-weighting capability.
- **The signal itself is subject to the failure it describes.** This document cites artifacts that exist in specific states as of 2026-04-10. If Phase 57.4 ships and rewrites the reference files, the citations here will become dated — the same supersession problem in miniature. Readers of this signal in the future should cross-reference against current state.

## Related Signals

- `sig-2026-04-09-shared-reference-doc-convergence-pattern.md` — the good-pattern signal this case inverts when references are in flux
- `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop.md` — related "verification checked structure, not function" pattern; both cases show checking-the-wrong-dimension failures
- `sig-2026-03-30-audit-severity-downgrade-bias.md` — audit domain signal, relevant because this signal concerns the audit workflow reconstruction phase

---
*Detected: 2026-04-10 during post-context-checker review of Phase 57.4 v2 discuss-phase output*
*Origin: user correction after context-checker ran and passed with WARN*

## Corroboration: Second Observation (added 2026-04-10T21:55:15Z by gsdr-signal-synthesizer)

A second independent observation of the same failure mode was detected during Phase 57.4 execution context-loading (session `09422ed4-ff56-47ef-bb53-07be5ae834df`, approximately 2026-04-10T15:37:56Z). The log sensor captured the following direct evidence:

- **Session 09422ed4 L147 (USER):** "yea audit-conventions unfortunately is outdated... there was a whole deliberation about why those two are actually insufficient"
- **Session 09422ed4 L159 (USER):** "This feels like a signal that the most recent deliberations weren't weighted more heavily within this step of gathering context."

### Significance of the Corroboration

The Limitations section of this signal originally stated: *"One observation does not establish a pattern. This is a single case from a single phase."* The second observation crosses that threshold. Two independent occurrences of the same failure mode, in two different workflow phases (discuss-phase first, execution context-loading second), within the same phase (57.4), establish the pattern as structural rather than sporadic.

Notably, the second observation occurred *during the execution of the phase that was meant to remediate the first observation*. The v2 CONTEXT.md was corrected between the two observations (supersession banners added, authority-direction documented), but the underlying context-loading behavior still defaulted to treating the reference files as primary authority during execution preamble. This suggests the remediation applied to discuss-phase (corrected CONTEXT.md for this specific phase) did not generalize to execution context-loading (which loaded its context fresh and hit the same gap).

### Occurrence Count Update

- `occurrence_count: 1` → `occurrence_count: 2`
- Added project field to frontmatter (was missing, causing index to show empty project)
- Added status: active

### Implications for Remediation

The original signal listed four implications. This corroboration sharpens three of them:

1. **Authority-weighting capability is needed in multiple workflows, not just discuss-phase.** The failure mode recurred during execution context-loading, which means a discuss-phase-only fix is insufficient. The capability must be present (or the check must be enforced) at every workflow step that loads context from a reference-doc-plus-deliberation topology.

2. **Supersession banners alone are insufficient.** Banners were added to the reference files between the two observations, but the second occurrence still happened. Either the banners were not consulted during context-loading, or the context-loading step's retrieval path did not see them, or the banners' format is not machine-actionable enough to change behavior.

3. **The phase that ships audit-conventions.md rewrite must also ship the workflow-level check.** Otherwise the underlying pattern will recur in Phase 58+ when the next reference file enters a similar supersession state.

### Related Signals Updated By This Corroboration

- `sig-2026-04-10-phase-574-context-md-missing-reading-order.md` (sibling signal created in the same synthesizer run): documents a related self-referential failure in the same session — the authority lesson was documented but not placed in CONTEXT.md. Together these two signals describe a capability gap in context-placement reasoning that spans both discuss-phase and planning preamble.
- `sig-2026-04-10-authority-weighting-guard-held-all-six-plans.md` (sibling signal): documents the positive counterpart — once the v2 CONTEXT.md was corrected, the six plans under execution held the authority-weighting guard without further drift. The guard works when the correction is explicit and documented. The corroboration here documents the case where the correction did NOT reach the context-loading step.
