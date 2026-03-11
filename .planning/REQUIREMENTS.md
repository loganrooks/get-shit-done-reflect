# Requirements: GSD Reflect v1.18

**Defined:** 2026-03-10
**Core Value:** The system never makes the same mistake twice -- signals capture what went wrong, spikes resolve uncertainty empirically, and the knowledge base surfaces relevant lessons before they're needed.

## v1.18 Requirements

Requirements for Upstream Sync & Deep Integration milestone.

### Modularization

- [ ] **MOD-01**: Runtime file renamed from gsd-tools.js to gsd-tools.cjs with all 56 shell references updated
- [ ] **MOD-02**: Upstream's 11 lib/*.cjs modules adopted with dispatcher rewritten to route commands to modules
- [ ] **MOD-03**: 4 shared helper functions (loadManifest, loadProjectConfig, atomicWriteJson, parseIncludeFlag) extracted to core.cjs
- [ ] **MOD-04**: sensors.cjs module extracted with cmdSensorsList and cmdSensorsBlindSpots functions
- [ ] **MOD-05**: backlog.cjs module extracted with 7 backlog command functions and 3 helpers
- [ ] **MOD-06**: manifest.cjs module extracted with 6 manifest command functions and 5 helpers
- [ ] **MOD-07**: automation.cjs module extracted with 7 automation command functions and FEATURE_CAPABILITY_MAP
- [ ] **MOD-08**: health-probe.cjs module extracted with 3 probe functions and 3 KB helpers
- [ ] **MOD-09**: frontmatter.cjs extended with signal schema (tiered validation: required/conditional/recommended)
- [ ] **MOD-10**: init.cjs extended with fork's --include flag and init function modifications
- [ ] **MOD-11**: All existing 278 vitest tests pass after modularization with zero behavioral changes

### Config Migration

- [ ] **CFG-01**: Feature manifest extended with migrations[] array supporting declarative field renames
- [ ] **CFG-02**: depth→granularity rename expressed as manifest migration and applied programmatically
- [ ] **CFG-03**: KNOWN_TOP_LEVEL_KEYS updated to include granularity and exclude depth
- [ ] **CFG-04**: 3 workflow files (plan-phase.md, spike-execution.md, roadmap.md template) updated from depth to granularity terminology
- [ ] **CFG-05**: Multi-version upgrade chain tested (v1.14→v1.15→v1.16→v1.17→v1.18 config evolution)
- [ ] **CFG-06**: Unknown config fields from upstream preserved during migration (not deleted)
- [ ] **CFG-07**: version-migration.md spec updated with controlled-exception mechanism for renames

### Migration Test Hardening

- [ ] **TST-01**: Full-corpus namespace scan test verifying zero stale gsd:/gsd-/get-shit-done/ references in installed files
- [ ] **TST-02**: Idempotency tests for apply-migration (N-times application produces same result)
- [ ] **TST-03**: Idempotency test for full installer re-run over existing installation
- [ ] **TST-04**: KB migration test with nested subdirectories and edge-case filenames
- [ ] **TST-05**: Crash-recovery test for interrupted KB migration (partial state cleanup)
- [ ] **TST-06**: Module behavioral equivalence tests comparing CLI output before and after extraction
- [ ] **TST-07**: Config type coercion edge case tests (string↔boolean, null handling)
- [ ] **TST-08**: Integration depth tests verifying adopted features connect to fork pipeline
- [ ] **TST-09**: Snapshot regression tests for namespace rewriting on representative file corpus

### Update System Hardening

- [ ] **UPD-01**: Installer generates MIGRATION-GUIDE.md with per-version sequential sections for all changes between detected previous version and current version
- [ ] **UPD-02**: Installer detects stale runtime files from pre-modularization install (old gsd-tools.js, missing lib/*.cjs) and cleans up
- [ ] **UPD-03**: Hook registration updated during upgrade (new hooks registered, stale hooks removed, modified hooks rebuilt)
- [ ] **UPD-04**: Fresh install vs upgrade detected — no migration guide generated for first-time users
- [ ] **UPD-05**: End-to-end upgrade test from v1.17 installation to v1.18 with .planning artifacts preserved
- [ ] **UPD-06**: Each release ships a migration spec (structured notes on what changed) that the installer can mechanically append

### Feature Adoption

- [ ] **ADT-01**: Context-monitor hook adopted from upstream with bridge file written by statusline hook
- [ ] **ADT-02**: Context scaling fixed from 80% to 83.5% (AUTO_COMPACT_BUFFER_PCT = 16.5)
- [ ] **ADT-03**: Stdin timeout guard (3s) added to hook input handling
- [ ] **ADT-04**: CLAUDE_CONFIG_DIR environment variable respected instead of hardcoded ~/.claude paths
- [ ] **ADT-05**: Nyquist auditor agent adopted with fork namespace (gsdr-nyquist-auditor)
- [ ] **ADT-06**: Code-aware discuss-phase adopted from upstream (+328 lines codebase scouting)
- [ ] **ADT-07**: Upstream workflows adopted: add-tests.md, cleanup.md, health.md, validate-phase.md
- [ ] **ADT-08**: Integration-checker agent adopted from upstream
- [ ] **ADT-09**: Per-agent model override support adopted from upstream
- [ ] **ADT-10**: quick.md --discuss flag adopted from upstream

### Deep Integration

- [ ] **INT-01**: Context-monitor warnings feed into automation deferral decisions (replace wave-count estimation)
- [ ] **INT-02**: Nyquist auditor output (VALIDATION.md) added to artifact sensor scan targets
- [ ] **INT-03**: Nyquist findings generate signals that flow into reflection pipeline
- [ ] **INT-04**: Code-aware discuss-phase enhanced with KB knowledge surfacing during scouting
- [ ] **INT-05**: Cleanup workflow guarded with exclusion list for fork directories (knowledge/, deliberations/, backlog/)
- [ ] **INT-06**: Adopted upstream workflows namespace-rewritten (gsdr: prefix) by installer
- [ ] **INT-07**: Health probe added for Nyquist validation pass rate (validation-coverage probe)
- [ ] **INT-08**: Automation framework recognizes new adopted features for level-based triggering

### Infrastructure

- [ ] **INF-01**: CI status cache scoped per-project (include repo/branch in cache key) fixing cross-project pollution
- [ ] **INF-02**: v1.17+ roadmap deliberation updated to incorporate upstream sync as completed milestone theme
- [ ] **INF-03**: FORK-DIVERGENCES.md updated to reflect v1.18 sync state and new merge stances
- [ ] **INF-04**: FORK-STRATEGY.md updated with durable upstream sync policy (cadence, what-to-adopt criteria, integration depth standard)

## Future Requirements

### Deferred from research

- **FUT-01**: Property-based namespace fuzzing with @fast-check/vitest (adds dependency, marginal value over explicit edge cases)
- **FUT-02**: Concurrent KB access tests (multi-process writes -- not a current production scenario)
- **FUT-03**: Upstream test suite adoption (all 12 node:test files -- can run alongside vitest but adds maintenance)
- **FUT-04**: Fixture matrix for migration testing across all 4 runtimes (Claude, Gemini, Codex, OpenCode)
- **FUT-05**: Per-agent model overrides integration with automation framework (which agents get which models at which automation level)

### Deferred from v1.17+ themes (M-B through M-E)

- **FUT-06**: Log sensor implementation (M-B: Meta-Observability)
- **FUT-07**: Deliberation intelligence system (M-C)
- **FUT-08**: Cross-platform behavioral testing (M-D)
- **FUT-09**: Worktree-based parallelization (M-E)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Windows-specific fixes | Fork targets Linux; upstream fixes can be cherry-picked if user requests |
| Codex multi-agent parity | Still in active upstream development; monitor, don't adopt yet |
| Rewriting fork tests in node:test | Vitest works, is ESM-native, and has richer assertions -- keep both frameworks |
| Database-backed KB | File-based is validated, zero-dependency philosophy |
| Automated code review agent | Deferred from v1.17 deliberation; needs more design |
| Full upstream test adoption | Run upstream tests as-is via node:test; don't port to vitest |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MOD-01 | Phase 45 | Pending |
| MOD-02 | Phase 46 | Pending |
| MOD-03 | Phase 46 | Pending |
| MOD-04 | Phase 47 | Pending |
| MOD-05 | Phase 47 | Pending |
| MOD-06 | Phase 47 | Pending |
| MOD-07 | Phase 47 | Pending |
| MOD-08 | Phase 47 | Pending |
| MOD-09 | Phase 48 | Pending |
| MOD-10 | Phase 48 | Pending |
| MOD-11 | Phase 48 | Pending |
| CFG-01 | Phase 49 | Pending |
| CFG-02 | Phase 49 | Pending |
| CFG-03 | Phase 49 | Pending |
| CFG-04 | Phase 49 | Pending |
| CFG-05 | Phase 49 | Pending |
| CFG-06 | Phase 49 | Pending |
| CFG-07 | Phase 49 | Pending |
| TST-01 | Phase 50 | Pending |
| TST-02 | Phase 50 | Pending |
| TST-03 | Phase 50 | Pending |
| TST-04 | Phase 50 | Pending |
| TST-05 | Phase 50 | Pending |
| TST-06 | Phase 50 | Pending |
| TST-07 | Phase 50 | Pending |
| TST-08 | Phase 50 | Pending |
| TST-09 | Phase 50 | Pending |
| UPD-01 | Phase 51 | Pending |
| UPD-02 | Phase 51 | Pending |
| UPD-03 | Phase 51 | Pending |
| UPD-04 | Phase 51 | Pending |
| UPD-05 | Phase 51 | Pending |
| UPD-06 | Phase 51 | Pending |
| ADT-01 | Phase 52 | Pending |
| ADT-02 | Phase 52 | Pending |
| ADT-03 | Phase 52 | Pending |
| ADT-04 | Phase 52 | Pending |
| ADT-05 | Phase 52 | Pending |
| ADT-06 | Phase 52 | Pending |
| ADT-07 | Phase 52 | Pending |
| ADT-08 | Phase 52 | Pending |
| ADT-09 | Phase 52 | Pending |
| ADT-10 | Phase 52 | Pending |
| INT-01 | Phase 53 | Pending |
| INT-02 | Phase 53 | Pending |
| INT-03 | Phase 53 | Pending |
| INT-04 | Phase 53 | Pending |
| INT-05 | Phase 53 | Pending |
| INT-06 | Phase 53 | Pending |
| INT-07 | Phase 53 | Pending |
| INT-08 | Phase 53 | Pending |
| INF-01 | Phase 54 | Pending |
| INF-02 | Phase 54 | Pending |
| INF-03 | Phase 54 | Pending |
| INF-04 | Phase 54 | Pending |

**Coverage:**
- v1.18 requirements: 48 total
- Mapped to phases: 48/48
- Unmapped: 0

---
*Requirements defined: 2026-03-10*
*Last updated: 2026-03-10 after UPD phase added (48/48 mapped)*
