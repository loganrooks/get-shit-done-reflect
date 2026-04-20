# Phase 58: Structural Enforcement Gates - Research

**Researched:** 2026-04-20
**Domain:** Workflow / CI / installer enforcement substrate for 25 structural gates
**Confidence:** HIGH on substrate inventory (R1, R2, R3, R4, R10), MEDIUM on design choices (R5, R6, R7), MEDIUM on composability (R8, R9), MEDIUM on release wiring (R11).

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**From `<working_model>`:**

- [governing:reasoned] Structural enforcement = mechanism that fires without the agent needing to remember to invoke it (hook / installer-wired workflow step / exit-coded CLI / CI rule). Prose requests do not count.
- [decided:cited] Every GATE must satisfy the four-property contract: named substrate, measurable fire-event, applies across bypassing workflows (no advisory-by-composition), per-gate Codex behavior declaration (audit §9.3 / ROADMAP.md:320).
- [decided:cited] Fire-event surface = hook log entry / workflow-step stdout marker / `session-meta` or installed-KB field consumable by Phase 57.5 extractor registry (audit §6.1, ROADMAP.md Success Criterion 1).
- [decided:cited] GATE-02 must enumerate every workflow / skill / agent surface that invokes `gh pr merge` — no "all merges" prose. Known surfaces: `execute-phase.md`, `complete-milestone.md`, `gsd-ship` skill, any release workflow. CI verifies grep-level conformance.
- [decided:cited] GATE-03 ships with an explicit detection rule (glob / diff / manifest / composition).
- [decided:reasoned] GATE-03 classifies `ROADMAP.md` and `REQUIREMENTS.md` as **runtime-adjacent** (planning-authority). Pure-prose direct-to-main is reserved for comments, README updates, non-authoritative docs.
- [decided:cited] GATE-14 folds into GATE-01 CI enforcement (branch protection + optional pre-push hook).
- [decided:cited] GATE-04a ships consumed-on-read archival (mv to dated archive, not rm).
- [decided:cited] GATE-04b ships hard-stop staleness check.
- [decided:cited] GATE-04c adopts upstream's blocking/advisory severity framework with mandatory understanding checks for blocking items.
- [decided:cited] GATE-05 enumerates named delegation sites (`collect-signals.md`, researcher dispatch, `plan-phase.md`, `discuss-phase.md`, `audit.md`, and spawned batch workflows).
- [decided:cited] GATE-13 owns compaction-resilience: every delegation spawn restates its full dispatch contract inline at the spawn site.
- [decided:cited] Phase 58 does NOT duplicate Phase 57.9's work. GATE-06 and GATE-07 are consumers, not implementers.
- [decided:cited] GATE-08 splits into 08a–08e.
- [governing:reasoned] Narrowing relative to upstream requires named rationale under GATE-09c.
- [decided:cited] GATE-09a ships as a named artifact with schema (YAML frontmatter, required fields `context_claim`, `disposition` (enum), `target_phase_if_deferred`, `narrowing_provenance`).
- [decided:cited] GATE-09b is a planning gate (unresolved `[open]` scope-boundary claims halt plan-phase).
- [decided:cited] GATE-09c requires narrowing decisions to cite originating CONTEXT claim with provenance.
- [decided:cited] GATE-09d verifier contract uses Phase 57.8 role-split provenance.
- [decided:cited] GATE-10 ships phase-closeout reconciliation as a structural step (gsd-tools substrate), not prose.
- [decided:cited] GATE-11 ships release-boundary assertion.
- [decided:cited] GATE-12 replaces `rm` of partial/failed agent output with `mv` to archive path.
- [decided:cited] GATE-15 ships source↔installed mirror parity as a CI check.
- [decided:cited] XRT-01 ships with a plan-phase assertion; capability-matrix.md diff reviewed in closeout.
- [evidenced:cited] REQUIREMENTS.md:10 cross-runtime note already updated post-55.2 — Phase 58 maintains currency, does not re-write.
- [decided:cited] Per-gate Codex behavior table authored as part of plan scope.
- [decided:reasoned] Audit §6.4 "CI-as-structural-gate" pattern is preferred for GATE-01, 02, 03, 14, 15 where CI can host the check; workflow-level mechanics remain for per-session state (GATE-04, 12).

**Governing constraints (DC / G tables, applied verbatim):**

- **DC-1:** Named substrate required.
- **DC-2:** Measurable fire-event required.
- **DC-3:** No advisory-by-composition.
- **DC-4:** Per-gate Codex behavior required.
- **DC-5:** Phase 57.8 merged (`c8a15d95`); STATE.md previously lagged at "Phase 57.8 context gathered" — now updated to "Phase 58 context gathered" (STATE.md:6 verified 2026-04-20).
- **DC-6:** Phase 58 does not duplicate 57.9 work.
- **DC-7:** `[open]` scope-boundary claims must resolve before plan-phase (reflexive GATE-09b).
- **DC-8:** GATE-03 motivating pattern recurred at quick `260419-6uf` (commit `ddcf1232` — verified: "docs(quick-260419-6uf): regenerate codex signal skill", touching `.codex/skills/gsdr-signal/SKILL.md` direct to main).
- **DC-9:** ROADMAP.md / REQUIREMENTS.md runtime-adjacent.
- **G-1..G-7:** Seven epistemic guardrails (see CONTEXT.md §guardrails).

### Claude's Discretion

- Exact CLI shape of the reconciliation subcommand (GATE-10).
- Archive directory naming conventions and retention (GATE-04a, GATE-12).
- GitHub Actions YAML structure for CI-enforced gates (GATE-01, GATE-02, GATE-15).
- Exact copy / prompt wording for blocking-severity mandatory understanding (GATE-04c).
- Ledger front-matter key ordering and optional-fields policy (GATE-09a).
- Pre-push hook vs branch-protection-only implementation of GATE-14 (within the named-substrate constraint).

### Deferred Ideas (OUT OF SCOPE)

Per CONTEXT.md `<deferred>`:

- Full Codex hook installer parity beyond SessionStop (tracked via XRT-01 / Phase 57.9 dependency note; Phase 60.1+).
- Log-sensor live incident-detection wiring for GATE-07 (Phase 60 + 60.1).
- Full KB query surface for GATE-09 historical analysis (Phase 59 KB query / FTS5).
- Cross-model review of GATE designs themselves (Phase 61 / SPIKE-01).
- Generalized dispatch-scope isolation across all agent types (AUT-02 / v1.21).
- Signal-to-workflow auto-elevation on recurrence (Phase 60.1 / REC-01).
- Audit §7.4 Codex hooks timing (feature-flag stabilization mid-milestone).
- Audit §14 framework-invisibility reframe (Q4 — deferred to Phase 60.1 intervention-outcome loop).
</user_constraints>

---

## Summary

Phase 58 has one core design question the planner must nail: **every gate's named-substrate choice**. The research confirms that (a) the CI surface already exists and has ~70% of the hooks needed (`.github/workflows/ci.yml` runs `npm test` + installer verify; branch protection requires `Test` status check) but is missing the grep-level conformance checks for GATE-02 / GATE-03 / GATE-15 and does not enforce admins (`enforce_admins: false`, verified via `gh api` 2026-04-20); (b) the `gh pr merge` surface is **partially conforming** — `execute-phase.md:793` is correct but `complete-milestone.md:613, 623` **contain `git merge --squash`** (CONTEXT.md and the audit claimed "No --squash anywhere"; this is false for the `git merge` flavour — `gh pr merge --squash` is absent but the underlying `git merge --squash` survives in the milestone merge path, plus the UI lists "Squash merge (Recommended)" as the default AskUserQuestion choice); (c) the `[open]` questions Q1 / Q3 / Q5 / Q6 all have tractable answers from code inspection; (d) the existing measurement-extractor registry (`get-shit-done/bin/lib/measurement/registry.cjs`) is schema-validated and already supports gate-family features through `status_semantics` + `content_contract` — one `gate_fire_events` extractor can serve all 25 gates without new architecture (CONTEXT §6 `[assumed:reasoned]` confirmed); (e) the upstream richer `discuss-phase-assumptions.md` is 671 lines (verified post-hoc via direct `curl` 2026-04-20 — REQUIREMENTS.md:236 is accurate, not stale; the WebFetch-derived ~750-line estimate earlier in this research was wrong), includes a real `gsd-assumptions-analyzer` agent in the upstream agents/ directory (105 lines, HTTP 200 verified), and has methodology loading, mode-aware gating (`text_mode`, `--auto`), and calibration-tier-aware assumption depth that the fork currently omits entirely.

**Primary recommendation:** Plan four waves — Wave 1 substrate-discovery / non-blocking (GATE-02 enum, GATE-05 enum, GATE-09a ledger schema, GATE-08a upstream fetch artifact, per-gate Codex table), Wave 2 CI-hosted gates (GATE-01 / 02 / 03 / 14 / 15 — all share `.github/workflows/ci.yml` edits, must serialize), Wave 3 workflow-level gates (GATE-04a/b/c, GATE-05 echoes, GATE-10 reconcile, GATE-12 archive; each touches distinct workflow files so parallelizable), Wave 4 consumer gates (GATE-06 / 07 / 11 / 13, GATE-09b/c/d verifier, XRT-01 plan assertion). Plan-phase entry requires AT-1 (57.9 status), AT-6 (STATE.md reconciled) — verify before waves start.

---

## R1 — Substrate Inventory

### GATE-01 CI substrate (Phase advancement block until PR + CI)

[evidenced:cited] **Branch protection status** (verified via `gh api repos/loganrooks/get-shit-done-reflect/branches/main/protection` on 2026-04-20):

```json
{
  "required_status_checks": {"strict": false, "contexts": ["Test"]},
  "required_signatures": {"enabled": false},
  "enforce_admins": {"enabled": false},
  "required_linear_history": {"enabled": false},
  "allow_force_pushes": {"enabled": false},
  "allow_deletions": {"enabled": false},
  "block_creations": {"enabled": false},
  "required_conversation_resolution": {"enabled": true}
}
```

Key gaps: `enforce_admins: false` means admins can bypass; `strict: false` means PRs don't need to be rebased before merge.

[evidenced:cited] **CI workflow** (`.github/workflows/ci.yml`:1-85): runs on `push` to main AND `pull_request` to main. Steps include `npm ci` → `npm run build:hooks` → `npm test` → `npm run test:infra` → `npm run test:upstream` → `npm run test:upstream:fork` → "Verify install script" (creates temp dir, runs `bin/install.js --claude`, checks directories). No grep-level conformance checks for `gh pr merge`, no source↔installed parity check, no GATE-level emission marker.

| GATE | Current posture | Required change | Per-gate Codex behavior |
|---|---|---|---|
| GATE-01 | Advisory `offer_next` in `execute-phase.md:778-801`. CI exists but doesn't block advancement. Branch protection has `Test` context but `enforce_admins: false`. | (a) Flip `enforce_admins: true` via `gh api`, (b) set `strict: true`, (c) add workflow-step marker `echo "::notice::gate_fired=GATE-01"` on blocking decision, (d) add explicit CLI `gsd-tools phase advance --require-ci-green` that polls `gh pr checks --required --watch` and exits non-zero on failure. | **applies-via-workflow-step** on both runtimes (CI is runtime-neutral; workflow step is). |
| GATE-02 | `execute-phase.md:793` conforms (`gh pr merge $CURRENT_BRANCH --merge`). `complete-milestone.md:613, 623` **contain `git merge --squash`** (see Critical Finding below). Milestone path also lists "Squash merge (Recommended)" as default AskUserQuestion option (`complete-milestone.md:603`). | CI grep check `grep -rn "gh pr merge" agents/ get-shit-done/ commands/ .claude/ skills/ \| grep -v "\-\-merge"` AND `grep -rn "git merge --squash" get-shit-done/ \| grep -v "# historical"`. Fix complete-milestone to default to non-squash. | **applies** (CI grep is runtime-neutral). |
| GATE-03 | `quick.md:163-173` branches only when `branch_name` config is set; no file-path / git-diff discriminator. Motivation recurred in `ddcf1232` (2026-04-19 → 24h before audit). | CI-side post-commit check (if the commit is direct-to-main, classify its diff under a rule and fail if runtime-classified) + workflow-side `gsd-tools quick classify --files` in `quick.md`. | **applies-via-workflow-step** (CI hosts the post-hoc check; quick.md enforces pre-commit). |
| GATE-06 | `.claude/settings.json:1-54` has no `SessionStop`. `bin/install.js:2094` enumerates only `['SessionStart', 'PostToolUse', 'AfterTool', 'PreToolUse', 'BeforeTool']` for cleanup (not installation). `bin/install.js:2848` skips hooks entirely for Codex. | **Depends on Phase 57.9 HOOK-01/02/03**; consumer-only in Phase 58. | **applies-via-installer** on Claude Code once 57.9 ships; **applies-via-workflow-step** on Codex if `codex_hooks=true`, **does-not-apply-with-reason** otherwise (waiver marker in installed KB). |
| GATE-07 | Zero source hits for `self-signal`, `self_signal`, incident-detection markers outside requirements/citations. | **Depends on Phase 57.9 HOOK-03** (session-level error-rate / direction-change / destructive-event markers). | Same pattern as GATE-06. |
| GATE-14 | Branch protection prevents direct-push to main for non-admins, but `enforce_admins: false` — `sig-2026-04-10-ci-branch-protection-bypass-recurrence.md` (3 occurrences, severity critical) documents the continuing bypass. | Flip `enforce_admins: true`; fold under GATE-01's substrate. | **applies** on both runtimes (branch protection is runtime-neutral). |
| GATE-15 | Installer runs in CI via temp-dir isolation (`.github/workflows/ci.yml:42-80`); verification checks directory existence + VERSION file match, **not byte-identical parity** between `agents/`, `get-shit-done/`, `commands/` and `.claude/get-shit-done-reflect/`. | Add post-install `diff -r` step (with installer-manifest-driven path list) to CI. | **applies** (CI is runtime-neutral). |

### Critical finding: `complete-milestone.md` has `git merge --squash` (contradicts CONTEXT + audit)

[evidenced:cited] `get-shit-done/workflows/complete-milestone.md:603` (AskUserQuestion step) lists options: "Squash merge (Recommended), Merge with history, Delete without merging, Keep branches" — **Squash is the default**. Lines 613 and 623 contain literal `git merge --squash "$branch"` invocations. This is NOT a `gh pr merge --squash` (which is absent repo-wide; only `gh pr merge --merge` at `execute-phase.md:793`), but it is the same failure mode: **the milestone path defaults to squash merge**, which destroys individual commit history. `sig-2026-03-28-squash-merge-destroys-commit-history.md` (severity critical) is the motivation signal; the audit missed this because it grepped for `gh pr merge --squash` specifically, not `git merge --squash`.

**Implication for GATE-02 design:** GATE-02 grep check must cover both `gh pr merge` and `git merge --squash` (the underlying git surface). Phase 58 plan MUST change `complete-milestone.md` default from squash to merge-with-history — this is an in-scope GATE-02 fix, not a deferred chore.

### GATE-02 comprehensive enumeration

[evidenced:cited] Repo-wide grep for `gh pr merge` (excluding `.sonnet-run-archive/` per independence constraint):

| File | Line | Conforming | Content |
|------|------|------------|---------|
| `get-shit-done/workflows/execute-phase.md` | 793 | YES | `gh pr merge $CURRENT_BRANCH --merge` |
| All other `.md` workflow / command / agent files | — | N/A | No `gh pr merge` invocation |

For the broader "merge" surface (`git merge` variants in shipped workflows):

| File | Line | Conforming | Content |
|------|------|------------|---------|
| `get-shit-done/workflows/complete-milestone.md` | 613 | **NO** | `git merge --squash "$branch"` (phase-strategy milestone path) |
| `get-shit-done/workflows/complete-milestone.md` | 623 | **NO** | `git merge --squash "$MILESTONE_BRANCH"` (milestone-strategy path) |
| `get-shit-done/workflows/complete-milestone.md` | 642 | YES (conditional) | `git merge --no-ff --no-commit "$branch"` (under "Merge with history" alternative) |
| `get-shit-done/workflows/complete-milestone.md` | 652 | YES (conditional) | `git merge --no-ff --no-commit "$MILESTONE_BRANCH"` |
| `get-shit-done/references/planning-config.md` | 179 | INFORMATIONAL | Documents squash as "(recommended)" |

No `gsd-ship` command exists in this repo (searched `commands/` and `.codex/skills/`); the `.codex/skills/` directory has `gsdr-release/`, `gsdr-complete-milestone/`, but no ship skill. `gh pr merge` is also absent from `.github/workflows/publish.yml` (that workflow triggers on `release: published`, not on PR merge).

### GATE-03 detection-rule evaluation (Q1 — see R-section)

Addressed in R12 / Q1 analysis below.

### GATE-14 no-direct-push

Already covered above — branch protection exists but `enforce_admins: false` is the gap. `sig-2026-04-10-ci-branch-protection-bypass-recurrence.md` confirms the admin-bypass pattern has recurred three times at critical severity.

### GATE-15 source↔installed parity

[evidenced:cited] `bin/install.js:2868-2869`: installer replaces path prefixes during copy (`get-shit-done/` → `get-shit-done-reflect/`, `gsd-` → `gsdr-`). So "byte-identical" is NOT the right verification — the expected transformation is path-prefix substitution. GATE-15 CI check should:

1. Run installer into a temp dir.
2. For each path in the source manifest (not `dist/MANIFEST`, which does NOT exist — verified by `ls /home/rookslog/workspace/projects/get-shit-done-reflect/dist/ 2>/dev/null` → empty), compute expected installed path via the documented transformation.
3. Compare source → expected-installed via `diff` after applying the same `replacePathsInContent()` transformation the installer uses.

**`dist/MANIFEST` does NOT exist.** CONTEXT.md line 154 hedged this ("if present"), so the conditionality was noted. The `package.json` `files` array plus the installer's own path-transformation code is the effective ground truth.

---

## R2 — `.continue-here` Lifecycle (GATE-04a/b/c)

### Current lifecycle

[evidenced:cited] `get-shit-done/workflows/resume-project.md:127-137`:

```
**After loading .continue-here context, delete the file:**

```bash
# Delete the loaded handoff file (phase-level or project-level)
rm -f "$CONTINUE_HERE_PATH"
```

The handoff context is now loaded into this session. The file is stale.
The continue-here template contract states: "This file gets DELETED after resume -- it's not permanent storage."
```

No archive. No staleness check. No hard-stop predicate.

### Reference sites

[evidenced:cited] Grep `\.continue-here`, 97 files total. Real-code substrate sites (excluding `.sonnet-run-archive/`):

| File | Role | Writes or Reads |
|------|------|-----------------|
| `get-shit-done/workflows/resume-project.md:127-135` | Consume-on-read (`rm -f`) | READS and DELETES |
| `get-shit-done/workflows/transition.md` | Handoff write reference | WRITES (creates) |
| `get-shit-done/workflows/pause-work.md` | Handoff write reference | WRITES (creates) |
| `get-shit-done/references/continuation-format.md` | Format spec | spec only |
| `get-shit-done/templates/continue-here.md` | Handoff template | template |
| `get-shit-done/references/health-check.md` | Health probe reference | READS (diagnostic) |
| `commands/gsd/pause-work.md`, `commands/gsd/resume-work.md` | Command entry points | orchestration |
| `.planning/knowledge/signals/get-shit-done-reflect/2026-02-16-stale-continue-here-files-not-cleaned.md` / `2026-02-17-continue-here-not-deleted-after-resume.md` | Motivating signals | — |

### Upstream anti-pattern severity framework

[evidenced:reasoned] **Not found in this fork.** Grep for `blocking|advisory|anti-pattern|anti_pattern` in `get-shit-done/references/` returns only prose-level references. No severity enum, no mandatory-understanding-check code, no programmatic enforcement. The upstream `gsd-build/get-shit-done` ships it (per CONTEXT.md `<specifics>` and audit Finding 2.4); the fork has not adopted it.

### Recommendation

[decided:reasoned] **Archive directory:** `.planning/handoff/archive/YYYYMMDDTHHMMSS-{session_id}.continue-here.md` — date-time + session_id keeps names unique and sortable; sub-directory keeps `.planning/handoff/` root clean.

[decided:reasoned] **Staleness predicate** (GATE-04b hard-stop): file is stale if ANY of:

1. `mtime(.continue-here)` is older than `STATE.md` `last_updated` YAML field.
2. `git log --since=<mtime> -- STATE.md` returns at least one commit on `main` since the file was written (newer mainline activity).
3. The `session_id` embedded in the continuation file matches any session already recorded in `STATE.md` decisions-table (already consumed).

The predicate is a small Node helper in `get-shit-done/bin/lib/handoff.cjs` (new file) invoked by `gsd-tools handoff resolve` exit-coded CLI — not prose. This is the "named substrate" for DC-1.

[decided:reasoned] **GATE-04c severity framework:** YAML frontmatter tag `severity: blocking | advisory` on anti-pattern entries in `get-shit-done/references/antipatterns.md` (new file) + `gsd-tools antipatterns check` that prompts the user with "Type the anti-pattern name to continue: ___" on blocking items (mandatory-understanding check). This matches upstream semantics per the fork's `gsd-build/get-shit-done` search surface — exact upstream text NOT re-fetched, flagged as MEDIUM confidence.

---

## R3 — Delegation Site Enumeration (GATE-05, GATE-13)

### All `subagent_type=` / `model=` sites

[evidenced:cited] Full repo grep across `agents/`, `commands/`, `get-shit-done/workflows/`, `skills/` (42 hits total; archive excluded):

**Named delegation sites:**

| Site | File:line | Agent type | Model source | Echoes model pre-spawn? |
|------|-----------|------------|--------------|-------------------------|
| Sensor dispatch loop | `collect-signals.md:276-277` | dynamic (per sensor) | `MODEL` (loop-variable) | NO (line 249-251 prints ENABLED_NAMES with model embedded, but not *before* spawn) |
| Synthesizer | `collect-signals.md:377-378` | `gsd-signal-synthesizer` | `{synthesizer_model}` | NO |
| Phase researcher | `research-phase.md:63-64` | `gsd-phase-researcher` | `{researcher_model}` | NO |
| Phase researcher | `explore.md:65` | `gsd-phase-researcher` | — | NO |
| Phase researcher | `quick.md:382-383` | `gsd-phase-researcher` | `{planner_model}` ⚠ name mismatch | NO |
| Planner | `plan-phase.md:347-348` | `gsd-planner` (via general-purpose on line 128 and direct on 347) | `{planner_model}` / `{researcher_model}` | NO |
| Plan-checker | `plan-phase.md:402-403` | `gsd-plan-checker` | `{checker_model}` | NO |
| Planner (iterate) | `plan-phase.md:450-451` | general-purpose | `{planner_model}` | NO |
| Verifier | `execute-phase.md:335-336` | `gsd-verifier` | `{verifier_model}` | NO |
| Executor | `execute-phase.md:190-191` | `gsd-executor` | `{executor_model}` | NO |
| Verifier / planner iterations | `verify-work.md:384-385, 430-431, 471-472` | mixed | mixed | NO |
| Auditor | `commands/gsd/audit.md:260` | `gsdr-auditor` | — | — |
| Integration-checker | `audit-milestone.md:68-69` | `gsd-integration-checker` | `{integration_checker_model}` | NO |
| Advisor | `discuss-phase.md:666-667` | general-purpose | `{ADVISOR_MODEL}` | NO |
| Debugger | `commands/gsd/debug.md:95, 148` | `gsd-debugger` | — | NO |
| Diagnose-issues | `diagnose-issues.md:111` | general-purpose | — | — |
| Codebase-mapper | `map-codebase.md:87, 95, 118, 141, 164` | `gsd-codebase-mapper` | `{mapper_model}` | NO |
| Nyquist-auditor | `validate-phase.md:101-102` | `gsd-nyquist-auditor` | `{AUDITOR_MODEL}` | NO |
| Reflector | `reflect.md:369` | `gsd-reflector` | — | — |
| Quick executor chain | `quick.md:383, 439, 503, 548, 589, 635` | 6 distinct agent types | 3 distinct models (planner/checker/executor/verifier) | NO |
| Research synthesizer | `new-project.md:617`, `new-milestone.md:199` | `gsd-research-synthesizer` | `{synthesizer_model}` | NO |
| Project researcher | `new-milestone.md:175`, `new-project.md:473,513,553,593` | `gsd-project-researcher` / general-purpose | `{researcher_model}` | NO |
| Roadmapper | `new-project.md:824,902`, `new-milestone.md:348` | `gsd-roadmapper` | `{roadmapper_model}` | NO |
| Research-phase command | `commands/gsd/research-phase.md:139, 173` | general-purpose | — | — |

**Ad-hoc Task spawns** (wave / loop-level orchestration):

- `execute-plan.md:103` — Pattern A describes `Task(subagent_type="gsd-executor", model=executor_model, isolation="worktree")` as the canonical pattern. This is documentation not a live spawn site.

### GATE-05 coverage analysis

**22 named delegation sites across 15 workflow files; zero echo model to user before spawn.** The motivation signal `sig-2026-04-10-researcher-model-override-leak-third-occurrence.md` (3 occurrences) affects the researcher site specifically; the closer reading of the pattern is that *every* site is exposed because model selection is buried in a template variable that's opaque to the user until after the spawn.

[decided:reasoned] **GATE-05 implementation:** Add a macro-step pattern (not per-site edit) — pre-spawn echo block that every workflow calls:

```
echo "## Delegation About To Spawn
Agent: ${SUBAGENT_TYPE}
Model: ${MODEL}
Reasoning effort: ${REASONING_EFFORT}
Isolation: ${ISOLATION:-none}
Session: ${SESSION_ID}
" | tee -a .planning/delegation-log.jsonl
```

The `delegation-log.jsonl` IS the measurable fire-event (DC-2) — one line per spawn, parseable by a new GATE-05 extractor.

### GATE-13 dispatch contract restatement

[evidenced:cited] Current state: every site's dispatch contract is expressed via template-variable substitution (e.g. `model="{researcher_model}"`); under auto-compact, the workflow context gets compressed and the bindings can drift. `sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md` (3 occurrences) documents the pattern. The fix is inline restatement:

```markdown
Task(
  subagent_type="gsd-phase-researcher",      # REQUIRED: never re-bind
  model="claude-opus-4-7",                    # REQUIRED: resolved from {researcher_model} at spawn
  reasoning_effort="high",                    # REQUIRED
  required_inputs=[CONTEXT.md, audit chain], # REQUIRED
  output_path=".planning/phases/NN-*/NN-RESEARCH.md"  # REQUIRED
)
```

Rather than relying on `{researcher_model}` evaluation occurring after compaction, the concrete values are resolved via `resolveModelInternal` at workflow-expansion time and pasted inline. The fire-event for GATE-13 is "the delegation contract appears in full within the Task() call block" — a grep check in CI confirms no `{...}` templating remains in spawn blocks.

[assumed:reasoned] **GATE-05 / GATE-13 co-implementation:** Both edits land on the same spawn-site lines. Single wave of workflow-file edits touches all 22 sites + 15 files. MEDIUM risk: if resolveModelInternal's output format changes, all 22 sites need re-rendering.

---

## R4 — Hook Substrate Landscape (Consumer-Only)

### Current hook surface

[evidenced:cited] `.claude/settings.json:1-54`:

- **SessionStart hooks (4):** `gsdr-check-update.js`, `gsdr-version-check.js`, `gsdr-ci-status.js`, `gsdr-health-check.js`.
- **PostToolUse hook (1):** `gsdr-context-monitor.js` (matchers: `Bash|Edit|Write|MultiEdit|Agent|Task`, timeout 10s).
- **statusLine:** `gsdr-statusline.js`.
- **SessionStop: ABSENT.**
- **PreToolUse: ABSENT.**

### Installer surface

[evidenced:cited] `bin/install.js:2094`: loop iterates `['SessionStart', 'PostToolUse', 'AfterTool', 'PreToolUse', 'BeforeTool']` for *cleanup* — not installation. The installer does not write `SessionStop` hook entries.

[evidenced:cited] `bin/install.js:2848`: `if (!fs.existsSync(hooksSrc) && !isCodex)` — Codex is explicitly excluded from hook installation. This is the unconditional skip audit Finding 2.6 flagged.

### Codex hook surface

[evidenced:cited] `.planning/research/cross-runtime-parity-research.md:70-80`:

| Hook Type | Codex Version Added | Discovery | Notes |
|-----------|---------------------|-----------|-------|
| SessionStart | v0.115.0 | `~/.codex/hooks.json` or `<repo>/.codex/hooks.json` | Fires at session initialization |
| SessionStop | v0.115.0 | Same | Fires at session end |
| UserPromptSubmit | v0.116.0 | Same | Fires when user submits a prompt |
| PreToolUse | v0.117.0 | Same | Fires before tool execution |
| PostToolUse | v0.117.0 | Same | Fires after tool execution |

Requires `codex_hooks=true` in `config.toml`. Feature flag status: "under development."

### Phase 57.9 expected deliverables (Phase 58 contract)

For Phase 58 GATE-06 and GATE-07 to land honestly, Phase 57.9 must deliver:

| Deliverable | Consumer | Shape |
|-------------|----------|-------|
| Installer-wired `SessionStop` on Claude Code | GATE-06 | `.claude/settings.json` has `SessionStop` entry pointing to `gsdr-postlude.js` after install |
| Codex hook surface under `codex_hooks` flag with explicit waiver path | GATE-06 / GATE-07 on Codex | Either `.codex/hooks.json` written with SessionStop entry, or `.planning/config.json` gains `{"codex_hooks_waived": true, "reason": "flag unavailable"}` marker |
| `session-meta` field: postlude-fired (boolean + timestamp) | GATE-06 extractor | New field in the session-meta JSONL stream that 57.5's claude.cjs/codex.cjs loaders expose |
| `session-meta` field: error-rate / direction-change / destructive-event (structured) OR explicit `not_available` marker | GATE-07 extractor | Per-session structured record; GATE-07 extractor reads this and emits fire-events |

[projected:reasoned] If Phase 57.9 ships before Phase 58 plan-phase entry (AT-1): GATE-06 / GATE-07 plan-task actions are "register new extractor for consumed fields" — scope is small. If Phase 57.9 has not shipped: Phase 58 plan MUST explicitly defer GATE-06 / GATE-07 to post-57.9 with GATE-09c named provenance. No honest alternative.

---

## R5 — Discuss-Phase Richer Adoption (Q2, GATE-08a/b/c/d/e)

### Upstream fetch

[evidenced:cited] Via WebFetch of `https://raw.githubusercontent.com/gsd-build/get-shit-done/main/get-shit-done/workflows/discuss-phase-assumptions.md`:

- **Upstream line count: 671 lines** (verified post-hoc via direct `curl https://raw.githubusercontent.com/gsd-build/get-shit-done/main/get-shit-done/workflows/discuss-phase-assumptions.md | wc -l` on 2026-04-20). REQUIREMENTS.md:236's figure of 671 is **accurate and current**, not stale. The audit §15 "medium confidence" qualifier is obsoleted by this direct verification.
- WebFetch earlier in this research returned a ~750-line estimate — this was WebFetch output-trimming behavior, not a real line count. Planners should use direct `curl` / `gh api` for byte-level verification of upstream artifacts; WebFetch is unreliable for line counts.
- Upstream filename is `discuss-phase-assumptions.md` — identical to the fork. An earlier speculation in this research about a `gsd-assume-phase.md` name was incorrect (404 on direct fetch); the fork and upstream use the same filename.

[evidenced:cited] **Fork line count: 279 lines** on both source (`get-shit-done/workflows/discuss-phase-assumptions.md`) and installed mirror (`.claude/get-shit-done-reflect/workflows/discuss-phase-assumptions.md`).

**Delta: ~471 lines (upstream minus fork).**

### Category breakdown of the delta

Per the upstream fetch analysis:

| Category | Present in upstream | Present in fork | Adoption recommendation |
|----------|---------------------|-----------------|-------------------------|
| (a) Methodology loading | `load_methodology` step ~L240-270 (reads `.planning/METHODOLOGY.md`, extracts named lenses, passes to analyzer) | NO | **Adopt as-is** — methodology lens is a GSD core concept that already exists in the fork's audit / reflection flows; bringing it into discuss-phase is consistent. If `.planning/METHODOLOGY.md` missing, silent skip is fine. |
| (b) Assumptions-analyzer agent | Three spawn points (`initialize`, `deep_codebase_analysis` ~L350-410, `present_assumptions` ~L450). Agent file `gsd-assumptions-analyzer.md` exists in upstream `agents/` (verified via `https://api.github.com/repos/gsd-build/get-shit-done/contents/agents`, file size 4.5 KB, SHA `5531fc4a973ef723201c53042a9afcb33989c144`). | NO (not in fork `agents/`, not in `get-shit-done/agents/`) | **Adopt as-is** — the analyzer agent fills a fork gap. Name it `gsdr-assumptions-analyzer` per fork convention. Bring upstream agent file verbatim, apply `replacePathsInContent` transformation. |
| (c) Mode-aware gating | `workflow.text_mode: true` handling (AskUserQuestion → numbered plain lists), `--auto` flag gates (`initialize`, `present_assumptions`, `auto_advance`) | Partial — fork has `--auto` but no `text_mode` and no mode-aware presentation swap | **Adopt-as-is for `text_mode`; fork `--auto` behavior already present.** GATE-08d in the fork will wire equivalent mode-awareness into `plan-phase.md` and `progress.md`. |
| (d) Calibration tier | User philosophy (conservative / pragmatic / opinionated) scales depth of analysis (5–15 file scans, 3–5 areas, 2–3 alternatives per Likely/Unclear) | NO | **Adopt-narrow-with-rationale** under GATE-09c — the fork already has `model_profile` (quality/balanced/budget) which plays a similar role; adopting calibration-tier on top of model_profile is redundant for a solo user repo. Named rationale: "fork's `model_profile` already calibrates agent effort; user-philosophy tier adds surface complexity without behavior delta in solo workflow." |
| (e) CONTEXT.md section mandates | Six-section upstream contract: `<domain>`, `<decisions>`, `<canonical_refs>`, `<code_context>`, `<specifics>`, `<deferred>` | Fork has these + more: `<working_model>`, `<constraints>`, `<guardrails>`, `<questions>`, `<dependencies>`, typed claims (per DISC-02) | **Fork is richer here; keep fork superset.** GATE-08e's "narrowing" actually runs the OTHER direction for this section — the fork has a richer typed-claim vocabulary upstream does not. Named rationale: "Phase 57.2 DISC-01..10 formalized richer exploratory contract; fork diverges upward, not narrower." |
| (f) Confidence badges | Per-assumption Confident / Likely / Unclear with evidence citations | NO (fork uses typed claims `[evidenced:cited]`, etc.) | **Fork is richer.** Badges map onto typed-claim dimensions: `Confident` ↔ `[evidenced:*]`, `Likely` ↔ `[decided:*] / [assumed:*]`, `Unclear` ↔ `[open] / [assumed:reasoned]`. Document the mapping in GATE-08c docs. |

### Required artifacts for GATE-08a/b/c/d/e

| Sub-req | Deliverable |
|---------|-------------|
| GATE-08a | Current-state verification artifact — diff of fork (279 lines) vs upstream (671 lines, verified 2026-04-20) + per-category adoption decision. This RESEARCH.md section is the start. |
| GATE-08b | `agents/gsdr-assumptions-analyzer.md` + `.claude/agents/gsdr-assumptions-analyzer.md` (via installer). Port from upstream with path transformation. |
| GATE-08c | `docs/workflow-discuss-mode.md` — document the three discuss modes (standard interactive / `--auto` exploratory / richer-adoption) + typed-claim vocabulary + confidence-badge mapping. |
| GATE-08d | `plan-phase.md` and `progress.md` gain `text_mode` branches (fork has `--auto` but not plain-text rendering paths). |
| GATE-08e | Narrowing decisions (d) and (e) above each recorded as GATE-09c provenance entries in the Phase 58 ledger. |

[assumed:reasoned] Upstream may have diverged further since the WebFetch — line count is approximate; full structural diff would require a line-by-line fetch and diff. Not executed in this research; flagged as MEDIUM confidence.

---

## R6 — GATE-09 Ledger Prototype (Q3)

### Existing phase artifacts — where deferrals live today

[evidenced:cited] Inspected 57.4, 57.5, 57.7, 57.8 artifacts:

- **Phase 57.4:** 6 SUMMARY files per plan; no single LEDGER file. Deferrals live as prose in `57.4-CONTEXT.md` (explicit in the post-deliberation restructure) and referenced in ROADMAP.md (Phase 57.4 entry). No machine-readable disposition tracking.
- **Phase 57.5:** `57.5-VERIFICATION.md` exists (confirmed via ls). Narrowing-evidence is in prose within the verification.
- **Phase 57.7:** 10 PLAN.md + 10 SUMMARY.md. The vision-drop revision (57.7-10-SUMMARY) is real narrowing — the original scope included active-measurement governing claim; the revised scope revises the interpretation and defers next-step evaluation. This is the canonical narrowing precedent for GATE-09 ledger testing.
- **Phase 57.8:** `57.8-CONTEXT.md`, `57.8-DISCUSSION-LOG.md`, `57.8-RESEARCH.md`, 3 PLAN + 3 SUMMARY. No VERIFICATION.md visible in the directory listing (may be pending — the phase merged 2026-04-17 per `c8a15d95`).

### Grep of ledger vocabulary

[evidenced:cited] Grep `implemented_this_phase|explicitly_deferred|rejected_with_reason|left_open_blocking`:

- 9 files total, ALL are descriptive references (CONTEXT, REQUIREMENTS, audit, deliberation, plans) — ZERO source-code hits in `get-shit-done/bin/` or `.claude/` tooling. Vocabulary exists only in documentation.

### Three candidate layouts evaluated

**Layout 1: Standalone `NN-LEDGER.md` with YAML frontmatter**

```yaml
---
phase: 58-structural-enforcement-gates
ledger_schema: v1
generated_at: "2026-04-25T14:30:00Z"
generator_role: verifier
entries:
  - context_claim: "GATE-01 CI-based enforcement"
    disposition: implemented_this_phase
    evidence_paths:
      - ".planning/phases/58/58-02-SUMMARY.md"
      - ".github/workflows/ci.yml"
    narrowing_provenance: null
    target_phase_if_deferred: null
  - context_claim: "GATE-08d calibration tier (discuss-phase richer)"
    disposition: rejected_with_reason
    reason: "fork's model_profile already calibrates; adopting adds surface complexity"
    narrowing_provenance: "CONTEXT §6 [governing:reasoned] narrowing requires GATE-09c rationale"
---
# Phase 58 Scope-Translation Ledger
...
```

- Pros: Verifier tooling (GATE-09d) reads single YAML block; fits existing `frontmatter.cjs` validator; compatible with `kb rebuild` as a new entity type.
- Cons: Creates new artifact class; requires installer manifest update; adds per-phase directory file.

**Layout 2: YAML block inside `NN-SUMMARY.md`**

- Pros: No new file class; SUMMARY already exists per plan.
- Cons: Summaries are per-plan, not per-phase; ledger is phase-scoped. Inserting at phase level means repurposing a "final summary" artifact the phase doesn't currently produce. Also: multiple plans per phase would fragment the ledger.

**Layout 3: Frontmatter extension on `NN-VERIFICATION.md`**

- Pros: VERIFICATION is phase-scoped; fits closeout timing; PROV-05 precedent (signature blocks on VERIFICATION already exist).
- Cons: VERIFICATION is authoritatively owned by the verifier role (PROV-05); GATE-09a ledger is generated across the planner / executor / verifier boundary (planner: narrowing decisions; executor: implementation vs defer; verifier: final disposition). Co-locating it with VERIFICATION.md collapses those role boundaries that Phase 57.8 just formalized.

### Recommendation

[decided:reasoned] **Adopt Layout 1: Standalone `NN-LEDGER.md`.**

Rationale:

1. Verifier tooling (GATE-09d) is cleanest against a dedicated file — one path, one schema, one reader.
2. Role separation matters: planner's narrowing-decision entries (GATE-09c) go in at plan-phase time; executor's implementation-vs-defer entries go in at execute-phase close; verifier's final disposition comes at verify-work. A standalone file is naturally append-only across roles (role_split_provenance in each entry's frontmatter). Collapsing into SUMMARY or VERIFICATION erases that.
3. KB schema extension is ADDITIVE, not breaking — per PROV-05 / KB-05 dual-write invariant. `kb.db` gains a `ledger_entries` table with columns `phase`, `context_claim`, `disposition`, `narrowing_provenance`, `target_phase_if_deferred`, `written_by_role`, `written_at`. Migration is additive — tables added, not columns modified.

### GATE-09 schema specification

```yaml
entries:
  - context_claim: string              # quoted text or claim-ID
    disposition: enum                  # required: implemented_this_phase | explicitly_deferred | rejected_with_reason | left_open_blocking_planning
    evidence_paths: [string]           # required for implemented_this_phase
    target_phase_if_deferred: string   # required for explicitly_deferred, pattern: "Phase NN" or "Phase NN.N"
    narrowing_provenance:              # required for rejected_with_reason
      narrowing_decision: string
      originating_claim: string
      rationale: string
    role_split_provenance:             # per PROV-01 (Phase 57.8)
      written_by: enum                 # planner | executor | verifier
      written_at: ISO8601
      session_id: string
    load_bearing: boolean              # required; true if claim is [decided:*] / [stipulated:*] / [governing:*] / tagged load-bearing / [assumed:*] underpinning a [decided]
```

### Load-bearing classification rule (operational)

[decided:reasoned] A CONTEXT claim is **load-bearing** if ANY of:

1. Its type is `[decided:*]`, `[stipulated:*]`, or `[governing:*]`.
2. Its type is `[evidenced:*]` AND it appears in the `<constraints>` DC-table.
3. Its tag set includes `load-bearing` (author opt-in).
4. Its type is `[assumed:*]` AND another claim in the dependency table cites it as "Depends On".

[assumed:reasoned] Edge cases: `[projected]` claims are load-bearing when cross-phase (the vulnerability chain is explicit). `[open]` claims with GATE-09b resolution-or-defer obligation are load-bearing during plan-phase but not during verification. These edge cases should be tested against existing CONTEXT.md files in the fork; recommend dedicated test-case artifact during implementation.

---

## R7 — Measurement-Layer Consumption of Gate Fire-Events (G-6, DC-2)

### Current extractor registry shape

[evidenced:cited] `get-shit-done/bin/lib/measurement/registry.cjs:204-226`: `defineExtractor()` validates and freezes extractor entries. Required fields per `validateExtractorEntry` (line 166):

| Field | Type | Semantics |
|-------|------|-----------|
| `name` | string | extractor identifier |
| `source_family` | enum | `RUNTIME` / `DERIVED` / `GSDR` |
| `raw_sources` | string[] | source keys |
| `runtimes` | string[] | `claude-code` / `codex-cli` |
| `features_produced` | string[] | feature names |
| `serves_loop` | enum[] | 6 loops (intervention_lifecycle / pipeline_integrity / agent_performance / signal_quality / cross_session_patterns / cross_runtime_comparison) |
| `distinguishes` | string[] | distinguishing features list |
| `reliability_tier` | enum | `direct_observation` / `artifact_derived` / `inferred` / `cross_runtime` |
| `status_semantics` | enum[] (optional) | `exposed` / `derived` / `not_available` / `not_applicable` / `not_emitted` |
| `content_contract` | enum (optional) | `derived_features_only` / `metadata_only` / `no_content_access` |

[evidenced:cited] Current extractor count: 33 across 4 files (grep `defineExtractor\(` — codex.cjs 3, derived.cjs 7, gsdr.cjs 8, runtime.cjs 15). Phase 57.5 shipped baseline; 57.6 expanded; 57.7 added content extractors.

### Can existing registry consume gate fire-events?

[decided:reasoned] **YES, without new measurement architecture.** The `source_family: 'GSDR'` family already consumes `.planning/config.json`, `.planning/state.md`, installed-KB, and artifact files — gate fire-events delivered via (a) `delegation-log.jsonl` (R3), (b) CI `::notice::gate_fired=...` lines (R1), (c) hook logs (via Phase 57.9 session-meta fields) all fit the existing schema.

### Proposed extractor shape

Single `gate_fire_events` extractor in `get-shit-done/bin/lib/measurement/extractors/gsdr.cjs`:

```javascript
const gateFireEventsExtractor = defineExtractor({
  name: 'gate_fire_events',
  source_family: 'GSDR',
  raw_sources: ['delegation_log', 'ci_notices', 'session_meta_postlude'],
  runtimes: ['claude-code', 'codex-cli'],
  features_produced: ['gate_fire_count', 'gate_fire_latest', 'gate_fire_by_gate_id', 'gate_waiver_count'],
  serves_loop: ['pipeline_integrity'],
  distinguishes: ['gate_coverage_by_phase', 'gate_availability_by_runtime'],
  reliability_tier: 'direct_observation',
  status_semantics: ['exposed', 'not_available', 'not_emitted'],
  content_contract: 'metadata_only',
  extract: (entry, context) => { /* emit per-gate records */ }
});
```

Cost of one-extractor-per-gate: 25 extractors × ~30 lines = 750+ lines of boilerplate. Cost of single `gate_fire_events`: ~80 lines + per-gate dispatch inside `extract()`. **Single extractor wins.**

### Stratification

[evidenced:cited] `get-shit-done/bin/lib/measurement/stratify.cjs:1-100`: stratify by session size (small/medium/large), write-path clustering, and cluster window. For gate fire-events, useful stratifications are:

- By `gate_id` (GATE-01..15 × runtime).
- By phase boundary (per-phase emission count).
- By runtime (`claude-code` vs `codex-cli`).
- By `sub_reason` (waiver vs fire).

The existing `stratify.cjs` primitives (clusterByMtime, classifyWritePath) do NOT need extension for gate stratification — gate records are per-event with gate_id dimension; basic groupBy suffices (add to `primitives.cjs` if not present).

[assumed:reasoned] The assumption in CONTEXT §6 `[assumed:reasoned]` (code_context "measurement extractor registry ... without new measurement architecture") is CONFIRMED by reading the code. No migration, no schema extension, no new source family. One extractor registration + 3 raw-source loaders is the entire measurement-layer cost.

---

## R8 — Meta-Gate Feasibility (Q5)

### Shape of the meta-gate

The question: "can verification query the measurement trace for 'every Phase 58 gate fired at least once in its introducing phase'?"

### Query shape

With the `gate_fire_events` extractor (R7):

```javascript
// In gsd-tools verify phase <NN>:
const report = measurement.query('gate_fire_events', {
  phase: 58,
  gate_id: null  // all gates
});
const firedGates = new Set(report.features.gate_fire_by_gate_id.filter(r => r.count > 0).map(r => r.gate_id));
const expectedGates = GATES_INTRODUCED_IN_PHASE[58];  // ["GATE-01", ..., "GATE-15", "XRT-01"]
const missing = expectedGates.filter(g => !firedGates.has(g));
if (missing.length > 0) FAIL();
```

### Cost

- New feature: `GATES_INTRODUCED_IN_PHASE` mapping in `feature-manifest.json` or `.planning/ROADMAP.md` schema — one string array per phase.
- New verification step: ~20 lines in `verify.cjs`.
- Plan-checker extension: warn when a plan modifies a gate but doesn't include an emission step.

[decided:reasoned] **Adoption recommendation: YES, adopt the meta-gate as GATE-09e (embed into GATE-09d verifier contract, don't spin up a separate GATE-99).**

- Cheap: single query into existing measurement substrate.
- Catches the exact failure mode Finding 2.6 / 2.7 describe ("gate installed but not wired").
- Cleanly composes with existing GATE-09d verifier contract ("fails silent disappearance"): a gate that's installed but never fires is a silent disappearance.

This raises Phase 58 from 25 → 25 requirements (GATE-09d absorbs 09e — not a new requirement). If the project prefers an explicit GATE-09e sub-requirement for traceability, that's a lightweight rewrite.

---

## R9 — `gsd-tools` Composability for GATE-10 Reconciliation (Q6)

### Current primitives

[evidenced:cited] From `get-shit-done/bin/lib/state.cjs` + gsd-tools.cjs:

- `cmdStateRecordSession` (`state.cjs:568-603`) — updates `Last session`, `Last Date`, `Stopped At`, `Resume File` fields in STATE.md.
- `cmdStateRecordMetric` (`state.cjs:355`) — updates decision metrics.
- `cmdStateSnapshot` (`state.cjs:605`) — reads STATE.md, extracts decisions/progress/current phase to structured JSON.
- `commit` (via `gsd-tools commit`) — wraps `git commit` with conventional message scaffolding.
- `init phase-op` (`init.cjs`) — atomic state load for a phase operation.
- `roadmap.cjs` operations — phase row updates.
- `milestone.cjs` — milestone-level operations.

### Can they compose into reconciliation?

[decided:reasoned] **Partial-YES — they compose for the read-and-update pieces but need a new orchestrator.** Specifically:

Need to reconcile atomically (or with compensating rollback):
1. STATE.md fields (stopped_at, last_activity, percent) — `cmdStateRecordSession` handles session; need a new `cmdStateReconcile` for phase-close updates.
2. ROADMAP.md phase row (status, plans complete, percent) — need new `cmdRoadmapUpdatePhaseRow` or extend existing `roadmap.cjs`.
3. Phase plan checkboxes — `roadmap.cjs` has check-marking; confirm it's phase-scoped.
4. Touched planning-authority sidecars — dependency scan (git diff --name-only + extension filter) + ensure commit includes them.
5. Single commit (or blocking rejection).

The atomic-multi-file-commit primitive does NOT exist today. The existing `commit` is a thin wrapper over `git commit -m`. The atomicity guarantee is git-native (all-or-nothing via staging).

### Recommendation

[decided:reasoned] **Introduce new `gsd-tools phase reconcile <N>` subcommand.** Composes existing primitives internally:

```
gsd-tools phase reconcile 58
  → reads STATE.md, ROADMAP.md, phase plans, FORK-DIVERGENCES.md
  → computes needed updates (phase row, STATE stopped_at/percent, plan checkboxes)
  → prompts user to review diff (no AskUserQuestion in auto mode)
  → writes all changes
  → git add <tracked files>
  → git commit (invoking existing commit primitive)
  → if any check fails: rollback (git checkout -- <files>) + exit non-zero
```

Rationale: the CONTEXT `[assumed:reasoned]` composability assumption is only partially supported — the read-and-update primitives exist, but the "atomic commit across 4+ file types" step is novel. The new subcommand *internally* calls existing primitives; the user-facing surface is new. This is consistent with DC-1 (named substrate) — the substrate IS a CLI subcommand.

Alternative rejected: workflow-level composition (calling existing primitives from a workflow step). Rejected because a workflow-level composition is bypassable (agent can skip steps); a CLI subcommand is a single exit-coded invocation that cannot be partially run.

---

## R10 — Chain Integrity Against Predecessor Audits

Per the audit's own §10 chain-integrity gaps:

### Finding 2 of codex-harness-audit-gpt54 (installed-agent verification)

[evidenced:cited] `55.2-VERIFICATION.md:30-41`: Key Link Verification table shows `core.cjs` check for `agentFileToml` at lines 1385-1386 passes VERIFIED. Required Artifact: "`get-shit-done/bin/lib/core.cjs` | Codex-cli agent detection | VERIFIED — agentFileToml check at line 1385, found alongside .md and .agent.md; JSDoc updated." Finding 2 is REMEDIATED.

### Finding 3 of codex-harness-audit-gpt54 (sensor introspection)

[evidenced:cited] `55.2-VERIFICATION.md:37`: "`get-shit-done/bin/lib/sensors.cjs` | Multi-directory, multi-format sensor discovery | VERIFIED — discoverSensorDirs, discoverSensors, parseSensorMetadata helpers present and exported; cmdSensorsList and cmdSensorsBlindSpots both use them." Also line 42 confirms `dual-format discovery` test block exists in `tests/unit/sensors.test.js`. Finding 3 is REMEDIATED.

### Finding 4 of codex-harness-audit-gpt54 (init.cjs brownfield)

[evidenced:cited] `55.2-VERIFICATION.md:35`: "`get-shit-done/bin/lib/init.cjs` | .codex exclusion in brownfield skipDirs | VERIFIED — .codex present in skipDirs Set at line 215." Finding 4 is REMEDIATED.

### `signal-detection.md:67-76` Codex model-class heuristic

[evidenced:cited] Re-read 2026-04-20 (`get-shit-done/references/signal-detection.md:67-76`):

```
| Profile | Expected Executor Model Class |
|---------|-------------------------------|
| `quality` | opus-class (claude-opus-*) |
| `balanced` | sonnet-class (claude-sonnet-*) |
```

**Still present, still stale** — this maps only Claude models. A Codex session running `gpt-5.4` on `quality` profile would trigger a false-positive "mismatch" signal. This is NOT scoped to any current phase (Phase 58 does not own it; audit §4.1 flagged it as "still present"). **Phase 58 planner SHOULD name this as an open chain-integrity risk** but not fix it (out of scope per deferred items; fit for Phase 60 or v1.21). Signal-detection drift directly undermines any Phase 58 gate whose effectiveness is measured via signals on Codex sessions.

### `complete-milestone.md:721` `gh pr merge`

[evidenced:cited] `complete-milestone.md:721` is an `<step name="offer_next">` step that displays a completion banner. **It does NOT contain an explicit `gh pr merge --merge` invocation.** The milestone-level merging happens earlier at `complete-milestone.md:605-658` via AskUserQuestion (which defaults to "Squash merge (Recommended)" — see Critical Finding in R1). Phase 58 plan must reconcile both the 721 offer_next step AND the 603-658 merging step under GATE-02.

---

## R11 — Release-Workflow Wiring (GATE-11)

### Current trigger shape

[evidenced:cited] `.github/workflows/publish.yml:3-17`:

```yaml
on:
  release:
    types: [published]
  workflow_dispatch:
    inputs:
      release_ref:
        description: "Release tag to publish (for example: reflect-v1.19.5)"
        required: true
        type: string
      update_release_notes:
        description: "Update the matching GitHub Release notes from CHANGELOG before publish"
        required: false
        default: false
        type: boolean
```

Trigger: `release: published` event OR `workflow_dispatch` manual invocation with a tag ref. NOT triggered by merge-to-main automatically.

Tag format: `reflect-v{version}` (enforced at step "Resolve publish target", lines 38-63 via regex `refs/tags/reflect-v*|reflect-v*`). Version parity check at line 74-82.

### Release-boundary assertion substrate options

**Option A: CI check in `.github/workflows/ci.yml`.** Add a step that, on `push` to main, checks:
- Is the last commit's branch lineage a phase branch merge? (Parse commit message for "Merge pull request #NN from gsd/phase-NN-*".)
- If so, check: does a corresponding `reflect-v*` tag exist with date ≥ merge date?
- If not: emit a workflow-level warning (not fail — the release may be intentionally batched) and write `.planning/release-lag.md` staging a summary.

Runtime-neutral (CI is runtime-free). Pros: discoverable in PR status. Cons: requires commit-message parsing.

**Option B: `gsd-tools release check` exit-coded subcommand.**

```
gsd-tools release check --since <phase-merge-commit>
  exits 0: tag exists and is current
  exits 1: tag missing or stale (> N days since phase merge)
  exits 2: explicit deferral recorded (reads `.planning/release-lag.md`)
```

Invoked from `execute-phase.md` offer_next after merge, and from `complete-milestone.md` post-merge step. On exit 1, requires user to either fire release workflow OR write an explicit `.planning/release-lag.md` deferral note (structural gate: no deferral document → block phase advancement).

### Recommendation

[decided:reasoned] **Adopt Option B.** Reasoning: CI-level check is advisory (no forcing path); CLI-level check is blocking (exit code halts the workflow). DC-1 requires a named substrate with non-bypassable enforcement. Option A is a useful *secondary* signal but not sufficient alone.

`.planning/release-lag.md` becomes a first-class artifact type (similar to `.continue-here`) with a YAML schema: `{lag_reason, deferred_to, deferred_at, named_rationale}`. GATE-11 fire-event is "either release fired OR release-lag.md written" — both observable via the existing `GSDR` measurement source family.

---

## Architecture Patterns

*Adapted from the comparative sonnet research run (see `.sonnet-run-archive/COMPARISON.md` §5.1). Reusable implementation frames that unify the per-GATE recommendations above.*

### Pattern 1: CI-as-Structural-Gate

For GATE-01, 02, 14, 15: enforcement in GitHub Actions workflow, not in agent workflow text.

```yaml
# .github/workflows/ci.yml — add these jobs:

- name: GATE-02 merge-strategy conformance
  run: |
    # Fail if --squash found, or if gh pr merge without --merge
    if grep -rn "gh pr merge" agents/ get-shit-done/ commands/ --include="*.md" | grep -v "\-\-merge"; then
      echo "GATE-02 FAIL: gh pr merge without --merge found"
      exit 1
    fi
    # Opus addendum (not in sonnet): also grep for raw `git merge --squash` per Critical Finding in R1
    if grep -rn "git merge --squash" get-shit-done/ | grep -v "# historical"; then
      echo "GATE-02 FAIL: git merge --squash invocation found"
      exit 1
    fi
    echo "GATE-02 PASS: all merge invocations conforming"

- name: GATE-15 source/install parity
  run: |
    INSTALL_DIR=$(mktemp -d)
    HOME="$INSTALL_DIR" node bin/install.js --claude 2>&1
    # Compare using installer's own replacePathsInContent transformation (opus R1 / R11)
    node scripts/verify-install-parity.js "$INSTALL_DIR" || exit 1
```

### Pattern 2: Workflow-Level Exit-Coded Gate

For GATE-04, GATE-10, GATE-11, GATE-12: workflow step with exit code enforced.

```markdown
<step name="resume_check">
```bash
CONTINUE_HERE_PATH=".continue-here"
if [ -f "$CONTINUE_HERE_PATH" ]; then
  CONTINUE_AGE=$(stat -c %Y "$CONTINUE_HERE_PATH")
  STATE_AGE=$(git log -1 --format="%ct" -- .planning/STATE.md)
  if [ "$CONTINUE_AGE" -lt "$STATE_AGE" ]; then
    echo "GATE-04b HARD STOP: .continue-here is stale (predates STATE.md)"
    echo "gate_id=GATE-04b fired_at=$(date -u +%Y-%m-%dT%H:%M:%SZ) result=hard_stop" \
      >> .planning/measurement/gate-events/GATE-04b-$(date +%Y-%m-%d).jsonl
    exit 1
  fi
  # Archive before consume
  ARCHIVE_PATH=".planning/handoff/archive/$(date +%Y%m%d-%H%M%S).continue-here"
  mkdir -p .planning/handoff/archive/
  mv "$CONTINUE_HERE_PATH" "$ARCHIVE_PATH"
  echo "GATE-04a: Archived to $ARCHIVE_PATH"
fi
```
</step>
```

### Pattern 3: Dispatch Contract Restatement (GATE-13)

For every named delegation spawn site:

```markdown
# DISPATCH CONTRACT (restated inline — compaction-resilient per GATE-13)
# Agent: gsdr-phase-researcher
# Model: {researcher_model} (resolved from model-profiles.cjs profile={model_profile})
# Reasoning effort: default (researcher profile)
# Required inputs: phase number, CONTEXT.md path, RESEARCH.md output path
# Output: RESEARCH.md at {phase_dir}/{padded_phase}-RESEARCH.md
# Codex behavior: applies-via-workflow-step
Task(
  prompt="First, read ...",
  subagent_type="general-purpose",
  model="{researcher_model}",
  ...
)
```

### Pattern 4: Gate Fire-Event Drop-File

For all gates that need measurable fire-events (consumed by the Phase 57.5 extractor registry per G-6):

```bash
# Standard gate fire-event emit pattern
emit_gate_event() {
  local gate=$1 result=$2 phase=$3
  local dir=".planning/measurement/gate-events"
  mkdir -p "$dir"
  echo "{\"gate\":\"$gate\",\"fired_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"result\":\"$result\",\"phase\":\"$phase\",\"runtime\":\"claude-code\"}" \
    >> "$dir/$gate-$(date +%Y-%m-%d).jsonl"
}
```

### Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ledger schema validation | Custom JSON parser | `frontmatter.cjs` (existing in gsd-tools) | Already handles YAML frontmatter across all KB entry types |
| Branch protection enforcement | Pre-push hook cascade | `gh api repos/.../protection` + `enforce_admins: true` | Server-side enforcement cannot be bypassed by local config changes |
| Source/install parity | Custom diff logic | `bin/install.js` path-transformation applied to source tree (opus R1 refinement) | The installer's `replacePathsInContent` already encodes the exact transformation; reuse it rather than building a parallel SHA manifest |
| Multi-file phase reconciliation | String concatenation of state subcommands | New `gsd-tools phase reconcile` | Atomic validation + file staging is not composable from primitives without data loss risk |

---

## Common Pitfalls

*Adapted from the comparative sonnet research run. Named pitfalls the plan-checker can match against directly.*

### Pitfall 1: Structural Gate That Is Still Advisory
**What goes wrong:** A gate requirement is satisfied by adding a workflow step that asks the agent something. The agent reads it and complies — until it doesn't.
**Why it happens:** The requirement says "blocks" but the implementation is markdown prose with no exit code and no hook.
**How to avoid:** Every GATE must have either (a) an exit-coded bash step in a workflow, (b) a CI rule that blocks PR merge, or (c) an installed hook that fires automatically. Test by checking: can the agent skip this step without the system detecting it?
**Warning signs:** A GATE verification that passes by grep-for-text rather than by running a command.

### Pitfall 2: Advisory-by-Composition
**What goes wrong:** GATE-02 is implemented in `execute-phase.md` but not in `complete-milestone.md`. A milestone-boundary merge bypasses the gate.
**Why it happens:** Implementation follows the motivation example (execute-phase) not the requirement scope ("every surface").
**How to avoid:** For each gate, enumerate ALL workflow files that own the lifecycle event the gate covers. DC-3 (no advisory by composition) is the check.
**Warning signs:** Requirement text says "all workflows" but plan only names one file.
**Canonical live instance:** `complete-milestone.md:603,613,623` `git merge --squash` default — neither the audit nor the sonnet research run caught this; opus R1 did. Canonical example of the pattern this phase addresses.

### Pitfall 3: GATE-09 Collapses to Prose
**What goes wrong:** The GATE-09 ledger is delivered as a section in PHASE-SUMMARY.md with narrative text, not YAML. The verifier cannot parse it.
**Why it happens:** SUMMARY.md is the natural phase artifact; adding to it feels like doing the work.
**How to avoid:** GATE-09a requires a standalone `NN-LEDGER.md` with a machine-readable YAML block. The SUMMARY may reference it but the ledger is NOT the SUMMARY prose.
**Warning signs:** "Ledger" delivered as bullet points in prose. `frontmatter.cjs` validation cannot be applied.

### Pitfall 4: Phase 57.9 Completion Incorrectly Assumed
**What goes wrong:** GATE-06 and GATE-07 are planned as if Phase 57.9 has shipped, but 57.9 has no phase directory and no plans (AT-1 check).
**Why it happens:** ROADMAP.md lists 57.9 as a dependency; planner assumes it will be done.
**How to avoid:** AT-1 in CONTEXT.md is explicit — Phase 58 plan must either (a) confirm 57.9 is complete at plan-phase entry, or (b) explicitly defer GATE-06/07 with GATE-09c provenance. Option (b) is the expected path given 57.9 has no plans yet.
**Warning signs:** GATE-06/07 in Phase 58 PLAN.md without a 57.9 prerequisite check step.

### Pitfall 5: `enforce_admins: false` Left Unclosed
**What goes wrong:** GATE-14 is declared complete via a pre-push hook, but admin direct-pushes bypass the hook and the branch protection is not strict.
**Why it happens:** Pre-push hooks are under Claude's Discretion per CONTEXT.md; easy to ship the hook without the server-side protection.
**How to avoid:** GATE-14 plan must include enabling `enforce_admins: true` on branch protection, not only a pre-push hook.
**Warning signs:** GATE-14 verified via "hook added" without branch protection audit.

---

## Verified Ground Truth (post-hoc)

*Direct-fetch verifications performed by the orchestrator after both research runs completed, surfacing in this RESEARCH.md so the planner does not re-spend quota on them.*

| Fact | Value | Verification command | Date |
|------|-------|---------------------|------|
| Upstream `discuss-phase-assumptions.md` line count | **671 lines** | `curl -s https://raw.githubusercontent.com/gsd-build/get-shit-done/main/get-shit-done/workflows/discuss-phase-assumptions.md \| wc -l` → `671` | 2026-04-20 |
| REQUIREMENTS.md:236 line-count claim is current? | **Yes — not stale** | Compare REQUIREMENTS.md:236 value (`671`) with direct fetch | 2026-04-20 |
| Upstream `gsd-assumptions-analyzer.md` agent exists? | **Yes (105 lines)** | `curl -sI https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-assumptions-analyzer.md` → `HTTP/2 200`; body line count `105` | 2026-04-20 |
| Spurious upstream filename `gsd-assume-phase.md`? | **Does not exist** | `curl -s …/gsd-assume-phase.md \| wc -l` → `0` (404) | 2026-04-20 |
| WebFetch reliable for upstream line counts? | **No — content-trimming introduces variance** | Sonnet saw 536; Opus saw ~750; ground truth is 671. Use direct `curl` or `gh api` when byte counts are load-bearing. | 2026-04-20 |

**Planner note:** Direct `curl` is authoritative for upstream text artifacts. Treat WebFetch output sizes as indicative, not exact — cross-verify when a count is load-bearing for a GATE-08 adoption decision.

---

## R12 — Genuine Gaps

| Question | Criticality | Recommendation | Rationale |
|---|---|---|---|
| **Q1 (GATE-03 detection rule)** | Medium | **Ship composition: manifest-primary + diff-fallback + glob-edge-case.** See full evaluation below. | Manifest doesn't exist; need install-time mapping. Glob has false positives on `.md`-only runtime docs. Diff has false positives on legitimate docs touches to `get-shit-done/` tree. |
| **Q2 (upstream discuss-phase shape)** | Low | **Resolved in R5 — upstream is 671 lines** (direct `curl` verified 2026-04-20; the REQUIREMENTS.md:236 figure is accurate, not stale). Adoption plan documented per category. | Live fetch performed via direct `curl`; categorical adoption decisions confirmed. Earlier WebFetch ~750 estimate was content-trimming, not a real count. |
| **Q3 (ledger location)** | Medium | **Resolved in R6 — Layout 1 (standalone `NN-LEDGER.md`).** | Role-separation + verifier simplicity outweigh new-artifact cost. |
| **Q4 (framework-invisibility)** | Low (for Phase 58) | **Accept-risk — deferred to Phase 60.1 intervention-outcome loop per CONTEXT.md guidance.** | Answerable only by post-Phase-58 behavioral trial; Phase 58 establishes measurement substrate so 60.1 can answer. |
| **Q5 (meta-gate)** | Medium | **Adopt — fold into GATE-09d as GATE-09e.** See R8. | Cheap (single query); catches the precise failure mode motivating the phase. |
| **Q6 (GATE-10 composability)** | Medium | **Introduce `gsd-tools phase reconcile <N>` subcommand.** See R9. | Atomic multi-file commit doesn't exist today; requires new orchestrator composing existing primitives. |
| **`complete-milestone.md` `git merge --squash` default** | **HIGH** (new finding not in CONTEXT/audit) | **Fix in Phase 58 Wave 2 under GATE-02.** Change default from Squash to Merge-with-history; add grep check for `git merge --squash` to CI. | Audit missed this (grepped `gh pr merge --squash` only); the `git merge --squash` flavour has the same commit-history-destroying effect and IS currently the default. |
| **`signal-detection.md:67-76` opus/sonnet class heuristic staleness** | Low | **Out of scope for Phase 58 per §8 deferred items; note as open risk in plan.** | Audit §4.1 flagged; not owned by any current phase. Affects Codex-session signal synthesis accuracy, which in turn affects Phase 58 gate-effectiveness measurement on Codex. |
| **Phase 57.9 non-existence at research time** | **CRITICAL for plan entry** | **Verify AT-1 before Phase 58 plan-phase proceeds:** 57.9 phase dir must exist and have plans at `ready_to_execute` or `complete`, OR Phase 58 plan must explicitly defer GATE-06/07 with GATE-09c provenance. | As of 2026-04-20, `.planning/phases/57.9-*/` does not exist. Planner must address this in the first plan-phase step. |
| **`dist/MANIFEST` absence** | Low | **Use `package.json` `files` array + installer path-transformation as the effective manifest.** | CONTEXT.md hedged ("or equivalent"); R1 confirmed absence. GATE-15 implementation must compute the expected installed tree from code, not from a static manifest. |

### Q1 full detection-rule evaluation

Corpus: 401 commits on main in the last 60 days (counted via `git log --first-parent main --no-merges --since="60 days ago"`). Sample analysis on first ~90 of the 401:

**Types of changed files observed in the sample:**

| File Pattern | Commits Observed | Runtime-facing (should gate)? | Which rule catches? |
|--------------|------------------|-------------------------------|---------------------|
| `CHANGELOG.md`, `package.json`, `get-shit-done/templates/config.json` | 12+ (release: commits) | NO (release orchestration) | Glob: MISSES (non-.md runtime). Diff: MATCHES falsely. Manifest: would catch (package.json is in runtime path set). |
| `.planning/STATE.md`, `.planning/config.json`, `.planning/todos/`, `.planning/knowledge/index.md` | 20+ | NO (project state, planning docs) | Glob: catches correctly (non-.md state files but matches existing rule "planning is runtime-adjacent" per DC-9). Diff: catches correctly. |
| `.planning/phases/57-*/57-CONTEXT.md`, `57-DISCUSSION-LOG.md` | 8+ | NO (phase planning docs) | Glob: ambiguous. Diff: MISSES. Manifest: doesn't apply. |
| `.planning/spikes/*/DESIGN.md`, `DECISION.md`, analyze.js | 10+ | NO (spike planning + analysis artifacts) | Similar. |
| `.planning/audits/v1.20-*.md` | 5+ | NO (audit docs) | Glob: catches all .md but they ARE docs. Diff: MISSES. |
| `.codex/skills/gsdr-signal/SKILL.md` (ddcf1232 — the DC-8 pattern) | 1 (`260419-6uf`) | **YES** (runtime-facing skill file) | Glob: MISSES (.md, classified as docs). Diff: CATCHES (path under `.codex/skills/`). Manifest: would catch. |
| `.github/workflows/ci.yml` | 1 (b89e0bab) | YES (CI config) | Diff: CATCHES. Manifest: catches. |
| `get-shit-done/**/*.md` | multiple | YES (workflow / reference runtime) | Diff: CATCHES. Manifest: catches. |
| Test files (`tests/unit/*.test.js`) | occasional | YES (testing is CI-critical) | Diff: CATCHES. Manifest: catches. |
| Installer (`bin/install.js`) | 0 direct-to-main in sample, but elsewhere | YES | Diff: CATCHES. Manifest: catches. |

**False-positive / false-negative analysis:**

| Rule | False positives | False negatives | Comment |
|------|-----------------|-----------------|---------|
| **Glob (.md-only → docs)** | Low on planning docs | **CRITICAL: the 260419-6uf pattern (.codex/skills/*.md) is a .md file that IS runtime** | Rule is fundamentally wrong — .md can be runtime |
| **Git-diff-based** (paths under `get-shit-done/bin/`, `agents/`, `commands/`, `.claude/hooks/`, installer, workflows, planning-authority files) | Planning-authority (STATE, ROADMAP, REQUIREMENTS) files trigger even for legitimate prose patches | Minimal — catches the 260419-6uf pattern correctly | **Recommended primary** with DC-9 explicit |
| **Installer-manifest-based** | Needs manifest exposure; installer's `replacePathsInContent` + source-tree-walk IS the effective manifest | Minimal | **Fallback / cross-check** — compute manifest at run time from `bin/install.js` path list |

[decided:reasoned] **Composition recommendation:** Diff-based primary (DC-9 explicit: ROADMAP / REQUIREMENTS are runtime-adjacent) + manifest-based cross-check (compute expected installed paths from source tree, fail-closed if unexpected files touched). Glob is the fallback for ambiguous cases but CANNOT be primary because the DC-8 pattern (`.md` file IS runtime) breaks it.

---

## Plan Recommendations

### Wave structure (4 waves, mixed parallel/serial)

**Wave 1 — Substrate discovery & schema (parallel, 5 plans, no file-overlap):**

- P1: GATE-02 comprehensive enumeration + fix `complete-milestone.md:613,623` squash default (touches: `complete-milestone.md`; outputs: fix-commit).
- P2: GATE-05 named-site enumeration + echo-block macro design (touches: RESEARCH.md addendum + design doc).
- P3: GATE-08a upstream fetch artifact + per-category adoption matrix + port `gsdr-assumptions-analyzer` (touches: new `agents/gsdr-assumptions-analyzer.md`).
- P4: GATE-09a ledger schema spec + `frontmatter.cjs` validator rules + KB schema addition (touches: `frontmatter.cjs`, KB schema file).
- P5: Per-gate Codex behavior matrix authored (touches: new doc for AT-3 compliance).

**Wave 2 — CI-hosted gates (SERIAL — all share `.github/workflows/ci.yml`):**

- P6: GATE-01 CI workflow change + `gsd-tools phase advance --require-ci-green` + branch protection flip (`enforce_admins: true`, `strict: true`).
- P7: GATE-02 grep step in CI (`gh pr merge` AND `git merge --squash` patterns).
- P8: GATE-03 diff-based + manifest-cross-check CI step + quick.md structural branching.
- P9: GATE-14 folds into P6 (same branch protection flip) — not a separate plan, but verified here.
- P10: GATE-15 post-install parity check.

Wave 2 must serialize because every plan edits `.github/workflows/ci.yml`.

**Wave 3 — Workflow-level / gsd-tools gates (parallelizable — distinct files):**

- P11: GATE-04a/b/c archive + staleness + severity framework (touches: `resume-project.md`, new `handoff.cjs`, new `antipatterns.md`).
- P12: GATE-05 echo macro + GATE-13 dispatch-contract restatement (touches: 15 workflow files — serialize internally per file but parallel at file level with care).
- P13: GATE-10 `gsd-tools phase reconcile` subcommand (touches: `gsd-tools.cjs`, new `reconcile.cjs`).
- P14: GATE-12 agent-dispatch envelope (touches: workflow files for archive-on-failure pattern).
- P15: GATE-11 `gsd-tools release check` subcommand + `.planning/release-lag.md` schema.

**Wave 4 — Consumer gates + verifier (depends on Wave 3 substrates):**

- P16: GATE-06 / GATE-07 consumer registration (depends on Phase 57.9 HOOK-01/02/03 shipped — AT-1 blocker).
- P17: GATE-09b planning-gate check in plan-phase.md + GATE-09c narrowing provenance in RESEARCH/PLAN templates + GATE-09d verifier contract with meta-gate (GATE-09e).
- P18: XRT-01 plan-phase assertion + capability-matrix closeout diff check.
- P19: `gate_fire_events` extractor registration (needs waves 2 + 3 to have emitters in place).
- P20: Phase 58 own ledger (reflexive GATE-09 application).

### File-scope overlap warnings

| File | Plans touching it | Handling |
|------|-------------------|----------|
| `.github/workflows/ci.yml` | P6, P7, P8, P10 | Wave 2 MUST serialize |
| `get-shit-done/workflows/complete-milestone.md` | P1, P12 (possibly) | P1 lands before P12 enters this file |
| `get-shit-done/workflows/execute-phase.md` | P12 | Single plan owns |
| `bin/install.js` | Phase 57.9 (prerequisite) | Phase 58 does not modify — DC-6 |
| `get-shit-done/bin/gsd-tools.cjs` | P13 (reconcile), P15 (release check), P19 (extractor route) | Serialize within Wave 3/4 |
| `get-shit-done/bin/lib/measurement/registry.cjs` | P19 | Single plan |
| `get-shit-done/bin/lib/measurement/extractors/gsdr.cjs` | P19 | Single plan |
| `frontmatter.cjs` | P4 (ledger schema) | Single plan |
| `.planning/REQUIREMENTS.md` | P20 (own-phase ledger + any meta-gate additions) | Last |
| `.planning/ROADMAP.md` | P20 | Last |

### Dependencies / serialization constraints

- **Phase 57.9 prerequisite (AT-1):** Plans P16 blocked until 57.9 ships. If 57.9 not ready at Phase 58 plan-phase entry, P16 is replaced with an explicit-defer plan (writes the GATE-09c provenance in the ledger).
- **AT-6 reflexive:** STATE.md reconciled before Phase 58 plan-phase starts (STATE.md:6 currently says "Phase 58 context gathered" — this is correct for current progress, not stale).
- **GATE-09e (meta-gate) requires Waves 2+3 emitters** before Wave 4 verifier can assert emission. Cannot land Wave 4 meta-check plan without emitters.
- **GATE-15 parity check (P10) needs installer-manifest accessible from CI** — this is a Wave 2 blocker for P10 specifically; either (a) P10 computes manifest inline from installer source, or (b) a preceding patch exposes `bin/install.js` manifest as a callable function.

### Per-gate Codex behavior table (skeleton — plan to complete)

| GATE | Claude Code | Codex | Reason if waived |
|---|---|---|---|
| GATE-01 | applies-via-workflow-step | applies-via-workflow-step | CI is runtime-neutral |
| GATE-02 | applies | applies | CI grep is runtime-neutral |
| GATE-03 | applies-via-workflow-step | applies-via-workflow-step | Diff + manifest check via CI; both runtimes commit via the same gh surface |
| GATE-04a | applies | applies-via-workflow-step | Workflow-side archive; Codex workflow runs the same step |
| GATE-04b | applies | applies-via-workflow-step | Same |
| GATE-04c | applies | applies-via-workflow-step | Same |
| GATE-05 | applies | applies | delegation-log.jsonl works on both runtimes |
| GATE-06 | applies-via-installer | applies-via-workflow-step if codex_hooks=true, else does-not-apply-with-reason | Codex hook flag gated |
| GATE-07 | applies-via-installer | applies-via-workflow-step if codex_hooks=true, else does-not-apply-with-reason | Same |
| GATE-08a-e | applies | applies | Workflow edits apply to both runtimes |
| GATE-09a-d | applies | applies | Ledger is filesystem + KB; runtime-neutral |
| GATE-10 | applies | applies | CLI subcommand is runtime-neutral |
| GATE-11 | applies | applies | CLI subcommand runtime-neutral |
| GATE-12 | applies | applies | Workflow-level envelope, both runtimes |
| GATE-13 | applies | applies | Inline dispatch contract — helpful under Codex auto-compact specifically |
| GATE-14 | applies | applies | Branch protection runtime-neutral |
| GATE-15 | applies | applies | CI check runtime-neutral |
| XRT-01 | applies | applies | Plan-phase assertion runtime-neutral |

The table should be finalized in a Wave 1 plan (P5) as part of AT-3 compliance.

---

## Sources

### Primary (HIGH confidence)

- **`.planning/audits/2026-04-20-phase-58-structural-gates-gap-audit/phase-58-structural-gates-gap-audit-output.md`** — every finding citation
- **`.planning/phases/58-structural-enforcement-gates/58-CONTEXT.md`** + **58-DISCUSSION-LOG.md** — claim types + context-checker verification
- **`.planning/ROADMAP.md:140-150, 315-328`** — Phase 57.9 and 58 entries
- **`.planning/REQUIREMENTS.md:211-265, 419`** — HOOK-01..03, GATE-01..15, XRT-01
- **`.claude/settings.json:1-54`** — current hook surface
- **`bin/install.js:2080-2127, 2846-2869`** — installer hook logic
- **`.github/workflows/ci.yml:1-85`** — CI workflow
- **`.github/workflows/publish.yml:1-137`** — release workflow
- **`get-shit-done/workflows/execute-phase.md:770-824`** — offer_next + gh pr merge
- **`get-shit-done/workflows/complete-milestone.md:603-658, 721`** — milestone merge (contains `git merge --squash` — critical finding)
- **`get-shit-done/workflows/resume-project.md:127-138`** — .continue-here consume
- **`get-shit-done/workflows/quick.md:155-183`** — quick-task branching
- **`get-shit-done/bin/lib/state.cjs:568-603`** — record-session + related primitives
- **`get-shit-done/bin/lib/measurement/registry.cjs:204-226`** — defineExtractor
- **`get-shit-done/bin/lib/measurement/stratify.cjs:1-100`** — stratification primitives
- **`get-shit-done/bin/lib/measurement/extractors/*.cjs`** — 33 registered extractors across 4 files
- **`get-shit-done/references/signal-detection.md:67-76`** — stale opus/sonnet heuristic (NOT remediated)
- **`.planning/research/cross-runtime-parity-research.md:60-90`** — Codex hook surface
- **`.planning/phases/55.2-codex-runtime-substrate/55.2-VERIFICATION.md`** — chain integrity for Findings 2, 3, 4 (all REMEDIATED)
- **`.planning/measurement/interventions/2026-04-17-gate-09-scope-translation-pending.md`** — GATE-09 as live measurement-layer intervention record
- **`gh api repos/loganrooks/get-shit-done-reflect/branches/main/protection`** — branch protection status (2026-04-20)
- **`git log --first-parent main --no-merges --since="60 days ago"`** — 401 commits for Q1 analysis
- **`git log ddcf1232`** — DC-8 pattern recurrence verification

### Secondary (MEDIUM confidence)

- **`curl https://raw.githubusercontent.com/gsd-build/get-shit-done/main/get-shit-done/workflows/discuss-phase-assumptions.md`** — upstream line count **671** (direct-fetched 2026-04-20; WebFetch earlier estimate of ~750 was wrong due to content-trimming).
- **`curl -I https://raw.githubusercontent.com/gsd-build/get-shit-done/main/agents/gsd-assumptions-analyzer.md`** — confirms `gsd-assumptions-analyzer.md` exists upstream (HTTP 200, 105 lines; also independently verified via earlier WebFetch against `api.github.com/contents/agents`: file size 4.5 KB, SHA `5531fc4a973ef723201c53042a9afcb33989c144`).
- Upstream anti-pattern severity framework — cited via audit Finding 2.4 + upstream-drift-survey; not re-fetched in this research

### Tertiary (LOW confidence)

- None — all substantive claims cross-verified from at least two primary sources.

---

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| `sig-2026-04-10-phase-574-pr45-ci-clean-mergeable-baseline` | signal | CI + required checks already operational; PR #45 passed | R1 (GATE-01 CI substrate confirmation) |
| `sig-2026-04-10-ci-branch-protection-bypass-recurrence` | signal (critical, 3 occurrences) | Admin-bypass direct-push to main | R1 (GATE-14 motivation) |
| `sig-2026-03-28-squash-merge-destroys-commit-history` | signal (critical) | `gh pr merge --squash` destroyed PR #24 commits | R1 (extended to `git merge --squash` finding) |
| `sig-2026-04-19-gsdr-quick-bypassed-then-backfilled` / `sig-2026-04-02-quick-task-code-changes-committed-directly-to-main` | signal | Quick task R08 pattern | R12 Q1 (direct-to-main corpus analysis) |
| `sig-2026-04-17-phase-closeout-left-state-pr-release-pending` (5 occurrences) + `sig-2026-04-20-phase-closeout-planning-state-release-lag` (6 occurrences) | signals | Closeout seam | R9 (GATE-10) + R11 (GATE-11) |
| `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving` (2 occurrences) | signal | Partial-output deletion | P14 (GATE-12 archive envelope) |
| `sig-2026-04-10-researcher-model-override-leak-third-occurrence` (3 occurrences) | signal | Cross-dispatch model leak | R3 (GATE-05 design) |
| `sig-2026-04-17-codex-auto-compact-prompt-parity-gap` (3 occurrences) | signal | Compaction drops dispatch context | R3 (GATE-13 design) |
| `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop` | signal | Closed issues masked adoption gap | R5 (GATE-08 motivation) |
| `sig-2026-03-30-release-workflow-forgotten-in-milestone-completion` | signal | Release not part of milestone-complete | R11 (GATE-11 motivation) |
| `sig-2026-02-16-stale-continue-here-files-not-cleaned` / `sig-2026-02-17-continue-here-not-deleted-after-resume` | signals | `.continue-here` staleness | R2 (GATE-04 motivation) |
| `spk-2026-03-01-claude-code-session-log-location` | spike (confirmed) | Claude session log discoverability | R7 (extractor source confirmation) |
| `spk-2026-04-09-session-data-integrity-characterization` | spike (confirmed) | Session-meta data integrity | R4 (Phase 57.9 session-meta field design) |
| `spk-2026-04-09-token-count-reliability` | spike (confirmed) | Token-count field integrity | R7 (extractor reliability_tier) |

---

## Metadata

**Confidence breakdown:**

- Substrate inventory (R1, R2, R3): **HIGH** — direct file:line reads, branch protection API, commit history
- Hook consumer contract (R4): **HIGH for current state, MEDIUM for Phase 57.9 deliverables** — 57.9 not yet written
- Upstream discuss-phase adoption (R5): **MEDIUM** — WebFetch returned useful structural summary; exact line-by-line diff not reconstructed
- Ledger schema (R6): **MEDIUM** — design recommendation validated against existing phase artifact conventions; not prototyped against KB rebuild
- Measurement extractor fit (R7): **HIGH** — registry code directly read, schema validation rules confirmed
- Meta-gate feasibility (R8): **HIGH** — query-shape trivially composes with existing extractor registry
- gsd-tools composability (R9): **MEDIUM** — primitives confirmed; atomic-multi-file-commit orchestrator does NOT yet exist
- Chain integrity (R10): **HIGH for 55.2 remediations, HIGH for signal-detection.md staleness** — direct re-reads
- Release wiring (R11): **MEDIUM** — Option B recommendation sound; exact `release-lag.md` schema TBD
- Q1 detection rule (R12): **MEDIUM** — 60-day corpus evaluated on sample of ~90 commits; remaining ~311 not manually classified

**Research date:** 2026-04-20
**Valid until:** 30 days (stable substrate; upstream discuss-phase line count may drift faster — flag at 7 days if GATE-08a plan hasn't started)

---

## RESEARCH COMPLETE
