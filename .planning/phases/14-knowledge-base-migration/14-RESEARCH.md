# Phase 14: Knowledge Base Migration - Research

**Researched:** 2026-02-11
**Domain:** File-based knowledge base migration, symlink bridges, installer augmentation, path reference updates
**Confidence:** HIGH

## Summary

Phase 14 migrates the GSD knowledge base from its current Claude-specific location (`~/.claude/gsd-knowledge/`) to a runtime-agnostic shared location (`~/.gsd/knowledge/`), with zero data loss, backward-compatible symlinks, and `GSD_HOME` environment variable override support. This builds directly on Phase 13's two-pass path replacement system, which already transforms KB path references from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/` during installation for all runtimes.

The scope is well-defined: (1) update 35 KB path references across 9 installable source files in `get-shit-done/`, (2) update 24 references across 11 files in `.claude/agents/`, (3) update 51 references across 6 test files, (4) add migration logic and KB directory creation to the installer, (5) create a symlink bridge at the old location, and (6) support the `GSD_HOME` env var override. The installer already handles the two-pass path replacement (Phase 13), so after Phase 14 updates source files to `~/.gsd/knowledge/`, the installer's Pass 1 regex (`~/.claude/gsd-knowledge` replacement) becomes a no-op safety guard since the source no longer contains those patterns.

**Primary recommendation:** Split into two plans: Plan 01 updates all source file references and tests from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/`; Plan 02 adds KB directory creation, migration logic, symlink bridge, and `GSD_HOME` support to the installer.

## Standard Stack

### Core

| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Node.js | 18+ | Installer runtime (bin/install.js) | Already used, CommonJS module |
| Vitest | Current | Test framework | Already configured in project (vitest.config.js) |
| `fs` (built-in) | N/A | File operations, symlink creation, directory creation | Zero-dependency; `fs.symlinkSync`, `fs.cpSync`, `fs.mkdirSync` |
| `os` (built-in) | N/A | Home directory resolution | Already used in installer |
| `path` (built-in) | N/A | Cross-platform path joining | Already used throughout |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `fs.cpSync(src, dest, { recursive: true })` | Recursive directory copy for migration | Node.js 16.7+; copies entire KB directory tree |
| `fs.symlinkSync(target, path)` | Create backward-compatible symlink | After migration, link old path to new |
| `fs.lstatSync` | Check if old path is already a symlink | Avoid overwriting existing symlink during re-install |
| `fs.readdirSync(..., { recursive: true })` | Count files for migration verification | Node.js 18.17+; verifies zero data loss |
| `process.env.GSD_HOME` | Environment variable override | Check before defaulting to `~/.gsd/` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `fs.cpSync` (Node 16.7+) | Manual recursive copy function | cpSync is simpler and battle-tested; project already requires Node 18+ |
| In-source path replacement | Installer-time regex replacement only | Phase 13 already does installer-time replacement, but source files should reflect the canonical path for clarity and maintenance |
| Lock file during migration | No lock file | Migration is fast (handful of small files) and runs during install only; lock file adds complexity for minimal benefit at current KB scale |

## Architecture Patterns

### Current State (After Phase 13)

```
Source files:       ~/.claude/gsd-knowledge/  (old paths in get-shit-done/, .claude/agents/)
Installer output:   ~/.gsd/knowledge/          (Phase 13 Pass 1 transforms during install)
Actual KB data:     ~/.claude/gsd-knowledge/   (still lives at old location)
```

### Target State (After Phase 14)

```
Source files:       ~/.gsd/knowledge/          (updated in repo)
Installer output:   ~/.gsd/knowledge/          (Pass 1 becomes no-op, paths pass through unchanged)
Actual KB data:     ~/.gsd/knowledge/          (migrated from old location)
Symlink bridge:     ~/.claude/gsd-knowledge/ -> ~/.gsd/knowledge/
GSD_HOME override:  $GSD_HOME/knowledge/ if set
```

### Pattern 1: Source File Path Update (KB-06)

**What:** Replace all `~/.claude/gsd-knowledge/` references in source files with `~/.gsd/knowledge/`
**When to use:** All 9 files in `get-shit-done/` and 11 files in `.claude/agents/`

Files requiring update in `get-shit-done/` (installable source -- 35 occurrences across 9 files):

| File | Occurrences | Path Variants |
|------|-------------|---------------|
| `get-shit-done/references/knowledge-surfacing.md` | 10 | `~/.claude/gsd-knowledge/` (tilde) |
| `get-shit-done/workflows/signal.md` | 5 | `~/.claude/gsd-knowledge/` (tilde) |
| `get-shit-done/references/reflection-patterns.md` | 5 | tilde + `$HOME/.claude/gsd-knowledge` |
| `get-shit-done/references/health-check.md` | 4 | tilde + `$HOME/.claude/gsd-knowledge` |
| `get-shit-done/workflows/reflect.md` | 4 | tilde + `$HOME/.claude/gsd-knowledge` |
| `get-shit-done/workflows/collect-signals.md` | 3 | `~/.claude/gsd-knowledge/` (tilde) |
| `get-shit-done/references/signal-detection.md` | 2 | `~/.claude/gsd-knowledge/` (tilde) |
| `get-shit-done/references/spike-execution.md` | 1 | `~/.claude/gsd-knowledge/` (tilde) |
| `get-shit-done/workflows/health-check.md` | 1 | `~/.claude/gsd-knowledge/` (tilde) |

Files requiring update in `.claude/agents/` (11 files, 24 occurrences):

| File | Occurrences | Path Variants |
|------|-------------|---------------|
| `gsd-signal-collector.md` | 5 | tilde |
| `gsd-debugger.md` | 3 | tilde |
| `gsd-phase-researcher.md` | 3 | tilde |
| `gsd-reflector.md` | 3 | tilde |
| `knowledge-store.md` | 3 | tilde |
| `gsd-executor.md` | 2 | tilde |
| `gsd-planner.md` | 1 | tilde |
| `gsd-spike-runner.md` | 1 | tilde |
| `kb-create-dirs.sh` | 1 | `$HOME/.claude/gsd-knowledge` |
| `kb-rebuild-index.sh` | 1 | `$HOME/.claude/gsd-knowledge` |
| `kb-templates/spike-decision.md` | 1 | tilde |

**Critical:** The `$HOME` variant in 5 files (3 in get-shit-done/, 2 shell scripts in .claude/agents/) must be changed to `$HOME/.gsd/knowledge`. Do not accidentally leave `$HOME/.claude/gsd-knowledge` in bash code blocks.

### Pattern 2: Migration Logic in Installer (KB-04)

**What:** Copy-then-symlink migration that runs during install
**When to use:** When `~/.claude/gsd-knowledge/` exists and `~/.gsd/knowledge/` does not

```javascript
// Source: Architecture research + PITFALLS.md recommendations
function migrateKB(gsdHome) {
  const newKBDir = path.join(gsdHome, 'knowledge');
  const oldKBDir = path.join(os.homedir(), '.claude', 'gsd-knowledge');

  // Step 1: Create new KB directory structure
  fs.mkdirSync(path.join(newKBDir, 'signals'), { recursive: true });
  fs.mkdirSync(path.join(newKBDir, 'spikes'), { recursive: true });
  fs.mkdirSync(path.join(newKBDir, 'lessons'), { recursive: true });

  // Step 2: Migrate if old KB exists and new doesn't have data
  if (fs.existsSync(oldKBDir)) {
    const oldStat = fs.lstatSync(oldKBDir);

    // Skip if old path is already a symlink (previous migration)
    if (oldStat.isSymbolicLink()) {
      return; // Already migrated
    }

    // Copy contents (not move) for safety
    const oldEntries = countKBEntries(oldKBDir);
    fs.cpSync(oldKBDir, newKBDir, { recursive: true });
    const newEntries = countKBEntries(newKBDir);

    // Verify zero data loss
    if (newEntries < oldEntries) {
      console.error(`Migration verification failed: ${oldEntries} entries in source, ${newEntries} in destination`);
      return; // Abort symlink, leave both copies
    }

    // Step 3: Replace old directory with symlink
    // Rename old dir to backup, create symlink, remove backup on success
    const backupDir = oldKBDir + '.migration-backup';
    fs.renameSync(oldKBDir, backupDir);
    fs.symlinkSync(newKBDir, oldKBDir);
    // Keep backup for safety -- can be cleaned up in a future release

    console.log(`Migrated knowledge base: ${oldEntries} entries`);
    console.log(`  ${oldKBDir} -> ${newKBDir}`);
  }

  // Step 4: Create symlink if old path doesn't exist (fresh install with existing new KB)
  if (!fs.existsSync(oldKBDir) && fs.existsSync(newKBDir)) {
    const claudeDir = path.join(os.homedir(), '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.symlinkSync(newKBDir, oldKBDir);
  }
}
```

### Pattern 3: GSD_HOME Resolution (KB-05)

**What:** Environment variable override for KB location
**When to use:** In installer to determine KB directory path

```javascript
function getGsdHome() {
  if (process.env.GSD_HOME) {
    const gsdHome = process.env.GSD_HOME;
    // Expand ~ if present
    if (gsdHome.startsWith('~/')) {
      return path.join(os.homedir(), gsdHome.slice(2));
    }
    return gsdHome;
  }
  return path.join(os.homedir(), '.gsd');
}
```

**Where this is used:** Only in the installer for KB directory creation and migration. Source files always reference `~/.gsd/knowledge/` -- the installer does NOT transform `~/.gsd/` paths (they are not `~/.claude/` paths, so they pass through the two-pass system unchanged). The `GSD_HOME` override is an installer/runtime concern, not a source-file concern.

**Important consideration for GSD_HOME in source files:** The KB shell scripts (`kb-create-dirs.sh`, `kb-rebuild-index.sh`) and workflow bash code blocks use `$HOME/.gsd/knowledge` after migration. If `GSD_HOME` is set, these would point to the wrong location. The shell scripts should be updated to check `$GSD_HOME` first:

```bash
KB_DIR="${GSD_HOME:-$HOME/.gsd}/knowledge"
```

And the installer's `replacePathsInContent()` does NOT need to change -- `~/.gsd/knowledge/` references in source files are NOT touched by the regex (which only matches `~/.claude/`). The `GSD_HOME` override is handled at the bash level in shell scripts and at the Node.js level in the installer.

### Pattern 4: Installer Integration Placement

**What:** Where KB migration logic sits in the install flow
**When to use:** During the install process, before per-runtime file installation

```
Install flow (bin/install.js):
  1. Parse CLI flags (--global, --opencode, --gemini, etc.)
  2. Determine targetDir for each runtime
  3. >>> NEW: getGsdHome() -> resolve ~/.gsd/ or $GSD_HOME
  4. >>> NEW: migrateKB(gsdHome) -> create dirs, migrate, symlink
  5. Per-runtime install (copyWithPathReplacement, etc.)
  6. Hook registration
  7. Success output
```

KB setup runs ONCE per install (not per-runtime), before the per-runtime loop.

### Anti-Patterns to Avoid

- **Moving instead of copying:** Never `fs.renameSync()` the KB directory. Always copy first, verify, then create symlink. Rename fails across filesystems and leaves users with no KB if interrupted.
- **Updating source files to use `$GSD_HOME`:** Source markdown files should use the default `~/.gsd/knowledge/` path. The `GSD_HOME` override is a runtime concern handled by shell variable expansion in bash scripts and `process.env` in Node.js. Embedding `$GSD_HOME` into markdown prose read by LLMs would confuse agents.
- **Removing the installer's Pass 1 regex:** After Phase 14, the Pass 1 regex (`~/.claude/gsd-knowledge` -> `~/.gsd/knowledge`) will no longer match anything in source files (they already use `~/.gsd/knowledge/`). Leave the regex as a safety guard -- it causes no harm and protects against accidental regression if someone adds an old-style path reference.
- **Updating .planning/ files:** Planning docs are historical records. Do NOT update `~/.claude/gsd-knowledge/` references in completed phase plans, summaries, or verification docs. Only update active source files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Recursive directory copy | Custom walk + copy loop | `fs.cpSync(src, dest, { recursive: true })` | Built into Node 16.7+, handles all edge cases |
| Entry counting for verification | Manual find + count | `fs.readdirSync(dir, { recursive: true }).filter(f => f.endsWith('.md'))` | Built into Node 18.17+, project requires 18+ |
| Symlink creation | Shell exec of `ln -s` | `fs.symlinkSync(target, path)` | Native Node.js, no subprocess needed |
| Path tilde expansion | Regex on `~` character | `os.homedir()` + `path.join()` | Reliable cross-platform |
| Migration locking | File-based lock with polling | Nothing -- skip the lock file | KB is a handful of small markdown files; migration takes <1 second; installer runs synchronously |

**Key insight:** The KB is currently ~20 entries across ~25 small markdown files. The migration is trivially fast. There is no need for elaborate locking, chunked migration, or progress reporting. Copy the directory, count entries, create symlink. Done.

## Common Pitfalls

### Pitfall 1: Forgetting $HOME Variant in Source Files

**What goes wrong:** Updating `~/.claude/gsd-knowledge/` references but missing the `$HOME/.claude/gsd-knowledge` variant in 5 files
**Why it happens:** Most references use tilde (`~`), but bash code blocks in 5 files use `$HOME` expansion
**How to avoid:** Search for BOTH patterns: `~/.claude/gsd-knowledge` AND `$HOME/.claude/gsd-knowledge`. The 5 files with `$HOME` variant:
  - `get-shit-done/workflows/reflect.md` (line 116)
  - `get-shit-done/references/health-check.md` (line 47)
  - `get-shit-done/references/reflection-patterns.md` (line 327)
  - `.claude/agents/kb-create-dirs.sh` (line 5)
  - `.claude/agents/kb-rebuild-index.sh` (line 6)
**Warning signs:** `grep '\$HOME.*gsd-knowledge'` returns results after Phase 14 is "complete"

### Pitfall 2: Symlink Target vs Path Argument Order

**What goes wrong:** `fs.symlinkSync(target, path)` -- the arguments are (where-it-points-to, where-the-symlink-lives). Swapping them creates a broken symlink at the new location pointing to the old location.
**Why it happens:** The argument order is counterintuitive -- `symlinkSync(target, path)` reads as "symlink target at path" but means "create symlink at `path` pointing to `target`"
**How to avoid:** Always write it as: `fs.symlinkSync(newKBDir, oldKBDir)` -- the symlink lives at oldKBDir and points to newKBDir
**Warning signs:** `ls -la ~/.claude/gsd-knowledge` shows a symlink pointing the wrong direction

### Pitfall 3: Old Path Is Already a Symlink (Re-install)

**What goes wrong:** Running the installer a second time after migration. The old path is already a symlink. Attempting to copy from it would follow the symlink (copying from the new location back to itself). Attempting to rename it would move the symlink, not the data.
**Why it happens:** The migration doesn't account for idempotent re-runs
**How to avoid:** Check `fs.lstatSync(oldKBDir).isSymbolicLink()` before attempting migration. If it's already a symlink, skip migration entirely -- it was already done.
**Warning signs:** Second install hangs or duplicates data

### Pitfall 4: Tests Still Using Old Paths

**What goes wrong:** Tests in `kb-infrastructure.test.js` create KB structure at `path.join(tmpdir, '.claude', 'gsd-knowledge')`. After migration, the scripts they test would use `path.join(tmpdir, '.gsd', 'knowledge')` instead.
**Why it happens:** 6 test files (51 occurrences) reference `gsd-knowledge` with various path constructions
**How to avoid:** Update all test files to use the new path structure (`path.join(tmpdir, '.gsd', 'knowledge')`). The KB shell scripts and tests should consistently use the new location.
**Warning signs:** Tests pass locally (where old paths still exist via symlink) but fail in CI (clean environment)

### Pitfall 5: KB Shell Scripts Not in `agents/` Package Directory

**What goes wrong:** The KB scripts (`kb-create-dirs.sh`, `kb-rebuild-index.sh`) live in `.claude/agents/` (the project's local Claude config) and are NOT in the `agents/` directory that the installer copies. They are not part of the npm package distribution.
**Why it happens:** These scripts were created as local project tooling, not as distributable agents
**How to avoid:** Either (a) move these scripts to `agents/` so they get installed, (b) move their functionality into the Node.js installer, or (c) leave them as-is with updated paths and accept they are local-only tools. Recommendation: option (b) -- the `migrateKB()` function in the installer subsumes `kb-create-dirs.sh` functionality (creating signals/, spikes/, lessons/ subdirectories). For `kb-rebuild-index.sh`, it should stay as a separate tool but its path needs updating. Since it is referenced from installed workflow files (`signal.md`, `reflect.md`, etc.) with the path `~/.claude/agents/kb-rebuild-index.sh`, those references need to resolve correctly after install.
**Warning signs:** Workflows reference `~/.gsd/agents/kb-rebuild-index.sh` but no such file exists because it was never installed there

### Pitfall 6: Missing ~/.claude/ Parent Directory for Symlink

**What goes wrong:** On a fresh machine where Claude Code has never been installed, `~/.claude/` may not exist. Creating a symlink at `~/.claude/gsd-knowledge` requires the parent directory to exist.
**Why it happens:** The symlink bridge assumes `~/.claude/` exists
**How to avoid:** `fs.mkdirSync(path.join(os.homedir(), '.claude'), { recursive: true })` before creating the symlink
**Warning signs:** Install fails with ENOENT when creating symlink on fresh machines

## Code Examples

### Example 1: Source File Path Replacement

```bash
# Tilde variant (most common, 54 occurrences across 18 files):
# BEFORE:
~/.claude/gsd-knowledge/signals/{project}/
~/.claude/gsd-knowledge/index.md
~/.claude/gsd-knowledge/lessons/{category}/

# AFTER:
~/.gsd/knowledge/signals/{project}/
~/.gsd/knowledge/index.md
~/.gsd/knowledge/lessons/{category}/
```

```bash
# $HOME variant (5 occurrences across 5 files):
# BEFORE:
KB_DIR="$HOME/.claude/gsd-knowledge"
KB_INDEX="$HOME/.claude/gsd-knowledge/index.md"

# AFTER (with GSD_HOME support in shell scripts):
KB_DIR="${GSD_HOME:-$HOME/.gsd}/knowledge"
KB_INDEX="${GSD_HOME:-$HOME/.gsd}/knowledge/index.md"
```

### Example 2: KB Entry Count Verification

```javascript
// Source: Built on Node.js fs API
function countKBEntries(kbDir) {
  let count = 0;
  for (const subdir of ['signals', 'spikes', 'lessons']) {
    const typeDir = path.join(kbDir, subdir);
    if (!fs.existsSync(typeDir)) continue;
    const entries = fs.readdirSync(typeDir, { recursive: true });
    count += entries.filter(f => f.endsWith('.md')).length;
  }
  return count;
}
```

### Example 3: Updated kb-create-dirs.sh

```bash
#!/usr/bin/env bash
# kb-create-dirs.sh -- Initialize the GSD knowledge store directory structure.
# Idempotent: safe to run multiple times.

KB_DIR="${GSD_HOME:-$HOME/.gsd}/knowledge"

mkdir -p "$KB_DIR/signals"
mkdir -p "$KB_DIR/spikes"
mkdir -p "$KB_DIR/lessons"

echo "Knowledge store directories verified at $KB_DIR:"
echo "  signals/"
echo "  spikes/"
echo "  lessons/"
exit 0
```

### Example 4: Updated kb-rebuild-index.sh (First 10 Lines)

```bash
#!/usr/bin/env bash
# kb-rebuild-index.sh -- Rebuild the knowledge store index from entry files.
# Atomic: writes to temp file then renames.
# Handles empty knowledge base gracefully.

KB_DIR="${GSD_HOME:-$HOME/.gsd}/knowledge"
INDEX_TMP="$KB_DIR/index.md.tmp"
INDEX="$KB_DIR/index.md"

# Ensure KB exists
mkdir -p "$KB_DIR"
# ... (rest unchanged)
```

### Example 5: Updated Installer Two-Pass Function (Post-Phase 14)

```javascript
// After Phase 14, source files use ~/.gsd/knowledge/ directly.
// The Pass 1 regex no longer matches anything in source files,
// but remains as a safety guard.
function replacePathsInContent(content, runtimePathPrefix) {
  // Pass 1: Safety guard -- replace any remaining old KB paths
  // (should be no-ops after Phase 14 source updates)
  let result = content.replace(/~\/\.claude\/gsd-knowledge/g, '~/.gsd/knowledge');
  result = result.replace(/\$HOME\/\.claude\/gsd-knowledge/g, '$HOME/.gsd/knowledge');

  // Pass 2: Replace remaining runtime-specific paths
  result = result.replace(/~\/\.claude\/(?!gsd-knowledge)/g, runtimePathPrefix);
  // ... $HOME variant handling unchanged
  return result;
}
```

### Example 6: Test Migration Verification

```javascript
// Proposed test for migration logic
tmpdirTest('migrates existing KB and creates symlink', async ({ tmpdir }) => {
  // Set up old KB structure at ~/.claude/gsd-knowledge/
  const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge');
  fs.mkdirSync(path.join(oldKBDir, 'signals', 'test-project'), { recursive: true });
  fs.mkdirSync(path.join(oldKBDir, 'spikes'), { recursive: true });
  fs.mkdirSync(path.join(oldKBDir, 'lessons'), { recursive: true });
  fs.writeFileSync(
    path.join(oldKBDir, 'signals', 'test-project', 'test-signal.md'),
    '---\nid: sig-test\ntype: signal\n---\nTest signal'
  );
  fs.writeFileSync(path.join(oldKBDir, 'index.md'), '# Index\n');

  // Run installer
  execSync(`node "${installScript}" --global`, {
    env: { ...process.env, HOME: tmpdir },
    timeout: 15000
  });

  // Verify new location has the data
  const newKBDir = path.join(tmpdir, '.gsd', 'knowledge');
  expect(fs.existsSync(path.join(newKBDir, 'signals', 'test-project', 'test-signal.md'))).toBe(true);
  expect(fs.existsSync(path.join(newKBDir, 'index.md'))).toBe(true);

  // Verify old location is now a symlink
  const oldStat = fs.lstatSync(oldKBDir);
  expect(oldStat.isSymbolicLink()).toBe(true);
  expect(fs.readlinkSync(oldKBDir)).toBe(newKBDir);

  // Verify reading via old symlink path works
  const content = fs.readFileSync(
    path.join(oldKBDir, 'signals', 'test-project', 'test-signal.md'), 'utf8'
  );
  expect(content).toContain('sig-test');
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| KB at `~/.claude/gsd-knowledge/` | KB at `~/.gsd/knowledge/` | Phase 14 (this phase) | Runtime-agnostic KB access for all runtimes |
| No migration support | Copy-then-symlink migration | Phase 14 (this phase) | Existing users retain all KB data |
| Hardcoded KB path in shell scripts | `${GSD_HOME:-$HOME/.gsd}/knowledge` | Phase 14 (this phase) | User-configurable KB location |
| Installer creates no KB dirs | Installer creates `~/.gsd/knowledge/{signals,spikes,lessons}` | Phase 14 (this phase) | KB ready to use on first install |
| Pass 1 regex transforms paths at install time | Source files already use `~/.gsd/knowledge/` | Phase 14 (this phase) | Pass 1 becomes no-op safety guard |

## Scope Boundaries

### In Scope

- All files in `get-shit-done/` with `gsd-knowledge` references (9 files, 35 occurrences)
- All files in `.claude/agents/` with `gsd-knowledge` references (11 files, 24 occurrences)
- All test files with `gsd-knowledge` references (6 files, 51 occurrences)
- Installer: `getGsdHome()`, `migrateKB()`, directory creation
- Shell scripts: `kb-create-dirs.sh`, `kb-rebuild-index.sh` path updates
- Smoke test: `run-smoke.sh` path updates (8 occurrences)
- Benchmark: `standard-signal.js` path updates (1 occurrence)

### NOT In Scope

- `.planning/` docs: These are historical records. Do NOT update old phase plans, summaries, research docs, or verification reports. The `gsd-knowledge` references in `.planning/` are part of the historical record of phases 1-13.
- Installer's `replacePathsInContent()`: The Pass 1 regex stays as-is (becomes a no-op safety guard).
- Creating any new npm dependencies.
- KB rebuild script functionality changes (only path updates).

## Open Questions

1. **kb-rebuild-index.sh Installation Path**
   - What we know: Workflow files reference `~/.claude/agents/kb-rebuild-index.sh` (6 files). This script lives in `.claude/agents/` in the repo, NOT in the `agents/` directory the installer copies. It is not part of the npm package distribution.
   - What's unclear: After Phase 14, should the reference become `~/.gsd/bin/kb-rebuild-index.sh` (new shared location), stay as `~/.claude/agents/kb-rebuild-index.sh` (still runtime-specific via installer path replacement), or something else?
   - Recommendation: Leave the script references as runtime-specific paths (`~/.claude/agents/kb-rebuild-index.sh`). The installer already transforms these to the correct runtime location. The script itself needs its internal `KB_DIR` path updated to `~/.gsd/knowledge/`. This is consistent with Phase 13's design: script location is runtime-specific, but KB data path is shared. The fact that the script isn't in the distributed `agents/` package is a pre-existing issue (signal sig-2026-02-10-missing-kb-rebuild-index-script), not a Phase 14 concern.

2. **GSD_HOME in Markdown Prose**
   - What we know: Source markdown files will use `~/.gsd/knowledge/` as the canonical path. Shell scripts will use `${GSD_HOME:-$HOME/.gsd}/knowledge`.
   - What's unclear: Should workflow prose mention `GSD_HOME`? E.g., "Read the index at `~/.gsd/knowledge/index.md` (or `$GSD_HOME/knowledge/index.md` if set)"
   - Recommendation: No. Keep markdown prose simple with the default path. The `GSD_HOME` override is a power-user feature documented in the installer's help output and project README, not repeated in every workflow file. LLM agents will read `~/.gsd/knowledge/` and that will work for the vast majority of cases. If `GSD_HOME` is set, the symlink bridge at `~/.gsd/knowledge/` handles most edge cases (it would still exist pointing to the custom location).

3. **Symlink on Fresh Machine Without Claude Code**
   - What we know: The symlink at `~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/` provides backward compatibility.
   - What's unclear: Should the symlink be created on fresh installs where `~/.claude/gsd-knowledge/` never existed? This would create `~/.claude/` directory on machines where Claude Code was never installed.
   - Recommendation: Create the symlink only when Claude Code runtime is being installed (not for `--codex` or `--gemini` only installs). When installing for Claude, `~/.claude/` will already exist or be created by the installer. For non-Claude-only installs, the symlink is unnecessary.

4. **Test File Path Patterns**
   - What we know: `kb-infrastructure.test.js` uses `.claude/gsd-knowledge` paths (old location). `kb-write.test.js` uses just `gsd-knowledge` (relative to tmpdir, no `.claude` parent).
   - What's unclear: Should `kb-write.test.js` stay as-is (it doesn't use the full old path) or update to `.gsd/knowledge`?
   - Recommendation: Update both. `kb-infrastructure.test.js` should use `.gsd/knowledge` since it tests the KB scripts that will be updated. `kb-write.test.js` should also update for consistency, even though its simpler path pattern works either way.

## Sources

### Primary (HIGH confidence)

- `bin/install.js` lines 609-635 -- Direct codebase analysis of replacePathsInContent() two-pass system
- `get-shit-done/workflows/*.md` + `get-shit-done/references/*.md` -- Direct audit of all 9 files with KB references (35 occurrences)
- `.claude/agents/*.md` + `.claude/agents/kb-*.sh` -- Direct audit of all 11 files with KB references (24 occurrences)
- `tests/` -- Direct audit of all 6 test files with KB references (51 occurrences)
- `.planning/phases/13-*/13-VERIFICATION.md` -- Phase 13 verification confirms two-pass system is working and tested
- `.planning/research/PITFALLS.md` -- Migration strategy analysis (copy-then-symlink, race conditions, rollback)
- `.planning/research/ARCHITECTURE.md` -- Migration flow diagram and KB path resolution design
- `.planning/research/STACK.md` -- GSD_HOME env var pattern, `~/.gsd/` directory recommendation

### Secondary (MEDIUM confidence)

- `.planning/research/SUMMARY.md` -- Roadmap phase decomposition confirming dependency ordering
- [Node.js fs.symlinkSync documentation](https://www.geeksforgeeks.org/node-js/node-js-fs-symlinksync-method/) -- Cross-platform symlink argument order
- `.planning/phases/01-knowledge-store/01-02-PLAN.md` -- Original KB directory creation design

### Tertiary (LOW confidence)

- None. All findings verified against actual codebase and prior phase artifacts.

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-10-missing-kb-rebuild-index-script | signal | KB rebuild index script referenced but missing from installation path | Open Questions (script installation path) |

The signal about the missing `kb-rebuild-index.sh` is relevant but out of scope for Phase 14. The script exists in `.claude/agents/` but is not distributed via the npm package. Phase 14 updates the script's internal paths but does not solve the distribution problem.

## Metadata

**Confidence breakdown:**
- Source file audit: HIGH -- complete grep analysis of all source files with exact counts per file
- Installer architecture: HIGH -- complete understanding from Phase 13 research + verification
- Migration logic: HIGH -- well-documented in prior research (PITFALLS.md, ARCHITECTURE.md, STACK.md) with concrete code patterns
- GSD_HOME implementation: MEDIUM -- pattern is straightforward but interaction with symlinks and markdown prose needs validation
- Test updates: HIGH -- all 6 test files identified with exact occurrence counts

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable -- no external dependency changes, pure internal migration)
