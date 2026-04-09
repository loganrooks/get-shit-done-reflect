---
date: 2026-04-08
audit_type: codebase_forensics
auditor_model: gpt-5.4
scope: "GSD harness codebase analysis for Codex integration points"
triggered_by: "manual: part of codex drift audit session"
ground_rules: none
tags: [codex, harness, codebase-analysis, gpt-5.4]
---
# Codex CLI Compatibility Audit: Additional Findings Beyond Claude's 9

Date: 2026-04-08

Scope read:
- `bin/install.js`
- `get-shit-done/references/capability-matrix.md`
- `.planning/REQUIREMENTS.md`
- `.planning/MILESTONE-CONTEXT.md`
- `get-shit-done/workflows/execute-phase.md`
- `get-shit-done/workflows/collect-signals.md`
- `agents/gsd-executor.md`
- `agents/gsd-artifact-sensor.md`
- Additional corroboration from `get-shit-done/bin/lib/*.cjs`, `tests/unit/*.test.js`, and `.planning/ROADMAP.md`

Known gaps supplied by Claude were treated as already accepted. Findings below are additional misses, plus wrong assumptions and sequencing risks those 9 do not cover.

## Executive Summary

Claude missed that several shared CLI/runtime helpers still treat Codex as if it were either Claude or a generic "constrained" runtime. The biggest problem is not prose drift. It is substrate drift:

1. `automation resolve-level` still hardcodes `task_tool` as effectively Claude-only, so Codex is runtime-capped in code even while the capability matrix says otherwise.
2. Installed-agent and sensor introspection helpers still assume `.claude` + Markdown, so Codex global installs are invisible to the harness.
3. Local `.codex/` installs contaminate project scanning and can flip greenfield projects into false brownfield mode.
4. Signal/model heuristics are still Claude-model-class logic (`opus`/`sonnet`) rather than Codex model+effort logic.
5. Phase 58/60 sequencing is wrong for Codex: several "cross-runtime adaptation" fixes are prerequisites for credible Phase 58 enforcement, not follow-on work.

## Missed Gaps

### 1. Critical: runtime capability resolution still caps Codex as if it lacks `task_tool`

Evidence:
- `get-shit-done/bin/lib/automation.cjs:114-118`
- `get-shit-done/bin/lib/automation.cjs:119-125`
- `get-shit-done/bin/lib/automation.cjs:141-147`
- `get-shit-done/references/capability-matrix.md:17-18`
- `get-shit-done/references/capability-matrix.md:99-106`

Problem:
- Explicit runtime handling only recognizes `claude-code` and `full`.
- Any other runtime, including `codex-cli`, gets `hasTaskTool = false`.
- Heuristic fallback only looks for `.claude/settings.json`, so Codex also loses `task_tool` when no explicit flag is passed.

Impact:
- Reflection and Nyquist auto-leveling are capped on Codex even though the matrix now says Codex has stable subagents.
- This is a source-code contradiction, not just a stale sentence in docs.

Concrete proof:
- Running `node get-shit-done/bin/gsd-tools.cjs automation resolve-level reflection --runtime codex-cli --raw --cwd <tmp>` returned `effective: 2` with reason `reflection needs task_tool above level 2`.

### 2. Critical: installed-agent verification is incompatible with the actual shipped agent set

Evidence:
- `get-shit-done/bin/lib/core.cjs:1274-1297`
- `get-shit-done/bin/lib/verify.cjs:702-717`
- `get-shit-done/bin/lib/model-profiles.cjs:22-38`
- `bin/install.js:2777-2784`

Problem:
- `checkAgentsInstalled()` expects filenames derived directly from `MODEL_PROFILES` keys, with only `.md` or `.agent.md` extensions.
- Installed agents are renamed to `gsdr-*` on non-upstream runtimes, and Codex installs them as `.toml`.
- `MODEL_PROFILES` also contains agents not present in this repo at all (`gsd-ui-*`, `gsd-doc-*`, `gsd-checker`, `gsd-advisor`), so the check can fail even against the source tree.

Impact:
- Agent-install validation produces false negatives.
- Any workflow or health check relying on this verification is noisy and untrustworthy on Codex.
- Codex is worst-hit because both prefix and extension are wrong there.

Concrete proof:
- `GSD_AGENTS_DIR=agents node -e 'require(\"./get-shit-done/bin/lib/core.cjs\").checkAgentsInstalled()'` reports missing agents that do not exist in `agents/`.
- Pointing `GSD_AGENTS_DIR` at a directory containing `gsdr-planner.toml` reports zero installed agents.

### 3. High: sensor introspection commands remain `.claude`/Markdown-only even if workflow discovery is fixed

Evidence:
- `get-shit-done/bin/lib/sensors.cjs:13-25`
- `get-shit-done/bin/lib/sensors.cjs:103-120`
- `tests/unit/sensors.test.js:146-209`
- `get-shit-done/workflows/collect-signals.md:111-145`

Problem:
- `sensors list` and `sensors blind-spots` only look in `cwd/.claude/agents` or dev `agents/`.
- They only parse `*-sensor.md`.
- Codex global installs put agents in `~/.codex/agents/*.toml`, and Codex installs do not retain a runtime `agents/*.md` tree under `get-shit-done-reflect/`.

Impact:
- The CLI command explicitly recommended by `collect-signals` output cannot inspect installed Codex sensors.
- Fixing the workflow glob alone does not restore Codex sensor discoverability.

Concrete proof:
- Running `node get-shit-done/bin/gsd-tools.cjs sensors list --raw --cwd <tmp-with-only-.codex/agents/gsdr-alpha-sensor.toml>` returns `Error: No agents directory found. Run install first.`

### 4. High: local `.codex/` installs pollute `init new-project` brownfield detection

Evidence:
- `get-shit-done/bin/lib/init.cjs:205-228`
- `get-shit-done/bin/lib/init.cjs:231-246`

Problem:
- The code scanner skips `.claude`, but not `.codex`, `.gemini`, or other runtime artifact directories.
- A local Codex install can therefore be mistaken for project source code.

Impact:
- Greenfield projects can be misclassified as brownfield.
- `needs_codebase_map`, `has_existing_code`, and related onboarding behavior become incorrect on Codex-local repos.

Concrete proof:
- With only `.codex/skills/example/foo.js` present, `init new-project --raw` returns `has_existing_code: true`, `is_brownfield: true`.
- The same structure under `.claude/` returns `has_existing_code: false`, `is_brownfield: false`.

### 5. High: config-mismatch signal logic is still Anthropic-class logic, not Codex model+effort logic

Evidence:
- `agents/gsd-artifact-sensor.md:87-90`
- `get-shit-done/references/signal-detection.md:61-78`
- `.planning/REQUIREMENTS.md:106-107`
- `.planning/knowledge/signals/get-shit-done-reflect/2026-03-04-quality-profile-executor-model-unverifiable-phase38.md:31-59`

Problem:
- Detection still defines `quality => opus-class (claude-opus-*)` and `balanced => sonnet-class (claude-sonnet-*)`.
- Codex requirements already recognize that relevant provenance is `model` plus `reasoning effort`.
- The current signal rule therefore encodes the wrong comparison semantics for Codex even after model-ID cleanup.

Impact:
- Codex signal collection can either miss real mismatches or create invalid ones.
- The project already has historical evidence that this class of detection is epistemically weak.

### 6. Medium: `collect-signals` is internally inconsistent about model-profile resolution on Codex

Evidence:
- `get-shit-done/workflows/collect-signals.md:24`
- `get-shit-done/workflows/collect-signals.md:150-180`
- `get-shit-done/workflows/collect-signals.md:253`
- `get-shit-done/references/model-profiles.md:29-35`
- `get-shit-done/bin/lib/core.cjs:1333-1357`

Problem:
- The workflow says sensor model selection derives from `model_profile`.
- The actual workflow logic hardcodes Codex-native defaults: `gpt-5.4` / `gpt-5.4-mini` plus `reasoning_effort`.
- It then explicitly says `MODEL_PROFILE` should not override those defaults.

Impact:
- Operator expectation and implementation diverge.
- This is separate from "no reasoning effort mechanism": even where effort is present, the profile contract is no longer the contract.

## Wrong Assumptions Still Embedded In Source

1. Hooks are treated as the primary Codex limitation.
   - `/.planning/REQUIREMENTS.md:10`
   - `/.planning/ROADMAP.md:97-99`
   - Reality: shared runtime helpers also mis-detect task-tool availability, agent installation, sensor installation, and even project code presence.

2. Runtime capability knowledge is treated as prose, but critical behavior is hardcoded elsewhere.
   - `get-shit-done/references/capability-matrix.md:172-178`
   - `get-shit-done/bin/lib/automation.cjs:107-147`

3. Installed sensor specs are assumed to be file-backed Markdown artifacts.
   - `get-shit-done/workflows/collect-signals.md:111-145`
   - `get-shit-done/bin/lib/sensors.cjs:13-25`
   - `tests/unit/sensors.test.js:146-209`

4. `MODEL_PROFILES` is assumed to equal the shipped agent surface.
   - `get-shit-done/bin/lib/core.cjs:1275-1297`
   - `get-shit-done/bin/lib/model-profiles.cjs:22-38`

5. Codex model quality can still be reasoned about with Claude-class labels.
   - `get-shit-done/references/signal-detection.md:67-76`
   - `agents/gsd-artifact-sensor.md:87-90`

## Version Drift Risks

1. Capability drift risk:
   - Capability truth is duplicated across `capability-matrix.md`, `execute-phase.md`, `automation.cjs`, and `tests/unit/automation.test.js`.
   - Source already demonstrates divergence between matrix and enforcement code.

2. Agent/sensor layout drift risk:
   - Installer writes one shape.
   - Workflow discovery assumes another.
   - CLI helper discovery assumes a third.
   - Tests lock in `.claude/*.md` assumptions rather than install-relative helpers.

3. Model policy drift risk:
   - Codex model policy is split across `model-profiles.md`, `model-profile-resolution.md`, `core.cjs`, `collect-signals.md`, and `signal-detection.md`.
   - Current behavior is internally inconsistent even before the next Codex model release.

4. Install-artifact scanning drift risk:
   - Runtime directories to ignore are hand-maintained in scanning code.
   - `init.cjs` already excludes `.claude` but not `.codex`.

5. Test drift risk:
   - `tests/unit/automation.test.js:368-499` only exercises `constrained` and `full`, plus `.claude/settings.json` heuristics.
   - `tests/unit/sensors.test.js:146-209` explicitly codifies `.claude/agents/*.md`.
   - These tests will preserve the wrong Codex behavior unless rewritten.

## Roadmap Assessment

Current roadmap sequencing is too optimistic for Codex.

- `/.planning/ROADMAP.md:89-99` frames Phase 58 as structural gates plus degradation-path documentation.
- `/.planning/ROADMAP.md:113-124` defers cross-runtime adaptation to Phase 60.

That split is not tenable as written. Several Phase 60-style fixes are prerequisites for Phase 58 to be credible on Codex:

1. Accurate runtime capability detection must exist before automation/postlude gates can claim Codex support.
2. Installed-agent and sensor discovery must work before the harness can trust its own enforcement and introspection commands on Codex.
3. Codex local-install directories must be excluded from brownfield detection before new-project/init behavior is considered parity-safe.
4. Codex signal heuristics must stop using Claude-class model logic before "structural enforcement" can be evaluated by the signal system honestly.

Bottom line:
- `XRT-01` is too narrow.
- The roadmap currently treats Codex mostly as a hookless degradation case.
- The actual source shows substrate-level compatibility defects that belong in or before Phase 58, not after it.

## Top 5 Recommendations

1. Replace heuristic runtime detection with a single shared runtime/capability resolver.
   - Start with `get-shit-done/bin/lib/automation.cjs`.
   - Make it understand `codex-cli`, `gemini-cli`, `opencode`, and consume one authoritative capability map.

2. Centralize installed-agent and sensor discovery on install-relative helpers.
   - One helper should resolve `gsdr-*` vs `gsd-*` and `.md` vs `.toml`.
   - Use it in `core.cjs`, `sensors.cjs`, verify/health code, and workflow docs.

3. Fix local-install artifact hygiene immediately.
   - Update `get-shit-done/bin/lib/init.cjs` to ignore `.codex`, `.gemini`, `.config/opencode` or equivalent local runtime directories.
   - Add regression tests mirroring the `.claude` exclusion proof.

4. Make Codex model provenance first-class.
   - Stop using `opus`/`sonnet` as the detection language for Codex.
   - Resolve and record `{model, reasoning_effort}` explicitly where signals or summaries need provenance.

5. Re-sequence roadmap work.
   - Pull the runtime-helper fixes above into a Codex parity hotfix ahead of Phase 58, or fold them into Phase 58 explicitly.
   - Do not leave them to Phase 60 while claiming Codex structural-gate compatibility.

## Final Judgment

Claude's 9 gaps are real, but they do not capture the most damaging class of remaining Codex issues: shared runtime helper code that still assumes Claude-era installation shape and capability semantics.

The repo is not blocked only by missing docs and missing capability checks. It is blocked by incorrect Codex substrate assumptions in `automation.cjs`, `sensors.cjs`, `core.cjs`, `init.cjs`, and signal-model heuristics. Until those are fixed, Phase 58's Codex story is advisory in a deeper sense than the requirements currently admit.
