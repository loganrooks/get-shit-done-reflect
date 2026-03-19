# Platform Monitoring Reference

GSD Reflect deploys to 4 platforms: Claude Code, OpenCode, Gemini CLI, and Codex.
When those platforms change, our deployment artifacts can silently break.
This document explains why monitoring matters, how to run detection, and how to respond to detected changes.

## Why Platform Monitoring Matters

During the v1.17.2-v1.17.3 effort (QT22-28), three platform changes went undetected:

1. **Codex** added multi-agent support (agent role files, per-agent config)
2. **Gemini CLI** changed template processing (escaping rules, variable handling)
3. **OpenCode** added `.jsonc` config format (alongside existing JSON)

All three were discovered reactively -- user bug reports or ad-hoc investigation during deployment parity work. Without monitoring, changes accumulate silently until deployment artifacts break in production.

**Signal:** sig-2026-03-17-no-platform-change-detection

## The QT29 Lesson

QT29 demonstrated the danger of trusting a single source of truth without triangulation:

1. Validated Codex agent TOML against published `config-schema.json`
2. Schema had `additionalProperties: false` -- rejected our `description` field
3. Shipped a "fix" removing `description` from agent TOML output
4. **Discovery:** `config-schema.json` describes `config.toml`, NOT agent role files
5. Agent role files have their own Rust-defined schema (`RawAgentRoleFileToml`) that explicitly accepts `description`
6. Codex's own test suite exercises `description` in agent files and asserts it loads correctly
7. QT29 was reverted (ec54886)

**Lesson:** No single artifact -- schema, source code, or documentation -- is a complete source of truth. Triangulate across multiple sources before acting on monitoring output.

## How to Run Detection

The detection script lives at `scripts/detect-platform-changes.sh`.

```bash
# Run all checks (default)
./scripts/detect-platform-changes.sh --all

# Upstream GSD installer changes only
./scripts/detect-platform-changes.sh --upstream

# Codex config schema changes only
./scripts/detect-platform-changes.sh --codex-schema
```

**First run** initializes baselines in `~/.gsd/cache/platform-baselines/`. Subsequent runs compare against these baselines.

**Exit codes:**
- `0` -- No changes detected
- `1` -- Changes detected (review output)
- `2` -- Invalid arguments

**Recommended cadence:** Run before starting upstream sync work or periodically (weekly).

### What Each Check Does

**Upstream GSD installer (`--upstream`):** Downloads upstream's `bin/install.js` from GitHub, diffs against cached baseline, and filters for runtime-relevant changes (new converter functions, path/config changes, new runtime flags).

**Codex config schema (`--codex-schema`):** Fetches the latest stable Codex release, downloads `config-schema.json`, and performs structural JSON diffing (new/removed definitions, properties, enum values). Requires `gh` CLI.

## When Changes Are Detected

1. **Read the summary output carefully** -- it shows what changed, not what to do about it
2. **Investigate before acting** -- do NOT immediately "fix" based on monitoring output
3. **Triangulate** across multiple sources:
   - Platform source code (Rust structs, TypeScript types)
   - Platform test suites (what they actually exercise)
   - Platform documentation (official docs, release notes)
   - Upstream GSD implementation (what they did and why)
4. **For Codex specifically:** The published JSON Schema covers `config.toml` only. Agent role files have a separate schema defined in Rust source (`RawAgentRoleFileToml` struct)
5. **If uncertain:** Create a deliberation in `.planning/deliberations/` before shipping changes

## Architecture

| Layer | Status | What it does | Reliability |
|-------|--------|-------------|-------------|
| **Layer 1: Change detection scripts** | Implemented | Early warning via diff | Medium -- detects changes but not correctness |
| **Layer 2: Integration testing** | Future | Run actual platform CLIs against our artifacts | High -- ground truth |

Layer 1 tells you *something changed*. Layer 2 tells you *your output is accepted*. Both are needed; Layer 1 is available now at low cost.

### Related Documents

- **Source deliberation:** `.planning/deliberations/platform-change-monitoring.md`
- **Detection script:** `scripts/detect-platform-changes.sh`
- **Cross-runtime parity tests:** Tests that catch structural gaps (QT28), complementary to platform monitoring
