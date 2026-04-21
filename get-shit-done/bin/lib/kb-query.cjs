/**
 * KB Query -- Read-only structured filter + FTS5 full-text search (Phase 59).
 *
 * Ships two non-mutating verbs:
 *   - cmdKbQuery(cwd, options, raw):  structured AND-filter over signals
 *                                     (severity / lifecycle / project / tag / since)
 *   - cmdKbSearch(cwd, query, options, raw):  FTS5 MATCH over signal_fts,
 *                                             joined back to signals for metadata
 *
 * Both verbs degrade to a `grep` fallback over .planning/knowledge/signals/**\/*.md
 * when kb.db is absent (fresh clone path). The fallback is POSIX grep, not rg --
 * ripgrep is not guaranteed to be on $PATH (see 59-RESEARCH.md Pitfall 9).
 *
 * Dependencies on ./kb.cjs:
 *   - getKbDir, getDbPath:  path resolution helpers (re-require instead of dup).
 *   - getDbSync:            lazy node:sqlite loader (Node >= 22.5.0 gate).
 * We deliberately reuse these rather than duplicating the small guard block --
 * there is no circular import risk because kb.cjs does not import kb-query.cjs.
 *
 * Scope discipline: read-only per 59-02-PLAN truths. KB-05 dual-write invariant
 * is trivially preserved -- nothing writes here. Mutating edge verbs live in
 * Plan 04's kb-transition / kb-link-write surface.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { output } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
// Reuse -- do not reimplement -- path resolution and the lazy sqlite gate.
const kb = require('./kb.cjs');

// ─── Option parsing ─────────────────────────────────────────────────────────

/**
 * Extract kb query / kb search options from a raw arg slice (post-subcommand).
 * Supported flags (AND semantics across all filters -- boolean operators are
 * deferred to KB-16 per research §Genuine gaps):
 *
 *   --severity  <critical|notable|minor>
 *   --lifecycle <detected|triaged|blocked|remediated|verified|invalidated>
 *   --project   <slug>
 *   --tag       <tag>        (JOIN signal_tags)
 *   --since     <YYYY-MM-DD> (lexical compare against signals.created)
 *   --limit     <N>          (default 50 for query, 25 for search)
 *   --format    json         (alias: --raw)
 */
function parseKbQueryOptions(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const take = () => {
      const v = args[i + 1];
      i++;
      return v;
    };
    if (arg === '--severity') opts.severity = take();
    else if (arg === '--lifecycle') opts.lifecycle = take();
    else if (arg === '--project') opts.project = take();
    else if (arg === '--tag') opts.tag = take();
    else if (arg === '--since') opts.since = take();
    else if (arg === '--limit') opts.limit = parseInt(take(), 10);
    else if (arg === '--format') opts.format = take();
    else if (arg === '--raw') opts.raw = true;
  }
  return opts;
}

// ─── kb query (structured filter) ───────────────────────────────────────────

const QUERY_COLUMNS = ['id', 'severity', 'lifecycle_state', 'project', 'created'];

function cmdKbQuery(cwd, options, raw) {
  const dbPath = kb.getDbPath(cwd);
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 50;
  const asJson = raw || options.raw || options.format === 'json';

  if (!fs.existsSync(dbPath)) {
    return fallbackGrepQuery(cwd, options, asJson, { limit });
  }

  const DatabaseSync = kb.getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });

  const where = [];
  const params = [];
  if (options.severity) { where.push('s.severity = ?'); params.push(options.severity); }
  if (options.lifecycle) { where.push('s.lifecycle_state = ?'); params.push(options.lifecycle); }
  if (options.project) { where.push('s.project = ?'); params.push(options.project); }
  if (options.since) { where.push('s.created >= ?'); params.push(options.since); }

  let sql;
  if (options.tag) {
    // JOIN signal_tags when --tag is present. DISTINCT guards against the row
    // multiplication that would otherwise occur if a signal somehow carries
    // the same tag twice (primary key prevents this at rebuild time, but the
    // DISTINCT keeps the query robust against schema drift).
    sql = `
      SELECT DISTINCT s.id, s.severity, s.lifecycle_state, s.project, s.created
      FROM signals s
      JOIN signal_tags t ON t.signal_id = s.id
      WHERE t.tag = ?
    `;
    params.unshift(options.tag);
    if (where.length > 0) sql += ' AND ' + where.join(' AND ');
  } else {
    sql = `
      SELECT s.id, s.severity, s.lifecycle_state, s.project, s.created
      FROM signals s
    `;
    if (where.length > 0) sql += ' WHERE ' + where.join(' AND ');
  }
  sql += ' ORDER BY s.created DESC, s.id ASC LIMIT ?';
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  db.close();

  const queryParams = {};
  for (const key of ['severity', 'lifecycle', 'project', 'tag', 'since']) {
    if (options[key] !== undefined) queryParams[key] = options[key];
  }
  queryParams.limit = limit;

  if (asJson) {
    output({ query_params: queryParams, results: rows, fallback: null }, true);
    return;
  }

  renderQueryTable(rows, queryParams);
}

function renderQueryTable(rows, queryParams) {
  const filterSummary = Object.entries(queryParams)
    .filter(([k]) => k !== 'limit')
    .map(([k, v]) => `${k}=${v}`)
    .join(', ') || '(no filters)';
  console.log(`KB Query — ${filterSummary}  (limit=${queryParams.limit})`);
  console.log('');
  if (!rows.length) {
    console.log('  (no matching signals)');
    return;
  }
  const widths = {};
  for (const col of QUERY_COLUMNS) {
    widths[col] = Math.max(col.length, ...rows.map(r => String(r[col] || '').length));
  }
  console.log('  ' + QUERY_COLUMNS.map(c => c.padEnd(widths[c])).join('  '));
  console.log('  ' + QUERY_COLUMNS.map(c => '-'.repeat(widths[c])).join('  '));
  for (const r of rows) {
    console.log('  ' + QUERY_COLUMNS.map(c => String(r[c] || '').padEnd(widths[c])).join('  '));
  }
  console.log('');
  console.log(`  (${rows.length} row${rows.length === 1 ? '' : 's'})`);
}

// ─── kb search (FTS5 MATCH) ─────────────────────────────────────────────────

function cmdKbSearch(cwd, query, options, raw) {
  const asJson = raw || options.raw || options.format === 'json';

  if (!query || typeof query !== 'string' || query.trim() === '') {
    const msg = 'Usage: gsd-tools kb search <query> [--limit N] [--format json]';
    if (asJson) output({ error: msg }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const dbPath = kb.getDbPath(cwd);
  const limit = Number.isFinite(options.limit) && options.limit > 0 ? options.limit : 25;

  if (!fs.existsSync(dbPath)) {
    return fallbackGrepSearch(cwd, query, options, asJson, { limit });
  }

  const DatabaseSync = kb.getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });

  // FTS5 MATCH. snippet() renders a body excerpt around the hit with [..]
  // delimiters. Column 2 = 'body' in the CREATE VIRTUAL TABLE signal_fts order
  // (id UNINDEXED, title, body).
  let rows;
  try {
    rows = db.prepare(`
      SELECT s.id, s.severity, s.lifecycle_state, s.project, s.created,
             snippet(signal_fts, 2, '[', ']', '...', 32) AS context
      FROM signal_fts
      JOIN signals s ON s.rowid = signal_fts.rowid
      WHERE signal_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    `).all(query, limit);
  } catch (e) {
    // FTS5 MATCH throws on malformed query syntax. Surface it cleanly rather
    // than letting the stack trace leak.
    const msg = `FTS5 query error: ${e.message}`;
    if (asJson) output({ error: msg, query }, true);
    else console.error(msg);
    db.close();
    process.exitCode = 1;
    return;
  }
  db.close();

  if (asJson) {
    output({ query, limit, results: rows, fallback: null }, true);
    return;
  }

  renderSearchTable(rows, query, limit);
}

function renderSearchTable(rows, query, limit) {
  console.log(`KB Search — "${query}"  (limit=${limit})`);
  console.log('');
  if (!rows.length) {
    console.log('  (no matches)');
    return;
  }
  // id / rank-position / context table. Rank position is ordinal 1..N rather
  // than the raw FTS5 rank score; the score is not meaningful to operators.
  const idW = Math.max(2, ...rows.map(r => String(r.id || '').length));
  console.log('  #   ' + 'id'.padEnd(idW) + '  context');
  console.log('  --  ' + '-'.repeat(idW) + '  --------');
  rows.forEach((r, i) => {
    const position = String(i + 1).padStart(2);
    const ctx = (r.context || '').replace(/\s+/g, ' ').slice(0, 120);
    console.log(`  ${position}  ${String(r.id).padEnd(idW)}  ${ctx}`);
  });
  console.log('');
  console.log(`  (${rows.length} match${rows.length === 1 ? '' : 'es'})`);
}

// ─── Grep fallback (kb.db absent) ───────────────────────────────────────────

/**
 * When kb.db is missing (fresh clone) degrade to POSIX grep over the signal
 * .md files. The fallback's job is to produce *some* results, not to replicate
 * FTS5 semantics -- so porter stemming / ranking are unavailable and tag
 * filters become "the word <tag> appears in frontmatter".
 *
 * Every fallback response carries `fallback: { engine: 'grep', reason: '...' }`
 * so agents can distinguish it from a first-class SQL response.
 */
function fallbackGrepQuery(cwd, options, asJson, { limit }) {
  const kbDir = kb.getKbDir(cwd);
  const signalsDir = path.join(kbDir, 'signals');
  if (!fs.existsSync(signalsDir)) {
    if (asJson) {
      output({
        query_params: { ...options, limit },
        results: [],
        fallback: { engine: 'grep', reason: 'kb.db not found; signals directory also absent' },
      }, true);
      return;
    }
    console.log('KB Query (fallback=grep) — no kb.db and no signals directory');
    return;
  }

  // Walk signals/**\/*.md, parse frontmatter per-file, apply AND filters.
  // This is O(N) file reads but tolerable for fresh-clone paths.
  const files = walkMdFiles(signalsDir);
  const results = [];
  for (const file of files) {
    let content;
    try { content = fs.readFileSync(file, 'utf-8'); } catch { continue; }
    let fm;
    try { fm = extractFrontmatter(content); } catch { continue; }
    if (options.severity && fm.severity !== options.severity) continue;
    if (options.lifecycle && fm.lifecycle_state !== options.lifecycle) continue;
    if (options.project && fm.project !== options.project) continue;
    if (options.since && String(fm.created || '') < options.since) continue;
    if (options.tag) {
      const tags = Array.isArray(fm.tags) ? fm.tags.map(String) : [];
      if (!tags.includes(options.tag)) continue;
    }
    results.push({
      id: fm.id || path.basename(file, '.md'),
      severity: fm.severity || '',
      lifecycle_state: fm.lifecycle_state || '',
      project: fm.project || '',
      created: fm.created || '',
    });
    if (results.length >= limit) break;
  }

  const queryParams = {};
  for (const key of ['severity', 'lifecycle', 'project', 'tag', 'since']) {
    if (options[key] !== undefined) queryParams[key] = options[key];
  }
  queryParams.limit = limit;

  if (asJson) {
    output({
      query_params: queryParams,
      results,
      fallback: { engine: 'grep', reason: 'kb.db not found' },
    }, true);
    return;
  }

  console.log(`KB Query (fallback=grep; kb.db not found) — ${Object.entries(queryParams).filter(([k]) => k !== 'limit').map(([k, v]) => `${k}=${v}`).join(', ') || '(no filters)'}`);
  console.log('');
  renderQueryTable(results, queryParams);
}

function fallbackGrepSearch(cwd, query, options, asJson, { limit }) {
  const kbDir = kb.getKbDir(cwd);
  const signalsDir = path.join(kbDir, 'signals');
  if (!fs.existsSync(signalsDir)) {
    if (asJson) {
      output({
        query,
        limit,
        results: [],
        fallback: { engine: 'grep', reason: 'kb.db not found; signals directory also absent' },
      }, true);
      return;
    }
    console.log('KB Search (fallback=grep) — no kb.db and no signals directory');
    return;
  }

  // Use `grep -rlI` to list files that contain the phrase as a literal. We
  // call grep via execFileSync so shell-metacharacters in the query don't
  // re-enter a shell. If grep is not installed, catch the ENOENT.
  let stdout = '';
  try {
    stdout = execFileSync(
      'grep',
      ['-rlI', '--include=*.md', query, signalsDir],
      { encoding: 'utf-8' }
    );
  } catch (e) {
    if (e.status === 1) {
      // grep exit 1 = no matches. Not an error.
      stdout = '';
    } else if (e.code === 'ENOENT') {
      const msg = 'grep not found on $PATH; fallback unavailable. Run `kb rebuild` after installing Node >= 22.5.0.';
      if (asJson) output({ query, error: msg, fallback: { engine: 'grep', reason: 'grep missing' } }, true);
      else console.error(msg);
      process.exitCode = 1;
      return;
    } else {
      const msg = `grep fallback error: ${e.message}`;
      if (asJson) output({ query, error: msg }, true);
      else console.error(msg);
      process.exitCode = 1;
      return;
    }
  }

  const files = stdout.split('\n').filter(Boolean).slice(0, limit);
  const results = [];
  for (const file of files) {
    let content;
    try { content = fs.readFileSync(file, 'utf-8'); } catch { continue; }
    let fm = {};
    try { fm = extractFrontmatter(content) || {}; } catch { /* ignore */ }
    results.push({
      id: fm.id || path.basename(file, '.md'),
      severity: fm.severity || '',
      lifecycle_state: fm.lifecycle_state || '',
      project: fm.project || '',
      created: fm.created || '',
      context: extractGrepContext(content, query),
    });
  }

  if (asJson) {
    output({
      query,
      limit,
      results,
      fallback: { engine: 'grep', reason: 'kb.db not found' },
    }, true);
    return;
  }

  console.log(`KB Search (fallback=grep; kb.db not found) — "${query}"`);
  console.log('');
  renderSearchTable(results, query, limit);
}

function extractGrepContext(content, query) {
  // Pick the first line containing the query (case-insensitive) and trim.
  const lower = content.toLowerCase();
  const idx = lower.indexOf(query.toLowerCase());
  if (idx === -1) return '';
  const start = Math.max(0, idx - 32);
  const end = Math.min(content.length, idx + query.length + 32);
  return content.slice(start, end).replace(/\s+/g, ' ');
}

function walkMdFiles(dir) {
  const out = [];
  function walk(d) {
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const p = path.join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.name.endsWith('.md')) out.push(p);
    }
  }
  walk(dir);
  return out;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  cmdKbQuery,
  cmdKbSearch,
  parseKbQueryOptions,
  // Test-only: direct access to fallback paths so unit tests can force them
  // without deleting kb.db from a running fixture.
  __testOnly_fallbackGrepQuery: fallbackGrepQuery,
  __testOnly_fallbackGrepSearch: fallbackGrepSearch,
};
