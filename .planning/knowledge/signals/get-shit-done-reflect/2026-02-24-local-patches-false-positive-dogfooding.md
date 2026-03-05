---
id: sig-2026-02-24-local-patches-false-positive-dogfooding
type: signal
project: get-shit-done-reflect
tags: [update, local-patches, dogfooding, self-hosting, installer, false-positive]
created: 2026-02-24T05:10:00Z
updated: 2026-02-24T05:10:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: N/A
plan: N/A
polarity: negative
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.0
---

## What Happened

When running `/gsd:update` on the GSD Reflect source repo itself (dogfooding scenario), the local patches system detected 10 "modified" agent specs and workflows. The update workflow presented these as user customizations that should be reapplied after the update. In reality, these were stale v1.14.2 installed files that had been superseded by v1.15.0 development — not intentional user modifications.

If the user had not questioned the legitimacy of the patches and blindly run `/gsd:reapply-patches`, stale v1.14.2 content could have been merged into the correct v1.15.0 files, potentially reverting improvements like the shared agent protocol extraction, updated commit protocols, and knowledge surfacing changes.

## Context

- Installed version: 1.14.2 (local install at `./.claude/`)
- Updated to: 1.15.0
- 10 files flagged as "locally modified" — all agent specs and one workflow
- The diff showed legitimate v1.15.0 improvements (agent protocol extraction, commit protocol updates), confirming the patches were stale, not custom
- User caught the issue by asking "any customizations should have been committed, what are these?"

## Potential Cause

The local patches system uses SHA256 manifest hashes to detect modifications. It compares the current file against the hash recorded at install time. In a dogfooding scenario (developing GSD within its own repo), the installed files naturally diverge from the manifest as development progresses — but these aren't "user customizations," they're development artifacts that the next install will replace with the correct version.

The system lacks awareness of whether it's running inside the source repo. Possible mitigations:
1. Detect when the install target is inside the source repo (e.g., check for `package.json` with the GSD package name) and skip patch backup
2. Compare backed-up patches against the newly installed files and auto-discard identical or subset matches
3. Add a "these patches are stale" indicator when the backed-up version is older than the version being installed and the diff shows only additions (not user modifications)
