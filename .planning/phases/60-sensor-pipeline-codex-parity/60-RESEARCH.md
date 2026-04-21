# Phase 60: Sensor Pipeline & Codex Parity - Research

**Researched:** 2026-04-21
**Domain:** cross-runtime sensor adapter + installer patch/parity surface + Codex session discovery
**Confidence:** HIGH (live-corpus verified, all six CONTEXT open questions closed)

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Phase 60 boundary** — Log sensor + new patch sensor operational across Claude Code and Codex CLI; post-install cross-runtime parity verification; patch-compatibility checking (XRT-02). Closes SENS-01..SENS-07 + XRT-02.
- **Log-sensor cross-runtime adapter lives in a single `agents/gsd-log-sensor.md`** — not two runtime-specific sensor files. Rationale: EXT-06 glob discovery; splitting would double-count.
- **Fingerprint schema is a single normalized shape** with Codex-only fields (`reasoning_output_tokens`, `rate_limits.*`, `model_context_window`, `source`) added as optional additive fields; Claude sessions get `not_available` for them. G-2 (MEAS-RUNTIME-05 parity principle) forbids lowest-common-denominator dropping.
- **Codex session discovery: `sqlite3 ~/.codex/state_5.sqlite` PRIMARY, filesystem-scan FALLBACK** — shelled-out CLI (not `node:sqlite`) so the sensor doesn't couple to gsd-tools runtime. Fallback emits SENS-07 diagnostic (`codex-sqlite-unavailable`).
- **Patch sensor: dual-surface** — `gsd patch-check` subcommand (dev-facing table) + `agents/gsd-patch-sensor.md` (collect-signals structured candidates). Share one classifier library.
- **Patch classification taxonomy adopted verbatim** — `bug | stale | customization | format-drift | feature-gap` per research §2.3.
- **Post-install cross-runtime parity (SENS-06): advisory report, NOT interactive, NOT auto-install.** Writes `gsd-parity-report.json` artifact + stdout table with copy-pasteable remediation command. Runs unconditionally after successful install (inside `bin/install.js`). Reuses `otherScopeVersionPath` pattern and `getGlobalDir()` helper.
- **Layer-2 content comparison reuses installer's format-normalization helpers** — exported from `bin/install.js`: `replacePathsInContent`, tool-name map, command-prefix rewriter, frontmatter conversion. Do NOT reimplement.
- **SENS-07 parse-failure contract** — any parse/format failure emits a well-formed signal candidate (`signal_type: capability-gap`, `severity: minor`, tag `sensor-parse-failure`) with file path + unexpected shape + sensor stage in evidence. Never crash the extractor.
- **XRT-02 validator lives at the reapply site** (`reapply-patches` workflow / skill), not at the save-patches step. Shares classification vocabulary with patch sensor — an incompatible patch is `format-drift` or `feature-gap` viewed from the compat angle.
- **No new Codex hook substrate** (DC-4 carried forward from Phase 58.1). Post-install parity runs inside `bin/install.js`, not via a hook. Sensors run in `collect-signals`, which is workflow-triggered, not hook-triggered.
- **Per-sensor Codex-behavior matrix required** — Phase 60 must produce its own `60-codex-behavior-matrix.md` sidecar following Phase 58 Plan 05's vocabulary (`applies | applies-via-workflow-step | applies-via-installer | does-not-apply-with-reason`).
- **Regression coverage follows the adopted deliberation** — Option B name parity + targeted content parity (tool-name + path checks on converted artifacts) + structural prevention (no hardcoded sensor lists — already satisfied by EXT-06).
- **Golden fixture: the 17-file `.codex/gsd-local-patches/backup-meta.json` from v1.17.5** — must classify as `stale` (or split `stale` + `feature-gap` where source has moved); this is the golden test case.

### Claude's Discretion
- Exact file organization for the adapter layer (single-file adapter inside `agents/gsd-log-sensor.md` body vs a helper script under `get-shit-done/bin/lib/`) — whichever is cleaner given how the existing agent spec already inlines python3 extraction.
- Naming of the gsd-tools subcommand (`gsd patch-check` vs `gsd patches` vs `gsd divergence-check`) and of the JSON artifact emitted by post-install parity.
- Golden-fixture shape for patch-sensor classification tests (single repo snapshot vs per-class fixtures).
- Whether to emit a single aggregate `gsd-parity-report.json` or per-runtime `gsd-parity-report.<runtime>.json`.
- How many historical Codex versions to retain in the validator's compatibility tables (1 vs rolling window).
- Whether the SENS-07 diagnostic signal is written once per file or once per malformed-event-type per phase.

### Deferred Ideas (OUT OF SCOPE)
- Cross-project distribution gap (non-GSDR projects running global upstream GSD) — v1.21.
- Cross-model sensor diversity (Claude sensors + GPT sensors via `codex exec`) — Beyond Formal Scope / v1.21.
- Codex `history.jsonl` as cross-session pattern source — Beyond Formal Scope.
- Codex `logs_1.sqlite` / `logs_2.sqlite` structured runtime traces — too low-level; debugging phase.
- Codex memories vs Claude `MEMORY.md` — v1.21+.
- WebFetch null-mapping in Codex agent specs — separate cleanup; patch sensor may surface but not fix.
- SKILL.md vs command .md invocation-syntax friction — UX research, not sensor work.
- PID management for concurrent Codex sessions — Phase 64.
- Telemetry identity extractor rewiring (PROV-09..14) — Phase 60.1.
- Agent-performance reflection stratification by `model × profile × reasoning_effort` — Phase 60.1.
- Live-agent E2E chain tests — Phase 60.1.
- Interactive `--y-install-other-runtime` prompt — default is advisory-only; Q3 closes below but remains a soft upgrade path.
</user_constraints>

## Summary

Phase 60 delivers four concrete surfaces — a cross-runtime log-sensor adapter, a dual-surface patch sensor, a post-install parity report, and a reapply-time XRT-02 validator — on top of installer primitives that already exist (`fileHash`, `generateManifest`, `saveLocalPatches`, `reportLocalPatches`, `otherScopeVersionPath`, `getGlobalDir`, `replacePathsInContent`, the Codex tool-name map, and the `convertClaudeToCodexAgentToml` conversion). The work is not greenfield engineering; it is a short, prescriptive wiring job against a rich existing substrate.

The G-1 re-audit found three cross-runtime-parity-research.md drifts that must be updated before Phase 60 ships — Codex version bumped 0.118.0 → **0.121.0**, `logs_1.sqlite` is now **`logs_2.sqlite`** (now 1.1GB; confirms out-of-scope status), and `multi_agent` graduated from "stable true" to a pair: `multi_agent stable` + `multi_agent_v2 under development`. None of these drifts invalidate Phase 60 claims, but `[evidenced:cited]` claims built on stale version citations need a bump. A live 100-session corpus survey also revealed the research doc §1.3 under-enumerated Codex event types: **12 event_msg payload.type values** (`exec_command_end`, `turn_aborted`, `patch_apply_end`, `context_compacted`, `collab_*_end`, `mcp_tool_call_end`, `item_completed`, `thread_rolled_back`, `web_search_end`) and **3 response_item payload.type values** (`custom_tool_call`, `custom_tool_call_output`, `web_search_call`) are real and present in live sessions but NOT in the research doc. The adapter must handle them as "known events to count or ignore," not as "unknown parse failures" — otherwise SENS-07 will fire 600+ times per phase.

All six CONTEXT.md open questions close with evidence-grounded recommendations (see §Open Questions). The most consequential: Q2 (dogfooding noise) closes on `package.json.name === "get-shit-done-reflect-cc"` + `.git/` presence as a sufficient signal, lives in a shared helper under `get-shit-done/bin/lib/patch-classifier.cjs`, and defaults the patch sensor to `severity: trace` in dogfooding mode. Q5 (SENS-07 parse-failure budget) closes empirically: **zero parse failures across 50 sessions / 12,204 events** — per-file emission is safe, no aggregation cap needed.

**Primary recommendation:** Plan this in **6 plans across 3 waves**, land the G-1 research-doc bump in Plan 60.1, then fork into parallel waves: (log-sensor adapter | patch-sensor + subcommand | post-install parity) || (XRT-02 validator | codex-behavior-matrix sidecar) || (regression tests).

## Standard Stack

### Core

| Library / Surface | Version | Purpose | Why Standard |
|---|---|---|---|
| `bin/install.js` installer primitives (`fileHash`, `generateManifest`, `writeManifest`, `saveLocalPatches`, `pruneRedundantPatches`, `reportLocalPatches`, `otherScopeVersionPath`, `getGlobalDir`, `replacePathsInContent`, `claudeToCodexTools`, `convertClaudeToCodexAgentToml`, `convertClaudeToCodexMarkdown`, `extractFrontmatterAndBody`, `extractFrontmatterField`) | v1.19.8 | SHA256 manifest, patch backup, format-normalization, path-prefix rewriting | [evidenced:cited] Already exported via `module.exports` at `bin/install.js:2627`; `scripts/verify-install-parity.js` already demonstrates the reuse pattern ("Don't-Hand-Roll per Research R1"). |
| `get-shit-done/bin/lib/sensors.cjs` (existing sensor registry) | v1.19.8 | Auto-discovers `gsdr?-*-sensor.(md\|toml)` via regex `/^gsdr?-(.+)-sensor\.(md\|toml)$/` | [evidenced:cited] `get-shit-done/bin/lib/sensors.cjs:29`. Drop-a-file convention from EXT-06 (`sig-2026-03-04-drop-a-file-sensor-extensibility-pattern`, HIGH confidence per VERIFICATION.md 10/10). Adding `agents/gsd-patch-sensor.md` auto-registers. |
| `sqlite3` CLI | 3.50.2 (system) | Query Codex `state_5.sqlite` `threads` table for session discovery | [evidenced:cited] `which sqlite3` → `/home/rookslog/miniconda3/bin/sqlite3`; Codex itself embeds sqlite; CLI also ships on macOS (system), Ubuntu (system), and via miniconda. Sample `SELECT COUNT(*) FROM threads WHERE cwd = ?` returned in 7ms on this machine against 1,184 threads. |
| `python3` (stdlib `json`, `collections`) | ≥3.8 | Session-JSONL extraction — Stage 1c fingerprint, Stage 3a narrow read, Stage 3c expanded read | [evidenced:cited] Existing `gsd-log-sensor.md` Stages 1c/3a/3c already inline `python3 -c "…"`. Zero new dependencies; adapter is additive to existing scaffolding. |

### Supporting

| Library / Surface | Version | Purpose | When to Use |
|---|---|---|---|
| `convertClaudeToCodexMarkdown(content)` in `bin/install.js` | v1.19.8 | `/gsdr:command` → `$gsdr-command` rewrite, `$ARGUMENTS` → `{{GSD_ARGS}}` | Layer-2 content-comparison normalization (patch sensor) |
| `scripts/verify-install-parity.js` | v1.19.8 (Phase 58) | Byte-identical-after-transform comparison of source vs installed | Template for XRT-02 validator structure; `compareRoot`, `expectedInstalledContent`, `mapInstalledRelPath`, `firstDiffLine` are the canonical building blocks. `[evidenced:cited]` — already exported via `module.exports` at `scripts/verify-install-parity.js:311`. |
| `get-shit-done/bin/lib/config.cjs` | v1.19.8 | Project config read (`signal_collection.sensors.<name>.enabled`) | Honor `signal_collection.sensors.patch.enabled` gate in collect-signals |

### Alternatives Considered

| Instead of | Could Use | Tradeoff | Recommendation |
|---|---|---|---|
| `sqlite3` CLI shelled out from bash | `node:sqlite` (Node >= 22.5.0) | node:sqlite is always in-process, no spawn overhead | **Reject.** [decided:reasoned] The sensor runs under the agent harness, not gsd-tools — it must not assume node:sqlite bindings. Spawn overhead is negligible (<10ms per query against this 1,184-row DB). |
| One-shot python3 `-c` blocks (current log-sensor pattern) | Extract a `get-shit-done/bin/extract-session-fingerprints.py` helper | Helper is easier to unit-test; `-c` is vendored into the agent spec | **Defer to planner.** The log-sensor spec already inlines `-c` Stages 1c/3a/3c; planner can pick either shape depending on whether they want a separate test surface. A helper under `get-shit-done/bin/` is the cleaner shape; leave this as Claude's Discretion. |
| Static JSON snapshot for XRT-02 compat rules | Live `require('bin/install.js')` call | Static = stable, testable, versioned; live = always-current | **Live call.** [decided:reasoned] `scripts/verify-install-parity.js` already proves the pattern works — the script `require('../bin/install.js')` pulls the tool map + `replacePathsInContent` + `injectVersionScope` directly and has been stable since Phase 58. A static snapshot duplicates semantics and drifts. Q4 closes this below. |

## Architecture Patterns

### Recommended File Organization

```
agents/
├── gsd-log-sensor.md           # MODIFY — add Codex branch to Stages 1a, 1c, 3a, 3c
└── gsd-patch-sensor.md         # NEW — drop-a-file sensor, auto-registers via EXT-06

get-shit-done/bin/
├── gsd-tools.cjs               # MODIFY — register `gsd patch-check` subcommand
└── lib/
    ├── patch-classifier.cjs    # NEW — shared classifier library
    ├── codex-session-discovery.cjs   # NEW (optional) — bash primitives for sqlite + fallback
    └── sensors.cjs             # UNCHANGED — drop-a-file discovery already works

bin/install.js                  # MODIFY
                                #   - export format-normalization helpers
                                #   - add checkCrossRuntimeParity() after reportLocalPatches
                                #   - write gsd-parity-report.json artifact

commands/gsd/
└── reapply-patches.md          # MODIFY — wire XRT-02 validator at pre-apply gate

get-shit-done/workflows/
└── reapply-patches.md          # MODIFY — paired workflow file

.planning/phases/60-sensor-pipeline-codex-parity/
└── 60-codex-behavior-matrix.md # NEW — per-sensor behavior matrix sidecar (XRT-01 mandatory)

tests/
├── unit/
│   ├── patch-classifier.test.js         # NEW
│   ├── codex-session-discovery.test.js  # NEW
│   ├── cross-runtime-parity.test.js     # NEW (extends install.test.js patterns)
│   └── xrt02-validator.test.js          # NEW
├── integration/
│   └── multi-runtime.test.js            # EXTEND — add post-install parity cases
└── fixtures/
    └── codex-v1175-backup-meta.json     # NEW — golden fixture (captures the live 17-file case)
```

### Pattern 1: Runtime-Detection Branch Inside the Log Sensor

**What:** One sensor spec file with a runtime-detection step that branches Stage 1a, Stage 1c, Stage 3a, Stage 3c. Stages 2, 4, 5 are runtime-agnostic.

**When to use:** The entire log sensor. No second agent file.

**Code shape (adapter layer for Stage 1a — session discovery):**

```bash
# Source: gsd-log-sensor.md (proposed Stage 1a rewrite)
# G-5: detect LOG FILE runtime, not harness runtime
# Runtime inference: check which root exists; if both, query both.

PROJECT_CWD="$(pwd)"
CLAUDE_LOG_DIR="$HOME/.claude/projects/$(echo "$PROJECT_CWD" | sed 's|/|-|g')"
CODEX_STATE_DB="$HOME/.codex/state_5.sqlite"

CLAUDE_LOGS=""
CODEX_LOGS=""

# Claude branch — JSONL filesystem scan
if [ -d "$CLAUDE_LOG_DIR" ]; then
  CLAUDE_LOGS=$(ls -1 "$CLAUDE_LOG_DIR"/*.jsonl 2>/dev/null || true)
fi

# Codex branch — sqlite PRIMARY, filesystem FALLBACK
if [ -f "$CODEX_STATE_DB" ] && command -v sqlite3 >/dev/null 2>&1; then
  # PRAGMA probe first — graceful degradation on schema drift (DC assumption)
  HAS_CWD=$(sqlite3 "$CODEX_STATE_DB" "PRAGMA table_info(threads);" 2>/dev/null | grep -c "|cwd|")
  if [ "${HAS_CWD:-0}" -gt 0 ]; then
    CODEX_LOGS=$(sqlite3 "$CODEX_STATE_DB" \
      "SELECT rollout_path FROM threads WHERE cwd = '$PROJECT_CWD' AND archived = 0 ORDER BY created_at DESC LIMIT 10;" \
      2>/dev/null || true)
  fi
fi

# Fallback: filesystem scan if sqlite failed or cwd column gone
if [ -z "$CODEX_LOGS" ] && [ -d "$HOME/.codex/sessions" ]; then
  # Emit SENS-07 diagnostic: codex-sqlite-unavailable
  echo "SENS_07_DIAGNOSTIC: codex-sqlite-unavailable reason=$([ -f "$CODEX_STATE_DB" ] && echo schema_drift || echo db_missing)"
  CODEX_LOGS=$(find "$HOME/.codex/sessions" -name "*.jsonl" -newer /tmp/phase-window.txt 2>/dev/null \
               | xargs grep -l "\"cwd\":\"$PROJECT_CWD\"" 2>/dev/null | head -10 || true)
fi

if [ -z "$CLAUDE_LOGS" ] && [ -z "$CODEX_LOGS" ]; then
  echo "NO_LOGS_FOUND"
  exit 0
fi
```

Timing on this machine (1,184 threads in DB, 1,158 JSONL files in `~/.codex/sessions/2026/04/`):
- SQLite query: **7ms**
- Filesystem-scan fallback (grep over first 200 files): **205ms**

Both are well under any sensor timeout (45-120s). No need for a cwd-index file.

### Pattern 2: Fingerprint Extraction — One python3 Dispatcher, Two Format Branches

**What:** A single inline `python3 -c "…"` block (or helper script — Claude's Discretion) that autodetects the format by the first JSON event and dispatches to Claude or Codex parsing.

**Code shape (proposed Stage 1c dispatcher):**

```python
# Source: inline in gsd-log-sensor.md Stage 1c (or get-shit-done/bin/extract-session-fingerprints.py)
import json, sys, re
from collections import Counter

def detect_format(path):
    """Returns 'claude' or 'codex' based on first event shape. G-5 provenance."""
    with open(path) as fp:
        first = fp.readline()
        try:
            obj = json.loads(first)
        except json.JSONDecodeError:
            return None
    # Codex: first event is session_meta; Claude: first event is system/user
    if obj.get('type') == 'session_meta':
        return 'codex'
    if obj.get('type') in ('system', 'user', 'assistant'):
        return 'claude'
    return None

def extract_claude_fingerprint(path):
    """Extract Claude Code JSONL fingerprint. Current gsd-log-sensor.md Stage 1c logic."""
    # ... existing extractor (unchanged) ...
    pass

def extract_codex_fingerprint(path):
    """Extract Codex CLI rollout fingerprint. New logic; normalizes to same schema."""
    user_msgs = 0
    assistant_msgs = 0
    tool_calls = 0
    tool_errors = 0
    interruptions = 0  # event_msg.payload.type == 'turn_aborted'
    reasoning_tokens = 0
    total_tokens = 0
    model = None
    model_context_window = None
    rate_limit_used_percent = None
    source = None  # 'exec' or 'cli'
    session_id = None
    start_time = None
    end_time = None
    unknown_event_count = 0
    unknown_event_types = Counter()

    with open(path) as fp:
        for line in fp:
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                # SENS-07: continue, emit diagnostic later
                continue
            t = obj.get('type')
            payload = obj.get('payload', {}) if isinstance(obj.get('payload'), dict) else {}
            ts = obj.get('timestamp')
            if not start_time and ts: start_time = ts
            if ts: end_time = ts

            if t == 'session_meta':
                session_id = payload.get('id')
                source = payload.get('source')
            elif t == 'turn_context':
                if not model: model = payload.get('model')
            elif t == 'event_msg':
                pt = payload.get('type')
                if pt == 'user_message':
                    user_msgs += 1
                elif pt == 'agent_message':
                    assistant_msgs += 1
                elif pt == 'token_count':
                    info = payload.get('info', {})
                    ttu = info.get('total_token_usage', {})
                    total_tokens = ttu.get('total_tokens', total_tokens)
                    reasoning_tokens = ttu.get('reasoning_output_tokens', reasoning_tokens)
                    model_context_window = ttu.get('model_context_window', model_context_window)
                    rate_limits = payload.get('rate_limits', {})
                    rate_limit_used_percent = rate_limits.get('primary', {}).get('used_percent')
                elif pt == 'turn_aborted':
                    interruptions += 1
                elif pt in ('task_started','task_complete','exec_command_end','patch_apply_end',
                            'collab_waiting_end','collab_agent_spawn_end','collab_close_end',
                            'context_compacted','item_completed','thread_rolled_back',
                            'web_search_end','collab_agent_interaction_end','mcp_tool_call_end'):
                    # KNOWN event types per live audit 2026-04-21; counted/ignored but not SENS-07
                    pass
                else:
                    unknown_event_count += 1
                    unknown_event_types[pt] += 1
            elif t == 'response_item':
                pt = payload.get('type')
                if pt == 'function_call':
                    tool_calls += 1
                elif pt == 'function_call_output':
                    if payload.get('success') is False or 'error' in str(payload.get('output','')).lower():
                        tool_errors += 1
                # 'reasoning', 'message', 'custom_tool_call', 'custom_tool_call_output',
                # 'web_search_call' — known but no fingerprint counter
            elif t == 'compacted':
                pass  # valid but no counter
            else:
                unknown_event_count += 1
                unknown_event_types[t] += 1

    return {
        'session_id': session_id,
        'start_time': start_time,
        'end_time': end_time,
        'user_message_count': user_msgs,
        'assistant_message_count': assistant_msgs,
        'tool_call_count': tool_calls,
        'tool_error_count': tool_errors,
        'total_tokens': total_tokens,
        'model': model,
        'interruptions': interruptions,
        'direction_changes': None,  # Stage 3c text-pattern pass fills this
        # Codex-specific additive fields (G-2: never drop; 'not_available' on Claude)
        'reasoning_output_tokens': reasoning_tokens,
        'rate_limit_primary_used_percent': rate_limit_used_percent,
        'model_context_window': model_context_window,
        'source': source,   # 'exec' or 'cli'
        # SENS-07 diagnostic payload
        '_sens07_unknown_event_count': unknown_event_count,
        '_sens07_unknown_event_types': dict(unknown_event_types),
    }

# Dispatcher
path = sys.argv[1]
fmt = detect_format(path)
if fmt == 'claude':
    fp = extract_claude_fingerprint(path)
    fp['_format'] = 'claude'
elif fmt == 'codex':
    fp = extract_codex_fingerprint(path)
    fp['_format'] = 'codex'
else:
    fp = {'_format': 'unknown', '_sens07_error': 'format_detection_failed', '_path': path}
print(json.dumps(fp))
```

### Pattern 3: Patch Sensor — Shared Classifier Between Subcommand + Sensor

**What:** The classifier is a CommonJS module under `get-shit-done/bin/lib/patch-classifier.cjs`. Both `gsd patch-check` (subcommand, human table) and `agents/gsd-patch-sensor.md` (sensor, structured signals) import it. Single source of truth for the taxonomy.

**Code shape (proposed `lib/patch-classifier.cjs` skeleton):**

```javascript
// Source: new file get-shit-done/bin/lib/patch-classifier.cjs
const path = require('path');
const fs = require('fs');
const {
  fileHash,
  generateManifest,
  replacePathsInContent,
  convertClaudeToCodexMarkdown,
  convertClaudeToCodexAgentToml,
  claudeToCodexTools,   // NEEDS EXPORT (currently internal)
} = require('../../../bin/install.js');

/**
 * Dogfooding-scope detection. Q2 closes here.
 * Returns true if cwd is the GSDR source repo.
 */
function isDogfoodingRepo(cwd) {
  try {
    const pkgPath = path.join(cwd, 'package.json');
    if (!fs.existsSync(pkgPath)) return false;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.name !== 'get-shit-done-reflect-cc') return false;
    if (!fs.existsSync(path.join(cwd, '.git'))) return false;
    // Source-repo tell: bin/install.js present alongside agents/ + get-shit-done/
    if (!fs.existsSync(path.join(cwd, 'bin', 'install.js'))) return false;
    if (!fs.existsSync(path.join(cwd, 'agents'))) return false;
    if (!fs.existsSync(path.join(cwd, 'get-shit-done'))) return false;
    return true;
  } catch { return false; }
}

/**
 * Classify a divergence entry.
 * Inputs:
 *   - relPath: file path relative to runtime root (e.g., 'agents/gsdr-planner.md')
 *   - runtime: 'claude' or 'codex'
 *   - manifestHash: SHA256 recorded at install time (or null if file not in manifest)
 *   - installedHash: SHA256 of currently installed file (or null if file missing)
 *   - sourceHash: SHA256 of source file after format conversion (or null if source missing)
 *   - sourceFileExists: bool — does the source file still exist in the source tree?
 *   - inLocalPatches: bool — is this file in gsdr-local-patches/?
 *   - crossRuntimeInstalled: { claudeHash, codexHash } — both-sides hashes for Layer-2
 *   - isDogfooding: bool — was dogfooding-scope detected?
 *
 * Output:
 *   { class: 'bug'|'stale'|'customization'|'format-drift'|'feature-gap',
 *     confidence: 'high'|'medium'|'low',
 *     evidence: { manifestHash, installedHash, sourceHash, ... },
 *     severity: 'critical'|'notable'|'minor'|'trace',
 *     remediation: string | null }
 */
function classify({ relPath, runtime, manifestHash, installedHash, sourceHash,
                    sourceFileExists, inLocalPatches, crossRuntimeInstalled,
                    isDogfooding = false }) {
  // Layer 1: source-vs-installed
  // CASE A — file in manifest, hash differs from installed, source exists
  if (manifestHash && installedHash && installedHash !== manifestHash) {
    if (sourceHash && installedHash === sourceHash) {
      // Installed matches source but not manifest → stale install never re-run after source change
      return {
        class: 'stale',
        confidence: 'high',
        evidence: { manifestHash, installedHash, sourceHash },
        severity: isDogfooding ? 'trace' : 'notable',
        remediation: `node bin/install.js --${runtime}`,
      };
    }
    if (sourceHash && installedHash !== sourceHash && inLocalPatches) {
      // User modification preserved in local-patches/
      return {
        class: 'customization',
        confidence: 'high',
        evidence: { manifestHash, installedHash, sourceHash },
        severity: isDogfooding ? 'trace' : 'minor',
        remediation: '/gsdr:reapply-patches',
      };
    }
    if (!sourceFileExists) {
      // File in manifest + installed, but source is gone — stale install on renamed/deleted file
      return {
        class: 'stale',
        confidence: 'medium',
        evidence: { manifestHash, installedHash, sourceFileExists: false },
        severity: 'minor',
        remediation: `node bin/install.js --${runtime}  # removes orphans`,
      };
    }
    // Installer bug shape: hashes differ and don't match anything expected
    return {
      class: 'bug',
      confidence: 'low',
      evidence: { manifestHash, installedHash, sourceHash },
      severity: 'notable',
      remediation: 'file a bug; check installer output for conversion errors',
      low_confidence: true,  // G-3: never silently downgrade
    };
  }
  // Layer 2: cross-runtime
  if (crossRuntimeInstalled && crossRuntimeInstalled.claudeHash && crossRuntimeInstalled.codexHash) {
    if (crossRuntimeInstalled.claudeHash !== crossRuntimeInstalled.codexHash) {
      // Need to apply format normalization before declaring drift real
      // (see convertClaudeToCodexMarkdown, tool-name remap, command-prefix rewrite)
      // If after normalization hashes STILL differ → format-drift
      // If source file has no pair on the other runtime → feature-gap
      // Q6: boundary is REPRESENTABILITY, not INTENTIONALITY (closes below)
      return {
        class: 'format-drift',
        confidence: 'medium',
        evidence: { ...crossRuntimeInstalled },
        severity: 'minor',
        remediation: `node bin/install.js --${runtime === 'claude' ? 'codex' : 'claude'}`,
      };
    }
  }
  // Feature-gap: file exists on one runtime, should exist on other, but doesn't
  if (!installedHash && sourceFileExists && isRuntimeApplicableToRuntime(relPath, runtime)) {
    return {
      class: 'feature-gap',
      confidence: 'high',
      evidence: { runtime, relPath, sourceFileExists: true },
      severity: 'notable',
      remediation: `node bin/install.js --${runtime}`,
    };
  }
  return null;  // not a divergence
}

module.exports = { isDogfoodingRepo, classify };
```

### Pattern 4: Post-Install Parity — New `checkCrossRuntimeParity()` in `install.js`

**What:** A new function called after `reportLocalPatches(targetDir)` at `bin/install.js:2373` (Claude branch) and line `bin/install.js:2254` (Codex branch). Both invoke `checkCrossRuntimeParity(targetDir, thisRuntime)`.

**Insertion point code shape:**

```javascript
// Source: proposed addition to bin/install.js, after reportLocalPatches()
// LOCATION: Claude branch line 2373-2374; Codex branch line 2254-2255

function checkCrossRuntimeParity(targetDir, thisRuntime, isGlobal) {
  const otherRuntime = thisRuntime === 'claude' ? 'codex' : 'claude';
  const otherDirName = getDirName(otherRuntime);
  // Reuse Phase 58.1 DC-3 centralization
  const otherScopeVersionPath = isGlobal
    ? path.join(process.cwd(), otherDirName, 'get-shit-done-reflect', 'VERSION')
    : path.join(getGlobalDir(otherRuntime, explicitConfigDir), 'get-shit-done-reflect', 'VERSION');
  const otherManifestPath = path.dirname(path.dirname(otherScopeVersionPath));

  if (!fs.existsSync(otherScopeVersionPath)) {
    // G-4: honestly skip; do not invent "parity check passed"
    return { divergent: false, reason: 'other_runtime_not_installed' };
  }

  let otherVersion, otherManifest;
  try {
    otherVersion = fs.readFileSync(otherScopeVersionPath, 'utf8').trim();
    const otherMPath = path.join(otherManifestPath, MANIFEST_NAME);
    if (fs.existsSync(otherMPath)) {
      otherManifest = JSON.parse(fs.readFileSync(otherMPath, 'utf8'));
    }
  } catch {
    // G-4: honestly skip on read errors
    return { divergent: false, reason: 'other_manifest_unreadable' };
  }

  const thisVersion = JSON.parse(fs.readFileSync(path.join(targetDir, MANIFEST_NAME), 'utf8')).version;
  const divergent = otherVersion.replace(/\+dev$/, '') !== thisVersion.replace(/\+dev$/, '');

  const report = {
    schema_version: 1,
    this_runtime: thisRuntime,
    this_version: thisVersion,
    other_runtime: otherRuntime,
    other_version: otherVersion,
    divergent,
    divergent_file_count: 0,  // compute by diffing manifests when both exist
    checked_at: new Date().toISOString(),
    remediation_command: divergent ? `node bin/install.js --${otherRuntime}` : null,
  };

  // G-4: count divergent files only when both manifests present
  if (otherManifest && divergent) {
    const thisManifest = JSON.parse(fs.readFileSync(path.join(targetDir, MANIFEST_NAME), 'utf8'));
    const otherFiles = Object.keys(otherManifest.files || {});
    const thisFiles = Object.keys(thisManifest.files || {});
    const thisOnly = thisFiles.filter(f => !otherFiles.includes(f)).length;
    const otherOnly = otherFiles.filter(f => !thisFiles.includes(f)).length;
    report.divergent_file_count = thisOnly + otherOnly;
  }

  // Write JSON artifact (SENS-06 programmatic surface)
  const artifactPath = path.join(targetDir, 'gsd-parity-report.json');
  fs.writeFileSync(artifactPath, JSON.stringify(report, null, 2));

  // Advisory stdout (copy-pasteable, non-interactive by default — CI-safe)
  if (divergent) {
    console.log('');
    console.log('  ' + yellow + 'Cross-runtime parity:' + reset + ' ' + otherRuntime + ' is at v' + otherVersion + ', this install is at v' + thisVersion + '.');
    if (report.divergent_file_count > 0) {
      console.log('  ' + dim + report.divergent_file_count + ' file(s) differ.' + reset);
    }
    console.log('  ' + dim + 'To sync: ' + reset + cyan + report.remediation_command + reset);
    console.log('');
  }
  return report;
}
```

### Anti-Patterns to Avoid

- **Splitting the log sensor into `gsd-log-sensor-claude.md` + `gsd-log-sensor-codex.md`.** [evidenced:cited] EXT-06 glob discovery in `get-shit-done/bin/lib/sensors.cjs:29` would register both, double-counting and fighting the drop-a-file convention. CONTEXT.md DC-1 locks this.
- **Reimplementing SHA256 / path rewriting / tool-name remapping in the patch sensor.** CONTEXT.md DC-6 locks reuse of existing `bin/install.js` helpers. `scripts/verify-install-parity.js` is the canonical proof that `require('../bin/install.js')` works.
- **Interactive prompt in post-install parity by default.** [evidenced:cited] CI at `.github/workflows/ci.yml:48,104` invokes `node bin/install.js --claude --local 2>&1`, a non-TTY context. `install.js:2503` already uses `if (!process.stdin.isTTY)` to branch — the non-TTY path is the CI path. Default advisory-only stays CI-safe. Q3 closes below with "advisory default, `--interactive` upgrade possible later."
- **Treating unknown Codex event types as parse failures.** Live audit found 12 event_msg types and 3 response_item types not in research doc §1.3. Triggering SENS-07 for every one would emit 600+ signals per phase. The adapter must know the full event vocabulary (see "Code Examples" above), count or ignore, and only fire SENS-07 on JSON parse errors or truly unknown shapes.
- **Silent downgrade of `format-drift` into `customization` when classification is uncertain.** G-3 locks this — uncertain classifications emit `low_confidence: true` and let the synthesizer arbitrate.
- **Emitting "parity OK" when `gsd-file-manifest.json` is absent.** G-4 locks this — report `other_manifest_unreadable` or `other_runtime_not_installed` honestly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| SHA256 file hashing | Custom `crypto.createHash()` | `fileHash(filePath)` exported from `bin/install.js` | [evidenced:cited] Already exists at `bin/install.js:1750`; Phase 58 GATE-15 script reuses it via `require`. |
| Manifest generation | Custom recursive walker | `generateManifest(dir, baseDir)` exported from `bin/install.js` | [evidenced:cited] `bin/install.js:1758`. Single source of truth prevents drift across SENS-04 / SENS-06 / XRT-02. |
| Path prefix rewriting | Custom regex | `replacePathsInContent(content, pathPrefix, localPrefix)` exported from `bin/install.js` | [evidenced:cited] `bin/install.js:965`. Three-pass transform with documented safety properties (DRY-RUN validated in Phase 58 deliberation). |
| Tool-name remapping | Custom `const map = {…}` | Import `claudeToCodexTools` from `bin/install.js` — **needs explicit export** | [evidenced:cited] Currently internal at `bin/install.js:517`. Must be added to `module.exports` at line 2627 as part of this phase. |
| Frontmatter parsing | Custom YAML parser | `extractFrontmatterAndBody` + `extractFrontmatterField` from `bin/install.js` | [evidenced:cited] Already exported at `bin/install.js:2627`. |
| Claude→Codex agent conversion | Custom TOML emitter | `convertClaudeToCodexAgentToml(content, agentName)` from `bin/install.js` | [evidenced:cited] Already exported; use it in Layer-2 normalization before cross-runtime content compare. |
| "Is this the source repo?" detection | Ad-hoc checks | `isDogfoodingRepo(cwd)` in new `lib/patch-classifier.cjs` | [decided:reasoned] Q2 closes on `pkg.name === 'get-shit-done-reflect-cc'` + `.git/` + `bin/install.js` + `agents/` + `get-shit-done/` — fivefold signal, near-zero false positive rate. |
| Codex path resolution | Re-derive `~/.codex` | `getGlobalDir('codex', explicitConfigDir)` from `bin/install.js` | [evidenced:cited] Phase 58.1 DC-3 + G-6 — `bin/install.js:130` centralizes this. Forking would violate the constraint. |
| Source vs installed parity comparator | New diff script | `scripts/verify-install-parity.js` exports `compareRoot`, `expectedInstalledContent`, `mapInstalledRelPath`, `firstDiffLine` | [evidenced:cited] Phase 58 Plan 09. The XRT-02 validator's Layer-1 check is 90% of what this script does. Extending it is simpler than rewriting. |

**Key insight:** The installer already does everything Phase 60 needs. Every new surface (patch sensor, SENS-06 parity, XRT-02 validator) is a thin composer over existing `bin/install.js` primitives. The single engineering discipline is "export what's needed; never clone."

## Common Pitfalls

### Pitfall 1: SENS-07 Emitting For Known-Good Codex Events

**What goes wrong:** A naive Codex adapter that doesn't recognize `exec_command_end`, `turn_aborted`, `patch_apply_end`, `context_compacted`, `collab_*`, `mcp_tool_call_end`, `item_completed`, `thread_rolled_back`, `web_search_end` (all event_msg.payload.type values) will classify them as "unknown event type" and emit a SENS-07 capability-gap signal per occurrence.

**Why it happens:** `cross-runtime-parity-research.md:102` enumerates only 5 event_msg types; live corpus has 17. The research sample was too small.

**How to avoid:** Bake the full live-audit vocabulary into the extractor's known-set (documented in this RESEARCH.md's Pattern 2 code). Only truly unknown shapes (new Codex version adds event type we haven't seen) trigger SENS-07.

**Warning signs:** Collect-signals run produces >20 `sensor-parse-failure` signals for a single phase. Check the unknown-type aggregation — likely the adapter is missing a known type.

### Pitfall 2: Dogfooding Repo False-Positive Storm (DC-7)

**What goes wrong:** In the GSDR source repo, `.claude/` and `.codex/` mirrors are GENERATED OUTPUTS. Every `node bin/install.js --local` run produces them. Running the patch sensor in this repo will flag every mirror file as "customization" because the dev-repo modifies source under `agents/` etc. between installs, and the installed copy diverges from the manifest between builds.

**Why it happens:** `sig-2026-02-24-local-patches-false-positive-dogfooding` — the manifest-based detector has no awareness of "am I running inside the source repo?"

**How to avoid:** `isDogfoodingRepo(cwd)` helper (Q2 closure). When true: patch sensor default severity is `trace` (synthesizer trace-filter drops by default). The `gsd patch-check` subcommand shows results but labels the section "Dogfooding mode — expected divergence".

**Warning signs:** Patch sensor emits >10 signals on a clean GSDR repo checkout. Verify `isDogfoodingRepo()` fires.

### Pitfall 3: Schema Drift Breaks SQLite Fallback Contract

**What goes wrong:** A future Codex version renames or removes `threads.cwd` (or bumps to `state_6.sqlite`). The adapter's SQL query fails; if the code doesn't detect this, all Codex sessions become invisible to the log sensor.

**Why it happens:** The filename `state_5.sqlite` already encodes a version suffix — Codex does bump it. Live audit 2026-04-21 found `logs_1.sqlite` → `logs_2.sqlite` has already occurred. The DB filename bump is a real precedent.

**How to avoid:**
1. Glob-probe the DB filename: `ls ~/.codex/state_*.sqlite` (not hardcoded `state_5`).
2. `PRAGMA table_info(threads)` probe BEFORE running the query — confirm required columns exist.
3. On any SQL error, fall through to filesystem-scan fallback AND emit SENS-07 `codex-sqlite-unavailable` with the specific failure mode.
4. Re-run the G-1 audit before every v1.2x release; bump `last_audited`.

**Warning signs:** SENS-07 `codex-sqlite-unavailable` fires persistently — schema bump likely. Update the capability matrix row accordingly.

### Pitfall 4: Directory Name Divergence Invisible Until Too Late

**What goes wrong:** On this live system, BOTH `.codex/gsd-local-patches/` (old naming from v1.17.5) AND `.codex/gsdr-local-patches/` (new naming post-v1.18) exist. `reportLocalPatches()` only looks in `PATCHES_DIR_NAME = 'gsdr-local-patches'` — the old directory is orphaned, its 17 backed-up files are invisible.

**Why it happens:** `bin/install.js:1725` hard-codes `PATCHES_DIR_NAME`. The directory-name transition at v1.18 didn't migrate old patches.

**How to avoid:** Patch sensor Layer 1 detection must check BOTH directory names when scanning for evidence. Classify pre-v1.18 backups as `stale` (their source files may have been modularized away) — this is the golden fixture (see §E application).

**Warning signs:** `gsd patch-check` under-reports patches vs what `find ~/.codex -name 'backup-meta.json'` finds. Look for a second patches directory.

### Pitfall 5: Capability-Matrix Drift Detects Feature-Gap as Format-Drift

**What goes wrong:** A hook file exists in source (Claude-only) but not on Codex. The classifier could label this as `format-drift` ("content diverged") OR `feature-gap` ("one side has no surface"). If the classifier picks `format-drift`, the remediation command will (incorrectly) be `node bin/install.js --codex` which can't install hooks on Codex.

**Why it happens:** Research §2.3 taxonomy boundaries are loose — both classes describe cross-runtime mismatches.

**How to avoid:** **Q6 closure — REPRESENTABILITY IS THE BOUNDARY:**
- `feature-gap` = the other runtime has NO surface for this artifact (e.g., hooks on Codex → no `hooks/` directory in `.codex/`)
- `format-drift` = both runtimes have a surface, but content diverged semantically after normalization

Classifier defers to `capability-matrix.md` for the representability question. If `hooks` row has `N` for Codex → `feature-gap`. If the row has `Y` / conditional-`Y` → `format-drift` is possible. Intentionality is a DOWNSTREAM concern the synthesizer / reflector decides.

**Warning signs:** Patch sensor flags a hook file on Codex as `format-drift`. Should be `feature-gap`.

## Code Examples

Verified patterns from live inspection (no external sources needed; all primitives are in-repo):

### Codex Session Discovery — SQLite PRIMARY + Filesystem FALLBACK

```bash
# Source: this research, dry-run verified 2026-04-21 against ~/.codex/state_5.sqlite (1,184 threads)
# Timing: sqlite 7ms, filesystem-scan 205ms (well under 120s log-sensor timeout)
PROJECT_CWD="$(pwd)"

# Probe schema first — graceful degradation
if command -v sqlite3 >/dev/null 2>&1 && [ -f "$HOME/.codex/state_5.sqlite" ]; then
  HAS_CWD=$(sqlite3 "$HOME/.codex/state_5.sqlite" "PRAGMA table_info(threads);" 2>/dev/null | grep -c "|cwd|")
  if [ "${HAS_CWD:-0}" -gt 0 ]; then
    sqlite3 "$HOME/.codex/state_5.sqlite" \
      "SELECT rollout_path FROM threads
       WHERE cwd = '$PROJECT_CWD' AND archived = 0
       ORDER BY created_at DESC LIMIT 10;"
  fi
fi
```

### Post-Install Parity — Insertion Point (bin/install.js)

```javascript
// Source: bin/install.js — proposed insertion after reportLocalPatches()
// Codex branch — insertion at line 2255 (after existing reportLocalPatches call)
if (isCodex) {
  // ... existing code ...
  writeManifest(targetDir);
  pruneRedundantPatches(targetDir);
  reportLocalPatches(targetDir);
  checkCrossRuntimeParity(targetDir, 'codex', isGlobal);   // <-- NEW
  return { settingsPath: null, settings: {}, statuslineCommand: null, runtime };
}

// Claude branch — insertion at line 2374 (after existing reportLocalPatches call)
writeManifest(targetDir);
pruneRedundantPatches(targetDir);
reportLocalPatches(targetDir);
checkCrossRuntimeParity(targetDir, 'claude', isGlobal);   // <-- NEW
return { settingsPath, settings, statuslineCommand, runtime };
```

### Dogfooding Detection (Q2 closure)

```javascript
// Source: proposed get-shit-done/bin/lib/patch-classifier.cjs
// Live-verified against this cwd: all five predicates true
function isDogfoodingRepo(cwd) {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    return (
      pkg.name === 'get-shit-done-reflect-cc' &&
      fs.existsSync(path.join(cwd, '.git')) &&
      fs.existsSync(path.join(cwd, 'bin', 'install.js')) &&
      fs.existsSync(path.join(cwd, 'agents')) &&
      fs.existsSync(path.join(cwd, 'get-shit-done'))
    );
  } catch { return false; }
}
// Live verification (2026-04-21, this cwd): returns true.
```

### Golden Fixture — 17-File v1.17.5 Codex Backup Classification

Applied by hand using the classifier semantics in Pattern 3. Input: `~/.codex/gsd-local-patches/backup-meta.json` (17 files from v1.17.5):

| File | Source still exists? | Classification | Confidence |
|---|---|---|---|
| `get-shit-done-reflect/bin/gsd-tools.js` | **NO** (v1.18 modularized to `get-shit-done/bin/gsd-tools.cjs` + `lib/*.cjs`) | `stale` (file moved) | HIGH |
| `get-shit-done-reflect/references/model-profile-resolution.md` | YES (at `get-shit-done/references/model-profile-resolution.md`) | `stale` | HIGH |
| `get-shit-done-reflect/references/model-profiles.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/templates/context.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/audit-milestone.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/discuss-phase.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/execute-phase.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/help.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/map-codebase.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/new-milestone.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/new-project.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/plan-phase.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/quick.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/research-phase.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/set-profile.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/settings.md` | YES | `stale` | HIGH |
| `get-shit-done-reflect/workflows/verify-work.md` | YES | `stale` | HIGH |

**Expected classifier output:** 16× `stale` + 1× `stale` (for the moved `gsd-tools.js` — source still conceptually exists, just at a new path). **Zero** `customization`. This matches the CONTEXT.md spec and serves as the golden fixture for `tests/unit/patch-classifier.test.js`.

Note: all 17 files are currently also present in the (new-naming) `.codex/gsdr-local-patches/backup-meta.json` from v1.19.4 (April 17, 2026), which contains 9 different files. The sensor must detect BOTH directories (Pitfall 4).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|---|---|---|---|
| Log sensor as Claude-only stub with `[DISABLED]` label text | Cross-runtime adapter via runtime-detection branch in single spec file | Phase 60 (this phase) | Closes DC-8 recurring blind-spot pattern. |
| Patch detection ONLY at install-time via `saveLocalPatches()` (runtime silent between installs) | Dual-surface sensor + `gsd patch-check` subcommand + post-install parity advisory | Phase 60 | User and KB both see divergence between installs; SENS-06 closes `sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift` surface. |
| Research doc `cross-runtime-parity-research.md` citing Codex 0.118.0 + `logs_1.sqlite` | Live audit 2026-04-21: Codex 0.121.0 + `logs_2.sqlite` + richer event vocabulary (17 event_msg types vs 5 in doc) | Before Phase 60 ships | G-1 audit gate — doc MUST be bumped before plans lock. |
| SQLite CLI "not assumed" in research doc | Confirmed present on all GSDR-supported platforms (macOS system, Ubuntu system, Node-shipping miniconda) | Phase 60 (live-verified) | Primary path is robust; fallback is <1s on 1,158 files. |

**Deprecated/outdated:**
- Log sensor blind-spot text: "Currently works for Claude Code sessions" — will be stale after Phase 60 lands. Update `<blind_spots>` section on ship.
- `sig-2026-03-04-stale-log-sensor-spec-disabled-by-default-text` and `sig-2026-04-09-log-sensor-spec-disabled-label-causes-repeated-exclusion` — will be remediated by Phase 60.

## Open Questions

### Resolved

**Q1 — Codex subagent / parallel-thread session topology:** [evidenced:cited] Codex DOES produce separate rollout files for subagents. Live query (`state_5.sqlite` against this machine's data):
```
SELECT id, agent_role, source FROM threads WHERE cwd = '…' …
```
Returns rows where `title` contains `{"subagent":{"thread_spawn":{"parent_thread_id":…,"depth":1,"agent_role":"gsdr-executor"}}}` — i.e., the `agent_role` column distinguishes orchestrator-spawned subagent sessions. Also the `thread_spawn_edges` table exists in the schema (see the `.tables` output) and explicitly tracks parent-child thread relationships.

**Recommendation:** Stage 2 triage deprioritizes sessions whose `agent_role` is set (non-null) AND whose `title` contains `"subagent":{"thread_spawn"`. These are Codex subagent rollouts — analogous to Claude's "subagent JSONL files — mechanical, not conversational." The existing Claude rule "deprioritize subagent JSONLs" maps to "deprioritize `agent_role IS NOT NULL` OR title matches the thread_spawn pattern" on Codex. The `source: "exec"` vs `"cli"` distinction is orthogonal and both are kept as fingerprint metadata.

**Q2 — Patch sensor noise control in dogfooding:** [decided:reasoned, evidence-grounded] Closed with the fivefold `isDogfoodingRepo()` predicate documented above. Lives in `get-shit-done/bin/lib/patch-classifier.cjs` (shared helper, not in the sensor or subcommand directly, so both surfaces use the same check). Dogfooding mode DEFAULT-SEVERITY is `trace`, so the synthesizer drops them unless the user explicitly runs `gsd patch-check` for a review. No new config flag needed — the CONTEXT.md already has `signal_collection.sensors.patch.enabled` as a gate via `sensors.cjs:120`.

**Q3 — Post-install parity interaction model:** [evidenced:cited] `bin/install.js:2503` and `:2614` already use `if (!process.stdin.isTTY)` to branch between interactive and default paths for `promptLocation()` and similar prompts. CI invokes `node bin/install.js --claude --local 2>&1` (non-TTY) per `.github/workflows/ci.yml:48,104`. The test suite does likewise. **Recommendation:** Ship default-advisory-only for v1.20 per CONTEXT.md decision, but note that upgrading to "interactive-if-TTY, advisory-if-not" via `process.stdin.isTTY` is a one-line change. Leave as a defer-upgrade-path; Q3 in CONTEXT.md marks reversibility HIGH. The `gsd-parity-report.json` artifact is the programmatic surface regardless of prompt mode.

**Q4 — XRT-02 patch compatibility evidence source:** [evidenced:cited] **Live call, not static snapshot.** The Phase 58 `scripts/verify-install-parity.js` already proves this pattern works stably — it `require('../bin/install.js')` and imports `replacePathsInContent` + `injectVersionScope` directly. The XRT-02 validator follows the same shape. Specific helpers it calls:
- `extractFrontmatterAndBody`, `extractFrontmatterField` — detect frontmatter compat issues
- `claudeToCodexTools` (needs export) — tool-name compat check
- `replacePathsInContent` — path-prefix compat
- `convertClaudeToCodexMarkdown` — command-prefix compat
- `convertClaudeToCodexAgentToml` — agent conversion compat
Static snapshot rejected because the tool map is ALREADY the source of truth at `bin/install.js:517` — any snapshot is duplication. The CONTEXT.md option of "static snapshot" is reversible-medium, but the Phase 58 precedent closes it in favor of live call.

**Q5 — SENS-07 parse-failure budget:** [evidenced:cited] **Zero parse failures across 50 sessions / 12,204 events** on live Codex corpus 2026-04-21. Every session had a `session_meta` first event. No truncated files. **Recommendation:** per-file emission, NO aggregation cap. The dominant risk is NOT JSON parse errors; it's unknown event types (12 unknown event_msg types + 3 unknown response_item types found). The adapter handles these by known-event-list baking (Pattern 2 code above). If a future Codex version introduces a NEW event type, it trips SENS-07 once per file — user-tolerable per-phase signal volume (<10).

**Q6 — Feature-gap vs format-drift classification boundary:** [decided:reasoned] **Representability, not intentionality.** The boundary is "does the other runtime have a surface for this artifact at all?" not "was this divergence deliberate?" Intentionality is a downstream reflection/synthesis question; the sensor's job is to classify what it sees. Closure:
- `feature-gap` ⇔ the other runtime has NO surface. Signal = source exists, other-runtime installed-hash absent, AND `capability-matrix.md` row for the artifact category is `N` for the other runtime.
- `format-drift` ⇔ both runtimes have a surface but content diverged after normalization. Signal = installed-hash present on both but differs even after `replacePathsInContent` + tool-name-remap + command-prefix conversion.
The classifier consults `capability-matrix.md` (by reading the installed `get-shit-done-reflect/references/capability-matrix.md`) to distinguish. Synthesizer reinterprets intentionality downstream.

### Genuine Gaps

**Genuine Gaps: none — all six CONTEXT open questions close below.** Every Q1..Q6 has an evidence-grounded recommendation that the planner can execute against.

### Still Open (surfaced, not blocking)

- **`gsd patch-check` subcommand name.** Three candidates (`patch-check`, `patches`, `divergence-check`). CONTEXT.md marks this Claude's Discretion. Recommendation: **`gsd patches`** — terse, matches `gsd sensors` / `gsd phase` / `gsd release` verb-like pattern from `gsd-tools.cjs` router. Planner can reject.
- **JSON artifact naming.** Single `gsd-parity-report.json` vs per-runtime `gsd-parity-report.{runtime}.json`. Recommendation: **single file, with `this_runtime` + `other_runtime` fields** — avoids doubling count and aligns with how `gsd-file-manifest.json` is single-per-side.
- **Helper script vs inline python3 for fingerprint extraction.** Both work. Recommendation: **helper script `get-shit-done/bin/extract-session-fingerprints.py`** because it gets its own unit-test surface and matches the existing `extract-session-fingerprints.py` naming convention the log sensor spec already references (Stage 1c says "If `extract-session-fingerprints.py` is available at the project root …, use it"). Ship this as part of Phase 60; the log-sensor spec then simplifies.

## Per-Sensor Codex Behavior Matrix (sidecar content — to land as `60-codex-behavior-matrix.md`)

**Per XRT-01 (Phase 58 Success Criterion 8)**, Phase 60 MUST emit a per-sensor Codex-behavior matrix. Following Phase 58 Plan 05 vocabulary (`applies | applies-via-workflow-step | applies-via-installer | does-not-apply-with-reason`). The planner lands this file; the rows below are the research-derived content.

| Requirement / Surface | Substrate | Claude Code behavior | Codex CLI behavior | Rationale |
|---|---|---|---|---|
| **SENS-01 Log-sensor runtime-neutral fingerprint schema** | sensor adapter in `agents/gsd-log-sensor.md` | `applies` | `applies` | One sensor, two format branches; fingerprint JSON is runtime-agnostic after Stage 1c. |
| **SENS-02 Codex session log discovery** | sqlite3 CLI primary + filesystem fallback | `does-not-apply-with-reason: claude-uses-filesystem-scan` | `applies` | Claude sessions discovered via filesystem-scan in existing Stage 1a; the Codex-side sqlite path is the NEW addition. |
| **SENS-03 state_5.sqlite query primary, fallback documented** | sqlite3 CLI | `does-not-apply-with-reason: claude-has-no-session-db` | `applies` | Claude Code has no session state DB; this capability is Codex-specific. `[projected]` to Claude if Claude adds one. |
| **SENS-04 Patch sensor detects drift using SHA256 manifest** | patch sensor `agents/gsd-patch-sensor.md` + `lib/patch-classifier.cjs` | `applies` | `applies` | Manifest mechanism is runtime-agnostic; `bin/install.js:1750-1932` installs on both. |
| **SENS-05 Dev-facing classification + report** | `gsd patch-check` subcommand in `gsd-tools.cjs` | `applies` | `applies` | CLI subcommand is runtime-neutral — both harnesses shell out to `node gsd-tools.cjs`. |
| **SENS-06 Post-install parity report** | `checkCrossRuntimeParity()` in `bin/install.js` | `applies-via-installer` | `applies-via-installer` | Installer runs on both; emits `gsd-parity-report.json` + stdout table on both. |
| **SENS-07 Warnings-as-signals diagnostics** | sensor SENS-07 contract | `applies` | `applies` | Sensor-level diagnostic emission is spec-level; both runtimes emit the same structured JSON. |
| **XRT-02 Reapply-time patch-compat validator** | `reapply-patches` workflow + shared classifier | `applies-via-workflow-step` | `applies-via-workflow-step` | Workflow markdown drives the validator inline; both runtimes read the workflow identically. |
| **XRT-01 Per-sensor Codex-behavior matrix (this matrix)** | filesystem artifact `60-codex-behavior-matrix.md` | `applies` | `applies` | Filesystem artifact; runtime-neutral by construction. |

**Notes for planner:**
1. No row degrades to `does-not-apply` for MISSING HOOKS. DC-4 holds: Phase 60 introduces zero new hook substrate.
2. SENS-02 / SENS-03's `does-not-apply-with-reason` on Claude is REPRESENTABILITY-based, not intentionality — Claude genuinely has no session state DB. This is not a degradation; it is a capability that doesn't apply.
3. The matrix artifact itself is runtime-neutral — Phase 58 Plan 05's verifier pattern (existence + row-count check) reapplies here.

## Test Coverage Derivation (per the adopted deliberation)

Per `cross-runtime-parity-testing.md` recommendation (Option B + targeted C + structural D):

| Surface | Unit test (vitest) | Integration test | Golden fixture |
|---|---|---|---|
| **Log-sensor adapter** | `tests/unit/codex-session-discovery.test.js` — SQL query, PRAGMA probe, fallback trigger, filesystem scan. Mock sqlite via `better-sqlite3` OR shell out to real sqlite3 against a temp DB. | extends `tests/integration/multi-runtime.test.js` — end-to-end: place a fake rollout in `~/.codex/sessions/…`, run fingerprint extractor, assert normalized schema. | Small synthetic Codex rollout JSONL (5-10 events) in `tests/fixtures/codex-rollout-sample.jsonl`. |
| **Patch classifier** | `tests/unit/patch-classifier.test.js` — exhaustive coverage of the 5 classes × dogfooding on/off. Include the 17-file golden fixture. | not needed — classifier is pure-logic | `tests/fixtures/codex-v1175-backup-meta.json` + matching `tests/fixtures/codex-v1175-manifest-before.json` to drive classification. All 17 entries classify as `stale`. |
| **Post-install parity** | `tests/unit/cross-runtime-parity.test.js` — mock both-scope `VERSION` files, assert `gsd-parity-report.json` shape + stdout format + advisory-only behavior. | extends `tests/integration/multi-runtime.test.js` — install Claude, install Codex with divergent version, assert parity report detects divergence. | none needed — test fixtures are synthetic VERSION + manifest files. |
| **XRT-02 validator** | `tests/unit/xrt02-validator.test.js` — exhaustive check for tool-name + path + command-prefix compat across all 4 compat axes. Exercise live `require('../bin/install.js')` helpers. | none needed — validator is pure-logic over synthetic inputs | `tests/fixtures/incompatible-patch-*.md` (hook-ref on Codex target, etc.) |
| **Sensor drop-a-file registration** | extends `tests/unit/sensors.test.js` — assert `gsd-patch-sensor.md` is auto-discovered via EXT-06 regex. | extends `tests/integration/multi-runtime.test.js` — name parity check: both `.claude/agents/gsd-patch-sensor.md` and `.codex/agents/gsdr-patch-sensor.toml` exist after `--all` install. | none needed. |
| **Codex-behavior-matrix sidecar** | none — pure filesystem artifact with row-count + format check | none | none |

**Structural prevention (Option D from deliberation):** Already satisfied — EXT-06 glob discovery eliminates hardcoded sensor lists. No new hardcoded lists introduced in Phase 60. `scripts/verify-install-parity.js` walks source roots, not a hardcoded file list. The one new hardcode (event-type known-set in the Codex fingerprint extractor) is a VOCABULARY list that genuinely represents the substrate — not a sync point that could drift silently. Audit 2026-04-21 locked it; next audit due 2026-05-05 or on Codex version bump.

## G-1 Audit Gate Finding (MANDATORY UPDATE BEFORE SHIP)

Per **G-1 (governing:reasoned):** "Do not treat `cross-runtime-parity-research.md` as permanently current." The Validation Commands table was re-run on 2026-04-21. Results:

| Claim | Command | Expected (per doc) | Actual (2026-04-21) | Drift? |
|---|---|---|---|---|
| Codex version | `codex --version` | 0.118.0 or later | **0.121.0** | YES — bump `last_audited_codex_version` |
| Codex hooks feature flag | `codex features list \| grep codex_hooks` | `codex_hooks under development true` | `codex_hooks under development true` | no |
| Codex multi-agent | `codex features list \| grep multi_agent` | `multi_agent stable true` | `multi_agent stable true` + NEW `multi_agent_v2 under development false` | PARTIAL — add `multi_agent_v2` row |
| Codex config location | `ls ~/.codex/config.toml` | File exists | Exists (8433 bytes) | no |
| Project-local .codex | `ls .codex/config.toml` | File exists (in GSD dev repo) | Exists (8115 bytes) | no |
| Claude Code hooks | `cat .claude/settings.json \| grep -c hooks` | Non-zero count | 12 | no |
| Agent TOML files | `ls .codex/agents/*.toml` | Lists .toml agent files | 22 TOML files listed | no |
| Skill directory format | `ls .codex/skills/*/SKILL.md` | Lists SKILL.md files | 46 skills with SKILL.md files | no |
| **(NEW) Codex logs DB filename** | `ls ~/.codex/logs_*.sqlite` | `logs_1.sqlite` (per doc §7.2) | **`logs_2.sqlite`** (1.1GB) | YES — bump `last_audited` and note schema bump happened |
| **(NEW) Session event types** | live audit of 100 rollout JSONLs | 5 event_msg types (per doc §1.3) | **17 event_msg types** (12 undocumented) | YES — §1.3 is under-enumerated; extractor must know the live vocabulary |

**Required updates to `cross-runtime-parity-research.md` BEFORE Phase 60 ships (can happen in Plan 60.1):**
1. Bump `last_audited: "2026-04-21"` and `last_audited_codex_version: "0.121.0"`.
2. Update `last_audited_claude_code_version` — re-run `claude --version` (not run here; planner picks up).
3. `next_audit_due: "2026-05-05"`.
4. §1.2 Codex version reference: `v0.118.0` → `v0.121.0`.
5. §7.2 directory layout: `logs_1.sqlite` → `logs_2.sqlite` (note the bump happened naturally; Codex does rev these filenames).
6. §1.3 Codex CLI event type enumeration: extend event_msg list with `exec_command_end`, `turn_aborted`, `patch_apply_end`, `context_compacted`, `collab_*_end`, `mcp_tool_call_end`, `item_completed`, `thread_rolled_back`, `web_search_end`. Extend response_item list with `custom_tool_call`, `custom_tool_call_output`, `web_search_call`.
7. Validation Commands table: add a "Codex logs DB filename" row and a "Session event-type enumeration" pointer.

## Plan Decomposition Recommendation

Suggested breakdown: **6 plans, 3 waves**. The G-1 research-doc bump is the gating dependency for wave 2; the sensor surfaces lock in wave 2; tests + matrix land in wave 3.

### Wave 1 — G-1 Audit + Installer Export Preparation (sequential)

**Plan 60.1 — G-1 audit reconciliation + installer export prep**
- Bump `cross-runtime-parity-research.md` frontmatter + drift findings per above.
- Add `claudeToCodexTools` to `bin/install.js` `module.exports` (currently internal at line 517).
- No other code changes.
- **Dependencies:** none.
- **Unlocks:** all wave-2 plans (they import `claudeToCodexTools` and build on the audited doc).
- **Size:** small. ~1 hour.
- **Codex behavior:** `applies` (pure doc + export).

### Wave 2 — Surface Implementation (parallel, 3 plans)

**Plan 60.2 — Log-sensor cross-runtime adapter (SENS-01, SENS-02, SENS-03, SENS-07)**
- Modify `agents/gsd-log-sensor.md`: add runtime-detection branch to Stages 1a, 1c, 3a, 3c.
- Add `get-shit-done/bin/extract-session-fingerprints.py` helper (or inline python3 — Claude's Discretion).
- Add SENS-07 diagnostic emission for unknown event types + parse errors.
- Update `<blind_spots>` section to remove the "Currently works for Claude Code" language.
- **Dependencies:** Plan 60.1.
- **Output:** cross-runtime log sensor. Test coverage in Plan 60.6.
- **Parallel with:** 60.3, 60.4.

**Plan 60.3 — Patch sensor + `gsd patches` subcommand + classifier library (SENS-04, SENS-05, SENS-07)**
- New file `get-shit-done/bin/lib/patch-classifier.cjs` with `isDogfoodingRepo` + `classify`.
- New file `agents/gsd-patch-sensor.md` (drop-a-file sensor with SENSOR OUTPUT contract; delegates to classifier).
- New subcommand in `get-shit-done/bin/gsd-tools.cjs`: `gsd patches` (register in router switch statement; delegate to classifier + format as table).
- Handle directory-name divergence (Pitfall 4): scan both `gsd-local-patches/` and `gsdr-local-patches/`.
- **Dependencies:** Plan 60.1.
- **Output:** dual-surface patch sensor. Test coverage in Plan 60.6.
- **Parallel with:** 60.2, 60.4.

**Plan 60.4 — Post-install parity SENS-06 hook in `bin/install.js`**
- Add `checkCrossRuntimeParity(targetDir, thisRuntime, isGlobal)` function per code shape above.
- Call from Claude branch (line 2374) and Codex branch (line 2255).
- Write `gsd-parity-report.json` artifact. Advisory stdout by default (non-interactive). Honor G-4 when manifest absent.
- Test coverage in Plan 60.6.
- **Dependencies:** Plan 60.1.
- **Parallel with:** 60.2, 60.3.

### Wave 3 — XRT-02 Validator, Matrix Sidecar, Test Coverage (parallel, 2 plans)

**Plan 60.5 — XRT-02 validator + Codex-behavior-matrix sidecar**
- Modify `commands/gsd/reapply-patches.md` + `get-shit-done/workflows/reapply-patches.md`: add pre-apply validator step.
- Validator uses live `require('../bin/install.js')` helpers per Q4 closure.
- Validator shares classifier vocabulary with Plan 60.3 (it IS classifier.classify() filtered to format-drift/feature-gap).
- Author `.planning/phases/60-sensor-pipeline-codex-parity/60-codex-behavior-matrix.md` sidecar using the per-surface matrix in this RESEARCH.md. XRT-01 closeout check reads it.
- **Dependencies:** Plan 60.3 (classifier library reused).
- **Parallel with:** 60.6.

**Plan 60.6 — Regression test suite + golden fixtures**
- `tests/unit/patch-classifier.test.js` — 5-class × dogfooding-on/off coverage; 17-file golden fixture.
- `tests/unit/codex-session-discovery.test.js` — sqlite + PRAGMA + fallback.
- `tests/unit/cross-runtime-parity.test.js` — `gsd-parity-report.json` shape + advisory behavior.
- `tests/unit/xrt02-validator.test.js` — 4 compat axes.
- Extend `tests/unit/sensors.test.js` — auto-discovery of `gsd-patch-sensor.md`.
- Extend `tests/integration/multi-runtime.test.js` — post-install parity end-to-end.
- Fixtures: `tests/fixtures/codex-v1175-backup-meta.json`, `tests/fixtures/codex-rollout-sample.jsonl`.
- **Dependencies:** Plan 60.2, 60.3, 60.4, 60.5 (needs all surfaces to exist to test).
- **Parallel with:** 60.5 (can start once classifier lib exists from Plan 60.3).

### Dependency Graph

```
Plan 60.1 (G-1 audit + exports)
   │
   ├──► Plan 60.2 (log-sensor adapter) ──┐
   ├──► Plan 60.3 (patch sensor) ───────┐├──► Plan 60.6 (tests)
   └──► Plan 60.4 (SENS-06 parity) ─────┘│    Plan 60.5 (XRT-02 + matrix)
                                         └────┘
```

- Plans 60.2, 60.3, 60.4 are FULLY INDEPENDENT (no file overlap): log sensor / patch sensor / installer.
- Plan 60.5 depends on 60.3 (classifier library).
- Plan 60.6 depends on ALL implementation plans being mergeable.

**Conservative planner sizing:** ~4h each for 60.2, 60.3, 60.4; ~2h each for 60.1, 60.5; ~5h for 60.6 (test surface is broad). Total: ~21h. Adjust to your own sizing heuristic.

## Sources

### Primary (HIGH confidence — live-verified or direct inspection)
- `~/.codex/state_5.sqlite` — live schema probe 2026-04-21; 1,184 threads, 27 columns, per-row data inspected
- `~/.codex/sessions/2026/04/*/rollout-*.jsonl` — 100 sessions surveyed, 12,204 events parsed, zero parse failures
- `~/.codex/gsd-local-patches/backup-meta.json` + `~/.codex/gsdr-local-patches/backup-meta.json` — both present on live system; directory-name divergence verified
- `codex --version` → 0.121.0 (2026-04-21)
- `codex features list` → `codex_hooks under development true`, `multi_agent stable true`, `multi_agent_v2 under development false`
- `which sqlite3` → `/home/rookslog/miniconda3/bin/sqlite3` 3.50.2
- `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js` lines 31-45 (CODEX_AGENT_SANDBOX), 130-147 (getGlobalDir), 515-530 (claudeToCodexTools), 537-562 (extractFrontmatter*), 573-580 (convertClaudeToCodexMarkdown), 590-624 (convertClaudeToCodexAgentToml), 965-1016 (replacePathsInContent), 1720-1977 (patch backup surface), 1934-2376 (install function), 2503-2614 (TTY-aware prompts), 2627-2630 (module.exports)
- `/home/rookslog/workspace/projects/get-shit-done-reflect/scripts/verify-install-parity.js` — GATE-15 script, canonical `require('bin/install.js')` reuse pattern
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/bin/lib/sensors.cjs:29` — EXT-06 regex `/^gsdr?-(.+)-sensor\.(md|toml)$/`
- `/home/rookslog/workspace/projects/get-shit-done-reflect/.github/workflows/ci.yml:48,104` — non-TTY invocation of `bin/install.js` in CI
- `/home/rookslog/workspace/projects/get-shit-done-reflect/agents/gsd-log-sensor.md` — current Stages 1-5 spec; `<blind_spots>` declares Codex gap
- `/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/research/cross-runtime-parity-research.md` — authoritative; flagged for G-1 update
- `/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/deliberations/cross-runtime-parity-testing.md` — adopted test strategy
- `/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md` — reference pattern for Phase 60's sidecar

### Secondary (MEDIUM confidence — code-path logic, not end-to-end live test)
- Classifier library design (`lib/patch-classifier.cjs`) — derived from manifest semantics, not yet implemented
- `checkCrossRuntimeParity()` insertion points — code path traced but not yet written
- Test-file structure — follows existing vitest + tmpdir patterns verified in `tests/unit/install.test.js`

### Tertiary (LOW confidence — none identified)
No tertiary sources. Every claim in this RESEARCH.md is grounded in live inspection or direct source-code read.

## Knowledge Applied

Queried `.planning/knowledge/index.md` (302 entries: 294 signals + 8 spikes) on 2026-04-21. Relevant entries surfaced and applied:

| Entry | Type | Summary | Applied To |
|---|---|---|---|
| `sig-2026-04-09-log-sensor-stub-no-session-analysis-performed` | signal (notable) | Log sensor returned stub output; SENS-01..03 blind spot | DC-8 framing, Plan 60.2 mandate |
| `sig-2026-04-09-orchestrator-skipped-log-sensor-despite-discovery` | signal (notable) | Orchestrator dropped log-sensor even after discovery | DC-8 recurrence; post-Phase 60 operability is Plan 60.6 acceptance gate |
| `sig-2026-04-09-log-sensor-disabled-label-recurrence-57-3` | signal (notable) | `[DISABLED]` label causes repeated exclusion | Update spec `<blind_spots>` text as part of Plan 60.2 |
| `sig-2026-03-04-stale-log-sensor-spec-disabled-by-default-text` | signal (minor) | Stale disabled text in spec | Same remediation surface as above |
| `sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift` | signal (critical) | Cross-runtime upgrade drift; DC-9 | SENS-06 post-install parity closes the immediate surface |
| `sig-2026-03-04-drop-a-file-sensor-extensibility-pattern` | signal (notable, good-pattern) | EXT-06 glob discovery; mechanically verified 10/10 | Validated architectural decision to add `agents/gsd-patch-sensor.md` as a drop-a-file addition |
| `sig-2026-02-24-local-patches-false-positive-dogfooding` | signal (notable) | Dogfooding false-positive pattern | Q2 closure — `isDogfoodingRepo()` helper |
| `spk-2026-03-01-claude-code-session-log-location` | spike (confirmed) | Claude Code session log location spike | Re-used existing findings for Stage 1a Claude branch (unchanged) |
| `spk-2026-04-09-session-data-integrity-characterization` | spike (confirmed) | Codex session data integrity | Supports G-1 audit method; Codex session_meta reliably present (verified in 100-session audit) |
| `spk-2026-04-09-token-count-reliability` | spike (confirmed) | Codex token_count reliability | Codex-specific additive fields (`reasoning_output_tokens`, `model_context_window`) are safe to pull from token_count events |

**Spike deduplication (SPKE-08):** No spike opportunity surfaced by Phase 60's research questions — all six CONTEXT open questions closed with direct live-inspection evidence (<10ms sqlite query, 100-session event-type survey, `isDogfoodingRepo` verified-here). Do NOT recommend triggering new spikes for Phase 60. The one speculative item (whether Codex `history.jsonl` is useful for cross-session patterns) is explicitly deferred per CONTEXT.md.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every primitive is an existing exported function with live evidence of reuse
- Architecture (adapter pattern, dual-surface classifier, post-install hook): HIGH — each pattern has a source-file precedent (log sensor spec, sensors.cjs, install.js, verify-install-parity.js)
- Pitfalls: HIGH — each pitfall has live evidence (100-session audit, two patch directories on the machine, G-1 drift findings)
- Q1-Q6 closures: HIGH — all six are evidence-grounded; no spike gap
- Codex-behavior matrix: HIGH — follows Phase 58 Plan 05 vocabulary precisely; DC-4 holds on every row
- Test coverage: MEDIUM — test-file structure is canonical (vitest + tmpdir) but exact fixture shape is Claude's Discretion within Plan 60.6

**Research date:** 2026-04-21
**Valid until:** 2026-05-05 (14 days) — Codex version bumps and session-format changes are the fast-moving risks; re-run G-1 at next Codex version bump or 2026-05-05, whichever comes first.
