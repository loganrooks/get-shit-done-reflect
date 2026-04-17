---
phase: quick
plan: 260417-5ql
model: gpt-5.4
context_used_pct: 18
subsystem: codex-installer
tags: [codex, config, compaction, installer, gsd]
dependency_graph:
  requires: [OpenAI Codex config reference]
  provides: [Codex compaction prompt override, installed prompt file, regression coverage]
  affects: [config.toml generation, Codex install layout]
tech_stack:
  added: []
  patterns: [marker-managed config blocks, installed prompt asset]
key_files:
  created:
    - get-shit-done/templates/codex-compact-prompt.md
    - .planning/quick/260417-5ql-add-codex-experimental-compact-prompt-fi/260417-5ql-PLAN.md
  modified:
    - bin/install.js
    - tests/unit/install.test.js
    - tests/integration/multi-runtime.test.js
decisions:
  - "Use the documented top-level experimental_compact_prompt_file key instead of compact_prompt inline text"
  - "Point config.toml at an absolute path inside the installed GSD tree for stability across runs"
  - "Keep the prompt override in the existing GSD-managed config block with MCP settings"
  - "Rewrite the compact prompt around control-surface continuity, inspired by prix-guesser's project compact prompt"
metrics:
  duration: 8min
  completed: 2026-04-17
---

# Quick Task 260417-5ql: Codex compact prompt override

Added a GSD-specific compaction prompt file and configured Codex installs to use it through the documented
`experimental_compact_prompt_file` setting.

## What Changed

- `bin/install.js` now writes `experimental_compact_prompt_file = "/abs/path/.../codex-compact-prompt.md"`
  inside the GSD-managed `config.toml` block alongside the existing MCP entries.
- `get-shit-done/templates/codex-compact-prompt.md` now preserves control surface, reread order,
  workflow distinctions that must not flatten, and quick-task continuity rather than a generic summary.
- Unit and integration tests now verify the config line, idempotency, and install-time presence of the prompt file.

## Verification

- `npm test -- tests/unit/install.test.js tests/integration/multi-runtime.test.js`
  - Passed: 268 tests
- Live install applied with `node bin/install.js --codex --global`
- Verified:
  - `~/.codex/config.toml` contains `experimental_compact_prompt_file = "/home/rookslog/.codex/get-shit-done-reflect/templates/codex-compact-prompt.md"`
  - `~/.codex/get-shit-done-reflect/templates/codex-compact-prompt.md` exists

## Deviations

- `.planning/STATE.md` was not updated for the quick-task table because the file already had unrelated in-progress edits
  in the worktree. This task recorded its artifacts under `.planning/quick/260417-5ql-add-codex-experimental-compact-prompt-fi/`
  to avoid mixing concerns.
- No commit was created for the same reason: the worktree already contained unrelated planning changes and untracked phase dirs.
