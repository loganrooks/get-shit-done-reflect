---
phase: 49-config-migration
verified: 2026-03-27T01:24:11Z
status: gaps_found
score: 8/10 must-haves verified
re_verification: false
gaps:
  - truth: "Shell grep commands in reflect.md search for granularity with coarse|standard|fine enum values"
    status: failed
    reason: "get-shit-done/workflows/reflect.md is updated (VERIFIED), but .claude/get-shit-done-reflect/workflows/reflect.md (the runtime install target Claude reads in sessions) still contains the old depth grep and DEPTH variable. bin/install.js --local was never run after Phase 49."
    artifacts:
      - path: ".claude/get-shit-done-reflect/workflows/reflect.md"
        issue: "Still references depth/DEPTH — lines 20, 90, 100-106 use old depth terminology"
      - path: ".claude/get-shit-done-reflect/references/health-probes/config-validity.md"
        issue: "Still checks `for field in mode depth` and validates against quick|standard|comprehensive enum"
      - path: ".claude/get-shit-done-reflect/references/version-migration.md"
        issue: "Missing 33 lines — the Controlled Exception: Field Renames section is absent"
      - path: ".claude/get-shit-done-reflect/feature-manifest.json"
        issue: "Still manifest_version: 1 with no migrations[] array"
      - path: ".claude/get-shit-done-reflect/bin/lib/manifest.cjs"
        issue: "KNOWN_TOP_LEVEL_KEYS still has depth not granularity; no rename_field processing; no field_renamed handler"
    missing:
      - "Run `node bin/install.js --local` from project root to sync all 11 changed markdown files and the updated manifest.cjs + feature-manifest.json into .claude/"
  - truth: "manifest validate does not warn about granularity as unknown field"
    status: failed
    reason: "The npm source manifest.cjs is correct (granularity in KNOWN_TOP_LEVEL_KEYS). But the .claude/ runtime copy still has depth in KNOWN_TOP_LEVEL_KEYS, so if Claude calls the installed gsd-tools via .claude/ path it would flag granularity as unknown. The gsd-tools.cjs itself runs from get-shit-done/bin/ (correct), but the KNOWLEDGE Claude uses for health probes references the wrong enum."
    artifacts:
      - path: ".claude/get-shit-done-reflect/bin/lib/manifest.cjs"
        issue: "Line 13: 'mode', 'depth', ... — still depth not granularity in KNOWN_TOP_LEVEL_KEYS"
    missing:
      - "Run `node bin/install.js --local` to propagate the KNOWN_TOP_LEVEL_KEYS fix to the runtime copy"
human_verification: []
---

# Phase 49: Config Migration Verification Report

**Phase Goal:** The manifest-driven migration system supports declarative field renames, the depth-to-granularity breaking change is absorbed programmatically, and config upgrades move toward one runtime-neutral authority model instead of split workflow/install behavior
**Verified:** 2026-03-27T01:24:11Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | A project with depth: fine has it renamed to granularity: fine after apply-migration | VERIFIED | Test "renames depth to granularity with value mapping" passes; manifest.cjs cmdManifestApplyMigration at line 304-327 processes rename_field migrations |
| 2 | A project with both depth and granularity keeps granularity and deletes depth after apply-migration | VERIFIED | Test "cleans up depth when both depth and granularity exist" passes; code deletes migration.from unconditionally when present |
| 3 | KNOWN_TOP_LEVEL_KEYS includes granularity and excludes depth | VERIFIED (npm source) / FAILED (.claude/) | get-shit-done/bin/lib/manifest.cjs line 13: 'granularity' present. But .claude/get-shit-done-reflect/bin/lib/manifest.cjs line 13: still 'depth' not 'granularity' |
| 4 | manifest validate does not warn about granularity as unknown field | VERIFIED (runtime gsd-tools) | `manifest diff-config --raw` shows no granularity in unknown_fields. Only 'git' is flagged as unknown. |
| 5 | formatMigrationEntry produces human-readable output for field_renamed changes | VERIFIED | manifest.cjs lines 77-83: field_renamed handler present and substantive; formats "Renamed `from` to `to` (value: old -> new)" |
| 6 | No workflow or reference file references depth as a config field name (npm source) | VERIFIED | grep sweep across get-shit-done/workflows/ and get-shit-done/references/ returns zero hits for config-field depth (excluding allowed exceptions: discovery-phase.md, discuss-phase.md, version-migration.md historical example) |
| 7 | Shell grep commands in reflect.md search for granularity with coarse|standard|fine enum values | FAILED | get-shit-done/workflows/reflect.md: VERIFIED (GRANULARITY variable, granularity grep). .claude/get-shit-done-reflect/workflows/reflect.md: FAILED (still DEPTH variable, depth grep, quick|standard|comprehensive enum) |
| 8 | Health probe config-validity.md checks granularity field with correct enum values | FAILED | get-shit-done/references/health-probes/config-validity.md: VERIFIED (granularity, coarse|standard|fine). .claude/get-shit-done-reflect/references/health-probes/config-validity.md: FAILED (depth, quick|standard|comprehensive) |
| 9 | version-migration.md documents the controlled-exception mechanism for field renames | VERIFIED (npm source) / FAILED (.claude/) | get-shit-done/references/version-migration.md line 71: "### Controlled Exception: Field Renames" present (221 lines). .claude/ copy is 188 lines — missing the controlled-exception section entirely. |
| 10 | A v1.14 config (depth, no health_check, no signal_lifecycle) migrates to correct v1.18 state in one apply-migration run | VERIFIED | Test "upgrades v1.14 config to v1.18 state in single apply-migration run (CFG-05)" passes; asserts 10 outcomes including granularity: 'fine', all feature sections added, manifest_version: 2, original fields preserved |

**Score:** 8/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `get-shit-done/feature-manifest.json` | migrations[] array with depth-to-granularity rename_field entry | VERIFIED | manifest_version: 2, migrations[0] has type: rename_field, from: depth, to: granularity, value_map with quick/comprehensive mapping |
| `get-shit-done/bin/lib/manifest.cjs` | Rename migration processing and updated KNOWN_TOP_LEVEL_KEYS | VERIFIED | Lines 12-17: granularity in Set; lines 304-327: rename_field processing; lines 77-83: field_renamed handler |
| `get-shit-done/workflows/reflect.md` | Shell grep updated to search for granularity | VERIFIED | Line 90: GRANULARITY= grep; lines 100-102: coarse/standard/fine enum docs |
| `get-shit-done/workflows/plan-phase.md` | Spike sensitivity derived from config.granularity | VERIFIED | Lines 179-182: granularity: coarse/standard/fine -> conservative/balanced/aggressive |
| `get-shit-done/references/version-migration.md` | Controlled-exception mechanism documented | VERIFIED | Lines 71+: "Controlled Exception: Field Renames" section with depth-to-granularity example |
| `get-shit-done/templates/roadmap.md` | Roadmap template uses granularity terminology | VERIFIED | Line 108: granularity setting (coarse: 3-5, standard: 5-8, fine: 8-12) |
| `get-shit-done/bin/lib/core.cjs` | planningPaths, planningDir, resolveWorktreeRoot, commit_docs gitignore auto-detect | VERIFIED | All four functions present and exported (lines 533, 547, 198, 125-133) |
| `get-shit-done/bin/lib/init.cjs` | Cross-platform HOME path handling | VERIFIED | Line 201: process.env.HOME || process.env.USERPROFILE || require('os').homedir() |
| `get-shit-done/bin/gsd-tools.test.js` | Tests for rename migration, unknown field preservation, multi-version upgrade chain, idempotency | VERIFIED | 183 node:test tests pass (9 new); describes "manifest apply-migration rename migrations" and "manifest apply-migration multi-version upgrade" present |
| `.claude/get-shit-done-reflect/workflows/reflect.md` | Updated to granularity terminology | ORPHANED | npm source updated but installer never run; .claude/ copy still has old depth/DEPTH/quick|standard|comprehensive content |
| `.claude/get-shit-done-reflect/feature-manifest.json` | manifest_version: 2 with migrations[] | ORPHANED | npm source has v2 with migrations[]; .claude/ copy still shows manifest_version: 1, no migrations array |
| `.claude/get-shit-done-reflect/bin/lib/manifest.cjs` | granularity in KNOWN_TOP_LEVEL_KEYS, rename_field processing | ORPHANED | npm source correct; .claude/ copy has depth in KNOWN_TOP_LEVEL_KEYS, no rename_field processing |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `get-shit-done/feature-manifest.json` | `get-shit-done/bin/lib/manifest.cjs` | manifest.migrations array consumed by cmdManifestApplyMigration | WIRED | Line 305: `if (Array.isArray(manifest.migrations))` iterates migrations; manifest loaded via loadManifest at line 8 |
| `get-shit-done/bin/lib/manifest.cjs` | `.planning/config.json` | atomicWriteJson writes renamed config to disk | WIRED | Line 340: atomicWriteJson(configPath, projectConfig) |
| `get-shit-done/workflows/reflect.md` | `.planning/config.json` | Shell grep for granularity field | WIRED | Line 90: grep -o '"granularity"...' against .planning/config.json |
| `get-shit-done/references/health-probes/config-validity.md` | `.planning/config.json` | Shell validation of granularity enum | WIRED | Lines 46-48: node reads config.granularity, grep -qE "^(coarse|standard|fine)$" |
| `get-shit-done/bin/gsd-tools.test.js` | `get-shit-done/bin/lib/manifest.cjs` | Tests exercise cmdManifestApplyMigration with rename migrations | WIRED | Tests call `runGsdTools('manifest apply-migration --raw', tmpDir)` with manifests including migrations arrays |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| CFG-01: migrations[] array in feature-manifest.json | SATISFIED | manifest_version: 2, migrations[0] is the rename_field entry |
| CFG-02: depth-to-granularity as manifest migration | SATISFIED | rename_field entry with value_map; verified by 7 tests in Plan 04 |
| CFG-03: KNOWN_TOP_LEVEL_KEYS update | SATISFIED (npm source) | granularity in Set at line 13; .claude/ copy still stale |
| CFG-04: Workflow file updates | SATISFIED (npm source) | All 11 files updated; .claude/ copies not synced |
| CFG-05: Multi-version upgrade chain | SATISFIED | Test passes: v1.14 config with all feature sections added in single apply-migration run |
| CFG-06: Unknown field preservation | SATISFIED | Test "preserves unknown config fields through migration" passes |
| CFG-07: version-migration.md controlled-exception | SATISFIED (npm source) | Section present in get-shit-done/references/; absent from .claude/ copy |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.claude/get-shit-done-reflect/workflows/reflect.md` | 90 | `DEPTH=$(... grep '"depth"...)` — stale old-enum grep | Blocker | Claude agents running reflect.md from .claude/ will grep for wrong field name |
| `.claude/get-shit-done-reflect/references/health-probes/config-validity.md` | 37, 48 | `for field in mode depth` and `quick|standard|comprehensive` enum check | Blocker | Health probe guidance tells Claude to check the wrong field with wrong enum values |
| `.claude/get-shit-done-reflect/references/version-migration.md` | n/a | Entire controlled-exception section missing | Warning | Claude agents won't know the field-rename controlled exception mechanism when running version-migration guidance |
| `.claude/get-shit-done-reflect/feature-manifest.json` | 2 | `manifest_version: 1` (should be 2); no migrations[] array | Warning | If any tool resolves manifest from .claude/ path, it sees old schema |
| `.claude/get-shit-done-reflect/bin/lib/manifest.cjs` | 13 | `'depth'` in KNOWN_TOP_LEVEL_KEYS (should be `'granularity'`) | Warning | If manifest.cjs is loaded from .claude/ path, granularity would be flagged as unknown |

### Gaps Summary

The npm source (`get-shit-done/`) is fully implemented and tested. All 4 plans executed correctly against the source files. All 183 node:test tests pass including 9 new rename migration tests. The gsd-tools.cjs binary correctly processes rename_field migrations using the updated npm source manifest.cjs.

The single blocking gap is that `node bin/install.js --local` was never run after Phase 49 completed. The 49-02-SUMMARY.md explicitly deferred this step ("The installed .claude/ copies will need updating via `node bin/install.js --local` after all source changes are complete"), but no subsequent plan or summary records that the install was executed.

This means the `.claude/` install target — which is what Claude agents read during sessions for other projects — is stale. The runtime copies of reflect.md, config-validity.md, version-migration.md, feature-manifest.json, and manifest.cjs all reference the old `depth` terminology and schema. The health probe would instruct Claude to check for `depth` with `quick|standard|comprehensive` values, contradicting the updated source. The "one runtime-neutral authority model" goal is not achieved because the guidance documents Claude actually reads still describe the old split behavior.

The fix is a single command: `node bin/install.js --local` from the project root.

---

_Verified: 2026-03-27T01:24:11Z_
_Verifier: Claude (gsdr-verifier)_
