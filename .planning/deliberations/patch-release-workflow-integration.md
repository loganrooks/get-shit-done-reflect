# Deliberation: Patch Release Workflow Integration

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-30
**Status:** Open
**Trigger:** Conversation observation — reviewing pending todos between milestones surfaced the question of how quick tasks get released. The v1.18 handoff also flagged: "Release workflow gap: complete-milestone doesn't include version bump, GitHub Release creation, or multi-runtime install."
**Affects:** `/gsdr:complete-milestone`, `/gsdr:quick`, `/gsdr:release`, automation framework, between-milestone workflow
**Related:**
- sig-2026-02-17-release-process-fragile-manual-steps (v1.14 release chaos — led to `/gsdr:release` creation)
- sig-2026-03-30-release-workflow-forgotten-in-milestone-completion (v1.18 missed version bump, GH Release, multi-runtime install)
- `.planning/deliberations/development-workflow-gaps.md` (establishes pattern of "workflow steps that should happen but nobody remembers")

## Situation

`/gsdr:release` exists and works — it handles pre-flight checks, version bumps, changelog updates, tags, push, and GitHub Release creation. The problem is that nothing in the GSD lifecycle connects to it. Two workflow seams produce releasable work but have no release integration:

1. **Milestone completion** (`complete-milestone.md`): Creates a `v[X.Y]` git tag and offers to push it, but does not bump `package.json`, does not create a GitHub Release, does not trigger npm publish, and uses the wrong tag format (missing `reflect-v` prefix). The "offer next" step routes directly to `/gsdr:new-milestone` with no mention of release.

2. **Quick tasks** (`quick.md`): End at "commit + update STATE.md." No release nudge, no post-completion hook, no awareness that accumulated quick tasks represent unreleased work.

Additionally, the concept of "unreleased work" has no representation in GSD state. There's no counter, no tracking, no visibility into how many changes have accumulated since the last release.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| complete-milestone.md (lines 604-630) | Creates `v[X.Y]` tag only — no version bump, no GH Release, no `reflect-v` prefix | Yes (grepped for release/publish/bump) | sig-2026-03-30-release-workflow-forgotten |
| quick.md (line 684) | Ends at artifact commit — no release awareness | Yes (grepped for release/version/post-completion) | informal |
| execute-phase.md (lines 372-462) | Signal collection postlude exists as a working pattern for post-execution automation | Yes (read postlude implementation) | informal |
| release.md workflow | Full release automation exists and works (version bump, changelog, tag, GH Release, npm publish trigger) | Yes (read workflow end-to-end) | sig-2026-02-17-release-process-fragile |
| v1.18 completion experience | Agent missed release steps, had stale NPM_TOKEN assumption, required user intervention | Yes (signal documents the incident) | sig-2026-03-30-release-workflow-forgotten |
| STATE.md | No "unreleased changes" or "commits since last release" tracking exists | Yes (read STATE.md structure) | informal |
| config.json automation stats | signal_collection: 0 fires / 6 skips; reflection: 0 fires / 2 skips | Yes (read config.json) | informal |

## Framing

**Core question:** When work produces releasable changes — whether a milestone or between-milestone quick tasks — how should the release step be connected to the workflow that produced the changes?

**Adjacent questions:**
- Is "releasable unit of work" a concept GSD should formalize, or should release remain a manual decision?
- Should the automation framework's 4-level system (manual/nudge/prompt/auto) govern release behavior?
- How does multi-runtime installation fit into the release flow?

## Analysis

### Original Options (A/B/C)

**Option A: Wire Into Existing Workflows (Minimal Integration)**
- Add `/gsdr:release` as a step in `complete-milestone` and as a nudge in `quick` task completion.
- **Grounds:** Both signals trace to the same root cause — workflows end without mentioning release.
- **Rebuttal:** Doesn't address unreleased work accumulation for between-milestone quick tasks.

**Option B: Release Accumulator (Automation-Aware)**
- Track unreleased changes as first-class concept. Use automation framework's 4-level system.
- **Grounds:** `commits_since_last_release` is structurally identical to `phases_since_last_reflect`.
- **Rebuttal:** Automation framework has 0% fire rate in this project. Extending a non-functional pattern.

**Option C: Lifecycle Checkpoint (Release as Workflow Phase)**
- Formalize "release" as distinct lifecycle phase between "complete" and "shipped."
- **Rebuttal:** Heaviest option; over-formalizes for projects that don't publish.

### Synthesis: Configurable Integration (from user insight)

Options A/B/C aren't alternatives — they're points on a configuration spectrum. The existing infrastructure supports this:

- **Release config** (manifest) already knows *how* to release (version_file, changelog, ci_trigger, registry)
- **Automation config** (manifest) already knows *when* to auto-trigger (4 levels, per-feature overrides)
- **Missing bridge:** A `release` sub-section in automation (like `reflection`) connecting "when" to "how"

| Level | Milestone completion | Quick task completion | Resume |
|-------|---------------------|----------------------|--------|
| 0 (manual) | No mention of release | No mention | No mention |
| 1 (nudge) | "Don't forget: `/gsdr:release`" | "N changes unreleased" | "N unreleased changes" in status |
| 2 (prompt) | "Release now? (yes/skip)" | "5 commits since last release — release patch?" | Surfaces as pending action |
| 3 (auto) | Chains directly to `/gsdr:release` | Auto-releases after threshold | N/A (already released) |

### Epistemic Challenge (from user)

The configurable integration proposal was challenged on epistemic grounds:
- **Not empirically grounded** — based on pattern-matching, not research
- **Automation framework has never fired** — 0% success rate for the pattern being extended
- **F47 (Stiegler):** Conflates execution automation (safe) with judgment automation (dangerous)
- **F45 (Ashby):** Premature convergence — every problem gets "extend automation framework"

### Revised Understanding

The v1.18 failures were **mechanical**, not judgment failures:
- Tag before version bump (ordering constraint)
- Wrong tag prefix (computed value forgotten)
- CI pipeline not invoked (step skipped)
- Multi-runtime install not run (step skipped)

These are structurally preventable — not "try harder" or "add human checkpoint," but make the wrong thing impossible in code. However, "structurally unfailable" is itself an overconfident claim (user correction). The honest position: **design for empirical reliability, observe whether it actually fails, and maintain ability to trace failures back to causes.**

## Tensions

1. **Automation vs. intentionality**: Release is public-facing. Auto-releasing could ship half-baked work. But manual release gets forgotten (proven twice).
2. **Universal vs. project-specific**: Some projects release every commit; others batch. Configurable levels address this.
3. **Mechanical vs. judgment failures**: Most release failures are mechanical (ordering, chaining) — structurally preventable. The judgment question (when to release) is harder.
4. **Empirical reliability vs. a priori guarantees**: We can't prove a design won't fail. We can design for empirical reliability and observe.

## Predictions

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Milestone completion will include a successful release without manual intervention | Next milestone (v1.19) completion | Release steps are missed or require user to remember `/gsdr:release` separately |
| P2 | Quick tasks between milestones will result in patch releases within 1 week of accumulation | Between v1.19 milestones | Quick tasks accumulate for >2 weeks without release |
| P3 | The "release forgotten" signal pattern will not recur | v1.19 and v1.20 milestone completions | A new signal is logged about missed release steps |
| P4 | Multi-runtime installation will happen as part of release, not as a separate forgotten step | Next release that touches installer | User has to manually run installer for non-active runtimes after release |

## Decision Record

**Decision:** {pending — informs v1.19 scoping}
**Decided:** {pending}
**Implemented via:** {pending}
**Signals addressed:** sig-2026-02-17-release-process-fragile-manual-steps, sig-2026-03-30-release-workflow-forgotten-in-milestone-completion

## Evaluation

**Evaluated:** {pending}
