'use strict';

const { asciiBar, headerBlock, mdTable } = require('../primitives.cjs');
const { buildRegistry } = require('../../registry.cjs');

const LOOP_LABEL = 'Pipeline Integrity';
const FEATURE_BASES = [
  'automation_health',
  'automation_signal_yield',
  'kb_freshness_probe',
  'runtime_jsonl_coverage',
  'derived_write_path_provenance',
  'skip_reason_canonical',
];
const CAVEATS = [
  'Coverage gaps are data, not defects - they show where measurement cannot yet reach (G-3).',
];

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

function coverageBars(queryResult) {
  const bySourceFamily = (queryResult.coverage && queryResult.coverage.by_source_family) || {};
  let missing = 0;
  let stale = 0;
  let unknown = 0;
  let healthy = 0;

  for (const family of Object.keys(bySourceFamily)) {
    const bucket = bySourceFamily[family] || {};
    const required = Array.isArray(bucket.required_sources) ? bucket.required_sources.length : 0;
    const missingCount = Array.isArray(bucket.missing_sources) ? bucket.missing_sources.length : 0;
    const staleCount = Array.isArray(bucket.stale_sources) ? bucket.stale_sources.length : 0;
    const unknownCount = Array.isArray(bucket.unknown_sources) ? bucket.unknown_sources.length : 0;
    const healthyCount = Math.max(0, required - missingCount - staleCount - unknownCount);
    missing += missingCount;
    stale += staleCount;
    unknown += unknownCount;
    healthy += healthyCount;
  }

  const max = Math.max(healthy, missing, stale, unknown, 1);
  return [
    asciiBar('healthy', healthy, max, 24),
    asciiBar('missing', missing, max, 24),
    asciiBar('stale', stale, max, 24),
    asciiBar('unknown', unknown, max, 24),
  ];
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
  const derivedFeatures = contentDerivedFeatures('pipeline_integrity', queryResult);
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
    caveats: CAVEATS,
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
  out.push('## Coverage Status');
  out.push('```');
  for (const line of coverageBars(queryResult)) out.push(line);
  out.push('```');
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
