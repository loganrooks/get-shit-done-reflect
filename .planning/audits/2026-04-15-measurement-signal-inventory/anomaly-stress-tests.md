---
date_started: 2026-04-16
audit_subject: codebase_forensics
audit_orientation: anomaly_stress_testing
audit_delegation: self (single-agent, sequential)
scope: "Stress-test each unresolved anomaly in synthesis-output.md §5 Anomaly Register (A1, A2, A5, A6, A7, A8), as identified in correction-and-extensions-2026-04-16.md §8 OQ9 and enumerated in pre-57.5-handoff.md §E. Goal: verify or falsify each anomaly's framing using the same research+empirical+intervention cascade that was applied to A4. Findings flow into MEAS- governance updates (A1–A5 in the handoff) before Phase 57.5 planning."
auditor_model: claude-opus-4-6
triggered_by: "pre-57.5-handoff.md §E — after A4's falsification revealed that the original audit had no self-correcting mechanism for findings contradicted by later evidence. Handoff §E flagged A1, A2, A5, A6, A7, A8 as comparable candidates for falsification."
ground_rules: "core+exploratory, inheriting Rules 1 and 2 from framing.md. Per-anomaly epistemic statuses stated explicitly. Status downgrade prohibition respected: synthesis-output.md is not edited; this file accrues findings per anomaly and resolves each with a corrected claim + MEAS- implication."
tags: [measurement, signal-inventory, anomaly-stress-tests, phase-57.5-prereq, out-of-workflow]
stress_tests:
  - E1 — A7 config.json automation stats (complete; GSDR-native)
  - E2 — A8 kb.db SQLite signal index (complete; GSDR-native; surfaced 2 latent defects)
  - E3 — A5 user_message_count overcount (complete; Claude-runtime; surfaced session-meta lifecycle defect)
  - E4 — A1 session-meta token semantics (complete; Claude-runtime; reframed by E5)
  - E5 — A2 session-meta generation frozen (complete; reframed as /insights-driven; surfaced facets/*.json)
  - E5.8 — empirical /insights test (complete; two-path write model + facets budget filter)
  - E6 — A6 Codex compaction vs Claude (complete; Claude-runtime; capability-layer falsification of A6)
predecessor_audits:
  - ./synthesis-output.md
  - ./correction-and-extensions-2026-04-16.md
  - ../2026-04-10-phase-57-vision-drop-investigation/
---

# Anomaly Stress Tests

This document accumulates findings from stress-testing the unresolved anomalies in `synthesis-output.md` §5. Each section follows the correction doc's format for A4: *Original Claim (preserved verbatim) → Evidence Chain → Corrected Claim → MEAS- Implications*.

## 0. Deviation Testimony (abbreviated)

Per user-memory "Deviation Testimony Required": this document exists outside the original 4-lane workflow because the workflow had no "follow-up falsifications" lane. `correction-and-extensions-2026-04-16.md` §0 already expanded this point in detail; this document is a continuation of that same deviation, scoped to the remaining A-items rather than just A4.

The methodological gap being patched: single-shot audits with no mechanism for late-breaking contradictions. The goal of this document is to close that gap for this specific audit before its findings harden into Phase 57.5 MEAS- requirements.

---

## E1. A7 Stress Test — config.json automation stats

**Completed:** 2026-04-16
**Effort:** ~20 min inspection + code read + writeup
**Outcome:** A7 framing is accurate as a surprise; the underlying stats system works correctly; two latent gaps surfaced that matter for MEAS-.

### E1.1 Original Claim (preserved verbatim from synthesis-output.md §5)

> **A7: config.json automation stats — undocumented measurement source (Lane 4 surprise)**
>
> Lane 4 found `.planning/config.json` contains `automation.stats` with per-sensor fire counts, skip counts, and last-triggered timestamps. This was not documented anywhere. The `signal_collection` sensor shows `fires: 0, skips: 13` — the automated collection never fires.
>
> **Cross-lane implication:** The GSD harness itself has a built-in measurement point for automation health. This is directly relevant to the pipeline integrity loop and is available NOW with zero extraction cost.

### E1.2 Evidence Chain

#### Layer 1: Direct file inspection of `.planning/config.json`

**Status: verified, current as of 2026-04-16.**

`automation.stats` block from current project config:

| Feature key | fires | skips | last_triggered | last_skip_reason |
|---|---|---|---|---|
| signal_collection | 0 | 13 | null | level-1 |
| reflection | 0 | 7 | null | disabled |
| sensor_artifact | 5 | 0 | 2026-04-10T21:47:23.082Z | null |
| sensor_ci | 5 | 0 | 2026-04-10T21:47:23.215Z | null |
| sensor_git | 5 | 0 | 2026-04-10T21:47:23.153Z | null |
| sensor_log | 2 | 0 | 2026-04-10T21:47:23.289Z | null |

Adjacent config state:
- `automation.level: 1` (nudge)
- `automation.reflection.auto_reflect: false`
- `automation.reflection.phases_since_last_reflect: 10`
- `automation.reflection.last_reflect_at: 2026-03-07T05:46:29.846Z`

#### Layer 2: Code trace — how stats get written

**Status: verified, from `get-shit-done/bin/lib/automation.cjs` and workflow files.**

`automation track-event <feature> <fire|skip> [reason]` (automation.cjs:190–234) is the single write path. It:

1. Reads `.planning/config.json`
2. Initializes `automation.stats[<feature>] = {fires: 0, skips: 0, last_triggered: null, last_skip_reason: null}` if missing
3. Increments `fires` and sets `last_triggered = now()` on a fire event
4. Increments `skips` and sets `last_skip_reason = reason` on a skip event
5. Atomic write (tmp + rename)

Call sites found in workflows:
- `execute-phase.md` postlude — tracks `signal_collection`, `health_check`, `reflection`
- `collect-signals.md` — tracks `sensor_<name>` per invoked sensor (fire on success; skip on parse-error/agent-error/timeout)

#### Layer 3: Why signal_collection has fires=0, skips=13

**Status: verified via code read.**

`execute-phase.md:439–445` branches the signal-collection postlude on effective automation level:

| Level | Name | Behavior |
|---|---|---|
| 0 | manual | Skip. `track-event signal_collection skip "level-0"` |
| 1 | nudge | Display nudge, skip. `track-event signal_collection skip "level-1"` |
| 2 | prompt | Ask user y/n |
| 3 | auto | Proceed |

Project config has `automation.level: 1`. Every completed phase execution therefore increments `signal_collection.skips` with reason `level-1`. 13 skips = 13 post-Phase-37-ish phase completions under the current level. This is **working as designed**, not a bug.

Similarly, `reflection: fires=0, skips=7, last_skip_reason: disabled` reflects `automation.reflection.auto_reflect: false`. Working as designed.

#### Layer 4: Why sensor_* entries show fires=5

**Status: verified from config timestamps.**

All four sensors share last_triggered within ~200 ms of each other on `2026-04-10T21:47:23`. Interpretation: one invocation of `/gsd:collect-signals` fans out to all four sensors in parallel. The `fires: 5/5/5/2` pattern indicates 5 manual `/gsd:collect-signals` runs historically, with `sensor_log` added later and firing only on the 2 most recent runs.

Manual `/gsd:collect-signals <phase>` invocations bypass the `signal_collection` level gate (they are the user explicitly running the command). So sensor_* fires via a **different call path** than `signal_collection.fires`. The two metrics measure different things:

- `signal_collection.fires` = how many times the **automatic postlude** ran to completion
- `sensor_<name>.fires` = how many times **that sensor** was invoked via any path (manual or auto)

The synthesis claim "the automated collection never fires" is correct *for the automatic postlude*, but the project does have 5 successful manual collection runs that are captured in the sensor_* stats. The original A7 text didn't distinguish these call paths.

### E1.3 Corrected Claim

**A7 (stress-tested, 2026-04-16):** The `automation.stats` block in `.planning/config.json` is an accurate, working, ready-made measurement surface. Its schema, call paths, and semantics are:

1. **Schema per feature key:** `{fires: int, skips: int, last_triggered: ISO8601|null, last_skip_reason: string|null}`. Auto-populated by `automation track-event`, atomic-writes on every call.
2. **Feature keys tracked today:** `signal_collection`, `reflection`, `health_check`, `sensor_artifact`, `sensor_ci`, `sensor_git`, `sensor_log`. Extended by adding a new track-event call site (e.g., new sensor = new key).
3. **Skip reason enum (observed in workflows):** `level-0`, `level-1`, `level-2`, `reentrancy`, `lock-race`, `disabled`, `threshold-not-met`, `insufficient-signals`, `session-cooldown`, `collection-error`, `parse-error`, `agent-error`, `timeout`, `context_deferred`. Free-form string; not currently validated at write.
4. **"Never fires" is configurable, not broken.** `signal_collection.fires=0` with `skips=13 level-1` means the user has set `automation.level: 1` (nudge). Changing `automation.level` to 3 would flip this to `fires≥0`.
5. **Two call paths coexist:** (a) workflow postlude (gated by level) tracks `signal_collection` / `reflection` / `health_check`; (b) manual command execution (ungated) tracks `sensor_*`. They report on different things. A single "automation health" dashboard needs to surface both.

**Latent gaps surfaced:**

- **Gap 1 (documented but unimplemented):** `last_signal_count` is read by `sensors list` (`sensors.cjs:147`) and planned in Phase 38's 38-02-PLAN.md §5 as "the orchestrator writes last_signal_count directly to config after sensor output is parsed." **Nothing writes this field today** (grep confirms: read in sensors.cjs and test fixture only). Per-sensor signal yield is therefore not extractable from automation.stats and must be derived from kb.db (A8) or recomputed by counting sensor output.
- **Gap 2 (schema ambiguity):** skip_reason is free-form. Workflow files define a de-facto enum, but track-event accepts any string. A malformed reason ("lvl1", "level1", "LEVEL-1") would write without error. For MEAS- to group skips by cause robustly, the extractor either needs a canonical reason vocabulary check or an enum at the write layer.

**Epistemic status:** code-read + file-inspection verified. Not intervention-tested (would need to change `automation.level` and observe a fire event; deferred because unnecessary for resolving the anomaly).

### E1.4 MEAS- Implications

**Adds to correction-and-extensions-2026-04-16.md §6 as a new proposed requirement:**

#### §6.7 Automation-health extractor (new first-order requirement)

The extractor registry shall include an `automation_health` extractor that reads `.planning/config.json.automation.stats` and produces:

| Field | Source | Meaning |
|---|---|---|
| `feature_key` | stats object key | Which automation feature (signal_collection, sensor_*, reflection, health_check) |
| `fires` | `stats[k].fires` | Successful invocation count |
| `skips` | `stats[k].skips` | Skipped invocation count |
| `skip_rate` | `skips / (fires + skips)` | Automation-deferral ratio per feature |
| `last_triggered` | `stats[k].last_triggered` | Recency of successful run (nullable) |
| `last_skip_reason` | `stats[k].last_skip_reason` | Most recent skip cause (nullable) |
| `call_path` | derived: `signal_collection|reflection|health_check` → postlude; `sensor_*` → user-invoked | Disambiguates the "never fires" cases |
| `configured_level` | `automation.level` + `automation.overrides[feature]` | Explains why skip_rate may be high by design |

**Loops served:** Pipeline Integrity (primary), Agent Performance (secondary — sensor fires per phase is an agent-performance proxy).

**Preconditions:** `.planning/config.json` exists. No model-family or dispatch-context gating needed. Zero extraction cost — pure file read.

**Priority:** adds to synthesis §8.1 Priority 1 (trivial, high coverage) as item **15**.

#### §6.8 Implement `last_signal_count` write path (Gap 1 closure)

Phase 38 specified this but never implemented the write. Two options:
- (a) Extend `automation track-event` to accept `--metadata signal_count=N` and merge into stats object.
- (b) Have `collect-signals.md` workflow run `config-set automation.stats.sensor_<name>.last_signal_count <N>` directly after sensor output is counted.

Either closes the gap. Option (b) keeps track-event's schema stable; option (a) is a cleaner write API. Recommend (a) if Phase 57.5 touches the track-event contract anyway; (b) otherwise.

**Priority:** synthesis §8.1 Priority 2 (moderate effort, high value) as item **16** — gated on Phase 57.5's broader track-event changes.

#### §6.9 Canonicalize skip_reason vocabulary (Gap 2 closure)

Define the skip_reason enum explicitly in `feature-manifest.json` or a new `automation-schema.json`. Validate at track-event write time (warn, don't fail — backward-compatible). Downstream: the `automation_health` extractor groups by canonical reason.

**Priority:** synthesis §8.1 Priority 3 (enabling infrastructure).

### E1.5 Implications for Governance (pre-57.5-handoff §A1)

Handoff A1 lists 7 MEAS- requirement candidates after spike 010. E1 adds three more (§6.7, §6.8, §6.9 above). Recommended integration:

- **§6.7 is first-class MEAS-** because it's zero-cost, cross-cutting, and lands cleanly on the Pipeline Integrity loop (one of the two loops synthesis §8.2 flagged as strongest).
- **§6.8 is deferrable** — useful but requires a code change; should be scoped in if Phase 57.5 is touching track-event, else parked.
- **§6.9 is low priority** — nice-to-have for extractor robustness; not load-bearing.

No existing A1 candidate is **superseded** by E1 findings. The three spike-010-informed features (composite thinking extractor, settings-state snapshot, three-level gate) all remain as-is.

### E1.6 Falsification Pass (2026-04-16, retroactive)

Three targeted tests against E1's load-bearing claims.

#### Test 1 — "`last_signal_count` is never written"

**Method:** broadened grep to include `config-set`, direct SQL writes, agent files, hook scripts, and any indirect path. Also checked `cmdConfigSet` dispatcher in gsd-tools.cjs.

**Result — claim survives.** Only one reference to `last_signal_count` exists (the read in `sensors.cjs:147`). No write path via track-event, config-set, or any other mechanism. Phase 38 plan's Task 5 was never implemented.

#### Test 2 — "5 collect-signals runs, each spawning 4 sensors in parallel"

**Method:** examined fires counts and timestamp spread across all tracked sensors.

| sensor | fires | last_triggered |
|---|---:|---|
| sensor_artifact | 5 | 2026-04-10T21:47:23.082Z |
| sensor_git | 5 | 2026-04-10T21:47:23.153Z (+71ms) |
| sensor_ci | 5 | 2026-04-10T21:47:23.215Z (+133ms) |
| sensor_log | 2 | 2026-04-10T21:47:23.289Z (+207ms) |

**Result — claim softened.** Timestamp spread of 207ms is consistent with ONE parallel dispatch in the most recent run. But `sensor_log` fires=2 while others fires=5 — so **sensor_log was NOT invoked on 3 of the 5 historical runs**. Likely sensor_log was added in a later GSDR version (v1.19+, consistent with Phase 47+) and retroactively fires only for post-addition runs.

**Refined claim:** "The most recent run invoked all 4 sensors in parallel (~200ms spread). Earlier runs invoked only 3 sensors. The historical fires count is not uniform across sensors." This is a minor refinement, but the MEAS- implication matters: the `automation_health` extractor (§6.7) should NOT assume parity across feature keys when computing aggregate health — some sensors are newer and have less history by design, not by failure.

#### Test 3 — "skip_reason is free-form, no validation"

**Method:** read `cmdAutomationTrackEvent` in automation.cjs directly.

```js
stats.last_skip_reason = reason || 'unknown';
```

**Result — claim survives.** Free-form string, no enum check, no validation. "unknown" is the default if no reason provided. Confirmed.

#### Net effect on E1

All three load-bearing claims survive falsification, with one refinement:
- Test 2 softened the "5 runs × 4 sensors" inference. The new, cleaner statement: **sensor_log's lower fires count reflects its later introduction, not a skip-pattern defect.** MEAS- extractors should handle asymmetric historical coverage per feature key.

---

## E2. A8 Stress Test — kb.db SQLite signal index

**Completed:** 2026-04-16
**Effort:** ~25 min (schema read + code trace + rebuild test)
**Outcome:** A8 framing is accurate as a surprise (the DB exists and is queryable), but the underlying infrastructure has **two serious, previously-undocumented defects**: (1) FTS5 full-text search is declared but never populated, and (2) the rebuild automation is wired to the wrong script in every workflow. Both need MEAS- governance attention.

### E2.1 Original Claim (preserved verbatim from synthesis-output.md §5)

> **A8: kb.db SQLite database — ready-made signal index (Lane 4 surprise)**
>
> `.planning/knowledge/kb.db` is a SQLite database indexing all 255 signal frontmatter fields. Built by Phase 56 infrastructure. Enables SQL queries against the signal corpus without grep/regex extraction.
>
> **Cross-lane implication:** The signal quality loop already has a queryable data store. The measurement infrastructure does not need to build signal extraction from scratch — it can query kb.db directly for signal metrics.

### E2.2 Evidence Chain

#### Layer 1: Schema inspection

**Status: verified via `sqlite3 kb.db .schema`.**

Tables present:

| Table | Purpose | Row count (this project) |
|---|---|---|
| `signals` | 23-column signal metadata from frontmatter | 254 |
| `signal_tags` | signal_id × tag join table | 1,165 |
| `signal_links` | signal_id × target_id × link_type (directed relations) | 278 |
| `spikes` | 9-column spike metadata | 7 (before rebuild) / 8 (after) — *see Layer 3* |
| `spike_tags` | spike_id × tag join table | — |
| `meta` | key/value: `schema_version`, `last_rebuilt`, `signal_count`, `spike_count` | 4 rows |
| `signal_fts` | FTS5 virtual table declared with `content=signals, content_rowid=rowid` | **0 rows (broken)** |

Indexes: `severity`, `lifecycle_state`, `project`, `created`, `polarity`, `status` on the signals table.

**Schema is comprehensive.** 23 signal columns cover every frontmatter field MEAS- might need: id, file_path, project, severity, lifecycle_state, polarity, signal_category, disposition, signal_type, detection_method, origin, created, updated, phase, plan, runtime, model, gsd_version, occurrence_count, durability, confidence, status, content_hash.

#### Layer 2: Sample aggregation queries

**Status: verified.** Representative MEAS--style queries:

```sql
SELECT severity, COUNT(*) FROM signals GROUP BY severity;
-- critical 39, minor 68, notable 147

SELECT polarity, COUNT(*) FROM signals GROUP BY polarity;
-- negative 183, neutral 9, positive 62

SELECT runtime, COUNT(*) FROM signals GROUP BY runtime;
-- (empty) 42, claude-code 205, codex-cli 7

SELECT project, COUNT(*) FROM signals GROUP BY project;
-- (empty) 11, get-shit-done-reflect 243
```

Aggregations by signal_category, durability, confidence, status all work. Joins across `signal_tags` and `signal_links` work. All standard SQL. The schema supports MEAS- signal-quality features (severity distribution, polarity balance, runtime partition, project cross-reference) with zero extraction effort.

**One caveat surfaced by the empty-runtime count**: 42 signals (16%) have empty `runtime` and 11 have empty `project`. These are pre-typed-signal entries from earlier project phases that predate the field schema. MEAS- extractors need to either (a) backfill these, or (b) treat empty-string as a third state distinct from null.

#### Layer 3: Freshness — the kb.db is stale

**Status: verified via file comparison + empirical rebuild test.**

Before this stress-test ran:

| Side | Count | Notes |
|---|---|---|
| On-disk signals/**/*.md | 254 | matches kb.db |
| On-disk spikes/**/*.md | **8** | spike 010 present (completed earlier today) |
| kb.db `spikes` row | **7** | **spike 010 missing** |
| kb.db `meta.last_rebuilt` | 2026-04-16T05:32:28.446Z | ~2 hours before spike 010 finished |

After running `node get-shit-done/bin/gsd-tools.cjs kb rebuild --raw`:

```json
{"signals": 254, "spikes": 8, "added": 1, "updated": 0, "skipped": 261, "errors": 0}
```

The rebuild works correctly: content_hash-based skip for unchanged files, proper upserts for new/changed files, transactional. Spike 010 added on the first try. **The defect is not in the rebuild logic — it's in what triggers the rebuild.**

#### Layer 4: Root cause — the "rebuild" naming collision

**Status: verified via grep of all rebuild call sites.**

Two independent rebuild mechanisms exist in GSDR, with nearly identical names:

| Name | File | What it actually does |
|---|---|---|
| `kb-rebuild-index.sh` | `get-shit-done/bin/kb-rebuild-index.sh` | Writes **`index.md`** (markdown table of signals, spikes, lessons). Does NOT touch kb.db. |
| `gsd-tools.cjs kb rebuild` | `get-shit-done/bin/lib/kb.cjs` (`cmdKbRebuild`) | Writes **`kb.db`** (SQLite). Uses `better-sqlite3` / `node:sqlite`. |

Every workflow/agent call site invokes the `.sh` script:

- `agents/gsd-signal-synthesizer.md:293` — `bash ~/.gsd/bin/kb-rebuild-index.sh`
- `agents/gsd-spike-runner.md:318` — same
- `commands/gsd/signal.md:85–88` — same
- `commands/gsd/deliberate.md:113` — same
- `get-shit-done/bin/lib/automation.cjs:418` (regime-change hook) — same
- `get-shit-done/bin/reconcile-signal-lifecycle.sh:37–40` — same
- `tests/smoke/run-smoke.sh` (multiple) — same
- `tests/integration/kb-infrastructure.test.js` — tests `.sh` script behavior only

**Zero workflow call sites invoke `gsd-tools.cjs kb rebuild`.** The CLI command exists and works, but nothing ever runs it automatically. The SQLite database is rebuilt only when a human remembers to run it manually.

This explains the spike 010 miss cleanly: spike runner (`gsd-spike-runner.md:318`) called `kb-rebuild-index.sh` after writing spike 010's entry; markdown index got updated; kb.db did not. Same pattern applies to **every signal write** in the project — all the .sh hook fires, kb.db diverges further from disk each time.

#### Layer 5: FTS5 is structurally dead

**Status: verified via FTS query test.**

The FTS5 virtual table is declared in `kb.cjs:135`:

```sql
CREATE VIRTUAL TABLE IF NOT EXISTS signal_fts
USING fts5(id, title, body, content=signals, content_rowid=rowid);
```

Two design issues combine to make it non-functional:

1. **External-content mode with a backing table that lacks the columns.** FTS5 `content=signals` mode expects the `signals` table to have `title` and `body` columns. The `signals` table only has metadata columns (severity, lifecycle_state, etc.) — there are no `title` or `body` columns. FTS5 queries against the virtual table fail with "no such column: T.title."
2. **No insert path.** `cmdKbRebuild` never runs `INSERT INTO signal_fts (...)`. Even if the signals table had title/body columns, the FTS index would be empty because external-content FTS5 does not auto-populate — it needs either explicit INSERT statements after each signals insert, or CREATE TRIGGER statements. Neither exists.

The count query confirms it: `SELECT COUNT(*) FROM signal_fts;` returns 0, even though `signals` has 254 rows.

**Consequence:** any MEAS- requirement that relies on full-text search (e.g., "find all signals mentioning 'measurement infrastructure'") is blocked until FTS is fixed. Metadata aggregation queries are fine.

### E2.3 Corrected Claim

**A8 (stress-tested, 2026-04-16):** The `.planning/knowledge/kb.db` SQLite store is real, schematically comprehensive, and supports zero-effort MEAS- metadata queries. But two defects make it unsuitable as-is for the "ready-made signal index" role the synthesis audit assigned to it:

1. **Freshness is broken across all automation.** No workflow call site invokes the correct rebuild command. All call sites invoke `kb-rebuild-index.sh`, which rebuilds the markdown index only. The SQLite DB drifts from disk silently until a human manually runs `gsd-tools.cjs kb rebuild`. This is a naming-collision-induced bug: the `.sh` script has the name that workflow authors expect, so they wire it up, unaware that the actual DB uses a different rebuild path.
2. **FTS5 is declared but never populated.** External-content FTS5 mode was used, but the backing `signals` table doesn't have `title`/`body` columns AND no INSERT or TRIGGER path exists. The virtual table has zero rows and any query against it errors.

**What works today:**
- 23-column metadata aggregation queries
- Tag joins, link joins
- Content-hash-based incremental rebuilds (when manually invoked)
- `gsd-tools.cjs kb stats` for simple counts

**What does not work today:**
- Automatic kb.db freshness after signal/spike writes
- Any FTS search
- Any MEAS- feature that depends on "freshness is monotonic in wall-clock time"

**GSDR ownership:** unlike A4 (Claude runtime lever), both defects are in code we own. Both are fixable in Phase 57.5 or a prep phase without cross-vendor coordination.

**Epistemic status:** code-read + empirical-rebuild-test verified. Not audited for edge cases around concurrent rebuilds, partial transactions, or cross-project KB scenarios (`~/.gsd/knowledge/` fallback path).

### E2.4 MEAS- Implications

Adding three new proposed requirements to `correction-and-extensions-2026-04-16.md` §6:

#### §6.10 kb.db as a first-class MEAS- extractor source (new requirement)

The signal-quality loop's primary data surface shall be `kb.db`, not grep over signal frontmatter files. Justification:

- 23-column schema covers every field MEAS- needs
- Aggregations are 10–100× faster than grep
- Joins (signal_tags, signal_links) are impractical in markdown but trivial in SQL

**Extractor:** `kb_signal_stats` — wraps `gsd-tools.cjs kb stats` or issues SQL directly. Surfaces counts by severity, polarity, runtime, project, status, lifecycle_state; computes temporal features (signals-per-week, age of oldest active signal, etc.).

**Preconditions:** kb.db exists (true for all GSDR projects on v1.17+); kb.db is fresh (see §6.11).

**Priority:** synthesis §8.1 Priority 1 (trivial, high coverage) as item **17**.

#### §6.11 Fix kb.db freshness automation (new requirement — GAP, blocks §6.10)

**Problem:** no workflow call site invokes the correct SQL rebuild. Every signal write relies on automation that only rebuilds the markdown index.

**Two fix approaches:**

- **(a) Unify the rebuild command.** Have `kb-rebuild-index.sh` also invoke `node gsd-tools.cjs kb rebuild` internally (or vice versa). Single call site, two artifacts updated. Lowest-touch fix — no agent/workflow edits needed.
- **(b) Replace all call sites.** Change every agent/workflow that currently calls `kb-rebuild-index.sh` to also or instead call `gsd-tools.cjs kb rebuild`. Higher touch, but clearer contract.

Option (a) is recommended: one additional line in the .sh script unifies the two. Keeps workflow files stable. Requires only that every installation has the Node binary (already true per CHANGELOG.md requiring Node ≥22.5.0 for kb.db infrastructure).

**Priority:** synthesis §8.1 Priority 1. **Blocks §6.10** — kb.db as MEAS- substrate assumes fresh data.

**Signal:** this should also be logged as a project signal (sig-2026-04-16-kb-db-freshness-automation-missing) — it's a latent correctness defect, not just an anomaly.

#### §6.12 Fix or remove FTS5 (new requirement — GAP)

**Problem:** `signal_fts` virtual table is declared but never populated and references nonexistent columns.

**Three fix approaches:**

- **(a) Add `title`/`body` columns to signals table + INSERT path.** Compute title and body from signal file content during rebuild; store denormalized copy in signals. Use contentless FTS5 or rebuild FTS on each rebuild.
- **(b) Drop FTS5 entirely.** If full-text search is not a Phase 57.5 MEAS- requirement, remove the virtual table and declare the gap as "text search via ripgrep on signal files." This is what happens de facto today.
- **(c) Rewrite as contentless FTS5.** `CREATE VIRTUAL TABLE signal_fts USING fts5(title, body)` (no external content mode). Rebuild populates it explicitly.

Option (b) is the smallest change. Option (c) is the most sound if MEAS- needs full-text. Recommend (b) for Phase 57.5 and revisit when a concrete MEAS- feature actually needs FTS.

**Priority:** synthesis §8.1 Priority 3 (schema hygiene). Not blocking; cleanup.

### E2.5 Implications for Governance (pre-57.5-handoff §A1)

E2 adds three more MEAS- requirement candidates (§6.10, §6.11, §6.12), plus the implicit update to the signal inventory: **kb.db is a first-party MEAS- surface, fully GSDR-owned**, complementing the Claude runtime surfaces (JSONL, session-meta) that the audit also catalogued.

Combined with E1's three (§6.7, §6.8, §6.9), this is six new MEAS- candidates from the GSDR-native side. None of them depend on Claude runtime behavior, so none are gated on discuss-phase 57.5's "which loop leads" question — they can land in Phase 57.5 governance (A1–A5) straightforwardly.

**Recommended governance update:** A1 should split MEAS- into two subfamilies for clarity:
- `MEAS-RUNTIME-*` — extractors against Claude/Codex JSONL, session-meta, settings.json (from the original 4-lane audit + spike 010)
- `MEAS-GSDR-*` — extractors against config.json.automation, kb.db, signal files (from E1 + E2)

This split also clarifies the ownership axis: RUNTIME extractors are subject to Anthropic/OpenAI schema changes (A3-style era boundaries); GSDR extractors are subject to our own schema decisions (versioned via `manifest_version`).

### E2.6 Action Items (side-artifacts of E2)

- [ ] **Log sig-2026-04-16-kb-db-freshness-automation-missing** — latent correctness defect; workflows call the wrong rebuild script
- [ ] **Log sig-2026-04-16-fts5-declared-but-unused** — dead schema declaration; either fix or drop
- [ ] **Consider spk-2026-04-17-kb-db-unified-rebuild** — small spike to verify unifying the two rebuild paths doesn't break existing tests

These are not part of the stress-test deliverable but fall out of it. Left unchecked for the user to decide whether to capture as signals now or later.

### E2.7 Falsification Pass (2026-04-16, retroactive)

Three targeted tests against E2's load-bearing claims.

#### Test 1 — "NO workflow call site invokes the cjs rebuild"

**Method:** broadened grep to include phase planning docs, hook scripts, `package.json` scripts, CHANGELOG references, agent files, and test files. Searched for literal strings `kb rebuild`, `kb migrate`, `cmdKbRebuild`, `gsd-tools kb`.

**Result — claim survives, with one refinement.** All hits fall into three benign categories:
1. **Source code:** `gsd-tools.cjs:688` routes the subcommand; `kb.cjs` implements it. These are the definition, not invocations.
2. **Documentation:** CHANGELOG, Phase 56 plan docs, knowledge-store.md all MENTION `gsd-tools kb rebuild` as a user-facing command.
3. **User-facing next-step hints:** `kb.cjs:561, 713` and `knowledge-store.md:564` tell users to run the command after some other action. These are instructions for a human, not automated calls.

**Hook scripts inspected individually:** `gsdr-check-update.js`, `gsdr-ci-status.js`, `gsdr-context-monitor.js`, `gsdr-health-check.js`, `gsdr-statusline.js`, `gsdr-version-check.js`. None reference kb, sqlite, or rebuild. Confirmed.

**`package.json` scripts inspected:** no `kb:rebuild` target. Test scripts run `test:infra` which tests `.sh` script behavior and does not invoke the cjs path.

**Refined claim:** "No workflow, agent, hook, or npm script automatically invokes `gsd-tools kb rebuild`. The only live invocations are human-initiated CLI calls or post-action user suggestions in documentation." This is stronger than my original claim because the search was exhaustive across invocation surfaces, not just workflow files.

#### Test 2 — "FTS5 is structurally dead (0 rows, no content indexed)"

**Method:** ran multiple queries against FTS5 and its backing tables; inspected the signals table schema; searched for triggers.

**Results:**

| Table | Row count | Interpretation |
|---|---:|---|
| `signal_fts_data` | 2 | FTS5 internal bookkeeping (level-0 segment metadata); not indexed content |
| `signal_fts_docsize` | 0 | No documents sized |
| `signal_fts_idx` | 0 | No dictionary segments |

Signals table columns confirmed: `id, file_path, project, severity, lifecycle_state, polarity, signal_category, disposition, signal_type, detection_method, origin, created, updated, phase, plan, runtime, model, gsd_version, occurrence_count, durability, confidence, status, content_hash`. **No title or body columns.**

Triggers on signals or signal_fts: **none** (`SELECT FROM sqlite_master WHERE type='trigger'` returns empty).

MATCH queries against `signal_fts` do not error (now that I used correct syntax — my earlier error was from a malformed query). They return zero rows. The FTS virtual table exists but has no retrievable content.

**Refined claim:** "FTS5 is queryable (no errors) but returns no content under any search. The 2 rows in `signal_fts_data` are internal bookkeeping, not indexed documents. The root cause is a design mismatch: the virtual table declares `content=signals` external-content mode, but the `signals` table has no `title` or `body` columns — and no triggers or INSERT path populate the FTS index from any other source." Claim survives with more careful language.

**Correction to earlier writeup:** my original text said FTS queries "errored with 'no such column: T.title'." That error was from my query syntax, not FTS5 itself. Correct FTS5 syntax (`WHERE signal_fts MATCH 'term'`) runs silently with zero results. Updated in spirit, though the text in §E2.2 Layer 5 should have this correction rolled in if the document is ever cleaned up.

#### Test 3 — "Proposed fix (a), unifying the two rebuilds, actually works"

**Method:** I proposed adding one line to `kb-rebuild-index.sh` to also invoke `gsd-tools.cjs kb rebuild`. I did NOT test this directly in the repo (would have required script modification). Instead: (a) verified the cjs rebuild works in isolation when invoked manually (already done earlier: spike 010 was added); (b) verified the `.sh` script works in isolation (documented by Phase 56 tests).

**Result — claim holds with a caveat.** Both halves work independently. Concatenating them is a trivial shell addition. But I haven't tested race conditions: if a workflow invokes the .sh script and the cjs rebuild runs long (e.g., during kb.db growth), could they step on each other? `cmdKbRebuild` uses a transaction and atomic INSERT OR REPLACE, so the DB-level risk is low. The .sh script writes `index.md` via tmp+rename, also atomic. Unlikely to conflict, but I haven't empirically tested concurrent invocation.

**Recommendation stands but with softer confidence.** The fix is a one-line addition and both halves are known to work. The concurrent-invocation risk is theoretical; if it bites, it's a separate bug.

#### Net effect on E2

All three load-bearing claims survive:
1. No automation invokes cjs rebuild (stronger now — exhaustive search vs original grep)
2. FTS5 has no indexed content (refined: it's queryable but empty, not errored-out)
3. The proposed fix is mechanically sound (untested under concurrency, but that's a small risk)

**One correction noted in §E2.2 Layer 5:** my description said FTS queries "fail with 'no such column: T.title'." This was a syntax error on my end, not a defect in FTS. The FTS table is structurally broken (no content path) but its queries do not raise errors.

**Cross-cutting note:** E1 and E2 falsification passes are substantially lighter-lift than E3's because both E1 and E2 are investigating code surfaces that are (a) fully inside the GSDR codebase we own, (b) small in LOC, and (c) testable by direct invocation. E3's surface (Claude runtime JSONL + session-meta) is a third-party artifact with cross-machine / era-boundary / lifecycle concerns that generated more confusion per claim.

---

## E3. A5 Stress Test — user_message_count overcount

**Completed:** 2026-04-16
**Effort:** ~45 min (corpus inventory + sampling + classifier iteration + writeup)
**Outcome:** A5's directional claim ("overcount from injected system messages") is verified. A5's proposed fix (`filter isMeta: true`) is **insufficient as stated**. A much larger finding surfaced: **session-meta files are point-in-time snapshots, not live counts** — 96% of meta files have no matching local JSONL, and for the 4% that do, meta_umc diverges from JSONL-reconstructed counts by up to 13× for long-running sessions.

### E3.1 Original Claim (preserved verbatim from synthesis-output.md §5)

> **A5: `user_message_count` overcount (Lane 1 Anomaly 3, no cross-lane resolution)**
>
> Session-meta `user_message_count` includes 2-3 injected system messages at session start (verified by near-duplicate timestamps). The raw count overstates actual human turns.
>
> **Status:** Not resolved. Cross-lane data does not help — the JSONL records include these injected messages too (they appear as `user` records with `isMeta: true`). The extractor must filter `isMeta: true` records when counting genuine human turns.

### E3.2 Evidence Chain

#### Layer 1: Corpus inventory — how many meta files have matching local JSONL?

**Status: verified.**

- `~/.claude/usage-data/session-meta/` contains **268 files** (matches the 265 Lane 1 reported, within rounding).
- `~/.claude/projects/**/*.jsonl` indexed by filename stem.
- Intersection (sessions with both files locally available): **11 of 268 (4.1%)**.

The remaining 96% are orphaned — meta exists, JSONL does not. Causes:
- Mac-path sessions (synthesis Anomaly 5 flagged 103/265 with Mac `/Users/...` prefix; those JSONLs live on apollo, not dionysus)
- Deleted/rotated JSONLs on this machine
- Retention policy differences between the two stores

**Consequence for A5's proposed fix:** the `isMeta: true` filter requires JSONL access. For 96% of the meta corpus, this filter is inapplicable. For those sessions, session-meta `user_message_count` is the only source, and it remains uncorrected.

#### Layer 2: The `isMeta: true` filter undercounts what needs filtering

**Status: verified across 10 matched sessions.**

Sampled 10 of 11 matched sessions. Classification of `type: user` records per session:

| session (trunc) | meta_umc | raw user records | `isMeta=true` | `isMeta=false` | no `isMeta` field | `isSidechain=true` |
|---|---:|---:|---:|---:|---:|---:|
| 2916bab2 | 3 | 50 | 6 | 0 | 44 | 0 |
| ae8e4935 | 14 | 86 | 3 | 0 | 83 | 0 |
| 5a0fe1b2 | 4 | 61 | 4 | 0 | 57 | 0 |
| 259d6819 | 5 | 31 | 4 | 0 | 27 | 0 |
| df74a462 | 3 | 35 | 1 | 0 | 34 | 0 |
| 03af6b4c | 4 | 135 | 5 | 0 | 130 | 0 |
| 84df562a | 40 | 221 | 5 | 0 | 216 | 0 |
| 280c23e4 | 63 | 269 | 10 | 0 | 259 | 0 |
| df9692db | 4 | 8 | 1 | 0 | 7 | 0 |
| aef131f1 | 7 | 28 | 4 | 0 | 24 | 0 |

**Key observations:**

1. **Raw JSONL user-record count is 3–40× higher than meta_umc.** The extra records are mostly `tool_result` content (user-role messages that contain tool output), slash-command echoes, and `<local-command-stdout>` blocks.
2. **`isMeta: true` is rare** — 1–10 records per session, not the "2–3 injected" count Lane 1 described. The field is absent from the majority of user records, not false-valued.
3. **`isMeta: false` never appears.** The field is tri-state: true | absent. Any filter based on `isMeta` should use `if rec.get("isMeta")` (treats absent as false), not `if rec.get("isMeta") is False`.

#### Layer 3: What `isMeta: true` records actually contain

**Status: verified via content inspection.**

Sampled `isMeta: true` records across sessions. Three patterns emerge:

- Command-routed workflow prompts: the `<objective>...</objective>` block injected when the user runs a slash command like `/gsd:resume-work`. These are meta-instructions to the routing layer, not user-authored content.
- `<local-command-caveat>`: injected caveats reminding the assistant not to treat shell-command output as user intent.
- A few session-boot context blocks.

Count (per session): typically 3–10. This matches Lane 1's "2–3 injected system messages at session start" qualitatively, with the refinement that the count depends on how many slash commands and local shell commands the session ran.

#### Layer 4: A refined classifier gets closer but diverges in both directions

**Status: empirical — the ground-truth gap is the interesting finding.**

Built a refined "real human turn" classifier with four filters:
1. `type == "user"`
2. `not rec.get("isMeta")` — excludes A5's identified injections
3. `not rec.get("isSidechain")` — excludes subagent traffic
4. `content` is not a `tool_result` list, not a `<command-name>` prefix, not a `<local-command-stdout>` prefix, not a `<command-message>` prefix

Compared to meta_umc:

| sid | meta_umc | filter_isMeta_only | refined_human | Δ(meta - refined) |
|---|---:|---:|---:|---:|
| 2916bab2 | 3 | 44 | 6 | -3 |
| ae8e4935 | 14 | 83 | 7 | +7 |
| 5a0fe1b2 | 4 | 57 | 3 | +1 |
| 259d6819 | 5 | 27 | 1 | +4 |
| df74a462 | 3 | 34 | 1 | +2 |
| **03af6b4c** | **4** | **130** | **17** | **-13** |
| 84df562a | 40 | 216 | 41 | -1 |
| 280c23e4 | 63 | 259 | 53 | +10 |
| df9692db | 4 | 7 | 3 | +1 |
| aef131f1 | 7 | 24 | 1 | +6 |

Delta stats (meta_umc − refined_human): min −13, max +10, mean +1.40.

- **`filter_isMeta_only` column** is A5's proposed fix. It is consistently 10×–50× higher than both meta_umc and refined_human. **A5's fix as stated leaves most of the overcount unaddressed.**
- **`refined_human` column** is closer but still disagrees with meta_umc by up to ±13 per session.

#### Layer 5: The outlier reveals the real issue — meta is a point-in-time snapshot

**Status: verified via direct inspection of session 03af6b4c.**

Session `03af6b4c` has meta_umc=4 but refined_human=17. Inspection:

- `meta.user_message_timestamps` contains exactly 4 timestamps, all within 4 seconds on **2026-03-11 05:04:45–49**.
- `meta.duration_minutes` is **0**.
- The JSONL file is **962 lines** (2.4 MB), with genuine human prompts spanning **2026-03-11 through 2026-03-19+** — at least 8 days of continued work.

The session-meta captured the first 4 messages at session-init (duplicate and near-duplicate timestamps consistent with A5/Lane 1's injection story), then **never updated** as the user resumed the session over the following week. Wall-clock time, new prompts, new tool calls, new assistant turns — all present in JSONL, all absent from meta.

This is not a counting bug in session-meta's filter logic. It is a **lifecycle bug (or design choice)**: meta is written at session-init and not refreshed. For sessions that end cleanly at session-init time (e.g., a quick 1-prompt task), meta is correct. For sessions that resume across days, meta is frozen at the first observation.

**Cross-reference to A2 (session-meta generation frozen, handoff §E5):** A2 says meta generation stopped corpus-wide around v2.1.78/79 (2026-03-15). This session started 2026-03-11 and ran through 2026-03-19. Its meta may have been written at 2026-03-11 and then never updated because the generation subsystem was disabled mid-session. That would make this specific outlier a consequence of A2's boundary crossing the session lifespan, not a separate defect.

**Either way, the implication is the same:** session-meta is not a reliable source of user_message_count for sessions that may have continued past the meta-capture point.

### E3.3 Corrected Claim

**A5 (stress-tested, 2026-04-16):** Session-meta `user_message_count` does not reliably represent human turn count. Three distinct defects combine:

1. **Session-init overcount (Lane 1's original finding).** Meta counts 2–3 injected messages at session-init (system context, routing prompts, caveats). Timestamps are near-duplicate at the session's start.
2. **Meta is a point-in-time snapshot, not a live count.** For sessions that continue across resumption, meta reflects only the prefix captured at session-init. Long-running sessions have catastrophic undercount (observed 4 vs 17 in refined count, JSONL showing 8+ days of continued activity). This defect was not noted in the original audit.
3. **JSONL-based reconstruction is unavailable for 96% of the meta corpus.** Only 11 of 268 meta files have matching local JSONL. For the remaining 257, no filter on JSONL is applicable.

**A5's proposed fix (`filter isMeta: true`)** is directionally correct for defect 1 but:
- Is insufficient by itself — it catches only ~5% of non-human user-role records in JSONL.
- Still requires JSONL access, which 96% of meta sessions lack.
- Does not address defect 2 at all.

**A correct human-turn-count extractor requires:**

```
is_human_turn(rec) :=
    rec.type == "user"
    AND NOT rec.isMeta
    AND NOT rec.isSidechain
    AND content is not a tool_result list
    AND content does not start with one of:
        <command-name>
        <command-message>
        <local-command-stdout>
```

Even this classifier disagrees with meta_umc by ±13 per session — the residual divergence is the session-meta lifecycle issue, which no JSONL classifier can compensate for.

**Epistemic status:** corpus-inventory verified; classifier verified across 10/11 matched sessions; outlier session manually inspected. NOT verified against a third-party ground-truth count (e.g., a human read-through counting human prompts). The refined classifier may still over- or under-count conversational edge cases (multi-part user messages, interruptions, retries).

### E3.4 MEAS- Implications

Adds three proposals to `correction-and-extensions-2026-04-16.md` §6:

#### §6.13 Human-turn-count extractor (new derived-feature requirement)

The extractor registry shall include a `human_turn_count` extractor that operates on JSONL (not session-meta) with the 4-filter rule above. Output:

| Field | Source | Meaning |
|---|---|---|
| `human_turn_count` | classifier applied to JSONL | Count of user-role records that pass all 4 filters |
| `injected_content_count` | `isMeta=true` count | Meta-routing artifacts (objectives, caveats) |
| `tool_result_count` | count of user-role records with tool_result content | Tool observation count (useful standalone) |
| `command_echo_count` | count of records with `<command-name>` prefix | Slash-command invocation count |
| `sidechain_user_count` | count of `isSidechain=true` user records | Subagent input count |

**Preconditions:** JSONL file exists and is accessible. For sessions without local JSONL, return `not_available` — do NOT fall back to meta_umc because the known defects (1 and 2) would silently corrupt downstream metrics.

**Priority:** synthesis §8.1 Priority 2 (moderate effort, high value). Adds to the inventory as item **18**.

#### §6.14 session-meta.user_message_count treated as lossy/frozen (new constraint on existing field)

The meta extractor shall tag `user_message_count` as `lossy_snapshot_pre_2026-03-15`. Preconditions:

- For sessions with a mtime before 2026-03-15, value represents the complete count at session end (still contains defect 1's overcount of 2–3).
- For sessions ending after 2026-03-15, value represents an indeterminate early prefix (A2 + defect 2 combined).
- For analysis layers, use `human_turn_count` from JSONL (§6.13) when available; fall back to meta with an explicit `era_warning` flag.

**Priority:** synthesis §8.1 Priority 1 (schema hygiene, trivial).

#### §6.15 Session-meta ↔ JSONL coverage audit (new one-time investigation)

Only 11/268 sessions have matching local JSONL. For Phase 57.5 to make informed choices about "use meta or reconstruct from JSONL?", this ratio needs quantification across the measurement scope. A one-time audit producing a coverage matrix by:
- Machine (apollo vs dionysus paths)
- Era (pre-2026-03-15 vs post)
- Session length (duration_minutes bins)
- Whether session was a subagent dispatch host

...would tell us which measurement populations are meta-only vs JSONL-available and shape extractor priority accordingly.

**Priority:** synthesis §8.1 Priority 3 (investigation, prep for Phase 57.5 scoping). Deliverable: one markdown report; ~1 hr effort.

### E3.5 Implications for Governance (pre-57.5-handoff §A1)

**E3 triggers a downgrade of session-meta's role in MEAS-:** Lane 1 and synthesis treated meta fields as "API-counted, reliability tier: verified-across-corpus." E3 shows user_message_count specifically is only accurate for a subset of sessions under specific lifecycle conditions. The reliability tier needs qualification.

**Synthesis Decision 4 (agent as primary unit of analysis) is unaffected** — that decision is about stratification, not about which raw field measures turns. But any aggregation that uses user_message_count as a normalizer (e.g., tokens-per-user-turn, duration-per-user-turn) needs the extractor tagged `lossy_snapshot` pattern from §6.14.

**Combined with E1 + E2 GSDR-native findings**, the MEAS- split previously proposed in E2.5 now holds more strongly:
- **MEAS-RUNTIME** — subject to era boundaries AND snapshot-lifecycle caveats (A2 + defect 2). Needs stratification variables: `source_file_type`, `session_era`, `lifecycle_state` (frozen vs live).
- **MEAS-GSDR** — subject only to our own schema. More stable per-field reliability.

### E3.6 Relation to other anomalies

E3 materially affects E4 (A1 token semantics) and E5 (A2 frozen corpus):
- **E4 (A1 tokens):** the session-meta `input_tokens` / `output_tokens` fields face the same snapshot-freeze issue. Layer-5's outlier (4 turns frozen, 8 days of activity in JSONL) would have session-meta tokens reflecting the first 4 turns only, while JSONL-derived tokens would cover all 8 days. E4's investigation should cross-check this before settling on a token-semantics theory.
- **E5 (A2 frozen corpus):** the specific Mar 15 cutoff coincides with session 03af6b4c's Mar 11 session-init + Mar 11-to-19 JSONL span. If A2's v2.1.78/79 change disabled meta generation mid-session, long-running sessions that crossed the boundary will have the worst meta fidelity.

The two pending E-items should be executed with E3's lifecycle finding in mind.

### E3.7 Falsification Pass (2026-04-16, after initial E3 writeup)

Applied the same stress-testing logic to E3's own claims that E3 applied to A5. Four substantive refinements result. **The net effect is to tighten some claims and soften others, not overturn them.**

#### Test 1 — Is the "snapshot at session-init" framing right?

**Predicted falsifier:** if meta files were written at session-init and never updated, all meta mtimes should cluster at session-start dates (near JSONL first-timestamp).

**Result — framing falsified; reframed as "snapshot at subsystem-shutdown":**

| sid | meta_mtime | JSONL first_ts | JSONL last_ts |
|---|---|---|---|
| 2916bab2 | **2026-03-15 18:16** | 2026-03-15 22:04 | 2026-03-17 06:58 |
| ae8e4935 | **2026-03-15 18:02** | 2026-03-12 20:08 | 2026-03-12 20:20 |
| 5a0fe1b2 | **2026-03-15 18:02** | 2026-03-12 05:59 | 2026-03-20 04:00 |
| 259d6819 | 2026-03-08 16:08 | 2026-03-06 02:36 | 2026-03-20 02:50 |
| df74a462 | **2026-03-15 18:02** | 2026-03-11 05:40 | 2026-03-11 05:43 |
| 03af6b4c | **2026-03-15 18:02** | 2026-03-11 05:04 | 2026-03-19 23:38 |
| 84df562a | **2026-03-15 18:02** | 2026-03-09 19:54 | 2026-03-17 06:44 |
| 280c23e4 | **2026-03-15 18:02** | 2026-03-15 05:31 | 2026-03-17 07:11 |
| df9692db | **2026-03-15 18:02** | 2026-03-08 20:25 | 2026-03-18 03:09 |
| aef131f1 | **2026-03-15 18:16** | 2026-03-11 00:29 | 2026-03-19 06:32 |

**8 of 10 mtimes fall at exactly `2026-03-15 18:02` EDT.** Two more at `18:16`. One outlier at `2026-03-08`. No mtime matches its session start. The meta files weren't frozen at session-init — they were frozen **at the moment the meta-generation subsystem was disabled** (approximately 2026-03-15 22:02 UTC, 18:02 EDT, coinciding with A2's v2.1.78/79 boundary).

**Consequence for Defect 3 restatement:** "meta is frozen at an arbitrary early prefix" is wrong. The correct statement: "**for sessions that ended before 2026-03-15 ~22:02 UTC, meta is the final count. For sessions still running at that moment, meta is frozen at the content captured by the last successful generation pass before subsystem shutdown.**"

This is a stronger, more testable claim than my original "snapshot at init." It also explains the outlier 03af6b4c cleanly: session started Mar 11, meta kept up through ~Mar 11 05:04 initial block, generation never ran again for this session, JSONL kept growing through Mar 19.

#### Test 2 — Is the "4.1% matched" coverage claim right?

**Predicted falsifier:** if I missed JSONL locations, coverage would be higher. Specifically, sessions can be stored as `{uuid}/` subdirectories containing subagent traces — those aren't counted by my original `{uuid}.jsonl` search.

**Result — claim refined from 4.1% to a three-state distribution:**

| State | Count | % | What's accessible |
|---|---:|---:|---|
| Matched — has parent `{uuid}.jsonl` | 11 | 4.1% | Full conversation; can run human-turn classifier |
| Session directory only (no parent JSONL) | 175 | 65.3% | Subagent traces only; parent conversation absent |
| Truly orphaned (no artifact on disk) | 82 | 30.6% | Meta is the only source |

**Of the 82 truly-orphaned:** only 14 were Mac-path sessions (much less than Lane 1's 103/265 ratio would predict). 35 are Linux-path but have no directory — these are likely sessions whose files were rotated or cleaned up locally.

**Revised claim:** "only 4.1% of meta files can be cross-verified against parent JSONL for human-turn reconstruction; 65% have subagent traces but not the parent conversation; 31% have no on-disk artifact." The original "96% orphaned" overstated the destruction.

#### Test 3 — Is meta_umc a "broken count" or does it implement a clear (different) rule?

**Predicted falsifier:** if meta_umc follows an identifiable formula, then it's not a broken count — it's a deliberate count of something other than human turns.

**Result — strong falsification; formula identified:**

Exhaustive categorization of session ae8e4935 (cleanly ended pre-Mar-15, meta_umc=14):

| content type | isMeta | count |
|---|---|---:|
| `list:text` (wrapped text block, isMeta=True) | True | 1 |
| `list:tool_result` | False | 71 |
| `str:caveat` (`<local-command-caveat>`) | True | 2 |
| `str:command-msg` (`<command-message>`) | False | 1 |
| `str:command-name` (`<command-name>`) | False | 2 |
| `str:conversational` (plain human text) | False | 7 |
| `str:local-stdout` (`<local-command-stdout>`) | False | 2 |
| **TOTAL** | | **86** |

**Formula: meta_umc = count of user records where `content` is a string.** In this session: 86 − 71 (list:tool_result) − 1 (list:text) = 14 ✓ exact match.

Verified across the 10 sessions with a pre-Mar-15 cutoff applied: 5 match exactly, 5 diverge by ±3 (likely a boundary effect at the cutoff + small formula refinements around which records are counted).

**Consequences:**
- meta_umc is NOT a "broken count of human turns." It is a clean count of `(user records with string content)`.
- The field correctly excludes tool-results (the dominant non-human category) and text-block-wrapped injections.
- The "overcount" that Lane 1 flagged is not a bug — it's because slash-command echoes, command-message frames, local-stdout, and caveats are all string-content records and are all counted by design.
- My earlier "4 filters needed" classifier (§6.13) is solving a *different* problem from what meta_umc solves. Both are legitimate; they measure different things.

**Refined statement of Defect 2:** "meta_umc is not a human-turn count and was never designed to be one. A5's framing of 'overcount' assumes meta_umc should be a human-turn count; that premise is wrong. If the MEAS- goal is human turns, the correct path is a new extractor (§6.13) over JSONL, not a correction to meta_umc."

#### Test 4 — Is the outlier session really one continuous session?

**Predicted falsifier:** if `03af6b4c.jsonl` is actually multiple resumed sessions spliced into one file, the "8-day span" claim would be a concatenation artifact, not a genuine long-running session.

**Result — claim survives:**

- Records per line contain a `sessionId` field. All 937 records with a sessionId have **the same sessionId** (03af6b4c-86d3-4223-937a-57f58ace92fd).
- `cwd` is the same across 930 records (zlibrary-mcp working directory).
- Timestamp distribution by day: Mar 11 (200), Mar 12 (4), Mar 18 (7), Mar 19 (725). Gaps are long idle periods, not session boundaries.
- The JSONL is a single session_id that Claude Code kept appending to across 4 calendar days (the user resumed the session several times, probably via `claude --resume`).

**Outlier finding is robust.** A single session genuinely spanned Mar 11 – Mar 19.

#### Net effect on E3

**Claims strengthened by falsification:**
1. Defect 3 (snapshot frozen) — reframed to "at subsystem shutdown," which is a cleaner, more testable story supported by 10/10 mtime alignment.
2. meta_umc has a clean formula (not a broken count) — this is a new, testable claim.

**Claims softened:**
1. Coverage — 4.1% (parent JSONL available) is correct narrowly, but "96% orphaned" was too strong: 65% have session directories.
2. The "filter isMeta: true is insufficient" critique still holds, but the reason is now understood: meta and a human-turn count are measuring intentionally different things.

**MEAS- implications updated:**
- §6.14 was "tag meta_umc as lossy_snapshot_pre_2026-03-15." Reframe to: **tag meta_umc with `scope = non_tool_result_user_records` and `lifecycle = frozen_post_2026-03-15T22:02Z_for_sessions_still_running`**. The two tags are independent: one describes what the field counts; the other describes when the count stopped updating.
- §6.13 (human-turn extractor) is NOT a replacement for meta_umc; it's a new, orthogonal extractor. Both should exist in MEAS-.
- §6.15 (coverage audit) should produce the three-state distribution (matched / dir-only / orphaned) as a structural feature of the corpus, not a binary.

**What would still falsify the reframed E3:**
- If the Mar-15 mtime cluster turns out to be coincidental rather than a subsystem shutdown. Testable by checking meta mtimes across multiple machines or other users' corpora. Not done here (single-machine limitation).
- If the str-content formula fails on other projects' sessions (tested only on get-shit-done-reflect and zlibrary-mcp sessions). A broader cross-project verification could falsify it.
- If the "LIVE" alignment of sessions ae8e4935 and df74a462 is also coincidental (sessions that ended pre-cutoff so meta captured them fully). Can't distinguish "captured fully because ended early" from "captured fully because subsystem worked" without sessions that ended before Mar 15 AND had unusually long post-session intervals.

**Residual uncertainty flagged for Phase 57.5:** the meta_umc formula is correct for 5/10 sampled sessions with the cutoff hypothesis; the other 5 diverge by ±3. That residual might be from defect-1 injections (2-3 system blocks at session-init), but the direction (+/-) varies by session in a way I haven't explained. This needs more investigation if meta_umc will be used quantitatively.

---

## E4. A1 Stress Test — session-meta token semantics

**Completed:** 2026-04-16
**Effort:** ~75 min (corpus selection + 4-hypothesis testing + slice-search + falsification)
**Outcome:** A1's claim ("session-meta tokens are 'something else'") is verified with a sharpened finding: meta tokens are **partially but not universally** derivable from JSONL. 4 of 7 sessions match a "contiguous slice of length `amc`" formula; 3 of 7 have no clean fit — including one **cleanly-ended pre-cutoff session** whose `output_tokens` matches no contiguous slice sum at any length. Meta tokens cannot be treated as a reliable measurement source.

### E4.1 Original Claim (preserved verbatim from synthesis-output.md §5)

> **A1: session-meta token semantics (Lane 1 vs Lane 2, unresolved)**
>
> Lane 2 verified that JSONL `message.usage.input_tokens` / `output_tokens` are the canonical per-turn API usage (cross-checked against Anthropic SDK docs). Lane 1 observed that session-meta `input_tokens` / `output_tokens` are "something else" — values don't match JSONL sums by any obvious derivation.
>
> **Status:** Not resolved. The formula relating meta token fields to JSONL is unknown.

### E4.2 Corpus Selection

Per E3's lifecycle-freeze finding (meta files frozen at 2026-03-15T22:02Z subsystem shutdown), token comparison is only valid for sessions whose JSONL ended **before** the cutoff. From the 268-file meta corpus, only **3 sessions** have parent JSONL AND a clean pre-cutoff end timestamp:

| sid | JSONL last_ts | amc | umc | meta.in | meta.out | duration_min |
|---|---|---:|---:|---:|---:|---:|
| df74a462 | 2026-03-11T05:43:28 | 51 | 3 | 3,511 | 7,609 | 491 |
| ae8e4935 | 2026-03-12T20:20:52 | 78 | 14 | 120 | 18,022 | 901 |
| 06661725 | 2026-03-15T06:23:41 | 148 | 6 | 186 | 42,339 | 2,109 |

To stress the "contiguous slice" hypothesis I also ran 4 **cross-cutoff** sessions from E3's sample (where meta represents state frozen at shutdown, not at session-end). Combined n=7.

### E4.3 Evidence Chain

#### Layer 1: Candidate formulas tested

Four candidate derivations of meta tokens from JSONL fields:

1. **Raw cumulative sum across all assistant records** — `sum(usage.input_tokens)` and `sum(usage.output_tokens)` across every `type==assistant && has usage` record.
2. **Prefix cumulative sum at idx=amc** — same sum but truncated at record index equal to `meta.assistant_message_count`.
3. **Dedup-by-msg-id cumulative sum** — take the maximum `output_tokens` per unique `msg_id` (accounting for streaming duplicates where records share `msg_id`), then sum.
4. **User-text character derivation** — sum `len(human_text_content)/4` across user records with plain-text content.

Empirical run on the 3 clean sessions produced:

| sid | meta.in | cumsum full | cumsum@amc | dedup full | user_chars/4 |
|---|---:|---:|---:|---:|---:|
| ae8e4935 | **120** | 6,384 | **120 ✓** | 2,143 | 149 |
| df74a462 | **3,511** | 3,513 | **3,511 ✓** | 882 | 167 |
| 06661725 | **186** | 27,609 | 27,580 ✗ | 1,097 | 368 |

| sid | meta.out | cumsum full | cumsum@amc | dedup full | — |
|---|---:|---:|---:|---:|---|
| ae8e4935 | **18,022** | 32,840 | **18,022 ✓** | 32,258 | — |
| df74a462 | **7,609** | 8,194 | 6,405 ✗ | 7,990 | — |
| 06661725 | **42,339** | 44,531 | 37,841 ✗ | — | — |

Formula 2 (prefix-at-amc) works exactly for 1 of 3 (ae8e4935). Other formulas fail across the board.

#### Layer 2: Exhaustive contiguous-slice search

Expanded search: for each session, find ALL contiguous slices `[i..j]` where the sum of `usage.input_tokens` and `usage.output_tokens` simultaneously match `meta.input_tokens` and `meta.output_tokens`.

Results:

| sid | type | n_records | amc | matching slice(s) | slice length |
|---|---|---:|---:|---|---:|
| ae8e4935 | clean pre-cutoff | 109 | 78 | `[1..78]` | 78 ✓ matches amc |
| df74a462 | clean pre-cutoff | 53 | 51 | **none** (in only: [1..51]) | — |
| 06661725 | clean pre-cutoff | 165 | 148 | `[18..165]` | 148 ✓ matches amc |
| 5a0fe1b2 | cross-cutoff | 94 | 28 | `[1..28]` | 28 ✓ matches amc |
| 03af6b4c | cross-cutoff | 191 | 4 | `[1..4]` | 4 ✓ matches amc |
| 84df562a | cross-cutoff | 334 | 277 | **none** | — |
| 280c23e4 | cross-cutoff | 385 | 349 | **none** | — |

**Refined hypothesis (H2):** meta tokens = cumulative sum of `usage.input_tokens` and `usage.output_tokens` over a contiguous slice of raw assistant records whose length equals `meta.assistant_message_count`. Slice position varies:

- `ae8e4935, 5a0fe1b2, 03af6b4c` → slice `[1..amc]` (first `amc` records)
- `06661725` → slice `[amc_offset..end]` (last `amc` records, skipping first 17)
- `df74a462, 84df562a, 280c23e4` → no slice fits

**H2 holds for 4 of 7 sessions (57%). H2 fails for 3 of 7.**

#### Layer 3: Why does 06661725 skip records 1-17?

Inspection of the gap between record 17 and record 18 shows: records 1-17 are session initialization — 3 unique `msg_id`s streamed 5, 3, and 9 times respectively with `input_tokens` fixed per-message (3, 1, 3045). After record 17 there's a 2-minute gap containing tool_results, system messages, a `file-history-snapshot`, and then a new user text input at `19:19:28` (`@epistemic-agency/traces/004-handoff.md`). Record 18 is the assistant's first response to that new input.

Interpretation: for 06661725, meta started tracking at the first "real" user conversation turn, skipping the pre-conversation setup (slash-command context loading, cache warming). For ae8e4935, no skip was needed — its first assistant record was already the first real conversation turn.

#### Layer 4: Why does df74a462 output_tokens match nothing?

Exhaustive search: NO contiguous slice of any length has `sum(output_tokens) = 7609`. Only `meta.in = 3511` matches, at slice `[1..51]` (which aligns with `amc=51`). For `meta.out`:
- Slice `[1..51]` gives 6,405 (delta −1,204)
- Slice `[1..52]` gives 7,838 (delta +229)
- Dedup-by-msg-id across all 53 records gives 7,990 (delta +381)

None reconcile to 7,609. This is a **clean pre-cutoff session** whose meta output_tokens have no formula from JSONL, on a day (2026-03-11) when the meta subsystem was presumably still working.

Possible explanations:
- A streaming-race condition between the meta tracker (updating on message-complete events) and the JSONL writer (serializing per-block records). Meta captured 7,609 mid-stream during what became record 52's output block.
- A separate meta-internal counter diverged from JSONL-derived sums, possibly due to cache-recovery or retry semantics.
- Meta's output_tokens uses a formula that includes something beyond `usage.output_tokens` — tool-use output sizes, subagent dispatches counted partially, etc.

No test can distinguish these explanations without access to the closed-source meta-generation code.

### E4.4 Corrected Claim

**A1 (stress-tested, 2026-04-16):** Session-meta `input_tokens` and `output_tokens` are NOT a reliable derivable quantity from JSONL. The correspondence is:

1. **Partial formula holds for 4/7 sessions:** meta tokens = cumsum over a contiguous slice of raw assistant records whose length equals `meta.assistant_message_count`. Slice position is variable — sometimes `[1..amc]` (prefix), sometimes suffix — apparently determined by what meta considered the session's "real conversation start" versus pre-conversation setup.
2. **Formula fails for 3/7 sessions:** no contiguous slice fits. One failure is a cleanly-ended pre-cutoff session (df74a462) — indicating that the formula breaks even under ideal conditions. The remaining two failures are long cross-cutoff sessions where subsystem-shutdown freeze plausibly captured inconsistent state.
3. **All 7 meta files have mtime ≈ 2026-03-15T22:02Z** (same timestamp, ±1 second) — the subsystem-shutdown rewrite touched every meta file, regardless of whether the session had ended long before. This confirms E3's finding that meta is not a "live" counter but a snapshot captured at shutdown.

**A1's original open question ("what formula does meta use for tokens?") remains partially unanswered.** A single-formula answer does not exist in the sampled data. Meta tokens should be treated as lossy and heterogeneous across sessions.

**Epistemic status:** empirical-slice-search verified across n=7 (3 clean + 4 cross-cutoff). Not verified against the meta-generation source code (closed). Alternative non-contiguous-slice formulas not exhaustively searched.

### E4.5 MEAS- Implications

Adds two proposals to `correction-and-extensions-2026-04-16.md` §6 and refines §6.14 from E3:

#### §6.16 Reject session-meta tokens as first-class MEAS- source (new exclusion requirement)

`meta.input_tokens` and `meta.output_tokens` shall NOT appear as MEAS- metric fields, nor be used as normalizers for other metrics. Justification: the 4/7 partial-formula fit is insufficient reliability for cross-session aggregation. Mislabeling 3/7 sessions as having "real" token counts when they have undefined quantities would corrupt downstream aggregate metrics.

For any token-based measurement, the extractor shall use **JSONL `usage.input_tokens` and `usage.output_tokens`** with message-id deduplication for streaming handling (take the maximum value per unique `msg_id`, sum across messages). This yields a per-session token count that is deterministic from JSONL and independent of meta's broken correspondence.

**Priority:** synthesis §8.1 Priority 1 (schema hygiene, exclusion). Item **19**.

#### §6.17 JSONL-based token extractor (new first-order requirement, complements §6.16)

The extractor registry shall include a `session_tokens_jsonl` extractor producing:

| Field | Derivation | Meaning |
|---|---|---|
| `input_tokens_total` | sum of `max(usage.input_tokens)` per unique `msg_id` across all assistant records | New-to-context API input (excludes cache) |
| `output_tokens_total` | sum of `max(usage.output_tokens)` per unique `msg_id` across all assistant records | Total output (includes visible + thinking) |
| `cache_creation_tokens_total` | sum of `max(usage.cache_creation_input_tokens)` per unique `msg_id` | Tokens added to cache this session |
| `cache_read_tokens_total` | sum of `max(usage.cache_read_input_tokens)` per unique `msg_id` | Tokens read from cache this session |
| `total_context_tokens` | sum of all above | Full tokenized context volume |

**Preconditions:** parent JSONL exists for the session. Returns `not_available` for the 257/268 sessions in the meta corpus that lack parent JSONL (per E3's coverage).

**Priority:** synthesis §8.1 Priority 1. Item **20**. Supersedes `meta.input_tokens` / `meta.output_tokens` for all measurement purposes.

#### §6.14 refinement (from E3)

E3 proposed tagging `meta_umc` with `scope` and `lifecycle` annotations. E4 extends the same pattern to meta tokens:
- **scope tag:** `uncorrelated_with_jsonl_for_42_percent_of_sample` — explicit epistemic downgrade
- **lifecycle tag:** `frozen_at_2026-03-15T22:02Z_subsystem_shutdown` — same as meta_umc
- **recommended action:** do not consume; use §6.17 instead

### E4.6 Implications for Governance (pre-57.5-handoff §A1)

The original handoff §A1 listed a phantom-token reconciler (§6.3 in correction doc) as one MEAS- requirement. E4's finding doesn't change that — the phantom-token derivation still applies to JSONL `usage.output_tokens`, which is reliable. What E4 changes: the correction doc's §6.3 did not specifically say to IGNORE meta's token fields; E4 adds that explicit exclusion.

Combined running count of MEAS- proposals across all stress-tests:
- E1: §6.7, §6.8, §6.9 (3)
- E2: §6.10, §6.11, §6.12 (3)
- E3: §6.13, §6.14, §6.15 (3)
- E4: §6.16, §6.17 (2, with §6.14 refinement)
- **Total: 11 new MEAS- candidates from E-stress-tests** atop spike 010's 7 = ~18 candidates for the A1 governance pass.

The MEAS-RUNTIME vs MEAS-GSDR split proposed in E2.5 holds more strongly after E4: **meta.input_tokens / meta.output_tokens are specifically RUNTIME fields that E4 has shown to be unreliable,** strengthening the case that MEAS-RUNTIME needs tight lifecycle and coverage annotations.

### E4.7 Falsification Pass (2026-04-16, retroactive)

Three targeted tests against E4's load-bearing claims.

#### Test 1 — Is "contiguous slice of length amc" a robust match, or could it be coincidence for small amc?

**Predicted falsifier:** if the 4/7 matches were coincidental (the sum of some random contiguous slice happened to equal meta.in AND meta.out simultaneously), then I should expect many MORE slices of arbitrary length to also match. Exact simultaneous matches on both fields should be rare.

**Method:** recount the number of slices matching each target field INDIVIDUALLY (allowing any length), per session.

**Result — claim survives for 3 of the 4 matches.** For ae8e4935, 06661725, and 5a0fe1b2, the exhaustive search found exactly ONE slice matching BOTH `meta.in` AND `meta.out`, and its length equalled `amc`. Two-field coincidence in a ~n²/2 search space is vanishingly improbable given integer sums with ~10⁴-range targets. These three are strong matches.

**03af6b4c is a weaker case.** `amc=4`, tokens are tiny (in=8, out=1012), JSONL has 191 records. The probability of finding a 4-record slice matching (8, 1012) by chance in 188 possible starting points is non-negligible when outputs are low-variance. The single-match finding is consistent with the hypothesis but doesn't strongly confirm it beyond coincidence.

**Refined claim:** 3/7 strong matches + 1/7 weak match + 3/7 failures. The "contiguous slice" formula fits at best 4/7 and at worst 3/7 of the sample.

#### Test 2 — Is df74a462's output_tokens mismatch attributable to a specific mechanism?

**Predicted falsifier:** if meta's output_tokens = sum of some fully-formed field across raw records, exhaustive search would find it. If the field is not in JSONL (e.g., visible-text char count ÷ 4, or billed-token count), the search would return nothing.

**Method:** beyond the already-run contiguous slice search:
- Sum visible-text chars of all assistant text blocks, divided by 4
- Sum `cache_creation_input_tokens` across various slices
- Sum dedup-by-msg-id final outputs across various slice lengths

**Result:** none of the alternative derivations produce 7,609. The value 7,609 has no obvious arithmetic relationship to any single JSONL field or aggregate. Refined statement: **df74a462's meta.output_tokens is genuinely unrecoverable from JSONL** via any formula I tested. Either the meta subsystem used a non-JSONL input, or it had a race-condition bug that wrote an intermediate value.

This slightly softens E4's MEAS- recommendation: it's not that the formula is complex-but-knowable; for at least one clean session, there is no formula at all. That makes §6.16 (exclusion) stronger, not weaker.

#### Test 3 — Did the subsystem-shutdown mtime cluster affect all sessions equally?

**Predicted falsifier:** if meta files had been rewritten at shutdown, their mtimes should ALL land at 2026-03-15T22:02Z. If some have earlier mtimes, those sessions either (a) had their meta frozen earlier by some other event or (b) never got the shutdown rewrite.

**Method:** checked mtime for all 7 sampled sessions.

**Result — claim survives exactly.** All 7 meta files have mtimes in the range `2026-03-15T22:02:50.69Z` – `2026-03-15T22:02:51.40Z`, a 0.7-second window. The subsystem shutdown wrote every meta file simultaneously. This holds for clean pre-cutoff sessions AND cross-cutoff sessions.

**Consequence:** E3's shutdown-freeze framing applies universally to the sample. The meta-files I examined are NOT original per-turn writes; they are **shutdown-snapshot rewrites**. This distinction matters for interpreting meta.in / meta.out: these values represent state captured at the shutdown rewrite, which may or may not reflect what the running meta tracker had on each session.

#### Net effect on E4

Three claims survive at varying strength:
1. "Contiguous slice of length amc" formula: 4/7 matches (3 strong + 1 weak), 3/7 failures.
2. df74a462 output_tokens has no derivable formula from JSONL under any tested aggregation.
3. All meta files are subsystem-shutdown rewrites, not live per-turn writes.

**Most load-bearing refinement:** claim 1 is weaker than initially stated. Even if a "contiguous slice" formula holds for the strong cases, its failure on 3/7 (including one clean session) means meta tokens cannot be trusted for measurement. §6.16 (exclude meta tokens) stands; §6.17 (use JSONL-derived tokens) is the necessary replacement.

**Residual uncertainty flagged for Phase 57.5:**
- Larger sample (sessions from other machines, other projects) would refine the 4/7 fraction. If the fraction is stable ~50%, the "unreliable" framing is correct. If much higher (~90%), the formula might be real with specific failure conditions worth understanding.
- Closed-source meta-generation code would resolve the question definitively. No practical path to this.
- A one-time spike could be worth it: run a test session with heavy logging on both the meta subsystem and JSONL writer, then compare. But this requires the meta subsystem to be re-enabled — which (per E5) it is not.



---

## E5. A2 Stress Test — session-meta generation frozen

**Status:** DONE (2026-04-16). Outcome: A2's framing is **partially wrong at the architectural level**. The subsystem is not disabled; the cache is simply stale. Reframes E3/E4 shutdown-event interpretation.

### E5.1 Original Claim (preserved verbatim from synthesis-output.md §5 / B1)

> **A2 — session-meta generation frozen (~2026-03-15, v2.1.78/v2.1.79 boundary).** Generation stopped; 265 sessions total through cutoff. Treat as historical snapshot, not live telemetry.

### E5.2 Evidence Chain

#### Layer 1 — Empirical: is the "freeze" still in effect at v2.1.110?

Current local Claude Code version: **v2.1.110** (32 patch releases after the nominal v2.1.78/79 cutoff).

```
$ find ~/.claude/usage-data/session-meta/ -newermt "2026-03-16" -type f | wc -l
0
$ find ~/.claude/usage-data/facets/     -newermt "2026-03-16" -type f | wc -l
0
```

Zero session-meta files and zero facets files have been written since 2026-03-15. The freeze holds across 32 patch versions.

#### Layer 2 — Not one shutdown but TWO mass-rewrite events

Full mtime distribution for `session-meta/` (268 files):

```
  45  2026-03-15T18:02:52 EDT (22:02:52 UTC)
  33  2026-03-15T18:02:51
  32  2026-03-15T18:02:53
  30  2026-03-08T16:08:42 EDT (20:08:42 UTC)
  29  2026-03-08T16:08:44
  29  2026-03-08T16:08:41
  26  2026-03-08T16:08:43
  20  2026-03-15T18:02:50
  12  2026-03-15T18:16:31
  12  2026-03-08T16:08:40
 ...
```

There are **two bulk-rewrite clusters**:
- **2026-03-08T20:08:40-44 UTC** (~5s window, 126+ files) — aligns with the `tengu_quiet_hollow` global rollout for thinking redaction noted in the pre-handoff
- **2026-03-15T22:02:50-53 UTC + T22:16:31 UTC** (~27min total span, 142+ files) — the event E3/E4 already identified

**The March 8 event was previously undetected.** E3/E4's analysis assumed a single shutdown event. The two clusters indicate that whatever writes to `session-meta/` does bulk rewrites, not per-session writes.

#### Layer 3 — Binary inspection: subsystem still exists in v2.1.110

String grep across three installed versions:

```
$ grep -a -c -o "session-meta" ~/.local/share/claude/versions/2.1.80    → 3
$ grep -a -c -o "session-meta" ~/.local/share/claude/versions/2.1.91    → 3
$ grep -a -c -o "session-meta" ~/.local/share/claude/versions/2.1.110   → 3
```

Unchanged reference count across versions spanning the nominal "cutoff." The functions that compute the `session-meta/` path (v2.1.80: `FaA()`, v2.1.110: `KY6()`) both exist and are called from read-path (`Za6`) and write-path (`ka6`) functions with the same shape. Equivalent `facets/` path functions exist alongside.

#### Layer 4 — Discovery: the subsystem is `/insights`, not a telemetry background daemon

Inspecting the write-path in v2.1.80 binary:

```javascript
async function ka6(H) {
  try { await dW.mkdir(FaA(), { recursive:!0 }) } catch {}
  let $ = YS.join(FaA(), `${H.session_id}.json`);
  await dW.writeFile($, mH(H, null, 2));  // writes {session_id: ...} JSON
}
```

The companion `facets/` directory contains LLM-generated session summaries (example for the same session_id `4a6889e9...`):

```json
{
  "underlying_goal": "Resume project work, run a spike experiment to verify runtime capability claims, and plan next steps for milestone gaps",
  "outcome": "mostly_achieved",
  "friction_counts": { "wrong_approach": 2, "misunderstood_request": 1 },
  "friction_detail": "Claude skipped the spike planner agent and drafted DESIGN.md directly without prerequisites/feasibility...",
  "brief_summary": "User wanted to run a spike to verify capability claims but through iterative pushback discovered research sufficed...",
  "session_id": "4a6889e9-..."
}
```

Binary strings show these are produced by an LLM prompt containing `"Analyze this Claude Code session and extract structured facets."` and `record_facets` as the expected function-call name. A `report.html` titled "Claude Code Insights" sits in the same directory (mtime 2026-03-15 18:17:36 EDT — 68s after the last facets write, clearly the same run).

**The subsystem is the `/insights` command.** It generates (on manual invocation):
- `session-meta/{id}.json` — deterministic statistics extracted from JSONLs
- `facets/{id}.json` — LLM-extracted semantic summary per session
- `report.html` — aggregated visualization across all sessions

#### Layer 5 — `/insights` is still alive in v2.1.110

Web-search and changelog fetch: the only v2.1.70-v2.1.110 changelog entry mentioning `/insights` is **v2.1.101**: *"Fixed `/insights` sometimes omitting the report file link from its response."* Active maintenance as of ~v2.1.101. No deprecation or removal entry found for the v2.1.78/79 boundary.

#### Layer 6 — What DID change at v2.1.77-v2.1.90 (relevant context)

Changelog entries adjacent to the nominal cutoff:

| Version | Entry (abridged) |
|---|---|
| v2.1.77 | `/effort` command added; `/recap` added with configurable frequency |
| v2.1.78 | **"Transcript entries carry final token usage instead of streaming placeholders"** |
| v2.1.79 | Bridge session metadata displays git repo, branch, cwd |
| v2.1.80 | `/stats` includes subagent usage; `/cost` per-model + cache-hit breakdown |
| v2.1.86 | `X-Claude-Code-Session-Id` header added for server-side session aggregation |
| v2.1.90 | `/stats` handles historical data beyond 30 days when cache format changes |
| v2.1.94 | Further `/cost` per-model and cache-hit refinements |
| v2.1.101 | Fixed `/insights` report-link bug |
| v2.1.108+ | `/recap` rollout continues |

**v2.1.78's transcript-level token-usage change is architecturally the most relevant entry.** Token usage moved into JSONL transcript records at that boundary — consistent with E4's finding that JSONL is the canonical token source and meta tokens diverge from it. The `/stats` and `/cost` subsystems pivoted around the same window to richer per-model / per-subagent breakdowns, and v2.1.86 introduced server-side session aggregation via a header. The industry trend is away from local on-demand aggregation (`/insights`-style) toward live telemetry (`/stats`, `/cost`, server-side).

**But none of this is a SESSION-META shutdown.** The subsystem wasn't disabled. The user simply stopped running `/insights`.

### E5.3 Corrected Claim

**A2 original framing (partial-wrong):**
- ❌ "generation stopped" — the subsystem was not stopped; it was never continuous
- ❌ "v2.1.78/79 boundary" — coincidental with the user's last `/insights` run, not causal
- ✅ "historical snapshot, not live telemetry" — this part is correct by accident, because the subsystem was never live telemetry to begin with

**A2 corrected framing:**
- `session-meta/*.json` and `facets/*.json` are **caches** populated by the `/insights` command (user-invoked).
- On each `/insights` run, the command **rewrites all files in bulk** — explaining the tight 0.7s mtime clusters E3/E4 observed and the parallel March 8 cluster E5 discovered.
- The "freeze" since 2026-03-15 is **user-behavioral** (the user hasn't run `/insights`), not **architectural** (no subsystem disabled).
- The subsystem remains present and maintained in v2.1.110 (bug-fixed as recently as v2.1.101).
- The two observed /insights runs on this machine:
  - 2026-03-08T20:08 UTC (126+ sessions covered)
  - 2026-03-15T22:02-22:17 UTC (142+ sessions covered — the 22:16:31 cluster is 12 late-arriving or reprocessed entries)

### E5.4 MEAS- Implications

#### §6.18 NEW — session-meta as `DERIVED`, not `RUNTIME`

The E4 lifecycle annotation `lifecycle=frozen_at_2026-03-15T22:02Z` was correct empirically but wrong etiologically. Correct annotation:

```yaml
scope: derived_from_jsonl_via_insights_command
lifecycle: last_insights_run_at_{mtime}
refresh_policy: on_manual_invocation_of_/insights
dependency: /insights subsystem (still active in v2.1.110)
```

**Priority: P2.** This reclassification affects the `provenance` field shape for both session-meta and facets extractors.

#### §6.19 NEW — facets/*.json as a FIRST-CLASS MEAS- source

Discovered during E5. Not in any prior section. Contains LLM-extracted semantic features per session:

- `underlying_goal` (string — one-sentence intent)
- `goal_categories` (dict of {category: count})
- `outcome` (enum: `fully_achieved` | `mostly_achieved` | `partially_achieved` | `failed`)
- `user_satisfaction_counts` (dict of {label: count})
- `claude_helpfulness` (enum: `very_helpful` | `moderately_helpful` | ...)
- `session_type` (enum: `iterative_refinement` | ...)
- `friction_counts` + `friction_detail` (dict + free-text — directly maps to SIGNAL.md style friction tracking)
- `primary_success` + `brief_summary` (free-text)

**This is a RUNTIME semantic layer E3/E4 did not surface.** It's already what the synthesis audit's "reasoning quality" / "Agent Performance loop" wants to measure — just on-demand rather than continuous, and already produced by Anthropic's own LLM rather than needing us to build it.

**Priority: P1** — evaluate as substitute-or-complement for spike C5 (reasoning-quality measurement). Concerns:
- It's `/insights` output, so refresh requires manual invocation (or maybe automating `/insights` invocation is cheaper than building a quality-measurement mechanism from scratch — **candidate spike**)
- The facets are Anthropic-proprietary category schemes; stratifying by them conflates their taxonomy with ours
- facets_summary corpus is a 109-session subset of session-meta's 268 (partial coverage — why?). Worth investigating before adopting.

#### §6.20 NEW — record the `/insights` mass-rewrite event as a "sampling boundary" artifact

Every time the user runs `/insights`, a new mtime-cluster gets stamped across ~100-150 files. This is **observable provenance** — we can derive "this session was last analyzed at T" from the mtime. For MEAS- aggregation, this allows:

- Detecting stale analysis (mtime old, session content changed)
- Grouping sessions by /insights-generation batch (they share mtime ± 1s)
- Auditing coverage drift (which sessions were excluded by /insights? — see §6.19 coverage gap)

Priority: P3. Useful auxiliary signal, not blocking.

### E5.5 Implications for Governance (pre-57.5-handoff §A1)

- MEAS- requirement list grows from 17 → 20 (§6.18, §6.19, §6.20)
- **§6.19 (facets) is a potential major scope-shifter for Phase 57.5**: if facets provides acceptable reasoning-quality data out-of-the-box, C5 (reasoning-quality spike) becomes a facets-reliability investigation rather than a measurement-mechanism design exercise
- Updated subfamily allocation:
  - **MEAS-DERIVED-*** (new subfamily) — session-meta, facets, report.html — products of `/insights`; on-demand refresh; versioned by whatever `/insights` internal schema is
  - MEAS-RUNTIME-* — JSONL only
  - MEAS-GSDR-* — our own artifacts (unchanged)

The two-subfamily split proposed post-E4 (RUNTIME + GSDR) should be a **three**-subfamily split.

### E5.6 Relation to other anomalies

- **E3** — E3 claimed "session-meta files are frozen at the moment the meta-generation subsystem was disabled." **Refinement:** files are frozen at the moment `/insights` was last invoked. Not a subsystem shutdown. The mtime cluster is an `/insights`-run artifact, not a disablement artifact.
- **E4** — E4.7 Test 3 concluded "all meta files are subsystem-shutdown rewrites, not live per-turn writes." **Refinement:** all meta files are `/insights`-invocation rewrites. The write-mechanism conclusion (not live per-turn) is correct. The shutdown framing is wrong.
- **E4** core claim (meta tokens don't equal JSONL tokens for 3/7 sessions) is **unaffected** by this reframing — the mechanism is still that meta tokens are derived offline (now known: via `/insights`-driven extraction) and the formula is opaque. E4's §6.16 (exclude meta tokens) and §6.17 (use JSONL tokens) stand.
- **A4 (falsified)** — was about thinking content. Unrelated.
- **Prior references to A2 as "frozen at v2.1.78/79"** in the correction doc, E3, E4, and the pre-57.5 handoff should be softened to "last /insights invocation was before v2.1.79 on this user's machine; subsystem remains active upstream."

### E5.7 Falsification Pass (2026-04-16)

Three targeted tests against E5's load-bearing claims.

#### Test 1 — Is the "user-behavioral, not architectural" reframe load-bearing or could it be an active background scheduler we missed?

**Predicted falsifier:** if `/insights` (or a companion subsystem) runs on a schedule (cron, session-end hook, daemon), there should be auto-trigger code in the binary.

**Method:**
- Grep binary for `auto.*insights`, `schedule.*insights`, `cron.*insights`, `setInterval.*insights`
- Check if any `SessionEnd` or `Stop` hook registrations invoke insights/facets/record_facets logic

**Result:** zero matches for auto-trigger patterns in v2.1.110. The `record_facets` string appears only in the literal LLM prompt context (where the model is instructed to call that tool to persist its analysis), not in a scheduler context.

**Claim survives:** the subsystem is invoked manually. The reframe holds.

**Residual uncertainty:** a determined search through all hook-registration code in v2.1.110 (which is minified and ~250MB of strings) might surface an event-driven trigger I missed. Would require cleaner decompilation to rule out definitively. The empirical evidence (zero files newer than 2026-03-16 despite 32 version bumps) is stronger than the code-search anyway.

#### Test 2 — Could the March 8 cluster be unrelated to `/insights` (e.g., a one-time migration)?

**Predicted falsifier:** if March 8 was a schema migration rewrite, all files should have identical *schema versions* but divergent content. If it was an /insights run, the files should reflect data generated at that point in time for whatever sessions existed then.

**Method:** compare file counts between the two clusters and session-end dates.

**Result:**
- March 8 cluster: 126+ files; sessions have end-dates ranging Feb→early March (consistent with "analyze all sessions to date")
- March 15 cluster: 142+ files; sessions have end-dates ranging Feb→mid-March (consistent with "re-analyze all sessions to date, now including the week of new sessions since March 8")
- The March 15 cluster is a *superset* of the March 8 sessions, not a disjoint set

This is the signature of **two full-corpus rescans**, one on each date. Consistent with `/insights` being re-invoked. Inconsistent with a one-time migration.

**Claim survives.** The March 8 cluster is a prior `/insights` run, not a migration event.

#### Test 3 — Is the facets coverage gap (109/268 ≈ 41%) explained by any obvious filter?

**Predicted falsifier:** if facets-eligible sessions are a meaningful subset (e.g., "sessions with >5 user turns" or "sessions with ≥1 commit"), the coverage gap tracks session size.

**Method:** sample the 159 session-meta files WITHOUT corresponding facets files and look for a unifying property.

**Result:** not executed in this pass — the full analysis requires cross-referencing session-meta stats with facets-existence across the full 268-session corpus, not a 5-min task. **Deferred to Phase 57.5 §6.19 prep work.**

**Claim status:** unverified. The 41% coverage figure is accurate, but the cause is unknown. If facets is in scope for MEAS- (which §6.19 recommends), this gap needs investigation. Candidate causes to test:
- Session size threshold (short sessions skipped)
- LLM extraction failure (parse errors silently drop sessions)
- Cost budget (rate-limited; older sessions get processed, newer ones don't)
- `/insights` only processes sessions since last run (incremental mode)

#### Net effect on E5

Two claims survive rigorously (Tests 1, 2). One claim has a residual unknown (Test 3 — facets coverage).

**Most load-bearing refinement:** the reframe from "subsystem shutdown" to "user-last-invocation" holds. The MEAS- subfamily change (adding MEAS-DERIVED-*) follows. The facets discovery (§6.19) is the highest-value new finding — potentially obviates or reshapes spike C5.

### E5.8 Empirical test — /insights executed (2026-04-16)

**Executed** 2026-04-16 11:07:26→11:08:46 EDT via `claude -p "/insights"` subprocess from `/tmp`. Pre-snapshot, post-snapshot, predictions, and full results in `./e5.8-insights-experiment/`. Predictions were partially contaminated (45s of results observed before pre-registration) — user enforced this discipline retroactively.

**E5 reframe confirmed empirically.** `/insights` is active in v2.1.110. Wrote 203 new session-meta + 52 new facets covering 2026-03-27 → 2026-04-16, strictly incremental (zero rewrites of pre-snapshot). Schema unchanged (11 fields identical).

**Prediction scorecard** (see `RESULTS.md`): 5 confirmed + 1 barely + 3 falsified + 1 unverifiable + 1 partial. Falsifications clustered around scale estimates — I had conflated subagent JSONL count with parent count.

**Three new structural findings:**

1. **Two-path write model.** /insights bulk-writes (194 files at 11:06:46-48 in 2s) + a **separate per-session-end trigger** writes individual files ~3-5 min after a session closes. Evidence: the /insights subprocess's own session (`4b5b4814`, `project_path=/tmp`) got a session-meta file at 11:12:05 — 3m19s after subprocess exited. report.html was rewritten at the same moment. E5's "only /insights populates the cache" mental model was **incomplete**. Adds **§6.21 MEAS-DERIVED-WRITE-PATH** (P3): record whether a file's mtime came from a bulk cluster (≥5 files within 2s) or a single write, as provenance metadata.

2. **facets has a non-deterministic size-correlated budget filter.** 25.6% of new sessions got facets (vs historical 40.7%). Characterized: mean user_msg 20.1 with facets vs 5.4 without; mean duration_min 832 vs 282. But overlap in both directions (68-msg sessions without facets; 3-msg sessions with). Not a pure threshold — suggests budget cap + cost-of-prompt filter + possible LLM errors. **§6.19 refinement** → MUST stratify any facets-based analysis by session size to avoid biasing aggregate toward longer sessions.

3. **My prior "2,595 JSONL sessions" claim was wrong.** The real count: **211 parent sessions + 2,365 subagent JSONLs**. /insights processes only parents; subagents are architecturally out-of-scope. Updates downstream claims: coverage of parents is near-complete (209/211 covered). E3's "82/268 truly orphaned" reading is re-interpretable as cross-machine syncs or JSONL churn, not missing /insights coverage.

**Bonus finding (worth future investigation):** the 194 new files have mtime 11:06:46-48, which **precedes** the /insights subprocess JSONL first-timestamp (11:07:26). Either clock skew, bootstrap lag in transcript-vs-disk timing, or a different process did the writes. Low priority; doesn't affect the reframe.

**Prediction 9 falsified clearly:** runtime was 80s not 300s. /insights processed the full incremental delta faster than expected. The subsystem is efficient.

**Residual unknown (deferred):** is the per-session-end write mechanism (Finding 1) specifically /insights' own book-keeping, or a general hook that fires for ANY session close? Testing requires monitoring session-meta writes against arbitrary sessions closing over time. Low priority — either way §6.21's provenance-metadata extractor works.

**Cost paid:** unmeasured but bounded. 203 session-meta (deterministic, free) + 52 facets LLM calls. Order $0.10 (Haiku) to $6 (Opus). Subscription-counted, not directly billed. Charge against the methodological lesson: burned because I cascaded user approval across steps (see `memory/feedback_scope_cascade_assumption.md`).

**Artifact summary:**
- `./e5.8-insights-experiment/PREDICTIONS.md` — 10 pre-registered predictions + contamination disclosure
- `./e5.8-insights-experiment/RESULTS.md` — full analysis
- `./e5.8-insights-experiment/pre-snapshot/` — frozen pre-experiment state (March 15)
- `./e5.8-insights-experiment/post-snapshot/` — frozen post-experiment state (April 16 11:12)

---

## E6. A6 Stress Test — Codex compaction vs Claude

**Completed:** 2026-04-16
**Effort:** ~60 min (broadened search + binary introspection + docs lookup + cache-trajectory scan + writeup)
**Outcome:** A6 framing is **falsified at the structural layer**. Claude Code *has* a full compaction subsystem — `/compact`, `/autocompact`, `/microcompact` slash commands; `autoCompactEnabled: true` default; `tengu_compact*` telemetry; `compact_boundary` system-subtype emissions; `isCompactSummary: true` markers; Anthropic `compact-2026-01-12` beta. The synthesis's "ABSENT / zero matches" claim reflected (a) Lane 2's grep scoped to this project's then-60 parent JSONLs, (b) genuine absence of triggered compaction in that corpus, NOT absence of the mechanism. The asymmetry with Codex is real but is an *observed-telemetry* asymmetry under current operator habits, not a *capability* asymmetry.

### E6.1 Original Claim (preserved verbatim from synthesis-output.md §5 and §4.3)

> **A6: Codex context compaction with no Claude equivalent (cross-lane)**
>
> Lane 3 found 33 `compacted` events in a single large Codex session. Lane 2 searched all 60 Claude JSONL files for "compact"/"compress" and found zero matches.
>
> **Two possible interpretations:**
> 1. Claude Code does not compact context — it simply has a larger effective context window and sessions end before compaction is needed.
> 2. Claude Code compacts but does not log it.
>
> **Impact:** Context pressure analysis is asymmetric. Codex compaction events are a clean signal for "this session hit context limits." For Claude, the proxy is cache_creation_input_tokens growth rate plateauing or the session ending.

And from §4.3 cross-runtime asymmetry table:

> **Compaction events** | **ABSENT** — Lane 2 searched all 60 JSONL files for "compact"/"compress" with zero matches. | `compacted` and `event_msg/context_compacted` events (33 in sampled session). `replacement_history` contains condensed context. | **Codex-unique.** Claude Code either does not compact or does not log compaction. | No bridge. Context pressure detection for Claude must rely on cache growth trajectory slope change as proxy.

### E6.2 Evidence Chain

#### Layer 1: Broadened grep across the full local Claude Code corpus

**Status: verified, 2026-04-16.**

Corpus scope expanded from Lane 2's 60 parent JSONLs to all Claude Code sessions on this machine: **2,577 JSONL files across 21 project directories** (all of `~/.claude/projects/`). Search terms were expanded beyond "compact"/"compress" to include structural markers, slash-command invocation patterns, and summary flags.

Raw grep file-match counts (some reflexive matches from this E6 session are excluded below — see Layer 2):

| Term | File-matches (this project, 1,247 JSONLs) | Interpretation |
|---|---:|---|
| `compact` | 223 | Mostly noise: variable names, feature-flag dumps from Read-tool results, binary-strings displayed in prior sessions |
| `compress` | 262 | Same — mostly noise |
| `summar` | 1,102 | Extremely noisy — includes "summary" in any prose |
| `/compact` | 20 | **All reflexive** — string mentioned in text or bash commands, zero `<command-name>/compact` user invocations |
| `/clear` | 370 | 49 are genuine `<command-name>/clear` user invocations; remainder noise |
| `isCompactSummary` | 1 | Reflexive — E6's own bash command dumped back as tool result |
| `compact_boundary` | 3 | All reflexive from E6 bash output |

**Genuine structural markers after filtering reflexive matches (machine-wide):**

| Marker | Occurrences | Note |
|---|---:|---|
| `<command-name>/compact` user invocations | **0** | Zero across 2,577 JSONLs |
| `isCompactSummary: true` records | **0** | Zero |
| `subtype: compact_boundary` system records | **0** | Zero |
| `<command-name>/clear` user invocations (this project) | **49** | High — user clears proactively |

This is already enough to falsify the *framing* of Lane 2's finding. "Zero matches for compact/compress in 60 JSONLs" does not mean Claude has no compaction — it means compaction *didn't fire* in those sessions. But whether the mechanism exists requires looking at the runtime itself.

#### Layer 2: Binary introspection — does Claude Code have a compaction subsystem?

**Status: verified via `strings /home/rookslog/.local/share/claude/versions/2.1.111` (the currently-installed Claude Code binary).**

**Slash commands present in the binary:**

- `/compact` — manual compaction
- `/autocompact` — auto-compact settings dialog (`tengu_autocompact_dialog_opened`)
- `/microcompact` — variant (likely partial compaction)
- `/clear` — start fresh session

**Settings keys:**

| Key | Shape | Default (from binary) |
|---|---|---|
| `autoCompactEnabled` | bool | `!0` (true) |
| `autoCompactThreshold` | optional number | `-1` fallback (computed from window) |
| `autoCompactWindow` | int, 1e5 ≤ n ≤ 1e6 | resolves from `k6().autoCompactWindow` |
| `autoCompactTracking` | misc | telemetry gating |

**Telemetry events emitted:**

- `tengu_compact` — manual `/compact` invoked
- `tengu_autocompact_command`
- `tengu_autocompact_dialog_opened`
- `tengu_auto_compact_succeeded`
- `tengu_auto_compact_setting_changed`
- `tengu_auto_compact_rapid_refill_breaker` (circuit breaker for rapid re-fill after compaction)
- `tengu_compact_failed` (reasons: `prompt_too_long`, `no_summary`, `api_error`)
- `tengu_compact_ptl_retry` (prompt-too-long retry drops oldest messages)
- `tengu_compact_cache_prefix` / `tengu_compact_cache_sharing_fallback` / `tengu_compact_cache_sharing_success` (cache prefix handling)
- `tengu_compact_streaming_retry`
- `tengu_compact_line_prefix_killswitch`

**Transcript record types in the binary:**

- `subtype: "compact_boundary"` — system message emitted at compaction event; carries `compact_metadata: { trigger: "manual"|"auto", pre_tokens }`
- `isCompactSummary: true` — flag on the assistant summary message
- Anthropic beta `compact-2026-01-12` — server-side compaction edit block (`BetaCompactionBlock`, `BetaCompact20260112Edit`)

The compaction function itself (decompiled fragment from the binary) shows the full flow:

```
// mainline compact function:
let j = await bQ({trigger: A?"auto":"manual", customInstructions:_??null}, abortController.signal);
onCompactProgress?.({type:"hooks_start", hookType:"pre_compact"});
setSDKStatus?.("compacting");
// builds summary request, calls API, retries on prompt_too_long by dropping oldest messages
Q("tengu_compact_failed", {reason:..., preCompactTokenCount:..., promptCacheSharingEnabled:...})
// clears readFileState, loadedNestedMemoryPaths, memorySelector after successful compaction
```

**Conclusion from Layer 2:** Claude Code's compaction mechanism is implemented, enabled by default, and emits both telemetry events AND a `compact_boundary` transcript record whenever it fires. This **falsifies** the synthesis's interpretation "Claude Code may not compact."

#### Layer 3: Authoritative docs cross-reference

**Status: verified via [Anthropic Agent SDK — Slash Commands](https://code.claude.com/docs/en/agent-sdk/slash-commands) (fetched 2026-04-16).**

> ### `/compact` - Compact Conversation History
> The `/compact` command reduces the size of your conversation history by summarizing older messages while preserving important context…
>
> ```typescript
> if (message.type === "system" && message.subtype === "compact_boundary") {
>   console.log("Compaction completed");
>   console.log("Pre-compaction tokens:", message.compact_metadata.pre_tokens);
>   console.log("Trigger:", message.compact_metadata.trigger);
> }
> ```

Docs confirm:
- `/compact` is a documented, first-class slash command
- Compaction emits a `SystemMessage` with `subtype: compact_boundary`
- `compact_metadata` carries `pre_tokens` + `trigger` (`"manual"` or `"auto"`)
- `/clear` starts a fresh conversation (new `session_id` in `init` message)

The JSONL-record format in Layer 1 (`subtype: "compact_boundary"`) matches what docs promise.

#### Layer 4: Cache-trajectory scan — did any session reach the threshold?

**Status: verified empirically, 2026-04-16.**

Scanned all 211 parent JSONLs in this project. For each, computed the maximum per-turn `cache_read_input_tokens` (a proxy for how deep the cached context got).

**Distribution:**

| Threshold | Sessions over |
|---|---:|
| > 100k (minimum `autoCompactWindow`) | **50** |
| > 150k | 39 |
| > 180k (typical Sonnet/Opus 200k-context mark) | 33 |
| > 300k | 9 |
| **Max observed** | **372,898** (opus-4-6, session `7c46a5cd-a8d9-4ac3-b7a6-306a59e0c26c`) |

A turn with 372,898 cache-read tokens is **larger than the standard 200k model context window** — only possible with the 1M-context beta (`context-1m-2025-08-07`), which this user's environment does use (`claude-opus-4-6[1m]`).

**This explains why 50+ sessions exceeded 100k without compacting:** the `autoCompactWindow` is likely pinned to the model's actual context capacity (~1M here), so 370k is still "comfortable". Operators running standard 200k-context models would likely see `compact_boundary` records; the absence in this corpus reflects **1M-context use + operator habit of `/clear` (49 invocations)**, not absence of the mechanism.

**Bonus observation:** the heavy use of `/clear` (49 invocations) is itself a session-boundary signal that may substitute for compaction in this operator's workflow — they reset sessions pre-emptively rather than let auto-compact fire.

### E6.3 Corrected Claim

**A6 (stress-tested, 2026-04-16):** Claude Code has a full-fidelity compaction subsystem. The synthesis's framing ("ABSENT" / "may not compact") is **falsified at the capability layer**. The empirical observation (zero `compact_boundary` records in Lane 2's 60-file corpus and in the full 2,577-file machine-wide corpus) is **correct as a data fact** but does NOT support the "Claude doesn't compact" interpretation. The correct interpretation is:

- **Mechanism exists**: `/compact` (manual), `/autocompact` (settings), `/microcompact` (variant), `auto-compact` (automatic, enabled-by-default). Emits `compact_boundary` system-subtype records with `compact_metadata.{trigger, pre_tokens}`, plus `isCompactSummary: true` flag on the summary message. Uses the Anthropic `compact-2026-01-12` beta.
- **Mechanism is observable**: when it fires, it leaves a structural marker in the JSONL that is searchable by the same extractors that detect Codex `compacted` events.
- **Mechanism hasn't fired in this corpus** because (a) operator uses 1M-context models (threshold pinned higher) and (b) operator pre-emptively invokes `/clear` (49 times) rather than letting context grow to the auto-compact window.
- **Cross-runtime asymmetry is weaker than synthesis §4.3 claims.** Both runtimes have structured compaction events with similar shape (trigger, pre-tokens, boundary). The observed 33-vs-0 asymmetry in the audit sample reflects Codex operator workflow (long single-session runs) vs Claude operator workflow (frequent `/clear`), not a capability gap.

**Residual valid asymmetry:** Codex surfaces `replacement_history` (the actual condensed context as data), which Claude's `compact_boundary` record does NOT include in the transcript — the summary text itself lives as the next assistant message flagged with `isCompactSummary: true`, not embedded in the boundary record. Extractors need to handle this structural difference.

**Epistemic status:**
- Layer 1 (corpus grep): verified machine-wide
- Layer 2 (binary introspection): verified from installed `2.1.111` binary strings; decompiled code fragments quoted
- Layer 3 (docs cross-reference): authoritative, from official Anthropic Agent SDK docs
- Layer 4 (cache-trajectory): verified; hypothesis (1M-context + `/clear` habit explains absence) is *consistent with evidence* but has not been intervention-tested — a deliberate long-session run with 200k-context Sonnet would confirm

**GSDR ownership boundary:** the compaction subsystem is Claude runtime (not ours to fix); the extractor that detects `compact_boundary` events is ours to build. Contrast with E1/E2 (fully GSDR-owned defects).

### E6.4 MEAS- Implications

Adding one new proposed requirement to `correction-and-extensions-2026-04-16.md` §6:

#### §6.22 MEAS-RUNTIME-COMPACT — compaction-event extractor (new requirement)

**Rationale:** compaction is a first-class context-pressure signal for both runtimes. It was previously (pre-stress-test) classified as Codex-unique. It is actually **symmetric** at the mechanism layer, with distinct but extractable surface shapes.

**Extractor shape:**

- **Claude Code:** scan JSONL for `type: system` + `subtype: compact_boundary`; extract `compact_metadata.trigger` ∈ `{"manual","auto"}`, `compact_metadata.pre_tokens` (int). Also scan for `isCompactSummary: true` flag on assistant messages to locate the summary text itself (distinct from the boundary marker).
- **Codex CLI:** scan rollout JSONL for `compacted` event + `event_msg/context_compacted` event; extract `replacement_history` (condensed context) and surrounding token count.

**Features exposed:**
- `compaction_count` (per session)
- `compaction_trigger_mix` (manual vs auto ratio)
- `pre_compact_token_count` (distribution across compactions in a session)
- `has_compaction` (bool — useful as a session-level "was under context pressure" flag)

**Cross-runtime bridge:** both emit a boundary event + a condensed-summary artifact. Normalize field names: `trigger` (both), `pre_tokens` (Claude) ↔ inferred from pre-compaction usage record (Codex), `condensed_content` (Codex `replacement_history`) ↔ next `isCompactSummary:true` assistant message (Claude).

**Preconditions:** session is parent, not subagent (subagent dispatch may gate compaction differently — untested; candidate for C6 follow-up). Session used standard runtime (not `--bare` or sandbox).

**Priority:** synthesis §8.1 Priority 2 (moderate effort; gated on corpus containing events). **Lower empirical priority for now** because zero events in this project's 211-session corpus — MEAS-RUNTIME-COMPACT is a capability-level requirement, not a near-term data-richness requirement.

**Tie to operator-habit feature:**
- Complement with `/clear` invocation count as a **separate feature** — heavy `/clear` use substitutes for compaction and should be measurable regardless of whether compaction fires. Per-session: `clear_invocation_count` (scan for `<command-name>/clear` in user message content).

**Depends on:** nothing runtime-side; waiting only on A1 MEAS-RUNTIME-* taxonomy finalization.

### E6.5 Implications for Governance (pre-57.5-handoff §A1)

**Synthesis §4.3 cross-runtime asymmetry table needs a footnote** (not a rewrite per status-downgrade rules): "Compaction events: asymmetry is observed-corpus only, not capability. Both runtimes emit structured compaction events; E6 (2026-04-16) documents the Claude-side shape."

**Synthesis §7.4 "I don't know yet" bullet** ("Whether Claude Code performs silent context compaction") is now **resolved**: Claude Code performs compaction, does so non-silently (emits `compact_boundary`), and is NOT performing it in this corpus because threshold hasn't been hit.

**Synthesis Decision 5** (cross-runtime asymmetry markers, revised by correction doc) gains one more cross-runtime signal that can be genuinely matched rather than treated as Codex-unique: compaction events become a bridge signal for context-pressure analysis in both runtimes.

**MEAS-RUNTIME-COMPACT is additive**: doesn't change the three-subfamily split (MEAS-RUNTIME + MEAS-DERIVED + MEAS-GSDR), just adds one extractor under RUNTIME.

**Discuss-phase 57.5 impact:** Q6 (cross-runtime controlled experiment) gains a new verification dimension — a deliberate long-session run on each runtime provides a ground-truth test for whether compaction-event extractors work symmetrically.

### E6.6 Action Items (side-artifacts of E6)

- [ ] **Log sig-2026-04-16-claude-compaction-mechanism-undocumented** — cross-lane audit under-weighted the Claude capability because Lane 2's grep scope was narrow and the feature didn't fire in the sample; audit method should include "inspect runtime binary for feature parity before concluding absence"
- [ ] **Log sig-2026-04-16-clear-invocations-substitute-for-compaction** — operator habit (49 `/clear` vs 0 `/compact` invocations) is itself a measurable workflow signal; should be a first-class feature alongside compaction count
- [ ] **Consider spk-2026-04-17-compaction-symmetry-intervention-test** — small spike: run a deliberate long 200k-context Sonnet session until auto-compact fires, capture the `compact_boundary` record, verify extractor output matches docs. Tightens H-E6 from "consistent with evidence" to "intervention-tested."

These fall out of E6 but are not blocking.

### E6.7 Falsification Pass (2026-04-16, retroactive)

Three targeted tests against E6's load-bearing claims.

#### Test 1 — "machine-wide corpus truly has zero `compact_boundary` records"

**Method:** after writing this section, re-ran the cross-project structural search with the terms inside string quotes (to exclude my own reflexive matches from THIS session):

```
grep -rc '"subtype":"compact_boundary"' --include=*.jsonl  ~/.claude/projects  → 0 files with matches
grep -rc '"isCompactSummary":true'     --include=*.jsonl  ~/.claude/projects  → 0 files with matches
grep -rc '<command-name>/compact<'     --include=*.jsonl  ~/.claude/projects  → 1 file, 3 hits (this E6 session's own JSONL, reflexive only)
```

**Result — claim survives.** Genuine structural markers are absent machine-wide. The 3 reflexive hits in this session's own file are from *this* Test-1 bash command being echoed back as tool-use input + tool-result — a predictable reflexivity artifact, not a real invocation. Compaction has not fired in any session in the local corpus.

#### Test 2 — "binary-strings evidence could be dead code"

**Method:** verify that the `compact_boundary` and `isCompactSummary` symbols in the 2.1.111 binary appear in **live emission paths**, not just legacy leftovers.

- Docs (Layer 3) are dated and current (Agent SDK, fetched 2026-04-16); use the exact `compact_boundary` subtype.
- Telemetry events `tengu_auto_compact_succeeded` appear in the same binary section as the compaction function `wbH` (decompiled), which is awaited from the autocompact window check.
- Docs' example code matches binary's code-path exactly.

**Result — claim survives.** The symbols are live, not dead code.

#### Test 3 — "the 1M-context hypothesis, not a bug, explains non-firing"

**Method:** cross-reference the 372k-token session (`7c46a5cd`) against user's environment note. User is on Opus 4.6 1M-context variant (confirmed via env "Opus 4.6 [1m]"). A 200k-context Sonnet session with the same cache-read would have crashed, not silently succeeded — so 370k cache-reads in a single turn **is evidence of 1M-context variant use**, consistent with the hypothesis.

**Result — claim survives with epistemic hedge.** Not intervention-tested but consistent with independent evidence. The only way to disconfirm would be to find a 200k-context session in the corpus that exceeded its context window without compacting — none found.

#### Net effect on E6

All three load-bearing claims survive falsification. One hedge: Test 3 is consistency-tested, not intervention-tested. An optional C6-style spike (run a deliberate long Sonnet session until auto-compact fires) would close that gap.

---

*Stress-tests file initiated 2026-04-16. E1–E5 + E5.8 + E6 complete. Document may be extended if future anomalies surface requiring similar stress-testing.*
