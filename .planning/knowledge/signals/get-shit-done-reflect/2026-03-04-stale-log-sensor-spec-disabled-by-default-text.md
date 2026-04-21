---
id: sig-2026-03-04-stale-log-sensor-spec-disabled-by-default-text
type: signal
project: get-shit-done-reflect
tags: [config, deviation, workaround]
created: "2026-03-04T20:00:37Z"
updated: "2026-03-04T20:00:37Z"
durability: workaround
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 38
plan: 1
polarity: negative
occurrence_count: 2
related_signals:
  - sig-2026-03-02-gitignore-force-add-and-kb-external-deviations
  - sig-2026-03-02-quality-profile-sonnet-executor-mismatch
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: 1.16.0+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-04T20:00:37Z"
evidence:
  supporting:
    - "VERIFICATION.md Anti-Patterns section explicitly flags: agents/gsd-log-sensor.md says 'disabled by default in the feature manifest' -- stale"
    - The manifest now uses {} default (empty object), making the log sensor effectively enabled by default
  counter:
    - VERIFICATION.md classifies this as 'Info' severity and 'Non-blocking
    - The functional behavior is correct -- stale text is in spec body, not frontmatter
confidence: high
confidence_basis: Stale documentation explicitly identified in VERIFICATION.md Anti-Patterns section with file and line number.
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

After phase 38 completed, VERIFICATION.md identified a stale documentation claim in `agents/gsd-log-sensor.md`. The spec body still claims the log sensor is "disabled by default in the feature manifest," but phase 38 changed the manifest default from a disabled flag to an empty object (`{}`), making the log sensor effectively enabled by default. The functional behavior is correct; only the spec text is stale.

## Context

Phase 38, Plan 01 updated `feature-manifest.json` to use `{}` as the default for all sensors (enabling them by default). The log sensor spec body was not updated to reflect this behavioral change. VERIFICATION.md classified this as Info/Non-blocking.

## Potential Cause

Documentation of default behavior was not included in the plan's scope for Phase 38. Plans focused on the extensibility architecture (dynamic discovery, standardized contracts) but did not enumerate all prose descriptions of defaults that would need updating. This is a common pattern when spec-level changes have ripple effects on documentation in multiple files.
