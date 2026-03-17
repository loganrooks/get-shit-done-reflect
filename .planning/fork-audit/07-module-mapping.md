# Fork Function → Upstream Module Mapping

> Agent: Module Mapping | Source: upstream lib/ structure analysis + fork function inventory

---

## Overview

- **Fork monolith:** 1 file (`gsd-tools.js`, 6,651 lines, 87 cmd functions + 100+ helpers)
- **Upstream modules:** 11 files under `lib/` (~67 cmd functions)
- **Fork-specific additions:** 25 functions across 3 new domains + 2 module extensions

---

## Upstream Modules: Fork Impact Assessment

| Module | Functions | Fork Changes Needed |
|--------|-----------|-------------------|
| `commands.cjs` | 13 | NONE — direct pass-through |
| `config.cjs` | 3 | NONE — direct pass-through |
| `frontmatter.cjs` | 4 + FRONTMATTER_SCHEMAS | **MODIFY** — add signal schema |
| `init.cjs` | 13 | **MODIFY** — update init functions with `--include` flag |
| `phase.cjs` | 9 | NONE — direct pass-through |
| `roadmap.cjs` | 3 | NONE — direct pass-through |
| `state.cjs` | 18 + sync logic | NONE — direct pass-through |
| `milestone.cjs` | 2 | NONE — direct pass-through |
| `template.cjs` | 2 | NONE — direct pass-through |
| `verify.cjs` | 10 | NONE — direct pass-through |
| `core.cjs` | Utilities | **MODIFY** — add config loaders + field validators |

**9 of 11 modules untouched.** Only `frontmatter.cjs`, `init.cjs`, and `core.cjs` need modification.

---

## New Modules Required (5)

### 1. `backlog.cjs` (NEW)

**Functions (7):**
- `cmdBacklogAdd(cwd, options, raw)` — Create backlog item with frontmatter
- `cmdBacklogList(cwd, filters, raw)` — Filter by priority/status/tags
- `cmdBacklogUpdate(cwd, itemId, updates, raw)` — Update item metadata
- `cmdBacklogStats(cwd, raw)` — Count/aggregate statistics
- `cmdBacklogGroup(cwd, groupBy, isGlobal, raw)` — Group by field
- `cmdBacklogPromote(cwd, itemId, target, milestone, raw)` — Move to phase/milestone
- `cmdBacklogIndex(cwd, isGlobal, raw)` — Regenerate index

**Helpers:** `resolveBacklogDir()`, `readBacklogItems()`, `regenerateBacklogIndex()`

### 2. `manifest.cjs` (NEW)

**Functions (6):**
- `cmdManifestDiffConfig(cwd, raw)` — Compare manifest vs config
- `cmdManifestValidate(cwd, raw)` — Validate config against schema
- `cmdManifestGetPrompts(cwd, feature, raw)` — Extract prompts
- `cmdManifestApplyMigration(cwd, raw)` — Apply version upgrade transforms
- `cmdManifestLogMigration(cwd, raw)` — Record migration
- `cmdManifestAutoDetect(cwd, raw)` — Detect feature availability

**Helpers:** `loadManifest()`, `loadProjectConfig()`, `validateFieldType()`, `validateFieldEnum()`, `coerceValue()`

### 3. `automation.cjs` (NEW)

**Functions (7):**
- `cmdAutomationResolveLevel(cwd, feature, options, raw)` — Compute effective level
- `cmdAutomationTrackEvent(cwd, feature, event, reason, raw)` — Log event
- `cmdAutomationLock(cwd, feature, options, raw)` — Acquire lock
- `cmdAutomationUnlock(cwd, feature, raw)` — Release lock
- `cmdAutomationCheckLock(cwd, feature, options, raw)` — Query lock status
- `cmdAutomationRegimeChange(cwd, description, options, raw)` — Record regime boundary
- `cmdAutomationReflectionCounter(cwd, action, raw)` — Track reflection counts

**Constants:** `FEATURE_CAPABILITY_MAP`

### 4. `sensors.cjs` (NEW)

**Functions (2):**
- `cmdSensorsList(cwd, raw)` — Discover sensor agents, read config
- `cmdSensorsBlindSpots(cwd, sensorName, raw)` — Analyze coverage gaps

### 5. `health-probe.cjs` (NEW)

**Functions (3):**
- `cmdHealthProbeSignalMetrics(cwd, raw)` — Signal-to-resolution ratio
- `cmdHealthProbeSignalDensity(cwd, raw)` — Per-phase accumulation trends
- `cmdHealthProbeAutomationWatchdog(cwd, raw)` — Verify feature cadence

**Helpers:** `resolveKBDir()`, `findLatestRegimeChange()`, `collectRegimeSignals()`

---

## Frontmatter Schema Extension

Fork adds `signal` schema to upstream's `FRONTMATTER_SCHEMAS`:

```javascript
// Upstream has: plan, summary, verification
// Fork adds:
signal: {
  required: ['id', 'type', 'project', 'tags', 'created', 'severity', 'signal_type'],
  conditional: [
    { when: {severity: 'critical'}, require: ['evidence'] },
    { when: {severity: 'notable'}, recommend: ['evidence', 'confidence'] }
  ],
  backward_compat: { field: 'lifecycle_state' }
}
```

---

## Dispatcher Updates

Fork requires 5 new case blocks in `gsd-tools.cjs`:

```javascript
const backlog = require('./lib/backlog.cjs');
const manifest = require('./lib/manifest.cjs');
const automation = require('./lib/automation.cjs');
const sensors = require('./lib/sensors.cjs');
const healthProbe = require('./lib/health-probe.cjs');

case 'backlog': { ... }
case 'manifest': { ... }
case 'automation': { ... }
case 'sensors': { ... }
case 'health-probe': { ... }
```

---

## Migration Complexity

| Module | Functions | Helpers | Risk | Effort |
|--------|-----------|---------|------|--------|
| sensors.cjs | 2 | 0 | LOW | 2h |
| backlog.cjs | 7 | 3 | LOW | 2-3h |
| manifest.cjs | 6 | 5 | MEDIUM | 3-4h |
| automation.cjs | 7 | 1 const | MEDIUM | 3-4h |
| health-probe.cjs | 3 | 3 | MEDIUM | 3-4h |
| frontmatter.cjs ext | 1 schema | 0 | LOW | 30m |
| core.cjs ext | 0 | 5 | MEDIUM | 1-2h |
| dispatcher update | 5 cases | 5 requires | LOW | 1h |
| **Total** | **25+** | **17** | | **16-22h** |

---

## Suggested Migration Order

1. **Phase 1** (no deps): `sensors.cjs` + `backlog.cjs`
2. **Phase 2** (config deps): `manifest.cjs` + update `core.cjs` config loaders
3. **Phase 3** (health system): `health-probe.cjs` + signal helpers
4. **Phase 4** (automation): `automation.cjs` + regime tracking
5. **Phase 5** (integration): Update dispatcher, update/migrate tests
