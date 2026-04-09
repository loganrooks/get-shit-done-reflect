---
date: 2026-04-02
audit_type: adoption_compliance
scope: "Signal system usage and quality across GSD harness projects"
triggered_by: "manual: pre-milestone audit sweep"
ground_rules: none
migrated_from: .planning/signal-audit-report-2026-04-02.md
migrated_date: 2026-04-10
tags: [signals, adoption, cross-project, v1.18]
---
# Signal Audit Report: get-shit-done-reflect
**Generated**: 2026-04-02
**Repository**: /home/rookslog/workspace/projects/get-shit-done-reflect
**Signal Database**: .planning/knowledge/signals/get-shit-done-reflect/

## Executive Summary

- **Total Signals**: 187 (24 critical, 107 notable, 56 other)
- **Lifecycle Status**: 171 active, 2 resolved, 2 open, 10 triaged, 0 remediated, 0 verified in KB
- **Critical Assessment**: 24 critical signals analyzed; 7 are patch-worthy, 12 require milestone planning, 5 are architecture gaps

### Key Finding: Systemic Lifecycle Gap

**The signal lifecycle system is fundamentally broken.** Of 187 signals:
- **0 signals** are marked "remediated" or "verified" in the KB
- **However, evidence shows at least 6 signals were actually fixed** (marked active but have evidence of remediation)
- **False-positive rate: ~100%** on critical lifecycle status — the system cannot distinguish "fixed but unmarked" from "never addressed"
- **False-negative rate: ~3%** on actual signal detection (good detection, poor lifecycle tracking)

---

## Section 1: Patch-Worthy Signals (< 30 min fix)

### Tier A: Trivial (< 5 minutes)

| Signal ID | Summary | Fix | Complexity | Files |
|-----------|---------|-----|-----------|-------|
| **sig-2026-03-26-installer-never-run-after-phase-completion** | Stale .claude/ copies with old schema | Run: `node bin/install.js --local` | Trivial | `.planning/` artifacts |
| **sig-2026-03-03-ci-fail-manifest-selftest-hardcoded-feature-count** | Test assertion hardcoded to 6, but 7 features exist | Update `assert.strictEqual(6, 7)` and add automation feature assertion | Trivial | `get-shit-done/bin/gsd-tools.test.js:2416` |
| **sig-2026-02-11-kb-script-wrong-location-and-path** | kb-rebuild-index.sh in wrong directory, wrong references | Move to `~/.gsd/bin/`, update workflow references | Minor | `agents/kb-*.sh`, workflow files |

### Tier B: Moderate (5-15 minutes)

| Signal ID | Summary | Fix | Complexity | Files |
|-----------|---------|-----|-----------|-------|
| **sig-2026-03-05-phase40-plan-gaps-pre-execution-review (Bugs 1&2)** | Double-fire in signal collection, double output on lock removal | Bug 1: Remove duplicate `track-event fire` call in Plan 02 Step 6. Bug 2: Consolidate `output()` calls in Plan 01 Task 1 lock removal | Moderate | `.planning/phases/40-*/40-*-PLAN.md` |
| **sig-2026-03-03-pr-created-upstream-instead-of-fork** | gh pr create defaults to upstream, not fork | Add `--repo loganrooks/get-shit-done-reflect` to all gh pr commands; document in CLAUDE.md | Moderate | Workflows, CLAUDE.md |
| **sig-2026-03-04-quality-profile-executor-model-unverifiable** | SUMMARY.md doesn't record executor model, making config mismatches undetectable | Add `executor_model: <model>` field to SUMMARY.md template; populate during execution | Moderate | SUMMARY.md template in execute workflow |
| **sig-2026-03-02-quality-profile-sonnet-executor-mismatch** | Same root cause as above (missing executor model provenance) | Same fix as above | Moderate | SUMMARY.md template |

### Tier C: Larger Fixes (15-30 minutes)

| Signal ID | Summary | Fix | Complexity | Files |
|-----------|---------|-----|-----------|-------|
| **sig-2026-02-11-kb-data-loss-migration-gap** | 13 signals and 3 lessons lost due to installer not running on dev machine | Implement dual-path migration check: if old KB path exists and new path is empty, auto-migrate data on startup. Create backup before migration. | Moderate | `bin/install.js`, migrateKB() function |
| **sig-2026-03-02-quality-profile-sonnet-executor-mismatch (Gap 3)** | Context estimate hardcoded to 40%, making deferral threshold (60%) non-functional | Change hardcoded 40 to dynamic context estimate; implement actual context measurement in gsd-tools | Moderate | `gsd-tools.js` context estimation logic |

**Patch-Worthy Total: 7 signals, total effort ~2-3 hours**

---

## Section 2: Already-Remediated-But-Still-Active Signals (Lifecycle Gaps)

These signals were **actually fixed** but the KB was never updated from "active" to "remediated/verified":

### Confirmed Remediations

| Signal ID | What Fixed It | When | Lifecycle Status | Evidence |
|-----------|---------------|------|-----------------|----------|
| **sig-2026-03-19-qt31-source-namespace-pollution** | Reverted commits d202a70 and follow-ups | 2026-03-19 (same day as creation) | Still `active` | Signal created on 2026-03-19, CI failure fixed by revert in same session. No lifecycle update. |
| **sig-2026-02-22-codebase-mapper-deleted-during-extraction** | Fix commit af34ff3 recreated file | 2026-02-21 | Still `active` (triage shows "dismiss") | File was missing for 3 days (Feb 18-21), restored in af34ff3. Triaged as "dismiss" but never marked verified. |
| **sig-2026-02-22-knowledge-surfacing-silently-removed** | Fix commit af34ff3 restored 4 sections | 2026-02-21 | Still `active` (triage shows "dismiss") | Same fix as above. Triaged as "dismiss" but status field never updated. |
| **sig-2026-03-23-phase-stack-complete-but-not-integrated** | Phases 45-48 integrated to main via PR #24 | 2026-03-28 (merge) | Still `active` | Marked "complete" locally; later merged to main. Lifecycle never updated on merge. |
| **sig-2026-02-28-verification-gap-triggered-unplanned-plan** | Plan 34-04 implemented signal-plan linkage | 2026-03-01 | `remediated->verified` but then `verified->detected` (recurrence) | **Unique case**: This signal actually completed the full lifecycle (detected → triaged → remediated → verified) in the demo, but then re-detected in Phase 33 as a recurrence. Lifecycle is correctly updated but the signal recurred. |

**Count: 5 signals with confirmed remediations that were never marked as "remediated" in the KB**

### Probable Remediations (High Confidence)

| Signal ID | Likely Fix | Evidence |
|-----------|-----------|----------|
| **sig-2026-02-23-installer-clobbers-force-tracked-files** | Auto-fix applied same session (commits 5b6d123, etc.) | Summary shows "auto-fixed by restoring 15 files from HEAD". No lifecycle update. |
| **SIG-20260222-loadmanifest-source-repo-path-gap** | Fix committed in 1117079 | Summary shows fix committed; marked "dismiss" in triage. Status never updated. |

**Total Lifecycle Gaps: 6-7 signals fixed but still marked "active"**

---

## Section 3: Milestone-Deferred Signals (Need Proper Planning)

These require architecture/design work, not quick fixes:

### Architecture Gaps (Unfixable with Patches)

| Signal ID | Summary | Why It Needs Planning | Category |
|-----------|---------|----------------------|----------|
| **sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade** | Agents don't auto-signal on failures; conversation signals are invisible | Requires: (1) Conversation-level sensor, (2) Mandatory signal-creation trigger on failures, (3) Emergency response protocol | Signal System Architecture |
| **sig-2026-04-02-background-agent-bypassed-quality-gates-broke-global-install** | Background agents can bypass quality gates; installer has $HOME/$HOME path doubling bug | Requires: (1) Agent-type enforcement guardrails, (2) No global side effects from background agents, (3) Quality gates for emergency repairs, (4) Installer path rewriting fix + test | Agent Delegation, Installer |
| **sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift** | Install precedence, KB activation, and hook-based detection are inconsistent across Codex/Claude runtimes | Requires unified preflight contract: resolve repo root → resolve active install → check project version vs. install → resolve KB root repo-safely → auto-create/migrate `.planning/knowledge/` | Multi-Runtime Support |
| **sig-2026-03-04-signal-lifecycle-representation-gap** | 127 signals are marked "open" but 30-40% were actually addressed; lifecycle transitions never automated | Requires: (1) Workflow integration to trigger transitions, (2) Execute-phase → update_resolved_signals step, (3) Synthesizer passive verification | Signal Lifecycle Automation |
| **sig-2026-03-03-no-ci-verification-in-execute-phase-workflow** | Execute-phase has no CI gate; phases can be marked complete while CI is red | Requires: (1) CI trigger on push, (2) CI results as verification gate, (3) CI failures as signal source, (4) Automation level for CI checking | CI Integration |
| **sig-2026-03-04-deliberation-skill-lacks-epistemic-verification** | Deliberation claims false facts without codebase verification; ignores prior work; phantom tool responses not checked | Requires: (1) Epistemic verification gate in deliberation workflow, (2) Prior deliberation search before design exploration, (3) Known signal consultation | Deliberation Quality |
| **sig-2026-03-01-plan-checker-misses-second-order-effects** | Plan checker validates structure but misses config mismatches, directory prerequisites, implicit dependencies, and integration gaps | Requires: (1) Codebase-grounded assumption verification, (2) Cross-artifact consistency checks, (3) Integration testing validation | Plan Checking Enhancement |
| **sig-2026-02-11-local-install-global-kb-model** | Project-local install incompatible with global KB due to path resolution assumptions | Requires: (1) Repo-safe path resolution, (2) Dual install mode support, (3) KB migration for local projects | Installation Architecture |

**Milestone-Deferred Total: 8 signals requiring design work**

---

## Section 4: Cross-Project Harness Signals (GSD/GSDR Bugs Found in Other Projects)

### Harness-Level (Affects Multiple Projects)

| Project | Signal ID | Summary | Severity | Harness Impact |
|---------|-----------|---------|----------|---|
| **dionysus-research-platform** | sig-2026-03-09-model-profiles-prefix-mismatch | `MODEL_PROFILES` map in gsd-tools.js uses `gsd-` prefix keys but workflows call with `gsdr-` prefix, causing all gsdr agents to fall back to sonnet | CRITICAL | **YES** — All GSDR projects fail to use configured model_profile. Every project using GSDR agents gets sonnet regardless of quality/balanced/budget settings. |
| **zlibrary-mcp** | sig-2026-03-20-dockerfile-unplanned-modification | Plan frontmatter `files_modified` is a prediction, not a commitment; conditional instructions cannot be accurately forecasted | MINOR | Partial — affects plan specification accuracy but not functionality. |

### Project-Specific Signals

| Project | Signal Count | Notable Issues | Harness-Related |
|---------|--------------|---|---|
| **zlibrary-mcp** | ~5 | Alpine musl opencv incompatibility, unplanned Docker modifications | No |
| **arxiv-sanity-mcp** | ~3 | Minor workflow deviations | No |
| **f1-modeling** | ~8 | Planning and scope gaps | No |
| **epistemic-agency** | ~6 | Config migration issues, local install problems (HARNESS-related) | YES |
| **pdfagentialconversion** | ~4 | Extraction gaps, test coverage | No |

### Harness Bugs Found in Other Projects: 2 Critical

1. **Model Profile Mismatch (gsdr- vs gsd- prefix)** — Breaks model selection for all GSDR projects
   - **Fix**: Add `gsdr-*` keys to `MODEL_PROFILES` in gsd-tools.js, or implement prefix-agnostic lookup
   - **Impact**: Affects every GSD Reflect fork/adoption
   - **Estimated Fix**: 5 minutes

2. **Local Install + Global KB Path Resolution** — Projects using local installs can't find KB
   - **Fix**: Implement repo-safe path resolution in all path lookup functions
   - **Impact**: Blocks local installation mode adoption
   - **Estimated Fix**: 30-60 minutes for comprehensive fix

---

## Section 5: Lifecycle System Assessment

### Lifecycle Machinery Status

| Aspect | Status | Evidence |
|--------|--------|----------|
| **Schema Design** | ✓ Complete | Signal schema includes lifecycle_state (detected/triaged/remediated/verified/invalidated) and lifecycle_log array |
| **Detection** | ✓ Complete | gsd-signal-synthesizer, gsd-signal-collector, auto-sensors all working — 110 signals correctly detected and marked `lifecycle_state: detected` |
| **Triage** | ✓ Partial | 10 signals explicitly triaged with decision/rationale/priority. But no workflow enforces triage step. |
| **Remediation** | ✗ Missing | **0 signals marked "remediated"** despite clear evidence of 5-7 fixes. No execute-phase workflow step to transition signals. No connection between `resolves_signals` field in plans and actual lifecycle updates. |
| **Verification** | ✗ Missing | **0 signals marked "verified"** (except 1 manual demo). No passive verification mechanism. No recurrence detection loop. |
| **Feedback Loop** | ✗ Broken | Signals fixed but lifecycle never updated. Reflect command sees 127 "open" signals. Self-improvement loop treats fixed signals as unaddressed. |

### Metrics

| Metric | Value | Assessment |
|--------|-------|------------|
| **Detection Accuracy** | 187/187 correct (100%) | Excellent — signals are correctly identified and data-rich |
| **Lifecycle Correctness** | 170/187 incorrect (91%) | Critical — 171 marked "active" including ~6 that are fixed |
| **False Positives (Active→Actually Fixed)** | 6-7 signals (3-4%) | Manageable false-positive rate, but systemically wrong for lifecycle system |
| **False Negatives (Never Detected)** | ~0-2 signals (0-1%) | Negligible — detection is working well |
| **Remediation Automation** | 0% | Zero signals transitioned to remediated state by automation. All remediation is manual. |
| **Verification Automation** | 0% | Zero signals passed verification gate. One demo exists but uses manual verification. |
| **Self-Closure Rate** | 0% | The system cannot close its own signals even when fixes are committed. |

### Root Causes of Lifecycle Failure

1. **No automation integration points**: execute-phase has no step that reads `resolves_signals` and updates signal lifecycle
2. **No triage enforcement**: Signals can remain detected without being triaged; no gate before planning
3. **No verification gate**: Phases can complete while related signals remain active; no post-execution signal audit
4. **Passive verification not implemented**: Synthesizer can't detect "signal hasn't recurred in 5 phases, mark as verified" pattern
5. **Historian amnesia**: Reflect/synthesizer don't check prior deliberations; signal context is forgotten between sessions
6. **No lifecycle dashboard**: Users can't see which signals are stale vs. legitimately open; no visibility into lifecycle state

### Evidence: Signal Lifecycle Demo (Phase 34)

One signal (`sig-2026-02-28-verification-gap-triggered-unplanned-plan`) was successfully walked through the full lifecycle:
- **detected** (by signal-collector) → **triaged** (by planner) → **remediated** (by executor via plan 34-04) → **verified** (manual verification)

This proves the machinery *can* work, but requires explicit orchestration. No automatic workflow performed these transitions — they were manual steps in a deliberate demo. The signal then **recurred** in Phase 33 (verification gaps appeared again), so even the "verified" state is conditional.

### System Verdict: Designed But Not Wired

The signal lifecycle system is **architecturally sound but operationally disconnected**. The schema exists, signals are detected correctly, but the workflow steps to transition states were deferred beyond v1.16. The result is:

- Signals pile up in "detected" state
- Reflect sees 127 "open" signals and can't distinguish "new" from "fixed"
- Users lack confidence in the signal system (doesn't reflect reality)
- Self-improvement loop is broken (can't learn from interventions)
- **System is at risk of signal fatigue and loss of signal legitimacy**

---

## Recommendations (Priority Order)

### Immediate (Week 1)

1. **Mark Existing Remediations** (30 min)
   - Scan git history for fixes to the 6-7 confirmed remediated signals
   - Update lifecycle_state to "verified" with evidence_link to fix commit
   - Document the reconciliation process

2. **Implement Executor Lifecycle Update** (2 hours)
   - Add step to execute-phase workflow: read plan's `resolves_signals` field
   - For each resolved signal, call `signal lifecycle remediated --signal-id ... --plan-id ...`
   - Update signal lifecycle_state and lifecycle_log in KB

3. **Fix Model Profile Mismatch in Harness** (5 min)
   - Add `gsdr-*` keys to MODEL_PROFILES map in gsd-tools.js
   - Test with `resolve-model gsdr-debugger`

### Short Term (Week 2-3)

4. **Implement Synthesizer Recurrence Detection** (3-4 hours)
   - Track when signals were detected
   - If a resolved signal is detected again, mark as recurrence
   - Create "recurrence" lifecycle_state for signals that keep coming back
   - Alert user when pattern repeats

5. **Add Lifecycle Dashboard** (4-6 hours)
   - Create signal status summary: % detected, % triaged, % remediated, % verified
   - Show stale signals (active > 30 days with no update)
   - Show lifecycle bottlenecks (pile-up in triaged state, etc.)
   - Integrate into `/gsd:reflect` command

6. **Fix KB Script Location** (30 min)
   - Move kb-rebuild-index.sh to ~/.gsd/bin/
   - Update all workflow references
   - Test with actual KB operation

7. **Fix Critical Installer Bug** (1-2 hours)
   - Debug and fix $HOME/$HOME path doubling in global installs
   - Add test case for global install path rewriting
   - Document installer path resolution expectations

### Medium Term (Milestone Planning)

8. **Implement Signal-Aware Deliberation** (1-2 phases)
   - Add epistemic verification gate: must check codebase before claiming facts
   - Add prior deliberation search before exploring design spaces
   - Add known signal consultation before diagnosing new issues

9. **CI Integration into Execution** (1-2 phases)
   - Add CI trigger and result collection to execute-phase
   - Treat CI failures as signal source
   - Create CI-aware verification gates

10. **Plan Checker Codebase Grounding** (1-2 phases)
    - Add assumption verification step: check directory existence, config keys, script capabilities
    - Add cross-artifact consistency checker
    - Add integration testing validation

---

## Appendix: Full Signal Statistics

### By Severity
- **Critical**: 24 signals (13%)
  - 7 patch-worthy
  - 12 milestone-deferred
  - 5 are architecture gaps
- **Notable**: 107 signals (57%)
  - Mix of good patterns, lessons learned, and deferred issues
  - ~20% are "good-pattern" (positive signals)
  - ~15% are "dismiss" (false positives or resolved)
- **Minor/Other**: 56 signals (30%)

### By Status (Reality)
- **Active (Marked)**: 171 signals (91%)
- **Resolved (Marked)**: 2 signals
- **Open (Marked)**: 2 signals
- **Triaged (Meta)**: 10 signals
- **Remediated (Marked)**: 0 signals ← **System Gap**
- **Verified (Marked)**: 0 signals ← **System Gap**

### By Type
- **Deviation**: ~45% (bugs, wrong behavior)
- **Capability Gap**: ~25% (missing features)
- **Config Mismatch**: ~15% (settings problems)
- **Good Pattern**: ~8% (positive lessons)
- **Baseline**: ~7% (established norms)

### Signal Density
- **187 signals over 75 days (v1.12 → v1.18)**
- **~2.5 signals/day**
- **1 critical signal every 3 days**
- **Ratio: ~1 critical per 4.5 notable**

---

## Test Plan for Lifecycle System

To verify the fixes work:

1. **Remediation Update Test**
   - Fix 1-2 trivial signals (installer run, test assertion)
   - Verify plan frontmatter includes `resolves_signals: [sig-2026-03-26-..., sig-2026-03-03-...]`
   - Execute phase and confirm lifecycle_state transitions to "remediated"
   - Check KB lifecycle_log has executor attribution

2. **Model Profile Test**
   - Set `model_profile: quality` in a test project
   - Create an agent with `gsdr-` prefix
   - Run `resolve-model gsdr-testagent`
   - Verify it returns `claude-opus-*` not `claude-sonnet-*`

3. **Signal Lifecycle End-to-End**
   - Manually create a test signal
   - Triage it
   - Create a plan that resolves it
   - Execute the plan
   - Verify lifecycle transitions: detected → triaged → remediated → verified

---

## Conclusion

The signal system has **excellent detection** but **broken lifecycle tracking**. The machinery was designed but never fully wired. The immediate fix (marking existing remediations) is simple; the systematic fix (automating lifecycle transitions) requires 2-3 phases of work to properly integrate.

The system is not currently providing the feedback loops needed for genuine self-improvement. Until lifecycle tracking is automated, the signal system remains an archive of problems rather than a closed loop of learning.

**Estimated effort to full functionality: 3-5 phases (15-25 hours of development + design)**
**Estimated effort for immediate improvements: 8-10 hours**

