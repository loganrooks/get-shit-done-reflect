#!/usr/bin/env node
/**
 * verify-install-parity.js — GATE-15 source↔installed mirror parity check.
 *
 * Plan: .planning/phases/58-structural-enforcement-gates/58-09-PLAN.md
 *
 * WHY: CLAUDE.md:15-27 documents the dual-directory hazard: edits to `.claude/`
 * that never propagate back to source produced the Phase 22 Agent Protocol drift
 * (23 days undetected). The installer's existing install-verify step only checks
 * directory existence + VERSION match; it does NOT verify byte-identical-after-
 * transform parity.
 *
 * HOW (Don't-Hand-Roll per Research R1): this script re-uses the installer's
 * own `replacePathsInContent` (already exported from bin/install.js for the
 * unit-test suite). For each source file under the installer's copy roots —
 * `agents/`, `commands/gsd/`, `get-shit-done/` — it computes the expected
 * installed path + content, then compares byte-identically against the actual
 * installed file. First divergence wins: emits a GitHub Actions `::notice::`
 * with `gate_fired=GATE-15 result=block path=<path>` and exits non-zero.
 *
 * USAGE:
 *   node scripts/verify-install-parity.js <INSTALL_DIR>
 *
 * <INSTALL_DIR> is the HOME-equivalent root the installer ran against (the CI
 * step creates a tempdir, runs `HOME="$TMP" node bin/install.js --claude --local`,
 * then passes "$TMP" here). For --claude --local that produces <INSTALL_DIR>/.claude/*.
 *
 * This script is --claude --local-focused; it is the runtime-neutral CI gate
 * (per 58-05-codex-behavior-matrix.md GATE-15 row: `applies` on both runtimes).
 *
 * Exit codes:
 *   0 — parity verified; emits `gate_fired=GATE-15 result=pass total_files=<N>`
 *   1 — first divergence; emits `gate_fired=GATE-15 result=block path=<path> reason=<why>`
 *   2 — usage / environment error (bad INSTALL_DIR, missing source roots, etc.)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// Re-use the installer's path-transformation. This is the whole point of the
// Don't-Hand-Roll constraint: if the installer's transformation changes, this
// script tracks it automatically.
const { replacePathsInContent, injectVersionScope } = require('../bin/install.js');

const pkg = require('../package.json');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

// Ignorelist — files that are intentionally allowed to diverge or to not exist
// in the installed tree. Keep this empty at authoring time; the first CI run
// surfaces any real divergences. Future entries must carry a comment with the
// reason.
const IGNORELIST = new Set([
  // 'agents/knowledge-store.md', // example: not renamed to gsdr-
]);

// Basenames that the installer preserves on re-install (#1924 upstream fix).
// These files survive a wipe + re-copy and may pre-exist in the installed tree
// without a corresponding source file. Safe to ignore when seen as "unexpected".
const USER_GENERATED_BASENAMES = new Set([
  'USER-PROFILE.md',
  'dev-preferences.md',
]);

// Source roots and their installed-dir mappings (relative to INSTALL_DIR/.claude/).
// These mirror the walks in bin/install.js:
//   - commands/gsd/   → .claude/commands/gsdr/           (copyWithPathReplacement, recursive)
//   - get-shit-done/  → .claude/get-shit-done-reflect/   (copyWithPathReplacement, recursive)
//   - agents/         → .claude/agents/                  (top-level .md only; gsd-*.md → gsdr-*.md)
//
// Agents is NON-recursive in the installer (bin/install.js:2733-2751 loops
// with entry.isFile() and skips directories). Sub-directories like
// agents/kb-templates/ are intentionally not copied; they would be a false
// positive here if we recursed.
const SOURCE_ROOTS = [
  {
    srcRoot: 'commands/gsd',
    installedRoot: '.claude/commands/gsdr',
    kind: 'commands',
    recursive: true,
  },
  {
    srcRoot: 'get-shit-done',
    installedRoot: '.claude/get-shit-done-reflect',
    kind: 'skill',
    recursive: true,
  },
  {
    srcRoot: 'agents',
    installedRoot: '.claude/agents',
    kind: 'agents',
    recursive: false,
  },
];

// For --claude --local, pathPrefix is "./.claude/" (see bin/install.js:2589).
const PATH_PREFIX = './.claude/';

// Version string the installer stamps into command frontmatter. Mirrors
// bin/install.js:2626 (local install always gets +dev suffix).
const VERSION_STRING = `${pkg.version}+dev`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Walk a directory, yielding { relPath, absPath } for each file.
 * relPath is relative to the walk root. When `recursive` is false, only
 * top-level files are yielded (matches the installer's non-recursive
 * agents/ loop at bin/install.js:2733-2751).
 */
function* walkFiles(root, { recursive = true, rel = '' } = {}) {
  if (!fs.existsSync(root)) return;
  const entries = fs.readdirSync(root, { withFileTypes: true });
  for (const entry of entries) {
    const abs = path.join(root, entry.name);
    const relChild = rel ? path.join(rel, entry.name) : entry.name;
    if (entry.isDirectory()) {
      if (recursive) yield* walkFiles(abs, { recursive, rel: relChild });
      // else: skip sub-directories (installer does too for non-recursive roots).
    } else if (entry.isFile()) {
      yield { relPath: relChild, absPath: abs };
    }
  }
}

/**
 * Map a source path to its installed basename.
 * agents/: gsd-*.md → gsdr-*.md (per bin/install.js:2746-2749)
 * Other kinds: passthrough.
 */
function mapInstalledRelPath(relPath, kind) {
  if (kind !== 'agents') return relPath;
  const dir = path.dirname(relPath);
  const base = path.basename(relPath);
  if (base.startsWith('gsd-') && base.endsWith('.md')) {
    const renamed = base.replace(/^gsd-/, 'gsdr-');
    return dir === '.' ? renamed : path.join(dir, renamed);
  }
  return relPath;
}

/**
 * Compute expected installed content for a source file.
 * Mirrors bin/install.js transformations for the --claude runtime:
 *  - .md under commands/gsd/: replacePathsInContent + injectVersionScope
 *  - .md under get-shit-done/ and agents/: replacePathsInContent
 *  - non-.md: passthrough (installer uses fs.copyFileSync)
 * processAttribution is a no-op when no settings.json exists in the temp HOME
 * (returns `undefined` → content unchanged), so we skip it.
 */
function expectedInstalledContent(srcAbs, relPath, kind) {
  const isMd = relPath.endsWith('.md');
  const raw = fs.readFileSync(srcAbs);

  if (!isMd) {
    // Non-.md files: the installer copies them byte-identically. Return the raw
    // buffer so the comparison handles binary files too.
    return raw;
  }

  let content = raw.toString('utf8');
  content = replacePathsInContent(content, PATH_PREFIX);
  if (kind === 'commands') {
    content = injectVersionScope(content, VERSION_STRING, 'local');
  }
  return Buffer.from(content, 'utf8');
}

/**
 * Compute a terse "first differing line" description for a content mismatch.
 * Used in the fire-event `reason=` marker for debuggability.
 */
function firstDiffLine(expected, actual) {
  const expText = expected.toString('utf8');
  const actText = actual.toString('utf8');
  if (expText === actText) return null;
  const expLines = expText.split('\n');
  const actLines = actText.split('\n');
  const n = Math.max(expLines.length, actLines.length);
  for (let i = 0; i < n; i++) {
    if (expLines[i] !== actLines[i]) {
      return `line_${i + 1}`;
    }
  }
  return 'trailing_content';
}

/**
 * Pure comparator core. Walks a SOURCE_ROOTS entry and returns a result object:
 *   { ok: true, count } on full parity
 *   { ok: false, path, reason } on first divergence
 *
 * Exposed for unit tests via module.exports.
 */
function compareRoot({ srcRoot, installedRoot, kind, recursive = true }, repoRoot, installDir) {
  const srcAbsRoot = path.join(repoRoot, srcRoot);
  const installedAbsRoot = path.join(installDir, installedRoot);

  if (!fs.existsSync(srcAbsRoot)) {
    return {
      ok: false,
      path: srcRoot,
      reason: 'source_root_missing',
    };
  }
  if (!fs.existsSync(installedAbsRoot)) {
    return {
      ok: false,
      path: installedRoot,
      reason: 'installed_root_missing',
    };
  }

  let count = 0;
  for (const { relPath, absPath } of walkFiles(srcAbsRoot, { recursive })) {
    const ignoreKey = `${srcRoot}/${relPath}`;
    if (IGNORELIST.has(ignoreKey)) continue;

    const installedRelPath = mapInstalledRelPath(relPath, kind);
    const installedAbsPath = path.join(installedAbsRoot, installedRelPath);

    if (!fs.existsSync(installedAbsPath)) {
      return {
        ok: false,
        path: `${installedRoot}/${installedRelPath}`,
        reason: 'installed_file_missing',
      };
    }

    const expected = expectedInstalledContent(absPath, relPath, kind);
    const actual = fs.readFileSync(installedAbsPath);

    if (!expected.equals(actual)) {
      const where = firstDiffLine(expected, actual);
      return {
        ok: false,
        path: `${installedRoot}/${installedRelPath}`,
        reason: `content_mismatch_${where}`,
      };
    }

    count++;
  }

  return { ok: true, count };
}

// ---------------------------------------------------------------------------
// Fire-event emission (GitHub Actions `::notice::` marker)
// ---------------------------------------------------------------------------

function emitPass(totalFiles) {
  // stdout; CI parses this via Plan 19's gate_fire_events extractor.
  console.log(
    `::notice title=GATE-15::gate_fired=GATE-15 result=pass total_files=${totalFiles}`
  );
}

function emitBlock(pathStr, reason) {
  console.log(
    `::notice title=GATE-15::gate_fired=GATE-15 result=block path=${pathStr} reason=${reason}`
  );
  console.error(
    `::error::GATE-15: source/install parity violation — path=${pathStr} reason=${reason}`
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main(argv) {
  const installDir = argv[2];
  if (!installDir) {
    console.error('usage: node scripts/verify-install-parity.js <INSTALL_DIR>');
    return 2;
  }
  if (!fs.existsSync(installDir)) {
    console.error(`INSTALL_DIR does not exist: ${installDir}`);
    return 2;
  }

  // repoRoot: resolve from __dirname/.. (script lives at <repo>/scripts/).
  const repoRoot = path.resolve(__dirname, '..');

  let total = 0;
  for (const entry of SOURCE_ROOTS) {
    const result = compareRoot(entry, repoRoot, installDir);
    if (!result.ok) {
      emitBlock(result.path, result.reason);
      return 1;
    }
    total += result.count;
  }

  emitPass(total);
  return 0;
}

// Run when invoked directly; export internals for the unit test.
if (require.main === module) {
  process.exit(main(process.argv));
}

module.exports = {
  compareRoot,
  expectedInstalledContent,
  mapInstalledRelPath,
  firstDiffLine,
  walkFiles,
  SOURCE_ROOTS,
  PATH_PREFIX,
  IGNORELIST,
  USER_GENERATED_BASENAMES,
};
