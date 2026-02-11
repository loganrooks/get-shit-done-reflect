# Phase 9: Architecture Adoption & Verification - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify that the gsd-tools CLI, thin orchestrator pattern, condensed agent specs, and all additive architecture pieces (workflow files, references, summary templates) function correctly with the fork's configuration and features. Audit the post-merge codebase comprehensively, then fix issues found. Feature-level verification (patch preservation, --auto flag, --include flag, etc.) belongs to Phase 10.

</domain>

<decisions>
## Implementation Decisions

### Phase structure
- **Audit-first approach:** Phase 9 leads with a comprehensive audit producing a findings report. Fixes happen in subsequent plan(s) within Phase 9 — unless audit findings are massive, in which case Claude may split fixes into a separate phase.
- **Findings report format:** Categorized narrative sections (gsd-tools, workflows, agent specs, KB wiring, cleanup) for context, plus a summary issue table at the top (file, issue type, severity, description, suggested fix) for quick task extraction.
- **Include positive findings:** Document what passed verification alongside what failed — prevents re-checking during fixes and builds confidence about what's solid.
- **Re-run test baseline:** Run vitest + gsd-tools tests at the start of Phase 9 to establish a clean baseline before any changes.
- **Reconcile success criteria:** Verify actual file counts against roadmap predictions (e.g., 16 vs. 19 workflow files) and update success criteria to match reality.

### Fork customization scope
- **Proactive migration:** Review all upstream-originated workflow files and proactively add fork customizations where relevant, not just fix-on-failure.
- **Identity layers per-file:** Claude judges which fork identity layers (branding, DevOps detection, Reflect commands, KB references) are relevant for each specific workflow file — not a blanket "all layers everywhere" approach.
- **Upstream references replaced:** Any upstream-specific references (Discord links, maintainer names, upstream repo URLs) in workflow files are replaced with fork equivalents, not just removed.
- **Convert fork-only commands to thin orchestrator:** Fork-exclusive commands (signal, reflect, collect-signals, discuss-phase, spike, upgrade-project, etc.) are converted to the thin stub + workflow pattern for architectural consistency.
- **Workflow file location:** Claude decides whether fork-only workflows go in `get-shit-done/workflows/` alongside upstream workflows or in a subdirectory — optimizing for minimal future merge friction.
- **Fork section markers:** Claude decides whether to add inline markers (e.g., `<!-- FORK: GSD Reflect -->`) around fork-specific content in upstream workflow files, given the tracked-modifications strategy.

### Summary templates
- **Adopt upstream's 3-tier adaptive framework:** Use gsd-tools.js's template selection logic (minimal/standard/complex based on plan complexity).
- **Enrich each tier with fork additions:**
  - All tiers: Add `requires`/`patterns-established` frontmatter fields for dependency scanning
  - Standard + Complex: Add "User Setup Required" section
  - Complex: Add the fork's detailed deviation auto-fix format (structured per-fix records with Found during / Issue / Fix / Verification / Committed in)
- **Retire fork's standalone summary.md:** After enriching the three upstream variants, the original `summary.md` is superseded.

### Agent spec review
- **Review all merged agent specs:** Systematically check each agent spec modified by both upstream and fork to verify fork-specific behavior survived the auto-merge.
- **Conflict resolution per-spec:** Claude judges each case — if upstream simplified a section where the fork had richer instructions, Claude decides whether the upstream change was a genuine improvement or just dropped fork features.

### Reference file review
- **Review for fork compatibility:** Read each of the 4 new reference files (decimal-phase-calculation, git-planning-commit, model-profile-resolution, phase-argument-parsing) and verify they don't assume upstream-only behavior or contain upstream package references.

### Knowledge base wiring audit
- **Full audit of all integration points:** Grep for all knowledge base references (signals, lessons, reflect) across the codebase and verify each integration point is intact after the merge.

### Verification depth
- **All gsd-tools subcommands tested:** Run every gsd-tools.js subcommand with fork-specific inputs, not just --help and config get.
- **Thin orchestrator verification — both structural and functional:** Structural check (stub shape, @workflow reference) for all commands, plus functional walkthrough for the 3 already migrated in Phase 8.
- **Workflow file verification — automated scan + manual review:** Script a grep-based scan for upstream package names, broken paths, and missing fork references across all workflow files. Then manual review for anything flagged or ambiguous.
- **Conversion assessment for fork commands:** For each fork-only command, audit assesses what would become the stub vs. the workflow and any tricky parts — makes the fix plan faster.

### gsd-tools adoption
- **Evaluate extension for fork operations:** Assess whether fork operations (signal, reflect, KB queries) should become gsd-tools subcommands or stay separate. Claude recommends the extension style (separate file, plugin pattern, etc.) that minimizes merge friction while maximizing code reuse.
- **Flag commit migration opportunities:** Identify every workflow using raw git where gsd-tools commit would be a better fit.
- **Config compatibility — thorough testing:** Run config get/set with fork custom fields (health_check, devops, gsd_reflect_version) and verify they survive round-trips without data loss. Use isolated fixtures for write operations.
- **State compatibility — critical check:** Verify gsd-tools state operations preserve the fork's extended STATE.md sections (performance metrics, quick tasks, roadmap evolution).
- **Template fill testing:** Run template fill for each template type against a fork phase and verify output matches expectations.
- **esbuild pipeline verification:** Verify esbuild can bundle fork hooks — this is architecture verification, not CI/CD.
- **Identify duplicate phase discovery:** Map all phase discovery patterns across the codebase and flag opportunities to consolidate onto gsd-tools.
- **Performance benchmarking:** Time key gsd-tools operations (config get, state read, phase find, template select) to establish a baseline.
- **Document fork surface area:** Map which gsd-tools.js functions/sections the fork depends on or would modify — valuable for future sync planning.
- **Fork-specific gsd-tools tests:** Write additional tests for fork scenarios (custom config fields, fork package names) that upstream tests don't cover.
- **Test safety:** Use isolated fixtures for all gsd-tools testing — zero risk to project data.

### Upstream artifact cleanup
- **Part of the audit report:** Cleanup items are flagged alongside code findings in the audit, not in a separate plan.
- **Delete new-project.md.bak:** Upstream's old inline backup has no fork value.
- **Update CODEOWNERS:** Replace @glittercowboy with fork maintainer.
- **Customize issue templates:** Update bug_report.yml and feature_request.yml to reference fork project and conventions.
- **Customize auto-label workflow:** Update labels to match fork conventions.
- **Update SECURITY.md:** Replace upstream contact info and disclosure process with fork-appropriate ones.
- **Logo: flag for later:** Note "fork logo needed" in findings — actual logo creation belongs in Phase 12 or a quick task. Delete upstream logos once fork logo exists.
- **Check for broken refs from deleted files:** Grep for references to CONTRIBUTING.md, GSD-STYLE.md, MAINTAINERS.md across the codebase.
- **Full fork identity sweep:** Grep for upstream package name, upstream repo URL, upstream Discord, @glittercowboy across the entire codebase — comprehensive list of what needs updating.

### Claude's Discretion
- Fork-only workflow file location (same directory vs. subdirectory)
- Whether to add inline fork section markers in upstream workflow files
- Agent spec conflict resolution approach per-spec
- Phase 9 plan count (audit + fix in same phase vs. split based on findings volume)
- gsd-tools extension style (separate file vs. plugin pattern)

</decisions>

<specifics>
## Specific Ideas

- Audit-first, fix-second: the user wants a clear picture of the full scope before committing to changes. The audit produces a comprehensive report that drives subsequent fix plans.
- "Replace with fork equivalents" — upstream references don't just get stripped, they get replaced. The fork should feel like its own product, not a partially-de-branded upstream.
- The 3-tier summary template adoption was chosen after investigating how upstream uses them: gsd-tools.js auto-selects based on plan complexity (task count, file count, decision mentions). Fork's single template is richer than all three upstream variants.
- Fork-only commands should follow the same thin orchestrator architecture as upstream commands — consistency matters even though they weren't affected by the merge.

</specifics>

<deferred>
## Deferred Ideas

- Fork logo creation — Phase 12 or quick task
- README.md and CHANGELOG.md content updates — Phase 12 (Release)
- Version bump — Phase 12

</deferred>

---

*Phase: 09-architecture-adoption*
*Context gathered: 2026-02-10*
