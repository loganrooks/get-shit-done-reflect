# Quick Task 011: Add DEV indicator for local dev installs

**Date:** 2026-03-01
**Commit:** be5a1e4

## What Changed

- `bin/install.js`: Local installs (`--local`) write VERSION as `{version}+dev` instead of bare `{version}`
- `hooks/gsd-statusline.js`: Shows `[DEV]` tag (yellow background) when VERSION contains `+dev`
- `hooks/gsd-check-update.js`: Strips `+dev` suffix before comparing versions (prevents false update notifications)
- `hooks/gsd-version-check.js`: Strips `+dev` suffix before comparing versions (prevents false migration prompts)

## Why

Dogfooding unreleased changes (e.g., Phase 33 enhanced reflector) requires local installs that overwrite released files. Without a visible indicator, it's easy to forget you're running dev code. The `+dev` suffix follows semver build metadata conventions and propagates everywhere VERSION is displayed.

## Rollback

```bash
npx get-shit-done-reflect-cc  # reinstalls released version, clean VERSION
```
