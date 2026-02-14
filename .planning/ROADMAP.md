# Roadmap: GSD Reflect

## Milestones

- <details><summary>v1.12 GSD Reflect (Phases 0-6) -- SHIPPED 2026-02-09</summary>See milestones/v1.12-ROADMAP.md</details>
- <details><summary>v1.13 Upstream Sync & Validation (Phases 7-12) -- SHIPPED 2026-02-11</summary>See milestones/v1.13-ROADMAP.md</details>
- **v1.14 Multi-Runtime Interop** - Phases 13-21 (gap closure in progress)

## v1.14 Multi-Runtime Interop

**Milestone Goal:** Make GSD a truly runtime-agnostic system where users can seamlessly switch between Claude Code, OpenAI Codex CLI, and other supported runtimes mid-work, with shared project state and knowledge base.

### Phases

**Phase Numbering:**
- Integer phases (13, 14, 15...): Planned milestone work
- Decimal phases (13.1, 13.2): Urgent insertions (marked with INSERTED)

- [x] **Phase 13: Path Abstraction & Capability Matrix** - Separate runtime-specific from shared paths; declare per-runtime capabilities ✓ 2026-02-11
- [x] **Phase 14: Knowledge Base Migration** - Move KB to runtime-agnostic ~/.gsd/knowledge/ with backward compatibility ✓ 2026-02-11
- [x] **Phase 15: Codex CLI Integration** - Install GSD commands as Codex Skills with AGENTS.md generation ✓ 2026-02-11
- [x] **Phase 16: Cross-Runtime Handoff & Signal Enrichment** - Pause/resume across runtimes; enrich signals with runtime provenance ✓ 2026-02-11
- [x] **Phase 17: Validation & Release** - Verify all runtimes work end-to-end after all changes ✓ 2026-02-11
- [x] **Phase 18: Capability Matrix & Installer Corrections** - Update stale matrix cells; stop stripping MCP/tool_permissions for capable runtimes ✓ 2026-02-14
- [ ] **Phase 19: KB Infrastructure & Data Safety** - Relocate KB scripts, add backup/recovery, add provenance fields to templates
- [ ] **Phase 20: Runtime Portability** - Make agent specs accessible in non-Claude runtimes; add Gemini/Codex format converters
- [ ] **Phase 21: Workflow Refinements** - Reduce signal workflow context bloat; add spike feasibility gate

### Phase Details

#### Phase 13: Path Abstraction & Capability Matrix
**Goal**: Users (and the installer) can distinguish between runtime-specific configuration paths and shared resource paths, with explicit capability declarations per runtime
**Depends on**: Nothing (first phase of v1.14)
**Requirements**: ABST-01, ABST-02, ABST-03, ABST-04
**Success Criteria** (what must be TRUE):
  1. Installer categorizes all 313+ `~/.claude/` path references into runtime-specific vs shared buckets, and the two-path replacement system transforms them correctly per runtime
  2. A runtime capability matrix artifact exists that declares per-runtime tool availability (Task tool, hooks, tool permissions) for all 4 runtimes
  3. Agent specs and workflows use feature detection patterns (`has_capability(...)`) rather than runtime name checks
  4. Each runtime has documented degraded behavior (what runs sequentially instead of parallel, what features are unavailable)
**Plans**: 2 plans

Plans:
- [x] 13-01-PLAN.md -- Two-pass installer path replacement (ABST-01) ✓
- [x] 13-02-PLAN.md -- Capability matrix & feature detection in workflows (ABST-02, ABST-03, ABST-04) ✓

#### Phase 14: Knowledge Base Migration
**Goal**: The knowledge base lives at a runtime-agnostic location accessible to all runtimes, with zero data loss and backward compatibility for existing installations
**Depends on**: Phase 13 (path abstraction must separate KB paths from runtime paths)
**Requirements**: KB-01, KB-02, KB-03, KB-04, KB-05, KB-06
**Success Criteria** (what must be TRUE):
  1. Knowledge base files exist at `~/.gsd/knowledge/` with signals/, spikes/, lessons/ subdirectories and are fully functional (read, write, index rebuild)
  2. Running the installer on a machine with existing `~/.claude/gsd-knowledge/` data automatically migrates all content to `~/.gsd/knowledge/` with zero data loss
  3. A symlink at `~/.claude/gsd-knowledge/` points to `~/.gsd/knowledge/`, so any tool referencing the old path still works
  4. Setting `GSD_HOME=/custom/path` causes the KB to reside at `/custom/path/knowledge/` instead of `~/.gsd/knowledge/`
  5. All 20+ workflow, reference, and agent files reference `~/.gsd/knowledge/` (no remaining `~/.claude/gsd-knowledge/` references in source)
**Plans**: 2 plans

Plans:
- [x] 14-01-PLAN.md -- Update all source file KB path references to ~/.gsd/knowledge/ (KB-06) ✓
- [x] 14-02-PLAN.md -- Add installer migration logic, symlink bridge, and GSD_HOME support (KB-01, KB-02, KB-03, KB-04, KB-05) ✓

#### Phase 15: Codex CLI Integration
**Goal**: Users can install GSD into Codex CLI and use GSD commands (as Skills) to run projects, with graceful degradation for missing capabilities
**Depends on**: Phase 14 (KB must be at shared path so Codex can access it)
**Requirements**: CODEX-01, CODEX-02, CODEX-03, CODEX-04, CODEX-05, CODEX-06, CODEX-07
**Success Criteria** (what must be TRUE):
  1. Running `npx get-shit-done-reflect-cc --codex` installs GSD commands as Codex Skills in `~/.codex/skills/` directory (SKILL.md format)
  2. Installer generates `~/.codex/AGENTS.md` with GSD workflow instructions that Codex reads at session start
  3. Reference docs are installed to `~/.codex/get-shit-done/` with all `~/.claude/` paths converted to `~/.codex/`
  4. Running `npx get-shit-done-reflect-cc --all` successfully installs GSD to all 4 runtimes (Claude Code, OpenCode, Gemini CLI, Codex CLI)
  5. Codex capability limitations are documented and the system degrades gracefully (no Task tool, no hooks, no tool restrictions)
**Plans**: 2 plans

Plans:
- [x] 15-01-PLAN.md -- Codex adapter functions + installer integration (CODEX-01, CODEX-02, CODEX-03, CODEX-04, CODEX-05, CODEX-06, CODEX-07) ✓
- [x] 15-02-PLAN.md -- Codex installation tests (unit + integration) ✓

#### Phase 16: Cross-Runtime Handoff & Signal Enrichment
**Goal**: Users can pause work in one runtime and resume in another with full state restoration, and signals capture runtime provenance for cross-runtime debugging
**Depends on**: Phase 15 (need Codex installed to test real cross-runtime handoff)
**Requirements**: HAND-01, HAND-02, HAND-03, HAND-04, SIG-01, SIG-02, SIG-03, SIG-04
**Success Criteria** (what must be TRUE):
  1. User can `/gsd:pause-work` in Claude Code and resume in Codex CLI (or any other runtime) with full state restoration -- phase, task, and decisions are all intact
  2. `.continue-here.md` contains semantic state (phase, task, decisions) not runtime-specific procedural commands
  3. Resume workflow detects which runtime it is running in and renders runtime-appropriate command instructions
  4. STATE.md and all `.planning/` files contain zero runtime-specific hardcoded paths or commands
  5. Signal entries include `runtime:` and `model:` fields, and capability gap events are automatically logged as signals
**Plans**: 2 plans

Plans:
- [x] 16-01-PLAN.md -- Runtime-agnostic pause/resume handoff (HAND-01, HAND-02, HAND-03, HAND-04) ✓
- [x] 16-02-PLAN.md -- Signal enrichment with runtime provenance and capability-gap type (SIG-01, SIG-02, SIG-03, SIG-04) ✓

#### Phase 17: Validation & Release
**Goal**: All 4 runtimes work correctly after the full set of v1.14 changes, with end-to-end cross-runtime workflow verified
**Depends on**: Phase 16 (all changes must be complete before regression testing)
**Requirements**: VALID-01, VALID-02, VALID-03, VALID-04
**Success Criteria** (what must be TRUE):
  1. OpenCode installation completes successfully and GSD commands work with the new path system
  2. Gemini CLI installation completes successfully and GSD commands work with the new path system
  3. `--all` multi-runtime install (4 runtimes) completes without errors and each runtime has correct format-converted files
  4. KB is accessible and writable from all 4 installed runtimes (create signal in one runtime, read it in another)
**Plans**: 2 plans

Plans:
- [x] 17-01-PLAN.md -- Per-runtime deep validation tests for OpenCode and Gemini + multi-runtime --all content verification (VALID-01, VALID-02, VALID-03) ✓
- [x] 17-02-PLAN.md -- Cross-runtime KB accessibility tests + release readiness validation (VALID-04) ✓

#### Phase 18: Capability Matrix & Installer Corrections
**Goal**: The capability matrix accurately reflects current runtime capabilities, and the installer preserves MCP and tool_permissions content for runtimes that support them
**Depends on**: Phase 17 (builds on validated installer from v1.14 initial work)
**Gap Closure**: Gaps 1-4 from post-v1.14 analysis
**Success Criteria** (what must be TRUE):
  1. capability-matrix.md has 4 corrected cells: Codex mcp_servers=Y, Gemini mcp_servers=Y, Gemini tool_permissions=Y, Gemini task_tool annotated as experimental/sequential
  2. Codex CLI installer preserves MCP tool references in converted files (was stripping them)
  3. Gemini CLI installer preserves MCP tool references in converted files (was stripping them)
  4. Gemini CLI installer preserves tool permission frontmatter in converted files (was stripping them)
**Plans**: 2 plans

Plans:
- [x] 18-01-PLAN.md -- Correct capability matrix document (4 stale cells + prose consistency) ✓
- [x] 18-02-PLAN.md -- Fix Gemini installer MCP tool stripping + add tests ✓

#### Phase 19: KB Infrastructure & Data Safety
**Goal**: KB management scripts are properly located, data loss has a safety net, and KB entries carry version provenance
**Depends on**: Phase 18 (independent, but sequential for focus)
**Gap Closure**: Gaps 5-6, 13-14 from post-v1.14 analysis
**Success Criteria** (what must be TRUE):
  1. KB management scripts (kb-rebuild-index.sh, kb-create-dirs.sh) exist at ~/.gsd/bin/ and are functional
  2. KB migration includes pre-migration backup and a recovery mechanism for data loss scenarios
  3. KB signal/spike/lesson entries include a `gsd_version` field
  4. Spike and lesson templates include provenance fields (runtime, model, gsd_version)
**Plans**: TBD (created during /gsd:plan-phase 19)

#### Phase 20: Runtime Portability
**Goal**: Agent spec content works in all runtimes, and the installer generates correct runtime-specific configurations for Gemini tool_permissions and Codex MCP
**Depends on**: Phase 18 (matrix corrections inform format conversion logic)
**Gap Closure**: Gaps 7-9 from post-v1.14 analysis
**Success Criteria** (what must be TRUE):
  1. Agent spec content (tool restrictions, execution context) is accessible and functional in non-Claude runtimes
  2. Gemini CLI installer maps GSD `allowed-tools` frontmatter to Gemini's `tools.core`/`tools.exclude` format
  3. Codex CLI installer generates TOML-format MCP server configuration when MCP references are present
**Plans**: TBD (created during /gsd:plan-phase 20)

#### Phase 21: Workflow Refinements
**Goal**: Signal workflow is lean, spike workflow has proper feasibility gates, reducing context bloat and preventing premature spiking
**Depends on**: Nothing (independent workflow improvements)
**Gap Closure**: Gaps 10-12 from post-v1.14 analysis
**Success Criteria** (what must be TRUE):
  1. /gsd:signal loads <200 lines of reference context (down from ~864)
  2. Spike DESIGN.md template includes a Prerequisites/Feasibility section
  3. /gsd:spike workflow includes a research-first advisory gate before spike execution
**Plans**: TBD (created during /gsd:plan-phase 21)

### Deferred (Monitor Only)

These depend on external runtime vendor changes. No phases needed — revisit when capabilities ship:
- Codex CLI hooks evolution — monitor next 30 days (PR #9691 hints at expanded hooks)
- Codex CLI subagents — "under active development", no ETA (issue #2604)
- Gemini CLI parallel subagents — issue #17749 open, 0/4 subtasks complete

### Progress

**Execution Order:**
Phases execute in numeric order: 13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21

| Phase | Plans Complete | Status | Completed |
|-------|---------------|--------|-----------|
| 13. Path Abstraction & Capability Matrix | 2/2 | ✓ Complete | 2026-02-11 |
| 14. Knowledge Base Migration | 2/2 | ✓ Complete | 2026-02-11 |
| 15. Codex CLI Integration | 2/2 | ✓ Complete | 2026-02-11 |
| 16. Cross-Runtime Handoff & Signal Enrichment | 2/2 | ✓ Complete | 2026-02-11 |
| 17. Validation & Release | 2/2 | ✓ Complete | 2026-02-11 |
| 18. Capability Matrix & Installer Corrections | 2/2 | ✓ Complete | 2026-02-14 |
| 19. KB Infrastructure & Data Safety | 0/? | Pending | — |
| 20. Runtime Portability | 0/? | Pending | — |
| 21. Workflow Refinements | 0/? | Pending | — |
