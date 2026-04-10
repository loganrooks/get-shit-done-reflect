---
id: sig-2026-04-10-researcher-model-override-leak-third-occurrence
type: signal
project: get-shit-done-reflect
tags: [model-override, agent-dispatch, orchestrator-error, scope-leak, researcher-agent, recurring]
created: 2026-04-10T00:45:00Z
updated: 2026-04-10T00:45:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: "57.4"
plan: "0"
polarity: negative
source: manual
occurrence_count: 3
related_signals:
  - sig-2026-04-08-model-override-scope-leak-researcher-got-sonnet
  - sig-2026-04-09-researcher-spawned-with-wrong-model-57-3
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.19.3+dev"
lifecycle_state: detected
lifecycle_log:
  - "detected by user at 2026-04-10T00:45:00Z: user asked 'why is phase researcher sonnet??'"
---

## What Happened

During Phase 57.4 plan-phase, the orchestrator spawned gsdr-phase-researcher with `model="sonnet"` despite init JSON showing `researcher_model: "inherit"` (Opus on quality profile). The user caught it immediately: "why is phase researcher sonnet??" This is the 3rd occurrence of the same pattern across 3 different phases (56, 57.3, 57.4).

## Context

The project config is `model_profile: "quality"`. The init JSON correctly reports `researcher_model: "inherit"`. Two memory entries exist documenting this exact pattern — `feedback_model_override_scope.md` ("model overrides are scope-specific") and `feedback_sensor_model_sonnet.md` ("always use Sonnet for sensor agents"). The orchestrator has memory of "use Sonnet for sensors" and "use Sonnet for Explore agents" but repeatedly applies the override to the researcher agent, which is neither a sensor nor an Explore agent.

The feedback memory `feedback_model_override_scope.md` was created after the Phase 56 occurrence and explicitly says: "When user says 'use X for Y', only override the Y agent type. Check init JSON for each agent's configured model." Despite this memory existing and being loaded into context, the override still leaked.

## Potential Cause

The root pattern is that Sonnet overrides for specific agent types (sensors, Explore agents) bleed into researcher dispatch. The orchestrator has multiple "use Sonnet for X" memories and appears to generalize them into a broader "use Sonnet for subagents" heuristic rather than checking each agent's init JSON model individually. The memory correction exists but is not being followed — suggesting the issue is not informational (the orchestrator knows the rule) but behavioral (the rule is not being applied at dispatch time).

Three occurrences across three different sessions, with corrective memory in place since the first occurrence, indicates this is a systematic behavioral gap rather than an isolated mistake. The convention/memory system alone is insufficient to prevent this recurrence — structural enforcement may be needed (e.g., plan-phase workflow explicitly naming each agent's model from init JSON rather than relying on orchestrator judgment).
