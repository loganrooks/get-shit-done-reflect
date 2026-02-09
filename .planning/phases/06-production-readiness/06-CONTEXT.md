# Phase 6: Production Readiness & Workspace Health - Context

**Gathered:** 2026-02-08
**Status:** Ready for planning

<domain>
## Phase Boundary

The fork is production-ready for real-world use — workspaces can be validated and repaired, version upgrades are seamless, new projects capture DevOps context, and the fork has its own identity via README. This phase does NOT add new learning/reflection capabilities — it hardens what exists and makes it maintainable.

</domain>

<decisions>
## Implementation Decisions

### Health check behavior
- Repair behavior follows existing autonomy settings: YOLO mode auto-repairs, interactive mode asks before each repair
- Tiered check levels: default (quick: KB integrity, config validity, stale artifacts), full (adds planning consistency, config drift, version compatibility), and focused (--focus kb, --focus planning)
- Health check frequency is configurable via initialization questions: "milestone-only" (default), "on-resume", "every-phase", or "explicit-only"
- Targeted lightweight checks at key operation points (e.g., KB check before surfacing) — blocking vs warning is configurable via initialization setting
- Staleness threshold configurable in config.json (`stale_threshold_days`) with flag override (`--stale-days`)
- Health check findings persisted as signals — reflection can detect recurring workspace issues
- Version check is NOT part of health check — update checking stays in /gsd:update (modified to point to GSD Reflect npm package)

### Version upgrade path
- Two-mechanism approach: auto-detect on first access (primary) + explicit /gsd:upgrade-project command (secondary)
- Auto-detect: any GSD command checks `gsd_reflect_version` in config.json vs installed version; if outdated, migrate (auto in YOLO, prompt in interactive)
- Health check also detects version mismatch — catches projects not yet visited
- Migrations are additive: new config fields with defaults, new directories, updated templates, index rebuilds
- Migration log maintained — full audit trail of what changed, when, from which version
- When migration introduces new initialization questions (e.g., health check preferences), existing projects are prompted during migration — mini-onboarding for new features
- Failed migration blocking behavior is configurable via initialization setting
- /gsd:update command modified to pull from GSD Reflect npm registry (not upstream GSD)

### DevOps initialization
- DevOps questions during /gsd:new-project adapt based on project signals — production apps get more questions, personal tools keep it minimal
- DevOps context feeds into both research (stack-compatible solutions) and planning (CI-aware task generation), plus codebase mapper checks for DevOps gaps
- Commit convention: capture existing convention, then recommend improvements — "Your repo uses freeform commits. Conventional commits recommended. Match existing or adopt conventional?" User decides.
- DevOps init detects and recommends improvements for gaps (no .gitignore, no CI config, missing tests) — recommendations, not just detection
- DevOps gaps feed into both health check findings and roadmap suggestions where significant

### Fork identity & README
- Identity: "An AI coding agent that learns from its mistakes" — the learning loop is the core value prop
- README serves both audiences: existing GSD users (what's different section) and newcomers (full getting started)
- Prominent upstream credit: "Built on top of GSD by [author]" with link — collaborative tone
- README replaces root README.md (fork's own identity) — manual reconciliation if upstream changes significantly
- Full identity update: npm package.json description, keywords, repository URL, homepage — consistent across npm + GitHub
- Own CHANGELOG.md tracking GSD Reflect-specific changes and versions

### Claude's Discretion
- Health check output format (categorized summary vs checklist vs hybrid)
- Health check command architecture (thin routing to workflow vs self-contained)
- Batch fix mode design (--fix flag behavior)
- JSON output mode for CI integration (if worthwhile for v1)
- KB integrity validation depth (index accuracy, schema compliance, cap enforcement)
- DevOps context storage location (PROJECT.md section vs separate file vs config.json)
- Codebase mapper DevOps focus area (new focus vs extend existing 'concerns')
- DevOps gap → roadmap suggestion flow design
- Init-time file generation scope (generate starter configs vs flag and suggest)
- README structure, tone, and technical depth
- Whether README includes GSD vs GSD Reflect comparison table
- Migration failure handling defaults (block critical, warn minor)
- Update check mechanism (modify existing code vs fork-compliant separate check)

</decisions>

<specifics>
## Specific Ideas

- Health check preferences, migration strictness, and DevOps context should all be captured during /gsd:new-project initialization — unified operational onboarding
- Health check tiering mirrors the benchmark tiering pattern from Phase 0 (quick/standard/comprehensive)
- DevOps init should be a "smart recommender" — detect what exists, suggest improvements, let user decide
- Migration as mini-onboarding: when new version adds configurable features, migration prompts for those settings
- The existing GSD update-checking logic needs to be re-pointed to the GSD Reflect npm package, not upstream

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-production-readiness*
*Context gathered: 2026-02-08*
