# Phase 55: Upstream Mini-Sync - Research

**Researched:** 2026-04-08
**Domain:** Git-based upstream merge -- correctness fix adoption into a maintained fork
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Sync scope:** Areas 1 (atomic writes/locking), 2 (milestone safety), 4 (installer reliability), and Area 18 (frontmatter quoted-comma fix) from the drift survey
- **Out of scope:** All new feature clusters (Areas 5-14), security module (Area 17), discuss-phase enhancements (Area 15)
- **Upstream reference version:** v1.34.2 (commit `f7549d43`, 2026-04-07) -- NOTE: upstream has moved to `295a5726` since the drift survey; the sync MUST target the frozen baseline, not HEAD
- **Integration strategy per module:**
  - Pure upstream modules (state.cjs, milestone.cjs, template.cjs, verify.cjs): Wholesale replace
  - Mostly upstream modules (phase.cjs, roadmap.cjs): Replace then re-apply fork adjustments
  - Hybrid modules (core.cjs, config.cjs, frontmatter.cjs): Manual merge
  - Installer (bin/install.js): MEDIUM-risk hybrid merge
  - Non-module files (complete-milestone.md): Adopt directly where fork has no modifications
- **Commit strategy:** One commit per merge category for traceability
- **Test validation:** All three suites must pass: vitest (443), upstream node:test (191), fork node:test (18)

### Claude's Discretion
- Exact merge ordering within each commit
- Whether to use `git checkout upstream/main -- <file>` for pure modules or manual copy
- Conflict resolution approach for hybrid modules (diff3 vs manual)

### Deferred Ideas (OUT OF SCOPE)
- All new upstream features (Areas 5-14)
- Security module (Area 17)
- Discuss-phase enhancements (Area 15 -- covered by GATE-08)
</user_constraints>

## Summary

This phase integrates upstream correctness fixes from v1.34.2 into the fork before any v1.20 feature work begins. The merge surface spans 4 pure/mostly-upstream modules (trivial wholesale replace), 3 hybrid modules (manual merge required), the installer (medium-risk hybrid), and 1 workflow file. The critical complication discovered during research is that upstream refactored `MODEL_PROFILES` out of `core.cjs` into a new `model-profiles.cjs` module -- both `core.cjs` and `config.cjs` now import from it. This creates a mandatory dependency: adopting the core.cjs and config.cjs fixes requires also adopting `model-profiles.cjs` as a new module.

The fork's existing `atomicWriteJson` (same-directory tmp rename pattern documented in signal SIG-260222-003) is superseded by upstream's more robust `atomicWriteFileSync` which adds PID-scoped tmp filenames and fallback-to-direct-write on rename failure. The fork's `atomicWriteJson` should be refactored to delegate to `atomicWriteFileSync` internally, preserving backward compatibility for the 2 call sites (manifest.cjs, core.cjs export).

Research resolved all 5 open questions from CONTEXT.md. Area 3 performance fixes should be bundled (they touch already-in-scope files and are low-risk). Upstream has 26 new test files relevant to the sync scope. Fork-only modules do NOT call state-write functions, so the locking overhaul has no fork-module impact.

**Primary recommendation:** Execute in strict dependency order: (1) adopt model-profiles.cjs, (2) pure upstream modules, (3) hybrid modules with manual merge, (4) installer, (5) adopt new upstream tests, (6) validate all three suites.

## Standard Stack

This phase does not introduce new libraries. The "stack" here is the merge tooling and the upstream modules being adopted.

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| git merge tooling | N/A | `git checkout upstream/main -- <file>` for wholesale replace | Standard git workflow for fork maintenance |
| diff3 conflict style | N/A | `git config merge.conflictstyle diff3` for hybrid merges | Shows common ancestor, both sides in conflict markers -- fork standard per FORK-STRATEGY.md |
| node:test | Node 20+ | Upstream test runner | All upstream tests use node:test, not vitest |
| vitest | Current | Fork test runner | Fork's 443 tests use vitest |

### Upstream Modules Being Adopted
| Module | Upstream Lines | Fork Category | Sync Method |
|--------|---------------|---------------|-------------|
| model-profiles.cjs | 68 | **New dependency** (not currently in fork) | Copy from upstream -- required by core.cjs and config.cjs |
| state.cjs | ~1400 (up from 721) | Pure upstream | Wholesale replace |
| milestone.cjs | ~280 (up from 241) | Pure upstream | Wholesale replace |
| template.cjs | ~222 | Pure upstream | Wholesale replace (confirm no changes) |
| verify.cjs | ~820 | Pure upstream | Wholesale replace (confirm no changes) |
| phase.cjs | ~1200 (up from 908) | Mostly upstream | Replace then re-apply 17-line fork adjustment |
| roadmap.cjs | ~350 (up from 305) | Mostly upstream | Replace then re-apply 15-line fork adjustment |
| core.cjs | ~1600 (up from 713) | Hybrid | Manual merge -- heaviest lift |
| config.cjs | ~500 (up from 264) | Hybrid | Manual merge -- fork extensions need reconciliation |
| frontmatter.cjs | ~430 (up from 387) | Hybrid | Manual merge -- fork signal schema validation preserved |

## Architecture Patterns

### Merge Execution Order (Dependency-Driven)

The merge MUST follow this order due to import dependencies:

```
Step 1: model-profiles.cjs          (NEW -- no fork equivalent, zero conflict)
  |
Step 2: core.cjs                    (HYBRID -- imports model-profiles.cjs)
  |                                  Adds: atomicWriteFileSync, withPlanningLock, planningDir,
  |                                         planningPaths, planningRoot, normalizeMd, CONFIG_DEFAULTS,
  |                                         Atomics.wait, _heldPlanningLocks, readSubdirectories
  |                                  Fork keeps: atomicWriteJson (refactored to delegate),
  |                                              parseIncludeFlag, loadManifest, loadProjectConfig,
  |                                              MODEL_PROFILES (removed -- now in model-profiles.cjs)
  |
Step 3: state.cjs                   (PURE UPSTREAM -- imports from core.cjs)
  |                                  Gets: acquireStateLock, readModifyWriteStateMd, atomicWriteFileSync
  |
Step 4: frontmatter.cjs             (HYBRID -- no new deps, fork signal schema preserved)
  |                                  Gets: splitInlineArray for quoted-comma fix, CRLF tolerance
  |
Step 5: config.cjs                  (HYBRID -- imports from core.cjs and model-profiles.cjs)
  |                                  Gets: withPlanningLock, atomicWriteFileSync, isValidConfigKey,
  |                                         buildNewProjectConfig, ensureConfigFile, setConfigValue
  |                                  Fork loses: cmdForkConfigSet, cmdForkConfigGet (upstream now
  |                                              supports --default flag and dynamic key patterns)
  |
Step 6: milestone.cjs, phase.cjs,   (PURE/MOSTLY UPSTREAM -- import from state.cjs, core.cjs)
        roadmap.cjs, template.cjs,
        verify.cjs
  |
Step 7: bin/install.js              (HYBRID -- independent of lib modules)
  |
Step 8: complete-milestone.md       (WORKFLOW -- adopt directly)
  |
Step 9: gsd-tools.cjs router        (HYBRID -- needs new command routing for phases-clear, etc.)
  |
Step 10: Upstream test files         (NEW -- adopt relevant tests)
  |
Step 11: tests/helpers.cjs          (NEW -- required by upstream test files)
```

### Pattern: Wholesale Module Replace (Pure/Mostly Upstream)

**What:** Use `git show upstream/main:<path> > <path>` to replace the file entirely, then re-apply any fork-specific adjustments.

**When to use:** For modules with `adopt-upstream` merge stance (state, milestone, template, verify) and mostly-upstream modules (phase, roadmap).

**Example (pure upstream):**
```bash
# Fetch the file at the frozen baseline commit, not HEAD
git show f7549d43:get-shit-done/bin/lib/state.cjs > get-shit-done/bin/lib/state.cjs
```

**Example (mostly upstream with fork re-apply):**
```bash
# 1. Save fork's current adjustments
git diff HEAD -- get-shit-done/bin/lib/phase.cjs > /tmp/fork-phase-adjustments.patch
# 2. Wholesale replace
git show f7549d43:get-shit-done/bin/lib/phase.cjs > get-shit-done/bin/lib/phase.cjs
# 3. Inspect fork adjustments and re-apply manually (17 lines for phase.cjs)
```

### Pattern: Hybrid Module Merge (Fork Extensions Preserved)

**What:** Three-way diff analysis. Identify upstream additions (new functions, bug fixes), fork additions (extensions via module.exports.funcName), and resolve any overlapping regions.

**When to use:** For hybrid modules (core.cjs, config.cjs, frontmatter.cjs) and the installer.

**Approach:** Use diff3 comparisons, not git merge (which would try to merge entire file histories). Manually:
1. Diff fork's current file against the common ancestor to isolate fork-only additions
2. Diff upstream's v1.34.2 file against the common ancestor to isolate upstream-only additions
3. Start from upstream v1.34.2 as base, surgically re-add fork extensions

### Pattern: Fork Extension Reconciliation (core.cjs)

The most complex merge. Upstream core.cjs grew from fork's 713 lines to ~1600 lines. Key changes:

**Upstream additions to adopt:**
- `atomicWriteFileSync` (replaces need for fork's simpler `atomicWriteJson`)
- `withPlanningLock` (file-based locking for .planning/ writes)
- `planningDir`, `planningPaths`, `planningRoot` (path helpers)
- `normalizeMd` (markdown normalization)
- `CONFIG_DEFAULTS` (hardcoded config defaults)
- `_heldPlanningLocks` + `process.on('exit')` cleanup
- `Atomics.wait` instead of shell sleep for cross-platform busy-wait
- `readSubdirectories` helper
- `isGitIgnored` cache (Area 3 perf fix)
- `require('crypto')`, `require('os')` additions

**Fork additions to preserve:**
- `parseIncludeFlag` (fork init --include support)
- `loadManifest` (feature manifest loading)
- `loadProjectConfig` (project config loading)
- `atomicWriteJson` (refactored to delegate to `atomicWriteFileSync`)
- `findProjectRoot` export

**Fork additions to REMOVE:**
- Inline `MODEL_PROFILES` table (moved to model-profiles.cjs)
- Inline `resolveModel` function (if now in model-profiles.cjs -- verify)

### Anti-Patterns to Avoid

- **Naive git merge of the entire upstream branch:** Do NOT `git merge upstream/main`. This would pull in all 304 commits including features out of scope. Use targeted file-level operations instead.
- **Editing .claude/ directly:** Per CLAUDE.md, always edit npm source directories (`get-shit-done/`, `bin/`). Run `node bin/install.js --local` after all source changes are complete.
- **Forgetting model-profiles.cjs dependency:** Replacing core.cjs or config.cjs without first adding model-profiles.cjs will cause immediate runtime errors (require failure).
- **Replacing gsd-tools.cjs wholesale:** The router has extensive fork-specific command routing. Only add the new upstream command entries (phases-clear, config-new-project, config-set-model-profile) -- do not wholesale replace.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic file writes | Fork's current `atomicWriteJson` pattern (no PID, no fallback) | Upstream's `atomicWriteFileSync` (PID-scoped tmp, fallback on rename failure) | Handles concurrent writers and cross-device edge case |
| State locking | Custom lock mechanism | Upstream's `acquireStateLock`/`releaseStateLock` with `_heldStateLocks` exit cleanup | Handles process.exit(1) stale lock cleanup (#1916), TOCTOU races |
| Planning dir locking | Custom lock | Upstream's `withPlanningLock` in core.cjs | Same pattern as state locking, for config.json writes |
| Config key validation | Fork's `cmdForkConfigSet` allowlist bypass | Upstream's `isValidConfigKey` with dynamic patterns | Upstream now supports `agent_skills.<type>` and `features.<name>` patterns |
| Quoted-comma YAML parsing | Custom parser | Upstream's `splitInlineArray` in frontmatter.cjs | Properly handles nested quotes in inline arrays |

**Key insight:** The fork's `atomicWriteJson` (signal SIG-260222-003) was a correct pioneering implementation. Upstream independently arrived at the same pattern but with two improvements: PID-scoped tmp filenames prevent concurrent-writer collision, and fallback-to-direct-write handles cross-device rename failure. Rather than maintaining two independent implementations, refactor `atomicWriteJson` to delegate to `atomicWriteFileSync`:

```javascript
// Refactored fork atomicWriteJson -- delegates to upstream's atomicWriteFileSync
module.exports.atomicWriteJson = function atomicWriteJson(filePath, data) {
  const content = JSON.stringify(data, null, 2) + '\n';
  atomicWriteFileSync(filePath, content, 'utf-8');
};
```

## Common Pitfalls

### Pitfall 1: MODEL_PROFILES Dependency Chain
**What goes wrong:** Adopting upstream core.cjs or config.cjs without first adding model-profiles.cjs causes `Error: Cannot find module './model-profiles.cjs'` at runtime.
**Why it happens:** Upstream refactored the inline MODEL_PROFILES table into a separate module. Both core.cjs and config.cjs now `require('./model-profiles.cjs')`.
**How to avoid:** Add model-profiles.cjs as the FIRST step before any hybrid module merge.
**Warning signs:** Any `require` error mentioning `model-profiles.cjs`.

### Pitfall 2: Fork cmdForkConfigSet/cmdForkConfigGet Removal
**What goes wrong:** After merging config.cjs, fork commands that used `cmdForkConfigSet` or `cmdForkConfigGet` fail because these functions no longer exist.
**Why it happens:** Upstream's config.cjs now natively supports: (a) dynamic key patterns via `isValidConfigKey`, (b) `--default` flag for graceful absent-key handling, and (c) JSON array/object value parsing. These were the exact capabilities the fork's permissive extensions provided.
**How to avoid:** Check all callers of `cmdForkConfigSet` and `cmdForkConfigGet` and redirect to upstream's `cmdConfigSet` and `cmdConfigGet`. Verify the fork's config keys are in upstream's `VALID_CONFIG_KEYS` set or match dynamic patterns.
**Warning signs:** Search for `cmdForkConfig` in gsd-tools.cjs router and init.cjs.

### Pitfall 3: readModifyWriteStateMd Pattern Change
**What goes wrong:** Upstream state.cjs replaced direct read-then-write patterns with `readModifyWriteStateMd` which holds a lock across the entire cycle. If fork code bypasses this by calling `writeStateMd` directly after a separate read, the locking benefit is lost.
**Why it happens:** The TOCTOU fix requires the lock to span the read-modify-write window, not just the write.
**How to avoid:** Fork-only modules do NOT call state-write functions (verified). However, the gsd-tools.cjs router and init.cjs may have direct state writes -- check these.
**Warning signs:** Any `writeStateMd` call preceded by a separate `readFileSync` of STATE.md outside a lock.

### Pitfall 4: Upstream Test File Dependencies
**What goes wrong:** Adopting upstream test files (e.g., `atomic-write.test.cjs`) that require `tests/helpers.cjs` fails because the fork uses a different test helper structure (`tests/helpers/` directory).
**Why it happens:** Upstream tests use a flat `tests/helpers.cjs` module; the fork organizes helpers in `tests/helpers/setup.js` and `tests/helpers/tmpdir.js`.
**How to avoid:** Adopt `tests/helpers.cjs` from upstream alongside the test files. The fork's vitest helpers in `tests/helpers/` are separate and unaffected.
**Warning signs:** `Error: Cannot find module '../helpers.cjs'` in test runs.

### Pitfall 5: Installer Marker String Mismatch
**What goes wrong:** The fork's installer uses `get-shit-done-reflect` in Codex marker strings; upstream uses `get-shit-done`. After merge, hooks written by the fork installer may not be detected by upstream's uninstall logic and vice versa.
**Why it happens:** The fork changed `GSD_CODEX_MARKER` to include `-reflect` suffix during v1.18 branding.
**How to avoid:** During install.js hybrid merge, keep the fork's marker string for branding consistency. The marker only affects this fork's install/uninstall cycle.
**Warning signs:** Orphaned hook entries after uninstall.

### Pitfall 6: Not Running Installer After Module Changes
**What goes wrong:** Source modules are updated but `.claude/` runtime copies remain stale (the v1.15 Phase 22 incident pattern, also documented in signal sig-2026-03-26-installer-never-run-after-phase-completion).
**Why it happens:** The dual-directory architecture requires `node bin/install.js --local` to copy source to runtime.
**How to avoid:** Run installer as the LAST step after all source changes are validated. Include it in the plan as an explicit task.
**Warning signs:** Test suites pass but runtime behavior doesn't match expectations.

## Code Examples

### Upstream atomicWriteFileSync (from core.cjs)
```javascript
// Source: upstream v1.34.2, get-shit-done/bin/lib/core.cjs
function atomicWriteFileSync(filePath, content, encoding = 'utf-8') {
  const tmpPath = filePath + '.tmp.' + process.pid;
  try {
    fs.writeFileSync(tmpPath, content, encoding);
    fs.renameSync(tmpPath, filePath);
  } catch (renameErr) {
    try { fs.unlinkSync(tmpPath); } catch { /* already gone */ }
    fs.writeFileSync(filePath, content, encoding);
  }
}
```

### Upstream acquireStateLock (from state.cjs)
```javascript
// Source: upstream v1.34.2, get-shit-done/bin/lib/state.cjs
function acquireStateLock(statePath) {
  const lockPath = statePath + '.lock';
  const maxRetries = 10;
  const retryDelay = 200; // ms
  for (let i = 0; i < maxRetries; i++) {
    try {
      const fd = fs.openSync(lockPath, fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_WRONLY);
      fs.writeSync(fd, String(process.pid));
      fs.closeSync(fd);
      _heldStateLocks.add(lockPath);
      return lockPath;
    } catch (err) {
      if (err.code === 'EEXIST') {
        // Stale lock detection (>10s old)
        try {
          const stat = fs.statSync(lockPath);
          if (Date.now() - stat.mtimeMs > 10000) { fs.unlinkSync(lockPath); continue; }
        } catch { /* released between check */ }
        if (i === maxRetries - 1) { try { fs.unlinkSync(lockPath); } catch {} return lockPath; }
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelay + Math.floor(Math.random() * 50));
        continue;
      }
      return lockPath; // non-EEXIST: proceed without lock
    }
  }
  return statePath + '.lock';
}
```

### Upstream splitInlineArray (frontmatter quoted-comma fix)
```javascript
// Source: upstream v1.34.2, get-shit-done/bin/lib/frontmatter.cjs
function splitInlineArray(body) {
  const items = [];
  let current = '';
  let inQuote = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      else current += ch;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
    } else if (ch === ',') {
      const trimmed = current.trim();
      if (trimmed) items.push(trimmed);
      current = '';
    } else {
      current += ch;
    }
  }
  const trimmed = current.trim();
  if (trimmed) items.push(trimmed);
  return items;
}
```

### Fork atomicWriteJson Refactoring Pattern
```javascript
// Fork core.cjs -- refactor to delegate to upstream's atomicWriteFileSync
module.exports.atomicWriteJson = function atomicWriteJson(filePath, data) {
  const content = JSON.stringify(data, null, 2) + '\n';
  atomicWriteFileSync(filePath, content, 'utf-8');
};
```

## State of the Art

| Old Approach (Fork) | Current Approach (Upstream v1.34.2) | When Changed | Impact |
|---------------------|-------------------------------------|--------------|--------|
| Direct `fs.writeFileSync` for STATE.md | `atomicWriteFileSync` + `acquireStateLock` | v1.34.0 (commits `4dd35f6b`, `60fa2936`) | Prevents TOCTOU races and truncation on kill |
| Read-then-write STATE.md (unlocked) | `readModifyWriteStateMd` (locked read-modify-write) | v1.34.0 (commit `7bc66685`) | Prevents lost updates from parallel agents |
| `setTimeout`/shell sleep for lock retry | `Atomics.wait` on SharedArrayBuffer | v1.34.0 (commit `839ea22d`) | Cross-platform, no shell dependency |
| `test()+replace()` with global regex | `replace()` then compare result | v1.34.1 (commit `6d429da6`) | Fixes lastIndex bug where `test()` advances global regex state |
| Hardcoded `.planning/` paths | `planningDir()`, `planningPaths()`, `planningRoot()` | v1.34.0 | Supports workstream-aware path resolution |
| Inline MODEL_PROFILES in core.cjs | Separate model-profiles.cjs module | v1.34.0 | Decouples model config from core utilities |
| Fork `cmdForkConfigSet` (no allowlist) | Upstream `isValidConfigKey` with dynamic patterns | v1.34.0 | Upstream now supports extensible key validation |

## Open Questions

### Resolved
- **Should Area 3 performance fixes be included?** YES. The 4 commits touch files already in scope (core.cjs gets `isGitIgnored` cache; roadmap.cjs gets `readdirSync` hoist; init.cjs gets `readdirSync` hoist; context-monitor hook gets `.planning/` sentinel check). Including them avoids a second merge pass through the same files. Risk is low -- these are guard additions and loop hoists, not behavioral changes.

- **Does upstream v1.34.2 include new test files for the correctness fixes?** YES. 26 new test files are relevant to the sync scope, including: `atomic-write.test.cjs`, `locking-bugs-1909-1916-1925-1927.test.cjs`, `state.test.cjs`, `milestone.test.cjs`, `milestone-regex-global.test.cjs`, `milestone-summary.test.cjs`, `new-milestone-clear-phases.test.cjs`, `frontmatter.test.cjs`, `frontmatter-cli.test.cjs`, and 17 installer-related test files. These tests also require adopting `tests/helpers.cjs` (the upstream test helper module).

- **Should atomicWriteJson be refactored to use atomicWriteFileSync internally?** YES. The fork's `atomicWriteJson` (3 lines) becomes a thin wrapper delegating to upstream's `atomicWriteFileSync` (10 lines with PID-scoped tmp and fallback). This eliminates dual implementations while preserving the 2 existing `atomicWriteJson` call sites (manifest.cjs line 340, core.cjs export).

- **Do any fork-only modules call state-write functions affected by the locking overhaul?** NO. Verified via grep: automation.cjs, backlog.cjs, health-probe.cjs, manifest.cjs, and sensors.cjs have zero imports from state.cjs and zero calls to writeStateMd, readModifyWriteStateMd, or stateReplaceField. Only upstream/hybrid modules (milestone.cjs, phase.cjs, verify.cjs, state.cjs itself) use these functions -- and those are wholesale-replaced from upstream.

- **Is complete-milestone.md in a file the fork has modified?** PARTIALLY. The fork's git history shows upstream commits in the file's log (v1.18 sync adopted it), plus fork commit `5e04128e` which applied C2 shell robustness guards. The upstream changes (data-loss prevention, requirements check, UI artifact archival) are substantial and can be adopted, but the fork's shell robustness guards must be re-verified after adoption.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Does the fork's gsd-tools.cjs router need new command entries for `phases-clear`, `config-new-project`, `config-set-model-profile`? | Medium | Inspect upstream router additions -- these are new commands exposed by the adopted modules. Add entries if fork users need them. |
| Are the fork's config keys (`gsd_reflect_version`, `health_check`, `knowledge_debug`, `workflow.discuss_mode`) present in upstream's VALID_CONFIG_KEYS or matchable by dynamic patterns? | Medium | Verify during config.cjs merge. Fork-specific keys may need explicit addition to the set. |
| Does the upstream helpers.cjs test module conflict with the fork's tests/helpers/ directory? | Low | They coexist at different paths: `tests/helpers.cjs` (file) vs `tests/helpers/` (directory). Node resolves them differently. Verify no path collision. |

### Still Open
- Whether upstream's new `planningDir(cwd, ws, project)` workstream/project path resolution interacts with the fork's simpler `.planning/` assumption. The fork uses single-project mode, so the default path should be unchanged, but this needs verification during core.cjs merge.

## Sources

### Primary (HIGH confidence)
- Direct git diff analysis of fork HEAD vs upstream f7549d43 (v1.34.2) for all in-scope modules
- Fork source code inspection: `get-shit-done/bin/lib/*.cjs`, `bin/install.js`, `get-shit-done/bin/gsd-tools.cjs`
- `.planning/research/upstream-drift-survey-2026-04-08.md` -- complete commit inventory
- `.planning/FORK-DIVERGENCES.md` -- module merge stance matrix (post v1.18)
- `.planning/FORK-STRATEGY.md` -- merge strategy, conflict resolution runbook, baseline-freeze rules

### Secondary (MEDIUM confidence)
- Upstream commit messages and PR numbers (referenced in drift survey)
- Upstream test file analysis (verified exports and dependencies)

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| SIG-260222-003 | signal | Fork's atomicWriteJson uses same-directory .tmp for rename atomicity guarantee | Architecture Patterns (atomicWriteJson refactoring recommendation) |
| sig-2026-03-26-installer-never-run | signal | Dual-directory .claude/ copies become stale if installer not run after source changes | Common Pitfalls (Pitfall 6) |
| sig-2026-03-27-wholesale-workflow-adoption | signal | Upstream adoption without dependency scanning creates repeatable gaps | Architecture Patterns (dependency order enforcement) |

Checked knowledge base (`.planning/knowledge/index.md`): 1 spike found (session-log-location, not relevant). No lessons distilled yet. 198 signals scanned; 3 with direct relevance applied above.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- direct source analysis of both fork and upstream
- Architecture: HIGH -- module dependency chain verified via require() analysis
- Pitfalls: HIGH -- grounded in verified git diffs, signal history, and concrete file analysis

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (30 days -- upstream is in stability cycle, not architectural expansion)
