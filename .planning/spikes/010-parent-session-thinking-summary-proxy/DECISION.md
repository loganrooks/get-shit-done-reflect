---
status: complete
round: 1
outcome: partial
mode: full
type: exploratory
---

# Spike Decision: Parent-Session Thinking Summary as Reasoning Complexity Proxy

**Completed:** 2026-04-16
**Question:** Do Claude thinking summaries covary with reasoning load in parent sessions (where thinking content empirically exists), along the dimensions of prompt complexity (H1), effort level (H2), model capability (H3), and tool availability (H4)?
**Answer:** Partially yes. H1 and H2 confirmed with strong effects. H3 falsified in its stated direction (Sonnet > Opus, not the reverse). H4 untestable in the headless dispatch context because neither model used tools when permitted.

## Summary

All 36 dispatches succeeded after one round of 6-cell retries (initial 529 overload errors on Opus cells; retries hit cleanly via 2-at-a-time parallel dispatch). Data resolves H1–H3 and leaves H4 structurally untestable in this experimental context. Summary length is a usable reasoning-complexity proxy **only** when stratified by model and effort level. Thinking emission is threshold-gated (recall prompts produce zero thinking regardless of inputs; Opus + B-notools + low effort also emits zero), so `thinking_block_count > 0` is itself a binary feature worth capturing. Self-correction and uncertainty marker densities are worth promoting to candidate features; branching and dead-end regex marker sets matched nothing in the full corpus and need revision or removal.

Phantom-token hypothesis (H5) shows positive deltas consistent with the synthesis-correction billing asymmetry claim but is still dominated by tokenizer-approximation error. Deferred to spike C3 (real tokenizer).

Five new findings not anticipated in DESIGN.md are documented below and materially affect MEAS- requirement design.

## Findings

Detailed per-hypothesis results are in `analysis.md`. Key takeaways:

### H1 — Prompt complexity → thinking emission + length

**CONFIRMED, with a structural refinement.** Thinking emission is threshold-gated (categorical), not continuous. Recall prompts → 0 thinking blocks across 12 cells. Deliberation prompts → 1 thinking block of variable length. Once emitted, length varies by ~40× across the corpus.

### H2 — Effort level → summary length

**CONFIRMED, with model-dependent magnitude.** Sonnet: 4.2× low→high on B-notools, 2.5× on B-tools. Opus: 2.2× on B-tools; on B-notools, effort is a binary emission gate (0 chars at low, 2,550 chars at high). Effort is a strong signal.

### H3 — Opus > Sonnet at matched inputs

**FALSIFIED.** Sonnet summaries are 2-3× LONGER than Opus summaries at matched prompt and effort. This is surprising and consequential: summary length is NOT a model-free reasoning complexity signal. Opus's summarizer appears to produce more compressed output, or Opus's thinking involves less narrative verbosity. We cannot distinguish these interpretations from this data.

### H4 — Tools shift load out of thinking

**UNTESTABLE in the headless dispatch context.** `tool_call_count = 0` across all 12 B-tools cells. Neither Sonnet nor Opus ever used tools when permitted via `claude -p` without `--tools ""`. So we cannot measure whether *actual* tool use shifts load. The permission-only effect slightly *increased* thinking length (opposite of H4's prediction), but permission is not use.

### H5 — Phantom tokens ≈ raw thinking tokens

**Deferred per DESIGN.md.** Data collected; positive deltas present (consistent with synthesis §4 billing asymmetry) but tokenizer-approximation error dominates. Spike C3 is the correct next step.

### New finding 1 — Thinking emission threshold gate

Thinking content is emitted per a threshold combining (prompt complexity × model × effort). Below threshold → zero blocks. Above threshold → exactly 1 block of variable length. This is a binary feature (`thinking_emitted` ∈ {true, false}) worth capturing independently of length.

### New finding 2 — Headless dispatch does not exercise tool-use

A complementary structural finding to spike 009's (subagent-dispatch suppresses thinking): **headless `claude -p` dispatch does not exercise tool-use paths**. This is likely intentional design for pipeline/scripting contexts, but it means experiments that need to observe actual tool-use behavior cannot rely on headless dispatch.

### New finding 3 — Summary length is independent of visible-output length

Pearson r = 0.415 between thinking_chars and visible_response_chars; ratio std ≈ 0.35 around mean 0.57. Summary length carries independent signal; it is not dominated by the obvious "longer responses have longer summaries" confound.

### New finding 4 — Branching and dead-end marker regex sets are unfit

Both `branching_density` and `dead_end_density` were exactly 0.0 across all 21 non-empty-thinking cells. The marker sets carried over from spike 009 do not match anything in Claude's actual thinking-summary vocabulary. These markers must be redesigned (via sampling actual summaries to build empirically grounded marker sets) or removed from the extractor.

### New finding 5 — Self-correction and uncertainty markers track effort

Self-correction marker density is 2-3× higher at high vs low effort for Sonnet. Uncertainty marker density shows the same pattern. These two markers survived empirical testing and are worth promoting from **speculative** to **candidate features** with model+effort stratification.

### New finding 6 — Summary length is NOT a reasoning-quality proxy (qualitative)

See `qualitative_comparison.md`. A qualitative read of matched Sonnet/Opus B-notools high cells reveals that the 2-3× length difference (Sonnet > Opus) reflects **summarizer verbosity**, not superior reasoning. Both models converge on the same 4-principle topoi; Opus produces higher density per character, engages more canonical philosophical literature (Haraway, Nagel), and names more concrete real-world failure modes. Sonnet's longer summaries contain more meta-commentary and exposition.

**This materially revises the MEAS- implication of H3's falsification:** length difference is NOT a quality difference. Summary length, even model-stratified, cannot rank agents by reasoning quality. Reasoning-quality measurement for the Agent Performance loop (Phase 57.5) requires a separate mechanism — candidate approaches include reference-density features, concept-diversity features, or LLM-as-judge scoring. **None of these are addressed by spike 010 or any of the previously-proposed spikes.** This is a significant gap that should surface in discuss-phase 57.5 as a load-bearing design question.

## Analysis

| Hypothesis | Testable? | Outcome | Strength of evidence |
|---|---|---|---|
| H1: length ↑ with complexity | Yes | Confirmed (threshold + continuous) | Strong: categorical effect at emission, ~40× range at length |
| H2: length ↑ with effort | Yes | Confirmed (model-dependent) | Strong: 2-4× ratios consistent across prompts |
| H3: Opus > Sonnet | Yes | **Falsified** (Sonnet > Opus 2-3×) | Strong: consistent inversion across all matched pairs |
| H4: tools shift load | No (no tool use) | Untestable; permission-only effect is opposite to prediction | Weak: direction indicative only |
| H5: phantom ≈ raw thinking | Deferred | Not resolved (tokenizer-approximation error) | Positive deltas consistent with hypothesis; need C3 |

## Decision

### Summary complexity extractor — UPDATED SHAPE

Adopt a **composite feature** for reasoning-complexity measurement rather than a single length feature:

1. **`thinking_emitted`** (boolean) — is `thinking_block_count > 0`? This is a strong categorical signal that separates recall from deliberation.
2. **`thinking_total_chars`** (numeric, only meaningful when `thinking_emitted=true`) — summary length. MUST be stratified by model when used for cross-agent comparison.
3. **`thinking_over_visible_ratio`** (numeric, only meaningful when thinking_emitted=true) — `thinking_chars / visible_chars`. Less model-dependent than raw length; captures "reasoning-density" per unit of visible output.
4. **`marker_self_correction_density`** and **`marker_uncertainty_density`** — candidate features with model+effort stratification. Branching and dead_end markers dropped from spec until marker set is redesigned.

### Extractor preconditions (refining synthesis correction Decision 6)

All reasoning-derived features require THREE preconditions:

1. **Model family gated:** Haiku models do not emit thinking blocks at all. (from synthesis correction — not directly tested here because all spike dispatches used Sonnet or Opus.)
2. **Dispatch context gated:** Subagent dispatches emit 0 thinking blocks regardless of model (spike 009). Headless `claude -p` dispatches DO emit thinking blocks (this spike's finding).
3. **Effort/prompt threshold gated (new from spike 010):** Even in a thinking-permitted context with a thinking-capable model, specific combinations (recall prompts; Opus + B-notools + low effort) produce zero thinking. This is a model-specific emission threshold that the extractor cannot predict; it must treat zero-emission as a legitimate `not_emitted` state distinct from `not_applicable` or `not_available`.

The extractor must return one of four statuses per metric:

- `exposed` — metric is available
- `not_emitted` — precondition satisfied but the model chose not to emit thinking
- `not_applicable` — model is not thinking-capable
- `not_available` — dispatch context suppresses emission (subagent dispatch)

### Phantom token derivation — STILL BLOCKED

Scaffold the schema (include `phantom_thinking_tokens` as a field in the metrics CSV) but do not compute or consume it as a feature until spike C3 (real tokenizer) resolves the approximation error.

### Marker density features — REVISED

- **Keep and promote:** `marker_self_correction_density`, `marker_uncertainty_density` (both track effort; directionally plausible)
- **Drop or redesign:** `marker_branching_density`, `marker_dead_end_density` (regex matched nothing in 21 sessions). If these concepts are load-bearing, build marker sets from sampling the actual thinking-summary corpus, not from general plausibility.

### Confidence

**MEDIUM.** The directional findings are robust at n=3 with 2-4× magnitudes and consistent signs across matched pairs. The specific magnitudes are not trustworthy at n=3, but the directions are. H3's inversion (Sonnet > Opus) is the most consequential finding and should be independently replicated before any MEAS- governance commits to model-dependent length normalization.

## Implications

### For Phase 57.5 governance (A1–A5 updates)

**MEAS- requirements updates** (replacing/refining items from synthesis correction §6):

- **§6.1 (summary complexity extractor):** replace single-length feature with composite (emitted + chars + ratio + 2 markers). Strip branching and dead_end markers from spec.
- **§6.4 (model-family gate):** refine to three-level gate (model-family, dispatch-context, emission-threshold) with four-status return (`exposed` / `not_emitted` / `not_applicable` / `not_available`).
- **§6.1 extractor preconditions:** add "effort level at dispatch" as a required stratification variable alongside model. The `--effort` flag value must be captured at the dispatch layer because it overrides settings.json.

### For the Agent Performance loop (synthesis §8.2)

The agent-performance loop was flagged in pre-57.5 handoff as facing a 94% corpus problem because subagents have no reasoning content. This spike confirms that **headless dispatch has reasoning content but does not exercise tool use**. So:

- Agent-performance evaluation via reasoning metrics requires **parent-session data generated going forward** (not the existing corpus, since 94% of existing JSONLs are subagents with zero thinking)
- Tool-use evaluation needs an experimental context different from both headless and subagent dispatch. Interactive sessions are the likely target, but those are not easily dispatched programmatically.

### For follow-up spikes

- **C2 (investigation spike on subagent thinking suppression)** remains valid and interesting. Spike 010's headless finding shows the gate is specifically in the Task/Agent tool dispatch, not in the Claude Code harness generally.
- **C3 (real-tokenizer spike)** is now the highest-value next experiment. Spike 010's phantom-token data gives C3 clean input to work from.
- **New candidate spike (C4?):** marker-set calibration via sampling actual thinking summaries. Would validate or replace the self_correction and uncertainty regex families and build empirically grounded branching/dead_end markers if those concepts prove load-bearing.

### Discuss-phase 57.5 input

For question #1 (subagent reasoning measurement strategy), the pre-57.5 handoff presented three options: (a) parent-only, (b) structural-proxy-only, (c) build-forward via headless. Spike 010 confirms option (c) is **technically viable** (headless dispatches produce thinking content) but comes with the caveat that tool-use is not exercised in headless context. The full-fidelity answer is (a)+(c): use parent-session data retroactively + build a forward dataset via headless dispatch + use structural proxies for the subagent gap. Tool-use metrics specifically need interactive sessions, which is a separate infrastructure question.

## Metadata

**Spike duration:** ~35 min wall-clock (dispatch) + ~5 min retries + ~10 min extraction/analysis + ~10 min documentation
**Iterations:** 1 (Round 1 completed cleanly after a 6-cell retry for 529 overloads)
**Effort levels tested:** low, high (medium and max excluded by design)
**Models tested:** claude-sonnet-4-6, claude-opus-4-6 (Haiku excluded; spike 009 already established Haiku does not emit thinking)
**Dispatch context:** headless `claude -p` (parent-session equivalent)
**Settings at run:** `showThinkingSummaries: true`; `--effort` flag per-dispatch
**Claude Code version:** 2.1.110 (stable across all 42 dispatches)
**Originating spike:** 009 (which established the subagent-dispatch gate that made 010's matrix untestable in 009's context)
**Originating audit:** `.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md` §7 #14, §8 OQ7
