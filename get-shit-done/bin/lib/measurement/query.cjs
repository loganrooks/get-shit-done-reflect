'use strict';

const fs = require('node:fs');

const {
  buildRegistry,
  FEATURE_AVAILABILITY_STATUSES,
  RELIABILITY_TIERS,
  RUNTIME_SYMMETRY_MARKERS,
  SOURCE_FAMILIES,
} = require('./registry.cjs');
const {
  STORE_SCHEMA_VERSION,
  deserializeJson,
  getLatestRebuildRun,
  getMeasurementDbPath,
  listFeatureRows,
  listSourceSnapshots,
  openMeasurementDb,
} = require('./store.cjs');

const FRESHNESS_STATUSES = ['fresh', 'stale', 'unknown'];

function summarizeSourceCoverage(registry, sourceSnapshots) {
  const summary = {};
  for (const family of SOURCE_FAMILIES) {
    const requiredSources = new Set();
    for (const extractor of registry.byFamily.get(family) || []) {
      for (const sourceKey of extractor.raw_sources) requiredSources.add(sourceKey);
    }

    const familySnapshots = sourceSnapshots.filter(snapshot => snapshot.source_family === family);
    summary[family] = {
      required_sources: [...requiredSources],
      observed_sources: familySnapshots.filter(snapshot => snapshot.exists).map(snapshot => snapshot.source_key),
      missing_sources: familySnapshots.filter(snapshot => !snapshot.exists).map(snapshot => snapshot.source_key),
      stale_sources: familySnapshots.filter(snapshot => snapshot.freshness_status === 'stale').map(snapshot => snapshot.source_key),
      unknown_sources: familySnapshots.filter(snapshot => snapshot.freshness_status === 'unknown').map(snapshot => snapshot.source_key),
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
    value: deserializeJson(row.value_json, null),
    coverage: deserializeJson(row.coverage_json, {}),
    provenance: deserializeJson(row.provenance_json, {}),
    freshness: deserializeJson(row.freshness_json, { status: row.freshness_status || 'unknown' }),
    notes: deserializeJson(row.notes_json, []),
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
    tiers_observed: tiers,
  };
}

function aggregateFreshness(sourceSnapshots, rebuildRun) {
  const statuses = sourceSnapshots.map(snapshot => snapshot.freshness_status);
  if (statuses.includes('stale')) {
    return {
      status: 'stale',
      rebuilt_at: rebuildRun.completed_at,
      stale_sources: sourceSnapshots.filter(snapshot => snapshot.freshness_status === 'stale').map(snapshot => snapshot.source_key),
      unknown_sources: sourceSnapshots.filter(snapshot => snapshot.freshness_status === 'unknown').map(snapshot => snapshot.source_key),
    };
  }
  if (statuses.includes('unknown')) {
    return {
      status: 'unknown',
      rebuilt_at: rebuildRun.completed_at,
      stale_sources: [],
      unknown_sources: sourceSnapshots.filter(snapshot => snapshot.freshness_status === 'unknown').map(snapshot => snapshot.source_key),
    };
  }
  return {
    status: 'fresh',
    rebuilt_at: rebuildRun.completed_at,
    stale_sources: [],
    unknown_sources: [],
  };
}

function buildInterpretations(features, anomalies) {
  return [{
    id: 'measurement_substrate_bootstrap',
    summary: 'The measurement substrate is initialized with registry-backed feature rows, but loop-specific interpretations remain intentionally provisional until later plans populate richer extractors.',
    reliability_tier: summarizeReliability(features).overall_tier,
    competing_readings: [
      'Coverage gaps may reflect genuinely unavailable corpus inputs.',
      'Coverage gaps may also reflect not-yet-landed extractor families rather than missing underlying truth.',
    ],
    distinguishing_features: features
      .filter(feature => feature.symmetry_marker !== 'symmetric_available')
      .map(feature => feature.feature),
    anomaly_register: anomalies,
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

function buildEmptyResponse(cwd, options, registry) {
  return {
    question: options.question,
    scope: {
      level: options.scope,
      runtime_filter: options.runtime || null,
      cwd,
    },
    contract: buildContract(),
    features: [],
    interpretations: [{
      id: 'measurement_store_missing',
      summary: 'The measurement store has not been rebuilt yet, so only the contract is available.',
      reliability_tier: 'artifact_derived',
      competing_readings: ['No rebuild has occurred for this workspace yet.'],
      distinguishing_features: [],
      anomaly_register: [{
        kind: 'store_missing',
        store_path: getMeasurementDbPath(cwd),
      }],
    }],
    distinguishing_features: [],
    anomaly_register: [{
      kind: 'store_missing',
      store_path: getMeasurementDbPath(cwd),
    }],
    provenance: {
      store: {
        db_path: getMeasurementDbPath(cwd),
        present: false,
        schema_version: STORE_SCHEMA_VERSION,
      },
    },
    reliability: {
      overall_tier: 'artifact_derived',
      tiers_observed: [],
    },
    coverage: {
      extractor_registry_size: registry.extractors.length,
      by_source_family: summarizeSourceCoverage(registry, []),
      semantic_availability_markers: FEATURE_AVAILABILITY_STATUSES,
      runtime_symmetry_markers: RUNTIME_SYMMETRY_MARKERS,
    },
    freshness: {
      status: 'unknown',
      rebuilt_at: null,
      stale_sources: [],
      unknown_sources: [],
    },
  };
}

function queryMeasurement(cwd, options = {}) {
  const registry = options.registry || buildRegistry();
  const question = options.question || 'overview';
  const scope = options.scope || 'project';
  const runtime = options.runtime || null;
  const dbPath = getMeasurementDbPath(cwd);

  if (!fs.existsSync(dbPath)) {
    return buildEmptyResponse(cwd, { question, scope, runtime }, registry);
  }

  const db = openMeasurementDb(cwd, { dbPath });
  try {
    const rebuildRun = getLatestRebuildRun(db);
    if (!rebuildRun) {
      return buildEmptyResponse(cwd, { question, scope, runtime }, registry);
    }

    const rawFeatures = listFeatureRows(db, { runId: rebuildRun.id, runtime });
    const rawSourceSnapshots = listSourceSnapshots(db, rebuildRun.id);
    const features = rawFeatures.map(normalizeFeatureRow);
    const sourceSnapshots = rawSourceSnapshots.map(snapshot => ({
      source_key: snapshot.source_key,
      source_family: snapshot.source_family,
      runtime: snapshot.runtime || null,
      source_path: snapshot.source_path,
      source_kind: snapshot.source_kind,
      exists: Boolean(snapshot.exists_flag),
      observed_at: snapshot.observed_at,
      modified_at: snapshot.modified_at,
      freshness_status: snapshot.freshness_status,
      freshness: deserializeJson(snapshot.freshness_json, { status: snapshot.freshness_status || 'unknown' }),
      details: deserializeJson(snapshot.details_json, {}),
    }));

    const anomalyRegister = deriveAnomalyRegister(features, sourceSnapshots);

    return {
      question,
      scope: {
        level: scope,
        runtime_filter: runtime,
        cwd,
      },
      contract: buildContract(),
      features,
      interpretations: buildInterpretations(features, anomalyRegister),
      distinguishing_features: features
        .filter(feature => feature.symmetry_marker !== 'symmetric_available')
        .map(feature => ({
          feature: feature.feature,
          symmetry_marker: feature.symmetry_marker,
          availability_status: feature.availability_status,
        })),
      anomaly_register: anomalyRegister,
      provenance: {
        store: {
          db_path: dbPath,
          present: true,
          schema_version: rebuildRun.store_version || STORE_SCHEMA_VERSION,
          rebuild_run_id: rebuildRun.id,
          rebuilt_at: rebuildRun.completed_at,
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
      freshness: aggregateFreshness(sourceSnapshots, rebuildRun),
    };
  } finally {
    db.close();
  }
}

module.exports = {
  FRESHNESS_STATUSES,
  queryMeasurement,
};
