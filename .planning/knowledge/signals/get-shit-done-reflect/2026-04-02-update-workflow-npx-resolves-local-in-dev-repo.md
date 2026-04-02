---
id: sig-2026-04-02-update-workflow-npx-resolves-local-in-dev-repo
type: signal
project: get-shit-done-reflect
tags: [update-workflow, installer, npx, dogfooding, developer-ergonomics]
created: 2026-04-02T23:00:00.000Z
updated: 2026-04-02T23:00:00.000Z
durability: workaround
status: active
severity: notable
signal_type: capability-gap
phase: n/a
plan: n/a
polarity: negative
source: manual
occurrence_count: 1
related_signals: [sig-2026-04-02-dev-version-suffix-lacks-commit-traceability]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.18.2+dev
---

## What Happened

Running `npx get-shit-done-reflect-cc --global` from inside the GSD source repo installs the local dev version instead of the published npm release. The global VERSION file gets `+dev` suffix when it should get the clean release version (e.g., `1.18.2` not `1.18.2+dev`).

## Context

The installer checks `isFromGitRepo = fs.existsSync(path.join(src, '.git'))` at line 2577 of `bin/install.js`. When `npx` runs from inside the repo, npm resolves `get-shit-done-reflect-cc` to the current project (since `package.json` name matches), so `src` is the repo root which has `.git/`. The version logic at line 2578 then applies `+dev` even for global installs.

This is expected npm behavior (local resolution before remote), but the `/gsdr:update` workflow doesn't account for it. A developer dogfooding from the source repo gets a dev global install when they intended a release install.

## Potential Cause

The update workflow should detect when it's running inside the GSD source repo and either:
- Warn that `npx` will use the local source, not npm
- Run `npx` from a temp directory (e.g., `cd /tmp && npx ...`)
- Use `npx --package=get-shit-done-reflect-cc@latest` to force remote resolution

Patch-level fix in the update workflow or installer.
