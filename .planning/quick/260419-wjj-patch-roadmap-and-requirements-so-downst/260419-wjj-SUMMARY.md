---
phase: quick
plan: 260419-wjj
model: gpt-5
context_used_pct: 12
subsystem: roadmap, requirements
tags: [provenance, roadmap, requirements, manual-signal, quick-task]
dependency_graph:
  requires:
    - "Quick task 260419-6uf manual gsdr-signal split provenance fix"
  provides:
    - "57.8 declarative text now explicitly names manual /gsdr:signal as an in-scope provenance surface"
    - "60.1 downstream requirements now explicitly carry manual-signal parity and regression ownership"
  affects:
    - ".planning/ROADMAP.md"
    - ".planning/REQUIREMENTS.md"
tech_stack:
  added: []
  patterns: [requirements-tightening, downstream-parity-guardrail]
key_files:
  created: []
  modified:
    - .planning/ROADMAP.md
    - .planning/REQUIREMENTS.md
decisions:
  - "Keep the patch declarative only: no new phases, no new requirement family, and no reopen of 57.8 implementation scope"
  - "Name the missed manual /gsdr:signal seam explicitly in 57.8 rather than treating it as implied by automated signal surfaces"
  - "Carry the parity obligation forward through PROV-09 survey text and PROV-13 regression coverage so later provenance work cannot silently drop the manual path again"
metrics:
  duration: 8min
  completed: 2026-04-20
---

# Quick Task 260419-wjj: Tighten downstream manual-signal provenance requirements

Patched the roadmap and requirement chain so the missed manual `/gsdr:signal` provenance surface is now explicit in the 57.8 record and explicitly owned by later provenance work.

## Task Commits
1. **Task 1-2: Tighten 57.8 and downstream provenance declarations** - `2a14f8df`

## What Changed

- `.planning/ROADMAP.md` now says Phase 57.8 covers both auto-collected signal surfaces and the manual `/gsdr:signal` command / installed-skill path.
- The 57.8 success criteria now explicitly cover manual signals in `PROV-01`, manual writer-side guidance in `PROV-03`, manual command / skill parity in `PROV-04`, and manual command / skill docs in `PROV-07`.
- The Phase 60.1 goal and success criteria now explicitly treat manual `/gsdr:signal` parity as a downstream provenance surface.
- `.planning/REQUIREMENTS.md` now explicitly includes manual `/gsdr:signal` in `PROV-01`, `PROV-03`, `PROV-04`, `PROV-07`, `PROV-09`, and `PROV-13`.

## Verification

- `rg -n "57\\.8|gsdr-signal|manual signal|installed skill|PROV-04|PROV-07" .planning/ROADMAP.md .planning/REQUIREMENTS.md`
  - Confirmed the 57.8 declarative record now names the manual `/gsdr:signal` surface.
- `rg -n "60\\.1|PROV-09|PROV-13|PROV-14|gsdr-signal|manual" .planning/ROADMAP.md .planning/REQUIREMENTS.md`
  - Confirmed downstream provenance text now explicitly covers manual-signal parity and regression ownership.
- No code or runtime files were changed; this quick task stayed within roadmap/requirements surfaces only.

## Parent Postlude Notes

- The quick-task row for `260419-wjj` can cite commit `2a14f8df` as the task commit.
- No `ROADMAP.md` phase ordering, numbering, or new requirement families were introduced.
