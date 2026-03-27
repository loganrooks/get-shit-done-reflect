# Phase 50: Migration Test Hardening - Research

**Researched:** 2026-03-26
**Domain:** Testing: config migration, installer namespace rewriting, KB migration, project-root authority, CLI module equivalence
**Confidence:** HIGH

## Summary

Phase 50 is a test-hardening phase that adds coverage for nine specific requirement areas (TST-01 through TST-09). The existing codebase already has substantial test infrastructure: 183 tests in `gsd-tools.test.js` (node:test), 10 in `gsd-tools-fork.test.js`, and 350 in vitest (`tests/`). Phase 49 landed 9 migration-specific tests including idempotency for rename migrations and a full v1.14-to-v1.18 upgrade scenario. The vitest suite (`tests/unit/install.test.js`) already has 196 tests covering namespace rewriting, KB migration, and installer behavior.

The primary gap is not infrastructure but coverage breadth. Existing idempotency tests verify 2-run convergence but not N-run stability. Crash-recovery for KB migration is untested. Namespace scanning is tested at the unit level (replacePathsInContent) and at the installed-output level, but there is no full-corpus scan covering all installed file categories. The `coerceValue` function has edge cases (null, undefined, empty string, NaN-producing strings) that lack tests. The `findProjectRoot` function from upstream (C2 partial per the drift ledger) does not exist in the fork and needs adoption plus testing. Module behavioral equivalence (TST-06) is a gap since the Phase 48 extraction left the router as a pure dispatcher without output-comparison tests against the pre-extraction monolith.

**Primary recommendation:** Build tests against the existing vitest + node:test infrastructure. Use `tmpdirTest` fixtures for filesystem-dependent tests. The node:test tests in `gsd-tools.test.js` handle CLI-level integration; vitest in `tests/` handles unit and integration. Follow both patterns.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vitest | (project) | Test runner for `tests/` directory | Already used for 350 tests; provides `describe`/`it`/`expect` |
| node:test | (builtin) | Test runner for `gsd-tools.test.js` / `gsd-tools-fork.test.js` | Already used for 193 tests; upstream convention |
| node:assert | (builtin) | Assertions in node:test suites | Paired with node:test per upstream pattern |
| node:fs | (builtin) | Filesystem operations for test fixtures | All test setup uses sync/async fs |
| node:child_process | (builtin) | CLI subprocess execution | `runGsdTools()` helper pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `tests/helpers/tmpdir.js` | (project) | `tmpdirTest` fixture for isolated temp dirs | All filesystem-modifying tests in vitest |
| `tests/helpers/setup.js` | (project) | vitest setup file | Auto-loaded by vitest config |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:test for new CLI tests | vitest | node:test is upstream convention for gsd-tools.test.js; stick with it for that file |
| Manual temp dirs | tmpdirTest | tmpdirTest handles cleanup automatically; use it for vitest tests |

**Installation:** No new dependencies required. All tests use existing project infrastructure.

## Architecture Patterns

### Test File Placement
```
get-shit-done/bin/
  gsd-tools.test.js           # CLI-level integration tests (node:test)
  gsd-tools-fork.test.js      # Fork-specific CLI tests (node:test)
tests/
  unit/
    install.test.js            # Installer unit tests (vitest, 196 existing)
  integration/
    wiring-validation.test.js  # @-ref and namespace wiring (vitest)
    kb-infrastructure.test.js  # KB scripts and migration (vitest, 28 existing)
    cross-runtime-kb.test.js   # Cross-runtime KB access (vitest, 10 existing)
  helpers/
    tmpdir.js                  # tmpdirTest fixture
    setup.js                   # vitest setup
```

### Pattern 1: CLI-Level Migration Testing (node:test in gsd-tools.test.js)
**What:** Tests that exercise `manifest apply-migration` via subprocess, verifying config file output.
**When to use:** TST-02 (idempotency), TST-04 (edge-case filenames/nested dirs), TST-07 (type coercion edge cases).
**Example:**
```javascript
// Source: get-shit-done/bin/gsd-tools.test.js lines 2849-2869
test('is idempotent: second run produces zero changes', () => {
  createManifestTestEnv(tmpDir, healthCheckFeature(),
    { mode: 'yolo', depth: 'comprehensive', manifest_version: 1 },
    2, [renameMigration()]);

  // First run: produces changes
  const result1 = runGsdTools('manifest apply-migration --raw', tmpDir);
  assert.ok(result1.success);
  const output1 = JSON.parse(result1.output);
  assert.ok(output1.total_changes > 0);

  // Second run: should produce zero changes
  const result2 = runGsdTools('manifest apply-migration --raw', tmpDir);
  const output2 = JSON.parse(result2.output);
  assert.strictEqual(output2.total_changes, 0);
});
```

### Pattern 2: Installer Unit Testing (vitest in tests/unit/install.test.js)
**What:** Direct function import + `tmpdirTest` for namespace rewriting, KB migration, path replacement.
**When to use:** TST-01 (namespace scan), TST-05 (crash recovery), TST-09 (snapshot regression).
**Example:**
```javascript
// Source: tests/unit/install.test.js lines 268-290
describe('gsdr namespace rewriting', () => {
  describe('correct rewrites', () => {
    it('rewrites get-shit-done/ to get-shit-done-reflect/ in paths', () => {
      const input = 'Read ./.claude/get-shit-done/workflows/signal.md'
      const result = replacePathsInContent(input, './.claude/')
      expect(result).toContain('get-shit-done-reflect/workflows/signal.md')
    })
  })
})
```

### Pattern 3: Full Installer Integration (vitest with subprocess)
**What:** Runs `node bin/install.js --claude --global` in isolated tmpdir, then verifies output files.
**When to use:** TST-01 (full-corpus namespace scan), TST-03 (installer re-run idempotency), TST-08 (integration depth).
**Example:**
```javascript
// Source: tests/unit/install.test.js lines 2479-2516
tmpdirTest('installed workflows use /gsdr: commands', async ({ tmpdir }) => {
  execSync(`node "${installScript}" --claude --global`, {
    env: { ...process.env, HOME: tmpdir },
    cwd: tmpdir, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000
  })
  const workflowsDir = path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'workflows')
  const files = fsSync.readdirSync(workflowsDir).filter(f => f.endsWith('.md'))
  for (const file of files) {
    const content = fsSync.readFileSync(path.join(workflowsDir, file), 'utf8')
    const staleCommands = content.match(/\/gsd:/g)
    expect(staleCommands, `${file} has stale /gsd: refs`).toBeNull()
  }
})
```

### Pattern 4: Test Environment Helper (existing)
**What:** `createManifestTestEnv()` creates temp project with manifest + config for CLI migration tests.
**When to use:** Any test needing a fake project with manifest and config.
**Example:**
```javascript
// Source: gsd-tools.test.js line 2046
function createManifestTestEnv(tmpDir, manifestFeatures, configObj, manifestVersion = 1, migrations = []) {
  // Creates .claude/get-shit-done/feature-manifest.json and .planning/config.json
}
```

### Anti-Patterns to Avoid
- **Testing against the real project directory:** Always use tmpdirTest or createTempProject(). Tests must be isolated.
- **Importing from `.claude/` paths:** Import from npm source (`bin/install.js`, `get-shit-done/bin/lib/*.cjs`), never from installed copies.
- **Modifying HOME without restoring:** The `withMockHome()` helper in install.test.js exists for this; use it or tmpdirTest for HOME isolation.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Temp directory management | Manual mkdtemp + cleanup | `tmpdirTest` from `tests/helpers/tmpdir.js` | Automatic cleanup, vitest integration |
| CLI subprocess testing | Custom exec wrapper | `runGsdTools()` in gsd-tools.test.js | Already handles success/failure, output parsing |
| Manifest test environment | Ad-hoc file creation | `createManifestTestEnv()` in gsd-tools.test.js | Sets up manifest + config consistently |
| Snapshot testing | Custom diff logic | vitest `toMatchSnapshot()` / `toMatchInlineSnapshot()` | Built-in to vitest, handles updates |
| HOME directory mocking | process.env.HOME = x | `withMockHome()` or tmpdirTest with env override | Ensures restoration after test |

**Key insight:** The project already has robust test helpers for both frameworks. Phase 50 tests should reuse these patterns, not reinvent them.

## Common Pitfalls

### Pitfall 1: Idempotency Tests That Only Verify Two Runs
**What goes wrong:** Testing `run(); run(); assert(no changes)` catches basic idempotency but misses state accumulation bugs that only manifest on run 3+.
**Why it happens:** The assumption that if run 2 = run 1, then run N = run 1. This fails if each run accumulates metadata (timestamps, version counters, log entries).
**How to avoid:** Test with N >= 3 runs. Verify the config file is byte-identical between run 2 and run 3.
**Warning signs:** Migration log growing on every run; manifest_version incrementing past expected value.

### Pitfall 2: KB Migration Crash Tests That Don't Verify Atomicity
**What goes wrong:** Testing that "crash leaves no partial state" by checking directory existence, but not verifying that partial files or symlinks were also cleaned up.
**Why it happens:** migrateKB() has multiple steps: mkdir, cpSync, renameSync, symlinkSync. Each can fail independently.
**How to avoid:** Inject failures at each step (mock fs operations to throw). Verify both: no partial destination AND original source preserved.
**Warning signs:** Dangling symlinks, backup directories without index files.

### Pitfall 3: Namespace Scan False Negatives From Incomplete File Coverage
**What goes wrong:** Scanning only `.md` files misses namespace references in `.cjs`, `.js`, `.json`, `.sh`, `.toml` files.
**Why it happens:** The existing tests scan agents (`.md`), workflows (`.md`), but not all installed file types.
**How to avoid:** Full-corpus scan must iterate ALL files under the installed directory, not just `.md`. Filter appropriately for each file type.
**Warning signs:** CI wiring tests passing but installed Codex/Gemini configs having stale references.

### Pitfall 4: Module Equivalence Tests That Compare Object Shape, Not CLI Output
**What goes wrong:** Verifying that `require('./lib/manifest.cjs')` exports the right functions, but not that `node gsd-tools.cjs manifest apply-migration` produces the same output as the pre-extraction version.
**Why it happens:** Unit tests naturally test function imports; CLI-level tests are slower and harder to set up.
**How to avoid:** For TST-06, capture actual CLI stdout for representative commands and compare. The existing `runGsdTools()` helper makes this straightforward.
**Warning signs:** Module exports change in a way that the router silently swallows (e.g., different error format).

### Pitfall 5: Path Resolution Tests Without Subdirectory Context
**What goes wrong:** Testing `resolveWorktreeRoot` from repo root works, but testing from a subdirectory like `get-shit-done/bin/` does not.
**Why it happens:** The cwd is always the repo root in test setup. Nobody creates tests that cd into subdirectories.
**How to avoid:** For TST-06 (project-root authority), explicitly test with `--cwd` pointing to subdirectories of a test project.
**Warning signs:** Signal [sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift] reported that KB resolution from subdirectories falls back to global.

## Code Examples

### N-Run Idempotency Test Pattern
```javascript
// For gsd-tools.test.js (node:test)
test('apply-migration is idempotent over N=5 runs', () => {
  createManifestTestEnv(tmpDir, healthCheckFeature(),
    { mode: 'yolo', depth: 'comprehensive', manifest_version: 1 },
    2, [renameMigration()]);

  // First run: applies migration
  const result1 = runGsdTools('manifest apply-migration --raw', tmpDir);
  assert.ok(result1.success);
  const output1 = JSON.parse(result1.output);
  assert.ok(output1.total_changes > 0);

  // Capture config after first migration
  const configAfterFirst = fs.readFileSync(
    path.join(tmpDir, '.planning', 'config.json'), 'utf-8');

  // Runs 2-5: should all produce zero changes and identical config
  for (let i = 2; i <= 5; i++) {
    const result = runGsdTools('manifest apply-migration --raw', tmpDir);
    assert.ok(result.success, `Run ${i} failed`);
    const output = JSON.parse(result.output);
    assert.strictEqual(output.total_changes, 0, `Run ${i} should have zero changes`);

    const currentConfig = fs.readFileSync(
      path.join(tmpDir, '.planning', 'config.json'), 'utf-8');
    assert.strictEqual(currentConfig, configAfterFirst,
      `Config after run ${i} should be byte-identical to run 1 result`);
  }
});
```

### Full-Corpus Namespace Scan Pattern
```javascript
// For tests/unit/install.test.js (vitest)
tmpdirTest('TST-01: full-corpus scan finds zero stale namespace references', async ({ tmpdir }) => {
  execSync(`node "${installScript}" --claude --global`, {
    env: { ...process.env, HOME: tmpdir },
    cwd: tmpdir, stdio: ['pipe', 'pipe', 'pipe'], timeout: 15000
  })

  const claudeDir = path.join(tmpdir, '.claude')
  const staleRefs = []

  function scanDir(dir) {
    for (const entry of fsSync.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        scanDir(full)
      } else if (entry.isFile()) {
        const content = fsSync.readFileSync(full, 'utf8')
        // Stale gsd- prefix (exclude gsd-tools which is correct)
        const staleGsd = content.match(/\bgsd-(?!tools)(?!reflect)\w+/g)
        // Stale /gsd: command prefix
        const staleCmd = content.match(/\/gsd:/g)
        // Stale get-shit-done/ directory path
        const staleDir = content.match(/get-shit-done\/(?!reflect)/g)

        if (staleGsd) staleRefs.push({ file: full, type: 'gsd-prefix', matches: staleGsd })
        if (staleCmd) staleRefs.push({ file: full, type: '/gsd:cmd', matches: staleCmd })
        if (staleDir) staleRefs.push({ file: full, type: 'get-shit-done/', matches: staleDir })
      }
    }
  }

  scanDir(claudeDir)
  expect(staleRefs, JSON.stringify(staleRefs, null, 2)).toEqual([])
})
```

### Crash Recovery Test Pattern
```javascript
// For tests/integration/kb-infrastructure.test.js (vitest)
tmpdirTest('TST-05: interrupted KB migration leaves no partial state', async ({ tmpdir }) => {
  // Set up old KB with known content
  const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
  fsSync.mkdirSync(path.join(oldKBDir, 'signals'), { recursive: true })
  fsSync.writeFileSync(path.join(oldKBDir, 'signals', 'sig-001.md'), 'signal 1')

  // Mock cpSync to throw mid-migration (simulating crash)
  const origCpSync = fsSync.cpSync
  let cpSyncCalled = false
  fsSync.cpSync = (...args) => {
    cpSyncCalled = true
    throw new Error('Simulated disk failure')
  }

  try {
    const gsdHome = path.join(tmpdir, '.gsd')
    // migrateKB should handle the error gracefully
    migrateKB(gsdHome, ['claude'])
  } finally {
    fsSync.cpSync = origCpSync
  }

  // Original data must still exist
  expect(fsSync.existsSync(path.join(oldKBDir, 'signals', 'sig-001.md'))).toBe(true)
  // No dangling symlink at old path
  let isSymlink = false
  try { isSymlink = fsSync.lstatSync(oldKBDir).isSymbolicLink() } catch {}
  expect(isSymlink).toBe(false)
})
```

### Type Coercion Edge Case Pattern
```javascript
// For gsd-tools.test.js (node:test)
test('coerceValue handles null input without crashing (TST-07)', () => {
  createManifestTestEnv(tmpDir, healthCheckFeature(), {
    manifest_version: 1,
    health_check: {
      frequency: 'milestone-only',
      stale_threshold_days: null,  // null instead of number
      blocking_checks: false,
    },
  });

  const result = runGsdTools('manifest apply-migration --raw', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);
  // null should not crash coerceValue; field gets default on next missing-field pass
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic gsd-tools.cjs (~5400 lines) | Pure router + 16 lib/*.cjs modules | Phase 45-48 (2026-03) | Module equivalence must be tested |
| Inline depth-to-granularity migration in loadConfig | Declarative migrations[] array in manifest | Phase 49 (2026-03) | Migration testing now uses manifest-driven approach |
| Global KB at ~/.claude/gsd-knowledge/ | Global KB at ~/.gsd/knowledge/ with project-local fallback | v1.14+ | KB migration has known data-loss history (sig-2026-02-11-kb-data-loss-migration-gap) |
| No namespace rewriting | 4-pass namespace rewriting in replacePathsInContent | v1.17+ | False positives are a real concern (gsd-tools must not become gsdr-tools) |

**Deprecated/outdated:**
- `depth` config key: Renamed to `granularity` via manifest migration. Tests must verify the rename still works.
- `~/.claude/gsd-knowledge/`: Old KB path. Migration creates a symlink from old to new. Tests must verify symlink behavior.

## Open Questions

### Resolved
- **Where do new tests go?** CLI-level migration tests go in `gsd-tools.test.js` (node:test); installer/namespace tests go in `tests/unit/install.test.js` (vitest); KB tests go in `tests/integration/kb-infrastructure.test.js` (vitest).
- **Does findProjectRoot exist in the fork?** No. It is an upstream function that needs adoption (C2 partial from drift ledger). The fork uses `resolveWorktreeRoot` for worktree resolution and direct `cwd` passthrough otherwise.
- **What is the existing idempotency coverage?** Phase 49 added two idempotency tests (2-run) for rename migrations and the full v1.14-to-v1.18 upgrade. N>2 runs are untested.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Should `findProjectRoot` be adopted from upstream for C2 partial? | Medium | Yes, adopt it with the early-return fix (commit c16b874). Test it from subdirectories. This is the routed C2 work. |
| How to simulate crash in migrateKB deterministically? | Medium | Use function-level mocking (replace `fsSync.cpSync` temporarily). The `safeFs` wrapper provides a natural injection point. |
| What constitutes the "pre-extraction monolith" output for TST-06? | Low | Accept-risk. Since the monolith no longer exists, test that the router produces valid JSON output for each command category. True behavioral equivalence to pre-extraction is not feasible retroactively. |

### Still Open
- The deliberation on cross-runtime authority (command-level authority layer, Option A) is still open/pending. Phase 50 should test the authority behavior that EXISTS, not hypothetical future architecture. The success criterion about subdirectory KB/install authority can be tested with the current `resolveWorktreeRoot` + `loadConfig(cwd)` behavior.

## Sources

### Primary (HIGH confidence)
- `get-shit-done/bin/gsd-tools.test.js` -- 183 passing tests, existing migration test patterns
- `tests/unit/install.test.js` -- 196 passing tests, namespace rewriting coverage
- `tests/integration/kb-infrastructure.test.js` -- 28 passing tests, KB migration coverage
- `get-shit-done/bin/lib/manifest.cjs` -- `cmdManifestApplyMigration`, `coerceValue` implementation
- `get-shit-done/bin/lib/core.cjs` -- `resolveWorktreeRoot`, `loadConfig`, `planningPaths` implementation
- `bin/install.js` -- `replacePathsInContent`, `migrateKB`, `createProjectLocalKB` implementation
- `get-shit-done/feature-manifest.json` -- manifest_version 2, 1 migration (depth->granularity)
- `.planning/phases/48.1-post-audit-upstream-drift-retriage-and-roadmap-reconciliation/UPSTREAM-DRIFT-LEDGER.md` -- C2 partial routing to Phase 50
- Upstream commit `c16b874` -- `findProjectRoot` early-return fix

### Secondary (MEDIUM confidence)
- `.planning/deliberations/cross-runtime-upgrade-install-and-kb-authority.md` -- Open deliberation on authority model
- `sig-2026-02-11-kb-data-loss-migration-gap` -- KB data loss history informing crash-recovery requirements
- `sig-2026-03-19-qt31-source-namespace-pollution` -- Namespace pollution incident informing scan tests
- `sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift` -- Subdirectory KB resolution issue

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-11-kb-data-loss-migration-gap | signal | KB data lost when migrateKB() never ran; only-in-installer migration is fragile | Pitfall 2, TST-05 crash recovery rationale |
| sig-2026-02-11-local-install-global-kb-model | signal | Local install breaks path assumptions; subdirectory resolution falls back to global | Pattern 5, TST-06 project-root authority |
| sig-2026-03-19-qt31-source-namespace-pollution | signal | Source namespace pollution broke CI wiring test; installed-vs-source prefix confusion | Pitfall 3, TST-01 full-corpus scan design |
| sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift | signal | KB resolution from subdirectories falls back to global instead of project-local | Pitfall 5, TST-06 subdirectory authority |
| SIG-260222-002-coerce-value-no-number-to-boolean | signal | coerceValue lacks number-to-boolean path | TST-07 type coercion edge cases |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All tools are already in the project; no new dependencies needed
- Architecture: HIGH -- Test placement and patterns are well-established across 550+ existing tests
- Pitfalls: HIGH -- Based on real incidents documented in knowledge base signals
- C2 partial (findProjectRoot): MEDIUM -- Upstream code is clear, but fork adoption path needs explicit verification during implementation

**Research date:** 2026-03-26
**Valid until:** 2026-04-25 (stable domain; only changes with new upstream drift)
