<purpose>
Orchestrate workspace health validation via auto-discovered probe files. Discovers probes from references/health-probes/, filters by tier/focus, sorts by dependencies, executes each probe, computes the two-dimensional health score, writes cache, and reports findings.
</purpose>

<core_principle>
The workflow is a generic executor -- it discovers and runs probes without knowing about specific check categories. Adding a new check = adding a probe file, zero workflow edits.
</core_principle>

<required_reading>
Read `get-shit-done/references/health-scoring.md` for scoring model and composite mapping.
Read `get-shit-done/references/health-check.md` for output format and repair rules.
Read `.planning/config.json` for health_check settings.
</required_reading>

<process>

<step name="parse_arguments">
Parse command arguments for execution flags.

Supported flags:
- `--full` -- Run all check categories (default + full tier)
- `--focus kb` -- Run only KB Integrity checks
- `--focus planning` -- Run only Planning Consistency checks
- `--fix` -- Enable repair mode
- `--stale-days N` -- Override staleness threshold

```
Arguments: $ARGUMENTS

Parse flags:
  FULL_MODE = true if "--full" present
  FOCUS_MODE = "kb" | "planning" | null (from "--focus {value}")
  FIX_MODE = true if "--fix" present
  STALE_DAYS_OVERRIDE = N if "--stale-days N" present
```

Validate flag combinations:
- `--focus` takes priority over `--full`
- `--focus` and `--fix` are compatible
- `--stale-days` requires a numeric value
</step>

<step name="load_configuration">
Read workspace configuration for health check settings and autonomy mode.

```bash
CONFIG=".planning/config.json"

# Read config if it exists
if [ -f "$CONFIG" ]; then
  MODE=$(node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); console.log(c.mode||'interactive')" 2>/dev/null)
  STALE_THRESHOLD=$(node -e "const c=JSON.parse(require('fs').readFileSync('$CONFIG','utf8')); console.log((c.health_check||{}).stale_threshold_days||7)" 2>/dev/null)
else
  MODE="interactive"
  STALE_THRESHOLD=7
fi

# Flag override for stale days
if [ -n "$STALE_DAYS_OVERRIDE" ]; then
  STALE_THRESHOLD="$STALE_DAYS_OVERRIDE"
fi
```

Store:
- `MODE` -- yolo or interactive (controls repair prompting)
- `STALE_THRESHOLD` -- days before artifacts are considered stale
</step>

<step name="discover_probes">
Scan `get-shit-done/references/health-probes/*.md` (use path relative to GSD install dir).

For each .md file:
1. Parse YAML frontmatter to extract `probe_id`, `category`, `tier`, `dimension`, `execution`, `depends_on`
2. Skip files that fail to parse (report as WARNING finding, never crash)
3. Filter by tier: if `--full` flag NOT set, exclude probes with `tier: full`
4. Filter by `--focus` using **EXACT category matching** (not substring):

   | --focus value | Exact category match |
   |---------------|---------------------|
   | kb            | "KB Integrity"      |
   | planning      | "Planning Consistency" |

   Future probe categories that should respond to a `--focus` flag must be added to this mapping.
5. Build dependency graph from `depends_on` fields
6. Topological sort (Kahn's algorithm): probes with no dependencies first, then dependents
7. If circular dependency detected, report as FAIL finding and skip the cycle
</step>

<step name="execute_probes">
For each probe in topological order:

Check if any `depends_on` probe FAILed -- if so, skip this probe with status "SKIPPED (dependency failed)".

Execute based on `execution` type:

**inline:** Read the probe file body, find bash code blocks under `## Checks` section. For each check:
- Run the bash code block via Bash tool
- Parse output for PASS, WARNING, or FAIL
- Handle intra-probe blocks: if a check's `**blocks:**` list includes subsequent check IDs, and this check FAILed, skip the blocked checks
- Record result: `{id, category, description, status, detail, repairable}`

**subcommand:** Run the declared gsd-tools.js command:
```bash
node ~/.claude/get-shit-done/bin/gsd-tools.js health-probe {probe_id} --raw
```
Parse the returned JSON. Each entry in `checks` array becomes a finding.

**agent:** Spawn a subagent with the probe file as spec. Parse `SENSOR OUTPUT` delimiters for structured results. Reserved for probes requiring complex reasoning (e.g., rogue-context detection in Plan 04).
</step>

<step name="compute_score">
After all probes execute, compute the two-dimensional health score per `health-scoring.md`:

1. **Infrastructure:** aggregate all findings from `dimension: infrastructure` probes
   - HEALTHY: zero FAILs, zero WARNINGs
   - DEGRADED: at least one WARNING, zero FAILs
   - UNHEALTHY: any FAIL

2. **Workflow:** aggregate findings from `dimension: workflow` probes
   - **UNMEASURED handling:** If NO workflow-dimension probes produced results (all were skipped
     due to dependency failures, e.g., kb-integrity failed causing signal-metrics and signal-density
     to skip), set workflow level to UNMEASURED. Display in report as "Workflow: unmeasured (dependency failed)".
     For composite score mapping, treat UNMEASURED the same as LOW but display the reason.
   - Otherwise (at least one workflow probe produced results):
     Use `dimension_contribution` from subcommand JSON output.
     Sum weighted signals (critical*1.0 + notable*0.3 + minor*0.1) after pattern dedup.
     Compare against `workflow_thresholds` (from config or defaults low=2.0, high=5.0).
     Result: LOW / MED / HIGH

3. **Composite:** apply 3x3 matrix from `health-scoring.md` -> GREEN / YELLOW / RED
   - When workflow is UNMEASURED, use the LOW column of the matrix (same scores)
     but annotate the composite with "(workflow unmeasured)"

4. **Write cache** to `~/.claude/cache/gsd-health-score.json`:
   ```json
   {
     "infrastructure": "HEALTHY|DEGRADED|UNHEALTHY",
     "workflow": "LOW|MED|HIGH|UNMEASURED",
     "composite": "GREEN|YELLOW|RED",
     "weighted_sum": 0.0,
     "signal_count": { "critical": 0, "notable": 0, "minor": 0 },
     "resolution_ratio": 0.0,
     "density_trend": "increasing|stable|decreasing",
     "checked": 1709827200,
     "phase": 41,
     "regime_id": null
   }
   ```
   When workflow is UNMEASURED, write `workflow: "UNMEASURED"` in the cache so downstream
   consumers (statusline, hooks) can distinguish from a measured LOW.
</step>

<step name="report_findings">
Display categorized checklist output:

```markdown
## Workspace Health Report
**Project:** {name} | **Health:** {composite traffic light} | **Date:** {date}

Standing caveat: "Health checks measure known categories. Absence of findings does not mean absence of problems."

### {Category} [{PASS|WARNING|FAIL}]
- [x] Passed check description (detail)
- [ ] Failed check description (remediation hint)

### Summary
Infrastructure: {HEALTHY|DEGRADED|UNHEALTHY} | Workflow: {LOW|MED|HIGH|UNMEASURED}
Composite: {GREEN|YELLOW|RED}
{N} checks passed | {M} warnings | {K} failures
```

Category status determination:
- **PASS** -- all checks in category passed
- **WARNING** -- at least one WARNING, no FAILs
- **FAIL** -- at least one FAIL in category

If warnings or failures exist, append:
`Run /gsd:health-check --fix to auto-repair fixable issues.`
</step>

<step name="repair_if_requested">
If `--fix` flag is set and repairable issues exist, execute repairs per `health-check.md` Section 5.

**YOLO mode (`mode: yolo`):**
- Auto-repair each repairable issue without prompting
- Report each repair action taken

**Interactive mode (`mode: interactive`):**
- For each repairable issue, use AskUserQuestion:
  `"Repair: {description}. {repair_action}. Proceed? (yes/no/abort)"`
  - "yes" -- apply repair, continue to next
  - "no" -- skip this repair, continue to next
  - "abort" -- stop all repairs

After repairs: re-run affected checks and update the report with repaired status.
</step>

<step name="signal_integration">
If findings include WARNING or FAIL results, optionally persist a health-check signal.

**Determine signal need:**
- Warnings or failures found: persist as `notable` severity signal
- All clean: log as trace (not persisted)

**Autonomy behavior:**
- YOLO mode: auto-persist signal
- Interactive mode: ask user via AskUserQuestion

**Signal creation:** Write signal file to `.planning/knowledge/signals/{project-name}/`
(or `~/.gsd/knowledge/signals/{project-name}/` fallback) following the signal schema.
After writing, run `kb-rebuild-index.sh` to update the index.
</step>

<step name="cleanup_marker">
After health check completes (regardless of results), clean up the session-start marker file if it exists.
This marker (`~/.claude/cache/gsd-health-check-needed`) is written by the SessionStart hook (Plan 03)
to indicate a health check is needed. Once any health check run completes, the marker's purpose is
fulfilled and it should be removed so the statusline no longer shows `H?`.

```bash
rm -f ~/.claude/cache/gsd-health-check-needed
```
</step>

<step name="final_summary">
Display final summary with health score and next steps.

```
Health check complete.

{N} checks passed | {M} warnings | {K} failures
Infrastructure: {state} | Workflow: {level} | Composite: {color}
{R} issues repaired (if --fix was used)
{S} signal persisted (if signal was written)

Next steps:
- {Actionable suggestions based on findings}
```
</step>

</process>

<error_handling>
**Missing KB directory:** kb-integrity probe reports FAILs; dependent probes (signal-metrics, signal-density) skip via dependency mechanism.
**Missing config.json:** config-validity probe reports FAILs; dependent probes (automation-watchdog) skip via dependency mechanism.
**No .planning/ directory:** Report "Project not initialized -- run `/gsd:new-project`" and exit.
**Probe parse failure:** Skip probe, report as WARNING finding. Continue to next probe.
**Probe execution timeout:** Skip probe, report as WARNING. Continue to next probe.
**Circular dependency:** Report as FAIL finding and skip the cycle.
**Missing cache directory:** Create `~/.claude/cache/` before writing cache file.
**Repair failure:** Report the failed repair and continue to next repairable issue.
**Shell command failure:** Report the check as FAIL with the error message. Continue to next check.
</error_handling>
