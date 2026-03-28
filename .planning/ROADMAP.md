# Roadmap: GSD Reflect

## Milestones

- <details><summary>v1.12 GSD Reflect (Phases 0-6) -- SHIPPED 2026-02-09</summary>See milestones/v1.12-ROADMAP.md</details>
- <details><summary>v1.13 Upstream Sync & Validation (Phases 7-12) -- SHIPPED 2026-02-11</summary>See milestones/v1.13-ROADMAP.md</details>
- <details><summary>v1.14 Multi-Runtime Interop (Phases 13-21) -- SHIPPED 2026-02-16</summary>See milestones/v1.14-ROADMAP.md</details>
- <details><summary>v1.15 Backlog & Update Experience (Phases 22-30) -- SHIPPED 2026-02-23</summary>See milestones/v1.15-ROADMAP.md</details>
- <details><summary>v1.16 Signal Lifecycle & Reflection (Phases 31-35) -- SHIPPED 2026-03-02</summary>See milestones/v1.16-ROADMAP.md</details>
- <details><summary>v1.17 Automation Loop (Phases 36-44) -- SHIPPED 2026-03-09</summary>See milestones/v1.17-ROADMAP.md</details>

### v1.18 Upstream Sync & Deep Integration (In Progress)

**Milestone Goal:** Properly adopt upstream changes informed by the fork audit, keep v1.18 scoped to the audited upstream baseline (`v1.22.4`) instead of silently expanding with later upstream releases, redistribute the fork's 2,126 lines across upstream's modular structure, formalize adopt/keep/reject policy in milestone governance, harden the migration and upgrade authority model, and ensure adopted features integrate deeply with the fork's epistemic self-improvement pipeline -- not as isolated patches.

**Pre-work completed (v1.17.2-v1.17.3, QT22-28):** Installer converter functions brought to upstream parity before modular sync. Shared frontmatter helpers, Gemini/OpenCode/Codex converter fixes, `copyWithPathReplacement` upgrade, and parity enforcement tests. This ensures Phase 46's module adoption doesn't need to reconcile converter function interfaces. See `.planning/deliberations/deployment-parity-v1.17.2.md`.

**Baseline note:** v1.18 planning is frozen against the March 10 fork audit / upstream `v1.22.4` baseline. Upstream releases after that baseline are handled as explicit triage input for later roadmap work, not as silent current-milestone scope growth.

**Live upstream drift note (2026-03-24):** A fresh fetch moved `upstream/main` to `60fda20`, which is 372 commits past `v1.22.4` and 31 commits past `v1.28.0`. Phase 48.1 exists to retriage that post-audit drift before any further upstream-facing phase planning.

## Phases

**Phase Numbering:**
- Integer phases (45, 46, 47...): Planned milestone work
- Decimal phases (46.1, 46.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 45: CJS Rename** - Rename gsd-tools.js to gsd-tools.cjs with all 66 source file references updated (zero functional changes) ✓ 2026-03-19
- [x] **Phase 46: Upstream Module Adoption** - Adopt upstream's 11 lib/*.cjs modules, rewrite dispatcher, extract shared helpers to core.cjs ✓ 2026-03-20
- [x] **Phase 47: Fork Module Extraction** - Extract 5 new fork modules (sensors, backlog, manifest, automation, health-probe) in dependency order ✓ 2026-03-20
- [x] **Phase 48: Module Extensions & Verification** - Extend frontmatter.cjs and init.cjs with fork additions, verify all tests pass with zero behavioral changes ✓ 2026-03-20
- [x] **Phase 48.1: Post-audit upstream drift retriage and roadmap reconciliation (INSERTED)** - Capture what changed since the audit baseline, classify adopt/fold/defer decisions, and update v1.18 routing before Phase 49 planning ✓ 2026-03-24
- [x] **Phase 49: Config Migration** - Implement manifest migrations[] array, apply depth-to-granularity rename, and route config migration through the cross-runtime install/KB authority questions already identified ✓ 2026-03-26
- [x] **Phase 50: Migration Test Hardening** - Full-corpus namespace scan, idempotency tests, crash recovery, behavioral equivalence, and root/worktree/KB authority edge-case coverage ✓ 2026-03-26
- [x] **Phase 51: Update System Hardening** - Installer/runtime preflight, migration guides, stale file cleanup, hook/runtime-safe upgrade surfacing, and authoritative project-local upgrade behavior ✓ 2026-03-26
- [x] **Phase 52: Feature Adoption** - Adopt context-monitor, Nyquist auditor, code-aware discuss-phase, upstream workflows, and supporting features ✓ 2026-03-27
- [x] **Phase 53: Deep Integration** - Weave adopted features into fork's signal/automation/health/reflection pipeline ✓ 2026-03-28
- [ ] **Phase 54: Sync Retrospective & Governance** - Upstream trajectory analysis, feature overlap inventory, sync retrospective, signal cross-reference, governance doc updates, CI cache fix, and forward sync policy

## Phase Details

### Phase 45: CJS Rename
**Goal**: The fork's runtime entry point uses the .cjs extension matching upstream's modular structure, enabling all subsequent module adoption
**Depends on**: Nothing (first phase of v1.18)
**Requirements**: MOD-01
**Success Criteria** (what must be TRUE):
  1. Running `gsd-tools.cjs` from any hook or shell script produces identical output to the previous `gsd-tools.js`
  2. All 278 existing vitest tests pass without modification
  3. No shell script, hook, or workflow file references `gsd-tools.js` (the old name)
**Plans:** 2 plans

Plans:
- [ ] 45-01-PLAN.md -- Rename gsd-tools.js to gsd-tools.cjs and update all source file references
- [ ] 45-02-PLAN.md -- Update test/installer fixtures and run full verification sweep

### Phase 46: Upstream Module Adoption
**Goal**: The CLI dispatcher routes commands through upstream's 11 modular files and shared fork helpers live in core.cjs, replacing the monolith's inline function definitions
**Depends on**: Phase 45
**Requirements**: MOD-02, MOD-03
**Success Criteria** (what must be TRUE):
  1. `gsd-tools.cjs` is a thin dispatcher (~600 lines) that requires lib/*.cjs modules rather than defining command handlers inline
  2. The 4 shared helpers (loadManifest, loadProjectConfig, atomicWriteJson, parseIncludeFlag) are importable from `lib/core.cjs` by any module
  3. All 11 upstream module files exist in `lib/` and each handles its expected command set
  4. All 278 existing vitest tests pass without modification
**Plans:** 4 plans

Plans:
- [ ] 46-01-PLAN.md -- Copy 11 upstream modules to lib/ and extend core.cjs with 4 fork helpers
- [ ] 46-02-PLAN.md -- Rewrite dispatcher + retain fork functions inline + full test verification
- [ ] 46-03-PLAN.md -- Behavioral equivalence spot-checks and user verification
- [ ] 46-04-PLAN.md -- Gap closure: route init subcommands through init.cjs and remove inline duplicates

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
**Plans:** 2 plans

Plans:
- [ ] 47-01-PLAN.md -- Extract sensors.cjs, backlog.cjs, health-probe.cjs + remove dead frontmatter helpers
- [ ] 47-02-PLAN.md -- Extract manifest.cjs and automation.cjs + final gsd-tools.cjs reduction

### Phase 48: Module Extensions & Verification
**Goal**: Upstream's frontmatter and init modules are extended with fork-specific capabilities, and the entire modularization is verified as behaviorally equivalent to the pre-modularization monolith
**Depends on**: Phase 47
**Requirements**: MOD-09, MOD-10, MOD-11
**Success Criteria** (what must be TRUE):
  1. `frontmatter.cjs` validates signal YAML using tiered validation (required/conditional/recommended fields)
  2. `init.cjs` accepts the `--include` flag and applies fork-specific init function modifications
  3. All 278 existing vitest tests pass with zero behavioral changes from the pre-modularization baseline
  4. CLI output for every command is identical before and after modularization (verified by behavioral equivalence spot checks)
**Plans:** 2 plans

Plans:
- [ ] 48-01-PLAN.md -- Extend frontmatter.cjs with signal schema + merge fork init functions into init.cjs
- [ ] 48-02-PLAN.md -- Extract remaining command overrides to modules + behavioral equivalence verification

### Phase 48.1: Post-audit upstream drift retriage and roadmap reconciliation (INSERTED)

**Goal**: The roadmap and project state explicitly account for live upstream drift after the audit baseline so later planners know what changed, what remains in-scope for v1.18, what has already landed, and what is consciously deferred
**Depends on:** Phase 48
**Requirements**: TBD
**Relevant deliberations (planning input, not settled policy)**:
- `.planning/deliberations/upstream-drift-retriage-and-roadmap-authority.md`
- `.planning/deliberations/cross-runtime-upgrade-install-and-kb-authority.md`
**Relevant artifacts**:
- `.planning/fork-audit/01-upstream-changes.md`
- `.planning/governance/recommendations/2026-03-23-deliberation-constellation-recommendations.md`
**Success Criteria** (what must be TRUE):
  1. A dated upstream drift snapshot records the current upstream head/tag state and the delta from the `v1.22.4` audit baseline
  2. Post-baseline upstream changes relevant to Phases 49-54 or already-landed Phase 45-48 surfaces are classified as `must-integrate-now`, `fold-into-open-phase`, `candidate-next-milestone`, or `defer`
  3. ROADMAP.md, PROJECT.md, and STATE.md reflect the decided routing before Phase 49 planning starts
  4. If any post-baseline upstream change now belongs in v1.18, the roadmap records where it lands rather than leaving it implicit
**Plans:** 1 plan

Plans:
- [ ] 48.1-01-PLAN.md -- Create upstream drift classification ledger and update project docs with routing decisions

### Phase 49: Config Migration
**Goal**: The manifest-driven migration system supports declarative field renames, the depth-to-granularity breaking change is absorbed programmatically, and config upgrades move toward one runtime-neutral authority model instead of split workflow/install behavior
**Depends on**: Phase 48.1
**Requirements**: CFG-01, CFG-02, CFG-03, CFG-04, CFG-05, CFG-06, CFG-07
**Relevant deliberations (planning input, not settled policy)**:
- `.planning/deliberations/upstream-drift-retriage-and-roadmap-authority.md`
- `.planning/deliberations/cross-runtime-upgrade-install-and-kb-authority.md`
**Success Criteria** (what must be TRUE):
  1. A project with `depth: "fine"` in config.json automatically migrates to `granularity: "fine"` on upgrade without user intervention
  2. Config fields from upstream that the fork does not recognize are preserved through migration (not deleted)
  3. A config from v1.14 can upgrade through v1.15, v1.16, v1.17, v1.18 in sequence and arrive at the correct v1.18 config
  4. The 3 workflow files that referenced `depth` now use `granularity` terminology consistently
  5. version-migration.md documents the controlled-exception mechanism for renames
**Upstream drift routing (48.1):** Clusters C3 (worktree planning), C5 partial (init.cjs HOME), C6 partial (core.cjs model), C8 (commit_docs autodetect), and C9 (planningPaths) route here. See `UPSTREAM-DRIFT-LEDGER.md`.
**Plans:** 4 plans

Plans:
- [ ] 49-01-PLAN.md -- Manifest migrations[] array with rename_field support and depth-to-granularity migration
- [ ] 49-02-PLAN.md -- Update workflow and reference files from depth to granularity terminology + version-migration.md controlled-exception docs
- [ ] 49-03-PLAN.md -- Absorb upstream drift clusters C3/C5/C6/C8/C9 into core.cjs and init.cjs
- [ ] 49-04-PLAN.md -- Rename migration tests, unknown field preservation, multi-version upgrade chain

### Phase 50: Migration Test Hardening
**Goal**: The migration, installation, namespace rewriting, and project-root/worktree authority paths are tested against the edge cases and failure modes identified in the fork audit, preventing regressions as features are adopted
**Depends on**: Phase 49
**Requirements**: TST-01, TST-02, TST-03, TST-04, TST-05, TST-06, TST-07, TST-08, TST-09
**Relevant deliberations (planning input, not settled policy)**:
- `.planning/deliberations/upstream-drift-retriage-and-roadmap-authority.md`
- `.planning/deliberations/cross-runtime-upgrade-install-and-kb-authority.md`
**Success Criteria** (what must be TRUE):
  1. A full-corpus scan of installed files finds zero stale `gsd:`/`gsd-`/`get-shit-done/` references (namespace integrity verified)
  2. Running `apply-migration` N times on the same config produces identical output each time (idempotency)
  3. A simulated crash during KB migration leaves no partial state (cleanup verified)
  4. Each extracted module produces identical CLI output to the pre-extraction monolith for its command set
  5. Snapshot regression tests catch any unintended namespace rewriting changes
  6. Commands run from repo roots and subdirectories keep project-local KB/install authority when `.planning/` exists
**Upstream drift routing (48.1):** Cluster C2 partial (findProjectRoot bug fix in core.cjs) routes here. See `UPSTREAM-DRIFT-LEDGER.md`.
**Plans:** 5 plans

Plans:
- [ ] 50-01-PLAN.md -- Full-corpus namespace scan (TST-01) + snapshot regression for namespace rewriting (TST-09)
- [ ] 50-02-PLAN.md -- N-run migration idempotency (TST-02) + type coercion edge cases (TST-07)
- [ ] 50-03-PLAN.md -- KB migration edge-case filenames (TST-04) + crash recovery (TST-05)
- [ ] 50-04-PLAN.md -- Installer re-run idempotency (TST-03) + integration depth (TST-08)
- [ ] 50-05-PLAN.md -- Adopt findProjectRoot from upstream (C2 partial) + module equivalence and root authority (TST-06)

### Phase 51: Update System Hardening
**Goal**: The installer and command-entry upgrade path produce actionable migration guidance, clean up stale pre-modularization files, and enforce authoritative project-local install/KB behavior across runtimes
**Depends on**: Phase 50
**Requirements**: UPD-01, UPD-02, UPD-03, UPD-04, UPD-05, UPD-06
**Relevant deliberations (planning input, not settled policy)**:
- `.planning/deliberations/upstream-drift-retriage-and-roadmap-authority.md`
- `.planning/deliberations/cross-runtime-upgrade-install-and-kb-authority.md`
**Success Criteria** (what must be TRUE):
  1. Running installer on a v1.17 installation generates MIGRATION-GUIDE.md with relevant per-version sections
  2. Stale gsd-tools.js (pre-modularization) is removed and lib/*.cjs modules are in place after upgrade
  3. Hook registration reflects v1.18 state (new hooks added, stale hooks removed)
  4. Fresh install produces no MIGRATION-GUIDE.md (no migration noise for new users)
  5. v1.17 installation upgrades to v1.18 with all .planning/ artifacts intact and config.json migrated
  6. Version drift and install-authority problems are surfaced for both hook-capable and non-hook runtimes
**Upstream drift routing (48.1):** Clusters C1 (config preservation/Codex paths), C5 partial (install.js HOME), C6 partial (install.js model), and C7 (hook field validation) route here. See `UPSTREAM-DRIFT-LEDGER.md`.
**Plans:** 3 plans

**Design decisions resolved during planning:**
- Sequential (per-version) layout for migration guide advisory sections
- /gsdr:upgrade-project remains companion to guide (guide = docs, upgrade-project = action)
- Migration guide surfaced via installer stdout message (cross-runtime compatible)
- Per-version migration specs stored as JSON in get-shit-done/migrations/ directory

Plans:
- [ ] 51-01-PLAN.md -- Migration spec infrastructure, guide generation, stale cleanup, fresh-vs-upgrade detection
- [ ] 51-02-PLAN.md -- Upstream drift clusters C1/C5/C6/C7 integration into installer
- [ ] 51-03-PLAN.md -- End-to-end v1.17-to-v1.18 upgrade test and requirement coverage verification

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
**Upstream drift routing (48.1):** Clusters C2 partial (workflow shell robustness) and C4 (worktree isolation) route here. See `UPSTREAM-DRIFT-LEDGER.md`.
**Plans:** 5 plans

Plans:
- [ ] 52-01-PLAN.md -- Statusline surgical update (scaling, CLAUDE_CONFIG_DIR, bridge file, stdin timeout) + context-monitor hook adoption
- [ ] 52-02-PLAN.md -- Nyquist auditor agent, integration-checker update, and 4 upstream workflow adoptions
- [ ] 52-03-PLAN.md -- Discuss-phase wholesale replace (codebase scouting) + quick.md wholesale replace (--discuss flag)
- [ ] 52-04-PLAN.md -- Shell robustness (C2) and worktree isolation (C4) for 22 existing fork workflows
- [ ] 52-05-PLAN.md -- Installer registration, model-profiles doc update (ADT-09), full install + test verification

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
**Plans:** 4 plans

Plans:
- [x] 53-01-PLAN.md -- Bridge file reading in automation deferral + FEATURE_CAPABILITY_MAP expansion (INT-01, INT-08)
- [x] 53-02-PLAN.md -- Artifact sensor VALIDATION.md scanning + validation-coverage health probe (INT-02, INT-03, INT-07)
- [x] 53-03-PLAN.md -- Discuss-phase KB knowledge surfacing + cleanup workflow fork protection (INT-04, INT-05)
- [x] 53-04-PLAN.md -- INT-06 namespace re-verification + cross-plan integration verification

### Phase 54: Sync Retrospective & Governance
**Goal**: The v1.18 sync experience is examined as a whole — upstream's trajectory and design philosophy understood, feature overlap with the fork identified (distinguishing "behind" from "intentionally different"), the sync process itself evaluated, and governance artifacts updated to reflect both what happened and what should happen next. Infrastructure fixes (CI cache, progress telemetry) are also addressed.
**Depends on**: Phase 53 (all sync/integration work complete; this phase reflects on the full v1.18 experience)
**Requirements**: INF-01, INF-02, INF-03, INF-04, INF-05, INF-06, INF-07, INF-08, INF-09
**Relevant deliberations (planning input, not settled policy)**:
- `.planning/deliberations/upstream-drift-retriage-and-roadmap-authority.md`
- `.planning/deliberations/deliberation-frontmatter-provenance-and-workflow-consumption.md`
- `.planning/deliberations/deliberation-revision-lineage-and-citation-stability.md`
- `.planning/deliberations/metaphor-awareness-framing-critique-and-harness-reflexivity.md`
**Success Criteria** (what must be TRUE):
  1. CI status cache includes repo and branch in its cache key, preventing cross-project pollution
  2. STATE.md / ROADMAP.md progress reporting no longer overstates milestone completion while future work remains unplanned or incomplete
  3. FORK-DIVERGENCES.md reflects the v1.18 module structure, live upstream-tracked divergence set, and updated merge stances for modified files
  4. FORK-STRATEGY.md and the v1.17+ roadmap deliberation document record sync cadence, baseline-freeze rules, what-to-adopt criteria, and integration depth standards for future upstream syncs
  5. Upstream's post-baseline trajectory (issues, PRs, commit themes) is analyzed and documented — what they're responding to, where they're heading, and what design philosophy guides their choices
  6. Feature overlap between fork additions and upstream's independent development is inventoried with disposition (converging, redundant, complementary, divergent) — with each gap classified as "behind" (same problem, haven't gotten to it) vs "intentionally different" (different design philosophy produces different approach)
  7. The v1.18 sync process itself is retrospected — what worked, what didn't, what the fork's signal history reveals compared to upstream's issue tracker
  8. Outstanding upstream changes not yet addressed are assessed for relevance and prioritized for future sync work
**Plans**: TBD

Plans:
- [ ] 54-01: TBD
- [ ] 54-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 45 -> 46 -> 47 -> 48 -> 48.1 -> 49 -> 50 -> 51 -> 52 -> 53 -> 54

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 45. CJS Rename | 2/2 | Complete | 2026-03-19 |
| 46. Upstream Module Adoption | 4/4 | Complete | 2026-03-20 |
| 47. Fork Module Extraction | 2/2 | Complete | 2026-03-20 |
| 48. Module Extensions & Verification | 2/2 | Complete | 2026-03-20 |
| 48.1 Post-audit upstream drift retriage | 1/1 | Complete | 2026-03-24 |
| 49. Config Migration | 4/4 | Complete | 2026-03-26 |
| 50. Migration Test Hardening | 5/5 | Complete | 2026-03-26 |
| 51. Update System Hardening | 3/3 | Complete | 2026-03-26 |
| 52. Feature Adoption | 5/5 | Complete | 2026-03-27 |
| 53. Deep Integration | 4/4 | Complete | 2026-03-28 |
| 54. Sync Retrospective & Governance | 0/TBD | Not started | - |

## Overall Progress

| Milestone | Phases | Plans | Status | Shipped |
|-----------|--------|-------|--------|---------|
| v1.12 GSD Reflect | 0-6 | 25 | Complete | 2026-02-09 |
| v1.13 Upstream Sync | 7-12 | 18 | Complete | 2026-02-11 |
| v1.14 Multi-Runtime | 13-21 | 18 | Complete | 2026-02-16 |
| v1.15 Backlog & Update | 22-30 | 24 | Complete | 2026-02-23 |
| v1.16 Signal Lifecycle | 31-35 | 20 | Complete | 2026-03-02 |
| v1.17 Automation Loop | 36-44 | 24 | Complete | 2026-03-09 |
| v1.18 Upstream Sync & Deep Integration | 45-54 + 48.1 | TBD | In Progress | - |

**Totals:** 7 milestones, 55 phases (45 complete + 10 planned), 130 plans completed
