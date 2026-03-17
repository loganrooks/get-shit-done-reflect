# Runtime File Modifications

> Agent: gsd-tools.js & install.js Analysis | Source: git diff, commit history

---

## 1. gsd-tools.js — Fork-Original (NOT Modified Upstream)

### Critical Finding

**This file is effectively fork-original.** Upstream renamed their version to `gsd-tools.cjs` and split it into 11 modules. The fork kept the old monolithic structure and extended it.

- **Total lines:** 6,651
- **Lines added vs upstream baseline:** +2,126 / -72
- **Commits touching this file:** 27 (Phases 23–42)
- **Upstream conflict risk:** None (upstream file is now `.cjs` in different structure)

### Functions Added by Phase

#### Phase 23-01: Manifest Subcommand Foundation
- `cmdManifestDiffConfig`, `cmdManifestValidate`, `cmdManifestGetPrompts` stubs
- Wired manifest dispatch in main CLI router

#### Phase 24: Manifest Migration System
- `cmdManifestApplyMigration` with atomic JSON writes
- `cmdManifestLogMigration` for change tracking
- Helpers: `loadManifest()`, `loadProjectConfig()`

#### Phase 25: Backlog CRUD System
- `cmdBacklogAdd` — create items with file-based storage
- `cmdBacklogList` — read with filtering (priority, status, tags)
- `cmdBacklogUpdate` — modify fields with atomic writes
- `cmdBacklogGroup` — group by theme or tags
- `cmdBacklogPromote` — elevate to phase/milestone
- `cmdBacklogIndex` — auto-generate searchable index
- `cmdBacklogStats` — count by status/priority
- Helpers: `readBacklogItems()`, `resolveBacklogDir()`, `regenerateBacklogIndex()`

#### Phase 26: Milestone Field Expansion
- Extended backlog for `milestone` field
- Multi-status filtering in `cmdBacklogList`

#### Phase 31: Signal Validation System
- Added `signal` schema to `FRONTMATTER_SCHEMAS` with tiered validation:
  - Required: `id`, `type`, `project`, `tags`, `created`, `severity`, `signal_type`
  - Conditional: critical signals require `evidence` + optional confidence
  - Recommended: `lifecycle_state`, `signal_category`, `confidence`
  - Backward compat: Pre-Phase 31 signals get warnings not hard fails
- Extended `cmdFrontmatterValidate()` with conditional/recommended/evidence checking

#### Phase 37: Automation Feature Framework
- `cmdAutomationResolveLevel()` — compute automation level per feature
- `FEATURE_CAPABILITY_MAP` — maps features to hook requirements
- `cmdAutomationTrackEvent()` — record fire/skip events with atomic config persistence
- Lock system: `cmdAutomationLock()`, `cmdAutomationUnlock()`, `cmdAutomationCheckLock()`
- `cmdAutomationRegimeChange()` — record automation assumption changes

#### Phase 38: Sensor Architecture
- `cmdSensorsList()` — enumerate available sensors
- `cmdSensorsBlindSpots()` — identify sensor coverage gaps

#### Phase 40: Signal Collection Automation
- Integrated signal collection into automation flow
- Fixed double-fire bugs in sensor telemetry

#### Phase 41: Health Probe System
- `cmdHealthProbeSignalMetrics()` — signal-to-resolution ratio
- `cmdHealthProbeSignalDensity()` — per-phase signal accumulation trends
- `cmdHealthProbeAutomationWatchdog()` — verify feature cadence
- 493 lines of health computation logic

#### Phase 42: Reflection Counter
- `cmdAutomationReflectionCounter()` with increment/check/reset actions

### Summary Table

| Feature | Functions | ~Lines |
|---------|-----------|--------|
| Manifest system | 4 + helpers | 400 |
| Backlog system | 7 + helpers | 600 |
| Signal validation | Schema + extended validation | 200 |
| Automation framework | 6 + capability map | 400 |
| Sensor architecture | 2 | 100 |
| Health probes | 3 | 493 |
| Reflection counter | 1 | 50 |
| **Total** | **~24 functions** | **~2,126** |

### Helper Functions Added
- `loadManifest()` — multi-location manifest discovery
- `loadProjectConfig()` — load .planning/config.json
- `validateFieldType()`, `validateFieldEnum()` — schema validation
- `coerceValue()` — type coercion (string↔bool)
- `atomicWriteJson()` — safe JSON writes (tmp + rename)
- `readBacklogItems()` — batch load backlog with FM extraction
- `resolveBacklogDir()` — global vs local backlog resolution

---

## 2. install.js — Fork-Modified Upstream File

- **Total lines:** 1,783
- **Lines added:** +1,147 / -136
- **Commits:** 65 (Phases 20–44)

### Major Modifications

#### Namespace Isolation System (Phase 44)
Complete namespace rewriting for co-existence with upstream GSD:
- Pass 3a: `get-shit-done/` → `get-shit-done-reflect/`
- Pass 3b: `/gsd:` → `/gsdr:`
- Pass 3c: `gsd-` → `gsdr-` (with `gsd-tools` exemption)
- Pass 3d: `GSD >` → `GSDR >`

#### KB Migration (Phases 38, 39, 44)
- `migrateKB()` — create KB structure, copy old KB, integrity verify, backup, symlinks
- `installKBScripts()` — copy management scripts to `~/.gsd/bin/`

#### Error Handling (Phase 44)
- `safeFs()` wrapper: consistent error messages, code-based hints (EACCES, ENOSPC, ENOENT)

#### Codex Runtime Support (Phases 39, 44)
- `--codex` flag and `CODEX_CONFIG_DIR` env var
- Command markdown → SKILL.md format conversion
- Tool name translation layer
- `AGENTS.md` generation

#### Worktree Safety (Phase 20)
- Detect git worktrees, prevent hook failures
- Auto-build hooks when `hooks/dist/` missing

#### Brand Identity
- Banner: "Get Shit Done" → "GSD Reflect"
- Package: `get-shit-done-cc` → `get-shit-done-reflect-cc`
- Tagline: "An AI coding agent that learns from its mistakes"

### Risk Assessment

**Safe:**
- Namespace isolation: surgical, well-tested (65 commits)
- KB migration: defensive (backup before copy, verify, idempotent)
- Error handling: improved robustness
- Codex support: additive, orthogonal

**Attention needed:**
- Installer at 1,783 lines (+66% growth) — maintenance cost rising
- Symlink-based KB approach may not be portable
- All help text changed — upstream doc PRs need manual rebase
