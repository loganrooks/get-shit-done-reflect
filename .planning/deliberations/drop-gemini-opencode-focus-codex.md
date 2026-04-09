---
title: Drop Gemini CLI & OpenCode Support — Focus on Claude Code + Codex
status: decided
decided: 2026-04-08
participants: [user, claude-opus-4-6]
triggers: [prix-guesser Codex failure forensics, GPT-5.4 cross-model audit, v1.20 roadmap restructure review]
---

# Deliberation: Drop Gemini CLI & OpenCode Support

## Question

Should GSD Reflect continue maintaining 4-runtime support (Claude Code, Codex CLI, Gemini CLI, OpenCode), or narrow to 2 (Claude Code + Codex CLI)?

## Context

The v1.20 Codex compatibility audits (2026-04-08) revealed that maintaining even ONE secondary runtime (Codex) at acceptable quality is failing. The installer has 4 format converters, 4 tool mapping tables, 4 config generators. The capability matrix tracks 4 runtimes × 4 capabilities. Every new workflow needs up to 4 capability_check blocks.

Meanwhile, Gemini CLI and OpenCode have zero actual deployments. The user's real deployment surface is Claude Code (primary development) and Codex CLI (cross-model verification, GPT-5.4 for specific tasks).

## Arguments For Dropping

1. **Maintenance burden is unsustainable.** The Codex audits found 15+ gaps in a runtime we actively use. Gemini and OpenCode support, which we DON'T use, is almost certainly in worse shape — but we'd never know because there's no deployment to surface failures.

2. **Depth over breadth.** Doing Claude Code + Codex really well means: proper adapter layer, real parity testing, behavioral guardrails, reasoning effort support. Hard enough for 2 runtimes without also maintaining converters for 2 more.

3. **Code simplification.** Removing Gemini and OpenCode paths from the installer eliminates ~400-500 lines, 2 tool mapping tables (`claudeToOpencodeTools`, `claudeToGeminiTools`), 2 frontmatter converters (`convertClaudeToOpencodeFrontmatter`, `convertClaudeToGeminiAgent`), and associated test coverage. Capability matrix shrinks. Workflow capability_checks simplify to binary Claude/Codex branches.

4. **Test reduction.** `tests/integration/multi-runtime.test.js` currently tests all 4 runtimes. Dropping 2 reduces test surface and CI time.

5. **Documentation clarity.** README, capability matrix, and install instructions can be specific rather than conditional across 4 runtimes.

## Arguments Against

1. **Community value.** Some npm users might be on Gemini CLI or OpenCode. Removing support removes their install path.

2. **Future optionality.** If Gemini CLI or OpenCode improve significantly, re-adding support is harder than maintaining it.

3. **The code exists and passes tests.** It's not actively broken (that we know of). Maintenance cost is only when adding new features.

## Decision

**Deprecate Gemini CLI and OpenCode.** Don't delete — mark as "community-maintained, not tested."

Implementation:
- Mark Gemini/OpenCode as deprecated in README and capability matrix
- Stop running multi-runtime tests for them (skip in CI, keep code for community)
- Stop adding capability_checks for them in new workflows
- New Phase 55.2 (Codex substrate) focuses exclusively on Codex, not "cross-runtime" generically
- Existing install paths remain functional but unsupported

## Grounding

- Prix-guesser forensics: 14 issues from a single Codex session (`~/workspace/projects/prix-guesser/.planning/phases/01-authored-round-contract/.continue-here.md`, `AGENTS.md`)
- GPT-5.4 drift audit: `.planning/audits/codex-drift-audit-gpt54-2026-04-08.md` — 6 currently-wrong assumptions about Codex
- GPT-5.4 harness audit: `.planning/audits/codex-harness-audit-gpt54-2026-04-08.md` — 6 missed gaps beyond Claude's 9
- Claude audit: 10 gaps in Codex compatibility (G1-G10)
- Roadmap reviews: `.planning/audits/v1.20-roadmap-restructure-review.md` (Sonnet), `.planning/audits/v1.20-roadmap-restructure-review-opus.md` (Opus)
- User statement: "drop support for gemini and opencode and just focus on doing codex and claude code really well, like really nailing the integration"
