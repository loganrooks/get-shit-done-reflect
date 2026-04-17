'use strict';

const { asciiBar, headerBlock, mdTable } = require('../primitives.cjs');

const LOOP_LABEL = 'Cross-Session Patterns';
const FEATURE_BASES = [
  'session_jsonl_coverage_audit',
  'runtime_era_boundary_registry',
  'runtime_session_identity',
  'clear_invocation',
  'insights_mass_rewrite_boundary',
];
const CAVEATS = [
  'Clear-invocation is an operator-habit signal (G-4), not a reasoning-quality one.',
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

function eraRows(features) {
  const registryRow = features.find((feature) => featureBaseName(feature.feature) === 'runtime_era_boundary_registry');
  const eras = registryRow && registryRow.value && Array.isArray(registryRow.value.eras) ? registryRow.value.eras : [];
  return eras.map((era) => [
    era.label || era.era_key || '-',
    era.versions && era.versions.length > 0 ? era.versions.join(', ') : '-',
    era.session_count || 0,
  ]);
}

function clearBars(features) {
  const clearRows = features.filter((feature) => featureBaseName(feature.feature) === 'clear_invocation');
  const counts = {
    exposed: clearRows.filter((feature) => feature.availability_status === 'exposed').length,
    not_emitted: clearRows.filter((feature) => feature.availability_status === 'not_emitted').length,
    not_available: clearRows.filter((feature) => feature.availability_status === 'not_available').length,
  };
  const max = Math.max(counts.exposed, counts.not_emitted, counts.not_available, 1);
  return [
    asciiBar('sessions_with_clear', counts.exposed, max, 24),
    asciiBar('sessions_without_clear', counts.not_emitted, max, 24),
    asciiBar('sessions_not_available', counts.not_available, max, 24),
  ];
}

function insightsRows(features) {
  const rows = features.filter((feature) => featureBaseName(feature.feature) === 'insights_mass_rewrite_boundary');
  return rows.map((feature) => {
    const window = feature.value && feature.value.batch_mtime_window ? feature.value.batch_mtime_window : {};
    const stale = feature.value && feature.value.staleness && feature.value.staleness.stale_analysis_detected ? 'yes' : 'no';
    return [
      feature.value && feature.value.batch_id ? feature.value.batch_id : '-',
      feature.value && feature.value.batch_size ? feature.value.batch_size : 0,
      window.start || '-',
      window.end || '-',
      stale,
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
  out.push('## Era Boundary Registry');
  out.push(mdTable(
    ['Era', 'Versions', 'Observed Sessions'],
    eraRows(features),
    { alignments: ['left', 'left', 'right'] }
  ));
  out.push('');
  out.push('## Clear Invocation Distribution');
  out.push('```');
  for (const line of clearBars(features)) out.push(line);
  out.push('```');
  out.push('');
  out.push('## Insights Batch Detection');
  out.push(`Detected batches: ${insightsRows(features).length}`);
  out.push('');
  out.push(mdTable(
    ['Batch ID', 'Batch Size', 'Oldest', 'Newest', 'Stale'],
    insightsRows(features),
    { alignments: ['left', 'right', 'left', 'left', 'left'] }
  ));
  out.push('');
  out.push('## Interpretations');
  out.push(interpretationsTable(queryResult));
  return out.join('\n');
};
