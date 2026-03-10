# Project Research Summary

**Project:** GSD Reflect v1.18 — Upstream Sync & Deep Integration
**Domain:** Fork maintenance — monolith-to-module migration, upstream feature adoption, config evolution
**Researched:** 2026-03-10
**Confidence:** HIGH

## Executive Summary

GSD Reflect v1.18 must absorb 244 upstream commits while preserving and strengthening the fork's self-improvement pipeline (signals, reflection, health scoring, automation). The upstream changes are structurally significant: a monolith-to-module refactor (6,651-line `gsd-tools.js` split into a 592-line dispatcher + 11 CJS modules), a file extension rename (`.js` to `.cjs`), a breaking config rename (`depth` to `granularity`), and four new features (context-monitor hook, Nyquist auditor, code-aware discuss-phase, supporting workflows). The fork's 2,126 lines of additions must be redistributed into 5 new modules plus minor extensions to 3 existing upstream modules.

The recommended approach is a strict incremental migration: modularization first, config migration second, feature adoption third. Modularization must precede feature adoption because all upstream workflows reference `gsd-tools.cjs` which does not exist in the fork's current structure. The `.js` to `.cjs` rename is the single most dangerous operation (touching 56+ files) and should be an isolated first commit with zero functional changes so failures are attributable to the rename alone. Config migration needs a new manifest `migrations` array to handle the `depth` to `granularity` rename declaratively, preserving the fork's additive-only philosophy while adding a controlled escape hatch for upstream breaking changes.

The primary risk is not breakage -- it is shallow adoption. Upstream features adopted without integration into the fork's signal/health/automation pipeline become "alienated patches": working code that delivers no epistemic value. Context-monitor must feed bridge-file data into automation's `resolve-level` (replacing the current wave-based estimation). Nyquist validation gaps must flow through the artifact sensor into signal collection. Discuss-phase code-awareness must be paired with KB-awareness. Cleanup workflows must exclude the fork's `knowledge/`, `deliberations/`, and `backlog/` directories. Three critical silent failure modes exist: bridge file not written (context-monitor is dead code), VALIDATION.md not scanned (Nyquist findings never become signals), and cleanup destroying the knowledge base.

## Key Findings

### Modular Migration Strategy

See: [MODULAR-MIGRATION.md](./MODULAR-MIGRATION.md)

The monolith-to-module migration is **structurally clean** because all fork additions are additive (no upstream functions were modified), tests invoke via CLI subprocess (internal module structure is invisible to them), and 9 of 11 upstream modules need zero modification.

**Migration order (8 steps, each a single reversible commit):**
1. **Step 0 -- `.js` to `.cjs` rename** (56 file references, zero functional changes)
2. **Step 1 -- Adopt upstream's modular skeleton** (11 `lib/*.cjs` modules + thin dispatcher)
3. **Step 2 -- Extend `core.cjs`** with shared fork helpers (`loadManifest`, `loadProjectConfig`, `atomicWriteJson`)
4. **Steps 3-7 -- Extract 5 new modules** in dependency order: `sensors.cjs` (simplest) -> `backlog.cjs` -> `manifest.cjs` -> `automation.cjs` -> `health-probe.cjs`
5. **Step 8 -- Extend `frontmatter.cjs` and `init.cjs`** (signal schema, `--include` flag)

**Estimated effort:** 15-23 hours total.

### Config Migration Architecture

See: [CONFIG-MIGRATION.md](./CONFIG-MIGRATION.md)

The fork's manifest-driven config migration is architecturally superior to upstream's hardcoded inline approach but cannot handle renames or deletions today. The `depth` to `granularity` rename requires a new **`migrations` array** in `feature-manifest.json` -- an ordered list of declarative rename/transform operations that runs before the existing additive gap-fill.

**Key design decisions:**
- Manifest `migrations[]` with condition guards (`has_key`, `missing_key`) and action types (`rename_with_mapping`)
- Migrations run BEFORE additive gap-fill so renames create keys that gap-fill enriches
- `KNOWN_TOP_LEVEL_KEYS` updated to include `granularity` (keep `depth` for migration detection)
- Policy update: "additive-only with controlled exceptions" replacing strict "nothing is removed"
- 7 version-jump test scenarios covering v1.12 through v1.18 starting configs

### Migration Testing Patterns

See: [MIGRATION-TESTING.md](./MIGRATION-TESTING.md)

The current test suite (278 tests) has strong coverage of happy paths but **9 critical gaps**: no multi-version upgrade chains, no interrupted/crash recovery tests, no full-corpus namespace integrity tests, and zero tests for the forthcoming module redistribution.

**Must-have tests for v1.18 (Priority 1, ~10 hours):**
- Multi-version config upgrade (v0 to current)
- Unknown field preservation
- Config and KB migration idempotency
- Nested KB directory preservation
- Broken symlink handling
- Full-corpus namespace integrity scan (zero stale references)
- Behavioral equivalence for each extracted module
- Dispatcher wiring for all new commands

**Recommended new tooling:** `@fast-check/vitest` for property-based namespace rewriter fuzzing, `buildConfigForVersion()` test helper for version-jump scenarios, `captureDirectoryState()` for before/after comparison.

### Integration Pitfalls

See: [INTEGRATION-PITFALLS.md](./INTEGRATION-PITFALLS.md)

The core risk is the **alienated patch anti-pattern**: adopted features that work correctly in isolation but have no inputs to or outputs from the fork's feedback mechanisms. The litmus test: "If this feature fires 100 times, does the fork learn anything?"

**Top 5 pitfalls:**

1. **Silent bridge file absence (CRITICAL)** -- Context-monitor adopted but fork's statusline hook never writes the bridge file. Feature runs silently with no effect. Prevention: write bridge file FIRST, verify it exists, THEN adopt consumer.

2. **VALIDATION.md invisible to artifact sensor (CRITICAL)** -- Nyquist writes validation results but artifact sensor only scans PLAN.md, SUMMARY.md, VERIFICATION.md. Prevention: update sensor scan targets in the SAME phase as Nyquist adoption.

3. **Cleanup destroys knowledge base (CRITICAL)** -- Upstream cleanup has zero awareness of `.planning/knowledge/`, `.planning/deliberations/`, `.planning/backlog/`. Prevention: add explicit exclusion rules BEFORE first use.

4. **Dual health systems (HIGH)** -- Fork has 11-probe `/gsdr:health-check`. Upstream adds simple `/gsd:health`. Both accessible creates confusion. Prevention: DO NOT adopt as separate command; extract unique checks as new probes.

5. **Code-awareness overshadows KB-awareness (HIGH)** -- Discuss-phase scouts codebase but ignores knowledge base. The system knows what code exists but not what it learned. Prevention: KB surfacing step in SAME PR as code-awareness adoption.

## Implications for Roadmap

### Phase 1: Modularization Foundation

**Rationale:** All upstream workflows reference `gsd-tools.cjs` which does not exist in the fork's current monolith structure. Every subsequent phase depends on path and module correctness. The `.js` to `.cjs` rename is the single most dangerous operation and must be isolated.

**Delivers:** Modular `lib/` directory with 16 CJS modules (11 upstream + 5 new fork modules), thin dispatcher entry point, all 278+ tests passing.

**Addresses:** Steps 0-7 from MODULAR-MIGRATION.md. The `.cjs` rename, upstream skeleton adoption, core.cjs extensions, and all 5 module extractions (sensors, backlog, manifest, automation, health-probe).

**Avoids:** Pitfall from INTEGRATION-PITFALLS.md: "Adopting features into the monolith and then modularizing later means rewriting integration code twice."

### Phase 2: Config Migration & Breaking Changes

**Rationale:** The `depth` to `granularity` rename must be absorbed before feature adoption because upstream workflows reference `granularity`. Config migration infrastructure (`migrations[]` array) must exist before new features add config keys.

**Delivers:** Manifest v2 with `migrations` array, `depth-to-granularity` declarative migration, updated `KNOWN_TOP_LEVEL_KEYS`, workflow reference updates (3 files), version-migration.md policy update.

**Addresses:** All items from CONFIG-MIGRATION.md: schema extension, condition predicates, execution order, 7 version-jump scenarios, backward compatibility.

**Avoids:** Pitfall: stale `depth` references in workflows causing config reads to fail.

### Phase 3: Migration Test Hardening

**Rationale:** Before adopting upstream features that stress the migration/installation pipeline, the test suite must cover the gaps identified in MIGRATION-TESTING.md. Ship-blocker tests (P1) are mandatory; robustness tests (P2) should be completed within the milestone.

**Delivers:** ~14 new test groups covering multi-version upgrades, crash recovery, full-corpus namespace integrity, module behavioral equivalence, and cross-cutting patterns (idempotency, before/after invariants, fixture matrices).

**Addresses:** Priority 1 and Priority 2 tests from MIGRATION-TESTING.md (~17 hours).

**Avoids:** Pitfall: namespace rewriting misses new files; pitfall: regression in module extraction.

### Phase 4: Context Monitor Integration

**Rationale:** Context-monitor provides accurate context% data that improves ALL automation deferral decisions. This is foundational infrastructure that makes subsequent postlude features (Nyquist) more effective.

**Delivers:** Bridge file writing in statusline hook, context-monitor hook adoption, `resolve-level` reading bridge file with wave-based fallback, `context-exhaustion` health probe, signal generation for context exhaustion + incomplete phases.

**Addresses:** Context-monitor integration from INTEGRATION-PITFALLS.md with all 5 touchpoints (bridge enrichment, health scoring input, signal generation, automation deferral source, regime tracking).

**Avoids:** Pitfall 1 (silent bridge file absence) by writing producer before adopting consumer. Pitfall 6 (context% divergence) by creating single helper function for context% retrieval.

### Phase 5: Nyquist Auditor & Validation Pipeline

**Rationale:** Nyquist is the most complex integration (new artifact type, new signal type, optional postlude step, new health probe). It benefits from modularization being complete and context-monitor providing accurate deferral data.

**Delivers:** Nyquist agent spec + validate-phase workflow + command, VALIDATION.md as recognized artifact type, `validation_gap` signal type, optional postlude step (behind `workflow.nyquist_validation` config gate), `nyquist-coverage` health probe.

**Addresses:** Nyquist integration from INTEGRATION-PITFALLS.md with all 5 touchpoints. Addresses the "undertested phases" reflection pattern.

**Avoids:** Pitfall 2 (VALIDATION.md invisible to sensor) by updating artifact sensor in same phase. Pitfall 8 (postlude context budget) by gating Nyquist postlude behind config and adjusting budget offsets.

### Phase 6: Code-Aware Discuss-Phase + KB Surfacing

**Rationale:** Lowest risk adoption. Additive changes to an existing workflow. Independent of other phases. But KB surfacing must be built from scratch alongside code-awareness to avoid the alienated patch pattern.

**Delivers:** Code-aware discuss-phase with `scout_codebase` step, `<code_context>` section in CONTEXT.md, KB surfacing step with query budget (~300 tokens), `<kb_context>` section, decision-lesson tension detection, compatibility guard for missing KB index.

**Addresses:** Discuss-phase integration from INTEGRATION-PITFALLS.md.

**Avoids:** Pitfall 5 (code-awareness overshadows KB-awareness) by building both in same phase.

### Phase 7: Supporting Workflows & Cleanup

**Rationale:** Least critical adoptions. Cleanup requires all prior integration work to be stable. Add-tests is self-contained. Health probe extraction is straightforward.

**Delivers:** `add-tests.md` workflow + command, `cleanup.md` with fork-specific exclusion guards, health probe extractions from upstream's `health.md` added to existing architecture. Init module extensions (frontmatter signal schema, `--include` flag).

**Addresses:** Supporting workflows from INTEGRATION-PITFALLS.md, Step 8 from MODULAR-MIGRATION.md.

**Avoids:** Pitfall 3 (cleanup destroys KB) via explicit exclusion rules + tests. Pitfall 4 (dual health systems) by extracting probes, not adopting command.

### Phase Ordering Rationale

- **Modularization before everything** because all upstream references assume `gsd-tools.cjs` module structure. Without it, every adoption requires path translation shims.
- **Config migration before feature adoption** because new features add config keys that depend on `granularity` (not `depth`) and the manifest `migrations` infrastructure.
- **Test hardening before feature adoption** because feature adoption stresses the migration/installation pipeline and regressions must be caught.
- **Context monitor before Nyquist** because Nyquist as a postlude step needs accurate context% for deferral decisions.
- **Nyquist before discuss-phase** because Nyquist validation is more impactful (automated quality gating) while discuss-phase is a session-quality improvement.
- **Supporting workflows last** because they are individually low-value and some (cleanup) require all prior work to be stable.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 5 (Nyquist Auditor):** New artifact type for sensors, new signal type, postlude budget recalculation -- no existing precedent in fork.
- **Phase 4 (Context Monitor):** Bridge file integration with `resolve-level` has edge cases (stale files, multiple sessions) that may need investigation.
- **Phase 6 (Discuss-Phase):** KB surfacing query design is new; adapt from research-phase patterns but may need tuning.

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Modularization):** Fully mapped with exact line numbers, dependency graphs, per-step rollback. Mechanical work.
- **Phase 2 (Config Migration):** Complete design with schema, implementation sequence, and test matrix.
- **Phase 3 (Test Hardening):** Test patterns fully specified with code examples.
- **Phase 7 (Supporting Workflows):** Straightforward adoption with well-defined rules.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Modular Migration | HIGH | Direct codebase analysis -- exact line numbers, dependency graph verified, all claims checked against source |
| Config Migration | HIGH | Direct code examination of both fork and upstream; exact commit diffs analyzed |
| Migration Testing | HIGH | Grounded in current test suite audit + established testing literature; concrete code examples |
| Integration Pitfalls | HIGH | Based on fork audit artifacts, upstream source inspection, and architectural analysis |

**Overall confidence:** HIGH

All four research files are grounded in direct codebase analysis rather than web research or inference. The modular migration and config migration strategies are particularly robust -- they include exact file references, line numbers, and dependency graphs verified against actual code. The pitfalls analysis benefits from real incident data (the KB data loss signal) and audit artifacts from the fork divergence analysis.

### Gaps to Address

- **Upstream function drift magnitude:** How many of the fork's copies of upstream functions have behavioral differences from upstream's current versions? This determines whether Step 1 (adopt modules) is a drop-in or needs reconciliation. Affects Phase 1 effort estimate.

- **Init function signature compatibility:** The fork's `cmdInitExecutePhase` has an extra `includes` parameter. How exactly to extend upstream's `init.cjs` needs validation during Phase 1 implementation.

- **Upstream test adoption scope:** Should all 12 upstream `.test.cjs` files be adopted, or only the 3 corresponding to modified modules? Affects Phase 3 scope.

- **Context% bridge file lifecycle:** How long do bridge files persist? What happens with concurrent sessions? The bridge file is the critical data link for context-monitor integration (Phase 4).

- **Postlude chain context budget with Nyquist:** Adding Nyquist as postlude step 3-of-5 shifts all subsequent budget calculations. Real-world measurement needed during Phase 5 to validate that auto-reflect is not permanently deferred.

## Sources

### Primary (HIGH confidence) -- Direct Codebase Analysis
- Fork monolith: `get-shit-done/bin/gsd-tools.js` (6,651 lines)
- Upstream modular structure: `git show upstream/main:get-shit-done/bin/lib/` (11 modules)
- Upstream dispatcher: `git show upstream/main:get-shit-done/bin/gsd-tools.cjs` (592 lines)
- Fork audit artifacts: `.planning/fork-audit/00-SYNTHESIS.md` through `10-workflow-divergence.md`
- Fork manifest: `get-shit-done/feature-manifest.json` (7 features)
- Upstream commit `c298a1a` (depth -> granularity rename)
- Test suites: `tests/unit/*.test.js`, `get-shit-done/bin/*.test.js`

### Secondary (HIGH confidence) -- Established Patterns
- Migration testing patterns: Defacto, QASource, BrowserStack, Datalark, DQOps guides
- Modular restructuring: DEV Community strangler fig pattern, JetBrains modular monolith guide
- Property-based testing: fast-check library, @fast-check/vitest integration
- Snapshot testing: Vitest snapshot guide, snapshot benchmarking best practices

### Tertiary (MEDIUM confidence) -- Design Decisions
- `migrations[]` array design: derived from analysis, no precedent in codebase; sound pattern but untested
- KB surfacing query budget (300 tokens): estimate based on discuss-phase context constraints; needs validation
- Postlude budget impact of Nyquist: analytical estimate; real-world measurement needed

---
*Research completed: 2026-03-10*
*Ready for roadmap: yes*
