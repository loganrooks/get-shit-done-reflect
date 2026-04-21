---
doc_type: antipattern_registry
schema_version: v1
generated_at: 2026-04-20T00:00:00Z
---

# Anti-pattern Registry

**Purpose.** Named anti-patterns with severity tags, feeding the `gsd-tools
antipatterns check` subcommand (GATE-04c, Phase 58 Plan 10). Each entry has a
severity — `blocking` or `advisory` — that governs how the CLI responds when
the entry fires.

## Severity semantics

- **`blocking`** — Known to cause loss of work, epistemic regressions, or
  substrate corruption. When triggered:
  - Interactive mode: the CLI prints the `description`, `mandatory_understanding_prompt`,
    and `remediation`, then requires the user to type the exact token named in
    the prompt. Mismatch or refusal exits non-zero (exit code 4).
  - `--auto` mode: the CLI requires `--acknowledge-blocking <id>` to proceed.
    Without the flag the check exits non-zero (exit code 4). This prevents
    silent automation-bypass.
- **`advisory`** — A known failure pattern that is legitimate to accept in
  some contexts. The CLI prints a warning and passes. No prompt, no hard
  stop. Use the warning as a nudge to name why the pattern is acceptable
  here.

Entries with an unknown severity default to advisory with a warning note.

## Schema (per entry)

```yaml
- id: ap-<kebab-case-identifier>
  name: "Human-readable name"
  severity: blocking | advisory
  description: "One-to-three-sentence characterization of the failure mode."
  mandatory_understanding_prompt: "To continue, type exactly: <token>"
  remediation: "What to do instead (or how to resolve before continuing)."
  reference_signals: [sig-...]
```

- `id` — stable, kebab-case, unique within this file.
- `mandatory_understanding_prompt` — the CLI extracts the literal token
  following "type exactly:" and requires it character-for-character (after
  trim). If the prompt lacks the suffix, the expected token defaults to the
  entry `id`.
- `reference_signals` — prior signals this pattern was derived from; the
  knowledge store can link back.

## Fire-event contract

When an entry is evaluated, the CLI emits a `::notice::` marker on stdout:

- `::notice::gate_fired=GATE-04c result=pass pattern=<id>` — advisory warning,
  or blocking passed via typed token / `--acknowledge-blocking`.
- `::notice::gate_fired=GATE-04c result=ack_required pattern=<id>` — blocking
  entry in `--auto` mode without ack (exit 4).
- `::notice::gate_fired=GATE-04c result=block pattern=<id>` — interactive
  user-typed token mismatch (exit 4).
- `::notice::gate_fired=GATE-04c result=block pattern=<registry_missing>` —
  registry file not found (exit 4).

## Registry

```yaml
- id: ap-stale-continue-here
  name: "Stale .continue-here reuse"
  severity: blocking
  description: "Reusing a .continue-here file whose mtime predates the last STATE.md update, leading to incorrect working-set resumption and phantom task resumption against a newer codebase."
  mandatory_understanding_prompt: "To continue, type exactly: stale-continue-here"
  remediation: "Delete the stale file or run /gsd:pause-work to create a fresh handoff. The GATE-04b hard-stop in `handoff resolve` enforces this structurally."
  reference_signals: [sig-2026-02-16-stale-continue-here-files-not-cleaned, sig-2026-02-17-continue-here-not-deleted-after-resume]

- id: ap-squash-merge-default
  name: "Squash-merge on PRs (loses per-task provenance)"
  severity: blocking
  description: "Squash-merging a GSD PR collapses individual task commits into one opaque commit, which erases per-task provenance that STATE.md decisions, SUMMARY.md commit links, and gate_fire_events extractors depend on."
  mandatory_understanding_prompt: "To continue, type exactly: squash-merge-default"
  remediation: "Use `gh pr merge --merge` (never --squash). See `feedback_no_squash_merge.md` in user memory. GATE-02 (Phase 58 Plan 02) wires the no-squash repo setting."
  reference_signals: [sig-squash-merge-provenance-loss]

- id: ap-direct-to-main-runtime
  name: "Direct-to-main commit touching runtime files"
  severity: blocking
  description: "Committing to `main` with runtime-facing files (agents/, commands/, get-shit-done/bin/, .codex/skills/, etc.) staged, bypassing the branch + PR review path. DC-8 recurrence: .md IS runtime inside skill directories."
  mandatory_understanding_prompt: "To continue, type exactly: direct-to-main-runtime"
  remediation: "Create a branch, open a PR, pass CI (Test + GATE-15 parity). The `quick classify` CLI (Phase 58 Plan 08, GATE-03) returns exit 1/2/3 for runtime-facing / planning-authority / mixed sets."
  reference_signals: [sig-2026-04-17-gsdr-quick-bypassed-then-backfilled]

- id: ap-model-dispatch-drift
  name: "Literal model name drift across spawn sites"
  severity: blocking
  description: "Hard-coding or dropping the `# Model:` comment in a Task() spawn, causing compaction-resilience loss (GATE-13) or profile dispatch drift (GATE-05). Workflow-side enforcement requires echo_delegation macro + inline DISPATCH CONTRACT comment above every named Task()."
  mandatory_understanding_prompt: "To continue, type exactly: model-dispatch-drift"
  remediation: "Reapply the GATE-05 echo macro and GATE-13 dispatch contract around the Task() block. Phase 58 Plan 12 + Plan 07 CI grep guard this."
  reference_signals: [sig-model-dispatch-drift]

- id: ap-rm-partial-output
  name: "rm-on-error obliterating partial output"
  severity: blocking
  description: "Deleting a partially-written artifact with `rm -f` instead of quarantining it, erasing the diagnostic trace of the failure. Applies to .continue-here, summaries, ledgers, and measurement caches."
  mandatory_understanding_prompt: "To continue, type exactly: rm-partial-output"
  remediation: "Move the partial artifact to `.planning/handoff/archive/` (or the equivalent per-artifact archive slot) with a timestamp prefix. GATE-04a replaces the canonical .continue-here `rm -f` with this pattern."
  reference_signals: [sig-rm-partial-output]

- id: ap-branch-protection-admin-bypass
  name: "Branch-protection admin bypass"
  severity: blocking
  description: "Pushing directly to a protected branch because the actor holds admin permissions, bypassing `enforce_admins: true`. Silently re-introduces the direct-to-main failure mode the protection was installed to prevent."
  mandatory_understanding_prompt: "To continue, type exactly: branch-protection-admin-bypass"
  remediation: "Verify `enforce_admins: true` on `main` via `gh api /repos/:owner/:repo/branches/main/protection`. GATE-14 (Phase 58 Plan 06) live-fired this state flip 2026-04-20."
  reference_signals: [sig-branch-protection-admin-bypass]

- id: ap-advisory-workflow-prose
  name: "Advisory prose where a structural check belongs"
  severity: advisory
  description: "Expressing an invariant as prose instructions in a workflow file (\"remember to do X\") when a CLI, CI, or hook could enforce it as an exit code. Phase 58 as a whole targets this gap — this entry exists so checks can name the meta-pattern when surfacing it."
  mandatory_understanding_prompt: "To continue, type exactly: advisory-workflow-prose"
  remediation: "Promote the invariant to a structural gate: CLI subcommand, CI job, or pre-commit hook with a defined exit code. Register it in `58-05-codex-behavior-matrix.md` with per-runtime behavior."
  reference_signals: []
```

## Wiring

This plan (58-10) ships the registry + CLI substrate. Subsequent plans or
ad-hoc fixes wire specific workflows to call `gsd-tools antipatterns check`
at the precondition where an anti-pattern might fire. The canonical invocation
pattern is:

```bash
# Interactive: prompts the user to type the token for blocking entries.
node ~/.claude/get-shit-done/bin/gsd-tools.cjs antipatterns check --pattern-id ap-stale-continue-here

# Automated workflow: requires explicit ack to pass blocking entries.
node ~/.claude/get-shit-done/bin/gsd-tools.cjs antipatterns check \
  --pattern-id ap-stale-continue-here --auto --acknowledge-blocking ap-stale-continue-here
```

Exit codes:
- `0` — all checked entries passed (or were advisory).
- `4` — at least one blocking entry requires acknowledgement / typed token.
- `1` — registry missing or unexpected error.
