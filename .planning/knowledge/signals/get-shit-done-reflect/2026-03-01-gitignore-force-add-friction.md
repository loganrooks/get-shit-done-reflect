---
id: sig-2026-03-01-gitignore-force-add-friction
type: signal
project: get-shit-done-reflect
tags:
  - deviation
  - installer
  - force-tracked
  - gitignore
  - dual-directory
created: "2026-03-01T23:02:00Z"
updated: "2026-03-01T23:02:00Z"
durability: workaround
status: active
severity: minor
signal_type: deviation
signal_category: negative
phase: 34
plan: 4
polarity: negative
occurrence_count: 2
related_signals: [sig-2026-02-23-installer-clobbers-force-tracked-files]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.6+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by gsd-signal-synthesizer at 2026-03-01T23:02:00Z"
evidence:
  supporting:
    - "34-04-SUMMARY.md Auto-fix 1: '.claude/ files are gitignored, required -f flag for git add'"
    - Previous occurrence in sig-2026-02-23-installer-clobbers-force-tracked-files documented same friction with .claude/ force-tracked files
  counter: []
confidence: medium
confidence_basis: Deviation documented in 34-04-SUMMARY.md. Related to previously recorded signal about the same dual-directory friction.
triage: "{}"
remediation: "{}"
verification: "{}"
detection_method: automated
origin: collect-signals
---

## What Happened

During Phase 34 Plan 04 Task 2 (installer sync), `git add` refused to stage .claude/ files without the `-f` flag because the .claude/ directory is listed in .gitignore but some files are force-tracked. This required using `git add -f` as a workaround.

## Context

This is the second occurrence of this friction. The first was documented in sig-2026-02-23-installer-clobbers-force-tracked-files. The dual-directory architecture (npm source -> installer -> .claude/ runtime) creates ongoing tension between gitignore rules and force-tracked runtime files.

## Potential Cause

The .claude/ directory is gitignored to prevent user-generated runtime files from being committed, but certain files must be force-tracked for the development workflow. This architectural tension surfaces every time the installer syncs changes to .claude/ and those changes need to be committed.
