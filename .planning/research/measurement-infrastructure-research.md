# Measurement Infrastructure Research: v1.20

**Date:** 2026-04-08
**Mode:** Custom Research (Ecosystem + Feasibility hybrid)
**Domains:** Token/telemetry extraction, prediction frameworks, parallel execution, STATE.md conflict resolution
**Overall confidence:** MEDIUM-HIGH (strong on extraction tooling and data schemas; lower on prediction framework philosophy, which is inherently open-ended)

---

## 1. Session-Meta Schema (Documented From Actual Files)

268 session-meta files exist at `~/.claude/usage-data/session-meta/*.json`. Schema confirmed from two files with differing session profiles (one multi-tool execution, one short deliberation):

```json
{
  "session_id": "uuid",
  "project_path": "/absolute/path/to/project",
  "start_time": "ISO-8601",
  "duration_minutes": 513,
  "user_message_count": 23,
  "assistant_message_count": 84,
  "tool_counts": {
    "ToolSearch": 4, "Bash": 28, "Read": 8,
    "Agent": 4, "Glob": 4, "Edit": 3, "Grep": 2
  },
  "languages": { "Markdown": 9, "YAML": 2 },
  "git_commits": 1,
  "git_pushes": 2,
  "input_tokens": 109,
  "output_tokens": 12189,
  "first_prompt": "/gsd:execute-phase 44",
  "user_interruptions": 0,
  "user_response_times": [51.635, 185.177, ...],
  "tool_errors": 3,
  "tool_error_categories": { "Command Failed": 3 },
  "uses_task_agent": true,
  "uses_mcp": false,
  "uses_web_search": false,
  "uses_web_fetch": false,
  "lines_added": 12,
  "lines_removed": 12,
  "files_modified": 2,
  "message_hours": [3, 3, 3, ..., 11, 11],
  "user_message_timestamps": ["ISO-8601", ...]
}
```

**Key observations:**
- `input_tokens`/`output_tokens` appear to be aggregate counts but values are suspiciously low in some sessions (109 input for 23 user messages / 84 assistant messages). This may represent API-level counts after caching, or there may be a data quality issue. Needs validation spike.
- `user_interruptions` is a first-class metric -- the most directly useful behavioral signal.
- `user_response_times` captures wait-between-turns in seconds -- interpretable with context but ambiguous alone.
- `tool_counts` gives per-tool attribution at the session level, not per-message.
- `message_hours` gives temporal distribution within a session but only hour-of-day, not duration-per-turn.
- `project_path` enables project-level aggregation and can include worktree paths (observed: `.../.claude/worktrees/gsdr-renaming`).

## 2. Facets Schema (Previously Uninventoried)

109 facets files at `~/.claude/usage-data/facets/*.json` (41% coverage of 268 sessions). AI-generated session quality summaries:

```json
{
  "underlying_goal": "Execute phase 44 of a namespace renaming project...",
  "goal_categories": { "execute_workflow_phase": 1, "create_and_merge_pr": 1, ... },
  "outcome": "fully_achieved",
  "user_satisfaction_counts": { "likely_satisfied": 3, "satisfied": 1 },
  "claude_helpfulness": "essential",
  "session_type": "multi_task",
  "friction_counts": { "buggy_code": 1 },
  "friction_detail": "CI failed because...",
  "primary_success": "multi_file_changes",
  "brief_summary": "User wanted to execute phase 44...",
  "session_id": "uuid"
}
```

**This is a significant find.** The facets data provides:
- **Outcome classification** (`fully_achieved`, `partially_achieved`) -- ready-made quality signal
- **Satisfaction estimation** with granular categories
- **Friction categorization** (`buggy_code`, etc.) with free-text detail
- **Session type classification** (`multi_task`, `exploration`) -- enables per-type analysis
- **Goal categorization** as a bag-of-categories with counts

**Epistemic caveat:** These are AI-generated assessments, not human annotations. Their accuracy is unknown. They are useful as signals but should not be treated as ground truth for quality. Correlation between facets `outcome` and actual user satisfaction needs empirical validation.

**Implication for tooling:** Any token extraction tool should join session-meta and facets data by session_id to produce enriched reports.

## 3. Token Extraction Tooling Design Comparison

### Option A: Extend gsd-tools with `telemetry` subcommand family

**Architecture:** New `get-shit-done/bin/lib/telemetry.cjs` module with subcommands routed through the existing CLI dispatcher in `gsd-tools.cjs`. Follows the established pattern (sensors.cjs, health-probe.cjs, automation.cjs).

**Proposed subcommands:**

| Subcommand | Purpose | Data Sources |
|-----------|---------|-------------|
| `telemetry summary [--project P] [--since DATE] [--until DATE]` | Session-level token/cost aggregates | session-meta |
| `telemetry session <id>` | Detailed single-session report | session-meta + facets + JSONL |
| `telemetry phase <phase-num>` | Per-phase aggregation | session-meta (time-correlated via STATE.md metrics table) |
| `telemetry enrich <session-id>` | Join session-meta + facets into enriched record | session-meta + facets |
| `telemetry baseline [--project P]` | Compute baseline metrics for comparison | session-meta + facets |

**Advantages:**
- Consistent with project architecture (modular lib/*.cjs pattern)
- No new runtime dependencies
- Available to agents and hooks via the existing CLI interface
- Can use `--raw` flag for machine-readable output (established convention)
- Operates on local files only -- no cloud dependency, works offline
- Phase correlation available because STATE.md performance metrics table has phase/plan/timestamp data

**Disadvantages:**
- Node.js -- JSONL parsing for large files may be slower than specialized tools
- Building and maintaining a pricing table is ongoing overhead (models change frequently)
- Limited to CLI output; no visualization

**Integration points:**
- Router: add `case 'telemetry':` to gsd-tools.cjs switch statement (lines 90+)
- Module: new `get-shit-done/bin/lib/telemetry.cjs` exporting cmd* functions
- Tests: new `tests/unit/telemetry.test.js` using vitest
- Sensors: could feed into `health-probe.cjs` as a "token health" dimension
- State: correlates with `cmdStateRecordMetric()` timestamps in STATE.md

### Option B: Adopt ccusage as external dependency, wrap with gsd-tools

**ccusage** (github.com/ryoppippi/ccusage, TypeScript, pnpm monorepo):
- Reads Claude Code JSONL from `~/.claude/projects/` directly
- Pre-cached pricing data for offline operation
- Multiple report types: daily, monthly, session, 5-hour billing windows
- JSON output mode for machine consumption
- Separate packages for Codex (@ccusage/codex), OpenCode, etc.
- Active development (v17.0.0 as of research date)

**Architecture:** `npx ccusage session --json` piped into gsd-tools for interpretation/correlation.

**Advantages:**
- Mature token parsing and cost calculation already built
- Handles pricing table maintenance (community-maintained)
- Multi-tool support via separate packages
- Visualization built in

**Disadvantages:**
- External dependency (violates zero-dependency philosophy)
- No session-meta or facets integration -- only reads JSONL
- No phase/project correlation -- operates at Claude-session level, not GSD-phase level
- Different data directory assumptions (reads `~/.claude/projects/`, not `~/.claude/usage-data/`)
- Would need wrapper to bridge between ccusage output and gsd-tools internal schema

### Recommendation: Option A (native gsd-tools telemetry module)

**Rationale:** The critical value is not raw token counting (ccusage does well) but the GSD-specific enrichments: phase correlation, facets quality signals, project-path filtering, and integration with STATE.md metrics. ccusage cannot provide these without extensive wrapping that would duplicate effort. The pricing table concern is manageable: start with a static JSON file, update manually per model release, flag staleness.

**Hybrid possibility:** If precise cost calculation proves important, borrow ccusage's pricing data (MIT licensed) as a static import rather than adopting the full tool.

## 4. Baseline Measurement Strategy

### What "baseline" means here

Before any v1.20 intervention, establish quantitative and qualitative reference points so the effect of changes can be assessed. This is not "prove the intervention works" -- it is "know what the system looked like before so you can observe what changed."

### Recommended baseline dimensions (from available data)

| Baseline Metric | Source | Computation | Granularity |
|----------------|--------|-------------|-------------|
| Tokens per session (median, p90) | session-meta | Aggregate input_tokens + output_tokens | per-project |
| Token-to-commit ratio | session-meta | tokens / git_commits (where commits > 0) | per-project |
| Tool error rate | session-meta | tool_errors / sum(tool_counts) | per-project |
| Interruption rate | session-meta | user_interruptions / user_message_count | per-project |
| Session outcome distribution | facets | Count by `outcome` category | per-project |
| Friction frequency | facets | Count by `friction_counts` keys | per-project |
| Session duration distribution | session-meta | Histogram of duration_minutes | per-project |
| Agent usage rate | session-meta | uses_task_agent / total sessions | per-project |

### Baseline implementation

A `telemetry baseline` subcommand that:
1. Reads all session-meta files (268 currently)
2. Left-joins facets data by session_id (109 enriched, 159 metrics-only)
3. Filters by `--project` and `--since`/`--until`
4. Computes distributions (min, p25, median, p75, p90, max) for numeric fields
5. Outputs a `baseline.json` file in `.planning/` for comparison after interventions

This is a passive, post-hoc computation. No new instrumentation needed for the first baseline.

## 5. Prediction Framework: Beyond Quantitative/Qualitative

The milestone context identifies five prediction dimensions: functional, structural, interactional, temporal, and risk. The question is whether this is sufficient.

### Assessment: Five dimensions are sufficient, but need operationalization

The five dimensions cover the space well when understood properly. The risk is not missing dimensions but collapsing dimensions into each other or treating them as a checklist rather than a thinking tool.

### Dimension definitions with operationalization

**1. Functional predictions:** "What will the intervention do?"
- Directly observable behavior changes
- Example: "Adding telemetry subcommand will enable agents to read session cost data"
- Verifiable: Yes/No -- did it do the thing?
- This is the dimension most projects stop at

**2. Structural predictions:** "What becomes possible or impossible?"
- Changes to the space of subsequent actions
- Example: "Exposing session-meta via CLI makes token-aware planning possible for future milestones"
- Verifiable: Post-intervention, can agents/workflows do things they couldn't before?
- Structural predictions often take longer to manifest than functional ones

**3. Interactional predictions:** "How will this combine with other changes?"
- Effects that emerge from combinations, not individual interventions
- Example: "Baseline data + spike design reviewer together enable evidence-grounded design critique"
- Verifiable: Only when both interventions are live
- This is the dimension most often missed -- interventions are evaluated in isolation

**4. Temporal predictions:** "When will effects manifest?"
- Some effects are immediate, some accumulate over sessions, some only appear in retrospect
- Example: "Friction baselines need 10+ sessions after intervention to show meaningful change"
- Verifiable: Only over time windows
- Critical for setting evaluation horizons -- "check after 2 milestones, not 2 phases"

**5. Risk predictions:** "What could degrade?"
- Unintended consequences, performance regression, workflow friction
- Example: "Adding telemetry reporting to session-start hooks could add 200ms latency"
- Verifiable: By monitoring the predicted degradation vector
- Risk predictions should name the specific degradation, not generic "something might break"

### Additional dimension considered and rejected

**6. Epistemic predictions** (considered): "What will we learn?" -- predictions about knowledge state change. Example: "Baselines will reveal whether tool_error_rate correlates with facets friction_counts." This is interesting but collapses into a combination of functional ("we will have the data") and temporal ("we will know after N sessions"). Adding it as a separate dimension risks double-counting.

### Operationalization format

Each v1.20 intervention should document predictions in at least 3 of the 5 dimensions. Not all dimensions are always relevant. The format:

```markdown
## Predictions for [Intervention Name]

**Functional:** [What it will do]
**Structural:** [What it will make possible/impossible]
**Interactional:** [How it combines with X, Y]
**Temporal:** [When effects manifest; evaluation horizon]
**Risk:** [Specific degradation vector; monitoring approach]

**Evaluation criteria:** [How we will know if predictions were accurate]
```

### Confidence calibration

Predictions should carry explicit confidence and the basis for that confidence:
- **Measurement-grounded:** prediction based on data (e.g., "session-meta shows 0 uses of MCP in 200/268 sessions")
- **Interpretation-grounded:** prediction based on reading data with a frame (e.g., "high interruption rate in multi-task sessions suggests user dissatisfaction")
- **Extrapolation-grounded:** prediction based on projecting beyond data (e.g., "if friction_counts correlates with tool_errors, then reducing tool errors will reduce friction")

This three-level confidence framework comes from the spike methodology gap analysis and should apply to intervention predictions as well.

## 6. Parallel Execution: STATE.md Conflict Resolution

### The problem (U57)

STATE.md is a shared mutable file. When parallel worktrees execute phases concurrently, they both update STATUS.md fields (Current Phase, Current Plan, Status, Last Activity, Performance Metrics table, Decisions, Session Continuity). Git merge produces textual conflicts because both sides modified the same lines.

### Approaches assessed

#### Approach 1: Section-partitioned STATE.md with per-worktree files

**Design:** Split STATE.md into:
- `STATE.md` -- read-only coordination file (milestone, project reference, roadmap evolution)
- `.planning/state/{worktree-name}.json` -- per-worktree position, progress, decisions, metrics
- `STATE.md` regenerated from merged per-worktree state files on demand

**How it works:**
1. Each worktree writes to its own `state/{worktree-name}.json` using `writeStateMd()` redirect
2. `resolveWorktreeRoot()` already exists in core.cjs -- extend it to route state writes
3. `state json` and `state load` commands merge all `state/*.json` files for a composite view
4. On merge back to main, per-worktree files are additive (different filenames), no conflicts
5. Performance metrics table becomes an append-log in JSON rather than regex-parsed markdown rows

**Advantages:**
- Eliminates the merge conflict entirely (different files per worktree)
- No locking infrastructure needed
- Backward compatible: if no `state/` directory, falls back to STATE.md
- Leverages existing `resolveWorktreeRoot()` and `atomicWriteJson()` from core.cjs
- Performance metrics are already structured data pretending to be markdown -- moving to JSON is honest

**Disadvantages:**
- STATE.md loses its role as single source of truth for human readers
- Requires regeneration step to produce human-readable composite
- Agents reading STATE.md get stale data unless they use `state json` instead
- Migration effort: current workflows reference STATE.md sections by name

**Confidence:** MEDIUM -- this is the cleanest technical solution but changes a fundamental interface

#### Approach 2: Section-level locking with lock files

**Design:** Use the existing `automation lock/unlock/check-lock` infrastructure (automation.cjs lines 214-290) to gate STATE.md writes by section.

**How it works:**
1. Before writing to STATE.md, acquire a lock: `gsd-tools automation lock state-performance-metrics --ttl 30`
2. Read STATE.md, apply changes, write, release lock
3. Lock files live in `.planning/.state_performance_metrics.lock` (existing convention)
4. If lock is held, wait with exponential backoff (max 5 retries)

**Advantages:**
- Uses existing infrastructure (automation lock/unlock/check-lock already implemented)
- STATE.md remains the single source of truth
- No migration or interface changes
- Familiar pattern (file-based locking is well-understood)

**Disadvantages:**
- Locking does not prevent merge conflicts -- it prevents concurrent writes within a single worktree. Across git worktrees, each worktree has its own `.planning/` directory copy, so the lock files are not shared.
- **This approach does not solve the stated problem.** Git worktrees have independent working directories. Lock files in `.planning/` within worktree A are invisible to worktree B. The conflict happens at git merge time, not at file write time.

**Confidence:** LOW -- **this approach is fundamentally mismatched to the problem**. It solves concurrent-process conflicts within a single worktree but not cross-worktree merge conflicts.

#### Approach 3: Structured JSON state with merge-friendly format

**Design:** STATE.md frontmatter (YAML) already contains structured state. Extend this: move all machine-readable state into the frontmatter, leaving body as human narrative only. Frontmatter fields are key-value pairs that git merges more cleanly than prose sections.

**How it works:**
1. STATE.md frontmatter expanded to include performance metrics as a list:
   ```yaml
   metrics:
     - phase: 53-01
       duration: 4min
       tasks: 2
       files: 3
       timestamp: 2026-03-28
   ```
2. Each worktree appends new entries with different phase numbers
3. Git merge on YAML lists with non-overlapping entries resolves automatically (appends from both sides)
4. If two worktrees modify the same scalar field (e.g., `status`), git correctly flags the conflict -- but these are rare and resolvable because only one worktree should be "active" at a time

**Advantages:**
- Minimal change to existing interface (STATE.md remains single file)
- `syncStateFrontmatter()` already rebuilds frontmatter on every write
- Metrics as YAML list instead of markdown table enables clean merge (appends from different phases)
- Scalar conflicts (status, current_phase) are legitimate conflicts that should be flagged

**Disadvantages:**
- YAML frontmatter has practical size limits -- 200+ metric rows in frontmatter is unwieldy
- Narrative sections (Decisions, Blockers, Session Continuity) still conflict if both worktrees modify them
- YAML list merging is only conflict-free when entries are truly non-overlapping
- Requires `buildStateFrontmatter()` to be extended significantly

**Confidence:** MEDIUM -- practical for near-term parallel execution (2-3 worktrees) but will not scale to many concurrent writers

#### Approach 4: Append-only operation log (recommended)

**Design:** STATE.md remains as the current-state document, regenerated from an append-only log. Instead of mutating STATE.md directly, all state changes are written as timestamped entries to `.planning/state-log/`. STATE.md is materialized from the log.

**How it works:**
1. State changes write to `.planning/state-log/{timestamp}-{worktree}-{operation}.json`:
   ```json
   {
     "timestamp": "2026-04-08T15:30:00Z",
     "worktree": "main",
     "operation": "record-metric",
     "data": { "phase": "55-01", "duration": "4min", "tasks": 2, "files": 3 }
   }
   ```
2. Each entry is a separate file -- no two worktrees write the same file
3. `state load` / `state json` reads all log entries, sorts by timestamp, materializes current state
4. `state update STATUS "In progress"` writes a log entry, then re-materializes STATE.md
5. On git merge, the `state-log/` directory has only additive changes (new files from each side)
6. STATE.md may have conflicts, but it is a materialized view -- regenerate after merge

**Advantages:**
- Completely eliminates merge conflicts on the state log (append-only, separate files)
- STATE.md conflicts are non-blocking -- just regenerate
- Full audit trail of all state changes with timestamps and worktree attribution
- Naturally supports temporal queries ("what was the state at time T?")
- Compatible with CRDT principles (each writer creates independent events, merge is union)

**Disadvantages:**
- More complex implementation than any other option
- Directory accumulates files over project lifetime (needs pruning/archival strategy)
- Materialization step adds latency to state reads (mitigated by caching)
- All existing `writeStateMd()` callers need to route through log-write-then-materialize

**Confidence:** MEDIUM-HIGH -- this is the correct architecture if parallel execution becomes a regular workflow. Overkill if parallel execution remains rare.

### Recommendation

**For v1.20:** Approach 1 (section-partitioned with per-worktree files) as the pragmatic first step. It is simple, uses existing infrastructure (`resolveWorktreeRoot`, `atomicWriteJson`), and solves the immediate conflict problem without a full event-sourcing rewrite.

**For v1.21+:** If parallel execution becomes routine, migrate toward Approach 4 (append-only log). The per-worktree partition is a stepping stone -- per-worktree JSON files are already individual event files, just not append-only yet.

**Not recommended:** Approach 2 (locking) because it does not address the actual problem. Approach 3 (YAML expansion) because it trades one conflict surface for another without structural improvement.

## 7. Integration Points with Existing gsd-tools Architecture

### CLI Router Integration

```
gsd-tools.cjs (line 90 switch statement)
  +-- case 'telemetry':
        +-- subcommand 'summary' -> telemetry.cmdTelemetrySummary(cwd, options, raw)
        +-- subcommand 'session' -> telemetry.cmdTelemetrySession(cwd, sessionId, raw)
        +-- subcommand 'phase'   -> telemetry.cmdTelemetryPhase(cwd, phaseNum, raw)
        +-- subcommand 'baseline'-> telemetry.cmdTelemetryBaseline(cwd, options, raw)
        +-- subcommand 'enrich'  -> telemetry.cmdTelemetryEnrich(cwd, sessionId, raw)
```

### Module Pattern

Following `automation.cjs` and `sensors.cjs`:
- `const telemetry = require('./lib/telemetry.cjs');` at top of gsd-tools.cjs
- Functions follow `cmdTelemetry{Subcommand}(cwd, options, raw)` convention
- Uses `output()` and `error()` from core.cjs
- Uses `atomicWriteJson()` for baseline file writes

### Data Directory Resolution

Session-meta and facets are in `~/.claude/usage-data/` (global, not per-project). The telemetry module needs:
- `os.homedir()` + `.claude/usage-data/session-meta/` for session-meta
- `os.homedir()` + `.claude/usage-data/facets/` for facets
- Project filtering via `session_meta.project_path` field matching `cwd` or `resolveWorktreeRoot(cwd)`

### Sensor Pipeline Connection

Telemetry can feed into the health-probe pipeline:
- `health-probe token-health` -- a new probe dimension using telemetry baselines
- Triggered by `gsd-tools health-probe signal-metrics` pattern
- Alerts when current session's token usage deviates significantly from baseline

### Bridge File Enhancement

The statusline hook (`hooks/gsd-statusline.js`) already writes bridge files. Extend to capture:
- `cost.total_cost_usd` (reportedly available in statusline payload -- needs spike E validation)
- `rate_limits` fields (needs spike E validation)
- Current effort level (from `~/.claude/settings.json`)

This requires modifying `gsd-statusline.js` lines 39-47 to write additional fields to the bridge JSON.

### STATE.md Metrics Correlation

STATE.md performance metrics table (lines 65-106 of current STATE.md) has per-phase timing data that can be correlated with session-meta timestamps:
- Match `session_meta.start_time` ranges to phase execution windows
- Use `session_meta.project_path` to filter to this project
- `cmdStateRecordMetric()` already writes phase/plan/duration/tasks/files -- link these to token data

## 8. Cross-Platform Normalization Schema

Claude Code and Codex CLI expose different telemetry structures. A common schema is needed for unified analysis:

```json
{
  "session_id": "string",
  "platform": "claude-code | codex-cli",
  "project_path": "string",
  "start_time": "ISO-8601",
  "duration_minutes": "number",
  "tokens": {
    "input": "number",
    "output": "number",
    "cache_read": "number | null",
    "cache_creation": "number | null",
    "reasoning": "number | null"
  },
  "interactions": {
    "user_messages": "number",
    "assistant_messages": "number",
    "user_interruptions": "number | null",
    "user_response_times": "[number] | null"
  },
  "tools": {
    "total_calls": "number",
    "errors": "number",
    "per_tool": "{ [tool]: count }",
    "error_categories": "{ [category]: count } | null"
  },
  "code_impact": {
    "commits": "number",
    "lines_added": "number",
    "lines_removed": "number",
    "files_modified": "number"
  },
  "quality": {
    "outcome": "string | null",
    "satisfaction": "string | null",
    "friction_types": "[string] | null",
    "session_type": "string | null"
  },
  "effort_level": "string | null",
  "model": "string | null"
}
```

**Key normalization decisions:**
- `tokens.reasoning` is Codex-only (reasoning_output_tokens); null for Claude Code
- `interactions.user_interruptions` is Claude Code only; null for Codex
- `quality.*` fields come from facets (Claude Code only); null for Codex unless we build equivalent
- `effort_level` inferred from settings.json (Claude) or turn_context (Codex)
- `model` inferred from JSONL assistant entries (Claude) or turn_context (Codex)

**Constraint from MILESTONE-CONTEXT.md:** "Don't design token tooling around current pricing." The schema excludes cost fields -- cost calculation is a presentation-layer concern applied at report time with a versioned pricing table.

---

## Beyond Formal Scope

### Observation 1: Facets data is an underexplored gold mine

The 109 facets files contain AI-generated quality assessments with structured outcome, satisfaction, friction, and session type classifications. No current tooling reads these. Joining facets + session-meta produces an enriched dataset that could answer the telemetry survey's "Still Open" question 1 ("What metrics are actually predictive of quality?") -- because facets provide the quality labels and session-meta provides the metric features. A correlation analysis between session-meta features (tool_error_rate, interruption_rate, duration_minutes) and facets outcomes (fully_achieved vs partially_achieved) would be the highest-value initial analysis.

### Observation 2: Token counts in session-meta may be unreliable

Session `00d25c0f` shows 109 input_tokens for 23 user messages and 84 assistant messages across 513 minutes. This is implausibly low -- a single user message with a `/gsd:execute-phase` command would generate more than 109 input tokens when system prompts are included. The session-meta token counts may use different accounting than the per-message JSONL counts. Any extraction tooling must validate session-meta tokens against JSONL-aggregated tokens for the same session before trusting session-meta as the primary source.

### Observation 3: Clash tool for worktree conflict detection

Clash (github.com/clash-sh/clash) is a Rust-based read-only conflict simulator for git worktrees. It uses `git merge-tree` via the `gix` library to detect would-conflict files across worktree pairs without performing actual merges. If v1.20 implements parallel phase execution, integrating clash-style detection before merge would catch STATE.md conflicts early. However, this is a detection tool, not a resolution tool -- it surfaces conflicts but does not fix them. The resolution strategy (Approaches 1/4 above) is still needed.

### Observation 4: The bridge file is a mature, proven integration point

The `claude-ctx-{session}.json` bridge file pattern (written by gsd-statusline.js, read by automation.cjs resolve-level, read by hooks/gsd-context-monitor.js) is the only reliable real-time data channel between Claude Code's statusline and the GSD harness. It is battle-tested across 268 sessions. Any real-time telemetry (cost, rate limits, effort) should extend the bridge file, not create new channels. The bridge file's 120-second staleness threshold (from 53-CONTEXT.md) is well-calibrated for turn-level monitoring.

### Observation 5: ccusage reads different data than what we need

ccusage reads JSONL from `~/.claude/projects/` for per-message token attribution. Session-meta lives in `~/.claude/usage-data/session-meta/` with pre-aggregated data. These are complementary data sources with different granularity. For v1.20 baselines, session-meta is sufficient. For deep per-message analysis (e.g., "which tool calls consume the most tokens?"), JSONL parsing would be needed later. Start with the cheaper data source.

### Observation 6: The prediction framework maps onto existing spike methodology

The five prediction dimensions (functional, structural, interactional, temporal, risk) are not just for interventions -- they are also the dimensions that spike DESIGN.md should use for hypotheses. The spike methodology gap analysis (gap 2.2: metrics not challenged, gap 2.4: DECISION.md pressures closure) could be partially addressed by requiring spike designs to state predictions in these dimensions and evaluating DECISION.md against them. This is an interactional prediction: the measurement infrastructure and the spike methodology overhaul reinforce each other.

### Observation 7: writeStateMd has no concurrency protection

`writeStateMd()` in state.cjs does a synchronous read-modify-write cycle (`readFileSync` -> transform -> `writeFileSync`). Within a single process this is safe (Node.js is single-threaded). But if two Claude Code sessions in different terminals both call `gsd-tools state update` simultaneously on the same worktree, the last writer wins. This is a separate problem from cross-worktree merge conflicts (U57) but compounds it. The `atomicWriteJson()` function in core.cjs writes to a temp file then renames, which provides crash safety but not concurrent-write safety.

### Observation 8: Worktree path in session-meta enables automatic project filtering

Session-meta `project_path` includes worktree paths like `/home/rookslog/workspace/projects/get-shit-done-reflect/.claude/worktrees/gsdr-renaming`. The telemetry module should use `resolveWorktreeRoot()` on `project_path` values to normalize worktree paths to their main project root, enabling proper aggregation of sessions that ran in different worktrees of the same project.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|-----------|-------|
| Session-meta schema | HIGH | Documented from actual files, 2 samples compared |
| Facets schema | HIGH | Documented from actual files, previously uninventoried |
| Extraction tooling design (Option A) | HIGH | Follows established gsd-tools patterns, integration points verified in code |
| ccusage comparison | MEDIUM | Based on GitHub README + community descriptions, not code review |
| Baseline measurement strategy | MEDIUM-HIGH | Grounded in available data; metric-to-quality correlation is empirical question |
| Prediction framework dimensions | MEDIUM | Grounded in milestone context; operationalization is novel (no existing framework to verify against) |
| Parallel execution Approach 1 | MEDIUM-HIGH | Uses existing infrastructure; untested in practice |
| Parallel execution Approach 4 | MEDIUM | Sound architecture; implementation complexity uncertain |
| Bridge file extension | MEDIUM | statusline payload fields need spike E validation |
| Token count reliability | LOW | Suspiciously low values observed; needs validation spike |

## Sources

- Session-meta files: `~/.claude/usage-data/session-meta/*.json` (268 files examined)
- Facets files: `~/.claude/usage-data/facets/*.json` (109 files examined)
- gsd-tools.cjs: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/gsd-tools.cjs`
- state.cjs: `get-shit-done/bin/lib/state.cjs` (writeStateMd, cmdStateRecordMetric)
- automation.cjs: `get-shit-done/bin/lib/automation.cjs` (lock/unlock infrastructure)
- core.cjs: `get-shit-done/bin/lib/core.cjs` (resolveWorktreeRoot, atomicWriteJson)
- gsd-statusline.js: `hooks/gsd-statusline.js` (bridge file writer)
- Telemetry survey: `.planning/audits/session-log-audit-2026-04-07/reports/telemetry-survey.md`
- Opus synthesis finding U57: `.planning/audits/session-log-audit-2026-04-07/reports/opus-synthesis.md`
- v1.17+ roadmap deliberation: `.planning/deliberations/v1.17-plus-roadmap-deliberation.md`
- Spike methodology gap analysis: `.planning/research/spike-methodology-gap-analysis.md`
- ccusage: https://github.com/ryoppippi/ccusage
- Clash: https://github.com/clash-sh/clash
- Claude Code worktree patterns: https://claudefa.st/blog/guide/development/worktree-guide
- Git worktree parallel AI agents: https://www.augmentcode.com/guides/git-worktrees-parallel-ai-agent-execution
- CRDT reference: https://crdt.tech/
- Multi-agent state management: https://oboe.com/learn/advanced-claude-code-mcp-and-agent-orchestration-1waads5/state-management-patterns-2
