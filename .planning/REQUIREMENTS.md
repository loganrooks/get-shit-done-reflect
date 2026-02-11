# Requirements: GSD Reflect v1.13 — Upstream Sync & Validation

**Defined:** 2026-02-09
**Core Value:** The fork stays current with upstream GSD while validating that gsd-reflect's self-improvement features work in production.

## v1.13 Requirements

Requirements for upstream sync milestone. Each maps to roadmap phases.

### Fork Strategy

- [x] **FORK-01**: Formally retire "additive only" fork constraint and document new tracked-modifications strategy
- [x] **FORK-02**: Adopt upstream's reapply-patches feature for managing fork modifications across updates

### Upstream Bug Fixes

- [x] **FIX-01**: Executor completion verification prevents hallucinated success (f380275)
- [x] **FIX-02**: Context fidelity enforcement in planning pipeline (ecbc692)
- [x] **FIX-03**: Respect parallelization config setting (4267c6c)
- [x] **FIX-04**: Researcher always writes RESEARCH.md regardless of commit_docs (161aa61)
- [x] **FIX-05**: commit_docs=false respected in all .planning commit paths (01c9115)
- [x] **FIX-06**: Auto-create config.json when missing (4dff989)
- [x] **FIX-07**: Statusline crash handling, color validation, git staging rules (9d7ea9c)
- [x] **FIX-08**: Update statusline.js reference during install (074b2bc)
- [x] **FIX-09**: Prevent API keys from being committed via map-codebase (f53011c)
- [x] **FIX-10**: Executor explicitly specifies subagent_type="gsd-executor" (4249506)
- [x] **FIX-11**: Workaround for Claude Code classifyHandoffIfNeeded bug (4072fd2)

### Architecture Adoption

- [ ] **ARCH-01**: Adopt gsd-tools.js CLI (4,597 lines) as foundation for deterministic operations
- [ ] **ARCH-02**: Adopt thin orchestrator pattern — commands delegate to workflows, workflows use gsd-tools
- [ ] **ARCH-03**: Accept upstream agent spec condensation (60% reduction across 9 agents)
- [ ] **ARCH-04**: Accept all new upstream workflow files (19 files) as extracted workflow layer
- [ ] **ARCH-05**: Accept new reference files (decimal-phase-calculation, git-planning-commit, model-profile-resolution, phase-argument-parsing)
- [ ] **ARCH-06**: Accept new summary templates (minimal, standard, complex)
- [ ] **ARCH-07**: Verify gsd-tools.js works with fork's config.json extensions (health_check, devops, gsd_reflect_version)

### Merge & Integration

- [x] **MERGE-01**: Resolve 8 overlapping files between fork and upstream (8 actual conflicts, 3 predicted auto-resolved)
- [x] **MERGE-02**: Preserve fork branding in install.js (banner, package name, help text, version-check hook)
- [x] **MERGE-03**: Migrate fork-specific command logic to workflow layer (DevOps detection, help content, package refs)
- [x] **MERGE-04**: Verify no memory system ghost references (grep for gsd_memory, gsd-memory, projects.json)
- [x] **MERGE-05**: Update package.json with correct fork identity + upstream file additions
- [x] **MERGE-06**: Regenerate package-lock.json after package.json merge

### Upstream Features

- [ ] **FEAT-01**: Preserve local patches across GSD updates (ca03a06) — reapply-patches command
- [ ] **FEAT-02**: --auto flag for unattended project initialization (7f49083)
- [ ] **FEAT-03**: --include flag for eliminating redundant file reads (fa81821 + 01c9115)
- [ ] **FEAT-04**: Brave Search integration for researchers (60ccba9)
- [ ] **FEAT-05**: Local vs global install detection in update command (8384575)
- [ ] **FEAT-06**: JSONC parsing in installer to prevent opencode.json deletion (6cf4a4e)
- [ ] **FEAT-07**: Persist research decision from new-milestone to config (767bef6)

### Testing & Validation

- [ ] **TEST-01**: Fork's existing test suite passes after merge (42 tests, vitest)
- [ ] **TEST-02**: Upstream's gsd-tools test suite passes (63 tests, node:test)
- [ ] **TEST-03**: Update wiring validation test for thin orchestrator pattern
- [ ] **TEST-04**: Update install test for merged installer behavior
- [ ] **TEST-05**: CI/CD workflows intact — no CODEOWNERS blocking, correct OIDC identity, all three fork workflows functional

### Dogfooding (gsd-reflect Validation)

- [ ] **DOG-01**: Run /gsd:collect-signals after each merge/integration phase
- [ ] **DOG-02**: Knowledge base entries generated from merge experience (signals -> lessons)
- [ ] **DOG-03**: Run /gsd:reflect at milestone end to distill learnings
- [ ] **DOG-04**: Capture comparison: our file-based KB approach vs upstream's reverted MCP approach

## Future Requirements

Deferred to later milestones.

### Fork-Specific Extensions

- **EXT-01**: Create gsd-reflect-tools.js with fork-specific CLI commands (reflect init, signals list, kb-search, kb-stats)
- **EXT-02**: Integrate knowledge base operations with gsd-tools frontmatter CRUD
- **EXT-03**: Context bar investigation — verify Opus 4.6 1M context window reflected correctly

### Upstream Catch-Up

- **CATCH-01**: Windows compatibility fixes (detached:true, HEREDOC, backslash normalization)
- **CATCH-02**: SECURITY.md adoption with fork-specific contact info

## Out of Scope

| Feature | Reason |
|---------|--------|
| Modifying gsd-tools.js directly | Fork constraint: upstream file, modifications go in separate gsd-reflect-tools.js |
| Upstream community files (CODEOWNERS, issue templates, auto-label) | Community-specific to upstream maintainer |
| Upstream README badges (Discord, X, Dexscreener) | Fork has its own README |
| GSD Memory system adoption | Upstream reverted it; our knowledge base is architecturally different and better suited |
| Any new gsd-reflect features | This milestone is sync + validation, not new features |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORK-01 | Phase 7 | Complete |
| FORK-02 | Phase 7 | Complete |
| FIX-01 | Phase 8 | Complete |
| FIX-02 | Phase 8 | Complete |
| FIX-03 | Phase 8 | Complete |
| FIX-04 | Phase 8 | Complete |
| FIX-05 | Phase 8 | Complete |
| FIX-06 | Phase 8 | Complete |
| FIX-07 | Phase 8 | Complete |
| FIX-08 | Phase 8 | Complete |
| FIX-09 | Phase 8 | Complete |
| FIX-10 | Phase 8 | Complete |
| FIX-11 | Phase 8 | Complete |
| ARCH-01 | Phase 9 | Pending |
| ARCH-02 | Phase 9 | Pending |
| ARCH-03 | Phase 9 | Pending |
| ARCH-04 | Phase 9 | Pending |
| ARCH-05 | Phase 9 | Pending |
| ARCH-06 | Phase 9 | Pending |
| ARCH-07 | Phase 9 | Pending |
| MERGE-01 | Phase 8 | Complete |
| MERGE-02 | Phase 8 | Complete |
| MERGE-03 | Phase 8 | Complete |
| MERGE-04 | Phase 8 | Complete |
| MERGE-05 | Phase 8 | Complete |
| MERGE-06 | Phase 8 | Complete |
| FEAT-01 | Phase 10 | Pending |
| FEAT-02 | Phase 10 | Pending |
| FEAT-03 | Phase 10 | Pending |
| FEAT-04 | Phase 10 | Pending |
| FEAT-05 | Phase 10 | Pending |
| FEAT-06 | Phase 10 | Pending |
| FEAT-07 | Phase 10 | Pending |
| TEST-01 | Phase 11 | Pending |
| TEST-02 | Phase 11 | Pending |
| TEST-03 | Phase 11 | Pending |
| TEST-04 | Phase 11 | Pending |
| TEST-05 | Phase 11 | Pending |
| DOG-01 | Phase 12 | Pending |
| DOG-02 | Phase 12 | Pending |
| DOG-03 | Phase 12 | Pending |
| DOG-04 | Phase 12 | Pending |

**Coverage:**
- v1.13 requirements: 42 total
- Mapped to phases: 42/42
- Unmapped: 0

---
*Requirements defined: 2026-02-09*
*Last updated: 2026-02-10 after Phase 8 completion (FIX-01–11, MERGE-01–06 complete)*
