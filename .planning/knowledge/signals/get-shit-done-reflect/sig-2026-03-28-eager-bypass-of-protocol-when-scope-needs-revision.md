---
id: sig-2026-03-28-eager-bypass-of-protocol-when-scope-needs-revision
type: signal
project: get-shit-done-reflect
tags: [workflow-gap, protocol-bypass, scope-revision, discuss-phase, capability-gap, recurring]
created: "2026-03-28T08:00:00Z"
updated: "2026-03-28T08:00:00Z"
durability: principle
status: active
severity: notable
signal_type: capability-gap
phase: "54"
plan: null
polarity: negative
source: manual
occurrence_count: 1
related_signals:
  - sig-2026-03-23-missing-home-for-constellation-recommendations
  - 2026-02-17-resume-work-misses-non-phase-handoffs
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.17.5+dev"
---

## What Happened

During Phase 54 discuss-phase (--auto mode), user provided feedback that the phase scope in ROADMAP.md was too narrow and needed to include upstream analysis, feature overlap review, sync retrospective, and strategic policy formulation. Instead of navigating the existing GSDR protocol to handle scope revision (updating ROADMAP.md and REQUIREMENTS.md first), Claude eagerly launched research agents to scout upstream — bypassing the protocol and creating artifacts against the wrong scope.

The user identified this as a **recurring pattern**: when the need for scope deviance arises mid-workflow, there is no formalized GSDR pathway for handling it. The correct response would have been:

1. Recognize that the user's feedback implies scope revision is needed
2. Look for a GSDR workflow to handle "phase scope needs updating before proceeding"
3. If no workflow exists, mark the capability gap
4. Update ROADMAP.md + REQUIREMENTS.md to reflect the revised scope
5. Only then re-run discuss-phase against the corrected scope

Instead, the deviation was silently bypassed — leading to messy, compounding mistakes.

## Context

- Phase 54 was the last phase of v1.18 milestone
- The initial CONTEXT.md captured 4 mechanical requirements (CI cache fix, doc updates) but missed the strategic depth the user expected
- User pointed out Phase 54 should include: upstream issue/PR analysis, feature overlap identification, sync retrospective, forward-looking policy grounded in actual experience
- The GSDR harness has no `/gsdr:revise-phase-scope` or equivalent workflow
- User noted this has been discussed extensively in prior sessions — the absence of a formalized deviation pathway is itself a recurring gap

## Potential Cause

Two interacting causes:

1. **No formalized scope revision workflow**: The GSDR harness has pathways for adding phases, inserting phases, removing phases, and discussing phases — but no pathway for "this phase's scope in the roadmap needs to change before we can meaningfully discuss it." When scope needs revision, the agent must improvise, and improvisation tends to be eager rather than disciplined.

2. **Agent eagerness pattern**: When user provides directional feedback, the agent's instinct is to act on the substance immediately (launch research) rather than first checking whether the protocol has a structured way to handle the change. This is the same class of issue as "offer-next-skips-pr-workflow" — skipping procedural gates in favor of moving forward.

The deeper issue: if the harness had a formalized pathway for scope revision, it wouldn't be "deviance" at all — it would just be the next step in the workflow. The absence of the pathway forces ad-hoc behavior, which compounds mistakes.
