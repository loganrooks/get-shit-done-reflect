# Stack Research: Signal Lifecycle, Multi-Sensor Detection, Epistemic Rigor

**Domain:** Signal lifecycle management, git-based analysis, session log parsing, YAML schema validation, and confidence/evidence tracking -- all within a zero-dependency file-based CLI system
**Researched:** 2026-02-27
**Confidence:** HIGH (all recommendations verified against existing codebase patterns; no new dependencies required)

---

## Executive Summary

The v1.16 signal lifecycle features -- multi-sensor detection (git-sensor, log-sensor), epistemic rigor enforcement, confidence-weighted pattern detection, and signal lifecycle state management -- are achievable with **zero new npm dependencies**. Every capability needed already exists in the Node.js standard library or in git's built-in command-line interface.

**Core finding:** Git provides structured output formats (`--format`, `--numstat`, `--diff-filter`) that can be parsed with `execSync` and string splitting. Claude Code session logs are JSONL files at `~/.claude/projects/{encoded-path}/{session-id}.jsonl` with typed message objects. YAML frontmatter validation already exists in gsd-tools.js via `FRONTMATTER_SCHEMAS` and `cmdFrontmatterValidate()` -- extending it for epistemic rigor fields is a schema addition, not a new system. Signal lifecycle state management maps cleanly onto the existing mutable-field-on-immutable-entry pattern already used for archival.

**The constraint that shapes everything:** Zero external dependencies. The system runs via `npx` on any Node.js installation across 4 runtimes. `child_process.execSync` wrapping git CLI commands is the correct approach for git analysis -- not a git library. Line-by-line JSONL parsing with `JSON.parse()` is the correct approach for session logs -- not a streaming framework.

---

## Recommended Stack

### Core Technologies (No Changes from v1.15)

| Technology | Version | Purpose | Why Unchanged |
|------------|---------|---------|---------------|
| Node.js | >= 18.x (host: 25.2.1) | Runtime for gsd-tools.js | Already in use; built-in `fs`, `path`, `child_process` cover all needs |
| Markdown + YAML frontmatter | N/A | Data storage format | Zero-dependency, agent-readable, human-readable |
| Shell scripts (bash) | N/A | KB index rebuild, directory setup | `kb-rebuild-index.sh` already exists at `~/.gsd/bin/` |
| Git CLI | >= 2.x | Version control + new git-sensor data source | Already available on all target systems; structured output parsing is all we need |

### New Capabilities (Zero New Dependencies)

| Capability | Implementation | Node.js Built-in Used | Why This Approach |
|------------|----------------|----------------------|-------------------|
| Git commit analysis | `execSync('git log --format=...')` | `child_process.execSync` | Git's own output formatting is more reliable than any wrapper library; already used in gsd-tools.js (line 4984) |
| Git file churn detection | `execSync('git log --numstat ...')` | `child_process.execSync` | `--numstat` provides machine-parseable add/delete counts per file per commit |
| Session log parsing | `fs.readFileSync` + line-by-line `JSON.parse` | `fs`, `JSON` | JSONL is newline-delimited JSON; no streaming library needed for retrospective analysis |
| Schema validation (epistemic fields) | Extend `FRONTMATTER_SCHEMAS` | None (pure JS object) | Pattern already established at gsd-tools.js line 2227-2231 |
| Signal lifecycle state | Mutable YAML fields via `frontmatter set` | `fs.readFileSync`, `fs.writeFileSync` | `cmdFrontmatterSet` already supports targeted field updates (gsd-tools.js) |
| Confidence tracking | New YAML frontmatter fields | None (data format only) | Categorical values (high/medium/low) + basis string; no computation needed |

---

## Detailed Approaches

### 1. Git-Sensor: Git Log/Diff Analysis Without External Libraries

**Confidence:** HIGH (verified against local git installation and gsd-tools.js patterns)

#### Approach: Shell out to git CLI via `execSync`

gsd-tools.js already uses `child_process.execSync` for git operations (line 126, 233). The git-sensor extends this pattern with structured output formats.

#### Git Commands for Signal Detection

**Commit pattern analysis (detect "fix fix fix" patterns):**
```bash
git log --format='%H|%ai|%s' --since='<phase-start>' --until='<phase-end>'
```
Returns pipe-delimited rows. Parse with `line.split('|')`. Detect:
- 3+ commits with "fix" in subject for same file area = struggle signal
- Commit messages matching frustration patterns from signal-detection.md Section 5
- Rapid succession commits (< 5 min apart) = potential debugging churn

**File churn / scope creep detection:**
```bash
git log --numstat --format='%H' -- '<project-paths>'
```
`--numstat` outputs `added\tremoved\tfilename` per file per commit. Parse with `line.split('\t')`. Detect:
- Files modified > N times in a phase = hotspot signal
- Files outside planned scope appearing in commits = scope creep signal
- High add/delete ratio on same file = churn signal

**Diff-based analysis (what changed in specific commits):**
```bash
git diff-tree --no-commit-id -r --numstat <commit-hash>
```
Returns per-file change statistics for a single commit. Useful for correlating with SUMMARY.md task commits.

**Commit filtering by date range (phase boundaries):**
```bash
git log --after='2026-02-20' --before='2026-02-27' --oneline
```
Phase date boundaries come from PLAN.md `created` and SUMMARY.md `completed` frontmatter fields.

#### Integration with gsd-tools.js

Add a new command: `gsd-tools.js git-analysis <phase>` that:
1. Derives phase date range from plan/summary frontmatter
2. Runs git log commands within that range
3. Applies detection heuristics
4. Returns structured JSON for the sensor agent

**Why NOT use a git library (like `simple-git`, `isomorphic-git`, `nodegit`):**
- Adds npm dependency, violating zero-dependency constraint
- Git CLI is universally available where git repos exist
- `--format` and `--numstat` provide exactly the structured output needed
- gsd-tools.js already has the `execSync` pattern (line 233: `execSync('git ' + escaped.join(' '), ...)`)
- Shell-out is ~10ms for these queries; performance is not a concern for retrospective analysis

#### Signal Types from Git Analysis

| Detection | Git Command | Signal Type | Severity Heuristic |
|-----------|-------------|-------------|-------------------|
| Fix-fix-fix pattern | `log --format` subject scanning | `struggle` | 3+ fix commits = notable; 5+ = critical |
| File churn hotspot | `log --numstat` frequency counting | `deviation` | File modified > 5x in phase = notable |
| Scope creep | `log --numstat` vs `files_modified` frontmatter | `deviation` | > 50% unplanned files = notable |
| Rapid succession commits | `log --format` timestamp analysis | `struggle` | 3+ commits < 5 min apart = notable |
| Large commit after many small | `diff-tree --numstat` size analysis | `deviation` | "give up and rewrite" pattern = notable |

---

### 2. Log-Sensor: Claude Code Session Log Accessibility

**Confidence:** MEDIUM (verified file locations and structure on local machine; format may change between Claude Code versions; 30-day auto-deletion adds complexity)

#### Session Log Location

Claude Code stores session data at:

```
~/.claude/
  history.jsonl              # Global prompt index (all projects)
  projects/
    {encoded-path}/          # Per-project directory
      {session-id}.jsonl     # Full session transcript
      {session-id}/          # Session subdirectory (subagent data)
      sessions-index.json    # Session metadata index
```

**Path encoding:** The project path is encoded by replacing `/` with `-`. For example:
- `/Users/rookslog/Development/get-shit-done-reflect` becomes
- `-Users-rookslog-Development-get-shit-done-reflect`

**Derivation in code:**
```javascript
const projectDir = path.join(
  os.homedir(), '.claude', 'projects',
  '-' + process.cwd().split(path.sep).join('-')
);
```

#### JSONL Message Format (Verified)

Each line in a session `.jsonl` file is a JSON object with a `type` field. Observed types:

| Type | Count (typical session) | Contains | Useful For |
|------|------------------------|----------|-----------|
| `progress` | ~400 | Tool execution progress, `cwd`, `gitBranch`, `timestamp` | Timing analysis, branch tracking |
| `assistant` | ~45 | Full model response with `content[]`, `usage`, `model`, `stop_reason` | Content analysis, tool use patterns |
| `user` | ~37 | User messages with `content[]`, `timestamp` | Prompt pattern analysis |
| `system` | ~9 | System messages | Context setup |
| `queue-operation` | ~10 | Queue management | Session flow |
| `file-history-snapshot` | ~8 | File backup snapshots | File change tracking |

**Assistant message structure (verified):**
```json
{
  "type": "assistant",
  "message": {
    "role": "assistant",
    "model": "claude-opus-4-6",
    "content": [
      { "type": "text", "text": "..." },
      { "type": "tool_use", "name": "Bash", "input": {...} }
    ],
    "usage": { "input_tokens": N, "output_tokens": N },
    "stop_reason": "end_turn"
  },
  "timestamp": "ISO-8601",
  "sessionId": "uuid",
  "cwd": "/path/to/project",
  "gitBranch": "main"
}
```

**User message structure (verified):**
```json
{
  "type": "user",
  "message": {
    "role": "user",
    "content": [{ "type": "text", "text": "..." }]
  },
  "timestamp": "ISO-8601",
  "sessionId": "uuid"
}
```

**Tool use types observed:** `Bash`, `Read`, `Write`, `Edit`, `Task`, `AskUserQuestion`, MCP tools.

#### Log-Sensor Implementation Approach

**Read session files for a given time range:**
```javascript
const fs = require('fs');
const path = require('path');
const os = require('os');

function getProjectSessionDir() {
  const encoded = '-' + process.cwd().split(path.sep).join('-');
  return path.join(os.homedir(), '.claude', 'projects', encoded);
}

function parseSessionFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  return content.trim().split('\n')
    .filter(line => line.trim())
    .map(line => JSON.parse(line));
}
```

**What the log-sensor detects:**

| Pattern | Detection Method | Signal Type |
|---------|-----------------|-------------|
| Repeated tool failures | Count `tool_result` with error content | `struggle` |
| Long debugging sequences | Count sequential Bash calls with similar commands | `struggle` |
| Frustration in user messages | Pattern match from signal-detection.md Section 5 | `struggle` |
| Unplanned file modifications | Track `Write`/`Edit` tool calls vs plan `files_modified` | `deviation` |
| Session restarts for same task | Multiple sessions with similar initial prompts | `struggle` |
| High token consumption | Sum `usage.input_tokens` + `usage.output_tokens` from assistant messages | `deviation` |

#### Critical Caveats

1. **30-day auto-deletion:** Claude Code deletes session logs after 30 days by default. The log-sensor should document this limitation. Users can extend retention via `~/.claude/settings.json`. The sensor should emit a capability-gap signal if no logs are found rather than silently producing no output.

2. **Format instability:** The JSONL format is not documented as a stable API. Claude Code updates may change the structure. The sensor should fail gracefully with informative errors, not crash.

3. **Privacy consideration:** Session logs contain full conversation content. The log-sensor should extract signals (patterns, counts, timing) but NEVER persist raw conversation text to the knowledge base.

4. **Cross-runtime limitation:** This sensor only works for the Claude Code runtime. OpenCode, Gemini CLI, and Codex CLI have different or no session log formats. The sensor must handle the "logs not found" case for non-Claude-Code runtimes.

5. **File size:** Individual session files can be 10+ MB. The sensor should use streaming line-by-line reading (`readline` built-in module) for large files rather than `readFileSync` for the full file.

```javascript
const readline = require('readline');
const fs = require('fs');

async function streamSessionFile(filePath, callback) {
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath),
    crlfDelay: Infinity
  });
  for await (const line of rl) {
    if (line.trim()) callback(JSON.parse(line));
  }
}
```

---

### 3. YAML Frontmatter Validation for Epistemic Rigor Fields

**Confidence:** HIGH (verified existing validation patterns in gsd-tools.js)

#### Existing Validation Infrastructure

gsd-tools.js already has frontmatter validation at three levels:

1. **Schema-based validation** (`FRONTMATTER_SCHEMAS` at line 2227):
   ```javascript
   const FRONTMATTER_SCHEMAS = {
     plan: { required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'] },
     summary: { required: ['phase', 'plan', 'subsystem', 'tags', 'duration', 'completed'] },
     verification: { required: ['phase', 'verified', 'status', 'score'] },
   };
   ```

2. **Structural validation** (`cmdVerifyPlanStructure` at line 2248):
   - Checks required fields exist
   - Validates task element structure
   - Checks wave/depends_on consistency

3. **CRUD operations** (`frontmatter get/set/merge/validate` commands):
   - Get: Extract specific fields as JSON
   - Set: Update single field
   - Merge: Merge JSON object into frontmatter
   - Validate: Check against named schema

#### Extension for Epistemic Rigor

Add a `signal` schema to `FRONTMATTER_SCHEMAS`:

```javascript
const FRONTMATTER_SCHEMAS = {
  // ... existing schemas ...
  signal: {
    required: [
      'id', 'type', 'project', 'tags', 'created', 'updated',
      'durability', 'status', 'severity', 'signal_type'
    ],
    // v1.16 epistemic rigor additions
    epistemic_required: [
      'evidence'  // must contain supporting, counter, confidence, confidence_basis
    ]
  },
  lesson: {
    required: [
      'id', 'type', 'project', 'tags', 'created', 'updated',
      'durability', 'status', 'category', 'evidence_count'
    ]
  }
};
```

**Validation for nested epistemic fields:**

The existing `extractFrontmatter()` function (line 257) already handles nested YAML objects and arrays. It correctly parses:
```yaml
evidence:
  supporting: ["data point 1", "data point 2"]
  counter: ["alternative explanation"]
  confidence: medium
  confidence_basis: "3 occurrences with consistent root cause"
```

Into:
```javascript
{
  evidence: {
    supporting: ["data point 1", "data point 2"],
    counter: ["alternative explanation"],
    confidence: "medium",
    confidence_basis: "3 occurrences with consistent root cause"
  }
}
```

**New validation command:**
```bash
node gsd-tools.js frontmatter validate <signal-file> --schema signal --strict
```

The `--strict` flag would check epistemic sub-fields (`evidence.supporting`, `evidence.counter`, `evidence.confidence`, `evidence.confidence_basis`). Without `--strict`, only base schema fields are checked (backward compatibility with pre-v1.16 signals).

#### Why NOT Use a YAML Validation Library (ajv, joi, yup)

- The existing hand-rolled YAML parser handles all current and proposed structures
- Adding schema validation libraries would introduce npm dependencies
- The validation surface is small: ~20 fields across 3 schemas
- Custom validation functions in gsd-tools.js can provide better error messages for agent consumption
- Field-level validation with type checking is ~30 lines of additional JavaScript

---

### 4. Signal Lifecycle State Management

**Confidence:** HIGH (extends existing immutability exception pattern already established for archival)

#### Current State Management

Signals are currently immutable with ONE exception: `status: active` can change to `status: archived` for cap management (signal-detection.md Section 10). This is done via direct file editing: read file, update frontmatter, write file.

#### Extended State Model for v1.16

The signal lifecycle adds mutable lifecycle fields to immutable detection data:

```yaml
# IMMUTABLE after creation (detection data):
id: sig-2026-02-27-installer-path-bug
type: signal
project: get-shit-done-reflect
tags: [installer, path-conversion]
created: 2026-02-27T14:30:00Z
severity: critical
signal_type: deviation
evidence:
  supporting: ["npm pack output missing 3 files"]
  counter: ["Could be a .npmignore issue, but .npmignore doesn't exist"]
  confidence: high
  confidence_basis: "direct observation of npm pack --dry-run output"

# MUTABLE (lifecycle fields):
status: active | triaged | remediation-planned | remediated | verified | archived
updated: 2026-02-28T10:00:00Z
triage:
  decision: address
  rationale: "3rd recurrence across milestones"
  by: human
  at: 2026-02-28T10:00:00Z
remediation:
  ref: { phase: 31, plan: 2, commit: abc123 }
  approach: "Add kb-templates to installer copy list"
  expected_outcome: "npm pack includes all 5 template files"
  status: completed
verification:
  status: confirmed
  method: absence-of-recurrence
  at: 2026-03-05T14:00:00Z
recurrence_of: sig-2026-02-15-missing-templates
```

#### Implementation via Existing Primitives

**Update lifecycle fields:**
```bash
node gsd-tools.js frontmatter set <signal-file> --field status --value triaged
node gsd-tools.js frontmatter merge <signal-file> --data '{"triage": {"decision": "address", "rationale": "recurring", "by": "human", "at": "2026-02-28T10:00:00Z"}}'
```

**Query signals by lifecycle status:**
The `kb-rebuild-index.sh` script (or a new gsd-tools.js command) can be extended to include lifecycle status in the index, enabling queries like "all triaged but unremediated signals."

**Lifecycle state transitions:**

```
                   +--> dismiss --> archived
                   |
active --> triaged -+--> defer --> (stays triaged, revisit later)
                   |
                   +--> address --> remediation-planned --> remediated --> verified --> archived
                   |                                                  |
                   +--> investigate --> spike --> (returns to triaged)  +--> failed --> (back to active)
```

**Integration with plan frontmatter:**
Plans declare `resolves_signals: [sig-id-1, sig-id-2]` in frontmatter. When a SUMMARY.md is written for the plan:
1. Signal collector reads `resolves_signals` from the completed plan
2. Updates referenced signals' remediation fields
3. Sets remediation status to `completed`

This piggybacks on the existing post-execution collection flow -- no new workflow hooks needed.

---

### 5. Confidence and Evidence Tracking in File-Based Systems

**Confidence:** HIGH (pure data modeling, no technical risk)

#### Confidence Model: Categorical with Basis

The deliberation document (v1.16-signal-lifecycle-and-beyond.md, Section "Design Principle: Epistemic Rigor") asks whether confidence should be categorical (high/medium/low) or numeric (0-1).

**Recommendation: Categorical with explicit basis.** Because:

1. **Agents produce categorical judgments naturally.** An LLM saying "confidence: 0.73" is false precision -- it cannot calibrate numeric probabilities. "confidence: medium" with "confidence_basis: 3 occurrences, consistent root cause, but no counter-evidence tested" is more honest.

2. **Thresholds in reflection-patterns.md are already categorical.** The existing system uses HIGH/MEDIUM/LOW (Section 9.1) with occurrence count evidence. Switching to numeric would require rewriting all threshold logic.

3. **Counter-evidence is the real rigor mechanism.** Numeric confidence creates an illusion of precision. Required counter-evidence fields force actual falsification work, which is what matters.

#### Evidence Structure

```yaml
evidence:
  supporting:
    - "npm pack --dry-run output shows 3 missing files"
    - "diff between source/ and .claude/ shows content divergence"
  counter:
    - "Could be .npmignore exclusion, but .npmignore does not exist"
    - "Could be stale build cache, but npm cache clean was run"
  confidence: high
  confidence_basis: "Direct observation with 2 independent verification methods; counter-explanations eliminated"
```

**Validation rules:**
- `evidence.supporting` MUST have >= 1 entry (what triggered the signal)
- `evidence.counter` MUST have >= 1 entry (what was considered and ruled out, OR "No counter-evidence sought" which is itself a signal of low rigor)
- `evidence.confidence` MUST be one of: `high`, `medium`, `low`
- `evidence.confidence_basis` MUST be a non-empty string

**For positive signals** (baselines, "things that work"):
```yaml
evidence:
  supporting:
    - "All 35 commands present in both source and installed directories"
    - "Diff shows only expected path prefix conversion"
  counter:
    - "Checked both file presence AND content correctness"
  confidence: high
  confidence_basis: "Exhaustive check of all items, not sampling"
```

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `execSync('git log ...')` | `simple-git` npm package | Adds dependency; git CLI provides identical data with `--format` |
| `execSync('git log ...')` | `isomorphic-git` (pure JS) | Much heavier (~2MB); designed for environments without git CLI -- not our case |
| Line-by-line JSONL parsing | `JSONStream` npm package | Adds dependency; `readline` built-in handles JSONL streaming perfectly |
| Extend `FRONTMATTER_SCHEMAS` | `ajv` JSON Schema validation | Adds dependency; validation surface is small enough for custom code |
| Categorical confidence (high/med/low) | Numeric confidence (0.0-1.0) | False precision; agents cannot calibrate probabilities; categorical + basis is more honest |
| Mutable lifecycle fields on signals | Separate lifecycle tracking file per signal | Splits related data; frontmatter merge already works; single file is atomic |
| `status` field expansion | Separate state machine file | Over-engineering; YAML enum in frontmatter is simpler and grep-able |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Any npm git library | Violates zero-dependency constraint; git CLI is universally available | `child_process.execSync('git ...')` |
| Database for signal lifecycle state | Over-engineering; file-based system works at current scale (< 200 signals/project) | YAML frontmatter fields with `frontmatter set/merge` |
| YAML parsing library (js-yaml, yaml) | gsd-tools.js has a working custom parser; adding a library for marginal benefit adds dependency | Existing `extractFrontmatter()` function |
| ML/embedding libraries for pattern detection | Violates zero-dependency + no-ML constraint; tag-based clustering with severity weighting is sufficient | String matching on structured frontmatter (per reflection-patterns.md Section 10.5) |
| Session log streaming frameworks | JSONL is simple enough for `readline` + `JSON.parse` | Node.js built-in `readline` module |
| External monitoring services | System is local-first, agent-internal only | File-based signals with KB index |

---

## Stack Patterns by Feature Area

**If building the git-sensor:**
- Use `execSync` for all git commands
- Parse structured output with `String.split()` on delimiters (`|`, `\t`)
- Add `gsd-tools.js git-analysis <phase>` command for reusable git queries
- Cache date ranges from plan/summary frontmatter to scope git queries
- Handle missing git (bare directory, shallow clone) gracefully

**If building the log-sensor:**
- Use `readline.createInterface` for large session files (> 1MB)
- Use `fs.readFileSync` + `split('\n')` for smaller files or `history.jsonl`
- Derive project session directory from `process.cwd()` path encoding
- Filter by `type` field first (only `assistant`, `user` messages matter for most signals)
- Extract tool use patterns from `message.content[]` where `type === 'tool_use'`
- Handle missing logs gracefully (non-Claude-Code runtimes, expired logs)

**If extending frontmatter validation:**
- Add schemas to `FRONTMATTER_SCHEMAS` object in gsd-tools.js
- Use existing `cmdFrontmatterValidate` for basic field presence
- Add nested field validation for epistemic sub-fields
- Maintain backward compatibility: pre-v1.16 signals without epistemic fields should not fail base validation

**If implementing lifecycle state transitions:**
- Use `cmdFrontmatterSet` for single field updates (e.g., `status`)
- Use `cmdFrontmatterMerge` for multi-field lifecycle updates (e.g., full triage block)
- Always update `updated` timestamp on any lifecycle mutation
- Rebuild KB index after lifecycle state changes that affect indexing

---

## Version Compatibility

| Component | Required Version | Notes |
|-----------|-----------------|-------|
| Node.js | >= 18.x | `readline` async iteration requires 18+; `fs.readFileSync` available in all versions |
| Git | >= 2.x | `--format`, `--numstat`, `--diff-filter` available since git 2.x |
| Claude Code | Any (session logs observed as of Feb 2026) | JSONL format not a stable API; sensor must handle format changes gracefully |
| gsd-tools.js | Current (5,472 lines) | All extensions are additive; no breaking changes to existing commands |

---

## Installation

No new packages to install. All capabilities use:

```bash
# Already available:
node          # v18+ (host has v25.2.1)
git           # v2+ for structured output
bash          # for kb-rebuild-index.sh

# Node.js built-ins used:
# fs, path, os, child_process, readline, JSON (all built-in)
```

---

## Sources

- **gsd-tools.js** (lines 124-126, 233, 2227-2244, 2248-2307) -- verified existing patterns for `execSync`, frontmatter parsing, schema validation
- **knowledge-store.md** -- verified signal immutability exception for archival, schema structure
- **signal-detection.md** -- verified detection types, severity classification, frustration patterns
- **reflection-patterns.md** -- verified confidence levels (Section 9), anti-patterns (Section 10)
- **v1.16-signal-lifecycle-and-beyond.md** -- verified architectural decisions, schema proposals, epistemic rigor requirements
- **Local machine `~/.claude/` directory** -- verified session log location, JSONL structure, message types, and field names via direct inspection
- [Claude Code session history deep dive](https://kentgigger.com/posts/claude-code-conversation-history) -- MEDIUM confidence, cross-referenced with local file inspection
- [Claude Code session log auto-deletion warning](https://simonwillison.net/2025/Oct/22/claude-code-logs/) -- MEDIUM confidence, retention behavior noted
- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference) -- official documentation
- **Git CLI** (`git log --format`, `git log --numstat`, `git diff-tree --numstat`) -- HIGH confidence, tested on local repository

---
*Stack research for: Signal Lifecycle & Reflection (v1.16)*
*Researched: 2026-02-27*
