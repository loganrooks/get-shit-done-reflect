# Pre-Phase 57.5 Handoff

**Originally written:** 2026-04-15
**Last updated:** 2026-04-16 (third refresh — after spike 010 completed, MEAS- implications revised)

---

## Quick Status

- ✅ Synthesis correction + extension authored, committed (`9e69c5ce`)
- ✅ Spike 009 (thinking-summary as reasoning proxy in subagent dispatch) executed + sealed (`125000af`)
- ✅ Spike 010 (same matrix in parent-session dispatch via headless `claude -p`) **executed this session** — outcome `partial`. H1/H2 confirmed, H3 falsified, H4 untestable. 5 new structural findings + 1 qualitative finding surfaced a load-bearing gap (see below).
- ✅ Settings change applied (`showThinkingSummaries: true` in `~/.claude/settings.json`)
- ✅ Memory updated with three new records (research-before-giving-up, thinking-redaction-controllable, session-meta-frozen)
- ⏳ Governance updates (A1–A5) — NOT started; **MEAS- spec shape revised by spike 010 findings** (see A1 below)
- ⏳ External-data research (B4–B6) — NOT started
- ⏳ `/gsdr:discuss-phase 57.5` — NOT started; **one new design question added** (reasoning-quality measurement gap)
- ⏳ Follow-up spikes queued — 3 original + 1 new (C4 marker-set calibration); C2 and C3 unchanged; C5 possible (LLM-as-judge for reasoning quality)

If you have fresh context, **read this handoff + `correction-and-extensions-2026-04-16.md` + spike 009's `DECISION.md` + spike 010's `DECISION.md` + spike 010's `qualitative_comparison.md`**, then proceed with the recommended execution order at the bottom.

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

### A. Governance updates (was Section A in original handoff — still valid, scope updated by correction doc)

**A1. REQUIREMENTS.md — add MEAS- family + GATE-09 + new requirements (UPDATED BY SPIKE 010)**

The correction doc's 6 candidates are revised by spike 010 findings. Final MEAS- spec shape:

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

### D. Discuss-phase 57.5

`/gsdr:discuss-phase 57.5` with deliberation + audit + correction doc + spike 009 + spike 010 + governance commits as committed context.

Key design questions (revised after spike 010):

1. **Agent Performance measurement substrate** — pick (a/b/c) or combination (see "Updated MEAS- decision landscape" above). Parent-only + build-forward-via-headless (a+c) is the emerging favorite but forecloses tool-use observability.
2. **Which feedback loop leads in 57.5?** Synthesis recommended Agent Performance + Pipeline Integrity via GSD-only path. Spike 009 weakened subagent reasoning observability; spike 010 confirmed headless works for thinking but not tool-use. If Agent Performance leads, scope to emission+load metrics and defer quality to 57.6.
3. **GSD-artifacts-only path vs session-data-integrated path for 57.5?** Same as original. GSD-only is broader retroactively; session-data is richer prospectively.
4. **How much post-Popperian epistemic machinery in 57.5 vs 57.7?** Same as original.
5. **Temporal features as first-class architectural concern.** Same as original.
6. **Cross-runtime controlled experiment.** Same as original.
7. ~~Whether spike 010 should run BEFORE 57.5 planning~~ — **resolved: ran and completed before planning**; findings are now context for this discussion.
8. **NEW — Reasoning-QUALITY measurement in Phase 57.5 scope?** Spike 010 qualitative finding #6: length is not a quality proxy. Agent Performance loop will mis-rank agents if led by length alone. Options:
   - (i) Include placeholder requirement + defer implementation to 57.6/57.7 (signals the gap)
   - (ii) Run spike C5 BEFORE 57.5 planning (tests candidate quality mechanisms; expensive)
   - (iii) Run spike C5 during 57.5 execution as part of MEAS- prototyping
   - (iv) Defer quality measurement entirely to 57.6+ and scope 57.5 to emission+load only
9. **NEW — Tool-use measurement strategy.** Headless dispatch does not exercise tool use (spike 010 observation); interactive sessions do but aren't easily dispatched programmatically. Is tool-use a 57.5 concern or deferred?

---

## Recommended execution order (revised after spike 010)

1. **Read this handoff + correction doc + spike 009 DECISION.md + spike 010 DECISION.md + spike 010 qualitative_comparison.md** (~25 min, add ~10 min vs previous handoff)
2. **Do governance updates A1–A5** (1–2 hours) — critical path. The MEAS- requirements and ROADMAP entries should reflect: deliberation + correction document + spike 009 structural finding + spike 010 composite-feature revision + the reasoning-quality gap (A1 requirement #7 placeholder).
3. **(Optional) Run B4–B6 as research tasks** — can happen during or after governance updates. Lightweight. Results inform discuss-phase but are not blocking.
4. **`/gsdr:discuss-phase 57.5`** — the NINE questions in section D above (two new from spike 010: reasoning-quality scope + tool-use measurement strategy). Load-bearing inputs: spike 009 (subagent gate), spike 010 (headless viability + quality gap), correction doc (four-class symmetry). Key decision: whether to launch spike C5 (reasoning-quality) before or during 57.5, or defer.
5. **(Optional, after 57.5 planning) Run C2 + C3 + potentially C4/C5** — investigation, real-tokenizer, marker-calibration, reasoning-quality. C3 is now highest-value next spike (spike 010 produced clean input data). C5 scope depends on discuss-phase decision.

Steps 1–2 + 4 are the critical path. Steps 3, 5 can happen in parallel or be deferred.

**Removed from prior execution order:** the "Run spike 010 in background" step — completed this session.

---

## Artifacts inventory (where to find things)

**Audit + correction (committed):**
- `.planning/audits/2026-04-15-measurement-signal-inventory/synthesis-output.md` (with pointer note at top)
- `.planning/audits/2026-04-15-measurement-signal-inventory/correction-and-extensions-2026-04-16.md`
- `.planning/audits/2026-04-15-measurement-signal-inventory/{framing.md, lane-1..4-*.md}`
- `.planning/audits/2026-04-10-phase-57-vision-drop-investigation/` (predecessor)

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
