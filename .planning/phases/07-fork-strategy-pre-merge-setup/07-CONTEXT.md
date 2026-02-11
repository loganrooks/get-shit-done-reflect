# Phase 7: Fork Strategy & Pre-Merge Setup - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Retire the additive-only constraint, define a tracked-modifications fork maintenance strategy, and prepare a clean sync branch with snapshot before the upstream merge begins. This phase produces documentation and branch setup — no code changes to the product itself.

</domain>

<decisions>
## Implementation Decisions

### Divergence tracking method
- Track ALL modified files — code, agents, configs, workflows, templates — not just JS/TS
- Default merge stance is case-by-case: no blanket "upstream wins" or "fork wins" rule
- Claude's Discretion: marking method (inline comments, manifest, or both)
- Claude's Discretion: tracking update cadence (per-commit, per-phase, or at sync time)
- Claude's Discretion: whether to categorize divergences by type (identity, behavior, additive, config)
- Claude's Discretion: whether to include rationale per divergence entry
- Claude's Discretion: lifecycle tracking (active/resolved) vs. simple removal

### Strategy document
- Audience: both human and Claude agents equally — serves as the authoritative fork maintenance reference
- Claude's Discretion: document location (.planning/ vs. repo root)
- Claude's Discretion: whether to explain the shift from additive-only (historical context) or just state new approach
- Claude's Discretion: tone/style (match project's existing doc conventions)
- Claude's Discretion: whether to include a merge conflict runbook
- Claude's Discretion: whether to include a decision log for merge decisions
- Claude's Discretion: sync cadence recommendation (fixed schedule vs. ad-hoc)
- Claude's Discretion: whether to address contingencies (upstream fundamentally changes direction)
- Claude's Discretion: whether the strategy doc is living (updated per sync) or stable reference

### Patch identification approach
- Default to preserving fork-specific changes, but open to adopting upstream when their implementation is better
- When upstream introduces overlapping features: merge the best ideas from both approaches (hybrid)
- When upstream completely rewrites a file we've patched: evaluate per case based on what the rewrite achieves
- Review gate: present a patch plan for approval before Phase 8 merge begins (user wants this for v1.13; consider making it a configurable setting for future syncs)
- Claude's Discretion: patch format (actual .patch files vs. file list with descriptions)
- Claude's Discretion: patch classification (modified upstream files vs. additions)
- Claude's Discretion: risk assessment per patch (low/medium/high conflict likelihood)

### Branch & snapshot setup
- Pre-merge validation: test suite passing + smoke test passing before snapshot
- Claude's Discretion: sync branch naming convention
- Claude's Discretion: snapshot method (tag, branch, or both)
- Claude's Discretion: whether to work on sync branch or merge to main incrementally
- Claude's Discretion: rollback strategy if merge goes badly
- Claude's Discretion: whether upstream remote is permanent or temporary

</decisions>

<specifics>
## Specific Ideas

- "Review gate can be a setting / onboarding question" — the pre-merge patch review step should be configurable in project settings, not hardcoded
- Smoke test may need updating to include health checks after running — investigate what current smoke test covers
- Lean towards preserving everything fork-specific, but with pragmatism: "there are ways to harmonize and we may choose to adapt because their implementation is better"

</specifics>

<deferred>
## Deferred Ideas

- Contributing patches back to upstream (tagging "contributable" patches) — worth considering for future syncs, not this one

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| What does the current smoke test actually validate? | Determines if health checks need to be added before Phase 7 snapshot | Medium | Pending |
| How does upstream's reapply-patches mechanism work in detail? | Core to the patch preservation strategy — need to understand before adopting | Critical | Pending |
| Should review gate become a config.json setting or onboarding question? | Affects project setup workflow design | Low | Pending |

---

*Phase: 07-fork-strategy-pre-merge-setup*
*Context gathered: 2026-02-09*
