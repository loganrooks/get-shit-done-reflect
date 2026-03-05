---
id: SIG-260222-003-atomic-write-same-directory-tmp
type: architecture
severity: notable
polarity: positive
phase: 24
plan: "01"
project: get-shit-done-reflect
created: 2026-02-22T00:00:00Z
tags: [atomic-write, config-safety, filesystem, architecture, rename]
---

# Atomic Config Writes Require Same-Directory .tmp for Same-Filesystem Rename Guarantee

## Observation

The `atomicWriteJson` helper writes to `filePath + '.tmp'` (same directory as the target file), then uses `fs.renameSync` to atomically replace the target. The .tmp file is NOT written to `os.tmpdir()` or any other directory. This is an explicit design constraint documented in both the plan spec and the summary.

## Context

During Phase 24 Plan 01, `atomicWriteJson` was built for safe config writes. The plan spec stated: "The .tmp file MUST be in the same directory as the target (not os.tmpdir()) to guarantee same-filesystem for atomic rename." `fs.renameSync` is only atomic when both source and destination are on the same filesystem. If the tmp file were in `/tmp/` and `config.json` were on a different filesystem (e.g., a mounted volume or different partition), the rename would fall back to a copy+delete, losing atomicity and risking corruption if interrupted.

The live verification confirmed `config.json.tmp` was absent after successful migration — the tmp file is created and immediately replaced in a single atomic operation.

## Impact

Config files are never left in a partially-written state. If the process is killed between write and rename, the original `config.json` is unchanged (the .tmp file is the only artifact, and it is discarded on next successful run). This eliminates a class of config corruption bugs.

## Recommendation

All JSON config writes in gsd-tools should go through `atomicWriteJson`, never through direct `fs.writeFileSync`. When adding new commands that modify config.json, import and use `atomicWriteJson`. Never use `os.tmpdir()` for atomic-rename tmp files — always place the .tmp in the same directory as the target. Verify absence of .tmp files in post-execution checks.
