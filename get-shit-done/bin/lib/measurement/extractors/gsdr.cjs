'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { loadGsdr } = require('../sources/gsdr.cjs');

function normalizeRegistryApi(registryApi) {
  if (!registryApi || typeof registryApi.defineExtractor !== 'function' || typeof registryApi.buildFeatureRecord !== 'function') {
    throw new Error('buildGsdrExtractors requires defineExtractor and buildFeatureRecord');
  }
  return registryApi;
}

function getGsdrRaw(context) {
  if (context.gsdrRaw) return context.gsdrRaw;
  const raw = loadGsdr(context.cwd, { observedAt: context.observed_at });
  context.gsdrRaw = raw;
  return raw;
}

function buildCoverage(sourceKeys, evidencePaths, extra = {}) {
  return {
    raw_sources: sourceKeys,
    observed_sources: evidencePaths.filter(Boolean),
    missing_sources: sourceKeys.filter((key, index) => !evidencePaths[index]),
    complete: sourceKeys.length === evidencePaths.filter(Boolean).length,
    ...extra,
  };
}

function availabilityForArtifacts(records, options = {}) {
  if (!options.sourceAvailable) return 'not_available';
  if (!records || records.length === 0) return options.emptyStatus || 'not_emitted';
  return options.derived ? 'derived' : 'exposed';
}

function symmetryForAvailability(availability) {
  return availability === 'exposed' || availability === 'derived'
    ? 'symmetric_available'
    : 'symmetric_unavailable';
}

function sensorStatsFromConfig(raw) {
  return Object.entries(raw.config.automation_stats || {})
    .filter(([name]) => name.startsWith('sensor_'))
    .map(([name, stats]) => {
      const sensorName = name.replace(/^sensor_/, '');
      const lastSignalCount = Number.isFinite(stats.last_signal_count) ? stats.last_signal_count : null;
      const lastRunStatus = stats.last_skip_reason
        ? 'skipped'
        : (stats.last_triggered ? 'success' : 'never');

      return {
        sensor: sensorName,
        stats_key: name,
        fires: Number(stats.fires || 0),
        skips: Number(stats.skips || 0),
        last_triggered: stats.last_triggered || null,
        last_skip_reason: stats.last_skip_reason || null,
        last_run_status: stats.last_run_status || lastRunStatus,
        last_signal_count: lastSignalCount,
      };
    });
}

function latestTriggeredAt(records) {
  const timestamps = records
    .map(record => record.last_triggered)
    .filter(Boolean)
    .map(value => Date.parse(value))
    .filter(value => Number.isFinite(value));

  if (timestamps.length === 0) return null;
  return new Date(Math.max(...timestamps)).toISOString();
}

function fileFreshness(filePath, observedAt) {
  if (!filePath || !fsSafeExists(filePath)) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      reasons: ['source_missing'],
      stale_after_hours: 24,
      age_hours: null,
    };
  }

  const stat = fs.statSync(filePath);
  const ageHours = Math.max(0, (Date.parse(observedAt) - stat.mtimeMs) / (60 * 60 * 1000));
  return {
    status: ageHours > 24 ? 'stale' : 'fresh',
    observed_at: observedAt,
    modified_at: stat.mtime.toISOString(),
    reasons: ageHours > 24 ? [`age_hours=${ageHours.toFixed(2)}`] : [],
    stale_after_hours: 24,
    age_hours: Number(ageHours.toFixed(3)),
  };
}

function combinePathFreshness(observedAt, paths) {
  const normalizedPaths = (paths || []).filter(Boolean);
  if (normalizedPaths.length === 0) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: null,
      reasons: ['no_source_paths'],
      stale_after_hours: 24,
      age_hours: null,
    };
  }

  const entries = normalizedPaths.map(filePath => fileFreshness(filePath, observedAt));
  if (entries.some(entry => entry.status === 'stale')) {
    return {
      status: 'stale',
      observed_at: observedAt,
      modified_at: entries.find(entry => entry.modified_at)?.modified_at || null,
      reasons: entries.flatMap(entry => entry.reasons || []),
      stale_after_hours: 24,
      age_hours: Math.max(...entries.map(entry => entry.age_hours || 0)),
    };
  }

  if (entries.some(entry => entry.status === 'unknown')) {
    return {
      status: 'unknown',
      observed_at: observedAt,
      modified_at: entries.find(entry => entry.modified_at)?.modified_at || null,
      reasons: entries.flatMap(entry => entry.reasons || []),
      stale_after_hours: 24,
      age_hours: entries.find(entry => entry.age_hours != null)?.age_hours || null,
    };
  }

  return {
    status: 'fresh',
    observed_at: observedAt,
    modified_at: entries.find(entry => entry.modified_at)?.modified_at || null,
    reasons: [],
    stale_after_hours: 24,
    age_hours: Math.max(...entries.map(entry => entry.age_hours || 0)),
  };
}

function buildGsdrExtractors(registryApi) {
  const { defineExtractor, buildFeatureRecord } = normalizeRegistryApi(registryApi);

  const automationHealth = defineExtractor({
    name: 'automation_health',
    source_family: 'GSDR',
    raw_sources: ['planning_config'],
    runtimes: ['project'],
    reliability_tier: 'direct_observation',
    features_produced: ['automation_health'],
    serves_loop: ['pipeline_integrity'],
    distinguishes: ['automation_fire_skip_balance', 'automation_skip_reasons'],
    status_semantics: ['exposed', 'not_available', 'not_emitted'],
    extract(extractor, context) {
      const raw = getGsdrRaw(context);
      const automationStats = raw.config.automation_stats || {};
      const featureNames = Object.keys(automationStats);
      const availability = raw.config.exists
        ? (featureNames.length > 0 ? 'exposed' : 'not_emitted')
        : 'not_available';
      const evidencePath = raw.config.exists ? raw.config.path : null;

      return [buildFeatureRecord(extractor, {
        feature_name: 'automation_health',
        runtime: 'project',
        availability_status: availability,
        symmetry_marker: symmetryForAvailability(availability),
        value: {
          feature_count: featureNames.length,
          features: featureNames
            .sort()
            .map(name => ({
              name,
              fires: Number(automationStats[name].fires || 0),
              skips: Number(automationStats[name].skips || 0),
              last_triggered: automationStats[name].last_triggered || null,
              last_skip_reason: automationStats[name].last_skip_reason || null,
            })),
          last_triggered_at: latestTriggeredAt(Object.values(automationStats)),
        },
        coverage: buildCoverage(
          ['planning_config'],
          [evidencePath],
          { stats_keys: featureNames.sort() }
        ),
        provenance: {
          source_keys: ['planning_config'],
          evidence_paths: evidencePath ? [evidencePath] : [],
          observed_at: raw.observed_at,
        },
        freshness: raw.config.freshness,
        notes: [
          'Automation health is read directly from persisted automation stats in .planning/config.json.',
        ],
      })];
    },
  });

  const automationSignalYield = defineExtractor({
    name: 'automation_signal_yield',
    source_family: 'GSDR',
    raw_sources: ['planning_config'],
    runtimes: ['project'],
    reliability_tier: 'direct_observation',
    features_produced: ['automation_signal_yield'],
    // signal_quality: automation_signal_yield IS named in LOOP_DEFINITIONS.signal_quality.named_metrics (registry.cjs:64); signal_yield is a distinguishing feature (registry.cjs:71).
    serves_loop: ['pipeline_integrity', 'signal_quality'],
    distinguishes: ['sensor_signal_yield', 'missing_signal_yield_persistence'],
    status_semantics: ['exposed', 'not_available', 'not_emitted'],
    extract(extractor, context) {
      const raw = getGsdrRaw(context);
      const sensors = sensorStatsFromConfig(raw);
      const sensorsWithCounts = sensors.filter(sensor => sensor.last_signal_count !== null);
      const availability = !raw.config.exists
        ? 'not_available'
        : (sensorsWithCounts.length > 0 ? 'exposed' : 'not_emitted');
      const evidencePath = raw.config.exists ? raw.config.path : null;

      return [buildFeatureRecord(extractor, {
        feature_name: 'automation_signal_yield',
        runtime: 'project',
        availability_status: availability,
        symmetry_marker: symmetryForAvailability(availability),
        value: {
          sensor_count: sensors.length,
          sensors,
          sensors_with_counts: sensorsWithCounts.length,
          total_last_signal_count: sensorsWithCounts.reduce((sum, sensor) => sum + sensor.last_signal_count, 0),
        },
        coverage: buildCoverage(
          ['planning_config'],
          [evidencePath],
          {
            stats_keys: sensors.map(sensor => sensor.stats_key),
            persisted_signal_counts: sensorsWithCounts.map(sensor => sensor.stats_key),
          }
        ),
        provenance: {
          source_keys: ['planning_config'],
          evidence_paths: evidencePath ? [evidencePath] : [],
          observed_at: raw.observed_at,
        },
        freshness: raw.config.freshness,
        notes: [
          'Signal yield is only considered emitted when sensor_* automation stats persist last_signal_count through the supported automation track-event path.',
        ],
      })];
    },
  });

  const interventionLifecycleArtifactTrace = defineExtractor({
    name: 'intervention_lifecycle_artifact_trace',
    source_family: 'GSDR',
    raw_sources: ['phase_summaries', 'phase_verifications', 'knowledge_signals', 'git_history'],
    runtimes: ['project'],
    reliability_tier: 'artifact_derived',
    features_produced: ['intervention_lifecycle_artifact_trace'],
    serves_loop: ['intervention_lifecycle', 'pipeline_integrity'],
    distinguishes: ['artifact_trace_coverage', 'git_trace_depth'],
    status_semantics: ['exposed', 'not_available', 'not_emitted'],
    extract(extractor, context) {
      const raw = getGsdrRaw(context);
      const summaryPaths = raw.artifacts.summaries.map(artifact => artifact.path);
      const verificationPaths = raw.artifacts.verifications.map(artifact => artifact.path);
      const signalPaths = raw.artifacts.signals.map(signal => signal.path);
      const hasSources = summaryPaths.length > 0 || verificationPaths.length > 0 || signalPaths.length > 0 || raw.artifacts.git_history.available;
      const availability = hasSources
        ? 'exposed'
        : 'not_emitted';
      const evidencePaths = [...summaryPaths, ...verificationPaths, ...signalPaths];

      return [buildFeatureRecord(extractor, {
        feature_name: 'intervention_lifecycle_artifact_trace',
        runtime: 'project',
        availability_status: availability,
        symmetry_marker: symmetryForAvailability(availability),
        value: {
          summaries: {
            count: raw.artifacts.summaries.length,
            items: raw.artifacts.summaries.map(artifact => ({
              phase: artifact.phase,
              plan: artifact.plan,
              path: artifact.path,
              title: artifact.title,
              modified_at: artifact.modified_at,
            })),
          },
          verifications: {
            count: raw.artifacts.verifications.length,
            items: raw.artifacts.verifications.map(artifact => ({
              phase: artifact.phase,
              path: artifact.path,
              title: artifact.title,
              modified_at: artifact.modified_at,
            })),
          },
          signals: {
            count: raw.artifacts.signals.length,
            items: raw.artifacts.signals.map(signal => ({
              id: signal.id,
              project: signal.project,
              severity: signal.severity,
              path: signal.path,
              modified_at: signal.modified_at,
            })),
          },
          git_trace: {
            available: raw.artifacts.git_history.available,
            commit_count: raw.artifacts.git_history.commits.length,
            recent_commits: raw.artifacts.git_history.commits.slice(0, 5),
          },
        },
        coverage: buildCoverage(
          ['phase_summaries', 'phase_verifications', 'knowledge_signals', 'git_history'],
          [
            summaryPaths[0] || null,
            verificationPaths[0] || null,
            signalPaths[0] || null,
            raw.artifacts.git_history.available ? 'git-log' : null,
          ],
          {
            summary_count: raw.artifacts.summaries.length,
            verification_count: raw.artifacts.verifications.length,
            signal_count: raw.artifacts.signals.length,
            git_commit_count: raw.artifacts.git_history.commits.length,
          }
        ),
        provenance: {
          source_keys: ['phase_summaries', 'phase_verifications', 'knowledge_signals', 'git_history'],
          evidence_paths: evidencePaths.slice(0, 10),
          observed_at: raw.observed_at,
          git_scope_paths: raw.artifacts.git_history.scope_paths,
        },
        freshness: {
          status: availability === 'exposed' ? 'fresh' : 'unknown',
          observed_at: raw.observed_at,
          modified_at: raw.artifacts.surface.freshest_modified_at,
          reasons: availability === 'exposed' ? [] : ['no_artifacts_observed'],
          stale_after_hours: null,
          age_hours: null,
        },
        notes: [
          'Retroactive intervention traces are built from existing SUMMARY.md, VERIFICATION.md, signal files, and scoped git history without requiring new collection.',
        ],
      })];
    },
  });

  const kbSignalStats = defineExtractor({
    name: 'kb_signal_stats',
    source_family: 'GSDR',
    raw_sources: ['knowledge_signals', 'knowledge_index', 'knowledge_kb_db'],
    runtimes: ['project'],
    reliability_tier: 'artifact_derived',
    features_produced: ['kb_signal_stats'],
    // signal_quality: kb_signal_stats IS named in LOOP_DEFINITIONS.signal_quality.named_metrics (registry.cjs:63) - tagging here closes the gap between declaration and dispatch.
    serves_loop: ['pipeline_integrity', 'signal_quality'],
    distinguishes: ['kb_signal_counts', 'kb_freshness_state'],
    status_semantics: ['derived', 'not_available', 'not_emitted'],
    extract(extractor, context) {
      const raw = getGsdrRaw(context);
      const stats = raw.kb.stats || {};
      const hasSignalFiles = raw.artifacts.signals.length > 0;
      const availability = stats.available
        ? 'derived'
        : (hasSignalFiles ? 'not_emitted' : 'not_available');
      const evidencePaths = [
        raw.kb.db_path && fsSafeExists(raw.kb.db_path) ? raw.kb.db_path : null,
        raw.kb.index_path && fsSafeExists(raw.kb.index_path) ? raw.kb.index_path : null,
      ];

      return [buildFeatureRecord(extractor, {
        feature_name: 'kb_signal_stats',
        runtime: 'project',
        availability_status: availability,
        symmetry_marker: symmetryForAvailability(availability),
        value: {
          trusted: raw.kb.freshness.status === 'fresh',
          freshness_status: raw.kb.freshness.status,
          totals: stats.totals,
          breakdowns: stats.breakdowns || {},
          signal_file_count: raw.kb.signal_file_count,
          db_path: raw.kb.db_path,
          index_path: raw.kb.index_path,
        },
        coverage: buildCoverage(
          ['knowledge_signals', 'knowledge_index', 'knowledge_kb_db'],
          [
            raw.artifacts.signals[0] ? raw.artifacts.signals[0].path : null,
            evidencePaths[1],
            evidencePaths[0],
          ],
          {
            signal_file_count: raw.kb.signal_file_count,
            db_available: Boolean(stats.available),
          }
        ),
        provenance: {
          source_keys: ['knowledge_signals', 'knowledge_index', 'knowledge_kb_db'],
          evidence_paths: evidencePaths.filter(Boolean),
          observed_at: raw.observed_at,
          last_rebuilt: stats.last_rebuilt || null,
          schema_version: stats.schema_version || null,
        },
        freshness: raw.kb.freshness,
        notes: [
          raw.kb.freshness.status === 'fresh'
            ? 'KB-backed counts are fresh enough to use directly.'
            : 'KB-backed counts are present, but freshness is stale-or-unknown and must not be treated as silently trustworthy.',
        ],
      })];
    },
  });

  const skipReasonCanonicalExtractor = defineExtractor({
    name: 'skip_reason_canonical',
    source_family: 'GSDR',
    raw_sources: ['planning_config'],
    runtimes: ['project'],
    reliability_tier: 'direct_observation',
    features_produced: ['skip_reason_canonical'],
    serves_loop: ['signal_quality', 'pipeline_integrity'],
    distinguishes: ['skip_reason_vocabulary_drift', 'non_canonical_skip_reasons'],
    status_semantics: ['exposed', 'not_available', 'not_emitted'],
    extract(extractor, context) {
      const gsdr = getGsdrRaw(context);
      const gsdrConfig = gsdr.config || {};
      const configExists = Boolean(gsdrConfig.exists);
      const configData = gsdrConfig.data || null;
      if (!configExists || !configData) {
        return [buildFeatureRecord(extractor, {
          feature_name: 'skip_reason_canonical',
          runtime: 'project',
          availability_status: 'not_available',
          symmetry_marker: 'asymmetric_only',
          reliability_tier: 'direct_observation',
          value: { reason: 'no .planning/config.json or config.data empty' },
          coverage: {},
          provenance: { config_path: gsdrConfig.path || null },
          freshness: combinePathFreshness(context.observed_at, []),
          notes: ['Config absent; extractor cannot evaluate skip_reason canonicity.'],
        })];
      }

      const manifestPath = path.resolve(__dirname, '..', '..', '..', '..', 'feature-manifest.json');
      let canonical = [];
      try {
        canonical = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).automation_skip_reasons || [];
      } catch (_error) {
        canonical = [];
      }

      if (canonical.length === 0) {
        return [buildFeatureRecord(extractor, {
          feature_name: 'skip_reason_canonical',
          runtime: 'project',
          availability_status: 'not_available',
          symmetry_marker: 'asymmetric_only',
          reliability_tier: 'direct_observation',
          value: { reason: 'feature-manifest.automation_skip_reasons missing or empty' },
          coverage: {},
          provenance: { manifest_path: manifestPath },
          freshness: combinePathFreshness(context.observed_at, [manifestPath]),
          notes: ['Canonical enum unavailable — cannot classify.'],
        })];
      }

      const stats = gsdrConfig.automation_stats || (configData.automation && configData.automation.stats) || {};
      const featureKeys = Object.keys(stats);
      if (featureKeys.length === 0) {
        return [buildFeatureRecord(extractor, {
          feature_name: 'skip_reason_canonical',
          runtime: 'project',
          availability_status: 'not_emitted',
          symmetry_marker: 'asymmetric_only',
          reliability_tier: 'direct_observation',
          value: { canonical_enum: canonical, count_by_reason: {} },
          coverage: { feature_count: 0 },
          provenance: { manifest_path: manifestPath },
          freshness: combinePathFreshness(context.observed_at, [manifestPath]),
          notes: ['No automation features tracked yet.'],
        })];
      }

      return featureKeys.map(featureKey => {
        const featureStats = stats[featureKey] || {};
        const lastSkipReason = featureStats.last_skip_reason || null;
        const canonicalMatch = Boolean(lastSkipReason) && canonical.includes(lastSkipReason);
        return buildFeatureRecord(extractor, {
          feature_name: `skip_reason_canonical:${featureKey}`,
          runtime: 'project',
          availability_status: lastSkipReason ? 'exposed' : 'not_emitted',
          symmetry_marker: 'asymmetric_only',
          reliability_tier: 'direct_observation',
          value: {
            feature_key: featureKey,
            last_skip_reason: lastSkipReason,
            canonical: canonicalMatch,
            canonical_match: canonicalMatch ? lastSkipReason : 'unknown',
            count_by_reason: null,
          },
          coverage: { feature_key: featureKey },
          provenance: {
            manifest_path: manifestPath,
            config_key: `automation.stats.${featureKey}.last_skip_reason`,
          },
          freshness: combinePathFreshness(context.observed_at, [manifestPath]),
          notes: lastSkipReason && !canonicalMatch
            ? ['Non-canonical skip_reason observed; may indicate vocabulary drift.']
            : [],
        });
      });
    },
  });

  return [
    automationHealth,
    automationSignalYield,
    interventionLifecycleArtifactTrace,
    kbSignalStats,
    skipReasonCanonicalExtractor,
  ];
}

function fsSafeExists(filePath) {
  try {
    return Boolean(filePath) && require('node:fs').existsSync(filePath);
  } catch {
    return false;
  }
}

module.exports = {
  buildGsdrExtractors,
  GSDR_EXTRACTOR_NAMES: [
    'automation_health',
    'automation_signal_yield',
    'intervention_lifecycle_artifact_trace',
    'kb_signal_stats',
    'skip_reason_canonical',
  ],
};
