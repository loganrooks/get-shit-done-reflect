---
status: complete
completed: 2026-04-17
spike: 011
question_id: Q1
verdict: FAIL: schema-only
production_dependency_decision: reject_top_level_dependency_schema_only
tokenizer_id: null
---

# Spike Decision: C3 Tokenizer Availability

**Completed:** 2026-04-17  
**Question:** Does a usable tokenizer exist for the Claude model family currently in use, and under what license / dependency terms?  
**Verdict:** `FAIL: schema-only`  
**production_dependency_decision:** `reject_top_level_dependency_schema_only`

## Summary

No evaluated candidate cleared the spike's acceptance rule of median relative error below 15% and negative-delta rate below 20% on the committed 50-record corpus. `js-tiktoken(cl100k_base)` stayed non-negative on 49/50 samples, but its median relative error was 60.93%. The `charDiv4` baseline kept the negative-delta rate under threshold overall at 14.00%, but its median relative error was still 51.78%.

That is not a close miss. The candidates failed the accuracy threshold by too much to justify a `MARGINAL` verdict. Phase 57.7 therefore locks the Claude branch of Plan 08 to schema-only shipping rather than silently emitting a polluted `reasoning_tokens` signal.

## Evidence

### Overall results

- `js-tiktoken(cl100k_base)`: median relative error `60.93%`; negative-delta rate `2.00%` (`1/50`); median predicted raw thinking tokens `1016.5`
- `charDiv4`: median relative error `51.78%`; negative-delta rate `14.00%` (`7/50`); median predicted raw thinking tokens `692.5`

### Per-model-family breakdown

- `claude-opus-4-6` with `js-tiktoken(cl100k_base)`: median relative error `76.03%`; negative-delta rate `2.70%`
- `claude-sonnet-4-6` with `js-tiktoken(cl100k_base)`: median relative error `26.86%`; negative-delta rate `0.00%`
- `claude-opus-4-6` with `charDiv4`: median relative error `70.59%`; negative-delta rate `2.70%`
- `claude-sonnet-4-6` with `charDiv4`: median relative error `11.71%`; negative-delta rate `46.15%`

## Threshold Application

The spike required both of these conditions:

1. Median relative error `< 15%`
2. Negative-delta rate `< 20%`

No candidate satisfied both conditions on the full corpus.

- `js-tiktoken(cl100k_base)` satisfied the negative-delta condition but failed the accuracy condition by a wide margin (`60.93%` vs `< 15%`).
- `charDiv4` also satisfied the negative-delta condition overall, but failed the accuracy condition by an even wider margin (`51.78%` vs `< 15%`). Its Sonnet-only slice also failed the negative-delta condition (`46.15%`), which reinforces that it is not a stable fallback.

Because the failure is not near the threshold, the honest classification is `FAIL: schema-only`, not `MARGINAL`.

## Downstream Effect on Plan 08

Plan 08 now has a fixed Claude-side ship mode. The `reasoning_tokens_reconciler` extractor must register the schema, but the Claude branch returns `availability_status: not_available` with `skip_reason: tokenizer_unavailable`. It must not import a tokenizer, must not compute `raw_thinking_tokens`, and must not edit top-level `package.json`.

The Codex branch still ships direct-count support because it depends on a different substrate (`token_count.reasoning_output_tokens`) and is not blocked by this spike.

## Alternatives and Re-entry Conditions

### `js-tiktoken(cl100k_base)`

This was the best practical candidate because it required no top-level production dependency and had the lowest negative-delta rate. It still failed the core accuracy threshold too badly to ship. A future phase could revisit it only if a larger or differently stratified corpus shows materially lower error, or if a better Claude-aligned tokenizer appears.

### `charDiv4`

This remained useful as a contrast baseline. It is not fit for production use because the corpus-level error stayed high and the Sonnet slice produced too many negative deltas. It should stay as a diagnostic comparator only.

### `@anthropic-ai/tokenizer`

This was documented but intentionally not evaluated because Anthropic already describes it as obsolete for Claude 3+ usage. It becomes worth revisiting only if Anthropic publishes a current tokenizer or explicitly revalidates it for the active model family.

### `messages.countTokens`

This was also documented but not evaluated because it requires live API calls and breaks the spike's offline-measurement posture. It becomes relevant only if a future phase explicitly allows online token counting as part of the measurement substrate.

## Governing Guardrail Check

Schema-only shipping is legitimate under G-6. The system is allowed to expose the extractor surface while returning `not_available`; it is not allowed to silently estimate with an approximation that failed threshold.

This decision therefore preserves the extractor seam without polluting the reasoning-token axis. It also keeps the production dependency decision separate from spike-era experimentation, which is consistent with the default `production_dependency_decision: reject_top_level_dependency_schema_only`.

## Signal Candidates for Phase Close

- `sig-2026-04-17-claude-tokenizer-unavailable-57-7` — capability-gap, severity notable

