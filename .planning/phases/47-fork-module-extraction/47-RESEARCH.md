# Phase 47: Fork Module Extraction - Research

**Researched:** 2026-03-20
**Domain:** Node.js CommonJS module extraction / internal refactoring
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Module-to-function assignment (from requirements MOD-04 through MOD-08):**

| Module | Commands | Helpers/Constants |
|--------|----------|-------------------|
| `sensors.cjs` | `cmdSensorsList`, `cmdSensorsBlindSpots` | None |
| `backlog.cjs` | `cmdBacklogAdd`, `cmdBacklogList`, `cmdBacklogUpdate`, `cmdBacklogStats`, `cmdBacklogGroup`, `cmdBacklogPromote`, `cmdBacklogIndex` | `resolveBacklogDir`, `readBacklogItems` |
| `manifest.cjs` | `cmdManifestDiffConfig`, `cmdManifestValidate`, `cmdManifestGetPrompts`, `cmdManifestApplyMigration`, `cmdManifestLogMigration`, `cmdManifestAutoDetect` | `KNOWN_TOP_LEVEL_KEYS`, `coerceValue`, `formatMigrationEntry` |
| `automation.cjs` | `cmdAutomationResolveLevel`, `cmdAutomationTrackEvent`, `cmdAutomationLock`, `cmdAutomationUnlock`, `cmdAutomationCheckLock`, `cmdAutomationRegimeChange`, `cmdAutomationReflectionCounter` | `FEATURE_CAPABILITY_MAP` (exported) |
| `health-probe.cjs` | `cmdHealthProbeSignalMetrics`, `cmdHealthProbeSignalDensity`, `cmdHealthProbeAutomationWatchdog` | `resolveKBDir`, `findLatestRegimeChange`, `collectRegimeSignals` |

**What remains in gsd-tools.cjs after extraction:**
- Requires block (lines 1-41): Updated to add 5 new module requires
- Fork init overrides (lines 684-1025): stay until Phase 48
- FORK_SIGNAL_SCHEMA + fork command overrides (lines 2351-2579): stay inline
- CLI Router (lines 2581-3200): Updated to route through module functions

**Dead code removal:**
Remove from gsd-tools.cjs after extraction:
- `extractFrontmatter()` (lines 44-117)
- `reconstructFrontmatter()` (lines 119-181)
- `spliceFrontmatter()` (lines 183-190)
- `parseMustHavesBlock()` (lines 192-256)

### Claude's Discretion
- Extraction order across plans (dependency order is flat)
- Whether to extract all 5 modules in one plan or split across multiple
- Internal organization within each module file
- Whether `cmdForkFrontmatterValidate` should import `extractFrontmatter` from frontmatter.cjs

### Deferred Ideas (OUT OF SCOPE)
- Fork init override extraction (cmdInitExecutePhase, cmdInitPlanPhase, cmdInitTodos, cmdInitProgress) -- Phase 48
- Fork command override extraction (cmdForkFrontmatterValidate, cmdForkListTodos, cmdForkConfigSet, cmdForkConfigGet) -- Phase 48
- Frontmatter.cjs signal schema extension (tiered validation) -- Phase 48
- Init.cjs --include flag extension -- Phase 48
- Upstream test adoption (node:test files that test module exports directly) -- deferred requirement FUT-03
</user_constraints>

## Summary

This phase extracts 5 coherent command groups from the 3,200-line `gsd-tools.cjs` monolith into dedicated CommonJS modules in `get-shit-done/bin/lib/`. The extraction is structurally straightforward: all 5 groups are leaf-node modules with dependencies flowing strictly downward to `core.cjs` and `frontmatter.cjs`, with zero cross-module dependencies between them. Each module owns a complete command domain (sensors, backlog, manifest, automation, health-probe) with its associated helpers and constants.

Research verified all five critical assumptions from CONTEXT.md. The four duplicate frontmatter helpers in `gsd-tools.cjs` are byte-identical to `frontmatter.cjs` exports, making dead code removal safe. Tests invoke `gsd-tools.cjs` as a subprocess exclusively -- no test directly imports from any module. The `validateFieldType`/`validateFieldEnum` functions (CONTEXT.md stated they stay inline for `cmdForkFrontmatterValidate`) are actually used ONLY by manifest commands, not by the fork frontmatter validate override. This means they can move entirely to `manifest.cjs`, reducing the residual gsd-tools.cjs further.

After extraction, `gsd-tools.cjs` drops from 3,200 to approximately 1,237 lines containing: the requires block (46 lines), fork init overrides (342 lines), fork command overrides with FORK_SIGNAL_SCHEMA (229 lines), and the CLI router (620 lines). The 5 new modules total approximately 1,754 lines. The installer's recursive `copyWithPathReplacement` function handles `lib/` subdirectories automatically.

**Primary recommendation:** Extract all 5 modules in 2 plans (3 modules + 2 modules), following Phase 46's proven pattern of copy-functions, add-requires, rewire-dispatcher, verify-tests, remove-dead-code within each plan.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js CommonJS | 22.x | Module system (`require`/`module.exports`) | Established project convention; all 11 upstream modules use CJS |
| fs, path, os | Node built-in | File I/O, path resolution, OS info | Standard Node.js modules, no external dependencies |
| child_process | Node built-in | execSync for git operations | Used by manifest auto-detect and automation regime-change |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| core.cjs | upstream | Shared utilities (error, output, etc.) | All 5 new modules require it |
| frontmatter.cjs | upstream | YAML frontmatter parsing/serialization | backlog.cjs requires it for extractFrontmatter/reconstructFrontmatter |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CJS require | ESM import | Would break compatibility with all 11 existing upstream modules |
| Inline validators | core.cjs export | Adds fork-specific functions to upstream module; better kept in manifest.cjs |

**Installation:** No new dependencies. This is purely internal refactoring.

## Architecture Patterns

### Target Project Structure (after extraction)
```
get-shit-done/bin/
  gsd-tools.cjs          # CLI entry point + dispatcher (~1,237 lines)
  lib/
    core.cjs              # Shared utilities (upstream + 4 fork helpers)
    state.cjs             # State management (upstream)
    phase.cjs             # Phase operations (upstream)
    roadmap.cjs           # Roadmap operations (upstream)
    verify.cjs            # Verification (upstream)
    config.cjs            # Config operations (upstream)
    template.cjs          # Template operations (upstream)
    milestone.cjs         # Milestone operations (upstream)
    commands.cjs          # General commands (upstream)
    init.cjs              # Init operations (upstream)
    frontmatter.cjs       # Frontmatter YAML parsing (upstream)
    sensors.cjs           # NEW: sensor discovery & blind spots (~145 lines)
    backlog.cjs           # NEW: backlog CRUD & index (~330 lines)
    manifest.cjs          # NEW: manifest diff/validate/migrate (~410 lines)
    automation.cjs        # NEW: automation levels/locks/events (~402 lines)
    health-probe.cjs      # NEW: signal metrics/density/watchdog (~467 lines)
```

### Pattern 1: Module Extraction (established in Phase 46)
**What:** Move functions from monolith to dedicated module, update requires, rewire dispatcher
**When to use:** Every module extraction in this phase
**Example:**
```javascript
// Source: Phase 46 established pattern (core.cjs fork helpers)

// In new module (e.g., sensors.cjs):
const fs = require('fs');
const path = require('path');
const { error, output } = require('./core.cjs');

function cmdSensorsList(cwd, raw) {
  // ... function body (copied verbatim from gsd-tools.cjs)
}

function cmdSensorsBlindSpots(cwd, sensorName, raw) {
  // ... function body (copied verbatim from gsd-tools.cjs)
}

module.exports = {
  cmdSensorsList,
  cmdSensorsBlindSpots,
};
```

### Pattern 2: Dispatcher Rewiring (established in Phase 46)
**What:** Update CLI router `case` blocks to call module functions instead of inline functions
**When to use:** After each module is extracted
**Example:**
```javascript
// In gsd-tools.cjs CLI router, BEFORE extraction:
case 'sensors': {
  if (subcommand === 'list') {
    cmdSensorsList(cwd, raw);
  }
}

// AFTER extraction:
const sensors = require('./lib/sensors.cjs');

case 'sensors': {
  if (subcommand === 'list') {
    sensors.cmdSensorsList(cwd, raw);
  }
}
```

### Pattern 3: Frontmatter Import Replacement
**What:** Replace bare `extractFrontmatter(content)` calls with `frontmatter.extractFrontmatter(content)`
**When to use:** For backlog.cjs (which calls extractFrontmatter 6 times, reconstructFrontmatter 3 times)
**Example:**
```javascript
// In backlog.cjs:
const frontmatter = require('./frontmatter.cjs');

function readBacklogItems(cwd, isGlobal) {
  // ...
  const fm = frontmatter.extractFrontmatter(content);  // was: extractFrontmatter(content)
  // ...
}
```

### Pattern 4: validateFieldType/Enum in manifest.cjs
**What:** Move validateFieldType and validateFieldEnum into manifest.cjs as private helpers
**When to use:** During manifest.cjs extraction
**Example:**
```javascript
// In manifest.cjs (private, not exported):
function validateFieldType(value, schema) {
  if (value === undefined || value === null) return true;
  const expectedType = schema.type;
  if (expectedType === 'string') return typeof value === 'string';
  if (expectedType === 'number') return typeof value === 'number';
  if (expectedType === 'boolean') return typeof value === 'boolean';
  if (expectedType === 'array') return Array.isArray(value);
  if (expectedType === 'object') return typeof value === 'object' && !Array.isArray(value);
  return true;
}

function validateFieldEnum(value, schema) {
  if (!schema.enum || value === undefined) return true;
  return schema.enum.includes(value);
}
```

### Anti-Patterns to Avoid
- **Cross-module require between new modules:** New modules must NOT require each other. All shared code goes through core.cjs or frontmatter.cjs. No sensors.cjs requiring backlog.cjs, ever.
- **Modifying function signatures during extraction:** Copy function bodies verbatim. Do not rename parameters, change logic, or "improve" code. Behavioral equivalence is the gate.
- **Extracting fork command overrides:** `cmdForkFrontmatterValidate`, `cmdForkListTodos`, `cmdForkConfigSet`, `cmdForkConfigGet` stay inline in gsd-tools.cjs. They are Phase 48 scope.
- **Extracting fork init overrides:** `cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitTodos`, `cmdInitProgress` stay inline. Phase 48 scope.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Frontmatter parsing in backlog.cjs | Custom YAML parser | `frontmatter.extractFrontmatter()` | Already exported from frontmatter.cjs; byte-identical to the inline copy being removed |
| Module boilerplate | Fancy module wrapper pattern | Simple `require` + `module.exports = {}` | Matches all 11 existing upstream modules exactly |
| Circular dependency detection | Manual dependency graph traversal | Architecture ensures acyclic: all 5 modules are leaf nodes requiring only core.cjs/frontmatter.cjs | Verified by code analysis -- no cross-module calls exist |

**Key insight:** This is a mechanical extraction, not a design exercise. Every function moves verbatim. The value is in organizational clarity, not code improvement.

## Common Pitfalls

### Pitfall 1: Missing regenerateBacklogIndex in backlog.cjs
**What goes wrong:** CONTEXT.md lists `resolveBacklogDir` and `readBacklogItems` as helpers for backlog.cjs but omits `regenerateBacklogIndex`, which is called by `cmdBacklogAdd`, `cmdBacklogUpdate`, and `cmdBacklogPromote`.
**Why it happens:** `regenerateBacklogIndex` is a "silent helper" (no `output()` call pattern) that's easy to miss in function inventories.
**How to avoid:** Extract `regenerateBacklogIndex` (lines 631-675) into backlog.cjs along with the other helpers. It is NOT a command -- it is a private helper called by three commands.
**Warning signs:** Test failures in backlog add/update/promote if this function is missing.

### Pitfall 2: Forgetting to update cmdForkFrontmatterValidate to use frontmatter module
**What goes wrong:** After removing the duplicate `extractFrontmatter` from gsd-tools.cjs, the inline `cmdForkFrontmatterValidate` (line 2387) calls `extractFrontmatter(content)` which no longer exists.
**Why it happens:** The function is in the "stays inline" section, so it's easy to forget that it references a function being removed.
**How to avoid:** Change line 2387 from `extractFrontmatter(content)` to `frontmatter.extractFrontmatter(content)`. The `frontmatter` module is already required at line 40.
**Warning signs:** `ReferenceError: extractFrontmatter is not defined` when running `frontmatter validate --schema signal`.

### Pitfall 3: validateFieldType/Enum assumed to stay inline
**What goes wrong:** CONTEXT.md states "validateFieldType/validateFieldEnum (lines 258-272): Used by inline cmdForkFrontmatterValidate" but code analysis shows cmdForkFrontmatterValidate does NOT call these functions. They are used ONLY by manifest commands (cmdManifestDiffConfig and cmdManifestValidate).
**Why it happens:** The CONTEXT.md made an incorrect association. These validators handle manifest schema type/enum checking, not signal schema validation.
**How to avoid:** Move validateFieldType and validateFieldEnum to manifest.cjs as private helpers (not exported). Remove them from gsd-tools.cjs entirely. This reduces the residual file by 15 lines.
**Warning signs:** If left inline in gsd-tools.cjs, they become dead code after manifest extraction.

### Pitfall 4: Partial extraction leaves orphaned function calls
**What goes wrong:** Extracting command functions but forgetting their helper dependencies (e.g., extracting cmdBacklogAdd without regenerateBacklogIndex, or extracting cmdManifestDiffConfig without KNOWN_TOP_LEVEL_KEYS).
**Why it happens:** Command functions call helpers that are defined elsewhere in the file.
**How to avoid:** For each command function, trace ALL function/constant references. The dependency map is:
  - sensors.cjs: error, output (core.cjs)
  - backlog.cjs: error, output, generateSlugInternal (core.cjs) + extractFrontmatter, reconstructFrontmatter (frontmatter.cjs) + resolveBacklogDir, readBacklogItems, regenerateBacklogIndex (internal)
  - manifest.cjs: error, output, loadManifest, loadProjectConfig, atomicWriteJson (core.cjs) + KNOWN_TOP_LEVEL_KEYS, coerceValue, formatMigrationEntry, validateFieldType, validateFieldEnum (internal) + execSync (child_process)
  - automation.cjs: error, output, loadProjectConfig (core.cjs) + FEATURE_CAPABILITY_MAP (internal) + execSync (child_process)
  - health-probe.cjs: output, loadManifest (core.cjs) + resolveKBDir, findLatestRegimeChange, collectRegimeSignals (internal)
**Warning signs:** `ReferenceError` or `TypeError` at runtime.

### Pitfall 5: Dispatcher routing mismatch after extraction
**What goes wrong:** The CLI router's `case` blocks still call bare function names (e.g., `cmdBacklogAdd(...)`) instead of module-qualified names (e.g., `backlog.cmdBacklogAdd(...)`).
**Why it happens:** Updating function bodies to new modules but forgetting to update the router.
**How to avoid:** Update EVERY call in the router switch/case for extracted commands. There are exactly:
  - sensors: 2 calls to update
  - backlog: 7 calls to update
  - manifest: 6 calls to update
  - automation: 7 calls to update
  - health-probe: 3 calls to update
  Total: 25 dispatcher calls to rewire.
**Warning signs:** Tests fail with `ReferenceError: cmdXxx is not defined`.

### Pitfall 6: Editing .claude/ instead of source directories
**What goes wrong:** Creating new modules in `.claude/get-shit-done-reflect/bin/lib/` instead of `get-shit-done/bin/lib/`.
**Why it happens:** Phase 22 post-mortem documented this exact mistake. The `.claude/` directory is the install target, not the source.
**How to avoid:** Always edit `get-shit-done/bin/lib/`. Run `node bin/install.js --local` after to sync.
**Warning signs:** Changes disappear after next install.

## Code Examples

### Module Template (for each new module)
```javascript
// Source: Phase 46 established pattern

/**
 * [ModuleName] -- [description]
 */

const fs = require('fs');
const path = require('path');
const { error, output /* , other needed core imports */ } = require('./core.cjs');
// const frontmatter = require('./frontmatter.cjs');  // only if needed

// ─── Constants ────────────────────────────────────────────────────────────────

// [Move constants here if applicable]

// ─── Helpers ──────────────────────────────────────────────────────────────────

// [Move private helpers here]

// ─── Commands ─────────────────────────────────────────────────────────────────

// [Move command functions here, verbatim]

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  // Export all command functions
  // Export FEATURE_CAPABILITY_MAP for automation.cjs (per MOD-07)
  // Do NOT export private helpers unless explicitly required
};
```

### Require Block Update in gsd-tools.cjs
```javascript
// Add after line 40 (const frontmatter = require('./lib/frontmatter.cjs')):
const sensors = require('./lib/sensors.cjs');
const backlog = require('./lib/backlog.cjs');
const manifest = require('./lib/manifest.cjs');
const automation = require('./lib/automation.cjs');
const healthProbe = require('./lib/health-probe.cjs');
```

### Dispatcher Rewiring Example (sensors)
```javascript
// Source: Direct observation of current router (lines 3168-3179)

// BEFORE:
case 'sensors': {
  const subcommand = args[1];
  if (subcommand === 'list') {
    cmdSensorsList(cwd, raw);
  } else if (subcommand === 'blind-spots') {
    const sensorName = args[2] || undefined;
    cmdSensorsBlindSpots(cwd, sensorName, raw);
  } else {
    error('Unknown sensors subcommand. Available: list, blind-spots');
  }
  break;
}

// AFTER:
case 'sensors': {
  const subcommand = args[1];
  if (subcommand === 'list') {
    sensors.cmdSensorsList(cwd, raw);
  } else if (subcommand === 'blind-spots') {
    const sensorName = args[2] || undefined;
    sensors.cmdSensorsBlindSpots(cwd, sensorName, raw);
  } else {
    error('Unknown sensors subcommand. Available: list, blind-spots');
  }
  break;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| All fork code in single gsd-tools.cjs (3,200 lines) | 11 upstream modules + dispatcher | Phase 46 (2026-03-20) | Established module pattern |
| Inline loadManifest/loadProjectConfig/atomicWriteJson | Exported from core.cjs | Phase 46 (2026-03-20) | Fork modules can now import shared helpers |

**Deprecated/outdated:**
- Inline frontmatter helpers in gsd-tools.cjs: duplicates of frontmatter.cjs. Byte-identical, safe to remove.
- Inline validateFieldType/Enum staying for cmdForkFrontmatterValidate: INCORRECT per CONTEXT.md. These are used only by manifest commands.

## Open Questions

### Resolved

- **Q1. Are the duplicate frontmatter helpers identical?** YES. Byte-for-byte diff of `extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter`, and `parseMustHavesBlock` between gsd-tools.cjs (lines 44-256) and frontmatter.cjs (lines 11-223) produces zero differences. Dead code removal is safe.

- **Q2. Does cmdForkFrontmatterValidate need its own extractFrontmatter?** NO. It calls `extractFrontmatter(content)` at line 2387. After dead code removal, change this to `frontmatter.extractFrontmatter(content)` since `frontmatter` is already required at line 40. The function contracts are identical (verified via byte-identical diff).

- **Q3. What is the expected line count after extraction?** ~1,237 lines. Breakdown: requires block (46) + fork init overrides (342) + FORK_SIGNAL_SCHEMA + fork command overrides (229) + CLI router (620). Note: CONTEXT.md line counts for validateFieldType/Enum staying inline were based on incorrect usage analysis; they move to manifest.cjs, saving an additional 15 lines vs. the CONTEXT.md estimate of ~1,200.

- **Q4. Should FEATURE_CAPABILITY_MAP be exported from automation.cjs?** YES, per MOD-07 requirement. Currently used only by `cmdAutomationResolveLevel` internally, but exporting it enables future consumers (Phase 53 deep integration) without requiring a new extraction.

- **Q5. (Discovered) Does cmdAutomationRegimeChange use resolveKBDir?** NO. It has its own inline KB path resolution (lines 1610-1617). This confirms `resolveKBDir` belongs exclusively to health-probe.cjs (assumption A3).

- **Q6. (Discovered) Is regenerateBacklogIndex missing from CONTEXT.md module assignment?** YES. CONTEXT.md lists `resolveBacklogDir` and `readBacklogItems` as backlog helpers but omits `regenerateBacklogIndex` (lines 631-675), which is a private helper called by `cmdBacklogAdd`, `cmdBacklogUpdate`, and `cmdBacklogPromote`.

- **Q7. (Discovered) Are validateFieldType/Enum used by cmdForkFrontmatterValidate?** NO. CONTEXT.md states they stay inline "Used by inline cmdForkFrontmatterValidate" but code analysis shows they are used exclusively by `cmdManifestDiffConfig` (lines 1069, 1077) and `cmdManifestValidate` (lines 1130, 1138). They should move to manifest.cjs.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| None identified | -- | -- |

### Still Open
- None. All research questions resolved through code analysis.

## Discretion Recommendations

### Extraction Order: 2 plans, 3+2 modules

**Recommendation:** Split into 2 plans based on complexity.

**Plan 1 (3 smaller modules + dead code removal):**
- sensors.cjs (~145 lines) -- simplest, good warmup
- backlog.cjs (~330 lines) -- moderate, tests frontmatter.cjs integration
- health-probe.cjs (~467 lines) -- moderate, self-contained KB helpers
- Remove duplicate frontmatter helpers (dead code)
- Update cmdForkFrontmatterValidate to use frontmatter module

**Plan 2 (2 larger modules with shared constants):**
- manifest.cjs (~410 lines) -- includes KNOWN_TOP_LEVEL_KEYS, coerceValue, formatMigrationEntry, validateFieldType, validateFieldEnum
- automation.cjs (~402 lines) -- includes FEATURE_CAPABILITY_MAP

**Rationale:** Plans 1 and 2 are roughly equal in complexity (~3 tasks each targeting ~40-50% context). Plan 1 handles the dead code removal which must happen after backlog.cjs is extracted (backlog uses the frontmatter helpers). Plan 2 handles the modules that share the constants section (lines 274-347).

### Internal Organization

Each module should follow the upstream convention observed in core.cjs and frontmatter.cjs:
1. Module docstring
2. `require` statements
3. Constants (if any)
4. Private helpers (if any)
5. Command functions
6. `module.exports` block at the end

### cmdForkFrontmatterValidate: Use frontmatter module

**Recommendation:** Update `cmdForkFrontmatterValidate` line 2387 from `extractFrontmatter(content)` to `frontmatter.extractFrontmatter(content)`. This enables complete removal of all 4 duplicate frontmatter functions, saving 213 lines.

## Verified Dependency Map

### Per-Module Dependencies (verified via code grep)

| Module | core.cjs imports | frontmatter.cjs imports | Node built-ins | Internal helpers |
|--------|-------------------|-------------------------|----------------|------------------|
| sensors.cjs | error, output | -- | fs, path | -- |
| backlog.cjs | error, output, generateSlugInternal | extractFrontmatter, reconstructFrontmatter | fs, path, os | resolveBacklogDir, readBacklogItems, regenerateBacklogIndex |
| manifest.cjs | error, output, loadManifest, loadProjectConfig, atomicWriteJson | -- | fs, path, child_process | KNOWN_TOP_LEVEL_KEYS, coerceValue, formatMigrationEntry, validateFieldType, validateFieldEnum |
| automation.cjs | error, output, loadProjectConfig | -- | fs, path, os, child_process | FEATURE_CAPABILITY_MAP |
| health-probe.cjs | output, loadManifest | -- | fs, path, os | resolveKBDir, findLatestRegimeChange, collectRegimeSignals |

### Acyclicity Proof

All 5 new modules are leaf nodes:
- They depend on core.cjs and/or frontmatter.cjs (upstream modules)
- Neither core.cjs nor frontmatter.cjs depends on any of the 5 new modules
- No new module depends on any other new module
- Cross-module calls: zero (verified by grep of all function names across all extraction ranges)

## Verification Checklist

After extraction, verify:
1. `npm test` -- 350 vitest tests pass (currently 350 passed + 4 todo)
2. `npm run test:upstream` -- 174 upstream tests pass
3. `npm run test:upstream:fork` -- 10 fork tests pass
4. `node bin/install.js --local` -- installs successfully
5. `ls .claude/get-shit-done-reflect/bin/lib/` -- shows 16 modules (11 upstream + 5 fork)
6. `wc -l get-shit-done/bin/gsd-tools.cjs` -- approximately 1,237 lines (down from 3,200)
7. No circular dependency warnings at require-time (Node.js would warn to stderr)

## Sources

### Primary (HIGH confidence)
- Direct code analysis of `get-shit-done/bin/gsd-tools.cjs` (3,200 lines, read in full)
- Direct code analysis of `get-shit-done/bin/lib/frontmatter.cjs` (300 lines, read in full)
- Direct code analysis of `get-shit-done/bin/lib/core.cjs` (exports block)
- Byte-for-byte diff of 4 frontmatter helpers between gsd-tools.cjs and frontmatter.cjs (all identical)
- Phase 46 CONTEXT.md -- established patterns and constraints
- Test suite execution: 534 tests passing (350 + 174 + 10)
- Installer code analysis (`bin/install.js` copyWithPathReplacement recursion)

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`). Scanned 128 entries (127 signals, 1 spike). No lessons or relevant spikes for this phase's domain (internal module extraction). The single spike (`spk-2026-03-01-claude-code-session-log-location`) addresses Claude Code logging, not module architecture.

Relevant signals noted but not directly applicable:
- `SIG-260222-008-known-top-level-keys-deduplication`: Documents that KNOWN_TOP_LEVEL_KEYS has deduplication concerns. Addressed by moving it exclusively to manifest.cjs.
- `SIG-260222-009-reconstructfrontmatter-null-skipping-footgun`: Documents a null-handling edge case in reconstructFrontmatter. Not relevant here since we use the upstream version from frontmatter.cjs verbatim.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no external dependencies, purely internal refactoring
- Architecture: HIGH -- all dependencies traced via code analysis, acyclicity verified
- Pitfalls: HIGH -- discovered 3 CONTEXT.md inaccuracies through code verification (regenerateBacklogIndex omission, validateFieldType/Enum misattribution, frontmatter.extractFrontmatter call site)

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (stable -- internal refactoring, no external API changes)
