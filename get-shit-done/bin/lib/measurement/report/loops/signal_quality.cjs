'use strict';

const { asciiBar, headerBlock, mdTable } = require('../primitives.cjs');

const LOOP_LABEL = 'Signal Quality';
const FEATURE_BASES = [
  'kb_signal_stats',
  'automation_signal_yield',
  'session_meta_provenance',
  'facets_semantic_summary',
  'insights_mass_rewrite_boundary',
  'skip_reason_canonical',
];
const BASE_CAVEATS = [
  'Absence is data: facets coverage asymmetry remains visible instead of being averaged away (G-2).',
];
const STRATIFICATION_WARNING = 'WARNING: --no-stratification flag used. Aggregate numbers are biased by facets coverage asymmetry (E5.8 Finding C: 25.6% new coverage vs 40.7% historical; mean user_msg 20.1 with vs 5.4 without). USE AT OWN EPISTEMIC RISK.';

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

function facetsRows(features, stratified) {
  const facetFeatures = features.filter((feature) => featureBaseName(feature.feature) === 'facets_semantic_summary');
  if (stratified !== false) {
    const byBucket = {};
    for (const feature of facetFeatures) {
      const bucket = (feature.value && feature.value.stratification && feature.value.stratification.size_bucket) || 'unknown';
      if (!byBucket[bucket]) {
        byBucket[bucket] = { withFacet: 0, withoutFacet: 0 };
      }
      if (feature.availability_status === 'derived') byBucket[bucket].withFacet++;
      if (feature.availability_status === 'not_emitted') byBucket[bucket].withoutFacet++;
    }

    return mdTable(
      ['Size Bucket', 'Sessions With Facet', 'Sessions Without Facet'],
      Object.keys(byBucket).sort().map((bucket) => [
        bucket,
        byBucket[bucket].withFacet,
        byBucket[bucket].withoutFacet,
      ]),
      { alignments: ['left', 'right', 'right'] }
    );
  }

  const withFacet = facetFeatures.filter((feature) => feature.availability_status === 'derived').length;
  const withoutFacet = facetFeatures.filter((feature) => feature.availability_status === 'not_emitted').length;
  return mdTable(
    ['With Facet', 'Without Facet'],
    [[withFacet, withoutFacet]],
    { alignments: ['right', 'right'] }
  );
}

function skipReasonBars(features) {
  const skipRows = features.filter((feature) => featureBaseName(feature.feature) === 'skip_reason_canonical');
  const canonical = skipRows.filter((feature) => feature.value && feature.value.canonical === true).length;
  const nonCanonical = skipRows.filter((feature) => feature.availability_status === 'exposed' && feature.value && feature.value.canonical === false).length;
  const max = Math.max(canonical, nonCanonical, 1);
  return [
    asciiBar('canonical', canonical, max, 24),
    asciiBar('non_canonical', nonCanonical, max, 24),
  ];
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
  const caveats = opts.stratified === false ? [...BASE_CAVEATS, STRATIFICATION_WARNING] : BASE_CAVEATS;
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
    caveats,
  }));
  out.push('');
  out.push('## Feature Summary');
  out.push(mdTable(
    ['Feature', 'Runtime', 'Availability', 'Symmetry', 'Reliability', 'Rows'],
    summarizeFeatures(features)
  ));
  out.push('');
  out.push(opts.stratified === false
    ? '## Facets Coverage - Aggregate (STRATIFICATION BYPASSED, WARNING IN HEADER)'
    : '## Facets Coverage - Stratified by Size Bucket (DEFAULT)');
  out.push(facetsRows(features, opts.stratified));
  out.push('');
  out.push('## Skip Reason Canonicity');
  out.push('```');
  for (const line of skipReasonBars(features)) out.push(line);
  out.push('```');
  out.push('');
  out.push('## Interpretations');
  out.push(interpretationsTable(queryResult));
  return out.join('\n');
};
