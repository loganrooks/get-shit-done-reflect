# Phase 56: KB Schema & SQLite Foundation - Research

**Researched:** 2026-04-08
**Domain:** SQLite indexing of YAML-frontmatter markdown knowledge base via node:sqlite
**Confidence:** HIGH

## Summary

Phase 56 creates the data substrate for a queryable knowledge base: signal schema evolution (lifecycle, polarity, disposition, qualification links), a SQLite index built from 199 signal/spike files via Node.js's built-in `node:sqlite` module, and migration tooling for the `source` field split. The technical approach is well-validated -- `node:sqlite` is confirmed working on this machine (Node v22.22.1) with FTS5, WAL mode, and foreign key constraint support all verified empirically. The existing `extractFrontmatter()` function in `frontmatter.cjs` handles all signal file variants, making the SQLite rebuild a straightforward ETL pipeline from parsed frontmatter into normalized tables.

The critical finding is the lifecycle state model conflict between KB-01's requirements text (`proposed/in_progress/blocked/verified/remediated`) and the Phase 31 implementation (`detected/triaged/remediated/verified/invalidated`). Research confirms the Phase 31 model is correct -- it was explicitly designed for signal lifecycle semantics, is already implemented in 120 signal files, and is referenced by the reflector, reconcile scripts, and knowledge-store.md v2.0.0 spec. KB-01's states read like task/issue lifecycle states, not signal lifecycle states. The recommendation is to update REQUIREMENTS.md to align KB-01 with the Phase 31 model, potentially adding `blocked` as a new state.

The corpus analysis reveals significant schema diversity: 4 distinct schema generations across 199 files, with `source` field values including `auto`, `manual`, `automated`, `deliberation-trigger`, `auto-collected`, and even plan summary references. The migration script must handle all these variants. The `kb rebuild` command must apply sensible defaults for missing fields without modifying source files.

**Primary recommendation:** Build kb.cjs as a new lib module following the state.cjs/sensors.cjs pattern. Use `node:sqlite` DatabaseSync with WAL mode. Reuse `extractFrontmatter()` from frontmatter.cjs for parsing. Apply defaults at index-build time, not via file modification.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Lifecycle state model** [open -- critical conflict]: KB-01 specifies proposed/in_progress/blocked/verified/remediated. Existing implementation uses detected/triaged/remediated/verified/invalidated. Working assumption: Phase 31 model is correct. Researcher must verify (see Resolved Questions below).

**Schema field evolution** [grounded]: Current canonical schema is knowledge-store.md v2.0.0. New fields: response_disposition (KB-02), qualified_by/superseded_by (KB-03), detection_method + origin from source split (KB-09).

**SQLite module structure** [grounded]: New module at get-shit-done/bin/lib/kb.cjs. Uses node:sqlite (Node >=22.5.0). Schema from kb-architecture-research.md.

**Migration strategy** [grounded]: kb rebuild handles missing fields by applying defaults at index-build time. Separate kb migrate script resolves source -> detection_method + origin by modifying files.

**Node version requirement** [grounded]: package.json engines.node updated to >=22.5.0. kb.cjs includes version guard.

**Dual-write invariant foundation** [grounded]: SQLite is derived cache, files remain source of truth. kb.db can be deleted and rebuilt at any time.

### Claude's Discretion

- SQLite table naming and exact column types
- Whether to use WAL mode or default journal mode
- kb rebuild CLI output format
- kb stats output format
- Index creation strategy (CREATE INDEX vs rebuild-time computation)
- Whether to parse signal body markdown into separate content field or just store file_path

### Deferred Ideas (OUT OF SCOPE)

- FTS5 full-text search (KB-04b) -- Phase 59
- Relationship traversal (KB-04c) -- Phase 59
- Lifecycle transition command (KB-06b) -- Phase 59
- Agent KB retrieval (KB-08) -- Phase 59
- MCP server for KB -- v1.21
- Signal/issue ontology merge -- v1.21

</user_constraints>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:sqlite` (DatabaseSync) | Built-in (Node 22.5+) | SQLite database access | Zero-dependency, synchronous API matches gsd-tools patterns, built into Node.js |
| `extractFrontmatter()` | In-tree (frontmatter.cjs) | YAML frontmatter parsing | Already handles all signal file variants including legacy formats |
| `reconstructFrontmatter()` | In-tree (frontmatter.cjs) | YAML frontmatter serialization | Needed by `kb migrate` to rewrite source field in signal files |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:fs` | Built-in | File system operations | Reading signal files, writing kb.db |
| `node:path` | Built-in | Path manipulation | Signal file discovery, db path resolution |
| `node:crypto` | Built-in | Content hashing | SHA-256 hash of file content for change detection |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `node:sqlite` | `better-sqlite3` (npm) | better-sqlite3 is mature with broader API, but adds npm dependency; node:sqlite is zero-dependency and sufficient for this use case |
| `node:sqlite` | Shell `sqlite3` command | Would require spawning processes, no structured data return, fragile parsing |
| Custom YAML parsing | `js-yaml` (npm) | Would add dependency; extractFrontmatter() already handles our subset of YAML correctly |

**Installation:** No new dependencies needed. `node:sqlite` is built into Node.js >=22.5.0.

## Architecture Patterns

### Recommended Module Structure

```
get-shit-done/bin/lib/
  kb.cjs               # New module -- SQLite index operations
get-shit-done/bin/
  gsd-tools.cjs        # Router -- adds 'kb' case to switch
```

### Pattern 1: Lib Module with Command Functions

**What:** Follow the established gsd-tools pattern where each domain gets a lib module exporting `cmd*` functions that gsd-tools.cjs routes to.

**When to use:** Always -- this is the project's standard pattern for all command groups.

**Example:**

```javascript
// kb.cjs -- follows state.cjs / sensors.cjs pattern
const { DatabaseSync } = require('node:sqlite');
const { extractFrontmatter } = require('./frontmatter.cjs');
const { output, error, planningPaths } = require('./core.cjs');

function getKbDir(cwd) {
  // Project-local primary, user-global fallback
  const localKb = path.join(planningPaths(cwd).planning, 'knowledge');
  if (fs.existsSync(localKb)) return localKb;
  const globalKb = path.join(process.env.GSD_HOME || path.join(os.homedir(), '.gsd'), 'knowledge');
  return globalKb;
}

function getDbPath(cwd) {
  return path.join(getKbDir(cwd), 'kb.db');
}

function cmdKbRebuild(cwd, raw) { /* ... */ }
function cmdKbStats(cwd, raw) { /* ... */ }
function cmdKbMigrate(cwd, raw) { /* ... */ }

module.exports = { cmdKbRebuild, cmdKbStats, cmdKbMigrate };
```

```javascript
// gsd-tools.cjs -- router addition
case 'kb': {
  const subcommand = args[1];
  if (subcommand === 'rebuild') {
    kb.cmdKbRebuild(cwd, raw);
  } else if (subcommand === 'stats') {
    kb.cmdKbStats(cwd, raw);
  } else if (subcommand === 'migrate') {
    kb.cmdKbMigrate(cwd, raw);
  } else {
    error('Usage: gsd-tools kb <rebuild|stats|migrate>');
  }
  break;
}
```

### Pattern 2: SQLite Database Initialization with Schema

**What:** Create database with schema on first access, use WAL mode for better concurrent read performance, enable foreign key constraints.

**When to use:** Every time the database is opened or created.

**Example:**

```javascript
// Verified working on Node v22.22.1 (this machine)
const { DatabaseSync } = require('node:sqlite');

function openKbDb(dbPath) {
  const db = new DatabaseSync(dbPath, {
    enableForeignKeyConstraints: true
  });
  db.exec('PRAGMA journal_mode=WAL');
  db.exec('PRAGMA busy_timeout=5000');
  initSchema(db);
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS signals (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      project TEXT NOT NULL DEFAULT '',
      severity TEXT NOT NULL DEFAULT 'minor',
      lifecycle_state TEXT DEFAULT 'detected',
      polarity TEXT DEFAULT 'negative',
      signal_category TEXT DEFAULT 'negative',
      disposition TEXT DEFAULT '',
      signal_type TEXT DEFAULT '',
      detection_method TEXT DEFAULT '',
      origin TEXT DEFAULT '',
      created TEXT NOT NULL DEFAULT '',
      updated TEXT DEFAULT '',
      phase TEXT DEFAULT '',
      plan TEXT DEFAULT '',
      runtime TEXT DEFAULT '',
      model TEXT DEFAULT '',
      gsd_version TEXT DEFAULT '',
      occurrence_count INTEGER DEFAULT 1,
      durability TEXT DEFAULT '',
      confidence TEXT DEFAULT 'medium',
      status TEXT DEFAULT 'active',
      content_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS signal_tags (
      signal_id TEXT NOT NULL REFERENCES signals(id),
      tag TEXT NOT NULL,
      PRIMARY KEY (signal_id, tag)
    );

    CREATE TABLE IF NOT EXISTS signal_links (
      source_id TEXT NOT NULL REFERENCES signals(id),
      target_id TEXT NOT NULL,
      link_type TEXT NOT NULL,
      PRIMARY KEY (source_id, target_id, link_type)
    );

    CREATE TABLE IF NOT EXISTS spikes (
      id TEXT PRIMARY KEY,
      file_path TEXT NOT NULL,
      project TEXT DEFAULT '',
      hypothesis TEXT DEFAULT '',
      outcome TEXT DEFAULT '',
      created TEXT DEFAULT '',
      updated TEXT DEFAULT '',
      status TEXT DEFAULT 'active',
      content_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS spike_tags (
      spike_id TEXT NOT NULL REFERENCES spikes(id),
      tag TEXT NOT NULL,
      PRIMARY KEY (spike_id, tag)
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
```

### Pattern 3: Node Version Guard

**What:** Fail fast with actionable error message when node:sqlite is unavailable.

**When to use:** At module load time in kb.cjs.

**Example:**

```javascript
// At top of kb.cjs -- fail fast with clear message
let DatabaseSync;
try {
  ({ DatabaseSync } = require('node:sqlite'));
} catch (e) {
  // Module-level guard -- only fires when kb commands are actually loaded
  const nodeVersion = process.version;
  console.error(
    `Error: node:sqlite requires Node.js >= 22.5.0 (current: ${nodeVersion})\n` +
    'The KB commands need the built-in SQLite module.\n' +
    'Upgrade Node.js: https://nodejs.org/en/download\n' +
    'Or use nvm: nvm install 22 && nvm use 22'
  );
  process.exit(1);
}
```

### Pattern 4: Signal File Discovery

**What:** Find all signal and spike files across both project-scoped and root-level directories.

**When to use:** During `kb rebuild` to collect all files for indexing.

**Example:**

```javascript
function discoverSignalFiles(kbDir) {
  const signalsDir = path.join(kbDir, 'signals');
  const files = [];
  if (!fs.existsSync(signalsDir)) return files;

  // Walk recursively -- handles both:
  //   signals/get-shit-done-reflect/*.md (project-scoped)
  //   signals/sig-*.md (root-level legacy)
  //   signals/*.md (root-level legacy without sig- prefix)
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name));
      } else if (entry.name.endsWith('.md')) {
        files.push(path.join(dir, entry.name));
      }
    }
  }
  walk(signalsDir);
  return files;
}
```

### Pattern 5: Rebuild with Content Hashing

**What:** Use SHA-256 content hashes to detect changed files. Store hash in SQLite. On rebuild, skip files whose hash has not changed.

**When to use:** `kb rebuild` to enable incremental rebuilds.

**Example:**

```javascript
const crypto = require('node:crypto');

function contentHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

function rebuildIndex(db, kbDir) {
  const files = discoverSignalFiles(kbDir);
  let added = 0, updated = 0, skipped = 0, errors = 0;

  const existingStmt = db.prepare('SELECT content_hash FROM signals WHERE file_path = ?');
  const insertStmt = db.prepare('INSERT OR REPLACE INTO signals (...) VALUES (...)');
  // ... transaction wrapping for performance
  db.exec('BEGIN TRANSACTION');
  try {
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const hash = contentHash(content);
      const relPath = path.relative(kbDir, filePath);
      const existing = existingStmt.get(relPath);
      if (existing && existing.content_hash === hash) {
        skipped++;
        continue;
      }
      const fm = extractFrontmatter(content);
      // ... map frontmatter to columns with defaults ...
      // ... insertStmt.run(...) ...
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
  return { added, updated, skipped, errors };
}
```

### Anti-Patterns to Avoid

- **Modifying source files during rebuild:** `kb rebuild` must NEVER write to .md files. It only reads files and writes to SQLite. File modification is the exclusive domain of `kb migrate`.
- **Crashing on malformed signals:** The corpus has 4 distinct schema generations. Parse failures must produce warnings and continue, not abort the entire rebuild.
- **Treating SQLite as source of truth:** Every piece of data in kb.db must be derivable from the .md files. Never store data exclusively in SQLite.
- **Using async SQLite APIs:** gsd-tools.cjs is entirely synchronous. `node:sqlite` provides `DatabaseSync` which matches this pattern. Do not mix in async patterns.
- **Hardcoding KB path:** Always resolve via getKbDir() with project-local primary, user-global fallback -- same pattern as kb-rebuild-index.sh.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom YAML parser | `extractFrontmatter()` from frontmatter.cjs | Already handles all signal variants including legacy SIG-format, nested objects, quoted arrays |
| YAML frontmatter serialization | String concatenation | `reconstructFrontmatter()` from frontmatter.cjs | Handles quoting rules for colons, hashes; preserves roundtrip stability |
| SQLite database access | Shell sqlite3 commands | `node:sqlite` DatabaseSync | Structured data, no process spawning, type-safe parameter binding |
| Content hashing | Custom hash or file mtime | `node:crypto` SHA-256 | Platform-independent, collision-resistant, ignores filesystem time quirks |
| File discovery | Shell find command | `fs.readdirSync` recursive walk | Cross-platform, no process spawning, returns structured data |

**Key insight:** The existing frontmatter.cjs module already solves the hardest parsing problem. The kb.cjs module is fundamentally a mapper from extractFrontmatter() output to SQLite INSERT statements with default handling.

## Common Pitfalls

### Pitfall 1: Schema Diversity Across 4 Signal Generations

**What goes wrong:** Assuming all 199 signals follow the same schema. They do not.

**Why it happens:** Signals span from legacy SIG-format (pre-v1.14) through Phase 31 schema (v1.16+) to the latest enriched signals.

**How to avoid:** Map every field with explicit defaults. Never crash on missing fields.

**Warning signs:** If `kb rebuild` produces fewer than 194 project-scoped signals + 5 root-level signals, something is being silently dropped.

**Corpus analysis (verified 2026-04-08):**

| Schema Generation | Count | Characteristics |
|-------------------|-------|-----------------|
| Legacy SIG-format | ~15 | `SIG-260222-*` IDs, `type: observation/architecture/deviation/etc`, `status: open/resolved`, `severity: medium/high`, no lifecycle_state |
| Early standard | ~64 | `type: signal`, `source: manual/auto`, no lifecycle_state, no signal_category |
| Phase 31 enriched | ~120 | Has lifecycle_state, lifecycle_log, evidence, confidence, triage, signal_category, remediation, verification |
| Latest (April 2026) | ~1 | Has response_disposition, different body structure |

**source field values in corpus:**

| Value | Count | Migration Target |
|-------|-------|-----------------|
| `auto` | 107 | detection_method: automated, origin: collect-signals |
| `manual` | 55 | detection_method: manual, origin: user-observation |
| `automated` | 12 | detection_method: automated, origin: collect-signals |
| `deliberation-trigger` | 4 | detection_method: manual, origin: deliberation-trigger |
| `auto-collected` | 1 | detection_method: automated, origin: collect-signals |
| Plan summary refs | 4 | detection_method: automated, origin: plan-summary |
| (absent) | ~16 | detection_method: unknown, origin: unknown |

**type field values in corpus (affects signal detection):**

| Value | Count | Is Valid Signal? |
|-------|-------|-----------------|
| `signal` | 177 | Yes -- standard |
| `observation` | 4 | Yes -- legacy name for signal |
| `architecture` | 6 | Yes -- legacy signal_type used as type |
| `positive-pattern` / `positive_pattern` | 5 | Yes -- legacy signal_category used as type |
| `deviation` / `struggle` / etc | 6 | Yes -- legacy signal_type used as type |
| `capability-gap` / `config-mismatch` | 2 | Yes -- legacy signal_type used as type |

### Pitfall 2: Lifecycle State Model Conflict

**What goes wrong:** Implementing KB-01 as written (proposed/in_progress/blocked) when the entire codebase uses Phase 31 states (detected/triaged/remediated/verified/invalidated).

**Why it happens:** REQUIREMENTS.md KB-01 was drafted with task/issue lifecycle semantics rather than signal lifecycle semantics.

**How to avoid:** Use Phase 31 states. Update REQUIREMENTS.md before implementation.

**Warning signs:** Any code referencing `proposed` or `in_progress` as lifecycle states for signals.

**Evidence for Phase 31 model being correct:**
1. knowledge-store.md v2.0.0 defines: detected/triaged/remediated/verified/invalidated
2. 120 signals already have `lifecycle_state: detected` (105), `triaged` (8), or `remediated` (7)
3. Phase 31 CONTEXT.md explicitly designed the four-state model with invalidation as terminal
4. Reflector, reconcile-signal-lifecycle.sh, and collect-signals workflow all reference these states
5. MILESTONE-CONTEXT.md's "proposed/in_progress" states read like issue/task states, not signal observations

**Resolution:** Update KB-01 to `detected -> triaged -> remediated -> verified -> invalidated` with `blocked` as optional additional state per CONTEXT.md.

### Pitfall 3: node:sqlite Experimental Warning

**What goes wrong:** Tests or CI fail due to ExperimentalWarning output on stderr.

**Why it happens:** `node:sqlite` emits `(node:PID) ExperimentalWarning: SQLite is an experimental feature and might change at any time` to stderr.

**How to avoid:** In tests, suppress with `NODE_OPTIONS='--no-warnings'` or accept the warning in stderr capture. In production code, the warning is harmless. Document the experimental status in CHANGELOG.

**Warning signs:** Test assertions on stderr output failing due to unexpected warning text.

### Pitfall 4: status Field Semantic Overload

**What goes wrong:** Conflating `status` (active/archived/open/resolved/remediated) with `lifecycle_state` (detected/triaged/remediated/verified/invalidated) during indexing.

**Why it happens:** Legacy signals use `status: open`, `status: resolved`, `status: remediated`, `status: detected` -- values that belong in lifecycle_state.

**How to avoid:** During rebuild, normalize: `status: open/active` -> `status: active`. `status: resolved/remediated` -> `status: active, lifecycle_state: remediated`. `status: detected` -> `status: active, lifecycle_state: detected`. Only `archived` status actually means archived.

**Warning signs:** Signals with `status: remediated` being excluded from the index because rebuild treats it as a non-standard status.

### Pitfall 5: Transaction Wrapping for Performance

**What goes wrong:** 199 individual INSERT statements without a transaction take 10-50x longer than necessary.

**Why it happens:** SQLite commits after each statement by default, causing disk sync on each INSERT.

**How to avoid:** Wrap the entire rebuild in BEGIN TRANSACTION / COMMIT. Use INSERT OR REPLACE for idempotency.

**Warning signs:** `kb rebuild` taking more than 2 seconds for 199 files.

### Pitfall 6: Root-Level vs Project-Scoped Signal Discovery

**What goes wrong:** Missing the 5 root-level signals at `.planning/knowledge/signals/sig-*.md` and `.planning/knowledge/signals/*.md` (without sig- prefix).

**Why it happens:** Code assumes all signals are under project subdirectories.

**How to avoid:** Walk the signals directory recursively -- any .md file under signals/ is a candidate. Derive project from frontmatter `project` field, not from directory structure.

**Warning signs:** `kb rebuild` reports fewer than 199 entries.

### Pitfall 7: Lazy require() of node:sqlite

**What goes wrong:** Requiring node:sqlite at module top level causes the entire gsd-tools.cjs to fail on Node <22.5.0, even for commands that don't use KB.

**Why it happens:** gsd-tools.cjs requires all lib modules at startup (lines 38-52).

**How to avoid:** Use lazy require inside kb.cjs -- only import node:sqlite when a kb command is actually invoked. Or use a try/catch guard at module level that sets a flag.

**Warning signs:** `gsd-tools state load` failing on Node 18 with "Cannot find module 'node:sqlite'" even though KB commands aren't being used.

## Code Examples

### Verified: node:sqlite DatabaseSync Basic Operations

```javascript
// Source: Verified on Node v22.22.1 (this machine, 2026-04-08)
const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA journal_mode=WAL'); // Returns: { journal_mode: 'wal' }

// Create table
db.exec(`CREATE TABLE signals (id TEXT PRIMARY KEY, project TEXT)`);

// Prepared statement INSERT
const insert = db.prepare('INSERT INTO signals (id, project) VALUES (?, ?)');
const result = insert.run('sig-2026-01-01-test', 'my-project');
// result = { changes: 1, lastInsertRowid: 1 }

// Query
const query = db.prepare('SELECT * FROM signals WHERE id = ?');
const row = query.get('sig-2026-01-01-test');
// row = { id: 'sig-2026-01-01-test', project: 'my-project' }

const all = db.prepare('SELECT * FROM signals');
const rows = all.all();
// rows = [{ id: '...', project: '...' }]

db.close();
```

### Verified: FTS5 Virtual Table

```javascript
// Source: Verified on Node v22.22.1 (this machine, 2026-04-08)
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:');

db.exec('CREATE VIRTUAL TABLE signal_fts USING fts5(id, body)');
db.prepare("INSERT INTO signal_fts VALUES (?, ?)").run('sig-001', 'plan accuracy failure');
const results = db.prepare("SELECT * FROM signal_fts WHERE signal_fts MATCH 'accuracy'").all();
// results = [{ id: 'sig-001', body: 'plan accuracy failure' }]
```

Note: FTS5 table creation is deferred to Phase 59 per CONTEXT.md, but the schema reservation (CREATE TABLE IF NOT EXISTS) can be included now to avoid migration later.

### Verified: Foreign Key Constraints

```javascript
// Source: Verified on Node v22.22.1 (this machine, 2026-04-08)
const { DatabaseSync } = require('node:sqlite');
const db = new DatabaseSync(':memory:', { enableForeignKeyConstraints: true });

db.exec('CREATE TABLE signals (id TEXT PRIMARY KEY)');
db.exec('CREATE TABLE signal_tags (signal_id TEXT REFERENCES signals(id), tag TEXT)');

// This throws: FOREIGN KEY constraint failed
db.prepare('INSERT INTO signal_tags VALUES (?, ?)').run('nonexistent', 'tag');
```

### Frontmatter to SQLite Column Mapping with Defaults

```javascript
// Source: Derived from corpus analysis (2026-04-08)
function signalToRow(fm, filePath, hash) {
  return {
    id: fm.id || path.basename(filePath, '.md'),
    file_path: filePath,
    project: fm.project || '',
    severity: normalizeSeverity(fm.severity),
    lifecycle_state: fm.lifecycle_state || normalizeLifecycleFromStatus(fm.status),
    polarity: fm.polarity || 'negative',
    signal_category: fm.signal_category || (fm.polarity === 'positive' ? 'positive' : 'negative'),
    disposition: fm.response_disposition || fm.disposition || '',
    signal_type: normalizeSignalType(fm),
    detection_method: fm.detection_method || mapSourceToDetectionMethod(fm.source),
    origin: fm.origin || mapSourceToOrigin(fm.source),
    created: fm.created || fm.date || '',
    updated: fm.updated || fm.created || '',
    phase: String(fm.phase || ''),
    plan: String(fm.plan || ''),
    runtime: fm.runtime || '',
    model: fm.model || '',
    gsd_version: fm.gsd_version || '',
    occurrence_count: parseInt(fm.occurrence_count, 10) || 1,
    durability: fm.durability || '',
    confidence: fm.confidence || 'medium',
    status: normalizeStatus(fm.status),
    content_hash: hash
  };
}

function normalizeSeverity(sev) {
  const map = { high: 'critical', medium: 'notable', low: 'minor' };
  return map[sev] || sev || 'minor';
}

function normalizeStatus(status) {
  // Legacy values: open, resolved, remediated, detected -> all mean active
  if (!status || status === 'open' || status === 'resolved' ||
      status === 'remediated' || status === 'detected') return 'active';
  return status; // active, archived
}

function normalizeLifecycleFromStatus(status) {
  // If no lifecycle_state but status hints at lifecycle
  if (status === 'remediated' || status === 'resolved') return 'remediated';
  return 'detected';
}

function normalizeSignalType(fm) {
  // Legacy signals put signal_type values in the type field
  if (fm.signal_type) return fm.signal_type;
  const legacyTypeMap = {
    'observation': 'deviation',
    'architecture': 'capability-gap',
    'positive-pattern': 'good-pattern',
    'positive_pattern': 'good-pattern',
    'deviation': 'deviation',
    'struggle': 'struggle',
    'config-mismatch': 'config-mismatch',
    'capability-gap': 'capability-gap',
    'process-gap': 'capability-gap'
  };
  if (fm.type !== 'signal' && legacyTypeMap[fm.type]) return legacyTypeMap[fm.type];
  return '';
}

function mapSourceToDetectionMethod(source) {
  if (!source) return 'unknown';
  if (source === 'manual') return 'manual';
  if (source === 'auto' || source === 'automated' || source === 'auto-collected') return 'automated';
  if (source === 'deliberation-trigger') return 'manual';
  if (source.includes('SUMMARY.md') || source.includes('PLAN.md')) return 'automated';
  return 'unknown';
}

function mapSourceToOrigin(source) {
  if (!source) return 'unknown';
  if (source === 'manual') return 'user-observation';
  if (source === 'auto' || source === 'automated' || source === 'auto-collected') return 'collect-signals';
  if (source === 'deliberation-trigger') return 'deliberation-trigger';
  if (source.includes('SUMMARY.md') || source.includes('PLAN.md')) return 'plan-summary';
  return 'unknown';
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Shell grep on index.md | SQLite queries on kb.db | This phase (56) | O(1) indexed queries vs O(n) line scanning |
| kb-rebuild-index.sh (bash) | gsd-tools kb rebuild (Node.js) | This phase (56) | Structured parsing via extractFrontmatter vs fragile grep |
| `source: auto/manual` | `detection_method` + `origin` (two fields) | This phase (56) | Resolves naming collision documented in kb-architecture-research.md |
| `--experimental-sqlite` flag required | No flag needed | Node v22.13.0 | node:sqlite can be used without CLI flags |
| `better-sqlite3` (npm) | `node:sqlite` (built-in) | Node v22.5.0 | Zero-dependency SQLite access |

**Deprecated/outdated:**
- kb-rebuild-index.sh: Will be superseded by `gsd-tools kb rebuild` but remains functional for backward compatibility per kb-architecture-research.md
- `source` field (single field): Being split into `detection_method` + `origin` via migration script

## Discretion Recommendations

For the areas marked as Claude's discretion in CONTEXT.md:

**WAL mode: USE IT.** Verified working on this machine. Better read concurrency (agents can query while another process writes). No downside for this use case. Single PRAGMA at database open.

**Table naming:** Use the exact names from kb-architecture-research.md schema sketch (`signals`, `signal_tags`, `signal_links`, `spikes`, `spike_tags`). Add a `meta` table for rebuild metadata (last_rebuilt timestamp, entry counts, schema version).

**Column types:** Use TEXT for all string fields, INTEGER for occurrence_count. SQLite's type affinity means column types are advisory, but declaring them aids documentation. Use `TEXT NOT NULL` sparingly -- only for id, file_path, content_hash.

**kb rebuild output format:** Default to summary counts (human-readable table). Support `--raw` flag for JSON output (machine-readable, for agent consumption). Report: total files found, indexed, skipped (unchanged), errors, by type.

**kb stats output format:** Default to human-readable table. Support `--raw` for JSON. Show: counts by severity, lifecycle_state, polarity, signal_category, project. Include last-rebuild timestamp and schema version.

**Index creation strategy:** Create indexes at schema init time via CREATE INDEX IF NOT EXISTS. Key indexes: `idx_signals_severity`, `idx_signals_lifecycle`, `idx_signals_project`, `idx_signals_created`. These are cheap to create on 199 rows and benefit all future queries.

**Body content parsing:** Store file_path only in Phase 56. Do NOT parse signal body markdown into a separate content column. FTS5 body indexing is explicitly deferred to Phase 59. The signals table schema can include a `body` column but leave it NULL until Phase 59 populates it.

## Open Questions

### Resolved

- **Lifecycle state model conflict:** Phase 31 model (`detected/triaged/remediated/verified/invalidated`) is correct. Evidence: knowledge-store.md v2.0.0, 120 signals with lifecycle_state field, reflector/reconcile/collect-signals code all use Phase 31 states. KB-01 in REQUIREMENTS.md should be updated before implementation. Recommend adding `blocked` as valid state from KB-01.

- **Should FTS5 table be created now?** Create the table structure now (CREATE VIRTUAL TABLE IF NOT EXISTS) but do NOT populate it. Phase 59 fills the FTS5 table. This avoids a schema migration between phases.

- **How to handle 5 root-level legacy signals?** Recursive walk of signals/ directory catches all .md files regardless of nesting depth. Project derived from frontmatter `project` field, not directory path. Root-level signals with no project field get `project: ''` (empty).

- **Can node:sqlite handle this workload?** Yes. Verified: FTS5, WAL mode, foreign keys all work on Node v22.22.1. 199 files is trivial -- even without incremental rebuild, full rebuild takes <1 second.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Should `kb migrate` modify all 183 files with `source:` field in one batch commit, or process incrementally? | Low | Batch -- run once, commit all changes in one commit. The migration is idempotent. |
| How should `kb rebuild` handle the ExperimentalWarning on stderr? | Low | Accept it. Tests should not assert on stderr content. Document in CHANGELOG. |
| Should the `meta` table store schema version for future migrations? | Low | Yes -- store `schema_version: 1` in meta table. Cheap insurance for Phase 59 schema additions. |

### Still Open

- The exact `blocked` state semantics and transitions need to be defined if it is added to the lifecycle model. Is it a state signals can enter from any other state? Only from `triaged`? Does it have a timeout?

## Sources

### Primary (HIGH confidence)

- `agents/knowledge-store.md` v2.0.0 -- canonical signal schema definition, lifecycle state machine
- `.planning/phases/31-signal-schema-foundation/31-CONTEXT.md` -- Phase 31 lifecycle decisions
- `.planning/research/kb-architecture-research.md` -- SQLite schema sketch, architecture analysis
- `get-shit-done/bin/lib/frontmatter.cjs` -- extractFrontmatter() implementation
- `get-shit-done/bin/gsd-tools.cjs` -- command routing pattern, module require pattern
- Node v22.22.1 empirical testing -- FTS5, WAL, FK constraints all verified on this machine

### Secondary (MEDIUM confidence)

- [Node.js v22.x sqlite API docs](https://nodejs.org/docs/latest-v22.x/api/sqlite.html) -- DatabaseSync API reference
- [Node.js v25.9.0 sqlite docs](https://nodejs.org/api/sqlite.html) -- latest API additions (timeout, columns, etc.)
- `.planning/MILESTONE-CONTEXT.md` -- v1.20 working assumptions, derived constraints

### Tertiary (LOW confidence)

- Signal corpus statistics (199 files) -- hand-counted via grep, may have edge case misses

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- node:sqlite verified empirically on target machine, all capabilities confirmed
- Architecture: HIGH -- follows established gsd-tools lib module pattern with zero new patterns
- Schema: HIGH -- grounded in knowledge-store.md v2.0.0 and kb-architecture-research.md
- Migration: MEDIUM-HIGH -- source field mapping covers all observed values, but untested edge cases possible
- Pitfalls: HIGH -- derived from actual corpus analysis of all 199 signal files

**Research date:** 2026-04-08
**Valid until:** 2026-05-08 (stable -- node:sqlite API unlikely to break within Node 22.x LTS)

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`), scanned 199 signals and 1 spike. No entries directly relevant to SQLite integration or schema migration tooling. The spike `spk-2026-03-01-claude-code-session-log-location` concerns log sensors, not KB infrastructure. The signal `sig-2026-02-11-kb-data-loss-migration-gap` is relevant as a cautionary precedent -- it validates the "files as source of truth, SQLite as derived cache" design principle that Phase 56 implements. Already cited in kb-architecture-research.md.

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-11-kb-data-loss-migration-gap | signal | KB data loss when cache was treated as source of truth | Architecture Patterns (reinforces KB-05 dual-write invariant) |
