<purpose>
Orchestrate multi-sensor signal collection for a completed phase. Spawns enabled sensor agents in parallel, collects their structured JSON output, and passes it to the signal synthesizer for quality-gated KB persistence.

<!-- Architecture notes:
  - Sensors return JSON to orchestrator -- they do NOT write to KB (single-writer principle)
  - Sensor model selection: auto = derive from model_profile; explicit = use specified model
  - The orchestrator passes file PATHS to sensors, not file CONTENTS (prevents context bloat)
  - JSON extraction uses ## SENSOR OUTPUT / ## END SENSOR OUTPUT delimiters with fallback to fenced code block search
  - This pattern differs from map-codebase: mappers write files and return confirmations, sensors return data (JSON) to the orchestrator. The delimiter protocol ensures reliable data transfer across Task() boundaries.
-->
</purpose>

<core_principle>
Signal collection is a retrospective pass -- it reads execution artifacts (PLANs, SUMMARYs, VERIFICATION) without modifying them. The workflow validates prerequisites, reads sensor configuration, spawns enabled sensors in parallel via Task(), collects their JSON output, and delegates synthesis to the signal synthesizer agent.
</core_principle>

<required_reading>
Read STATE.md before any operation to load project context.
Read config.json for model_profile and commit_docs settings.
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
  echo "Run /gsd:execute-phase $PHASE_ARG first to execute plans, then collect signals."
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
</step>

<step name="load_sensor_config">
Read sensor configuration from the project config, falling back to feature manifest defaults:

```bash
# Read sensor config -- check project config first, fall back to manifest defaults
SENSOR_CONFIG=$(cat .planning/config.json 2>/dev/null | node -e "
  const c = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const sc = c.signal_collection || {};
  const sensors = sc.sensors || {
    artifact: { enabled: true, model: 'auto' },
    git: { enabled: true, model: 'auto' },
    log: { enabled: false, model: 'auto' }
  };
  console.log(JSON.stringify(sensors));
" 2>/dev/null || echo '{"artifact":{"enabled":true,"model":"auto"},"git":{"enabled":true,"model":"auto"},"log":{"enabled":false,"model":"auto"}}')

SYNTHESIZER_MODEL=$(cat .planning/config.json 2>/dev/null | node -e "
  const c = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  const sc = c.signal_collection || {};
  console.log(sc.synthesizer_model || 'auto');
" 2>/dev/null || echo 'auto')
```

Determine model for each sensor based on the `model` field:
- `"auto"`: Use the orchestrator's `MODEL_PROFILE` to select (quality = opus, balanced = sonnet)
- Specific model string: Use that model directly

Resolve sensor models:

```bash
# Resolve "auto" to concrete model based on MODEL_PROFILE
resolve_model() {
  local model_setting="$1"
  if [ "$model_setting" = "auto" ]; then
    if [ "$MODEL_PROFILE" = "quality" ]; then
      echo "opus"
    else
      echo "sonnet"
    fi
  else
    echo "$model_setting"
  fi
}
```

Parse enabled sensors from SENSOR_CONFIG and store the enabled sensor list for spawning.
</step>

<step name="spawn_sensors">
For each ENABLED sensor, spawn a Task() with `run_in_background=true`:

**Artifact Sensor** (if enabled):
```
Task(
  subagent_type="gsd-artifact-sensor",
  model="{sensor_model}",
  run_in_background=true,
  description="Collect artifact signals for phase {PADDED_PHASE}",
  prompt="Analyze phase {PADDED_PHASE} execution artifacts.
    Phase directory: {PHASE_DIR}
    Project name: {PROJECT_NAME}
    Model profile: {MODEL_PROFILE}

    Read PLAN.md and SUMMARY.md files from the phase directory.
    Read VERIFICATION.md if it exists.
    Read .planning/config.json for model_profile.
    Apply signal-detection.md rules.
    Return your results as a JSON object with format:
    { sensor: 'artifact', phase: N, signals: [...] }
    Each signal needs: summary, signal_type, signal_category, severity, tags, evidence, confidence, confidence_basis, context."
)
```

Note: Pass FILE PATHS and let the sensor read them itself. Do NOT read artifact contents into variables and pass them in the prompt. This prevents orchestrator context bloat (sensors have Read/Bash/Glob/Grep tools).

**Git Sensor** (if enabled):
```
Task(
  subagent_type="gsd-git-sensor",
  model="{sensor_model}",
  run_in_background=true,
  description="Collect git signals for phase {PADDED_PHASE}",
  prompt="Analyze git history for phase {PADDED_PHASE} patterns.
    Phase directory: {PHASE_DIR}
    Project name: {PROJECT_NAME}

    Detect fix-fix-fix chains, file churn, and scope creep.
    Return your results as a JSON object with format:
    { sensor: 'git', phase: N, signals: [...] }"
)
```

**Log Sensor** (if enabled -- disabled by default):
```
Task(
  subagent_type="gsd-log-sensor",
  model="{sensor_model}",
  run_in_background=true,
  description="Collect log signals for phase {PADDED_PHASE}",
  prompt="Phase {PADDED_PHASE}. Return empty results.
    { sensor: 'log', phase: N, signals: [] }"
)
```

Track which sensors were spawned: `SENSORS_SPAWNED` (list of names).
</step>

<step name="collect_sensor_outputs">
Wait for all background tasks to complete. For each sensor's response, extract JSON using the structured delimiter protocol:

1. Look for `## SENSOR OUTPUT` and `## END SENSOR OUTPUT` markers in the agent response
2. Extract the JSON block between these markers (specifically the ```json...``` fenced code block)
3. Parse the JSON into a structured object: `{ sensor: string, phase: number, signals: array }`
4. **Fallback:** If delimiters are not found, attempt to find a ```json...``` code block containing `"sensor"` as a fallback. Log a warning: "Sensor {name} response missing structured delimiters -- using fallback JSON extraction"
5. **Failure:** If no JSON can be extracted, log the failure: "Sensor {name} returned unparseable output -- skipping" and continue with other sensors

Collect all successfully parsed sensor JSON arrays into a merged list: `MERGED_SENSOR_JSON`.

Track counts:
- `TOTAL_CANDIDATES`: Total signals across all sensors
- `SENSORS_COMPLETED`: Number of sensors that returned valid JSON
- `SENSORS_FAILED`: Number of sensors that failed or returned unparseable output
- `SENSORS_FALLBACK`: Number of sensors that required fallback extraction (missing delimiters)
</step>

<step name="spawn_synthesizer">
Spawn the synthesizer as a foreground Task() (NOT background -- we need its report):

```
Task(
  subagent_type="gsd-signal-synthesizer",
  model="{synthesizer_model}",
  description="Synthesize signals for phase {PADDED_PHASE}",
  prompt="Synthesize and persist signals for phase {PADDED_PHASE}.
    Project name: {PROJECT_NAME}

    Raw signal candidates from sensors:
    {MERGED_SENSOR_JSON}

    Read the KB index at ~/.gsd/knowledge/index.md for dedup checking.
    Apply all quality gates: trace filter, cross-sensor dedup, KB dedup, rigor enforcement, per-phase cap.
    Write qualifying signals to ~/.gsd/knowledge/signals/{PROJECT_NAME}/.
    Rebuild index with: bash ~/.gsd/bin/kb-rebuild-index.sh
    Return your Synthesizer Report when complete."
)
```

The synthesizer model follows the `synthesizer_model` config field (default `"auto"`, resolved same as sensor models).
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
Sensors run: {artifact, git} (log: disabled)

### Per-Sensor Results
| Sensor | Candidates | Merged | Written |
|--------|------------|--------|---------|
| artifact | N | N | N |
| git | N | N | N |

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
</step>

<step name="rebuild_index">
If signals were written, ensure the KB index is up to date (in case the synthesizer did not rebuild it):

```bash
if [ "$SIGNALS_WRITTEN" -gt 0 ]; then
  bash ~/.gsd/bin/kb-rebuild-index.sh
fi
```
</step>

<step name="commit_signals">
If signals were written and `COMMIT_PLANNING_DOCS` is true, commit the new signal files:

```bash
if [ "$COMMIT_PLANNING_DOCS" = "true" ] && [ "$SIGNALS_WRITTEN" -gt 0 ]; then
  # Stage individual signal files
  for signal_file in $(ls ~/.gsd/knowledge/signals/${PROJECT_NAME}/*.md 2>/dev/null); do
    git add "$signal_file"
  done
  # Stage updated index
  git add ~/.gsd/knowledge/index.md
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
**Single sensor failure:** Log the failure, continue with remaining sensors. Only fail the whole workflow if ALL sensors fail.
**All sensors failed:** Report "all sensors failed" with error details. Suggest manual `/gsd:signal` for individual entries.
**Synthesizer failure:** Report what was attempted and suggest manual `/gsd:signal` for individual entries.
**KB directory missing:** Synthesizer creates it (mkdir -p) during signal write step.
**JSON extraction failure:** Use fallback extraction (fenced code block search). If fallback also fails, skip that sensor and continue.
</error_handling>
