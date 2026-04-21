/**
 * Handoff resolver + anti-pattern registry check.
 *
 * Phase 58 Plan 10. Ships three structural behaviors at the `resume-project` +
 * `.continue-here` surface:
 *
 *   GATE-04a — Consumed-on-read archival. `.continue-here` is moved to a dated
 *              slot under `.planning/handoff/archive/`, not `rm -f`'d, so
 *              evidence of every resumption is preserved on disk.
 *
 *   GATE-04b — Staleness hard-stop. If the handoff is older than STATE.md, or
 *              STATE.md has been touched on mainline since, or the embedded
 *              session_id is already recorded in STATE.md, `resolveHandoff`
 *              returns { action: 'hard_stop', ... } and the CLI exits with
 *              status 3. Caller (resume workflow) aborts.
 *
 *   GATE-04c — Anti-pattern severity framework. `checkAntipatterns` reads the
 *              severity-tagged registry at get-shit-done/references/antipatterns.md
 *              and enforces a mandatory-understanding prompt for `severity: blocking`
 *              items, while `severity: advisory` prints a warning and passes.
 *
 * Fire-events emitted on stdout:
 *   ::notice::gate_fired=GATE-04a result=archived path=<archive_path>
 *   ::notice::gate_fired=GATE-04b result=hard_stop reason=<stale|newer_state|duplicate_session>
 *   ::notice::gate_fired=GATE-04c result=<pass|block|ack_required> pattern=<id>
 *
 * Signals addressed:
 *   - sig-2026-02-16-stale-continue-here-files-not-cleaned
 *   - sig-2026-02-17-continue-here-not-deleted-after-resume
 */

'use strict';

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { execSync } = require('child_process');

// ─── Shared helpers ───────────────────────────────────────────────────────────

/**
 * Emit a ::notice:: fire-event line to stdout. Plan 19 gate_fire_events
 * extractor reads these markers; resume-project workflow also captures them
 * for operator display.
 */
function emitNotice(payload) {
  process.stdout.write('::notice::' + payload + '\n');
}

/**
 * Minimal YAML frontmatter extractor: returns a flat object of scalar fields
 * from the first --- block. Adequate for pulling `session_id` / `last_updated`
 * out of `.continue-here.md` and STATE.md without pulling in the full
 * frontmatter.cjs parser (which is a heavier dependency for nested schemas).
 */
function extractFlatFrontmatter(content) {
  if (typeof content !== 'string' || !content) return {};
  const match = content.match(/^---\r?\n([\s\S]+?)\r?\n---/);
  if (!match) return {};
  const yaml = match[1];
  const out = {};
  for (const rawLine of yaml.split(/\r?\n/)) {
    // Only top-level `key: value` lines (no leading whitespace) -- we do not
    // attempt to descend into nested structures here.
    const m = rawLine.match(/^([A-Za-z0-9_][A-Za-z0-9_\-]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    // Strip surrounding quotes (single or double).
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

/**
 * Parse an ISO-8601ish timestamp. Returns milliseconds-since-epoch or NaN.
 */
function parseTimestampMs(value) {
  if (!value) return NaN;
  const t = Date.parse(value);
  return Number.isFinite(t) ? t : NaN;
}

/**
 * Resolve the most recent mainline commit that touches STATE.md, measured in
 * seconds since epoch. Returns 0 if no git history is reachable or the file is
 * not tracked.
 */
function lastCommitTouchingStateEpoch(cwd, statePath) {
  try {
    const stdout = execSync(
      `git log -1 --format=%ct -- ${JSON.stringify(statePath)}`,
      { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    ).trim();
    if (!stdout) return 0;
    const n = parseInt(stdout, 10);
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// ─── GATE-04a / GATE-04b: resolveHandoff ──────────────────────────────────────

/**
 * Resolve an incoming handoff file, enforcing the staleness hard-stop before
 * archiving-and-consuming.
 *
 * @param {object} options
 * @param {string} [options.continue_path='.continue-here']  Handoff file path
 * @param {string} [options.state_path='.planning/STATE.md']  STATE.md path
 * @param {boolean} [options.auto=false]                     Non-interactive hint (unused today)
 * @param {string} [options.cwd=process.cwd()]               Working directory
 *
 * @returns {{
 *   action: 'loaded' | 'archived' | 'hard_stop',
 *   reason?: string,
 *   archive_path?: string,
 *   content?: string,
 *   session_id?: string | null,
 * }}
 */
function resolveHandoff(options) {
  const opts = options || {};
  const cwd = opts.cwd || process.cwd();
  const continueRel = opts.continue_path || '.continue-here';
  const stateRel = opts.state_path || '.planning/STATE.md';

  const continueAbs = path.isAbsolute(continueRel)
    ? continueRel
    : path.resolve(cwd, continueRel);
  const stateAbs = path.isAbsolute(stateRel)
    ? stateRel
    : path.resolve(cwd, stateRel);

  // 1. No handoff present — silent no-op, not an error.
  if (!fs.existsSync(continueAbs)) {
    return { action: 'loaded', reason: 'no_handoff_present' };
  }

  const continueStat = fs.statSync(continueAbs);
  const continueContent = fs.readFileSync(continueAbs, 'utf-8');
  const continueFm = extractFlatFrontmatter(continueContent);
  const sessionId = continueFm.session_id || null;

  // 2. Staleness inputs: handoff mtime vs STATE.md `last_updated` vs last
  //    mainline commit touching STATE.md vs duplicate-session fingerprint.
  const continueMtimeMs = continueStat.mtimeMs;

  let stateContent = null;
  let stateFm = {};
  if (fs.existsSync(stateAbs)) {
    stateContent = fs.readFileSync(stateAbs, 'utf-8');
    stateFm = extractFlatFrontmatter(stateContent);
  }

  const stateLastUpdatedMs = parseTimestampMs(stateFm.last_updated);
  const lastCommitEpoch = lastCommitTouchingStateEpoch(cwd, stateAbs);
  const lastCommitMs = Number.isFinite(lastCommitEpoch) && lastCommitEpoch > 0
    ? lastCommitEpoch * 1000
    : 0;

  // 3a. Staleness via `last_updated`.
  let hardStopReason = null;
  if (Number.isFinite(stateLastUpdatedMs) && continueMtimeMs < stateLastUpdatedMs) {
    hardStopReason = 'stale';
  }

  // 3b. Newer commit touched STATE.md on mainline after handoff was written.
  if (!hardStopReason && lastCommitMs > 0 && continueMtimeMs < lastCommitMs) {
    hardStopReason = 'newer_state';
  }

  // 3c. Duplicate-session: the session_id embedded in the handoff is already
  //     cited in STATE.md (decisions / activity / metrics). Grep is adequate
  //     because session_id values are opaque ASCII fingerprints.
  if (!hardStopReason && sessionId && stateContent) {
    const escaped = sessionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const hasDup = new RegExp(`session_id:\\s*${escaped}\\b`).test(stateContent)
      || stateContent.includes(sessionId);
    if (hasDup) hardStopReason = 'duplicate_session';
  }

  if (hardStopReason) {
    emitNotice(`gate_fired=GATE-04b result=hard_stop reason=${hardStopReason}`);
    return {
      action: 'hard_stop',
      reason: hardStopReason,
      continue_path: continueAbs,
      session_id: sessionId,
    };
  }

  // 4. Archive-and-load (GATE-04a): build a dated archive path under
  //    .planning/handoff/archive/ and `mv` the handoff there. `mkdir -p` first.
  //    Timestamp is UTC YYYYMMDDTHHMMSS; session_id disambiguates concurrent
  //    resumes in the same second.
  const ts = new Date().toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, '')
    .replace('T', 'T');
  const sessionTag = sessionId || 'unknown';
  const archiveDir = path.resolve(cwd, '.planning/handoff/archive');
  fs.mkdirSync(archiveDir, { recursive: true });

  let archivePath = path.join(archiveDir, `${ts}-${sessionTag}.continue-here.md`);
  // Idempotency: if an identical archive filename already exists (extremely
  // unlikely given the timestamp + session tag), append -1, -2, ... to avoid
  // clobbering prior evidence.
  if (fs.existsSync(archivePath)) {
    let suffix = 1;
    while (fs.existsSync(
      path.join(archiveDir, `${ts}-${sessionTag}-${suffix}.continue-here.md`),
    )) {
      suffix += 1;
    }
    archivePath = path.join(archiveDir, `${ts}-${sessionTag}-${suffix}.continue-here.md`);
  }

  fs.renameSync(continueAbs, archivePath);
  emitNotice(`gate_fired=GATE-04a result=archived path=${archivePath}`);

  return {
    action: 'archived',
    archive_path: archivePath,
    content: continueContent,
    session_id: sessionId,
  };
}

// ─── CLI for `gsd-tools handoff resolve` ──────────────────────────────────────

function parseArg(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return undefined;
  const val = args[idx + 1];
  if (!val || val.startsWith('--')) return undefined;
  return val;
}

/**
 * CLI handler for `gsd-tools handoff resolve [--continue-path PATH]
 * [--state-path PATH] [--auto]`. Emits a single JSON payload describing the
 * resolution on stdout and exits with:
 *   0 — loaded or archived (caller can consume content / archive_path)
 *   3 — GATE-04b hard-stop staleness (caller must abort)
 *   1 — unexpected error
 */
function cmdHandoffResolve(cwd, args, _raw) {
  const continuePath = parseArg(args, '--continue-path') || '.continue-here';
  const statePath = parseArg(args, '--state-path') || '.planning/STATE.md';
  const auto = args.includes('--auto');

  let result;
  try {
    result = resolveHandoff({
      continue_path: continuePath,
      state_path: statePath,
      auto,
      cwd,
    });
  } catch (err) {
    process.stderr.write(`handoff resolve failed: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
  }

  process.stdout.write(JSON.stringify(result) + '\n');
  if (result.action === 'hard_stop') {
    process.exit(3);
  }
  process.exit(0);
}

// ─── GATE-04c: anti-pattern registry + mandatory understanding ────────────────

/**
 * Parse the severity-tagged registry at
 * get-shit-done/references/antipatterns.md into an array of entries.
 *
 * The registry stores entries as YAML-like stanzas inside fenced blocks with
 * `- id:` lead lines. We parse with a line-oriented state machine rather than
 * pulling in a YAML library to keep dependencies minimal.
 */
function loadAntipatternRegistry(cwd) {
  const candidates = [
    path.resolve(cwd, 'get-shit-done/references/antipatterns.md'),
    path.resolve(cwd, '.claude/get-shit-done-reflect/references/antipatterns.md'),
  ];
  let file = null;
  for (const c of candidates) {
    if (fs.existsSync(c)) { file = c; break; }
  }
  if (!file) {
    return { entries: [], source: null };
  }
  const content = fs.readFileSync(file, 'utf-8');

  const entries = [];
  const lines = content.split(/\r?\n/);
  let current = null;

  const flush = () => {
    if (current && current.id) entries.push(current);
    current = null;
  };

  for (const raw of lines) {
    const idMatch = raw.match(/^\s*-\s+id:\s*(\S+)\s*$/);
    if (idMatch) {
      flush();
      current = { id: idMatch[1] };
      continue;
    }
    if (!current) continue;
    const kvMatch = raw.match(/^\s+([A-Za-z0-9_][A-Za-z0-9_\-]*):\s*(.*)$/);
    if (!kvMatch) continue;
    const key = kvMatch[1];
    let value = kvMatch[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Flatten array-literals like `[sig-a, sig-b]` into JS arrays.
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value.slice(1, -1).split(',').map((s) => s.trim()).filter(Boolean);
    }
    current[key] = value;
  }
  flush();

  return { entries, source: file };
}

function findAntipattern(registry, id) {
  return registry.entries.find((e) => e.id === id) || null;
}

/**
 * Prompt the user to type the mandatory-understanding token. Used in
 * interactive (non-auto) mode only.
 *
 * Returns a Promise<boolean> — true if they typed the expected value.
 */
function promptMandatoryUnderstanding(entry) {
  return new Promise((resolve) => {
    const expected = (entry.mandatory_understanding_prompt || '').trim();
    const match = expected.match(/type exactly:\s*(\S.*)$/i);
    const expectedToken = match ? match[1].trim() : entry.id;

    process.stderr.write(`\nAnti-pattern: ${entry.name || entry.id} [severity: ${entry.severity || 'unknown'}]\n`);
    if (entry.description) {
      process.stderr.write(`  ${entry.description}\n`);
    }
    if (entry.remediation) {
      process.stderr.write(`  Remediation: ${entry.remediation}\n`);
    }
    process.stderr.write(`\n${entry.mandatory_understanding_prompt || `To continue, type exactly: ${expectedToken}`}\n> `);

    const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
    rl.question('', (answer) => {
      rl.close();
      resolve((answer || '').trim() === expectedToken);
    });
  });
}

/**
 * Enforce anti-pattern severity rules.
 *
 * @param {object} options
 * @param {string[]} [options.pattern_ids]             Specific ids to check
 * @param {boolean}  [options.auto=false]              Non-interactive mode
 * @param {string[]} [options.acknowledge_blocking]    Ack tokens for `--auto` path
 * @param {string}   [options.cwd=process.cwd()]
 *
 * @returns {Promise<{ ok: boolean, results: Array<{id, severity, outcome}> }>}
 */
async function checkAntipatterns(options) {
  const opts = options || {};
  const cwd = opts.cwd || process.cwd();
  const patternIds = Array.isArray(opts.pattern_ids) ? opts.pattern_ids : null;
  const auto = !!opts.auto;
  const acks = new Set(Array.isArray(opts.acknowledge_blocking) ? opts.acknowledge_blocking : []);

  const registry = loadAntipatternRegistry(cwd);
  if (!registry.entries.length) {
    emitNotice('gate_fired=GATE-04c result=block pattern=<registry_missing>');
    return {
      ok: false,
      results: [{ id: null, severity: null, outcome: 'registry_missing' }],
    };
  }

  const toCheck = patternIds && patternIds.length
    ? patternIds.map((id) => findAntipattern(registry, id)).filter(Boolean)
    : registry.entries;

  const results = [];
  let ok = true;

  for (const entry of toCheck) {
    const severity = (entry.severity || '').toLowerCase();

    if (severity === 'advisory') {
      process.stderr.write(`[advisory] ${entry.name || entry.id}: ${entry.description || ''}\n`);
      emitNotice(`gate_fired=GATE-04c result=pass pattern=${entry.id}`);
      results.push({ id: entry.id, severity, outcome: 'pass_advisory' });
      continue;
    }

    if (severity === 'blocking') {
      if (auto) {
        if (acks.has(entry.id)) {
          emitNotice(`gate_fired=GATE-04c result=pass pattern=${entry.id}`);
          results.push({ id: entry.id, severity, outcome: 'pass_acknowledged' });
          continue;
        }
        emitNotice(`gate_fired=GATE-04c result=ack_required pattern=${entry.id}`);
        results.push({ id: entry.id, severity, outcome: 'ack_required' });
        ok = false;
        continue;
      }

      // Interactive mandatory-understanding prompt.
      // eslint-disable-next-line no-await-in-loop
      const typedCorrect = await promptMandatoryUnderstanding(entry);
      if (typedCorrect) {
        emitNotice(`gate_fired=GATE-04c result=pass pattern=${entry.id}`);
        results.push({ id: entry.id, severity, outcome: 'pass_typed' });
      } else {
        emitNotice(`gate_fired=GATE-04c result=block pattern=${entry.id}`);
        results.push({ id: entry.id, severity, outcome: 'block_mismatch' });
        ok = false;
      }
      continue;
    }

    // Unknown severity defaults to advisory with a warning.
    process.stderr.write(`[warn] ${entry.id} has unknown severity="${entry.severity}"; treating as advisory\n`);
    emitNotice(`gate_fired=GATE-04c result=pass pattern=${entry.id}`);
    results.push({ id: entry.id, severity, outcome: 'pass_unknown_severity' });
  }

  return { ok, results, registry_source: registry.source };
}

// ─── CLI for `gsd-tools antipatterns check` ───────────────────────────────────

function collectMultiArg(args, flag) {
  const out = [];
  const idx = args.indexOf(flag);
  if (idx === -1) return out;
  for (let i = idx + 1; i < args.length; i++) {
    if (args[i].startsWith('--')) break;
    out.push(args[i]);
  }
  return out;
}

/**
 * CLI handler for `gsd-tools antipatterns check [--pattern-id ID ...]
 *   [--auto [--acknowledge-blocking ID ...]]`.
 *
 * Exit codes:
 *   0 — all checked entries passed (or advisory-only)
 *   4 — at least one blocking entry needs acknowledgement / typed token
 *   1 — unexpected error
 */
async function cmdAntipatternsCheck(cwd, args, _raw) {
  // Collect all --pattern-id values. Both repeated `--pattern-id X --pattern-id Y`
  // and space-separated `--pattern-id X Y` forms are accepted.
  const ids = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pattern-id') {
      // consume following non-flag tokens until the next flag
      for (let j = i + 1; j < args.length; j++) {
        if (args[j].startsWith('--')) break;
        ids.push(args[j]);
        i = j;
      }
    }
  }
  const auto = args.includes('--auto');
  const acks = collectMultiArg(args, '--acknowledge-blocking');

  let result;
  try {
    result = await checkAntipatterns({
      pattern_ids: ids.length ? ids : null,
      auto,
      acknowledge_blocking: acks,
      cwd,
    });
  } catch (err) {
    process.stderr.write(`antipatterns check failed: ${err && err.message ? err.message : err}\n`);
    process.exit(1);
    return;
  }

  process.stdout.write(JSON.stringify(result) + '\n');
  process.exit(result.ok ? 0 : 4);
}

module.exports = {
  resolveHandoff,
  cmdHandoffResolve,
  loadAntipatternRegistry,
  checkAntipatterns,
  cmdAntipatternsCheck,
  // Exposed for tests / introspection.
  extractFlatFrontmatter,
};
