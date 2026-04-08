---
id: sig-2026-02-18-signal-workflow-context-bloat
type: signal
project: get-shit-done-reflect
tags:
  - workflow
  - context-budget
  - signal-command
  - dx
created: "2026-02-18T16:00:00Z"
updated: "2026-02-18T16:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 22
plan: 0
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
detection_method: manual
origin: user-observation
---

## What Happened

The /gsd:signal command loaded ~600+ lines of reference context (knowledge-store.md ~367 lines, signal-detection.md ~230 lines, signal workflow ~246 lines, kb-templates/signal.md ~30 lines) into the orchestrator's context window just to write a small markdown file. User called this out as bloated — "why on earth are you loading the knowledge store agent, the signal-detection agent, and why are they like over 200 lines."

## Context

User was in the middle of Phase 22 orchestration and wanted to quickly capture a signal observation. The signal workflow's context loading consumed significant orchestrator budget for a simple file write operation. User suggested an MCP server might be a better approach for lightweight operations like signal creation.

## Potential Cause

Signal workflow was designed for completeness (dedup checking, cap enforcement, frustration detection) but the common case is just "write a small file." The workflow front-loads all reference reading regardless of whether advanced features are needed. Could benefit from: (1) an MCP server for simple operations, (2) lazy loading of references, or (3) a lightweight "quick signal" path that skips dedup/cap checks.
