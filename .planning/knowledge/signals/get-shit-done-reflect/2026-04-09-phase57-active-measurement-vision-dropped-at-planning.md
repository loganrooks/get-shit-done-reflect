---
id: sig-2026-04-09-phase57-active-measurement-vision-dropped-at-planning
type: signal
project: get-shit-done-reflect
tags:
  - planning-failure
  - context-to-plan-gap
  - scope-narrowing
  - telemetry
  - active-measurement
  - requirements-anchoring
created: "2026-04-09T21:50:00.000Z"
updated: "2026-04-09T21:50:00.000Z"
durability: principle
status: active
severity: critical
signal_type: deviation
phase: 57
plan: null
polarity: negative
source: manual
occurrence_count: 1
related_signals:
  - sig-2026-04-09-discuss-context-written-without-reading-research
  - sig-2026-04-09-exploratory-mode-epistemic-quality-regression
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.3+dev
---

## What Happened

Phase 57 CONTEXT.md contains an explicit, detailed vision for "Active Measurement: Telemetry System, Not Telemetry Consumer" (lines 72-84) with 5 governing principles, 6 specific harness-only metric concepts, and an explicit question about Phase 57 vs Phase 60 scope boundary. The implemented module (telemetry.cjs) is a passive reader of Claude Code's pre-existing session-meta files with percentile math — it computes no harness-specific metrics, implements no phase-correlated aggregation, has no cross-runtime normalization, and works only on Claude Code.

The narrowing happened across three stages with no explicit decision record:

1. **Requirements anchoring**: TEL-01a/01b specify "session-meta + facets reading" — written before CONTEXT.md, never revised against the richer vision
2. **Research acceptance**: RESEARCH.md acknowledged governing principles but reframed scope as "read pre-computed session-meta JSON files" (line 64). Harness-specific metrics don't appear in its "Deferred Ideas" list — they simply vanish
3. **Discussion silence**: DISCUSSION-LOG covers 6 gray areas but never raises the fundamental question CONTEXT.md explicitly asked (line 83): "Where in Phase 57 vs Phase 60 does this belong?"

No artifact contains a deliberate decision to defer harness-specific metrics. The narrowing was implicit.

## Context

The CONTEXT.md explicitly calls out what should have been implemented:
- Phase-correlated metrics: tokens/errors/completion per phase, deviation frequency (line 79, `[assumed:reasoned]`)
- Harness effectiveness metrics: plan completion rate, spike outcome rate, signal remediation velocity (line 80, `[assumed:reasoned]`)
- Context trajectory analysis: context % per turn from bridge file (line 81, `[assumed:reasoned]`)
- Cross-session pattern detection: friction predicting follow-up sessions (line 82, `[open]`)
- Hook-derived active metrics: tool error streaks, agent spawn depth (line 83, `[open]`)
- Line 84 states: "the schema and metric definitions belong here in Phase 57"

Only 2 derived metrics were implemented (`message_hours_entropy`, `first_prompt_category`) — both computable from session-meta fields without harness knowledge. Everything requiring knowledge of phases, signals, spikes, STATE.md, or hooks was silently dropped.

## Potential Cause

The plan-phase pipeline treats REQUIREMENTS as authoritative scope and CONTEXT.md as advisory. When requirements are written before discuss-phase produces the richer context, the requirements anchor scope to whatever was understood at the time — and there is no feedback loop from context back to requirements. The planner built exactly what TEL-01a/01b specified, which was correct against the requirements but wrong against the CONTEXT.md governing principles.

This is the same pattern Phase 57.2 (discuss-phase overhaul) was designed to prevent — rich exploratory context flattened to narrow implementation spec during planning. The pattern recurred in the very next phase after the fix shipped.

Structural fixes needed:
- Plan-phase must validate scope against CONTEXT.md governing principles and assumed-scope items, not just requirements
- When CONTEXT.md contains `[open]` questions about scope boundaries, those must be resolved in DISCUSSION-LOG before planning proceeds
- Requirements should be revisable during discuss-phase when context reveals richer scope
