---
id: rec-2026-03-23-deliberation-constellation
type: governance-recommendation
scope: roadmap-and-workflow-routing
status: provisional
created: 2026-03-23
author: logan-rooks
drafter: codex-gpt-5.4
runtime: codex-cli
model: gpt-5.4
reasoning_effort: xhigh
source_artifacts:
  - .planning/research/deliberation-reviews/2026-03-21-spike-epistemic-rigor-review.md
  - .planning/research/deliberation-reviews/2026-03-21-forms-excess-review.md
  - .planning/research/deliberation-reviews/2026-03-21-responsibility-praxis-review.md
  - .planning/research/deliberation-reviews/2026-03-21-community-feedback-review.md
  - .planning/research/deliberation-reviews/2026-03-21-comparative-characterization-review.md
  - .planning/research/deliberation-reviews/2026-03-22-immanent-critique-of-corpus-grounded-reviews.md
  - .planning/research/deliberation-reviews/2026-03-22-review-set-standing-and-usage-note.md
  - .planning/research/deliberation-reviews/2026-03-22-independent-critical-review-of-review-set.md
  - .planning/research/deliberation-reviews/2026-03-23-deliberation-revision-brief.md
  - .planning/deliberations/spike-epistemic-rigor-and-framework-reflexivity.md
  - .planning/deliberations/comparative-characterization-and-nonadditive-evaluation-praxis.md
  - .planning/deliberations/forms-excess-and-framework-becoming.md
  - .planning/deliberations/responsibility-alterity-and-methodological-praxis.md
  - .planning/deliberations/community-feedback-pipelines-and-dialogue-forms.md
---

# Deliberation Constellation Recommendations

## Purpose

This memo brings the current deliberation constellation into one governance-facing
view without forcing harmony that the artifacts do not support. Its role is to
sort what currently seems ready to influence roadmap routing, what looks like
next-milestone candidate work, and what should remain open orientation rather
than planned implementation.

It is not itself a roadmap change, and it should not be treated as independent
confirmation beyond the reviewed artifacts that ground it.

## Differentiated standing

The current deliberation set does not stand on one evidential footing.

- **Strongest current driver**
  - [spike-epistemic-rigor-and-framework-reflexivity.md](./../../deliberations/spike-epistemic-rigor-and-framework-reflexivity.md)
  - Strongest as a documented diagnosis of one concrete failure family.
  - Current warranted implication is thinner first-pass spike hardening, not a
    full new reflexive subsystem.

- **Strong local methodological contribution**
  - [comparative-characterization-and-nonadditive-evaluation-praxis.md](./../../deliberations/comparative-characterization-and-nonadditive-evaluation-praxis.md)
  - Strong for `arxiv-sanity-mcp` method design and potentially useful to other
    characterization-heavy spike programs.
  - Portability to GSDR framework apparatus remains explicitly open.

- **Diagnostic and artifact-ecology pressure**
  - [forms-excess-and-framework-becoming.md](./../../deliberations/forms-excess-and-framework-becoming.md)
  - Strong on what the current artifact ecology flattens or loses.
  - Weaker as a staged implementation program.

- **Interpretive orientation**
  - [responsibility-alterity-and-methodological-praxis.md](./../../deliberations/responsibility-alterity-and-methodological-praxis.md)
  - Best used as a lens on scope, exclusion, and closure.
  - Should not currently drive mechanism creation on its own.

- **Later-stage orientation**
  - [community-feedback-pipelines-and-dialogue-forms.md](./../../deliberations/community-feedback-pipelines-and-dialogue-forms.md)
  - Real concern, but still under-evidenced and mismatched to present scale.
  - Internal routing and traceability should mature before this becomes concrete
    roadmap work.

## Recommendations

### 1. Modify existing roadmap routing now

These changes seem warranted without changing milestone structure.

- Add **relevant deliberation references** directly into the roadmap phases they
  already bear on.
- The clearest current case is the existing cross-runtime authority cluster:
  - Phases 49-51 should reference
    [cross-runtime-upgrade-install-and-kb-authority.md](./../../deliberations/cross-runtime-upgrade-install-and-kb-authority.md)
- The deliberation lifecycle/consumption cluster should likely be referenced by
  the later governance/documentation phase:
  - likely Phase 54 should reference
    [deliberation-frontmatter-provenance-and-workflow-consumption.md](./../../deliberations/deliberation-frontmatter-provenance-and-workflow-consumption.md),
    [deliberation-revision-lineage-and-citation-stability.md](./../../deliberations/deliberation-revision-lineage-and-citation-stability.md),
    and
    [metaphor-awareness-framing-critique-and-harness-reflexivity.md](./../../deliberations/metaphor-awareness-framing-critique-and-harness-reflexivity.md)

Why now:

- the framework already has active deliberations bearing on upcoming phases
- the reviews support surfacing them into planning instead of relying on memory
- this is routing work, not yet a commitment to full new phase insertion

### 2. Treat these as next-milestone candidate work, not current v1.18 insertion

These themes appear real, but do not yet justify inserting new v1.18 phases in
the current milestone.

- **Deliberation artifact/discovery contract**
  - frontmatter, scope, planning role, provenance, workflow consumption
- **Trace / overflow / lineage / citation stability**
  - enough structure for traceability without forcing routine work into
    expensive multi-hop history traversal
- **Spike methodology redesign**
  - begin with thinner first-pass hardening
  - leave broader reviewer/program redesign as follow-on only if thinner changes
    prove insufficient
  - if spike redesign enters the next milestone, claim-unit and archive-structure
    concerns (from the comparative-characterization deliberation) may need to be
    co-designed with review-loop changes rather than treated sequentially — the
    comparative-characterization review found that review structure and
    claim/archive structure are coupled problems

These all seem like plausible next-milestone shaping pressures.

### 3. Keep these open as orientation, not planned implementation

- **Responsibility / alterity**
  - keep as a review and interpretation lens
- **Metaphor / framing critique**
  - keep as a reflexive concern that may later find workflow placement, but do
    not yet force it into apparatus
- **Parts of forms/excess**
  - preserve its pressure against flattening and its concern for what the
    artifacts cannot hold
  - do not demand a tidy intervention program from it prematurely

### 4. Continue to defer community pathway work

The community-feedback deliberation should currently shape later planning, not
current implementation.

Why:

- current real usage is still effectively a small core
- internal deliberation/signal routing is not yet mature enough
- broader intake before better internal handling would likely increase noise and
  handling burden faster than it improves framework learning

## Recommended next workflow

1. Patch roadmap references to relevant deliberations.
2. Design how roadmap references surface into `CONTEXT.md`.
3. Only after that, write a roadmap-shaping note for the next milestone.
4. Keep open-orientation deliberations available as material for later milestone
   shaping, without treating them as adopted policy.

## What would change this reading

- If thinner spike hardening proves insufficient quickly (e.g., the next 2-3
  spikes still collapse into premature architecture verdicts despite the new
  outcome types and design challenge step), the broader redesign moves up and
  may need to become current-milestone work.
- If a second project's spike work shows different failure dynamics than the
  `arxiv-sanity-mcp` family, the current diagnosis narrows and the
  comparative-characterization proposals become less portable than they currently
  appear.
- If internal routing and traceability improve faster than expected, community
  pathway work could move earlier than "later-stage."

## Process observation

The review chain that produced this memo is itself preliminary evidence for the
spike deliberation's "review as dialogue" thesis. The cross-model exchange
(Claude Opus 4.6 and GPT-5.4 xhigh) caught different weaknesses and produced
better artifacts than either model alone would have. That does not yet prove the
thesis, but it does suggest that cross-model review is a candidate practice
worth preserving for future spike and deliberation work.

## Open cautions

- This memo should not be read as independent confirmation beyond the reviewed
  deliberation/review chain it depends on.
- The convergent ordering inside the review set remains a product of shared
  production context, even after it was flagged explicitly.
- The literature grounding remains provisional in several places and should not
  be read as settled framework warrant.
