'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { loadClaude } = require('../../../../get-shit-done/bin/lib/measurement/sources/claude.cjs');

const SPIKE_DIR = path.resolve(__dirname, '..');
const RUBRIC_PATH = path.join(SPIKE_DIR, 'supporting-data', 'rubric-sample.md');
const FACETS_OUTPUT_PATH = path.join(SPIKE_DIR, 'supporting-data', 'facets-substitute-trial.md');
const REFERENCE_OUTPUT_PATH = path.join(SPIKE_DIR, 'supporting-data', 'reference-density-trial.md');

const HELPFULNESS_SCORES = {
  essential: 1.4,
  very_helpful: 1.25,
  moderately_helpful: 0.75,
  slightly_helpful: 0.25,
  not_helpful: 0,
};

const OUTCOME_SCORES = {
  fully_achieved: 1.5,
  mostly_achieved: 1.0,
  partially_achieved: 0.5,
  not_achieved: 0,
};

const REFERENCE_PATTERNS = [
  /@\.planning\//g,
  /@get-shit-done\//g,
  /\bphase\s+5[0-9]\b/gi,
  /\bsig-[0-9]{4}-/g,
  /\bspk-[0-9]{4}-/g,
  /[a-z0-9_-]+\.md\b/gi,
];

function parseRubricSample(filePath) {
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  const rows = [];
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('| session_id |')) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (!line.startsWith('|')) break;
    if (/^\|\s*---/.test(line)) continue;

    const cols = line.split('|').slice(1, -1).map((value) => value.trim());
    if (cols.length < 10) continue;

    rows.push({
      session_id: cols[0],
      model: cols[1],
      phase: cols[2],
      era: cols[3],
      mode: cols[4],
      composite_score: Number(cols[9]),
      grading_notes: cols[10] || '',
    });
  }

  return rows;
}

function rankArray(values) {
  const indexed = values.map((value, index) => [value, index]).sort((left, right) => left[0] - right[0]);
  const ranks = new Array(values.length);
  let cursor = 0;

  while (cursor < indexed.length) {
    let end = cursor;
    while (end < indexed.length - 1 && indexed[end + 1][0] === indexed[cursor][0]) end++;
    const averageRank = (cursor + end) / 2 + 1;
    for (let idx = cursor; idx <= end; idx++) ranks[indexed[idx][1]] = averageRank;
    cursor = end + 1;
  }

  return ranks;
}

function spearman(pairs) {
  const n = pairs.length;
  if (n < 3) return null;

  const rankX = rankArray(pairs.map((pair) => pair[0]));
  const rankY = rankArray(pairs.map((pair) => pair[1]));

  let dSquared = 0;
  for (let idx = 0; idx < n; idx++) dSquared += (rankX[idx] - rankY[idx]) ** 2;

  return 1 - (6 * dSquared) / (n * (n * n - 1));
}

function formatNumber(value, digits = 2) {
  if (value == null) return 'n/a';
  if (Number.isInteger(value)) return String(value);
  return Number(value).toFixed(digits);
}

function markdownTable(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.join(' | ')} |`);
  return [head, divider, ...body].join('\n');
}

function frictionTotal(facet) {
  if (!facet || !facet.friction_counts || typeof facet.friction_counts !== 'object') return 0;
  return Object.values(facet.friction_counts).reduce((sum, value) => sum + (Number(value) || 0), 0);
}

function facetsProxyScore(facet) {
  if (!facet) return null;

  const satisfaction = facet.user_satisfaction_counts || {};
  const likelySatisfied = Number(satisfaction.likely_satisfied) || 0;
  const dissatisfied = Number(satisfaction.dissatisfied) || 0;
  const goalCategoryCount = facet.goal_categories && typeof facet.goal_categories === 'object'
    ? Object.keys(facet.goal_categories).length
    : 0;

  let score = 1.0;
  score += facet.underlying_goal ? 0.25 : 0;
  score += OUTCOME_SCORES[facet.outcome] ?? 0.25;
  score += HELPFULNESS_SCORES[facet.claude_helpfulness] ?? 0.4;
  score += facet.primary_success ? 0.25 : 0;
  score += Math.min(0.5, likelySatisfied * 0.15);
  score -= Math.min(1.0, dissatisfied * 0.25);
  score -= Math.min(1.25, frictionTotal(facet) * 0.2);
  score += Math.min(0.25, goalCategoryCount * 0.05);

  return Math.max(1, Math.min(5, Number(score.toFixed(2))));
}

function collectAssistantText(records) {
  let text = '';
  for (const record of records || []) {
    if (!record || record.type !== 'assistant') continue;
    const content = record.message && record.message.content;
    if (!Array.isArray(content)) continue;
    for (const block of content) {
      if (block && block.type === 'text' && typeof block.text === 'string') {
        text += `${block.text}\n`;
      }
    }
  }
  return text;
}

function referenceDensity(records) {
  const text = collectAssistantText(records);
  let hits = 0;
  for (const regex of REFERENCE_PATTERNS) {
    const matches = text.match(regex);
    if (matches) hits += matches.length;
  }
  const approxTokens = Math.max(1, text.length / 4);
  return {
    reference_hits: hits,
    approx_tokens: approxTokens,
    references_per_1k_tokens: Number(((hits * 1000) / approxTokens).toFixed(3)),
  };
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function highLowSeparation(rows, key) {
  const high = rows.filter((row) => row.composite_score >= 4.25).map((row) => row[key]).filter((value) => value != null);
  const low = rows.filter((row) => row.composite_score <= 3.5).map((row) => row[key]).filter((value) => value != null);
  return {
    high_count: high.length,
    low_count: low.length,
    high_mean: mean(high),
    low_mean: mean(low),
  };
}

function renderFacetsMarkdown(rows, rho, separation) {
  const coverageCount = rows.filter((row) => row.availability === 'derived').length;
  const table = markdownTable(
    ['session_id', 'model', 'rubric_composite', 'facets_proxy_score', 'availability', 'outcome', 'helpfulness', 'friction_total'],
    rows.map((row) => ([
      row.session_id,
      row.model,
      formatNumber(row.composite_score),
      row.facets_proxy_score == null ? 'n/a' : formatNumber(row.facets_proxy_score),
      row.availability,
      row.outcome || 'n/a',
      row.helpfulness || 'n/a',
      String(row.friction_total),
    ]))
  );

  return `# C5 Facets-Substitute Trial

Generated: ${new Date().toISOString()}

This trial scores the 20-session rubric sample by reading Claude facets directly from the existing measurement substrate. It remains a self-graded validity probe, not final epistemic closure.

## Summary

- Sessions in rubric sample: ${rows.length}
- Sessions with matched facets coverage: ${coverageCount}/${rows.length}
- Spearman rank correlation vs rubric composite: ${formatNumber(rho, 4)}
- High-score group mean (rubric >= 4.25): ${formatNumber(separation.high_mean, 3)}
- Low-score group mean (rubric <= 3.5): ${formatNumber(separation.low_mean, 3)}

## Method

Proxy score formula:

- base score 1.0
- +0.25 if underlying_goal present
- + outcome_weight (fully_achieved=1.5, mostly_achieved=1.0, partially_achieved=0.5, not_achieved=0)
- + helpfulness_weight (very_helpful=1.25, moderately_helpful=0.75, slightly_helpful=0.25, not_helpful=0)
- +0.25 if primary_success present
- +0.15 * likely_satisfied capped at 0.5
- -0.25 * dissatisfied capped at 1.0
- -0.2 * friction_total capped at 1.25
- +0.05 * distinct_goal_categories capped at 0.25
- clamp final score to 1..5

Coverage gaps remain part of the evidence. Sessions without matched facets are not dropped from the rubric sample; they are recorded as unavailable and count against the mechanism's practical coverage.

## Per-Session Results

${table}
`;
}

function renderReferenceMarkdown(rows, rho, separation) {
  const table = markdownTable(
    ['session_id', 'model', 'rubric_composite', 'reference_hits', 'approx_tokens', 'references_per_1k_tokens'],
    rows.map((row) => ([
      row.session_id,
      row.model,
      formatNumber(row.composite_score),
      String(row.reference_hits),
      formatNumber(row.approx_tokens, 1),
      formatNumber(row.references_per_1k_tokens, 3),
    ]))
  );

  return `# C5 Reference-Density Trial

Generated: ${new Date().toISOString()}

This trial scans assistant text blocks for explicit project references and normalizes the match count by approximate token volume (chars / 4). It records counts only; matched text is discarded immediately after counting.

## Summary

- Sessions in rubric sample: ${rows.length}
- Spearman rank correlation vs rubric composite: ${formatNumber(rho, 4)}
- High-score group mean (rubric >= 4.25): ${formatNumber(separation.high_mean, 3)}
- Low-score group mean (rubric <= 3.5): ${formatNumber(separation.low_mean, 3)}

## Match Families

- @.planning/
- @get-shit-done/
- phase 5x
- sig-YYYY-
- spk-YYYY-
- *.md

## Per-Session Results

${table}
`;
}

function main() {
  const rubricRows = parseRubricSample(RUBRIC_PATH);
  const claude = loadClaude(process.cwd());
  const sessionMap = new Map((claude.sessions || []).map((session) => [session.session_id, session]));

  const facetsRows = [];
  const referenceRows = [];

  for (const rubric of rubricRows) {
    const session = sessionMap.get(rubric.session_id) || null;
    const facet = session && session.facets ? session.facets.record : null;
    const density = session ? referenceDensity(session.parent_jsonl.records) : {
      reference_hits: 0,
      approx_tokens: 1,
      references_per_1k_tokens: 0,
    };

    facetsRows.push({
      session_id: rubric.session_id,
      model: rubric.model,
      composite_score: rubric.composite_score,
      facets_proxy_score: facetsProxyScore(facet),
      availability: facet ? 'derived' : 'not_available',
      outcome: facet ? facet.outcome || null : null,
      helpfulness: facet ? facet.claude_helpfulness || null : null,
      friction_total: facet ? frictionTotal(facet) : 0,
    });

    referenceRows.push({
      session_id: rubric.session_id,
      model: rubric.model,
      composite_score: rubric.composite_score,
      reference_hits: density.reference_hits,
      approx_tokens: density.approx_tokens,
      references_per_1k_tokens: density.references_per_1k_tokens,
    });
  }

  const facetsPairs = facetsRows
    .filter((row) => row.facets_proxy_score != null)
    .map((row) => [row.composite_score, row.facets_proxy_score]);
  const referencePairs = referenceRows
    .map((row) => [row.composite_score, row.references_per_1k_tokens]);

  const facetsRho = spearman(facetsPairs);
  const referenceRho = spearman(referencePairs);
  const facetsSeparation = highLowSeparation(facetsRows, 'facets_proxy_score');
  const referenceSeparation = highLowSeparation(referenceRows, 'references_per_1k_tokens');

  fs.writeFileSync(FACETS_OUTPUT_PATH, renderFacetsMarkdown(facetsRows, facetsRho, facetsSeparation), 'utf8');
  fs.writeFileSync(REFERENCE_OUTPUT_PATH, renderReferenceMarkdown(referenceRows, referenceRho, referenceSeparation), 'utf8');

  console.log(JSON.stringify({
    facets: {
      coverage_count: facetsPairs.length,
      spearman_rho: facetsRho,
      high_low_separation: facetsSeparation,
    },
    reference_density: {
      coverage_count: referencePairs.length,
      spearman_rho: referenceRho,
      high_low_separation: referenceSeparation,
    },
  }, null, 2));
}

main();
