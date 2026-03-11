# Roadmap: GSD Reflect

## Milestones

- <details><summary>v1.12 GSD Reflect (Phases 0-6) -- SHIPPED 2026-02-09</summary>See milestones/v1.12-ROADMAP.md</details>
- <details><summary>v1.13 Upstream Sync & Validation (Phases 7-12) -- SHIPPED 2026-02-11</summary>See milestones/v1.13-ROADMAP.md</details>
- <details><summary>v1.14 Multi-Runtime Interop (Phases 13-21) -- SHIPPED 2026-02-16</summary>See milestones/v1.14-ROADMAP.md</details>
- <details><summary>v1.15 Backlog & Update Experience (Phases 22-30) -- SHIPPED 2026-02-23</summary>See milestones/v1.15-ROADMAP.md</details>
- <details><summary>v1.16 Signal Lifecycle & Reflection (Phases 31-35) -- SHIPPED 2026-03-02</summary>See milestones/v1.16-ROADMAP.md</details>
- <details><summary>v1.17 Automation Loop (Phases 36-44) -- SHIPPED 2026-03-09</summary>See milestones/v1.17-ROADMAP.md</details>

### v1.18 Upstream Sync & Deep Integration (In Progress)

**Milestone Goal:** Properly adopt upstream changes informed by the fork audit, redistribute the fork's 2,126 lines across upstream's modular structure, establish a durable sync policy, harden the migration system, and ensure adopted features integrate deeply with the fork's epistemic self-improvement pipeline -- not as isolated patches.

## Phases

**Phase Numbering:**
- Integer phases (45, 46, 47...): Planned milestone work
- Decimal phases (46.1, 46.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 45: CJS Rename** - Rename gsd-tools.js to gsd-tools.cjs with all 56 shell references updated (zero functional changes)
- [ ] **Phase 46: Upstream Module Adoption** - Adopt upstream's 11 lib/*.cjs modules, rewrite dispatcher, extract shared helpers to core.cjs
- [ ] **Phase 47: Fork Module Extraction** - Extract 5 new fork modules (sensors, backlog, manifest, automation, health-probe) in dependency order
- [ ] **Phase 48: Module Extensions & Verification** - Extend frontmatter.cjs and init.cjs with fork additions, verify all tests pass with zero behavioral changes
- [ ] **Phase 49: Config Migration** - Implement manifest migrations[] array, apply depth-to-granularity rename, update workflows and version-migration spec
- [ ] **Phase 50: Migration Test Hardening** - Full-corpus namespace scan, idempotency tests, crash recovery, behavioral equivalence, integration depth tests
- [ ] **Phase 51: Update System Hardening** - Installer generates migration guides, stale file cleanup, hook re-registration, upgrade testing
- [ ] **Phase 52: Feature Adoption** - Adopt context-monitor, Nyquist auditor, code-aware discuss-phase, upstream workflows, and supporting features
- [ ] **Phase 53: Deep Integration** - Weave adopted features into fork's signal/automation/health/reflection pipeline
- [ ] **Phase 54: Infrastructure & Documentation** - CI cache fix, deliberation update, fork divergence docs, upstream sync policy

## Phase Details

### Phase 45: CJS Rename
**Goal**: The fork's runtime entry point uses the .cjs extension matching upstream's modular structure, enabling all subsequent module adoption
**Depends on**: Nothing (first phase of v1.18)
**Requirements**: MOD-01
**Success Criteria** (what must be TRUE):
  1. Running `gsd-tools.cjs` from any hook or shell script produces identical output to the previous `gsd-tools.js`
  2. All 278 existing vitest tests pass without modification
  3. No shell script, hook, or workflow file references `gsd-tools.js` (the old name)
**Plans**: TBD

Plans:
- [ ] 45-01: TBD
- [ ] 45-02: TBD

### Phase 46: Upstream Module Adoption
**Goal**: The CLI dispatcher routes commands through upstream's 11 modular files and shared fork helpers live in core.cjs, replacing the monolith's inline function definitions
**Depends on**: Phase 45
**Requirements**: MOD-02, MOD-03
**Success Criteria** (what must be TRUE):
  1. `gsd-tools.cjs` is a thin dispatcher (~600 lines) that requires lib/*.cjs modules rather than defining command handlers inline
  2. The 4 shared helpers (loadManifest, loadProjectConfig, atomicWriteJson, parseIncludeFlag) are importable from `lib/core.cjs` by any module
  3. All 11 upstream module files exist in `lib/` and each handles its expected command set
  4. All 278 existing vitest tests pass without modification
**Plans**: TBD

Plans:
- [ ] 46-01: TBD
- [ ] 46-02: TBD
- [ ] 46-03: TBD

### Phase 47: Fork Module Extraction
**Goal**: The fork's 2,126 lines of additions are distributed across 5 dedicated modules, each owning a coherent command set with no cross-module circular dependencies
**Depends on**: Phase 46
**Requirements**: MOD-04, MOD-05, MOD-06, MOD-07, MOD-08
**Success Criteria** (what must be TRUE):
  1. `sensors.cjs` handles `sensors-list` and `sensors-blind-spots` commands end-to-end
  2. `backlog.cjs` handles all 7 backlog subcommands (`add`, `list`, `show`, `update`, `promote`, `scope`, `review`)
  3. `manifest.cjs` handles all 6 manifest commands (`diff-config`, `validate`, `apply-migration`, `get-prompts`, `features`, `show`)
  4. `automation.cjs` handles all 7 automation commands and exports FEATURE_CAPABILITY_MAP
  5. `health-probe.cjs` handles 3 probe functions and 3 KB helper functions
**Plans**: TBD

Plans:
- [ ] 47-01: TBD
- [ ] 47-02: TBD
- [ ] 47-03: TBD
- [ ] 47-04: TBD
- [ ] 47-05: TBD

### Phase 48: Module Extensions & Verification
**Goal**: Upstream's frontmatter and init modules are extended with fork-specific capabilities, and the entire modularization is verified as behaviorally equivalent to the pre-modularization monolith
**Depends on**: Phase 47
**Requirements**: MOD-09, MOD-10, MOD-11
**Success Criteria** (what must be TRUE):
  1. `frontmatter.cjs` validates signal YAML using tiered validation (required/conditional/recommended fields)
  2. `init.cjs` accepts the `--include` flag and applies fork-specific init function modifications
  3. All 278 existing vitest tests pass with zero behavioral changes from the pre-modularization baseline
  4. CLI output for every command is identical before and after modularization (verified by behavioral equivalence spot checks)
**Plans**: TBD

Plans:
- [ ] 48-01: TBD
- [ ] 48-02: TBD

### Phase 49: Config Migration
**Goal**: The manifest-driven migration system supports declarative field renames, the depth-to-granularity breaking change is absorbed programmatically, and multi-version upgrade paths work end-to-end
**Depends on**: Phase 48
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, CFG-06, CFG-07
**Success Criteria** (what must be TRUE):
  1. A project with `depth: "fine"` in config.json automatically migrates to `granularity: "fine"` on upgrade without user intervention
  2. Config fields from upstream that the fork does not recognize are preserved through migration (not deleted)
  3. A config from v1.14 can upgrade through v1.15, v1.16, v1.17, v1.18 in sequence and arrive at the correct v1.18 config
  4. The 3 workflow files that referenced `depth` now use `granularity` terminology consistently
  5. version-migration.md documents the controlled-exception mechanism for renames
**Plans**: TBD

Plans:
- [ ] 49-01: TBD
- [ ] 49-02: TBD
- [ ] 49-03: TBD

### Phase 50: Migration Test Hardening
**Goal**: The migration, installation, and namespace rewriting pipelines are tested against the edge cases and failure modes identified in the fork audit, preventing regressions as features are adopted
**Depends on**: Phase 49
**Requirements**: TST-01, TST-02, TST-03, TST-04, TST-05, TST-06, TST-07, TST-08, TST-09
**Success Criteria** (what must be TRUE):
  1. A full-corpus scan of installed files finds zero stale `gsd:`/`gsd-`/`get-shit-done/` references (namespace integrity verified)
  2. Running `apply-migration` N times on the same config produces identical output each time (idempotency)
  3. A simulated crash during KB migration leaves no partial state (cleanup verified)
  4. Each extracted module produces identical CLI output to the pre-extraction monolith for its command set
  5. Snapshot regression tests catch any unintended namespace rewriting changes
**Plans**: TBD

Plans:
- [ ] 50-01: TBD
- [ ] 50-02: TBD
- [ ] 50-03: TBD

### Phase 51: Update System Hardening
**Goal**: The installer produces actionable migration guides for version-jump upgrades, cleans up stale pre-modularization files, and the full v1.17→v1.18 upgrade path is tested end-to-end
**Depends on**: Phase 50
**Requirements**: UPD-01, UPD-02, UPD-03, UPD-04, UPD-05, UPD-06
**Success Criteria** (what must be TRUE):
  1. Running installer on a v1.17 installation generates MIGRATION-GUIDE.md with relevant per-version sections
  2. Stale gsd-tools.js (pre-modularization) is removed and lib/*.cjs modules are in place after upgrade
  3. Hook registration reflects v1.18 state (new hooks added, stale hooks removed)
  4. Fresh install produces no MIGRATION-GUIDE.md (no migration noise for new users)
  5. v1.17 installation upgrades to v1.18 with all .planning/ artifacts intact and config.json migrated
**Plans**: TBD

**Open design decisions (resolve during phase planning):**
- Compound vs sequential vs hybrid for advisory sections
- Whether /gsdr:upgrade-project consumes the guide or is replaced by it
- How migration guide is auto-triggered after installer runs inside a Claude session
- Per-version migration spec format and storage location

Plans:
- [ ] 51-01: TBD
- [ ] 51-02: TBD
- [ ] 51-03: TBD

### Phase 52: Feature Adoption
**Goal**: Upstream features (context-monitor, Nyquist auditor, code-aware discuss-phase, supporting workflows, and utility improvements) are adopted into the fork with correct namespace rewriting
**Depends on**: Phase 51
**Requirements**: ADT-01, ADT-02, ADT-03, ADT-04, ADT-05, ADT-06, ADT-07, ADT-08, ADT-09, ADT-10
**Success Criteria** (what must be TRUE):
  1. The context-monitor hook writes bridge file data that is readable by the statusline hook
  2. The Nyquist auditor agent runs under `gsdr-nyquist-auditor` namespace and produces VALIDATION.md
  3. The discuss-phase workflow includes codebase scouting (+328 lines) and produces `<code_context>` in CONTEXT.md
  4. All 4 adopted workflows (add-tests, cleanup, health, validate-phase) are installed with `gsdr:` prefix
  5. `CLAUDE_CONFIG_DIR` environment variable is respected in all paths that previously hardcoded `~/.claude`
**Plans**: TBD

Plans:
- [ ] 52-01: TBD
- [ ] 52-02: TBD
- [ ] 52-03: TBD
- [ ] 52-04: TBD

### Phase 53: Deep Integration
**Goal**: Every adopted feature is woven into the fork's signal/automation/health/reflection pipeline so that feature activity generates epistemic value -- the system learns from what these features observe
**Depends on**: Phase 52
**Requirements**: INT-01, INT-02, INT-03, INT-04, INT-05, INT-06, INT-07, INT-08
**Success Criteria** (what must be TRUE):
  1. When context usage exceeds threshold, automation deferral triggers using bridge file data (not wave-count estimation)
  2. Nyquist validation gaps in VALIDATION.md are detected by the artifact sensor and appear as signals in the knowledge base
  3. The discuss-phase workflow surfaces relevant KB knowledge alongside codebase scouting results
  4. Running the cleanup workflow does NOT delete `.planning/knowledge/`, `.planning/deliberations/`, or `.planning/backlog/`
  5. The automation framework's `resolve-level` recognizes newly adopted features for level-based triggering
**Plans**: TBD

Plans:
- [ ] 53-01: TBD
- [ ] 53-02: TBD
- [ ] 53-03: TBD
- [ ] 53-04: TBD

### Phase 54: Infrastructure & Documentation
**Goal**: CI reliability is restored, fork governance documents reflect the v1.18 sync state, and the upstream sync policy is formalized for future milestones
**Depends on**: Phase 48 (modularization complete; independent of Phases 49-53 but placed last for milestone coherence)
**Requirements**: INF-01, INF-02, INF-03, INF-04
**Success Criteria** (what must be TRUE):
  1. CI status cache includes repo and branch in its cache key, preventing cross-project pollution
  2. The v1.17+ roadmap deliberation document reflects upstream sync as a completed milestone theme
  3. FORK-DIVERGENCES.md reflects the v1.18 module structure and updated merge stances for all modified files
  4. FORK-STRATEGY.md documents cadence, what-to-adopt criteria, and integration depth standards for future upstream syncs
**Plans**: TBD

Plans:
- [ ] 54-01: TBD
- [ ] 54-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 45 -> 46 -> 47 -> 48 -> 49 -> 50 -> 51 -> 52 -> 53 -> 54

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 45. CJS Rename | 0/TBD | Not started | - |
| 46. Upstream Module Adoption | 0/TBD | Not started | - |
| 47. Fork Module Extraction | 0/TBD | Not started | - |
| 48. Module Extensions & Verification | 0/TBD | Not started | - |
| 49. Config Migration | 0/TBD | Not started | - |
| 50. Migration Test Hardening | 0/TBD | Not started | - |
| 51. Update System Hardening | 0/TBD | Not started | - |
| 52. Feature Adoption | 0/TBD | Not started | - |
| 53. Deep Integration | 0/TBD | Not started | - |
| 54. Infrastructure & Documentation | 0/TBD | Not started | - |

## Overall Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.12 GSD Reflect | 0-6 | 25 | Complete | 2026-02-09 |
| v1.13 Upstream Sync | 7-12 | 18 | Complete | 2026-02-11 |
| v1.14 Multi-Runtime | 13-21 | 18 | Complete | 2026-02-16 |
| v1.15 Backlog & Update | 22-30 | 24 | Complete | 2026-02-23 |
| v1.16 Signal Lifecycle | 31-35 | 20 | Complete | 2026-03-02 |
| v1.17 Automation Loop | 36-44 | 24 | Complete | 2026-03-09 |
| v1.18 Upstream Sync & Deep Integration | 45-54 | TBD | In Progress | - |

**Totals:** 7 milestones, 54 phases (44 complete + 10 planned), 129 plans completed
