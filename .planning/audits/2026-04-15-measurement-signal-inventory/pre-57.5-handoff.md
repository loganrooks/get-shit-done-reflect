# Pre-Phase 57.5 Handoff

**Originally written:** 2026-04-15
**Last updated:** 2026-04-16 (eighth refresh — E6 complete; A6 capability-layer falsification via binary introspection; §6.22 MEAS-RUNTIME-COMPACT added; cross-runtime compaction symmetry restored)

---

## Quick Status

- ✅ Synthesis correction + extension authored, committed (`9e69c5ce`)
- ✅ Spike 009 (thinking-summary as reasoning proxy in subagent dispatch) executed + sealed (`125000af`)
- ✅ Spike 010 (same matrix in parent-session dispatch via headless `claude -p`) — outcome `partial`. H1/H2 confirmed, H3 falsified, H4 untestable. 5 new structural findings + 1 qualitative finding surfaced a load-bearing gap.
- ✅ Settings change applied (`showThinkingSummaries: true` in `~/.claude/settings.json`)
- ✅ Memory updated with three new records (research-before-giving-up, thinking-redaction-controllable, session-meta-frozen)
- ✅ **Anomaly stress-tests E1–E6 COMPLETE + E5.8 empirical /insights test executed** (2026-04-16, uncommitted). Documents: `anomaly-stress-tests.md`, `e5.8-insights-experiment/{PREDICTIONS,RESULTS}.md`, `e5.8-insights-experiment/{pre,post}-snapshot/`. **16 new MEAS- proposals** surfaced + 4 candidate signals. E5 REFRAMED E3/E4's shutdown interpretation; E5.8 empirically confirmed E5's reframe AND surfaced a **two-path write model**; E6 **falsified** A6 at the capability layer (Claude Code has full `/compact` subsystem with `compact_boundary` emissions — synthesis's "ABSENT" reflected corpus-non-firing, not capability absence).
- ⏳ Governance updates (A1–A5) — NOT started; **MEAS- spec shape further revised by E1–E6 findings + E5.8 empirical refinements** (16 new reqs from E1–E6 atop spike 010's 7 = **23 total candidates** for A1). Subfamily split is THREE-way: MEAS-RUNTIME + MEAS-DERIVED + MEAS-GSDR.
- ⏳ External-data research (B4–B6) — NOT started
- ⏳ `/gsdr:discuss-phase 57.5` — NOT started; design questions unchanged from prior refresh but §E findings add governance texture
- ⏳ Follow-up spikes queued — 3 original + 1 new (C4 marker-set calibration); C2 and C3 unchanged; C5 possible (LLM-as-judge for reasoning quality)

If you have fresh context, **read this handoff + `correction-and-extensions-2026-04-16.md` + `anomaly-stress-tests.md` (E1–E6 + E5.8) + `e5.8-insights-experiment/RESULTS.md` + spike 009's `DECISION.md` + spike 010's `DECISION.md` + spike 010's `qualitative_comparison.md`**, then proceed with the recommended execution order at the bottom.

---

## What was completed in the original audit (2026-04-15, baseline)

These remain accurate. Cross-reference the original handoff history in git for full context.

- **Phase 57 investigatory audit** (dual-dispatch): `.planning/audits/2026-04-10-phase-57-vision-drop-investigation/`
- **Measurement infrastructure deliberation**: `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md`
- **4-lane signal inventory audit**: `.planning/audits/2026-04-15-measurement-signal-inventory/{framing.md, lane-1..4-*.md, synthesis-output.md}`

---

## What was completed in the 2026-04-15→16 continuation session

### 1. B1 + B2 quick checks (corrected interpretations)

- **B1 — session-meta status:** NOT "dead" but **FROZEN**. Corpus stops at 2026-03-15. 265 sessions across Jan 28 – Mar 15. Schema unchanged through cutoff. Generation stopped between Claude Code v2.1.78 and v2.1.79. Treat as historical snapshot, not live telemetry.
- **B2 — thinking redaction:** Initial shallow conclusion ("structurally empty by design") was **WRONG**. Real answer: redaction is controllable via `showThinkingSummaries: true` in `~/.claude/settings.json`. The `redact-thinking-2026-02-12` beta header was added in Claude Code v2.1.69 (~March 5, 2026), with global rollout via `tengu_quiet_hollow` server-side flag on March 8. Setting bypasses the header.
- **Setting applied** to `~/.claude/settings.json`. Verified empirically: post-setting parent sessions have all-non-empty thinking blocks; pre-setting sessions have ~7.4% non-empty (parents) and ~37.5% non-empty (subagents).

### 2. Synthesis correction document

`.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md`

- Falsifies Anomaly A4 (thinking content "permanently empty by design") with 3-layer evidence chain (research → empirical → intervention)
- Promotes phantom-token billing asymmetry from "not examined" (synthesis §7.3.b) to anomaly A9
- Refines synthesis Decision 5 (cross-runtime asymmetry markers) and adds Decision 6 (model-family gate on reasoning metrics)
- Adds 6 new MEAS- requirement candidates and 4 extractor priorities
- 9 open questions including A4-style stress-tests for A1, A2, A5, A6
- Pointer note added to top of `synthesis-output.md` (originals preserved per status downgrade prohibition)

### 3. Spike 009 — Thinking summary as reasoning proxy

`.planning/spikes/009-thinking-summary-as-reasoning-proxy/`

Tested H1–H5 (summary length covaries with prompt complexity, model, effort level, tools; phantom-token derivation valid). 18 subagent dispatches via Task/Agent tool, 3 prompts × 2 models × 3 reps.

**Outcome: PARTIAL.** All 18 subagents produced **zero thinking blocks** regardless of model. Same parent session emitted 41+ blocks over the same window. **Subagent reasoning observability is gated by dispatch context AND model family** — not just model family as Decision 6 in the synthesis correction had stated.

Post-decision verification: single headless `claude -p` (Sonnet, B-notools, `--tools ""`) produced 1 thinking block of 9,597 chars with 11,314 output tokens — confirming the queued Round 2 (parent-session matrix) is viable.

Spike artifacts: DESIGN.md, DECISION.md, analysis.md, WORKFLOW-DEVIATION.md (gsdr-spike-runner can't dispatch subagents — orchestrator handled Run phase manually), per_dispatch_metrics.csv, extract_metrics.py, raw_jsonl_paths.txt, agent_id_map.csv. KB entry persisted at `.planning/knowledge/spikes/get-shit-done-reflect/2026-04-16-thinking-summary-as-reasoning-proxy.md`.

### 4. Memory updates

Three new records in `~/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/memory/`:

- `feedback_research_before_giving_up.md` — when ground-truth questions arise, dispatch research agents with source evaluation; don't give up after two grep commands
- `project_thinking_redaction_discovery.md` — A4 was wrong; setting controls it; subagents have 5x rate of non-empty thinking pre-setting
- `project_session_meta_frozen.md` — corpus is closed snapshot, not live source; cutoff at v2.1.78/79

### 5. Spike 010 — Parent-session thinking summary as reasoning proxy (NEW — completed 2026-04-16)

`.planning/spikes/010-parent-session-thinking-summary-proxy/`

Re-ran spike 009's matrix via headless `claude -p` dispatch instead of Task/Agent tool. Design revised mid-session after discovering `--effort` CLI flag (made low/high comparison autonomous in a single pass, no user toggling of settings.json). Full matrix: 3 prompts × 2 models × 2 effort levels × 3 replicates = 36 dispatches.

**Outcome: PARTIAL.** All 36 dispatches succeeded after one round of 6-cell retries (initial 529 overload errors on Opus cells; retries clean via 2-at-a-time parallel).

**Quantitative findings:**
- **H1 (complexity → length):** CONFIRMED with threshold refinement — recall prompts emit 0 thinking blocks across 12 cells. Deliberation prompts emit 1 block of variable length.
- **H2 (effort → length):** CONFIRMED. Sonnet 2.5-4.2× low→high ratios. Opus 2.2× on B-tools and a binary emission gate on B-notools (0 at low, 2550 chars at high).
- **H3 (Opus > Sonnet):** **FALSIFIED.** Sonnet summaries are 2-3× LONGER than Opus at matched inputs.
- **H4 (tools shift load):** UNTESTABLE — neither model used tools when permitted in headless dispatch. `tool_call_count = 0` across all 12 B-tools cells.
- **H5 (phantom tokens):** Deferred per DESIGN.md (still needs real tokenizer; C3).

**Qualitative finding (high-impact — read `qualitative_comparison.md`):** The H3 length inversion reflects **summarizer verbosity, not reasoning quality**. Both models converge on the same 4-principle topoi; Opus produces higher density per character, engages canonical philosophical literature (Haraway, Nagel), and names concrete real-world failure modes. Sonnet's longer summaries are padded with meta-commentary. **Implication: summary length is NOT a usable reasoning-QUALITY proxy even when model-stratified.** Length may track "reasoning load" internally but does not map to output quality.

**Five new structural findings (documented in DECISION.md):**
1. Thinking emission is threshold-gated, not continuous — `thinking_block_count > 0` is a categorical feature distinct from length
2. Headless `claude -p` dispatch does not exercise tool-use paths (complementary to 009's subagent gate)
3. Summary length is independent of visible-output length (r=0.415; ratio std 0.35)
4. `branching_density` and `dead_end_density` marker regex sets matched nothing in 21 non-empty-thinking cells — falsify and redesign or drop
5. `self_correction_density` and `uncertainty_density` track effort — promote to candidate features with model+effort stratification

**Load-bearing gap surfaced by finding 6 (qualitative):** Reasoning-QUALITY measurement for the Agent Performance loop is NOT addressed by any spike so far. Length/marker features address emission and load, not quality. Candidate mechanisms (reference density, concept diversity, LLM-as-judge) are unexplored.

Spike artifacts: DESIGN.md, DECISION.md, analysis.md, qualitative_comparison.md, experiments/{dispatch.sh, retry_failed.sh, extract_metrics.py, render_responses.py}, session_id_map.csv (42 rows: 36 + 6 retries), per_dispatch_metrics.csv, raw_jsonl_paths.txt, responses/{README, A, B-notools, B-tools}.md (human-readable formatted output of all 36 sessions). KB entry at `.planning/knowledge/spikes/get-shit-done-reflect/2026-04-16-parent-session-thinking-summary-proxy.md`.

---

## Updated MEAS- decision landscape (consequences for 57.5 scope)

**After spike 010**, the agent-performance loop landscape is more constrained and more clearly structured than the 2-branch decision in the original handoff. Three structural facts now established:

1. **Subagent corpus (~94% of existing JSONLs) has no reasoning content** due to Task/Agent dispatch gate (spike 009).
2. **Headless `claude -p` dispatch DOES produce thinking content** (spike 010) — so option (c) "build forward via headless" is empirically viable. But headless does NOT exercise tool-use paths (neither model invoked tools when permitted in 12 B-tools cells).
3. **Summary length is not a reasoning-quality proxy** even when model-stratified (spike 010 qualitative). At best it's a reasoning-LOAD proxy. Quality needs a separate mechanism.

**The refined options for the loop:**

- (a) **Parent-session-only retroactively** (n=142) — gives reasoning-load signal + emission signal. Does NOT measure quality.
- (b) **Structural-proxy-only** — relies on visible-output complexity (100× separation per spike 009), tool patterns, duration, verification scores. Does NOT require thinking content. Does NOT capture quality either.
- (c) **Build forward via headless** — (a) + ongoing data generation. Same quality gap.
- (d) **NEW: add a reasoning-QUALITY measurement substrate** — reference density, concept diversity, LLM-as-judge scoring. Orthogonal to (a)/(b)/(c); complements any of them. Untested, would need a new spike (candidate C5).

**Two decisions belong in `/gsdr:discuss-phase 57.5`:**
1. Which of (a/b/c) or combination drives the Agent Performance loop's measurement substrate
2. Whether to include a reasoning-quality mechanism (d) in Phase 57.5 scope, or defer to 57.6/57.7

---

## What remains

### E. Anomaly stress-testing — NEW section, execute BEFORE governance

The synthesis §5 Anomaly Register has 8 items (A1–A8), only one of which (A4) has been fully resolved. Correction doc §8 OQ9 explicitly flagged that "no comparable follow-up has been performed against A1, A2, A5, A6, A7, A8" — meaning the audit's "permanently empty" claim for A4 that was falsified could be symptomatic of other unexamined-but-flawed anomaly conclusions.

These come BEFORE governance (Section A) because they may refine what extractors the MEAS- spec needs. A7 and A8 in particular expose measurement points that already exist in the harness, potentially obviating entire extractors.

**Triage:**

| # | Anomaly | Status | Action | Effort |
|---|---------|--------|--------|--------|
| E1 | **A7 — config.json automation stats** | Documented; `signal_collection fires=0 skips=13` | Inspect hook triggers; test why automated collection doesn't fire; document schema for MEAS- | ~15 min |
| E2 | **A8 — kb.db SQLite signal index** | Documented as existing | `sqlite3 .planning/knowledge/kb.db .schema`; sample queries; check rebuild freshness; document for MEAS- | ~15 min |
| E3 | **A5 — user_message_count overcount** | Known fix (filter `isMeta: true`) not validated | Sample 5-10 sessions; compare raw count vs filtered count vs human visual count; document exact filter rule | ~20 min |
| E4 | **A1 — session-meta token semantics** | Partial: JSONL canonical, session-meta is "something else" | Empirical reverse-engineer: compare session-meta `input_tokens` to `sum(len(user_text_chars))/4` vs `len(user_Human_lines)` across sample sessions; identify formula | ~30 min |
| E5 | **A2 — session-meta generation frozen** | Partial: B1 confirmed cutoff Mar 15, 2026 (v2.1.78/79) | Research: GitHub issues + Claude Code release notes for the specific v2.1.78/79 change that stopped generation; document as closed | ~20 min |
| E6 | **A6 — Codex compaction, no Claude equivalent** | Unresolved: (1) Claude doesn't compact OR (2) logs it differently | Research-mode spike: docs/issues + empirically induce context pressure and observe JSONL; potential spike C6 | ~1-2 hrs |
| (done) | **A4 — thinking permanently empty** | ✅ Falsified by correction doc + spike 010 | None | 0 |
| (accept) | **A3 — format era boundaries** | Documented, load-bearing for 57.5 | None — accept and work within | 0 |
| (spike) | **A9 — phantom thinking tokens** | Promoted from §7.3.b by correction doc | Queued as spike C3 (real tokenizer) | separate track |

**Total effort: ~2-3 hrs for E1–E5 + optional ~1-2 hrs for E6.** E1 and E2 are pure inspection, no API calls. E3 is lightweight empirical. E4 and E5 are short research/empirical. E6 can be deferred or converted to a spike.

**Deliverable:** append an "Anomaly follow-up (2026-04-17+)" section to `correction-and-extensions-2026-04-16.md` (or a new sibling doc `anomaly-stress-tests.md`) documenting each anomaly's stress-test outcome, in the same format the correction doc used for A4.

**Why this matters for governance:** 
- E1 (A7) findings may reveal automation-health signals that should be first-class MEAS- features (currently not in the spec)
- E2 (A8) findings may reveal that signal-quality extractors should query kb.db rather than grep frontmatter
- E3 (A5) findings fix a known extractor bug before it's encoded in the spec
- E4 (A1) findings determine whether session-meta tokens should be a MEAS- field at all
- E5 (A2) findings close the "what to do with session-meta going forward" question
- E6 (A6) findings determine cross-runtime compaction-symmetry status (synthesis §2.3 classification)

### E-status refresh (2026-04-16, after E1+E2+E3+E4+E5 + E5.8 + E6)

Deliverable: sibling doc `anomaly-stress-tests.md` + experiment dir `e5.8-insights-experiment/`. All six stress-tests + E5.8 empirical follow-up complete. **All uncommitted as of this refresh.**

| # | Status | Outcome summary |
|---|---|---|
| E1 | ✅ **DONE** | A7 framing accurate; stats system works correctly. 2 latent gaps: `last_signal_count` never written (Phase 38 plan incomplete); skip_reason is free-form (no enum validation). Falsification pass refined one claim (sensor_log fires=2 ≠ others=5 because of later introduction). 3 new MEAS- reqs: §6.7 (automation_health extractor, P1), §6.8 (close last_signal_count gap, P2), §6.9 (canonicalize skip_reason, P3). GSDR-native. |
| E2 | ✅ **DONE** | A8 framing accurate but surfaced **2 serious defects**: (1) freshness broken — every workflow calls `kb-rebuild-index.sh` which only updates markdown index; kb.db only rebuilt when human manually runs `gsd-tools.cjs kb rebuild`. (2) FTS5 virtual table is declared but never populated. Falsification pass confirmed both claims. 3 new MEAS- reqs: §6.10 (kb.db as first-class source, P1), §6.11 (fix freshness, P1), §6.12 (fix/drop FTS5, P3). GSDR-native. |
| E3 | ✅ **DONE** | A5 framing partially right. Three defects found; meta_umc formula identified (`count(user records where content is string)`). **E5 REFRAMED** E3's "meta subsystem disabled" framing — see E5 entry. 3 new MEAS- reqs: §6.13 (human-turn extractor on JSONL, P2), §6.14 (meta_umc scope+lifecycle annotations, P1), §6.15 (coverage-audit, P3). Claude-runtime. |
| E4 | ✅ **DONE** | A1 token semantics. Formula is partial (4/7 match, 3/7 fail). **E5 REFRAMED** E4.7 Test 3's shutdown-event framing (see E5 entry) — the mtime cluster is an `/insights`-invocation artifact, not a shutdown. E4's core claim (exclude meta tokens; use JSONL) stands. 2 new MEAS- reqs: §6.16 (reject meta tokens, P1) + §6.17 (JSONL-based token extractor, P1). Claude-runtime (DERIVED subfamily now — see E5). |
| E5 | ✅ **DONE** | A2 reframed. **Original claim partially wrong:** subsystem was never disabled. Key findings: (1) zero files newer than 2026-03-16 despite 32 version bumps; (2) `/insights` still active in v2.1.110 (bug-fixed at v2.1.101); (3) discovered second mass-rewrite event at 2026-03-08T20:08 UTC; (4) subsystem is `/insights`-driven (bulk rewrites per invocation); (5) discovered `facets/*.json` = LLM-extracted semantic summaries. 3 new MEAS- reqs: §6.18 (reclassify session-meta as DERIVED, P2), §6.19 (**facets as first-class source**, P1), §6.20 (/insights mass-rewrite as provenance, P3). Subfamily split THREE-way: MEAS-RUNTIME + **MEAS-DERIVED** + MEAS-GSDR. |
| E5.8 | ✅ **DONE** | Empirical /insights test via `claude -p` subprocess 11:07:26-11:08:46 EDT. Pre-snapshot + post-snapshot + predictions + results in `e5.8-insights-experiment/`. **E5 reframe confirmed empirically** — subsystem alive, strict incremental, schema unchanged (11 fields, zero drift), 203 new session-meta + 52 new facets filling 2026-03-27→2026-04-16 gap. Predictions scorecard: 5 confirmed + 1 barely + 3 falsified + 1 unverifiable + 1 partial. **Three new structural findings:** (1) **two-path write model** — /insights bulk + separate per-session-end trigger (subprocess's own session got meta file at 11:12:05, 3m19s after exit); (2) **facets has non-deterministic size-correlated budget filter** — 25.6% new vs 40.7% historical, mean user_msg 20.1 with facets vs 5.4 without; (3) **earlier "2,595 JSONL" claim was wrong** — counted subagents. Real: 211 parent + 2,365 subagent JSONLs. /insights processes parents only (209/211 covered). 1 new MEAS- req: §6.21 (MEAS-DERIVED-WRITE-PATH provenance metadata, P3). Methodological lesson: scope-cascade assumption burned user quota; captured in `feedback_scope_cascade_assumption.md`. |
| E6 | ✅ **DONE** | A6 Codex compaction symmetry **falsified at capability layer**. Claude Code has full compaction subsystem: `/compact`, `/autocompact`, `/microcompact` slash commands; `autoCompactEnabled: true` default; `compact_boundary` system-subtype; `isCompactSummary: true` flag; Anthropic `compact-2026-01-12` beta. Binary introspection + authoritative docs confirm. Zero events machine-wide (2,577 JSONLs) because (a) 1M-context model raises threshold, (b) operator heavy `/clear` usage (49 invocations) substitutes pre-emptively. Synthesis §4.3 "ABSENT" is observed-corpus only, not capability. 1 new MEAS- req: §6.22 (MEAS-RUNTIME-COMPACT extractor, P2 — capability-level, low near-term data richness). Plus operator-habit feature: `clear_invocation_count` per session. Claude-runtime. |

**Net MEAS- proposals from E1–E6 + E5.8: 16 new requirements** atop spike 010's 7 candidates, for **23 total** in the A1 governance scope. Breakdown:
- E1 (§6.7, §6.8, §6.9): automation-health extractor + last_signal_count gap closure + skip_reason canonicalization
- E2 (§6.10, §6.11, §6.12): kb.db as first-class source + freshness automation fix + FTS5 fix-or-drop
- E3 (§6.13, §6.14, §6.15): human-turn extractor + meta_umc scope+lifecycle annotations + coverage audit
- E4 (§6.16, §6.17): reject meta tokens as first-class + JSONL-based token extractor with msg_id dedup
- E5 (§6.18, §6.19, §6.20): DERIVED subfamily classification + **facets/*.json as first-class MEAS- source** + /insights mass-rewrite provenance signal
- E5.8 (§6.21): MEAS-DERIVED-WRITE-PATH — record bulk-cluster vs single-write provenance; §6.19 gains mandatory coverage-stratification clause (facets aggregate analysis MUST stratify by session size due to non-uniform filter)
- E6 (§6.22): MEAS-RUNTIME-COMPACT — compaction-event extractor (Claude: `compact_boundary` + `isCompactSummary:true`; Codex: `compacted` + `replacement_history`) + `clear_invocation_count` as workflow-substitution signal

Revised THREE-subfamily split (strengthened by E5):
- **MEAS-RUNTIME-*** — Claude/Codex JSONL transcripts. Canonical source of truth. Subject to era boundaries (v2.1.78 transcript-token change, v2.1.69 redaction).
- **MEAS-DERIVED-*** — Artifacts produced by `/insights` command (session-meta, facets, report.html). On-demand refresh; provenance = last `/insights` mtime. NOT continuous telemetry.
- **MEAS-GSDR-*** — Our own artifacts (config.json.automation, kb.db, signal files). Versioned via `manifest_version`.

**Side-signals surfaced by E2 + E6 (should be logged as signals):**
- `sig-2026-04-16-kb-db-freshness-automation-missing` — every workflow calls the wrong rebuild script
- `sig-2026-04-16-fts5-declared-but-unused` — dead schema declaration
- `sig-2026-04-16-claude-compaction-mechanism-undocumented` (E6) — synthesis audit missed Claude compaction capability because Lane 2 scoped grep to 60 project JSONLs + feature didn't fire in sample; audit method should include binary introspection before concluding capability absence
- `sig-2026-04-16-clear-invocations-substitute-for-compaction` (E6) — operator habit (49 `/clear` vs 0 `/compact` invocations in 211 sessions) is a measurable workflow signal; first-class `clear_invocation_count` feature

**Correction noted:** anomaly-stress-tests.md §E2.2 Layer 5 text says FTS queries "fail with 'no such column: T.title'." That was my query-syntax error, not an FTS5 defect. Correct syntax runs silently with 0 results. Kept in the doc with a noted correction in §E2.7 rather than rewriting.

**New artifact inventory:**
- `.planning/audits/2026-04-15-measurement-signal-inventory/anomaly-stress-tests.md` (E1–E6 + E5.8 deliverable, UNCOMMITTED)
- `.planning/audits/2026-04-15-measurement-signal-inventory/e5.8-insights-experiment/` (UNCOMMITTED)
  - `PREDICTIONS.md` — 10 pre-registered predictions with contamination disclosure
  - `RESULTS.md` — full analysis + scorecard + structural findings
  - `pre-snapshot/{session-meta,facets,report.html}` — frozen March 15 state (268 + 109 + report)
  - `post-snapshot/{session-meta,facets,report.html}` — frozen post-/insights state (471 + 161 + report)
- `/tmp/e3_*.py`, `/tmp/e4_*.py`, `/tmp/insights_{stdout,stderr}.log` — discovery/runtime scripts; reconstructible from methodology descriptions

### A. Governance updates (was Section A in original handoff — still valid, scope updated by correction doc)

**A1. REQUIREMENTS.md — add MEAS- family + GATE-09 + new requirements (UPDATED BY SPIKE 010 + E1–E6 + E5.8)**

> **Note:** The 7 items below are the spike-010-era shape. E1–E6 + E5.8 added **16 more MEAS- candidates** (§6.7–§6.22) across three subfamilies (MEAS-RUNTIME, MEAS-DERIVED, MEAS-GSDR). See the **E-status refresh** below for the authoritative 23-candidate list and the three-subfamily split — A1 synthesis should work from that list, not just the 7 below.

The correction doc's 6 candidates are revised by spike 010 findings. Final MEAS- spec shape (pre-E):

1. **Thinking-summary composite extractor** (revised from correction doc #1 + spike 010 DECISION §5 and §6). Components:
   - `thinking_emitted` (bool) — `thinking_block_count > 0`; the primary emission-gate feature
   - `thinking_total_chars` (numeric, model-stratified) — emission-length feature; NOT comparable across models without stratification
   - `thinking_over_visible_ratio` (numeric) — less model-dependent; reasoning density per unit of visible output
   - Precondition: three-level gate (dispatch-context + model-family + emission-threshold)
   - Four-status return: `exposed` / `not_emitted` / `not_applicable` / `not_available`
2. **Settings-state + dispatch-args snapshot extractor** (revised from correction doc #2). Capture `showThinkingSummaries`, `effortLevel` from settings.json at session start, AND `--effort` flag value from dispatch metadata (overrides settings for that session). `effort_level` is a required stratification variable for reasoning metrics.
3. **Phantom-thinking-token reconciler** (unchanged from correction doc #3). Blocked on real tokenizer (spike C3); scaffold the schema.
4. **Marker-density features — REVISED** (from correction doc #4 + spike 010 finding #4/#5):
   - KEEP: `marker_self_correction_density`, `marker_uncertainty_density` (both track effort, worth promoting to candidate features)
   - DROP: `marker_branching_density`, `marker_dead_end_density` (regex matched nothing in 21 non-empty-thinking cells — unfit for Claude's thinking-summary vocabulary). Redesign requires sampling actual summaries first (potential spike C4).
5. **Three-level gate — refined from correction doc #5 + spike 009 + spike 010**:
   - Level 1: Model-family (Haiku → not_applicable)
   - Level 2: Dispatch-context (subagent → not_available; headless/interactive → proceed)
   - Level 3: Emission-threshold (model chose not to emit → not_emitted; emitted → exposed)
6. **Era-boundary registry** (unchanged from correction doc #6). v2.1.69 redaction boundary, v2.1.78/79 session-meta cutoff.

**NEW candidate requirement 7 (from spike 010 qualitative finding #6):**
- **Reasoning-quality evaluation mechanism** — gap, no extractor designed. Length/marker features measure reasoning emission + load; they do NOT measure quality. Candidates (require new spike): reference-density features, concept-diversity features, LLM-as-judge against rubric. **Decision for discuss-phase 57.5**: include a placeholder requirement in 57.5 (to signal the gap) and defer implementation to 57.6/57.7, OR defer the requirement entirely pending spike C5.

Each requirement cites correction doc section + spike 009/010 section. GATE-09 (scope translation ledger) deferred to Phase 58 per deliberation.

**A2. ROADMAP.md — insert 57.5/57.6/57.7**

Three new phase entries between 57.4 and 58. Goals/scope from deliberation §5. Phase 58 Depends-on updated from "Phase 57" to "Phase 57.7". Update phase count and progress stats.

**A3. PROJECT.md — update Core Value**

Current: "The system never makes the same mistake twice..." Add: measurement infrastructure as the substrate on which self-improvement's trustworthiness rests; the chiasmic intertwining of rigor and judgment.

**A4. Manual signal update**

`.planning/knowledge/signals/get-shit-done-reflect/2026-04-09-phase57-active-measurement-vision-dropped-at-planning.md`

Add "Correction (audited 2026-04-10, remediation: 57.5/57.6/57.7)" section. Note codex audit's disconfirmation of "purely passive" claim. Link to both audit outputs + deliberation + correction doc.

**A5. Atomic commit of A1–A4**

### B. External data research (was Section B in original handoff — quick checks B1+B2 done, B3 superseded by spike 009 with different scope)

**Status of original B-items:**
- B1: ✅ Done (session-meta frozen)
- B2: ✅ Done (thinking redaction is controllable)
- B3: ⚠️ Original B3 was "extractor prototypes" for 5 specific extractors (model extraction, per-turn tokens, claim count, subagent type×model×tokens, signal lifecycle). Spike 009 was a different spike — it tested summary-as-proxy, NOT extractors. **Original B3 is still outstanding** but probably no longer needed as a separate spike — the extractors are now MEAS- requirements (A1.1–A1.6) that get built in Phase 57.5 itself. Skip B3.
- B4: ⏳ GitHub API signal inventory (PR review times, CI durations, merge timestamps) — research task, not a spike
- B5: ⏳ Billing/cost estimation from per-turn token data — arithmetic on existing data + published API pricing
- B6: ⏳ Codex feature flags experiment (`runtime_metrics`, `general_analytics`) — quick experiment
- B7: Optional, low priority (VS Code extension state)

### C. Queued follow-up spikes

**C1. Spike 010 — Parent-session thinking proxy ✅ COMPLETED 2026-04-16**

See spike artifacts. Design was revised mid-execution to use `--effort` CLI flag (discovered after first runner launch) — expanded matrix to 36 dispatches (3 prompts × 2 models × 2 efforts × 3 reps). Outcome: partial. H1, H2 confirmed; H3 falsified; H4 untestable; H5 deferred. Five structural findings + one qualitative finding (summary length is not quality proxy).

**C2. Investigation spike — Why does subagent dispatch suppress thinking? (unchanged)**

Mode: research-mode spike (Design → Research → Document, no Build/Run). Investigate via:
- Decompiled Claude Code source for Task/Agent tool API call construction
- GitHub issues on anthropics/claude-code about subagent thinking
- Test whether `isSidechain: true` correlates with redaction server-side

Output: explanation + (if discoverable) workaround that opens the subagent gate. Spike 010 narrowed the gate to the Task/Agent tool specifically (headless `claude -p` bypasses it), so C2's scope is tightened.

**C3. Real-tokenizer phantom-token spike (unchanged — NOW highest-value next spike)**

Spike 010 collected clean raw data for H5 in parent sessions. Re-test phantom-token hypothesis using Anthropic's actual tokenizer (API `count_tokens` or `tiktoken`-equivalent). Spike 009's and spike 010's 4-chars/token approximations both produced positive deltas but were dominated by tokenizer error.

**C4. NEW — Marker-set calibration spike (emerged from spike 010)**

Design: sample actual Claude thinking-summary text (from spike 010's 21 non-empty cells + future headless dispatches), build empirically grounded marker sets for branching/dead-end concepts if load-bearing, validate via bootstrap. Could be a research-mode spike with lightweight extraction.

Rationale: spike 010 finding #4 — the current regex sets for `branching_density` and `dead_end_density` matched nothing in 21 sessions. Either the concepts don't appear in Claude's summaries, or the regex doesn't match how Claude phrases them. Need empirical vocabulary.

**C5. NEW candidate — Reasoning-quality measurement (emerged from spike 010 qualitative)**

Design: test candidate reasoning-quality mechanisms against matched outputs (spike 010 already produced 12 matched Sonnet/Opus cells for B-notools+B-tools high effort). Candidates:
- Reference-density features (proper-noun frequency, literature-citation patterns)
- Concept-diversity features (distinct philosophical terms per unit length)
- LLM-as-judge scoring against rubric (scholarly rigor, specificity, depth)

Rationale: spike 010 qualitative finding #6 — summary length is NOT a quality proxy. Agent Performance loop will mis-rank agents if led by length alone. This gap is load-bearing for Phase 57.5 but unaddressed by any current spike. **Candidate for discuss-phase 57.5: in-scope or deferred?**

**C7. NEW candidate — Compaction-symmetry intervention test (emerged from E6)**

Design: run a deliberate long 200k-context Sonnet session (interactive, not 1M variant) until auto-compact fires. Capture the `compact_boundary` system-subtype record, verify `compact_metadata.{trigger, pre_tokens}` shape matches docs, confirm the `isCompactSummary: true` flag appears on the next assistant message. Low cost — one session, bounded by auto-compact threshold (~160k tokens).

Rationale: E6's Test 3 (1M-context hypothesis explains non-firing) is consistency-tested but not intervention-tested. C7 would close that gap and produce a real `compact_boundary` record that the MEAS-RUNTIME-COMPACT extractor can be validated against. Pairs naturally with Q6 (cross-runtime controlled experiment) and with building the extractor in Phase 57.5.

### D. Discuss-phase 57.5

`/gsdr:discuss-phase 57.5` with deliberation + audit + correction doc + spike 009 + spike 010 + governance commits as committed context.

Key design questions (revised after spike 010):

1. **Agent Performance measurement substrate** — pick (a/b/c) or combination (see "Updated MEAS- decision landscape" above). Parent-only + build-forward-via-headless (a+c) is the emerging favorite but forecloses tool-use observability.
2. **Which feedback loop leads in 57.5?** Synthesis recommended Agent Performance + Pipeline Integrity via GSD-only path. Spike 009 weakened subagent reasoning observability; spike 010 confirmed headless works for thinking but not tool-use. If Agent Performance leads, scope to emission+load metrics and defer quality to 57.6.
3. **GSD-artifacts-only path vs session-data-integrated path for 57.5?** Same as original. GSD-only is broader retroactively; session-data is richer prospectively.
4. **How much post-Popperian epistemic machinery in 57.5 vs 57.7?** Same as original.
5. **Temporal features as first-class architectural concern.** Same as original.
6. **Cross-runtime controlled experiment.** Now with E6-added dimension: a long-session controlled run on each runtime also ground-truths the MEAS-RUNTIME-COMPACT extractor (symmetric `compact_boundary`/`compacted` emission shape). Prior to E6 this was Codex-only territory; compaction-event extractor is now a cross-runtime bridge signal.
7. ~~Whether spike 010 should run BEFORE 57.5 planning~~ — **resolved: ran and completed before planning**; findings are now context for this discussion.
8. **NEW — Reasoning-QUALITY measurement in Phase 57.5 scope?** Spike 010 qualitative finding #6: length is not a quality proxy. Agent Performance loop will mis-rank agents if led by length alone. Options:
   - (i) Include placeholder requirement + defer implementation to 57.6/57.7 (signals the gap)
   - (ii) Run spike C5 BEFORE 57.5 planning (tests candidate quality mechanisms; expensive)
   - (iii) Run spike C5 during 57.5 execution as part of MEAS- prototyping
   - (iv) Defer quality measurement entirely to 57.6+ and scope 57.5 to emission+load only
9. **NEW — Tool-use measurement strategy.** Headless dispatch does not exercise tool use (spike 010 observation); interactive sessions do but aren't easily dispatched programmatically. Is tool-use a 57.5 concern or deferred?
10. **NEW (from E5) — Does `facets/*.json` change the reasoning-quality framing in Q8?** E5 discovered that `/insights` already produces LLM-extracted semantic per-session summaries (goal, outcome, friction, satisfaction). Options:
    - (i) Adopt facets as primary MEAS-DERIVED source for Agent Performance loop; reshape C5 into a facets-reliability/coverage investigation rather than a measurement-design spike
    - (ii) Treat facets as one input among several; still pursue C5 for complementary quality measures
    - (iii) Reject facets (Anthropic-taxonomy coupling, opacity of the extraction prompt, on-demand refresh); proceed with C5 as designed
    - Sub-questions: is it acceptable to depend on `/insights` scheduling discipline? How much of the facets schema do we want to adopt vs. re-derive?

---

## Recommended execution order (original; superseded by "Execution order refresh" below)

> **Historical record.** This section was the original plan when E6 was still deferred. The authoritative next-session guidance is in the **Execution order refresh** subsection below.

1. **Read this handoff + correction doc + spike 009 DECISION.md + spike 010 DECISION.md + spike 010 qualitative_comparison.md** (~25 min)
2. **Anomaly stress-testing E1–E6 (Section E)** — E1–E6 + E5.8 COMPLETE (2026-04-16). See E-status refresh table.
3. **Do governance updates A1–A5** (1–2 hrs) — now informed by anomaly findings. E1/E2 added MEAS- requirements (automation health, kb.db queries). E3 fixes an extractor bug. E4/E5 close session-meta questions. E6 adds MEAS-RUNTIME-COMPACT + `clear_invocation_count`.
4. **(Optional) Run B4–B6 as research tasks** — can happen during or after governance updates. Lightweight.
5. **`/gsdr:discuss-phase 57.5`** — the TEN questions in section D above. Load-bearing inputs: spike 009, spike 010, correction doc, E1–E6 + E5.8 findings.
6. **(Optional, after 57.5 planning) Run C2 + C3 + potentially C4/C5/C6/C7** — investigation, real-tokenizer, marker-calibration, reasoning-quality, compaction-symmetry. C3 highest-value next spike.

Steps 1–2–3 + 5 are the critical path. Steps 4, 6 can happen in parallel or be deferred.

**Changes from prior order:** anomaly stress-testing added as step 2, ahead of governance. Governance is now step 3 (informed by anomaly findings).

### Execution order refresh (2026-04-16, after E1/E2/E3/E4/E5 + E5.8 + E6)

Step 2 is done. Revised sequence for next session:

1. ✅ Step 1 (onboarding reading) — done
2. ✅ Step 2 complete (ALL SIX STRESS TESTS):
   - ✅ E1, E2, E3, E4, E5 done + all five passed falsification passes (in `anomaly-stress-tests.md`)
   - ✅ E5.8 done — empirical /insights test executed; E5 reframe confirmed; two-path write model + facets budget filter surfaced
   - ✅ E6 done — A6 capability-layer falsified via binary introspection + authoritative docs; `/compact` subsystem confirmed; zero firing in corpus explained by 1M-context + `/clear`-habit. §6.22 MEAS-RUNTIME-COMPACT added
   - ⚠️ E5 materially reframed E3 and E4's shutdown-event interpretation; E5.8 refined E5's single-path write model to two-path; E6 reframed synthesis §4.3 "ABSENT" as observed-corpus-only, not capability — see E-status table
3. ⏳ Step 3 (governance A1–A5) — now has **23 MEAS- candidates** to synthesize (7 from spike 010 + 16 from E1–E6 + E5.8). First step: adopt the THREE-subfamily split (MEAS-RUNTIME + MEAS-DERIVED + MEAS-GSDR). E5's §6.19 (facets) is the highest-impact addition; E5.8 adds mandatory coverage-stratification clause for facets-based aggregate analysis; E6's §6.22 is capability-level (low near-term data richness — zero events in corpus — but restores cross-runtime compaction symmetry).
4. ⏳ Step 4 (B4–B6) — unchanged
5. ⏳ Step 5 (`/gsdr:discuss-phase 57.5`) — **question 10**: does §6.19's facets discovery change the framing of Q8 (reasoning-QUALITY measurement)? E5.8 partially answered this — facets coverage is size-biased, so facets alone cannot grade short-session agents. **New sub-point for Q6** (cross-runtime experiment): E6 reframes compaction-event extractor as symmetric, so a long-session controlled experiment on each runtime provides ground-truth for the MEAS-RUNTIME-COMPACT extractor as well.
6. ⏳ Step 6 (spikes C2/C3/C4/C5/C6) — C5 scope shifts (facets reliability). **New optional spike C7**: compaction-symmetry intervention test — run deliberate long 200k-context Sonnet session until auto-compact fires, verify extractor output. Would tighten E6's Test-3 hedge ("consistency-tested, not intervention-tested").

**Fresh-context entry point:** if resuming with cleared context, the FIRST action should be:
1. Read this handoff (top to bottom)
2. Read `anomaly-stress-tests.md` (§E1.6, §E2.7, §E3.7, §E4.7, §E5.7, §E5.8, §E6.2–§E6.7 are the sharpest refinements)
3. Read `e5.8-insights-experiment/RESULTS.md` — the empirical grounding for E5 + E5.8 findings
4. E5 + E5.8 are the most recent DERIVED-side findings; E6 is the most recent RUNTIME-side finding. Pay attention to: §E5.2 Layer 4 (the `/insights` discovery), §E5.4 §6.19 (facets as MEAS- source), §E5.8 Finding A (correcting the "2,595 JSONL" error → 211 parent sessions), §E5.8 Finding B (two-path write model), §E5.8 Finding C (facets coverage filter), §E6.2 Layer 2 (binary strings confirming `/compact` subsystem), §E6.4 (cache-trajectory + 1M-context hypothesis)
5. Jump to governance A1 synthesis with the full **23-candidate** MEAS- list + three-subfamily split

**Recommendation for next session:** A1 governance synthesis. All six stress-tests done.

**Uncommitted files at end of this session (for cold-start diff awareness):**
- `.planning/audits/2026-04-15-measurement-signal-inventory/anomaly-stress-tests.md` (E1–E6 + E5.8)
- `.planning/audits/2026-04-15-measurement-signal-inventory/pre-57.5-handoff.md` (this file; eighth refresh)
- `.planning/audits/2026-04-15-measurement-signal-inventory/e5.8-insights-experiment/` (full dir: PREDICTIONS.md, RESULTS.md, pre-snapshot/, post-snapshot/)
- Memory updates: `project_session_meta_frozen.md` (rewritten), `feedback_scope_cascade_assumption.md` (new), `MEMORY.md` (index updated)
- Pre-existing uncommitted: `.planning/config.json`, `.planning/migration-log.md` (v1.19.4+dev migration; NOT this work)

**LIVE SIDE-EFFECTS OF E5.8 (not reverted — intentional):**
- `~/.claude/usage-data/` contains 471 session-meta + 161 facets (post-/insights state, NOT the original 268 + 109 March 15 snapshot)
- Original March 15 state preserved at `e5.8-insights-experiment/pre-snapshot/`
- Post-run state preserved at `e5.8-insights-experiment/post-snapshot/`
- Any future reference to "the frozen corpus" should specify `pre-snapshot/` to avoid confusion

---

## Artifacts inventory (where to find things)

**Audit + correction (committed):**
- `.planning/audits/2026-04-15-measurement-signal-inventory/synthesis-output.md` (with pointer note at top)
- `.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md`
- `.planning/audits/2026-04-15-measurement-signal-inventory/{framing.md, lane-1..4-*.md}`
- `.planning/audits/2026-04-10-phase-57-vision-drop-investigation/` (predecessor)

**Anomaly stress-tests (UNCOMMITTED as of 2026-04-16 this session):**
- `.planning/audits/2026-04-15-measurement-signal-inventory/anomaly-stress-tests.md` — contains E1, E2, E3, E4, E5, E5.8, E6 full writeups + per-E falsification passes (§E1.6, §E2.7, §E3.7, §E4.7, §E5.7, §E6.7). **Read alongside this handoff** — it's the authoritative record of E1–E6 findings, the 16 new MEAS- proposals, and the 4 candidate side-signals. **E5 materially reframes E3 and E4's shutdown-event interpretation — the /insights discovery is the single most architecturally-consequential finding in this whole audit line. E6 falsifies A6 at the capability layer via binary introspection — Claude Code has a full `/compact` subsystem.**

**Deliberation (committed):**
- `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md`

**Spike 009 (committed):**
- `.planning/spikes/009-thinking-summary-as-reasoning-proxy/{DESIGN, DECISION, analysis, WORKFLOW-DEVIATION}.md`
- `.planning/spikes/009-thinking-summary-as-reasoning-proxy/{extract_metrics.py, per_dispatch_metrics.csv, dispatch_manifest.csv, agent_id_map.csv, raw_jsonl_paths.txt}`
- KB entry: `.planning/knowledge/spikes/get-shit-done-reflect/2026-04-16-thinking-summary-as-reasoning-proxy.md`

**Spike 010 (uncommitted as of this handoff update; pending commit):**
- `.planning/spikes/010-parent-session-thinking-summary-proxy/{DESIGN, DECISION, analysis, qualitative_comparison}.md`
- `.planning/spikes/010-parent-session-thinking-summary-proxy/experiments/{dispatch.sh, retry_failed.sh, extract_metrics.py, render_responses.py, dispatch.log, retry.log, stdout_cell_*.json}`
- `.planning/spikes/010-parent-session-thinking-summary-proxy/{dispatch_manifest.csv, session_id_map.csv, per_dispatch_metrics.csv, raw_jsonl_paths.txt}`
- `.planning/spikes/010-parent-session-thinking-summary-proxy/responses/{README, A, B-notools, B-tools}.md` (human-readable renderings of all 36 sessions — thinking + visible, grouped by prompt and ordered for matched comparison)
- KB entry: `.planning/knowledge/spikes/get-shit-done-reflect/2026-04-16-parent-session-thinking-summary-proxy.md`

**Memory (in `~/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect/memory/`):**
- `MEMORY.md` (index)
- `feedback_research_before_giving_up.md`, `project_thinking_redaction_discovery.md`, `project_session_meta_frozen.md`
- (older entries from prior sessions)

**Settings (in `~/.claude/settings.json`):**
- `showThinkingSummaries: true` (newly set 2026-04-15 ~23:39 EDT)
- `effortLevel: high` (preexisting)

**Recent commits:**
- `125000af` spike(009): subagent dispatch context gates thinking content
- `9e69c5ce` docs(phase-57): falsify synthesis A4 + extend signal inventory
- `29fc286c` docs(phase-57): investigatory audit + signal inventory + measurement deliberation (predecessor)

---

## What this handoff doesn't cover

- The 4 prix-guesser session JSONLs (`~/.claude/projects/-home-rookslog-workspace-projects-prix-guesser/`) that appeared in our exploration — those are a DIFFERENT project's work (Track B/C cross-vendor audits), not measurement-related. Mentioned only because they showed up in our "what new sessions have thinking content" query and confused interpretation briefly.
- The pre-existing modifications to `.planning/config.json` and `.planning/migration-log.md` — these are v1.19.4+dev migration work from before this conversation, unrelated to measurement infrastructure. Not committed by this work.
