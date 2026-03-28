# Phase 52: Feature Adoption - Context

**Gathered:** 2026-03-26
**Status:** Ready for research

<domain>
## Phase Boundary

Adopt upstream features (context-monitor, Nyquist auditor, code-aware discuss-phase, supporting workflows, and utility improvements) into the fork with correct namespace rewriting. Ten requirements (ADT-01 through ADT-10) scope this phase.

**What this phase delivers:**
- Context-monitor hook (ADT-01) with bridge file for statusline integration
- Context scaling fix from 80% to 83.5% (ADT-02)
- Stdin timeout guard for hook input handling (ADT-03)
- CLAUDE_CONFIG_DIR environment variable respect across all paths (ADT-04)
- Nyquist auditor agent under `gsdr-nyquist-auditor` namespace (ADT-05)
- Code-aware discuss-phase with codebase scouting (+641 lines delta) (ADT-06)
- 4 upstream workflows: add-tests, cleanup, health, validate-phase (ADT-07)
- Integration-checker agent adopted from upstream (ADT-08)
- Per-agent model override support (ADT-09)
- quick.md --discuss flag (ADT-10)

**What this phase does NOT deliver:**
- Deep integration of adopted features into fork's signal/automation/health pipeline (Phase 53)
- Modifications to the fork's epistemic behavior based on adopted features (Phase 53)
- CI/infrastructure changes (Phase 54)

</domain>

<assumptions>
## Working Model & Assumptions

**A1: Most features are copy-and-namespace-rewrite operations.**
The installer's `replacePathsInContent()` and `copyWithPathReplacement()` handle namespace transformation (gsd → gsdr). Adopted workflows, agents, and hooks should follow the same copy-then-rewrite pattern used for all existing source files. Research should verify which features need fork-specific modifications beyond namespace rewriting.

**A2: The context-monitor hook is new source infrastructure, not just a copy.**
The context-monitor hook (`gsd-context-monitor.js`) reads statusline bridge files and injects context warnings. It does NOT exist in the fork's hooks directory yet. It needs to be added to source, namespace-rewritten to `gsdr-context-monitor.js`, registered in the installer's hook setup, and the bridge file format needs to be understood. Research should investigate the bridge file contract.

**A3: The discuss-phase delta is large (+641 lines) and may conflict with fork customizations.**
The fork's `discuss-phase.md` is 408 lines; upstream's is 1049 lines. The upstream version adds codebase scouting, `<code_context>` output, and several structural changes. Research should determine whether this is a wholesale replacement or a targeted merge, and whether the fork's steering brief model (CONTEXT.md sections like Working Model, Derived Constraints, Open Questions) is preserved in upstream's version.

**A4: Per-agent model override (ADT-09) may interact with the fork's model profile system.**
Quick 32 established cross-runtime model profiles. Upstream's per-agent model override is a separate mechanism that sets model overrides on individual agent specs. Research should determine if these are complementary or if reconciliation is needed.

**A5: The 4 new workflows (add-tests, cleanup, health, validate-phase) are standalone additions.**
These workflows don't exist in the fork yet. They should be copied to source, namespace-rewritten, and registered as commands. Research should verify they don't reference features or infrastructure the fork doesn't have.

</assumptions>

<decisions>
## Implementation Decisions

### Namespace rewriting pattern
- All adopted files follow the established pattern: source files use `gsd` prefix, installer rewrites to `gsdr` at install time via `replacePathsInContent()`.
- **Grounding:** This is the universal pattern used since Phase 45 for all source files. No deviation needed.

### CLAUDE_CONFIG_DIR already partially adopted
- `bin/install.js` already respects `CLAUDE_CONFIG_DIR` (lines 172-177) for the config directory resolution. ADT-04 requires extending this to all other paths that hardcode `~/.claude`.
- **Grounding:** Direct code inspection of install.js shows the env var is read in `getGlobalDir()`.

### Claude's Discretion
- Ordering of feature adoption (which features in which plans)
- Whether discuss-phase is wholesale-replaced or incrementally merged
- Test strategy for adopted features (unit tests per feature vs integration tests)
- How to handle upstream test files that accompany adopted features

</decisions>

<constraints>
## Derived Constraints

**DC-1: 405 tests must continue passing.**
Phase 51 established 405 tests passing. New work must not break existing tests.

**DC-2: Upstream drift clusters C2 partial and C4 route here.**
- C2 partial: Workflow shell robustness (commit `58c2b1f`) — shell guards for workflows
- C4: Worktree isolation for code-writing agents (commit `8380f31`) — 4 workflow files with worktree isolation

**DC-3: Namespace rewriting is mandatory for all adopted files.**
All `gsd:` prefixes must become `gsdr:`, all `gsd-` agent names must become `gsdr-`, all path references must use the fork's namespace. Phase 50's TST-01 full-corpus scan will catch any misses if re-run.

**DC-4: The fork's discuss-phase has been customized with the steering brief model.**
The fork's discuss-phase.md (408 lines) includes CONTEXT.md sections (Working Model & Assumptions, Derived Constraints, Open Questions, Epistemic Guardrails) that don't exist in upstream. The upstream version (1049 lines) adds codebase scouting but uses a different context model. The merge must preserve the fork's steering brief sections while adding upstream's codebase scouting capability.

**DC-5: Hook registration follows the v1.18 installer pattern.**
Phase 51 established `validateHookFields()` and the `ensureHook()` pattern. New hooks (context-monitor) must follow this pattern and be added to the installer's hook registration and orphan cleanup lists.

**DC-6: The integration-checker agent already exists in source.**
`agents/gsd-integration-checker.md` is already present in the fork's source directory. It may need updating to match upstream's latest version, but it's not a net-new file.

**DC-7: The fork's agent protocol must be preserved.**
All adopted agents must reference `agent-protocol.md` per the fork's shared agent execution protocol (v1.15). Research should verify upstream agents include this reference or need it added.

</constraints>

<questions>
## Open Questions

### Q1: Discuss-phase merge strategy — wholesale replace or incremental merge?
- **Type:** formal
- **Why it matters:** The fork's discuss-phase (408 lines) has a steering brief model with sections upstream doesn't have. Upstream's version (1049 lines) adds codebase scouting (+641 lines). A wholesale replace would lose the fork's steering brief model; an incremental merge preserves both but is more complex.
- **Downstream decision affected:** Whether the fork's CONTEXT.md output format changes, plan structure for discuss-phase adoption
- **Reversibility:** Low — the discuss-phase workflow shapes all downstream context gathering
- **What research should investigate:** Diff the two versions structurally. Identify which upstream additions are purely additive (codebase scouting) vs which conflict with fork sections. Determine if upstream's `<code_context>` output can be added to the fork's existing template without breaking the steering brief model.

### Q2: Per-agent model override interaction with fork's model profile system
- **Type:** material
- **Why it matters:** ADT-09 requires per-agent model override support from upstream. The fork already has MODEL_PROFILES in core.cjs (Quick 32). If both systems are active, the precedence order matters.
- **Downstream decision affected:** Whether model overrides in agent specs override profile-based resolution
- **Reversibility:** Medium — model resolution affects agent quality across all runtimes
- **What research should investigate:** How upstream implements per-agent model overrides (frontmatter? workflow parameter? runtime config?). How it interacts with the fork's `resolveModelInternal()` and profile tiers. Whether the fork's installer already handles model override fields during agent copying.

### Q3: Which upstream test files should be adopted alongside features?
- **Type:** efficient
- **Why it matters:** Upstream has test files for some adopted features (quick-branching.test.cjs, quick-research.test.cjs, verify-health.test.cjs). These could provide immediate test coverage but may need adaptation for fork namespace.
- **Downstream decision affected:** Test strategy, CI configuration
- **Reversibility:** High — tests can be added or removed independently
- **What research should investigate:** List all upstream test files that correspond to adopted features. Assess which can run as-is, which need namespace adaptation, and which are irrelevant.

### Q4: Context-monitor bridge file format and contract
- **Type:** material
- **Why it matters:** ADT-01 requires the context-monitor hook to write bridge file data readable by the statusline hook. The bridge file format is a contract between two hooks.
- **Downstream decision affected:** Whether existing statusline hook needs modification
- **Reversibility:** Medium — bridge file format becomes a runtime contract
- **What research should investigate:** Read the upstream context-monitor hook to understand what it writes and where. Check if the fork's statusline hook already reads bridge files. Determine if the bridge file path uses `~/.claude` (needs CLAUDE_CONFIG_DIR respect per ADT-04).

### Q5: CLAUDE_CONFIG_DIR coverage — what paths still hardcode ~/.claude?
- **Type:** material
- **Why it matters:** ADT-04 requires CLAUDE_CONFIG_DIR everywhere. install.js already respects it, but workflows, hooks, and other source files may still hardcode `~/.claude`.
- **Downstream decision affected:** How many files need updates, whether this is a targeted fix or a sweep
- **Reversibility:** High — env var respect can be added incrementally
- **What research should investigate:** Grep all source files for hardcoded `~/.claude` paths that aren't already gated by CLAUDE_CONFIG_DIR or the installer's path replacement. Identify the full scope of changes needed.

</questions>

<guardrails>
## Epistemic Guardrails

**G1: Do not modify fork's steering brief model in discuss-phase without explicit grounding.**
The fork's CONTEXT.md sections (Working Model, Derived Constraints, Open Questions, Epistemic Guardrails) are a deliberate fork divergence. Upstream's codebase scouting should be ADDED, not used to REPLACE the fork's context model.

**G2: Verify adopted agents reference agent-protocol.md.**
The fork's shared agent protocol is a key architectural feature. Any adopted agent that doesn't reference it needs the reference added.

**G3: Test namespace rewriting on ALL adopted files.**
Phase 50's TST-01 corpus scan pattern should catch namespace misses, but newly adopted files should be explicitly verified before committing.

**G4: Do not adopt features that conflict with the fork's epistemic self-improvement pipeline.**
If an adopted feature writes to paths, generates artifacts, or triggers behaviors that conflict with the fork's signal/KB/reflection system, flag it for Phase 53 deep integration rather than trying to resolve it here.

</guardrails>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches within the constraints above.

</specifics>

<deferred>
## Deferred Ideas

- **Deep integration of context-monitor with automation deferral** — Phase 53 (INT-01)
- **Nyquist auditor output feeding into artifact sensor** — Phase 53 (INT-02, INT-03)
- **KB knowledge surfacing in discuss-phase** — Phase 53 (INT-04)
- **Cleanup workflow exclusion list for fork directories** — Phase 53 (INT-05)

</deferred>

---

*Phase: 52-feature-adoption*
*Context gathered: 2026-03-26*
