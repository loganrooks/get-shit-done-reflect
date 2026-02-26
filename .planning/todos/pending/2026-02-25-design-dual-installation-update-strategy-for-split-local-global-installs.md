---
created: 2026-02-25T10:23:13.230Z
title: "Dual-install Phase 2: update flow, hook awareness, and version-pinned suppression"
area: tooling
priority: HIGH
source: conversation
status: pending
files:
  - .claude/get-shit-done/workflows/update.md
  - .claude/hooks/gsd-check-update.js
  - .claude/hooks/gsd-version-check.js
  - .claude/hooks/gsd-statusline.js
---

## Problem

Phase 1 (quick-7) adds dual-install detection, installer warnings, version/scope in command descriptions, and documentation. But the update flow and hooks still don't handle dual installations properly:

- `/gsd:update` updates whichever install it finds first (local priority) and silently leaves the other stale
- The statusline update indicator (`⬆ /gsd:update`) doesn't distinguish which scope is outdated
- No way for user to decline updating one scope without being nagged every session
- Changelog deliberation before accepting updates doesn't account for the different blast radius of local vs global updates

## Design Decisions (Resolved)

These were resolved during the Phase 1 planning session:

1. **Topology**: Global = baseline (available everywhere), Local = version pin (overrides global for a project). Dual install is supported and informed, not discouraged.
2. **Precedence**: Local always wins. Documented in `references/dual-installation.md`.
3. **Cross-project impact**: Updating global affects all projects without local installs. The version-check hook already detects mismatches, but user should be informed proactively during the update flow.

## Solution: Phase 2 Scope

### A. Update workflow scope choice (`update.md`)

When dual install detected, `/gsd:update` should:
1. Show both installations with versions
2. Fetch and display changelog
3. Ask: "Which installation(s) to update?" → Local only / Global only / Both
4. **Per-scope changelog deliberation**: Frame implications differently:
   - Local: "Changes affect this project only"
   - Global: "Changes affect ALL projects without local installs"
5. Confirm per scope before executing

No "Skip" option — if user ran `/gsd:update` they want to update something. They can ctrl+c to cancel.

### B. Scope-aware hook indicators

**gsd-check-update.js** and **gsd-version-check.js**: Detect both installations, include `dual_install`, `local_version`, `global_version` in cache output.

**gsd-statusline.js**: Show scope-aware indicator:
- `⬆ local+global` — both outdated
- `⬆ global` — only global outdated
- `⬆ local` — only local outdated

### C. Version-pinned suppression

When user updates local but not global (or vice versa), offer: "Suppress update indicator for [scope] v1.16.0?"

If accepted, store `declined_global_version: "1.16.0"` in cache. Suppression auto-expires when a NEWER version (e.g., v1.17.0) appears on npm. This means:
- User's choice is respected for the specific version they declined
- New releases automatically re-trigger the indicator
- No timers, no cleanup logic — one field handles it
- Indicator is hidden (not dimmed) for the declined version+scope

### D. Accidental global command execution guard

When both installations exist and the user invokes a command from autocomplete, Claude Code may serve the **global** version even though a **local** install exists. If local is newer and has changed workflows, protocols, or templates, the stale global command runs against project state that expects the newer version — producing subtle, hard-to-diagnose mismatches.

Potential mitigations:
- **Runtime version check in commands**: Commands read the local VERSION file and compare against the version injected in their own description. If the command is from an older version than the local install, warn before executing.
- **Hook-based guard**: A pre-command hook detects when a global command runs in a project with a local install and warns the user.
- **Proactive nudge**: When `/gsd:update` updates local but not global, warn: "Global is v1.15.1 — commands from global may conflict with your local v1.15.5 install. Consider updating global too, or uninstalling it if you only use GSD in this project."

This is a real risk because the mismatch is silent — the wrong command executes without error, just with outdated logic.

### Open Questions (for Phase 2 planning)

- Should we also show which projects would be affected by a global update? (e.g., scan for `.planning/` dirs in common project locations?) — Probably over-engineering.
- Hook source files vs `hooks/dist/` build pipeline — need to understand the build step before modifying hooks.
- How aggressive should the accidental-global-execution guard be? Warning only? Block execution? Auto-redirect to local version?
