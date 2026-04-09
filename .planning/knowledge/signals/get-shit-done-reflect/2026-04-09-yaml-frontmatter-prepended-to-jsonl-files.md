---
id: sig-2026-04-09-yaml-frontmatter-prepended-to-jsonl-files
type: signal
project: get-shit-done-reflect
tags: [migration, format-mismatch, jsonl, frontmatter, audit-infrastructure]
created: "2026-04-09T12:00:00Z"
updated: "2026-04-09T12:00:00Z"
durability: workaround
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 57.3
plan:
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-09T12:00:00Z"
evidence:
  supporting:
    - "YAML frontmatter was prepended to 3 JSONL session transcript files"
    - "JSONL format does not support YAML frontmatter (each line must be valid JSON)"
    - "This structural anomaly was not anticipated in the migration plan"
    - "Files affected are in the audit-infrastructure area"
  counter: []
confidence: high
confidence_basis: "Artifact sensor directly observed the format mismatch in 3 specific files"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

YAML frontmatter was prepended to 3 JSONL (JSON Lines) session transcript files. This is a structural anomaly: JSONL format requires each line to be a valid JSON object, and a YAML frontmatter block at the top of the file breaks this invariant. The migration plan did not anticipate this case.

## Context

Phase 57.3 audit infrastructure migration work. The migration process that adds YAML frontmatter to files in the project applied the same treatment to JSONL transcript files, which cannot support frontmatter in their format.

## Potential Cause

The migration script or agent responsible for adding frontmatter did not have a file-type exclusion list that explicitly excluded `.jsonl` files. The frontmatter-prepend logic applied uniformly to all candidate files without checking whether the format was compatible with YAML frontmatter headers.
