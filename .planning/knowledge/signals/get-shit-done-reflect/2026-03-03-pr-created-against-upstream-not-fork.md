---
id: sig-2026-03-03-pr-created-against-upstream-not-fork
type: signal
project: get-shit-done-reflect
tags:
  - pr-review
  - wrong-target
  - fork-awareness
  - upstream-pollution
created: "2026-03-03T00:00:00+11:00"
updated: "2026-04-02T21:00:00Z"
durability: convention
status: remediated
severity: critical
signal_type: deviation
phase: 36
plan: 01
polarity: negative
occurrence_count: 2
related_signals: [sig-2026-03-03-pr-review-targets-wrong-repo]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
detection_method: manual
origin: user-observation
---

## What Happened

User asked to create a PR for phase 36. Claude ran `gh pr create` which defaulted to the upstream repo (`gsd-build/get-shit-done`, PR #908) instead of the user's fork (`loganrooks/get-shit-done-reflect`). This polluted the upstream repo with a fork-specific PR. This is the second wrong-target deviation in the same session — the first was reviewing the wrong PR #5.

## Context

- This is a fork repo. The `origin` remote points to upstream `gsd-build/get-shit-done`.
- The user's fork is `loganrooks/get-shit-done-reflect`.
- `gh pr create` defaults to the repo that `origin` points to.
- CLAUDE.md explicitly documents the dual-directory architecture and fork conventions, but doesn't specify which GitHub remote to target for PRs.
- The PR was successfully created against upstream, meaning it's now visible to upstream maintainers — a more serious consequence than just reviewing the wrong PR.

## Potential Cause

1. **Git remote configuration**: `origin` likely points to upstream, not the fork. `gh pr create` uses `origin` by default.
2. **No fork-awareness convention**: There's no established rule to check remotes or use `--repo` flag when creating PRs in a fork context.
3. **Missing guardrail**: Should check `git remote -v` before PR operations to confirm target repo, or use `gh pr create --repo loganrooks/get-shit-done-reflect`.
4. **Compounding error**: Same root cause as the PR review deviation — Claude doesn't distinguish fork vs upstream context.

## Remediation

Mitigated by project memory convention (MEMORY.md Fork PR Target section). Not embedded in workflow files — mitigation is memory-based. No recurrence since convention was established.
