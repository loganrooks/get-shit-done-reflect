---
id: sig-2026-02-11-local-install-global-kb-model
type: signal
project: get-shit-done-reflect
tags:
  - install-model
  - local-install
  - global-kb
  - path-resolution
  - architecture
created: "2026-02-11T22:10:00Z"
updated: "2026-02-11T22:10:00Z"
durability: convention
status: active
severity: critical
signal_type: deviation
phase: post-17
plan: 0
runtime: claude-code
model: claude-opus-4-6
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-02-11-agent-inline-research-context-bloat]
detection_method: manual
origin: user-observation
---

## What Happened

User decided to install GSD Reflect at project-local level (per-project, not global ~/.claude/), while keeping the knowledge base global at ~/.gsd/knowledge/. Current v1.14 architecture assumes global installation — workflow path references like `~/.claude/agents/kb-rebuild-index.sh` break when GSD is installed locally in the project repo at `.claude/agents/kb-rebuild-index.sh`. Hit this in practice when kb-rebuild-index.sh wasn't found at the expected global path.

## Context

Post-v1.14 gap analysis. The installer and all path replacement logic (313+ references) assume global install to ~/.claude/. User wants selective per-project installation with shared global KB. This is a fundamental architecture decision that affects the gap-closing phase and potentially the next milestone.

## Potential Cause

The installer was designed for global installation from the start. Project-local installation was never a considered install mode. The two-pass path replacement system (Phase 13) and all runtime adapters assume the target is a global config directory (~/.claude/, ~/.config/opencode/, ~/.codex/). Supporting project-local install requires rethinking how paths are resolved — scripts/agents use repo-relative paths while KB uses the global ~/.gsd/knowledge/ path.
