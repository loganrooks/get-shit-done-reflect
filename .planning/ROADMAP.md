# Roadmap: GSD Reflect v1.13 — Upstream Sync & Validation

## Overview

This milestone synchronizes the fork with 70 upstream GSD commits (v1.11.2 to v1.18.0), adopting the gsd-tools CLI architecture, 11 bug fixes, and 7 features while preserving fork identity and validating gsd-reflect's signal tracking and knowledge base in production. The work is an architectural migration executed as a single merge with staged verification, not traditional feature development.

## Milestones

- v1.12 GSD Reflect (Phases 0-6) — shipped 2026-02-09
- v1.13 Upstream Sync & Validation (Phases 7-12) — in progress

## Phases

**Phase Numbering:**
- Integer phases (7, 8, 9...): Planned milestone work (continues from v1.12 Phase 6)
- Decimal phases (8.1, 8.2): Urgent insertions if needed (marked with INSERTED)

- [ ] **Phase 7: Fork Strategy & Pre-Merge Setup** - Retire additive-only constraint, adopt tracked-modifications strategy, prepare sync branch
- [ ] **Phase 8: Core Merge & Conflict Resolution** - Execute git merge, resolve 12 conflict files, apply bug fixes, preserve fork identity
- [ ] **Phase 9: Architecture Adoption & Verification** - Verify gsd-tools.js, thin orchestrator, and all additive architecture pieces function with fork
- [ ] **Phase 10: Upstream Feature Verification** - Verify adopted features work in fork context
- [ ] **Phase 11: Test Suite Repair & CI/CD Validation** - Fix broken tests, integrate new test suites, validate CI/CD pipelines
- [ ] **Phase 12: Release & Dogfooding** - Version, document, release, and run reflection to validate gsd-reflect features

## Phase Details

### Phase 7: Fork Strategy & Pre-Merge Setup
**Goal**: The fork has a documented maintenance strategy and a clean branch ready for the upstream merge
**Depends on**: Nothing (first phase of v1.13)
**Requirements**: FORK-01, FORK-02
**Success Criteria** (what must be TRUE):
  1. The "additive only" constraint is formally retired and a tracked-modifications strategy document exists explaining how fork divergences are managed going forward
  2. The upstream reapply-patches mechanism is understood and adopted as the fork's patch preservation approach
  3. A sync branch exists with the current fork state snapshotted (all tests passing) before any merge begins
**Plans**: 2 plans

Plans:
- [ ] 07-01-PLAN.md -- Fork strategy & divergence documentation
- [ ] 07-02-PLAN.md -- Fix tests & create pre-merge snapshot

### Phase 8: Core Merge & Conflict Resolution
**Goal**: All 70 upstream commits are merged into the fork with 12 conflict files correctly resolved, all bug fixes applied, and fork identity preserved
**Depends on**: Phase 7
**Requirements**: MERGE-01, MERGE-02, MERGE-03, MERGE-04, MERGE-05, MERGE-06, FIX-01, FIX-02, FIX-03, FIX-04, FIX-05, FIX-06, FIX-07, FIX-08, FIX-09, FIX-10, FIX-11
**Success Criteria** (what must be TRUE):
  1. Running `git log --oneline upstream/main..HEAD` shows all 70 upstream commits are ancestors of the current branch (merge is complete)
  2. The installer (`bin/install.js`) displays fork branding (GSD Reflect banner, package name, help text) while incorporating upstream's JSONC parsing, patch preservation, and statusline reference update
  3. `package.json` has fork identity (name: get-shit-done-reflect, correct repository/bin) with upstream's structural additions (files array including gsd-tools.js)
  4. Running `grep -r "gsd_memory\|gsd-memory\|projects\.json" --include="*.md" --include="*.js"` returns zero hits (no memory system ghost references remain, excluding our knowledge base)
  5. All 11 upstream bug fixes are present in the merged code (executor verification, context fidelity, parallelization, commit_docs, auto-create config, statusline crash, API key prevention, subagent_type, classifyHandoffIfNeeded)
**Plans**: TBD

Plans:
- [ ] 08-01: TBD
- [ ] 08-02: TBD

### Phase 9: Architecture Adoption & Verification
**Goal**: The gsd-tools CLI, thin orchestrator pattern, condensed agent specs, and all additive architecture pieces are verified to work with the fork's configuration and features
**Depends on**: Phase 8
**Requirements**: ARCH-01, ARCH-02, ARCH-03, ARCH-04, ARCH-05, ARCH-06, ARCH-07
**Success Criteria** (what must be TRUE):
  1. Running `node get-shit-done/bin/gsd-tools.js --help` shows available commands and exits cleanly
  2. Running `node get-shit-done/bin/gsd-tools.js config get .planning/config.json depth` correctly reads fork config including custom fields (health_check, devops, gsd_reflect_version)
  3. Fork-specific command logic (DevOps detection, help content, package references) has been migrated from old command files to the workflow layer, verified by the commands delegating to workflows
  4. The 19 new workflow files, 4 new reference files, and 3 new summary templates are present and syntactically valid
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Upstream Feature Verification
**Goal**: All 7 adopted upstream features function correctly within the fork context
**Depends on**: Phase 9
**Requirements**: FEAT-01, FEAT-02, FEAT-03, FEAT-04, FEAT-05, FEAT-06, FEAT-07
**Success Criteria** (what must be TRUE):
  1. Running `node get-shit-done/bin/gsd-tools.js` with the reapply-patches workflow correctly detects, backs up, and restores local patches (FEAT-01)
  2. The --auto flag enables unattended project initialization without interactive prompts (FEAT-02)
  3. The --include flag is recognized by commands and eliminates redundant file reads (FEAT-03)
  4. The update command correctly detects local vs global install and uses the appropriate update mechanism (FEAT-05)
  5. The research decision from new-milestone persists to config.json and is respected in subsequent workflows (FEAT-07)
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

### Phase 11: Test Suite Repair & CI/CD Validation
**Goal**: All test suites pass and CI/CD pipelines are fully functional after the architectural migration
**Depends on**: Phase 10
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05
**Success Criteria** (what must be TRUE):
  1. Running `npx vitest run` passes all fork tests (42+ tests) including updated wiring validation and install tests
  2. Running `node --test get-shit-done/bin/gsd-tools.test.js` passes all 63 upstream gsd-tools tests
  3. All three CI/CD workflows (ci.yml, publish.yml, smoke-test.yml) pass on a push to the sync branch, with correct OIDC identity and no CODEOWNERS blocking
  4. The wiring validation test correctly validates the thin orchestrator pattern (commands delegate to workflows) rather than the old inline-logic pattern
**Plans**: TBD

Plans:
- [ ] 11-01: TBD

### Phase 12: Release & Dogfooding
**Goal**: v1.13.0 is versioned and released, with gsd-reflect's signal tracking and knowledge base validated through production use during this milestone
**Depends on**: Phase 11
**Requirements**: DOG-01, DOG-02, DOG-03, DOG-04
**Success Criteria** (what must be TRUE):
  1. Signal entries exist in `~/.claude/gsd-knowledge/signals/` capturing merge decisions, conflict resolution patterns, and architecture adoption experiences from Phases 8-11 (DOG-01)
  2. Knowledge base lessons have been generated from the accumulated signals, including at least one lesson about the upstream sync process (DOG-02)
  3. Running `/gsd:reflect` produces a reflection report distilling the v1.13 experience with actionable insights (DOG-03)
  4. A documented comparison exists between our file-based knowledge base approach and upstream's reverted MCP-based GSD Memory approach, grounded in actual production use (DOG-04)
  5. Version is set to 1.13.0 in package.json, config.json (gsd_reflect_version), and CHANGELOG.md documents the sync with upstream v1.18.0
**Plans**: TBD

Plans:
- [ ] 12-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10 -> 11 -> 12

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 7. Fork Strategy & Pre-Merge Setup | v1.13 | 0/2 | Planned | - |
| 8. Core Merge & Conflict Resolution | v1.13 | 0/TBD | Not started | - |
| 9. Architecture Adoption & Verification | v1.13 | 0/TBD | Not started | - |
| 10. Upstream Feature Verification | v1.13 | 0/TBD | Not started | - |
| 11. Test Suite Repair & CI/CD Validation | v1.13 | 0/TBD | Not started | - |
| 12. Release & Dogfooding | v1.13 | 0/TBD | Not started | - |
