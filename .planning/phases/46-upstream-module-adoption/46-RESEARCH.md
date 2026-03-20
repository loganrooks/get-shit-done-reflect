# Phase 46: Upstream Module Adoption - Research

**Researched:** 2026-03-19
**Domain:** CJS module adoption, CLI dispatcher rewrite, monolith decomposition
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Take upstream's 11 modules wholesale from `upstream/main:get-shit-done/bin/lib/` -- do not cherry-pick or reconcile individual functions
- This is an upgrade: upstream has had bug fixes and improvements the fork lacks
- Fork-specific functions (backlog, manifest, automation, sensors, health-probe) stay defined in `gsd-tools.cjs` for now
- The dispatcher routes fork commands to these inline functions, not to modules
- Phase 47 will extract them into dedicated modules

### Claude's Discretion
- Exact dispatcher structure (switch/case, function map, or hybrid)
- Whether to adopt upstream's dispatcher verbatim and extend it, or write a new one that merges both
- Ordering of module extraction within the plan (core.cjs extension before or after module adoption)
- Whether to adopt upstream's module-level tests alongside the modules

### Deferred Ideas (OUT OF SCOPE)
- Fork module extraction (backlog, sensors, manifest, automation, health-probe) -- Phase 47
- Upstream module extensions (frontmatter signal schema, init --include flag) -- Phase 48
- Upstream test adoption (12 node:test files that test module exports directly) -- deferred requirement FUT-03
- New upstream feature adoption (stats command, UI features) -- Phase 52
</user_constraints>

## Summary

Research reveals that upstream function drift is **significant but manageable**. Upstream has evolved its modules with 83 commits to `get-shit-done/bin/` since the fork diverged. The drift falls into three categories: (1) new helper functions/patterns in modules (`writeStateMd`, `readTextArgOrFile`, `stateExtractField`, `stateReplaceField`, `syncStateFrontmatter` in state.cjs), (2) new command functions missing from the fork (`cmdStats`, `cmdConfigGet`, `cmdRequirementsMarkComplete`, `cmdValidateHealth`, `cmdStateJson`, `cmdRoadmapUpdatePlanProgress`), and (3) enhanced dispatcher features (`--cwd` support, improved commit message parsing). Taking upstream modules wholesale is the correct strategy -- these are bug fixes and improvements that the fork benefits from.

The dispatcher rewrite is straightforward. Upstream uses a clean `switch/case` pattern with module `require()` calls at the top of the file. The fork must extend this with 6 additional `case` blocks for fork-specific commands (manifest, backlog, automation, sensors, health-probe, plus fork-specific init routing). The key complication is that 3 fork init functions (`cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitProgress`) have an extra `includes` parameter that upstream's init.cjs does not accept -- the dispatcher must handle `parseIncludeFlag` and pass `includes` to fork-specific init wrappers while upstream's module receives the standard signature.

The 4 shared helpers (`loadManifest`, `loadProjectConfig`, `atomicWriteJson`, `parseIncludeFlag`) have **zero naming collisions** with upstream's `core.cjs` exports. They can be added as pure extensions.

**Primary recommendation:** Adopt upstream modules first, then rewrite the dispatcher to `require()` them while keeping fork functions inline, then extend `core.cjs` with shared helpers. The init function signature divergence requires wrapper functions in the dispatcher, not modifications to upstream's `init.cjs`.

## Standard Stack

### Core
| Component | Version/Size | Purpose | Why Standard |
|-----------|-------------|---------|--------------|
| Node.js CJS modules | `.cjs` extension | Module system for CLI tool | Upstream standard, prevents ESM resolution conflicts |
| `require()` / `module.exports` | CommonJS | Inter-module dependencies | All 11 upstream modules use this pattern |
| `node:fs`, `node:path` | Built-in | File and path operations | Only dependencies -- no external packages |
| `node:child_process` | Built-in | Git operations, subprocess exec | Used by core.cjs `execGit` |

### Supporting
| Component | Purpose | When to Use |
|-----------|---------|-------------|
| vitest | Fork test suite (354 tests) | Behavioral validation via CLI subprocess |
| node:test | Upstream test suite (174 tests) | Upstream function validation |
| node:test (fork) | Fork extension tests (10 tests) | Fork-specific command validation |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| switch/case dispatcher | Function registry map | Map is cleaner for dynamic routing but switch/case matches upstream pattern exactly; adoption is simpler |
| Wrapper functions for init | Modify upstream init.cjs | Modifying upstream modules increases merge conflict risk; wrappers keep upstream clean |

## Architecture Patterns

### Recommended Project Structure (Post-Phase 46)
```
get-shit-done/bin/
  gsd-tools.cjs          # Dispatcher (~700 lines) + inline fork functions (~2,300 lines)
  lib/
    core.cjs             # Upstream + 4 fork helper exports
    frontmatter.cjs      # Upstream (unchanged)
    init.cjs             # Upstream (unchanged)
    commands.cjs         # Upstream (unchanged)
    config.cjs           # Upstream (unchanged)
    milestone.cjs        # Upstream (unchanged)
    phase.cjs            # Upstream (unchanged)
    roadmap.cjs          # Upstream (unchanged)
    state.cjs            # Upstream (unchanged)
    template.cjs         # Upstream (unchanged)
    verify.cjs           # Upstream (unchanged)
```

### Pattern 1: Module Require at Top, Switch/Case Dispatch
**What:** All module `require()` calls at the top of `gsd-tools.cjs`, followed by a single `main()` function with a switch/case that routes to module functions.
**When to use:** This is the ONLY dispatcher pattern for this phase.
**Example (from upstream):**
```javascript
// Source: upstream/main:get-shit-done/bin/gsd-tools.cjs
const { error } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
// ... other modules

async function main() {
  const args = process.argv.slice(2);
  // --cwd handling
  // --raw handling
  const command = args[0];

  switch (command) {
    case 'state': {
      const subcommand = args[1];
      if (subcommand === 'json') {
        state.cmdStateJson(cwd, raw);
      } else if (subcommand === 'update') {
        state.cmdStateUpdate(cwd, args[2], args[3]);
      }
      // ... more subcommands
      break;
    }
    // ... more cases
  }
}
main();
```

### Pattern 2: Fork-Specific Init Wrapper Pattern
**What:** Fork's `cmdInitExecutePhase(cwd, phase, includes, raw)` takes an extra `includes` parameter. Upstream's `init.cmdInitExecutePhase(cwd, phase, raw)` does not. The dispatcher wraps the fork-specific behavior.
**When to use:** For the 3 init functions that diverge: `execute-phase`, `plan-phase`, `progress`.
**Example:**
```javascript
// In the dispatcher's init case block:
case 'execute-phase': {
  // Fork enhancement: parse --include flag and extend upstream's result
  const includes = parseIncludeFlag(args);
  // Call upstream's module function for the base result
  // But fork needs to add includes-based content...
  // DECISION: Keep fork's cmdInitExecutePhase inline, calling
  // upstream helpers directly since it diverges from upstream's signature
  cmdInitExecutePhase(cwd, args[2], includes, raw);
  break;
}
```

### Pattern 3: Fork Function Inline Retention
**What:** Fork-specific command functions remain defined in `gsd-tools.cjs` alongside the dispatcher. The dispatcher's fork-specific `case` blocks call these inline functions directly.
**When to use:** All fork commands (manifest, backlog, automation, sensors, health-probe) until Phase 47 extracts them.
**Example:**
```javascript
// gsd-tools.cjs structure after Phase 46:
// 1. Module requires (upstream modules)
// 2. Fork-specific helper functions (parseIncludeFlag, loadManifest, etc.)
// 3. Fork-specific command functions (cmdBacklogAdd, cmdManifestDiffConfig, etc.)
// 4. Fork-specific init overrides (cmdInitExecutePhase, cmdInitPlanPhase, cmdInitProgress)
// 5. Dispatcher (main function with switch/case)
```

### Anti-Patterns to Avoid
- **Modifying upstream modules:** Do not edit the adopted `lib/*.cjs` files to accommodate fork needs. The fork's `core.cjs` extension (adding 4 helpers) is the ONLY modification to upstream modules.
- **Reconciling function-level differences:** Do not try to merge the fork's old copies of upstream functions with the new module versions. Take upstream wholesale.
- **Putting fork helpers in upstream modules:** `loadManifest`, `loadProjectConfig`, `atomicWriteJson` go in `core.cjs` (shared), NOT in individual upstream modules.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| STATE.md frontmatter sync | Custom frontmatter writer | Upstream's `writeStateMd()` + `syncStateFrontmatter()` | Upstream added automatic frontmatter synchronization -- fork's raw `fs.writeFileSync` is inferior |
| Text arg or file resolution | Inline text handling | Upstream's `readTextArgOrFile()` in state.cjs | Handles `--text` vs `--text-file` pattern upstream added |
| State field extraction | Regex per call site | Upstream's `stateExtractField()` + `stateReplaceField()` | Deduplicated, supports both bold and plain formats |
| Phase number comparison | Simple string sort | Upstream's `comparePhaseNum()` | Handles letters (12A, 12B) and multi-segment decimals (12.1.2) |
| Commit message parsing | `args[1]` only | Upstream's multi-word join pattern | Fork's `const message = args[1]` breaks on unquoted multi-word messages |

**Key insight:** Upstream has fixed several bugs in its module versions that the fork's monolith copies still have. Taking modules wholesale is not just structural cleanup -- it is a correctness upgrade.

## Common Pitfalls

### Pitfall 1: Init Function Signature Mismatch
**What goes wrong:** Upstream's `init.cjs` exports `cmdInitExecutePhase(cwd, phase, raw)` (3 params). The fork's dispatcher calls `cmdInitExecutePhase(cwd, phase, includes, raw)` (4 params). If the dispatcher naively routes to `init.cmdInitExecutePhase`, the `includes` arg gets interpreted as `raw`.
**Why it happens:** The fork added `--include` flag support that upstream never adopted.
**How to avoid:** Keep the fork's 3 init functions (`cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitProgress`) as inline overrides in `gsd-tools.cjs`. They call upstream's core helpers (`loadConfig`, `findPhaseInternal`, etc.) directly but produce fork-enhanced output with `--include` support. Do NOT route these through `init.cjs`.
**Warning signs:** Init commands returning wrong JSON structure, `includes` being treated as boolean `raw`.

### Pitfall 2: Upstream State Functions Expect New Helpers
**What goes wrong:** Upstream's `state.cjs` internally uses `writeStateMd()`, `readTextArgOrFile()`, `stateExtractField()`, and `stateReplaceField()` -- all defined within `state.cjs` itself. These are NOT exported from `core.cjs`. If you try to keep fork versions of state functions, they will lack these helpers.
**Why it happens:** Upstream refactored state operations to use shared internal helpers.
**How to avoid:** Take `state.cjs` wholesale. The dispatcher routes `state` commands to `state.cmdStateXxx()`. The fork's dispatcher currently accepts simpler argument shapes for some state subcommands (e.g., `add-blocker --text "..."` vs upstream's `add-blocker --text "..." --text-file path`). The dispatcher must pass the full options object as upstream expects.
**Warning signs:** `ReferenceError: writeStateMd is not defined`, `TypeError: readTextArgOrFile is not a function`.

### Pitfall 3: Dispatcher Argument Parsing Differences
**What goes wrong:** Upstream's dispatcher has improvements the fork lacks:
1. `--cwd` support for sandboxed subagents (fork has none)
2. Multi-word commit messages via join pattern (fork uses `args[1]` only)
3. `state add-decision --summary-file` / `--rationale-file` / `state add-blocker --text-file` (fork lacks file-based arg variants)
4. `phases list --include-archived` (fork lacks)
5. `milestone complete --archive-phases` (fork lacks)
**Why it happens:** Upstream continued evolving the dispatcher while the fork was frozen.
**How to avoid:** Adopt upstream's dispatcher wholesale and EXTEND it with fork-specific cases. Do not write a new dispatcher from scratch.
**Warning signs:** Tests that use multi-word commit messages failing, `--cwd` flag being unrecognized.

### Pitfall 4: Missing Commands from Upstream
**What goes wrong:** Upstream added 6 commands/subcommands the fork lacks:
1. `stats` (new command in commands.cjs)
2. `config-get` (new command in config.cjs)
3. `requirements mark-complete` (new command in milestone.cjs)
4. `validate health [--repair]` (new subcommand in verify.cjs)
5. `state json` (new subcommand in state.cjs)
6. `roadmap update-plan-progress` (new subcommand in roadmap.cjs)
**Why it happens:** Upstream modules include these functions but the fork's old dispatcher never routed to them.
**How to avoid:** By adopting upstream's dispatcher and extending it, all new upstream commands are automatically available. The switch/case blocks already exist in upstream's dispatcher.
**Warning signs:** If writing dispatcher from scratch, these get missed silently.

### Pitfall 5: Core.cjs `loadConfig` Divergence
**What goes wrong:** Upstream's `core.cjs` `loadConfig()` returns `nyquist_validation` field. The fork's `loadConfig()` does not. Since all modules `require('./core.cjs')`, the fork's inline init functions that call `loadConfig()` will now get an object with `nyquist_validation` included.
**Why it happens:** Upstream added Nyquist validation feature.
**How to avoid:** This is benign -- the fork's init functions simply don't use the field. But be aware that the JSON output from `init` commands will now include `nyquist_validation` in the config object. Fork tests that exact-match JSON output may need updating.
**Warning signs:** Test assertions on `config` object shape failing due to extra keys.

### Pitfall 6: Installer Path Replacement on `.cjs` Files
**What goes wrong:** The installer's `copyWithPathReplacement()` only applies `replacePathsInContent()` to `.md` files (line 1515: `entry.name.endsWith('.md')`). Non-`.md` files (including `.cjs` modules) are copied verbatim via `fs.copyFileSync` (line 1543). If any `.cjs` module contains hardcoded path references (like `~/.claude/get-shit-done/`), those paths will NOT be rewritten.
**Why it happens:** The installer was designed when only `.md` files contained path references.
**How to avoid:** Verify that upstream's `.cjs` modules do not contain path references that need rewriting. Checking upstream's modules: `core.cjs` uses relative `require()` paths (`./lib/core.cjs`), not absolute `~/.claude/` paths. Non-issue for the 11 modules.
**Warning signs:** Installed modules referencing wrong paths at runtime.

## Code Examples

### Upstream Dispatcher Structure (adopt verbatim and extend)
```javascript
// Source: upstream/main:get-shit-done/bin/gsd-tools.cjs (lines 112-136)
const fs = require('fs');
const path = require('path');
const { error } = require('./lib/core.cjs');
const state = require('./lib/state.cjs');
const phase = require('./lib/phase.cjs');
const roadmap = require('./lib/roadmap.cjs');
const verify = require('./lib/verify.cjs');
const config = require('./lib/config.cjs');
const template = require('./lib/template.cjs');
const milestone = require('./lib/milestone.cjs');
const commands = require('./lib/commands.cjs');
const init = require('./lib/init.cjs');
const frontmatter = require('./lib/frontmatter.cjs');

async function main() {
  const args = process.argv.slice(2);

  // --cwd override (upstream feature fork must adopt)
  let cwd = process.cwd();
  const cwdEqArg = args.find(arg => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) error('Missing value for --cwd');
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    error(`Invalid --cwd: ${cwd}`);
  }

  // ... rest of upstream dispatcher
}
```

### Upstream core.cjs Exports (20 functions, no collisions)
```javascript
// Source: upstream/main:get-shit-done/bin/lib/core.cjs
module.exports = {
  MODEL_PROFILES,
  output, error, safeReadFile, loadConfig,
  isGitIgnored, execGit,
  escapeRegex, normalizePhaseName, comparePhaseNum,
  searchPhaseInDir, findPhaseInternal, getArchivedPhaseDirs,
  getRoadmapPhaseInternal, resolveModelInternal,
  pathExistsInternal, generateSlugInternal,
  getMilestoneInfo, getMilestonePhaseFilter, toPosixPath,
};

// Fork additions (zero collisions):
// loadManifest, loadProjectConfig, atomicWriteJson, parseIncludeFlag
```

### Fork core.cjs Extension Pattern
```javascript
// After the existing module.exports block:
// Add fork-specific shared helpers
module.exports.loadManifest = function loadManifest(cwd) {
  const localPath = path.join(cwd, '.claude', 'get-shit-done', 'feature-manifest.json');
  const globalPath = path.join(require('os').homedir(), '.claude', 'get-shit-done', 'feature-manifest.json');
  const scriptRelPath = path.join(__dirname, '..', 'feature-manifest.json');
  const manifestPath = fs.existsSync(localPath) ? localPath
    : fs.existsSync(globalPath) ? globalPath
    : fs.existsSync(scriptRelPath) ? scriptRelPath : null;
  if (!manifestPath) return null;
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf-8')); } catch { return null; }
};

module.exports.loadProjectConfig = function loadProjectConfig(cwd) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!fs.existsSync(configPath)) return null;
  try { return JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch { return null; }
};

module.exports.atomicWriteJson = function atomicWriteJson(filePath, data) {
  const tmpPath = filePath + '.tmp';
  const content = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.renameSync(tmpPath, filePath);
};

module.exports.parseIncludeFlag = function parseIncludeFlag(args) {
  const includeIndex = args.indexOf('--include');
  if (includeIndex === -1) return new Set();
  const includeValue = args[includeIndex + 1];
  if (!includeValue) return new Set();
  return new Set(includeValue.split(',').map(s => s.trim()));
};
```

## State of the Art

| Old Approach (Fork Monolith) | Current Approach (Upstream Modules) | When Changed | Impact |
|-----|-----|-----|-----|
| Raw `fs.writeFileSync` for STATE.md | `writeStateMd()` with auto frontmatter sync | Upstream commit `641cdbd` | STATE.md YAML frontmatter automatically stays in sync |
| `args[1]` for commit messages | Multi-word join: `args.slice(1, endIndex).filter(...)` | Upstream commit `4155e67` | Unquoted multi-word commit messages now work |
| `text` param for add-blocker | `{ text, text_file }` options object | Upstream state.cjs | Supports reading blocker text from files |
| No `--cwd` support | `--cwd=path` or `--cwd path` | Upstream dispatcher | Enables sandboxed subagent invocation |
| `stateUpdate` with inline regex | `stateExtractField()` + `stateReplaceField()` | Upstream commit `641cdbd` | Deduplicated, handles both bold and plain field formats |

**Deprecated/outdated:**
- Fork's inline copies of upstream functions: All 87 upstream command functions defined in the monolith (lines 613-3776) are superseded by the 11 module versions.
- Fork's `const message = args[1]` commit parsing: Broken for unquoted multi-word messages.

## Open Questions

### Resolved
- **Q1 (Upstream function drift magnitude):** RESOLVED. Drift is significant but entirely additive. Upstream added new helpers (`writeStateMd`, `readTextArgOrFile`, `stateExtractField`, `stateReplaceField`, `syncStateFrontmatter`, `buildStateFrontmatter`), new commands (`cmdStats`, `cmdConfigGet`, `cmdRequirementsMarkComplete`, `cmdValidateHealth`, `cmdStateJson`, `cmdRoadmapUpdatePlanProgress`), and enhanced existing functions (better argument parsing, `--cwd` support, `--include-archived`, `--archive-phases`). No function signatures were REMOVED or RENAMED -- all changes are backward-compatible additions. Taking modules wholesale is safe.

- **Q2 (Core.cjs export collisions):** RESOLVED. Zero collisions. Upstream exports 20 functions. The 4 fork helpers (`loadManifest`, `loadProjectConfig`, `atomicWriteJson`, `parseIncludeFlag`) have no naming overlap.

- **Q3 (Upstream dispatcher structure):** RESOLVED. Switch/case pattern in a single `main()` async function. Module requires at top of file. The fork should adopt this verbatim and append fork-specific case blocks.

- **Q4 (New upstream commands):** RESOLVED. 6 new commands/subcommands: `stats`, `config-get`, `requirements mark-complete`, `validate health`, `state json`, `roadmap update-plan-progress`. All are already present in upstream's modules and dispatcher. Adopting the upstream dispatcher includes them automatically.

- **Q5 (Installer handling of lib/ subdirectory):** RESOLVED. `copyWithPathReplacement()` is recursive (line 1513-1514: `if (entry.isDirectory()) { copyWithPathReplacement(srcPath, destPath, ...) }`). Non-`.md` files (`.cjs` modules) are copied via `fs.copyFileSync` (line 1543). The `lib/` subdirectory and all its `.cjs` files will be correctly installed. No installer changes needed.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Will test assertions on JSON output shape fail due to new config keys (e.g., `nyquist_validation`)? | Medium | Run full test suite after module adoption; fix exact-match assertions if they fail |
| Does upstream's `cmdPhasesList` `includeArchived` option affect fork behavior? | Low | Accept -- fork never passes `includeArchived`, upstream's default is false |
| Does `loadManifest` path resolution work correctly from `lib/core.cjs` vs from monolith root? | Medium | Verify `__dirname` reference in `loadManifest` resolves correctly from `lib/` subdirectory; the `scriptRelPath = path.join(__dirname, '..', 'feature-manifest.json')` may need adjustment to `path.join(__dirname, '..', '..', 'feature-manifest.json')` |

### Still Open
- The `loadManifest` function uses `__dirname` to find `feature-manifest.json` relative to the script. When moved from the monolith (at `bin/gsd-tools.cjs`) to `bin/lib/core.cjs`, `__dirname` changes from `bin/` to `bin/lib/`. The relative path `path.join(__dirname, '..', 'feature-manifest.json')` would resolve to `bin/feature-manifest.json` from the monolith, but from `lib/core.cjs` it would resolve to `bin/feature-manifest.json` as well (going up one level from `lib/` to `bin/`, then looking for `feature-manifest.json`). However, the manifest is actually at `get-shit-done/feature-manifest.json` (one more level up). **This needs verification during implementation.**

## Upstream Function Drift Analysis

### Dispatcher-Level Differences

| Feature | Fork (current) | Upstream (current) | Impact |
|---------|---------------|-------------------|--------|
| `--cwd` support | None | Full support (`--cwd=path` and `--cwd path`) | Fork gains sandboxed subagent support |
| Commit message parsing | `args[1]` only | Multi-word join pattern | Fork gains unquoted message support |
| `state add-decision` | `{ phase, summary, rationale }` | `{ phase, summary, summary_file, rationale, rationale_file }` | Fork gains file-based args |
| `state add-blocker` | `text` string param | `{ text, text_file }` options object | Fork gains file-based args |
| `phases list` | No `--include-archived` | `includeArchived` option | Fork gains archived phase listing |
| `milestone complete` | No `--archive-phases` | `archivePhases` option | Fork gains phase archival |

### New Functions in Upstream Modules (Not in Fork)

| Module | Function | Purpose |
|--------|----------|---------|
| state.cjs | `cmdStateJson` | Output STATE.md frontmatter as JSON |
| state.cjs | `writeStateMd` | Write STATE.md with auto frontmatter sync |
| state.cjs | `readTextArgOrFile` | Resolve `--text` vs `--text-file` args |
| state.cjs | `stateExtractField` | Extract field from STATE.md content |
| state.cjs | `stateReplaceField` | Replace field value in STATE.md |
| state.cjs | `syncStateFrontmatter` | Auto-sync YAML frontmatter from body |
| state.cjs | `buildStateFrontmatter` | Build frontmatter object from body content |
| commands.cjs | `cmdStats` | Project statistics command |
| config.cjs | `cmdConfigGet` | Read config value |
| milestone.cjs | `cmdRequirementsMarkComplete` | Mark requirements as complete |
| verify.cjs | `cmdValidateHealth` | Health check with optional `--repair` |
| roadmap.cjs | `cmdRoadmapUpdatePlanProgress` | Update progress table from disk |
| core.cjs | `getMilestonePhaseFilter` | Filter phases by current milestone |
| core.cjs | `toPosixPath` | Cross-platform path normalization |

### Init Function Signature Divergence (Critical)

| Function | Upstream Signature | Fork Signature | Resolution |
|----------|-------------------|----------------|------------|
| `cmdInitExecutePhase` | `(cwd, phase, raw)` | `(cwd, phase, includes, raw)` | Keep fork version inline; calls same core helpers |
| `cmdInitPlanPhase` | `(cwd, phase, raw)` | `(cwd, phase, includes, raw)` | Keep fork version inline; calls same core helpers |
| `cmdInitProgress` | `(cwd, raw)` | `(cwd, includes, raw)` | Keep fork version inline; calls same core helpers |

Additionally, upstream's `cmdInitExecutePhase` adds new output fields (`phase_req_ids`, `state_path`, `roadmap_path`, `config_path`) that the fork's version lacks. The fork's version adds `--include` content fields. These differences mean the fork MUST keep its own init functions.

## Recommended Implementation Sequence

### Step 1: Copy upstream modules to `get-shit-done/bin/lib/`
- Copy all 11 `.cjs` files from `upstream/main:get-shit-done/bin/lib/`
- No modifications to any upstream module

### Step 2: Extend `core.cjs` with fork shared helpers
- Append `loadManifest`, `loadProjectConfig`, `atomicWriteJson`, `parseIncludeFlag` to `core.cjs` exports
- Verify `__dirname` path resolution for `loadManifest`

### Step 3: Rewrite `gsd-tools.cjs` dispatcher
- Adopt upstream's dispatcher structure (module requires, `--cwd`, `--raw`, switch/case)
- Retain fork-specific init functions inline (3 functions with `includes` param)
- Retain all fork-specific command functions inline (~2,300 lines)
- Add fork-specific case blocks: `manifest`, `backlog`, `automation`, `sensors`, `health-probe`
- The fork's `init` case block must use `parseIncludeFlag` and route to inline fork functions for `execute-phase`, `plan-phase`, and `progress`, while routing all other init subcommands to `init.cmdXxx()`

### Step 4: Delete dead code from monolith
- Remove all upstream function definitions (lines ~613-3776 of the current monolith)
- Remove all upstream helper functions that are now in `core.cjs`
- Keep fork-specific functions and helpers

### Step 5: Run all test suites
- `npm test` (354 vitest tests)
- `npm run test:upstream` (174 upstream node:test)
- `npm run test:upstream:fork` (10 fork tests)
- `node bin/install.js --local` (installer handles lib/ subdirectory)

## Sources

### Primary (HIGH confidence)
- `upstream/main:get-shit-done/bin/lib/core.cjs` -- Direct code review of 495-line module, verified all 20 exports
- `upstream/main:get-shit-done/bin/gsd-tools.cjs` -- Direct code review of 598-line dispatcher, verified switch/case structure
- `upstream/main:get-shit-done/bin/lib/state.cjs` -- Direct code review, verified `writeStateMd`, `readTextArgOrFile`, `stateExtractField`, `stateReplaceField`, `syncStateFrontmatter` additions
- `upstream/main:get-shit-done/bin/lib/init.cjs` -- Direct code review, verified 3-param signatures for init functions
- `get-shit-done/bin/gsd-tools.cjs` (fork) -- Direct code review of 6,651-line monolith, verified all function signatures
- `bin/install.js` -- Direct code review of `copyWithPathReplacement()` recursive behavior (lines 1497-1545)
- `.planning/research/MODULAR-MIGRATION.md` -- Prior research document establishing migration strategy

### Secondary (MEDIUM confidence)
- `git log --oneline -20 upstream/main -- get-shit-done/bin/` -- 83 total commits to bin/ since fork diverged
- Upstream module export lists -- All 11 modules enumerated via `grep module.exports`

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`), relevant entries found:

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-23-installer-clobbers-force-tracked-files | signal | Installer behavior must be verified against code, not assumptions | Pitfall 6 (installer verification) |
| sig-2026-03-01-plan-checker-misses-second-order-effects | signal | Second-order effects (like init signature mismatch) need explicit coverage | Pitfall 1 (init signature) |
| SIG-260222-003-atomic-write-same-directory-tmp | signal | `atomicWriteJson` uses same-directory tmp file pattern | Core.cjs extension pattern |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- direct code review of all source files
- Architecture: HIGH -- upstream dispatcher structure verified line-by-line
- Pitfalls: HIGH -- function signature differences enumerated exhaustively from code
- Drift analysis: HIGH -- every function signature compared between fork and upstream

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no upstream changes expected to affect this analysis)
