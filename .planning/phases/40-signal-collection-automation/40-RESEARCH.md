# Phase 40: Signal Collection Automation - Research

**Researched:** 2026-03-05
**Domain:** Workflow automation, reentrancy protection, cross-runtime fallback, observation regime tracking
**Confidence:** HIGH

## Summary

Phase 40 integrates signal collection as an automatic postlude step in the execute-phase workflow. The existing infrastructure is well-prepared: the automation framework (Phase 37) provides `resolve-level` and `track-event` commands with context-aware deferral and per-feature overrides; the multi-sensor architecture (Phase 38) provides auto-discovery and parallel spawning; and the CI sensor (Phase 39) is ready for inclusion. The primary implementation work is (1) adding a new step to execute-phase.md that invokes the collect-signals workflow based on resolved automation level, (2) building a reentrancy guard to prevent feedback loops, (3) ensuring the postlude works without hooks on all 4 runtimes, and (4) recording observation regime changes to the KB.

The reentrancy lockfile is the highest-risk design item. The research flag in STATE.md is well-placed: stale lock recovery, lock location, and atomicity across processes all have non-obvious edge cases. However, the GSD context simplifies this significantly -- the lockfile guards against re-entrance within a single LLM session context, not across arbitrary OS processes. A simple file-based lock with PID/timestamp content and configurable TTL is sufficient; the `proper-lockfile` npm library is unnecessary overhead for this use case.

**Primary recommendation:** Implement auto-collection as an inline workflow postlude step in execute-phase.md (not hook-based), using `gsd-tools.js automation resolve-level signal_collection` to determine behavior, with a simple lockfile guard using `fs.writeFileSync`/`fs.unlinkSync` and stale-lock detection via mtime comparison.

## Standard Stack

### Core

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `gsd-tools.js automation resolve-level` | current | Determine effective automation level for signal_collection | Already built in Phase 37; handles overrides, context deferral, runtime caps |
| `gsd-tools.js automation track-event` | current | Record fire/skip stats per feature | Already built in Phase 37; atomic config write pattern |
| `collect-signals.md` workflow | current | Orchestrate multi-sensor signal collection | Already built in Phase 38; auto-discovers sensors, spawns in parallel |
| `FEATURE_CAPABILITY_MAP` | current | Runtime capability caps for signal_collection | Already defined: `hook_dependent_above: null, task_tool_dependent: false` |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `kb-rebuild-index.sh` | current | Rebuild KB index after regime_change entries | Only when writing regime_change entries |
| `capability-matrix.md` | current | Runtime detection for cross-runtime fallback | Referenced by workflows for has_capability() checks |
| `feature-manifest.json` | current | Schema for new config fields | Adding auto_collect and reentrancy config knobs |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple lockfile (writeFileSync) | `proper-lockfile` npm package | proper-lockfile adds mkdir-based atomic locks, mtime monitoring, onCompromised callbacks -- overkill for single-session LLM guard. Adds a dependency to gsd-tools.js which currently has zero npm dependencies. |
| Inline workflow step | PostToolUse hook on SUMMARY.md writes | Hook approach requires reverse-engineering which phase completed from file events; fails on 2/4 runtimes (OpenCode, Codex CLI); hooks fire on EVERY Write, causing noise |
| Inline workflow step | Stop hook at session end | Session end may not align with phase completion; too late for inline reporting; fails on 2/4 runtimes |
| File-based lockfile | In-memory flag | In-memory state does not persist across Task() subagent boundaries; lockfile is visible for debugging |

## Architecture Patterns

### Recommended Implementation Structure

```
get-shit-done/
  workflows/
    execute-phase.md          # ADD: auto_collect_signals step between reconcile_signal_lifecycle and update_roadmap
    collect-signals.md        # NO CHANGES -- invoked as-is
  bin/
    gsd-tools.js              # ADD: reentrancy lockfile helpers (lock/unlock/check-stale)
  feature-manifest.json       # ADD: auto_collect field to signal_collection schema
```

### Pattern 1: Workflow Postlude Step

**What:** A new `<step name="auto_collect_signals">` in execute-phase.md that runs after verification but before roadmap update. This is a "postlude" -- it runs as part of the orchestrator workflow, not as a hook.

**When to use:** After every successful phase execution (verification passed or human_needed approved).

**How it works:**
```markdown
<step name="auto_collect_signals">
# 1. Check reentrancy guard
LOCK_STATUS=$(node ~/.claude/get-shit-done/bin/gsd-tools.js automation check-lock signal_collection --raw 2>/dev/null)
# If locked, skip silently (we're inside a re-entrant call)

# 2. Resolve automation level
LEVEL=$(node ~/.claude/get-shit-done/bin/gsd-tools.js automation resolve-level signal_collection --context-pct {CONTEXT_PCT} --raw 2>/dev/null)

# 3. Branch on effective level:
#   0 (manual): skip entirely
#   1 (nudge): display message "Run /gsd:collect-signals {phase} to collect signals"
#   2 (prompt): ask user "Collect signals for phase {X}? [y/n]"
#   3 (auto): acquire lock, invoke collect-signals workflow, release lock

# 4. Track event
node ~/.claude/get-shit-done/bin/gsd-tools.js automation track-event signal_collection fire
# or
node ~/.claude/get-shit-done/bin/gsd-tools.js automation track-event signal_collection skip "level-{N}"
</step>
```

### Pattern 2: Reentrancy Lockfile

**What:** A file-based lock that prevents signal collection from re-triggering during an active collection run. The lock contains PID, timestamp, and trigger_source metadata.

**When to use:** Before any auto-triggered signal collection.

**Lock file location:** `.planning/.signal-collection.lock` (project-local, not global -- avoids cross-project interference).

**Lock file format:**
```json
{
  "pid": 12345,
  "timestamp": "2026-03-05T20:00:00Z",
  "trigger_source": "phase-completion",
  "phase": 40,
  "ttl_seconds": 300
}
```

**Stale lock detection:** Compare lock file mtime against configurable TTL (default 300 seconds / 5 minutes). If lock is older than TTL, treat as stale: log a warning, remove, and proceed. This handles crashes where the lock is never released.

**Source tagging:** The `trigger_source` field enforces the DAG of allowed triggers:
- `"phase-completion"` -- allowed (SIG-01)
- `"manual"` -- allowed (user explicitly invoked /gsd:collect-signals)
- `"reflection-output"` -- blocked (prevents feedback loop per Pitfall 1)

### Pattern 3: Cross-Runtime Fallback

**What:** The auto_collect_signals step is in the execute-phase.md workflow, not in hooks. Since execute-phase.md is read by the LLM orchestrator on all runtimes, the postlude works identically on Claude Code, OpenCode, Gemini CLI, and Codex CLI.

**Why this works:** The FEATURE_CAPABILITY_MAP already declares `signal_collection: { hook_dependent_above: null }`, meaning signal collection has no hook dependency. The postlude pattern inherently satisfies SIG-04 because it is a workflow step, not a hook.

**Codex CLI specificity:** On Codex CLI (no task_tool), the collect-signals workflow already degrades to sequential sensor execution. The postlude step itself does not require task_tool -- it invokes the workflow which handles its own capability adaptation internally.

### Pattern 4: Context-Aware Deferral

**What:** When context usage exceeds the configured threshold (default 60%), auto-collection at level 3 downgrades to level 1 (nudge).

**How it works:** Already implemented in `resolve-level`. The workflow step passes `--context-pct {estimated_pct}` to the resolve command. The resolve command applies the deferral rule.

**Nudge message format:**
```
Context usage high ({N}%). Signal collection deferred.
Run `/gsd:collect-signals {phase}` in a fresh session.
```

### Pattern 5: Regime Change KB Entry

**What:** When auto-collection is first enabled, sensors are added/removed, or automation level changes, write a `regime_change` entry to the KB.

**Entry format:**
```yaml
---
id: regime-{timestamp}
type: regime_change
project: {project_name}
tags: [observation-regime, signal-collection, automation]
created: {ISO timestamp}
status: active
---

# Regime Change: {description}

## Change
{what changed -- e.g., "Auto-collection enabled at level 3"}

## Expected Impact
{how this affects signal baselines -- e.g., "Signal count per phase expected to increase as automated detection catches issues previously missed"}

## Timestamp
{ISO timestamp}

## Prior Regime
{previous configuration state}
```

**KB location:** `.planning/knowledge/signals/{project}/` (uses existing signals directory since the synthesizer already writes there and the index builder already scans it).

### Anti-Patterns to Avoid

- **Hook-based auto-triggering:** Fails on 2/4 runtimes, requires reverse-engineering phase identity from file events, and creates noisy false triggers on every Write operation.
- **Global lockfile (~/.gsd/.signal-collection.lock):** Creates cross-project interference if two projects run simultaneously. Use project-local lock.
- **In-memory reentrancy flag:** Does not persist across Task() subagent boundaries. The orchestrator spawns collect-signals as a Task(), and the spawned agent cannot check an in-memory flag set by the parent.
- **Blocking lock acquisition:** Never wait/retry for lock. If locked, skip immediately. Auto-collection is best-effort, not critical-path.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Automation level resolution | Custom level-checking logic in workflow | `gsd-tools.js automation resolve-level signal_collection` | Resolution chain (override -> deferral -> runtime cap) already handles all edge cases |
| Event tracking/stats | Custom fire/skip counters | `gsd-tools.js automation track-event signal_collection fire/skip` | Atomic config write, normalized feature names, ISO timestamps |
| Sensor discovery and spawning | Hardcoded sensor list in postlude | Invoke existing `collect-signals.md` workflow | Auto-discovery, parallel spawn, timeout enforcement, stats tracking all built in |
| Stale lock detection | Complex timer-based monitoring | Simple mtime comparison: `Date.now() - fs.statSync(lockfile).mtimeMs > ttl_ms` | Single line of code, no timers, no background processes |

**Key insight:** Nearly all the infrastructure needed for Phase 40 already exists from Phases 37-39. The postlude step is a ~30-line workflow addition that wires existing components together. The reentrancy guard is the only genuinely new code, and it is straightforward (~50 lines in gsd-tools.js).

## Common Pitfalls

### Pitfall 1: Feedback Loop from Auto-Collection Generating KB Artifacts

**What goes wrong:** Auto-collect writes signal files to KB. If reflection auto-triggers on signal accumulation, reflection writes lessons/triage updates. If those KB writes trigger another collect-signals run, infinite loop.

**Why it happens:** The system lacks a directed acyclic graph of allowed trigger chains.

**How to avoid:** Source tagging on triggers. The lockfile's `trigger_source` field records why collection was triggered. Only `"phase-completion"` and `"manual"` sources are allowed to initiate collection. The synthesizer's output (signal files) should never trigger re-collection because the synthesizer is invoked BY the collection workflow, not independently. The reentrancy lockfile provides the hard guard; source tagging provides the semantic guard.

**Warning signs:** Multiple collect-signals invocations in git log without matching phase executions. Context usage spikes unexpectedly during phase execution.

### Pitfall 2: Stale Lockfile Blocks All Future Auto-Collection

**What goes wrong:** A crash during auto-collection leaves the lockfile behind. All subsequent phase executions skip auto-collection because the lock exists.

**Why it happens:** No cleanup on crash. The lock is created before collection starts but never removed if the process dies.

**How to avoid:** TTL-based stale detection. Before checking the lock, compare mtime against TTL. If the lock is older than TTL (default 5 minutes, configurable), treat as stale: log a warning, delete, and proceed. The TTL should be generous enough to cover normal collection time (typically 30-60 seconds) with a wide margin.

**Warning signs:** Auto-collection stops firing. `.planning/.signal-collection.lock` file exists with old timestamp.

### Pitfall 3: Lockfile Location Collision in Mono-Repo or Shared Workspace

**What goes wrong:** If the lockfile is in a global location (`~/.gsd/`), two projects running simultaneously interfere with each other's auto-collection.

**Why it happens:** GSD supports multiple projects, each with their own `.planning/` directory.

**How to avoid:** Project-local lockfile at `.planning/.signal-collection.lock`. Each project has independent reentrancy protection. The file is in `.planning/` which is already gitignored in most configurations, so the lockfile won't pollute git status.

**Warning signs:** Auto-collection intermittently skipped when working on multiple projects.

### Pitfall 4: Context Budget Exhaustion from Auto-Collection

**What goes wrong:** Auto-collection spawns subagents (sensors + synthesizer) that consume context. If context is already high from a complex phase execution, auto-collection pushes total context usage into the degradation zone (>70%).

**Why it happens:** Phase execution consumes context for waves, checkpoints, verification. Auto-collection adds sensor spawning and synthesis on top.

**How to avoid:** Context-aware deferral (SIG-05). The `resolve-level` command already supports `--context-pct`. Pass estimated context usage from the orchestrator. At level 3, if context exceeds threshold (default 60%), downgrade to nudge. This is already implemented in gsd-tools.js.

**Warning signs:** Quality degradation in auto-collection reports. Synthesizer producing lower-quality signal descriptions.

### Pitfall 5: Regime Change Entries Accumulate Without Bound

**What goes wrong:** Every config change writes a regime_change entry. If users frequently toggle settings during experimentation, the KB fills with regime change noise.

**Why it happens:** No dedup or throttle on regime change recording.

**How to avoid:** Only write regime_change entries for genuine observation-level changes: (1) auto-collection first enabled, (2) sensor added/removed, (3) automation level changed. Config value tweaks (TTL adjustment, cap changes) do not warrant regime_change entries. Implement a simple check: "is this a new regime or just a parameter tweak within the same regime?"

**Warning signs:** Multiple regime_change entries with similar descriptions and close timestamps.

## Code Examples

### Reentrancy Lockfile Implementation (gsd-tools.js)

```javascript
// Source: designed for this phase based on PITFALLS.md #1 analysis

function cmdAutomationLock(cwd, feature, options, raw) {
  const lockPath = path.join(cwd, '.planning', `.${feature}.lock`);
  const ttl = options.ttl || 300; // seconds, default 5 minutes

  // Check for stale lock
  if (fs.existsSync(lockPath)) {
    const stat = fs.statSync(lockPath);
    const ageSeconds = (Date.now() - stat.mtimeMs) / 1000;
    if (ageSeconds > ttl) {
      // Stale lock -- remove and proceed
      fs.unlinkSync(lockPath);
      output({ action: 'stale_removed', age_seconds: Math.round(ageSeconds), ttl }, raw);
    } else {
      // Active lock -- report locked
      const content = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
      output({ locked: true, holder: content, age_seconds: Math.round(ageSeconds) }, raw);
      return;
    }
  }

  // Acquire lock
  const lockContent = {
    pid: process.pid,
    timestamp: new Date().toISOString(),
    trigger_source: options.source || 'unknown',
    ttl_seconds: ttl
  };
  fs.writeFileSync(lockPath, JSON.stringify(lockContent, null, 2));
  output({ locked: false, acquired: true }, raw);
}

function cmdAutomationUnlock(cwd, feature, raw) {
  const lockPath = path.join(cwd, '.planning', `.${feature}.lock`);
  if (fs.existsSync(lockPath)) {
    fs.unlinkSync(lockPath);
    output({ released: true }, raw);
  } else {
    output({ released: false, reason: 'no_lock_found' }, raw);
  }
}
```

### Execute-Phase Postlude Step (workflow pseudocode)

```markdown
<step name="auto_collect_signals">
Check if auto-collection should run after phase execution:

1. Check reentrancy:
   LOCK=$(node ~/.claude/get-shit-done/bin/gsd-tools.js automation lock signal_collection --source phase-completion --raw)
   If LOCK.locked is true: skip (already collecting), track-event skip "reentrancy"

2. Resolve level:
   LEVEL=$(node ~/.claude/get-shit-done/bin/gsd-tools.js automation resolve-level signal_collection --context-pct {EST_PCT} --raw)

3. Branch on LEVEL.effective:
   0 (manual): unlock, skip silently
   1 (nudge): unlock, display "Run /gsd:collect-signals {phase}"
   2 (prompt): unlock, ask user, if yes -> re-acquire lock and proceed
   3 (auto): proceed to collection

4. If proceeding:
   Invoke collect-signals workflow for phase {PADDED_PHASE}
   (This spawns sensors in parallel via the existing workflow)

5. Release lock:
   node ~/.claude/get-shit-done/bin/gsd-tools.js automation unlock signal_collection --raw

6. Track event:
   node ~/.claude/get-shit-done/bin/gsd-tools.js automation track-event signal_collection fire
</step>
```

### Regime Change Entry Creation

```javascript
// Source: designed for SIG-06 based on cybernetics deliberation

function writeRegimeChange(cwd, description, expectedImpact, priorRegime) {
  const kbDir = fs.existsSync(path.join(cwd, '.planning', 'knowledge'))
    ? path.join(cwd, '.planning', 'knowledge')
    : path.join(os.homedir(), '.gsd', 'knowledge');

  const projectName = path.basename(cwd).toLowerCase().replace(/[^a-z0-9]/g, '-');
  const timestamp = new Date().toISOString();
  const id = `regime-${timestamp.slice(0, 10)}-${description.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}`;

  const content = `---
id: ${id}
type: regime_change
project: ${projectName}
tags: [observation-regime, signal-collection, automation]
created: ${timestamp}
status: active
---

# Regime Change: ${description}

## Change
${description}

## Expected Impact
${expectedImpact}

## Timestamp
${timestamp}

## Prior Regime
${priorRegime}
`;

  const signalDir = path.join(kbDir, 'signals', projectName);
  fs.mkdirSync(signalDir, { recursive: true });
  fs.writeFileSync(path.join(signalDir, `${id}.md`), content);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `/gsd:collect-signals` invocation | Workflow postlude auto-trigger | Phase 40 (this phase) | Signals collected reliably after every phase |
| Hook-based auto-triggering (proposed in early v1.17 deliberation) | Inline workflow step | Refined during ARCHITECTURE.md research | Works on all 4 runtimes, not just Claude Code + Gemini CLI |
| No reentrancy protection | Lockfile with TTL and source tagging | Phase 40 (this phase) | Prevents feedback loops from Pitfall 1 |
| Implicit observation conditions | Explicit regime_change KB entries | Phase 40 (this phase) | Enables valid trend analysis across configuration changes |

## Open Questions

### Resolved

- **Hook vs workflow step for auto-triggering:** Workflow postlude is correct. Hooks fail on 2/4 runtimes and require reverse-engineering phase identity from file events. The ARCHITECTURE.md research already recommends this approach. The FEATURE_CAPABILITY_MAP already declares `signal_collection: { hook_dependent_above: null }`.
- **Where to put the lockfile:** Project-local `.planning/.signal-collection.lock`. Global would cause cross-project interference. Project-local is already gitignored.
- **How to detect stale locks:** mtime comparison against configurable TTL. No need for process-based detection (PID checking) since LLM sessions are not traditional OS processes.
- **Should reentrancy guard use proper-lockfile npm package:** No. The guard protects against re-entrance within a single orchestrator session, not across arbitrary OS processes. Simple writeFileSync/unlinkSync is sufficient and avoids adding a dependency to the zero-dependency gsd-tools.js.
- **How to estimate context usage for deferral:** The orchestrator can estimate based on phase complexity (number of plans, waves completed). An exact measurement is not needed -- the threshold is a soft cap with generous margin.
- **Where do regime_change entries go:** In the existing `.planning/knowledge/signals/{project}/` directory. The index builder already scans this directory. Adding a new `type: regime_change` to entries there requires no infrastructure changes.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| What constitutes a "regime change" vs a "parameter tweak"? | Medium | Define in code: level change, sensor enable/disable, auto_collect toggle = regime change. TTL adjustment, cap change = parameter tweak. Accept-risk on edge cases. |
| Should auto-collection run after gap-closure re-executions? | Low | Yes, treat gap-closure phases the same as regular phases. The postlude fires regardless of `--gaps-only` flag. |

### Still Open

- Context percentage estimation in the orchestrator is approximate. The exact method for estimating context usage within the execute-phase workflow is implementation-dependent. This is acceptable because the deferral threshold has a wide margin (default 60%).

## Sources

### Primary (HIGH confidence)
- Codebase: `get-shit-done/workflows/execute-phase.md` -- current workflow structure, step ordering
- Codebase: `get-shit-done/workflows/collect-signals.md` -- sensor orchestration, auto-discovery pattern
- Codebase: `get-shit-done/bin/gsd-tools.js` lines 5111-5255 -- automation resolve-level and track-event implementations
- Codebase: `get-shit-done/bin/gsd-tools.js` lines 538-555 -- FEATURE_CAPABILITY_MAP definition
- Codebase: `get-shit-done/feature-manifest.json` -- signal_collection and automation schemas
- Codebase: `get-shit-done/references/capability-matrix.md` -- runtime capability reference
- Codebase: `.planning/research/PITFALLS.md` -- Pitfall 1 (feedback loops), Pitfall 4 (cross-runtime)
- Codebase: `.planning/research/ARCHITECTURE.md` -- auto-triggering architecture analysis
- Codebase: `.planning/REQUIREMENTS.md` -- SIG-01 through SIG-06 requirements

### Secondary (MEDIUM confidence)
- [proper-lockfile npm](https://www.npmjs.com/package/proper-lockfile) -- lockfile design patterns (mkdir-based atomic locks, mtime-based stale detection, TTL configuration)
- [proper-lockfile GitHub](https://github.com/moxystudio/node-proper-lockfile) -- stale lock recovery patterns

### Tertiary (LOW confidence)
- None

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| spk-2026-03-01-claude-code-session-log-location | spike | Claude Code session log paths confirmed | Not directly applied -- spike is about log sensor (Phase 42+), not auto-collection. Noted for future reference. |

Checked knowledge base (`.planning/knowledge/index.md`). Scanned 107 signals and 1 spike. No lessons exist yet. The spike on session log location is tangentially related (signal collection infrastructure) but does not directly inform Phase 40's auto-triggering design. No KB entries about lockfile patterns, reentrancy, or auto-triggering were found.

Spikes avoided: 0 (no existing spike covers lockfile design or auto-trigger architecture)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components already exist in codebase, verified by reading source
- Architecture: HIGH -- postlude pattern already recommended in ARCHITECTURE.md research, FEATURE_CAPABILITY_MAP already supports it
- Pitfalls: HIGH -- Pitfall 1 (feedback loops) extensively analyzed in PITFALLS.md with prevention strategies; lockfile design informed by proper-lockfile patterns
- Reentrancy guard: HIGH -- design is simple (file-based lock with TTL), edge cases well-understood from research

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (30 days -- stable domain, all components in-repo)
