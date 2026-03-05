---
id: SIG-260222-007-auto-detect-type-discrimination-files-vs-dirs
type: architecture
severity: notable
polarity: positive
phase: 24
plan: "02"
project: get-shit-done-reflect
created: 2026-02-22T00:00:00Z
tags: [auto-detect, filesystem, detection, file-exists, dir-exists, statSync]
---

# auto-detect Discriminates Files from Directories Using statSync

## Observation

The `manifest auto-detect` command uses two distinct check types: `file_exists` and `dir_exists`. The implementation uses `fs.statSync(fullPath).isDirectory()` to distinguish between them. `file_exists` rules reject paths that are directories; `dir_exists` rules reject paths that are files. This prevents false positives when a file named the same as an expected directory (or vice versa) exists on the filesystem.

## Context

During Phase 24 Plan 02, the auto-detect tests explicitly tested this discrimination: "file_exists does not match directories: Create a directory named `Dockerfile` (not a file), verify deploy_target is NOT detected" and "dir_exists does not match files: Create a file named `.github/workflows` (not a directory), verify ci_provider is NOT detected." The summary records this as a key decision: "auto-detect file_exists/dir_exists discriminate between files and directories using statSync."

## Impact

Without type discrimination, a user who accidentally created a file named `.github/workflows` instead of a directory would get false CI provider detection. Detection rules are reliable — they match the expected filesystem structure, not just path existence. The test coverage for this discrimination means regressions will be caught.

## Recommendation

Any future auto-detection rules added to `feature-manifest.json` should use `file_exists` for file checks and `dir_exists` for directory checks — do not use a generic `path_exists` check. When implementing new detection backends, always apply `statSync().isDirectory()` discrimination. The current test suite has examples for both check types that should be extended for any new check types added.
