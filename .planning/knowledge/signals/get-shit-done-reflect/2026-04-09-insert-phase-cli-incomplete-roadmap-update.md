---
id: sig-2026-04-09-insert-phase-cli-incomplete-roadmap-update
type: signal
project: get-shit-done-reflect
tags: [insert-phase, cli, roadmap, tooling-gap]
created: "2026-04-09T08:00:00Z"
updated: "2026-04-09T08:00:00Z"
durability: convention
status: active
severity: notable
signal_type: capability-gap
phase: "57.2"
plan: ""
polarity: negative
source: manual
detection_method: manual
origin: local
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.19.1"
lifecycle: detected
---

## What Happened

When using `gsd-tools phase insert 57 "description"` to insert Phases 57.2 and 57.3 into the roadmap, the CLI:
- Created the phase directory correctly
- Inserted the phase detail section into ROADMAP.md (with placeholder goal)
- But did NOT update: the Phases summary list, the progress table, the phase count, or the requirements count

All of these had to be manually edited afterward. Additionally, inserting two phases sequentially (57.2 then 57.3) resulted in 57.3 appearing BEFORE 57.2 in ROADMAP.md because the CLI inserts after the base phase each time, not after the last inserted decimal.

## Context

Observed during ROADMAP.md updates for the discuss-phase exploratory mode overhaul deliberation. Required 4 separate manual edits to ROADMAP.md after the CLI completed its work.

## Potential Cause

The `phase insert` command in gsd-tools.cjs focuses on the Phase Details section insertion and directory creation but doesn't have logic to update the Phases summary list (the checkbox list), the Progress table, or the header metadata (phase count, requirements count). The ordering issue likely stems from the insertion point being calculated from the base phase position, not from the last decimal phase position.
