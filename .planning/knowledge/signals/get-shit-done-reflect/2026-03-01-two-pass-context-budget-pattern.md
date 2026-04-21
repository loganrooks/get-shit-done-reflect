---
id: sig-2026-03-01-two-pass-context-budget-pattern
type: signal
project: get-shit-done-reflect
tags:
  - context-management
  - two-pass-loading
  - performance
  - reflector
  - good-pattern
created: "2026-03-01T19:00:02Z"
updated: "2026-03-01T19:00:02Z"
durability: convention
status: active
severity: notable
signal_type: good-pattern
signal_category: positive
phase: 33
plan: 3
polarity: positive
occurrence_count: 1
related_signals:
  - sig-2026-02-11-signal-workflow-context-bloat
  - sig-2026-02-18-signal-workflow-context-bloat
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-01T19:00:02Z"
evidence:
  supporting:
    - "33-03-PLAN.md Step 2: 'Index pass: Read index.md and parse the markdown table using shell commands (grep/awk). IMPORTANT: The index is a markdown table, NOT YAML frontmatter -- do NOT use extractFrontmatter()'"
    - "33-03-PLAN.md Step 3d: 'For clusters that meet the threshold, NOW read the full signal files to get body content, evidence, and detailed context. This is the second pass.'"
    - "33-03-SUMMARY.md: 'Two-pass signal reading preserves context budget: index pass via shell commands (NOT extractFrontmatter), detail pass only for qualifying clusters'"
    - "33-VERIFICATION.md Truth 21: 'Reflector uses two-pass signal reading (index pass then detail pass for qualifying clusters only)' -- VERIFIED"
  counter:
    - The two-pass approach has not been tested at scale with the current 51 signals. Context savings are theoretical until runtime validation occurs.
    - If most clusters qualify (e.g., many patterns detected), the detail pass may still load most signal files, reducing the benefit.
confidence: high
confidence_basis: Pattern is explicitly implemented in the reflector agent spec. Addresses documented context-bloat signals from Phases 31-32. Counter-evidence notes theoretical vs empirical savings.
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

Phase 33 Plan 03 established a two-pass signal reading pattern for the reflector agent. The first pass reads the KB index markdown table using shell commands (grep/awk), extracting metadata (severity, lifecycle state, tags, dates) without loading full signal files. Only clusters that meet the confidence-weighted scoring threshold trigger a second pass that reads full signal files for body content and detailed evidence.

## Context

Prior signals (sig-2026-02-11-signal-workflow-context-bloat and sig-2026-02-18-signal-workflow-context-bloat) documented context budget exhaustion when the signal workflow loaded all signal files. With 51 signals in the KB, loading all files would consume significant context. The two-pass approach directly addresses this by deferring full file reads to qualifying clusters only.

## Potential Cause

The context-bloat signals from Phases 11 and 18 identified a recurring problem with signal analysis workflows consuming excessive context. The Phase 33 research synthesized this into a structural solution: use lightweight index metadata for filtering, expensive file reads only for analysis.
