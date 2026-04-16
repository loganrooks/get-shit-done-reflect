'use strict';

const fs = require('node:fs');
const path = require('node:path');

const {
  buildFeatureRecord,
  buildRegistry,
  FEATURE_AVAILABILITY_STATUSES,
  RELIABILITY_TIERS,
  RUNTIME_SYMMETRY_MARKERS,
  SOURCE_FAMILIES,
  defineExtractor,
  runRegistryExtractors,
} = require('./registry.cjs');
const {
  STORE_SCHEMA_VERSION,
  getLatestRebuildRun,
  getMeasurementDbPath,
  openMeasurementDb,
} = require('./store.cjs');
const { loadClaude } = require('./sources/claude.cjs');
const { loadCodex } = require('./sources/codex.cjs');
const { loadGsdr } = require('./sources/gsdr.cjs');
const { RUNTIME_EXTRACTORS } = require('./extractors/runtime.cjs');
const { DERIVED_EXTRACTORS } = require('./extractors/derived.cjs');
const { buildGsdrExtractors } = require('./extractors/gsdr.cjs');
const { CODEX_EXTRACTORS } = require('./extractors/codex.cjs');

const GSDR_EXTRACTORS = buildGsdrExtractors({
  defineExtractor,
  buildFeatureRecord,
});

const FRESHNESS_STATUSES = ['fresh', 'stale', 'unknown'];

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function fileFreshness(filePath, observedAt, staleAfterHours = 24) {
  const stat = safeStat(filePath);
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

  const ageHours = Math.max(0, (Date.parse(observedAt) - stat.mtimeMs) / (60 * 60 * 1000));
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

function aggregateFreshnessRecords(observedAt, freshnessRecords, fallbackReason) {
  const records = (freshnessRecords || []).filter(Boolean);
  if (records.length === 0) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      reasons: fallbackReason ? [fallbackReason] : [],
      stale_after_hours: 24,
      age_hours: null,
    };
  }

  const statuses = records.map(record => record.status || 'unknown');
  if (statuses.includes('stale')) {
    return {
      status: 'stale',
      observed_at: observedAt,
      modified_at: records.find(record => record.modified_at)?.modified_at || null,
      reasons: records.flatMap(record => record.reasons || []).filter(Boolean),
      stale_after_hours: records.find(record => record.stale_after_hours != null)?.stale_after_hours || 24,
      age_hours: Math.max(...records.map(record => record.age_hours || 0)),
    };
  }

  if (statuses.includes('unknown')) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: records.find(record => record.modified_at)?.modified_at || null,
      reasons: records.flatMap(record => record.reasons || []).filter(Boolean),
      stale_after_hours: records.find(record => record.stale_after_hours != null)?.stale_after_hours || 24,
      age_hours: records.find(record => record.age_hours != null)?.age_hours || null,
    };
  }

  return {
    status: 'fresh',
    observed_at: observedAt,
    modified_at: records.find(record => record.modified_at)?.modified_at || null,
    reasons: [],
    stale_after_hours: records.find(record => record.stale_after_hours != null)?.stale_after_hours || 24,
    age_hours: Math.max(...records.map(record => record.age_hours || 0)),
  };
}

function countDirEntries(dirPath) {
  try {
    return fs.readdirSync(dirPath).length;
  } catch {
    return 0;
  }
}

function buildSnapshot({
  source_key,
  source_family,
  runtime,
  source_path,
  source_kind,
  exists,
  observed_at,
  freshness,
  details = {},
}) {
  return {
    source_key,
    source_family,
    runtime,
    source_path,
    source_kind,
    exists: Boolean(exists),
    observed_at,
    modified_at: freshness.modified_at || null,
    freshness_status: freshness.status || 'unknown',
    freshness,
    details,
  };
}

function buildDirSnapshot(sourceKey, sourceFamily, runtime, dirPath, observedAt, details = {}) {
  const stat = safeStat(dirPath);
  const freshness = fileFreshness(dirPath, observedAt);
  return buildSnapshot({
    source_key: sourceKey,
    source_family: sourceFamily,
    runtime,
    source_path: dirPath,
    source_kind: 'dir',
    exists: Boolean(stat),
    observed_at: observedAt,
    freshness,
    details: {
      entry_count: stat ? countDirEntries(dirPath) : 0,
      ...details,
    },
  });
}

function buildFileSnapshot(sourceKey, sourceFamily, runtime, filePath, observedAt, details = {}) {
  const stat = safeStat(filePath);
  const freshness = fileFreshness(filePath, observedAt);
  return buildSnapshot({
    source_key: sourceKey,
    source_family: sourceFamily,
    runtime,
    source_path: filePath,
    source_kind: 'file',
    exists: Boolean(stat),
    observed_at: observedAt,
    freshness,
    details: {
      size_bytes: stat ? stat.size : 0,
      ...details,
    },
  });
}

function buildCompositeSnapshot(sourceKey, sourceFamily, runtime, sourcePaths, observedAt, details = {}) {
  const freshnessRecords = sourcePaths.map(filePath => fileFreshness(filePath, observedAt));
  const existingPaths = sourcePaths.filter(filePath => safeStat(filePath));
  return buildSnapshot({
    source_key: sourceKey,
    source_family: sourceFamily,
    runtime,
    source_path: existingPaths[0] || sourcePaths[0] || null,
    source_kind: 'composite',
    exists: existingPaths.length > 0,
    observed_at: observedAt,
    freshness: aggregateFreshnessRecords(observedAt, freshnessRecords, 'no_component_sources'),
    details: {
      source_paths: sourcePaths,
      source_count: sourcePaths.length,
      observed_count: existingPaths.length,
      ...details,
    },
  });
}

function buildVirtualSnapshot(sourceKey, sourceFamily, runtime, sourcePath, observedAt, exists, freshness, details = {}) {
  return buildSnapshot({
    source_key: sourceKey,
    source_family: sourceFamily,
    runtime,
    source_path: sourcePath,
    source_kind: 'virtual',
    exists,
    observed_at: observedAt,
    freshness,
    details,
  });
}

function dedupeSourceSnapshots(sourceSnapshots) {
  const deduped = new Map();

  for (const snapshot of sourceSnapshots) {
    const current = deduped.get(snapshot.source_key);
    if (!current) {
      deduped.set(snapshot.source_key, snapshot);
      continue;
    }

    if (snapshot.exists && !current.exists) {
      deduped.set(snapshot.source_key, snapshot);
      continue;
    }

    if (snapshot.exists === current.exists) {
      const currentFreshness = current.freshness_status === 'fresh' ? 2 : current.freshness_status === 'stale' ? 1 : 0;
      const nextFreshness = snapshot.freshness_status === 'fresh' ? 2 : snapshot.freshness_status === 'stale' ? 1 : 0;
      if (nextFreshness > currentFreshness) {
        deduped.set(snapshot.source_key, snapshot);
      }
    }
  }

  return [...deduped.values()].sort((left, right) => left.source_key.localeCompare(right.source_key));
}

function buildClaudeSourceSnapshots(claude, observedAt) {
  const settingsPaths = claude.settings_at_observation.sources.map(source => source.path);
  return [
    buildDirSnapshot(
      'claude_session_meta',
      'RUNTIME',
      'claude-code',
      claude.paths.session_meta_dir,
      observedAt,
      { entry_count: claude.coverage.session_meta.total_files }
    ),
    buildDirSnapshot(
      'claude_jsonl_projects',
      'RUNTIME',
      'claude-code',
      claude.paths.projects_dir,
      observedAt,
      { indexed_parent_sessions: claude.coverage.jsonl.indexed_parent_sessions }
    ),
    buildDirSnapshot(
      'claude_facets',
      'DERIVED',
      'claude-code',
      claude.paths.facets_dir,
      observedAt,
      { matched_sessions: claude.coverage.facets.matched_sessions }
    ),
    buildCompositeSnapshot(
      'claude_settings',
      'RUNTIME',
      'claude-code',
      settingsPaths.length > 0 ? settingsPaths : claude.paths.settings_files,
      observedAt,
      {
        keys: [...new Set(claude.settings_at_observation.sources.flatMap(source => source.keys || []))],
      }
    ),
  ];
}

function buildCodexSourceSnapshots(codex, observedAt) {
  return [
    buildFileSnapshot(
      'codex_state_store',
      'RUNTIME',
      'codex-cli',
      codex.paths.state_store_path,
      observedAt,
      { schema_fields: codex.schema.fields }
    ),
    buildDirSnapshot(
      'codex_sessions',
      'RUNTIME',
      'codex-cli',
      codex.paths.sessions_dir,
      observedAt,
      { project_threads: codex.coverage.project_threads }
    ),
  ];
}

function buildGsdrSourceSnapshots(cwd, gsdrRaw, observedAt) {
  const planningDir = path.join(cwd, '.planning');
  const phasesDir = path.join(planningDir, 'phases');
  const knowledgeSignalsDir = path.join(planningDir, 'knowledge', 'signals');
  const kbDbPath = gsdrRaw.kb && gsdrRaw.kb.db_path
    ? gsdrRaw.kb.db_path
    : path.join(planningDir, 'knowledge', 'kb.db');
  const insightsDir = path.join(cwd, 'insights');
  const summaryFreshness = aggregateFreshnessRecords(
    observedAt,
    gsdrRaw.artifacts.summaries.map(artifact => ({
      status: artifact.modified_at ? 'fresh' : 'unknown',
      observed_at: observedAt,
      modified_at: artifact.modified_at,
      reasons: [],
      stale_after_hours: null,
      age_hours: null,
    })),
    'no_phase_summaries_observed'
  );
  const verificationFreshness = aggregateFreshnessRecords(
    observedAt,
    gsdrRaw.artifacts.verifications.map(artifact => ({
      status: artifact.modified_at ? 'fresh' : 'unknown',
      observed_at: observedAt,
      modified_at: artifact.modified_at,
      reasons: [],
      stale_after_hours: null,
      age_hours: null,
    })),
    'no_phase_verifications_observed'
  );
  const signalFreshness = aggregateFreshnessRecords(
    observedAt,
    gsdrRaw.artifacts.signals.map(signal => ({
      status: signal.modified_at ? 'fresh' : 'unknown',
      observed_at: observedAt,
      modified_at: signal.modified_at,
      reasons: [],
      stale_after_hours: null,
      age_hours: null,
    })),
    'no_signal_files_observed'
  );

  return [
    buildFileSnapshot(
      'planning_config',
      'GSDR',
      'project',
      gsdrRaw.config.path,
      observedAt
    ),
    buildFileSnapshot(
      'planning_state',
      'GSDR',
      'project',
      path.join(planningDir, 'STATE.md'),
      observedAt
    ),
    buildDirSnapshot(
      'insights_products',
      'DERIVED',
      'cross-runtime',
      insightsDir,
      observedAt
    ),
    buildFileSnapshot(
      'knowledge_index',
      'GSDR',
      'project',
      kbDbPath,
      observedAt
    ),
    buildFileSnapshot(
      'knowledge_kb_db',
      'GSDR',
      'project',
      kbDbPath,
      observedAt
    ),
    buildDirSnapshot(
      'phase_summaries',
      'GSDR',
      'project',
      phasesDir,
      observedAt,
      { entry_count: gsdrRaw.artifacts.summaries.length }
    ),
    buildDirSnapshot(
      'phase_verifications',
      'GSDR',
      'project',
      phasesDir,
      observedAt,
      { entry_count: gsdrRaw.artifacts.verifications.length }
    ),
    buildDirSnapshot(
      'knowledge_signals',
      'GSDR',
      'project',
      knowledgeSignalsDir,
      observedAt,
      { entry_count: gsdrRaw.artifacts.signals.length }
    ),
    buildVirtualSnapshot(
      'git_history',
      'GSDR',
      'project',
      path.join(cwd, '.git'),
      observedAt,
      gsdrRaw.artifacts.git_history.available,
      gsdrRaw.artifacts.git_history.freshness,
      { commit_count: gsdrRaw.artifacts.git_history.commits.length }
    ),
  ];
}

function buildPhaseCompleteRegistry() {
  return buildRegistry({
    additionalExtractors: {
      RUNTIME: [...RUNTIME_EXTRACTORS, ...CODEX_EXTRACTORS],
      DERIVED: [...DERIVED_EXTRACTORS],
      GSDR: [...GSDR_EXTRACTORS],
    },
  });
}

function classifyQuestion(question) {
  const text = String(question || 'overview').toLowerCase();
  const loops = [];

  if (text.includes('pipeline')) loops.push('pipeline_integrity');
  if (text.includes('intervention')) loops.push('intervention_lifecycle');

  return {
    normalized: text,
    loops,
    overview: loops.length === 0,
  };
}

function summarizeSourceCoverage(registry, sourceSnapshots) {
  const summary = {};
  for (const family of SOURCE_FAMILIES) {
    const requiredSources = new Set();
    for (const extractor of registry.byFamily.get(family) || []) {
      for (const sourceKey of extractor.raw_sources) requiredSources.add(sourceKey);
    }

    const familySnapshots = sourceSnapshots.filter(snapshot => snapshot.source_family === family);
    summary[family] = {
      required_sources: [...requiredSources].sort(),
      observed_sources: familySnapshots.filter(snapshot => snapshot.exists).map(snapshot => snapshot.source_key).sort(),
      missing_sources: [...requiredSources].filter(
        sourceKey => !familySnapshots.find(snapshot => snapshot.source_key === sourceKey && snapshot.exists)
      ).sort(),
      stale_sources: familySnapshots.filter(snapshot => snapshot.freshness_status === 'stale').map(snapshot => snapshot.source_key).sort(),
      unknown_sources: familySnapshots.filter(snapshot => snapshot.freshness_status === 'unknown').map(snapshot => snapshot.source_key).sort(),
    };
  }
  return summary;
}

function normalizeFeatureRow(row) {
  return {
    feature: row.feature_name,
    extractor: row.extractor_name,
    source_family: row.source_family,
    runtime: row.runtime || null,
    availability_status: row.availability_status,
    symmetry_marker: row.symmetry_marker,
    reliability_tier: row.reliability_tier,
    value: row.value === undefined ? null : row.value,
    coverage: row.coverage || {},
    provenance: row.provenance || {},
    freshness: row.freshness || { status: 'unknown' },
    notes: Array.isArray(row.notes) ? row.notes : [],
  };
}

function filterFeaturesForQuestion(features, registry, questionInfo, runtimeFilter) {
  return features.filter(feature => {
    if (runtimeFilter && feature.runtime !== runtimeFilter) return false;
    if (questionInfo.overview) return true;
    const extractor = registry.byName.get(feature.extractor);
    return extractor && extractor.serves_loop.some(loop => questionInfo.loops.includes(loop));
  });
}

function buildMarkerSummary(features, markerKey, markerValues) {
  const summary = {};
  for (const marker of markerValues) {
    const matches = features.filter(feature => feature[markerKey] === marker);
    summary[marker] = {
      count: matches.length,
      sample: matches.slice(0, 5).map(feature => ({
        feature: feature.feature,
        runtime: feature.runtime,
      })),
    };
  }
  return summary;
}

function runtime_dimension(features, registry) {
  const byFeature = new Map();

  for (const feature of features) {
    const baseFeature = feature.feature.split(':')[0];
    const extractor = registry.byName.get(feature.extractor);
    const group = byFeature.get(baseFeature) || {
      feature: baseFeature,
      extractor: feature.extractor,
      serves_loop: extractor ? extractor.serves_loop : [],
      runtimes: new Set(),
      availability_statuses: new Set(),
      symmetry_markers: new Set(),
      row_count: 0,
    };

    if (feature.runtime) group.runtimes.add(feature.runtime);
    group.availability_statuses.add(feature.availability_status);
    group.symmetry_markers.add(feature.symmetry_marker);
    group.row_count += 1;
    byFeature.set(baseFeature, group);
  }

  return {
    runtimes_observed: [...new Set(features.map(feature => feature.runtime).filter(Boolean))].sort(),
    by_feature: [...byFeature.values()]
      .map(group => ({
        feature: group.feature,
        extractor: group.extractor,
        serves_loop: group.serves_loop,
        runtimes: [...group.runtimes].sort(),
        availability_statuses: [...group.availability_statuses].sort(),
        symmetry_markers: [...group.symmetry_markers].sort(),
        row_count: group.row_count,
      }))
      .sort((left, right) => left.feature.localeCompare(right.feature)),
    availability_markers: buildMarkerSummary(features, 'availability_status', FEATURE_AVAILABILITY_STATUSES),
    symmetry_markers: buildMarkerSummary(features, 'symmetry_marker', RUNTIME_SYMMETRY_MARKERS),
  };
}

function deriveAnomalyRegister(features, sourceSnapshots) {
  const anomalies = [];

  for (const snapshot of sourceSnapshots) {
    if (!snapshot.exists) {
      anomalies.push({
        kind: 'source_missing',
        source_key: snapshot.source_key,
        source_family: snapshot.source_family,
        runtime: snapshot.runtime || null,
        freshness_status: snapshot.freshness_status,
      });
      continue;
    }

    if (snapshot.freshness_status === 'stale' || snapshot.freshness_status === 'unknown') {
      anomalies.push({
        kind: 'source_freshness',
        source_key: snapshot.source_key,
        source_family: snapshot.source_family,
        runtime: snapshot.runtime || null,
        freshness_status: snapshot.freshness_status,
      });
    }
  }

  for (const feature of features) {
    if (feature.availability_status !== 'exposed' && feature.availability_status !== 'derived') {
      anomalies.push({
        kind: 'feature_availability_gap',
        feature: feature.feature,
        runtime: feature.runtime,
        availability_status: feature.availability_status,
        symmetry_marker: feature.symmetry_marker,
      });
    }
  }

  return anomalies;
}

function summarizeReliability(features) {
  const tiers = [...new Set(features.map(feature => feature.reliability_tier))];
  let overall = 'artifact_derived';

  if (tiers.length === 1) {
    overall = tiers[0];
  } else if (tiers.includes('inferred')) {
    overall = 'inferred';
  } else if (tiers.includes('cross_runtime')) {
    overall = 'cross_runtime';
  } else if (tiers.includes('artifact_derived')) {
    overall = 'artifact_derived';
  } else if (tiers.includes('direct_observation')) {
    overall = 'direct_observation';
  }

  return {
    overall_tier: overall,
    tiers_observed: tiers.sort(),
  };
}

function aggregateFreshness(sourceSnapshots, storeMetadata) {
  const statuses = sourceSnapshots.map(snapshot => snapshot.freshness_status);
  if (statuses.includes('stale')) {
    return {
      status: 'stale',
      rebuilt_at: storeMetadata.rebuilt_at,
      stale_sources: sourceSnapshots.filter(snapshot => snapshot.freshness_status === 'stale').map(snapshot => snapshot.source_key).sort(),
      unknown_sources: sourceSnapshots.filter(snapshot => snapshot.freshness_status === 'unknown').map(snapshot => snapshot.source_key).sort(),
    };
  }

  if (statuses.includes('unknown')) {
    return {
      status: 'unknown',
      rebuilt_at: storeMetadata.rebuilt_at,
      stale_sources: [],
      unknown_sources: sourceSnapshots.filter(snapshot => snapshot.freshness_status === 'unknown').map(snapshot => snapshot.source_key).sort(),
    };
  }

  return {
    status: 'fresh',
    rebuilt_at: storeMetadata.rebuilt_at,
    stale_sources: [],
    unknown_sources: [],
  };
}

function buildInterpretations(features, anomalies, questionInfo, runtimeDimensionSummary) {
  const asymmetryCount = runtimeDimensionSummary.symmetry_markers.asymmetric_only.count
    + runtimeDimensionSummary.symmetry_markers.asymmetric_derived.count;
  const availabilityGapCount = anomalies.filter(anomaly => anomaly.kind === 'feature_availability_gap').length;
  const runtimeCount = runtimeDimensionSummary.runtimes_observed.length;

  let summary = 'The measurement query is operating in overview mode across runtime, derived, and GSDR extractor families.';
  if (questionInfo.loops.length === 1 && questionInfo.loops[0] === 'pipeline_integrity') {
    summary = 'Pipeline-integrity coverage is explicit: source freshness, runtime asymmetry, and feature availability gaps remain visible instead of being averaged away.';
  } else if (questionInfo.loops.length === 1 && questionInfo.loops[0] === 'intervention_lifecycle') {
    summary = 'Intervention-lifecycle evidence is traced retroactively from summaries, verifications, signals, git history, and runtime provenance without recollection.';
  } else if (questionInfo.loops.length > 1) {
    summary = 'Mixed-loop query combines pipeline-integrity and intervention-lifecycle evidence while preserving runtime asymmetry and provenance boundaries.';
  }

  return [{
    id: 'phase_57_5_live_registry_query',
    summary,
    reliability_tier: summarizeReliability(features).overall_tier,
    competing_readings: [
      'Observed asymmetry can reflect real runtime capability differences across Claude, Codex, and project-local GSDR sources.',
      'Observed asymmetry can also reflect corpus incompleteness or sources that were never emitted for a given runtime or loop.',
    ],
    distinguishing_features: runtimeDimensionSummary.by_feature
      .filter(group => group.symmetry_markers.some(marker => marker !== 'symmetric_available'))
      .map(group => group.feature),
    anomaly_register: anomalies,
    evidence: {
      runtime_count: runtimeCount,
      asymmetry_count: asymmetryCount,
      availability_gap_count: availabilityGapCount,
    },
  }];
}

function buildContract() {
  return {
    source_families: SOURCE_FAMILIES,
    feature_availability_statuses: FEATURE_AVAILABILITY_STATUSES,
    runtime_symmetry_markers: RUNTIME_SYMMETRY_MARKERS,
    reliability_tiers: RELIABILITY_TIERS,
    freshness_statuses: FRESHNESS_STATUSES,
  };
}

function loadStoreMetadata(cwd) {
  const dbPath = getMeasurementDbPath(cwd);
  if (!fs.existsSync(dbPath)) {
    return {
      db_path: dbPath,
      present: false,
      schema_version: STORE_SCHEMA_VERSION,
      rebuild_run_id: null,
      rebuilt_at: null,
    };
  }

  const db = openMeasurementDb(cwd, { dbPath });
  try {
    const rebuildRun = getLatestRebuildRun(db);
    return {
      db_path: dbPath,
      present: true,
      schema_version: rebuildRun && rebuildRun.store_version ? rebuildRun.store_version : STORE_SCHEMA_VERSION,
      rebuild_run_id: rebuildRun ? rebuildRun.id : null,
      rebuilt_at: rebuildRun ? rebuildRun.completed_at : null,
    };
  } finally {
    db.close();
  }
}

function queryMeasurement(cwd, options = {}) {
  const observedAt = options.observedAt || new Date().toISOString();
  const question = options.question || 'overview';
  const scope = options.scope || 'project';
  const runtimeFilter = options.runtime || null;
  const questionInfo = classifyQuestion(question);
  const registry = buildPhaseCompleteRegistry();
  const claude = loadClaude(cwd, {
    ...(options.claudeOptions || {}),
    ...(options.homeDir ? { homeDir: options.homeDir } : {}),
    observedAt,
  });
  const codex = loadCodex(cwd, {
    ...(options.codexOptions || {}),
    ...(options.homeDir ? { homeDir: options.homeDir } : {}),
    observedAt,
  });
  const gsdrRaw = loadGsdr(cwd, {
    ...(options.gsdrOptions || {}),
    observedAt,
  });
  const sourceSnapshots = dedupeSourceSnapshots([
    ...buildClaudeSourceSnapshots(claude, observedAt),
    ...buildCodexSourceSnapshots(codex, observedAt),
    ...buildGsdrSourceSnapshots(cwd, gsdrRaw, observedAt),
  ]);
  const sourceIndex = Object.fromEntries(sourceSnapshots.map(snapshot => [snapshot.source_key, snapshot]));
  const liveFeatureRows = runRegistryExtractors(registry, {
    cwd,
    observed_at: observedAt,
    sourceSnapshots,
    sourceIndex,
    claude,
    codex,
    gsdrRaw,
  });
  const features = filterFeaturesForQuestion(
    liveFeatureRows.map(normalizeFeatureRow),
    registry,
    questionInfo,
    runtimeFilter
  );
  const runtimeDimensionSummary = runtime_dimension(features, registry);
  const anomalyRegister = deriveAnomalyRegister(features, sourceSnapshots);
  const storeMetadata = loadStoreMetadata(cwd);

  return {
    question,
    scope: {
      level: scope,
      runtime_filter: runtimeFilter,
      cwd,
      question_classification: questionInfo,
    },
    contract: buildContract(),
    runtime_dimension: runtimeDimensionSummary,
    features,
    interpretations: buildInterpretations(features, anomalyRegister, questionInfo, runtimeDimensionSummary),
    distinguishing_features: runtimeDimensionSummary.by_feature
      .filter(group => group.symmetry_markers.some(marker => marker !== 'symmetric_available'))
      .map(group => ({
        feature: group.feature,
        symmetry_markers: group.symmetry_markers,
        availability_statuses: group.availability_statuses,
      })),
    anomaly_register: anomalyRegister,
    provenance: {
      store: storeMetadata,
      live_overlay: {
        enabled: true,
        registry_version: registry.version,
        extractor_count: registry.extractors.length,
        runtimes_loaded: [
          ...(claude.sessions.length > 0 ? ['claude-code'] : []),
          ...(codex.threads.length > 0 ? ['codex-cli'] : []),
          'project',
        ],
      },
      datasets: {
        claude_sessions: claude.sessions.length,
        codex_threads: codex.threads.length,
        summaries: gsdrRaw.artifacts.summaries.length,
        verifications: gsdrRaw.artifacts.verifications.length,
        signals: gsdrRaw.artifacts.signals.length,
      },
      source_snapshots: sourceSnapshots,
    },
    reliability: {
      ...summarizeReliability(features),
      extractors_registered: registry.extractors.length,
    },
    coverage: {
      extractor_registry_size: registry.extractors.length,
      feature_row_count: features.length,
      by_source_family: summarizeSourceCoverage(registry, sourceSnapshots),
      semantic_availability_markers: FEATURE_AVAILABILITY_STATUSES,
      runtime_symmetry_markers: RUNTIME_SYMMETRY_MARKERS,
    },
    freshness: aggregateFreshness(sourceSnapshots, storeMetadata),
  };
}

module.exports = {
  FRESHNESS_STATUSES,
  queryMeasurement,
  runtime_dimension,
};
