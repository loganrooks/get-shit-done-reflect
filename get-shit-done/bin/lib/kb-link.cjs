/**
 * KB Link -- Edge traversal (read: Phase 59 Plan 02; write: Phase 59 Plan 04).
 *
 * Ships cmdKbLinkShow (inbound / outbound / both surfaces), plus the mutating
 * cmdKbLinkCreate and cmdKbLinkDelete verbs. All three run through the same
 * kb.db substrate. Write verbs use the same BEGIN IMMEDIATE dual-write pattern
 * as kb transition, writing ONLY the source-side .md frontmatter + the
 * signal_links SQL row. The target signal is intentionally NOT mutated --
 * `qualified_by` and `superseded_by` are FROZEN fields per
 * knowledge-store.md:555-567; inbound visibility is achieved via the SQL
 * inbound query, not target-side writeback.
 *
 * Write-verb semantics:
 *   - `related_to` maps to `fm.related_signals[]` on the source file; mutable.
 *   - `recurrence_of` is a single-valued field (overwrite on create); mutable.
 *   - `qualified_by` and `superseded_by` are FROZEN on the source file as well
 *     (they are set at signal-creation time only). `kb link create` rejects
 *     these link types unless `--force` is passed so agents who need to record
 *     a late-arriving qualification cannot do so accidentally.
 *
 * Edge provenance (Plan 01 substrate):
 *   Every INSERT populates signal_links.created_at (ISO-8601 now) and
 *   signal_links.source_content_hash (sha256 of post-write source file body).
 *   kb link delete does not repopulate these (the row is gone).
 *
 * Dependencies on ./kb.cjs:
 *   - getDbPath, getDbSync for path resolution + lazy node:sqlite gate.
 *
 * kb.db absence semantics:
 *   Inbound traversal has no tractable grep fallback (the relation is
 *   target->sources which requires reading every .md file to invert). Per
 *   59-RESEARCH.md §Genuine gaps we surface a clean error instructing the
 *   user to run `kb rebuild` instead of degrading to grep for this verb.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const { output } = require('./core.cjs');
const { extractFrontmatter, spliceFrontmatter } = require('./frontmatter.cjs');
const kb = require('./kb.cjs');

// ─── Option parsing ─────────────────────────────────────────────────────────

/**
 * Extract kb link show options. Default direction is --both.
 *
 *   --outbound | --inbound | --both    (direction; default --both)
 *   --format json                      (alias: --raw)
 */
function parseKbLinkOptions(args) {
  const opts = { direction: 'both' };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--outbound') opts.direction = 'outbound';
    else if (arg === '--inbound') opts.direction = 'inbound';
    else if (arg === '--both') opts.direction = 'both';
    else if (arg === '--format') opts.format = args[++i];
    else if (arg === '--raw') opts.raw = true;
  }
  return opts;
}

// ─── kb link show ───────────────────────────────────────────────────────────

function cmdKbLinkShow(cwd, signalId, options, raw) {
  const asJson = raw || options.raw || options.format === 'json';

  if (!signalId || typeof signalId !== 'string' || signalId.trim() === '') {
    const msg = 'Usage: gsd-tools kb link show <signal-id> [--outbound | --inbound | --both]';
    if (asJson) output({ error: msg }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const dbPath = kb.getDbPath(cwd);
  if (!fs.existsSync(dbPath)) {
    // Per research §Genuine gaps: no tractable grep fallback for inbound edge
    // traversal. Rather than pretending (grep can't invert the relation), we
    // surface the contract: run `kb rebuild` first.
    const msg = "error: kb.db required for link traversal; run 'kb rebuild' first";
    if (asJson) output({ error: msg, signalId }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const DatabaseSync = kb.getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });

  // Existence check first. Absence must be distinguishable from "no links" --
  // per Pitfall 8 the caller needs a clear error, not a silent empty.
  const sig = db.prepare('SELECT id FROM signals WHERE id = ?').get(signalId);
  if (!sig) {
    const msg = `error: signal not found: ${signalId}`;
    if (asJson) output({ error: msg, signalId }, true);
    else console.error(msg);
    db.close();
    process.exitCode = 1;
    return;
  }

  const dir = options.direction || 'both';
  let outbound = null;
  let inbound = null;

  if (dir === 'outbound' || dir === 'both') {
    // Outbound: resolve target_kind per target_id (signal / spike / malformed
    // / orphan). Single CASE-WHEN so we do one scan of the source_id rows.
    outbound = db.prepare(`
      SELECT target_id, link_type,
             CASE
               WHEN target_id = '[object Object]' THEN 'malformed'
               WHEN EXISTS(SELECT 1 FROM signals WHERE id = target_id) THEN 'signal'
               WHEN EXISTS(SELECT 1 FROM spikes WHERE id = target_id) THEN 'spike'
               ELSE 'orphan'
             END AS target_kind
      FROM signal_links
      WHERE source_id = ?
      ORDER BY link_type, target_id
    `).all(signalId);
  }

  if (dir === 'inbound' || dir === 'both') {
    // Inbound: plans as SEARCH ... USING INDEX idx_signal_links_target.
    // Does not include target_kind -- this signal is the target, and by the
    // existence check above we know it resolves to a signal.
    inbound = db.prepare(`
      SELECT source_id, link_type
      FROM signal_links
      WHERE target_id = ?
      ORDER BY link_type, source_id
    `).all(signalId);
  }

  db.close();

  if (asJson) {
    const payload = {
      signalId,
      outbound: outbound || [],
      inbound: inbound || [],
    };
    // Surface which surfaces were requested so downstream callers can tell
    // "unrequested" from "empty".
    payload.requested = dir;
    output(payload, true);
    return;
  }

  renderLinkSections(signalId, outbound, inbound, dir);
}

function renderLinkSections(signalId, outbound, inbound, direction) {
  console.log(`KB Link — ${signalId}  (${direction})`);
  console.log('');

  if (outbound) {
    console.log('Outbound:');
    if (!outbound.length) {
      console.log('  (none)');
    } else {
      const ltW = Math.max('link_type'.length, ...outbound.map(r => String(r.link_type || '').length));
      const tgtW = Math.max('target'.length, ...outbound.map(r => String(r.target_id || '').length));
      console.log(`  ${'link_type'.padEnd(ltW)}  ${'target'.padEnd(tgtW)}  target_kind`);
      console.log(`  ${'-'.repeat(ltW)}  ${'-'.repeat(tgtW)}  -----------`);
      for (const r of outbound) {
        console.log(`  ${String(r.link_type).padEnd(ltW)}  ${String(r.target_id).padEnd(tgtW)}  ${r.target_kind}`);
      }
    }
    console.log('');
  }

  if (inbound) {
    console.log('Inbound:');
    if (!inbound.length) {
      console.log('  (none)');
    } else {
      const ltW = Math.max('link_type'.length, ...inbound.map(r => String(r.link_type || '').length));
      const srcW = Math.max('source'.length, ...inbound.map(r => String(r.source_id || '').length));
      console.log(`  ${'link_type'.padEnd(ltW)}  ${'source'.padEnd(srcW)}`);
      console.log(`  ${'-'.repeat(ltW)}  ${'-'.repeat(srcW)}`);
      for (const r of inbound) {
        console.log(`  ${String(r.link_type).padEnd(ltW)}  ${String(r.source_id).padEnd(srcW)}`);
      }
    }
    console.log('');
  }
}

// ─── kb link create / delete: write verbs (Plan 04 replaces the Plan 02 stub) ─

const SUPPORTED_LINK_TYPES = new Set(['qualified_by', 'superseded_by', 'related_to', 'recurrence_of']);
const FROZEN_LINK_TYPES = new Set(['qualified_by', 'superseded_by']);

function parseKbLinkWriteOptions(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--type') opts.type = args[++i];
    else if (arg === '--force') opts.force = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--format') opts.format = args[++i];
    else if (arg === '--raw') opts.raw = true;
  }
  return opts;
}

function findSignalFile(cwd, signalId) {
  const kbDir = kb.getKbDir(cwd);
  const files = kb.discoverSignalFiles(kbDir);
  const target = `${signalId}.md`;
  for (const f of files) {
    if (path.basename(f) === target) return f;
  }
  return null;
}

/**
 * Compute sha256 of the .md body (everything after frontmatter) for
 * signal_links.source_content_hash. Mirrors Plan 01's rebuild-path pattern.
 */
function sourceContentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Add link `target` to the frontmatter field implied by link type.
 *   related_to -> fm.related_signals (array)
 *   recurrence_of -> fm.recurrence_of (scalar)
 *   qualified_by -> fm.qualified_by (array; frozen unless --force)
 *   superseded_by -> fm.superseded_by (scalar; frozen unless --force)
 *
 * Returns { fm, changed } -- changed=false means target was already present.
 */
function applyLinkCreate(fm, linkType, targetId) {
  const next = { ...fm };
  if (linkType === 'related_to') {
    const arr = Array.isArray(next.related_signals)
      ? next.related_signals.filter(v => typeof v === 'string')
      : [];
    if (arr.includes(targetId)) return { fm: next, changed: false };
    next.related_signals = [...arr, targetId];
    return { fm: next, changed: true };
  }
  if (linkType === 'qualified_by') {
    const arr = Array.isArray(next.qualified_by)
      ? next.qualified_by.filter(v => typeof v === 'string')
      : (typeof next.qualified_by === 'string' && next.qualified_by ? [next.qualified_by] : []);
    if (arr.includes(targetId)) return { fm: next, changed: false };
    next.qualified_by = [...arr, targetId];
    return { fm: next, changed: true };
  }
  if (linkType === 'superseded_by') {
    if (next.superseded_by === targetId) return { fm: next, changed: false };
    next.superseded_by = targetId;
    return { fm: next, changed: true };
  }
  if (linkType === 'recurrence_of') {
    if (next.recurrence_of === targetId) return { fm: next, changed: false };
    next.recurrence_of = targetId;
    return { fm: next, changed: true };
  }
  return { fm: next, changed: false };
}

function applyLinkDelete(fm, linkType, targetId) {
  const next = { ...fm };
  if (linkType === 'related_to') {
    if (!Array.isArray(next.related_signals) || next.related_signals.length === 0) {
      return { fm: next, changed: false };
    }
    const filtered = next.related_signals.filter(v => typeof v === 'string' && v !== targetId);
    if (filtered.length === next.related_signals.length) {
      return { fm: next, changed: false };
    }
    next.related_signals = filtered;
    return { fm: next, changed: true };
  }
  if (linkType === 'qualified_by') {
    if (Array.isArray(next.qualified_by)) {
      const filtered = next.qualified_by.filter(v => typeof v === 'string' && v !== targetId);
      if (filtered.length === next.qualified_by.length) {
        return { fm: next, changed: false };
      }
      next.qualified_by = filtered;
      return { fm: next, changed: true };
    }
    if (typeof next.qualified_by === 'string' && next.qualified_by === targetId) {
      delete next.qualified_by;
      return { fm: next, changed: true };
    }
    return { fm: next, changed: false };
  }
  if (linkType === 'superseded_by') {
    if (next.superseded_by !== targetId) return { fm: next, changed: false };
    delete next.superseded_by;
    return { fm: next, changed: true };
  }
  if (linkType === 'recurrence_of') {
    if (next.recurrence_of !== targetId) return { fm: next, changed: false };
    delete next.recurrence_of;
    return { fm: next, changed: true };
  }
  return { fm: next, changed: false };
}

function cmdKbLinkCreate(cwd, srcId, tgtId, options, raw) {
  return cmdKbLinkWrite(cwd, srcId, tgtId, options, raw, 'create');
}

function cmdKbLinkDelete(cwd, srcId, tgtId, options, raw) {
  return cmdKbLinkWrite(cwd, srcId, tgtId, options, raw, 'delete');
}

function cmdKbLinkWrite(cwd, srcId, tgtId, options, raw, verb) {
  const asJson = raw || options.raw || options.format === 'json';

  if (!srcId || !tgtId) {
    const msg = `Usage: gsd-tools kb link ${verb} <src-id> <tgt-id> --type <qualified_by|superseded_by|related_to|recurrence_of> [--force] [--dry-run]`;
    if (asJson) output({ error: msg }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }
  const linkType = options.type;
  if (!linkType || !SUPPORTED_LINK_TYPES.has(linkType)) {
    const msg = `error: --type is required and must be one of ${[...SUPPORTED_LINK_TYPES].join(', ')}`;
    if (asJson) output({ error: msg, linkType: linkType || null }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  // Frozen-field guard: qualified_by and superseded_by are FROZEN after
  // publication per knowledge-store.md:555-567. Creating one implies mutating
  // a frozen field; require --force to acknowledge the spec violation
  // intentionally. Delete is similarly gated for symmetry -- if you're deleting
  // a frozen field, you're knowingly overriding the spec.
  if (verb === 'create' && FROZEN_LINK_TYPES.has(linkType) && !options.force) {
    const msg = `error: link type '${linkType}' is FROZEN after signal publication (knowledge-store.md §10). Pass --force to override.`;
    if (asJson) output({ error: msg, srcId, tgtId, linkType }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const dbPath = kb.getDbPath(cwd);
  if (!fs.existsSync(dbPath)) {
    const msg = "error: kb.db required for kb link write; run 'kb rebuild' first";
    if (asJson) output({ error: msg, srcId, tgtId }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const srcFile = findSignalFile(cwd, srcId);
  if (!srcFile) {
    const msg = `error: source signal file not found: ${srcId}.md`;
    if (asJson) output({ error: msg, srcId }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const content = fs.readFileSync(srcFile, 'utf-8');
  const fm = extractFrontmatter(content);

  const mutate = verb === 'create'
    ? applyLinkCreate(fm, linkType, tgtId)
    : applyLinkDelete(fm, linkType, tgtId);

  if (!mutate.changed) {
    const payload = {
      srcId,
      tgtId,
      linkType,
      verb,
      noop: true,
      reason: verb === 'create' ? 'link already exists on source frontmatter' : 'link not present on source frontmatter',
    };
    if (asJson) output(payload, true);
    else console.log(`No-op: ${verb} ${srcId} --${linkType}--> ${tgtId} (already ${verb === 'create' ? 'present' : 'absent'})`);
    return;
  }

  if (options.dryRun) {
    const payload = {
      srcId,
      tgtId,
      linkType,
      verb,
      dry_run: true,
      file: srcFile,
    };
    if (asJson) output(payload, true);
    else console.log(`[dry-run] ${verb} ${srcId} --${linkType}--> ${tgtId} on ${srcFile}`);
    return;
  }

  const DatabaseSync = kb.getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });

  // Ensure source signal exists in SQL (the file walk found the .md, but a
  // fresh file that has not yet been rebuilt into kb.db would cause the UPDATE
  // to no-op silently).
  const srcRow = db.prepare('SELECT id FROM signals WHERE id = ?').get(srcId);
  if (!srcRow) {
    db.close();
    const msg = `error: source signal '${srcId}' is on disk but not in kb.db; run 'kb rebuild' first`;
    if (asJson) output({ error: msg, srcId }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const bakPath = srcFile + '.bak';
  fs.copyFileSync(srcFile, bakPath);

  const timestamp = new Date().toISOString();
  let insertedCreatedAt = null;
  let insertedSourceContentHash = null;

  try {
    db.exec('BEGIN IMMEDIATE');
    const newContent = spliceFrontmatter(content, mutate.fm);
    fs.writeFileSync(srcFile, newContent, 'utf-8');

    if (verb === 'create') {
      const hash = sourceContentHash(newContent);
      db.prepare(`
        INSERT OR REPLACE INTO signal_links
          (source_id, target_id, link_type, created_at, source_content_hash)
        VALUES (?, ?, ?, ?, ?)
      `).run(srcId, tgtId, linkType, timestamp, hash);
      insertedCreatedAt = timestamp;
      insertedSourceContentHash = hash;
    } else {
      db.prepare(`
        DELETE FROM signal_links
         WHERE source_id = ? AND target_id = ? AND link_type = ?
      `).run(srcId, tgtId, linkType);
    }
    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
    try {
      if (fs.existsSync(bakPath)) fs.copyFileSync(bakPath, srcFile);
    } catch { /* best-effort restore */ }
    db.close();
    try { fs.unlinkSync(bakPath); } catch { /* best-effort cleanup */ }
    const msg = `error: kb link ${verb} failed: ${e.message}; rolled back`;
    if (asJson) output({ error: msg, srcId, tgtId, linkType }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  db.close();
  try { fs.unlinkSync(bakPath); } catch { /* best-effort cleanup */ }

  const payload = {
    srcId,
    tgtId,
    linkType,
    verb,
    timestamp,
  };
  if (verb === 'create') {
    payload.created_at = insertedCreatedAt;
    payload.source_content_hash = insertedSourceContentHash;
  }
  if (asJson) {
    output(payload, true);
  } else {
    console.log(`${verb === 'create' ? 'Created' : 'Deleted'} link: ${srcId} --${linkType}--> ${tgtId}`);
  }
}

/**
 * Backwards-compat shim: Plan 02 exported `stubWriteVerb` for use in the
 * router. Plan 04 replaces the stub behaviour with the real write verbs; keep
 * the export alive so any test or external caller referring to it continues
 * to compile, but it now returns the "not supported anymore" error instead of
 * being called in the happy path.
 */
function stubWriteVerb(verbName, raw) {
  const msg = `error: 'kb link ${verbName}' stub invoked in Plan 04 runtime; router should dispatch to cmdKbLinkCreate/cmdKbLinkDelete directly`;
  if (raw) output({ error: msg }, true);
  else console.error(msg);
  process.exitCode = 1;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  cmdKbLinkShow,
  parseKbLinkOptions,
  cmdKbLinkCreate,
  cmdKbLinkDelete,
  parseKbLinkWriteOptions,
  stubWriteVerb,
  __testOnly_applyLinkCreate: applyLinkCreate,
  __testOnly_applyLinkDelete: applyLinkDelete,
  __testOnly_findSignalFile: findSignalFile,
};
