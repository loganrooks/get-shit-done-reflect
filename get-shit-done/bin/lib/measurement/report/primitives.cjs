'use strict';

function toCell(value) {
  if (value === null || value === undefined || value === '') return '-';
  return String(value)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ');
}

function alignmentRule(alignment) {
  if (alignment === 'right') return '---:';
  if (alignment === 'center') return ':---:';
  return '---';
}

function mdTable(headers, rows, opts = {}) {
  if (!Array.isArray(headers) || headers.length === 0) return '';

  const out = [];
  out.push('| ' + headers.map(toCell).join(' | ') + ' |');
  out.push('| ' + headers.map((_, index) => alignmentRule(opts.alignments && opts.alignments[index])).join(' | ') + ' |');

  if (!Array.isArray(rows) || rows.length === 0) {
    out.push('| ' + headers.map(() => '(no data)').join(' | ') + ' |');
    return out.join('\n');
  }

  for (const row of rows) {
    const cells = headers.map((_, index) => {
      if (!Array.isArray(row)) return '-';
      return toCell(row[index]);
    });
    out.push('| ' + cells.join(' | ') + ' |');
  }

  return out.join('\n');
}

function asciiBar(label, value, max, width = 40) {
  const safeWidth = Number.isFinite(Number(width)) && Number(width) > 0
    ? Math.round(Number(width))
    : 40;
  const numericValue = Math.max(0, Number(value) || 0);
  const numericMax = Math.max(1, Number(max) || 1);
  const ratio = Math.min(1, numericValue / numericMax);
  const filled = Math.min(safeWidth, Math.max(0, Math.round(ratio * safeWidth)));
  const bar = '#'.repeat(filled) + ' '.repeat(Math.max(0, safeWidth - filled));
  return `${label} | ${bar} | ${numericValue}`;
}

function summarizeCoverageFamilies(coverage, key) {
  const families = coverage && coverage.by_source_family && typeof coverage.by_source_family === 'object'
    ? coverage.by_source_family
    : {};
  const parts = [];
  let total = 0;

  for (const family of Object.keys(families).sort()) {
    const bucket = families[family] || {};
    const count = Array.isArray(bucket[key]) ? bucket[key].length : 0;
    total += count;
    parts.push(`${family}=${count}`);
  }

  return {
    total,
    summary: parts.length > 0 ? `${parts.join(', ')} (total=${total})` : 'none (total=0)',
  };
}

function resolveExtractorRegistrySize(provenance, coverage) {
  return (
    (coverage && coverage.extractor_registry_size) ||
    (provenance && provenance.live_overlay && (
      provenance.live_overlay.extractor_registry_size ||
      provenance.live_overlay.extractor_count
    )) ||
    (provenance && provenance.store && provenance.store.registry_count) ||
    'unknown'
  );
}

function resolveFeatureRowCount(provenance, coverage) {
  return (
    (coverage && coverage.feature_row_count) ||
    (provenance && provenance.feature_row_count) ||
    (provenance && provenance.live_overlay && provenance.live_overlay.feature_row_count) ||
    'unknown'
  );
}

function headerBlock({ title, observed_at, provenance, coverage, reliability, anomaly_count, caveats }) {
  const missing = summarizeCoverageFamilies(coverage, 'missing_sources');
  const stale = summarizeCoverageFamilies(coverage, 'stale_sources');
  const unknown = summarizeCoverageFamilies(coverage, 'unknown_sources');
  const tier = (
    (reliability && reliability.overall_tier) ||
    (reliability && reliability.tier) ||
    'unknown'
  );

  const out = [];
  out.push('```');
  out.push(`title: ${title || '(untitled)'}`);
  out.push(`observed_at: ${observed_at || 'unknown'}`);
  out.push(`extractor_registry_size: ${resolveExtractorRegistrySize(provenance, coverage)}`);
  out.push(`feature_row_count: ${resolveFeatureRowCount(provenance, coverage)}`);
  out.push(`coverage.by_source_family.missing_sources: ${missing.summary}`);
  out.push(`coverage.by_source_family.stale_sources: ${stale.summary}`);
  out.push(`coverage.by_source_family.unknown_sources: ${unknown.summary}`);
  out.push(`reliability.overall_tier: ${tier}`);
  out.push(`anomaly_count: ${typeof anomaly_count === 'number' ? anomaly_count : 'unknown'}`);

  if (Array.isArray(caveats) && caveats.length > 0) {
    out.push('caveats:');
    for (const caveat of caveats.filter(Boolean)) {
      out.push(`  - ${String(caveat).replace(/\r?\n/g, ' ')}`);
    }
  }

  out.push('```');
  return out.join('\n');
}

module.exports = {
  asciiBar,
  headerBlock,
  mdTable,
};
