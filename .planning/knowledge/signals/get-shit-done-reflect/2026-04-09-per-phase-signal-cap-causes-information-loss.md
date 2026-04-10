---
id: sig-2026-04-09-per-phase-signal-cap-causes-information-loss
type: signal
project: get-shit-done-reflect
tags:
  - signal-detection
  - synthesizer
  - cap-enforcement
  - information-loss
  - SGNL-09
created: "2026-04-09T21:35:00.000Z"
updated: "2026-04-09T21:35:00.000Z"
durability: principle
status: active
severity: critical
signal_type: deviation
phase: 57
plan: null
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.3+dev
---

## What Happened

During Phase 57 signal collection, the synthesizer received 20 raw candidates from 4 sensors (artifact: 6, git: 1, ci: 4, log: 9). After dedup and trace filtering, 18 qualifying candidates remained. The per-phase cap (SGNL-09: max 10 signals per phase per project) forced the synthesizer to:

1. Archive 9 existing signals to restore cap compliance (phase 57 already had 18 active)
2. Reject 17 new candidates that could not be persisted
3. Write only 1 new signal

The 17 rejected candidates included notable-severity findings about:
- CI gaps (feature branch with zero CI runs, main commits with no check-runs)
- Worktree path resolution (resolveWorktreeRoot silent failure in worktree contexts)
- Cross-runtime epistemic problems (agent findings accepted as authoritative without verification)
- Git sensor detection threshold too high (single fix commits invisible)
- Multiple user-correction deviations (model mismatch, research ordering, context skipping)

These are legitimate observations permanently lost to an arbitrary numeric cap.

## Context

SGNL-09 was designed in Phase 31 to "prevent signal noise from overwhelming the knowledge base." The rationale was reasonable at the time — early signal collection was noisy and untriaged signals accumulated without review. However, with 4 sensors now operational (artifact, git, ci, log) and the log sensor producing rich session-level findings, 10 signals per phase is far too restrictive for phases with substantial research/discussion activity.

Phase 57 had 16 sessions spanning milestone research, 5 spikes, discuss-phase, plan-phase, and execution — far more workflow surface area than a typical 2-session execute-only phase. The cap treats all phases as equally complex, which they are not.

The spike methodology overhaul (Phase 61) and the broader signal lifecycle redesign were partly motivated by exactly this kind of information loss.

## Potential Cause

The cap was set as a static numeric limit without considering:
1. Phase complexity variation (research-heavy vs. execute-only)
2. Number of active sensors (was 2 at design time, now 4)
3. The difference between noise and legitimate observations
4. That archiving signals to make room destroys the historical record

A better approach might be: no cap on detection/persistence, with triage (reflection) responsible for prioritization. Or a dynamic cap based on phase session count or sensor count.
