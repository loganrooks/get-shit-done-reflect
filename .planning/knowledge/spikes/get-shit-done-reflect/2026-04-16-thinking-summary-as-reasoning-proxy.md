---
id: spk-2026-04-16-thinking-summary-as-reasoning-proxy
type: spike
project: get-shit-done-reflect
tags: [measurement, phase-57.5, thinking-summaries, subagent-dispatch, claude-code-internals]
created: 2026-04-16T01:14:00Z
updated: 2026-04-16T01:30:00Z
durability: principle
status: active
hypothesis: "Thinking summary length and complexity in Claude JSONL covary positively with reasoning load (varied via prompt complexity, model, effort level)"
outcome: partial
rounds: 1
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.4+dev
---

## Hypothesis

Thinking summary length and complexity (markers for self-correction, branching, uncertainty, dead-ends) covary positively with reasoning load, where load is varied via prompt complexity, model capability, and effort-level setting. Premise: subagents dispatched via the Task/Agent tool would emit thinking content that could be measured.

## Experiment

18 subagents dispatched via the Task/Agent tool from a parent Opus session. Matrix: 3 prompts (recall, deliberation-no-tools, deliberation-with-tools) × 2 models (Sonnet, Opus) × 3 replicates. Parent settings: `showThinkingSummaries: true`, `effortLevel: high`. Per-subagent extraction of thinking blocks, thinking chars, visible response chars, output tokens, tool calls, and derived metrics from each subagent's JSONL.

Post-decision: a single headless `claude -p` verification was run with the same prompt and model to test the queued Round 2's premise.

## Results

Subagent corpus (n=18):
- thinking_block_count: 0 across all dispatches
- thinking_total_chars: 0 across all dispatches
- visible_response_chars: 56–28,979 (cleanly tracks prompt complexity, ~100× separation between recall and deliberation cells)
- output_tokens: 1–6,441 (same pattern as visible chars)
- tool_call_count: 0 in 17/18; 3 in one Sonnet B-tools dispatch that consulted local files

Cross-reference: parent session (this conversation, Opus) emitted 41+ thinking blocks totaling 44k+ chars over the same time window with the same settings.

Headless verification (single shot, Sonnet, B-notools prompt, `--tools ""`):
- thinking_block_count: 1
- thinking_total_chars: 9,597
- output_tokens: 11,314 (vs 1,868–2,642 for the same prompt as subagent — ~4× more tokens)
- visible_response_chars: 10,383 (similar to subagent)

## Decision

H1–H5 untestable as designed. The spike instead falsified an unstated load-bearing assumption: that subagents dispatched via the Task/Agent tool would produce thinking content. They do not. The constraint is on the dispatch context, not the model — both Opus and Sonnet (thinking-capable models) produced zero thinking content as subagents while the same models produce thinking content in headless or top-level sessions.

The synthesis-correction's Decision 6 ("subagent reasoning observability is gated by model family") is refined: **subagent reasoning observability is gated by dispatch context AND model family**. The Task/Agent tool is the load-bearing gate; even Opus and Sonnet are silenced through it.

For Phase 57.5 MEAS- requirements:
1. Thinking-summary extractor declares `dispatch_context` as a precondition; returns `not_available` for subagent dispatches
2. Visible-response complexity (length, output_tokens) is the only reasoning-complexity proxy available for subagents
3. The agent-performance loop loses ~94% of its corpus on the reasoning-quality dimension (subagent JSONLs are 17:1 over parent JSONLs in the existing corpus)
4. Phantom-token derivation requires real tokenization (4-chars/token approximation produces tokenizer-error artifacts indistinguishable from hidden-thinking signal)

## Consequences

For the audit: synthesis-correction §6.4 (model-family gate) needs a follow-up note refining the gate to two levels (model family AND dispatch context). The "subagent gate" is more restrictive than originally documented.

For Phase 57.5 scope: the agent-performance loop's planned demonstration via subagent corpus is significantly weakened. Either parent-session corpus must be primary (n=142, era-bounded), or the loop must accept that reasoning-quality measurement is unavailable for subagents and use only the structural signals (output complexity, tool patterns, duration, verification scores).

For workflow tooling: gsdr-spike-runner cannot dispatch subagents (no Agent tool in its frontmatter). Introspective spikes about agent harness behavior must be orchestrator-driven. Workflow gap documented in spike workspace `WORKFLOW-DEVIATION.md`.

Queued follow-up:
- Spike 010: parent-session version of the same 18-cell matrix via headless `claude -p`. Verification confirmed viability (single dispatch produced 9,597 chars of thinking content).
- Investigation: why does subagent dispatch suppress thinking entirely (not just redact)? Candidate causes: Task tool sets `redact-thinking-2026-02-12` beta header unconditionally for subagent calls; subagents do not inherit `showThinkingSummaries`; some `isSidechain: true` server-side gating.
- Phantom-token re-test once a real Anthropic tokenizer is available.
