---
id: sig-2026-03-02-plan-04-files-modified-lists-runtime-not-source
type: signal
project: get-shit-done-reflect
tags: [config, deviation]
created: "2026-03-02T00:00:00Z"
updated: "2026-03-02T00:00:00Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 35
plan: 4
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-03-02-gitignore-force-add-and-kb-external-deviations
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-02T00:00:00Z"
evidence:
  supporting:
    - Plan 04 files_modified lists only .claude/ paths
    - "CLAUDE.md states: 'Always edit npm source directories, never .claude/ directly'"
    - Plans 01-03 correctly list npm source paths in their files_modified
  counter:
    - Plan 04's purpose was explicitly installer sync -- listing .claude/ paths may be intentional for this specific plan type
    - VERIFICATION.md confirmed all runtime files match source
confidence: medium
confidence_basis: Observable deviation from convention in plan frontmatter
triage: "{}"
remediation: "{}"
verification: "{}"
recurrence_of: 
detection_method: automated
origin: collect-signals
---

## What Happened

Plan 35-04 (installer sync) listed `.claude/` runtime paths in its `files_modified` frontmatter array rather than the npm source directory paths (`agents/`, `get-shit-done/`, `commands/`). This inverts the dual-directory architecture convention established in CLAUDE.md. Plans 01-03 in the same phase correctly listed npm source paths.

This is related to the pattern of installer/sync deviations observed in phase 34 (sig-2026-03-02-gitignore-force-add-and-kb-external-deviations).

## Context

Phase 35, plan 04. Plan 04's purpose was to sync installer output -- verifying that `.claude/` runtime files match their npm source counterparts. This made the plan's focus on `.claude/` files somewhat contextually appropriate, though the convention still calls for listing source paths.

## Potential Cause

The executor likely listed the files it was directly inspecting and modifying (the `.claude/` runtime targets) rather than following the convention of listing source paths. For an installer sync plan whose task is explicitly to update runtime files, this is an understandable if technically non-conformant choice.
