---
id: sig-2026-02-11-spike-design-missing-feasibility
type: signal
project: get-shit-done-reflect
tags: [spike-workflow, experimental-design, feasibility, template-gap]
created: 2026-02-11T12:30:00Z
updated: 2026-02-11T12:30:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
runtime: claude-code
model: claude-opus-4-6
---

## What Happened

During the first real spike attempt (runtime capability verification), the user identified that the DESIGN.md template and spike workflow lack a feasibility/prerequisites assessment step. The orchestrator drafted a DESIGN.md with experiments that required API keys, CLI installations, and environment setup — none of which were addressed in the design. The spike-design template has no section for prerequisites, infrastructure needs, or feasibility assessment.

The spike workflow goes: Question → Draft DESIGN.md → User Review → Spawn spike-runner agent (Build → Run → Document). Unlike the main GSD flow (discuss → research → plan → verify → execute), there is no research-before-design step and no feasibility check in the design itself.

## Context

User invoked /gsd:spike to verify the runtime capability matrix (whether Codex CLI and Gemini CLI support task_tool, hooks, etc.). The orchestrator drafted a DESIGN.md that described experiments as "research docs and changelogs" without addressing practical implementation: Do we need API keys? How do we isolate tests? Can we even install these CLIs? The user caught this during the design review step (Step 4 of run-spike.md).

The spike-runner agent does have checkpoint triggers for "Dependency not available" and "Build fails unexpectedly" — so the current design philosophy is reactive (discover obstacles during build, then checkpoint) rather than proactive (identify prerequisites during design).

## Potential Cause

The spike workflow was designed with code-level spikes in mind ("which library is faster?", "does this API return data under 100ms?") where prerequisites are trivial and obvious. Infrastructure-heavy spikes (requiring API keys, tool installations, environment configuration) weren't considered during the original design in Phase 03. The DESIGN.md template mirrors standard hypothesis-experiment-criteria scientific design but omits the "materials and methods feasibility" assessment that real experimental protocols include.

Additionally, the spike Design phase is handled by the orchestrator with no research step — unlike plan-phase which has gsd-phase-researcher → gsd-planner → gsd-plan-checker. The spike goes directly from question to design, assuming the orchestrator has sufficient knowledge to design experiments. For infrastructure-heavy spikes, this assumption doesn't hold.
