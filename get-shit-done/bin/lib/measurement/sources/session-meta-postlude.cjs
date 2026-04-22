'use strict';

const fs = require('node:fs');
const path = require('node:path');

const { planningDir } = require('../../core.cjs');

const POSTLUDE_MARKERS = Object.freeze(['error_rate', 'direction_change', 'destructive_event']);

function listJsonlFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];

  let entries = [];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    process.stderr.write(`[session-meta-postlude] failed to read dir ${dirPath}: ${err.message}\n`);
    return [];
  }

  return entries
    .filter(entry => entry.isFile() && entry.name.endsWith('.jsonl'))
    .map(entry => path.join(dirPath, entry.name))
    .sort();
}

function buildBaseEvent(record, sourceFile, lineNumber) {
  return {
    ts: record.ts || record.timestamp || null,
    phase: record.phase || null,
    source_file: sourceFile,
    line_number: lineNumber,
  };
}

function buildPostludeEvents(record, sourceFile, lineNumber) {
  const base = buildBaseEvent(record, sourceFile, lineNumber);
  const events = [];

  if (record.postlude_fired === true) {
    events.push({
      ...base,
      gate: 'GATE-06',
      result: 'pass',
      marker: 'postlude_fired',
      marker_status: 'observed',
    });
  }

  for (const markerKey of POSTLUDE_MARKERS) {
    const marker = record[markerKey];
    if (!marker) continue;

    if (typeof marker === 'object' && marker.status === 'not_available') {
      events.push({
        ...base,
        gate: 'GATE-07',
        result: 'waived',
        marker: markerKey,
        marker_status: marker.status,
        reason: marker.reason || null,
      });
      continue;
    }

    if (
      marker === true ||
      (typeof marker === 'object' && ['detected', 'observed', 'available'].includes(marker.status))
    ) {
      events.push({
        ...base,
        gate: 'GATE-07',
        result: 'pass',
        marker: markerKey,
        marker_status: typeof marker === 'object' ? marker.status : 'observed',
        reason: typeof marker === 'object' ? marker.reason || null : null,
      });
    }
  }

  return events;
}

function loadSessionMetaPostlude(cwd, options = {}) {
  const rootCwd = cwd || process.cwd();
  const planDir = planningDir(rootCwd);
  const postludeDir = options.postlude_dir || path.join(planDir, 'measurement', 'session-meta-postlude');
  const phaseFilter = options.phase ? String(options.phase) : null;
  const events = [];

  for (const filePath of listJsonlFiles(postludeDir)) {
    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      process.stderr.write(`[session-meta-postlude] failed to read ${filePath}: ${err.message}\n`);
      continue;
    }

    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let record;
      try {
        record = JSON.parse(line);
      } catch {
        continue;
      }

      const recordEvents = buildPostludeEvents(record, filePath, i + 1);
      for (const event of recordEvents) {
        if (phaseFilter && event.phase && event.phase !== phaseFilter) continue;
        events.push(event);
      }
    }
  }

  return events;
}

module.exports = {
  loadSessionMetaPostlude,
  _POSTLUDE_MARKERS: POSTLUDE_MARKERS,
  _buildPostludeEvents: buildPostludeEvents,
};
