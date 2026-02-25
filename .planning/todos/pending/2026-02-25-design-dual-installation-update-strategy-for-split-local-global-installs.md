---
created: 2026-02-25T10:23:13.230Z
title: Design dual-installation update strategy for split local/global installs
area: tooling
priority: HIGH
source: conversation
status: pending
files:
  - .claude/get-shit-done/workflows/update.md
  - src/install.js
---

## Problem

`/gsd:update` only detects and updates ONE installation (local takes priority over global). When a user has GSD installed at both project-level (`./.claude/`) and user-level (`~/.claude/`), updating via `/gsd:update` silently leaves the other installation stale. This creates version drift between installations with no warning.

Broader concerns that need design work:

1. **Auto-detection**: The update workflow should detect BOTH installations and offer to update both (or at least warn about the stale one)
2. **Interaction model**: What's the intended relationship between local and global installs? Does local override global? Are they independent? How does Claude Code resolve commands when both exist?
3. **Version drift risks**: Different agent specs, workflow files, and command definitions at different versions could cause subtle bugs or inconsistent behavior
4. **Update UX**: Should `/gsd:update` default to updating all detected installations? Should it show a picker? Should it always sync both?
5. **Should split installations even be supported?**: Maybe the recommendation should be one or the other, with clear guidance on when to use which
6. **Installer behavior**: When running `npx get-shit-done-reflect-cc --local` in a repo that also has a global install, should it warn? Should it offer to remove the global one (or vice versa)?
7. **statusline/cache interactions**: Update check cache exists per-installation -- clearing one doesn't clear the other's stale indicator

## Solution

Design decisions needed before implementation:

- Define the intended installation topology (single vs. dual, recommended approach)
- Decide on update workflow changes (detect both → warn/update both)
- Consider adding `gsd-tools.js` command to list all detected installations with versions
- Consider deprecation path if dual-install is deemed unsupported
- Look at how Claude Code itself resolves `.claude/` files when both local and global exist
