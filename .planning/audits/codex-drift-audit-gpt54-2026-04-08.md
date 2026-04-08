# Codex Drift Audit

Audit target: `/home/rookslog/workspace/projects/get-shit-done-reflect`

Audit scope requested:
- `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js`
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md`
- `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/cross-runtime-parity-research.md` existence check
- `/home/rookslog/.codex/skills/gsd-scan/SKILL.md`

Live runtime evidence used during this audit:
- `codex --version` => `codex-cli 0.118.0`
- `codex --help`
- `codex exec --help`
- `codex features list`
- `codex mcp add --help`
- `codex mcp login --help`
- `codex mcp list`
- `codex mcp get context7`

Direct session capability evidence:
- Current tool surface in this session includes `spawn_agent`, `send_input`, `wait_agent`, `resume_agent`, `close_agent`, `update_plan`, and `request_user_input`.
- In this session, `request_user_input` is restricted to Plan mode, which matters for any Codex skill adapter that treats it as generally available.

## Executive Summary

The repo has real Codex drift, not just stale wording.

The highest-signal problems are:
- The docs still describe Codex as having no hooks support, while the live CLI exposes `codex_hooks` and the current config enables it.
- The docs still describe the Codex config file as `codex.toml`, while the actual CLI, installer, tests, and live install all use `~/.codex/config.toml`.
- The docs still describe Codex agents as "via `AGENTS.md`", while the real mechanism is `config.toml` plus `agents/*.toml`; `AGENTS.md` is supplemental.
- Codex-specific call-shape docs have already drifted: repo docs show `spawn_agent(agent="...")` and `model_reasoning_effort`, while the actual session tool surface is `spawn_agent(agent_type=..., model=..., reasoning_effort=...)`.
- The installed `gsd-scan` skill has a broken execution context path pointing at `~/.codex/get-shit-done/...`, which does not exist on this machine. Only `~/.codex/get-shit-done-reflect/...` exists.

Two major Codex assumptions did verify as correct:
- Subagent capability is real and current. `codex features list` reports `multi_agent stable true`.
- MCP support is real and current. `codex mcp add --help` supports stdio and `--url`, and `codex mcp login --help` supports OAuth login.

## Verified Against The Live Runtime

### Correct today

- `task_tool` / subagents:
  - Repo claim: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md:11-18`, `:33-46`, `:95-106`
  - Live evidence: `codex features list` shows `multi_agent stable true`
  - Session evidence: this session exposes `spawn_agent`, `wait_agent`, `send_input`, `resume_agent`, `close_agent`
  - Verdict: correct

- MCP support:
  - Repo claim: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md:14`, `:74-91`, `:102`
  - Live evidence:
    - `codex mcp add --help` supports stdio and `--url` for streamable HTTP
    - `codex mcp login --help` supports OAuth login
    - `codex mcp get context7` shows working stdio server config
  - Verdict: correct

### Currently wrong

1. Hooks are documented as unavailable in Codex, but the live CLI now exposes hooks as a feature flag and this install has it enabled.
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md:12`, `:48-59`, `:100`, `:106`
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:1180-1183`
   - `/home/rookslog/.codex/AGENTS.md:31-34`
   - `/home/rookslog/.codex/config.toml:6-7`
   - `codex features list` => `codex_hooks under development true`
   Impact:
   - The repo is telling Codex users and maintainers that a live feature does not exist.
   - The installer still hard-skips hooks for Codex, so the drift is operational, not just documentary.

2. The repo still names the Codex config file `codex.toml`. The actual file is `config.toml`.
   Evidence:
   - Wrong doc: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md:29`, `:91`
   - Installer code: `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:1227-1233`, `:1302-1324`
   - Test evidence: `/home/rookslog/workspace/projects/get-shit-done-reflect/tests/integration/multi-runtime.test.js:400-411`
   - Live CLI help: `codex --help` and `codex exec --help` both say config is loaded from `~/.codex/config.toml`
   - Live file: `/home/rookslog/.codex/config.toml`
   Impact:
   - This is unambiguous version drift.
   - Anyone following the matrix instead of the installer/tests will target the wrong file name.

3. The repo still describes Codex agents as "via `AGENTS.md`", but live Codex registration is `config.toml` plus per-agent TOML files.
   Evidence:
   - Wrong doc: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md:28`
   - Installer code: `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:1264-1281`
   - Installer behavior: `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:2806-2811` says `AGENTS.md` supplements the agent TOML files
   - Live config: `/home/rookslog/.codex/config.toml:39-127`
   - Live agent files: `/home/rookslog/.codex/agents/gsdr-codebase-mapper.toml`
   Impact:
   - The capability matrix is describing the wrong control plane.
   - This is the kind of stale assumption that causes failed migrations and bad troubleshooting advice.

4. The repo still describes Codex skills as `skills/*.md`, but live Codex skills are directories containing `SKILL.md`.
   Evidence:
   - Wrong doc: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md:27`
   - Install test: `/home/rookslog/workspace/projects/get-shit-done-reflect/tests/unit/install.test.js:1699-1716`
   - Live files:
     - `/home/rookslog/.codex/skills/gsd-scan/SKILL.md`
     - `/home/rookslog/.codex/skills/gsdr-help/SKILL.md`
   Impact:
   - Another stale artifact-shape assumption.
   - Anyone validating or generating Codex skills from the matrix will use the wrong file layout.

5. Codex-specific subagent call-shape documentation has already drifted.
   Evidence:
   - Repo example: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/model-profile-resolution.md:40-49`
     - uses `spawn_agent(agent="gsdr-planner", ...)`
   - Repo wording: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/model-profiles.md:29-35`
     - says Codex uses `model_reasoning_effort`
   - Installed skill wording: `/home/rookslog/.codex/skills/gsd-scan/SKILL.md:36-45`
     - says `wait(ids)` and says inline `Task(model="...")` should be omitted
   - Actual session capability:
     - `spawn_agent` takes `agent_type`
     - `spawn_agent` supports `model`
     - `spawn_agent` supports `reasoning_effort`
     - waiting is via `wait_agent`
   Impact:
   - If repo docs are followed literally during Codex adaptation work, the resulting tool calls will be wrong.
   - This is exactly the kind of drift that turns "Codex supported" into "Codex sort of supported until someone actually wires it up".

6. The installed `gsd-scan` skill has a broken workflow path on this machine.
   Evidence:
   - `/home/rookslog/.codex/skills/gsd-scan/SKILL.md:55-60` points at `@$HOME/.codex/get-shit-done/workflows/scan.md`
   - Live filesystem check: `/home/rookslog/.codex/get-shit-done/workflows/scan.md` is missing
   - Live filesystem check: `/home/rookslog/.codex/get-shit-done-reflect/` exists and contains workflows/references
   Scope note:
   - `gsd-scan` is installed in the live Codex environment but is not repo-owned content inside this checkout.
   - It is still a strong real-world drift signal because the exact path namespace mismatch here is the same class of bug this repo is vulnerable to.
   Impact:
   - At least one installed Codex skill is already broken by namespace/path drift.

## What Could Break Next

1. Codex hook support will remain disabled in practice even if the runtime keeps moving toward stable hooks.
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:2840-2850` skips copying hooks for Codex
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:2896-2902` returns early for Codex with "no settings.json, hooks, or statusline"
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/tests/unit/install.test.js:1746-1749` hardcodes that Codex should have no hooks directory
   Risk:
   - The repo will actively enforce yesterday's Codex behavior against today's CLI.

2. Future Codex-oriented workflow migrations may fail because the repo's own docs already encode stale tool signatures.
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/model-profile-resolution.md:40-49`
   - `/home/rookslog/.codex/skills/gsd-scan/SKILL.md:32-45`
   Risk:
   - Engineers will implement adapter code that looks internally consistent but does not match the live tool surface.

3. Generated Codex skills may continue to lag the actual Codex skill idiom.
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:1012-1021` says Codex conversion emits `SKILL.md`
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:1049-1065` strips frontmatter down aggressively
   - Live richer example: `/home/rookslog/.codex/skills/gsd-scan/SKILL.md:1-46`
   Risk:
   - If Codex keeps leaning on structured skill metadata or explicit adapter guidance, generated GSD skills will under-specify behavior.

4. The current config merge strategy may clobber future user content if Codex encourages more `config.toml` data below the GSD marker.
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:1287-1298`
   Risk:
   - Marker-to-EOF removal is convenient now, but brittle against future Codex config layout growth.

5. Namespace drift between `get-shit-done` and `get-shit-done-reflect` is already a live failure mode.
   Evidence:
   - Broken installed skill path: `/home/rookslog/.codex/skills/gsd-scan/SKILL.md:55-60`
   - Existing installed tree: `/home/rookslog/.codex/get-shit-done-reflect/`
   Risk:
   - Any converted skill, reference, or install migration path that leaves the old namespace behind will fail silently until invoked.

## Monitoring Gaps

1. The requested parity research artifact does not exist.
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/cross-runtime-parity-research.md` is missing
   Why it matters:
   - There is no durable record of which Codex version was last audited and which claims were actually revalidated.

2. The repo does not probe the live Codex CLI before release.
   Evidence:
   - I found no test that shells out to `codex --help`, `codex exec --help`, `codex features list`, or `codex mcp add --help`
   Why it matters:
   - This repo is making live-runtime claims without a live-runtime check.

3. Tests already encode at least one stale Codex assumption.
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/tests/unit/install.test.js:1746-1749` expects no hooks directory for Codex
   Why it matters:
   - The test suite would resist updating Codex support even though the live CLI now exposes `codex_hooks`.

4. The repo validates source command execution-context references, but not generated Codex skill outputs.
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/tests/integration/wiring-validation.test.js:301-345`
   Why it matters:
   - This catches source `commands/gsd/*.md` wiring, but not post-conversion Codex artifacts or installed skills.
   - Path-shape drift can survive conversion and install without any repo test failing.

5. Repo docs and repo tests already disagree on the Codex config file name.
   Evidence:
   - Doc says `codex.toml`: `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md:29`
   - Test asserts `config.toml`: `/home/rookslog/workspace/projects/get-shit-done-reflect/tests/integration/multi-runtime.test.js:400-411`
   Why it matters:
   - The repo has no single source of truth for Codex artifact shape.

6. The docs blur together "no Claude-style tool allowlists" with "no execution controls".
   Evidence:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md:61-72`
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:21-35`
   - `/home/rookslog/.codex/agents/gsdr-codebase-mapper.toml:1-2`
   Why it matters:
   - Codex does lack per-tool allow/deny lists, but this repo already emits per-agent `sandbox_mode`.
   - Without documenting that distinction, maintainers will misread the current isolation story.

## Compatibility Recommendations

1. Update the Codex format reference immediately.
   Change:
   - `config.toml`, not `codex.toml`
   - `skills/<skill>/SKILL.md`, not `skills/*.md`
   - `agents/*.toml` registered from `config.toml`; `AGENTS.md` is supplemental
   Files:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md`
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js` generated AGENTS text

2. Replace the blanket "Codex has no hooks support" claim with a versioned or feature-gated statement.
   Recommended wording:
   - "Hooks are present behind `features.codex_hooks` in newer Codex CLI builds; verify against the minimum supported Codex version before enabling GSD hook integration."
   Files:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/capability-matrix.md`
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:1150-1197`
   Follow-on:
   - Decide whether Codex hook installation should be feature-gated instead of hard-disabled.

3. Add a repo-owned parity ledger.
   Create:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/get-shit-done/references/cross-runtime-parity-research.md`
   Minimum contents:
   - last audited Codex version
   - commands used for validation
   - config file path
   - skill file shape
   - agent registration shape
   - hook status
   - sandbox modes observed
   - MCP transport/auth support observed

4. Add a Codex parity smoke test that shells out to the installed CLI when available.
   Minimum assertions:
   1. `codex --version`
   2. `codex --help` mentions `~/.codex/config.toml`
   3. `codex features list` reports current hook and multi-agent feature state
   4. `codex mcp add --help` still supports stdio and `--url`
   5. `codex mcp login --help` still exposes OAuth login
   6. Generated install output matches the documented artifact shapes

5. Make generated Codex adapters explicit instead of implied.
   Add a standard Codex adapter block for generated skills covering:
   - `AskUserQuestion -> request_user_input`
   - Plan-mode-only limitation of `request_user_input`
   - Execute-mode numbered-list fallback
   - `Task -> spawn_agent / wait_agent / send_input / resume_agent / close_agent`
   - valid parameter names: `agent_type`, `model`, `reasoning_effort`
   Rationale:
   - This is already the shape the live environment needs.
   - Right now that knowledge is fragmented across docs and external installed skills.

6. Add post-conversion and post-install validation for Codex skill references.
   Validate:
   - every generated `SKILL.md` execution-context reference exists after conversion
   - every installed path uses `get-shit-done-reflect`, not the legacy `get-shit-done`
   Files to extend:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/tests/unit/install.test.js`
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/tests/integration/wiring-validation.test.js`

7. Document isolation precisely.
   Recommended split:
   - "Codex does not expose Claude-style per-tool allowlists"
   - "Codex does support runtime approvals/sandboxing and this installer emits per-agent `sandbox_mode`"
   Evidence basis:
   - `/home/rookslog/workspace/projects/get-shit-done-reflect/bin/install.js:21-35`
   - `/home/rookslog/.codex/agents/gsdr-codebase-mapper.toml:1-2`

## Bottom Line

This repo is not broadly broken on Codex today. Multi-agent support and MCP support are real.

The drift is concentrated in the Codex-specific compatibility story:
- stale hook assumptions
- stale artifact-shape docs
- stale adapter call signatures
- missing parity monitoring

The highest-value fix is to stop treating Codex compatibility as static prose and start testing it against the installed `codex` binary. That would have caught every high-signal issue in this audit.
