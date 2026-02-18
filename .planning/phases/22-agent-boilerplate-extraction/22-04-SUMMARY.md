---
phase: 22-agent-boilerplate-extraction
plan: 04
subsystem: agent-specs
tags: [refactor, extraction, protocol]
dependency_graph:
  requires:
    - 22-01-PLAN.md (shared agent protocol)
  provides:
    - 6 lean agent specs with protocol references
  affects:
    - All 11 GSD agent specs (now all reference protocol)
tech_stack:
  added: []
  patterns:
    - required_reading tag pattern (shared protocol loading)
key_files:
  created: []
  modified:
    - .claude/agents/gsd-plan-checker.md
    - .claude/agents/gsd-codebase-mapper.md
    - .claude/agents/gsd-research-synthesizer.md
    - .claude/agents/gsd-integration-checker.md
    - .claude/agents/gsd-roadmapper.md
    - .claude/agents/gsd-verifier.md
decisions:
  - Added required_reading tags to all 6 remaining agents
  - Removed forbidden_files duplication from codebase-mapper (65 lines)
  - Retained all domain-specific methodology in each agent
  - Positioned protocol reference below agent identity sections
metrics:
  duration: 137s
  tasks_completed: 2
  files_modified: 6
  completed_date: 2026-02-18
---

# Phase 22 Plan 04: Extract Shared Protocol References (Remaining 6 Agents)

**One-liner:** Completed agent boilerplate extraction by adding protocol references to the final 6 agents (plan-checker, codebase-mapper, research-synthesizer, integration-checker, roadmapper, verifier), achieving 100% coverage across all 11 GSD agents.

## What Was Built

Extracted shared operational content from 6 remaining agent specs by adding `<required_reading>` references to agent-protocol.md. Combined with Plans 02-03, ALL 11 GSD agents now reference the shared protocol.

### Task 1: Extract from plan-checker, codebase-mapper, and research-synthesizer

**Files modified:**
- `.claude/agents/gsd-plan-checker.md` — Added protocol reference before verification_process
- `.claude/agents/gsd-codebase-mapper.md` — Removed forbidden_files duplication (65 lines), added protocol reference
- `.claude/agents/gsd-research-synthesizer.md` — Added protocol reference before execution_flow

**Changes:**
- Added `<required_reading>` tag to all 3 agents
- Removed forbidden_files section from codebase-mapper (now in protocol Section 13)
- Retained full domain-specific methodology in all agents

**Commit:** 022d068

### Task 2: Extract from integration-checker, roadmapper, and verifier

**Files modified:**
- `.claude/agents/gsd-integration-checker.md` — Added protocol reference before critical_rules
- `.claude/agents/gsd-roadmapper.md` — Added protocol reference before success_criteria
- `.claude/agents/gsd-verifier.md` — Added protocol reference before success_criteria

**Changes:**
- Added `<required_reading>` tag to all 3 agents
- Retained integration-checker verification patterns
- Retained roadmapper philosophy and phase identification methodology
- Retained verifier goal-backward verification process

**Commit:** c369df3

## Verification

All 6 agents verified:
- ✓ Each contains exactly 2 instances of "required_reading" (opening + closing tag)
- ✓ Each retains its `<role>` section (identity preserved)
- ✓ Agent-specific content appears ABOVE the required_reading tag
- ✓ Combined with Plans 02-03: ALL 11 agents now reference shared protocol

## Deviations from Plan

None - plan executed exactly as written.

## Impact

**Immediate:**
- All 11 GSD agents now load shared operational conventions
- 65 lines of duplication removed (forbidden_files from codebase-mapper)
- Protocol changes now propagate to all agents automatically

**Long-term:**
- Future agent updates only need to modify domain-specific methodology
- Operational convention changes happen once in protocol, affect all agents
- Reduced maintenance burden for cross-agent consistency

## What's Next

Phase 22 boilerplate extraction complete. Next phase (23) will focus on feature manifest system for declarative feature initialization.

## Self-Check: PASSED

**Files verified:**
```bash
✓ FOUND: .claude/agents/gsd-plan-checker.md
✓ FOUND: .claude/agents/gsd-codebase-mapper.md
✓ FOUND: .claude/agents/gsd-research-synthesizer.md
✓ FOUND: .claude/agents/gsd-integration-checker.md
✓ FOUND: .claude/agents/gsd-roadmapper.md
✓ FOUND: .claude/agents/gsd-verifier.md
```

**Commits verified:**
```bash
✓ FOUND: 022d068 (Task 1)
✓ FOUND: c369df3 (Task 2)
```

All claimed files exist and all commits are in git history.
