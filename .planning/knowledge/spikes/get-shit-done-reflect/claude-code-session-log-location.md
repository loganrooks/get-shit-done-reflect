---
id: spk-2026-03-01-claude-code-session-log-location
type: spike
project: get-shit-done-reflect
tags: [logging, sensor, claude-code, signal-collection]
created: 2026-03-01T23:05:21Z
updated: 2026-03-01T23:05:21Z
durability: convention
status: active
hypothesis: "Claude Code stores session logs in a platform-specific location accessible for signal detection"
outcome: confirmed
rounds: 1
mode: research
---

# Spike: Claude Code Session Log Location

## Hypothesis

Claude Code stores session logs in a platform-specific location (likely ~/.claude/ or a cache directory) that can be read by a log sensor for pattern detection.

## Research Summary

Investigated Claude Code's file system footprint on macOS through direct filesystem exploration. Examined ~/.claude/, ~/Library/Caches/, ~/Library/Application Support/, and related directories.

## Results

**Hypothesis CONFIRMED with HIGH confidence.**

Two primary log sources identified:

1. **Session conversation data:** `~/.claude/projects/{dash-encoded-project-path}/{session-uuid}.jsonl`
   - Structured JSONL with typed messages (user, assistant, system, progress, file-history-snapshot, queue-operation)
   - Each entry includes timestamp, session ID, git branch, cwd, full message content
   - Permissions: 0600 (owner read/write) -- accessible by the same user
   - Scale: hundreds of files, hundreds of MB per active project

2. **Debug logs:** `~/.claude/debug/{session-uuid}.txt`
   - Plain text with timestamped entries tagged by level ([DEBUG], [ERROR])
   - Contains startup, MCP connections, auth flows, API requests, hook execution
   - Permissions: 0644 (world-readable)

Additional data stores exist (history.jsonl, stats-cache.json, file-history/, session-env/, shell-snapshots/) but have lower signal value for pattern detection.

## Decision

Enable the log sensor (SENSOR-07) with the two primary sources. Use streaming reads for recent sessions only (by modification time). Handle as best-effort with graceful degradation since these are internal formats with no stability guarantees from Anthropic.

## Consequences

- SENSOR-07 can be implemented with known paths and confirmed formats
- Session JSONL provides rich signal data (errors, tool failures, conversation patterns)
- Debug logs provide supplementary error/warning data
- Sensor should be configurable (path override) for future-proofing against format changes
- Privacy consideration: extract patterns/signals only, never store raw conversation content
