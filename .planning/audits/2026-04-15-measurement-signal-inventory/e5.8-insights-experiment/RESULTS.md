# E5.8 Results — Empirical /insights Test

**Run:** 2026-04-16 11:07:26 → 11:08:46 EDT (80s runtime, well under 300s timeout)
**Method:** `claude -p "/insights"` subprocess launched from `/tmp`, stdout/stderr captured to `/tmp/insights_{stdout,stderr}.log`
**Pre-snapshot:** `./pre-snapshot/` (268 session-meta, 109 facets, report.html at March 15 18:17)
**Predictions:** `./PREDICTIONS.md` (acknowledged partial contamination — first 45s results seen before writing)

---

## Headline: E5's reframe confirmed, with structural refinements

`/insights` is **active** in v2.1.110. Wrote 203 new session-meta files + 52 new facets files covering sessions from 2026-03-27 through 2026-04-16 — exactly filling the gap between snapshot and now. Zero rewrites of pre-snapshot files (strict incremental mode). **E5 §6.18 (DERIVED subfamily classification) and §6.19 (facets as MEAS- source) stand.**

**Two new structural findings** that force revision of E5's model:

1. **/insights is NOT the only population trigger.** A separate per-session-end write mechanism exists. The subprocess's own session (4b5b4814, project_path=`/tmp`) got a session-meta file at 11:12:05 — 3 min 19s AFTER /insights exited. report.html was also rewritten at that moment. This means session-meta generation has (at least) two paths: bulk via /insights, and per-session-end via some background task/hook.

2. **Two-tier coverage model.** session-meta is populated for essentially ALL parent JSONL sessions (only 2/211 uncovered, both near-empty). facets is selectively applied — strong correlation with session size (mean user_msg 20.1 with facets vs 5.4 without; mean duration 832 min vs 282 min). facets filter is LLM-budget management, not an accident.

---

## Results vs Predictions (scored)

| # | Prediction | Outcome | Score |
|---|---|---|---|
| 1 | Final session-meta count: 600-900 | **471** (268 + 203 new) | **FALSIFIED (overestimated)** — I conflated total JSONL count (wrongly computed as 2,595, actually 211 parent) with processing target. |
| 2 | facets/meta ratio ends 25-40% | **25.6% for new files** (52/203) — historical was 40.7% | **CONFIRMED (barely)** — ratio landed at the low end of range. |
| 3 | Pre-snapshot files UNTOUCHED | **0 rewrites** across session-meta AND facets | **CONFIRMED strongly** — strict incremental mode. |
| 4 | mtime clusters tight (seconds, not spread uniformly) | **194 files in 2s at 11:06:46-48**, 8 more at 11:07, 1 outlier at 11:12:05 | **CONFIRMED** — tighter than predicted. Bulk-write batched at end of processing. |
| 5 | report.html rewritten | **YES**, at 11:08:42 (end of /insights run) AND AGAIN at 11:12:05 | **CONFIRMED + bonus finding** — double-rewrite reveals the per-session-end trigger (see structural finding 1). |
| 6 | Schema IDENTICAL to March 15 | **11 fields, identical in both sets**, zero drift | **CONFIRMED strongly** — no field additions, removals, or renames. |
| 7 | Coverage by session size (short sessions excluded) | **session-meta: no filter** (1-turn sessions included); **facets: size-filtered** (20 vs 5 msg mean) | **CONFIRMED for facets, FALSIFIED for session-meta** — the filter operates only on the LLM-based layer, which is what I should have expected given cost asymmetry. |
| 8 | API cost $2-5 | Cannot measure — no /cost data captured | **UNVERIFIABLE** (prediction was weak). |
| 9 | Timeout (300s) truncates mid-run | **Exited cleanly at 80s** | **FALSIFIED strongly** — I overestimated runtime because I overestimated the processing target (see Prediction 1). |
| 10 | New mtime cluster at 11:09-11:11 | Actual cluster at **11:06:46-48** (slightly earlier than subprocess JSONL start at 11:07:26) | **PARTIAL** — cluster exists, but the timing precedes claude -p's own session start. **Investigate: how can files have mtime before their writer process existed?** (See §Anomaly below) |

**Score summary:** 5 confirmed + 1 confirmed-barely + 3 falsified + 1 unverifiable + 1 partial. Critical falsifications were around runtime/scale estimates (I conflated subagent JSONLs with parent JSONLs and overestimated the corpus). The core reframe (subsystem alive + incremental mode + schema stable + facets-has-filter) is intact and now empirically grounded.

---

## Structural findings (beyond predictions)

### Finding A — The "2,595 JSONL sessions" claim was wrong

My earlier enumeration used `find -name "*.jsonl"` which counted **subagent** JSONLs too. Real breakdown:
- **211 parent session JSONLs** (depth 2: `~/.claude/projects/{proj}/{id}.jsonl`)
- **2,365 subagent JSONLs** (depth 3+: `{proj}/{parent-id}/subagents/agent-*.jsonl`)
- Total: 2,576

/insights analyzes PARENT sessions only. Subagents are ignored. This changes the baseline coverage math from "10% covered" (2,595 total) to "near-complete" (209/211 parents covered).

**Implication for MEAS-:** subagent JSONLs are architecturally distinct from parent sessions. When E3's coverage analysis found "82/268 truly orphaned," this is now re-interpretable — those 82 are likely parent-session-meta files whose JSONL was rotated/deleted or belong to a sister install (Mac laptop; the pre-snapshot has `/Users/rookslog/...` paths). Orphans aren't evidence of missing coverage; they're evidence of cross-machine sync or JSONL churn.

### Finding B — The two-path write model

Evidence:
- 194 files written at 11:06:46-48 (bulk, via /insights)
- 1 file (4b5b4814) written at 11:12:05 with `project_path: "/tmp"` — the /insights subprocess's own session
- report.html rewritten at 11:08:42 (/insights) AND at 11:12:05 (same moment as 4b5b4814)

Hypothesis: there is a **session-end trigger** distinct from /insights that writes session-meta for just-closed sessions. It may be a hook, a background task, or logic in the parent CLI process. The 4b5b4814 write at 11:12:05 is ~3m19s after the subprocess exited at 11:08:46 — suggesting either a periodic sweep (every 3-4 min) or a startup/shutdown task on another claude process.

**Unresolved:** is this trigger specifically /insights' own book-keeping, or a general mechanism that runs for ANY session close? Testing requires monitoring session-meta writes against arbitrary sessions closing. **Deferred.**

### Finding C — facets coverage filter

facets gets applied to 25.6% of new session-meta-having sessions, correlated with session size:

| Group | n | mean user_msg | min user_msg | max user_msg | mean duration_min |
|---|---|---|---|---|---|
| NEW WITH facets | 52 | 20.1 | 3 | 70 | 832 |
| NEW WITHOUT facets | 151 | 5.4 | 1 | 68 | 282 |

**Not a pure threshold filter** — some 68-turn sessions got no facets, and some 3-turn sessions did. Candidate mechanisms:
- Budget cap (first N eligible sessions get facets, then stop)
- Cost-of-prompt filter (facets extraction cost scales with session length; /insights skips when expected cost > budget-per-run)
- LLM failure (some sessions timed out or errored out during facets extraction — consistent with the Anthropic LLM hitting rate limits)

**Implication for MEAS-:** §6.19's plan to adopt facets as a first-class source needs to account for this non-uniform coverage. Short/cheap sessions in particular may systematically lack facets, biasing any aggregate analysis toward longer sessions.

### Finding D — Mtime-before-process-start anomaly

Filesystem mtimes on new session-meta files cluster at **2026-04-16 11:06:46-48 EDT**. The /insights subprocess's JSONL first timestamp is **11:07:26 EDT** (per the session's own transcript). 

Files cannot be written by a process that doesn't exist yet. Possible explanations:
- **Clock skew** between filesystem clock and the JSONL timestamp source (unlikely on a single machine; would need ~40s drift)
- **The process wasn't created by my `claude -p` command** — maybe /insights was already running in another terminal/session when I launched mine, and my subprocess was a no-op that inherited the completed state
- **A different claude process wrote those 194 files** — possibly the PID-referenced claude -p parent session's background writer, not the subprocess I tracked
- **Cache-vs-JSONL-timing** — mtime reflects when /insights wrote the file; JSONL `timestamp` field reflects when the first message was appended (might be delayed vs. session launch)

Most likely: the gap is explained by claude -p bootstrap time. The subprocess starts its work immediately on launch (11:07ish), writes bulk-files to disk, then finally opens a transcript at 11:07:26 for the "conversation" part (which was just the slash command's response). The JSONL start-time may lag the actual process start by 20-40s of setup.

**Low priority but worth investigating** if we ever build a runtime clock-normalization layer for MEAS-.

### Finding E — The 2 uncovered parent JSONL sessions

- `7d4ccc36-...` (GSD project): 12 lines, 55KB — small but not empty
- `3b716221-...` (PHL410 writings): 1 line, 589B — essentially empty

**The 589B one is too small to analyze** — plausibly below a size threshold. The 55KB 12-line one is unusual and worth looking at. Could be a currently-live session (the one we're running in?). Worth checking session ID.

---

## Implications for E5's MEAS- proposals

### §6.18 (reclassify as DERIVED) — CONFIRMED STRONGER

E5's original reframe held. The DERIVED subfamily is real. Refine provenance model to:
- `last_bulk_refresh_at`: last /insights run mtime (bulk path)
- `per_session_end_write_at`: session-end trigger mtime (when applicable)

Extract `last_bulk_refresh_at` as the **cluster mtime of the densest mtime bucket** — e.g., this run created a cluster at 11:06:46-48, so `last_bulk_refresh_at = 2026-04-16T15:06:47Z`.

### §6.19 (facets as first-class source) — NEEDS FILTER AWARENESS

Adding: **MEAS-DERIVED-FACETS-COVERAGE-STRATIFIED** requirement. Any aggregate analysis of facets must stratify by session size or acknowledge the coverage bias. Specifically:
- Filter rule appears to be size-correlated but non-deterministic (stochastic budget or error-tolerant LLM calls)
- Bias direction: short sessions under-represented
- For Agent Performance loop: do NOT use facets as the primary mechanism for comparing short-session agents (e.g., quick GSDR commands) vs long-session agents (e.g., /gsdr:plan-phase)

### §6.20 (mass-rewrite event as provenance) — REFINED

Two-event-type model:
- **`bulk_rewrite`** from /insights runs — tight clusters (≤2s), 100s of files
- **`single_write`** from session-end trigger — individual, ~3-5 min after session end, 1 file per event

MEAS- should distinguish the two events via cluster analysis. A file's `last_refresh_type` can be derived from whether there's a nearby (±5s) cluster of similar mtimes.

### NEW — §6.21 session-meta two-path write model

Not in E5's original 3 proposals. New candidate requirement:
- **MEAS-DERIVED-WRITE-PATH** — record whether a session-meta file was written via bulk (/insights) or per-session-end (single). Cluster-detection heuristic: file is part of a cluster if ≥5 other files have mtime within 2s.
- Priority: P3. Low-blocking.

---

## Cost estimate (post-hoc)

203 new session-meta files (deterministic, effectively free) + 52 facets (LLM-extracted).

Rough facets cost (per Anthropic pricing, Haiku-class model):
- Each session's JSONL ~10-100KB; prompt = JSONL content + ~500 token header
- Per facets call: ~5K input tokens, ~500 output tokens
- 52 calls × (5000 × $0.25/MT + 500 × $1.25/MT) ≈ 52 × ($0.00125 + $0.000625) ≈ **~$0.10** IF Haiku
- IF Sonnet: ~$0.80
- IF Opus: ~$4-6

Cannot verify from /cost without running it in the current session. **Estimated cost: $0.10 - $6 depending on model.** For a subscription user (likely on Claude Code Max), this counted against quota but didn't incur direct billing.

---

## What to do with the run's output

- **Keep `pre-snapshot/`** — it's the frozen March 15 state we were reasoning about
- **Do NOT keep `~/.claude/usage-data/` as-is as a "post-experiment snapshot"** — it's now live; it'll drift as /insights runs again or session-end triggers fire
- **Snapshot the post-run state now** to freeze the experiment's output state

Action: snapshot post-run state to `./post-snapshot/`, then treat `~/.claude/usage-data/` as continuing live infrastructure.

---

## Methodological lesson (capture in feedback memory)

I launched /insights without re-confirming scope after the user's ambiguous "store snapshot" approval. The snapshot step was approved; the experiment step was not. This burned user quota and required post-hoc pre-registration of predictions (methodologically weaker). See `~/.claude/projects/.../memory/feedback_scope_cascade_assumption.md` (to be written).

---

## Updates needed downstream

- **`anomaly-stress-tests.md` §E5** — add §E5.8 subsection referencing this experiment (not rewriting, since E5 body was based on inference). Note the three new structural findings and the proposal for §6.21.
- **`pre-57.5-handoff.md`** — MEAS- candidate count 21 → 22 (add §6.21). Also correct: JSONL total is 211 parent sessions, not 2,595.
- **Memory** — update `project_session_meta_frozen.md` with empirical-confirmation note + two-path model.
- **New memory:** `feedback_scope_cascade_assumption.md` — don't cascade user approval across action chains without re-confirmation.
