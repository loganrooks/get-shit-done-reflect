# Lane 1: Claude Code Session-Meta Inventory
**Audit date:** 2026-04-15
**Corpus path:** `~/.claude/usage-data/session-meta/`
**Related directory:** `~/.claude/usage-data/facets/` (companion LLM-annotated files — covered in Section 7)

---

## 1. Corpus Overview

### File count and date range

**Sampled:** 265 successfully parsed files out of 268 total (3 malformed JSON — see Anomalies, Section 6).

**File system timestamps:** Two batch dates only — `Mar 8 16:08` (127 files) and `Mar 15 18:02–18:16` (143 files). These filesystem timestamps appear to reflect when the corpus was copied or initialized on this machine, NOT when sessions occurred.

**Actual session date range (via `start_time` field):** `2026-01-28T20:35:12Z` to `2026-03-15T22:02:34Z` — approximately 46 days of session history.

**Epistemic status:** Verified-across-corpus (programmatic scan of all 265 parseable files).

### File sizes

- Range: 828 bytes (minimal sessions) to ~4,200 bytes (very long sessions with many tool calls and timestamps)
- Median size: approximately 1,100 bytes
- Size correlates with: `user_message_count` (more timestamps = more bytes), and `tool_counts` object breadth

### Schema stability

**Finding:** The schema is completely stable across the entire 46-day range. Every parseable file contains the exact same 26 top-level fields with no additions, removals, or type changes detected.

**Epistemic status:** Verified-across-corpus. Programmatic scan enumerated all unique top-level field names across all 265 files. Only one set of 26 fields appears — no versioning, no optional-late-addition fields, no date-correlated schema evolution.

The earliest session (`641747b2`, 2026-01-28) has identical structure to the most recent (`~2026-03-15`). Schema was already fully formed at the beginning of the corpus.

---

## 2. Complete Field Inventory

### Session identity fields

| Field | Type | Example value | Coverage | Reliability | Serves loop |
|-------|------|---------------|----------|-------------|-------------|
| `session_id` | string (UUID v4) | `"00d25c0f-a97d-4181-a276-ca23a35dcc9d"` from `00d25c0f...json` | 265/265 (100%) | Runtime-derived (assigned at session start) | Intervention lifecycle, Cross-session patterns |
| `project_path` | string (absolute path) | `"/home/rookslog/workspace/projects/get-shit-done-reflect"` from `12641e04...json` | 265/265 (100%) | Runtime-derived (working directory at invocation) | Cross-session patterns, Pipeline integrity |
| `start_time` | string (ISO 8601 UTC) | `"2026-03-08T23:33:15.404Z"` from `12641e04...json` | 265/265 (100%) | Runtime-derived (wall clock at session start) | Intervention lifecycle, Signal quality |

**Notes on `project_path`:**
- 13 unique project paths observed across corpus. Top paths: `/Users/rookslog/Development/get-shit-done-reflect` (103 sessions — Mac/apollo machine), `/home/rookslog/workspace/projects/get-shit-done-reflect` (31 — this machine), `/home/rookslog/workspace/projects/arxiv-sanity-mcp` (26), `/home/rookslog/workspace/projects/scholardoc` (25).
- Path distinguishes machine origin (Mac `/Users/` vs Linux `/home/`) — useful for cross-runtime comparison (Lane 3 relevance).
- Worktree sessions appear as subpaths: `/home/rookslog/workspace/projects/get-shit-done-reflect/.claude/worktrees/gsdr-renaming` (3 sessions).
- A session at `/home/rookslog` (root home directory) indicates invocation outside any project (21 sessions).
- **No project name normalization** — path is raw. GSD project identity requires string parsing.

**Notes on `session_id`:**
- Filename IS the session_id (e.g., `00d25c0f-a97d-4181-a276-ca23a35dcc9d.json`). The field is also written inside the JSON — fully redundant but allows linking across data sources.
- The same session_id appears in `~/.claude/usage-data/facets/` (companion LLM annotation).
- **No parent session field.** Session linkage across `/clear` boundaries is impossible from this data alone.

### Timing and duration fields

| Field | Type | Example value | Coverage | Reliability | Serves loop |
|-------|------|---------------|----------|-------------|-------------|
| `duration_minutes` | number (integer) | `920` from `12641e04...json` | 265/265 (100%) | Runtime-derived (wall-clock elapsed) | Agent performance, Signal quality |
| `message_hours` | array of integers (0–23) | `[19,19,19,19,19,19,19,19,10,10,10]` from `12641e04...json` | 265/265 (100%) | Runtime-derived (hour-of-day for each user message) | Cross-session patterns, Signal quality |
| `user_message_timestamps` | array of ISO 8601 strings | `["2026-03-08T23:33:16.111Z","2026-03-08T23:33:15.402Z",...]` from `12641e04...json` | 265/265 (100%) | Runtime-derived (wall clock per user message) | Intervention lifecycle, Signal quality, Cross-session patterns |
| `user_response_times` | array of floats (seconds) | `[10.226, 10.227, 523.881, 523.881, 465.544]` from `12641e04...json` | 265/265 (100%, but empty array in 144 sessions) | Runtime-derived (elapsed seconds between assistant message and next user message) | Agent performance, Cross-session patterns |

**Notes on duration/timing:**
- `duration_minutes` range: 0 to 19,996 (minimum 0 = sessions under 30 seconds; maximum ~14 days wall-clock, which indicates session left open across days). Median: 16 minutes. Mean: 249 minutes (heavily skewed by long-open sessions).
- `duration_minutes` represents wall-clock elapsed time, NOT active work time. A session open for 14 days does not mean 14 days of work.
- `message_hours` array length always equals `user_message_count` (verified: 0 mismatches across 265 files). Values are the UTC hour of each user message (0–23, all 24 values observed). Useful for time-of-day clustering.
- `user_message_timestamps` length always equals `user_message_count` (verified: 0 mismatches). These are the same data as `message_hours` but at full precision. **Anomaly:** In many sessions the first two timestamps are nearly identical (same millisecond or within 1ms) and both match the `start_time`. This suggests Claude Code injects a system message at session start that counts as a "user message" alongside the actual first user turn. The second or third timestamp is the real first user message.
- `user_response_times` is non-empty in 121/265 sessions (46%). The 144 sessions with empty arrays appear to be sessions with only one user turn (no response opportunity) or very short automated command sessions. When non-empty, values range from 2 seconds to 3,480 seconds (58 minutes). Units are confirmed seconds (not milliseconds).

### Message count fields

| Field | Type | Example value | Coverage | Reliability | Serves loop |
|-------|------|---------------|----------|-------------|-------------|
| `user_message_count` | number (integer) | `11` from `12641e04...json` | 265/265 (100%) | API-counted | Agent performance, Cross-session patterns |
| `assistant_message_count` | number (integer) | `108` from `12641e04...json` | 265/265 (100%) | API-counted | Agent performance |

**Notes:**
- `user_message_count` includes the injected system message at session start (see timestamp anomaly above). Raw "turns" from the human user = `user_message_count - 2` (approximately, due to duplicate-timestamp entries).
- `assistant_message_count` is typically much larger than `user_message_count` because subagent dispatches generate many assistant messages.
- The ratio `assistant_message_count / user_message_count` is a rough proxy for automation depth (how many assistant actions per user request). Sampled range: 1.0 (minimal) to ~27 (heavy automation).

### Token count fields

| Field | Type | Example value | Coverage | Reliability | Serves loop |
|-------|------|---------------|----------|-------------|-------------|
| `input_tokens` | number (integer) | `154` from `12641e04...json` | 265/265 (100%) | **Unknown — see anomaly** | Agent performance |
| `output_tokens` | number (integer) | `14040` from `12641e04...json` | 265/265 (100%) | **Unknown — see anomaly** | Agent performance |

**Critical anomaly — token units are unclear:**

The `input_tokens` field produces suspicious distributions. In session `12641e04` (920 minutes, 11 user messages, 108 assistant messages, 30 Bash calls, 4 Agent dispatches), `input_tokens` = 154. In a real 920-minute Claude Code session with subagent dispatches, actual input token consumption would be hundreds of thousands of tokens. Yet session `b72f9361` (195 minutes, 17 user messages, 149 assistant messages) has `input_tokens` = 28,367 — much more plausible.

Two possible interpretations:
1. **`input_tokens` counts only the user's literal typed text** (not context, not tool outputs, not injected system context). Under this interpretation, "154" means the user typed 154 tokens worth of messages across the session.
2. **The field has inconsistent semantics** across session types — agent-dispatched sessions may account differently than direct-turn sessions.

Evidence supporting interpretation 1: Session `997cf4cd` (8 minutes, 4 user messages, codebase audit prompt) has `input_tokens` = 20,269 and `output_tokens` = 698. A long-form user prompt ("I want you to audit this codebase...") and subsequent instructions could plausibly generate 20k input tokens in the counting scheme, while output_tokens=698 would be suspiciously low for 16 assistant messages unless this also only counts the primary (non-subagent) assistant output.

**Epistemic status: Anomaly — not resolved.** The relationship between these token counts and actual API token consumption (billable tokens) is unknown without access to Claude Code source. Do NOT use these fields as cost proxies without further investigation.

- `input_tokens` range: 0–28,367. Median: 42. Mean: 688.
- `output_tokens` range: 0–96,576. Median: 3,060. Mean: 9,032.
- 23 sessions have both `input_tokens=0` and `output_tokens=0` (minimal/aborted sessions with `first_prompt="No prompt"`).

### Tool usage fields

| Field | Type | Example value | Coverage | Reliability | Serves loop |
|-------|------|---------------|----------|-------------|-------------|
| `tool_counts` | object (tool_name → integer) | `{"Bash":30,"Agent":4,"Read":11,"Grep":8,"Edit":5,...}` from `12641e04...json` | 265/265 (100%, empty object `{}` in minimal sessions) | API-counted (per tool invocation) | Agent performance |
| `tool_errors` | number (integer) | `1` from `12641e04...json` | 265/265 (100%) | Runtime-derived (count of tool call failures) | Agent performance |
| `tool_error_categories` | object (category_name → integer) | `{"File Too Large":1}` from `12641e04...json` | 265/265 (100%, empty object `{}` when no errors) | Runtime-derived (categorized) | Agent performance |

**Notes on `tool_counts`:**

30 distinct tool names observed across the corpus. Most frequent (by sessions):
- `Bash`: 235 sessions (89%)
- `Read`: 196 sessions (74%)
- `Agent`: 88 sessions (33%) — GSD's Task-agent dispatch pattern
- `Glob`: 85 sessions (32%)
- `Edit`: 83 sessions (31%)
- `Grep`: 80 sessions (30%)
- `Write`: 74 sessions (28%)
- `ToolSearch`: 67 sessions (25%)
- `AskUserQuestion`: 64 sessions (24%)
- `Task`: 52 sessions (20%) — appears to be an older name for the same agent tool
- `Skill`: 34 sessions (13%)
- `mcp__sequential-thinking__sequentialthinking`: 30 sessions (11%)
- `TaskCreate`, `WebFetch`, `TaskUpdate`, `TaskOutput`, `mcp__serena__*` — rarer, <15 sessions each
- `WebSearch`: 2 sessions
- `EnterPlanMode`: 1 session
- MCP tools for arxiv-discovery: 1 session (only in the large `280c23e4` session)

The tool_counts object is highly informative for agent performance loops. The presence of `Agent` or `Task` calls confirms subagent dispatch. Tool diversity (number of distinct tools used) can be derived directly.

**Notes on `tool_error_categories`:**

6 error category values observed:
- `Command Failed`: 81 sessions (31%) — bash command returned non-zero
- `Other`: 44 sessions (17%) — catch-all
- `File Not Found`: 18 sessions (7%)
- `User Rejected`: 17 sessions (6%) — user explicitly rejected a tool call
- `File Too Large`: 6 sessions (2%)
- `Edit Failed`: 4 sessions (2%)

Error details beyond the category are NOT stored. The category label is the finest granularity available.

### Boolean capability flags

| Field | Type | Example value | Coverage | Reliability | Serves loop |
|-------|------|---------------|----------|-------------|-------------|
| `uses_task_agent` | boolean | `true` from `12641e04...json` | 265/265 (100%) | Runtime-derived (true if any Agent/Task tool called) | Agent performance |
| `uses_mcp` | boolean | `false` from `12641e04...json` | 265/265 (100%) | Runtime-derived (true if any mcp__ tool called) | Cross-runtime comparison |
| `uses_web_search` | boolean | `false` from `12641e04...json` | 265/265 (100%) | Runtime-derived (true if WebSearch tool called) | Agent performance |
| `uses_web_fetch` | boolean | `false` from `12641e04...json` | 265/265 (100%) | Runtime-derived (true if WebFetch tool called) | Agent performance |

**Notes:**
- `uses_task_agent` = true in approximately 170/265 sessions (64%). This is the GSD harness's primary execution mechanism.
- `uses_mcp` = true in ~20 sessions (8%). When true, MCP tool names appear in `tool_counts` with `mcp__` prefix, revealing which MCP server was used.
- `uses_web_search` and `uses_web_fetch` are both true in only 2 and 11 sessions respectively. The `84df562a` session (claude-notify development) shows both true with corresponding `WebSearch` and `WebFetch` entries in `tool_counts`.

### Code change fields

| Field | Type | Example value | Coverage | Reliability | Serves loop |
|-------|------|---------------|----------|-------------|-------------|
| `lines_added` | number (integer) | `7` from `12641e04...json` | 265/265 (100%) | Runtime-derived (git diff line count) | Agent performance, Pipeline integrity |
| `lines_removed` | number (integer) | `5` from `12641e04...json` | 265/265 (100%) | Runtime-derived (git diff line count) | Agent performance |
| `files_modified` | number (integer) | `2` from `12641e04...json` | 265/265 (100%) | Runtime-derived (distinct file count from git diff) | Agent performance |
| `git_commits` | number (integer) | `1` from `12641e04...json` | 265/265 (100%) | Runtime-derived (git commit count during session) | Intervention lifecycle, Pipeline integrity |
| `git_pushes` | number (integer) | `1` from `12641e04...json` | 265/265 (100%) | Runtime-derived (git push count during session) | Intervention lifecycle |
| `languages` | object (language_name → integer) | `{"JavaScript":14,"Markdown":2}` from `12641e04...json` | 265/265 (100%, empty `{}` when no files modified) | Runtime-derived (file extension heuristic) | Agent performance, Cross-runtime comparison |

**Notes:**
- `lines_added` maximum observed: 1,774 (session `280c23e4`, Phase 10 arxiv integration). Maximum: `1fa0c6a8` has 568 added.
- Language values observed: Markdown (186 sessions), JSON (38), JavaScript (33), Python (12), YAML (6), Shell (4). Language detection appears extension-based.
- `git_commits` = 0 in the majority of sessions. When > 0, the session produced committed code changes.

### Interaction quality fields

| Field | Type | Example value | Coverage | Reliability | Serves loop |
|-------|------|---------------|----------|-------------|-------------|
| `user_interruptions` | number (integer) | `0` from `12641e04...json` | 265/265 (100%) | Runtime-derived (Escape/interrupt count) | Agent performance, Signal quality |
| `first_prompt` | string (truncated at ~200 chars with `…`) | `"since they fail in work trees"` from `12641e04...json` | 265/265 (100%) | Runtime-derived (first non-system user message) | Cross-session patterns, Pipeline integrity |

**Notes on `first_prompt`:**
- 50/265 sessions have `first_prompt = "No prompt"` — these are sessions where no user message was sent before the session ended (likely `/clear` immediately or accidental open).
- 45/265 sessions have first_prompt truncated (ends with `…`) — long prompts like skill invocations are cut off.
- `first_prompt` often reveals the GSD command used: `/gsd:execute-phase 44`, `/gsdr:plan-phase 43`, `/gsd:discuss-phase 2`, etc. This is the primary hook for identifying which GSD workflow was active.
- When `first_prompt` is a GSD command, it encodes: (a) the workflow type, (b) the phase number. This allows phase-level attribution of sessions.

---

## 3. High-Value Fields for Measurement (Ranked)

Ranking criteria: breadth of feedback loop coverage, data quality, actionability for measurement infrastructure.

**Tier 1 — Essential (serve 3+ loops with high reliability):**

1. **`session_id`** — primary join key across all data sources (session-meta, facets, any future data). Essential for all loops. *Covers: Intervention lifecycle, Cross-session patterns, all joins.*

2. **`start_time`** + **`user_message_timestamps`** — together provide precise temporal anchoring. `start_time` for session-level time-series; `user_message_timestamps` for intra-session temporal analysis and inter-session gap detection. *Covers: Intervention lifecycle, Signal quality, Cross-session patterns.*

3. **`project_path`** — the primary project identity signal. Enables per-project aggregation and cross-project comparison. Distinguishes machine (Mac vs Linux) as a side effect. *Covers: Pipeline integrity, Cross-session patterns, Cross-runtime comparison.*

4. **`tool_counts`** (full object) — the richest behavioral signal in the schema. Reveals: what tools were used, how many times, whether subagents were dispatched (Agent/Task keys), whether MCP was active, tool diversity, Bash-to-Edit ratio (exploratory vs. productive). *Covers: Agent performance, Cross-runtime comparison.*

5. **`first_prompt`** — encodes GSD workflow + phase number for ~70% of sessions. Only field that links a session to a specific GSD phase. *Covers: Pipeline integrity, Intervention lifecycle.*

**Tier 2 — High value (serve 2 loops with good reliability):**

6. **`output_tokens`** — best available proxy for session output volume despite unclear semantics. Higher values correlate with more substantive sessions. *Covers: Agent performance. Caution: unit semantics unclear.*

7. **`tool_errors`** + **`tool_error_categories`** — error rate and error type distribution. Error spikes can flag regressions or intervention failures. *Covers: Agent performance, Pipeline integrity.*

8. **`user_interruptions`** — direct signal for session quality. High interruption count indicates Claude behavior that required correction. *Covers: Agent performance, Signal quality.*

9. **`duration_minutes`** — wall-clock session length. Useful for session clustering (short = quick query; long = extended work session), though inflated by open-but-idle sessions. *Covers: Agent performance, Cross-session patterns.*

10. **`git_commits`** — boolean-equivalent signal for whether a session produced committed work. Strong correlation with "productive" sessions. *Covers: Intervention lifecycle, Pipeline integrity.*

**Tier 3 — Useful for specific loops:**

11. **`user_response_times`** — response latency distribution reveals user engagement patterns; high values indicate user away from keyboard mid-session. *Covers: Signal quality, Cross-session patterns.*

12. **`lines_added`** + **`lines_removed`** — magnitude of code change. Combined with `git_commits` identifies sessions with high output. *Covers: Agent performance.*

13. **`uses_task_agent`** — single-bit flag for GSD execution mode. All phases that use `gsd:execute-phase` will have this true. *Covers: Agent performance.*

14. **`message_hours`** — time-of-day distribution per session. Useful for temporal pattern analysis (work hours, overnight automation). *Covers: Cross-session patterns.*

15. **`languages`** — language fingerprint of files touched. Distinguishes JavaScript sessions (GSD source) from Markdown (planning/documentation) from Python (research projects). *Covers: Agent performance, Cross-runtime comparison.*

---

## 4. Gaps — Fields That Do Not Exist

The following fields were explicitly checked for across all 265 parseable files and are **confirmed absent**:

**Critical gaps for agent performance loop:**

- **`model` / `model_id`** — ABSENT. Which specific Claude model was used (opus-4-5, sonnet-4-6, haiku-3-5, etc.) is not recorded. This is the most significant gap. Without it, cross-model comparison is impossible from session-meta alone. The `project_path` with Mac prefix vs Linux prefix is a weak proxy (different machines may use different models by default), but model identity itself is not recorded.

- **`reasoning_tokens`** — ABSENT. Separate reasoning token count does not exist. The `input_tokens` and `output_tokens` fields may or may not include reasoning tokens — this is unknown. No way to isolate reasoning cost from session-meta.

- **`profile`** (quality/balanced/budget) — ABSENT. The GSD profile setting (which controls model selection) is not written to session-meta. Cannot distinguish which profile tier was active.

- **`context_window`** / **`context_usage`** — ABSENT. No field for context window size or utilization percentage. No way to know if sessions were operating near context limits.

**Critical gaps for cross-session linkage:**

- **`parent_session_id`** / **`continuation`** — ABSENT. Sessions do not link to their predecessors. If a user runs `/clear` and starts a new session continuing the same work, there is no field connecting the two sessions. Session chains must be inferred via `project_path` + temporal proximity.

**Critical gaps for harness-layer attribution:**

- **`gsd_version`** / **`harness_version`** — ABSENT. The GSD harness version is not written to session-meta. Cannot attribute session behavior to specific harness releases. This gap means measurement infrastructure cannot detect harness-caused regressions directly from session-meta.

- **`phase_id`** / **`milestone`** — ABSENT. No structured link to GSD planning layer. Phase identity must be parsed from `first_prompt` (e.g., "execute-phase 44" → phase 44), which works for ~50% of sessions but fails for continuation sessions ("continue", "since they fail in work trees"), sessions with no prompt, and sessions where the phase number isn't in the first message.

**Other gaps:**

- **`error_details`** — ABSENT. `tool_error_categories` names the category but provides no command text, file path, or stack trace for failed operations.
- **`agent_spawns`** / **`subagent_count`** — ABSENT as a scalar. Subagent usage is inferrable from `tool_counts["Agent"]` or `tool_counts["Task"]` keys, but not exposed as a dedicated field.
- **`cost`** / **`price`** / **`billing`** — ABSENT. No cost information.
- **`cache_tokens`** — ABSENT. No prompt caching statistics.
- **`turns`** — ABSENT as a dedicated scalar. Turn count must be computed as `assistant_message_count` (or min(user, assistant)).

---

## 5. Derived Features

Features that can be computed from existing session-meta fields. All derived features carry lower reliability than raw fields — they involve assumptions about semantics.

### Session productivity metrics

**`is_productive_session`** (boolean, derived)
- Formula: `git_commits > 0 OR lines_added > 10`
- Raw fields: `git_commits`, `lines_added`
- Reliability tier: Inferred (reasonable heuristic but misses in-progress sessions)
- Use: Partition corpus into productive vs. exploratory sessions for baseline comparisons.

**`code_velocity`** (float, derived)
- Formula: `(lines_added + lines_removed) / max(duration_minutes, 1)`
- Raw fields: `lines_added`, `lines_removed`, `duration_minutes`
- Reliability tier: Inferred (duration inflated by idle time, degrading accuracy for long sessions)
- Use: Approximate throughput. High values = focused coding sessions; low values = planning/reading sessions.

**`tool_diversity`** (integer, derived)
- Formula: `len(tool_counts.keys())`
- Raw fields: `tool_counts`
- Reliability tier: Derived — direct count of distinct tools used
- Use: Sessions using 1-2 tools (Bash only) are very different from sessions using 8+ tools. Correlates with task complexity.

**`automation_ratio`** (float, derived)
- Formula: `assistant_message_count / max(user_message_count, 1)`
- Raw fields: `assistant_message_count`, `user_message_count`
- Reliability tier: Derived (counts injected system messages, so numerator slightly inflated)
- Use: High ratio (>10) = heavily automated session (subagents doing most work). Low ratio (<3) = conversational session.

**`subagent_calls`** (integer, derived)
- Formula: `tool_counts.get("Agent", 0) + tool_counts.get("Task", 0)`
- Raw fields: `tool_counts`
- Reliability tier: Derived — directly summing tool invocation counts. Reliable but "Agent" and "Task" appear to be the same tool with different historical names.
- Use: Direct proxy for GSD subagent dispatch count. Distinguishes orchestrator sessions from leaf-agent sessions.

**`error_rate`** (float, derived)
- Formula: `tool_errors / max(sum(tool_counts.values()), 1)`
- Raw fields: `tool_errors`, `tool_counts`
- Reliability tier: Derived — straightforward ratio
- Use: Per-session tool failure rate. Elevated error_rate across sessions in a project = potential code or environment regression.

### Session clustering and temporal features

**`session_cluster`** (categorical, derived via clustering)
- Method: Group sessions by `project_path` where `start_time` gaps between consecutive sessions < N minutes (e.g., N=120)
- Raw fields: `project_path`, `start_time`
- Reliability tier: Inferred (gap threshold is arbitrary; doesn't account for cross-project work)
- Use: Approximate "work sessions" — periods of sustained focus on a project. Useful for time-to-remediation calculations at the work-session level.

**`hour_of_day_mode`** (integer 0–23, derived)
- Formula: `statistics.mode(message_hours)`
- Raw fields: `message_hours`
- Reliability tier: Derived — valid when session has sufficient messages; unreliable for single-message sessions.
- Use: Classify sessions by peak activity hour. Useful for detecting whether automated (overnight) vs. interactive (daytime) sessions behave differently.

**`is_automated_session`** (boolean, derived)
- Formula: `user_message_count <= 3 AND uses_task_agent == true AND user_response_times == []`
- Raw fields: `user_message_count`, `uses_task_agent`, `user_response_times`
- Reliability tier: Inferred (heuristic — automated GSD flows typically need fewer user turns)
- Use: Flag fully automated sessions (e.g., `/gsd:execute-phase` with no interruptions) for separate analysis from interactive sessions.

**`gsd_command`** (string, derived by parsing)
- Formula: `first_prompt.split(" ")[0] if first_prompt.startswith("/") else None`
- Raw fields: `first_prompt`
- Reliability tier: Derived — valid for ~65% of corpus. Returns None for "No prompt", continuation sessions, and non-command first messages.
- Use: Group sessions by GSD command type (execute-phase, plan-phase, discuss-phase, etc.) for workflow-level analysis.

**`gsd_phase_number`** (integer, derived by parsing)
- Formula: Parse integer from `first_prompt` after the GSD command token (e.g., "execute-phase 44" → 44)
- Raw fields: `first_prompt`
- Reliability tier: Inferred — works for direct invocations. Fails for continuation sessions.
- Use: Link sessions to the GSD planning layer. Enables intervention lifecycle tracking when combined with `.planning/` phase files.

### Complexity composite

**`session_complexity`** (float, composite)
- Formula: `log(1 + output_tokens) * tool_diversity * log(1 + subagent_calls + 1)`
- Raw fields: `output_tokens`, `tool_counts` (for diversity and subagent_calls)
- Reliability tier: Speculative — depends on output_tokens having consistent semantics (unclear)
- Use: Rough relative complexity index for session clustering. Not suitable for absolute comparison across projects.

---

## 6. Anomalies

### Anomaly 1: Three malformed JSON files (parse failures)

Files `96ae5fc5`, `6f97ee28`, and `8576521c` contain truncated JSON — the files end mid-string without closing braces. All three are in the size range of well-formed files (932–1,411 bytes), suggesting they were written incompletely (process killed during write, disk full, etc.). Content matches the same schema as valid files — the fields that ARE present are identical in structure.

**Impact:** These 3 sessions (1.1% of corpus) are unrecoverable from JSON alone. The data loss is structural (truncation) not content-selective.

### Anomaly 2: Token count semantics are unclear

As documented in Section 2, `input_tokens` produces values that appear inconsistent with actual Claude API token consumption. Session `12641e04` (920 minutes, 108 assistant messages, 4 subagent calls) reports `input_tokens=154` while session `997cf4cd` (8 minutes, 4 user messages, large codebase audit prompt) reports `input_tokens=20269`.

One interpretation: `input_tokens` counts only the user's literal typed text (not context window content), and `output_tokens` counts only the primary assistant's direct response text (not subagent output). Under this model, the numbers become coherent: a large prompt = high input, a session where subagents do most work = low output. But this interpretation means these fields are NOT billable token proxies and cannot be used for cost estimation.

The inverse-ratio case (session `0e701fa9`: `input_tokens=1678, output_tokens=64`) is consistent with this interpretation (a complex /gsd:execute-phase command reads many context tokens but produces little direct assistant output when delegation happens early).

**Status: Anomaly — not resolved. Requires Claude Code source code inspection to confirm semantics.**

### Anomaly 3: `user_message_timestamps` near-duplicate entries at session start

In almost every examined file, the first 2–4 `user_message_timestamps` values are identical or within 1–2 milliseconds of each other. Example from `12641e04`:
```
"2026-03-08T23:33:16.111Z",  ← near-identical
"2026-03-08T23:33:15.402Z",  ← near-identical
"2026-03-08T23:33:21.272Z",  ← real turn gap
"2026-03-08T23:33:21.272Z",  ← near-identical (another injected message?)
```
This suggests Claude Code injects multiple system or context messages at session initialization that are counted as "user messages." Consequence: `user_message_count` overstates the number of actual human-authored turns, and `user_response_times` (computed from inter-message gaps) may include sub-second system message intervals as data points.

**Impact:** `user_message_count` is not a clean count of human prompts. Subtract approximately 2–3 from the raw value to approximate real user turns.

### Anomaly 4: `duration_minutes` can be very large without meaningful signal

The maximum observed `duration_minutes` is 19,996 (~14 days). Sessions with very high durations are sessions that were never explicitly ended — the user closed the terminal or disconnected without the session gracefully terminating. These sessions do NOT represent 14 days of active AI work.

**Impact:** `duration_minutes` requires normalization or capping for time-based analysis. Values above ~500 minutes are likely "abandoned open" sessions rather than true marathon work sessions.

### Anomaly 5: `project_path` `/Users/rookslog/Development/` prefix (103 sessions)

103 of 265 sessions have a Mac-style path (`/Users/rookslog/Development/`) rather than the Linux path (`/home/rookslog/workspace/projects/`). These represent sessions from the MacBook (apollo), not this machine (dionysus). The corpus is therefore a mix of two machines' session histories.

**Impact:** Cross-machine analysis requires path prefix normalization. Any per-machine characteristics (different default models, different Claude Code versions) will be conflated if project_path is used naively as a project identifier.

---

## 7. The Facets Companion Dataset

**Note:** This was discovered during corpus exploration and is not part of Lane 1's explicit scope, but it is directly relevant to measurement infrastructure design.

`~/.claude/usage-data/facets/` contains 109 files with the same session_id filenames as session-meta. These are NOT raw session measurements — they are LLM-generated post-session annotations. Each facets file contains:

| Field | Type | Values observed | Notes |
|-------|------|-----------------|-------|
| `session_id` | string | UUID matching session-meta | Join key |
| `underlying_goal` | string | Free text | LLM-synthesized goal statement |
| `goal_categories` | object (category → integer) | ~170 unique category labels | Highly unstable vocabulary |
| `outcome` | string enum | `fully_achieved`, `mostly_achieved`, `partially_achieved`, `not_achieved`, `unclear_from_transcript` | 5-value ordinal scale |
| `user_satisfaction_counts` | object | `likely_satisfied`, `satisfied`, `dissatisfied`, `frustrated`, `corrective_feedback` | Count of turns matching each label |
| `claude_helpfulness` | string enum | `essential`, `very_helpful`, `moderately_helpful`, `slightly_helpful`, `unhelpful` | 5-value ordinal scale |
| `session_type` | string enum | `multi_task`, `single_task`, `iterative_refinement`, `exploration`, `quick_question` | 99% coverage (1 file missing) |
| `friction_counts` | object | `wrong_approach`, `misunderstood_request`, `buggy_code`, `excessive_changes`, + 8 more | Count of friction incidents per type |
| `friction_detail` | string | Free text narrative | Can be empty string |
| `primary_success` | string enum | `multi_file_changes`, `correct_code_edits`, `good_debugging`, `good_explanations`, `proactive_help`, `none` | Best outcome descriptor |
| `brief_summary` | string | 2-3 sentence narrative | LLM-authored session summary |

**Coverage:** 109/265 sessions (41%) have corresponding facet files. The facets directory is a subset of the session-meta corpus. No file in facets lacks a corresponding session-meta file.

**Reliability:** All facets fields are **LLM-generated** — they are Claude's post-hoc interpretation of the session transcript, not measurement. The `outcome`, `claude_helpfulness`, and `user_satisfaction_counts` fields are particularly subject to self-serving bias (Claude annotating its own performance). The `friction_counts` and `friction_detail` fields are valuable signal about failure modes but carry the same caveat.

**For measurement infrastructure:** The facets `outcome` and `user_satisfaction_counts` fields are compelling but epistemically weak as ground truth. They could serve as a prior or weak label, not as a verified outcome signal. The `friction_counts` vocabulary is inconsistent (similar concepts labeled differently across sessions). The facets data is best treated as noisy signal requiring human calibration.

---

## 8. Cross-Runtime Comparison Notes (for Lane 3)

Fields in session-meta that **may have Codex equivalents** (speculative — Lane 3 must verify):
- `session_id` — likely Codex has session identity
- `project_path` — likely
- `start_time` + `duration_minutes` — likely
- `input_tokens` / `output_tokens` — likely, though may use different semantics
- `tool_counts` — likely, though tool names will differ (Codex uses different tool set)
- `git_commits`, `git_pushes` — possibly
- `lines_added`, `lines_removed`, `files_modified` — possibly

Fields that are **Claude Code-specific** (unlikely to have Codex equivalents):
- `uses_task_agent` — Claude Code's Task/Agent tool is Claude-specific
- `uses_mcp` — MCP is Claude Code-specific
- `first_prompt` — may exist under different name
- `user_interruptions` — Escape key semantics may differ
- `message_hours` / `user_message_timestamps` / `user_response_times` — possibly Codex-equivalent but format unknown

**Key differentiator:** The `project_path` field with Mac vs Linux path prefix reveals which machine (and therefore which runtime) a session came from, enabling cross-runtime comparison even within this single corpus.
