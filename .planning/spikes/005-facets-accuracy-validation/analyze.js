#!/usr/bin/env node
// Facets accuracy validation — cross-correlation analysis
// No external dependencies.

const fs = require('fs');
const path = require('path');

const FACETS_DIR = path.join(process.env.HOME, '.claude/usage-data/facets');
const SESSION_META_DIR = path.join(process.env.HOME, '.claude/usage-data/session-meta');

// ---- Load data ----

const facetsFiles = fs.readdirSync(FACETS_DIR).filter(f => f.endsWith('.json'));
console.log(`Found ${facetsFiles.length} facets files`);

const joined = [];
const noMatch = [];

for (const fname of facetsFiles) {
  let facets;
  try {
    facets = JSON.parse(fs.readFileSync(path.join(FACETS_DIR, fname), 'utf8'));
  } catch (e) {
    console.error(`Failed to parse facets ${fname}: ${e.message}`);
    continue;
  }

  const sessionId = facets.session_id || fname.replace('.json', '');
  const metaPath = path.join(SESSION_META_DIR, `${sessionId}.json`);

  if (!fs.existsSync(metaPath)) {
    noMatch.push(sessionId);
    continue;
  }

  let meta;
  try {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse meta ${sessionId}: ${e.message}`);
    continue;
  }

  // Compute total friction count
  const friction_counts = facets.friction_counts || {};
  const total_friction = Object.values(friction_counts).reduce((s, v) => s + v, 0);

  // Compute total tool calls
  const tool_counts = meta.tool_counts || {};
  const total_tool_calls = Object.values(tool_counts).reduce((s, v) => s + v, 0);

  // Compute tool error rate (avoid div by zero)
  const tool_error_rate = total_tool_calls > 0
    ? (meta.tool_errors || 0) / total_tool_calls
    : null;

  joined.push({
    session_id: sessionId,
    // facets fields
    outcome: facets.outcome || null,
    session_type: facets.session_type || null,
    claude_helpfulness: facets.claude_helpfulness || null,
    total_friction,
    friction_counts,
    // meta fields
    tool_errors: meta.tool_errors || 0,
    user_interruptions: meta.user_interruptions || 0,
    duration_minutes: meta.duration_minutes || 0,
    total_tool_calls,
    tool_error_rate,
    user_message_count: meta.user_message_count || 0,
    assistant_message_count: meta.assistant_message_count || 0,
  });
}

console.log(`Joined: ${joined.length} sessions, No match: ${noMatch.length}\n`);

// ---- Helper functions ----

function groupBy(arr, key) {
  const groups = {};
  for (const item of arr) {
    const k = item[key] !== null && item[key] !== undefined ? item[key] : '__null__';
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
  }
  return groups;
}

function mean(arr) {
  if (arr.length === 0) return null;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

function median(arr) {
  if (arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stddev(arr) {
  if (arr.length < 2) return null;
  const m = mean(arr);
  return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

function formatStats(arr) {
  return `n=${arr.length}, mean=${mean(arr)?.toFixed(2)}, median=${median(arr)?.toFixed(2)}, sd=${stddev(arr)?.toFixed(2)}`;
}

// ---- Correlation 1: outcome vs mean tool_errors ----

console.log('=== CORRELATION 1: outcome vs tool_errors ===');
const byOutcome = groupBy(joined, 'outcome');
const outcomeOrder = ['fully_achieved', 'mostly_achieved', 'partially_achieved', 'not_achieved', '__null__'];
for (const outcome of outcomeOrder) {
  if (!byOutcome[outcome]) continue;
  const errs = byOutcome[outcome].map(r => r.tool_errors);
  console.log(`  ${outcome.padEnd(22)}: ${formatStats(errs)}`);
}

// ---- Correlation 2: total_friction vs user_interruptions ----

console.log('\n=== CORRELATION 2: total_friction vs user_interruptions ===');
// Bin friction counts
const frictionBins = { '0': [], '1': [], '2-3': [], '4+': [] };
for (const r of joined) {
  const f = r.total_friction;
  if (f === 0) frictionBins['0'].push(r);
  else if (f === 1) frictionBins['1'].push(r);
  else if (f <= 3) frictionBins['2-3'].push(r);
  else frictionBins['4+'].push(r);
}
for (const [bin, items] of Object.entries(frictionBins)) {
  const ints = items.map(r => r.user_interruptions);
  console.log(`  friction=${bin.padEnd(5)}: interruptions ${formatStats(ints)}`);
}

// Also: Pearson-like rank check — does more friction = more interruptions?
const frictionVsInt = joined.map(r => [r.total_friction, r.user_interruptions]);
// Spearman-ish: rank correlation approximation
function spearman(pairs) {
  const n = pairs.length;
  if (n < 3) return null;
  const rankX = rankArray(pairs.map(p => p[0]));
  const rankY = rankArray(pairs.map(p => p[1]));
  let dSqSum = 0;
  for (let i = 0; i < n; i++) {
    dSqSum += (rankX[i] - rankY[i]) ** 2;
  }
  return 1 - (6 * dSqSum) / (n * (n * n - 1));
}

function rankArray(arr) {
  const indexed = arr.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]);
  const ranks = new Array(arr.length);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length - 1 && indexed[j + 1][0] === indexed[j][0]) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) ranks[indexed[k][1]] = avgRank;
    i = j + 1;
  }
  return ranks;
}

const rhoFriction = spearman(frictionVsInt);
console.log(`  Spearman rho (friction vs interruptions): ${rhoFriction?.toFixed(4)}`);

// ---- Correlation 3: session_type vs duration_minutes ----

console.log('\n=== CORRELATION 3: session_type vs duration_minutes ===');
const byType = groupBy(joined, 'session_type');
for (const [type, items] of Object.entries(byType)) {
  const durs = items.map(r => r.duration_minutes);
  console.log(`  ${type.padEnd(20)}: ${formatStats(durs)}`);
}

// ---- Correlation 4: claude_helpfulness vs tool error rate ----

console.log('\n=== CORRELATION 4: claude_helpfulness vs tool_error_rate ===');
const byHelpfulness = groupBy(joined, 'claude_helpfulness');
const helpOrder = ['essential', 'very_helpful', 'helpful', 'slightly_helpful', 'not_helpful', '__null__'];
for (const h of helpOrder) {
  if (!byHelpfulness[h]) continue;
  const rates = byHelpfulness[h].map(r => r.tool_error_rate).filter(r => r !== null);
  const errs = byHelpfulness[h].map(r => r.tool_errors);
  console.log(`  ${h.padEnd(20)}: error_rate ${formatStats(rates)} | tool_errors ${formatStats(errs)}`);
}

// ---- Outlier Analysis ----

console.log('\n=== OUTLIER ANALYSIS ===');

// Fully achieved but high error count
const fullyAchieved = joined.filter(r => r.outcome === 'fully_achieved');
const highErrorFullyAchieved = fullyAchieved.filter(r => r.tool_errors >= 5);
console.log(`\n"fully_achieved" sessions with tool_errors >= 5 (n=${highErrorFullyAchieved.length}):`);
for (const r of highErrorFullyAchieved.sort((a, b) => b.tool_errors - a.tool_errors).slice(0, 5)) {
  console.log(`  ${r.session_id.slice(0, 8)}... errors=${r.tool_errors} friction=${r.total_friction} helpfulness=${r.claude_helpfulness}`);
}

// Essential helpfulness but high interruptions
const essential = joined.filter(r => r.claude_helpfulness === 'essential');
const highIntEssential = essential.filter(r => r.user_interruptions >= 2);
console.log(`\n"essential" helpfulness with user_interruptions >= 2 (n=${highIntEssential.length}):`);
for (const r of highIntEssential.sort((a, b) => b.user_interruptions - a.user_interruptions).slice(0, 5)) {
  console.log(`  ${r.session_id.slice(0, 8)}... interruptions=${r.user_interruptions} errors=${r.tool_errors} duration=${r.duration_minutes}min`);
}

// Not achieved or partially achieved with 0 friction
const poorOutcome = joined.filter(r => r.outcome === 'not_achieved' || r.outcome === 'partially_achieved');
const zeroFrictionPoor = poorOutcome.filter(r => r.total_friction === 0);
console.log(`\nPoor outcome (not/partial) but zero friction (n=${zeroFrictionPoor.length}):`);
for (const r of zeroFrictionPoor.slice(0, 5)) {
  console.log(`  ${r.session_id.slice(0, 8)}... outcome=${r.outcome} errors=${r.tool_errors} interruptions=${r.user_interruptions}`);
}

// ---- Summary statistics ----

console.log('\n=== OVERALL DISTRIBUTION ===');
const outcomes = groupBy(joined, 'outcome');
console.log('\nOutcome distribution:');
for (const [k, v] of Object.entries(outcomes)) {
  console.log(`  ${k.padEnd(25)}: ${v.length} (${(100 * v.length / joined.length).toFixed(1)}%)`);
}

const helpDist = groupBy(joined, 'claude_helpfulness');
console.log('\nHelpfulness distribution:');
for (const [k, v] of Object.entries(helpDist)) {
  console.log(`  ${k.padEnd(25)}: ${v.length} (${(100 * v.length / joined.length).toFixed(1)}%)`);
}

const typeDist = groupBy(joined, 'session_type');
console.log('\nSession type distribution:');
for (const [k, v] of Object.entries(typeDist)) {
  console.log(`  ${k.padEnd(25)}: ${v.length} (${(100 * v.length / joined.length).toFixed(1)}%)`);
}

console.log('\nOverall metrics:');
console.log(`  tool_errors:        ${formatStats(joined.map(r => r.tool_errors))}`);
console.log(`  user_interruptions: ${formatStats(joined.map(r => r.user_interruptions))}`);
console.log(`  total_friction:     ${formatStats(joined.map(r => r.total_friction))}`);
console.log(`  duration_minutes:   ${formatStats(joined.map(r => r.duration_minutes))}`);
