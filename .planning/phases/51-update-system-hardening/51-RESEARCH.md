# Phase 51: Update System Hardening - Research

**Researched:** 2026-03-26
**Domain:** Installer upgrade path, migration guide generation, stale file cleanup, hook registration, upstream drift absorption
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Fresh vs upgrade detection
- The installer already detects cross-scope installations and version differences. UPD-04 requires that MIGRATION-GUIDE.md is NOT generated for fresh installs. The detection heuristic: if no previous VERSION file exists in the target directory, this is a fresh install. If a VERSION file exists and its version differs from the current package version, this is an upgrade.
- **Grounding:** `install()` at line 2372 already reads `otherScopeVersionPath`; the VERSION file is written during every install. This is a reliable detection point.

#### Stale `gsd-tools.js` cleanup
- Pre-modularization installations have `gsd-tools.js` instead of `gsd-tools.cjs`. After v1.18 upgrade, the old `.js` file must be removed to avoid confusion. This is added to `cleanupOrphanedFiles()`.
- **Grounding:** Phase 45 renamed `gsd-tools.js` to `gsd-tools.cjs`. Phase 50 (TST-01) verified zero stale `gsd-tools.js` references in installed files. The file itself still needs to be cleaned up during upgrade.

### Claude's Discretion
- Exact format and layout of MIGRATION-GUIDE.md sections
- Whether migration specs are Markdown, JSON, or YAML
- Test fixture design for the v1.17->v1.18 upgrade scenario
- Ordering and grouping of migration guide content (by version, by category, by severity)

### Deferred Ideas (OUT OF SCOPE)
- **Full command-level authority/preflight layer** -- belongs to a future phase after the cross-runtime-upgrade deliberation concludes (Option A in the deliberation)
- **Project-local KB write enforcement** -- the signal identifies KB write leaks to `~/.gsd/knowledge/`, but enforcing project-local-only writes is architectural work beyond this phase's installer focus
- **Config authority convergence** (eliminating `templates/config.json` as separate artifact) -- deliberation open question #4, not Phase 51 scope
</user_constraints>

## Summary

Phase 51 hardens the upgrade path from pre-modularization (v1.17) installations to the modularized v1.18 state. The core deliverables are: (1) generating a MIGRATION-GUIDE.md during installer upgrades that surfaces per-version change notes, (2) cleaning up stale pre-modularization files (primarily `gsd-tools.js`), (3) ensuring hook registrations reflect the current version state, (4) distinguishing fresh installs from upgrades so new users don't see migration noise, (5) an end-to-end upgrade test, and (6) per-release migration spec infrastructure. Alongside these requirements, four upstream drift clusters (C1, C5 partial, C6 partial, C7) must be absorbed into `bin/install.js`.

The installer (`bin/install.js`, 3027 lines) already has substantial infrastructure for this work: `cleanupOrphanedFiles()` removes 7 old hook files, `cleanupOrphanedHooks()` removes 10 hook registration patterns, `isLegacyReflectInstall()` detects pre-Phase-44 installs, `saveLocalPatches()`/`pruneRedundantPatches()` preserves user modifications, and VERSION file detection at line 2372 provides cross-scope version awareness. The test suite has 212 test cases (145 vitest `it()` + 67 `tmpdirTest()`) in `install.test.js` alone, with Phase 50 establishing `collectFileInventory()` and idempotency patterns.

The key architectural decision for this phase is that MIGRATION-GUIDE.md generation is installer-driven (not workflow-driven), using per-version migration specs as source data. The upgrade-project workflow remains a companion that handles config migration and mini-onboarding, while the migration guide provides human-readable documentation of what changed. The cross-runtime-upgrade deliberation is OPEN and must not be implemented; Phase 51 limits itself to installer-side hardening.

**Primary recommendation:** Use JSON migration specs stored in `get-shit-done/migrations/` keyed by version, with sequential (version-by-version) layout in MIGRATION-GUIDE.md, and integrate all four upstream drift clusters as part of the installer enhancement work.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs/path/os | Built-in | File operations, path resolution, OS detection | Installer is pure Node.js with zero external dependencies |
| node:crypto | Built-in | SHA256 file hashing for manifest generation | Already used by `fileHash()` at line 2154 |
| node:child_process | Built-in | execSync for hook builds | Already used for building hooks from source |
| vitest | 3.x | Test runner | Project standard, 585 tests established by Phase 50 |
| node:test | Built-in | Upstream gsd-tools tests | Coexists with vitest for upstream test compatibility |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| semver (inline) | N/A | Version comparison | Do NOT add as dependency; use existing dot-split numeric comparison pattern from version-migration.md |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON migration specs | YAML migration specs | JSON is already the project standard (feature-manifest.json, config.json); YAML adds parsing dependency |
| JSON migration specs | Markdown migration specs | Markdown is human-readable but not machine-parseable without custom parsing; JSON can be mechanically assembled |
| Sequential (per-version) guide layout | Compound (per-topic) layout | Sequential matches the additive migration principle and is simpler to generate; compound requires cross-version topic aggregation |

**Installation:** No new dependencies needed. All work uses existing Node.js built-ins and project infrastructure.

## Architecture Patterns

### Recommended Project Structure
```
get-shit-done/
  migrations/
    v1.15.0.json      # Migration spec for v1.15.0 changes
    v1.16.0.json      # Migration spec for v1.16.0 changes
    v1.17.0.json      # Migration spec for v1.17.0 changes
    v1.18.0.json      # Migration spec for v1.18.0 changes (new)
bin/
  install.js           # Enhanced with migration guide generation
tests/
  unit/
    install.test.js    # Extended with upgrade path tests
```

### Pattern 1: Per-Version Migration Spec (JSON)
**What:** Each release ships a JSON file in `get-shit-done/migrations/` describing what changed in that version. The installer reads applicable specs (from detected previous version to current version) and assembles MIGRATION-GUIDE.md.
**When to use:** Every release that introduces user-visible changes.
**Recommendation:** JSON format, matching the project's existing data conventions.
```javascript
// Source: Research recommendation based on feature-manifest.json pattern
// File: get-shit-done/migrations/v1.18.0.json
{
  "version": "1.18.0",
  "title": "Modularization & Cross-Runtime Hardening",
  "sections": [
    {
      "category": "breaking",
      "heading": "Runtime Entry Point Renamed",
      "body": "The runtime entry point has been renamed from `gsd-tools.js` to `gsd-tools.cjs`. The installer automatically cleans up the old file.",
      "action": "automatic"
    },
    {
      "category": "feature",
      "heading": "Modular CLI Architecture",
      "body": "The CLI has been split into 16 focused modules in `lib/`. This improves maintainability but does not change the command interface.",
      "action": "none"
    },
    {
      "category": "config",
      "heading": "Manifest Version 2",
      "body": "The manifest version has been bumped from 1 to 2. Run `/gsdr:upgrade-project` to update your project config.",
      "action": "run-upgrade-project"
    }
  ]
}
```

### Pattern 2: Fresh vs Upgrade Detection in Installer
**What:** Before generating MIGRATION-GUIDE.md, the installer reads the VERSION file at the target directory. If no VERSION file exists, this is a fresh install and no guide is generated.
**When to use:** Every install() call.
**Grounding:** The VERSION file is already read at line 2372 for cross-scope detection. The same mechanism extends to fresh-vs-upgrade detection.
```javascript
// Source: Existing installer pattern at line 2588-2594
// Read previous VERSION to determine upgrade vs fresh
const versionPath = path.join(targetDir, 'get-shit-done-reflect', 'VERSION');
let previousVersion = null;
if (fs.existsSync(versionPath)) {
  try {
    previousVersion = fs.readFileSync(versionPath, 'utf8').trim()
      .replace(/\+dev$/, ''); // Strip +dev suffix for comparison
  } catch { /* treat as fresh */ }
}

const isUpgrade = previousVersion && previousVersion !== versionString.replace(/\+dev$/, '');
const isFresh = !previousVersion;

// Only generate MIGRATION-GUIDE.md for upgrades
if (isUpgrade) {
  generateMigrationGuide(targetDir, previousVersion, pkg.version);
}
```

### Pattern 3: Extending cleanupOrphanedFiles()
**What:** Add pre-modularization stale artifacts to the existing orphaned files array.
**When to use:** When files are renamed or removed between versions.
**Grounding:** The function at line 1551 already handles 7 orphaned hook files. Adding `bin/gsd-tools.js` follows the exact same pattern.
```javascript
// Source: Existing pattern at install.js:1551
function cleanupOrphanedFiles(configDir) {
  const orphanedFiles = [
    // Existing entries (7 old hook files)...
    'hooks/gsd-notify.sh',
    'hooks/statusline.js',
    // ... etc

    // NEW: Pre-modularization stale artifacts (v1.17 -> v1.18)
    'get-shit-done-reflect/bin/gsd-tools.js',   // Renamed to gsd-tools.cjs in Phase 45
  ];
  // ... existing cleanup logic
}
```

### Pattern 4: Hook Validation (C7 Upstream Adoption)
**What:** The `validateHookFields()` function strips invalid hook entries before writing settings.json, preventing Claude Code's Zod schema from silently discarding the entire settings file.
**When to use:** After `cleanupOrphanedHooks()` and before `writeSettings()`.
**Grounding:** Upstream commit `c229259` provides 82 lines of defensive validation + 24 tests. The function checks that agent hooks have `prompt`, command hooks have `command`, and entries have valid `hooks` arrays.
```javascript
// Source: Upstream commit c229259
// Call chain: readSettings() -> cleanupOrphanedHooks() -> validateHookFields() -> ... -> writeSettings()
const settings = validateHookFields(cleanupOrphanedHooks(readSettings(settingsPath)));
```

### Pattern 5: Upgrade-Project as Companion to Migration Guide
**What:** The migration guide is documentation output; upgrade-project remains the action-oriented workflow for config migration and mini-onboarding. They are companions, not replacements.
**When to use:** After installer runs (guide generated), user then optionally runs `/gsdr:upgrade-project` (config patching).
**Rationale:** upgrade-project handles manifest-based config migration (`apply-migration`), mini-onboarding questions, and version stamp updates. The migration guide documents what changed across versions. These are complementary concerns.

### Anti-Patterns to Avoid
- **Implementing command-level authority preflight:** The cross-runtime-upgrade deliberation (Option A) is OPEN. Do not build it. Only build installer-side hardening.
- **Expanding the field rename exception:** Phase 49 established `rename_field` as the sole migration mutation type. Do not introduce new mutation types.
- **Deleting files that could belong to upstream GSD co-installations:** Always check `isLegacyReflectInstall()` before removing files from the `get-shit-done/` namespace.
- **Adding MIGRATION-GUIDE.md generation to a workflow or hook:** The installer is the correct location because it runs across all 4 runtimes without requiring hook support.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Version comparison | Custom semver parser | Existing dot-split numeric comparison from version-migration.md | Already proven, no edge cases to handle |
| Orphaned file detection | Custom file diffing system | Extend `cleanupOrphanedFiles()` array | The pattern is established and simple |
| Hook validation | Custom schema checker | Adopt upstream `validateHookFields()` from commit `c229259` | 82 lines, 24 tests already written upstream |
| File manifest tracking | Custom file tracking | Existing `generateManifest()` + `writeManifest()` | Already produces SHA256 hashes for all installed files |
| Config migration | Custom config patcher | Existing `manifest apply-migration` command | Manifest-driven, schema-aware, already tested |
| Temp directory test isolation | Custom test setup | Existing `tmpdirTest()` helper from `tests/helpers/tmpdir.js` | Provides isolated tmpdir with auto-cleanup |

**Key insight:** This phase is almost entirely about extending existing patterns, not creating new ones. The installer already has every primitive needed (version detection, file cleanup, hook management, manifest tracking). The work is connecting them for the upgrade path.

## Common Pitfalls

### Pitfall 1: Deleting Upstream GSD Co-Installation Files
**What goes wrong:** Stale file cleanup removes files belonging to a co-installed upstream GSD (e.g., `get-shit-done/bin/gsd-tools.js`), breaking the upstream installation.
**Why it happens:** The cleanup targets paths that exist in both fork and upstream namespaces.
**How to avoid:** All new stale file entries must use the `get-shit-done-reflect/` prefix. The existing `cleanLegacy` check (from `isLegacyReflectInstall()`) protects the `get-shit-done/` namespace. New cleanup entries should be limited to the fork's namespace.
**Warning signs:** Tests should verify that an `upstream-GSD-coinstall` directory survives cleanup.

### Pitfall 2: Migration Guide Generated on Fresh Install
**What goes wrong:** A new user sees a migration guide referencing changes they never experienced, creating confusion.
**Why it happens:** Failing to distinguish fresh installs from upgrades.
**How to avoid:** Check for the VERSION file before generating the guide. If no VERSION file exists at the target before install, this is a fresh install.
**Warning signs:** The fresh-install test (UPD-04) should explicitly assert no MIGRATION-GUIDE.md exists.

### Pitfall 3: C6 Model Resolution Breaking Cross-Runtime Profiles
**What goes wrong:** Adopting upstream's `resolve_model_ids: "omit"` in `~/.gsd/defaults.json` for non-Claude runtimes conflicts with the fork's per-runtime model profile logic (Quick 32) that already handles model resolution via MODEL_PROFILES in `core.cjs`.
**Why it happens:** Upstream's approach writes to a global `~/.gsd/defaults.json` to suppress model aliases. The fork's approach resolves models through `resolveModelInternal()` with profile-based lookup. If both mechanisms are active, they may fight.
**How to avoid:** The installer should set `resolve_model_ids: "omit"` for non-Claude runtimes (matching upstream behavior) because this affects the `init` subcommand's model resolution path in upstream modules. The fork's `resolveModelInternal()` in `core.cjs` operates on a separate code path that reads from config, not from `~/.gsd/defaults.json`. These two paths are complementary, not conflicting. The fork's `core.cjs` already checks `model_overrides` first (line 516), then falls back to profile lookup (line 521-524). Upstream's `resolve_model_ids: "omit"` affects a different resolution path (the `init` subcommand's `resolveModelInternal()` in upstream's init module).
**Warning signs:** Running multi-runtime tests should verify that model resolution returns expected values for all 4 runtimes.

### Pitfall 4: Hook Registration Duplication During Upgrade
**What goes wrong:** Running the installer multiple times duplicates hook entries in settings.json.
**Why it happens:** The `ensureHook()` function (line 2703) checks for existing hooks by substring match, but if the command path changes between versions, the old entry is not found and a duplicate is added.
**How to avoid:** Phase 50's TST-03 idempotency test already verifies this. The `ensureHook()` function's substring match on hook name (e.g., `'gsdr-check-update'`) is resilient because the hook name portion is stable across path changes.
**Warning signs:** TST-03 re-run test should continue to pass after changes.

### Pitfall 5: Stale Hook File Not Matching Stale Hook Registration
**What goes wrong:** A hook file is removed from `cleanupOrphanedFiles()` but its registration in settings.json is not removed from `cleanupOrphanedHooks()`, or vice versa.
**Why it happens:** The two cleanup functions maintain separate arrays that must stay in sync.
**How to avoid:** When adding a new orphaned file/hook, add to both arrays. Review both functions together.
**Warning signs:** After cleanup, no settings.json hook should reference a file that does not exist.

### Pitfall 6: $HOME Path Handling Regression (C5)
**What goes wrong:** Global install pathPrefix uses `~` instead of `$HOME`, causing MODULE_NOT_FOUND errors in double-quoted shell commands.
**Why it happens:** POSIX shell does not expand `~` inside double quotes.
**How to avoid:** The upstream fix (commit `f9cb02e`) changes pathPrefix to use `$HOME` for global installs. Adopt this fix. The fork's `replacePathsInContent()` already handles `$HOME` patterns correctly (verified by 15+ tests in install.test.js).
**Warning signs:** Path replacement tests should verify `$HOME` prefix for global installs.

## Code Examples

### Migration Spec Format (Recommended)
```javascript
// Source: Research recommendation
// File: get-shit-done/migrations/v1.18.0.json
{
  "version": "1.18.0",
  "title": "Modularization & Cross-Runtime Hardening",
  "date": "2026-03-26",
  "sections": [
    {
      "category": "breaking",
      "heading": "Runtime Entry Point Renamed",
      "body": "gsd-tools.js renamed to gsd-tools.cjs. The installer automatically removes the old file.",
      "action": "automatic"
    },
    {
      "category": "feature",
      "heading": "Modular CLI Architecture",
      "body": "The CLI has been split into 16 focused modules in lib/. Command interface unchanged.",
      "action": "none"
    },
    {
      "category": "config",
      "heading": "Manifest Version 2 with Migrations Array",
      "body": "manifest_version bumped from 1 to 2. Run /gsdr:upgrade-project to migrate project config.",
      "action": "run-upgrade-project"
    },
    {
      "category": "config",
      "heading": "Hook Field Validation",
      "body": "Invalid hook entries are now stripped to prevent Claude Code from silently discarding settings.json.",
      "action": "automatic"
    }
  ]
}
```

### Migration Guide Generation Function
```javascript
// Source: Research recommendation based on existing installer patterns
function generateMigrationGuide(targetDir, previousVersion, currentVersion) {
  const migrationsDir = path.join(__dirname, '..', 'get-shit-done', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const specs = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(migrationsDir, f), 'utf8')); }
      catch { return null; }
    })
    .filter(s => s && isVersionInRange(s.version, previousVersion, currentVersion))
    .sort((a, b) => compareVersions(a.version, b.version));

  if (specs.length === 0) return;

  let guide = `# Migration Guide: ${previousVersion} -> ${currentVersion}\n\n`;
  guide += `**Generated:** ${new Date().toISOString()}\n`;
  guide += `**Previous version:** ${previousVersion}\n`;
  guide += `**Current version:** ${currentVersion}\n\n`;

  for (const spec of specs) {
    guide += `## Version ${spec.version}: ${spec.title}\n\n`;
    for (const section of spec.sections) {
      const badge = section.category === 'breaking' ? '**BREAKING:** '
                  : section.category === 'config' ? '**Config:** '
                  : '';
      guide += `### ${badge}${section.heading}\n\n`;
      guide += `${section.body}\n\n`;
      if (section.action === 'run-upgrade-project') {
        guide += `> **Action required:** Run \`/gsdr:upgrade-project\` to apply this change.\n\n`;
      } else if (section.action === 'automatic') {
        guide += `> This change is applied automatically by the installer.\n\n`;
      }
    }
  }

  guide += `---\n*Generated by GSD Reflect installer. Run \`/gsdr:upgrade-project\` for interactive config migration.*\n`;

  const guidePath = path.join(targetDir, 'MIGRATION-GUIDE.md');
  fs.writeFileSync(guidePath, guide);
  console.log(`  ${green}+${reset} Generated MIGRATION-GUIDE.md (${previousVersion} -> ${currentVersion})`);
}
```

### Upgrade Test Fixture (v1.17 -> v1.18)
```javascript
// Source: Research recommendation extending Phase 50's collectFileInventory pattern
tmpdirTest('UPD-05: v1.17 to v1.18 upgrade preserves .planning artifacts', async ({ tmpdir }) => {
  const installScript = path.resolve(process.cwd(), 'bin/install.js');
  const execOpts = {
    env: { ...process.env, HOME: tmpdir },
    cwd: tmpdir,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000
  };

  // Step 1: Simulate a v1.17 installation state
  // Create the config directory with v1.17 artifacts
  const claudeDir = path.join(tmpdir, '.claude');
  const gsdReflectDir = path.join(claudeDir, 'get-shit-done-reflect');
  fsSync.mkdirSync(path.join(gsdReflectDir, 'bin'), { recursive: true });

  // Write a v1.17 VERSION file
  fsSync.writeFileSync(path.join(gsdReflectDir, 'VERSION'), '1.17.5');

  // Write the pre-modularization gsd-tools.js (stale file)
  fsSync.writeFileSync(path.join(gsdReflectDir, 'bin', 'gsd-tools.js'), '// stale v1.17 monolith');

  // Create .planning/ artifacts that must survive upgrade
  const planningDir = path.join(tmpdir, '.planning');
  fsSync.mkdirSync(path.join(planningDir, 'phases', '01-init'), { recursive: true });
  fsSync.writeFileSync(path.join(planningDir, 'STATE.md'), '# State\nPhase: 1');
  fsSync.writeFileSync(path.join(planningDir, 'config.json'), JSON.stringify({
    mode: 'yolo', gsd_reflect_version: '1.17.5', manifest_version: 1
  }));

  // Step 2: Run v1.18 installer (upgrade path)
  execSync(`node "${installScript}" --claude --global`, execOpts);

  // Step 3: Verify upgrade outcomes
  // Stale gsd-tools.js removed
  expect(fsSync.existsSync(path.join(gsdReflectDir, 'bin', 'gsd-tools.js'))).toBe(false);

  // New gsd-tools.cjs present
  expect(fsSync.existsSync(path.join(gsdReflectDir, 'bin', 'gsd-tools.cjs'))).toBe(true);

  // VERSION updated
  const newVersion = fsSync.readFileSync(path.join(gsdReflectDir, 'VERSION'), 'utf8').trim();
  expect(newVersion).toContain('1.17'); // Current package version

  // .planning/ artifacts preserved
  expect(fsSync.existsSync(path.join(planningDir, 'STATE.md'))).toBe(true);
  expect(fsSync.readFileSync(path.join(planningDir, 'STATE.md'), 'utf8')).toContain('Phase: 1');
  expect(fsSync.existsSync(path.join(planningDir, 'config.json'))).toBe(true);

  // MIGRATION-GUIDE.md generated (upgrade, not fresh)
  expect(fsSync.existsSync(path.join(claudeDir, 'MIGRATION-GUIDE.md'))).toBe(true);
});
```

### C1: Codex Absolute Agent Paths
```javascript
// Source: Upstream commit 9f8d11d
// generateCodexConfigBlock now accepts targetDir for absolute paths
// Codex >= 0.116 requires AbsolutePathBuf for config_file
function generateCodexConfigBlock(agents, targetDir) {
  const agentsPrefix = targetDir
    ? path.join(targetDir, 'agents').replace(/\\/g, '/')
    : 'agents';
  // ...
  lines.push(`config_file = "${agentsPrefix}/${name}.toml"`);
}
```

### C7: Hook Field Validation
```javascript
// Source: Upstream commit c229259
function validateHookFields(settings) {
  if (!settings.hooks || typeof settings.hooks !== 'object') return settings;
  // Two-pass approach:
  // Pass 1: validate entries, build new arrays (no mutation inside filter)
  // Pass 2: collect-and-delete empty event keys (no delete during iteration)
  // Agent hooks must have "prompt", command hooks must have "command"
  // Entries without valid hooks array are structurally invalid
  // Returns same settings object (mutated in place)
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic `gsd-tools.js` | Modular `gsd-tools.cjs` + 16 `lib/*.cjs` modules | Phase 45-47 (v1.18) | Stale `gsd-tools.js` must be cleaned up on upgrade |
| `manifest_version: 1` | `manifest_version: 2` with `migrations[]` array | Phase 49 (v1.18) | Migration specs can reference manifest version for compatibility |
| `~` prefix for global pathPrefix | `$HOME` prefix for global pathPrefix | Upstream `f9cb02e` | Fixes MODULE_NOT_FOUND in double-quoted shell commands |
| No hook field validation | `validateHookFields()` before `writeSettings()` | Upstream `c229259` | Prevents silent settings.json discard by Claude Code's Zod schema |
| Relative Codex agent paths | Absolute Codex agent paths when targetDir provided | Upstream `9f8d11d` | Required for Codex >= 0.116 AbsolutePathBuf |
| No migration guide | Installer-generated MIGRATION-GUIDE.md | Phase 51 (new) | Users get actionable per-version upgrade documentation |

**Deprecated/outdated:**
- `gsd-tools.js`: Replaced by `gsd-tools.cjs` in Phase 45. Must be cleaned up during upgrade.
- `~` pathPrefix: Replaced by `$HOME` in upstream `f9cb02e`. Must be adopted.
- Unvalidated hook fields: Replaced by `validateHookFields()` in upstream `c229259`. Must be adopted.

## Open Questions

### Resolved

- **Q1: Per-version migration spec format and storage:** Use JSON files in `get-shit-done/migrations/` directory, keyed by version (e.g., `v1.18.0.json`). JSON matches the project's existing data format conventions (feature-manifest.json, config.json), is machine-readable for the installer, human-readable for authors, and git-friendly (each version is a separate file, easy to review diffs). This is Claude's discretion per CONTEXT.md.

- **Q2: Whether upgrade-project consumes the migration guide or is replaced by it:** They are companions. The migration guide is documentation output (what changed, what to do). The upgrade-project workflow is the action mechanism (manifest-based config migration, mini-onboarding, version stamp update). The migration guide can reference upgrade-project as an action item for config changes.

- **Q3: How migration guide auto-surfaces after installer runs:** The installer prints a stdout message pointing to MIGRATION-GUIDE.md (e.g., `"See MIGRATION-GUIDE.md for upgrade details"`). This works across all 4 runtimes since every runtime invokes the installer via stdout. Hook-based surfacing is Claude-only and would violate DC-2. The health-check can also detect the guide and mention it.

- **Q4: Compound vs sequential vs hybrid:** Sequential (per-version) layout. It matches the additive migration principle (each version's changes build on the previous), is simpler to generate (iterate specs in version order), and is the natural reading order for a user upgrading through multiple versions ("what changed in v1.16? what changed in v1.17? what changed in v1.18?").

- **Q5: What stale artifacts beyond gsd-tools.js need cleanup:** Based on file tree analysis, the primary stale artifact is `get-shit-done-reflect/bin/gsd-tools.js`. The `lib/*.cjs` modules are new files that did not exist in v1.17, so there are no stale lib files to remove. The 7 old hook files (gsd-notify.sh, statusline.js, etc.) are already in the existing cleanupOrphanedFiles list. No additional stale files identified beyond gsd-tools.js.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Q6: C6 model resolution reconciliation | Medium | Adopt upstream's `resolve_model_ids: "omit"` in installer for non-Claude runtimes; the fork's core.cjs MODEL_PROFILES operates on a separate code path (config-based, not defaults.json-based). Verify with multi-runtime test. Accept-risk with test coverage. |
| Migration spec for versions before v1.18 | Low | Back-fill migration specs for v1.15, v1.16, v1.17 if practical, but these are informational-only since the current user base has already been through those upgrades on this fork. Defer to implementation discretion. |

### Still Open
- The cross-runtime-upgrade deliberation is OPEN. Phase 51 should note where its work naturally feeds into a future command-level authority layer but must not implement one.

## Sources

### Primary (HIGH confidence)
- `bin/install.js` (3027 lines) -- Direct code analysis of cleanupOrphanedFiles (L1551), cleanupOrphanedHooks (L1574), isLegacyReflectInstall (L2139), VERSION detection (L2372-2386, L2588-2594), ensureHook (L2703-2722), saveLocalPatches (L2214), hook installation (L2597-2631)
- `get-shit-done/feature-manifest.json` -- manifest_version 2, migrations array, feature schemas
- `get-shit-done/references/version-migration.md` -- Migration principles, additive-only rule, controlled exception for field renames
- `tests/unit/install.test.js` (212 test cases) -- Existing test patterns: tmpdirTest, collectFileInventory, idempotency tests
- `tests/helpers/tmpdir.js` -- Test isolation helper

### Secondary (MEDIUM confidence)
- Upstream commit `9f8d11d` (C1) -- Config preservation + Codex absolute agent paths, 27-line diff in install.js + 72-line test addition
- Upstream commit `f9cb02e` (C5) -- $HOME path handling fix, 12-line diff in install.js + 108-line test update
- Upstream commit `02254db` (C6) -- resolve_model_ids "omit" for non-Claude runtimes, 27-line addition in install.js
- Upstream commit `c229259` (C7) -- validateHookFields(), 82-line addition in install.js + 375-line test file
- `.planning/phases/48.1-*/UPSTREAM-DRIFT-LEDGER.md` -- Cluster routing and rationale

### Tertiary (LOW confidence)
- None. All findings are grounded in direct code analysis and upstream commit inspection.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- No new dependencies, all existing Node.js built-ins
- Architecture: HIGH -- All patterns extend existing installer infrastructure with clear grounding in code line numbers
- Pitfalls: HIGH -- Derived from actual fork maintenance history (co-install protection, idempotency, path handling)
- Upstream drift: HIGH -- All four commits inspected directly via git show with full diff analysis
- Migration spec format: MEDIUM -- Recommended format is a design choice within Claude's discretion; JSON is the natural fit but alternatives are viable

**Research date:** 2026-03-26
**Valid until:** 2026-04-26 (30 days -- stable domain, no fast-moving external dependencies)

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`), no relevant lessons or spike decisions found for this phase's specific domain (installer upgrade hardening, migration guide generation). The one existing spike (`spk-2026-03-01-claude-code-session-log-location`) concerns logging sensor paths, not installer upgrade behavior. Relevant signals were identified but signals are unprocessed noise per knowledge-surfacing protocol; only lessons and spike decisions are surfaced.
