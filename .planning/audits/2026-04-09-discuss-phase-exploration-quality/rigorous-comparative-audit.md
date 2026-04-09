# Rigorous Comparative Audit — CONTEXT.md Quality and Downstream Effects

**Date:** 2026-04-09
**Auditor:** Claude Sonnet 4.6 (1M context, read-only explore agent)
**Files read:** 57-CONTEXT.md, 52-CONTEXT.md, 53-CONTEXT.md, 54-CONTEXT.md, 55-CONTEXT.md, 56-CONTEXT.md; all six RESEARCH.md files; 57-01-PLAN.md, 57-02-PLAN.md, 56-01-PLAN.md, 52-01-PLAN.md, 52-05-PLAN.md; 55-01/04-SUMMARY.md, 52-05-SUMMARY.md; measurement-infrastructure-research.md (sections 1-4); upstream-drift-survey-2026-04-08.md (header + key findings); kb-architecture-research.md (header); 10 signal files; execute-phase.md (auto_collect_signals section); automation resolve-level query result; prior audit files (outcome-comparison-audit.md, audit-review-and-deepening.md); git log for pre-work artifacts.

---

## Corrections to Prior Audits Before Starting

Three specific claims in prior audits require correction before proceeding, because this audit's findings build on the same evidence:

**Correction 1:** audit-review-and-deepening.md (line 129): "Phase 56 planner corrected CONTEXT.md: updated REQUIREMENTS.md to fix KB-01 lifecycle conflict."

What 56-CONTEXT.md actually says (line 20-25): "Working assumption: Phase 31's state model (detected/triaged/remediated/verified/invalidated) is the correct one... Researcher must verify this by checking REQUIREMENTS.md authoring context." The CONTEXT.md explicitly marks this as an `[open — critical conflict]`, not a locked decision. The plan (56-01-PLAN.md line 74) then says "Update KB-01 in REQUIREMENTS.md to replace the incorrect lifecycle states." The plan implemented what the open question resolved in research — it did not "correct CONTEXT.md." The CONTEXT.md had already exposed the conflict as a working assumption requiring verification.

**Correction 2:** outcome-comparison-audit.md (line 203): claims "Phase 52-05 SUMMARY shows generated signals have `detection_method: automated, origin: collect-signals`" as evidence that rich-era signals were auto-collected. The signal files themselves confirm this — but the mechanism requires investigation. The execute-phase.md workflow has an auto_collect_signals step that gates on `automation resolve-level signal_collection`. Running that command today returns `effective: 1` (nudge), which means auto-collection displays a message but skips. Whether this was different during Phase 52-53 execution requires checking STATE.md automation settings at that time — which I cannot determine with certainty from available artifacts.

**Correction 3:** Both prior audits claim "both eras passed 100% verification on first try" as a null result. This is accurate but the framing omits that Phase 57 has no executed plans — only CONTEXT.md and RESEARCH.md exist. There is nothing to verify yet. The 100% rate applies only to Phases 52-56.

---

## Section A: Did the Thin-Era CONTEXT.md Foreclose Questions That Should Have Been Open?

### What I Investigated

I read all [grounded] decisions in 57-CONTEXT.md and compared them against the cited evidence in measurement-infrastructure-research.md Section 4. I also examined [grounded] decisions in 55-CONTEXT.md and 56-CONTEXT.md, checking whether each basis citation supports the claimed grounding.

### What I Found

**Phase 57 CONTEXT.md: Baseline Dimensions decision**

57-CONTEXT.md lines 38-41:
> "[grounded] All 8 proposed metrics from research: tokens/session, token-to-commit ratio, tool error rate, interruption rate, session outcome distribution, friction frequency, session duration distribution, agent usage rate"
> "Basis: STATE.md blocker ('validation spike required before baselines committed in Phase 57'), Pitfall C3"

The "Basis" citation points to a STATE.md blocker and Pitfall C3 — neither of these justify WHY these 8 metrics and not others. The research document (measurement-infrastructure-research.md, Section 4) presents a table of "Recommended baseline dimensions" with these exact 8 metrics. Reading that section (lines 162-172 of the file), the metrics are justified by availability in session-meta data: "from available data." The selection criterion is "what's in the data schema" rather than "what predicts session quality" or "what changes with interventions."

The research document explicitly defers the question of predictive value: "Quality-predictive metric identification — MILESTONE-CONTEXT working assumption: 'extraction tooling now, automated sensor later'" (57-CONTEXT.md Deferred section). But marking "all 8 proposed metrics from research" as [grounded] forecloses the question of whether these 8 are the RIGHT 8 to establish as a baseline. A working-assumption framing would have allowed the researcher to ask: "Which of these 8 metrics have evidence of sensitivity to the interventions Phase 58+ will make? Are there metrics we're NOT capturing that would be more informative?"

Compare with what a rich-era CONTEXT.md would have done: 52-CONTEXT.md Q3 specifies "What research should investigate: List all upstream test files that correspond to adopted features. Assess which can run as-is, which need namespace adaptation, and which are irrelevant." The question is generative — it specifies a research program with multiple possible outcomes. The Phase 57 "basis" is confirmatory: research proposed 8 metrics, CONTEXT.md locked them.

**Phase 57 CONTEXT.md: Output Format decision**

57-CONTEXT.md lines 26-31:
> "[grounded] `--raw` flag for JSON output; default is human-readable tables — follows established gsd-tools convention"
> "[grounded] Module follows `lib/telemetry.cjs` pattern with `cmdTelemetry{Subcommand}(cwd, options, raw)` signatures"

Basis: "follows established gsd-tools convention." This is a legitimate grounding — these are genuine code conventions. But marking "default is human-readable tables" as [grounded] forecloses an exploration that would have been appropriate: given that telemetry output is intended for agents and health-probe integration (not just human reading), should the default be machine-readable? The research document (measurement-infrastructure-research.md, Section 3, Option A advantages) notes: "Available to agents and hooks via the existing CLI interface. Can use `--raw` flag for machine-readable output (established convention)." This treats the human-readable default as obviously correct because it's convention. It doesn't ask whether the convention is appropriate for a telemetry module whose primary consumers may be agents.

Opening this as a working assumption ("Following established convention, defaulting to human-readable tables; researcher should verify whether telemetry consumers are human or agent-driven and whether the default should differ") would have surfaced an architectural question worth examining.

**Phase 57 CONTEXT.md: Token Count Reliability Strategy**

57-CONTEXT.md lines 20-25:
> "[grounded] Validation task (5-session comparison of session-meta tokens vs JSONL-aggregated tokens) must complete before baseline.json is committed"
> "Basis: STATE.md blocker ('validation spike required before baselines committed in Phase 57'), Pitfall C3"

This is the MOST legitimate grounding in the document. The STATE.md blocker is a genuine prerequisite, and 57-RESEARCH.md (lines 65-68) confirms through empirical analysis: "Research conducted during this investigation compared session-meta token counts against JSONL-aggregated counts across 65 sessions: only 15% matched exactly, 44% were within 2x, and 40% were wildly off (up to 13,000x discrepancy on input tokens)."

The grounding is traceable and the basis genuinely supports the decision. This is one case where [grounded] is appropriate and opening it as a working assumption would have added no value — the decision doesn't foreclose any research direction.

**Phase 55 CONTEXT.md: Integration Strategy Per Module**

55-CONTEXT.md lines 33-36:
> "[grounded] Pure upstream modules (state.cjs, milestone.cjs, template.cjs, verify.cjs): Wholesale replace from upstream v1.34.2. These have zero fork diff per FORK-DIVERGENCES.md."

Basis: implicitly from FORK-DIVERGENCES.md module merge stance. Checking 55-RESEARCH.md, this is confirmed: "Direct git diff analysis of fork HEAD vs upstream f7549d43 (v1.34.2) for all in-scope modules" (Sources section). The grounding is traceable and legitimate — the zero-fork-diff claim is verifiable from git diff.

However, 55-RESEARCH.md (line 36) found a critical complication NOT visible in CONTEXT.md: "upstream refactored MODEL_PROFILES out of core.cjs into a new model-profiles.cjs module." This dependency was discovered by research, not by CONTEXT.md. The CONTEXT.md was correct about what it knew, but it couldn't have anticipated this. This is evidence that the question-foreclosure harm depends on domain knowledge — mechanical sync operations have different risk profiles than architectural refactoring.

**Phase 56 CONTEXT.md: Lifecycle State Model**

56-CONTEXT.md lines 20-25 (the key passage):
> "### Lifecycle state model [open — critical conflict]"
> "Working assumption: Phase 31's state model (detected/triaged/remediated/verified/invalidated) is the correct one — it was explicitly designed for signal lifecycle semantics. KB-01's states (proposed/in_progress/blocked/verified/remediated) read like task/issue states and likely represent a requirements drafting error. Researcher must verify this."

This is the richest decision structuring in all thin-era phases. The decision is labeled [open], not [grounded]. It states a working assumption explicitly, names the conflicting evidence, gives a hypothesis about the cause, and specifies what research must verify. This is structurally equivalent to a rich-era open question — it opens a research direction rather than closing one.

56-RESEARCH.md confirmed the working assumption (Phase 31 model is correct) with 5 independent evidence sources. The research was genuinely verifying a hypothesis, not confirming a foregone conclusion.

**Comparison: Phase 52-54 approach to comparable decisions**

For decisions comparable in nature to the thin era's [grounded] locks, the rich era used working assumptions with explicit research directives:

52-CONTEXT.md A3 (discuss-phase merge strategy): "Research should determine whether this is a wholesale replacement or a targeted merge." This was open. Research found: wholesale replacement is correct because the fork's steering brief model lives in CONTEXT.md output, not the workflow file — a finding the CONTEXT.md could not have locked in advance.

52-CONTEXT.md A1 (namespace rewriting): "Research should verify which features need fork-specific modifications beyond namespace rewriting." This was open. Research confirmed most features follow the pattern — a confirmation, not a surprise. But the question remained open during research.

53-CONTEXT.md A4 (cleanup exclusion safety by construction): "Research should verify this by reading the full workflow and confirming no code path can delete those directories." The decision to guard explicitly was locked, but the question of whether the workflow was already safe was explicitly open.

**What this means:** The thin era's CONTEXT.md locks decisions that were previously working assumptions. For some decisions (token validation, namespace convention), this is appropriate — the basis is traceable and the decision space was genuinely explored in upstream research. For others (the 8 baseline metrics, the human-readable default), the locking is premature — the basis is availability, not fitness for purpose, and alternative framings were not examined.

**What would disconfirm this:** If the 8 metrics were justified in measurement-infrastructure-research.md as uniquely appropriate (not just available), the [grounded] marking would be legitimate. Reading Section 4 of that document: metrics are listed with "Source," "Computation," and "Granularity" — there is no column for "Why this metric rather than alternatives" or "Evidence this metric is sensitive to the interventions we're planning." The justification is: "from available data." My interpretation stands.

**What I couldn't determine:** Whether the agent executing the discuss-phase for Phase 57 was aware of the metric selection rationale — the CONTEXT.md just lists the 8 metrics as grounded, with no record of what alternatives were considered or whether alternatives were discussed during the session.

---

## Section B: Research Question Quality Comparison

### What I Investigated

I read the CONTEXT.md open questions sections for Phases 52, 53, 54, 55, 56, and 57, and compared their structure. I then read the corresponding RESEARCH.md files to assess whether questions were generative (specifying a research program) or confirmatory (asking for yes/no validation).

### What I Found

The following direct comparisons use quoted text. I am not summarizing.

**Question format comparison: Phase 52 vs Phase 55**

52-CONTEXT.md Q1 (lines 99-104):
> "### Q1: Discuss-phase merge strategy — wholesale replace or incremental merge?
> - **Type:** formal
> - **Why it matters:** The fork's discuss-phase (408 lines) has a steering brief model with sections upstream doesn't have. Upstream's version (1049 lines) adds codebase scouting (+641 lines). A wholesale replace would lose the fork's steering brief model; an incremental merge preserves both but is more complex.
> - **Downstream decision affected:** Whether the fork's CONTEXT.md output format changes, plan structure for discuss-phase adoption
> - **Reversibility:** Low — the discuss-phase workflow shapes all downstream context gathering
> - **What research should investigate:** Diff the two versions structurally. Identify which upstream additions are purely additive (codebase scouting) vs which conflict with fork sections. Determine if upstream's `<code_context>` output can be added to the fork's existing template without breaking the steering brief model."

55-CONTEXT.md Open Questions table equivalent (lines 90-95):
> "| Should Area 3 performance fixes be included in SYNC-01 scope? | 4 low-risk commits touching already-modified files; saves a second merge pass | Low | Pending |"
> "| Does upstream v1.34.2 include new test files for the correctness fixes? | New tests should be adopted to ensure the fixes have regression coverage | Medium | Pending |"

**Structural difference:** The Phase 52 question has five fields — Type, Why it matters, Downstream decision affected, Reversibility, and What research should investigate. The last field is a research program specification: it tells the researcher what methodology to follow and what distinctions to draw. The Phase 55 question has three fields — Why It Matters, Criticality, Status — and no research directive. It asks whether to include something; the Phase 52 question asks how to analyze a tradeoff.

This isn't just formatting. The "What research should investigate" field in Phase 52 means the researcher enters the research task already knowing what methodology to apply. The Phase 55 format leaves methodology entirely to researcher discretion. When research is confirmatory (as Phase 55's often is), this doesn't matter. When research needs to surface architectural implications (as Phase 52's did), the research directive prevents the researcher from defaulting to a shallow yes/no answer.

**Generative vs. confirmatory classification:**

| Phase | Question | Classification | Research Finding |
|-------|----------|----------------|-----------------|
| 52 Q1 | "Wholesale replace or incremental merge for discuss-phase?" | Generative — specifies diff methodology | Surprise: wholesale replace correct because steering brief lives in CONTEXT.md output, not workflow spec. Direction changed. |
| 52 Q2 | "Per-agent model override interaction with fork's model profile system?" | Generative — asks for precedence analysis | Confirmatory surprise: ADT-09 already implemented. Eliminated a plan. |
| 53 Q1 | "How does session ID reach automation.cjs for bridge file lookup?" | Generative — asks for mechanism investigation | Architecture changed: glob-for-most-recent pattern selected over session-ID approach |
| 53 Q4 | "Is INT-06 already satisfied by Phase 52?" | Confirmatory — yes/no | Confirmed yes. No plan needed. |
| 54 Q1 | "What is upstream responding to?" | Generative — specifies examining issues, PRs, release notes, "look for patterns" | Found genuine upstream trajectory analysis (stability vs. expansion) |
| 54 Q2 | "What are the guiding design philosophies of each project?" | Genuinely exploratory — requires synthesis | Generated novel comparative analysis |
| 55 Q2 | "Does upstream v1.34.2 include new test files?" | Confirmatory — yes/no | Confirmed: 26 new test files. No surprise. |
| 55 Q4 | "Do any fork-only modules call state-write functions affected by locking overhaul?" | Confirmatory — yes/no | Confirmed: no. No surprise. |
| 56 Lifecycle open Q | "Should Phase 56 align KB-01 lifecycle states with Phase 31's existing model?" | Technically confirmatory but framed with "Working assumption" structure and "Researcher must verify" | Found: Phase 31 correct. Working assumption confirmed. |
| 57 Open Q1 | "Are session-meta token counts post-caching residuals or gross counts?" | Confirmatory — yes/no | Yes, confirmed through empirical comparison. The finding was already anticipated (STATE.md blocker). |

**What this means:** The shift from rich to thin format correlates with a shift from generative to confirmatory questions. Rich-era questions specify research programs; thin-era questions specify yes/no validations. This is not a categorical difference — both eras have some of each type. But the structural pressure differs: the rich-era format requires the context-gatherer to specify what research should investigate, which prevents the question from being answerable by a simple lookup.

**What would disconfirm this:** If thin-era research found architectural surprises comparable to Phase 52-53 (not just dependency facts), the question format difference would not matter. Phase 55 research DID find the MODEL_PROFILES dependency chain — a genuine architectural complication. But this was discovered because research examined the actual code (direct git diff), not because the open question was formulated to surface architectural implications. The research quality was high; the question formulation credit goes to the researcher, not the CONTEXT.md.

**Phase 57 questions specifically:** The three open questions in 57-CONTEXT.md are:
1. "Are session-meta token counts post-caching residuals or gross counts?" — Confirmatory. Already anticipated as "Blocked — inline validation task will resolve."
2. "Is 41% facets coverage sufficient for statistical analysis?" — Confirmatory, and the answer is predetermined: "[open] — report n, let consumer decide." This isn't a research question; it's a deferred decision with the answer already given.
3. "Which metrics are actually predictive of session quality?" — Generative but flagged "[open] — hypothesis-generating, not this phase's job."

The third question acknowledges the most important research direction but explicitly defers it. The CONTEXT.md asks "which metrics are predictive?" but locks "all 8 proposed metrics from research" as [grounded] in the decisions section. These two choices are in tension: if predictive value is unknown, grounding all 8 metrics as the baseline dimensions is premature.

**What I couldn't determine:** Whether the discuss-phase session for Phase 57 considered and rejected other research directions before arriving at these three questions. The CONTEXT.md records the output, not the deliberation process.

---

## Section C: The Invisible Cost — Questions Never Asked

### What I Investigated

For Phase 57's [grounded] decisions, I traced whether the research actually examined the question being locked, or whether the [grounded] label was applied to an untested assumption.

### What I Found

**The 8 baseline metrics: grounding traced**

57-CONTEXT.md (line 38): "[grounded] All 8 proposed metrics from research: tokens/session, token-to-commit ratio, tool error rate, interruption rate, session outcome distribution, friction frequency, session duration distribution, agent usage rate"

measurement-infrastructure-research.md Section 4 (lines 154-182) provides the basis. The metrics are presented as "Recommended baseline dimensions (from available data)" with columns for Source, Computation, and Granularity. The selection criterion is: these fields exist in session-meta or facets data. There is no analysis of:

- Which metrics change meaningfully with the kinds of interventions Phase 58+ will make (the whole point of establishing a baseline is to detect changes)
- Whether there are metrics NOT in the current data schema that would be more informative
- Whether any of the 8 are known to be noisy or misleading proxies

The research document DOES note epistemic caveats: "Epistemic caveat: These are AI-generated assessments, not human annotations. Their accuracy is unknown." But it doesn't use this caveat to question whether session_outcome_distribution and friction_frequency should be baseline metrics when their accuracy is unknown.

What a working-assumption framing would have enabled: A question like "Which baseline metrics have evidence of sensitivity to the interventions in Phase 58+?" would have opened research into whether the 8 metrics are fit for purpose — not just fit for computation.

**The "--raw flag for JSON output" decision: grounding traced**

57-CONTEXT.md (line 26): "[grounded] `--raw` flag for JSON output; default is human-readable tables — follows established gsd-tools convention"

This IS genuinely grounded in code convention. Every other lib module (sensors.cjs, automation.cjs, health-probe.cjs) follows this pattern. The grounding is traceable by inspection.

The question that a working assumption would have opened: "The telemetry module is intended to feed health-probe and agent consumption — should it follow human-readable-first convention or machine-readable-first?" The 57-CONTEXT.md Deferred section notes "Health-probe token-health integration is a downstream consumer — not this phase." The Specifics section notes the module is for baseline computation for future phase comparison. If the primary consumers are automated (health-probe, agents), a machine-readable-first default would be more appropriate. This is not examined.

**Comparison: How Phase 52 handled a comparable convention decision**

52-CONTEXT.md's "Namespace rewriting pattern" decision: "All adopted files follow the established pattern: source files use `gsd` prefix, installer rewrites to `gsdr` at install time via `replacePathsInContent()`. Grounding: This is the universal pattern used since Phase 45 for all source files. No deviation needed."

This is a legitimate locked decision with appropriate grounding — the convention is universal and well-established. The difference from the Phase 57 output format decision is that the namespace convention applies universally across the project, while the telemetry output format is specific to a module whose use patterns differ from other modules.

**Phase 52 example: a decision that SHOULD have been open but was open**

52-CONTEXT.md A3: "Research should determine whether this is a wholesale replacement or a targeted merge." This WAS left open. Research found the steering brief model lives in CONTEXT.md output, not the workflow — this finding could not have been known in advance and would have been lost if the decision had been locked.

**For Phase 55: Integration strategy per module**

55-CONTEXT.md (lines 33-47): Each module category is marked [grounded] with basis from FORK-DIVERGENCES.md.

The research DID find a critical complication: MODEL_PROFILES dependency chain. 55-RESEARCH.md (lines 36-37): "The critical complication discovered during research is that upstream refactored MODEL_PROFILES out of core.cjs into a new model-profiles.cjs module — both core.cjs and config.cjs now import from it. This creates a mandatory dependency: adopting the core.cjs and config.cjs fixes requires also adopting model-profiles.cjs as a new module."

This finding required changing the execution order. The CONTEXT.md had locked "core.cjs: Hybrid modules — Manual merge required" without knowing about the model-profiles.cjs dependency. The finding forced a revision: model-profiles.cjs must be adopted FIRST.

This is evidence that [grounded] decisions in CONTEXT.md CAN be overridden by research when complications arise. The research phase is not just validation — it investigates even locked decisions. This partially mitigates the foreclosure concern.

**What this means:** The thin era's [grounded] locks are not absolute. Research in both Phases 55 and 56 discovered complications that required adding dependencies or correcting requirements. The foreclosure harm is not that [grounded] decisions can't be changed — they can. The harm is that the CONTEXT.md's locked framing prevents the discussion phase from surfacing what alternatives were considered, what assumptions the locked decision depends on, and what would make it wrong.

**What would disconfirm this:** If the thin-era research documents showed explicit consideration of alternatives before confirming each [grounded] decision, the foreclosure claim would be weakened. 57-RESEARCH.md does show "Alternatives Considered" in the Standard Stack section — covering "In-memory percentile computation" vs. "simple-statistics npm package," etc. These are implementation-level alternatives, not architecture-level alternatives (like "should we even measure these 8 metrics vs. a different set"). The alternatives table addresses how to build, not what to build.

---

## Section D: Signal Content Comparison

### What I Investigated

I read 5 signals from the rich era (Phases 52-54) and 5 from the thin era (Phases 55-57). For each, I read the full file and examined: What Happened, Potential Cause, detection_method, origin, and whether the signal reflects architectural insight or execution observation.

### What I Found

**Rich-era signals (read in full):**

**sig-2026-03-27-plan-checker-caught-two-structural-plan-gaps** (Phase 52):
- detection_method: automated; origin: collect-signals
- What Happened: "Plan checker caught two structural plan gaps (missing command stubs in Plan 02, vague hook registration in Plan 05) before execution began"
- Evidence: Cites specific git commit hash d4d6145, names exactly what was caught ("4 command stubs missing from files_modified and must_haves"), includes a counter-evidence bullet
- Classification: Process observation documenting a positive practice. Requires epistemic discipline to note what the plan checker CAN'T catch (semantic correctness).

**sig-2026-03-27-wholesale-workflow-adoption-did-not-include-a-depe** (Phase 52):
- detection_method: automated; origin: collect-signals
- What Happened: "Wholesale workflow adoption did not include a dependency scan for @-references in adopted files, creating a repeatable gap pattern for upstream adoption plans"
- Evidence: Names the specific plan (03), the specific mechanism (advisor-researcher gap detected at test time, not adoption time), and the specific artifact (52-RESEARCH.md lacked @-reference dependency graph)
- Classification: Architectural insight about a systematic process gap. Requires reflective practice to identify that this is a repeatable pattern, not a one-off.

**sig-2026-03-28-signal-cross-reference-between-fork-kb-themes-and** (Phase 54):
- detection_method: automated; origin: collect-signals
- What Happened: "Signal cross-reference...executed as a first-of-its-kind novel analysis with a documented methodology"
- Evidence: Cites three specific plan passages with exact quotes, names the specific artifact (54-SIGNAL-CROSSREF.md), notes a 45% discrepancy in router size data
- Classification: Architectural insight documenting a novel methodology. Clearly requires reflective epistemic practice to identify this as a "first-of-its-kind" pattern worth generalizing.

**sig-2026-03-27-bridge-file-tests-in-plan-53-01-did** (Phase 53):
- detection_method: automated; origin: collect-signals
- What Happened: "Bridge file tests in plan 53-01 did not account for host environment state, requiring a fix in the subsequent verification plan"
- Evidence: "Full diff of fix commit d77a03b shows exactly 2 lines changed, both adding ['--context-pct', '0'] to existing tests that predated the bridge file feature."
- Classification: Technical discovery — a test isolation issue. This is something any competent executor would notice; the signal captures it for the record.

**sig-2026-03-28-phase-identity-reframed-before-planning-began** (Phase 54):
- detection_method: automated; origin: collect-signals
- What Happened: "Phase identity reframed before planning began: 2 commits created under 54-infrastructure-documentation before being abandoned"
- Evidence: "Two distinct directory names appear in git history for the same phase number; the reframing commits are explicit in their subjects"
- Classification: Execution event — scope/identity change. Git sensor detected this automatically.

**Thin-era signals (read in full):**

**sig-2026-04-08-autonomous-discuss-plan-execute-pr-merge-pipeline** (Phase 56):
- detection_method: manual; origin: user-observation
- What Happened: "Phase 56 ran the full GSD pipeline autonomously in a single session: discuss-phase (--auto, exploratory mode) -> plan-phase (research -> plan -> checker -> revision -> re-check) -> execute-phase (3 waves, Sonnet executors) -> verify-phase (5/5 pass) -> postludes -> PR creation -> CI check -> CI failure diagnosis -> fix -> CI re-run -> merge -> post-merge cleanup."
- Classification: Architectural insight about workflow maturity. Requires user observation to identify as a milestone worth recording.

**sig-2026-04-08-model-override-scope-leak-researcher-got-sonnet** (Phase 56):
- detection_method: manual; origin: user-observation
- What Happened: "User said 'use sonnet for executor (override)' before Phase 55 execution. During Phase 56's plan-phase workflow, the orchestrator applied the Sonnet override to the gsdr-phase-researcher agent."
- Classification: Technical discovery — scope leak bug. Would any competent user notice? Yes — user caught it during execution. Worth recording.

**sig-2026-04-09-exploratory-mode-epistemic-quality-regression** (Phase 57):
- detection_method: manual; origin: local
- What Happened: "The Phase 57 exploratory discuss-phase produced a CONTEXT.md that is functionally a list of locked decisions, not an exploration. Specific evidence: 1. Nearly everything marked [grounded]: ~25 decisions locked, only 3 open questions... 2. No iterative grey-area discovery... 3. No epistemic guardrails... 4. 'Grounded' claims lack justifiable grounding..."
- Potential Cause: Lists 5 contributing factors including "The workflow says '--auto only selects grounded.' If the agent knows --auto is active, it is incentivized to mark everything [grounded] so that --auto can proceed without stopping."
- Classification: Architectural insight of the highest order — identifies a perverse incentive structure in the workflow design. Requires genuinely reflective epistemic practice to surface. This is the most analytically sophisticated signal in either era.

**sig-2026-04-09-state-md-stale-after-worktree-merge** (Phase 55.1):
- detection_method: user-prompted; origin: conversation
- What Happened: "After execute-phase completed Phase 55.1... STATE.md contained: 1. Wrong current phase: Showed 'Phase 57' instead of 'Phase 55.2' 2. Garbled quick task table row... 3. Stale session continuity"
- Root cause analysis: "The execute-phase workflow's update_roadmap step does not include STATE.md reconciliation after all worktree merges complete."
- Classification: Technical discovery with root cause analysis. User-prompted, not auto-collected. This event occurred in Phase 55.1 (thin era) and was captured manually.

**2026-04-09-state-md-stale-after-worktree-merge** (thin era):
- Matches the worktree pattern, not auto-collected.

**The collect-signals mechanism: what I actually found**

Running the automation resolve-level command directly confirms:
```
gsd-tools.cjs automation resolve-level signal_collection --context-pct 50 --raw
→ {"feature": "signal_collection", "configured": 1, "effective": 1, "level_names": {"1": "nudge"}}
```

The execute-phase.md auto_collect_signals step (lines 401-480) explicitly documents level behavior:
> "| 1 | nudge | Display nudge message and skip. Track: `track-event signal_collection skip 'level-1'` |"

This means: with signal_collection at level 1 (current setting), the execute-phase postlude displays a nudge message ("Signal collection available for phase {PHASE_NUMBER}. Run `/gsdr:collect-signals {PHASE_NUMBER}` to collect signals.") but does NOT run collect-signals. The rich-era signals have `detection_method: automated, origin: collect-signals` — confirming collect-signals DID run during Phases 52-54. The thin era produced 0 automated signals.

Whether signal_collection was level 3 (auto) during Phase 52-54 or was manually invoked — I cannot determine from available artifacts. The execute-phase.md workflow at line 514 documents a regime change: "node gsd-tools.cjs automation regime-change 'Auto-collection enabled' --impact..." suggesting automatic collection was added and then changed back. The current level 1 setting explains the thin-era gap.

**What this means:** The signal content comparison shows:
1. Individual signal quality is COMPARABLE across eras. The thin-era signals (especially the exploratory-mode regression signal) are arguably more analytically sophisticated than the average rich-era signal.
2. Signal VOLUME is dramatically different: ~28 signals in 3 rich-era phases vs. ~2 signals in 5 thin-era phases (plus 2 more from April 9 after the regression was identified).
3. The volume gap is STRUCTURAL, not inherent to the thin CONTEXT format. The automation level is currently set to nudge (level 1), which prevents auto-collection. During execution, the execute-phase workflow displays a message and skips. Human execution velocity in the autonomous pipeline (two phases in one session) leaves no time for manual signal collection.
4. Rich-era signals are auto-collected (origin: collect-signals). Thin-era signals are user-observed (origin: user-observation, local, conversation). The qualitative character differs: auto-collected signals include what a git/artifact sensor detects. User-observed signals include only what a human noticed.

**What the Phase 55 12-deviation event means for signal collection:**

Phase 55 plan 02 had 5 execution deviations documented in the SUMMARY. Phase 55 plan 02 was a complex hybrid merge (MODEL_PROFILES dependency, core.cjs overhaul). The signal synthesizer, if run, would have examined these deviation-dense artifacts. No signals were generated. This is direct evidence that collect-signals was not run for Phase 55 — the events occurred, but no sensor analyzed them.

**What would disconfirm the structural cause claim:** If Phase 52-54's signals were not from collect-signals but from manual invocation, the automation-level explanation would be wrong. The signal files themselves say `detection_method: automated, origin: collect-signals` — this is as close to proof as we can get without running git log on when those signals were created vs. when Phase 52-54 executed.

---

## Section E: Pre-Work Provenance

### What I Investigated

I read the headers of the three pre-work artifacts cited by thin-era CONTEXT.md files. I ran git log to find commit provenance. I searched for whether a `/gsdr:drift-survey` command or automated drift-survey workflow exists.

### What I Found

**upstream-drift-survey-2026-04-08.md:**
- Header (line 3-4): "Surveyed by: Claude Sonnet 4.6 (automated)" / "Baseline: v1.30.0 (commit 0fde35ac, 2026-03-27, fork audit freeze)"
- Git commit: `bcd62c46` (2026-04-08 05:51 -0400) — "docs: upstream drift survey — 304 commits, v1.30→v1.34.2"
- Commit message context: "Survey applies fork's 5-class gap taxonomy per FORK-STRATEGY.md."
- Author: Logan Rooks

This document says it was produced by "Claude Sonnet 4.6 (automated)" — but the git author is a human. The commit was made by the user, not an automated workflow. There is no `/gsdr:drift-survey` command in `.claude/commands/gsdr/` — I checked and it does not exist. The commit was made 3 days before Phase 55 context was gathered (Phase 55 CONTEXT.md gathered: 2026-04-08, same day as the commit).

The term "automated" in the header means the document was generated by an AI agent (Claude Sonnet 4.6), but the user initiated it and committed the result. It is NOT the product of an automated workflow that runs on a schedule or trigger. It was a user-initiated research artifact — the user asked Claude to produce a drift survey, then committed it.

**measurement-infrastructure-research.md:**
- No "Surveyed by" or "Mode: automated" header — the header reads "Mode: Custom Research (Ecosystem + Feasibility hybrid)"
- Git commit: `329c6dd6` (2026-04-08 04:02:36 -0400) — "docs: complete custom research for v1.20 milestone scoping"
- Commit message: "4 custom researchers produced: KB architecture... Spike epistemology... Measurement infrastructure: session-meta schema documented..."
- Author: Logan Rooks

This was a user-initiated multi-domain research session producing 4 parallel research documents. The commit message says "4 custom researchers" — meaning 4 separate research agent invocations. This is user-initiated work, not automated workflow output.

**kb-architecture-research.md:**
- Header: "Date: 2026-04-08 / Mode: Custom research (KB architecture, signal schema evolution, query layer design)"
- Same commit: `329c6dd6`

Same provenance as measurement-infrastructure-research.md.

**Does the workflow described in prior audits actually exist?**

audit-review-and-deepening.md (line 136-137): "The drift survey (537 lines) was run by 'Claude Sonnet 4.6 (automated)' per its own header."

This is accurate as quoted but potentially misleading. The document says "automated" but this means "produced by AI" not "triggered by automation." There is no `/gsdr:drift-survey` command. There is no hook or workflow that produces drift surveys automatically. The second audit (correctly) noted: "These are not equivalent to user-initiated pre-work in the sense hypothesized." But then it concluded "The artifacts were tool outputs" — which is accurate — and "but the decision to run those tools may have been driven by the user's sense that the discuss-phase wasn't doing enough." That interpretation remains speculative.

**What this means:** The pre-work artifacts were user-initiated research sessions (the user asked Claude to produce specific research documents) committed 4 days before Phase 55 execution. They are not automated workflow outputs and there is no workflow that would have produced them without user intent. The asymmetry between the thin and rich eras is: thin-era phases had dense pre-work artifacts (537-line drift survey, 4 custom research documents) because the user commissioned them in preparation for v1.20. Rich-era phases had no comparable pre-work documents. This is a genuine asymmetry — the thin era's discuss-phase operated over a richer evidence base than the rich era's.

**What I couldn't determine:** Whether the user commissioned these pre-work documents because they anticipated the discuss-phase --auto would be inadequate, or simply because the domain required external research (drift analysis requires looking at upstream; measurement infrastructure requires surveying what data exists). Both explanations are consistent with the evidence.

---

## Section F: What "Plan Quality" Should Actually Mean

### What I Investigated

I read 2 plans from the rich era (52-01-PLAN.md, 52-05-PLAN.md) and 2 from the thin era (57-01-PLAN.md, 56-01-PLAN.md). For each, I checked: whether the plan implements genuinely investigated decisions, whether the plan questions any CONTEXT.md framing, and whether the plan is building on examined assumptions.

### What I Found

**52-01-PLAN.md (rich era, Wave 1):**

The plan implements decisions from 52-CONTEXT.md that were genuinely investigated:
- Line 64: "The fork's statusline has CI status, health score, health check marker, dev install indicator, and automation level indicator sections that upstream does NOT have -- these MUST be preserved." This prohibition comes directly from 52-CONTEXT.md DC-4 (fork's steering brief model is a fork divergence). DC-4 itself was locked based on explicit investigation of the discuss-phase file structure.
- The plan specifies exact line numbers to modify in hooks/gsd-statusline.js (line 74 of plan: "Replace the existing 80% scaling formula"). These specific facts were determined in research, not guessed.

Does the plan question any CONTEXT.md framing? No explicit questioning — but this is appropriate. The plan is implementing well-grounded decisions.

**52-05-PLAN.md (rich era, Wave 2):**

52-05-SUMMARY.md line 40: "Advisor-researcher agent adopted from upstream to fix broken @-reference in discuss-phase.md (Rule 3 deviation)." This is a deviation that wasn't in the plan — the advisor-researcher wasn't in any earlier plan. This is the dependency miss that sig-2026-03-27-wholesale-workflow-adoption documents. The plan DID NOT question the CONTEXT.md's working assumption A3 ("The 4 new workflows (add-tests, cleanup, health, validate-phase) are standalone additions"), even though A3 should have included a dependency scan. The guardrail G4 ("Do not adopt features that conflict with the fork's epistemic self-improvement pipeline") would have caught this if interpreted broadly enough.

**57-01-PLAN.md (thin era, Wave 1):**

The plan implements all 8 baseline metrics as [grounded] in CONTEXT.md. There is no point where the plan questions whether these 8 metrics are appropriate — the grounding from CONTEXT.md is taken as settled.

The plan (line 67) references: "Create `get-shit-done/bin/lib/telemetry.cjs` following the sensors.cjs / automation.cjs module pattern." This is implemented correctly. The plan has strong technical detail — specific function names, exact import patterns, verification commands.

Does the plan implement decisions that were genuinely investigated? YES for the module architecture (sensors.cjs pattern is well-documented). PARTIALLY for the 8 metrics (they're in the data, but fitness for purpose wasn't examined). NO for whether human-readable-default is appropriate (convention is applied without examination of fit).

Does the plan question any CONTEXT.md decision? No — everything is [grounded] in CONTEXT.md and the plan implements it straightforwardly.

**56-01-PLAN.md (thin era, Wave 1):**

This plan is notable because it implements an OPEN question from CONTEXT.md, not a grounded one. The lifecycle state model conflict (KB-01 vs Phase 31) was labeled [open — critical conflict] in 56-CONTEXT.md. The plan (line 74) says: "Update KB-01 in REQUIREMENTS.md to replace the incorrect lifecycle states with the Phase 31 model." Research confirmed the working assumption (Phase 31 is correct) and the plan implements the confirmed finding.

This is exactly the right behavior: CONTEXT.md opened the question, research resolved it, plan implemented the resolution. The lifecycle state question was not foreclosed — it was examined.

Does the plan question any CONTEXT.md framing? The plan's implementation of Task 1 actually corrects REQUIREMENTS.md, not CONTEXT.md. The CONTEXT.md correctly identified the conflict as open. The plan then fixes the underlying requirements document based on research findings. This is appropriate epistemic behavior.

**The critical comparison:**

For Phase 52, grounded assumptions came from examined working assumptions (A1-A5 in CONTEXT.md, each specifying "Research should verify..."). For Phase 57, [grounded] decisions come from research that confirmed availability, not fitness. The plans then implement those decisions without questioning them.

The difference is: Phase 52's plan implements decisions that were genuinely opened and then resolved. Phase 57's plan implements decisions that were asserted as grounded and then confirmed (at best) or assumed (for some). A plan cannot question a decision marked [grounded] in CONTEXT.md — the [grounded] label is an instruction to the planner to treat the decision as settled.

**What this means:** Plan quality, properly measured, is about whether plans are building on sound foundations. Phase 56's plan builds on sound foundations: the lifecycle state decision was open, investigated, and resolved. Phase 57's plan builds on foundations of varying quality: the module architecture decision is sound; the 8-metric selection and the output format default are not fully examined.

**What would disconfirm this:** If 57-01-PLAN.md contained a line questioning the 8-metric selection or noting that the baseline dimensions should be revisited after Phase 58, the grounding concern would be partially addressed. Reading the plan, there is no such passage.

---

## Findings That Survived Scrutiny

**Finding 1: The thin-era CONTEXT.md does foreclose some questions that should have been open — but not uniformly.**

Evidence chain: The 8-metric baseline decision (57-CONTEXT.md line 38) is grounded in "from available data" (measurement-infrastructure-research.md Section 4), not in fitness for the purpose of detecting post-intervention change. No alternatives were considered in the research. The output format default (57-CONTEXT.md line 26) follows convention without examining whether that convention fits a module whose consumers are primarily agents. These decisions were locked without examining the assumption they depend on ("these metrics are appropriate for detecting the kinds of changes we're planning").

Counterbalancing: The lifecycle state decision in 56-CONTEXT.md (line 20-25) was correctly framed as [open], and research genuinely resolved it. The Phase 55 integration strategy was grounded but revised when research found the MODEL_PROFILES dependency. [grounded] labels are not immutable — research overrides them when complications arise.

**Finding 2: The collect-signals gap is structural, not coincidental, and it is caused by automation level configuration, not CONTEXT.md format.**

Evidence chain: Running `automation resolve-level signal_collection --context-pct 50 --raw` returns `effective: 1 (nudge)`. The execute-phase.md auto_collect_signals step (lines 401-480) documents that level 1 displays a nudge and skips. Rich-era signals have `detection_method: automated, origin: collect-signals`. Thin-era signals have `detection_method: manual, origin: user-observation`. Phase 55 had 5 deviations in Plan 02 and 0 signals generated.

The signal collection gap is caused by automation level, not CONTEXT.md format. However, the automation level at level 1 combined with the high execution velocity of the autonomous pipeline (two phases in one session, per the autonomous-pipeline signal) means signal collection is structurally prevented. This is independent of CONTEXT.md quality — fixing the automation level would restore signal collection regardless of CONTEXT.md format.

**Finding 3: The pre-work artifacts are user-initiated, not automated workflow outputs. No `/gsdr:drift-survey` command exists.**

Evidence chain: `upstream-drift-survey-2026-04-08.md` header says "Surveyed by: Claude Sonnet 4.6 (automated)" but git commit author is Logan Rooks. No `/gsdr:drift-survey` command in `.claude/commands/gsdr/`. Git commit `bcd62c46` is a single-file commit adding the survey. measurement-infrastructure-research.md git commit `329c6dd6` message says "4 custom researchers produced" — user-initiated parallel research invocations.

The second prior audit correctly identified these as "automated pipeline outputs" in the sense that AI produced them, but incorrectly implied they were produced without user intent. They were user-commissioned research sessions.

**Finding 4: Research question format shifted from generative to confirmatory across eras.**

Evidence chain: 52-CONTEXT.md Q1 has 5 fields including "What research should investigate: Diff the two versions structurally. Identify which upstream additions are purely additive..." The question specifies methodology. 55-CONTEXT.md open questions have 3 fields with no research directive. The questions ask "should we include this?" not "how should we investigate the architectural implications of this choice?" Research quality remained high in both eras — but the question FORMAT shifted, and with it the structural pressure toward generative investigation vs. confirmatory lookup.

**Finding 5: The exploratory-mode regression signal's perverse incentive analysis is correct and grounded in workflow text.**

Evidence chain: sig-2026-04-09-exploratory-mode-epistemic-quality-regression (line 55): "The workflow says '--auto only selects grounded.' If the agent knows --auto is active, it is incentivized to mark everything [grounded] so that --auto can proceed without stopping." This accurately describes the execute-phase mechanism (though the relevant workflow is discuss-phase, not execute-phase) — --auto mode selects only [grounded] items for auto-progression. An agent aware of this mode would mark things [grounded] to enable progression.

57-CONTEXT.md Mode line (line 6): "Mode: Exploratory (--auto, grounded selections only)" — this confirms the mode was --auto with grounded-only selection.

---

## Findings That Are Genuinely Uncertain

**Uncertain 1: Whether the rich-era automation level for signal_collection was 3 (auto) during Phase 52-54 execution.**

The rich-era signals have `origin: collect-signals` suggesting it ran. But whether it ran automatically (level 3) or was manually triggered cannot be determined from available artifacts. The execute-phase.md workflow at line 514 documents a regime change event, suggesting the automation level changed at some point. Without STATE.md history or git log of the automation level configuration, I cannot confirm when level 3 was active.

**Uncertain 2: Whether the user commissioned the pre-work research documents because the discuss-phase --auto was inadequate.**

The user may have commissioned the drift survey and custom research because (a) the domain required external research that discuss-phase --auto wouldn't do, or (b) they anticipated inadequate discuss-phase exploration. Both explanations are consistent with the commit history. The motivation cannot be determined from artifacts.

**Uncertain 3: Whether the thin-era's [grounded] decisions caused any execution failure or downstream harm.**

No thin-era phase had a [grounded] decision that was wrong and caused execution failure. Phase 55's MODEL_PROFILES discovery required revising the execution order, but this was caught by research, not exposed as a planning failure. Phase 56's lifecycle state conflict was correctly identified as [open] in CONTEXT.md and resolved by research. For Phase 57 (unexecuted), the 8-metric selection may prove adequate or inadequate — this cannot be known until the baseline is used for comparison.

---

## Corrections to Prior Audits

**Correction to outcome-comparison-audit.md, Section 2.6:**

The audit lists "Possible explanations" for signal density drop without investigating any. The one explanation it should have investigated: automation level. Running `automation resolve-level signal_collection` confirms level is currently 1 (nudge). The execution workflow at level 1 skips signal collection. This is not a possible explanation — it is the confirmed mechanism. The prior audit should have checked this.

**Correction to audit-review-and-deepening.md, Part 2 Section C, line 129:**

"Phase 56 planner corrected CONTEXT.md: updated REQUIREMENTS.md to fix KB-01 lifecycle conflict. The planner was not mechanically implementing CONTEXT.md; they were correcting it based on research."

This mischaracterizes what happened. 56-CONTEXT.md (lines 20-25) explicitly labeled the lifecycle state model as `[open — critical conflict]` and said "Researcher must verify this." The CONTEXT.md did not lock the lifecycle decision — it left it open as a working assumption. The planner implemented the resolution of a correctly-framed open question. The prior audit's "correcting CONTEXT.md" framing implies the CONTEXT.md got it wrong; it actually got it right.

**Correction to audit-review-and-deepening.md, Part 2 Section D, lines 136-140:**

"The pre-work artifacts are automated pipeline outputs... not user-authored compensation."

This is factually correct but presents an incomplete picture. "Automated" in "Claude Sonnet 4.6 (automated)" means AI-produced, not workflow-triggered. No automated workflow exists that would have produced these documents. They required explicit user initiation. The distinction matters: a user who deliberately commissions research artifacts before a discuss-phase session is exhibiting a behavior (compensating for discuss-phase limitations) that the prior audit dismisses by calling it "automated pipeline output."

**Correction to both prior audits regarding "both eras passed verification":**

Phase 57 has no executed plans. The "both eras" claim is accurate for Phases 52-56 but misleading if presented as evidence for Phase 57. The audit's scope includes Phase 57 as a thin-era case, but it has no execution record.

---

## Summary

The core finding this audit can make with confidence is this: the thin-era CONTEXT.md uses [grounded] labels that, in several cases, lock decisions based on availability or convention rather than genuine investigation of fitness. This is not a universal failure — Phase 56's lifecycle state conflict was correctly handled, and Phase 55's integration decisions were appropriately grounded in FORK-DIVERGENCES.md. But the [grounded] label for the 8 baseline metrics and the output format default forecloses exploration that would have been appropriate for a genuinely exploratory discuss-phase session.

The signal collection gap is caused by automation level configuration (currently level 1: nudge), not by CONTEXT.md format. The pre-work artifacts are user-initiated, not automated. The question format shifted from generative to confirmatory, but research quality remained high because researchers investigated even when questions were binary.

The most honest statement of the situation: thin-era phases execute well but observe less. The execution is high quality; the epistemic instrumentation is degraded. These are separable problems. The CONTEXT.md format affects exploration depth; the automation level affects signal collection; the autonomous pipeline velocity affects manual reflection time. All three are currently set in directions that reduce epistemic observation without reducing execution quality.
