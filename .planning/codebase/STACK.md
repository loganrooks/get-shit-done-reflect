# Technology Stack

**Analysis Date:** 2026-02-02

## Languages

**Primary:**
- JavaScript - v16.7.0+ - Installation scripts, hooks, CLI tool

**Secondary:**
- Markdown - YAML frontmatter - Command definitions, agents, workflows, templates, references

## Runtime

**Environment:**
- Node.js v16.7.0 or higher (specified in `package.json` engines field)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present (v3)

## Frameworks

**Core:**
- None - Pure Node.js system (no web framework dependencies)

**CLI/Scripting:**
- readline (built-in) - Interactive prompts during installation

**Build/Dev:**
- esbuild v0.24.0 - Bundling hooks for distribution

## Key Dependencies

**Critical:**
- esbuild v0.24.0 - Bundles hook files (`gsd-check-update.js`, `gsd-statusline.js`) to `hooks/dist/` for installation
  - Dev dependency only
  - Used in `npm run build:hooks` to prepare distributable hook code

**No Production Dependencies:**
- The entire system uses only built-in Node.js modules (fs, path, os, readline, child_process)
- No external npm packages required at runtime

## Configuration

**Environment:**
- Installation supports environment variables:
  - `CLAUDE_CONFIG_DIR` - Override Claude Code config location (defaults to `~/.claude`)
  - `OPENCODE_CONFIG_DIR` - Override OpenCode config location (defaults to `~/.config/opencode`)
  - `GEMINI_CONFIG_DIR` - Override Gemini CLI config location (defaults to `~/.gemini`)
  - `XDG_CONFIG_HOME` - XDG Base Directory spec support for OpenCode

**Build:**
- `scripts/build-hooks.js` - Copies hook files to `hooks/dist/` for packaging
- Hooks are pre-built before npm publish (`prepublishOnly` script)

## Platform Requirements

**Development:**
- Node.js >= 16.7.0
- npm for dependency management
- Git (used extensively in GSD workflows)
- Mac, Windows, or Linux operating system

**Production (Runtime):**
- Node.js >= 16.7.0
- npm (or equivalent Node.js runtime)
- File system access to config directories
- Git repo required for project initialization

**Supported AI Runtimes:**
- Claude Code (official support)
- OpenCode (open-source alternative with free models)
- Gemini CLI (Google's AI CLI tool)

## Installation Method

**Distribution:**
- Published to npm as `get-shit-done-cc`
- Installed via `npx get-shit-done-cc` (runs `bin/install.js`)
- Can be installed globally or locally per project

**Installation Process:**
- Single entry point: `bin/install.js`
- Supports interactive prompts or non-interactive flags
- Installs to runtime-specific config directories:
  - Claude Code: `~/.claude/` (global) or `./.claude/` (local)
  - OpenCode: `~/.config/opencode/` (global, XDG-compliant) or `./.opencode/` (local)
  - Gemini CLI: `~/.gemini/` (global) or `./.gemini/` (local)

## Build Pipeline

**npm scripts:**
- `npm run build:hooks` - Bundles hook files for distribution
- `npm test` - Not configured
- `prepublishOnly` - Auto-runs before npm publish, builds hooks

**Output artifacts:**
- `hooks/dist/` - Contains bundled hook files ready for installation
- No compiled TypeScript (pure JavaScript)
- No built HTML/CSS (pure markdown-based system)

---

*Stack analysis: 2026-02-02*
