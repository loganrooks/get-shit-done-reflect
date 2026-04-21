---
id: sig-2026-04-20-plan-03-live-kb-migration-failure
type: signal
project: get-shit-done-reflect
tags: [kb-upgrade, migration-bug, verification]
created: "2026-04-20T09:11:14Z"
updated: "2026-04-20T09:11:14Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 57.8
plan: 03
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
    plan: 03
    source_file: /home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.8-signal-provenance-split-artifact-signature-blocks/57.8-03-SUMMARY.md
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
    - 57.8-03-SUMMARY.md says it fixed 'a real migration bug discovered during closeout'.
    - The summary's Rule 1 deviation says the live repo carried a pre-57.8 kb.db and kb rebuild failed because idx_signals_provenance_schema was created before the new provenance columns were added.
    - Task Commit 1 in 57.8-03-SUMMARY.md is 'Fix the legacy KB upgrade path discovered during verification', which was not one of the original plan task names.
  counter:
    - 57.8-03-SUMMARY.md says the fix was applied in the same plan.
    - "The same summary reports the targeted Vitest rerun passed and the live repo kb rebuild --raw completed with errors: 0 after the fix."
confidence: high
confidence_basis: The summary documents both the failure mode and the corrective fix in concrete terms, showing a non-trivial issue encountered during execution.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-artifact
origin: collect-signals
---

## What Happened

Plan 57.8-03 did not just prove the new provenance indexes on a fresh fixture. During closeout it hit a real migration failure against the live repository `kb.db` and had to insert an upgrade-order fix before the plan could finish.
The failure mode was concrete: the provenance index was created before the new columns existed on older databases, which broke the rebuild path until the migration order was corrected.

## Context

This comes from `57.8-03-SUMMARY.md`, which explicitly distinguishes the discovered migration bug from the original task framing and records the corrective task commit.
Verification ultimately passed only after the live upgrade path was repaired and rerun.

## Potential Cause

Earlier verification coverage leaned on fresh or temp rebuilds that did not exercise the live upgrade path from a pre-57.8 SQLite schema.
That left the ordering dependency between schema evolution and index creation untested until real closeout.
