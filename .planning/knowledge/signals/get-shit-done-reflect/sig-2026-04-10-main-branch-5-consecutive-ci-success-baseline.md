---
id: sig-2026-04-10-main-branch-5-consecutive-ci-success-baseline
type: signal
project: get-shit-done-reflect
tags: [ci, main-branch, passing, baseline, positive-pattern]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: minor
signal_type: baseline
signal_category: positive
phase: "57.4"
plan: "0"
polarity: positive
source: local
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-sonnet-4-6
gsd_version: "1.19.3+dev"
environment:
  os: linux
  node_version: unknown
  config_profile: quality
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsdr-signal-synthesizer at 2026-04-10T21:55:15Z"
evidence:
  supporting:
    - "gh run list --branch main --limit 5: all 5 runs show conclusion=success"
  counter:
    - "Query limited to last 5 runs — short window"
    - "Main branch has 2 direct-push commits (d3da37ce, 947832bb) without triggered CI runs — see sig-2026-04-10-ci-branch-protection-bypass-recurrence"
confidence: high
confidence_basis: "Direct API query of GitHub Actions run list for main branch."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

The last 5 triggered CI runs on main branch all show `conclusion=success`. This is a short-window baseline observation of main branch CI health.

## Context

- Sample size: last 5 CI runs on main
- CI provider: GitHub Actions
- Observation window: runs up to 2026-04-10

## Potential Cause

This is a baseline signal — main branch CI has been green across the recent window. Worth noting the caveat that this observation coexists with the branch-protection-bypass recurrence signal: two commits on main (d3da37ce, 947832bb) were direct pushes with no check-runs. So "5 consecutive successful runs" is accurate for runs that fired, but does not cover commits that bypassed CI entirely. The two observations together paint a nuanced picture: CI works when it runs, but it does not always run.
