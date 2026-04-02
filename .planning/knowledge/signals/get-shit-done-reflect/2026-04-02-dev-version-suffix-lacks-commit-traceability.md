---
id: sig-2026-04-02-dev-version-suffix-lacks-commit-traceability
type: signal
project: get-shit-done-reflect
tags: [version-tracing, installer, dev-builds, traceability, signals]
created: 2026-04-02T22:55:00.000Z
updated: 2026-04-02T22:55:00.000Z
durability: convention
status: active
severity: notable
signal_type: capability-gap
phase: n/a
plan: n/a
polarity: neutral
source: manual
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.18.2+dev
---

## What Happened

The VERSION file written by `bin/install.js` for local (source) installs uses a `+dev` suffix (e.g., `1.18.2+dev`) that provides no information about which commit the installation was built from. Two installs at different points on the same branch produce identical version strings, making it impossible to trace signals, bug reports, or beta distributions to a specific code state.

## Context

When developing GSD Reflect locally, the installer writes `{version}+dev` to the VERSION file. This version string appears in:
- Signal frontmatter (`gsd_version` field)
- Status line display
- Health check output
- Update comparison logic

For signals captured during development, `1.18.0+dev` is indistinguishable from another `1.18.0+dev` install made days later with different code. This breaks the traceability chain that the knowledge base depends on.

## Potential Cause

The installer's version-writing logic appends a static `+dev` suffix without consulting git. A simple fix would be to include the short commit hash: `1.18.2+dev.abc1234`. This follows semver build metadata conventions (`+` segment) and would make every dev install uniquely traceable in git history.

Implementation would involve the installer running `git rev-parse --short HEAD` during local installs and appending the result to the version string.
