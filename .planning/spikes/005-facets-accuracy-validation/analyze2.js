#!/usr/bin/env node
// Supplemental analysis: deeper dives on notable patterns

const fs = require('fs');
const path = require('path');

const FACETS_DIR = path.join(process.env.HOME, '.claude/usage-data/facets');
const SESSION_META_DIR = path.join(process.env.HOME, '.claude/usage-data/session-meta');

const facetsFiles = fs.readdirSync(FACETS_DIR).filter(f => f.endsWith('.json'));
const joined = [];

for (const fname of facetsFiles) {
  let facets, meta;
  try { facets = JSON.parse(fs.readFileSync(path.join(FACETS_DIR, fname), 'utf8')); } catch { continue; }
  const sessionId = facets.session_id || fname.replace('.json', '');
  const metaPath = path.join(SESSION_META_DIR, `${sessionId}.json`);
  if (!fs.existsSync(metaPath)) continue;
  try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch { continue; }
  const friction_counts = facets.friction_counts || {};
  const total_friction = Object.values(friction_counts).reduce((s, v) => s + v, 0);
  const tool_counts = meta.tool_counts || {};
  const total_tool_calls = Object.values(tool_counts).reduce((s, v) => s + v, 0);
  joined.push({
    session_id: sessionId,
    outcome: facets.outcome || null,
    session_type: facets.session_type || null,
    claude_helpfulness: facets.claude_helpfulness || null,
    total_friction,
    friction_types: Object.keys(friction_counts),
    tool_errors: meta.tool_errors || 0,
    user_interruptions: meta.user_interruptions || 0,
    duration_minutes: meta.duration_minutes || 0,
    total_tool_calls,
    tool_error_rate: total_tool_calls > 0 ? (meta.tool_errors || 0) / total_tool_calls : null,
    user_message_count: meta.user_message_count || 0,
  });
}

function mean(arr) { return arr.length ? arr.reduce((s,v)=>s+v,0)/arr.length : null; }
function median(arr) {
  if (!arr.length) return null;
  const s = [...arr].sort((a,b)=>a-b);
  const m = Math.floor(s.length/2);
  return s.length%2 ? s[m] : (s[m-1]+s[m])/2;
}

// --- 1. Confusion matrix: outcome vs helpfulness ---
console.log('=== OUTCOME x HELPFULNESS CROSS-TAB ===');
const outcomes = ['fully_achieved','mostly_achieved','partially_achieved','not_achieved','unclear_from_transcript'];
const helplevels = ['essential','very_helpful','moderately_helpful','slightly_helpful','unhelpful'];
// Header
process.stdout.write('outcome\\help'.padEnd(28));
for (const h of helplevels) process.stdout.write(h.slice(0,8).padStart(10));
console.log();
for (const o of outcomes) {
  process.stdout.write(o.slice(0,27).padEnd(28));
  for (const h of helplevels) {
    const count = joined.filter(r => r.outcome === o && r.claude_helpfulness === h).length;
    process.stdout.write((count || '-').toString().padStart(10));
  }
  console.log();
}

// --- 2. Unhelpful sessions: what is the outcome pattern? ---
console.log('\n=== "unhelpful" sessions detail (n=' + joined.filter(r=>r.claude_helpfulness==='unhelpful').length + ') ===');
for (const r of joined.filter(r=>r.claude_helpfulness==='unhelpful')) {
  console.log(`  ${r.session_id.slice(0,8)}... outcome=${r.outcome} type=${r.session_type} errors=${r.tool_errors} ints=${r.user_interruptions} friction=${r.total_friction} dur=${r.duration_minutes}min`);
}

// --- 3. Duration analysis: exclude outliers (>1000min) ---
const reasonable = joined.filter(r => r.duration_minutes <= 1000);
const outlierDur = joined.filter(r => r.duration_minutes > 1000);
console.log(`\n=== DURATION: reasonable sessions (<=1000min): n=${reasonable.length}, outliers (>1000min): n=${outlierDur.length} ===`);
['multi_task','single_task','exploration','iterative_refinement','quick_question'].forEach(t => {
  const items = reasonable.filter(r => r.session_type === t);
  if (!items.length) return;
  const durs = items.map(r => r.duration_minutes);
  console.log(`  ${t.padEnd(25)}: n=${items.length} mean=${mean(durs)?.toFixed(1)} median=${median(durs)?.toFixed(1)}`);
});

// --- 4. Key insight: fully_achieved high-error outliers detail ---
console.log('\n=== FULLY_ACHIEVED high-error outlier detail (errors >= 5) ===');
for (const r of joined.filter(r => r.outcome==='fully_achieved' && r.tool_errors >= 5)) {
  console.log(`  ${r.session_id.slice(0,8)} errors=${r.tool_errors} rate=${r.tool_error_rate?.toFixed(3)} tools=${r.total_tool_calls} friction=${r.total_friction} types=[${r.friction_types}] help=${r.claude_helpfulness} dur=${r.duration_minutes}min`);
}

// --- 5. Friction type breakdown ---
console.log('\n=== FRICTION TYPE DISTRIBUTION ===');
const frictionTypeCounts = {};
for (const r of joined) {
  for (const t of r.friction_types) {
    frictionTypeCounts[t] = (frictionTypeCounts[t] || 0) + 1;
  }
}
const sorted = Object.entries(frictionTypeCounts).sort((a,b) => b[1]-a[1]);
for (const [t, c] of sorted) {
  console.log(`  ${t.padEnd(30)}: ${c}`);
}
console.log(`  (zero friction sessions: ${joined.filter(r=>r.total_friction===0).length})`);

// --- 6. Correlation: user_message_count vs outcome (proxy for effort needed) ---
console.log('\n=== USER_MESSAGE_COUNT vs OUTCOME (proxy for user effort) ===');
for (const o of outcomes) {
  const items = joined.filter(r => r.outcome === o);
  if (!items.length) continue;
  const msgs = items.map(r => r.user_message_count);
  console.log(`  ${o.padEnd(28)}: n=${items.length} mean=${mean(msgs)?.toFixed(1)} median=${median(msgs)?.toFixed(1)}`);
}

// --- 7. Weak signal check: does 0-friction predict 0-interruptions? ---
console.log('\n=== ZERO FRICTION → INTERRUPTION RATE ===');
const zeroF = joined.filter(r => r.total_friction === 0);
const nonZeroF = joined.filter(r => r.total_friction > 0);
const zeroFzeroI = zeroF.filter(r => r.user_interruptions === 0).length;
const nonZeroFzeroI = nonZeroF.filter(r => r.user_interruptions === 0).length;
console.log(`  Zero friction (n=${zeroF.length}): ${zeroFzeroI} (${(100*zeroFzeroI/zeroF.length).toFixed(1)}%) had 0 interruptions`);
console.log(`  Non-zero friction (n=${nonZeroF.length}): ${nonZeroFzeroI} (${(100*nonZeroFzeroI/nonZeroF.length).toFixed(1)}%) had 0 interruptions`);

// --- 8. Check the Correlation 4 gap: essential vs very_helpful on tool_errors ---
console.log('\n=== HELPFULNESS TIER ERROR RATES (detailed) ===');
for (const h of helplevels) {
  const items = joined.filter(r => r.claude_helpfulness === h);
  if (!items.length) continue;
  const zeroErr = items.filter(r => r.tool_errors === 0).length;
  const highErr = items.filter(r => r.tool_errors >= 3).length;
  const errs = items.map(r => r.tool_errors);
  console.log(`  ${h.padEnd(20)}: n=${items.length} zero_err=${zeroErr}(${(100*zeroErr/items.length).toFixed(0)}%) high_err(>=3)=${highErr}(${(100*highErr/items.length).toFixed(0)}%) mean_err=${mean(errs)?.toFixed(2)}`);
}
