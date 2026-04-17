---
status: building
round: 1
mode: full
type: exploratory
---

# Spike Design: Thinking Summary as Reasoning Complexity Proxy

**Phase:** 57 (Phase 57.5 prerequisite)
**Created:** 2026-04-16
**Designed by:** Orchestrator (this conversation)
**Predecessor:** `.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md` §7 extractor #14, §8 open question 7

## Open Question

Are Claude thinking summaries (text content of `assistant.content[type=='thinking']` blocks in JSONL) usable as a heuristic measure of reasoning complexity for MEAS- measurement infrastructure? Specifically, does summary length and content covary with actual reasoning load (varied via prompt complexity, model capability, and effortLevel setting)?

## Why This Matters

Phase 57.5 will define MEAS- requirements that include extractors for reasoning-complexity features. The synthesis correction document (§7 extractor #14) proposes "summary complexity feature extractor" as a Priority-2 extractor but flags it as needing calibration before use as anything stronger than a dashboard feature. This spike provides that calibration.

Three specific MEAS- decisions depend on the answer:
1. Whether to include a summary-length feature in the extractor registry as a first-class reasoning-complexity proxy
2. Whether marker-density features (self-correction, branching, uncertainty, dead-end) are worth building extractors for at all
3. Whether to derive raw thinking token count from `output_tokens − tokens(visible+summary)` (the phantom-token hypothesis from synthesis §4)

## Type

**Exploratory** — characterize how summary content varies across measurable dimensions, then assess proxy quality. Not binary (no clean threshold for "useful"), not comparative across known options.

## Hypotheses

- **H1:** Summary length is monotone-increasing in prompt complexity, holding model and effort fixed.
- **H2:** Summary length is monotone-increasing in effortLevel, holding prompt and model fixed.
- **H3:** Opus produces longer summaries than Sonnet at equal effort and prompt — OR is indistinguishable (the null is also informative).
- **H4:** Allowing tools shifts reasoning load OUT of the thinking field (lower summary length) and INTO tool-use sequences.
- **H5 (phantom token):** `usage.output_tokens − tokens(visible response + visible thinking summary)` yields a positive delta consistent with billing-side raw thinking token count.

## Alternative Hypotheses

- **H-alt-1:** Summary length is bounded by a summarizer-output ceiling (plateaus regardless of underlying reasoning load above some threshold).
- **H-alt-2:** Subagents do NOT inherit parent session's effortLevel — they default to a fixed level. If true, varying effortLevel between runs produces no observable variance.
- **H-alt-3:** Summary length is dominated by structural format (e.g., always emits intro + body + conclusion) and reasoning load shows up only in body length, not total length.
- **H-alt-4:** Marker densities are uniform across complexity levels — if so, they cannot serve as complexity signals even if length does.

## Scope Boundaries

**In scope:**
- 18 subagent dispatches in parallel: 3 prompts × 2 models × 3 replicates, all at current effortLevel (`high`)
- Extraction of per-dispatch metrics from each subagent's JSONL file
- Hypothesis-by-hypothesis assessment in DECISION.md
- Promotion or demotion of synthesis §7 extractor #14 candidates

**Out of scope (deferred for follow-up):**
- Multi-effort-level comparison (requires user to change `effortLevel` in settings.json between runs)
- Multi-session replication (these 18 are dispatched from a single parent session)
- Statistical confidence intervals (n=3 is too small)
- Calibration against human-labeled reasoning quality (requires labeled corpus)

## Experimental Design

### Variables

| Variable | Levels | Manipulation |
|---|---|---|
| Prompt complexity | A (recall), B-notools (deliberation), B-tools (deliberation + tools) | Prompt text |
| Model | claude-sonnet-4-6, claude-opus-4-6 | Agent tool `model` parameter |
| Replicates | 3 | Parallel dispatches with identical inputs |
| effortLevel | high (this run only) | Settings.json (changed by user between runs for follow-up batches) |

### Cells

3 prompts × 2 models × 3 replicates = **18 dispatches per effort-level run**

### Prompts (delivered verbatim to subagents)

**Prompt A — low-invoking, no tools:**
> In one sentence, what does the Unix `ls` command do? Reply directly with one sentence and stop. Do not use any tools.

**Prompt B-notools — high-invoking, no tools:**
> Without using any tools or external references, design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. Do not use any tools — respond directly with your reasoning and conclusions.

**Prompt B-tools — high-invoking, tools allowed (control):**
> Design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. You may use tools (such as web search) if helpful, but don't feel obligated to. Provide your reasoning and conclusions.

### Dispatch Matrix (order preserved for agentId mapping)

| # | Model | Prompt | Replicate |
|---|---|---|---|
| 1 | sonnet | A | 1 |
| 2 | sonnet | A | 2 |
| 3 | sonnet | A | 3 |
| 4 | opus | A | 1 |
| 5 | opus | A | 2 |
| 6 | opus | A | 3 |
| 7 | sonnet | B-notools | 1 |
| 8 | sonnet | B-notools | 2 |
| 9 | sonnet | B-notools | 3 |
| 10 | opus | B-notools | 1 |
| 11 | opus | B-notools | 2 |
| 12 | opus | B-notools | 3 |
| 13 | sonnet | B-tools | 1 |
| 14 | sonnet | B-tools | 2 |
| 15 | sonnet | B-tools | 3 |
| 16 | opus | B-tools | 1 |
| 17 | opus | B-tools | 2 |
| 18 | opus | B-tools | 3 |

## Measurement

For each dispatched subagent's JSONL file (located at `~/.claude/projects/<session-dir>/subagents/agent-{agentId}.jsonl`), extract:

**Per-turn:**
- `thinking_block_count` — number of `assistant.content[type=='thinking']` blocks
- `thinking_total_chars` — sum of `thinking` field lengths
- `output_tokens` — from `assistant.message.usage.output_tokens`
- `input_tokens` — from `assistant.message.usage.input_tokens`
- `cache_read_input_tokens`, `cache_creation_input_tokens` — same path
- `durationMs` — from `system/turn_duration` records (if present)
- `visible_response_chars` — sum of `text`-type content lengths
- `tool_call_count` — number of `tool_use` records

**Per-session aggregate:**
- All per-turn metrics summed
- `n_turns` — number of assistant records
- `model` (from first assistant record)

**Derived (extractor):**
- `phantom_tokens = output_tokens − ceil((visible_response_chars + thinking_total_chars) / 4)` (4 chars ≈ 1 token approximation)
- Marker densities per 1000 chars of summary text:
  - `self_correction_density` — matches: `actually|wait|hmm|on second thought|let me reconsider|that's wrong`
  - `branching_density` — matches: `alternatively|or we could|two options|interpretations|on the other hand|alternatively`
  - `uncertainty_density` — matches: `not sure|unclear|might|maybe|probably|likely|perhaps|i think`
  - `dead_end_density` — matches: `doesn't work|that fails|wrong approach|won't work|nope|scrap that`

## Caveats Surfaced in Design

1. **Subagent effortLevel inheritance is unconfirmed.** If subagents do not inherit parent's `effortLevel` setting, varying it between runs (planned for follow-up) will produce no observable variance. This single-effort-level run cannot test inheritance directly; it will be tested when the user runs Round 2 at a different level.

2. **Phantom-token tokenizer is approximate.** The 4-chars-per-token heuristic introduces bias. True Anthropic tokenizer would give exact counts; this approximation is good enough to test sign and order of magnitude, not exact equality.

3. **Marker-density patterns are uncalibrated.** They are plausible heuristics for the markers they name, but no empirical validation exists that "actually" or "wait" actually correlates with self-correction in Claude's thinking summaries. This spike collects them; calibration is a separate effort.

4. **n=3 is small.** Variance estimates will be noisy. Results inform direction (does the metric vary at all? in the predicted direction?) not statistical confidence.

5. **18 parallel dispatches may hit rate limits.** If so, the spike runner will batch and note the failure mode in DECISION.md.

6. **Spike-runner agent cannot dispatch subagents.** The `gsdr-spike-runner` has tools `Read, Write, Bash, Glob, Grep` — no `Agent` tool. The orchestrator (this conversation) handles the Run phase manually. This is documented in `WORKFLOW-DEVIATION.md` in this workspace.

## Success Criteria

The spike succeeds if DECISION.md can answer all of:

- Is summary length a usable reasoning-complexity proxy at the current effort level? (yes / yes-with-stratification / no / inconclusive)
- Does prompt complexity produce observable summary-length variation? (yes / no, magnitude)
- Does model capability (Sonnet vs Opus) produce observable summary-length variation? (yes / no, magnitude)
- Do tools shift reasoning load out of the thinking field? (yes / no / mixed)
- Does the phantom-token derivation produce positive deltas in practice? (yes / no / inconsistent)
- Which marker densities are worth promoting from speculative to candidate features? (list)

The spike produces an INCONCLUSIVE outcome if:
- More than 30% of dispatches fail (data gap too large)
- All metrics are dominated by structural noise (no signal across any cell)
- Subagent JSONL files cannot be located after dispatch

## Artifacts to Produce

- `DESIGN.md` (this file)
- `WORKFLOW-DEVIATION.md` — explains why orchestrator handles Run phase
- `dispatch_manifest.csv` — written before dispatch with planned matrix
- `agent_id_map.csv` — written after dispatch with actual agentIds mapped to cells
- `raw_jsonl_paths.txt` — paths to the 18 (or fewer if some failed) subagent JSONL files
- `per_dispatch_metrics.csv` — extracted metrics, one row per dispatch
- `extract_metrics.py` — the extraction script (committed for reproducibility)
- `analysis.md` — hypothesis-by-hypothesis assessment with summary statistics
- `DECISION.md` — spike conclusions and MEAS- recommendations
- KB entry at `.planning/knowledge/spikes/get-shit-done-reflect/2026-04-16-thinking-summary-as-reasoning-proxy.md`
