---
id: sig-2026-04-10-audit-references-expected-churn-during-rewrite
type: signal
project: get-shit-done-reflect
tags: [file-churn, hotspot, agent-spec, reference-stability, rewrite-phase, expected-churn]
created: "2026-04-10T21:55:15Z"
updated: "2026-04-10T21:55:15Z"
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: "57.4"
plan: "0"
polarity: neutral
source: local
occurrence_count: 1
related_signals:
  - sig-2026-03-26-tests-unit-install-test-js-modified-in-8
  - sig-2026-03-06-installer-file-churn-hotspot
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
    - "get-shit-done/references/audit-conventions.md: 5 modifications in last 50 commits (branch-scoped)"
    - "get-shit-done/references/audit-ground-rules.md: 5 modifications in last 50 commits (branch-scoped)"
    - "Modifications span: Section 3 rewrite, Section 4 rewrite, Section 2 frontmatter schema update, supersession banner addition, supersession banner removal"
  counter:
    - "High churn on these files is the explicit phase objective — Phase 57.4 is a reference rewrite phase"
    - "The modifications represent coherent progressive completion rather than instability or rework"
    - "Churn metric is meaningless when the phase's explicit purpose is to rewrite the churned files"
    - "No signal of instability — all 5 modifications are distinct steps in a single rewrite trajectory"
confidence: low
confidence_basis: "Statistical threshold for file-churn hotspot detection is met (5 modifications in 50 commits), but the churn is fully explained by the phase objective. This signal is persisted as a calibration data point rather than as evidence of a problem."
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

The git sensor's file-churn hotspot detector flagged `audit-conventions.md` and `audit-ground-rules.md` as hotspots (5 modifications each in the last 50 commits branch-scoped). On investigation, all 5 modifications on each file are steps in the Phase 57.4 reference rewrite — Section 3 rewrite, Section 4 rewrite, Section 2 frontmatter schema update, supersession banner addition, supersession banner removal. This is exactly the phase's stated objective.

This signal is persisted as a calibration data point: it is a case where the hotspot detector raises a flag but the flag is fully explained by phase intent. It is low-confidence as a deviation signal, but it has value as a sensor-calibration observation.

## Context

- Phase 57.4 explicit objective: rewrite `audit-conventions.md` and `audit-ground-rules.md` to introduce investigatory audit type and composition principle
- Git sensor's file-churn hotspot threshold: 5+ modifications in 50 commits
- Both files hit exactly 5 modifications in 50 commits — meeting but not exceeding threshold
- Modifications are sequential, coherent, and ship in a single phase

## Potential Cause

This is a sensor calibration observation, not a real deviation:

1. **File-churn hotspot detection is context-blind.** The git sensor raises a flag based purely on modification count, without awareness of phase objectives. When a phase's explicit job is to modify certain files, those files will trivially appear as hotspots.

2. **The value of persisting this signal is comparative.** Future phases where these same files churn without a rewrite-phase context would be genuine hotspot signals. This observation establishes the baseline: "5 modifications in 50 commits during a rewrite phase is normal; 5 modifications in 50 commits outside a rewrite phase is a signal."

3. **Possible sensor improvement.** The git sensor could cross-reference the current phase's declared `files_modified` (or the phase's declared objective files) and exclude those from hotspot detection, which would suppress this false-positive class. This would require the sensor to read phase state, which is a non-trivial coupling.

This is tagged `polarity: neutral` rather than negative because the observation itself is neither a problem nor a success — it is a sensor firing where the signal's meaning depends entirely on phase context. The persistence is for future calibration rather than for remediation.
