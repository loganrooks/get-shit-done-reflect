---
id: sig-2026-02-16-branch-not-deleted-after-pr-merge
type: signal
project: get-shit-done-reflect
tags: [git-workflow, branch-management, deviation, milestone-process]
created: 2026-02-16T05:30:00Z
updated: 2026-02-16T05:30:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.14.0
---

## What Happened

After PR #3 (`sync/v1.13-upstream` to `main`) was merged on 2026-02-11 for the v1.13 milestone, the `sync/v1.13-upstream` branch was not deleted. Instead of creating a new branch for v1.14 work (e.g., `milestone/v1.14` or `sync/v1.14-interop`), all 100 v1.14 commits continued on the same `sync/v1.13-upstream` branch.

This caused:
1. **Branch name confusion**: A branch named `sync/v1.13-upstream` contains v1.14 Multi-Runtime Interop work that has nothing to do with v1.13 upstream sync
2. **PR history ambiguity**: PR #4 is from the same branch as PR #3 but covers entirely different milestone work
3. **220 commits ahead of main**: The branch accumulated commits from both v1.13 (post-merge) and v1.14 without a clean separation point

## Context

Discovered during v1.14 milestone completion when the `complete-milestone` workflow reached the branch handling step. The workflow expected either a milestone-specific branch or work on main, but found all v1.14 work on a stale v1.13-named branch. The `config.json` has no `branching_strategy` field, which means the GSD workflow had no guidance on branch lifecycle management.

## Potential Cause

1. **No branch lifecycle in milestone workflow**: The `complete-milestone` workflow handles branch merging at completion but doesn't enforce branch creation at milestone start. The `new-milestone` workflow similarly doesn't create a fresh branch.
2. **Missing post-merge cleanup**: PR #3 merge did not trigger branch deletion (GitHub auto-delete was likely not enabled, and no manual cleanup was done)
3. **Organic continuation**: Work naturally continued on the checked-out branch without anyone pausing to create a new one for the new milestone
4. **No branching_strategy config**: The project config.json doesn't declare a branching strategy, so GSD workflows don't enforce any branch naming conventions
