## Gaps the Claude Audit Missed

1. Codex workflows still ask for `general-purpose` agents even though the installer only registers named `gsdr-*` roles. Evidence: `get-shit-done/workflows/plan-phase.md:126-131`, `get-shit-done/workflows/plan-phase.md:345-350`, `get-shit-done/workflows/new-project.md:432-473`, `get-shit-done/workflows/discuss-phase.md:634-649`, `get-shit-done/workflows/diagnose-issues.md:75-87`. Contrast with Codex install output at `bin/install.js:2754-2803`, which creates `agents/*.toml` and registers explicit `gsdr-*` names in `config.toml`. Impact: even with Codex subagents available, these workflows either bypass the intended role files or request agent types that Codex has not been taught about.

2. Relative Claude paths survive Codex conversion because the path rewriter only handles `~/.claude/` and `$HOME/.claude/`, not `.claude/...` or project-local Claude conventions. Evidence: `bin/install.js:1342-1368`. Broken refs exist in `get-shit-done/workflows/reflect.md:15-17`, `agents/gsd-reflector.md:18-26`, `agents/gsd-spike-runner.md:18-21`, `get-shit-done/workflows/quick.md:392`, and `get-shit-done/workflows/quick.md:548`. I confirmed this with a temp Codex install: generated `gsdr-reflector.toml` still contained `@.claude/agents/knowledge-store.md`.

3. Codex uninstall does not remove generated agent role files. Evidence: install creates them at `bin/install.js:2754-2784`, but uninstall skips `agents/` cleanup for Codex at `bin/install.js:1942-1960`. I verified this empirically by installing to a temp `HOME`, running `--codex --uninstall`, and observing that `~/.codex/agents/gsdr-*.toml` and `knowledge-store.toml` remained on disk.

4. `/gsdr-set-profile` rejects `inherit`, even though the runtime, docs, and verifier all treat `inherit` as valid and important for non-Claude runtimes. Evidence: `get-shit-done/workflows/set-profile.md:15-18` only allows `quality|balanced|budget`; `get-shit-done/references/model-profiles.md:57-66` documents `inherit`; `get-shit-done/bin/lib/verify.cjs:633-636` validates `inherit`; `get-shit-done/bin/lib/core.cjs:1341-1345` resolves it. Impact: the documented escape hatch for runtime-native model selection is blocked at the command layer.

5. Codex agent conversion drops frontmatter but does not rewrite agent-body tool vocabulary or Claude-style `@file` includes. Evidence: a Codex tool-name map exists at `bin/install.js:611-626`, but `convertClaudeToCodexAgentToml()` at `bin/install.js:975-1007` only emits `description`, `sandbox_mode`, and raw `developer_instructions`. Source agents still contain Claude-specific instructions such as `agents/gsd-phase-researcher.md:399-401` (`use Write tool`) and `agents/gsd-planner.md:582-585` (`use Bash`, `use Write`). Temp install confirmed generated Codex TOMLs still contain `Write tool`, `WebSearch`, `WebFetch`, `Grep`, `Glob`, and raw `@...` references.

6. The real Codex parallelism gap is larger than “no delegation syntax documented.” Several workflows rely on Claude-style background task semantics, later collection, and timeout-aware joins, with no Codex-native abstraction for spawn/wait/resume. Evidence: `get-shit-done/workflows/collect-signals.md:256-348` and `get-shit-done/workflows/map-codebase.md:84-99`. Even if `spawn_agent` syntax were written down tomorrow, these flows would still lack the equivalent of `run_in_background=true` plus later timeout-based collection.

7. Codex-facing workflow guidance still assumes Claude-specific project instruction surfaces. `quick.md` tells agents to read `./CLAUDE.md` and `.claude/skills/`, not Codex’s `AGENTS.md` or `.codex/skills/`. Evidence: `get-shit-done/workflows/quick.md:330`, `get-shit-done/workflows/quick.md:385`, `get-shit-done/workflows/quick.md:392`, `get-shit-done/workflows/quick.md:547-548`. Impact: Codex quick tasks can miss project-specific harness guidance even when the project provides it correctly.

8. The capability matrix is materially wrong about Codex artifact shape. It says Codex agents are delivered “via AGENTS.md” and the config file is `codex.toml`, but the installer actually generates `agents/*.toml` and writes `config.toml`. Evidence: `get-shit-done/references/capability-matrix.md:24-29` versus `bin/install.js:1232-1260` and `bin/install.js:2754-2803`. This is not just doc drift; it poisons future audits and parity work that treat the matrix as authoritative.

## Wrong Assumptions in the Claude Audit

1. “No reasoning effort mechanism” is too strong. The repo already has an explicit Codex reasoning-effort design in `get-shit-done/references/model-profiles.md:22-35` and `get-shit-done/references/model-profile-resolution.md:21-49`. The actual defect is inconsistent adoption: some workflows hardcode effort, some omit it entirely, and `/gsdr-set-profile` blocks `inherit`.

2. “The harness sends Claude model IDs to Codex by default” is too broad. Non-Claude install explicitly sets `resolve_model_ids: "omit"` at `bin/install.js:3033-3045`, and the resolver returns an empty model string in that mode at `get-shit-done/bin/lib/core.cjs:1333-1337`, meaning “use the runtime default model.” The real hazards are explicit `model_overrides` and workflows that hardcode Codex model names, especially `get-shit-done/workflows/collect-signals.md:161-205`.

3. Treating `AGENTS.md` as the main Codex execution surface is wrong. `AGENTS.md` is supplemental guidance generated by `bin/install.js:1139-1197`; the actual runtime contract is `config.toml` plus the registered role files in `agents/*.toml` at `bin/install.js:2754-2803`. Any audit that only reasoned from AGENTS.md was looking at the wrong layer.

4. Fixing the known sensor discovery and sandbox issues would still not make signal collection work on Codex. `collect-signals` also depends on background-task orchestration and hardcoded Codex model settings at `get-shit-done/workflows/collect-signals.md:173-205` and `get-shit-done/workflows/collect-signals.md:256-348`. Claude’s audit under-modeled the amount of orchestration logic that is Claude-specific even after the obvious gaps are patched.

5. Relying on the capability matrix as a trustworthy source of truth is itself a bad assumption. It is already stale on Codex config filename and agent delivery at `get-shit-done/references/capability-matrix.md:24-29`. The installer is the ground truth for what the harness actually emits.

## Codex Version Drift Risks

1. Codex model names and effort tiers are hardcoded in multiple places. Evidence: `get-shit-done/references/model-profiles.md:28-35` and `get-shit-done/workflows/collect-signals.md:161-205`. If OpenAI renames or deprecates `gpt-5.4` or `gpt-5.4-mini`, signal collection and profile guidance will drift immediately.

2. The Claude-to-Codex built-in tool mapping is a static table in `bin/install.js:611-626`. If Codex renames built-ins again, adds a better fetch primitive, or changes request-user-input semantics, generated skills will silently degrade until the installer is updated.

3. The agent TOML emitter is schema-fragile. `convertClaudeToCodexAgentToml()` at `bin/install.js:1004-1006` emits a tiny fixed schema (`description`, `sandbox_mode`, `developer_instructions`) with no compatibility handshake. Any future change in Codex agent-role TOML fields will break output generation quickly.

4. The repo already documents that monitoring is only half-built. `get-shit-done/references/platform-monitoring.md:77-82` says change-detection scripts exist but real integration testing against live CLIs is still “Future.” That means drift can still be detected without proving that generated Codex artifacts are accepted.

5. The QT29 lesson in `get-shit-done/references/platform-monitoring.md:21-31` shows the team has already been burned by acting on incomplete Codex schema knowledge. The current stale matrix and converter bugs suggest that feedback loop is still too slow.

## Roadmap Assessment

1. `XRT-01` is too process-oriented and too weak for the actual failure modes. It only requires Codex degradation paths to be specified in phase `CONTEXT.md` before implementation (`.planning/REQUIREMENTS.md:164-166`). That would not catch any of the concrete harness defects above: stale converter output, broken relative paths, leaked agent TOMLs, wrong config filename docs, or `general-purpose` agent misuse.

2. Cross-runtime parity work is sequenced too late relative to current milestone scope. The milestone explicitly includes cross-runtime parity, structural gates, sensors, reflection, and spikes (`.planning/MILESTONE-CONTEXT.md:11`, `.planning/MILESTONE-CONTEXT.md:49-60`), but traceability defers `XRT-01` to Phase 58 and `XRT-02` to Phase 60 (`.planning/REQUIREMENTS.md:237-259`). In practice the Codex substrate is already broken under existing workflows; parity hardening should precede more sensor/gate expansion.

3. The accepted “no hooks on Codex” limitation is valid, but it is currently absorbing unrelated bugs. `.planning/REQUIREMENTS.md:10` explains why some structural enforcement must degrade on Codex. It does not explain broken agent conversion, wrong file references, stale docs, or uninstall residue. Those are harness bugs, not acceptable runtime degradation.

4. The roadmap is conflating “unavoidable Codex degradation” with “fixable Codex incompatibility.” That is risky because it normalizes things that should be hard failures. The right split is: hooks and tool-permission controls are runtime limitations; converter correctness, role registration, path rewriting, and spawn abstraction are harness responsibilities.

5. Phase 60 sensor work depends on first repairing the Codex orchestration substrate. Shipping more sensors before fixing `collect-signals` background-task semantics (`get-shit-done/workflows/collect-signals.md:256-348`) will just compound a broken runtime path.

## Top 5 Recommendations

1. Build a Codex-native orchestration abstraction and migrate workflows to it. Replace raw `Task()`/`run_in_background` prose with a runtime-agnostic spawn/wait contract, then update `plan-phase`, `execute-phase`, `collect-signals`, `map-codebase`, `new-project`, `discuss-phase`, and `diagnose-issues` to use named `gsdr-*` roles instead of `general-purpose`.

2. Fix the installer/converter round trip and lock it down with tests. `replacePathsInContent()` must rewrite relative `.claude/...` and Claude-local skill paths, and `convertClaudeToCodexAgentToml()` must rewrite body tool vocabulary plus unsupported `@file` syntax. Add golden tests on generated `.codex/agents/*.toml` and workflows asserting “no `.claude/` remains,” “no `general-purpose` remains,” and “no Claude-only tool names remain.”

3. Make model handling internally consistent for Codex. Allow `inherit` in `/gsdr-set-profile`, centralize Codex `reasoning_effort` derivation, stop hardcoding `gpt-5.4*` in workflow prose, and document the real distinction between default `resolve_model_ids: omit` behavior and explicit `model_overrides` risk.

4. Fix Codex install/uninstall hygiene. Codex uninstall must remove generated `agents/*.toml`, not just unregister them. Add install/uninstall smoke tests in a temp `HOME` that verify clean creation, re-install idempotence, and clean removal.

5. Treat `capability-matrix.md` as a tested artifact, not informal prose. Correct the Codex rows to reflect `config.toml` and `agents/*.toml`, and add CI checks that compare the matrix against actual generated install output so future parity work cannot start from stale assumptions.
