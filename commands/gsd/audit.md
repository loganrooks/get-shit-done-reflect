---
name: gsd:audit
description: Dispatch a 3-axis audit (subject × orientation × delegation) with composed obligations. Reads conversation context, infers classification, writes task spec, dispatches gsdr-auditor or cross-model.
argument-hint: '"topic" [--auto] [--subject X] [--orientation Y] [--delegation Z] [--continue <session>]'
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---

<objective>
Create, classify, and dispatch an audit. **This command IS the orchestrator** — the same pattern `commands/gsd/audit-milestone.md` line 16 names verbatim: "This command IS the orchestrator." It does discovery, classification, obligation composition, task spec writing, session directory creation, and dispatch. It does not delegate the thinking to a workflow file or to a sub-agent layer; all logic lives inline here, following the `deliberate.md` precedent of keeping rich mode detection and context inference in the command body itself.

The command reads conversation history for context clues, proposes a 3-axis classification — subject × orientation × delegation — and asks 0–2 clarifying questions if the classification is ambiguous. It then composes obligations from the axis contributions per the rewritten `audit-ground-rules.md` (Core Rules 1–5, orientation obligations for the chosen stance, subject obligations when a subject is named, and cross-cutting obligations triggered by chain predecessors, cross-model delegation, or non-standard orientation). It creates a session directory per the naming convention in `audit-conventions.md` Section 1, writes a fully-formed task spec with **every composed obligation copied in verbatim** (per DC-2 — "the agent needs the rules in its context window, not a pointer to them"), and dispatches either the `gsdr-auditor` agent via `Task()` (self delegation, recommended) or `codex exec` (cross_model delegation, experimental).

The agent — or the external model — receives a fully-formed spec and runs the audit. This is the spike-runner pattern applied to audits: the orchestrator does the framing work once so the executor can focus entirely on the situated inquiry. The command's philosophical character is worth naming: the 3-axis model is a hermeneutic reconstruction of what audits actually are, not a rigid schema. Context inference is deliberately light — it reads the situation, not a state machine. When the situation exceeds the current decomposition, that excess is itself a finding, captured by the mandatory "What the Obligations Didn't Capture" section in every audit output and by the axis-level escape hatch documented in `audit-conventions.md` Section 3.4.
</objective>

<execution_context>
@~/.claude/get-shit-done/references/audit-conventions.md
@~/.claude/get-shit-done/references/audit-ground-rules.md
</execution_context>

<context>
Arguments: $ARGUMENTS

**State and configuration:**
@.planning/STATE.md
@.planning/config.json

**Authority for the 3-axis model (read when designing the classification for an ambiguous situation):**
@.planning/deliberations/audit-taxonomy-three-axis-obligations.md
@.planning/deliberations/audit-taxonomy-retrospective-analysis.md

**Canonical precedent for cross-model dispatch:**
@.planning/audits/2026-04-09-discuss-phase-exploration-quality/codex-review-task-spec.md
</context>
