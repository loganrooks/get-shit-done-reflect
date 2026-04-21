---
id: sig-2026-04-21-plan-59-01-changed-the-orphaned-edge-exit-code-con
type: signal
project: get-shit-done-reflect
tags:
  - exit-codes
  - compatibility
  - edge-integrity
  - contract-change
created: "2026-04-21T06:09:41Z"
updated: "2026-04-21T06:09:41Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 59
plan: 1
polarity: neutral
source: auto
occurrence_count: 1
related_signals: []
provenance_schema: v2_split
provenance_status: ""
about_work:
  - role: subject
    kind: execution-artifact
    phase: 59
    plan: 1
    source_file: /home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-01-SUMMARY.md
detected_by:
  role: sensor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5
  reasoning_effort: xhigh
  profile: quality
  gsd_version: not_available
  generated_at: "2026-04-21T06:09:41Z"
  session_id: not_available
  provenance_status:
    role: exposed
    harness: exposed
    platform: exposed
    vendor: exposed
    model: exposed
    reasoning_effort: exposed
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
    reasoning_effort: sensor_payload.reasoning_effort
    profile: config
    gsd_version: not_available
    generated_at: writer_clock
    session_id: not_available
  sensor: artifact
  run_label: primary
  detection_method: sensor-artifact
  analysis_scope: plan, summary, and verification artifact comparison
written_by:
  role: synthesizer
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5.4
  reasoning_effort: xhigh
  profile: quality
  gsd_version: 1.19.6+dev
  generated_at: "2026-04-21T06:09:41Z"
  session_id: 019daea0-b691-7882-b497-3bcf51025f6c
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
gsd_version: 1.19.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-04-21T06:09:41Z"
evidence:
  supporting:
    - `59-01-SUMMARY.md` says research Pattern 3 specified exit code 2 on orphaned-only results, but the implementation broke existing `execSync`-based tests and callers.
    - The summary says orphaned-only results were downgraded to advisory output instead of a non-zero exit code.
  counter:
    - `59-01-SUMMARY.md` also states malformed edges still hard-fail with exit code 1, so the critical malformed contract was preserved.
confidence: high
confidence_basis: The deviation is explicitly documented as a public contract change in the summary, including the original intended behavior and the implemented downgrade.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-artifact
origin: collect-signals
---

## What Happened

Plan 59-01 changed the orphaned-edge exit-code contract from the research pattern to preserve compatibility with existing callers. Supporting evidence: `59-01-SUMMARY.md` says research Pattern 3 specified exit code 2 on orphaned-only results, but the implementation broke existing `execSync`-based tests and callers. The summary says orphaned-only results were downgraded to advisory output instead of a non-zero exit code.

## Context

Phase 59, Plan 01, derived from .planning/phases/59-kb-query-lifecycle-wiring-and-surfacing/59-01-SUMMARY.md

## Potential Cause

The observed outcome reflects a mismatch between the declared execution surface and the real work needed to complete or verify the plan.
