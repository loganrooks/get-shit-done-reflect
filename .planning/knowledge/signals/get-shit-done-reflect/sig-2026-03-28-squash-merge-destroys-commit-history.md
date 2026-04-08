---
id: sig-2026-03-28-squash-merge-destroys-commit-history
type: signal
project: get-shit-done-reflect
tags:
  - git-workflow
  - pr-merge
  - squash
  - traceability
  - commit-history
  - devops
created: "2026-03-28T07:30:00Z"
updated: "2026-03-28T07:30:00Z"
durability: convention
status: active
severity: critical
signal_type: deviation
phase: 53
plan: 04
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-03-28-offer-next-skips-pr-workflow]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.17.5+dev
detection_method: manual
origin: user-observation
---

## What Happened

When merging PR #24 (Phase 53: Deep Integration), `gh pr merge --squash` was used, collapsing 13 individual atomic commits into a single squash commit on main. This destroyed the per-task, per-plan commit granularity that the GSD execution framework deliberately creates. The user had to guide recovery: temporarily enabling force-push on the protected branch, resetting main, re-merging with `--merge` to preserve individual commits, and force-pushing the corrected history.

## Context

- Phase 53 had 13 commits: 4 plans x 2 task commits each + 4 summary commits + 1 signal commit
- The GSD executor creates atomic commits per task specifically for traceability — each commit maps to a specific task in a specific plan
- The squash merge reduced all of this to one opaque commit, making it impossible to trace which commit implemented which requirement
- This decision was made during auto-effort (medium reasoning) without consulting the user about merge strategy
- Recovery required: `git reset --hard`, `git merge --no-ff`, temporarily disabling GitHub branch protection via API, force-push, re-enabling protection

## Potential Cause

1. No established convention for merge strategy — the `--squash` flag was chosen without considering the traceability implications
2. The execute-phase workflow's offer_next step doesn't specify merge strategy, leaving it to ad-hoc decisions
3. Medium reasoning effort may have contributed to not thinking through the implications of squash vs merge
4. The inter-phase git workflow (PR creation, merge strategy, post-merge cleanup) is not codified in the GSD workflow specs, leaving each step to improvisation
