---
id: sig-2026-04-09-auto-flag-scoping-ambiguity-discuss-vs-chain
type: signal
project: get-shit-done-reflect
tags: [workflow-flags, discuss-phase, auto-proceed, flag-scoping, ux-ambiguity]
created: "2026-04-09T02:30:00.000Z"
updated: "2026-04-09T02:30:00.000Z"
durability: convention
status: active
severity: notable
signal_type: capability-gap
phase: "55.2"
plan: null
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-04-08-autonomous-discuss-plan-execute-pr-merge-pipeline]
runtime: claude-code
model: claude-opus-4-6
gsd_version: "1.19.1"
---

## What Happened

When running `/gsdr:discuss-phase 55.2 --auto`, the orchestrator correctly auto-answered discussion questions (grounded defaults selected, open items marked as working assumptions). However, it then stopped and presented the CONTEXT.md result instead of auto-proceeding to `/gsdr:plan-phase`. The user had to explicitly say "you were supposed to auto proceed" before the workflow continued.

Additionally, the orchestrator initially did not understand that `plan-phase` includes research as its first step -- the user had to correct: "well obviously plan phase will have research first."

## Context

The `--auto` flag has two potential scopes:
1. **Within-phase scope**: Auto-answer questions within the discuss-phase workflow (pick grounded defaults, skip interactive prompts)
2. **Cross-phase scope**: Auto-proceed from discuss -> plan (and potentially plan -> execute) without stopping for user confirmation

Currently `--auto` only applies to scope 1. The config has `_auto_chain_active: true` in workflow settings, which should govern scope 2, but the orchestrator did not honor it -- it stopped after discuss-phase completed and waited for user input.

The harness knowledge gap (not knowing plan-phase includes research) is a separate but related issue: the orchestrator should understand its own workflow structure well enough to not need user correction on basic sequencing.

## Potential Cause

1. **Flag scoping ambiguity**: `--auto` is semantically overloaded. In discuss-phase context it means "auto-answer questions." The user may also expect it to mean "auto-chain to next workflow step." These are different behaviors that may need different flags or a combined `--chain` flag.

2. **`_auto_chain_active` not consumed**: The workflow config has `_auto_chain_active: true` but the discuss-phase orchestrator does not check this flag to determine whether to auto-proceed to plan-phase.

3. **Harness self-knowledge**: The orchestrator does not internalize the plan-phase workflow structure (research -> plan -> verify) and may treat research as a separate optional step rather than an integral part of plan-phase.
