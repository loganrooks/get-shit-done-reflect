# Phase 59: KB Query, Lifecycle Wiring & Surfacing — Research

**Researched:** 2026-04-20
**Domain:** node:sqlite + FTS5 + edge integrity + agent surfacing protocol inside the GSD Reflect fork
**Confidence:** HIGH on everything that was empirically checked against the live `kb.db` (0.7 of total scope); MEDIUM on the subjective framing decisions (reconciliation-script disposition, `kb link` surface split); LOW on nothing load-bearing.

## User Constraints

No `CONTEXT.md` exists — `/gsdr:discuss-phase 59` has not been run. The orchestrator explicitly instructed that the 2026-04-20 gap audit's nine §7.1 strengthening recommendations are effectively locked-in because the user rewrote the ROADMAP goal to bake them in. Treat them as `[decided]` for the planner.

### Locked decisions (derived from the rewritten ROADMAP goal + audit §7.1, effectively `[decided]`)

- **D-1 (scope narrowing, from goal):** Phase 59 is "KB Query, Lifecycle Wiring & Surfacing **on the current schema**." Do not redesign the edge model, do not introduce edge-as-entity, do not add `annotations[]` to signals, do not touch federation. Downstream children `KB-12` through `KB-17` are explicitly deferred by the goal.
- **D-2 (goal): inbound edge context must be exposed.** "Agent surfacing stops being one-way by exposing inbound edge context." This pins Option 1 from audit §3.1 as the chosen move; Options 2–5 are explicitly deferred (KB-12).
- **D-3 (audit §7.1 #3): `kb link` verb must be disambiguated** into read vs write surfaces. The ROADMAP Success Criterion 2–3 lock this: "read surfaces expose both inbound and outbound traversal" (non-mutating) and "mutating edge operations do not hide behind a read-only verb."
- **D-4 (audit §7.1 #1 + goal SC-1): `kb rebuild` MUST emit edge-integrity counts by link type plus malformed/orphaned targets.** "kb rebuild reports edge-integrity counts by link type plus malformed/orphaned targets."
- **D-5 (audit §7.1 #1): one-time repair migration** must clean the live 107 `[object Object]` rows before the gate is declared complete.
- **D-6 (audit §7.1 #7): `kb health` has a concrete four-part contract** — edge integrity, lifecycle-vs-plan consistency, dual-write verification, `depends_on` freshness summary.
- **D-7 (audit §7.1 #6 + goal SC-4): the reconcile-signal-lifecycle.sh reconciliation MUST be named explicitly** in the phase artifacts — replace / complement / deprecate-with-sunset.
- **D-8 (audit §7.1 #5): retire the lesson-only surfacing path** in `knowledge-surfacing.md` (KB-08).
- **D-9 (audit §7.1 #9): re-verify `kb rebuild` against the live 278-signal corpus** (not the stale 198/267 numbers in prior research).
- **D-10 (goal SC-7 + audit §7.2): deferrals to KB-12..KB-17 must be enumerated in a form the Phase 58 GATE-09 scope-translation ledger can consume.**
- **D-11 (KB-05 dual-write, already shipped): every mutating operation writes BOTH the `.md` frontmatter AND the SQLite row in the same logical transaction.** This is re-asserted for Phase 59 and is not under debate.
- **D-12 (knowledge-store.md §10): `qualified_by` and `superseded_by` are FROZEN fields** on signals. A write path that mutates these on existing signals violates the mutability spec. This eliminates Option 3 (bidirectional frontmatter writeback) from audit §3.3 before the planner evaluates it.

### Claude's (planner's) discretion

- Exact subcommand shape: `kb link show --inbound` vs `kb links --inbound` vs `kb link --show-inbound`. Prefer the first (subverb disambiguation) — see Recommendations R3.
- Minimum FTS5 surface (MATCH syntax, tokenizer, whether to expose rank/snippet). Recommend porter stem + unicode61 + MATCH only; no rank/snippet MVP. See R5.
- Output format flags (`--format json`, `--format table`, `--format markdown`) — pick the minimum the surfacing agents need. See R7.
- Task split between unit tests (per-verb CLI), integration tests against a synthetic corpus, and regression tests against the live 278-signal corpus.
- Helper layering: whether the new verbs all live in `kb.cjs` or split into `kb-query.cjs`/`kb-health.cjs`.
- Fresh-clone fallback: whether agents auto-trigger `kb rebuild` on first surfacing call or degrade to `grep`.

### Deferred (OUT OF SCOPE per the rewritten goal — do NOT plan against)

- Edge-as-entity materialization (→ KB-12 future phase)
- Retrieval attribution / `retrieval_count` writeback (→ KB-13)
- Non-signal artifact indexing — deliberations, audits, reflections as first-class KB entities (→ KB-14)
- Federation substrate / `origin_kb` column (→ KB-15)
- Richer link-type vocabulary (`corroborates`, `refines`, `contradicts`, `replaces`, `improves-framing`) (→ KB-16)
- Contested / under-review signal state (→ KB-17)
- Transitivity rules on link types (audit §5.3) — named gap, not resolved here
- Reflection-output ontology / closing the signal-to-lesson distillation loop (framework-invisibility per audit §12; not a Phase 59 finding at all)

## Summary

Phase 59's job is to add a minimum-viable query / lifecycle / surfacing layer on top of the node:sqlite + file-first KB that Phase 56 already stood up. Four of the seven requirements (KB-04b, KB-04c, KB-04d, KB-06a) are read-surface extensions. Two (KB-06b, KB-07) are write surfaces that must honor the KB-05 dual-write invariant. One (KB-08) is an agent-spec update to route surfacing through SQLite instead of grep-through-index and to stop depending on the deprecated lesson-only path.

Three empirically-verified facts constrain the design:

1. `node:sqlite` v22.22.1 on this machine supports FTS5 **external-content contentless rewrite** (confirmed by in-memory test with porter/unicode61 tokenizer). This is the right shape for KB-04b: the FTS virtual table indexes body text from the canonical `signals` row, and sync triggers keep it coherent. The Phase 57.7 drop of `signal_fts` (`kb.cjs:173-184`) was correct — it dropped a broken *canonical-row-expansion* attempt. The new FTS5 must not repeat that mistake.
2. `signal_links` has no index on `target_id`. A `CREATE INDEX idx_signal_links_target ON signal_links(target_id, link_type)` is required for KB-04c inbound-edge lookups to scale past table scans.
3. The live corpus today has **278 signals, 109 `recurrence_of` edges of which 107 target the literal string `[object Object]`**, 210 `related_to` edges (205 resolve), zero `qualified_by`, zero `superseded_by`, 15 remediated signals. The 107 corrupted edges come from a single bug in `extractLinks()` (`kb.cjs:534-535`) plus a permissive YAML parser that coerces bare `recurrence_of:` keys to `{}`. The repair migration is small (fix one guard, null-out the 107 bad frontmatter values, rebuild) and independently verifiable.

The hardest design call that is NOT locked is how to reconcile `reconcile-signal-lifecycle.sh` with `kb transition`. Research surfaces one load-bearing fact that the audit did not catch: **the bash script uses `sed -i ''` which is BSD-only and silently fails on GNU sed**. Linux runs (this dev box: Ubuntu 24.04 with GNU sed 4.9) throw `sed: can't read s/...` and the script never actually edits any file. On macOS the script works. This strengthens the case for "replace with `kb transition`" over "complement" — the bash path is already broken for half the user base.

**Primary recommendation:** Build exactly the seven requirements, no more and no less; add one required index (`idx_signal_links_target`); use FTS5 external-content contentless-rewrite with porter tokenizer; implement the 107-edge repair as a one-shot `kb repair --malformed-targets` subcommand separate from `kb migrate`; replace `reconcile-signal-lifecycle.sh` with `kb transition` and deprecate the bash script with a one-cycle sunset; split `kb link` into `kb link show --outbound|--inbound` (read) and `kb link create|delete` (write); implement `kb health` as four independent checks each exiting non-zero on any failure; update `knowledge-surfacing.md` §2 / §8 to prefer `kb query`/`kb search`/`kb link show --inbound` over grep, keeping grep as the fresh-clone fallback; enumerate KB-12..KB-17 as explicit ledger-consumable deferrals.

## Ground Truth — live KB state (2026-04-20, measured by this research)

Measured by direct `sqlite3 .planning/knowledge/kb.db` queries during research. Planner: re-run these before the repair migration to catch drift.

| Measure | Value | Query |
|---|---|---|
| Signal count | 278 | `SELECT COUNT(*) FROM signals` |
| Spike count | 8 | `SELECT COUNT(*) FROM spikes` |
| Schema version | 2 | `SELECT value FROM meta WHERE key='schema_version'` |
| `recurrence_of` edges | 109 | `SELECT link_type, COUNT(*) FROM signal_links GROUP BY link_type` |
| `related_to` edges | 210 | same |
| `qualified_by` edges | 0 | same |
| `superseded_by` edges | 0 | same |
| `[object Object]` malformed targets | 107 | `SELECT COUNT(*) FROM signal_links WHERE target_id='[object Object]'` |
| `recurrence_of` that actually resolve to a signal | 2 / 109 | join with `signals.id` |
| `related_to` that actually resolve to a signal | 205 / 210 | join with `signals.id` |
| `lifecycle_state='remediated'` | 15 | `SELECT COUNT(*) FROM signals WHERE lifecycle_state='remediated'` |
| Node runtime | v22.22.1 | `node --version` (≥ 22.5.0 required by `getDbSync()`) |
| SQLite CLI version | 3.50.2 | FTS5 supported since 3.9.0 |
| GNU sed detected | yes | Linux box; `sed -i ''` in reconcile-signal-lifecycle.sh is broken here |
| Ripgrep (`rg`) in PATH | no | knowledge-surfacing fallback must use `grep`, not `rg` |
| `node:sqlite` prints ExperimentalWarning | yes | stderr: `ExperimentalWarning: SQLite is an experimental feature` |

`[evidenced:cited] FTS5 external-content contentless rewrite verified working on node:sqlite v22.22.1 — in-memory test with porter+unicode61 tokenizer returned correct matches for both literal and stemmed queries.`

`[evidenced:cited] EXPLAIN QUERY PLAN for inbound edge query (SELECT source_id FROM signal_links WHERE target_id = ?) shows SCAN signal_links — no usable index exists on target_id today.`

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---|---|---|---|
| `node:sqlite` | bundled with Node ≥ 22.5.0 | All DB operations. Already in use in `kb.cjs`. | Already the chosen stack per Phase 56. Zero external deps. `kb.cjs:27-42` lazy-requires it. |
| SQLite FTS5 | bundled with `node:sqlite` | Full-text body search for KB-04b. | Only option that fits the "zero external deps" rule. Supported since SQLite 3.9.0 (2015). Shipped with every Node ≥ 22.5.0 bundle. |
| `lib/frontmatter.cjs` | in-tree | YAML parse / splice for dual-write. | `kb.cjs:19` already imports `extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter`. Use these; do NOT reimplement YAML handling. |
| `lib/core.cjs` | in-tree | `output(obj, raw)` JSON-or-text wrapper. | `kb.cjs:20`. Mandatory for `--raw` flag parity with other subcommands. |

### Supporting

| Library | Version | Purpose | When to Use |
|---|---|---|---|
| `grep` | POSIX | Fresh-clone fallback when `kb.db` does not exist. | KB-08 surfacing fallback path. **NOT `rg`** — ripgrep is not guaranteed to be in `$PATH` (this dev box has no `rg`). |
| `sqlite3` CLI | bundled on most systems | Interactive DBA/debug. | Recovery only; the CLI verbs MUST NOT shell out to `sqlite3`. All production paths go through `node:sqlite`. |

### Alternatives considered and rejected

| Instead of | Considered | Rejected because |
|---|---|---|
| FTS5 external-content contentless | (1) canonical-row FTS (signal_fts mirrors signals rows) | **Phase 57.7 MEAS-GSDR-06 explicitly dropped exactly this.** `kb.cjs:173-184` drops `signal_fts` on every rebuild. Re-introducing it would reopen the closed defect. |
| FTS5 external-content contentless | (2) `fts5vocab` only (no external content) | Does not allow body text to be indexed — frontmatter-only search misses the signal's narrative. |
| FTS5 external-content contentless | (3) `better-sqlite3` npm dep | Violates zero-dep philosophy; `kb.cjs:26-42` lazy-required `node:sqlite` specifically to avoid this. |
| GNU grep fallback | `rg` (ripgrep) | Not in `$PATH` on this machine; silent failure for fresh-clone fallback would recreate audit Pitfall C2. |
| In-tree Node CLI verbs | Shelling out to `sqlite3` | Would re-import the audit C1 dual-write hazard; `node:sqlite` gives us transactional semantics in-process. |
| `kb link` one-verb approach | Single `kb link` with flags | Violates D-3 / ROADMAP SC-3 requirement that mutating ops not hide behind a read-only verb. |

### Installation

No new npm dependencies required. Phase 59 adds only in-tree code.

```bash
# Verify the only prerequisite that Phase 59 actually needs
node --version            # must be >= 22.5.0
node -e "require('node:sqlite')"  # must not throw
```

## Architecture Patterns

### Recommended file layout

```
get-shit-done/bin/lib/
├── kb.cjs                # existing: cmdKbRebuild, cmdKbStats, cmdKbMigrate
│                         #   + add: cmdKbRepair (one-shot 107-edge cleanup)
│                         #   + extend: cmdKbRebuild reports edge-integrity
├── kb-query.cjs          # NEW: cmdKbQuery, cmdKbSearch (read surface KB-04b)
├── kb-link.cjs           # NEW: cmdKbLinkShow, cmdKbLinkCreate, cmdKbLinkDelete
├── kb-transition.cjs     # NEW: cmdKbTransition (write path, dual-write)
└── kb-health.cjs         # NEW: cmdKbHealth (four-check contract)

get-shit-done/bin/gsd-tools.cjs
└── case 'kb' block       # EXTEND the switch: route new subverbs

get-shit-done/references/
└── knowledge-surfacing.md  # REWRITE §1, §2, §8 to target SQLite query path
                            # (retire lessons, add inbound-edge fetch,
                            # add fresh-clone fallback logic)

get-shit-done/bin/
└── reconcile-signal-lifecycle.sh  # DEPRECATE (one-cycle sunset)
```

Planner discretion on whether to split the helper files or keep them all in `kb.cjs` as sections. Split is recommended because `kb.cjs` is already 1,002 lines and five more verbs will push it past 2,000. The upstream discipline (`.planning/` not modifying `gsd-tools.cjs`) does NOT apply to `lib/kb*.cjs` — those are fork-owned lib files.

### Pattern 1: FTS5 external-content contentless rewrite

**What:** Create a virtual table over `signals.rowid` so that FTS indexes body text without duplicating it. Keep the FTS index coherent via three AFTER triggers (INSERT / UPDATE / DELETE) on the `signals` table.

**When to use:** KB-04b full-text search. This is the **only** correct shape per the Phase 57.7 lesson — a content-copy FTS5 failed before.

**Example:**
```sql
-- Source: https://www.sqlite.org/fts5.html §4.4.3 (external content)
-- Empirically verified on node:sqlite v22.22.1 (this research).
--
-- Add two columns to signals if body text is not already projected in:
ALTER TABLE signals ADD COLUMN title TEXT DEFAULT '';   -- derived from first H2 of body
ALTER TABLE signals ADD COLUMN body  TEXT DEFAULT '';   -- body of the .md file after frontmatter

CREATE VIRTUAL TABLE IF NOT EXISTS signal_fts USING fts5(
  id UNINDEXED,
  title,
  body,
  content='signals',
  content_rowid='rowid',
  tokenize='porter unicode61'
);

CREATE TRIGGER IF NOT EXISTS signals_ai AFTER INSERT ON signals BEGIN
  INSERT INTO signal_fts(rowid, id, title, body)
  VALUES (new.rowid, new.id, new.title, new.body);
END;
CREATE TRIGGER IF NOT EXISTS signals_ad AFTER DELETE ON signals BEGIN
  INSERT INTO signal_fts(signal_fts, rowid, id, title, body)
  VALUES ('delete', old.rowid, old.id, old.title, old.body);
END;
CREATE TRIGGER IF NOT EXISTS signals_au AFTER UPDATE ON signals BEGIN
  INSERT INTO signal_fts(signal_fts, rowid, id, title, body)
  VALUES ('delete', old.rowid, old.id, old.title, old.body);
  INSERT INTO signal_fts(rowid, id, title, body)
  VALUES (new.rowid, new.id, new.title, new.body);
END;
```

Rebuild must run `INSERT INTO signal_fts(signal_fts) VALUES('rebuild');` after bulk-loading the signals table to populate the FTS index for existing rows. The triggers only catch future writes.

### Pattern 2: Dual-write transaction for `kb transition`

**What:** Every `kb transition` invocation (a) reads current signal frontmatter, (b) opens a SQLite transaction, (c) writes updated .md via `spliceFrontmatter()`, (d) updates the `signals` row and appends a `lifecycle_log` entry, (e) commits the SQL transaction only if file write succeeded, (f) on file-write failure rolls back SQL.

**When to use:** All mutating verbs — `kb transition`, `kb link create`, `kb link delete`.

**Example (pseudo-Node):**
```js
// Source: PITFALLS.md C1 + KB-05 dual-write invariant + Phase 57.8 live-upgrade pattern
function cmdKbTransition(cwd, signalId, newState, rationale) {
  const db = openKbDb(getDbPath(cwd));
  const sigFile = findSignalFile(cwd, signalId);      // walk signals/*/*.md
  const content = fs.readFileSync(sigFile, 'utf-8');
  const fm = extractFrontmatter(content);

  // Validate transition is legal per lifecycle state machine
  assertLegalTransition(fm.lifecycle_state, newState);

  const now = new Date().toISOString();
  const newFm = { ...fm };
  newFm.lifecycle_state = newState;
  newFm.updated = now;
  newFm.lifecycle_log = [
    ...(fm.lifecycle_log || []),
    `${fm.lifecycle_state}->${newState} by kb-transition at ${now}: ${rationale}`,
  ];

  db.exec('BEGIN IMMEDIATE');
  try {
    const newContent = spliceFrontmatter(content, newFm);
    // File write first — easier to rollback SQL than filesystem
    fs.writeFileSync(sigFile, newContent, 'utf-8');
    db.prepare('UPDATE signals SET lifecycle_state=?, updated=? WHERE id=?')
      .run(newState, now, signalId);
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    // Best-effort file restoration if SQL failed after file write
    if (fs.existsSync(sigFile + '.bak')) fs.renameSync(sigFile + '.bak', sigFile);
    throw e;
  }
}
```

### Pattern 3: Edge-integrity report shape (KB-04d)

**What:** Extend `cmdKbRebuild` to add a post-pass that groups `signal_links` by `link_type` and computes (total, resolves_to_signal, resolves_to_spike, orphaned, malformed). Malformed = `target_id='[object Object]'`. Orphaned = resolves to neither.

**When to use:** Every `kb rebuild` run.

**Required output (pin this shape — downstream tests depend on it):**
```
Edge integrity:
  link_type       total  resolves  orphaned  malformed
  recurrence_of     109         2         0        107
  related_to        210       205         5          0
  qualified_by        0         0         0          0
  superseded_by       0         0         0          0
  TOTAL             319       207         5        107
Exit code: 1 (malformed targets detected; run `kb repair --malformed-targets`)
```

When `--raw` is passed, the same shape goes out as JSON under `edge_integrity: { recurrence_of: {...}, ... }` in the existing JSON blob.

**Exit-code semantics:**
- 0 = no malformed edges, no orphaned edges
- 1 = malformed edges exist (hard failure per D-4)
- 2 = only orphaned edges (warning only; downgradable)

### Pattern 4: Read-verb / write-verb split (KB-06a / KB-06b)

**Read surface (non-mutating, no dual-write concern):**
```
gsd-tools kb query     [--severity X] [--lifecycle Y] [--project Z] [--tag T] [--since D] [--format json]
gsd-tools kb search    "phrase or term"  [--format json]           # FTS5 MATCH
gsd-tools kb stats                                                   # existing; extend with edge counts
gsd-tools kb health                                                  # NEW, four-part contract
gsd-tools kb rebuild   [--raw]                                       # existing; extend with edge integrity
gsd-tools kb link show <signal-id> [--outbound | --inbound | --both]  # NEW, read-only
```

**Write surface (mutating, each honors KB-05 dual-write):**
```
gsd-tools kb transition    <signal-id> <new-state> --reason "..."      # NEW
gsd-tools kb link create   <src-id> <tgt-id> --type qualified_by|superseded_by|related_to  # NEW
gsd-tools kb link delete   <src-id> <tgt-id> --type <t>                # NEW
gsd-tools kb repair        --malformed-targets                         # NEW, one-shot
gsd-tools kb migrate                                                   # existing (source→detection_method+origin)
```

### Pattern 5: `kb health` four-part contract

**What:** `kb health` runs four independent checks. Each emits pass/fail, a count, and (on fail) a remediation pointer. Non-zero exit on any fail.

**The four checks:**

| Check | What it verifies | Concrete query |
|---|---|---|
| **Edge integrity** | No malformed targets, orphan rate below threshold | `SELECT COUNT(*) FROM signal_links WHERE target_id='[object Object]' OR NOT EXISTS(SELECT 1 FROM signals WHERE id=signal_links.target_id) AND NOT EXISTS(SELECT 1 FROM spikes WHERE id=signal_links.target_id)` |
| **Lifecycle-vs-plan consistency** | For every plan with `resolves_signals: [sig-X]`, sig-X is in `remediated` or `verified` | Walk `.planning/phases/**/NN-PLAN.md` with frontmatter `resolves_signals`, cross-check each ID's lifecycle_state in signals table. (This is Option B from the 2026-03-04 deliberation.) |
| **Dual-write invariant** | File-derived `lifecycle_state` matches SQLite `lifecycle_state` for every signal | For N random signals (or all), re-read the .md file and compare `fm.lifecycle_state` to the SQL row value. Divergence = bug per Pitfall C1. |
| **`depends_on` freshness summary** | Count of signals/spikes with `depends_on` fields; heuristic flag on any whose depended path doesn't exist | Summary only; does NOT judge freshness (that stays advisory per knowledge-surfacing.md §4). Advisory count surfaces the advisory layer's scope. |

### Anti-patterns to avoid

- **Re-introducing canonical-row FTS5.** The dropped `signal_fts` referenced nonexistent `title/body` columns on signals (`kb.cjs` comment at lines 172-185). The new FTS must be external-content with its own sync triggers and must not redefine signal columns that don't exist.
- **`sed -i ''` / BSD-only shell commands.** `reconcile-signal-lifecycle.sh:80, :100` uses `sed -i ''` which is BSD-only. Any shell helper Phase 59 writes must work on GNU sed (Linux) OR not be a shell helper at all. Strongly prefer node:sqlite code over shell.
- **`kb link` as a single overloaded verb.** Audit Finding F1 was explicit: SC-2 and KB-06b disagree on whether `kb link` reads or writes. The phase must split them.
- **Writing edges on the target side.** `qualified_by` and `superseded_by` are FROZEN per `knowledge-store.md:555-567`. `kb link create` MUST write ONLY to source. Target-side visibility is achieved via the SQL inbound query (`WHERE target_id = ?`), not via mutation.
- **Skipping the one-shot repair.** If `kb rebuild` starts reporting `malformed=107` but the repair never runs, every agent using `kb link show --inbound` gets garbage results when the target is `[object Object]`. Ship the repair in the same phase.
- **Committing `kb.db` to git.** Per PITFALLS.md N1. Already gitignored — verify in plan verification.
- **Relying on the experimental-warning going away.** `node:sqlite` prints `ExperimentalWarning` on stderr. CLI output must go to stdout; parsers must not parse stderr as data. Tests that assert "clean stderr" will false-fail.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---|---|---|---|
| YAML frontmatter parsing / splicing | Regex-based field rewrites | `extractFrontmatter`, `reconstructFrontmatter`, `spliceFrontmatter` from `lib/frontmatter.cjs` | Used by all existing kb / frontmatter / template subcommands. Handles quoted strings, nested objects, empty-object normalization. Hand-rolled sed/regex caused the `[object Object]` bug in the first place — see Finding A1 root cause. |
| Full-text search | grep-loops over markdown files | SQLite FTS5 external-content contentless rewrite | Performance ceiling on grep approaches at ~1000 entries; FTS5 stem / phrase / boolean queries beyond grep's reach; already available via `node:sqlite`. |
| Dual-write coordination | Separate file-write and SQL-write steps with "best effort" recovery | Single `BEGIN IMMEDIATE` transaction, file write first, SQL update, COMMIT — rollback and restore backup on SQL failure | The KB-05 invariant explicitly requires atomic dual-write. Any gap reintroduces Pitfall C1 (KB data loss precedent: sig-2026-02-11-kb-data-loss-migration-gap). |
| Inbound edge traversal | "Read every signal file and check its frontmatter for references" | `SELECT source_id, link_type FROM signal_links WHERE target_id=?` (with new index) | O(N) file reads vs O(log N) indexed lookup. Already works today once `idx_signal_links_target` exists. |
| Lifecycle state transition validation | Free-form state-name checks | A small `assertLegalTransition(from, to, strictness)` helper driven by the table in `knowledge-store.md:213-225` | `lifecycle_strictness` setting (strict/flexible/minimal) already governs transition legality per spec. Re-implementing it in CLI drift-risks. |
| Signal file lookup by id | Bespoke regex + find | `discoverSignalFiles(kbDir)` from `kb.cjs:209-231` | Already walks project subdirs; reuse it and filter by basename == `${id}.md`. |
| Phase-plan traversal for health check | Globbing and frontmatter regex | `discoverLedgerFiles(cwd)` / `extractFrontmatter` pattern from `kb.cjs:260-295` | That code already walks `.planning/phases/**/NN-LEDGER.md` for `ledger_entries` indexing; same pattern applies to `NN-PLAN.md` with `resolves_signals`. |

**Key insight:** The Phase 56 groundwork gave Phase 59 everything it needs except the read/write verbs and one index. The planner's scope is "wire five new verbs through existing helpers," not "build a KB." Resist the urge to refactor kb.cjs while you're in there.

## Common Pitfalls

### Pitfall 1: FTS5 re-introduction as canonical-row expansion

**What goes wrong:** Developer (or an LLM planner) treats KB-04b as "re-add the `signal_fts` table Phase 57.7 dropped." They write `CREATE VIRTUAL TABLE signal_fts USING fts5(id, body)` with no `content=`. The table has to duplicate body text from somewhere, so they either (a) synthesize a column on signals that doesn't exist, or (b) bloat the database with copies of every .md body.

**Why it happens:** Reading the audit's Finding in §6.2 ("`signal_fts` virtual table was explicitly dropped") does not automatically communicate that the re-entry must take a different shape.

**How to avoid:** Read `kb.cjs:172-185` (the drop comment) as part of planning. Make the FTS re-entry an *external-content* table pointing at `content='signals'` with explicit `content_rowid='rowid'` and three sync triggers. Verify in a unit test that the fts table has zero rows in the `content` column selector when inspected (`SELECT count(*) FROM signal_fts WHERE signal_fts MATCH 'anything'` returns results; `SELECT body FROM signal_fts LIMIT 1` returns NULL-or-virtual-looking because it's delegated through the content table).

**Warning signs:** Rebuild time grows 10x. `kb.db` file size grows 10x. Phase 57.7 comment still references MEAS-GSDR-06 but the signal_fts table is back with a content= of '' (contentless mode for rewrite — fine) OR with content copied from signals (broken).

### Pitfall 2: Silent Linux-vs-macOS divergence in the lifecycle reconcile path

**What goes wrong:** `reconcile-signal-lifecycle.sh` uses `sed -i ''` which GNU sed interprets as "inline edit a file named `''`" and errors with "can't read s/...". The script silently does nothing on Linux; all the reconciliation appears to work (no error suppression) but no file is actually edited. KB stays inconsistent. Health check (if it ran) would catch the divergence between plan `resolves_signals` and signal `lifecycle_state`, but no one runs it.

**Why it happens:** The script was written on macOS. Its test environment (if any) was macOS. `set -euo pipefail` DOES fire on `sed`'s error, but the loop is `while IFS= read -r plan` which consumes the error-exit signal at a different level. Actually — testing just now: `set -euo pipefail` would abort, but the output says `Reconciled 0 signals` silently because the `sed` failure is per-signal-file and `||` swallows it in the find pipeline. Needs verification in the spike if this phase complements rather than replaces.

**How to avoid:** Replace the reconcile script with `kb transition` in `execute-phase.md`. Deprecate the script. Test on Linux **and** macOS in CI.

**Warning signs:** Signals referenced by `resolves_signals` stay in `detected` after phase completion. `kb health` lifecycle-vs-plan check emits many warnings.

### Pitfall 3: Dropping the agent surfacing protocol's lesson references without updating the KB-08 target list

**What goes wrong:** Planner updates `knowledge-surfacing.md §8` to route through `kb query`, but forgets that §1 says "Scope: Lessons and spike decisions only" and §2.1 says "Scan the Lessons table." If §8 says query signals but §1/§2 still enforce lessons-only, agents get contradictory instructions. Agents resolve the contradiction randomly.

**Why it happens:** `knowledge-surfacing.md` is 457 lines. It mentions "lesson" 14+ times. Planner searches for "lesson" and thinks they got them all, but they miss §2.3 "Cross-Project Querying" which scopes to index.md (lesson-table structure) and §8.2 Planner ("Queries lessons only").

**How to avoid:** The planner should grep `knowledge-surfacing.md` for `lesson` and enumerate every occurrence; each either (a) stays as a historical reference to the deprecated path, (b) gets rewritten to `signal|spike|reflection`, or (c) gets deleted. The rewrite must be systematic, not search-and-replace.

**Warning signs:** Agent RESEARCH.md outputs contain "Checked knowledge base, 0 lessons found" as their sole KB surfacing. `knowledge_debug: true` logs show all queries hitting the (empty) lessons table.

### Pitfall 4: Missing `idx_signal_links_target` index ships performance regression

**What goes wrong:** KB-04c's inbound-edge traversal runs `SELECT source_id FROM signal_links WHERE target_id = ?`. Without an index on `target_id`, this is O(N) for every surfacing call. At 278 signals and 319 edges it is fast, but at 2000 signals it becomes noticeable, and at 10000 it dominates agent cold-start time. More importantly: every surfacing run does ~5 inbound-edge lookups. That's ~5 table scans per surface.

**Why it happens:** The PRIMARY KEY `(source_id, target_id, link_type)` LOOKS like it covers `target_id`, but SQLite only uses the leftmost column for prefix lookups. The PK is not usable for `WHERE target_id=?`.

**How to avoid:** Add `CREATE INDEX IF NOT EXISTS idx_signal_links_target ON signal_links(target_id, link_type)` in `initSchema()`. Verify with `EXPLAIN QUERY PLAN SELECT source_id FROM signal_links WHERE target_id = 'sig-X'` — must show `SEARCH ... USING INDEX` not `SCAN`.

**Warning signs:** Surfacing agents get slow as corpus grows. `kb health` subtly over-runs its budget.

### Pitfall 5: `kb repair --malformed-targets` forgetting the file side

**What goes wrong:** The repair subcommand clears the 107 bad rows from `signal_links` and declares success. But the source `.md` files still have `recurrence_of:` as a bare YAML key. On the next `kb rebuild`, `extractLinks()` runs again, the YAML parser still returns `{}`, and `String({}).trim()` is still `"[object Object]"`. 107 edges come back.

**Why it happens:** Attacking the symptom (bad SQL rows) without the cause (bad frontmatter + insufficient guard).

**How to avoid:** Repair must do three things in order:
1. Fix `extractLinks()` at `kb.cjs:534-535` to guard `typeof fm.recurrence_of === 'string'` before `String(...).trim()` (prevents recurrence).
2. Walk `signals/*/*.md`, find files with bare `recurrence_of:` or `recurrence_of: {}`, remove the field entirely (or set to empty string per spec default).
3. Only then re-run `kb rebuild`, verify `kb rebuild --raw | jq '.edge_integrity.recurrence_of.malformed'` is 0.

**Warning signs:** Post-repair `kb rebuild` re-emits 107 malformed. Source files still have bare `recurrence_of:`.

### Pitfall 6: Dual-write rollback that silently corrupts the file on SQL failure

**What goes wrong:** The naive dual-write is "write file, then write SQL, on SQL error … what?" If SQL fails after file is written, the file has the new state but SQL has the old. Next `kb rebuild` overwrites SQL back to match file, which accidentally "completes" the transition. But if the agent caller thought the write failed and retries, the second write will fail validation because state is already the new value.

**Why it happens:** Filesystem writes are not transactional. Any backup/restore path is bespoke.

**How to avoid:** Pattern 2 above: take `BEGIN IMMEDIATE` BEFORE file write, write file (with `.bak` sidecar copy made BEFORE write), update SQL, COMMIT. On any SQL error: ROLLBACK, restore file from `.bak`. On file-write error (pre-SQL): ROLLBACK SQL (no-op, nothing written), error out, cleanup `.bak`. Exit non-zero.

**Warning signs:** `kb health --dual-write` finds divergences. Users report `kb transition` "succeeded" but signal file shows old state.

### Pitfall 7: `kb.db` schema version bump without migration guard

**What goes wrong:** Phase 59 adds `idx_signal_links_target` and three FTS sync triggers to `initSchema()`. Existing installations on the v2 schema have a working `kb.db` without those. On next install/rebuild, `CREATE INDEX IF NOT EXISTS` and `CREATE TRIGGER IF NOT EXISTS` make the schema update idempotent — no data loss. BUT: the FTS `signal_fts` table didn't exist before, and the triggers fire AFTER INSERT on existing rows would… they won't, because the rebuild only runs INSERT OR REPLACE on changed rows. The existing 278 signal rows are unchanged, so `signals_au` UPDATE trigger never fires, and `signal_fts` stays empty.

**Why it happens:** Triggers only catch NEW writes. Existing rows at migration time aren't touched.

**How to avoid:** After creating `signal_fts` and triggers, run `INSERT INTO signal_fts(signal_fts) VALUES('rebuild');` during `initSchema()` (if `signal_fts` is empty but `signals` has rows). Or make `cmdKbRebuild` bump `meta.schema_version` from `2` to `3` and run the FTS rebuild as part of the version-bump migration.

**Warning signs:** `kb search "any query"` returns zero results despite `kb query` returning many matching signals. Obvious from smoke test.

### Pitfall 8: `kb health` re-implementing what already exists

**What goes wrong:** Planner writes `kb health` as a new standalone module that re-walks signal files and extracts frontmatter. Duplicates `discoverSignalFiles()`, `extractFrontmatter()`, the schema validators, etc. Phase 60 adds a new check and now has to sync two walkers.

**Why it happens:** `kb health` is authored as a fresh concept.

**How to avoid:** Build `kb health` as four independent *queries* against the already-populated `kb.db` and a single file-walk for the plan `resolves_signals` scan. Reuse helpers from `kb.cjs`. No new file walkers, no new YAML parse paths.

**Warning signs:** `kb health` code grows past ~200 lines. Diff touches `kb.cjs` in unrelated ways.

### Pitfall 9: Parity gap — Codex install missing the new CLI verbs

**What goes wrong:** Phase 59 adds `kb query`, `kb search`, etc. to `gsd-tools.cjs`. `gsd-tools.cjs` is shared between Claude (`.claude/get-shit-done/bin/`) and Codex (`.codex/get-shit-done/bin/`) per Phase 58.1 XRT-01 parity. But agent specs (Claude only) get rewritten to reference `kb query`; Codex-facing Markdown/agent specs don't. Agents on Codex runtime still do grep-through-index.

**Why it happens:** Phase 58.1 solved the update-distribution parity for `gsdr-update`. The same class of problem applies to any new CLI verb. Research at `cross-runtime-parity-research.md` and `capability-matrix.md` (repo-level, not in `references/`) encodes the pattern but not an enforcement mechanism.

**How to avoid:** Every new CLI verb's reference in agent-facing docs (`knowledge-surfacing.md`, `knowledge-store.md`, any `agents/*.md`) must be unconditionally cross-runtime. The CLI verbs themselves live in `gsd-tools.cjs` which is already installed into both runtimes by `bin/install.js`. No hook/statusline substrate is needed (consistent with 58.1 DC-4). But the agent spec referring to the verbs must not be inside a Claude-only conditional. Verify: `rg "kb query" .claude/ .codex/` shows the same references on both sides after install.

**Warning signs:** Codex-side agents return "Checked knowledge base, 0 entries found" while Claude-side agents surface normally. Integration regression test against both install layouts fails.

## Code Examples

### Example 1: `cmdKbSearch` implementation sketch

```js
// Source: FTS5 docs at https://www.sqlite.org/fts5.html + empirical verification
//   against .planning/knowledge/kb.db on 2026-04-20.
// File: get-shit-done/bin/lib/kb-query.cjs
function cmdKbSearch(cwd, query, options = {}) {
  const dbPath = getDbPath(cwd);
  if (!fs.existsSync(dbPath)) {
    // Fresh-clone fallback: rebuild first, OR degrade to grep.
    // Recommended: degrade to grep (see KB-08 surfacing pattern below).
    return fallbackGrepSearch(cwd, query, options);
  }
  const DatabaseSync = getDbSync();
  const db = new DatabaseSync(dbPath, { enableForeignKeyConstraints: true });
  const limit = options.limit || 25;
  const rows = db.prepare(`
    SELECT s.id, s.severity, s.lifecycle_state, s.project, s.created,
           snippet(signal_fts, 2, '[', ']', '...', 32) AS context
    FROM signal_fts
    JOIN signals s ON s.rowid = signal_fts.rowid
    WHERE signal_fts MATCH ?
    ORDER BY rank
    LIMIT ?
  `).all(query, limit);
  if (options.raw) { output({ query, results: rows }, true); return; }
  // text-format table output here
}
```

### Example 2: `cmdKbLinkShow --inbound` implementation

```js
// Source: sqlite3 kb.db EXPLAIN QUERY PLAN verified this pattern during research.
// Requires: CREATE INDEX idx_signal_links_target ON signal_links(target_id, link_type)
// File: get-shit-done/bin/lib/kb-link.cjs
function cmdKbLinkShow(cwd, signalId, options = {}) {
  const db = new DatabaseSync(getDbPath(cwd), { enableForeignKeyConstraints: true });
  const rows = { outbound: [], inbound: [] };

  if (options.outbound || options.both) {
    rows.outbound = db.prepare(`
      SELECT target_id, link_type,
             CASE
               WHEN EXISTS(SELECT 1 FROM signals WHERE id = target_id) THEN 'signal'
               WHEN EXISTS(SELECT 1 FROM spikes WHERE id = target_id) THEN 'spike'
               WHEN target_id = '[object Object]' THEN 'malformed'
               ELSE 'orphan'
             END AS target_kind
      FROM signal_links WHERE source_id = ?
      ORDER BY link_type, target_id
    `).all(signalId);
  }
  if (options.inbound || options.both) {
    rows.inbound = db.prepare(`
      SELECT source_id, link_type FROM signal_links
      WHERE target_id = ?
      ORDER BY link_type, source_id
    `).all(signalId);
  }
  if (options.raw) output({ signalId, ...rows }, true);
  else renderLinkTable(signalId, rows);
}
```

### Example 3: Minimal `knowledge-surfacing.md` §2.1 rewrite (excerpt)

The planner should rewrite §2 and §8. The minimum viable change:

```markdown
### 2.1 Step-by-Step Query Process (v2 — SQLite-first)

1. **Determine the query path:**
   If `.planning/knowledge/kb.db` exists, use the SQL path.
   Otherwise fall back to the grep path (fresh clone, first run).

2. **SQL path:**
   # Key-value query (filter by frontmatter fields)
   gsd-tools kb query --tags "auth,jwt" --severity critical --format json

   # Full-text search over body
   gsd-tools kb search "refresh token rotation" --format json

   # For every surfaced entry, fetch inbound context:
   gsd-tools kb link show <signal-id> --inbound --format json

3. **Grep path (fallback):**
   if [ -d ".planning/knowledge" ]; then KB_DIR=".planning/knowledge";
   else KB_DIR="$HOME/.gsd/knowledge"; fi
   grep -l "tags:.*auth" "$KB_DIR/signals/"**/*.md

4. **Apply relevance matching (§3), freshness (§4), and citation (§6).**
```

Section 8 row shape needs updating too — remove the lesson column from each agent's priority.

## State of the Art

| Old approach | Current approach (Phase 59) | When changed | Impact |
|---|---|---|---|
| Agents grep `index.md` for tags | `gsd-tools kb query --tags X` | Phase 59 KB-04b, KB-08 | Scales past 1000 entries; structured JSON output; typed filters (severity, lifecycle) |
| Shell script `kb-rebuild-index.sh` regenerates `index.md` | `gsd-tools kb rebuild` populates `kb.db` + regenerates `index.md` (derived) | Phase 56 (done) / Phase 59 (edge integrity added) | Index.md still exists for human reading; SQLite is the authoritative query surface |
| `reconcile-signal-lifecycle.sh` (BSD-sed bash) | `gsd-tools kb transition` (node:sqlite + dual-write) | Phase 59 KB-07 | Cross-platform; dual-write invariant; integrates with health check |
| Agents surface lessons (deprecated, 0 exist) | Agents surface signals + spikes + reflections | Phase 59 KB-08 | Stops misrouting surfacing to an empty dir |
| No inbound edge visibility | `kb link show --inbound` returns inbound edges | Phase 59 KB-04c | Target-blindness at surfacing layer closed (audit §3.1 Option 1) |
| FTS5 virtual table `signal_fts` (broken, dropped) | FTS5 external-content contentless rewrite | Phase 57.7 (drop) → Phase 59 (re-add correctly) | Full-text search over body, not just frontmatter |

**Deprecated / outdated:**
- **`kb-rebuild-index.sh`** — superseded by `gsd-tools kb rebuild` in Phase 56. Remove if Phase 59 touches it.
- **`reconcile-signal-lifecycle.sh`** — supersede in Phase 59 by `kb transition`. Recommended path: deprecate with one-cycle sunset (keep the file, add a header saying "deprecated as of Phase 59, see `kb transition`; this file will be removed in v1.21"). Replace the `execute-phase.md` integration line.
- **Lesson-surfacing in `knowledge-surfacing.md`** — zero lessons exist. Rewrite §§1, 2, 8 to target signals + spikes + reflections.
- **`signal_fts` canonical-row FTS5** — dropped in Phase 57.7 per `kb.cjs:172-185`. Do not revive in this shape.

## Cross-Runtime Parity (XRT-01)

Per Phase 58.1 DC-4 and the repo-level `references/capability-matrix.md` (noted, not read in this research), Codex install has no hook/statusline substrate, and Phase 59 does not need any. All new Phase 59 capabilities are CLI verbs in `gsd-tools.cjs`, which is already installed on both runtimes by `bin/install.js`. **No new Codex parity wiring is needed at the CLI level.** What IS needed:

1. Any references to the new verbs in agent-facing Markdown (`knowledge-surfacing.md`, agent spec files) must be unconditional (not inside `if [ -d ".claude" ]` guards).
2. Installed `.claude/get-shit-done/references/knowledge-surfacing.md` and `.codex/get-shit-done-reflect/references/knowledge-surfacing.md` must come out identical (modulo path rewrites) after `node bin/install.js`.
3. The post-install parity verification (SENS-06) should already catch divergence; plan should verify it does.

**Planner:** Do not add any Codex-specific branches for KB verbs. If you find yourself tempted, re-read the 58.1 CONTEXT.md — it's exactly that pattern.

## Open Questions

### Resolved by this research

| Question | Resolution |
|---|---|
| Minimum `kb query` / `kb search` API surface? | See R1 below: `kb query` filters by severity/lifecycle/project/tag/since; `kb search` is FTS5 MATCH over body. `--format json` mandatory for agent consumption. |
| Minimum FTS5 wiring? | External-content contentless rewrite, `content='signals'`, `content_rowid='rowid'`, `tokenize='porter unicode61'`, three AFTER triggers, `INSERT INTO signal_fts VALUES('rebuild')` on migration. Empirically verified on node:sqlite v22.22.1. |
| Exact repair migration for the 107 `[object Object]` edges? | Three-part: (1) fix the guard in `extractLinks()`; (2) walk source `.md` files, null-out bare `recurrence_of:` fields; (3) `kb rebuild`, verify `edge_integrity.recurrence_of.malformed` is 0. See Pitfall 5. |
| Edge-integrity contract in `kb rebuild` output? | Pattern 3 above pins the column shape and exit-code semantics. |
| `kb link` split? | `kb link show <id> [--outbound|--inbound|--both]` (read), `kb link create/delete <src> <tgt> --type <t>` (write). See Pattern 4. |
| Reconciliation decision for the bash script? | REPLACE with `kb transition`; deprecate script with one-cycle sunset. Justified by the Linux `sed -i ''` bug that breaks half the user base today. |
| Knowledge-surfacing.md update shape? | Example 3 in Code Examples above sketches the §2.1 rewrite. Lesson references removed systematically. Fresh-clone path uses `grep`, not `rg`. |
| Fresh-clone fallback? | `grep` over markdown files. Do NOT auto-rebuild on first surfacing call — rebuild is a side effect agents should not trigger implicitly. |
| Testing strategy? | Unit tests per verb; one integration test that runs all seven requirements against a synthetic 5-signal corpus; one regression test that runs `kb rebuild` against the live 278-signal corpus inside CI and asserts `malformed=0, orphaned<=5` post-repair. Fork-vs-upstream: all new code is fork-owned (`lib/kb-*.cjs`), so tests live in the fork test suite (`npm run test:upstream:fork` is the right home). |
| Cross-runtime parity? | No new parity plumbing needed; verify installer rewrites `.codex/` in parallel with `.claude/`. |
| Does `idx_signal_links_target` already exist? | No. `.schema` output shows only `idx_signals_*` indexes. Add in `initSchema()`. |
| Does `node:sqlite` FTS5 work on our Node version? | Yes. Empirically verified 2026-04-20 on v22.22.1. Prints ExperimentalWarning to stderr. |

### Genuine gaps

| Question | Criticality | Recommendation |
|---|---|---|
| How much of the lifecycle transition validation logic (state-machine legality per `strict`/`flexible`/`minimal`) should `kb transition` enforce in-process, vs. delegate to `frontmatter validate --schema signal`? | Medium | Accept-risk and defer to planner: the safe default is in-process validation using the transition table from `knowledge-store.md:213-225`. If integration surface becomes awkward, split in a follow-up. |
| When `kb transition X remediated` fires, should it also update `remediation.resolved_by_plan` if context is available? | Medium | Defer: Phase 59 `kb transition` takes `--reason` only; the plan-triggered remediation path lives in `collect-signals` workflow and owns plan-context; keep responsibilities split. |
| What happens to `kb health` exit code when each of the four checks disagrees (e.g., edge-integrity passes but lifecycle-vs-plan fails)? | Medium | Accept-risk: non-zero exit if any check fails; each check prints its own section. Scripts can `| grep -E 'FAIL|PASS'` per check. |
| Does the planner keep `kb migrate` or subsume it into `kb repair`? | Low | Keep separate. `kb migrate` is a one-shot `source → detection_method + origin` done migration (already shipped per KB-09). `kb repair --malformed-targets` is Phase 59's new one-shot. Different concerns. |
| Should `kb query` support boolean operators (`--tags "auth AND jwt"`)? | Low | Defer to planner; recommend simple AND of filters first, richer boolean in KB-16. |
| Does `kb health --dual-write` sample N signals or check all 278? | Low | Planner discretion. Recommend: sample 20 by default, `--all` flag for full scan. |
| When `kb.db` is deleted mid-session, should surfacing agents rebuild or degrade to grep? | Low | Degrade to grep; rebuild is a conscious maintenance action, not an implicit side effect of surfacing. |

### Still open (would need a spike or external investigation)

| Question | Why I could not close it | Criticality |
|---|---|---|
| Are there other silent-corruption bug classes like the `[object Object]` one, for `qualified_by` / `superseded_by` / `related_signals` where the YAML parser coerces a non-string value? | Required corpus-wide YAML validation walk; the audit §13 explicitly lists this as unknown. I verified the 107 `recurrence_of` cases are the only `[object Object]` cases today (the live query only returned 107), but the same guard gap exists at `kb.cjs:512-518`, `:521-523`, `:526-531`. | LOW — if the cause (non-string YAML values coerced to `{}`) only hit `recurrence_of`, the other four link-type paths happen to be unused. Once `qualified_by` edges start being written, the same bug could recur. **Recommendation:** Apply the `typeof === 'string'` guard uniformly in the repair (not just for `recurrence_of`), so the fix is one-shot across all four link types. |
| Whether the 15 existing `remediated` signals were transitioned by the bash script (broken on Linux), by manual editing, or by the synthesizer. | Required `git log -p` per signal file; out of research scope. | LOW — does not affect Phase 59 scope; relevant only for historical provenance of the 15 signals. |
| Whether agents will actually call `kb link show --inbound` consistently once it exists (Pitfall C2 precedent suggests they may not). | Affordance is necessary but not sufficient per audit §3.1 C4b. Empirical only — post-phase observation. | MEDIUM — not blocking but informs whether KB-08 needs reinforcement. Recommendation: write the surfacing protocol so inbound-edge fetch is STRUCTURAL (mandatory), not advisory. |

## Deferrals (for GATE-09 scope-translation ledger consumption)

Per D-10 (goal SC-7 + audit §7.2), Phase 59 explicitly defers these to downstream children. Copy these verbatim into the phase CONTEXT.md and then the GATE-09 ledger at phase close:

| ID | Deferral | Load-bearing? | Downstream phase (tentative) | Rationale |
|---|---|---|---|---|
| KB-12 | Edge-as-entity model (audit §3.2 Option 2) | Yes | Phase 62 or v1.21 | Too large to fit Phase 59; principled fix for target-blindness, edge provenance, and heterogeneity. Option 1 (this phase) gives the operational unblock while the question is unresolved. |
| KB-13 | Retrieval attribution (`retrieval_count`, `last_retrieved` writeback) | Yes | Phase 60.1 or later | Depends on measurement infrastructure still stabilizing. |
| KB-14 | Non-signal artifact indexing (deliberations, audits, reflections as first-class KB entries) | Yes | v1.21 | Ontology question (claim-type ontology deliberation) must land first. |
| KB-15 | Federation substrate (`origin_kb` column, MCP server wrap) | No | v1.22+ | Out of v1.20 scope; MCP-first alternative existing research already rejected for now. |
| KB-16 | Edge vocabulary extension (`corroborates`, `refines`, `contradicts`, `replaces`, `improves-framing`; transitivity rules) | No | Deferred indefinitely | Names audit §5.2 / §5.3 gaps. Not load-bearing — current four-type vocabulary suffices for the immediate surfacing problem. |
| KB-17 | Contested / under-review signal lifecycle state | No | Deferred indefinitely | Audit §4.2 raised this; subsumed by KB-12 via `contested_by` edges if that path is taken. |

## Recommendations to the planner (concrete, ordered)

R1. **Start with the repair migration**, not with new verbs. `kb repair --malformed-targets` comes first so that KB-04d's "fail on malformed after migration" gate is meaningful. Phase 59 should not ship a `kb rebuild` that reports malformed=107 as a feature.

R2. **Add `idx_signal_links_target` in `initSchema()`** with `CREATE INDEX IF NOT EXISTS`. Idempotent. No migration story needed.

R3. **Split `kb link` verb explicitly.** Preferred shape: `kb link show`, `kb link create`, `kb link delete`. Avoid flag-driven mode switching on `kb link`.

R4. **Implement `kb transition` BEFORE retiring the bash script.** Keep `reconcile-signal-lifecycle.sh` as-is for one cycle (sunset). Update `execute-phase.md` to call `kb transition` per signal (not per phase). Mark the bash script as deprecated in its header comment.

R5. **FTS5 shape: external-content contentless rewrite, porter+unicode61 tokenizer, `content='signals'`, `content_rowid='rowid'`.** Three AFTER triggers, `INSERT INTO signal_fts VALUES('rebuild')` on schema version bump. Verified working.

R6. **`kb health` as four independent checks**, each emits PASS/FAIL + count + remediation pointer. Non-zero exit on any FAIL. No dependencies between checks.

R7. **Agent surfacing protocol rewrite in `knowledge-surfacing.md`**: the planner should treat this as a significant rewrite, not a search-and-replace. Specifically: §1 scope, §2.1 step-by-step, §2.2 index format reference, §7 spike dedup (keeps spike logic but removes lesson interaction), §8 agent-specific behavior (remove lesson rows / add reflection rows). Keep §3 relevance matching, §4 freshness, §5 token budget, §6 citation format, §9 knowledge chain, §10 progressive disclosure, §11 debug mode.

R8. **Testing shape:** one unit test per new verb (vitest, CLI smoke only); one integration test against a synthetic corpus under a `.planning-test/` fixture; one regression test against the live `.planning/knowledge/kb.db` (asserts `kb rebuild` succeeds with 0 malformed post-repair). Live-corpus regression is the 57.8 `live-kb-upgrade-verification-pattern` applied here.

R9. **Do not add any new agent-spec Codex conditional.** All new verb references in agent docs are unconditional. Post-install parity check (SENS-06) catches divergence.

R10. **Enumerate KB-12..KB-17 as explicit deferrals in the phase CONTEXT.md** when `/gsdr:discuss-phase 59` runs. Copy-ready table in §Deferrals above.

R11. **Signal freshness dates:** the research doc used "267 signals" baseline. Live today is 278. The plan should re-measure in the pre-migration check: `sqlite3 .planning/knowledge/kb.db "SELECT COUNT(*) FROM signals"`.

R12. **Apply the `typeof === 'string'` guard uniformly across `extractLinks()` for all four link types**, not just `recurrence_of`. Cheap insurance against recurrence of the bug class for `qualified_by` once edges start being written.

## Sources

### Primary (HIGH confidence)

- `get-shit-done/bin/lib/kb.cjs` (1,002 lines, read in full) — current SQLite implementation, extractLinks guards, dual-write transaction pattern.
- `get-shit-done/bin/reconcile-signal-lifecycle.sh` (read in full) — confirmed BSD-sed bug.
- `get-shit-done/references/knowledge-surfacing.md` (read in full) — target of KB-08 rewrite.
- `agents/knowledge-store.md` v2.1.0 (read in full) — mutability boundary (§10), lifecycle state machine (§4.2), frozen-field list (lines 555-567).
- `.planning/audits/2026-04-20-phase-59-kb-architecture-gap-audit/phase-59-kb-architecture-gap-audit-output.md` (read in full) — nine targeted strengthening recommendations, six downstream deferrals, one-way relation design options.
- `.planning/research/kb-architecture-research.md` (read in full) — architecture decision (Option C: File + SQLite now, MCP later).
- `.planning/research/PITFALLS.md` C1/C2/N1/N5/M2 (read in full) — dual-write hazard, lifecycle-wiring silent failure, kb.db gitignore, source field ambiguity, schema migration hazard.
- `.planning/deliberations/signal-lifecycle-closed-loop-gap.md` (read in full) — the 2026-03-04 deliberation that produced the bash reconcile script; explicitly names the "structural not advisory" principle.
- `.planning/phases/58.1-codex-update-distribution-parity/58.1-CONTEXT.md` (read in full) — XRT-01 parity pattern; proves CLI-only parity (no hooks) is an explicit precedent.
- `.planning/knowledge/index.md` (read in part) — live KB header: 286 entries, 278 signals, 8 spikes. No lessons dir.
- `.planning/knowledge/signals/get-shit-done-reflect/2026-04-20-live-kb-upgrade-verification-pattern.md` (read in full) — Phase 57.8 live-repo regression pattern applies directly.
- `.planning/knowledge/signals/get-shit-done-reflect/2026-04-20-plan-03-live-kb-migration-failure.md` (read in full) — concrete precedent: migration bug found during live-upgrade that fresh-fixture tests missed.
- Direct `sqlite3` queries against `.planning/knowledge/kb.db` on 2026-04-20 — all corpus numbers above.
- `node -e "…FTS5 test…"` against in-memory SQLite — empirical FTS5 verification.

### Secondary (MEDIUM confidence — WebFetch verified against official sources)

- https://nodejs.org/api/sqlite.html — node:sqlite DatabaseSync API, ≥ v22.5.0 required.
- https://www.sqlite.org/fts5.html — FTS5 external-content contentless rewrite syntax and trigger pattern.

### Tertiary (LOW confidence)

None. This phase is fully grounded in live-state measurement and in-tree code.

## Knowledge Applied

Per the global knowledge-surfacing protocol, I applied the mandatory initial KB query before external research.

| Entry | Type | Summary | Applied To |
|---|---|---|---|
| sig-2026-04-20-live-kb-upgrade-verification-pattern | signal (positive/good-pattern) | Phase 57.8 established: migrations must verify against the live pre-existing kb.db, not just fresh fixtures | Architecture Patterns (R8 live-corpus regression test); Pitfalls 5 and 7 |
| sig-2026-04-20-plan-03-live-kb-migration-failure | signal (negative/deviation) | Concrete precedent: Phase 57.8 hit a real migration bug against live kb.db that fresh fixtures missed; upgrade-order ordering mattered | R1 (repair before new verbs); Pitfall 7 (schema version migration sync) |
| sig-2026-02-11-kb-data-loss-migration-gap (remediated) | signal (critical/remediated) | Historical KB data loss — the exact failure class Pitfall C1 protects against | Justifies R4 (keep bash script as deprecated fallback for one cycle); Pattern 2 (dual-write transaction) |
| sig-2026-02-22-knowledge-surfacing-silently-removed (remediated) | signal (critical/remediated) | Precedent: knowledge-surfacing path was silently broken by install before; re-authored as a structural concern | R7 (rewrite is load-bearing, not search-and-replace) |
| sig-2026-03-04-signal-lifecycle-representation-gap | signal (critical/open) | Origin of the `resolves_signals` wiring problem; lifecycle transitions are agent-instructions that silently don't fire | R4 (programmatic transition, not agent instruction); Pitfall 2 (Linux sed portability) |
| .planning/deliberations/signal-lifecycle-closed-loop-gap.md | deliberation (concluded 2026-03-04) | Produced `reconcile-signal-lifecycle.sh`; Options A+B+C; explicitly named "structural over advisory" principle | Entire design; R4 reconciliation decision; Pitfall 2 |
| spikes (all 8) | spike | None matched Phase 59's question (all 8 are telemetry / measurement spikes from phases 57.5–57.8) | No spike dedup available; no existing spike answers a Phase 59 question |

Prior knowledge inside `.planning/knowledge/` was queried and applied; the queries and full-text searches I did used `grep` manually (no `kb search` exists yet — that's what we're building). No lessons were surfaced because none exist (deprecated, 0 entries globally — confirms audit §C2).

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — FTS5 path empirically verified on the target Node version; all libs already in-tree; rejected alternatives directly grounded in Phase 57.7 drop comment and current `kb.cjs`.
- Architecture: HIGH — Patterns 1–5 all derivable from existing code + SQLite docs; one index addition is non-controversial; read/write verb split is explicit in ROADMAP Success Criteria.
- Pitfalls: HIGH — pitfalls 1, 2, 4, 5, 7, 9 are grounded in live code or measurement; pitfalls 3, 6, 8 are pattern-match from prior project experience (`knowledge-surfacing-silently-removed`, `kb-data-loss-migration-gap`).
- Cross-runtime parity: HIGH — Phase 58.1 precedent is directly applicable; no new substrate needed.
- Reconciliation decision (bash vs `kb transition`): HIGH — the Linux sed bug is empirically verified; the recommendation is not a judgment call.
- Genuine gaps (table above): MEDIUM — named honestly; only the `qualified_by`/`superseded_by` silent-corruption gap would benefit from a corpus-wide YAML audit spike, which R12 proposes as a cheap prophylactic instead.

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (30 days); re-verify the live kb.db counts at plan-start (the corpus grew from 267 to 278 in 12 days between `kb-architecture-research.md` and this document).

**Metadata disclosure:** This research was performed by `gsdr-phase-researcher` agent (Opus 4.7 1M). KB query step was performed by manual `Grep` + file reads, since the `kb query` verb that this phase proposes to build does not yet exist. The stronger knowledge-surfacing protocol this research is proposing (SQL-first with grep fallback) would have caught some relevant signals faster, but the outcome was the same because the manual grep over 278 entries terminated in reasonable time. This is part of why Phase 59 matters.
