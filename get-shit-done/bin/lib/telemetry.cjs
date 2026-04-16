/**
 * Telemetry -- session-meta extraction and baseline computation
 *
 * Reads pre-computed session-meta JSON files from ~/.claude/usage-data/session-meta/
 * and optionally joins facets from ~/.claude/usage-data/facets/.
 *
 * Provides five subcommands: summary, session, phase, baseline, enrich.
 *
 * Design principles (from 57-CONTEXT.md):
 *   - output_tokens is the primary token metric (input_tokens is cache-miss residual)
 *   - Trust-tier filtering before any metric computation
 *   - Facets-derived fields annotated as AI-generated estimates (TEL-05)
 *   - Every metric includes interpretive_notes (epistemic humility)
 *   - No external dependencies -- vanilla Node.js only
 *
 * Sources: spk-004 (token reliability), spk-005 (facets accuracy),
 *          spk-006 (behavioral metrics), spk-007 (data integrity),
 *          spk-008 (cross-runtime validation)
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { output, error, resolveWorktreeRoot, atomicWriteJson } = require('./core.cjs');

let _queryMeasurement = undefined;

// --- Path resolution ---

function getSessionMetaDir() {
  return path.join(os.homedir(), '.claude', 'usage-data', 'session-meta');
}

function getFacetsDir() {
  return path.join(os.homedir(), '.claude', 'usage-data', 'facets');
}

function getQueryMeasurement() {
  if (_queryMeasurement !== undefined) {
    return _queryMeasurement;
  }
  try {
    _queryMeasurement = require('./measurement/query.cjs').queryMeasurement;
  } catch {
    _queryMeasurement = null;
  }
  return _queryMeasurement;
}

function buildTelemetryMeasurementCompatibility(cwd, question = 'pipeline_integrity') {
  const queryMeasurement = getQueryMeasurement();
  if (!queryMeasurement) return null;

  try {
    const response = queryMeasurement(cwd, {
      question,
      scope: 'project',
    });
    return {
      question: response.question,
      runtime_dimension: response.runtime_dimension,
      freshness: response.freshness,
      provenance: {
        store: response.provenance ? response.provenance.store : null,
        live_overlay: response.provenance ? response.provenance.live_overlay : null,
      },
    };
  } catch (compatError) {
    return {
      error: compatError.message,
    };
  }
}

// --- Trust tier filtering (spk-007) ---

function getTrustTier(session) {
  // Exclude: zero-turn phantom sessions
  if (session.assistant_message_count === 0 && session.output_tokens === 0) {
    return 'exclude';
  }
  // Exclude-borderline: ghost initiation with at most 1 assistant message
  if (session.assistant_message_count <= 1 && session.output_tokens === 0 &&
      session.first_prompt === 'No prompt') {
    return 'exclude';
  }
  // Caveated: extreme duration (wall-clock multi-day sessions)
  if (session.duration_minutes > 1000) {
    return 'caveated';
  }
  return 'clean';
}

// --- Statistical computation ---

function computeDistribution(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const pct = (p) => {
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
  };
  return {
    n: sorted.length,
    min: sorted[0],
    p25: pct(25),
    median: pct(50),
    p75: pct(75),
    p90: pct(90),
    max: sorted[sorted.length - 1],
    mean: sorted.reduce((s, v) => s + v, 0) / sorted.length
  };
}

// --- Computed fields (spk-006) ---

function categorizeFirstPrompt(firstPrompt) {
  if (!firstPrompt || firstPrompt === 'No prompt') return 'no_prompt';
  const p = firstPrompt.toLowerCase();
  if (p.startsWith('/gsd:execute-phase') || p.startsWith('/gsdr:execute-phase')) return 'gsd_execute';
  if (p.startsWith('/gsd:plan-phase') || p.startsWith('/gsdr:plan-phase')) return 'gsd_plan';
  if (p.startsWith('/gsd:discuss-phase') || p.startsWith('/gsdr:discuss-phase')) return 'gsd_discuss';
  if (p.startsWith('/gsd:research-phase') || p.startsWith('/gsdr:research-phase')) return 'gsd_research';
  if (p.startsWith('/gsd:spike') || p.startsWith('/gsdr:spike')) return 'gsd_spike';
  if (p.startsWith('/gsd') || p.startsWith('/gsdr')) return 'gsd_other';
  if (p.length < 50) return 'short_task';
  if (p.endsWith('?')) return 'question';
  return 'freeform_task';
}

function computeHoursEntropy(messageHours) {
  if (!messageHours || messageHours.length === 0) return 0;
  const counts = {};
  for (const h of messageHours) counts[h] = (counts[h] || 0) + 1;
  const total = messageHours.length;
  let entropy = 0;
  for (const count of Object.values(counts)) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

function classifyFocusLevel(entropy) {
  if (entropy <= 0.5) return 'focused';
  if (entropy <= 1.5) return 'extended';
  return 'fragmented';
}

// --- Corpus loading ---

function loadSessionMetaCorpus(sessionMetaDir, opts = {}) {
  const { projectFilter, includeCaveated = false } = opts;
  const result = { sessions: [], stats: { total_files: 0, clean: 0, caveated: 0, excluded: 0, malformed: 0 } };

  if (!fs.existsSync(sessionMetaDir)) return result;

  const files = fs.readdirSync(sessionMetaDir).filter(f => f.endsWith('.json'));
  result.stats.total_files = files.length;

  for (const file of files) {
    let session;
    try {
      const raw = fs.readFileSync(path.join(sessionMetaDir, file), 'utf-8').trimEnd();
      session = JSON.parse(raw.replace(/\x00+$/, '')); // null-byte trim (spk-007)
    } catch {
      result.stats.malformed++;
      continue;
    }

    const tier = getTrustTier(session);
    if (tier === 'exclude') {
      result.stats.excluded++;
      continue;
    }
    if (tier === 'caveated') {
      result.stats.caveated++;
      if (!includeCaveated) continue;
    } else {
      result.stats.clean++;
    }

    if (projectFilter) {
      const normalizedProjectPath = resolveWorktreeRoot(session.project_path || '');
      const normalizedFilter = resolveWorktreeRoot(projectFilter);
      if (normalizedProjectPath !== normalizedFilter) continue;
    }

    session._filename = file;
    session._tier = tier;
    result.sessions.push(session);
  }
  return result;
}

// --- Facets loading ---

function loadFacetsIndex(facetsDir) {
  const index = new Map();
  if (!fs.existsSync(facetsDir)) return index;
  const files = fs.readdirSync(facetsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(facetsDir, file), 'utf-8');
      const facet = JSON.parse(raw);
      if (facet.session_id) index.set(facet.session_id, facet);
    } catch { /* skip malformed */ }
  }
  return index;
}

// --- Session enrichment ---

function enrichSession(session, facetsIndex) {
  const hoursEntropy = computeHoursEntropy(session.message_hours);
  return {
    ...session,
    _tier: getTrustTier(session),
    _first_prompt_category: categorizeFirstPrompt(session.first_prompt),
    _hours_entropy: hoursEntropy,
    _focus_level: classifyFocusLevel(hoursEntropy),
    _facet: facetsIndex ? (facetsIndex.get(session.session_id) || null) : null
  };
}

// --- Interpretive notes (epistemic humility convention) ---

function buildInterpretiveNotes() {
  return {
    output_tokens: {
      measures: 'Total tokens generated by the assistant in the session. Validated within 0-8% of JSONL ground truth (spk-004).',
      does_not_measure: 'User input complexity, context window usage, or session difficulty. Does not reflect input_tokens (which are cache-miss residuals, not workload).',
      could_mislead: 'High output_tokens may reflect verbose output or many tool calls rather than session complexity. Multi-agent sessions aggregate sub-agent tokens.'
    },
    tool_errors: {
      measures: 'Count of tool invocations that returned error status during the session.',
      does_not_measure: 'Severity of errors, whether they were recovered from, or whether they indicate poor performance vs. exploratory probing.',
      could_mislead: 'Some workflows intentionally trigger errors (e.g., testing error paths). Zero errors does not mean high quality.'
    },
    duration_minutes: {
      measures: 'Wall-clock elapsed time from session open to close.',
      does_not_measure: 'Active working time. Includes idle periods, user think time, and overnight gaps for multi-day sessions.',
      could_mislead: 'Mean is heavily skewed by multi-day sessions (one at 19,996 min). Always prefer median. Caveated tier (>1000 min) sessions inflate aggregates.'
    },
    user_interruptions: {
      measures: 'Count of times the user interrupted the assistant mid-response.',
      does_not_measure: 'Why the user interrupted. Could be redirection (negative), adding context (neutral), or urgency (positive).',
      could_mislead: 'Zero interruptions could mean smooth flow or unmonitored background execution. High interruptions could mean engaged iteration.'
    },
    message_hours_entropy: {
      measures: 'Shannon entropy of the hour-of-day distribution of messages. Higher entropy = messages spread across more hours.',
      does_not_measure: 'Session quality or productivity. Measures temporal dispersion only.',
      could_mislead: 'A focused single-hour session (entropy ~0) and a brief interrupted session both show low entropy for different reasons.'
    },
    first_prompt_category: {
      measures: 'Classification of the session\'s first user message into workflow categories (gsd_execute, gsd_plan, etc.).',
      does_not_measure: 'What actually happened in the session -- only how it started. Sessions can shift scope after the first prompt.',
      could_mislead: 'GSD-initiated sessions show 2x lower error rates (spk-006), but this reflects structured workflows, not prompt quality per se.'
    },
    facets_outcome: {
      measures: 'AI-generated assessment of whether the session\'s goals were achieved.',
      does_not_measure: 'Objective success. This is a language model\'s interpretation of conversation flow, not ground truth.',
      could_mislead: 'Does NOT correlate with tool_errors (spk-005 finding). A session with many errors can still be rated "fully_achieved". Always annotate as AI estimate.'
    },
    facets_friction: {
      measures: 'AI-generated categorization of friction points encountered during the session.',
      does_not_measure: 'Actual severity or impact of friction. Categories are the AI\'s interpretation of conversation patterns.',
      could_mislead: 'Friction counts correlate with user_interruptions (rho=0.55, spk-005), making it the most validated facets field. But correlation is moderate, not strong.'
    }
  };
}

// --- Breakdown computation helpers ---

function computeBreakdown(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function computeFrictionBreakdown(enrichedSessions) {
  const counts = {};
  for (const s of enrichedSessions) {
    if (s._facet && s._facet.friction_counts) {
      for (const [category, count] of Object.entries(s._facet.friction_counts)) {
        counts[category] = (counts[category] || 0) + count;
      }
    }
  }
  return counts;
}

// --- Human-readable formatting ---

function formatDistributionTable(label, dist) {
  if (!dist) return `  ${label}: no data\n`;
  return `  ${label} (n=${dist.n}): min=${dist.min} | p25=${dist.p25.toFixed(1)} | median=${dist.median.toFixed(1)} | p75=${dist.p75.toFixed(1)} | p90=${dist.p90.toFixed(1)} | max=${dist.max} | mean=${dist.mean.toFixed(1)}\n`;
}

function formatBreakdown(label, breakdown) {
  const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  const lines = [`  ${label}:`];
  for (const [key, count] of entries) {
    lines.push(`    ${key}: ${count}`);
  }
  return lines.join('\n') + '\n';
}

// --- Subcommand: summary ---

function cmdTelemetrySummary(cwd, opts, raw) {
  const sessionMetaDir = getSessionMetaDir();
  const facetsDir = getFacetsDir();
  const { includeCaveated = false } = opts || {};

  const corpus = loadSessionMetaCorpus(sessionMetaDir, { projectFilter: cwd, includeCaveated });
  const facetsIndex = loadFacetsIndex(facetsDir);
  const enriched = corpus.sessions.map(s => enrichSession(s, facetsIndex));

  const distributions = {
    output_tokens: computeDistribution(enriched.map(s => s.output_tokens)),
    tool_errors: computeDistribution(enriched.map(s => s.tool_errors)),
    duration_minutes: computeDistribution(enriched.map(s => s.duration_minutes)),
    user_interruptions: computeDistribution(enriched.map(s => s.user_interruptions))
  };

  const firstPromptBreakdown = computeBreakdown(enriched, s => s._first_prompt_category);
  const focusLevelBreakdown = computeBreakdown(enriched, s => s._focus_level);
  const facetsCoverage = enriched.filter(s => s._facet !== null).length;

  const result = {
    corpus: corpus.stats,
    session_count: enriched.length,
    distributions,
    first_prompt_category: firstPromptBreakdown,
    focus_level: focusLevelBreakdown,
    facets_coverage: {
      matched: facetsCoverage,
      total: enriched.length,
      coverage_pct: enriched.length > 0 ? parseFloat(((facetsCoverage / enriched.length) * 100).toFixed(1)) : 0
    },
    interpretive_notes: buildInterpretiveNotes()
  };

  if (raw) {
    output(result, raw);
  } else {
    const lines = [];
    lines.push('=== Telemetry Summary ===\n');
    lines.push(`Corpus: ${corpus.stats.total_files} files scanned | ${corpus.stats.clean} clean | ${corpus.stats.caveated} caveated | ${corpus.stats.excluded} excluded | ${corpus.stats.malformed} malformed`);
    lines.push(`Sessions (filtered): ${enriched.length}\n`);
    lines.push('Distributions:');
    lines.push(formatDistributionTable('output_tokens', distributions.output_tokens));
    lines.push(formatDistributionTable('tool_errors', distributions.tool_errors));
    lines.push(formatDistributionTable('duration_minutes', distributions.duration_minutes));
    lines.push(formatDistributionTable('user_interruptions', distributions.user_interruptions));
    lines.push(formatBreakdown('First Prompt Category', firstPromptBreakdown));
    lines.push(formatBreakdown('Focus Level', focusLevelBreakdown));
    lines.push(`Facets coverage: ${facetsCoverage}/${enriched.length} (${result.facets_coverage.coverage_pct}%)\n`);
    output({ summary: lines.join('\n') }, false, lines.join('\n'));
  }
}

// --- Subcommand: session ---

function cmdTelemetrySession(cwd, sessionId, raw) {
  const sessionMetaDir = getSessionMetaDir();
  const facetsDir = getFacetsDir();

  // Load corpus without project filter (session_id is globally unique)
  const corpus = loadSessionMetaCorpus(sessionMetaDir, { includeCaveated: true });
  const facetsIndex = loadFacetsIndex(facetsDir);

  // Find session by session_id or filename
  const session = corpus.sessions.find(s =>
    s.session_id === sessionId || s._filename === sessionId || s._filename === `${sessionId}.json`
  );

  if (!session) {
    error(`Session not found: ${sessionId}`);
  }

  const enriched = enrichSession(session, facetsIndex);

  const result = { ...enriched };
  if (result._facet) {
    result._facets_annotation = 'AI-generated estimates with unknown accuracy (TEL-05)';
  }

  if (raw) {
    output(result, raw);
  } else {
    const lines = [];
    lines.push(`=== Session: ${enriched.session_id} ===\n`);
    lines.push(`Project: ${enriched.project_path}`);
    lines.push(`Start: ${enriched.start_time}`);
    lines.push(`Duration: ${enriched.duration_minutes} min`);
    lines.push(`Tier: ${enriched._tier}`);
    lines.push(`First Prompt Category: ${enriched._first_prompt_category}`);
    lines.push(`Focus Level: ${enriched._focus_level} (entropy=${enriched._hours_entropy.toFixed(3)})`);
    lines.push(`Output Tokens: ${enriched.output_tokens}`);
    lines.push(`Tool Errors: ${enriched.tool_errors}`);
    lines.push(`User Interruptions: ${enriched.user_interruptions}`);
    lines.push(`Messages: ${enriched.user_message_count} user / ${enriched.assistant_message_count} assistant`);
    if (enriched._facet) {
      lines.push(`\nFacets (AI-generated estimates with unknown accuracy, TEL-05):`);
      lines.push(`  Outcome: ${enriched._facet.outcome}`);
      lines.push(`  Session Type: ${enriched._facet.session_type}`);
      lines.push(`  Helpfulness: ${enriched._facet.claude_helpfulness}`);
      if (enriched._facet.friction_counts) {
        lines.push(`  Friction: ${JSON.stringify(enriched._facet.friction_counts)}`);
      }
    } else {
      lines.push('\nNo facets data for this session.');
    }
    output({ session: lines.join('\n') }, false, lines.join('\n'));
  }
}

// --- Subcommand: phase ---

function cmdTelemetryPhase(cwd, phaseNum, raw) {
  const sessionMetaDir = getSessionMetaDir();
  const facetsDir = getFacetsDir();
  const measurementCompatibility = buildTelemetryMeasurementCompatibility(cwd);

  // Try to derive phase time window
  let phaseStart = null;
  let phaseEnd = null;
  let windowSource = 'unavailable';

  // Attempt 1: check phase directory mtime
  const projectRoot = resolveWorktreeRoot(cwd);
  const phasesDir = path.join(projectRoot, '.planning', 'phases');
  if (fs.existsSync(phasesDir)) {
    const phaseDirs = fs.readdirSync(phasesDir).filter(d => {
      // Match directories starting with the phase number
      return d.match(new RegExp(`^${phaseNum}[.-]`));
    });
    if (phaseDirs.length > 0) {
      const phaseDir = path.join(phasesDir, phaseDirs[0]);
      try {
        const stat = fs.statSync(phaseDir);
        phaseStart = stat.birthtime || stat.ctime;
        phaseEnd = new Date();
        windowSource = 'directory_timestamps';
      } catch { /* ignore */ }
    }
  }

  // Load corpus with project filter
  const corpus = loadSessionMetaCorpus(sessionMetaDir, { projectFilter: cwd, includeCaveated: true });
  const facetsIndex = loadFacetsIndex(facetsDir);

  // Filter by time window if available
  let filtered = corpus.sessions;
  if (phaseStart && phaseEnd) {
    const startMs = new Date(phaseStart).getTime();
    const endMs = new Date(phaseEnd).getTime();
    filtered = corpus.sessions.filter(s => {
      if (!s.start_time) return false;
      const sessionMs = new Date(s.start_time).getTime();
      return sessionMs >= startMs && sessionMs <= endMs;
    });
  }

  const enriched = filtered.map(s => enrichSession(s, facetsIndex));

  const distributions = {
    output_tokens: computeDistribution(enriched.map(s => s.output_tokens)),
    tool_errors: computeDistribution(enriched.map(s => s.tool_errors)),
    duration_minutes: computeDistribution(enriched.map(s => s.duration_minutes)),
    user_interruptions: computeDistribution(enriched.map(s => s.user_interruptions))
  };

  const firstPromptBreakdown = computeBreakdown(enriched, s => s._first_prompt_category);
  const focusLevelBreakdown = computeBreakdown(enriched, s => s._focus_level);

  const result = {
    phase: phaseNum,
    session_count: enriched.length,
    time_window: {
      start: phaseStart ? phaseStart.toISOString ? phaseStart.toISOString() : new Date(phaseStart).toISOString() : null,
      end: phaseEnd ? phaseEnd.toISOString ? phaseEnd.toISOString() : new Date(phaseEnd).toISOString() : null,
      source: windowSource
    },
    distributions,
    first_prompt_category: firstPromptBreakdown,
    focus_level: focusLevelBreakdown,
    interpretive_notes: buildInterpretiveNotes()
  };

  if (windowSource === 'unavailable') {
    result._warning = 'Phase time window could not be determined. Sessions filtered by project only.';
  }
  if (windowSource === 'directory_timestamps') {
    result._caveat = 'Phase time window approximated from directory creation time to now. Sessions may include work outside this phase.';
  }
  if (measurementCompatibility) {
    result._measurement_compatibility = measurementCompatibility;
  }

  if (raw) {
    output(result, raw);
  } else {
    const lines = [];
    lines.push(`=== Telemetry: Phase ${phaseNum} ===\n`);
    lines.push(`Sessions: ${enriched.length}`);
    lines.push(`Time window: ${result.time_window.start || 'N/A'} to ${result.time_window.end || 'N/A'} (${windowSource})`);
    if (result._warning) lines.push(`WARNING: ${result._warning}`);
    if (result._caveat) lines.push(`CAVEAT: ${result._caveat}`);
    lines.push('\nDistributions:');
    lines.push(formatDistributionTable('output_tokens', distributions.output_tokens));
    lines.push(formatDistributionTable('tool_errors', distributions.tool_errors));
    lines.push(formatDistributionTable('duration_minutes', distributions.duration_minutes));
    lines.push(formatDistributionTable('user_interruptions', distributions.user_interruptions));
    lines.push(formatBreakdown('First Prompt Category', firstPromptBreakdown));
    lines.push(formatBreakdown('Focus Level', focusLevelBreakdown));
    output({ phase: lines.join('\n') }, false, lines.join('\n'));
  }
}

// --- Subcommand: baseline ---

function cmdTelemetryBaseline(cwd, opts, raw) {
  const sessionMetaDir = getSessionMetaDir();
  const facetsDir = getFacetsDir();
  const { includeCaveated = false } = opts || {};

  // Load full corpus with project filter
  const corpus = loadSessionMetaCorpus(sessionMetaDir, { projectFilter: cwd, includeCaveated: true });
  const facetsIndex = loadFacetsIndex(facetsDir);
  const enriched = corpus.sessions.map(s => enrichSession(s, facetsIndex));

  // Separate clean-only for default distributions
  const cleanSessions = enriched.filter(s => s._tier === 'clean');
  const distributionSource = includeCaveated ? enriched : cleanSessions;

  // Primary behavioral distributions
  const metrics = {
    output_tokens: computeDistribution(distributionSource.map(s => s.output_tokens)),
    tool_errors: computeDistribution(distributionSource.map(s => s.tool_errors)),
    duration_minutes: computeDistribution(distributionSource.map(s => s.duration_minutes)),
    user_interruptions: computeDistribution(distributionSource.map(s => s.user_interruptions))
  };

  // Computed metrics
  const firstPromptBreakdown = computeBreakdown(enriched, s => s._first_prompt_category);
  const focusLevelBreakdown = computeBreakdown(enriched, s => s._focus_level);
  const entropyValues = enriched.map(s => s._hours_entropy);

  const computedMetrics = {
    first_prompt_category: firstPromptBreakdown,
    focus_level: focusLevelBreakdown,
    message_hours_entropy: computeDistribution(entropyValues)
  };

  // Facets metrics (on matched subset only)
  const facetsMatched = enriched.filter(s => s._facet !== null);
  const facetsFrictionValues = facetsMatched.map(s => {
    if (!s._facet.friction_counts) return 0;
    return Object.values(s._facet.friction_counts).reduce((sum, v) => sum + v, 0);
  });

  const facetsMetrics = {
    _annotation: 'AI-generated estimates with unknown accuracy (TEL-05)',
    _n: facetsMatched.length,
    friction_counts: computeDistribution(facetsFrictionValues),
    session_type: computeBreakdown(facetsMatched, s => s._facet.session_type),
    outcome: computeBreakdown(facetsMatched, s => s._facet.outcome)
  };

  const baseline = {
    generated_at: new Date().toISOString(),
    schema_version: '1.0',
    runtime: 'claude-code',
    project: resolveWorktreeRoot(cwd),
    corpus: {
      total_files: corpus.stats.total_files,
      clean_count: corpus.stats.clean,
      caveated_count: corpus.stats.caveated,
      excluded_count: corpus.stats.excluded,
      malformed_count: corpus.stats.malformed
    },
    facets_coverage: {
      total: enriched.length,
      matched: facetsMatched.length,
      coverage_pct: enriched.length > 0 ? parseFloat(((facetsMatched.length / enriched.length) * 100).toFixed(1)) : 0
    },
    metrics,
    computed_metrics: computedMetrics,
    facets_metrics: facetsMetrics,
    interpretive_notes: buildInterpretiveNotes(),
    token_validation: {
      primary_source: 'output_tokens',
      rationale: 'input_tokens is post-cache residual (1-3 tokens/call) -- not a workload proxy. output_tokens validated within 0-8% against JSONL in spk-004.',
      input_tokens_warning: 'input_tokens values in session-meta are NOT session token workload. They reflect cache-miss residuals only.'
    }
  };

  // Write baseline.json
  const outputPath = path.join(resolveWorktreeRoot(cwd), '.planning', 'baseline.json');
  atomicWriteJson(outputPath, baseline);

  if (raw) {
    output(baseline, raw);
  } else {
    const lines = [];
    lines.push('=== Telemetry Baseline ===\n');
    lines.push(`Generated: ${baseline.generated_at}`);
    lines.push(`Project: ${baseline.project}`);
    lines.push(`Corpus: ${baseline.corpus.total_files} files | ${baseline.corpus.clean_count} clean | ${baseline.corpus.caveated_count} caveated | ${baseline.corpus.excluded_count} excluded | ${baseline.corpus.malformed_count} malformed`);
    lines.push(`Facets coverage: ${baseline.facets_coverage.matched}/${baseline.facets_coverage.total} (${baseline.facets_coverage.coverage_pct}%)\n`);
    lines.push('Primary Distributions (clean only):');
    lines.push(formatDistributionTable('output_tokens', metrics.output_tokens));
    lines.push(formatDistributionTable('tool_errors', metrics.tool_errors));
    lines.push(formatDistributionTable('duration_minutes', metrics.duration_minutes));
    lines.push(formatDistributionTable('user_interruptions', metrics.user_interruptions));
    lines.push(formatBreakdown('First Prompt Category', firstPromptBreakdown));
    lines.push(formatBreakdown('Focus Level', focusLevelBreakdown));
    lines.push(`\nBaseline written to: ${outputPath}`);
    output({ baseline: lines.join('\n') }, false, lines.join('\n'));
  }
}

// --- Subcommand: enrich ---

function cmdTelemetryEnrich(cwd, sessionId, raw) {
  const sessionMetaDir = getSessionMetaDir();
  const facetsDir = getFacetsDir();

  // Load corpus without project filter (session_id is globally unique)
  const corpus = loadSessionMetaCorpus(sessionMetaDir, { includeCaveated: true });
  const facetsIndex = loadFacetsIndex(facetsDir);

  // Find session
  const session = corpus.sessions.find(s =>
    s.session_id === sessionId || s._filename === sessionId || s._filename === `${sessionId}.json`
  );

  if (!session) {
    error(`Session not found: ${sessionId}`);
  }

  const enriched = enrichSession(session, facetsIndex);
  const facet = facetsIndex.get(session.session_id);

  if (!facet) {
    const result = {
      ...enriched,
      _facets_message: 'No facets data for this session'
    };
    if (raw) {
      output(result, raw);
    } else {
      const lines = [];
      lines.push(`=== Enriched Session: ${enriched.session_id} ===`);
      lines.push(`Tier: ${enriched._tier}`);
      lines.push(`Category: ${enriched._first_prompt_category}`);
      lines.push(`Focus: ${enriched._focus_level}`);
      lines.push('\nNo facets data for this session.');
      output({ enrich: lines.join('\n') }, false, lines.join('\n'));
    }
    return;
  }

  // Merge session with facet, annotating all facet fields
  const merged = { ...enriched };
  merged._facets_annotation = 'AI-generated estimates with unknown accuracy (TEL-05)';

  // Annotate individual facets fields
  for (const [key, value] of Object.entries(facet)) {
    if (key === 'session_id') continue; // already in session
    merged[`facet_${key}`] = value;
    merged[`facet_${key}_ai_estimate`] = true;
  }

  if (raw) {
    output(merged, raw);
  } else {
    const lines = [];
    lines.push(`=== Enriched Session: ${enriched.session_id} ===`);
    lines.push(`Tier: ${enriched._tier}`);
    lines.push(`Category: ${enriched._first_prompt_category}`);
    lines.push(`Focus: ${enriched._focus_level}`);
    lines.push(`\nFacets Data (AI-generated estimates with unknown accuracy, TEL-05):`);
    lines.push(`  Outcome: ${facet.outcome}`);
    lines.push(`  Session Type: ${facet.session_type}`);
    lines.push(`  Helpfulness: ${facet.claude_helpfulness}`);
    lines.push(`  Goal: ${facet.underlying_goal}`);
    if (facet.friction_counts) {
      lines.push(`  Friction: ${JSON.stringify(facet.friction_counts)}`);
    }
    lines.push(`  Summary: ${facet.brief_summary}`);
    output({ enrich: lines.join('\n') }, false, lines.join('\n'));
  }
}

// --- Exports ---

module.exports = {
  buildTelemetryMeasurementCompatibility,
  cmdTelemetrySummary,
  cmdTelemetrySession,
  cmdTelemetryPhase,
  cmdTelemetryBaseline,
  cmdTelemetryEnrich,
  // Exported for testability
  getTrustTier,
  computeDistribution,
  categorizeFirstPrompt,
  computeHoursEntropy,
  classifyFocusLevel,
  loadSessionMetaCorpus,
  loadFacetsIndex,
  enrichSession,
  buildInterpretiveNotes
};
