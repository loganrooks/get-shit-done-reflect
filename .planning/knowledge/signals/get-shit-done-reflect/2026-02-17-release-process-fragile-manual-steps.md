---
id: sig-2026-02-17-release-process-fragile-manual-steps
type: signal
project: get-shit-done-reflect
tags: [release-process, milestone-workflow, automation-gap, deviation]
created: 2026-02-17T00:30:00Z
updated: 2026-02-17T00:30:00Z
durability: convention
status: active
severity: notable
signal_type: struggle
phase: 0
plan: 0
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.14.1
---

## What Happened

The v1.14.1 release process required multiple corrective actions: the git tag was moved 3 times, the GitHub Release was deleted and recreated twice, and a CHANGELOG.md path leak (containing an absolute local filesystem path) broke the multi-runtime integration test. The entire release took significantly longer than expected due to these manual recovery steps.

## Context

This occurred after merging PR #4 (v1.14 Multi-Runtime Interop) to main. The `/gsd:complete-milestone` workflow creates annotated tags as part of milestone completion, but this happens before PR review and merge. When the PR review surfaced 6 critical bugs (C1-C6), the tag already pointed to buggy code. Fixing the bugs, bumping to v1.14.1, and publishing required manually moving the tag, recreating the release, and debugging a CHANGELOG path leak — all steps that should have been automated.

## Potential Cause

The milestone completion workflow assumes a linear flow: complete milestone → tag → done. It doesn't account for the review-then-release pattern where code review happens after milestone completion but before public release. The lack of a dedicated release command meant every step (version bump in package.json, CHANGELOG update, tag creation, GitHub Release, npm publish trigger) was manual and error-prone. The `/gsd:release` command has since been created (quick-4) to automate this, decoupling the release action from milestone completion.
