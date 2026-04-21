---
id: sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift
type: signal
project: get-shit-done-reflect
tags:
  - migration
  - upgrade-project
  - config
  - local-install
  - global-install
  - knowledge-base
  - cross-runtime
  - codex
  - claude
  - hooks
  - path-resolution
created: "2026-03-20T22:15:00Z"
updated: "2026-04-21T22:13:37.495Z"
durability: principle
status: active
severity: critical
signal_type: capability-gap
phase: 48
plan: {}
polarity: negative
occurrence_count: 1
related_signals:
  - sig-2026-02-11-local-install-global-kb-model
  - sig-2026-03-17-no-platform-change-detection
  - sig-2026-03-19-stale-platform-claims-in-source
  - sig-2026-03-04-quality-profile-executor-model-unverifiable-phase38
runtime: codex-cli
model: gpt-5.4
gsd_version: 1.17.5+dev
lifecycle_state: remediated
signal_category: negative
confidence: high
confidence_basis: Direct inspection of installed Codex and Claude runtimes, multiple project configs, upgrade workflow, config template, KB resolution rules, and live workspace KB layouts.
evidence:
  supporting:
    - Version-migration spec still treats SessionStart hook detection as primary, but Codex runtime has no hook support.
    - Codex skills/workflows still hardcode global install paths and at least one skill hardcodes writes to ~/.gsd/knowledge.
    - Project-local KB creation is tied to installer execution when .planning already exists, not guaranteed by new-project or upgrade-project.
    - Multiple projects with .planning/config.json still lack .planning/knowledge and have project signals under ~/.gsd/knowledge.
    - Some projects have both local and global signal histories, showing that local KB activation is not a complete or authoritative transition.
  counter:
    - Manifest-driven config migration does correctly detect many additive config gaps.
    - Claude installs do have a working version-check hook and cache path.
detection_method: manual
origin: user-observation
lifecycle_log:
  - event: remediated
    from: detected
    timestamp: "2026-04-21T22:13:37.495Z"
    reason: completed by 60-05-PLAN.md
    resolved_by_plan: 60-05-PLAN.md
---

# Cross-runtime upgrade, install precedence, and KB activation drift remain unmanaged

## What Happened

While auditing Codex-era projects and the installed GSD Reflect copies, a broader systems problem emerged:

1. The documented migration story assumes hook-based version detection, which exists on Claude but not on Codex.
2. The upgrade path focuses on manifest-declared config fields, but several important drift surfaces sit outside that model: active install selection, project-local KB activation, migration of existing global project signals, and repo-root-safe path resolution.
3. The config authority is split across multiple shapes: a template file, workflow prose, and the actual gsd-tools default-writer.
4. The knowledge-base model is inconsistent in practice: some repos write project signals to `.planning/knowledge/`, some to `~/.gsd/knowledge/`, and some to both.

This means a project can look "config-clean" under `manifest diff-config` while still being operationally drifted relative to the installed framework and the intended repo-local knowledge model.

## Context

Key observations from direct inspection:

- The version-migration spec says hook-based auto-detect is primary, but Codex has no hook support in practice.
- The Claude runtime does have `~/.claude/hooks/gsdr-version-check.js`, but it only writes cache; it does not itself prompt the user to run upgrade-project.
- Codex-side workflows still invoke the global install directly (for example, upgrade/new-project workflow commands call the absolute Codex install path), so project-local installs are not truly authoritative in the workflow layer.
- The Codex `gsdr-deliberate` skill still tells the system to write signals directly to `~/.gsd/knowledge/...`, bypassing project-local KB resolution.
- The installer can create `.planning/knowledge/`, but that happens during install/update only if `.planning/` already exists.
- The get-shit-done-reflect repo's own `.planning/config.json` is still on `gsd_reflect_version: 1.12.2` even while the installed runtime is `1.17.5+dev`, demonstrating that self-hosting drift can persist.
- Epistemic Agency is manifest-clean under `manifest diff-config`, yet it still required manual fixes for model routing, local KB activation, and sync from the global fallback. This proves upgrade-project does not cover the full operational drift surface.

## Potential Cause

The framework currently mixes four different concerns without a single runtime-neutral preflight:

1. **Config schema migration** -- handled reasonably well by the manifest system.
2. **Runtime capability differences** -- handled unevenly, with Claude-first hook assumptions still present in docs and flows.
3. **Install precedence** -- project-local versus global resolution is not enforced as a first-class invariant across workflows.
4. **Knowledge-base authority** -- project-local KB is treated as "preferred," but fallback writes and late migrations mean it is not actually authoritative.

The result is a drift class that is larger than config migration alone. Fixing it likely requires a unified preflight contract that every command uses before doing work:

- resolve repo root
- resolve active install root/version (project-local first)
- compare project version versus active install
- resolve KB root in a repo-root-safe way
- auto-create/migrate `.planning/knowledge` for project-scoped entries
- degrade gracefully on runtimes without hooks, instead of assuming hooks exist
