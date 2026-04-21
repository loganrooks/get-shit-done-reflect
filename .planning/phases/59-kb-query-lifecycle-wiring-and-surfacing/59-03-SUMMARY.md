---
phase: 59-kb-query-lifecycle-wiring-and-surfacing
plan: "03"
signature:
  role: executor
  harness: claude-code
  platform: claude-code-cli
  vendor: anthropic
  model: claude-opus-4-7
  reasoning_effort: not_available
  profile: quality
  gsd_version: 1.19.7+dev
  generated_at: "2026-04-21T04:39:00Z"
  session_id: not_available
  provenance_status:
    role: derived
    harness: derived
    platform: derived_from_harness
    vendor: derived_from_harness
    model: exposed
    reasoning_effort: not_available
    profile: derived
    gsd_version: derived
    generated_at: exposed
    session_id: not_available
  provenance_source:
    role: artifact_role
    harness: runtime_context
    platform: derived_from_harness
    vendor: derived_from_harness
    model: runtime_env
    reasoning_effort: claude_not_exposed
    profile: config
    gsd_version: installed_harness
    generated_at: writer_clock
    session_id: claude_not_exposed
context_used_pct: 55
subsystem: knowledge-base
tags: [kb, health, watchdog, edge_integrity, lifecycle_vs_plan, dual_write, depends_on, exit_bitmask, KB-04e, SC-5]
requires:
  - phase: 59-kb-query-lifecycle-wiring-and-surfacing
    plan: "01"
    provides: "extractLinks typeof-string guard, idx_signal_links_target, signal_fts external-content rewrite, schema v3, edge-integrity classifier (computeEdgeIntegrity) -- all four are load-bearing substrate for Check 1 edge_integrity and for the dual-write invariant that Check 3 verifies"
  - phase: 56-knowledge-base-lifecycle
    plan: "03"
    provides: "KB-05 dual-write invariant -- files are source of truth, kb.db is derived cache; Check 3 of kb health is the operational test for this invariant"
  - phase: 58.1-codex-update-distribution-parity
    provides: "DC-4 cross-runtime parity: gsd-tools.cjs + bin/lib/*.cjs install identically to .claude/ and .codex/ via copyWithPathReplacement; kb-health.cjs inherits the copy path with no denylist entry"
provides:
  - "`gsd-tools kb health` four-check watchdog with exit-code bitmask (1=edge, 2=lifecycle, 4=dual_write; 7=all three FAIL)"
  - "Check 1 edge_integrity -- reuses Plan 01's computeEdgeIntegrity; FAILs on malformed targets or orphan rate > 5%"
  - "Check 2 lifecycle_vs_plan -- walks completed plans (NN-PLAN.md with matching NN-SUMMARY.md), parses resolves_signals, FAILs on any referenced signal not in remediated/verified state"
  - "Check 3 dual_write -- 20-signal default sample (or --all for full scan) cross-checks file vs SQL lifecycle_state; deterministic via --seed for reproducible tests"
  - "Check 4 depends_on_freshness -- advisory SUMMARY; never trips exit code; flags path-like refs that are dangling (ontological limit per research Pitfall C4 / D2)"
  - "kb-health.cjs lib module (408 lines) reuses discoverSignalFiles, discoverSpikeFiles, computeEdgeIntegrity promoted from test-only to public exports in kb.cjs (no new walkers per plan must-have #6)"
  - "--format json / --raw emits stable {exit_code, checks:{edge_integrity, lifecycle_vs_plan, dual_write, depends_on_freshness}} shape"
  - "Router dispatch in gsd-tools.cjs case 'kb' as a dedicated else-if branch, sibling to Plan 02's query/search/link"
  - "Nine unit tests with planted-failure fixtures covering each check's FAIL path, the --all expansion, --seed determinism, the exit-code bitmask, and installer parity"
affects:
  - "Phase 59 Plan 04 (kb transition + write verbs) -- Check 2 will transition from FAIL to PASS once execute-plan wiring auto-calls 'kb transition' on plan completion; Check 3 becomes the regression gate that catches dual-write bugs in the write path"
  - "Phase 59 Plan 05 (knowledge-surfacing rewrite) -- agents can probe kb.db freshness via exit-code bitmask before relying on a query result"
  - "Phase 60.1 (telemetry-signal integration) -- Check 2 drift is now measurable; a lifecycle drift is itself a signal of workflow incompleteness"
  - "CI / release boundary -- exit-code bitmask lets headless release runners distinguish edge corruption from lifecycle drift from dual-write bugs"
tech-stack:
  added:
    - "mulberry32 seeded PRNG (inline, ~8 lines) for deterministic dual-write sampling under --seed"
  patterns:
    - "Four-check watchdog with independent failure bits (research Pattern 5) -- each check runs regardless of prior failures so a single invocation surfaces the full failure class"
    - "Exit-code bitmask over first-fail-wins -- CI callers get richer discrimination without re-parsing stdout"
    - "Completed-plan detection via NN-PLAN.md + matching NN-SUMMARY.md existence -- reuses the execute-plan workflow's commit convention as the liveness signal"
    - "Advisory SUMMARY vs hard PASS/FAIL status -- Check 4 surfaces depends_on landscape without pretending to judge semantic staleness"
    - "Promoted-helper pattern -- internal walkers (discoverSignalFiles, discoverSpikeFiles, computeEdgeIntegrity) promoted from test-only to public exports in kb.cjs so sibling lib modules share one implementation"
key-files:
  created:
    - "get-shit-done/bin/lib/kb-health.cjs (408 lines): cmdKbHealth orchestrator, checkEdgeIntegrity, checkLifecycleVsPlan, checkDualWrite, checkDependsOnFreshness, discoverCompletedPlans walker, mulberry32+sampleIndices deterministic sampler, looksLikePath heuristic, renderHealthReport text output, parseKbHealthOptions, test-only exports for per-check invocation"
    - "tests/unit/kb-health.test.js (466 lines): 9 tests -- clean baseline, planted malformed edge (Check 1), planted lifecycle drift (Check 2), planted dual-write divergence (Check 3), depends_on dangling ref (Check 4), --all sample expansion, exit-7 bitmask case (all three FAIL), --seed determinism, installer parity"
  modified:
    - "get-shit-done/bin/lib/kb.cjs (+7 lines): promoted discoverSignalFiles, discoverSpikeFiles, computeEdgeIntegrity from test-only to public exports so kb-health.cjs can reuse them"
    - "get-shit-done/bin/gsd-tools.cjs (+10 lines): imported kb-health.cjs; added 'health' dispatch as dedicated else-if branch; extended usage string to include 'health'"
key-decisions:
  - "depends_on freshness (Check 4) ships as SUMMARY not PASS in text output so the advisory-vs-gate distinction is legible to operators at a glance. JSON output uses explicit status: 'summary'. Rationale: the research Pitfall C4 ontological limit says we cannot judge semantic staleness -- making the distinction visible prevents downstream callers from inadvertently treating the check as a gate."
  - "Orphan rate threshold for Check 1 is 5% (ORPHAN_RATE_THRESHOLD constant). Plan left it as 'configurable, keep simple' -- 5% is the plan's explicit recommendation and matches the intuition that a handful of orphans is incidental staleness while double-digit-percent orphaning indicates systemic drift."
  - "Completed-plan detection uses NN-PLAN.md with matching NN-SUMMARY.md. Plans with SUMMARY.md are complete per the execute-plan workflow's final-commit convention. Plans lacking SUMMARY.md are in-flight and out of scope for lifecycle drift detection -- their referenced signals legitimately haven't transitioned yet."
  - "Discovery plan regex: `^\\d+(?:\\.\\d+[a-z]?)?-\\d+[a-z]?-PLAN\\.md$` matches 58-11-PLAN.md, 58.1-01-PLAN.md, and 58-12a-PLAN.md but not NN-RESEARCH.md or loose plan-like filenames. Adapted from discoverLedgerFiles in kb.cjs (Phase 58 Wave 4)."
  - "Dual-write sampler uses a mulberry32 PRNG + partial Fisher-Yates over the file index rather than reservoir sampling. Rationale: we need deterministic-with-seed behavior for tests, and mulberry32 has been in broad use as a test-friendly PRNG. 8 lines of code beats importing seedrandom just for reproducibility."
  - "Default seed derivation is Date.now()/1000 + totalFiles rather than pure time. The totalFiles addend means two runs within the same second against different corpus sizes pick different samples -- it slightly widens coverage without breaking --seed reproducibility."
  - "Cross-runtime parity: no installer edits required. bin/install.js copyWithPathReplacement recursively copies get-shit-done/bin/lib/*.cjs with no denylist; kb-health.cjs ships automatically to both .claude and .codex runtime dirs (Phase 58.1 DC-4 invariant)."
  - "Live smoke test on the 278-signal corpus produced Check 2 FAIL with 31 drifts -- exactly what the plan's <verify> foresaw. This is correct behavior, not a plan failure: Plan 04's execute-plan wiring will transition those 31 signals; the health check surfacing them now is how we know the watchdog works."
patterns-established:
  - "Exit-code bitmask for multi-check CI gates: each check owns a bit; composition is OR; callers test bit-by-bit with `(code & BIT) === BIT` for discrimination. First-fail-wins forfeits this information."
  - "Promoted-helper pattern: internal lib functions used only from their own module stay local; once a sibling lib module needs them, promote to public exports rather than duplicating. kb-health.cjs is the first consumer of discoverSignalFiles/discoverSpikeFiles/computeEdgeIntegrity as public APIs."
  - "Watchdog verbs should always emit JSON with a stable shape even on FAIL (so agents can parse regardless of exit code). process.exitCode is set instead of process.exit() so the JSON output has a chance to flush."
duration: 5min
completed: 2026-04-21
---

# Phase 59 Plan 03: KB Health Four-Check Watchdog Summary

**Shipped the watchdog for edge integrity, lifecycle-vs-plan consistency, dual-write invariant, and depends_on freshness with an exit-code bitmask that lets CI callers discriminate failure class without re-parsing stdout.**

## Performance

- **Duration:** 5min
- **Tasks:** 2 of 2 completed (both `type="auto"`, no checkpoints hit)
- **Files modified:** 4 (1 created lib, 1 created test, 2 modified)
- **Commits:** 2 atomic task commits

## Accomplishments

- **`gsd-tools kb health` four-check contract live.** Four independent checks run in fixed order: edge_integrity → lifecycle_vs_plan → dual_write → depends_on_freshness. Each emits PASS/FAIL/SUMMARY + count + remediation pointer. Text output has four labeled Check N sections plus an Overall line; JSON output has a stable `{exit_code, checks: {...}}` shape.
- **Exit-code bitmask.** Bit 0 (value 1) = edge_integrity FAIL; bit 1 (value 2) = lifecycle_vs_plan FAIL; bit 2 (value 4) = dual_write FAIL. All three hard checks FAIL simultaneously = exit 7. Check 4 (depends_on_freshness) is advisory SUMMARY and never trips the exit code. CI callers can test `(code & 2) === 2` to ask "did lifecycle drift?" without parsing text.
- **Check 1 edge_integrity reuses Plan 01.** Calls into `computeEdgeIntegrity(db)` directly — no duplicate classifier. FAILs when `signal_links.target_id = '[object Object]'` exists OR when the orphan rate exceeds 5% of total edges.
- **Check 2 lifecycle_vs_plan is the central audit §7.1 #7 deliverable.** Walks `.planning/phases/*/NN-PLAN.md` files whose matching `NN-SUMMARY.md` exists (completed plans), parses `resolves_signals` via `extractFrontmatter`, queries each referenced signal's `lifecycle_state`, and FAILs on any that is not `remediated` or `verified`. Live run surfaces 31 drifts — exactly the signal Plan 04's execute-phase wiring will close.
- **Check 3 dual_write is KB-05 invariant verification.** Samples 20 signals by default (or `--all` for every signal), re-reads each file's frontmatter `lifecycle_state`, and compares to the SQLite row. FAILs on any divergence. `--seed N` makes sampling reproducible for tests (mulberry32 PRNG + partial Fisher-Yates).
- **Check 4 depends_on_freshness is a deliberate SUMMARY, not a gate.** Scans signals + spikes for populated `depends_on` fields, distinguishes path-like refs from human-readable conditions ("prisma >= 4.0"), and counts resolving vs dangling path-refs. Never FAILs — ontological limit per research Pitfall C4 / D2.
- **No new walkers.** kb-health.cjs reuses `discoverSignalFiles`, `discoverSpikeFiles`, `computeEdgeIntegrity` (promoted from test-only to public exports in kb.cjs) and `extractFrontmatter` (from frontmatter.cjs). Plan must-have #6 + research Pitfall 8 satisfied.
- **Live smoke test on 278-signal corpus.** Check 1 PASS (0 malformed, 5 orphaned, 2.4% rate). Check 2 FAIL with 31 drifts across Phase 57.4 plans. Check 3 PASS (20-sample, all file/SQL match). Check 4 SUMMARY (1 entry with non-path refs). Overall exit 2 = lifecycle_vs_plan bit alone.
- **Cross-runtime parity automatic.** bin/install.js `copyWithPathReplacement` recursively copies `get-shit-done/bin/lib/*.cjs` to both `.claude/` and `.codex/` with no denylist. kb-health.cjs inherits Phase 58.1 DC-4 without any installer edit. Verified by test #9.

## Task Commits

1. **Task 1: Implement `kb health` four-check contract in new lib/kb-health.cjs** — `61e45c76`
2. **Task 2: Unit tests for all four checks with planted failures** — `a64e88af`

## Files Created/Modified

### Created

- `get-shit-done/bin/lib/kb-health.cjs` (408 lines) — cmdKbHealth orchestrator; parseKbHealthOptions; checkEdgeIntegrity (reuses kb.computeEdgeIntegrity); checkLifecycleVsPlan + discoverCompletedPlans (internal walker scoped to plan+summary pairs); checkDualWrite + mulberry32 PRNG + sampleIndices; checkDependsOnFreshness + looksLikePath heuristic; renderHealthReport text formatter. Test-only exports prefixed `__testOnly_` for direct per-check invocation.
- `tests/unit/kb-health.test.js` (466 lines) — 9 tests across 8 describe blocks: clean baseline, each of four checks' FAIL paths with planted fixtures, exit-7 all-fail case, --all sample expansion, --seed determinism, installer parity assertion.

### Modified

- `get-shit-done/bin/lib/kb.cjs` (+7 lines) — promoted `discoverSignalFiles`, `discoverSpikeFiles`, `computeEdgeIntegrity` from internal / test-only to public `module.exports`. Added comment block explaining the promotion rationale (Phase 59 Plan 03 must-have #6 + research Pitfall 8). `__testOnly_computeEdgeIntegrity` retained for backward compatibility with Plan 01 tests; new code uses `kb.computeEdgeIntegrity`.
- `get-shit-done/bin/gsd-tools.cjs` (+10 lines) — imported `kb-health.cjs`; added `case 'health'` dispatch as a dedicated `else if` branch inside `case 'kb'`, sibling to Plan 02's query/search/link branches; extended the case's final usage-error string to include `health`.

## Decisions & Deviations

### Key decisions

See `key-decisions` in frontmatter. Highlights: bitmask over first-fail-wins; 5% orphan threshold; plan-completeness via SUMMARY.md presence; mulberry32 inline over seedrandom dependency; no installer edits (DC-4 inheritance).

### Deviations from plan

**None.** Plan implemented as written. All plan verification checks pass:

- `npx vitest run tests/unit/kb-health.test.js` — 9 tests passed, 0 failed
- `node get-shit-done/bin/gsd-tools.cjs kb health` — four-section text report emitted on live repo
- `node get-shit-done/bin/gsd-tools.cjs kb health --format json` — valid JSON with all four `checks.<name>` keys
- `ls get-shit-done/bin/lib/kb-health.cjs` — file exists
- `grep -c 'discoverSignalFiles\|extractFrontmatter' get-shit-done/bin/lib/kb-health.cjs` — 8 matches (helpers reused, not duplicated)
- `npm test` — 727 passed, 0 failed, 4 todo (no regressions)

No Rule 1 (bug), Rule 2 (critical missing), Rule 3 (blocking), or Rule 4 (architectural) deviations triggered. No authentication gates. Parallel safety with Plan 02: the `kb health` dispatch is a clearly separate `else if` block; no conflict on gsd-tools.cjs because Plan 02 already landed and was pulled into the working tree before this plan began.

## User Setup Required

None — no external service configuration required. All changes are in-tree code. Users of the phase branch inherit the watchdog on next `gsd-tools kb health` invocation.

## Next Phase Readiness

Wave 2 read surface + watchdog are both live. Plan 04 (Wave 3, mutating verbs) can now proceed with confidence:

- **KB-06b (`kb transition`)** — Check 3 (dual_write) is the regression gate. Every `kb transition` invocation must preserve the invariant; the test harness can call `kb health --all` after each planted transition to prove KB-05 holds.
- **KB-06b (`kb link create` / `kb link delete`)** — Check 1 (edge_integrity) is the gate. Every write must leave `malformed = 0`; the test harness plants dangerous payloads and asserts the verb refuses or rounds down gracefully.
- **Lifecycle wiring in execute-plan** — Check 2 (lifecycle_vs_plan) is the before/after gauge. Run `kb health` before wiring, count drifts; wire `kb transition` into execute-plan; re-run `kb health`, assert drift_count decreases to 0.
- **KB-08 (knowledge-surfacing.md rewrite)** — agents can call `kb health --format json` and examine `exit_code & 4` before trusting a surfaced entry's `lifecycle_state`; if the bit is set, the surfacing agent knows to re-read the file.

No blockers for Plan 04 / Plan 05.

## Self-Check: PASSED

- **Files verified to exist:**
  - `get-shit-done/bin/lib/kb-health.cjs` — FOUND
  - `get-shit-done/bin/gsd-tools.cjs` — FOUND
  - `get-shit-done/bin/lib/kb.cjs` — FOUND
  - `tests/unit/kb-health.test.js` — FOUND
- **Commits verified to exist on `gsd/phase-59-kb-query-lifecycle-wiring-and-surfacing`:**
  - `61e45c76` (Task 1: kb health four-check watchdog) — FOUND
  - `a64e88af` (Task 2: unit tests with planted failures) — FOUND
- **Plan verification checks:**
  - `npx vitest run tests/unit/kb-health.test.js` — 9 passed, 0 failed
  - `npm test` — 727 passed, 0 failed, 4 todo
  - `node get-shit-done/bin/gsd-tools.cjs kb health` on live corpus → four-section report, exit 2 (lifecycle drift bit, as plan foresaw)
  - `node get-shit-done/bin/gsd-tools.cjs kb health --format json` → valid JSON with all four `checks.<name>` keys present
  - `grep -c 'discoverSignalFiles\|extractFrontmatter' get-shit-done/bin/lib/kb-health.cjs` → 8 (>= 2, helpers reused not duplicated)
  - `grep -c kb-health bin/install.js` → 0 (no denylist entry, installer inherits via copyWithPathReplacement)
