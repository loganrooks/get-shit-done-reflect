# Phase 23: Feature Manifest Foundation - Research

**Researched:** 2026-02-22
**Domain:** Declarative config schema manifest for GSD Reflect feature initialization
**Confidence:** HIGH

## Summary

Phase 23 creates a `feature-manifest.json` file that declaratively describes the config requirements for all GSD features (health_check, devops, release), and adds `manifest` subcommands to `gsd-tools.js` for diffing and validating project configs against the manifest. The installer ships the manifest file alongside existing GSD files.

This is a foundation-only phase: build the manifest data file, build the tooling to read/diff/validate it, and ship it. Phase 24 (Manifest-Driven Config Migration) will consume these tools to replace hardcoded migration logic in `upgrade-project` and `new-project` workflows. Phase 23 intentionally does NOT modify any existing workflows.

**Primary recommendation:** Build a single `feature-manifest.json` at `get-shit-done/feature-manifest.json` with a hand-rolled validation function (50-100 lines) following the existing `FRONTMATTER_SCHEMAS` pattern at line 2109 of gsd-tools.js. Use zero external dependencies. Manifest defaults MUST match existing `loadConfig()` defaults exactly.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs` + `path` | Built-in | JSON file I/O for manifest and config | Already used everywhere in gsd-tools.js and install.js |
| `JSON.parse` / `JSON.stringify` | Built-in | Manifest and config parsing | Zero-dependency, already the config format |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:test` + `node:assert` | Built-in | Unit tests | Test manifest validation logic |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled validator | Ajv (JSON Schema validator, 168KB) | Ajv is the industry standard for JSON Schema validation, but violates the project's zero-dependency constraint. Hand-rolled validator suffices for simple type/enum/default checks |
| Hand-rolled validator | Zod (87KB) | Same tradeoff -- powerful but adds a dependency. Could be reconsidered if manifest complexity grows in future milestones |
| Single `feature-manifest.json` | Per-feature JSON files | Multiple files add parsing/merging complexity. Features are few enough (~5-10 max) for a single file |

**Installation:** No new packages needed. Zero dependencies.

## Architecture Patterns

### Recommended File Location

```
get-shit-done/
  feature-manifest.json            # NEW: the manifest (shipped with GSD)
  bin/gsd-tools.js                 # MODIFIED: gains `manifest` subcommand group
  references/
    (no new reference doc in Phase 23 -- that is Phase 24 territory)
```

Installed to: `~/.claude/get-shit-done/feature-manifest.json` (global) or `.claude/get-shit-done/feature-manifest.json` (local)

### Pattern 1: Manifest Schema Structure

**What:** The manifest is a static JSON file describing config requirements for each feature.
**When to use:** Any time a feature needs config fields in `.planning/config.json`.

The prior research (`.planning/research/ARCHITECTURE.md` and `.planning/research/STACK.md`) already designed two slightly different manifest schemas. The STACK.md version is leaner and should be the basis. Key fields per feature:

```json
{
  "manifest_version": 1,
  "features": {
    "health_check": {
      "scope": "project",
      "introduced": "1.12.0",
      "config_key": "health_check",
      "schema": {
        "frequency": {
          "type": "string",
          "enum": ["milestone-only", "on-resume", "every-phase", "explicit-only"],
          "default": "milestone-only",
          "description": "How often health checks run"
        },
        "stale_threshold_days": {
          "type": "number",
          "default": 7,
          "description": "Days before artifacts are considered stale"
        },
        "blocking_checks": {
          "type": "boolean",
          "default": false,
          "description": "Whether health warnings block execution"
        }
      },
      "init_prompts": [
        {
          "field": "frequency",
          "question": "How often should health checks run?",
          "options": [
            { "value": "milestone-only", "label": "Milestone only (default)" },
            { "value": "on-resume", "label": "On resume" },
            { "value": "every-phase", "label": "Every phase" },
            { "value": "explicit-only", "label": "Explicit only" }
          ]
        }
      ]
    }
  }
}
```

**Design principles from prior research:**
- `scope: "project"` = config in `.planning/config.json` (initialized by new-project, migrated by upgrade-project)
- `scope: "user"` = infrastructure in `~/.gsd/` (set up by installer)
- `config_key` = the top-level key in config.json for this feature's section
- `introduced` = version that added this feature (enables migration to know what is new)
- `manifest_version` = integer, tracked in config.json as `manifest_version` field

### Pattern 2: Subcommand Group Pattern in gsd-tools.js

**What:** `manifest` becomes a top-level command with subcommands, following the existing pattern used by `state`, `verify`, `template`, `frontmatter`, `phase`, `roadmap`.
**When to use:** When adding a new command group.

```javascript
// In the main switch statement:
case 'manifest': {
  const subcommand = args[1];
  if (subcommand === 'diff-config') {
    cmdManifestDiffConfig(cwd, raw);
  } else if (subcommand === 'validate') {
    cmdManifestValidate(cwd, raw);
  } else if (subcommand === 'get-prompts') {
    const feature = args[2];
    cmdManifestGetPrompts(cwd, feature, raw);
  } else {
    error('Unknown manifest subcommand. Available: diff-config, validate, get-prompts');
  }
  break;
}
```

Source: Existing patterns at lines 4228-4561 of `get-shit-done/bin/gsd-tools.js`.

### Pattern 3: Manifest Loading Helper

**What:** A helper function that locates and loads the manifest from the installed GSD files.
**When to use:** Every manifest subcommand needs to find and parse the manifest.

```javascript
function loadManifest(cwd) {
  // Check project-local install first, then global
  const localPath = path.join(cwd, '.claude', 'get-shit-done', 'feature-manifest.json');
  const globalPath = path.join(require('os').homedir(), '.claude', 'get-shit-done', 'feature-manifest.json');

  const manifestPath = fs.existsSync(localPath) ? localPath : globalPath;
  if (!fs.existsSync(manifestPath)) {
    return null; // Manifest not installed (pre-manifest GSD version)
  }
  return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
}
```

### Pattern 4: Additive-Only Diff

**What:** `manifest diff-config` compares manifest against config, categorizing results.
**When to use:** Detecting what is missing, mismatched, or unknown.

Output structure:
```json
{
  "missing_features": [
    { "feature": "release", "config_key": "release", "reason": "Section absent from config.json" }
  ],
  "missing_fields": [
    { "feature": "health_check", "field": "blocking_checks", "expected_type": "boolean", "default": false }
  ],
  "type_mismatches": [
    { "feature": "...", "field": "...", "expected": "number", "actual": "string", "value": "..." }
  ],
  "unknown_fields": [
    { "path": "parallelization", "info": "Not declared in manifest (user/legacy field)" }
  ],
  "manifest_version": 1,
  "config_manifest_version": null
}
```

**Key rule:** `unknown_fields` are informational warnings, NEVER errors. The manifest describes what CAN exist, not what MUST exist. Unknown fields are always preserved.

### Pattern 5: Validation Output Pattern

**What:** `manifest validate` returns pass/warn/fail with granular results.
**When to use:** Confirming a config is compatible with the manifest.

```json
{
  "valid": true,
  "warnings": [
    { "type": "unknown_field", "path": "custom_setting", "message": "Not declared in manifest" }
  ],
  "errors": [],
  "features_checked": 3,
  "features_present": 2,
  "features_missing": 1
}
```

**Key rule:** A config with unknown fields MUST pass validation (valid: true, warnings only). Only type mismatches on manifest-declared fields produce errors.

### Anti-Patterns to Avoid

- **Strict validation that rejects unknown fields:** The manifest MUST be permissive. Users add custom config fields. Manifest validation that rejects unknown fields breaks existing projects.
- **Manifest defaults diverging from loadConfig() defaults:** The defaults in `feature-manifest.json` and in the `loadConfig()` function at line 157 of gsd-tools.js MUST be identical. Two sources of truth for defaults leads to inconsistent behavior.
- **Installer reading/writing .planning/config.json:** The installer (install.js) handles user-level files only. The manifest file gets copied to the install target as a static file. Project-level config operations happen in workflows/commands, never in the installer.
- **Using formal JSON Schema ($schema, $ref, etc.):** Adds complexity without benefit. The hand-rolled validator is simpler and sufficient for type/enum/default checks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON file I/O | Custom parser | `JSON.parse` / `JSON.stringify` | Native, reliable, already used everywhere |
| File copy during install | Custom copy logic | Extend existing `copyWithPathReplacement` in install.js | Already handles .md and non-.md files with runtime path replacement |

**Key insight:** Almost everything needed already exists in gsd-tools.js and install.js. The manifest system extends existing patterns rather than introducing new infrastructure.

## Common Pitfalls

### Pitfall 1: Manifest Defaults Diverge from loadConfig() Defaults

**What goes wrong:** The manifest says `health_check.frequency` defaults to `"milestone-only"` but `loadConfig()` has no such default (or a different one). When a feature checks config vs when `manifest validate` runs, they see different effective values.
**Why it happens:** Two code locations define what "missing field" means. The manifest has explicit `default` fields per schema property. The `loadConfig()` function at line 157-208 of gsd-tools.js has its own hardcoded defaults object.
**How to avoid:** The manifest is the single source of truth for defaults. In Phase 23 (foundation only), this means the manifest's defaults MUST match the existing `loadConfig()` defaults. In Phase 24, `loadConfig()` will be updated to read defaults from the manifest.
**Warning signs:** Unit tests that create configs from scratch pass, but tests against real legacy configs fail because effective defaults differ.

### Pitfall 2: gsd-file-manifest.json Name Collision

**What goes wrong:** The installer already creates `gsd-file-manifest.json` (a SHA-256 hash manifest for detecting user-modified files). The new `feature-manifest.json` could be confused with it.
**Why it happens:** Both are "manifest" files but serve completely different purposes. `gsd-file-manifest.json` tracks file integrity. `feature-manifest.json` declares config schemas.
**How to avoid:** Use the name `feature-manifest.json` (not `manifest.json`, not `gsd-manifest.json`). Keep the two manifests clearly distinct in documentation and code comments.
**Warning signs:** Code references "the manifest" without specifying which one.

### Pitfall 3: Installer Path Replacement Corrupts Manifest Content

**What goes wrong:** `install.js` uses `copyWithPathReplacement()` which replaces `~/.claude/` paths in `.md` files. If `feature-manifest.json` contains any path-like strings, they could get corrupted.
**Why it happens:** The copy function at line 1172 of install.js treats `.md` files specially (runs path replacement) but copies non-`.md` files with `fs.copyFileSync()` (no replacement). Since `feature-manifest.json` is a `.json` file, it will be copied verbatim -- no risk.
**How to avoid:** Keep the manifest file as `.json` (not `.md`). The existing `copyWithPathReplacement()` already handles this correctly by only processing `.md` files.
**Warning signs:** If manifest is later moved to `.md` format, path replacement would corrupt it.

### Pitfall 4: Type Coercion in Config Values

**What goes wrong:** config.json has `"parallelization": true` (boolean), but the template has `"parallelization": { "enabled": true, ... }` (object). The manifest schema says type is "boolean" or "object" -- which one? Type validation rejects one or the other form.
**Why it happens:** Config shapes evolved over versions. Early projects have flat values; newer projects have nested objects. `loadConfig()` already handles both shapes (lines 185-189).
**How to avoid:** For fields with known polymorphic shapes (like `parallelization`), the manifest schema should use `type: ["boolean", "object"]` or skip type validation for that field. The `loadConfig()` coercion logic is the source of truth for what is accepted.
**Warning signs:** Validation fails on configs that `loadConfig()` accepts without issue.

### Pitfall 5: Scope Boundary Confusion Between Installer and Commands

**What goes wrong:** Phase 23 needs the installer to copy `feature-manifest.json` to the install target. Developer accidentally adds manifest-reading logic to the installer that also modifies `.planning/config.json`.
**Why it happens:** The manifest bridges user-level (installed files) and project-level (config.json) concerns. It is tempting to handle both in one place.
**How to avoid:** Strict scope boundary: installer copies the manifest file as a static asset (like it copies VERSION, CHANGELOG.md). The installer never reads the manifest content or acts on it. Manifest-reading logic lives exclusively in gsd-tools.js manifest subcommands. Project-level config changes happen in workflows (Phase 24).
**Warning signs:** install.js gains `JSON.parse` of `feature-manifest.json`; install.js references `.planning/config.json`.

## Code Examples

### Manifest File (feature-manifest.json)

```json
{
  "manifest_version": 1,
  "features": {
    "health_check": {
      "scope": "project",
      "introduced": "1.12.0",
      "config_key": "health_check",
      "schema": {
        "frequency": {
          "type": "string",
          "enum": ["milestone-only", "on-resume", "every-phase", "explicit-only"],
          "default": "milestone-only",
          "description": "How often health checks run"
        },
        "stale_threshold_days": {
          "type": "number",
          "default": 7,
          "description": "Days before artifacts are considered stale"
        },
        "blocking_checks": {
          "type": "boolean",
          "default": false,
          "description": "Whether health warnings block execution"
        }
      },
      "init_prompts": [
        {
          "field": "frequency",
          "question": "How often should health checks run?",
          "options": [
            { "value": "milestone-only", "label": "Milestone only (default)" },
            { "value": "on-resume", "label": "On resume" },
            { "value": "every-phase", "label": "Every phase" },
            { "value": "explicit-only", "label": "Explicit only" }
          ]
        }
      ]
    },
    "devops": {
      "scope": "project",
      "introduced": "1.12.0",
      "config_key": "devops",
      "schema": {
        "ci_provider": {
          "type": "string",
          "enum": ["none", "github-actions", "gitlab-ci", "circleci", "jenkins", "bitbucket-pipelines", "travis-ci", "other"],
          "default": "none",
          "description": "CI/CD provider"
        },
        "deploy_target": {
          "type": "string",
          "enum": ["none", "vercel", "docker", "fly-io", "railway", "netlify", "serverless", "aws", "gcp", "other"],
          "default": "none",
          "description": "Deployment target"
        },
        "commit_convention": {
          "type": "string",
          "enum": ["freeform", "conventional"],
          "default": "freeform",
          "description": "Commit message convention"
        },
        "environments": {
          "type": "array",
          "default": [],
          "description": "Environment names (e.g., staging, production)"
        }
      },
      "init_prompts": [
        {
          "field": "_gate",
          "question": "Configure DevOps context now?",
          "options": [
            { "value": "skip", "label": "Skip (use defaults)" },
            { "value": "configure", "label": "Configure now" }
          ],
          "skip_value": "skip"
        }
      ]
    },
    "release": {
      "scope": "project",
      "introduced": "1.15.0",
      "config_key": "release",
      "schema": {
        "version_file": {
          "type": "string",
          "enum": ["package.json", "Cargo.toml", "pyproject.toml", "VERSION", "none"],
          "default": "none",
          "description": "File containing project version"
        },
        "changelog": {
          "type": "string",
          "default": "CHANGELOG.md",
          "description": "Changelog file path"
        },
        "changelog_format": {
          "type": "string",
          "enum": ["keepachangelog", "conventional", "freeform", "none"],
          "default": "keepachangelog",
          "description": "Changelog format"
        },
        "ci_trigger": {
          "type": "string",
          "enum": ["github-release", "tag-push", "manual", "none"],
          "default": "none",
          "description": "What triggers CI/CD on release"
        },
        "registry": {
          "type": "string",
          "enum": ["npm", "crates", "pypi", "none"],
          "default": "none",
          "description": "Package registry"
        },
        "branch": {
          "type": "string",
          "default": "main",
          "description": "Branch releases are made from"
        }
      },
      "init_prompts": [
        {
          "field": "version_file",
          "question": "Where is your version tracked?",
          "options": [
            { "value": "package.json", "label": "package.json (Node.js)" },
            { "value": "Cargo.toml", "label": "Cargo.toml (Rust)" },
            { "value": "pyproject.toml", "label": "pyproject.toml (Python)" },
            { "value": "VERSION", "label": "VERSION file" },
            { "value": "none", "label": "Not configured yet" }
          ]
        }
      ],
      "auto_detect": {
        "version_file": [
          { "check": "file_exists", "path": "package.json", "value": "package.json" },
          { "check": "file_exists", "path": "Cargo.toml", "value": "Cargo.toml" },
          { "check": "file_exists", "path": "pyproject.toml", "value": "pyproject.toml" }
        ]
      }
    }
  }
}
```

### Manifest Loading + Validation Functions (gsd-tools.js additions)

```javascript
// ---- Manifest Helpers ----

function loadManifest(cwd) {
  const localPath = path.join(cwd, '.claude', 'get-shit-done', 'feature-manifest.json');
  const globalPath = path.join(require('os').homedir(), '.claude', 'get-shit-done', 'feature-manifest.json');
  const manifestPath = fs.existsSync(localPath) ? localPath
    : fs.existsSync(globalPath) ? globalPath : null;
  if (!manifestPath) return null;
  try {
    return JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  } catch {
    return null;
  }
}

function loadProjectConfig(cwd) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return null;
  }
}

function validateFieldType(value, schema) {
  if (value === undefined || value === null) return true; // missing is not a type error
  const expectedType = schema.type;
  if (expectedType === 'string') return typeof value === 'string';
  if (expectedType === 'number') return typeof value === 'number';
  if (expectedType === 'boolean') return typeof value === 'boolean';
  if (expectedType === 'array') return Array.isArray(value);
  if (expectedType === 'object') return typeof value === 'object' && !Array.isArray(value);
  return true; // unknown type = pass
}

function validateFieldEnum(value, schema) {
  if (!schema.enum || value === undefined) return true;
  return schema.enum.includes(value);
}

// ---- Manifest Commands ----

function cmdManifestDiffConfig(cwd, raw) {
  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found. Is GSD installed?'); }
  const config = loadProjectConfig(cwd);
  if (!config) { error('No .planning/config.json found. Run /gsd:new-project first.'); }

  const result = {
    missing_features: [],
    missing_fields: [],
    type_mismatches: [],
    enum_mismatches: [],
    unknown_fields: [],
    manifest_version: manifest.manifest_version,
    config_manifest_version: config.manifest_version || null,
  };

  // Known config keys declared by manifest
  const declaredKeys = new Set();
  // Also track known top-level keys that are not feature sections
  const knownTopLevel = new Set([
    'mode', 'depth', 'model_profile', 'commit_docs', 'search_gitignored',
    'branching_strategy', 'phase_branch_template', 'milestone_branch_template',
    'workflow', 'planning', 'parallelization', 'gates', 'safety',
    'gsd_reflect_version', 'manifest_version', 'brave_search',
  ]);

  for (const [featureName, featureDef] of Object.entries(manifest.features)) {
    if (featureDef.scope !== 'project' || !featureDef.config_key) continue;
    declaredKeys.add(featureDef.config_key);

    const section = config[featureDef.config_key];
    if (!section) {
      result.missing_features.push({
        feature: featureName,
        config_key: featureDef.config_key,
        introduced: featureDef.introduced,
      });
      continue;
    }

    // Check each field in the schema
    for (const [fieldName, fieldSchema] of Object.entries(featureDef.schema)) {
      const value = section[fieldName];
      if (value === undefined) {
        result.missing_fields.push({
          feature: featureName,
          field: fieldName,
          expected_type: fieldSchema.type,
          default: fieldSchema.default,
        });
      } else if (!validateFieldType(value, fieldSchema)) {
        result.type_mismatches.push({
          feature: featureName,
          field: fieldName,
          expected: fieldSchema.type,
          actual: typeof value,
          value,
        });
      } else if (!validateFieldEnum(value, fieldSchema)) {
        result.enum_mismatches.push({
          feature: featureName,
          field: fieldName,
          expected_values: fieldSchema.enum,
          actual: value,
        });
      }
    }
  }

  // Detect unknown top-level config fields
  for (const key of Object.keys(config)) {
    if (!declaredKeys.has(key) && !knownTopLevel.has(key)) {
      result.unknown_fields.push({
        path: key,
        info: 'Not declared in manifest (user/legacy field)',
      });
    }
  }

  output(result, raw);
}

function cmdManifestValidate(cwd, raw) {
  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found. Is GSD installed?'); }
  const config = loadProjectConfig(cwd);
  if (!config) { error('No .planning/config.json found.'); }

  const warnings = [];
  const errors = [];
  let featuresChecked = 0;
  let featuresPresent = 0;

  for (const [featureName, featureDef] of Object.entries(manifest.features)) {
    if (featureDef.scope !== 'project' || !featureDef.config_key) continue;
    featuresChecked++;

    const section = config[featureDef.config_key];
    if (!section) {
      warnings.push({
        type: 'missing_feature',
        feature: featureName,
        message: `Feature "${featureName}" not configured (section "${featureDef.config_key}" absent)`,
      });
      continue;
    }
    featuresPresent++;

    for (const [fieldName, fieldSchema] of Object.entries(featureDef.schema)) {
      const value = section[fieldName];
      if (value !== undefined) {
        if (!validateFieldType(value, fieldSchema)) {
          errors.push({
            type: 'type_mismatch',
            feature: featureName,
            field: fieldName,
            message: `${featureName}.${fieldName}: expected ${fieldSchema.type}, got ${typeof value}`,
          });
        }
        if (!validateFieldEnum(value, fieldSchema)) {
          errors.push({
            type: 'enum_mismatch',
            feature: featureName,
            field: fieldName,
            message: `${featureName}.${fieldName}: "${value}" not in [${fieldSchema.enum.join(', ')}]`,
          });
        }
      }
    }
  }

  // Unknown fields are warnings, never errors
  const knownKeys = new Set(Object.values(manifest.features)
    .filter(f => f.config_key).map(f => f.config_key));
  const knownTopLevel = new Set([
    'mode', 'depth', 'model_profile', 'commit_docs', 'search_gitignored',
    'branching_strategy', 'phase_branch_template', 'milestone_branch_template',
    'workflow', 'planning', 'parallelization', 'gates', 'safety',
    'gsd_reflect_version', 'manifest_version', 'brave_search',
  ]);
  for (const key of Object.keys(config)) {
    if (!knownKeys.has(key) && !knownTopLevel.has(key)) {
      warnings.push({
        type: 'unknown_field',
        path: key,
        message: `"${key}" is not declared in the manifest`,
      });
    }
  }

  output({
    valid: errors.length === 0,
    warnings,
    errors,
    features_checked: featuresChecked,
    features_present: featuresPresent,
    features_missing: featuresChecked - featuresPresent,
  }, raw);
}

function cmdManifestGetPrompts(cwd, feature, raw) {
  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found.'); }
  if (!feature) { error('Feature name required. Usage: manifest get-prompts <feature>'); }
  const featureDef = manifest.features[feature];
  if (!featureDef) { error(`Unknown feature: ${feature}. Available: ${Object.keys(manifest.features).join(', ')}`); }
  output({
    feature,
    config_key: featureDef.config_key,
    prompts: featureDef.init_prompts || [],
    schema: featureDef.schema,
  }, raw);
}
```

### Installer Addition (install.js)

```javascript
// In the install() function, after existing file copy operations:

// Copy feature-manifest.json
const manifestSrc = path.join(src, 'get-shit-done', 'feature-manifest.json');
if (fs.existsSync(manifestSrc)) {
  const manifestDest = path.join(skillDest, 'feature-manifest.json');
  fs.copyFileSync(manifestSrc, manifestDest);
  if (verifyFileInstalled(manifestDest, 'feature-manifest.json')) {
    console.log(`  ${green}+${reset} Installed feature-manifest.json`);
  } else {
    failures.push('feature-manifest.json');
  }
}
```

Note: `feature-manifest.json` is a `.json` file, so `copyWithPathReplacement()` already handles it correctly via the `fs.copyFileSync` path (line 1211 of install.js). However, since the manifest is inside the `get-shit-done/` directory which is copied recursively by `copyWithPathReplacement()`, it will automatically be included when the `get-shit-done/` directory is copied. The explicit copy above is only needed if the manifest is NOT placed inside `get-shit-done/`.

**Recommendation:** Place `feature-manifest.json` inside `get-shit-done/` so it is automatically copied by the existing `copyWithPathReplacement()` call at line 1942. No installer code changes needed for file copying. The installer only needs a verification check.

### Unit Test Pattern

```javascript
describe('manifest diff-config command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
    // Write a manifest
    const gsdDir = path.join(tmpDir, '.claude', 'get-shit-done');
    fs.mkdirSync(gsdDir, { recursive: true });
    fs.writeFileSync(path.join(gsdDir, 'feature-manifest.json'), JSON.stringify({
      manifest_version: 1,
      features: {
        health_check: {
          scope: 'project',
          introduced: '1.12.0',
          config_key: 'health_check',
          schema: {
            frequency: { type: 'string', enum: ['milestone-only', 'on-resume'], default: 'milestone-only' },
          },
          init_prompts: [],
        },
      },
    }));
  });

  test('detects missing feature section', () => {
    fs.writeFileSync(path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ mode: 'yolo', depth: 'quick' }));
    const result = runGsdTools('manifest diff-config', tmpDir);
    assert.ok(result.success);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.missing_features.length, 1);
    assert.strictEqual(data.missing_features[0].feature, 'health_check');
  });

  test('unknown fields reported as informational', () => {
    fs.writeFileSync(path.join(tmpDir, '.planning', 'config.json'),
      JSON.stringify({ mode: 'yolo', custom_setting: true, health_check: { frequency: 'milestone-only' } }));
    const result = runGsdTools('manifest diff-config', tmpDir);
    const data = JSON.parse(result.output);
    assert.ok(data.unknown_fields.some(f => f.path === 'custom_setting'));
  });
});

describe('manifest validate command', () => {
  test('config with unknown fields passes validation', () => {
    // Setup manifest + config with extra fields
    // ...
    const result = runGsdTools('manifest validate', tmpDir);
    const data = JSON.parse(result.output);
    assert.strictEqual(data.valid, true);
    assert.ok(data.warnings.length > 0); // unknown fields are warnings
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded migration actions in version-migration.md | Manifest-driven config diff (Phase 23-24) | Phase 23 (this phase) | Eliminates per-version migration code |
| `loadConfig()` with inline defaults | Manifest declares defaults (Phase 23 foundation, Phase 24 integration) | Phase 23-24 | Single source of truth for feature config |
| Manual `config-ensure-section` for new features | `manifest diff-config` detects gaps automatically | Phase 23 | No more forgetting to add config sections |

**Not deprecated (preserved):**
- `loadConfig()` continues to work as-is in Phase 23. Phase 24 will optionally read defaults from the manifest.
- `config-ensure-section` continues to work. The manifest does not replace it.
- `gsd_reflect_version` continues to be tracked. `manifest_version` is a separate field.

## Open Questions

1. **Should `manifest_version` be an integer or semver string?**
   - What we know: Prior research used both `"$schema": "feature-manifest-v1"` (ARCHITECTURE.md) and `"manifest_version": "1.0"` (STACK.md). An integer is simplest.
   - What's unclear: Whether the manifest schema itself will have breaking changes requiring semver.
   - Recommendation: Use integer (`manifest_version: 1`). Increment on schema-breaking changes only. Simple comparison (`config.manifest_version < manifest.manifest_version`).

2. **How should top-level config fields (mode, depth, model_profile) be declared?**
   - What we know: These are not "features" -- they are core config fields. The manifest's `features` section describes feature-specific config sections (health_check, devops, release).
   - What's unclear: Should core fields be declared in the manifest too, or only in `loadConfig()` defaults?
   - Recommendation: For Phase 23, maintain a `knownTopLevel` set in the validation code (as shown in examples). Phase 24 could optionally add a `"core"` section to the manifest, but that is out of scope for Phase 23.

3. **Should the `validate` command include `--strict` mode for CI use?**
   - What we know: Success criteria say unknown fields warn but never reject. But CI pipelines may want stricter checks.
   - What's unclear: Whether any user would actually use strict mode.
   - Recommendation: Do not add `--strict` in Phase 23. The additive-only principle is more important than hypothetical CI strictness. Can be added later if demand emerges.

## Key Files to Modify/Create

| File | Action | Lines (est.) |
|------|--------|-------------|
| `get-shit-done/feature-manifest.json` | CREATE | ~120 |
| `get-shit-done/bin/gsd-tools.js` | MODIFY (add manifest subcommands + helpers) | ~200 |
| `bin/install.js` | MODIFY (add manifest verification step) | ~10 |
| `get-shit-done/bin/gsd-tools.test.js` | MODIFY (add manifest command tests) | ~150 |
| `.planning/config.json` | MODIFY (add `manifest_version` field) | ~1 |

**Total estimated new/modified code:** ~480 lines

## Sources

### Primary (HIGH confidence)

- **Existing codebase analysis** -- direct reading of gsd-tools.js (4598 lines), install.js (~2400 lines), config.json (template + project), version-migration.md, health-check.md, devops-detection.md
- **Prior research documents:**
  - `.planning/research/ARCHITECTURE.md` -- Component 2: Feature Manifest System (lines 188-352)
  - `.planning/research/STACK.md` -- Section 2: Feature Manifest / Config Schema System (lines 111-207)
  - `.planning/research/PITFALLS.md` -- Pitfall 2 (config validation), Pitfall 4 (dual source of truth), Pitfall 6 (installer scope)
  - `.planning/research/FEATURES.md` -- Feature manifest system priority analysis
- **Existing todo:** `.planning/todos/pending/2026-02-17-feature-manifest-system-for-declarative-feature-initialization.md`

### Secondary (MEDIUM confidence)

- **REQUIREMENTS.md** -- MANF-01 through MANF-05 requirement definitions
- **ROADMAP.md** -- Phase 23 success criteria and Phase 24 dependency relationship

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero-dependency Node.js JSON handling, already proven in codebase
- Architecture: HIGH -- two prior research documents designed the manifest schema in detail
- Pitfalls: HIGH -- prior research catalogued all major risks; codebase analysis confirms scope boundaries
- Code examples: HIGH -- patterns derived from existing gsd-tools.js code (not hypothetical)

**Research date:** 2026-02-22
**Valid until:** 2026-04-22 (stable domain -- internal tooling, no external API dependencies)
