# Phase 32: Multi-Sensor Orchestrator - Research

**Researched:** 2026-02-28
**Domain:** Multi-agent orchestration, git log analysis, signal deduplication, feature manifest extension
**Confidence:** HIGH

## Summary

Phase 32 transforms the current single-agent signal collection into a multi-sensor orchestrator. The existing `gsd-signal-collector` agent becomes the "artifact sensor" extracted into a standalone sensor agent, a new "git sensor" analyzes commit patterns (fix-fix-fix chains, file churn, scope creep), a "signal synthesizer" merges outputs from all sensors with cross-sensor deduplication and epistemic rigor enforcement, and a "log sensor" ships as a disabled stub. The orchestrator is the `collect-signals.md` workflow, refactored to spawn sensors in parallel via Task() with `run_in_background=true`, then spawn the synthesizer to merge their outputs.

The codebase already has a well-proven pattern for this architecture: the `map-codebase.md` workflow spawns 4 parallel `gsd-codebase-mapper` agents via Task() with `run_in_background=true`, collects their confirmations, and writes a summary. Phase 32 follows this exact pattern but with a critical addition: sensors write intermediate output to a staging area (not directly to KB), and only the synthesizer writes to the KB. This single-writer constraint is essential for deduplication, cap enforcement, trace filtering, and epistemic rigor enforcement.

The git sensor implementation uses standard `git log` commands with `--format` flags to detect three patterns: (1) fix-fix-fix chains (3+ consecutive fix commits), (2) file churn (files modified in 5+ of the last N commits), and (3) scope creep (plans that touch significantly more files than declared). The existing repo has 1302 commits with real instances of all three patterns, providing live test data. The feature manifest already has a `signal_lifecycle` section; a new `signal_collection` section with per-sensor `enabled`/`model` fields provides configuration.

**Primary recommendation:** Follow the map-codebase parallel Task() pattern. Sensors write raw signal candidates to a JSON staging format (not directly to KB). The synthesizer is the sole KB writer -- it deduplicates across sensors, enforces epistemic rigor (Phase 31 schema), filters traces, applies per-phase caps, and writes qualifying signals to `~/.gsd/knowledge/signals/`.

## Standard Stack

### Core

| Component | Type | Purpose | Why Standard |
|-----------|------|---------|--------------|
| `collect-signals.md` (workflow) | Workflow refactor | Orchestrator: spawns sensors in parallel, then synthesizer | Existing workflow, refactored from single-agent to multi-sensor |
| `gsd-artifact-sensor.md` | Agent spec | Extracted from existing `gsd-signal-collector.md` | Direct extraction, minimal logic change |
| `gsd-git-sensor.md` | Agent spec | New sensor: git log pattern detection | Uses only `git log`, no external dependencies |
| `gsd-signal-synthesizer.md` | Agent spec | Single KB writer: dedup, rigor, cap, write | New agent, enforces Phase 31 schema |
| `gsd-log-sensor.md` | Agent spec (stub) | Disabled placeholder for future log analysis | Ships disabled, documents spike question |
| `feature-manifest.json` | Config schema | Per-sensor enabled/model configuration | Existing extensibility point |

### Supporting

| Component | Type | Purpose | When to Use |
|-----------|------|---------|-------------|
| `kb-templates/signal.md` | Template | Signal creation template (Phase 31) | Synthesizer uses when writing signals |
| `signal-detection.md` | Reference | Detection rules consumed by artifact sensor | Already exists, artifact sensor reads it |
| `kb-rebuild-index.sh` | Script | Index rebuild after signal writes | Synthesizer calls after all writes |
| `gsd-tools.js frontmatter validate` | CLI command | Schema validation for signals | Synthesizer validates before writing |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| JSON staging format | Temp signal files in staging dir | JSON is simpler to pass via Task() prompt return; temp files risk orphaning |
| Single synthesizer | Each sensor writes to KB independently | Independent writes break deduplication, risk duplicates across sensors |
| Per-sensor Task() agents | Single monolithic agent | Monolithic loses parallelism and fresh-context benefits |

**No npm install needed.** All components are agent specs (markdown) and configuration (JSON). The git sensor uses only `git log` commands available in any git repo. No external dependencies.

## Architecture Patterns

### Recommended Agent/File Structure

```
agents/
  gsd-artifact-sensor.md       # Extracted from gsd-signal-collector.md
  gsd-git-sensor.md             # New: git pattern detection
  gsd-signal-synthesizer.md     # New: single KB writer
  gsd-log-sensor.md             # New: disabled stub

get-shit-done/
  workflows/
    collect-signals.md           # Refactored: multi-sensor orchestrator
  feature-manifest.json          # Extended: signal_collection config
  references/
    signal-detection.md          # Unchanged (consumed by artifact sensor)

commands/gsd/
  collect-signals.md             # Minimal changes: delegates to workflow
```

### Pattern 1: Parallel Sensor Orchestration (map-codebase pattern)

**What:** The workflow spawns multiple sensor agents in parallel via Task() with `run_in_background=true`, collects their structured outputs, then spawns a synthesizer agent with the merged raw signals.

**When to use:** Whenever multiple independent analysis passes need to run, and their outputs need to be merged before final action.

**Data flow:**
```
/gsd:collect-signals {phase}
  |
  v
collect-signals.md (orchestrator workflow)
  |
  |-- [parallel] Task(artifact-sensor) --> JSON: raw signal candidates
  |-- [parallel] Task(git-sensor)      --> JSON: raw signal candidates
  |-- [parallel] Task(log-sensor)      --> JSON: [] (disabled stub)
  |
  v
  Collect all sensor outputs
  |
  v
  Task(signal-synthesizer)
    Input: merged raw signals from all sensors + existing KB index
    Output: deduplicated, rigor-enforced signals written to KB
  |
  v
  Present results to user
```

**Key constraint:** Sensors do NOT write to the KB. Only the synthesizer writes. This is the "single-writer" principle.

### Pattern 2: Sensor Output Format (Raw Signal Candidates)

**What:** Each sensor returns a structured JSON array of raw signal candidates in its Task() response. The orchestrator collects these and passes them to the synthesizer.

**Format:**
```json
{
  "sensor": "artifact",
  "phase": 31,
  "signals": [
    {
      "summary": "3 auto-fixes in plan 31-03",
      "signal_type": "deviation",
      "signal_category": "negative",
      "severity": "notable",
      "tags": ["deviation", "auto-fix", "plan-accuracy"],
      "evidence": {
        "supporting": ["SUMMARY.md shows 3 auto-fix entries in Deviations section"],
        "counter": ["Auto-fixes may indicate plan flexibility rather than plan quality issue"]
      },
      "confidence": "medium",
      "confidence_basis": "Auto-fix count extracted from SUMMARY.md parsing, threshold per signal-detection.md",
      "context": {
        "phase": 31,
        "plan": 3,
        "source_file": ".planning/phases/31-signal-schema-foundation/31-03-SUMMARY.md"
      }
    }
  ]
}
```

**Why JSON:** Structured, parseable by the synthesizer. Avoids the orchestrator having to parse markdown from sensor agents. The synthesizer can compare fields across sensors for deduplication.

### Pattern 3: Cross-Sensor Deduplication

**What:** The synthesizer identifies near-duplicate signals from different sensors about the same underlying issue and merges them.

**Deduplication criteria:**
1. Same `signal_type` + 2+ overlapping tags (existing rule from signal-detection.md Section 9)
2. Same phase + plan context (signals about the same plan from artifact and git sensors)
3. Semantic overlap in summary text (synthesizer uses judgment)

**Merge strategy:**
- Keep the signal with higher confidence/more evidence
- Merge evidence arrays (supporting and counter) from both
- Use the higher severity
- Add cross-reference note in the retained signal's context

### Pattern 4: Git Sensor Detection Patterns

**What:** Three detection patterns using `git log` analysis.

**Pattern A: Fix-Fix-Fix Chains**
```bash
# Detect 3+ consecutive commits starting with "fix" (conventional commit format)
git log --oneline --format="%s" -100
# Parse for streaks of 3+ commits where subject starts with "fix"
```
Severity: `notable` (3-4 consecutive fixes), `critical` (5+ consecutive fixes)
Signal type: `deviation`
Tags: `fix-chain`, `commit-patterns`, `plan-quality`

Evidence: The current repo has real fix-fix-fix chains (verified: 4 consecutive fix commits found in recent history).

**Pattern B: File Churn**
```bash
# Files modified in 5+ of the last 50 commits
git log --name-only --format="" -50 | sort | uniq -c | sort -rn
# Filter to files with count >= churn_threshold (configurable, default 5)
```
Severity: `notable` for non-planning files with high churn
Signal type: `deviation`
Tags: `file-churn`, `hotspot`, relevant domain tags

Evidence: Current repo shows `agents/knowledge-store.md` and `get-shit-done/bin/gsd-tools.js` as high-churn files in Phase 31.

**Pattern C: Scope Creep**
```bash
# Compare files declared in PLAN.md files_modified vs actual files in commits
# Extract files_modified from plan frontmatter
# Extract actual files from git log for that plan's commits
# Delta = scope creep indicator
```
Severity: `minor` (1-2 extra files), `notable` (3+ extra files or unexpected directories)
Signal type: `deviation`
Tags: `scope-creep`, `plan-accuracy`

### Pattern 5: Feature Manifest Sensor Configuration

**What:** A new `signal_collection` section in `feature-manifest.json` for per-sensor configuration.

**Schema:**
```json
{
  "signal_collection": {
    "scope": "project",
    "introduced": "1.16.0",
    "config_key": "signal_collection",
    "schema": {
      "sensors": {
        "type": "object",
        "default": {
          "artifact": { "enabled": true, "model": "auto" },
          "git": { "enabled": true, "model": "auto" },
          "log": { "enabled": false, "model": "auto" }
        },
        "description": "Per-sensor configuration (enabled/disabled, model assignment)"
      },
      "synthesizer_model": {
        "type": "string",
        "default": "auto",
        "description": "Model for the synthesizer agent"
      },
      "per_phase_cap": {
        "type": "number",
        "default": 10,
        "description": "Maximum signals persisted per phase per project"
      }
    }
  }
}
```

**Key decision:** The `model` field for each sensor enables lightweight models (like haiku) for simple sensors and heavier models (like opus) for complex analysis. `"auto"` defers to the orchestrator's judgment based on `model_profile`.

### Anti-Patterns to Avoid

- **Each sensor writes directly to KB:** Breaks deduplication. The synthesizer is the single KB writer.
- **Passing full artifact contents through orchestrator to synthesizer:** Bloats orchestrator context. Sensors read artifacts themselves (they have Read/Bash tools). Orchestrator only passes the JSON signal candidates.
- **Git sensor using external tools:** No `gitmoji`, `git-extras`, or npm packages. Pure `git log` with format flags.
- **Synthesizer re-reading all artifacts:** The synthesizer trusts sensor outputs. It reads the KB index for dedup but does NOT re-analyze PLAN/SUMMARY files.
- **Hardcoding sensor list:** The orchestrator reads enabled sensors from config, not a hardcoded list. Adding a future metrics-sensor means adding a config entry and agent file.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Signal schema validation | Custom validation logic in synthesizer | `gsd-tools.js frontmatter validate --schema signal` | Phase 31 built tiered validation with backward_compat; reuse it |
| Deduplication matching | New matching algorithm | Existing signal-detection.md Section 9 rules (same signal_type + 2+ tag overlap) | Rules are already tested and documented |
| Index rebuild | Manual index file construction | `bash ~/.gsd/bin/kb-rebuild-index.sh` | Atomic rebuild, handles all entry types |
| Severity classification | Sensor-specific severity logic | signal-detection.md Section 6 auto-assignment rules | Sensors apply documented rules, synthesizer trusts sensor severity |
| Epistemic rigor enforcement | Custom evidence checking | Phase 31 `FRONTMATTER_SCHEMAS.signal` conditional validation | Already enforces evidence requirements by severity tier |
| Per-phase cap management | New cap algorithm | signal-detection.md Section 10 cap rules | Rules exist: max 10 per phase, lowest-severity archived if full |

**Key insight:** Phase 31 built the enforcement infrastructure (schema validation, tiered rigor, backward_compat). The synthesizer's job is to call that infrastructure, not rebuild it. The synthesizer validates each signal via `gsd-tools.js frontmatter validate --schema signal` before writing.

## Common Pitfalls

### Pitfall 1: Context Transfer Across Task() Boundaries

**What goes wrong:** The `@` syntax for file references does NOT work across Task() boundaries. Agent subagents cannot reference files via `@` -- they must receive content in the prompt or read files themselves.
**Why it happens:** Each Task() spawns a fresh context. The parent's file references don't transfer.
**How to avoid:** The existing `collect-signals.md` workflow already handles this correctly (reads artifact contents into variables before spawning). The refactored orchestrator must do the same for each sensor. However, the better pattern is to have sensors read files themselves (they have Read/Bash tools) -- pass file PATHS, not file CONTENTS.
**Warning signs:** Sensor agent outputs are empty or reference missing files.

### Pitfall 2: Orchestrator Context Bloat

**What goes wrong:** If the orchestrator collects full signal details from all sensors, its context fills up before reaching the synthesizer spawn.
**Why it happens:** Each sensor may produce 5-10 signal candidates with evidence text. 3 sensors x 10 signals = significant text.
**How to avoid:** Sensors return structured JSON summaries (not full markdown signal files). The orchestrator passes these JSON arrays to the synthesizer. Signal files are only created by the synthesizer at write time.
**Warning signs:** Orchestrator context exceeds 30% before spawning synthesizer.

### Pitfall 3: Git Sensor False Positives

**What goes wrong:** The git sensor flags normal development patterns as problems (e.g., multiple fix commits during a planned refactoring phase, high churn on STATE.md which is expected).
**Why it happens:** Naive pattern matching without contextual filtering.
**How to avoid:**
- Exclude planning files (.planning/*, STATE.md, ROADMAP.md) from churn analysis
- Scope git analysis to the specified phase's commit range, not entire history
- Fix-fix-fix detection should consider commit scope (all fixes to same file vs different areas)
- Use the phase number to find commits between phase start/end markers
**Warning signs:** Every phase generates 5+ git sensor signals, most of which are noise.

### Pitfall 4: Dual-Directory Agent File Placement

**What goes wrong:** New agent specs created in `.claude/agents/` instead of `agents/` (the npm source directory).
**Why it happens:** This is the exact bug documented in CLAUDE.md from Phase 22 -- went undetected for 23 days.
**How to avoid:** ALL new agent files go in `agents/` (npm source). Run `node bin/install.js --local` after creating them to update `.claude/agents/`. Prior lesson [les-2026-02-16-dynamic-path-resolution-for-install-context] reinforces: always work with the source directory.
**Warning signs:** `ls agents/gsd-artifact-sensor.md` fails but `.claude/agents/gsd-artifact-sensor.md` exists.

### Pitfall 5: Trace Signal Non-Persistence Enforcement Gap

**What goes wrong:** Trace signals leak into the KB because enforcement was explicitly deferred to Phase 32 (signal-detection.md Section 6 note: "trace filtering is NOT yet enforced at the signal-collector level").
**Why it happens:** The current signal-collector was documented as emitting all signals regardless of severity. Phase 31 noted that the synthesizer (this phase) is the enforcement point.
**How to avoid:** The synthesizer MUST filter trace signals before writing. This is an explicit Phase 32 deliverable, not optional.
**Warning signs:** Trace-severity signals appear in `~/.gsd/knowledge/signals/` after a collection run.

### Pitfall 6: Sensor Agent Path References

**What goes wrong:** Sensor agent specs use `~/.claude/` paths (global prefix) in the npm source files.
**Why it happens:** Copy-paste from installed `.claude/` files. The installer's `replacePathsInContent()` converts `~/.claude/` to `./.claude/` during install, but only for recognized path patterns.
**How to avoid:** Use `~/.claude/` paths in npm source files (agents/, get-shit-done/). The installer converts them. This is the documented convention in CLAUDE.md.
**Warning signs:** Path not found errors when running from a local install.

## Code Examples

### Git Sensor: Fix-Fix-Fix Chain Detection

```bash
# Source: Verified against this repo's actual git history (1302 commits)
# Detect consecutive fix commits within a phase's commit range

# Get commits for a specific phase (between phase markers)
PHASE_COMMITS=$(git log --oneline --format="%h %s" --grep="($PHASE" --grep="($PHASE-" | head -100)

# Or use broader approach: last N commits
git log --oneline --format="%s" -100 | python3 -c "
import sys
lines = sys.stdin.readlines()
streak = 0
chain_start = 0
for i, line in enumerate(lines):
    line = line.strip()
    if line.startswith('fix'):
        streak += 1
        if streak == 1:
            chain_start = i
        if streak >= 3:
            print(f'FIX_CHAIN streak={streak} lines={chain_start}-{i}')
    else:
        streak = 0
"
```

### Git Sensor: File Churn Detection

```bash
# Source: Verified against this repo (shows real churn patterns)
# Files changed in 5+ of last 50 commits, excluding planning files

git log --name-only --format="" -50 \
  | grep -v '^\.planning/' \
  | grep -v '^$' \
  | sort | uniq -c | sort -rn \
  | awk '$1 >= 5 { print $1, $2 }'
```

### Orchestrator: Parallel Sensor Spawning

```
# Source: Adapted from map-codebase.md workflow (verified pattern)
# Spawn sensors in parallel, collect results

# Sensor 1: Artifact Sensor
Task(
  subagent_type="gsd-artifact-sensor",
  model="{sensor_model}",
  run_in_background=true,
  description="Collect artifact signals for phase {PHASE}",
  prompt="Analyze phase {PHASE} execution artifacts.
    Phase directory: {PHASE_DIR}
    Project name: {PROJECT_NAME}

    Read PLAN.md and SUMMARY.md files. Apply signal-detection.md rules.
    Return JSON array of raw signal candidates."
)

# Sensor 2: Git Sensor
Task(
  subagent_type="gsd-git-sensor",
  model="{sensor_model}",
  run_in_background=true,
  description="Collect git signals for phase {PHASE}",
  prompt="Analyze git history for phase {PHASE} patterns.
    Phase directory: {PHASE_DIR}
    Project name: {PROJECT_NAME}

    Detect fix-fix-fix chains, file churn, scope creep.
    Return JSON array of raw signal candidates."
)

# Wait for all sensors, collect outputs
# Then spawn synthesizer with merged signals
```

### Synthesizer: Deduplication Logic

```
# Pseudocode for cross-sensor deduplication
for each signal_a in sensor_outputs:
  for each signal_b in sensor_outputs (where b.sensor != a.sensor):
    if same_signal_type(a, b) AND tag_overlap(a, b) >= 2:
      # Near-duplicate detected
      merged = merge_signals(a, b)
      # Keep higher confidence, merge evidence arrays
      # Remove b from output, replace a with merged
```

### Feature Manifest Extension

```json
{
  "signal_collection": {
    "scope": "project",
    "introduced": "1.16.0",
    "config_key": "signal_collection",
    "schema": {
      "sensors": {
        "type": "object",
        "default": {
          "artifact": { "enabled": true, "model": "auto" },
          "git": { "enabled": true, "model": "auto" },
          "log": { "enabled": false, "model": "auto" }
        },
        "description": "Per-sensor enabled/disabled and model assignment"
      },
      "synthesizer_model": {
        "type": "string",
        "default": "auto",
        "description": "Model for the signal synthesizer agent"
      },
      "per_phase_cap": {
        "type": "number",
        "default": 10,
        "description": "Maximum persistent signals per phase per project"
      }
    },
    "init_prompts": [
      {
        "field": "_gate",
        "question": "Configure signal collection sensors?",
        "options": [
          { "value": "skip", "label": "Skip (use defaults)" },
          { "value": "configure", "label": "Configure now" }
        ],
        "skip_value": "skip"
      }
    ]
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Single signal-collector agent | Multi-sensor orchestrator with synthesizer | Phase 32 (this phase) | Extensible detection, parallel execution, cross-sensor dedup |
| Sensors write directly to KB | Single-writer synthesizer | Phase 32 (this phase) | Prevents duplicates, enforces rigor at write boundary |
| No trace filtering | Synthesizer enforces trace non-persistence | Phase 32 (this phase) | Closes enforcement gap documented in Phase 31 |
| No git analysis | Git sensor detects commit patterns | Phase 32 (this phase) | New signal source: fix chains, churn, scope creep |

**Deprecated/outdated:**
- `gsd-signal-collector.md` as the monolithic collector: Replaced by `gsd-artifact-sensor.md` (extraction) with the synthesizer handling KB writes
- Direct KB writing by the signal-collector: All KB writes now go through the synthesizer

## Open Questions

1. **How should the git sensor scope its analysis to a specific phase?**
   - What we know: Commits use conventional format with phase numbers in parentheses, e.g., `fix(31-03):`. This is greppable.
   - What's unclear: Whether to analyze only the phase's commits or a broader window for context (e.g., churn might span multiple phases).
   - Recommendation: Primary analysis scoped to phase commits (grep by phase number). Churn analysis uses a broader window (last 50-100 commits) since churn is inherently cross-phase.

2. **Should the existing `gsd-signal-collector.md` be deleted or kept as a compatibility alias?**
   - What we know: The artifact sensor is an extraction from the signal-collector. The signal-collector currently does everything the artifact sensor will do.
   - What's unclear: Whether any other workflow references `gsd-signal-collector` by name.
   - Recommendation: Keep `gsd-signal-collector.md` as a thin wrapper that says "this agent has been split into gsd-artifact-sensor and gsd-signal-synthesizer" for backward compatibility. The orchestrator workflow references the new agents directly.

3. **What is the optimal git history depth for each detection pattern?**
   - What we know: The repo has 1302 commits. Fix-fix-fix analysis is local (last 100 commits sufficient). Churn needs enough history for statistical significance.
   - What's unclear: Whether very old history provides signal or just noise.
   - Recommendation: Default depth of 100 commits for fix chains, 50 commits for churn, full phase scope for scope creep. Make depths configurable in the sensor agent spec.

4. **Where do Claude Code session logs live?**
   - What we know: The deliberation document explicitly flags this as a spike candidate ("Where does Claude Code store session logs? Needs investigation").
   - What's unclear: The log sensor is intentionally a disabled stub because this is unknown.
   - Recommendation: Ship the log sensor as disabled with a documented spike question. Do NOT attempt to implement log analysis in Phase 32. This is consistent with SENSOR-07.

## Sources

### Primary (HIGH confidence)
- **Codebase analysis:** `agents/gsd-signal-collector.md` -- current signal collector agent spec (200+ lines)
- **Codebase analysis:** `get-shit-done/workflows/collect-signals.md` -- current orchestrator workflow
- **Codebase analysis:** `get-shit-done/workflows/map-codebase.md` -- proven parallel Task() pattern
- **Codebase analysis:** `get-shit-done/feature-manifest.json` -- existing manifest schema
- **Codebase analysis:** `agents/knowledge-store.md` -- KB schema and lifecycle rules (Phase 31 updated)
- **Codebase analysis:** `get-shit-done/references/signal-detection.md` -- detection rules, severity, dedup
- **Codebase analysis:** `get-shit-done/references/reflection-patterns.md` -- pattern detection thresholds

### Secondary (MEDIUM confidence)
- **Codebase analysis:** `.planning/deliberations/v1.16-signal-lifecycle-and-beyond.md` -- architecture vision
- **Codebase analysis:** `.planning/phases/31-signal-schema-foundation/31-VERIFICATION.md` -- Phase 31 completion state
- **Git history analysis:** `git log` on this repo -- verified fix-fix-fix patterns and file churn exist

### Tertiary (LOW confidence)
- None. All findings based on codebase analysis and verified git history.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are agent specs and config, following proven patterns in this codebase
- Architecture: HIGH -- the parallel Task() pattern is battle-tested (map-codebase uses it), single-writer synthesizer is the documented Phase 32 design from the deliberation
- Pitfalls: HIGH -- pitfalls identified from actual codebase history (dual-directory bug, trace enforcement gap, context bloat)
- Git sensor detection: MEDIUM -- git log analysis patterns are straightforward but false positive tuning needs live testing

**Research date:** 2026-02-28
**Valid until:** 2026-03-28 (30 days -- stable domain, no external dependencies)

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| les-2026-02-16-dynamic-path-resolution-for-install-context | lesson | All KB/workflow paths must resolve dynamically based on install context | Common Pitfalls (Pitfall 4, 6) |

Checked knowledge base (`~/.gsd/knowledge/index.md`). One lesson relevant to path resolution (applied to pitfalls). No spikes in KB. Signal entries scanned -- several relate to extraction quality and dual-directory issues, which informed Pitfall 4. No spike deduplication applicable (0 spikes in KB).
