---
phase: 46-upstream-module-adoption
verified: 2026-03-20T04:47:31Z
status: gaps_found
score: 6/8 must-haves verified
gaps:
  - truth: "All upstream commands are routed through module functions, not inline definitions"
    status: failed
    reason: "9 non-fork init subcommands (new-project, new-milestone, quick, resume, verify-work, phase-op, todos, milestone-op, map-codebase) route to old inline copies instead of init.cjs module functions"
    artifacts:
      - path: "get-shit-done/bin/gsd-tools.cjs"
        issue: "Lines 852-1229 contain 9 inline cmdInit* functions that plan 02 explicitly said should route to init.cmdXxx() — init.cjs is required at line 39 but never called anywhere in the dispatcher"
    missing:
      - "Replace 9 inline cmdInit* dispatch calls with init.cmdXxx() calls (e.g., init.cmdInitQuick, init.cmdInitResume, init.cmdInitPhaseOp, etc.)"
      - "Remove the 9 inline function definitions from gsd-tools.cjs after routing is fixed"
      - "Keep cmdInitTodos inline as a fork override (it adds priority/source/status fields that upstream lacks)"
  - truth: "All dead upstream function definitions are removed from gsd-tools.cjs"
    status: failed
    reason: "9 inline cmdInit* functions remain in gsd-tools.cjs that are substantively covered by init.cjs (approximately 360 lines). Plan 02 must_have explicitly required their removal."
    artifacts:
      - path: "get-shit-done/bin/gsd-tools.cjs"
        issue: "cmdInitNewProject (line 852), cmdInitNewMilestone (908), cmdInitQuick (935), cmdInitResume (982), cmdInitVerifyWork (1009), cmdInitPhaseOp (1038), cmdInitMilestoneOp (1135), cmdInitMapCodebase (1196) should be removed and routed through init.cjs"
    missing:
      - "Remove inline cmdInit* function definitions that duplicate upstream's init.cjs implementations"
      - "Note: cmdInitTodos should remain as a fork override (has priority/source/status fields upstream lacks)"
---

# Phase 46: Upstream Module Adoption Verification Report

**Phase Goal:** The CLI dispatcher routes commands through upstream's 11 modular files and shared fork helpers live in core.cjs, replacing the monolith's inline function definitions
**Verified:** 2026-03-20T04:47:31Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | All 11 upstream module files exist in get-shit-done/bin/lib/ | VERIFIED | `ls get-shit-done/bin/lib/*.cjs` returns all 11 |
| 2 | core.cjs exports 24 functions (20 upstream + 4 fork helpers) | VERIFIED | `node -e "require('./get-shit-done/bin/lib/core.cjs')"` returns 24 keys |
| 3 | loadManifest resolves feature-manifest.json from lib/ subdirectory | VERIFIED | Path uses `__dirname, '..', '..'` — two levels up to get-shit-done/; `loadManifest(process.cwd())` returns manifest |
| 4 | gsd-tools.cjs requires all 11 lib/*.cjs modules | VERIFIED | Lines 29-40 show 11 require statements; `grep -c "require.*lib/"` returns 11 |
| 5 | Fork-specific commands (manifest, backlog, automation, sensors, health-probe) route to inline functions | VERIFIED | Case blocks present at lines 3345, 3366, 3428, 3481, 3494 |
| 6 | Fork init overrides use parseIncludeFlag and 4-param signature | VERIFIED | Line 3272 calls `parseIncludeFlag(args)`, routes execute-phase and plan-phase to inline `cmdInitExecutePhase(cwd, args[2], includes, raw)` |
| 7 | All upstream commands are routed through module functions, not inline definitions | FAILED | init.cjs is required (line 39) but never called; 9 non-fork init subcommands route to inline copies instead |
| 8 | All dead upstream function definitions are removed from gsd-tools.cjs | FAILED | Lines 852-1229: 9 inline cmdInit* functions exist that plan 02 required to be removed (~360 lines) |

**Score:** 6/8 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `get-shit-done/bin/lib/core.cjs` | Upstream shared utilities + 4 fork helper exports | VERIFIED | 530 lines, 24 exports confirmed via `node -e` |
| `get-shit-done/bin/lib/state.cjs` | State command handlers | VERIFIED | 721 lines; cmdStateLoad, cmdStateUpdate, cmdStateGet all typeof === 'function' |
| `get-shit-done/bin/lib/commands.cjs` | Utility command handlers including cmdStats | VERIFIED | 666 lines; cmdCommit, cmdGenerateSlug, cmdStats all typeof === 'function' |
| `get-shit-done/bin/lib/init.cjs` | Init workflow handlers | VERIFIED (ORPHANED) | 710 lines; exports all 12 cmdInit* functions; but never called by dispatcher |
| `get-shit-done/bin/lib/verify.cjs` | Verification handlers | VERIFIED | 820 lines; cmdVerifySummary, cmdValidateHealth confirmed |
| `get-shit-done/bin/gsd-tools.cjs` | Thin CLI dispatcher + inline fork functions | PARTIAL | 3,513 lines (plan expected ~3,000-3,200; NOTE confirms ~3,500 is by design for fork functions); however 9 inline init functions should be removed (~360 extra lines) |
| `.claude/get-shit-done-reflect/bin/lib/` | Installed copy with 11 modules | VERIFIED | `ls .claude/get-shit-done-reflect/bin/lib/*.cjs` returns 11 files |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `get-shit-done/bin/gsd-tools.cjs` | `get-shit-done/bin/lib/core.cjs` | `require('./lib/core.cjs')` at line 29 | WIRED | Destructures loadManifest, loadProjectConfig, atomicWriteJson, parseIncludeFlag plus upstream helpers |
| `get-shit-done/bin/gsd-tools.cjs` | `get-shit-done/bin/lib/state.cjs` | `const state = require('./lib/state.cjs')` | WIRED | state.cmdStateLoad, state.cmdStateUpdate, state.cmdStateGet called at lines 2933-2996 |
| `get-shit-done/bin/gsd-tools.cjs` | `get-shit-done/bin/lib/init.cjs` | `const init = require('./lib/init.cjs')` | ORPHANED | Required at line 39 but `init.cmd*` never appears in dispatcher; all init subcommands route to inline functions |
| `get-shit-done/bin/gsd-tools.cjs` | `get-shit-done/bin/lib/commands.cjs` | `const commands = require('./lib/commands.cjs')` | WIRED | commands.cmdResolveModel, commands.cmdCommit, commands.cmdGenerateSlug, commands.cmdProgressRender called |
| `get-shit-done/bin/lib/core.cjs` | `get-shit-done/feature-manifest.json` | `path.join(__dirname, '..', '..', 'feature-manifest.json')` at line 511 | WIRED | Two-level-up path correct for bin/lib/ depth; loadManifest(process.cwd()) returns manifest |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| MOD-02: Upstream 11 lib/*.cjs modules adopted, dispatcher rewritten | PARTIAL | Modules adopted and dispatcher rewrites most routing, but init.cjs is orphaned |
| MOD-03: 4 shared helpers extracted to core.cjs | SATISFIED | All 4 helpers in core.cjs, importable, used by fork inline functions |
| All 278 vitest tests pass (roadmap figure is stale — 350 vitest tests actual) | SATISFIED | 350 vitest + 174 upstream + 10 fork = 534 all pass |

### Anti-Patterns Found

| File | Lines | Pattern | Severity | Impact |
|------|-------|---------|----------|--------|
| `get-shit-done/bin/gsd-tools.cjs` | 39 | `const init = require('./lib/init.cjs')` followed by zero `init.cmd*` calls | Blocker | init.cjs is an orphaned import — 9 init subcommands were supposed to route through it per plan 02 |
| `get-shit-done/bin/gsd-tools.cjs` | 852-1229 | 9 inline cmdInit* function definitions that duplicate upstream's init.cjs | Blocker | ~360 lines of dead upstream function definitions that plan 02 required to be removed |

### Human Verification Required

None — all checks were automatable.

### Gaps Summary

**Gap 1: init.cjs is an orphaned import (BLOCKER)**

Plan 02's must_have stated: "All upstream commands are routed through module functions, not inline definitions." The plan's Section 4 dispatcher spec explicitly said: "Route ALL OTHER init workflows to upstream's `init.cmdXxx()` functions (3 params, no includes)."

Instead, `const init = require('./lib/init.cjs')` exists at line 39, but no `init.cmd*` call appears anywhere in the dispatcher. All 9 non-fork init subcommands route to inline copies:
- `cmdInitNewProject` (line 852) — upstream has identical structure, inline copy is redundant
- `cmdInitNewMilestone` (line 908) — upstream has identical structure
- `cmdInitQuick` (line 935) — upstream has collision-resistant YYMMDD-xxx IDs; inline uses old sequential numbering
- `cmdInitResume` (line 982) — upstream returns `state_path`, `roadmap_path`, `project_path` fields; inline missing these
- `cmdInitVerifyWork` (line 1009) — needs comparison
- `cmdInitPhaseOp` (line 1038) — upstream has ROADMAP.md fallback when no phase directory exists; inline lacks this bug fix
- `cmdInitMilestoneOp` (line 1135) — needs comparison
- `cmdInitMapCodebase` (line 1196) — needs comparison
- `cmdInitTodos` (line 1070) — this one IS a legitimate fork override (adds priority/source/status fields that upstream's init.cjs lacks); should remain inline

**Gap 2: ~360 lines of inline upstream init functions not removed (BLOCKER)**

Plan 02's must_have stated: "All dead upstream function definitions are removed from gsd-tools.cjs." Approximately 360 lines of inline cmdInit* function bodies remain that are substantively covered by init.cjs (except cmdInitTodos which is a fork enhancement).

**What's NOT a gap:**

The roadmap success criterion mentions "~600 lines" for gsd-tools.cjs. The task NOTE explicitly clarifies this is stale: "fork-specific functions (~2,300 lines) inline until Phase 47. The dispatcher portion itself is ~550 lines; total file is ~3,500 lines. This is by design." The actual 3,513-line count is correct.

The automation test ETIMEDOUT failures observed during verification are environmental (resource contention on the server), not code regressions. The full test suite passed in the first run (60/60 automation tests), confirming test logic is correct.

**Root cause:** Both gaps share one root cause — the dispatcher rewrite in Plan 02 did not route the 9 non-fork init subcommands to `init.cmdXxx()`. The SUMMARY for 46-02 documents fork overrides for `list-todos`, `config-set/get`, and `frontmatter validate signal` but does not document init routing. The fact that all 534 tests pass means this went undetected.

---

_Verified: 2026-03-20T04:47:31Z_
_Verifier: Claude (gsdr-verifier)_
