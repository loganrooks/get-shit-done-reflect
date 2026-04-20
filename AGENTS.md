# AGENTS.md

## Scope

This repository is the **source repo** for the npm package `get-shit-done-reflect-cc`.
Treat it differently from a normal consumer project.

- Source of truth lives in:
  - `agents/`
  - `commands/gsd/`
  - `get-shit-done/`
  - `bin/install.js`
  - `hooks/`
  - `tests/`
  - `.planning/`
- Installed copies under `.claude/`, `.codex/`, `~/.codex/`, or similar runtime mirrors are outputs, not canon.
- If behavior needs to change for users, edit source first, then reinstall or rebuild the affected runtime copy.

## Live Control Surface

Treat these files as the live operational state for this repo:

- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- the active phase directory under `.planning/phases/`
- active audit, quick-task, research, or deliberation artifacts relevant to the current task

Do not treat older installed runtime copies as authority when they diverge from source or planning state.

## Runtime And Path Rules

- This repo often contains both source and installed local runtime mirrors.
- Before making runtime-facing changes, distinguish clearly between:
  - repo source paths such as `get-shit-done/templates/...`
  - repo-local installed mirrors such as `.codex/get-shit-done-reflect/...`
  - user-global installed mirrors such as `~/.codex/get-shit-done-reflect/...`
- If a task is about installer behavior, config generation, or prompt content:
  - patch source first
  - verify tests against source
  - reinstall only after the source change is correct
- Never hand-edit `.claude/` outputs as the primary fix.
- Avoid treating `.codex/` or `~/.codex/` as canonical unless the task is specifically about verifying the installed result.

## Workflow Rules

- When the user invokes a GSD skill such as `$gsdr-quick`, `$gsdr-plan-phase`, or `$gsdr-execute-phase`, follow that workflow for real.
- Do not implement first and backfill the workflow artifacts later.
- If planner/executor delegation is part of the contract, use it before substantive implementation work.
- If you must deviate, stop and say so plainly before proceeding.
- Do not silently flatten:
  - planned vs improvised work
  - canonical artifacts vs post-hoc repair artifacts
  - source edits vs installed-runtime verification
  - user-requested workflow vs faster ad hoc execution

## Delegation And Reasoning

- For this repo, when spawning agents, use `xhigh` reasoning unless the user explicitly says otherwise.
- Prefer delegation for bounded GSD work where the workflow expects planner/executor separation.
- For this repo, when the user invokes or explicitly asks me to follow any repo-defined command, skill, workflow, agent contract, reference procedure, or other instruction surface whose contract requires launching an agent (`spawn_agent`), that counts as the user explicitly asking for sub-agents, delegation, or parallel agent work and explicitly authorizes that required `spawn_agent` call.
- If the user explicitly requests delegation to avoid parent-thread context growth, do not duplicate the delegated investigation in the parent thread unless the user explicitly asked for parallel verification.
- Before spawning, identify:
  - agent type
  - ownership boundary
  - exact files or artifact surface
- After an agent returns:
  - review the result
  - decide `accept`, `revise`, `park`, or `reject`
  - only then integrate or commit
- Do not use subagents performatively after the critical work is already done.

## Commit Hygiene

- Keep commits scoped to one coherent change.
- Prefer separate commits for:
  - source feature/fix work
  - planning/roadmap insertions
  - generated or migration bookkeeping
  - signal logging or knowledge-base updates
- Do not bundle installer code, roadmap edits, and config drift into one commit unless they are truly inseparable.
- If the worktree is already mixed, stabilize it into explicit buckets before committing.
- Use conventional commit prefixes already established in this repo:
  - `feat(...)`
  - `fix(...)`
  - `docs(...)`
  - `refactor(...)`
  - `test(...)`
  - `style(...)`

## Testing And Verification

- Use the smallest relevant test surface while iterating.
- For runtime or installer changes, usually start with:
  - targeted Vitest coverage
  - install/reinstall verification only after tests pass
- CI-critical commands for broader verification are:
  - `npm test`
  - `npm run test:infra`
  - `npm run test:upstream`
  - `npm run test:upstream:fork`
- If you verify against a live installed runtime, record that distinction explicitly.

## Repository-Specific Guidance

- `bin/install.js` is a hotspot. Treat changes there as high-blast-radius and pair them with focused tests.
- `tests/unit/install.test.js` and `tests/integration/multi-runtime.test.js` are the main regression surfaces for installer/runtime parity.
- The project regularly tracks Codex/Claude parity and runtime drift. When working in that area, preserve exact config keys, prompt paths, version sources, and source-vs-installed distinctions.
- If a task touches `.planning/config.json` or `.planning/migration-log.md`, check whether the diff is:
  - a real schema/config migration
  - automation counter drift
  - malformed generated output
  Commit those separately or clean them up first.

## Maintenance

- Keep this file narrow, stable, and operational.
- Put deep phase-specific instructions in `.planning/` artifacts, not here.
- Update this file when repo workflow expectations materially change, especially around:
  - source vs installed authority
  - delegation rules
  - commit grouping
  - runtime verification policy
