# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-11)

**Core value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.
**Current focus:** v1.14 gap closure — 4 phases (18-21) covering installer corrections, KB safety, runtime portability, workflow refinements

## Current Position

Phase: 21 of 21 — Workflow Refinements
Plan: 2 of 2 — 21-02 complete (Phase 21 complete)
Status: Phase 21 complete. v1.14 gap closure COMPLETE (all 4 phases: 18-21 done).
Last activity: 2026-02-15 -- Completed 21-02-PLAN.md (Spike workflow refinements)

Progress: v1.12 (25) + v1.13 (18) + v1.14-initial (10) + v1.14-gap (9) = 62 plans shipped | v1.14 gap closure: [██████████] 100% (Phases 18-21 done)

## Performance Metrics

**v1.12 Final:**
- Total plans completed: 25
- Average duration: 2.8min
- Total execution time: 70min

**v1.13 Final:**
- Total plans completed: 18
- Average duration: ~4.4min
- Total execution time: ~70min

**v1.14 Final:**
- Plans completed: 10
- Duration: 46min (6min + 8min + 8min + 3min + 6min + 2min + 3min + 4min + 3min + 3min)

**v1.14 Gap Closure:**
- Plans completed: 9
- Duration: 29min (3min + 3min + 4min + 4min + 4min + 2min + 2min + 3min + 2min + 2min)

## Accumulated Context

### Decisions

Full decision log in PROJECT.md Key Decisions table.
v1.13 decisions archived in milestones/v1.13-ROADMAP.md.

Recent decisions affecting current work:
- Runtime-agnostic KB at ~/.gsd/knowledge/ (source files migrated in 14-01; installer migration in 14-02; COMPLETE)
- OpenAI Codex CLI as 4th runtime: COMPLETE (installer in 15-01, tests in 15-02)
- Full continuity handoff across runtimes: COMPLETE (handoff in 16-01, signal enrichment in 16-02)
- Signal schema extended with runtime/model provenance fields (optional, backward compatible)
- capability-gap signal type for tracking degraded execution (trace severity, report-only)
- Two-pass path replacement: KB paths to ~/.gsd/knowledge/ (Pass 1), runtime-specific paths to target (Pass 2)
- require.main guard added to install.js for testability
- Static capability matrix as reference doc (not config file) at get-shit-done/references/capability-matrix.md
- Feature detection via has_capability() prose pattern in orchestrators only (agent specs stay clean)
- Inform once then adapt silently strategy for degraded runtime behavior
- Handoff files store semantic state only; command rendering is the resume workflow's responsibility
- Runtime detected via installed path prefix (no new infrastructure needed)
- Nested vitest meta-test impractical; release gate documented as code comment instead
- All 4 VALID requirements validated: VALID-01 (OpenCode), VALID-02 (Gemini), VALID-03 (--all depth), VALID-04 (cross-runtime KB)
- MCP tools preserved as-is in Gemini agent conversion (not mapped to Gemini built-in names)
- Capability matrix corrected: Gemini Y for mcp_servers/tool_permissions/task_tool[annotated], Codex Y for mcp_servers
- All 4 runtimes now support MCP servers; mcp_servers degraded section retained as informational
- KB scripts copied (not symlinked) to ~/.gsd/bin/ via installKBScripts() for runtime-agnostic access
- Pre-migration backup in migrateKB() with timestamped copy and integrity verification
- Provenance fields (runtime, model, gsd_version) promoted to common base schema for all KB entry types
- All provenance fields optional for backward compatibility; gsd_version from VERSION file with config.json fallback
- Gemini agent body text tool name replacement uses same word-boundary regex pattern as Codex converter
- Static gsdMcpServers mapping for Codex config.toml (no auto-discovery, no TOML parser dependency)
- No required=true in generated MCP TOML (avoid blocking Codex startup if server unavailable)
- Signal command consolidated: inline rules into command, remove @ imports of full reference docs (self-contained pattern)
- Signal workflow reduced to thin redirect (not deleted) for discoverability
- Prerequisites/Feasibility section in spike DESIGN.md between Type and Hypothesis (scientific protocol order)
- Research-first advisory gate is non-blocking -- users always proceed if they choose to
- Standalone /gsd:spike only gets advisory; orchestrator-triggered spikes already have research flow

### Pending Todos

None.

### Blockers/Concerns

- NPM_TOKEN config (pre-existing from v1.12, not blocking)
- Gitignore friction (pre-existing from v1.12, not blocking)
- v1.14 release ready: 155 tests passing across 7 test files, all 4 runtimes validated

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 001 | Update installer branding for GSD Reflect | 2026-02-09 | c82ce23 | [001-update-installer-branding-for-gsd-reflect](./quick/001-update-installer-branding-for-gsd-reflect/) |
| 002 | Fix 2 failing install.test.js tests (signal.md -> reflect.md) | 2026-02-15 | ac3f385 | [2-fix-the-2-failing-install-test-js-tests](./quick/2-fix-the-2-failing-install-test-js-tests/) |

### Roadmap Evolution

v1.12 complete (Phases 0-6). v1.13 complete (Phases 7-12). v1.14 initial complete (Phases 13-17). v1.14 gap closure complete (Phases 18-21). All planned phases shipped.

### Key Artifacts

- Tag `v1.12.2-pre-sync` -- immutable rollback point on main
- Tag `v1.13.0` -- annotated release tag on commit d6a250b
- PR #3 -- sync/v1.13-upstream to main (https://github.com/loganrooks/get-shit-done-reflect/pull/3)
- `.planning/FORK-STRATEGY.md` -- conflict resolution runbook + Merge Decision Log
- `.planning/FORK-DIVERGENCES.md` -- per-file merge stances, post-merge risk recalibration
- `.planning/research/SUMMARY.md` -- v1.14 multi-runtime interop research (HIGH confidence)

## Session Continuity

Last session: 2026-02-15
Stopped at: Completed quick task 2 (fix 2 failing install.test.js tests). All phases complete.
Resume file: N/A
