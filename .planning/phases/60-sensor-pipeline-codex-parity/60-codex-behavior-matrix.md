# Phase 60: Per-Sensor Codex Behavior Matrix

**Phase:** 60-sensor-pipeline-codex-parity
**Authored:** 2026-04-21
**Authority:** XRT-01 (Phase 58 Success Criterion 8) — every phase that introduces capabilities must declare per-runtime substrate behavior.
**Vocabulary:** `applies` | `applies-via-workflow-step` | `applies-via-installer` | `does-not-apply-with-reason: <reason>` (per Phase 58 Plan 05).

## Matrix

| Requirement / Surface | Substrate | Claude Code behavior | Codex CLI behavior | Rationale |
|---|---|---|---|---|
| **SENS-01** — Log-sensor runtime-neutral fingerprint schema | sensor adapter in `agents/gsd-log-sensor.md` | `applies` | `applies` | One sensor, two format branches; fingerprint JSON is runtime-agnostic after Stage 1c. |
| **SENS-02** — Cross-runtime adapter normalizes Claude JSONL and Codex JSONL to common fingerprint schema | sensor adapter in `agents/gsd-log-sensor.md` (Claude filesystem scan / Codex sqlite+JSONL parse) | `applies` | `applies` | Both branches land in the same Stage 1c dispatcher; downstream stages are runtime-agnostic. |
| **SENS-03** — Codex session discovery uses `state_*.sqlite` (primary) with filesystem fallback | `sqlite3` CLI + filesystem-scan fallback | `does-not-apply-with-reason: claude-has-no-session-db` | `applies` | Claude Code has no session state database; Claude sessions are discovered via filesystem scan of `~/.claude/projects/...` (existing Stage 1a). This capability is Codex-specific. `[projected]` if Claude adopts a session DB in the future. |
| **SENS-04** — Patch sensor detects source-vs-installed divergence using SHA256 manifest | `agents/gsd-patch-sensor.md` + `get-shit-done/bin/lib/patch-classifier.cjs` | `applies` | `applies` | Manifest mechanism (`fileHash`, `generateManifest`, `reportLocalPatches`) is runtime-agnostic; `bin/install.js` installs the manifest on both runtimes. |
| **SENS-05** — Developer-facing divergence report + classification | `gsd patches` subcommand in `get-shit-done/bin/gsd-tools.cjs` | `applies` | `applies` | CLI subcommand is runtime-neutral — both Claude and Codex harnesses shell out to `node gsd-tools.cjs`. |
| **SENS-06** — Post-install cross-runtime parity verification | `checkCrossRuntimeParity()` in `bin/install.js` | `applies-via-installer` | `applies-via-installer` | Installer runs on both; writes `gsd-parity-report.json` artifact + advisory stdout on both. No hook dependency. |
| **SENS-07** — Warnings-as-signals diagnostics on parse/format failures | sensor-level diagnostic emission contract | `applies` | `applies` | Sensor-level; both runtimes emit the same `{signal_type: capability-gap, severity: minor, tag: sensor-parse-failure}` structured JSON. Synthesizer arbitrates trace-filter. |
| **XRT-02** — Patch-compatibility validator before cross-runtime application | `reapply-patches` command + shared `patch-classifier.cjs` | `applies-via-workflow-step` | `applies-via-workflow-step` | Command markdown drives the validator inline; both runtimes read the command identically. `does-not-apply` via hook — DC-4 holds. |
| **XRT-01** — Per-sensor Codex-behavior matrix (this sidecar) | filesystem artifact `60-codex-behavior-matrix.md` | `applies` | `applies` | Filesystem artifact; runtime-neutral by construction. Its existence closes Phase 58 Success Criterion 8 for Phase 60. |

## Notes for Downstream Plans

1. **DC-4 invariant:** No row uses a hook-based behavior value on Codex. Phase 60 introduces zero new Codex hook substrate. Post-install parity fires inside `bin/install.js`, not via hook. Sensors run in `collect-signals` (workflow-triggered), not hook-triggered.
2. **Representability boundary for SENS-03 `does-not-apply`:** The `does-not-apply-with-reason` on SENS-03's Claude column is representability-based — Claude Code genuinely has no session state DB to query. This is not degradation; it is a capability that does not apply. Per `60-RESEARCH.md` Q6 closure, `feature-gap` means the other runtime has no surface; `format-drift` means both runtimes have a surface but content diverges.
3. **SENS-02 remains cross-runtime:** Claude's row stays `applies` because Claude does have session logs on the filesystem; the normalization obligation still applies even though Claude does not use the Codex sqlite discovery path.
4. **XRT-01 closeout check:** The matrix artifact itself is runtime-neutral. Phase 58 Plan 05's verifier pattern applies here — a unit test asserts existence, row count, and canonical vocabulary usage.
5. **Living document:** If a future phase adds a new sensor or extends an existing one, update this matrix as part of that phase's deliverable. The matrix is a standing substrate ledger, not a one-time closure artifact.

## References

- `.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md` — precedent matrix (Phase 58 Plan 05), same vocabulary and row shape.
- `get-shit-done/references/capability-matrix.md` — project-level per-runtime capability matrix; the patch-sensor `feature-gap` classifier consults this for representability.
- `.planning/phases/60-sensor-pipeline-codex-parity/60-RESEARCH.md` §"Per-Sensor Codex Behavior Matrix (sidecar content)" — authored content source.
- `.planning/phases/60-sensor-pipeline-codex-parity/60-CONTEXT.md` — governing invariants carried into Phase 60, especially DC-4 and the representability boundary.
