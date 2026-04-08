---
id: sig-2026-02-11-agent-inline-research-context-bloat
type: signal
project: get-shit-done-reflect
tags:
  - context-bloat
  - agent-behavior
  - research-orchestration
  - deviation
created: "2026-02-11T22:00:00Z"
updated: "2026-02-11T22:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: post-17
plan: 0
runtime: claude-code
model: claude-opus-4-6
polarity: negative
occurrence_count: 1
related_signals: []
detection_method: manual
origin: user-observation
---

## What Happened

During a resume-work session, the agent read full Phase 13 RESEARCH.md (745 lines) and Phase 15 RESEARCH.md (744 lines) directly into the main conversation context, then ran 4 parallel web searches — all inline. This consumed ~1500+ lines of context for research that should have been delegated to a subagent (Explore or research agent) which would return a compact summary.

## Context

Post-v1.14 gap analysis discussion. User asked about Codex CLI's agent-spawning capabilities. Instead of spawning a research agent to investigate and return findings, the orchestrating agent loaded raw research files and web search results directly, bloating the main context window and reducing space for the actual design discussion.

## Potential Cause

Agent defaulted to direct file reads and web searches for "quick" lookups without considering cumulative context cost. The 1500+ lines of research files were not "quick" — they should have triggered the heuristic to delegate to a subagent. Convention needed: research tasks exceeding ~200 lines of source material should be delegated, not inlined.
