'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { resolveWorktreeRoot } = require('../../core.cjs');

const REQUIRED_THREAD_FIELDS = Object.freeze([
  'id',
  'rollout_path',
  'created_at',
  'updated_at',
  'model_provider',
  'cwd',
  'sandbox_policy',
  'approval_mode',
  'cli_version',
  'model',
  'reasoning_effort',
]);

let _DatabaseSync = null;

function getDbSync() {
  if (_DatabaseSync) return _DatabaseSync;
  try {
    _DatabaseSync = require('node:sqlite').DatabaseSync;
    return _DatabaseSync;
  } catch (error) {
    throw new Error(
      `Codex measurement requires node:sqlite (Node.js >= 22.5.0). ${error.message}`
    );
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function scanRolloutEvents(rolloutPath) {
  const result = {
    count: 0,
    replacement_history_lengths: [],
    context_compacted_events: 0,
    scanned: false,
    error: null,
  };

  if (!rolloutPath || typeof rolloutPath !== 'string') {
    result.error = 'no_path';
    return result;
  }

  if (!fs.existsSync(rolloutPath)) {
    result.error = 'file_missing';
    return result;
  }

  let raw;
  try {
    raw = fs.readFileSync(rolloutPath, 'utf8');
  } catch (error) {
    result.error = `read_error: ${error.code || error.message}`;
    return result;
  }

  result.scanned = true;
  let partialParse = false;

  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;

    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch {
      partialParse = true;
      continue;
    }

    const payload = parsed && typeof parsed === 'object' && parsed.payload && typeof parsed.payload === 'object'
      ? parsed.payload
      : parsed;

    if (!payload || payload.type !== 'context_compacted') continue;

    result.count++;
    result.context_compacted_events++;
    if (Array.isArray(payload.replacement_history)) {
      result.replacement_history_lengths.push(payload.replacement_history.length);
    }
  }

  if (partialParse) {
    result.error = 'partial_parse';
  }

  return result;
}

function normalizeProjectPath(projectPath) {
  if (!projectPath) return null;
  const resolved = path.resolve(String(projectPath));
  if (!fs.existsSync(resolved)) return resolved;
  try {
    return resolveWorktreeRoot(resolved);
  } catch {
    return resolved;
  }
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toIsoFromThreadTimestamps(secondsValue, msValue) {
  if (Number.isFinite(msValue) && msValue > 0) {
    return new Date(msValue).toISOString();
  }
  if (Number.isFinite(secondsValue) && secondsValue > 0) {
    return new Date(secondsValue * 1000).toISOString();
  }
  return null;
}

function fileFreshness(filePath, observedAt, staleAfterHours = 24) {
  const stat = safeStat(filePath);
  if (!stat) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      stale_after_hours: staleAfterHours,
      age_hours: null,
      reasons: ['source_missing'],
    };
  }

  const ageHours = Math.max(0, (Date.parse(observedAt) - stat.mtimeMs) / (60 * 60 * 1000));
  const status = ageHours > staleAfterHours ? 'stale' : 'fresh';
  return {
    status,
    observed_at: observedAt,
    modified_at: stat.mtime.toISOString(),
    stale_after_hours: staleAfterHours,
    age_hours: Number(ageHours.toFixed(3)),
    reasons: status === 'stale' ? [`age_hours=${ageHours.toFixed(2)}`] : [],
  };
}

function combineFreshness(observedAt, freshnessRecords) {
  const records = (freshnessRecords || []).filter(Boolean);
  if (records.length === 0) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      stale_after_hours: 24,
      age_hours: null,
      reasons: ['no_source_freshness'],
    };
  }

  const statuses = records.map(record => record.status || 'unknown');
  if (statuses.includes('stale')) {
    return {
      status: 'stale',
      observed_at: observedAt,
      modified_at: records.find(record => record.modified_at)?.modified_at || null,
      stale_after_hours: records.find(record => record.stale_after_hours != null)?.stale_after_hours || 24,
      age_hours: Math.max(...records.map(record => record.age_hours || 0)),
      reasons: records.flatMap(record => record.reasons || []).filter(Boolean),
    };
  }

  if (statuses.includes('unknown')) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: records.find(record => record.modified_at)?.modified_at || null,
      stale_after_hours: records.find(record => record.stale_after_hours != null)?.stale_after_hours || 24,
      age_hours: records.find(record => record.age_hours != null)?.age_hours || null,
      reasons: records.flatMap(record => record.reasons || []).filter(Boolean),
    };
  }

  return {
    status: 'fresh',
    observed_at: observedAt,
    modified_at: records.find(record => record.modified_at)?.modified_at || null,
    stale_after_hours: records.find(record => record.stale_after_hours != null)?.stale_after_hours || 24,
    age_hours: Math.max(...records.map(record => record.age_hours || 0)),
    reasons: [],
  };
}

function getCodexPaths(cwd, options = {}) {
  const homeDir = options.homeDir || os.homedir();
  const codexDir = options.codexDir || path.join(homeDir, '.codex');
  const projectRoot = normalizeProjectPath(cwd);

  return {
    home_dir: homeDir,
    codex_dir: codexDir,
    project_root: projectRoot,
    state_store_path: options.stateStorePath || path.join(codexDir, 'state_5.sqlite'),
    sessions_dir: options.sessionsDir || path.join(codexDir, 'sessions'),
    planning_config_path: options.configPath || path.join(projectRoot, '.planning', 'config.json'),
  };
}

function loadGsdContext(cwd, options = {}) {
  const paths = getCodexPaths(cwd, options);
  const config = safeReadJson(paths.planning_config_path);
  const provenanceNotes = [];

  let gsdVersion = null;
  let profile = null;

  if (config && typeof config === 'object') {
    if (config.gsd_reflect_version) {
      gsdVersion = config.gsd_reflect_version;
      provenanceNotes.push('`gsd_reflect_version` observed from `.planning/config.json` at measurement time.');
    }
    if (config.model_profile) {
      profile = config.model_profile;
      provenanceNotes.push('`model_profile` observed from `.planning/config.json` at measurement time.');
    }
  }

  return {
    gsd_version: gsdVersion,
    profile,
    status: gsdVersion || profile ? 'derived' : 'not_available',
    provenance_notes: provenanceNotes,
  };
}

function parseSandboxPolicy(value) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return { raw: String(value) };
  }
}

function inspectThreadSchema(db) {
  const fields = db.prepare('PRAGMA table_info(threads)').all().map(column => column.name);
  const missingRequiredFields = REQUIRED_THREAD_FIELDS.filter(field => !fields.includes(field));
  return {
    table: 'threads',
    fields,
    required_fields: [...REQUIRED_THREAD_FIELDS],
    missing_required_fields: missingRequiredFields,
  };
}

function ensureThreadSchema(schema) {
  if (schema.missing_required_fields.length > 0) {
    throw new Error(
      `Codex state store schema drift detected. Missing required threads fields: ${schema.missing_required_fields.join(', ')}`
    );
  }
}

function sanitizeSessionMetaPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  return {
    id: payload.id || null,
    timestamp: payload.timestamp || null,
    cwd: payload.cwd || null,
    originator: payload.originator || null,
    cli_version: payload.cli_version || null,
    model_provider: payload.model_provider || null,
    agent_nickname: payload.agent_nickname || null,
    agent_role: payload.agent_role || null,
    source: payload.source || null,
    git: payload.git || null,
  };
}

function readSessionMetaHeader(rolloutPath, observedAt) {
  const stat = safeStat(rolloutPath);
  if (!stat) {
    return {
      status: 'missing',
      path: rolloutPath,
      payload: null,
      modified_at: null,
      freshness: fileFreshness(rolloutPath, observedAt),
      error: 'rollout_missing',
    };
  }

  try {
    const lines = fs.readFileSync(rolloutPath, 'utf8')
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    const header = lines.find(line => {
      try {
        return JSON.parse(line).type === 'session_meta';
      } catch {
        return false;
      }
    });

    if (!header) {
      return {
        status: 'not_session_meta',
        path: rolloutPath,
        payload: null,
        modified_at: stat.mtime.toISOString(),
        freshness: fileFreshness(rolloutPath, observedAt),
        error: 'session_meta_header_not_found',
      };
    }

    const parsed = JSON.parse(header);
    return {
      status: 'matched',
      path: rolloutPath,
      payload: sanitizeSessionMetaPayload(parsed.payload),
      modified_at: stat.mtime.toISOString(),
      freshness: fileFreshness(rolloutPath, observedAt),
      raw_type: parsed.type,
    };
  } catch (error) {
    return {
      status: 'malformed',
      path: rolloutPath,
      payload: null,
      modified_at: stat.mtime.toISOString(),
      freshness: fileFreshness(rolloutPath, observedAt),
      error: error.message,
    };
  }
}

function normalizeThreadRow(row) {
  return {
    thread_id: row.id,
    rollout_path: row.rollout_path,
    cwd: row.cwd,
    normalized_cwd: normalizeProjectPath(row.cwd),
    model: row.model || null,
    reasoning_effort: row.reasoning_effort || null,
    sandbox_policy_text: row.sandbox_policy || null,
    sandbox_policy: parseSandboxPolicy(row.sandbox_policy),
    approval_mode: row.approval_mode || null,
    cli_version: row.cli_version || null,
    model_provider: row.model_provider || null,
    agent_nickname: row.agent_nickname || null,
    agent_role: row.agent_role || null,
    agent_path: row.agent_path || null,
    git_sha: row.git_sha || null,
    git_branch: row.git_branch || null,
    git_origin_url: row.git_origin_url || null,
    created_at: toIsoFromThreadTimestamps(row.created_at, row.created_at_ms),
    updated_at: toIsoFromThreadTimestamps(row.updated_at, row.updated_at_ms),
  };
}

function buildCoverage(threads) {
  const coverage = {
    state_store_available: false,
    sessions_dir_available: false,
    threads_scanned: 0,
    project_threads: 0,
    rollout_headers: {
      matched: 0,
      missing: 0,
      malformed: 0,
      not_session_meta: 0,
    },
  };

  for (const thread of threads) {
    coverage.project_threads++;
    coverage.rollout_headers[thread.session_meta.status] = (coverage.rollout_headers[thread.session_meta.status] || 0) + 1;
  }

  return coverage;
}

function loadCodex(cwd, options = {}) {
  const observedAt = options.observedAt || new Date().toISOString();
  const projectFilter = options.projectFilter === undefined ? cwd : options.projectFilter;
  const normalizedProjectFilter = normalizeProjectPath(projectFilter);
  const paths = getCodexPaths(cwd, options);
  const gsdContext = loadGsdContext(cwd, options);
  const stateStoreFreshness = fileFreshness(paths.state_store_path, observedAt);
  const sessionsFreshness = fileFreshness(paths.sessions_dir, observedAt);

  const result = {
    runtime: 'codex-cli',
    observed_at: observedAt,
    cwd,
    project_filter: normalizedProjectFilter,
    paths,
    state_store: {
      exists: fs.existsSync(paths.state_store_path),
      freshness: stateStoreFreshness,
    },
    sessions: {
      exists: fs.existsSync(paths.sessions_dir),
      freshness: sessionsFreshness,
    },
    gsd_context: gsdContext,
    schema: {
      table: 'threads',
      fields: [],
      required_fields: [...REQUIRED_THREAD_FIELDS],
      missing_required_fields: [...REQUIRED_THREAD_FIELDS],
    },
    threads: [],
    coverage: {
      state_store_available: fs.existsSync(paths.state_store_path),
      sessions_dir_available: fs.existsSync(paths.sessions_dir),
      threads_scanned: 0,
      project_threads: 0,
      rollout_headers: {
        matched: 0,
        missing: 0,
        malformed: 0,
        not_session_meta: 0,
      },
    },
  };

  if (!result.state_store.exists) {
    return result;
  }

  const DatabaseSync = getDbSync();
  const db = new DatabaseSync(paths.state_store_path, { readonly: true });

  try {
    const schema = inspectThreadSchema(db);
    ensureThreadSchema(schema);
    result.schema = schema;

    const rows = db.prepare(`
      SELECT id, rollout_path, created_at, updated_at, model_provider, cwd,
             sandbox_policy, approval_mode, cli_version, model, reasoning_effort,
             agent_nickname, agent_role, agent_path, git_sha, git_branch,
             git_origin_url, created_at_ms, updated_at_ms
      FROM threads
      ORDER BY updated_at DESC
    `).all();

    result.coverage.threads_scanned = rows.length;

    const threads = [];
    for (const row of rows) {
      const normalized = normalizeThreadRow(row);
      if (normalizedProjectFilter && normalized.normalized_cwd !== normalizedProjectFilter) {
        continue;
      }

      const sessionMeta = readSessionMetaHeader(normalized.rollout_path, observedAt);
      const freshness = combineFreshness(observedAt, [
        stateStoreFreshness,
        sessionMeta.freshness,
      ]);

      threads.push({
        ...normalized,
        session_meta: sessionMeta,
        runtime_identity: {
          originator: sessionMeta.payload ? sessionMeta.payload.originator : null,
          cli_version: sessionMeta.payload && sessionMeta.payload.cli_version
            ? sessionMeta.payload.cli_version
            : normalized.cli_version,
          model_provider: sessionMeta.payload && sessionMeta.payload.model_provider
            ? sessionMeta.payload.model_provider
            : normalized.model_provider,
          agent_nickname: sessionMeta.payload && sessionMeta.payload.agent_nickname
            ? sessionMeta.payload.agent_nickname
            : normalized.agent_nickname,
          agent_role: sessionMeta.payload && sessionMeta.payload.agent_role
            ? sessionMeta.payload.agent_role
            : normalized.agent_role,
          agent_path: normalized.agent_path,
          source: sessionMeta.payload ? sessionMeta.payload.source : null,
          git: sessionMeta.payload ? sessionMeta.payload.git : null,
        },
        freshness,
      });
    }

    result.threads = threads;
    result.coverage = {
      ...buildCoverage(threads),
      state_store_available: result.state_store.exists,
      sessions_dir_available: result.sessions.exists,
      threads_scanned: rows.length,
    };
    return result;
  } finally {
    db.close();
  }
}

module.exports = {
  REQUIRED_THREAD_FIELDS,
  getCodexPaths,
  inspectThreadSchema,
  loadCodex,
  parseSandboxPolicy,
  readSessionMetaHeader,
  scanRolloutEvents,
};
