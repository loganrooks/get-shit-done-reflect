# Phase 42: Reflection Automation - Research

**Researched:** 2026-03-06
**Domain:** Workflow automation, counter-based scheduling, session-scoped state, mutable lesson confidence
**Confidence:** HIGH

## Summary

Phase 42 adds automatic reflection triggering to the execute-phase workflow, following the same postlude pattern established by Phase 40 (signal collection) and Phase 41 (health check). The existing infrastructure is mature: `resolve-level` handles automation levels with context deferral and runtime caps, `check-lock`/`lock`/`unlock` provide reentrancy guards, `track-event` records fire/skip statistics, and `FEATURE_CAPABILITY_MAP` already has a `reflection` entry (`hook_dependent_above: null, task_tool_dependent: true`). The primary new work is: (1) a persistent `phases_since_last_reflect` counter in config.json incremented by the execute-phase postlude, (2) a minimum untriaged signal threshold gate that counts signals from the KB index before triggering, (3) a session-scoped cooldown mechanism, and (4) directional confidence updates on lesson entries when reflection runs.

The research flag ("Stop hook counter interaction and state machine need explicit design before coding") is addressed by this research: there is NO stop hook interaction. The counter lives in config.json, incremented by the execute-phase workflow postlude (same pattern as auto_collect_signals), not by a Stop hook. The "state machine" is a simple counter with two thresholds (phase count and signal count) plus a boolean cooldown. The reflect workflow itself already handles all analysis logic -- the postlude only decides WHETHER to invoke it.

The lesson confidence update (REFL-05) is the most architecturally significant addition because lessons are currently deprecated as individual files (knowledge-store.md Section 1: "Lessons are deprecated. No new lesson files are created."). However, REFL-05 explicitly requires mutable confidence on lessons with a `confidence_history` field. This means Phase 42 must either (a) work with the lesson candidates documented in reflection reports only, applying confidence tracking at the report level, or (b) reintroduce limited lesson file writing for lessons that need confidence evolution. The research recommends option (a): track confidence evolution in reflection reports, not in individual lesson files. The reflection report already contains lesson candidates; adding `confidence_history` to the report's lesson candidate entries avoids resurrecting deprecated infrastructure.

**Primary recommendation:** Implement auto-reflection as a third postlude step in execute-phase.md (after signal collection, after health check), using the same resolve-level/lock/track-event pattern, with counter+threshold gating in config.json and session cooldown via an in-memory flag (NOT a lockfile -- session scope is inherently in-memory).

## Standard Stack

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| `gsd-tools.js automation resolve-level` | `get-shit-done/bin/gsd-tools.js` | Determine effective level for `reflection` feature | Phase 37; handles overrides, context deferral, runtime caps |
| `gsd-tools.js automation track-event` | `get-shit-done/bin/gsd-tools.js` | Record fire/skip stats for reflection | Phase 37; atomic config write |
| `gsd-tools.js automation check-lock` | `get-shit-done/bin/gsd-tools.js` | Check reentrancy before triggering | Phase 40; file-based lock with stale detection |
| `gsd-tools.js automation lock/unlock` | `get-shit-done/bin/gsd-tools.js` | Acquire/release lock during reflection | Phase 40; project-local lockfile |
| `reflect.md` workflow | `get-shit-done/workflows/reflect.md` | Full reflection analysis orchestration | Phase 04/33; delegates to gsd-reflector agent |
| `FEATURE_CAPABILITY_MAP.reflection` | `gsd-tools.js` line 543 | Runtime capability cap (`task_tool_dependent: true`) | Already defined; caps to level 2 on runtimes without Task() |
| `feature-manifest.json` | `get-shit-done/feature-manifest.json` | Schema for new reflection automation config keys | All config declared here per convention |
| config.json `automation.stats` | `.planning/config.json` | Counter persistence (`phases_since_last_reflect`) | Phase 37 stats pattern; atomic write via track-event |

### Supporting
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| `kb-rebuild-index.sh` | `get-shit-done/bin/kb-rebuild-index.sh` | Rebuild KB index after confidence updates | Only if lesson files are modified |
| `knowledge/index.md` | `.planning/knowledge/index.md` | Count untriaged signals for threshold check | Before every auto-reflection trigger decision |
| `reflection-patterns.md` | `get-shit-done/references/reflection-patterns.md` | Pattern detection rules consumed by reflector | Already loaded by reflect workflow |
| `automation regime-change` | `gsd-tools.js` subcommand | Record first-fire regime change | Only on first auto-reflection fire |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Counter in config.json | Counter in STATE.md | STATE.md is markdown (fragile parsing). Config.json is structured JSON with atomic write already used by track-event. Config wins. |
| Session-scoped in-memory flag for cooldown | Lockfile with session-start TTL | Lockfile outlives session (must be cleaned up). Session cooldown is inherently transient -- no file needed. The orchestrator agent holds the flag in its conversation context. |
| Confidence tracking in reflection reports | Resurrecting individual lesson files | Lesson files are deprecated (knowledge-store.md Section 1). Reports already contain lesson candidates. Adding confidence_history to report entries avoids resurrecting deprecated infrastructure. |
| Postlude step in execute-phase.md | Stop hook with counter logic | Stop hook fires at session end, not phase end. Phase count cannot be reliably incremented at session end (multiple phases may have run). The postlude fires exactly once per phase execution, which is the correct semantics. |

## Architecture Patterns

### Recommended Implementation Structure

```
get-shit-done/
  workflows/
    execute-phase.md          # ADD: auto_reflect step (3rd postlude, after health check)
    reflect.md                # NO CHANGES -- invoked as-is
  bin/
    gsd-tools.js              # ADD: reflection-counter subcommand (increment, check, reset)
  feature-manifest.json       # ADD: reflection config keys to automation feature
  references/
    reflection-patterns.md    # ADD: confidence_history schema for lesson candidates
```

### Pattern 1: Counter-Based Reflection Scheduling (REFL-02)

**What:** A persistent counter `phases_since_last_reflect` in config.json, incremented by a new gsd-tools.js subcommand called from the execute-phase postlude. The counter is separate from the `automation.stats` fire/skip tracking -- it is a scheduling counter, not a statistics counter.

**When to use:** After every successful phase execution, regardless of whether auto-reflection triggers.

**Config location:**
```json
{
  "automation": {
    "reflection": {
      "phases_since_last_reflect": 0,
      "threshold_phases": 3,
      "min_signals": 5,
      "auto_reflect": false,
      "last_reflect_at": null
    }
  }
}
```

**Counter lifecycle:**
```
Phase execution completes
  |
  v
Increment phases_since_last_reflect (ALWAYS, even if auto_reflect is false)
  |
  v
Check: auto_reflect enabled? -> No -> Skip (track skip "disabled")
  |
  Yes
  v
Check: phases_since_last_reflect >= threshold_phases? -> No -> Skip (track skip "threshold-not-met")
  |
  Yes
  v
Check: untriaged signal count >= min_signals? -> No -> Skip (track skip "insufficient-signals")
  |
  Yes
  v
Check: session cooldown active? -> Yes -> Skip (track skip "session-cooldown")
  |
  No
  v
Resolve automation level (resolve-level reflection --context-pct N)
  |
  v
Branch on level (0=skip, 1=nudge, 2=prompt, 3=auto)
  |
  v
If proceeding: acquire lock, invoke reflect workflow, release lock, reset counter to 0, set cooldown flag
```

**gsd-tools.js subcommand design:**
```bash
# Increment counter (called after every phase execution)
node gsd-tools.js automation reflection-counter increment --raw

# Check if reflection should trigger (returns JSON with decision + reason)
node gsd-tools.js automation reflection-counter check --raw

# Reset counter (called after reflection completes)
node gsd-tools.js automation reflection-counter reset --raw
```

The subcommand pattern keeps counter logic in tested JavaScript (not workflow markdown parsing), consistent with resolve-level and track-event.

### Pattern 2: Minimum Signal Threshold Gate (REFL-03)

**What:** Before triggering auto-reflection, count untriaged signals in the KB index. Only proceed if count exceeds the configurable minimum (default 5).

**Why:** Prevents reflection from firing with insufficient data. Reflection on 1-2 signals produces pattern claims without sufficient grounding.

**Implementation:**
```bash
# Count untriaged signals from index (same method used by reflect workflow's lifecycle dashboard)
UNTRIAGED=$(grep "^| sig-" .planning/knowledge/index.md | grep -c "detected" 2>/dev/null || echo 0)
```

This is a lightweight check (single grep on index.md) that avoids reading individual signal files. The count includes only standard-format signals with `detected` lifecycle state, not legacy SIG-format signals or already-triaged signals.

**Design decision:** The threshold is on untriaged signals specifically, not total signals. This ensures reflection has fresh material to work with. A project with 100 triaged signals but 0 untriaged ones should NOT auto-trigger reflection -- there is nothing new to analyze.

### Pattern 3: Session-Scoped Cooldown (REFL-04)

**What:** After auto-reflection fires once in a session, no further auto-reflections trigger in the same session. This is a session-scoped boolean, not a persistent flag.

**Why:** Reflection spawns a `gsd-reflector` subagent (via Task()), which is expensive -- it loads the KB index, reads signal files, performs pattern detection, generates triage proposals, and writes a report. Running this more than once per session would consume excessive context.

**Implementation approach:** The execute-phase orchestrator maintains a boolean `session_reflection_fired` in its conversation context. This flag is set to `true` after auto-reflection fires and checked before subsequent auto-reflection attempts within the same execute-phase invocation.

**Why NOT a lockfile:** Session scope is inherently transient. A lockfile would outlive the session and block the next session's auto-reflection unless cleaned up. The reentrancy lock (check-lock/lock/unlock) already handles concurrent execution prevention. The cooldown is about "don't trigger twice in one session" -- a fundamentally different concern from "don't trigger concurrently."

**Edge case -- multi-phase sessions:** If a user runs `/gsd:execute-phase 42` and then `/gsd:execute-phase 43` in the same session, the cooldown means reflection only fires once (after whichever phase first meets the threshold). This is intentional -- REFL-04 says "maximum one auto-reflection per session."

**Edge case -- single-phase sessions:** If each phase is executed in a fresh session (the more common pattern with `/clear` between phases), the cooldown resets naturally because the orchestrator is a fresh agent.

### Pattern 4: Postlude Step Ordering (Critical)

**What:** The auto_reflect step is the THIRD postlude in execute-phase.md, ordered after signal collection and health check.

**Order:**
1. `reconcile_signal_lifecycle` -- update signals declared in resolves_signals
2. `auto_collect_signals` -- collect new signals from the phase (SIG-01)
3. `health_check_postlude` -- run health check if configured (HEALTH-05)
4. **`auto_reflect`** -- trigger reflection if counter/threshold met (REFL-01)
5. `update_roadmap` -- mark phase complete

**Why this order matters:**
- Signal collection MUST run before reflection so that the newly collected signals are available for the reflector to analyze. If reflection ran first, it would miss the current phase's signals.
- Health check before reflection is less critical but maintains consistency -- health check is lightweight and fast, while reflection is expensive.
- Counter increment happens at the START of the auto_reflect step (before the trigger decision), so the counter is always accurate even if reflection doesn't fire.

### Pattern 5: Mutable Lesson Confidence with Directional Updates (REFL-05)

**What:** When auto-reflection runs, the reflector evaluates whether accumulated signals match or contradict existing lesson predictions. Matching signals increase confidence one step, contradictions decrease confidence one step. Changes are recorded in a `confidence_history` array.

**Confidence step ladder:**
```
low <-> medium <-> high
```

One step up: low -> medium, medium -> high, high -> high (ceiling)
One step down: high -> medium, medium -> low, low -> low (floor)

**Where confidence_history lives:** In the reflection report, NOT in individual lesson files.

Since lessons are deprecated as individual files (knowledge-store.md: "No new lesson files are created"), confidence tracking is added to the reflection report's lesson candidates section. The report already contains lesson candidate entries. Each entry gains a `confidence_history` array:

```yaml
## Lesson Candidates

### Lesson: {title}
**Current confidence:** medium
**Confidence history:**
- 2026-03-06: medium -> high (3 corroborating signals: sig-A, sig-B, sig-C)
- 2026-03-04: low -> medium (initial distillation, 4 evidence signals)

**Evidence:** [signal IDs]
```

**Matching logic:** The reflector already performs pattern detection and lesson distillation. For REFL-05, it additionally:
1. Reads previous reflection reports to find existing lesson candidates
2. For each existing lesson candidate, checks if new signals match its prediction pattern (same tags, same signal_type, signal_category matches expected direction)
3. Corroborating signals (negative signals matching a lesson about a recurring problem) increase confidence
4. Contradicting signals (positive signals showing the problem is resolved, or absence of expected recurrence) decrease confidence
5. Signals irrelevant to the lesson produce no update

**The "untestable milestone" rule:** If no signals in the current reflection batch relate to a lesson's domain, no confidence update occurs. This prevents confidence from decaying due to irrelevance.

**Practical constraint:** With lessons deprecated as files, the reflector reads previous reflection reports (`.planning/knowledge/reflections/{project}/reflect-*.md`) to find the most recent confidence state for each lesson candidate. This is a report-to-report chaining pattern, not a file-based lookup.

### Anti-Patterns to Avoid

- **Stop hook for counter increment:** The Stop hook fires at session end, which could be after 0, 1, or many phase executions. It cannot reliably increment a per-phase counter. Use the postlude step.
- **Persistent cooldown flag (lockfile or config):** Session cooldown must be transient. A persistent flag would block the next session's auto-reflection. Use in-memory orchestrator state.
- **Resurrecting individual lesson files for confidence tracking:** Lessons are deprecated. Adding confidence_history to lesson files would reintroduce a deprecated system. Track confidence in reflection reports instead.
- **Full signal file reads for threshold check:** The min_signals threshold only needs a count of untriaged signals. Use `grep -c` on the index, not full signal file parsing.
- **Running reflection inline (without Task):** Reflection is expensive and spawns a subagent. On runtimes without task_tool, reflection cannot auto-trigger at level 3 (capped to level 2 by FEATURE_CAPABILITY_MAP). This is already handled by resolve-level.
- **Double-counting the counter increment and the track-event fire:** These are SEPARATE operations. `reflection-counter increment` updates the phase counter. `track-event reflection fire` updates the automation statistics. Do not conflate them. (See sig-2026-03-05-phase40-plan-gaps-pre-execution-review for the Phase 40 double-fire bug.)

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Automation level resolution | Custom level logic in workflow | `resolve-level reflection --context-pct N` | Override, deferral, runtime cap already handled |
| Reentrancy guard | Custom lockfile code in workflow | `check-lock`/`lock`/`unlock` subcommands | Stale detection, atomic write already built |
| Event tracking | Custom fire/skip counters | `track-event reflection fire/skip` | Atomic config write, ISO timestamps |
| Signal counting | Read + parse all signal files | `grep -c "detected"` on index.md | Index is pre-built; grep is O(1 file read) |
| Regime change recording | Custom KB entry writing | `regime-change` subcommand | Standard format, auto-indexed |
| Reflection analysis | Custom pattern detection in postlude | Invoke existing reflect.md workflow | Reflector agent handles all analysis logic |

**Key insight:** Like Phase 40, nearly all infrastructure exists from Phases 37-40. The postlude step is ~50 lines of workflow markdown that wires existing components together. The only genuinely new code is the reflection-counter subcommand (~60 lines in gsd-tools.js) and the manifest config schema additions.

## Common Pitfalls

### Pitfall 1: Feedback Loop Between Auto-Reflection and Auto-Collection

**What goes wrong:** Auto-reflection writes a reflection report to `.planning/knowledge/reflections/`. If the artifact sensor detects this report as a new artifact and triggers signal collection, which accumulates more signals, which triggers reflection again: infinite loop.

**Why it happens:** The artifact sensor scans phase directories and may detect KB-written artifacts.

**How to avoid:** This is already addressed by the reentrancy guard from Phase 40. The `signal_collection` lock prevents collection from re-triggering during reflection. Additionally, SIG-03 specifies source-tagged triggers: only `phase-completion` triggers collection, not `reflection-output`. The reflection postlude should NOT acquire the signal_collection lock -- it uses the `reflection` lock. They are separate features with separate locks.

**Warning signs:** Multiple reflection reports in git log without corresponding phase executions.

### Pitfall 2: Counter Not Incrementing When Auto-Reflect Is Disabled

**What goes wrong:** If the counter only increments when auto_reflect is enabled, disabling auto_reflect causes the counter to stay at 0. When the user later enables auto_reflect, reflection fires immediately (counter is 0 < threshold) regardless of how many phases have passed.

**Why it happens:** Coupling counter increment to trigger decision.

**How to avoid:** ALWAYS increment the counter after every phase execution, regardless of auto_reflect setting. The counter tracks "phases since last reflection" -- that fact is independent of whether auto-reflection is enabled. This matches the requirement: "phases_since_last_reflect counter persists in config, incremented by execute-phase postlude, and resets after reflection runs."

**Warning signs:** Counter stays at 0 across multiple phases when auto_reflect is false.

### Pitfall 3: Session Cooldown Prevents Manual Reflection

**What goes wrong:** After auto-reflection fires, the session cooldown prevents ANY reflection from running, including manual `/gsd:reflect` invocations.

**Why it happens:** Cooldown check placed too broadly.

**How to avoid:** Session cooldown applies ONLY to auto-triggered reflection (the postlude step). Manual `/gsd:reflect` commands bypass the cooldown entirely. The cooldown flag is checked in the execute-phase postlude, not in the reflect workflow itself.

**Warning signs:** User runs `/gsd:reflect` after auto-reflection and gets blocked.

### Pitfall 4: Untriaged Signal Count Includes Legacy SIG-Format Signals

**What goes wrong:** Legacy SIG-format signals (ID starts with `SIG-`) have no lifecycle_state field. If the threshold check counts them as untriaged, the threshold is permanently met (15 legacy signals exist).

**Why it happens:** Naive grep counts all signals without filtering by format.

**How to avoid:** The threshold check must count only standard-format signals (`sig-` prefix) with `detected` lifecycle state. The grep pattern: `grep "^| sig-" index.md | grep "detected"` (lowercase `sig-`, not `SIG-`). This excludes legacy signals and already-triaged signals.

**Warning signs:** Auto-reflection triggers on the first phase after enabling, even with no new signals.

### Pitfall 5: Double-Fire Track-Event Bug (Recurrence of Phase 40 Bug)

**What goes wrong:** The code calls `track-event reflection fire` in the success path, then calls it again in the cleanup/reporting section. The fire count increments twice, making "fires === 1" regime change detection always fail.

**Why it happens:** Copy-paste from Phase 40 before the bug was caught. See sig-2026-03-05-phase40-plan-gaps-pre-execution-review.

**How to avoid:** Call `track-event reflection fire` exactly ONCE, in the success path. Parse the returned stats JSON to check `fires === 1` for regime change. Do NOT call track-event again.

**Warning signs:** `automation.stats.reflection.fires` increments by 2 per reflection run.

## Code Examples

### Execute-Phase Postlude: Auto-Reflect Step

```markdown
<!-- REFL-01, REFL-02, REFL-03, REFL-04: auto-reflection postlude -->
<step name="auto_reflect">
Auto-trigger reflection after successful phase execution when counter and
threshold conditions are met. This is a workflow postlude -- same cross-runtime
pattern as auto_collect_signals and health_check_postlude.

Only runs if verification passed AND prior postludes completed (or were skipped).

**1. Increment phase counter (ALWAYS, regardless of auto_reflect setting):**

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.js automation reflection-counter increment --raw 2>/dev/null
```

**2. Check if auto_reflect is enabled:**

```bash
REFLECT_CONFIG=$(node -e "try{const c=JSON.parse(require('fs').readFileSync('.planning/config.json','utf8'));const r=(c.automation||{}).reflection||{};console.log(JSON.stringify({auto_reflect:r.auto_reflect||false,threshold:r.threshold_phases||3,min_signals:r.min_signals||5,counter:r.phases_since_last_reflect||0}))}catch{console.log(JSON.stringify({auto_reflect:false}))}")
```

If auto_reflect is false: skip. Track: `track-event reflection skip "disabled"`

**3. Check phase counter threshold:**

Parse REFLECT_CONFIG. If counter < threshold: skip.
Track: `track-event reflection skip "threshold-not-met"`

**4. Check minimum signal threshold (REFL-03):**

```bash
UNTRIAGED=$(grep "^| sig-" .planning/knowledge/index.md 2>/dev/null | grep -c "detected" 2>/dev/null || echo 0)
```

If UNTRIAGED < min_signals: skip.
Track: `track-event reflection skip "insufficient-signals"`

**5. Check session cooldown (REFL-04):**

If session_reflection_fired is true: skip.
Track: `track-event reflection skip "session-cooldown"`

**6. Check reentrancy guard:**

```bash
LOCK_STATUS=$(node ~/.claude/get-shit-done/bin/gsd-tools.js automation check-lock reflection --raw 2>/dev/null)
```

If locked and not stale: skip. Track: `track-event reflection skip "reentrancy"`

**7. Resolve automation level:**

```bash
LEVEL=$(node ~/.claude/get-shit-done/bin/gsd-tools.js automation resolve-level reflection --context-pct {EST_CONTEXT_PCT} --raw 2>/dev/null)
```

Use same wave-based context estimation as prior postludes.

**8. Branch on effective level:**

| Level | Name | Behavior |
|-------|------|----------|
| 0 | manual | Skip. Track: `track-event reflection skip "level-0"` |
| 1 | nudge | Display nudge and skip. Track skip. |
| 2 | prompt | Ask user. If yes, proceed. If no, track skip. |
| 3 | auto | Proceed to reflection. |

Note: On runtimes without task_tool, reflection is capped to level 2 (prompt) by
FEATURE_CAPABILITY_MAP because reflection spawns a gsd-reflector subagent via Task().

**Nudge message:**
```
Reflection available ({N} untriaged signals, {M} phases since last reflect).
Run `/gsd:reflect` to analyze patterns.
```

**Context-deferred message:**
```
Context usage high. Reflection deferred.
Run `/gsd:reflect` in a fresh session.
```

**9. If proceeding:**

Acquire lock, invoke reflect workflow, release lock:

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.js automation lock reflection --source "phase-completion" --raw 2>/dev/null
```

Invoke reflect.md workflow for the current phase. The workflow handles all analysis.

```bash
# Release lock
node ~/.claude/get-shit-done/bin/gsd-tools.js automation unlock reflection --raw 2>/dev/null

# Track event (exactly once -- Pitfall 5)
FIRE_STATS=$(node ~/.claude/get-shit-done/bin/gsd-tools.js automation track-event reflection fire --raw 2>/dev/null)

# Reset counter
node ~/.claude/get-shit-done/bin/gsd-tools.js automation reflection-counter reset --raw 2>/dev/null

# Set session cooldown
session_reflection_fired=true
```

**10. First-run regime change detection:**

Parse FIRE_STATS. If fires is 1: write regime_change entry.

```bash
node ~/.claude/get-shit-done/bin/gsd-tools.js automation regime-change "Auto-reflection enabled" --impact "Reflection frequency expected to increase; pattern detection and triage will run automatically every N phases" --prior "Manual /gsd:reflect invocation only" --raw 2>/dev/null
```

This step is best-effort -- failures do not block phase completion.
</step>
```

### gsd-tools.js Reflection Counter Subcommand

```javascript
// Source: designed for Phase 42, follows track-event atomic write pattern

function cmdAutomationReflectionCounter(cwd, action, raw) {
  if (!action || !['increment', 'check', 'reset'].includes(action)) {
    error('Usage: automation reflection-counter <increment|check|reset>');
  }

  const configPath = path.join(cwd, '.planning', 'config.json');
  if (!fs.existsSync(configPath)) {
    error('No .planning/config.json found.');
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!config.automation) config.automation = {};
  if (!config.automation.reflection) {
    config.automation.reflection = {
      auto_reflect: false,
      threshold_phases: 3,
      min_signals: 5,
      phases_since_last_reflect: 0,
      last_reflect_at: null
    };
  }

  const reflection = config.automation.reflection;

  if (action === 'increment') {
    reflection.phases_since_last_reflect =
      (reflection.phases_since_last_reflect || 0) + 1;
  } else if (action === 'reset') {
    reflection.phases_since_last_reflect = 0;
    reflection.last_reflect_at = new Date().toISOString();
  }
  // 'check' action reads only

  // Atomic write
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2) + '\n');
  fs.renameSync(tmpPath, configPath);

  output({
    action,
    phases_since_last_reflect: reflection.phases_since_last_reflect,
    threshold_phases: reflection.threshold_phases || 3,
    min_signals: reflection.min_signals || 5,
    auto_reflect: reflection.auto_reflect || false,
    last_reflect_at: reflection.last_reflect_at
  }, raw);
}
```

### Feature Manifest Addition

```json
{
  "automation": {
    "schema": {
      "reflection": {
        "type": "object",
        "default": {},
        "description": "Reflection automation settings (auto-trigger after N phases)",
        "properties": {
          "auto_reflect": {
            "type": "boolean",
            "default": false,
            "description": "Whether reflection auto-triggers after phase execution (opt-in)"
          },
          "threshold_phases": {
            "type": "number",
            "default": 3,
            "min": 1,
            "max": 20,
            "description": "Number of phases between auto-reflections"
          },
          "min_signals": {
            "type": "number",
            "default": 5,
            "min": 1,
            "max": 50,
            "description": "Minimum untriaged signals required before auto-reflection triggers"
          },
          "phases_since_last_reflect": {
            "type": "number",
            "default": 0,
            "description": "Counter: phases executed since last reflection (auto-managed)"
          },
          "last_reflect_at": {
            "type": "string",
            "default": null,
            "description": "ISO timestamp of last reflection run (auto-managed)"
          }
        }
      }
    }
  }
}
```

### Confidence History in Reflection Report

```markdown
## Lesson Confidence Updates (REFL-05)

### Lesson: Plan-execution deviation pattern
**Prior confidence:** medium (from reflect-2026-03-04.md)
**New evidence:** 3 corroborating signals (sig-A, sig-B, sig-C)
**Update:** medium -> high (+1 step: corroborating evidence)
**Confidence history:**
| Date | From | To | Evidence | Reason |
|------|------|----|----------|--------|
| 2026-03-06 | medium | high | sig-A, sig-B, sig-C | 3 signals match predicted pattern |
| 2026-03-04 | low | medium | sig-X, sig-Y, sig-Z, sig-W | Initial distillation |

### Lesson: CI bypass governance gap
**Prior confidence:** high (from reflect-2026-03-04.md)
**New evidence:** 1 contradicting signal (sig-D: CI now green with no bypasses)
**Update:** high -> medium (-1 step: contradicting evidence)
**Confidence history:**
| Date | From | To | Evidence | Reason |
|------|------|----|----------|--------|
| 2026-03-06 | high | medium | sig-D | Positive signal contradicts pattern |
| 2026-03-04 | medium | high | sig-P, sig-Q | Pattern confirmed across phases |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual `/gsd:reflect` only | Auto-trigger via workflow postlude | Phase 42 | Prevents signal debt from growing unchecked |
| Static lesson confidence (set once, never changes) | Directional confidence updates based on evidence | Phase 42 | Confidence reflects actual evidence, not initial assessment |
| No reflection scheduling | Counter-based scheduling with dual threshold | Phase 42 | Reflection fires at appropriate intervals with sufficient data |
| Lessons as individual KB files | Lesson candidates in reflection reports only | Phase 33 (deprecated lessons) | Confidence tracking adapts to report-based model |

**Deprecated/outdated:**
- **Individual lesson files:** Deprecated per knowledge-store.md Section 1. New lessons are documented in reflection reports only. Confidence tracking must work with the report-based model.
- **Stop hook for auto-triggering:** The research flag mentions "stop hook counter interaction" but the correct pattern is postlude-based (established by Phase 40). Stop hooks fire at session end, not phase end.

## Open Questions

### Resolved

- **Where does the counter persist?** In `config.json` under `automation.reflection.phases_since_last_reflect`. This is structured JSON with atomic writes (same as track-event), not STATE.md (fragile markdown parsing).
- **Stop hook or postlude for counter?** Postlude. The Stop hook fires at session end (wrong granularity). The postlude fires after each phase execution (correct granularity). This directly resolves the research flag.
- **How does session cooldown work?** In-memory boolean in the orchestrator's conversation context. Not a file. Not a lockfile. Session-scoped state is inherently transient.
- **Where does confidence_history live?** In reflection reports. Lessons are deprecated as individual files. The reflector reads previous reports to find existing lesson candidates and their confidence states.
- **Does the counter increment when auto_reflect is disabled?** Yes. Always increment. The counter tracks "phases since last reflection" regardless of whether auto-reflection is enabled.
- **How are legacy SIG-format signals excluded from the threshold count?** Grep pattern uses lowercase `sig-` prefix, which excludes `SIG-` format signals. Additionally, only `detected` lifecycle state signals are counted.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| How does the reflector find previous lesson candidates across reports? | Medium | The reflector reads the most recent reflection report from `.planning/knowledge/reflections/{project}/`. If no previous report exists, all lesson candidates start at their initial confidence. Report-to-report chaining is new and needs explicit implementation in the reflector. Accept risk -- the reflector agent is intelligent enough to parse reports. |
| What if the user manually runs `/gsd:reflect` -- does this reset the counter? | Low | Yes. Any reflection run (manual or auto) resets the counter. The reflect workflow should call `reflection-counter reset` at completion. This requires a small addition to reflect.md. |
| How does the reflector determine "matching" vs "contradicting" signals for confidence updates? | Medium | Use existing pattern detection logic: signals with overlapping tags and same signal_type as the lesson's evidence match. Positive signals (signal_category: positive) with matching tags contradict negative lesson patterns. Accept risk -- exact matching heuristics will be refined through use. |

### Still Open

- How will confidence_history be presented in the knowledge surfacing system when a phase researcher queries the KB? The surfacing system reads index.md and individual entry files. If confidence lives only in reflection reports, the surfacing system cannot currently access it. This is a future concern, not a Phase 42 blocker.

## Sources

### Primary (HIGH confidence)
- `get-shit-done/workflows/execute-phase.md` -- existing auto_collect_signals and health_check_postlude patterns (direct precedent)
- `get-shit-done/workflows/reflect.md` -- current reflection workflow (invoked as-is)
- `get-shit-done/bin/gsd-tools.js` lines 538-555 -- FEATURE_CAPABILITY_MAP with `reflection` entry
- `get-shit-done/bin/gsd-tools.js` lines 5113-5355 -- automation subcommands (resolve-level, track-event, lock/unlock/check-lock, regime-change)
- `get-shit-done/feature-manifest.json` -- automation config schema (to be extended)
- `agents/knowledge-store.md` -- lesson deprecation, signal schema, KB path resolution
- `get-shit-done/references/reflection-patterns.md` -- confidence scoring, pattern detection rules
- `.planning/REQUIREMENTS.md` -- REFL-01 through REFL-05 requirements with motivations
- `.planning/ROADMAP.md` -- Phase 42 success criteria and dependency chain
- `.planning/phases/40-signal-collection-automation/40-RESEARCH.md` -- postlude pattern precedent, reentrancy guard design

### Secondary (MEDIUM confidence)
- `.planning/research/PITFALLS.md` -- Pitfall 1 (feedback loops), Pitfall 6 (context bloat)
- `.planning/research/FEATURES.md` -- D-1 (auto-trigger reflection interval), D-6 (opt-out config)
- `.planning/research/STACK.md` -- auto-reflection scheduling via state file counter
- `.planning/deliberations/philosophy/bayesian-epistemology.md` -- theoretical grounding for directional confidence updates

### Tertiary (LOW confidence)
- Training knowledge about state machine design for counter-based scheduling -- no external sources needed as the pattern is simple (counter + threshold + reset)

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`), no lesson entries found (0 lessons in KB). One spike entry (`spk-2026-03-01-claude-code-session-log-location`) is not relevant to this phase's domain.

Relevant signals scanned:
- `sig-2026-03-05-phase40-plan-gaps-pre-execution-review` -- documents double-fire track-event bug, context estimation issues, and reentrancy concerns from Phase 40. Applied to: Pitfall 5 (double-fire prevention), context estimation approach.
- `sig-2026-03-04-signal-lifecycle-representation-gap` -- documents gap in signal lifecycle representation. Applied to: understanding which signals are countable for threshold check.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components exist from Phases 37-41, verified in codebase
- Architecture: HIGH -- follows established postlude pattern from Phase 40/41 with direct code precedents
- Counter/threshold design: HIGH -- simple state machine with well-understood semantics
- Confidence evolution (REFL-05): MEDIUM -- report-to-report chaining is new and untested; reflector agent's ability to parse previous reports needs validation during execution
- Pitfalls: HIGH -- informed by actual Phase 40 bugs (double-fire, context estimation) and documented feedback loop concerns

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (30 days -- stable internal architecture, no external dependencies)
