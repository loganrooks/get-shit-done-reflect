---
id: SIG-260222-005-zero-touch-manifest-architecture
type: architecture
severity: notable
polarity: positive
phase: 24
plan: "03"
project: get-shit-done-reflect
created: 2026-02-22T00:00:00Z
tags: [manifest, architecture, extensibility, zero-touch, feature-addition]
---

# Zero-Touch Feature Addition: Manifest as Single Source of Truth for Config

## Observation

After Phase 24, adding a new feature to GSD requires only adding it to `feature-manifest.json`. No workflow files (new-project.md, upgrade-project.md, update.md) need modification. The manifest schema drives: auto-detection (auto_detect rules), interactive prompts (init_prompts), config defaults (schema.default), type validation (schema.type), and migration logging (formatMigrationEntry). All three workflows consume manifest commands generically.

## Context

Before Phase 24, adding a feature required: (1) hardcoding JSON blocks in new-project.md's config template, (2) adding bash detection scripts to new-project.md step 5.7, (3) adding migration patches to upgrade-project.md step 5, (4) adding entries to version-migration.md. This was a 4-file change minimum. Phase 24 Plans 01-03 replaced all hardcoded feature logic with manifest-driven commands, so the workflow files are now feature-agnostic.

The 24-03 summary explicitly states this goal achieved: "Adding a new feature to GSD now requires only adding it to feature-manifest.json — zero workflow changes needed."

## Impact

Significantly reduces the cost of adding new features to GSD. Also reduces the risk of workflow drift — if feature logic is in one place (feature-manifest.json), it can't diverge between upgrade-project and new-project. The manifest becomes the canonical authority for "what does this feature look like".

## Recommendation

Maintain this invariant: any feature-specific logic (defaults, prompts, detection, validation) must live in `feature-manifest.json`, not in workflow .md files. When reviewing future workflow PRs, watch for any hardcoded feature sections being added to upgrade-project.md, new-project.md, or update.md — these should be redirected to the manifest. The architecture test is: "if I add a new feature, how many files do I change?" The answer should remain 1 (feature-manifest.json).
