---
id: sig-2026-02-11-kb-data-loss-migration-gap
type: signal
project: get-shit-done-reflect
tags: [data-loss, kb-migration, critical-gap, installer-dependency]
created: 2026-02-11T22:25:00Z
updated: 2026-04-02T22:00:00Z
durability: principle
status: remediated
severity: critical
signal_type: deviation
phase: post-17
plan: 0
runtime: claude-code
model: claude-opus-4-6
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-02-11-kb-script-wrong-location-and-path, sig-2026-02-11-local-install-global-kb-model]
---

## What Happened

13 signals and 3 lessons from v1.13 dogfooding were lost. They existed at ~/.claude/gsd-knowledge/ (confirmed by 12-02-SUMMARY.md which lists all 3 lesson files and reports "18 entries" in the index). v1.14 Phase 14 updated all source references to ~/.gsd/knowledge/ and wrote migration code in the installer (migrateKB()), but the installer was never run on the developer's machine. The old directory was subsequently deleted (cause unknown), and the data was never migrated. The files were never committed to git because KB lives outside the repo.

## Context

Discovered during post-v1.14 resume session when kb-rebuild-index.sh reported 0 lessons despite STATE.md and 12-02-SUMMARY.md confirming 3 lessons existed. This is the project's first real data loss incident.

## Potential Cause

Data migration that only runs inside an optional installer is a single point of failure. The developer installs locally (not globally), so the installer's migrateKB() never executes. No other code path checks for data at the old location. No backup was created. KB data was outside the git repo so there's no version control safety net. This is a defense-in-depth failure — every safety mechanism had a gap.

## Remediation

Mitigated by migrateKB() function with pre-migration backup, entry count verification, and symlink fallback (commit 1a79aea, 2026-02-14). Architectural concern (installer-only trigger) remains but data loss risk eliminated.
