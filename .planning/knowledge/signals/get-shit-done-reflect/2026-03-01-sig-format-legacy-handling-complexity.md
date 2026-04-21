---
id: sig-2026-03-01-sig-format-legacy-handling-complexity
type: signal
project: get-shit-done-reflect
tags:
  - legacy
  - sig-format
  - technical-debt
  - complexity
  - reflector
created: "2026-03-01T19:00:06Z"
updated: "2026-03-01T19:00:06Z"
durability: convention
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 33
plan: 3
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-01T19:00:06Z"
evidence:
  supporting:
    - "33-03-PLAN.md Step 2a: 'SIG-format signals (ID starts with SIG-): mark as legacy, treat as read-only. Note: 5 SIG-format entries have malformed index rows (empty project/date, non-standard status values like resolved/open). Skip rows with empty Project column.'"
    - "33-03-PLAN.md: SIG-format signals appear in guidelines as separate handling for dashboard (Legacy row), triage (never modify), and analysis (read-only contributors)"
    - KB index shows 15 SIG-format signals, 5 with malformed rows (empty project, non-standard status)
  counter: []
confidence: medium
confidence_basis: Evidence from plan spec and KB index. The complexity is real but bounded to 15 legacy signals that will not grow.
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

The Phase 33 reflector must implement special-case handling for 15 SIG-format legacy signals (SIG-260222-*, SIG-260223-*). These signals predate the standard schema and have non-standard field values (status: resolved/open instead of active, empty project fields, missing dates). The reflector handles them as read-only contributors to pattern detection, counted separately in the lifecycle dashboard as "Legacy (read-only)", and never included in triage write operations.

## Context

The SIG-format signals were created during Phase 22 before the standard signal schema was established. 5 of the 15 have malformed index rows. The reflector needs conditional logic: skip rows with empty Project column, infer project from directory path, treat as detected lifecycle state, and exclude from any mutation operations.

## Potential Cause

Organic evolution of the signal schema from Phase 22 through Phase 31 created backward compatibility obligations. The 15 legacy signals are frozen in their original format and cannot be migrated without risk of data loss.
