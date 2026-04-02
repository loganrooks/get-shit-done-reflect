# Deliberation: Patch Release Workflow Integration

<!--
Started as "how should release connect to workflows" — expanded through conversation
into a broader examination of harness responsiveness, epistemic grounding, sensor gaps,
failure attribution, and the meta-learning loop. This deliberation now serves as the
primary pre-milestone capture for v1.19 scoping.
-->

**Date:** 2026-04-02
**Status:** Open
**Trigger:** Conversation observation — reviewing pending todos between milestones surfaced the question of how quick tasks get released. The v1.18 handoff flagged: "Release workflow gap: complete-milestone doesn't include version bump, GitHub Release creation, or multi-runtime install." Investigation expanded into harness-level design questions.
**Affects:** harness architecture, automation framework, signal system, sensor design, workflow integration, milestone scoping
**Related:**
- sig-2026-02-17-release-process-fragile-manual-steps
- sig-2026-03-30-release-workflow-forgotten-in-milestone-completion
- sig-2026-04-02-background-agent-bypassed-quality-gates-broke-global-install
- sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade
- `.planning/deliberations/development-workflow-gaps.md`
- `.planning/deliberations/sensor-expansion-and-harness-integration-gaps.md`
- `.planning/deliberations/v1.17-plus-roadmap-deliberation.md` (M-B, M-C, M-E themes)
- GitHub Issues #15, #17, #26, #27

## Situation

### The Original Question
`/gsdr:release` exists and works but nothing connects it to the workflows that produce releasable work. Two seams (milestone completion, quick task completion) have no release integration. The concept of "unreleased work" has no state representation.

### What the Investigation Revealed

The release gap is one instance of a systemic pattern. Investigation uncovered:

**6 workflow integration gaps** — capabilities that exist but aren't wired to the workflows that should trigger them (release, multi-runtime install, test running, PR creation, deliberation surfacing, codebase doc refresh).

**Automation framework has never fired** — signal collection postlude: 0 fires, 6 skips (100% skip rate). Reflection: 0 fires, disabled. The pattern proposed for extension has no empirical track record of success.

**Research grounding exposed weak reasoning** — the initial proposal (declarative integration points governed by automation levels) was pattern-matching, not evidence-based. Epistemic-agency corpus findings (F47, F45, F46, F33, F04, I09) challenged the framing.

**Live cascade failure demonstrated the gaps** — background agent (wrong type: executor not quick) ran installer → $HOME/$HOME bug broke 91 files → emergency sed fix without tests/CI/release. Agent didn't self-signal. User had to prompt signal creation. (sig-2026-04-02-background-agent-bypassed..., sig-2026-04-02-agent-failed-to-self-signal...)

**174 unresolved signals, 12 open deliberations, 4 GitHub issues** — the signal lifecycle isn't flowing. Signals are captured but rarely processed through triage → remediate → verify. Cross-project signals (30 from 5 projects) aren't synthesized for harness-level patterns.

### Evidence Base

| Source | What it shows | Corroborated? |
|--------|--------------|---------------|
| complete-milestone.md | No release step, wrong tag prefix, no version bump | Yes |
| quick.md | No release awareness at completion | Yes |
| config.json automation stats | signal_collection: 0 fires / 6 skips | Yes |
| KB index | 174 active signals, 24 critical | Yes |
| GitHub Issues #15,#17,#26,#27 | Cross-runtime drift, installer bugs, semantic divergence | Yes |
| Cross-project signals | Same failure modes (quality profile mismatch, CI masking) recur across projects | Yes |
| v1.18 release incident | Steps forgotten, stale assumptions, manual recovery | Yes (2 signals document it) |
| This session's cascade | Wrong agent type → installer break → emergency patch → no self-signal | Yes (2 signals document it) |

## Framing

**Core question:** When work produces releasable changes — whether a milestone or between-milestone quick tasks — how should the release step be connected to the workflow that produced the changes?

**Adjacent questions surfaced during investigation:**

1. **How should the harness evaluate its own proposed changes?** (research-grounding gap)
2. **What's the right relationship between automation and human epistemic agency?** (F47 execution/judgment distinction)
3. **How do we prevent path-dependent local optima in harness evolution?** (I07, F39)
4. **How can the harness respond to multiple demands in parallel with quality guarantees?** (headless delegation, patch workflow)
5. **How should signals and GitHub issues relate?** (dual lifecycle, linking infrastructure)
6. **What sensors are missing?** (chat history, GitHub, arxiv, patches, sentiment, cross-project)
7. **How do we measure whether features actually work after implementation?** (lifecycle monitoring)
8. **How can we respond to the singularity of each situation's demand without betraying other demands?** (Levinas)

## Analysis

### Thread 1: Release Workflow (The Original Question)

The configurable integration approach (automation levels 0-3 governing release behavior) is sound in principle but ungrounded empirically. The automation framework it would extend has never fired. Before building more integration points:
- Evaluate whether existing integrations deliver their promises
- Fix the immediate gap (wire release into complete-milestone as a workflow step)
- Design structural constraints for mechanical failures (ordering, chaining)
- Keep judgment decisions (when to release) with the human, improve decision support (unreleased change visibility)

### Thread 2: Research-Grounded Evaluation

The harness lacks a meta-learning loop for evaluating its own design evolution. The deliberation template has Predictions/Evaluation sections but:
- Predictions are rarely falsifiable enough
- No research grounding step (arxiv-sanity-mcp, zlibrary-mcp unused in design process)
- Design claims aren't classified by epistemic status (empirical / analogical / assumed)
- The agent presenting proposals can't evaluate its own reasoning (F02, I01)

**Epistemic-agency findings relevant:**
- F47: Automation exists on a proletarianization gradient (execution-safe, judgment-dangerous)
- F45: Premature convergence is a cybernetic variety problem
- F46: Signal systems suffer the MAPE blind spot (plan-conformance, not planning-quality)
- F33: Six interaction mechanisms — action guards for irreversible operations
- F04: 74% of production agents use human-in-loop as architecture, not workaround
- I09: Human provides independent noise distribution AI cannot generate
- F29: Plan visibility doesn't calibrate trust (50% floor)

### Thread 3: Failure Attribution

When the harness fails, we can't trace backward to the responsible component. The v1.18 release signal says "steps were missed" but doesn't distinguish workflow gap vs. automation-level problem vs. agent instruction-following failure vs. architectural flaw. The signal system captures THAT something failed but not WHY at the harness-component level.

### Thread 4: Sensor Gaps (from user's message)

**Proposed new sensors:**
- **Chat history sensor**: Detect implicit frustration, intervention frequency, dialogue patterns. The most significant failure in the 2026-04-02 session was invisible to every existing sensor because it happened in dialogue, not committed code.
- **GitHub sensor**: Monitor issues in other repos, other frameworks' changelogs, agentic harness ecosystem evolution.
- **arxiv-sanity-mcp integration**: Monitor for new relevant papers on harness design.
- **Patch system sensor**: Local patches as signal source — detect patches in GSDR/GSD/other installations, differentiate from update lag.
- **Sentiment analysis**: Frustration markers, repeated intervention patterns, anger as signal weight.
- **Cross-project signal propagation**: The shared ~/.gsd/knowledge is becoming unwieldy.

**Design considerations raised by user:**
- Every sensor interprets through a theoretical horizon that should be made explicit
- Drawing on Levinas: responding to the singularity of each situation without betraying other demands
- Benjamin's weak messianic power: at minimum record traces for later
- Deduplication across sensors (don't revisit same issues/changelogs)
- Sufficient exploration without infinite regress

### Thread 5: Patch Response Workflow (Not Yet Formalized)

The session revealed the need for a formalized patch response workflow:
1. Issue intake (GitHub issues, signals, cross-project observations)
2. Triage (quick-fix / milestone-deferred / hybrid)
3. Quick-fix dispatch (parallel worktrees with quality gates)
4. Release (batch into patch release with CI)
5. Verification (monitor fix effectiveness, close issues, check signal recurrence)
6. Deferred routing (captured for milestone planning)

This doesn't exist. Current approach is ad hoc — and the cascade failure demonstrated what happens without it.

### Thread 6: Issue/Signal Lifecycle Integration

Signals and GitHub issues track related but disconnected information:
- Signal schema has no `github_issue` field
- GitHub issues have no structured signal reference
- Two independent lifecycles (signal: detected→triaged→remediated→verified; issue: open→closed)
- No sync mechanism

Filing GitHub issues from signals without linking infrastructure creates maintenance burden. Need to decide: which system is authoritative? Should signals drive issues, issues drive signals, or bidirectional?

### Thread 7: Discuss-Phase Semantic Gap (Issue #26)

The source discuss-phase (1098 lines, upstream) and the user's local patch (444 lines) implement fundamentally different philosophies:
- **Source**: Decision-closing (pick recommended defaults, lock them, advance pipeline)
- **User's patch**: Research-opening (preserve uncertainty, epistemic guardrails, never lock merely for completeness)

Both have valuable features the other lacks. Needs synthesis, not selection. The source has KB surfacing, codebase scouting, advisor agent. The patch has four-cause classification, derived constraints, epistemic guardrails, open questions as default home.

## Philosophical Framing

The user raised several philosophical considerations that should inform v1.19 design:

**Levinas** — Responding to the singularity of each situation's demand without betraying the demands of every other project/situation. The harness must differentiate between how a project-local signal should be interpreted within that project vs. how it should inform harness development.

**Benjamin** — Weak messianic power: at minimum, record the traces of failures and demands for later redemption. The signal system is this mechanism — but it only works if signals are created (the meta-signal gap).

**Heidegger** — The pre-theoretical horizon from which predictions are projected should be made explicit. When we predict that a design change will improve reliability, what theoretical framework is that prediction grounded in? Making this explicit allows discrepancies to improve future predictions.

**Stiegler** — Proletarianization gradient: automating execution is safe, automating judgment is dangerous. The 4-level system treats all automation the same. F47 from the epistemic-agency corpus formalizes this.

**Mayo/Popper/Dewey** — We can't prove a design "works" a priori. We can only corroborate through severe testing and observe empirical reliability. "Structurally unfailable" is an overconfident claim. "Empirically very rarely fails" is testable.

## Live Actions Taken

### During this session:
- Created 2 signals (cascade failure + meta-signal gap)
- Fixed $HOME/$HOME in 91 installed files (emergency, not source)
- Verified Issue #15 already resolved (all TOML files parse OK)
- Launched headless Claude session for installer fixes (#27 + $HOME/$HOME source fix)
- Launched signal audit agent (174 signals: patch-worthiness, lifecycle accuracy, cross-project harness bugs)
- Identified discuss-phase source vs. local patch gap (Issue #26)
- Discovered Issue #27 (patches dir collision) — filed same day

### GitHub issue triage results:
| Issue | Classification | Status |
|-------|---------------|--------|
| #15 TOML escape | Quick-fix | Already fixed, needs verification + close |
| #17 Cross-runtime drift | Milestone-deferred | 9 acceptance criteria, multi-phase |
| #26 Discuss-phase semantics | Hybrid | Path alignment quick-fix + semantic deliberation |
| #27 Patches dir collision | Quick-fix | Being fixed in headless session |

## Predictions

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Signal audit will find >30% of critical signals already remediated but still active | Audit completion | <10% are stale |
| P2 | Cross-project signals will reveal ≥3 harness-level bugs not yet tracked | Audit completion | All cross-project signals are project-specific |
| P3 | The headless Claude session will complete the installer fixes with passing tests | Session completion | Tests fail or fixes incomplete |
| P4 | Issue/signal lifecycle integration will be needed before v1.19 completion | v1.19 midpoint | Manual tracking remains sufficient |

## Open Questions (For v1.19 Scoping)

1. Which of the 5+ milestone themes (sensors, research-grounding, failure attribution, patch workflow, discuss-phase synthesis, lifecycle integration) should v1.19 prioritize?
2. Should v1.19 focus on one theme deeply or address multiple themes incrementally?
3. How does the sensor gap relate to M-B (Meta-Observability) from the roadmap deliberation?
4. Can the patch response workflow be built as part of v1.19, or should it be a pre-v1.19 infrastructure piece?
5. What's the minimal viable linking between signals and GitHub issues?

## Decision Record

**Decision:** {pending — this deliberation informs v1.19 scoping, not a single decision}
**Signals addressed:** sig-2026-02-17, sig-2026-03-30, sig-2026-04-02 (×2)

## Evaluation

**Evaluated:** {pending}
