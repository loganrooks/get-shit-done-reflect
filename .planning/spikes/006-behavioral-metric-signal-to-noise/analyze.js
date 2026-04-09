#!/usr/bin/env node
// Behavioral metric signal-to-noise analysis
// Analyzes 268 session-meta files for signal quality

const fs = require('fs');
const path = require('path');

const SESSIONS_DIR = path.join(process.env.HOME, '.claude/usage-data/session-meta');

// ── helpers ──────────────────────────────────────────────────────────────────

function mean(arr) {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function median(arr) {
  if (!arr || arr.length === 0) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function stddev(arr) {
  if (!arr || arr.length < 2) return null;
  const m = mean(arr);
  const variance = arr.reduce((acc, v) => acc + Math.pow(v - m, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function entropy(arr) {
  // Shannon entropy of hour distribution (normalized)
  if (!arr || arr.length === 0) return 0;
  const counts = {};
  arr.forEach(h => { counts[h] = (counts[h] || 0) + 1; });
  const total = arr.length;
  return -Object.values(counts).reduce((acc, c) => {
    const p = c / total;
    return acc + p * Math.log2(p);
  }, 0);
}

function categorizeFirstPrompt(fp) {
  if (!fp || fp === 'No prompt' || fp === '') return 'no_prompt';
  const lower = fp.toLowerCase().trim();
  // GSD commands
  if (/^\/(gsd|gsdr):/.test(fp)) {
    if (/execute-phase/.test(fp)) return 'gsd_execute';
    if (/plan-phase/.test(fp)) return 'gsd_plan';
    if (/discuss-phase/.test(fp)) return 'gsd_discuss';
    if (/verify/.test(fp)) return 'gsd_verify';
    if (/debug/.test(fp)) return 'gsd_debug';
    if (/research/.test(fp)) return 'gsd_research';
    if (/spike/.test(fp)) return 'gsd_spike';
    return 'gsd_other';
  }
  // Question-style prompts
  if (/^(what|how|why|when|where|can|could|should|is|are|do|does|did|will|would)\s/i.test(fp)) return 'question';
  // Short code/task prompts
  if (fp.length < 30) return 'short_task';
  // Free-form task
  return 'freeform_task';
}

function categorizeFocusLevel(messageHours) {
  if (!messageHours || messageHours.length === 0) return 'unknown';
  const uniqueHours = new Set(messageHours).size;
  const e = entropy(messageHours);
  // Detect gaps: sort unique hours and check for gaps > 2 hours
  const sortedHours = [...new Set(messageHours)].sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < sortedHours.length; i++) {
    const gap = sortedHours[i] - sortedHours[i - 1];
    if (gap > maxGap) maxGap = gap;
  }
  // Account for midnight wrap (e.g., hour 23 → hour 1 next day)
  if (sortedHours.length > 1) {
    const wrapGap = (24 - sortedHours[sortedHours.length - 1]) + sortedHours[0];
    // Only count as wrap if the session spans both ends of the day range
    // and total unique hours suggests it might wrap
    if (wrapGap < maxGap && uniqueHours > 3) maxGap = wrapGap;
  }

  if (uniqueHours <= 2) return 'focused';
  if (uniqueHours <= 5 && maxGap <= 3) return 'extended';
  if (uniqueHours > 5 || maxGap > 5 || e > 2.5) return 'fragmented';
  return 'extended';
}

// ── load all sessions ─────────────────────────────────────────────────────────

const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
const sessions = [];
let parseErrors = 0;

for (const f of files) {
  try {
    const raw = fs.readFileSync(path.join(SESSIONS_DIR, f), 'utf8');
    const s = JSON.parse(raw);
    sessions.push(s);
  } catch (e) {
    parseErrors++;
  }
}

console.log(`\nLoaded ${sessions.length} sessions (${parseErrors} parse errors)\n`);

// ── METRIC 1: first_prompt analysis ──────────────────────────────────────────

console.log('═══════════════════════════════════════════════════');
console.log('METRIC 1: first_prompt Category Analysis');
console.log('═══════════════════════════════════════════════════\n');

const byCategory = {};
for (const s of sessions) {
  const cat = categorizeFirstPrompt(s.first_prompt);
  if (!byCategory[cat]) byCategory[cat] = [];
  byCategory[cat].push(s);
}

// Sort by count
const sortedCats = Object.entries(byCategory).sort((a, b) => b[1].length - a[1].length);

console.log('Distribution:');
for (const [cat, ss] of sortedCats) {
  const pct = ((ss.length / sessions.length) * 100).toFixed(1);
  console.log(`  ${cat.padEnd(20)} ${ss.length.toString().padStart(4)}  (${pct}%)`);
}

console.log('\nOutcome cross-reference by category:');
console.log('  Category             | N   | Avg Tool Errs | Avg Interrupts | Avg Duration(min) | P50 Duration');
console.log('  ---------------------|-----|---------------|----------------|-------------------|-------------');

for (const [cat, ss] of sortedCats) {
  const toolErrors = ss.map(s => s.tool_errors || 0);
  const interrupts = ss.map(s => s.user_interruptions || 0);
  const durations = ss.map(s => s.duration_minutes || 0).filter(d => d > 0);

  const avgErr = mean(toolErrors);
  const avgInt = mean(interrupts);
  const avgDur = durations.length > 0 ? mean(durations) : null;
  const medDur = durations.length > 0 ? median(durations) : null;

  console.log(`  ${cat.padEnd(20)} | ${ss.length.toString().padStart(3)} | ${(avgErr || 0).toFixed(2).padStart(13)} | ${(avgInt || 0).toFixed(2).padStart(14)} | ${(avgDur || 0).toFixed(0).padStart(17)} | ${(medDur || 0).toFixed(0).padStart(11)}`);
}

// GSD vs non-GSD summary
const gsdSessions = sessions.filter(s => /^\/(gsd|gsdr):/.test(s.first_prompt || ''));
const nonGsdSessions = sessions.filter(s => !/^\/(gsd|gsdr):/.test(s.first_prompt || '') && s.first_prompt !== 'No prompt' && s.first_prompt);
const noPromptSessions = sessions.filter(s => !s.first_prompt || s.first_prompt === 'No prompt');

console.log('\nGSD vs Non-GSD vs No-Prompt summary:');
for (const [label, ss] of [['GSD commanded', gsdSessions], ['Ad-hoc (has prompt)', nonGsdSessions], ['No prompt', noPromptSessions]]) {
  const toolErrors = ss.map(s => s.tool_errors || 0);
  const interrupts = ss.map(s => s.user_interruptions || 0);
  const durations = ss.map(s => s.duration_minutes || 0).filter(d => d > 0);
  const errRate = mean(toolErrors);
  const intRate = mean(interrupts);
  const durAvg = durations.length ? mean(durations) : 0;
  const durMed = durations.length ? median(durations) : 0;
  console.log(`\n  ${label} (N=${ss.length}):`);
  console.log(`    Avg tool_errors: ${(errRate||0).toFixed(2)}, Avg interrupts: ${(intRate||0).toFixed(2)}`);
  console.log(`    Duration: avg=${durAvg.toFixed(0)}min, median=${durMed.toFixed(0)}min`);
}

// ── METRIC 2: message_hours analysis ─────────────────────────────────────────

console.log('\n\n═══════════════════════════════════════════════════');
console.log('METRIC 2: message_hours Session Fragmentation');
console.log('═══════════════════════════════════════════════════\n');

const withHours = sessions.filter(s => s.message_hours && s.message_hours.length > 0);
const withoutHours = sessions.filter(s => !s.message_hours || s.message_hours.length === 0);

console.log(`Sessions with message_hours: ${withHours.length} / ${sessions.length}`);
console.log(`Sessions without message_hours: ${withoutHours.length}\n`);

const focusCategories = {};
for (const s of withHours) {
  const cat = categorizeFocusLevel(s.message_hours);
  if (!focusCategories[cat]) focusCategories[cat] = [];
  focusCategories[cat].push(s);
}

// Entropy distribution
const entropyValues = withHours.map(s => entropy(s.message_hours));
const uniqueHourCounts = withHours.map(s => new Set(s.message_hours).size);

console.log('Entropy distribution:');
const entropyBuckets = { '0': 0, '0-1': 0, '1-2': 0, '2-3': 0, '3+': 0 };
for (const e of entropyValues) {
  if (e === 0) entropyBuckets['0']++;
  else if (e < 1) entropyBuckets['0-1']++;
  else if (e < 2) entropyBuckets['1-2']++;
  else if (e < 3) entropyBuckets['2-3']++;
  else entropyBuckets['3+']++;
}
for (const [bucket, count] of Object.entries(entropyBuckets)) {
  const pct = ((count / withHours.length) * 100).toFixed(1);
  console.log(`  entropy ${bucket.padEnd(5)}: ${count.toString().padStart(4)} sessions (${pct}%)`);
}

console.log('\nUnique hour spread distribution:');
const spreadBuckets = { '1': 0, '2': 0, '3-5': 0, '6-10': 0, '11+': 0 };
for (const u of uniqueHourCounts) {
  if (u === 1) spreadBuckets['1']++;
  else if (u === 2) spreadBuckets['2']++;
  else if (u <= 5) spreadBuckets['3-5']++;
  else if (u <= 10) spreadBuckets['6-10']++;
  else spreadBuckets['11+']++;
}
for (const [bucket, count] of Object.entries(spreadBuckets)) {
  const pct = ((count / withHours.length) * 100).toFixed(1);
  console.log(`  ${bucket.padEnd(6)} unique hours: ${count.toString().padStart(4)} sessions (${pct}%)`);
}

console.log('\nFocus category distribution:');
const focusSorted = Object.entries(focusCategories).sort((a, b) => b[1].length - a[1].length);
for (const [cat, ss] of focusSorted) {
  const pct = ((ss.length / withHours.length) * 100).toFixed(1);
  console.log(`  ${cat.padEnd(15)}: ${ss.length.toString().padStart(4)} (${pct}%)`);
}

console.log('\nFocus category vs interruptions/errors:');
console.log('  Category       | N   | Avg Entropy | Avg Interrupts | Avg Tool Errs | Avg Duration(min)');
console.log('  ---------------|-----|-------------|----------------|---------------|------------------');
for (const [cat, ss] of focusSorted) {
  const es = ss.map(s => entropy(s.message_hours));
  const ints = ss.map(s => s.user_interruptions || 0);
  const errs = ss.map(s => s.tool_errors || 0);
  const durs = ss.map(s => s.duration_minutes || 0).filter(d => d > 0);
  console.log(`  ${cat.padEnd(15)} | ${ss.length.toString().padStart(3)} | ${(mean(es)||0).toFixed(3).padStart(11)} | ${(mean(ints)||0).toFixed(2).padStart(14)} | ${(mean(errs)||0).toFixed(2).padStart(13)} | ${(durs.length ? mean(durs) : 0).toFixed(0).padStart(16)}`);
}

// Pearson correlation: entropy vs user_interruptions
const pairedEI = withHours
  .filter(s => typeof s.user_interruptions === 'number')
  .map(s => ({ e: entropy(s.message_hours), i: s.user_interruptions }));

if (pairedEI.length > 10) {
  const es = pairedEI.map(x => x.e);
  const is_ = pairedEI.map(x => x.i);
  const me = mean(es), mi = mean(is_);
  const se = stddev(es), si = stddev(is_);
  if (se && si) {
    const cov = pairedEI.reduce((acc, x) => acc + (x.e - me) * (x.i - mi), 0) / pairedEI.length;
    const r = cov / (se * si);
    console.log(`\n  Pearson r (entropy vs interruptions): ${r.toFixed(4)} (N=${pairedEI.length})`);
  }
}

// Pearson correlation: entropy vs tool_errors
const pairedET = withHours
  .filter(s => typeof s.tool_errors === 'number')
  .map(s => ({ e: entropy(s.message_hours), t: s.tool_errors }));

if (pairedET.length > 10) {
  const es = pairedET.map(x => x.e);
  const ts = pairedET.map(x => x.t);
  const me = mean(es), mt = mean(ts);
  const se = stddev(es), st = stddev(ts);
  if (se && st) {
    const cov = pairedET.reduce((acc, x) => acc + (x.e - me) * (x.t - mt), 0) / pairedET.length;
    const r = cov / (se * st);
    console.log(`  Pearson r (entropy vs tool_errors): ${r.toFixed(4)} (N=${pairedET.length})`);
  }
}

// ── METRIC 3: user_response_times analysis ────────────────────────────────────

console.log('\n\n═══════════════════════════════════════════════════');
console.log('METRIC 3: user_response_times Analysis');
console.log('═══════════════════════════════════════════════════\n');

const withRT = sessions.filter(s => s.user_response_times && s.user_response_times.length > 0);
const withoutRT = sessions.filter(s => !s.user_response_times || s.user_response_times.length === 0);

console.log(`Sessions with response times: ${withRT.length} / ${sessions.length}`);
console.log(`Sessions without response times: ${withoutRT.length}\n`);

// Distribution of response time stats
const rtStats = withRT.map(s => {
  const rt = s.user_response_times;
  const m = mean(rt);
  const med = median(rt);
  const sd = stddev(rt);
  const mx = Math.max(...rt);
  const cv = (m && sd) ? sd / m : null;
  const rapidFire = rt.filter(t => t < 5).length;
  const walkAway = rt.filter(t => t > 300).length;
  return { s, m, med, sd, mx, cv, rapidFire, walkAway, n: rt.length };
});

// Overall response time distribution
const allRT = withRT.flatMap(s => s.user_response_times);
console.log(`Total response time observations: ${allRT.length}`);
console.log(`Overall: mean=${mean(allRT).toFixed(1)}s, median=${median(allRT).toFixed(1)}s, stddev=${stddev(allRT).toFixed(1)}s`);
console.log(`Range: min=${Math.min(...allRT).toFixed(1)}s, max=${Math.max(...allRT).toFixed(1)}s\n`);

// Per-session CV distribution
const cvValues = rtStats.filter(r => r.cv !== null).map(r => r.cv);
console.log('Per-session Coefficient of Variation (CV = std/mean) distribution:');
const cvBuckets = { '<0.5': 0, '0.5-1': 0, '1-2': 0, '2-3': 0, '3+': 0 };
for (const cv of cvValues) {
  if (cv < 0.5) cvBuckets['<0.5']++;
  else if (cv < 1) cvBuckets['0.5-1']++;
  else if (cv < 2) cvBuckets['1-2']++;
  else if (cv < 3) cvBuckets['2-3']++;
  else cvBuckets['3+']++;
}
for (const [bucket, count] of Object.entries(cvBuckets)) {
  const pct = ((count / cvValues.length) * 100).toFixed(1);
  console.log(`  CV ${bucket.padEnd(7)}: ${count.toString().padStart(4)} sessions (${pct}%)`);
}

// Frustration signature: sessions with rapid-fire responses
const rapidFireSessions = rtStats.filter(r => r.rapidFire > 0);
const walkAwaySessions = rtStats.filter(r => r.walkAway > 0);
const highCV = rtStats.filter(r => r.cv && r.cv > 2);

console.log(`\nFrustration signatures:`);
console.log(`  Sessions with any rapid-fire (<5s) responses: ${rapidFireSessions.length} / ${withRT.length}`);
console.log(`  Sessions with any walk-away (>300s) responses: ${walkAwaySessions.length} / ${withRT.length}`);
console.log(`  Sessions with high CV (>2, erratic): ${highCV.length} / ${withRT.length}`);

// Cross-reference: high CV vs interruptions
const highCVInterrupts = highCV.map(r => r.s.user_interruptions || 0);
const lowCVInterrupts = rtStats.filter(r => r.cv && r.cv <= 2).map(r => r.s.user_interruptions || 0);

if (highCVInterrupts.length > 0 && lowCVInterrupts.length > 0) {
  console.log(`\nCV vs interruptions cross-reference:`);
  console.log(`  High CV (>2): avg interrupts=${mean(highCVInterrupts).toFixed(2)}, N=${highCVInterrupts.length}`);
  console.log(`  Low CV (≤2):  avg interrupts=${mean(lowCVInterrupts).toFixed(2)}, N=${lowCVInterrupts.length}`);
}

// Cross-reference: rapid-fire vs interruptions
const rfInterrupts = rapidFireSessions.map(r => r.s.user_interruptions || 0);
const nonRFInterrupts = rtStats.filter(r => r.rapidFire === 0).map(r => r.s.user_interruptions || 0);
if (rfInterrupts.length > 0 && nonRFInterrupts.length > 0) {
  console.log(`\nRapid-fire vs interruptions:`);
  console.log(`  Rapid-fire sessions: avg interrupts=${mean(rfInterrupts).toFixed(2)}, avg errors=${mean(rapidFireSessions.map(r => r.s.tool_errors || 0)).toFixed(2)}, N=${rfInterrupts.length}`);
  console.log(`  Normal sessions:     avg interrupts=${mean(nonRFInterrupts).toFixed(2)}, avg errors=${mean(rtStats.filter(r => r.rapidFire === 0).map(r => r.s.tool_errors || 0)).toFixed(2)}, N=${nonRFInterrupts.length}`);
}

// Pearson: CV vs interruptions
const pairedCVI = rtStats.filter(r => r.cv !== null && typeof r.s.user_interruptions === 'number');
if (pairedCVI.length > 10) {
  const cvs = pairedCVI.map(x => x.cv);
  const ints = pairedCVI.map(x => x.s.user_interruptions);
  const mc = mean(cvs), mi = mean(ints);
  const sc = stddev(cvs), si = stddev(ints);
  if (sc && si) {
    const cov = pairedCVI.reduce((acc, x) => acc + (x.cv - mc) * (x.s.user_interruptions - mi), 0) / pairedCVI.length;
    const r = cov / (sc * si);
    console.log(`\n  Pearson r (CV vs interruptions): ${r.toFixed(4)} (N=${pairedCVI.length})`);
  }
}

// Pearson: mean_rt vs tool_errors
const pairedME = rtStats.filter(r => typeof r.s.tool_errors === 'number');
if (pairedME.length > 10) {
  const ms = pairedME.map(x => x.m);
  const es = pairedME.map(x => x.s.tool_errors);
  const mm = mean(ms), me = mean(es);
  const sm = stddev(ms), se = stddev(es);
  if (sm && se) {
    const cov = pairedME.reduce((acc, x) => acc + (x.m - mm) * (x.s.tool_errors - me), 0) / pairedME.length;
    const r = cov / (sm * se);
    console.log(`  Pearson r (mean_response_time vs tool_errors): ${r.toFixed(4)} (N=${pairedME.length})`);
  }
}

// ── COVERAGE SUMMARY ──────────────────────────────────────────────────────────

console.log('\n\n═══════════════════════════════════════════════════');
console.log('COVERAGE & COMPLETENESS SUMMARY');
console.log('═══════════════════════════════════════════════════\n');

const hasFirstPrompt = sessions.filter(s => s.first_prompt && s.first_prompt !== 'No prompt').length;
const hasMessageHours = sessions.filter(s => s.message_hours && s.message_hours.length > 0).length;
const hasResponseTimes = sessions.filter(s => s.user_response_times && s.user_response_times.length > 0).length;

console.log(`Total sessions: ${sessions.length}`);
console.log(`Has first_prompt (non-empty): ${hasFirstPrompt} / ${sessions.length} (${((hasFirstPrompt/sessions.length)*100).toFixed(1)}%)`);
console.log(`Has message_hours:            ${hasMessageHours} / ${sessions.length} (${((hasMessageHours/sessions.length)*100).toFixed(1)}%)`);
console.log(`Has response_times:           ${hasResponseTimes} / ${sessions.length} (${((hasResponseTimes/sessions.length)*100).toFixed(1)}%)`);

// Single-message sessions (only 1 user message — no real exchange)
const singleMsg = sessions.filter(s => (s.user_message_count || 0) <= 1);
console.log(`\nSingle-message sessions (<=1 user msg): ${singleMsg.length} (${((singleMsg.length/sessions.length)*100).toFixed(1)}%)`);
console.log(`Multi-message sessions (>1 user msg):   ${sessions.length - singleMsg.length} (${(((sessions.length-singleMsg.length)/sessions.length)*100).toFixed(1)}%)`);

// How many sessions have BOTH message_hours AND response_times?
const hasBoth = sessions.filter(s =>
  s.message_hours && s.message_hours.length > 0 &&
  s.user_response_times && s.user_response_times.length > 0
).length;
console.log(`\nHas both message_hours AND response_times: ${hasBoth} / ${sessions.length} (${((hasBoth/sessions.length)*100).toFixed(1)}%)`);

// What fraction of non-single-message sessions have response_times?
const multiWithRT = sessions.filter(s =>
  (s.user_message_count || 0) > 1 &&
  s.user_response_times && s.user_response_times.length > 0
).length;
const multiTotal = sessions.filter(s => (s.user_message_count || 0) > 1).length;
console.log(`Multi-message sessions with response_times: ${multiWithRT} / ${multiTotal} (${((multiWithRT/multiTotal)*100).toFixed(1)}%)`);

console.log('\nDone.\n');
