'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const { planningDir, planningRoot } = require('../../core.cjs');
const { extractFrontmatter } = require('../../frontmatter.cjs');

const KB_TIMESTAMP_TOLERANCE_MS = 5000;

let _DatabaseSync = undefined;

function getDbSync() {
  if (_DatabaseSync !== undefined) {
    return _DatabaseSync;
  }
  try {
    _DatabaseSync = require('node:sqlite').DatabaseSync;
  } catch {
    _DatabaseSync = null;
  }
  return _DatabaseSync;
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizeIso(value) {
  if (!value) return null;
  try {
    return new Date(value).toISOString();
  } catch {
    return null;
  }
}

function buildFileFreshness(filePath, observedAt, options = {}) {
  const stat = safeStat(filePath);
  if (!stat) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      reasons: ['source_missing'],
      stale_after_hours: null,
      age_hours: null,
    };
  }

  return {
    status: options.status || 'fresh',
    observed_at: observedAt,
    modified_at: stat.mtime.toISOString(),
    reasons: options.reasons || [],
    stale_after_hours: null,
    age_hours: null,
  };
}

function walkFiles(rootDir, predicate, files = []) {
  if (!rootDir || !fs.existsSync(rootDir)) return files;

  let entries = [];
  try {
    entries = fs.readdirSync(rootDir, { withFileTypes: true });
  } catch {
    return files;
  }

  for (const entry of entries) {
    const entryPath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(entryPath, predicate, files);
      continue;
    }
    if (predicate(entryPath, entry)) {
      files.push(entryPath);
    }
  }

  return files;
}

function parsePhaseArtifactName(filePath) {
  const basename = path.basename(filePath);
  let match = basename.match(/^(\d+(?:\.\d+)?)-(\d+)-SUMMARY\.md$/);
  if (match) {
    return { phase: match[1], plan: match[2], artifact_type: 'SUMMARY' };
  }

  match = basename.match(/^(\d+(?:\.\d+)?)-VERIFICATION\.md$/);
  if (match) {
    return { phase: match[1], plan: null, artifact_type: 'VERIFICATION' };
  }

  return { phase: null, plan: null, artifact_type: 'UNKNOWN' };
}

function extractMarkdownHeading(content) {
  const headingMatch = content.match(/^#\s+(.+)$/m);
  return headingMatch ? headingMatch[1].trim() : null;
}

function readPhaseArtifact(filePath, observedAt) {
  const stat = safeStat(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  let frontmatter = {};

  try {
    frontmatter = extractFrontmatter(content) || {};
  } catch {
    frontmatter = {};
  }

  return {
    path: filePath,
    ...parsePhaseArtifactName(filePath),
    title: extractMarkdownHeading(content),
    frontmatter,
    modified_at: stat ? stat.mtime.toISOString() : null,
    size_bytes: stat ? stat.size : 0,
    freshness: buildFileFreshness(filePath, observedAt),
  };
}

function resolveKnowledgeDir(cwd) {
  const projectLocal = path.join(planningRoot(cwd), 'knowledge');
  if (fs.existsSync(projectLocal)) return projectLocal;

  const globalKb = path.join(process.env.GSD_HOME || path.join(os.homedir(), '.gsd'), 'knowledge');
  return globalKb;
}

function readSignalFile(filePath) {
  const stat = safeStat(filePath);
  const content = fs.readFileSync(filePath, 'utf8');
  let frontmatter = {};

  try {
    frontmatter = extractFrontmatter(content) || {};
  } catch {
    frontmatter = {};
  }

  return {
    path: filePath,
    id: frontmatter.id || path.basename(filePath, '.md'),
    project: frontmatter.project || null,
    severity: frontmatter.severity || null,
    lifecycle_state: frontmatter.lifecycle_state || null,
    runtime: frontmatter.runtime || null,
    status: frontmatter.status || null,
    created: frontmatter.created || null,
    modified_at: stat ? stat.mtime.toISOString() : null,
  };
}

function newestModifiedAt(records) {
  const timestamps = records
    .map(record => record && record.modified_at)
    .filter(Boolean)
    .map(value => Date.parse(value))
    .filter(value => Number.isFinite(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function loadGitHistory(cwd, observedAt, options = {}) {
  const limit = options.limit || 50;
  const commitMarker = '__GSDR_COMMIT__';
  const scopePaths = [
    '.planning',
    'get-shit-done/bin/kb-rebuild-index.sh',
    'get-shit-done/workflows/collect-signals.md',
    'get-shit-done/workflows/execute-phase.md',
  ];

  try {
    const output = execFileSync(
      'git',
      [
        '-C', cwd,
        'log',
        `-n${limit}`,
        '--date=iso-strict',
        `--pretty=format:${commitMarker}%n%H%x1f%cI%x1f%an%x1f%s`,
        '--name-only',
        '--',
        ...scopePaths,
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }
    );

    const commits = output
      .split(commitMarker)
      .map(chunk => chunk.trim())
      .filter(Boolean)
      .map(chunk => {
        const lines = chunk.split('\n').filter(Boolean);
        const [header, ...files] = lines;
        const [hash, committedAt, author, subject] = header.split('\x1f');
        return {
          hash,
          committed_at: committedAt || null,
          author: author || null,
          subject: subject || null,
          files,
          artifact_types: classifyGitArtifacts(files),
        };
      });

    return {
      available: true,
      observed_at: observedAt,
      scope_paths: scopePaths,
      commits,
      freshness: {
        status: 'fresh',
        observed_at: observedAt,
        modified_at: commits[0] ? commits[0].committed_at : null,
        reasons: [],
        stale_after_hours: null,
        age_hours: null,
      },
    };
  } catch (error) {
    return {
      available: false,
      observed_at: observedAt,
      scope_paths: scopePaths,
      commits: [],
      error: error.message,
      freshness: {
        status: 'unknown',
        observed_at: observedAt,
        modified_at: null,
        reasons: ['git_log_unavailable'],
        stale_after_hours: null,
        age_hours: null,
      },
    };
  }
}

function classifyGitArtifacts(files) {
  const types = new Set();

  for (const filePath of files) {
    if (/-SUMMARY\.md$/.test(filePath)) types.add('SUMMARY');
    if (/-VERIFICATION\.md$/.test(filePath)) types.add('VERIFICATION');
    if (/\/signals\/.+\.md$/.test(filePath)) types.add('SIGNAL');
    if (/kb-rebuild-index\.sh$/.test(filePath)) types.add('KB_REBUILD');
    if (/workflows\/(collect-signals|execute-phase)\.md$/.test(filePath)) types.add('WORKFLOW');
  }

  return [...types];
}

function computeKbFreshness(kbDir, signalFiles, observedAt) {
  const dbPath = path.join(kbDir, 'kb.db');
  const indexPath = path.join(kbDir, 'index.md');
  const dbStat = safeStat(dbPath);
  const indexStat = safeStat(indexPath);
  const newestSignal = signalFiles
    .map(signal => signal.modified_at)
    .filter(Boolean)
    .map(value => Date.parse(value))
    .filter(value => Number.isFinite(value));

  const newestSignalAt = newestSignal.length > 0 ? Math.max(...newestSignal) : null;
  const reasons = [];
  let status = 'fresh';

  if (!dbStat) {
    if (indexStat || signalFiles.length > 0) {
      status = 'stale';
      reasons.push('kb_db_missing');
    } else {
      status = 'unknown';
      reasons.push('kb_not_initialized');
    }
  } else {
    if (!indexStat) {
      status = 'stale';
      reasons.push('kb_index_missing');
    }
    if (
      indexStat &&
      Math.abs(indexStat.mtimeMs - dbStat.mtimeMs) > KB_TIMESTAMP_TOLERANCE_MS
    ) {
      status = 'stale';
      reasons.push('kb_index_and_db_out_of_sync');
    }
    if (
      newestSignalAt &&
      newestSignalAt > (dbStat.mtimeMs + KB_TIMESTAMP_TOLERANCE_MS)
    ) {
      status = 'stale';
      reasons.push('signal_files_newer_than_kb_db');
    }
  }

  return {
    status,
    observed_at: observedAt,
    modified_at: dbStat ? dbStat.mtime.toISOString() : null,
    index_modified_at: indexStat ? indexStat.mtime.toISOString() : null,
    newest_signal_at: newestSignalAt ? new Date(newestSignalAt).toISOString() : null,
    reasons,
    stale_after_hours: null,
    age_hours: null,
    db_path: dbPath,
    index_path: indexPath,
  };
}

function readKbStats(kbDir) {
  const dbPath = path.join(kbDir, 'kb.db');
  if (!fs.existsSync(dbPath)) {
    return {
      available: false,
      db_path: dbPath,
      totals: null,
      breakdowns: {},
    };
  }

  const DatabaseSync = getDbSync();
  if (!DatabaseSync) {
    return {
      available: false,
      db_path: dbPath,
      error: 'node_sqlite_unavailable',
      totals: null,
      breakdowns: {},
    };
  }

  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  try {
    const totals = {
      total_signals: db.prepare('SELECT COUNT(*) AS count FROM signals').get().count,
      total_spikes: db.prepare('SELECT COUNT(*) AS count FROM spikes').get().count,
    };
    const readCounts = (sql) => db.prepare(sql).all().map(row => ({
      key: row.key || row.name || 'unknown',
      count: row.count,
    }));

    return {
      available: true,
      db_path: dbPath,
      totals,
      last_rebuilt: (db.prepare("SELECT value FROM meta WHERE key = 'last_rebuilt'").get() || {}).value || null,
      schema_version: (db.prepare("SELECT value FROM meta WHERE key = 'schema_version'").get() || {}).value || null,
      breakdowns: {
        severity: readCounts('SELECT severity AS key, COUNT(*) AS count FROM signals GROUP BY severity ORDER BY count DESC'),
        lifecycle_state: readCounts('SELECT lifecycle_state AS key, COUNT(*) AS count FROM signals GROUP BY lifecycle_state ORDER BY count DESC'),
        project: readCounts('SELECT project AS key, COUNT(*) AS count FROM signals GROUP BY project ORDER BY count DESC'),
        runtime: readCounts('SELECT runtime AS key, COUNT(*) AS count FROM signals GROUP BY runtime ORDER BY count DESC'),
      },
    };
  } finally {
    db.close();
  }
}

function buildArtifactSurface(summaries, verifications, signals, gitHistory, observedAt) {
  const anyArtifacts = summaries.length > 0 || verifications.length > 0 || signals.length > 0 || gitHistory.commits.length > 0;
  return {
    available: anyArtifacts,
    observed_at: observedAt,
    counts: {
      summaries: summaries.length,
      verifications: verifications.length,
      signals: signals.length,
      git_commits: gitHistory.commits.length,
    },
    freshest_modified_at: newestModifiedAt([
      ...summaries,
      ...verifications,
      ...signals,
      { modified_at: gitHistory.commits[0] ? gitHistory.commits[0].committed_at : null },
    ]),
  };
}

function loadGsdr(cwd, options = {}) {
  const observedAt = normalizeIso(options.observedAt) || new Date().toISOString();
  const planDir = planningDir(cwd);
  const rootDir = planningRoot(cwd);
  const configPath = path.join(rootDir, 'config.json');
  const statePath = path.join(planDir, 'STATE.md');
  const phasesDir = path.join(planDir, 'phases');
  const knowledgeDir = resolveKnowledgeDir(cwd);

  const config = safeReadJson(configPath);
  const summaries = walkFiles(phasesDir, filePath => /-SUMMARY\.md$/.test(filePath)).map(filePath =>
    readPhaseArtifact(filePath, observedAt)
  );
  const verifications = walkFiles(phasesDir, filePath => /-VERIFICATION\.md$/.test(filePath)).map(filePath =>
    readPhaseArtifact(filePath, observedAt)
  );
  const signalFiles = walkFiles(path.join(knowledgeDir, 'signals'), filePath => filePath.endsWith('.md')).map(readSignalFile);
  const gitHistory = loadGitHistory(cwd, observedAt, { limit: options.gitLogLimit || 50 });
  const kbFreshness = computeKbFreshness(knowledgeDir, signalFiles, observedAt);
  const kbStats = readKbStats(knowledgeDir);

  return {
    cwd,
    observed_at: observedAt,
    planning: {
      root_dir: rootDir,
      plan_dir: planDir,
      phases_dir: phasesDir,
      knowledge_dir: knowledgeDir,
      state_path: statePath,
      config_path: configPath,
    },
    config: {
      path: configPath,
      exists: fs.existsSync(configPath),
      freshness: buildFileFreshness(configPath, observedAt),
      data: config,
      automation_stats: (config && config.automation && config.automation.stats) || {},
    },
    artifacts: {
      summaries,
      verifications,
      signals: signalFiles,
      git_history: gitHistory,
      surface: buildArtifactSurface(summaries, verifications, signalFiles, gitHistory, observedAt),
    },
    kb: {
      dir: knowledgeDir,
      db_path: kbFreshness.db_path,
      index_path: kbFreshness.index_path,
      freshness: kbFreshness,
      stats: kbStats,
      signal_file_count: signalFiles.length,
    },
  };
}

module.exports = {
  computeKbFreshness,
  loadGsdr,
  readKbStats,
  resolveKnowledgeDir,
};
