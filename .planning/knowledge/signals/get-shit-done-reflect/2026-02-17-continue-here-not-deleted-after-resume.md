---
id: sig-2026-02-17-continue-here-not-deleted-after-resume
type: signal
project: get-shit-done-reflect
tags: [continue-here, cleanup, resume-work, deviation, stale-files]
created: 2026-02-17T05:43:39Z
updated: 2026-02-17T05:43:39Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase:
plan:
polarity: negative
source: manual
occurrence_count: 2
related_signals: [sig-2026-02-16-stale-continue-here-files-not-cleaned]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.14.2
---

## What Happened

`.continue-here.md` files are not deleted or archived after `/gsd:resume-work` successfully restores context. Stale handoff files accumulate across sessions and milestones, creating false positives when the resume workflow scans for incomplete work. This is the second observation of this pattern — the first was sig-2026-02-16-stale-continue-here-files-not-cleaned which found stale files from 2 completed milestones ago.

## Context

User observed during v1.15 milestone setup that the previous `.continue-here.md` (from between v1.14 completion and v1.15 start) was still present and had to be overwritten. The resume workflow reads the file but never cleans it up afterward.

## Potential Cause

Neither `resume-work.md` nor any phase completion workflow includes a cleanup step for `.continue-here.md` files after successful resumption. The file is consumed (read) but not removed. The fix should be in `resume-work.md`: after successfully restoring context and confirming with the user, delete or archive the `.continue-here.md` file that was consumed.
