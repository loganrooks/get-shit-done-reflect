#!/usr/bin/env node
// Session-meta integrity characterization
// Spike 007: Phase 57 - no external dependencies
'use strict';

const fs = require('fs');
const path = require('path');

const SESSION_META_DIR = path.join(process.env.HOME, '.claude/usage-data/session-meta');

// All fields expected from DESIGN.md experiment plan
const EXPECTED_FIELDS = [
  'session_id', 'project_path', 'start_time', 'duration_minutes',
  'user_message_count', 'assistant_message_count', 'tool_counts',
  'languages', 'git_commits', 'git_pushes', 'input_tokens', 'output_tokens',
  'first_prompt', 'user_interruptions', 'user_response_times', 'tool_errors',
  'tool_error_categories', 'uses_task_agent', 'uses_mcp', 'uses_web_search',
  'uses_web_fetch', 'lines_added', 'lines_removed', 'files_modified',
  'message_hours', 'user_message_timestamps'
];

// Fields considered "core" for trust tier classification
const CORE_FIELDS = [
  'session_id', 'start_time', 'duration_minutes',
  'user_message_count', 'assistant_message_count',
  'input_tokens', 'output_tokens'
];

function analyze() {
  const files = fs.readdirSync(SESSION_META_DIR).filter(f => f.endsWith('.json'));
  const results = [];
  const parseErrors = [];

  for (const filename of files) {
    const filepath = path.join(SESSION_META_DIR, filename);
    const stat = fs.statSync(filepath);
    const mtimeMs = stat.mtimeMs;
    const mtimeISO = new Date(mtimeMs).toISOString();

    let data = null;
    let parseError = null;
    try {
      const raw = fs.readFileSync(filepath, 'utf8');
      data = JSON.parse(raw);
    } catch (e) {
      parseError = e.message;
      parseErrors.push({ filename, error: e.message });
    }

    if (!data) {
      results.push({
        filename,
        session_id: filename.replace('.json', ''),
        parseable: false,
        parseError,
        tier: 'Exclude',
        tier_reasons: ['malformed JSON'],
        mtime: mtimeISO,
        fields_present: [],
        fields_missing: EXPECTED_FIELDS,
        fields_null: [],
        duration_minutes: null,
        user_message_count: null,
        assistant_message_count: null,
        input_tokens: null,
        output_tokens: null,
        mtime_vs_start_delta_hours: null,
        user_response_times_empty: null,
        tool_counts_empty: null,
        message_hours_count: null,
      });
      continue;
    }

    // Field presence audit
    const fields_present = [];
    const fields_missing = [];
    const fields_null = [];
    for (const field of EXPECTED_FIELDS) {
      if (!(field in data)) {
        fields_missing.push(field);
      } else if (data[field] === null || data[field] === undefined) {
        fields_null.push(field);
        fields_present.push(field);
      } else {
        fields_present.push(field);
      }
    }

    const duration = data.duration_minutes;
    const userMsgs = data.user_message_count;
    const assistantMsgs = data.assistant_message_count;
    const inputTok = data.input_tokens;
    const outputTok = data.output_tokens;
    const userResponseTimes = data.user_response_times;
    const toolCounts = data.tool_counts;
    const messageHours = data.message_hours;

    // Timing analysis
    let mtime_vs_start_delta_hours = null;
    if (data.start_time) {
      try {
        const startMs = new Date(data.start_time).getTime();
        mtime_vs_start_delta_hours = (mtimeMs - startMs) / 3600000;
      } catch (_) {}
    }

    // Anomaly flags
    const duration_extreme = typeof duration === 'number' && duration > 1000;
    const zero_turns = (userMsgs === 0 || assistantMsgs === 0);
    const zero_tokens = (inputTok === 0 && outputTok === 0);
    const tool_counts_empty = !toolCounts || (typeof toolCounts === 'object' && Object.keys(toolCounts).length === 0);
    const user_response_times_empty = !userResponseTimes || (Array.isArray(userResponseTimes) && userResponseTimes.length === 0);
    const message_hours_count = messageHours ? (Array.isArray(messageHours) ? messageHours.length : -1) : 0;

    // Core fields missing check
    const core_missing = CORE_FIELDS.filter(f => !fields_present.includes(f) || fields_null.includes(f));

    // Classify trust tier
    const tier_reasons = [];
    let tier;

    if (!data.parseable && parseError) {
      tier = 'Exclude';
      tier_reasons.push('malformed JSON');
    } else if (core_missing.length > 0) {
      tier = 'Exclude';
      tier_reasons.push(`core fields missing: ${core_missing.join(', ')}`);
    } else if (zero_turns && zero_tokens) {
      tier = 'Exclude';
      tier_reasons.push('zero turns + zero tokens');
    } else if (duration_extreme) {
      // Check if message_hours pattern explains it (multi-day span)
      let explainable = false;
      if (messageHours && Array.isArray(messageHours) && messageHours.length > 0) {
        const minHour = Math.min(...messageHours);
        const maxHour = Math.max(...messageHours);
        // If hours span across day boundaries (e.g., 22 then 3), likely multi-day
        // Heuristic: if the range of hours doesn't cover the duration, it's unexplained
        // We treat it as caveated (explainable multi-day) if there are substantial messages
        if (userMsgs > 0 && assistantMsgs > 0) {
          explainable = true;
        }
      }
      tier = 'Caveated';
      tier_reasons.push(`extreme duration (${duration} min)${explainable ? ' — message_hours pattern suggests multi-day' : ''}`);
    } else {
      // Additional caveats that don't exclude
      if (zero_turns && !zero_tokens) {
        tier = 'Caveated';
        tier_reasons.push('zero turns but non-zero tokens (batch/scripted?)');
      } else if (fields_missing.length > 0) {
        const optionalMissing = fields_missing.filter(f => !CORE_FIELDS.includes(f));
        if (optionalMissing.length > 0) {
          tier = 'Caveated';
          tier_reasons.push(`optional fields missing: ${optionalMissing.slice(0, 3).join(', ')}${optionalMissing.length > 3 ? '...' : ''}`);
        } else {
          tier = 'Clean';
        }
      } else {
        tier = 'Clean';
      }

      // Stale metadata: mtime significantly before start_time is suspicious
      if (mtime_vs_start_delta_hours !== null && mtime_vs_start_delta_hours < -1) {
        if (tier === 'Clean') tier = 'Caveated';
        tier_reasons.push(`mtime before start_time by ${Math.abs(mtime_vs_start_delta_hours).toFixed(1)}h (stale/backdated)`);
      }
    }

    results.push({
      filename,
      session_id: data.session_id || filename.replace('.json', ''),
      parseable: true,
      tier,
      tier_reasons,
      mtime: mtimeISO,
      start_time: data.start_time,
      mtime_vs_start_delta_hours,
      duration_minutes: duration,
      user_message_count: userMsgs,
      assistant_message_count: assistantMsgs,
      input_tokens: inputTok,
      output_tokens: outputTok,
      fields_present: fields_present.length,
      fields_missing: fields_missing,
      fields_null: fields_null,
      user_response_times_empty,
      tool_counts_empty,
      message_hours_count,
      duration_extreme,
      zero_turns,
      zero_tokens,
    });
  }

  return { results, parseErrors, total: files.length };
}

function summarize(data) {
  const { results, total } = data;

  // Tier distribution
  const tiers = { Clean: 0, Caveated: 0, Exclude: 0 };
  for (const r of results) tiers[r.tier]++;

  // Per-field completeness
  const fieldMissingCounts = {};
  const fieldNullCounts = {};
  for (const field of EXPECTED_FIELDS) {
    fieldMissingCounts[field] = 0;
    fieldNullCounts[field] = 0;
  }
  for (const r of results) {
    if (!r.parseable) {
      for (const f of EXPECTED_FIELDS) fieldMissingCounts[f]++;
      continue;
    }
    for (const f of r.fields_missing) {
      if (fieldMissingCounts[f] !== undefined) fieldMissingCounts[f]++;
    }
    for (const f of r.fields_null) {
      if (fieldNullCounts[f] !== undefined) fieldNullCounts[f]++;
    }
  }

  // Anomaly counts
  const anomalies = {
    parse_errors: results.filter(r => !r.parseable).length,
    extreme_duration: results.filter(r => r.duration_extreme).length,
    zero_turns: results.filter(r => r.zero_turns).length,
    zero_tokens: results.filter(r => r.zero_tokens).length,
    tool_counts_empty: results.filter(r => r.tool_counts_empty).length,
    user_response_times_empty: results.filter(r => r.user_response_times_empty).length,
  };

  // mtime analysis
  const mtimeDeltas = results.filter(r => r.mtime_vs_start_delta_hours !== null).map(r => r.mtime_vs_start_delta_hours);
  const batchGenerated = mtimeDeltas.filter(d => d > 24).length; // mtime >24h after session start
  const staleMeta = mtimeDeltas.filter(d => d < -1).length;    // mtime before session start

  // Duration stats
  const durations = results.filter(r => r.duration_minutes !== null && r.duration_minutes >= 0).map(r => r.duration_minutes);
  durations.sort((a, b) => a - b);
  const p50 = durations[Math.floor(durations.length * 0.5)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const maxDuration = Math.max(...durations);
  const minDuration = Math.min(...durations);

  // Token stats
  const outputTokens = results.filter(r => r.output_tokens !== null).map(r => r.output_tokens);
  outputTokens.sort((a, b) => a - b);
  const tokP50 = outputTokens[Math.floor(outputTokens.length * 0.5)];
  const tokP95 = outputTokens[Math.floor(outputTokens.length * 0.95)];
  const tokMax = Math.max(...outputTokens);

  // Exclude list with reasons
  const excluded = results.filter(r => r.tier === 'Exclude').map(r => ({
    session_id: r.session_id,
    reasons: r.tier_reasons,
    duration: r.duration_minutes,
    user_msgs: r.user_message_count,
    output_tokens: r.output_tokens,
  }));

  // Caveated breakdown by reason type
  const caveatedReasonCounts = {};
  for (const r of results.filter(r => r.tier === 'Caveated')) {
    for (const reason of r.tier_reasons) {
      const key = reason.split('(')[0].split(':')[0].trim();
      caveatedReasonCounts[key] = (caveatedReasonCounts[key] || 0) + 1;
    }
  }

  // Missing optional fields: which are most commonly missing?
  const optionalFieldMissing = {};
  for (const field of EXPECTED_FIELDS) {
    if (!CORE_FIELDS.includes(field)) {
      optionalFieldMissing[field] = fieldMissingCounts[field];
    }
  }

  return {
    total,
    tiers,
    anomalies,
    batchGenerated,
    staleMeta,
    duration_stats: { min: minDuration, p50, p95, max: maxDuration },
    token_stats: { p50: tokP50, p95: tokP95, max: tokMax },
    fieldMissingCounts,
    fieldNullCounts,
    optionalFieldMissing,
    caveatedReasonCounts,
    excluded,
  };
}

const data = analyze();
const summary = summarize(data);

// Output structured JSON for post-processing
const output = {
  summary,
  all_results: data.results,
};

process.stdout.write(JSON.stringify(output, null, 2));
