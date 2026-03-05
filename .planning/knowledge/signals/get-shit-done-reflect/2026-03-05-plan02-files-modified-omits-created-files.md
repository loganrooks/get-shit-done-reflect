---
id: sig-2026-03-05-plan02-files-modified-omits-created-files
type: signal
project: get-shit-done-reflect
tags: [plan-accuracy, frontmatter, files-modified]
created: 2026-03-05T06:15:00Z
updated: 2026-03-05T06:15:00Z
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 38.1
plan: 2
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
gsd_version: "1.16.0+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-05T06:15:00Z"
evidence:
  supporting:
    - "Plan 02 files_modified lists 7 entries but summary shows 10 files touched"
    - "get-shit-done/bin/kb-rebuild-index.sh and bin/migrate-kb.sh absent from files_modified"
  counter:
    - "must_haves.artifacts section does list these files"
    - "files_modified may only list pre-existing files"
confidence: high
confidence_basis: ""
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

Plan 02 `files_modified` frontmatter listed 7 entries but the summary and must_haves artifacts showed 10 files were touched during execution. Specifically, `get-shit-done/bin/kb-rebuild-index.sh` and `bin/migrate-kb.sh` were absent from the `files_modified` array despite being listed in the `must_haves.artifacts` section.

## Context

Phase 38.1 (project-local knowledge base), Plan 02. The plan involved creating shell scripts for KB management (rebuild index, migration). The `files_modified` frontmatter field did not account for newly created files.

## Potential Cause

The `files_modified` frontmatter field may be interpreted as tracking only pre-existing files that are modified, not newly created files. This is a planner convention ambiguity -- the field name suggests modification of existing files, but newly created files are also "touched" during execution.
