---
id: sig-2026-04-22-the-phase-researcher-hit-a-concrete-kb-search-fail
type: signal
project: get-shit-done-reflect
tags:
  - session-log
  - capability-gap
  - tool-failure
  - process-friction
  - missed-signal
created: "2026-04-22T02:46:17.247Z"
updated: "2026-04-22T02:46:17.247Z"
durability: convention
status: active
severity: minor
signal_type: capability-gap
signal_category: negative
phase: 57.9
plan: 0
polarity: negative
source: auto
occurrence_count: 2
related_signals: [sig-2026-04-20-decimal-phase-insertion-guidance-backtrack]
provenance_schema: v2_split
provenance_status: ""
about_work:
  - role: subject
    kind: session-log
    phase: 57.9
    plan: 0
    session_id: 019db284-3a2d-72d3-b631-5598d9d0bc6b
    source_file: /home/rookslog/.codex/sessions/2026/04/21/rollout-2026-04-21T20-08-23-019db284-3a2d-72d3-b631-5598d9d0bc6b.jsonl
    approximate_timestamp: "2026-04-22T00:09:08Z"
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
  session_id: 019db284-3a2d-72d3-b631-5598d9d0bc6b
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
  generated_at: "2026-04-22T02:46:17.305Z"
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
    - "Researcher response item at 2026-04-22T00:09:08Z ran `node get-shit-done/bin/gsd-tools.cjs kb search \"phase 58 defer gate 06 07 re-entry hook substrate\" --format json`."
    - "Output: `{ \"error\": \"FTS5 query error: no such column: entry\", \"query\": \"phase 58 defer gate 06 07 re-entry hook substrate\" }`."
    - "Five seconds later the session switched to `rg`/`find` fallback across `.planning/knowledge` and `~/.gsd/knowledge`, and the next assistant update was: \"I found relevant KB material...\""
  counter:
    - The bug may be query-shape specific, and the agent recovered with a manual fallback, so the failure did not block the research artifact. The gap is still real because the intended KB search path rejected an ordinary search string.
confidence: high
confidence_basis: Progressive deepening from the researcher's elevated tool-error fingerprint to targeted extraction of the failing response item and adjacent fallback behavior.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-log
origin: collect-signals
---

## What Happened

The phase researcher hit a concrete KB search failure while trying to surface prior signals. A natural-language `gsd-tools.cjs kb search` query returned `FTS5 query error: no such column: entry`, forcing fallback to raw file-system scans. Supporting evidence: Researcher response item at 2026-04-22T00:09:08Z ran `node get-shit-done/bin/gsd-tools.cjs kb search "phase 58 defer gate 06 07 re-entry hook substrate" --format json`. Output: `{ "error": "FTS5 query error: no such column: entry", "query": "phase 58 defer gate 06 07 re-entry hook substrate" }`.

## Context

Phase 57.9 research session while surfacing prior signals before the research artifact was written.

## Potential Cause

The KB search surface could not parse an ordinary natural-language query shape, so the researcher had to bypass the intended retrieval path with manual grep/find scans.
