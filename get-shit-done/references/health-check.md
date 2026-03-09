# Health Check Reference

## 1. Overview

Defines output format, repair rules, and signal integration for workspace validation via `/gsd:health-check`.

**Architecture:** The health check system uses a probe-based architecture. Check definitions have been migrated to individual probe files in `references/health-probes/`. See each probe file for check IDs, shell patterns, and blocking rules.

**Key references:**
- **Probe files:** `get-shit-done/references/health-probes/*.md` -- individual check definitions with YAML frontmatter contract
- **Scoring model:** `get-shit-done/references/health-scoring.md` -- two-dimensional scoring (infrastructure + workflow), composite matrix, cache format
- **Workflow:** `get-shit-done/workflows/health-check.md` -- probe discovery, filtering, execution, and reporting orchestration

**Probe contract:** Each probe file declares:
- `probe_id` -- unique identifier
- `category` -- human-readable category name
- `tier` -- `default` (always runs) or `full` (only with `--full`)
- `dimension` -- `infrastructure` (binary) or `workflow` (weighted)
- `execution` -- `inline` (bash checks), `subcommand` (gsd-tools.js), or `agent` (subagent)
- `depends_on` -- list of probe_ids that must pass before this probe runs

**Consumers:**
- `/gsd:health-check` command (user-facing entry point)
- `get-shit-done/workflows/health-check.md` (orchestration logic)

**Modes:**

| Mode | Flag | Checks Included | Expected Duration |
|------|------|-----------------|-------------------|
| Default (quick) | (none) | All default-tier probes | <5s |
| Full | `--full` | Default + full-tier probes | <15s |
| Focused KB | `--focus kb` | KB Integrity probes only | <3s |
| Focused Planning | `--focus planning` | Planning Consistency probes only | <3s |

**Flags:**
- `--full` -- Run all check categories including full-tier checks
- `--focus kb` -- Run only KB Integrity checks
- `--focus planning` -- Run only Planning Consistency checks
- `--fix` -- Enable repair mode (auto in YOLO, prompt in interactive)
- `--stale-days N` -- Override configured staleness threshold (default: 7 days)

## 2. Output Format

Health check results use a hybrid categorized checklist format.

```markdown
## Workspace Health Report
**Project:** {project-name} | **Health:** {composite} | **Date:** {YYYY-MM-DD}

Standing caveat: "Health checks measure known categories. Absence of findings does not mean absence of problems."

### {Category} [{PASS|WARNING|FAIL}]
- [x] Passed check description (detail)
- [ ] Failed check description (remediation hint)

### Summary
Infrastructure: {HEALTHY|DEGRADED|UNHEALTHY} | Workflow: {LOW|MED|HIGH|UNMEASURED}
Composite: {GREEN|YELLOW|RED}
{N} checks passed | {M} warnings | {K} failures
```

**Category status rules:**
- **PASS** -- All checks in category passed
- **WARNING** -- At least one WARNING, no FAILs
- **FAIL** -- At least one FAIL in category

**Remediation hints:** Failed or warned checks include a brief hint in parentheses. Repairable issues include "(use --fix to repair)" suffix.

**Final summary line:** Aggregated counts across all categories. If warnings or failures exist, append: `Run /gsd:health-check --fix to auto-repair.`

## 3. Repair Rules

The `--fix` flag enables repair mode for repairable issues.

**Autonomy behavior:**
- **YOLO mode:** Auto-repair without prompting. Report what was fixed.
- **Interactive mode:** Ask before each repair using AskUserQuestion. User can approve, skip, or abort.

### Repairable Issues

| Issue | Repair Action | Risk |
|-------|--------------|------|
| KB index mismatch (KB-03/04/05) | Run `kb-rebuild-index.sh` to regenerate index from files | None -- index is derived data |
| Missing `gsd_reflect_version` (CFG-05) | Set to installed VERSION value in config.json | None -- additive field |
| Missing `health_check` section (CFG-06) | Add default health_check config to config.json | None -- additive section |
| Missing config template fields (DRIFT-01) | Add missing fields with template defaults | Low -- additive fields with safe defaults |
| Orphaned `.continue-here` files (STALE-01) | Delete the stale files | Low -- files are past their useful life |
| Signal lifecycle mismatch (SIG-01) | Run `reconcile-signal-lifecycle.sh` on affected phase directories | Low -- updates lifecycle metadata only |

**Repair execution pattern:**

```bash
# Example: Add missing health_check section to config.json
node -e "
const fs = require('fs');
const config = JSON.parse(fs.readFileSync('.planning/config.json', 'utf8'));
if (!config.health_check) {
  config.health_check = {
    frequency: 'milestone-only',
    stale_threshold_days: 7,
    blocking_checks: false
  };
  fs.writeFileSync('.planning/config.json', JSON.stringify(config, null, 2) + '\n');
  console.log('Added health_check section with defaults');
}
"
```

### Non-Repairable Issues

These are reported but not auto-fixed. User action required.

| Issue | Why Not Repairable | User Action |
|-------|-------------------|-------------|
| Missing `.planning/config.json` (CFG-01) | Project not initialized | Run `/gsd:new-project` |
| Missing KB directory | KB infrastructure not set up | Run KB initialization |
| Abandoned debug sessions (STALE-02) | User must decide resolution | Review and resolve or delete manually |
| Incomplete spikes (STALE-03) | User must decide if spike is still needed | Complete the spike or remove it |
| Missing phase directories (PLAN-01) | May indicate ROADMAP.md is stale | Review ROADMAP.md alignment |
| Missing SUMMARY.md files (PLAN-02) | Plan may not have been executed yet | Execute the plan or mark as skipped |

## 4. Signal Integration

Health check findings can be persisted as signals to enable the reflection engine to detect recurring workspace issues.

**When to persist:**
- If findings include WARNING or FAIL results, persist a health-check signal
- If all checks PASS, log as trace (not persisted)

**Signal properties:**

| Field | Value |
|-------|-------|
| `type` | signal |
| `signal_type` | custom |
| `severity` | notable (warnings or failures found) |
| `polarity` | negative (issues found) or positive (clean report after previous issues) |
| `tags` | `workspace/health-check`, `workspace/{category}` (for each failing category) |
| `source` | auto |

**Signal body template:**

```markdown
## What Happened

Health check on {date} found {N} warnings and {K} failures.

Categories affected: {list of WARNING/FAIL categories}

## Context

Project: {project-name}
Mode: {default|full|focused}
Repair applied: {yes|no}

## Potential Cause

{Brief assessment based on findings -- e.g., "KB index drifted after manual file edits" or "Config predates health_check feature"}
```

**Autonomy behavior for signal persistence:**
- YOLO mode: auto-persist signal if findings exist
- Interactive mode: ask user if they want to persist the signal

## 5. Configuration

Health check behavior is controlled by these `config.json` fields:

```json
{
  "health_check": {
    "frequency": "milestone-only",
    "stale_threshold_days": 7,
    "blocking_checks": false,
    "workflow_thresholds": {"low": 2.0, "high": 5.0},
    "resolution_ratio_threshold": 5.0,
    "reactive_threshold": "RED",
    "cache_staleness_hours": 24
  }
}
```

See `feature-manifest.json` for full schema definitions and defaults.

**Frequency behavior:**

| Frequency | When It Runs | Typical Use |
|-----------|-------------|-------------|
| `milestone-only` | At milestone completion boundaries | Default -- minimal overhead |
| `on-resume` | When resuming after a break | For users who want assurance after time away |
| `every-phase` | Before `/gsd:execute-phase` starts | For users who want continuous validation |
| `explicit-only` | Only when user runs `/gsd:health-check` | For minimal-overhead preference |

**Flag override:** `--stale-days N` overrides `health_check.stale_threshold_days` for a single invocation without changing the config.

---

*Reference version: 2.0.0*
*Updated: 2026-03-06*
*Phase: 41-health-score-automation*
