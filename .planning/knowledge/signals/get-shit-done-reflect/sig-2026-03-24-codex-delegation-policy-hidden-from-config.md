---
id: sig-2026-03-24-codex-delegation-policy-hidden-from-config
type: signal
project: get-shit-done-reflect
tags:
  - codex
  - claude
  - cross-runtime
  - delegation-policy
  - spawn-agent
  - workflow-behavior
  - platform-parity
created: "2026-03-24T04:52:22Z"
updated: "2026-03-24T04:52:22Z"
durability: principle
status: active
severity: notable
signal_type: capability-gap
phase: 48.1
plan: 01
polarity: negative
occurrence_count: 2
related_signals: [sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift]
runtime: codex-cli
model: gpt-5.4
gsd_version: 1.17.5
detection_method: manual
origin: user-observation
---

## What Happened

While reviewing why Phase 48.1 execution in Codex did not delegate to a subagent
despite the `gsdr-execute-phase` workflow being designed around thin
orchestration, it became clear that Codex was operating under a higher-priority
runtime rule: `spawn_agent` should only be used when the user explicitly asks
for subagents, delegation, or parallel agent work.

That rule is not represented in `.planning/config.json`, the project roadmap,
or the current runtime capability matrix. So from the project's point of view,
the workflow appears to support normal delegated execution, but Codex can behave
more conservatively than Claude Code unless the user gives explicit permission.

## Context

- Discovery happened immediately after Phase 48.1 execution, when the user asked
  why no subagent had been used.
- The constraint was not a missing tool. `spawn_agent` exists in this runtime.
- The constraint was also not a project config choice. `.planning/config.json`
  still says `parallelization: true`, which makes the behavior mismatch more
  surprising.
- The effective rule came from the Codex runtime instruction layer for this
  session, not from a repository file that GSD planners or executors can read.
- This creates a parity risk: Claude Code can treat subagent delegation as part
  of normal workflow execution, while Codex may require explicit user opt-in for
  the same pattern.

## Potential Cause

Cross-platform parity currently tracks visible capabilities better than hidden
runtime policies.

The project has a capability matrix for things like hooks and task-tool
availability, but it does not yet track behavior-shaping policy constraints such
as:

1. whether delegation is default, opt-in, or discouraged
2. whether browsing is mandatory under certain conditions
3. whether user approval is required for agent fan-out
4. whether instruction-layer policy can override workflow-level delegation norms

Until those policy-level differences are made explicit in project docs and
workflow adaptation logic, the same GSD command can produce different execution
patterns across platforms even when the visible tool surface looks comparable.
