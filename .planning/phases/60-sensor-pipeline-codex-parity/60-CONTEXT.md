# Phase 60: Sensor Pipeline & Codex Parity - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning
**Mode:** Exploratory --auto — typed claims with explicit uncertainty; open questions route to researcher per claim-types.md auto-progression rules

<domain>
## Phase Boundary

[decided:reasoned] Phase 60 makes the log sensor and a new patch sensor operational across Claude Code and Codex CLI, with post-install cross-runtime parity verification and patch-compatibility checking. Its job is to close the three `v1.20` sensor/parity gaps already scoped into `SENS-01..SENS-07` + `XRT-02`: (a) the log sensor stops being a stubbed/skipped placeholder and starts producing real session-log signals via progressive deepening on both runtimes, (b) the patch sensor detects source-vs-installed drift using the installer's existing SHA256 manifest and classifies what it finds, and (c) post-install parity verification fires automatically when `bin/install.js` runs and one runtime already has a prior install.

**In scope for Phase 60:**
- [decided:reasoned] Log sensor (`agents/gsd-log-sensor.md`) becomes cross-runtime — Codex adapter for session discovery, fingerprint extraction, and narrow/expanded message reads normalizes to one schema (SENS-01, SENS-02, SENS-03) <!-- typed by context-checker -->
- [decided:reasoned] SENS-07 warnings-as-signals path: parse failures, format mismatches, unexpected structures emit diagnostic signals instead of crashing or silently returning empty <!-- typed by context-checker -->
- New sensor/tool: patch sensor detects source-vs-installed divergence using the existing `generateManifest()` / `fileHash()` / `gsd-file-manifest.json` plumbing, and classifies each divergence into the taxonomy `bug | stale | customization | format-drift | feature-gap` with a developer-facing report (SENS-04, SENS-05)
- Post-install cross-runtime parity verification hook in `bin/install.js` that detects "other runtime is installed here too" and reports / remediates divergence (SENS-06)
- Patch compatibility checking against target runtime before cross-runtime application of any patch (XRT-02), wired to the `reapply-patches` surface or the patch-sensor report
- Focused automated regression coverage under `tests/` for: Codex session discovery (state_5.sqlite primary + filesystem fallback), cross-runtime fingerprint parity, patch classification accuracy on a golden fixture, and post-install parity detection

**Explicitly out of scope (deferred per research §4 and adjacent phases):**
- [decided:reasoned] Cross-project distribution gap (non-GSDR projects running global upstream GSD) — deferred to v1.21 per MILESTONE-CONTEXT.md and Phase 58.1's narrower carve-out <!-- typed by context-checker -->
- Any new Codex hook substrate introduction — Codex hooks are still "under development" per `codex features list` and Phase 58.1 DC-4. Post-install parity runs inside `bin/install.js` itself, not via a Codex hook
- Telemetry / measurement identity rewiring (PROV-09..PROV-14) — that is Phase 60.1's scope; Phase 60 builds the substrate Phase 60.1 rewires
- Agent performance / reflection stratification work — Phase 60.1
- Full live-agent E2E chain tests — Phase 60.1
- Cross-model sensor diversity (Claude sensor + GPT sensor) — explicitly noted as "Beyond Formal Scope" in the parity research; not required to close SENS-01..07 or XRT-02
- User memory / Codex memories divergence — v1.21+
- Silent mirror-level fixes to `.claude/` or `.codex/` generated outputs — per Phase 58.1 DC-2, those are outputs; fix source

</domain>

<working_model>
## Working Model & Assumptions

### Log sensor cross-runtime adapter (SENS-01, SENS-02, SENS-03)

**Current state:** [evidenced:cited] `agents/gsd-log-sensor.md` already specifies Stage 1–5 progressive deepening (structural fingerprinting → intelligent triage → progressive context expansion → signal construction → return). Stage 1a hardcodes Claude Code path derivation: `ENCODED_PATH=$(pwd | sed 's|/|-|g'); LOG_DIR="$HOME/.claude/projects/${ENCODED_PATH}"`. Stage 3a's python3 `json.loads` extraction assumes top-level `type: "user" | "assistant"` events and `message.content` shape. The spec's own `<blind_spots>` explicitly names "Codex sessions (`~/.codex/history.jsonl`) have a different format and require adapter logic" — so the gap is declared at the spec level, not hidden.

- [evidenced:cited] Stages 3–6 of the log sensor pipeline are runtime-agnostic once inputs are normalized; only Session Discovery (Stage 1a), Fingerprint Extraction (Stage 1c), and the narrow/expanded reads in Stage 3 touch runtime-specific shapes. Research §3.1 confirms the same decomposition.
- [decided:reasoned] The adapter lives as a thin pre-processor layer inside the log-sensor agent spec (single sensor name, two runtime branches), not as a second sensor. Rationale: collect-signals glob-discovers one `gsd-log-sensor.md`, splitting into `gsd-log-sensor-claude.md` + `gsd-log-sensor-codex.md` would double-count detection, fragment the progressive-deepening rulebook, and fight the EXT-06 drop-a-file convention.
- [decided:reasoned] The fingerprint schema exposed to Stages 2–5 is a single normalized shape (`session_id, start_time, end_time, user_message_count, assistant_message_count, tool_call_count, tool_error_count, total_tokens, model, interruptions, direction_changes`). Codex-only richer fields (`reasoning_output_tokens`, `rate_limits.primary.used_percent`, `model_context_window`, `source: "exec" | "cli"`) are carried as optional additive fields, `not_available` on Claude — never dropped to lowest-common-denominator.
- [assumed:reasoned] The existing inline python3 Stage 1c extractor can be adapted without adopting a new dependency; Codex JSONL parsing needs `obj['type'] == 'response_item'` / `event_msg` branches, which is structurally isomorphic to the existing branches. Challenge protocol: if the real Codex JSONL corpus on this machine contains schema variants the research sample did not (event types we have not enumerated, missing `session_meta` on partial rollouts, truncated files), the adapter must emit SENS-07 warnings rather than crash. Basis: §1.3, §3.4 of the parity research, audited 2026-04-09 against Codex 0.118.0 live sessions.
- [assumed:reasoned] Subagent / sub-thread session files exist on both runtimes and should be deprioritized during triage. Claude Code writes separate JSONLs for subagent sessions (the spec calls these "mechanical, not conversational"). Codex equivalents have not been empirically enumerated — this is an `[open]` question below.

### Codex session discovery via state_5.sqlite (SENS-03)

**Current state:** [evidenced:cited] Research §3.2 documents `~/.codex/state_5.sqlite` as the authoritative session index, with the `threads` table providing `id, rollout_path, cwd, created_at, updated_at, source, tokens_used, model, reasoning_effort, git_sha, git_branch, git_origin_url, cli_version, agent_path, agent_nickname, title`. This is strictly richer than Claude Code's filesystem-only session discovery. The schema snapshot is dated 2026-04-09 against Codex 0.118.0; `last_audited` in the research frontmatter is 2026-04-09 with `next_audit_due: 2026-04-23`.

- [evidenced:cited] SQLite is the recommended primary path (Research §3.2 Option A). Sample query: `SELECT rollout_path FROM threads WHERE cwd = '<pwd>' ORDER BY created_at DESC`.
- [decided:reasoned] Primary discovery uses the `sqlite3` CLI invoked from bash (Stage 1a), because it avoids adding a runtime Node dependency at sensor level and matches how the sensor already shells out for fingerprint extraction. `node:sqlite` is already available in gsd-tools (Node >= 22.5.0 per KB-11), but the sensor runs under the agent harness which should not assume sqlite bindings. Alternatives rejected: (a) require `node:sqlite` — couples the sensor to gsd-tools runtime; (b) parse `session_index.jsonl` only — skips the richer schema in `state_5.sqlite`.
- [decided:reasoned] Fallback discovery is a date-partitioned filesystem scan of `~/.codex/sessions/YYYY/MM/DD/` filtered by `session_meta.payload.cwd`, used when `state_5.sqlite` is absent, locked, schema-drifted, or SQLite CLI is unavailable. Research §3.2 Option B provides the mechanism. The fallback emits a SENS-07 diagnostic signal (`codex-sqlite-unavailable`) so the fact of running degraded is observable.
- [assumed:reasoned] Codex schema may drift before GSDR does — filename `state_5.sqlite` already encodes a schema-version suffix. The adapter probes columns before relying on them (`PRAGMA table_info(threads)`) and downgrades gracefully (e.g., no `reasoning_effort` column → that field becomes `not_available` in the fingerprint). Challenge protocol: track future Codex versions in `cross-runtime-parity-research.md` and bump `last_audited`; if a required column like `cwd` disappears, the fallback is the filesystem scan.
- [assumed:reasoned] Token counts from `threads.tokens_used` are authoritative for pre-filtering (decide whether a session is worth fingerprinting) but not authoritative for fingerprint totals — those still come from the session's own `token_count` events so Claude and Codex values are derived the same way. Basis: research §1.1 field comparison.

### Patch sensor mechanics (SENS-04, SENS-05)

**Current state:** [evidenced:cited] `bin/install.js` lines 1720–1930 already provide `PATCHES_DIR_NAME = 'gsdr-local-patches'`, `MANIFEST_NAME = 'gsd-file-manifest.json'`, `fileHash()` (SHA256), `generateManifest()`, `writeManifest()`, `saveLocalPatches()`, `pruneRedundantPatches()`, `reportLocalPatches()`. The manifest is written after install, backed up on next install; this plumbing is runtime-agnostic (same path on `.claude/` and `.codex/`). Research §2 confirms this is the correct foundation. `.codex/gsd-local-patches/backup-meta.json` in the parity research shows the mechanism has already captured 17 files from v1.17.5 on the live system — so the data exists, only a classifier and report are missing.

- [evidenced:cited] The patch sensor operates at two layers per research §2.2: (Layer 1) source-vs-installed divergence — hash installed files against `gsd-file-manifest.json`, and cross-compare with source files in `agents/`, `get-shit-done/`, `commands/`; (Layer 2) cross-runtime installed divergence — after accounting for format conversions (YAML↔TOML, `Read`↔`read_file`, `/gsdr:cmd`↔`$gsdr-cmd`, path prefixes), detect content-level mismatches between `.claude/` and `.codex/` of the same logical file.
- [decided:reasoned] Layer 2 cross-runtime content comparison needs a format-normalization step that reuses the installer's conversion functions (tool-name remap, path-prefix rewrite, frontmatter conversion, command-prefix conversion) rather than reimplementing them. Concretely: export the relevant helpers from `bin/install.js` (`replacePathsInContent`, tool-name map, command-prefix rewriter) so the patch sensor can apply them before comparing. This is how Layer 2 avoids false positives from expected format differences.
- [decided:reasoned] The patch sensor classification taxonomy from research §2.3 is adopted verbatim as the default vocabulary: `bug | stale | customization | format-drift | feature-gap`. Heuristics per class: `stale` = hash matches an older source version; `customization` = present in manifest but hash drifted, file exists in `gsdr-local-patches/`; `bug` = converter produced invalid output or path doubled (detected by structural checks); `format-drift` = cross-runtime mismatch after normalization where one side semantically diverged; `feature-gap` = source exists for one runtime with no corresponding installed artifact in the other.
- [decided:reasoned] The patch sensor is dispatched in two ways: (a) as a `gsd-tools` subcommand (`gsd patch-check` or similarly named) for developer-on-demand reports, matching research §2.4's recommendation; (b) as a drop-a-file sensor (`agents/gsd-patch-sensor.md`) that collect-signals auto-discovers and runs in the normal signal pipeline. The two surfaces share one classifier library — the subcommand emits a human-readable table, the sensor emits structured signal candidates. This dual-surface design matches how `gsdr-health` works.
- [assumed:reasoned] Running patch-sensor on every `collect-signals` is acceptable overhead. The manifest hash pass is O(N files) with cached reads; on the dogfooding repo that is <1s per runtime. If this turns out to drown signal noise (every collect-signals spam-reports stale mirrors in the dev repo), a config gate `signal_collection.sensors.patch.enabled` already works via the existing collect-signals config path. Challenge protocol: measure on the first run in a phase artifact; if > 3s or > 20 signals per run, gate the sensor to `on-demand` default and require `--enable-patch-sensor` in collect-signals invocations. Known prior noise: `sig-2026-02-24-local-patches-false-positive-dogfooding` — must be respected.

### Post-install cross-runtime parity verification (SENS-06)

**Current state:** [evidenced:cited] `bin/install.js` already has `saveLocalPatches()` and `cleanupOrphanedFiles()` running per-install. It does NOT presently check the other runtime scope. Research §4.3 Approach B proposes adding a `checkCrossRuntimeParity()` that runs after successful install and detects whether the other runtime has a GSD install whose VERSION diverges. Phase 58.1 explicitly left patch-sensor / wider drift work to Phase 60.

- [evidenced:cited] The existing `otherScopeVersionPath` probe in `bin/install.js` (lines 1962–1977) already reads the OTHER SCOPE of the SAME runtime (local vs global); extending to the OTHER RUNTIME is a parallel pattern, not a new mechanism.
- [decided:reasoned] Post-install parity runs unconditionally after every successful install and emits an advisory report. It does NOT fail the install, does NOT auto-trigger the cross-runtime install. Rationale: the install is already a user-initiated action; auto-triggering could install patches the user deliberately held back. Matches Phase 58.1 DC-6 ("degrade explicitly rather than guessing").
- [decided:reasoned] The report is advisory + copy-pasteable: prints the divergent runtime/version, the count of files that would change, and the exact `node bin/install.js --<runtime>` command to run. No interactive prompt by default (CI-safe); `--interactive` flag can be wired later if needed. Rationale: install.js already runs in CI contexts (test suite, release automation); prompting would deadlock.
- [decided:reasoned] Parity-verification output also writes a lightweight JSON artifact at `.claude/` (or `.codex/`, whichever was just installed) — e.g., `gsd-parity-report.json` — so programmatic consumers (CI, workflow checks) can detect the divergence without parsing stdout. Reuses the same provenance carriers as `gsd-file-manifest.json`.
- [assumed:reasoned] The "other runtime is installed" detection uses the same precedence rules Phase 58.1 established: `--config-dir` / `CODEX_CONFIG_DIR` / `CLAUDE_CONFIG_DIR` env vars first, project-local `.claude|.codex/` second, global `~/.claude|.codex/` third. Rationale: DRY — Phase 58.1 DC-3 already centralized that logic for update routing; Phase 60 reuses the helper.

### SENS-07 error-handling discipline

**Current state:** [evidenced:cited] The log sensor spec currently states "If no logs exist, return empty signals immediately." The cross-runtime work expands this to "parse failures, format mismatches, unexpected structures" — which need to be reported, not silenced. Research §1.3 shows multiple Codex event types (`session_meta, event_msg, response_item, turn_context, compacted`) that weren't all present in the research sample; the adapter will hit unknowns in production.

- [decided:reasoned] The SENS-07 contract is: any parse/format/structure failure emits a well-formed signal candidate with `signal_type: capability-gap`, `severity: minor`, tag `sensor-parse-failure`, and an evidence record of the offending file path, the unexpected shape, and the sensor stage. The sensor otherwise continues with the next file. Rationale: silent-drop is the failure mode called out in SENS-07's own motivation.
- [decided:reasoned] Crash-resistance is orthogonal to signal emission: the adapter wraps all format-specific parsing in try/except and never raises past the fingerprint extractor's boundary. A single malformed file cannot abort the whole phase's signal collection.
- [governing:reasoned] The sensor is responsible for emitting diagnostic signals; the synthesizer (not the sensor) decides whether they cross the trace-filter. This respects the single-writer invariant (sensors don't write to KB) already established in `collect-signals.md`.

### XRT-02 patch compatibility checking

**Current state:** [evidenced:cited] `commands/gsd/reapply-patches.md` and the `gsdr-reapply-patches` workflow already know how to present backed-up patches; they do not currently validate target-runtime compatibility before application. Research §2.5 defines the compatibility surface: runtime compatibility (hooks, tool permissions), format compatibility (MD/TOML, YAML/simplified frontmatter), version compatibility (target version match), cross-runtime propagation.

- [decided:reasoned] XRT-02 is implemented as a validator in the `reapply-patches` path: before applying a backed-up patch file to the target runtime, the validator checks that the file references only tools/commands the target runtime supports after conversion, and that the target-runtime format matches the patch's source format. If incompatible, the validator reports `patch-incompatible` with the specific gap (missing tool, unsupported hook, unconverted path) and offers the user to (a) convert-and-apply, (b) skip, (c) abort.
- [decided:reasoned] The validator shares the classification vocabulary with the patch sensor — an incompatible patch is semantically a `format-drift` or `feature-gap` when viewed from the compatibility angle. This avoids two parallel taxonomies.
- [assumed:reasoned] The validator is invoked at the reapply site, not during the save-patches step (which runs pre-install and must not block install). Rationale: compatibility is a re-application concern — saving the patch preserves the evidence; re-applying it on a different runtime is where the compat question actually becomes load-bearing.

### Cross-runtime sensor substrate and hook posture

**Current state:** [evidenced:cited] Codex hooks are "under development" per `codex features list` (Codex 0.118.0, research §1.2). The research recommends deferring Codex hook installation pending feature-flag stabilization, and Phase 58.1 DC-4 made that a hard rule: "No new Codex hook substrate introduction without feature flag stabilization."

- [governing:reasoned] Phase 60 must not install or assume any Codex hook substrate. Sensors run in the existing `collect-signals` orchestrator path, which is workflow-triggered (not hook-triggered). Post-install parity runs inside `bin/install.js` itself, not via any hook.
- [decided:reasoned] Every Codex-touching implementation step MUST carry a per-runtime substrate declaration and a Codex degradation/waiver path per `XRT-01` (Phase 58 Success Criterion 8). Applied to Phase 60's surface: (a) log sensor — applies-via-sensor-adapter; (b) patch sensor — applies-via-same-manifest; (c) post-install parity — applies-via-installer; (d) patch-compat — applies-via-reapply-workflow. No Phase 60 surface can honestly claim "applies-via-hook" on Codex.

### Claude's Discretion

- Exact file organization for the adapter layer (single-file adapter inside `agents/gsd-log-sensor.md` body vs a helper script under `get-shit-done/bin/` invoked from the agent) — whichever is cleaner given how the existing agent spec already inlines python3 extraction
- Naming of the gsd-tools subcommand (`gsd patch-check` vs `gsd patches` vs `gsd divergence-check`) and of the JSON artifact emitted by post-install parity
- Golden-fixture shape for patch-sensor classification tests (single repo snapshot vs per-class fixtures)
- Whether to emit a single aggregate `gsd-parity-report.json` or per-runtime `gsd-parity-report.<runtime>.json`
- How many historical Codex versions to retain in the validator's compatibility tables (1 vs rolling window)
- Whether the SENS-07 diagnostic signal is written once per file or once per malformed-event-type per phase

</working_model>

<constraints>
## Derived Constraints

- **DC-1:** [evidenced:cited] The log sensor must stay a single drop-a-file sensor. `collect-signals.md` step `discover_sensors` globs `gsd-*-sensor.md` — splitting into per-runtime files would double-count and violate the EXT-06 convention captured in `sig-2026-03-04-drop-a-file-sensor-extensibility-pattern`. Derived from: sensor extensibility signal + workflow discovery contract.
- **DC-2:** [evidenced:cited] Sensors MUST NOT write to the KB. Signal candidates are returned as structured JSON to the orchestrator; the synthesizer is the single writer. Cross-runtime normalization and SENS-07 diagnostics follow the same rule. Derived from: `collect-signals.md` single-writer invariant + `gsd-log-sensor.md` guidelines.
- **DC-3:** [evidenced:cited] The source repo (`agents/`, `get-shit-done/`, `commands/`, `bin/install.js`, `tests/`) is the source of truth. `.claude/` and `.codex/` under the source repo are generated outputs and must not be hand-edited as the primary fix. Derived from: Phase 58.1 DC-2 (carried forward).
- **DC-4:** [evidenced:cited] No new Codex hook substrate introduction in Phase 60. Codex hooks remain "under development" per live `codex features list`; Phase 58.1 locked this rule. Derived from: Phase 58.1 DC-4 (carried forward) + parity research §1.2.
- **DC-5:** [evidenced:cited] Every new capability must declare a per-runtime substrate + Codex degradation path, either `applies-via-<substrate>` or `does-not-apply-with-reason`. Derived from: Phase 58 XRT-01 / Success Criterion 8.
- **DC-6:** [evidenced:cited] Reuse existing installer primitives — `fileHash()`, `generateManifest()`, `writeManifest()`, `saveLocalPatches()`, `pruneRedundantPatches()`, `reportLocalPatches()`, `otherScopeVersionPath` probe — rather than reimplementing SHA256 manifest mechanics. Derived from: inventory of `bin/install.js` lines 1720–1977.
- **DC-7:** [evidenced:cited] The existing patch-detection false-positive pattern (dogfooding local dev installs look like patches) is a known failure mode. The new patch sensor must either filter dogfooding-scope cases or surface them at `trace` severity so synthesis can drop them. Derived from: `sig-2026-02-24-local-patches-false-positive-dogfooding`.
- **DC-8:** [evidenced:reasoned] Log sensor operability is itself a recurring blind spot. Previous phases have had the log sensor stubbed, discovered-but-skipped, or labeled-disabled. Phase 60 must deliver operability, not just cross-runtime shape: at least one phase's collect-signals run after Phase 60 lands must produce real log-sensor signals on both runtimes. Derived from: `sig-2026-04-09-log-sensor-stub-no-session-analysis-performed`, `sig-2026-04-09-orchestrator-skipped-log-sensor-despite-discovery`, `sig-2026-04-09-log-sensor-disabled-label-recurrence-57-3`, `sig-2026-03-04-stale-log-sensor-spec-disabled-by-default-text`.
- **DC-9:** [evidenced:cited] Cross-runtime KB drift is already a `critical` signal (`sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift`). Post-install parity verification must surface the drift surface the signal documents, not merely echo it. Derived from: the cited signal + research §4.
- **DC-10:** [decided:reasoned] Regression coverage follows `deliberation: cross-runtime-parity-testing.md` Option B (Name Parity) recommendation: name parity for discovered sensor files, content parity for Codex-specific adapter code, and targeted structural prevention (globbed sensor discovery already in place, no hardcoded list). Derived from: adopted deliberation.

</constraints>

<guardrails>
## Epistemic Guardrails

- **G-1:** [governing:reasoned] Do not treat `cross-runtime-parity-research.md` as permanently current. Its frontmatter sets `next_audit_due: 2026-04-23`. Before Phase 60 ships, re-run the Validation Commands section and bump `last_audited`; if any row contradicts, update the relevant claim in CONTEXT.md before planning locks it.
- **G-2:** [governing:reasoned] A fingerprint field that is "available on Codex but not Claude" is not a reason to drop it from the normalized schema. Downstream consumers receive `not_available` for absent fields, not a smaller schema. MEAS-RUNTIME-05 parity principle from Phase 57.7 applies here.
- **G-3:** [governing:reasoned] The patch sensor must not silently downgrade "format-drift" into "customization" when it cannot decide. If classification confidence is low, the sensor emits the candidate with the best-guess class AND a `low_confidence` marker; the synthesizer arbitrates, not the sensor.
- **G-4:** [governing:reasoned] Post-install parity output must not invent a "successful parity check" when the check cannot run (e.g., `.claude/` exists but `gsd-file-manifest.json` absent because this is a fresh install of the other runtime only). The tool honestly reports "no prior manifest, skipping parity" and exits advisory.
- **G-5:** [governing:reasoned] The adapter's "runtime detection" at sensor-level detects the log file runtime, not the harness runtime. A Claude Code harness can and should analyze Codex session logs it has access to; a Codex harness can likewise analyze Claude sessions. Detector-provenance rules from `gsd-artifact-sensor.md` §3.0 govern.
- **G-6:** [governing:reasoned] Do not introduce a second path-resolution system for Codex. Phase 58.1 DC-3 centralized Codex path resolution in `bin/install.js`; Phase 60 reuses it. If a helper needs to move out of `install.js` into a shared module, that's a refactor, not a new system.
- **G-7:** [governing:reasoned] Reality of hook availability on Codex is the single source of truth, not training-data recollections or prior parity snapshots. Any code that branches on "Codex has hooks" MUST consult live `codex features list` output and be gated by an evidence check; the v1.20 features under "hook-dependent" in the capability matrix remain degraded-by-workflow-step on Codex until stabilization.
- **G-8:** [governing:reasoned] SENS-07 parse-failure signals must carry enough evidence to act on. An evidence record that says "unknown event type" without naming the type and file is not actionable; the synthesizer should trace-filter such signals.

</guardrails>

<questions>
## Open Questions

### Q1: Codex subagent / parallel-thread session topology

**Research program:** The log-sensor triage advice says "Subagent JSONL files — these are mechanical, not conversational" for Claude Code. Does Codex produce a parallel structure? Enumerate live `~/.codex/sessions/YYYY/MM/DD/*.jsonl` files, inspect `session_meta.payload.source` values, cross-check `state_5.sqlite` `threads.agent_path` + `source` columns, and determine: (a) whether Codex subagents get separate rollout files, (b) how to identify and deprioritize them in triage, (c) whether the `source: "exec"` vs `source: "cli"` distinction is already sufficient.
**Downstream decisions affected:** Triage heuristics, interest-score calibration, whether the "subagent session filter" is runtime-specific.
**Reversibility:** MEDIUM — miscalibrated triage produces noise or misses signals; recalibratable from real fingerprints once collected.

### Q2: Patch sensor noise control in dogfooding

**Research program:** This repo IS the source for GSDR. Running the patch sensor here will detect the source-vs-installed drift as "customizations" on every dev install. Determine from `sig-2026-02-24-local-patches-false-positive-dogfooding` and `bin/install.js`'s dev-install path: what marker distinguishes "I'm running in the source repo" (e.g., presence of `.git` alongside `package.json` with `name: "get-shit-done-reflect-cc"`) from "I'm a user with customizations." Decide whether dogfooding-scope detection lives in the sensor, the synthesizer trace-filter, or an explicit config flag.
**Downstream decisions affected:** Patch-sensor default severity, config gate design, developer UX of the `gsd patch-check` subcommand, test fixture design.
**Reversibility:** LOW — a sensor that screams false positives gets ignored or disabled, reintroducing the exact "log sensor disabled by default" pattern DC-8 warns about.

### Q3: Post-install parity interaction model

**Research program:** The working model commits to advisory-only, no interactive prompt. But `bin/install.js --local` is most commonly run by a human in a terminal; a `--y-to-install-other-runtime` prompt would close the drift faster than an advisory line they miss. Evaluate: is the install.js process TTY-aware today? Does the `node bin/install.js` invocation have a prior precedent for interactive prompts? What does the Codex behavior do when it runs inside a wrapper like `codex exec`? If interactive can be done without breaking CI or wrapped contexts, adopting it closes the drift gap more aggressively.
**Downstream decisions affected:** User UX of the install command, CI behavior, whether `gsd-parity-report.json` becomes the only programmatic surface.
**Reversibility:** HIGH — advisory-now-interactive-later is a pure addition; the cost of "too passive initially" is recoverable.

### Q4: XRT-02 patch compatibility evidence source

**Research program:** The parity research names the four compatibility axes (runtime, format, version, cross-runtime propagation) but does not fully enumerate the signals a validator can use. Derive from `bin/install.js` which exact tools-map / frontmatter-shape / command-prefix facts the validator needs, and decide: is the source of truth a static JSON file (regenerated at install time) or the live `install.js` module (imported and called at validation time)? A static snapshot is easier to reason about; a live call stays current with installer changes.
**Downstream decisions affected:** Where the validator lives, whether `reapply-patches` gains a Node module import, test shape.
**Reversibility:** MEDIUM — refactor from static snapshot to live call (or vice versa) is possible but touches all validator call sites.

### Q5: Timing and gating of the SENS-07 parse-failure budget

**Research program:** SENS-07 says "reports parse failures … rather than crashing or silently dropping data." A malformed corpus could produce N warnings per run. Determine, from a dry run against the live Codex session corpus on this machine: how many parse failures arise under the normal-case adapter? If > a dozen per phase, the signal stream will saturate; we need a per-event-type rate cap or a synthesizer aggregation rule. If < 3, no cap is needed.
**Downstream decisions affected:** Signal volume, synthesizer trace-filter rules, whether SENS-07 signals roll up into one "sensor-health" signal per phase vs emit individually.
**Reversibility:** LOW — a noisy sensor gets disabled; cleaner to calibrate this before ship.

### Q6: Feature-gap vs format-drift classification boundary

**Research program:** Both `feature-gap` and `format-drift` describe cross-runtime mismatches. A hook file with no Codex equivalent could be classified either way. Define the boundary operationally, not by intuition: is it about intentionality (feature-gap = deliberate degradation recorded in capability-matrix.md; format-drift = accidental) or about representability (feature-gap = no Codex surface at all; format-drift = surface exists but content diverged)? Reconcile with the `capability-matrix.md` existing gradations (Y/N/under development/does-not-apply-with-reason).
**Downstream decisions affected:** Classification heuristics, patch-sensor report text, synthesizer deduplication rules.
**Reversibility:** MEDIUM — boundary can shift but signals written under one vocabulary would need re-triage.

</questions>

<dependencies>
## Claim Dependencies

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| `[decided]` Adapter lives in single `gsd-log-sensor.md` | `[evidenced:cited]` EXT-06 glob discovery in `collect-signals.md` | LOW — discovery is mechanically verified in VERIFICATION.md (10/10 truths) |
| `[decided]` SQLite CLI primary, filesystem fallback | `[assumed:reasoned]` schema may drift but column probe + fallback handle it | MEDIUM — if schema drift removes `cwd`, fallback path handles it but performance degrades |
| `[decided]` Patch sensor is dual-surface (subcommand + drop-a-file sensor) | `[evidenced:cited]` dual-surface pattern already works for `gsdr-health` | LOW — precedent pattern |
| `[decided]` Classification taxonomy adopted verbatim from research §2.3 | `[evidenced:cited]` live patch backup in `.codex/gsd-local-patches/backup-meta.json` | LOW — data exists; classifier just has to interpret it |
| `[decided]` Post-install parity is advisory, not auto-apply | `[decided]` Phase 58.1 DC-6 "degrade explicitly" + `[governing]` G-4 honesty rule | LOW — design rule, traceable |
| `[assumed:reasoned]` Running patch-sensor on every collect-signals is acceptable | `[evidenced:cited]` dogfooding false-positive precedent (`sig-2026-02-24-local-patches-false-positive-dogfooding`) <!-- corrected by context-checker: was [evidenced] (bare) — phantom citation; upgraded to [evidenced:cited] matching DC-7 --> | MEDIUM — if Q2 shows noise, need config gate; reversible |
| `[decided]` XRT-02 validator lives at reapply site, not save site | `[assumed:reasoned]` compat is a reapply concern | MEDIUM — if a save-time compat check turns out to be high-leverage, refactor |
| `[assumed:reasoned]` Codex 0.118.0 state_5.sqlite schema stable enough | `[evidenced:cited]` research audit 2026-04-09, next-audit-due 2026-04-23 | MEDIUM — G-1 re-audit gate planned before ship |

</dependencies>

<canonical_refs>
## Canonical References

**Downstream agents (researcher, planner, executor, verifier) MUST read these before planning or implementing.**

### Authoritative design / research
- `.planning/research/cross-runtime-parity-research.md` — living document, authoritative for capability matrix, session log format comparison, patch sensor design, adapter pattern, post-install parity approaches. Audit gate: re-run Validation Commands and bump `last_audited` before ship (G-1).
- `.planning/deliberations/cross-runtime-parity-testing.md` — adopted deliberation for cross-runtime test strategy (Option B name parity + targeted content parity); governs regression coverage shape for Phase 60.
- `~/.claude/get-shit-done-reflect/references/claim-types.md` — claim-type vocabulary used throughout this CONTEXT.md.

### Prior phase context (decisions carried forward)
- `.planning/phases/55.2-codex-runtime-substrate/55.2-CONTEXT.md` — Codex substrate patterns, dual-format sensor discovery (MD + TOML), brownfield detection fix, capability-matrix drift corrections.
- `.planning/phases/58.1-codex-update-distribution-parity/58.1-CONTEXT.md` — DC-2 (source is truth, mirrors are outputs), DC-3 (Codex path resolution centralization), DC-4 (no new Codex hook substrate), DC-6 (degrade explicitly). All carried forward into Phase 60.
- `.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md` — per-gate Codex behavior matrix; same pattern applies to per-sensor Codex behavior matrix.

### Source surfaces Phase 60 touches
- `agents/gsd-log-sensor.md` — log sensor spec with Stages 1–5 (progressive deepening) and `<blind_spots>` explicitly naming Codex adapter gap.
- `agents/gsd-artifact-sensor.md` — detector provenance reference implementation (§3.0), signal-return contract, delimiter protocol.
- `agents/gsd-git-sensor.md` and `agents/gsd-ci-sensor.md` — sensor contract precedents (frontmatter shape, timeout declaration, structured JSON return).
- `get-shit-done/workflows/collect-signals.md` — sensor discovery contract (`SENSOR_FILES=$(ls -1 ~/.claude/agents/gsd-*-sensor.md)`), dispatch loop, per-sensor timeout enforcement, structured delimiter protocol, track-event accounting.
- `get-shit-done/references/signal-detection.md` — signal detection rules and severity classification that the new patch sensor's output must conform to.
- `get-shit-done/references/capability-matrix.md` — per-runtime capability matrix; patch-sensor "feature-gap" classifier must defer to this for intentional-vs-accidental divergence.
- `bin/install.js` §1700–1977 — `PATCHES_DIR_NAME`, `MANIFEST_NAME`, `isLegacyReflectInstall`, `fileHash`, `generateManifest`, `writeManifest`, `saveLocalPatches`, `pruneRedundantPatches`, `reportLocalPatches`, `otherScopeVersionPath` probe. These are the reuse surface for SENS-04/05/06/XRT-02.
- `get-shit-done/bin/gsd-tools.cjs` — subcommand registrar; new `gsd patch-check` (or chosen name) wires in here.
- `tests/unit/install.test.js` and `tests/integration/multi-runtime.test.js` — existing cross-runtime regression surface; Phase 60 adds to these rather than creating parallel test infrastructure.

### Requirements + roadmap authority
- `.planning/REQUIREMENTS.md` §Sensor Pipeline (SENS-01..SENS-07), §Cross-Runtime (XRT-02) — canonical requirement text and motivations.
- `.planning/ROADMAP.md` Phase 60 — goal, dependencies (Phase 58), success criteria (5), parallelism note (with Phase 61).
- `.planning/PROJECT.md` — v1.20 target features including cross-runtime distribution gap framing.

### KB signals that shape Phase 60's framing
- `.planning/knowledge/signals/get-shit-done-reflect/2026-04-09-log-sensor-stub-no-session-analysis-performed.md`
- `.planning/knowledge/signals/get-shit-done-reflect/2026-04-09-orchestrator-skipped-log-sensor-despite-discovery.md`
- `.planning/knowledge/signals/get-shit-done-reflect/2026-04-09-log-sensor-disabled-label-recurrence-57-3.md`
- `.planning/knowledge/signals/get-shit-done-reflect/2026-04-09-log-sensor-spec-disabled-label-causes-repeated-exclusion.md`
- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-04-stale-log-sensor-spec-disabled-by-default-text.md`
- `.planning/knowledge/signals/get-shit-done-reflect/sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift.md` (severity: critical)
- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-04-drop-a-file-sensor-extensibility-pattern.md` (EXT-06 pattern)
- `.planning/knowledge/signals/get-shit-done-reflect/2026-02-24-local-patches-false-positive-dogfooding.md` (Q2 input)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `bin/install.js` SHA256 manifest plumbing — `fileHash()`, `generateManifest()`, `writeManifest()`, `saveLocalPatches()`, `pruneRedundantPatches()`, `reportLocalPatches()`. The patch sensor uses these rather than reimplementing them. `PATCHES_DIR_NAME = 'gsdr-local-patches'`, `MANIFEST_NAME = 'gsd-file-manifest.json'` are constants the patch sensor imports.
- `bin/install.js` `otherScopeVersionPath` probe (lines 1962–1977) — local-vs-global cross-scope detection. The post-install parity check extends this pattern to other-runtime detection.
- `bin/install.js` `getGlobalDir(runtime, explicitConfigDir)` — already centralized Codex vs Claude path resolution. Post-install parity calls this for the other-runtime side.
- `bin/install.js` format conversion helpers — tool-name remap, `replacePathsInContent`, command-prefix rewrite, frontmatter conversion. Patch-sensor Layer-2 normalization imports these.
- `agents/gsd-log-sensor.md` — full Stage 1–5 progressive deepening spec already written; the adapter is additive, not a rewrite.
- `agents/gsd-artifact-sensor.md` §3.0 — detector provenance detection pattern. The cross-runtime log sensor adopts the same pattern (detect harness runtime for `detected_by`, do not infer `about_work[]`).
- `get-shit-done/workflows/collect-signals.md` — sensor discovery via glob (`gsd-*-sensor.md`), structured delimiter protocol, per-sensor timeout, track-event stats. Drop-a-file pattern means `agents/gsd-patch-sensor.md` auto-registers.
- `get-shit-done/bin/gsd-tools.cjs` router — where `gsd patch-check` subcommand wires in.
- `tests/integration/multi-runtime.test.js` — already validates Codex layout, VERSION precedence, cross-runtime installation parity. Phase 60 extends this test file with post-install parity detection cases.

### Established Patterns
- **Drop-a-file sensor extensibility** (EXT-06, signal `sig-2026-03-04-drop-a-file-sensor-extensibility-pattern`): new sensor = one file matching `gsd-*-sensor.md`. Applied: add `agents/gsd-patch-sensor.md`, nothing else registers.
- **Structured delimiter protocol** for sensor JSON output: `## SENSOR OUTPUT` / `## END SENSOR OUTPUT` wrapping a ```json fenced block. New patch sensor conforms verbatim.
- **Per-runtime substrate declaration** (XRT-01, Phase 58 Success Criterion 8): every capability-touching surface declares `applies-via-<substrate>` or `does-not-apply-with-reason`. Phase 60 substrates: adapter, manifest, installer, reapply-workflow.
- **Single-writer invariant** (`collect-signals.md`): sensors return JSON candidates; the synthesizer is the only writer to KB. SENS-07 diagnostic signals follow this rule.
- **Format conversion at normalization boundary** (`bin/install.js` tool-name map, `replacePathsInContent`): applied before content comparison to avoid cross-runtime false positives. Patch-sensor Layer 2 reuses this.
- **Living reference docs** (Phase 55.2): `last_audited` + `next_audit_due` + Validation Commands table. Cross-runtime-parity-research.md already follows this; G-1 gate mandates re-audit before ship.

### Integration Points
- `bin/install.js` `install()` function — post-install parity hook (SENS-06) lands after `saveLocalPatches`/`pruneRedundantPatches`/`reportLocalPatches`, before the success log line.
- `commands/gsd/reapply-patches.md` + `get-shit-done/workflows/reapply-patches.md` — XRT-02 validator hook lands at the pre-apply gate.
- `collect-signals.md` `discover_sensors` step — auto-registers the new patch sensor without spec change.
- `get-shit-done/bin/gsd-tools.cjs` router — where the new subcommand (`gsd patch-check` or chosen name) registers.
- `get-shit-done/references/capability-matrix.md` — patch sensor's `feature-gap` classifier consults this doc to distinguish intentional degradation from accidental drift.

</code_context>

<specifics>
## Specific Ideas

- The `state_5.sqlite` schema (research §7.3) is documented inline; the `threads` table has `id, rollout_path, cwd, created_at, updated_at, source, tokens_used, model, reasoning_effort, git_sha, git_branch, git_origin_url, cli_version, agent_path, agent_nickname, title`. The adapter probes columns before relying on them.
- The patch-backup evidence on the live machine (`~/.codex/gsd-local-patches/backup-meta.json` with 17 files from v1.17.5) is a golden test case for the classifier — [assumed:reasoned] all 17 should classify as `stale` since they were backed up before v1.18 modularization; the backed-up `gsd-tools.js` no longer exists in source so it should classify as `stale` or `feature-gap`. <!-- typed by context-checker -->
- The cross-runtime-parity-research.md "Validation Commands" table is reused as the smoke-test list for Phase 60 verification: re-run those commands, assert outputs match, bump `last_audited`.
- The `.codex/gsd-local-patches/` vs `.claude/gsdr-local-patches/` directory-name divergence noted in research §1.1 is a candidate `bug` classification target — the patch sensor should detect it.
- Phase 58 already added a codex-behavior-matrix.md to its phase dir (`.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md`); Phase 60 should produce its own companion matrix documenting per-sensor Codex behavior using the same shape.
- `sig-2026-04-21-plan-59-05-established-cross-runtime-parity-tests` — Phase 59 just established parity tests; Phase 60 adds to that infrastructure, doesn't create parallel.

</specifics>

<deferred>
## Deferred Ideas

- **Cross-project distribution gap** (non-GSDR projects running global upstream GSD) — deferred to v1.21 per MILESTONE-CONTEXT.md and parity research §4.5. Phase 60 closes the single-project multi-runtime gap.
- **Cross-model sensor diversity** (Claude sensors + GPT sensors via `codex exec`) — "Beyond Formal Scope" in parity research. Interesting pattern, not required for SENS-01..07 or XRT-02. Revisit in v1.21 alongside `codex exec` as sensor-runner experimentation.
- **Codex `history.jsonl` as cross-session pattern source** — parity research "Beyond Formal Scope" notes it's a lightweight first pass for cross-session patterns (log-sensor blind spot). Revisit when cross-session reflection gets its own phase.
- **Codex `logs_1.sqlite` structured runtime traces** — [decided:reasoned] too low-level for sensor pipeline per research §7.2; belongs in a debugging / diagnostics phase. <!-- typed by context-checker -->
- **Codex memories vs Claude Code MEMORY.md divergence** — v1.21+ concern per parity research "Beyond Formal Scope".
- **WebFetch null-mapping in Codex agent specs** — parity research "Beyond Formal Scope". Patch sensor could surface this as a signal but the fix (per-agent spec review) is a separate cleanup.
- **SKILL.md vs command .md invocation-syntax friction** — UX research, not sensor work.
- **PID management for concurrent Codex sessions** — v1.20 concern per parity research, but belongs in parallel-execution (Phase 64), not sensor pipeline.
- **Telemetry identity extractor rewiring (PROV-09..14)** — Phase 60.1 scope per ROADMAP.md.
- **Agent-performance reflection stratification by `model × profile × reasoning_effort`** — Phase 60.1 scope per ROADMAP.md.
- **Live-agent E2E chain tests** — Phase 60.1 scope per ROADMAP.md.
- **Interactive `--y-install-other-runtime` prompt** — Open Question Q3 may promote this in-phase, but default is advisory-only for CI safety.

</deferred>

---

*Phase: 60-sensor-pipeline-codex-parity*
*Context gathered: 2026-04-21*
