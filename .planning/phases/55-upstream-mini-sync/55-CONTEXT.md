# Phase 55: Upstream Mini-Sync - Context

**Gathered:** 2026-04-08
**Mode:** Exploratory (--auto: grounded selections only)
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate upstream correctness fixes (state locking, milestone safety, frontmatter, installer) before any v1.20 work begins. The fork's v1.20 work builds on a correct substrate. This is a sync phase, not a feature phase -- no new capabilities, no new modules.

**Requirement:** SYNC-01
**Source evidence:** `.planning/research/upstream-drift-survey-2026-04-08.md`

</domain>

<decisions>
## Implementation Decisions

### Sync scope [grounded]
- **In scope:** Drift survey Areas 1, 2, 4, and frontmatter fix (Area 18) -- the four clusters named in SYNC-01:
  1. **Atomic writes / locking correctness** (Area 1): 5 commits -- TOCTOU races, atomicWriteFileSync, readModifyWriteStateMd, cross-platform Atomics.wait, concurrency safety
  2. **Milestone safety** (Area 2): 5 commits -- 999.x backlog preservation, global regex lastIndex bug, backlog phase numbering, data loss prevention, USER-PROFILE.md preservation
  3. **Installer reliability** (Area 4): 11 commits -- hook path anchoring, uninstall safety, fresh install guards, manifest cleanup, hook script deployment, config dir detection
  4. **Frontmatter quoted-comma fix** (Area 18): `fa57a14e` -- REG-04, inline array parser respects quoted commas
- **Out of scope:** All new feature clusters (Areas 5-14), security module (Area 17), discuss-phase enhancements (Area 15 -- covered by GATE-08)
- **[open] Performance fixes** (Area 3, 4 commits): `.planning/ sentinel check`, `readdirSync` hoist in manager/roadmap, `isGitIgnored` cache. These are low-risk, touch already-in-scope files, but SYNC-01 says "correctness fixes" not "performance fixes." Researcher should assess whether to bundle or defer.

### Upstream reference version [grounded]
- Sync against upstream **v1.34.2** (`f7549d43`, 2026-04-07) -- the drift survey baseline
- The upstream remote is `upstream` (gsd-build/get-shit-done), configured with `--no-tags`

### Integration strategy per module [grounded]
- **Pure upstream modules** (state.cjs, milestone.cjs, template.cjs, verify.cjs): Wholesale replace from upstream v1.34.2. These have zero fork diff per FORK-DIVERGENCES.md.
- **Mostly upstream modules** (phase.cjs, roadmap.cjs): Replace from upstream, then re-apply fork's trivial adjustments (+17/-1 and +15/-1 respectively). Verify adjustments still apply cleanly.
- **Hybrid modules** (core.cjs, config.cjs, frontmatter.cjs): Manual merge required. Upstream changes to base code + fork extensions preserved. Key merge point: core.cjs where upstream adds `atomicWriteFileSync` and fork has `atomicWriteJson` -- these are complementary (different function names, different use cases).
- **Installer** (bin/install.js): MEDIUM-risk hybrid merge. 11 upstream fixes need integration. Fork's `replacePathsInContent()` and dual-directory logic must be preserved.
- **Non-module files** (complete-milestone.md, other workflows): Adopt directly where fork has no modifications.

### Commit strategy [grounded]
- One commit per merge category for traceability:
  1. Pure/mostly-upstream module replacements
  2. core.cjs hybrid merge
  3. config.cjs hybrid merge (if locking changes apply)
  4. frontmatter.cjs hybrid merge
  5. bin/install.js hybrid merge
  6. Non-module file adopts (workflows, etc.)
- Each commit should pass tests independently

### Test validation [grounded]
- All three test suites must pass after integration: vitest (443), upstream node:test (191), fork node:test (18)
- No new tests required for this phase -- existing suites validate the upstream fixes are correctly integrated
- [open] Whether upstream v1.34.2 includes new test files that should be adopted. Researcher should check.

### Claude's Discretion
- Exact merge ordering within each commit
- Whether to use `git checkout upstream/main -- <file>` for pure modules or manual copy
- Conflict resolution approach for hybrid modules (diff3 vs manual)
- Whether to create a temporary branch for each merge category or do sequential commits on a single branch

</decisions>

<specifics>
## Specific Ideas

- The drift survey identifies specific commit SHAs for every change. Use these as the authoritative reference, not a broad diff.
- core.cjs merge: `atomicWriteFileSync` (upstream) and `atomicWriteJson` (fork) are complementary -- both should exist in the merged file. `atomicWriteJson` calls JSON serialization then writes; `atomicWriteFileSync` handles the low-level atomic write-rename. Researcher should verify whether `atomicWriteJson` should be refactored to use `atomicWriteFileSync` internally.
- The `readModifyWriteStateMd` pattern (commit `7bc66685`) may affect how fork-only code interacts with state operations. Check if any fork modules (backlog.cjs, automation.cjs) call state-write functions directly.
- FORK-DIVERGENCES.md and FORK-STRATEGY.md should be updated after sync to reflect the new baseline (v1.34.2 for synced modules).

</specifics>

<deferred>
## Deferred Ideas

- **Performance fixes (Area 3):** If excluded from this phase, bundle into a "housekeeping" commit in Phase 56 or add as a micro-task.
- **Discuss-phase upstream enhancements (Area 15):** 7 commits to discuss-phase.md -- these are in scope for GATE-08, not SYNC-01.
- **New upstream commands (Area 16):** /gsd-undo, /gsd-explore, etc. -- assess individually during later phases.
- **Security module (Area 17):** Significant enhancements, but classified as v1.21 candidate.
- **Learnings store (Area 5), intel system (Area 6):** Complementary to KB work but not in SYNC-01 scope.
- **Hard stop safety gates (Area 7):** Convergent with GATE-04, adopt during Phase 58.
- **Gates taxonomy (Area 10), methodology artifact (Area 11), anti-pattern severity (Area 12):** Adopt during GATE/SPIKE phases.
- **Pause-work expansion (Area 13), shared behavioral docs (Area 14):** Adopt opportunistically in relevant phases.
- **Parallel execution (Area 8):** Design input for PAR-01/PAR-02 in Phase 64.

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| Should Area 3 performance fixes be included in SYNC-01 scope? | 4 low-risk commits touching already-modified files; saves a second merge pass | Low | Pending |
| Does upstream v1.34.2 include new test files for the correctness fixes? | New tests should be adopted to ensure the fixes have regression coverage | Medium | Pending |
| Should `atomicWriteJson` (fork) be refactored to use `atomicWriteFileSync` (upstream) internally? | Avoids two independent atomic-write implementations in the same module | Medium | Pending |
| Do any fork-only modules (backlog.cjs, automation.cjs, sensors.cjs) directly call state-write functions affected by the locking overhaul? | If yes, they need to use the new `readModifyWriteStateMd` pattern | Critical | Pending |
| Is the complete-milestone.md data-loss fix (f6a7b9f4) in a file the fork has modified? | Determines adopt vs hybrid merge for this workflow file | Low | Pending |

---

*Phase: 55-upstream-mini-sync*
*Context gathered: 2026-04-08*
*Mode: Exploratory (--auto, grounded-only selections)*
