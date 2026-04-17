Preserve continuity for an active GSD Reflect engineering session in this repo.

Produce a compact replacement history that is concise but operationally faithful.

Prioritize, in order:

1. the active control surface and its exact entrypoint path or command
2. the exact files that must be reopened first
3. the current task and immediate next action
4. current blockers, open findings, unresolved questions, and open opportunities
5. current branch, worktree, dirty-tree, and session boundaries if they matter
6. the latest meaningful commit, checkpoint, install step, or verification boundary if it is load-bearing
7. recent lessons learned, failed approaches, and mistakes not to repeat if they still constrain the next move
8. user corrections or policy changes that changed how the work must proceed
9. distinctions that must not flatten in summary:
   - decided vs open
   - active vs parked
   - current task vs deferred follow-up
   - repo-source edits vs installed-runtime edits
   - committed vs uncommitted
   - main rollout work vs delegated or background work
   - workflow followed vs workflow backfilled after the fact

Prefer exact repo file paths, ids, config keys, commands, and dates over vague prose.

When the active control surface is GSD planning, phase work, audit work, or quick-task execution, preserve explicitly:

- `.planning/PROJECT.md`
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- the active phase, plan, audit, or quick-task entrypoint path
- the minimum reread order if one matters
- any files that must be updated after the next meaningful action

When the active control surface is a quick task, preserve explicitly:

- quick-task id
- quick-task directory path
- whether `gsdr-planner` and `gsdr-executor` were actually used or only discussed
- whether artifacts are canonical or post-hoc backfill
- what still needs to happen before the quick task is truly complete

If the session includes external CLI runs, installs, subagents, or background processes, preserve only:

- whether they are still alive
- the exact output, log, artifact, or config paths that still matter
- the next decision needed about them

If the session exposed a real failure mode or operator correction, preserve it tersely as:

- `lesson learned`
- `avoid repeating`
- `replacement approach`

Do not waste space on:

- pleasantries
- generic transcript retelling
- raw log chatter unless it is still diagnostic
- stale rejected branches or abandoned alternatives

If there is uncertainty, preserve it as uncertainty. Do not make open questions sound settled.

End with a short `Next step` line whenever there is active work remaining.
