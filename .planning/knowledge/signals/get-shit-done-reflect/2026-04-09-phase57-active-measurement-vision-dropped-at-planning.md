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
updated: "2026-04-16T23:00:00.000Z"
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

## Correction (audited 2026-04-10, remediation: 57.5/57.6/57.7)

The signal's critical framing ("silently dropped its core vision") was partially overstated per the dual-dispatch investigatory audit at `.planning/audits/2026-04-10-phase-57-vision-drop-investigation/`:

- **Sonnet audit** confirmed the scope-narrowing cascade across four stages (requirements authorship → research summary → plan truth encoding → verification), each locally correct, collectively producing scope loss. Both truth signals were technically correct against their local standards.
- **Codex audit** disconfirmed the "purely passive" claim: the shipped `telemetry.cjs` module has derived metrics (`message_hours_entropy`, `first_prompt_category`) and phase-scoped summaries, not just raw extraction. What was actually missing was the **definition/registration/extensibility layer** and explicit scope decisions about what goes where — not computation per se.

**Refined framing:** the cascade is real (no explicit decision record at any stage); the consequence is narrower than "purely passive reader" — it's "no extensibility substrate for the active-measurement vision the CONTEXT.md articulated."

**Remediation plan** (all load-bearing artifacts):
- `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md` — philosophical grounding (Merleau-Ponty chiasm, post-Popperian rigor, Dewey inquiry) and architectural commitments (three-layer separation, extractor registry, retroactive applicability, runtime dimension model, fallibilism machinery, named feedback loops)
- Phase 57.5 (Measurement Architecture & Retroactive Foundation) — three-layer architecture + intervention-lifecycle + pipeline-integrity loops; retroactive demonstration across ~268 existing sessions
- Phase 57.6 (Multi-Loop Coverage & Human Interface) — remaining four loops + text-first visualization + diagnostic application
- Phase 57.7 (Content Analysis & Epistemic Deepening) — session-content extractors + automated distinguishing-feature suggestion + intervention-outcome tracking + revision classification
- MEAS- requirement family (34 new requirements across MEAS-ARCH / MEAS-RUNTIME / MEAS-DERIVED / MEAS-GSDR subfamilies) added to REQUIREMENTS.md (2026-04-16)
- GATE-09 (scope-translation ledger) added to Phase 58 as the **meta-fix** — enforces CONTEXT-claim mapping at phase close, citation requirement when RESEARCH/PLAN narrows scope, and verification that CONTEXT commitments were explicitly deferred rather than silently disappearing
- PROJECT.md Core Value updated to express measurement infrastructure as the substrate on which self-improvement's trustworthiness rests

**Preparatory audit work** (2026-04-15 → 2026-04-16):
- `.planning/audits/2026-04-15-measurement-signal-inventory/` — 4-lane signal inventory of existing measurement sources (Claude session-meta, Claude JSONL, Codex JSONL, GSD artifacts) plus synthesis
- `.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md` — falsifies Anomaly A4 (thinking content "permanently empty"), promotes phantom-token billing asymmetry to A9, refines Decision 5 (cross-runtime markers) and adds Decision 6 (model-family gate on reasoning metrics)
- `.planning/audits/2026-04-15-measurement-signal-inventory/anomaly-stress-tests.md` — E1-E6 + E5.8 stress-tests of remaining Anomaly Register items; surfaced 16 new MEAS- proposals (§6.7-§6.22), established the three-subfamily split (MEAS-RUNTIME + MEAS-DERIVED + MEAS-GSDR), and falsified synthesis §4.3's "ABSENT" compaction claim at the capability layer via binary introspection
- `.planning/spikes/009-thinking-summary-as-reasoning-proxy/` — confirmed subagent dispatch context gates thinking content
- `.planning/spikes/010-parent-session-thinking-summary-proxy/` — confirmed headless `claude -p` dispatch produces thinking; falsified length-as-quality-proxy via qualitative comparison

**Signal status:** remains `active`. Will transition to `remediated` once Phases 57.5/57.6/57.7 ship and the MEAS- family is operational. Recurrence check at Phase 58 close.
