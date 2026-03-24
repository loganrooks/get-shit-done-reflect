# Deliberation: Cross-Model PR Review Routing and Automation

**Date:** 2026-03-24
**Status:** Open
**Trigger:** Post-merge reflection after PR #18 and user question about whether GSD Reflect should automate PR review so that a different model family reviews code than the one that authored it.
**Affects:** Future milestone planning, REV-01/REV-02, CI/rulesets, PR workflow, signal collection, branch protection strategy
**Related:**
- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-23-cross-model-review-chain-epistemic-discipline.md`
- `.planning/milestones/v1.15-REQUIREMENTS.md`
- `.planning/milestones/v1.15-CANDIDATE.md`
- `.planning/deliberations/spike-epistemic-rigor-and-framework-reflexivity.md`
- `.planning/deliberations/forms-excess-and-framework-becoming.md`
- `philosophy: error-statistics/severity-principle`
- `philosophy: habermas/monological-limitation`
- `philosophy: aristotle/formalization-limits`

## Situation

The recent PR recovery work reinforced two things at once.

First, cross-model review has been productive here. The March 23 deliberation-review chain and the PR #18 recovery both benefited from a different model family looking at work that had been authored elsewhere. That is now a positive local pattern rather than a one-off anecdote.

Second, the current repository workflow has no durable mechanism for that pattern. The repository has CI and branch protection, but no automated reviewer orchestration, no model-routing policy, and no review-to-signal pipeline. The question is no longer whether cross-model review can help. The question is whether it should become a designed part of the PR workflow, and if so whether GitHub-native Copilot features are sufficient or whether repository-controlled external automation is the right locus of control.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `.github/workflows/ci.yml` and current `main` branch protection | Current repo gate is CI-only (`Test`) plus conversation resolution; there is no automated AI reviewer gate or review job today | Yes — checked local workflow and live branch protection API on 2026-03-24 | informal |
| `.planning/milestones/v1.15-REQUIREMENTS.md` and `.planning/milestones/v1.15-CANDIDATE.md` | The project already identified a `gsd-reviewer` / review-to-signal direction, but it was deferred rather than built | Yes — historical milestone docs explicitly describe REV-01/REV-02 and `/gsd:review-pr` | informal |
| `sig-2026-03-23-cross-model-review-chain-epistemic-discipline` | Cross-model review has already produced higher-quality deliberation artifacts in this project | Yes — signal records a successful Claude Opus 4.6 ↔ GPT-5.4 xhigh review chain | sig-2026-03-23-cross-model-review-chain-epistemic-discipline |
| GitHub Docs: About GitHub Copilot code review | Copilot code review can be automatic, but model switching for code review is explicitly not supported | Yes — checked docs on 2026-03-24; code review uses a tuned internal model mix and does not expose model switching | informal |
| GitHub Docs: Configuring automatic code review by GitHub Copilot | GitHub-native auto review can be enabled through rulesets, including review-on-push and draft review | Yes — docs describe repository/org rulesets for automatic Copilot review | informal |
| GitHub Docs: Changing the AI model for GitHub Copilot coding agent | GitHub supports model selection for Copilot coding agent in certain entrypoints, including `@copilot` PR comments on GitHub.com; supported models currently include Claude Sonnet 4.5, Claude Opus 4.5/4.6, GPT-5.1-Codex-Max, and GPT-5.2-Codex | Yes — checked docs on 2026-03-24 | informal |
| GitHub Docs: About third-party agents | GitHub now supports Anthropic Claude and OpenAI Codex as third-party coding agents on GitHub, but in the role of coding agents that create/update PRs, not as a first-class configurable review engine | Yes — docs list supported third-party agents and their entrypoints (issues, agents tab, PR comments) | informal |
| GitHub REST API docs for pull request reviews | Repository-controlled external automation can create pending/submitted PR reviews and inline comments programmatically | Yes — official REST API supports creating and submitting pull request reviews | informal |

## Framing

The tempting framing is: "Can we get Copilot to review with a different model?" That is too narrow.

The deeper question is about control locus and epistemic purpose. Are we trying to add a convenience feature, or are we trying to preserve a useful form of epistemic friction by deliberately routing authored work to a different reviewer horizon?

**Core question:** Should GSD Reflect add a deliberate cross-model PR review layer, and if so should it be implemented through GitHub-native Copilot/third-party agent features or through repository-controlled external reviewer automation?

**Adjacent questions:**
- Is model-family separation actually the right policy, or only a useful heuristic?
- Should AI review remain advisory, or ever become a blocking merge gate?
- Where should reviewer provenance live so we can tell which model reviewed which PR?
- Should review findings become signals automatically, or only after human triage?
- Does GitHub-native convenience outweigh the loss of model-routing control?

## Analysis

### Option A: GitHub-Native Review First

- **Claim:** Enable GitHub Copilot automatic code review via rulesets and use GitHub-native coding agents for iteration, but do not build custom review automation yet.
- **Grounds:** GitHub already supports automatic Copilot review, review-on-push, and draft reviews. It also supports model selection for Copilot coding agent in some entrypoints and third-party coding agents (Anthropic Claude, OpenAI Codex) for issue/PR work.
- **Warrant:** This is the cheapest path to getting more machine review signal into PRs. It uses product features that GitHub maintains, so operational burden stays low.
- **Rebuttal:** This does not solve the actual control problem. Copilot code review explicitly does not support model switching. Third-party agents can author or iterate on PRs, but they are not a first-class "review with model X" mechanism. If the goal is author/reviewer model separation, GitHub-native review is insufficient on its own.
- **Qualifier:** Probably useful as a baseline, but insufficient for the full design goal.

### Option B: Repository-Controlled External Cross-Model Reviewer

- **Claim:** Build an external reviewer workflow that runs on PR events or labels, chooses a reviewer model deliberately, analyzes the diff/repo context, and posts findings as GitHub PR reviews/comments through the API.
- **Grounds:** GitHub supports programmatic PR reviews via the REST API. The repository already has CI and workflow infrastructure. The desired control variable is not "AI review exists" but "reviewer model is intentionally different from authoring model."
- **Warrant:** If the core value is controlled epistemic difference, the repository needs direct control over reviewer selection, prompting, output shape, provenance, and signal linkage. External orchestration provides that control.
- **Rebuttal:** This is operationally heavier. It introduces secrets, cost, prompt maintenance, rate-limit/error handling, and the risk of manufacturing noisy or checklist-like reviews that users learn to ignore. It also raises the question of how the workflow knows which model authored the PR in the first place.
- **Qualifier:** Technically feasible and philosophically aligned, but only justified if piloted carefully.

### Option C: Human-Triggered Pilot Before Automation

- **Claim:** Do not add always-on automation yet. First create a lightweight review protocol or command that humans trigger when they want cross-model scrutiny, then measure whether it finds issues that CI and normal review miss.
- **Grounds:** The project already has one positive signal for cross-model review, but only in deliberation/review work, not across ordinary code PRs. Existing deliberations on adversarial reviewers and formalization warn that reviewer apparatus can become false-certification theater.
- **Warrant:** This option preserves the promising practice without pretending the system already knows how to formalize it. It creates room for severe testing before turning a good experience into framework law.
- **Rebuttal:** Manual triggers are easy to forget. If the protocol is too lightweight, it may generate anecdotes rather than actionable comparative evidence.
- **Qualifier:** Strongest current candidate for a next step.

### Option D: Mandatory AI Cross-Model Gate

- **Claim:** Require an AI review from a non-author model before merge, potentially as a blocking ruleset.
- **Grounds:** Strong gates can force adoption and guarantee every PR receives the designed review pass.
- **Warrant:** If the cross-model effect is genuinely load-bearing, making it mandatory would maximize coverage.
- **Rebuttal:** This is premature and likely wrong. The current evidence base is too thin, GitHub-native review does not expose the necessary model-routing control, and a mandatory AI gate risks becoming exactly the kind of formalized false confidence warned about in the spike rigor and forms/excess deliberations.
- **Qualifier:** Not warranted now.

## Tensions

- **Convenience vs control:** GitHub-native features are easy to enable, but they do not expose the control surface needed for reviewer-model routing.
- **Epistemic friction vs ceremony:** A second model can surface real blind spots, but adding "AI reviewer required" too early can turn critique into ritual.
- **Native integration vs repository sovereignty:** GitHub-owned review flows reduce maintenance; repo-owned orchestration gives precise routing, provenance, and signal integration.
- **Advisory help vs gatekeeping:** Helpful reviewers should widen judgment, not become a false badge that substitutes for judgment.
- **Cost/latency vs insight density:** Extra model passes consume premium requests, Actions minutes, or API spend. The intervention is only worth it if the findings are novel and load-bearing.

## Recommendation

**Current leaning:** Option C first, with Option B as the likely implementation target if the pilot justifies automation.

That means:
- do **not** treat GitHub-native Copilot code review as sufficient for the full design goal of deliberate reviewer-model separation
- do **not** make AI review a blocking merge gate yet
- design a later pilot where PR review can be triggered intentionally, ideally with explicit reviewer provenance and later comparison against CI/human findings

**Open questions blocking conclusion:**
1. How should author-model provenance be recorded on PRs so a routing rule can pick "different reviewer family" reliably?
2. Should the first pilot use GitHub-native third-party agents, or skip straight to an external review workflow that posts via the API?
3. What output format makes review findings actionable without flooding PRs with shallow comments?
4. Should review findings automatically create signals, or only after human confirmation?
5. What success threshold would justify moving from pilot to regular workflow?

## Predictions

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | A human-triggered cross-model PR review pilot will find at least one materially new issue class that CI did not catch within the first 5 pilot PRs | Pilot summaries, PR comments, and any resulting signals | After 5 pilot PRs, findings are only duplicates of CI output or trivial style feedback |
| P2 | GitHub-native Copilot code review alone will not be enough to enforce deliberate author/reviewer model separation | Product docs and repository setup attempt | GitHub exposes stable per-review model routing or code-review model selection directly |
| P3 | If reviewer provenance is recorded explicitly, recurring reviewer/model effectiveness patterns will become visible enough to support future signal collection | Review logs or signals after the pilot | Reviews happen but there is no reliable way to tell which model reviewed what, making comparison impossible |
| P4 | Making AI review advisory rather than blocking in the pilot phase will keep merge latency manageable while still generating useful evidence | Compare pilot PR timelines against recent baseline PRs | Pilot PRs incur significant extra latency without yielding novel findings |

## Decision Record

**Decision:** Not concluded
**Decided:** -
**Implemented via:** not yet implemented
**Signals addressed:** sig-2026-03-23-cross-model-review-chain-epistemic-discipline

## Evaluation

**Evaluated:** -
**Evaluation method:** not yet evaluated

| Prediction | Outcome | Match? | Explanation |
|-----------|---------|--------|-------------|
| P1: TBD | - | - | Not yet adopted |

**Was this progressive or degenerating?** (Lakatos)
Not yet evaluable.

**Lessons for future deliberations:**
This deliberation should not be allowed to collapse into "Copilot review yes/no." The real design question is where control over reviewer identity, prompting, provenance, and signal integration should live.

## Supersession

**Superseded by:** -
**Reason:** -
