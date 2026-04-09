---
id: sig-2026-04-09-ci-actions-setup-node-v4-deprecation
type: signal
project: get-shit-done-reflect
tags: [ci, deprecation, github-actions, node-version]
created: "2026-04-09T12:00:00Z"
updated: "2026-04-09T12:00:00Z"
durability: workaround
status: active
severity: notable
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
    - "CI workflow uses actions/setup-node@v4 which runs on Node.js 20 runtime"
    - "GitHub will force migration to Node.js 24 by June 2026"
    - "GitHub will remove Node.js 20 runner support in September 2026"
  counter:
    - "Deprecation timeline is several months away; no immediate breakage"
    - "Migration is low-complexity (version pin update)"
confidence: high
confidence_basis: "GitHub documented deprecation timeline confirmed by CI sensor scan"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

The CI workflow uses `actions/setup-node@v4`, which runs on the Node.js 20 runtime. GitHub has announced it will force migration to Node.js 24 by June 2026 and remove Node.js 20 support entirely in September 2026. This affects the `.github/workflows/` CI configuration for the get-shit-done-reflect repository.

## Context

Detected during phase 57.3 CI sensor scan. All 5 recent main branch runs are passing and PR #43 CI is green, but the action version used in the setup step carries a forward-dated deprecation risk.

## Potential Cause

The CI configuration was written when `actions/setup-node@v4` was current. No automated mechanism flags GitHub Actions deprecation timelines. The issue will only surface as a warning (and eventually a failure) when GitHub enforces the transition.
