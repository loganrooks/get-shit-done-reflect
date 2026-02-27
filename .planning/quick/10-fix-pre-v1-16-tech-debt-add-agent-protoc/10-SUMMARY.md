---
phase: quick
plan: 10
duration: ~8min
completed: 2026-02-27
---

# Quick Task 10: Fix pre-v1.16 tech debt: add agent-protocol refs, copy kb-templates to source

## What Changed

### Agent Protocol References (5 agents)
Added `<required_reading>` referencing `agent-protocol.md` to:
- `agents/gsd-plan-checker.md` — was missing (read-only agent, but consistency matters)
- `agents/gsd-research-synthesizer.md` — was missing (agent commits, needed protocol)
- `agents/gsd-reflector.md` — had NO protocol at all (worse than v1.15 audit claimed)
- `agents/gsd-signal-collector.md` — had minimal protocol content
- `agents/gsd-spike-runner.md` — had inline protocol, now also references shared protocol

All 14 agents now reference the shared agent-protocol.md.

### KB Template Path Fixes (3 agents)
Fixed `@.claude/agents/kb-templates/` → `@~/.claude/agents/kb-templates/` in:
- `agents/gsd-reflector.md` (lesson.md reference)
- `agents/gsd-signal-collector.md` (signal.md reference)
- `agents/gsd-spike-runner.md` (spike.md reference)

These paths now use the npm source convention (`~/`) so the installer correctly converts them to `./` for local installs.

### KB Templates to npm Source (5 files)
Created `agents/kb-templates/` directory and copied from `.claude/agents/kb-templates/`:
- lesson.md
- signal.md
- spike.md
- spike-design.md
- spike-decision.md

These templates were previously install-target-only (same bug class as the v1.15 Phase 22 .claude/ directory confusion). They now ship in the npm package.

## Verification
- All 14 agents reference agent-protocol.md (grep confirms)
- `npm pack --dry-run` would include all 5 kb-template files
- `node bin/install.js --local` synced successfully (path conversion verified: `~/` → `./`)
- 155 tests pass (npm test)

## Task Commits
1. **fix: add agent-protocol refs to 5 agents, copy kb-templates to npm source** - `824c6c1`

## Files Modified
- agents/gsd-plan-checker.md
- agents/gsd-research-synthesizer.md
- agents/gsd-reflector.md
- agents/gsd-signal-collector.md
- agents/gsd-spike-runner.md
- agents/kb-templates/lesson.md (new)
- agents/kb-templates/signal.md (new)
- agents/kb-templates/spike.md (new)
- agents/kb-templates/spike-design.md (new)
- agents/kb-templates/spike-decision.md (new)
