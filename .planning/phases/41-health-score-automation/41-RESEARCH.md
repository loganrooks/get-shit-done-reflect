# Phase 41: Health Score & Automation - Research

**Researched:** 2026-03-06
**Domain:** Health check architecture, scoring models, automation wiring, rogue file detection
**Confidence:** HIGH

## Summary

Phase 41 transforms the health check system from a simple workspace validator (v1.12, 6 categories, ~20 binary checks) into a two-dimensional scoring and automation system with 11 new requirements (HEALTH-01 through HEALTH-11). The concluded deliberation mandates a hybrid probe architecture: auto-discovered probe files in `references/health-probes/`, a separated scoring layer, thin trigger wiring in existing workflows, and graduated execution complexity (inline/subcommand/agent). The existing sensor auto-discovery pattern (Phase 38) provides a proven architectural precedent.

The implementation domain is entirely internal to the GSD Reflect codebase. No external libraries are needed. The core technical challenges are: (1) decomposing the monolithic health-check reference into individual probe files while preserving the existing check semantics, (2) implementing the two-dimensional scoring model (infrastructure binary + workflow weighted) with regime-aware metrics, (3) wiring health checks into the SessionStart hook and execute-phase workflow via the automation framework, and (4) building rogue file detection with git-log-based context extraction.

**Primary recommendation:** Follow the sensor auto-discovery precedent exactly -- each probe is a single file with YAML frontmatter contract, the workflow becomes a generic probe executor, and scoring is a separate reference document. Implement `health-probe` subcommand in gsd-tools.js for the `subcommand` execution type to keep complex computation in tested JavaScript.

<user_constraints>
## User Constraints (from Deliberation)

### Locked Decisions
- **Architecture:** Hybrid probe architecture with auto-discovered probe files in `references/health-probes/`, separated scoring layer, thin trigger wiring
- **Probe contract:** YAML frontmatter with `probe_id`, `category`, `tier`, `dimension`, `execution`, `depends_on` fields
- **Execution types:** `inline` (bash via Claude), `subcommand` (gsd-tools.js health-probe), `agent` (subagent spec)
- **Scoring model:** Two independent dimensions -- Infrastructure Health (binary: HEALTHY/DEGRADED/UNHEALTHY) and Workflow Health (continuous weighted signal accumulation)
- **Composite traffic light:** 3x3 matrix mapping (infra state x workflow level) to GREEN/YELLOW/RED
- **Weights:** critical=1.0, notable=0.3, minor=0.1 for weighted signal accumulation
- **Standing caveat:** Always displayed: "Health checks measure known categories. Absence of findings does not mean absence of problems."
- **Design principle:** Scores as attention guides, not decision gates. Thresholds are advisory, not authoritative.
- **Trigger wiring:** execute-phase.md (HEALTH-05), SessionStart hook (HEALTH-04), reactive trigger on cached score (HEALTH-06)
- **Inter-check dependencies:** `depends_on` field replaces hardcoded early termination; `blocks` field for intra-probe dependencies

### Claude's Discretion
- Specific threshold values for workflow health levels (LOW/MED/HIGH cutoffs)
- Cache file format and location for health score persistence
- Specific probe file naming convention within `references/health-probes/`
- How to handle the hook script for health check auto-triggering
- Test strategy and file organization

### Deferred Ideas (OUT OF SCOPE)
- Automated remediation triggered by health score (explicitly excluded by the advisory scoring principle)
- Deeper meta-observation of health check accuracy (deferred per HEALTH-07 design)
- Health score trend tracking over time (future work)
</user_constraints>

## Standard Stack

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| gsd-tools.js | `get-shit-done/bin/gsd-tools.js` | `health-probe` subcommand for complex computation | Tested JavaScript, same pattern as automation subcommands |
| health-probes/ | `get-shit-done/references/health-probes/` | Auto-discovered probe definition files | Mirrors sensor auto-discovery in `agents/gsd-*-sensor.md` |
| health-scoring.md | `get-shit-done/references/health-scoring.md` | Scoring model, thresholds, composite mapping | Separated concern from probe definitions |
| health-check.md workflow | `get-shit-done/workflows/health-check.md` | Generic probe executor (replaces monolith) | Existing workflow, refactored from ~240 to ~100 lines |
| statusline hook | `hooks/gsd-statusline.js` | Traffic light display in statusline | Existing hook, extended with health score |
| SessionStart hook | `hooks/gsd-health-check.js` | Session-start health check trigger | New hook, follows gsd-ci-status.js pattern |
| feature-manifest.json | `get-shit-done/feature-manifest.json` | Health check config schema | All config must be declared here |

### Supporting
| Component | Location | Purpose | When to Use |
|-----------|----------|---------|-------------|
| automation resolve-level | gsd-tools.js subcommand | Determine effective automation level for health_check feature | Before auto-triggering health checks |
| automation track-event | gsd-tools.js subcommand | Track health check fires/skips for HEALTH-07 watchdog | After every health check invocation |
| automation regime-change | gsd-tools.js subcommand | Query regime boundaries for HEALTH-08/09 | During workflow health computation |
| cache directory | `~/.claude/cache/` | Persist health score between sessions | SessionStart hook reads cached score for reactive trigger |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Probe files with YAML frontmatter | JSON probe definitions | YAML is consistent with sensor contract; JSON would be parseable by gsd-tools but inconsistent with existing patterns |
| Separate health-scoring.md reference | Scoring logic in gsd-tools.js | Reference doc keeps scoring visible and editable; JS would be tested but less accessible |
| SessionStart hook for health check | Workflow postlude only | Hook enables session-start and reactive triggers; postlude-only would miss HEALTH-04/06 |

## Architecture Patterns

### Recommended Project Structure
```
get-shit-done/
  references/
    health-probes/             # Auto-discovered probe files
      kb-integrity.md          # dimension: infrastructure, execution: inline
      config-validity.md       # dimension: infrastructure, execution: inline
      stale-artifacts.md       # dimension: infrastructure, execution: inline
      signal-lifecycle.md      # dimension: infrastructure, execution: inline
      planning-consistency.md  # dimension: infrastructure, execution: inline, tier: full
      config-drift.md          # dimension: infrastructure, execution: inline, tier: full
      signal-metrics.md        # dimension: workflow, execution: subcommand
      signal-density.md        # dimension: workflow, execution: subcommand
      automation-watchdog.md   # dimension: infrastructure, execution: subcommand
      rogue-files.md           # dimension: infrastructure, execution: inline (detection)
      rogue-context.md         # dimension: workflow, execution: agent (categorization)
    health-scoring.md          # Scoring model, thresholds, composite mapping, cache format
    health-check.md            # RETAINED but reduced: just the output format and repair rules
  workflows/
    health-check.md            # Refactored: generic probe executor
hooks/
  gsd-health-check.js          # SessionStart hook for auto-trigger
  gsd-statusline.js            # Extended with health traffic light
```

### Pattern 1: Probe Auto-Discovery
**What:** The health check workflow discovers probes by scanning `references/health-probes/*.md` files, parsing their YAML frontmatter, and executing them in dependency order.
**When to use:** Every time the health check runs (manual, session-start, per-phase).
**Example:**
```javascript
// Probe discovery in workflow (pseudocode for the executing agent)
// 1. List all .md files in references/health-probes/
// 2. Parse YAML frontmatter from each
// 3. Filter by tier (default vs full based on --full flag)
// 4. Filter by focus mode (--focus kb → only probes with matching category)
// 5. Topological sort by depends_on
// 6. Execute in order, skipping dependents of failed probes
```

### Pattern 2: Graduated Execution
**What:** Probes declare their execution type in frontmatter. The workflow adapts execution strategy per-type.
**When to use:** During probe execution within the health check workflow.
**Example:**
```markdown
<!-- Probe file: kb-integrity.md -->
---
probe_id: kb-integrity
category: KB Integrity
tier: default
dimension: infrastructure
execution: inline
depends_on: []
blocks: [config-validity]  # Optional: intra-category early termination
---

## Checks

### KB-01: Index file exists
```bash
# KB path resolution
if [ -d ".planning/knowledge" ]; then KB_DIR=".planning/knowledge"
else KB_DIR="$HOME/.gsd/knowledge"; fi
test -f "$KB_DIR/index.md" && echo "PASS" || echo "FAIL"
```

### KB-02: Index is parseable
<!-- depends_on_check: KB-01 -->
```bash
grep -q "## Signals" "$KB_DIR/index.md" && \
grep -q "## Spikes" "$KB_DIR/index.md" && \
grep -q "## Lessons" "$KB_DIR/index.md" && echo "PASS" || echo "FAIL"
```
```

### Pattern 3: Scoring Layer Separation
**What:** The scoring reference (health-scoring.md) defines how probe results map to the two-dimensional score, independent of any individual probe.
**When to use:** After all probes complete, during score computation.
**Example:**
```markdown
<!-- health-scoring.md excerpt -->
## Infrastructure Score
Aggregate all probes with dimension: infrastructure
- HEALTHY: zero FAILs across all infrastructure probes
- DEGRADED: at least one WARNING, zero FAILs
- UNHEALTHY: any FAIL

## Workflow Score
Aggregate all probes with dimension: workflow
- Compute weighted_sum = sum(critical_signals * 1.0 + notable * 0.3 + minor * 0.1)
- Apply pattern deduplication before weighting
- LOW: weighted_sum < threshold_low (configurable, recommend default 2.0)
- MED: threshold_low <= weighted_sum < threshold_high
- HIGH: weighted_sum >= threshold_high (configurable, recommend default 5.0)
```

### Pattern 4: Cache File for Health Score
**What:** Health score is cached to `~/.claude/cache/gsd-health-score.json` after each check. The SessionStart hook reads this cache file to determine if reactive trigger is needed.
**When to use:** After health check completion (write) and at session start (read).
**Example:**
```json
{
  "infrastructure": "HEALTHY",
  "workflow": "LOW",
  "composite": "GREEN",
  "weighted_sum": 1.2,
  "signal_count": { "critical": 0, "notable": 4, "minor": 2 },
  "resolution_ratio": 3.2,
  "density_trend": "stable",
  "checked": 1709726400,
  "phase": 41,
  "regime_id": "regime-2026-03-06-auto-collection-enabled"
}
```

### Pattern 5: SessionStart Hook (Health Check)
**What:** A new SessionStart hook that checks cached health score age and value, triggering a health check if configured frequency is `on-resume` or if cached score is below threshold.
**When to use:** Every session start (follows gsd-ci-status.js pattern exactly).
**Example:**
```javascript
// hooks/gsd-health-check.js
// 1. Read .planning/config.json for health_check.frequency
// 2. If frequency !== 'on-resume' && frequency !== 'every-phase': exit
// 3. Read cached score from ~/.claude/cache/gsd-health-score.json
// 4. Check timestamp age (session dedup: skip if checked within threshold)
// 5. If on-resume: check if enough time elapsed since last check
// 6. If reactive (HEALTH-06): check if cached composite is YELLOW or RED
// 7. If trigger needed: write marker file that workflow reads on next invocation
// Note: Hook runs as background process, cannot invoke workflow directly
// It writes a "health-check-needed" marker that the statusline displays
```

### Pattern 6: Execute-Phase Integration (HEALTH-05)
**What:** Add a health check step to execute-phase.md workflow, after verification passes, when frequency is `every-phase`.
**When to use:** During execute-phase workflow, after `reconcile_signal_lifecycle` step and before/alongside `auto_collect_signals`.
**Example:**
```markdown
<!-- New step in execute-phase.md, after reconcile_signal_lifecycle -->
<step name="health_check_postlude">
Auto-trigger health check after phase completion when frequency is `every-phase`.

1. Check config: frequency must be 'every-phase'
2. Resolve automation level for health_check feature
3. Branch on level (same pattern as signal collection postlude)
4. If proceeding: run health check workflow inline
5. Track event via automation track-event
</step>
```

### Anti-Patterns to Avoid
- **Monolithic reference file:** Don't add new checks by appending to the existing health-check.md reference. Each check category must be its own probe file.
- **Hardcoded execution order:** Don't add category names to the workflow. The workflow discovers and sorts probes dynamically from frontmatter.
- **Score-triggered remediation:** Don't build automated fixes based on health score. Per the advisory principle, scores guide attention, they don't trigger actions.
- **Conflating regime windows:** Don't compute signal-to-resolution ratio or density trends across regime boundaries. Always filter by current regime first.
- **Hook-based workflow execution:** SessionStart hooks run as background processes and cannot invoke the full health check workflow. They write cache/markers that the statusline reads.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Automation level resolution | Custom level logic per trigger point | `gsd-tools.js automation resolve-level health_check` | Already handles global level, overrides, context deferral, runtime caps |
| Event tracking | Custom fire/skip counters | `gsd-tools.js automation track-event health_check fire/skip` | Already handles stats persistence, atomic config updates |
| Regime boundary detection | Custom KB queries for regime entries | `gsd-tools.js automation regime-change` queries + grep for `type: regime_change` in KB signals | Regime entries already have standardized format from Phase 40 |
| Reentrancy protection | Custom lock files | `gsd-tools.js automation lock/unlock/check-lock health_check` | Already handles TTL-based stale lock detection |
| Background process spawning in hooks | Custom async patterns | `child_process.spawn` with `detached: true, unref()` | Proven pattern in gsd-ci-status.js and gsd-check-update.js |

**Key insight:** The automation framework (Phase 37) and signal collection (Phase 40) already provide all the infrastructure needed for health check auto-triggering. The health check feature should wire into these existing subcommands, not rebuild them.

## Common Pitfalls

### Pitfall 1: Probe File Parse Errors Breaking All Checks
**What goes wrong:** A malformed YAML frontmatter in one probe file crashes the entire health check workflow.
**Why it happens:** Auto-discovery means the workflow parses whatever files are in the directory.
**How to avoid:** Wrap probe file parsing in try/catch. If a probe fails to parse, report it as a WARNING finding and skip that probe. Never let one probe file take down the whole system.
**Warning signs:** Health check produces no output at all (rather than partial results).

### Pitfall 2: Circular depends_on
**What goes wrong:** Two probes depend on each other, creating an infinite loop or deadlock in the topological sort.
**Why it happens:** Manual editing of probe frontmatter without validating the dependency graph.
**How to avoid:** Validate the dependency graph before execution. If a cycle is detected, report it as a FAIL finding and skip the cycle. Use standard topological sort (Kahn's algorithm).
**Warning signs:** Health check hangs or takes unusually long.

### Pitfall 3: Regime Boundary Not Found
**What goes wrong:** HEALTH-08 and HEALTH-09 look for regime_change entries in the KB but find none (no auto-collection regime change recorded yet).
**Why it happens:** On first run or in projects that haven't enabled auto-collection.
**How to avoid:** Treat "no regime boundary found" as "all history is one regime." Compute metrics across the full signal history. Only split by regime when regime_change entries actually exist.
**Warning signs:** Signal metrics report zero signals despite non-empty KB.

### Pitfall 4: Health Check Hook Blocking Session Start
**What goes wrong:** SessionStart hook takes too long, blocking Claude Code session initialization.
**Why it happens:** The hook tries to run the full health check synchronously.
**How to avoid:** The SessionStart hook ONLY reads the cached score file (fast I/O). It writes a marker file. The actual health check runs later. Follow the gsd-ci-status.js pattern: spawn a background process that writes a cache file. The statusline reads the cache file.
**Warning signs:** Session start takes >5 seconds.

### Pitfall 5: Double-Fire in Track-Event
**What goes wrong:** Track-event is called twice, incrementing counters incorrectly.
**Why it happens:** Copy-paste from signal collection postlude without understanding the flow. The signal collection postlude had this exact bug caught in sig-2026-03-05-phase40-plan-gaps-pre-execution-review.
**How to avoid:** Call track-event exactly once per health check invocation. Parse the returned stats from that single call.
**Warning signs:** `fires` count in automation stats is double the actual invocation count.

### Pitfall 6: Stale Cache Causing False GREEN
**What goes wrong:** Cached health score shows GREEN, but workspace has degraded since the cache was written.
**Why it happens:** No cache invalidation when workspace state changes between sessions.
**How to avoid:** Include a `checked` timestamp in the cache. The SessionStart hook compares this against a staleness threshold (e.g., 24 hours). Stale cache triggers a fresh check rather than displaying stale data.
**Warning signs:** User sees GREEN in statusline but health-check --full reveals problems.

### Pitfall 7: Rogue File Detection Flagging Legitimate Files
**What goes wrong:** Health check reports legitimate files as rogue (false positives).
**Why it happens:** The expected pattern registry is incomplete or too restrictive.
**How to avoid:** Start with a generous allowlist of known patterns. Use the known `.planning/` structure: top-level files (STATE.md, ROADMAP.md, etc.), known directories (phases/, deliberations/, knowledge/, etc.), and known file patterns within directories. Log false positives and expand the allowlist over time. The `blocks` field in the rogue-files probe ensures this probe runs only after all infrastructure probes pass.
**Warning signs:** Every health check reports rogue files that are actually legitimate.

## Code Examples

### Probe File Format (Inline Execution)
```markdown
<!-- Source: Deliberation decision + sensor contract analogy -->
---
probe_id: config-validity
category: Config Validity
tier: default
dimension: infrastructure
execution: inline
depends_on: []
---

## Checks

### CFG-01: Config file exists
```bash
test -f ".planning/config.json" && echo "PASS" || echo "FAIL"
```
**blocks:** [CFG-02, CFG-03, CFG-04, CFG-05, CFG-06]

### CFG-02: JSON is parseable
```bash
node -e "JSON.parse(require('fs').readFileSync('.planning/config.json','utf8'))" 2>/dev/null && echo "PASS" || echo "FAIL"
```
**blocks:** [CFG-03, CFG-04, CFG-05, CFG-06]

### CFG-03: Required fields present
```bash
for field in mode depth; do
  node -e "const c=JSON.parse(require('fs').readFileSync('.planning/config.json','utf8')); if(!c.$field) process.exit(1)" 2>/dev/null && echo "PASS: $field" || echo "FAIL: $field missing"
done
```
```

### Health-Probe Subcommand Output Format
```javascript
// gsd-tools.js health-probe signal-metrics --raw
// Returns JSON for the workflow to consume
{
  "probe_id": "signal-metrics",
  "checks": [
    {
      "id": "SIG-RATIO-01",
      "description": "Signal-to-resolution ratio",
      "status": "WARNING",
      "detail": "Ratio 7.3:1 exceeds threshold 5:1",
      "data": { "detected": 22, "resolved": 3, "ratio": 7.33, "regime": "regime-2026-03-06-auto-collection-enabled" }
    }
  ],
  "dimension_contribution": {
    "type": "workflow",
    "weighted_sum_delta": 2.1,
    "signals": { "critical": 0, "notable": 7, "minor": 0 }
  }
}
```

### Statusline Health Traffic Light
```javascript
// Addition to hooks/gsd-statusline.js
// Read cached health score
let healthTag = '';
const healthCacheFile = path.join(homeDir, '.claude', 'cache', 'gsd-health-score.json');
if (fs.existsSync(healthCacheFile)) {
  try {
    const healthCache = JSON.parse(fs.readFileSync(healthCacheFile, 'utf8'));
    const age = Math.floor(Date.now() / 1000) - (healthCache.checked || 0);
    if (age < 86400) { // Less than 24 hours old
      const color = healthCache.composite === 'GREEN' ? '32'
        : healthCache.composite === 'YELLOW' ? '33' : '31';
      const symbol = healthCache.composite === 'GREEN' ? 'H'
        : healthCache.composite === 'YELLOW' ? 'H!' : 'H!!';
      healthTag = `\x1b[${color}m${symbol}\x1b[0m | `;
    }
  } catch (e) {}
}
```

### Regime-Aware Signal Metrics Computation
```javascript
// gsd-tools.js health-probe signal-metrics (pseudocode)
function computeSignalMetrics(kbDir, config) {
  // 1. Find the latest regime_change entry
  const regimeEntries = findEntriesByType(kbDir, 'regime_change');
  const latestRegime = regimeEntries.sort((a, b) => b.created - a.created)[0];
  const regimeStart = latestRegime ? new Date(latestRegime.created) : new Date(0);

  // 2. Count signals within current regime
  const allSignals = findEntriesByType(kbDir, 'signal');
  const regimeSignals = allSignals.filter(s => new Date(s.created) >= regimeStart);

  // 3. Compute resolution ratio (HEALTH-08)
  const detected = regimeSignals.filter(s =>
    s.lifecycle === 'detected' || s.lifecycle === 'triaged');
  const resolved = regimeSignals.filter(s =>
    ['remediated', 'verified', 'closed'].includes(s.lifecycle));
  const ratio = resolved.length > 0
    ? detected.length / resolved.length
    : detected.length > 0 ? Infinity : 0;

  // 4. Compute density trend (HEALTH-09)
  // Group signals by phase, compute signals-per-phase, check for upward trend
  const byPhase = groupByPhase(regimeSignals);
  const densities = Object.values(byPhase).map(g => g.length);
  const trend = computeTrend(densities); // 'increasing', 'stable', 'decreasing'

  return { ratio, trend, regimeId: latestRegime?.id, signalCount: regimeSignals.length };
}
```

### Rogue File Detection Pattern
```bash
# Expected top-level files in .planning/
EXPECTED_FILES="config.json|STATE.md|ROADMAP.md|PROJECT.md|REQUIREMENTS.md|MILESTONES.md|FORK-DIVERGENCES.md|FORK-STRATEGY.md|migration-log.md"

# Expected directories in .planning/
EXPECTED_DIRS="phases|deliberations|knowledge|milestones|codebase|research|spikes|quick|todos|debug"

# Find files that don't match expected patterns
rogue_files=()
while IFS= read -r file; do
  basename=$(basename "$file")
  # Skip if it matches expected top-level files
  echo "$basename" | grep -qE "^($EXPECTED_FILES)$" && continue
  rogue_files+=("$file")
done < <(find .planning -maxdepth 1 -type f ! -name '.*')

# Find directories that don't match expected patterns
while IFS= read -r dir; do
  dirname=$(basename "$dir")
  echo "$dirname" | grep -qE "^($EXPECTED_DIRS)$" && continue
  rogue_files+=("$dir (directory)")
done < <(find .planning -maxdepth 1 -type d ! -path .planning)

# Check for lifecycle-expired files
while IFS= read -r file; do
  rogue_files+=("$file (lifecycle-expired)")
done < <(find .planning/phases -name '.continue-here*.md' -mtime +7 2>/dev/null)
```

### Rogue File Context Extraction (HEALTH-11)
```bash
# For each rogue file, extract creation context via git log
for file in "${rogue_files[@]}"; do
  filepath=$(echo "$file" | sed 's/ (.*)//')
  # When was it created?
  created_commit=$(git log --diff-filter=A --format="%H %s" -- "$filepath" 2>/dev/null | head -1)
  # Which phase was active at that commit?
  # Categorize: agent-ignorance vs workflow-gap
done
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic reference (health-check.md, 497 lines) | Auto-discovered probe files in health-probes/ | Phase 41 (this phase) | Adding a check = one file, zero workflow edits |
| Hardcoded category execution order | Topological sort by depends_on | Phase 41 | Dynamic execution order from frontmatter |
| Single health status (pass/warn/fail per category) | Two-dimensional score (infrastructure + workflow) | Phase 41 | Richer health signal, traffic light display |
| Manual health check invocation only | Auto-trigger at session start and per-phase | Phase 41 | Continuous health awareness |
| No signal resolution tracking | Signal-to-resolution ratio with regime awareness | Phase 41 | Measures whether automation loop completes |

**Deprecated/outdated after Phase 41:**
- **health-check.md reference (497 lines):** Replaced by individual probe files. Retained in reduced form for output format and repair rules only.
- **Hardcoded early termination in workflow:** Replaced by `depends_on` and `blocks` fields in probe frontmatter.
- **Single-dimension health status:** Replaced by infrastructure + workflow two-dimensional model.

## Open Questions

### Resolved
- **How does the probe discovery order work?** Topological sort using Kahn's algorithm on the `depends_on` graph. Probes with no dependencies execute first. Probes whose dependencies failed are skipped.
- **Where does the health score cache live?** `~/.claude/cache/gsd-health-score.json`, consistent with existing `gsd-ci-status.json` and `gsd-update-check.json` cache files.
- **How does the SessionStart hook trigger a health check?** It does NOT run the health check directly. It reads the cache file, determines if a check is needed, and writes a marker. The statusline displays a "health check needed" indicator. Alternatively, it spawns a background process that runs the check and writes the cache -- same pattern as gsd-ci-status.js.
- **How do inline probes report results?** Each check within a probe outputs `PASS`, `WARNING`, or `FAIL` with optional detail text. The workflow agent parses this output.
- **What happens to existing health check command and flags?** They are preserved. `--full`, `--focus`, `--fix`, `--stale-days` all continue to work. The workflow is refactored to use probe discovery internally but the external interface is unchanged.
- **Where does HEALTH-07 (automation watchdog) get its data?** From `automation.stats` in config.json. Each feature's `last_triggered` timestamp and `fires` count are already tracked by `track-event`. The watchdog probe compares `last_triggered` against expected cadence (e.g., if frequency is `every-phase` and last_triggered was 5 phases ago, that is a finding).

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| What are the right default thresholds for workflow health LOW/MED/HIGH? | Medium | Start with LOW < 2.0, MED < 5.0, HIGH >= 5.0 (weighted sum). Accept P4 prediction that these will need adjustment within first 2 phases. Make configurable via health_check config. |
| Should the SessionStart hook run the health check in background or just display a nudge? | Medium | Recommend background execution (writes cache), consistent with CI status hook. The nudge approach is simpler but less useful. Claude's discretion. |
| How should pattern deduplication work for HEALTH-02? | Medium | Deduplicate by tag-similarity before weighting. Two signals with identical tags are counted once. This prevents correlated signals from inflating the score. Exact dedup algorithm is implementation detail. |
| What constitutes the "expected cadence" for HEALTH-07 watchdog? | Low | Derive from frequency config: `every-phase` = 1 phase, `on-resume` = 1 session, `milestone-only` = 1 milestone. If last_triggered exceeds 3x the expected cadence, flag as stale. Accept-risk on the multiplier. |

### Still Open
- The exact format and fields within probe files for intra-check `blocks` dependencies (KB-01 blocks KB-02 through KB-06). This is an implementation detail the planner should specify -- the deliberation establishes the pattern but not the exact syntax.

## Feature Manifest Changes

The health_check feature in `feature-manifest.json` needs expansion to support the new scoring and auto-trigger configuration. New fields needed:

```json
{
  "health_check": {
    "schema": {
      "frequency": { "...existing..." },
      "stale_threshold_days": { "...existing..." },
      "blocking_checks": { "...existing..." },
      "workflow_thresholds": {
        "type": "object",
        "default": { "low": 2.0, "high": 5.0 },
        "description": "Weighted sum thresholds for workflow health LOW/MED/HIGH"
      },
      "resolution_ratio_threshold": {
        "type": "number",
        "default": 5.0,
        "description": "Signal-to-resolution ratio above which a WARNING is surfaced"
      },
      "reactive_threshold": {
        "type": "string",
        "enum": ["GREEN", "YELLOW", "RED", "disabled"],
        "default": "RED",
        "description": "Composite score below which reactive session-start trigger fires (HEALTH-06)"
      },
      "cache_staleness_hours": {
        "type": "number",
        "default": 24,
        "description": "Hours after which cached health score is considered stale"
      }
    }
  }
}
```

## Existing Check Migration Map

The 20+ existing checks must be migrated into probe files. Here is the mapping:

| Existing Category | Probe File | Checks | Execution | Dimension |
|-------------------|-----------|--------|-----------|-----------|
| KB Integrity (KB-01 to KB-06) | kb-integrity.md | 6 checks, KB-01 blocks rest | inline | infrastructure |
| Config Validity (CFG-01 to CFG-06) | config-validity.md | 6 checks, CFG-01/02 block rest | inline | infrastructure |
| Stale Artifacts (STALE-01 to STALE-03) | stale-artifacts.md | 3 checks | inline | infrastructure |
| Signal Lifecycle (SIG-01, SIG-02) | signal-lifecycle.md | 2 checks | inline | infrastructure |
| Planning Consistency (PLAN-01 to PLAN-03) | planning-consistency.md | 3 checks, tier: full | inline | infrastructure |
| Config Drift (DRIFT-01, DRIFT-02) | config-drift.md | 2 checks, tier: full | inline | infrastructure |
| **NEW** Signal Metrics (HEALTH-08) | signal-metrics.md | ratio + regime | subcommand | workflow |
| **NEW** Signal Density (HEALTH-09) | signal-density.md | trend within regime | subcommand | workflow |
| **NEW** Automation Watchdog (HEALTH-07) | automation-watchdog.md | timestamp check | subcommand | infrastructure |
| **NEW** Rogue Files (HEALTH-10) | rogue-files.md | pattern detection | inline | infrastructure |
| **NEW** Rogue Context (HEALTH-11) | rogue-context.md | git categorization | agent | workflow |

## Sources

### Primary (HIGH confidence)
- Existing codebase: `commands/gsd/health-check.md`, `get-shit-done/workflows/health-check.md`, `get-shit-done/references/health-check.md` -- current health check system (47 + 240 + 497 lines)
- Existing codebase: `get-shit-done/workflows/execute-phase.md` -- signal collection postlude pattern for health check postlude
- Existing codebase: `hooks/gsd-ci-status.js`, `hooks/gsd-statusline.js` -- SessionStart hook and statusline patterns
- Existing codebase: `get-shit-done/feature-manifest.json` -- automation and health_check feature schemas
- Existing codebase: `get-shit-done/bin/gsd-tools.js` -- automation subcommands (resolve-level, track-event, check-lock, lock/unlock, regime-change)
- Existing codebase: `agents/gsd-artifact-sensor.md` -- sensor auto-discovery contract precedent
- Deliberation: `.planning/deliberations/health-check-maintainability.md` -- concluded architectural decisions

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` HEALTH-01 through HEALTH-11 -- requirement definitions with philosophical motivations
- `.planning/ROADMAP.md` Phase 41 -- success criteria and plan structure
- `tests/unit/automation.test.js` -- automation framework test patterns

### Tertiary (LOW confidence)
- Workflow health threshold defaults (2.0/5.0) -- educated guess, need empirical calibration per deliberation prediction P4
- Signal deduplication by tag-similarity -- reasonable approach but untested

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md` and `~/.gsd/knowledge/index.md` fallback). No lessons or spikes found relevant to this phase's domain (health scoring, automation wiring, rogue file detection). The project-local index contains 110 signals and 1 spike (session log location -- not relevant). The global index contains 31 regime_change test entries and 0 lessons/0 spikes.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All components are existing codebase patterns; no external libraries needed
- Architecture: HIGH - Deliberation concluded with detailed architecture; sensor precedent is well-established
- Pitfalls: HIGH - Several pitfalls (double-fire, hook blocking) are drawn from actual signals in this project
- Code examples: MEDIUM - Examples are based on existing patterns but untested for this specific use case
- Threshold defaults: LOW - No empirical basis; deliberately designed to need calibration per deliberation P4

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (30 days -- stable internal architecture, no external dependency drift)
