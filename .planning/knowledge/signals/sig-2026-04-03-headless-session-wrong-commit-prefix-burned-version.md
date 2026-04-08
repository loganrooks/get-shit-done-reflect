---
id: sig-2026-04-03-headless-session-wrong-commit-prefix-burned-version
type: signal
project: get-shit-done-reflect
tags:
  - headless-session
  - semver
  - commit-convention
  - release
  - delegation
  - patch-release
created: "2026-04-03T00:00:00Z"
updated: "2026-04-03T00:00:00Z"
durability: principle
status: active
severity: critical
signal_type: deviation
phase: between-milestones
plan: null
polarity: negative
occurrence_count: 1
related_signals:
  - sig-2026-04-02-agent-defaults-to-self-execution-over-delegation
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.19.0
detection_method: manual
origin: user-observation
---

## What Happened

A headless Claude session was dispatched to implement and release a patch for the three-mode discuss system (Issues #26, #32, #33). The dispatching prompt specified `feat: three-mode discuss system` as the commit message. The `/gsdr:release` skill correctly followed conventional commits semver rules: `feat:` → minor bump. Result: v1.18.3 → v1.19.0 instead of the intended v1.18.4. The version number v1.19 — which was reserved for the next milestone with empirically-supported scope from sensor prototype trials — was burned on a patch.

## Context

- The discuss-mode implementation was a patch fix restoring exploratory semantics that were silently dropped during v1.18 Phase 52's wholesale-replace of discuss-phase.md
- The headless session was dispatched with `claude -p` with full permissions and 200 max turns
- The session correctly: read apollo patches, implemented in source dirs, created PR #34, merged, ran release
- The session incorrectly: used `feat:` prefix when `fix:` was appropriate for a patch release
- The dispatching agent (this session) failed to specify the commit prefix convention in the prompt
- User frustration was significant — this was the culmination of multiple friction points in the session (failed agent launch attempts, interrupted workflow, context overload)

## Potential Cause

Two compounding failures:

1. **Prompt insufficiency for delegated release work.** The prompt gave implementation context but not release-convention context. The headless session had no way to know this was intended as a patch unless told explicitly. The `feat:` prefix was technically accurate (new feature: discuss modes) but semantically wrong for the release intent (patch to fix a regression).

2. **No semver intent field in the release workflow.** `/gsdr:release` infers version bump type from commit prefixes. There is no way to override this with an explicit `--patch` or `--minor` flag. The release workflow trusts conventional commits completely, with no human confirmation of the version number before tagging.

The deeper issue: delegating release decisions to headless sessions requires either (a) explicit version intent in the prompt, or (b) a confirmation gate in the release workflow before the irreversible npm publish step.
