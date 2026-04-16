---
id: spk-2026-04-16-parent-session-thinking-summary-proxy
type: spike
project: get-shit-done-reflect
tags: [measurement, phase-57.5, thinking-summaries, headless-dispatch, claude-code-internals, effort-level, model-comparison]
created: 2026-04-16T07:30:00Z
updated: 2026-04-16T07:30:00Z
durability: principle
status: active
hypothesis: "Claude thinking summaries covary with reasoning load (prompt complexity, effort level, model, tool availability) in parent sessions (headless `claude -p` dispatches)"
outcome: partial
rounds: 1
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.4+dev
depends_on: [spk-2026-04-16-thinking-summary-as-reasoning-proxy]
---

## Hypothesis

In parent sessions (via headless `claude -p`), thinking summary length and marker-density features covary with reasoning load along four dimensions: prompt complexity (H1), effort level (H2), model capability (H3), and tool availability (H4). Premise: headless `claude -p` does not inherit the subagent-dispatch gate that spike 009 identified, so thinking content is present and measurable.

## Experiment

36 headless `claude -p` dispatches in a single sequential pass (plus 6 retries for cells that hit Anthropic 529 overload errors). Matrix: 3 prompts × 2 models × 2 effort levels × 3 replicates. Key differences from spike 009:

- **Dispatch mechanism:** `claude -p "<PROMPT>" --model {sonnet|opus} --effort {low|high} [--tools ""] --output-format json` instead of Task/Agent tool
- **Effort manipulation:** `--effort` CLI flag (overrides settings.json per-session) instead of edit-settings-between-batches
- **Effort levels tested:** low and high only (medium and max excluded by design)
- **Settings:** `showThinkingSummaries: true` verified globally
- **Claude Code:** v2.1.110 throughout

Per-dispatch extraction: thinking_block_count, thinking_total_chars, visible_response_chars, output_tokens, tool_call_count, marker densities (self_correction, branching, uncertainty, dead_end), derived phantom_tokens (4-chars/token approximation).

## Results

Group means (n=3 per cell):

| model  | prompt     | effort | thinkBlk | thinkChars | visChars | outTok |
|--------|------------|--------|---------:|-----------:|---------:|-------:|
| sonnet | A          | low    |     0.00 |          0 |      116 |     26 |
| sonnet | A          | high   |     0.00 |          0 |      116 |     26 |
| opus   | A          | low    |     0.00 |          0 |       51 |     20 |
| opus   | A          | high   |     0.00 |          0 |       56 |     23 |
| sonnet | B-notools  | low    |     1.00 |      1,870 |   10,225 |  5,427 |
| sonnet | B-notools  | high   |     1.00 |      7,829 |    8,656 |  8,897 |
| opus   | B-notools  | low    |   **0.00** |      **0** |    3,971 |  1,318 |
| opus   | B-notools  | high   |     1.00 |      2,550 |    3,580 |  6,189 |
| sonnet | B-tools    | low    |     1.00 |      3,757 |   11,893 |  7,307 |
| sonnet | B-tools    | high   |     1.00 |      9,465 |   10,976 | 11,869 |
| opus   | B-tools    | low    |     1.00 |      1,736 |    5,391 |  5,171 |
| opus   | B-tools    | high   |     1.00 |      3,790 |    5,736 |  8,401 |

Tool use: `tool_call_count = 0` across all 12 B-tools cells. Neither Sonnet nor Opus ever used tools in headless dispatch when permitted.

Correlation: thinking_chars ~ visible_chars Pearson r = 0.415 across 21 non-empty-thinking sessions.

## Decision

### Hypothesis outcomes

- **H1 (complexity → length): CONFIRMED with threshold refinement.** Recall prompts produce zero thinking blocks regardless of model or effort (threshold gate). Deliberation prompts produce one block of variable length.
- **H2 (effort → length): CONFIRMED, model-dependent.** Sonnet shows 2.5-4.2× low→high ratios. Opus shows 2.2× on B-tools and a binary emission threshold on B-notools (0 at low, 2550 at high).
- **H3 (Opus > Sonnet): FALSIFIED.** Sonnet summaries are 2-3× LONGER than Opus at matched inputs. This inverts the expected direction. Possible interpretations (not distinguishable from this data): Opus has a more compressive summarizer, or Opus thinking is internally less verbose, or different summary-length budgets apply per model.
- **H4 (tools shift load): UNTESTABLE in headless dispatch.** Neither model used tools when permitted. The permission-only effect slightly *increased* thinking length (opposite of H4's prediction), but permission ≠ use.
- **H5 (phantom tokens ≈ raw thinking): Deferred per DESIGN.md.** Positive deltas collected; spike C3 (real tokenizer) is the correct next experiment.

### New structural findings (not in H1–H5)

1. **Thinking emission is threshold-gated.** `thinking_block_count > 0` is a categorical feature combining prompt × model × effort. Zero-emission under satisfied preconditions is a `not_emitted` status distinct from `not_applicable` (model family) or `not_available` (dispatch context).
2. **Headless dispatch does not exercise tool-use.** Complementary to spike 009's subagent-dispatch thinking suppression. Tool-use measurement requires a different experimental context (likely interactive sessions, which are not easily dispatched programmatically).
3. **Summary length is independent of visible-output length** (r=0.415, ratio std 0.35 around mean 0.57). Length carries independent signal.
4. **`branching_density` and `dead_end_density` marker regex sets are unfit.** Both were exactly 0.0 across 21 non-empty-thinking sessions. Must redesign (via sampling actual summaries) or drop.
5. **`self_correction_density` and `uncertainty_density` track effort.** Promote from speculative to candidate features with model+effort stratification.

## Consequences

### For Phase 57.5 MEAS- requirements (updates to synthesis correction §6)

- **§6.1 summary complexity extractor — revised shape:** composite feature instead of single length. Components: `thinking_emitted` (bool), `thinking_total_chars` (numeric, model-stratified), `thinking_over_visible_ratio` (numeric), `marker_self_correction_density`, `marker_uncertainty_density`. Drop `marker_branching_density` and `marker_dead_end_density` pending marker-set redesign.
- **§6.4 model-family gate — refined to three-level gate with four-status return:**
  - `exposed` — metric is available
  - `not_emitted` — preconditions met but model chose not to emit
  - `not_applicable` — model is not thinking-capable
  - `not_available` — dispatch context suppresses emission
- **New extractor requirement:** record `effort_level` from dispatch metadata (the `--effort` CLI flag value, or settings.json value if flag absent) as a required stratification variable.
- **Cross-model comparison requires length normalization by model** — cannot use raw `thinking_total_chars` for Sonnet-vs-Opus comparison without stratifying.

### For Phase 57.5 Agent Performance loop

- Building forward via headless `claude -p` is **technically viable** (thinking content is present). Combined with parent-session retroactive data, this addresses the ~94% subagent corpus gap.
- **Caveat:** headless dispatch doesn't exercise tool-use, so tool-behavior metrics need a separate experimental context (likely interactive sessions).

### Follow-up spikes

- **C3 (real-tokenizer phantom-token spike):** now highest-value next experiment. Spike 010 data provides clean input.
- **New C4 candidate: marker-set calibration.** Sample actual thinking summaries, design empirically grounded marker sets for branching and dead-end concepts (if load-bearing), validate via bootstrap.
- **C2 (subagent-dispatch investigation spike) remains valid.** Spike 010 narrows the gate to specifically the Task/Agent tool dispatch (headless bypasses it).

### Confidence

MEDIUM. Directional findings are robust at n=3 with 2-4× magnitudes and consistent signs. Specific magnitudes not trustworthy at n=3. H3's inversion (Sonnet > Opus) is the most consequential finding — it should be independently replicated before MEAS- governance commits to model-dependent length normalization.

## Metadata

- **Spike workspace:** `.planning/spikes/010-parent-session-thinking-summary-proxy/`
- **Originating audit:** `.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md` §7 #14, §8 OQ7
- **Predecessor spike:** 009 (subagent-dispatch gate discovery)
- **Raw data:** per_dispatch_metrics.csv (42 rows: 36 original + 6 retries; canonical view prefers R_ retry rows)
- **Dispatch artifacts:** session_id_map.csv, experiments/dispatch.sh, experiments/retry_failed.sh, experiments/extract_metrics.py
- **36/36 JSONLs persisted** at `~/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/<session-id>.jsonl`
