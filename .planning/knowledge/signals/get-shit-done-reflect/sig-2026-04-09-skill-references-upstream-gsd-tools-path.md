---
id: sig-2026-04-09-skill-references-upstream-gsd-tools-path
type: signal
project: get-shit-done-reflect
tags:
  - installer
  - skill-templates
  - upstream-contamination
  - path-resolution
created: "2026-04-09T09:30:00.000Z"
updated: "2026-04-09T09:30:00.000Z"
durability: convention
status: active
severity: notable
signal_type: config-mismatch
phase: "57.2"
plan: n/a
polarity: negative
source: manual
occurrence_count: 1
related_signals:
  - sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.1+dev
---

## What Happened

The `gsd-add-backlog` skill template references `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` — the upstream GSD path. The fork's runtime lives at `$HOME/.claude/get-shit-done-reflect/bin/gsd-tools.cjs`. The upstream path doesn't exist, causing a `MODULE_NOT_FOUND` error when the skill tries to use gsd-tools commands (e.g., `phase next-decimal`, `generate-slug`, `commit`).

## Context

The fork's installer (`bin/install.js`) handles path conversion via `replacePathsInContent()` for files it installs. But `gsd-add-backlog` is loaded as a skill from the upstream `gsd-` namespace, not from the fork's `gsdr:` command directory. The skill template was never processed through the fork's installer path rewriting.

## Potential Cause

1. The `gsd-add-backlog` skill exists in the upstream skill definitions but has no `gsdr:add-backlog` equivalent in the fork's command directory (`commands/gsd/` has no backlog command files)
2. Skills loaded from the upstream namespace use upstream paths that assume `~/.claude/get-shit-done/` exists
3. The fork's installer only rewrites paths in files it copies — skills that come from elsewhere are not rewritten
