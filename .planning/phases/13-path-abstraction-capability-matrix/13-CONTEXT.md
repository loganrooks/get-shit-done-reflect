# Phase 13: Path Abstraction & Capability Matrix - Context

**Gathered:** 2026-02-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Separate all GSD path references into two categories (runtime-specific vs shared), fix the installer's path transformation to handle both correctly, and create a capability matrix declaring what each of the 4 runtimes can/can't do. Agents and workflows adopt feature detection patterns instead of runtime name checks.

Phase 14 handles the actual KB migration to `~/.gsd/knowledge/`. Phase 15 handles Codex CLI installation. This phase builds the abstraction layer they depend on.

</domain>

<decisions>
## Implementation Decisions

### Path Categorization

- All 313+ `~/.claude/` path references split into two buckets:
  - **Runtime-specific**: Paths to commands, agents, workflows, references, templates, bin tools — things that get installed per-runtime with path transformation (e.g., `~/.claude/get-shit-done/workflows/` becomes `~/.config/opencode/get-shit-done/workflows/`)
  - **Shared**: Knowledge base paths (`~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/`) and any future cross-runtime resources — accessible identically from all runtimes
- The installer's existing single regex (`/~\/\.claude\//g`) currently catches both categories, breaking KB access in non-Claude runtimes. Phase 13 fixes this with a two-pass replacement:
  1. First pass: Replace shared paths (KB references) with `~/.gsd/knowledge/` (the future-state path from Phase 14)
  2. Second pass: Replace remaining runtime-specific paths with the target runtime's path
- This ordering prevents shared paths from being incorrectly transformed to runtime-specific locations
- Planning docs (`.planning/`) are NOT transformed — they're project-local and stay as-is

### Capability Detection Model

- Static capability matrix as a **reference document** (`get-shit-done/references/capability-matrix.md`) that ships with installation
- Matrix declares per-runtime availability of key features at meaningful granularity:
  - `task_tool` — Can spawn subagent processes (Claude Code: yes, OpenCode: yes, Gemini: yes, Codex: no)
  - `hooks` — Pre/post tool execution hooks (Claude Code: yes, OpenCode: no, Gemini: yes, Codex: no)
  - `tool_permissions` — Granular tool allow/deny lists (Claude Code: yes, OpenCode: yes, Gemini: no, Codex: no)
  - `mcp_servers` — MCP server integration (Claude Code: yes, OpenCode: yes, Gemini: no, Codex: no)
  - `frontmatter_format` — Config format (Claude: YAML, OpenCode: YAML-variant, Gemini: TOML, Codex: SKILL.md)
  - `nested_commands` — Subdirectory command structure (Claude: yes, OpenCode: no/flat, Gemini: no/flat, Codex: no/skills)
- Matrix is human-readable markdown (users can understand what works where) with a structured format that workflows can reference
- Feature detection via textual `has_capability(feature)` patterns in workflow prose, NOT programmatic function calls — agents are markdown read by LLMs, not executable code

### Capability Checks Location

- Capability branching goes in **workflow orchestrators** (execute-phase, plan-phase, etc.), NOT in agent specs
- Agent specs stay clean and capability-agnostic — they describe WHAT to do, not WHETHER to do it
- Orchestrator workflows check capabilities and adjust their behavior:
  - If no `task_tool`: run agents sequentially instead of spawning parallel subagents
  - If no `hooks`: skip hook-dependent steps (pre-commit validation, etc.)
  - If no `tool_permissions`: skip permission setup, document manual setup needed
- The installer already handles format-level differences (YAML->TOML, tool name mapping) — capability checks handle behavioral differences at runtime

### Degraded Behavior Strategy

- **Inform once, then adapt silently** — First time a missing capability is hit in a session, workflows emit a brief note (e.g., "Note: Running sequentially — this runtime doesn't support parallel agents"). Subsequent occurrences adapt without comment.
- Each runtime's degraded behavior documented in the capability matrix reference doc:
  - **Codex CLI** (most constrained): No parallel agents (sequential execution), no hooks (skip hook-dependent features), no tool permissions (all tools available), no MCP (skip MCP-dependent features)
  - **Gemini CLI**: No tool permissions (document manual setup), no MCP servers (skip MCP features)
  - **OpenCode**: No hooks (skip hook-dependent features)
  - **Claude Code**: Full capability (no degradation)
- Degraded paths are functional, not error states — the system works correctly, just differently

### Installer Integration

- Extend `copyWithPathReplacement()` in `bin/install.js` with the two-pass replacement system
- Add capability matrix generation during install: the matrix reference doc is installed alongside other reference docs
- No new CLI flags needed for Phase 13 — the `--codex` flag comes in Phase 15
- Path categorization logic lives in the installer, not in a separate config file — the installer knows which paths are runtime-specific vs shared based on path patterns (anything matching `gsd-knowledge` is shared, everything else is runtime-specific)

### Claude's Discretion

- Exact regex patterns for the two-pass replacement (negative lookahead vs sequential replacement)
- Whether to create a path categorization manifest/enum or keep it as inline logic in the installer
- Internal structure of the capability matrix reference doc (table format, section organization)
- How to handle edge cases: paths in comments, paths in code examples within docs
- Test strategy for verifying path replacement correctness

</decisions>

<specifics>
## Specific Ideas

- The capability matrix should feel like a compatibility table (similar to "Can I Use" for web features) — quick to scan, clear yes/no per runtime
- The two-pass path replacement mirrors what the roadmap describes as a "two-path replacement system" — first shared paths, then runtime-specific
- Feature detection pattern `has_capability(...)` is a prose convention for LLM-read specs, not a programmatic API — workflows describe the check in natural language and the LLM executing them interprets it

</specifics>

<deferred>
## Deferred Ideas

- Actual KB file migration to `~/.gsd/knowledge/` — Phase 14
- Symlink from old KB path to new — Phase 14
- `GSD_HOME` env var override — Phase 14
- Codex Skills format conversion and `--codex` installer flag — Phase 15
- `AGENTS.md` generation for Codex — Phase 15
- Cross-runtime handoff (`/gsd:pause-work` -> resume in different runtime) — Phase 16
- Signal entries with `runtime:` and `model:` fields — Phase 16

</deferred>

## Open Questions

| Question | Why It Matters | Criticality | Status |
|----------|----------------|-------------|--------|
| Should KB path references be updated to `~/.gsd/knowledge/` now (Phase 13) or only during Phase 14 migration? | If updated now, non-Claude runtimes would look for KB at `~/.gsd/knowledge/` before it exists there. If deferred, the bug persists until Phase 14. | Medium | Pending — research should investigate whether a "both paths" approach is viable |
| Does OpenCode's XDG Base Directory compliance affect shared path resolution? | OpenCode uses `~/.config/opencode/` not `~/.opencode/`. If `GSD_HOME` is also XDG-compliant, it might need `~/.local/share/gsd/` instead of `~/.gsd/` | Low | Pending — Phase 14 concern but research can flag early |
| Are there workflow files that dynamically construct paths (string concatenation) vs static path references? | Dynamic paths can't be caught by simple regex replacement | Medium | Pending — research should audit path construction patterns |

---

*Phase: 13-path-abstraction-capability-matrix*
*Context gathered: 2026-02-11*
