---
id: sig-2026-03-03-pr-review-targets-wrong-repo
type: signal
project: get-shit-done-reflect
tags:
  - pr-review
  - wrong-target
  - disambiguation
  - recurring
created: "2026-03-03T00:00:00+11:00"
updated: "2026-03-03T00:00:00+11:00"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 36
plan: 01
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
detection_method: manual
origin: user-observation
---

## What Happened

User asked to "review PR 5" and Claude reviewed PR #5 on the current repo (get-shit-done-reflect), which was an old closed PR about auto-continue/spawn-based session chaining. The user's intent was to review a PR on a different repo. User flagged this with "you are looking at the wrong PRs again", indicating this is a recurring mistake.

## Context

- The current working directory is the GSD Reflect development repo
- When user says "review PR N" without specifying a repo, Claude defaults to `gh pr view N` in the current directory
- The user has multiple projects and the intended PR was likely on a different repository
- The word "again" indicates this disambiguation failure has happened before

## Potential Cause

1. **Ambiguous request**: "review PR 5" doesn't specify which repository
2. **Default assumption**: Claude assumes the current working directory's repo is the target
3. **No clarification step**: Claude should ask which repo when the user works across multiple projects, especially when in a dev tool repo where PRs are less likely to be the review target
4. **Convention needed**: When in the GSD dev repo, PR review requests likely target user's application repos, not GSD itself
