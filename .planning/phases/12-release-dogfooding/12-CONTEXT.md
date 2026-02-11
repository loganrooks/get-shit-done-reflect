# Phase 12: Release & Dogfooding - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Version, document, and release v1.13.0 after validating gsd-reflect's signal tracking and knowledge base through production use during this milestone. Dogfooding produces the content (signals, lessons, reflection); release packages everything up. No new features — this phase validates existing ones and ships.

</domain>

<decisions>
## Implementation Decisions

### Signal collection scope
- Collect signals from Phases 8-11 (the v1.13 work that exercised the fork)
- Use both automated (`/gsd:collect-signals` per phase) and manual (`/gsd:signal`) approaches
- Automated captures mechanical patterns from execution artifacts; manual captures strategic insights about the sync experience
- Target 10-15 total signals, quality over quantity
- Key themes to cover: merge strategy decisions, conflict prediction accuracy, architecture adoption patterns, testing strategy choices
- The merge prediction accuracy (8 actual vs 11 predicted conflicts) is a particularly valuable signal — captures how risk assessment calibrated during execution

### Lesson generation
- Generate lessons from accumulated signals using `/gsd:reflect`
- At least one lesson must specifically address the upstream sync process (required by SC2)
- Lessons should be actionable for future sync operations (v1.14+), not just retrospective observations

### Knowledge base comparison document
- Markdown document in `.planning/phases/12-release-dogfooding/KB-COMPARISON.md`
- Side-by-side comparison of fork's file-based knowledge base vs upstream's reverted MCP-based GSD Memory
- Evaluation criteria: persistence model, portability, tooling requirements, context window impact, actual utility during this milestone, failure modes, maintenance burden
- Grounded in actual production data — reference our signal/lesson counts, the specific patterns detected, and where the KB was/wasn't consulted
- Objective tone — acknowledge tradeoffs of both approaches, not advocacy for our choice
- Note: upstream reverted MCP Memory; our analysis explains why file-based avoided those failure modes while acknowledging what MCP could have offered

### Changelog structure
- Follow existing conventional format established in CHANGELOG.md (Added, Changed, Fixed sections)
- Headline framing: "Synced with upstream GSD v1.18.0" as the story
- Group upstream bug fixes by category, call out the 2-3 most impactful individually (executor verification, context fidelity, API key prevention)
- Fork-specific work gets own narrative: architecture adoption, thin orchestrator conversion, identity preservation
- List adopted upstream features (--auto, --include, reapply-patches, JSONC, update detection, parallel research, new-milestone config)
- Reference upstream changelog for full upstream details (link already exists at top of file)

### Versioning
- Set to 1.13.0 in: package.json (version field), config.json template (gsd_reflect_version default), CHANGELOG.md (new entry)
- package-lock.json version field must match

### Release flow
- PR from sync/v1.13-upstream → main (documents the full v1.13 work)
- Prepare only: version bump + changelog + tag. npm publish is a separate manual CI trigger after merge.
- Signal review gate: collect signals → present to user → after approval, generate lessons

### Execution order
- Dogfooding first: collect signals → **user reviews signals** → generate lessons → run reflection → write comparison
- Then release: version bump → changelog → commit → tag → PR to main
- Rationale: the dogfooding content informs the changelog (we can cite signal/lesson counts as evidence of KB value)

### Claude's Discretion
- Exact signal wording and categorization
- How to structure the reflection report
- Commit message style for release commits
- Tag annotation content (lightweight vs annotated)
- Whether to split dogfooding and release into separate plans or combine

</decisions>

<specifics>
## Specific Ideas

- The v1.13 milestone exercised the fork heavily across 13 plans and 6 phases — this is rich dogfooding material
- STATE.md already has 20+ accumulated decisions that represent the kind of knowledge signals should capture
- The comparison doc should acknowledge that upstream reverted MCP Memory for good reasons, and show how file-based avoids those issues while being honest about limitations
- Two signals already exist from earlier work (missing-kb-rebuild-index-script, onboarding-missing-config-sections) — these are from the "prostagma" project namespace

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| PR to main vs direct merge? | sync/v1.13-upstream has been validated across 5 phases — a PR documents the work but may be ceremonial. Direct merge is faster. | Medium | **Resolved: PR to main** — documents the full v1.13 work in a reviewable record |
| Should npm publish happen in this phase? | The publish workflow exists in CI. Phase could just prepare (version bump, changelog) and leave publish as a manual trigger, or include it. | Medium | **Resolved: Prepare only** — version bump, changelog, and tag. Actual npm publish is a manual CI trigger after merge. Safer separation. |
| Review signals before generating lessons? | User might want to curate/edit signals before lessons are distilled. Adds a quality gate but slows the flow. | Low | **Resolved: Pause for review** — collect signals, present to user for review/edit, then generate lessons |

---

*Phase: 12-release-dogfooding*
*Context gathered: 2026-02-11*
