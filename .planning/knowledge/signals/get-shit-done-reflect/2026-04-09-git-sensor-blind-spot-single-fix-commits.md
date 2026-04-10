---
id: sig-2026-04-09-git-sensor-blind-spot-single-fix-commits
type: signal
project: get-shit-done-reflect
tags: [session-log, git-sensor, blind-spot, fix-commit, single-fix, user-provides-answer]
created: "2026-04-09T12:00:00Z"
updated: "2026-04-09T22:00:00Z"
durability: convention
status: active
severity: minor
signal_type: capability-gap
signal_category: negative
phase: 57.3
plan:
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-09T12:00:00Z"
  - "archived by gsdr-signal-synthesizer at 2026-04-09T22:00:00Z: per-phase cap enforcement (phase 57 exceeded 10 signals)"
evidence:
  supporting:
    - "Git sensor reported 0 signals despite a fix(57.3) commit existing in the phase"
    - "User flagged the blind spot: sensor only triggers on 3+ consecutive fix commits"
    - "Single fix commits escape detection entirely under current threshold"
  counter:
    - "Low threshold for git sensor may produce noise; 3+ fix threshold is intentional signal-to-noise tradeoff"
    - "Single fix commits may represent minor corrections that don't warrant a KB signal"
confidence: high
confidence_basis: "User identified the detection gap directly; confirmed against sensor threshold design in signal-detection.md"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

The git sensor reported 0 signals for phase 57.3 despite a `fix(57.3)` commit existing in the phase's commit history. The user identified the root cause: the git sensor only triggers when it detects 3 or more consecutive fix commits. A single fix commit falls below this threshold and escapes detection entirely.

## Context

Phase 57.3 signal collection. The git sensor's design uses a 3+ consecutive fix commit threshold to reduce noise, but this creates a blind spot for single-commit corrections that may represent genuine issues worth tracking.

## Potential Cause

The sensor threshold was set to 3+ to avoid false positives from routine single-line corrections. This is a valid design tradeoff, but it creates a known blind spot. Single fix commits during a phase may represent meaningful corrections that warrant a signal, and the current threshold treats them as noise by default.
