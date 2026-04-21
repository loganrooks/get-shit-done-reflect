---
id: sig-2026-04-20-plan-02-missed-live-signal-template
type: signal
project: get-shit-done-reflect
tags: [template-coverage, contract-drift, split-provenance]
created: "2026-04-20T09:11:14Z"
updated: "2026-04-20T09:11:14Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 57.8
plan: 02
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
provenance_schema: v2_split
provenance_status: ""
about_work:
  - role: subject
    kind: execution-artifact
    phase: 57.8
    plan: 02
    source_file: /home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.8-signal-provenance-split-artifact-signature-blocks/57.8-02-SUMMARY.md
detected_by:
  role: sensor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5.4
  reasoning_effort: not_available
  profile: quality
  gsd_version: not_available
  generated_at: "2026-04-20T09:11:14Z"
  session_id: not_available
  provenance_status:
    role: exposed
    harness: exposed
    platform: exposed
    vendor: exposed
    model: exposed
    reasoning_effort: not_available
    profile: derived
    gsd_version: not_available
    generated_at: derived
    session_id: not_available
  provenance_source:
    role: sensor_output.role
    harness: sensor_output.harness
    platform: sensor_output.platform
    vendor: sensor_output.vendor
    model: sensor_output.model
    reasoning_effort: not_available
    profile: config
    gsd_version: not_available
    generated_at: writer_clock
    session_id: not_available
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
    - 57.8-02-PLAN.md files_modified does not list agents/kb-templates/signal.md.
    - 57.8-02-SUMMARY.md lists agents/kb-templates/signal.md under Files Created/Modified.
    - 57.8-02-SUMMARY.md Rule 2 says the signal template still taught the flat-only provenance shape and had to be updated during Task 1.
  counter:
    - The summary says the template was updated in the same plan before closeout.
    - Verification in 57.8-02-SUMMARY.md says the KB rebuild proof fixture used the updated split-provenance shape successfully.
confidence: high
confidence_basis: The plan-to-summary file delta and the corrective fix are both explicitly documented.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-artifact
origin: collect-signals
---

## What Happened

Plan 57.8-02 rewrote the split-provenance contract surface but initially failed to include the live signal template in that scope.
The plan had to correct itself during execution by updating `agents/kb-templates/signal.md`, which the summary records as necessary to eliminate the old flat-only provenance teaching.

## Context

The mismatch is visible between `57.8-02-PLAN.md` and `57.8-02-SUMMARY.md`: the plan declaration omitted the template, but the summary lists it under modified files and explains why it had to change.
Verification still passed with the updated split-provenance fixture, so the plan recovered before closeout.

## Potential Cause

The contract rewrite appears to have focused first on helper/library/spec surfaces and only later noticed that the live template still encoded the deprecated provenance shape.
This points to incomplete coverage of all user-facing contract artifacts at planning time.
