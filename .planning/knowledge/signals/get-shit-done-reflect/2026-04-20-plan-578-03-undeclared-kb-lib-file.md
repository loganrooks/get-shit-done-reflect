---
id: sig-2026-04-20-plan-578-03-undeclared-kb-lib-file
type: signal
project: get-shit-done-reflect
tags: [scope-creep, plan-accuracy, kb]
created: "2026-04-20T09:11:14Z"
updated: "2026-04-20T09:11:14Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 57.8
plan: 03
polarity: negative
source: auto
occurrence_count: 4
related_signals:
  - sig-2026-03-02-plan-scope-declaration-mismatch-35-03-and-04
  - sig-2026-03-05-undeclared-claude-dir-scope-creep-plan02
  - sig-2026-03-26-core-cjs-modified-in-plan-50-03-execution
  - sig-2026-03-26-plan-51-01-files-modified-omits-tests-unit
  - sig-2026-03-27-plan-05-adopted-undeclared-agent-gsd-advisor-resea
  - sig-2026-03-27-plan-53-04-declared-zero-file-modifications-but
  - sig-2026-03-28-plan-01-declared-4-files-modified-but-only
  - sig-2026-04-10-plan-03-scope-extension-wiring-validation-undeclared
  - sig-2026-04-17-plan-576-04-extra-non-planning-file-declared-scope
provenance_schema: v2_split
provenance_status: ""
about_work:
  - role: subject
    kind: plan-vs-commit-surface
    phase: 57.8
    plan: 03
    phase_dir: /home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/57.8-signal-provenance-split-artifact-signature-blocks
    commit_range: 2270b404ef4e175b9e7a6266fb19d738d1f212c7..5e208968de6fcd7d3bacb910f25918cb7d8056ee
detected_by:
  role: sensor
  harness: claude-code
  platform: claude
  vendor: anthropic
  model: gpt-5.4
  reasoning_effort: xhigh
  profile: quality
  gsd_version: not_available
  generated_at: "2026-04-20T09:11:14Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: exposed
    reasoning_effort: exposed
    profile: exposed
    gsd_version: not_available
    generated_at: derived
    session_id: not_available
  provenance_source:
    role: signal_synthesizer_default
    harness: sensor_output.runtime
    platform: derived_from_harness
    vendor: derived_from_harness
    model: sensor_output.model
    reasoning_effort: signal_context.reasoning_effort
    profile: signal_context.config_profile
    gsd_version: not_available
    generated_at: writer_clock
    session_id: not_available
  sensor: git
  detection_method: sensor-git
  analysis_scope: plan files_modified declaration vs phase-scoped git log
  run_label: primary
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
    - Plan 57.8-03 declared 5 non-planning files after excluding .planning signal annotations; git log for `(57.8-03)` touched 6 non-planning files.
    - "Unexpected non-planning file beyond the declaration: get-shit-done/bin/lib/kb.cjs"
    - "The undeclared file was touched by commit 2270b404ef4e175b9e7a6266fb19d738d1f212c7 fix(57.8-03): upgrade legacy kb db before provenance indexes."
  counter:
    - Extra files may represent legitimate auto-fixes (deviation Rules 1-3) or necessary supporting changes.
confidence: medium
confidence_basis: Comparison of the plan declaration against phase-scoped git log shows exactly one extra non-planning file; the mismatch is concrete but still plausibly a necessary supporting fix.
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
detection_method: sensor-git
origin: collect-signals
---

## What Happened

Phase-scoped git history for Plan 57.8-03 shows one undeclared non-planning file beyond the plan declaration: `get-shit-done/bin/lib/kb.cjs`.
That extra touch happened during the regression and legacy-annotation wave, so the actual code-change surface exceeded what the plan declared.

## Context

The git sensor compared the Plan 03 `files_modified` declaration against commits in `2270b404ef4e175b9e7a6266fb19d738d1f212c7..5e208968de6fcd7d3bacb910f25918cb7d8056ee`.
The undeclared helper change lines up with the migration bug fix discovered during verification, which suggests a necessary corrective expansion rather than arbitrary drift.

## Potential Cause

The live migration bug appears to have forced a helper-layer fix in `kb.cjs` that the original plan did not anticipate.
That makes this another declaration-accuracy problem: the plan surface was too narrow for the real repair path.
