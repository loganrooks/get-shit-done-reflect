# Phase 38: Extensible Sensor Architecture - Research

**Researched:** 2026-03-04
**Domain:** Agent auto-discovery, contract specification, CLI observability
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Failure & timeout behavior
- Per-sensor timeout declared in sensor contract (`timeout_seconds` field), with a global default fallback
- Orchestrator enforces timeout; on timeout, sensor treated as returning empty array
- No retry on failure -- sensors analyze static local artifacts, retrying produces the same result
- Inline warning in synthesis output when sensors fail/timeout (e.g., "git-sensor: timed out, signals may be incomplete")
- Collection continues with remaining sensors -- only fail workflow if ALL sensors fail (matches existing collect-signals error handling)
- Track `last_run_status: success|failure|timeout` per sensor via Phase 37 track-event mechanism

#### CLI sensor observability (`sensors list`)
- `gsd-tools.js sensors list` shows: discovered sensors, enabled/disabled status, last run time, signal count, last run status
- Last run status (success/failure/timeout) added beyond EXT-04 minimum -- disambiguates "0 signals because clean" vs "0 signals because broken"
- Data stored via Phase 37 automation statistics mechanism (fires, skips, last_triggered, last_skip_reason)
- No error history, no verbose mode, no blind spots in this view -- keep it simple, Phase 41 handles ongoing monitoring

#### Blind spots transparency
- Each sensor agent spec includes a `<blind_spots>` section documenting what classes of problems the sensor is structurally unable to detect (per EXT-07)
- Collection output includes a one-line standing caveat: "Sensors: artifact, git. For sensor limitations, see agent specs or run `gsd sensors blind-spots`"
- Blind spots queryable via CLI (`gsd sensors blind-spots`) -- not repeated in every report
- Blind spots are static per sensor version, not dynamic per run

#### Per-sensor configuration
- On/off toggle + model selection only (already exists in collect-signals config)
- No additional per-sensor config knobs for Phase 38 -- current sensors don't need them
- Sensor contract includes an optional `config_schema` field that sensors MAY declare for future use
- Phase 39 CI sensor expected to be first sensor that actually declares config knobs (repo, workflow, etc.)

### Claude's Discretion
- Exact format of `sensors list` output (table vs plain text)
- Global default timeout value (suggest 30-60s based on sensor workload)
- How `config_schema` field is structured in the contract (JSON Schema, simple key-value, etc.)
- Exact wording of standing caveat in collection output

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Summary

Phase 38 transforms the signal collection system from a hardcoded 3-sensor architecture to a dynamic auto-discovery model. The core change is that the `collect-signals.md` workflow currently has three hardcoded `Task()` spawn blocks (artifact, git, log) with sensor names baked into the workflow text, config defaults, and feature manifest. After this phase, the workflow scans the `agents/` directory for `gsd-*-sensor.md` files, reads each sensor's standardized contract metadata, checks config for enable/disable, and spawns enabled sensors dynamically. Adding a new sensor becomes a single-file operation: create `agents/gsd-{name}-sensor.md` conforming to the contract.

The existing artifact and git sensors already follow the output contract informally (`## SENSOR OUTPUT` / `## END SENSOR OUTPUT` delimiters, `{sensor, phase, signals}` JSON structure, empty array on failure). The research confirms these patterns are consistent across both sensors and can be formalized into a standard contract without breaking changes. The log sensor is a disabled stub that already conforms to the output protocol. All three sensors need contract metadata added (timeout, blind spots, config_schema) and minor structural alignment.

The `sensors list` CLI command is a new `gsd-tools.js` top-level command that performs file-system discovery of sensor agent specs, cross-references config for enable/disable status, and reads Phase 37 automation stats for last run data. The `sensors blind-spots` subcommand parses `<blind_spots>` sections from agent specs.

**Primary recommendation:** Implement in two plans: (1) define the sensor contract, modify collect-signals for auto-discovery, and wire up enable/disable config; (2) retrofit existing sensors, add `sensors list`/`blind-spots` CLI commands, and add blind spots documentation.

## Standard Stack

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| gsd-tools.js | `get-shit-done/bin/gsd-tools.js` | CLI runtime for `sensors list` and `sensors blind-spots` commands | All GSD CLI commands live here; follows existing subcommand pattern (backlog, automation, manifest, etc.) |
| collect-signals.md | `get-shit-done/workflows/collect-signals.md` | Orchestrator workflow that discovers and spawns sensors | Already owns sensor orchestration; auto-discovery replaces hardcoded spawn blocks |
| feature-manifest.json | `get-shit-done/feature-manifest.json` | Config schema for signal_collection.sensors | Already declares sensor defaults; needs dynamic sensor registration support |
| automation track-event | `gsd-tools.js automation track-event` | Per-sensor stats tracking (fires, last_triggered, status) | Phase 37 delivered this; reuse for sensor execution stats |

### Supporting
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| agent-protocol.md | `get-shit-done/references/agent-protocol.md` | Shared agent conventions | Sensor contract references this for common behavior |
| signal-detection.md | `get-shit-done/references/signal-detection.md` | Detection rules and severity classification | Sensors reference this for signal classification |
| config.json | `.planning/config.json` | Project-level sensor enable/disable | Runtime config read by collect-signals and sensors list |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| File-system glob for discovery | Registry file (sensors.json) | Glob is simpler, no registry drift; registry allows ordering/priority but adds maintenance |
| Frontmatter in agent specs for contract | Separate contract JSON files | Frontmatter collocates contract with implementation; separate files add sync burden |
| Top-level `sensors` command | Subcommand under `manifest` | `sensors` is more intuitive for users; `manifest` is for config schema, not runtime discovery |

**No installation needed** -- this phase modifies existing files only. No new npm dependencies.

## Architecture Patterns

### Current Architecture (Before Phase 38)
```
collect-signals.md
├── Step: load_sensor_config (hardcoded defaults: artifact, git, log)
├── Step: spawn_sensors
│   ├── IF artifact enabled → Task(gsd-artifact-sensor) [HARDCODED]
│   ├── IF git enabled → Task(gsd-git-sensor)           [HARDCODED]
│   └── IF log enabled → Task(gsd-log-sensor)            [HARDCODED]
├── Step: collect_sensor_outputs
└── Step: spawn_synthesizer
```

### Target Architecture (After Phase 38)
```
collect-signals.md
├── Step: discover_sensors (glob agents/gsd-*-sensor.md, parse contract)
├── Step: load_sensor_config (read config, cross-ref discovered sensors)
├── Step: spawn_sensors
│   └── FOR EACH enabled discovered sensor → Task(gsd-{name}-sensor)  [DYNAMIC]
├── Step: collect_sensor_outputs (with per-sensor timeout enforcement)
├── Step: track_sensor_stats (automation track-event per sensor)
└── Step: spawn_synthesizer (includes standing caveat in output)
```

### Pattern 1: Sensor Contract in Agent Spec Frontmatter
**What:** Each sensor agent spec declares its contract as YAML frontmatter fields
**When to use:** Every `gsd-*-sensor.md` file
**Why:** Collocates contract with implementation, no separate metadata files to keep in sync. The installer already copies agent specs from `agents/` to `.claude/agents/`, so the contract travels with the sensor.

```yaml
---
name: gsd-artifact-sensor
description: Analyzes execution artifacts...
tools: Read, Bash, Glob, Grep
color: yellow
# === Sensor Contract (EXT-02) ===
sensor_name: artifact
timeout_seconds: 30
config_schema: null
---
```

The `<blind_spots>` section lives in the agent spec body (not frontmatter) since it is prose documentation, not structured data.

### Pattern 2: File-System Auto-Discovery
**What:** Collect-signals globs for `gsd-*-sensor.md` files to find sensors
**When to use:** At the start of every signal collection run
**Why:** Adding a sensor never requires modifying the workflow

```bash
# Discovery: find all sensor agent specs
SENSOR_FILES=$(ls agents/gsd-*-sensor.md 2>/dev/null || ls .claude/agents/gsd-*-sensor.md 2>/dev/null)

# Extract sensor name from filename: gsd-{name}-sensor.md → {name}
for file in $SENSOR_FILES; do
  SENSOR_NAME=$(basename "$file" | sed 's/^gsd-//;s/-sensor\.md$//')
  # Parse frontmatter for contract fields
  # Cross-reference config for enabled/disabled
done
```

**Critical path resolution:** The workflow runs in the installed context (`.claude/`), so it discovers sensors at `.claude/agents/gsd-*-sensor.md`. This is consistent with how all other agent specs are resolved at runtime. The npm source directory (`agents/`) is where you create new sensors; the installer copies them to `.claude/agents/`.

### Pattern 3: Sensor Stats via Automation Track-Event
**What:** Use Phase 37's `automation track-event` to record sensor execution stats
**When to use:** After each sensor completes (success, failure, or timeout)

```bash
# After successful sensor execution:
node ./.claude/get-shit-done/bin/gsd-tools.js automation track-event "sensor_artifact" fire

# After sensor failure/timeout:
node ./.claude/get-shit-done/bin/gsd-tools.js automation track-event "sensor_artifact" skip "timeout"
```

This reuses the existing stats schema: `{fires, skips, last_triggered, last_skip_reason}`. The `last_skip_reason` field naturally captures failure mode ("timeout", "parse-error", "agent-error"). The `sensors list` command reads `config.automation.stats.sensor_{name}` to display last run info.

**Mapping to CONTEXT.md requirements:**
- `last_run_status: success` = track-event fire (increments fires, updates last_triggered)
- `last_run_status: failure` = track-event skip with reason "failure"
- `last_run_status: timeout` = track-event skip with reason "timeout"
- `signal_count` = tracked in sensor output JSON, not in automation stats (read from collection results)

### Pattern 4: Config Schema for Sensor Enable/Disable
**What:** Dynamic sensor config keyed by discovered sensor name
**When to use:** When checking whether to spawn a sensor

The current config schema in feature-manifest.json hardcodes sensor defaults:
```json
"sensors": {
  "type": "object",
  "default": {
    "artifact": { "enabled": true, "model": "auto" },
    "git": { "enabled": true, "model": "auto" },
    "log": { "enabled": false, "model": "auto" }
  }
}
```

After auto-discovery, the config lookup logic becomes:
1. Discover sensors from file system
2. For each discovered sensor, check `config.signal_collection.sensors[name]`
3. If config entry exists: use its `enabled` and `model` values
4. If no config entry: sensor defaults to **enabled** (drop-a-file should work without config changes)
5. To disable a new sensor, user adds `"new_sensor": {"enabled": false}` to config

This is the key design decision: **discovered sensors default to enabled**. This fulfills the "drop a file" promise. The log sensor's current disabled-by-default behavior is preserved because it already has an explicit config entry with `"enabled": false`.

### Anti-Patterns to Avoid
- **Hardcoding sensor names in the workflow:** The entire point of auto-discovery is eliminating this. No sensor name should appear as a literal string in collect-signals.md except in comments/documentation.
- **Separate sensor registry file:** A JSON registry of sensors would drift from the actual agent specs. The file system IS the registry.
- **Parsing agent spec bodies for contract data:** Contract metadata belongs in frontmatter (machine-parseable). Blind spots are prose in the body (`<blind_spots>` section). Do not try to extract structured contract fields from unstructured prose.
- **Modifying config.json during discovery:** Discovery is read-only. If a new sensor is found but not in config, treat it as enabled with defaults. Do not auto-write config entries -- that changes user's config file without consent.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Per-sensor execution stats | Custom stats file or JSON store | `automation track-event` (Phase 37) | Already built, tested (12 tests), atomic writes, per-feature isolation |
| Sensor enable/disable toggle | Custom sensor registry | `config.signal_collection.sensors[name]` | Already exists in feature manifest schema |
| Agent spec frontmatter parsing | Custom YAML parser | gsd-tools.js `frontmatter get` command | Already handles YAML frontmatter in .md files |
| Timeout enforcement | Custom timer logic | Orchestrator-level timeout on Task() call | Task() timeout is a runtime feature; sensors declare their budget |

**Key insight:** Phase 37 and the existing manifest/config infrastructure provide almost all the persistence and configuration mechanisms needed. The new work is discovery logic, contract formalization, and the `sensors` CLI command -- not data management.

## Common Pitfalls

### Pitfall 1: Dual-Directory Drift
**What goes wrong:** Editing `.claude/agents/gsd-{name}-sensor.md` instead of `agents/gsd-{name}-sensor.md`, causing the npm package to ship without changes.
**Why it happens:** CLAUDE.md documents this exact problem (Phase 22 incident). The installed `.claude/` copies are what the runtime reads, so developers test against them directly.
**How to avoid:** ALL edits to sensor agent specs go in `agents/` (npm source). Run `node bin/install.js --local` after edits to update `.claude/` copies. A prior lesson [les-2026-02-16-dynamic-path-resolution-for-install-context] found that path resolution must account for both local and global install contexts.
**Warning signs:** Tests pass locally but npm package is missing changes. The `sensors list` command shows different sensors than expected.

### Pitfall 2: Auto-Discovery Path Resolution
**What goes wrong:** The workflow discovers sensors in `agents/` (npm source) instead of `.claude/agents/` (installed runtime), or vice versa.
**Why it happens:** The collect-signals workflow runs in the installed context. At runtime, agent specs live at `.claude/agents/`. But during development, the npm source `agents/` directory is the canonical location.
**How to avoid:** Discovery always uses the runtime path (`.claude/agents/gsd-*-sensor.md` for local installs, `~/.claude/agents/gsd-*-sensor.md` for global). The installer's path conversion handles this automatically. The workflow file uses `~/.claude/agents/` which the installer converts to `./.claude/agents/` during local install.
**Warning signs:** Sensor discovered during development but not after install, or vice versa.

### Pitfall 3: Config Default Handling for New Sensors
**What goes wrong:** A new sensor is dropped into `agents/` but does not appear because the config has no entry for it, and the code requires explicit config entries.
**Why it happens:** Current code reads `config.signal_collection.sensors` and falls back to a hardcoded 3-sensor default. New sensors not in the default are invisible.
**How to avoid:** Discovered sensors with no config entry default to enabled. Config is consulted for overrides, not as the source of truth for which sensors exist. File system discovery IS the source of truth.
**Warning signs:** New sensor file exists but `sensors list` does not show it.

### Pitfall 4: Frontmatter Parsing Fragility
**What goes wrong:** Agent specs without proper frontmatter (missing `---` delimiters, malformed YAML) cause discovery to fail silently.
**Why it happens:** Sensor contract fields are in frontmatter. If frontmatter parsing fails, the sensor has no contract.
**How to avoid:** Discovery should handle parse failures gracefully: log a warning, skip the malformed sensor, continue with others. The `sensors list` command should show malformed sensors with an error status.
**Warning signs:** Sensor file exists but `sensors list` shows fewer sensors than agent spec files.

### Pitfall 5: Signal Count Not Available at List Time
**What goes wrong:** `sensors list` tries to show signal count but has no data because signal counts are ephemeral (only exist during a collection run).
**Why it happens:** Signal counts are in the sensor's JSON response, which is only available during `collect-sensor-outputs` step. They are not persisted anywhere after the run.
**How to avoid:** Track signal count in the automation stats. After each successful sensor run, the collect-signals workflow records the count. Alternatively, accept that signal count is only available after the most recent run and document this limitation.
**Warning signs:** Signal count always shows 0 or N/A.

### Pitfall 6: Timeout Without Task-Level Support
**What goes wrong:** Per-sensor timeout declared in contract but orchestrator cannot actually enforce it because Task() may not support explicit timeout parameters.
**Why it happens:** Task() is a Claude Code runtime primitive. Its timeout behavior may be implicit (context window exhaustion) rather than explicit (configurable timeout parameter).
**How to avoid:** Research whether Task() supports a timeout parameter. If not, the timeout becomes advisory documentation. The orchestrator can use timestamp tracking and log warnings when sensors exceed their declared timeout, even if it cannot forcibly terminate them. The CONTEXT.md decision says "orchestrator enforces timeout; on timeout, sensor treated as returning empty array" -- this may need to be implemented as a convention rather than a hard kill.
**Warning signs:** Sensors running past their declared timeout without being stopped.

## Code Examples

### Example 1: Sensor Contract Frontmatter
```yaml
# Source: Formalized from existing gsd-artifact-sensor.md pattern
---
name: gsd-artifact-sensor
description: Analyzes execution artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md) and returns raw signal candidates as structured JSON
tools: Read, Bash, Glob, Grep
color: yellow
# === Sensor Contract (EXT-02) ===
sensor_name: artifact
timeout_seconds: 30
config_schema: null
---
```

### Example 2: Auto-Discovery in Collect-Signals Workflow
```markdown
<step name="discover_sensors">
Scan for sensor agent specs in the agents directory:

# Find all sensor agent spec files
SENSOR_SPECS=$(ls .claude/agents/gsd-*-sensor.md 2>/dev/null)

For each spec file:
1. Extract sensor name from filename: gsd-{name}-sensor.md -> {name}
2. Read frontmatter to get contract fields (sensor_name, timeout_seconds)
3. Check config.signal_collection.sensors[name] for enabled/disabled
4. If no config entry exists, default to enabled with model "auto"
5. Store in DISCOVERED_SENSORS list: {name, spec_path, timeout, enabled, model}

Report: "Discovered {N} sensors: {names}. Enabled: {enabled_names}. Disabled: {disabled_names}."
</step>
```

### Example 3: Dynamic Sensor Spawning
```markdown
<step name="spawn_sensors">
For each ENABLED sensor in DISCOVERED_SENSORS:

Task(
  subagent_type="gsd-{sensor.name}-sensor",
  model="{resolved_model}",
  run_in_background=true,
  description="Collect {sensor.name} signals for phase {PADDED_PHASE}",
  prompt="Analyze phase {PADDED_PHASE}.
    Phase directory: {PHASE_DIR}
    Project name: {PROJECT_NAME}
    Return results as JSON: { sensor: '{sensor.name}', phase: N, signals: [...] }"
)

Track spawned sensor names for output collection.
</step>
```

### Example 4: Sensors List CLI Command
```javascript
// Source: Follows existing gsd-tools.js subcommand patterns (backlog list, automation resolve-level)
function cmdSensorsList(cwd, raw) {
  // 1. Discover sensors from file system
  const agentsDir = path.join(cwd, '.claude', 'agents');
  const sensorFiles = glob.sync('gsd-*-sensor.md', { cwd: agentsDir });

  // 2. Parse each sensor's frontmatter for contract metadata
  const sensors = sensorFiles.map(file => {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    const frontmatter = parseFrontmatter(content);
    const name = file.replace(/^gsd-/, '').replace(/-sensor\.md$/, '');
    return { name, ...frontmatter };
  });

  // 3. Cross-reference config for enable/disable
  const config = readConfig(cwd);
  const sensorConfig = config?.signal_collection?.sensors || {};

  // 4. Read automation stats for last run info
  const stats = config?.automation?.stats || {};

  // 5. Build output
  const result = sensors.map(sensor => ({
    name: sensor.name,
    enabled: sensorConfig[sensor.name]?.enabled ?? true,
    model: sensorConfig[sensor.name]?.model ?? 'auto',
    timeout: sensor.timeout_seconds || 30,
    last_run: stats[`sensor_${sensor.name}`]?.last_triggered || 'never',
    last_status: inferStatus(stats[`sensor_${sensor.name}`]),
    signals: stats[`sensor_${sensor.name}`]?.last_signal_count ?? 'N/A',
  }));

  output(result, raw);
}
```

### Example 5: Blind Spots Section in Agent Spec
```markdown
<blind_spots>
## Blind Spots

This sensor analyzes execution artifacts (PLAN.md, SUMMARY.md, VERIFICATION.md). It is structurally unable to detect:

- **Runtime behavior issues:** The sensor reads static files. If a deployed feature works differently than what the plan describes, this sensor cannot detect the discrepancy.
- **Omitted work:** If a plan task was supposed to produce output but the executor silently skipped it without recording a deviation, the sensor sees a "clean" execution.
- **Cross-phase regressions:** The sensor analyzes one phase at a time. A change in phase N that breaks phase N-1's output is invisible.
- **Undocumented side effects:** If the executor modified files not mentioned in the plan or summary, the artifact sensor will not detect them (the git sensor may).
</blind_spots>
```

### Example 6: Sensors Blind-Spots CLI Command
```javascript
function cmdSensorsBlindSpots(cwd, sensorName, raw) {
  const agentsDir = path.join(cwd, '.claude', 'agents');
  const pattern = sensorName
    ? `gsd-${sensorName}-sensor.md`
    : 'gsd-*-sensor.md';
  const files = glob.sync(pattern, { cwd: agentsDir });

  const blindSpots = files.map(file => {
    const content = fs.readFileSync(path.join(agentsDir, file), 'utf8');
    const name = file.replace(/^gsd-/, '').replace(/-sensor\.md$/, '');
    // Extract <blind_spots>...</blind_spots> section
    const match = content.match(/<blind_spots>([\s\S]*?)<\/blind_spots>/);
    return {
      sensor: name,
      blind_spots: match ? match[1].trim() : 'No blind spots documented',
    };
  });

  output(blindSpots, raw);
}
```

## Resolved Open Questions

### Q1: Can Phase 37 track-event mechanism accommodate sensors as "features"?
**Answer: YES.** The `automation track-event` command accepts any string as a feature name and normalizes it (hyphens to underscores). Using `sensor_artifact`, `sensor_git`, etc. as feature names works immediately. The stats schema (`{fires, skips, last_triggered, last_skip_reason}`) maps well:
- `fires` = successful runs
- `skips` = failed/timed-out runs
- `last_triggered` = last successful run timestamp
- `last_skip_reason` = failure mode (e.g., "timeout", "parse-error")

One limitation: signal count is not part of the stats schema. Options:
1. Add a custom field (`last_signal_count`) to the stats object -- requires minor gsd-tools.js modification
2. Accept that signal count is ephemeral -- only available during/after the most recent collection run
3. Use a dedicated stats field in `signal_collection` config section

**Recommendation:** Option 1 -- extend track-event to accept optional metadata fields. The simplest approach: after a sensor fires, the orchestrator writes signal count to `config.automation.stats.sensor_{name}.last_signal_count` via a direct config write or by extending track-event with `--metadata` flag.

### Q2: What are the actual 6 touch points for adding a sensor today?
**Answer:** The 6 touch points are:

| # | File (npm source) | What to edit | Eliminated by |
|---|-------------------|--------------|---------------|
| 1 | `agents/gsd-{name}-sensor.md` | Create agent spec | KEPT (this IS the single file) |
| 2 | `get-shit-done/workflows/collect-signals.md` | Add hardcoded Task() spawn block | EXT-01 auto-discovery |
| 3 | `get-shit-done/feature-manifest.json` | Add sensor to `signal_collection.sensors.default` | EXT-01 + default-enabled logic |
| 4 | `.claude/agents/gsd-{name}-sensor.md` | Installed copy of #1 | Installer handles automatically |
| 5 | `.claude/get-shit-done/workflows/collect-signals.md` | Installed copy of #2 | Installer handles automatically |
| 6 | `.claude/get-shit-done/feature-manifest.json` | Installed copy of #3 | Installer handles automatically |

Touch points 4-6 are .claude/ installed copies that the installer creates from the source files. The real manual work is touch points 1-3. After Phase 38:
- Touch point 1: KEPT (create the agent spec -- this is the "drop a file" action)
- Touch point 2: ELIMINATED by auto-discovery (no more hardcoded Task() blocks)
- Touch point 3: ELIMINATED by default-enabled logic (no config entry needed for new sensors)
- Touch points 4-6: ELIMINATED by corollary (installer copies changed source files)

**Result: 1 file to create (the agent spec). 0 files to modify.** This matches the SIG-260222-005 zero-touch manifest architecture pattern: "if I add a new sensor, how many files do I change? The answer should remain 1."

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded 3 sensors in workflow | Dynamic auto-discovery via glob | Phase 38 (this phase) | New sensors are single-file additions |
| Informal output contract | Standardized sensor contract in frontmatter | Phase 38 (this phase) | Contract validation, consistent error handling |
| No sensor observability | `sensors list` CLI command | Phase 38 (this phase) | Debug sensor discovery and execution issues |
| Implicit sensor limitations | `<blind_spots>` documentation | Phase 38 (this phase) | Makes observation theory visible |

**Current state being replaced:**
- collect-signals.md has 3 hardcoded Task() blocks (~50 lines of sensor-specific code)
- feature-manifest.json has hardcoded sensor defaults
- No contract metadata in sensor agent specs
- No CLI for sensor discovery/status

## Open Questions

### Resolved
- **Can Phase 37 track-event accommodate sensors?** Yes -- generic feature name acceptance, stats schema maps well. Signal count needs minor extension.
- **What are the 6 touch points?** Enumerated above: 3 source files + 3 installer copies. Auto-discovery eliminates 2 source-level touch points.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Does Task() support explicit timeout parameters? | Medium | Investigate during planning. If not, timeout becomes advisory (logged warning when exceeded). The orchestrator tracks start time and declares timeout violations when collecting output. |
| Should signal count be persisted in automation stats or as a separate field? | Low | Extend automation stats with `last_signal_count`. Minor gsd-tools.js change. |
| How should `sensors list` handle the case where `.claude/agents/` does not exist (no local install)? | Low | Fall back to checking `agents/` directory. Already handled by dual-path resolution pattern. |

### Still Open
- Task() timeout enforcement mechanism needs runtime investigation. The contract can declare it, but enforcement depends on Claude Code Task() capabilities.

## Sources

### Primary (HIGH confidence)
- `agents/gsd-artifact-sensor.md` -- current artifact sensor agent spec, examined for existing output contract patterns
- `agents/gsd-git-sensor.md` -- current git sensor agent spec, examined for existing output contract patterns
- `agents/gsd-log-sensor.md` -- current log sensor stub, examined for disabled sensor pattern
- `get-shit-done/workflows/collect-signals.md` -- current orchestrator workflow, examined for hardcoded sensor references
- `get-shit-done/feature-manifest.json` -- current config schema, examined for sensor defaults
- `get-shit-done/bin/gsd-tools.js` -- CLI runtime, examined for automation track-event implementation and command routing patterns
- `.planning/phases/37-automation-framework/37-03-SUMMARY.md` -- Phase 37 deliverables, confirmed track-event availability

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- EXT-01 through EXT-07 requirement definitions with philosophical motivations
- `.planning/phases/38-extensible-sensor-architecture/38-CONTEXT.md` -- user decisions and implementation constraints
- `.planning/config.json` -- current project config (no signal_collection section yet)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are existing project files, no external dependencies
- Architecture: HIGH -- patterns derived from reading current implementation and verified against codebase
- Pitfalls: HIGH -- dual-directory issue documented in CLAUDE.md with historical incident; path resolution lesson in KB
- Code examples: MEDIUM -- examples are illustrative patterns, not tested code; actual implementation may vary in detail

**Research date:** 2026-03-04
**Valid until:** 2026-04-04 (30 days -- stable internal architecture, no external dependency churn)

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| spk-2026-03-01-claude-code-session-log-location | spike | Confirmed Claude Code session log locations for future log sensor | Architecture Patterns (log sensor context) |
| les-2026-02-16-dynamic-path-resolution-for-install-context | lesson | Path resolution must account for local vs global install context | Common Pitfalls (Pitfall 1, Pitfall 2) |
| SIG-260222-005-zero-touch-manifest-architecture | signal | Zero-touch feature addition: manifest as single source of truth | Architecture Patterns (validates "1 file" target for new sensors) |

Checked knowledge base (`~/.gsd/knowledge/index.md`). 3 entries relevant out of 100 total. Applied spike finding for log sensor context, lesson for path resolution pitfalls, and signal for zero-touch architecture validation.

Spikes avoided: 0 (no current research questions match existing spikes)
