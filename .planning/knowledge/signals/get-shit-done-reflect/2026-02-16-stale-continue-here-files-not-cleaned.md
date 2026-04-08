---
id: sig-2026-02-16-stale-continue-here-files-not-cleaned
type: signal
project: get-shit-done-reflect
tags:
  - continue-here
  - cleanup
  - phase-completion
  - milestone-archival
  - deviation
created: "2026-02-16T08:00:00Z"
updated: "2026-02-16T08:00:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
polarity: negative
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.14.0
detection_method: manual
origin: user-observation
---

## What Happened

Two `.continue-here.md` files from completed phases (`00-deployment-infrastructure` and `17-validation-release`) were still present in the `.planning/phases/` directory after their respective milestones (v1.12, v1.14) had been fully completed and archived. These stale checkpoint files persisted across 3 milestone cycles without being cleaned up.

## Context

Detected during `/gsd:resume-work` session restoration. The resume workflow scans for `.continue-here` files to detect incomplete work, and these stale files created false positives — appearing as mid-plan resumption points when they were actually leftover artifacts from long-completed phases.

## Potential Cause

Neither the phase completion workflow, milestone archival workflow (`/gsd:complete-milestone`), nor the resume workflow includes a cleanup step for `.continue-here` files in completed phases. The files are created during execution to mark resumption points but no workflow is responsible for removing them once the phase or milestone is done.
