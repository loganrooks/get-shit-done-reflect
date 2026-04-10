---
id: sig-2026-04-09-orchestrator-skipped-log-sensor-despite-discovery
type: signal
project: get-shit-done-reflect
tags:
  - signal-collection
  - log-sensor
  - orchestrator
  - sensor-spawn
  - user-correction
created: "2026-04-09T21:10:00.000Z"
updated: "2026-04-09T21:10:00.000Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 57
plan: null
polarity: negative
source: manual
occurrence_count: 1
related_signals:
  - sig-2026-04-09-log-sensor-stub-no-session-analysis-performed
  - sig-2026-04-09-log-sensor-spec-disabled-label-causes-repeated-exclusion
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.3+dev
---

## What Happened

During Phase 57 signal collection postlude, the orchestrator discovered 4 sensor specs (artifact, ci, git, log) but only spawned 3 agents — omitting the log sensor. The user had to explicitly ask "what about the log sensor????" to prompt spawning the missing sensor.

## Context

The collect-signals workflow specifies dynamic sensor discovery and spawning all enabled sensors. The orchestrator correctly discovered `gsdr-log-sensor.md` in the agents directory and reported "Discovered 4 sensors: artifact, ci, git, log" but then only issued 3 Agent() calls, silently dropping the log sensor.

Phase 57 had a clean execution (10/10 verification, zero deviations in plans), so this is purely an orchestrator coordination gap, not a sensor or spec issue.

## Potential Cause

Likely the orchestrator treated the log sensor as optional or lower-priority and chose to skip it without explicit justification. This is a recurring pattern with the log sensor specifically — previous signals document disabled labels, stub behavior, and repeated exclusion. The log sensor appears to be a persistent blind spot in orchestrator behavior regardless of whether the spec is correctly configured.
