/**
 * KB Health -- Four-check watchdog (Phase 59 Plan 03).
 *
 * Runs four independent checks in a fixed order and emits PASS / FAIL /
 * SUMMARY for each:
 *
 *   1. edge_integrity         -- re-uses Plan 01's computeEdgeIntegrity; FAIL
 *                                on any malformed target_id or orphan rate > 5%.
 *   2. lifecycle_vs_plan      -- walks .planning/phases/**\/NN-PLAN.md files
 *                                whose matching NN-SUMMARY.md exists (the plan
 *                                is complete), parses resolves_signals, and
 *                                FAILs for any referenced signal whose SQL
 *                                lifecycle_state is not remediated/verified.
 *   3. dual_write             -- re-reads a sample of signal .md files and
 *                                FAILs when the file's lifecycle_state
 *                                diverges from the SQLite row (KB-05 invariant
 *                                verification).
 *   4. depends_on_freshness   -- advisory SUMMARY, not a gate. Counts
 *                                signals/spikes carrying depends_on and flags
 *                                references whose value looks like a path and
 *                                is not present on disk. Per research Pitfall
 *                                C4 / D2 the check is an ontological limit --
 *                                semantic staleness is not judged here.
 *
 * Exit code bitmask (so CI callers can discriminate failure class without
 * re-parsing text):
 *
 *   bit 0 (1) = edge_integrity FAIL
 *   bit 1 (2) = lifecycle_vs_plan FAIL
 *   bit 2 (4) = dual_write FAIL
 *
 * All three hard checks failing simultaneously is therefore exit 7.
 * depends_on_freshness never trips the exit code (SUMMARY, not a check).
 *
 * Dependencies on ./kb.cjs and ./frontmatter.cjs:
 *   - getKbDir, getDbPath, getDbSync (path + lazy sqlite gate)
 *   - discoverSignalFiles, discoverSpikeFiles (file walkers)
 *   - computeEdgeIntegrity (Plan 01 classifier reused verbatim)
 *   - extractFrontmatter (YAML frontmatter parser)
 *
 * Reuse discipline: per 59-03-PLAN must-have #6 and research Pitfall 8,
 * kb-health.cjs MUST NOT duplicate file walkers or frontmatter parsing.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { output } = require('./core.cjs');
const { extractFrontmatter } = require('./frontmatter.cjs');
const kb = require('./kb.cjs');

// ─── Option parsing ─────────────────────────────────────────────────────────

/**
 * Parse kb health options from the raw arg slice (post-subcommand).
 *
 *   --all               scan every signal for dual-write check
 *                       (default: sample 20)
 *   --seed <N>          deterministic sampling seed for reproducible tests
 *   --format json       alias: --raw
 *   --verbose           include dangling depends_on refs in text output
 */
function parseKbHealthOptions(args) {
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--all') opts.all = true;
    else if (arg === '--verbose') opts.verbose = true;
    else if (arg === '--raw') opts.raw = true;
    else if (arg === '--format') opts.format = args[++i];
    else if (arg === '--seed') opts.seed = parseInt(args[++i], 10);
  }
  return opts;
}

// ─── Constants ──────────────────────────────────────────────────────────────

// Orphan rate threshold for the edge_integrity gate. Research Pattern 5 called
// for a "named threshold, keep simple" -- 5% is the plan's explicit choice.
// Orphans above this percentage likely indicate a systemic drift (signal IDs
// renamed / deleted without link repair), not incidental staleness.
const ORPHAN_RATE_THRESHOLD = 0.05;

// Default sample size for the dual-write check. --all expands to every signal.
// Research §Genuine gaps (line 571) recommended 20 as a pragmatic floor.
const DUAL_WRITE_SAMPLE = 20;

// Exit-code bitmask -- documented in module header.
const EXIT_BIT_EDGE = 1;
const EXIT_BIT_LIFECYCLE = 2;
const EXIT_BIT_DUAL_WRITE = 4;

// Lifecycle states accepted as "work is done" when a plan's resolves_signals
// list references a signal. Anything else (detected, triaged, blocked,
// invalidated, or unknown) is a drift flag.
const TERMINAL_LIFECYCLE_STATES = new Set(['remediated', 'verified']);

// ─── Main dispatcher ────────────────────────────────────────────────────────

function cmdKbHealth(cwd, options, raw) {
  const asJson = raw || options.raw || options.format === 'json';
  const dbPath = kb.getDbPath(cwd);

  if (!fs.existsSync(dbPath)) {
    const msg = "error: kb.db required for health checks; run 'kb rebuild' first";
    if (asJson) output({ error: msg }, true);
    else console.error(msg);
    process.exitCode = 1;
    return;
  }

  const DatabaseSync = kb.getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });

  let result;
  try {
    const edge = checkEdgeIntegrity(db);
    const lifecycle = checkLifecycleVsPlan(cwd, db);
    const dualWrite = checkDualWrite(cwd, db, options);
    const dependsOn = checkDependsOnFreshness(cwd, db);

    let exitCode = 0;
    if (edge.status === 'fail') exitCode |= EXIT_BIT_EDGE;
    if (lifecycle.status === 'fail') exitCode |= EXIT_BIT_LIFECYCLE;
    if (dualWrite.status === 'fail') exitCode |= EXIT_BIT_DUAL_WRITE;

    result = {
      exit_code: exitCode,
      checks: {
        edge_integrity: edge,
        lifecycle_vs_plan: lifecycle,
        dual_write: dualWrite,
        depends_on_freshness: dependsOn,
      },
    };

    process.exitCode = exitCode;
  } finally {
    db.close();
  }

  if (asJson) {
    output(result, true);
    return;
  }

  renderHealthReport(result, options);
}

// ─── Check 1: Edge integrity ────────────────────────────────────────────────

function checkEdgeIntegrity(db) {
  // Plan 01 classifier -- re-used verbatim via the public export. target_id =
  // '[object Object]' is the malformed sentinel; EXISTS joins on signals.id /
  // spikes.id identify resolves; the residual is orphaned.
  const edgeIntegrity = kb.computeEdgeIntegrity(db);
  const t = edgeIntegrity.total || { total: 0, resolves: 0, orphaned: 0, malformed: 0 };

  const malformed = t.malformed || 0;
  const orphaned = t.orphaned || 0;
  const total = t.total || 0;
  const orphanRate = total > 0 ? orphaned / total : 0;

  let status = 'pass';
  const reasons = [];
  if (malformed > 0) {
    status = 'fail';
    reasons.push(`${malformed} malformed`);
  }
  if (orphanRate > ORPHAN_RATE_THRESHOLD) {
    status = 'fail';
    reasons.push(`orphan rate ${(orphanRate * 100).toFixed(1)}% exceeds threshold ${(ORPHAN_RATE_THRESHOLD * 100).toFixed(0)}%`);
  }

  return {
    status,
    total,
    malformed,
    orphaned,
    orphan_rate: Number(orphanRate.toFixed(4)),
    threshold: ORPHAN_RATE_THRESHOLD,
    by_link_type: edgeIntegrity,
    reasons,
    remediation: status === 'fail'
      ? "run 'kb repair --malformed-targets' or investigate source signal files"
      : null,
  };
}

// ─── Check 2: Lifecycle vs plan consistency ─────────────────────────────────

/**
 * Discover plan files under .planning/phases/<phase-dir>/NN-PLAN.md whose
 * matching NN-SUMMARY.md exists in the same directory. The SUMMARY.md presence
 * signals the plan is complete; incomplete plans are out of scope for drift
 * detection (in-flight plans legitimately have not transitioned their signals
 * yet). Decimal-phase directories like 58.1-... and suffixed names like
 * 58-12a-PLAN.md are matched via the permissive pattern.
 *
 * The pattern mirrors discoverLedgerFiles in kb.cjs (Plan 58 Wave 4) but
 * walks plan files instead of ledger files -- we don't re-export that helper
 * because its shape (single file per phase) does not match ours (multiple
 * plan files per phase). Keep the traversal here narrow and obvious.
 */
function discoverCompletedPlans(cwd) {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const out = [];
  if (!fs.existsSync(phasesDir)) return out;

  let phaseEntries;
  try { phaseEntries = fs.readdirSync(phasesDir, { withFileTypes: true }); } catch { return out; }

  for (const phaseEntry of phaseEntries) {
    if (!phaseEntry.isDirectory()) continue;
    const phaseDir = path.join(phasesDir, phaseEntry.name);
    let planFiles;
    try { planFiles = fs.readdirSync(phaseDir); } catch { continue; }

    // Match NN-PLAN.md including decimal and suffix forms: 58-11-PLAN.md,
    // 58.1-01-PLAN.md, 58-12a-PLAN.md.
    const planPattern = /^\d+(?:\.\d+[a-z]?)?-\d+[a-z]?-PLAN\.md$/;
    for (const file of planFiles) {
      if (!planPattern.test(file)) continue;
      const planPath = path.join(phaseDir, file);
      const summaryName = file.replace(/-PLAN\.md$/, '-SUMMARY.md');
      const summaryPath = path.join(phaseDir, summaryName);
      if (!fs.existsSync(summaryPath)) continue; // Plan not yet complete.
      out.push({ planPath, summaryPath, phaseDir: phaseEntry.name, fileName: file });
    }
  }
  return out;
}

function checkLifecycleVsPlan(cwd, db) {
  const plans = discoverCompletedPlans(cwd);
  const getLifecycleStmt = db.prepare('SELECT lifecycle_state FROM signals WHERE id = ?');

  const drifts = [];
  let plansScanned = 0;
  let referencesScanned = 0;

  for (const plan of plans) {
    let fm;
    try {
      const content = fs.readFileSync(plan.planPath, 'utf-8');
      fm = extractFrontmatter(content);
    } catch {
      continue;
    }
    plansScanned++;

    const resolvesSignals = fm && fm.resolves_signals;
    if (!Array.isArray(resolvesSignals) || resolvesSignals.length === 0) continue;

    for (const rawId of resolvesSignals) {
      if (typeof rawId !== 'string' || rawId.trim() === '') continue;
      const id = rawId.trim();
      referencesScanned++;
      const row = getLifecycleStmt.get(id);
      const state = row ? row.lifecycle_state : null;
      if (!state) {
        drifts.push({ plan: plan.fileName, phase_dir: plan.phaseDir, signal_id: id, state: null, reason: 'signal not found' });
      } else if (!TERMINAL_LIFECYCLE_STATES.has(state)) {
        drifts.push({ plan: plan.fileName, phase_dir: plan.phaseDir, signal_id: id, state, reason: 'not in remediated/verified' });
      }
    }
  }

  const status = drifts.length === 0 ? 'pass' : 'fail';
  return {
    status,
    plans_scanned: plansScanned,
    references_scanned: referencesScanned,
    drift_count: drifts.length,
    drifts,
    remediation: status === 'fail'
      ? "run 'kb transition <signal-id> --to remediated' for each drift, or invalidate the resolves_signals reference"
      : null,
  };
}

// ─── Check 3: Dual-write verification (KB-05 invariant) ─────────────────────

/**
 * Deterministic reservoir-free sampler: given a seed, pick K distinct
 * indices from N using a mulberry32 PRNG + Fisher-Yates on the first K. Tests
 * pass --seed for reproducibility; production calls default to a time-hash
 * seed so dual-write bugs that only show up on certain signals still have a
 * nonzero probability of being sampled over repeated runs.
 */
function mulberry32(a) {
  return function() {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleIndices(n, k, seed) {
  if (k >= n) return Array.from({ length: n }, (_, i) => i);
  const rng = mulberry32(seed | 0);
  const indices = Array.from({ length: n }, (_, i) => i);
  for (let i = 0; i < k; i++) {
    const j = i + Math.floor(rng() * (n - i));
    const tmp = indices[i]; indices[i] = indices[j]; indices[j] = tmp;
  }
  return indices.slice(0, k).sort((a, b) => a - b);
}

function checkDualWrite(cwd, db, options) {
  const kbDir = kb.getKbDir(cwd);
  const signalFiles = kb.discoverSignalFiles(kbDir);
  const totalFiles = signalFiles.length;

  if (totalFiles === 0) {
    return {
      status: 'pass',
      sample_size: 0,
      total_signals: 0,
      divergences: [],
      remediation: null,
    };
  }

  const seed = Number.isFinite(options.seed)
    ? options.seed
    : Math.floor(Date.now() / 1000) + totalFiles;
  const sampleSize = options.all ? totalFiles : Math.min(DUAL_WRITE_SAMPLE, totalFiles);
  const picks = options.all
    ? signalFiles.map((_, i) => i)
    : sampleIndices(totalFiles, sampleSize, seed);

  const getLifecycleStmt = db.prepare('SELECT lifecycle_state FROM signals WHERE id = ?');
  const divergences = [];

  for (const idx of picks) {
    const file = signalFiles[idx];
    let fm;
    try {
      const content = fs.readFileSync(file, 'utf-8');
      fm = extractFrontmatter(content);
    } catch {
      continue;
    }
    if (!fm || typeof fm.id !== 'string') continue;

    const fileState = (fm.lifecycle_state && typeof fm.lifecycle_state === 'string')
      ? fm.lifecycle_state
      : 'detected'; // defaults match signals.lifecycle_state DEFAULT
    const row = getLifecycleStmt.get(fm.id);
    const sqlState = row ? row.lifecycle_state : null;

    if (sqlState === null) {
      // File present, SQL row missing. That is a dual-write failure: rebuild
      // should have inserted the row.
      divergences.push({ signal_id: fm.id, file_state: fileState, sql_state: null, file: path.relative(cwd, file) });
    } else if (sqlState !== fileState) {
      divergences.push({ signal_id: fm.id, file_state: fileState, sql_state: sqlState, file: path.relative(cwd, file) });
    }
  }

  const status = divergences.length === 0 ? 'pass' : 'fail';
  return {
    status,
    sample_size: sampleSize,
    total_signals: totalFiles,
    seed: options.all ? null : seed,
    divergence_count: divergences.length,
    divergences,
    remediation: status === 'fail'
      ? "run 'kb rebuild' to re-sync from files (files are source of truth per KB-05)"
      : null,
  };
}

// ─── Check 4: depends_on freshness (advisory SUMMARY) ───────────────────────

/**
 * depends_on fields are human-readable strings per knowledge-store.md §4
 * ("prisma >= 4.0", "src/lib/auth.ts exists", "NOT monorepo"). We cannot
 * judge semantic staleness -- that's the ontological limit research Pitfall
 * C4 / D2 flagged. What we CAN do is pick out the path-like refs and report
 * which resolve vs which are dangling, as a heuristic for agents reading
 * these entries.
 *
 * The check is always SUMMARY (never FAIL). Exit code is unaffected.
 */
function looksLikePath(ref) {
  if (typeof ref !== 'string') return false;
  const s = ref.trim();
  if (!s) return false;
  // Heuristic: contains a path separator or a known file extension, and does
  // not contain spaces (filenames with spaces are rare in this corpus).
  if (/\s/.test(s)) return false;
  return /[/\\]/.test(s) || /\.(md|ts|tsx|js|jsx|cjs|mjs|json|toml|yml|yaml|sql|py|rs|go|sh|test\.js)$/i.test(s);
}

function checkDependsOnFreshness(cwd, db) {
  const kbDir = kb.getKbDir(cwd);
  const signalFiles = kb.discoverSignalFiles(kbDir);
  const spikeFiles = kb.discoverSpikeFiles(kbDir);

  const entriesWithDependsOn = [];
  let dangling = 0;
  let resolving = 0;
  let nonPathRefs = 0;

  for (const file of [...signalFiles, ...spikeFiles]) {
    let fm;
    try {
      const content = fs.readFileSync(file, 'utf-8');
      fm = extractFrontmatter(content);
    } catch {
      continue;
    }
    if (!fm || !fm.depends_on) continue;
    const refs = Array.isArray(fm.depends_on) ? fm.depends_on : [fm.depends_on];
    if (refs.length === 0) continue;

    const entryDangling = [];
    for (const ref of refs) {
      if (!looksLikePath(ref)) {
        nonPathRefs++;
        continue;
      }
      const absPath = path.isAbsolute(ref) ? ref : path.join(cwd, ref);
      if (fs.existsSync(absPath)) {
        resolving++;
      } else {
        dangling++;
        entryDangling.push(ref);
      }
    }
    if (refs.length > 0) {
      entriesWithDependsOn.push({
        file: path.relative(cwd, file),
        id: fm.id || path.basename(file, '.md'),
        refs_total: refs.length,
        dangling: entryDangling,
      });
    }
  }

  return {
    status: 'summary',
    entries_with_depends_on: entriesWithDependsOn.length,
    refs_resolving: resolving,
    refs_dangling: dangling,
    refs_non_path: nonPathRefs,
    entries: entriesWithDependsOn,
  };
}

// ─── Rendering ──────────────────────────────────────────────────────────────

function renderHealthReport(result, options) {
  const { checks, exit_code: exitCode } = result;

  console.log('KB Health — four-check contract');
  console.log('');

  // Check 1
  const e = checks.edge_integrity;
  if (e.status === 'pass') {
    const pct = (e.orphan_rate * 100).toFixed(1);
    console.log(`Check 1 — PASS: edge integrity — 0 malformed, ${e.orphaned} orphaned (${pct}% of ${e.total})`);
  } else {
    console.log(`Check 1 — FAIL: edge integrity — ${e.malformed} malformed, ${e.orphaned} orphaned. ${e.remediation}`);
    if (e.reasons && e.reasons.length) {
      for (const r of e.reasons) console.log(`           reason: ${r}`);
    }
  }
  console.log('');

  // Check 2
  const l = checks.lifecycle_vs_plan;
  if (l.status === 'pass') {
    console.log(`Check 2 — PASS: lifecycle-vs-plan consistency — ${l.references_scanned} resolves_signals reference(s) across ${l.plans_scanned} completed plan(s) resolve to remediated/verified`);
  } else {
    console.log(`Check 2 — FAIL: lifecycle-vs-plan consistency — ${l.drift_count} drift(s):`);
    const toShow = (options && options.verbose) ? l.drifts : l.drifts.slice(0, 5);
    for (const d of toShow) {
      const stateStr = d.state === null ? "not found" : `in state '${d.state}'`;
      console.log(`           ${d.plan} resolves_signals[${d.signal_id}] is ${stateStr}, expected remediated/verified`);
    }
    if (!options.verbose && l.drifts.length > toShow.length) {
      console.log(`           ... and ${l.drifts.length - toShow.length} more (use --verbose to see all)`);
    }
    console.log(`           ${l.remediation}`);
  }
  console.log('');

  // Check 3
  const d = checks.dual_write;
  if (d.status === 'pass') {
    console.log(`Check 3 — PASS: dual-write invariant — ${d.sample_size}/${d.total_signals} signals sampled; all file and SQL lifecycle_state match`);
  } else {
    console.log(`Check 3 — FAIL: dual-write invariant — ${d.divergence_count}/${d.sample_size} signals diverge:`);
    for (const div of d.divergences.slice(0, 3)) {
      console.log(`           ${div.signal_id}: file=${div.file_state}, sql=${div.sql_state || 'MISSING'}`);
    }
    if (d.divergences.length > 3) {
      console.log(`           ... and ${d.divergences.length - 3} more`);
    }
    console.log(`           ${d.remediation}`);
  }
  console.log('');

  // Check 4
  const f = checks.depends_on_freshness;
  console.log(`Check 4 — SUMMARY: depends_on freshness — ${f.entries_with_depends_on} KB entries carry depends_on; ${f.refs_resolving} path-like references resolve, ${f.refs_dangling} dangling, ${f.refs_non_path} non-path refs (advisory, not a gate)`);
  if ((options.verbose || options.format === 'json') && f.refs_dangling > 0) {
    for (const entry of f.entries) {
      if (entry.dangling.length === 0) continue;
      console.log(`           ${entry.id}: dangling ${entry.dangling.join(', ')}`);
    }
  }
  console.log('');

  if (exitCode === 0) {
    console.log('Overall: PASS (exit 0)');
  } else {
    const bits = [];
    if (exitCode & EXIT_BIT_EDGE) bits.push('edge_integrity');
    if (exitCode & EXIT_BIT_LIFECYCLE) bits.push('lifecycle_vs_plan');
    if (exitCode & EXIT_BIT_DUAL_WRITE) bits.push('dual_write');
    console.log(`Overall: FAIL (exit ${exitCode} — ${bits.join(' + ')})`);
  }
}

// ─── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  cmdKbHealth,
  parseKbHealthOptions,
  // Test-only: direct access so unit tests can invoke a single check against
  // a fixture db + cwd without shelling out to the router.
  __testOnly_checkEdgeIntegrity: checkEdgeIntegrity,
  __testOnly_checkLifecycleVsPlan: checkLifecycleVsPlan,
  __testOnly_checkDualWrite: checkDualWrite,
  __testOnly_checkDependsOnFreshness: checkDependsOnFreshness,
  __testOnly_sampleIndices: sampleIndices,
  __testOnly_looksLikePath: looksLikePath,
};
