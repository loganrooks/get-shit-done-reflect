---
id: sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop
type: observation
severity: high
phase: "v1.18-post-release"
detected_by: human
date: 2026-04-03
status: open
tags: [upstream-adoption, verification-gap, discuss-phase, feature-drop, process-gap]
related_issues: ["#23", "#26"]
---

# Signal: Upstream Feature Adoption Passed Verification But Silently Dropped Core Mechanism

## What Happened

Issue #23 (Phase 52, closed 2026-03-28) adopted upstream discuss-phase changes. Plan 03 describes "wholesale-replace discuss-phase.md (408→1049 lines, codebase scouting)." Verification reported 15/15 must-haves passed, 405 tests passing.

However, the upstream feature's core mechanism was never actually adopted:
- **Missing:** `workflow.discuss_mode` config routing in `commands/gsd/discuss-phase.md`
- **Missing:** `discuss-phase-assumptions.md` workflow (645 lines, the entire alternative flow)
- **Missing:** `gsd-assumptions-analyzer` agent (105 lines, the codebase analysis subagent)
- **Missing:** `config.json` template update adding `discuss_mode: "discuss"` default
- **Missing:** `docs/workflow-discuss-mode.md` (68 lines, user documentation)
- **Missing:** Mode-aware gates in `plan-phase.md` and `progress.md`

The upstream commit (`18bb014`, PR #637 on `gsd-build/get-shit-done`, released in upstream v1.28.0) added all of these. GSDR v1.18.3 has none of them.

## Why This Matters

1. **Verification checked structure, not function.** The wholesale-replace of discuss-phase.md passed verification because the file grew from 408 to 1049 lines and gained codebase scouting. But the config routing that makes `discuss_mode: "assumptions"` work was in the *command file*, not the workflow file — and the entire alternative workflow + agent were separate files that were never created.

2. **A feature can be claimed adopted while its defining mechanism is absent.** The discuss-phase.md file was correctly updated with new capabilities (batch mode, analyze mode, text mode, advisor mode, KB scanning). But the `discuss_mode` config switch — the thing that routes to an entirely different workflow — was silently dropped. No test caught this because verification checked "does discuss-phase work?" not "does discuss_mode routing work?"

3. **Real user confusion resulted.** Issue #26 (still open, `needs-triage`) was filed about divergent `--auto` semantics across runtimes. The underlying cause is partly this adoption gap — the user expected the assumptions mode to be available and found inconsistent behavior instead.

## Root Cause Analysis

The adoption process treated the upstream discuss-phase changes as a single unit ("wholesale-replace discuss-phase.md") when they were actually a multi-file feature:
- 1 command file change (routing gate)
- 1 existing workflow update (discuss-phase.md — adopted)
- 1 new workflow (discuss-phase-assumptions.md — missed)
- 1 new agent (gsd-assumptions-analyzer.md — missed)
- 1 template change (config.json — missed)
- 1 new doc (workflow-discuss-mode.md — missed)
- 2 existing workflow updates for mode-awareness (plan-phase.md, progress.md — missed)

The verification must-haves likely checked "discuss-phase.md is updated" and "codebase scouting works" but had no must-have for "discuss_mode config routing works" or "assumptions workflow exists."

## Upstream Reference

- Upstream repo: `gsd-build/get-shit-done`
- Commit: `18bb014` (2026-03-21)
- PR: #637 (`feat/discuss-mode-config-637`)
- Released in: upstream v1.28.0
- GSDR version at time of adoption attempt: v1.18.0 (Phase 52)
- GSDR current version: v1.18.3

## Implications

- Upstream adoption verification needs a "feature completeness" check, not just "file updated" checks
- Multi-file features need an explicit file manifest during adoption planning
- The `discuss_mode` feature should be properly adopted — it addresses a real need (codebase-first context gathering vs interview-style)
- Issue #26 should be updated with this root cause analysis

---
*Detected: 2026-04-03 during pre-milestone deliberation on epistemic-agency*
