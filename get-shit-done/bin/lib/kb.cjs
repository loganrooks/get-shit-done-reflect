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

  // Indexes for common query patterns
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_signals_severity ON signals(severity);
    CREATE INDEX IF NOT EXISTS idx_signals_lifecycle ON signals(lifecycle_state);
    CREATE INDEX IF NOT EXISTS idx_signals_project ON signals(project);
    CREATE INDEX IF NOT EXISTS idx_signals_created ON signals(created);
    CREATE INDEX IF NOT EXISTS idx_signals_polarity ON signals(polarity);
    CREATE INDEX IF NOT EXISTS idx_signals_status ON signals(status);
    CREATE INDEX IF NOT EXISTS idx_signals_provenance_schema ON signals(provenance_schema);
  `);

  ensureColumn(db, 'signals', 'provenance_schema', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'provenance_status', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'about_work_json', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'detected_by_json', "TEXT DEFAULT ''");
  ensureColumn(db, 'signals', 'written_by_json', "TEXT DEFAULT ''");

  // 57.7 MEAS-GSDR-06: drop signal_fts virtual table. Previously reserved for
  // Phase 59 full-text search, never populated, and external-content mode
  // referenced nonexistent title/body columns on signals. Ripgrep remains the
  // search fallback per option (b); any future FTS re-entry must be a
  // contentless rewrite, not canonical-row expansion.
  const ftsTriggers = db.prepare(
    "SELECT name FROM sqlite_master WHERE type='trigger' AND sql LIKE '%signal_fts%'"
  ).all();
  for (const trigger of ftsTriggers) {
    db.exec(`DROP TRIGGER IF EXISTS ${trigger.name};`);
  }
  db.exec('DROP TABLE IF EXISTS signal_fts;');
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

function signalToRow(fm, filePath, hash) {
  const structuredProvenance = normalizeStructuredProvenance(fm);
  const legacyEcho = buildLegacyFlatEcho(structuredProvenance);

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

// ─── Tags extraction ──────────────────────────────────────────────────────────

function extractTags(fm) {
  if (!fm.tags) return [];
  if (Array.isArray(fm.tags)) return fm.tags.map(t => String(t).trim()).filter(Boolean);
  if (typeof fm.tags === 'string') return fm.tags.split(',').map(t => t.trim()).filter(Boolean);
  return [];
}

// ─── Links extraction ─────────────────────────────────────────────────────────

function extractLinks(fm, signalId) {
  const links = [];
  // qualified_by: array of IDs
  if (fm.qualified_by) {
    const ids = Array.isArray(fm.qualified_by) ? fm.qualified_by : [fm.qualified_by];
    for (const targetId of ids) {
      if (targetId && String(targetId).trim()) {
        links.push({ source_id: signalId, target_id: String(targetId).trim(), link_type: 'qualified_by' });
      }
    }
  }
  // superseded_by: single ID
  if (fm.superseded_by && String(fm.superseded_by).trim()) {
    links.push({ source_id: signalId, target_id: String(fm.superseded_by).trim(), link_type: 'superseded_by' });
  }
  // related_signals: array of IDs
  if (fm.related_signals) {
    const ids = Array.isArray(fm.related_signals) ? fm.related_signals : [fm.related_signals];
    for (const targetId of ids) {
      if (targetId && String(targetId).trim()) {
        links.push({ source_id: signalId, target_id: String(targetId).trim(), link_type: 'related_to' });
      }
    }
  }
  // recurrence_of: single ID
  if (fm.recurrence_of && String(fm.recurrence_of).trim()) {
    links.push({ source_id: signalId, target_id: String(fm.recurrence_of).trim(), link_type: 'recurrence_of' });
  }
  return links;
}

// ─── cmdKbRebuild ─────────────────────────────────────────────────────────────

function cmdKbRebuild(cwd, raw) {
  const kbDir = getKbDir(cwd);
  const dbPath = getDbPath(cwd);
  const db = openKbDb(dbPath);

  const signalFiles = discoverSignalFiles(kbDir);
  const spikeFiles = discoverSpikeFiles(kbDir);

  let signalsAdded = 0;
  let signalsUpdated = 0;
  let signalsSkipped = 0;
  let spikesAdded = 0;
  let spikesUpdated = 0;
  let spikesSkipped = 0;
  let errors = 0;
  const errorDetails = [];

  // Prepared statements
  const getSignalHash = db.prepare('SELECT content_hash FROM signals WHERE file_path = ?');
  const insertSignal = db.prepare(`
    INSERT OR REPLACE INTO signals
      (id, file_path, project, severity, lifecycle_state, polarity, signal_category,
       disposition, signal_type, detection_method, origin, created, updated, phase, plan,
       provenance_schema, provenance_status, about_work_json, detected_by_json, written_by_json,
       runtime, model, gsd_version, occurrence_count, durability, confidence, status, content_hash)
    VALUES
      (@id, @file_path, @project, @severity, @lifecycle_state, @polarity, @signal_category,
       @disposition, @signal_type, @detection_method, @origin, @created, @updated, @phase, @plan,
       @provenance_schema, @provenance_status, @about_work_json, @detected_by_json, @written_by_json,
       @runtime, @model, @gsd_version, @occurrence_count, @durability, @confidence, @status, @content_hash)
  `);
  const deleteSignalTags = db.prepare('DELETE FROM signal_tags WHERE signal_id = ?');
  const insertSignalTag = db.prepare('INSERT OR IGNORE INTO signal_tags (signal_id, tag) VALUES (?, ?)');
  const deleteSignalLinks = db.prepare('DELETE FROM signal_links WHERE source_id = ?');
  const insertSignalLink = db.prepare('INSERT OR IGNORE INTO signal_links (source_id, target_id, link_type) VALUES (?, ?, ?)');

  const getSpikeHash = db.prepare('SELECT content_hash FROM spikes WHERE file_path = ?');
  const insertSpike = db.prepare(`
    INSERT OR REPLACE INTO spikes
      (id, file_path, project, hypothesis, outcome, created, updated, status, content_hash)
    VALUES
      (@id, @file_path, @project, @hypothesis, @outcome, @created, @updated, @status, @content_hash)
  `);
  const deleteSpikeTags = db.prepare('DELETE FROM spike_tags WHERE spike_id = ?');
  const insertSpikeTag = db.prepare('INSERT OR IGNORE INTO spike_tags (spike_id, tag) VALUES (?, ?)');

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
        const row = signalToRow(fm, relPath, hash);
        const isNew = !existing;
        insertSignal.run(row);

        // Replace tags
        deleteSignalTags.run(row.id);
        const tags = extractTags(fm);
        for (const tag of tags) {
          insertSignalTag.run(row.id, tag);
        }

        // Replace links
        deleteSignalLinks.run(row.id);
        const links = extractLinks(fm, row.id);
        for (const link of links) {
          insertSignalLink.run(link.source_id, link.target_id, link.link_type);
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

    // Update meta table
    const now = new Date().toISOString();
    const upsertMeta = db.prepare('INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)');
    upsertMeta.run('schema_version', '2');
    upsertMeta.run('last_rebuilt', now);
    upsertMeta.run('signal_count', String(signalsAdded + signalsUpdated + signalsSkipped));
    upsertMeta.run('spike_count', String(spikesAdded + spikesUpdated + spikesSkipped));

    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }

  const total = signalFiles.length + spikeFiles.length;
  const added = signalsAdded + spikesAdded;
  const updated = signalsUpdated + spikesUpdated;
  const skipped = signalsSkipped + spikesSkipped;

  if (raw) {
    output({
      signals: signalsAdded + signalsUpdated + signalsSkipped,
      spikes: spikesAdded + spikesUpdated + spikesSkipped,
      added,
      updated,
      skipped,
      errors,
      error_details: errorDetails,
    }, true);
  } else {
    const lines = [
      `KB rebuild complete: ${total} files processed (${signalFiles.length} signals, ${spikeFiles.length} spikes)`,
      `  Added:     ${added}`,
      `  Updated:   ${updated}`,
      `  Unchanged: ${skipped}`,
      `  Errors:    ${errors}`,
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

module.exports = { cmdKbRebuild, cmdKbStats, cmdKbMigrate };
