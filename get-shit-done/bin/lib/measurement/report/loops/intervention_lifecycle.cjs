'use strict';

const { headerBlock, mdTable } = require('../primitives.cjs');

const LOOP_LABEL = 'Intervention Lifecycle';
const FEATURE_BASES = [
  'intervention_lifecycle_artifact_trace',
  'runtime_session_identity',
  'human_turn_count_jsonl',
];
const CAVEATS = [
  'Retroactive intervention evidence stays tied to provenance rather than recollection.',
  'Coverage gaps are data, not defects.',
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

function interpretationsTable(queryResult) {
  return mdTable(
    ['ID', 'Summary', 'Reliability', 'Competing Readings'],
    (queryResult.interpretations || []).map((interpretation) => [
      interpretation.id || '-',
      interpretation.summary || '-',
      interpretation.reliability_tier || '-',
      Array.isArray(interpretation.competing_readings) ? interpretation.competing_readings.join(' / ') : '-',
    ])
  );
}

function anomaliesTable(queryResult) {
  return mdTable(
    ['Kind', 'Source/Feature', 'Runtime', 'Detail'],
    (queryResult.anomaly_register || []).map((anomaly) => [
      anomaly.kind || '-',
      anomaly.source_key || anomaly.feature || '-',
      anomaly.runtime || '-',
      anomaly.freshness_status || anomaly.availability_status || '-',
    ])
  );
}

exports.render = function render(queryResult, opts = {}) {
  const features = selectFeatures(queryResult);
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
  }));
  out.push('');
  out.push('## Feature Summary');
  out.push(mdTable(
    ['Feature', 'Runtime', 'Availability', 'Symmetry', 'Reliability', 'Rows'],
    summarizeFeatures(features)
  ));
  out.push('');
  out.push('## Interpretations');
  out.push(interpretationsTable(queryResult));
  if ((queryResult.anomaly_register || []).length > 0) {
    out.push('');
    out.push('## Anomaly Register');
    out.push(anomaliesTable(queryResult));
  }
  return out.join('\n');
};
