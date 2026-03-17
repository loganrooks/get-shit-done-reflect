---
phase: quick-26
plan: 01
model: claude-opus-4-6
context_used_pct: 22
subsystem: installer
tags: codex, toml, sandbox, config.toml, agent-registration
requires:
  - phase: quick-22
    provides: "convertClaudeToCodexAgentToml with TOML literal strings"
  - phase: quick-23
    provides: "extractFrontmatterAndBody/extractFrontmatterField shared helpers"
provides:
  - "CODEX_AGENT_SANDBOX constant mapping agent names to sandbox modes"
  - "GSD_CODEX_MARKER for marker-to-EOF config management"
  - "generateCodexConfigBlock for [agents.name] TOML registration"
  - "stripGsdFromCodexConfig for clean marker-to-EOF removal"
  - "mergeCodexConfig for idempotent config.toml create/update/append"
  - "sandbox_mode in convertClaudeToCodexAgentToml TOML output"
  - "Codex install path: agent metadata collection + config.toml registration"
  - "Codex uninstall path: dual-marker cleanup (agent + MCP)"
affects: [codex, installer, deployment-parity]
tech-stack:
  added: []
  patterns: ["marker-to-EOF config management (upstream parity)", "gsdr->gsd prefix mapping for sandbox lookup"]
key-files:
  created: []
  modified:
    - bin/install.js
    - tests/unit/install.test.js
key-decisions:
  - "Used em-dash in GSD_CODEX_MARKER matching upstream pattern, with reflect-specific suffix"
  - "Marker-to-EOF pattern for agent registration (distinct from BEGIN/END MCP markers)"
  - "gsdr- prefix stripping for CODEX_AGENT_SANDBOX lookup enables fork co-installation"
duration: 6min
completed: 2026-03-17
---

# Quick Task 26: Codex Deployment Parity Summary

**Per-agent sandbox modes in TOML, config.toml agent registration with marker-based idempotent management, and dual-marker clean uninstall**

## Performance
- **Duration:** 6min
- **Tasks:** 2/2 completed
- **Files modified:** 2

## Accomplishments
- Added CODEX_AGENT_SANDBOX constant mapping 11 agent names to workspace-write or read-only sandbox modes
- Updated convertClaudeToCodexAgentToml to accept agentName parameter and emit sandbox_mode between description and developer_instructions
- Added generateCodexConfigBlock producing TOML with GSD_CODEX_MARKER header and [agents.name] registration entries
- Added stripGsdFromCodexConfig removing marker-to-EOF content while preserving user config
- Added mergeCodexConfig handling create (new file), replace (existing marker), and append (no marker) scenarios
- Wired install path to collect agent metadata during TOML loop and register via mergeCodexConfig
- Wired uninstall path to clean both agent registration (marker-to-EOF) and MCP config (BEGIN/END) markers
- Added 16 new unit tests covering all new/modified functionality
- All 333 tests pass across full suite (183 in install.test.js, up from 167)

## Task Commits
1. **Task 1: Add CODEX_AGENT_SANDBOX, sandbox_mode to TOML, generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig + wiring** - `c63b916`
2. **Task 2: Add unit tests for all new Codex config functions** - `f3cddea`

## Files Created/Modified
- `bin/install.js` - Added CODEX_AGENT_SANDBOX, GSD_CODEX_MARKER constants; updated convertClaudeToCodexAgentToml with agentName+sandbox_mode; added generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig functions; wired install/uninstall paths; exported 5 new symbols
- `tests/unit/install.test.js` - Added 16 tests: 3 CODEX_AGENT_SANDBOX, 4 sandbox_mode in TOML, 3 generateCodexConfigBlock, 3 stripGsdFromCodexConfig, 3 mergeCodexConfig

## Decisions & Deviations
None - plan executed exactly as written.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
Codex deployment parity features complete. All agents now get correct sandbox permissions and are registered in config.toml with idempotent management. Ready for integration testing with actual Codex CLI or further upstream parity work.

## Self-Check: PASSED
