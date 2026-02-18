# Phase 22: Agent Boilerplate Extraction - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Extract ~600 lines of shared execution protocol from 11 agent specs into a single `references/agent-protocol.md`, so convention changes propagate via one edit instead of 11. Each agent spec retains its identity, philosophy, and domain-specific methodology.

</domain>

<decisions>
## Implementation Decisions

### Extraction boundary (HOW/WHAT split)
- **Protocol (shared):** HOW to operate — git safety, commit format, tool conventions, structured returns, state file path conventions, deviation handling rules
- **Agent spec (stays):** WHAT you are — role definition, philosophy, user/Claude relationship framing, domain methodology, execution steps
- The test: "Does this define what the agent IS, or how it OPERATES?" Identity stays. Operations extract.

### Protocol structure
- Single monolithic `references/agent-protocol.md` file (not split into multiple files)
- Rationale: ~600 lines is manageable in one file; splitting adds file management overhead for minimal benefit; can split later if maintenance burden grows
- Agents load via `<required_reading>` which pulls the entire file before execution

### Override mechanism
- Agent-specific content appears ABOVE the `<required_reading>` protocol reference in each spec
- This leverages Claude's natural instruction priority: specific (agent) overrides general (protocol)
- No annotation syntax or explicit override blocks needed — positional priority is sufficient
- Example: if debugger needs different commit behavior, it states that in its own spec above the protocol load

### Post-extraction agent spec format
- Minimal skeleton after extraction: frontmatter, role, philosophy, execution steps, required_reading reference
- No inline summaries of protocol content — protocol is loaded in full via required_reading, Claude has complete context
- Agent specs become focused on what makes each agent UNIQUE

### Claude's Discretion
- Extraction registry format and level of detail
- Which 3 agents to use for before/after verification (suggest: executor, planner, and one lighter agent like verifier)
- Exact ordering of sections within the shared protocol
- How to handle edge cases where a section is 90% shared but 10% agent-specific (likely: keep full section in agent spec if it has meaningful customization)

</decisions>

<specifics>
## Specific Ideas

- The v1.15 candidate identified shared sections as: "role definition, tool strategy, execution flow protocol, structured returns" — but per the HOW/WHAT boundary, role definition stays agent-specific; the others are extraction candidates
- Git safety rules appear nearly identical across all agents — prime extraction target
- Quality degradation curve tables (seen in planner, executor) are operational guidance and should be in protocol
- Philosophy sections (user = visionary/reporter/etc.) are identity and STAY in agent specs
- The `init` step pattern (calling gsd-tools.js) is shared in structure but has agent-specific args — extract the pattern, leave the specific invocation

## Downstream Considerations

- **Phase 27 (Workflow DX):** Lighter `/gsd:quick` benefits from leaner agent specs; extraction is compatible
- **Future agents:** New agent specs should follow the established pattern (load protocol via required_reading, keep identity inline)
- **Maintenance:** Adding a new shared convention means editing one file, not 11 — this is the primary value proposition

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 22-agent-boilerplate-extraction*
*Context gathered: 2026-02-18*
