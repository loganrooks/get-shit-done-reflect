---
id: sig-2026-04-20-audit-session-left-uncommitted-until-reminder
type: signal
project: get-shit-done-reflect
tags:
  - workflow-gap
  - phase-closeout
  - audit-workflow
  - commit-discipline
  - artifact-commit
  - orchestrator-gap
created: "2026-04-20T05:24:38Z"
updated: "2026-04-20T05:24:38Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: "58"
plan: "0"
polarity: negative
source: manual
occurrence_count: 7
related_signals:
  - sig-2026-04-17-phase-closeout-left-state-pr-release-pending
  - sig-2026-04-20-phase-closeout-planning-state-release-lag
provenance_schema: v2_split
provenance_status: ""
about_work: []
detected_by:
  role: manual-observer
  harness: codex-cli
  platform: codex
  vendor: openai
  model: not_available
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.5+dev
  generated_at: "2026-04-20T05:24:38Z"
  session_id: 019d9aa2-7ff7-7e30-848c-bfe8f70dd8a1
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: runtime_not_exposed
    reasoning_effort: runtime_not_exposed
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: exposed
  provenance_source:
    role: manual_signal_contract
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: runtime_not_exposed
    reasoning_effort: runtime_not_exposed
    profile: .planning/config.json:model_profile
    gsd_version: .codex/get-shit-done-reflect/VERSION
    generated_at: writer_clock
    session_id: env:CODEX_THREAD_ID
written_by:
  role: manual-writer
  harness: codex-cli
  platform: codex
  vendor: openai
  model: not_available
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.5+dev
  generated_at: "2026-04-20T05:24:38Z"
  session_id: 019d9aa2-7ff7-7e30-848c-bfe8f70dd8a1
  provenance_status:
    role: derived
    harness: exposed
    platform: derived
    vendor: derived
    model: runtime_not_exposed
    reasoning_effort: runtime_not_exposed
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: exposed
  provenance_source:
    role: manual_signal_contract
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: runtime_not_exposed
    reasoning_effort: runtime_not_exposed
    profile: .planning/config.json:model_profile
    gsd_version: .codex/get-shit-done-reflect/VERSION
    generated_at: writer_clock
    session_id: env:CODEX_THREAD_ID
runtime: codex-cli
model: not_available
gsd_version: 1.19.5+dev
---

## What Happened

The Phase 58 and Phase 59 audit outputs came back successfully, but their session directories were still left uncommitted until the user explicitly intervened and said the audits should of course be committed.

That means the audit workflow still has a post-output seam where "audit finished on disk" is treated as good enough even though the artifact has not yet been recorded in git. The user had to supply the missing closeout step manually.

## Context

- Two cross-vendor audit sessions were created under `.planning/audits/2026-04-20-phase-58-structural-gates-gap-audit/` and `.planning/audits/2026-04-20-phase-59-kb-architecture-gap-audit/`.
- Both produced full markdown outputs, and the session directories were present in the worktree as untracked artifacts.
- The assistant reported the audit findings back to the user before committing the audit directories.
- The user explicitly called this out as a workflow gap and requested both a manual signal and immediate audit commits.
- This sits in the same family as the existing phase-closeout lag signals: artifact production was treated as completion before the recording/closeout discipline actually finished.

## Potential Cause

The audit workflow currently lacks a mandatory "session artifact committed or intentionally deferred" postlude. Once the audit output file exists, the workflow can appear complete even though the audit session is still only a dirty worktree artifact.

That makes audit completion rely on agent discretion rather than a structural closeout rule. In practice, it recreates the broader closeout seam already seen in state-sync and release-boundary drift: outputs exist, but the repository's durable project record is still lagging behind them.
