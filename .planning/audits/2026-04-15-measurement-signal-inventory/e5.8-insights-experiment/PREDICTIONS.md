# E5.8 Pre-Registration of Predictions

**Written:** 2026-04-16, ~11:09 EDT
**Context:** /insights experiment launched at ~11:07 EDT, 2 minutes before this file is written. **Partial results already observed** — methodology failure acknowledged. User prompt enforced this discipline retroactively.

## What I already know (contaminated, cannot re-predict)

After ~45s of runtime I observed:
- session-meta: 268 → 470 (+202 new)
- facets: 109 → 161 (+52 new)
- All 60 new files sampled were NEW, zero REWRITE of snapshot files
- Process still running

So I cannot pre-register:
- Whether the subsystem is active (already confirmed YES)
- Whether post-2026-03-15 sessions get analyzed (already confirmed YES)
- Whether the run is incremental vs full-rewrite (tentatively INCREMENTAL per 0 rewrites observed)

**This confirms E5's reframe but the confirmation is methodologically weaker than if I had pre-registered.**

## What I can still pre-register

Launched at ~11:07, timeout is 300s (finishes by ~11:12). I write this at ~11:09.

### Prediction 1 — Final session-meta count

- **Guess:** ~600-900 session-meta files at completion (not the full 2,595 JSONL corpus)
- **Reasoning:** already at 470 after ~2 min; could double in the remaining ~3 min. Full corpus would imply 2,595 ÷ 5 ≈ 520/min processing rate, which is plausible. But incremental mode suggests a filter. I expect some filter — likely "sessions not already in cache" + maybe size threshold.
- **Falsifier:** if count exceeds 2,000, I underestimated throughput and the filter is weaker than I think. If count stays under 500, throughput is much lower than observed rate suggests.

### Prediction 2 — Facets-to-session-meta ratio after run

- **Historical baseline:** 109/268 = 40.7%
- **Currently:** 161/470 = 34.3% (drifting lower)
- **Guess:** ratio ends between 25% and 40% — lower than historical
- **Reasoning:** facets generation is LLM-based and slower than session-meta generation; if the run times out at 300s, more session-meta files will be written than facets can keep up with
- **Falsifier:** if ratio stays at 40%+ or exceeds 50%, they're generated together and my "LLM-slower" model is wrong

### Prediction 3 — Pre-snapshot files: rewritten or untouched

- **Guess:** the 268/109 pre-snapshot files will be UNTOUCHED (same mtimes as snapshot)
- **Reasoning:** 60 NEW / 0 REWRITE in first wave. /insights is incremental — re-analyzing unchanged sessions would waste LLM calls
- **Falsifier:** if any pre-snapshot file gets rewritten during this run, incremental-mode hypothesis fails

### Prediction 4 — mtime clustering of new files

- **Guess:** new files cluster tightly (seconds to low minutes, not spread over the full 300s uniformly)
- **Reasoning:** bulk-write pattern observed at March 8 and March 15 runs — /insights appears to batch writes at end of processing, not stream per-session
- **Falsifier:** if mtimes spread evenly across 300s window, writes are streamed per-session (not batched)

### Prediction 5 — report.html regeneration

- **Guess:** report.html WILL be overwritten by end of run (mtime post-11:07)
- **Reasoning:** the name suggests it's the final artifact; its last mtime (2026-03-15 18:17) was 1 minute AFTER the last session-meta cluster (18:16), suggesting it's written at end-of-run
- **Falsifier:** if report.html stays at 18:17 mtime after /insights completes, it's generated on different trigger (/insights report subcommand?)

### Prediction 6 — Schema drift in new facets files

- **Guess:** schema is IDENTICAL to March 15 snapshot (same fields, same enum values)
- **Reasoning:** v2.1.101 changelog mentioned only a bug fix for /insights report link — no schema work advertised between v2.1.78 and v2.1.110
- **Falsifier:** if new facets files have additional fields, dropped fields, or changed enum values, schema drift has happened silently

### Prediction 7 — Sessions covered vs excluded

- **Guess:** coverage is gated by session SIZE (short sessions excluded). Possibly: sessions under some turn-count or duration threshold are skipped.
- **Reasoning:** historical 41% facets-to-session-meta gap suggests a filter exists on one side. Small sessions have little to summarize.
- **Falsifier:** if coverage is ~uniform across session sizes, some other filter is at play (cost budget? rate limit? date window?)

### Prediction 8 — API cost

- **Guess:** ~$2-5 for this run (order of magnitude; 202 session-meta + growing, ~$0.01-0.03 per facets LLM call)
- **Reasoning:** Haiku or Sonnet for facet extraction, single-shot per session. 200-500 LLM calls total.
- **Falsifier:** cost wildly outside that range (but I have no way to measure cost directly, so this prediction is weak)

### Prediction 9 — Timeout behavior

- **Guess:** the 300s timeout will truncate the run mid-way. Final count plateaus when process is killed. A "complete" run (no timeout) would process more.
- **Reasoning:** already 470 after 2 min, still climbing; unlikely to finish all 2,595-worth of processing in 5 min
- **Falsifier:** if the process exits cleanly before 300s, it finished early — meaning it had a smaller target than the full corpus

### Prediction 10 — Post-run structural state

- **Guess:** one new mtime cluster in the new data, at ~11:09-11:11 (whenever the batch writes land)
- **Reasoning:** E5's pattern was two tight mtime clusters (March 8, March 15); a third cluster is the natural empirical test of this
- **Falsifier:** no tight cluster; mtimes spread across many minutes

## Meta

These predictions are partially contaminated (I observed first-45s results before writing them). The strongest independent tests are:
- Prediction 3 (any pre-snapshot rewrites?)
- Prediction 4 (mtime clustering shape)
- Prediction 6 (schema drift)
- Prediction 7 (coverage filter mechanism)

Results will be compared in `RESULTS.md` after the run completes.
