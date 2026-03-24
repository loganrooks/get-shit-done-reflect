---
title: Upstream Drift Retriage and Roadmap Authority
status: concluded
date: 2026-03-24
updated: 2026-03-24
scope: roadmap
planning_role: constrain
trigger_type: conversation-observation
trigger: >-
  Review discussion and fresh upstream fetches surfaced a governance gap:
  upstream moved substantially after the fork audit, but the roadmap only had a
  freeze note, not a forcing mechanism that would make future planners confront
  what changed, what remains in-scope for v1.18, and what is explicitly deferred.
created_by:
  runtime: codex-cli
  model: gpt-5.4
  reasoning_effort: not-exposed
  workflow: gsdr-deliberate
  participants:
    - user
    - codex
affects:
  - ROADMAP.md
  - STATE.md
  - v1.18 phases 48.1, 49, 50, 51, 54
  - future phase CONTEXT planning for upstream-facing work
related:
  - ./cross-runtime-upgrade-install-and-kb-authority.md
  - ./platform-change-monitoring.md
  - ./v1.17-plus-roadmap-deliberation.md
  - ../fork-audit/01-upstream-changes.md
  - ../governance/recommendations/2026-03-23-deliberation-constellation-recommendations.md
---

# Deliberation: Upstream Drift Retriage and Roadmap Authority

## Situation

v1.18 was correctly re-scoped around the March 10 audit baseline at upstream
`v1.22.4`, but that freeze note by itself is not enough. Upstream kept moving,
and several of the post-baseline changes land directly on surfaces that the
still-open v1.18 phases depend on: install/update authority, project-root and
worktree resolution, non-Claude runtime behavior, config preservation, hooks,
and workflow wiring.

That creates a practical planning problem. If future agents read only the
current phase descriptions, they can still plan against a stale mental model:
"the audit already sorted this" or "everything after `v1.22.4` is next
milestone material." Neither is warranted without explicit triage.

The real gap is therefore not just "upstream changed a lot." It is
**roadmap authority**: what artifact forces planners to stop, see the newer
upstream drift, and record explicit adopt/fold/defer decisions before Phase 49+
work begins?

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `git fetch upstream --tags` on 2026-03-24 | `upstream/main` advanced from `5733700` to `60fda20` after the earlier review snapshot | Yes — direct fetch run in repo | informal |
| `git rev-list --count v1.22.4..upstream/main` and `git rev-list --count v1.28.0..upstream/main` | The live upstream delta is now 358 commits past `v1.22.4` and 31 commits past `v1.28.0` | Yes — direct git queries run in repo | informal |
| `git diff --stat v1.22.4..upstream/main` | The post-baseline change set is large: 254 files changed, ~52.7k insertions, so this is not a negligible patch stream | Yes — direct git diff stat run in repo | informal |
| `git diff --name-only v1.22.4..upstream/main` filtered to install/runtime/workflow paths | Post-baseline drift touches `bin/install.js`, many `bin/lib/*.cjs` modules, `workflows/`, `hooks/`, and tests — exactly the surfaces Phases 49-51 and 54 care about | Yes — direct path-filtered diff run in repo | informal |
| `git log --oneline v1.22.4..upstream/main -- ...` over relevant paths | Recent upstream commits include config preservation, absolute Codex agent paths, Windows/project_root/stdin safety, linked-worktree `.planning/` resolution, worktree isolation, `$HOME` path fixes, and non-Claude model/runtime fixes | Yes — direct scoped log run in repo | informal |
| [01-upstream-changes.md](../fork-audit/01-upstream-changes.md) | The original audit snapshot was grounded in a smaller, earlier delta up through `v1.22.4`; it did not and could not cover the later upstream movement now facing current planning | Yes — file reviewed directly | informal |
| [2026-03-23-deliberation-constellation-recommendations.md](../governance/recommendations/2026-03-23-deliberation-constellation-recommendations.md) | The March 23 recommendation memo justified routing deliberations into existing phases, but explicitly did not treat itself as a roadmap change or evaluate whether a new retriage phase was needed after further upstream movement | Yes — file reviewed directly | informal |

## Framing

The question is not simply whether v1.18 should "catch up" to latest upstream.

**Core question:** When upstream has moved substantially after an audit-based milestone was already underway, should the roadmap keep a hard freeze, retarget wholesale to latest upstream, or insert an explicit retriage step that forces adopt/fold/defer decisions before further phase planning?

**Adjacent questions:**
- Which post-baseline changes are urgent enough to still belong in v1.18?
- Which changes should be folded into open phases versus handled as separate inserted work?
- How should roadmap readers be alerted that the audit snapshot is no longer the full live context?
- What minimum artifact set is needed so `discuss-phase` / `plan-phase` agents do not miss this issue?

## Analysis

### Option A: Keep the baseline freeze and defer all post-baseline upstream change to the next milestone

- **Claim:** Treat the `v1.22.4` freeze as absolute and do not revisit any newer upstream work during v1.18.
- **Grounds:** Scope discipline matters; wholesale re-triage can become endless and can destabilize already-completed work.
- **Warrant:** A milestone that keeps moving loses auditability and is hard to finish.
- **Rebuttal:** This is too blunt. The live upstream delta already includes changes on still-open v1.18 surfaces, so a total defer posture means planners may knowingly work against outdated upstream conditions without ever recording that choice.
- **Qualifier:** Weak by itself.

### Option B: Insert an explicit retriage phase now, keep the baseline freeze, and selectively route post-baseline changes

- **Claim:** Keep `v1.22.4` as the audited baseline, but add a mandatory retriage step before Phase 49 planning that classifies newer upstream changes into `must-integrate-now`, `fold-into-open-phase`, `candidate-next-milestone`, or `defer`.
- **Grounds:** The still-open v1.18 phases touch exactly the surfaces where post-baseline upstream has changed materially. The roadmap needs a forcing function so planners cannot skip that fact.
- **Warrant:** Explicit retriage preserves scope control better than wholesale retargeting, while still preventing stale-baseline planning. It turns drift from ambient anxiety into a bounded decision point.
- **Rebuttal:** It adds overhead and may tempt incremental scope creep if the triage is not disciplined.
- **Qualifier:** Strong.

### Option C: Retarget v1.18 wholesale to latest upstream

- **Claim:** Rewrite the milestone around the current `upstream/main` / latest tag and effectively redo the sync target.
- **Grounds:** This maximizes freshness and may reduce future catch-up work.
- **Warrant:** If the goal is “deep upstream sync,” latest-upstream alignment is the purest expression of that goal.
- **Rebuttal:** This would invalidate the audit-bounded sequencing that already produced Phase 45-48, explode scope, and blur what current milestone completion even means.
- **Qualifier:** Weak for the current milestone.

## Tensions

1. **Scope control vs live relevance:** freezing too hard ignores meaningful new upstream drift; chasing latest wholesale destroys milestone discipline.
2. **Planner awareness vs roadmap overload:** every note added to the roadmap increases reading burden, but missing this note creates false confidence.
3. **Deferred work vs implicit omission:** if newer upstream changes are delayed, that delay must be explicit and reasoned, not accidental.

## Recommendation

**Current leaning:** Option B, strongly.

The roadmap should not silently retarget v1.18 to latest upstream, but it also should not pretend that post-audit upstream drift is irrelevant to still-open phases. The correct move is to insert a mandatory retriage step before Phase 49 and make the live upstream drift visible in roadmap/state artifacts.

**Open questions blocking conclusion:**
1. None blocking the roadmap intervention itself. The remaining open questions belong inside the inserted retriage phase: which specific post-baseline changes now qualify as `must-integrate-now`, and whether any additional decimal phases are needed after classification.

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Future planners for Phases 49-54 will encounter an explicit roadmap gate about post-audit upstream drift before planning upstream-facing work | The next `discuss-phase` / `plan-phase` activity after this change | Phase 49 planning proceeds without referencing live upstream drift or the inserted retriage phase |
| P2 | Post-baseline upstream changes relevant to install/update/worktree/runtime authority will be classified explicitly instead of disappearing into “next milestone maybe” ambiguity | Output of Phase 48.1 planning/execution | No adopt/fold/defer classification artifact is produced |
| P3 | If certain newer upstream changes are deferred, that deferment will be visible as a conscious governance choice rather than inferred from omission | Updated roadmap/state artifacts after Phase 48.1 | Later readers still cannot tell whether newer upstream changes were considered or merely forgotten |

## Decision Record

**Decision:** Insert Phase 48.1 to retriage live post-audit upstream drift before Phase 49 planning, keep `v1.22.4` as the v1.18 audit baseline, and require explicit adopt/fold/defer routing for newer upstream changes.
**Decided:** 2026-03-24
**Implemented via:** Phase 48.1 roadmap insertion plus roadmap/state updates; phase not yet planned
**Signals addressed:** informal

## Evaluation

**Evaluated:** {pending}
**Evaluation method:** Observe whether the next planning pass for v1.18 cites the inserted phase and produces explicit drift classifications

| Prediction | Outcome | Match? | Explanation |
|-----------|---------|--------|-------------|
| P1: Future planners will hit an explicit retriage gate | {pending} | {pending} | {pending} |

**Was this progressive or degenerating?** (Lakatos)
{pending}

**Lessons for future deliberations:**
Upstream drift during an active sync milestone is not just “new information.” It is a roadmap-authority problem and should be forced into explicit routing before more upstream-facing planning continues.

## Supersession

**Superseded by:** {pending}
**Reason:** {pending}
