'use strict';

const SOURCE_FAMILIES = ['RUNTIME', 'DERIVED', 'GSDR'];
const FEATURE_AVAILABILITY_STATUSES = ['exposed', 'derived', 'not_available', 'not_applicable', 'not_emitted'];
const RUNTIME_SYMMETRY_MARKERS = [
  'symmetric_available',
  'symmetric_unavailable',
  'asymmetric_derived',
  'asymmetric_only',
];
const RELIABILITY_TIERS = ['direct_observation', 'artifact_derived', 'inferred', 'cross_runtime'];
const LOOP_DEFINITIONS = Object.freeze({
  intervention_lifecycle: Object.freeze({
    label: 'Intervention Lifecycle',
    keywords: ['intervention lifecycle', 'intervention', 'handoff', 'verification'],
    named_metrics: [
      'intervention_lifecycle_artifact_trace',
      'runtime_session_identity',
      'human_turn_count_jsonl',
    ],
    theory_of_change: 'Trace how plans, interventions, summaries, verifications, and commits propagate so phase changes can be diagnosed retroactively.',
    distinguishing_features: [
      'artifact trace completeness',
      'handoff-to-summary continuity',
      'runtime provenance continuity',
    ],
  }),
  pipeline_integrity: Object.freeze({
    label: 'Pipeline Integrity',
    keywords: ['pipeline integrity', 'pipeline', 'freshness', 'registry', 'coverage'],
    named_metrics: [
      'automation_health',
      'automation_signal_yield',
      'kb_freshness_probe',
      'runtime_jsonl_coverage',
    ],
    theory_of_change: 'Make hidden pipeline breakage visible so missing rebuilds, stale caches, and source gaps cannot silently distort measurements.',
    distinguishing_features: [
      'freshness state',
      'coverage gaps',
      'registry parity',
    ],
  }),
  agent_performance: Object.freeze({
    label: 'Agent Performance',
    keywords: ['agent performance', 'performance', 'reasoning effort'],
    named_metrics: [
      'codex_runtime_metadata',
      'runtime_session_identity',
      'claude_settings_at_start',
    ],
    theory_of_change: 'Relate execution outcomes to model, profile, reasoning level, and runtime metadata so performance differences can be attributed instead of guessed.',
    distinguishing_features: [
      'model/profile provenance',
      'reasoning-effort stratification',
      'runtime settings context',
    ],
  }),
  signal_quality: Object.freeze({
    label: 'Signal Quality',
    keywords: ['signal quality', 'signal quality loop', 'signal'],
    named_metrics: [
      'kb_signal_stats',
      'automation_signal_yield',
      'session_meta_provenance',
    ],
    theory_of_change: 'Evaluate whether the system is producing timely, trustworthy, and actionable signals rather than accumulating stale or low-value observations.',
    distinguishing_features: [
      'signal freshness',
      'signal yield',
      'signal provenance',
    ],
  }),
  cross_session_patterns: Object.freeze({
    label: 'Cross-Session Patterns',
    keywords: ['cross session', 'cross-session', 'session patterns', 'patterns'],
    named_metrics: [
      'session_jsonl_coverage_audit',
      'runtime_era_boundary_registry',
      'runtime_session_identity',
    ],
    theory_of_change: 'Compare sessions across time while preserving era boundaries and coverage differences so apparent trends are not artifacts of corpus drift.',
    distinguishing_features: [
      'era-boundary comparability',
      'coverage stratification',
      'session clustering metadata',
    ],
  }),
  cross_runtime_comparison: Object.freeze({
    label: 'Cross-Runtime Comparison',
    keywords: ['cross runtime', 'cross-runtime', 'runtime comparison', 'mixed runtime'],
    named_metrics: [
      'runtime_source_presence',
      'codex_runtime_metadata',
      'runtime_dimension',
    ],
    theory_of_change: 'Compare Claude, Codex, and project-local measurement surfaces without collapsing runtime asymmetry into a false notion of parity.',
    distinguishing_features: [
      'symmetry markers',
      'availability markers',
      'runtime-specific provenance',
    ],
  }),
});
const LOOP_KEYS = Object.freeze(Object.keys(LOOP_DEFINITIONS));
const REQUIRED_EXTRACTOR_FIELDS = [
  'name',
  'source_family',
  'raw_sources',
  'runtimes',
  'reliability_tier',
  'features_produced',
  'serves_loop',
  'distinguishes',
];

function assertEnum(value, allowed, fieldName, extractorName) {
  if (!allowed.includes(value)) {
    throw new Error(`Extractor ${extractorName} has invalid ${fieldName}: ${value}`);
  }
}

function normalizeStringList(value, fieldName, extractorName) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`Extractor ${extractorName} must provide non-empty ${fieldName}`);
  }
  const normalized = value
    .map(item => String(item).trim())
    .filter(Boolean);
  if (normalized.length === 0) {
    throw new Error(`Extractor ${extractorName} must provide non-empty ${fieldName}`);
  }
  return [...new Set(normalized)];
}

function normalizeLoopList(value, fieldName, extractorName) {
  const normalized = normalizeStringList(value, fieldName, extractorName)
    .map(loop => loop.toLowerCase().replace(/[\s-]+/g, '_'));
  for (const loop of normalized) {
    assertEnum(loop, LOOP_KEYS, fieldName, extractorName);
  }
  return [...new Set(normalized)];
}

function normalizeSourceFamily(value, extractorName) {
  const family = String(value || '').trim().toUpperCase();
  assertEnum(family, SOURCE_FAMILIES, 'source_family', extractorName);
  return family;
}

function normalizeFreshness(freshness) {
  const status = freshness && freshness.status ? freshness.status : 'unknown';
  if (!['fresh', 'stale', 'unknown'].includes(status)) {
    throw new Error(`Invalid freshness status: ${status}`);
  }
  return {
    status,
    observed_at: freshness && freshness.observed_at ? freshness.observed_at : null,
    modified_at: freshness && freshness.modified_at ? freshness.modified_at : null,
    reasons: Array.isArray(freshness && freshness.reasons) ? freshness.reasons : [],
    stale_after_hours: freshness && freshness.stale_after_hours != null ? freshness.stale_after_hours : 24,
    age_hours: freshness && freshness.age_hours != null ? freshness.age_hours : null,
  };
}

function validateExtractorEntry(entry) {
  const extractorName = entry && entry.name ? entry.name : '<unnamed>';
  for (const field of REQUIRED_EXTRACTOR_FIELDS) {
    if (entry[field] === undefined || entry[field] === null) {
      throw new Error(`Extractor ${extractorName} missing required field: ${field}`);
    }
  }

  normalizeSourceFamily(entry.source_family, extractorName);
  normalizeStringList(entry.raw_sources, 'raw_sources', extractorName);
  normalizeStringList(entry.runtimes, 'runtimes', extractorName);
  normalizeStringList(entry.features_produced, 'features_produced', extractorName);
  normalizeLoopList(entry.serves_loop, 'serves_loop', extractorName);
  normalizeStringList(entry.distinguishes, 'distinguishes', extractorName);
  assertEnum(String(entry.reliability_tier), RELIABILITY_TIERS, 'reliability_tier', extractorName);

  if (entry.status_semantics) {
    const statuses = normalizeStringList(entry.status_semantics, 'status_semantics', extractorName);
    for (const status of statuses) {
      assertEnum(status, FEATURE_AVAILABILITY_STATUSES, 'status_semantics', extractorName);
    }
  }

  return true;
}

function defineExtractor(definition) {
  validateExtractorEntry(definition);

  const entry = {
    name: String(definition.name).trim(),
    source_family: normalizeSourceFamily(definition.source_family, definition.name),
    raw_sources: normalizeStringList(definition.raw_sources, 'raw_sources', definition.name),
    runtimes: normalizeStringList(definition.runtimes, 'runtimes', definition.name),
    reliability_tier: String(definition.reliability_tier).trim(),
    features_produced: normalizeStringList(definition.features_produced, 'features_produced', definition.name),
    serves_loop: normalizeLoopList(definition.serves_loop, 'serves_loop', definition.name),
    distinguishes: normalizeStringList(definition.distinguishes, 'distinguishes', definition.name),
    status_semantics: definition.status_semantics
      ? normalizeStringList(definition.status_semantics, 'status_semantics', definition.name)
      : FEATURE_AVAILABILITY_STATUSES,
    extract: null,
  };

  const userExtract = typeof definition.extract === 'function' ? definition.extract : () => [];
  entry.extract = (context) => userExtract(entry, context);
  return Object.freeze(entry);
}

function combineFreshness(sourceIndex, sourceKeys) {
  const freshnessRecords = sourceKeys
    .map(key => sourceIndex[key] && sourceIndex[key].freshness)
    .filter(Boolean);

  if (freshnessRecords.length === 0) {
    return normalizeFreshness({ status: 'unknown', reasons: ['no_source_snapshots'] });
  }

  if (freshnessRecords.some(record => record.status === 'stale')) {
    return normalizeFreshness({
      status: 'stale',
      observed_at: freshnessRecords[0].observed_at || null,
      reasons: ['one_or_more_sources_stale'],
      stale_after_hours: freshnessRecords[0].stale_after_hours || 24,
    });
  }

  if (freshnessRecords.some(record => record.status === 'unknown')) {
    return normalizeFreshness({
      status: 'unknown',
      observed_at: freshnessRecords[0].observed_at || null,
      reasons: ['one_or_more_sources_unknown'],
      stale_after_hours: freshnessRecords[0].stale_after_hours || 24,
    });
  }

  return normalizeFreshness({
    status: 'fresh',
    observed_at: freshnessRecords[0].observed_at || null,
    reasons: [],
    stale_after_hours: freshnessRecords[0].stale_after_hours || 24,
  });
}

function determineAvailability(sourceSnapshots, options = {}) {
  const existing = sourceSnapshots.filter(snapshot => snapshot && snapshot.exists);
  if (existing.length === 0) return 'not_available';

  const allDirsEmpty = existing.every(snapshot => snapshot.source_kind === 'dir' && ((snapshot.details && snapshot.details.entry_count) || 0) === 0);
  if (allDirsEmpty) return options.emptyStatus || 'not_emitted';

  return options.derived ? 'derived' : 'exposed';
}

function computeSymmetryMarker(runtimeStatuses) {
  const values = Object.values(runtimeStatuses);
  if (values.length === 0) return 'symmetric_unavailable';

  const availableStatuses = new Set(['exposed', 'derived']);
  const availableCount = values.filter(status => availableStatuses.has(status)).length;
  const derivedCount = values.filter(status => status === 'derived').length;
  const exposedCount = values.filter(status => status === 'exposed').length;

  if (availableCount === values.length) {
    if (derivedCount > 0 && exposedCount > 0) return 'asymmetric_derived';
    return 'symmetric_available';
  }

  if (availableCount === 0) return 'symmetric_unavailable';
  if (derivedCount > 0 && exposedCount === 0) return 'asymmetric_derived';
  return 'asymmetric_only';
}

function buildFeatureRecord(extractor, record) {
  const availabilityStatus = record.availability_status || 'not_available';
  assertEnum(availabilityStatus, FEATURE_AVAILABILITY_STATUSES, 'availability_status', extractor.name);

  const symmetryMarker = record.symmetry_marker || 'symmetric_unavailable';
  assertEnum(symmetryMarker, RUNTIME_SYMMETRY_MARKERS, 'symmetry_marker', extractor.name);

  const reliabilityTier = record.reliability_tier || extractor.reliability_tier;
  assertEnum(reliabilityTier, RELIABILITY_TIERS, 'reliability_tier', extractor.name);

  return {
    feature_name: String(record.feature_name || '').trim(),
    extractor_name: extractor.name,
    source_family: extractor.source_family,
    runtime: record.runtime || null,
    availability_status: availabilityStatus,
    symmetry_marker: symmetryMarker,
    reliability_tier: reliabilityTier,
    value: record.value === undefined ? null : record.value,
    coverage: record.coverage || {},
    provenance: record.provenance || {},
    freshness: normalizeFreshness(record.freshness || {}),
    notes: Array.isArray(record.notes) ? record.notes : [],
  };
}

function runtimeFeatureCoverage(sourceIndex, sourceKeys) {
  const snapshots = sourceKeys.map(key => sourceIndex[key]).filter(Boolean);
  const observed = snapshots.filter(snapshot => snapshot.exists).map(snapshot => snapshot.source_key);
  const missing = snapshots.filter(snapshot => !snapshot.exists).map(snapshot => snapshot.source_key);

  return {
    raw_sources: [...sourceKeys],
    observed_sources: observed,
    missing_sources: missing,
    complete: missing.length === 0,
  };
}

const runtimeSourcePresenceExtractor = defineExtractor({
  name: 'runtime_source_presence',
  source_family: 'RUNTIME',
  raw_sources: ['claude_session_meta', 'claude_jsonl_projects', 'codex_state_store', 'codex_sessions'],
  runtimes: ['claude-code', 'codex-cli'],
  reliability_tier: 'artifact_derived',
  features_produced: ['runtime_source_presence'],
  // cross_runtime_comparison: runtime_source_presence IS the availability-marker distinguishing feature of this loop (registry.cjs:100) - symmetry emerges here.
  serves_loop: ['pipeline_integrity', 'cross_runtime_comparison'],
  distinguishes: ['runtime_source_presence', 'runtime_coverage_gaps'],
  status_semantics: ['exposed', 'not_available', 'not_emitted'],
  extract(extractor, context) {
    const runtimeSources = {
      'claude-code': ['claude_session_meta', 'claude_jsonl_projects'],
      'codex-cli': ['codex_state_store', 'codex_sessions'],
    };

    const runtimeStatuses = {};
    for (const [runtime, sourceKeys] of Object.entries(runtimeSources)) {
      runtimeStatuses[runtime] = determineAvailability(sourceKeys.map(key => context.sourceIndex[key]));
    }

    const symmetryMarker = computeSymmetryMarker(runtimeStatuses);

    return Object.entries(runtimeSources).map(([runtime, sourceKeys]) => buildFeatureRecord(extractor, {
      feature_name: `runtime_source_presence:${runtime}`,
      runtime,
      availability_status: runtimeStatuses[runtime],
      symmetry_marker: symmetryMarker,
      value: {
        runtime,
        present_sources: sourceKeys.filter(key => context.sourceIndex[key] && context.sourceIndex[key].exists),
      },
      coverage: {
        ...runtimeFeatureCoverage(context.sourceIndex, sourceKeys),
        runtime_scope: [runtime],
      },
      provenance: {
        source_keys: sourceKeys,
        evidence_paths: sourceKeys.map(key => context.sourceIndex[key] && context.sourceIndex[key].source_path).filter(Boolean),
        observed_at: context.observed_at,
      },
      freshness: combineFreshness(context.sourceIndex, sourceKeys),
      notes: ['Bootstrap extractor for runtime-aware availability and symmetry semantics.'],
    }));
  },
});

const derivedArtifactCoverageExtractor = defineExtractor({
  name: 'derived_artifact_provenance',
  source_family: 'DERIVED',
  raw_sources: ['insights_products'],
  runtimes: ['cross-runtime'],
  reliability_tier: 'artifact_derived',
  features_produced: ['derived_artifact_provenance'],
  serves_loop: ['pipeline_integrity'],
  distinguishes: ['derived_write_path', 'derived_coverage_gaps'],
  status_semantics: ['derived', 'not_available', 'not_emitted'],
  extract(extractor, context) {
    const sourceKeys = ['insights_products'];
    const snapshots = sourceKeys.map(key => context.sourceIndex[key]);
    const availability = determineAvailability(snapshots, { derived: true });
    const symmetryMarker = availability === 'derived' ? 'symmetric_available' : 'symmetric_unavailable';

    return [buildFeatureRecord(extractor, {
      feature_name: 'derived_artifact_provenance:insights_products',
      runtime: 'cross-runtime',
      availability_status: availability,
      symmetry_marker: symmetryMarker,
      value: {
        source_family: 'DERIVED',
        interpretation_ready: availability === 'derived',
      },
      coverage: runtimeFeatureCoverage(context.sourceIndex, sourceKeys),
      provenance: {
        source_keys: sourceKeys,
        evidence_paths: sourceKeys.map(key => context.sourceIndex[key] && context.sourceIndex[key].source_path).filter(Boolean),
        observed_at: context.observed_at,
      },
      freshness: combineFreshness(context.sourceIndex, sourceKeys),
      notes: ['Derived artifacts remain separate from runtime truth and surface as derived availability.'],
    })];
  },
});

const gsdrStateSurfaceExtractor = defineExtractor({
  name: 'gsdr_state_surface',
  source_family: 'GSDR',
  raw_sources: ['planning_config', 'planning_state'],
  runtimes: ['project'],
  reliability_tier: 'direct_observation',
  features_produced: ['gsdr_project_state'],
  serves_loop: ['pipeline_integrity', 'intervention_lifecycle'],
  distinguishes: ['project_state_presence', 'project_state_gaps'],
  status_semantics: ['exposed', 'not_available'],
  extract(extractor, context) {
    const sourceKeys = ['planning_config', 'planning_state'];
    const availability = determineAvailability(sourceKeys.map(key => context.sourceIndex[key]));
    const symmetryMarker = availability === 'exposed' ? 'symmetric_available' : 'symmetric_unavailable';

    return [buildFeatureRecord(extractor, {
      feature_name: 'gsdr_project_state',
      runtime: 'project',
      availability_status: availability,
      symmetry_marker: symmetryMarker,
      value: {
        planning_root_present: sourceKeys.every(key => context.sourceIndex[key] && context.sourceIndex[key].exists),
      },
      coverage: runtimeFeatureCoverage(context.sourceIndex, sourceKeys),
      provenance: {
        source_keys: sourceKeys,
        evidence_paths: sourceKeys.map(key => context.sourceIndex[key] && context.sourceIndex[key].source_path).filter(Boolean),
        observed_at: context.observed_at,
      },
      freshness: combineFreshness(context.sourceIndex, sourceKeys),
      notes: ['Project-global GSDR surfaces are tracked separately from runtime-specific artifacts.'],
    })];
  },
});

const kbFreshnessProbeExtractor = defineExtractor({
  name: 'kb_freshness_probe',
  source_family: 'GSDR',
  raw_sources: ['knowledge_index'],
  runtimes: ['project'],
  reliability_tier: 'artifact_derived',
  features_produced: ['kb_freshness_probe'],
  serves_loop: ['pipeline_integrity'],
  distinguishes: ['kb_freshness', 'kb_store_boundary'],
  status_semantics: ['exposed', 'not_available'],
  extract(extractor, context) {
    const sourceKeys = ['knowledge_index'];
    const availability = determineAvailability(sourceKeys.map(key => context.sourceIndex[key]));
    const freshness = combineFreshness(context.sourceIndex, sourceKeys);
    const symmetryMarker = availability === 'exposed' ? 'symmetric_available' : 'symmetric_unavailable';

    return [buildFeatureRecord(extractor, {
      feature_name: 'kb_freshness_probe',
      runtime: 'project',
      availability_status: availability,
      symmetry_marker: symmetryMarker,
      value: {
        store_boundary: 'measurement_store_is_separate_from_kb_db',
        freshness_status: freshness.status,
      },
      coverage: runtimeFeatureCoverage(context.sourceIndex, sourceKeys),
      provenance: {
        source_keys: sourceKeys,
        evidence_paths: sourceKeys.map(key => context.sourceIndex[key] && context.sourceIndex[key].source_path).filter(Boolean),
        observed_at: context.observed_at,
      },
      freshness,
      notes: ['The measurement store queries kb freshness without reusing kb.db as the measurement cache.'],
    })];
  },
});

const DEFAULT_FAMILY_EXTRACTORS = {
  RUNTIME: [runtimeSourcePresenceExtractor],
  DERIVED: [derivedArtifactCoverageExtractor],
  GSDR: [gsdrStateSurfaceExtractor, kbFreshnessProbeExtractor],
};

function loadBuiltInFamilyExtractors(options = {}) {
  if (options.includePhaseExtractors === false) {
    return {
      RUNTIME: [],
      DERIVED: [],
      GSDR: [],
    };
  }

  const { RUNTIME_EXTRACTORS } = require('./extractors/runtime.cjs');
  const { DERIVED_EXTRACTORS } = require('./extractors/derived.cjs');
  const { buildGsdrExtractors } = require('./extractors/gsdr.cjs');
  const { CODEX_EXTRACTORS } = require('./extractors/codex.cjs');

  return {
    RUNTIME: [...RUNTIME_EXTRACTORS, ...CODEX_EXTRACTORS],
    DERIVED: [...DERIVED_EXTRACTORS],
    GSDR: [...buildGsdrExtractors({
      defineExtractor,
      buildFeatureRecord,
    })],
  };
}

function normalizeAdditionalExtractors(additionalExtractors) {
  const normalized = {
    RUNTIME: [],
    DERIVED: [],
    GSDR: [],
  };

  if (!additionalExtractors) return normalized;

  for (const [family, extractors] of Object.entries(additionalExtractors)) {
    const normalizedFamily = normalizeSourceFamily(family, 'additional_extractors');
    normalized[normalizedFamily] = (extractors || []).map(extractor =>
      Object.isFrozen(extractor) ? extractor : defineExtractor(extractor)
    );
  }

  return normalized;
}

function buildRegistry(options = {}) {
  const builtIn = loadBuiltInFamilyExtractors(options);
  const additional = normalizeAdditionalExtractors(options.additionalExtractors);
  const byFamily = new Map();

  for (const family of SOURCE_FAMILIES) {
    const extractors = [
      ...DEFAULT_FAMILY_EXTRACTORS[family],
      ...builtIn[family],
      ...additional[family],
    ];
    byFamily.set(family, extractors);
  }

  const extractors = [];
  for (const family of SOURCE_FAMILIES) {
    for (const extractor of byFamily.get(family)) {
      validateExtractorEntry(extractor);
      extractors.push(extractor);
    }
  }

  return {
    version: '1.0',
    families: SOURCE_FAMILIES,
    loopCatalog: LOOP_DEFINITIONS,
    byFamily,
    extractors,
    byName: new Map(extractors.map(extractor => [extractor.name, extractor])),
  };
}

function runRegistryExtractors(registry, context) {
  const rows = [];
  for (const extractor of registry.extractors) {
    const producedRows = extractor.extract(context) || [];
    for (const row of producedRows) {
      rows.push(row);
    }
  }
  return rows;
}

module.exports = {
  SOURCE_FAMILIES,
  FEATURE_AVAILABILITY_STATUSES,
  LOOP_DEFINITIONS,
  RUNTIME_SYMMETRY_MARKERS,
  RELIABILITY_TIERS,
  REQUIRED_EXTRACTOR_FIELDS,
  buildRegistry,
  buildFeatureRecord,
  computeSymmetryMarker,
  defineExtractor,
  runRegistryExtractors,
  validateExtractorEntry,
};
