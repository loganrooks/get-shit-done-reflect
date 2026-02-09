# External Integrations

**Analysis Date:** 2026-02-02

## APIs & External Services

**AI/LLM Runtimes:**
- Claude Code - Official Anthropic IDE
  - Type: Slash command runtime
  - Integration: Commands installed to `.claude/commands/gsd/`
  - Communication: Via slash commands (`/gsd:*`)

- OpenCode - Open-source AI IDE (free models)
  - Type: Slash command runtime
  - Integration: Commands flattened to `command/gsd-*.md`
  - Communication: Via slash commands (`/gsd-*`)
  - Config: `~/.config/opencode/opencode.json` with permissions

- Gemini CLI - Google's command-line AI tool
  - Type: Slash command runtime
  - Integration: Commands installed to `~/.gemini/commands/gsd/` (converted to TOML)
  - Communication: Via slash commands (`/gsd:*`)
  - Special support: Experimental agents enabled automatically

**npm Registry:**
- Service: npm (package registry)
  - Usage: Check for updates via `npm view get-shit-done-cc version`
  - Hook: `gsd-check-update.js` spawns background process
  - Caching: Results cached to `~/.claude/cache/gsd-update-check.json`
  - Timeout: 10 seconds for version check

## Data Storage

**Databases:**
- None - GSD does not use databases

**File Storage:**
- Local filesystem only
- Primary storage: `.planning/` directory in project root
  - Project metadata: `.planning/PROJECT.md`, `.planning/STATE.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md`
  - Workflow tracking: `.planning/config.json`
  - Codebase analysis: `.planning/codebase/` (STACK.md, ARCHITECTURE.md, etc.)
  - Research: `.planning/research/`
  - Quick tasks: `.planning/quick/`

**Config Directories:**
- Claude Code: `~/.claude/` (global) or `./.claude/` (local)
  - Cache: `~/.claude/cache/`
  - Todos: `~/.claude/todos/`
  - Settings: `~/.claude/settings.json`

- OpenCode: `~/.config/opencode/` (XDG-compliant)
  - Settings: `~/.config/opencode/opencode.json`
  - Permissions: Read + external_directory for GSD docs

- Gemini CLI: `~/.gemini/` (global) or `./.gemini/` (local)
  - Settings: `~/.gemini/settings.json`

**Caching:**
- Update check cache: `~/.claude/cache/gsd-update-check.json`
  - Prevents repeated npm registry queries
  - Updated once per session via SessionStart hook

## Authentication & Identity

**Auth Provider:**
- None - GSD does not handle authentication
- Inherits authentication from parent AI runtime (Claude Code, OpenCode, or Gemini)
- All operations are local file-based (no remote authentication)

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking

**Logs:**
- Console output only (STDOUT/STDERR)
- Colored terminal output (ANSI escape codes)
- Status messages to installer output
- Hook execution logged to terminal

**Statusline:**
- Optional: Configures Claude Code statusline via `settings.json`
  - Command: `node [config-dir]/hooks/gsd-statusline.js`
  - Input: JSON from Claude Code (model, workspace, context_window, session_id)
  - Output: Formatted statusline showing:
    - Model name
    - Current task (from `~/.claude/todos/`)
    - Context window usage (color-coded progress bar)
    - Directory

## CI/CD & Deployment

**Hosting:**
- npm registry (npmjs.org)
- GitHub repository (github.com/glittercowboy/get-shit-done)

**CI Pipeline:**
- Manual npm publish workflow (no automated CI/CD)
- Previously used GitHub Actions (removed as of v1.9.11)
- Version management: Semantic versioning in `package.json`

**Distribution:**
- npm package: `get-shit-done-cc`
- Installation method: `npx get-shit-done-cc`
- Supports global (`-g`, `--global`) and local (`-l`, `--local`) installation
- Auto-uninstall: `npx get-shit-done-cc --uninstall` (with runtime selection)

## Environment Configuration

**Required env vars:**
- None required - All operations work with defaults
- Optional: `CLAUDE_CONFIG_DIR`, `OPENCODE_CONFIG_DIR`, `GEMINI_CONFIG_DIR`, `XDG_CONFIG_HOME`

**Secrets location:**
- No secrets stored by GSD
- Parent AI runtime handles API keys (Claude, OpenCode, Gemini)
- User configuration stored in plaintext JSON in config directories

**Path handling:**
- Expands `~` (home directory) in all paths
- Cross-platform compatible:
  - Windows: Converts backslashes to forward slashes for Node.js compatibility
  - Mac/Linux: Uses standard forward slashes

## Hooks & Callbacks

**Incoming:**
- None - GSD does not expose webhook endpoints

**Outgoing:**
- SessionStart Hook: `gsd-check-update.js`
  - Triggered: When Claude Code starts (once per session)
  - Action: Spawns background process to check npm registry
  - Result: Writes cache file, silently notifies on update availability

- Optional Statusline Hook: `gsd-statusline.js`
  - Triggered: Continuously by Claude Code (displays in UI)
  - Input: JSON from Claude Code via stdin
  - Output: Formatted statusline to stdout

**Git Integration:**
- Executes git commands for:
  - Repository initialization: `git init`
  - Status checks: `git status`, `git check-ignore`
  - Diff viewing: `git diff`
  - Commits: `git add`, `git commit`, `git tag`
  - Branch management: `git branch`, `git merge`
  - Log viewing: `git log`

## Third-Party Integrations

**Discord:**
- Community link only (https://discord.gg/5JJgD5svVS)
- Command: `/gsd:join-discord` - Opens Discord invite
- No API integration (links to invite URL)

**GitHub:**
- Repository: https://github.com/glittercowboy/get-shit-done
- License: MIT (github.com/glittercowboy/get-shit-done/blob/main/LICENSE)
- No GitHub API integration

---

*Integration audit: 2026-02-02*
