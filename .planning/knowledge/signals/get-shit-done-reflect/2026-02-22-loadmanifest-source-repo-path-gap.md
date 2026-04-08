---
id: SIG-20260222-loadmanifest-source-repo-path-gap
type: deviation
severity: notable
polarity: neutral
phase: 23
date: 2026-02-22
tags:
  - path-resolution
  - installer
  - source-repo
  - plan-spec-gap
  - auto-fix
detection_method: automated
origin: collect-signals
---

# Plan-Specified Path Resolution Was Incomplete for Source-Repo Context

The 23-01 plan specified a two-path resolution strategy for `loadManifest()`: check local `.claude/get-shit-done/feature-manifest.json` first, then fall back to global `~/.claude/get-shit-done/feature-manifest.json`. During Task 2 verification, the executor discovered that neither path resolves correctly when running `gsd-tools` from the source repository itself — the manifest lives at `get-shit-done/feature-manifest.json` relative to the repo root, which is `__dirname/../feature-manifest.json` from the script's location. The plan's path spec was written from an installed-user perspective and did not account for the development/source-repo use case.

The fix was a Rule 3 blocking auto-fix: a third fallback path using `path.join(__dirname, '..', 'feature-manifest.json')` was added to `loadManifest()`. The change was small, self-contained, and documented in the deviation section of 23-01-SUMMARY.md. No installed behavior was affected. The impact was caught by the Task 2 verify step before anything broke. This is a recurring concern for GSD tools that ship via installer: any function that resolves file paths needs to account for at least three contexts — local install (`.claude/`), global install (`~/.claude/`), and source repo (`__dirname`-relative). Plans that specify path resolution logic should explicitly enumerate all three resolution contexts or risk requiring a Rule 3 fix during execution.

## Evidence

- 23-01-PLAN.md Task 2 action spec: "Resolve manifest path (local `.claude/get-shit-done/feature-manifest.json` first, then global `~/.claude/get-shit-done/feature-manifest.json`)" — no mention of script-relative path
- 23-01-SUMMARY.md deviation section: "loadManifest() only checked .claude/get-shit-done/ (local) and ~/.claude/get-shit-done/ (global), but in the source repo the manifest lives at get-shit-done/feature-manifest.json. Commands failed with 'Manifest not found' when run from the source tree."
- Fix committed in 1117079, added `__dirname/../feature-manifest.json` as third fallback
- 23-VERIFICATION.md Key Link table: "Script-relative path `path.join(__dirname, '..', 'feature-manifest.json')` as third fallback"

## Recommendation

When writing plan specs for any path-resolution function in gsd-tools, explicitly enumerate all three resolution contexts: (1) local project install `.claude/get-shit-done/`, (2) global install `~/.claude/get-shit-done/`, (3) script-relative `path.join(__dirname, ...)` for source-repo execution. The existing `loadConfig()` and similar functions can serve as reference for which paths are needed. Omitting the source-repo path always causes "file not found" failures during development and verification — it is not caught until the tool is actually run against the source tree.
