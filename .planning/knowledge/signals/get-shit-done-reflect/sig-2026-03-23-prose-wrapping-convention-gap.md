---
id: sig-2026-03-23-prose-wrapping-convention-gap
type: signal
project: get-shit-done-reflect
tags:
  - formatting
  - conventions
  - deliberation-artifacts
  - review-artifacts
  - markdown
created: "2026-03-23T04:15:00Z"
updated: "2026-03-23T04:15:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 48
plan: complete
polarity: neutral
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.17.5+dev
detection_method: manual
origin: user-observation
---

## What Happened

The postscript section of `2026-03-22-independent-critical-review-of-review-set.md` was written with hard line wraps at ~72-80 characters, while the rest of the same file and the other review artifacts use soft-wrapped paragraphs (one paragraph per line, rendered markdown handles wrapping). This created visual inconsistency in the raw source.

## Context

The `.planning/deliberations/` and `.planning/research/deliberation-reviews/` directories now contain a substantial body of prose artifacts. These are read both in rendered form (IDE preview, GitHub) and as raw markdown (by agents, in diffs, during review). There is no explicit convention for whether prose in these artifacts should use hard wraps (fixed line length) or soft wraps (one paragraph per line).

The inconsistency was introduced by a different session (independent critical review) than the one that produced the original reviews, suggesting the gap is not session-specific but a missing project-level convention.

## Potential Cause

No prose-wrapping convention exists for `.planning/` artifacts. Individual sessions default to whatever the drafter's habits produce. Hard wrapping at 72-80 chars is a common plaintext/email convention; soft wrapping is more common in modern markdown workflows. Without an explicit choice, both will continue to appear.
