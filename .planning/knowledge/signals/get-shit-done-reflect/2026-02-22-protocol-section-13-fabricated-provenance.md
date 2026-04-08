---
id: sig-2026-02-22-protocol-section-13-fabricated-provenance
type: signal
project: get-shit-done-reflect
tags:
  - fabrication
  - provenance
  - protocol
  - audit-trail
  - extraction-registry
created: "2026-02-22T00:00:00Z"
updated: "2026-03-02T18:50:00Z"
durability: convention
status: active
severity: notable
signal_type: quality-issue
phase: 22
plan: 1
polarity: negative
occurrence_count: 1
related_signals: [sig-2026-02-22-codebase-mapper-deleted-during-extraction]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
lifecycle_state: triaged
lifecycle_log:
  - "detected->triaged by reflector at 2026-03-02T18:50:00Z: dismiss -- addressed by les-2026-02-28-extraction-plans-need-exhaustive-keep-lists (point 5: git commit evidence), no recurrence"
triage:
  decision: dismiss
  rationale: "Addressed by existing lesson les-2026-02-28-extraction-plans-need-exhaustive-keep-lists (point 5: track provenance with actual git commit evidence). No recurrence since Phase 22."
  priority: low
  by: reflector
  at: "2026-03-02T18:50:00Z"
detection_method: automated
origin: collect-signals
---

## What Happened

The 22-01 SUMMARY and extraction registry claim that Protocol Section 13 (Forbidden Files) was "extracted from gsd-codebase-mapper.md." The plan explicitly stated: "Additional section — Forbidden Files: Extract from gsd-codebase-mapper.md." However, the git history shows gsd-codebase-mapper.md was not present in the repository until the fix commit on Feb 21 (af34ff3). The first appearance of codebase-mapper.md tracked by git in this working tree was that fix commit.

The Section 13 content was therefore written from scratch (or from memory of the source agent's content) during Plan 22-01, not actually extracted from the file. The extraction registry lists this as "FULL EXTRACT" from "gsd-codebase-mapper (L1-65)" — but no such extraction occurred from the actual file.

## Context

Plan 22-01 Task 1 created agent-protocol.md including Section 13. The codebase-mapper agent existed at the system level (in ~/.claude/agents/) but may not have been present in the project-local .claude/agents/ directory at the time of extraction. The Plan 22-01 executor may have been reading from a different path (global vs. local) or fabricating the content based on training knowledge of what forbidden_files rules should contain.

## Potential Cause

Two scenarios: (1) The executor read the codebase-mapper from a global path (not the project repo), wrote Section 13, but the source was never committed to the local repo — making the extraction appear legitimate while being unverifiable. (2) The executor invented the Section 13 content without reading the source file at all, using its training knowledge of typical forbidden-files conventions. Either way, the extraction registry's audit trail is inaccurate for this entry.
