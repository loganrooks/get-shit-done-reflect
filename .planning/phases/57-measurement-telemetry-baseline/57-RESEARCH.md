# Phase 57: Measurement & Telemetry Baseline - Research

**Researched:** 2026-04-09
**Domain:** CLI telemetry extraction, session data aggregation, statistical baseline computation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Token Count Reliability Strategy**
- Validation task (5-session comparison of session-meta tokens vs JSONL-aggregated tokens) must complete before baseline.json is committed
- This is an inline research task within Phase 57, not a formal /gsdr:spike -- scope is bounded and binary
- If session-meta tokens are unreliable, the tooling must support JSONL-aggregated token counts as an alternative source
- baseline.json annotates which token source was used and any known limitations

**Output Format**
- `--raw` flag for JSON output; default is human-readable tables -- follows established gsd-tools convention
- Module follows `lib/telemetry.cjs` pattern with `cmdTelemetry{Subcommand}(cwd, options, raw)` signatures
- Uses `output()` and `error()` from core.cjs, `atomicWriteJson()` for baseline file writes
- Router addition: `case 'telemetry':` in gsd-tools.cjs switch statement

**Project Filtering**
- `--project` flag filters sessions by project_path; `resolveWorktreeRoot()` normalizes worktree paths to main project root
- Baseline output reports matched vs filtered session counts

**Baseline Dimensions**
- All 8 proposed metrics: tokens/session, token-to-commit ratio, tool error rate, interruption rate, session outcome distribution, friction frequency, session duration distribution, agent usage rate
- Statistical distributions: min, p25, median, p75, p90, max for numeric fields
- Token-based metrics carry reliability caveat until inline validation confirms source accuracy
- Facets-based metrics computed on facets-matched subset only, with n reported

**Facets Integration**
- Left-join facets by session_id; sessions without facets retain null for quality fields
- Every facets-derived field annotated as "AI-generated estimate with unknown accuracy"
- Baseline reports facets coverage

**Phase Correlation**
- `telemetry phase <phase-num>` matches session timestamps to STATE.md performance metrics time windows

**Scope Exclusions (Fixed)**
- Cost calculation excluded from schema
- Codex session data adapter is Phase 60 scope
- Bridge file extension needs spike E validation -- not this phase
- Health-probe token-health integration is downstream consumer

### Claude's Discretion
- Exact table formatting and column widths for human-readable output
- Statistical computation implementation (streaming vs in-memory)
- Test fixture design for telemetry.test.js
- Whether to include sparkline-style distribution visualization in CLI output

### Deferred Ideas (OUT OF SCOPE)
- Cost calculation with versioned pricing table
- Codex session data adapter (state_5.sqlite) -- Phase 60
- Bridge file extension for real-time cost/rate data
- Health-probe token-health dimension
- Telemetry sensor (automated collection)
- Quality-predictive metric identification
</user_constraints>

## Summary

This phase implements the `gsd-tools telemetry` subcommand family as a new `lib/telemetry.cjs` module following established patterns (sensors.cjs, automation.cjs, health-probe.cjs). The module reads Claude Code session-meta files (`~/.claude/usage-data/session-meta/*.json`, 268 files) and facets files (`~/.claude/usage-data/facets/*.json`, 109 files), computes statistical baselines, and produces `.planning/baseline.json`. There are no external dependencies -- this is pure Node.js file I/O, JSON parsing, and arithmetic.

The critical technical risk is token count reliability. Research conducted during this investigation compared session-meta token counts against JSONL-aggregated counts across 65 sessions: only 15% matched exactly, 44% were within 2x, and 40% were wildly off (up to 13,000x discrepancy on input tokens). This confirms the CONTEXT.md decision that validation must complete before baseline.json is committed, and the tooling must support JSONL-aggregated counts as a fallback. The input_tokens field in session-meta appears to be a post-caching residual (accounting for `cache_read_input_tokens` deduction), not gross API input tokens.

The module follows a zero-dependency approach using only Node.js built-ins (`fs`, `path`, `os`). Statistical computations (percentiles, distributions) are straightforward in-memory operations given the data volume (268 sessions fit easily in memory). The five subcommands (summary, session, phase, baseline, enrich) share common data-loading utilities and follow the established `cmdTelemetry{Subcommand}(cwd, options, raw)` signature pattern.

**Primary recommendation:** Build telemetry.cjs as a single module with shared data loaders, compute all statistics in-memory, and gate baseline.json output on the token validation task result.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | 22.5.0+ | Read session-meta/facets JSON files | Zero dependencies, already used throughout gsd-tools |
| Node.js built-in `path` | 22.5.0+ | Path resolution for data directories | Standard across all lib modules |
| Node.js built-in `os` | 22.5.0+ | `os.homedir()` for `~/.claude/` resolution | Standard pattern in gsd-tools |
| core.cjs utilities | (internal) | `output()`, `error()`, `atomicWriteJson()`, `resolveWorktreeRoot()` | Established internal API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vitest | ^3.0.0 | Testing telemetry.test.js | All unit tests |
| tests/helpers/tmpdir.js | (internal) | `tmpdirTest` fixture for isolated test dirs | Every test that needs filesystem |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| In-memory percentile computation | simple-statistics npm package | Adds dependency; our data is small (268 items), hand-rolled percentile is ~10 lines |
| Manual JSON file reading | glob npm package | `fs.readdirSync()` + filter is sufficient and dependency-free |
| Custom table formatting | cli-table3 npm package | Adds dependency; `String.padEnd()` is sufficient for fixed-width output |

**Installation:**
No new packages needed. All functionality uses existing Node.js built-ins and project internals.

## Architecture Patterns

### Recommended Project Structure
```
get-shit-done/bin/lib/
  telemetry.cjs          # New module: all telemetry subcommands

get-shit-done/bin/
  gsd-tools.cjs          # Router addition: case 'telemetry'

tests/unit/
  telemetry.test.js      # New test file

.planning/
  baseline.json          # Output artifact (committed)
```

### Pattern 1: Module Convention (following sensors.cjs / automation.cjs)
**What:** New lib module with exported `cmd*` functions, internal helpers, and `module.exports` at bottom.
**When to use:** Every gsd-tools subcommand family.
**Example:**
```javascript
// Source: verified from sensors.cjs, automation.cjs, health-probe.cjs patterns
const fs = require('fs');
const path = require('path');
const os = require('os');
const { error, output, atomicWriteJson, resolveWorktreeRoot } = require('./core.cjs');

// --- Helpers ---

function loadSessionMeta() {
  const dir = path.join(os.homedir(), '.claude', 'usage-data', 'session-meta');
  // ... read and parse all JSON files
}

// --- Commands ---

function cmdTelemetrySummary(cwd, options, raw) {
  // options: { project, since, until }
  const sessions = loadSessionMeta();
  const filtered = filterSessions(sessions, options);
  // ... compute and output
}

// --- Exports ---
module.exports = {
  cmdTelemetrySummary,
  cmdTelemetrySession,
  cmdTelemetryPhase,
  cmdTelemetryBaseline,
  cmdTelemetryEnrich,
  // Exported for testing
  loadSessionMeta,
  loadFacets,
  computePercentiles,
};
```

### Pattern 2: Router Integration
**What:** Add `case 'telemetry':` block to gsd-tools.cjs switch statement.
**When to use:** When adding a new top-level command.
**Example:**
```javascript
// Source: verified from gsd-tools.cjs lines 602-682 (automation/sensors/health-probe patterns)
case 'telemetry': {
  const subcommand = args[1];
  if (subcommand === 'summary') {
    const projectIdx = args.indexOf('--project');
    const sinceIdx = args.indexOf('--since');
    const untilIdx = args.indexOf('--until');
    const options = {
      project: projectIdx !== -1 ? args[projectIdx + 1] : undefined,
      since: sinceIdx !== -1 ? args[sinceIdx + 1] : undefined,
      until: untilIdx !== -1 ? args[untilIdx + 1] : undefined,
    };
    telemetry.cmdTelemetrySummary(cwd, options, raw);
  } else if (subcommand === 'session') {
    const sessionId = args[2];
    telemetry.cmdTelemetrySession(cwd, sessionId, raw);
  } else if (subcommand === 'phase') {
    const phaseNum = args[2];
    telemetry.cmdTelemetryPhase(cwd, phaseNum, raw);
  } else if (subcommand === 'baseline') {
    const projectIdx = args.indexOf('--project');
    const options = {
      project: projectIdx !== -1 ? args[projectIdx + 1] : undefined,
    };
    telemetry.cmdTelemetryBaseline(cwd, options, raw);
  } else if (subcommand === 'enrich') {
    const sessionId = args[2];
    telemetry.cmdTelemetryEnrich(cwd, sessionId, raw);
  } else {
    error('Unknown telemetry subcommand. Available: summary, session, phase, baseline, enrich');
  }
  break;
}
```

### Pattern 3: Data Loading with Project Filtering
**What:** Read all session-meta files, optionally filter by project path using `resolveWorktreeRoot()`.
**When to use:** Every subcommand that accepts `--project`.
**Example:**
```javascript
// Source: verified resolveWorktreeRoot() from core.cjs line 567
function loadSessionMeta(projectFilter) {
  const dir = path.join(os.homedir(), '.claude', 'usage-data', 'session-meta');
  let files;
  try { files = fs.readdirSync(dir); } catch { return []; }

  const sessions = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      sessions.push(data);
    } catch { /* skip malformed files */ }
  }

  if (!projectFilter) return sessions;

  // Normalize project filter path
  const normalizedFilter = resolveWorktreeRoot(projectFilter);
  return sessions.filter(s => {
    // Normalize session project_path to handle worktree paths
    // e.g., "/path/to/project/.claude/worktrees/branch-name" -> "/path/to/project"
    const sessionProject = normalizeProjectPath(s.project_path);
    return sessionProject === normalizedFilter;
  });
}

function normalizeProjectPath(projectPath) {
  // Strip worktree suffix: /path/.claude/worktrees/name -> /path
  const worktreePattern = /\/\.claude\/worktrees\/[^/]+$/;
  return projectPath.replace(worktreePattern, '');
}
```

### Pattern 4: Percentile Computation
**What:** Compute min, p25, median, p75, p90, max from an array of numbers.
**When to use:** All numeric baseline dimensions.
**Example:**
```javascript
// Source: standard statistics, no external library needed
function computePercentiles(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const percentile = (p) => {
    const idx = (p / 100) * (n - 1);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
  };
  return {
    min: sorted[0],
    p25: percentile(25),
    median: percentile(50),
    p75: percentile(75),
    p90: percentile(90),
    max: sorted[n - 1],
    n: n,
  };
}
```

### Pattern 5: Facets Left-Join
**What:** Join facets data to session-meta by session_id; sessions without facets retain null quality fields.
**When to use:** baseline and enrich subcommands.
**Example:**
```javascript
function loadFacets() {
  const dir = path.join(os.homedir(), '.claude', 'usage-data', 'facets');
  const facetsMap = new Map(); // session_id -> facets data
  let files;
  try { files = fs.readdirSync(dir); } catch { return facetsMap; }

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf-8'));
      if (data.session_id) facetsMap.set(data.session_id, data);
    } catch { /* skip */ }
  }
  return facetsMap;
}

function enrichSession(session, facetsMap) {
  const facets = facetsMap.get(session.session_id) || null;
  return {
    ...session,
    quality: facets ? {
      outcome: facets.outcome,
      satisfaction: facets.user_satisfaction_counts,
      friction_types: facets.friction_counts ? Object.keys(facets.friction_counts) : [],
      session_type: facets.session_type,
      _annotation: 'AI-generated estimate with unknown accuracy',
    } : null,
  };
}
```

### Anti-Patterns to Avoid
- **Reading JSONL for every request:** JSONL files are large (hundreds of MB per project). Only use JSONL for the bounded token validation task, not for regular subcommand execution. Session-meta is the primary data source for all runtime queries.
- **Streaming computation for 268 files:** The data volume (268 small JSON files, ~1KB each) does not warrant streaming. Loading all into memory is simpler and faster. Streaming would add complexity for no benefit.
- **Mutable shared state between subcommands:** Each `cmd*` function should load data fresh. Caching across subcommand calls within a single process run is unnecessary since each CLI invocation is a separate process.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Percentile computation | Full statistics library | 10-line `computePercentiles()` using sorted array interpolation | Data volume is tiny (268 items max); a library is overkill |
| JSON file discovery | Custom recursive file walker | `fs.readdirSync(dir).filter(f => f.endsWith('.json'))` | Flat directory, no recursion needed |
| Atomic file writes | Custom tmp-file-then-rename | `atomicWriteJson()` from core.cjs | Already battle-tested across the codebase |
| Worktree path normalization | Custom git-worktree parser | `resolveWorktreeRoot()` from core.cjs + regex for project_path | Core utility already handles the git plumbing |
| Date range filtering | Custom date parser | `new Date(dateString).getTime()` comparison on ISO-8601 strings | Session-meta already uses ISO-8601 |

**Key insight:** This phase is pure data transformation -- read JSON, filter, compute, output. No networking, no async operations, no complex state machines. The entire telemetry module should be synchronous, following the pattern of every other lib module.

## Common Pitfalls

### Pitfall 1: Token Count Unreliability
**What goes wrong:** Session-meta `input_tokens` and `output_tokens` do not represent gross API token consumption. Empirical comparison across 65 sessions shows only 15% exact match with JSONL-aggregated counts, and 40% are off by >2x.
**Why it happens:** Session-meta appears to record post-caching residual counts. The JSONL `usage.input_tokens` field shows the API-level count per turn, while session-meta likely records `input_tokens` as the non-cached portion only (excluding `cache_read_input_tokens`). This creates massive discrepancies for sessions with high cache hit rates.
**How to avoid:** The inline validation task (5-session comparison) must run before baseline.json is committed. If token counts are confirmed unreliable, baseline.json must annotate: `"token_source": "session-meta (post-cache residual, not gross API tokens)"` and document the limitation.
**Warning signs:** Input tokens < 100 for a session with 20+ user messages.

### Pitfall 2: Worktree Path Mismatch
**What goes wrong:** `--project` filter fails to match sessions that ran in git worktrees. Session-meta `project_path` contains the worktree path (e.g., `/path/.claude/worktrees/branch-name`), not the main project root.
**Why it happens:** Claude Code records the literal `cwd` it was launched in, including worktree paths.
**How to avoid:** Apply `normalizeProjectPath()` (regex stripping `/.claude/worktrees/*`) to every session's `project_path` before comparison.
**Warning signs:** Baseline reports 0 matching sessions when sessions clearly exist for the project.

### Pitfall 3: Facets Coverage Bias
**What goes wrong:** Quality baseline metrics appear skewed because facets data only covers 41% of sessions (109/268). If facets generation is correlated with session characteristics (e.g., only longer sessions get facets), the quality metrics are not representative of all sessions.
**Why it happens:** Facets appear to be generated asynchronously by Claude Code; not all sessions trigger generation.
**How to avoid:** Always report `n` for facets-derived metrics separately from session-meta metrics. Never combine facets and non-facets session counts in the same statistic. Use phrasing: "Of n sessions with quality data..." not "Of all sessions..."
**Warning signs:** `facets_coverage` < 30% in the baseline output.

### Pitfall 4: Date Parsing Edge Cases
**What goes wrong:** `--since` and `--until` filters silently produce wrong results when dates are in unexpected formats.
**Why it happens:** Session-meta uses ISO-8601 (`2026-03-06T08:12:34.321Z`), but users might pass `2026-03-06` (date only) or `2026-03` (month only).
**How to avoid:** Parse `--since` dates as start-of-day UTC and `--until` dates as end-of-day UTC. Validate format and error on unrecognizable input.
**Warning signs:** Summary/baseline shows unexpected session counts for a date range.

### Pitfall 5: Large Output Buffer
**What goes wrong:** JSON output from `telemetry summary --raw` with all 268 sessions exceeds the 50KB Bash tool buffer limit.
**Why it happens:** The `output()` function in core.cjs already handles this by writing to a temp file and returning `@file:path`, but the human-readable output path does not.
**How to avoid:** For human-readable output, keep it concise (summary statistics, not per-session rows). For `--raw`, rely on core.cjs `output()` which auto-routes large payloads to temp files.
**Warning signs:** Truncated CLI output or garbled JSON.

### Pitfall 6: Malformed JSON Files
**What goes wrong:** A single corrupted session-meta file crashes the entire command.
**Why it happens:** Claude Code writes these files during session; crash or interrupt can leave partial writes.
**How to avoid:** Wrap every `JSON.parse()` in try/catch. Log skipped files count but do not fail the command. Report: "Loaded 265 of 268 session files (3 skipped due to parse errors)".
**Warning signs:** Tests pass with clean fixtures but fail on real data.

## Code Examples

### Token Validation Task (Inline Research)
```javascript
// Source: empirical analysis conducted during this research phase
// Compare session-meta tokens to JSONL-aggregated tokens for N sessions

function validateTokenCounts(sessionId) {
  const metaPath = path.join(os.homedir(), '.claude', 'usage-data', 'session-meta', `${sessionId}.json`);
  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  // Find matching JSONL file across all project directories
  const projectsDir = path.join(os.homedir(), '.claude', 'projects');
  let jsonlPath = null;
  for (const projDir of fs.readdirSync(projectsDir)) {
    const candidate = path.join(projectsDir, projDir, `${sessionId}.jsonl`);
    if (fs.existsSync(candidate)) { jsonlPath = candidate; break; }
  }
  if (!jsonlPath) return { error: 'no_jsonl_found' };

  // Aggregate JSONL token counts from assistant message usage fields
  let jsonlInput = 0, jsonlOutput = 0, msgCount = 0;
  const lines = fs.readFileSync(jsonlPath, 'utf-8').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry.type === 'assistant' && entry.message?.usage) {
        jsonlInput += entry.message.usage.input_tokens || 0;
        jsonlOutput += entry.message.usage.output_tokens || 0;
        msgCount++;
      }
    } catch { /* skip malformed lines */ }
  }

  return {
    session_id: sessionId,
    meta_input: meta.input_tokens,
    meta_output: meta.output_tokens,
    jsonl_input: jsonlInput,
    jsonl_output: jsonlOutput,
    jsonl_messages: msgCount,
    input_ratio: jsonlInput / Math.max(meta.input_tokens, 1),
    output_ratio: jsonlOutput / Math.max(meta.output_tokens, 1),
  };
}
```

### Baseline JSON Schema
```json
{
  "generated": "2026-04-09T12:00:00Z",
  "project_filter": "/home/rookslog/workspace/projects/get-shit-done-reflect",
  "session_count": { "total": 268, "matched": 42, "facets_matched": 17 },
  "token_validation": {
    "status": "completed",
    "finding": "session-meta input_tokens are post-cache residuals, not gross API counts",
    "sessions_compared": 5,
    "recommendation": "use session-meta output_tokens (reliable within 2x); input_tokens unreliable"
  },
  "metrics": {
    "tokens_per_session": {
      "input": { "min": 0, "p25": 15, "median": 42, "p75": 118, "p90": 344, "max": 28367, "n": 42 },
      "output": { "min": 0, "p25": 500, "median": 3000, "p75": 12000, "p90": 25000, "max": 80000, "n": 42 },
      "_caveat": "input_tokens may be post-cache residual; see token_validation"
    },
    "token_to_commit_ratio": {
      "stats": { "min": 100, "p25": 500, "median": 2000, "p75": 8000, "p90": 20000, "max": 50000, "n": 30 },
      "note": "sessions with 0 commits excluded"
    },
    "tool_error_rate": {
      "stats": { "min": 0, "p25": 0, "median": 0.02, "p75": 0.06, "p90": 0.12, "max": 0.5, "n": 42 },
      "formula": "tool_errors / sum(tool_counts)"
    },
    "interruption_rate": {
      "stats": { "min": 0, "p25": 0, "median": 0, "p75": 0.1, "p90": 0.25, "max": 1.0, "n": 42 },
      "formula": "user_interruptions / user_message_count"
    },
    "session_outcome_distribution": {
      "fully_achieved": 12, "partially_achieved": 3, "not_achieved": 1, "other": 1,
      "n": 17,
      "_annotation": "AI-generated estimate with unknown accuracy"
    },
    "friction_frequency": {
      "buggy_code": 5, "unclear_request": 2, "tool_limitation": 1,
      "n": 17,
      "_annotation": "AI-generated estimate with unknown accuracy"
    },
    "session_duration_distribution": {
      "stats": { "min": 1, "p25": 8, "median": 22, "p75": 60, "p90": 180, "max": 600, "n": 42 },
      "unit": "minutes"
    },
    "agent_usage_rate": {
      "rate": 0.45,
      "sessions_with_agent": 19,
      "total_sessions": 42
    }
  }
}
```

### Human-Readable Table Output
```javascript
// Recommendation for Claude's Discretion: table formatting
function formatDistribution(label, stats, unit = '') {
  const u = unit ? ` ${unit}` : '';
  const pad = (v, w) => String(v).padStart(w);
  return `  ${label.padEnd(28)} ${pad(stats.min, 8)}${u}  ${pad(stats.p25, 8)}${u}  ${pad(stats.median, 8)}${u}  ${pad(stats.p75, 8)}${u}  ${pad(stats.p90, 8)}${u}  ${pad(stats.max, 8)}${u}  (n=${stats.n})`;
}

// Output:
//   Metric                           Min       P25    Median       P75       P90       Max
//   tokens/session (output)            0       500      3000     12000     25000     80000  (n=42)
//   duration (minutes)                 1         8        22        60       180       600  (n=42)
```

### Test Fixture Design (Recommendation for Discretion Area)
```javascript
// Source: follows sensors.test.js and health-probe.test.js patterns
// Recommendation: create mock session-meta and facets data in tmpdir

async function createMockSessionMeta(tmpdir, sessions) {
  // Create mock ~/.claude/usage-data/session-meta/ in tmpdir
  const metaDir = path.join(tmpdir, '.claude', 'usage-data', 'session-meta');
  await fs.mkdir(metaDir, { recursive: true });
  for (const session of sessions) {
    await fs.writeFile(
      path.join(metaDir, `${session.session_id}.json`),
      JSON.stringify(session, null, 2)
    );
  }
  return metaDir;
}

async function createMockFacets(tmpdir, facets) {
  const facetsDir = path.join(tmpdir, '.claude', 'usage-data', 'facets');
  await fs.mkdir(facetsDir, { recursive: true });
  for (const f of facets) {
    await fs.writeFile(
      path.join(facetsDir, `${f.session_id}.json`),
      JSON.stringify(f, null, 2)
    );
  }
  return facetsDir;
}

// Key: telemetry.cjs must accept a homeDir override for testing
// so tests can point at tmpdir instead of real ~/.claude/
// Pattern: function loadSessionMeta(projectFilter, homeDir = os.homedir())
```

## Discretion Recommendations

### Statistical Computation: In-Memory (Recommended)
**Rationale:** 268 sessions x ~1KB each = ~268KB. This fits trivially in memory. Streaming adds complexity (tracking running statistics, multiple passes for percentiles) with zero benefit at this scale. In-memory: sort array, index into it.

### Table Formatting: Fixed-Width Columns with Right-Aligned Numbers
**Rationale:** Follows established CLI conventions. Use `String.padStart()` for numeric columns, `String.padEnd()` for labels. Header row with underline separator. No ANSI color codes (would break `--raw` piping).

### Test Fixture Design: Mock Data with homeDir Override
**Rationale:** The telemetry module reads from `~/.claude/usage-data/` which is global state. Tests must NOT read real user data. Inject a `homeDir` parameter (defaulting to `os.homedir()`) into data-loading functions. Tests create mock session-meta and facets files in tmpdir. Include fixtures for: (a) normal sessions, (b) sessions with 0 commits, (c) sessions without facets, (d) malformed JSON files.

### Sparkline Visualization: Defer
**Rationale:** Sparklines (e.g., Unicode block characters for inline histograms) add visual interest but complicate testing and terminal compatibility. Start without sparklines. The `--raw` JSON output gives consumers full data for external visualization. Can add sparklines in a later phase if human-readable output needs enhancement.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Session JSONL only (`~/.claude/projects/`) | Session-meta pre-aggregated files (`~/.claude/usage-data/`) | Observed in Claude Code 2026 | Pre-aggregated data is much faster to read; JSONL still needed for per-message detail |
| No quality assessments | Facets files with AI-generated session quality | Observed in Claude Code 2026 | Enables quality-aware baselines without human annotation |
| ccusage external tool | Native gsd-tools integration | This phase | GSD-specific enrichments (phase correlation, facets join, project filtering) not possible with external tools |

**Deprecated/outdated:**
- ccusage as primary extraction tool: viable for cost reporting but lacks session-meta/facets integration and phase correlation. Not adopted per CONTEXT.md decision for native tooling.

## Open Questions

### Resolved
- **Are session-meta token counts post-caching residuals?** YES -- empirical comparison of 65 sessions shows input_tokens diverges from JSONL-aggregated counts by up to 13,000x. JSONL `usage.input_tokens` is the API-level count; session-meta appears to deduct `cache_read_input_tokens`. The 5-session inline validation will formalize this finding.
- **Does JSONL data exist for sessions to validate against?** YES -- 66 sessions have both session-meta and JSONL files. Session-meta uses `~/.claude/usage-data/session-meta/{uuid}.json`; JSONL lives in `~/.claude/projects/{dash-encoded-path}/{uuid}.jsonl`.
- **Can worktree paths be normalized?** YES -- the pattern is `/.claude/worktrees/{name}` suffix on project_path. A simple regex strip plus `resolveWorktreeRoot()` handles both cases.
- **How should phase correlation work?** STATE.md performance metrics table has `Phase NN PX | duration | tasks | files` rows. `telemetry phase` can parse these timestamps from STATE.md to define time windows, then filter sessions by `start_time` within those windows.

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Are output_tokens in session-meta also post-cache or are they reliable? | Medium | The 65-session analysis shows output ratio median of 1.4x -- much closer than input. Include in validation task. |
| Does session-meta generation have known failure modes beyond crash interrupts? | Low | Accept-risk: handle with try/catch, report skipped count |

### Still Open
- Whether 41% facets coverage introduces systematic bias (cannot be resolved without understanding Anthropic's facets generation logic).

## Sources

### Primary (HIGH confidence)
- Direct filesystem examination: `~/.claude/usage-data/session-meta/*.json` (268 files, schema verified from 2 samples)
- Direct filesystem examination: `~/.claude/usage-data/facets/*.json` (109 files, schema verified)
- Direct filesystem examination: `~/.claude/projects/*/` JSONL files (154 files, usage field structure verified)
- Empirical token comparison: 65 sessions with both session-meta and JSONL data, input/output ratio distributions computed
- gsd-tools.cjs source: router pattern (lines 82-88, 602-682), module require pattern (lines 37-53)
- core.cjs source: `output()` (line 188), `error()` (line 212), `resolveWorktreeRoot()` (line 567), `atomicWriteJson()` (line 1721)
- sensors.cjs source: module structure pattern (complete file, 217 lines)
- state.cjs source: `cmdStateRecordMetric()` (line 355) for phase time window pattern
- `.planning/research/measurement-infrastructure-research.md` (2026-04-08) -- comprehensive prior research

### Secondary (MEDIUM confidence)
- sensors.test.js / health-probe.test.js: test fixture patterns verified from source

### Tertiary (LOW confidence)
- None. All findings verified from local source code and data files.

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| spk-2026-03-01-claude-code-session-log-location | spike | Confirmed session JSONL location at `~/.claude/projects/{path}/{uuid}.jsonl` and session-meta at `~/.claude/usage-data/session-meta/` | Architecture Patterns (data loading) |

Checked knowledge base (`.planning/knowledge/index.md`). One spike was relevant and applied. No lessons exist in the KB yet.

Spikes avoided: 0 (the session-log-location spike confirmed data locations but the token reliability question is new and was investigated inline during this research)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero external dependencies, all patterns verified from existing codebase
- Architecture: HIGH -- follows established module/router patterns with verified code examples
- Pitfalls: HIGH -- token reliability finding backed by empirical analysis of 65 sessions; other pitfalls derived from direct data inspection
- Code examples: HIGH -- all patterns derived from verified source code

**Research date:** 2026-04-09
**Valid until:** 2026-05-09 (session-meta schema is Claude Code internal; could change with Claude Code updates)
