---
id: sig-2026-04-09-log-sensor-spec-disabled-label-causes-repeated-exclusion
type: signal
project: get-shit-done-reflect
tags: [log-sensor, signal-collection, agent-spec, stale-metadata, recurring]
created: "2026-04-09T09:10:00Z"
updated: "2026-04-09T09:10:00Z"
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 57.1
plan: null
polarity: negative
source: manual
occurrence_count: 3
related_signals:
  - sig-2026-03-04-stale-log-sensor-spec-disabled-by-default-text
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.1+dev
lifecycle_state: detected
lifecycle_log:
  - "created -> detected by user at 2026-04-09T09:10:00Z"
evidence:
  supporting:
    - "Agent type description in system prompt reads: 'gsdr-log-sensor: [DISABLED] Placeholder for future session log analysis -- requires spike to determine log location'"
    - "Auto-discovery finds the spec file ($HOME/.claude/agents/gsdr-log-sensor.md) but the [DISABLED] label in the description causes every fresh session to skip it"
    - "User had to explicitly prompt 'you need to launch the log sensor' during Phase 57.1 signal collection"
    - "Prior signal sig-2026-03-04 flagged the same stale text 36 days ago — never remediated"
  counter:
    - "The [DISABLED] text may have been accurate when originally written if the sensor genuinely lacked implementation"
---

## What Happened

During Phase 57.1 signal collection, the orchestrator spawned artifact and git sensors but excluded the log sensor, characterizing it as "disabled/placeholder." The user had to intervene to request it be launched. This is the third occurrence of this pattern — the spec's own description contains `[DISABLED]` text that causes every new Claude session to treat it as non-functional.

## Context

The `gsdr-log-sensor` agent spec exists on disk and is discovered by the auto-discovery mechanism (`ls $HOME/.claude/agents/gsdr-*-sensor.md`). However, the agent type description surfaced in the system prompt contains `[DISABLED] Placeholder` text. Since each Claude session starts fresh with no memory of prior corrections, the orchestrator reads this label and skips the sensor every time. The user has corrected this behavior multiple times across sessions.

The prior signal (sig-2026-03-04, Phase 38) flagged the same stale description text. It was detected but never remediated — the spec description was never updated to remove the [DISABLED] label.

## Potential Cause

The spec description was written when the log sensor was genuinely unimplemented. The sensor was later implemented or made functional, but the description was never updated. Because the description is surfaced in Claude's system prompt at session start, it acts as a structural gate — every fresh session inherits the stale label. This is a self-reinforcing pattern: the fix is trivial (update the description text) but because the label causes agents to skip the sensor, no agent ever discovers the label is wrong.
