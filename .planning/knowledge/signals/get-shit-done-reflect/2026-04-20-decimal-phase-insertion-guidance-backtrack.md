---
id: sig-2026-04-20-decimal-phase-insertion-guidance-backtrack
type: signal
project: get-shit-done-reflect
tags:
  - session-log
  - capability-gap
  - user-correction
  - agent-backtrack
  - process-friction
  - decimal-phase
  - phase-insertion
created: "2026-04-20T09:11:14Z"
updated: "2026-04-20T09:11:14Z"
durability: convention
status: active
severity: minor
signal_type: capability-gap
signal_category: negative
phase: 57.8
plan: 0
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
provenance_schema: v2_split
provenance_status: ""
about_work:
  - role: subject
    kind: session-log
    phase: 57.8
    plan: 0
    session_id: 0866f8ce-bfe9-4a85-8904-f42fc007f72e
    source_file: /home/rookslog/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/0866f8ce-bfe9-4a85-8904-f42fc007f72e.jsonl
    approximate_timestamp: "2026-04-17T07:29:04.949Z"
detected_by:
  role: sensor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5.4
  reasoning_effort: xhigh
  profile: quality
  gsd_version: not_available
  generated_at: "2026-04-20T09:11:14Z"
  session_id: 0866f8ce-bfe9-4a85-8904-f42fc007f72e
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: exposed
    profile: derived
    gsd_version: not_available
    generated_at: derived
    session_id: exposed
  provenance_source:
    role: signal_synthesizer_default
    harness: sensor_output.harness
    platform: derived_from_harness
    vendor: derived_from_harness
    model: sensor_output.model
    reasoning_effort: sensor_output.reasoning_effort
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
  gsd_version: 1.19.4+dev
  generated_at: "2026-04-20T09:11:14Z"
  session_id: 019daa23-0d7e-71b3-a4a3-b17d51100c5f
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
gsd_version: 1.19.4+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-04-20T09:11:14Z"
evidence:
  supporting:
    - "Structural triage on session `0866f8ce-bfe9-4a85-8904-f42fc007f72e` surfaced a backtrack cluster around `2026-04-17T07:29Z`, prompting expansion on lines 52-63."
    - "Line 52 (`2026-04-17T07:26:57.346Z`) assistant: \"Want me to draft 57.8 (narrow) now and park 60.1 (wide) as a roadmap entry with `/gsdr:add-phase`?\""
    - "Line 57 (`2026-04-17T07:28:48.582Z`) user: \"let's do C and yes use add-phase\""
    - "Line 60 (`2026-04-17T07:29:04.949Z`) assistant: \"Correction: I proposed `add-phase` but that adds at end-of-milestone. For decimal phases (57.8, 60.1) between existing phases, the correct tool is `insert-phase`.\""
  counter:
    - The assistant self-corrected before invoking the wrong phase-mutation tool, and this read found no evidence of an incorrect roadmap edit or follow-on repair.
confidence: high
confidence_basis: Progressive deepening from structural fingerprint to narrow read and expanded read of lines 16-66 in the only clearly relevant Claude discuss-phase session. Confidence is high for the observed workflow-guidance lapse itself, though overall phase coverage is narrower because Codex execution logs are out of scope for this sensor.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-log
origin: collect-signals
---

## What Happened

During the discuss-phase session that inserted 57.8 and 60.1, the assistant recommended `add-phase` for a decimal insertion case and only corrected that guidance after the user had already accepted it.
The recovery happened before any tool call mutated the roadmap, but the workflow advice was briefly wrong at exactly the moment the user was choosing the phase-insertion action.

## Context

The log sensor traced this to session `0866f8ce-bfe9-4a85-8904-f42fc007f72e`, the pre-planning discussion used to place the new decimal phases.
Because the error was contained to guidance rather than execution, the signal is recorded as a capability-gap and process-friction observation rather than a planning-artifact defect.

## Potential Cause

The workflow distinction between end-of-milestone addition and in-between decimal insertion was not retrieved early enough in the recommendation path.
That suggests the assistant reached for the more familiar phase-addition command before checking the special-case decimal insertion contract.
