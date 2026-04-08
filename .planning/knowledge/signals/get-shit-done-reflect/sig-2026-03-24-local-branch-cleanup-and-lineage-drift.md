---
id: sig-2026-03-24-local-branch-cleanup-and-lineage-drift
type: signal
project: get-shit-done-reflect
tags:
  - git-workflow
  - branch-management
  - post-merge
  - local-cleanup
  - stale-lineage
  - remote-mismatch
  - codex
created: "2026-03-24T05:05:42Z"
updated: "2026-03-24T05:05:42Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 48.1
plan: 01
polarity: negative
occurrence_count: 4
related_signals:
  - sig-2026-02-16-branch-not-deleted-after-pr-merge
  - sig-2026-03-03-post-merge-cleanup-not-automatic
  - sig-2026-03-23-phase-stack-complete-but-not-integrated
runtime: codex-cli
model: gpt-5.4
gsd_version: 1.17.5
detection_method: manual
origin: user-observation
---

## What Happened

After the Phase 45-48 implementation stack was successfully merged to `main`
through PR `#18`, local branch hygiene still did not complete. The repository
now contains a mixed state:

- several older phase branches are already merged into `main` but still exist
  locally
- local `gsd/phase-48-module-extensions-verification` was not closed after the
  PR and continued accumulating later governance / 48.1-prep commits
- local `gsd/phase-48.1-post-audit-upstream-drift-retriage-and-roadmap-reconciliation`
  was then created from that stale `phase-48` branch instead of from refreshed
  `main`
- neither `phase-48` nor `phase-48.1` exists on `origin`, so the next proper
  CI-gated PR step still has not happened for 48.1

This means the actual code merge for Phase 48 succeeded, but the local branch
lifecycle remained broken in this Codex session, and later phase work inherited
the wrong lineage.

## Context

Concrete branch state at diagnosis time:

- `main` is at merge commit `ea3fae5` from PR `#18`
- local `gsd/phase-48-module-extensions-verification` is **2 behind / 9 ahead**
  of `main`
- the "ahead" commits on local `phase-48` are not Phase 48 implementation;
  they are later quick-task, deliberation, and 48.1 setup commits
- local `gsd/phase-48.1-...` reflog shows it was created from `HEAD` at
  `43354e7`, confirming it was branched from stale local `phase-48`
- local `gsd/phase-48.1-...` is **2 behind / 13 ahead** of `origin/main`
- there is **no** `origin/gsd/phase-48-module-extensions-verification`
- there is **no** `origin/gsd/phase-48.1-...`

Dead local branches already merged to `main`:

- `gsd/phase-41-health-score-automation`
- `gsd/phase-42-reflection-automation`
- `gsd/phase-44-gsdr-namespace-co-installation`
- `gsd/phase-45-cjs-rename`
- `gsd/phase-46-upstream-module-adoption`
- `gsd/phase-47-fork-module-extraction`

Remote cleanup is only partial:

- `origin/gsd/phase-41-health-score-automation` still exists
- `origin/gsd/phase-44-gsdr-namespace-co-installation` is gone
- `origin/gsd/phase-45-cjs-rename` is gone
- `origin/gsd/phase-46-*`, `47-*`, `48-*`, and `48.1-*` do not exist

Scope note:

- This signal is recorded as a **Codex-observed** git-flow issue because the
  current stale-lineage and cleanup failure happened in the live Codex session.
- It should **not** be read as "Codex only." Related signals already show
  Claude Code also failing post-merge branch cleanup (`sig-2026-02-16-branch-not-deleted-after-pr-merge`
  and `sig-2026-03-03-post-merge-cleanup-not-automatic`), which suggests the
  deeper problem may be workflow design and enforcement rather than one runtime
  alone.

## Potential Cause

The repo is handling "merge the work" and "close the branch lifecycle" as
separate, loosely remembered conventions rather than one enforced workflow.

Likely contributing factors:

1. The Phase 45-48 merge was done through a temporary integration branch, so
   GitHub auto-deleted that PR branch but not the underlying local phase branch.
2. Post-merge cleanup is not enforced as a required step: checkout `main`,
   pull, delete stale local phase branches, and start the next phase from fresh
   `main`.
3. Local continuity bias made it easy to keep working from the checked-out
   branch (`phase-48`) instead of resetting branch discipline after the merge.
4. Remote cleanup visibility is misleading because some stale phase branches are
   gone remotely while their corresponding local branches still exist and look
   "active" to the person in the repo.
