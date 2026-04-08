# Architecture: v1.20 Signal Infrastructure & Epistemic Rigor Integration

**Domain:** GSD Reflect workflow harness — v1.20 feature integration
**Researched:** 2026-04-08
**Confidence:** HIGH (all existing components read, custom research fully ingested)

---

## Existing Architecture (Baseline)

The current architecture has five layers:

```
COMMAND LAYER (thin orchestrators — commands/gsd/*.md)
    |
    v
WORKFLOW LAYER (get-shit-done/workflows/*.md)
    |
    v
AGENT LAYER (agents/gsd-*.md)
    |           |
    v           v
NODE.JS CLI   KNOWLEDGE STORE
(gsd-tools.cjs + lib/*.cjs modules)   (.planning/knowledge/)
    |                   |
    v                   v
HOOK LAYER         FILE INDEX
(hooks/*.js)       (index.md via kb-rebuild-index.sh)
```

### CLI Module Inventory (16 lib/*.cjs modules)

| Module | Responsibility |
|--------|----------------|
| `core.cjs` | Shared utilities: output, error, path resolution, resolveWorktreeRoot, atomicWriteJson |
| `state.cjs` | STATE.md read/write, metrics recording, decision/blocker tracking |
| `phase.cjs` | Phase discovery, plan listing |
| `roadmap.cjs` | ROADMAP.md parsing and updates |
| `verify.cjs` | Summary verification |
| `config.cjs` | config.json read/write |
| `template.cjs` | Plan/artifact template selection and filling |
| `milestone.cjs` | Milestone operations |
| `commands.cjs` | commit, resolve-model |
| `init.cjs` | Batch context loader for execute-phase, plan-phase, new-project, new-milestone |
| `frontmatter.cjs` | YAML frontmatter parsing and signal schema |
| `sensors.cjs` | Sensor discovery and blind-spot reporting |
| `backlog.cjs` | Backlog entry management |
| `health-probe.cjs` | Health probe dimensions |
| `manifest.cjs` | File manifest diff-config, apply-migration |
| `automation.cjs` | Automation level tracking, lock/unlock, reflection counter |

### Knowledge Store Structure

```
.planning/knowledge/          (project-local)
~/.gsd/knowledge/             (global fallback)
  +-- signals/{project}/      (YAML frontmatter .md files — 198 entries)
  +-- spikes/{project}/       (spike DESIGN/FINDINGS/DECISION artifacts)
  +-- lessons/{category}/     (0 entries — reflection pipeline not running)
  +-- reflections/{project}/  (periodic synthesis outputs)
  +-- index.md                (auto-generated via kb-rebuild-index.sh)
```

**Key invariant:** Files are source of truth. `index.md` is a derived artifact rebuilt by `kb-rebuild-index.sh` (bash script, O(n) reads, scalability ceiling at ~1000 entries).

### Sensor Pipeline (Multi-Sensor Architecture)

```
collect-signals.md (orchestrator workflow)
    |
    +-- Task(gsd-artifact-sensor)    --> JSON signal candidates
    +-- Task(gsd-git-sensor)         --> JSON signal candidates
    +-- Task(gsd-log-sensor)         --> JSON signal candidates (partially active)
    |
    +-- Merge all JSON outputs
    |
    +-- Task(gsd-signal-synthesizer) --> Dedup + rigor gates + write to KB
```

**Single-writer principle:** Only `gsd-signal-synthesizer` writes to KB. Sensors return JSON only and do not touch the filesystem.

**Auto-discovery:** `collect-signals.md` scans for `gsd-*-sensor.md` files. Adding a new sensor is a single-file operation.

### Execute-Phase Postlude Chain

```
execute_waves → aggregate_results → verify_phase_goal
    → auto_collect_signals (postlude 1, conditional on verification pass)
    → health_check_postlude (postlude 2)
    → auto_reflect_postlude (postlude 3)
    → offer_next
```

Context budget increases with each postlude to account for cumulative cost. Cross-runtime degradation: hooks unavailable on Codex CLI — each postlude is a workflow-step-based advisory fallback.

---

## v1.20 Feature Integration Map

### Overview: New Components vs Modified Components

| Component | Status | Type |
|-----------|--------|------|
| `lib/telemetry.cjs` | **NEW** | CLI module — session-meta/facets extraction |
| `lib/kb.cjs` | **NEW** | CLI module — SQLite KB index queries |
| `agents/gsd-spike-design-reviewer.md` | **NEW** | Agent spec — pre-execution spike design critique |
| `agents/gsd-patch-sensor.md` | **NEW** | Agent spec — source-vs-installed divergence detection |
| `commands/gsd/cross-model-review.md` | **NEW** | Command — flexible cross-model review protocol |
| `commands/gsd/revise-phase-scope.md` | **NEW** | Command — highest-impact missing command (N02) |
| `.planning/knowledge/kb.db` | **NEW** | Derived artifact — SQLite index (gitignored) |
| `agents/gsd-log-sensor.md` | **MODIFY** | Add cross-runtime adapter (Claude Code + Codex JSONL) |
| `get-shit-done/workflows/execute-phase.md` | **MODIFY** | Add offer_next PR/CI gate, branch detection, .continue-here lifecycle |
| `get-shit-done/workflows/run-spike.md` | **MODIFY** | Add design reviewer invocation as mandatory pre-execution gate |
| `get-shit-done/workflows/collect-signals.md` | **MODIFY** | Wire lifecycle transitions via resolves_signals; add patch sensor |
| `get-shit-done/references/signal-detection.md` | **MODIFY** | Extended signal schema (lifecycle, disposition, qualified_by, etc.) |
| `get-shit-done/references/knowledge-surfacing.md` | **MODIFY** | Prefer gsd-tools kb query over grep on index.md |
| `get-shit-done/bin/gsd-tools.cjs` | **MODIFY** | Add telemetry and kb command cases to router |
| `get-shit-done/bin/kb-rebuild-index.sh` | **MODIFY** | Extend to produce kb.db alongside index.md |
| `hooks/gsd-statusline.js` | **MODIFY** | Add cost/rate-limit fields to bridge file (pending spike E) |
| `bin/install.js` | **MODIFY** | Add post-install cross-runtime parity check |
| STATE.md state management | **MODIFY** | Per-worktree file partitioning for parallel execution |

---

## Feature-by-Feature Integration Details

### 1. SQLite KB Index (`lib/kb.cjs`)

**Integration layer:** CLI module, same pattern as `sensors.cjs` and `automation.cjs`.

**Slot in gsd-tools.cjs router:**
```javascript
case 'kb': {
  // subcommands: rebuild, query, stats, health, transition, link, search
}
```

**Data flow:**
```
.planning/knowledge/signals/**/*.md  (source of truth)
    |
    v [gsd-tools kb rebuild]
.planning/knowledge/kb.db             (derived SQLite index — gitignored)
    |
    v [gsd-tools kb query --format json]
Agents (knowledge-surfacing.md queries)
```

**Modifications to existing components:**

- `get-shit-done/bin/kb-rebuild-index.sh`: Extended to call `gsd-tools kb rebuild` after generating `index.md`. During v1.20, both `index.md` (backward compat) and `kb.db` (new) are produced.
- `get-shit-done/references/knowledge-surfacing.md`: Updated to prefer `gsd-tools kb query --tags "..." --format json` when SQLite index exists, with graceful fallback to `grep` on `index.md` when it does not.

**Schema tables:** `signals`, `signal_tags`, `signal_links`, `spikes`, and FTS5 virtual table `signal_fts`. The `content_hash` field enables incremental rebuild (only reindex changed files).

**What this enables immediately:** Relational queries ("critical signals with lifecycle=detected, sorted by date"), tag-based filtering, lifecycle state reports, occurrence counting, and `gsd-tools kb stats` KB health dashboard. These were previously impossible without reading all 198+ files.

**Deferred:** MCP server wrapper (v1.21). Vector embeddings (not needed at current scale). Signal-to-issue promotion fields (v1.21 territory — schema reserves `promoted_to` name but does not implement it).

---

### 2. Signal Schema Extensions (`get-shit-done/references/signal-detection.md`)

**New YAML frontmatter fields (additive, backward-compatible):**

```yaml
lifecycle: detected|proposed|in_progress|blocked|remediated|verified|invalidated
disposition: fix|formalize|monitor|investigate|defer
qualified_by: []
superseded_by: ""
polarity: negative|positive|mixed|neutral   # adds 'mixed' to existing enum
remediation:
  phase: ""
  commit: ""
  method: code-fix|workflow-change|convention|config
  date: ""
  verified: false
```

**Lifecycle wiring (new behavior in `collect-signals.md`):**

After signal synthesis, the collect-signals workflow reads completed plans' `resolves_signals` frontmatter field (which already exists since Phase 34) and calls `gsd-tools kb transition <id> remediated` for each matching signal. This is the simplest wiring that closes the 0% remediation tracking gap.

**New CLI subcommand chain:**
```
gsd-tools kb transition <signal-id> remediated --reason "resolved in phase 53-02"
    |
    v
Updates: .planning/knowledge/signals/.../sig-*.md frontmatter (lifecycle field)
         .planning/knowledge/kb.db (SQLite row)
```

---

### 3. Telemetry Module (`lib/telemetry.cjs`)

**Integration layer:** New CLI module, same pattern as `automation.cjs`.

**Slot in gsd-tools.cjs router:**
```javascript
case 'telemetry': {
  // subcommands: summary, session, phase, baseline, enrich
}
```

**Data sources (all read-only, no new instrumentation):**
```
~/.claude/usage-data/session-meta/*.json   (268 sessions, pre-aggregated)
~/.claude/usage-data/facets/*.json          (109 sessions, AI quality summaries)
```

**Key enrichment:** Join session-meta + facets by `session_id`, filter by `project_path` matching `resolveWorktreeRoot(cwd)` to aggregate across worktree sessions correctly.

**Output:** `gsd-tools telemetry baseline --project get-shit-done-reflect` writes `.planning/baseline.json` for pre/post intervention comparison.

**What this does NOT do:** Token cost calculation (avoids pricing table maintenance per constraint 4 from MILESTONE-CONTEXT.md). Per-message JSONL parsing (session-meta is sufficient for v1.20 baselines; JSONL-level granularity is v1.21+ if needed).

**Bridge file extension (pending spike E validation):** `hooks/gsd-statusline.js` extended to write `cost.total_cost_usd` and `rate_limits` fields to `claude-ctx-{session}.json` bridge file — IF spike E confirms these fields are available in the statusline payload. This is conditional on spike results, not a guaranteed v1.20 deliverable.

---

### 4. Spike Design Reviewer Agent (`agents/gsd-spike-design-reviewer.md`)

**New component.** An independent critique agent invoked before spike execution.

**Integration point:** `get-shit-done/workflows/run-spike.md`, between DESIGN.md presentation and execution:

```
Current: design → user_review → execution
v1.20:   design → design_reviewer [NEW] → user_sees_critique → execution
```

**Key design requirements from spike-epistemology-research.md:**
- Must use a DIFFERENT model from the one that wrote DESIGN.md (Longino's diversity requirement, F02 self-evaluation degeneracy). Cross-model is structural, not optional.
- Produces a critique document, NOT a pass/fail verdict (quality improvement, not gatekeeping).
- The spike designer sees the critique AND can proceed with documented justification (Feyerabend escape valve).
- The critique and response are recorded as artifacts alongside DESIGN.md.

**Three-tier enforcement model (from spike-epistemology-research.md Section 6.3):**
- **Tier 1 (structural):** Reviewer is invoked. Cross-model. Critique + response recorded.
- **Tier 2 (cultural):** Severity assessment, progressiveness assessment — prompted in reviewer context, not enforced.
- **Tier 3 (warned):** Single-metric-only decisions, evaluation-framework entanglement, circular auxiliary assumptions — design reviewer flags them, designer can override with justification.

**Auxiliary hypothesis register:** DESIGN.md template gains a new section (additive to existing template) listing load-bearing auxiliaries (what is assumed, not tested). The design reviewer checks claims against the register.

**DECISION.md template extension:** Adds `decided/provisional/deferred` as first-class outcome types alongside the existing `confirmed/rejected/inconclusive`. This addresses the structural pressure toward premature closure (gap 2.4).

---

### 5. Log Sensor Cross-Runtime Adapter (`agents/gsd-log-sensor.md`)

**Modified component.** The existing log sensor (Claude Code only) gains a runtime adapter layer.

**Architecture change:**
```
Current:
    gsd-log-sensor → Session Discovery (Claude Code JSONL only) → Fingerprinting → Triage → Signal

v1.20:
    gsd-log-sensor → Runtime Detector → Format Adapter
                                            |
                          +----------------+----------------+
                          v                                 v
               Claude Code Adapter                  Codex CLI Adapter
               (~/.claude/projects/...)             (~/.codex/state_5.sqlite + sessions/)
                          |                                 |
                          +----------------+----------------+
                                           v
                          Normalized Fingerprint Schema (runtime-agnostic)
                                           v
                          Structural Fingerprinting → Triage → Signal
```

**Runtime-specific stages:** Session discovery and message extraction only. Stages 3+ (fingerprinting, triage, signal construction) are runtime-agnostic and unchanged.

**Codex session discovery uses SQLite:**
```bash
sqlite3 ~/.codex/state_5.sqlite \
  "SELECT rollout_path FROM threads WHERE cwd = '$(pwd)' ORDER BY created_at DESC"
```

This is strictly richer than Claude Code's directory-scan discovery, providing git_sha, git_branch, tokens_used for pre-filtering.

**Token field mapping difference:** Claude Code token data is in nested `progress.data.message.message.usage`; Codex uses top-level `event_msg.payload.type = "token_count"` events. Codex additionally provides `reasoning_output_tokens` (Claude Code does not expose this).

---

### 6. Patch Sensor (`agents/gsd-patch-sensor.md`)

**New sensor agent.** Detects source-vs-installed divergence and cross-runtime drift.

**Two detection layers:**
- **Layer 1 (source vs installed):** Compare npm source hashes against installed runtime file hashes via existing `gsd-file-manifest.json` mechanism. Detects: installer bugs, stale installs, format conversion errors.
- **Layer 2 (cross-runtime installed):** Compare `.claude/` against `.codex/` installs after accounting for expected format differences (YAML→TOML, tool name remapping). Detects: missing files, semantic content divergence beyond format conversion, feature gaps.

**Classification taxonomy:** bug / stale / customization / format-drift / feature-gap.

**Integration points:**
1. `bin/install.js` gains `checkCrossRuntimeParity()` function that runs after successful install — if `.codex/` exists with GSD installed, compare versions and offer `--codex` update (Approach B from cross-runtime-parity-research.md).
2. `gsd-tools kb` gains a `distribution-check` subcommand (or the patch sensor can be invoked via collect-signals for the dev project).

**Signal output:** Patch sensor follows the standard sensor contract — returns JSON signal candidates to `collect-signals.md` orchestrator. The synthesizer applies normal quality gates.

**Scope note:** This sensor is most useful in the GSDR development repo itself. End-user projects are served by the installer's `saveLocalPatches` mechanism, which already runs before each install.

---

### 7. Cross-Model Review Command (`commands/gsd/cross-model-review.md`)

**New command.** Formalizes the strongest positive pattern from the audit (cross-model review appeared in 35 positive patterns as P01-P08 cluster).

**Design principle from spike-epistemology-research.md:** Do not over-formalize. The pattern works partly because it is context-responsive. The command should add structure (who reviews what, what categories of critique, how to record findings) without mandating rigid protocols that kill adaptiveness.

**Command scope:** Works for any review target — phase plan, spike DESIGN.md, agent spec, workflow, architecture decision. Not scoped to spikes only.

**Cross-runtime note:** This is actually enhanced on Codex because the user already runs cross-model review using `codex exec` on Dionysus while Claude Code runs on Apollo. The command should accommodate both "the user invokes this manually" and "the design reviewer agent invokes this as part of spike review."

---

### 8. Revise-Phase-Scope Command (`commands/gsd/revise-phase-scope.md`)

**New command.** Highest-impact missing command identified in audit (N02).

**Integration points:**
- Reads `.planning/phases/{N}-*/` to understand current scope
- Updates ROADMAP.md phase section with revised goals
- Creates a revision artifact documenting what changed and why
- Updates STATE.md

**This is a pure workflow addition** — no new CLI modules or agents required. The command orchestrates existing tools (`gsd-tools state`, `gsd-tools roadmap`, existing templates) with new workflow logic for scope revision.

---

### 9. Offer-Next PR/CI Gate (`execute-phase.md` modification)

**Modified component.** The `offer_next` step becomes structural, not advisory.

**Current behavior (advisory):** Presents PR creation as an option after phase completes. The user can skip it entirely.

**v1.20 behavior (structural on Claude Code):** After a phase on a non-main branch, PR creation and CI check are presented as a blocking checkpoint — the workflow will not advance to "next phase" framing until the user either confirms CI passed or explicitly overrides.

**Cross-runtime:** This is workflow-text enforcement, not hook-dependent. Full parity on Codex.

**Branch detection:** SessionStart hook (Claude Code) or workflow-invocation check (Codex) detects "quick task" branch vs "phase" branch to avoid triggering PR flow for ad-hoc work.

---

### 10. `.continue-here` Consumption Lifecycle

**Modified component.** Currently `.continue-here` files accumulate without being consumed.

**New behavior:**
- `resume-work.md` workflow explicitly checks for and deletes `.continue-here` on pickup
- `execute-phase.md` already cleans up `.continue-here` files after phase completion (line 289-292 in current source); this becomes more explicit and reliable
- Post-session hook (Claude Code only) deletes stale `.continue-here` files; advisory reminder on Codex

---

### 11. Parallel Execution State Management

**Modified component.** STATE.md conflict resolution for parallel worktrees.

**Recommended approach (Approach 1 from measurement-infrastructure-research.md):**

```
Current: Single STATE.md (read-modify-write, merge conflicts on parallel worktrees)

v1.20:
  STATE.md              (coordination file — milestone, project reference, roadmap evolution)
  .planning/state/
    +-- main.json       (main branch worktree state)
    +-- gsd/phase-55.json  (parallel worktree state, separate file)
    +-- gsd/phase-56.json  (another parallel worktree, no conflicts)
```

**Implementation:** `resolveWorktreeRoot()` already exists in `core.cjs`. Extend `state.cjs`'s `writeStateMd()` to detect worktree context and route writes to per-worktree JSON files. `gsd-tools state json` reads all `state/*.json` files and merges for composite view.

**Why not locking (Approach 2):** Lock files are per-directory and not shared across worktrees — the lock exists in each worktree's `.planning/` independently and cannot prevent git-merge-time conflicts. This approach is fundamentally mismatched to the problem.

**Migration path to Approach 4 (append-only log):** Per-worktree JSON files are a stepping stone. If parallel execution becomes routine, each JSON file already represents an independent state stream that could be refactored as an event log without changing the interface.

---

## Data Flow Changes

### Signal Lifecycle Flow (New)

```
Phase executes
    → PLAN.md contains resolves_signals: [sig-id-1, sig-id-2]
    → collect-signals.md runs post-phase
    → artifact-sensor detects new signals → JSON
    → log-sensor detects missed signals → JSON
    → git-sensor detects patterns → JSON
    → signal-synthesizer writes new signals to KB (.md files)
    → [NEW] collect-signals reads resolves_signals from completed PLANs
    → [NEW] gsd-tools kb transition sig-id-1 remediated
    → [NEW] gsd-tools kb rebuild (incremental, via content hashing)
    → kb.db updated (SQLite index reflects new state)
    → future: gsd-tools kb query --lifecycle remediated shows closed signals
```

### Telemetry Baseline Flow (New)

```
Before v1.20 intervention:
    gsd-tools telemetry baseline --project get-shit-done-reflect
        → Reads ~/.claude/usage-data/session-meta/*.json
        → Left-joins ~/.claude/usage-data/facets/*.json by session_id
        → Filters by project_path matching current project
        → Computes distributions (p25, median, p75, p90) for numeric fields
        → Writes .planning/baseline.json

After v1.20 deployment (N sessions later):
    gsd-tools telemetry baseline --project get-shit-done-reflect --compare
        → Same computation
        → Compares against .planning/baseline.json
        → Reports delta for each metric
```

### Spike Review Flow (New)

```
/gsd:spike DESIGN.md
    → gsd-spike-runner.md: design phase
    → [NEW] Invoke gsd-spike-design-reviewer (DIFFERENT model)
    → Reviewer reads DESIGN.md + METHODOLOGY.md + auxiliary register
    → Reviewer produces critique document (3 tiers: severity gaps, auxiliary issues, anti-pattern flags)
    → Spike designer sees critique
    → Designer responds: accept / acknowledge / dispute (all legitimate)
    → [NEW] Critique + response recorded as CRITIQUE.md alongside DESIGN.md
    → Execution proceeds
```

### KB Query Flow (New vs Old)

```
Old: agents read knowledge-surfacing.md → grep on .planning/knowledge/index.md
     Limitation: full table scan, no relational queries, no lifecycle filtering

New: agents read knowledge-surfacing.md → gsd-tools kb query --tags "..." --format json
     If kb.db does not exist: fallback to grep on index.md (backward compat)
     gsd-tools kb query --severity critical --lifecycle detected --format json
     → returns structured JSON, no filesystem reads in agent context
```

---

## Component Boundary Summary

| Layer | New Components | Modified Components |
|-------|---------------|---------------------|
| Commands | cross-model-review.md, revise-phase-scope.md | (none) |
| Workflows | (none) | execute-phase.md, run-spike.md, collect-signals.md |
| Agents | gsd-spike-design-reviewer.md, gsd-patch-sensor.md | gsd-log-sensor.md |
| CLI Modules | telemetry.cjs, kb.cjs | gsd-tools.cjs (router), state.cjs (worktree routing) |
| References | (none) | signal-detection.md, knowledge-surfacing.md |
| Templates | DESIGN.md template (auxiliary register, CRITIQUE.md) | (none) |
| Store | kb.db (SQLite, gitignored) | signal schema fields (additive) |
| Hooks | (none) | gsd-statusline.js (bridge file fields, conditional) |
| Installer | (none) | bin/install.js (cross-runtime parity check) |

---

## Build Order (Dependency Graph)

Dependencies flow upward — later items depend on earlier ones being complete.

### Phase A: Foundation (unblocked, can start immediately)

1. **Signal schema extension** (`signal-detection.md` + `frontmatter.cjs`)
   - Additive fields only, zero breaking changes
   - Unblocks lifecycle wiring in collect-signals

2. **`lib/kb.cjs` SQLite index**
   - `rebuild`: parses YAML frontmatter into SQLite (depends on updated schema from #1)
   - `query`, `stats`, `health`, `transition`, `link`, `search`
   - Produces `kb.db` alongside `index.md` (backward compat)
   - Unblocks knowledge-surfacing.md update and lifecycle wiring

3. **`lib/telemetry.cjs` module**
   - Reads `~/.claude/usage-data/` — no dependencies on other v1.20 components
   - `summary`, `session`, `phase`, `baseline`, `enrich` subcommands
   - Produces `.planning/baseline.json` for pre-intervention measurement

### Phase B: Structural Gates (depends on Phase A)

4. **Lifecycle wiring in `collect-signals.md`**
   - Reads `resolves_signals` from completed plan frontmatter
   - Calls `gsd-tools kb transition` for matching signals
   - Depends on #1 (schema) and #2 (kb.cjs transition command)

5. **`knowledge-surfacing.md` update**
   - Agents prefer `gsd-tools kb query` over grep
   - Depends on #2 (kb.cjs query command)

6. **`offer_next` PR/CI gate** (`execute-phase.md`)
   - Structural enforcement of PR creation + CI check
   - No module dependencies — workflow-text change
   - Quick task branch detection (hook on Claude Code, CLI check on Codex)

7. **`.continue-here` consumption lifecycle** (`resume-work.md`, `execute-phase.md`)
   - No module dependencies — workflow-text changes
   - Pair with #6 (both are execute-phase modifications)

### Phase C: New Sensors and Agents (depends on Phase B)

8. **Log sensor cross-runtime adapter** (`gsd-log-sensor.md`)
   - Codex session discovery via `state_5.sqlite`
   - Format adapter for Codex JSONL structure
   - Depends on existing sensor contract (unchanged) but benefits from Phase A schema

9. **Spike design reviewer agent** (`gsd-spike-design-reviewer.md`)
   - New agent spec + `run-spike.md` modification
   - DESIGN.md template gains auxiliary register section
   - DECISION.md template gains decided/provisional/deferred outcome types
   - Cross-model invocation built into workflow step

10. **Patch sensor** (`gsd-patch-sensor.md`)
    - New sensor agent + `bin/install.js` cross-runtime parity check
    - Depends on existing sensor contract (unchanged)

### Phase D: Workflow Commands (depends on Phase A, C)

11. **`/gsdr:revise-phase-scope`** command
    - Pure workflow addition, orchestrates existing gsd-tools subcommands
    - No new modules required

12. **`/gsdr:cross-model-review`** command
    - Formalizes existing positive pattern
    - Light formalization — structure without rigidity

### Phase E: Parallel Execution (depends on Phase A)

13. **Per-worktree state partitioning** (`state.cjs` + `core.cjs`)
    - Extend `writeStateMd()` to route writes via `resolveWorktreeRoot()`
    - `gsd-tools state json` merges per-worktree files for composite view
    - Only needed when parallel phase execution is actively used

**Recommended sequencing:** A → B (lifecycle wiring + execute-phase gates) → C (sensors + spike reviewer) → D (commands) → E (parallel, if needed before milestone end).

Phases A and B items can be built in a single construction phase because they are all small. Items in C are mid-size independent parallel efforts. D items are quick. E is separately gated.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: MCP Server for KB (Premature)
**What it is:** Building an MCP server to wrap the KB instead of CLI.
**Why problematic:** 199 entries do not need server infrastructure. Adds operational complexity (config per machine, process management, offline failures) without solving the immediate query problem. philograph-mcp is the cautionary tale — PostgreSQL + pgvector for a use case that SQLite handles.
**Instead:** CLI now (`gsd-tools kb`), MCP wrapper later (v1.21) when cross-machine access is genuinely needed. The CLI API becomes the MCP server's implementation without redesign.

### Anti-Pattern 2: Mandatory Severity Thresholds in Spike Review
**What it is:** "All findings must pass severity score X" automated gate.
**Why problematic:** Produces gaming (designing experiments to hit the threshold). Severity is qualitative judgment, not a metric. Feyerabend: rigid rules suppress productive deviation.
**Instead:** Design reviewer produces critique document with severity assessment. Designer responds. Three-tier enforcement (structural: reviewer invoked; cultural: assessment prompted; warned: anti-patterns flagged with override).

### Anti-Pattern 3: Breaking the Single-Writer Principle
**What it is:** Having `gsd-tools kb transition` update SQLite without updating `.md` files, or sensors writing directly to KB.
**Why problematic:** SQLite is a derived cache. The `.md` files are the source of truth and the git history. Divergence between them creates data integrity problems.
**Instead:** `gsd-tools kb transition` always updates both the `.md` frontmatter and the SQLite row atomically. `kb.db` is in `.gitignore` and reconstructable from files at any time.

### Anti-Pattern 4: Telemetry Infrastructure Without Baseline First
**What it is:** Building the telemetry module, deploying v1.20 changes, then computing baselines.
**Why problematic:** Post-intervention baselines are contaminated by the interventions. You lose the ability to attribute changes to specific interventions.
**Instead:** Run `gsd-tools telemetry baseline` before deploying any v1.20 structural changes. Write `.planning/baseline.json`. THEN deploy. Compare after N sessions.

### Anti-Pattern 5: State Locking for Cross-Worktree Conflicts
**What it is:** Using `automation lock/unlock` to prevent concurrent STATE.md writes across worktrees.
**Why problematic:** Lock files live in each worktree's `.planning/` directory independently. Worktree A's lock is invisible to worktree B. The conflict happens at git merge time, not at file write time. This does not solve the stated problem (measurement-infrastructure-research.md Section 6, Approach 2 analysis).
**Instead:** Per-worktree JSON state files. Different filenames means no merge conflicts. Materialized view `gsd-tools state json` reads all files and merges.

### Anti-Pattern 6: Hardcoding Log Sensor to Claude Code JSONL
**What it is:** Treating the Claude Code JSONL format as the universal log format.
**Why problematic:** Codex CLI uses a different JSONL schema (`session_meta`, `event_msg`, `response_item`, `turn_context` event types). Codex also has `state_5.sqlite` for session discovery, which is richer than directory scanning.
**Instead:** Format adapter pattern in the log sensor. Only session discovery and message extraction stages are runtime-specific. Triage, fingerprinting, and signal construction are runtime-agnostic.

---

## Confidence Assessment

| Component | Confidence | Basis |
|-----------|------------|-------|
| SQLite KB index design | HIGH | Three open-source precedents (MarkdownDB, Palinode, sqlite-memory); SQLite universally available; codebase evidence (198 signal files, kb-rebuild-index.sh scalability ceiling) |
| Signal schema extensions | HIGH | Grounded in audit data (0% remediation tracking, 35 positive signals unrecordable); additive-only, backward-compatible |
| Telemetry module design | HIGH | Session-meta and facets schemas documented from actual files; integration follows established gsd-tools module pattern |
| Spike design reviewer agent | MEDIUM-HIGH | Grounded in 4 independent sources (spike gap analysis, arxiv-sanity-mcp audit, epistemic-agency F02/I09, philosophy of science research); agent implementation details need validation |
| Log sensor adapter design | MEDIUM | Format analysis from actual JSONL files is solid; extraction code needs testing against edge cases (subagent sessions, long sessions) |
| Per-worktree state partitioning | MEDIUM-HIGH | Uses existing `resolveWorktreeRoot()` and `atomicWriteJson()`; untested in practice; STATE.md interface change is non-trivial |
| Parallel execution (broader) | MEDIUM | Approach 1 is pragmatic; Approach 4 (event log) is the right long-term architecture but implementation complexity is uncertain |
| Patch sensor | MEDIUM | Built on existing `saveLocalPatches()` mechanism (validated); classification taxonomy is proposed, not empirically validated |
| Bridge file extension | LOW | Depends on spike E validating that statusline payload exposes cost/rate-limit fields; do not implement without spike |

---

## Sources

**Custom research (mandatory reading, all ingested):**
- `.planning/research/kb-architecture-research.md` — File+SQLite architecture, signal schema, query layer design
- `.planning/research/measurement-infrastructure-research.md` — Telemetry module, parallel STATE.md approaches, baseline strategy
- `.planning/research/cross-runtime-parity-research.md` — Capability matrix, log sensor adapter, patch sensor, Codex SQLite schema
- `.planning/research/spike-epistemology-research.md` — Three-tier enforcement model, Lakatos/Mayo/Duhem-Quine applications, design reviewer requirements

**Codebase (directly read):**
- `get-shit-done/bin/gsd-tools.cjs` (router, 16 module imports)
- `get-shit-done/bin/lib/sensors.cjs`, `automation.cjs`, `core.cjs` (module patterns)
- `agents/gsd-signal-synthesizer.md`, `gsd-log-sensor.md`, `gsd-signal-collector.md` (sensor architecture)
- `get-shit-done/workflows/collect-signals.md`, `execute-phase.md` (workflow integration points)
- `.planning/knowledge/` structure (198 signal files, 0 lessons, kb-rebuild-index.sh)
