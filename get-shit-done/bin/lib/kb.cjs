/**
 * KB -- Knowledge base SQLite index operations
 *
 * Provides cmdKbRebuild, cmdKbStats, and cmdKbMigrate for building and
 * managing a SQLite index over the signal/spike markdown files.
 *
 * IMPORTANT: node:sqlite is lazy-required (see getDbSync) to prevent
 * gsd-tools.cjs from failing on Node <22.5.0 for non-KB commands.
 * See RESEARCH.md Pitfall 7.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');

const { extractFrontmatter, reconstructFrontmatter, spliceFrontmatter } = require('./frontmatter.cjs');
const { output, error } = require('./core.cjs');
const { buildLegacyFlatEcho } = require('./provenance.cjs');

// ─── Node version guard (lazy require) ───────────────────────────────────────

let _DatabaseSync = null;

function getDbSync() {
  if (_DatabaseSync) return _DatabaseSync;
  try {
    _DatabaseSync = require('node:sqlite').DatabaseSync;
    return _DatabaseSync;
  } catch (e) {
    const nodeVersion = process.version;
    console.error(
      `Error: node:sqlite requires Node.js >= 22.5.0 (current: ${nodeVersion})\n` +
      'The KB commands need the built-in SQLite module.\n' +
      'Upgrade Node.js: https://nodejs.org/en/download\n' +
      'Or use nvm: nvm install 22 && nvm use 22'
    );
    process.exit(1);
  }
}

// ─── Path resolution ──────────────────────────────────────────────────────────

function getKbDir(cwd) {
  const localKb = path.join(cwd, '.planning', 'knowledge');
  if (fs.existsSync(localKb)) return localKb;
  const globalKb = path.join(process.env.GSD_HOME || path.join(os.homedir(), '.gsd'), 'knowledge');
  return globalKb;
}

function getDbPath(cwd) {
  return path.join(getKbDir(cwd), 'kb.db');
}

// ─── Database initialization ──────────────────────────────────────────────────

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      project TEXT NOT NULL DEFAULT '',
      severity TEXT NOT NULL DEFAULT 'minor',
      lifecycle_state TEXT DEFAULT 'detected',
      polarity TEXT DEFAULT 'negative',
      signal_category TEXT DEFAULT 'negative',
      disposition TEXT DEFAULT '',
      signal_type TEXT DEFAULT '',
      detection_method TEXT DEFAULT '',
      origin TEXT DEFAULT '',
      created TEXT NOT NULL DEFAULT '',
      updated TEXT DEFAULT '',
      phase TEXT DEFAULT '',
      plan TEXT DEFAULT '',
      provenance_schema TEXT DEFAULT '',
      provenance_status TEXT DEFAULT '',
      about_work_json TEXT DEFAULT '',
      detected_by_json TEXT DEFAULT '',
      written_by_json TEXT DEFAULT '',
      runtime TEXT DEFAULT '',
      model TEXT DEFAULT '',
      gsd_version TEXT DEFAULT '',
      occurrence_count INTEGER DEFAULT 1,
      durability TEXT DEFAULT '',
      confidence TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'active',
      content_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS signal_tags (
      signal_id TEXT NOT NULL REFERENCES signals(id),
      tag TEXT NOT NULL,
      PRIMARY KEY (signal_id, tag)
    );

    CREATE TABLE IF NOT EXISTS signal_links (
      source_id TEXT NOT NULL REFERENCES signals(id),
      target_id TEXT NOT NULL,
      link_type TEXT NOT NULL,
      created_at TEXT DEFAULT '',
      source_content_hash TEXT DEFAULT '',
      PRIMARY KEY (source_id, target_id, link_type)
    );

    CREATE TABLE IF NOT EXISTS spikes (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      project TEXT DEFAULT '',
      hypothesis TEXT DEFAULT '',
      outcome TEXT DEFAULT '',
      created TEXT DEFAULT '',
      updated TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      content_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS spike_tags (
      spike_id TEXT NOT NULL REFERENCES spikes(id),
      tag TEXT NOT NULL,
      PRIMARY KEY (spike_id, tag)
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  ensureColumn(db, 'signals', 'provenance_schema', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'provenance_status', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'about_work_json', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'detected_by_json', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'written_by_json', "TEXT DEFAULT ''");

  // Phase 58 Plan 04 (GATE-09a): additive `ledger_entries` table. Files under
  // .planning/phases/*/NN-LEDGER.md are the source of truth; this table is a
  // derived cache per PROV-05 / KB-05 dual-write invariant. Additive only --
  // existing tables are not modified.
  db.exec(`
    CREATE TABLE IF NOT EXISTS ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phase TEXT NOT NULL,
      context_claim TEXT NOT NULL,
      disposition TEXT NOT NULL CHECK(disposition IN ('implemented_this_phase','explicitly_deferred','rejected_with_reason','left_open_blocking_planning')),
      load_bearing INTEGER NOT NULL,
      target_phase_if_deferred TEXT,
      narrowing_originating_claim TEXT,
      narrowing_rationale TEXT,
      narrowing_decision TEXT,
      evidence_paths_json TEXT,
      written_by TEXT,
      written_at TEXT,
      session_id TEXT,
      source_file TEXT NOT NULL,
      indexed_at TEXT NOT NULL,
      UNIQUE(phase, context_claim)
    );
  `);

  // Indexes for common query patterns
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_signals_severity ON signals(severity);
    CREATE INDEX IF NOT EXISTS idx_signals_lifecycle ON signals(lifecycle_state);
    CREATE INDEX IF NOT EXISTS idx_signals_project ON signals(project);
    CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created);
    CREATE INDEX IF NOT EXISTS idx_signals_polarity ON signals(polarity);
    CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
    CREATE INDEX IF NOT EXISTS idx_signals_provenance_schema ON signals(provenance_schema);
    CREATE INDEX IF NOT EXISTS idx_ledger_phase ON ledger_entries(phase);
    CREATE INDEX IF NOT EXISTS idx_ledger_disposition ON ledger_entries(disposition);
  `);

  // Phase 59 KB-04c: inbound-edge lookups on signal_links(target_id, link_type)
  // plan as SEARCH ... USING INDEX, not SCAN. Without this index,
  // `SELECT source_id FROM signal_links WHERE target_id = ?` is O(N) per
  // call -- becomes a bottleneck as corpus grows past ~1000 signals. The
  // composite (target_id, link_type) supports both bare inbound queries and
  // inbound-filtered-by-link-type queries.
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_signal_links_target ON signal_links(target_id, link_type);
  `);

  // Phase 59 schema v2 -> v3 migration: signal_links gained created_at and
  // source_content_hash columns (audit §7.1 #8 edge provenance minimum) and
  // signal_fts was reintroduced as an FTS5 external-content contentless
  // rewrite. On an existing v2 kb.db, signal_links lacks the new columns, so
  // we must add them idempotently before cmdKbRebuild tries to INSERT with
  // the new column list. ensureColumn is a no-op if the column already exists.
  ensureColumn(db, 'signal_links', 'created_at', "TEXT DEFAULT ''");
  ensureColumn(db, 'signal_links', 'source_content_hash', "TEXT DEFAULT ''");

  // Phase 59 KB-04b: signals.title and signals.body columns carry the
  // derived H2-derived title and post-frontmatter body text that FTS5
  // indexes. Option (i) from 59-RESEARCH.md -- declarative column shape over
  // trigger-inline derivation. Populated on every INSERT OR REPLACE during
  // rebuild so FTS stays coherent with signals via the AFTER triggers below.
  ensureColumn(db, 'signals', 'title', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'body', "TEXT DEFAULT ''");

  // Phase 59 schema v2 -> v3 FTS substrate migration. Detect an older
  // schema_version and drop any pre-existing signal_fts + AFTER triggers
  // before recreating them with the new shape. Doing this BEFORE the FTS
  // re-creation avoids a class of FTS5 "database disk image is malformed"
  // errors when the AFTER-DELETE/UPDATE trigger tries to delete rows from
  // an empty FTS index. On a version bump, we also clear the signals/tags/
  // links rows here (pre-triggers) so the subsequent rebuild re-populates
  // everything via the new-shape INSERT path. The rebuild's own transaction
  // then fires the new signals_ai INSERT triggers to populate signal_fts.
  const metaHasRow = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='meta'"
  ).get();
  const schemaVersionRow = metaHasRow
    ? db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get()
    : null;
  const priorSchemaVersion = schemaVersionRow ? schemaVersionRow.value : null;
  if (priorSchemaVersion !== '3') {
    // Drop any lingering FTS triggers and shadow tables. IF EXISTS keeps this
    // idempotent on fresh installs (nothing to drop) and cleans up any
    // half-created Phase 57.7 drop-residue or earlier Phase 59 partial state.
    db.exec(`
      DROP TRIGGER IF EXISTS signals_ai;
      DROP TRIGGER IF EXISTS signals_ad;
      DROP TRIGGER IF EXISTS signals_au;
      DROP TABLE IF EXISTS signal_fts;
    `);
    // Clear legacy rows now -- before the new triggers exist -- so the
    // rebuild loop re-inserts everything fresh into the new schema.
    // Order: signal_links FK-references signals(id), so edges first. This
    // avoids the FTS5 malformed-disk-image error that would fire if the
    // AFTER DELETE trigger tried to remove rows from an empty FTS index.
    // This block runs only on schema upgrade, not on incremental rebuilds.
    db.exec('DELETE FROM signal_links');
    db.exec('DELETE FROM signal_tags');
    db.exec('DELETE FROM signals');
  }

  // Phase 59 KB-04b: FTS5 external-content contentless rewrite. The virtual
  // table indexes signals.title and signals.body without duplicating the
  // body text. Three AFTER triggers (ai/ad/au) keep the FTS index coherent
  // with future writes on signals. Existing rows are populated post-rebuild
  // via `INSERT INTO signal_fts(signal_fts) VALUES('rebuild')` in
  // cmdKbRebuild's schema-version-bump migration path.
  //
  // This replaces (does NOT revive) the Phase 57.7-dropped signal_fts --
  // that one was a canonical-row expansion referencing nonexistent columns.
  // Per 59-RESEARCH.md Pitfall 1: this re-entry is content='signals'
  // contentless-rewrite with porter+unicode61 tokenizer, which is the
  // correct shape.
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS signal_fts USING fts5(
      id UNINDEXED,
      title,
      body,
      content='signals',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS signals_ai AFTER INSERT ON signals BEGIN
      INSERT INTO signal_fts(rowid, id, title, body)
      VALUES (new.rowid, new.id, new.title, new.body);
    END;

    CREATE TRIGGER IF NOT EXISTS signals_ad AFTER DELETE ON signals BEGIN
      INSERT INTO signal_fts(signal_fts, rowid, id, title, body)
      VALUES ('delete', old.rowid, old.id, old.title, old.body);
    END;

    CREATE TRIGGER IF NOT EXISTS signals_au AFTER UPDATE ON signals BEGIN
      INSERT INTO signal_fts(signal_fts, rowid, id, title, body)
      VALUES ('delete', old.rowid, old.id, old.title, old.body);
      INSERT INTO signal_fts(rowid, id, title, body)
      VALUES (new.rowid, new.id, new.title, new.body);
    END;
  `);
}

function ensureColumn(db, tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (columns.some(column => column.name === columnName)) return;
  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

function openKbDb(dbPath) {
  const DatabaseSync = getDbSync();
  // Ensure parent directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  db.exec('PRAGMA journal_mode=WAL');
  db.exec('PRAGMA busy_timeout=5000');
  initSchema(db);
  return db;
}

// ─── File discovery ───────────────────────────────────────────────────────────

function discoverSignalFiles(kbDir) {
  const signalsDir = path.join(kbDir, 'signals');
  const files = [];
  if (!fs.existsSync(signalsDir)) return files;

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.md')) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  walk(signalsDir);
  return files;
}

function discoverSpikeFiles(kbDir) {
  const spikesDir = path.join(kbDir, 'spikes');
  const files = [];
  if (!fs.existsSync(spikesDir)) return files;

  function walk(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.md')) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  walk(spikesDir);
  return files;
}

// Phase 58 Plan 04 (GATE-09a): discover NN-LEDGER.md files under .planning/phases/*/.
// Matches the standalone-ledger layout decided in 58-RESEARCH.md R6 (Layout 1).
// Files are the source of truth; this function supplies the `kb rebuild` feeder.
function discoverLedgerFiles(cwd) {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  const files = [];
  if (!fs.existsSync(phasesDir)) return files;

  let entries;
  try {
    entries = fs.readdirSync(phasesDir, { withFileTypes: true });
  } catch {
    return files;
  }

  // Pattern: Phase-scoped `NN-LEDGER.md` directly inside a phase dir.
  // Matches: 58-LEDGER.md, 57.7-LEDGER.md, 58.12a-LEDGER.md.
  // Does NOT match: UPSTREAM-DRIFT-LEDGER.md (pre-GATE-09a artifact),
  // 58-04-ledger-schema.md (schema spec), arbitrary notes containing "ledger".
  // Do NOT recurse into subdirectories.
  const ledgerNamePattern = /^\d+(\.\d+[a-z]?)?-LEDGER\.md$/;
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const phaseDir = path.join(phasesDir, entry.name);
    let phaseEntries;
    try {
      phaseEntries = fs.readdirSync(phaseDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const child of phaseEntries) {
      if (!child.isFile()) continue;
      if (ledgerNamePattern.test(child.name)) {
        files.push(path.join(phaseDir, child.name));
      }
    }
  }
  return files;
}

// ─── Content hashing ──────────────────────────────────────────────────────────

function contentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

// ─── Normalization helpers ────────────────────────────────────────────────────

function normalizeSeverity(sev) {
  // Pass through standard values; map legacy high/medium/low to critical/notable/minor
  if (!sev) return 'minor';
  const map = { high: 'critical', medium: 'notable', low: 'minor' };
  return map[sev] || sev;
}

function normalizeStatus(status) {
  // Legacy values: open, resolved, remediated, detected -> all mean active
  if (!status || status === 'open' || status === 'resolved' ||
      status === 'remediated' || status === 'detected') return 'active';
  return status; // active, archived
}

function normalizeLifecycleFromStatus(status) {
  // If no lifecycle_state but status hints at lifecycle position
  if (status === 'remediated' || status === 'resolved') return 'remediated';
  return 'detected';
}

function normalizeSignalType(fm) {
  // Legacy signals put signal_type values in the type field
  if (fm.signal_type) return fm.signal_type;
  const legacyTypeMap = {
    'observation': 'deviation',
    'architecture': 'capability-gap',
    'positive-pattern': 'good-pattern',
    'positive_pattern': 'good-pattern',
    'deviation': 'deviation',
    'struggle': 'struggle',
    'config-mismatch': 'config-mismatch',
    'capability-gap': 'capability-gap',
    'process-gap': 'capability-gap',
  };
  if (fm.type !== 'signal' && legacyTypeMap[fm.type]) return legacyTypeMap[fm.type];
  return '';
}

function mapSourceToDetectionMethod(source) {
  if (!source) return 'unknown';
  if (source === 'manual') return 'manual';
  if (source === 'auto' || source === 'automated' || source === 'auto-collected') return 'automated';
  if (source === 'deliberation-trigger') return 'manual';
  if (typeof source === 'string' && (source.includes('SUMMARY.md') || source.includes('PLAN.md'))) return 'automated';
  return 'unknown';
}

function mapSourceToOrigin(source) {
  if (!source) return 'unknown';
  if (source === 'manual') return 'user-observation';
  if (source === 'auto' || source === 'automated' || source === 'auto-collected') return 'collect-signals';
  if (source === 'deliberation-trigger') return 'deliberation-trigger';
  if (typeof source === 'string' && (source.includes('SUMMARY.md') || source.includes('PLAN.md'))) return 'plan-summary';
  return 'unknown';
}

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function stringifyStructuredField(value) {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value) && value.length === 0) return '';
  if (isPlainObject(value) && Object.keys(value).length === 0) return '';
  try {
    return JSON.stringify(value);
  } catch {
    return '';
  }
}

function normalizeStructuredProvenance(fm) {
  return {
    about_work: Array.isArray(fm.about_work) ? fm.about_work : [],
    detected_by: isPlainObject(fm.detected_by) ? fm.detected_by : null,
    written_by: isPlainObject(fm.written_by) ? fm.written_by : null,
  };
}

function hasSplitProvenance(fm) {
  return (
    Array.isArray(fm.about_work) ||
    isPlainObject(fm.detected_by) ||
    isPlainObject(fm.written_by)
  );
}

function deriveProvenanceSchema(fm) {
  if (typeof fm.provenance_schema === 'string' && fm.provenance_schema.trim()) {
    return fm.provenance_schema.trim();
  }
  if (hasSplitProvenance(fm)) return 'v2_split';
  if (fm.runtime || fm.model || fm.gsd_version || fm.provenance_status === 'legacy_mixed') return 'v1_legacy';
  return '';
}

function deriveTopLevelProvenanceStatus(fm) {
  if (typeof fm.provenance_status === 'string') return fm.provenance_status.trim();
  if (fm.provenance_status === undefined || fm.provenance_status === null) return '';
  return stringifyStructuredField(fm.provenance_status);
}

// ─── Frontmatter-to-row mapping ───────────────────────────────────────────────

// Phase 59 KB-04b: derive title from first H2 heading in the post-frontmatter
// body; fall back to empty string. Strip leading/trailing whitespace. Used to
// populate signals.title for FTS5 indexing.
function deriveTitleFromBody(body) {
  if (typeof body !== 'string' || !body) return '';
  const match = body.match(/^##\s+(.+?)\s*$/m);
  return match ? match[1].trim() : '';
}

// Phase 59 KB-04b: strip the frontmatter block from raw markdown, leaving the
// body text. Matches the same regex shape extractFrontmatter uses. Populates
// signals.body for FTS5 indexing. Returns the full original content if no
// frontmatter is present.
function extractBodyFromContent(content) {
  if (typeof content !== 'string') return '';
  const match = content.match(/^---\r?\n[\s\S]+?\r?\n---\r?\n?/);
  if (!match) return content;
  return content.slice(match[0].length);
}

function signalToRow(fm, filePath, hash, rawContent) {
  const structuredProvenance = normalizeStructuredProvenance(fm);
  const legacyEcho = buildLegacyFlatEcho(structuredProvenance);
  const body = extractBodyFromContent(rawContent || '');
  const title = deriveTitleFromBody(body);

  return {
    id: fm.id || path.basename(filePath, '.md'),
    file_path: filePath,
    project: fm.project || '',
    severity: normalizeSeverity(fm.severity),
    lifecycle_state: fm.lifecycle_state || normalizeLifecycleFromStatus(fm.status),
    polarity: fm.polarity || 'negative',
    signal_category: fm.signal_category || (fm.polarity === 'positive' ? 'positive' : 'negative'),
    disposition: fm.response_disposition || fm.disposition || '',
    signal_type: normalizeSignalType(fm),
    detection_method: fm.detection_method || mapSourceToDetectionMethod(fm.source),
    origin: fm.origin || mapSourceToOrigin(fm.source),
    created: fm.created || fm.date || '',
    updated: fm.updated || fm.created || fm.date || '',
    phase: String(fm.phase || ''),
    plan: String(fm.plan || ''),
    provenance_schema: deriveProvenanceSchema(fm),
    provenance_status: deriveTopLevelProvenanceStatus(fm),
    about_work_json: stringifyStructuredField(structuredProvenance.about_work),
    detected_by_json: stringifyStructuredField(structuredProvenance.detected_by),
    written_by_json: stringifyStructuredField(structuredProvenance.written_by),
    runtime: fm.runtime || legacyEcho.runtime || '',
    model: fm.model || legacyEcho.model || '',
    gsd_version: fm.gsd_version || legacyEcho.gsd_version || '',
    occurrence_count: parseInt(fm.occurrence_count, 10) || 1,
    durability: fm.durability || '',
    confidence: fm.confidence || 'medium',
    status: normalizeStatus(fm.status),
    content_hash: hash,
    title,
    body,
  };
}

function spikeToRow(fm, filePath, hash) {
  return {
    id: fm.id || path.basename(filePath, '.md'),
    file_path: filePath,
    project: fm.project || '',
    hypothesis: fm.hypothesis || '',
    outcome: fm.outcome || '',
    created: fm.created || fm.date || '',
    updated: fm.updated || fm.created || fm.date || '',
    status: (fm.status === 'archived') ? 'archived' : 'active',
    content_hash: hash,
  };
}

// Phase 58 Plan 04 (GATE-09a): map a single ledger entry from parsed frontmatter
// into a row for the `ledger_entries` table. Tolerant of partial entries: bad
// or missing fields surface as empty strings or nulls rather than throwing, so
// one malformed entry does not abort the whole rebuild. Validation is a
// separate concern (frontmatter.cjs --schema ledger); this is pure projection.
function normalizeLoadBearing(value) {
  if (value === true || value === 'true' || value === 1 || value === '1') return 1;
  return 0;
}

function ledgerEntryToRow(entry, phase, relPath, indexedAt) {
  const rsp = (entry && typeof entry === 'object' && entry.role_split_provenance) || {};
  const np = (entry && typeof entry === 'object' && entry.narrowing_provenance) || {};
  let evidencePathsJson = null;
  if (Array.isArray(entry.evidence_paths)) {
    try {
      evidencePathsJson = JSON.stringify(entry.evidence_paths);
    } catch {
      evidencePathsJson = null;
    }
  }
  return {
    phase: String(phase || ''),
    context_claim: String(entry.context_claim || ''),
    disposition: String(entry.disposition || ''),
    load_bearing: normalizeLoadBearing(entry.load_bearing),
    target_phase_if_deferred: entry.target_phase_if_deferred ? String(entry.target_phase_if_deferred) : null,
    narrowing_originating_claim: np.originating_claim ? String(np.originating_claim) : null,
    narrowing_rationale: np.rationale ? String(np.rationale) : null,
    narrowing_decision: np.narrowing_decision ? String(np.narrowing_decision) : null,
    evidence_paths_json: evidencePathsJson,
    written_by: rsp.written_by ? String(rsp.written_by) : null,
    written_at: rsp.written_at ? String(rsp.written_at) : null,
    session_id: rsp.session_id ? String(rsp.session_id) : null,
    source_file: relPath,
    indexed_at: indexedAt,
  };
}

// ─── Tags extraction ──────────────────────────────────────────────────────────

function extractTags(fm) {
  if (!fm.tags) return [];
  if (Array.isArray(fm.tags)) return fm.tags.map(t => String(t).trim()).filter(Boolean);
  if (typeof fm.tags === 'string') return fm.tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}

// ─── Links extraction ─────────────────────────────────────────────────────────

function extractLinks(fm, signalId) {
  // Phase 59 R12: uniform typeof-string guard across all four link types.
  // The YAML parser coerces bare keys like `recurrence_of:` (no value) to
  // `{}` (empty object). Without the typeof guard, `String({}).trim()` is
  // `"[object Object]"` -- truthy, non-empty -- and gets inserted as a
  // malformed target_id. That single bug produced 107 malformed rows on the
  // live corpus. Guarding each scalar/element on `typeof === 'string'`
  // structurally eliminates the [object Object] bug class across
  // qualified_by, superseded_by, related_signals, AND recurrence_of at once.
  const links = [];
  function pushIfValidString(value, linkType) {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed) return;
    links.push({ source_id: signalId, target_id: trimmed, link_type: linkType });
  }

  // qualified_by: array of IDs (or single ID string)
  if (fm.qualified_by) {
    const ids = Array.isArray(fm.qualified_by) ? fm.qualified_by : [fm.qualified_by];
    for (const targetId of ids) {
      pushIfValidString(targetId, 'qualified_by');
    }
  }
  // superseded_by: single ID
  pushIfValidString(fm.superseded_by, 'superseded_by');
  // related_signals: array of IDs (or single ID string)
  if (fm.related_signals) {
    const ids = Array.isArray(fm.related_signals) ? fm.related_signals : [fm.related_signals];
    for (const targetId of ids) {
      pushIfValidString(targetId, 'related_to');
    }
  }
  // recurrence_of: single ID
  pushIfValidString(fm.recurrence_of, 'recurrence_of');
  return links;
}

// ─── cmdKbRebuild ─────────────────────────────────────────────────────────────

function cmdKbRebuild(cwd, raw) {
  const kbDir = getKbDir(cwd);
  const dbPath = getDbPath(cwd);
  const db = openKbDb(dbPath);

  const signalFiles = discoverSignalFiles(kbDir);
  const spikeFiles = discoverSpikeFiles(kbDir);
  const ledgerFiles = discoverLedgerFiles(cwd);

  let signalsAdded = 0;
  let signalsUpdated = 0;
  let signalsSkipped = 0;
  let spikesAdded = 0;
  let spikesUpdated = 0;
  let spikesSkipped = 0;
  let ledgerEntriesIndexed = 0;
  let ledgerFilesProcessed = 0;
  let errors = 0;
  const errorDetails = [];

  // Phase 59: schema v2 -> v3 migration ran in initSchema (dropped old FTS,
  // cleared legacy rows). The rebuild loop below re-inserts every signal
  // fresh, firing the new signals_ai AFTER INSERT trigger to populate
  // signal_fts row-by-row and attaching created_at/source_content_hash to
  // every edge.

  // Prepared statements
  const getSignalHash = db.prepare('SELECT content_hash FROM signals WHERE file_path = ?');
  const insertSignal = db.prepare(`
    INSERT OR REPLACE INTO signals
      (id, file_path, project, severity, lifecycle_state, polarity, signal_category,
       disposition, signal_type, detection_method, origin, created, updated, phase, plan,
       provenance_schema, provenance_status, about_work_json, detected_by_json, written_by_json,
       runtime, model, gsd_version, occurrence_count, durability, confidence, status, content_hash,
       title, body)
    VALUES
      (@id, @file_path, @project, @severity, @lifecycle_state, @polarity, @signal_category,
       @disposition, @signal_type, @detection_method, @origin, @created, @updated, @phase, @plan,
       @provenance_schema, @provenance_status, @about_work_json, @detected_by_json, @written_by_json,
       @runtime, @model, @gsd_version, @occurrence_count, @durability, @confidence, @status, @content_hash,
       @title, @body)
  `);
  const deleteSignalTags = db.prepare('DELETE FROM signal_tags WHERE signal_id = ?');
  const insertSignalTag = db.prepare('INSERT OR IGNORE INTO signal_tags (signal_id, tag) VALUES (?, ?)');
  const deleteSignalLinks = db.prepare('DELETE FROM signal_links WHERE source_id = ?');
  // Phase 59 audit §7.1 #8: edge provenance minimum. Every signal_links row
  // carries the rebuild-time ISO timestamp and the sha256 content hash of the
  // source signal file, populated on INSERT. These enable cheap forensic
  // work later without adding an edge-as-entity migration.
  const insertSignalLink = db.prepare(
    'INSERT OR IGNORE INTO signal_links (source_id, target_id, link_type, created_at, source_content_hash) VALUES (?, ?, ?, ?, ?)'
  );

  const getSpikeHash = db.prepare('SELECT content_hash FROM spikes WHERE file_path = ?');
  const insertSpike = db.prepare(`
    INSERT OR REPLACE INTO spikes
      (id, file_path, project, hypothesis, outcome, created, updated, status, content_hash)
    VALUES
      (@id, @file_path, @project, @hypothesis, @outcome, @created, @updated, @status, @content_hash)
  `);
  const deleteSpikeTags = db.prepare('DELETE FROM spike_tags WHERE spike_id = ?');
  const insertSpikeTag = db.prepare('INSERT OR IGNORE INTO spike_tags (spike_id, tag) VALUES (?, ?)');

  // Phase 58 Plan 04 (GATE-09a): ledger_entries prepared statements. Per-ledger-file
  // strategy is "delete existing rows for (source_file) then insert all entries" --
  // simpler than per-entry hash tracking, and the file is the unit of truth anyway.
  const deleteLedgerEntriesForFile = db.prepare('DELETE FROM ledger_entries WHERE source_file = ?');
  const insertLedgerEntry = db.prepare(`
    INSERT OR REPLACE INTO ledger_entries
      (phase, context_claim, disposition, load_bearing, target_phase_if_deferred,
       narrowing_originating_claim, narrowing_rationale, narrowing_decision,
       evidence_paths_json, written_by, written_at, session_id, source_file, indexed_at)
    VALUES
      (@phase, @context_claim, @disposition, @load_bearing, @target_phase_if_deferred,
       @narrowing_originating_claim, @narrowing_rationale, @narrowing_decision,
       @evidence_paths_json, @written_by, @written_at, @session_id, @source_file, @indexed_at)
  `);

  db.exec('BEGIN TRANSACTION');
  try {
    // Process signal files
    for (const filePath of signalFiles) {
      const relPath = path.relative(kbDir, filePath);
      let content;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Read error: ${e.message}` });
        continue;
      }

      const hash = contentHash(content);
      const existing = getSignalHash.get(relPath);

      if (existing && existing.content_hash === hash) {
        signalsSkipped++;
        continue;
      }

      let fm;
      try {
        fm = extractFrontmatter(content);
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Parse error: ${e.message}` });
        continue;
      }

      try {
        const row = signalToRow(fm, relPath, hash, content);
        const isNew = !existing;
        insertSignal.run(row);

        // Replace tags
        deleteSignalTags.run(row.id);
        const tags = extractTags(fm);
        for (const tag of tags) {
          insertSignalTag.run(row.id, tag);
        }

        // Replace links. Phase 59 audit §7.1 #8: populate edge provenance
        // (created_at = rebuild time; source_content_hash = hash already
        // computed for this source signal file -- avoids a second file read).
        deleteSignalLinks.run(row.id);
        const linkInsertedAt = new Date().toISOString();
        const links = extractLinks(fm, row.id);
        for (const link of links) {
          insertSignalLink.run(
            link.source_id,
            link.target_id,
            link.link_type,
            linkInsertedAt,
            hash
          );
        }

        if (isNew) signalsAdded++;
        else signalsUpdated++;
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Index error: ${e.message}` });
      }
    }

    // Process spike files
    for (const filePath of spikeFiles) {
      const relPath = path.relative(kbDir, filePath);
      let content;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Read error: ${e.message}` });
        continue;
      }

      const hash = contentHash(content);
      const existing = getSpikeHash.get(relPath);

      if (existing && existing.content_hash === hash) {
        spikesSkipped++;
        continue;
      }

      let fm;
      try {
        fm = extractFrontmatter(content);
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Parse error: ${e.message}` });
        continue;
      }

      try {
        const row = spikeToRow(fm, relPath, hash);
        const isNew = !existing;
        insertSpike.run(row);

        // Replace tags
        deleteSpikeTags.run(row.id);
        const tags = extractTags(fm);
        for (const tag of tags) {
          insertSpikeTag.run(row.id, tag);
        }

        if (isNew) spikesAdded++;
        else spikesUpdated++;
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Index error: ${e.message}` });
      }
    }

    // Phase 58 Plan 04 (GATE-09a): process ledger files. NN-LEDGER.md files live
    // under .planning/phases/*/ (not under the KB dir); paths are made relative
    // to cwd for portability. Per-file strategy: delete any prior rows for this
    // source_file, then insert each entry. A malformed entry increments errors
    // but does not abort the file -- individual bad entries are tolerated so one
    // mistake does not drop the whole ledger from the index.
    const now = new Date().toISOString();
    for (const filePath of ledgerFiles) {
      const relPath = path.relative(cwd, filePath);
      let content;
      try {
        content = fs.readFileSync(filePath, 'utf-8');
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Read error: ${e.message}` });
        continue;
      }

      let fm;
      try {
        fm = extractFrontmatter(content);
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Parse error: ${e.message}` });
        continue;
      }

      // Clear existing rows for this file so updates stay idempotent.
      try {
        deleteLedgerEntriesForFile.run(relPath);
      } catch (e) {
        errors++;
        errorDetails.push({ file: relPath, error: `Delete error: ${e.message}` });
        continue;
      }

      const phase = String(fm.phase || '');
      const entries = Array.isArray(fm.entries) ? fm.entries : [];
      let entryIndex = 0;
      for (const entry of entries) {
        if (!entry || typeof entry !== 'object') { entryIndex++; continue; }
        try {
          const row = ledgerEntryToRow(entry, phase, relPath, now);
          // Only index rows that have the minimal identity + disposition -- otherwise
          // the NOT NULL / CHECK constraints will reject them. The validator
          // (frontmatter validate --schema ledger) is the proper quality gate.
          if (!row.context_claim || !row.disposition) {
            entryIndex++;
            continue;
          }
          insertLedgerEntry.run(row);
          ledgerEntriesIndexed++;
        } catch (e) {
          errors++;
          errorDetails.push({ file: `${relPath}[entry ${entryIndex}]`, error: `Index error: ${e.message}` });
        }
        entryIndex++;
      }
      ledgerFilesProcessed++;
    }

    // Update meta table. Phase 59 bumps schema_version 2 -> 3 to signal the
    // FTS5 re-entry + signal_links provenance columns + idx_signal_links_target.
    const upsertMeta = db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)');
    upsertMeta.run('schema_version', '3');
    upsertMeta.run('last_rebuilt', now);
    upsertMeta.run('signal_count', String(signalsAdded + signalsUpdated + signalsSkipped));
    upsertMeta.run('spike_count', String(spikesAdded + spikesUpdated + spikesSkipped));
    upsertMeta.run('ledger_entry_count', String(ledgerEntriesIndexed));
    upsertMeta.run('ledger_file_count', String(ledgerFilesProcessed));

    // Phase 59 KB-04b: FTS external-content contentless rewrite requires an
    // explicit rebuild of the index from the `signals` table content when
    // existing rows were inserted before the FTS triggers existed (or when
    // skipped-by-hash rows never fired AFTER INSERT). Running this inside the
    // transaction keeps it atomic with the rest of the rebuild.
    db.exec("INSERT INTO signal_fts(signal_fts) VALUES('rebuild');");

    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const total = signalFiles.length + spikeFiles.length + ledgerFiles.length;
  const added = signalsAdded + spikesAdded;
  const updated = signalsUpdated + spikesUpdated;
  const skipped = signalsSkipped + spikesSkipped;

  if (raw) {
    output({
      signals: signalsAdded + signalsUpdated + signalsSkipped,
      spikes: spikesAdded + spikesUpdated + spikesSkipped,
      ledger_files: ledgerFilesProcessed,
      ledger_entries: ledgerEntriesIndexed,
      added,
      updated,
      skipped,
      errors,
      error_details: errorDetails,
    }, true);
  } else {
    const lines = [
      `KB rebuild complete: ${total} files processed (${signalFiles.length} signals, ${spikeFiles.length} spikes, ${ledgerFiles.length} ledgers)`,
      `  Added:            ${added}`,
      `  Updated:          ${updated}`,
      `  Unchanged:        ${skipped}`,
      `  Ledger entries:   ${ledgerEntriesIndexed} (across ${ledgerFilesProcessed} files)`,
      `  Errors:           ${errors}`,
    ];
    if (errors > 0) {
      lines.push('\nErrors:');
      for (const e of errorDetails) {
        lines.push(`  ${e.file}: ${e.error}`);
      }
    }
    console.log(lines.join('\n'));
  }
}

// ─── cmdKbStats ───────────────────────────────────────────────────────────────

function cmdKbStats(cwd, raw) {
  const dbPath = getDbPath(cwd);
  if (!fs.existsSync(dbPath)) {
    if (raw) {
      output({ error: 'No KB index found. Run `gsd-tools kb rebuild` first.' }, true);
    } else {
      console.log('No KB index found. Run `gsd-tools kb rebuild` first.');
    }
    return;
  }

  const DatabaseSync = getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });

  const totalSignals = db.prepare('SELECT COUNT(*) as n FROM signals').get().n;
  const totalSpikes = db.prepare('SELECT COUNT(*) as n FROM spikes').get().n;

  const bySeverity = db.prepare('SELECT severity, COUNT(*) as n FROM signals GROUP BY severity ORDER BY n DESC').all();
  const byLifecycle = db.prepare('SELECT lifecycle_state, COUNT(*) as n FROM signals GROUP BY lifecycle_state ORDER BY n DESC').all();
  const byPolarity = db.prepare('SELECT polarity, COUNT(*) as n FROM signals GROUP BY polarity ORDER BY n DESC').all();
  const byProject = db.prepare('SELECT project, COUNT(*) as n FROM signals GROUP BY project ORDER BY n DESC').all();
  const byCategory = db.prepare('SELECT signal_category, COUNT(*) as n FROM signals GROUP BY signal_category ORDER BY n DESC').all();
  const byDetectionMethod = db.prepare('SELECT detection_method, COUNT(*) as n FROM signals GROUP BY detection_method ORDER BY n DESC').all();
  const byProvenanceSchema = db.prepare("SELECT provenance_schema, COUNT(*) as n FROM signals GROUP BY provenance_schema ORDER BY n DESC").all();
  const byProvenanceStatus = db.prepare("SELECT provenance_status, COUNT(*) as n FROM signals WHERE provenance_status != '' GROUP BY provenance_status ORDER BY n DESC").all();

  const lastRebuilt = db.prepare("SELECT value FROM meta WHERE key = 'last_rebuilt'").get();
  const schemaVersion = db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get();

  if (raw) {
    output({
      total_signals: totalSignals,
      total_spikes: totalSpikes,
      by_severity: bySeverity,
      by_lifecycle_state: byLifecycle,
      by_polarity: byPolarity,
      by_project: byProject,
      by_signal_category: byCategory,
      by_detection_method: byDetectionMethod,
      by_provenance_schema: byProvenanceSchema,
      by_provenance_status: byProvenanceStatus,
      last_rebuilt: lastRebuilt ? lastRebuilt.value : null,
      schema_version: schemaVersion ? schemaVersion.value : null,
    }, true);
    return;
  }

  function fmtTable(rows, col1, col2) {
    if (!rows.length) return '  (none)';
    const w = Math.max(...rows.map(r => String(r[col1]).length), col1.length);
    const lines = [`  ${col1.padEnd(w)}  ${col2}`];
    for (const r of rows) {
      lines.push(`  ${String(r[col1]).padEnd(w)}  ${r[col2]}`);
    }
    return lines.join('\n');
  }

  const sections = [
    `KB Statistics`,
    `  Schema version: ${schemaVersion ? schemaVersion.value : 'unknown'}`,
    `  Last rebuilt:   ${lastRebuilt ? lastRebuilt.value : 'never'}`,
    `  Total signals:  ${totalSignals}`,
    `  Total spikes:   ${totalSpikes}`,
    '',
    'By Severity:',
    fmtTable(bySeverity, 'severity', 'n'),
    '',
    'By Lifecycle State:',
    fmtTable(byLifecycle, 'lifecycle_state', 'n'),
    '',
    'By Polarity:',
    fmtTable(byPolarity, 'polarity', 'n'),
    '',
    'By Signal Category:',
    fmtTable(byCategory, 'signal_category', 'n'),
    '',
    'By Detection Method:',
    fmtTable(byDetectionMethod, 'detection_method', 'n'),
    '',
    'By Provenance Schema:',
    fmtTable(byProvenanceSchema, 'provenance_schema', 'n'),
    '',
    'By Provenance Status:',
    fmtTable(byProvenanceStatus, 'provenance_status', 'n'),
    '',
    'By Project:',
    fmtTable(byProject, 'project', 'n'),
  ];
  console.log(sections.join('\n'));
}

// ─── cmdKbMigrate ─────────────────────────────────────────────────────────────

function cmdKbMigrate(cwd, raw) {
  const kbDir = getKbDir(cwd);
  const signalFiles = discoverSignalFiles(kbDir);

  let filesModified = 0;
  let filesSkipped = 0;
  let errors = 0;
  const errorDetails = [];

  for (const filePath of signalFiles) {
    const relPath = path.relative(kbDir, filePath);
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf-8');
    } catch (e) {
      errors++;
      errorDetails.push({ file: relPath, error: `Read error: ${e.message}` });
      continue;
    }

    let fm;
    try {
      fm = extractFrontmatter(content);
    } catch (e) {
      errors++;
      errorDetails.push({ file: relPath, error: `Parse error: ${e.message}` });
      continue;
    }

    // Skip files that have no source field, or already have detection_method + origin
    const hasSource = fm.source !== undefined;
    const alreadyMigrated = fm.detection_method !== undefined && fm.origin !== undefined;

    if (!hasSource || alreadyMigrated) {
      filesSkipped++;
      continue;
    }

    try {
      const detectionMethod = mapSourceToDetectionMethod(fm.source);
      const origin = mapSourceToOrigin(fm.source);

      // Add new fields, remove old source field
      const newFm = Object.assign({}, fm);
      newFm.detection_method = detectionMethod;
      newFm.origin = origin;
      delete newFm.source;

      const newContent = spliceFrontmatter(content, newFm);
      fs.writeFileSync(filePath, newContent, 'utf-8');
      filesModified++;
    } catch (e) {
      errors++;
      errorDetails.push({ file: relPath, error: `Write error: ${e.message}` });
    }
  }

  const summary = `${filesModified} files migrated, ${filesSkipped} skipped, ${errors} errors`;

  if (raw) {
    output({
      files_modified: filesModified,
      files_skipped: filesSkipped,
      errors,
      error_details: errorDetails,
    }, true);
  } else {
    console.log(`KB migrate complete: ${summary}`);
    if (errors > 0) {
      console.log('\nErrors:');
      for (const e of errorDetails) {
        console.log(`  ${e.file}: ${e.error}`);
      }
    }
    if (filesModified > 0) {
      console.log('\nNext step: run `gsd-tools kb rebuild` to update the SQLite index.');
    }
  }
}

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  cmdKbRebuild,
  cmdKbStats,
  cmdKbMigrate,
  // Phase 59 test-only exports: allow unit tests to exercise extractLinks
  // directly for the typeof-string-guard invariants without re-invoking the
  // full rebuild pipeline. Prefixed with __testOnly_ so the intent is legible.
  __testOnly_extractLinks: extractLinks,
};
