# Phase 10: Upstream Feature Verification - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that all 7 adopted upstream features (FEAT-01 through FEAT-07) function correctly within the fork context. This is a verification phase — confirming things already merged in Phase 8 work, not building new features. Fixes are in scope when features don't work correctly in fork context.

</domain>

<decisions>
## Implementation Decisions

### Reapply-patches behavior
- Must verify both upstream spec compliance AND fork workflow compatibility
- Serves both fork maintainer (future upstream syncs) and end-users (preserving local tweaks through updates)
- Data safety is critical — backups must be bulletproof, no loss of fork modifications
- Correctness matters — must detect and restore the right patches, no false positives or missed patches
- Workflow integration — should feel natural in the fork maintenance workflow, not a bolted-on upstream tool
- Key future use case: reducing effort for the next upstream sync (v1.19+)

### Auto-mode project defaults
- Include health_check and devops config fields when --auto initializes a project
- Serves both CI/CD pipelines and quick local project setup equally
- Must work well in automated environments (no interactive prompts) and local developer workflow

### Update command identity
- GSD Reflect branding required in all update command output
- Investigate the npm registry branding issue in Phase 10 (current npm version may not reflect fork branding)
- Proactive update notifications on startup — show "New version available" when a newer version exists
- Distribution is both npm (primary, via npx) and git repo

### Fork adaptation threshold
- All user-visible output must show GSD Reflect branding — upstream branding leaking through is a bug
- URL references to upstream repos should be fixed in Phase 10, not deferred
- User trusts Claude to determine appropriate polish/adaptation level per feature rather than rigid equal standard
- General direction: polished and fork-branded, with Claude's judgment on what's appropriate per feature

### Claude's Discretion
- Relationship between reapply-patches and tracked-modifications strategy (separate vs integrated)
- Backup location for reapply-patches (upstream default vs .planning/ integration)
- Whether FORK-DIVERGENCES.md should inform reapply-patches behavior
- Role of reapply-patches in future merge workflow (complement vs simplify)
- Fix vs defer decision for reapply-patches issues based on severity
- Auto-mode: fork feature defaults (enabled/disabled), output verbosity, error handling strategy
- Auto-mode: template selection (standard vs repo-adaptive)
- Auto-mode: DevOps detection approach (auto-detect vs safe default)
- Update command: npm vs git detection, version checking source, local/global install handling
- Update command: gsd-check-update.js disposition (keep fork vs adopt upstream)
- Update command: changelog display behavior, rollback support
- Per-feature adaptation level — apply branding/polish standards proportionally

</decisions>

<specifics>
## Specific Ideas

- User wants reapply-patches to help make future upstream syncs (v1.19+) smoother and less manual
- npm publishing may have an issue — current npm version might not reflect fork branding. Could be a missing PR-based publish workflow or direct push to main
- Distribution strategy: npm is primary install path (npx), git repo is secondary. Making npm more reliable is important; offering GitHub install path as alternative worth exploring
- "Must be fork-branded" is the baseline, but user is more lenient in practice — trusts Claude's judgment on what level of adaptation is appropriate per feature

</specifics>

<deferred>
## Deferred Ideas

- npm publishing reliability / CI pipeline fix — Phase 11 (CI/CD Validation) or Phase 12 (Release)
- GitHub-based install/update path as alternative to npm — Phase 12 (Release)
- Broader distribution strategy (making npm more reliable, offering GitHub route) — Phase 12 (Release)

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| What are FEAT-04 and FEAT-06 specifically? | Success criteria only list 5 of 7 features explicitly | Medium | Pending |
| Why does npm registry version lack fork branding? | Affects update command verification and user experience | Medium | Pending |
| Does reapply-patches conflict with tracked-modifications strategy? | Could cause confusing behavior for fork maintainer | Medium | Pending |

---

*Phase: 10-upstream-feature-verification*
*Context gathered: 2026-02-10*
