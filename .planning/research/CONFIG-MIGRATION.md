# Config Migration Architecture for Upstream Sync Integration

**Domain:** Manifest-driven config evolution with upstream breaking change absorption
**Researched:** 2026-03-10
**Overall confidence:** HIGH (based on direct code analysis, no external sources needed)

---

## Executive Summary

The fork's manifest-driven config migration system (`feature-manifest.json` + `apply-migration` CLI) is architecturally superior to upstream's hardcoded point-fix approach, but it currently has **no mechanism for handling renames or deletions** -- only additive operations (missing features, missing fields, type coercion). Upstream's `depth -> granularity` rename (commit `c298a1a`) is a concrete example of a breaking change that the manifest system cannot express today.

The fork already has `"granularity": "fine"` in its own `config.json` (the rename was applied manually at some point), but the migration system has no record of it, `KNOWN_TOP_LEVEL_KEYS` still lists `depth` (not `granularity`), and the `version-migration.md` spec explicitly forbids removing or modifying existing fields. This needs to be reconciled.

The recommended approach is a **manifest `migrations` array** -- a lightweight, ordered list of rename/transform operations that runs before the existing additive gap-fill. This keeps the additive-only philosophy intact for the common case (new features, new fields) while adding a controlled escape hatch for the rare case of upstream breaking changes.

---

## 1. Current State Analysis

### 1.1 Fork's Manifest Migration Pipeline

```
loadManifest() -> loadProjectConfig() -> iterate features -> fill gaps -> atomicWriteJson()
```

**What it does today:**
1. **feature_added**: Entire missing feature section filled with schema defaults
2. **field_added**: Individual missing fields filled with defaults
3. **type_coerced**: String "true" -> boolean true, string "7" -> number 7
4. **manifest_version_updated**: Tracks which manifest version the config conforms to

**What it cannot do today:**
- Rename a field (e.g., `depth` -> `granularity`)
- Map old values to new values (e.g., `quick` -> `coarse`, `comprehensive` -> `fine`)
- Delete deprecated fields
- Move fields between sections (e.g., top-level -> nested)
- Conditional transforms (e.g., "if `depth` exists AND `granularity` does not")

### 1.2 Upstream's Approach (for comparison)

Upstream uses **inline migration in two locations**:

**core.cjs `loadConfig()`** -- migrates project config on read:
```javascript
if ('depth' in parsed && !('granularity' in parsed)) {
  const depthToGranularity = { quick: 'coarse', standard: 'standard', comprehensive: 'fine' };
  parsed.granularity = depthToGranularity[parsed.depth] || parsed.depth;
  delete parsed.depth;
  try { fs.writeFileSync(configPath, JSON.stringify(parsed, null, 2), 'utf-8'); } catch {}
}
```

**config.cjs `cmdConfigEnsureSection()`** -- migrates `~/.gsd/defaults.json` on new project creation:
```javascript
if ('depth' in userDefaults && !('granularity' in userDefaults)) {
  // Same mapping + write-back
}
```

**Upstream approach limitations:**
- Scattered across multiple files
- No audit trail
- Not declarative
- Does not scale (each rename needs manual code additions in multiple places)

### 1.3 Current Inconsistencies in Fork

| Issue | Current State | Impact |
|-------|--------------|--------|
| `KNOWN_TOP_LEVEL_KEYS` lists `depth`, not `granularity` | `granularity` flagged as "unknown field" by `manifest validate` | LOW -- cosmetic warning only |
| `version-migration.md` says "Nothing is removed" | Policy conflicts with upstream's `delete config.depth` | MEDIUM -- policy document is outdated |
| Config has `granularity: "fine"` but migration log has no record | Audit gap | LOW -- migration log was introduced after the manual rename |
| Fork workflows still reference `depth` (plan-phase.md, spike-execution.md) | Behavioral inconsistency | MEDIUM -- workflow reads `config.depth` which no longer exists |

---

## 2. Recommended Manifest Extension: `migrations` Array

### 2.1 Schema Design

Add a top-level `migrations` array to `feature-manifest.json`. Each migration is a declarative transform that runs in order, guarded by a condition, and tagged with the version that introduced it.

```json
{
  "manifest_version": 2,
  "migrations": [
    {
      "id": "depth-to-granularity",
      "introduced": "1.18.0",
      "description": "Rename depth setting to granularity with value mapping (upstream #879)",
      "condition": { "has_key": "depth", "missing_key": "granularity" },
      "actions": [
        {
          "type": "rename_with_mapping",
          "from": "depth",
          "to": "granularity",
          "value_map": {
            "quick": "coarse",
            "standard": "standard",
            "comprehensive": "fine"
          },
          "unmapped_strategy": "passthrough"
        }
      ]
    }
  ],
  "features": { ... }
}
```

### 2.2 Migration Action Types

Start minimal -- only the types needed for known upstream changes. Extend later if needed.

| Action Type | Purpose | Example |
|-------------|---------|---------|
| `rename` | Rename a top-level key, preserve value | `depth` -> `granularity` (if no value mapping needed) |
| `rename_with_mapping` | Rename key AND transform value | `depth:quick` -> `granularity:coarse` |
| `move` | Move field from one section to another | Future: if upstream restructures config |
| `delete` | Remove deprecated field (after rename) | Clean up `depth` after `granularity` exists |

### 2.3 Condition Predicates

| Predicate | Semantics |
|-----------|-----------|
| `has_key` | Config has this top-level key |
| `missing_key` | Config does NOT have this key |
| `has_nested` | Config has `section.field` (dot-notation) |
| `version_below` | `gsd_reflect_version` < specified version |

Conditions are AND-combined (all must be true). This is sufficient for known use cases.

### 2.4 Execution Order

```
1. Load manifest migrations[]
2. For each migration (in array order):
   a. Check condition -- skip if not met
   b. Execute actions in order
   c. Record in changes[] array
3. Run existing additive gap-fill (feature_added, field_added, type_coerced)
4. Update manifest_version
5. atomicWriteJson()
```

Migrations run BEFORE additive gap-fill because renames may create the keys that gap-fill then enriches.

### 2.5 Why NOT Agent-Side Migration

An alternative is to let agent instructions handle renames (e.g., add a step to `upgrade-project.md`). This was explicitly rejected by a project key decision: "Critical state transitions must be programmatic (scripts/hooks), not agent instructions" (see PROJECT.md). The KB data loss incident (sig-2026-02-11-kb-data-loss-migration-gap) reinforces this -- agent-instruction-based migrations are unreliable.

---

## 3. KNOWN_TOP_LEVEL_KEYS Update

The `KNOWN_TOP_LEVEL_KEYS` set in `gsd-tools.js` must be updated:

```javascript
const KNOWN_TOP_LEVEL_KEYS = new Set([
  'mode', 'granularity', 'model_profile', 'commit_docs', 'search_gitignored',
  'branching_strategy', 'phase_branch_template', 'milestone_branch_template',
  'workflow', 'planning', 'parallelization', 'gates', 'safety',
  'gsd_reflect_version', 'manifest_version', 'brave_search',
  // Legacy keys kept for migration detection:
  'depth',
]);
```

Keep `depth` so that pre-migration configs are not flagged as having unknown fields. The migration system handles converting it. Remove `depth` only in a future version after all known user configs have been migrated (probably never -- defensive inclusion is cheap).

---

## 4. Handling Unknown Upstream Config Fields

### 4.1 The Problem

Upstream may introduce config fields that the fork's manifest does not declare. Currently these appear as `unknown_fields` warnings in `manifest validate`. This is correct behavior and should be preserved.

### 4.2 Classification

| Category | Example | Fork Response |
|----------|---------|--------------|
| **Renamed fields** | `depth` -> `granularity` | Add migration to manifest |
| **New upstream fields fork should adopt** | `nyquist_validation` in workflow section | Add to KNOWN_TOP_LEVEL_KEYS or manifest features |
| **New upstream fields fork ignores** | Upstream-specific settings | Leave as unknown_fields (warning, never error) |
| **Fork-only fields** | `gsd_reflect_version`, feature sections | Already handled by manifest |

### 4.3 Policy: Lenient by Default

The current design is correct: unknown fields produce warnings, never errors, and are never deleted. This means:

- A user who installs upstream GSD, creates a project, then switches to the fork loses no config
- A user who runs upstream workflows that write unknown config fields is not broken
- The fork's migration system is additive and non-destructive

**Keep this policy.** The manifest `migrations` array should be the ONLY mechanism that ever renames or deletes fields, and only for fields the fork has explicitly adopted.

---

## 5. Version-Jump Migration Test Matrix

### 5.1 Scenarios

Projects can be at various starting points when upgrading. The migration system must handle all of these correctly.

| Scenario | Starting Config | Expected After Migration |
|----------|----------------|------------------------|
| **S1: Fresh v1.12 project** | `depth: "standard"`, no feature sections except health_check + devops | `granularity: "standard"`, all 7 feature sections, depth removed |
| **S2: v1.15 project** | `depth: "quick"`, health_check + devops + release | `granularity: "coarse"`, all 7 feature sections, depth removed |
| **S3: v1.16 project** | `depth: "comprehensive"`, 5 feature sections | `granularity: "fine"`, all 7 feature sections, depth removed |
| **S4: v1.17 project (already renamed)** | `granularity: "fine"`, all 7 feature sections | No changes (idempotent) |
| **S5: Project with both depth AND granularity** | Both present (should not happen, but defensive) | `granularity` preserved, `depth` left alone (condition `missing_key: granularity` fails) |
| **S6: Project with unknown upstream fields** | `granularity: "standard"`, `nyquist_validation: true` | Unknown fields preserved, feature sections added |
| **S7: Pre-tracking project** | No `gsd_reflect_version`, has `depth` | `granularity` set, version set, feature sections added |

### 5.2 Test Structure

```
describe('manifest migrations', () => {
  describe('depth-to-granularity rename', () => {
    test('S1: renames depth to granularity with value mapping')
    test('S2: maps quick -> coarse')
    test('S3: maps comprehensive -> fine')
    test('S4: idempotent when granularity already exists')
    test('S5: skips when both depth and granularity present')
    test('S6: preserves unknown upstream fields')
    test('S7: handles pre-tracking projects')
    test('unmapped depth value passes through unchanged')
    test('migration changes recorded in output')
  })

  describe('migration + additive gap-fill interaction', () => {
    test('rename runs before gap-fill so new features see renamed field')
    test('migration log records both rename and additive changes')
  })

  describe('version-jump scenarios', () => {
    test('v1.12 -> v1.18: rename + 5 new feature sections')
    test('v1.15 -> v1.18: rename + 2 new feature sections')
    test('v1.17 -> v1.18: only automation field additions')
    test('v1.18 -> v1.18: no changes (fully current)')
  })

  describe('condition evaluation', () => {
    test('has_key matches top-level key')
    test('missing_key matches absent key')
    test('both conditions must be true (AND)')
    test('migration skipped when condition fails')
  })

  describe('backward compatibility', () => {
    test('user-set values are never overwritten by defaults')
    test('automation.stats preserved through migration')
    test('automation.reflection.last_reflect_at preserved')
    test('existing feature sections keep user values')
  })
})
```

### 5.3 Integration Test: Full Version-Jump

One high-value integration test that simulates a realistic upgrade path:

```
test('full version-jump: v1.12 config through v1.18 migration', () => {
  // Create a config that looks like a real v1.12 project
  const v1_12_config = {
    mode: 'yolo',
    depth: 'standard',
    model_profile: 'quality',
    commit_docs: true,
    parallelization: true,
    health_check: {
      frequency: 'milestone-only',
      stale_threshold_days: 7,
      blocking_checks: false
    },
    devops: {
      ci_provider: 'github-actions',
      deploy_target: 'none',
      commit_convention: 'conventional',
      environments: []
    },
    gsd_reflect_version: '1.12.2'
  };

  // Run migration
  // Assert:
  //   - depth removed, granularity: 'standard' present
  //   - release section added with defaults
  //   - signal_lifecycle section added with defaults
  //   - signal_collection section added with defaults
  //   - spike section added with defaults
  //   - automation section added with defaults
  //   - health_check gains new fields (workflow_thresholds, resolution_ratio_threshold, etc.)
  //   - existing user values preserved (mode: 'yolo', ci_provider: 'github-actions')
  //   - manifest_version updated
  //   - gsd_reflect_version NOT changed (that's upgrade-project's job, not migration's)
  //   - changes array contains rename + feature_added + field_added entries
})
```

---

## 6. Workflow Reference Updates

The `depth -> granularity` rename is not just a config field change. Several fork workflow/reference files still reference `depth`:

| File | Reference | Action |
|------|-----------|--------|
| `get-shit-done/workflows/plan-phase.md` (lines 179-182) | `config.depth`, `depth: quick/standard/comprehensive` | Replace with `config.granularity`, `granularity: coarse/standard/fine` |
| `get-shit-done/references/spike-execution.md` (lines 229-232) | `depth: quick/standard/comprehensive` | Replace with `granularity: coarse/standard/fine` |
| `get-shit-done/templates/roadmap.md` (line 108) | "Phase count depends on depth setting (quick: 3-5, standard: 5-8, comprehensive: 8-12)" | Update to use `granularity` terminology |

These are fork-modified files (or fork-only references), so updating them is safe and does not conflict with upstream.

---

## 7. Policy Update: Additive-Only With Controlled Exceptions

### 7.1 Current Policy (version-migration.md)

> Migrations are ALWAYS additive. New config fields are added with sensible defaults. New directories are created if needed. Templates are updated. Nothing is removed. Nothing existing is modified.

### 7.2 Proposed Policy

> Migrations are additive by default. The manifest gap-fill system only adds missing features, missing fields, and coerces types -- it never removes or renames anything.
>
> **Exception: Manifest migrations.** The `migrations[]` array in `feature-manifest.json` may declare rename or delete operations for specific fields. These are:
> - Guarded by explicit conditions (never unconditional)
> - Recorded in the changes array and migration log
> - Ordered and idempotent (running twice produces the same result)
> - Used only to absorb upstream breaking changes, never for fork-internal refactoring
>
> The principle "a migrated project behaves identically to before" still holds -- renames with value mapping preserve the semantic meaning of user configuration.

---

## 8. Implementation Sequence

### Phase 1: Manifest Schema Extension
1. Add `migrations` array to `feature-manifest.json` with `depth-to-granularity` migration
2. Bump `manifest_version` to 2
3. Update `KNOWN_TOP_LEVEL_KEYS` to include `granularity` (keep `depth` for compat)
4. Implement `executeMigrations()` function in gsd-tools.js
5. Wire into `cmdManifestApplyMigration()` before existing gap-fill loop

### Phase 2: Tests
1. Unit tests for condition evaluation
2. Unit tests for each action type (rename, rename_with_mapping)
3. Version-jump scenario tests (S1-S7)
4. Integration test for full v1.12 -> v1.18 migration
5. Backward compatibility tests

### Phase 3: Cleanup
1. Update `version-migration.md` with new policy
2. Update workflow files referencing `depth`
3. Update `migration-log.md` with retrospective entry for manual granularity rename

---

## 9. Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Migration deletes user data | HIGH | Conditions are AND-gated; `rename_with_mapping` never deletes without creating replacement; `unmapped_strategy: passthrough` preserves unknown values |
| Migration runs out of order | MEDIUM | Array ordering is declarative; each migration has an `id` for dedup; condition guards prevent double-application |
| Future upstream renames compound | LOW | Each rename is independent; migrations are idempotent; worst case is a chain of renames that runs in sequence |
| Migration on read vs on explicit command | MEDIUM | Keep migration on explicit command only (`apply-migration`). DO NOT add load-time migration like upstream does -- that caused the KB data loss pattern |
| `manifest_version` 1 -> 2 breaks old fork versions | LOW | Old versions ignore `migrations` key entirely (they only read `features`); `manifest_version` is informational, not gating |

---

## 10. Open Questions

| Question | Current Answer | Needs Resolution? |
|----------|---------------|-------------------|
| Should `~/.gsd/defaults.json` also be migrated? | Upstream does this in `cmdConfigEnsureSection`. Fork does not have `defaults.json` currently. | NO -- defer until fork adopts `defaults.json` |
| Should migration log record that `depth -> granularity` was already done manually? | Nice to have for audit trail, not blocking. | LOW PRIORITY |
| Should the migration system support nested field renames (e.g., `workflow.auto_advance`)? | Not needed for any known upstream change. | DEFER -- add when needed |
| Should `gsd_reflect_version` be auto-updated by `apply-migration`? | Currently not -- that is `upgrade-project`'s responsibility. | KEEP CURRENT -- separation of concerns |

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Current system analysis | HIGH | Direct code reading, no ambiguity |
| Upstream breaking changes | HIGH | Exact commit diff analyzed (c298a1a) |
| Manifest extension design | HIGH | Minimal, fits existing architecture, proven pattern (ordered migrations) |
| Test matrix | HIGH | Derived from actual version history and real config snapshots |
| Workflow reference updates | HIGH | Grep confirmed exact locations |
| Policy implications | MEDIUM | The additive-only exception is a judgment call; team should validate |

---

## Sources

All analysis based on direct code examination:
- `get-shit-done/feature-manifest.json` -- manifest schema (7 features)
- `get-shit-done/bin/gsd-tools.js` lines 480-610 (manifest helpers), 4778-5060 (manifest commands)
- `get-shit-done/bin/gsd-tools.test.js` lines 2037-2984 (manifest test suite)
- `get-shit-done/references/version-migration.md` -- migration specification
- `.planning/config.json` -- current project config
- `.planning/fork-audit/01-upstream-changes.md` -- upstream analysis
- `.planning/fork-audit/08-feature-overlap.md` -- config migration overlap
- `.planning/FORK-DIVERGENCE-AUDIT.md` -- divergence audit
- Upstream commit `c298a1a` (depth -> granularity rename) via `git show`
- Upstream `get-shit-done/bin/lib/config.cjs` and `core.cjs` via `git show upstream/main:`
- KB signal `sig-2026-02-11-kb-data-loss-migration-gap` -- data loss from non-programmatic migration
