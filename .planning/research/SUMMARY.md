# Project Research Summary

**Project:** Multi-Runtime CLI Interop (Codex CLI, Shared KB, Cross-Runtime Continuity)
**Domain:** CLI tool interoperability for AI coding agents
**Researched:** 2026-02-11
**Confidence:** HIGH

## Executive Summary

This project extends GSD Reflect to support OpenAI Codex CLI as a 4th runtime, migrates the knowledge base from `~/.claude/gsd-knowledge/` to a shared `~/.gsd/knowledge/` location, and enables seamless cross-runtime session handoff. The core architectural challenge is that GSD was designed with Claude Code as the canonical runtime, embedding Claude-specific paths and patterns throughout 313+ path references across 82+ files. Adding Codex CLI reveals fundamental architectural gaps: the runtime abstraction layer conflates commands and agents, the KB path is runtime-bound instead of shared, and state files leak runtime-specific details that break cross-runtime handoff.

The recommended approach is to build the foundation first: create a two-path replacement system in the installer (runtime-specific vs shared paths), migrate KB to `~/.gsd/knowledge/` with symlink backward compatibility, and establish a capability matrix to handle runtime differences gracefully. Codex CLI integration follows as the first consumer of this new architecture, using Skills (not slash commands) and AGENTS.md (not agent specs). The most critical risk is the 313-path pandemic: a naive find-and-replace will break KB references for non-Claude runtimes. The mitigation is to separate KB paths (`~/.gsd/knowledge/`) from runtime config paths during the installer transformation phase.

Cross-runtime handoff already works in principle (`.planning/` is git-committed and runtime-agnostic), but needs three fixes: KB must be accessible from all runtimes, state files must use semantic content (not runtime-specific commands), and each runtime must have working GSD commands installed. The good news: the hardest problems (state management, git-based handoff) are already solved. The remaining work is plumbing: path abstraction, format conversion, and capability-aware degradation.

## Key Findings

### Recommended Stack

**No new dependencies needed.** The entire integration uses Node.js built-ins (`fs`, `path`, `os`) and extends the existing installer architecture. Core technologies remain unchanged: Node.js >=16.7.0, JavaScript (CommonJS ES2020), Markdown with YAML frontmatter, esbuild for hook bundling.

**Core technologies:**
- **Node.js built-ins** — all file operations, path resolution, KB migration use `fs`, `path`, `os` modules. Maintains zero-dependency philosophy.
- **Markdown + YAML frontmatter** — commands, agents, KB entries all use this format. Codex Skills use the same pattern (SKILL.md).
- **`~/.gsd/` directory** — new runtime-agnostic home for shared resources (KB, cache). Not under any runtime's config directory.
- **Two-path replacement system** — installer distinguishes `RUNTIME_DIR` (runtime-specific config) from `SHARED_DIR` (`~/.gsd/`). Critical for KB path migration.

**Codex CLI integration surface:**
- **Config directory:** `~/.codex/` (overridable via `CODEX_HOME`)
- **Config format:** TOML (`config.toml`) not JSON
- **Commands:** Skills in `~/.codex/skills/gsd-*/SKILL.md` (not slash commands)
- **Invocation:** `$gsd-command` (skill mention) or implicit matching, not `/gsd:command`
- **Instructions:** `AGENTS.md` (32KB limit) not separate agent files
- **No hooks:** No SessionStart equivalent, no statusline, no auto-update checks

### Expected Features

**Must have (table stakes):**
- **Codex CLI command installation** — `npx get-shit-done-reflect-cc --codex` installs GSD commands to Codex. Without this, Codex support is vaporware.
- **Shared knowledge base** — KB at `~/.gsd/knowledge/` accessible from all runtimes. Without this, cross-runtime workflows have no memory.
- **Cross-runtime session handoff** — Pause in Claude Code, resume in Codex CLI. The killer feature that no other tool provides.
- **Runtime-agnostic `.planning/` state** — Already works. STATE.md, ROADMAP.md, config.json contain no runtime-specific paths or commands.
- **Tool name mapping** — Agent/workflow files reference correct tool names per runtime (Read vs read_file vs file_read).

**Should have (competitive advantage):**
- **Runtime provenance tracking** — `runtime:` field in KB entries shows which runtime produced each signal/lesson. Enables debugging and trust calibration.
- **AGENTS.md generation** — Auto-generate `.codex/AGENTS.md` from project context (PROJECT.md, ROADMAP.md) so Codex understands the project without manual setup.
- **Capability-aware degradation** — Commands detect missing capabilities (Task tool, hooks) and degrade gracefully (sequential instead of parallel).
- **Migration with symlink bridge** — Copy KB to new location, symlink old location for backward compatibility. Zero-downtime migration.

**Defer (v2+):**
- **Codex Skills with scripts** — Package complex GSD workflows as Skills with executable `scripts/` and `references/`. Requires deep Skills understanding.
- **Full orchestrated execution in Codex** — Wave-based parallel execution via Task tool. Codex has no Task equivalent; sequential execution is acceptable for v1.
- **Real-time session sync** — Impossibly complex, marginal benefit. Explicit pause/resume is 30 seconds overhead with 100% reliability.
- **Unified conversation history** — Conversation formats are runtime-internal and incompatible. Track work at `.planning/` level instead.

### Architecture Approach

The current architecture uses a transformation pipeline in `bin/install.js` that converts Claude Code-native markdown commands/agents into runtime-specific formats at install time. This works for 3 runtimes (Claude, OpenCode, Gemini) because they share a common pattern: slash commands are markdown files in a config directory. Codex CLI breaks this pattern: commands are Skills (directories with SKILL.md), instructions are AGENTS.md (read at session start, not on-demand), and there is no slash command mechanism.

**The fix is a two-layer architecture:**
1. **Runtime abstraction layer** — capability matrix declares what each runtime supports (Task tool, hooks, tool permissions). Commands use feature detection (`has_capability('task_tool')`) not runtime detection (`if runtime == 'codex'`).
2. **Shared resource layer** — `~/.gsd/knowledge/` and `~/.gsd/cache/` live outside any runtime's directory. Installer creates these once, all runtimes reference them without path transformation.

**Major components:**
1. **Installer (`bin/install.js`)** — extended with Codex runtime support, two-path replacement system, KB migration logic, capability matrix configuration.
2. **`~/.gsd/` directory** — NEW shared home for KB (`knowledge/`), cache (`cache/`), optional cross-runtime config (`config.toml`).
3. **Runtime adapters** — per-runtime conversion functions: `convertClaudeToOpencodeFrontmatter()`, `convertClaudeToGeminiToml()`, NEW `convertClaudeToCodexSkill()`.
4. **State files (`.planning/`)** — already runtime-agnostic. Minor enhancement: add optional `runtime:` field to `.continue-here.md` for cross-runtime handoff provenance.
5. **KB paths (313 references)** — change from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/` in source files. Installer does NOT transform these (they are already shared).

### Critical Pitfalls

1. **The 313 Hardcoded Path Pandemic** — 313 references to `~/.claude/` across 82+ files. Installer's single regex replacement (`~/.claude/` -> runtime path) cannot distinguish between KB paths (should become `~/.gsd/knowledge/`) and runtime config paths (should become `~/.codex/`). Attempting naive KB migration will break KB references for all non-Claude runtimes because the installer blindly replaces ALL `~/.claude/` paths. **Prevention:** Introduce two-path replacement system. Change source files to use `~/.gsd/knowledge/` for KB (not caught by installer regex). Use `~/.claude/get-shit-done/` for runtime config (transformed per runtime). Validate with: `grep -r 'gsd-knowledge' ~/.codex/` must show `~/.gsd/knowledge/` not `~/.codex/gsd-knowledge/`.

2. **The KB Migration Data Loss Window** — Race conditions during migration: agents writing signals while files are being moved, index corruption from partial scans, no rollback path for users who downgrade. **Prevention:** Use copy-then-symlink, never move-then-pray. Copy all files to `~/.gsd/knowledge/`, verify integrity (file count + checksum), create symlink at `~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/`, rebuild index from scratch. The symlink provides backward compatibility and zero-downtime migration. Write `~/.gsd/knowledge/.migrating` lock file during migration; agents wait if present.

3. **The Codex CLI Impedance Mismatch** — Codex CLI has a fundamentally different architecture: Skills (not slash commands), AGENTS.md (not agent specs), sandbox policy (not tool permissions), no Task tool (no subagent spawning). Attempting to convert GSD commands 1:1 to Codex format will fail. **Prevention:** Accept that Codex support is 60-70% feature coverage initially. Use Skills for commands, consolidate agent specs into AGENTS.md, skip hook registration (Codex has no hooks), design sequential workflows for operations that require Task tool in Claude. Document capability gaps clearly: "In Codex CLI, wave-based parallel execution runs sequentially. This is slower but produces identical results."

4. **The State File Runtime Leakage** — `.planning/` state files (`.continue-here.md`, `STATE.md`, `PLAN.md`) contain runtime-specific content: paths like `~/.claude/get-shit-done/bin/gsd-tools.js`, commands like `/gsd:execute-phase 3`, tool names like `Read`/`Write`. Cross-runtime handoff breaks when resuming runtime encounters instructions it cannot follow. **Prevention:** Audit all writes to `.planning/` for runtime-specific content. Store semantic state ("resume phase 3, task 4") not procedural commands ("/gsd:execute-phase 3"). Let the resume workflow translate to current runtime's syntax. Use `runtime:` field in `.continue-here.md` for provenance, not execution.

5. **The Capability Gap Denial** — Pretending all runtimes are equivalent causes silent failures. Task tool (subagent spawning) exists in Claude/OpenCode, not in Codex. Named tool permissions (`allowed-tools:`) exist in Claude/OpenCode/Gemini, not in Codex. Session hooks exist in Claude/Gemini, not in OpenCode/Codex. **Prevention:** Create runtime capability matrix as first-class artifact. Every feature declares which capabilities it requires. Use feature detection (`has_capability('task_tool')`) not runtime detection. Design for graceful degradation: sequential execution if Task unavailable, skip hooks if not supported. Document degraded behavior per runtime.

## Implications for Roadmap

Based on research, this project decomposes into a 5-phase roadmap with clear dependency ordering:

### Phase 1: Path Abstraction & Runtime Capability Matrix (Foundation)
**Rationale:** Everything else depends on paths resolving correctly and capabilities being explicitly declared. This is the foundation that unlocks all subsequent work.

**Delivers:**
- Two-path replacement system in installer (RUNTIME_DIR vs SHARED_DIR)
- Runtime capability matrix (declares Task tool, hooks, tool permissions per runtime)
- Source files updated: `~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/` (276 references across 62 files)
- State file audit: remove runtime-specific paths/commands from `.planning/` files

**Addresses:**
- Pitfall 1 (313 path pandemic) — separation of KB paths from runtime paths
- Pitfall 4 (state file leakage) — normalization of .planning/ content
- Pitfall 5 (capability denial) — explicit capability model

**Avoids:** Cascading breakage where every subsequent phase discovers new path problems

**Research flag:** Standard patterns (installer architecture already exists, extending not rebuilding)

### Phase 2: KB Migration to ~/.gsd/knowledge/ (Shared Resource Foundation)
**Rationale:** Must happen after path abstraction (Phase 1) but before Codex integration (Phase 3). Codex needs to find KB at the shared path from day one.

**Delivers:**
- `~/.gsd/` directory structure: knowledge/, cache/, optional config.toml
- Migration logic in installer: copy `~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/`
- Symlink bridge: `~/.claude/gsd-knowledge/` -> `~/.gsd/knowledge/` for backward compatibility
- Lock file mechanism: `~/.gsd/knowledge/.migrating` prevents concurrent access during migration
- Index rebuild: `index.md` generated from new location

**Addresses:**
- Pitfall 2 (migration data loss) — copy-then-symlink eliminates rollback problem
- Table stakes: shared knowledge base across runtimes

**Avoids:** Attempting Codex integration before KB is accessible to all runtimes

**Research flag:** Standard patterns (file migration, symlink, index rebuild are well-documented)

### Phase 3: Codex CLI Runtime Support (New Runtime Integration)
**Rationale:** Must happen after path abstraction (Phase 1) and KB migration (Phase 2). Codex is the first consumer of the new shared path model and the capability matrix.

**Delivers:**
- `codex` runtime option in installer
- `convertClaudeToCodexSkill()` conversion function (commands -> Skills)
- AGENTS.md generation from agent specs
- `~/.codex/get-shit-done/` reference docs installation
- Tool name mapping for Codex (if needed — likely similar to Claude)
- Graceful degradation for missing capabilities (no Task tool, no hooks)

**Addresses:**
- Pitfall 3 (Codex impedance mismatch) — Skills + AGENTS.md, not slash commands
- Table stakes: Codex CLI command installation
- Differentiator: AGENTS.md generation

**Avoids:** Attempting 1:1 feature parity; accepts 60-70% coverage initially

**Research flag:** NEEDS RESEARCH — Codex Skills are documented but GSD's conversion logic is novel. May need research-phase for AGENTS.md consolidation strategy and skill directory structure.

### Phase 4: Cross-Runtime State Audit & Handoff (Continuity)
**Rationale:** Must happen after Codex integration (Phase 3) exists. Need a 4th runtime to test actual cross-runtime handoff. State normalization from Phase 1 provides foundation.

**Delivers:**
- Verified: `.planning/` has no runtime-specific paths (audit from Phase 1)
- `runtime:` field in `.continue-here.md` template (optional, for provenance)
- Runtime detection utility (detectRuntime() in gsd-tools.js)
- Updated pause-work/resume-work workflows to handle cross-runtime scenarios
- End-to-end test: pause in Claude Code, resume in Codex CLI

**Addresses:**
- Pitfall 4 (state file leakage) — verification that state is truly runtime-agnostic
- Table stakes: cross-runtime session handoff
- Differentiator: seamless pause/resume across runtimes

**Avoids:** Assuming handoff works without testing; edge cases reveal themselves in cross-runtime scenarios

**Research flag:** Standard patterns (state management already proven, just extending)

### Phase 5: Existing Runtime Regression Testing & Polish (Validation)
**Rationale:** Must happen after all architectural changes (Phases 1-3) to catch regressions. Integration testing phase.

**Delivers:**
- Verified: OpenCode installation works correctly with new path system
- Verified: Gemini CLI installation works correctly with new path system
- Verified: `--all` flag installs all 4 runtimes with correct format conversion
- Verified: KB accessible from all runtimes (read/write/index rebuild)
- End-to-end: create project in Claude, add signals, resume in Codex, KB intact
- Documentation updates: README, CHANGELOG, capability matrix docs
- Version bump to v1.14.0

**Addresses:**
- Ensure no regressions from multi-phase changes
- Validate entire cross-runtime workflow end-to-end

**Avoids:** Shipping broken OpenCode/Gemini support due to installer changes

**Research flag:** Standard patterns (regression testing, no new research needed)

### Phase Ordering Rationale

**Why this order:**
1. **Path abstraction first** — unblocks everything. KB migration depends on correct path separation. Codex integration depends on paths resolving correctly. Handoff depends on runtime-agnostic state.
2. **KB migration second** — creates the shared resource layer. Codex needs KB at shared path from day one. Handoff needs KB accessible to all runtimes.
3. **Codex integration third** — first consumer of new architecture. Validates that shared paths work, capability matrix works, format conversion works.
4. **Handoff fourth** — requires Codex to exist for testing. State normalization from Phase 1 + KB from Phase 2 + Codex commands from Phase 3 = complete handoff.
5. **Regression testing last** — validates entire system after all changes. Catches interaction bugs between phases.

**Why this grouping:**
- **Foundation phases (1-2):** Path abstraction + KB migration. These change the installer and source files but do not add new runtime support.
- **Integration phase (3):** Codex CLI support. Consumes the foundation, validates the architecture.
- **Validation phases (4-5):** Handoff + regression testing. Verify the complete system works end-to-end.

**How this avoids pitfalls:**
- **Pitfall 1 (313 paths)** — addressed in Phase 1, before any migration or new runtime
- **Pitfall 2 (migration loss)** — addressed in Phase 2, with symlink safety net
- **Pitfall 3 (Codex mismatch)** — addressed in Phase 3, with acceptance of capability gaps
- **Pitfall 4 (state leakage)** — addressed in Phase 1 (normalization) and Phase 4 (verification)
- **Pitfall 5 (capability denial)** — addressed in Phase 1 (capability matrix) and enforced in Phase 3 (Codex degradation)

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 3 (Codex CLI integration)** — Skills directory structure, AGENTS.md consolidation strategy, exact tool name mapping (if different from Claude), handling 32KB AGENTS.md limit. Codex Skills are documented but GSD's specific conversion approach is novel.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Path abstraction)** — Installer transformation pipeline already exists, extending not rebuilding. Path replacement is well-understood Node.js filesystem operations.
- **Phase 2 (KB migration)** — File copying, symlink creation, index rebuild are standard operations. No novel patterns.
- **Phase 4 (Handoff)** — `.planning/` state management already proven. Adding `runtime:` field is incremental.
- **Phase 5 (Regression testing)** — Testing methodology is established. Smoke tests, integration tests, manual verification.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new dependencies. All Node.js built-ins. Codex CLI config/Skills format verified via official docs (developers.openai.com/codex). |
| Features | HIGH | Table stakes features clearly defined (shared KB, Codex installation, handoff). Differentiators validated against competitor landscape (Aider, Continue.dev have no cross-runtime support). Anti-features identified from complexity analysis. |
| Architecture | HIGH | Direct codebase analysis of 313 path references, installer transformation pipeline (1765 lines), existing 3-runtime support. Codex integration patterns verified via official documentation (Skills, AGENTS.md, config.toml). |
| Pitfalls | HIGH | Grounded in actual codebase analysis. 313 hardcoded paths counted via grep. Migration risks identified from Node.js filesystem behavior. Codex impedance mismatch verified via capability comparison table. |

**Overall confidence:** HIGH

Research is grounded in three high-confidence sources:
1. Direct codebase analysis of get-shit-done-reflect repository
2. Official Codex CLI documentation (developers.openai.com/codex)
3. Existing multi-runtime implementation patterns (Claude/OpenCode/Gemini)

The architecture is an extension of proven patterns, not a greenfield design. The hardest problems (state management, git-based handoff) are already solved. The remaining work is plumbing: path abstraction, format conversion, capability-aware degradation.

### Gaps to Address

**Minor gaps (address during planning/execution):**
- **Exact Codex tool names** — Documentation does not specify tool names (Read, Write, Bash equivalents). Confidence: MEDIUM. Likely similar to Claude Code based on architecture. Verify during Phase 3 implementation via runtime inspection.
- **Runtime detection via environment variables** — Each runtime sets different env vars. Confidence: LOW. Best approach: path-based detection (which config directory loaded the commands). Alternative: prompt user if ambiguous. Address during Phase 4.
- **AGENTS.md 32KB limit handling** — How to consolidate 12+ GSD agents into 32KB. Confidence: MEDIUM. Options: (a) summary-only AGENTS.md with Skills for details, (b) progressive disclosure via Skills, (c) project-level AGENTS.md + global Skills. Choose during Phase 3 planning.
- **Codex subagent spawning** — Codex has Skills (can invoke other skills) but no Task tool (isolated context window). Confidence: MEDIUM. Approach: sequential execution for Task-dependent workflows, document degraded behavior. Phase 3.

**No critical blockers.** All gaps have clear mitigation paths. Research provides sufficient foundation for roadmap creation.

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `bin/install.js` (1765 lines), all commands/agents/workflows (313 path references), `.planning/` state files (runtime-agnostic verification)
- [Codex CLI Documentation](https://developers.openai.com/codex/cli/) — official reference for CLI commands, config format
- [Codex Config Reference](https://developers.openai.com/codex/config-reference/) — complete TOML schema, all settings
- [Codex Skills Documentation](https://developers.openai.com/codex/skills) — SKILL.md format, directory structure, progressive disclosure
- [Codex AGENTS.md Guide](https://developers.openai.com/codex/guides/agents-md/) — discovery order, layering, 32KB limit
- [Codex Slash Commands](https://developers.openai.com/codex/cli/slash-commands/) — built-in commands, no custom command support
- [Codex Custom Prompts](https://developers.openai.com/codex/custom-prompts/) — deprecated in favor of Skills (relevant for understanding evolution)

### Secondary (MEDIUM confidence)
- [AGENTS.md Standard](https://agents.md/) — open format specification, cross-tool compatibility, Linux Foundation governance
- [Claude Code AGENTS.md Support Request](https://github.com/anthropics/claude-code/issues/6235) — 2,520+ upvotes, shows demand for cross-tool standards
- [5 Key Trends Shaping Agentic Development in 2026](https://thenewstack.io/5-key-trends-shaping-agentic-development-in-2026/) — MCP as standard connector layer, relevance to cross-runtime interop
- [Node.js File System in Practice](https://thelinuxcode.com/nodejs-file-system-in-practice-a-production-grade-guide-for-2026/) — atomic operations, advisory locking, migration patterns

### Tertiary (LOW confidence)
- Community config examples — Codex settings from GitHub repos (validation needed during implementation)
- Runtime detection heuristics — environment variables per runtime (needs verification)

---
*Research completed: 2026-02-11*
*Ready for roadmap: yes*
