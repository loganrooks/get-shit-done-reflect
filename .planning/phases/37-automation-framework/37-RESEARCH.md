# Phase 37: Automation Framework - Research

**Researched:** 2026-03-03
**Domain:** Configuration infrastructure -- unified automation level system, per-feature overrides, context-aware deferral, runtime-aware effective levels, statistics tracking
**Confidence:** HIGH

## Summary

Phase 37 builds the automation configuration framework that every subsequent auto-triggering phase (38-43) depends on. This is a foundational config + CLI + statusline phase -- no new agents, no new workflows, no new sensors. The deliverable is a coherent subsystem in `gsd-tools.js` and `feature-manifest.json` that answers three questions: "what automation level is configured?", "what level is actually achievable on this runtime?", and "what did each feature actually do?"

The seven AUTO-* requirements define a layered system: a global `automation.level` (0-3) in config.json (AUTO-01), per-feature overrides via `automation.overrides` (AUTO-02), fine-grained knobs (thresholds, frequencies) per feature (AUTO-03), context-aware deferral from level 3 to nudge when context is scarce (AUTO-04), runtime-aware effective level display (AUTO-05), lightweight statistics tracking (AUTO-06), and manifest declaration of the schema (AUTO-07).

**Primary recommendation:** Implement level resolution as a new `gsd-tools.js automation resolve-level <feature>` subcommand that encapsulates the full resolution chain (global level -> per-feature override -> context deferral -> runtime capability cap -> effective level). All consuming workflows call this single command rather than reimplementing resolution logic. This keeps the framework centralized and testable.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| gsd-tools.js | Current (~5,400 lines) | Level resolution logic, statistics tracking, config read/write | All automation config operations are additive subcommands on the existing CLI |
| feature-manifest.json | manifest_version: 1 | Schema declaration for automation config keys | Existing pattern for all config additions since v1.15 |
| config.json | N/A | Runtime config storage for level, overrides, knobs, stats | Existing project config file, read by all workflows |
| gsd-statusline.js | Current | Display effective level indicator | Existing statusline hook, additive change |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| capability-matrix.md | Current | Runtime capability reference for effective level computation | When resolve-level needs to determine if hooks/task_tool are available |
| cmdConfigSet | Existing in gsd-tools.js | Dot-notation config writes | For statistics tracking updates |
| loadConfig / loadProjectConfig | Existing in gsd-tools.js | Config reads | For level resolution |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| gsd-tools.js subcommand for resolve-level | Inline resolution in each workflow | Centralized is testable and prevents drift; workflows just call one command |
| Config.json for stats | Separate stats file (.planning/.automation-stats.json) | Config.json keeps everything in one place; separate file avoids frequent config writes but adds another file to manage |
| Numeric levels (0-3) | Named levels only ("manual", "nudge", "prompt", "auto") | Numeric enables comparison operators (>= 2 means "at least prompt"); names are more readable; use both: numeric as canonical, names as display aliases |

**Installation:**
```bash
# No new npm packages. All changes are to existing files.
npm run build:hooks    # Rebuild statusline with new indicator
node bin/install.js --local  # Reinstall to .claude/
```

## Architecture Patterns

### Recommended Config Schema

```json
{
  "automation": {
    "level": 1,
    "overrides": {
      "signal_collection": 3,
      "health_check": 2
    },
    "context_threshold_pct": 60,
    "signal_collection": {
      "auto_collect": true,
      "context_threshold_pct": 65
    },
    "reflection": {
      "auto_reflect": false,
      "threshold_phases": 3,
      "min_signals": 5
    },
    "health_check": {
      "session_dedup_hours": 4
    },
    "stats": {
      "signal_collection": {
        "fires": 0,
        "skips": 0,
        "last_triggered": null,
        "last_skip_reason": null
      },
      "reflection": {
        "fires": 0,
        "skips": 0,
        "last_triggered": null,
        "last_skip_reason": null
      },
      "health_check": {
        "fires": 0,
        "skips": 0,
        "last_triggered": null,
        "last_skip_reason": null
      }
    }
  }
}
```

### Pattern 1: Level Resolution Chain

**What:** A deterministic resolution function that computes the effective automation level for a given feature, accounting for global level, per-feature overrides, context deferral, and runtime capabilities.

**When to use:** Every time a workflow, hook, or agent needs to decide "should this automation behavior fire?"

**Resolution order:**
```
1. Read automation.level from config (global level, default: 1)
2. Check automation.overrides[feature] (per-feature override)
   - If present, use override instead of global level
3. Check context deferral
   - If context_used_pct > automation.context_threshold_pct AND resolved >= 3:
     - Downgrade to 1 (nudge)
     - Record skip reason: "context_exceeded"
4. Check runtime capabilities
   - If feature requires hooks AND runtime lacks hooks:
     - Cap effective level at max achievable
   - If feature requires task_tool AND runtime lacks task_tool:
     - Cap effective level at max achievable
5. Return: { configured, override, effective, reasons[] }
```

**Example implementation (gsd-tools.js subcommand):**
```javascript
function cmdAutomationResolveLevel(cwd, feature, contextPct, raw) {
  const config = loadProjectConfig(cwd);
  if (!config) { error('No .planning/config.json found.'); }

  const automation = config.automation || {};
  const globalLevel = automation.level ?? 1;
  const override = automation.overrides?.[feature];
  let resolved = override ?? globalLevel;
  const reasons = [];

  // Per-feature override
  if (override !== undefined) {
    reasons.push(`override: ${feature}=${override}`);
  }

  // Context-aware deferral
  const threshold = automation.context_threshold_pct ?? 60;
  if (contextPct !== undefined && contextPct > threshold && resolved >= 3) {
    resolved = 1; // nudge
    reasons.push(`context_deferred: ${contextPct}% > ${threshold}% threshold`);
  }

  // Runtime capability cap
  const caps = getFeatureCapabilityRequirements(feature);
  // caps: { hooks_required_above: 2, task_tool_required_above: null }
  // (features that need hooks can't exceed level 2 on hookless runtimes)
  // Runtime detection: check if .claude/settings.json has hooks configured
  // or check capability-matrix reference

  const result = {
    feature,
    configured: globalLevel,
    override: override ?? null,
    effective: resolved,
    reasons,
    level_names: { 0: 'manual', 1: 'nudge', 2: 'prompt', 3: 'auto' }
  };

  output(result, raw);
}
```

### Pattern 2: Feature Capability Requirements Map

**What:** A static mapping from automation features to the runtime capabilities they need at each level.

**When to use:** Step 4 of level resolution -- determining runtime caps on effective level.

```javascript
const FEATURE_CAPABILITY_MAP = {
  signal_collection: {
    // Level 3 (auto) needs workflow postlude -- works on all runtimes
    // Session-start auto-trigger needs hooks -- caps at 2 without hooks
    hook_dependent_above: null, // workflow postlude, not hook-based
    task_tool_dependent: false,
  },
  reflection: {
    hook_dependent_above: null, // counter-based in workflow, not hook-based
    task_tool_dependent: true, // spawns reflector as subagent
  },
  health_check: {
    hook_dependent_above: 2, // session-start nudge needs hooks; every-phase is workflow-based
    task_tool_dependent: false,
  },
  ci_status: {
    hook_dependent_above: 1, // session-start display needs hooks
    task_tool_dependent: false,
  },
};
```

**Key insight from research:** The initial v1.17 milestone research recommended workflow postlude (not hooks) for auto-triggering signal collection and reflection. This means most level-3 features are NOT hook-dependent -- they fire from workflow steps. The hook dependency matters primarily for session-start behaviors (CI status, health check nudge) and statusline display. This means the effective level gap between hook and hookless runtimes is smaller than initially feared.

### Pattern 3: Statistics Tracking via Atomic Config Updates

**What:** Lightweight counters per feature that track fires, skips, skip reasons, and timestamps.

**When to use:** After every automation decision point in consuming workflows.

```javascript
function cmdAutomationTrackEvent(cwd, feature, event, reason, raw) {
  const configPath = path.join(cwd, '.planning', 'config.json');
  const config = loadProjectConfig(cwd) || {};

  if (!config.automation) config.automation = {};
  if (!config.automation.stats) config.automation.stats = {};
  if (!config.automation.stats[feature]) {
    config.automation.stats[feature] = {
      fires: 0, skips: 0, last_triggered: null, last_skip_reason: null
    };
  }

  const stats = config.automation.stats[feature];
  if (event === 'fire') {
    stats.fires++;
    stats.last_triggered = new Date().toISOString();
  } else if (event === 'skip') {
    stats.skips++;
    stats.last_skip_reason = reason || 'unknown';
  }

  // Atomic write
  const tmpPath = configPath + '.tmp';
  fs.writeFileSync(tmpPath, JSON.stringify(config, null, 2));
  fs.renameSync(tmpPath, configPath);

  output({ feature, event, stats }, raw);
}
```

### Pattern 4: Statusline Effective Level Display

**What:** Compact automation level indicator in the existing statusline.

**When to use:** Always displayed when automation section exists in config.

**Format:**
```
DEV | Claude Opus 4.6 | Fixing tests | project-name | Auto:3(2) | [progressbar] 45%
```

Where `Auto:3(2)` means configured=3, effective=2. When configured equals effective, display `Auto:3` without parenthetical.

**Implementation in gsd-statusline.js:**
```javascript
// Read automation config
let autoTag = '';
try {
  const configPath = path.join(dir, '.planning', 'config.json');
  if (fs.existsSync(configPath)) {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (cfg.automation?.level !== undefined) {
      const configured = cfg.automation.level;
      // Simplified effective level check (full resolution in gsd-tools.js)
      // For statusline, approximate: if no hooks, cap at 2
      const effective = configured; // TODO: full resolution
      if (effective < configured) {
        autoTag = `Auto:${configured}(${effective})`;
      } else {
        autoTag = `Auto:${configured}`;
      }
      autoTag = `\x1b[36m${autoTag}\x1b[0m \u2502 `;
    }
  }
} catch {}
```

**Design decision -- statusline effective level accuracy:** The statusline hook runs in Node.js without access to Claude's context window state. It cannot know the current context usage percentage. Therefore, the statusline shows the CONFIGURED level and the RUNTIME-CAPPED effective level, but NOT the context-deferred level. Context deferral is session-scoped and only visible within workflow execution context.

### Pattern 5: Mode vs Level Orthogonality

**What:** The existing `mode` config (yolo/interactive) and the new `automation.level` are orthogonal concerns.

**When to use:** When implementing or documenting any automation behavior.

| | mode: yolo | mode: interactive |
|---|---|---|
| **level 0 (manual)** | No auto-triggering; within-workflow steps execute without asking | No auto-triggering; within-workflow steps ask before executing |
| **level 1 (nudge)** | Statusline hints; within-workflow executes freely | Statusline hints; within-workflow asks before executing |
| **level 2 (prompt)** | System suggests "run X now?"; if confirmed, executes freely | System suggests "run X now?"; if confirmed, asks within workflow |
| **level 3 (auto)** | Auto-triggers fire; within-workflow executes freely | Auto-triggers fire; within-workflow asks before executing |

`mode` controls APPROVAL within a running workflow. `automation.level` controls WHETHER the workflow is triggered automatically.

### Anti-Patterns to Avoid

- **Scattering level resolution across workflows:** Each workflow reimplements "if auto-collect enabled" logic differently. Instead: centralize in `gsd-tools.js automation resolve-level`.
- **Conflating mode and level:** Adding `auto_collect: true` as a separate boolean instead of deriving it from `automation.level >= 3`. The level system REPLACES scattered booleans.
- **Blocking statistics tracking:** Writing stats on every automation decision adds I/O. Keep stats lightweight (counters, not event logs) and use atomic writes.
- **Statusline computing full resolution:** The statusline hook must be fast (<50ms). Full level resolution (context check, runtime detection) is too expensive. Show configured + runtime cap only; context deferral is visible in-workflow.
- **Hardcoding runtime detection:** Using `if runtime === "codex"` instead of `has_capability("hooks")`. Feature detection survives new runtimes being added.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config schema validation | Custom automation config validator | Existing `manifest validate` / `manifest diff-config` | Feature-manifest already handles type checking, enum validation, missing fields |
| Config migration | Manual "add automation section" script | Existing `manifest apply-migration` pattern | Manifest-driven migration adds defaults for missing features |
| Dot-notation config writes | Custom nested setter | Existing `cmdConfigSet` in gsd-tools.js | Already handles nested dot paths, type coercion |
| Atomic config writes | `fs.writeFileSync` directly | Atomic write pattern (tmp + rename) already in codebase | Prevents corruption on crash mid-write |
| Context usage reading | Custom context estimation | Statusline input `data.context_window.remaining_percentage` | Claude Code provides this in hook stdin JSON |

**Key insight:** The automation framework is primarily CONFIG INFRASTRUCTURE. The gsd-tools.js CLI already has robust config read/write, validation against manifest, and migration support. Phase 37 adds a new feature to the manifest, new subcommands to gsd-tools.js, and an indicator to the statusline. It does NOT add agents, workflows, or hooks (those come in Phases 38-43).

## Common Pitfalls

### Pitfall 1: Config.json Race Conditions from Statistics Writes

**What goes wrong:** Multiple automation features (signal collection, health check, reflection) each track statistics by reading config.json, updating a counter, and writing it back. If two features fire near-simultaneously (e.g., auto-collect triggers and health check triggers from the same workflow step), they can read the same config state, each increment their own counter, and the second write overwrites the first's increment.

**Why it happens:** GSD does not use a database. Config.json is a flat file. There is no file-level locking mechanism in Node.js `fs.writeFileSync`.

**How to avoid:** Use the atomic write pattern (tmp file + rename) that already exists in the codebase. For statistics specifically, the `automation track-event` subcommand reads, modifies, and writes in a single synchronous operation. Since Node.js is single-threaded within a process, concurrent calls from the same process cannot race. Cross-process races (unlikely in practice -- only one Claude session runs per project) are mitigated by the rename-based atomic write.

**Warning signs:** Stats counters that don't add up (fires + skips < expected invocations).

### Pitfall 2: Per-Feature Override Validating Against Wrong Feature Names

**What goes wrong:** User sets `automation.overrides.signal-collection: 3` (hyphenated) but the feature's config_key is `signal_collection` (underscored). The override is silently ignored because the key doesn't match.

**Why it happens:** Feature names in the manifest use underscores (config_key convention), but users might use hyphens (URL/CLI convention).

**How to avoid:** The `resolve-level` subcommand should normalize feature names (replace hyphens with underscores) before lookup. Validation should warn if an override key doesn't match any known feature config_key. Add a `manifest validate` check for automation.overrides keys.

**Warning signs:** Override set but effective level equals global level.

### Pitfall 3: Context Threshold Triggering Too Early or Too Late

**What goes wrong:** `automation.context_threshold_pct` defaults to 60, meaning level-3 features downgrade to nudge when 60% of context is consumed. But the statusline already shows that 50% is the "DEGRADING" threshold. If the automation threshold is below the quality degradation point, features downgrade before quality is actually at risk. If above, they may fire when quality is already degraded.

**Why it happens:** The context threshold for automation deferral and the quality curve thresholds are set independently.

**How to avoid:** Align the default with the documented quality curve. The agent-protocol Section 11 defines: 50-70% = DEGRADING, 70%+ = POOR. A default of 60% (mid-DEGRADING) is reasonable -- it preserves remaining context for the primary work while catching the transition into quality degradation. Document the relationship: "Automation defers at 60% to preserve context for primary work during the DEGRADING zone (50-70%)."

**Warning signs:** Features deferring when context usage is low (threshold too aggressive) or features firing when context is nearly exhausted (threshold too lenient).

### Pitfall 4: Statistics Bloat Over Long Projects

**What goes wrong:** The `automation.stats` section grows with every tracked event. Over 50+ phases, if per-feature stats include arrays of skip reasons or timestamps, the config.json becomes unwieldy.

**Why it happens:** No pruning mechanism for statistics data.

**How to avoid:** Keep stats as simple counters (fires: N, skips: N) plus single last_triggered and last_skip_reason fields. Do NOT store arrays of events. The requirement (AUTO-06) specifies "lightweight counters" -- honor that by keeping it to 4 fields per feature. If detailed event history is needed in the future (META milestone), it goes in a separate file.

**Warning signs:** Config.json growing beyond 100 lines from stats alone.

### Pitfall 5: Effective Level Computation Not Consistent Between Statusline and Workflow

**What goes wrong:** The statusline computes a simplified effective level (runtime cap only), while the workflow computes the full effective level (runtime cap + context deferral + per-feature override). The user sees "Auto:3" in the statusline but the workflow says "effective: 1 (context deferred)." This is technically correct but confusing.

**Why it happens:** The statusline hook lacks access to context usage data (it runs in a separate Node.js process). Only the workflow context has access to the LLM's context window state.

**How to avoid:** Document explicitly: "Statusline shows configured level and runtime cap. Context-aware deferral is reported inline during workflow execution." Do not attempt to make the statusline show context-deferred levels -- the data is not available to the hook process.

**Warning signs:** User confusion about why the statusline says "Auto:3" but automation didn't fire.

## Code Examples

### Level Resolution Subcommand Usage

```bash
# Basic level check
node gsd-tools.js automation resolve-level signal_collection
# Output: {"feature":"signal_collection","configured":1,"override":null,"effective":1,"reasons":[]}

# With per-feature override
# (config: automation.level=1, automation.overrides.signal_collection=3)
node gsd-tools.js automation resolve-level signal_collection
# Output: {"feature":"signal_collection","configured":1,"override":3,"effective":3,"reasons":["override: signal_collection=3"]}

# With context deferral (called from workflow with context info)
node gsd-tools.js automation resolve-level signal_collection --context-pct 75
# Output: {"feature":"signal_collection","configured":1,"override":3,"effective":1,"reasons":["override: signal_collection=3","context_deferred: 75% > 60% threshold"]}
```

### Statistics Tracking Subcommand Usage

```bash
# Record a fire event
node gsd-tools.js automation track-event signal_collection fire
# Output: {"feature":"signal_collection","event":"fire","stats":{"fires":1,"skips":0,"last_triggered":"2026-03-03T12:00:00Z","last_skip_reason":null}}

# Record a skip event with reason
node gsd-tools.js automation track-event signal_collection skip "context_exceeded"
# Output: {"feature":"signal_collection","event":"skip","stats":{"fires":0,"skips":1,"last_triggered":null,"last_skip_reason":"context_exceeded"}}
```

### Workflow Consumption Pattern

```markdown
<step name="check_automation_level">
Before auto-collecting signals, check the automation level:

```bash
LEVEL_JSON=$(node ~/.claude/get-shit-done/bin/gsd-tools.js automation resolve-level signal_collection --context-pct ${CONTEXT_USED_PCT})
EFFECTIVE=$(echo "$LEVEL_JSON" | node -e "process.stdin.on('data',d=>console.log(JSON.parse(d).effective))")
```

| Effective Level | Behavior |
|-----------------|----------|
| 0 (manual) | Skip. User must invoke /gsd:collect-signals explicitly |
| 1 (nudge) | Display: "Signal collection available. Run /gsd:collect-signals {phase}" |
| 2 (prompt) | Ask: "Phase complete. Collect signals now? (y/n)" |
| 3 (auto) | Auto-trigger signal collection without asking |

```bash
# After decision:
node ~/.claude/get-shit-done/bin/gsd-tools.js automation track-event signal_collection fire
# OR
node ~/.claude/get-shit-done/bin/gsd-tools.js automation track-event signal_collection skip "level_below_threshold"
```
</step>
```

### Feature Manifest Entry

```json
{
  "automation": {
    "scope": "project",
    "introduced": "1.17.0",
    "config_key": "automation",
    "schema": {
      "level": {
        "type": "number",
        "enum": [0, 1, 2, 3],
        "default": 1,
        "description": "Global automation level: 0=manual, 1=nudge, 2=prompt, 3=auto"
      },
      "overrides": {
        "type": "object",
        "default": {},
        "description": "Per-feature level overrides (e.g., {signal_collection: 3})"
      },
      "context_threshold_pct": {
        "type": "number",
        "default": 60,
        "min": 20,
        "max": 90,
        "description": "Context usage % above which level-3 features downgrade to nudge"
      },
      "stats": {
        "type": "object",
        "default": {},
        "description": "Automation statistics per feature (fires, skips, timestamps)"
      }
    },
    "init_prompts": [
      {
        "field": "level",
        "question": "What automation level do you want?",
        "options": [
          { "value": 0, "label": "Manual (everything requires explicit commands)" },
          { "value": 1, "label": "Nudge (statusline indicators and suggestions) [default]" },
          { "value": 2, "label": "Prompt (system asks before auto-triggering)" },
          { "value": 3, "label": "Auto (system auto-triggers with thresholds)" }
        ]
      }
    ]
  }
}
```

### Fine-Grained Knobs (AUTO-03) Within Automation Section

```json
{
  "automation": {
    "level": 2,
    "overrides": { "signal_collection": 3 },
    "context_threshold_pct": 60,
    "signal_collection": {
      "auto_collect": true,
      "context_threshold_pct": 65
    },
    "reflection": {
      "auto_reflect": false,
      "threshold_phases": 3,
      "min_signals": 5,
      "max_per_session": 1
    },
    "health_check": {
      "session_dedup_hours": 4
    }
  }
}
```

Fine-grained knobs are nested under `automation.<feature>`. They are configurable REGARDLESS of the automation level. Example: `automation.reflection.threshold_phases: 5` sets the reflection interval to 5 phases whether the level is 2 (prompt) or 3 (auto). The level controls WHETHER to trigger; the knobs control HOW to trigger.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Scattered booleans (`auto_collect: true`, `auto_reflect: false`) | Unified level system with per-feature overrides | v1.17 (this phase) | Single control surface replaces N boolean toggles |
| No context awareness for automation | Context-aware deferral (level 3 -> nudge when context scarce) | v1.17 (this phase) | Automation respects the quality curve |
| No runtime awareness for configured level | Effective level shown in statusline | v1.17 (this phase) | Users see what's actually achievable |
| No automation observability | Per-feature statistics (fires, skips, reasons, timestamps) | v1.17 (this phase) | Seeds data for META milestone effectiveness analysis |

**Deprecated/outdated:**
- The v1.17 STACK.md research proposed `auto_collect` and `auto_reflect` as standalone booleans in `signal_collection` and `signal_lifecycle` config sections. Phase 37 supersedes this: those booleans become derivable from `automation.level >= 3` (or overrides). Fine-grained knobs (thresholds, intervals) remain as nested config under `automation.<feature>`.

## Open Questions

1. **Per-feature knob namespace: under automation or under feature?**
   - What we know: Fine-grained knobs like `threshold_phases` are feature-specific. They could live under `automation.reflection.threshold_phases` or under `signal_lifecycle.auto_reflect_threshold`.
   - What's unclear: Whether duplicating knobs across both namespaces causes confusion.
   - Recommendation: Place all automation-related knobs under `automation.<feature>.*`. The existing feature config sections (signal_collection, signal_lifecycle, health_check) keep their non-automation settings (sensors, lifecycle_strictness, stale_threshold_days). Automation-specific knobs (auto_collect, auto_reflect, threshold_phases) migrate to `automation.<feature>.*`. This creates a clean separation: feature config = what the feature does; automation config = when/how it triggers.

2. **Statistics persistence location: config.json or separate file?**
   - What we know: AUTO-06 says "persisted in config." Stats are lightweight counters.
   - What's unclear: Whether frequent stat writes (potentially every phase) cause issues with config.json versioning (noisy git diffs).
   - Recommendation: Persist in config.json as specified. Add `automation.stats` to `.gitignore` pattern -- wait, config.json is tracked. Alternative: persist stats in a separate `.planning/.automation-stats.json` that IS gitignored. Defer to planner's discretion; both approaches work. If stats are in config.json, the `last_triggered` timestamps will create noisy diffs but provide a full audit trail.

3. **Default automation level: 0 or 1?**
   - What we know: The requirements say "users can configure." The deliberation suggests starting conservative.
   - What's unclear: Whether new projects should default to manual (0, fully opt-in) or nudge (1, passive indicators).
   - Recommendation: Default to 1 (nudge). Nudge is non-invasive (statusline indicators only) and provides value without consuming context. Users who want automation opt up to 2 or 3. Users who want silence opt down to 0.

4. **How does resolve-level detect runtime capabilities?**
   - What we know: The capability matrix documents which runtimes have hooks. But at runtime, gsd-tools.js doesn't know which AI runtime is executing.
   - What's unclear: How to detect whether hooks are available from within a gsd-tools.js subcommand.
   - Recommendation: Check for `.claude/settings.json` hooks section as a proxy. If hooks are configured, assume hook-capable runtime. Alternatively, accept `--runtime` flag from the calling workflow (the LLM agent knows its own runtime). The second approach is more reliable; the first is a reasonable heuristic.

## Sources

### Primary (HIGH confidence)
- `/Users/rookslog/Development/get-shit-done-reflect/get-shit-done/feature-manifest.json` -- existing config schema pattern for all features (health_check, devops, release, signal_lifecycle, signal_collection, spike)
- `/Users/rookslog/Development/get-shit-done-reflect/get-shit-done/bin/gsd-tools.js` -- existing loadConfig(), cmdConfigSet(), cmdManifestDiffConfig(), cmdManifestValidate(), KNOWN_TOP_LEVEL_KEYS; all functions read directly from source
- `/Users/rookslog/Development/get-shit-done-reflect/hooks/gsd-statusline.js` -- existing statusline implementation; context_window.remaining_percentage parsing, devTag/gsdUpdate indicator patterns
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/config.json` -- current project config structure (no automation section exists yet)
- `/Users/rookslog/Development/get-shit-done-reflect/get-shit-done/references/capability-matrix.md` -- runtime capability matrix: hooks available on Claude Code + Gemini CLI, missing on OpenCode + Codex CLI
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/deliberations/v1.17-plus-roadmap-deliberation.md` -- design decisions: unified automation level system (0-3), mode vs level orthogonality, per-feature overrides, context-aware deferral, runtime-aware effective levels
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/REQUIREMENTS.md` -- AUTO-01 through AUTO-07 with full motivation citations

### Secondary (MEDIUM confidence)
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/research/STACK.md` -- v1.17 stack research; proposed auto_collect/auto_reflect booleans now superseded by level system
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/research/ARCHITECTURE.md` -- automation loop data flow; hook vs workflow boundary; config-guarded feature pattern
- `/Users/rookslog/Development/get-shit-done-reflect/.planning/research/PITFALLS.md` -- context bloat from auto-artifacts (Pitfall 6), hook cross-runtime degradation (Pitfall 4); relevant to AUTO-04 and AUTO-05 design

### Tertiary (LOW confidence)
- Training data knowledge on config management patterns -- validated against existing gsd-tools.js implementation

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| les-2026-03-02-context-bloat-requires-progressive-disclosure | lesson | Context-intensive operations should use progressive disclosure and token budgets | AUTO-04 context threshold design; statistics kept lightweight per recommendation |
| les-2026-02-16-dynamic-path-resolution-for-install-context | lesson | All path references must resolve dynamically based on install context | resolve-level subcommand respects both local and global install paths |

Checked knowledge base (`~/.gsd/knowledge/index.md`): 97 entries scanned. 2 relevant lessons applied above. No relevant spikes (spk-2026-03-01-claude-code-session-log-location is about log file locations, not automation config). No relevant signals beyond those already cited in requirements motivations.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all technologies are existing codebase components (gsd-tools.js, feature-manifest.json, config.json, gsd-statusline.js); zero new dependencies
- Architecture: HIGH -- level resolution chain, config schema, and statusline display patterns are straightforward extensions of existing patterns verified by reading source code
- Pitfalls: HIGH -- race conditions, namespace confusion, threshold alignment are grounded in existing codebase patterns and documented quality curve

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (30 days -- stable domain, internal infrastructure)
