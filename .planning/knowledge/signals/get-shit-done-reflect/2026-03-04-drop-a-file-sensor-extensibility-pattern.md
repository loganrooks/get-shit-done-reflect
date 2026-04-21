---
id: sig-2026-03-04-drop-a-file-sensor-extensibility-pattern
type: signal
project: get-shit-done-reflect
tags: [config, deviation]
created: "2026-03-04T20:00:37Z"
updated: "2026-03-04T20:00:37Z"
durability: principle
status: active
severity: notable
signal_type: good-pattern
signal_category: positive
phase: 38
plan: 1
polarity: positive
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-04T20:00:37Z"
evidence:
  supporting:
    - collect-signals.md now scans gsd-*-sensor.md dynamically -- no hardcoded sensor names
    - Sensors not listed in config default to enabled
    - "VERIFICATION.md confirms: 'Any gsd-*-sensor.md file placed in agents directory will be auto-discovered'"
    - All 3 existing sensors conform to the standardized contract
  counter:
    - Pattern relies on filesystem discovery which has OS-specific behavior
    - The log sensor has stale documentation
confidence: high
confidence_basis: The drop-a-file behavior is mechanically verified in VERIFICATION.md (10/10 truths).
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

Phase 38 established a drop-a-file extensibility pattern for the signal collection sensor architecture. The collect-signals.md workflow now dynamically scans for `gsd-*-sensor.md` files rather than hardcoding sensor names. New sensors are auto-discovered without requiring framework modifications. Sensors not listed in config default to enabled, making the zero-config case "add a file and it works."

## Context

Phase 38, Plan 01 rewrote the collect-signals.md orchestration workflow and updated feature-manifest.json. The VERIFICATION.md 10/10 truth check explicitly confirms: "Any gsd-*-sensor.md file placed in the agents directory will be auto-discovered." All 3 existing sensors (artifact, git, log) conform to the standardized contract established in Plan 02.

## Potential Cause

This is an intentional architectural decision made in phase 38's design phase. The pattern is well-established in plugin architectures (e.g., Babel transforms, pytest plugins) and was deliberately applied here. The key insight is that defaulting new sensors to enabled (rather than disabled) reduces the friction to add a new sensor -- zero config required for the common case.
