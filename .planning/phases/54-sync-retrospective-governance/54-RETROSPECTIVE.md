# v1.18 Sync Retrospective

**Date:** 2026-03-28
**Milestone:** v1.18 Upstream Sync & Deep Integration
**Scope:** Phases 45-53 + 48.1 (10 phases + 1 inserted)
**Duration:** ~19 days (2026-03-10 to 2026-03-28)
**Plans executed:** 32
**Total execution time:** ~169 minutes (~2.8 hours)
**Average plan duration:** 5.3 minutes

## Scope Summary

v1.18 set out to properly adopt upstream changes informed by the fork audit, redistribute the fork's 2,126 lines across upstream's modular structure, harden the migration and upgrade authority model, and ensure adopted features integrate deeply with the fork's epistemic self-improvement pipeline. The milestone was scoped against the `v1.22.4` baseline -- deliberately frozen to prevent scope creep from upstream's rapid release cadence.

What it accomplished: a complete modular restructuring (gsd-tools.cjs from 3,200 lines to 1,239 lines with 16 `lib/*.cjs` modules), a manifest-driven config migration system, a hardened update/install path, adoption of 5 upstream features (context-monitor, Nyquist auditor, code-aware discuss-phase, 4 workflows, utility improvements), and deep integration of all adopted features into the fork's signal/automation/health/reflection pipeline. The milestone also produced a first-of-its-kind upstream drift retriage (Phase 48.1) that classified 372 post-baseline commits and established a pattern for handling live upstream drift.

## What Worked

### Baseline-Freeze + Explicit-Retriage Pattern

Phase 48.1 was inserted mid-milestone when upstream's `main` branch reached 372 commits past the `v1.22.4` audit baseline. Rather than silently absorbing this drift or pretending it didn't exist, the project created an explicit retriage phase that:

- Froze scope at the audit baseline
- Classified all 372 post-baseline commits into 11 clusters (C1-C11)
- Routed each cluster to specific v1.18 phases or deferred to future milestones
- Zero "must-integrate-now" items -- all 9 fold-into clusters were absorbed by designated phases

**Why it worked:** The retriage converted ambient scope pressure into discrete routing decisions. After 48.1, no phase discovered unexpected upstream dependencies. This pattern should be formalized for any sync spanning more than one upstream release.

### Modular Adoption Strategy (Phases 45-48)

The four-phase approach (rename -> adopt modules -> extract fork -> extend & verify) followed research's recommendation and proved highly effective:

| Phase | Duration | What It Did |
|-------|----------|-------------|
| 45 | 8 min (2 plans) | CJS rename with zero behavioral change |
| 46 | 30 min (4 plans) | Adopted 11 upstream modules, rewrote dispatcher |
| 47 | 24 min (2 plans) | Extracted 5 fork modules in dependency order |
| 48 | 15 min (2 plans) | Extended frontmatter/init with fork additions |

Each phase was clean, well-scoped, and fast. The strategy's strength was that each phase had a single clear transformation, making verification straightforward: "does the same command produce the same output before and after?" All 278 existing tests passed unchanged throughout.

### Deep Integration Standard (Phase 53)

Requiring adopted features to connect to the fork's epistemic pipeline (signals, automation, health, reflection) prevented shallow adoption. Without this standard, adopted features would have been isolated patches -- technically present but epistemically invisible.

Concrete examples:
- **Context-monitor -> bridge file -> automation deferral**: Bridge file data replaced wave-count estimation for context-aware automation triggering
- **Nyquist auditor -> artifact sensor -> signals**: Validation gaps in VALIDATION.md are detected by the artifact sensor and flow into the knowledge base
- **Discuss-phase -> KB knowledge surfacing**: The adopted codebase-scouting workflow now surfaces relevant KB knowledge alongside code context
- **Cleanup workflow -> fork protection**: FORK_PROTECTED_DIRS prevents accidental deletion of `.planning/knowledge/`, deliberations, and backlog

### Research-Informed Planning

Every phase began with research that provided:
- Code examples with exact line numbers
- Consumer maps identifying all affected files
- Architecture patterns the executor could apply directly
- "Don't hand-roll" guidance to prevent reinventing existing solutions

Evidence: the modularization phases (45-48) had near-zero deviations. The research investment in per-module diff analysis and consumer mapping meant executors knew exactly what to change and what to preserve.

### Phase Completion Speed

The average plan duration of 5.3 minutes across 32 plans reflects the effectiveness of the research-informed planning pattern. For comparison:

| Milestone | Plans | Avg Duration | Total Time |
|-----------|-------|-------------|-----------|
| v1.12 | 25 | 2.8 min | 70 min |
| v1.13 | 18 | ~4.4 min | ~70 min |
| v1.16 | 20 | ~3.4 min | ~67 min |
| v1.18 | 32 | 5.3 min | 169 min |

v1.18's higher average reflects the greater complexity of modularization and integration tasks compared to greenfield development. The 20-minute outlier (Phase 46 P02 -- dispatcher rewrite) was the single most complex plan, yet still completed within one execution session.

## What Didn't Work

### Drift Management Between Ledger Snapshots

The drift ledger (Phase 48.1) was a point-in-time snapshot at v1.28.0. By Phase 54, upstream reached v1.30.0 with 40 additional commits (v1.29.0: Windsurf runtime, agent skill injection; v1.30.0: GSD SDK headless CLI). The ledger became partially stale within 4 days.

**Root cause:** The ledger assumes a stable upstream during fork execution. Upstream's release cadence (~2 releases per week) makes this assumption invalid for any milestone spanning more than one week.

**Impact:** INF-09 (outstanding changes assessment) must extend the ledger rather than assuming it is complete. Future milestones need either more frequent drift checks (expensive) or explicit acceptance that the ledger is approximate and covers a known scope window.

### Scope Discovery During Execution

Several phases discovered scope that research and planning could not have predicted:

- **Phase 46-02** (dispatcher rewrite): The most complex plan at 20 minutes revealed that fork overrides needed a specific extension pattern (`module.exports.funcName`) not anticipated in research
- **Phase 52-02**: Discovered that discuss-phase.md referenced `advisor-researcher` agent not yet adopted (Rule 3 deviation to adopt it)
- **Phase 53**: Discovered bridge file staleness thresholds and `task_tool_dependent` configuration requirements during integration testing

The plan-accuracy signal theme (10 signals across the project lifetime) reflects this structural tendency. Research can analyze code structure but cannot fully predict runtime integration behavior.

### Progress Telemetry Staleness

STATE.md reported 91% completion when actual completion was 100%. Root cause: `writeStateMd()` only runs when some state field is explicitly updated, and `cmdStateUpdateProgress()` was not called after the last plans completed. The YAML frontmatter and body Progress bar both reflected the last state write, not current reality.

This created a misleading signal -- the project appeared incomplete when it was not. The fix is a lifecycle issue (ensure progress updates run at the right points), not a computation bug.

### CI Verification Gaps

The CI status cache (`gsd-ci-status.json`) uses a global path that does not include project or branch identity. When working across multiple projects or branches, cache reads can return stale or wrong-project status. This was identified but not addressed during the execution phases (deferred to Phase 54 INF-01).

More broadly, the fork's CI hooks fire reliably but the status information they write can become stale or misleading when the working context changes.

## Sync-Round Issues Needing Future Attention

These are problems discovered during the v1.18 sync that should be addressed in future milestones:

### 1. Scope Revision Protocol Absence

**Signal:** `sig-2026-03-28-eager-bypass-of-protocol-when-scope-needs-revision`

When a plan discovers scope that doesn't match its original specification, there is no formal protocol for revising scope mid-execution. Current behavior: the executor applies deviation rules (Rules 1-3) or stops for architectural decisions (Rule 4). But there is no mechanism for an executor to say "this plan's scope is wrong and should be revised" without either completing it as-is or abandoning it.

**Needed:** A scope-revision protocol that allows mid-execution plan amendment with traceability. This is distinct from deviation handling (which assumes the plan is correct but encounters unexpected obstacles).

### 2. Squash Merge Traceability Loss

**Signal:** `sig-2026-03-28-squash-merge-destroys-commit-history`

PR merges that use squash lose individual commit history. For a project that commits each task atomically and tracks commit hashes in SUMMARY.md files, squash merging destroys the very traceability the commit protocol creates. Git blame becomes less useful for understanding phase-by-phase evolution.

**Needed:** Merge strategy policy that preserves individual commits (the user has already expressed preference for `--merge` over `--squash`). This should be codified in FORK-STRATEGY.md or the agent protocol.

### 3. Phase Transition Skips PR Workflow

**Signal:** `sig-2026-03-28-offer-next-skips-pr-workflow`

The "offer next steps" pattern at phase completion sometimes skips the PR creation/merge step, jumping directly to the next phase. This means work can accumulate on a branch without being merged to main, creating:
- Divergence between the working branch and main
- Missed CI verification
- Lost merge points for traceability

**Needed:** The phase-completion workflow should require a PR step (or explicit opt-out) before transitioning to the next phase.

### 4. Stale Deliberation References

Multiple phases referenced deliberations that informed planning but were not yet concluded. The deliberation-as-planning-input pattern works, but there is no mechanism to track which deliberations a phase consumed and whether those deliberations were later revised.

**Needed:** Deliberation consumption tracking -- when a phase uses a deliberation as input, record which version/revision was consumed, so future phases can detect if their foundational deliberation has been updated.

### 5. Quick Task Sprawl Within Milestones

The v1.18 milestone included 16 quick tasks (QT22-34 plus several infrastructure fixes) in addition to 32 phased plans. Quick tasks are useful for isolated fixes, but at this volume they represent a parallel track of work that is not reflected in the roadmap's progress tracking. Some quick tasks (QT33 -- reconcile stacked phases into PR) were actually significant integration work.

**Needed:** A threshold or policy for when quick tasks should become phased plans. When quick task volume exceeds ~5 per milestone, consider whether the work should be scoped as a phase.

## Quantitative Summary

| Metric | Value |
|--------|-------|
| Phases | 10 + 1 inserted (48.1) |
| Plans executed | 32 |
| Duration | ~19 days (2026-03-10 to 2026-03-28) |
| Total execution time | ~169 minutes (~2.8 hours) |
| Average plan duration | 5.3 minutes |
| Median plan duration | 4.5 minutes |
| Longest plan | 20 min (46-02: dispatcher rewrite) |
| Shortest plan | 2 min (multiple: 46-01, 49-01, 50-03, 52-02, 52-03, 53-03, 53-04) |
| Tasks per plan | 2 (median and mode, 1 outlier at 49-01) |
| Signals generated (v1.18 era, 2026-03-10 to 2026-03-28) | ~21 (dates within range in KB index) |
| Total KB signals (project lifetime) | 139 |
| Dominant signal theme | deviation (38 signals, 27% of all signals) |
| Quick tasks during milestone | 12 (QT22-34, excluding pre-milestone QTs) |

## Phase-by-Phase Performance

| Phase | Plans | Duration (total) | Key Outcome |
|-------|-------|----------|-------------|
| 45: CJS Rename | 2 | 8 min | Renamed gsd-tools.js to gsd-tools.cjs, updated 66 source refs, zero behavioral change |
| 46: Upstream Module Adoption | 4 | 30 min | Adopted 11 upstream lib/*.cjs modules, rewrote dispatcher, shared helpers in core.cjs |
| 47: Fork Module Extraction | 2 | 24 min | Extracted 5 fork modules (sensors, backlog, manifest, automation, health-probe) |
| 48: Module Extensions | 2 | 15 min | Extended frontmatter.cjs + init.cjs with fork additions, all 278 tests green |
| 48.1: Drift Retriage | 1 | 4 min | Classified 372 upstream commits into 11 clusters, zero must-integrate-now items |
| 49: Config Migration | 4 | 16 min | Manifest migrations[], depth-to-granularity rename, upstream drift clusters C3/C5/C6/C8/C9 |
| 50: Migration Test Hardening | 5 | 21 min | Full-corpus namespace scan, N-run idempotency, crash recovery, behavioral equivalence |
| 51: Update System Hardening | 3 | 14 min | Migration guide generation, stale file cleanup, C1/C5/C6/C7 integration, e2e upgrade test |
| 52: Feature Adoption | 5 | 22 min | Context-monitor, Nyquist auditor, discuss-phase scouting, 4 workflows, shell robustness |
| 53: Deep Integration | 4 | 11 min | Bridge file automation, artifact sensor VALIDATION.md, KB surfacing, fork protection |

**Total:** 32 plans in 169 minutes across 11 phases.

**Fastest phase:** Phase 48.1 (4 min, 1 plan) -- retriage was a well-scoped classification exercise.
**Slowest phase:** Phase 46 (30 min, 4 plans) -- dispatcher rewrite was the most architecturally complex transformation.

## Signal History Analysis

The fork's knowledge base contains 139 signals across the project's lifetime (v1.12 through v1.18). The v1.18 era generated approximately 21 signals (those dated 2026-03-10 through 2026-03-28), though some signals from this period relate to quick tasks and pre-execution work rather than the phased milestone execution.

### Signal Theme Distribution (Full KB)

| Theme | Count | What It Reveals |
|-------|-------|----------------|
| deviation | 38 | Plan execution rarely matches plan specification exactly; most deviations are auto-fixable (Rules 1-3) |
| testing | 13 | Test-related issues surface regularly -- gaps, regressions, count mismatches |
| config | 12 | Configuration handling is a persistent source of bugs and confusion |
| plan-accuracy | 10 | Plans often miss dependencies, edge cases, or second-order effects |
| CI | 8 | CI pipeline issues (ignored failures, cache bugs, coverage gaps) |
| workflow-gap | 4 | Missing workflow steps (scope revision, PR creation, checkpoint handling) |

### v1.18-Era Signal Themes

The recent signals (March 2026) show an evolution toward **process-level** concerns rather than code-level bugs:

- **Squash merge traceability** (sig-2026-03-28): A governance/process issue, not a code bug
- **Scope revision protocol** (sig-2026-03-28): A workflow gap, not an implementation error
- **Offer-next skips PR** (sig-2026-03-28): A lifecycle automation gap
- **Codex signal semantics** (sig-2026-03-26): Cross-runtime terminology confusion
- **Branch not pushed** (sig-2026-03-26): Git workflow discipline issue

This evolution suggests the fork's technical foundations are stabilizing while process and governance concerns are becoming the frontier. The signal pipeline is catching exactly the right things at this maturity level.

For a deeper comparison of fork signals against upstream's issue tracker, see [54-SIGNAL-CROSSREF.md](54-SIGNAL-CROSSREF.md).

## Lessons for Next Sync

These are actionable policy recommendations that flow into FORK-STRATEGY.md (INF-04). They are derived from what actually happened during v1.18, not aspirational ideals.

### 1. Freeze baseline at a tagged release, not a moving target

v1.18 froze at `v1.22.4` -- a tagged release. This was the right call. The drift ledger (48.1) was possible because there was a fixed reference point. Future syncs should always freeze at a specific tag, not at "upstream/main as of date X."

### 2. Budget one retriage phase for any sync spanning more than 2 weeks

Phase 48.1 took 4 minutes and prevented weeks of implicit scope creep. For any milestone where upstream releases one or more versions during execution, insert a retriage phase at the halfway point. The cost (one short plan) is negligible compared to the cost of discovering unclassified upstream changes during later phases.

### 3. Require deep integration plans for any adopted feature

The deep integration standard (Phase 53) should be a standing requirement, not a per-milestone decision. Any feature adopted from upstream must have an explicit integration plan: how does it connect to the fork's signal pipeline? Does it generate epistemic value? If not, the adoption is shallow and the feature will rot.

### 4. Use modular adoption strategy for structural changes

The rename -> adopt -> extract -> extend pattern (Phases 45-48) worked because each phase had exactly one structural transformation. Future modularization or restructuring should follow this incremental pattern rather than attempting multi-transformation phases.

### 5. Preserve commit history through merge strategy

Adopt `--merge` (not `--squash`) as the default PR merge strategy. The fork's commit protocol creates atomic per-task commits; squashing them destroys the granularity that makes the commit log useful for understanding what happened and when.

### 6. Require PR step in phase transition workflow

The phase-completion workflow should mandate a PR creation step (or explicit opt-out with justification). Work should not accumulate on branches without being merged, reviewed, and CI-verified.

### 7. Track deliberation consumption

When a phase uses a deliberation as planning input, record which revision was consumed. This creates a citation chain that allows future phases to detect foundational changes.

---

*Analysis date: 2026-03-28*
*Milestone: v1.18 Upstream Sync & Deep Integration*
*Artifact: INF-07 sync retrospective*
