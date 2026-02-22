# Phase 24: Manifest-Driven Config Migration - Research

**Researched:** 2026-02-22
**Domain:** Workflow integration -- consuming Phase 23 manifest tooling across 3 entry points (upgrade-project, new-project, update) to replace hardcoded config initialization
**Confidence:** HIGH

## Summary

Phase 24 replaces hardcoded config initialization logic scattered across three workflow files (upgrade-project.md, new-project.md, update.md) with manifest-driven logic that reads `feature-manifest.json` as the single source of truth for what config each feature needs. Phase 23 already built the manifest file and the read-only tooling (`manifest diff-config`, `manifest validate`, `manifest get-prompts`). Phase 24 adds the **write-side** tooling (apply missing config, coerce types, log changes atomically) and modifies the three workflow instruction files to consume it.

The core challenge is integration complexity: three markdown-based workflow files that Claude follows as instructions must be modified to call manifest tooling instead of using hardcoded config templates and migration actions. Additionally, two new gsd-tools.js commands are needed for the mechanical write operations (applying defaults and logging migrations). The type coercion requirement (MIGR-04) extends the existing `cmdConfigSet` pattern. The atomicity requirement (MIGR-06) requires introducing a write-tmp-then-rename pattern that does not currently exist in the codebase.

**Primary recommendation:** Add two new gsd-tools.js commands (`manifest apply-migration` for atomic config writes and `manifest log-migration` for audit logging). Modify the three workflow .md files to replace hardcoded config logic with manifest command calls. Extract the duplicated `knownTopLevel` set into a module-level constant. Introduce an `atomicWriteJson` helper for all config write operations.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs` + `path` | Built-in | JSON file I/O, atomic write via rename | Already used everywhere in gsd-tools.js |
| `JSON.parse` / `JSON.stringify` | Built-in | Config parsing and serialization | Zero-dependency, already the config format |
| `fs.renameSync` | Built-in | Atomic file replacement (POSIX guarantee) | Ensures MIGR-06 interrupted-migration safety |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` + `node:assert` | Built-in | Unit tests for new commands | Test apply-migration and log-migration |
| `os.tmpdir()` or same-directory `.tmp` | Built-in | Temporary file for atomic writes | Part of atomicWriteJson helper |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| write-tmp-rename for atomicity | `fs.writeFileSync` directly (current pattern) | Direct write is NOT atomic -- process kill mid-write produces truncated file. rename is atomic on POSIX and near-atomic on Windows NTFS |
| Single `manifest apply-migration` command | Separate `apply-defaults`, `coerce-field`, `init-feature` commands | Multiple fine-grained commands increase API surface. A single command that handles the full migration flow is simpler for workflow authors |
| Hardcoded `knownTopLevel` constant | `core_fields` section in manifest | Manifest change is cleaner long-term but adds schema complexity. A module-level constant is the practical fix for Phase 24 |

**Installation:** No new packages needed. Zero dependencies.

## Architecture Patterns

### Recommended File Changes

```
get-shit-done/
  bin/gsd-tools.js                 # MODIFY: add manifest apply-migration, log-migration commands
                                   #          add atomicWriteJson helper
                                   #          extract KNOWN_TOP_LEVEL_KEYS constant
  bin/gsd-tools.test.js            # MODIFY: add tests for new commands
  feature-manifest.json            # MODIFY: add auto_detect rules for devops features
  workflows/
    upgrade-project.md             # MODIFY: replace hardcoded Step 5 with manifest commands
    new-project.md                 # MODIFY: replace hardcoded feature config with manifest-driven
    update.md                      # MODIFY: add post-install manifest diff step
  references/
    version-migration.md           # MODIFY: simplify -- remove hardcoded migration actions
```

### Pattern 1: Manifest Apply-Migration Command

**What:** A new gsd-tools.js command that reads the manifest, diffs against config, applies missing features/fields with defaults, coerces types, and writes atomically.
**When to use:** Called by upgrade-project (after user choices) and by auto/YOLO mode in any workflow.

```javascript
function cmdManifestApplyMigration(cwd, raw) {
  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found. Is GSD installed?'); }
  const configPath = path.join(cwd, '.planning', 'config.json');
  const config = loadProjectConfig(cwd);
  if (!config) { error('No .planning/config.json found.'); }

  const changes = [];

  for (const [featureName, featureDef] of Object.entries(manifest.features)) {
    if (featureDef.scope !== 'project' || !featureDef.config_key) continue;
    const key = featureDef.config_key;

    // Add missing feature sections with all defaults
    if (!config[key]) {
      config[key] = {};
      for (const [field, schema] of Object.entries(featureDef.schema)) {
        config[key][field] = schema.default;
      }
      changes.push({
        type: 'feature_added',
        feature: featureName,
        config_key: key,
        fields: Object.keys(featureDef.schema),
      });
      continue;
    }

    // Add missing fields to existing sections
    for (const [field, schema] of Object.entries(featureDef.schema)) {
      if (config[key][field] === undefined) {
        config[key][field] = schema.default;
        changes.push({
          type: 'field_added',
          feature: featureName,
          field,
          value: schema.default,
        });
      } else {
        // Type coercion
        const coerced = coerceValue(config[key][field], schema);
        if (coerced !== config[key][field]) {
          const oldValue = config[key][field];
          config[key][field] = coerced;
          changes.push({
            type: 'type_coerced',
            feature: featureName,
            field,
            from: oldValue,
            to: coerced,
          });
        }
      }
    }
  }

  // Update manifest_version
  if (config.manifest_version !== manifest.manifest_version) {
    const oldVer = config.manifest_version || null;
    config.manifest_version = manifest.manifest_version;
    changes.push({
      type: 'manifest_version_updated',
      from: oldVer,
      to: manifest.manifest_version,
    });
  }

  // Atomic write
  if (changes.length > 0) {
    atomicWriteJson(configPath, config);
  }

  output({ changes, total_changes: changes.length }, raw);
}
```

### Pattern 2: Type Coercion Helper

**What:** Coerce config values to match manifest schema types. Lenient -- best effort, never destructive.
**When to use:** During apply-migration for MIGR-04.

```javascript
function coerceValue(value, schema) {
  const target = schema.type;

  if (target === 'boolean') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (typeof value === 'number') return value !== 0;
  }

  if (target === 'number') {
    if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
      return Number(value);
    }
  }

  if (target === 'string') {
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return String(value);
  }

  if (target === 'array') {
    if (!Array.isArray(value) && value !== null && value !== undefined) {
      return [value]; // Wrap single value in array
    }
  }

  // Cannot coerce or already correct type -- return unchanged
  return value;
}
```

**Key principle:** Coercion is best-effort. If a value cannot be safely coerced, it is left unchanged. The validation step (already in Phase 23) will report it as a type mismatch warning.

### Pattern 3: Atomic JSON Write Helper

**What:** Write JSON to a temp file, then rename to target. Guarantees MIGR-06 (interrupted migration leaves config valid).
**When to use:** Every config.json write in migration commands.

```javascript
function atomicWriteJson(filePath, data) {
  const tmpPath = filePath + '.tmp';
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}
```

**Why this works:** `fs.renameSync` is atomic on POSIX systems (Darwin, Linux). On the same filesystem, rename is a metadata-only operation -- the file either has the old content or the new content, never a partial state. Since `.planning/config.json` and `.planning/config.json.tmp` are on the same filesystem, this is guaranteed atomic.

**Edge case:** If the process crashes AFTER `writeFileSync` but BEFORE `renameSync`, the `.tmp` file remains. The next migration attempt will overwrite it. The original `config.json` is untouched.

### Pattern 4: Migration Logging Command

**What:** Append a structured entry to `.planning/migration-log.md`.
**When to use:** After any automated config change (upgrade-project, new-project, update).

```javascript
function cmdManifestLogMigration(cwd, raw) {
  // Parse --from, --to, --changes from args
  const logPath = path.join(cwd, '.planning', 'migration-log.md');

  const header = `# Migration Log\n\nTracks version upgrades applied to this project.\n`;
  const timestamp = new Date().toISOString();
  const fromVersion = /* from args */;
  const toVersion = /* from args */;
  const changesJson = /* from args or stdin */;

  const entry = formatMigrationEntry(fromVersion, toVersion, timestamp, changesJson);

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, header + '\n' + entry + '\n---\n\n*Log is append-only.*\n', 'utf-8');
  } else {
    const existing = fs.readFileSync(logPath, 'utf-8');
    // Insert after header (first blank line after "# Migration Log" block)
    const headerEnd = existing.indexOf('\n\n', existing.indexOf('# Migration Log'));
    const before = existing.substring(0, headerEnd + 2);
    const after = existing.substring(headerEnd + 2);
    fs.writeFileSync(logPath, before + entry + '\n---\n\n' + after, 'utf-8');
  }

  output({ logged: true, path: '.planning/migration-log.md' }, raw);
}
```

### Pattern 5: Workflow Modification -- upgrade-project.md Step 5

**What:** Replace hardcoded config patches in upgrade-project.md with manifest-driven logic.
**Current (hardcoded):** Step 5 says "For each migration action defined in version-migration.md: add health_check section if absent, add devops section if absent."
**New (manifest-driven):**

```markdown
## 5. Apply Additive Config Patches

Run manifest diff to detect config gaps:
\`\`\`bash
DIFF=$(node ~/.claude/get-shit-done/bin/gsd-tools.js manifest diff-config --raw)
\`\`\`

Parse the JSON result. Extract `missing_features` and `missing_fields`.

**If no gaps:** Report "Config is up to date" and skip to Step 6.

**In YOLO/auto mode:** Apply all defaults:
\`\`\`bash
node ~/.claude/get-shit-done/bin/gsd-tools.js manifest apply-migration --raw
\`\`\`

**In interactive mode:** For each missing feature:
1. Get prompts: `node ~/.claude/get-shit-done/bin/gsd-tools.js manifest get-prompts <feature> --raw`
2. Present each prompt's question and options via AskUserQuestion
3. Write user choices: `node ~/.claude/get-shit-done/bin/gsd-tools.js config-set <feature>.<field> <value>`
4. After all user choices, fill remaining defaults: `node ~/.claude/get-shit-done/bin/gsd-tools.js manifest apply-migration --raw`

Update version stamps LAST:
\`\`\`bash
node ~/.claude/get-shit-done/bin/gsd-tools.js config-set gsd_reflect_version "<installed_version>"
\`\`\`
```

### Pattern 6: Workflow Modification -- new-project.md Step 5

**What:** Replace hardcoded feature config template with manifest-driven feature gathering.
**Current (hardcoded):** Step 5 creates config.json with hardcoded health_check and devops sections. Step 5.7 has hardcoded DevOps auto-detection bash scripts.
**New (manifest-driven):**

Core workflow preferences (mode, depth, parallelization, commit_docs, model_profile, workflow agents) remain as hardcoded questions -- these are NOT manifest features.

After core preferences:

```markdown
## 5.5. Feature Configuration (Manifest-Driven)

For each feature in the manifest (from `manifest diff-config --raw` output, which will show all features as missing since config is new):

1. Check for auto_detect rules: run the detection and use detected values as defaults
2. Get prompts: `manifest get-prompts <feature> --raw`
3. **Interactive mode:** Present init_prompts to user via AskUserQuestion
4. **Auto mode:** Use defaults (or auto-detected values)

After all features processed:
\`\`\`bash
node ~/.claude/get-shit-done/bin/gsd-tools.js manifest apply-migration --raw
\`\`\`
```

### Pattern 7: Workflow Modification -- update.md Post-Install Step

**What:** Add a post-install step to update.md that detects config gaps and offers upgrade.
**Current:** After install, shows restart reminder. No config gap detection.
**New step inserted between "run_update" and "display_result":**

```markdown
<step name="check_config_gaps">
After installation completes, check if the project has config gaps:

\`\`\`bash
node ~/.claude/get-shit-done/bin/gsd-tools.js manifest diff-config --raw 2>/dev/null
\`\`\`

**If command fails** (no config.json or no manifest): Skip this step.

**If missing_features or missing_fields found:**
- Count new features: `N new feature(s) available`
- Read mode from config.json

**If YOLO mode:** Auto-run upgrade:
\`\`\`bash
node ~/.claude/get-shit-done/bin/gsd-tools.js manifest apply-migration --raw
\`\`\`

**If interactive mode:** Display offer:
```
New features available after update:
- [feature_name]: [feature description from manifest]

Run `/gsd:upgrade-project` to configure these features.
```
</step>
```

### Anti-Patterns to Avoid

- **Maintaining hardcoded config templates alongside manifest:** The new-project.md workflow currently has a JSON template at Step 5 (lines 320-345) listing health_check, devops values. Phase 24 must REMOVE this template and replace it with manifest-driven logic. Maintaining both is the "dual source of truth" pitfall from Phase 23 research.

- **Adding auto-detect logic to workflows instead of the manifest:** The devops auto-detection bash scripts in new-project.md Step 5.7 should be migrated into the manifest's `auto_detect` field structure. Adding more per-workflow detection scripts creates maintenance burden across 3 entry points.

- **Making migration logging optional:** MIGR-05 requires every automated change to be logged. The `manifest apply-migration` command should call logging internally (or the workflow must call `manifest log-migration` after every apply). Skipping logging for "minor" changes leads to silent config drift.

- **Type coercion that changes semantics:** Coercing `"true"` to `true` is safe. But coercing `0` to `false` can change semantics (e.g., `stale_threshold_days: 0` means "immediately stale", not "disabled"). Numeric-to-boolean coercion should NOT be done for number-typed fields.

- **Updating gsd_reflect_version before all changes succeed:** The existing safety mechanism (version stamp updated LAST) must be preserved. If `manifest apply-migration` partially fails, the version stamp should NOT be updated, ensuring retry on next run.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config gap detection | Custom diff logic in workflows | `manifest diff-config` (Phase 23) | Already built, tested, handles edge cases |
| Feature schema + prompts | Hardcoded questions in workflows | `manifest get-prompts` (Phase 23) | Single source of truth |
| JSON file I/O | Custom parser | `JSON.parse` / `JSON.stringify` | Native, reliable, already used everywhere |
| Atomic file write | Direct `writeFileSync` | write-tmp-then-rename helper | Direct write is NOT atomic; rename is |
| Type coercion | Per-field if/else in workflows | Centralized `coerceValue()` function | Consistent behavior across all features |

**Key insight:** Phase 23 built the read-side tooling. Phase 24 builds the write-side tooling and wires the workflows. Most of the "intelligence" (knowing what's missing, what types are expected, what prompts to show) already exists in the manifest and Phase 23 commands. Phase 24 is primarily integration work.

## Common Pitfalls

### Pitfall 1: Dual Source of Truth Between Manifest and Workflow Templates

**What goes wrong:** The hardcoded config.json template in new-project.md Step 5 (lines 320-345) lists specific health_check and devops values. If Phase 24 adds manifest-driven feature config but does not REMOVE this hardcoded template, there are two sources of truth. Adding a new feature requires updating both the manifest AND the workflow template.
**Why it happens:** It is tempting to keep the existing template "for reference" while adding manifest-driven logic alongside it. But Claude follows instructions literally -- if the template is present, Claude may use it instead of the manifest.
**How to avoid:** The hardcoded feature config section in new-project.md must be REPLACED (not augmented). The config.json template should only contain core fields (mode, depth, parallelization, commit_docs, model_profile, workflow). Feature sections (health_check, devops, release) come exclusively from the manifest.
**Warning signs:** The new-project.md workflow still contains literal JSON with `health_check` or `devops` keys.

### Pitfall 2: DevOps Auto-Detection Divergence

**What goes wrong:** new-project.md Step 5.7 has 20+ lines of bash auto-detection for CI/CD providers and deploy targets. The manifest has `auto_detect` only for `release.version_file`. If Phase 24 keeps the bash detection for devops but uses manifest auto_detect for release, there are two auto-detection mechanisms with different formats and capabilities.
**Why it happens:** Migrating existing bash detection into the manifest `auto_detect` format requires redesigning how the workflow interprets auto_detect rules. It is easier to leave the existing detection alone.
**How to avoid:** Extend the manifest `auto_detect` to cover devops features (CI provider, deploy target, commit convention). Implement a generic `manifest auto-detect <feature>` command in gsd-tools.js that runs the detection rules for any feature. Remove the hardcoded bash detection from new-project.md Step 5.7.
**Warning signs:** Bash `[ -d ".github/workflows" ]` checks still present in new-project.md after Phase 24 completion.

### Pitfall 3: knownTopLevel Triple-Maintenance

**What goes wrong:** The `knownTopLevel` set appears in TWO places in gsd-tools.js (lines 4282 and 4397). Phase 24 may need to add new keys (e.g., if core_fields grow). Updating one but not the other causes inconsistent validation.
**Why it happens:** The set was duplicated in Phase 23 because `cmdManifestDiffConfig` and `cmdManifestValidate` are independent functions. Copy-paste was faster than extracting a shared constant.
**How to avoid:** Extract into a module-level constant: `const KNOWN_TOP_LEVEL_KEYS = new Set([...])`. Reference from both functions. If adding a `core_fields` manifest section later, the constant can read from the manifest.
**Warning signs:** A new top-level config field (e.g., `notifications`) is recognized by one command but flagged as unknown by the other.

### Pitfall 4: migration-log.md Entry Format Inconsistency

**What goes wrong:** upgrade-project.md already logs to migration-log.md (Step 6) using the format from version-migration.md. If Phase 24 adds logging for new-project and update workflows with a slightly different format or field set, the log becomes inconsistent.
**Why it happens:** Three different workflows calling different logging code paths. Each developer writes the log entry slightly differently.
**How to avoid:** Implement logging as a single gsd-tools.js command (`manifest log-migration`) that formats the entry consistently. All three workflows call the same command with the same interface. The format is defined once in the command, not in each workflow.
**Warning signs:** migration-log.md entries from upgrade-project look different from entries from new-project.

### Pitfall 5: Interrupted Migration During Interactive Prompts

**What goes wrong:** In interactive mode, the user is asked questions one at a time. Each answer writes to config.json via `config-set`. If the user answers 2 of 5 questions and loses context (closes terminal, context limit), config.json has partial feature config -- some fields set by user, others missing.
**Why it happens:** Interactive mode writes each answer immediately (good for persistence) but does not fill remaining defaults (bad for completeness).
**How to avoid:** After interactive prompts, ALWAYS run `manifest apply-migration` to fill any remaining gaps with defaults. This is the cleanup step that ensures completeness. The version stamp update after apply-migration signals "migration complete." If context is lost before apply-migration, the next run of upgrade-project will re-detect the gaps and fill them.
**Warning signs:** Config has `devops: { ci_provider: "github-actions" }` but missing `deploy_target`, `commit_convention`, `environments`.

### Pitfall 6: fs.renameSync Cross-Device Failure

**What goes wrong:** `fs.renameSync` fails if source and destination are on different filesystems (devices). The `.tmp` file must be on the same filesystem as the target.
**Why it happens:** If `.planning/` is on a different mount than where Node.js creates temp files, `os.tmpdir()` returns a path on a different device.
**How to avoid:** Always write the `.tmp` file in the SAME directory as the target file (e.g., `config.json.tmp` alongside `config.json`). Never use `os.tmpdir()` for the temp file.
**Warning signs:** `EXDEV: cross-device link not permitted` error during migration.

## Code Examples

### Complete apply-migration Command Flow

```javascript
// In gsd-tools.js -- new command
function cmdManifestApplyMigration(cwd, raw) {
  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found. Is GSD installed?'); }

  const configPath = path.join(cwd, '.planning', 'config.json');
  const config = loadProjectConfig(cwd);
  if (!config) { error('No .planning/config.json found.'); }

  const changes = [];

  for (const [featureName, featureDef] of Object.entries(manifest.features)) {
    if (featureDef.scope !== 'project' || !featureDef.config_key) continue;
    const key = featureDef.config_key;

    if (!config[key]) {
      // Add entire missing feature section with defaults
      config[key] = {};
      for (const [field, schema] of Object.entries(featureDef.schema)) {
        config[key][field] = schema.default;
      }
      changes.push({
        type: 'feature_added',
        feature: featureName,
        config_key: key,
        fields_added: Object.keys(featureDef.schema),
      });
    } else {
      // Add missing fields and coerce types in existing section
      for (const [field, schema] of Object.entries(featureDef.schema)) {
        if (config[key][field] === undefined) {
          config[key][field] = schema.default;
          changes.push({
            type: 'field_added',
            feature: featureName,
            field,
            default_value: schema.default,
          });
        } else {
          const coerced = coerceValue(config[key][field], schema);
          if (coerced !== config[key][field]) {
            changes.push({
              type: 'type_coerced',
              feature: featureName,
              field,
              from: config[key][field],
              to: coerced,
            });
            config[key][field] = coerced;
          }
        }
      }
    }
  }

  // Update manifest_version
  if (config.manifest_version !== manifest.manifest_version) {
    changes.push({
      type: 'manifest_version_updated',
      from: config.manifest_version || null,
      to: manifest.manifest_version,
    });
    config.manifest_version = manifest.manifest_version;
  }

  if (changes.length > 0) {
    atomicWriteJson(configPath, config);
  }

  output({ changes, total_changes: changes.length }, raw);
}
```

### Type Coercion Function

```javascript
function coerceValue(value, schema) {
  const target = schema.type;

  // Boolean coercion
  if (target === 'boolean') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    // Do NOT coerce numbers to booleans (0 !== false for numeric fields)
  }

  // Number coercion
  if (target === 'number') {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '' && !isNaN(trimmed)) return Number(trimmed);
    }
  }

  // String coercion
  if (target === 'string') {
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return String(value);
  }

  // Array coercion -- wrap single value
  if (target === 'array') {
    if (!Array.isArray(value) && value !== null && value !== undefined) {
      return [value];
    }
  }

  return value; // No coercion possible or needed
}
```

### Atomic Write Helper

```javascript
function atomicWriteJson(filePath, data) {
  const tmpPath = filePath + '.tmp';
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, filePath);
}
```

### knownTopLevel Extraction

```javascript
// Module-level constant (replaces duplicated sets at lines 4282 and 4397)
const KNOWN_TOP_LEVEL_KEYS = new Set([
  'mode', 'depth', 'model_profile', 'commit_docs', 'search_gitignored',
  'branching_strategy', 'phase_branch_template', 'milestone_branch_template',
  'workflow', 'planning', 'parallelization', 'gates', 'safety',
  'gsd_reflect_version', 'manifest_version', 'brave_search',
]);
```

### Migration Log Entry Format

```javascript
function formatMigrationEntry(fromVersion, toVersion, timestamp, changes) {
  let entry = `## ${fromVersion} -> ${toVersion} (${timestamp})\n\n`;
  entry += `### Changes Applied\n`;
  for (const change of changes) {
    if (change.type === 'feature_added') {
      entry += `- Added \`${change.config_key}\` section to config.json`;
      if (change.fields_added) {
        entry += ` (${change.fields_added.join(', ')})`;
      }
      entry += '\n';
    } else if (change.type === 'field_added') {
      entry += `- Added \`${change.feature}.${change.field}\`: ${JSON.stringify(change.default_value)}\n`;
    } else if (change.type === 'type_coerced') {
      entry += `- Coerced \`${change.feature}.${change.field}\` from ${JSON.stringify(change.from)} to ${JSON.stringify(change.to)}\n`;
    } else if (change.type === 'manifest_version_updated') {
      entry += `- Updated manifest_version: ${change.from} -> ${change.to}\n`;
    }
  }
  return entry;
}
```

### DevOps Auto-Detect Extension for Manifest

```json
{
  "devops": {
    "auto_detect": {
      "ci_provider": [
        { "check": "dir_exists", "path": ".github/workflows", "value": "github-actions" },
        { "check": "file_exists", "path": ".gitlab-ci.yml", "value": "gitlab-ci" },
        { "check": "file_exists", "path": ".circleci/config.yml", "value": "circleci" },
        { "check": "file_exists", "path": "Jenkinsfile", "value": "jenkins" },
        { "check": "file_exists", "path": "bitbucket-pipelines.yml", "value": "bitbucket-pipelines" }
      ],
      "deploy_target": [
        { "check": "file_exists", "path": "vercel.json", "value": "vercel" },
        { "check": "dir_exists", "path": ".vercel", "value": "vercel" },
        { "check": "file_exists", "path": "Dockerfile", "value": "docker" },
        { "check": "file_exists", "path": "fly.toml", "value": "fly-io" },
        { "check": "file_exists", "path": "netlify.toml", "value": "netlify" }
      ],
      "commit_convention": [
        { "check": "git_log_pattern", "pattern": "^(feat|fix|chore|docs|style|refactor|test|ci|build|perf)\\(", "threshold": 0.5, "value": "conventional" }
      ]
    }
  }
}
```

### Auto-Detect Runner (gsd-tools.js)

```javascript
function cmdManifestAutoDetect(cwd, feature, raw) {
  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found.'); }
  const featureDef = manifest.features[feature];
  if (!featureDef) { error(`Unknown feature: ${feature}`); }
  if (!featureDef.auto_detect) {
    output({ feature, detected: {} }, raw);
    return;
  }

  const detected = {};
  for (const [field, rules] of Object.entries(featureDef.auto_detect)) {
    for (const rule of rules) {
      if (rule.check === 'file_exists' && fs.existsSync(path.join(cwd, rule.path))) {
        detected[field] = rule.value;
        break;
      }
      if (rule.check === 'dir_exists' && fs.existsSync(path.join(cwd, rule.path)) &&
          fs.statSync(path.join(cwd, rule.path)).isDirectory()) {
        detected[field] = rule.value;
        break;
      }
      if (rule.check === 'git_log_pattern') {
        try {
          const logs = execSync('git log --oneline -20 2>/dev/null', { cwd, encoding: 'utf-8' }).trim();
          const lines = logs.split('\n').filter(l => l.length > 0);
          if (lines.length > 0) {
            const regex = new RegExp(rule.pattern);
            const matches = lines.filter(l => regex.test(l.replace(/^[a-f0-9]+ /, '')));
            if (matches.length / lines.length >= (rule.threshold || 0.5)) {
              detected[field] = rule.value;
            }
          }
        } catch {}
        break;
      }
    }
  }

  output({ feature, detected }, raw);
}
```

## State of the Art

| Old Approach | Current Approach (Phase 24) | When Changed | Impact |
|--------------|----------------------------|--------------|--------|
| Hardcoded migration actions in version-migration.md per version | `manifest apply-migration` reads manifest, applies all gaps | Phase 24 | Adding a new feature = adding it to manifest JSON. Zero workflow changes. |
| Hardcoded config template in new-project.md Step 5 | Manifest-driven feature gathering after core preferences | Phase 24 | New features auto-appear in new-project initialization |
| No post-update config awareness in update.md | Post-install `manifest diff-config` detects gaps, offers upgrade | Phase 24 | Users immediately learn about new features after update |
| Direct `fs.writeFileSync` for config | `atomicWriteJson` (write-tmp-rename) | Phase 24 | Interrupted migration cannot corrupt config.json |
| Hardcoded bash auto-detection in new-project.md | Manifest `auto_detect` rules + `manifest auto-detect` command | Phase 24 | Auto-detection is declarative and extensible |

**Not deprecated (preserved):**
- `loadConfig()` continues to work as-is. It reads config.json and applies its own defaults. Phase 24 does NOT modify loadConfig().
- `config-set` command continues to work for individual field writes.
- `config-ensure-section` command continues to work for creating empty config.
- `gsd_reflect_version` continues to be tracked alongside `manifest_version`.
- `version-migration.md` is simplified but remains as reference documentation.

## Key Files to Modify/Create

| File | Action | Lines (est.) | Requirement |
|------|--------|-------------|-------------|
| `get-shit-done/bin/gsd-tools.js` | MODIFY: add apply-migration, log-migration, auto-detect, coerceValue, atomicWriteJson; extract KNOWN_TOP_LEVEL_KEYS | ~250 | MIGR-01, MIGR-04, MIGR-05, MIGR-06 |
| `get-shit-done/bin/gsd-tools.test.js` | MODIFY: tests for new commands | ~200 | All |
| `get-shit-done/workflows/upgrade-project.md` | MODIFY: replace Step 5 with manifest commands | ~50 delta | MIGR-01 |
| `get-shit-done/workflows/new-project.md` | MODIFY: replace feature config + devops detection with manifest-driven logic | ~80 delta | MIGR-02 |
| `get-shit-done/workflows/update.md` | MODIFY: add post-install config gap check step | ~30 | MIGR-03 |
| `get-shit-done/feature-manifest.json` | MODIFY: add auto_detect for devops features | ~30 | MIGR-02 |
| `get-shit-done/references/version-migration.md` | MODIFY: simplify, remove hardcoded migration actions | ~-30 | MIGR-01 |

**Total estimated new/modified code:** ~610 lines

## Workflow Integration Map

This section maps how the three workflows interact with manifest commands after Phase 24:

```
/gsd:upgrade-project
  Step 1-4: unchanged (detect versions, compare, banner, mode)
  Step 5: NEW FLOW
    |-> manifest diff-config --raw
    |-> IF gaps found:
    |     Interactive: manifest get-prompts + AskUserQuestion + config-set
    |     YOLO/auto: (skip prompts)
    |-> manifest apply-migration --raw (fills remaining gaps + coerces)
    |-> config-set gsd_reflect_version <installed> (LAST)
  Step 6: manifest log-migration (replaces manual log append)
  Step 7: unchanged (report results)

/gsd:new-project
  Steps 1-4: unchanged (setup, brownfield, questioning, PROJECT.md)
  Step 5: Core preferences (mode, depth, etc.) -- KEEP hardcoded questions
  Step 5.5: NEW -- manifest-driven feature config
    |-> FOR each manifest feature:
    |     manifest auto-detect <feature> --raw
    |     manifest get-prompts <feature> --raw
    |     Interactive: AskUserQuestion with auto-detected defaults
    |     Auto: use auto-detected or manifest defaults
    |-> manifest apply-migration --raw (fills + writes atomically)
    |-> manifest log-migration (log initial config)
  Step 5.7: REMOVED (devops detection now in manifest auto_detect)
  Steps 6-9: unchanged (research, requirements, roadmap, done)

/gsd:update
  Steps 1-5: unchanged (detect, check npm, compare, confirm, install)
  Step 5.5: NEW -- post-install config gap check
    |-> manifest diff-config --raw
    |-> IF missing_features found:
    |     YOLO: manifest apply-migration --raw + manifest log-migration
    |     Interactive: display count + offer /gsd:upgrade-project
  Step 6-7: unchanged (display result, check patches)
```

## Open Questions

1. **Should `manifest apply-migration` also update `gsd_reflect_version`?**
   - What we know: The current upgrade-project workflow updates `gsd_reflect_version` LAST as a safety mechanism (partial migration retries). The `apply-migration` command updates `manifest_version`.
   - What's unclear: Should `gsd_reflect_version` and `manifest_version` be updated in the same atomic write, or should `gsd_reflect_version` remain a separate step?
   - Recommendation: `apply-migration` updates `manifest_version` only. `gsd_reflect_version` is updated by the workflow via `config-set` AFTER all changes succeed. This preserves the existing safety mechanism.

2. **Should new-project log to migration-log.md?**
   - What we know: MIGR-05 says "every automated config change." Creating initial config is an automated config change.
   - What's unclear: Is "initial project setup" conceptually a "migration"? The log is called "Migration Log."
   - Recommendation: Yes, log it. The entry format would be `0.0.0 -> <installed_version>` with "Initial project configuration" as the description. This provides a complete audit trail from project creation.

3. **How to handle the `_gate` prompt pattern for devops?**
   - What we know: The devops feature has `"field": "_gate"` in its init_prompts with a `skip_value`. This means "ask if the user wants to configure devops at all, and if they say skip, apply all defaults."
   - What's unclear: The `_gate` pattern needs special handling in the workflow: if the user picks `skip_value`, all schema fields get defaults without further questions.
   - Recommendation: Document the `_gate` pattern as a manifest convention. Workflows check for `_gate` prompts first. If user selects skip_value, the feature gets all defaults. If user selects configure, continue with remaining prompts.

4. **Should auto-detect for devops be in the manifest or remain in the workflow?**
   - What we know: The existing devops auto-detection in new-project.md Step 5.7 includes git log analysis (commit convention detection) which is more complex than simple file existence checks.
   - What's unclear: Whether the manifest `auto_detect` format can handle git log pattern matching.
   - Recommendation: Extend the manifest `auto_detect` format with a `git_log_pattern` check type (see code example above). This keeps all auto-detection declarative. The gsd-tools.js `manifest auto-detect` command handles the execution. If git log pattern matching proves too complex, it can remain in the workflow as a special case, but this should be avoided.

5. **Should `atomicWriteJson` replace ALL config writes in gsd-tools.js?**
   - What we know: The existing `cmdConfigSet` and `cmdConfigEnsureSection` use direct `writeFileSync`. Only Phase 24 migration commands strictly need atomicity.
   - What's unclear: Whether retrofitting all config writes with atomicity is worth the churn.
   - Recommendation: Use `atomicWriteJson` for the new migration commands. Optionally retrofit `cmdConfigSet` if it is simple. Do NOT retrofit all writeFileSync calls in Phase 24 -- that is scope creep.

## Sources

### Primary (HIGH confidence)

- **Existing codebase analysis** -- direct reading of:
  - `get-shit-done/bin/gsd-tools.js` (4843 lines): loadConfig (line 162), loadManifest (line 487), loadProjectConfig (line 503), validateFieldType (line 513), validateFieldEnum (line 524), cmdConfigEnsureSection (line 620), cmdConfigSet (line 671), cmdManifestDiffConfig (line 4263), cmdManifestValidate (line 4345), cmdManifestGetPrompts (line 4423), cmdInitNewProject (line 3782)
  - `get-shit-done/feature-manifest.json` (142 lines): 3 features (health_check, devops, release) with schemas, init_prompts, auto_detect
  - `get-shit-done/workflows/upgrade-project.md` (124 lines): 7-step migration flow with Step 5 hardcoded patches, Step 6 logging
  - `get-shit-done/workflows/new-project.md` (1051 lines): Steps 5 + 5.7 with hardcoded config template + devops detection
  - `get-shit-done/workflows/update.md` (213 lines): 7-step update flow, no post-install config check
  - `get-shit-done/references/version-migration.md` (204 lines): hardcoded migration actions for v1.12.0
  - `hooks/gsd-version-check.js` (93 lines): session-start version comparison hook
  - `bin/install.js` (lines 1940-1955): manifest copy + verification
  - `.planning/config.json`: current project config with manifest_version: 1
  - `.planning/migration-log.md`: existing migration log with one entry
- **Phase 23 research and verification:**
  - `.planning/phases/23-feature-manifest-foundation/23-RESEARCH.md` -- manifest design decisions, patterns, pitfalls
  - `.planning/phases/23-feature-manifest-foundation/23-VERIFICATION.md` -- confirmed 9/9 truths for Phase 23 completion
- **Prior project research:**
  - `.planning/research/ARCHITECTURE.md` -- Component 2 (Feature Manifest System), Component 3 (Update Experience)
  - `.planning/research/STACK.md` -- Section 2 (Feature Manifest / Config Schema System)
  - `.planning/research/PITFALLS.md` -- Pitfalls 2 (config validation breaks projects), 4 (dual source of truth), 6 (installer scope confusion)

### Secondary (MEDIUM confidence)

- **REQUIREMENTS.md** -- MIGR-01 through MIGR-06 requirement definitions
- **ROADMAP.md** -- Phase 24 success criteria and Phase 23 dependency

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero-dependency Node.js JSON handling, already proven in codebase
- Architecture: HIGH -- consuming Phase 23 tooling with clear integration points; all 3 workflow files read and analyzed
- New commands: HIGH -- patterns derived from existing gsd-tools.js commands (cmdConfigSet coercion, cmdManifestDiffConfig structure)
- Pitfalls: HIGH -- prior research catalogued all major risks; codebase analysis confirms scope boundaries; real migration-log.md exists to validate format
- Workflow modifications: MEDIUM -- modifications are to .md instruction files (Claude-interpreted), not executable code. Testing requires running the workflows end-to-end which is harder to automate.

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (stable domain -- internal tooling, no external API dependencies)
