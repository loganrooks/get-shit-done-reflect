---
phase: 15-codex-cli-integration
plan: 01
subsystem: installer
tags: [codex-cli, skills, agents-md, multi-runtime, installer]
requires:
  - phase: 13-path-abstraction-capability-matrix
    provides: "Centralized replacePathsInContent() two-pass function and require.main guard"
  - phase: 14-knowledge-base-migration
    provides: "Runtime-agnostic KB at ~/.gsd/knowledge/ with migrateKB() in installer loop"
provides:
  - "convertClaudeToCodexSkill() adapter for SKILL.md format conversion"
  - "copyCodexSkills() for directory-based skill installation"
  - "generateCodexAgentsMd() for AGENTS.md with capability gaps and codex exec docs"
  - "--codex flag in CLI with full install/uninstall paths"
  - "--all includes codex as 4th runtime"
  - "Interactive prompt with 5 options (4 runtimes + All)"
affects: [15-02-codex-testing, 16-continuity-handoff]
tech-stack:
  added: []
  patterns: [directory-per-skill, agents-md-section-markers, codex-tool-name-mapping]
key-files:
  created: []
  modified:
    - bin/install.js
key-decisions:
  - "Skills installed to ~/.codex/skills/ (not ~/.agents/skills/) for consistency with per-runtime config dir pattern"
  - "AGENTS.md uses distinctive markers: <!-- GSD:BEGIN (get-shit-done-reflect-cc) --> to avoid conflicts"
  - "Codex install skips agents dir, hooks, and settings.json (Codex has none of these)"
  - "Tool name mapping kept as static constant (easy to update, not breaking if slightly wrong)"
  - "getCommitAttribution('codex') returns undefined (no settings.json in Codex)"
patterns-established:
  - "Directory-per-skill: each GSD command becomes a directory with SKILL.md inside"
  - "AGENTS.md section management: marker comments for idempotent section replacement"
  - "Codex early return: install() returns immediately after manifest for Codex (no settings config)"
duration: 6min
completed: 2026-02-11
---

# Phase 15 Plan 01: Codex CLI Installer Integration Summary

**Codex adapter functions + full install/uninstall wiring with SKILL.md directories, AGENTS.md generation, and 5-option interactive prompt**

## Performance
- **Duration:** 6 minutes
- **Tasks:** 2/2
- **Files modified:** 1

## Accomplishments
- Added `claudeToCodexTools` constant mapping Claude tool names to Codex equivalents (read_file, apply_patch, shell, etc.)
- Added `convertClaudeToCodexSkill()` -- converts Claude command markdown to SKILL.md format (tool name replacement, /gsd: to $gsd- syntax, @ file reference conversion, frontmatter reduction to name+description)
- Added `copyCodexSkills()` -- copies GSD commands as Codex skill directories (gsd-help/SKILL.md, etc.) with path replacement, attribution, and conversion pipeline
- Added `generateCodexAgentsMd()` -- generates ~/.codex/AGENTS.md with command table, workflow conventions, capability limitations (no Task tool, no hooks, no tool restrictions), capability matrix reference, and codex exec non-interactive usage examples
- Wired `--codex` flag into CLI arg parsing; `--all` now includes 4 runtimes
- Added `getDirName('codex')` -> `.codex` and `getGlobalDir('codex')` with CODEX_CONFIG_DIR env var support
- Added Codex path in `install()`: creates skills, installs get-shit-done reference docs, generates AGENTS.md, skips agents/hooks/settings, writes manifest
- Added Codex path in `uninstall()`: removes gsd-* skill directories, removes GSD section from AGENTS.md, skips hooks/settings cleanup
- Updated interactive prompt: Codex as option 4, All as option 5
- Updated help text with --codex flag, "all 4 runtimes" description, and Codex install example
- All 46 existing tests pass (zero regressions)

## Task Commits
1. **Task 1: Add Codex adapter functions and tool name mapping** - `22f9a5b`
2. **Task 2: Wire Codex into installer CLI, install(), uninstall(), and interactive prompt** - `0792ce7`

## Files Created/Modified
- `bin/install.js` - Added claudeToCodexTools constant, 3 Codex adapter functions, --codex flag, getDirName/getGlobalDir/getCommitAttribution Codex cases, install() Codex path, uninstall() Codex path, updated interactive prompt and help text, updated module.exports

## Decisions & Deviations

### Decisions
- **Skills path:** Installed to `~/.codex/skills/` rather than `~/.agents/skills/` -- consistent with the established per-runtime config directory pattern used by Claude, OpenCode, and Gemini
- **AGENTS.md markers:** Used `<!-- GSD:BEGIN (get-shit-done-reflect-cc) -->` as distinctive markers to avoid conflicts with other tools that might use AGENTS.md
- **Tool name mapping as static constant:** claudeToCodexTools is easy to update if exact Codex tool names change (some names like list_dir and grep_files have MEDIUM confidence per research)
- **Codex early return in install():** Returns `{ settingsPath: null, settings: {}, statuslineCommand: null, runtime }` since Codex has no settings.json or hooks system

### Deviations
None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All Codex adapter functions are in place and exported for testing (Plan 02 will add comprehensive tests)
- The install/uninstall paths are wired but not yet integration-tested with a real `--codex --global` run
- Plan 02 can focus entirely on testing: unit tests for convertClaudeToCodexSkill, integration tests for --codex install/uninstall
