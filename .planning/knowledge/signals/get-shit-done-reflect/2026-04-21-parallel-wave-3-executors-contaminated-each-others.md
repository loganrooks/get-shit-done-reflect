---
id: sig-2026-04-21-parallel-wave-3-executors-contaminated-each-others
type: signal
project: get-shit-done-reflect
tags:
  - session-log
  - process-friction
  - workflow-bypass
  - missed-signal
  - tool-failure
created: "2026-04-21T22:11:11.988Z"
updated: "2026-04-21T22:11:11.988Z"
durability: convention
status: active
severity: notable
signal_type: struggle
signal_category: negative
phase: 60
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
    phase: 60
    plan: 0
    session_id: 019db1dc-9ede-7aa3-8f65-256c5fed38ce
    source_file: /home/rookslog/.codex/sessions/2026/04/21/rollout-2026-04-21T17-05-19-019db1dc-9ede-7aa3-8f65-256c5fed38ce.jsonl
    approximate_timestamp: "2026-04-21T21:10:30.635Z"
detected_by:
  role: sensor
  harness: codex-cli
  platform: codex
  vendor: openai
  model: gpt-5.4
  reasoning_effort: xhigh
  profile: quality
  gsd_version: not_available
  generated_at: "2026-04-21T22:11:11.988Z"
  session_id: 019db1dc-9ede-7aa3-8f65-256c5fed38ce
  provenance_status:
    role: derived
    harness: derived
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
    harness: derived_from_sensor_runtime
    platform: derived_from_harness
    vendor: derived_from_harness
    model: sensor_wrapper.model
    reasoning_effort: sensor_wrapper.reasoning_effort
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
  generated_at: "2026-04-21T22:11:11.988Z"
  session_id: 019db213-c993-7250-bbe7-1ffc1dd3ba52
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
  - "created -> detected by gsd-signal-synthesizer at 2026-04-21T22:11:11.988Z"
evidence:
  supporting:
    - "`60-05` at 2026-04-21T21:10:49Z: `A commit hygiene problem surfaced: the task-2 commit pulled in three out-of-boundary files that were untracked in the worktree.` It then used `git reset --mixed HEAD^` to recover and recommit only the intended files."
    - "`60-06` at 2026-04-21T21:10:30Z: `The first commit didn’t take because the new files weren’t actually staged.` At 2026-04-21T21:13:05Z: `A concurrent branch update landed the initial validator/fixture files before I could record the first task commit.` At 2026-04-21T21:13:46Z: `The branch moved again while 60-05 was finalizing...`"
    - "`60-06` closeout then had to re-check shared planning state: `STATE already advanced through 60-05` before updating Phase 60 progress, showing that the collision was not limited to code commits."
    - "Parent orchestration corroborated the pattern: it called out `STATE.md` as `partially stale from the parallel closeouts` before verification/closeout proceeded."
  counter:
    - Both executors recovered without losing working-copy content; the collisions stayed in local commit/closeout management rather than corrupting the final shipped code.
    - The repo intentionally uses parallel waves, so some coordination overhead is expected; the signal is that shared planning artifacts and commit boundaries were still coupled tightly enough to require manual repair.
confidence: high
confidence_basis: Progressive deepening from fingerprints with elevated tool-error counts in `60-05`/`60-06` -> expanded conversational reads across both executor threads plus the parent orchestrator (about 15 relevant messages).
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-log
origin: collect-signals
---

## What Happened

Parallel Wave 3 executors contaminated each other's commit and closeout surfaces on the shared branch/worktree. `60-05` had to undo a task commit that pulled in three out-of-boundary files, while `60-06` lost its first task commit and then saw the same validator files land from concurrent branch movement before it could record them; the parent thread also had to keep repairing stale shared state after the parallel closeouts. Supporting evidence: `60-05` at 2026-04-21T21:10:49Z: `A commit hygiene problem surfaced: the task-2 commit pulled in three out-of-boundary files that were untracked in the worktree.` It then used `git reset --mixed HEAD^` to recover and recommit only the intended files. `60-06` at 2026-04-21T21:10:30Z: `The first commit didn’t take because the new files weren’t actually staged.` At 2026-04-21T21:13:05Z: `A concurrent branch update landed the initial validator/fixture files before I could record the first task commit.` At 2026-04-21T21:13:46Z: `The branch moved again while 60-05 was finalizing...`

## Context

Phase 60. phase-level signal. session 019db1dc-9ede-7aa3-8f65-256c5fed38ce. observed around 2026-04-21T21:10:30.635Z. Wave 3 `60-06` executor running in parallel with `60-05` on the shared Phase 60 branch/worktree.. Source: /home/rookslog/.codex/sessions/2026/04/21/rollout-2026-04-21T17-05-19-019db1dc-9ede-7aa3-8f65-256c5fed38ce.jsonl

## Potential Cause

The affected tool applied or reported state in a way that operators could not trust without manual verification and cleanup.
