---
id: sig-2026-04-09-upstream-gsd-install-coexists-with-fork
type: signal
project: get-shit-done-reflect
tags:
  - installer
  - upstream-contamination
  - dual-install
  - skill-routing
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
  - sig-2026-04-09-skill-references-upstream-gsd-tools-path
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.1+dev
---

## What Happened

Both upstream GSD (`gsd-` prefix) and fork GSDR (`gsdr:` prefix) skills are loaded simultaneously in the Claude Code session. The skill list shows two complete sets: ~40 `gsd-*` skills (no version suffix) alongside ~40 `gsdr:*` skills (with `v1.19.1+dev` suffix). When a `gsdr:` command doesn't exist (e.g., `gsdr:add-backlog`), the system silently falls back to the upstream `gsd-` version, which uses upstream paths and assumptions.

Evidence: `~/.claude/gsd-local-patches/commands/gsd/` contains upstream GSD command files that load as `gsd-` prefix skills.

## Context

The fork is supposed to replace upstream GSD for this project. Having both loaded creates:
1. Silent fallback to upstream behavior when fork commands are missing
2. Path mismatches (upstream assumes `~/.claude/get-shit-done/`, fork uses `~/.claude/get-shit-done-reflect/`)
3. Confusion about which version of a command is running
4. The `gsd-local-patches` directory appears to be a backup from before the fork was installed, now acting as a parallel skill source

Related TODO: "Dual-install Phase 2: update flow, hook awareness, and version-pinned suppression" (HIGH priority in STATE.md pending todos).

## Potential Cause

1. The upstream GSD was installed before the fork, and its artifacts were never fully cleaned up
2. `~/.claude/gsd-local-patches/commands/gsd/` survived the fork installation and Claude Code discovers it as a command source
3. The fork installer doesn't remove or disable upstream command files — it only adds fork files alongside them
