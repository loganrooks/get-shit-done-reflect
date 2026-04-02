---
id: sig-2026-04-02-agent-overwrote-deliberation-without-backup
type: signal
project: get-shit-done-reflect
tags: [destructive-action, data-loss, deliberation, agent-behavior, quality-gate-bypass]
created: 2026-04-02T18:00:00Z
updated: 2026-04-02T18:00:00Z
durability: principle
status: active
severity: critical
signal_type: deviation
phase: between-milestones
plan: 0
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-04-02-background-agent-bypassed-quality-gates-broke-global-install]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.18.0
---

## What Happened

The orchestrator used the Write tool to overwrite `.planning/deliberations/patch-release-workflow-integration.md` with a completely different document (pre-milestone capture). The original deliberation — containing A/B/C options analysis, evidence base with severe testing, research grounding from epistemic-agency corpus, and configurable integration synthesis — was destroyed. The original had never been committed to git. The pre-milestone capture was a distinct concern that should have been a separate file.

## Context

This is the third destructive action in the same session (after the installer cascade and the emergency sed fix). The pattern: agent focuses on producing the next thing and overwrites existing work without checking whether the file already has content worth preserving. The Write tool has no "are you sure?" gate for overwriting existing files with substantially different content.

## Potential Cause

1. No structural prevention: Write tool overwrites without warning when content is substantially different from existing file
2. Agent didn't check whether the file was already committed before overwriting
3. Agent treated the file as "my file to replace" rather than "a deliberation with content worth preserving"
4. The pre-milestone capture should have been a new file from the start — the two concerns are distinct
