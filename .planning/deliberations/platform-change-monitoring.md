# Deliberation: Platform Change Monitoring

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-17
**Status:** Open
**Trigger:** Post-execution reflection from QT22-28 (deployment parity). Three categories of platform change — Codex adding agent support, Gemini changing template processing, OpenCode adding `.jsonc` — all went undetected until user bug reports or ad-hoc investigation. The concrete case of Codex agent support proved the point: we validated our implementation against the Codex config schema (75KB JSON Schema at `codex-rs/core/config.schema.json`) and confirmed our output is correct — but this validation happened reactively during a deliberation, not proactively via any monitoring system.
**Affects:** All future runtime support; signal pipeline architecture; v1.18+ maintenance
**Related:**
- sig-2026-03-17-no-platform-change-detection
- `.planning/deliberations/deployment-parity-v1.17.2.md` (Concluded): Fixed the gaps but not the detection
- `.planning/deliberations/cross-runtime-parity-testing.md` (Adopted): Tests that catch structural gaps, not platform changes

## Situation

GSD Reflect deploys to 4 platforms: Claude Code, OpenCode, Gemini CLI, Codex. The installer generates platform-specific artifacts (agents, commands/skills, workflows, config files) using converter functions that assume specific platform capabilities and formats.

When platforms change — adding features, changing formats, deprecating fields — the installer's artifacts can silently break. The current detection mechanisms are:

1. **User bug reports** — reactive, weeks/months of lag (Issue #15 filed 2026-03-15, Codex agent support had been live for unknown period before that)
2. **Upstream GSD commits** — they support 6 runtimes and respond first, but we only see their changes during sync cycles (our v1.18 sync is the first since v1.14)
3. **Ad-hoc investigation** — what we did today, but only when triggered by a specific problem
4. **QT28 parity enforcement test** — catches structural gaps (missing files, wrong counts) but NOT behavioral changes (platform changes how it interprets existing files)

**What we learned about Codex agent support specifically:**

Codex now supports individual agent definitions via:
- `[agents.name]` sections in `config.toml` with `description` and `config_file` fields
- Per-agent `.toml` config files in `~/.codex/agents/` with `sandbox_mode` and `developer_instructions`
- Agent config files can override ANY top-level config property (model, approval_policy, tools, etc.)
- Schema: `codex-rs/core/config.schema.json` (75KB, machine-readable JSON Schema)
- Sandbox modes: `read-only`, `workspace-write`, `danger-full-access`

Our QT22/26 implementation correctly generates these files. Validation against the schema confirmed all fields are valid, though `description` in the .toml is technically extra (Codex reads it from config.toml, not the agent file).

**Platform monitoring resources available:**

| Platform | Repo | Schema/Config Reference | Machine-Readable? |
|----------|------|------------------------|-------------------|
| Codex | `openai/codex` | `codex-rs/core/config.schema.json` (JSON Schema) | Yes — 75KB, fully typed |
| Gemini CLI | `google-gemini/gemini-cli` (if public) | Unknown | Needs investigation |
| OpenCode | `nicepkg/opencode` (if public) | Unknown | Needs investigation |
| Claude Code | Anthropic (proprietary) | `settings.json` schema in docs | Partially |

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| No sensor/workflow references external platform monitoring | grep for platform monitoring terms in agents/ and get-shit-done/ returns 0 relevant hits | Yes — grep confirmed | sig-2026-03-17-no-platform-change-detection |
| Codex config schema exists and is machine-readable | `codex-rs/core/config.schema.json` is 75KB JSON Schema with full `AgentRoleToml`, `SandboxMode`, etc. | Yes — downloaded and parsed | informal |
| Our Codex TOML output validates against schema | `sandbox_mode`, `developer_instructions` match schema types and enums | Yes — tested with node | informal |
| Three platform changes went undetected in v1.17 cycle | Codex agents (Issue #15), Gemini templates (upstream diff), OpenCode jsonc (upstream Issue #1053) | Yes — all three required reactive fixes | informal |
| Upstream GSD is a proxy for platform changes | Their installer added Codex agent support, Gemini template escaping, OpenCode jsonc resolution before we did | Yes — diffed their installer | informal |

## Framing

**Core question (two parts):**

1. **Concrete:** How do we ensure our Codex agent implementation stays current as the Codex platform evolves? (Instance of the general problem, requiring a concrete response)

2. **Systemic:** How should GSD Reflect detect changes in the platforms it deploys to — proactively, before users hit breakage — in a way that integrates with the signal pipeline and is maintainable for a single-developer project?

**Adjacent questions:**
- Should we treat upstream GSD as a "platform sensor" (monitoring their commits for runtime-related changes)?
- Can we automate schema diffing for platforms that publish JSON Schemas?
- How do we balance monitoring investment across 4 (soon 6) platforms when each has different visibility?
- Should Codex agent config files use more schema fields (per-agent model, tools, etc.)?

## Analysis

{To be filled during deliberation}

## Tensions

{To be filled during deliberation}

## Recommendation

{To be filled when concluded}

## Predictions

{To be filled before conclusion}

## Decision Record

**Decision:** {pending}
**Decided:** {pending}
**Implemented via:** {pending}
**Signals addressed:** sig-2026-03-17-no-platform-change-detection

## Evaluation

**Evaluated:** {pending}
