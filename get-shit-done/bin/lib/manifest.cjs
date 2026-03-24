/**
 * Manifest — Feature manifest diff, validation, migration, and auto-detection commands
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { error, output, loadManifest, loadProjectConfig, atomicWriteJson } = require('./core.cjs');

// ─── Constants ───────────────────────────────────────────────────────────────

const KNOWN_TOP_LEVEL_KEYS = new Set([
  'mode', 'depth', 'model_profile', 'commit_docs', 'search_gitignored',
  'branching_strategy', 'phase_branch_template', 'milestone_branch_template',
  'workflow', 'planning', 'parallelization', 'gates', 'safety',
  'gsd_reflect_version', 'manifest_version', 'brave_search',
]);

// ─── Private Helpers ─────────────────────────────────────────────────────────

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

function coerceValue(value, schema) {
  const target = schema.type;
  if (target === 'boolean') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  if (target === 'number') {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed !== '' && !isNaN(trimmed)) return Number(trimmed);
    }
  }
  if (target === 'string') {
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'number') return String(value);
  }
  if (target === 'array') {
    if (!Array.isArray(value) && value !== null && value !== undefined) {
      return [value];
    }
  }
  return value;
}

function formatMigrationEntry(fromVersion, toVersion, timestamp, changes) {
  let entry = `## ${fromVersion} -> ${toVersion} (${timestamp})\n\n`;
  entry += `### Changes Applied\n`;
  for (const change of changes) {
    if (change.type === 'feature_added') {
      entry += `- Added \`${change.config_key}\` section`;
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

// ─── Commands ────────────────────────────────────────────────────────────────

function cmdManifestDiffConfig(cwd, raw) {
  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found. Is GSD installed?'); }
  const projectConfig = loadProjectConfig(cwd);
  if (!projectConfig) { error('No .planning/config.json found. Run /gsd:new-project first.'); }

  const result = {
    missing_features: [],
    missing_fields: [],
    type_mismatches: [],
    enum_mismatches: [],
    unknown_fields: [],
    manifest_version: manifest.manifest_version,
    config_manifest_version: projectConfig.manifest_version || null,
  };

  // Known config keys declared by manifest
  const declaredKeys = new Set();

  for (const [featureName, featureDef] of Object.entries(manifest.features)) {
    if (featureDef.scope !== 'project' || !featureDef.config_key) continue;
    declaredKeys.add(featureDef.config_key);

    const section = projectConfig[featureDef.config_key];
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
  for (const key of Object.keys(projectConfig)) {
    if (!declaredKeys.has(key) && !KNOWN_TOP_LEVEL_KEYS.has(key)) {
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
  const projectConfig = loadProjectConfig(cwd);
  if (!projectConfig) { error('No .planning/config.json found.'); }

  const warnings = [];
  const errors = [];
  let featuresChecked = 0;
  let featuresPresent = 0;

  for (const [featureName, featureDef] of Object.entries(manifest.features)) {
    if (featureDef.scope !== 'project' || !featureDef.config_key) continue;
    featuresChecked++;

    const section = projectConfig[featureDef.config_key];
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
  for (const key of Object.keys(projectConfig)) {
    if (!knownKeys.has(key) && !KNOWN_TOP_LEVEL_KEYS.has(key)) {
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

function cmdManifestApplyMigration(cwd, raw) {
  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found. Is GSD installed?'); }
  const configPath = path.join(cwd, '.planning', 'config.json');
  const projectConfig = loadProjectConfig(cwd);
  if (!projectConfig) { error('No .planning/config.json found. Run /gsd:new-project first.'); }

  const changes = [];

  for (const [featureName, featureDef] of Object.entries(manifest.features)) {
    if (featureDef.scope !== 'project' || !featureDef.config_key) continue;
    const key = featureDef.config_key;

    if (!projectConfig[key]) {
      // Add entire missing feature section with defaults
      projectConfig[key] = {};
      for (const [field, schema] of Object.entries(featureDef.schema)) {
        projectConfig[key][field] = schema.default;
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
        if (projectConfig[key][field] === undefined) {
          projectConfig[key][field] = schema.default;
          changes.push({
            type: 'field_added',
            feature: featureName,
            field,
            default_value: schema.default,
          });
        } else {
          const coerced = coerceValue(projectConfig[key][field], schema);
          if (coerced !== projectConfig[key][field]) {
            changes.push({
              type: 'type_coerced',
              feature: featureName,
              field,
              from: projectConfig[key][field],
              to: coerced,
            });
            projectConfig[key][field] = coerced;
          }
        }
      }
    }
  }

  // Update manifest_version
  if (projectConfig.manifest_version !== manifest.manifest_version) {
    changes.push({
      type: 'manifest_version_updated',
      from: projectConfig.manifest_version || null,
      to: manifest.manifest_version,
    });
    projectConfig.manifest_version = manifest.manifest_version;
  }

  if (changes.length > 0) {
    atomicWriteJson(configPath, projectConfig);
  }

  output({ changes, total_changes: changes.length }, raw);
}

function cmdManifestLogMigration(cwd, raw) {
  const args = process.argv.slice(2);
  const fromIdx = args.indexOf('--from');
  const toIdx = args.indexOf('--to');
  const changesIdx = args.indexOf('--changes');

  if (fromIdx === -1 || toIdx === -1 || changesIdx === -1) {
    error('Usage: manifest log-migration --from <version> --to <version> --changes <json>');
  }

  const fromVersion = args[fromIdx + 1];
  const toVersion = args[toIdx + 1];
  let changes;
  try {
    changes = JSON.parse(args[changesIdx + 1]);
  } catch (e) {
    error('Invalid JSON for --changes: ' + e.message);
  }

  const logPath = path.join(cwd, '.planning', 'migration-log.md');
  const timestamp = new Date().toISOString();
  const entry = formatMigrationEntry(fromVersion, toVersion, timestamp, changes);

  const header = '# Migration Log\n\nTracks version upgrades applied to this project.\n';
  const footer = '\n---\n\n*Log is append-only.*\n';

  if (!fs.existsSync(logPath)) {
    fs.writeFileSync(logPath, header + '\n' + entry + footer, 'utf-8');
  } else {
    const existing = fs.readFileSync(logPath, 'utf-8');
    const headerMarker = '# Migration Log';
    const headerPos = existing.indexOf(headerMarker);
    if (headerPos === -1) {
      fs.writeFileSync(logPath, header + '\n' + entry + '\n---\n\n' + existing, 'utf-8');
    } else {
      const headerEnd = existing.indexOf('\n\n', headerPos + headerMarker.length);
      if (headerEnd === -1) {
        fs.writeFileSync(logPath, existing + '\n\n' + entry + footer, 'utf-8');
      } else {
        const before = existing.substring(0, headerEnd + 2);
        const after = existing.substring(headerEnd + 2);
        fs.writeFileSync(logPath, before + entry + '\n---\n\n' + after, 'utf-8');
      }
    }
  }

  output({ logged: true, path: '.planning/migration-log.md', timestamp }, raw);
}

function cmdManifestAutoDetect(cwd, raw) {
  const args = process.argv.slice(2);
  const feature = args[2]; // manifest auto-detect <feature>

  const manifest = loadManifest(cwd);
  if (!manifest) { error('Manifest not found. Is GSD installed?'); }
  if (!feature) { error('Feature name required. Usage: manifest auto-detect <feature>'); }
  const featureDef = manifest.features[feature];
  if (!featureDef) {
    error(`Unknown feature: ${feature}. Available: ${Object.keys(manifest.features).join(', ')}`);
  }
  if (!featureDef.auto_detect) {
    output({ feature, detected: {} }, raw);
    return;
  }

  const detected = {};
  for (const [field, rules] of Object.entries(featureDef.auto_detect)) {
    for (const rule of rules) {
      if (rule.check === 'file_exists') {
        const fullPath = path.join(cwd, rule.path);
        if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
          detected[field] = rule.value;
          break;
        }
      } else if (rule.check === 'dir_exists') {
        const fullPath = path.join(cwd, rule.path);
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
          detected[field] = rule.value;
          break;
        }
      } else if (rule.check === 'git_log_pattern') {
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
        } catch (e) {
          // git not available or not a git repo -- skip
        }
        break;
      }
    }
  }

  output({ feature, detected }, raw);
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  cmdManifestDiffConfig,
  cmdManifestValidate,
  cmdManifestGetPrompts,
  cmdManifestApplyMigration,
  cmdManifestLogMigration,
  cmdManifestAutoDetect,
};
