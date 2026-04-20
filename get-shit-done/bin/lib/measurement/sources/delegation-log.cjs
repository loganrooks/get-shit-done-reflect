'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { planningDir } = require('../../core.cjs');

/**
 * Raw-source loader for `.planning/delegation-log.jsonl`.
 *
 * Returns an array of tuples derived from each JSONL line:
 *   { ts, agent, model, reasoning_effort, isolation, session_id, workflow_file, workflow_step }
 *
 * Malformed lines are skipped with a warning on stderr — never throws.
 * Absent file returns an empty array (caller interprets that as not_emitted).
 *
 * Used by Phase 58 Plan 19 `gate_fire_events` extractor: every delegation event
 * is implicitly a GATE-05 (echo_delegation) fire, so we surface delegation
 * entries as GATE-05 events in the extractor.
 */
function loadDelegationLog(cwd, options = {}) {
  const rootCwd = cwd || process.cwd();
  const logPath = options.path || path.join(planningDir(rootCwd), 'delegation-log.jsonl');

  if (!fs.existsSync(logPath)) {
    return [];
  }

  let content;
  try {
    content = fs.readFileSync(logPath, 'utf8');
  } catch (err) {
    process.stderr.write(`[delegation-log] failed to read ${logPath}: ${err.message}\n`);
    return [];
  }

  const entries = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let parsed;
    try {
      parsed = JSON.parse(line);
    } catch (err) {
      process.stderr.write(`[delegation-log] skipping malformed line ${i + 1} in ${logPath}: ${err.message}\n`);
      continue;
    }
    if (!parsed || typeof parsed !== 'object') continue;
    entries.push({
      ts: parsed.ts || parsed.timestamp || null,
      agent: parsed.agent || null,
      model: parsed.model || null,
      reasoning_effort: parsed.reasoning_effort || null,
      isolation: parsed.isolation || null,
      session_id: parsed.session_id || null,
      workflow_file: parsed.workflow_file || null,
      workflow_step: parsed.workflow_step || null,
      source_file: logPath,
      raw: parsed,
    });
  }

  return entries;
}

module.exports = {
  loadDelegationLog,
};
