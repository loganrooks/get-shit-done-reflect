---
id: sig-2026-03-03-post-merge-cleanup-not-automatic
type: signal
project: get-shit-done-reflect
tags:
  - git-workflow
  - branch-management
  - deviation
  - post-merge
created: "2026-03-03T00:00:00+11:00"
updated: "2026-03-03T00:00:00+11:00"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 36
plan: 01
polarity: negative
occurrence_count: 2
related_signals: [sig-2026-02-16-branch-not-deleted-after-pr-merge]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
detection_method: manual
origin: user-observation
---

## What Happened

After merging fork PR #5 for phase 36, Claude did not automatically checkout main, pull latest, and delete the phase branch. User had to explicitly ask "do we not delete the branch checkout main in order to prepare for the next phase?" This is the same pattern as sig-2026-02-16 from v1.14.

## Context

- The project uses `git.branching_strategy: "phase"` in config.json
- The standard post-merge workflow should be: merge PR -> checkout main -> pull -> delete local branch -> delete remote branch (if not auto-deleted)
- This is the second recorded occurrence of this deviation (first: 2026-02-16)
- The convention is well-established but Claude consistently forgets it

## Potential Cause

1. **No codified post-merge checklist**: The merge step is treated as terminal, but cleanup is a separate step that Claude doesn't associate with it
2. **Convention not in CLAUDE.md or memory**: The post-merge cleanup convention isn't persisted where Claude would see it at the start of each session
3. **Recommended fix**: Add post-merge cleanup convention to project memory (checkout main, pull, delete branch)
