'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { planningDir } = require('../../core.cjs');

/**
 * Regex for parsing GitHub Actions `::notice::` markers carrying `gate_fired=...`.
 *
 * Accepts optional `title=...` segment between `::notice` and `::` (GH Actions convention)
 * plus optional `result=...` and `phase=...` trailing fields. Tolerant of unknown extra
 * fields (anything after the recognized keys is captured into `raw_tail`).
 *
 * Examples matched:
 *   ::notice::gate_fired=GATE-01
 *   ::notice title=GATE-11::gate_fired=GATE-11 result=release_current
 *   ::notice title=GATE-05::gate_fired=GATE-05 result=pass phase=58
 */
const NOTICE_REGEX = /::notice[^:]*::gate_fired=([A-Z0-9_-]+)(?:\s+result=(\S+))?(?:\s+phase=(\S+))?(.*)$/;

function parseNoticeLine(line, sourceFile, lineNumber) {
  const match = line.match(NOTICE_REGEX);
  if (!match) return null;
  return {
    ts: null, // timestamp is not carried in the notice marker itself
    gate: match[1],
    result: match[2] || null,
    phase: match[3] || null,
    source_file: sourceFile,
    line_number: lineNumber,
    raw_line: line,
    raw_tail: (match[4] || '').trim() || null,
  };
}

function scanFileForNotices(filePath) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    process.stderr.write(`[ci-notices] failed to read ${filePath}: ${err.message}\n`);
    return [];
  }

  const events = [];
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const event = parseNoticeLine(lines[i], filePath, i + 1);
    if (event) events.push(event);
  }
  return events;
}

function scanDirForJsonl(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const events = [];
  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    process.stderr.write(`[ci-notices] failed to read dir ${dirPath}: ${err.message}\n`);
    return [];
  }

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.jsonl')) continue;
    const filePath = path.join(dirPath, entry.name);
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      process.stderr.write(`[ci-notices] failed to read ${filePath}: ${err.message}\n`);
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      // First try parsing as JSON (preferred format for emitted event streams)
      let parsed = null;
      try {
        parsed = JSON.parse(line);
      } catch {
        // fall through to regex-based parse below
      }
      if (parsed && typeof parsed === 'object' && parsed.gate) {
        events.push({
          ts: parsed.ts || parsed.timestamp || null,
          gate: parsed.gate,
          result: parsed.result || null,
          phase: parsed.phase || null,
          source_file: filePath,
          line_number: i + 1,
          raw_line: line,
          raw_tail: null,
        });
        continue;
      }
      // Fallback: regex-based parse on the raw line
      const event = parseNoticeLine(line, filePath, i + 1);
      if (event) events.push(event);
    }
  }
  return events;
}

/**
 * Raw-source loader for `::notice::gate_fired=...` markers.
 *
 * Sources scanned (in order, results concatenated):
 *   1. `.planning/measurement/gate-events/*.jsonl` — appended event streams from gate invocations
 *   2. `.planning/delegation-log.jsonl` — scanned only for `::notice` style lines (delegation
 *      rows are structured JSON, not notice markers; this catches any handoff-archive or
 *      reconcile-emitted notice lines that happen to be appended alongside delegation entries).
 *   3. `options.extra_log_paths[]` — caller-supplied log paths (e.g. captured CI logs).
 *
 * Tolerant of missing files, malformed lines, and unknown trailing fields.
 * Returns an array of `{ ts, gate, result, phase, source_file, line_number, raw_line, raw_tail }`.
 */
function loadCiNotices(cwd, options = {}) {
  const rootCwd = cwd || process.cwd();
  const planDir = planningDir(rootCwd);
  const gateEventsDir = options.gate_events_dir || path.join(planDir, 'measurement', 'gate-events');
  const delegationLogPath = options.delegation_log_path || path.join(planDir, 'delegation-log.jsonl');
  const extraLogPaths = Array.isArray(options.extra_log_paths) ? options.extra_log_paths : [];

  const events = [];

  // 1. Scan gate-events JSONL directory.
  events.push(...scanDirForJsonl(gateEventsDir));

  // 2. Scan delegation log for any `::notice` style lines (defensive).
  if (fs.existsSync(delegationLogPath)) {
    events.push(...scanFileForNotices(delegationLogPath));
  }

  // 3. Scan caller-supplied extra paths.
  for (const filePath of extraLogPaths) {
    if (fs.existsSync(filePath)) {
      events.push(...scanFileForNotices(filePath));
    }
  }

  return events;
}

module.exports = {
  loadCiNotices,
  // exported for unit testing
  _parseNoticeLine: parseNoticeLine,
  _NOTICE_REGEX: NOTICE_REGEX,
};
