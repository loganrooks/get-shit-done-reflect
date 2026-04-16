'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { planningDir, planningRoot } = require('../core.cjs');
const { buildRegistry, runRegistryExtractors } = require('./registry.cjs');

const STORE_SCHEMA_VERSION = '1.0';
const DEFAULT_STALE_AFTER_HOURS = 24;
const KNOWLEDGE_DB_BASENAME = ['kb', 'db'].join('.');

let _DatabaseSync = null;

function getDbSync() {
  if (_DatabaseSync) return _DatabaseSync;
  try {
    _DatabaseSync = require('node:sqlite').DatabaseSync;
    return _DatabaseSync;
  } catch (err) {
    const nodeVersion = process.version;
    console.error(
      `Error: node:sqlite requires Node.js >= 22.5.0 (current: ${nodeVersion})\n` +
      'The measurement commands need the built-in SQLite module.\n' +
      'Upgrade Node.js: https://nodejs.org/en/download\n' +
      'Or use nvm: nvm install 22 && nvm use 22'
    );
    process.exit(1);
  }
}

function serializeJson(value) {
  return JSON.stringify(value === undefined ? null : value);
}

function deserializeJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getMeasurementDir(cwd) {
  return path.join(planningDir(cwd), 'measurement');
}

function getMeasurementDbPath(cwd) {
  return path.join(getMeasurementDir(cwd), 'measurement.db');
}

function initMeasurementSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rebuild_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      status TEXT NOT NULL,
      store_version TEXT NOT NULL,
      registry_count INTEGER NOT NULL DEFAULT 0,
      source_snapshot_count INTEGER NOT NULL DEFAULT 0,
      feature_record_count INTEGER NOT NULL DEFAULT 0,
      freshness_status TEXT NOT NULL DEFAULT 'unknown',
      notes_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS extractor_registry (
      name TEXT PRIMARY KEY,
      source_family TEXT NOT NULL,
      raw_sources_json TEXT NOT NULL,
      runtimes_json TEXT NOT NULL,
      reliability_tier TEXT NOT NULL,
      features_produced_json TEXT NOT NULL,
      serves_loop_json TEXT NOT NULL,
      distinguishes_json TEXT NOT NULL,
      status_semantics_json TEXT NOT NULL DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS source_snapshots (
      run_id INTEGER NOT NULL REFERENCES rebuild_runs(id) ON DELETE CASCADE,
      source_key TEXT NOT NULL,
      source_family TEXT NOT NULL,
      runtime TEXT NOT NULL DEFAULT '',
      source_path TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      exists_flag INTEGER NOT NULL DEFAULT 0,
      observed_at TEXT NOT NULL,
      modified_at TEXT DEFAULT NULL,
      freshness_status TEXT NOT NULL DEFAULT 'unknown',
      freshness_json TEXT NOT NULL DEFAULT '{}',
      details_json TEXT NOT NULL DEFAULT '{}',
      PRIMARY KEY (run_id, source_key)
    );

    CREATE TABLE IF NOT EXISTS feature_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id INTEGER NOT NULL REFERENCES rebuild_runs(id) ON DELETE CASCADE,
      feature_name TEXT NOT NULL,
      extractor_name TEXT NOT NULL REFERENCES extractor_registry(name),
      source_family TEXT NOT NULL,
      runtime TEXT DEFAULT '',
      availability_status TEXT NOT NULL,
      symmetry_marker TEXT NOT NULL,
      reliability_tier TEXT NOT NULL,
      value_json TEXT NOT NULL DEFAULT 'null',
      coverage_json TEXT NOT NULL DEFAULT '{}',
      provenance_json TEXT NOT NULL DEFAULT '{}',
      freshness_status TEXT NOT NULL DEFAULT 'unknown',
      freshness_json TEXT NOT NULL DEFAULT '{}',
      notes_json TEXT NOT NULL DEFAULT '[]'
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_measurement_runs_completed_at ON rebuild_runs(completed_at);
    CREATE INDEX IF NOT EXISTS idx_measurement_sources_family ON source_snapshots(run_id, source_family);
    CREATE INDEX IF NOT EXISTS idx_measurement_features_runtime ON feature_records(run_id, runtime);
    CREATE INDEX IF NOT EXISTS idx_measurement_features_family ON feature_records(run_id, source_family);
  `);
}

function openMeasurementDb(cwd, options = {}) {
  const dbPath = options.dbPath || getMeasurementDbPath(cwd);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const DatabaseSync = getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  db.exec('PRAGMA busy_timeout=5000');
  try {
    db.exec('PRAGMA journal_mode=WAL');
  } catch {
    // Queries should still work if journal mode cannot be toggled immediately.
  }
  initMeasurementSchema(db);
  return db;
}

const SOURCE_DESCRIPTORS = [
  {
    source_key: 'claude_session_meta',
    source_family: 'RUNTIME',
    runtime: 'claude-code',
    source_kind: 'dir',
    resolvePath() {
      return path.join(os.homedir(), '.claude', 'usage-data', 'session-meta');
    },
  },
  {
    source_key: 'claude_jsonl_projects',
    source_family: 'RUNTIME',
    runtime: 'claude-code',
    source_kind: 'dir',
    resolvePath() {
      return path.join(os.homedir(), '.claude', 'projects');
    },
  },
  {
    source_key: 'codex_state_store',
    source_family: 'RUNTIME',
    runtime: 'codex-cli',
    source_kind: 'file',
    resolvePath() {
      return path.join(os.homedir(), '.codex', 'state_5.sqlite');
    },
  },
  {
    source_key: 'codex_sessions',
    source_family: 'RUNTIME',
    runtime: 'codex-cli',
    source_kind: 'dir',
    resolvePath() {
      return path.join(os.homedir(), '.codex', 'sessions');
    },
  },
  {
    source_key: 'insights_products',
    source_family: 'DERIVED',
    runtime: 'cross-runtime',
    source_kind: 'dir',
    resolvePath(cwd) {
      return path.join(cwd, 'insights');
    },
  },
  {
    source_key: 'planning_config',
    source_family: 'GSDR',
    runtime: 'project',
    source_kind: 'file',
    resolvePath(cwd) {
      return path.join(planningRoot(cwd), 'config.json');
    },
  },
  {
    source_key: 'planning_state',
    source_family: 'GSDR',
    runtime: 'project',
    source_kind: 'file',
    resolvePath(cwd) {
      return path.join(planningDir(cwd), 'STATE.md');
    },
  },
  {
    source_key: 'knowledge_index',
    source_family: 'GSDR',
    runtime: 'project',
    source_kind: 'file',
    resolvePath(cwd) {
      return path.join(planningRoot(cwd), 'knowledge', KNOWLEDGE_DB_BASENAME);
    },
  },
];

function buildFreshness(stat, observedAt, staleAfterHours = DEFAULT_STALE_AFTER_HOURS) {
  if (!stat) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      reasons: ['source_missing'],
      stale_after_hours: staleAfterHours,
      age_hours: null,
    };
  }

  const ageHours = (Date.parse(observedAt) - stat.mtimeMs) / (60 * 60 * 1000);
  const status = ageHours > staleAfterHours ? 'stale' : 'fresh';
  return {
    status,
    observed_at: observedAt,
    modified_at: stat.mtime.toISOString(),
    reasons: status === 'stale' ? [`age_hours=${ageHours.toFixed(2)}`] : [],
    stale_after_hours: staleAfterHours,
    age_hours: Number(ageHours.toFixed(3)),
  };
}

function buildDetails(sourceKind, targetPath, stat) {
  if (!stat) return { target_path: targetPath };
  if (sourceKind === 'dir') {
    let entryCount = 0;
    try {
      entryCount = fs.readdirSync(targetPath).length;
    } catch {
      entryCount = 0;
    }
    return {
      target_path: targetPath,
      entry_count: entryCount,
    };
  }
  return {
    target_path: targetPath,
    size_bytes: stat.size,
  };
}

function discoverMeasurementSources(cwd, observedAt) {
  return SOURCE_DESCRIPTORS.map(descriptor => {
    const sourcePath = descriptor.resolvePath(cwd);
    const exists = fs.existsSync(sourcePath);
    const stat = exists ? fs.statSync(sourcePath) : null;
    const freshness = buildFreshness(stat, observedAt);

    return {
      source_key: descriptor.source_key,
      source_family: descriptor.source_family,
      runtime: descriptor.runtime,
      source_path: sourcePath,
      source_kind: descriptor.source_kind,
      exists,
      observed_at: observedAt,
      modified_at: freshness.modified_at,
      freshness_status: freshness.status,
      freshness,
      details: buildDetails(descriptor.source_kind, sourcePath, stat),
    };
  });
}

function aggregateFreshness(items) {
  const statuses = items.map(item => item.freshness_status || (item.freshness && item.freshness.status) || 'unknown');
  if (statuses.includes('stale')) return 'stale';
  if (statuses.includes('unknown')) return 'unknown';
  return 'fresh';
}

function recordMeasurementRebuild(db, payload) {
  const insertRun = db.prepare(`
    INSERT INTO rebuild_runs (
      started_at, completed_at, status, store_version, registry_count,
      source_snapshot_count, feature_record_count, freshness_status, notes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertExtractor = db.prepare(`
    INSERT OR REPLACE INTO extractor_registry (
      name, source_family, raw_sources_json, runtimes_json, reliability_tier,
      features_produced_json, serves_loop_json, distinguishes_json, status_semantics_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertSource = db.prepare(`
    INSERT INTO source_snapshots (
      run_id, source_key, source_family, runtime, source_path, source_kind,
      exists_flag, observed_at, modified_at, freshness_status, freshness_json, details_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertFeature = db.prepare(`
    INSERT INTO feature_records (
      run_id, feature_name, extractor_name, source_family, runtime, availability_status,
      symmetry_marker, reliability_tier, value_json, coverage_json, provenance_json,
      freshness_status, freshness_json, notes_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const upsertMeta = db.prepare(`INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)`);

  db.exec('BEGIN');
  try {
    const runResult = insertRun.run(
      payload.started_at,
      payload.completed_at,
      'completed',
      STORE_SCHEMA_VERSION,
      payload.registry.extractors.length,
      payload.sourceSnapshots.length,
      payload.featureRows.length,
      aggregateFreshness([...payload.sourceSnapshots, ...payload.featureRows]),
      serializeJson(payload.notes || [])
    );

    const runId = Number(runResult.lastInsertRowid);

    for (const extractor of payload.registry.extractors) {
      insertExtractor.run(
        extractor.name,
        extractor.source_family,
        serializeJson(extractor.raw_sources),
        serializeJson(extractor.runtimes),
        extractor.reliability_tier,
        serializeJson(extractor.features_produced),
        serializeJson(extractor.serves_loop),
        serializeJson(extractor.distinguishes),
        serializeJson(extractor.status_semantics)
      );
    }

    for (const snapshot of payload.sourceSnapshots) {
      insertSource.run(
        runId,
        snapshot.source_key,
        snapshot.source_family,
        snapshot.runtime || '',
        snapshot.source_path,
        snapshot.source_kind,
        snapshot.exists ? 1 : 0,
        snapshot.observed_at,
        snapshot.modified_at,
        snapshot.freshness_status,
        serializeJson(snapshot.freshness),
        serializeJson(snapshot.details)
      );
    }

    for (const feature of payload.featureRows) {
      insertFeature.run(
        runId,
        feature.feature_name,
        feature.extractor_name,
        feature.source_family,
        feature.runtime || '',
        feature.availability_status,
        feature.symmetry_marker,
        feature.reliability_tier,
        serializeJson(feature.value),
        serializeJson(feature.coverage),
        serializeJson(feature.provenance),
        feature.freshness.status,
        serializeJson(feature.freshness),
        serializeJson(feature.notes)
      );
    }

    upsertMeta.run('store_schema_version', STORE_SCHEMA_VERSION);
    upsertMeta.run('last_rebuild_at', payload.completed_at);
    upsertMeta.run('last_rebuild_run_id', String(runId));
    db.exec('COMMIT');

    return runId;
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      // Ignore rollback failures after partial transaction state.
    }
    throw err;
  }
}

function getLatestRebuildRun(db) {
  return db.prepare(`
    SELECT id, started_at, completed_at, status, store_version, registry_count,
           source_snapshot_count, feature_record_count, freshness_status, notes_json
    FROM rebuild_runs
    ORDER BY id DESC
    LIMIT 1
  `).get() || null;
}

function listSourceSnapshots(db, runId) {
  return db.prepare(`
    SELECT source_key, source_family, runtime, source_path, source_kind, exists_flag,
           observed_at, modified_at, freshness_status, freshness_json, details_json
    FROM source_snapshots
    WHERE run_id = ?
    ORDER BY source_family, runtime, source_key
  `).all(runId);
}

function listFeatureRows(db, options = {}) {
  const clauses = ['run_id = ?'];
  const values = [options.runId];

  if (options.runtime) {
    clauses.push('runtime = ?');
    values.push(options.runtime);
  }

  return db.prepare(`
    SELECT feature_name, extractor_name, source_family, runtime, availability_status,
           symmetry_marker, reliability_tier, value_json, coverage_json, provenance_json,
           freshness_status, freshness_json, notes_json
    FROM feature_records
    WHERE ${clauses.join(' AND ')}
    ORDER BY source_family, extractor_name, feature_name
  `).all(...values);
}

function rebuildMeasurementStore(cwd, options = {}) {
  const startedAt = new Date().toISOString();
  const registry = options.registry || buildRegistry();
  const sourceSnapshots = discoverMeasurementSources(cwd, startedAt);
  const sourceIndex = Object.fromEntries(sourceSnapshots.map(snapshot => [snapshot.source_key, snapshot]));
  const featureRows = runRegistryExtractors(registry, {
    cwd,
    observed_at: startedAt,
    sourceSnapshots,
    sourceIndex,
  });
  const completedAt = new Date().toISOString();

  const db = openMeasurementDb(cwd, options);
  try {
    const runId = recordMeasurementRebuild(db, {
      started_at: startedAt,
      completed_at: completedAt,
      registry,
      sourceSnapshots,
      featureRows,
      notes: ['Phase 57.5 substrate rebuild.'],
    });

    const byFamily = {};
    for (const family of registry.families) {
      byFamily[family] = {
        extractors: registry.byFamily.get(family).map(extractor => extractor.name),
        source_snapshots: sourceSnapshots.filter(snapshot => snapshot.source_family === family).length,
      };
    }

    return {
      command: 'measurement',
      action: 'rebuild',
      status: 'ok',
      store: {
        db_path: getMeasurementDbPath(cwd),
        schema_version: STORE_SCHEMA_VERSION,
        run_id: runId,
      },
      registry: {
        extractor_count: registry.extractors.length,
        by_family: byFamily,
      },
      sources: {
        snapshot_count: sourceSnapshots.length,
        observed: sourceSnapshots.filter(snapshot => snapshot.exists).map(snapshot => snapshot.source_key),
        missing: sourceSnapshots.filter(snapshot => !snapshot.exists).map(snapshot => snapshot.source_key),
      },
      features: {
        row_count: featureRows.length,
      },
      freshness: {
        status: aggregateFreshness([...sourceSnapshots, ...featureRows]),
        rebuilt_at: completedAt,
      },
    };
  } finally {
    db.close();
  }
}

module.exports = {
  STORE_SCHEMA_VERSION,
  deserializeJson,
  discoverMeasurementSources,
  getLatestRebuildRun,
  getMeasurementDbPath,
  listFeatureRows,
  listSourceSnapshots,
  openMeasurementDb,
  rebuildMeasurementStore,
  serializeJson,
};
