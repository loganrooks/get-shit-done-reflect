---
id: sig-2026-04-22-phase-prep-stop-conditions-were-weak-across-both-t
type: signal
project: get-shit-done-reflect
tags:
  - session-log
  - user-correction
  - interruption
  - process-friction
  - missed-signal
created: "2026-04-22T02:46:17.247Z"
updated: "2026-04-22T02:46:17.247Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 57.9
plan: 0
polarity: negative
source: auto
occurrence_count: 5
related_signals:
  - sig-2026-04-09-auto-progression-stopped-despite-auto-flag-57-3
  - sig-2026-04-09-log-sensor-disabled-label-recurrence-57-3
  - sig-2026-04-09-researcher-spawned-with-wrong-model-57-3
  - sig-2026-04-20-discuss-mode-drifted-audit-bounded-578-scope
  - sig-2026-04-21-after-verification-passed-phase-reconcile-edited-p
  - sig-2026-04-21-the-phase-60-discuss-plan-chain-ran-on-main-long-e
  - sig-2026-04-10-phase-574-context-md-missing-reading-order
provenance_schema: v2_split
provenance_status: ""
about_work:
  - role: subject
    kind: session-log
    phase: 57.9
    plan: 0
    session_id: 019db284-3a2d-72d3-b631-5598d9d0bc6b
    source_file: /home/rookslog/.codex/sessions/2026/04/21/rollout-2026-04-21T20-08-23-019db284-3a2d-72d3-b631-5598d9d0bc6b.jsonl
    approximate_timestamp: "2026-04-22T00:14:12Z"
  - role: subject
    kind: session-log
    phase: 57.9
    plan: 0
    session_id: 019db293-8d4a-7f52-b84c-802886358a94
    source_file: /home/rookslog/.codex/sessions/2026/04/21/rollout-2026-04-21T20-25-07-019db293-8d4a-7f52-b84c-802886358a94.jsonl
    approximate_timestamp: "2026-04-22T00:27:30Z"
detected_by:
  role: sensor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5
  reasoning_effort: xhigh
  profile: quality
  gsd_version: not_available
  generated_at: "2026-04-22T02:46:17.247Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: derived
    profile: derived
    gsd_version: not_available
    generated_at: derived
    session_id: exposed
  provenance_source:
    role: signal_synthesizer_default
    harness: derived_from_sensor_runtime
    platform: derived_from_harness
    vendor: derived_from_harness
    model: workflow_spawn_policy
    reasoning_effort: workflow_spawn_policy
    profile: config
    gsd_version: not_available
    generated_at: writer_clock
    session_id: signal_context.session_id
  sensor: log
  run_label: primary
  method: progressive-deepening
written_by:
  role: synthesizer
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5.4
  reasoning_effort: xhigh
  profile: quality
  gsd_version: 1.19.8
  generated_at: "2026-04-22T02:46:17.302Z"
  session_id: 019db30c-2231-77c2-80b9-3302c28e34d4
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: exposed
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: exposed
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: codex_state_store
    reasoning_effort: codex_state_store
    profile: config
    gsd_version: installed_harness
    generated_at: writer_clock
    session_id: "env:CODEX_THREAD_ID"
runtime: codex-cli
model: gpt-5.4
gsd_version: 1.19.8
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-04-22T02:46:17.247Z"
evidence:
  supporting:
    - "Researcher at 2026-04-22T00:12:58Z: \"I've reached the point where the remaining work is synthesis... I'm doing one last pass...\""
    - "User at 2026-04-22T00:14:12Z: \"Tighten scope and conclude now... Do not keep browsing.\""
    - "Planner at 2026-04-22T00:26:47Z: \"I'm doing one more verification pass...\""
    - "User at 2026-04-22T00:27:30Z: \"Conclude now. Do not keep exploring.\" Planner reply at 2026-04-22T00:27:53Z: \"I'm doing one minimal file-path check... then I'll write...\""
    - "Fingerprints that led to triage: researcher `interruptions=2`, `tool_error_count=24`, `total_tokens=2069592`; planner `interruptions=2`, `tool_error_count=13`, `total_tokens=1724135`."
  counter:
    - Hook/runtime documentation is temporally unstable, so some official-doc verification was warranted. The signal is the lack of a stop rule once the agents themselves said they already had enough evidence, plus the need for explicit user correction.
confidence: high
confidence_basis: Progressive deepening from two high-interruption fingerprints to full conversational reads of both sessions (20 user/assistant messages total), plus targeted inspection of the interrupted turn boundaries.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-log
origin: collect-signals
---

## What Happened

Phase-prep stop conditions were weak across both the researcher and planner sessions. The researcher said the remaining work was synthesis but kept doing "one last pass" until the user interrupted, and the planner repeated the same pattern after a direct stop request. Supporting evidence: Researcher at 2026-04-22T00:12:58Z: "I've reached the point where the remaining work is synthesis... I'm doing one last pass..." User at 2026-04-22T00:14:12Z: "Tighten scope and conclude now... Do not keep browsing."

## Context

Phase 57.9 phase-prep sessions spanning the researcher and planner subagents before execution artifacts were finalized.

## Potential Cause

The prep agents had no hard stop rule once they believed they had enough evidence, so they kept browsing until the user intervened explicitly.
