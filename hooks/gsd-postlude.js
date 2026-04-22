#!/usr/bin/env node
// Metadata-only closeout hook for session-level postlude markers.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const INPUT_TIMEOUT_MS = 10000;
const OUTPUT_DIR_SEGMENTS = ['.planning', 'measurement', 'session-meta-postlude'];
const OUTPUT_FILE = 'session-meta-postlude.jsonl';

function findPlanningRoot(startDir) {
  let current = path.resolve(startDir || process.cwd());
  const homeDir = path.resolve(os.homedir());

  while (true) {
    const planningPath = path.join(current, '.planning');
    try {
      if (fs.existsSync(planningPath) && fs.statSync(planningPath).isDirectory()) {
        return current;
      }
    } catch {
      return null;
    }

    const parent = path.dirname(current);
    if (parent === current || current === homeDir) {
      return null;
    }
    current = parent;
  }
}

function extractPhaseFromState(projectRoot) {
  const statePath = path.join(projectRoot, '.planning', 'STATE.md');
  let content;
  try {
    content = fs.readFileSync(statePath, 'utf8');
  } catch {
    return null;
  }

  const currentPositionMatch = content.match(/^Phase:\s+([0-9]+(?:\.[0-9]+)?)/m);
  if (currentPositionMatch) return currentPositionMatch[1];

  const stoppedAtMatch = content.match(/\bCompleted\s+([0-9]+(?:\.[0-9]+)?)-/);
  if (stoppedAtMatch) return stoppedAtMatch[1];

  return null;
}

function buildNotAvailable(reason) {
  return {
    status: 'not_available',
    reason,
  };
}

function detectRuntime(payload, projectRoot) {
  if (payload && typeof payload.runtime === 'string' && payload.runtime.trim()) {
    return payload.runtime.trim();
  }
  if (payload && typeof payload.harness === 'string' && payload.harness.trim()) {
    return payload.harness.trim();
  }
  if (process.env.CODEX_THREAD_ID) return 'codex-cli';
  if (process.env.CLAUDE_SESSION_ID || process.env.CLAUDE_CODE_SSE_PORT) return 'claude-code';

  try {
    if (fs.existsSync(path.join(projectRoot, '.claude', 'settings.json'))) return 'claude-code';
    if (fs.existsSync(path.join(projectRoot, '.codex', 'config.toml'))) return 'codex-cli';
  } catch {
    return 'not_available';
  }

  return 'not_available';
}

function getSessionId(payload) {
  if (payload && typeof payload.session_id === 'string' && payload.session_id.trim()) {
    return payload.session_id.trim();
  }
  if (process.env.CODEX_THREAD_ID) return process.env.CODEX_THREAD_ID;
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  return null;
}

function getWorkingDirectory(payload) {
  if (payload && payload.workspace && typeof payload.workspace.current_dir === 'string' && payload.workspace.current_dir.trim()) {
    return payload.workspace.current_dir.trim();
  }
  if (payload && typeof payload.cwd === 'string' && payload.cwd.trim()) {
    return payload.cwd.trim();
  }
  return process.cwd();
}

function buildRecord(projectRoot, payload) {
  const phase = extractPhaseFromState(projectRoot);
  return {
    ts: new Date().toISOString(),
    runtime: detectRuntime(payload, projectRoot),
    phase,
    postlude_fired: true,
    error_rate: buildNotAvailable('not_computed_in_closeout_hook'),
    direction_change: buildNotAvailable('downstream_live_wiring_not_shipped'),
    destructive_event: buildNotAvailable('downstream_live_wiring_not_shipped'),
    session_id: getSessionId(payload),
  };
}

function appendRecord(projectRoot, payload) {
  const outputDir = path.join(projectRoot, ...OUTPUT_DIR_SEGMENTS);
  const outputPath = path.join(outputDir, OUTPUT_FILE);
  const record = buildRecord(projectRoot, payload);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.appendFileSync(outputPath, `${JSON.stringify(record)}\n`, 'utf8');
}

function finish(payload) {
  try {
    const workingDir = getWorkingDirectory(payload);
    const projectRoot = findPlanningRoot(workingDir);
    if (!projectRoot) return;
    appendRecord(projectRoot, payload || {});
  } catch {
    // Hooks must fail closed and never block the runtime.
  }
}

let input = '';
const timeout = setTimeout(() => finish({}), INPUT_TIMEOUT_MS);
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  input += chunk;
});
process.stdin.on('end', () => {
  clearTimeout(timeout);
  let payload = {};
  if (input.trim()) {
    try {
      payload = JSON.parse(input);
    } catch {
      payload = {};
    }
  }
  finish(payload);
});
process.stdin.on('error', () => {
  clearTimeout(timeout);
  finish({});
});

if (process.stdin.isTTY) {
  clearTimeout(timeout);
  finish({});
}
