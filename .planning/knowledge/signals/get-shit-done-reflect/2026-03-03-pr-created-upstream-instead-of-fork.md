---
id: sig-2026-03-03-pr-created-upstream-instead-of-fork
type: signal
project: get-shit-done-reflect
tags: [pr-create, wrong-target, fork-awareness, upstream-pollution]
created: 2026-03-03T00:00:00+11:00
updated: 2026-04-02T21:00:00Z
durability: convention
status: remediated
severity: critical
signal_type: deviation
phase: "36"
plan: "01"
polarity: negative
source: manual
occurrence_count: 2
related_signals: [sig-2026-03-03-pr-review-targets-wrong-repo]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0+dev
---

## What Happened

User asked to create a PR for phase 36. Claude ran `gh pr create` without `--repo` flag. GitHub's fork default behavior opened PR #908 against the upstream repo (`gsd-build/get-shit-done`) instead of the user's fork (`loganrooks/get-shit-done-reflect`). The upstream PR had to be closed with an apology comment, and the correct PR already existed on the fork as PR #5.

## Context

- Git remotes: `origin` = `loganrooks/get-shit-done-reflect` (fork), `upstream` = `gsd-build/get-shit-done`
- Despite `origin` pointing to the fork, `gh pr create` defaults to creating PRs against the **parent** repo for forks — this is GitHub's standard fork behavior
- The correct PR #5 already existed on the fork — Claude should have checked first
- This is the second wrong-target deviation in the same session (first: reviewing the wrong PR #5)
- The "again" in user's earlier feedback indicates this is a multi-session recurring pattern

## Potential Cause

1. **GitHub fork default**: `gh pr create` in a fork defaults to parent repo, not the fork itself. Must use `--repo loganrooks/get-shit-done-reflect` explicitly
2. **No pre-flight check**: Claude didn't check existing open PRs on the fork before creating a new one
3. **Convention gap**: CLAUDE.md documents dual-directory architecture and fork tag conventions but doesn't specify PR target repo
4. **Recommended fix**: Add to CLAUDE.md or memory: "Always use `--repo loganrooks/get-shit-done-reflect` for `gh pr` commands"

## Remediation

Mitigated by project memory convention (MEMORY.md Fork PR Target section). Not embedded in workflow files — mitigation is memory-based. No recurrence since convention was established.
