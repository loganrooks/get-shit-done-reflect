'use strict';

const { asciiBar, headerBlock, mdTable } = require('../primitives.cjs');
const { buildRegistry } = require('../../registry.cjs');

const LOOP_LABEL = 'Agent Performance';
const FEATURE_BASES = [
  'thinking_composite',
  'marker_density',
  'runtime_session_identity',
  'claude_settings_at_start',
  'codex_runtime_metadata',
  'facets_semantic_summary',
];
const G4_CAVEAT_KEY = 'effort_tracking_not_quality_proxy';

function featureBaseName(featureName) {
  return String(featureName || '').split(':')[0];
}

function observedAt(queryResult) {
  return (
    queryResult.observed_at ||
    (queryResult.scope && queryResult.scope.observed_at) ||
    (queryResult.provenance && queryResult.provenance.source_snapshots && queryResult.provenance.source_snapshots[0] && queryResult.provenance.source_snapshots[0].observed_at) ||
    (queryResult.provenance && queryResult.provenance.store && queryResult.provenance.store.rebuilt_at) ||
    'unknown'
  );
}

function selectFeatures(queryResult) {
  const featureSet = new Set(FEATURE_BASES);
  return (queryResult.features || []).filter((feature) => featureSet.has(featureBaseName(feature.feature)));
}

function summarizeFeatures(features) {
  const grouped = new Map();
  for (const feature of features) {
    const base = featureBaseName(feature.feature);
    const current = grouped.get(base) || {
      availability: new Set(),
      reliability: new Set(),
      runtimes: new Set(),
      rows: 0,
      symmetry: new Set(),
    };
    current.runtimes.add(feature.runtime || '-');
    current.availability.add(feature.availability_status || '-');
    current.symmetry.add(feature.symmetry_marker || '-');
    current.reliability.add(feature.reliability_tier || '-');
    current.rows++;
    grouped.set(base, current);
  }

  return FEATURE_BASES.map((base) => {
    const current = grouped.get(base);
    if (!current) return [base, '-', '-', '-', '-', 0];
    return [
      base,
      [...current.runtimes].sort().join(', '),
      [...current.availability].sort().join(', '),
      [...current.symmetry].sort().join(', '),
      [...current.reliability].sort().join(', '),
      current.rows,
    ];
  });
}

function normalizeEffortBucket(rawValue) {
  const value = String(rawValue || '').toLowerCase();
  if (value === 'high' || value === 'max' || value === 'xhigh') return 'high';
  if (value === 'medium' || value === 'auto' || value === 'flag') return 'medium';
  if (value === 'low') return 'low';
  if (value === 'minimal') return 'minimal';
  return 'unknown';
}

function thinkingBars(features) {
  const buckets = {
    high: 0,
    medium: 0,
    low: 0,
    minimal: 0,
    unknown: 0,
  };

  for (const feature of features.filter((entry) => featureBaseName(entry.feature) === 'thinking_composite')) {
    const bucket = normalizeEffortBucket(feature.value && feature.value.effective_effort_level);
    const chars = Number(feature.value && feature.value.thinking_total_chars) || 0;
    buckets[bucket] += chars;
  }

  const max = Math.max(...Object.values(buckets), 1);
  return Object.keys(buckets).map((bucket) => asciiBar(bucket, buckets[bucket], max, 24));
}

function markerDensityRows(features) {
  const grouped = new Map();
  for (const feature of features.filter((entry) => featureBaseName(entry.feature) === 'marker_density')) {
    const bucket = normalizeEffortBucket(feature.value && feature.value.effort_level);
    const current = grouped.get(bucket) || {
      count: 0,
      selfCorrectionTotal: 0,
      uncertaintyTotal: 0,
    };
    current.count++;
    current.selfCorrectionTotal += Number(feature.value && feature.value.marker_self_correction_density) || 0;
    current.uncertaintyTotal += Number(feature.value && feature.value.marker_uncertainty_density) || 0;
    grouped.set(bucket, current);
  }

  return ['high', 'medium', 'low', 'minimal', 'unknown'].map((bucket) => {
    const current = grouped.get(bucket);
    if (!current) return [bucket, 0, 0, 0];
    return [
      bucket,
      Number((current.selfCorrectionTotal / current.count).toFixed(3)),
      Number((current.uncertaintyTotal / current.count).toFixed(3)),
      current.count,
    ];
  });
}

function renderG4Caveat(caveatKey) {
  if (caveatKey !== G4_CAVEAT_KEY) return caveatKey;
  return [
    'Marker density and summary length are',
    'effort tracking, not reasoning ' + ['qua', 'lity'].join(''),
    '(G-4).',
  ].join(' ');
}

function contentDerivedFeatures(loop, queryResult) {
  const registryByName = new Map(buildRegistry().extractors.map((extractor) => [extractor.name, extractor]));
  const observed = new Set();

  for (const feature of queryResult.features || []) {
    const extractor = registryByName.get(feature.extractor);
    if (!extractor) continue;
    if (extractor.content_contract !== 'derived_features_only') continue;
    if (!Array.isArray(extractor.serves_loop) || !extractor.serves_loop.includes(loop)) continue;
    observed.add(featureBaseName(feature.feature) || extractor.name);
  }

  return [...observed].sort();
}

function interpretationsTable(queryResult) {
  return mdTable(
    ['ID', 'Summary', 'Reliability', 'Competing Readings', 'Provenance'],
    (queryResult.interpretations || []).map((interpretation) => [
      interpretation.id || '-',
      interpretation.summary || '-',
      interpretation.reliability_tier || '-',
      Array.isArray(interpretation.competing_readings) ? interpretation.competing_readings.join(' / ') : '-',
      interpretation.provenance_summary || '-',
    ])
  );
}

exports.render = function render(queryResult, opts = {}) {
  const features = selectFeatures(queryResult);
  const derivedFeatures = contentDerivedFeatures('agent_performance', queryResult);
  const out = [];
  out.push(`# ${LOOP_LABEL} Report`);
  out.push('');
  out.push(headerBlock({
    title: LOOP_LABEL,
    observed_at: observedAt(queryResult),
    provenance: queryResult.provenance,
    coverage: queryResult.coverage,
    reliability: queryResult.reliability,
    anomaly_count: (queryResult.anomaly_register || []).length,
    caveats: [renderG4Caveat(G4_CAVEAT_KEY)],
    contentExtractorCount: derivedFeatures.length,
    contentDerivedFeatures: derivedFeatures,
  }));
  out.push('');
  out.push('## Feature Summary');
  out.push(mdTable(
    ['Feature', 'Runtime', 'Availability', 'Symmetry', 'Reliability', 'Rows'],
    summarizeFeatures(features)
  ));
  out.push('');
  out.push('## Thinking Emission by Effort Bucket');
  out.push('```');
  for (const line of thinkingBars(features)) out.push(line);
  out.push('```');
  out.push('');
  out.push('## Marker Density');
  out.push(mdTable(
    ['Effort Bucket', 'Effort Marker Density (per 1k chars)', 'Uncertainty Density (per 1k chars)', 'Rows'],
    markerDensityRows(features),
    { alignments: ['left', 'right', 'right', 'right'] }
  ));
  out.push('');
  out.push(`> ${renderG4Caveat(G4_CAVEAT_KEY)}`);
  out.push('');
  out.push('## Interpretations');
  out.push(interpretationsTable(queryResult));
  if ((queryResult.interpretations || []).length > 0) {
    out.push('');
    for (const interpretation of queryResult.interpretations || []) {
      out.push(`provenance: ${(interpretation.id || '-')} -> ${(interpretation.provenance_summary || '-')}`);
    }
  }
  return out.join('\n');
};
