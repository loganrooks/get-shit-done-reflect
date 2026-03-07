---
id: sig-2026-03-06-installer-file-churn-hotspot
type: signal
project: get-shit-done-reflect
tags: [file-churn, hotspot, installer, testing]
created: 2026-03-06T23:30:00Z
updated: 2026-03-06T23:30:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
signal_category: negative
phase: 42
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.16.0+dev"
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-06T23:30:00Z"
evidence:
  supporting:
    - "bin/install.js modified 8 times in last 50 commits -- file churn hotspot"
    - "tests/unit/install.test.js modified 5 times in last 50 commits -- file churn hotspot"
  counter: []
confidence: medium
confidence_basis: "Merged from git sensor signals: bin/install.js (8 modifications) and tests/unit/install.test.js (5 modifications) in last 50 commits"
triage: {}
remediation: {}
verification: {}
recurrence_of: ""
---

## What Happened

The git sensor detected that bin/install.js and its test file (tests/unit/install.test.js) are file churn hotspots, with 8 and 5 modifications respectively in the last 50 commits. This high modification frequency suggests the installer is an area of ongoing instability or iterative refinement.

## Context

The installer (bin/install.js) is a critical component that copies source files to the .claude/ runtime directory. It has been the subject of multiple signals in the past including clobbering force-tracked files, path resolution issues, and local patches false positives. The churn rate confirms this is an active area of development and potential fragility.

## Potential Cause

The installer's responsibilities have grown significantly across recent phases -- handling path rewrites, file manifest validation, local patches, and dual-directory architecture. Each new feature or fix touches install.js, creating a natural churn hotspot. This may indicate the installer needs architectural stabilization or decomposition into smaller, more focused modules.
