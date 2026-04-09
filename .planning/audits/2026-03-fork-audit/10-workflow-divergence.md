# Workflow Divergence Analysis

> Agent: Workflow Analysis | Source: diff of all major workflow files

---

## Divergence Summary

| Workflow | Fork Changes | Pattern | Conflict Risk |
|----------|-------------|---------|--------------|
| execute-phase.md | +367 lines | Additive postludes | LOW |
| plan-phase.md | +82 lines | Hybrid (early checks + late features) | LOW-MEDIUM |
| quick.md | +120 lines | Major branching (complexity gate) | MEDIUM |
| new-project.md | +36 lines | Additive sections | LOW |
| discuss-phase.md | No changes | Inherited from upstream | NONE |
| 7 fork-only workflows | N/A | Can't conflict | N/A |

---

## 1. execute-phase.md (+367 lines)

**Pattern:** ADDITIVE — 4 new postlude steps appended after verification

### New Postludes (in order):

**`reconcile_signal_lifecycle`**
- Programmatically transitions signals (detected→triaged→remediated)
- Uses `reconcile-signal-lifecycle.sh` (deterministic, not agent-instruction-based)

**`auto_collect_signals`**
- Reentrancy guard (prevents concurrent collection)
- Automation level resolution (0=manual, 1=nudge, 2=prompt, 3=auto)
- Context percentage estimation (wave count as proxy)
- First-run regime-change detection

**`health_check_postlude`**
- Auto-triggers when `config.health_check.frequency = 'every-phase'`
- Same automation level branching as signal collection

**`auto_reflect`**
- Spawns gsd-reflector when threshold conditions met
- Phases-since-last-reflection ≥ threshold
- Minimum untriaged signals threshold
- Session cooldown guard

### Other Changes:
- **Capability adaptation** added early: checks capability matrix for Task() availability
- **Hooks support check:** degrades hook config if hooks unavailable
- **Cleanup handoffs:** removes `.continue-here` files after completion

### Conflict Risk: LOW
- All postludes are appended after existing steps
- No reordering of upstream steps
- If upstream adds its own postludes, fork's append after them

---

## 2. plan-phase.md (+82 lines)

**Pattern:** HYBRID — capability check early, feature steps injected mid-workflow

### New Steps:

**Capability check** (before step 5):
- Checks if runtime supports Task() for parallel agent spawning
- Falls back to inline execution if no task_tool

**Step 5.5: Spike Decision Point** (between researcher return and step 6):
- Fork-compatibility guard: skips if `spike-integration.md` doesn't exist
- Parses "Genuine Gaps" from RESEARCH.md
- Applies sensitivity filter (conservative/balanced/aggressive)
- If auto_trigger=true and mode=yolo, runs spike per gap
- Otherwise presents gaps as advisory

**Step 7b: Load Triaged Signals** (before step 8 planner spawn):
- Loads top 10 active triaged signals from KB
- Formats as `<triaged_signals>` context block for planner
- Guard: skips if KB index missing

### Conflict Risk: LOW-MEDIUM
- If upstream adds steps near insertion points, careful placement needed
- All new steps have compatibility guards

---

## 3. quick.md (+120 lines)

**Pattern:** MAJOR BRANCHING — complexity gate + dual execution paths

### New Steps:

**Step 4b: Assess task complexity:**
- Heuristic evaluation of task description
- Trivial if: <100 chars, no multi-step indicators, no complexity keywords, single sentence

**Step 5a: Execute inline (trivial path):**
- Orchestrating agent makes changes directly (no planner/executor spawn)
- Read, edit, verify, commit atomically

**Step 6a: Create minimal tracking artifacts:**
- Boilerplate PLAN.md + SUMMARY.md so downstream steps work identically
- Both paths converge at step 7

### Conflict Risk: MEDIUM
- Structural branching is harder to merge than appended steps
- If upstream adds its own quick optimizations, merge needs care
- But branch point (step 4b) is clearly isolated

---

## 4. new-project.md (+36 lines)

**Pattern:** ADDITIVE — new steps in config creation section

### New Steps:

**Step 5.6: Feature Configuration (Manifest-Driven):**
- Calls `gsd-tools.js manifest auto-detect <feature>` per feature
- Interactive or auto/YOLO mode
- Applies migration + logs migration

**Step 5.7: DevOps Context:**
- Notes DevOps detection now handled by manifest auto-detect
- Preserves skip condition logic via `_gate` prompt

### Conflict Risk: LOW
- Steps are new sections, non-overlapping with upstream
- Fork adopted upstream's thin orchestrator pattern

---

## 5. discuss-phase.md (No changes)

Fork inherits upstream's version unmodified. Safe to adopt any upstream improvements (code-aware scouting, +328 lines).

---

## 6. Fork-Only Workflows (7)

| Workflow | Purpose | Lines |
|----------|---------|-------|
| `collect-signals.md` | Multi-sensor orchestration → KB | ~200 |
| `health-check.md` | Probe-based health scoring | ~200 |
| `reflect.md` | Pattern detection on triaged signals | ~200 |
| `run-spike.md` | Focused research on identified gaps | ~150 |
| `signal.md` | Signal management | ~100 |
| `release.md` | Release orchestration | ~150 |
| `upgrade-project.md` | Project version upgrade | ~100 |

These can never conflict with upstream (they don't exist there).

---

## 7. Missing Upstream Workflows

Fork hasn't adopted these upstream workflows:
- `add-tests.md` — Post-phase test generation
- `cleanup.md` — Phase/milestone cleanup
- `health.md` — Simple directory validation (different from fork's health-check)
- `validate-phase.md` — Comprehensive phase validation

---

## Structural Pattern

All fork workflow changes share common patterns:

1. **Reentrancy lock acquisition/release** — prevents concurrent automation
2. **Automation level branching** — 0=skip, 1=suggest, 2=confirm, 3=execute
3. **Context estimation** — wave count as proxy for context budget
4. **Regime-change detection** — first-run guards with increment tracking
5. **Best-effort error handling** — failures don't block phase completion
6. **Compatibility guards** — skip if reference files don't exist (upstream compat)
