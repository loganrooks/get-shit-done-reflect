/**
 * Release — release-boundary assertion for phase closeout (GATE-11).
 *
 * Phase 58 Plan 15 (GATE-11): when a phase branch merges, either a release
 * workflow fires OR an explicit `.planning/release-lag.md` deferral is written.
 * Silent release lag is structurally surfaced via exit code.
 *
 * Motivating signals:
 *   - sig-2026-03-30-release-workflow-forgotten-in-milestone-completion
 *   - sig-2026-04-17-phase-closeout-left-state-pr-release-pending (5 occurrences)
 *
 * Both document the recurring gap: phase branches merge, milestone completes,
 * release workflow never fires, no one notices. Research R11 recommended
 * Option B (exit-coded CLI subcommand over CI advisory check) per DC-1
 * named-substrate requirement.
 *
 * Per-gate Codex behavior (58-05 matrix): applies on both runtimes — the CLI
 * subcommand is runtime-neutral (git tag reads + file stat only).
 *
 * Fire-event emitted on stdout per invocation (Plan 19 gate_fire_events extractor):
 *   ::notice title=GATE-11::gate_fired=GATE-11 result=<release_current|release_lag|explicit_defer> days=<N>
 *
 * Exit codes (via CLI wrapper):
 *   0 — release_current: latest reflect-v* tag is current relative to phase merge
 *   1 — release_lag:     tag missing / stale / stale deferral
 *   2 — explicit_defer:  `.planning/release-lag.md` present with future `deferred_to`
 *
 * This is a pure library module. The CLI surface lives at
 * `gsd-tools release check` and is wired in `gsd-tools.cjs`.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Fire-event emitter ──────────────────────────────────────────────────────

/**
 * Emit the GATE-11 fire-event marker on stdout so CI / Plan 19 extractor can
 * count invocations structurally. Always emits — on every invocation regardless
 * of status.
 */
function emitFireEvent(status, daysSincePhaseMerge) {
  const days = Number.isFinite(daysSincePhaseMerge)
    ? daysSincePhaseMerge.toFixed(2)
    : 'not_available';
  // eslint-disable-next-line no-console
  console.log(
    `::notice title=GATE-11::gate_fired=GATE-11 result=${status} days=${days}`
  );
}

// ─── git helpers ─────────────────────────────────────────────────────────────

function gitLines(args, cwd) {
  try {
    const out = execSync(`git ${args}`, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    });
    return String(out || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch (_err) {
    return [];
  }
}

function gitScalar(args, cwd) {
  const lines = gitLines(args, cwd);
  return lines.length ? lines[0] : '';
}

/**
 * Resolve the most recent phase-merge commit on main (first-parent merges
 * whose subject matches `Merge pull request .* from gsd/phase-`). Returns
 * `{ sha, committed_at }` or null if no phase-merge commit is found.
 */
function findLastPhaseMergeCommit(cwd) {
  // Extended regex (-E) combined with --all-match to survive the BRE quirk
  // where `from gsd/phase-` fails to match in git's default basic regex mode.
  // `gsd/phase` substring uniquely identifies GSD phase branches (merged PRs
  // whose source branch is `gsd/phase-<N>-<slug>`); combining with
  // `Merge pull request` via --all-match avoids false positives from
  // feature-branch commits that happen to mention gsd/phase in their body.
  const line = gitScalar(
    "log --first-parent main --all-match --grep='Merge pull request' --grep='gsd/phase' -1 --format=%H\\ %ct",
    cwd
  );
  if (!line) return null;
  const parts = line.split(/\s+/);
  if (parts.length < 2) return null;
  const sha = parts[0];
  const ct = Number(parts[1]);
  if (!sha || !Number.isFinite(ct)) return null;
  return { sha, committed_at: ct };
}

/**
 * Resolve the commit date (epoch seconds) of a given commit SHA. Returns
 * null on error.
 */
function commitEpoch(sha, cwd) {
  const line = gitScalar(`log -1 --format=%ct ${sha}`, cwd);
  if (!line) return null;
  const ct = Number(line);
  return Number.isFinite(ct) ? ct : null;
}

/**
 * Get the latest `reflect-v*` tag (highest version) and its commit date.
 * Returns `{ tag, tag_at, tag_sha }` or null if no matching tag exists.
 */
function findLatestReleaseTag(cwd) {
  const tag = gitScalar(
    "tag --list 'reflect-v*' --sort=-version:refname",
    cwd
  );
  if (!tag) return null;
  const tagSha = gitScalar(`rev-list -1 ${tag}`, cwd);
  if (!tagSha) return null;
  const tagAt = commitEpoch(tagSha, cwd);
  if (tagAt == null) return null;
  return { tag, tag_at: tagAt, tag_sha: tagSha };
}

// ─── release-lag.md parsing ──────────────────────────────────────────────────

/**
 * Parse minimal flat YAML frontmatter from `.planning/release-lag.md`.
 * Returns `{ frontmatter, raw }` or null if no file / no frontmatter.
 *
 * Local extractor (not `frontmatter.cjs`) for gate self-containment — matches
 * the Plan 10 handoff.cjs precedent. Supports scalar fields only, which is
 * sufficient for the documented schema (lag_reason, deferred_to, deferred_at,
 * named_rationale, referenced_phase_merge, written_by.*).
 */
function parseReleaseLag(cwd) {
  const lagPath = path.join(cwd, '.planning', 'release-lag.md');
  if (!fs.existsSync(lagPath)) return null;
  const raw = fs.readFileSync(lagPath, 'utf8');
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)/);
  if (!match) return { frontmatter: {}, raw, path: lagPath };
  const body = match[1];
  const fm = {};
  const lines = body.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    // Skip blank + comment + list-style.
    if (!line.trim() || line.trim().startsWith('#') || line.trim().startsWith('-')) continue;
    // Match `key:` or `key: value` scalars at column 0 only (nested fields
    // are intentionally not parsed — this extractor is conservative).
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(.*)$/);
    if (!m) continue;
    const key = m[1];
    let value = m[2].trim();
    // Strip surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    // Preserve block scalars as undefined (caller doesn't need them).
    if (value === '|' || value === '>') {
      fm[key] = '';
      continue;
    }
    fm[key] = value;
  }
  return { frontmatter: fm, raw, path: lagPath };
}

function parseIsoToEpoch(value) {
  if (!value || typeof value !== 'string') return null;
  const t = Date.parse(value);
  if (Number.isNaN(t)) return null;
  return Math.floor(t / 1000);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Check the release boundary against the most recent phase-merge commit.
 *
 * @param {Object}   options
 * @param {string}   [options.sincePhaseCommit] — SHA to use as the "phase merge"
 *                                                 reference. Auto-detected if omitted.
 * @param {number}   [options.lagThresholdDays=7] — max days since phase merge
 *                                                  before tag is required.
 * @param {boolean}  [options.auto=false]        — reserved for CLI symmetry; no
 *                                                  effect on logic.
 * @param {string}   [options.cwd]               — override cwd (defaults to process.cwd()).
 * @param {Date}     [options.now]               — override current time (tests).
 *
 * @returns {{
 *   status: 'current'|'lag'|'deferred',
 *   latest_tag: string|null,
 *   tag_at: number|null,
 *   phase_merge_sha: string|null,
 *   phase_merge_at: number|null,
 *   days_since_phase_merge: number|null,
 *   tag_behind_phase: boolean,
 *   lag_doc_path: string|null,
 *   lag_reason: string|null,
 *   deferred_to: string|null,
 *   note: string|null,
 * }}
 */
function checkReleaseBoundary(options) {
  const opts = options || {};
  const cwd = opts.cwd || process.cwd();
  const lagThresholdDays = Number.isFinite(opts.lagThresholdDays)
    ? Number(opts.lagThresholdDays)
    : 7;
  const now = opts.now instanceof Date ? opts.now : new Date();
  const nowEpoch = Math.floor(now.getTime() / 1000);

  // 1. Phase-merge reference commit.
  let phaseMergeSha = null;
  let phaseMergeAt = null;
  if (opts.sincePhaseCommit) {
    phaseMergeSha = String(opts.sincePhaseCommit).trim();
    phaseMergeAt = commitEpoch(phaseMergeSha, cwd);
  } else {
    const detected = findLastPhaseMergeCommit(cwd);
    if (detected) {
      phaseMergeSha = detected.sha;
      phaseMergeAt = detected.committed_at;
    }
  }

  // 2. Latest reflect-v* tag.
  const latest = findLatestReleaseTag(cwd);
  const latestTag = latest ? latest.tag : null;
  const tagAt = latest ? latest.tag_at : null;

  // 3. Days since phase merge + tag-behind-phase predicate.
  const daysSincePhaseMerge = phaseMergeAt != null
    ? (nowEpoch - phaseMergeAt) / 86400
    : null;
  const tagBehindPhase =
    tagAt != null && phaseMergeAt != null ? tagAt < phaseMergeAt : false;

  // 4. Release-lag deferral doc.
  const lagDoc = parseReleaseLag(cwd);
  if (lagDoc) {
    const fm = lagDoc.frontmatter || {};
    const deferredToRaw = fm.deferred_to || null;
    const deferredToEpoch = parseIsoToEpoch(deferredToRaw);

    // Future deferral → explicit_defer (exit 2).
    if (deferredToEpoch != null && deferredToEpoch > nowEpoch) {
      const result = {
        status: 'deferred',
        latest_tag: latestTag,
        tag_at: tagAt,
        phase_merge_sha: phaseMergeSha,
        phase_merge_at: phaseMergeAt,
        days_since_phase_merge: daysSincePhaseMerge,
        tag_behind_phase: tagBehindPhase,
        lag_doc_path: lagDoc.path,
        lag_reason: fm.lag_reason || null,
        deferred_to: deferredToRaw,
        note: null,
      };
      emitFireEvent('explicit_defer', daysSincePhaseMerge);
      return result;
    }

    // Past-or-missing deferral → stale deferral, treat as lag (exit 1).
    const note =
      deferredToEpoch == null
        ? 'release-lag.md present but deferred_to missing or unparseable'
        : 'release-lag.md deferred_to is in the past; deferral expired';
    const result = {
      status: 'lag',
      latest_tag: latestTag,
      tag_at: tagAt,
      phase_merge_sha: phaseMergeSha,
      phase_merge_at: phaseMergeAt,
      days_since_phase_merge: daysSincePhaseMerge,
      tag_behind_phase: tagBehindPhase,
      lag_doc_path: lagDoc.path,
      lag_reason: fm.lag_reason || null,
      deferred_to: deferredToRaw,
      note,
    };
    emitFireEvent('release_lag', daysSincePhaseMerge);
    return result;
  }

  // 5. No phase merge commit found → release is vacuously "current" (nothing
  // has merged to gate against). Emit current to keep the gate non-blocking
  // when the repo has no phase-merge history yet.
  if (phaseMergeAt == null) {
    const result = {
      status: 'current',
      latest_tag: latestTag,
      tag_at: tagAt,
      phase_merge_sha: null,
      phase_merge_at: null,
      days_since_phase_merge: null,
      tag_behind_phase: false,
      lag_doc_path: null,
      lag_reason: null,
      deferred_to: null,
      note: 'no phase-merge commit on main — gate vacuous',
    };
    emitFireEvent('release_current', null);
    return result;
  }

  // 6. Tag exists, not behind phase, and within threshold → current (exit 0).
  if (
    latest &&
    !tagBehindPhase &&
    daysSincePhaseMerge != null &&
    daysSincePhaseMerge < lagThresholdDays
  ) {
    const result = {
      status: 'current',
      latest_tag: latestTag,
      tag_at: tagAt,
      phase_merge_sha: phaseMergeSha,
      phase_merge_at: phaseMergeAt,
      days_since_phase_merge: daysSincePhaseMerge,
      tag_behind_phase: false,
      lag_doc_path: null,
      lag_reason: null,
      deferred_to: null,
      note: null,
    };
    emitFireEvent('release_current', daysSincePhaseMerge);
    return result;
  }

  // 7. Otherwise: lag (exit 1).
  let note = null;
  if (!latest) {
    note = 'no reflect-v* tag found';
  } else if (tagBehindPhase) {
    note = 'latest reflect-v* tag is older than most recent phase-merge commit';
  } else if (
    daysSincePhaseMerge != null &&
    daysSincePhaseMerge >= lagThresholdDays
  ) {
    note = `phase merge is ${daysSincePhaseMerge.toFixed(
      2
    )} days old (>= ${lagThresholdDays}-day threshold)`;
  }

  const result = {
    status: 'lag',
    latest_tag: latestTag,
    tag_at: tagAt,
    phase_merge_sha: phaseMergeSha,
    phase_merge_at: phaseMergeAt,
    days_since_phase_merge: daysSincePhaseMerge,
    tag_behind_phase: tagBehindPhase,
    lag_doc_path: null,
    lag_reason: null,
    deferred_to: null,
    note,
  };
  emitFireEvent('release_lag', daysSincePhaseMerge);
  // Suppress unused-var lint on `auto` — CLI signature consistent with peers.
  void opts.auto;
  return result;
}

// ─── CLI entry ───────────────────────────────────────────────────────────────

/**
 * CLI entry: `gsd-tools release check ...`.
 *
 * Flags:
 *   --since <commit>         — override phase-merge reference commit
 *   --lag-threshold-days <N> — override default 7-day threshold
 *   --auto                   — reserved for CLI symmetry
 *
 * Exit codes:
 *   0 — current
 *   1 — lag (or unexpected error mapped to lag)
 *   2 — deferred (future-dated `.planning/release-lag.md`)
 *
 * Always emits the `::notice title=GATE-11::gate_fired=GATE-11 result=<...>`
 * line on stdout before writing the JSON payload so extractors see a
 * fire-event for every invocation.
 */
function cmdReleaseCheck(cwd, args, raw) {
  const parsed = {
    since: null,
    lagThresholdDays: null,
    auto: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--since') {
      parsed.since = args[++i];
    } else if (a === '--lag-threshold-days') {
      const v = Number(args[++i]);
      if (!Number.isFinite(v) || v < 0) {
        process.stderr.write('Invalid --lag-threshold-days (expected non-negative number)\n');
        process.exit(1);
      }
      parsed.lagThresholdDays = v;
    } else if (a === '--auto') {
      parsed.auto = true;
    } else {
      process.stderr.write(`Unknown arg: ${a}\n`);
      process.exit(1);
    }
  }

  let result;
  try {
    result = checkReleaseBoundary({
      sincePhaseCommit: parsed.since,
      lagThresholdDays:
        parsed.lagThresholdDays != null ? parsed.lagThresholdDays : 7,
      auto: parsed.auto,
      cwd,
    });
  } catch (err) {
    // Unexpected error — still emit fire-event so the gate invocation is
    // counted, then map to lag (exit 1) with the error in the payload.
    emitFireEvent('release_lag', null);
    const payload = {
      status: 'lag',
      error: err && err.message ? err.message : String(err),
    };
    process.stdout.write(JSON.stringify(payload, null, 2) + '\n');
    process.exit(1);
  }

  // Print structured JSON result.
  const text = JSON.stringify(result, null, 2);
  process.stdout.write(text + '\n');

  // Human-facing hint for the lag case so the workflow output is actionable.
  if (result.status === 'lag') {
    process.stderr.write(
      [
        '',
        'GATE-11: release lag detected.',
        'Options:',
        '  A) Fire release: gh workflow run publish.yml',
        '  B) Defer explicitly:',
        '       cp .planning/handoff/release-lag-template.md .planning/release-lag.md',
        '       $EDITOR .planning/release-lag.md',
        '     Then re-run: gsd-tools release check',
        '',
      ].join('\n')
    );
  }

  if (result.status === 'current') process.exit(0);
  if (result.status === 'deferred') process.exit(2);
  process.exit(1);
  // unreachable; silence lint on raw.
  void raw;
}

module.exports = {
  checkReleaseBoundary,
  cmdReleaseCheck,
  // Exposed for tests:
  _findLastPhaseMergeCommit: findLastPhaseMergeCommit,
  _findLatestReleaseTag: findLatestReleaseTag,
  _parseReleaseLag: parseReleaseLag,
  _parseIsoToEpoch: parseIsoToEpoch,
};
