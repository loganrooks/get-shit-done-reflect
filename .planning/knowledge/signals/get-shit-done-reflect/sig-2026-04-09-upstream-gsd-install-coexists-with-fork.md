---
id: sig-2026-04-09-upstream-gsd-install-coexists-with-fork
type: signal
project: get-shit-done-reflect
tags:
  - installer
  - upstream-contamination
  - path-resolution
  - agent-error
created: "2026-04-09T09:30:00.000Z"
updated: "2026-04-09T09:35:00.000Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: "57.2"
plan: n/a
polarity: negative
source: manual
occurrence_count: 1
related_signals:
  - sig-2026-04-09-skill-references-upstream-gsd-tools-path
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.1+dev
---

## What Happened

Claude ran a Bash command referencing the upstream GSD runtime path instead of the fork's:

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: add backlog item 999.1 ..." --files ...
```

This failed with `MODULE_NOT_FOUND` because `~/.claude/get-shit-done/bin/gsd-tools.cjs` doesn't exist. The correct path is `~/.claude/get-shit-done-reflect/bin/gsd-tools.cjs` (the fork's runtime). CLAUDE.md explicitly states the install target is `.claude/get-shit-done-reflect/`.

## Context

The command was generated while following the `gsd-add-backlog` skill template, which hardcodes upstream paths. But Claude should have recognized the path was wrong — the project's own CLAUDE.md documents the dual-directory architecture and states "the installer copies source -> `.claude/`" with the fork's `get-shit-done-reflect` directory name.

## Potential Cause

1. Claude followed the skill template's path literally without cross-referencing CLAUDE.md's path conventions
2. The `get-shit-done/` vs `get-shit-done-reflect/` distinction is easy to miss when a template provides a plausible-looking path
3. No runtime validation exists to catch "you're referencing a path that doesn't exist" before executing
