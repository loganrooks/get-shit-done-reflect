#!/usr/bin/env node

/**
 * GSD Tools — CLI utility for GSD workflow operations (GSD Reflect fork)
 *
 * Thin dispatcher that routes upstream commands to lib/*.cjs modules and
 * retains fork-specific functions (manifest, backlog, automation, sensors,
 * health-probe) inline until Phase 47 extraction.
 *
 * Usage: node gsd-tools.cjs <command> [args] [--raw] [--cwd <path>]
 *
 * See upstream docs for full command reference. Fork additions:
 *   manifest diff-config|validate|get-prompts|apply-migration|log-migration|auto-detect
 *   backlog add|list|update|stats|group|promote|index
 *   automation resolve-level|track-event|lock|unlock|check-lock|regime-change|reflection-counter
 *   sensors list|blind-spots
 *   health-probe signal-metrics|signal-density|automation-watchdog
 *
 * Fork init overrides (4-param signature with --include support):
 *   init execute-phase <phase> [--include state,config,roadmap]
 *   init plan-phase <phase> [--include state,roadmap,research,context,verification,uat,requirements]
 *   init progress [--include state,roadmap,project,config]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { error, output, safeReadFile, loadConfig, findPhaseInternal, resolveModelInternal,
        pathExistsInternal, generateSlugInternal, getMilestoneInfo, normalizePhaseName,
        loadManifest, loadProjectConfig, atomicWriteJson, parseIncludeFlag } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
const roadmap = require('./lib/roadmap.cjs');
const verify = require('./lib/verify.cjs');
const config = require('./lib/config.cjs');
const template = require('./lib/template.cjs');
const milestone = require('./lib/milestone.cjs');
const commands = require('./lib/commands.cjs');
const init = require('./lib/init.cjs');
const frontmatter = require('./lib/frontmatter.cjs');

// ─── Fork-Specific Constants ─────────────────────────────────────────────────

function extractFrontmatter(content) {
  const frontmatter = {};
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return frontmatter;

  const yaml = match[1];
  const lines = yaml.split('\n');

  // Stack to track nested objects: [{obj, key, indent}]
  // obj = object to write to, key = current key collecting array items, indent = indentation level
  let stack = [{ obj: frontmatter, key: null, indent: -1 }];

  for (const line of lines) {
    // Skip empty lines
    if (line.trim() === '') continue;

    // Calculate indentation (number of leading spaces)
    const indentMatch = line.match(/^(\s*)/);
    const indent = indentMatch ? indentMatch[1].length : 0;

    // Pop stack back to appropriate level
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const current = stack[stack.length - 1];

    // Check for key: value pattern
    const keyMatch = line.match(/^(\s*)([a-zA-Z0-9_-]+):\s*(.*)/);
    if (keyMatch) {
      const key = keyMatch[2];
      const value = keyMatch[3].trim();

      if (value === '' || value === '[') {
        // Key with no value or opening bracket — could be nested object or array
        // We'll determine based on next lines, for now create placeholder
        current.obj[key] = value === '[' ? [] : {};
        current.key = null;
        // Push new context for potential nested content
        stack.push({ obj: current.obj[key], key: null, indent });
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Inline array: key: [a, b, c]
        current.obj[key] = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
        current.key = null;
      } else {
        // Simple key: value
        current.obj[key] = value.replace(/^["']|["']$/g, '');
        current.key = null;
      }
    } else if (line.trim().startsWith('- ')) {
      // Array item
      const itemValue = line.trim().slice(2).replace(/^["']|["']$/g, '');

      // If current context is an empty object, convert to array
      if (typeof current.obj === 'object' && !Array.isArray(current.obj) && Object.keys(current.obj).length === 0) {
        // Find the key in parent that points to this object and convert it
        const parent = stack.length > 1 ? stack[stack.length - 2] : null;
        if (parent) {
          for (const k of Object.keys(parent.obj)) {
            if (parent.obj[k] === current.obj) {
              parent.obj[k] = [itemValue];
              current.obj = parent.obj[k];
              break;
            }
          }
        }
      } else if (Array.isArray(current.obj)) {
        current.obj.push(itemValue);
      }
    }
  }

  return frontmatter;
}

function reconstructFrontmatter(obj) {
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else if (value.every(v => typeof v === 'string') && value.length <= 3 && value.join(', ').length < 60) {
        lines.push(`${key}: [${value.join(', ')}]`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${typeof item === 'string' && (item.includes(':') || item.includes('#')) ? `"${item}"` : item}`);
        }
      }
    } else if (typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [subkey, subval] of Object.entries(value)) {
        if (subval === null || subval === undefined) continue;
        if (Array.isArray(subval)) {
          if (subval.length === 0) {
            lines.push(`  ${subkey}: []`);
          } else if (subval.every(v => typeof v === 'string') && subval.length <= 3 && subval.join(', ').length < 60) {
            lines.push(`  ${subkey}: [${subval.join(', ')}]`);
          } else {
            lines.push(`  ${subkey}:`);
            for (const item of subval) {
              lines.push(`    - ${typeof item === 'string' && (item.includes(':') || item.includes('#')) ? `"${item}"` : item}`);
            }
          }
        } else if (typeof subval === 'object') {
          lines.push(`  ${subkey}:`);
          for (const [subsubkey, subsubval] of Object.entries(subval)) {
            if (subsubval === null || subsubval === undefined) continue;
            if (Array.isArray(subsubval)) {
              if (subsubval.length === 0) {
                lines.push(`    ${subsubkey}: []`);
              } else {
                lines.push(`    ${subsubkey}:`);
                for (const item of subsubval) {
                  lines.push(`      - ${item}`);
                }
              }
            } else {
              lines.push(`    ${subsubkey}: ${subsubval}`);
            }
          }
        } else {
          const sv = String(subval);
          lines.push(`  ${subkey}: ${sv.includes(':') || sv.includes('#') ? `"${sv}"` : sv}`);
        }
      }
    } else {
      const sv = String(value);
      if (sv.includes(':') || sv.includes('#') || sv.startsWith('[') || sv.startsWith('{')) {
        lines.push(`${key}: "${sv}"`);
      } else {
        lines.push(`${key}: ${sv}`);
      }
    }
  }
  return lines.join('\n');
}

function spliceFrontmatter(content, newObj) {
  const yamlStr = reconstructFrontmatter(newObj);
  const match = content.match(/^---\n[\s\S]+?\n---/);
  if (match) {
    return `---\n${yamlStr}\n---` + content.slice(match[0].length);
  }
  return `---\n${yamlStr}\n---\n\n` + content;
}

function parseMustHavesBlock(content, blockName) {
  // Extract a specific block from must_haves in raw frontmatter YAML
  // Handles 3-level nesting: must_haves > artifacts/key_links > [{path, provides, ...}]
  const fmMatch = content.match(/^---\n([\s\S]+?)\n---/);
  if (!fmMatch) return [];

  const yaml = fmMatch[1];
  // Find the block (e.g., "truths:", "artifacts:", "key_links:")
  const blockPattern = new RegExp(`^\\s{4}${blockName}:\\s*$`, 'm');
  const blockStart = yaml.search(blockPattern);
  if (blockStart === -1) return [];

  const afterBlock = yaml.slice(blockStart);
  const blockLines = afterBlock.split('\n').slice(1); // skip the header line

  const items = [];
  let current = null;

  for (const line of blockLines) {
    // Stop at same or lower indent level (non-continuation)
    if (line.trim() === '') continue;
    const indent = line.match(/^(\s*)/)[1].length;
    if (indent <= 4 && line.trim() !== '') break; // back to must_haves level or higher

    if (line.match(/^\s{6}-\s+/)) {
      // New list item at 6-space indent
      if (current) items.push(current);
      current = {};
      // Check if it's a simple string item
      const simpleMatch = line.match(/^\s{6}-\s+"?([^"]+)"?\s*$/);
      if (simpleMatch && !line.includes(':')) {
        current = simpleMatch[1];
      } else {
        // Key-value on same line as dash: "- path: value"
        const kvMatch = line.match(/^\s{6}-\s+(\w+):\s*"?([^"]*)"?\s*$/);
        if (kvMatch) {
          current = {};
          current[kvMatch[1]] = kvMatch[2];
        }
      }
    } else if (current && typeof current === 'object') {
      // Continuation key-value at 8+ space indent
      const kvMatch = line.match(/^\s{8,}(\w+):\s*"?([^"]*)"?\s*$/);
      if (kvMatch) {
        const val = kvMatch[2];
        // Try to parse as number
        current[kvMatch[1]] = /^\d+$/.test(val) ? parseInt(val, 10) : val;
      }
      // Array items under a key
      const arrMatch = line.match(/^\s{10,}-\s+"?([^"]+)"?\s*$/);
      if (arrMatch) {
        // Find the last key added and convert to array
        const keys = Object.keys(current);
        const lastKey = keys[keys.length - 1];
        if (lastKey && !Array.isArray(current[lastKey])) {
          current[lastKey] = current[lastKey] ? [current[lastKey]] : [];
        }
        if (lastKey) current[lastKey].push(arrMatch[1]);
      }
    }
  }
  if (current) items.push(current);

  return items;
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

// ─── Module-Level Constants ───────────────────────────────────────────────────

const KNOWN_TOP_LEVEL_KEYS = new Set([
  'mode', 'depth', 'model_profile', 'commit_docs', 'search_gitignored',
  'branching_strategy', 'phase_branch_template', 'milestone_branch_template',
  'workflow', 'planning', 'parallelization', 'gates', 'safety',
  'gsd_reflect_version', 'manifest_version', 'brave_search',
]);

const FEATURE_CAPABILITY_MAP = {
  signal_collection: {
    hook_dependent_above: null,  // workflow postlude, not hook-based
    task_tool_dependent: false,
  },
  reflection: {
    hook_dependent_above: null,  // counter-based in workflow
    task_tool_dependent: true,   // spawns reflector as subagent
  },
  health_check: {
    hook_dependent_above: 2,     // session-start nudge needs hooks above level 2
    task_tool_dependent: false,
  },
  ci_status: {
    hook_dependent_above: 1,     // session-start display needs hooks above level 1
    task_tool_dependent: false,
  },
};

// ─── Fork Helpers ─────────────────────────────────────────────────────────────

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

// ─── Backlog Helpers ─────────────────────────────────────────────────────────

function resolveBacklogDir(cwd, isGlobal) {
  if (isGlobal) {
    const gsdHome = process.env.GSD_HOME || path.join(require('os').homedir(), '.gsd');
    return path.join(gsdHome, 'backlog', 'items');
  }
  return path.join(cwd, '.planning', 'backlog', 'items');
}

function readBacklogItems(cwd, isGlobal) {
  const itemsDir = resolveBacklogDir(cwd, isGlobal);
  const items = [];
  try {
    const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(itemsDir, file), 'utf-8');
        const fm = extractFrontmatter(content);
        items.push({
          id: fm.id || file.replace('.md', ''),
          title: fm.title || 'Untitled',
          priority: fm.priority || 'MEDIUM',
          status: fm.status || 'captured',
          tags: Array.isArray(fm.tags) ? fm.tags : [],
          theme: fm.theme || null,
          source: fm.source || 'unknown',
          promoted_to: fm.promoted_to === 'null' ? null : (fm.promoted_to || null),
          milestone: fm.milestone === 'null' ? null : (fm.milestone || null),
          created: fm.created || 'unknown',
          updated: fm.updated || 'unknown',
          file,
        });
      } catch {}
    }
  } catch {}
  return items;
}

// ─── Backlog Commands ────────────────────────────────────────────────────────

function cmdBacklogAdd(cwd, options, raw) {
  const { title, tags, priority, theme, source, global: isGlobal } = options;
  if (!title) { error('--title required for backlog add'); }

  const itemsDir = resolveBacklogDir(cwd, isGlobal);
  fs.mkdirSync(itemsDir, { recursive: true });

  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const slug = generateSlugInternal(title);
  const id = `blog-${date}-${slug}`;

  // Check for collision
  let filename = `${date}-${slug}.md`;
  let fullPath = path.join(itemsDir, filename);
  let counter = 2;
  while (fs.existsSync(fullPath)) {
    filename = `${date}-${slug}-${counter}.md`;
    fullPath = path.join(itemsDir, filename);
    counter++;
  }

  const tagArray = tags ? tags.split(',').map(t => t.trim()) : [];
  const fmObj = {
    id,
    title,
    tags: tagArray,
    theme: theme || 'null',
    priority: (priority || 'MEDIUM').toUpperCase(),
    status: 'captured',
    source: source || 'command',
    promoted_to: 'null',
    milestone: 'null',
    created: now.toISOString(),
    updated: now.toISOString(),
  };

  const fmStr = reconstructFrontmatter(fmObj);
  const content = `---\n${fmStr}\n---\n\n## Description\n\n_No description provided._\n`;

  fs.writeFileSync(fullPath, content, 'utf-8');

  // Auto-regenerate index
  try { regenerateBacklogIndex(cwd, isGlobal); } catch {}

  output({
    created: true,
    id,
    file: filename,
    path: fullPath,
    global: isGlobal || false,
  }, raw, id);
}

function cmdBacklogList(cwd, filters, raw) {
  const { priority, status, tags, global: isGlobal } = filters;
  const allItems = readBacklogItems(cwd, isGlobal);

  const items = allItems.filter(item => {
    if (priority && item.priority !== priority.toUpperCase()) return false;
    if (status && !status.split(',').map(s => s.trim()).includes(item.status)) return false;
    if (tags) {
      const filterTags = tags.split(',').map(t => t.trim());
      if (!filterTags.some(ft => item.tags.includes(ft))) return false;
    }
    return true;
  });

  output({ count: items.length, items }, raw, items.length.toString());
}

function cmdBacklogUpdate(cwd, itemId, updates, raw) {
  if (!itemId) { error('item ID required for backlog update'); }

  const itemsDir = resolveBacklogDir(cwd, false);
  let targetFile = null;
  let targetPath = null;

  try {
    const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(itemsDir, file), 'utf-8');
      const fm = extractFrontmatter(content);
      if (fm.id === itemId) {
        targetFile = file;
        targetPath = path.join(itemsDir, file);
        break;
      }
    }
  } catch {}

  if (!targetPath) { error(`Backlog item not found: ${itemId}`); }

  const content = fs.readFileSync(targetPath, 'utf-8');
  const fm = extractFrontmatter(content);

  // Apply updates
  const updatedFields = [];
  for (const [key, value] of Object.entries(updates)) {
    if (value !== undefined && value !== null) {
      fm[key] = key === 'priority' ? value.toUpperCase() : value;
      updatedFields.push(key);
    }
  }
  fm.updated = new Date().toISOString();

  // Reconstruct file content (preserve body after frontmatter)
  const bodyMatch = content.match(/^---\n[\s\S]+?\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : '\n\n## Description\n\n_No description provided._\n';
  const fmStr = reconstructFrontmatter(fm);
  const newContent = `---\n${fmStr}\n---\n${body}`;

  fs.writeFileSync(targetPath, newContent, 'utf-8');

  // Auto-regenerate index
  try { regenerateBacklogIndex(cwd, false); } catch {}

  output({
    updated: true,
    id: itemId,
    fields: updatedFields,
    file: targetFile,
  }, raw, itemId);
}

function cmdBacklogStats(cwd, raw) {
  const localItems = readBacklogItems(cwd, false);
  const globalItems = readBacklogItems(cwd, true);
  const allItems = [...localItems, ...globalItems];

  const byStatus = {};
  const byPriority = {};
  for (const item of allItems) {
    const s = item.status || 'captured';
    const p = item.priority || 'MEDIUM';
    byStatus[s] = (byStatus[s] || 0) + 1;
    byPriority[p] = (byPriority[p] || 0) + 1;
  }

  output({
    total: allItems.length,
    local: localItems.length,
    global: globalItems.length,
    by_status: byStatus,
    by_priority: byPriority,
  }, raw, `${allItems.length} items`);
}

function cmdBacklogGroup(cwd, groupBy, isGlobal, raw) {
  const items = readBacklogItems(cwd, isGlobal);
  const groups = {};

  if (groupBy === 'tags') {
    for (const item of items) {
      const tags = Array.isArray(item.tags) ? item.tags : [];
      if (tags.length === 0) {
        const key = '(untagged)';
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      } else {
        for (const tag of tags) {
          if (!groups[tag]) groups[tag] = [];
          groups[tag].push(item);
        }
      }
    }
  } else {
    // Default: group by theme
    for (const item of items) {
      const key = item.theme || '(no theme)';
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
  }

  output({
    group_by: groupBy || 'theme',
    group_count: Object.keys(groups).length,
    total_items: items.length,
    groups,
  }, raw, `${Object.keys(groups).length} groups`);
}

function cmdBacklogPromote(cwd, itemId, target, milestone, raw) {
  if (!itemId) { error('item ID required for backlog promote'); }

  const itemsDir = resolveBacklogDir(cwd, false);
  let targetFile = null;
  let targetPath = null;

  try {
    const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(itemsDir, file), 'utf-8');
      const fm = extractFrontmatter(content);
      if (fm.id === itemId) {
        targetFile = file;
        targetPath = path.join(itemsDir, file);
        break;
      }
    }
  } catch {}

  if (!targetPath) { error(`Backlog item not found: ${itemId}`); }

  const content = fs.readFileSync(targetPath, 'utf-8');
  const fm = extractFrontmatter(content);

  fm.status = 'planned';
  if (target) {
    fm.promoted_to = target;
  }
  if (milestone) {
    fm.milestone = milestone;
  }
  fm.updated = new Date().toISOString();

  const bodyMatch = content.match(/^---\n[\s\S]+?\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : '\n\n## Description\n\n_No description provided._\n';
  const fmStr = reconstructFrontmatter(fm);
  const newContent = `---\n${fmStr}\n---\n${body}`;

  fs.writeFileSync(targetPath, newContent, 'utf-8');

  // Auto-regenerate index
  try { regenerateBacklogIndex(cwd, false); } catch {}

  output({
    promoted: true,
    id: itemId,
    status: 'planned',
    promoted_to: target || null,
    milestone: milestone || null,
    file: targetFile,
  }, raw, itemId);
}

/**
 * Silent index regeneration -- called by add, update, promote.
 * Does not call output() so it won't interfere with the caller's output.
 */
function regenerateBacklogIndex(cwd, isGlobal) {
  const itemsDir = resolveBacklogDir(cwd, isGlobal);
  const indexPath = path.join(path.dirname(itemsDir), 'index.md');

  let items = [];
  try {
    const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(itemsDir, file), 'utf-8');
      const fm = extractFrontmatter(content);
      items.push({
        id: fm.id || file.replace('.md', ''),
        title: fm.title || 'Untitled',
        priority: fm.priority || 'MEDIUM',
        status: fm.status || 'captured',
        tags: Array.isArray(fm.tags) ? fm.tags.join(', ') : (fm.tags || ''),
        milestone: fm.milestone === 'null' ? null : (fm.milestone || null),
        created: (fm.created || '').split('T')[0],
      });
    }
  } catch {}

  // Sort by priority (HIGH first), then date (newest first)
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  items.sort((a, b) =>
    (priorityOrder[a.priority] ?? 1) - (priorityOrder[b.priority] ?? 1)
    || b.created.localeCompare(a.created)
  );

  const generated = new Date().toISOString();
  let md = `# Backlog Index\n\n**Generated:** ${generated}\n**Total items:** ${items.length}\n\n`;
  md += `| ID | Title | Priority | Status | Tags | Milestone | Date |\n`;
  md += `|----|-------|----------|--------|------|-----------|------|\n`;
  for (const item of items) {
    md += `| ${item.id} | ${item.title} | ${item.priority} | ${item.status} | ${item.tags} | ${item.milestone || '\u2014'} | ${item.created} |\n`;
  }

  // Ensure parent directory exists and write atomically
  fs.mkdirSync(path.dirname(indexPath), { recursive: true });
  const tmpPath = indexPath + '.tmp';
  fs.writeFileSync(tmpPath, md, 'utf-8');
  fs.renameSync(tmpPath, indexPath);

  return { generated, total: items.length, path: indexPath };
}

function cmdBacklogIndex(cwd, isGlobal, raw) {
  const result = regenerateBacklogIndex(cwd, isGlobal);
  output(result, raw, `Index rebuilt: ${result.total} items`);
}

// ─── Fork Init Overrides ─────────────────────────────────────────────────────

function cmdInitExecutePhase(cwd, phase, includes, raw) {
  if (!phase) {
    error('phase required for init execute-phase');
  }

  const cfg = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);
  const milestoneInfo = getMilestoneInfo(cwd);

  const result = {
    // Models
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    verifier_model: resolveModelInternal(cwd, 'gsd-verifier'),

    // Config flags
    commit_docs: cfg.commit_docs,
    parallelization: cfg.parallelization,
    branching_strategy: cfg.branching_strategy,
    phase_branch_template: cfg.phase_branch_template,
    milestone_branch_template: cfg.milestone_branch_template,
    verifier_enabled: cfg.verifier,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,

    // Plan inventory
    plans: phaseInfo?.plans || [],
    summaries: phaseInfo?.summaries || [],
    incomplete_plans: phaseInfo?.incomplete_plans || [],
    plan_count: phaseInfo?.plans?.length || 0,
    incomplete_count: phaseInfo?.incomplete_plans?.length || 0,

    // Branch name (pre-computed)
    branch_name: cfg.branching_strategy === 'phase' && phaseInfo
      ? cfg.phase_branch_template
          .replace('{phase}', phaseInfo.phase_number)
          .replace('{slug}', phaseInfo.phase_slug || 'phase')
      : cfg.branching_strategy === 'milestone'
        ? cfg.milestone_branch_template
            .replace('{milestone}', milestoneInfo.version)
            .replace('{slug}', generateSlugInternal(milestoneInfo.name) || 'milestone')
        : null,

    // Milestone info
    milestone_version: milestoneInfo.version,
    milestone_name: milestoneInfo.name,
    milestone_slug: generateSlugInternal(milestoneInfo.name),

    // File existence
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    config_exists: pathExistsInternal(cwd, '.planning/config.json'),
  };

  // Include file contents if requested via --include
  if (includes.has('state')) {
    result.state_content = safeReadFile(path.join(cwd, '.planning', 'STATE.md'));
  }
  if (includes.has('config')) {
    result.config_content = safeReadFile(path.join(cwd, '.planning', 'config.json'));
  }
  if (includes.has('roadmap')) {
    result.roadmap_content = safeReadFile(path.join(cwd, '.planning', 'ROADMAP.md'));
  }

  output(result, raw);
}

function cmdInitPlanPhase(cwd, phase, includes, raw) {
  if (!phase) {
    error('phase required for init plan-phase');
  }

  const cfg = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);

  const result = {
    // Models
    researcher_model: resolveModelInternal(cwd, 'gsd-phase-researcher'),
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),
    checker_model: resolveModelInternal(cwd, 'gsd-plan-checker'),

    // Workflow flags
    research_enabled: cfg.research,
    plan_checker_enabled: cfg.plan_checker,
    commit_docs: cfg.commit_docs,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,
    padded_phase: phaseInfo?.phase_number?.padStart(2, '0') || null,

    // Existing artifacts
    has_research: phaseInfo?.has_research || false,
    has_context: phaseInfo?.has_context || false,
    has_plans: (phaseInfo?.plans?.length || 0) > 0,
    plan_count: phaseInfo?.plans?.length || 0,

    // Environment
    planning_exists: pathExistsInternal(cwd, '.planning'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
  };

  // Include file contents if requested via --include
  if (includes.has('state')) {
    result.state_content = safeReadFile(path.join(cwd, '.planning', 'STATE.md'));
  }
  if (includes.has('roadmap')) {
    result.roadmap_content = safeReadFile(path.join(cwd, '.planning', 'ROADMAP.md'));
  }
  if (includes.has('requirements')) {
    result.requirements_content = safeReadFile(path.join(cwd, '.planning', 'REQUIREMENTS.md'));
  }
  if (includes.has('context') && phaseInfo?.directory) {
    // Find *-CONTEXT.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const contextFile = files.find(f => f.endsWith('-CONTEXT.md') || f === 'CONTEXT.md');
      if (contextFile) {
        result.context_content = safeReadFile(path.join(phaseDirFull, contextFile));
      }
    } catch {}
  }
  if (includes.has('research') && phaseInfo?.directory) {
    // Find *-RESEARCH.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const researchFile = files.find(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');
      if (researchFile) {
        result.research_content = safeReadFile(path.join(phaseDirFull, researchFile));
      }
    } catch {}
  }
  if (includes.has('verification') && phaseInfo?.directory) {
    // Find *-VERIFICATION.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const verificationFile = files.find(f => f.endsWith('-VERIFICATION.md') || f === 'VERIFICATION.md');
      if (verificationFile) {
        result.verification_content = safeReadFile(path.join(phaseDirFull, verificationFile));
      }
    } catch {}
  }
  if (includes.has('uat') && phaseInfo?.directory) {
    // Find *-UAT.md in phase directory
    const phaseDirFull = path.join(cwd, phaseInfo.directory);
    try {
      const files = fs.readdirSync(phaseDirFull);
      const uatFile = files.find(f => f.endsWith('-UAT.md') || f === 'UAT.md');
      if (uatFile) {
        result.uat_content = safeReadFile(path.join(phaseDirFull, uatFile));
      }
    } catch {}
  }

  output(result, raw);
}

function cmdInitNewProject(cwd, raw) {
  const cfg = loadConfig(cwd);

  // Detect Brave Search API key availability
  const homedir = require('os').homedir();
  const braveKeyFile = path.join(homedir, '.gsd', 'brave_api_key');
  const hasBraveSearch = !!(process.env.BRAVE_API_KEY || fs.existsSync(braveKeyFile));

  // Detect existing code
  let hasCode = false;
  let hasPackageFile = false;
  try {
    const files = execSync('find . -maxdepth 3 \\( -name "*.ts" -o -name "*.js" -o -name "*.py" -o -name "*.go" -o -name "*.rs" -o -name "*.swift" -o -name "*.java" \\) 2>/dev/null | grep -v node_modules | grep -v .git | head -5', {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    hasCode = files.trim().length > 0;
  } catch {}

  hasPackageFile = pathExistsInternal(cwd, 'package.json') ||
                   pathExistsInternal(cwd, 'requirements.txt') ||
                   pathExistsInternal(cwd, 'Cargo.toml') ||
                   pathExistsInternal(cwd, 'go.mod') ||
                   pathExistsInternal(cwd, 'Package.swift');

  const result = {
    // Models
    researcher_model: resolveModelInternal(cwd, 'gsd-project-researcher'),
    synthesizer_model: resolveModelInternal(cwd, 'gsd-research-synthesizer'),
    roadmapper_model: resolveModelInternal(cwd, 'gsd-roadmapper'),

    // Config
    commit_docs: cfg.commit_docs,

    // Existing state
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    has_codebase_map: pathExistsInternal(cwd, '.planning/codebase'),
    planning_exists: pathExistsInternal(cwd, '.planning'),

    // Brownfield detection
    has_existing_code: hasCode,
    has_package_file: hasPackageFile,
    is_brownfield: hasCode || hasPackageFile,
    needs_codebase_map: (hasCode || hasPackageFile) && !pathExistsInternal(cwd, '.planning/codebase'),

    // Git state
    has_git: pathExistsInternal(cwd, '.git'),

    // Enhanced search
    brave_search_available: hasBraveSearch,
  };

  output(result, raw);
}

function cmdInitNewMilestone(cwd, raw) {
  const cfg = loadConfig(cwd);
  const milestoneInfo = getMilestoneInfo(cwd);

  const result = {
    // Models
    researcher_model: resolveModelInternal(cwd, 'gsd-project-researcher'),
    synthesizer_model: resolveModelInternal(cwd, 'gsd-research-synthesizer'),
    roadmapper_model: resolveModelInternal(cwd, 'gsd-roadmapper'),

    // Config
    commit_docs: cfg.commit_docs,
    research_enabled: cfg.research,

    // Current milestone
    current_milestone: milestoneInfo.version,
    current_milestone_name: milestoneInfo.name,

    // File existence
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
  };

  output(result, raw);
}

function cmdInitQuick(cwd, description, raw) {
  const cfg = loadConfig(cwd);
  const now = new Date();
  const slug = description ? generateSlugInternal(description)?.substring(0, 40) : null;

  // Find next quick task number
  const quickDir = path.join(cwd, '.planning', 'quick');
  let nextNum = 1;
  try {
    const existing = fs.readdirSync(quickDir)
      .filter(f => /^\d+-/.test(f))
      .map(f => parseInt(f.split('-')[0], 10))
      .filter(n => !isNaN(n));
    if (existing.length > 0) {
      nextNum = Math.max(...existing) + 1;
    }
  } catch {}

  const result = {
    // Models
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),

    // Config
    commit_docs: cfg.commit_docs,

    // Quick task info
    next_num: nextNum,
    slug: slug,
    description: description || null,

    // Timestamps
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),

    // Paths
    quick_dir: '.planning/quick',
    task_dir: slug ? `.planning/quick/${nextNum}-${slug}` : null,

    // File existence
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),
  };

  output(result, raw);
}

function cmdInitResume(cwd, raw) {
  const cfg = loadConfig(cwd);

  // Check for interrupted agent
  let interruptedAgentId = null;
  try {
    interruptedAgentId = fs.readFileSync(path.join(cwd, '.planning', 'current-agent-id.txt'), 'utf-8').trim();
  } catch {}

  const result = {
    // File existence
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),

    // Agent state
    has_interrupted_agent: !!interruptedAgentId,
    interrupted_agent_id: interruptedAgentId,

    // Config
    commit_docs: cfg.commit_docs,
  };

  output(result, raw);
}

function cmdInitVerifyWork(cwd, phase, raw) {
  if (!phase) {
    error('phase required for init verify-work');
  }

  const cfg = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);

  const result = {
    // Models
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),
    checker_model: resolveModelInternal(cwd, 'gsd-plan-checker'),

    // Config
    commit_docs: cfg.commit_docs,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,

    // Existing artifacts
    has_verification: phaseInfo?.has_verification || false,
  };

  output(result, raw);
}

function cmdInitPhaseOp(cwd, phase, raw) {
  const cfg = loadConfig(cwd);
  const phaseInfo = findPhaseInternal(cwd, phase);

  const result = {
    // Config
    commit_docs: cfg.commit_docs,
    brave_search: cfg.brave_search,

    // Phase info
    phase_found: !!phaseInfo,
    phase_dir: phaseInfo?.directory || null,
    phase_number: phaseInfo?.phase_number || null,
    phase_name: phaseInfo?.phase_name || null,
    phase_slug: phaseInfo?.phase_slug || null,
    padded_phase: phaseInfo?.phase_number?.padStart(2, '0') || null,

    // Existing artifacts
    has_research: phaseInfo?.has_research || false,
    has_context: phaseInfo?.has_context || false,
    has_plans: (phaseInfo?.plans?.length || 0) > 0,
    has_verification: phaseInfo?.has_verification || false,
    plan_count: phaseInfo?.plans?.length || 0,

    // File existence
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    planning_exists: pathExistsInternal(cwd, '.planning'),
  };

  output(result, raw);
}

function cmdInitTodos(cwd, area, raw) {
  const cfg = loadConfig(cwd);
  const now = new Date();

  // List todos (reuse existing logic)
  const pendingDir = path.join(cwd, '.planning', 'todos', 'pending');
  let count = 0;
  const todos = [];

  try {
    const files = fs.readdirSync(pendingDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(pendingDir, file), 'utf-8');
        const createdMatch = content.match(/^created:\s*(.+)$/m);
        const titleMatch = content.match(/^title:\s*(.+)$/m);
        const areaMatch = content.match(/^area:\s*(.+)$/m);
        const priorityMatch = content.match(/^priority:\s*(.+)$/m);
        const sourceMatch = content.match(/^source:\s*(.+)$/m);
        const statusMatch = content.match(/^status:\s*(.+)$/m);
        const todoArea = areaMatch ? areaMatch[1].trim() : 'general';

        if (area && todoArea !== area) continue;

        count++;
        todos.push({
          file,
          created: createdMatch ? createdMatch[1].trim() : 'unknown',
          title: titleMatch ? titleMatch[1].trim() : 'Untitled',
          area: todoArea,
          priority: priorityMatch ? priorityMatch[1].trim() : 'MEDIUM',
          source: sourceMatch ? sourceMatch[1].trim() : 'unknown',
          status: statusMatch ? statusMatch[1].trim() : 'pending',
          path: path.join('.planning', 'todos', 'pending', file),
        });
      } catch {}
    }
  } catch {}

  const result = {
    // Config
    commit_docs: cfg.commit_docs,

    // Timestamps
    date: now.toISOString().split('T')[0],
    timestamp: now.toISOString(),

    // Todo inventory
    todo_count: count,
    todos,
    area_filter: area || null,

    // Paths
    pending_dir: '.planning/todos/pending',
    completed_dir: '.planning/todos/completed',

    // File existence
    planning_exists: pathExistsInternal(cwd, '.planning'),
    todos_dir_exists: pathExistsInternal(cwd, '.planning/todos'),
    pending_dir_exists: pathExistsInternal(cwd, '.planning/todos/pending'),
  };

  output(result, raw);
}

function cmdInitMilestoneOp(cwd, raw) {
  const cfg = loadConfig(cwd);
  const milestoneInfo = getMilestoneInfo(cwd);

  // Count phases
  let phaseCount = 0;
  let completedPhases = 0;
  const phasesDir = path.join(cwd, '.planning', 'phases');
  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name);
    phaseCount = dirs.length;

    // Count phases with summaries (completed)
    for (const dir of dirs) {
      try {
        const phaseFiles = fs.readdirSync(path.join(phasesDir, dir));
        const hasSummary = phaseFiles.some(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
        if (hasSummary) completedPhases++;
      } catch {}
    }
  } catch {}

  // Check archive
  const archiveDir = path.join(cwd, '.planning', 'archive');
  let archivedMilestones = [];
  try {
    archivedMilestones = fs.readdirSync(archiveDir, { withFileTypes: true })
      .filter(e => e.isDirectory())
      .map(e => e.name);
  } catch {}

  const result = {
    // Config
    commit_docs: cfg.commit_docs,

    // Current milestone
    milestone_version: milestoneInfo.version,
    milestone_name: milestoneInfo.name,
    milestone_slug: generateSlugInternal(milestoneInfo.name),

    // Phase counts
    phase_count: phaseCount,
    completed_phases: completedPhases,
    all_phases_complete: phaseCount > 0 && phaseCount === completedPhases,

    // Archive
    archived_milestones: archivedMilestones,
    archive_count: archivedMilestones.length,

    // File existence
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
    archive_exists: pathExistsInternal(cwd, '.planning/archive'),
    phases_dir_exists: pathExistsInternal(cwd, '.planning/phases'),
  };

  output(result, raw);
}

function cmdInitMapCodebase(cwd, raw) {
  const cfg = loadConfig(cwd);

  // Check for existing codebase maps
  const codebaseDir = path.join(cwd, '.planning', 'codebase');
  let existingMaps = [];
  try {
    existingMaps = fs.readdirSync(codebaseDir).filter(f => f.endsWith('.md'));
  } catch {}

  const result = {
    // Models
    mapper_model: resolveModelInternal(cwd, 'gsd-codebase-mapper'),

    // Config
    commit_docs: cfg.commit_docs,
    search_gitignored: cfg.search_gitignored,
    parallelization: cfg.parallelization,

    // Paths
    codebase_dir: '.planning/codebase',

    // Existing maps
    existing_maps: existingMaps,
    has_maps: existingMaps.length > 0,

    // File existence
    planning_exists: pathExistsInternal(cwd, '.planning'),
    codebase_dir_exists: pathExistsInternal(cwd, '.planning/codebase'),
  };

  output(result, raw);
}

function cmdInitProgress(cwd, includes, raw) {
  const cfg = loadConfig(cwd);
  const milestoneInfo = getMilestoneInfo(cwd);

  // Analyze phases
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const phases = [];
  let currentPhase = null;
  let nextPhase = null;

  try {
    const entries = fs.readdirSync(phasesDir, { withFileTypes: true });
    const dirs = entries.filter(e => e.isDirectory()).map(e => e.name).sort();

    for (const dir of dirs) {
      const match = dir.match(/^(\d+(?:\.\d+)?)-?(.*)/);
      const phaseNumber = match ? match[1] : dir;
      const phaseName = match && match[2] ? match[2] : null;

      const phasePath = path.join(phasesDir, dir);
      const phaseFiles = fs.readdirSync(phasePath);

      const plans = phaseFiles.filter(f => f.endsWith('-PLAN.md') || f === 'PLAN.md');
      const summaries = phaseFiles.filter(f => f.endsWith('-SUMMARY.md') || f === 'SUMMARY.md');
      const hasResearch = phaseFiles.some(f => f.endsWith('-RESEARCH.md') || f === 'RESEARCH.md');

      const status = summaries.length >= plans.length && plans.length > 0 ? 'complete' :
                     plans.length > 0 ? 'in_progress' :
                     hasResearch ? 'researched' : 'pending';

      const phaseInfo = {
        number: phaseNumber,
        name: phaseName,
        directory: path.join('.planning', 'phases', dir),
        status,
        plan_count: plans.length,
        summary_count: summaries.length,
        has_research: hasResearch,
      };

      phases.push(phaseInfo);

      // Find current (first incomplete with plans) and next (first pending)
      if (!currentPhase && (status === 'in_progress' || status === 'researched')) {
        currentPhase = phaseInfo;
      }
      if (!nextPhase && status === 'pending') {
        nextPhase = phaseInfo;
      }
    }
  } catch {}

  // Check for paused work
  let pausedAt = null;
  try {
    const stateContent = fs.readFileSync(path.join(cwd, '.planning', 'STATE.md'), 'utf-8');
    const pauseMatch = stateContent.match(/\*\*Paused At:\*\*\s*(.+)/);
    if (pauseMatch) pausedAt = pauseMatch[1].trim();
  } catch {}

  const result = {
    // Models
    executor_model: resolveModelInternal(cwd, 'gsd-executor'),
    planner_model: resolveModelInternal(cwd, 'gsd-planner'),

    // Config
    commit_docs: cfg.commit_docs,

    // Milestone
    milestone_version: milestoneInfo.version,
    milestone_name: milestoneInfo.name,

    // Phase overview
    phases,
    phase_count: phases.length,
    completed_count: phases.filter(p => p.status === 'complete').length,
    in_progress_count: phases.filter(p => p.status === 'in_progress').length,

    // Current state
    current_phase: currentPhase,
    next_phase: nextPhase,
    paused_at: pausedAt,
    has_work_in_progress: !!currentPhase,

    // File existence
    project_exists: pathExistsInternal(cwd, '.planning/PROJECT.md'),
    roadmap_exists: pathExistsInternal(cwd, '.planning/ROADMAP.md'),
    state_exists: pathExistsInternal(cwd, '.planning/STATE.md'),
  };

  // Include file contents if requested via --include
  if (includes.has('state')) {
    result.state_content = safeReadFile(path.join(cwd, '.planning', 'STATE.md'));
  }
  if (includes.has('roadmap')) {
    result.roadmap_content = safeReadFile(path.join(cwd, '.planning', 'ROADMAP.md'));
  }
  if (includes.has('project')) {
    result.project_content = safeReadFile(path.join(cwd, '.planning', 'PROJECT.md'));
  }
  if (includes.has('config')) {
    result.config_content = safeReadFile(path.join(cwd, '.planning', 'config.json'));
  }

  output(result, raw);
}

// ─── Manifest Commands ────────────────────────────────────────────────────────

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

// ─── Automation ───────────────────────────────────────────────────────────────

function cmdAutomationResolveLevel(cwd, feature, options, raw) {
  if (!feature) {
    error('Usage: automation resolve-level <feature> [--context-pct N] [--runtime NAME]');
  }

  const projectConfig = loadProjectConfig(cwd);
  if (!projectConfig) {
    error('No .planning/config.json found.');
  }

  const automation = projectConfig.automation || {};
  const globalLevel = automation.level ?? 1; // Default: nudge

  // Normalize feature name: hyphens -> underscores
  const normalizedFeature = feature.replace(/-/g, '_');

  let effectiveLevel = globalLevel;
  let overrideValue = null;
  const reasons = [];

  // Step 2: Per-feature override (AUTO-02)
  const overrides = automation.overrides || {};
  if (overrides[normalizedFeature] !== undefined) {
    overrideValue = overrides[normalizedFeature];
    effectiveLevel = overrideValue;
    reasons.push(`override: ${normalizedFeature}=${overrideValue}`);
  }

  // Step 3: Context-aware deferral (AUTO-04)
  // Only applies to level 3 (auto) -- levels 0-2 are not context-sensitive
  if (options.contextPct !== undefined) {
    const threshold = automation.context_threshold_pct ?? 60;
    if (options.contextPct > threshold && effectiveLevel >= 3) {
      effectiveLevel = 1; // Downgrade to nudge
      reasons.push(`context_deferred: ${options.contextPct}% > ${threshold}% threshold`);
    }
  }

  // Step 4: Runtime capability cap
  const capEntry = FEATURE_CAPABILITY_MAP[normalizedFeature];
  if (capEntry) {
    // Determine runtime capabilities
    let hasHooks = false;
    let hasTaskTool = false;

    if (options.runtime) {
      // Explicit runtime flag
      hasHooks = options.runtime === 'claude-code' || options.runtime === 'full';
      hasTaskTool = options.runtime === 'claude-code' || options.runtime === 'full';
    } else {
      // Heuristic: check for .claude/settings.json with hooks
      try {
        const settingsPath = path.join(cwd, '.claude', 'settings.json');
        if (fs.existsSync(settingsPath)) {
          const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
          hasHooks = settings.hooks !== undefined;
          hasTaskTool = true; // Claude Code has task tool if settings exist
        }
      } catch {
        // settings.json not found or invalid -- assume constrained
      }
    }

    // Cap based on hook dependency
    if (capEntry.hook_dependent_above !== null && !hasHooks) {
      const cap = capEntry.hook_dependent_above;
      if (effectiveLevel > cap) {
        reasons.push(`runtime_capped: ${normalizedFeature} needs hooks above level ${cap}`);
        effectiveLevel = cap;
      }
    }

    // Cap based on task_tool dependency
    if (capEntry.task_tool_dependent && !hasTaskTool) {
      const taskToolCap = 2;
      if (effectiveLevel > taskToolCap) {
        reasons.push(`runtime_capped: ${normalizedFeature} needs task_tool above level ${taskToolCap}`);
        effectiveLevel = taskToolCap;
      }
    }
  }

  // Step 5: Fine-grained knobs (AUTO-03)
  const knobs = automation[normalizedFeature] || {};

  const result = {
    feature: normalizedFeature,
    configured: globalLevel,
    override: overrideValue,
    effective: effectiveLevel,
    reasons,
    knobs,
    level_names: { 0: 'manual', 1: 'nudge', 2: 'prompt', 3: 'auto' }
  };

  output(result, raw);
}

function cmdAutomationTrackEvent(cwd, feature, event, reason, raw) {
  if (!feature || !event) {
    error('Usage: automation track-event <feature> <fire|skip> [reason]');
  }
  if (event !== 'fire' && event !== 'skip') {
    error('Event must be "fire" or "skip"');
  }

  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!fs.existsSync(configPath)) {
    error('No .planning/config.json found.');
  }

  // Normalize feature name
  const normalizedFeature = feature.replace(/-/g, '_');

  // Read-modify-write with atomic write
  const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!projectConfig.automation) projectConfig.automation = {};
  if (!projectConfig.automation.stats) projectConfig.automation.stats = {};
  if (!projectConfig.automation.stats[normalizedFeature]) {
    projectConfig.automation.stats[normalizedFeature] = {
      fires: 0,
      skips: 0,
      last_triggered: null,
      last_skip_reason: null,
    };
  }

  const stats = projectConfig.automation.stats[normalizedFeature];
  if (event === 'fire') {
    stats.fires++;
    stats.last_triggered = new Date().toISOString();
  } else if (event === 'skip') {
    stats.skips++;
    stats.last_skip_reason = reason || 'unknown';
  }

  // Atomic write: write to tmp, then rename
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(projectConfig, null, 2) + '\n');
  fs.renameSync(tmpPath, configPath);

  output({ feature: normalizedFeature, event, stats }, raw);
}

// ─── Automation Lock/Unlock ──────────────────────────────────────────────────

function cmdAutomationLock(cwd, feature, options, raw) {
  if (!feature) {
    error('Usage: automation lock <feature> [--source <source>] [--ttl <seconds>]');
  }

  const normalizedFeature = feature.replace(/-/g, '_');
  const lockPath = path.join(cwd, '.planning', `.${normalizedFeature}.lock`);
  const ttl = options.ttl || 300;

  // Check for existing lock
  if (fs.existsSync(lockPath)) {
    const stat = fs.statSync(lockPath);
    const ageSeconds = Math.floor((Date.now() - stat.mtimeMs) / 1000);

    if (ageSeconds > ttl) {
      // Stale lock -- remove and proceed to acquire
      fs.unlinkSync(lockPath);
      const lockContent = {
        pid: process.pid,
        timestamp: new Date().toISOString(),
        trigger_source: options.source || 'unknown',
        ttl_seconds: ttl,
      };
      fs.writeFileSync(lockPath, JSON.stringify(lockContent, null, 2));
      output({ locked: false, acquired: true, stale_removed: true, stale_age_seconds: ageSeconds }, raw);
    } else {
      // Active lock -- report it
      let holder = {};
      try {
        holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      } catch (e) {
        holder = { error: 'could not parse lock file' };
      }
      output({ locked: true, holder, age_seconds: ageSeconds }, raw);
    }
  } else {
    // No lock exists -- acquire
    const lockContent = {
      pid: process.pid,
      timestamp: new Date().toISOString(),
      trigger_source: options.source || 'unknown',
      ttl_seconds: ttl,
    };
    fs.writeFileSync(lockPath, JSON.stringify(lockContent, null, 2));
    output({ locked: false, acquired: true }, raw);
  }
}

function cmdAutomationUnlock(cwd, feature, raw) {
  if (!feature) {
    error('Usage: automation unlock <feature>');
  }

  const normalizedFeature = feature.replace(/-/g, '_');
  const lockPath = path.join(cwd, '.planning', `.${normalizedFeature}.lock`);

  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    output({ released: true }, raw);
  } else {
    output({ released: false, reason: 'no_lock_found' }, raw);
  }
}

function cmdAutomationCheckLock(cwd, feature, options, raw) {
  if (!feature) {
    error('Usage: automation check-lock <feature> [--ttl <seconds>]');
  }

  const normalizedFeature = feature.replace(/-/g, '_');
  const lockPath = path.join(cwd, '.planning', `.${normalizedFeature}.lock`);
  const ttl = options.ttl || 300;

  if (!fs.existsSync(lockPath)) {
    output({ locked: false }, raw);
    return;
  }

  const stat = fs.statSync(lockPath);
  const ageSeconds = Math.floor((Date.now() - stat.mtimeMs) / 1000);

  let holder = {};
  try {
    holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch (e) {
    holder = { error: 'could not parse lock file' };
  }

  if (ageSeconds > ttl) {
    output({ locked: true, stale: true, age_seconds: ageSeconds, holder }, raw);
  } else {
    output({ locked: true, stale: false, age_seconds: ageSeconds, holder }, raw);
  }
}

// ─── Automation Regime Change ────────────────────────────────────────────────

function cmdAutomationRegimeChange(cwd, description, options, raw) {
  if (!description) {
    error('Usage: automation regime-change <description> [--impact <impact>] [--prior <prior-regime>]');
  }

  // KB path resolution: project-local primary, ~/.gsd/ fallback
  let kbDir = path.join(cwd, '.planning', 'knowledge');
  if (!fs.existsSync(kbDir)) {
    const globalKbDir = path.join(require('os').homedir(), '.gsd', 'knowledge');
    if (fs.existsSync(globalKbDir)) {
      kbDir = globalKbDir;
    }
    // If neither exists, use project-local and create it
  }

  // Build entry ID
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const slug = description.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 40).replace(/-$/, '');
  const entryId = `regime-${dateStr}-${slug}`;

  // Project name from cwd basename
  const projectName = path.basename(cwd).toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Signal directory
  const signalDir = path.join(kbDir, 'signals', projectName);
  fs.mkdirSync(signalDir, { recursive: true });

  const filePath = path.join(signalDir, `${entryId}.md`);
  const isoTimestamp = now.toISOString();
  const impact = options.impact || 'Not assessed';
  const prior = options.prior || 'Not recorded';

  const content = `---
id: ${entryId}
type: regime_change
project: ${projectName}
tags: [observation-regime, signal-collection, automation]
created: ${isoTimestamp}
status: active
---

# Regime Change: ${description}

## Change

${description}

## Expected Impact

${impact}

## Timestamp

${isoTimestamp}

## Prior Regime

${prior}
`;

  fs.writeFileSync(filePath, content);

  // Attempt to rebuild KB index
  try {
    const projectLocalScript = path.join(cwd, 'get-shit-done', 'bin', 'kb-rebuild-index.sh');
    const globalScript = path.join(require('os').homedir(), '.gsd', 'bin', 'kb-rebuild-index.sh');
    let rebuildScript = null;
    if (fs.existsSync(projectLocalScript)) {
      rebuildScript = projectLocalScript;
    } else if (fs.existsSync(globalScript)) {
      rebuildScript = globalScript;
    }
    if (rebuildScript) {
      execSync(`bash "${rebuildScript}"`, { cwd: cwd, timeout: 10000, stdio: 'pipe' });
    }
  } catch (e) {
    // Non-blocking: warn but don't fail
    process.stderr.write(`Warning: KB index rebuild failed: ${e.message}\n`);
  }

  output({ written: true, path: filePath, id: entryId }, raw);
}

// ─── Reflection Counter ──────────────────────────────────────────────────────

function cmdAutomationReflectionCounter(cwd, action, raw) {
  if (!action || !['increment', 'check', 'reset'].includes(action)) {
    error('Usage: automation reflection-counter <increment|check|reset>');
  }

  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!fs.existsSync(configPath)) {
    error('No .planning/config.json found.');
  }

  const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!projectConfig.automation) projectConfig.automation = {};
  if (!projectConfig.automation.reflection) {
    projectConfig.automation.reflection = {
      auto_reflect: false,
      threshold_phases: 3,
      min_signals: 5,
      phases_since_last_reflect: 0,
      last_reflect_at: null
    };
  }

  const reflection = projectConfig.automation.reflection;

  if (action === 'increment') {
    reflection.phases_since_last_reflect =
      (reflection.phases_since_last_reflect || 0) + 1;
  } else if (action === 'reset') {
    reflection.phases_since_last_reflect = 0;
    reflection.last_reflect_at = new Date().toISOString();
  }
  // 'check' action reads only -- no mutations

  // Atomic write (same pattern as track-event)
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(projectConfig, null, 2) + '\n');
  fs.renameSync(tmpPath, configPath);

  output({
    action,
    phases_since_last_reflect: reflection.phases_since_last_reflect,
    threshold_phases: reflection.threshold_phases || 3,
    min_signals: reflection.min_signals || 5,
    auto_reflect: reflection.auto_reflect || false,
    last_reflect_at: reflection.last_reflect_at
  }, raw);
}

// ─── Health Probes ────────────────────────────────────────────────────────────

/**
 * Resolve the knowledge base directory path.
 * Project-local (.planning/knowledge/) primary, user-global (~/.gsd/knowledge/) fallback.
 */
function resolveKBDir(cwd) {
  const localKB = path.join(cwd, '.planning', 'knowledge');
  const globalKB = path.join(require('os').homedir(), '.gsd', 'knowledge');
  if (fs.existsSync(localKB)) return localKB;
  if (fs.existsSync(globalKB)) return globalKB;
  return null;
}

/**
 * Find the latest regime_change entry in the signals directory.
 * Returns { id, created } or null if no regime_change found.
 */
function findLatestRegimeChange(kbDir) {
  const signalsDir = path.join(kbDir, 'signals');
  if (!fs.existsSync(signalsDir)) return null;

  let latestRegime = null;
  let latestDate = null;

  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Check if this is a regime_change entry
            const typeMatch = content.match(/^type:\s*regime_change/m);
            if (!typeMatch) continue;
            const createdMatch = content.match(/^created:\s*(.+)/m);
            if (!createdMatch) continue;
            const created = new Date(createdMatch[1].trim());
            if (isNaN(created.getTime())) continue;
            if (!latestDate || created > latestDate) {
              latestDate = created;
              const idMatch = content.match(/^id:\s*(.+)/m);
              latestRegime = {
                id: idMatch ? idMatch[1].trim() : entry.name.replace(/\.md$/, ''),
                created: created,
              };
            }
          } catch (e) {
            // Skip unparseable files (Pitfall 1)
          }
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  }

  scanDir(signalsDir);
  return latestRegime;
}

/**
 * Collect signal files within the current regime, categorized by lifecycle state.
 * Returns { detected: File[], resolved: File[], all: File[] }
 */
function collectRegimeSignals(kbDir, regimeStart) {
  const signalsDir = path.join(kbDir, 'signals');
  const detected = [];
  const resolved = [];
  const all = [];

  if (!fs.existsSync(signalsDir)) return { detected, resolved, all };

  function scanDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.name.endsWith('.md')) {
          try {
            const content = fs.readFileSync(fullPath, 'utf8');
            // Skip regime_change entries -- they're not regular signals
            const typeMatch = content.match(/^type:\s*(.+)/m);
            if (!typeMatch) continue;
            const type = typeMatch[1].trim();
            if (type === 'regime_change') continue;

            // Check if within regime
            const createdMatch = content.match(/^created:\s*(.+)/m);
            if (!createdMatch) continue;
            const created = new Date(createdMatch[1].trim());
            if (isNaN(created.getTime())) continue;
            if (regimeStart && created < regimeStart) continue;

            // Check lifecycle state
            const lifecycleMatch = content.match(/^lifecycle_state:\s*(.+)/m);
            const lifecycle = lifecycleMatch ? lifecycleMatch[1].trim() : 'detected';

            // Parse phase
            const phaseMatch = content.match(/^phase:\s*(.+)/m);
            const phaseVal = phaseMatch ? phaseMatch[1].trim() : 'unknown';

            // Parse severity
            const severityMatch = content.match(/^severity:\s*(.+)/m);
            const severity = severityMatch ? severityMatch[1].trim() : 'minor';

            const signalInfo = { path: fullPath, lifecycle, phase: phaseVal, severity, created };
            all.push(signalInfo);

            if (lifecycle === 'detected' || lifecycle === 'triaged') {
              detected.push(signalInfo);
            } else if (lifecycle === 'remediated' || lifecycle === 'verified' || lifecycle === 'closed') {
              resolved.push(signalInfo);
            }
          } catch (e) {
            // Skip unparseable files
          }
        }
      }
    } catch (e) {
      // Skip inaccessible directories
    }
  }

  scanDir(signalsDir);
  return { detected, resolved, all };
}

/**
 * health-probe signal-metrics (HEALTH-08)
 * Computes signal-to-resolution ratio within current observation regime.
 */
function cmdHealthProbeSignalMetrics(cwd, raw) {
  const kbDir = resolveKBDir(cwd);

  if (!kbDir) {
    const result = {
      probe_id: 'signal-metrics',
      checks: [{
        id: 'SIG-RATIO-01',
        description: 'Signal-to-resolution ratio within current regime',
        status: 'WARNING',
        detail: 'KB directory not found -- cannot compute signal metrics',
        data: { detected: 0, resolved: 0, ratio: 0, regime: null },
      }],
      dimension_contribution: {
        type: 'workflow',
        signals: { critical: 0, notable: 0, minor: 0 },
      },
    };
    if (raw) {
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
    console.log('Signal Metrics: KB directory not found');
    process.exit(0);
  }

  // Read threshold from config
  let threshold = 5.0;
  try {
    const configPath = path.join(cwd, '.planning', 'config.json');
    if (fs.existsSync(configPath)) {
      const projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (projectConfig.health_check && typeof projectConfig.health_check.resolution_ratio_threshold === 'number') {
        threshold = projectConfig.health_check.resolution_ratio_threshold;
      }
    }
  } catch (e) {
    // Use default threshold
  }

  // Find regime boundary
  const regime = findLatestRegimeChange(kbDir);
  const regimeStart = regime ? regime.created : null;

  // Collect signals within regime
  const signals = collectRegimeSignals(kbDir, regimeStart);

  // Compute ratio
  let ratio;
  if (signals.detected.length === 0 && signals.resolved.length === 0) {
    ratio = 0;
  } else if (signals.resolved.length === 0) {
    ratio = Infinity;
  } else {
    ratio = signals.detected.length / signals.resolved.length;
  }

  const status = (ratio <= threshold || ratio === 0) ? 'PASS' : 'WARNING';

  // Count severity distribution from all signals in regime
  const severityCounts = { critical: 0, notable: 0, minor: 0 };
  for (const sig of signals.all) {
    if (severityCounts[sig.severity] !== undefined) {
      severityCounts[sig.severity]++;
    } else {
      severityCounts.minor++;
    }
  }

  const result = {
    probe_id: 'signal-metrics',
    checks: [{
      id: 'SIG-RATIO-01',
      description: 'Signal-to-resolution ratio within current regime',
      status,
      detail: `Ratio ${signals.detected.length}:${signals.resolved.length} (threshold: ${threshold}:1)`,
      data: {
        detected: signals.detected.length,
        resolved: signals.resolved.length,
        ratio: ratio === Infinity ? 'Infinity' : ratio,
        regime: regime ? regime.id : null,
      },
    }],
    dimension_contribution: {
      type: 'workflow',
      signals: severityCounts,
    },
  };

  if (raw) {
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Human-readable output
  const ratioStr = ratio === Infinity ? 'Infinity' : ratio.toFixed(1);
  console.log(`Signal Metrics (HEALTH-08)`);
  console.log(`  Regime: ${regime ? regime.id : 'all history'}`);
  console.log(`  Detected (unresolved): ${signals.detected.length}`);
  console.log(`  Resolved: ${signals.resolved.length}`);
  console.log(`  Ratio: ${ratioStr}:1 (threshold: ${threshold}:1)`);
  console.log(`  Status: ${status}`);
  process.exit(0);
}

/**
 * health-probe signal-density (HEALTH-09)
 * Tracks signal accumulation rate per phase within current observation regime.
 */
function cmdHealthProbeSignalDensity(cwd, raw) {
  const kbDir = resolveKBDir(cwd);

  if (!kbDir) {
    const result = {
      probe_id: 'signal-density',
      checks: [{
        id: 'SIG-DENSITY-01',
        description: 'Signal density trend within current regime',
        status: 'WARNING',
        detail: 'KB directory not found -- cannot compute signal density',
        data: { phases: [], trend: 'stable' },
      }],
      dimension_contribution: {
        type: 'workflow',
        signals: { critical: 0, notable: 0, minor: 0 },
      },
    };
    if (raw) {
      process.stdout.write(JSON.stringify(result));
      process.exit(0);
    }
    console.log('Signal Density: KB directory not found');
    process.exit(0);
  }

  // Find regime boundary
  const regime = findLatestRegimeChange(kbDir);
  const regimeStart = regime ? regime.created : null;

  // Collect signals within regime
  const signals = collectRegimeSignals(kbDir, regimeStart);

  // Group by phase
  const phaseMap = {};
  for (const sig of signals.all) {
    const phaseVal = sig.phase || 'unknown';
    if (!phaseMap[phaseVal]) phaseMap[phaseVal] = 0;
    phaseMap[phaseVal]++;
  }

  // Build sorted densities array (sort by phase number)
  const densities = Object.entries(phaseMap)
    .map(([phaseVal, count]) => ({ phase: phaseVal, count }))
    .sort((a, b) => {
      const numA = parseFloat(a.phase) || 0;
      const numB = parseFloat(b.phase) || 0;
      return numA - numB;
    });

  // Determine trend from last 3 phases
  let trend = 'stable';
  if (densities.length >= 3) {
    const last3 = densities.slice(-3);
    const increasing = last3[0].count < last3[1].count && last3[1].count < last3[2].count;
    const decreasing = last3[0].count > last3[1].count && last3[1].count > last3[2].count;
    if (increasing) trend = 'increasing';
    else if (decreasing) trend = 'decreasing';
  }

  const status = (trend === 'stable' || trend === 'decreasing') ? 'PASS' : 'WARNING';

  // Count severity distribution
  const severityCounts = { critical: 0, notable: 0, minor: 0 };
  for (const sig of signals.all) {
    if (severityCounts[sig.severity] !== undefined) {
      severityCounts[sig.severity]++;
    } else {
      severityCounts.minor++;
    }
  }

  const result = {
    probe_id: 'signal-density',
    checks: [{
      id: 'SIG-DENSITY-01',
      description: 'Signal density trend within current regime',
      status,
      detail: `Trend: ${trend} across ${densities.length} phases`,
      data: { phases: densities, trend },
    }],
    dimension_contribution: {
      type: 'workflow',
      signals: severityCounts,
    },
  };

  if (raw) {
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Human-readable output
  console.log(`Signal Density (HEALTH-09)`);
  console.log(`  Regime: ${regime ? regime.id : 'all history'}`);
  console.log(`  Phases with signals: ${densities.length}`);
  for (const d of densities) {
    console.log(`    Phase ${d.phase}: ${d.count} signals`);
  }
  console.log(`  Trend: ${trend}`);
  console.log(`  Status: ${status}`);
  process.exit(0);
}

/**
 * health-probe automation-watchdog (HEALTH-07)
 * Verifies automation features are firing at expected cadence.
 */
function cmdHealthProbeAutomationWatchdog(cwd, raw) {
  // Read config for automation stats
  let projectConfig = {};
  const configPath = path.join(cwd, '.planning', 'config.json');
  try {
    if (fs.existsSync(configPath)) {
      projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) {
    // Empty config
  }

  const automationStats = (projectConfig.automation && projectConfig.automation.stats) || {};

  // Load feature manifest for expected features and their frequencies
  const manifest = loadManifest(cwd);
  const features = manifest ? manifest.features || {} : {};

  // Map config_key frequency from manifest to expected cadence
  const featureChecks = [];
  const now = Date.now();

  for (const [featureName, featureDef] of Object.entries(features)) {
    const configKey = featureDef.config_key || featureName;
    const schema = featureDef.schema || {};

    // Determine expected frequency from the feature's config or manifest
    let frequency = null;
    if (schema.frequency) {
      // Check config for actual value, otherwise use default
      const featureConfig = projectConfig[configKey] || {};
      frequency = featureConfig.frequency || schema.frequency.default;
    }

    if (!frequency) continue; // No frequency defined -- skip

    // Derive expected cadence in milliseconds
    let expectedCadenceMs;
    switch (frequency) {
      case 'every-phase':
        expectedCadenceMs = 6 * 3600 * 1000; // ~6 hours
        break;
      case 'on-resume':
        expectedCadenceMs = 24 * 3600 * 1000; // 24 hours
        break;
      case 'milestone-only':
        expectedCadenceMs = 7 * 24 * 3600 * 1000; // 7 days (relaxed)
        break;
      case 'explicit-only':
        continue; // No cadence expectation for explicit-only
      default:
        continue;
    }

    const stats = automationStats[configKey] || {};
    const lastTriggered = stats.last_triggered ? new Date(stats.last_triggered).getTime() : 0;
    const elapsed = now - lastTriggered;
    const staleThreshold = expectedCadenceMs * 3; // 3x expected cadence = stale

    let checkStatus;
    let detail;
    if (!stats.last_triggered) {
      checkStatus = 'WARNING';
      detail = `Feature "${configKey}" has never been triggered (expected cadence: ${frequency})`;
    } else if (elapsed > staleThreshold) {
      checkStatus = 'WARNING';
      const daysStale = Math.floor(elapsed / (24 * 3600 * 1000));
      detail = `Feature "${configKey}" last triggered ${daysStale} days ago (expected cadence: ${frequency})`;
    } else {
      checkStatus = 'PASS';
      const hoursAgo = Math.floor(elapsed / (3600 * 1000));
      detail = `Feature "${configKey}" last triggered ${hoursAgo}h ago (cadence: ${frequency})`;
    }

    featureChecks.push({
      id: `WATCHDOG-${configKey.toUpperCase().replace(/_/g, '-')}`,
      description: `Automation cadence for ${configKey}`,
      status: checkStatus,
      detail,
      data: {
        feature: configKey,
        frequency,
        last_triggered: stats.last_triggered || null,
        fires: stats.fires || 0,
      },
    });
  }

  // If no features with frequency were found, report clean state
  if (featureChecks.length === 0) {
    featureChecks.push({
      id: 'WATCHDOG-NONE',
      description: 'No automation features with cadence expectations found',
      status: 'PASS',
      detail: 'No features have a configured frequency requiring watchdog monitoring',
      data: {},
    });
  }

  const overallStatus = featureChecks.some(c => c.status === 'FAIL') ? 'FAIL'
    : featureChecks.some(c => c.status === 'WARNING') ? 'WARNING' : 'PASS';

  const result = {
    probe_id: 'automation-watchdog',
    checks: featureChecks,
    dimension_contribution: {
      type: 'infrastructure',
      signals: { critical: 0, notable: 0, minor: 0 },
    },
  };

  if (raw) {
    process.stdout.write(JSON.stringify(result));
    process.exit(0);
  }

  // Human-readable output
  console.log('Automation Watchdog (HEALTH-07)');
  for (const check of featureChecks) {
    console.log(`  [${check.status}] ${check.detail}`);
  }
  console.log(`  Overall: ${overallStatus}`);
  process.exit(0);
}

// ─── Sensors ──────────────────────────────────────────────────────────────────

function cmdSensorsList(cwd, raw) {
  // 1. Discover sensors from file system
  // Try .claude/agents/ first (runtime installed path), fall back to agents/ (dev path)
  let agentsDir = path.join(cwd, '.claude', 'agents');
  if (!fs.existsSync(agentsDir)) {
    agentsDir = path.join(cwd, 'agents');
  }
  if (!fs.existsSync(agentsDir)) {
    error('No agents directory found. Run install first.');
  }

  // Find all sensor agent spec files
  const allFiles = fs.readdirSync(agentsDir);
  const sensorFiles = allFiles.filter(f => /^gsd-.*-sensor\.md$/.test(f));

  if (sensorFiles.length === 0) {
    output({ sensors: [], message: 'No sensors discovered' }, raw);
    return;
  }

  // 2. Parse each sensor's frontmatter for contract metadata
  const sensors = sensorFiles.map(file => {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const fmObj = {};
    if (fmMatch) {
      const lines = fmMatch[1].split('\n');
      for (const line of lines) {
        const kvMatch = line.match(/^(\w[\w_]*):\s*(.+)$/);
        if (kvMatch) {
          let val = kvMatch[2].trim();
          if (val === 'null') val = null;
          else if (val === 'true') val = true;
          else if (val === 'false') val = false;
          else if (/^\d+$/.test(val)) val = parseInt(val, 10);
          fmObj[kvMatch[1]] = val;
        }
      }
    }
    const name = file.replace(/^gsd-/, '').replace(/-sensor\.md$/, '');
    return {
      name: fmObj.sensor_name || name,
      file,
      timeout_seconds: fmObj.timeout_seconds || 45,
      config_schema: fmObj.config_schema || null,
    };
  });

  // 3. Cross-reference config for enable/disable
  const configPath = path.join(cwd, '.planning', 'config.json');
  let projectConfig = {};
  if (fs.existsSync(configPath)) {
    try { projectConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')); } catch (e) { /* ignore */ }
  }
  const sensorConfig = (projectConfig.signal_collection && projectConfig.signal_collection.sensors) || {};
  const stats = (projectConfig.automation && projectConfig.automation.stats) || {};

  // 4. Build output rows
  const result = sensors.map(sensor => {
    const cfg = sensorConfig[sensor.name];
    const enabled = cfg && cfg.enabled !== undefined ? cfg.enabled : true;
    const sensorStats = stats['sensor_' + sensor.name];

    // Infer last_run_status from stats
    let lastStatus = 'never';
    if (sensorStats) {
      if (sensorStats.fires > 0 && !sensorStats.last_skip_reason) {
        lastStatus = 'success';
      } else if (sensorStats.last_skip_reason) {
        lastStatus = sensorStats.last_skip_reason;
      } else if (sensorStats.last_triggered) {
        lastStatus = 'success';
      }
    }

    return {
      name: sensor.name,
      enabled,
      timeout: sensor.timeout_seconds,
      last_run: (sensorStats && sensorStats.last_triggered) || 'never',
      last_status: lastStatus,
      signals: (sensorStats && sensorStats.last_signal_count !== undefined) ? sensorStats.last_signal_count : 'N/A',
      fires: (sensorStats && sensorStats.fires) || 0,
      skips: (sensorStats && sensorStats.skips) || 0,
    };
  });

  output({ sensors: result }, raw);
}

function cmdSensorsBlindSpots(cwd, sensorName, raw) {
  // Same discovery logic as cmdSensorsList
  let agentsDir = path.join(cwd, '.claude', 'agents');
  if (!fs.existsSync(agentsDir)) {
    agentsDir = path.join(cwd, 'agents');
  }
  if (!fs.existsSync(agentsDir)) {
    error('No agents directory found.');
  }

  const pattern = sensorName
    ? 'gsd-' + sensorName + '-sensor.md'
    : null;

  const allFiles = fs.readdirSync(agentsDir);
  const sensorFiles = allFiles.filter(f => {
    if (!/^gsd-.*-sensor\.md$/.test(f)) return false;
    if (pattern && f !== pattern) return false;
    return true;
  });

  if (sensorFiles.length === 0) {
    if (sensorName) {
      error('No sensor found matching "' + sensorName + '"');
    }
    output({ blind_spots: [], message: 'No sensors discovered' }, raw);
    return;
  }

  const blindSpots = sensorFiles.map(file => {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    const name = file.replace(/^gsd-/, '').replace(/-sensor\.md$/, '');
    const match = content.match(/<blind_spots>([\s\S]*?)<\/blind_spots>/);
    return {
      sensor: name,
      blind_spots: match ? match[1].trim() : 'No blind spots documented',
    };
  });

  output({ blind_spots: blindSpots }, raw);
}

// ─── CLI Router ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  // Optional cwd override for sandboxed subagents running outside project root.
  let cwd = process.cwd();
  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) error('Missing value for --cwd');
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    error(`Invalid --cwd: ${cwd}`);
  }

  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) args.splice(rawIndex, 1);

  const command = args[0];

  if (!command) {
    error('Usage: gsd-tools <command> [args] [--raw] [--cwd <path>]\nCommands: state, resolve-model, find-phase, commit, verify-summary, verify, frontmatter, template, generate-slug, current-timestamp, list-todos, verify-path-exists, config-ensure-section, init, manifest, backlog, automation, sensors, health-probe');
  }

  switch (command) {
    case 'state': {
      const subcommand = args[1];
      if (subcommand === 'json') {
        state.cmdStateJson(cwd, raw);
      } else if (subcommand === 'update') {
        state.cmdStateUpdate(cwd, args[2], args[3]);
      } else if (subcommand === 'get') {
        state.cmdStateGet(cwd, args[2], raw);
      } else if (subcommand === 'patch') {
        const patches = {};
        for (let i = 2; i < args.length; i += 2) {
          const key = args[i].replace(/^--/, '');
          const value = args[i + 1];
          if (key && value !== undefined) {
            patches[key] = value;
          }
        }
        state.cmdStatePatch(cwd, patches, raw);
      } else if (subcommand === 'advance-plan') {
        state.cmdStateAdvancePlan(cwd, raw);
      } else if (subcommand === 'record-metric') {
        const phaseIdx = args.indexOf('--phase');
        const planIdx = args.indexOf('--plan');
        const durationIdx = args.indexOf('--duration');
        const tasksIdx = args.indexOf('--tasks');
        const filesIdx = args.indexOf('--files');
        state.cmdStateRecordMetric(cwd, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
          plan: planIdx !== -1 ? args[planIdx + 1] : null,
          duration: durationIdx !== -1 ? args[durationIdx + 1] : null,
          tasks: tasksIdx !== -1 ? args[tasksIdx + 1] : null,
          files: filesIdx !== -1 ? args[filesIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'update-progress') {
        state.cmdStateUpdateProgress(cwd, raw);
      } else if (subcommand === 'add-decision') {
        const phaseIdx = args.indexOf('--phase');
        const summaryIdx = args.indexOf('--summary');
        const summaryFileIdx = args.indexOf('--summary-file');
        const rationaleIdx = args.indexOf('--rationale');
        const rationaleFileIdx = args.indexOf('--rationale-file');
        state.cmdStateAddDecision(cwd, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
          summary: summaryIdx !== -1 ? args[summaryIdx + 1] : null,
          summary_file: summaryFileIdx !== -1 ? args[summaryFileIdx + 1] : null,
          rationale: rationaleIdx !== -1 ? args[rationaleIdx + 1] : '',
          rationale_file: rationaleFileIdx !== -1 ? args[rationaleFileIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'add-blocker') {
        const textIdx = args.indexOf('--text');
        const textFileIdx = args.indexOf('--text-file');
        state.cmdStateAddBlocker(cwd, {
          text: textIdx !== -1 ? args[textIdx + 1] : null,
          text_file: textFileIdx !== -1 ? args[textFileIdx + 1] : null,
        }, raw);
      } else if (subcommand === 'resolve-blocker') {
        const textIdx = args.indexOf('--text');
        state.cmdStateResolveBlocker(cwd, textIdx !== -1 ? args[textIdx + 1] : null, raw);
      } else if (subcommand === 'record-session') {
        const stoppedIdx = args.indexOf('--stopped-at');
        const resumeIdx = args.indexOf('--resume-file');
        state.cmdStateRecordSession(cwd, {
          stopped_at: stoppedIdx !== -1 ? args[stoppedIdx + 1] : null,
          resume_file: resumeIdx !== -1 ? args[resumeIdx + 1] : 'None',
        }, raw);
      } else {
        state.cmdStateLoad(cwd, raw);
      }
      break;
    }

    case 'resolve-model': {
      commands.cmdResolveModel(cwd, args[1], raw);
      break;
    }

    case 'find-phase': {
      phase.cmdFindPhase(cwd, args[1], raw);
      break;
    }

    case 'commit': {
      const amend = args.includes('--amend');
      const filesIndex = args.indexOf('--files');
      // Collect all positional args between command name and first flag,
      // then join them -- handles both quoted ("multi word msg") and
      // unquoted (multi word msg) invocations from different shells
      const endIndex = filesIndex !== -1 ? filesIndex : args.length;
      const messageArgs = args.slice(1, endIndex).filter(a => !a.startsWith('--'));
      const message = messageArgs.join(' ') || undefined;
      const files = filesIndex !== -1 ? args.slice(filesIndex + 1).filter(a => !a.startsWith('--')) : [];
      commands.cmdCommit(cwd, message, files, raw, amend);
      break;
    }

    case 'verify-summary': {
      const summaryPath = args[1];
      const countIndex = args.indexOf('--check-count');
      const checkCount = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 2;
      verify.cmdVerifySummary(cwd, summaryPath, checkCount, raw);
      break;
    }

    case 'template': {
      const subcommand = args[1];
      if (subcommand === 'select') {
        template.cmdTemplateSelect(cwd, args[2], raw);
      } else if (subcommand === 'fill') {
        const templateType = args[2];
        const phaseIdx = args.indexOf('--phase');
        const planIdx = args.indexOf('--plan');
        const nameIdx = args.indexOf('--name');
        const typeIdx = args.indexOf('--type');
        const waveIdx = args.indexOf('--wave');
        const fieldsIdx = args.indexOf('--fields');
        template.cmdTemplateFill(cwd, templateType, {
          phase: phaseIdx !== -1 ? args[phaseIdx + 1] : null,
          plan: planIdx !== -1 ? args[planIdx + 1] : null,
          name: nameIdx !== -1 ? args[nameIdx + 1] : null,
          type: typeIdx !== -1 ? args[typeIdx + 1] : 'execute',
          wave: waveIdx !== -1 ? args[waveIdx + 1] : '1',
          fields: fieldsIdx !== -1 ? JSON.parse(args[fieldsIdx + 1]) : {},
        }, raw);
      } else {
        error('Unknown template subcommand. Available: select, fill');
      }
      break;
    }

    case 'frontmatter': {
      const subcommand = args[1];
      const file = args[2];
      if (subcommand === 'get') {
        const fieldIdx = args.indexOf('--field');
        frontmatter.cmdFrontmatterGet(cwd, file, fieldIdx !== -1 ? args[fieldIdx + 1] : null, raw);
      } else if (subcommand === 'set') {
        const fieldIdx = args.indexOf('--field');
        const valueIdx = args.indexOf('--value');
        frontmatter.cmdFrontmatterSet(cwd, file, fieldIdx !== -1 ? args[fieldIdx + 1] : null, valueIdx !== -1 ? args[valueIdx + 1] : undefined, raw);
      } else if (subcommand === 'merge') {
        const dataIdx = args.indexOf('--data');
        frontmatter.cmdFrontmatterMerge(cwd, file, dataIdx !== -1 ? args[dataIdx + 1] : null, raw);
      } else if (subcommand === 'validate') {
        const schemaIdx = args.indexOf('--schema');
        frontmatter.cmdFrontmatterValidate(cwd, file, schemaIdx !== -1 ? args[schemaIdx + 1] : null, raw);
      } else {
        error('Unknown frontmatter subcommand. Available: get, set, merge, validate');
      }
      break;
    }

    case 'verify': {
      const subcommand = args[1];
      if (subcommand === 'plan-structure') {
        verify.cmdVerifyPlanStructure(cwd, args[2], raw);
      } else if (subcommand === 'phase-completeness') {
        verify.cmdVerifyPhaseCompleteness(cwd, args[2], raw);
      } else if (subcommand === 'references') {
        verify.cmdVerifyReferences(cwd, args[2], raw);
      } else if (subcommand === 'commits') {
        verify.cmdVerifyCommits(cwd, args.slice(2), raw);
      } else if (subcommand === 'artifacts') {
        verify.cmdVerifyArtifacts(cwd, args[2], raw);
      } else if (subcommand === 'key-links') {
        verify.cmdVerifyKeyLinks(cwd, args[2], raw);
      } else {
        error('Unknown verify subcommand. Available: plan-structure, phase-completeness, references, commits, artifacts, key-links');
      }
      break;
    }

    case 'generate-slug': {
      commands.cmdGenerateSlug(args[1], raw);
      break;
    }

    case 'current-timestamp': {
      commands.cmdCurrentTimestamp(args[1] || 'full', raw);
      break;
    }

    case 'list-todos': {
      commands.cmdListTodos(cwd, args[1], raw);
      break;
    }

    case 'verify-path-exists': {
      commands.cmdVerifyPathExists(cwd, args[1], raw);
      break;
    }

    case 'config-ensure-section': {
      config.cmdConfigEnsureSection(cwd, raw);
      break;
    }

    case 'config-set': {
      config.cmdConfigSet(cwd, args[1], args[2], raw);
      break;
    }

    case 'config-get': {
      config.cmdConfigGet(cwd, args[1], raw);
      break;
    }

    case 'history-digest': {
      commands.cmdHistoryDigest(cwd, raw);
      break;
    }

    case 'phases': {
      const subcommand = args[1];
      if (subcommand === 'list') {
        const typeIndex = args.indexOf('--type');
        const phaseIndex = args.indexOf('--phase');
        const options = {
          type: typeIndex !== -1 ? args[typeIndex + 1] : null,
          phase: phaseIndex !== -1 ? args[phaseIndex + 1] : null,
          includeArchived: args.includes('--include-archived'),
        };
        phase.cmdPhasesList(cwd, options, raw);
      } else {
        error('Unknown phases subcommand. Available: list');
      }
      break;
    }

    case 'roadmap': {
      const subcommand = args[1];
      if (subcommand === 'get-phase') {
        roadmap.cmdRoadmapGetPhase(cwd, args[2], raw);
      } else if (subcommand === 'analyze') {
        roadmap.cmdRoadmapAnalyze(cwd, raw);
      } else if (subcommand === 'update-plan-progress') {
        roadmap.cmdRoadmapUpdatePlanProgress(cwd, args[2], raw);
      } else {
        error('Unknown roadmap subcommand. Available: get-phase, analyze, update-plan-progress');
      }
      break;
    }

    case 'requirements': {
      const subcommand = args[1];
      if (subcommand === 'mark-complete') {
        milestone.cmdRequirementsMarkComplete(cwd, args.slice(2), raw);
      } else {
        error('Unknown requirements subcommand. Available: mark-complete');
      }
      break;
    }

    case 'phase': {
      const subcommand = args[1];
      if (subcommand === 'next-decimal') {
        phase.cmdPhaseNextDecimal(cwd, args[2], raw);
      } else if (subcommand === 'add') {
        phase.cmdPhaseAdd(cwd, args.slice(2).join(' '), raw);
      } else if (subcommand === 'insert') {
        phase.cmdPhaseInsert(cwd, args[2], args.slice(3).join(' '), raw);
      } else if (subcommand === 'remove') {
        const forceFlag = args.includes('--force');
        phase.cmdPhaseRemove(cwd, args[2], { force: forceFlag }, raw);
      } else if (subcommand === 'complete') {
        phase.cmdPhaseComplete(cwd, args[2], raw);
      } else {
        error('Unknown phase subcommand. Available: next-decimal, add, insert, remove, complete');
      }
      break;
    }

    case 'milestone': {
      const subcommand = args[1];
      if (subcommand === 'complete') {
        const nameIndex = args.indexOf('--name');
        const archivePhases = args.includes('--archive-phases');
        // Collect --name value (everything after --name until next flag or end)
        let milestoneName = null;
        if (nameIndex !== -1) {
          const nameArgs = [];
          for (let i = nameIndex + 1; i < args.length; i++) {
            if (args[i].startsWith('--')) break;
            nameArgs.push(args[i]);
          }
          milestoneName = nameArgs.join(' ') || null;
        }
        milestone.cmdMilestoneComplete(cwd, args[2], { name: milestoneName, archivePhases }, raw);
      } else {
        error('Unknown milestone subcommand. Available: complete');
      }
      break;
    }

    case 'validate': {
      const subcommand = args[1];
      if (subcommand === 'consistency') {
        verify.cmdValidateConsistency(cwd, raw);
      } else if (subcommand === 'health') {
        const repairFlag = args.includes('--repair');
        verify.cmdValidateHealth(cwd, { repair: repairFlag }, raw);
      } else {
        error('Unknown validate subcommand. Available: consistency, health');
      }
      break;
    }

    case 'progress': {
      const subcommand = args[1] || 'json';
      commands.cmdProgressRender(cwd, subcommand, raw);
      break;
    }

    case 'stats': {
      const subcommand = args[1] || 'json';
      commands.cmdStats(cwd, subcommand, raw);
      break;
    }

    case 'todo': {
      const subcommand = args[1];
      if (subcommand === 'complete') {
        commands.cmdTodoComplete(cwd, args[2], raw);
      } else {
        error('Unknown todo subcommand. Available: complete');
      }
      break;
    }

    case 'scaffold': {
      const scaffoldType = args[1];
      const phaseIndex = args.indexOf('--phase');
      const nameIndex = args.indexOf('--name');
      const scaffoldOptions = {
        phase: phaseIndex !== -1 ? args[phaseIndex + 1] : null,
        name: nameIndex !== -1 ? args.slice(nameIndex + 1).join(' ') : null,
      };
      commands.cmdScaffold(cwd, scaffoldType, scaffoldOptions, raw);
      break;
    }

    case 'init': {
      const workflow = args[1];
      const includes = parseIncludeFlag(args);
      switch (workflow) {
        case 'execute-phase':
          cmdInitExecutePhase(cwd, args[2], includes, raw);
          break;
        case 'plan-phase':
          cmdInitPlanPhase(cwd, args[2], includes, raw);
          break;
        case 'new-project':
          cmdInitNewProject(cwd, raw);
          break;
        case 'new-milestone':
          cmdInitNewMilestone(cwd, raw);
          break;
        case 'quick':
          cmdInitQuick(cwd, args.slice(2).join(' '), raw);
          break;
        case 'resume':
          cmdInitResume(cwd, raw);
          break;
        case 'verify-work':
          cmdInitVerifyWork(cwd, args[2], raw);
          break;
        case 'phase-op':
          cmdInitPhaseOp(cwd, args[2], raw);
          break;
        case 'todos':
          cmdInitTodos(cwd, args[2], raw);
          break;
        case 'milestone-op':
          cmdInitMilestoneOp(cwd, raw);
          break;
        case 'map-codebase':
          cmdInitMapCodebase(cwd, raw);
          break;
        case 'progress':
          cmdInitProgress(cwd, includes, raw);
          break;
        default:
          error(`Unknown init workflow: ${workflow}\nAvailable: execute-phase, plan-phase, new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase, progress`);
      }
      break;
    }

    case 'phase-plan-index': {
      phase.cmdPhasePlanIndex(cwd, args[1], raw);
      break;
    }

    case 'state-snapshot': {
      state.cmdStateSnapshot(cwd, raw);
      break;
    }

    case 'summary-extract': {
      const summaryPath = args[1];
      const fieldsIndex = args.indexOf('--fields');
      const fields = fieldsIndex !== -1 ? args[fieldsIndex + 1].split(',') : null;
      commands.cmdSummaryExtract(cwd, summaryPath, fields, raw);
      break;
    }

    case 'websearch': {
      const query = args[1];
      const limitIdx = args.indexOf('--limit');
      const freshnessIdx = args.indexOf('--freshness');
      await commands.cmdWebsearch(query, {
        limit: limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 10,
        freshness: freshnessIdx !== -1 ? args[freshnessIdx + 1] : null,
      }, raw);
      break;
    }

    case 'manifest': {
      const subcommand = args[1];
      if (subcommand === 'diff-config') {
        cmdManifestDiffConfig(cwd, raw);
      } else if (subcommand === 'validate') {
        cmdManifestValidate(cwd, raw);
      } else if (subcommand === 'get-prompts') {
        const feature = args[2];
        cmdManifestGetPrompts(cwd, feature, raw);
      } else if (subcommand === 'apply-migration') {
        cmdManifestApplyMigration(cwd, raw);
      } else if (subcommand === 'log-migration') {
        cmdManifestLogMigration(cwd, raw);
      } else if (subcommand === 'auto-detect') {
        cmdManifestAutoDetect(cwd, raw);
      } else {
        error('Unknown manifest subcommand. Available: diff-config, validate, get-prompts, apply-migration, log-migration, auto-detect');
      }
      break;
    }

    case 'backlog': {
      const subcommand = args[1];
      if (subcommand === 'add') {
        const titleIdx = args.indexOf('--title');
        const tagsIdx = args.indexOf('--tags');
        const priorityIdx = args.indexOf('--priority');
        const themeIdx = args.indexOf('--theme');
        const sourceIdx = args.indexOf('--source');
        const globalFlag = args.includes('--global');
        cmdBacklogAdd(cwd, {
          title: titleIdx !== -1 ? args[titleIdx + 1] : null,
          tags: tagsIdx !== -1 ? args[tagsIdx + 1] : null,
          priority: priorityIdx !== -1 ? args[priorityIdx + 1] : 'MEDIUM',
          theme: themeIdx !== -1 ? args[themeIdx + 1] : null,
          source: sourceIdx !== -1 ? args[sourceIdx + 1] : 'command',
          global: globalFlag,
        }, raw);
      } else if (subcommand === 'list') {
        const priorityIdx = args.indexOf('--priority');
        const statusIdx = args.indexOf('--status');
        const tagsIdx = args.indexOf('--tags');
        const globalFlag = args.includes('--global');
        cmdBacklogList(cwd, {
          priority: priorityIdx !== -1 ? args[priorityIdx + 1] : null,
          status: statusIdx !== -1 ? args[statusIdx + 1] : null,
          tags: tagsIdx !== -1 ? args[tagsIdx + 1] : null,
          global: globalFlag,
        }, raw);
      } else if (subcommand === 'update') {
        const itemId = args[2];
        const priorityIdx = args.indexOf('--priority');
        const statusIdx = args.indexOf('--status');
        const themeIdx = args.indexOf('--theme');
        const tagsIdx = args.indexOf('--tags');
        const milestoneIdx = args.indexOf('--milestone');
        cmdBacklogUpdate(cwd, itemId, {
          priority: priorityIdx !== -1 ? args[priorityIdx + 1] : undefined,
          status: statusIdx !== -1 ? args[statusIdx + 1] : undefined,
          theme: themeIdx !== -1 ? args[themeIdx + 1] : undefined,
          tags: tagsIdx !== -1 ? args[tagsIdx + 1].split(',').map(t => t.trim()) : undefined,
          milestone: milestoneIdx !== -1 ? args[milestoneIdx + 1] : undefined,
        }, raw);
      } else if (subcommand === 'stats') {
        cmdBacklogStats(cwd, raw);
      } else if (subcommand === 'group') {
        const byIdx = args.indexOf('--by');
        const globalFlag = args.includes('--global');
        cmdBacklogGroup(cwd, byIdx !== -1 ? args[byIdx + 1] : 'theme', globalFlag, raw);
      } else if (subcommand === 'promote') {
        const itemId = args[2];
        const toIdx = args.indexOf('--to');
        const milestoneIdx = args.indexOf('--milestone');
        cmdBacklogPromote(cwd, itemId, toIdx !== -1 ? args[toIdx + 1] : null, milestoneIdx !== -1 ? args[milestoneIdx + 1] : null, raw);
      } else if (subcommand === 'index') {
        const globalFlag = args.includes('--global');
        cmdBacklogIndex(cwd, globalFlag, raw);
      } else {
        error('Unknown backlog subcommand. Available: add, list, update, stats, group, promote, index');
      }
      break;
    }

    case 'automation': {
      const subcommand = args[1];
      if (subcommand === 'resolve-level') {
        const feature = args[2];
        const contextPctIdx = args.indexOf('--context-pct');
        const runtimeIdx = args.indexOf('--runtime');
        const options = {
          contextPct: contextPctIdx !== -1 ? parseFloat(args[contextPctIdx + 1]) : undefined,
          runtime: runtimeIdx !== -1 ? args[runtimeIdx + 1] : undefined,
        };
        cmdAutomationResolveLevel(cwd, feature, options, raw);
      } else if (subcommand === 'track-event') {
        const feature = args[2];
        const event = args[3];
        const reason = args[4] || undefined;
        cmdAutomationTrackEvent(cwd, feature, event, reason, raw);
      } else if (subcommand === 'lock') {
        const feature = args[2];
        const sourceIdx = args.indexOf('--source');
        const ttlIdx = args.indexOf('--ttl');
        const options = {
          source: sourceIdx !== -1 ? args[sourceIdx + 1] : undefined,
          ttl: ttlIdx !== -1 ? parseInt(args[ttlIdx + 1], 10) : undefined,
        };
        cmdAutomationLock(cwd, feature, options, raw);
      } else if (subcommand === 'unlock') {
        const feature = args[2];
        cmdAutomationUnlock(cwd, feature, raw);
      } else if (subcommand === 'check-lock') {
        const feature = args[2];
        const ttlIdx = args.indexOf('--ttl');
        const options = {
          ttl: ttlIdx !== -1 ? parseInt(args[ttlIdx + 1], 10) : undefined,
        };
        cmdAutomationCheckLock(cwd, feature, options, raw);
      } else if (subcommand === 'regime-change') {
        const desc = args[2];
        const impactIdx = args.indexOf('--impact');
        const priorIdx = args.indexOf('--prior');
        const options = {
          impact: impactIdx !== -1 ? args[impactIdx + 1] : 'Not assessed',
          prior: priorIdx !== -1 ? args[priorIdx + 1] : 'Not recorded',
        };
        cmdAutomationRegimeChange(cwd, desc, options, raw);
      } else if (subcommand === 'reflection-counter') {
        const action = args[2];
        cmdAutomationReflectionCounter(cwd, action, raw);
      } else {
        error('Unknown automation subcommand. Available: resolve-level, track-event, lock, unlock, check-lock, regime-change, reflection-counter');
      }
      break;
    }

    case 'sensors': {
      const subcommand = args[1];
      if (subcommand === 'list') {
        cmdSensorsList(cwd, raw);
      } else if (subcommand === 'blind-spots') {
        const sensorName = args[2] || undefined;
        cmdSensorsBlindSpots(cwd, sensorName, raw);
      } else {
        error('Unknown sensors subcommand. Available: list, blind-spots');
      }
      break;
    }

    case 'health-probe': {
      const probeName = args[1];
      if (probeName === 'signal-metrics') {
        cmdHealthProbeSignalMetrics(cwd, raw);
      } else if (probeName === 'signal-density') {
        cmdHealthProbeSignalDensity(cwd, raw);
      } else if (probeName === 'automation-watchdog') {
        cmdHealthProbeAutomationWatchdog(cwd, raw);
      } else {
        error('Unknown health-probe. Available: signal-metrics, signal-density, automation-watchdog');
      }
      break;
    }

    default:
      error(`Unknown command: ${command}`);
  }
}

main();
