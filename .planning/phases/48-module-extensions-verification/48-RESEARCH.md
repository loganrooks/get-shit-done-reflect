# Phase 48: Module Extensions & Verification - Research

**Researched:** 2026-03-20
**Domain:** CJS module extension, function signature unification, behavioral equivalence verification
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Signal schema integration (MOD-09):**
- Move `FORK_SIGNAL_SCHEMA` from gsd-tools.cjs into frontmatter.cjs
- Extend `FRONTMATTER_SCHEMAS` to include the signal schema entry
- Extend `cmdFrontmatterValidate` to handle tiered validation (conditional/recommended fields) when processing the signal schema
- The output contract for signal validation includes `warnings` array alongside `valid`/`missing`/`present` -- this is additive to the upstream format
- Remove `cmdForkFrontmatterValidate` from gsd-tools.cjs after integration
- The dispatcher's `frontmatter validate --schema signal` route goes directly to `frontmatter.cmdFrontmatterValidate` instead of fork override

**Init function consolidation (MOD-10):**
- Replace upstream's 3-param init functions in init.cjs with the fork's 4-param versions that accept `includes`
- Functions to move: `cmdInitExecutePhase`, `cmdInitPlanPhase`, `cmdInitProgress`, `cmdInitTodos`
- init.cjs gains `require('./core.cjs')` for `parseIncludeFlag`, `safeReadFile`, `toPosixPath` (already has most core imports)
- The dispatcher calls `init.cmdInitExecutePhase(cwd, phase, includes, raw)` directly instead of local overrides
- Remove fork init overrides from gsd-tools.cjs

### Claude's Discretion
- Whether to refactor the existing upstream init functions or replace them wholesale with the fork's enriched versions
- How to organize the signal schema within frontmatter.cjs (inline object vs separate declaration)
- Whether backward_compat logic warrants its own helper function or stays inline in the validate function
- Whether to batch all extractions in one plan or split frontmatter/init/command-overrides across plans

### Deferred Ideas (OUT OF SCOPE)
- Config migration or depth-to-granularity rename (Phase 49)
- Migration test hardening (Phase 50)
- New feature adoption from upstream (Phase 52)
- Any new commands or capabilities
</user_constraints>

## Summary

Phase 48 completes the modularization arc (Phases 45-48) by absorbing the remaining fork overrides from gsd-tools.cjs into their natural module homes. There are three distinct extraction targets: (1) signal schema and tiered validation into frontmatter.cjs (MOD-09), (2) enriched init functions into init.cjs (MOD-10), and (3) fork command overrides (list-todos, config-set, config-get) into commands.cjs and config.cjs respectively. After all extractions, gsd-tools.cjs should contain only the CLI router (~619 lines).

Detailed code analysis reveals that the fork init overrides are NOT strict supersets of upstream -- they DROP several upstream fields (`phase_req_ids`, `nyquist_validation_enabled`, static file paths like `state_path`/`roadmap_path`). The merge strategy must PRESERVE these upstream fields and ADD the fork's `--include` content loading on top. The frontmatter signal schema integration is straightforward because `cmdForkFrontmatterValidate` already delegates non-signal schemas to the upstream function -- the logic simply moves into the upstream function as a schema-specific code path. The 534 existing tests (350 vitest + 174 upstream + 10 fork) all invoke gsd-tools.cjs via subprocess and are insulated from module-internal changes, making behavioral equivalence verification inherently provided by the existing test suite.

**Primary recommendation:** Replace upstream init functions with merged versions (upstream base output + fork's `includes` support), move signal schema into frontmatter.cjs as a separate `FORK_SIGNAL_SCHEMA` constant with tiered validation handled in the existing `cmdFrontmatterValidate`, and extend commands.cjs/config.cjs with fork command overrides. Split into 2 plans: Plan 01 for frontmatter + init extractions (MOD-09/MOD-10), Plan 02 for command override extractions + behavioral equivalence verification (MOD-11).

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | 18+ | Runtime for gsd-tools.cjs | Project standard, test:upstream uses node --test |
| CommonJS | N/A | Module system for all lib/*.cjs files | Upstream convention, all modules use require/module.exports |
| vitest | Current | 350 unit/integration tests | Project test framework |
| node:test | Built-in | 184 upstream/fork tests | Upstream test convention |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| child_process | Built-in | All tests invoke gsd-tools.cjs via execSync | Subprocess test pattern |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Wholesale function replacement | Refactor upstream in-place | Replacement is simpler but risks dropping upstream fields; refactoring is safer |

**Installation:** No new packages needed. All work is pure refactoring within existing modules.

## Architecture Patterns

### Current Module Structure (Post-Phase 47)
```
get-shit-done/bin/
  gsd-tools.cjs          # 1,239 lines: fork overrides (570 lines) + CLI router (619 lines)
  lib/
    core.cjs             # Shared utilities + fork helpers (parseIncludeFlag, loadManifest, etc.)
    init.cjs             # 710 lines: 12 upstream init functions
    frontmatter.cjs      # 299 lines: parsing engine + CRUD + upstream-only validate
    commands.cjs         # 667 lines: standalone utility commands
    config.cjs           # 183 lines: config CRUD with VALID_CONFIG_KEYS allowlist
    state.cjs            # State management
    phase.cjs            # Phase operations
    roadmap.cjs          # Roadmap operations
    verify.cjs           # Verification commands
    template.cjs         # Template operations
    milestone.cjs        # Milestone operations
    sensors.cjs          # Fork: sensor commands (Phase 47)
    backlog.cjs          # Fork: backlog commands (Phase 47)
    health-probe.cjs     # Fork: health probe commands (Phase 47)
    manifest.cjs         # Fork: manifest operations (Phase 47)
    automation.cjs       # Fork: automation operations (Phase 47)
```

### Target Module Structure (Post-Phase 48)
```
get-shit-done/bin/
  gsd-tools.cjs          # ~619 lines: CLI router ONLY (pure dispatcher)
  lib/
    frontmatter.cjs      # ~390 lines: + FORK_SIGNAL_SCHEMA + tiered validation
    init.cjs             # ~710 lines: upstream functions replaced with merged versions
    commands.cjs         # ~710 lines: + cmdForkListTodos
    config.cjs           # ~240 lines: + cmdForkConfigSet/cmdForkConfigGet
    (all other modules unchanged)
```

### Pattern 1: Schema-Specific Validation Code Path
**What:** Extend `cmdFrontmatterValidate` to dispatch to different validation logic based on schema type
**When to use:** When signal schema (with tiered fields) is requested vs plan/summary/verification schemas (required-only)
**Example:**
```javascript
// Source: gsd-tools.cjs lines 276-287 (upstream) + 413-492 (fork signal)
function cmdFrontmatterValidate(cwd, filePath, schemaName, raw) {
  if (!filePath || !schemaName) { error('file and schema required'); }
  const schema = FRONTMATTER_SCHEMAS[schemaName];
  if (!schema) { error(`Unknown schema: ${schemaName}. Available: ${Object.keys(FRONTMATTER_SCHEMAS).join(', ')}`); }

  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }
  const fm = extractFrontmatter(content);

  // Required field checks (all schemas)
  const missing = schema.required.filter(f => fm[f] === undefined);
  const present = schema.required.filter(f => fm[f] !== undefined);

  // Tiered validation (signal schema only)
  if (schema.conditional || schema.recommended) {
    // ... tiered validation logic (moved from cmdForkFrontmatterValidate)
    const warnings = []; // conditionalWarnings + recommendedMissing
    const allMissing = [...missing, ...conditionalMissing];
    output({ valid: allMissing.length === 0, missing: allMissing, present, warnings, schema: schemaName },
           raw, allMissing.length === 0 ? 'valid' : 'invalid');
    return;
  }

  // Simple validation (plan/summary/verification schemas)
  output({ valid: missing.length === 0, missing, present, schema: schemaName },
         raw, missing.length === 0 ? 'valid' : 'invalid');
}
```

### Pattern 2: Merged Init Function (Upstream + Fork)
**What:** Replace upstream 3-param init functions with merged versions that include all upstream fields PLUS fork's `--include` content loading
**When to use:** For cmdInitExecutePhase, cmdInitPlanPhase, cmdInitProgress
**Critical detail:** The fork versions DROP upstream fields. The merge must KEEP them.

```javascript
// Merged cmdInitExecutePhase: upstream base + fork includes
function cmdInitExecutePhase(cwd, phase, includes, raw) {
  // ... all upstream field computation (config, phaseInfo, milestone, roadmapPhase)
  const result = {
    // ALL upstream fields preserved (executor_model, verifier_model, commit_docs, etc.)
    // Including phase_req_ids and state_path/roadmap_path/config_path that fork dropped
    ...upstreamFields,
  };

  // Fork addition: include file contents if requested via --include
  if (includes.has('state')) {
    result.state_content = safeReadFile(path.join(cwd, '.planning', 'STATE.md'));
  }
  // ... etc

  output(result, raw);
}
```

### Pattern 3: Module Extension via module.exports (Phase 46 established)
**What:** Add fork-specific exports to upstream modules using `module.exports.funcName = function` after the upstream exports block
**When to use:** For commands.cjs and config.cjs fork extensions
**Example:**
```javascript
// At end of commands.cjs, after existing module.exports = { ... }
module.exports.cmdForkListTodos = function cmdForkListTodos(cwd, area, raw) {
  // ... enriched list-todos with priority/source/status
};
```

### Anti-Patterns to Avoid
- **Wholesale replacement without field audit:** The fork init functions DROP upstream fields (phase_req_ids, nyquist_validation_enabled, static paths). Replacing without merging breaks upstream consumers.
- **Modifying the upstream exports block:** Use `module.exports.funcName =` extension pattern (Phase 46 convention) to avoid merge conflicts.
- **Big-bang extraction:** Extract and test incrementally. Moving all overrides at once risks hard-to-diagnose behavioral changes.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | New YAML parser | Existing `extractFrontmatter()` in frontmatter.cjs | Battle-tested, handles all project YAML patterns |
| Include flag parsing | Inline flag parsing | `parseIncludeFlag()` from core.cjs | Already extracted in Phase 46, handles all edge cases |
| Test behavioral equivalence | Custom diff tool | Existing 534 tests (all subprocess-based) | They already verify exact CLI output contracts |

**Key insight:** The test suite IS the behavioral equivalence verification. All 534 tests invoke gsd-tools.cjs via subprocess (`execSync`), meaning they test the exact same interface end users consume. If tests pass, behavioral equivalence is proven.

## Common Pitfalls

### Pitfall 1: Dropping Upstream Fields During Init Function Merge
**What goes wrong:** Fork's cmdInitPlanPhase drops `nyquist_validation_enabled`, `phase_req_ids`, `state_path`, `roadmap_path`, `requirements_path`. Fork's cmdInitExecutePhase drops `phase_req_ids`, `state_path`, `roadmap_path`, `config_path`. Replacing upstream wholesale with fork versions silently removes these fields.
**Why it happens:** The fork versions were written to include only what fork agents consume. Upstream agents may consume the dropped fields.
**How to avoid:** Start from upstream function, ADD fork's `includes` parameter and content loading. Do NOT start from fork function and try to add back missing fields.
**Warning signs:** Tests that check for `phase_req_ids` or `nyquist_validation_enabled` or static path fields would fail.

### Pitfall 2: padded_phase Divergence
**What goes wrong:** Fork's cmdInitPlanPhase uses `.padStart(2, '0')` for padded_phase. Upstream uses `normalizePhaseName()` which handles letters and decimals (e.g., "12A", "12.1").
**Why it happens:** Fork was written before upstream added multi-format phase numbering.
**How to avoid:** Use upstream's `normalizePhaseName()` in the merged version. It is strictly more capable.
**Warning signs:** Phase numbers with letters or decimals (e.g., "12A", "12.1") would produce wrong padded_phase.

### Pitfall 3: Config-Set Allowlist vs Permissive
**What goes wrong:** Upstream's `config.cmdConfigSet` enforces a `VALID_CONFIG_KEYS` allowlist. Fork's `cmdForkConfigSet` is permissive (accepts any key path). Moving fork's version into config.cjs would break the allowlist. Keeping upstream's version would block fork custom fields (health_check, devops, gsd_reflect_version).
**Why it happens:** Fork needs to set arbitrary keys for fork-specific config fields not in upstream's allowlist.
**How to avoid:** The dispatcher must route `config-set` to the fork's permissive version (`cmdForkConfigSet`), not to the upstream's restrictive version. Add it to config.cjs as a separate export alongside the upstream version. The dispatcher switches between them.
**Warning signs:** `config-set health_check.frequency milestone-only` would error with "Unknown config key" if routed to upstream's version.

### Pitfall 4: Config-Get Error Handling Divergence
**What goes wrong:** Upstream's `cmdConfigGet` calls `error()` (exits with error code) when key not found. Fork's `cmdForkConfigGet` calls `output()` with `{found: false}` (exits cleanly with JSON). These have different exit codes and output contracts.
**Why it happens:** Fork needed graceful handling for optional config keys; upstream assumes all config keys exist.
**How to avoid:** The fork version is the one callers use. Route to it consistently. If extending config.cjs, keep both functions available.
**Warning signs:** Scripts or agents that check the exit code of config-get would break if the wrong version is used.

### Pitfall 5: Circular Dependencies in init.cjs
**What goes wrong:** init.cjs already requires core.cjs. If init.cjs also needs frontmatter.cjs (it does not currently), a chain could form. More critically, gsd-tools.cjs requires init.cjs, so init.cjs must NOT require gsd-tools.cjs.
**Why it happens:** During extraction, easy to accidentally import from the wrong module.
**How to avoid:** Verify the dependency graph is acyclic: core.cjs -> init.cjs -> (nothing new). The fork init functions only need core.cjs imports (safeReadFile, parseIncludeFlag) which init.cjs already has.
**Warning signs:** Node.js will silently provide incomplete exports for circular requires in CJS. Tests may fail with "X is not a function".

### Pitfall 6: Forgetting to Update CLI Router References
**What goes wrong:** After moving functions to modules, the CLI router in gsd-tools.cjs still calls the old local function names instead of module-qualified names.
**Why it happens:** Router references are separate from function definitions. Easy to update one without the other.
**How to avoid:** After each extraction, grep gsd-tools.cjs for any remaining references to the removed local function. The router should change from `cmdInitExecutePhase(...)` to `init.cmdInitExecutePhase(...)`.
**Warning signs:** "cmdInitExecutePhase is not defined" runtime errors.

## Code Examples

### Example 1: Signal Schema Integration into frontmatter.cjs

```javascript
// Source: gsd-tools.cjs lines 392-492 (verified 2026-03-20)
// Add to frontmatter.cjs FRONTMATTER_SCHEMAS:

const FRONTMATTER_SCHEMAS = {
  plan: { required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'] },
  summary: { required: ['phase', 'plan', 'subsystem', 'tags', 'duration', 'completed'] },
  verification: { required: ['phase', 'verified', 'status', 'score'] },
  // Fork addition: signal schema with tiered validation
  signal: {
    required: ['id', 'type', 'project', 'tags', 'created', 'severity', 'signal_type'],
    conditional: [
      {
        when: { field: 'severity', value: 'critical' },
        require: ['evidence'],
        recommend: ['confidence', 'confidence_basis'],
      },
      {
        when: { field: 'severity', value: 'notable' },
        recommend: ['evidence', 'confidence'],
      },
    ],
    backward_compat: { field: 'lifecycle_state' },
    recommended: ['lifecycle_state', 'signal_category', 'confidence', 'confidence_basis'],
    optional: ['triage', 'remediation', 'verification', 'lifecycle_log',
               'recurrence_of', 'phase', 'plan', 'polarity', 'source',
               'occurrence_count', 'related_signals', 'runtime', 'model',
               'gsd_version', 'durability', 'status'],
  },
};
```

### Example 2: Tiered Validation Logic in cmdFrontmatterValidate

```javascript
// Source: gsd-tools.cjs lines 428-491 (verified 2026-03-20)
// Extended cmdFrontmatterValidate handling tiered schemas:

function cmdFrontmatterValidate(cwd, filePath, schemaName, raw) {
  if (!filePath || !schemaName) { error('file and schema required'); }
  const schema = FRONTMATTER_SCHEMAS[schemaName];
  if (!schema) { error(`Unknown schema: ${schemaName}. Available: ${Object.keys(FRONTMATTER_SCHEMAS).join(', ')}`); }
  const fullPath = path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
  const content = safeReadFile(fullPath);
  if (!content) { output({ error: 'File not found', path: filePath }, raw); return; }
  const fm = extractFrontmatter(content);
  const missing = schema.required.filter(f => fm[f] === undefined);
  const present = schema.required.filter(f => fm[f] !== undefined);

  // If schema has tiered fields (conditional/recommended), use tiered validation
  if (schema.conditional || schema.recommended) {
    const conditionalMissing = [];
    const conditionalWarnings = [];
    const backwardCompat = schema.backward_compat && fm[schema.backward_compat.field] === undefined;

    if (schema.conditional) {
      for (const cond of schema.conditional) {
        if (fm[cond.when.field] === cond.when.value) {
          if (cond.require) {
            for (const f of cond.require) {
              if (fm[f] === undefined) {
                if (backwardCompat) {
                  conditionalWarnings.push(`backward_compat: ${f}`);
                } else {
                  conditionalMissing.push(f);
                }
              }
            }
          }
          if (cond.recommend) {
            for (const f of cond.recommend) {
              if (fm[f] === undefined) conditionalWarnings.push(f);
            }
          }
        }
      }
    }

    // Evidence content validation
    if (!backwardCompat && schema.conditional) {
      for (const cond of schema.conditional) {
        if (fm[cond.when.field] === cond.when.value && cond.require) {
          for (const f of cond.require) {
            if (f === 'evidence' && fm.evidence !== undefined) {
              const ev = fm.evidence;
              const hasContent = ev.supporting && ev.supporting.length > 0;
              if (!hasContent) {
                conditionalMissing.push('evidence (empty)');
              }
            }
          }
        }
      }
    }

    const recommendedMissing = [];
    if (schema.recommended) {
      for (const f of schema.recommended) {
        if (fm[f] === undefined) recommendedMissing.push(f);
      }
    }

    const allMissing = [...missing, ...conditionalMissing];
    output({
      valid: allMissing.length === 0,
      missing: allMissing,
      present,
      warnings: [...conditionalWarnings, ...recommendedMissing.map(f => `recommended: ${f}`)],
      schema: schemaName,
    }, raw, allMissing.length === 0 ? 'valid' : 'invalid');
    return;
  }

  // Simple validation (plan/summary/verification)
  output({ valid: missing.length === 0, missing, present, schema: schemaName },
         raw, missing.length === 0 ? 'valid' : 'invalid');
}
```

### Example 3: Merged Init Function Pattern

```javascript
// Source: init.cjs lines 10-81 (upstream) + gsd-tools.cjs lines 50-120 (fork)
// Merge strategy: upstream body + fork's includes parameter + fork's content loading

function cmdInitExecutePhase(cwd, phase, includes, raw) {  // 4-param signature
  // ... ALL upstream field computation (including roadmapPhase, phase_req_ids)
  const result = {
    // ALL upstream fields (executor_model, verifier_model, commit_docs, phase_req_ids, etc.)
    // ALL static path fields (state_path, roadmap_path, config_path)
    // ... exactly as upstream
  };

  // Fork addition: Include file contents if requested via --include
  if (includes && includes.has('state')) {
    result.state_content = safeReadFile(path.join(cwd, '.planning', 'STATE.md'));
  }
  if (includes && includes.has('config')) {
    result.config_content = safeReadFile(path.join(cwd, '.planning', 'config.json'));
  }
  if (includes && includes.has('roadmap')) {
    result.roadmap_content = safeReadFile(path.join(cwd, '.planning', 'ROADMAP.md'));
  }

  output(result, raw);
}
```

### Example 4: CLI Router Update Pattern

```javascript
// Before (gsd-tools.cjs current):
case 'init': {
  const workflow = args[1];
  const includes = parseIncludeFlag(args);
  switch (workflow) {
    case 'execute-phase':
      cmdInitExecutePhase(cwd, args[2], includes, raw);  // local function
      break;
    // ...
  }
}

// After:
case 'init': {
  const workflow = args[1];
  const includes = parseIncludeFlag(args);
  switch (workflow) {
    case 'execute-phase':
      init.cmdInitExecutePhase(cwd, args[2], includes, raw);  // module function
      break;
    // ...
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fork overrides inline in gsd-tools.cjs | Extract to module homes | Phase 46-48 | gsd-tools.cjs becomes pure dispatcher |
| 3-param init functions (upstream) | 4-param with --include (fork) | Phase 46 | Content loading reduces agent I/O |
| Separate cmdForkFrontmatterValidate | Unified cmdFrontmatterValidate with tiered schemas | Phase 48 | Single validate entry point for all schemas |
| VALID_CONFIG_KEYS allowlist (upstream) | Permissive key paths (fork) | Phase 46 | Fork custom fields (health_check, devops) work |

**Deprecated/outdated:**
- `cmdForkFrontmatterValidate` in gsd-tools.cjs: Replaced by extended `frontmatter.cmdFrontmatterValidate` (this phase)
- `cmdForkListTodos` in gsd-tools.cjs: Moved to `commands.cmdForkListTodos` (this phase)
- `cmdForkConfigSet`/`cmdForkConfigGet` in gsd-tools.cjs: Moved to `config.cmdForkConfigSet`/`config.cmdForkConfigGet` (this phase)
- Fork init overrides in gsd-tools.cjs: Replaced by merged functions in `init.cjs` (this phase)

## Open Questions

### Resolved
- **Q1 (fork command overrides scope):** Yes, move them. Phase 48's goal is to leave gsd-tools.cjs as a "pure CLI router." The context explicitly lists `cmdForkListTodos`, `cmdForkConfigSet`, `cmdForkConfigGet` as "What moves to upstream module counterparts." Moving them completes the modularization.
- **Q2 (tiered vs simple validation):** Generalize `cmdFrontmatterValidate` to detect tiered schemas by checking for `conditional`/`recommended` properties on the schema object. Signal uses the tiered code path; plan/summary/verification use the simple path. No special-casing by schema name.
- **Q3 (wholesale replacement):** No. Fork init functions DROP upstream fields. Must MERGE: start from upstream body, add fork's 4th `includes` parameter and content-loading blocks. Verified by diffing both versions.
- **Q4 (expected line count):** gsd-tools.cjs should be ~619 lines (just the CLI router from line 620-1239). All 570 lines of fork overrides (lines 48-618) move to their module homes.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Does any agent consume `nyquist_validation_enabled` from init plan-phase? | Low | Accept-risk: the fork's cmdInitPlanPhase already omits it, so fork agents do not consume it. Merging it back in is additive (no breakage). |
| Should fork list-todos use `toPosixPath` for `path` field like upstream does? | Low | Accept-risk: fork uses `path.join` (OS-native). Inconsistency exists but does not cause failures since all use is on Linux. |

### Still Open
- None. All research questions resolved through direct code analysis.

## Sources

### Primary (HIGH confidence)
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/gsd-tools.cjs` -- full source analysis of fork overrides (lines 48-618) and CLI router (lines 620-1239)
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/frontmatter.cjs` -- 299 lines, upstream validate function and FRONTMATTER_SCHEMAS
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/init.cjs` -- 710 lines, upstream 3-param init functions
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/commands.cjs` -- 667 lines, upstream cmdListTodos
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/config.cjs` -- 183 lines, upstream cmdConfigSet/cmdConfigGet with VALID_CONFIG_KEYS
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/core.cjs` -- parseIncludeFlag, safeReadFile, normalizePhaseName exports
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/gsd-tools.test.js` -- 4,551 lines, 174 upstream tests including init --include and signal validation
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/gsd-tools-fork.test.js` -- 466 lines, 10 fork tests for config-set custom fields and frontmatter roundtrip

### Secondary (MEDIUM confidence)
- `diff` comparison of upstream vs fork init functions -- field-level divergence identified

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure internal refactoring
- Architecture: HIGH -- patterns established by Phase 46-47, all code examined line by line
- Pitfalls: HIGH -- every pitfall identified through actual code diffing, not hypothetical

**Research date:** 2026-03-20
**Valid until:** 2026-04-20 (30 days, stable internal refactoring)

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`), no relevant entries found for this phase's domain. The KB contains 127 signals and 1 spike, none of which relate to module extraction, frontmatter validation, init function signatures, or behavioral equivalence verification patterns.
