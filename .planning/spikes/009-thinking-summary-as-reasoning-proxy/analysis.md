---
date: 2026-04-16
spike: 009-thinking-summary-as-reasoning-proxy
phase: analysis
---

# Analysis: Thinking Summary as Reasoning Proxy (n=18, single effort level)

## Executive Summary

The spike was designed to test five hypotheses about how thinking summary length tracks reasoning load. **The most important result is that none of H1–H5 could be tested as designed: all 18 dispatched subagents produced zero thinking blocks, regardless of model, prompt complexity, or tool availability.** The spike instead falsified a load-bearing assumption that was implicit but not articulated in the design — that subagents dispatched via the Task/Agent tool would emit thinking content at all. They do not.

This is a structural finding about the agent harness, not about the original question. The original question (does summary length covary with reasoning load?) remains open and must be tested in a different dispatch context.

## Raw Data

See `per_dispatch_metrics.csv` for full per-dispatch metrics. Summary table (n=3 per cell):

| Cell | Model | thinkChars | visibleChars | output_tokens | tool_calls | duration_s |
|---|---|---|---|---|---|---|
| A | Opus | 0 / 0 / 0 | 56–133 | 1–41 | 0 / 0 / 0 | 2.1–3.4 |
| A | Sonnet | 0 / 0 / 0 | 118–122 | 23–27 | 0 / 0 / 0 | 1.5–1.6 |
| B-notools | Opus | 0 / 0 / 0 | 8513–10186 | 2706–3285 | 0 / 0 / 0 | 46–57 |
| B-notools | Sonnet | 0 / 0 / 0 | 9220–13145 | 1868–2642 | 0 / 0 / 0 | 45–62 |
| B-tools | Opus | 0 / 0 / 0 | 2–11086 | 2–3401 | 0 / 0 / 0 | 58–61 |
| B-tools | Sonnet | 0 / 0 / 0 | 11416–28979 | 2272–6441 | 0 / 0 / 3 | 53–146 |

(One Opus B-tools dispatch produced 2 visible chars and 2 output tokens — likely an early termination or tool-permission block; counted as a partial success.)

## Cross-Reference: Parent Session vs Subagents

| Source | thinking_block_count | thinking_total_chars |
|---|---|---|
| Parent session (this conversation, `bc35444c`, Opus) | 41 | 44,267 |
| All 18 spike subagents (Sonnet + Opus) | 0 | 0 |

Parent emits thinking content (with `showThinkingSummaries: true` in `~/.claude/settings.json`). Subagents do not, in this dispatch context.

## Hypothesis-by-Hypothesis Assessment

### H1 (summary length ↑ in prompt complexity) — UNTESTABLE

Cannot be evaluated because thinking summaries are uniformly absent from subagent JSONLs. The visible response chars *do* show clear monotone variation by prompt:

- A (recall): 56–133 chars across both models
- B-notools (deliberation): 8,513–13,145 chars
- B-tools: 2–28,979 chars (high variance from one tool-using dispatch)

So **response complexity tracks prompt complexity**, but this is in the visible output, not in thinking summaries. If the summary content existed, we would expect a similar pattern, but this is now a hypothesis about a different dispatch context.

### H2 (summary length ↑ in effortLevel) — DEFERRED

The spike ran at one effort level (`high`). Comparison across levels was always planned as a follow-up. But the prerequisite for that comparison — non-zero thinking content in subagents — is not met. Running the spike at `low` or `medium` will likely show the same zero-content result; the variable that actually controls thinking emission for subagents is upstream of `effortLevel`.

### H3 (Opus > Sonnet summary length) — UNTESTABLE in subagent context

Same reason. In visible-response chars at fixed prompt:
- B-notools Opus: mean ≈ 9,351 chars (n=3, σ ≈ 705)
- B-notools Sonnet: mean ≈ 10,788 chars (n=3, σ ≈ 1,710)

Sonnet's mean is higher, but both ranges overlap heavily. With n=3 the difference is not interpretable. Notable that Sonnet's variance is ~2.4× Opus's — Sonnet B-notools responses range more widely in length.

### H4 (tools shift load out of thinking) — REFRAMED

The hypothesis was about thinking content shifting to tool use. Since thinking content is universally zero in subagents, the relevant evidence is whether **tool availability changes the visible-output and tool-call patterns**:

- Opus B-tools (3 dispatches): 0 / 0 / 0 tool calls, visible 2 / 10,663 / 11,086 chars
- Sonnet B-tools (3 dispatches): 0 / 0 / 3 tool calls, visible 11,416 / 15,793 / 28,979 chars

**Opus did not use tools when allowed** (0 of 3). **Sonnet used tools in 1 of 3 dispatches** — and that one made 3 tool calls (Bash, Read, Read), inspecting `.planning/deliberations/` files in this project. That dispatch produced the longest visible response (28,979 chars) and longest duration (146.6s). The other 2 Sonnet B-tools dispatches did not use tools and produced responses comparable to B-notools.

Tentative reading: Sonnet was more inclined to leverage tools when allowed; Opus stayed with pure reasoning even with tool access. Sample size too small to be confident.

### H5 (phantom_tokens ≈ raw thinking tokens) — INCONCLUSIVE

The crude 4-chars-per-token approximation produced misleading deltas:
- Opus B-notools phantom: +577 / +588 / +738 (positive, suggesting hidden tokens)
- Sonnet B-notools phantom: -645 / -453 / -437 (negative, "less" tokens than chars predict)

The negative-for-Sonnet pattern indicates **the tokenizer approximation is the dominant source of variance, not hidden thinking**. Both models ostensibly produced zero thinking; the difference between positive and negative deltas reflects different per-character token densities (Sonnet may use a denser tokenizer, or the approximation is biased differently for different model output styles).

To test the phantom-token hypothesis properly requires:
1. Real Anthropic tokenizer (or close approximation), not 4 chars/token
2. A dispatch context where thinking content actually appears (i.e., parent sessions)
3. Comparison of `output_tokens` against accurately-tokenized `visible + summary` length

This is a follow-up spike, not a salvageable result from this one.

## Marker Densities — Not Computed

All marker densities computed against zero-length summaries are zero by construction. Cannot assess whether marker densities are useful features without summary content to count markers in.

## What the Spike Did Reveal

1. **A new structural constraint on the agent harness:** subagents dispatched via the Task/Agent tool produce no thinking blocks at all (not redacted-empty blocks; *no blocks*) regardless of model capability or settings.json state in the parent.

2. **Visible response complexity does track prompt complexity** with very clear separation between Cell A (recall) and Cell B (deliberation): factor of ~80–200× in chars and ~40–100× in output tokens.

3. **Tool-use propensity differs between models** even on identical permissive prompts: Sonnet 1/3, Opus 0/3. Small sample, but consistent direction.

4. **The 4-chars-per-token approximation is unfit for phantom-token estimation.** Even with thinking absent, deltas are model-dependent and signed differently for Opus vs Sonnet.

5. **The spike workflow itself has a tooling gap:** the gsdr-spike-runner cannot dispatch subagents (no Agent tool), so introspective spikes about the agent harness must be orchestrator-driven. Documented in `WORKFLOW-DEVIATION.md`.

## Implications for MEAS- (Phase 57.5)

The synthesis correction document proposed Decision 6 ("subagent reasoning observability is gated by model family"). This spike refines that finding:

> **Subagent reasoning observability is gated by *dispatch context*, not by model family.** Even Opus and Sonnet — both thinking-capable models — produce zero thinking blocks when dispatched as subagents via the Task/Agent tool. The model-family gate is necessary but not sufficient; subagent dispatch is its own gate.

MEAS- requirements affected:
- §7 extractor #11 (Claude thinking summary extractor): must declare dispatch_context as a precondition. For "subagent" context, the extractor returns `not_available`. For "parent session" context, it works.
- §6.4 (model-family gate requirement): refined to a two-level gate — model family AND dispatch context.
- §7 extractor #14 (summary complexity feature): cannot be calibrated against subagent corpus; must use parent-session corpus only.

## Recommendation

**Outcome: PARTIAL.** The spike's primary hypotheses were untestable as designed, but it produced a load-bearing structural finding that supersedes the original question.

A follow-up spike should:
- Run the same prompts in **parent sessions** (the user manually starts fresh sessions, runs each prompt, then we collect the JSONLs). This tests H1, H3 in a context where thinking content actually exists.
- Use a real tokenizer (e.g., `tiktoken` or Anthropic's `count_tokens` API) to test H5 properly.
- Investigate WHY subagents emit no thinking — is it a Task tool default, an inherited beta header from the parent (the `redact-thinking` header may be applied universally to subagent calls regardless of `showThinkingSummaries`), or a model-version interaction?

The MEAS- correction document already names "subagent thinking-content rate by dispatch mode" as Open Question #4 — this spike provides the empirical answer for the **post-`showThinkingSummaries: true`** subagent case: rate is zero.
