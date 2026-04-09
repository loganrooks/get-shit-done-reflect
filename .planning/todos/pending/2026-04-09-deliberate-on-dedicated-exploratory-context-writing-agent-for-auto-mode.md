---
created: "2026-04-09T16:29:12.682Z"
title: "Deliberate on dedicated exploratory context-writing agent for --auto mode"
area: workflow
priority: HIGH
source: conversation
status: pending
files:
  - .planning/deliberations/exploratory-discuss-phase-quality-regression.md
  - .claude/get-shit-done-reflect/workflows/discuss-phase.md
---

## Problem

During Phase 57.3 discuss-phase (--auto --chain, exploratory mode), the user observed that the orchestrator writes CONTEXT.md directly without a dedicated exploration agent. Phase 57.2's Prediction P4 anticipated this: "The discuss-phase will NOT achieve Phase-52-level generative question quality without either interactive input or a dedicated exploration agent — typed claims and template sections improve structure but not the quality of questions asked."

The 57.2 deliberation explored this as Option B (dedicated discuss-phase exploration subagent as epistemic interlocutor) and chose Option C (template fix now, agent later). The user is now experiencing the gap P4 predicted — template fixes improved structure but the --auto mode still produces orchestrator-quality exploration, not the richer output that interactive sessions or a specialized agent would produce.

This is NOT the `/gsdr:explore` skill (Phase 57.1 — standalone Socratic ideation). This is a **subagent spawned by the discuss-phase workflow** during exploratory --auto mode, analogous to how `gsdr-phase-researcher` is spawned by plan-phase.

## Solution

Deliberate on whether to create a Phase 57.4 for this. Key design questions from the 57.2 deliberation:

1. Whether the subagent should be the same model or cross-model (for genuine perspectival diversity per Longino)
2. How to bound exploration to prevent runaway (Issue #1507 cautionary tale: 34 passes, 7 hours, zero code)
3. Whether it connects to the `/gsdr:explore` skill's Socratic questioning infrastructure
4. Whether it needs its own epistemic probes (Brandom inferential, Dewey inquiry, Gadamer horizon, Longino criticism, Wittgenstein hinge) or whether the typed claim system from 57.2 is sufficient
5. How it integrates with the discuss-phase workflow (replace orchestrator context-writing? review after? interleave?)

See: `.planning/deliberations/exploratory-discuss-phase-quality-regression.md` Options B and C, Predictions P4 and P7.
