---
id: sig-2026-04-09-agent-used-upstream-gsd-tools-path-57-3
type: signal
project: get-shit-done-reflect
tags: [session-log, upstream-fork-confusion, wrong-tool-path, repeated-instruction, user-correction]
created: "2026-04-09T12:00:00Z"
updated: "2026-04-09T22:00:00Z"
durability: convention
status: active
severity: minor
signal_type: struggle
signal_category: negative
phase: 57.3
plan:
polarity: negative
source: auto
occurrence_count: 1
related_signals:
  - sig-2026-04-09-skill-references-upstream-gsd-tools-path
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-09T12:00:00Z"
  - "archived by gsdr-signal-synthesizer at 2026-04-09T22:00:00Z: per-phase cap enforcement (phase 57 exceeded 10 signals)"
evidence:
  supporting:
    - "Agent ran upstream $HOME/.claude/get-shit-done/bin/gsd-tools.cjs path instead of fork installation"
    - "Required 3 correction messages before using the correct path"
    - "Correct path is the fork's local get-shit-done-reflect installation"
  counter:
    - "Upstream and fork tools produce identical output for most commands; practical impact may be minimal"
    - "The upstream tool is also available and may produce correct results"
confidence: medium
confidence_basis: "Directly observed in session log; 3 corrections indicates persistent confusion not a one-time slip"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

During phase 57.3, an agent repeatedly ran the upstream `$HOME/.claude/get-shit-done/bin/gsd-tools.cjs` path instead of the fork's installed `gsd-tools.cjs` path. Three correction messages were required before the agent used the correct path. This is related to the existing `sig-2026-04-09-skill-references-upstream-gsd-tools-path` signal which captures a structural version of this issue.

## Context

Phase 57.3 execution. The agent has access to both the upstream gsd-tools installation and the fork-specific installation. Without explicit disambiguation, it defaults to the upstream (global) path rather than the project-local fork path.

## Potential Cause

The agent's tool path resolution defaults to the upstream global installation, which is the more "obvious" path in the environment. The fork's installation path is less prominent and requires explicit knowledge of the dual-directory architecture. The skill spec files that reference the upstream path (captured in the related signal) contribute to this confusion by normalizing the wrong path in the agent's context.
