---
created: 2026-04-17T06:28:36.480Z
title: Track Codex auto-compact prompt in parity phase
area: planning
priority: MEDIUM
source: signal
status: pending
files:
  - .planning/ROADMAP.md
  - .planning/REQUIREMENTS.md
  - .planning/PROJECT.md
  - get-shit-done/references/capability-matrix.md
  - .planning/knowledge/signals/get-shit-done-reflect/sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md
---

## Problem

Phase 60 currently frames Codex/Claude parity mostly in terms of visible
capabilities, artifact verification, and graceful degradation. The conversation
that produced `sig-2026-04-17-codex-auto-compact-prompt-parity-gap` surfaced a
different class of parity concern: Codex has runtime-specific continuity
behavior around compaction and auto-compact prompts, and that may affect
whether workflow-critical norms survive compression or resumed execution.

The immediate symptom was delegated `$gsdr-execute-phase` behavior not carrying
cleanly through the effective runtime behavior. The deeper concern is that
platform parity may be incomplete if it only tracks tools and file formats while
ignoring how each runtime preserves or reintroduces governing instructions after
compaction.

If this stays implicit, Codex and Claude can keep diverging on thin-orchestrator
workflows even when the visible skill/workflow text appears aligned.

## Solution

When Phase 60 parity work is planned or executed:

1. Extend the parity framing beyond "tool exists / tool missing" to include
   runtime continuity behavior.
2. Decide whether Codex should use an explicit auto-compact prompt to restate
   workflow-critical norms after compression, especially for delegated
   execution flows.
3. Record that decision in the parity artifacts, not just in hidden runtime
   behavior:
   - capability matrix
   - parity research / validation notes
   - any Phase 60 CONTEXT or requirement language if this becomes
     load-bearing
4. Clarify whether this is:
   - a documented Codex-specific degradation path
   - a configurable Codex runtime setting GSD should recommend or generate
   - a broader "policy parity" dimension the project should track alongside
     visible capabilities

The goal is not to assume auto-compaction caused the latest mismatch. The goal
is to ensure parity work explicitly checks whether compaction/prompt continuity
is required to preserve orchestrator behavior across runtimes.
