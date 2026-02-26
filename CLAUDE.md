# GSD Reflect Development Rules

This is the development repo for GSD Reflect (get-shit-done-reflect-cc on npm).

## Critical: Dual-Directory Architecture

This project has TWO copies of agent specs, workflows, references, and commands:

| Directory | Role | When it's used |
|-----------|------|----------------|
| `agents/`, `get-shit-done/`, `commands/` | **npm source** — what gets packaged and shipped | `npm publish`, `npx get-shit-done-reflect-cc` |
| `.claude/agents/`, `.claude/get-shit-done/`, `.claude/commands/` | **install target** — local installed copy | Runtime (what Claude reads during sessions) |

### The Rule

**Always edit the npm source directories (`agents/`, `get-shit-done/`, `commands/`), never `.claude/` directly.**

The installer (`bin/install.js`) copies source → `.claude/`. If you edit `.claude/`, your changes will be overwritten on next install/update.

After editing source files, reinstall locally to update `.claude/`:
```bash
node bin/install.js --local
```

### Path Conventions

- npm source files use `~/.claude/get-shit-done/` paths (global prefix)
- Installed `.claude/` files use `./.claude/get-shit-done/` paths (local prefix)
- The installer's `replacePathsInContent()` handles the conversion during install

### Why This Matters

v1.15 Phase 22 (agent protocol extraction) edited `.claude/agents/` instead of `agents/`. The npm package shipped without agent-protocol.md. When the installer ran, it overwrote the protocol-enhanced agents with the old source versions. This went undetected for 23 days.

## Build & Test

```bash
npm test                    # 145 tests (vitest)
npm run test:upstream       # upstream gsd-tools tests
npm run test:upstream:fork  # fork-specific gsd-tools tests
npm run build:hooks         # build hook scripts
```

## Project Structure

- `.planning/` — GSD project management (STATE.md, ROADMAP.md, phases/)
- `.planning/deliberations/` — persistent design thinking across sessions
- `bin/install.js` — the installer (copies source to runtime config dirs)
- `get-shit-done/bin/gsd-tools.js` — CLI runtime (~5,400 lines)
- `get-shit-done/feature-manifest.json` — declarative feature/config schema
- `~/.gsd/knowledge/` — cross-project knowledge base (signals, spikes, lessons)

## Fork Conventions

- Fork tags: `reflect-v*` prefix (e.g., `reflect-v1.15.0`)
- Upstream remote: `--no-tags` to prevent tag collision
- Fork divergences tracked in `.planning/FORK-DIVERGENCES.md`
- Never modify `get-shit-done/bin/gsd-tools.js` directly (upstream file)
