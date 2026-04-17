'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { getEncoding } = require('js-tiktoken');

const SPIKE_DIR = path.resolve(__dirname, '..');
const SAMPLE_PATH = path.join(SPIKE_DIR, 'supporting-data', 'sample-sessions.json');
const OUTPUT_PATH = path.join(SPIKE_DIR, 'supporting-data', 'tokenizer-evaluation.md');
const SOURCE_DIR = '/home/rookslog/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonl(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => JSON.parse(line));
}

function collectBlockText(record, blockType, valueKey) {
  const content = record && record.message ? record.message.content : null;
  if (!Array.isArray(content)) return '';
  return content
    .filter(block => block && block.type === blockType && typeof block[valueKey] === 'string')
    .map(block => block[valueKey])
    .join('\n')
    .trim();
}

function charDiv4(text) {
  return text ? Math.ceil(text.length / 4) : 0;
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle];
  return (sorted[middle - 1] + sorted[middle]) / 2;
}

function percent(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(value) {
  if (value == null) return 'n/a';
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

function markdownTable(headers, rows) {
  const head = `| ${headers.join(' | ')} |`;
  const divider = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map(row => `| ${row.join(' | ')} |`);
  return [head, divider, ...body].join('\n');
}

function evaluateRecord(sample, encoder) {
  const filePath = path.join(SOURCE_DIR, `${sample.session_id}.jsonl`);
  const records = readJsonl(filePath);
  const thinkingRecord = records[sample.record_index];
  const visibleRecord = records[sample.record_index + 1];

  if (!thinkingRecord || !visibleRecord) {
    throw new Error(`Missing paired records for ${sample.session_id} @ ${sample.record_index}`);
  }

  const thinkingText = collectBlockText(thinkingRecord, 'thinking', 'thinking');
  const visibleText = collectBlockText(visibleRecord, 'text', 'text');

  if (!thinkingText || !visibleText) {
    throw new Error(`Missing thinking or visible text for ${sample.session_id} @ ${sample.record_index}`);
  }

  const outputTokens = visibleRecord.message &&
    visibleRecord.message.usage &&
    Number.isFinite(visibleRecord.message.usage.output_tokens)
    ? visibleRecord.message.usage.output_tokens
    : sample.output_tokens;

  const jsVisible = encoder.encode(visibleText).length;
  const jsThinking = encoder.encode(thinkingText).length;
  const charVisible = charDiv4(visibleText);
  const charThinking = charDiv4(thinkingText);

  const jsCounted = jsVisible + jsThinking;
  const charCounted = charVisible + charThinking;

  return {
    record_id: `${sample.session_id}:${sample.record_index}`,
    session_id: sample.session_id,
    record_index: sample.record_index,
    model: sample.model,
    output_tokens: outputTokens,
    visible_text_chars: sample.visible_text_chars,
    thinking_summary_chars: sample.thinking_summary_chars,
    tok_visible_jsTiktoken: jsVisible,
    tok_thinking_jsTiktoken: jsThinking,
    counted_total_jsTiktoken: jsCounted,
    predicted_raw_jsTiktoken: outputTokens - jsCounted,
    absolute_relative_error_jsTiktoken: Math.abs(jsCounted - outputTokens) / outputTokens,
    is_negative_jsTiktoken: outputTokens - jsCounted < 0,
    tok_visible_charDiv4: charVisible,
    tok_thinking_charDiv4: charThinking,
    counted_total_charDiv4: charCounted,
    predicted_raw_charDiv4: outputTokens - charCounted,
    absolute_relative_error_charDiv4: Math.abs(charCounted - outputTokens) / outputTokens,
    is_negative_charDiv4: outputTokens - charCounted < 0,
  };
}

function computeStats(results, key) {
  const negativeKey = key === 'jsTiktoken' ? 'is_negative_jsTiktoken' : 'is_negative_charDiv4';
  const errorKey = key === 'jsTiktoken'
    ? 'absolute_relative_error_jsTiktoken'
    : 'absolute_relative_error_charDiv4';
  const predictedKey = key === 'jsTiktoken'
    ? 'predicted_raw_jsTiktoken'
    : 'predicted_raw_charDiv4';
  const negatives = results.filter(result => result[negativeKey]).length;
  return {
    sample_count: results.length,
    median_relative_error: median(results.map(result => result[errorKey])),
    negative_delta_rate: negatives / results.length,
    negative_count: negatives,
    median_predicted_raw: median(results.map(result => result[predictedKey])),
  };
}

function renderMarkdown(results, overallStats, breakdownRows) {
  const generatedAt = new Date().toISOString();
  const recordRows = results.map(result => ([
    result.record_id,
    result.model,
    String(result.output_tokens),
    String(result.tok_visible_jsTiktoken),
    String(result.tok_thinking_jsTiktoken),
    String(result.predicted_raw_jsTiktoken),
    String(result.is_negative_jsTiktoken),
    String(result.tok_visible_charDiv4),
    String(result.tok_thinking_charDiv4),
    String(result.predicted_raw_charDiv4),
    String(result.is_negative_charDiv4),
  ]));

  const summaryRows = [
    [
      'js-tiktoken(cl100k_base)',
      String(overallStats.jsTiktoken.sample_count),
      percent(overallStats.jsTiktoken.median_relative_error),
      percent(overallStats.jsTiktoken.negative_delta_rate),
      String(overallStats.jsTiktoken.negative_count),
      formatNumber(overallStats.jsTiktoken.median_predicted_raw),
    ],
    [
      'charDiv4',
      String(overallStats.charDiv4.sample_count),
      percent(overallStats.charDiv4.median_relative_error),
      percent(overallStats.charDiv4.negative_delta_rate),
      String(overallStats.charDiv4.negative_count),
      formatNumber(overallStats.charDiv4.median_predicted_raw),
    ],
  ];

  return `# C3 Tokenizer Evaluation

Generated: ${generatedAt}

This evaluation uses the committed 50-record sample from \`sample-sessions.json\`. Each sample unit is an adjacent assistant-record pair from Claude JSONL: the first record carries a non-empty \`thinking\` block and the next record carries non-empty visible \`text\`, with matching model and output-token usage.

## Summary Statistics

${markdownTable(
  ['tokenizer', 'sample_count', 'median relative error', 'negative-delta rate', 'negative count', 'median predicted raw thinking tokens'],
  summaryRows
)}

## Per-Model-Family Breakdown

${markdownTable(
  ['model', 'tokenizer', 'sample_count', 'median relative error', 'negative-delta rate', 'negative count', 'median predicted raw thinking tokens'],
  breakdownRows
)}

## Per-Record Results

${markdownTable(
  [
    'record_id',
    'model',
    'output_tokens',
    'tok_visible_jsTiktoken',
    'tok_thinking_jsTiktoken',
    'predicted_raw_jsTiktoken',
    'is_negative_jsTiktoken',
    'tok_visible_charDiv4',
    'tok_thinking_charDiv4',
    'predicted_raw_charDiv4',
    'is_negative_charDiv4',
  ],
  recordRows
)}
`;
}

function main() {
  const sample = readJson(SAMPLE_PATH);
  const encoder = getEncoding('cl100k_base');

  try {
    const results = sample.map(entry => evaluateRecord(entry, encoder));
    const overallStats = {
      jsTiktoken: computeStats(results, 'jsTiktoken'),
      charDiv4: computeStats(results, 'charDiv4'),
    };

    const byModel = [...new Set(results.map(result => result.model))].sort();
    const breakdownRows = [];
    for (const model of byModel) {
      const subset = results.filter(result => result.model === model);
      const jsStats = computeStats(subset, 'jsTiktoken');
      const charStats = computeStats(subset, 'charDiv4');
      breakdownRows.push([
        model,
        'js-tiktoken(cl100k_base)',
        String(jsStats.sample_count),
        percent(jsStats.median_relative_error),
        percent(jsStats.negative_delta_rate),
        String(jsStats.negative_count),
        formatNumber(jsStats.median_predicted_raw),
      ]);
      breakdownRows.push([
        model,
        'charDiv4',
        String(charStats.sample_count),
        percent(charStats.median_relative_error),
        percent(charStats.negative_delta_rate),
        String(charStats.negative_count),
        formatNumber(charStats.median_predicted_raw),
      ]);
    }

    fs.writeFileSync(OUTPUT_PATH, renderMarkdown(results, overallStats, breakdownRows), 'utf8');
    console.log(JSON.stringify({
      output_path: OUTPUT_PATH,
      sample_count: results.length,
      overall: {
        jsTiktoken: overallStats.jsTiktoken,
        charDiv4: overallStats.charDiv4,
      },
    }, null, 2));
  } finally {
    // js-tiktoken's encoder object in this runtime has no explicit free() API.
    // Let normal process teardown release any backing resources.
  }
}

main();
