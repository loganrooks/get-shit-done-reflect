---
created: 2026-03-19T04:55:00Z
status: complete
originating_phase: project-level
depends_on: none
round: 1
time_estimate: ~1 hour
mode: full
---

# Spike: Codex Agent Integration Validation

## Question

Can the Codex CLI actually load, parse, and use the agent TOML files and config.toml registrations that GSD Reflect generates? We've validated file structure (QT22-28) and learned that the published JSON Schema doesn't cover agent role files (QT29 false positive). The only remaining validation is running the actual binary.

## Type

Binary — either Codex accepts our generated artifacts or it doesn't. Sub-questions are also binary (does it parse, does it surface descriptions, does it respect sandbox modes).

## Prerequisites / Feasibility

**Environment requirements:**
- Codex CLI (`npx @openai/codex` or `npm install -g @openai/codex`)
- Node.js (available)
- OpenAI API key — **CRITICAL QUESTION:** Can Codex parse/validate config WITHOUT making API calls? If it requires auth just to start, we need a key or must find a dry-run mode.
- Network access to npm registry (available)

**Feasibility checklist:**
- [ ] Codex CLI installable on this machine (Linux x86_64)
- [ ] Config parsing possible without API key OR API key available
- [ ] Experiments run in isolated temp directory (no modification to ~/.codex/)
- [ ] No production systems at risk

**If prerequisites NOT met:**
If Codex requires an API key just to parse config, we'll document this as a blocker and fall back to source code analysis (reading the Rust parser tests as our best proxy for behavioral validation).

## Hypothesis

H1: Codex CLI can start/parse a config.toml with `[agents.*]` sections pointing to agent .toml files that contain `description`, `sandbox_mode`, and `developer_instructions` fields — without errors.

H2: Our generated agent .toml files (from `convertClaudeToCodexAgentToml()`) are parsed successfully by Codex, including the `description` field that was controversially removed and restored.

H3: `codex features list` or equivalent command shows `multi_agent` as stable/enabled, confirming agent support is active.

## Success Criteria

- [ ] Codex CLI installs and runs on this machine
- [ ] Config parsing completes without TOML errors for all 12+ agent files
- [ ] No "failed to parse agent role file" or "failed to deserialize" errors
- [ ] Agent roles are discoverable (listed in some Codex output)
- [ ] If API key not needed for parsing: CI behavioral testing is feasible (deliberation P3)

## Experiment Plan

### Experiment 1: Install and Feasibility Check

- **What:** Install Codex CLI, check if it can run without API key, find config validation commands
- **Measures:** Install success, `codex --version` output, `codex --help` for config/validation subcommands, behavior without API key
- **Expected outcome:** Codex installs, has a version command, may or may not require API key for config parsing

### Experiment 2: Generate and Parse Agent Config

- **What:** Run our installer `--codex --global` to a temp dir, then point Codex at the generated config using `CODEX_HOME` env var. Check if it parses without errors.
- **Measures:** Exit code, stderr output, any "failed to parse" messages
- **Expected outcome:** Codex parses our config.toml and agent .toml files without errors

### Experiment 3: Agent Role Discovery

- **What:** If Experiment 2 succeeds, check if agent roles are discoverable — try `codex features list`, or inspect any agent listing output
- **Measures:** Whether our `gsdr-*` agent roles appear in output
- **Expected outcome:** Agent roles are listed with descriptions from config.toml

## Scope Boundaries

**In scope:**
- Can Codex parse our generated artifacts without errors
- Is CI-based behavioral testing feasible (no API key needed for config parsing)
- Does the `description` field in agent .toml cause any issues

**Out of scope:**
- Actually spawning agents (requires API calls)
- Testing agent behavior/instructions quality
- Gemini CLI or OpenCode integration testing (separate spikes)
- Performance or load testing

## Time Estimate

~1 hour (mostly install time + experimentation)

---

## Iteration Log

### Round 1

**Status:** complete
**Summary:** All three hypotheses confirmed. Codex v0.115.0 loads all 20 GSD agent role files without errors, lists them as spawnable sub-agents with correct descriptions, and successfully spawns them with `spawn_agent`. The `description` field is accepted (invalid fields produce explicit warnings — ours don't). CI-based behavioral testing is feasible: `codex exec` with a prompt works non-interactively, and `codex features list` can verify feature flag state. API key IS required for actual agent spawning but NOT for config parsing/feature listing.
