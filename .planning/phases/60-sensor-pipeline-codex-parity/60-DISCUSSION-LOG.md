# Phase 60: Sensor Pipeline & Codex Parity - Discussion Log

> **Justificatory sidecar.** Consumed by gsdr-context-checker for claim verification.
> Also serves as human-readable audit trail of discuss-phase decisions.

**Date:** 2026-04-21
**Phase:** 60-sensor-pipeline-codex-parity
**Mode:** exploratory --auto
**Areas discussed:** Log sensor cross-runtime adapter; Codex session discovery via state_5.sqlite; Patch sensor mechanics; Post-install cross-runtime parity verification; SENS-07 error-handling discipline; XRT-02 patch compatibility checking; Cross-runtime sensor substrate and hook posture

***

## Gray Areas (Audit Trail)

This run executed in `--auto` under exploratory mode. No interactive AskUserQuestion calls
were issued. Gray areas were inferred from ROADMAP.md Success Criteria, the
`cross-runtime-parity-research.md` living doc, prior phase CONTEXT.md files (55.2, 58, 58.1),
and KB signals (log-sensor operability + cross-runtime drift). Each gray area was resolved
via typed claims in CONTEXT.md per claim-types.md auto-progression rules: `evidenced:cited`
/ `decided` / `stipulated` / `governing` are auto-ready; `assumed:reasoned` carry honest
rationale; genuinely unresolved items are recorded as `open` in the Open Questions section
and routed to the researcher.

### Gray area 1 — Sensor topology for the cross-runtime log sensor

| Option | Description | Selected |
|--------|-------------|----------|
| Single `gsd-log-sensor.md` with adapter branches inside | One sensor name, two runtime branches internal | ✓ |
| Two sensors: `gsd-log-sensor-claude.md` + `gsd-log-sensor-codex.md` | Per-runtime sensor files | |
| Dispatcher sensor spawning runtime-specific children | Compose via collect-signals | |

**Auto-selected choice:** Single sensor with internal adapter.
**Notes:** EXT-06 (drop-a-file sensor) convention captured in `sig-2026-03-04-drop-a-file-sensor-extensibility-pattern` + the glob in `collect-signals.md` `discover_sensors` step make the single-sensor approach the least-friction path. Splitting would double-count during discovery and fragment the progressive-deepening rulebook. Stages 3–6 are already runtime-agnostic per research §3.1 — only Session Discovery, Fingerprint Extraction, and narrow/expanded reads need adapter branches.

### Gray area 2 — Codex session discovery source of truth

| Option | Description | Selected |
|--------|-------------|----------|
| `state_5.sqlite` via `sqlite3` CLI, filesystem fallback on failure | Primary SQL, secondary FS scan | ✓ |
| Filesystem scan of `~/.codex/sessions/YYYY/MM/DD/` only | Avoid SQL dependency entirely | |
| `state_5.sqlite` via `node:sqlite` in the sensor | Embed Node binding in agent | |
| `session_index.jsonl` only | Use the JSONL index, skip SQLite | |

**Auto-selected choice:** SQLite CLI primary + filesystem fallback + SENS-07 diagnostic when degraded.
**Notes:** Research §3.2 Option A explicitly recommends SQLite for richer metadata (`cwd, created_at, tokens_used, model, reasoning_effort, git_sha, source`). Node-binding inside agent context would couple the sensor to gsd-tools Node runtime, which violates the sensor-harness boundary. Filesystem scan is the correct fallback because the research documents both paths and the fallback still filters by `session_meta.payload.cwd`. Emitting a SENS-07 `codex-sqlite-unavailable` diagnostic preserves observability of the degradation.

### Gray area 3 — Patch sensor invocation surface

| Option | Description | Selected |
|--------|-------------|----------|
| `gsd patch-check` subcommand + drop-a-file sensor (dual-surface) | Human report + pipeline signals | ✓ |
| `gsd patch-check` subcommand only | Developer on-demand only |  |
| Drop-a-file sensor only | Pipeline integration only | |
| Config flag to toggle per-install | Imperative toggle | |

**Auto-selected choice:** Dual surface, shared classifier library.
**Notes:** Research §2.4 recommends subcommand (not sensor pipeline) for end-user ergonomics. SENS-05 requires a developer-facing report. SENS-04 / SENS-05 also need the machinery to surface drift as signals for synthesis. The dual-surface pattern already works for `gsdr-health` — same classifier, two callers. Known concern `sig-2026-02-24-local-patches-false-positive-dogfooding` handled via Q2 (open) which will calibrate noise control.

### Gray area 4 — Post-install parity verification behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Advisory report + JSON artifact, no interactive prompt | Non-blocking, CI-safe | ✓ |
| Interactive prompt offering auto-install of other runtime | Aggressive remediation | |
| Fail the install when drift detected | Hard gate | |
| Silent JSON artifact, no stdout | Programmatic-only |  |

**Auto-selected choice:** Advisory report + copy-paste command + `gsd-parity-report.json` artifact.
**Notes:** Matches Phase 58.1 DC-6 ("degrade explicitly"). Avoids auto-applying patches the user deliberately held back. JSON artifact enables CI / workflow consumption without parsing stdout. Q3 flags interactive-prompt as a reversible upgrade worth researching — if `install.js` is TTY-aware and CI contexts are preserved, interactive can be added later without breaking today's contract.

### Gray area 5 — SENS-07 parse-failure reporting

| Option | Description | Selected |
|--------|-------------|----------|
| Emit structured signal candidate per parse failure, continue with next file | SENS-07 literal reading | ✓ |
| Silently drop bad files, log to stderr only | Status quo |  |
| Crash the sensor on first failure | Fail-fast | |
| Aggregate into one rollup signal per phase | Noise reduction | |

**Auto-selected choice:** Structured signal per failure, continue; aggregation calibration via Q5.
**Notes:** SENS-07's motivation (`review: R11`) is precisely the silent-drop failure mode. Single-writer invariant means the sensor emits candidates; the synthesizer decides trace-filter. Q5 is open specifically because signal volume could saturate and may need a per-event-type cap after real-corpus measurement.

### Gray area 6 — Cross-runtime sensor substrate (hook posture)

| Option | Description | Selected |
|--------|-------------|----------|
| No new Codex hook substrate; sensors + installer only | Phase 58.1 DC-4 literal | ✓ |
| Install Codex `hooks.json` gated by feature-flag check | Conditional hook install | |
| Install `hooks.json` unconditionally | Assume hooks available | |

**Auto-selected choice:** No new Codex hook substrate.
**Notes:** Phase 58.1 DC-4 is a hard rule ("No new Codex hook substrate introduction without feature flag stabilization"). Codex hooks status remains "under development" per `codex features list`. Post-install parity fires inside `bin/install.js` process itself, not via any hook — so hook availability is not a prerequisite for SENS-06. XRT-01 substrate declaration enforced per-capability in Phase 60 scope.

### Gray area 7 — XRT-02 patch-compatibility validator location

| Option | Description | Selected |
|--------|-------------|----------|
| Validator at reapply site (pre-apply gate) | Validate when it matters | ✓ |
| Validator at save-patches step (pre-install) | Validate at capture |  |
| Validator in a separate `gsd patch-validate` subcommand | Standalone |  |
| Both reapply + save sites | Dual validation |  |

**Auto-selected choice:** Reapply-site validator; shared classification vocabulary with patch sensor.
**Notes:** Compatibility is a re-application concern — the backed-up patch is evidence, and target-runtime compatibility only becomes load-bearing when we try to apply. Save-site validation would block pre-install, which must not happen. Shared vocabulary (`format-drift`, `feature-gap` et al.) prevents two parallel taxonomies. Q4 (open) decides whether the validator's source-of-truth is a static JSON snapshot or live `install.js` import — deferred to researcher for evidence-based recommendation.

### Claude's Discretion

- Adapter organization (inline python3 vs helper script under `get-shit-done/bin/`)
- Subcommand naming (`gsd patch-check` | `gsd patches` | `gsd divergence-check`)
- Golden-fixture shape for classifier tests
- Aggregate vs per-runtime JSON artifact for post-install parity
- Number of historical Codex versions retained in compat tables
- SENS-07 diagnostic granularity (per-file vs per-event-type-per-phase)

### Deferred Ideas

See `<deferred>` section in CONTEXT.md. Highlights:
- Cross-project distribution gap → v1.21
- Cross-model sensor diversity (GPT sensors via `codex exec`) → v1.21
- `history.jsonl` cross-session patterns → future cross-session-reflection phase
- Codex `logs_1.sqlite` → debugging phase
- Codex memories divergence → v1.21+
- WebFetch null-mapping surface → separate spec cleanup
- PID management for concurrent Codex sessions → Phase 64 (parallel execution)
- Telemetry identity extractor rewiring (PROV-09..14) → Phase 60.1
- Reflection stratification by model × profile × reasoning_effort → Phase 60.1
- Live-agent E2E chain tests → Phase 60.1
- Interactive post-install prompt → Q3-dependent promotion or later

***

## Claim Justifications

### Log sensor cross-runtime adapter (SENS-01, SENS-02, SENS-03)

**[evidenced:cited] Stages 3–6 of the log sensor pipeline are runtime-agnostic once inputs are normalized**
- **Citation:** `agents/gsd-log-sensor.md` Stages 2–5 body + parity research §3.1 ("Only stages 1, 2, and the read operations in stage 5 need runtime-specific code. Stages 3, 4, and 6 operate on normalized data")
- **Verification:** Cross-read against current agent spec at 2026-04-21; sections match the research snapshot.

**[decided:reasoned] Adapter lives as a thin pre-processor layer inside the log-sensor agent spec**
- **Alternatives considered:** (a) two runtime-specific sensor files, (b) dispatcher sensor spawning runtime-specific children
- **Why rejected:** (a) double-counts during glob discovery (`gsd-*-sensor.md`), fragments the progressive-deepening rulebook, fights EXT-06 convention captured in `sig-2026-03-04-drop-a-file-sensor-extensibility-pattern`; (b) dispatcher pattern would require collect-signals changes — not necessary for single-agent runtime branching.
- **User said:** Auto-resolved under `--auto`; decision aligns with PROJECT.md extensibility and EXT-06 signal.

**[decided:reasoned] Normalized fingerprint schema with optional additive Codex-only fields**
- **Alternatives considered:** Lowest-common-denominator schema (drop Codex-only fields), Codex-superset schema (force Claude to emit `not_available` for every Codex-only field)
- **Why rejected:** LCD drops load-bearing information (`reasoning_output_tokens`, `rate_limits`, `source: exec | cli`) that Codex sessions expose; Phase 57.7 MEAS-RUNTIME-05 parity principle already rejects the drop-to-LCD move. Forcing Claude-side `not_available` per Codex-only field is the chosen approach: downstream consumers receive explicit absence markers, not a smaller schema. (G-2 restates this.)

**[assumed:reasoned] The existing inline python3 Stage 1c extractor can be adapted without a new dependency**
- **Challenge protocol:** If real Codex JSONL corpus contains schema variants not enumerated in research sample (new event types, missing `session_meta` on partial rollouts, truncated files), adapter must emit SENS-07 warnings — not crash. First real run on live corpus falsifies if > 3 unknown event types per 10 sessions.
- **Evidence checked:** Research §3.4 lists Codex event-type branches; structural isomorphism with existing Claude branches verified.
- **Why reasonable:** Progressive deepening already wraps parsing in try/except at Stage 3a; extending pattern is mechanical.

**[assumed:reasoned] Subagent/sub-thread session files exist on both runtimes and should be deprioritized during triage**
- **Challenge protocol:** Enumerate Codex `~/.codex/sessions/YYYY/MM/DD/*.jsonl` + `state_5.sqlite threads.agent_path` + `source` columns; if Codex subagents do not produce separate rollouts, deprioritization heuristic is wasted but harmless.
- **Evidence checked:** Research §7.3 documents `agent_path` column exists; live enumeration deferred to Q1.
- **Why reasonable:** Claude precedent + `agent_path` existence suggests the pattern; confirmable via Q1 research.

### Codex session discovery via state_5.sqlite (SENS-03)

**[evidenced:cited] Research §3.2 documents state_5.sqlite schema**
- **Citation:** `.planning/research/cross-runtime-parity-research.md` §3.2 + §7.3 (schema snapshot)
- **Verification:** Read at 2026-04-21; `last_audited: 2026-04-09`, `next_audit_due: 2026-04-23`. G-1 requires re-audit before ship.

**[decided:reasoned] Primary discovery uses `sqlite3` CLI from bash**
- **Alternatives considered:** `node:sqlite` embedded in sensor, filesystem scan only, `session_index.jsonl` only
- **Why rejected:** `node:sqlite` couples agent to Node runtime (violates harness boundary — sensor runs under agent harness, not gsd-tools Node); filesystem scan skips richer metadata and is a fallback, not primary; `session_index.jsonl` lacks the `cwd`/`tokens_used`/`model` fields that pre-filter depends on.
- **User said:** Auto-resolved under `--auto`.

**[decided:reasoned] Fallback is date-partitioned filesystem scan emitting SENS-07 diagnostic**
- **Alternatives considered:** Fail hard on SQLite absence (refuse to run Codex sensor)
- **Why rejected:** Fail-hard collapses sensor coverage to zero whenever SQLite is unavailable; filesystem scan is documented in research §3.2 Option B and is forward-compatible. Diagnostic signal preserves observability of degraded operation.

**[assumed:reasoned] Codex schema may drift; column probe + fallback handle it**
- **Challenge protocol:** `PRAGMA table_info(threads)` probe before relying on columns; next-audit-due gate (G-1) forces re-verification before ship.
- **Evidence checked:** Schema filename `state_5` encodes a version suffix — implies schema-version history exists and can change.
- **Why reasonable:** Defensive column-probing is standard SQLite adapter pattern; cost is one extra query per sensor run.

**[assumed:reasoned] Token counts from threads.tokens_used are pre-filter-authoritative, not fingerprint-authoritative**
- **Challenge protocol:** If fingerprint totals derived from in-session `token_count` events diverge from `tokens_used` by >5% across sample, investigate whether `tokens_used` is authoritative or stale.
- **Evidence checked:** Research §1.1 field comparison.
- **Why reasonable:** Pre-filter decisions tolerate coarse numbers; final fingerprints need session-internal provenance to stay runtime-symmetric.

### Patch sensor mechanics (SENS-04, SENS-05)

**[evidenced:cited] bin/install.js already provides SHA256 manifest plumbing**
- **Citation:** `bin/install.js` lines 1720–1930; constants `PATCHES_DIR_NAME`, `MANIFEST_NAME`; functions `fileHash`, `generateManifest`, `writeManifest`, `saveLocalPatches`, `pruneRedundantPatches`, `reportLocalPatches`
- **Verification:** Read at 2026-04-21; functions present and documented.

**[evidenced:cited] Live patch backup at ~/.codex/gsd-local-patches/backup-meta.json**
- **Citation:** Research §2.1 ("17 files were backed up from version 1.17.5 … the backed-up `gsd-tools.js` no longer exists")
- **Verification:** Research doc explicitly cites the live artifact; acts as golden fixture for classifier.

**[evidenced:cited] Two-layer architecture per research §2.2**
- **Citation:** `.planning/research/cross-runtime-parity-research.md` §2.2
- **Verification:** Layer 1 (source vs installed) + Layer 2 (cross-runtime installed) explicitly enumerated.

**[decided:reasoned] Layer 2 reuses installer format-conversion helpers**
- **Alternatives considered:** Reimplement format normalization in the sensor
- **Why rejected:** Two implementations drift; format conversion is installer's canonical responsibility. Exporting helpers keeps single source of truth (CLAUDE.md discipline).
- **User said:** Auto-resolved under `--auto`.

**[decided:reasoned] Classification taxonomy adopted verbatim from research §2.3**
- **Alternatives considered:** Develop new taxonomy
- **Why rejected:** Research vocabulary (`bug | stale | customization | format-drift | feature-gap`) is already evidence-grounded by patch-backup data; introducing parallel vocabulary creates translation tax.

**[decided:reasoned] Dual-surface: subcommand + drop-a-file sensor**
- **Alternatives considered:** Subcommand only, sensor only
- **Why rejected:** Subcommand only leaves pipeline integration unwired; sensor only loses developer ergonomics of the report. Precedent: `gsdr-health` is dual-surface.

**[assumed:reasoned] Running patch-sensor on every collect-signals is acceptable overhead**
- **Challenge protocol:** Measure on first run in a phase artifact; if > 3s or > 20 signals per run, gate the sensor to on-demand default.
- **Evidence checked:** Manifest hash pass is O(N files) with cached reads; known precedent `sig-2026-02-24-local-patches-false-positive-dogfooding` suggests dev-repo noise is already a live problem.
- **Why reasonable:** Config gate already exists (`signal_collection.sensors.patch.enabled`); downgrade is reversible. Q2 (open) researches noise-control heuristics.

### Post-install cross-runtime parity verification (SENS-06)

**[evidenced:cited] bin/install.js otherScopeVersionPath probe already exists**
- **Citation:** `bin/install.js` lines 1962–1977 (cross-scope detection for local-vs-global).
- **Verification:** Read at 2026-04-21; probe is present.

**[decided:reasoned] Advisory report + JSON artifact, no interactive prompt, no fail-on-drift**
- **Alternatives considered:** Fail install on drift, interactive prompt, silent JSON-only
- **Why rejected:** Fail-install blocks release automation + CI (regression); interactive prompts break CI (but Q3 researches whether they can be added safely later); silent-only hides the signal from humans.
- **User said:** Auto-resolved under `--auto`. Decision aligns with Phase 58.1 DC-6 ("degrade explicitly").

**[decided:reasoned] JSON artifact at `.claude/gsd-parity-report.json` (or `.codex/...`)**
- **Alternatives considered:** Write to `.planning/` (but mixes runtime artifact with planning state); write to stdout only (but CI consumers need structured data)
- **Why rejected:** Co-locating with runtime install dir keeps runtime artifacts together; `gsd-file-manifest.json` precedent lives in the same directory.

**[assumed:reasoned] "Other runtime installed" detection reuses Phase 58.1 path-resolution precedence**
- **Challenge protocol:** Integration test with mixed explicit-flag / env-var / default paths; if precedence diverges, fix source.
- **Evidence checked:** Phase 58.1 DC-3 explicitly centralized Codex path resolution; helper exists in `bin/install.js`.
- **Why reasonable:** DRY; diverging path resolution between Phase 58.1 and Phase 60 reintroduces the exact "multiple authorities" problem 58.1 just solved.

### SENS-07 error-handling discipline

**[decided:reasoned] Parse failures emit structured signal candidates, not stderr-only**
- **Alternatives considered:** Stderr only (status quo); crash; aggregate rollup
- **Why rejected:** SENS-07 motivation text (`review: R11`) is literally "no silent-drop"; stderr-only is silent-drop to the signal pipeline; crash propagates failure beyond the offending file. Rollup is deferred to Q5 after real-corpus measurement.

**[decided:reasoned] Crash-resistance is orthogonal to emission — all parsing wrapped try/except**
- **Alternatives considered:** Let unhandled exceptions propagate
- **Why rejected:** A single malformed file must not abort phase-wide signal collection — the existing log-sensor blind-spots list already names this concern.

**[governing:reasoned] Sensor emits; synthesizer arbitrates trace-filter**
- **Source:** `collect-signals.md` single-writer invariant + `gsd-log-sensor.md` guideline "ALL quality gating is the synthesizer's responsibility"
- **Scope of governance:** All sensor output, including new SENS-07 diagnostic signals.

### XRT-02 patch compatibility checking

**[decided:reasoned] XRT-02 validator at the reapply site with shared taxonomy**
- **Alternatives considered:** Validator at save-patches step (blocks install, unacceptable); separate subcommand (works but duplicates glue)
- **Why rejected:** Save-time validation is wrong layer — the patch is evidence at save time, a load-bearing question at reapply time. Shared taxonomy with patch sensor prevents two parallel vocabularies.

**[decided:reasoned] Incompatible patches map into the existing classification vocabulary**
- **Alternatives considered:** Introduce compat-specific classes
- **Why rejected:** An incompatible patch IS a `format-drift` or `feature-gap` when viewed from compatibility — no new vocabulary needed. Q4 open: evidence source (static snapshot vs live installer import).

**[assumed:reasoned] Validator is reapply-site, not save-site, because compat is a re-application concern**
- **Challenge protocol:** If a high-leverage save-time compat check emerges during research, refactor is possible but touches all validator call sites.
- **Evidence checked:** `commands/gsd/reapply-patches.md` is the existing reapply surface; save-patches is pre-install non-blocking.
- **Why reasonable:** Compatibility load-bearing moment is re-application; saving preserves evidence without judgment.

### Cross-runtime sensor substrate and hook posture

**[governing:reasoned] No new Codex hook substrate in Phase 60**
- **Source:** Phase 58.1 DC-4 ("No new Codex hook substrate introduction without feature flag stabilization") + live `codex features list` confirming `codex_hooks` is "under development"
- **Scope of governance:** Every Codex-touching Phase 60 surface; post-install parity runs inside `bin/install.js` process itself, not via any hook.

**[decided:reasoned] Each Codex-touching surface carries per-runtime substrate declaration**
- **Alternatives considered:** Treat Codex-behavior notes as optional documentation
- **Why rejected:** Phase 58 XRT-01 / Success Criterion 8 makes declaration mandatory; Phase 58.1 enforced this retroactively and established the `applies-via-<substrate>` / `does-not-apply-with-reason` vocabulary. Phase 60 inherits the contract.

### Claim Dependencies

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| `[decided]` Adapter lives in single `gsd-log-sensor.md` | `[evidenced:cited]` EXT-06 glob discovery in `collect-signals.md` | LOW — discovery mechanically verified in VERIFICATION.md |
| `[decided]` SQLite CLI primary, filesystem fallback | `[assumed:reasoned]` schema may drift; column probe handles | MEDIUM — if schema drift removes required columns, fallback handles but performance degrades |
| `[decided]` Patch sensor dual-surface | `[evidenced:cited]` `gsdr-health` dual-surface precedent | LOW — precedent pattern |
| `[decided]` Classification taxonomy from research §2.3 | `[evidenced:cited]` live patch backup fixture | LOW — data exists; classifier just interprets |
| `[decided]` Post-install parity advisory-only | `[decided]` Phase 58.1 DC-6 + `[governing]` G-4 honesty rule | LOW — design rule, traceable |
| `[assumed:reasoned]` Patch-sensor every-run overhead acceptable | `[evidenced]` dogfooding false-positive precedent | MEDIUM — Q2 addresses noise; reversible via config gate |
| `[decided]` XRT-02 validator at reapply site | `[assumed:reasoned]` compat is a reapply concern | MEDIUM — refactor to save-site possible if Q4 shows high-leverage save-time check |
| `[assumed:reasoned]` Codex 0.118.0 schema stable enough | `[evidenced:cited]` research audit 2026-04-09, due 2026-04-23 | MEDIUM — G-1 re-audit gate before ship |
| `[governing]` No Codex hooks in Phase 60 | `[evidenced:cited]` Phase 58.1 DC-4 + live `codex features list` | LOW — carried forward governing rule |

***

## Context-Checker Verification Log

This section is populated by the gsdr-context-checker agent after it runs.
Leave this header and a placeholder line when first writing the file.

*Awaiting context-checker run.*
