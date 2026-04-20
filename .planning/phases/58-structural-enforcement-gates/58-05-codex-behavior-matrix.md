---
phase: 58-structural-enforcement-gates
plan: 05
artifact_type: codex_behavior_matrix
scope: phase_58_gates
authored_at: 2026-04-20T12:36:54Z
---

# Phase 58 — Per-Gate Codex Behavior Matrix

> **Authoritative AT-3 compliance artifact.** Every Phase 58 Wave 2 / Wave 3 / Wave 4 plan cites this matrix by file path when declaring its per-gate Codex behavior. Do not re-derive Codex behavior in downstream plans.

---

## Section 1 — Purpose and Authority

Phase 58's `<guardrails>` G-4 and `<constraints>` DC-4 reject the blanket "Codex has no hooks" framing. Every GATE in this phase must carry an explicit per-gate Codex behavior declaration — one of `applies`, `applies-via-workflow-step`, `applies-via-installer`, or `does-not-apply-with-reason` — with a motivating runtime substrate citation.

This matrix exists to satisfy **Acceptance Test AT-3** (58-CONTEXT.md:329):

> AT-3 (Codex per-gate declaration): Per-gate Codex behavior table authored as part of planning scope; every GATE-01..15 carries an explicit `applies` / `does-not-apply-with-reason` / `applies-via-workflow-step` marker.

Authority references:
- **58-CONTEXT.md** §9 (Cross-runtime substrate declaration), DC-4, G-4.
- **58-RESEARCH.md** §"Per-gate Codex behavior table (skeleton — plan to complete)" (lines 992-1015).
- **ROADMAP.md** Phase 58 §Success Criteria (lines 315-328).
- **Audit §5 and §9.3** — `.planning/audits/2026-04-20-phase-58-structural-gates-gap-audit/phase-58-structural-gates-gap-audit-output.md`.

---

## Section 2 — Methodology

### Allowed values

Every row in Section 4 declares Codex behavior using exactly one of these four values:

| Value | Meaning |
|---|---|
| `applies` | The gate fires identically on both Claude Code and Codex via a runtime-neutral mechanism (CI grep, filesystem append, branch protection, CLI subcommand). No runtime-specific wiring is required. |
| `applies-via-workflow-step` | The gate fires on Codex via a workflow-file edit that Codex reads exactly as Claude Code does (markdown-based enforcement). The workflow step is the substrate; the runtime reads it identically. |
| `applies-via-installer` | The gate relies on installer-wired hooks; installer writes the surface on the appropriate runtime; the consumer plan registers the extractor. |
| `does-not-apply-with-reason` | The gate has no named Codex substrate at Phase 58 ship time. The row MUST cite the missing substrate and the downstream phase that resolves. Blanket "Codex has no hooks" is not a valid reason — a named substrate gap with a named target phase is. |

### Rationale columns

Every row carries:
- `claude_code_behavior` — value from the set above.
- `codex_behavior` — value from the set above (may differ from claude_code).
- `rationale` — one-line reason the two values are what they are.
- `depends_on_phase_57_9` — `true` if Codex behavior is contingent on Phase 57.9 delivery, else `false`.
- `substrate_citation` — one file:line or artifact reference that grounds the declaration.

### Non-compliance markers

A row is NON-COMPLIANT if it contains any of:
- "blanket N/A"
- "Codex has no hooks" (without a named substrate gap and target phase)
- Empty rationale
- Missing substrate citation

The verifier in Plan 17 (`58-17-PLAN.md`) asserts no NON-COMPLIANT rows exist.

---

## Section 3 — Runtime Substrate References

Phase 58's Codex behavior derivations rest on this substrate landscape. All four values in Section 2 are grounded in observable artifacts:

**Hooks.** Codex CLI v0.118.0 exposes `SessionStart`, `SessionStop`, `UserPromptSubmit`, `PreToolUse`, and `PostToolUse` hooks under the `codex_hooks` feature flag (`~/.codex/hooks.json` or `<repo>/.codex/hooks.json`). The feature flag status is "under development" — hooks are functional but the API may change before graduating to "stable" (see `.planning/research/cross-runtime-parity-research.md:70-80`). GSD currently **does not** install `hooks.json` for Codex; Codex is unconditionally excluded at `bin/install.js:2846-2856`. Phase 57.9 is the prerequisite phase that changes this for `SessionStop`.

**CI.** `.github/workflows/ci.yml` runs on pull requests regardless of which runtime authored the commits. CI-hosted checks are strictly runtime-neutral for this phase's purposes — grep rules, diff classifiers, manifest parity checks, and branch-protection enforcement all fire on any commit landing via GitHub.

**Branch protection.** GitHub's branch protection settings (required status checks, required-reviews, `enforce_admins`) apply at push/merge time and do not distinguish between runtimes.

**Workflow markdown files.** `get-shit-done/workflows/*.md` and `get-shit-done/commands/*.md` are read by both runtimes via the installer-copied `.claude/` mirror (Claude Code) and `.codex/prompts/` + `.codex/skills/` trees (Codex). A workflow-step substrate that emits a log line or appends to a JSONL ledger runs identically on both runtimes because the workflow text drives the side-effect.

**Agent and command files.** Agent files under `agents/` and command files under `commands/` are installer-copied to both runtimes' surfaces. Codex agents live under `.codex/prompts/` (per `bin/install.js` Codex-branch logic); Claude Code agents live under `.claude/agents/`. Edits to source files propagate to both runtimes.

**Filesystem ledgers.** Append-only JSONL ledgers (e.g., `.planning/measurement/gate-events/*.jsonl`, `delegation-log.jsonl`) are written by workflow-step `echo` commands and are entirely runtime-neutral.

**Phase 57.9 dependency.** Per `ROADMAP.md:141-150`, Phase 57.9 (Hook & Closeout Substrate) is the prerequisite for any Phase 58 gate that relies on installer-wired hooks. Phase 57.9 delivers:
- Installer-wired `SessionStop` on Claude Code (`.claude/settings.json` entry pointing to `gsdr-postlude.js`).
- Codex hook surface under `codex_hooks` flag with explicit waiver path when flag unavailable.
- Session-level canonical markers for postlude-fired and incident conditions consumable by Phase 57.5 extractors.

If Phase 57.9 has not shipped at Phase 58 execution time, GATE-06 and GATE-07 degrade to `does-not-apply-with-reason` on Codex with `target_phase: 57.9` (and potentially Plan 60.1 for log-sensor wiring). This is explicitly recorded via the ledger format in Section 6.

---

## Section 4 — The Matrix

Each row covers one requirement. 25 requirements total: GATE-01, GATE-02, GATE-03, GATE-04a, GATE-04b, GATE-04c, GATE-05, GATE-06, GATE-07, GATE-08a, GATE-08b, GATE-08c, GATE-08d, GATE-08e, GATE-09a, GATE-09b, GATE-09c, GATE-09d, GATE-10, GATE-11, GATE-12, GATE-13, GATE-14, GATE-15, XRT-01.

### GATE-01 — Phase advancement blocked until PR green

| Field | Value |
|---|---|
| `gate_id` | GATE-01 |
| `requirement_text_summary` | Phase advancement blocks until PR merged and CI green; CI rule + required-status-check + branch protection. |
| `claude_code_behavior` | `applies-via-workflow-step` |
| `codex_behavior` | `applies-via-workflow-step` |
| `rationale` | CI enforcement + branch protection are runtime-neutral. The workflow-side check in `execute-phase.md` `offer_next` reads identically on both runtimes and the CI required-status-check fires on any PR regardless of authoring runtime. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `.github/workflows/ci.yml:1-85`; `execute-phase.md:770-824`; `sig-2026-04-10-phase-574-pr45-ci-clean-mergeable-baseline.md`. |

### GATE-02 — Merge strategy conformance (no squash, no rebase)

| Field | Value |
|---|---|
| `gate_id` | GATE-02 |
| `requirement_text_summary` | All `gh pr merge` and `git merge --squash` invocations across workflows / skills / agents enforce `--merge` (preserve commit history). CI grep verifies. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | CI grep over workflow / skill / agent files is runtime-neutral. The grep rule fires on any PR; authoring runtime does not affect file contents being checked. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `.github/workflows/ci.yml` (to gain `GATE-02` step per R10 P7); `execute-phase.md:793` (sole conforming site); `complete-milestone.md:603-658, 721` (non-conforming sites flagged in R10). |

### GATE-03 — Quick-task runtime-vs-docs classification

| Field | Value |
|---|---|
| `gate_id` | GATE-03 |
| `requirement_text_summary` | `quick.md` gains file-path / git-diff / manifest-based classifier to distinguish runtime-facing changes from pure-prose docs; CI post-hoc check flags direct-to-main runtime commits. |
| `claude_code_behavior` | `applies-via-workflow-step` |
| `codex_behavior` | `applies-via-workflow-step` |
| `rationale` | Both the `quick.md` workflow-step classifier and the CI post-commit check are runtime-neutral. `gh` and `git` surfaces are identical across runtimes. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `quick.md:155-183`; DC-8 (`260419-6uf` commit `ddcf1232` recurred 2026-04-19); R1 (composition: manifest-primary + diff-fallback + glob-edge-case). |

### GATE-04a — `.continue-here` consumed-on-read archival

| Field | Value |
|---|---|
| `gate_id` | GATE-04a |
| `requirement_text_summary` | `.continue-here` moves to dated archive path on consume; `rm` replaced with `mv` to `.planning/handoff/archive/YYYYMMDD-HHMMSS.continue-here`. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies-via-workflow-step` |
| `rationale` | Filesystem `mv` runs identically on both runtimes. Value difference reflects that Claude Code's existing `resume-project.md` step already runs; Codex runs the same workflow step via its installer-copied mirror. Both emit the same archive fire-event (presence of new file in `.planning/handoff/archive/`). |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `resume-project.md:127-138`; `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving.md`. |

### GATE-04b — `.continue-here` hard-stop staleness predicate

| Field | Value |
|---|---|
| `gate_id` | GATE-04b |
| `requirement_text_summary` | `resume-project.md` halts with explicit triage prompt if `.continue-here` predates STATE.md `last_updated` or latest STATE.md commit. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies-via-workflow-step` |
| `rationale` | The staleness predicate is a workflow-step `stat`/`git log` check; both runtimes execute it identically. Codex reads the same workflow file via the installer-copied mirror. Hard-stop emission is a stdout marker parseable by measurement. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `resume-project.md:127-138`; R2 staleness predicate definition. |

### GATE-04c — Anti-pattern severity framework (blocking / advisory)

| Field | Value |
|---|---|
| `gate_id` | GATE-04c |
| `requirement_text_summary` | Adopt blocking / advisory severity classifications; blocking items require mandatory understanding check (user echoes anti-pattern name). |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies-via-workflow-step` |
| `rationale` | Severity-prompt workflow-step is markdown-driven; both runtimes render the AskUserQuestion / prompt block identically. The understanding-check gate is structural (exit-coded workflow step), not runtime-specific. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:228; new `antipatterns.md` reference (per R10 P11). |

### GATE-05 — Delegation-site model echo

| Field | Value |
|---|---|
| `gate_id` | GATE-05 |
| `requirement_text_summary` | Enumerated delegation sites (`collect-signals.md`, researcher dispatch, `plan-phase.md`, `discuss-phase.md`, `audit.md`, spawned batch workflows) echo resolved model / profile / reasoning_effort before spawn; append to `delegation-log.jsonl` as fire-event. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | `delegation-log.jsonl` append is a filesystem operation; both runtimes execute the same workflow-step echo block. `resolveModelInternal` (Phase 57.8) is the canonical resolver; its output is runtime-aware but the echo-site workflow code is identical. See signal-detection risk in Section 5. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `collect-signals.md:249-251`; R3 enumeration (22 sites / 15 files); `sig-2026-04-10-researcher-model-override-leak-third-occurrence.md`. |

### GATE-06 — Automation postlude (session-end fire-event)

| Field | Value |
|---|---|
| `gate_id` | GATE-06 |
| `requirement_text_summary` | Session-end postlude emits postlude-fired marker via installer-wired `SessionStop` hook; extractor registers new session-meta field. |
| `claude_code_behavior` | `applies-via-installer` |
| `codex_behavior` | `applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason` |
| `rationale` | On Claude Code, Phase 57.9 installer wires `SessionStop` entry into `.claude/settings.json`. On Codex, contingent path: if `codex_hooks=true` (feature flag), installer writes `<repo>/.codex/hooks.json` with `SessionStop` entry (Phase 57.9 delivery). If `codex_hooks` is unavailable, row degrades to `does-not-apply-with-reason` with `target_phase: "Phase 57.9 (flag enablement) or Phase 60.1 (workflow-step fallback)"`. Phase 58 consumes the resolved capability; Phase 58 does not re-do 57.9's work. |
| `depends_on_phase_57_9` | true |
| `substrate_citation` | `ROADMAP.md:141-150` (Phase 57.9); `bin/install.js:2846-2856` (current Codex skip); `.planning/research/cross-runtime-parity-research.md:70-80` (codex_hooks flag). |

### GATE-07 — Session-level incident self-signal

| Field | Value |
|---|---|
| `gate_id` | GATE-07 |
| `requirement_text_summary` | Session-level error-rate / direction-change / destructive-event markers emitted and consumed; self-signal on incident. |
| `claude_code_behavior` | `applies-via-installer` |
| `codex_behavior` | `applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason` |
| `rationale` | Same pattern as GATE-06: Phase 57.9 ships the `session-meta` field (error-rate / direction-change / destructive-event structured record) and Phase 58 registers the extractor. Codex degradation path identical: workflow-step emission if `codex_hooks=true`, otherwise `does-not-apply-with-reason` with `target_phase: "Phase 57.9 (markers) + Phase 60.1 (log-sensor live wiring)"` per `<deferred>`. |
| `depends_on_phase_57_9` | true |
| `substrate_citation` | `ROADMAP.md:141-150` (Phase 57.9 markers); R4 §Required-prerequisites-from-57.9 table; `<deferred>` ("Log-sensor live incident-detection wiring for GATE-07 — Phase 60 + 60.1"). |

### GATE-08a — Discuss-phase richer adoption: upstream fetch artifact

| Field | Value |
|---|---|
| `gate_id` | GATE-08a |
| `requirement_text_summary` | Current-state verification: fetch upstream `discuss-phase-assumptions.md` and produce per-category adoption-decision diff artifact. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | The fetch artifact is a file in `.planning/` produced by a workflow step; filesystem / `curl` operations are runtime-neutral. Both runtimes read the resulting artifact identically. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `discuss-phase-assumptions.md` (279 fork lines vs 671 upstream lines per R5); REQUIREMENTS.md:236-244. |

### GATE-08b — `gsdr-assumptions-analyzer` agent

| Field | Value |
|---|---|
| `gate_id` | GATE-08b |
| `requirement_text_summary` | Port / build `agents/gsdr-assumptions-analyzer.md`; installer copies to both runtimes' agent surfaces. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Agent files are installer-copied to both runtimes (`.claude/agents/` on Claude Code; `.codex/prompts/` on Codex per installer rewrite). Agent markdown is read identically once installed. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | New `agents/gsdr-assumptions-analyzer.md`; `bin/install.js` Codex-branch copy logic. |

### GATE-08c — Discuss-mode workflow documentation

| Field | Value |
|---|---|
| `gate_id` | GATE-08c |
| `requirement_text_summary` | Author `docs/workflow-discuss-mode.md` — three discuss modes (standard interactive / --auto exploratory / richer-adoption) + typed-claim vocabulary + confidence-badge mapping. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Pure markdown documentation. No runtime-specific behavior; both runtimes read `docs/` identically. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | New `docs/workflow-discuss-mode.md`; R5 §(f) confidence-badges ↔ typed-claims mapping. |

### GATE-08d — Mode-aware gating in plan-phase / progress workflows

| Field | Value |
|---|---|
| `gate_id` | GATE-08d |
| `requirement_text_summary` | `plan-phase.md` and `progress.md` gain `text_mode` branches (fork has `--auto` but not plain-text rendering paths). |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Workflow-file edits; both runtimes read the mode-conditional blocks identically. Mode resolution happens at workflow-read time regardless of runtime. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `plan-phase.md`, `progress.md`; R5 §(c) mode-aware gating. |

### GATE-08e — Narrowing rationale recorded in ledger

| Field | Value |
|---|---|
| `gate_id` | GATE-08e |
| `requirement_text_summary` | Any narrowing of upstream's richer version recorded under GATE-09c narrowing-decision provenance in the Phase 58 ledger. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Ledger entry is a filesystem artifact with YAML frontmatter; both runtimes author / read identically. GATE-09c provenance mechanism is itself runtime-neutral. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | `58-LEDGER.md` (to be created per Plan 20 / P20); R5 §Required-artifacts §GATE-08e; R6 §GATE-09 schema. |

### GATE-09a — Scope-translation ledger as named artifact with schema

| Field | Value |
|---|---|
| `gate_id` | GATE-09a |
| `requirement_text_summary` | Standalone `NN-LEDGER.md` per phase with YAML-frontmatter schema; required fields `context_claim`, `disposition` (enum), `target_phase_if_deferred`, `narrowing_provenance`; validated by `frontmatter.cjs`. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Filesystem ledger + KB schema v2 + `frontmatter.cjs` validator; all runtime-neutral. Both runtimes author / parse YAML frontmatter identically. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | R6 §GATE-09 schema specification; `frontmatter.cjs` candidate validator; `kb.cjs` dual-write invariant. |

### GATE-09b — Planning-gate check for unresolved `[open]` scope-boundary claims

| Field | Value |
|---|---|
| `gate_id` | GATE-09b |
| `requirement_text_summary` | `plan-phase.md` halts if any `[open]` CONTEXT.md scope-boundary claim remains unresolved without named deferral to downstream phase. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Workflow-step exit-coded check; reads CONTEXT.md, fails if predicate matched. Runtime-neutral. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:248; `plan-phase.md` gate step (new per R10 P17). |

### GATE-09c — Narrowing-decision provenance recorded in ledger frontmatter

| Field | Value |
|---|---|
| `gate_id` | GATE-09c |
| `requirement_text_summary` | RESEARCH.md / PLAN.md narrowing decisions cite originating CONTEXT claim; recorded as provenance entry in the ledger. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | YAML frontmatter in ledger entries; both runtimes author / validate identically. The narrowing-decision template is a workflow-step block read by both runtimes. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:250; R6 schema §narrowing_provenance field. |

### GATE-09d — Verifier reads ledger and fails on silent disappearance

| Field | Value |
|---|---|
| `gate_id` | GATE-09d |
| `requirement_text_summary` | Phase verification reads ledger; fails if load-bearing CONTEXT claim disappears silently. Uses Phase 57.8 role-split provenance for attribution. Meta-gate (GATE-09e) embedded: asserts each Phase 58 gate fires ≥1 time in introducing phase trace. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Verifier is a `gsd-tools` subcommand reading filesystem artifacts (ledger + CONTEXT.md + measurement extractor output). Runtime-neutral by construction. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:252; `ROADMAP.md:123-124` (Phase 57.8 dependency, merged `c8a15d95`); R8 meta-gate §GATE-09e adoption. |

### GATE-10 — Phase-closeout reconciliation substrate

| Field | Value |
|---|---|
| `gate_id` | GATE-10 |
| `requirement_text_summary` | `gsd-tools phase reconcile <N>` subcommand atomically reconciles STATE.md + ROADMAP phase row + plan checkboxes + planning-authority sidecars in a single commit, or rejects with blocking message. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | CLI subcommand is runtime-neutral — `node gsd-tools.cjs phase reconcile` executes identically regardless of the calling runtime's agent harness. Fire-event is the commit + stdout marker. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:254; R9 composability analysis; new `lib/reconcile.cjs`. |

### GATE-11 — Release-boundary assertion

| Field | Value |
|---|---|
| `gate_id` | GATE-11 |
| `requirement_text_summary` | `gsd-tools release check` subcommand asserts release advanced OR `.planning/release-lag.md` written with named rationale; surfaces in phase-close workflow. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | CLI subcommand + `.planning/release-lag.md` schema; both are filesystem-based and runtime-neutral. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:256; R11 `.planning/release-lag.md` schema; `sig-2026-03-30-release-workflow-forgotten-in-milestone-completion.md`. |

### GATE-12 — Agent-dispatch archival envelope (no-rm on partial output)

| Field | Value |
|---|---|
| `gate_id` | GATE-12 |
| `requirement_text_summary` | Workflow-level envelope around agent dispatch captures any written files on non-zero exit; archives to `.planning/phases/NN-*/.archive/YYYYMMDDHHMMSS-failed-agent-id/` before redispatch. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Workflow envelope is markdown-driven; filesystem `mv` on non-zero exit is identical across runtimes. Both runtimes write partial outputs to the same phase directories. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:258; `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving.md`. |

### GATE-13 — Dispatch contract restated inline at spawn sites

| Field | Value |
|---|---|
| `gate_id` | GATE-13 |
| `requirement_text_summary` | Every delegation spawn block restates full dispatch contract (agent type, model, reasoning effort, required inputs, output path) inline at the spawn site, not by reference. Especially critical under Codex auto-compact. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Inline restated contracts are workflow-file content; both runtimes read identically. Codex auto-compact specifically benefits: restated contract survives context compaction because the text is at the spawn site, not cross-referenced. Fire-event: CI grep that no `{template}` placeholders remain at spawn sites. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:260; R3 §GATE-13 dispatch contract restatement; `sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md` (3 occurrences). |

### GATE-14 — No direct pushes to main for gated work

| Field | Value |
|---|---|
| `gate_id` | GATE-14 |
| `requirement_text_summary` | Branch protection with `enforce_admins: true` and `strict: true` required status checks; folds into GATE-01 CI enforcement. Optional pre-push hook as secondary layer. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Branch protection applies at GitHub's push/merge boundary regardless of runtime. `enforce_admins: true` flip is a single GitHub API call; runtime-neutral. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md (GATE-14 entry); `sig-2026-04-10-ci-branch-protection-bypass-recurrence.md` (3 occurrences, severity critical). |

### GATE-15 — Source↔installed mirror parity as CI check

| Field | Value |
|---|---|
| `gate_id` | GATE-15 |
| `requirement_text_summary` | Post-install CI step computes `diff -r` between `agents/` / `get-shit-done/` / `commands/` and installed mirror (`.claude/agents/` etc.) with installer path-transformation applied (`get-shit-done/` → `get-shit-done-reflect/`, `gsd-` → `gsdr-`). Fires on every PR touching those paths. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | CI check is runtime-neutral. The parity invariant is between source and installed mirror, not between runtimes. `bin/install.js:2868-2869` path transformations are the computed expected; CI asserts the observed matches. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:264; `CLAUDE.md:15-27` (dual-directory hazard); `bin/install.js:2868-2869` (path prefix rewrites). |

### XRT-01 — Cross-runtime substrate declaration (plan-phase assertion)

| Field | Value |
|---|---|
| `gate_id` | XRT-01 |
| `requirement_text_summary` | Any hook-dependent commitment in CONTEXT.md has an accompanying Codex degradation claim before plan-phase begins; verifier checks `capability-matrix.md` diff in closeout. |
| `claude_code_behavior` | `applies` |
| `codex_behavior` | `applies` |
| `rationale` | Plan-phase assertion is a `gsd-tools` workflow step reading CONTEXT.md frontmatter / `[projected]` claims. Capability-matrix diff check in closeout is filesystem-based. Both runtime-neutral. |
| `depends_on_phase_57_9` | false |
| `substrate_citation` | REQUIREMENTS.md:419; `get-shit-done/references/capability-matrix.md` (audit §4.1 re-verified post-55.2); 58-CONTEXT.md §9 DC-4. |

### Summary table (compact reference)

| gate_id | claude_code | codex | depends_on_57_9 |
|---|---|---|---|
| GATE-01 | applies-via-workflow-step | applies-via-workflow-step | false |
| GATE-02 | applies | applies | false |
| GATE-03 | applies-via-workflow-step | applies-via-workflow-step | false |
| GATE-04a | applies | applies-via-workflow-step | false |
| GATE-04b | applies | applies-via-workflow-step | false |
| GATE-04c | applies | applies-via-workflow-step | false |
| GATE-05 | applies | applies | false |
| GATE-06 | applies-via-installer | applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason | true |
| GATE-07 | applies-via-installer | applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason | true |
| GATE-08a | applies | applies | false |
| GATE-08b | applies | applies | false |
| GATE-08c | applies | applies | false |
| GATE-08d | applies | applies | false |
| GATE-08e | applies | applies | false |
| GATE-09a | applies | applies | false |
| GATE-09b | applies | applies | false |
| GATE-09c | applies | applies | false |
| GATE-09d | applies | applies | false |
| GATE-10 | applies | applies | false |
| GATE-11 | applies | applies | false |
| GATE-12 | applies | applies | false |
| GATE-13 | applies | applies | false |
| GATE-14 | applies | applies | false |
| GATE-15 | applies | applies | false |
| XRT-01 | applies | applies | false |

25 rows. All GATE-01..15 sub-requirements + XRT-01 covered.

---

## Section 5 — Codex-Specific Open Risks

These risks are NOT Phase 58 scope fixes — they are surfaced here because they would undermine the effectiveness measurement of Phase 58 gates on Codex sessions. They are carried into Phase 60 / 60.1 / future milestones.

### Risk 1 — Stale Codex model-class heuristic in `signal-detection.md`

**Source:** `get-shit-done/references/signal-detection.md:67-76` contains an opus/sonnet class heuristic that is Claude-only. Research R10 (this phase) and the 2026-04-08 Codex drift audit both flag this as unremediated. The heuristic treats model-class as a Claude-style profile; Codex's GPT-family models do not fit the vocabulary.

**Impact on Phase 58:** GATE-05 and GATE-13 effectiveness measurement on Codex sessions may be distorted. GATE-05 emits `delegation-log.jsonl` lines with resolved model names; if the measurement pipeline's classification stage applies Claude-only heuristics, Codex delegations will be misbinned. GATE-13 dispatch-contract grep check itself is unaffected, but downstream analysis of GATE-13 fire-events under model-stratification may be misleading.

**Phase 58 scope:** Explicitly OUT OF SCOPE per `<deferred>`. Recorded here as a known risk for Phase 60 / 60.1 measurement interpretation. Does NOT demote any row in Section 4 from `applies` — the gates themselves fire; their downstream interpretation is the at-risk axis.

**Downstream phase for resolution:** Phase 60 parity work (per STATE.md todo "Track Codex auto-compact prompt handling in Phase 60 parity work") or Phase 60.1 measurement-layer fixes.

### Risk 2 — GATE-06 / GATE-07 Codex degradation expected at Phase 58 execution time

**Source:** Phase 57.9 (Hook & Closeout Substrate) is the prerequisite for GATE-06 / GATE-07's Codex behavior. As of 2026-04-20, `.planning/phases/57.9-*/` does not exist with plans at `ready_to_execute` or `complete`. AT-1 requires Phase 58 plan to either confirm 57.9 complete OR explicitly defer GATE-06/07 with GATE-09c provenance.

**Impact on Phase 58:** If 57.9 has not shipped when Wave 4 reaches GATE-06/07, the expected path per `<deferred>` is to record Codex behavior as `does-not-apply-with-reason` with named target phase. Plan 16 (Wave 4) explicitly carries this as a ledger entry per GATE-09c (see Section 6 ledger entry format).

**Phase 58 scope:** The DEFERRAL path is in scope — Plan 16 writes the ledger entry. The RESOLUTION path (shipping Codex hooks) is 57.9 scope, not Phase 58.

**Downstream phase for resolution:** Phase 57.9 (hook substrate delivery) + Phase 60.1 (log-sensor live wiring for GATE-07 per `<deferred>`).

### Risk 3 — Codex auto-compact silently drops workflow context

**Source:** `sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md` (3 occurrences). Codex's auto-compact mechanism can drop the beginning of a long session's workflow text before a spawn site is reached.

**Impact on Phase 58:** GATE-13 (inline dispatch-contract restatement) is the specific anti-pattern fix. Every spawn block restates its contract inline so compaction cannot silently change dispatch semantics. This is not a row-degrading risk; it is in fact the motivating use case for GATE-13's `applies` value on Codex.

**Phase 58 scope:** GATE-13 implementation addresses this directly. No further action in this matrix.

### Risk 4 — `codex_hooks` feature flag stability mid-milestone

**Source:** `.planning/research/cross-runtime-parity-research.md:70-80` notes the `codex_hooks` flag is "under development" — hooks are functional but the API may change before graduating to "stable."

**Impact on Phase 58:** If the flag API changes between Phase 57.9 delivery and Phase 58 Wave 4 execution, GATE-06 / GATE-07 Codex implementation may need re-authoring. The `applies-via-workflow-step if codex_hooks=true` construction in the matrix is written to survive API changes within the "hooks-exist" state — only the key name changes matter, not the behavior shape.

**Phase 58 scope:** OUT OF SCOPE per audit §7.4 (feature-flag-stabilization-mid-milestone flagged as future concern). Recorded for 60 / 60.1 awareness.

---

## Section 6 — Ledger Entry Format for Codex Waivers

Any row in Section 4 declared as `does-not-apply-with-reason` (including conditional-degradation paths) MUST carry a matching ledger entry in the phase's `NN-LEDGER.md` per GATE-09a schema. This format is the authoritative template for Plan 20 (own-phase ledger) consumption.

### Template

```yaml
- id: "58-LEDGER-codex-waiver-GATE-XX"
  context_claim: "GATE-XX Codex behavior: <one-line summary of the gate>"
  disposition: explicitly_deferred
  target_phase_if_deferred: "Phase 57.9"     # or "Phase 60.1" or both, with rationale
  narrowing_provenance:
    rationale: "Codex <hook-type or substrate> unavailable per <citation>"
    originating_claim: "58-05-codex-behavior-matrix.md §<GATE-row>"
    substrate_citation: "<file:line or artifact ref>"
  role_split_provenance:
    about_work: "Phase 58 Wave 4 consumer plan (Plan 16 or successor)"
    detected_by: "58-05-codex-behavior-matrix.md Section 5 Risk 2"
    written_by: "Phase 58 planner at ledger-entry-authoring time"
  recorded_at: "<ISO8601>"
```

### Enum values for `disposition`

Per R6 §GATE-09 schema specification, the enum values are:
- `implemented_this_phase`
- `explicitly_deferred`  ← used for Codex waivers
- `rejected_with_reason`
- `left_open_blocking_planning`

Codex waivers are **always** `explicitly_deferred`, never `rejected_with_reason`. Rejection would mean the gate's Codex behavior is permanently unachievable; deferral means the substrate is not yet delivered but is tracked. For Phase 58, every Codex gap has a named downstream resolution phase.

### Example — GATE-06 ledger entry when Phase 57.9 has not shipped

```yaml
- id: "58-LEDGER-codex-waiver-GATE-06"
  context_claim: "GATE-06 Codex behavior: automation postlude session-end fire-event on Codex runtime"
  disposition: explicitly_deferred
  target_phase_if_deferred: "Phase 57.9 (hook substrate delivery)"
  narrowing_provenance:
    rationale: "Codex SessionStop hook unavailable at Phase 58 execution time; `codex_hooks` feature flag either not enabled in target config.toml or Phase 57.9 has not delivered installer-wired hooks.json. Phase 58 consumes the resolved capability (DC-6); does not re-do 57.9's work."
    originating_claim: "58-05-codex-behavior-matrix.md §GATE-06 (codex_behavior: applies-via-workflow-step if codex_hooks=true else does-not-apply-with-reason)"
    substrate_citation: "bin/install.js:2846-2856; .planning/research/cross-runtime-parity-research.md:70-80; ROADMAP.md:141-150"
  role_split_provenance:
    about_work: "Phase 58 Wave 4 Plan 16 (GATE-06/07 consumer registration)"
    detected_by: "58-05-codex-behavior-matrix.md Section 5 Risk 2 (expected at Phase 58 execution time)"
    written_by: "Phase 58 Plan 16 executor at ledger-entry-authoring time"
  recorded_at: "<ISO8601-at-Plan-16-execution>"
```

### Example — GATE-07 ledger entry under the same condition

```yaml
- id: "58-LEDGER-codex-waiver-GATE-07"
  context_claim: "GATE-07 Codex behavior: session-level incident self-signal emission on Codex runtime"
  disposition: explicitly_deferred
  target_phase_if_deferred: "Phase 57.9 (session-meta markers) + Phase 60.1 (log-sensor live wiring per <deferred>)"
  narrowing_provenance:
    rationale: "Codex session-meta incident markers (error-rate / direction-change / destructive-event) unavailable at Phase 58 execution time. Dual-phase dependency: 57.9 ships the markers; 60.1 wires the log-sensor live incident-detection path. Neither is Phase 58 scope."
    originating_claim: "58-05-codex-behavior-matrix.md §GATE-07"
    substrate_citation: "bin/install.js:2846-2856; ROADMAP.md:141-150 (57.9); 58-CONTEXT.md <deferred> section (60.1)"
  role_split_provenance:
    about_work: "Phase 58 Wave 4 Plan 16 (GATE-06/07 consumer registration)"
    detected_by: "58-05-codex-behavior-matrix.md Section 5 Risk 2"
    written_by: "Phase 58 Plan 16 executor"
  recorded_at: "<ISO8601>"
```

---

## Section 7 — Downstream Plan Citation Guidance

Wave 2 / Wave 3 / Wave 4 plans author their per-gate Codex behavior declarations by citing this matrix. Required citation form:

> **Per-gate Codex behavior:** See `.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md §GATE-XX` — `<value>` on Claude Code; `<value>` on Codex.

Example in a Wave 2 PLAN.md:

> **Per-gate Codex behavior:** See `58-05-codex-behavior-matrix.md §GATE-02` — `applies` on both runtimes (CI grep is runtime-neutral).

Plans MUST NOT:
- Re-derive Codex behavior inline.
- Declare Codex behavior without citing this matrix by file path.
- Override this matrix's row value without first authoring a correcting edit here and a narrowing-provenance entry in the Phase 58 ledger.

Plans MAY:
- Expand the rationale in plan-specific context (e.g., "because this plan touches `complete-milestone.md:603-658` specifically, the CI grep pattern from R10 P7 is the applicable substrate form").
- Record implementation variances observed during execution that do not change the row value.
- Signal discrepancies back to this matrix via the phase ledger for correction in a subsequent patch.

---

## Section 8 — Verification and Fire-Event

### Verification by Plan 17

Plan 17 (Wave 4 verifier) asserts:
1. This file exists at `.planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md`.
2. Section 4 contains exactly 25 rows matching the requirement IDs: GATE-01, 02, 03, 04a, 04b, 04c, 05, 06, 07, 08a, 08b, 08c, 08d, 08e, 09a, 09b, 09c, 09d, 10, 11, 12, 13, 14, 15, XRT-01.
3. No row uses "blanket N/A" or "Codex has no hooks" framing without a named substrate citation and a target phase.
4. Every `does-not-apply-with-reason` row carries a `target_phase` in the rationale (including the conditional-degradation rows for GATE-06 / GATE-07).
5. Every `applies-via-installer` row names Phase 57.9 as prerequisite in the `depends_on_phase_57_9` column.
6. Every Wave 2 / 3 / 4 PLAN.md cites this matrix file path in its per-gate Codex behavior declaration.

### Fire-event

This artifact's fire-event is **existence + completeness** — there is no runtime emission. Plan 17's verifier produces the fire-event by asserting the six checks above. Matrix existence is observable via filesystem; row count is observable via grep (one line per `gate_id` header in Section 4).

### Sanity check command

```bash
for gate in GATE-01 GATE-02 GATE-03 GATE-04a GATE-04b GATE-04c \
            GATE-05 GATE-06 GATE-07 \
            GATE-08a GATE-08b GATE-08c GATE-08d GATE-08e \
            GATE-09a GATE-09b GATE-09c GATE-09d \
            GATE-10 GATE-11 GATE-12 GATE-13 GATE-14 GATE-15 \
            XRT-01; do
  grep -q "^### $gate " .planning/phases/58-structural-enforcement-gates/58-05-codex-behavior-matrix.md \
    || echo "MISSING: $gate"
done
```

Expected: no `MISSING:` lines.

---

## Section 9 — Meta — Per-Gate Codex Behavior for This Plan

Per 58-05-PLAN.md's `<objective>`:

> Per-gate Codex behavior for THIS plan (meta): `applies` — the matrix artifact itself is a filesystem artifact, runtime-neutral.

This matrix is a markdown file in `.planning/`. Both runtimes read it identically. The fire-event (existence + completeness, verified by Plan 17) does not depend on runtime. Plan 17's verifier is itself runtime-neutral. There is no Codex degradation path for this artifact.

---

*Authored: 2026-04-20*
*Phase: 58-structural-enforcement-gates*
*Plan: 05*
*Supersedes: 58-RESEARCH.md §"Per-gate Codex behavior table (skeleton — plan to complete)" (the research skeleton is advisory; this matrix is authoritative).*
