<purpose>
Orchestrate multi-sensor signal collection for a completed phase. Discovers sensor agents dynamically from the file system, spawns enabled sensors in parallel, collects their structured JSON output, and passes it to the signal synthesizer for quality-gated KB persistence.

<!-- Architecture notes:
  - SENSOR CONTRACT: Defines the interface between the orchestrator and sensor agents.
    - Input: Sensor receives phase number, phase directory path, project name, model profile
    - Output: JSON wrapped in ## SENSOR OUTPUT / ## END SENSOR OUTPUT delimiters
      with structure { sensor: string, phase: number, signals: array }
    - Error handling: On failure, return empty signals array -- never crash or return non-JSON
    - Timeout: Declared via `timeout_seconds` frontmatter field (default 45s); orchestrator
      enforces; on timeout, treated as empty array with inline warning
    - Config: `config_schema` frontmatter field (optional, null for current sensors;
      Phase 39 CI sensor expected to be first sensor that actually declares config knobs)
    - Blind spots: `<blind_spots>` section in agent spec body (prose documentation,
      not structured data -- makes theory-ladenness visible)

  - AUTO-DISCOVERY: Sensors are discovered by scanning for gsdr-*-sensor.md files in the
    agents directory. Adding a new sensor is a single-file operation: create
    agents/gsdr-{name}-sensor.md conforming to the contract above.
    If no file-backed sensor specs exist, fall back to built-in runtime roles when available
    (currently `gsdr-artifact-sensor` and `gsdr-git-sensor`).

  - Sensors return JSON to orchestrator -- they do NOT write to KB (single-writer principle)
  - Sensor model policy in Codex runtimes:
    - Default single-pass run: `gpt-5.4` with `reasoning_effort=medium`
    - Optional comparison run: add `gpt-5.4-mini` with `reasoning_effort=medium` when calibrating a new sensor, checking disagreement, or validating a high-stakes phase
    - Escalation path: use `gpt-5.4` with `reasoning_effort=high` only when the phase was messy or cross-run disagreement materially changes synthesis judgment
    - Do NOT hardcode legacy `quality -> opus` / `balanced -> sonnet` mappings in Codex-native workflows
  - The orchestrator passes file PATHS to sensors, not file CONTENTS (prevents context bloat)
  - JSON extraction uses ## SENSOR OUTPUT / ## END SENSOR OUTPUT delimiters with fallback to fenced code block search
  - This pattern differs from map-codebase: mappers write files and return confirmations, sensors return data (JSON) to the orchestrator. The delimiter protocol ensures reliable data transfer across Task() boundaries.
-->
</purpose>

<core_principle>
Signal collection is a retrospective pass -- it reads execution artifacts (PLANs, SUMMARYs, VERIFICATION) without modifying them. The workflow validates prerequisites, discovers available sensors from the file system, reads sensor configuration, spawns enabled sensors in parallel via Task(), collects their JSON output with timeout enforcement, tracks per-sensor stats, and delegates synthesis to the signal synthesizer agent.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
Read config.json for commit_docs, model_profile, and any `signal_collection` overrides.
</required_reading>

<process>

<step name="validate_input">
Receive phase number as argument. Validate and locate the phase directory:

```bash
PHASE_ARG="$1"
PADDED_PHASE=$(printf "%02d" ${PHASE_ARG} 2>/dev/null || echo "${PHASE_ARG}")
PHASE_DIR=$(ls -d .planning/phases/${PADDED_PHASE}-* .planning/phases/${PHASE_ARG}-* 2>/dev/null | head -1)

if [ -z "$PHASE_DIR" ]; then
  echo "ERROR: No phase directory found matching phase '${PHASE_ARG}'"
  echo "Check .planning/phases/ for available phases."
  exit 1
fi

echo "Phase directory: $PHASE_DIR"
```

Error if no matching directory exists.
</step>

<step name="locate_artifacts">
Find all execution artifacts in the phase directory:

```bash
# Find all PLAN.md and SUMMARY.md files
PLANS=$(ls -1 "$PHASE_DIR"/*-PLAN.md 2>/dev/null)
SUMMARIES=$(ls -1 "$PHASE_DIR"/*-SUMMARY.md 2>/dev/null)
VERIFICATION=$(ls -1 "$PHASE_DIR"/*-VERIFICATION.md 2>/dev/null)

PLAN_COUNT=$(echo "$PLANS" | grep -c '.' 2>/dev/null || echo 0)
SUMMARY_COUNT=$(echo "$SUMMARIES" | grep -c '.' 2>/dev/null || echo 0)

echo "Plans found: $PLAN_COUNT"
echo "Summaries found: $SUMMARY_COUNT"
echo "Verification: ${VERIFICATION:-none}"
```

Count how many plans have summaries (completed plans only).
</step>

<step name="check_prerequisites">
At least one SUMMARY.md must exist -- signals can only be detected from completed plans:

```bash
if [ "$SUMMARY_COUNT" -eq 0 ]; then
  echo "No completed plans to analyze."
  echo "Run \$gsdr-execute-phase $PHASE_ARG first to execute plans, then collect signals."
  exit 0
fi
```

Report: "Analyzing {N} completed plans for phase {X}"
</step>

<step name="load_config">
Read planning configuration:

```bash
MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
COMMIT_PLANNING_DOCS=$(cat .planning/config.json 2>/dev/null | grep -o '"commit_docs"[[:space:]]*:[[:space:]]*[^,}]*' | grep -o 'true\|false' || echo "true")
git check-ignore -q .planning 2>/dev/null && COMMIT_PLANNING_DOCS=false

PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
```

Store `MODEL_PROFILE`, `COMMIT_PLANNING_DOCS`, and `PROJECT_NAME` for use in agent spawn.
If `signal_collection` is absent, use the workflow defaults documented below.
</step>

<step name="discover_sensors">
Scan the agents directory for sensor agent specs matching the `gsdr-*-sensor.md` naming convention. This is the preferred auto-discovery mechanism because it keeps sensors self-describing on disk. If none are present, fall back to the built-in runtime sensor roles.

```bash
# Discover all sensor agent specs from the file system
SENSOR_FILES=$(ls -1 ~/.claude/agents/gsdr-*-sensor.md 2>/dev/null)

if [ -z "$SENSOR_FILES" ]; then
  echo "No file-backed sensor specs found; falling back to built-in runtime sensors."
  DISCOVERED_SENSORS="artifact|builtin:gsdr-artifact-sensor|45\ngit|builtin:gsdr-git-sensor|45\n"
else
  DISCOVERED_SENSORS=""
  for SENSOR_FILE in $SENSOR_FILES; do
    # Extract sensor name from filename: gsdr-{name}-sensor.md -> {name}
    SENSOR_NAME=$(basename "$SENSOR_FILE" | sed 's/^gsdr-//' | sed 's/-sensor\.md$//')

    # Parse frontmatter for contract fields
    # Extract timeout_seconds (default 45 if not declared)
    TIMEOUT=$(grep -m1 'timeout_seconds:' "$SENSOR_FILE" | grep -o '[0-9]*' || echo "45")
    [ -z "$TIMEOUT" ] && TIMEOUT=45

    # Build discovered sensor entry: name|spec_path|timeout_seconds
    DISCOVERED_SENSORS="${DISCOVERED_SENSORS}${SENSOR_NAME}|${SENSOR_FILE}|${TIMEOUT}\n"
  done
fi

# Report discovery results
SENSOR_COUNT=$(echo -e "$DISCOVERED_SENSORS" | grep -c '|' 2>/dev/null || echo 0)
SENSOR_NAMES=$(echo -e "$DISCOVERED_SENSORS" | grep '|' | cut -d'|' -f1 | tr '\n' ', ' | sed 's/,$//')
echo "Discovered ${SENSOR_COUNT} sensors: ${SENSOR_NAMES}"
```

For each discovered sensor, the entry contains: name, spec_path_or_role, timeout_seconds.
If frontmatter parsing fails for a file-backed sensor, log a warning, skip that sensor, and continue with the rest.
</step>

<step name="load_sensor_config">
For each discovered sensor, check config for enable/disable overrides. Sensors not listed in config default to enabled -- this is the "drop a file" design: adding a new sensor agent spec automatically makes it active without config changes.

Signal collection also supports optional multi-run comparison. The default is one primary run on `gpt-5.4` at `medium`. Comparison runs are opt-in and should stay rare.

```bash
# Read signal-collection config from project config
SENSOR_CONFIG=$(cat .planning/config.json 2>/dev/null | node -e "
  const c = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const sc = c.signal_collection || {};
  const sensors = sc.sensors || {};
  console.log(JSON.stringify(sensors));
" 2>/dev/null || echo '{}')

SYNTHESIZER_MODEL=$(cat .planning/config.json 2>/dev/null | node -e "
  const c = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const sc = c.signal_collection || {};
  console.log(sc.synthesizer_model || 'gpt-5.4');
" 2>/dev/null || echo 'gpt-5.4')

SYNTHESIZER_REASONING_EFFORT=$(cat .planning/config.json 2>/dev/null | node -e "
  const c = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const sc = c.signal_collection || {};
  console.log(sc.synthesizer_reasoning_effort || 'medium');
" 2>/dev/null || echo 'medium')

SENSOR_RUNS=$(cat .planning/config.json 2>/dev/null | node -e "
  const c = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const sc = c.signal_collection || {};
  const runs = Array.isArray(sc.sensor_runs) && sc.sensor_runs.length > 0
    ? sc.sensor_runs
    : [{ label: 'primary', model: 'gpt-5.4', reasoning_effort: 'medium', enabled: true }];
  console.log(JSON.stringify(runs.filter(r => r.enabled !== false)));
" 2>/dev/null || echo '[{\"label\":\"primary\",\"model\":\"gpt-5.4\",\"reasoning_effort\":\"medium\",\"enabled\":true}]')
```

For each discovered sensor, cross-reference with config:
- If `config.signal_collection.sensors[name]` exists: use its `enabled` value
- If no config entry exists for a sensor: default to `{enabled: true}`
- To disable a sensor, user adds explicit `"sensor_name": {"enabled": false}` to config

Recommended config shape:

```json
{
  "signal_collection": {
    "sensor_runs": [
      { "label": "primary", "model": "gpt-5.4", "reasoning_effort": "medium" },
      { "label": "compare", "model": "gpt-5.4-mini", "reasoning_effort": "medium", "enabled": false }
    ],
    "synthesizer_model": "gpt-5.4",
    "synthesizer_reasoning_effort": "medium",
    "sensors": {
      "artifact": { "enabled": true },
      "git": { "enabled": true }
    }
  }
}
```

The comparison run is intentionally disabled by default. Enable it when:
- validating a new sensor or sensor prompt revision
- collecting signals for a messy or high-stakes phase
- you want a cheap disagreement check before final synthesis

Build `ENABLED_SENSOR_RUNS` and `DISABLED_SENSORS` lists from cross-referencing discovery with config. `ENABLED_SENSOR_RUNS` should expand each enabled sensor across each enabled run profile.

```bash
# Cross-reference discovered sensors with config
ENABLED_SENSOR_RUNS=""
DISABLED_SENSORS=""

for ENTRY in $(echo -e "$DISCOVERED_SENSORS" | grep '|'); do
  NAME=$(echo "$ENTRY" | cut -d'|' -f1)
  SPEC_PATH=$(echo "$ENTRY" | cut -d'|' -f2)
  TIMEOUT=$(echo "$ENTRY" | cut -d'|' -f3)

  # Check if config has an entry for this sensor
  SENSOR_ENABLED=$(echo "$SENSOR_CONFIG" | node -e "
    const cfg = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
    const entry = cfg['${NAME}'];
    // No config entry = default enabled; explicit enabled field controls override
    console.log(entry && entry.enabled === false ? 'false' : 'true');
  " 2>/dev/null || echo 'true')

  if [ "$SENSOR_ENABLED" = "true" ]; then
    while IFS= read -r RUN_ENTRY; do
      [ -z "$RUN_ENTRY" ] && continue
      RUN_LABEL=$(echo "$RUN_ENTRY" | node -e "const r = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(r.label || 'primary')")
      RUN_MODEL=$(echo "$RUN_ENTRY" | node -e "const r = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(r.model || 'gpt-5.4')")
      RUN_REASONING=$(echo "$RUN_ENTRY" | node -e "const r = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(r.reasoning_effort || 'medium')")
      ENABLED_SENSOR_RUNS="${ENABLED_SENSOR_RUNS}${NAME}|${SPEC_PATH}|${TIMEOUT}|${RUN_LABEL}|${RUN_MODEL}|${RUN_REASONING}\n"
    done < <(echo "$SENSOR_RUNS" | node -e "
      const runs = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
      for (const run of runs) console.log(JSON.stringify(run));
    ")
  else
    DISABLED_SENSORS="${DISABLED_SENSORS}${NAME}\n"
  fi
done

ENABLED_NAMES=$(echo -e "$ENABLED_SENSOR_RUNS" | grep '|' | cut -d'|' -f1,4 | sed 's/|/@/' | tr '\n' ', ' | sed 's/,$//')
DISABLED_NAMES=$(echo -e "$DISABLED_SENSORS" | grep -v '^$' | tr '\n' ', ' | sed 's/,$//')
echo "Enabled: ${ENABLED_NAMES:-none}. Disabled: ${DISABLED_NAMES:-none}."
```

`MODEL_PROFILE` can still influence whether comparison mode is worth enabling, but it should not override the explicit Codex defaults above.
</step>

<step name="spawn_sensors">
For each `ENABLED_SENSOR_RUN`, spawn a Task() with `run_in_background=true`. This is a dynamic loop -- no sensor names are hardcoded in the spawning logic.

```
# Record spawn timestamps for timeout tracking
SPAWN_TIME=$(date +%s)

for ENTRY in ENABLED_SENSOR_RUNS:
  NAME = ENTRY.name
  SPEC_PATH = ENTRY.spec_path
  TIMEOUT = ENTRY.timeout_seconds
  RUN_LABEL = ENTRY.run_label
  MODEL = ENTRY.model
  REASONING_EFFORT = ENTRY.reasoning_effort
  SENSOR_AGENT_TYPE = ENTRY.spec_path starts with "builtin:"
    ? ENTRY.spec_path without "builtin:"
    : "gsdr-" + NAME + "-sensor"

  Task(
    subagent_type=SENSOR_AGENT_TYPE,
    model=MODEL,
    reasoning_effort=REASONING_EFFORT,
    run_in_background=true,
    description="Collect signals for phase {PADDED_PHASE} ({NAME}@{RUN_LABEL})",
    prompt="Analyze phase {PADDED_PHASE} execution artifacts.
      Phase directory: {PHASE_DIR}
      Project name: {PROJECT_NAME}
      Model profile: {MODEL_PROFILE}
      Run label: {RUN_LABEL}
      Model: {MODEL}
      Reasoning effort: {REASONING_EFFORT}

      Read the relevant files from the phase directory.
      Apply signal-detection.md rules.
      Return your results as a JSON object with format:
      { sensor: '{NAME}', phase: N, signals: [...] }
      Each signal needs: summary, signal_type, signal_category, severity, tags, evidence, confidence, confidence_basis, context."
  )
```

Note: Pass FILE PATHS and let the sensor read them itself. Do NOT read artifact contents into variables and pass them in the prompt. This prevents orchestrator context bloat (sensors have Read/Bash/Glob/Grep tools).

Track spawned sensor names, run labels, model metadata, and spawn timestamps for output collection and timeout enforcement.
</step>

<step name="collect_sensor_outputs">
Wait for all background tasks to complete. For each sensor's response, extract JSON using the structured delimiter protocol. Enforce per-sensor timeouts and track execution stats.

1. Look for `## SENSOR OUTPUT` and `## END SENSOR OUTPUT` markers in the agent response
2. Extract the JSON block between these markers (specifically the ```json...``` fenced code block)
3. Parse the JSON into a structured object: `{ sensor: string, phase: number, signals: array }`
4. **Fallback:** If delimiters are not found, attempt to find a ```json...``` code block containing `"sensor"` as a fallback. Log a warning: "Sensor {name} response missing structured delimiters -- using fallback JSON extraction"
5. **Failure:** If no JSON can be extracted, log the failure: "Sensor {name} returned unparseable output -- skipping" and continue with other sensors

**Per-sensor timeout tracking:**
- Record spawn timestamp at spawn time
- When collecting output, compare elapsed time against the sensor's declared `timeout_seconds`
- If a sensor's output is not received within its timeout: treat as returning empty array
- Log inline warning: "WARNING: {name}-sensor timed out ({timeout}s), signals may be incomplete"

**Per-sensor stats tracking via Phase 37 mechanism:**
After each sensor output is collected (success or failure), track stats:

```bash
# On successful sensor output collection:
node ~/.claude/get-shit-done-reflect/bin/gsd-tools.js automation track-event "sensor_{NAME}" fire

# On sensor failure (parse error, agent error):
node ~/.claude/get-shit-done-reflect/bin/gsd-tools.js automation track-event "sensor_{NAME}" skip "parse-error"
# or
node ~/.claude/get-shit-done-reflect/bin/gsd-tools.js automation track-event "sensor_{NAME}" skip "agent-error"

# On sensor timeout:
node ~/.claude/get-shit-done-reflect/bin/gsd-tools.js automation track-event "sensor_{NAME}" skip "timeout"
```

Collect all successfully parsed sensor JSON arrays into a merged list: `MERGED_SENSOR_JSON`.
Preserve `sensor`, `run_label`, `model`, and `reasoning_effort` metadata alongside each payload so the synthesizer can reason about cross-run convergence and disagreement.

Track counts:
- `TOTAL_CANDIDATES`: Total signals across all sensors
- `SENSORS_COMPLETED`: Number of sensors that returned valid JSON
- `SENSORS_FAILED`: Number of sensors that failed or returned unparseable output
- `SENSORS_FALLBACK`: Number of sensors that required fallback extraction (missing delimiters)
- `SENSORS_TIMED_OUT`: Number of sensors that exceeded their declared timeout
- `COMPARISON_DISAGREEMENTS`: Number of sensor families whose primary and comparison runs materially disagreed on the final candidate set

If comparison mode is enabled:
- Compare primary vs comparison outputs by sensor family before synthesis
- If they converge on the same high-level signal set, proceed normally
- If they diverge only in phrasing or signal slicing, note the disagreement and let the synthesizer merge
- If they diverge on whether a signal exists or materially change severity/category, rerun the conflicting sensor(s) on `gpt-5.4` with `reasoning_effort=high` before final synthesis
</step>

<step name="enrich_signal_metadata">
New signals SHOULD include enrichment fields auto-populated from the runtime environment. These fields support future cross-project signal sharing by providing environment context.

**Enrichment fields for new signals:**

```yaml
source: local
environment:
  os: "$(uname -s | tr '[:upper:]' '[:lower:]')"
  node_version: "$(node --version 2>/dev/null || echo 'unknown')"
  config_profile: "$(node -e \"try{console.log(JSON.parse(require('fs').readFileSync('.planning/config.json','utf8')).model_profile||'unknown')}catch{console.log('unknown')}\" 2>/dev/null || echo 'unknown')"
```

- `source: local` indicates the signal was generated from the local project KB. Future cross-project signal sharing will use `source: external`.
- `environment` fields are auto-populated and help diagnose whether a signal is environment-specific or universal.
- Do NOT backfill existing signals with these fields -- only new signals carry enrichment metadata.

Note: The `source` enrichment field (`local`/`external`) is distinct from the existing signal schema `source` field (`auto`/`manual`) which tracks detection method. In signal frontmatter, use `origin: local` to avoid collision with the detection-method `source` field.
</step>

<step name="spawn_synthesizer">
Spawn the synthesizer as a foreground Task() (NOT background -- we need its report):

```
Task(
  subagent_type="gsdr-signal-synthesizer",
  model="{synthesizer_model}",
  reasoning_effort="{synthesizer_reasoning_effort}",
  description="Synthesize signals for phase {PADDED_PHASE}",
  prompt="Synthesize and persist signals for phase {PADDED_PHASE}.
    Project name: {PROJECT_NAME}

    Raw signal candidates from sensors:
    {MERGED_SENSOR_JSON}

    Read the KB index (at .planning/knowledge/index.md or ~/.gsd/knowledge/index.md fallback) for dedup checking.
    Apply all quality gates: trace filter, cross-sensor dedup, KB dedup, rigor enforcement, per-phase cap.
    Write qualifying signals to the KB signals directory (.planning/knowledge/signals/{PROJECT_NAME}/ or ~/.gsd/knowledge/signals/{PROJECT_NAME}/ fallback).
    Rebuild index with: bash get-shit-done-reflect/bin/kb-rebuild-index.sh (or ~/.gsd/bin/kb-rebuild-index.sh fallback)
    Return your Synthesizer Report when complete."
)
```

The synthesizer defaults to `gpt-5.4` with `reasoning_effort=medium`.
Escalate the synthesizer to `reasoning_effort=high` only when sensor disagreement remains material after comparison or the phase itself was unusually messy.
</step>

<step name="receive_report">
The signal synthesizer agent returns a structured Synthesizer Report containing:
- Total candidates received (from sensors)
- Signals filtered (trace, duplicate, failed rigor)
- Signals persisted (with IDs, types, severities)
- Signal files written (paths)
- Per-sensor breakdown
- Notes and observations

Parse the report for the results presentation step.
</step>

<step name="present_results">
Display user-friendly results using GSD UI patterns with per-sensor breakdowns:

```
GSD > SIGNAL COLLECTION COMPLETE

Phase {X}: {Name}
Plans analyzed: {N}
Sensors run: {enabled_list} ({disabled_list}: disabled)
Comparison mode: {comparison_mode_status}

### Per-Sensor Results
| Sensor@Run | Candidates | Merged | Written |
|------------|------------|--------|---------|
| {name}@{run_label} | N | N | N |

### Model Comparison
{comparison summary if more than one run profile was used}

### Synthesizer Summary
{synthesizer report content}
```

If zero signals detected:
```
No signals detected for phase {X}. Clean execution.
```

Include sensor health notes:
- If any sensors used fallback extraction: "Note: {N} sensor(s) used fallback JSON extraction"
- If any sensors failed: "Warning: {N} sensor(s) failed -- results may be incomplete"
- If any sensors timed out: "Warning: {N} sensor(s) timed out -- results may be incomplete"
- If comparison mode found material disagreement: "Warning: {N} sensor family/families disagreed across model runs; synthesis used escalation or manual judgment"

Include standing caveat at end of collection output:
"Sensors: {enabled_list}. For sensor limitations, see agent specs or run `gsd sensors blind-spots`."
</step>

<step name="rebuild_index">
If signals were written, ensure the KB index is up to date (in case the synthesizer did not rebuild it):

```bash
if [ "$SIGNALS_WRITTEN" -gt 0 ]; then
  # KB path resolution -- project-local primary, user-global fallback
  if [ -d ".planning/knowledge" ]; then
    bash get-shit-done-reflect/bin/kb-rebuild-index.sh
  else
    bash ~/.gsd/bin/kb-rebuild-index.sh
  fi
fi
```
</step>

<step name="commit_signals">
If signals were written and `COMMIT_PLANNING_DOCS` is true, commit the new signal files:

```bash
if [ "$COMMIT_PLANNING_DOCS" = "true" ] && [ "$SIGNALS_WRITTEN" -gt 0 ]; then
  # Stage individual signal files
  # KB path resolution -- project-local primary, user-global fallback
  if [ -d ".planning/knowledge" ]; then KB_DIR=".planning/knowledge"; else KB_DIR="$HOME/.gsd/knowledge"; fi
  for signal_file in $(ls $KB_DIR/signals/${PROJECT_NAME}/*.md 2>/dev/null); do
    git add "$signal_file"
  done
  # Stage updated index
  git add $KB_DIR/index.md
  git commit -m "docs(signals): collect phase ${PADDED_PHASE} signals

- ${SIGNALS_WRITTEN} signals persisted
- Sensors: ${SENSORS_COMPLETED} completed, ${SENSORS_FAILED} failed
- Index rebuilt"
fi
```

Skip if `COMMIT_PLANNING_DOCS` is false or no signals were written.
</step>

</process>

<error_handling>
**No phase directory:** Report error with available phases and exit.
**No summaries:** Report "no completed plans" and exit cleanly (not an error).
**No sensors discovered:** Report error only after both discovery paths fail: no file-backed specs and no built-in runtime roles available.
**Single sensor failure:** Log the failure, track via track-event with skip reason, continue with remaining sensors. Only fail the whole workflow if ALL sensors fail.
**Single sensor timeout:** Log inline warning, track via track-event with "timeout" skip reason, treat as empty array, continue with remaining sensors.
**All sensors failed:** Report "all sensors failed" with error details. Suggest manual `\$gsdr-signal` for individual entries.
**Synthesizer failure:** Report what was attempted and suggest manual `\$gsdr-signal` for individual entries.
**KB directory missing:** Synthesizer creates it (mkdir -p) during signal write step.
**JSON extraction failure:** Use fallback extraction (fenced code block search). If fallback also fails, skip that sensor and continue.
**Frontmatter parse failure:** Log warning "Sensor {name} has malformed frontmatter -- skipping", continue with remaining sensors.
</error_handling>
