# Architecture Research: Automation Loop Integration

**Domain:** Auto-triggering signal collection, CI sensor, auto-reflection, health check hooks, plan checker semantic validation
**Researched:** 2026-03-02
**Confidence:** HIGH (all existing components read, Claude Code hooks API verified against official docs)

## System Overview: Current Architecture

```
                      COMMAND LAYER (thin orchestrators)
+----------------+  +----------------+  +----------------+  +----------------+
| /gsd:collect-  |  | /gsd:reflect   |  | /gsd:plan-     |  | /gsd:health-   |
|   signals      |  |                |  |   phase        |  |   check        |
+-------+--------+  +-------+--------+  +-------+--------+  +-------+--------+
        |                   |                   |                   |
        v                   v                   v                   v
                    WORKFLOW LAYER
+----------------+  +----------------+  +----------------+  +----------------+
| collect-       |  | reflect.md     |  | plan-phase.md  |  | health-check   |
|   signals.md   |  |                |  |                |  |   .md          |
+-------+--------+  +-------+--------+  +-------+--------+  +-------+--------+
        |                   |                   |                   |
        v                   v                   v                   v
                     AGENT LAYER
+----------------+  +----------------+  +----------------+
| artifact-sensor|  | gsd-reflector  |  | gsd-plan-      |
| git-sensor     |  |                |  |   checker      |
| log-sensor [X] |  |                |  |                |
+-------+--------+  +-------+--------+  +-------+--------+
        |                   |
        v                   v
+----------------+  +----------------+
| gsd-signal-    |  | knowledge-     |
|   synthesizer  |  |   store        |
+-------+--------+  +-------+--------+
        |                   |
        v                   v
                    KNOWLEDGE STORE
+-------------------------------------------------------+
|  ~/.gsd/knowledge/                                     |
|  +-- signals/{project}/         (YAML frontmatter .md) |
|  +-- spikes/{project}/                                 |
|  +-- lessons/{category}/                               |
|  +-- reflections/{project}/                            |
|  +-- index.md                   (auto-generated)       |
+-------------------------------------------------------+

                      HOOK LAYER
+----------------+  +----------------+
| SessionStart   |  | statusLine     |
|  gsd-check-    |  |  gsd-          |
|  update.js     |  |  statusline.js |
|  gsd-version-  |  |                |
|  check.js      |  |                |
+----------------+  +----------------+

                  settings.json (hooks config)
```

### Current Hook Usage

Currently only **two** hook types are used:

| Hook Type | Scripts | Purpose |
|-----------|---------|---------|
| `SessionStart` | `gsd-check-update.js`, `gsd-version-check.js` | Background npm version check, project migration detection |
| `statusLine` | `gsd-statusline.js` | Model, task, directory, context usage bar |

### Available Claude Code Hook Types (Not Yet Used)

Verified against official docs at [code.claude.com/docs/en/hooks](https://code.claude.com/docs/en/hooks):

| Hook Event | Fires When | Matcher | Decision Control | Relevance |
|-----------|------------|---------|------------------|-----------|
| `PostToolUse` | After tool succeeds | Tool name regex | `decision: "block"`, `reason`, `additionalContext` | **HIGH** -- detect phase completion via Write of SUMMARY.md |
| `Stop` | Main agent finishes | None | `decision: "block"`, `reason` (forces continuation) | **HIGH** -- session-end metrics, auto-trigger signal collection |
| `SubagentStop` | Subagent finishes | Agent type regex | Same as Stop | **MEDIUM** -- detect executor completion for auto-triggering |
| `PreToolUse` | Before tool executes | Tool name regex | `permissionDecision`, `updatedInput`, `additionalContext` | **LOW** -- could inject context but not needed for automation |
| `UserPromptSubmit` | Prompt submitted | None | `decision: "block"`, `additionalContext` | **LOW** -- could add context but outside scope |
| `SessionEnd` | Session terminates | Why it ended | None (side effects only) | **MEDIUM** -- cleanup, final metrics |
| `TaskCompleted` | Task marked done | None | Exit code 2 blocks | **LOW** -- GSD uses internal tracking, not TaskUpdate tool |

### Current Sensor Architecture

```
collect-signals.md (orchestrator)
    |
    +-- Task(gsd-artifact-sensor)  --> JSON signal candidates
    |   [reads PLAN.md, SUMMARY.md, VERIFICATION.md]
    |
    +-- Task(gsd-git-sensor)       --> JSON signal candidates
    |   [runs git log analysis]
    |
    +-- Task(gsd-log-sensor)       --> JSON (empty -- disabled stub)
    |
    +-- MERGE sensor outputs
    |
    +-- Task(gsd-signal-synthesizer)
        [dedup, rigor, caps, write to KB]
```

**Key constraint:** Signal synthesizer is the ONLY KB writer. Sensors return JSON only.

---

## Proposed Architecture: Automation Loop Features

### Feature 1: Auto-Triggering Signal Collection

**Goal:** Automatically run signal collection when a phase completes execution, instead of requiring manual `/gsd:collect-signals`.

**Integration point:** The `execute-phase.md` workflow, specifically after the `verify_phase_goal` step.

**Current flow (execute-phase.md):**
```
execute_waves -> aggregate_results -> verify_phase_goal -> update_roadmap -> offer_next
```

**Proposed flow:**
```
execute_waves -> aggregate_results -> verify_phase_goal -> auto_collect_signals -> update_roadmap -> offer_next
```

**New component:** `gsd-auto-collect.js` hook script (or inline workflow step).

**Architecture decision: Hook vs Workflow Step**

| Approach | Pros | Cons |
|----------|------|------|
| **PostToolUse hook on Write** | Fires automatically without workflow changes; decoupled | Noisy (fires on EVERY Write); hard to determine "phase complete" from a Write event alone; context-budget cost of false positives |
| **Stop hook** | Fires once at session end; clean trigger point | Session may not align with phase completion; too late for inline flow |
| **Inline workflow step** | Direct control; phase context available; conditional on verification result; can pass phase number | Requires modifying execute-phase.md; not decoupled |

**Recommendation: Inline workflow step in execute-phase.md.** The automation trigger knows the exact phase that completed, has the verification result, and can conditionally fire. Hooks are better for cross-cutting concerns (logging, metrics) but phase-level orchestration belongs in the workflow. The hook-based approach requires reverse-engineering "which phase just completed" from file write events, which is fragile.

**Implementation:**

New step in `execute-phase.md` between `verify_phase_goal` and `update_roadmap`:

```markdown
<step name="auto_collect_signals">
Read signal collection config:

```bash
AUTO_COLLECT=$(node -e "try { const c = require('./.planning/config.json'); console.log(c.signal_collection?.auto_collect !== false) } catch(e) { console.log('true') }")
```

If auto_collect is enabled AND verification passed (or gaps_found):

```
Task(
  prompt="Collect signals for phase {PADDED_PHASE}",
  subagent_type="general-purpose",
  description="Auto-collect signals for completed phase"
)
```

This spawns the same flow as `/gsd:collect-signals {phase}` but automatically.
</step>
```

**Config addition to feature-manifest.json:**

```json
{
  "signal_collection": {
    "schema": {
      "auto_collect": {
        "type": "boolean",
        "default": true,
        "description": "Automatically collect signals after phase execution completes"
      }
    }
  }
}
```

**Data flow change:** None to signal collection internals. The orchestrator simply invokes the existing collect-signals workflow as an inline step instead of requiring the user to run it manually.

### Feature 2: CI Sensor

**Goal:** New sensor agent that analyzes CI/CD pipeline results (GitHub Actions, GitLab CI, etc.) to detect build failures, test failures, and deployment issues as signal candidates.

**Integration point:** Parallel sensor in `collect-signals.md` orchestrator, alongside artifact-sensor and git-sensor.

**New component:** `agents/gsd-ci-sensor.md`

**Architecture:**

```
collect-signals.md (orchestrator)
    |
    +-- Task(gsd-artifact-sensor)  --> JSON
    +-- Task(gsd-git-sensor)       --> JSON
    +-- Task(gsd-ci-sensor)        --> JSON  <-- NEW
    +-- Task(gsd-log-sensor)       --> JSON (disabled)
    |
    +-- MERGE all sensor outputs
    |
    +-- Task(gsd-signal-synthesizer)
```

**Sensor design follows the established pattern:**
- Reads CI artifacts/API results
- Returns structured JSON with `## SENSOR OUTPUT` delimiters
- Does NOT write to KB (synthesizer does that)
- Configurable via `signal_collection.sensors.ci` in config

**Detection patterns for gsd-ci-sensor:**

| Pattern | Detection Method | Signal Type | Severity |
|---------|-----------------|-------------|----------|
| Build failure | Parse CI status via `gh run list`/`gh run view` | `deviation` | `notable` (single) / `critical` (recurring) |
| Test failure | Parse test results from CI logs | `deviation` | `notable` |
| Flaky tests | Tests that pass on retry | `struggle` | `minor` |
| Deploy failure | Deployment step failure in CI | `deviation` | `critical` |
| CI config drift | CI config changed but not reflected in devops config | `config-mismatch` | `minor` |

**CI provider abstraction:**

```
gsd-ci-sensor
    |
    +-- read devops.ci_provider from config.json
    |
    +-- switch(ci_provider)
    |   case "github-actions":
    |       gh run list --limit 5 --json ...
    |       gh run view {id} --json ...
    |   case "gitlab-ci":
    |       (future: gitlab API or local artifacts)
    |   case "none":
    |       return empty signals
```

**Start with GitHub Actions only.** The `devops.ci_provider` config field already exists in the feature manifest. Use `gh` CLI which is typically available in development environments. Other providers can be added later following the same sensor pattern.

**Config addition:**

```json
{
  "signal_collection": {
    "schema": {
      "sensors": {
        "default": {
          "artifact": { "enabled": true, "model": "auto" },
          "git": { "enabled": true, "model": "auto" },
          "ci": { "enabled": true, "model": "auto" },
          "log": { "enabled": false, "model": "auto" }
        }
      }
    }
  }
}
```

**Data flow:**

```
Phase execution complete
    |
    v
Auto-collect signals (Feature 1)
    |
    v
Orchestrator checks sensors.ci.enabled
    |
    v (if enabled)
Task(gsd-ci-sensor)
    +-- reads devops.ci_provider from config
    +-- checks gh CLI availability
    +-- queries recent CI runs matching phase commits
    +-- returns JSON signal candidates
    |
    v
Merged with other sensor outputs
    |
    v
Signal synthesizer (existing -- no changes)
```

### Feature 3: Auto-Reflection Triggering

**Goal:** Automatically trigger reflection after signal collection, closing the detect-reflect-learn loop without manual commands.

**Integration point:** Two potential trigger locations:
1. After auto-collect-signals completes (Feature 1 flow)
2. After manual `/gsd:collect-signals` completes

**Architecture decision: When to auto-reflect**

Reflection is expensive (reads KB, analyzes patterns, proposes triage, distills lessons). Running it after every signal collection is wasteful if few signals were collected.

**Recommendation: Conditional auto-reflection with threshold.**

```
Signal collection complete
    |
    v
Check auto_reflect config
    |
    v (if enabled)
Check threshold: signals_written >= N (default: 3)
    |
    v (if threshold met)
Task(reflect workflow)
    |
    v
Report results inline
```

**Config addition to feature-manifest.json:**

```json
{
  "signal_collection": {
    "schema": {
      "auto_reflect": {
        "type": "boolean",
        "default": false,
        "description": "Automatically trigger reflection after signal collection"
      },
      "auto_reflect_threshold": {
        "type": "number",
        "default": 3,
        "min": 1,
        "max": 10,
        "description": "Minimum signals collected before auto-reflection triggers"
      }
    }
  }
}
```

**Default: false.** Auto-reflection is opt-in because it significantly extends execution time and context budget. Users who want the full automation loop enable it explicitly.

**Implementation location:** End of `collect-signals.md` workflow (not in execute-phase.md). This ensures auto-reflection fires whether signals were collected manually or automatically.

**New step in collect-signals.md after present_results:**

```markdown
<step name="auto_reflect">
Check if auto-reflection should trigger:

```bash
AUTO_REFLECT=$(node -e "try { const c = require('./.planning/config.json'); console.log(c.signal_collection?.auto_reflect === true) } catch(e) { console.log('false') }")
THRESHOLD=$(node -e "try { const c = require('./.planning/config.json'); console.log(c.signal_collection?.auto_reflect_threshold || 3) } catch(e) { console.log('3') }")
```

If AUTO_REFLECT is true AND SIGNALS_WRITTEN >= THRESHOLD:

Invoke the reflect workflow inline:
```
Task(
  prompt="Run reflection for phase {PADDED_PHASE}.
  Follow the reflect.md workflow.",
  subagent_type="general-purpose",
  description="Auto-reflect after signal collection"
)
```
</step>
```

### Feature 4: Health Check Hooks

**Goal:** Run health checks automatically at strategic lifecycle points using Claude Code hooks, beyond the current explicit-only `/gsd:health-check` command.

**Integration points:** Hook events in `.claude/settings.json`.

**Current health check frequency modes (from feature-manifest.json):**

| Mode | Current Implementation |
|------|----------------------|
| `milestone-only` | Called from `complete-milestone.md` workflow |
| `on-resume` | Called from `resume-project.md` workflow |
| `every-phase` | Called from `execute-phase.md` workflow |
| `explicit-only` | Only via `/gsd:health-check` command |

Currently these are workflow-level checks (the workflow reads the config and decides whether to invoke health-check). There are no hook-level implementations.

**Proposed hook-level health checks:**

| Hook Event | Trigger | Health Check Scope | Config Guard |
|-----------|---------|-------------------|--------------|
| `SessionStart` (startup) | New session starts | Quick (default tier) | `frequency: "on-resume"` or `"every-phase"` |
| `SessionStart` (resume) | Session resumed | Quick (default tier) | `frequency: "on-resume"` or `"every-phase"` |
| `Stop` | Main agent finishes | None (metrics only) | Always (lightweight) |

**Architecture decision: Hook script vs inline workflow**

Health check hooks should be LIGHTWEIGHT hook scripts (like existing `gsd-check-update.js`), not full workflow invocations. Hooks run synchronously in the agent loop -- a full health check with all tiers would block interaction.

**Recommendation: Two new hook scripts.**

**Script 1: `hooks/gsd-health-check-quick.js`**

A fast SessionStart hook that runs default-tier checks only (KB integrity, config validity, stale artifacts). Reports findings as `additionalContext` so Claude is aware of workspace issues at session start.

```javascript
// gsd-health-check-quick.js
// Runs on SessionStart if health_check.frequency is "on-resume" or "every-phase"
// Returns additionalContext with health status

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  const cwd = data.cwd || process.cwd();
  const configPath = path.join(cwd, '.planning', 'config.json');

  // Check if health check should run
  let frequency = 'milestone-only';
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    frequency = config.health_check?.frequency || 'milestone-only';
  } catch (e) { /* no config = skip */ }

  const source = data.source; // "startup", "resume", "clear", "compact"
  const shouldRun = (
    (frequency === 'every-phase') ||
    (frequency === 'on-resume' && (source === 'resume' || source === 'startup'))
  );

  if (!shouldRun) { process.exit(0); return; }

  // Run quick checks...
  const issues = [];
  // KB-01, CFG-01, STALE-01 checks
  // ...

  if (issues.length > 0) {
    const output = {
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: `Health check found ${issues.length} issue(s): ${issues.join('; ')}. Run /gsd:health-check --fix for details.`
      }
    };
    process.stdout.write(JSON.stringify(output));
  }
  process.exit(0);
});
```

**Script 2: `hooks/gsd-session-metrics.js`**

A Stop hook that records session-end metrics (context usage, duration estimate) for future analysis. This does NOT block Claude from stopping -- it runs as a side-effect.

```javascript
// gsd-session-metrics.js
// Runs on Stop to record session metrics
// Async: true (does not block)

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  const cwd = data.cwd || process.cwd();

  // Record session metrics to a local cache file
  const metricsFile = path.join(cwd, '.planning', '.session-metrics.json');
  const metrics = {
    session_id: data.session_id,
    ended_at: new Date().toISOString(),
    // Additional metrics could be computed here
  };

  try {
    let existing = [];
    if (fs.existsSync(metricsFile)) {
      existing = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
    }
    existing.push(metrics);
    // Keep last 50 entries
    if (existing.length > 50) existing = existing.slice(-50);
    fs.writeFileSync(metricsFile, JSON.stringify(existing, null, 2));
  } catch (e) { /* silent fail */ }

  process.exit(0);
});
```

**Settings.json changes:**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/gsd-check-update.js" }
        ]
      },
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/gsd-version-check.js" }
        ]
      },
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/gsd-health-check-quick.js" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "node .claude/hooks/gsd-session-metrics.js", "async": true }
        ]
      }
    ]
  }
}
```

### Feature 5: Plan Checker Semantic Validation

**Goal:** Enhance the plan checker to go beyond structural validation into semantic validation -- detecting contradictions, unrealistic estimates, missing integration points, and anti-patterns in plan content.

**Integration point:** Existing `agents/gsd-plan-checker.md`, invoked by `plan-phase.md` workflow step 10.

**Current plan checker dimensions (7):**

1. Requirement Coverage
2. Task Completeness
3. Dependency Correctness
4. Key Links Planned
5. Scope Sanity
6. Verification Derivation
7. Context Compliance (if CONTEXT.md exists)

**Proposed new dimensions:**

### Dimension 8: Semantic Coherence

Detects contradictions and inconsistencies across tasks within and between plans.

| Check | What It Detects | Example |
|-------|----------------|---------|
| Task contradiction | Two tasks do opposite things | Task 1: "Add field X to schema", Task 3: "Remove field X from schema" |
| Conflicting dependencies | Plan uses library A but different plan uses competing library B for same purpose | Plan 01 uses `jose` for JWT, Plan 02 imports `jsonwebtoken` |
| Stale references | Task references file/component from a previous phase that was refactored | Task references `auth.ts` but Phase 10 renamed it to `auth/index.ts` |
| Naming inconsistency | Tasks use different names for the same concept | "user profile" vs "account settings" vs "profile page" for the same feature |

### Dimension 9: Estimation Realism

Validates that task complexity matches the context budget constraints.

| Check | What It Detects | Example |
|-------|----------------|---------|
| Complexity undercount | Task marked as 1 file but action implies multiple | "Create API with auth, validation, error handling, tests" -> 1 file |
| Missing test tasks | Code tasks without corresponding test tasks (when TDD is configured) | New endpoint without test |
| Infrastructure assumptions | Task assumes infrastructure exists without checking | "Deploy to staging" but no staging env configured |

### Dimension 10: Signal Awareness

Cross-references plans against triaged signals to validate `resolves_signals` linkage.

| Check | What It Detects | Example |
|-------|----------------|---------|
| Missing resolution | Triaged signal with `decision: address` not referenced in any plan's `resolves_signals` | Signal about recurring test failures, no plan addresses it |
| Invalid signal reference | `resolves_signals` references non-existent or archived signal | `resolves_signals: [sig-2026-01-15-missing]` |
| Incomplete resolution | Plan claims to resolve signal but tasks do not address root cause | Signal about missing error handling, plan only adds logging |

**Implementation approach:** These are ADDITIONS to the existing plan checker agent spec. No new agents needed. The plan checker gains new verification dimensions that run alongside existing ones.

The plan checker already reads: PLAN.md files, ROADMAP.md, CONTEXT.md. For Dimension 10 (Signal Awareness), it additionally needs the triaged signals context that the planner already receives via the `<triaged_signals>` block. The `plan-phase.md` orchestrator passes this to the checker.

---

## Component Boundary Analysis

### New Components

| Component | Type | Location | Purpose |
|-----------|------|----------|---------|
| `gsd-ci-sensor.md` | Agent spec | `agents/` | CI/CD signal detection |
| `gsd-health-check-quick.js` | Hook script | `hooks/` | Quick health check on SessionStart |
| `gsd-session-metrics.js` | Hook script | `hooks/` | Session metrics on Stop |

### Modified Components

| Component | Type | Location | Changes |
|-----------|------|----------|---------|
| `execute-phase.md` | Workflow | `get-shit-done/workflows/` | Add `auto_collect_signals` step |
| `collect-signals.md` | Workflow | `get-shit-done/workflows/` | Add `auto_reflect` step; add CI sensor spawning |
| `gsd-plan-checker.md` | Agent spec | `agents/` | Add Dimensions 8-10 |
| `plan-phase.md` | Workflow | `get-shit-done/workflows/` | Pass triaged signals to plan checker |
| `feature-manifest.json` | Config schema | `get-shit-done/` | Add `auto_collect`, `auto_reflect`, `auto_reflect_threshold`, `sensors.ci` |
| `.claude/settings.json` | Hook config | `.claude/` | Add SessionStart health check, Stop metrics |

### Unchanged Components

| Component | Why Unchanged |
|-----------|---------------|
| `gsd-signal-synthesizer.md` | Already handles arbitrary sensor count; CI sensor output merges into existing flow |
| `gsd-artifact-sensor.md` | Existing detection patterns unchanged |
| `gsd-git-sensor.md` | Existing detection patterns unchanged |
| `gsd-reflector.md` | Already handles being invoked by workflow; auto-trigger is orchestrator-level |
| `reflect.md` | Already supports programmatic invocation via Task() |
| `knowledge-store.md` | No schema changes needed |
| `gsd-statusline.js` | Status line unchanged |
| `gsd-check-update.js` | Update check unchanged |
| `gsd-version-check.js` | Version check unchanged |

---

## Data Flow: Complete Automation Loop

```
Phase Execution Complete (execute-phase.md)
    |
    v
[1] Verify Phase Goal (gsd-verifier)
    |
    v
[2] Auto-Collect Signals (if signal_collection.auto_collect: true)
    |
    +-- spawn collect-signals workflow inline
    |   +-- Task(gsd-artifact-sensor) ----+
    |   +-- Task(gsd-git-sensor) ---------+-- parallel
    |   +-- Task(gsd-ci-sensor) ----------+
    |   |
    |   +-- MERGE sensor outputs
    |   |
    |   +-- Task(gsd-signal-synthesizer)
    |   |   +-- trace filter
    |   |   +-- cross-sensor dedup
    |   |   +-- KB dedup
    |   |   +-- recurrence detection
    |   |   +-- passive verification
    |   |   +-- rigor enforcement
    |   |   +-- cap enforcement
    |   |   +-- WRITE signals to KB
    |   |
    |   +-- present results
    |   |
    |   +-- [3] Auto-Reflect (if auto_reflect: true AND signals >= threshold)
    |       |
    |       +-- spawn reflect workflow inline
    |           +-- Task(gsd-reflector)
    |           |   +-- lifecycle-weighted pattern detection
    |           |   +-- triage proposals
    |           |   +-- lesson distillation
    |           |   +-- remediation suggestions
    |           |
    |           +-- handle triage (per autonomy mode)
    |           +-- handle lessons (per autonomy mode)
    |           +-- persist reflection report
    |
    v
[4] Update Roadmap
    |
    v
[5] Offer Next Steps

---

Session Start (hooks layer, parallel)
    +-- gsd-check-update.js (existing)
    +-- gsd-version-check.js (existing)
    +-- gsd-health-check-quick.js (NEW -- if frequency allows)

Session End (hooks layer)
    +-- gsd-session-metrics.js (NEW -- async, non-blocking)
```

---

## Hook Architecture Deep Dive

### Hook Input Schema (from official docs)

All hooks receive JSON on stdin with common fields:

```json
{
  "session_id": "abc123",
  "transcript_path": "/path/to/transcript.jsonl",
  "cwd": "/path/to/project",
  "permission_mode": "default",
  "hook_event_name": "Stop"
}
```

**Event-specific fields:**

| Event | Additional Fields |
|-------|------------------|
| `SessionStart` | `source` ("startup", "resume", "clear", "compact"), `model` |
| `Stop` | `stop_hook_active` (bool), `last_assistant_message` (string) |
| `SubagentStop` | `stop_hook_active`, `agent_id`, `agent_type`, `agent_transcript_path`, `last_assistant_message` |
| `PostToolUse` | `tool_name`, `tool_input`, `tool_response`, `tool_use_id` |

### Hook Output Schema

**SessionStart hooks** can return `additionalContext` via JSON:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Health check found 2 issues..."
  }
}
```

**Stop hooks** can force continuation with `decision: "block"`:

```json
{
  "decision": "block",
  "reason": "Signals need to be collected before ending"
}
```

**Critical constraint for Stop hooks:** The `stop_hook_active` field prevents infinite loops. When a Stop hook forces continuation and Claude stops again, `stop_hook_active` will be `true`. The hook MUST check this field and exit 0 to avoid infinite continuation loops.

### Hook Design Principles for GSD

1. **Hooks are side-effect only.** They record metrics, check health, inject context. They do NOT orchestrate complex multi-agent workflows.
2. **Hooks are fast.** SessionStart hooks should complete in <1s. Use `async: true` for anything that takes longer.
3. **Hooks are resilient.** Silent failure (exit 0) is always preferred over blocking the session with errors.
4. **Hooks read config.** Each hook reads `.planning/config.json` to determine if it should run, respecting the user's configured frequency/thresholds.
5. **Hooks follow the build pattern.** Source in `hooks/`, compiled to `hooks/dist/`, installed to `.claude/hooks/` by `bin/install.js`.

---

## CI Sensor Architecture Deep Dive

### Detection Strategy

The CI sensor queries recent CI runs for the current repository and extracts signal candidates from failures and anomalies.

```
gsd-ci-sensor
    |
    +-- Step 1: Check CI provider config
    |   read devops.ci_provider from config.json
    |   if "none" -> return empty signals
    |
    +-- Step 2: Determine phase commit range
    |   Same approach as gsd-git-sensor
    |   git log --oneline --grep="(${PHASE})"
    |
    +-- Step 3: Query CI runs
    |   For GitHub Actions:
    |   gh run list --limit 10 --json status,conclusion,headSha,name,databaseId
    |   Filter to runs matching phase commits
    |
    +-- Step 4: Analyze failures
    |   For each failed run:
    |   gh run view {id} --json jobs
    |   Parse failed jobs and steps
    |   Extract failure messages
    |
    +-- Step 5: Detect patterns
    |   +-- Build failures (compilation, lint)
    |   +-- Test failures (test step failed)
    |   +-- Deploy failures (deploy step failed)
    |   +-- Flaky tests (pass on re-run)
    |
    +-- Step 6: Return JSON
        ## SENSOR OUTPUT
        ```json
        { "sensor": "ci", "phase": N, "signals": [...] }
        ```
        ## END SENSOR OUTPUT
```

### CI Sensor Resilience

| Condition | Behavior |
|-----------|----------|
| `gh` CLI not installed | Return empty signals with warning note |
| `gh` not authenticated | Return empty signals with warning note |
| No CI runs found | Return empty signals (clean result) |
| API rate limit | Return empty signals with warning note |
| Non-GitHub CI | Return empty signals (only GitHub Actions supported initially) |

The sensor MUST NOT fail. It follows the same resilience pattern as the existing sensors: partial failures are logged but do not block signal collection.

### gh CLI Dependencies

The CI sensor requires `gh` (GitHub CLI). This is NOT a new dependency for GSD Reflect -- the existing release workflow already uses `gh`. However, it IS optional. The sensor gracefully degrades to empty results if `gh` is unavailable.

```bash
# Availability check
gh --version 2>/dev/null
if [ $? -ne 0 ]; then
  # Return empty signals, log note
fi

# Auth check
gh auth status 2>/dev/null
if [ $? -ne 0 ]; then
  # Return empty signals, log note
fi
```

---

## Plan Checker Enhancement Architecture

### Current Flow (plan-phase.md)

```
Planner creates PLAN.md files
    |
    v
Plan checker receives:
  - PLAN.md contents
  - ROADMAP.md goal
  - REQUIREMENTS.md
  - CONTEXT.md (if exists)
    |
    v
Run 7 verification dimensions
    |
    v
Return VERIFICATION PASSED or ISSUES FOUND
```

### Enhanced Flow

```
Planner creates PLAN.md files
    |
    v
Plan checker receives:
  - PLAN.md contents
  - ROADMAP.md goal
  - REQUIREMENTS.md
  - CONTEXT.md (if exists)
  - Triaged signals context (NEW)      <-- from plan-phase.md step 7b
    |
    v
Run 10 verification dimensions (7 existing + 3 new)
    |
    v
Return VERIFICATION PASSED or ISSUES FOUND
```

**Change to plan-phase.md (step 10):** Pass `TRIAGED_SIGNALS` to the plan checker alongside existing context. The planner already loads this in step 7b -- the checker just needs to receive it too.

```markdown
Checker prompt:

<verification_context>
...existing fields...

**Triaged Signals:**
{TRIAGED_SIGNALS}
</verification_context>
```

### Dimension Implementation Approach

Dimensions 8 and 9 (Semantic Coherence, Estimation Realism) are **purely analytical** -- the plan checker reads plan content and applies judgment. No external data sources needed.

Dimension 10 (Signal Awareness) requires the triaged signals context, which the workflow already has from step 7b. The checker validates:
- `resolves_signals` array entries exist in KB
- Tasks in the plan actually address the signal's root cause
- No triaged `address` signals are orphaned (have no plan referencing them)

---

## Patterns to Follow

### Pattern 1: Sensor Agent Pattern

All sensor agents follow the same structure. The CI sensor MUST follow this pattern.

```markdown
---
name: gsd-{name}-sensor
description: {one-liner}
tools: Read, Bash, Glob, Grep
color: {color}
---

<role>
You are a sensor agent. You analyze {data source} and return structured
signal candidates. You do NOT write to the knowledge base.
</role>

<execution_flow>
## Step 1: Load inputs
## Step 2: Detect signals
## Step 3: Classify signals
## Step 4: Runtime/Model detection
## Step 5: Return JSON with delimiters
</execution_flow>
```

**Key constraints:**
- Return ALL candidates including trace (synthesizer filters)
- Use `## SENSOR OUTPUT` / `## END SENSOR OUTPUT` delimiters
- Include `runtime` and `model` in each signal candidate
- Cap at 5 signals per detection pattern, 15 total
- Do NOT write to KB, do NOT call kb-rebuild-index.sh

### Pattern 2: Config-Guarded Feature Pattern

New features follow the feature-manifest.json declarative pattern.

```json
{
  "feature_name": {
    "scope": "project",
    "introduced": "1.17.0",
    "config_key": "feature_name",
    "schema": {
      "setting": {
        "type": "boolean",
        "default": false,
        "description": "What this does"
      }
    }
  }
}
```

Every automation feature MUST:
1. Have a config guard (default off for new automation, on for simple checks)
2. Check config before running
3. Degrade gracefully when disabled
4. Be documented in feature-manifest.json

### Pattern 3: Hook Script Pattern

Hook scripts follow the existing patterns from `gsd-check-update.js` and `gsd-statusline.js`.

```javascript
#!/usr/bin/env node
// Description of what this hook does
// Called by {HookEvent} -- {when it fires}

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    const cwd = data.cwd || process.cwd();

    // Read config to determine if this hook should run
    // ...

    // Do work
    // ...

    // Optional: return structured output
    // process.stdout.write(JSON.stringify({ ... }));
  } catch (e) {
    // Silent fail -- never break the hook pipeline
  }
  process.exit(0);
});
```

**Key constraints:**
- Always read from stdin (JSON)
- Always exit 0 on success or graceful failure
- Exit 2 ONLY for blocking decisions (Stop hooks forcing continuation)
- Use `async: true` in settings.json for non-critical hooks
- Compile from `hooks/` to `hooks/dist/` via build:hooks
- Source paths use `.claude/hooks/` (installed location)

### Pattern 4: Workflow Step Automation Pattern

When adding automation to an existing workflow, follow this pattern:

```markdown
<step name="auto_{feature}">
Read config to determine if automation should run:

```bash
ENABLED=$(node -e "try { const c = require('./.planning/config.json'); console.log(c.{config_key}?.{setting} === true) } catch(e) { console.log('false') }")
```

If ENABLED is true AND {preconditions met}:

Invoke the target workflow via Task():
```
Task(
  prompt="...",
  subagent_type="general-purpose",
  description="{action description}"
)
```

If ENABLED is false: skip silently.
</step>
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hook-Based Orchestration

**What:** Using hooks (PostToolUse, Stop) to trigger complex multi-agent workflows.

**Why bad:** Hooks run in the main agent's context. A Stop hook that forces continuation and triggers signal collection + reflection would consume significant context budget of the already-finishing session. Hooks lack the workflow context (phase number, verification result) needed to make good decisions.

**Instead:** Use inline workflow steps in the appropriate orchestrator. The workflow has full context and can spawn subagents in fresh context windows.

### Anti-Pattern 2: Sensor KB Writes

**What:** Having a new sensor (e.g., CI sensor) write directly to the knowledge base.

**Why bad:** Violates the single-writer principle. The synthesizer enforces dedup, rigor, caps, and trace filtering. Bypassing it creates inconsistent KB state.

**Instead:** All sensors return JSON. Only the synthesizer writes to KB.

### Anti-Pattern 3: Always-On Automation

**What:** Making auto-collect, auto-reflect, health check hooks all enabled by default.

**Why bad:** Users who do not want automation get unexpected behavior. Combined automation significantly extends execution time. Context budget consumed by automation reduces quality of the primary work.

**Instead:** Conservative defaults. `auto_collect: true` (lightweight, expected behavior). `auto_reflect: false` (expensive, opt-in). Health check hooks respect `frequency` config.

### Anti-Pattern 4: Blocking Stop Hooks

**What:** Using a Stop hook to force Claude to continue and run signal collection.

**Why bad:** `stop_hook_active` infinite loop risk. The session is already at high context usage when Stop fires. Forced continuation quality is poor. The Stop hook approach also loses phase context.

**Instead:** Automation triggers live in the workflow, not in hooks. The Stop hook records metrics only (async, non-blocking).

### Anti-Pattern 5: Editing .claude/ Directly

**What:** Creating hook scripts directly in `.claude/hooks/` instead of `hooks/`.

**Why bad:** The installer overwrites `.claude/` from npm source. Changes are lost on update. This is the lesson from Phase 22.

**Instead:** Edit `hooks/` (npm source). Run `node bin/install.js --local` to copy to `.claude/hooks/`.

---

## Scalability Considerations

| Concern | At 5 phases | At 20 phases | At 50 phases |
|---------|-------------|--------------|-------------|
| Signal collection time | <30s (2 sensors) | <30s (sensors read phase artifacts only) | <30s (scoped to current phase) |
| CI sensor queries | 1-2 gh API calls | 1-2 gh API calls | 1-2 gh API calls (scoped) |
| Auto-reflection | ~60s (few signals) | ~90s (more patterns) | ~120s (many patterns, larger KB) |
| KB index size | Small | Medium | Large -- may need pagination |
| Health check quick | <1s | <1s | <2s (more stale artifact checks) |
| Session metrics | Negligible | Negligible | Negligible |

**Bottleneck:** KB index parsing in the reflector scales with total signal count across all phases. At 50 phases with 10 signals each (500 signals), index parsing and pattern detection may slow. This is a known concern addressed by the per-phase cap (10 signals max per phase) and the existing archival mechanism.

---

## Build Order Rationale

### Suggested Build Order

1. **Auto-trigger signal collection** (Feature 1)
   - Prerequisite: None (builds on existing collect-signals workflow)
   - Modifies: execute-phase.md, feature-manifest.json
   - Why first: Foundation for the automation loop. Other features build on this trigger point.

2. **CI sensor** (Feature 2)
   - Prerequisite: None (can be built independently)
   - Creates: gsd-ci-sensor.md
   - Modifies: collect-signals.md, feature-manifest.json
   - Why second: New sensor slot. Can be tested with manual `/gsd:collect-signals` first, then integrated with auto-trigger.

3. **Plan checker semantic validation** (Feature 5)
   - Prerequisite: None (independent of automation loop)
   - Modifies: gsd-plan-checker.md, plan-phase.md
   - Why third: Independent feature with high value. Can be developed in parallel with CI sensor.

4. **Health check hooks** (Feature 4)
   - Prerequisite: None (independent of automation loop)
   - Creates: gsd-health-check-quick.js, gsd-session-metrics.js
   - Modifies: settings.json, hooks build system
   - Why fourth: New hook scripts require build system changes. Lower priority than signal loop.

5. **Auto-reflection triggering** (Feature 3)
   - Prerequisite: Feature 1 (auto-collect must work first)
   - Modifies: collect-signals.md, feature-manifest.json
   - Why last: Depends on auto-collect working correctly. Most expensive feature (full reflection). Benefits from CI sensor being active (more signals to reflect on).

### Dependency Graph

```
[1] Auto-collect signals
    |
    +---> [5] Auto-reflection (depends on auto-collect)

[2] CI sensor (independent)

[3] Plan checker enhancements (independent)

[4] Health check hooks (independent)
```

Features 2, 3, and 4 are independent and can be parallelized if needed. Feature 5 must come after Feature 1.

---

## Sources

- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) -- Official documentation for all hook events, input schemas, output schemas, and configuration (verified 2026-03-02)
- Existing codebase analysis: all agent specs, workflow files, hook scripts, settings.json, feature-manifest.json read directly from the repository
- [Claude Code Hooks Guide](https://claude.com/blog/how-to-configure-hooks) -- Practical guide for hook configuration
