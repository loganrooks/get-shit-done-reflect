'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { resolveWorktreeRoot } = require('../../core.cjs');

const JSONL_LINK_STATES = Object.freeze([
  'matched',
  'session_dir_only',
  'truly_orphaned',
  'source_unavailable',
]);

const FACET_LINK_STATES = Object.freeze([
  'matched',
  'unmatched',
  'source_unavailable',
]);

const HUMAN_TURN_COMMAND_PREFIXES = Object.freeze([
  '<command-name>',
  '<command-message>',
  '<local-command-caveat>',
  '<local-command-stdout>',
]);

const SESSION_META_PROVENANCE = Object.freeze({
  scope: 'derived_from_jsonl_via_insights_command',
  lifecycle: 'frozen_at_last_insights_run_for_sessions_still_running',
  refresh_policy: 'on_manual_invocation_of_/insights',
  dependency: '/insights subsystem (active in v2.1.110, bug-fixed at v2.1.101)',
  write_path: 'manual_/insights_invocation_with_two_path_outputs',
});

function safeReadJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8').replace(/\x00+$/, '').trim();
    if (!raw) return null;
    return JSON.parse(raw);
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

function toIso(value) {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value.toISOString === 'function') return value.toISOString();
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

function encodeClaudeProjectPath(projectPath) {
  if (!projectPath) return null;
  return path.resolve(projectPath).replace(/[\\/]/g, '-');
}

function compareVersions(left, right) {
  const leftParts = String(left || '')
    .split('.')
    .map(part => parseInt(part, 10))
    .filter(Number.isFinite);
  const rightParts = String(right || '')
    .split('.')
    .map(part => parseInt(part, 10))
    .filter(Number.isFinite);
  const len = Math.max(leftParts.length, rightParts.length, 3);
  for (let index = 0; index < len; index++) {
    const leftValue = leftParts[index] || 0;
    const rightValue = rightParts[index] || 0;
    if (leftValue > rightValue) return 1;
    if (leftValue < rightValue) return -1;
  }
  return 0;
}

function classifyClaudeEra(version) {
  if (!version) {
    return {
      version: null,
      era_key: 'version_unknown',
      label: 'Version unknown',
      comparable_group: 'unknown',
      warnings: ['Claude JSONL did not expose `user.version`, so era comparability is unknown.'],
    };
  }

  if (compareVersions(version, '2.1.69') < 0) {
    return {
      version,
      era_key: 'pre_2_1_69_thinking_unconditional',
      label: 'Pre-2.1.69 thinking-unconditional era',
      comparable_group: 'pre_2_1_69',
      warnings: [],
    };
  }

  return {
    version,
    era_key: 'v2_1_69_plus_setting_gated',
    label: 'v2.1.69+ thinking-gated era',
    comparable_group: 'v2_1_69_plus',
    warnings: [
      'Thinking summaries in this era are gated by `showThinkingSummaries` and rollout state.',
      'Session-meta remains a manual `/insights` product and is not comparable to runtime-native truth.',
    ],
  };
}

function normalizeUserContent(content) {
  if (typeof content === 'string') {
    return { kind: 'text', text: content.trim() };
  }

  if (Array.isArray(content)) {
    if (content.some(item => item && item.type === 'tool_result')) {
      return { kind: 'tool_result', text: '' };
    }

    const textParts = content
      .filter(item => item && item.type === 'text' && typeof item.text === 'string')
      .map(item => item.text.trim())
      .filter(Boolean);

    if (textParts.length > 0) {
      return { kind: 'text', text: textParts.join('\n').trim() };
    }

    return { kind: 'structured', text: JSON.stringify(content) };
  }

  return { kind: 'unknown', text: '' };
}

function isHumanTurnRecord(record) {
  if (!record || record.type !== 'user') return false;
  if (record.message && record.message.role && record.message.role !== 'user') return false;
  if (record.isMeta || record.isSidechain) return false;

  const normalized = normalizeUserContent(record.message ? record.message.content : null);
  if (normalized.kind === 'tool_result') return false;

  const text = normalized.text.trim();
  if (!text) return false;
  return !HUMAN_TURN_COMMAND_PREFIXES.some(prefix => text.startsWith(prefix));
}

function countHumanTurns(records) {
  const counts = {
    raw_user_records: 0,
    filtered_is_meta: 0,
    filtered_is_sidechain: 0,
    filtered_tool_result_list: 0,
    filtered_command_prefix: 0,
    retained_human_turns: 0,
  };

  for (const record of records || []) {
    if (!record || record.type !== 'user') continue;
    counts.raw_user_records++;

    if (record.isMeta) {
      counts.filtered_is_meta++;
      continue;
    }

    if (record.isSidechain) {
      counts.filtered_is_sidechain++;
      continue;
    }

    const normalized = normalizeUserContent(record.message ? record.message.content : null);
    if (normalized.kind === 'tool_result') {
      counts.filtered_tool_result_list++;
      continue;
    }

    const text = normalized.text.trim();
    if (!text || HUMAN_TURN_COMMAND_PREFIXES.some(prefix => text.startsWith(prefix))) {
      counts.filtered_command_prefix++;
      continue;
    }

    counts.retained_human_turns++;
  }

  return {
    human_turn_count: counts.retained_human_turns,
    filter_counts: counts,
  };
}

function aggregateAssistantUsage(records) {
  const usageByMessageId = new Map();

  for (const record of records || []) {
    if (!record || record.type !== 'assistant') continue;
    const usage = record.message && record.message.usage;
    if (!usage) continue;

    const messageId = (record.message && record.message.id) || record.uuid || `assistant-${usageByMessageId.size}`;
    const current = usageByMessageId.get(messageId) || {
      input_tokens: 0,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
      model: null,
    };

    current.input_tokens = Math.max(current.input_tokens, Number(usage.input_tokens || 0));
    current.output_tokens = Math.max(current.output_tokens, Number(usage.output_tokens || 0));
    current.cache_creation_input_tokens = Math.max(
      current.cache_creation_input_tokens,
      Number(usage.cache_creation_input_tokens || 0)
    );
    current.cache_read_input_tokens = Math.max(
      current.cache_read_input_tokens,
      Number(usage.cache_read_input_tokens || 0)
    );
    current.model = current.model || (record.message && record.message.model) || null;

    usageByMessageId.set(messageId, current);
  }

  let inputTokensTotal = 0;
  let outputTokensTotal = 0;
  let cacheCreationTokensTotal = 0;
  let cacheReadTokensTotal = 0;

  for (const value of usageByMessageId.values()) {
    inputTokensTotal += value.input_tokens;
    outputTokensTotal += value.output_tokens;
    cacheCreationTokensTotal += value.cache_creation_input_tokens;
    cacheReadTokensTotal += value.cache_read_input_tokens;
  }

  return {
    deduped_message_count: usageByMessageId.size,
    input_tokens_total: inputTokensTotal,
    output_tokens_total: outputTokensTotal,
    cache_creation_tokens_total: cacheCreationTokensTotal,
    cache_read_tokens_total: cacheReadTokensTotal,
    total_context_tokens: inputTokensTotal + cacheCreationTokensTotal + cacheReadTokensTotal,
    message_ids: [...usageByMessageId.keys()],
  };
}

function extractSessionVersion(records) {
  for (const record of records || []) {
    if (record && record.version) return String(record.version);
  }
  return null;
}

function extractAssistantModel(records) {
  for (const record of records || []) {
    if (record && record.type === 'assistant' && record.message && record.message.model) {
      return String(record.message.model);
    }
  }
  return null;
}

function extractSessionEnvelopeField(records, fieldName) {
  for (const record of records || []) {
    if (record && record[fieldName] != null) return record[fieldName];
  }
  return null;
}

function extractEffortOverride(records) {
  for (const record of records || []) {
    if (!record || record.type !== 'user') continue;
    const normalized = normalizeUserContent(record.message ? record.message.content : null);
    if (!normalized.text) continue;

    const slashCommandMatch = normalized.text.match(
      /<command-name>\/effort<\/command-name>[\s\S]*?<command-args>([^<]+)<\/command-args>/i
    );
    if (slashCommandMatch) {
      return {
        status: 'exposed',
        value: slashCommandMatch[1].trim(),
        source: 'slash_command',
        evidence: normalized.text.slice(0, 240),
      };
    }

    const dispatchFlagMatch = normalized.text.match(/(?:^|\s)--effort\s+([a-z]+)/i);
    if (dispatchFlagMatch) {
      return {
        status: 'exposed',
        value: dispatchFlagMatch[1].trim(),
        source: 'dispatch_flag',
        evidence: normalized.text.slice(0, 240),
      };
    }
  }

  return {
    status: 'not_available',
    value: null,
    source: null,
    evidence: null,
  };
}

function getClaudePaths(cwd, options = {}) {
  const homeDir = options.homeDir || os.homedir();
  return {
    home_dir: homeDir,
    session_meta_dir: path.join(homeDir, '.claude', 'usage-data', 'session-meta'),
    facets_dir: path.join(homeDir, '.claude', 'usage-data', 'facets'),
    projects_dir: path.join(homeDir, '.claude', 'projects'),
    settings_files: [
      path.join(homeDir, '.claude', 'settings.json'),
      path.join(homeDir, '.claude', 'settings.local.json'),
      path.join(cwd, '.claude', 'settings.json'),
      path.join(cwd, '.claude', 'settings.local.json'),
    ],
    version_files: [
      path.join(cwd, '.claude', 'get-shit-done-reflect', 'VERSION'),
      path.join(homeDir, '.claude', 'get-shit-done-reflect', 'VERSION'),
    ],
    planning_config_path: path.join(cwd, '.planning', 'config.json'),
  };
}

function loadClaudeSettings(cwd, options = {}) {
  const observedAt = options.observedAt || new Date().toISOString();
  const paths = getClaudePaths(cwd, options);
  const values = {};
  const sources = [];

  for (const settingsPath of paths.settings_files) {
    const data = safeReadJson(settingsPath);
    if (!data || typeof data !== 'object') continue;

    const relevant = {};
    for (const key of [
      'showThinkingSummaries',
      'effortLevel',
      'alwaysThinkingEnabled',
      'skipDangerousModePermissionPrompt',
    ]) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        relevant[key] = data[key];
      }
    }

    if (Object.keys(relevant).length === 0) continue;
    Object.assign(values, relevant);
    sources.push({
      path: settingsPath,
      freshness: fileFreshness(settingsPath, observedAt),
      keys: Object.keys(relevant),
    });
  }

  return {
    status: sources.length > 0 ? 'derived' : 'not_available',
    values: {
      showThinkingSummaries: Object.prototype.hasOwnProperty.call(values, 'showThinkingSummaries')
        ? values.showThinkingSummaries
        : null,
      effortLevel: Object.prototype.hasOwnProperty.call(values, 'effortLevel') ? values.effortLevel : null,
      alwaysThinkingEnabled: Object.prototype.hasOwnProperty.call(values, 'alwaysThinkingEnabled')
        ? values.alwaysThinkingEnabled
        : null,
      skipDangerousModePermissionPrompt: Object.prototype.hasOwnProperty.call(values, 'skipDangerousModePermissionPrompt')
        ? values.skipDangerousModePermissionPrompt
        : null,
    },
    sources,
  };
}

function loadGsdContext(cwd, options = {}) {
  const paths = getClaudePaths(cwd, options);
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

  if (!gsdVersion) {
    for (const versionPath of paths.version_files) {
      try {
        const version = fs.readFileSync(versionPath, 'utf8').trim();
        if (!version) continue;
        gsdVersion = version;
        provenanceNotes.push(`Fallback GSD version observed from \`${versionPath}\`.`);
        break;
      } catch {
        // Ignore missing version files.
      }
    }
  }

  return {
    gsd_version: gsdVersion,
    profile,
    status: gsdVersion || profile ? 'derived' : 'not_available',
    provenance_notes: provenanceNotes,
  };
}

function buildParentJsonlIndex(projectsDir) {
  const index = new Map();
  if (!fs.existsSync(projectsDir)) return index;

  let projectDirs;
  try {
    projectDirs = fs.readdirSync(projectsDir, { withFileTypes: true });
  } catch {
    return index;
  }

  for (const projectDir of projectDirs) {
    if (!projectDir.isDirectory()) continue;
    const projectDirPath = path.join(projectsDir, projectDir.name);

    let entries;
    try {
      entries = fs.readdirSync(projectDirPath, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('.jsonl')) continue;
      const sessionId = entry.name.slice(0, -'.jsonl'.length);
      const record = {
        session_id: sessionId,
        project_dir_name: projectDir.name,
        project_dir_path: projectDirPath,
        path: path.join(projectDirPath, entry.name),
        match_method: 'index_scan',
      };
      const existing = index.get(sessionId) || [];
      existing.push(record);
      index.set(sessionId, existing);
    }
  }

  return index;
}

function parseJsonlFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const records = [];
  const typeCounts = {};
  let malformedLines = 0;

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const record = JSON.parse(line);
      records.push(record);
      const recordType = record && record.type ? record.type : 'unknown';
      typeCounts[recordType] = (typeCounts[recordType] || 0) + 1;
    } catch {
      malformedLines++;
    }
  }

  const timestamps = records
    .map(record => record && record.timestamp)
    .filter(Boolean)
    .sort();

  return {
    records,
    record_count: records.length,
    type_counts: typeCounts,
    malformed_lines: malformedLines,
    first_timestamp: timestamps[0] || null,
    last_timestamp: timestamps[timestamps.length - 1] || null,
  };
}

function linkParentJsonl(sessionMeta, projectsDir, parentIndex) {
  if (!fs.existsSync(projectsDir)) {
    return {
      status: 'source_unavailable',
      path: null,
      project_dir_name: null,
      project_dir_path: null,
      match_method: null,
      candidate_project_dirs: [],
      details: {
        source_unavailable: true,
      },
    };
  }

  const sessionId = sessionMeta && sessionMeta.session_id ? sessionMeta.session_id : null;
  const rawProjectPath = sessionMeta && sessionMeta.project_path ? sessionMeta.project_path : null;
  const normalizedProjectPath = normalizeProjectPath(rawProjectPath);
  const candidateProjects = [rawProjectPath, normalizedProjectPath]
    .filter(Boolean)
    .map(projectPath => ({
      project_path: projectPath,
      project_dir_name: encodeClaudeProjectPath(projectPath),
    }))
    .filter((candidate, index, array) =>
      array.findIndex(entry => entry.project_dir_name === candidate.project_dir_name) === index
    );

  let firstExistingProjectDir = null;
  for (const candidate of candidateProjects) {
    const projectDirPath = path.join(projectsDir, candidate.project_dir_name);
    const jsonlPath = sessionId ? path.join(projectDirPath, `${sessionId}.jsonl`) : null;

    if (fs.existsSync(projectDirPath) && !firstExistingProjectDir) {
      firstExistingProjectDir = {
        project_dir_name: candidate.project_dir_name,
        project_dir_path: projectDirPath,
      };
    }

    if (jsonlPath && fs.existsSync(jsonlPath)) {
      return {
        status: 'matched',
        path: jsonlPath,
        project_dir_name: candidate.project_dir_name,
        project_dir_path: projectDirPath,
        match_method: 'project_path_candidate',
        candidate_project_dirs: candidateProjects,
        details: {
          normalized_project_path: normalizedProjectPath,
        },
      };
    }
  }

  const indexedMatches = sessionId ? (parentIndex.get(sessionId) || []) : [];
  if (indexedMatches.length > 0) {
    const match = indexedMatches[0];
    return {
      status: 'matched',
      path: match.path,
      project_dir_name: match.project_dir_name,
      project_dir_path: match.project_dir_path,
      match_method: match.match_method,
      candidate_project_dirs: candidateProjects,
      details: {
        normalized_project_path: normalizedProjectPath,
        indexed_elsewhere: true,
      },
    };
  }

  if (firstExistingProjectDir) {
    return {
      status: 'session_dir_only',
      path: null,
      project_dir_name: firstExistingProjectDir.project_dir_name,
      project_dir_path: firstExistingProjectDir.project_dir_path,
      match_method: 'project_dir_present_file_missing',
      candidate_project_dirs: candidateProjects,
      details: {
        normalized_project_path: normalizedProjectPath,
      },
    };
  }

  return {
    status: 'truly_orphaned',
    path: null,
    project_dir_name: null,
    project_dir_path: null,
    match_method: null,
    candidate_project_dirs: candidateProjects,
    details: {
      normalized_project_path: normalizedProjectPath,
    },
  };
}

function buildFacetIndex(facetsDir) {
  const index = new Map();
  if (!fs.existsSync(facetsDir)) return index;

  let entries;
  try {
    entries = fs.readdirSync(facetsDir);
  } catch {
    return index;
  }

  for (const filename of entries) {
    if (!filename.endsWith('.json')) continue;
    const filePath = path.join(facetsDir, filename);
    const record = safeReadJson(filePath);
    if (!record || !record.session_id) continue;
    index.set(record.session_id, {
      path: filePath,
      record,
      modified_at: toIso(safeStat(filePath) && safeStat(filePath).mtime),
    });
  }

  return index;
}

function summarizeClaudeCoverage(loadResult, matchedFacetIds) {
  const jsonlCoverage = {
    matched: 0,
    unmatched: 0,
    missing: 0,
    session_dir_only: 0,
    truly_orphaned: 0,
    source_unavailable: 0,
  };

  for (const session of loadResult.sessions) {
    const state = session.parent_jsonl.status;
    if (state === 'matched') {
      jsonlCoverage.matched++;
      continue;
    }
    if (state === 'source_unavailable') {
      jsonlCoverage.missing++;
      jsonlCoverage.source_unavailable++;
      continue;
    }
    jsonlCoverage.unmatched++;
    if (state === 'session_dir_only') jsonlCoverage.session_dir_only++;
    if (state === 'truly_orphaned') jsonlCoverage.truly_orphaned++;
  }

  const facetsMissingForSessions = loadResult.sessions.filter(session => session.facets.state !== 'matched').length;
  const orphanFacetIds = [...loadResult.facet_index.keys()].filter(sessionId => !matchedFacetIds.has(sessionId));

  return {
    session_meta: {
      source_available: fs.existsSync(loadResult.paths.session_meta_dir),
      total_files: loadResult.meta_total_files,
      loaded_sessions: loadResult.sessions.length,
      malformed_files: loadResult.meta_malformed_files,
      filtered_out: loadResult.meta_filtered_out,
    },
    facets: {
      source_available: fs.existsSync(loadResult.paths.facets_dir),
      matched_sessions: matchedFacetIds.size,
      unmatched_sessions: facetsMissingForSessions,
      orphaned_global: orphanFacetIds.length,
    },
    jsonl: {
      source_available: fs.existsSync(loadResult.paths.projects_dir),
      indexed_parent_sessions: loadResult.parent_index_size,
      ...jsonlCoverage,
    },
  };
}

function loadClaude(cwd, options = {}) {
  const observedAt = options.observedAt || new Date().toISOString();
  const projectFilter = options.projectFilter === undefined ? cwd : options.projectFilter;
  const normalizedProjectFilter = projectFilter ? normalizeProjectPath(projectFilter) : null;
  const paths = getClaudePaths(cwd, options);
  const settings = loadClaudeSettings(cwd, { ...options, observedAt });
  const gsdContext = loadGsdContext(cwd, options);
  const facetIndex = buildFacetIndex(paths.facets_dir);
  const parentIndex = buildParentJsonlIndex(paths.projects_dir);

  const loadResult = {
    runtime: 'claude-code',
    observed_at: observedAt,
    cwd,
    home_dir: paths.home_dir,
    project_filter: normalizedProjectFilter,
    paths,
    settings_at_observation: settings,
    gsd_context: gsdContext,
    sessions: [],
    facet_index: facetIndex,
    parent_index_size: parentIndex.size,
    meta_total_files: 0,
    meta_malformed_files: 0,
    meta_filtered_out: 0,
  };

  if (!fs.existsSync(paths.session_meta_dir)) {
    loadResult.coverage = summarizeClaudeCoverage(loadResult, new Set());
    return loadResult;
  }

  let sessionMetaFiles = [];
  try {
    sessionMetaFiles = fs.readdirSync(paths.session_meta_dir).filter(filename => filename.endsWith('.json'));
  } catch {
    loadResult.coverage = summarizeClaudeCoverage(loadResult, new Set());
    return loadResult;
  }

  loadResult.meta_total_files = sessionMetaFiles.length;

  const matchedFacetIds = new Set();

  for (const filename of sessionMetaFiles) {
    const filePath = path.join(paths.session_meta_dir, filename);
    const record = safeReadJson(filePath);
    if (!record || !record.session_id) {
      loadResult.meta_malformed_files++;
      continue;
    }

    const normalizedProjectPath = normalizeProjectPath(record.project_path);
    if (normalizedProjectFilter && normalizedProjectPath !== normalizedProjectFilter) {
      loadResult.meta_filtered_out++;
      continue;
    }

    const parentJsonl = linkParentJsonl(record, paths.projects_dir, parentIndex);
    const facetEntry = facetIndex.get(record.session_id) || null;
    const jsonlData = parentJsonl.status === 'matched' && parentJsonl.path
      ? parseJsonlFile(parentJsonl.path)
      : {
          records: [],
          record_count: 0,
          type_counts: {},
          malformed_lines: 0,
          first_timestamp: null,
          last_timestamp: null,
        };

    if (facetEntry) matchedFacetIds.add(record.session_id);

    const version = extractSessionVersion(jsonlData.records);
    const session = {
      session_id: record.session_id,
      project_path: record.project_path || null,
      normalized_project_path: normalizedProjectPath,
      session_meta: {
        record,
        path: filePath,
        modified_at: toIso(safeStat(filePath) && safeStat(filePath).mtime),
        provenance: SESSION_META_PROVENANCE,
      },
      facets: facetEntry
        ? {
            state: 'matched',
            record: facetEntry.record,
            path: facetEntry.path,
            modified_at: facetEntry.modified_at,
          }
        : {
            state: fs.existsSync(paths.facets_dir) ? 'unmatched' : 'source_unavailable',
            record: null,
            path: null,
            modified_at: null,
          },
      parent_jsonl: {
        ...parentJsonl,
        ...jsonlData,
      },
      jsonl_usage: jsonlData.record_count > 0 ? aggregateAssistantUsage(jsonlData.records) : null,
      human_turns: jsonlData.record_count > 0 ? countHumanTurns(jsonlData.records) : null,
      runtime_identity: {
        model: extractAssistantModel(jsonlData.records),
        claude_version: version,
        entrypoint: extractSessionEnvelopeField(jsonlData.records, 'entrypoint'),
        permission_mode: extractSessionEnvelopeField(jsonlData.records, 'permissionMode'),
      },
      effort_override: jsonlData.record_count > 0 ? extractEffortOverride(jsonlData.records) : extractEffortOverride([]),
      era: classifyClaudeEra(version),
      timestamps: {
        session_meta_start: record.start_time || null,
        jsonl_first: jsonlData.first_timestamp,
        jsonl_last: jsonlData.last_timestamp,
      },
    };

    loadResult.sessions.push(session);
  }

  loadResult.coverage = summarizeClaudeCoverage(loadResult, matchedFacetIds);
  return loadResult;
}

module.exports = {
  FACET_LINK_STATES,
  HUMAN_TURN_COMMAND_PREFIXES,
  JSONL_LINK_STATES,
  SESSION_META_PROVENANCE,
  aggregateAssistantUsage,
  classifyClaudeEra,
  countHumanTurns,
  encodeClaudeProjectPath,
  extractEffortOverride,
  getClaudePaths,
  isHumanTurnRecord,
  loadClaude,
  loadClaudeSettings,
  loadGsdContext,
  normalizeProjectPath,
  normalizeUserContent,
};
