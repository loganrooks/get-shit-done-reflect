# Deviation Testimony: Killed Planner Agent (general-purpose misroute)

**Archived:** 2026-04-10 (mid-phase, during `/gsdr:plan-phase 57.4` execution)
**Agent ID:** ab2d49fdfb153c059
**Status:** killed before completion
**Files recovered from:** `~/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/486eb3f2-b54c-44f5-9124-38ff5e480995/subagents/agent-ab2d49fdfb153c059.jsonl`

## Why This Archive Exists (deviation from formal workflow)

This directory sits inside `pre-phase-archive/` but did NOT come from the prior CONTEXT.md iteration cycle that the rest of that directory documents. It is the output of a planner agent that was **launched with the wrong `subagent_type`, killed mid-execution, and recovered from its jsonl task log**. The orchestrator (`/gsdr:plan-phase`) does not have a formal "recover killed agent" path; the formal workflow would discard the partial output and rerun. This archive is a **deliberate deviation** from that formal path, justified below.

Per the `feedback_deviation_testimony.md` convention ("artifacts outside formal workflows must explain WHY they deviate and what workflow was inadequate"), this document names the deviation and its rationale.

## What Went Wrong

The `plan-phase.md` workflow file prescribes:

```
Task(
  prompt="First, read $HOME/.claude/agents/gsdr-planner.md for your role and instructions.\n\n" + filled_prompt,
  subagent_type="general-purpose",
  model="{planner_model}",
  description="Plan Phase {phase}"
)
```

The orchestrator followed this literally and invoked `subagent_type="general-purpose"`. But this environment (the dev repo itself) has a dedicated `gsdr-planner` subagent type registered in the runtime agent list:

> `gsdr-planner: Creates executable phase plans with task breakdown, dependency analysis, and goal-backward verification. Spawned by /gsdr:plan-phase orchestrator.`

The workflow file's literal `subagent_type="general-purpose"` is an **upstream convention** — it assumes the orchestrator "hints" the agent by prepending `"First, read $HOME/.claude/agents/gsdr-planner.md for your role..."` to the prompt. This works in environments where `gsdr-planner` is not a registered subagent type. In this dev repo, where it IS registered, the correct invocation is `subagent_type="gsdr-planner"` — which (a) routes to the proper model profile automatically, (b) loads the agent's role file via the registration rather than via a literal prompt prefix, and (c) is what the user expected based on the command name.

**Workflow inadequacy:** `plan-phase.md` does not account for environments where `gsdr-planner` is a registered subagent type. The `subagent_type="general-purpose"` literal is correct for upstream installs but wrong for the dev repo (and any install where the agent is registered). The workflow should either branch on agent-type availability or use `subagent_type="gsdr-planner"` unconditionally and let the runtime degrade to general-purpose when the registration is absent.

**User correction:** The user caught the misroute immediately after the agent was launched ("wait it seems like you didn't launch the gsdr-planner agent... and just launched an agent"). Subsequently, they flagged that the deleted partial output should have been archived ("well no you need to archive it, somehow, so that we can trace what happens when things go wrong").

## What the Killed Agent Produced

- **57.4-01-PLAN.md** (20,023 bytes) — complete draft of "Rewrite audit-conventions.md"
- **57.4-02-PLAN.md** (28,728 bytes) — complete draft of "Rewrite audit-ground-rules.md"
- **agent-reasoning.txt** — 13 text blocks (2,662 bytes) showing the agent's internal reasoning as it progressed
- **tool-call-trace.txt** — 37 tool calls in order (reads, bash, writes)

The agent was killed while starting plan 03 (command orchestrator) — the reasoning text contains the line `Now Plan 03 (command orchestrator):` followed by interruption.

## Design Decisions the Killed Agent Made (potentially salvageable)

The agent's reasoning transcript shows it reached several concrete design decisions before being killed. The gsdr-planner relaunch may choose to reuse, revisit, or discard these:

1. **Wave structure chosen:**
   - Wave 1: 57.4-01 (rewrite audit-conventions.md), 57.4-02 (rewrite audit-ground-rules.md) — parallel, no deps
   - Wave 2: 57.4-03 (command), 57.4-04 (agent), 57.4-05 (model-profiles.cjs) — parallel, depends on Wave 1
   - Wave 3: 57.4-06 (REQUIREMENTS.md updates), 57.4-07 (banner removal + install sync + verification)

2. **Cross-model dispatch strategy chosen: ship-with-experimental-flag.** Rationale (verbatim from reasoning):
   > 1. RESEARCH.md §Q2 shows zero automated precedent; one working manual dispatch
   > 2. CONTEXT.md G-5 frames orientations as design choices not settled ontologies — cross-model shipping can be the same posture
   > 3. Spike-first blocks the entire phase on empirical work that cannot be pre-validated
   > 4. Ship-with-limit requires defining what "simple" means; ship-with-experimental is the honest stance
   > 5. The deliberation already flags cross-model as "currently fragile" — exposing this to the user honors G-3's anti-performativity principle

The gsdr-planner may reach a different conclusion; this is documented for traceability, not as a locked choice.

## Instruction for the gsdr-planner Relaunch

- **DO NOT copy the archived plan files directly into the phase directory.** They are partial-execution artifacts, not verified plans.
- **DO read them as one possible decomposition.** The gsdr-planner should independently decide the wave structure, Q2 strategy, and plan boundaries. If the gsdr-planner reaches a similar conclusion, that is independent corroboration; if it reaches a different conclusion, that is also valuable.
- **DO reference this DEVIATION.md** if the gsdr-planner's design diverges from the killed agent's — the divergence itself is a signal worth preserving in SUMMARY.md.

## Signal Candidates (for future triage)

1. **Workflow file literal mismatch with registered agent types.** `plan-phase.md` uses `subagent_type="general-purpose"` + prompt-prefix role-loading, which is correct for upstream but wrong in environments with registered `gsdr-planner`. Recurrence risk: every `/gsdr:plan-phase` invocation in this dev repo. Signal: `sig-2026-04-10-plan-phase-workflow-literal-subagent-type-misroute`.

2. **Destructive response to mistake.** The orchestrator's first instinct was to `rm` the partial output to start clean, rather than archive it. This is a recurring pattern in how orchestrators respond to in-flight errors (treat obstacles as things to delete rather than evidence to preserve). The memory note `feedback_deviation_testimony.md` exists because of this exact anti-pattern — and the orchestrator still defaulted to delete. Signal: `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving`.

## Files in This Archive

- `DEVIATION.md` (this file)
- `57.4-01-PLAN.md` — recovered partial plan 01
- `57.4-02-PLAN.md` — recovered partial plan 02
- `agent-reasoning.txt` — agent's internal reasoning text blocks (timeline order)
- `tool-call-trace.txt` — ordered list of all 37 tool calls the agent made

The full jsonl task log is at `~/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/486eb3f2-b54c-44f5-9124-38ff5e480995/subagents/agent-ab2d49fdfb153c059.jsonl` (not copied here to keep the archive focused).
