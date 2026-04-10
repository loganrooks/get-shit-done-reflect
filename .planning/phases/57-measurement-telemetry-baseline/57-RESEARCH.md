# Phase 57: Measurement & Telemetry Baseline — Research

**Researched:** 2026-04-09
**Domain:** Node.js CLI telemetry extraction, statistical baseline computation, gsd-tools module pattern
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- `[decided]` Session-meta is the primary historical data source for Claude Code baseline
- `[decided]` JSONL is NOT a primary data source for routine extraction; reserved for drill-down
- `[decided]` Focus on Claude Code + Codex CLI as the two active runtimes
- `[decided]` Token usage metrics must span multiple granularities: per-session, per-phase, per-milestone, out-of-phase
- `[decided]` `.planning/baseline.json` must be committed before Phase 58 structural gates ship
- `[decided]` `--raw` flag for JSON output; default is human-readable tables
- `[decided]` Module follows `lib/telemetry.cjs` pattern with `cmdTelemetry{Subcommand}(cwd, options, raw)` signatures
- `[decided]` Uses `output()` and `error()` from core.cjs, `atomicWriteJson()` for baseline file writes
- `[decided]` Router addition: `case 'telemetry':` in gsd-tools.cjs switch statement
- `[governing]` Metrics must be designed for progressive refinement: each aggregate metric should decompose into typed sub-metrics
- `[governing]` Every metric needs interpretive context — numbers are not self-evident
- `[governing]` Goodhart's Law — metrics must be monitored indicators, not optimization targets
- `[governing]` Theory-ladenness of observation — make measurement theory explicit
- `[governing]` Severity of testing (Mayo) — distributions not just medians; confidence intervals not just point estimates
- `[governing]` Representing vs. Intervening (Hacking) — metrics both represent and intervene
- `[governing]` Metric reflexivity and openness — framework must be open to its own revision
- `[governing]` Layered measurement: three layers — runtime-provided, computed, interpretive. No data is "raw."
- `[governing]` Telemetry system is an active measurement instrument, not a passive consumer
- `[governing]` Adaptive to the changing design situation — extensible schema, plugin-style metric registration
- `[stipulated]` Facets-derived metrics computed on facets-matched subset only (109/268 = 41%), with n explicitly reported
- `[stipulated]` Epistemic humility convention: every metric output includes `interpretive_notes`
- **DC-1:** Zero external dependencies — vanilla Node.js only
- **DC-2:** Node.js >= 22.5.0 required
- **DC-3:** Codex session data adapter is Phase 60 scope
- **DC-4:** Cost calculation excluded from this phase
- **DC-5:** Token reliability RESOLVED by Spike A (`output_tokens` reliable within 0-8%)
- **DC-6:** Schema should be pricing-agnostic
- **DC-7:** Telemetry output should be consumable by multiple downstream systems

### Claude's Discretion

- Exact table formatting and column widths for human-readable output
- Statistical computation implementation (streaming vs in-memory)
- Test fixture design for telemetry.test.js
- Whether to include sparkline-style distribution visualization in CLI output
- Internal helper function decomposition within telemetry.cjs

### Deferred Ideas (OUT OF SCOPE)

- RTK integration testing
- Automated token sensor
- Cost calculation
- OTel collector integration
- Bridge file extension
- Health-probe token-health dimension
- Quality-predictive metric identification
- Continental philosophy of memory
</user_constraints>

---

## Summary

Phase 57 builds `telemetry.cjs` — module #19 in `get-shit-done/bin/lib/` — following the established gsd-tools lib pattern. The domain is entirely internal: read pre-computed session-meta JSON files from `~/.claude/usage-data/session-meta/`, optionally join with facets from `~/.claude/usage-data/facets/`, compute statistical distributions, and expose results via five subcommands. No external libraries are needed; no external services are called. All implementation uses vanilla Node.js built-ins already established in the codebase.

Five pre-research spikes have fully characterized the data corpus. Token count reliability (Spike A / spk-004), facets correlation (Spike C / spk-005), behavioral metrics (Spike E / spk-006), data integrity (Spike G / spk-007), and OTel/bridge validation (Spike H / spk-008) together answer every critical unknowns. The clean corpus is 229 sessions (228 conservative), exclusion rules are deterministic, and the two strongest behavioral metrics are `message_hours_entropy` (r=0.48 with tool_errors) and `first_prompt_category` (2x error-rate differential GSD vs ad-hoc). Facets `friction_counts` is the most validated facets field (Spearman rho=0.55 vs interruptions).

The integration path is straightforward: add `const telemetry = require('./lib/telemetry.cjs');` to gsd-tools.cjs, add `case 'telemetry':` to the switch router, implement five `cmdTelemetry*` functions in the new module. The `kb.cjs` module is the closest structural parallel — it demonstrates lazy-require for optional Node 22 features, uses `output()/error()` from core.cjs, and routes subcommands with the same if/else pattern. `atomicWriteJson()` is already exported from core.cjs and is the correct write mechanism for `baseline.json`.

**Primary recommendation:** Implement `telemetry.cjs` as a pure data-extraction module using the kb.cjs structural pattern. All five subcommands (summary, session, phase, baseline, enrich) are straightforward sequential reads against pre-existing JSON files. Statistical computations are simple percentile calculations requiring no external libraries.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` | built-in | Read session-meta and facets files | Already used throughout all lib/*.cjs modules |
| `node:path` | built-in | Path construction for data dirs | Already used throughout all lib/*.cjs modules |
| `node:os` | built-in | `os.homedir()` to locate `~/.claude/` | Used in kb.cjs, sensors.cjs for global paths |
| `output()/error()` | core.cjs | CLI output + error exit | Mandatory convention for all lib/*.cjs commands |
| `atomicWriteJson()` | core.cjs | Write `baseline.json` safely | Established atomic-write pattern for planning artifacts |
| `resolveWorktreeRoot()` | core.cjs | Normalize project_path worktree variants | Required for correct project filtering across worktrees |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:crypto` | built-in | Not needed for Phase 57 | N/A |
| `STATE.md` timestamps | state.cjs (read via fs) | Phase time window for `telemetry phase` | Used only in cmdTelemetryPhase to derive start/end times |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla JS percentile calc | `simple-statistics` npm | npm dep violates DC-1; 12-line percentile function is sufficient |
| In-memory full corpus load | Streaming fs.createReadStream | Full corpus is 268 files × ~2KB = ~536KB; in-memory is fine, streaming adds complexity for no benefit |
| `JSON.parse(fs.readFileSync(...))` | `fs.createReadStream` + `JSONStream` | Same reasoning as above; 536KB is trivial |

**Installation:** No npm installs needed. Zero external dependencies (DC-1).

---

## Architecture Patterns

### Recommended Module Structure

```
get-shit-done/bin/lib/telemetry.cjs   # new module (lib #19)
get-shit-done/bin/gsd-tools.cjs       # add require + case 'telemetry':
tests/unit/telemetry.test.js          # new test file
```

### Pattern 1: Module Header (mirrors kb.cjs)

[evidenced:cited] The kb.cjs module is the canonical parallel: it has the same vanilla-Node.js constraint, reads files from `~/.gsd/` or `.planning/`, routes subcommands with if/else chains, and uses `output()/error()`. The telemetry module should mirror this structure exactly.

```javascript
/**
 * Telemetry — session-meta extraction and baseline computation
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { output, error, resolveWorktreeRoot, atomicWriteJson } = require('./core.cjs');

// Source: established pattern from kb.cjs, sensors.cjs, automation.cjs
```

### Pattern 2: Data Directory Resolution

[evidenced:cited] Session-meta lives at `~/.claude/usage-data/session-meta/` and facets at `~/.claude/usage-data/facets/` — confirmed from spike analysis. Both are global (not per-project). Project filtering is done by matching `session.project_path` against `cwd` after worktree normalization.

```javascript
function getUsageDataDir() {
  return path.join(os.homedir(), '.claude', 'usage-data');
}

function getSessionMetaDir() {
  return path.join(getUsageDataDir(), 'session-meta');
}

function getFacetsDir() {
  return path.join(getUsageDataDir(), 'facets');
}
```

### Pattern 3: Trust Tier Filtering

[evidenced:cited] Spike G (spk-007) established deterministic exclusion rules. These rules MUST be applied before any metric computation. Clean corpus = 229 sessions (228 conservative).

```javascript
// Source: spk-007 DECISION.md — trust tier assignment rules
function getTrustTier(session) {
  // Exclude: JSON parse failure handled upstream (skip malformed files)
  // Exclude: zero-turn phantom sessions
  if (session.assistant_message_count === 0 && session.output_tokens === 0) {
    return 'exclude';
  }
  // Exclude-borderline: ghost initiation even with 1 assist message
  if (session.assistant_message_count <= 1 && session.output_tokens === 0 &&
      session.first_prompt === 'No prompt') {
    return 'exclude';
  }
  // Caveated: extreme duration (wall-clock multi-day sessions)
  if (session.duration_minutes > 1000) {
    return 'caveated';
  }
  return 'clean';
}
```

### Pattern 4: Percentile Computation (Vanilla JS)

[assumed:reasoned] No npm library needed. A 12-line function covers all statistical needs for Phase 57 baseline. Uses sorted array with linear interpolation.

```javascript
// No external library needed — vanilla JS percentile implementation
function computeDistribution(values) {
  if (!values || values.length === 0) return null;
  const sorted = [...values].filter(v => v != null && !isNaN(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const pct = (p) => {
    const idx = (p / 100) * (sorted.length - 1);
    const lo = Math.floor(idx), hi = Math.ceil(idx);
    return lo === hi ? sorted[lo] : sorted[lo] + (idx - lo) * (sorted[hi] - sorted[lo]);
  };
  return {
    n: sorted.length,
    min: sorted[0],
    p25: pct(25),
    median: pct(50),
    p75: pct(75),
    p90: pct(90),
    max: sorted[sorted.length - 1],
    mean: sorted.reduce((s, v) => s + v, 0) / sorted.length
  };
}
```

### Pattern 5: Computed Fields (Spike Findings)

[evidenced:cited] Spike E (spk-006) identified `message_hours_entropy` and `first_prompt_category` as the two strongest behavioral predictors. These must be computed from raw fields, not read directly. They are NOT in session-meta — they are derived metrics the module computes.

```javascript
// Source: spk-006 DECISION.md — first_prompt categorization
function categorizeFirstPrompt(firstPrompt) {
  if (!firstPrompt || firstPrompt === 'No prompt') return 'no_prompt';
  const p = firstPrompt.toLowerCase();
  if (p.startsWith('/gsd:execute-phase') || p.startsWith('/gsd execute')) return 'gsd_execute';
  if (p.startsWith('/gsd:plan-phase') || p.startsWith('/gsd plan')) return 'gsd_plan';
  if (p.startsWith('/gsd:discuss-phase') || p.startsWith('/gsd discuss')) return 'gsd_discuss';
  if (p.startsWith('/gsd:research-phase')) return 'gsd_research';
  if (p.startsWith('/gsd:spike')) return 'gsd_spike';
  if (p.startsWith('/gsd')) return 'gsd_other';
  if (p.length < 50) return 'short_task';
  if (p.endsWith('?')) return 'question';
  return 'freeform_task';
}

// Source: spk-006 DECISION.md — message_hours entropy
function computeHoursEntropy(messageHours) {
  if (!messageHours || messageHours.length === 0) return 0;
  const counts = {};
  for (const h of messageHours) counts[h] = (counts[h] || 0) + 1;
  const total = messageHours.length;
  let entropy = 0;
  for (const count of Object.values(counts)) {
    const p = count / total;
    if (p > 0) entropy -= p * Math.log2(p);
  }
  return entropy;
}

function classifyFocusLevel(entropy) {
  if (entropy <= 0.5) return 'focused';
  if (entropy <= 1.5) return 'extended';
  return 'fragmented';
}
```

### Pattern 6: CLI Router Integration (mirrors sensors/health-probe pattern)

[evidenced:cited] The router in gsd-tools.cjs uses a flat switch/case with if/else subcommand dispatch (lines 655-696). This is the pattern for `case 'telemetry':`.

```javascript
// Source: gsd-tools.cjs lines 655-666 (sensors pattern)
// Add in gsd-tools.cjs after line 53 (const kb = ...):
const telemetry = require('./lib/telemetry.cjs');

// Add in switch statement after case 'kb':
case 'telemetry': {
  const subcommand = args[1];
  if (subcommand === 'summary') {
    const opts = parseTelemetryOptions(args.slice(2));
    telemetry.cmdTelemetrySummary(cwd, opts, raw);
  } else if (subcommand === 'session') {
    const sessionId = args[2];
    if (!sessionId) error('Usage: gsd-tools telemetry session <session-id>');
    telemetry.cmdTelemetrySession(cwd, sessionId, raw);
  } else if (subcommand === 'phase') {
    const phaseNum = args[2];
    if (!phaseNum) error('Usage: gsd-tools telemetry phase <phase-number>');
    telemetry.cmdTelemetryPhase(cwd, phaseNum, raw);
  } else if (subcommand === 'baseline') {
    const opts = parseTelemetryOptions(args.slice(2));
    telemetry.cmdTelemetryBaseline(cwd, opts, raw);
  } else if (subcommand === 'enrich') {
    const sessionId = args[2];
    telemetry.cmdTelemetryEnrich(cwd, sessionId, raw);
  } else {
    error('Unknown telemetry subcommand. Available: summary, session, phase, baseline, enrich');
  }
  break;
}
```

### Pattern 7: Facets Join (enrich and baseline)

[evidenced:cited] Facets files are 109 separate JSON files at `~/.claude/usage-data/facets/`. Each has a `session_id` field. Join is by simple key lookup after loading all facets into a Map.

```javascript
function loadFacetsIndex(facetsDir) {
  const index = new Map();
  if (!fs.existsSync(facetsDir)) return index;
  const files = fs.readdirSync(facetsDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(facetsDir, file), 'utf-8');
      const facet = JSON.parse(raw);
      if (facet.session_id) index.set(facet.session_id, facet);
    } catch { /* skip malformed */ }
  }
  return index;
}
```

### Pattern 8: Phase Time-Window Correlation

[assumed:reasoned] `telemetry phase` needs to map phase number to a time window. STATE.md performance metrics table has per-plan timestamps. The simplest approach for Phase 57: read the ROADMAP.md to find phase name, then scan session-meta for sessions with `project_path` matching the current project and `start_time` within that phase's execution window. This requires reading STATE.md performance metrics rows, which have `timestamp` fields from `cmdStateRecordMetric()`.

```javascript
// Approach: read STATE.md perf metrics table rows,
// find rows matching the requested phase number,
// extract min/max timestamps as the phase time window,
// then filter session-meta by project_path + start_time in window
```

### Anti-Patterns to Avoid

- **Loading all JSONL for routine extraction:** JSONL files are large, unstable (streaming duplication, `/continue` inheritance), and not the primary data source for baselines. Use session-meta exclusively for Phase 57 routine operations. Signal: [sig-2026-03-02-claude-code-session-logs-large-unstable]
- **Using `input_tokens` as workload proxy:** `input_tokens` in session-meta is post-cache residual (1-3 tokens/call). It does NOT represent workload. Use `output_tokens` as the primary token metric. Source: spk-004.
- **Mixing session types in aggregate stats:** Single-task sessions (median 6 min) and multi-task sessions (median 76 min) are fundamentally different populations. Stats that mix them are misleading. Always stratify by `first_prompt_category` or `session_type` facet.
- **Using raw duration_minutes mean:** The 19,996-minute session (genuine multi-day) inflates the mean dramatically. Use median or exclude Caveated tier for duration-sensitive analyses. Source: spk-007.
- **Treating facets as ground truth:** Facets are AI-generated. `outcome` does NOT correlate with `tool_errors` (spk-005 finding). Do not draw conclusions based on single facets fields; use them as holistic indicators only. Always annotate facets-derived fields as AI estimates per TEL-05.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Percentile statistics | numpy-style library | 12-line vanilla JS function (see Pattern 4) | DC-1 forbids external deps; the computation is trivial |
| Atomic file writes | DIY tmp+rename | `atomicWriteJson()` from core.cjs | Already tested, handles cross-device rename edge case |
| Project path normalization | Custom string comparison | `resolveWorktreeRoot(cwd)` from core.cjs | Handles linked worktrees correctly (e.g., `.../.claude/worktrees/gsdr-renaming`) |
| CLI output | Custom formatter | `output(result, raw)` from core.cjs | Handles >50KB payloads via temp file, consistent with all other modules |
| JSON file reads | Custom error handling | Try/catch pattern from kb.cjs | Skip malformed files silently; consistent behavior across corpus |

**Key insight:** The entire domain is reading pre-existing JSON files and computing simple statistics. Every non-trivial piece of infrastructure (atomic writes, output formatting, path resolution) is already implemented in core.cjs.

---

## Common Pitfalls

### Pitfall 1: Project Path Normalization for Worktrees

**What goes wrong:** Session-meta `project_path` contains worktree paths like `/home/rookslog/workspace/projects/get-shit-done-reflect/.claude/worktrees/gsdr-renaming`. Naive string matching against `cwd` misses these sessions.
**Why it happens:** Claude Code records the actual cwd (the worktree), not the main repo root.
**How to avoid:** Use `resolveWorktreeRoot(session.project_path)` when filtering sessions by project, then compare against `resolveWorktreeRoot(cwd)`.
**Warning signs:** Baseline shows fewer sessions than expected; `telemetry summary` counts diverge from known session count.

### Pitfall 2: JSONL Streaming Duplication in Output Token Counts

**What goes wrong:** If computing output_tokens from JSONL (in a drill-down scenario), summing all `assistant` entries overcounts because Claude Code logs multiple incremental streaming updates with `stop_reason: null` before the final `stop_reason: end_turn` entry.
**Why it happens:** JSONL records mid-stream updates as they arrive. Session-meta pre-aggregates correctly.
**How to avoid:** Use session-meta `output_tokens` as the primary token source (spk-004 confirms 0-8% accuracy). If JSONL is needed, deduplicate by keeping only entries where `stop_reason !== null`.
**Warning signs:** JSONL-derived counts significantly exceed session-meta counts.

### Pitfall 3: Malformed Session-Meta Files

**What goes wrong:** 3 of 268 session-meta files have JSON parse errors (null-byte padding, mid-write truncation). A naive `JSON.parse(fs.readFileSync(...))` throws, crashing the command.
**Why it happens:** Write crashes during the session-meta batch regeneration job.
**How to avoid:** Wrap every session-meta file parse in try/catch. Skip malformed files silently. Track skipped count and include in output metadata.
**Warning signs:** Command crashes on large corpus; use `--raw` output to see if count is lower than expected.

### Pitfall 4: Facets Coverage Annotation

**What goes wrong:** Including facets-derived fields in baseline statistics without noting that only 109/268 sessions (41%) have facets data. Aggregate numbers appear to cover the full corpus but do not.
**Why it happens:** Easy to forget that facets join reduces the effective sample size.
**How to avoid:** Every facets-derived metric in baseline output must include explicit `n` (the facets-matched subset count, not total corpus count). TEL-05 also requires AI-estimate annotation. See stipulated constraint above.
**Warning signs:** Baseline JSON has facets metrics without an `n` field showing the subset size.

### Pitfall 5: Duration Outliers Distorting Means

**What goes wrong:** `duration_minutes` mean is heavily inflated by 16 Caveated sessions (>1000 min, including one 19,996-min multi-day session). Mean duration will be misleading.
**Why it happens:** Duration is wall-clock elapsed from session open to close, including idle time between interactions.
**How to avoid:** Always use median (p50) for duration statistics. When showing mean, annotate that it is skewed by multi-day sessions. For duration-sensitive analyses, optionally exclude Caveated tier.
**Warning signs:** Mean duration >> median duration (should be 10x+ discrepancy if Caveated sessions are included).

### Pitfall 6: The `gsd_other` Category Outlier

**What goes wrong:** The `gsd_other` first_prompt category (resume-work, quick, deliberate, reflect commands) includes a single 19,996-minute open-ended session, inflating its mean duration to 1043 minutes while median is 41 minutes.
**Why it happens:** One session was genuinely left open for ~14 days.
**How to avoid:** When displaying per-category duration stats, always show both mean and median (or just median). Flag this caveat in the `gsd_other` interpretive note.
**Warning signs:** Category mean >> median for `gsd_other`.

### Pitfall 7: `first_prompt` Regex Case Sensitivity

**What goes wrong:** `/gsd:execute-phase` and `/GSD:execute-phase` (or other case variants) fail to match the categorizer, falling into `freeform_task` instead of `gsd_execute`.
**Why it happens:** GSD commands are case-sensitive by convention but user input may vary.
**How to avoid:** Lowercase `firstPrompt` before matching: `firstPrompt.toLowerCase().startsWith('/gsd:execute-phase')`.
**Warning signs:** `gsd_execute` count is lower than expected for a project with many execute-phase sessions.

---

## Code Examples

### Loading Session-Meta Corpus

```javascript
// Source: Pattern derived from kb.cjs file-loading convention + spk-007 exclusion rules
function loadSessionMetaCorpus(sessionMetaDir, opts = {}) {
  const { projectFilter, includeCaveated = false } = opts;
  if (!fs.existsSync(sessionMetaDir)) return [];

  const files = fs.readdirSync(sessionMetaDir).filter(f => f.endsWith('.json'));
  const sessions = [];

  for (const file of files) {
    let session;
    try {
      const raw = fs.readFileSync(path.join(sessionMetaDir, file), 'utf-8').trimEnd();
      session = JSON.parse(raw.replace(/\x00+$/, '')); // null-byte trim for spk-007 case
    } catch {
      continue; // skip malformed
    }

    const tier = getTrustTier(session);
    if (tier === 'exclude') continue;
    if (tier === 'caveated' && !includeCaveated) continue;

    if (projectFilter) {
      // Normalize both sides for worktree matching
      const normalizedProjectPath = resolveWorktreeRoot(session.project_path || '');
      const normalizedFilter = resolveWorktreeRoot(projectFilter);
      if (!normalizedProjectPath.startsWith(normalizedFilter) &&
          normalizedProjectPath !== normalizedFilter) continue;
    }

    sessions.push(session);
  }
  return sessions;
}
```

### Baseline Computation (cmdTelemetryBaseline skeleton)

```javascript
// Source: measurement-infrastructure-research.md §4 + spk-006 computed fields
function cmdTelemetryBaseline(cwd, opts, raw) {
  const sessionMetaDir = getSessionMetaDir();
  const facetsDir = getFacetsDir();

  const sessions = loadSessionMetaCorpus(sessionMetaDir, { projectFilter: cwd });
  const facetsIndex = loadFacetsIndex(facetsDir);

  // Compute derived fields on each session
  const enriched = sessions.map(s => ({
    ...s,
    _tier: getTrustTier(s),
    _first_prompt_category: categorizeFirstPrompt(s.first_prompt),
    _hours_entropy: computeHoursEntropy(s.message_hours),
    _focus_level: classifyFocusLevel(computeHoursEntropy(s.message_hours)),
    _facet: facetsIndex.get(s.session_id) || null,
  }));

  const baseline = {
    generated_at: new Date().toISOString(),
    corpus: {
      total_files: sessions.length,
      clean_count: enriched.filter(s => s._tier === 'clean').length,
      caveated_count: enriched.filter(s => s._tier === 'caveated').length,
    },
    metrics: {
      output_tokens: computeDistribution(enriched.map(s => s.output_tokens)),
      tool_errors: computeDistribution(enriched.map(s => s.tool_errors)),
      duration_minutes: computeDistribution(enriched.map(s => s.duration_minutes)),
      user_interruptions: computeDistribution(enriched.map(s => s.user_interruptions)),
      // ... additional metrics
    },
    facets_metrics: computeFacetsMetrics(enriched, facetsIndex),
    interpretive_notes: buildInterpretiveNotes(),
  };

  const outputPath = path.join(resolveWorktreeRoot(cwd), '.planning', 'baseline.json');
  atomicWriteJson(outputPath, baseline);
  output({ baseline_written: outputPath, ...baseline }, raw);
}
```

### Human-Readable Table Output Helper

```javascript
// Claude's discretion: exact column widths
// Source: Pattern derived from health-probe.cjs table output style
function formatDistributionTable(label, dist) {
  if (!dist) return `${label}: no data\n`;
  return [
    `\n${label} (n=${dist.n}):`,
    `  min=${dist.min} | p25=${dist.p25.toFixed(0)} | median=${dist.median.toFixed(0)} | p75=${dist.p75.toFixed(0)} | p90=${dist.p90.toFixed(0)} | max=${dist.max}`,
  ].join('\n');
}
```

### Test Fixture Pattern

```javascript
// Source: sensors.test.js pattern adapted for telemetry
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'
import os from 'node:os'
import { execSync } from 'node:child_process'

const GSD_TOOLS = path.resolve(process.cwd(), 'get-shit-done/bin/gsd-tools.cjs')

// Claude's discretion: fixture design
// Minimal fixture: write a few session-meta JSON files to a mock ~/.claude/usage-data/session-meta/
// The test must override os.homedir() or pass --cwd with a custom home mock.
// Recommended: use environment variable HOME override in execSync env.

function runTelemetry(tmpdir, subcommand, extraArgs = []) {
  const mockHome = path.join(tmpdir, 'home')
  const result = execSync(
    `node "${GSD_TOOLS}" telemetry ${subcommand} ${extraArgs.join(' ')} --raw`,
    {
      cwd: tmpdir,
      env: { ...process.env, HOME: mockHome },
      encoding: 'utf-8',
      timeout: 10000,
    }
  )
  return JSON.parse(result.trim())
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Treat `input_tokens` as workload proxy | Use `output_tokens` as primary; `input_tokens` is cache-miss residual | Spike A (2026-04-09) | Baselines will be accurate; old approach would show identical ~100-token "workload" for 2-min and 513-min sessions |
| No behavioral signals beyond tokens | `message_hours_entropy` + `first_prompt_category` as first-class metrics | Spike E (2026-04-09) | r=0.48 vs tool_errors is the strongest predictor found in the corpus |
| Treat all sessions as equivalent | Apply trust-tier rules; exclude ghost initiations + malformed files | Spike G (2026-04-09) | 229 clean out of 268 total; 23 phantom sessions would corrupt aggregates |
| Assume facets = reliable quality ground truth | Facets are holistic AI estimates; friction/session_type are validated signals; outcome/helpfulness are not directly correlated with technical metrics | Spike C (2026-04-09) | Prevents drawing false conclusions from outcome vs tool_errors |

**Deprecated/outdated:**
- `input_tokens` as a session complexity metric: misleading due to Claude Code's aggressive caching. All baseline metrics should use `output_tokens`.
- OTel as the normalization surface for cross-runtime comparison: Codex has no console OTel exporter. Phase 60 Codex adapter will read native JSONL `token_count` events directly. Phase 57 schema must accommodate this (nullable fields for Codex-only and Claude-only fields).

---

## Open Questions

### Resolved

- **Q: Are `input_tokens` reliable?** No. They are post-cache residuals (1-3 tokens/call). Use `output_tokens`. Source: spk-004.
- **Q: Do facets correlate with behavioral metrics?** Partially. `friction_counts` (rho=0.55 vs interruptions) and `session_type` (10x duration span) are validated. `outcome` and `helpfulness` are NOT directly correlated with tool_errors. Source: spk-005.
- **Q: What behavioral metrics have signal?** `message_hours_entropy` (r=0.48, near-universal coverage) and `first_prompt_category` (2x error-rate differential). `response_time CV` deferred — 54% coverage gap. Source: spk-006.
- **Q: How clean is the corpus?** 85.4% clean (229/268). Exclusions are deterministic: zero-turn phantom sessions (20) + malformed JSON (3). Source: spk-007.
- **Q: Can Codex be normalized to OTel alongside Claude Code?** No. Codex has no console OTel exporter. Normalization must work across Claude Code (session-meta + optional OTel) and Codex (native JSONL). Source: spk-008.
- **Q: Does statusline payload include cost/rate limits?** Yes. Fields confirmed present in payload but NOT written to bridge file. Bridge extension is deferred (Deferred Ideas). Source: spk-008.
- **Q: How does `telemetry phase` map sessions to a phase?** Read STATE.md performance metrics table rows for the requested phase number, extract earliest/latest timestamps as the time window, then filter session-meta by `project_path` + `start_time` within window.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| STATE.md perf metrics table format — does it have timestamps reliable enough for phase-window extraction? | Medium | Accept-risk. Read actual STATE.md for the current project to verify row format before implementing cmdTelemetryPhase. If timestamps are absent, fall back to approximate window based on phase directory creation time. |
| `--since/--until` date filtering: what format? ISO-8601, YYYY-MM-DD, or relative? | Low | Stipulate ISO-8601 / YYYY-MM-DD. Simple to implement; executor has discretion. |
| How to display `interpretive_notes` without cluttering the human-readable output? | Low | Claude's discretion. Consider `--verbose` flag for full notes, abbreviated inline hint for default view. |

### Still Open

- The exact content of `interpretive_notes` for each metric: what interpretations to surface. The governing principles define the shape (multiple explanations, context-dependence) but the actual text is implementation-time work. Executor should draft these as part of coding, not planning.
- The `gsd_other` category duration artifact (1 session at 19,996 min) should be investigated further after baseline is captured, but is not a blocker for Phase 57.

---

## Sources

### Primary (HIGH confidence)

- `spk-004` — Token Count Reliability DECISION.md: empirical analysis of 10 sessions; confirms `output_tokens` reliable within 0-8% for clean sessions. Source: `.planning/spikes/004-token-count-reliability/DECISION.md`
- `spk-005` — Facets Accuracy Validation DECISION.md: empirical correlation analysis of 106 matched sessions; Spearman rho=0.55 for friction/interruptions. Source: `.planning/spikes/005-facets-accuracy-validation/DECISION.md`
- `spk-006` — Behavioral Metric Signal-to-Noise DECISION.md: r=0.48 message_hours_entropy vs tool_errors; first_prompt 2x error-rate differential. Source: `.planning/spikes/006-behavioral-metric-signal-to-noise/DECISION.md`
- `spk-007` — Session Data Integrity DECISION.md: 85.4% clean corpus; deterministic exclusion rules. Source: `.planning/spikes/007-session-data-integrity-characterization/DECISION.md`
- `spk-008` — Cross-Runtime OTel & Bridge Validation DECISION.md: Codex console OTel does not exist; statusline bridge has 14 unwritten fields. Source: `.planning/spikes/008-cross-runtime-otel-and-bridge-validation/DECISION.md`
- `measurement-infrastructure-research.md` — session-meta schema (§1), facets schema (§2), tooling design (§3), baseline strategy (§4), cross-platform normalization schema (§8). Source: `.planning/research/measurement-infrastructure-research.md`
- `telemetry-survey.md` — computable-now metrics table, data source inventory. Source: `.planning/audits/session-log-audit-2026-04-07/reports/telemetry-survey.md`
- `kb.cjs` — canonical structural parallel for telemetry.cjs module. Source: `get-shit-done/bin/lib/kb.cjs`
- `core.cjs` — `output()`, `error()`, `resolveWorktreeRoot()`, `atomicWriteJson()` API verified. Source: `get-shit-done/bin/lib/core.cjs`
- `gsd-tools.cjs` lines 40-54, 655-696 — require pattern and router pattern verified. Source: `get-shit-done/bin/gsd-tools.cjs`

### Secondary (MEDIUM confidence)

- `sensors.test.js` — test pattern for CLI-invoked lib modules using `tmpdirTest` + `execSync` + `HOME` env override. Source: `tests/unit/sensors.test.js`
- `telemetry-research-claude.md` — complete session-meta schema, JSONL entry types, statusline bridge fields. Source: `.planning/audits/session-log-audit-2026-04-07/reports/telemetry-research-claude.md`

### Tertiary (LOW confidence)

None. All findings in this phase are backed by empirical spike analysis of actual data files or direct code inspection.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero external deps, all built-ins already used in codebase
- Architecture: HIGH — patterns extracted directly from kb.cjs, sensors.cjs, gsd-tools.cjs router
- Statistical computation: HIGH — spike findings confirm exact fields to compute and how; percentile formula is standard
- Pitfalls: HIGH — all pitfalls are empirically confirmed by spikes, not hypothetical
- Phase-window correlation: MEDIUM — STATE.md perf metrics table format not re-verified at research time

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (stable domain — no external dependencies, data schema already confirmed by spikes)

---

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| spk-004 (spk-2026-04-09-token-count-reliability) | spike | `output_tokens` reliable (0-8%); `input_tokens` is post-cache residual (1-3/call) | Standard Stack, Code Examples, Pitfall 2, Anti-Patterns |
| spk-005 (spk-2026-04-09-facets-accuracy-validation) | spike | friction/interruptions rho=0.55; outcome NOT correlated with tool_errors; session_type 10x duration span | Architecture Patterns (computed fields), Pitfall 4, Anti-Patterns |
| spk-006 (spk-2026-04-09-behavioral-metric-signal-to-noise) | spike | message_hours_entropy r=0.48 with tool_errors; first_prompt_category 2x error differential; response_time CV deferred | Standard Stack, Architecture Patterns (computed fields), Code Examples |
| spk-007 (spk-2026-04-09-session-data-integrity-characterization) | spike | 85.4% clean corpus; trust tier rules; null-byte truncation; ghost-initiation exclusions | Architecture Patterns (trust tier), Code Examples, Pitfall 1, 3, 5 |
| spk-008 (spk-2026-04-09-cross-runtime-otel-bridge-validation) | spike | Codex has no console OTel; bridge has 14 unwritten fields; cross-runtime normalization must use native JSONL | Standard Stack, State of the Art, Open Questions |
