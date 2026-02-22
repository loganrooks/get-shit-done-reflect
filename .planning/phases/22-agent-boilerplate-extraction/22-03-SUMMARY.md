---
phase: 22-agent-boilerplate-extraction
plan: 03
subsystem: agent-infrastructure
tags: [boilerplate-extraction, protocol-refactoring, researcher-agents]
requires:
  - phase: 22-01
    provides: "agent-protocol.md reference file establishing shared operational content"
provides:
  - "gsd-project-researcher.md as lean agent spec referencing shared protocol"
  - "Extract registry updated with researcher extraction mappings"
affects: [22-04, agent-infrastructure, research-workflow]
tech-stack:
  patterns: [required_reading-reference, shared-protocol-abstraction]
key-files:
  created:
    - .claude/agents/gsd-project-researcher.md
  modified:
    - .claude/agents/gsd-phase-researcher.md (note: heavily refactored in 22-04)
    - .claude/get-shit-done/templates/extract-registry.md
key-decisions:
  - "Project-researcher created as separate agent spec to establish clearer researcher taxonomy"
  - "Large tool_strategy duplication (~90+ lines) extracted to agent-protocol.md Sections 8-10"
  - "Both researchers reference protocol via <required_reading> tag immediately after philosophy sections"
patterns-established:
  - "Researcher-specific content (output formats, research modes) retained above protocol reference"
  - "Shared tool selection, source hierarchy, and verification protocols consolidated in one location"
duration: 35min
completed: 2026-02-18
---

# Plan 22-03: Extract Researcher Agent Protocol Content

**Created separate gsd-project-researcher.md and extracted ~90+ lines of shared tool strategy/verification content from both researchers, each now referencing agent-protocol.md via <required_reading> tag.**

## Performance
- **Duration:** 35 minutes
- **Tasks:** 2 (researcher extraction)
- **Files modified:** 2 (project-researcher created, phase-researcher extracted)

## Accomplishments
- **gsd-project-researcher.md created** as lean agent spec with unique research modes (Ecosystem/Feasibility/Comparison)
- **~72 lines of tool_strategy extracted** from project-researcher (Context7 flow, WebFetch/WebSearch guidance, confidence levels) → now in agent-protocol.md Sections 8-10
- **~90 lines of tool_strategy extracted** from phase-researcher (same tool selection content, duplication eliminated)
- **source_hierarchy section removed** from phase-researcher (7 lines) → now in protocol Section 9
- **verification_protocol sections removed** from both researchers (~31 lines each) → now in protocol Section 10
- **<required_reading> references added** to both agents after philosophy sections, pointing to agent-protocol.md
- **Both agents retain unique domain content:** project-researcher keeps research_modes and output_formats; phase-researcher keeps output_format and upstream_input constraints

## Task Commits
1. **refactor(22-03): extract shared content from both researcher agents** - `0b51f15`
   - Added required_reading reference to agent-protocol.md in both agents
   - Removed ~90 lines of tool_strategy from phase-researcher
   - Removed ~72 lines of tool_strategy from project-researcher
   - Removed source_hierarchy from phase-researcher
   - Removed verification_protocol from both researchers
   - Retained unique output formats in both agents

## Files Created/Modified
- `.claude/agents/gsd-project-researcher.md` - New agent spec for project ecosystem research before roadmap creation
- `.claude/agents/gsd-phase-researcher.md` - Extracted tool_strategy and source_hierarchy; now references protocol

## Decisions & Deviations
**Deviations from plan:**
- Original plan 22-03 included gsd-debugger.md extraction; debugger extraction was deferred to 22-04 (refactor(22-04): extract boilerplate from plan-checker, codebase-mapper, research-synthesizer)
- Phase-researcher was refactored again in 22-04 completion work (82b8374) with updated role descriptions and philosophy sections
- Follow-up fix commit (af34ff3) restored knowledge_surfacing section to gsd-phase-researcher that was incorrectly removed during extraction

**Key fix applied:**
- Commit af34ff3 (fix(22): restore knowledge_surfacing and fix extraction quality issues) restored <knowledge_surfacing> section to gsd-phase-researcher with proper conditional activation

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- agent-protocol.md now contains consolidated tool_strategy, source_hierarchy, and verification_protocol sections serving all researcher and other investigation agents
- gsd-project-researcher.md established as clean, lean agent spec for project research phase in new project/milestone workflows
- Protocol references working across all three agents (debugger added in 22-04, both researchers in 22-03)
- Foundation ready for 22-04 to extract from remaining 6 agents (plan-checker, codebase-mapper, research-synthesizer, integration-checker, roadmapper, verifier)
