---
date: 2026-04-15
audit_subject: codebase_forensics
audit_orientation: exploratory
audit_delegation: self (multi-lane synthesis)
scope: "Composite synthesis of 4-lane measurement signal inventory"
auditor_model: claude-opus-4-6
triggered_by: "synthesis step of multi-lane exploratory audit"
ground_rules: "exploratory obligations + status downgrade prohibition"
tags: [measurement, signal-inventory, synthesis, phase-57.5-prereq]
input_files:
  - lane-1-claude-session-meta-output.md
  - lane-2-claude-session-logs-output.md
  - lane-3-codex-artifacts-output.md
  - lane-4-gsd-artifacts-output.md
---

# Synthesis: Measurement Signal Inventory (4-Lane Composite)

## 1. Cross-Lane Signal Map

Signals are grouped by the feedback loop they primarily serve. Each signal appears once under its primary loop; secondary loop coverage is noted in the "Also serves" column. The table is exhaustive across all four lanes.

### Loop 1: Intervention Lifecycle (signal -> remediation -> outcome -> recurrence)

| Signal Source | Raw Field / Feature | Runtime | Epistemic Status | Also Serves | Key Constraints |
|---|---|---|---|---|---|
| Session-meta `session_id` | `session_id` (UUID v4) | Claude | Verified-across-corpus (265/265) | All loops (join key) | No parent_session_id; sessions are islands |
| Session-meta `start_time` | ISO 8601 UTC | Claude | Verified-across-corpus (265/265) | Signal quality, Cross-session | |
| Session-meta `user_message_timestamps` | Array of ISO 8601 | Claude | Verified-across-corpus (265/265) | Signal quality, Cross-session | First 2-3 entries are injected system messages (Anomaly 3) |
| Session-meta `git_commits` | Integer | Claude | Verified-across-corpus (265/265) | Pipeline integrity | Most sessions have 0 |
| Session-meta `git_pushes` | Integer | Claude | Verified-across-corpus (265/265) | | |
| Session-meta `first_prompt` | String (truncated ~200 chars) | Claude | Verified-across-corpus (265/265) | Pipeline integrity | GSD command + phase # parseable in ~65% of sessions; 50/265 = "No prompt" |
| Session JSONL `pr-link` | prNumber, prUrl, prRepository, timestamp | Claude | Sampled (observed in JSONL records) | Pipeline integrity | PR creation events logged inline in session |
| Session JSONL `system/stop_hook_summary` | preventedContinuation, hookCount, hookErrors | Claude | Sampled | Pipeline integrity | Stop hooks that block continuation are signal-worthy |
| Signal files `lifecycle_state` | Enum: detected/triaged/blocked/remediated/verified/invalidated | GSD | Intervention-tested (158/254 files have field) | Signal quality | 96 files lack field entirely; introduced Phase 31 |
| Signal files `lifecycle_log` | Array of timestamped state transitions | GSD | Sampled (4 of 255) | Signal quality | Present in newer signals only |
| Signal files `occurrence_count` | Integer | GSD | Sampled | Signal quality | Present in ~40% of signals |
| Signal files `related_signals` | Array of signal IDs | GSD | Sampled | | Sparse |
| PLAN.md `resolves_signals` | Array of signal IDs | GSD | Intervention-tested (9/192 plans) | Signal quality | Critically sparse — 4.7% of plans |
| Git history commit messages | Conventional commit prefixes | GSD | Intervention-tested (2,020 commits) | Pipeline integrity | `fix:` = 226, `feat:` = 398, `docs:` = 957 |
| Git branch lifecycle | Branch create/merge timestamps | GSD | Intervention-tested (sample of phase branches) | Cross-session | Branch naming convention enables phase mapping |
| Codex `stage1_outputs.usage_count` | Integer (memory reuse count) | Codex | Sampled | Cross-session | Tracks whether session memories are consumed later |
| Codex `event_msg/context_compacted` | Compaction event | Codex | Sampled (33 events in large session) | Agent performance | Context pressure indicator |

### Loop 2: Pipeline Integrity (CONTEXT claim propagation, scope-narrowing)

| Signal Source | Raw Field / Feature | Runtime | Epistemic Status | Also Serves | Key Constraints |
|---|---|---|---|---|---|
| CONTEXT.md typed claims | `[governing:reasoned]`, `[assumed:reasoned]`, `[evidenced:cited]`, `[decided:reasoned]`, `[open]` | GSD | Intervention-tested (Phase 57.2+ only) | | **Era boundary: Phase 57.2+ only** (5 phases); pre-57.2 has zero typed claims |
| PLAN.md truths | `must_haves.truths` array in YAML frontmatter | GSD | Intervention-tested (192/192 plans, mean 5.0 truths) | Agent performance | |
| PLAN.md wave/dependency | `wave`, `depends_on` in YAML frontmatter | GSD | Intervention-tested (192/192) | Agent performance | |
| PLAN.md `files_modified` | Array in YAML frontmatter | GSD | Intervention-tested (192/192) | | |
| VERIFICATION.md score | `score: N/M` in YAML frontmatter | GSD | Intervention-tested (30/65 files have frontmatter score) | Agent performance | Older files have score in body only; dual-parse needed |
| VERIFICATION.md status | `passed`/`gaps_found`/`human_needed` | GSD | Intervention-tested (60 passed, 4 gaps_found, 1 human_needed) | | |
| SUMMARY.md 1:1 with PLAN.md | Structural invariant: 192 PLANs = 192 SUMMARYs | GSD | Verified-across-corpus | | No orphaned or missing summaries |
| DISCUSSION-LOG.md gray areas | Numbered `### Area N` sections | GSD | Intervention-tested (6 files total) | | **Phase 57.2+ only**; thematic match to CONTEXT [open] questions requires NLP |
| Session JSONL `attachment[hook_success]` | hookName, hookEvent, exitCode, durationMs, command, toolUseID | Claude | Sampled | Agent performance | Hook health = pipeline health |
| Session JSONL `attachment[hook_additional_context]` | Injected pre-tool context content | Claude | Sampled | | Full hook context auditable retroactively |
| Session JSONL `user.gitBranch` | Git branch per JSONL record | Claude | Sampled | Cross-session | Branch naming convention `gsd/phase-XX-*` gives phase context |
| Session JSONL `user.version` | Claude Code version | Claude | Sampled | Cross-runtime | Version changes enable before/after comparisons |
| Session JSONL `attachment[skill_listing]` | skillCount, isInitial | Claude | Sampled | | Skill registry snapshot per session |
| Session JSONL `attachment[deferred_tools_delta]` | addedNames, removedNames | Claude | Sampled | | Tool set changes during session |
| Session-meta `tool_error_categories` | Categorized error counts | Claude | Verified-across-corpus (265/265) | Agent performance | 6 categories observed; no detail beyond category |
| Codex `exec_command_end.exit_code` | Integer | Codex | Sampled | Agent performance | Non-zero = failed command |
| Codex `patch_apply_end.success` | Boolean | Codex | Sampled | Agent performance | |
| Codex `logs_2.sqlite` ERROR records | 74 total errors with module path | Codex | Sampled | | Linkable to sessions via thread_id |
| Codex `collab_agent_interaction_end.status` | running/blocked/completed | Codex | Sampled | Agent performance | Subagent liveness probe |
| Codex `thread_spawn_edges.status` | open/closed | Codex | Sampled (214 edges) | Cross-session | Open = potentially orphaned |
| config.json `automation.stats` | Per-sensor fires, skips, last_triggered | GSD | Verified (machine-written JSON) | | Ready-made automation health metric |

### Loop 3: Agent Performance (per-model, per-profile: tokens, duration, deviations)

| Signal Source | Raw Field / Feature | Runtime | Epistemic Status | Also Serves | Key Constraints |
|---|---|---|---|---|---|
| Session-meta `input_tokens` | Integer | Claude | Verified-across-corpus (265/265) | | **ANOMALY: unclear semantics** — may count user text only, not API tokens |
| Session-meta `output_tokens` | Integer | Claude | Verified-across-corpus (265/265) | | Same semantic uncertainty; range 0-96,576 |
| Session-meta `tool_counts` | Object (tool_name -> count) | Claude | Verified-across-corpus (265/265) | Cross-runtime | 30 distinct tool names; richest behavioral signal in session-meta |
| Session-meta `tool_errors` | Integer | Claude | Verified-across-corpus (265/265) | Pipeline integrity | |
| Session-meta `duration_minutes` | Integer (wall-clock) | Claude | Verified-across-corpus (265/265) | Cross-session | Max 19,996 (~14 days); capping needed above ~500 |
| Session-meta `user_message_count` | Integer | Claude | Verified-across-corpus (265/265) | Cross-session | Overstates by ~2-3 due to injected system messages |
| Session-meta `assistant_message_count` | Integer | Claude | Verified-across-corpus (265/265) | | |
| Session-meta `user_interruptions` | Integer | Claude | Verified-across-corpus (265/265) | Signal quality | Direct signal for session quality; high count = corrections needed |
| Session-meta `lines_added` / `lines_removed` | Integer | Claude | Verified-across-corpus (265/265) | | |
| Session-meta `files_modified` | Integer | Claude | Verified-across-corpus (265/265) | | |
| Session-meta `languages` | Object (lang -> count) | Claude | Verified-across-corpus (265/265) | Cross-runtime | Extension-based detection |
| Session-meta `uses_task_agent` | Boolean | Claude | Verified-across-corpus (265/265) | | True in ~64% of sessions |
| Session-meta `user_response_times` | Array of floats (seconds) | Claude | Verified-across-corpus (non-empty in 121/265) | Cross-session | Empty in sessions with <=1 user turn |
| Session JSONL `assistant.message.model` | String (e.g., `claude-opus-4-6`) | Claude | Sampled | Cross-runtime | **THE MODEL FIELD** — absent from session-meta but present per-turn in JSONL |
| Session JSONL `assistant.message.usage` | input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, cache_creation.ephemeral_1h/5m, iterations[] | Claude | Sampled | | **Per-turn granularity** with cache breakdown; resolves session-meta token anomaly |
| Session JSONL `system/turn_duration.durationMs` | Integer (ms) | Claude | Sampled | | Per-turn wall-clock latency |
| Session JSONL `assistant.content[].type == 'thinking'` | Presence indicator + signature | Claude | Sampled (verified across 61 files: thinking content always empty string) | | Content stripped permanently; only presence/absence extractable |
| Session JSONL `assistant.message.stop_reason` | `tool_use` or `end_turn` | Claude | Sampled | | Stop reason distribution per session |
| Session JSONL `user[tool_result].toolUseResult` | Structured: stdout, stderr, interrupted, exit_code (Bash); structuredPatch (Edit); isAsync, agentId, status (Agent spawn) | Claude | Sampled | Pipeline integrity | Machine-typed tool output parallel to content string; privacy-safe structural extraction |
| Session JSONL subagent `meta.json.agentType` | String (e.g., `gsdr-executor`) | Claude | Sampled (515 meta.json files in this project) | | Agent role taxonomy |
| Session JSONL subagent `assistant.message.model` | Model per subagent turn | Claude | Sampled | Cross-runtime | Directly answers "which model does each agent type use" |
| Session JSONL subagent `assistant.message.usage` | Same token breakdown as parent | Claude | Sampled | | Subagent-level token accounting |
| Session JSONL `user.permissionMode` | `bypassPermissions` or null | Claude | Sampled | | Yolo mode detection |
| Session JSONL `user.entrypoint` | `cli`, etc. | Claude | Sampled | Cross-runtime | |
| SUMMARY.md `duration` | String (minutes) in YAML frontmatter | GSD | Intervention-tested (183/192) | | |
| SUMMARY.md `context_used_pct` | Float in YAML frontmatter | GSD | Intervention-tested (64/192, Phase 43+) | | **Era boundary: Phase 43+** |
| SUMMARY.md `model` | String in YAML frontmatter | GSD | Intervention-tested (64/192, Phase 43+) | Cross-runtime | Self-reported by executor |
| SUMMARY.md `completed` | Date or ISO datetime | GSD | Verified-across-corpus (~192) | | Mixed format anomaly |
| Codex `threads.model` | String (e.g., `gpt-5.4`) | Codex | Sampled (735/813 non-null) | Cross-runtime | |
| Codex `threads.reasoning_effort` | `xhigh`/`high`/`medium`/`low` | Codex | Sampled (735/813 non-null) | | **Codex-unique** — no Claude equivalent knob |
| Codex `threads.tokens_used` | Integer (aggregate) | Codex | Sampled (794/813 non-zero) | | Session-level aggregate |
| Codex `event_msg/token_count` | input_tokens, cached_input_tokens, output_tokens, reasoning_output_tokens, total_tokens (per-turn + cumulative) | Codex | Sampled | | **reasoning_output_tokens separated** — richer than Claude session-meta |
| Codex `threads.agent_role` | String | Codex | Sampled (subagents only) | | Role-stratified performance |
| Codex `threads.agent_nickname` | String (human-readable) | Codex | Sampled (subagents only) | | **Codex-unique** |
| Codex `turn_context.collaboration_mode` | model override, reasoning_effort, instructions per turn | Codex | Sampled | | Per-turn model/effort changes |
| Codex `event_msg/task_complete` / `turn_aborted` | Turn completion/abortion events | Codex | Sampled (282 complete, 173 aborted in large session) | Pipeline integrity | |
| Codex `exec_command_end.duration` | Structured (secs/nanos) | Codex | Sampled | | Per-command execution time |
| Codex `mcp_tool_call_end.duration` | Structured (secs/nanos) | Codex | Sampled (6 events) | | MCP tool latency |
| Codex `event_msg/collab_agent_spawn_end` | sender_thread_id, new_thread_id, agent_role, full prompt | Codex | Sampled (153 events in large session) | Cross-session | Full spawning prompt available |
| Codex `rate_limits` | primary (5hr window %), secondary (7-day %) | Codex | Sampled | | **Codex-unique** — subscription pressure signal |
| GSD phase complexity index | PLAN truth count + wave count + files_modified (derived) | GSD | Intervention-tested (all 192 plans) | | |
| GSD deviation density | `fix:` commit count per phase branch / plan count (derived) | GSD | Intervention-tested | | |

### Loop 4: Signal Quality (time-to-remediation, accuracy, recurrence)

| Signal Source | Raw Field / Feature | Runtime | Epistemic Status | Also Serves | Key Constraints |
|---|---|---|---|---|---|
| Signal files `severity` | Enum: critical/notable/minor/medium/high | GSD | Intervention-tested (254 tagged) | | Inconsistent enum (5 values, some overlapping) |
| Signal files `signal_type` | Enum: deviation/good-pattern/capability-gap/etc. | GSD | Intervention-tested (~62% of signals) | | 38% lack field |
| Signal files `signal_category` | negative/positive/mixed | GSD | Sampled | | |
| Signal files `confidence` | high/medium/low | GSD | Sampled | | |
| Signal files `detection_method` | manual/artifact-analysis/conversation-review | GSD | Sampled | | |
| Signal files `date` (filename + frontmatter) | Filing date | GSD | Verified-across-corpus (255 files) | | Filename dates reliable |
| Signal files `phase` | Associated phase string | GSD | Sampled (present in most) | Intervention lifecycle | |
| kb.db SQLite | Queryable index of all signal frontmatter | GSD | Verified (Phase 56 infrastructure) | All signal loops | Ready-made; queries like `SELECT * FROM signals WHERE severity = 'critical'` work now |
| Facets `outcome` | fully/mostly/partially/not_achieved/unclear | Claude | Sampled (109/265 sessions) | | **LLM-generated** — epistemically weak as ground truth |
| Facets `friction_counts` | wrong_approach/misunderstood_request/etc. counts | Claude | Sampled (109/265) | Cross-session | LLM-generated; vocabulary inconsistent across sessions |
| Facets `claude_helpfulness` | essential/very_helpful/moderately_helpful/etc. | Claude | Sampled (109/265) | | Self-serving bias risk |
| Facets `session_type` | single_task/multi_task/exploration/etc. | Claude | Sampled (109/265) | | |
| Facets `primary_success` | multi_file_changes/correct_code_edits/etc. | Claude | Sampled (109/265) | | |

### Loop 5: Cross-Session Patterns (friction concentration, momentum, topic continuity)

| Signal Source | Raw Field / Feature | Runtime | Epistemic Status | Also Serves | Key Constraints |
|---|---|---|---|---|---|
| Session-meta `project_path` | Absolute path string | Claude | Verified-across-corpus (265/265) | Cross-runtime | 13 unique projects; Mac vs Linux path prefix distinguishes machine |
| Session-meta `message_hours` | Array of integers (0-23 UTC) | Claude | Verified-across-corpus (265/265) | | Hour-of-day distribution for temporal pattern analysis |
| Session JSONL `user.gitBranch` | Branch per record | Claude | Sampled | Pipeline integrity | Phase identification via branch naming |
| Session JSONL `attachment[queued_command]` | User command typed while model was working | Claude | Sampled | | Behavioral signal: user anticipating/redirecting mid-turn |
| Session JSONL `attachment[opened_file_in_ide]` | Filename | Claude | Sampled | | User browsing behavior |
| Codex `threads.source` | JSON blob for subagents: parent_id, depth, agent_nickname, agent_role | Codex | Sampled | Agent performance | Full genealogy reconstructible |
| Codex `thread_spawn_edges` | Complete parent-child graph (214 edges) | Codex | Sampled | Agent performance | **Codex-unique queryable spawn graph** |
| Codex `stage1_outputs.rollout_summary` | Auto-generated session summary | Codex | Sampled | | AI-generated; quality varies |
| GSD knowledge base growth | Signal count per month, deliberation count over time | GSD | Intervention-tested | | Dates in filenames reliable |
| GSD config.json sensor stats | fires, skips, last_triggered per sensor | GSD | Verified (machine-written) | Pipeline integrity | |
| Claude `history.jsonl` | 6,687 lines of command history with timestamps | Claude | Sampled | | Lightweight; display + timestamp only |

### Loop 6: Cross-Runtime Comparison (per-runtime capabilities, asymmetric availability)

| Signal Source | Raw Field / Feature | Runtime | Epistemic Status | Also Serves | Key Constraints |
|---|---|---|---|---|---|
| Session-meta `project_path` (Mac vs Linux prefix) | Path string | Claude | Verified-across-corpus | Cross-session | Machine distinguishes runtime context |
| Session JSONL `assistant.message.model` | Model string per turn | Claude | Sampled | Agent performance | Claude model names (claude-opus-4-6, etc.) |
| Session JSONL `user.entrypoint` | `cli`, etc. | Claude | Sampled | | |
| Session JSONL `user.version` | Claude Code version string | Claude | Sampled | Pipeline integrity | |
| Session-meta `uses_mcp` | Boolean | Claude | Verified-across-corpus (265/265) | | True in ~8% of sessions |
| Codex `threads.model` | Model string | Codex | Sampled (735/813) | Agent performance | OpenAI model names (gpt-5.4, etc.) |
| Codex `threads.cli_version` | String | Codex | Sampled (~90%) | | |
| Codex `threads.reasoning_effort` | xhigh/high/medium/low | Codex | Sampled (735/813) | Agent performance | **No Claude equivalent** |
| Codex `threads.sandbox_policy` | Structured JSON with type, writable_roots, network_access | Codex | Sampled | | Different permission model than Claude |
| Codex `threads.source` | cli/exec/vscode/subagent JSON | Codex | Sampled | | Session origin type |
| Codex feature flags | `runtime_metrics`, `general_analytics` (both disabled) | Codex | Sampled | | Future signal sources when enabled |
| SUMMARY.md `model` field | Self-reported executor model | GSD | Intervention-tested (64/192) | Agent performance | Only 1 Codex-executed verification found (gpt-5.4) |

---

## 2. Cross-Platform Asymmetry Synthesis

### 2.1 Model Identification

| | Claude Code | Codex CLI | Asymmetry | Bridge? |
|---|---|---|---|---|
| **Session-level** | **ABSENT from session-meta** (Lane 1 confirmed). Present in session JSONL `assistant.message.model` field (Lane 2 confirmed). | `threads.model` in state_5.sqlite. 735/813 non-null. | Claude requires JSONL parsing; Codex has it in a queryable column. | Yes — build extractor to read model from first `assistant` record in Claude JSONL. Trivial difficulty. |
| **Per-turn** | Present on every `assistant` record in JSONL (Lane 2: `assistant.message.model`). | Present in `turn_context.collaboration_mode.model` per turn. | Symmetric at the JSONL level. | Direct extraction from both. |
| **Subagent** | Present in subagent JSONL `assistant.message.model` (Lane 2 confirmed). Also in `meta.json.agentType`. | Present in `threads.model` for child threads. `thread_spawn_edges` links parent to child. | Symmetric. | Both support per-subagent model identification. |

**Reconciled finding:** Model ID is available in both runtimes but at different layers. Claude Code's session-meta is the only structured summary that lacks it — the raw JSONL logs have it per-turn. The measurement infrastructure must extract model from JSONL for Claude sessions, while Codex provides it in a queryable table. This is a trivial extractor but a load-bearing one: without it, the most important stratification variable is missing for Claude sessions.

### 2.2 Token Accounting

| | Claude Code | Codex CLI | Asymmetry | Bridge? |
|---|---|---|---|---|
| **Session-level aggregate** | `input_tokens` and `output_tokens` in session-meta. **ANOMALY: unclear semantics** — may count user text only. | `threads.tokens_used` — single integer aggregate. | Both have aggregates, but Claude's has semantic uncertainty. Codex aggregate is a single total. | Resolve Claude token semantics before using session-meta tokens; prefer per-turn JSONL extraction. |
| **Per-turn breakdown** | Full breakdown in JSONL `assistant.message.usage`: input_tokens, output_tokens, cache_creation_input_tokens, cache_read_input_tokens, ephemeral_1h/5m tiers, iterations[]. | `event_msg/token_count`: input_tokens, cached_input_tokens, output_tokens, reasoning_output_tokens, total_tokens. Both cumulative and per-turn. | **Claude has richer cache tier breakdown** (1h vs 5m ephemeral). **Codex has reasoning_output_tokens separated**. | Partial bridge: shared fields (input, output, cached) normalize; reasoning tokens and cache tiers are runtime-unique. |
| **Reasoning tokens** | **ABSENT in session-meta** (Lane 1). **Unknown in JSONL** — Lane 2 did not find a separate `reasoning_tokens` field; thinking blocks have empty content + signature only. | `reasoning_output_tokens` explicitly separated in `token_count`. | **Codex-unique signal.** Claude's thinking blocks confirm thinking occurred but token cost is not separated. | No bridge. Reasoning token cost analysis is Codex-only unless Claude Code starts exposing it. The measurement system must mark this as `not_available` for Claude. |

**Reconciled finding:** Token accounting is where the deepest asymmetry lives. Claude's per-turn JSONL data is rich (especially cache tiers), but reasoning token isolation is impossible. Codex provides the clearest picture of reasoning cost. The session-meta token anomaly means the measurement infrastructure should treat Claude JSONL per-turn usage as the canonical token source, not session-meta aggregates.

### 2.3 Reasoning Visibility

| | Claude Code | Codex CLI | Asymmetry | Bridge? |
|---|---|---|---|---|
| **Thinking presence** | `assistant.content[].type == 'thinking'` with non-empty `signature`, empty `thinking` field. Verified across 61 files. | `response_item/reasoning` with `encrypted_content` blob. Content null, summary empty. | Both confirm reasoning happened; neither exposes content. | Both have presence-only. Symmetric at that level. |
| **Reasoning token cost** | Not separated from output_tokens. | `reasoning_output_tokens` in `token_count`. | Codex-unique. | No bridge. |
| **Reasoning effort level** | No equivalent knob. | `threads.reasoning_effort`: xhigh/high/medium/low. | Codex-unique. | No bridge. Claude has no user-facing reasoning effort control. |

**Reconciled finding:** Reasoning is the most asymmetric domain. Codex provides effort level, token cost separation, and encrypted content (presence confirmation). Claude provides presence confirmation (thinking blocks with signatures) but nothing else. This asymmetry is structural — it reflects different product architectures, not missing data.

### 2.4 Session / Agent Linking

| | Claude Code | Codex CLI | Asymmetry | Bridge? |
|---|---|---|---|---|
| **Parent-child session linking** | **ABSENT from session-meta** (no `parent_session_id`). Session JSONL `toolUseResult` for Agent spawns contains `agentId` and links to subagent JSONL files in `subagents/` directory. 2,373 subagent JSONL files across corpus. `meta.json` provides `agentType` + `description`. | `thread_spawn_edges` table in state_5.sqlite: parent_thread_id, child_thread_id, status. 214 edges across 813 sessions. Also `threads.source` JSON blob encodes parent_id + depth. | **Codex has a queryable relational table**. Claude has filesystem-based linking (parent session directory contains subagent files). | Claude: reconstruct spawn graph by walking session directories + parsing Agent tool_use records. Moderate difficulty. Codex: single SQL query. Different effort, same result. |
| **Subagent identity** | `meta.json.agentType` (e.g., `gsdr-executor`), `meta.json.description`. `agentId` is a hex string in JSONL records. | `threads.agent_role`, `threads.agent_nickname` (human-readable). | Codex adds nicknames; Claude has type + description. | Both provide role taxonomy. Nicknames are Codex-unique cosmetic data. |
| **Spawn depth** | Not directly available. `isSidechain: true` identifies subagent records but not nesting depth. | `threads.source` JSON encodes `depth` for subagents. | Codex tracks depth explicitly; Claude requires recursive directory traversal. | Depth extraction feasible for Claude but harder. |

**Reconciled finding:** Agent genealogy is reconstructible from both runtimes, but with very different effort levels. Codex's relational `thread_spawn_edges` table is the gold standard — a single SQL query produces the full graph. Claude's approach requires walking filesystem structures and parsing JSONL records. The measurement infrastructure should abstract over both with a common "agent graph" extractor that uses the optimal strategy per runtime.

### 2.5 Tool Patterns

| | Claude Code | Codex CLI | Asymmetry | Bridge? |
|---|---|---|---|---|
| **Tool names** | Session-meta `tool_counts` (30 distinct names: Bash, Read, Edit, Write, Grep, Glob, Agent, Task, Skill, MCP prefixed, etc.). JSONL `assistant[tool_use].name` per invocation. | `exec_command_end` (shell), `patch_apply_end` (file edits), `custom_tool_call` (apply_patch, etc.), `mcp_tool_call_end`, `web_search_end`. | **Different tool ecosystems.** Claude has fine-grained named tools (Read vs Glob vs Grep). Codex has exec (shell) + apply_patch + MCP + web_search. | Normalization map: Codex `exec_command` -> Claude `Bash`; Codex `patch_apply` -> Claude `Edit/Write`; both have MCP. Claude's tool diversity is richer. |
| **Tool error tracking** | Session-meta: `tool_errors` count + `tool_error_categories` (6 categories). JSONL: `toolUseResult.stderr`, `toolUseResult.interrupted`. | `exec_command_end.exit_code`, `patch_apply_end.success`, `turn_aborted`. `logs_2.sqlite` ERROR records (74 total). | Both track errors but differently. Claude categorizes; Codex provides raw exit codes + structured success/failure. | Normalize to common error rate metric. |

### 2.6 Error Tracking

| | Claude Code | Codex CLI |
|---|---|---|
| **Error granularity** | Session-meta: category-level only (6 types). JSONL: stderr content available. | Exit code per command. `logs_2.sqlite` ERROR records with Rust module path. 74 errors across corpus. |
| **Interruptions** | `user_interruptions` in session-meta. `toolUseResult.interrupted` in JSONL. | `event_msg/turn_aborted` events (173 in sampled large session). Distinguishes aborted vs completed turns. |

### 2.7 Context Window Dynamics

| | Claude Code | Codex CLI | Asymmetry | Bridge? |
|---|---|---|---|---|
| **Context size proxy** | `cache_creation_input_tokens` growth in JSONL (Lane 2 finding 7.10: `cache_read + cache_creation` = context size). No explicit context_used_pct in JSONL. | `event_msg/task_started` contains `model_context_window` (e.g., 258,400 tokens). Token counts per turn approach this limit. | Codex exposes the window size explicitly; Claude requires inference from cache growth. | Claude: derive context utilization from `(cache_read + cache_creation) / estimated_window_size`. Codex: derive from `total_token_usage / model_context_window`. |
| **Compaction events** | **ABSENT** — Lane 2 searched all 60 JSONL files for "compact"/"compress" with zero matches. | `compacted` and `event_msg/context_compacted` events (33 in sampled session). `replacement_history` contains condensed context. | **Codex-unique.** Claude Code either does not compact or does not log compaction. | No bridge. Context pressure detection for Claude must rely on cache growth trajectory slope change as proxy. |
| **GSD-level context** | N/A | N/A | SUMMARY.md `context_used_pct` (64/192 plans) provides a GSD-layer proxy for both runtimes. | |

---

## 3. Cross-Source Join Analysis

### 3.1 Session -> Phase (timestamp-based)

**Data sources:** Session-meta `start_time` + `first_prompt` (Lane 1), Session JSONL `user.gitBranch` (Lane 2), STATE.md `last_updated` (Lane 4), PLAN/SUMMARY timestamps (Lane 4).

**Join keys:**
- **Primary:** Parse `first_prompt` for GSD command + phase number (works for ~65% of Claude sessions). `user.gitBranch` with naming convention `gsd/phase-XX-*` (works for sessions on phase branches).
- **Secondary:** Timestamp proximity between session `start_time` and PLAN/SUMMARY `completed` dates.
- **Tertiary:** `project_path` filters to correct project.

**Reliability:** MEDIUM-HIGH when primary keys match. The `gitBranch` join is the most reliable — branch names are machine-assigned and consistently follow the `gsd/phase-XX-*` pattern. `first_prompt` parsing works well for `/gsd:execute-phase N` invocations but fails for continuation sessions. Timestamp-only joins are LOW reliability (multiple sessions per day, date-only granularity in some SUMMARY fields).

**For Codex:** `threads.git_branch` provides the same join key as Claude's `user.gitBranch`. Equally reliable.

**Epistemic status:** Inferred (the join logic is described, not tested). The `gitBranch` extraction from JSONL has not been validated across the full corpus.

### 3.2 Plan Execution -> Token Consumption

**Data sources:** PLAN.md truth count, wave count, files_modified (Lane 4) + session JSONL per-turn `assistant.message.usage` (Lane 2) or session-meta tokens (Lane 1).

**Join key:** Phase + plan number (from PLAN frontmatter) joined to session via Session -> Phase join above.

**Reliability:** HIGH for the join between PLAN.md and SUMMARY.md (same phase+plan key, both in YAML frontmatter). MEDIUM for plan-to-session join (depends on Session -> Phase reliability). The 64-plan cohort with `context_used_pct` in SUMMARY provides a direct plan-complexity -> context-usage join without needing session data at all.

**What it enables:** "Do more complex plans (higher truth count, more waves) consume more tokens?" This is answerable from GSD artifacts alone (truth count vs context_used_pct) for the 64-plan Phase 43+ cohort, or from GSD + session JSONL for per-turn token trajectory analysis.

**Epistemic status:** Inferred for the session-level join; intervention-tested for the GSD-only join (Lane 4 ran the extraction).

### 3.3 Claim Propagation Pipeline (CONTEXT -> PLAN -> VERIFICATION)

**Data sources:** CONTEXT.md typed claims (Lane 4, Phase 57.2+ only), PLAN.md truths (Lane 4, all 192 plans), VERIFICATION.md scores (Lane 4, 30 with frontmatter scores + 35 with body scores).

**Join key:** Phase identifier (exact string match across all three artifacts).

**Reliability:** HIGH for structural counts (claim count -> truth count -> verification score) using the phase key. LOW for semantic alignment (does governing claim X map to truth Y?). Lane 4 explicitly states: "claim text rarely appears verbatim in plan truths; requires semantic matching, not simple string equality."

**What it enables:** Phase-level claim-to-truth-to-verification pipeline metrics. For the Phase 57.2+ cohort: governing claim count -> truth count ratio (scope narrowing indicator), open question count -> truth count (question-to-actionable-plan conversion).

**Limitation:** Only 5 phases have typed claims. The pipeline integrity loop's signature metric (claim propagation rate) has an N of ~5. This is insufficient for statistical analysis but sufficient for case-study demonstration.

**Epistemic status:** Intervention-tested for count extraction; inferred for semantic alignment; speculative for retroactive applicability to pre-57.2 phases.

### 3.4 Signal -> Session -> Fix

**Data sources:** Signal files with `date`, `phase`, `lifecycle_state` (Lane 4), session data with timestamps + git branch (Lanes 1-2), git commit history with `fix:` prefix and phase references (Lane 4).

**Join keys:**
1. Signal `phase` field -> session `gitBranch` (phase from branch name)
2. Signal `date` -> git commit dates within same phase branch
3. PLAN.md `resolves_signals` -> signal IDs (only 9/192 plans)

**Reliability:** LOW. Lane 4 assessed this as the least reliable join. Three problems: (a) `resolves_signals` is critically sparse (4.7% of plans), (b) no `session_id` field exists in signal files, (c) signal `date` -> commit date is approximate (same-day granularity). The lifecycle_state -> remediated path exists for only 7 signals.

**What it would enable:** Full intervention lifecycle measurement: signal filed -> phase planned to fix it -> sessions that executed the fix -> verification of fix -> recurrence check. This is the holy grail metric for the intervention lifecycle loop but is currently not achievable retroactively with acceptable reliability.

**Epistemic status:** Inferred for the join logic; intervention-tested for the sparsity assessment.

### 3.5 Agent Dispatch -> Subagent JSONL

**Data sources:** Parent session JSONL `assistant[tool_use]` Agent calls with `toolUseResult.agentId` (Lane 2), subagent JSONL files in `subagents/agent-{id}.jsonl` (Lane 2), `meta.json` per subagent (Lane 2).

**Join key:** `agentId` from parent's tool_use result -> subagent JSONL filename.

**Reliability:** HIGH. The `agentId` in the parent record matches the subagent filename. 2,373 subagent JSONL files and 515 meta.json files exist for this project alone. The join is filesystem-based: parent session directory contains subdirectory with child agent files.

**What it enables:** Full parent-child agent analysis: what the parent asked for (tool_use input), what type of agent was spawned (meta.json.agentType), what model the child used (child JSONL assistant.message.model), how many tokens the child consumed (child JSONL usage), what tools the child used (child JSONL tool_use records), and whether the child completed successfully.

**For Codex:** `thread_spawn_edges` + `threads` table provides the equivalent join in SQL. Equivalent reliability.

**Epistemic status:** Sampled for Claude (Lane 2 examined the structure); sampled for Codex (Lane 3 queried the database).

---

## 4. Feature Engineering Opportunities

### 4.1 Phase-Correlated Token Efficiency

**Feature name:** `tokens_per_truth_per_phase`

**Raw sources:**
- PLAN.md truth count per plan (Lane 4, all 192 plans)
- Session JSONL per-turn `assistant.message.usage` (Lane 2) OR session-meta `output_tokens` (Lane 1) OR SUMMARY.md `context_used_pct` (Lane 4, 64/192)

**Computation:** Total tokens consumed during phase execution / number of truths in phase plans. Alternatively: `context_used_pct / truth_count` from SUMMARY + PLAN frontmatter alone.

**Feasibility:** HIGH for the GSD-only version (SUMMARY context_used_pct / PLAN truth_count). MEDIUM for the session-level version (requires Session -> Phase join). The GSD-only version is available for 64 plans (Phase 43+).

**Era boundary:** Phase 43+ for context_used_pct. All 192 plans have truth counts.

**Value:** Directly serves agent performance loop. Reveals whether token efficiency is improving, degrading, or varying by phase type. Can stratify by model (using SUMMARY.md `model` field for the 64-plan cohort).

### 4.2 Intervention Effectiveness Metric

**Feature name:** `signal_remediation_effectiveness`

**Raw sources:**
- Signal files: `lifecycle_state`, `date`, `phase`, `signal_type`, `severity` (Lane 4)
- PLAN.md `resolves_signals` (Lane 4, 9/192 plans)
- Git history: `fix:` commits per phase (Lane 4, 226 fix commits total)
- Signal recurrence: `occurrence_count > 1` or new signals with same `signal_type` + `tags` (Lane 4)

**Computation:** For signals that reach `lifecycle_state: remediated`: time from filing to remediation (from lifecycle_log timestamps or git commit dates), recurrence rate after remediation (new signals with overlapping tags filed after remediation date).

**Feasibility:** LOW for full pipeline due to sparse `resolves_signals` (9/192) and sparse `lifecycle_state: remediated` (7/255). MEDIUM for a simpler version: count signals by severity per phase, track whether severity distribution improves over time.

**Era boundary:** lifecycle_state introduced Phase 31. occurrence_count present in ~40% of signals.

**Value:** Core metric for intervention lifecycle loop. Even the simpler version (severity trend over time) would demonstrate the loop.

### 4.3 Agent Configuration -> Outcome

**Feature name:** `agent_config_outcome_correlation`

**Raw sources:**
- Session JSONL subagent `meta.json.agentType` + `assistant.message.model` (Lane 2)
- Session JSONL subagent `assistant.message.usage` (Lane 2)
- SUMMARY.md `model`, `context_used_pct`, `duration` (Lane 4)
- Codex `threads.model`, `threads.reasoning_effort`, `threads.tokens_used` (Lane 3)
- VERIFICATION.md `score`, `status` (Lane 4)

**Computation:** For each agent type + model + reasoning level combination: average token consumption, average duration, verification pass rate of associated phases. Enables "gsdr-executor on sonnet-4-6 uses X tokens and achieves Y% pass rate vs gsdr-executor on opus-4-6 using Z tokens with W% pass rate."

**Feasibility:** MEDIUM for Claude (requires JSONL extraction of model per subagent + Session -> Phase join + VERIFICATION score). HIGH for Codex (SQL join across threads + thread_spawn_edges). Currently blocked for cross-runtime comparison by the fact that GSD executes primarily on Claude Code — the Codex corpus is from different projects.

**Era boundary:** Subagent JSONL available for all sessions in JSONL corpus (2026-03-08+). VERIFICATION scores available for 30+ phases.

**Value:** Directly serves agent performance loop and the "Sensors-Use-Sonnet" feedback preference. Would empirically validate whether Sonnet is sufficient for sensor work.

### 4.4 Scope Narrowing Detection

**Feature name:** `scope_narrowing_indicator`

**Raw sources:**
- CONTEXT.md governing claim count (Lane 4, Phase 57.2+ only)
- PLAN.md truth count (Lane 4, all 192 plans)
- CONTEXT.md open question count (Lane 4, Phase 57.2+ only)
- DISCUSSION-LOG.md gray area count (Lane 4, 6 files)

**Computation:** `governing_claim_count - truth_count` per phase (negative values indicate potential scope narrowing — more governing claims than truths encoded). `open_question_count - gray_area_count` (questions not discussed).

**Feasibility:** LOW-MEDIUM. Count extraction is trivial (regex). Semantic alignment between claims and truths is not (Lane 4: "requires semantic matching, not simple string equality"). The numeric ratio is a coarse but extractable proxy.

**Era boundary:** **Phase 57.2+ only.** This is the most era-limited feature — applicable to approximately 5 phases. The feature was designed to detect the Phase 57 failure pattern, but retroactive detection of similar failures in earlier phases is impossible from typed claims alone.

**Competing interpretation:** The numeric ratio (claims vs truths) might indicate scope narrowing OR legitimate scope refinement (not all governing claims need separate truths). The measurement system should present both interpretations when the ratio diverges.

**Value:** Core metric for pipeline integrity loop. Even with N=5, demonstrating the metric on Phase 57 (where the failure is known) would validate the approach.

### 4.5 Session Complexity Index (cross-source)

**Feature name:** `session_complexity_composite`

**Raw sources:**
- Session JSONL per-turn token usage trajectory (Lane 2)
- Session-meta `tool_counts` tool diversity (Lane 1)
- Subagent count from Agent/Task tool invocations (Lane 1 or Lane 2)
- PLAN truth count for associated phase (Lane 4)

**Computation:** `log(1 + total_tokens) * tool_diversity * log(1 + subagent_count + 1) * phase_truth_count`

**Feasibility:** MEDIUM. Requires the Session -> Phase join for the truth_count component. Without it, the formula works with just session data (tokens * tool_diversity * subagent_count) — Lane 1 already defined this as a derived feature.

**Era boundary:** Session-meta available for 46 days (2026-01-28 to 2026-03-15). JSONL available from 2026-03-08 onward.

---

## 5. Anomaly Register (Composite)

### A1: Session-meta token semantics (Lane 1, carried forward)

**Lane 1 finding:** `input_tokens` = 154 for a 920-minute session with 108 assistant messages and 4 subagent dispatches. Interpretation: may count only user's literal typed text, not API tokens.

**Cross-lane evidence (Lane 2):** Per-turn JSONL `assistant.message.usage.input_tokens` shows values like 36,207 per turn — clearly API-level token counts, not user text. The session-meta `input_tokens` and the JSONL `usage.input_tokens` are measuring different things.

**Resolution status:** PARTIALLY RESOLVED. The JSONL per-turn tokens are genuine API token counts. The session-meta `input_tokens` appears to aggregate something different — possibly user message tokens only. The measurement infrastructure should use JSONL per-turn tokens as the canonical source, treating session-meta tokens as a secondary/convenience field. Full resolution would require Claude Code source inspection.

**Impact on design:** Session-meta `input_tokens`/`output_tokens` should NOT be used as cost proxies. JSONL per-turn `usage` should be the canonical token source for Claude sessions.

### A2: Session-meta vs session JSONL consistency (cross-lane)

**Lane 1 reports:** 265 parseable session-meta files spanning 2026-01-28 to 2026-03-15.
**Lane 2 reports:** 142 session JSONL files spanning 2026-03-08 to 2026-04-16.

**Anomaly:** The corpora do not fully overlap. Session-meta covers sessions from Jan 28 to Mar 15. JSONL covers sessions from Mar 8 to Apr 16. The overlap window is March 8-15. This means:
- Sessions from Jan 28 to Mar 7 have session-meta but no JSONL.
- Sessions from Mar 16 to Apr 16 have JSONL but no session-meta.
- The two data sources cover different time periods, not the same sessions from different perspectives.

**Possible explanation:** Session-meta files were batch-copied (Lane 1: filesystem timestamps show two batch dates, Mar 8 and Mar 15). JSONL files accumulate locally. The session-meta corpus may represent a one-time snapshot that stopped being collected. Alternatively, session-meta and JSONL may be on different retention/rotation schedules.

**Impact:** Any extractor that joins session-meta fields to JSONL fields can only operate on sessions in the overlap window (~7 days, Mar 8-15). For sessions outside this window, only one data source is available. The measurement infrastructure must handle sessions that have one source but not the other.

### A3: Format era boundaries (Lane 4, carried forward, cross-lane implications)

Lane 4 identified critical era boundaries in GSD artifacts:

| Feature | Introduced | Phases with data | Phases without |
|---|---|---|---|
| Typed claims in CONTEXT.md | Phase 57.2 (Apr 2026) | ~5 | ~60 |
| `context_used_pct` in SUMMARY | Phase 43 (Mar 2026) | 64 | 128 |
| `model` in SUMMARY | Phase 43 (Mar 2026) | 64 | 128 |
| `lifecycle_state` in signals | Phase 31 (Feb 2026) | 158 | 96 |
| VERIFICATION score in frontmatter | ~Phase 31 | 30 | 35 |
| DISCUSSION-LOG sidecar | Phase 57.2 | 6 | ~59 |
| `resolves_signals` in PLAN | Sporadic | 9 | 183 |

**Cross-lane implication:** Several planned feedback loops depend on features that exist only in the most recent era. The pipeline integrity loop (claim propagation) has N=5. The intervention lifecycle loop (signal -> plan -> fix) has `resolves_signals` in 4.7% of plans. Phase 57.5 must work with what exists, not what was hoped for.

### A4: Claude session JSONL thinking block content is permanently empty (Lane 2, carried forward)

Lane 2 verified across 61 files: `assistant.content[].thinking` is always an empty string. The `signature` field confirms thinking occurred. This is not a logging gap — it's Anthropic's intentional design. Reasoning content is not persisted.

**Cross-lane comparison:** Codex's `response_item/reasoning` also has null `content` and encrypted `encrypted_content`. Both runtimes strip thinking content, but for different reasons (privacy/IP protection for Claude, encryption for Codex).

**Impact:** Any measurement that depends on reasoning quality must use proxies (reasoning token count, output quality, verification scores) rather than direct reasoning inspection. This is a hard ceiling for both runtimes.

### A5: `user_message_count` overcount (Lane 1 Anomaly 3, no cross-lane resolution)

Session-meta `user_message_count` includes 2-3 injected system messages at session start (verified by near-duplicate timestamps). The raw count overstates actual human turns.

**Status:** Not resolved. Cross-lane data does not help — the JSONL records include these injected messages too (they appear as `user` records with `isMeta: true`). The extractor must filter `isMeta: true` records when counting genuine human turns.

### A6: Codex context compaction with no Claude equivalent (cross-lane)

Lane 3 found 33 `compacted` events in a single large Codex session. Lane 2 searched all 60 Claude JSONL files for "compact"/"compress" and found zero matches.

**Two possible interpretations:**
1. Claude Code does not compact context — it simply has a larger effective context window and sessions end before compaction is needed.
2. Claude Code compacts but does not log it.

**Impact:** Context pressure analysis is asymmetric. Codex compaction events are a clean signal for "this session hit context limits." For Claude, the proxy is cache_creation_input_tokens growth rate plateauing or the session ending.

### A7: config.json automation stats — undocumented measurement source (Lane 4 surprise)

Lane 4 found `.planning/config.json` contains `automation.stats` with per-sensor fire counts, skip counts, and last-triggered timestamps. This was not documented anywhere. The `signal_collection` sensor shows `fires: 0, skips: 13` — the automated collection never fires.

**Cross-lane implication:** The GSD harness itself has a built-in measurement point for automation health. This is directly relevant to the pipeline integrity loop and is available NOW with zero extraction cost.

### A8: kb.db SQLite database — ready-made signal index (Lane 4 surprise)

`.planning/knowledge/kb.db` is a SQLite database indexing all 255 signal frontmatter fields. Built by Phase 56 infrastructure. Enables SQL queries against the signal corpus without grep/regex extraction.

**Cross-lane implication:** The signal quality loop already has a queryable data store. The measurement infrastructure does not need to build signal extraction from scratch — it can query kb.db directly for signal metrics.

---

## 6. Feedback Loop Feasibility Assessment

### Loop 1: Intervention Lifecycle

**Signals available NOW (no new code):**
- Signal count per phase (filename dates + `phase:` field): queryable via kb.db
- Signal severity and type distributions: queryable via kb.db
- Git `fix:` commit count per phase branch: extractable via `git log`
- Session `gitBranch` linking to phase: readable from JSONL

**Signals requiring feature engineering:**
- `lifecycle_state` tracking is present but sparse (7 remediated). An extractor could supplement this with git-based remediation detection: signal filed in Phase X, `fix:` commits on Phase Y branch referencing similar files.
- Time-to-remediation: derivable from signal `date` + phase completion `SUMMARY.completed` for phases that address signals.
- Signal recurrence detection: `occurrence_count` where present + new-signal-same-tags heuristic.

**Signals requiring new data collection:**
- `session_id` in signal files (would enable exact signal -> session linking).
- `resolves_signals` consistently populated in PLAN.md (currently 4.7%).

**Earliest era with retroactive coverage:** Signal corpus begins 2026-02-11. Git history from 2025-12-15. But meaningful lifecycle tracking (lifecycle_state) starts Phase 31 (~Feb 2026). The 7 signals with `lifecycle_state: remediated` are the only complete lifecycle records.

**Key gap:** The `resolves_signals` sparsity (9/192 plans) breaks the signal -> plan -> fix chain. Without this explicit link, the infrastructure must rely on temporal proximity and thematic heuristics, which are low reliability.

**Competing interpretations for building this loop:**
- **Approach A (strict tracing):** Require `resolves_signals` going forward, accept that retroactive coverage is minimal. Pro: high reliability for new data. Con: no retroactive demonstration.
- **Approach B (heuristic reconstruction):** Build a signal-to-fix matcher using signal tags + `fix:` commit messages + file overlap. Pro: retroactive coverage. Con: low reliability, potentially misleading.
- **Approach C (case-study):** Demonstrate the loop end-to-end for the Phase 57 signal (which is well-documented) as proof of concept, then require strict tracing going forward. Pro: proves the concept with the strongest available data. Con: sample of one.

### Loop 2: Pipeline Integrity

**Signals available NOW:**
- PLAN truth count per phase (all 192 plans)
- VERIFICATION score per phase (30 frontmatter + ~35 body-text scores)
- Aggregate pass rate: 551/557 = 98.9% (intervention-tested)
- SUMMARY 1:1 invariant with PLAN (verified)
- Hook execution traces in JSONL (attachment[hook_success])
- config.json automation stats (per-sensor fire/skip counts)

**Signals requiring feature engineering:**
- Typed claim count extraction from CONTEXT.md (regex, trivial for Phase 57.2+)
- Claim-to-truth ratio per phase (claim count / truth count)
- VERIFICATION score normalization across frontmatter vs body-text eras
- Hook health metrics (average hook duration, failure rate)

**Signals requiring new data collection:**
- Typed claims in pre-57.2 CONTEXT files (retroactive impossible — would need re-execution)
- GATE-09 scope translation ledger (Phase 58, deferred)

**Earliest era:** Truth counts: all 192 plans (Phase 01+). VERIFICATION frontmatter scores: ~Phase 31+. Typed claims: Phase 57.2+ only. context_used_pct: Phase 43+.

**Key gap:** The claim propagation rate — the signature metric for detecting the Phase 57 failure pattern — has N=5 (Phases 57.2-57.4 + a few others). This is the loop most directly motivated by the audit that started this work, yet it has the thinnest retroactive data.

**Competing interpretations:**
- **Approach A (truth-count-only):** Use truth count vs VERIFICATION score as the integrity metric. Available for all phases. Doesn't detect scope narrowing from CONTEXT.
- **Approach B (claim-propagation):** Use typed claim -> truth -> verification pipeline. Only works for 57.2+. Most diagnostically powerful but extremely limited retroactive data.
- **Approach C (proxy indicators):** Use VERIFICATION status distribution + deviation density (fix: commits / plans) as pipeline health proxies. More data but less direct.

### Loop 3: Agent Performance

**Signals available NOW:**
- Session-meta: tool_counts, tool_errors, duration_minutes, lines_added/removed, user_interruptions (all 265 sessions)
- SUMMARY.md: duration, context_used_pct, model (64-192 plans depending on field)
- Session JSONL: per-turn model, token usage with cache breakdown, turn duration (142 sessions)
- Subagent JSONL: model, tokens, tool patterns per subagent (2,373 files)
- Codex: model, reasoning_effort, tokens_used, agent_role per thread (813 threads)

**Signals requiring feature engineering:**
- Model extraction from Claude JSONL (trivial: read first `assistant.message.model` per session)
- Per-subagent-type token aggregation (moderate: traverse subagent files, group by agentType)
- Phase complexity vs token consumption regression (GSD-only path using truth count vs context_used_pct)

**Signals requiring new data collection:**
- GSD profile (quality/balanced/budget) per session — not logged anywhere currently
- Reasoning token separation for Claude sessions (structurally impossible without API change)

**Earliest era:** Session-meta: 2026-01-28. Session JSONL: 2026-03-08. Codex: 2026-02-26. GSD artifacts: 2025-12-15.

**Key gap:** GSD profile is absent from all data sources. The profile controls model selection, which is the most important confound in agent performance analysis. Without it, model selection appears arbitrary rather than configured. The measurement infrastructure should add profile logging to SUMMARY frontmatter going forward.

**This loop has the most data.** It is the strongest candidate for end-to-end demonstration in Phase 57.5.

### Loop 4: Signal Quality

**Signals available NOW:**
- All 255 signals queryable via kb.db (severity, type, date, phase, lifecycle_state)
- Signal filing rate per phase: extractable from dates + phase field
- Severity distribution across time: filename dates + severity field
- Facets friction data (109 sessions, LLM-generated): second-order quality signal

**Signals requiring feature engineering:**
- Time-to-remediation: signal date -> remediation date (from lifecycle_log or git commits). Feasible for ~7-28 signals.
- Signal accuracy: requires cross-referencing with audit findings or VERIFICATION results. No automated path exists.
- Recurrence rate: occurrence_count for 40% of signals + new-signal-same-tags heuristic.

**Signals requiring new data collection:**
- Signal validation field (confirmed/invalidated by subsequent evidence)
- Signal accuracy ground truth (requires human annotation or audit-based confirmation)

**Earliest era:** Signal corpus begins 2026-02-11. lifecycle_state from Phase 31+. occurrence_count from ~Phase 40+.

**Key gap:** Signal accuracy is not measurable from current data. The system can track when signals are filed and (sometimes) when they're remediated, but not whether the signal was correct. This requires either explicit validation events or cross-referencing with audit findings.

### Loop 5: Cross-Session Patterns

**Signals available NOW:**
- Session-meta: project_path, start_time, message_hours, user_response_times, first_prompt (265 sessions)
- Session JSONL: gitBranch, queued_command, opened_file_in_ide (142 sessions)
- Codex: thread_spawn_edges, source (parent/depth), stage1_outputs.usage_count (813 threads)
- GSD knowledge base growth: signal count per month, deliberation count over time

**Signals requiring feature engineering:**
- Session clustering by project_path + temporal proximity (Lane 1 defined this)
- Momentum indicator: sessions per week per project, with gap detection
- Topic continuity: first_prompt sequence analysis for phase progression
- Friction concentration: facets friction_counts aggregated per project per time window

**Signals requiring new data collection:**
- Cross-session linking (parent_session_id or /clear continuation tracking)
- User intent tagging per session

**Earliest era:** Session-meta from 2026-01-28. Codex from 2026-02-26.

**Key gap:** Claude sessions are islands (no parent_session_id). Temporal clustering is a weak proxy for session continuity. Codex's thread_spawn_edges solves this for multi-agent sessions but not for sequential human-initiated sessions.

### Loop 6: Cross-Runtime Comparison

**Signals available NOW:**
- Claude: 265 sessions (session-meta) + 142 (JSONL) across 13 projects, 2 machines
- Codex: 813 threads in state_5.sqlite across multiple projects
- Shared join key: project_path/cwd (same project, different runtimes)
- Shared fields: model, tokens, tool invocations, git context, timestamps

**Signals requiring feature engineering:**
- Tool name normalization map (Codex exec -> Claude Bash, etc.)
- Common token metric (requires resolving Claude token semantics)
- Common error rate metric (category-based vs exit-code-based)

**Signals requiring new data collection:**
- Controlled experiments (same task executed on both runtimes)
- GSD profile logging for both runtimes

**Earliest era:** Claude from 2026-01-28. Codex from 2026-02-26. Overlap from 2026-02-26.

**Key gap:** GSD runs primarily on Claude Code. The Codex corpus is from adjacent projects. Cross-runtime comparison would mix project differences with runtime differences. A valid comparison requires either: (a) same project executed on both (currently 1 Codex-verified phase in GSD), or (b) statistical controls for project complexity.

---

## 7. Exploratory Obligations (Composite Level)

### 7.1 What we found that we were not looking for

**a. The facets dataset (Lane 1 + Lane 2).** Neither lane was tasked with inventorying LLM-generated session annotations, yet both discovered `~/.claude/usage-data/facets/` with 109 AI-annotated session quality evaluations. These contain friction categories, outcome assessments, and session type classifications that — despite their epistemic weakness as self-evaluations — constitute the only existing attempt at session quality labeling. They could serve as noisy priors for the signal quality loop.

**b. config.json as live automation telemetry (Lane 4).** The `.planning/config.json` automation stats were not documented anywhere as a measurement source. They provide ready-made automation health metrics (sensor fire rates, skip counts) that feed directly into the pipeline integrity loop with zero extraction cost.

**c. kb.db as ready-made query engine (Lane 4).** Phase 56 built a SQLite index of signal frontmatter. This database already supports SQL queries against the signal corpus — the measurement infrastructure's signal quality loop partially exists as infrastructure before 57.5 begins.

**d. `pr-link` records inline in session JSONL (Lane 2).** PR creation events are stored directly in session transcripts with full URL, PR number, and repository. This enables phase-to-PR-creation-time measurement without GitHub API calls. Relevant to the intervention lifecycle loop.

**e. `toolUseResult` as a privacy-safe structured parallel to content (Lane 2).** Every tool result carries a machine-typed structured representation alongside the model-facing content string. This means tool error detection, file edit tracking, and agent spawn analysis can be done without reading user-facing content — a design decision that makes privacy-safe extraction trivial for most agent performance metrics.

**f. `cache_creation_input_tokens` as context growth proxy (Lane 2).** The sum of `cache_read + cache_creation` tokens approximates context window utilization, even though no explicit context_used_pct exists in Claude JSONL. This is a workaround for the context dynamics gap that was assumed to be a hard limitation.

**g. Codex `runtime_metrics` and `general_analytics` feature flags (Lane 3).** Both are `under development, false`. When enabled, they would likely expose structured performance data that currently does not exist. These are future signal sources that the measurement architecture should be prepared to ingest.

### 7.2 What the exploration opened

**a. The GSD-artifacts-only measurement path.** Several measurement features (truth count vs context_used_pct, verification score trajectories, signal distributions) are computable entirely from GSD artifacts without any session data. This path has broader retroactive coverage (Phase 01+ for some metrics) and higher reliability than session-joined metrics. Phase 57.5 could demonstrate the pipeline integrity and signal quality loops using GSD artifacts alone, deferring session-data integration to 57.6.

**b. The subagent corpus as the primary analytical target.** Lane 2's finding that there are 2,373 subagent JSONL files vs 142 parent sessions (17:1 ratio) means the subagent corpus IS the primary data for agent performance measurement. Agent type + model + token breakdown per subagent is the richest unit of analysis, not the parent session. This reframes the agent performance loop from "how did this session perform?" to "how did this agent type perform?"

**c. The per-turn token trajectory as context dynamics proxy.** Without explicit context utilization percentage, the `cache_creation_input_tokens` sequence across turns within a session traces context growth. The first turn of a session creates the most cache; subsequent turns show growth. A sudden drop or plateau in cache creation could indicate compaction (if it occurs silently in Claude) or session recycling. This trajectory analysis was not conceived before the audit but is now a candidate extractor.

**d. Cross-runtime controlled experimentation as a design requirement.** The audit revealed that no valid cross-runtime comparison exists in the current data — different runtimes executed different projects. This means Phase 57.5 or 57.6 should explicitly plan a controlled experiment: same GSD phase, same project, executed on both runtimes, to populate the cross-runtime loop with genuinely comparable data.

### 7.3 What we did not look at

**a. Claude Code source code.** The token semantics anomaly (A1) can only be fully resolved by inspecting Claude Code's source. No lane was scoped to do this. The anomaly remains partially resolved.

**b. Anthropic API billing data.** Actual API consumption and cost data, if accessible via the Anthropic dashboard or API, would ground-truth the token counts from session-meta and JSONL. No lane examined billing artifacts.

**c. GitHub API data.** PR review times, CI check durations, merge-to-deploy latencies, issue tracking data — all of these are signal sources for the intervention lifecycle loop that exist outside the local machine. The audit was scoped to local artifacts only.

**d. SyncThing transfer logs.** Cross-machine synchronization between apollo and dionysus could provide data about when artifacts were copied between machines, explaining the session-meta batch-copy anomaly (A2). Not examined.

**e. Codex Cloud telemetry.** The `agent_jobs` table in state_5.sqlite is empty (Codex Cloud feature not used locally). If Codex Cloud sessions exist, they would have different signal characteristics. Not examined.

**f. VS Code extension state.** Both runtimes can be invoked from VS Code. VS Code's own extension state, workspace history, and terminal logs could provide session context not available from CLI artifacts alone. Not examined.

**g. Temporal dynamics within sessions.** No lane did detailed temporal analysis of tool call sequences within sessions — e.g., "how does tool diversity change as a session progresses?" or "do error rates increase in later turns?" The JSONL data supports this analysis but no lane performed it.

### 7.4 "I don't know yet" conclusions

- **Whether Claude Code session-meta tokens are useful at all.** The anomaly is partially resolved (JSONL tokens are canonical), but whether session-meta tokens serve any measurement purpose remains unclear.
- **Whether Claude Code performs silent context compaction.** Zero compaction events found in Claude JSONL (Lane 2). Either it doesn't compact, or it compacts without logging. We cannot distinguish these from local artifacts alone.
- **Whether the Codex `runtime_metrics` feature flag, once enabled, would provide the structured performance data that Codex currently lacks compared to what Claude's JSONL provides.** Speculative.
- **Whether the session-meta corpus will continue to grow or is a dead artifact.** The batch-copy timestamps and the non-overlap with JSONL dates suggest it may not be actively updated.
- **Whether the claim propagation pipeline (N=5) will prove diagnostically useful or is too thin.** Five data points may reveal the pattern perfectly (since one of them IS the known failure case) or may prove too noisy.

### 7.5 Framework Invisibility

**What this audit cannot inventory because of how its scope was framed:**

**The user's cognitive state as a signal source.** This audit inventoried machine-produced artifacts. But the measurement system's ultimate subject is self-improvement, which involves a human making judgments about what to measure, what interpretations to trust, and when to demand more data. The user's decisions — which signals to file manually, which phases to re-plan, when to invoke an audit — are themselves the highest-signal data about system health, and they leave no structured artifact. The `first_prompt` field captures the literal text of user invocations but not the reasoning behind them. The deliberation files capture some of this reasoning, but only when the user explicitly writes it down.

This is not an accidental gap. The audit's framing as "inventory available signal sources from machine artifacts" structurally excludes the judgment layer that the deliberation (Section 2.1) identified as "chiasmically intertwined" with epistemic rigor. The measurement infrastructure can measure everything except the wisdom that decides what measurements matter.

**Possible partial mitigation:** The facets dataset (LLM-generated session quality annotations) and the DISCUSSION-LOG artifacts are the closest existing proxies for the reasoning layer — they capture interpreted assessments, not just raw data. But they are second-order (LLM interpretation of transcripts) and third-order (LLM summary of a discussion that itself involved interpretation), not direct records of human judgment.

**A second invisible source:** The audit inventoried what each runtime exposes locally. But both Claude Code and Codex send data to their respective cloud services (Anthropic, OpenAI). The cloud-side telemetry — response latencies, server-side error rates, rate limiting decisions, model routing — is a signal source that exists, affects measurement, and is completely invisible from local artifacts. The measurement infrastructure operates on the client-side shadow of what the server knows.

---

## 8. Recommendations for Phase 57.5 Scope

### 8.1 Extractors to Build First (highest value, most feasible)

**Priority 1 (trivial, high coverage, multiple loops served):**

1. **Claude JSONL model extractor** — Extract `assistant.message.model` from first assistant record per session. Trivial. Fills the most critical gap in session-meta. Serves: agent performance, cross-runtime.

2. **Claude JSONL per-turn token extractor** — Extract `assistant.message.usage` trajectory per session. Trivial. Provides canonical token data, resolving the session-meta anomaly. Serves: agent performance, context dynamics.

3. **Claude subagent type + model + tokens extractor** — Extract `meta.json.agentType` + `assistant.message.model` + aggregated `usage` per subagent JSONL. Moderate (requires walking subagent directories). Serves: agent performance (the richest unit of analysis).

4. **GSD PLAN truth count extractor** — Parse YAML frontmatter `must_haves.truths` count per plan. Trivial. All 192 plans. Serves: pipeline integrity, agent performance.

5. **GSD VERIFICATION score extractor** — Parse score from frontmatter (30 files) + body text (remaining ~35 files). Moderate (dual-parse strategy). Serves: pipeline integrity.

6. **Signal corpus query interface** — Wire up existing kb.db as a query source. Zero new extraction — just expose existing data. Serves: signal quality, intervention lifecycle.

**Priority 2 (moderate effort, high value):**

7. **Session -> Phase linker** — Parse `gitBranch` from Claude JSONL + `first_prompt` from session-meta to link sessions to GSD phases. Moderate. Serves: all loops (enables cross-source joins).

8. **Claude hook health extractor** — Extract hook execution traces from `attachment[hook_success]` records: duration, exit code, event type per hook. Trivial. Serves: pipeline integrity.

9. **Codex thread -> GSD phase linker** — Parse `threads.git_branch` for phase identification. Trivial. Serves: cross-runtime comparison.

10. **GSD artifact era boundary registry** — A metadata table recording which fields are available in which phase ranges. Not an extractor per se, but essential for preventing queries from silently returning biased results by querying across era boundaries.

### 8.2 Feedback Loops with Enough Data for End-to-End Demonstration

**Strongest candidate: Agent Performance (Loop 3).**
- Most data across all four lanes (265 session-meta + 142 JSONL + 2,373 subagent JSONL + 813 Codex threads + 192 PLAN/SUMMARY pairs).
- Key metrics (model, tokens, tool patterns, duration) available NOW from at least one source per runtime.
- The subagent type + model + token analysis can be demonstrated retroactively across the full JSONL corpus.
- Does not depend on sparse fields (unlike intervention lifecycle or pipeline integrity).

**Second candidate: Pipeline Integrity (Loop 2) — GSD-artifacts-only path.**
- Truth count, verification score, and SUMMARY metrics are available for all 192 plans.
- The claim propagation metric (typed claims) is limited to Phase 57.2+ (N=5), but the truth-to-verification pipeline covers all phases.
- Can demonstrate "truth encoding rate" and "verification pass rate" end-to-end without session data.

**Third candidate: Signal Quality (Loop 4).**
- kb.db already exists. Severity distributions, type distributions, filing rate per phase — all queryable now.
- Time-to-remediation is sparse but demonstrable for the ~7-28 signals with lifecycle data.

### 8.3 Load-Bearing Architectural Decisions Forced by the Signal Inventory

**Decision 1: JSONL per-turn data is the canonical Claude token source, not session-meta.**
The token semantics anomaly forces this. Session-meta tokens appear to measure something different from API consumption. The raw layer must ingest JSONL `assistant.message.usage` records. This makes the raw layer larger (JSONL files are 961 MB total) but more accurate.

**Decision 2: The raw layer must handle data-source non-overlap.**
Session-meta covers Jan 28 - Mar 15. JSONL covers Mar 8 - Apr 16. The raw layer must model "this session has source A but not source B" as a first-class concept, not an error condition. Extractors must declare which sources they require and gracefully degrade when sources are absent.

**Decision 3: Era boundaries are schema-level metadata, not just documentation.**
The format era boundaries (typed claims: 57.2+, context_used_pct: 43+, VERIFICATION frontmatter score: ~31+) must be encoded in the extractor registry. An extractor that queries typed claim counts should declare `era_start: "57.2"`, and the query layer should warn when results span an era boundary ("NOTE: this metric is only available for 5 of 65 phases").

**Decision 4: Agent (subagent) is the primary unit of analysis for performance, not session.**
The 17:1 subagent-to-parent ratio means performance measurement is primarily about subagent behavior. The extractor registry should model agents as first-class entities with their own token, model, and tool usage profiles. Sessions are containers; agents are the subjects.

**Decision 5: Cross-runtime comparison requires explicit `not_available` markers, not null.**
When a query touches reasoning_effort for Claude sessions, or reasoning_output_tokens for Claude, the system must return "not available for this runtime" rather than null/zero. This is the P4 design principle operationalized.

### 8.4 What to Explicitly Defer

**Defer to Phase 57.6:**
- **Cross-session pattern extractors** — These require session clustering algorithms and temporal analysis that add complexity without serving the priority loops (agent performance, pipeline integrity). The raw data is preserved for later.
- **Full Codex extractor suite** — Phase 57.5 should build one Codex extractor (thread model + tokens, or thread -> phase linker) to prove the cross-platform architecture. Full Codex coverage is 57.6 scope.
- **Human visualization** — Phase 57.5 is agent-consumable JSON query interface. Human-readable reports are 57.6.
- **Facets integration** — The LLM-generated session quality annotations are epistemically weak and require a calibration strategy before they can be trusted as labels. Defer the calibration work.
- **Privacy model for content-level extraction** — Lane 2 identified privacy-sensitive features (message text, stdout content, agent prompts). The privacy model is a 57.7 design decision; 57.5 should use only privacy-safe structural features.

**Defer to Phase 57.7:**
- **Session content analysis** (tool call sequence patterns, topic shift detection, intervention point identification) — Requires the privacy model.
- **Claim-truth semantic alignment** — The claim propagation pipeline requires NLP for matching governing claims to plan truths. Phase 57.5 should demonstrate count-level metrics only; semantic matching is 57.7.
- **Automated distinguishing feature suggestion** — The post-Popperian epistemic machinery needs working extractors before it can suggest "compute feature X to distinguish interpretation A from B."

**Defer to Phase 58 or later:**
- **`resolves_signals` backfill** — Retroactively populating the signal-plan linkage for 183 plans that lack it would be valuable but is not measurement infrastructure work. It's data quality work that could be a 57.6 or later effort.
- **Controlled cross-runtime experiment** — Running the same GSD phase on both runtimes to populate the cross-runtime loop requires deliberate experiment design, not just extraction. Phase 57.6 or a dedicated spike.
- **GATE-09 implementation** — Deferred to Phase 58 per the deliberation's deferral ledger.

---

*Synthesis completed 2026-04-15. All epistemic statuses carried forward from lane outputs without upgrade. Cross-lane findings add perspective, not confirmation.*
