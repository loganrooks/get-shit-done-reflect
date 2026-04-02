# Pre-v1.19 Session Capture (2026-04-02)

<!--
This was originally written INTO patch-release-workflow-integration.md, 
destroying the original deliberation content. Separated into its own file 
to restore the original deliberation. The overwrite itself is logged as a signal.
-->

**Date:** 2026-04-02
**Status:** Open
**Trigger:** Extended deliberation session that started with patch release workflow and expanded into 7 threads covering harness architecture, sensor gaps, epistemic grounding, and failure attribution.

## Threads Surfaced

### Thread 1: Release Workflow Integration
See `patch-release-workflow-integration.md` for the original deliberation.

### Thread 2: Research-Grounded Evaluation
The harness lacks a meta-learning loop for evaluating its own design evolution. The deliberation template has Predictions/Evaluation sections but:
- Predictions are rarely falsifiable enough
- No research grounding step (arxiv-sanity-mcp, zlibrary-mcp unused in design process)
- Design claims aren't classified by epistemic status (empirical / analogical / assumed)
- The agent presenting proposals can't evaluate its own reasoning (F02, I01)

**Epistemic-agency findings consulted:**
- F47: Automation on proletarianization gradient (execution-safe, judgment-dangerous)
- F45: Premature convergence is a cybernetic variety problem
- F46: Signal systems suffer MAPE blind spot
- F33: Six interaction mechanisms — action guards for irreversible operations
- F04: 74% of production agents use human-in-loop as architecture
- I09: Human provides independent noise distribution AI cannot generate
- F29: Plan visibility doesn't calibrate trust (50% floor)

### Thread 3: Failure Attribution
When the harness fails, we can't trace backward to the responsible component. Signals capture THAT something failed but not WHY at the harness-component level.

### Thread 4: Sensor Gaps

**Proposed new sensors:**
- Chat history sensor (implicit frustration, intervention frequency, dialogue patterns)
- GitHub sensor (other repos' issues, framework changelogs, ecosystem evolution)
- arxiv-sanity-mcp integration (monitor relevant papers)
- Patch system sensor (local patches as signals, differentiate from update lag)
- Sentiment analysis (frustration markers, repeat intervention patterns)
- Cross-project signal propagation (shared KB becoming unwieldy)

**Design considerations (user):**
- Every sensor interprets through a theoretical horizon that should be made explicit
- Levinas: responding to singularity of each situation without betraying other demands
- Benjamin: weak messianic power — record traces for later
- Need deduplication across sensors
- Sufficient exploration without infinite regress

### Thread 5: Patch Response Workflow
Formalized workflow needed:
1. Issue intake (GitHub issues, signals, cross-project observations)
2. Triage (quick-fix / milestone-deferred / hybrid)
3. Quick-fix dispatch (parallel worktrees with quality gates)
4. Release (batch into patch release with CI)
5. Verification (monitor fix effectiveness)
6. Deferred routing (captured for milestone planning)

Currently ad hoc. The cascade failure demonstrated what happens without it.

### Thread 6: Issue/Signal Lifecycle Integration
Signals and GitHub issues track disconnected information:
- Signal schema has no `github_issue` field
- No lifecycle sync mechanism
- Need to decide which system is authoritative

### Thread 7: Discuss-Phase Semantic Gap (Issue #26)
Source (1098 lines, upstream, decision-closing) vs. user's local patch (444 lines, research-opening). Needs synthesis, not selection. Both have features the other lacks.

## Live Incidents During Session

1. **Background agent cascade** (sig-2026-04-02-background-agent-bypassed-quality-gates-broke-global-install): Wrong agent type → installer ran → $HOME/$HOME bug → 91 broken files → untested emergency fix
2. **Meta-signal gap** (sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade): Agent didn't recognize cascade as signal-worthy until prompted
3. **Deliberation overwrite** (sig-2026-04-02-agent-overwrote-deliberation-file): Pre-milestone capture destroyed original A/B/C analysis
4. **Headless session failures**: Two failed launches before successful third attempt

## Signal Audit Results (from background agent)

- **Signal lifecycle system is broken**: 0% remediation rate, 0% verification rate, 0% self-closure
- **7 patch-worthy signals** identified (~2-3 hours total effort)
- **6-7 signals already fixed but still marked active** (lifecycle gaps)
- **2 critical cross-project harness bugs** (model profile mismatch, KB path resolution)

## GitHub Issue Triage Results

| Issue | Classification | Status |
|-------|---------------|--------|
| #15 TOML escape | Quick-fix | Already fixed, needs close |
| #17 Cross-runtime drift | Milestone-deferred | 9 acceptance criteria |
| #26 Discuss-phase semantics | Hybrid | Needs deliberation |
| #27 Patches dir collision | Quick-fix | Fixed in worktree, tests pass |
| (new) $HOME/$HOME installer bug | Quick-fix | Fixed in worktree, tests pass |

## Philosophical Framing (User)

- **Levinas**: Respond to singularity of each situation's demand without betraying other demands
- **Benjamin**: Weak messianic power — record traces for later redemption
- **Heidegger**: Make pre-theoretical horizons explicit for prediction improvement
- **Stiegler**: Proletarianization gradient — execution vs. judgment automation
- **Mayo/Popper/Dewey**: Design for empirical reliability, not a priori guarantees

### Thread 8: Signal Staleness Detection (surfaced during patch triage)

Signals are write-once — once created, nothing re-evaluates them when the codebase changes. The Patch A triage found all 4 "patch-worthy" signals were already resolved, wasting investigation time. A git-aware staleness detector could cross-reference signal tags/referenced files against commits and flag signals for re-evaluation when relevant code changes. Partial infrastructure exists (git sensor, signal tags) but the connection is missing. This directly extends the sensor gap thread (Thread 4) and the signal lifecycle findings from the audit (0% remediation rate).

### Thread 9: Deliberation System Lifecycle Gap (from deliberation usage audit)

32 deliberations in this project, 7 concluded, **0 evaluated**. Predictions recorded but never checked against outcomes. Same lifecycle completion failure as signals. 3 open deliberations identify gaps in the deliberation system itself (provenance, citation stability, workflow stratification) — and are themselves stuck in `open`.

Cross-project pattern: deliberations used as documentation (scope decisions, architecture notes), not as the signal-grounded, prediction-oriented workflow artifacts the template intends. arxiv-sanity-mcp (5), zlibrary-mcp (1), epistemic-agency (2) — all lightweight usage.

No workflow auto-surfaces relevant deliberations during planning. `plan-phase` and `discuss-phase` don't search `.planning/deliberations/`. Integration is entirely manual citation.

### Thread 10: Philosophical Diagnosis Awaiting Operationalization (from philosophical audit)

8 deep philosophical deliberations engaging Stiegler, Levinas, Ashby, Dewey, Cartwright, Habermas, Dreyfus. All open. None concluded. The philosophical stream and engineering stream haven't converged — v1.12-v1.18 shipped features while these stayed in `open`.

**What HAS been operationalized:**
- `deliberate.md` command embeds Dewey, Toulmin, Lakatos, Peirce, Mayo, Popper structurally
- Signal schema's `epistemic-gap` type (from cybernetics concern with blind spots)
- `philosophy/` subdirectory as citable apparatus (23 frameworks, 97 principles)

**Four concrete prescriptions from Trace 008 (unbuilt):**
1. Epistemic health probes (variety, warrant-source, signal-coverage-gap, pharmacological)
2. Adversarial deliberation step in discuss/plan workflows
3. Warrant typing for signals (`observer` / `computation` / `generator`)
4. Requisite variety metrics (explore-to-converge ratio)

**Deepest unoperationalized insight:** The proletarianization gradient (Stiegler/F47). Automation levels 0-3 exist but don't classify which functions are execution-safe vs. judgment-dangerous. The gap is not just classification but response — as the user noted, the answer is not "always monitor judgment operations" but rather designing quality gates, review agents, deterministic hooks, and damage mitigation (version control, reversibility) that respond to criticality with appropriate seriousness. The space of possible responses should remain open rather than prematurely closed.

**The F01 recursion:** Philosophical deliberations about GENERATOR quality are themselves GENERATOR outputs. Only OBSERVER evidence (Trace 008's 218 sessions of usage data) partially grounds them. The Levinas and Derrida work has no such grounding — it is philosophical reasoning the harness cannot confirm or refute empirically. This is not a deficiency but a condition to acknowledge.

**The translation problem:** The deepest philosophical insights (forms-excess, responsibility-alterity, constitutive lock-in) correctly resist checklist translation. But without a middle ground between pure aspiration and procedural enforcement, they remain perpetually deferred. The `structural-norms` deliberation proposes a three-layer distinction (declarative/procedural/structural) that could serve as this middle ground.

### Thread 11: Signal Hermeneutics (from user)

A signal is not simply a fact waiting to be fixed. It can be read multiple ways:
- As a symptom requiring an immediate patch
- As indicative of something structural rather than accidental
- As one element in a constellation that only becomes legible with other signals

The reading and the problem come into being retroactively — signals now can change possible readings of signals past. Future signals change what will have been read in signals past. This is a hermeneutic, not a diagnostic, relationship to the KB.

The implication: the harness should support **re-reading** signals in light of new evidence, not just triaging them as individual items. The signal staleness detection (Thread 8) is one aspect of this. But the deeper point is that signal interpretation is not fixed at detection time — it evolves as context accumulates. We should experiment with performing such readings on our own signal history.

This connects to the question of whether we should resign ourselves to constant monitoring of "dangerous" functions. The user's position: rather than framing judgment-dangerous operations as permanently requiring human oversight, design quality gates, review mechanisms, deterministic hooks, and damage mitigation that respond to criticality proportionally. The aim is iterative reduction of failure probability — preventively and proactively where possible, reactively where necessary. Version control is one damage mitigation mechanism; there are others. This response space should remain open.

### Thread 12: Unified Fix/Feature Lifecycle (from session practice)

What we improvised this session:
```
Detection (signal/issue/conversation/cross-project)
    ↓
Qualification (validate against current state)
    ↓
Scoping (patch / deliberation / milestone-phase)
    ↓
Deliberation (if design needed — with predictions)
    ↓
Delegation (proposed → in-progress → complete)
    ↓
Verification (CI, tests, signal recurrence check)
    ↓
Release (patch or milestone)
    ↓
Evaluation (did predictions hold? did signals recur?)
    ↓
Learning (update KB, close signals, evaluate deliberations)
```

Missing lifecycle states identified: `proposed`, `delegated`/`in-progress`, `deferred`, `blocked`, `superseded`. Current states (detected → triaged → remediated → verified) are too coarse — "triaged" means everything from "glanced at" to "deliberately deferred for 6 months."

### Thread 13: Multi-Node KB Bridge (apollo ↔ dionysus)

117 signals on apollo, fully siloed. No propagation mechanism — SyncThing broken since 2025-12, no rsync, no git bridge. 21 critical signals including 2 fresh harness bugs (model-resolver keyed on `gsd-*` not `gsdr-*`, discuss-mode config wiring unowned). Apollo has signals from projects that don't exist on dionysus (blackhole-animation, pdfagentialconversion).

Minimum bridge: `rsync --ignore-existing` pull from apollo → dionysus before reflect runs. But the deeper question is interpretive routing — harness-level signals should flow to the development project, project-specific signals should stay contextual. A signal about Codex quality-profile mismatch in blackhole-animation is about the harness, not about animation. The routing requires the kind of reading described in Thread 11.

New GitHub Issue #30 filed from apollo: model-resolver `gsd-*` key mismatch. Directly relevant to development here.

### Thread 14: Cross-Model Review (GPT 5.4 ↔ Claude)

User discovered that having one model review the work of the other exposes blind spots neither can find alone. This is I09 (variety amplification) made concrete — each model's noise distribution is independent. Architecturally significant for quality gates on judgment-dangerous operations. Could be an optional setup for users with both Claude and Codex subscriptions. Connects to Thread 10 (proletarianization gradient) — cross-model review is a mechanism for maintaining epistemic agency at higher automation levels.

### Thread 15: Involuntary Memory / Context Injection

SessionStart hooks already exist for health checks. Same mechanism could inject: relevant KB context, stale deliberation alerts, unreleased change counts, cross-project signal summaries. The infrastructure is partially there. This connects to Thread 9 (deliberation auto-surfacing) and Thread 4 (sensor gaps). The "involuntary" aspect is important — the system should surface context the user didn't ask for but needs, not wait to be queried.

### Thread 16: Cross-Platform Parity and Graceful Degradation

Codex and Claude Code have different capabilities, different model behaviors, different failure modes. GPT 5.4 has quirks Claude doesn't and vice versa. The harness needs thorough understanding of each platform's features, what needs modification to work, and graceful degradation paths. This extends the existing capability matrix and cross-runtime parity work (v1.14, v1.17 QTs) but requires ongoing monitoring as platforms evolve. Connects to the GitHub sensor proposal (Thread 4) — monitoring platform changelogs.

### Thread 17: User Feedback and Community Design

Beyond GitHub Issues. The harness needs feedback mechanisms responsive to the plurality of situations users encounter. Not just a bug tracker but something that can capture the kind of situated, contextual observations that this session produced. The `community-feedback-pipelines-and-dialogue-forms.md` deliberation is open and addresses this. The challenge: designing for a plurality of concrete situations while maintaining the signal/deliberation infrastructure that enables systematic response.

### Thread 18: Signal Readings and Contextual Interpretation (expanded from Thread 11)

When signals or deliberations are cited in future contexts, they should be read both within their original situated context AND for what they signify beyond that context. A deliberation marked "stale" because its immediate concern was addressed may still carry a demand — the structural condition it pointed to may manifest differently elsewhere. Marking something "remediated" closes one reading but shouldn't foreclose others.

The user's framing: "the very responsiveness of the response, the demandingness of the demand, are timeless and eternal" — even when the situation that produced a signal no longer obtains, the responsibility it articulated presents itself differently in different contexts. This is not mysticism but a practical design consideration: the KB should support re-reading, not just retrieval.

Practice opportunity: revisit "stale" / "remediated" signals from this session to test whether deeper readings are available beyond the symptom/fix reading that justified the status transition.

## Session Outcomes (Concrete)

| Outcome | Detail |
|---------|--------|
| v1.18.1 released | Installer fixes: patches dir collision (#27) + $HOME doubling |
| v1.18.2 released | execute-phase branching strategy (6 signals) + merge policy + KB cleanup |
| #15 closed | Verified fixed (QT-22, v1.17.2) |
| #27 closed | Fixed in v1.18.1 |
| 16 signals remediated | First lifecycle transitions in KB history |
| 144 test artifacts purged | 70% noise reduction in global KB |
| KB schema standardized | Date formats, missing IDs, field consistency |
| 5 new signals from session | Cascade failure, meta-signal gap ×2, deliberation overwrite, self-execution default |
| 3 audit reports | Critical signals, notable signals (sample), KB hygiene |
| 2 research reports | Deliberation usage across projects, philosophical deliberation analysis |

## Open Questions for v1.19

1. Which themes to prioritize? Candidates: sensors, research-grounding, failure attribution, patch workflow, discuss-phase synthesis, lifecycle integration, Trace 008 prescriptions, deliberation lifecycle, signal hermeneutics
2. Can the patch response workflow be pre-v1.19 infrastructure?
3. What's the minimal viable signal/issue linking?
4. How does the sensor gap relate to M-B (Meta-Observability)?
5. Should concluded deliberations be evaluated before starting new milestone work?
6. How to operationalize the proletarianization gradient without premature closure?
7. How to design the "middle ground" between philosophical aspiration and procedural enforcement?
8. Can we experiment with hermeneutic re-reading of signal history?

## Key Artifacts

- Signal audit: `/tmp/signal-audit-report.md` (copy to `.planning/` before session end)
- Deliberation usage audit: agent output (in conversation context)
- Philosophical audit: agent output (in conversation context)
- Epistemic-agency findings: `~/workspace/projects/epistemic-agency/knowledge-base/INDEX.md`
- Trace 008 (cybernetic synthesis): `~/workspace/projects/epistemic-agency/traces/008-cybernetic-synthesis.md`

## GitHub Issues Status

| # | Title | State | Action |
|---|-------|-------|--------|
| 15 | Codex TOML escape | CLOSED | Verified + closed this session |
| 17 | Cross-runtime drift | OPEN | Milestone-deferred (9 acceptance criteria) |
| 26 | Discuss-phase semantics | OPEN | Needs deliberation (exploratory vs decision-closing synthesis) |
| 27 | Patches dir collision | CLOSED | Fixed in v1.18.1 |
