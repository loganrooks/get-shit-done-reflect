---
id: sig-2026-04-02-background-agent-bypassed-quality-gates-broke-global-install
type: signal
project: get-shit-done-reflect
tags:
  - installer
  - quality-gate-bypass
  - destructive-action
  - agent-delegation
  - path-rewriting
  - cascade-failure
  - parallelization
created: "2026-04-02T17:00:00Z"
updated: "2026-04-02T17:00:00Z"
durability: principle
status: active
severity: critical
signal_type: deviation
phase: between-milestones
plan: 0
polarity: negative
occurrence_count: 1
related_signals:
  - sig-2026-02-23-installer-clobbers-force-tracked-files
  - sig-2026-02-17-release-process-fragile-manual-steps
  - sig-2026-03-30-release-workflow-forgotten-in-milestone-completion
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.18.0
detection_method: manual
origin: user-observation
---

## What Happened

During a deliberation session about patch release workflow integration, the orchestrator attempted to parallelize work by spawning a background agent (gsdr-executor in a worktree) to investigate and fix a discuss-phase version mismatch. The following cascade occurred:

1. **Wrong agent type**: Used `gsdr-executor` instead of `/gsdr:quick`, bypassing plan → check → execute → verify quality gates
2. **Installer ran despite redirect**: Agent ran `node bin/install.js --global` before the orchestrator's redirect message arrived, overwriting the user's preferred exploratory discuss-phase (444 lines) with the upstream decision-closing version (1098 lines)
3. **$HOME/$HOME path doubling bug**: The installer's `replacePathsInContent()` doubled the `$HOME` prefix in global installs, producing paths like `$HOME/$HOME/.claude/get-shit-done-reflect/bin/gsd-tools.cjs` — breaking all 91 workflow and command files in the global Claude install
4. **Emergency patching without quality gates**: Orchestrator applied a raw `sed` fix to 91 installed files without source fix, CI tests, test suite run, or patch release
5. **No release pathway followed**: The fix was applied directly to installed files. The source-level bug in `replacePathsInContent()` remains unfixed. No version bump, no CHANGELOG, no GitHub Release.
6. **GitHub Issues #26 and #27 not addressed**: Neither the discuss-phase semantic divergence nor the local-patches directory collision was fixed, tested, or closed.

## Context

This occurred during a deliberation about how release workflows should integrate into the harness — specifically while discussing quality gates, research-grounded evaluation, and structural reliability. The irony of bypassing every quality gate the harness provides while deliberating about quality gates was noted by the user.

The cascade demonstrates multiple failure modes:
- Agent delegation without proper workflow guardrails (executor instead of quick task)
- Async message delivery race condition (redirect arrived too late)
- Installer bug in path rewriting logic for global installs
- Emergency response that fixes symptoms (installed files) but not cause (installer source)
- No automatic signal creation despite obvious failure cascade (see related meta-signal)

## Potential Cause

1. **No agent-type enforcement**: Nothing prevents the orchestrator from choosing `gsdr-executor` for tasks that should use `/gsdr:quick`. The quick task workflow exists specifically to provide quality gates, but delegating directly to an executor bypasses them entirely.
2. **Background agent + global side effects**: Worktree isolation only isolates the git repo, not global file system writes. The installer modifies `~/.claude/` which is outside the worktree boundary. Background agents that touch global state are inherently dangerous.
3. **Installer path rewriting bug**: `replacePathsInContent()` in `bin/install.js` doubles the `$HOME` prefix during global installs. This is a pre-existing source bug that was exposed by the background agent running the installer.
4. **No quality gate for "fix" actions**: When the orchestrator applied the sed fix, nothing required tests, CI, or release. The harness has quality gates for planned work but not for emergency repairs.
