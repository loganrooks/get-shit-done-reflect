---
created: 2026-04-16T00:00:00Z
status: complete
originating_phase: 57.5
depends_on: [009-thinking-summary-as-reasoning-proxy]
round: 1
mode: full
type: exploratory
outcome: partial
time_estimate: ~75-90 min wall-clock (36 dispatches sequentially with 2s pause between) + ~15 min analysis
actual_time: ~35 min dispatch + ~5 min retries + ~20 min analysis/docs
---

# Spike 010: Parent-Session Thinking Summary as Reasoning Complexity Proxy

**Phase:** 57.5 (prerequisite)
**Designed by:** Orchestrator (this conversation)
**Predecessor:** Spike 009 (`.planning/spikes/009-thinking-summary-as-reasoning-proxy/`)
**Originating audit:** `.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md` §7 extractor #14, §8 OQ7

## Question

Do Claude thinking summaries (text content of `assistant.content[type=='thinking']` blocks in JSONL) covary with reasoning load in **parent sessions** (where thinking content is empirically present), along the dimensions of prompt complexity (H1), effort level (H2), model capability (H3), and tool availability (H4)?

## Why This Matters

Spike 009 established a structural finding: subagents dispatched through Task/Agent tool emit zero thinking blocks regardless of model, so H1–H4 from 009 were untestable in that dispatch context. The post-009 verification (single headless `claude -p` with Sonnet, B-notools) produced 1 thinking block of 9,597 characters — confirming the parent-session variant of the experiment is viable.

Spike 010 re-runs the matrix in that viable context. The output calibrates — or falsifies — the following MEAS- requirement candidates from the synthesis correction document:

1. **Summary complexity extractor** (§7 #14, §6.1) — currently marked "speculative pending spike-level calibration." 010 promotes length to intervention-tested (or falsifies) and gives directional evidence on marker densities.
2. **Summary length as reasoning-complexity feature** (§2.2, §5 Decision 6) — currently documented with cautions; 010 shows whether length actually separates complexity levels at parent-session scale.
3. **Phantom token derivation** (§4, §6.5) — 009 concluded tokenizer-approximation dominates signal; 010 re-collects the raw token data for a future real-tokenizer spike (C3).

**What this spike does NOT do:** it does not replace the real-tokenizer spike (C3), the investigation spike on why subagent dispatch suppresses thinking (C2), or marker-density calibration against labeled ground truth (out of scope). It calibrates the features that Phase 57.5 governance will commit to, before governance commits to them.

## Type

**Exploratory** — characterize variance across measurable dimensions at n=3 per cell, assess proxy quality, feed findings to MEAS- governance. Not binary, not comparative across options.

## Prerequisites / Feasibility

**Environment requirements:**
- `claude` CLI available on PATH (verified in post-009 headless dispatch)
- `~/.claude/settings.json` contains `showThinkingSummaries: true` (set 2026-04-15; verify at spike start)
- Effort level manipulated per-dispatch via `--effort <level>` CLI flag (levels: `low`, `high` — `medium` and `max` are intentionally excluded from this spike; endpoints are more informative than mid-range at n=3)
- Project cwd: `/home/rookslog/workspace/projects/get-shit-done-reflect` (for consistent JSONL landing directory)

**Feasibility checklist:**
- [x] All prerequisites available (post-009 verification confirmed)
- [x] Experiments run in spike workspace isolation (dispatches spawn separate `claude -p` processes; no main-project mutation)
- [x] No production systems at risk

**Known risk:** rate limits on 36 sequential dispatches at ~11k output_tokens each. Mitigation: sequential or small-batch (3-at-a-time) execution, not fully parallel. Document rate-limit encounters in DECISION.md if they occur.

## Hypotheses

Carried forward from spike 009 (all untestable there due to dispatch-context gate):

- **H1:** Summary length is monotone-increasing in prompt complexity, holding model and effort fixed.
- **H2:** Summary length is monotone-increasing in effort level, holding prompt and model fixed. *(New to 010 — was "deferred + likely moot" in 009 because subagents don't inherit parent effortLevel; directly testable here via the `--effort` CLI flag, no settings.json edits required.)*
- **H3:** Opus produces longer summaries than Sonnet at equal effort and prompt — OR is indistinguishable (null is informative).
- **H4:** Allowing tools shifts reasoning load OUT of the thinking field (lower summary length) and INTO tool-use sequences.
- **H5 (deferred):** Phantom-token derivation `output_tokens − tokens(visible + summary) ≈ raw thinking tokens`. *Not resolved here* — 009 showed 4-chars/token approximation is unfit. 010 collects the underlying data for spike C3 (real tokenizer).

## Alternative Hypotheses (preserved from 009)

- **H-alt-1:** Summary length is bounded by a summarizer-output ceiling (plateaus above some threshold).
- **H-alt-3:** Summary length is dominated by structural format; reasoning shows up only in body length.
- **H-alt-4:** Marker densities are uniform across complexity levels.
- **H-alt-5 (new):** Summary length is dominated by *visible response length* (models that produce longer responses happen to also produce longer summaries), so length is not independent reasoning signal. Test: regress summary length against visible response length; residuals should correlate with prompt complexity if H1 is independent from length-of-output.

## Scope Boundaries

**In scope:**
- 36 headless `claude -p` dispatches in a single linear pass: 3 prompts × 2 models × 2 effort levels × 3 replicates
- Effort levels: `low` and `high` only (medium and max excluded — endpoints are more informative at n=3)
- Extraction of per-dispatch metrics from each session's JSONL file
- Per-dispatch effort level recorded in `session_id_map.csv` (dispatched value is ground truth; no settings.json read ambiguity because `--effort` overrides settings for that session)
- Hypothesis-by-hypothesis assessment of H1, H2, H3, H4 in DECISION.md
- Raw data collection for H5 (deferred resolution)

**Out of scope:**
- Statistical confidence intervals (n=3 is directional evidence only)
- Medium and max effort levels (testing endpoints first; mid-range testing deferred unless endpoints show signal and mid-range discrimination becomes load-bearing)
- Calibration against human-labeled reasoning quality (deferred to a future labeled-corpus spike)
- Marker-density validation against ground truth (deferred)
- Cross-project replication (single project, single machine)
- Real-tokenizer phantom-token resolution (spike C3)

## Experimental Design

### Variables

| Variable | Levels | Manipulation |
|---|---|---|
| Prompt complexity | A (recall), B-notools (deliberation no tools), B-tools (deliberation with tools allowed) | Prompt text + `--tools` flag |
| Model | claude-sonnet-4-6, claude-opus-4-6 | `--model` flag |
| Effort level | low, high *(medium, max not tested)* | `--effort <level>` CLI flag |
| Replicates | 3 per cell | Independent dispatches with identical inputs |
| Tools | none (`--tools ""`), default (flag omitted) | `--tools` flag (omit for B-tools cells, pass `""` otherwise) |

### Dispatch Cells

3 prompts × 2 models × 2 effort levels × 3 replicates = **36 dispatches** (single linear pass, no rounds)

### Prompts (verbatim from spike 009 — same prompts allow cross-spike comparison)

**Prompt A — recall, no tools:**
> In one sentence, what does the Unix `ls` command do? Reply directly with one sentence and stop. Do not use any tools.

**Prompt B-notools — deliberation, no tools:**
> Without using any tools or external references, design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. Do not use any tools — respond directly with your reasoning and conclusions.

**Prompt B-tools — deliberation, tools allowed:**
> Design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. You may use tools (such as web search) if helpful, but don't feel obligated to. Provide your reasoning and conclusions.

### Dispatch Command Template

```bash
claude -p "<PROMPT>" \
  --model {sonnet|opus} \
  --effort {low|high} \
  --tools "" \               # A and B-notools only; omit for B-tools
  --output-format json
```

(`--max-budget-usd` is not supported in Claude CLI v2.1.110 per runner's pre-dispatch check; omitted. Cost ceiling enforced via expected ~11k output_tokens per dispatch × 36 dispatches ≈ 400k tokens baseline.)

The command emits a JSON result on stdout containing `session_id` and `usage` fields. JSONL is written to:
```
~/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/<session-id>.jsonl
```

### Dispatch Matrix (36 cells, single pass)

Ordered to group by (prompt, model) so cache reuse within a cell group is transparent; effort level alternates within each group so the low/high pair appears near the same wall-clock window (minimizing Claude Code version or environmental drift between matched cells):

| # | Model | Prompt | Effort | Replicate | Tools flag |
|---|---|---|---|---|---|
| 1 | sonnet | A | low | 1 | `--tools ""` |
| 2 | sonnet | A | low | 2 | `--tools ""` |
| 3 | sonnet | A | low | 3 | `--tools ""` |
| 4 | sonnet | A | high | 1 | `--tools ""` |
| 5 | sonnet | A | high | 2 | `--tools ""` |
| 6 | sonnet | A | high | 3 | `--tools ""` |
| 7 | opus | A | low | 1 | `--tools ""` |
| 8 | opus | A | low | 2 | `--tools ""` |
| 9 | opus | A | low | 3 | `--tools ""` |
| 10 | opus | A | high | 1 | `--tools ""` |
| 11 | opus | A | high | 2 | `--tools ""` |
| 12 | opus | A | high | 3 | `--tools ""` |
| 13 | sonnet | B-notools | low | 1 | `--tools ""` |
| 14 | sonnet | B-notools | low | 2 | `--tools ""` |
| 15 | sonnet | B-notools | low | 3 | `--tools ""` |
| 16 | sonnet | B-notools | high | 1 | `--tools ""` |
| 17 | sonnet | B-notools | high | 2 | `--tools ""` |
| 18 | sonnet | B-notools | high | 3 | `--tools ""` |
| 19 | opus | B-notools | low | 1 | `--tools ""` |
| 20 | opus | B-notools | low | 2 | `--tools ""` |
| 21 | opus | B-notools | low | 3 | `--tools ""` |
| 22 | opus | B-notools | high | 1 | `--tools ""` |
| 23 | opus | B-notools | high | 2 | `--tools ""` |
| 24 | opus | B-notools | high | 3 | `--tools ""` |
| 25 | sonnet | B-tools | low | 1 | (default) |
| 26 | sonnet | B-tools | low | 2 | (default) |
| 27 | sonnet | B-tools | low | 3 | (default) |
| 28 | sonnet | B-tools | high | 1 | (default) |
| 29 | sonnet | B-tools | high | 2 | (default) |
| 30 | sonnet | B-tools | high | 3 | (default) |
| 31 | opus | B-tools | low | 1 | (default) |
| 32 | opus | B-tools | low | 2 | (default) |
| 33 | opus | B-tools | low | 3 | (default) |
| 34 | opus | B-tools | high | 1 | (default) |
| 35 | opus | B-tools | high | 2 | (default) |
| 36 | opus | B-tools | high | 3 | (default) |

### Execution Strategy

**Sequential with 2s pause between dispatches.** Minimizes rate-limit interference with duration measurements (duration is a measured variable). If rate limits hit anyway, runner waits and resumes; do not retry same dispatch immediately. Document rate-limit encounters in DECISION.md.

**Single pass, no rounds.** All 36 cells run in one autonomous sequence. Round 2 (narrowing) only triggers per gsdr-spike-runner's iteration protocol if Round 1 is inconclusive.

## Measurement (reuse spike 009's `extract_metrics.py` with header/path adaptations)

For each dispatched session's JSONL file, extract:

**Per-turn:**
- `thinking_block_count` — number of `assistant.content[type=='thinking']` blocks
- `thinking_total_chars` — sum of `thinking` field lengths
- `output_tokens`, `input_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens` — from `assistant.message.usage`
- `durationMs` — from `durationMs` field on assistant records
- `visible_response_chars` — sum of `text`-type content block lengths
- `tool_call_count` — number of `tool_use` blocks (B-tools cells only)

**Per-session aggregate:**
- All per-turn metrics summed
- `n_turns` — number of assistant records
- `model` — from first assistant record's message.model
- `claude_code_version` — from first user record's `version` field (era marker)
- `session_id` — from `sessionId` field

**Settings / dispatch snapshot (per synthesis §6.3):**
- `effort_level` — the `--effort` flag value passed to that specific dispatch (ground truth; supersedes settings.json value for that session)
- `showThinkingSummaries` at dispatch time — from `~/.claude/settings.json` read once at script launch (should be `true` throughout)
- `claude_code_version` — from `claude --version` at script launch and from each JSONL's `user.version` field

**Derived (per-session):**
- `phantom_tokens = output_tokens − ceil((visible_response_chars + thinking_total_chars) / 4)` (approximate, unfit per 009)
- Marker densities per 1000 chars of summary text, using the same regex families from 009:
  - `self_correction_density` — `actually|wait|hmm|on second thought|let me reconsider|that's wrong`
  - `branching_density` — `alternatively|or we could|two options|interpretations|on the other hand`
  - `uncertainty_density` — `not sure|unclear|might|maybe|probably|likely|perhaps|i think`
  - `dead_end_density` — `doesn't work|that fails|wrong approach|won't work|nope|scrap that`

## Caveats Surfaced in Design

1. **Claude Code version era.** Round 1 will run at whatever `claude --version` reports today. If the version straddles a redaction change, results are muddled. Record `user.version` per dispatch; abort if mixed.

2. **Cache reuse across dispatches.** Sequential dispatches in the same cwd may share prompt-cache state. This benefits speed but may distort `cache_read_input_tokens`. Record cache tokens but do not over-interpret them as work signals.

3. **Tools-allowed does not mean tools-used.** Prompt B-tools permits but does not require tools. Spike 009 observed Opus 0/3 using tools, Sonnet 1/3. If the same pattern holds, H4 cannot cleanly test "tools shift load" — only "tool availability doesn't induce tool use."

4. **Headless session vs interactive session differences.** The post-009 verification used headless `claude -p`. Behavior may differ from interactive sessions (e.g., different default tool sets). Record and flag.

5. **n=3 is small.** Results inform direction. A 2× separation is signal; a 1.3× separation is noise.

6. **Effort flag authority.** `--effort` is passed per-dispatch, so it is ground truth for that session and overrides any settings.json value. `effortLevel` in settings.json is recorded once for completeness but is not the effective value.

7. **Prompt-cache between runs within one cell.** Three replicates of the same prompt+model will likely hit heavy cache reuse after the first run. This means replicates 2 and 3 may have very different token profiles from replicate 1. For summary-length (which is about output, not input), this matters less, but record and note.

## Success Criteria

The spike succeeds if DECISION.md can answer:

- [ ] **H1:** Does prompt complexity produce observable summary-length variation in parent sessions? (yes-with-magnitude / no / inconclusive)
- [ ] **H2:** Does effort level (low vs high) produce observable summary-length variation? (yes-with-magnitude / no / inconclusive)
- [ ] **H3:** Does model capability produce observable summary-length variation? (yes / no / magnitude)
- [ ] **H4:** Do tools shift reasoning load out of the thinking field? (yes / no / mixed / cannot-assess-because-tools-not-used)
- [ ] **Effort × complexity interaction:** Does effort amplify, dampen, or leave unchanged the complexity effect? (any interaction deserves a note)
- [ ] **Marker densities:** Which (if any) show variance across complexity or effort levels worth promoting from speculative to candidate features? (list with reasoning)
- [ ] **Summary-length vs visible-response-length:** Does length carry independent reasoning signal, or is it dominated by visible-output length? (regress and report)

The spike is INCONCLUSIVE if:
- >30% of dispatches fail (rate limits, API errors)
- Version-era mixing in collected JSONLs
- All metrics uniform across cells (no signal anywhere)

## Artifacts to Produce

- `DESIGN.md` (this file)
- `dispatch_manifest.csv` — planned matrix with cell IDs
- `session_id_map.csv` — post-dispatch mapping of cell ID → session UUID → JSONL path
- `raw_jsonl_paths.txt` — paths to completed JSONL files
- `per_dispatch_metrics.csv` — extracted metrics, one row per dispatch
- `extract_metrics.py` — extraction script (adapted from 009)
- `analysis.md` — hypothesis-by-hypothesis assessment
- `DECISION.md` — spike conclusions and MEAS- recommendations
- KB entry at `.planning/knowledge/spikes/get-shit-done-reflect/2026-04-16-parent-session-thinking-summary-proxy.md`

## Cost Estimate

Per post-009 verification: 1 high-effort dispatch ≈ 11,314 output_tokens, 122s duration.

- 36 dispatches total, but only ~half (18) run at high effort; low-effort dispatches are expected to be shorter (both fewer thinking tokens and shorter visible output for recall-class prompts).
- Rough upper bound: 36 × 11k = **~400k output tokens**, ~75-90min wall-clock sequential (122s × 36 + 2s pause × 35 = ~75min dispatch time + extraction overhead)
- Likely actual: ~250-350k output tokens if low-effort cells run lighter as expected.

Much higher than 009 because no cache reuse across fresh sessions (009 benefited from parent-session cache; 010 by design uses fresh sessions per dispatch).

---

## Iteration Log

### Round 1

**Status:** complete (outcome: partial)
**Summary:** All 36 dispatches succeeded (30 original + 6 retries after initial Opus 529 overload errors). H1 and H2 confirmed with strong effects. H3 falsified in its stated direction (Sonnet summaries are 2-3× longer than Opus at matched inputs). H4 untestable because neither model used tools when permitted in headless `claude -p` dispatch. Five new structural findings documented in DECISION.md: (1) thinking emission is threshold-gated not continuous, (2) headless dispatch does not exercise tool-use, (3) summary length is independent of visible-output length (r=0.415), (4) branching and dead-end marker regex sets matched nothing, (5) self-correction and uncertainty markers track effort. See `DECISION.md` for MEAS- implications.

### Round 2 (not triggered)

**Not run.** Round 1 produced directionally clean evidence across H1, H2, H3 and a structural answer for H4 (untestable in this context). Narrowing was not needed. Follow-up experiments are queued as separate spikes (C3 real-tokenizer for H5; potential new C4 for marker-set calibration).
**Status:** n/a
