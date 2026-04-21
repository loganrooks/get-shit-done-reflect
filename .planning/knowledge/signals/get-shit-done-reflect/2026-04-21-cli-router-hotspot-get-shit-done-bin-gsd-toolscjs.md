---
id: sig-2026-04-21-cli-router-hotspot-get-shit-done-bin-gsd-toolscjs
type: signal
project: get-shit-done-reflect
tags: [file-churn, hotspot, tooling]
created: "2026-04-21T06:09:41Z"
updated: "2026-04-21T06:09:41Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 59
polarity: negative
source: auto
occurrence_count: 2
related_signals:
  - sig-2026-04-10-audit-references-expected-churn-during-rewrite
  - sig-2026-03-27-tests-unit-install-test-js-modified-in-8
  - sig-2026-03-26-tests-unit-install-test-js-modified-in-8
  - sig-2026-03-06-installer-file-churn-hotspot
provenance_schema: v2_split
provenance_status: ""
about_work:
  - role: subject
    kind: repository-history
    phase: 59
    source_file: /home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/gsd-tools.cjs
    commit_range: 9114ec8..7751cc8
detected_by:
  role: sensor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: gpt-5.4
  reasoning_effort: xhigh
  profile: quality
  gsd_version: not_available
  generated_at: "2026-04-21T06:09:41Z"
  session_id: not_available
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
    session_id: not_available
  provenance_source:
    role: signal_synthesizer_default
    harness: signal_context.runtime
    platform: derived_from_harness
    vendor: derived_from_harness
    model: sensor_payload.model
    reasoning_effort: sensor_payload.reasoning_effort
    profile: config
    gsd_version: not_available
    generated_at: writer_clock
    session_id: not_available
  sensor: git
  run_label: primary
  detection_method: sensor-git
  analysis_scope: git-history hotspot scan
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
    - "9 modifications in the last 50 commits: get-shit-done/bin/gsd-tools.cjs"
  counter:
    - High churn may indicate active development on a core component rather than instability
confidence: medium
confidence_basis: Statistical frequency analysis; get-shit-done/bin/gsd-tools.cjs crossed the 5-in-50 threshold with 9 modifications. Churn count does not indicate cause.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-git
origin: collect-signals
---

## What Happened

CLI router hotspot: get-shit-done/bin/gsd-tools.cjs changed in 9 of the last 50 commits Supporting evidence: 9 modifications in the last 50 commits: get-shit-done/bin/gsd-tools.cjs

## Context

Phase 59, git range 9114ec8..7751cc8 Detection source: git-history.

## Potential Cause

The CLI router is acting as a central integration surface, so unrelated feature work keeps converging there and increasing change density.
