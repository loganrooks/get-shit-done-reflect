---
phase: 40-signal-collection-automation
verified: 2026-03-06T01:50:03Z
status: passed
score: 7/7 must-haves verified
---

# Phase 40: Signal Collection Automation Verification Report

**Phase Goal:** Signal collection runs automatically after every phase execution without manual invocation, with reentrancy protection preventing feedback loops and cross-runtime fallback ensuring all 4 runtimes are covered
**Verified:** 2026-03-06T01:50:03Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | After phase execution completes, signal collection auto-triggers as a workflow postlude step | VERIFIED | `auto_collect_signals` step exists at line 372 of `get-shit-done/workflows/execute-phase.md`, positioned between `reconcile_signal_lifecycle` (line 357) and `update_roadmap` (line 492). Step invokes `collect-signals.md` workflow. |
| 2 | Reentrancy lockfile prevents signal collection from triggering recursively | VERIFIED | `cmdAutomationLock` (line 5259), `cmdAutomationUnlock` (line 5307), `cmdAutomationCheckLock` (line 5323) in gsd-tools.js. Postlude step checks lock before collection (line 383), acquires lock before proceeding (line 436), releases after (line 461). 16 tests cover lock/unlock/check-lock behaviors including stale detection. |
| 3 | On runtimes without hooks, the workflow postlude delivers the same auto-collection behavior | VERIFIED | The `auto_collect_signals` step is in `execute-phase.md` which all 4 runtimes read. The step explicitly states: "This is a workflow postlude -- it runs as part of the orchestrator on all runtimes (Claude Code, OpenCode, Gemini CLI, Codex CLI), not as a hook." No hook-based triggering was added. `signal_collection` has `hook_dependent_above: null` in the capability map, confirming no hook dependency. |
| 4 | When context window usage exceeds threshold, auto-collection defers with a nudge message | VERIFIED | Postlude step estimates context via wave count: `min(40 + (WAVES_COMPLETED * 10), 80)` (lines 400-402). Passes `--context-pct` to `resolve-level`. When level 3 is deferred, step displays: "Context usage high. Signal collection deferred. Run `/gsd:collect-signals` in a fresh session." (lines 425-430). `resolve-level` tests confirm deferral at 65% > 60% threshold. |
| 5 | CI sensor is included in the parallel sensor spawning alongside artifact and git sensors | VERIFIED | Postlude invokes `collect-signals.md` workflow which uses auto-discovery: `ls -1 ~/.claude/agents/gsd-*-sensor.md`. CI sensor exists at `agents/gsd-ci-sensor.md` and `.claude/agents/gsd-ci-sensor.md`. All 4 sensor agents (artifact, ci, git, log) are discovered and spawned in parallel. |
| 6 | Regime change entries are written when observation conditions change | VERIFIED | `cmdAutomationRegimeChange` (line 5356) writes `regime_change` entries with proper frontmatter (type, tags, id, project). Postlude step detects first fire via `stats.fires === 1` and writes regime change entry (lines 474-486). 5 tests cover regime-change including content validation, KB path, and ID format. |
| 7 | auto_collect config field exists in signal_collection manifest schema | VERIFIED | `feature-manifest.json` contains `auto_collect` (type: boolean, default: false) at line 234 and `reentrancy` (type: object, with `ttl_seconds` property) at line 239 under `signal_collection.schema`. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `get-shit-done/bin/gsd-tools.js` | automation lock, unlock, check-lock, regime-change subcommands | VERIFIED | 4 functions: cmdAutomationLock (line 5259, 46 lines), cmdAutomationUnlock (line 5307, 15 lines), cmdAutomationCheckLock (line 5323, 30 lines), cmdAutomationRegimeChange (line 5356, 82 lines). CLI routing at lines 6053-6083. |
| `get-shit-done/feature-manifest.json` | auto_collect and reentrancy config fields | VERIFIED | auto_collect boolean field and reentrancy object with ttl_seconds property both present in signal_collection.schema. |
| `get-shit-done/workflows/execute-phase.md` | auto_collect_signals postlude step | VERIFIED | Step at line 372, 119 lines. Contains all 6 substeps: reentrancy check, resolve level, branch on level, acquire lock + invoke collect-signals, release lock + track event, first-run regime change. |
| `tests/unit/automation.test.js` | Tests for lock/unlock/check-lock/regime-change | VERIFIED | 16 new tests across 4 describe blocks. Test suite total: 233 tests, all passing. |
| `.gitignore` | .planning/.*.lock pattern | VERIFIED | Pattern `.planning/.*.lock` at line 22. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|----|--------|---------|
| execute-phase.md | gsd-tools.js | automation lock/unlock/check-lock/resolve-level/track-event/regime-change commands | WIRED | All 6 automation subcommands referenced in postlude step: check-lock (line 383), track-event skip (line 391), resolve-level (line 397), lock (line 436), unlock (line 461), track-event fire (line 466), track-event skip (line 471), regime-change (line 485). |
| execute-phase.md | collect-signals.md | Workflow invocation | WIRED | "Follow the collect-signals.md workflow for phase {PADDED_PHASE}" at line 445. |
| gsd-tools.js | .planning/.signal_collection.lock | fs.writeFileSync/unlinkSync | WIRED | Lock path constructed at line 5265 via `path.join(cwd, '.planning', '.${normalizedFeature}.lock')`. writeFileSync at lines 5282, 5302. unlinkSync at lines 5275, 5316. |
| gsd-tools.js | .planning/knowledge/signals/ | regime-change entry write | WIRED | kbDir resolved at line 5362, signalDir at line 5381, writeFileSync at line 5417. KB rebuild attempted via execSync at line 5430. |
| npm source (execute-phase.md) | installed copy (.claude/) | Path replacement via installer | WIRED | Installed copy at `.claude/get-shit-done/workflows/execute-phase.md` has `auto_collect_signals` step (confirmed at line 372) with paths correctly transformed from `~/.claude/` to `./.claude/`. |

### Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| SIG-01: Auto-trigger after phase execution | SATISFIED | Postlude step in execute-phase.md respects automation level |
| SIG-02: CI sensor in parallel | SATISFIED | collect-signals auto-discovery includes gsd-ci-sensor.md |
| SIG-03: Reentrancy guard | SATISFIED | Lockfile with TTL, source tagging, stale detection, tested |
| SIG-04: Cross-runtime fallback | SATISFIED | Workflow postlude works on all 4 runtimes, no hooks used |
| SIG-05: Context-aware deferral | SATISFIED | Wave-based context estimation + resolve-level deferral + nudge message |
| SIG-06: Regime change entries | SATISFIED | cmdAutomationRegimeChange writes KB entries, first-fire detection in postlude |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None found | - | - | - | - |

No TODO, FIXME, PLACEHOLDER, or stub patterns found in any Phase 40 artifacts.

### Human Verification Required

None. All phase deliverables are workflow instructions and CLI commands that are fully verifiable programmatically. The workflow postlude is a Markdown instruction read by the LLM orchestrator, not visual UI. All CLI primitives have automated test coverage.

### Gaps Summary

No gaps found. All 7 observable truths verified. All artifacts exist, are substantive (not stubs), and are wired. All 6 SIG requirements are satisfied. Tests pass (233/233). Commits verified (05d8150, 745f0f7, 800a1da, df82edb, cd13485).

---

_Verified: 2026-03-06T01:50:03Z_
_Verifier: Claude (gsd-verifier)_
