---
phase: quick
plan: 32
duration: ~5min
completed: 2026-03-19
---

# Quick Task 32: Cross-runtime model profile language and per-runtime resolution

**Executed inline — upstreamed user's local Codex patches to source files**

## What Changed

Source files used Claude-specific model language ("which Claude model", "Opus everywhere", "Sonnet for execution"). Updated to cross-runtime symbolic tier language with a per-runtime resolution table documenting how each platform resolves tiers:

- **Claude Code**: `opus`/`sonnet`/`haiku` auto-resolve to latest (no change needed)
- **Codex CLI**: User's default model + `reasoning_effort` (xhigh/high/medium); haiku tier uses `gpt-5.4-mini`
- **Gemini CLI**: Auto mode (auto-selects best model)
- **OpenCode**: Provider defaults

## Files Modified

1. `get-shit-done/references/model-profiles.md` — cross-runtime intro, Per-Runtime Resolution table, tier-based philosophy
2. `get-shit-done/references/model-profile-resolution.md` — runtime-native resolution pattern with Codex spawn example
3. `get-shit-done/workflows/set-profile.md` — tier language, resolution reference
4. `get-shit-done/workflows/settings.md` — tier-based profile descriptions
5. `get-shit-done/workflows/help.md` — tier-based profile summaries

## Deliberation

Concluded in `.planning/deliberations/self-improvement-pipeline-design.md` (Option A: install-time injection).

## Task Commits
1. **Cross-runtime model profile language and per-runtime resolution** - `c8db983`

## Verification
- 350 tests pass (no regressions)
- Installed to local (`.claude/`) and global Codex (`~/.codex/`)
- Verified cross-runtime content deployed to Codex install
