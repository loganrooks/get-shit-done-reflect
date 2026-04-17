---
created: 2026-04-17T00:00:00Z
status: complete
originating_phase: 57.7
depends_on: [010-parent-session-thinking-summary-proxy]
round: 1
mode: full
type: exploratory
outcome: pending
time_estimate: ~20-30 min wall-clock
actual_time: pending
---

# Spike 011: C3 Tokenizer Availability for Claude Runtime Reconciliation

**Phase:** 57.7 (prerequisite for MEAS-RUNTIME-05 Claude branch)
**Designed by:** Executor
**Predecessor:** Spike 010 (`.planning/spikes/010-parent-session-thinking-summary-proxy/`)
**Originating requirement:** MEAS-RUNTIME-05 (`.planning/REQUIREMENTS.md`)

## Question

**Research question:** "Does a usable tokenizer exist for the Claude model family currently in use, and under what license / dependency terms?"

## Why This Matters

MEAS-RUNTIME-05 introduces a phantom-thinking-token reconciler whose Claude branch would compute:

`predicted_raw_thinking_tokens = output_tokens - tokens(visible_output) - tokens(thinking_summary)`

That branch is only legitimate if the tokenizer is accurate enough not to pollute the reasoning-token axis across the corpus. Shipping schema-only is acceptable under DC-5 and G-6; shipping a silently bad approximation is not.

This spike therefore decides two things:

1. Whether any offline tokenizer candidate is empirically usable under the phase's stipulated thresholds.
2. Whether Plan 08 is even allowed to consider a top-level dependency addition. The default remains schema-only unless DECISION.md explicitly overrides that posture.

## Type

**Exploratory decision spike** — run a bounded offline comparison against a committed corpus slice, then write a definite PASS / FAIL / MARGINAL decision record for downstream implementation.

## Prerequisites / Feasibility

**Environment requirements:**
- Claude JSONL corpus available at `/home/rookslog/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/`
- Local Node.js runtime for one-shot scripts
- Top-level `.gitignore` already covers nested `node_modules/`
- No top-level `package.json` mutation during the spike

**Feasibility checklist:**
- [x] Corpus exists and can be scanned locally
- [x] Non-empty thinking summaries exist in the corpus
- [x] Non-empty visible text exists in adjacent assistant records for evaluable response pairs
- [x] `node_modules/` is already ignored at repo root
- [x] Sample corpus can be committed as metadata only

**Operationalization note:** current Claude JSONL serializes many responses as adjacent assistant records with duplicated usage metadata: a `thinking` block record followed immediately by a `text` block record. For this spike, one evaluable sample unit is the adjacent pair `(thinking record index i, visible-text record index i+1)` with matching model and output-token count. This preserves the plan's intent while matching the real corpus shape.

## Acceptance Thresholds

The spike uses the stipulated thresholds from Phase 57.7 context:

1. **Median relative error** between tokenizer count and ground-truth `output_tokens` must be **< 15%**
2. **Negative-delta rate** (`output_tokens - tokens(visible_output) - tokens(thinking_summary) < 0`) must be **< 20%**
3. **Dependency posture** remains zero new production dependencies for this plan: the spike may use an ephemeral spike-local devDependency only

## Candidates to Evaluate

Priority order:

1. **Primary:** `js-tiktoken` with `cl100k_base`
   - Rationale: pure JS, zero transitive dependencies, viable as an offline approximation
   - Installation scope: spike-local only under `experiments/`
2. **Comparison baseline:** character-count-divided-by-4 heuristic
   - Rationale: intentionally weak baseline for contrast; never acceptable as silent production fallback
3. **Documented but not evaluated:** `@anthropic-ai/tokenizer`
   - Rationale: research already identified Anthropic's README disclaimer that it is obsolete for Claude 3+ models
4. **Documented but not evaluated:** Anthropic SDK `messages.countTokens`
   - Rationale: requires live API calls and violates the offline-retroactive posture of this phase

## Evaluation Corpus

**Source:** `/home/rookslog/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/` JSONL session files

**Selection rule:**
- assistant response must expose `usage.output_tokens > 0`
- adjacent assistant pair must contain:
  - a non-empty `thinking` block in the first record
  - a non-empty `text` block in the next record
  - the same `message.model`
- commit only metadata, never raw text

**Target sample:** 50 response pairs

**Observed availability in this corpus slice:**
- `claude-opus-4-6`: 174 eligible pairs
- `claude-sonnet-4-6`: 13 eligible pairs
- `claude-haiku*`: 0 eligible pairs

**Committed sample composition:**
- 13 Sonnet records (all available)
- 37 Opus records (first 37 after the model-floor allocation)
- 0 Haiku records (not available in this corpus slice)

This satisfies the "at least 10 per family where available" rule for Opus and Sonnet while documenting Haiku absence honestly.

`supporting-data/sample-sessions.json` carries metadata only:

```json
{
  "session_id": "uuid",
  "record_index": 5,
  "model": "claude-opus-4-6",
  "output_tokens": 2698,
  "visible_text_chars": 4716,
  "thinking_summary_chars": 2690
}
```

## Evaluation Procedure

1. Read `supporting-data/sample-sessions.json`
2. For each sample entry, reopen the source JSONL and load:
   - thinking summary text from assistant record `record_index`
   - visible output text from assistant record `record_index + 1`
3. Apply each tokenizer candidate:
   - `js-tiktoken(cl100k_base)`
   - `charDiv4`
4. Record per sample:
   - `record_id`
   - `output_tokens`
   - `tok_visible_*`
   - `tok_thinking_*`
   - `predicted_raw_thinking_tokens_*`
   - `absolute_relative_error_*`
   - `is_negative_*`
5. Write `supporting-data/tokenizer-evaluation.md` with:
   - per-record markdown table
   - overall summary statistics
   - per-model-family breakdown

## Acceptance / Reject Conditions

**PASS**
- A candidate clears both thresholds:
  - median relative error < 15%
  - negative-delta rate < 20%
- DECISION.md records `tokenizer_id=<winner>`
- Plan 08 may only ship the computed Claude branch if `production_dependency_decision == approve_top_level_dependency`

**FAIL**
- No candidate clears both thresholds
- DECISION.md records `FAIL: schema-only`
- Plan 08 ships the Claude branch as `availability_status: not_available` with `skip_reason: tokenizer_unavailable`

**MARGINAL**
- One candidate clears only one threshold or barely misses one while clearly outperforming the baseline
- DECISION.md must call that out explicitly
- Default downstream posture remains schema-only unless a later reviewer deliberately promotes it

## Privacy Model

This spike commits **counts and metadata only**. No verbatim user text, assistant text, or thinking-summary text is written under `supporting-data/` or `DECISION.md`. Text is loaded in-memory during evaluation and discarded immediately after token counting.

## Reversibility Note

Schema-only shipping preserves the MEAS-RUNTIME-05 seam. If a future phase validates a better tokenizer or revisits dependency posture, the Claude branch can upgrade from `not_available` to computed without refactoring the extractor contract.

Likewise, a PASS result does **not** force a production dependency. The promotion from spike-local devDependency to top-level runtime dependency remains a separate decision, and this spike defaults against making it.

## Artifacts to Produce

- `DESIGN.md` (this file)
- `supporting-data/sample-sessions.json`
- `experiments/run-c3-eval.cjs`
- `experiments/package.json`
- `supporting-data/tokenizer-evaluation.md`
- `DECISION.md`

## Success Criteria

The spike succeeds if DECISION.md can answer:

- [ ] Did any candidate achieve median relative error < 15%?
- [ ] Did any candidate achieve negative-delta rate < 20%?
- [ ] Is `js-tiktoken` materially better than `charDiv4` on the committed corpus?
- [ ] Is the correct downstream verdict PASS / FAIL / MARGINAL?
- [ ] What `production_dependency_decision` should Plan 08 read?

## Cost / Risk Notes

- Spike-local `npm install` must not pollute the top-level project
- The corpus is skewed toward Opus because that is what the available thinking-summary pairs contain
- Some responses have short visible text and large token counts, which is precisely why the empirical gate is needed
- `js-tiktoken` is expected to be approximate for Claude rather than byte-accurate; this spike measures whether the approximation is still usable

---

## Iteration Log

### Round 1

**Status:** pending
**Summary:** Design committed before experiment execution.
