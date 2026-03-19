---
title: "Local patch archive: versioned history instead of single-snapshot overwrite"
area: installer
priority: high
created: 2026-03-19
source: deliberation (self-improvement-pipeline-design.md)
signal: sig-2026-03-19-stale-platform-claims-in-source
---

# Local Patch Archive: Versioned History

## Problem

`gsd-local-patches/` is a single snapshot overwritten on each install. If a user:
1. Installs v1.17.4 → makes local patches
2. Installs v1.17.5 → patches backed up to `gsd-local-patches/`
3. Installs again (or v1.17.6) WITHOUT reapplying → `saveLocalPatches()` finds no modifications (manifest matches fresh install) → old patches are gone forever

There is no versioned archive. Patches that aren't reapplied between two installs are silently lost.

## Proposed Solution

Timestamped or version-keyed patch archives:
- `gsd-local-patches/v1.17.4-2026-03-19T07-38/` (archived snapshots)
- `gsd-local-patches/latest/` (current snapshot, same as today)

Or a patch log (`gsd-patch-history.json`) recording what patches existed at each install, even if the files are pruned.

## Context

This connects to the self-improvement pipeline deliberation's concern #3 (local fixes flow back). Local patches are observations — they indicate the system's outputs were wrong. If patches are silently lost, the system loses evidence of its own failures.

The installer already has the detection mechanism (`saveLocalPatches()` + hash manifest). What's missing is persistence across multiple install cycles.

## Scope

This is installer work (`bin/install.js`). Could be a quick task or part of a v1.18+ phase depending on scope.
