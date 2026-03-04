---
created: 2026-02-17T01:16:15.254Z
title: Feature manifest system for declarative feature initialization
area: architecture
files:
  - .planning/config.json
  - bin/install.js
  - get-shit-done/workflows/release.md
  - commands/gsd/new-project.md
  - commands/gsd/upgrade-project.md
---

## Problem

When a new GSD feature is added (e.g., `/gsd:release`), there is no structured way to:

1. **Declare what config it needs** — `/gsd:release` assumes package.json, CHANGELOG.md, and npm, but other projects use Cargo.toml, pyproject.toml, or no package manager at all.
2. **Initialize that config on new projects** — `/gsd:new-project` doesn't ask about release infrastructure, CI triggers, or branching strategy.
3. **Backfill config on existing projects** — `/gsd:upgrade-project` doesn't detect that a newly added feature has uninitialized project-level config.
4. **Separate user-level from project-level concerns** — the installer handles user-level files (commands, workflows, agents at `~/.claude/`), but project-level config (release settings, CI prefs in `.planning/config.json`) has no structured initialization path.

Current pain: `/gsd:release` was created with hardcoded assumptions. Other projects can't use it without manual adaptation.

## Solution

Design a **feature manifest system** where each GSD feature declares:

- **Config schema** — what fields it needs in config.json (with types, defaults, descriptions)
- **Scope** — user-level (`~/.gsd/`, installer handles) vs project-level (`.planning/config.json`, init/upgrade handles)
- **Initialization prompts** — questions to ask during `/gsd:new-project` (e.g., "What's your version file? package.json / Cargo.toml / pyproject.toml / other")
- **Required/optional** — whether the feature can function without config or needs explicit setup
- **Migration** — how to initialize on existing projects (for `/gsd:upgrade-project`)

The initialization pipeline becomes generic:
- `/gsd:new-project` → iterates manifest → asks about each feature → writes config
- `/gsd:upgrade-project` → diffs manifest against existing config → initializes missing features
- `/gsd:update` → installs new files (user-level) → flags uninitialized project-level features

For `/gsd:release` specifically, config.json would gain a `release` section:
```json
{
  "release": {
    "version_file": "package.json",
    "changelog": "CHANGELOG.md",
    "changelog_format": "keepachangelog",
    "ci_trigger": "github-release",
    "registry": "npm",
    "branch": "main"
  }
}
```

This is a foundational architecture concern that should be part of v1.15 or its own milestone.
