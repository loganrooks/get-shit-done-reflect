# Phase 54: Infrastructure & Documentation - Context

**Gathered:** 2026-03-28
**Status:** Ready for research

<domain>
## Phase Boundary

Restore CI reliability, fix planning telemetry correctness, and formalize fork governance for the post-v1.18 state. Four requirements:

- **INF-01**: CI status cache scoped per-project (include repo/branch in cache key) fixing cross-project pollution
- **INF-02**: v1.17+ roadmap deliberation updated to incorporate upstream sync as completed milestone theme
- **INF-03**: FORK-DIVERGENCES.md updated to reflect v1.18 module structure, live upstream-tracked divergence set, and updated merge stances
- **INF-04**: FORK-STRATEGY.md updated with durable upstream sync policy (cadence, what-to-adopt criteria, integration depth standard)

This phase is governance + infrastructure closure. It does not add features or modify command behavior.

</domain>

<assumptions>
## Working Model & Assumptions

### CI Cache Fix (INF-01)
- The fix is localized to `hooks/gsd-ci-status.js` (72 lines)
- The hook already detects branch (`git branch --show-current`) but writes to a global cache file
- Including repo identity + branch in the cache filename (or a hash thereof) should be sufficient
- No other hooks or tools read `gsd-ci-status.json` directly besides the statusline consumer — research must verify this

### Progress Telemetry
- STATE.md's YAML frontmatter (`total_plans`, `completed_plans`, `percent`) becomes stale between updates
- The `roadmap.cjs` plan-counting logic is disk-based and correct, but STATE.md progress is written at specific points and not refreshed
- Phases with "Plans: TBD" in ROADMAP.md (like Phase 54 before planning) contribute 0 to `totalPlans`, which may undercount the actual remaining work
- Research should investigate whether the `progress` command output is misleading when future phases have unplanned work

### Fork Governance Docs (INF-02, INF-03, INF-04)
- FORK-DIVERGENCES.md (last updated 2026-02-10) predates the entire v1.18 modularization — the divergence landscape has fundamentally changed
- FORK-STRATEGY.md is comprehensive for merge mechanics but lacks formalized sync policy (cadence, baseline-freeze rules, integration depth)
- The v1.17+ roadmap deliberation (created 2026-03-02) does not account for v1.18 as a milestone; its M-A through M-E framing needs a postscript

</assumptions>

<decisions>
## Implementation Decisions

### Deliberation Updates
- Updates to the v1.17+ roadmap deliberation must add a revision/postscript section, not rewrite the original analysis — deliberation revision lineage deliberation constrains this
- FORK-DIVERGENCES.md and FORK-STRATEGY.md are project planning docs (not deliberations), so they can be updated in-place

### Claude's Discretion
- Cache key format (hashed vs readable filename) — choose based on filesystem constraints
- FORK-DIVERGENCES table structure — may need redesign for the modular layout
- Whether to include a formal "Upstream Sync Readiness Checklist" in FORK-STRATEGY.md vs keeping it as prose guidance
- Exact telemetry fix approach — depends on research findings about what specifically overstates

</decisions>

<constraints>
## Derived Constraints

### From Phase 48.1 (concluded deliberation)
- The baseline-freeze + explicit-retriage-phase pattern was decided during Phase 48.1 and documented in `UPSTREAM-DRIFT-LEDGER.md`
- FORK-STRATEGY.md must formalize this pattern as durable policy, not re-derive it
- Phase 48.1 classified 372 post-baseline commits into 11 clusters (9 fold-into, 1 candidate-next-milestone, 1 defer) — this classification is the input for INF-03's merge stance updates

### From v1.18 Modularization (Phases 45-48)
- The monolith `gsd-tools.js` no longer exists; the runtime is now `gsd-tools.cjs` (thin router) + 16 `lib/*.cjs` modules
- FORK-DIVERGENCES.md must track at the module level, not the pre-modularization monolith level
- 11 modules are adopted upstream files (potentially modified); 5 are fork-only extractions
- Phase 46 decision: fork overrides appended as `module.exports.funcName` pattern
- Phase 48 decision: fork extensions merged into upstream function bodies with includes param

### From Existing CI Hook Code
- `hooks/gsd-ci-status.js` lines 10-11: cache path is `~/.claude/cache/gsd-ci-status.json` (hardcoded global)
- The spawned child process receives the cache path via `JSON.stringify(cacheFile)` — the scoped path must flow into the child
- Hook already reads `git branch --show-current` — repo identity must also be resolved (from `gh` or git remote)

### From Deliberation Lineage Rules
- The deliberation-revision-lineage deliberation (open, constraining) says: do not silently rewrite deliberation history; add dated revision sections that preserve the original record
- This applies to INF-02 (updating the v1.17+ roadmap deliberation)
- Does not constrain INF-03/INF-04 since those are planning docs, not deliberations

### From Success Criteria
- SC-2 mentions both STATE.md AND ROADMAP.md — both must be addressed, not just one
- SC-4 requires FORK-STRATEGY.md to contain: sync cadence, baseline-freeze rules, what-to-adopt criteria, AND integration depth standards — all four elements

</constraints>

<questions>
## Open Questions

### Q1: What consumers read gsd-ci-status.json?
- **Type:** material
- **Why it matters:** If multiple hooks/tools read the cache file, scoping the filename changes the read path too — could break consumers silently
- **Downstream decision:** Cache key format and migration approach
- **Reversibility:** High — cache files are ephemeral
- **Research should:** Grep for `gsd-ci-status` across the entire codebase to map all readers/writers

### Q2: What specifically causes progress telemetry overstatement?
- **Type:** formal
- **Why it matters:** SC-2 says progress "no longer overstates" — need to identify the concrete bug before fixing it
- **Downstream decision:** Whether fix is in `roadmap.cjs` plan counting, STATE.md update logic, or progress display formatting
- **Reversibility:** High — internal reporting, no user-facing data loss
- **Research should:** Run the progress command, compare its output to actual disk state, identify where the numbers diverge from reality; also check if "Plans: TBD" lines in ROADMAP.md inflate plan counts or if STATE.md YAML becomes stale

### Q3: Module-level vs file-level divergence tracking
- **Type:** formal
- **Why it matters:** Pre-v1.18, divergences were per-file against upstream. Post-modularization, a single upstream file (e.g., `init.cjs`) contains both adopted upstream code AND fork extensions merged in. The granularity of divergence tracking needs a model.
- **Downstream decision:** FORK-DIVERGENCES.md table structure
- **Reversibility:** Medium — once the doc structure is set, reformatting is tedious but not destructive
- **Research should:** Enumerate which of the 16 lib/*.cjs modules contain fork modifications (vs pure upstream copies), and assess whether per-function or per-file tracking is practical

### Q4: Integration depth standard definition
- **Type:** final
- **Why it matters:** SC-4 requires "integration depth standards" in FORK-STRATEGY.md. Phase 52-53 demonstrated what deep integration looks like (adopted features woven into signal/automation/health pipeline), but this hasn't been codified as a standard.
- **Downstream decision:** What language goes into FORK-STRATEGY.md for evaluating future feature adoption depth
- **Reversibility:** High — policy document, easily revised
- **Research should:** Review Phase 52-53's integration patterns (context-monitor → bridge file → automation deferral; Nyquist → artifact sensor → signals; etc.) and distill the general principle

</questions>

<guardrails>
## Epistemic Guardrails

1. **Do not assume FORK-DIVERGENCES.md is accurate** — it was last updated 2026-02-10, before the entire v1.18 modularization. The actual divergence state must be derived from current code, not the stale document.

2. **Do not infer telemetry bugs from STATE.md values alone** — the YAML frontmatter values are snapshots written at specific execution points. The progress command's live output is the authoritative source for whether overstatement occurs.

3. **Deliberation updates are append-only** — the v1.17+ roadmap deliberation may not have its original content modified. Add a clearly dated revision section. Reference: deliberation-revision-lineage deliberation.

4. **FORK-STRATEGY policy must be grounded in actual practice** — Phase 48.1's baseline-freeze + retriage pattern is a decided practice. The sync cadence rules and what-to-adopt criteria should generalize from v1.18's actual experience, not from hypothetical ideals.

5. **Verify cache consumer map before changing cache format** — changing the CI cache filename breaks any reader that hardcodes the old path. Grep before changing.

</guardrails>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 54-infrastructure-documentation*
*Context gathered: 2026-03-28*
