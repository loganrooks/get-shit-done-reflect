---
id: sig-2026-02-11-kb-script-wrong-location-and-path
type: signal
project: get-shit-done-reflect
tags: [kb-management, path-resolution, architecture, misplaced-artifact]
created: 2026-02-11T22:15:00Z
updated: 2026-04-02T20:00:00Z
durability: convention
status: remediated
severity: critical
signal_type: config-mismatch
phase: post-17
plan: 0
runtime: claude-code
model: claude-opus-4-6
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-02-11-local-install-global-kb-model]
---

## What Happened

kb-rebuild-index.sh (and kb-create-dirs.sh) have three problems: (1) Workflows reference `~/.claude/agents/kb-rebuild-index.sh` but post-v1.14 KB migration to `~/.gsd/knowledge/`, the script should live under `~/.gsd/` not `~/.claude/`. Path is wrong even for global installs. (2) The script operates on the global KB, so it should be installed once globally (e.g. `~/.gsd/bin/kb-rebuild-index.sh`), not copied per-project. (3) A bash utility script doesn't belong in `agents/` — that directory is for LLM agent specs (markdown). It's a tool, not an agent.

## Context

Discovered during post-v1.14 gap analysis when kb-rebuild-index.sh wasn't found at the expected path. The v1.14 KB migration moved data to `~/.gsd/knowledge/` but didn't move the management scripts or update their references.

## Potential Cause

KB migration (Phase 14) focused on data files and path references in source content, but overlooked the management scripts themselves. The scripts were treated as "agent files" because they happened to live in `agents/`, but they're actually KB infrastructure that should travel with the KB.

## Remediation

Resolved by Phase 19 KB Infrastructure (commit 1a79aea, 2026-02-14). installKBScripts() now copies scripts to ~/.gsd/bin/, all workflow references updated.
