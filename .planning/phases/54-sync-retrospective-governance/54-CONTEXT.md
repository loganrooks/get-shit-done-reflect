# Phase 54: Sync Retrospective & Governance - Context

**Gathered:** 2026-03-28
**Status:** Ready for research

<domain>
## Phase Boundary

Examine the v1.18 sync experience as a whole — understand upstream's trajectory, identify feature overlap with the fork, evaluate how the sync process itself went, cross-reference our signal history against upstream's issue tracker, assess what's still outstanding, and produce governance artifacts grounded in that analysis. Infrastructure fixes (CI cache, progress telemetry) are also addressed.

Nine requirements in three tiers:

**Infrastructure:**
- **INF-01**: CI status cache scoped per-project (repo/branch in cache key)
- **INF-02**: v1.17+ roadmap deliberation updated to incorporate upstream sync as completed milestone theme

**Upstream Analysis:**
- **INF-05**: Upstream post-baseline trajectory analyzed (issues, PRs, commit themes since v1.22.4)
- **INF-06**: Feature overlap inventory (fork additions vs upstream's independent development)

**Sync Retrospective:**
- **INF-07**: v1.18 sync retrospective (what worked, what didn't, lessons)
- **INF-08**: Signal cross-reference (fork signals vs upstream issues — shared concerns, mutual blind spots)

**Governance Deliverables:**
- **INF-03**: FORK-DIVERGENCES.md updated to reflect v1.18 module structure and merge stances
- **INF-04**: FORK-STRATEGY.md updated with durable upstream sync policy grounded in v1.18 experience and upstream analysis
- **INF-09**: Outstanding upstream changes assessed for relevance and prioritized

The governance deliverables (INF-03, INF-04, INF-09) are outputs of the analytical work (INF-05 through INF-08), not standalone documentation tasks.

</domain>

<assumptions>
## Working Model & Assumptions

### Upstream Has Moved Substantially
- At our v1.22.4 audit baseline (2026-03-10), upstream was at v1.22.4
- The drift ledger (2026-03-24) captured up to v1.28.0 + 31 unreleased commits (372 total)
- As of now: upstream is at v1.30.0, with 412 commits past our baseline
- Since the drift ledger: v1.29.0 (Windsurf runtime, agent skill injection) and v1.30.0 (GSD SDK headless CLI) shipped
- 6 new upstream modules not in fork: `workstream.cjs`, `security.cjs`, `model-profiles.cjs`, `profile-output.cjs`, `profile-pipeline.cjs`, `uat.cjs`

### Feature Overlap Likely Exists
- Cross-runtime support: upstream added Windsurf; we have Gemini/OpenCode/Codex converters (built during v1.14-v1.15)
- Model profiles: upstream has `model-profiles.cjs`; we have cross-runtime model profile logic in `core.cjs` (QT32)
- Agent skill injection: upstream's `#1355`; we have feature-manifest-driven capability gating
- Security: upstream has `security.cjs` (prompt injection, path traversal); we have no equivalent
- UAT tracking: upstream has `uat.cjs`; we have verification workflows but no structured UAT debt tracking
- Research must map these overlaps systematically — the assumption of overlap is provisional

### Sync Retrospective Has Rich Input
- v1.18 spanned 10 phases + 1 inserted phase (45-53 + 48.1), 32 plans, ~19 days (2026-03-10 to 2026-03-28)
- Signal KB has 139 signals. Top themes: deviation (38), testing (13), config (12), plan-accuracy (10), CI (8), workflow-gap (4)
- Phase 48.1 (inserted retriage) was a mid-milestone correction — itself a lesson about drift management
- The modularization phases (45-48) went cleanly; the integration phases (52-53) required deep analysis
- These patterns should inform sync policy, not just be documented

### CI Cache Fix (INF-01)
- Fix localized to `hooks/gsd-ci-status.js` (72 lines)
- Hook already reads branch but writes to global `~/.claude/cache/gsd-ci-status.json`
- Repo identity + branch in cache filename should suffice
- Research must verify consumer map before changing format

### Progress Telemetry (SC-2)
- STATE.md YAML frontmatter becomes stale between updates
- `roadmap.cjs` disk-based plan counting is correct, but STATE.md is snapshot-at-write
- Phases with "Plans: TBD" contribute 0 to totalPlans — may undercount remaining work
- Research should identify the concrete overstatement mechanism

</assumptions>

<decisions>
## Implementation Decisions

### Deliberation Updates
- Updates to the v1.17+ roadmap deliberation must add a revision/postscript section, not rewrite the original analysis — deliberation-revision-lineage deliberation constrains this
- FORK-DIVERGENCES.md and FORK-STRATEGY.md are project planning docs (not deliberations), so they can be updated in-place

### Analysis Precedes Governance
- INF-05 through INF-08 (upstream analysis, feature overlap, retrospective, signal cross-reference) must complete before INF-03, INF-04, INF-09 (governance deliverables) are written
- The governance docs are grounded in the analysis — not the other way around

### Claude's Discretion
- Cache key format (hashed vs readable filename)
- FORK-DIVERGENCES table structure — may need redesign for the modular layout
- Upstream analysis artifact format — could be a standalone analysis document, a section in FORK-STRATEGY.md, or folded into CONTEXT.md appendices
- How to present the signal cross-reference — table, narrative, or both
- Whether to include a formal "Upstream Sync Readiness Checklist" in FORK-STRATEGY.md
- Exact telemetry fix approach

</decisions>

<constraints>
## Derived Constraints

### From Phase 48.1 (concluded deliberation)
- The baseline-freeze + explicit-retriage-phase pattern was decided during Phase 48.1 and documented in `UPSTREAM-DRIFT-LEDGER.md`
- FORK-STRATEGY.md must formalize this pattern as durable policy, not re-derive it
- Phase 48.1 classified 372 post-baseline commits into 11 clusters (C1-C11): 9 fold-into, 1 candidate-next-milestone, 1 defer
- The drift ledger is now partially stale: v1.29.0 and v1.30.0 shipped since it was written (25 additional commits). INF-09 must assess these new releases, not just the ledger's scope.

### From v1.18 Modularization (Phases 45-48)
- Runtime is now `gsd-tools.cjs` (thin router) + 16 `lib/*.cjs` modules (11 upstream-adopted, 5 fork-extracted)
- FORK-DIVERGENCES.md must track at the module level, not the pre-modularization monolith level
- Phase 46: fork overrides use `module.exports.funcName` extension pattern
- Phase 48: fork extensions merged into upstream function bodies with includes param

### From v1.18 Integration Experience (Phases 52-53)
- Deep integration pattern established: adopted features must connect to fork's signal/automation/health/reflection pipeline
- Examples: context-monitor → bridge file → automation deferral; Nyquist → artifact sensor → signals; discuss-phase → KB knowledge surfacing
- This pattern is the empirical basis for the "integration depth standard" that INF-04 requires

### From Drift Ledger New Upstream Modules
- 6 upstream modules have no fork equivalent: `workstream.cjs`, `security.cjs`, `model-profiles.cjs`, `profile-output.cjs`, `profile-pipeline.cjs`, `uat.cjs`
- C10 (security hardening) was already classified as `candidate-next-milestone`
- INF-06 must assess these modules as part of the overlap/gap inventory

### From Upstream's Post-Ledger Releases
- v1.29.0: Windsurf runtime support, agent skill injection via config
- v1.30.0: GSD SDK — headless CLI with init + auto commands, prompt sanitizer
- These represent a significant new upstream direction (SDK/headless automation) that the fork doesn't address
- INF-05 analysis must include these releases, not stop at the ledger's v1.28.0 boundary

### From Existing CI Hook Code
- `hooks/gsd-ci-status.js` lines 10-11: global cache path `~/.claude/cache/gsd-ci-status.json`
- Spawned child receives path via `JSON.stringify(cacheFile)` — scoped path must flow into child
- Hook already reads `git branch --show-current` — repo identity also needed

### From Deliberation Lineage Rules
- v1.17+ roadmap deliberation update (INF-02) must add dated revision section, not rewrite original
- Does not constrain INF-03/INF-04/INF-09 (planning docs, not deliberations)

### From Signal KB Reality
- 139 signals across 7 milestones. Top themes: deviation (38), testing (13), config (12), plan-accuracy (10), CI (8)
- The signal history IS the fork's self-observation record — cross-referencing it against upstream issues (INF-08) is a first-of-its-kind analysis for this project
- No prior phase has done signal-vs-upstream comparison; research must define the methodology

### From Success Criteria
- SC-2 mentions both STATE.md AND ROADMAP.md — both must be addressed
- SC-4 requires four elements: sync cadence, baseline-freeze rules, what-to-adopt criteria, integration depth standards
- SC-5 through SC-8 require actual analytical outputs, not just governance doc updates

</constraints>

<questions>
## Open Questions

### Q1: What is upstream responding to?
- **Type:** final
- **Why it matters:** Understanding upstream's motivations — not just their commits — is essential for the feature overlap analysis and forward sync policy. Are they responding to user issues? Competitive pressure? Community PRs? Their own roadmap?
- **Downstream decision:** Shapes what-to-adopt criteria and sync cadence policy in FORK-STRATEGY.md
- **Reversibility:** High — analysis, not code
- **Research should:** Examine upstream GitHub issues (open and closed), PR descriptions and discussions, release notes, README changes. Look for patterns: what problems are they solving? What direction are they heading?

### Q2: What are the guiding design philosophies of each project, and how do they explain the divergences?
- **Type:** final
- **Why it matters:** The fork (GSD Reflect) is built around epistemic self-improvement — "the system never makes the same mistake twice." Upstream GSD's philosophy is less explicit but visible in its choices (SDK/headless automation, runtime breadth, agent skill injection). Understanding each project's design orientation is essential for classifying feature gaps as "behind" (same problem, haven't gotten to it) vs "intentionally different" (different philosophy produces different approach). This distinction directly shapes sync policy — you sync differently with a project heading the same direction vs one heading a complementary but different direction.
- **Downstream decision:** INF-06 gap classification, INF-04 what-to-adopt criteria, overall sync relationship framing
- **Reversibility:** High — analysis
- **Research should:** Examine upstream's README, issue discussions, PR rationales, and architectural choices to surface their implicit design philosophy. Compare against the fork's stated core value and actual design patterns (signals, deliberations, knowledge base, health probes). For each feature overlap or gap: does the divergence follow from philosophical differences, or is it accidental? When facing the same problem (e.g., cross-runtime support, security, verification), how would each project's philosophy suggest a different approach?

### Q2b: Where do fork and upstream features converge vs diverge?
- **Type:** material
- **Why it matters:** The fork has 166 fork-only additions and has independently built features (signals, KB, health probes, automation, deliberations, cross-runtime). Upstream has built features we don't have (security.cjs, SDK, Windsurf, UAT tracking, agent skill injection). Where these converge creates merge complexity; where they diverge creates strategic questions.
- **Downstream decision:** INF-06 inventory structure, INF-04 what-to-adopt criteria
- **Reversibility:** High — analysis
- **Research should:** Map fork features against upstream's feature set. For each overlap: are implementations compatible? Would merging be additive or conflicting? For gaps in either direction: classify as "behind" (same problem, haven't reached it) vs "intentionally different" (different design philosophy) vs "blind spot" (neither side's philosophy predicted this need). This classification is upstream of sync policy.

### Q3: What do our signals tell us about the sync experience?
- **Type:** final
- **Why it matters:** 139 signals captured across the project's lifetime are the fork's epistemic record. Cross-referencing them against upstream's issues would reveal shared pain points and mutual blind spots. This has never been done.
- **Downstream decision:** INF-07 retrospective findings, INF-08 cross-reference output
- **Reversibility:** High — analysis
- **Research should:** Categorize our signals by theme. Check upstream's issue tracker for similar themes. Identify: issues both sides caught independently, issues only we caught (via our epistemic pipeline), issues only they caught (via user reports or their own process). This comparison is itself a test of the fork's value proposition.

### Q4: What are the v1.29.0 and v1.30.0 implications?
- **Type:** material
- **Why it matters:** The drift ledger (2026-03-24) covered through v1.28.0. Since then, upstream shipped two more releases with significant new capabilities (SDK, headless CLI, Windsurf, agent skill injection). These are not in the ledger's classification.
- **Downstream decision:** INF-09 outstanding assessment, whether the drift ledger needs a v2 or an addendum
- **Reversibility:** High — assessment
- **Research should:** Classify v1.29.0 and v1.30.0 changes using the same framework as Phase 48.1 (fold-into / candidate-next / defer). Determine if the SDK/headless direction represents a strategic fork in upstream's evolution that affects our sync relationship.

### Q5: What consumers read gsd-ci-status.json?
- **Type:** material
- **Why it matters:** Scoping the cache filename changes the read path for any consumer
- **Downstream decision:** Cache key format and migration approach
- **Reversibility:** High — cache files are ephemeral
- **Research should:** Grep for `gsd-ci-status` across the entire codebase

### Q6: What specifically causes progress telemetry overstatement?
- **Type:** formal
- **Why it matters:** SC-2 says progress "no longer overstates" — need the concrete bug
- **Downstream decision:** Fix location (roadmap.cjs, STATE.md update logic, or display)
- **Reversibility:** High
- **Research should:** Run progress command, compare to disk state, identify divergence

### Q7: Module-level vs file-level divergence tracking
- **Type:** formal
- **Why it matters:** Post-modularization, a single upstream file contains both adopted code AND fork extensions. Divergence tracking granularity needs a model.
- **Downstream decision:** FORK-DIVERGENCES.md table structure
- **Reversibility:** Medium
- **Research should:** Enumerate which lib/*.cjs modules contain fork modifications vs pure upstream copies

### Q8: How should the v1.18 retrospective be structured?
- **Type:** efficient
- **Why it matters:** This is the first time the project has done a formal sync retrospective. The structure will set precedent for future milestone closures.
- **Downstream decision:** Whether retrospective is a standalone document, a section in FORK-STRATEGY.md, or folded into the phase's analysis artifacts
- **Reversibility:** High — document structure
- **Research should:** Consider what format would be most useful for future sync planning. The retrospective should answer: what worked, what didn't, what we'd do differently, and what the signal history reveals about our process quality.

</questions>

<guardrails>
## Epistemic Guardrails

1. **Do not assume FORK-DIVERGENCES.md is accurate** — last updated 2026-02-10, before v1.18 modularization. Derive actual divergence state from current code.

2. **Do not assume the drift ledger is complete** — it covers through v1.28.0 but upstream is now at v1.30.0. Two releases (25 commits) are unclassified.

3. **Do not infer telemetry bugs from STATE.md values alone** — YAML frontmatter is snapshot-at-write. The progress command's live output is authoritative.

4. **Deliberation updates are append-only** — the v1.17+ roadmap deliberation may not have its original content modified. Add dated revision section.

5. **FORK-STRATEGY policy must be grounded in actual practice** — generalize from v1.18's real experience, not hypothetical ideals. The baseline-freeze + retriage pattern is decided; the sync cadence and what-to-adopt criteria should emerge from analyzing what happened.

6. **Verify cache consumer map before changing format** — changing the CI cache filename breaks any hardcoded reader.

7. **The signal cross-reference is novel** — no prior phase has compared fork signals against upstream issues. Research must define the methodology before executing it. Don't assume the comparison is straightforward.

8. **Feature overlap analysis must distinguish compatible from conflicting** — "both sides built X" doesn't automatically mean merge conflict. Some overlaps may be additive (different angles on the same problem); others may be genuinely conflicting implementations.

9. **Upstream trajectory analysis is not adoption advocacy** — understanding where upstream is heading helps inform policy, but the analysis should be descriptive and evaluative, not a recommendation to adopt everything new.

</guardrails>

<specifics>
## Specific Ideas

- User specifically wants the phase to examine upstream's issues and PRs to understand what they're responding to — not just commit diffs
- User wants cross-referencing of our signal history against their issue tracker to identify mutual blind spots
- User emphasized this is a reflection on the sync process itself, not just documentation of outcomes
- The governance artifacts should emerge from genuine analysis, not be written as standalone updates
- User wants explicit analysis of each project's guiding design philosophy — what concerns drive upstream vs the fork, how those philosophies are similar, where they diverge, and whether feature gaps are explained by philosophical differences or are merely "we're behind." This should inform how we approach shared problems differently and how that affects sync policy going forward.
- **Concrete overlap example — health vs health-check:** Upstream has a `health.md` workflow; the fork has `/gsdr:health-check` and `health-probe.cjs`. Research should use this as a worked example of the overlap analysis: What is each responding to? Do they share the same concern or frame the gap differently? If we integrate upstream's response, how do we avoid naming confusion (health vs health-check)? This pattern of analysis should then be applied across all identified overlaps.
- User wants the retrospective to also surface **issues from the current v1.18 sync round that need future milestone attention** — not just what upstream has that we don't, but what problems we encountered during the sync itself (integration friction, drift management gaps, workflow gaps like the scope-revision protocol absence) that should be addressed going forward.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 54-sync-retrospective-governance*
*Context gathered: 2026-03-28*
