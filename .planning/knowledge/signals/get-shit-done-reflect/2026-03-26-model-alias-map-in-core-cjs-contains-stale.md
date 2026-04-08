---
id: sig-2026-03-26-model-alias-map-in-core-cjs-contains-stale
type: signal
project: get-shit-done-reflect
tags:
  - upstream-bug
  - model-resolution
  - dead-code
  - stale-data
  - MODEL_ALIAS_MAP
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: workaround
status: active
severity: notable
signal_type: config-mismatch
signal_category: negative
phase: 49
plan: 3
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.17.5+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-03-29T08:00:00Z"
evidence:
  supporting:
    - "core.cjs:38-42 maps opus->claude-opus-4-0, sonnet->claude-sonnet-4-5, haiku->claude-haiku-3-5"
    - Upstream commit c2c4301 (2026-03-18) introduced these stale IDs
    - Current models are claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001
    - Map is exported at line 653 but zero imports exist across entire codebase
  counter:
    - Dead code — map is exported but never consumed, so no runtime impact
confidence: high
confidence_basis: Direct code inspection of core.cjs with cross-reference to upstream commit
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: manual
origin: user-observation
---

## What Happened

MODEL_ALIAS_MAP in core.cjs contains stale upstream model IDs (claude-opus-4-0, claude-sonnet-4-5, claude-haiku-3-5) — adopted from upstream C6 (commit c2c4301, 2026-03-18) which shipped already-stale IDs when Opus 4.6 and Sonnet 4.6 were already released. Dead code in fork (exported but never consumed), but represents inherited upstream bug.

Evidence:
- core.cjs:38-42 maps opus->claude-opus-4-0, sonnet->claude-sonnet-4-5, haiku->claude-haiku-3-5
- Upstream commit c2c4301 (2026-03-18) introduced these stale IDs
- Current models are claude-opus-4-6, claude-sonnet-4-6, claude-haiku-4-5-20251001
- Map is exported at line 653 but zero imports exist across entire codebase

## Context

Phase 49, Plan 3 (manual sensor).

## Potential Cause

Upstream code adopted without sufficient review of its assumptions or staleness relative to current release state.
