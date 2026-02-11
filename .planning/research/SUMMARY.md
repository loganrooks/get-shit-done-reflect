# Project Research Summary

**Project:** v1.13 Upstream Sync & Validation
**Domain:** Fork synchronization — syncing GSD Reflect with 70 upstream commits (v1.11.2 to v1.18.0)
**Researched:** 2026-02-09
**Confidence:** HIGH (direct git diff analysis of both codebases)

## Executive Summary

Upstream GSD underwent a massive architectural transformation between v1.11.2 and v1.18.0. The dominant change is the extraction of repetitive bash patterns into `gsd-tools.js`, a 4,597-line zero-dependency Node.js CLI. This refactoring touched every agent, command, and workflow file in the system. Commands were hollowed out from 200-1000+ lines to 20-40 lines, delegating all logic to workflow files. Agent specs were condensed by 60% while maintaining identical behavior. Alongside this, upstream fixed 11 critical bugs, added 6 valuable features, and improved verification infrastructure.

**Our fork's challenge:** We made targeted branding changes and added fork-specific features (signals, spikes, knowledge base, reflection) as additive-only files. The fork overlaps with upstream in 12 files, primarily `bin/install.js`, package identity files, and a few commands. The research reveals that the "additive only" constraint held for fork features but not for branding, and the constraint itself is now untenable given upstream's architectural shift. The recommended approach is to **adopt upstream's architecture wholesale, then port fork features onto the new structure**. This is not a traditional merge — it's an architectural migration with branding preservation.

**Critical risks and mitigation:** The biggest risks are (1) install.js three-way merge trap — upstream made extensive changes while we added branding, (2) thin orchestrator architecture mismatch — upstream moved logic from commands to workflows, potentially losing our DevOps detection feature, and (3) agent spec dual-location problem — we have agents in both `agents/` and `.claude/agents/` that must stay synchronized. All three are mitigated by a staged semantic merge approach: accept upstream's structural changes first, then selectively re-apply fork branding and port fork features to the workflow layer.

## Key Findings

### Recommended Stack (from STACK.md)

Upstream introduced `gsd-tools.js`, a 4,597-line Node.js CLI that replaces 30-50% of context budget previously spent on bash snippets for config parsing, state management, phase discovery, and git operations. It contains 63 commands across 10 categories: state management (12 functions), compound init commands (12 functions), phase operations (8 functions), roadmap operations, frontmatter CRUD, verification suite, templates, config management, and utilities.

**Core technologies:**
- **gsd-tools.js CLI** (Node.js, CommonJS): Centralized deterministic operations — zero dependencies, 2,033-line test suite with node:test, fully preserves zero-dependency philosophy
- **Thin orchestrator pattern**: Commands (20-40 lines) delegate to workflows (200+ lines) which delegate to gsd-tools for deterministic operations — reduces context consumption by 75.6%
- **Compound init commands**: Single `init <workflow>` call returns all context a workflow needs in JSON, replacing 6+ file reads — saves 5,000-10,000 tokens per execution
- **Frontmatter CRUD suite**: Tested YAML frontmatter parsing replacing fragile inline regex — highly relevant for our signal collection and knowledge base

**Adoption recommendation:** ADOPT fully. gsd-tools is additive (new file), maintains zero-dependency philosophy, and provides infrastructure our fork features can extend. Rejecting it means maintaining divergent patterns that make every future sync exponentially harder. The thin orchestrator pattern is the right architectural direction.

### Expected Features (from FEATURES.md)

The 70 upstream commits break down into: 11 must-adopt bug fixes, 7 should-adopt features, 8 architectural changes requiring evaluation, and the rest are skip (community-specific, changelog, Windows-specific, or reverted changes).

**Must adopt (critical bug fixes):**
- **Executor completion verification** (f380275): Prevents hallucinated success — executors now verify key files exist and commits are real before reporting success
- **Context fidelity enforcement** (ecbc692): Planner now honors locked decisions from CONTEXT.md — user decisions are binding, not advisory
- **Respect parallelization config** (4267c6c): Fixes ignored `parallelization: false` setting
- **Researcher always writes RESEARCH.md** (161aa61): Fixes silent file loss when `commit_docs=false`
- **commit_docs=false in all paths** (01c9115): Fixes two bypasses that committed planning files when they shouldn't
- **Auto-create config.json** (4dff989): Prevents hard crash when config missing
- **Statusline crash handling** (9d7ea9c): Prevents terminal corruption on file system errors
- **API key prevention** (f53011c): Defense-in-depth against committing secrets
- **Persist research decision** (767bef6): Saves "skip research" choice to config
- **JSONC parsing in installer** (6cf4a4e): Prevents data loss on parse errors
- **Statusline reference update** (074b2bc): Preserves statusline across updates

**Should adopt (valuable features):**
- **Preserve local patches** (ca03a06): SHA256 manifest + backup system — directly relevant to our fork use case
- **classifyHandoffIfNeeded workaround** (4072fd2): Handles Claude Code v2.1.27+ bug where agents falsely report failure
- **--include flag optimization** (fa81821 + 01c9115): Eliminates redundant file reads, saves 5k-10k tokens per execution
- **Brave Search integration** (60ccba9): Optional, graceful degradation
- **Update respects install type** (8384575): Preserves local vs global install
- **--auto flag** (7f49083): Unattended project initialization

**Architectural changes (evaluate):**
- **gsd-tools.js CLI** (8 commits): Foundation of v1.12-v1.18 architecture
- **Thin orchestrator refactoring** (d44c7dc + 2 others): 44 files changed, 22k chars (75.6%) reduced
- **Frontmatter CRUD/verification suite** (6a2d1f1): 1,037 new lines in gsd-tools
- **Context-optimizing parsing** (6c53737): state-snapshot, phase-plan-index, summary-extract

**Skip (not applicable to fork):**
- GSD Memory system (added then reverted)
- Community GitHub infrastructure (CODEOWNERS, issue templates, auto-label)
- README badge changes (Discord, X, $GSD token)
- Changelog/version bump commits (18 commits)
- Windows-specific fixes (4 commits) — low priority for our macOS/Linux users
- Removed files (CONTRIBUTING.md, GSD-STYLE.md, etc.)

### Architecture Approach (from ARCHITECTURE.md)

The fork has 12 overlapping files with upstream. The overlap analysis reveals:
- **High conflict (5 files):** bin/install.js, commands/gsd/help.md, commands/gsd/new-project.md, commands/gsd/update.md, package.json
- **Medium conflict (3 files):** get-shit-done/references/planning-config.md, get-shit-done/templates/research.md, hooks/gsd-check-update.js
- **Low conflict (4 files):** .gitignore, package-lock.json (regenerate), CHANGELOG.md (keep ours), README.md (keep ours)

**Major architectural changes from upstream:**
1. **Thin orchestrator pattern**: Commands reduced from 200-1000+ lines to 20-40 lines, all logic moved to workflow layer
2. **gsd-tools.js CLI**: 63 commands replace inline bash across 50+ files
3. **Agent spec condensation**: 60% reduction (net -2,298 lines across 9 agents) while maintaining identical behavior
4. **19 new workflow files**: Extracted from commands (add-phase, check-todos, help, new-project, plan-phase, etc.)
5. **Memory system ghost**: Added (af7a057) then reverted (cc3c6ac) — must ensure no ghost references remain

**Merge strategy recommendation:** `git merge upstream/main` with targeted manual resolution. Not rebase (70 commits too many), not cherry-pick (interdependent commits). A single merge commit captures the sync point for future merges.

**Conflict resolution approach:**
- `.gitignore`, `CHANGELOG.md`, `README.md`: Keep fork versions entirely
- `bin/install.js`: Accept upstream + re-apply branding (gets JSONC parser, patch preservation, Windows fixes)
- Commands (help, new-project, update): Accept upstream thin orchestrators, migrate fork logic to workflow layer
- `package.json`: Manual field merge (fork identity + upstream structure + merged deps)
- `package-lock.json`: Regenerate after package.json merge
- Hooks, planning-config, research template: Accept upstream + append/re-apply fork sections

**Post-merge adaptations:**
- **Phase A: Workflow layer migration** — DevOps detection from new-project.md moves to workflows/new-project.md
- **Phase B: Agent alignment** — Upstream agents now condensed and gsd-tools-aware, installed copies will update automatically
- **Phase C: gsd-tools integration** — Fork features can optionally use gsd-tools for state/config/commits

### Critical Pitfalls (from PITFALLS.md)

1. **The install.js three-way merge trap** — Three independent change streams (our branding, memory add/revert, post-revert changes) all touch install.js. Naive merge loses branding or introduces ghost code. Prevention: Manual semantic merge, test in isolation before proceeding.

2. **Thin orchestrator architecture mismatch** — Upstream moved logic from commands to workflows. Taking upstream commands without workflows breaks everything. Taking our commands without upstream workflows loses improvements. Prevention: Adopt architecture wholesale, port features onto new structure.

3. **Agent spec dual-location problem** — We have agents in both `agents/` (source) and `.claude/agents/` (installed copies). Upstream condensed agents by 60%. Must update both locations consistently without clobbering our custom agents (reflector, signal-collector, spike-runner, knowledge-store). Prevention: Update `agents/` first, then `.claude/agents/` copies, leave fork-unique agents untouched.

4. **package.json identity collision** — Both sides modified every field. Must keep our identity (name, bin, repository) but adopt upstream's structural changes (files array for gsd-tools.js). Prevention: Hand-resolve field by field, verify with `npm pack --dry-run`.

5. **Memory system ghost** — Upstream added gsd-memory/ (38 lines in researcher agents, 20 in new-project, 26 in complete-milestone, 16 in execute-phase) then reverted it. Three-way merge may reintroduce ghost references. Prevention: Grep for `memory`, `gsd_memory`, `gsd-memory`, `projects.json` after merge — must be zero hits except our own KB system.

6. **gsd-tools.js adoption gap** — Commands/workflows call gsd-tools but it may not be installed correctly, may not handle our fork config fields, or tests may never run. Prevention: Verify files array, run `node --test gsd-tools.test.js`, test against our config.json.

7. **Test suite fragility** — Our wiring-validation.test.js expects old pattern (inline command logic), will fail after thin orchestrator adoption. Prevention: Fix tests in order (install.test.js → wiring-validation.test.js → KB tests), don't skip failing tests.

8. **Version number confusion** — Fork at v1.12.2, upstream at v1.18.0. What version are we after merge? Prevention: Use semantic versioning based on our fork history (v1.13.0), document "Synced with upstream v1.18.0" in CHANGELOG.

## Implications for Roadmap

Based on research, this is not a traditional feature development roadmap. This is an **architectural migration with feature preservation**. The research reveals 5 distinct work streams that have dependencies on each other.

### Phase 1: Pre-Merge Preparation & Strategy
**Rationale:** The "additive only" constraint is dead (PITFALLS.md P10). Before touching code, we need strategic decisions and a clean snapshot.
**Delivers:**
- Decision on new fork maintenance strategy (use upstream's reapply-patches system)
- Snapshot of current fork state (all tests passing, documentation of what we've modified)
- Sync branch created
- Validation plan defined
**Addresses:** Risk of clinging to an unworkable constraint
**Avoids:** P10 (additive-only constraint confusion), sets up for P1-P5 mitigation

### Phase 2: Core Merge & Conflict Resolution
**Rationale:** The 12 overlapping files must be resolved correctly or everything downstream breaks. install.js must be first (foundation), then package.json (identity), then architecture (commands/agents).
**Delivers:**
- install.js merged (branding preserved, upstream features adopted) — addresses P1
- package.json merged (fork identity + upstream structure) — addresses P4
- CHANGELOG.md, README.md preserved (fork versions)
- Commands converted to thin orchestrators — addresses P2
- Agent specs updated (both locations) — addresses P3
- All memory ghost references purged — addresses P5
**Uses:** Manual semantic merge approach from ARCHITECTURE.md conflict resolution table
**Avoids:** P1 (install.js trap), P2 (architecture mismatch), P3 (dual-location), P4 (identity collision), P5 (memory ghost)
**Research flag:** HIGH — This is the most complex phase, requires deep understanding of both codebases

### Phase 3: gsd-tools Integration & Validation
**Rationale:** gsd-tools.js is the foundation of the new architecture. Must verify it works with our fork config before proceeding.
**Delivers:**
- gsd-tools.js and test suite adopted
- Files array updated in package.json
- gsd-tools tested against fork config.json (health_check, devops, gsd_reflect_version fields)
- Test suite passing: `node --test gsd-tools.test.js`
**Implements:** STACK.md adoption recommendation (gsd-tools CLI)
**Avoids:** P6 (gsd-tools adoption gap)
**Research flag:** MEDIUM — Test-driven validation, straightforward once merge is clean

### Phase 4: Fork Feature Migration to Workflow Layer
**Rationale:** Our fork features (DevOps detection, help content, package name references) were in command files. Upstream moved logic to workflow layer. Must port our features.
**Delivers:**
- DevOps detection migrated from commands/gsd/new-project.md to workflows/new-project-reflect.md or extended upstream workflow
- Fork help content added to workflows/help.md
- Package name references updated in workflows/update.md
- Fork-specific workflow files verified (collect-signals, reflect, run-spike) — unchanged, already follow thin pattern
**Addresses:** Feature preservation after architectural migration
**Avoids:** P2 (losing features due to architecture mismatch)

### Phase 5: Test Suite Repair & CI/CD Validation
**Rationale:** Tests will break after the architectural migration. They are the primary merge correctness signal. Must fix in dependency order.
**Delivers:**
- install.test.js updated (new banner, new directory structure)
- wiring-validation.test.js updated (recognize thin orchestrator pattern)
- KB tests verified (unchanged, still passing)
- gsd-tools tests integrated into CI workflow
- CI/CD workflows validated (.github/workflows/ci.yml, publish.yml, smoke-test.yml)
- CODEOWNERS skipped (upstream's @glittercowboy not our maintainer)
- Issue templates updated or skipped
**Avoids:** P7 (test suite fragility), P8 (CI/CD workflow collision)
**Research flag:** LOW — Test-driven, clear pass/fail criteria

### Phase 6: Version, Documentation, Release
**Rationale:** After all code and tests are validated, set version and document what changed.
**Delivers:**
- Version set to 1.13.0 (semantic versioning for our fork)
- CHANGELOG.md updated: "Synced with upstream GSD v1.18.0" with adoption summary
- gsd_reflect_version in config.json updated to 1.13.0
- Release notes documenting: (1) Upstream sync, (2) Bug fixes adopted, (3) Breaking changes (if any), (4) Fork features preserved
**Avoids:** P9 (version confusion)

### Phase 7: Dogfooding — Signal Tracking & KB Building
**Rationale:** This sync milestone is perfect for dogfooding our fork's features (signals, knowledge base, reflection). Capture learnings for validation.
**Delivers:**
- Signal collection during each phase (architecture decisions, merge conflicts resolved, patterns learned)
- Knowledge base entries for: (1) Upstream sync process, (2) gsd-tools CLI usage, (3) Thin orchestrator pattern, (4) Fork maintenance strategy
- Health check validation after merge (infrastructure integrity)
- Reflection at milestone completion (process retrospective)
**Uses:** Fork-specific features (collect-signals, signal, health-check, reflect)
**Implements:** Validates that our fork features still work after architecture migration

### Phase Ordering Rationale

- **Phase 1 before 2:** Strategic decisions must be made before touching code, otherwise mid-merge confusion
- **Phase 2 before 3:** Core merge must complete before validating gsd-tools, since gsd-tools is part of the merge
- **Phase 3 before 4:** gsd-tools must work before porting fork features that might use it
- **Phase 4 before 5:** Fork features must be migrated before testing, since tests validate feature presence
- **Phase 5 before 6:** All tests must pass before versioning/release
- **Phase 7 parallel:** Signal tracking happens throughout Phases 2-6, synthesis at the end

### Research Flags

**Phases needing deeper research during planning:**
- **Phase 2 (Core Merge):** Complex, high-stakes. Needs detailed plan for each of the 12 conflict files. Consider sub-phasing: 2.1 install.js, 2.2 package.json, 2.3 commands, 2.4 agents, 2.5 validation.
- **Phase 4 (Feature Migration):** Depends on upstream's workflow structure which we haven't fully analyzed. May need research-phase to understand workflow extension patterns.

**Phases with standard patterns (skip research):**
- **Phase 1 (Preparation):** Snapshot and strategy — standard git workflow
- **Phase 3 (gsd-tools Integration):** Test-driven validation — clear acceptance criteria
- **Phase 5 (Test Repair):** Test-driven — clear pass/fail
- **Phase 6 (Version/Docs):** Administrative — no technical complexity
- **Phase 7 (Dogfooding):** Uses existing fork features — known patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Direct source analysis of gsd-tools.js (4,597 lines), test suite (2,033 lines), and all usage across 50+ files. Zero-dependency philosophy verified. |
| Features | HIGH | All 70 commits examined via `git diff`. Bug fixes categorized by severity, features by adoption priority. Overlap analysis confirmed with git diff on 12 files. |
| Architecture | HIGH | Detailed git diff analysis of both codebases. Conflict resolution strategy grounded in actual file contents. Thin orchestrator pattern verified across all command/workflow pairs. |
| Pitfalls | HIGH | All pitfalls grounded in actual codebase analysis (git diffs showing three-way merge issues, memory add/revert tracked through commits, dual-location confirmed via ls). Community sources provide context but not the primary findings. |

**Overall confidence:** HIGH

The research is grounded in direct git analysis of this repository and upstream. Every finding is traceable to specific commits, files, and line numbers. The only uncertainty is execution risk (merge conflicts are complex), not analysis risk.

### Gaps to Address

- **Upstream workflow extension patterns:** We haven't fully analyzed how to extend upstream's workflow files without modifying them. Phase 4 planning may need research-phase to understand best practices for workflow composition.

- **gsd-tools extensibility:** The research confirms gsd-tools can be extended (add new commands) but doesn't detail the best approach (modify gsd-tools.js vs. create gsd-reflect-tools.js). Decision needed during Phase 3 planning.

- **Installer behavior changes:** Upstream's installer now writes `gsd-file-manifest.json`, backs up patches, handles JSONC. We need to verify these features don't conflict with our fork's installation needs. Validation during Phase 3.

- **Windows fixes relevance:** Skipped 4 Windows-specific commits as low priority for our macOS/Linux users. If we expand platform support later, revisit: 1344bd8 (detached:true), ced41d7 (HEREDOC), 1c6a35f (backslashes), dac502f (gsd-tools merge).

## Sources

### Primary (HIGH confidence)
- Direct git diff analysis: `git log --oneline 2347fca..upstream/main` (70 commits)
- `git show upstream/main:get-shit-done/bin/gsd-tools.js` — Full 4,597-line source
- `git show upstream/main:get-shit-done/bin/gsd-tools.test.js` — Full 2,033-line test suite
- `git diff --stat` and `git diff` for all must-adopt and should-adopt commits
- `git diff HEAD upstream/main --name-only` for overlap analysis
- `git diff 2347fca..HEAD --name-only` for fork modification tracking
- Commit messages and linked issue numbers for bug fix context

### Secondary (MEDIUM confidence)
- Best Practices for Keeping a Forked Repository Up to Date (GitHub Community)
- Stop Forking Around: Hidden Dangers of Fork Drift (Preset)
- Friend Zone: Strategies for Friendly Fork Management (GitHub Blog)
- Git Merge Strategy Options (Atlassian)
- Git Tricks for Maintaining a Long-Lived Fork (die-antwort.eu)
- Lessons Learned from Maintaining a Fork (DEV Community)
- npm Trusted Publishing with OIDC (GitHub Changelog)
- Soft Fork Strategy Handbook (Open Energy Transition)

---
*Research completed: 2026-02-09*
*Ready for roadmap: yes*
