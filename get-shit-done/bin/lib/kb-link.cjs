/**
 * KB Link -- Read-only edge traversal (Phase 59 Plan 02).
 *
 * Ships cmdKbLinkShow: inbound / outbound / both surfaces over signal_links,
 * non-mutating. The write half of the kb link verb split (kb link create /
 * kb link delete) is Plan 04; this module stubs the write verbs with an
 * explicit "Plan 04" error at the router level so the verb namespace is
 * discoverable but not yet functional.
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

const { output } = require('./core.cjs');
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

// ─── kb link create / delete: explicit Plan 04 stub ─────────────────────────

function stubWriteVerb(verbName, raw) {
  const msg = `error: 'kb link ${verbName}' not yet implemented -- deferred to Phase 59 Plan 04 (KB-06b write half). Use 'kb link show' for read-only traversal.`;
  if (raw) output({ error: msg, deferred_to: 'phase-59-plan-04' }, true);
  else console.error(msg);
  process.exitCode = 1;
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  cmdKbLinkShow,
  parseKbLinkOptions,
  stubWriteVerb,
};
