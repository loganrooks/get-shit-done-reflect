# Phase 49: Config Migration - Research

**Researched:** 2026-03-26
**Domain:** Manifest-driven config migration, field renames, upstream drift reconciliation
**Confidence:** HIGH

## Summary

Phase 49 sits at the intersection of two concerns: (1) completing the `depth`-to-`granularity` rename as a manifest-driven migration with declarative field-rename support, and (2) absorbing five upstream drift clusters (C3, C5 partial, C6 partial, C8, C9) that all touch config-loading and planning-path infrastructure. The codebase already has a partially complete depth-to-granularity migration: `core.cjs` and `config.cjs` both perform the rename inline in `loadConfig()`, and the project's own `config.json` already reads `"granularity": "fine"`. However, the manifest system (`feature-manifest.json`) has no `migrations[]` mechanism, `KNOWN_TOP_LEVEL_KEYS` in `manifest.cjs` still lists `depth` instead of `granularity`, and at least 8 workflow/reference files still reference `depth` as a config key.

The upstream drift clusters routed here are additive and low-conflict with the fork's existing modular architecture. C8 (commit_docs gitignore auto-detect) is a clean 10-line patch to `loadConfig()`. C9 (planningPaths helper) is a refactor adding a convenience helper. C3 (worktree-aware resolution) adds new functions to `core.cjs`. C5 partial (init.cjs HOME) and C6 partial (core.cjs model resolution) are narrower changes. None conflict with the fork's `loadManifest`, `loadProjectConfig`, `atomicWriteJson`, or `parseIncludeFlag` additions.

**Primary recommendation:** Extend `feature-manifest.json` with a `migrations[]` array, implement the rename migration type in `manifest.cjs`'s `cmdManifestApplyMigration`, update `KNOWN_TOP_LEVEL_KEYS` to use `granularity`, update workflow files, then absorb the five upstream drift clusters as compatible patches to `core.cjs` and `init.cjs`.

## Standard Stack

### Core

This phase modifies existing project infrastructure. No new external libraries are needed.

| Module | Location | Purpose | Why It Matters |
|--------|----------|---------|----------------|
| `manifest.cjs` | `get-shit-done/bin/lib/manifest.cjs` | Feature manifest diff, validate, migrate | Hosts `KNOWN_TOP_LEVEL_KEYS` and `cmdManifestApplyMigration` |
| `core.cjs` | `get-shit-done/bin/lib/core.cjs` | Shared helpers, `loadConfig`, `loadManifest` | Already has inline depth-to-granularity migration; receives C3/C8/C9 upstream patches |
| `config.cjs` | `get-shit-done/bin/lib/config.cjs` | Config CRUD, `VALID_CONFIG_KEYS` | Already uses `granularity` in its key set; has inline depth migration in `cmdConfigEnsureSection` |
| `init.cjs` | `get-shit-done/bin/lib/init.cjs` | Init commands for workflow bootstrapping | Receives C5 partial (HOME path) upstream patch |
| `feature-manifest.json` | `get-shit-done/feature-manifest.json` | Declarative feature/config schema | Needs `migrations[]` array extension |
| `version-migration.md` | `get-shit-done/references/version-migration.md` | Migration spec | Needs controlled-exception mechanism documented |

### Supporting

| File | Location | Purpose | Change Needed |
|------|----------|---------|---------------|
| `gsd-tools.test.js` | `get-shit-done/bin/gsd-tools.test.js` | Test suite (~145 tests) | Add migration/rename tests |
| `gsd-tools-fork.test.js` | `get-shit-done/bin/gsd-tools-fork.test.js` | Fork-specific tests | Add fork-relevant migration tests |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manifest-level `migrations[]` | Keep inline `loadConfig` migration only | Inline migration is already working but is not declarative, not auditable, and cannot express arbitrary renames without code changes. The manifest approach is the declared project direction (CFG-01). |
| Version-gated migration steps | Single-pass schema-diff migration | Version-gated would allow ordered multi-version chains but adds complexity. The current `apply-migration` already handles additive gaps. The migration array needs only `rename` support for this phase. |

## Architecture Patterns

### Current Migration Architecture

```
feature-manifest.json           core.cjs loadConfig()
        |                              |
   (schema-based)                 (inline code)
        |                              |
  cmdManifestApplyMigration      depth->granularity
  - adds missing features         rename + write-back
  - adds missing fields
  - coerces types
  - updates manifest_version
```

**Gap:** The manifest migration (`apply-migration`) handles additive schema gaps. The `depth`-to-`granularity` rename is handled by inline code in `loadConfig()` and `cmdConfigEnsureSection()`. There is no declarative mechanism for field renames.

### Target Migration Architecture

```
feature-manifest.json
  features: { ... }
  migrations: [
    { type: "rename_field", from: "depth", to: "granularity",
      value_map: { quick: "coarse", standard: "standard", comprehensive: "fine" },
      version: "1.15.0" }
  ]
        |
  cmdManifestApplyMigration
  1. Apply schema-gap migrations (existing)
  2. Apply rename migrations from migrations[] (new)
  3. Preserve unknown fields (existing, verify CFG-06)
  4. Log changes (existing)
```

### Pattern 1: Declarative Field Rename Migration

**What:** A `migrations[]` array in `feature-manifest.json` that declares field renames with optional value mappings.

**When to use:** Any breaking config key change that needs to propagate to existing projects automatically.

**Schema:**
```json
{
  "migrations": [
    {
      "type": "rename_field",
      "version": "1.15.0",
      "from": "depth",
      "to": "granularity",
      "scope": "top_level",
      "value_map": {
        "quick": "coarse",
        "standard": "standard",
        "comprehensive": "fine"
      }
    }
  ]
}
```

**Implementation in `cmdManifestApplyMigration`:**
```javascript
// After existing schema-gap migration, before manifest_version update:
if (manifest.migrations) {
  for (const migration of manifest.migrations) {
    if (migration.type === 'rename_field' && migration.scope === 'top_level') {
      if (migration.from in projectConfig && !(migration.to in projectConfig)) {
        const oldValue = projectConfig[migration.from];
        const newValue = migration.value_map?.[oldValue] ?? oldValue;
        projectConfig[migration.to] = newValue;
        delete projectConfig[migration.from];
        changes.push({
          type: 'field_renamed',
          from: migration.from,
          to: migration.to,
          old_value: oldValue,
          new_value: newValue,
        });
      }
    }
  }
}
```

### Pattern 2: Unknown Field Preservation (CFG-06)

**What:** Config fields not declared in the manifest or `KNOWN_TOP_LEVEL_KEYS` must survive migration -- they are reported as informational but never deleted.

**Current behavior verified:** `cmdManifestApplyMigration` already ONLY adds/coerces fields. It does NOT delete unknown keys. `cmdManifestDiffConfig` reports unknown fields as informational. `cmdManifestValidate` reports them as warnings but passes validation. This means CFG-06 is architecturally satisfied by the current design, but needs a dedicated test to prove it.

### Pattern 3: Multi-Version Upgrade Chain (CFG-05)

**What:** A config from v1.14 should upgrade through v1.15, v1.16, v1.17, v1.18 and arrive at correct v1.18 state.

**How:** The migration system is idempotent by design:
1. `apply-migration` checks each feature/field for presence before adding
2. Rename migrations check `from in config && !(to in config)` before renaming
3. Running migration twice produces the same result

**Testing:** Create a v1.14 config fixture (no health_check, no signal_lifecycle, uses `depth`), run `apply-migration`, verify intermediate state, repeat through version changes. The key insight is that `apply-migration` does not need explicit version gates because the schema-diff approach is naturally idempotent.

### Pattern 4: Upstream Drift Absorption

**What:** Five upstream clusters (C3, C5 partial, C6 partial, C8, C9) need to be integrated into fork's `core.cjs` and `init.cjs`.

**Conflict assessment (from UPSTREAM-DRIFT-LEDGER):**
- Fork additions (`parseIncludeFlag`, `loadManifest`, `loadProjectConfig`, `atomicWriteJson`) are in orthogonal regions
- `planningPaths()` (C9) does not conflict with `loadProjectConfig()` -- different concerns
- `commit_docs` auto-detect (C8) is a clean enhancement to the existing `loadConfig()` return block
- `resolveWorktreeRoot` (C3) adds new functions, no collision with fork code
- `init.cjs` HOME handling (C5 partial) affects `cmdInitNewProject` where fork has no modifications

**Integration order:** C9 first (planningPaths helper -- pure addition), C8 second (loadConfig enhancement), C3 third (worktree resolution), C5/C6 last (init/model patches).

### Anti-Patterns to Avoid

- **Inline migration code duplication:** The depth-to-granularity rename currently exists in THREE places (core.cjs loadConfig, config.cjs cmdConfigEnsureSection, future manifest migration). After manifest migration is working, the inline code in loadConfig and cmdConfigEnsureSection should remain as a belt-and-suspenders safety net, but the authoritative migration path should be manifest-driven.

- **Deleting unknown fields during migration:** The current architecture correctly preserves unknown fields. Any change to `cmdManifestApplyMigration` must maintain this invariant.

- **Breaking `KNOWN_TOP_LEVEL_KEYS` before migration is live:** If `depth` is removed from `KNOWN_TOP_LEVEL_KEYS` before the rename migration runs, projects with `depth` in their config would see it flagged as "unknown" before it gets renamed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config schema diffing | Custom diff logic | Existing `cmdManifestDiffConfig` | Already handles missing features, fields, type mismatches, enum mismatches, unknown fields |
| Atomic JSON writes | Direct `fs.writeFileSync` | Existing `atomicWriteJson` (core.cjs) | Write-to-tmp-then-rename prevents corruption on crash |
| Migration logging | Custom log format | Existing `cmdManifestLogMigration` | Already handles prepend-after-header and append-only semantics |
| Version comparison | String comparison | Existing semver logic in version-migration.md | Handles major.minor.patch correctly |

**Key insight:** The manifest migration infrastructure is already 80% built. This phase extends it with rename support, not rebuilds it.

## Common Pitfalls

### Pitfall 1: KNOWN_TOP_LEVEL_KEYS Synchronization

**What goes wrong:** `KNOWN_TOP_LEVEL_KEYS` in `manifest.cjs` and `VALID_CONFIG_KEYS` in `config.cjs` drift out of sync. Currently `manifest.cjs` lists `depth` while `config.cjs` lists `granularity`.
**Why it happens:** These are two independent constant sets maintained in different modules, both encoding "what config keys are expected."
**How to avoid:** Update both atomically. After migration is live: `manifest.cjs` KNOWN_TOP_LEVEL_KEYS gets `granularity` (replace `depth`). `config.cjs` VALID_CONFIG_KEYS already has `granularity`. Signal SIG-260222-008-known-top-level-keys-deduplication previously flagged this duplication.
**Warning signs:** `manifest diff-config` reports `granularity` as unknown field, or `manifest validate` warns about it.

### Pitfall 2: Workflow Files Using Shell Grep for `depth`

**What goes wrong:** `reflect.md` line 90 uses a shell command to grep for `"depth"` in config.json. After migration, the field is `granularity` but the shell command still looks for `depth`.
**Why it happens:** Workflow files use hardcoded shell commands, not the programmatic config API.
**How to avoid:** Update all workflow file references. The shell grep in reflect.md needs to become `"granularity"` with the new enum values (`coarse|standard|fine`).
**Warning signs:** Reflection workflow always falls back to default because grep finds nothing.

### Pitfall 3: Migration Idempotency Edge Case

**What goes wrong:** A config that has BOTH `depth` and `granularity` (manually edited or from a partial migration) gets the wrong result.
**Why it happens:** The rename migration checks `from in config && !(to in config)`. If both exist, it skips the rename, which is correct. But the old `depth` key lingers.
**How to avoid:** The rename migration should have a cleanup pass: if both `from` and `to` exist, delete `from` (the new key wins). Add a test for this edge case.
**Warning signs:** Config has both `depth` and `granularity` after migration.

### Pitfall 4: Upstream Merge Conflicts in core.cjs

**What goes wrong:** Cherry-picking upstream commits (C3, C8, C9) into the fork's core.cjs produces merge conflicts around the fork's appended exports.
**Why it happens:** Fork additions are appended at the bottom of core.cjs. Upstream changes modify the middle sections. Line-based merge tools may conflict at module.exports boundaries.
**How to avoid:** Apply upstream patches to the upstream-owned portion of core.cjs only. The fork's `module.exports.parseIncludeFlag`, `loadManifest`, `loadProjectConfig`, and `atomicWriteJson` are appended after the upstream `module.exports` block and should not conflict.
**Warning signs:** Test failures after merge. Run `npm test` after each upstream patch absorption.

### Pitfall 5: Value Mapping Completeness

**What goes wrong:** A project has `depth: "custom_value"` (not in the value map). The migration passes through the custom value unchanged, which may not be a valid `granularity` enum value.
**Why it happens:** The value_map is a convenience for known values. Unknown values fall through with `value_map?.[oldValue] ?? oldValue`.
**How to avoid:** This is actually the correct behavior -- preserve unknown values rather than destroying user data. The subsequent `manifest validate` will flag it as an enum mismatch if needed.
**Warning signs:** None -- this is acceptable behavior.

## Code Examples

### Example 1: Feature Manifest with migrations[] Array

```json
{
  "manifest_version": 2,
  "migrations": [
    {
      "type": "rename_field",
      "version": "1.15.0",
      "from": "depth",
      "to": "granularity",
      "scope": "top_level",
      "value_map": {
        "quick": "coarse",
        "standard": "standard",
        "comprehensive": "fine"
      }
    }
  ],
  "features": {
    "health_check": { ... }
  }
}
```
Source: Derived from requirements CFG-01, CFG-02 and current manifest structure.

### Example 2: Rename Migration in cmdManifestApplyMigration

```javascript
// In cmdManifestApplyMigration, after existing feature/field migration loop:
if (Array.isArray(manifest.migrations)) {
  for (const migration of manifest.migrations) {
    if (migration.type === 'rename_field') {
      const { from, to, scope, value_map } = migration;
      if (scope === 'top_level') {
        if (from in projectConfig) {
          const oldValue = projectConfig[from];
          const newValue = value_map?.[oldValue] ?? oldValue;
          projectConfig[to] = newValue;
          delete projectConfig[from];
          changes.push({
            type: 'field_renamed',
            from, to,
            old_value: oldValue,
            new_value: newValue,
          });
        }
      }
    }
  }
}
```
Source: Derived from existing `cmdManifestApplyMigration` pattern in manifest.cjs.

### Example 3: formatMigrationEntry Extension for Renames

```javascript
// Add to existing formatMigrationEntry in manifest.cjs:
} else if (change.type === 'field_renamed') {
  entry += `- Renamed \`${change.from}\` to \`${change.to}\``;
  if (change.old_value !== change.new_value) {
    entry += ` (value: ${JSON.stringify(change.old_value)} -> ${JSON.stringify(change.new_value)})`;
  }
  entry += '\n';
}
```
Source: Derived from existing formatMigrationEntry pattern.

### Example 4: Upstream C8 commit_docs Auto-Detect Patch

```javascript
// Replace in loadConfig() return block:
commit_docs: (() => {
  const explicit = get('commit_docs', { section: 'planning', field: 'commit_docs' });
  if (explicit !== undefined) return explicit;
  if (isGitIgnored(cwd, '.planning/')) return false;
  return defaults.commit_docs;
})(),
```
Source: Upstream commit 28166e4 (released v1.26.0).

### Example 5: Multi-Version Upgrade Test Fixture

```javascript
// v1.14 config fixture (pre-health-check, pre-signal-lifecycle, uses depth)
const v114Config = {
  mode: 'yolo',
  depth: 'comprehensive',
  parallelization: true,
  commit_docs: true,
  model_profile: 'balanced',
  workflow: { research: true, plan_check: true, verifier: true },
  gsd_reflect_version: '1.14.0',
  manifest_version: 1,
};

// After apply-migration with full manifest, expect:
// - depth renamed to granularity: "fine"
// - health_check section added with defaults
// - devops section added with defaults
// - signal_lifecycle section added with defaults
// - signal_collection section added with defaults
// - spike section added with defaults
// - automation section added with defaults
// - release section added with defaults
// - manifest_version: 2 (if bumped)
```
Source: Derived from current feature-manifest.json feature set.

## Inventory of Files That Reference `depth` as Config Key

Critical for CFG-04 and for understanding the full scope:

| File | Line(s) | Type of Reference | Update Needed |
|------|---------|-------------------|---------------|
| `manifest.cjs` L13 | `KNOWN_TOP_LEVEL_KEYS` includes `'depth'` | Constant | Replace with `'granularity'` |
| `core.cjs` L92-97 | Inline depth-to-granularity migration | Runtime migration | Keep as belt-and-suspenders |
| `config.cjs` L50-55 | Inline depth-to-granularity in defaults | Runtime migration | Keep as belt-and-suspenders |
| `workflows/plan-phase.md` L179-182 | `config.depth` for spike sensitivity derivation | Workflow prose | Update to `config.granularity` with new enum values |
| `workflows/reflect.md` L20,90,100-106 | Shell grep for `"depth"`, depth enum values | Workflow prose + shell code | Update grep and enum values |
| `workflows/new-project.md` L323,979 | Config template shows `"depth"` | Template | Update to `"granularity"` |
| `workflows/run-spike.md` L20 | `derived from depth` | Workflow prose | Update to `derived from granularity` |
| `workflows/discovery-phase.md` L2,5,10-19,36-40 | `depth` as workflow parameter (NOT config key) | Workflow parameter | **No change** -- this is a workflow execution parameter, not a config field |
| `references/spike-integration.md` L118,207-210 | `config.depth` sensitivity derivation | Reference doc | Update to `config.granularity` |
| `references/milestone-reflection.md` L169,176,192 | Config examples with `"depth"` | Reference doc example | Update to `"granularity"` |
| `references/reflection-patterns.md` L692 | Mentions `depth` as config field | Reference doc | Update to `granularity` |
| `references/health-probes/config-validity.md` L37,46,48 | Shell check for `depth` field and enum | Health probe | Update to `granularity` with new enum values |

**Important distinction:** `discovery-phase.md` uses "depth" as a workflow-level parameter (`depth=verify`, `depth=standard`, `depth=deep`), NOT as a reference to the config field. These should NOT be changed.

## Upstream Drift Integration Details

### C3: Worktree-Aware Planning Resolution (0afffb1, released v1.27.0)

**What it adds:** `resolveWorktreeRoot()` function in core.cjs that detects linked worktrees and resolves to main worktree. `withPlanningLock()` for file-based locking.
**Fork impact:** Pure addition. No collision with fork exports.
**Integration:** Add functions before the fork's appended exports section.
**Tests:** Includes regression tests for worktree resolution and planning lock.

### C5 Partial: init.cjs HOME Path Handling (f9cb02e, ef4453e, released v1.28.0)

**What it changes:** Cross-platform HOME detection in init.cjs. Removes Unix-only `find` for code detection, replaces with `fs.readdirSync` recursive walk.
**Fork impact:** Low -- fork has no modifications to `cmdInitNewProject`'s code detection logic.
**Integration:** Apply the init.cjs changes. Verify fork's `parseIncludeFlag` integration is not affected.

### C6 Partial: core.cjs Non-Claude Model Resolution (02254db, released v1.28.0)

**What it changes:** Model resolution helpers for non-Claude runtimes.
**Fork impact:** Fork already has cross-runtime model profile logic via `MODEL_PROFILES` and `resolveModelInternal`. Needs reconciliation.
**Integration:** Review the upstream model resolution changes. If they add new model aliases or profiles, merge them with the fork's existing `MODEL_PROFILES` table.

### C8: commit_docs Gitignore Auto-Detection (28166e4, released v1.26.0)

**What it changes:** `loadConfig()` return block for `commit_docs`: if no explicit value in config.json and `.planning/` is gitignored, default to `false`.
**Fork impact:** Clean enhancement. Fork's loadConfig already has `isGitIgnored` available.
**Integration:** Replace the simple `commit_docs` line in loadConfig's return block with the IIFE pattern from upstream.
**Tests:** Upstream adds 5 regression tests.

### C9: planningPaths() Helper (c7954d1, 1d4deb0, released v1.25.0+)

**What it adds:** `planningPaths(cwd)` helper returning `{ planning, state, roadmap, project, config, phases, requirements }`. `planningDir(cwd)` shorthand.
**Fork impact:** Pure addition. Useful for deduplicating path construction across modules.
**Integration:** Add to core.cjs exports. Optionally adopt in fork code that constructs planning paths.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `depth: "quick\|standard\|comprehensive"` | `granularity: "coarse\|standard\|fine"` | Upstream v1.15+ | The rename happened upstream; the fork absorbed it in core.cjs/config.cjs but not in manifest or workflow files |
| Inline migration in loadConfig | Manifest-driven migration + inline fallback | Phase 49 (this work) | Declarative, auditable, extensible rename mechanism |
| Hardcoded `.planning/` paths | `planningPaths()` helper | Upstream v1.25.0 | Centralizes path construction, enables future worktree awareness |
| `commit_docs` always defaults true | Auto-detect from gitignore | Upstream v1.26.0 | Prevents executor bypass of commit gate when .planning/ is gitignored |

## Open Questions

### Resolved

- **Should `depth` be removed from `KNOWN_TOP_LEVEL_KEYS` immediately?** Yes, but only after the manifest migration is in place. The migration should run before the key set is updated so that configs with `depth` get renamed first. In the same plan, since `apply-migration` runs before `diff-config`/`validate`, this is safe.
- **Does `apply-migration` delete unknown fields?** No. Verified by reading the source: it only adds missing features, adds missing fields, and coerces types. Unknown keys pass through untouched. CFG-06 is architecturally satisfied.
- **Is the inline depth-to-granularity code in loadConfig redundant with manifest migration?** Partially. The inline code in `loadConfig()` runs on every config load and is a runtime safety net. The manifest migration runs explicitly via `apply-migration`. Both should coexist: manifest migration for explicit upgrade, inline for runtime resilience.
- **Should manifest_version bump from 1 to 2?** Yes, the addition of `migrations[]` is a schema-level change to the manifest. Projects with `manifest_version: 1` can still be migrated (the migration code handles the upgrade), but the manifest itself should declare version 2.
- **Which workflow files count as the "3 workflow files" in success criterion 4?** Based on config key references: `plan-phase.md` (L179-182), `reflect.md` (L20,90,100-106), and one of `run-spike.md`/`spike-integration.md`. The requirements text says "3 workflow files that referenced `depth`" so this likely means the .md files with config.depth references.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Should C6 (non-Claude model resolution) reconciliation happen in Phase 49 or Phase 51? | Medium | Accept in Phase 49 as scoped by the drift ledger. The reconciliation is small: compare upstream model helper changes with fork's MODEL_PROFILES. |
| Should `migrations[]` support nested field renames (e.g., `automation.reflection.some_field`)? | Low | Defer. Only top-level renames are needed now. Add nested scope support when a real use case emerges. |
| What is the testing strategy for the multi-version upgrade chain (CFG-05)? | Medium | Create a single test that starts from a v1.14 config fixture, runs apply-migration, and verifies the final state matches v1.18 expectations. No need for intermediate version snapshots since migration is idempotent. |

### Still Open

- The cross-runtime-upgrade-install-and-kb-authority deliberation is still `open` status. Phase 49 should work within its current requirements without depending on resolution of that broader question. The broader command-level authority layer question routes to Phase 51.

## Sources

### Primary (HIGH confidence)

- `get-shit-done/bin/lib/manifest.cjs` -- Direct source code read: KNOWN_TOP_LEVEL_KEYS, cmdManifestApplyMigration, migration architecture
- `get-shit-done/bin/lib/core.cjs` -- Direct source code read: loadConfig inline depth migration, fork exports, loadManifest/loadProjectConfig
- `get-shit-done/bin/lib/config.cjs` -- Direct source code read: VALID_CONFIG_KEYS, depth migration in cmdConfigEnsureSection
- `get-shit-done/bin/lib/init.cjs` -- Direct source code read: init commands, fork extensions
- `get-shit-done/feature-manifest.json` -- Direct read: current manifest schema, no migrations[] array
- `get-shit-done/references/version-migration.md` -- Direct read: migration spec, additive-only principle
- `.planning/config.json` -- Direct read: current project config state (already has granularity: "fine")
- `.planning/phases/48.1-post-audit-upstream-drift-retriage-and-roadmap-reconciliation/UPSTREAM-DRIFT-LEDGER.md` -- Direct read: cluster routing to Phase 49 (C3, C5 partial, C6 partial, C8, C9)
- Upstream commits 28166e4, 0afffb1, c7954d1 -- Direct git show/diff: commit messages, stats, diffs for C3/C8/C9

### Secondary (MEDIUM confidence)

- `.planning/deliberations/upstream-drift-retriage-and-roadmap-authority.md` -- Concluded deliberation, Option B adopted: retriage with explicit routing
- `.planning/deliberations/cross-runtime-upgrade-install-and-kb-authority.md` -- Open deliberation, Option A leaning: command-level authority layer. Phase 49 can proceed without this conclusion.

### Tertiary (LOW confidence)

- None. All findings are from direct source code and planning artifact reads.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all source files read directly, no external dependency research needed
- Architecture: HIGH -- migration system is 80% built; extension pattern is clear from code
- Pitfalls: HIGH -- identified from direct code reading and the known KNOWN_TOP_LEVEL_KEYS deduplication signal
- Upstream drift: HIGH -- all upstream commits checked directly via git show/diff

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (stable internal infrastructure, no external dependency churn)

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| SIG-260222-008-known-top-level-keys-deduplication | signal | KNOWN_TOP_LEVEL_KEYS and VALID_CONFIG_KEYS duplication creates drift risk | Pitfall 1, Architecture Patterns |
| SIG-260222-005-zero-touch-manifest-architecture | signal | Manifest extensibility enables zero-touch feature addition | Architecture Patterns (migrations[] extension follows same pattern) |
| SIG-260222-002-coerce-value-no-number-to-boolean | signal | Type coercion in migration has edge cases | Code Examples (coerceValue already handles this) |
| SIG-260222-003-atomic-write-same-directory-tmp | signal | atomicWriteJson uses same-directory tmp for safe renames | Don't Hand-Roll |
| sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift | signal | Broader upgrade/install drift beyond config migration | Open Questions (Phase 51 boundary) |
