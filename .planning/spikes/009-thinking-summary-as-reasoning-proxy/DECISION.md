---
status: complete
round: 1
outcome: partial
mode: full
type: exploratory
---

# Spike Decision: Thinking Summary as Reasoning Complexity Proxy

**Completed:** 2026-04-16
**Question:** Are Claude thinking summaries usable as a heuristic measure of reasoning complexity in MEAS- measurement infrastructure?
**Answer:** Cannot be answered for subagent-dispatch contexts because subagents produce zero thinking blocks regardless of model, prompt, or parent settings. The question must be re-asked for parent-session contexts in a follow-up spike.

## Summary

Eighteen subagents were dispatched via the Task/Agent tool — three replicates each across {Sonnet, Opus} × {recall, deliberation-no-tools, deliberation-with-tools} — at parent `effortLevel: high` and `showThinkingSummaries: true`. All five primary hypotheses (H1–H5) about summary-length variation, model effects, tool effects, and phantom-token derivation depended on subagents producing thinking content. They did not. Across all 18 JSONL files, total thinking blocks: **zero**. Total thinking content chars: **zero**.

The spike incidentally produced a stronger structural finding than the one it set out to test: subagents dispatched through the Task/Agent tool exist on the wrong side of an additional gate that the synthesis-correction document had not articulated. The previously-known "model family gate" (Haiku has no thinking) is real, but it is not the only gate. There is also a **dispatch-context gate**: even Opus and Sonnet, both thinking-capable, produced zero thinking content when invoked as subagents in this experiment, while the parent Opus session in which they were dispatched produced 41 thinking blocks (44,267 chars) over the same time period. This is a structural property of how the agent harness invokes subagents, not a property of the models themselves.

The visible-output channel did show clean variation by prompt complexity: Cell A responses were 56–133 chars; Cell B responses were 8,500–28,979 chars. So response complexity does track prompt complexity — just not in the field the spike was designed to measure.

## Findings

### Finding 1: Universal absence of thinking content in subagents

All 18 subagent JSONLs contain only `text`-type content blocks (one Opus B-tools dispatch had only `text` totaling 2 chars — partial failure, possibly tool-permission related). No `thinking`-type blocks at all. Not empty thinking blocks; zero blocks.

### Finding 2: Parent vs subagent asymmetry

The parent Opus session (this conversation) emitted 41 thinking blocks totaling 44,267 chars during the spike's window. The subagents it dispatched, in the same window, with the same `showThinkingSummaries: true` setting in scope, emitted zero. The asymmetry is on the dispatch axis, not the settings axis.

### Finding 3: Visible-output complexity tracks prompt complexity

Cell A (recall) → 56–133 chars / 1–41 output tokens.
Cell B-notools (deliberation, no tools) → 8,513–13,145 chars / 1,868–3,285 tokens.
Cell B-tools (deliberation, tools allowed) → 2–28,979 chars / 2–6,441 tokens.

Two-orders-of-magnitude separation between recall and deliberation; this is the proxy that *would* exist for thinking summaries if they were emitted.

### Finding 4: Tool-use propensity differs by model

When tools were allowed, Opus chose not to use them (0/3 dispatches). Sonnet used tools in 1/3 dispatches. The Sonnet dispatch that used tools made 3 tool calls (Bash + 2 Read), inspecting `.planning/deliberations/` files, and produced the longest visible response (28,979 chars, 146.6s duration). Sample size too small to be confident, but the directional difference is consistent.

### Finding 5: 4-chars-per-token tokenizer is unfit for phantom-token estimation

The phantom_token approximation produced positive deltas for Opus (+577 to +738 across B-notools) and negative for Sonnet (-437 to -645). Since both models had zero thinking content, the deltas cannot be hidden-thinking artifacts; they are tokenizer error. Phantom-token hypothesis (H5) cannot be tested at this resolution.

## Analysis

| Hypothesis | Testable? | Result |
|---|---|---|
| H1: summary length ↑ in prompt complexity | No (in subagents) | Untestable; visible output does scale ~100× |
| H2: summary length ↑ in effortLevel | Deferred + likely moot | Subagent thinking is gated upstream of effortLevel |
| H3: Opus > Sonnet summary length | No (in subagents) | Untestable; visible-chars: Sonnet > Opus mean, both overlap |
| H4: tools shift load out of thinking | Reframed | Sonnet 1/3 uses tools, Opus 0/3 — direction tentative |
| H5: phantom_tokens ≈ raw thinking | Inconclusive | Tokenizer error dominates signal |

The spike's failure mode is informative: it exposes that the original question presupposed a measurement substrate (subagent thinking content) that does not exist in the current Claude Code dispatch behavior. This presupposition was not visible from the synthesis correction document, which assumed thinking content would be present in subagents whose models supported it.

## Decision

**The MEAS- requirements should encode three updates:**

1. **Refine Decision 6 from the synthesis correction.** "Subagent reasoning observability is gated by dispatch context, not just model family." Even thinking-capable models produce no thinking content when dispatched as subagents (in this experimental context). The thinking-summary extractor must declare `dispatch_context` as a precondition and return `not_available` for subagent dispatches.

2. **Promote a new MEAS- decision: visible-output complexity is a usable subagent-reasoning proxy.** Since thinking content is unavailable for subagents, the visible-response length and `output_tokens` are the only complexity signals available. They show clean two-order-of-magnitude separation between recall and deliberation prompts. This is weaker than thinking-summary content (does not capture in-process reasoning, only final output structure), but it is what is empirically available.

3. **Defer phantom-token reconciliation pending a real tokenizer.** The 4-chars-per-token approximation conflates tokenizer error with billing artifacts. Until the extractor uses Anthropic's actual tokenization (via API count_tokens or equivalent), the phantom-token derivation cannot serve as evidence for hidden thinking — even when thinking content is present.

**Confidence:** MEDIUM. The structural finding (subagent gate) is empirically robust at n=18 across 2 models and 3 prompts. The MEAS- recommendations follow directly from it. What remains uncertain: *why* subagents are gated, whether the gate applies in all dispatch contexts (Task tool, gsdr-* agents, /agents subagent_type), and whether a settings or beta-header change could open it.

## Implications

For Phase 57.5:
- The thinking-summary extractor proposed in synthesis-correction §7.11 is still a valid Priority-1 extractor, but its applicable corpus is **parent sessions only**. Subagent JSONLs (~2,373 files in the broader corpus) yield zero thinking content for this extractor.
- The agent-performance loop (synthesis §8.2 strongest candidate) loses one of its anticipated subagent-stratification features. Subagent reasoning quality cannot be measured via summaries; must use response complexity, tool-use patterns, and verification scores.
- Decision 4 from the synthesis ("Agent is the primary unit of analysis for performance") still holds, but the per-agent reasoning signal must come from output, not thinking.

For follow-up work:
- A **parent-session spike** running the same 3 prompts × 2 models × 3 reps in fresh top-level sessions (not subagents) would test H1, H3 in a context where thinking content actually exists. The user would need to manually open new sessions and run each prompt.
- An **investigation spike** on *why* subagents emit no thinking content: is the Task tool sending the `redact-thinking-2026-02-12` beta header unconditionally? Is `alwaysThinkingEnabled` set false at subagent invocation? Is there a per-dispatch parameter that can override?
- A **real-tokenizer spike** on the phantom-token hypothesis once thinking content is observable.

## Metadata

**Spike duration:** ~30 minutes wall-clock (dispatch + extraction + analysis + writing).
**Iterations:** 1 (Round 1 produced a clear structural finding; further iteration on the original question requires a different dispatch context, not narrower scope).
**Originating audit:** `.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md` §7 #14, §8 OQ7
**Effort level at run:** `high`
**Settings at run:** `showThinkingSummaries: true`, `effortLevel: high`, `alwaysThinkingEnabled: unset`
**Claude Code version (parent):** observed at v2.1.101 on first record

## Post-Decision Verification (2026-04-16, after writing this document)

A single-shot verification was run via headless CLI to confirm Round 2's premise (that headless `claude -p` invocations would produce thinking content where subagents do not):

```
claude -p "<Prompt B-notools>" --model sonnet --tools "" --output-format json
```

Result (session `2e7c0ed9-67ba-4232-89f2-601401292cae`, same project dir):
- thinking_block_count: **1**
- thinking_total_chars: **9,597**
- visible_response_chars: 10,383
- output_tokens: **11,314**
- duration: 122s

Compare to the same prompt+model in subagent dispatch (Sonnet B-notools, n=3 from this spike):
- thinking_block_count: 0 / 0 / 0
- thinking_total_chars: 0 / 0 / 0
- visible_response_chars: 9,220 / 9,999 / 13,145
- output_tokens: 1,868 / 2,047 / 2,642

The headless invocation used **~4× the output tokens** for a similar visible response size, with ~6,300 of those tokens being "phantom" relative to a 4-chars/token approximation of visible+thinking content. This is consistent with real thinking work occurring (and being summarized to 9,597 chars). Subagents using ~25% the output tokens for similar visible response confirms thinking is **not happening** in the subagent dispatch path, not merely being hidden.

This verification confirms Round 2's viability and is queued as spike 010 (parent-session version of the same matrix).
