---
id: sig-2026-03-27-bridge-file-reading-in-tmp-creates-test-environmen
type: signal
project: get-shit-done-reflect
tags:
  - testing
  - test-isolation
  - deviation
  - workaround
created: "2026-03-29T08:00:00Z"
updated: "2026-03-29T08:00:00Z"
durability: convention
status: active
severity: notable
signal_type: struggle
signal_category: negative
phase: 53
plan: 4
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
    - "53-04-SUMMARY.md Deviations section: 'Two tests expected empty reasons[] but a real /tmp/claude-ctx-*.json bridge file from the active Claude Code session was being read, adding bridge_file: used_pct=16% to reasons'"
    - Fix required adding ['--context-pct', '0'] as extraArgs to suppress bridge file reading in 2 tests
    - "53-01-SUMMARY.md Decisions section: 'Bridge file graceful-fallback test uses toBeTypeOf(number) instead of exact value assertion because real bridge files in /tmp/ on the development machine could be fresh during test execution'"
  counter:
    - The workaround (--context-pct 0 flag) cleanly suppresses bridge reading and is documented
    - The relaxed assertion in the graceful-fallback test was anticipated and documented in plan 01 decisions
    - All 415 tests pass after the fix
confidence: high
confidence_basis: "Both summaries independently document the same root cause: real /tmp/ bridge files from active Claude Code sessions contaminating test assertions -- two separate adaptations required to address it"
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Bridge file reading in /tmp/ creates test environment pollution -- real session bridge files interfere with test assertions

Evidence:
- 53-04-SUMMARY.md Deviations section: 'Two tests expected empty reasons[] but a real /tmp/claude-ctx-*.json bridge file from the active Claude Code session was being read, adding bridge_file: used_pct=16% to reasons'
- Fix required adding ['--context-pct', '0'] as extraArgs to suppress bridge file reading in 2 tests
- 53-01-SUMMARY.md Decisions section: 'Bridge file graceful-fallback test uses toBeTypeOf(number) instead of exact value assertion because real bridge files in /tmp/ on the development machine could be fresh during test execution'

## Context

Phase 53, Plan 4 (artifact sensor).
Source artifact: .planning/phases/53-deep-integration/53-04-SUMMARY.md

## Potential Cause

Implementation complexity exceeded plan assumptions, requiring adaptive solutions or workarounds.
