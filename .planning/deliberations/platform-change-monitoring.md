# Deliberation: Platform Change Monitoring

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-18
**Status:** Concluded
**Trigger:** Post-execution reflection from QT22-28 (deployment parity). Three categories of platform change — Codex adding agent support, Gemini changing template processing, OpenCode adding `.jsonc` — all went undetected until user bug reports or ad-hoc investigation. The concrete case of Codex agent support was used as a test case to empirically evaluate three monitoring approaches, revealing that schema validation against the published JSON Schema gave a false positive that led to a shipped-then-reverted "fix" (QT29).
**Affects:** All future runtime support; signal pipeline architecture; v1.18+ maintenance
**Related:**
- sig-2026-03-17-no-platform-change-detection
- `.planning/deliberations/deployment-parity-v1.17.2.md` (Concluded): Fixed the gaps but not the detection
- `.planning/deliberations/cross-runtime-parity-testing.md` (Adopted): Tests that catch structural gaps, not platform changes

## Situation

GSD Reflect deploys to 4 platforms (Claude, OpenCode, Gemini CLI, Codex). When these platforms change, our deployment artifacts can silently break. We discovered this during the v1.17.2-v1.17.3 effort (QT22-28), where three platform changes had gone undetected.

We used the Codex agent support addition as a concrete test case to empirically evaluate three monitoring approaches. The results were instructive — and humbling.

### Codex Agent Support: The Test Case

Codex evolved multi-agent support from Jan 6 → Mar 13, 2026 (v0.79.0 → v0.115.0). The system allows spawning sub-agents with per-agent config files. Agent role files (`.toml`) accept:
- `name`, `description`, `nickname_candidates` (metadata fields)
- Plus any top-level config property via `#[serde(flatten)]` (`sandbox_mode`, `developer_instructions`, `model`, etc.)

Source of truth: `RawAgentRoleFileToml` struct in `codex-rs/core/src/config/agent_roles.rs` (PR #14177, merged to main 2026-03-10).

### What Happened When We Tested the Monitoring Approaches

| Approach | Result | What it actually told us |
|----------|--------|------------------------|
| **A: Upstream GSD diff** | Would have surfaced the Codex agent feature (they added `convertClaudeAgentToCodexAgent`, `generateCodexAgentToml`) | Good: "something changed." But: upstream also puts `description` in agent TOML, so copying their pattern doesn't guarantee correctness. |
| **B: Schema diff** | Correctly showed `AgentRoleToml` definition added between v0.101 and v0.102. 26 new definitions, 23 new top-level properties. | Good: "the schema expanded." But: tells you *what* changed, not *how to respond*. |
| **C: Schema validation** | **Gave a false positive.** Validated against `config.schema.json` which has `additionalProperties: false`. Our `description` field was rejected. We shipped QT29 to remove it. Then discovered the published schema describes `config.toml`, NOT agent role files. Agent role files have their own schema (`RawAgentRoleFileToml`) that explicitly accepts `description`. We reverted QT29. | **Dangerous: appeared authoritative but validated against the wrong spec.** |

### The False Positive Chain

1. Validated agent TOML against published `config.schema.json`
2. `description` rejected by `additionalProperties: false`
3. Concluded `description` was invalid → shipped QT29 (removed field)
4. User challenged: "what is the source for your claim and do we have reliable sources that contradict?"
5. Investigated Rust source: `RawAgentRoleFileToml` explicitly has `description: Option<String>`
6. Found Codex's own test suite writes `description` in agent files and asserts values load correctly
7. Reverted QT29

The published JSON Schema is not the source of truth for all file formats. Agent role files have their own Rust-defined schema that wraps `ConfigToml` with additional metadata fields.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| No sensor/workflow monitors external platform state | grep confirmed 0 relevant hits in agents/ and get-shit-done/ | Yes | sig-2026-03-17-no-platform-change-detection |
| Codex schema diff (v0.101 → v0.115) | `AgentRoleToml` added, 26 new definitions, 23 new props | Yes — downloaded both schemas, diffed programmatically | informal |
| Schema validation against config.schema.json | `description` rejected as unexpected additional property | **Yes but misleading** — validates against wrong schema | informal |
| `RawAgentRoleFileToml` struct on main | Has `description: Option<String>`, `name: Option<String>`, `nickname_candidates: Option<Vec<String>>`, `#[serde(flatten)] config: ConfigToml` | Yes — read current file on main via GitHub API | informal |
| PR #14177 merged | `state: closed, merged: true, merged_at: 2026-03-10` | Yes — GitHub API | informal |
| Codex test suite exercises description in agent files | Multiple tests write `.toml` files with `description = "..."` and assert values load | Yes — read test source on main | informal |
| `AgentRoleToml.description` schema docs | "Required unless supplied by the referenced agent role file" | Yes — parsed schema JSON | informal |

## Framing

**Core question:** How should GSD Reflect detect and respond to changes in the platforms it deploys to, given that (a) no single artifact (schema, source code, docs) is a complete source of truth, (b) the most reliable validation is running the actual platform, and (c) the project is maintained by a single developer?

**Adjacent questions:**
- Can Codex be run in CI without API keys (dry-run / config-parse mode)?
- Do Gemini CLI and OpenCode have equivalent testability?
- How do we prevent false positives from partial sources of truth?

## Analysis

### Option A: Upstream GSD Diff as Change Trigger

- **Claim:** Monitor upstream GSD's `bin/install.js` for new or changed converter functions. When they add `convertClaudeAgentToCodexAgent` or `resolveOpencodeConfigPath`, that's a signal to investigate.
- **Grounds:** Upstream responded to all three platform changes we missed. They support 6 runtimes and have more users reporting issues. Their installer changes are a reliable proxy for "a platform changed."
- **Warrant:** Low cost (periodic `git diff` against cached baseline), high coverage (covers all platforms upstream supports), acceptable latency (days-weeks behind the platform change, but weeks-months ahead of user reports reaching us).
- **Rebuttal:** Upstream can be wrong (they also put `description` in agent TOML — same non-issue). Copying their patterns without understanding the platform gives false confidence. Also: upstream may make changes for platforms we don't support (Copilot, Antigravity), creating noise.
- **Qualifier:** Good as a trigger. Not sufficient as validation.

### Option B: Schema/Release Diff as Change Detection

- **Claim:** For platforms that publish schemas (Codex: `config-schema.json` as release asset), periodically download and diff. Surface new definitions, changed enums, added/removed properties.
- **Grounds:** The schema diff correctly identified `AgentRoleToml` as new. The URL pattern is stable (`https://github.com/openai/codex/releases/download/rust-v{VERSION}/config-schema.json`). This is automatable: download, hash, if different → diff and surface.
- **Warrant:** Catches format changes the day they're released. Machine-readable. No API keys needed.
- **Rebuttal:** The published schema may not cover all file formats (proven: agent role files have their own schema). Diffs tell you something changed but not what to do about it. Not all platforms publish schemas.
- **Qualifier:** Good for early warning. Must NOT be treated as the complete specification.

### Option C: Integration Testing Against Actual Platforms

- **Claim:** The most reliable validation is feeding our generated artifacts to the actual platform and checking acceptance. For Codex: install CLI, write our agent TOML, have Codex parse it. For others: equivalent.
- **Grounds:** Every other approach gave us an incomplete or misleading answer. The JSON Schema was wrong for agent files. The Rust source was right but required reading code, not running it. The only unambiguous test is "does the platform accept this?"
- **Warrant:** This is the highest-severity test (Mayo) — if our output is broken, the platform WILL reject it. No false positives from validating against the wrong spec. Catches behavioral changes that no static analysis can detect.
- **Rebuttal:** Requires platform CLIs to be installable in CI. May need API keys. Adds CI time and external dependency. Flaky if platform versions change between CI runs. Not all platforms may be testable this way.
- **Qualifier:** The gold standard, but practical feasibility needs investigation per platform.

## Tensions

1. **Severity vs. practicality:** The most reliable test (run the platform) is the hardest to set up. The easiest test (diff a schema) gave us a false positive. There's no shortcut — reliability requires investment.

2. **Early detection vs. correct response:** Options A and B detect changes early but don't tell you the correct response. Option C validates your response but doesn't detect changes you haven't responded to yet. You need both: detection to know when to act, validation to know you acted correctly.

3. **Single source of truth doesn't exist:** We assumed the JSON Schema was authoritative. It wasn't for agent files. The Rust source was more authoritative but still required interpretation (serde attribute interactions). The test suite was the most reliable evidence short of running the binary. For platform monitoring, this means: triangulate across sources rather than trusting any single one.

## Recommendation

**Two-layer strategy: change detection (A+B) triggering targeted investigation, with integration testing (C) as the validation layer where feasible.**

**Layer 1: Change Detection (implement now, low cost)**
- Periodic upstream GSD diff (weekly or pre-sync): `git diff` their `bin/install.js` filtered for converter function changes
- Codex schema diff (on new stable releases): download `config-schema.json`, diff against cached baseline, surface new definitions relevant to our deployment (agent roles, sandbox modes, tool configs)
- Implementation: a script in `scripts/` runnable manually or via cron. Outputs a summary of changes relevant to our runtimes.

**Layer 2: Integration Validation (investigate feasibility, higher cost)**
- Spike: Can Codex CLI parse a config + agent files without API keys? (`codex --help`, `codex features list`, or a config validation mode)
- Spike: Can Gemini CLI and OpenCode validate config without running?
- If feasible: add CI job that generates artifacts and feeds them to each platform's parser
- If not feasible: fall back to source code reading (Rust structs, TypeScript types) as a secondary validation, with the explicit understanding that this is second-best

**Process lesson: validate claims before shipping fixes.**
QT29 was shipped based on a schema validation false positive. The deliberation's severe testing step (2.5) should have caught this by asking "is `config.schema.json` the right schema for agent role files?" before treating its output as authoritative. When a monitoring system tells you something is wrong, investigate the claim before acting on it — especially when the "something" was previously working.

## Predictions

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Upstream GSD diff would have surfaced the Codex agent support addition at least 2 weeks before our Issue #15 was filed | Check upstream commit dates for `convertClaudeAgentToCodexAgent` vs Issue #15 date (2026-03-15) | Upstream added their Codex agent support after Issue #15 |
| P2 | Codex schema diff between any two consecutive stable releases will surface at least one change relevant to our deployment in >50% of releases | Run schema diff across 5 consecutive release pairs | <50% of diffs contain agent/config-relevant changes (too noisy or too quiet) |
| P3 | The Codex CLI can parse config.toml + agent .toml files without an API key (enabling CI validation) | Spike: install Codex, create test config, run without API key, check exit code | Codex requires API authentication to start, even for config parsing |
| P4 | The change detection script will catch a platform change before any user reports it, within the first 6 months of operation | Track: next platform change detection source (script vs user report vs upstream sync) | Next platform change is discovered via user report again |

## Decision Record

**Decision:** Two-layer strategy: change detection scripts (upstream diff + schema diff) as Layer 1 (implement as quick task), integration testing feasibility spikes as Layer 2 (investigate before committing). Process improvement: treat monitoring outputs as triggers for investigation, not as authoritative validation results.
**Decided:** 2026-03-18
**Implemented via:** Pending — Layer 1 as quick task, Layer 2 as spikes
**Signals addressed:** sig-2026-03-17-no-platform-change-detection

## Evaluation

**Evaluated:** {pending}
