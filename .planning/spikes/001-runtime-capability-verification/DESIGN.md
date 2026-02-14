---
created: 2026-02-11T12:00:00Z
status: designing
originating_phase: project-level
depends_on: none
round: 1
time_estimate: ~45 minutes (Round 1: ~20min research, Round 2 if needed: ~25min hands-on)
---

# Spike: Runtime Capability Verification

## Question

What subagent/task spawning, hooks, tool permissions, and MCP capabilities do OpenAI Codex CLI and Google Gemini CLI actually support as of February 2026 — and does our capability matrix accurately reflect reality?

## Type

Exploratory

We're verifying claims in our static capability matrix against current documentation, release notes, source code, and (if Round 1 is inconclusive) hands-on testing for two runtimes that may have evolved since the matrix was authored.

## Hypothesis

The capability matrix is partially stale. Specifically:
- Codex CLI's `task_tool: N` may be wrong — hints from prior web search suggest subagent support may have been added
- Gemini CLI's `task_tool: Y` may overstate the maturity — described as "experimental" in some sources
- Other capabilities (hooks, mcp_servers, tool_permissions) may also have changed

## Success Criteria

- [ ] Each cell in the capability matrix (4 capabilities x 2 runtimes = 8 claims) has a verified status: **confirmed**, **stale**, or **unclear**
- [ ] For any stale claim, the corrected value is documented with evidence (URL, commit, changelog entry, or source code reference)
- [ ] For any unclear claim, the ambiguity is documented and a recommendation is made (assume Y or N, with rationale)
- [ ] Confidence level assigned per runtime: HIGH (multiple corroborating sources), MEDIUM (single authoritative source), LOW (inference only)
- [ ] Updated capability matrix draft produced (even if only some cells change)

## Prerequisites & Feasibility

### Round 1 (Documentation Verification) — Low Infrastructure

| Requirement | Status | Notes |
|-------------|--------|-------|
| Web access | Required | For fetching GitHub repos, docs, changelogs |
| GitHub API / web | Required | To inspect Codex CLI and Gemini CLI repos |
| API keys | Not needed | Round 1 is research-only |
| CLI installations | Not needed | Round 1 is research-only |
| Isolated environment | Not needed | No code execution in Round 1 |

**Feasibility assessment:** Round 1 is fully feasible with current tools (WebSearch, WebFetch, Bash for git/gh). No external dependencies or credentials required.

### Round 2 (Hands-On Verification) — High Infrastructure (only if Round 1 inconclusive)

| Requirement | Status | Notes |
|-------------|--------|-------|
| OpenAI API key | Unknown | Needed for Codex CLI. User must provide or confirm availability. |
| Google API key | Unknown | Needed for Gemini CLI. User must provide or confirm availability. |
| Codex CLI installed | No | Would need `npm install -g @openai/codex` or similar |
| Gemini CLI installed | No | Would need installation per Google's instructions |
| Isolated test directory | Needed | Throwaway project with minimal GSD-like agent spec |
| Network access | Required | CLIs need API access to function |

**Feasibility assessment:** Round 2 depends on API key availability and user willingness to install CLIs. If Round 1 provides HIGH confidence answers, Round 2 may be unnecessary. **Decision to proceed to Round 2 is a checkpoint.**

### Risk Assessment

- **Round 1 risk:** Low. Worst case: documentation is ambiguous or outdated, leading to MEDIUM confidence.
- **Round 2 risk:** Medium. API keys may not be available. CLI installation may have side effects. API calls may incur costs.
- **Mitigation:** Structure Round 1 to maximize confidence. Only escalate to Round 2 for specific cells that remain unclear.

## Experiment Plan

### Round 1: Documentation & Source Verification

#### Experiment 1: Codex CLI Capability Audit

- **What:** Systematically research Codex CLI's current capabilities through official documentation, GitHub repository (README, changelogs, source code), and authoritative third-party sources
- **Measures:** For each of the 4 capabilities (task_tool, hooks, tool_permissions, mcp_servers): evidence found (Y/N), source URL/reference, date of source, confidence level
- **Expected outcome:** At least one capability claim will be stale (likely task_tool, based on prior web search hints during gap analysis)
- **Specific questions to answer:**
  - Can Codex CLI spawn subprocesses/subagents? (task_tool)
  - Does Codex CLI support pre/post execution hooks? (hooks)
  - Can Codex CLI restrict tool access per agent? (tool_permissions)
  - Does Codex CLI integrate with MCP servers? (mcp_servers)
- **Sources to check (in priority order):**
  1. OpenAI Codex CLI GitHub repository — README, docs/, CHANGELOG
  2. OpenAI official documentation (platform.openai.com)
  3. NPM package page (@openai/codex or equivalent)
  4. Recent blog posts, release notes (2025-2026)
  5. Source code inspection if repo is public (look for task/agent/subprocess patterns)

#### Experiment 2: Gemini CLI Capability Audit

- **What:** Same systematic approach for Gemini CLI, with special attention to task_tool maturity level
- **Measures:** For each of the 4 capabilities: evidence found (Y/N), maturity level (stable/experimental/absent), source URL/reference, date of source, confidence level
- **Expected outcome:** task_tool confirmed but with maturity qualifier; mcp_servers may have been added since matrix was drafted
- **Specific questions to answer:**
  - How mature is Gemini CLI's subagent/task spawning? (task_tool — our matrix says Y but may be experimental)
  - What hooks does Gemini CLI support? (hooks — matrix says Y)
  - Does Gemini CLI support tool permissions? (tool_permissions — matrix says N)
  - Does Gemini CLI support MCP servers? (mcp_servers — matrix says N, but may have been added)
- **Sources to check (in priority order):**
  1. Google Gemini CLI GitHub repository — README, docs/, CHANGELOG
  2. Google AI developer documentation
  3. NPM/pip package page
  4. Recent blog posts, release notes (2025-2026)
  5. Source code inspection for subagent implementation patterns

#### Experiment 3: Cross-Reference & Community Verification

- **What:** Search for community reports, issue tracker discussions, and practical examples that corroborate or contradict the documentation findings from Experiments 1 and 2
- **Measures:** Number of corroborating/contradicting sources per capability claim
- **Expected outcome:** Provides additional confidence calibration. Community reports often reveal "it's documented but doesn't work" or "undocumented but works" situations.
- **Sources to check:**
  1. GitHub Issues on both repos (search for "subagent", "task", "hooks", "MCP")
  2. Developer forums, Stack Overflow, Reddit
  3. Working examples or templates that demonstrate multi-agent usage

### Round 2: Hands-On Verification (conditional)

Only executed if Round 1 leaves specific cells at LOW confidence or "unclear" status. Specific experiments would be designed based on Round 1 findings. General approach:

- Install the CLI(s) with unclear capabilities in an isolated directory
- Create a minimal test agent spec that attempts to use the capability
- Run and observe: does it work? Error messages? Behavior?
- Document concrete evidence

**This section will be expanded at the Round 1 → Round 2 checkpoint if needed.**

## Scope Boundaries

**In scope:**
- The 4 capabilities tracked in the matrix: task_tool, hooks, tool_permissions, mcp_servers
- OpenAI Codex CLI and Google Gemini CLI only (Claude Code and OpenCode are well-understood)
- Current state as of February 2026
- Updating the capability matrix based on findings

**Out of scope:**
- Adding new runtimes to the matrix
- Adding new capabilities to the matrix
- Performance or quality comparison between runtimes
- Format/config details (frontmatter syntax, command structure) — already documented
- Testing the GSD installer's format conversion for these runtimes
- Modifying any GSD workflow files based on findings (that's downstream work)

## Time Estimate

- Round 1: ~20 minutes (web research, source inspection, synthesis)
- Round 2 (if needed): ~25 minutes (installation, test design, execution, documentation)

---

## Iteration Log

### Round 1

**Status:** pending
**Summary:** {to be filled by spike-runner}

### Round 2 (if needed)

**Narrowed hypothesis:** {to be determined based on Round 1 findings}
**Status:** pending
**Summary:** {to be filled by spike-runner}
