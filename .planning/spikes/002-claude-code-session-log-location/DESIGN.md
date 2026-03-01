---
created: 2026-03-01
status: complete
originating_phase: 35
depends_on: none
round: 1
mode: research
time_estimate: ~10 minutes (research only)
---

# Spike 002: Claude Code Session Log Location

## Question

Where does Claude Code store session logs, and can they be programmatically accessed for signal detection?

## Type

Exploratory

## Hypothesis

Claude Code stores session logs in a platform-specific location (likely ~/.claude/ or a cache directory) that can be read by a log sensor for pattern detection.

## Success Criteria

- [ ] Log file/directory location identified with HIGH confidence
- [ ] Log format documented (structured JSON, plain text, or other)
- [ ] Programmatic access feasibility assessed (readable by external tools? permissions?)
- [ ] Recommendation for log sensor implementation: enable with path, defer, or abandon

## Experiment Plan

Research-only. No experiments. Investigation will use:
- Codebase inspection of Claude Code's known paths
- File system exploration of ~/.claude/ and related directories
- Documentation and community source review
