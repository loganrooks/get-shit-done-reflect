---
id: sig-2026-02-11-premature-spiking-no-research-gate
type: signal
project: get-shit-done-reflect
tags: [spike-workflow, research-gate, workflow-ordering]
created: 2026-02-11T13:00:00Z
updated: 2026-02-11T13:15:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
runtime: claude-code
model: claude-opus-4-6
---

## What Happened

The /gsd:spike command was deliberately invoked by the user to test the spike system against a real question: "what capabilities do Codex CLI and Gemini CLI have?" During the iterative design review, discussion of spike types (Exploratory vs Binary) revealed that the question was fundamentally answerable through documentation research. The spike workflow's own anti-pattern list flags this as "Premature Spiking" — but the workflow has no mechanism to surface that guidance before design begins.

The spike-integration reference defines the intended flow as: MARK → VERIFY (research) → SPIKE DECISION POINT → PLAN. This flow exists for orchestrators (plan-phase, new-project) but the standalone /gsd:spike command has no research-first check or advisory. It accepts any question and proceeds directly to DESIGN.md drafting.

## Context

The user explicitly requested /gsd:spike to test the spike system's capability for designing and executing experiments. This was intentional — both to answer the capability question and to validate the spike workflow itself. The finding isn't that spiking was premature (user chose it deliberately), but that the /gsd:spike command provides no guidance about whether a question is better suited to research vs. experimentation. The spike type discussion (Exploratory vs Binary) was the mechanism that surfaced the research-vs-spike distinction.

## Potential Cause

The /gsd:spike command is designed as a direct-to-design tool. It lacks the advisory layer that plan-phase has via the spike-integration reference's research → spike flow. For standalone invocation, there's no "have you tried research first?" prompt or type-based guidance about whether the question warrants empirical testing or documentation review. The anti-patterns section in spike-execution.md documents "Premature Spiking" but this guidance isn't surfaced during spike invocation.
