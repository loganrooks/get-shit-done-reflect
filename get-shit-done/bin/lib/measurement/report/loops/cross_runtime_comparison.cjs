'use strict';

const { headerBlock, mdTable } = require('../primitives.cjs');

const LOOP_LABEL = 'Cross-Runtime Comparison';
const CAVEATS = [
  'Asymmetry is data (G-5) - absent features on a runtime mean not_applicable OR not_emitted, not "broken".',
  'Compaction zero-firings reflect operator habit (49 /clear invocations), not Claude absence-of-mechanism (E6.2).',
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

function runtimeDimensionRows(queryResult) {
  const runtimeDimension = queryResult.runtime_dimension || { by_feature: [], runtimes_observed: [] };
  return (runtimeDimension.runtimes_observed || []).map((runtime) => {
    const features = (runtimeDimension.by_feature || []).filter((feature) => Array.isArray(feature.runtimes) && feature.runtimes.includes(runtime));
    const availabilityMix = [...new Set(features.flatMap((feature) => feature.availability_statuses || []))].sort().join('/');
    const symmetryMix = [...new Set(features.flatMap((feature) => feature.symmetry_markers || []))].sort().join('/');
    return [
      runtime,
      features.length,
      availabilityMix || '-',
      symmetryMix || '-',
    ];
  });
}

function compactionRows(queryResult) {
  const compactionFeatures = (queryResult.features || []).filter((feature) => {
    const base = featureBaseName(feature.feature);
    return base === 'claude_compaction_events' || base === 'codex_compaction_events';
  });
  const byRuntime = {
    'claude-code': [],
    'codex-cli': [],
  };

  for (const feature of compactionFeatures) {
    if (!byRuntime[feature.runtime]) byRuntime[feature.runtime] = [];
    byRuntime[feature.runtime].push(feature);
  }

  return ['claude-code', 'codex-cli'].map((runtime) => {
    const rows = byRuntime[runtime] || [];
    const availability = [...new Set(rows.map((row) => row.availability_status || '-'))].sort().join(', ');
    const symmetry = [...new Set(rows.map((row) => row.symmetry_marker || '-'))].sort().join(', ');
    return [
      runtime,
      rows.length,
      rows.filter((row) => row.value && row.value.has_compaction).length,
      rows.reduce((sum, row) => sum + ((row.value && row.value.compaction_count) || 0), 0),
      availability || 'not_available',
      symmetry || '-',
    ];
  });
}

function distinguishingRows(queryResult) {
  return (queryResult.distinguishing_features || []).map((feature) => [
    feature.feature || '-',
    Array.isArray(feature.symmetry_markers) ? feature.symmetry_markers.join(', ') : '-',
    Array.isArray(feature.availability_statuses) ? feature.availability_statuses.join(', ') : '-',
  ]);
}

function anomalyRows(queryResult) {
  return (queryResult.anomaly_register || []).map((anomaly) => [
    anomaly.kind || '-',
    anomaly.source_key || anomaly.feature || '-',
    anomaly.runtime || '-',
    anomaly.freshness_status || anomaly.availability_status || '-',
  ]);
}

exports.render = function render(queryResult, opts = {}) {
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
  out.push('## Runtime Dimension');
  out.push(mdTable(
    ['Runtime', 'Features Observed', 'Availability Mix', 'Symmetry Mix'],
    runtimeDimensionRows(queryResult),
    { alignments: ['left', 'right', 'left', 'left'] }
  ));
  out.push('');
  out.push('## Compaction Events (cross-runtime bridge)');
  out.push(mdTable(
    ['Runtime', 'Sessions Scanned', 'Sessions with Compaction', 'Total Events', 'Availability', 'Symmetry'],
    compactionRows(queryResult),
    { alignments: ['left', 'right', 'right', 'right', 'left', 'left'] }
  ));
  out.push('');
  out.push('## Distinguishing Features');
  out.push(mdTable(
    ['Feature', 'Symmetry Markers', 'Availability Statuses'],
    distinguishingRows(queryResult)
  ));
  if ((queryResult.anomaly_register || []).length > 0) {
    out.push('');
    out.push('## Anomaly Register');
    out.push(mdTable(
      ['Kind', 'Source/Feature', 'Runtime', 'Detail'],
      anomalyRows(queryResult)
    ));
  }
  out.push('');
  out.push('## Interpretations');
  for (const interpretation of (queryResult.interpretations || [])) {
    out.push(`### ${interpretation.id || 'interpretation'}`);
    out.push(interpretation.summary || '-');
    out.push('');
    out.push('**Competing readings:**');
    for (const reading of (interpretation.competing_readings || [])) {
      out.push(`- ${reading}`);
    }
    out.push('');
    out.push(`**Distinguishing features (computed):** ${(interpretation.distinguishing_features || []).join(', ') || '(none)'}`);
    out.push(`**Reliability tier:** ${interpretation.reliability_tier || '-'}`);
    out.push('');
  }
  return out.join('\n').trimEnd();
};
