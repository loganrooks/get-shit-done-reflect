# Modular Migration Strategy: Monolith to Modules

**Project:** GSD Reflect v1.18 — Upstream Sync & Deep Integration
**Researched:** 2026-03-10
**Overall confidence:** HIGH (based on direct codebase analysis, not web research)

---

## Executive Summary

The fork's `gsd-tools.js` is a 6,651-line monolith containing 87 command functions and 100+ helpers. Upstream split its portion into `gsd-tools.cjs` (592-line dispatcher) + 11 `lib/*.cjs` modules (~5,421 lines total). The fork added 2,126 lines (25 command functions + 17 helpers) that upstream never had. These fork additions must be redistributed into 5 new modules plus minor extensions to 3 existing modules.

The migration is **structurally clean** because:
1. All fork additions are **additive** — no upstream functions were modified
2. Tests invoke via CLI (`execSync`), not direct `require()` — the internal module structure is invisible to them
3. 9 of 11 upstream modules need zero modification
4. The 5 new modules have clear domain boundaries with minimal cross-dependency

The primary risk is not code restructuring (that is mechanical) but the **.js to .cjs rename** which touches 56 files across agents, workflows, and commands that reference `gsd-tools.js` in shell invocations. This rename is the single most dangerous operation and should be done first, before any functional changes, so failures are attributable to the rename alone.

---

## Part 1: The .js to .cjs Transition

### Why It Matters

Upstream renamed `gsd-tools.js` to `gsd-tools.cjs` to prevent ESM module resolution conflicts. The fork must follow because:
- Future upstream merges will conflict on every file referencing the tool
- The `lib/*.cjs` modules use `require()` which expects CJS context
- Upstream's modular dispatcher (`gsd-tools.cjs`) imports `./lib/*.cjs` via `require()`

### What Changes

**File rename:**
```
get-shit-done/bin/gsd-tools.js  -->  get-shit-done/bin/gsd-tools.cjs
```

**References to update (56 files):**
- 44 files under `get-shit-done/` (workflows, references, templates)
- 10 files under `agents/`
- 2 files under `commands/`
- All contain: `node ~/.claude/get-shit-done/bin/gsd-tools.js` or `node "$HOME/.claude/get-shit-done/bin/gsd-tools.js"`

**Test references to update:**
- `tests/unit/sensors.test.js` line 7: `gsd-tools.js` -> `gsd-tools.cjs`
- `tests/unit/automation.test.js` line 8: `gsd-tools.js` -> `gsd-tools.cjs`
- `tests/unit/install.test.js`: Multiple test assertions about the filename (these test the installer's namespace rewriting, so some should still reference `.js` as test data, others need updating)
- `get-shit-done/bin/gsd-tools.test.js` line 10: points to `gsd-tools.js`
- `get-shit-done/bin/gsd-tools-fork.test.js` line 17: points to `gsd-tools.js`

**Node:test files also need rename:**
```
get-shit-done/bin/gsd-tools.test.js       -->  gsd-tools.test.cjs (or keep .js — see below)
get-shit-done/bin/gsd-tools-fork.test.js  -->  gsd-tools-fork.test.cjs (or keep .js)
```

### The ESM Test Framework Question

**Situation:** Vitest tests (in `tests/`) use ESM imports (`import { describe } from 'vitest'`). Upstream node:test files (in `get-shit-done/bin/`) use CJS require. Both test the same CLI via `execSync`.

**Key insight:** Neither test framework directly imports the gsd-tools modules. Both use subprocess CLI invocation. This means:
- The .cjs extension of the modules is irrelevant to test execution
- Vitest tests can stay .js (ESM) — they only need to update the path string in `GSD_TOOLS`
- Node:test files CAN stay .js even though the tested binary became .cjs, because they also just shell out

**Recommendation:** Keep both vitest and node:test files as `.js`. Only update the path constants that reference the entry point:
```javascript
// Before
const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.js')
// After
const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')
```

### Installer Impact

The installer's `replacePathsInContent()` currently rewrites `gsd-tools.js` path references. After the rename:
- Source files will reference `gsd-tools.cjs`
- The installer's regex patterns need updating to match `.cjs` instead of `.js`
- The namespace-rewriting lookahead `(?!tools)` that preserves `gsd-tools` may need adjustment

**Validation:** The `install.test.js` test "preserves gsd-tools.js via (?!tools) lookahead" will need updating to `.cjs`.

---

## Part 2: Migration Order

### Dependency Graph

```
core.cjs (upstream) <--- All modules depend on output(), error(), loadConfig()
    |
    +--- frontmatter.cjs (upstream) <--- extractFrontmatter, reconstructFrontmatter
    |
    +--- [9 upstream modules: commands, config, init, milestone, phase, roadmap, state, template, verify]
    |
    +--- backlog.cjs (NEW) --- depends on: output, error, generateSlugInternal,
    |                           reconstructFrontmatter, resolveBacklogDir, readBacklogItems,
    |                           regenerateBacklogIndex, getMilestoneInfo
    |
    +--- manifest.cjs (NEW) --- depends on: output, error, loadManifest, loadProjectConfig,
    |                            validateFieldType, validateFieldEnum, coerceValue,
    |                            atomicWriteJson, formatMigrationEntry
    |
    +--- automation.cjs (NEW) --- depends on: output, error, loadProjectConfig,
    |                              FEATURE_CAPABILITY_MAP, atomicWriteJson
    |
    +--- sensors.cjs (NEW) --- depends on: output, error (self-contained)
    |
    +--- health-probe.cjs (NEW) --- depends on: output, error, resolveKBDir,
                                     findLatestRegimeChange, collectRegimeSignals
```

### Helper Placement

Helpers that serve multiple new modules should go in core.cjs. Helpers that serve only one module stay in that module.

| Helper | Used By | Placement |
|--------|---------|-----------|
| `loadManifest()` | manifest.cjs, automation.cjs (for manifest version) | **core.cjs extension** |
| `loadProjectConfig()` | manifest.cjs, automation.cjs | **core.cjs extension** |
| `validateFieldType()` | manifest.cjs only | manifest.cjs internal |
| `validateFieldEnum()` | manifest.cjs only | manifest.cjs internal |
| `coerceValue()` | manifest.cjs only | manifest.cjs internal |
| `atomicWriteJson()` | manifest.cjs, automation.cjs | **core.cjs extension** |
| `formatMigrationEntry()` | manifest.cjs only | manifest.cjs internal |
| `KNOWN_TOP_LEVEL_KEYS` | manifest.cjs only | manifest.cjs internal |
| `FEATURE_CAPABILITY_MAP` | automation.cjs only | automation.cjs internal |
| `resolveBacklogDir()` | backlog.cjs only | backlog.cjs internal |
| `readBacklogItems()` | backlog.cjs only | backlog.cjs internal |
| `regenerateBacklogIndex()` | backlog.cjs only | backlog.cjs internal |
| `resolveKBDir()` | health-probe.cjs only | health-probe.cjs internal |
| `findLatestRegimeChange()` | health-probe.cjs only | health-probe.cjs internal |
| `collectRegimeSignals()` | health-probe.cjs only | health-probe.cjs internal |
| `parseIncludeFlag()` | dispatcher (init cases) | dispatcher-local or core.cjs |

### Recommended 7-Step Migration Order

#### Step 0: The Rename (PREREQUISITE, isolated commit)

**What:** Rename `gsd-tools.js` to `gsd-tools.cjs`. Update all 56+ file references. Update test path constants.

**Why first:** This is a pure rename with zero functional changes. If tests break, the problem is a missed reference, not a logic error. Debugging is trivial (grep for `.js` where `.cjs` was expected).

**Rollback:** `git revert` the single commit. Instant, clean.

**Validation:**
- `npm test` (vitest suite): All 278 tests pass
- `npm run test:upstream` + `npm run test:upstream:fork`: All node:test tests pass
- `grep -r 'gsd-tools\.js' get-shit-done/ agents/ commands/` returns zero hits (except test fixture data)

#### Step 1: Adopt upstream's modular structure skeleton

**What:** Copy upstream's 11 `lib/*.cjs` modules into `get-shit-done/bin/lib/`. Replace the monolith's dispatcher section with upstream's thin dispatcher that `require()`s modules. Keep the fork-specific functions in the monolith temporarily (they will still be defined in the main file, called by the dispatcher's fork-specific case blocks).

**Why second:** This establishes the module boundary pattern before extracting anything. The fork-specific functions still live in the main file but the upstream functions are now in their proper modules.

**Risk:** MEDIUM — the upstream modules may have diverged from the fork's copies of those functions (upstream has had bug fixes, new parameters, etc. in the 244 commits behind).

**Approach:** Do NOT try to reconcile function-level differences at this step. Take upstream's modules wholesale. The fork's monolith had the same upstream functions (just older versions). Taking upstream's current modules is an upgrade.

**Validation:**
- All upstream commands work: `node gsd-tools.cjs state load`, `node gsd-tools.cjs phase next-decimal 1`, etc.
- `npm run test:upstream` passes (these test upstream functions)
- `npm test` passes (fork vitest tests exercise CLI commands)

**Rollback:** Remove `lib/` directory, restore original monolith file.

#### Step 2: Extend core.cjs with shared helpers

**What:** Add `loadManifest()`, `loadProjectConfig()`, `atomicWriteJson()`, and `parseIncludeFlag()` to `core.cjs` exports. These are helpers used by multiple fork modules.

**Why now:** New modules in steps 3-6 need these. Adding them to core before extraction prevents circular dependency issues.

**Risk:** LOW — these are pure additions to exports. No existing exports change.

**Validation:**
- `require('./lib/core.cjs').loadManifest` exists
- `require('./lib/core.cjs').loadProjectConfig` exists
- `require('./lib/core.cjs').atomicWriteJson` exists
- Existing tests still pass (no behavioral change)

**Rollback:** Remove the added functions from core.cjs.

#### Step 3: Extract sensors.cjs (simplest, 0 cross-dependencies)

**What:** Move `cmdSensorsList()` and `cmdSensorsBlindSpots()` into `lib/sensors.cjs`. Add `sensors` case to dispatcher. Remove from monolith.

**Why now:** Simplest module. Only 2 functions. Only depends on `output()` and `error()` from core. Zero dependency on other new modules. Perfect for validating the extraction pattern.

**Risk:** LOW

**Validation:**
- `node gsd-tools.cjs sensors list` works in a project directory
- `node gsd-tools.cjs sensors blind-spots` works
- `npm test` passes (sensors.test.js exercises these via CLI)

**Rollback:** Move functions back, remove lib/sensors.cjs.

#### Step 4: Extract backlog.cjs (self-contained domain)

**What:** Move 7 `cmdBacklog*` functions + 3 helpers (`resolveBacklogDir`, `readBacklogItems`, `regenerateBacklogIndex`) into `lib/backlog.cjs`. Add `backlog` case to dispatcher.

**Dependencies needed from core.cjs:** `output`, `error`, `generateSlugInternal`, `getMilestoneInfo`
**Dependencies needed from frontmatter.cjs:** `reconstructFrontmatter`, `extractFrontmatter`

**Risk:** LOW — self-contained domain. All helpers are backlog-internal.

**Validation:**
- `node gsd-tools.cjs backlog add --title "test"` works
- `node gsd-tools.cjs backlog list` works
- `node gsd-tools.cjs backlog stats` works
- No existing backlog-specific vitest tests (backlog is tested indirectly through CLI invocation in other test suites). Verify with manual CLI smoke test.

**Rollback:** Move functions back, remove lib/backlog.cjs.

#### Step 5: Extract manifest.cjs (config-adjacent)

**What:** Move 6 `cmdManifest*` functions + 5 internal helpers (`validateFieldType`, `validateFieldEnum`, `coerceValue`, `formatMigrationEntry`, `KNOWN_TOP_LEVEL_KEYS`) into `lib/manifest.cjs`. Add `manifest` case to dispatcher.

**Dependencies needed from core.cjs:** `output`, `error`, `loadManifest`, `loadProjectConfig`, `atomicWriteJson` (added in Step 2)

**Risk:** MEDIUM — manifest functions interact with config.json and feature-manifest.json. The migration commands (`apply-migration`, `log-migration`) write files atomically. Ensure `atomicWriteJson` import from core works correctly.

**Validation:**
- `node gsd-tools.cjs manifest diff-config` works in a project with config.json
- `node gsd-tools.cjs manifest validate` works
- `node gsd-tools.cjs manifest auto-detect` works
- `npm test` passes

**Rollback:** Move functions back, remove lib/manifest.cjs.

#### Step 6: Extract automation.cjs (most complex new module)

**What:** Move 7 `cmdAutomation*` functions + `FEATURE_CAPABILITY_MAP` into `lib/automation.cjs`. Add `automation` case to dispatcher.

**Dependencies needed from core.cjs:** `output`, `error`, `loadProjectConfig`, `atomicWriteJson`

**Risk:** MEDIUM — automation is the most feature-rich new module. Lock management, regime tracking, and reflection counters all write to disk. The `FEATURE_CAPABILITY_MAP` constant is only used here but conceptually governs runtime behavior.

**Validation:**
- `node gsd-tools.cjs automation resolve-level signal_collection` works
- `node gsd-tools.cjs automation track-event signal_collection collected` works
- `node gsd-tools.cjs automation reflection-counter get` works
- `npm test` passes (automation.test.js has 994 LOC of vitest tests)

**Rollback:** Move functions back, remove lib/automation.cjs.

#### Step 7: Extract health-probe.cjs (last, depends on KB helpers)

**What:** Move 3 `cmdHealthProbe*` functions + 3 internal helpers (`resolveKBDir`, `findLatestRegimeChange`, `collectRegimeSignals`) into `lib/health-probe.cjs`. Add `health-probe` case to dispatcher.

**Dependencies needed from core.cjs:** `output`, `error`
**Internal helpers:** All 3 helpers stay inside health-probe.cjs (not shared).

**Risk:** MEDIUM — KB directory resolution and signal parsing have path-sensitivity. The `resolveKBDir()` function checks `.planning/knowledge/` then `~/.gsd/knowledge/` with `GSD_HOME` override.

**Validation:**
- `node gsd-tools.cjs health-probe signal-metrics` works in a project with KB entries
- `node gsd-tools.cjs health-probe signal-density` works
- `node gsd-tools.cjs health-probe automation-watchdog` works
- `npm test` passes

**Rollback:** Move functions back, remove lib/health-probe.cjs.

### Step 8: Extend frontmatter.cjs and init.cjs (minor modifications)

**What:**
- Add `signal` schema to `FRONTMATTER_SCHEMAS` in `frontmatter.cjs`
- Update `cmdInitExecutePhase` and `cmdInitPlanPhase` in `init.cjs` to accept `--include` flag (fork's `parseIncludeFlag` integration)
- Update `cmdInitProgress` in `init.cjs` for fork's extended progress output

**Risk:** LOW — these are the smallest changes, well-bounded.

**Validation:**
- `node gsd-tools.cjs frontmatter validate somefile.md --schema signal` works
- `node gsd-tools.cjs init execute-phase 1 --include backlog,health` works
- `npm test` and `npm run test:upstream` both pass

---

## Part 3: Test Strategy During Transition

### Critical Insight: CLI-Level Testing Insulates from Refactoring

All fork tests (both vitest and node:test) invoke `gsd-tools.cjs` as a subprocess via `execSync`. They never `require()` the modules directly. This means:

1. **Module extraction is invisible to fork tests** — as long as the CLI behavior is identical, tests pass regardless of internal structure.
2. **Upstream's node:test suite tests module internals** — these tests DO `require()` from `lib/*.cjs` directly. They verify the modular structure is correct.
3. **Both test suites can run in parallel throughout migration** without interference.

### Test Execution Matrix

| Migration Step | `npm test` (vitest) | `npm run test:upstream` | `npm run test:upstream:fork` |
|---------------|---------------------|------------------------|------------------------------|
| Step 0 (rename) | Must pass | Must pass | Must pass |
| Step 1 (adopt modules) | Must pass | Must pass (tests match modules) | Must pass |
| Step 2 (core.cjs ext) | Must pass | Must pass | Must pass |
| Steps 3-7 (extract) | Must pass at each step | Must pass | Must pass |
| Step 8 (extend) | Must pass | Must pass | Must pass |

### Handling the Dual Test Frameworks

**Vitest (fork tests):** ESM `.test.js` files in `tests/`. Run with `npm test`. Test fork-specific features via CLI invocation. Keep as-is.

**Node:test (upstream-ported tests):** CJS `.test.js` files in `get-shit-done/bin/`. Run with `npm run test:upstream` and `npm run test:upstream:fork`. Test upstream functions via CLI invocation. Keep as-is.

**Upstream's actual module tests:** CJS `.test.cjs` files in upstream's `tests/`. These test module exports directly via `require()`. We should adopt these as part of Step 1 (they come with the modules). Run with a new npm script: `npm run test:modules`.

**Recommended new test scripts in package.json:**
```json
{
  "test:modules": "node scripts/run-tests.cjs",
  "test:all": "npm test && npm run test:modules && npm run test:upstream:fork"
}
```

### Test Coverage During Extraction

When extracting a module (Steps 3-7), verify coverage by running tests after each extraction:

1. **Behavioral tests (vitest):** `npm test` -- ensures CLI-level behavior unchanged
2. **Module tests (node:test):** `npm run test:modules` -- ensures module exports correct
3. **Fork extension tests:** `npm run test:upstream:fork` -- ensures fork-specific CLI still works

**If any test fails after extraction:** The function was not correctly moved. The fix is always mechanical — missing `require()`, missing export, wrong path. Never a logic issue.

### New Tests to Write

For each new module extracted, add a corresponding `tests/<module>.test.cjs` file following upstream's pattern:

| New Module | New Test File | What to Test |
|-----------|--------------|-------------|
| sensors.cjs | tests/sensors.test.cjs | Sensor discovery, blind spot analysis |
| backlog.cjs | tests/backlog.test.cjs | CRUD operations, index regeneration |
| manifest.cjs | tests/manifest.test.cjs | Config diffing, validation, migration |
| automation.cjs | tests/automation.test.cjs | Level resolution, locking, regime tracking |
| health-probe.cjs | tests/health-probe.test.cjs | Signal metrics, density, watchdog |

These should use `require('../get-shit-done/bin/lib/<module>.cjs')` to test exports directly, matching upstream's testing pattern. This provides unit-level coverage in addition to the CLI-level vitest tests.

---

## Part 4: Risk Mitigation

### Per-Step Rollback Strategy

Every step produces a single commit. Rollback is always `git revert <commit>`.

| Step | Commit Scope | Rollback Impact |
|------|-------------|-----------------|
| 0 (rename) | File rename + 56 ref updates | Clean revert, restores .js |
| 1 (adopt modules) | Add lib/ dir, rewrite dispatcher | Revert removes lib/, restores monolith dispatch |
| 2 (core ext) | Add functions to core.cjs | Revert removes added exports |
| 3-7 (extract) | Create lib/X.cjs, update dispatcher, remove from monolith | Revert restores functions to monolith |
| 8 (extend) | Modify frontmatter.cjs, init.cjs | Revert removes schema/flag additions |

### Key Risks and Mitigations

#### Risk 1: Upstream function drift
**What:** The fork's copies of upstream functions (e.g., `cmdStateLoad`, `cmdPhaseComplete`) may differ from upstream's current module versions due to 244 commits of bug fixes.
**Mitigation:** Step 1 takes upstream's modules wholesale. This is intentional — it's an upgrade. Run all test suites to catch any behavioral differences. If a fork test fails because upstream changed behavior, that's a bug we should fix (or the test should be updated).

#### Risk 2: Missing `require()` paths
**What:** Extracted module forgets to import a helper from core.cjs.
**Mitigation:** Each extraction step has a validation checklist. A missing require manifests as a clear `ReferenceError` on first invocation.

#### Risk 3: Installer's path rewriting
**What:** The installer's `replacePathsInContent()` regex may not handle the `.cjs` extension correctly.
**Mitigation:** Step 0 (rename) explicitly validates installer tests. The `install.test.js` file has 1,954 LOC of path-replacement tests that will catch issues.

#### Risk 4: Init function signature differences
**What:** Fork's `cmdInitExecutePhase(cwd, phase, includes, raw)` has an extra `includes` parameter vs upstream's `cmdInitExecutePhase(cwd, phase, raw)`.
**Mitigation:** Step 8 modifies init.cjs specifically to accommodate fork's `--include` flag. This is a known, documented divergence. The dispatcher passes `includes` as needed.

#### Risk 5: Circular dependencies
**What:** Module A requires Module B which requires Module A.
**Mitigation:** The dependency graph (Part 2) is acyclic by design. New modules only depend on core.cjs and frontmatter.cjs (both upstream). No new module depends on another new module. Verify with `node -e "require('./lib/X.cjs')"` after each extraction.

---

## Part 5: The Monolith-to-Modules Transition Plan

### Before: Fork's monolith (6,651 lines)
```
gsd-tools.js
  |-- shared helpers (lines 146-612)
  |-- upstream command functions (lines 613-3776)
  |-- fork: backlog functions (lines 3778-4107)
  |-- fork: init overrides (lines 4109-4777)
  |-- fork: manifest functions (lines 4778-5112)
  |-- fork: automation functions (lines 5113-5495)
  |-- fork: health-probe helpers (lines 5496-5625)
  |-- fork: health-probe commands (lines 5627-5970)
  |-- fork: sensors functions (lines 5971-6102)
  |-- CLI router (lines 6103-6651)
```

### After: Modular structure
```
gsd-tools.cjs (dispatcher only, ~700 lines)
lib/
  |-- core.cjs (upstream + 4 fork helpers)
  |-- frontmatter.cjs (upstream + signal schema)
  |-- init.cjs (upstream + --include flag)
  |-- commands.cjs (upstream, unchanged)
  |-- config.cjs (upstream, unchanged)
  |-- milestone.cjs (upstream, unchanged)
  |-- phase.cjs (upstream, unchanged)
  |-- roadmap.cjs (upstream, unchanged)
  |-- state.cjs (upstream, unchanged)
  |-- template.cjs (upstream, unchanged)
  |-- verify.cjs (upstream, unchanged)
  |-- backlog.cjs (NEW, ~330 lines)
  |-- manifest.cjs (NEW, ~340 lines)
  |-- automation.cjs (NEW, ~390 lines)
  |-- sensors.cjs (NEW, ~135 lines)
  |-- health-probe.cjs (NEW, ~350 lines)
```

**Total new modules:** 5
**Total modified upstream modules:** 3 (core, frontmatter, init)
**Total unchanged upstream modules:** 8

---

## Part 6: Incremental vs Big-Bang

### Verdict: Incremental (one module at a time)

**Why not big-bang:**
- A single commit changing 6,651 lines is unreviewable
- If tests fail, the failure could be in any of 16 modules
- Rollback means losing all progress
- Bisecting regressions across 25 functions is painful

**Why incremental works:**
- Each step is a self-contained commit (50-400 lines changed)
- Tests validate after each step
- Failures are isolated to the last extraction
- Rollback costs one `git revert`, not rebuilding everything
- PR review is tractable (8 small commits vs 1 massive commit)

**Estimated timeline:**
- Step 0 (rename): 1-2 hours
- Step 1 (adopt modules): 2-3 hours
- Step 2 (core ext): 30 minutes
- Steps 3-7 (5 extractions): 2-3 hours each = 10-15 hours total
- Step 8 (extend): 1-2 hours
- **Total: 15-23 hours** (consistent with audit's 16-22 hour estimate)

---

## Part 7: Verification Checklist (post-migration)

After all 8 steps are complete:

- [ ] `npm test` passes (all 278 vitest tests)
- [ ] `npm run test:upstream` passes (upstream node:test suite)
- [ ] `npm run test:upstream:fork` passes (fork extension tests)
- [ ] `npm run test:modules` passes (new module-level tests)
- [ ] `grep -r 'gsd-tools\.js' get-shit-done/ agents/ commands/` returns zero (all references updated to .cjs)
- [ ] `node -e "require('./get-shit-done/bin/lib/backlog.cjs')"` succeeds (each new module loads)
- [ ] `node -e "require('./get-shit-done/bin/lib/manifest.cjs')"` succeeds
- [ ] `node -e "require('./get-shit-done/bin/lib/automation.cjs')"` succeeds
- [ ] `node -e "require('./get-shit-done/bin/lib/sensors.cjs')"` succeeds
- [ ] `node -e "require('./get-shit-done/bin/lib/health-probe.cjs')"` succeeds
- [ ] `node bin/install.js --local` succeeds (installer handles new module structure)
- [ ] Installed `.claude/get-shit-done/bin/lib/` contains all 16 modules
- [ ] No circular dependencies: `node -e "const m = require('./get-shit-done/bin/gsd-tools.cjs')"` exits cleanly
- [ ] `wc -l get-shit-done/bin/gsd-tools.cjs` is ~700 lines (dispatcher only)

---

## Part 8: Open Questions for Phase-Specific Research

1. **Upstream function drift magnitude:** How many of the fork's copies of upstream functions have behavioral differences from current upstream? This determines whether Step 1 is a drop-in or needs reconciliation. The audit says "upstream had bug fixes" but doesn't enumerate which fork functions are affected.

2. **Init function signatures:** The fork's `cmdInitExecutePhase` and `cmdInitPlanPhase` have an extra `includes` parameter. How does this interact with upstream's current signatures? Is upstream's init.cjs compatible with the fork's extended calling convention, or does it need a wrapper?

3. **Installer's `files` array:** The `package.json` `files` field includes `get-shit-done` directory. Does npm packaging correctly include `get-shit-done/bin/lib/` subdirectories? (Likely yes since it includes the whole directory, but worth verifying.)

4. **Upstream test adoption scope:** Should we adopt all 12 upstream `.test.cjs` files, or only the ones corresponding to the 3 modules we modify? Adopting all provides broader coverage but increases the test maintenance surface.

---

## Sources

All findings derived from direct codebase analysis:
- Fork monolith: `get-shit-done/bin/gsd-tools.js` (6,651 lines)
- Upstream modular structure: `git show upstream/main:get-shit-done/bin/lib/` (11 modules)
- Upstream dispatcher: `git show upstream/main:get-shit-done/bin/gsd-tools.cjs` (592 lines)
- Fork audit reports: `.planning/fork-audit/07-module-mapping.md`, `06-tests-build.md`, `00-SYNTHESIS.md`
- Test files: `tests/unit/*.test.js`, `get-shit-done/bin/*.test.js`
- Upstream test files: `git ls-tree upstream/main -- tests/*.test.cjs` (12 files)
- Package config: `package.json`, `vitest.config.js`

**Confidence: HIGH** — all claims verified against actual code, not documentation or web search.
