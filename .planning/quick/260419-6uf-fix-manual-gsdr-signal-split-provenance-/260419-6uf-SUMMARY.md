---
phase: quick
plan: 260419-6uf
model: gpt-5.4
context_used_pct: 22
subsystem: signal command, codex installer
tags: [signal, provenance, codex, installer, quick-task]
dependency_graph:
  requires:
    - "Phase 57.8 split-provenance contract"
  provides:
    - "Manual gsdr-signal source instructions aligned to v2_split provenance"
    - "Installer regression proving Codex skill conversion preserves the split fields"
    - "Repo-local Codex skill regenerated from source via installer"
  affects:
    - "commands/gsd/signal.md"
    - "tests/unit/install.test.js"
    - ".codex/skills/gsdr-signal/SKILL.md"
tech_stack:
  added: []
  patterns: [split provenance contract, narrow installer regression, installer-regenerated runtime mirror]
key_files:
  created: []
  modified:
    - commands/gsd/signal.md
    - tests/unit/install.test.js
    - .codex/skills/gsdr-signal/SKILL.md
decisions:
  - "Keep the quick task narrow: only the manual gsdr-signal provenance surface and its Codex install path changed"
  - "Use the real commands/gsd/signal.md source as the conversion regression input instead of snapshotting generated output"
  - "Regenerate the repo-local Codex skill via node bin/install.js --codex --local and force-stage only the owned SKILL.md artifact"
metrics:
  duration: 11min
  completed: 2026-04-19
---

# Quick Task 260419-6uf: Manual gsdr-signal split provenance

Aligned the manual `gsdr-signal` source command and the repo-local Codex skill to the Phase 57.8 split-provenance contract without reopening the broader signal pipeline.

## Task Commits
1. **Task 1: Rewrite the source manual-signal contract** - `8219bf65`
2. **Task 2: Add the Codex skill conversion regression** - `f3179e0e`
3. **Task 3: Regenerate the repo-local Codex skill via installer** - `ddcf1232`

## What Changed

- `commands/gsd/signal.md` now teaches `provenance_schema: v2_split`, `about_work: []`, separate `detected_by` / `written_by` signature objects, `not_available` fallback rules, and deprecated flat `runtime` / `model` / `gsd_version` fields as compatibility echoes only.
- `tests/unit/install.test.js` now includes a focused `gsdr-signal split provenance` test for `convertClaudeToCodexSkill` using the real source command as input.
- `node bin/install.js --codex --local` regenerated `.codex/skills/gsdr-signal/SKILL.md` from source, and the installed skill now carries the same split-provenance instructions as the source command.

## Verification

- `rg -n "provenance_schema|about_work|detected_by|written_by|compatibility echo|legacy" commands/gsd/signal.md`
  - Matched the split-provenance contract in the source command.
- `rg -n "runtime: \\{detected\\}|model: \\{detected\\}|gsd_version: \\{detected\\}" commands/gsd/signal.md`
  - Returned no matches.
- `npx vitest run tests/unit/install.test.js -t "gsdr-signal split provenance"`
  - Passed: `1` test, `0` failures.
- `node bin/install.js --codex --local`
  - Succeeded and regenerated the repo-local Codex skill tree.
- `rg -n "provenance_schema|about_work|detected_by|written_by" .codex/skills/gsdr-signal/SKILL.md`
  - Matched the split-provenance fields in the generated skill.
- `rg -n "runtime: \\{detected\\}|model: \\{detected\\}|gsd_version: \\{detected\\}" .codex/skills/gsdr-signal/SKILL.md`
  - Returned no matches.

## Deviations

- `.planning/STATE.md` was left untouched here. The prompt marked it as parent-owned postlude state, and the worktree already contained unrelated edits in that file.
- The repo-local Codex output lives under ignored `.codex/` paths. Task 3 force-staged only `.codex/skills/gsdr-signal/SKILL.md` after installer regeneration so the task commit stayed inside the ownership boundary.

## Parent Postlude Notes

- The quick-task row for `260419-6uf` can truthfully cite commit `ddcf1232` as the latest task commit.
- No `ROADMAP.md` changes were made.
