# Phase 25: Backlog System Core - Research

**Researched:** 2026-02-22
**Domain:** File-based backlog system with YAML frontmatter, CLI subcommands, two-tier storage, todo extension
**Confidence:** HIGH

## Summary

Phase 25 adds a structured backlog system to GSD that stores ideas as Markdown files with YAML frontmatter in a two-tier directory structure (`.planning/backlog/items/` for project-scoped, `~/.gsd/backlog/items/` for global). The implementation extends the existing `gsd-tools.js` CLI with a `backlog` subcommand family (add, list, group, update, promote, stats, index) following the exact same dispatch pattern used by Phase 24's `manifest` command. The existing `extractFrontmatter()` and `reconstructFrontmatter()` functions already handle all the data types needed (strings, arrays, nested objects). The `/gsd:add-todo` workflow gains optional `priority` and `source` fields, and existing todos auto-default missing fields during read operations -- no migration required.

The entire feature uses zero new dependencies. All storage is Markdown + YAML frontmatter (same as todos, signals, and lessons). The two-tier pattern mirrors the knowledge base (`~/.gsd/knowledge/` + project-local signals). The index.md generation follows the KB's `kb-rebuild-index.sh` pattern but implemented as a gsd-tools.js subcommand instead of a bash script for consistency with the rest of the backlog tooling.

**Primary recommendation:** Implement as 3 plans using TDD (tests-first) for Plans 01-02 (code in gsd-tools.js), with Plan 03 handling workflow .md file updates. Modify the SOURCE copy at `get-shit-done/bin/gsd-tools.js` (not the installed `.claude/` copy). Follow the Phase 24 manifest subcommand dispatch pattern exactly.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | N/A | File read/write/mkdir for backlog items | Already used throughout gsd-tools.js, zero dependencies |
| Node.js built-in `path` | N/A | Cross-platform path joining, `__dirname` resolution | Already used throughout gsd-tools.js |
| Node.js built-in `os` | N/A | `os.homedir()` for `~/.gsd/` resolution | Already used in gsd-tools.js (line ~592) |
| `extractFrontmatter()` | In-tree | Parse YAML frontmatter from Markdown files | Custom parser at gsd-tools.js:252, handles arrays, nested objects, all needed types |
| `reconstructFrontmatter()` | In-tree | Serialize frontmatter back to YAML string | Custom serializer at gsd-tools.js:327, handles arrays, nested objects |
| `generateSlugInternal()` | In-tree | Convert titles to URL-safe slugs | Already used for todos, phases, etc. at gsd-tools.js:3546 |
| `node:test` + `node:assert` | N/A | Test framework | Already used in gsd-tools.test.js, zero dependencies |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `loadConfig()` | Read `.planning/config.json` for `commit_docs` and other settings | In `cmdInitBacklog` compound command |
| `pathExistsInternal()` | Check directory existence without throwing | Verify backlog directories exist before operations |
| `cmdCommit()` | Git commit with `commit_docs` respect | After backlog item creation (via workflow, not direct CLI) |
| `output()` / `error()` | JSON output formatting and error reporting | All backlog commands use existing output convention |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom YAML frontmatter parser | `js-yaml` npm package | Would add a dependency; existing `extractFrontmatter()` handles all needed types. The custom parser is well-tested across 70+ plans worth of usage. No reason to add a dependency. |
| Bash script for index (like KB) | gsd-tools.js subcommand | KB's `kb-rebuild-index.sh` is bash, but all other backlog commands are in gsd-tools.js. Keeping index generation in JS ensures consistency and avoids shell portability issues (Phase 27 concern). Use gsd-tools.js. |
| Database (SQLite, JSON DB) | Markdown files | Backlog items are infrequently queried (<100 items typical), human-readable Markdown is inspectable by users, and the frontmatter pattern is proven across signals/lessons/todos. No database needed. |
| Directory-based status (like todos: pending/done) | Frontmatter `status` field | Research SUMMARY.md explicitly recommends status-based lifecycle via frontmatter, not directory movement. Supports multi-stage: captured/triaged/planned/done/deferred without creating many directories. |

## Architecture Patterns

### Recommended Directory Structure

```
.planning/
  backlog/
    items/
      2026-02-22-add-auth-token-refresh.md
      2026-02-22-improve-error-messages.md
    index.md                    # Auto-generated

~/.gsd/
  backlog/
    items/
      2026-02-22-cross-project-idea.md
    index.md                    # Auto-generated
```

### Pattern 1: Backlog Item File Format (BLOG-01)

**What:** Each backlog item is a Markdown file with YAML frontmatter containing structured metadata.
**When to use:** Every backlog item, both project-local and global.
**Example:**

```markdown
---
id: blog-2026-02-22-add-auth-token-refresh
title: Add auth token refresh
tags: [auth, security]
theme: authentication
priority: HIGH
status: captured
source: conversation
promoted_to: null
created: 2026-02-22T14:30:00.000Z
updated: 2026-02-22T14:30:00.000Z
project: get-shit-done-reflect
---

## Description

Token refresh is not handled when the auth token expires during a long-running session.

## Notes

Discussed during Phase 24 execution. Related files: src/auth/token.js
```

**ID format:** `blog-YYYY-MM-DD-slug` (mirrors KB signal format `sig-YYYY-MM-DD-slug`)
**Status values:** `captured` (new), `triaged` (reviewed), `planned` (assigned to milestone), `done` (completed), `deferred` (postponed)
**Priority values:** `HIGH`, `MEDIUM`, `LOW`
**Source values:** `command` (from /gsd:add-todo), `conversation` (from session context), `phase` (from phase work), `signal` (from signal review), `unknown` (legacy/default)

### Pattern 2: Subcommand Dispatch (BLOG-03)

**What:** Add `backlog` as a top-level command in gsd-tools.js main switch, with subcommands dispatched via if-else chain.
**When to use:** The standard pattern for all gsd-tools.js multi-action commands (state, frontmatter, verify, manifest all use this).
**Example:**

```javascript
// Source: get-shit-done/bin/gsd-tools.js — follows manifest command pattern at line 5039
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
    // ... filter args
    cmdBacklogList(cwd, filters, raw);
  } else if (subcommand === 'group') {
    cmdBacklogGroup(cwd, args[2] || 'theme', raw);
  } else if (subcommand === 'update') {
    cmdBacklogUpdate(cwd, args[2], updates, raw);
  } else if (subcommand === 'promote') {
    cmdBacklogPromote(cwd, args[2], target, raw);
  } else if (subcommand === 'stats') {
    cmdBacklogStats(cwd, raw);
  } else if (subcommand === 'index') {
    const globalFlag = args.includes('--global');
    cmdBacklogIndex(cwd, globalFlag, raw);
  } else {
    error('Unknown backlog subcommand. Available: add, list, group, update, promote, stats, index');
  }
  break;
}
```

### Pattern 3: Two-Tier Storage Resolution (BLOG-02)

**What:** Resolve backlog directory to either project-local or global based on `--global` flag, respecting `$GSD_HOME`.
**When to use:** Every backlog command that reads or writes items.
**Example:**

```javascript
// Source: follows KB pattern from kb-rebuild-index.sh line 6
function resolveBacklogDir(cwd, isGlobal) {
  if (isGlobal) {
    const gsdHome = process.env.GSD_HOME || path.join(require('os').homedir(), '.gsd');
    return path.join(gsdHome, 'backlog', 'items');
  }
  return path.join(cwd, '.planning', 'backlog', 'items');
}
```

### Pattern 4: Auto-Default Missing Fields (BLOG-05)

**What:** When reading todo files, supply default values for fields that don't exist in the frontmatter.
**When to use:** In `cmdListTodos` and `cmdInitTodos` when parsing existing todo files.
**Example:**

```javascript
// Source: extends existing frontmatter reading in cmdListTodos (gsd-tools.js:516)
const priorityMatch = content.match(/^priority:\s*(.+)$/m);
const sourceMatch = content.match(/^source:\s*(.+)$/m);
const statusMatch = content.match(/^status:\s*(.+)$/m);

todos.push({
  file,
  created: createdMatch ? createdMatch[1].trim() : 'unknown',
  title: titleMatch ? titleMatch[1].trim() : 'Untitled',
  area: todoArea,
  priority: priorityMatch ? priorityMatch[1].trim() : 'MEDIUM',   // BLOG-05 default
  source: sourceMatch ? sourceMatch[1].trim() : 'unknown',         // BLOG-05 default
  status: statusMatch ? statusMatch[1].trim() : 'pending',         // BLOG-05 default
  path: path.join('.planning', 'todos', 'pending', file),
});
```

### Pattern 5: Index Generation (BLOG-07)

**What:** Generate `index.md` in backlog directory by scanning all items and building a Markdown table.
**When to use:** After add, update, or promote operations; also available as standalone command.
**Example:**

```javascript
// Source: mirrors kb-rebuild-index.sh pattern but in JavaScript
function cmdBacklogIndex(cwd, isGlobal, raw) {
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
        created: (fm.created || '').split('T')[0],
      });
    }
  } catch {}

  // Sort by priority (HIGH first), then date (newest first)
  const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  items.sort((a, b) => (priorityOrder[a.priority] || 1) - (priorityOrder[b.priority] || 1)
    || b.created.localeCompare(a.created));

  const generated = new Date().toISOString();
  let md = `# Backlog Index\n\n**Generated:** ${generated}\n**Total items:** ${items.length}\n\n`;
  md += `| ID | Title | Priority | Status | Tags | Date |\n`;
  md += `|----|-------|----------|--------|------|------|\n`;
  for (const item of items) {
    md += `| ${item.id} | ${item.title} | ${item.priority} | ${item.status} | ${item.tags} | ${item.created} |\n`;
  }

  // Atomic write
  const tmpPath = indexPath + '.tmp';
  fs.writeFileSync(tmpPath, md, 'utf-8');
  fs.renameSync(tmpPath, indexPath);

  output({ generated, total: items.length, path: indexPath }, raw, `Index rebuilt: ${items.length} items`);
}
```

### Anti-Patterns to Avoid

- **Replacing the todo system with backlog:** BLOG-06 is explicit -- STATE.md `### Pending Todos` stays as-is. Backlog is a SEPARATE system that coexists. Todos are quick captures; backlog is structured idea management.
- **Directory-based status:** Todos use `pending/` and `done/` directories. Backlog uses `status` in frontmatter. Do NOT create `backlog/captured/`, `backlog/planned/`, etc. All items stay in `backlog/items/` with status as metadata.
- **Full YAML parser:** The existing `extractFrontmatter()` is a purpose-built subset parser. Do NOT replace it with a full YAML library. It handles all needed types (strings, arrays, nested objects) and has been battle-tested across 70+ plans.
- **Modifying the installed copy:** Phase 24 made changes to `get-shit-done/bin/gsd-tools.js` (source), NOT `.claude/get-shit-done/bin/gsd-tools.js` (installed). All code changes must go in the source copy. The installed copy is a deployment artifact.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slug generation | Custom slug function | `generateSlugInternal()` at gsd-tools.js:3546 | Already handles all edge cases, used for todos/phases |
| Frontmatter parsing | New YAML parser | `extractFrontmatter()` at gsd-tools.js:252 | Handles arrays, nested objects, string quoting |
| Frontmatter writing | Manual string building | `reconstructFrontmatter()` at gsd-tools.js:327 | Handles array formatting, quoting special chars |
| JSON output formatting | `console.log` | `output(result, raw, rawValue)` at gsd-tools.js:466 | Respects `--raw` flag convention |
| Path existence checks | `fs.existsSync` | `pathExistsInternal(cwd, path)` at gsd-tools.js:3536 | Catches exceptions, returns boolean |
| Home directory resolution | Hardcoded `$HOME` | `require('os').homedir()` + `$GSD_HOME` env check | Cross-platform, follows KB convention |
| Atomic file writes | Direct `writeFileSync` | Write to `.tmp` then `renameSync` | Same-filesystem rename is atomic; KB index and Phase 24 `atomicWriteJson` use this pattern |
| Git commits | Raw `execSync('git ...')` | `cmdCommit()` / gsd-tools.js commit command | Respects `commit_docs` config, handles gitignore |
| Timestamp generation | `new Date().toString()` | `new Date().toISOString()` | Consistent ISO 8601 format used everywhere |

**Key insight:** The codebase already contains every primitive needed for the backlog system. The implementation is assembling existing pieces (frontmatter CRUD, slug generation, path resolution, atomic writes, output formatting) into a new command family. No new primitives are needed.

## Common Pitfalls

### Pitfall 1: Source vs Installed Copy Confusion
**What goes wrong:** Changes made to `.claude/get-shit-done/bin/gsd-tools.js` (installed copy) get overwritten on next install. Tests pass locally but feature disappears after update.
**Why it happens:** The repo has TWO copies of gsd-tools.js. The source is at `get-shit-done/bin/gsd-tools.js` (5065 lines). The installed copy is at `.claude/get-shit-done/bin/gsd-tools.js` (4597 lines, older -- missing Phase 24 manifest commands).
**How to avoid:** ALL code changes go to `get-shit-done/bin/gsd-tools.js` and `get-shit-done/bin/gsd-tools.test.js`. Test files are co-located with source at `get-shit-done/bin/gsd-tools.test.js`.
**Warning signs:** If a test references `.claude/get-shit-done/`, it's targeting the wrong copy.

### Pitfall 2: Backlog Replaces Todo System
**What goes wrong:** Refactoring todos to use backlog storage breaks STATE.md rendering, resume-work, check-todos, and other readers.
**Why it happens:** Research SUMMARY.md pitfall #1: "Consolidating these loses either the quick-reference property (STATE.md) or structured detail (todo files)."
**How to avoid:** Backlog is a SEPARATE system. Todos remain in `.planning/todos/`. Backlog lives in `.planning/backlog/`. BLOG-06 explicitly preserves STATE.md `### Pending Todos`. The only todo-system change is adding optional fields to `add-todo.md` (BLOG-04) and auto-defaulting missing fields during reads (BLOG-05).
**Warning signs:** Any code that moves files between `todos/` and `backlog/`, or removes the `### Pending Todos` section.

### Pitfall 3: Global Directory Not Created
**What goes wrong:** `backlog add --global` fails because `~/.gsd/backlog/items/` doesn't exist.
**Why it happens:** The installer creates `~/.gsd/knowledge/` but not `~/.gsd/backlog/`. The backlog directory is new.
**How to avoid:** Every command that writes to a backlog directory must `fs.mkdirSync(dir, { recursive: true })` first. This is idempotent and safe. The KB's `kb-create-dirs.sh` uses the same pattern.
**Warning signs:** `ENOENT` errors in tests when writing global backlog items.

### Pitfall 4: Frontmatter Array Parsing Edge Cases
**What goes wrong:** Tags stored as `tags: [auth, security]` parse correctly, but tags stored as YAML list items (`tags:\n  - auth\n  - security`) may not.
**Why it happens:** The custom `extractFrontmatter()` parser handles both inline arrays (`[a, b]`) and YAML list items (`- a`), but the behavior with mixed formats or empty arrays needs testing.
**How to avoid:** Write explicit tests for both array formats. Use inline format `[a, b]` for backlog items (consistent with KB signals). The `reconstructFrontmatter()` function already outputs inline format for short arrays (line 334: arrays with <= 3 items and < 60 chars use inline).
**Warning signs:** Tags showing as strings instead of arrays, or empty arrays parsing as empty objects.

### Pitfall 5: Missing `--raw` Flag Support
**What goes wrong:** Backlog commands return JSON when called from shell scripts, breaking workflow integration.
**Why it happens:** Forgetting to pass `raw` parameter through to `output()` function.
**How to avoid:** Every `cmd*` function must accept `raw` as final parameter and pass it to `output()`. The `--raw` flag is parsed at the top of `main()` (gsd-tools.js:4210) and passed through.
**Warning signs:** Tests calling `runGsdTools()` getting JSON when expecting raw output, or vice versa.

### Pitfall 6: ID Collision for Same-Day Items
**What goes wrong:** Two backlog items created on the same day with similar titles get the same filename/ID.
**Why it happens:** ID format `blog-YYYY-MM-DD-slug` may produce duplicates if slugs collide.
**How to avoid:** Check for existing files before writing. If collision, append a numeric suffix (e.g., `blog-2026-02-22-add-auth-2`). The todo system avoids this because `${date}-${slug}.md` filenames are date+title based, and same-day same-title todos are caught by duplicate detection in add-todo.md.
**Warning signs:** `EEXIST` errors or silently overwriting existing backlog items.

## Code Examples

### Backlog Add Command Implementation

```javascript
// Source: new function following cmdTodoComplete pattern (gsd-tools.js:3388)
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
  const frontmatter = {
    id,
    title,
    tags: tagArray,
    theme: theme || null,
    priority: (priority || 'MEDIUM').toUpperCase(),
    status: 'captured',
    source: source || 'command',
    promoted_to: null,
    created: now.toISOString(),
    updated: now.toISOString(),
  };

  // Build file content
  const fmStr = reconstructFrontmatter(frontmatter);
  const content = `---\n${fmStr}\n---\n\n## Description\n\n_No description provided._\n`;

  fs.writeFileSync(fullPath, content, 'utf-8');

  output({
    created: true,
    id,
    file: filename,
    path: fullPath,
    global: isGlobal || false,
  }, raw, id);
}
```

### Backlog List with Filtering

```javascript
// Source: new function following cmdListTodos pattern (gsd-tools.js:516)
function cmdBacklogList(cwd, filters, raw) {
  const { priority, status, tags, global: isGlobal } = filters;
  const itemsDir = resolveBacklogDir(cwd, isGlobal);

  let items = [];
  try {
    const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(itemsDir, file), 'utf-8');
      const fm = extractFrontmatter(content);

      // Apply filters
      if (priority && (fm.priority || 'MEDIUM') !== priority.toUpperCase()) continue;
      if (status && (fm.status || 'captured') !== status) continue;
      if (tags) {
        const filterTags = tags.split(',').map(t => t.trim());
        const itemTags = Array.isArray(fm.tags) ? fm.tags : [];
        if (!filterTags.some(ft => itemTags.includes(ft))) continue;
      }

      items.push({
        id: fm.id || file.replace('.md', ''),
        title: fm.title || 'Untitled',
        priority: fm.priority || 'MEDIUM',
        status: fm.status || 'captured',
        tags: Array.isArray(fm.tags) ? fm.tags : [],
        theme: fm.theme || null,
        source: fm.source || 'unknown',
        created: fm.created || 'unknown',
        file,
      });
    }
  } catch {}

  output({ count: items.length, items }, raw, items.length.toString());
}
```

### Backlog Stats Command

```javascript
// Source: new function
function cmdBacklogStats(cwd, raw) {
  // Collect from both project-local and global
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
```

### Test Pattern for Backlog Commands

```javascript
// Source: follows gsd-tools.test.js pattern (e.g., todo complete tests at line 1892)
describe('backlog add command', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('creates backlog item with required fields', () => {
    const result = runGsdTools(
      'backlog add --title "Add auth refresh" --tags "auth,security" --priority HIGH',
      tmpDir
    );
    assert.ok(result.success, `Command failed: ${result.error}`);

    const output = JSON.parse(result.output);
    assert.ok(output.created);
    assert.ok(output.id.startsWith('blog-'));

    // Verify file exists
    const itemsDir = path.join(tmpDir, '.planning', 'backlog', 'items');
    const files = fs.readdirSync(itemsDir);
    assert.strictEqual(files.length, 1);

    // Verify frontmatter
    const content = fs.readFileSync(path.join(itemsDir, files[0]), 'utf-8');
    assert.ok(content.includes('title: Add auth refresh'));
    assert.ok(content.includes('priority: HIGH'));
    assert.ok(content.includes('tags: [auth, security]'));
  });

  test('--global flag writes to ~/.gsd/backlog/items/', () => {
    // Use GSD_HOME env var to point to temp dir for testing
    const gsdHome = path.join(tmpDir, '.gsd-test');
    const result = runGsdTools(
      'backlog add --title "Global idea" --global',
      tmpDir,
      { env: { ...process.env, GSD_HOME: gsdHome } }
    );
    assert.ok(result.success, `Command failed: ${result.error}`);

    const globalItemsDir = path.join(gsdHome, 'backlog', 'items');
    assert.ok(fs.existsSync(globalItemsDir), 'global items dir should exist');
    const files = fs.readdirSync(globalItemsDir);
    assert.strictEqual(files.length, 1);
  });
});
```

**Note on testing `--global`:** Tests must use `GSD_HOME` environment variable to redirect global storage to a temp directory, avoiding writes to the real `~/.gsd/`. The `runGsdTools` helper may need an `env` option to support this. The KB infrastructure tests at `tests/integration/kb-infrastructure.test.js` use a similar pattern.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flat bullets in STATE.md | Structured todo files in `todos/pending/` | v1.12 | Ideas have title, area, files metadata |
| No global idea storage | Global KB at `~/.gsd/knowledge/` | v1.14 (Phase 14) | Cross-project knowledge survives project archival |
| Hardcoded config fields | Manifest-driven config (Phase 24) | v1.15 | New features self-declare config needs |
| Bash KB index script | gsd-tools.js subcommands | Partial (KB still bash) | Phase 25 backlog index will be JS-native |

**Existing code to extend (not replace):**
- `cmdListTodos` (gsd-tools.js:516) -- add priority/source/status field extraction with defaults
- `cmdInitTodos` (gsd-tools.js:3951) -- add priority/source/status fields to todo inventory
- `add-todo.md` workflow -- add optional priority/source fields to frontmatter template
- Main switch (gsd-tools.js:~5060) -- add `case 'backlog'` before `default`

## Open Questions

1. **Should `backlog add` auto-regenerate `index.md`?**
   - What we know: KB index is regenerated by explicit `kb-rebuild-index.sh` script. The requirements say `backlog index` is a separate subcommand.
   - What's unclear: Should `add`/`update`/`promote` automatically call `index` after each operation, or leave it to the caller?
   - Recommendation: Auto-regenerate after `add`, `update`, and `promote` for consistency. It's a lightweight operation (read all items, write one file). If it causes performance issues with many items, can be made opt-out later. This matches how the DB pattern of auto-updating indexes works.

2. **Should `backlog group` use `theme` field, `tags` field, or both?**
   - What we know: Requirements say "clusters items by theme/tags". The `theme` field is a single string (e.g., "authentication"). Tags are an array.
   - What's unclear: Whether grouping by theme and grouping by tags should be separate modes or combined.
   - Recommendation: Accept a `--by` flag: `backlog group --by theme` (default) or `backlog group --by tags`. Theme groups items by their explicit theme field. Tags groups items by tag overlap (items sharing tags appear together). Both are simple to implement.

3. **Should `backlog promote` take a target requirement ID or auto-generate one?**
   - What we know: BLOG-03 lists `promote` as a subcommand. BINT-02 (Phase 26) says selected items updated to `status: planned, milestone: vX.Y` with `promoted_to` linking to requirement ID.
   - What's unclear: Whether `promote` in Phase 25 should be a full implementation or a basic status change that Phase 26 extends.
   - Recommendation: Phase 25's `promote` should accept an optional `--to <id>` argument and update `status: planned` + `promoted_to: <id>`. This is the write operation; Phase 26 handles the workflow integration (how promote gets called during milestone planning). Keep Phase 25's promote simple.

4. **How should `--global` interact with `backlog list` and `backlog stats`?**
   - What we know: `list` with `--global` should show global items. `stats` shows counts from both tiers.
   - What's unclear: Should `list` without `--global` show only project-local items, or both? Should there be a `--all` flag?
   - Recommendation: `list` defaults to project-local only. `list --global` shows global only. `stats` always shows both tiers with separate counts. A future `--all` flag could combine, but keep it simple for Phase 25.

## Recommended Plan Structure

### Plan 01 (TDD): Core Backlog CRUD + Todo Auto-Defaults
**Requirements:** BLOG-01, BLOG-03 (add, list, update, stats), BLOG-05
**Files:** `get-shit-done/bin/gsd-tools.js`, `get-shit-done/bin/gsd-tools.test.js`
**Scope:**
- `resolveBacklogDir()` helper function
- `readBacklogItems()` shared reader function
- `backlog add` command with all frontmatter fields
- `backlog list` command with filtering by priority, status, tags
- `backlog update` command for modifying frontmatter fields
- `backlog stats` command showing counts by status and priority
- Extend `cmdListTodos` and `cmdInitTodos` to read/default priority, source, status (BLOG-05)
- Tests first, then implementation

### Plan 02 (TDD): Grouping, Promote, Global, and Index
**Requirements:** BLOG-02, BLOG-03 (group, promote, index), BLOG-07
**Files:** `get-shit-done/bin/gsd-tools.js`, `get-shit-done/bin/gsd-tools.test.js`
**Scope:**
- `backlog group` command with `--by theme` and `--by tags`
- `backlog promote` command updating status + promoted_to
- `--global` flag support for all commands
- `backlog index` command generating `index.md`
- Auto-regeneration of index after add/update/promote
- Tests first, then implementation

### Plan 03: Workflow Updates
**Requirements:** BLOG-04, BLOG-06
**Files:** `get-shit-done/workflows/add-todo.md`, `commands/gsd/add-todo.md`
**Scope:**
- Extend `add-todo.md` workflow to accept optional `priority` and `source` fields
- Update frontmatter template in `create_file` step to include new fields
- Verify STATE.md `### Pending Todos` section still works correctly
- No code changes -- workflow instruction files only

## Sources

### Primary (HIGH confidence)
- `get-shit-done/bin/gsd-tools.js` (5065 lines) -- source of truth for CLI subcommand patterns, frontmatter parsing, slug generation, path resolution
- `get-shit-done/bin/gsd-tools.test.js` (2033 lines) -- testing patterns, temp directory setup, `runGsdTools` helper
- `.planning/REQUIREMENTS.md` -- BLOG-01 through BLOG-07 requirement specifications
- `.planning/ROADMAP.md` -- Phase 25 success criteria, Phase 26 downstream requirements
- `.planning/research/SUMMARY.md` -- Architecture decisions: status-based lifecycle, two-tier storage, extend-not-replace
- `~/.gsd/knowledge/index.md` -- KB index format to mirror
- `~/.gsd/bin/kb-rebuild-index.sh` -- Index generation pattern (bash; backlog version will be JS)
- `.planning/todos/pending/` -- Current todo frontmatter format (created, title, area, files)
- `get-shit-done/workflows/add-todo.md` -- Current add-todo workflow steps

### Secondary (MEDIUM confidence)
- `.planning/phases/24-manifest-driven-config-migration/24-01-PLAN.md` -- TDD approach pattern for new gsd-tools.js commands
- `.planning/phases/14-knowledge-base-migration/14-RESEARCH.md` -- Two-tier KB migration pattern, symlink bridge approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; all patterns exist in codebase
- Architecture: HIGH -- two-tier storage, frontmatter CRUD, subcommand dispatch are all proven patterns
- Pitfalls: HIGH -- documented from v1.14 data loss experience and research SUMMARY.md
- Code examples: HIGH -- based on reading actual source code patterns, not training data

**Research date:** 2026-02-22
**Valid until:** 2026-03-22 (stable domain -- no external dependencies to drift)
