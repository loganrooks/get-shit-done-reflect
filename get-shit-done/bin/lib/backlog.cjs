/**
 * Backlog -- backlog item CRUD, grouping, promotion, and index management
 */

const fs = require('fs');
const path = require('path');
const { error, output, generateSlugInternal } = require('./core.cjs');
const frontmatter = require('./frontmatter.cjs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
        const fm = frontmatter.extractFrontmatter(content);
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
      const fm = frontmatter.extractFrontmatter(content);
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

// ─── Commands ─────────────────────────────────────────────────────────────────

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

  const fmStr = frontmatter.reconstructFrontmatter(fmObj);
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
      const fm = frontmatter.extractFrontmatter(content);
      if (fm.id === itemId) {
        targetFile = file;
        targetPath = path.join(itemsDir, file);
        break;
      }
    }
  } catch {}

  if (!targetPath) { error(`Backlog item not found: ${itemId}`); }

  const content = fs.readFileSync(targetPath, 'utf-8');
  const fm = frontmatter.extractFrontmatter(content);

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
  const fmStr = frontmatter.reconstructFrontmatter(fm);
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
      const fm = frontmatter.extractFrontmatter(content);
      if (fm.id === itemId) {
        targetFile = file;
        targetPath = path.join(itemsDir, file);
        break;
      }
    }
  } catch {}

  if (!targetPath) { error(`Backlog item not found: ${itemId}`); }

  const content = fs.readFileSync(targetPath, 'utf-8');
  const fm = frontmatter.extractFrontmatter(content);

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
  const fmStr = frontmatter.reconstructFrontmatter(fm);
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

function cmdBacklogIndex(cwd, isGlobal, raw) {
  const result = regenerateBacklogIndex(cwd, isGlobal);
  output(result, raw, `Index rebuilt: ${result.total} items`);
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  cmdBacklogAdd,
  cmdBacklogList,
  cmdBacklogUpdate,
  cmdBacklogStats,
  cmdBacklogGroup,
  cmdBacklogPromote,
  cmdBacklogIndex,
};
