---
id: sig-2026-04-17-plan-06-prestaged-worktree-mixed-closeout-commit
type: signal
project: get-shit-done-reflect
tags: [commit-hygiene, staged-worktree, shared-branch, traceability]
created: "2026-04-17T01:13:15Z"
updated: "2026-04-17T01:13:15Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: "57.6"
plan: "6"
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: codex-cli
model: gpt-5.4
gsd_version: "1.18.2+dev"
detection_method: sensor-artifact
origin: local
environment:
  os: linux
  node_version: "v22.22.1"
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-17T01:13:15Z"
evidence:
  supporting:
    - "`57.6-06-SUMMARY.md` states that commit `4640de50` included both a requested `max`-profile todo capture and the full Plan 06 report-layer code changes because those files were already staged on the shared phase branch."
    - "The summary explicitly notes that the resulting commit message was not a pure Plan 06 closeout."
  counter:
    - "The code changes still landed atomically, plan-local tests passed, and the CLI/report verification checks succeeded."
confidence: high
confidence_basis: "The summary directly describes the staged-worktree contamination, the affected commit, and the resulting traceability impact."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 57.6-06 closed out on top of a pre-staged shared worktree, so commit `4640de50` bundled unrelated todo capture together with the intended report-surface implementation. The summary calls out that the resulting commit message was not a pure plan closeout.

The implementation still shipped successfully, but the commit no longer gives a clean trace from one plan to one change set.

## Context

The artifact sensor found this in `57.6-06-SUMMARY.md`. The mixed commit happened on the shared 57.6 branch and specifically combined a requested `max` profile todo with the plan's report-layer code changes because those files were already staged before closeout.

## Potential Cause

There was no effective hygiene guard between shared-branch staging state and plan-local commit preparation. Once unrelated files were already staged, the closeout path optimized for landing the code rather than reconstructing a clean staging boundary, and traceability lost purity even though functionality remained intact.
