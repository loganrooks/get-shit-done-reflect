---
id: sig-2026-03-02-claude-code-session-logs-large-unstable
type: signal
project: get-shit-done-reflect
tags: [performance, data, workaround]
created: "2026-03-02T00:00:00Z"
updated: "2026-03-02T00:00:00Z"
durability: workaround
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 35
plan: 3
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-02T00:00:00Z"
evidence:
  supporting:
    - "Plan 03 SUMMARY: '181 session files totaling 442MB for one project; 326 debug files totaling 218MB'"
    - Individual sessions can be 11MB+
    - Format should be treated as best-effort with graceful degradation
  counter:
    - JSONL format was consistent across versions 2.1.49 through 2.1.63
    - Permissions are accessible
    - Spike decision was 'enable SENSOR-07' not defer
confidence: high
confidence_basis: Findings from direct file system inspection documented in spike 002 DECISION.md
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

Claude Code session logs are significantly larger than expected and have no formal stability guarantees from Anthropic. One project accumulated 181 session files totaling 442MB, with individual sessions reaching 11MB+. Additionally, 326 debug files totaling 218MB were found. The JSONL format, while currently consistent, is treated as best-effort with graceful degradation required.

## Context

Phase 35, plan 03 (end-to-end spike 002 execution). Spike 002 investigated Claude Code session log location and accessibility for use by SENSOR-07. The spike was completed and the decision was to enable SENSOR-07 despite these constraints.

## Potential Cause

Claude Code stores detailed session logs for debugging purposes. These logs grow with every session and are not automatically pruned. The large file sizes are a byproduct of the JSONL format storing full message content including tool calls and responses. Anthropic does not provide stability guarantees on the internal log format, creating a risk of sensor breakage on Claude Code upgrades.
