# Phase 51: Update System Hardening - Context

**Gathered:** 2026-03-26
**Status:** Ready for research

<domain>
## Phase Boundary

The installer and command-entry upgrade path produce actionable migration guidance, clean up stale pre-modularization files, and enforce authoritative project-local install/KB behavior across runtimes. Six requirements (UPD-01 through UPD-06) scope this phase.

**What this phase delivers:**
- MIGRATION-GUIDE.md generation during install (for upgrades, not fresh installs)
- Stale file cleanup for pre-modularization artifacts (old `gsd-tools.js`, missing `lib/*.cjs`)
- Hook registration updates during upgrade (new hooks, stale hook removal, modified hook rebuild)
- Fresh-install vs upgrade detection (no migration noise for new users)
- End-to-end v1.17→v1.18 upgrade test with `.planning/` artifact preservation
- Per-release migration specs that the installer can mechanically append

**What this phase does NOT deliver:**
- A full command-level authority/preflight layer (the cross-runtime-upgrade deliberation leans toward this but is still OPEN)
- Changes to KB write authority or project-local KB enforcement beyond what's needed for the upgrade path
- New runtime capability beyond the 4 existing runtimes

</domain>

<assumptions>
## Working Model & Assumptions

**A1: Migration guide is installer-generated, not workflow-generated.**
The installer already runs for every install/update. Generating MIGRATION-GUIDE.md there means it works across all 4 runtimes without needing hooks or workflow triggers. Research should verify whether this is sufficient or whether a workflow companion is also needed.

**A2: Per-version migration specs are the source data for MIGRATION-GUIDE.md.**
Each release ships structured notes on what changed. The installer reads applicable specs (from detected previous version to current version) and assembles the guide. Research should determine the spec format and storage location.

**A3: Stale file cleanup extends the existing `cleanupOrphanedFiles()` pattern.**
The installer already has infrastructure for removing orphaned files (7 old hook files) and orphaned hook registrations (10 patterns). The pre-modularization `gsd-tools.js` and any other v1.17→v1.18 stale artifacts should be added to this existing mechanism rather than building a new one.

**A4: Hook registration during upgrade is additive+removal, not full reconciliation.**
The installer already writes hooks during fresh install and removes orphaned hooks during any install. The gap is ensuring new v1.18 hooks are registered when upgrading from v1.17, and that modified hooks are rebuilt. Research should verify what hook changes exist between v1.17 and v1.18.

**A5: The v1.17→v1.18 upgrade test can reuse Phase 50's `createManifestTestEnv` pattern.**
Phase 50 established test helpers for installer testing (`collectFileInventory`, `createManifestTestEnv`). The end-to-end upgrade test should build on this foundation rather than creating parallel infrastructure.

</assumptions>

<decisions>
## Implementation Decisions

### Fresh vs upgrade detection
- The installer already detects cross-scope installations and version differences. UPD-04 requires that MIGRATION-GUIDE.md is NOT generated for fresh installs. The detection heuristic: if no previous VERSION file exists in the target directory, this is a fresh install. If a VERSION file exists and its version differs from the current package version, this is an upgrade.
- **Grounding:** `install()` at line 2372 already reads `otherScopeVersionPath`; the VERSION file is written during every install. This is a reliable detection point.

### Stale `gsd-tools.js` cleanup
- Pre-modularization installations have `gsd-tools.js` instead of `gsd-tools.cjs`. After v1.18 upgrade, the old `.js` file must be removed to avoid confusion. This is added to `cleanupOrphanedFiles()`.
- **Grounding:** Phase 45 renamed `gsd-tools.js` → `gsd-tools.cjs`. Phase 50 (TST-01) verified zero stale `gsd-tools.js` references in installed files. The file itself still needs to be cleaned up during upgrade.

### Claude's Discretion
- Exact format and layout of MIGRATION-GUIDE.md sections
- Whether migration specs are Markdown, JSON, or YAML
- Test fixture design for the v1.17→v1.18 upgrade scenario
- Ordering and grouping of migration guide content (by version, by category, by severity)

</decisions>

<constraints>
## Derived Constraints

**DC-1: Additive-only migration principle still holds.**
Config migrations must remain additive (version-migration.md core principle). The controlled exception for field renames was already established in Phase 49 and must not be expanded without explicit justification. MIGRATION-GUIDE.md is documentation output, not a config mutation mechanism.

**DC-2: Cross-runtime compatibility is mandatory.**
All 4 runtimes (Claude Code, OpenCode, Gemini CLI, Codex CLI) must benefit from upgrade hardening. Hooks are Claude-only, so any hook-dependent behavior must have a non-hook fallback or equivalent. The version-migration spec already acknowledges this gap.

**DC-3: 585 tests must continue passing.**
Phase 50 established 585 tests (vitest + node:test) with zero failures. New work must not break existing tests and should add tests for new behavior (UPD-05 is explicitly a test requirement).

**DC-4: Upstream drift clusters C1/C5/C6/C7 must be absorbed.**
- C1: Config preservation and Codex absolute agent paths in installer
- C5 partial: `install.js` `$HOME`/`HOME` path handling
- C6 partial: `install.js` non-Claude model resolution (must reconcile with fork's Quick 32 cross-runtime model profile logic)
- C7: Hook field validation to avoid silent settings.json rejection

**DC-5: The cross-runtime-upgrade deliberation is OPEN, not concluded.**
The deliberation leans toward a command-level authority layer (Option A) but has not been decided. Phase 51 should NOT implement the full authority layer. It should implement the installer-side hardening (its actual scope) while leaving hooks for a future preflight layer to consume. Research should note where Phase 51 work would naturally feed into or conflict with the deliberation's eventual outcome.

**DC-6: `isLegacyReflectInstall()` detection already exists.**
The installer can distinguish pre-Phase-44 Reflect installs from upstream GSD by checking `gsd-file-manifest.json`. Stale cleanup must not accidentally damage upstream GSD co-installations.

**DC-7: Local patches are preserved across upgrades.**
`saveLocalPatches()` and `pruneRedundantPatches()` already handle user-modified file backup. The upgrade path must call these before overwriting files (which it already does at install.js:2397).

**DC-8: C6 model resolution conflicts with fork's cross-runtime model handling.**
Phase 49 explicitly deferred C6 `resolve_model_ids` behavioral change because it conflicts with the fork's Quick 32 cross-runtime model profile logic. Phase 51 receives the `install.js` portion of C6 and must reconcile carefully — the installer's model resolution may differ from the runtime's.

</constraints>

<questions>
## Open Questions

### Q1: Per-version migration spec format and storage
- **Type:** formal
- **Why it matters:** UPD-06 requires each release to ship a migration spec. The format determines how the installer reads and assembles MIGRATION-GUIDE.md, and how future releases add new specs.
- **Downstream decision affected:** MIGRATION-GUIDE.md generation logic, release workflow, spec authoring process
- **Reversibility:** Medium — changing format later requires migrating existing specs
- **What research should investigate:** Options include: (a) JSON/YAML files in a `migrations/` directory per version, (b) a single manifest-level `release_notes[]` array in feature-manifest.json, (c) Markdown files per version. Evaluate against: machine-readability for installer, human-readability for authoring, and git-friendliness.

### Q2: Whether upgrade-project consumes the migration guide or is replaced by it
- **Type:** efficient
- **Why it matters:** `upgrade-project` currently runs manifest-based config migration and mini-onboarding. MIGRATION-GUIDE.md is a broader artifact. The relationship between them determines whether the user runs upgrade-project and then reads the guide, or whether the guide IS the upgrade experience.
- **Downstream decision affected:** upgrade-project workflow changes, user documentation, health-check findings
- **Reversibility:** High — the two can be decoupled or coupled later without data loss
- **What research should investigate:** Current upgrade-project workflow behavior, what it does that the guide wouldn't, whether they should be companions (guide as output, upgrade-project as action) or merged.

### Q3: How migration guide auto-surfaces after installer runs inside a Claude session
- **Type:** efficient
- **Why it matters:** The roadmap open design question asks how the guide is "auto-triggered." In a Claude session, the installer runs as a shell command. The guide needs to surface without requiring the user to know to look for it.
- **Downstream decision affected:** Hook behavior (Claude), command output (all runtimes), user flow
- **Reversibility:** High — surfacing mechanism can be changed independently of guide content
- **What research should investigate:** Options: (a) installer prints "see MIGRATION-GUIDE.md" to stdout, (b) health-check detects the guide and nudges, (c) session-start hook reads the guide if present. Evaluate cross-runtime feasibility.

### Q4: Compound vs sequential vs hybrid for advisory sections in migration guide
- **Type:** formal
- **Why it matters:** "Compound" means one section per version covering all topics. "Sequential" means one section per topic across versions. "Hybrid" mixes both. This shapes readability and the generation algorithm.
- **Downstream decision affected:** MIGRATION-GUIDE.md template, installer generation logic
- **Reversibility:** High — template can be changed without affecting source specs
- **What research should investigate:** Which structure best serves a user upgrading across multiple versions (e.g., v1.14→v1.18). Consider: are users more likely to read version-by-version or topic-by-topic?

### Q5: What stale artifacts beyond gsd-tools.js need cleanup for v1.17→v1.18?
- **Type:** material
- **Why it matters:** UPD-02 requires detecting and cleaning stale runtime files. The obvious case is `gsd-tools.js`, but there may be other pre-modularization artifacts (old inline functions that became modules, old test helpers, old hook scripts already covered).
- **Downstream decision affected:** `cleanupOrphanedFiles()` additions
- **Reversibility:** High — orphan list is just an array
- **What research should investigate:** Diff the v1.17 installed file tree against v1.18 to identify files present in v1.17 but not in v1.18. Cross-reference with existing cleanupOrphanedFiles list to avoid duplicates.

### Q6: How to reconcile C6 installer model resolution with fork's cross-runtime model profile
- **Type:** material
- **Why it matters:** Upstream changed non-Claude model resolution in `install.js`. The fork already has cross-runtime model profile logic (Quick 32) that may conflict. Phase 49 deferred the `core.cjs` portion; Phase 51 receives the `install.js` portion.
- **Downstream decision affected:** Whether upstream's install.js model changes are adopted as-is, adapted, or rejected
- **Reversibility:** Medium — model resolution affects installed agent specs across all runtimes
- **What research should investigate:** Compare upstream's `install.js` model resolution changes (commit `02254db`) against the fork's Quick 32 cross-runtime model profile behavior. Determine if they're compatible, complementary, or conflicting.

</questions>

<guardrails>
## Epistemic Guardrails

**G1: Do not implement command-level authority preflight.**
The cross-runtime-upgrade deliberation is OPEN. Phase 51 handles installer-side upgrade hardening. Any work that starts building a centralized command-entry preflight belongs to a future phase after the deliberation concludes. Research should note natural integration points but not act on them.

**G2: Verify that stale cleanup does not damage upstream GSD co-installations.**
`isLegacyReflectInstall()` distinguishes Reflect from upstream. Any new stale file cleanup must check this before deleting files that could belong to co-installed upstream GSD.

**G3: Test the upgrade path, not just the final state.**
UPD-05 requires a v1.17→v1.18 upgrade test. This must simulate a real v1.17 installation state (with old files, old config, old hooks) and verify the full upgrade, not just check that v1.18 installs correctly from scratch.

**G4: Do not expand the controlled exception for field renames.**
Phase 49 established rename_field as the sole migration mutation type. Phase 51 should not introduce new mutation types without explicit deliberation.

**G5: The C6 model resolution reconciliation must not break existing cross-runtime model profile behavior.**
Quick 32 established per-runtime model resolution with cross-runtime tier language. Any C6 adoption that changes install-time model resolution must be verified against the existing behavior for all 4 runtimes.

</guardrails>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the constraints above.

</specifics>

<deferred>
## Deferred Ideas

- **Full command-level authority/preflight layer** — belongs to a future phase after the cross-runtime-upgrade deliberation concludes (Option A in the deliberation)
- **Project-local KB write enforcement** — the signal identifies KB write leaks to `~/.gsd/knowledge/`, but enforcing project-local-only writes is architectural work beyond this phase's installer focus
- **Config authority convergence** (eliminating `templates/config.json` as separate artifact) — deliberation open question #4, not Phase 51 scope

</deferred>

---

*Phase: 51-update-system-hardening*
*Context gathered: 2026-03-26*
