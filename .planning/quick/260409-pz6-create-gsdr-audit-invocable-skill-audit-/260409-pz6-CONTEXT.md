# Quick Task 260409-pz6: Create /gsdr:audit Invocable Skill - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Task Boundary

Create a `/gsdr:audit` command (skill) that operationalizes the audit infrastructure built in Phase 57.3. The skill is the missing invocable layer — conventions, ground rules, taxonomy, templates, and directory structure all exist; the dispatcher that uses them does not.

The skill follows the command pattern established by `/gsdr:deliberate`, `/gsdr:signal`, and `/gsdr:audit-milestone` — it IS the orchestrator.

</domain>

<decisions>
## Implementation Decisions

### Audit type selection — infer from context, not force selection
The skill reads conversation context and proposes an audit type from the 9-type taxonomy (+ exploratory escape hatch). If the user provides enough detail, the skill proposes an overview of the audit directly. If context is ambiguous, a few clarifying questions — but the user typically invokes this mid-situation (e.g., "something went wrong with Phase 57"), so the skill should be able to infer scope and type.

Per audit-conventions.md Section 3, the 9 types in 3 families:
- **Structural**: phase_verification, milestone, codebase_forensics
- **Epistemic**: cross_model_review, requirements_review, comparative_quality, claim_integrity
- **Compliance**: adoption_compliance
- **Escape hatch**: exploratory (for audits that exceed the taxonomy)

### Ground rules — auto-selected by type family
Per audit-ground-rules.md, the skill automatically prepends the appropriate ground rules:
- Core rules 1-3 + escape hatch Rule 4 for ALL types
- +S1, S2 for structural family
- +E1, E2, E3 for epistemic family
- +C1 for compliance family
- Core only (minimum) for exploratory — add extensions as the audit demands

The ground rules are copied into the task spec, not referenced by path (per Section 4: "the agent needs the rules in its context window, not a pointer to them").

### Body template — type-aware, not one-size-fits-all
Per audit-conventions.md Section 4, each family has a suggested body template:
- Structural: Goal/Scope → Artifacts Checked → Wiring Verification → Findings table → Gaps Summary
- Epistemic: Question → Methodology → Evidence Examined → Findings (with disconfirmation) → Limitations
- Compliance: Standard → Projects Surveyed → Compliance Matrix → Deviations → Recommendations
- Exploratory: Question/Motivation → What Examined → What Found → What It Might Mean → Follow-Up Needed

### Session directory — per audit-conventions.md
Output goes to `.planning/audits/YYYY-MM-DD-{slug}/` with:
- Task spec preserved alongside output (AUDIT-01)
- YAML frontmatter per Section 2 schema (date, audit_type, scope + recommended fields)
- The three-layer model: strict frontmatter, structured body template, open escape hatch

### Interactivity — depends on type, mode, and --auto flag
- **Discovery phase**: Always happens. Reads context, proposes audit type + scope + approach. May ask 1-2 clarifying questions if context is insufficient.
- **Execution**: Structural audits can run autonomously (checklist-like verification). Epistemic/exploratory audits benefit from conversational mode (investigation-like, findings presented incrementally). The --auto flag and audit type determine which mode.
- **Excess marking**: Every audit includes Rule 4 (escape hatch). If the audit discovers something that exceeds the type taxonomy or template, it marks it explicitly.

### Command + Agent — two files, standard pattern
Following the universal GSD pattern (execute-phase → gsdr-executor, validate-phase → gsdr-nyquist-auditor, audit-milestone → gsd-integration-checker): the command is the orchestrator, the agent does the work.

**`commands/gsd/audit.md`** (the command/skill) — orchestrates:
1. Discovers context (reads conversation, proposes type/scope)
2. Creates session directory per conventions
3. Selects ground rules based on type family
4. Dispatches to `gsdr-auditor` agent with task spec
5. Preserves all artifacts (task spec + output)
6. Commits per commit_docs setting

**`agents/gsdr-auditor.md`** (the agent spec) — executes:
- Receives type-specific ground rules + body template in task spec
- Has defined tool access (Read, Bash, Grep, Glob, Write)
- Embodies the epistemic stance from audit-ground-rules.md
- Handles the escape hatch protocol (Rule 4) structurally
- Structures output per type-aware body template
- Marks excess when findings don't fit the template

This is referenceable by other workflows (e.g., audit-milestone could dispatch to gsdr-auditor in future), testable, and consistent with every other GSD command.

### Orchestrator writes task spec, agent executes
The command writes a complete task spec (ground rules, body template, scope, target) to the session directory, then dispatches the agent to execute it. The agent doesn't figure out what kind of audit to run — it receives a fully-formed spec and runs it. This is the spike-runner pattern: orchestrator writes experiment design, runner executes.

### Model escalation — orchestrator decision, not hardcoded
The orchestrator can decide whether to escalate to a higher model tier based on audit type/complexity (e.g., epistemic audits may warrant a higher tier than structural verification). Design for platform-agnostic "levels" rather than specific model names — this needs to work across Claude Code and Codex.

### gsd-tools integration — deferred (TODO added)
The command reads reference docs directly for now (audit-conventions.md, audit-ground-rules.md). A `gsd-tools init audit` subcommand that encodes the taxonomy and ground rules as structured data is deferred per trial-before-formalize — ship command+agent first, formalize tooling once usage patterns emerge. TODO added to STATE.md.

### Claude's Discretion
- Exact argument parsing format (flexible, not rigid)
- How many clarifying questions to ask (0-2 based on context sufficiency)
- Whether to present audit overview for user approval before executing
- Task spec wording beyond the ground rules and template structure

</decisions>

<specifics>
## Specific Ideas

- User typically invokes `/gsdr:audit` in the context of a frustrating situation — the skill should read conversation history for context clues
- The 57.3 gold-standard audit session (`.planning/audits/2026-04-09-discuss-phase-exploration-quality/`) is the model for what good output looks like: task spec + outputs in dated directory
- The skill should work with `--auto` flag consistent with other GSD commands (discuss-phase, quick, etc.)
- Excess should always be marked — recurring `exploratory` use signals new types to formalize (per conventions doc)

</specifics>

<canonical_refs>
## Canonical References

### Infrastructure (from Phase 57.3 — the conventions this skill operationalizes)
- `get-shit-done/references/audit-conventions.md` — directory structure, frontmatter schema, type taxonomy, body templates, three-layer model
- `get-shit-done/references/audit-ground-rules.md` — core rules 1-3, escape hatch Rule 4, type-family extensions (S1-S2, E1-E3, C1), how to reference in task specs
- `get-shit-done/references/claim-types.md` — typed claim vocabulary for audit specs

### Command patterns to follow
- `commands/gsd/audit-milestone.md` — "This command IS the orchestrator" pattern
- `commands/gsd/deliberate.md` — conversational skill with context inference and mode detection
- `commands/gsd/signal.md` — lightweight skill with argument parsing and KB integration
- `commands/gsd/validate-phase.md` — phase-targeting skill with state reading

### Evidence base
- `.planning/phases/57.3-audit-workflow-infrastructure/57.3-CONTEXT.md` — full audit taxonomy, failure patterns, design rationale
- `.planning/phases/57.3-audit-workflow-infrastructure/57.3-RESEARCH.md` — audit landscape survey, patterns, pitfalls
- `.planning/audits/2026-04-09-discuss-phase-exploration-quality/` — gold-standard audit session (model for output)
- `sig-2026-04-09-phase-573-deferred-audit-skill-no-command` — the signal that triggered this task

</canonical_refs>
