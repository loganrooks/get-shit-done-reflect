/**
 * Archive — Evidence-preserving relocation for failed / interrupted agent output (GATE-12).
 *
 * Phase 58 Plan 14 (GATE-12): Failed or interrupted agent output MUST be moved
 * to a timestamped archive directory rather than deleted. Deletion destroys
 * audit evidence needed for debugging why a plan/research/summary run failed.
 *
 * Motivating signal: sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving
 * (2 occurrences). Root cause: orchestrators used `rm -f` or blind overwrite on
 * redispatch with no evidence-preservation step.
 *
 * Per-gate Codex behavior (58-05 matrix): applies on both runtimes — filesystem
 * `mv` is runtime-neutral.
 *
 * Fire-event emitted on stdout per invocation (Plan 19 gate_fire_events extractor):
 *   ::notice title=GATE-12::gate_fired=GATE-12 result=archived path=<archive_path> reason=<reason>
 *
 * This is a pure library module. The CLI surface lives at
 * `gsd-tools agent archive` and is wired in `gsd-tools.cjs`.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── Fire-event emitter ──────────────────────────────────────────────────────

/**
 * Emit the GATE-12 fire-event marker. Always lands on stdout as a `::notice::`
 * line so CI / Plan 19 extractor can count invocations structurally.
 */
function emitFireEvent(archivePath, reason) {
  // eslint-disable-next-line no-console
  console.log(
    `::notice title=GATE-12::gate_fired=GATE-12 result=archived path=${archivePath} reason=${reason}`
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Compute a timestamp string in YYYYMMDDHHMMSS format (UTC).
 */
function timestampUtc(now = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return (
    now.getUTCFullYear().toString() +
    pad(now.getUTCMonth() + 1) +
    pad(now.getUTCDate()) +
    pad(now.getUTCHours()) +
    pad(now.getUTCMinutes()) +
    pad(now.getUTCSeconds())
  );
}

/**
 * Sanitize an arbitrary reason/session-id token for use in a filesystem path.
 * Allows `[A-Za-z0-9._-]`; replaces everything else with `_`. Caps length so a
 * wildly long user-supplied reason cannot blow up the archive directory name.
 */
function sanitizeToken(value, max = 64) {
  const raw = value == null ? '' : String(value);
  const cleaned = raw.replace(/[^A-Za-z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  if (!cleaned) return 'unknown';
  return cleaned.slice(0, max);
}

/**
 * Resolve the archive root for a given phase number.
 *
 * Priority:
 *   1. If `phaseNumber` is provided and a matching `.planning/phases/<N>-<slug>`
 *      directory exists, return `.planning/phases/<N>-<slug>/.archive/`.
 *   2. Fallback: `.planning/archive/` at the repo root.
 *
 * `cwd` defaults to `process.cwd()` for CLI usage; tests / library callers may
 * pass an explicit cwd.
 */
function resolveArchiveRoot(cwd, phaseNumber) {
  if (phaseNumber != null && String(phaseNumber).trim() !== '') {
    const phasesDir = path.join(cwd, '.planning', 'phases');
    if (fs.existsSync(phasesDir) && fs.statSync(phasesDir).isDirectory()) {
      const prefix = String(phaseNumber) + '-';
      let match = null;
      for (const entry of fs.readdirSync(phasesDir)) {
        if (entry.startsWith(prefix)) {
          match = entry;
          break;
        }
      }
      if (match) {
        return path.join(phasesDir, match, '.archive');
      }
    }
  }
  return path.join(cwd, '.planning', 'archive');
}

/**
 * Cross-filesystem-safe move. Prefers `fs.renameSync`; on EXDEV falls back to
 * copy + unlink. Works for both files and directories.
 */
function safeMove(src, dest) {
  try {
    fs.renameSync(src, dest);
    return;
  } catch (err) {
    if (!err || err.code !== 'EXDEV') throw err;
  }
  // EXDEV fallback — cross-device move. Recursive copy + remove.
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
    fs.rmSync(src, { recursive: true, force: true });
  } else {
    fs.copyFileSync(src, dest);
    fs.unlinkSync(src);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Archive a set of agent output paths by moving them to a timestamped
 * sub-directory under the phase-scoped (or root-fallback) archive root.
 *
 * @param {Object}   opts
 * @param {string}   opts.sessionId     — agent/session identifier (token).
 * @param {string}   opts.reason        — short machine-friendly reason token
 *                                        (e.g. `failed_redispatch_planner`).
 * @param {string[]} opts.paths         — paths to archive. Missing paths are
 *                                        recorded in `missing[]` without error.
 * @param {string|number} [opts.phaseNumber] — if provided and the matching
 *                                        `.planning/phases/<N>-*` dir exists,
 *                                        archive under that phase's `.archive/`.
 * @param {boolean}  [opts.dryRun=false] — plan only, perform no filesystem mutations.
 * @param {Object}   [opts.metadata]    — optional JSON-serializable object
 *                                        written to `.meta.json` inside the
 *                                        archive subdir.
 * @param {string}   [opts.cwd]         — override cwd (defaults to process.cwd()).
 * @param {Date}     [opts.now]         — override timestamp (for tests).
 *
 * @returns {{archive_dir:string, archived:string[], missing:string[], errors:Array, dry_run:boolean}}
 */
function archiveAgentOutput(opts) {
  const options = opts || {};
  const cwd = options.cwd || process.cwd();
  const sessionId = sanitizeToken(options.sessionId, 64) || 'unknown';
  const reason = sanitizeToken(options.reason, 64) || 'unspecified';
  const paths = Array.isArray(options.paths) ? options.paths : [];
  const dryRun = options.dryRun === true;
  const now = options.now instanceof Date ? options.now : new Date();

  const archiveRoot = resolveArchiveRoot(cwd, options.phaseNumber);
  const subdir = `${timestampUtc(now)}-${sessionId}-${reason}`;
  const archiveDir = path.join(archiveRoot, subdir);

  const archived = [];
  const missing = [];
  const errors = [];

  if (!dryRun) {
    try {
      fs.mkdirSync(archiveDir, { recursive: true });
    } catch (err) {
      errors.push({ path: archiveDir, error: err.message || String(err) });
      emitFireEvent(archiveDir, reason);
      return {
        archive_dir: archiveDir,
        archived,
        missing,
        errors,
        dry_run: false,
      };
    }
  }

  for (const p of paths) {
    const absSrc = path.isAbsolute(p) ? p : path.resolve(cwd, p);
    if (!fs.existsSync(absSrc)) {
      missing.push(absSrc);
      continue;
    }
    const basename = path.basename(absSrc);
    const dest = path.join(archiveDir, basename);
    if (dryRun) {
      archived.push(dest);
      continue;
    }
    try {
      safeMove(absSrc, dest);
      archived.push(dest);
    } catch (err) {
      errors.push({ path: absSrc, error: err.message || String(err) });
    }
  }

  // Optional metadata sidecar — only when caller explicitly provides one.
  if (!dryRun && options.metadata && typeof options.metadata === 'object') {
    try {
      const metaPath = path.join(archiveDir, '.meta.json');
      fs.writeFileSync(metaPath, JSON.stringify(options.metadata, null, 2) + '\n', 'utf8');
    } catch (err) {
      errors.push({ path: '.meta.json', error: err.message || String(err) });
    }
  }

  emitFireEvent(archiveDir, reason);

  return {
    archive_dir: archiveDir,
    archived,
    missing,
    errors,
    dry_run: dryRun,
  };
}

// ─── CLI entry ───────────────────────────────────────────────────────────────

/**
 * CLI entry: `gsd-tools agent archive ...`.
 *
 * Arg parsing is flat (no external dep): flags consume next arg, `--paths`
 * consumes all remaining non-flag positionals. Unknown flags are an error.
 *
 * On success writes JSON `{ archived, missing, errors, archive_dir, dry_run }`
 * to stdout. Exit code 0 on success; 1 on invocation error; 2 if any of the
 * requested paths failed to move (`errors[]` non-empty).
 */
function cmdAgentArchive(cwd, args, raw) {
  const parsed = {
    sessionId: null,
    reason: null,
    phaseNumber: null,
    dryRun: false,
    paths: [],
    metadata: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--session-id' || a === '--session') {
      parsed.sessionId = args[++i];
    } else if (a === '--reason') {
      parsed.reason = args[++i];
    } else if (a === '--phase') {
      parsed.phaseNumber = args[++i];
    } else if (a === '--dry-run') {
      parsed.dryRun = true;
    } else if (a === '--metadata') {
      const raw = args[++i];
      try {
        parsed.metadata = JSON.parse(raw);
      } catch (err) {
        process.stderr.write(`Invalid --metadata JSON: ${err.message}\n`);
        process.exit(1);
      }
    } else if (a === '--paths') {
      // --paths consumes all remaining non-flag args.
      for (let j = i + 1; j < args.length; j += 1) {
        const v = args[j];
        if (typeof v === 'string' && v.startsWith('--')) {
          i = j - 1;
          break;
        }
        parsed.paths.push(v);
        i = j;
      }
    } else {
      process.stderr.write(`Unknown arg: ${a}\n`);
      process.exit(1);
    }
  }

  if (!parsed.sessionId) {
    process.stderr.write(
      'Usage: gsd-tools agent archive --session-id <id> --reason <reason> [--phase <N>] [--dry-run] [--metadata <json>] --paths <path> [<path>...]\n'
    );
    process.exit(1);
  }
  if (!parsed.reason) {
    process.stderr.write('Missing required flag: --reason\n');
    process.exit(1);
  }
  if (!parsed.paths.length) {
    process.stderr.write('Missing required flag: --paths <path>...\n');
    process.exit(1);
  }

  const result = archiveAgentOutput({
    sessionId: parsed.sessionId,
    reason: parsed.reason,
    phaseNumber: parsed.phaseNumber,
    dryRun: parsed.dryRun,
    paths: parsed.paths,
    metadata: parsed.metadata,
    cwd,
  });

  // Print structured JSON result.
  const text = JSON.stringify(result, null, 2);
  process.stdout.write(text + '\n');

  if (result.errors && result.errors.length > 0) {
    process.exit(2);
  }
  // Suppress unused-var lint on `raw` — CLI signature consistent with peers.
  void raw;
}

module.exports = {
  archiveAgentOutput,
  cmdAgentArchive,
  // Exposed for tests:
  _sanitizeToken: sanitizeToken,
  _timestampUtc: timestampUtc,
  _resolveArchiveRoot: resolveArchiveRoot,
};
