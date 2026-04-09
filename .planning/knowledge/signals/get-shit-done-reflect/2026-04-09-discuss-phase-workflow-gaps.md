---
id: sig-2026-04-09-discuss-phase-workflow-gaps
type: signal
project: get-shit-done-reflect
tags: [discuss-phase, workflow, auto-progression, context-commit, config-awareness]
created: "2026-04-09T04:00:00Z"
updated: "2026-04-09T04:00:00Z"
durability: convention
status: active
severity: notable
signal_type: capability-gap
phase: "57"
plan: ""
polarity: negative
source: manual
detection_method: manual
origin: local
occurrence_count: 1
related_signals:
  - sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.19.1"
lifecycle: detected
---

## What Happened

During Phase 57 discuss-phase (--auto, exploratory mode), three workflow gaps surfaced:

1. **CONTEXT.md not committed**: The discuss-phase created 57-CONTEXT.md but did not git-commit it, despite `commit_docs: true` in config.json. This is a recurring pattern.

2. **--auto not triggering auto-progression**: After creating CONTEXT.md, the agent stopped and offered "Next steps" instead of auto-progressing to `/gsdr:plan-phase 57`. The user had to manually invoke the next step.

3. **Agent unaware of config state**: The agent offered `/gsdr:research-phase` as a separate option, not understanding that `workflow.research: true` means research is automatically included in the plan-phase workflow. The agent did not read config.json to understand the configured workflow.

## Context

- Config: `workflow.research: true`, `workflow._auto_chain_active: true`, `mode: yolo`
- The `_auto_chain_active` flag suggests auto-chaining was intended to be active
- The discuss-phase workflow's `<offer_next>` section suggests plan-phase but does not mandate auto-progression
- Related: sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop (discuss mode feature was silently dropped during upstream adoption)

## Potential Cause

The discuss-phase workflow spec lacks an auto-progression gate that reads `_auto_chain_active` or `--auto` to determine whether to auto-invoke plan-phase. The `--chain` flag is mentioned in the command definition but its behavior may not be fully implemented. The workflow ends with an `<offer_next>` that presents options rather than taking action, regardless of the auto flag.
