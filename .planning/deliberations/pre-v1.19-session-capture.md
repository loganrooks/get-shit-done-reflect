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

## Open Questions for v1.19

1. Which themes to prioritize (sensors, research-grounding, failure attribution, patch workflow, discuss-phase synthesis, lifecycle integration)?
2. Can the patch response workflow be pre-v1.19 infrastructure?
3. What's the minimal viable signal/issue linking?
4. How does the sensor gap relate to M-B (Meta-Observability)?

## Key Artifacts

- Signal audit: `/tmp/signal-audit-report.md`
- Issue triage: from background agent (in conversation context)
- Installer fixes: worktree at `/tmp/gsdr-installer-fix/` (branch `fix/installer-patches-27-home-doubling`, tests passing)
- Epistemic-agency findings: `~/workspace/projects/epistemic-agency/knowledge-base/INDEX.md`
