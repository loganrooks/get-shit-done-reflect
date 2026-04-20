/**
 * Quick workflow classifier — GATE-03 direct-to-main eligibility.
 *
 * Phase 58 Plan 08 (GATE-03). Composition rule per Research R12 Q1:
 * diff-based primary + manifest cross-check. Addresses DC-8 ("`.md` IS runtime" —
 * commit `ddcf1232` touched `.codex/skills/gsdr-signal/SKILL.md` direct-to-main)
 * and DC-9 (planning-authority files: ROADMAP.md / REQUIREMENTS.md / STATE.md).
 *
 * Classification outcome + exit code:
 *   pure-docs          → 0  (safe for direct-to-main)
 *   runtime-facing     → 1  (block — must branch + PR)
 *   planning-authority → 2  (block — must branch + PR, distinct reason)
 *   mixed              → 3  (both runtime-facing AND planning-authority)
 *
 * Signal addressed: sig-2026-04-17-gsdr-quick-bypassed-then-backfilled.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Classification rules ──────────────────────────────────────────────────────

// DC-9 explicit — planning-authority files (block direct-to-main with distinct reason).
const PLANNING_AUTHORITY_FILES = [
  '.planning/ROADMAP.md',
  '.planning/REQUIREMENTS.md',
  '.planning/STATE.md',
];

// Primary diff-based runtime-facing rule. Each entry is tested as a prefix match
// against the normalized (relative, POSIX) file path. Directory entries end in '/'.
// Paths come from Plan 58-08 §Task 1 (authoritative) plus DC-8 `.codex/skills/**`.
const RUNTIME_FACING_PREFIXES = [
  'get-shit-done/bin/',
  'get-shit-done/workflows/',
  'get-shit-done/references/',
  'get-shit-done/templates/',
  'agents/',
  'commands/',
  '.claude/hooks/',
  '.codex/skills/',      // DC-8: .md IS runtime inside Codex skill dirs
  'skills/',
  '.github/workflows/',
  'bin/',                // bin/install.js and any bin/**/*.js
];

// Exact-match runtime-facing files.
const RUNTIME_FACING_FILES = [
  '.claude/settings.json',
  'package.json',
  'get-shit-done/feature-manifest.json',
  'CLAUDE.md',
];

// Manifest cross-check (secondary/confirmation). These are the source-tree roots
// that `bin/install.js` walks into `.claude/get-shit-done-reflect/` on install.
// If a path is in one of these roots, it IS runtime regardless of extension.
// This is the belt-and-braces rule for paths the primary prefix list might miss.
const MANIFEST_SOURCE_ROOTS = [
  'agents',
  'commands',
  'get-shit-done',
  '.codex/skills',
  'skills',
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Normalize a path to POSIX-separated, repo-relative form for prefix matching.
 * Accepts absolute paths, ./-prefixed, or already-relative.
 */
function normalizePath(p) {
  if (typeof p !== 'string') return '';
  let s = p.replace(/\\/g, '/').trim();
  if (!s) return '';
  if (s.startsWith('./')) s = s.slice(2);
  return s;
}

function isPlanningAuthority(p) {
  return PLANNING_AUTHORITY_FILES.includes(p);
}

function matchesRuntimePrefix(p) {
  for (const prefix of RUNTIME_FACING_PREFIXES) {
    if (p.startsWith(prefix)) return true;
  }
  return false;
}

function matchesRuntimeExactFile(p) {
  return RUNTIME_FACING_FILES.includes(p);
}

function matchesManifestRoot(p) {
  for (const root of MANIFEST_SOURCE_ROOTS) {
    if (p === root || p.startsWith(root + '/')) return true;
  }
  return false;
}

/**
 * Classify a single path. Precedence-ordered per plan:
 *   1. planning-authority (DC-9)
 *   2. runtime-facing via diff-based prefix/exact-file rule
 *   3. runtime-facing via manifest cross-check
 *   4. pure-docs fallback
 */
function classifyPath(p) {
  const n = normalizePath(p);
  if (!n) return { path: p, class: 'pure-docs' };
  if (isPlanningAuthority(n)) return { path: n, class: 'planning-authority' };
  if (matchesRuntimePrefix(n)) return { path: n, class: 'runtime-facing' };
  if (matchesRuntimeExactFile(n)) return { path: n, class: 'runtime-facing' };
  if (matchesManifestRoot(n)) return { path: n, class: 'runtime-facing' };
  return { path: n, class: 'pure-docs' };
}

/**
 * Classify a set of file paths.
 * Returns:
 *   {
 *     classification: 'runtime-facing' | 'planning-authority' | 'pure-docs' | 'mixed',
 *     files_by_class: { 'runtime-facing': [...], 'planning-authority': [...], 'pure-docs': [...] },
 *     exit_code: 0 | 1 | 2 | 3
 *   }
 *
 * Exit codes:
 *   0 = all pure-docs (safe direct-to-main)
 *   1 = at least one runtime-facing and no planning-authority
 *   2 = at least one planning-authority and no runtime-facing
 *   3 = both runtime-facing AND planning-authority (mixed)
 */
function classifyQuickFiles(paths, _options) {
  const filesByClass = {
    'runtime-facing': [],
    'planning-authority': [],
    'pure-docs': [],
  };

  for (const p of paths || []) {
    const { path: normalized, class: cls } = classifyPath(p);
    if (!normalized) continue;
    filesByClass[cls].push(normalized);
  }

  const hasRuntime = filesByClass['runtime-facing'].length > 0;
  const hasPlanning = filesByClass['planning-authority'].length > 0;

  let classification;
  let exitCode;
  if (hasRuntime && hasPlanning) {
    classification = 'mixed';
    exitCode = 3;
  } else if (hasRuntime) {
    classification = 'runtime-facing';
    exitCode = 1;
  } else if (hasPlanning) {
    classification = 'planning-authority';
    exitCode = 2;
  } else {
    classification = 'pure-docs';
    exitCode = 0;
  }

  return {
    classification,
    files_by_class: filesByClass,
    exit_code: exitCode,
  };
}

// ─── CLI entry point (gsd-tools quick classify) ────────────────────────────────

/**
 * Resolve input paths for `quick classify`.
 * - If args contains `--files`, take every token after `--files` until the next
 *   `--flag` or end-of-args.
 * - Otherwise fall back to `git diff --name-only --cached` (staged files).
 */
function resolveInputPaths(cwd, args) {
  const filesIdx = args.indexOf('--files');
  if (filesIdx !== -1) {
    const out = [];
    for (let i = filesIdx + 1; i < args.length; i++) {
      if (args[i].startsWith('--')) break;
      out.push(args[i]);
    }
    return out;
  }

  // Default: staged files via git.
  try {
    const stdout = execSync('git diff --name-only --cached', {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return stdout
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * CLI handler for `gsd-tools quick classify`.
 * Emits JSON on stdout and exits with the classifier's exit code.
 */
function cmdQuickClassify(cwd, args, _raw) {
  const paths = resolveInputPaths(cwd, args);
  const result = classifyQuickFiles(paths);
  process.stdout.write(JSON.stringify(result) + '\n');
  process.exit(result.exit_code);
}

module.exports = {
  classifyQuickFiles,
  classifyPath,
  cmdQuickClassify,
  // Exposed for tests / introspection.
  RUNTIME_FACING_PREFIXES,
  RUNTIME_FACING_FILES,
  PLANNING_AUTHORITY_FILES,
  MANIFEST_SOURCE_ROOTS,
};
