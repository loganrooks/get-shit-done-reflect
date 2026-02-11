# Phase 8: Core Merge & Conflict Resolution - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Execute the upstream merge of 70 commits (v1.11.2 to v1.18.0) into the fork on the sync branch. Resolve 12 conflict files using documented merge stances from FORK-DIVERGENCES.md. Preserve fork identity (branding, package name, help text). Apply 11 upstream bug fixes. Produce a categorized summary of what landed. Architecture adoption, feature verification, and test suite repair belong to Phases 9-11.

</domain>

<decisions>
## Implementation Decisions

### Resolution workflow
- **Per-file pause for hybrid-merge files:** Claude resolves each conflicting hybrid-merge file, then presents a diff + rationale explaining why each conflict block was resolved that way. User reviews and approves before moving to the next file.
- **Correction flow:** If user disagrees with a resolution, they describe what to change ("keep upstream's version of that function instead"). Claude applies the correction and re-shows the diff.
- **Fork-wins files handled silently:** Files with "fork wins" stance (README.md, CHANGELOG.md, gsd-check-update.js) are resolved via `git checkout --ours` without pausing. Mentioned in the summary.
- **LOW-risk case-by-case files:** Claude judges per file whether a LOW-risk file has anything interesting to show. Trivial resolutions skip the pause; anything non-obvious gets the full diff + rationale treatment.
- **Surprise complexity:** If a conflict is more complex than the documented stance anticipated (e.g., upstream restructured a file significantly), Claude flags it, explains what upstream did, and proposes a resolution — waiting for input before proceeding.
- **Merge Decision Log:** Claude decides timing (per-file vs. batch) based on plan structure.
- **Content updates for fork-wins files:** README.md and CHANGELOG.md updates to reflect newly adopted upstream features are deferred to Phase 12 (Release), not Phase 8.

### Plan staging
- **Four plans with /clear boundaries:**
  - 08-01: Pre-flight checks + execute `git merge upstream/main`
  - 08-02: Resolve HIGH risk conflict files (install.js, package.json, new-project.md) — interactive per-file review
  - 08-03: Resolve MEDIUM + LOW risk conflict files — interactive for MEDIUM, lighter touch for LOW
  - 08-04: Validate merge (tests, success criteria checklist, ghost reference check) + produce categorized merge summary
- **Update ROADMAP.md** with the 4-plan structure before planning begins.
- **File resolution order:** Claude determines optimal order based on dependencies between files.
- **Error recovery:** Attempt recovery for common issues (fetch failures, etc.) but stop for truly unexpected problems.
- **Failure handling:** Minor issues: fix forward. Major issues (broken merge state): rollback to last good state. Claude judges severity.
- **Pre-flight verification:** Claude decides whether to re-verify sync branch state (Phase 7 already validated it).

### Upstream adoption scope
- **Full sync, no pre-rejections:** All 70 upstream commits are merged. Adoption decisions happen during per-file review, not upfront.
- **Dependency review:** Each new dependency upstream added is flagged during package.json review. User decides whether to accept.
- **Fork branding is sacred for install.js:** Start from fork's installer, surgically add upstream features (manifest, patches, JSONC, statusline) that make sense. Fork's install experience takes priority.
- **new-project.md:** Evaluate during per-file review — decision depends on what upstream actually changed.
- **Fork package names are inviolable:** Any reference to package names, URLs, or install commands must use fork identity (`get-shit-done-reflect-cc`). Never let upstream names slip through in any file.
- **Ghost reference cleanup:** Memory system references (gsd_memory, gsd-memory, projects.json) should be gone since upstream reverted the feature. If the post-merge grep finds any hits, flag them for user review rather than auto-removing.
- **Bug fix verification:** Claude decides verification depth for the 11 upstream bug fixes.

### Validation depth
- **Fork tests must pass (blocking):** `npx vitest run` (42 tests) + 24 smoke tests must be green. Failures block Phase 8 completion.
- **Upstream tests are informational:** `gsd-tools.test.js` (63 tests) is run and results documented, but failures don't block Phase 8. Those are Phase 9-11 territory.
- **Full success criteria checklist:** Walk through every Phase 8 success criterion explicitly — git log for upstream ancestry, grep for ghost references, branding verification in key files.
- **Categorized merge summary:** After the merge, produce a categorized summary of new upstream additions (workflow files, references, templates, CLI tool, etc.) with counts and key files named. Written as a merge report artifact.
- **Merge summary verification:** Claude decides whether to cross-reference the summary against actual file changes.
- **Post-validation issues:** Claude triages — merge-level problems fixed in Plan 4, configuration/integration problems flagged for Phase 9+.
- **FORK-DIVERGENCES.md update:** Claude decides timing (Plan 4 vs. Phase 9) based on how much the manifest changed.
- **Sync branch to main timing:** Claude recommends based on risk/benefit.

### Claude's Discretion
- Commit strategy during merge (single merge commit vs. checkpoints)
- File resolution order within each plan
- package-lock.json regeneration timing
- Merge Decision Log population timing (per-file vs. batch)
- Pre-flight scope (re-verify sync branch or trust Phase 7)
- Bug fix verification depth for each of the 11 fixes
- Merge summary cross-reference thoroughness
- FORK-DIVERGENCES.md update timing
- Sync branch to main merge timing
- Triage severity for post-validation issues
- Whether to verify upstream remote as part of pre-flight (decided: yes, Claude verifies)

</decisions>

<specifics>
## Specific Ideas

- "Fork branding is sacred" — the fork's installer experience (REFLECT banner, package name, help text, hooks) takes absolute priority over upstream additions
- "We would need to review the new files as well because part of the sync means also integrating them into our system" — the categorized summary exists so the user can mentally prepare for Phases 9-10 integration work
- For fork-wins files (README, CHANGELOG), content updates reflecting newly adopted features happen in Phase 12 (Release), not during the merge
- Ghost reference cleanup is expected to find nothing (upstream reverted their memory system), but if it does find something, flag for review rather than auto-removing

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| How many actual conflicts will `git merge upstream/main` produce? | FORK-DIVERGENCES.md estimates 12 conflicting files, but the actual count depends on what upstream changed in overlapping regions | Medium | Pending — resolved when Plan 1 executes the merge |
| Will upstream's gsd-tools.test.js tests run at all without Phase 9 configuration? | Affects whether we get informational results or just errors | Low | Pending — resolved during Plan 4 validation |

---

*Phase: 08-core-merge*
*Context gathered: 2026-02-10*
