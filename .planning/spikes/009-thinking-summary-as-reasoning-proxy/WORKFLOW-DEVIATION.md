---
date: 2026-04-16
type: workflow-deviation
spike: 009-thinking-summary-as-reasoning-proxy
---

# Workflow Deviation: Orchestrator Handles Run Phase

Per user-memory "Deviation Testimony Required": artifacts outside formal workflows must explain why they deviate and what workflow was inadequate.

## What was deviated

The standard `/gsdr:spike` workflow (`get-shit-done-reflect/workflows/run-spike.md` Step 6) spawns the `gsdr-spike-runner` agent to execute Build → Run → Document phases. For this spike, the orchestrator (the parent conversation) handles the Run phase directly instead.

## Why

The `gsdr-spike-runner` agent's tool set is declared in its frontmatter as `Read, Write, Bash, Glob, Grep`. It does not have access to the `Agent` (Task) tool.

This spike's experimental design requires dispatching 18 subagents in parallel via the `Agent` tool, varying their `model` parameter. The runner cannot do this with its current tool set.

## Workflow inadequacy this exposes

The runner is designed for **code-based experiments** — write a script, run it, capture output. It is not designed for **subagent-dispatch experiments** where the experimental units are themselves agent invocations.

This is a structural gap in the spike workflow. Experiments that test the agent harness itself (introspective spikes about how agents behave) cannot be fully delegated to the runner. Future versions of the runner could either:

1. Add `Agent` to the runner's tool set (broadens scope, raises complexity)
2. Define a new agent type (`gsdr-introspective-spike-runner`) with `Agent` access for spikes that target agent behavior
3. Allow the orchestrator to declare "Run phase = manual" in DESIGN.md and skip the runner spawn

For now, the orchestrator handles dispatches. The runner could still be invoked for the Document phase only (analysis + DECISION.md authoring from collected JSONL data) — but for this spike, the orchestrator handles Document too, since the analysis is tightly coupled to the dispatch metadata only the orchestrator has.

## What is preserved from the standard workflow

- DESIGN.md authored before execution (this directory)
- Workspace isolation: all artifacts in `.planning/spikes/009-*/`
- DECISION.md will be produced
- KB entry will be persisted
- Standard outcome categorization (confirmed / rejected / partial / inconclusive)

## What is NOT preserved

- Per-experiment commits in the runner's `spike(build)` / `spike(doc)` style
- Checkpoint protocol (the runner's checkpoint format is not used)
- The runner's iteration/round handling (this spike is single-round by design)
