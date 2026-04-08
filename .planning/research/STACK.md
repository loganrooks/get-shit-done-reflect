# Technology Stack: v1.20 Signal Infrastructure & Epistemic Rigor

**Project:** GSD Reflect v1.20
**Researched:** 2026-04-08
**Confidence:** HIGH (verified against Node.js 22 documentation, actual codebase inspection, live tests of node:sqlite on Dionysus)

---

## Executive Summary

v1.20 adds four new capability domains to an existing 674-line router + 16 lib/*.cjs modules:
(1) SQLite KB index, (2) telemetry/session-meta extraction, (3) cross-runtime format adapters, and (4) spike methodology structural enforcement. All four are achievable with **one conditional dependency** and **zero external services**. The zero-dependency philosophy holds for production npm distribution; the single conditional is `node:sqlite` (Node.js built-in, requires Node >=22.5.0), which replaces the previous `better-sqlite3` recommendation from the kb-architecture research.

**The key technical unlock for v1.20:** `node:sqlite` ships with Node 22.22.1 (the system Node on Dionysus and current LTS), supports FTS5 full-text search, has `all()`/`get()`/`iterate()` on prepared statements, and executes synchronously — matching the existing gsd-tools.cjs synchronous execution model exactly. No native compilation. No npm dependency. No `npm install` step for end users. The flag `(node:NNNN) ExperimentalWarning: SQLite is an experimental feature` appears at runtime but does not affect functionality; it can be suppressed with `--no-warnings` if needed in hooks.

**Version constraint implications:** `node:sqlite` requires Node >=22.5.0. The current `package.json` `engines.node` is `>=16.7.0`. v1.20 should update this to `>=22.5.0` for the KB subcommand, OR guard the `require('node:sqlite')` with a version check and graceful degradation to the shell `sqlite3` CLI fallback. Since both primary machines (Dionysus: 22.22.1, Apollo: MacBook expected Node 22+ LTS) satisfy this constraint, updating `engines.node` is the cleaner path. Codex CLI users are on the same machine set.

**What NOT to add:** No `better-sqlite3` (requires native compilation, breaks on Node version mismatches). No `yaml`/`js-yaml` (existing custom frontmatter parser in frontmatter.cjs is sufficient for signal files). No `ccusage` (external dependency; cannot provide GSD phase correlation). No Python runtime dependency (fingerprint extraction stays as a standalone audit tool, not an npm-bundled script). No MCP server (deferred to v1.21; CLI-first is validated and unblocks MCP wrapper later with zero redesign).

---

## Recommended Stack

### Core Framework (No Changes)

| Technology | Version | Purpose | Why Unchanged |
|------------|---------|---------|---------------|
| Node.js | >=22.5.0 (host: 22.22.1) | Runtime for gsd-tools.cjs and hook scripts | node:sqlite requires this minimum |
| Markdown + YAML frontmatter | N/A | Signal files, workflow specs, KB entries | Files remain source of truth; SQLite is derived cache |
| Shell scripts (bash) | N/A | KB index rebuild (legacy), hook scripts | kb-rebuild-index.sh stays for backward compat |
| Git CLI | >=2.x | Version control, patch detection data source | No changes; installer already uses git hashes |

### New Capability: SQLite KB Index

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `node:sqlite` (built-in) | Node >=22.5.0 | KB query index, FTS5 full-text search | Zero npm dependency; synchronous API matches existing gsd-tools pattern; FTS5 confirmed working on Node 22.22.1 |

**Integration point:** New `get-shit-done/bin/lib/kb.cjs` module. Router adds `case 'kb':` to gsd-tools.cjs switch at approximately line 89. Module follows established pattern: `output()` / `error()` from core.cjs, `atomicWriteJson()` for non-SQLite writes, `resolveWorktreeRoot()` for path normalization.

**Database location:** `.planning/knowledge/kb.db` — added to `.gitignore` (derived artifact, reconstructable from `.md` files).

**Schema summary (from kb-architecture-research.md):** Four tables — `signals` (indexed frontmatter fields), `signal_tags` (many-to-many), `signal_links` (qualified-by, superseded-by, related-to), `spikes` (parallel structure). Plus one FTS5 virtual table `signal_fts` over signal bodies.

**node:sqlite API completeness verified on Dionysus:**
- `DatabaseSync` constructor, `exec()`, `prepare()`, `close()` — all confirmed
- `StatementSync.all()`, `get()`, `iterate()`, `run()` — all confirmed
- FTS5 virtual tables (`CREATE VIRTUAL TABLE ... USING fts5(...)`) — confirmed
- `BEGIN/COMMIT` transaction blocks via `exec()` — confirmed
- No `transaction()` method (unlike better-sqlite3) — use `db.exec('BEGIN; ...; COMMIT;')` or wrap in a helper

**ExperimentalWarning handling:** The warning is a stderr output only, does not affect stdout JSON. Hook scripts can add `--no-warnings` to the node invocation if the warning pollutes structured output. Not a blocking issue.

### New Capability: Telemetry Module

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `node:fs`, `node:path`, `node:os` (built-in) | Node built-in | Read session-meta and facets JSON files | Already used throughout gsd-tools.cjs |
| `node:sqlite` (built-in) | Node >=22.5.0 | Optional: cache telemetry baselines as `baseline.json` | Same dependency as KB; use `atomicWriteJson()` for baseline files instead |

**Integration point:** New `get-shit-done/bin/lib/telemetry.cjs` module. Router adds `case 'telemetry':` to gsd-tools.cjs. Data resolution: `os.homedir() + '/.claude/usage-data/session-meta/'` for session-meta (268 files); `os.homedir() + '/.claude/usage-data/facets/'` for facets (109 files). Project filtering via `session_meta.project_path` matched against `resolveWorktreeRoot(cwd)`.

**JSONL parsing:** No library needed. Session-meta files are standard JSON (`.json` extension, not line-delimited). Facets files are also `.json`. The Codex JSONL session logs (`~/.codex/sessions/YYYY/MM/DD/*.jsonl`) are newline-delimited JSON — parsed with `line.split('\n').filter(Boolean).map(JSON.parse)`. This is identical to how the existing audit fingerprint script works and requires no library.

**Baseline file format:** `atomicWriteJson()` writes `.planning/telemetry-baseline.json` — a plain JSON file with computed distributions. No SQLite needed for this; the baseline is computed once and stored as a static artifact.

**Cross-platform normalization:** The telemetry module implements the common schema from measurement-infrastructure-research.md Section 8. Codex token fields (`reasoning_output_tokens`, `cached_input_tokens`) are nullable; Claude Code fields (`user_interruptions`) are nullable on Codex. The schema is forward-compatible — new fields added with null defaults as runtimes expose more data.

**Codex SQLite integration:** For Codex session discovery, the module queries `~/.codex/state_5.sqlite` using `node:sqlite` (same dependency) to get `rollout_path`, `cwd`, `tokens_used`, `created_at`. This is strictly cleaner than filesystem scanning for Codex.

### New Capability: Cross-Runtime Format Adapters

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| `node:fs`, `node:path` (built-in) | Node built-in | File comparison, hash computation for patch sensor | Already in install.js |
| `node:crypto` (built-in) | Node built-in | SHA256 content hashing for change detection | Existing `saveLocalPatches()` uses crypto already |

**Integration point:** New `gsd-tools distribution-check` subcommand (or extend `manifest`) in gsd-tools.cjs. Extends the existing `saveLocalPatches()` and manifest comparison logic from `bin/install.js` into a queryable CLI tool.

**Log sensor adapter:** The cross-runtime adapter for the log sensor is implemented in the sensor agent spec (`agents/gsd-log-sensor.md`), not in gsd-tools.cjs. The adapter logic is Python (the existing `extract-session-fingerprints.py` script pattern), operating as a standalone tool invoked by the sensor agent. Two adapter functions: `extractClaudeFingerprint()` and `extractCodexFingerprint()` producing a common fingerprint schema. This is not bundled in the npm package — it is part of the agent spec's tooling.

**Post-install cross-runtime verification:** Add `checkCrossRuntimeParity()` to `bin/install.js` (the installer, not gsd-tools.cjs). After successful installation to one runtime, check if other runtimes are installed and compare versions. Uses existing `loadManifest()` and file hash comparison from install.js. No new dependencies.

### New Capability: Spike Methodology Structural Enforcement

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Markdown templates (built-in) | N/A | Updated DESIGN.md template with auxiliary hypothesis register, programme declaration | No new tooling — structural enforcement is template + agent spec changes |
| gsd-tools.cjs (existing) | N/A | `spike` subcommand extensions | Extends existing `run-spike` workflow command routing |

**Integration point:** Spike structural enforcement is primarily **workflow and template changes**, not new library dependencies. The spike design reviewer is a new agent spec (`agents/gsd-spike-design-reviewer.md`). The `run-spike.md` workflow adds a mandatory design review step before execution. The DECISION.md template gains `decided/provisional/deferred` outcome types.

**Programme infrastructure:** A new `PROGRAMME.md` file format (alongside existing spike `DESIGN.md`, `FINDINGS.md`, `DECISION.md`). Stored in `.planning/spikes/programme-{slug}/`. No gsd-tools parsing needed — agents read these directly as Markdown context. The `spike` subcommand in gsd-tools.cjs may add `gsd-tools spike list-programmes` and `gsd-tools spike programme-status <name>` for structured querying, but this uses `extractFrontmatter()` from frontmatter.cjs (already exists).

**Confidence framework:** Three-level confidence (measurement/interpretation/extrapolation) is enforced by the spike design reviewer agent checking DESIGN.md and DECISION.md content. No new parsing infrastructure needed — the reviewer reads the Markdown directly.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| SQLite binding | `node:sqlite` (built-in) | `better-sqlite3` (npm) | Requires native compilation; C extension breaks on Node version mismatches; violates zero-dependency philosophy; node:sqlite is synchronous, same API surface, and zero install overhead |
| SQLite binding | `node:sqlite` (built-in) | Shell `sqlite3` CLI | Works but requires parsing CLI output; no parameterized queries; injection risk; slower for bulk operations; `node:sqlite` is strictly better on Node 22+ |
| SQLite binding | `node:sqlite` (built-in) | `sql.js` (pure JS, npm) | npm dependency; larger bundle; async API requires architectural change; unnecessary when built-in is available |
| YAML parsing | Custom parser in frontmatter.cjs | `js-yaml` (npm) | Existing frontmatter.cjs handles signal file YAML schema adequately; `js-yaml` is npm dependency for no gain at current schema complexity; if schema grows substantially, reconsider in v1.21 |
| Token extraction | Native `telemetry.cjs` module | `ccusage` (npm, external) | ccusage reads different data paths (`~/.claude/projects/` JSONL) vs session-meta (`~/.claude/usage-data/`); no GSD phase correlation; no facets integration; npm dependency; would need wrapper that duplicates work |
| JSONL parsing | Inline `split/parse` | `ndjson` (npm) | JSONL is trivially parsed with `line.split('\n').filter(Boolean).map(JSON.parse)`; npm dependency for 5 lines of code is not justified |
| Log sensor adapters | Python script (standalone audit tool) | Node.js in gsd-tools.cjs | Python fingerprint extraction script already exists and works; the adapter pattern keeps runtime-specific parsing close to the agent spec tooling; bundling Python in the npm package is not feasible |
| State conflict resolution | Per-worktree JSON files (Approach 1) | Append-only event log (Approach 4) | Approach 4 is architecturally superior but requires rewriting all `writeStateMd()` callers; Approach 1 uses existing `resolveWorktreeRoot()` and `atomicWriteJson()` from core.cjs; v1.20 scope, not v1.21 event-sourcing rewrite |
| MCP server (KB) | Deferred to v1.21 | Build now | MCP server is a thin wrapper once CLI functions exist; building CLI-first validates the query API; operational overhead (process management, per-machine config) unjustified for 199-entry KB; CLI works offline without configuration |

---

## Node.js Version Constraint

**Current:** `package.json` engines: `"node": ">=16.7.0"`

**Required for v1.20:** `"node": ">=22.5.0"` — `node:sqlite` was added in Node 22.5.0 as an experimental built-in.

**Rationale for updating the constraint:** Both primary machines (Dionysus: 22.22.1, Apollo: likely Node 22+ LTS as of April 2026) satisfy this. Node 22 became LTS in October 2024. The `kb` subcommand is a new feature — users on Node <22.5 can continue using all existing gsd-tools subcommands; only `kb` and `telemetry` (for the Codex SQLite query path) require the newer Node. A version guard in `kb.cjs` that prints a clear error (`"node:sqlite requires Node >=22.5.0; run: nvm install 22"`) is more helpful than silently failing.

**Alternative:** If the package must remain installable on Node 16-21, add a version guard in `kb.cjs` that falls back to the `sqlite3` CLI via `execSync('sqlite3 ...')`. This is the graceful degradation path. The shell CLI fallback has worse parameterization ergonomics but covers the compatibility gap. Recommended approach: implement the `node:sqlite` path first (it is cleaner), add the shell fallback only if a downstream user reports Node version issues.

---

## Module Architecture

New modules follow the established pattern exactly:

```
get-shit-done/bin/lib/
  kb.cjs           -- NEW: SQLite KB index (requires node:sqlite)
  telemetry.cjs    -- NEW: session-meta + facets extraction
  [existing 16 modules unchanged]
```

Router additions to `gsd-tools.cjs`:

```javascript
// New requires at top (after existing requires)
const kb = require('./lib/kb.cjs');
const telemetry = require('./lib/telemetry.cjs');

// New cases in switch statement
case 'kb': {
  // subcommands: rebuild, query, search, stats, health, transition, link
  break;
}
case 'telemetry': {
  // subcommands: summary, session, phase, baseline, enrich
  break;
}
```

Installer additions:
- `checkCrossRuntimeParity()` function in `bin/install.js` (called post-install)
- No new files in the npm package root

Test additions:
- `tests/unit/kb.test.js` — vitest, follows sensors.test.js pattern
- `tests/unit/telemetry.test.js` — vitest
- `tests/integration/kb-infrastructure.test.js` — already referenced in package.json scripts, add full coverage

---

## Supporting Libraries (Existing, No Changes)

| Library | Type | Purpose | Used By |
|---------|------|---------|---------|
| `node:fs`, `node:path`, `node:os`, `node:crypto` | Built-in | File I/O, path resolution, home dir, hashing | All new modules |
| `node:child_process` | Built-in | Shell fallback for sqlite3 CLI if needed | kb.cjs fallback path |
| `vitest` | devDependency | Test runner (628 existing tests) | All new unit tests |

---

## Installation

No new npm packages required for the recommended stack.

```bash
# No new dependencies to install
npm test  # verify existing 628 tests still pass
node bin/install.js --local  # reinstall with new subcommands
```

For the node:sqlite version guard verification:

```bash
node -e "const [maj, min] = process.versions.node.split('.').map(Number); if (maj < 22 || (maj === 22 && min < 5)) { console.error('node:sqlite requires Node >=22.5.0; current:', process.versions.node); process.exit(1); } console.log('Node version OK:', process.versions.node);"
```

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| `node:sqlite` for KB index | HIGH | Live-tested FTS5, prepared statements, transactions on Node 22.22.1 on this machine |
| Telemetry module (session-meta) | HIGH | Schema documented from actual files; integration points verified against gsd-tools.cjs source |
| Telemetry module (facets) | HIGH | Schema documented from actual files; previously uninventoried, now confirmed |
| JSONL parsing inline | HIGH | Trivially implemented; used in existing audit scripts |
| Codex SQLite query path | HIGH | `state_5.sqlite` schema confirmed from direct inspection; `node:sqlite` handles it |
| node:sqlite ExperimentalWarning | HIGH | Confirmed it is stderr only; `--no-warnings` suppresses it; functionality unaffected |
| Node >=22.5.0 constraint | MEDIUM-HIGH | Both primary machines satisfy; Apollo version not directly confirmed (inferred from LTS adoption timeline) |
| Per-worktree state approach | MEDIUM | Design uses existing infrastructure (`resolveWorktreeRoot`, `atomicWriteJson`); untested in practice for parallel execution |
| Spike template enforcement | MEDIUM | Template and agent spec changes are low-risk; whether design reviewer catches real issues depends on agent quality, not infrastructure |

---

## Sources

**Live verification (Dionysus, 2026-04-08):**
- `node:sqlite` FTS5 test: confirmed working, Node 22.22.1
- `node:sqlite` prepared statement API: `all()`, `get()`, `iterate()`, `run()` confirmed
- `node:sqlite` transaction via `exec('BEGIN; ...; COMMIT;')`: confirmed working
- Session-meta schema: documented from `~/.claude/usage-data/session-meta/*.json` (268 files)
- Facets schema: documented from `~/.claude/usage-data/facets/*.json` (109 files)
- Codex `state_5.sqlite` threads schema: confirmed from direct `sqlite3` inspection
- gsd-tools.cjs command registry: 30+ case branches confirmed in router

**Custom research (all 2026-04-08):**
- `.planning/research/kb-architecture-research.md` — SQLite schema design, Option C recommendation
- `.planning/research/measurement-infrastructure-research.md` — telemetry module design, session-meta/facets schema
- `.planning/research/cross-runtime-parity-research.md` — log sensor adapter pattern, patch sensor, Codex SQLite
- `.planning/research/spike-methodology-gap-analysis.md` — 11 gaps driving workflow/template changes

**Ecosystem references:**
- Node.js 22 sqlite docs: https://nodejs.org/api/sqlite.html (experimental, stable in behavior as of 22.22.1)
- Node.js 22 release notes: https://nodejs.org/en/blog/release/v22.5.0 (sqlite added)
- MarkdownDB pattern: https://github.com/datopian/markdowndb (File+SQLite validated pattern)
