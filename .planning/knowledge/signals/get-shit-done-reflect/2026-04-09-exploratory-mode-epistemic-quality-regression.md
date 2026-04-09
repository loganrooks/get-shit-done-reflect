---
id: sig-2026-04-09-exploratory-mode-epistemic-quality-regression
type: signal
project: get-shit-done-reflect
tags: [discuss-phase, exploratory-mode, epistemic-rigor, decision-quality, premature-closure]
created: "2026-04-09T04:00:00Z"
updated: "2026-04-09T04:00:00Z"
durability: principle
status: active
severity: critical
signal_type: capability-gap
phase: "57"
plan: ""
polarity: negative
source: manual
detection_method: manual
origin: local
occurrence_count: 1
related_signals:
  - sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop
  - sig-2026-03-27-plan-03-adopted-discuss-phase-md-without-detecting
  - sig-2026-02-26-delegate-exploration-to-subagents
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.19.1"
lifecycle: detected
---

## What Happened

The Phase 57 exploratory discuss-phase produced a CONTEXT.md that is functionally a list of locked decisions, not an exploration. Specific evidence:

1. **Nearly everything marked [grounded]**: ~25 decisions locked, only 3 open questions. For a genuinely exploratory mode, this ratio is inverted from what it should be.

2. **No iterative grey-area discovery**: The workflow identified 4 grey areas, answered each in a table, and declared done. No grey area led to discovery of other grey areas. No deepening occurred.

3. **No epistemic guardrails**: No assumption chains traced. No "what does this decision depend on?" analysis. No exposure of the framing that makes a particular option appear optimal. No questioning whether the decision space has been properly uncovered.

4. **"Grounded" claims lack justifiable grounding**: Claims are marked [grounded] with a one-line "Basis:" citation, but no analysis of whether the basis is sufficient, whether it could lock us into a local minimum, what alternative framings exist, or what assumptions the grounding depends on.

5. **Missing philosophical character**: The exploratory mode was designed to set up a rich research space — to be iterative, inquisitive, to surface assumptions and frame the problem space before foreclosing options. The Phase 57 CONTEXT.md does none of this.

## Context

- The user reports this is a regression from a "peak exploratory era" when CONTEXT.md files were genuinely exploratory
- config.json has `discuss_mode: "exploratory"` which should trigger the exploratory behavior
- The discuss-phase workflow spec mentions marking options as [grounded] or [open] in exploratory mode, and that --auto "only selects grounded" — but this may create a perverse incentive to mark everything as grounded when --auto is used
- GitHub issues motivated the exploratory mode to prevent exactly this kind of premature closure
- Possible Phase 55 sync regression: the discuss-phase workflow may have lost exploration-oriented content during upstream sync

## Potential Cause

Multiple contributing factors suspected:

1. **--auto + exploratory perverse incentive**: The workflow says "--auto only selects grounded." If the agent knows --auto is active, it is incentivized to mark everything [grounded] so that --auto can proceed without stopping. The mode that was supposed to preserve uncertainty becomes the mode that eliminates it.

2. **Workflow spec lacks exploration structure**: The discuss-phase workflow says "generate 3-4 phase-specific gray areas" and "ask 4 questions per area" but does not specify what constitutes genuine exploration — no iterative deepening protocol, no assumption-surfacing requirement, no mandatory open questions minimum.

3. **Possible sync regression**: The discuss-phase workflow may have been simplified during Phase 55 upstream sync, losing exploration-specific content that previously existed.

4. **Template bias toward decisions**: The CONTEXT.md template has sections for "Implementation Decisions" and "Claude's Discretion" but no section for "Assumptions Exposed", "Decision Dependencies", or "Alternative Framings Considered." The template structure itself biases toward closure.

5. **Agent model behavior**: The agent may default to decision-making mode regardless of workflow instructions, treating "exploratory" as a label rather than a behavioral mode.
