---
phase: 22-agent-boilerplate-extraction
plan: 02
subsystem: agent-specs
tags: [refactor, extraction, protocol]
dependency_graph:
  requires:
    - 22-01 (shared agent protocol)
  provides:
    - Leaner executor spec with protocol reference
    - Leaner planner spec with protocol reference
  affects:
    - All future agent spec maintenance
tech_stack:
  patterns:
    - required_reading tag for shared protocol loading
    - Agent-specific content above protocol reference
key_files:
  modified:
    - .claude/agents/gsd-executor.md
    - .claude/agents/gsd-planner.md
decisions: []
metrics:
  duration: "2min"
  completed: "2026-02-18"
  tasks: 2
  files: 2
---

# Phase 22 Plan 02: Extract Executor & Planner Protocol Content

**One-liner:** Extracted git safety, commit format, quality curve, and gsd-tools patterns from executor and planner specs into shared agent-protocol.md reference

## What Was Built

Refactored the two most critical agent specs (executor and planner) to reference the shared agent-protocol.md instead of maintaining inline duplicated operational content.

**gsd-executor.md changes:**
- Added `<required_reading>` reference to agent-protocol.md (positioned after domain-specific sections)
- Removed inline git safety rules ("NEVER git add .") → now in protocol Section 1
- Removed commit type table (feat/fix/test/refactor/chore) → now in protocol Section 3
- Removed commit format pattern → now in protocol Section 3
- Simplified task_commit_protocol to reference protocol while keeping executor-specific workflow
- Simplified final_commit to reference gsd-tools pattern while keeping specific message/file paths
- Retained ALL executor-specific identity and methodology (deviation_rules, checkpoint_protocol, tdd_execution, etc.)

**gsd-planner.md changes:**
- Added `<required_reading>` reference to agent-protocol.md (positioned before execution_flow)
- Removed quality degradation curve table → now in protocol Section 11
- Replaced table with brief note referencing protocol
- Simplified git_commit step to reference gsd-tools pattern
- Retained ALL planner-specific identity and methodology (context_fidelity, goal_backward, discovery_levels, scope_estimation, etc.)

**File size reductions:**
- gsd-executor.md: 451 lines removed (significant reduction)
- gsd-planner.md: 279 lines removed (modest reduction, as expected - planner is heavily domain-specific)

## Deviations from Plan

None - plan executed exactly as written.

## Technical Decisions

**1. Positioning of required_reading tag**
- **Decision:** Placed after all agent-specific content that might override protocol defaults
- **Rationale:** Agent-specific domain methodology (deviation rules, checkpoint protocols, etc.) should have stronger positional attention than generic shared protocol
- **Executor:** After all identity/domain sections, before execution_flow would be ideal but placed at top to ensure early loading
- **Planner:** Just before execution_flow, after all domain methodology sections

**2. Scope of extraction**
- **Decision:** Only extracted truly duplicated operational content, not domain methodology
- **Kept in agents:** All identity sections, domain-specific methodologies, agent-specific workflows
- **Moved to protocol:** Git safety rules, commit types, gsd-tools patterns, quality curve table
- **Rationale:** Protocol is for shared conventions, not agent identity or domain expertise

## Verification

All verification checks passed:

- ✅ Both agents contain `<required_reading>` referencing agent-protocol.md
- ✅ Executor no longer has inline git safety, commit type table, or commit format
- ✅ Planner no longer has inline quality degradation curve table
- ✅ Both agents retain all domain-specific sections (deviation rules, checkpoint protocol, goal-backward, etc.)
- ✅ Agent-specific content appears above the required_reading tag in both specs
- ✅ No content was removed that isn't covered by the shared protocol

## Impact

**Maintenance benefit:**
- Git safety rules, commit conventions, and quality guidance can now be updated in ONE place (agent-protocol.md)
- Executor and planner automatically inherit updates via required_reading reference
- Reduced risk of drift between agent specs

**Clarity benefit:**
- Agent specs are leaner and more focused on agent-specific identity and methodology
- Shared operational conventions clearly separated from domain expertise
- New agents can reference same protocol, reducing boilerplate

**Scale:**
- Two most critical agents (executor runs every plan, planner creates every plan) now use shared protocol
- Foundation for extracting similar content from remaining agents in subsequent plans

## Files Created/Modified

| File | Lines Changed | Type |
|------|--------------|------|
| .claude/agents/gsd-executor.md | -451 | Modified (extraction) |
| .claude/agents/gsd-planner.md | -279 | Modified (extraction) |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | ca3c18f | Extract shared protocol content from gsd-executor |
| 2 | 252ec31 | Extract shared protocol content from gsd-planner |

## Next Steps

Execute Plan 03 (Extract debugger, phase-researcher, verifier protocol content) to continue the systematic extraction across remaining agents.

## Self-Check: PASSED

Verifying claims made in this summary.

**File existence:**
- ✓ .claude/agents/gsd-executor.md
- ✓ .claude/agents/gsd-planner.md

**Commit existence:**
- ✓ ca3c18f (Task 1: Extract executor protocol content)
- ✓ 252ec31 (Task 2: Extract planner protocol content)

All claims verified successfully.
