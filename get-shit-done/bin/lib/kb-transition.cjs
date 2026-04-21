/**
 * KB Transition -- Mutating lifecycle-state verb (Phase 59 Plan 04, KB-06b).
 *
 * Ships cmdKbTransition: the programmatic replacement for the broken-on-Linux
 * reconcile-signal-lifecycle.sh. Writes BOTH the signal .md frontmatter AND
 * the SQLite signals row atomically inside a BEGIN IMMEDIATE transaction; on
 * any error, rolls back SQL and restores the file from a .bak sidecar.
 *
 * Dual-write ordering (load-bearing; see 59-RESEARCH.md Pattern 2 + Pitfall 6):
 *
 *   1. Open kb.db, find signal .md file, read content, parse frontmatter.
 *   2. assertLegalTransition(from, to, strictness) per knowledge-store.md:213-225.
 *   3. Build new frontmatter: merge lifecycle_state, updated, lifecycle_log entry.
 *   4. Create .bak sidecar (fs.copyFileSync BEFORE any write).
 *   5. BEGIN IMMEDIATE -> file write via spliceFrontmatter -> UPDATE signals ->
 *      COMMIT. On any throw: ROLLBACK SQL, restore file from .bak, delete .bak.
 *
 * `lifecycle_log` is stored in-frontmatter (file side) and JSON-serialized into
 * a dedicated TEXT column on signals SQL side. We ensureColumn the log column
 * here so the first run against an existing v3 kb.db succeeds without a full
 * schema bump.
 *
 * assertLegalTransition encodes the lifecycle state machine from
 * agents/knowledge-store.md:213-225:
 *   detected    -> triaged | blocked | invalidated
 *   triaged     -> blocked | remediated | invalidated | detected  (regression)
 *   blocked     -> triaged | remediated | invalidated
 *   remediated  -> verified | detected  (regression)
 *   verified    -> detected  (regression)
 *   invalidated -> (terminal)
 * The `any -> invalidated` rule is preserved under every strictness setting.
 *
 * Strictness (from fm.lifecycle_strictness or --strictness flag):
 *   - strict:   only legal transitions above; reject all else
 *   - flexible: legal transitions pass silently; illegal ones warn but proceed
 *               (mirrors knowledge-store.md:232-237 "flexible" rules)
 *   - minimal:  any forward transition allowed; no rejection
 *
 * Exit codes:
 *   0 = transition succeeded (file + SQL both updated)
 *   1 = precondition failure (signal not found, illegal transition under strict,
 *       missing kb.db, missing required args)
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { output } = require('./core.cjs');
const { extractFrontmatter, spliceFrontmatter } = require('./frontmatter.cjs');
const kb = require('./kb.cjs');

// ─── Lifecycle state machine ────────────────────────────────────────────────

const LEGAL_TRANSITIONS = {
  detected: new Set(['triaged', 'blocked', 'invalidated', 'remediated']),
  // detected -> remediated is flexible-mode-only per knowledge-store.md:237.
  // Under strict, this transition is rejected; flexible allows it.
  triaged: new Set(['blocked', 'remediated', 'invalidated', 'detected']),
  blocked: new Set(['triaged', 'remediated', 'invalidated']),
  remediated: new Set(['verified', 'detected', 'invalidated']),
  verified: new Set(['detected', 'invalidated']),
  invalidated: new Set(),
};

// Strict mode forbids detected->remediated (must triage first).
const STRICT_FORBIDDEN = new Set(['detected->remediated', 'detected->verified', 'triaged->verified']);

function assertLegalTransition(from, to, strictness) {
  const effectiveFrom = from || 'detected';
  const level = strictness || 'flexible';

  if (level === 'minimal') return { legal: true, warning: null };

  // Terminal check: invalidated accepts nothing.
  if (effectiveFrom === 'invalidated') {
    return {
      legal: false,
      reason: `cannot transition out of terminal state 'invalidated'`,
    };
  }

  const legal = LEGAL_TRANSITIONS[effectiveFrom] || new Set();
  const key = `${effectiveFrom}->${to}`;

  // Any -> invalidated is always legal (per knowledge-store.md:224).
  if (to === 'invalidated') return { legal: true, warning: null };

  if (level === 'strict') {
    if (STRICT_FORBIDDEN.has(key)) {
      return {
        legal: false,
        reason: `strict mode forbids '${key}' (must progress through intermediate state)`,
      };
    }
    if (!legal.has(to)) {
      return {
        legal: false,
        reason: `illegal transition '${key}' (allowed from ${effectiveFrom}: ${[...legal].join(', ') || 'none'})`,
      };
    }
    return { legal: true, warning: null };
  }

  // flexible: allow but warn on non-table transitions.
  if (!legal.has(to)) {
    return {
      legal: true,
      warning: `flexible mode: '${key}' is not in the canonical state machine table`,
    };
  }
  return { legal: true, warning: null };
}

// ─── Option parsing ─────────────────────────────────────────────────────────

function parseKbTransitionOptions(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--reason') opts.reason = args[++i];
    else if (arg === '--resolved-by-plan') opts.resolvedByPlan = args[++i];
    else if (arg === '--strictness') opts.strictness = args[++i];
    else if (arg === '--format') opts.format = args[++i];
    else if (arg === '--raw') opts.raw = true;
  }
  return opts;
}

// ─── Signal file lookup ─────────────────────────────────────────────────────

function findSignalFile(cwd, signalId) {
  const kbDir = kb.getKbDir(cwd);
  const files = kb.discoverSignalFiles(kbDir);
  const target = `${signalId}.md`;
  for (const f of files) {
    if (path.basename(f) === target) return f;
  }
  return null;
}

// ─── Schema: ensure lifecycle_log column exists on signals ──────────────────

function ensureLifecycleLogColumn(db) {
  const cols = db.prepare('PRAGMA table_info(signals)').all();
  if (cols.some(c => c.name === 'lifecycle_log')) return;
  db.exec("ALTER TABLE signals ADD COLUMN lifecycle_log TEXT DEFAULT ''");
}

// ─── kb transition ──────────────────────────────────────────────────────────

function cmdKbTransition(cwd, signalId, newState, options, raw) {
  const asJson = raw || options.raw || options.format === 'json';

  if (!signalId || typeof signalId !== 'string' || signalId.trim() === '') {
    const msg = 'Usage: gsd-tools kb transition <signal-id> <new-state> [--reason <text>] [--resolved-by-plan <id>] [--strictness strict|flexible|minimal]';
    if (asJson) output({ error: msg }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }
  if (!newState || typeof newState !== 'string' || newState.trim() === '') {
    const msg = `error: missing <new-state> argument (expected one of: detected, triaged, blocked, remediated, verified, invalidated)`;
    if (asJson) output({ error: msg, signalId }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const KNOWN_STATES = new Set(['detected', 'triaged', 'blocked', 'remediated', 'verified', 'invalidated']);
  if (!KNOWN_STATES.has(newState)) {
    const msg = `error: unknown lifecycle state '${newState}' (known: ${[...KNOWN_STATES].join(', ')})`;
    if (asJson) output({ error: msg, signalId, newState }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const dbPath = kb.getDbPath(cwd);
  if (!fs.existsSync(dbPath)) {
    const msg = "error: kb.db required for kb transition; run 'kb rebuild' first";
    if (asJson) output({ error: msg, signalId }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const sigFile = findSignalFile(cwd, signalId);
  if (!sigFile) {
    const msg = `error: signal file not found: ${signalId}.md`;
    if (asJson) output({ error: msg, signalId }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const content = fs.readFileSync(sigFile, 'utf-8');
  const fm = extractFrontmatter(content);
  const fromState = (typeof fm.lifecycle_state === 'string' && fm.lifecycle_state.trim())
    ? fm.lifecycle_state.trim()
    : 'detected';

  // Idempotent: if already in the target state, return success without writes.
  if (fromState === newState) {
    const payload = {
      signalId,
      from: fromState,
      to: newState,
      noop: true,
      reason: options.reason || null,
      resolved_by_plan: options.resolvedByPlan || null,
      timestamp: new Date().toISOString(),
    };
    if (asJson) output(payload, true);
    else console.log(`No-op: ${signalId} already in '${newState}'`);
    return;
  }

  const strictness = options.strictness
    || (typeof fm.lifecycle_strictness === 'string' ? fm.lifecycle_strictness : 'flexible');
  const check = assertLegalTransition(fromState, newState, strictness);
  if (!check.legal) {
    const msg = `error: ${check.reason}`;
    if (asJson) output({ error: msg, signalId, from: fromState, to: newState, strictness }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const DatabaseSync = kb.getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  ensureLifecycleLogColumn(db);

  const timestamp = new Date().toISOString();

  // Build new frontmatter and lifecycle_log entry.
  const newFm = { ...fm };
  newFm.lifecycle_state = newState;
  newFm.updated = timestamp;
  const logEntry = {
    event: newState,
    from: fromState,
    timestamp,
  };
  if (options.reason) logEntry.reason = options.reason;
  if (options.resolvedByPlan) logEntry.resolved_by_plan = options.resolvedByPlan;

  const priorLog = Array.isArray(fm.lifecycle_log) ? fm.lifecycle_log : [];
  newFm.lifecycle_log = [...priorLog, logEntry];

  const bakPath = sigFile + '.bak';
  fs.copyFileSync(sigFile, bakPath);

  let rolledBack = false;
  try {
    db.exec('BEGIN IMMEDIATE');
    const newContent = spliceFrontmatter(content, newFm);
    fs.writeFileSync(sigFile, newContent, 'utf-8');
    db.prepare(`
      UPDATE signals
         SET lifecycle_state = ?,
             updated = ?,
             lifecycle_log = ?
       WHERE id = ?
    `).run(newState, timestamp, JSON.stringify(newFm.lifecycle_log), signalId);
    db.exec('COMMIT');
  } catch (e) {
    try { db.exec('ROLLBACK'); } catch { /* already rolled back */ }
    try {
      if (fs.existsSync(bakPath)) fs.copyFileSync(bakPath, sigFile);
    } catch { /* best-effort restore */ }
    rolledBack = true;
    db.close();
    try { fs.unlinkSync(bakPath); } catch { /* best-effort cleanup */ }
    const msg = `error: transition failed: ${e.message}; rolled back`;
    if (asJson) output({ error: msg, signalId, from: fromState, to: newState }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  db.close();
  try { fs.unlinkSync(bakPath); } catch { /* best-effort cleanup */ }

  const payload = {
    signalId,
    from: fromState,
    to: newState,
    reason: options.reason || null,
    resolved_by_plan: options.resolvedByPlan || null,
    timestamp,
    strictness,
    rolled_back: rolledBack,
  };
  if (check.warning) payload.warning = check.warning;

  if (asJson) {
    output(payload, true);
  } else {
    const reasonStr = options.reason ? ` (reason: ${options.reason})` : '';
    console.log(`Transitioned ${signalId}: ${fromState} -> ${newState}${reasonStr}`);
    if (check.warning) console.log(`  Warning: ${check.warning}`);
  }
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  cmdKbTransition,
  parseKbTransitionOptions,
  // Test-only exports for direct unit-level invocation.
  __testOnly_assertLegalTransition: assertLegalTransition,
  __testOnly_findSignalFile: findSignalFile,
};
