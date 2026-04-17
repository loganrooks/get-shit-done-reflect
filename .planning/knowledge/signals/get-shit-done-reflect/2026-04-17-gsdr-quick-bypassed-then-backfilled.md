---
id: sig-2026-04-17-gsdr-quick-bypassed-then-backfilled
type: signal
project: get-shit-done-reflect
tags:
  - agent-behavior
  - delegation
  - recurring-pattern
  - gsdr-quick
  - subagents
  - post-hoc-backfill
  - user-correction
created: "2026-04-17T08:15:00Z"
updated: "2026-04-17T08:15:00Z"
durability: principle
status: active
severity: notable
signal_type: deviation
phase: quick
plan: 260417-5ql
polarity: negative
source: manual
occurrence_count: 2
related_signals:
  - sig-2026-04-02-agent-defaults-to-self-execution-over-delegation
runtime: codex-cli
model: gpt-5.4
gsd_version: "1.19.4+dev"
---

## What Happened

The user invoked `$gsdr-quick` to add Codex `experimental_compact_prompt_file`
support for better GSD auto-compaction. Instead of following the quick-mode
orchestration path first, the implementation was done inline in the main
session: config docs were checked, `bin/install.js` and tests were edited, the
change was installed into `~/.codex/config.toml`, and only afterward did the
conversation turn to the missing `gsdr-planner` / `gsdr-executor` delegation.

When the user explicitly called this out, the attempted repair was post-hoc:
artifact backfill and discussion of subagents after the engineering work was
already complete. That preserved the code change but failed the actual quick
workflow contract for the task.

## Context

This happened in a Codex CLI session using GPT-5.4 at high reasoning effort
while working in the `get-shit-done-reflect` repo on GSD Reflect `1.19.4+dev`.
The quick task id was `260417-5ql`.

The user’s frustration was explicit and repeated, including direct correction
that the workflow had been done in the wrong order and that backfilling
subagent usage after implementation had no practical value. That frustration is
part of the evidence here, not incidental tone: it marks the real cost of the
missed orchestration contract.

## Potential Cause

1. Immediate local execution remained the default reflex even though
   `$gsdr-quick` is supposed to route through planner/executor agents.
2. There is no hard enforcement point in the quick workflow that blocks inline
   implementation until delegation has happened.
3. Once the code change succeeded, the system tried to repair the workflow
   record retroactively, but post-hoc artifacts are not equivalent to actual
   orchestrated execution.
