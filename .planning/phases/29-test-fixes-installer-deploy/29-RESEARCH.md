# Phase 29: Test Fixes & Installer Deployment - Research

**Researched:** 2026-02-23
**Domain:** Test isolation (node:test) + installer deployment (bin/install.js)
**Confidence:** HIGH

## Summary

Phase 29 addresses two independent issues: (1) two failing `backlog stats` tests caused by global backlog item pollution, and (2) a stale deployed `gsd-tools.js` binary that is 875 lines behind the source. Both are straightforward fixes with well-established patterns already in the codebase.

The `backlog stats` test failures have been documented since Phase 25 and explicitly called out in Phase 26 as known debt. The root cause is that `cmdBacklogStats()` aggregates both local (project-level) and global (`~/.gsd/backlog/items/`) items. Two tests at lines 3275 and 3291 in `gsd-tools.test.js` use `runGsdTools()` (no env override), so they pick up real items from the developer's `~/.gsd/backlog/items/` directory. The fix pattern is already demonstrated at line 4128 of the same file: use `runGsdToolsWithEnv()` with `GSD_HOME` pointing to a nonexistent directory.

The installer deployment gap exists because `bin/install.js` copies `get-shit-done/bin/gsd-tools.js` (source, 5472 lines) to the target's `get-shit-done/bin/gsd-tools.js`, but the installer hasn't been re-run since new commands (manifest operations, etc.) were added. The repo-local `.claude/get-shit-done/bin/gsd-tools.js` (4597 lines) and global `~/.claude/get-shit-done/bin/gsd-tools.js` (4597 lines) both have identical stale content (same MD5: `548166741cbc90da092a3654cfcc2f4d`).

**Primary recommendation:** Fix the 2 test calls to use `runGsdToolsWithEnv` with `GSD_HOME` isolation, then re-run the installer for both local and global targets. Verify with hash comparison.

## Standard Stack

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| `gsd-tools.js` | `get-shit-done/bin/gsd-tools.js` | CLI tool with backlog, config, manifest, todo commands | Canonical source -- installer copies this to targets |
| `gsd-tools.test.js` | `get-shit-done/bin/gsd-tools.test.js` | 163 tests using `node:test` runner | Upstream-compatible test suite (not vitest) |
| `install.js` | `bin/install.js` | Multi-runtime installer (Claude, OpenCode, Gemini, Codex) | Copies source to target with path replacement |
| `install.test.js` | `tests/unit/install.test.js` | 73 tests using vitest + tmpdirTest fixture | Tests installer behavior in isolated temp dirs |
| `wiring-validation.test.js` | `tests/integration/wiring-validation.test.js` | 20 tests validating @-references, subagent_type, file existence | Catches dangling references |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `runGsdToolsWithEnv()` | Run gsd-tools with custom env vars | Test isolation from global state |
| `createTempProject()` | Create isolated temp dir with `.planning/phases/` | Every gsd-tools test |
| `tmpdirTest()` | Vitest fixture for temp dirs | install.test.js and integration tests |

### Alternatives Considered
None -- this phase uses existing patterns and tools. No new dependencies needed.

## Architecture Patterns

### Pattern 1: GSD_HOME Test Isolation
**What:** Override `GSD_HOME` env var to point to a nonexistent directory, preventing tests from reading the developer's real `~/.gsd/backlog/items/`.
**When to use:** Any test that calls a command which reads global backlog items (e.g., `backlog stats`, `backlog group`).
**Example (already in codebase at line 4128-4131):**
```javascript
// Source: get-shit-done/bin/gsd-tools.test.js:4128-4131
const result = runGsdToolsWithEnv('backlog stats', tmpDir, {
  GSD_HOME: path.join(tmpDir, '__nonexistent_gsd_home__'),
});
```
**Why it works:** `resolveBacklogDir()` at line 3672 reads `process.env.GSD_HOME` and falls back to `os.homedir()/.gsd`. Setting `GSD_HOME` to a nonexistent path means `readBacklogItems()` will catch the ENOENT from `readdirSync()` and return an empty array (line 3680-3696).

### Pattern 2: Installer Deployment (copyWithPathReplacement)
**What:** The installer recursively copies from source to target. `.md` files get path replacement; `.js` and other files are copied verbatim via `fs.copyFileSync`.
**When to use:** Deploying updated source to local (`.claude/`) or global (`~/.claude/`) targets.
**Example:**
```bash
# Local install (repo-local .claude/ directory)
node bin/install.js --claude --local

# Global install (~/.claude/ directory)
node bin/install.js --claude --global
```
**Key detail:** The installer function at line 1237-1238 copies non-`.md` files with `copyFileSync`, so `gsd-tools.js` and `gsd-tools.test.js` are copied byte-for-byte from `get-shit-done/bin/` to the target's `get-shit-done/bin/`.

### Pattern 3: runGsdToolsWithEnv Helper
**What:** Wrapper around `execSync` that merges custom env vars into `process.env` before running `gsd-tools.js`.
**Defined at:** `gsd-tools.test.js:3372-3388`
**Signature:** `runGsdToolsWithEnv(args, cwd, env)` where `env` is an object of env var overrides.
**Example:**
```javascript
// Source: get-shit-done/bin/gsd-tools.test.js:3372-3388
function runGsdToolsWithEnv(args, cwd, env) {
  try {
    const result = execSync(`node "${TOOLS_PATH}" ${args}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });
    return { success: true, output: result.trim() };
  } catch (err) {
    return {
      success: false,
      output: err.stdout?.toString().trim() || '',
      error: err.stderr?.toString().trim() || err.message,
    };
  }
}
```

### Anti-Patterns to Avoid
- **Running installer with --local when tracked files exist in .claude/:** The installer's `copyWithPathReplacement` removes the destination directory before copying (`fs.rmSync` at line 1204-1206). This would delete tracked files in `.claude/get-shit-done/` that were force-added to git (e.g., `agent-protocol.md`, `collect-signals.md`, `reflect.md`, `run-spike.md`). The local install ONLY affects `.claude/get-shit-done/` (not `.claude/agents/` or `.claude/commands/gsd/`), so agent and command files are safe. But the 4 tracked workflow/reference files in `.claude/get-shit-done/` would be overwritten.
- **Modifying tests beyond the minimal fix:** Only change the 2 failing test calls. Do not restructure, rename, or refactor other tests.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test env isolation | Custom HOME override | `runGsdToolsWithEnv` with `GSD_HOME` | Already exists, proven pattern |
| Binary deployment | Manual file copy | `node bin/install.js --claude --global` | Handles path replacement, VERSION, cleanup |
| Hash verification | Custom script | `shasum` or `md5` CLI | Standard Unix tools, sufficient |

**Key insight:** Every tool needed for this phase already exists in the codebase. This is purely a "use existing patterns" phase.

## Common Pitfalls

### Pitfall 1: Installer Overwrites Tracked .claude/ Files
**What goes wrong:** Running `node bin/install.js --claude --local` could overwrite tracked files in `.claude/get-shit-done/` (workflows and references that were force-added to git).
**Why it happens:** The installer removes the target `get-shit-done/` directory before copying fresh content. The tracked files at `.claude/get-shit-done/references/agent-protocol.md`, `.claude/get-shit-done/workflows/collect-signals.md`, `.claude/get-shit-done/workflows/reflect.md`, and `.claude/get-shit-done/workflows/run-spike.md` exist in both the source `get-shit-done/` directory AND the `.claude/get-shit-done/` target. Since the installer copies from source, these files would be replaced with their source equivalents (which should be identical, but worth verifying).
**How to avoid:** After local install, verify tracked files are unchanged with `git diff .claude/`.
**Warning signs:** `git status` shows modified files in `.claude/get-shit-done/`.

### Pitfall 2: Forgetting Global Install
**What goes wrong:** Fixing only the repo-local `.claude/get-shit-done/bin/gsd-tools.js` but leaving `~/.claude/get-shit-done/bin/gsd-tools.js` stale. The user runs `/gsd:` commands from other repos and gets old behavior.
**Why it happens:** Success criteria #4 explicitly requires the global install to match source. Easy to forget since it's outside the repo.
**How to avoid:** Run both `--local` and `--global` installs. Verify both with hash comparison.
**Warning signs:** Different hashes between source and `~/.claude/get-shit-done/bin/gsd-tools.js`.

### Pitfall 3: Test Count Assumptions After Fix
**What goes wrong:** Assuming the total test count remains at 163 after the fix. If the developer has added items to `~/.gsd/backlog/items/` since last run, the test count may have shifted.
**Why it happens:** The failing tests show `total should be 3` getting `4` -- the extra item is from global state. After fixing with `GSD_HOME` isolation, the counts should be exact.
**How to avoid:** After applying the fix, run the full suite and confirm 163 tests / 0 failures.
**Warning signs:** Any failure other than the 2 known failures indicates a new issue.

### Pitfall 4: Installer Changes File Permissions
**What goes wrong:** Source `gsd-tools.js` has `rwxr-xr-x` (executable) permissions. `copyFileSync` preserves permissions on macOS, but worth verifying.
**How to avoid:** Check `ls -la` after install to confirm permissions.

### Pitfall 5: Source agents/ Missing 3 Restored Agents
**What goes wrong:** The installer copies from `agents/` (source, 11 files) to target `agents/`. The 3 restored agents (gsd-reflector, gsd-signal-collector, gsd-spike-runner) are only in `.claude/agents/` (tracked via force-add), NOT in the source `agents/` directory. This means a fresh install would NOT include these 3 agents.
**Why it happens:** Phase 28 restored files to `.claude/agents/` (the runtime location) but didn't add them to the source `agents/` directory. This is an existing gap from Phase 28, NOT a Phase 29 concern, but worth noting.
**Impact on Phase 29:** None -- Phase 29 only fixes test isolation and deploys gsd-tools.js binary. The wiring validation tests already pass (20/20) because they check `.claude/agents/` which has all 14 agents on disk.
**How to avoid:** This is known debt, not a Phase 29 blocker. The agents exist where they need to for runtime and tests.

## Code Examples

### Fix 1: Isolate "returns counts by status and priority" Test (line 3275)
```javascript
// BEFORE (line 3280):
const result = runGsdTools('backlog stats', tmpDir);

// AFTER:
const result = runGsdToolsWithEnv('backlog stats', tmpDir, {
  GSD_HOME: path.join(tmpDir, '__nonexistent_gsd_home__'),
});
```

### Fix 2: Isolate "returns zero counts when no items" Test (line 3291)
```javascript
// BEFORE (line 3292):
const result = runGsdTools('backlog stats', tmpDir);

// AFTER:
const result = runGsdToolsWithEnv('backlog stats', tmpDir, {
  GSD_HOME: path.join(tmpDir, '__nonexistent_gsd_home__'),
});
```

### Verify Deployment Hash Match
```bash
# After running installer, verify all 3 copies match:
shasum get-shit-done/bin/gsd-tools.js \
      .claude/get-shit-done/bin/gsd-tools.js \
      ~/.claude/get-shit-done/bin/gsd-tools.js
# All 3 hashes should be identical
```

### Installer Commands
```bash
# Redeploy to repo-local .claude/
node bin/install.js --claude --local

# Redeploy to global ~/.claude/
node bin/install.js --claude --global
```

## Current State Snapshot

### Test Suite Status (as of research)
| Suite | Runner | Tests | Pass | Fail | Notes |
|-------|--------|-------|------|------|-------|
| `gsd-tools.test.js` | `node:test` | 163 | 161 | **2** | `backlog stats` GSD_HOME isolation |
| `gsd-tools-fork.test.js` | `node:test` | 7 | 7 | 0 | Clean |
| `install.test.js` | vitest | 73 | 73 | 0 | Clean |
| `wiring-validation.test.js` | vitest | 20 | 20 | 0 | Clean (after Phase 28) |
| `kb-infrastructure.test.js` | vitest | 27 | 27 | 0 | Clean |
| `cross-runtime-kb.test.js` | vitest | 9 | 9 | 0 | Clean |
| `multi-runtime.test.js` | vitest | 16 | 16 | 0 | Clean |
| `real-agent.test.js` | vitest | 4 | 0 | 0 | Skipped (e2e) |

### Binary Version Gap
| Location | Lines | MD5 | Status |
|----------|-------|-----|--------|
| `get-shit-done/bin/gsd-tools.js` (source) | 5472 | `3627148ed7d5e4abc4081a86f02083d4` | Current |
| `.claude/get-shit-done/bin/gsd-tools.js` (repo-local) | 4597 | `548166741cbc90da092a3654cfcc2f4d` | **Stale** |
| `~/.claude/get-shit-done/bin/gsd-tools.js` (global) | 4597 | `548166741cbc90da092a3654cfcc2f4d` | **Stale** |

### Failing Tests Detail
Both failures are in `get-shit-done/bin/gsd-tools.test.js`:

**Test 1: "returns counts by status and priority" (line 3275)**
- Creates 3 local items, expects `total: 3`
- Gets `total: 4` because 1 global item from `~/.gsd/backlog/items/` is included
- Fix: Use `runGsdToolsWithEnv` with `GSD_HOME` override

**Test 2: "returns zero counts when no items" (line 3291)**
- Creates 0 local items, expects `total: 0`
- Gets `total: 1` because 1 global item from `~/.gsd/backlog/items/` is included
- Fix: Use `runGsdToolsWithEnv` with `GSD_HOME` override

### Key Functions (source locations)
| Function | File | Line | Role |
|----------|------|------|------|
| `cmdBacklogStats()` | `gsd-tools.js` | 3835 | Aggregates local + global items |
| `readBacklogItems()` | `gsd-tools.js` | 3679 | Reads items from local or global dir |
| `resolveBacklogDir()` | `gsd-tools.js` | 3671 | Returns global dir using `GSD_HOME` env |
| `runGsdTools()` | `gsd-tools.test.js` | 14 | Run gsd-tools (no env override) |
| `runGsdToolsWithEnv()` | `gsd-tools.test.js` | 3372 | Run gsd-tools with env overrides |
| `createBacklogItem()` | `gsd-tools.test.js` | 2993 | Create test backlog item in temp dir |
| `copyWithPathReplacement()` | `install.js` | 1199 | Copy source to target with path fixes |
| `install()` | `install.js` | 1882 | Main install function |

### Repo Structure (relevant to Phase 29)
```
# SOURCE (canonical, what installer reads from)
agents/                           # 11 agent specs (missing 3 restored ones)
commands/gsd/                     # 33 command files (missing reflect.md, spike.md)
get-shit-done/bin/gsd-tools.js    # 5472 lines (SOURCE OF TRUTH)
get-shit-done/bin/gsd-tools.test.js  # 4251 lines (has the 2 failing tests)
bin/install.js                    # 2436 lines (installer)

# DEPLOYED: repo-local (git-tracked subset + installer output)
.claude/agents/                   # 14 agents (11 from source + 3 restored)
.claude/commands/gsd/             # 35 commands (33 from source + 2 restored)
.claude/get-shit-done/bin/gsd-tools.js  # 4597 lines (STALE, installer output)

# DEPLOYED: global (installer output only)
~/.claude/get-shit-done/bin/gsd-tools.js  # 4597 lines (STALE, installer output)

# TESTS (vitest)
tests/unit/install.test.js              # 73 tests, vitest
tests/integration/wiring-validation.test.js  # 20 tests, vitest

# TESTS (node:test)
get-shit-done/bin/gsd-tools.test.js      # 163 tests, node:test
get-shit-done/bin/gsd-tools-fork.test.js # 7 tests, node:test
```

## Open Questions

1. **Should restored agents be added to source `agents/` directory?**
   - What we know: Phase 28 restored 3 agents to `.claude/agents/` but not to `agents/`. The installer reads from `agents/` when deploying. A fresh install on a new machine would be missing these 3 agents.
   - What's unclear: Is this a Phase 29 concern or future debt?
   - Recommendation: Out of scope for Phase 29 (the success criteria don't mention it). Document as known gap. The wiring tests pass because they check `.claude/agents/` which has all files on disk.

2. **Should the local install preserve tracked files?**
   - What we know: Running `--local` will remove `.claude/get-shit-done/` and re-copy from source. 4 files in `.claude/get-shit-done/` are tracked in git (3 workflows + 1 reference). These same files exist in the source `get-shit-done/` directory, so they will be replaced with source content.
   - What's unclear: Whether the tracked copies diverge from source.
   - Recommendation: After local install, run `git diff .claude/` to verify no tracked files changed. If they did, investigate before committing.

3. **Does the `.claude/get-shit-done/bin/gsd-tools.test.js` (deployed copy) need updating?**
   - What we know: The installer copies `gsd-tools.test.js` along with `gsd-tools.js` because `copyWithPathReplacement` copies all non-`.md` files. The deployed test file is at 2033 lines vs source at 4251 lines.
   - What's unclear: Whether anyone runs the deployed test file.
   - Recommendation: The installer will update it automatically. No separate action needed.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis of `get-shit-done/bin/gsd-tools.test.js` (failing test lines 3275, 3291; working pattern line 4128)
- Direct codebase analysis of `get-shit-done/bin/gsd-tools.js` (cmdBacklogStats line 3835, resolveBacklogDir line 3671)
- Direct codebase analysis of `bin/install.js` (copyWithPathReplacement line 1199, install() line 1882)
- Live test suite execution confirming exactly 2 failures in gsd-tools.test.js, 0 failures in all vitest suites
- MD5/SHA hash comparison of source vs deployed binaries
- Phase 26 documentation of GSD_HOME isolation pattern (`26-03-SUMMARY.md`)
- Phase 28 verification confirming wiring tests pass (20/20)

### Secondary (MEDIUM confidence)
- Phase 25-26 summaries documenting known test isolation debt

## Metadata

**Confidence breakdown:**
- Test fix approach: HIGH - exact same pattern already used at line 4128, root cause confirmed via live test output
- Installer deployment: HIGH - installer code traced line-by-line, behavior confirmed via existing install.test.js (73 passing tests)
- File mismatch quantification: HIGH - hash comparison performed, line counts measured, diff output examined
- Pitfalls: HIGH - all based on direct code analysis, no speculation

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable domain, no external dependencies)
