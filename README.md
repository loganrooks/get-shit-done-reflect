<div align="center">

# GSD Reflect

**An AI coding agent that learns from its mistakes.**

Built on top of [GSD](https://github.com/glittercowboy/get-shit-done) by TACHES.

[![npm version](https://img.shields.io/npm/v/get-shit-done-reflect-cc?style=for-the-badge&logo=npm&logoColor=white&color=CB3837)](https://www.npmjs.com/package/get-shit-done-reflect-cc)
[![GitHub stars](https://img.shields.io/github/stars/rookslog/get-shit-done-reflect?style=for-the-badge&logo=github&color=181717)](https://github.com/rookslog/get-shit-done-reflect)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)

<br>

```bash
npx get-shit-done-reflect-cc
```

**Works on Mac, Windows, and Linux.**

</div>

---

## What is GSD Reflect?

GSD Reflect extends [GSD](https://github.com/glittercowboy/get-shit-done) with a persistent learning system. The core value: **the system never makes the same mistake twice.**

GSD already solves context rot -- the quality degradation that happens as Claude fills its context window. GSD Reflect adds a feedback loop on top: deviations and fixes are captured as signals, patterns are detected, lessons are distilled, and relevant knowledge is surfaced automatically before it's needed.

Three additions on top of the full GSD system:

- **Signal tracking** -- Automatic detection of deviations during execution. When something goes wrong, it's recorded.
- **Spike/experiment workflow** -- Structured experimentation for genuine unknowns. Test approaches empirically instead of guessing.
- **Persistent knowledge base** -- Cross-project lessons that survive context resets. Knowledge accumulates across sessions and projects.

All upstream GSD features are included: project planning, multi-agent execution, phase verification, debugging, and everything else.

---

## What's Different from GSD

| Feature | GSD | GSD Reflect |
|---------|-----|-------------|
| Project planning | Yes | Yes |
| Multi-agent execution | Yes | Yes |
| Phase verification | Yes | Yes |
| Signal tracking | -- | Automatic deviation detection |
| Spike experiments | -- | Structured experimentation |
| Knowledge base | -- | Persistent cross-project lessons |
| Reflection engine | -- | Pattern detection and lesson distillation |
| Knowledge surfacing | -- | Auto-retrieval during research |
| Health check | -- | Workspace validation and repair |
| Version migration | -- | Seamless feature upgrades |
| DevOps context | -- | Adaptive initialization |

---

## The Learning Loop

GSD Reflect creates a self-improving cycle:

1. **Signals** capture what went wrong during execution -- deviations, bugs, missing functionality
2. **Reflection** detects patterns across signals -- recurring issues, common failure modes
3. **Lessons** are distilled into actionable knowledge -- what to do differently next time
4. **Surfacing** retrieves relevant lessons automatically before they're needed -- during research, planning, and debugging

The result: each project benefits from every previous project's mistakes.

---

## Getting Started

```bash
npx get-shit-done-reflect-cc
```

The installer prompts you to choose:
1. **Runtime** -- Claude Code, OpenCode, Gemini, or all
2. **Location** -- Global (all projects) or local (current project only)

Verify with `/gsd:help` inside your chosen runtime.

Start building with `/gsd:new-project`.

### Staying Updated

```bash
npx get-shit-done-reflect-cc@latest
```

<details>
<summary><strong>Non-interactive Install (Docker, CI, Scripts)</strong></summary>

```bash
# Claude Code
npx get-shit-done-reflect-cc --claude --global
npx get-shit-done-reflect-cc --claude --local

# OpenCode
npx get-shit-done-reflect-cc --opencode --global

# Gemini CLI
npx get-shit-done-reflect-cc --gemini --global

# All runtimes
npx get-shit-done-reflect-cc --all --global
```

Use `--global` (`-g`) or `--local` (`-l`) to skip the location prompt.
Use `--claude`, `--opencode`, `--gemini`, or `--all` to skip the runtime prompt.

</details>

### Recommended: Skip Permissions Mode

GSD Reflect is designed for frictionless automation. Run Claude Code with:

```bash
claude --dangerously-skip-permissions
```

---

## GSD Reflect Commands

These commands are unique to GSD Reflect:

| Command | What it does |
|---------|--------------|
| `/gsd:signal` | Manually log a signal from current conversation |
| `/gsd:collect-signals <N>` | Analyze phase execution for deviations |
| `/gsd:reflect` | Detect patterns across signals and distill lessons |
| `/gsd:health-check` | Validate workspace state (KB integrity, config, stale artifacts) |
| `/gsd:upgrade-project` | Migrate project to current version with mini-onboarding |

All standard GSD commands (`/gsd:new-project`, `/gsd:plan-phase`, `/gsd:execute-phase`, `/gsd:verify-work`, etc.) work identically. Run `/gsd:help` for the full command reference.

---

## How It Works

The full workflow is inherited from GSD:

```
/gsd:new-project    -- Initialize project (questions, research, requirements, roadmap)
/gsd:discuss-phase  -- Capture your vision before planning
/gsd:plan-phase     -- Research + plan + verify for a phase
/gsd:execute-phase  -- Execute all plans with fresh context windows
/gsd:verify-work    -- Confirm it works the way you expected
```

Loop **discuss, plan, execute, verify** until milestone complete. Context stays fresh. Quality stays high.

For the full workflow documentation, see the [upstream GSD README](https://github.com/glittercowboy/get-shit-done) or run `/gsd:help`.

---

## Configuration

GSD Reflect adds these configuration options to `.planning/config.json`:

| Setting | Options | Default | What it controls |
|---------|---------|---------|------------------|
| `health_check.frequency` | `milestone-only`, `on-resume`, `every-phase`, `explicit-only` | `milestone-only` | When health checks run automatically |
| `health_check.stale_threshold_days` | number | `14` | Days before artifacts are flagged as stale |
| `health_check.blocking` | `true`, `false` | `false` | Whether health check failures block operations |

All upstream GSD settings (mode, depth, model profiles, parallelization, branching) work identically.

---

## Troubleshooting

**Commands not found after install?**
- Restart Claude Code to reload slash commands
- Verify files exist in `~/.claude/commands/gsd/` (global) or `./.claude/commands/gsd/` (local)

**Updating to the latest version?**
```bash
npx get-shit-done-reflect-cc@latest
```

**Uninstalling?**
```bash
npx get-shit-done-reflect-cc --claude --global --uninstall
npx get-shit-done-reflect-cc --claude --local --uninstall
```

---

## Upstream Credit

GSD Reflect is built on top of [Get Shit Done](https://github.com/glittercowboy/get-shit-done) by [TACHES](https://github.com/glittercowboy). The core planning, execution, and verification system is theirs. GSD Reflect adds the learning loop.

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**Claude Code is powerful. GSD makes it reliable. GSD Reflect makes it learn.**

</div>
