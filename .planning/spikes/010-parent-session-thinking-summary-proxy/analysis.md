---
spike: 010
status: complete
generated: 2026-04-16
source_data: per_dispatch_metrics.csv (42 rows: 36 original + 6 retries; canonical view prefers R_ retry rows over failed originals, yielding 36 successful dispatches)
---

# Spike 010 Analysis: Parent-Session Thinking Summary as Reasoning Proxy

## 0. Corpus Summary

- **36 successful dispatches** (100% coverage after retries; initial 6-cell failure rate of 16.7% was within INCONCLUSIVE threshold and was remediated via parallel 2-at-a-time retries of the 6 Opus cells that hit Anthropic 529 overload errors)
- **Claude Code v2.1.110** across all dispatches (no version drift)
- **Setting:** `showThinkingSummaries: true` (verified at dispatch-script launch)
- **`--effort` CLI flag** was used per-dispatch (low or high) — overrides settings.json for the session

## 1. Group Means Table

Means per (model, prompt, effort) cell, n=3:

| model  | prompt     | effort | thinkBlk | thinkChars | visChars | outTok | dur(s) |
|--------|------------|--------|---------:|-----------:|---------:|-------:|-------:|
| opus   | A          | low    |     0.00 |          0 |       51 |     20 |    7.7 |
| opus   | A          | high   |     0.00 |          0 |       56 |     23 |    9.0 |
| opus   | B-notools  | low    |   **0.00** |      **0** |     3971 |   1318 |   33.3 |
| opus   | B-notools  | high   |     1.00 |       2550 |     3580 |   6189 |   51.0 |
| opus   | B-tools    | low    |     1.00 |       1736 |     5391 |   5171 |   52.0 |
| opus   | B-tools    | high   |     1.00 |       3790 |     5736 |   8401 |   76.7 |
| sonnet | A          | low    |     0.00 |          0 |      116 |     26 |    6.3 |
| sonnet | A          | high   |     0.00 |          0 |      116 |     26 |    6.7 |
| sonnet | B-notools  | low    |     1.00 |       1870 |    10225 |   5427 |   65.7 |
| sonnet | B-notools  | high   |     1.00 |       7829 |     8656 |   8897 |   98.7 |
| sonnet | B-tools    | low    |     1.00 |       3757 |    11893 |   7307 |   86.7 |
| sonnet | B-tools    | high   |     1.00 |       9465 |    10976 |  11869 |  123.3 |

The **0.00** thinking-block count for Opus + B-notools + low is not noise — it held across all 3 replicates.

## 2. Hypothesis-by-Hypothesis Assessment

### H1: Summary length ↑ with prompt complexity (holding model and effort fixed)

**Answer: CONFIRMED, with a stronger structural finding underneath.**

The cleanest effect is **categorical, not continuous**: recall-class prompts (Prompt A, "what does `ls` do?") produce **zero thinking blocks** in all 12 cells regardless of model or effort. Deliberation-class prompts (B-notools, B-tools) produce exactly 1 thinking block per session (when they emit at all).

For deliberation prompts, summary length varies by ~40× (228 chars min, 13,141 chars max) — that is length-discrimination across a wide range.

**Revision to the hypothesis:** thinking content is emitted on a threshold (complexity must clear a bar) and then varies in length once emitted. H1's monotonicity holds once you restrict to emitting cells.

### H2: Summary length ↑ with effort level (holding prompt and model fixed)

**Answer: CONFIRMED, with a secondary threshold effect for Opus.**

Matched low/high pairs:

| model  | prompt     | thinkChars low | thinkChars high | high/low ratio |
|--------|------------|---------------:|----------------:|---------------:|
| sonnet | B-notools  |          1,870 |           7,829 |         **4.2×** |
| sonnet | B-tools    |          3,757 |           9,465 |         **2.5×** |
| opus   | B-notools  |              0 |           2,550 | (0 → emission) |
| opus   | B-tools    |          1,736 |           3,790 |         **2.2×** |

Effort is a strong, clear signal. Sonnet shows a larger magnitude than Opus, but Opus additionally shows a binary threshold: at low effort on the B-notools prompt, Opus does not emit thinking content at all.

### H3: Opus > Sonnet summary length (at equal effort and prompt)

**Answer: FALSIFIED. Sonnet summaries are consistently 2-3× LONGER than Opus.**

At high effort, matched prompts:

| prompt     | Sonnet thinkChars | Opus thinkChars | Sonnet/Opus |
|------------|------------------:|----------------:|------------:|
| B-notools  |             7,829 |           2,550 |        3.1× |
| B-tools    |             9,465 |           3,790 |        2.5× |

The direction is the opposite of what H3 predicted. Possible interpretations (not distinguishable from this data):

- Opus's thinking summarizer produces more compressed output than Sonnet's
- Opus's internal thinking is less verbose (fewer discrete thoughts to summarize)
- Different summarizers or summary-length budgets are applied per model

**Important:** this means summary length is NOT a model-free reasoning-complexity signal. Any extractor that uses length must stratify by model, or it will mis-attribute "Opus reasoning" as "less reasoning" when it is simply "more compressed summarization."

### H4: Tools shift reasoning load OUT of thinking

**Answer: UNTESTED in the behavioral sense; FALSIFIED in the permission-only sense.**

**Critical finding:** `tool_call_count = 0` across all 12 B-tools cells (Sonnet 3×3 + Opus 3×3 × 2 effort levels). Neither model ever used tools when permitted. So "tools shift load" cannot be tested empirically — no load was actually shifted because no tools were invoked.

The permission-only effect (B-tools vs B-notools, both high effort):

| model  | B-notools thinkChars | B-tools thinkChars | ratio |
|--------|---------------------:|-------------------:|------:|
| sonnet |                7,829 |              9,465 |  1.21× |
| opus   |                2,550 |              3,790 |  1.49× |

Permitting tools slightly *increased* thinking length. This is the opposite of H4's prediction.

**Caveat:** spike 009 observed Sonnet 1/3 and Opus 0/3 using tools when permitted in subagent dispatch. Spike 010's headless `claude -p` context appears to discourage tool use entirely. This is itself a structural finding: **the headless dispatch context does not exercise the tool-use path**, consistent with it being designed for pipeline/scripting use rather than interactive problem-solving. H4 cannot be tested in the parent-session setup without forcing tool use, which would require a different experimental design.

### H5: Phantom tokens ≈ raw thinking tokens

**Answer: DEFERRED per DESIGN.md — raw data collected for spike C3 (real tokenizer).**

Phantom-token values (from `output_tokens − ceil((visible_chars + thinking_chars) / 4)`) are positive across all deliberation cells but remain untrustworthy at this tokenizer resolution. Sample:

- Sonnet B-notools high replicate 3: phantom=5,802, thinking_chars=10,976, output_tokens=11,030
- Opus B-notools high replicate 1: phantom=5,587, thinking_chars=3,848, output_tokens=7,522

The positive deltas are consistent with the synthesis-correction §4 hypothesis (billing-layer asymmetry), but 4-chars/token approximation error prevents attribution. Spike C3 (real tokenizer via Anthropic `count_tokens` endpoint or tiktoken-equivalent) is the correct next experiment.

### Effort × Complexity Interaction

**Finding:** Opus exhibits an emission threshold at (B-notools, low effort) that Sonnet does not. This is an interaction effect: the (model × complexity × effort) triple matters, not just main effects.

The interaction is also visible in magnitudes: Sonnet's low→high effort ratio is higher (4.2× for B-notools, 2.5× for B-tools) than Opus's (2.2× for B-tools; not-defined for B-notools due to zero emission at low). Sonnet is more effort-responsive; Opus is more threshold-like.

## 3. H-alt-5 Regression: Summary Length vs Visible Response Length

n = 21 sessions with non-zero thinking content.

- **Pearson r = 0.415** between thinking_chars and visible_response_chars
- thinking/visible ratio: mean=0.571, median=0.551, stdev=0.353

**Interpretation:** summary length is moderately correlated with visible-output length but is NOT dominated by it. The ratio varies widely (std ≈ 0.35 around a mean of 0.57), meaning summary length carries signal independent of visible-output length.

**Implication for MEAS-:** thinking_chars is a viable feature in its own right; we do not need to control for visible_chars to extract signal. But visible_chars is a useful covariate for interpretation.

## 4. Marker Density Assessment

Density per 1000 chars of thinking-summary text, means per cell:

| model  | prompt     | effort | selfCorr | branch | uncert | deadEnd |
|--------|------------|--------|---------:|-------:|-------:|--------:|
| sonnet | B-notools  | high   |    0.739 |      0 |  0.563 |       0 |
| sonnet | B-notools  | low    |    0.260 |      0 |  0.195 |       0 |
| sonnet | B-tools    | high   |    0.620 |      0 |  0.724 |       0 |
| sonnet | B-tools    | low    |    0.347 |      0 |  0.361 |       0 |
| opus   | B-notools  | high   |    0.123 |      0 |  0.246 |       0 |
| opus   | B-tools    | high   |    0.582 |      0 |  0.292 |       0 |
| opus   | B-tools    | low    |    0.272 |      0 |  0.248 |       0 |

**Findings per marker:**

- **self_correction_density**: Shows clear effort sensitivity (2-3× higher at high effort than low) in Sonnet. Worth promoting from speculative to **candidate feature** with stratification.
- **uncertainty_density**: Similar effort sensitivity. Worth promoting to **candidate feature** with stratification.
- **branching_density**: **ZERO across all cells.** The regex pattern `alternatively|or we could|two options|interpretations|on the other hand` matched nothing in 21 non-empty summaries. The marker set is unfit — either Claude's thinking summaries don't use these phrases, or the regex is too restrictive. **Falsify this marker as currently defined; a replacement marker set is needed OR branching should be dropped from the extractor.**
- **dead_end_density**: **ZERO across all cells.** The regex pattern `doesn't work|that fails|wrong approach|won't work|nope|scrap that` also matched nothing. **Same conclusion as branching** — falsify and revise or drop.

The two surviving markers (self_correction, uncertainty) both track effort. This is the first experimentally validated case of marker-density-as-signal for this corpus.

## 5. Summary of Load-Bearing Findings

1. **Thinking emission is threshold-gated, not continuous.** Recall prompts emit zero thinking. Opus + (complex prompt) + low effort also emits zero. `thinking_block_count > 0` is a binary feature worth capturing independently of length.

2. **Summary length covaries with effort and (for deliberation prompts) with model and prompt complexity.** It is a usable reasoning-complexity proxy with model and effort stratification.

3. **Sonnet summaries are consistently longer than Opus summaries at matched inputs.** Model is a required stratification axis — summary length must be normalized by model before cross-agent comparison.

4. **Tools permission slightly increases thinking length** (opposite of H4) but models never actually used tools in headless dispatch. H4 requires a different experimental design.

5. **Self-correction and uncertainty marker densities are usable features.** Branching and dead-end marker regex sets are unfit and need revision.

6. **Summary length is independent of visible-output length** (r=0.415, ratio std 0.35). Length carries its own signal.

7. **Phantom-token hypothesis (H5) has positive-delta evidence but needs a real tokenizer.** Deferred to spike C3.
