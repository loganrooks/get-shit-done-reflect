---
date: 2026-04-20
audit_subject: requirements_review
audit_orientation: investigatory
audit_delegation: cross_model:claude-opus-4-7
auditor_model: claude-opus-4-7
scope: "Phase 58 (Structural Enforcement Gates) — gap audit"
task_spec: phase-58-structural-gates-gap-audit-task-spec.md
predecessor_audits:
  - ../2026-04-07-v1.20-roadmap-restructure/v1.20-roadmap-restructure-review-opus.md
  - ../2026-04-08-codex-drift-audit/codex-harness-audit-gpt54-2026-04-08.md
  - ../2026-04-10-phase-57-vision-drop-investigation/sonnet-output.md
  - ../2026-04-16-signal-provenance-audit/signal-provenance-audit-output.md
tags: [phase-58, structural-gates, requirements-review, investigatory, cross-vendor, codex-parity, workflow-enforcement]
---

# Phase 58 Structural Enforcement Gates — Gap Audit

**Classification:** `requirements_review` × `investigatory` × `cross_model:claude-opus-4-7`
**Scope:** Phase 58's declarative surface — ROADMAP entry (`.planning/ROADMAP.md:304-315`), requirements `GATE-01..GATE-09` and `XRT-01` (`REQUIREMENTS.md:187-206, 360`), and its dependency/sequencing story relative to 57.7, 57.8, 59, 60, 60.1.
**What this audit does NOT own:** Phase 58 has no `.planning/phases/58-*` directory, no CONTEXT.md, no RESEARCH.md, no PLAN.md. The declarative surface is all that exists. Findings below therefore work from ROADMAP + REQUIREMENTS text against the current substrate — not against a phase plan that does not yet exist.
**Headline verdict:** **Expand 58 materially AND split one prerequisite out.** The phase as framed is a defensible structural aspiration but is load-bearing in ways the text does not own. It is missing at least two gates for actively-recurring failure modes, has a silent substrate prerequisite (SessionStop hook installation) that the current installer does not deliver, leaves one GATE (GATE-06 / GATE-07) standing on infrastructure that does not exist on either runtime, and treats Codex in a way its own predecessor audits have already falsified. Sections 5–7 itemize concretely.

---

## 1. What Was Expected vs. What Is Delivered (I1: name the discrepancy)

**Expected standard (chosen, named, and defended).** The phase's own headline commitment sets the standard: "the 8 most-recurred advisory failure patterns are replaced with **structural enforcement that cannot be circumvented by agent discretion**" (ROADMAP.md:305). "Structural enforcement" in this project's own internal vocabulary means a mechanism that fires without the agent needing to remember to invoke it — hooks on Claude Code, installer-wired workflow steps on Codex, exit codes that block progression, not prose that asks nicely. I treat that literal commitment as the standard because it is the phase's own self-description; the audit is not importing an outside test.

**Why this standard, and not a softer one?** One alternative was to read Phase 58 as "upgrading advisory gates into *more legible* advisory gates" — essentially a documentation phase. I rejected that reading because the motivation lines (REQUIREMENTS.md:190, 192, 196, 198, 200, 202) each cite concrete signals of recurrence under the advisory pattern; if the phase reduces to better prose, the motivation does not survive. Another alternative was to use "pre-Phase-58 signals" as the standard (close the R-family of repeat patterns). I rejected that because signals are proxies for patterns, not authoritative scope (Rule 3: every measurement is a proxy). Using the phase's own commitment closes the interpretive loop without importing an external target.

**What is delivered, as of 2026-04-20.** The declarative surface commits nine GATE requirements and XRT-01 plus six success criteria (ROADMAP.md:309-314). There is no phase directory, no CONTEXT, no plan. The runtime substrate has:

- a `SessionStart` hook set (4 hooks) and one `PostToolUse` hook — no `SessionStop`, no `PreToolUse` (`.claude/settings.json:1-54`).
- an advisory `offer_next` step with interactive prompts and no CI check (`get-shit-done/workflows/execute-phase.md:780-813`).
- one conforming `gh pr merge --merge` invocation and zero non-conforming ones (`get-shit-done/workflows/execute-phase.md:793`, reflected at `.claude/get-shit-done-reflect/workflows/execute-phase.md:793`).
- a `.continue-here` consumed-on-read `rm -f` — no archive, no staleness check (`get-shit-done/workflows/resume-project.md:127-135`).
- sensor dispatch that does not echo model to the user before the spawn loop (`get-shit-done/workflows/collect-signals.md:249-251`).
- discuss-phase-assumptions.md still at 279 lines on both source and installed mirrors — no `gsd-assumptions-analyzer` agent, no `docs/workflow-discuss-mode.md`, no mode-aware gate in plan-phase.md or progress.md.
- no tooling substrate anywhere for the GATE-09 scope-translation ledger (`implemented_this_phase` / `explicitly_deferred` / `rejected_with_reason` / `left_open` have zero source-code hits per Agent-1's grep).

**The discrepancy.** The phase as written commits to "structural" enforcement, but multiple success criteria bottom out on substrate that does not exist and that Phase 58's own requirement text does not explicitly require to be installed. The failure mode is not "Phase 58 is wrong"; it is "Phase 58 can be declared complete against the requirement text without actually achieving structural enforcement on either runtime." This is the shape of the pattern that Phase 57.7's scope-narrowing cascade investigation (`.planning/audits/2026-04-10-phase-57-vision-drop-investigation/sonnet-output.md:126-136` — re-read in §10) already describes: goal-level commitments survive into declarative scope but are not load-bearing at planning time.

---

## 2. Findings — Requirement Quality (Subject Obligations)

Requirements are assessed on specificity, feasibility, and coverage of the motivating failure. Every finding cites current file:line with a direct quote.

### Finding 2.1 — GATE-01 Under-Specifies the Blocking Verb

Quote (`.planning/REQUIREMENTS.md:189`):
> "**GATE-01**: offer_next blocks phase advancement until PR is created and CI passes. User can provide explicit override with documented justification logged to session. On Codex (no hooks), offer_next requires manual confirmation of PR/CI status before proceeding"

The substrate that would implement this is `get-shit-done/workflows/execute-phase.md:777-824`. At line 780 the workflow prints "Create PR? [y/n]"; at 787 "Merge now? [y/n]"; at 805 the "If more phases" branch fires unconditionally whether or not the user said yes. There is no CI-wait, no exit-non-zero on failure, no session-log write for the override. The workflow **asks** but does not block.

What the requirement is missing:
- **No fire condition.** "Blocks phase advancement" is a predicate, not a mechanism. Is the block a hook, a workflow step that exits non-zero, or a CLI subcommand that polls? The requirement does not say, and `offer_next` itself is not a structural chokepoint — it is a workflow step the agent can skip.
- **No session-log contract for the override.** "Documented justification logged to session" refers to a log that does not yet exist in canonical form. Quick-task sessions write into `.planning/quick/`; execute-phase sessions write into `.planning/phases/.../PHASE-SUMMARY.md`; there is no single "session log" that the requirement can target.
- **The Codex sentence is self-falsifying.** On Codex, "offer_next requires manual confirmation" *is* the advisory pattern the phase claims to replace. The requirement negates its own thesis on one of two runtimes.

What would disconfirm this finding: if `offer_next` were already wired with `set -e` + exit codes that halt the orchestration loop. Checked: the workflow uses ``` ... ``` bash blocks nested inside markdown step text; the orchestration loop is Claude's harness, not a shell, so there is no exit-code contract. Finding stands.

### Finding 2.2 — GATE-02 Is Already Largely True; Requirement Is Mis-scoped

Quote (`.planning/REQUIREMENTS.md:191`):
> "**GATE-02**: `--merge` is the structural default for PR merges — passed explicitly in `gh pr merge` invocation, not documented as preference"

Verified current state: exactly one `gh pr merge` invocation in source at `get-shit-done/workflows/execute-phase.md:793` and it reads `gh pr merge $CURRENT_BRANCH --merge` with inline comment "preserves individual commit history, never `--squash`." No `--squash` anywhere. The conformance is in-place (surveyed via full-repo grep across agents/, get-shit-done/, commands/, .claude/).

The real gap that GATE-02 names but does not cover: `complete-milestone.md` (`get-shit-done/workflows/complete-milestone.md:721` — confirmed to contain offer_next with no explicit `gh pr merge --merge` line). If a milestone-boundary merge is needed (as opposed to phase-boundary), there is no canonical `--merge` invocation for the agent to fall back on. Also: the `gsd-ship` command path (per the skills list, invokable) has not been audited in this pass. The requirement should be rewritten as: "every gh pr merge invocation in any workflow, skill, or agent file passes --merge explicitly; CI verifies via grep at release."

### Finding 2.3 — GATE-03 Missing Detection Mechanism

Quote (`.planning/REQUIREMENTS.md:193`):
> "**GATE-03**: Quick task detects runtime code changes and requires branch+PR flow — docs-only changes allowed direct to main"

The quick workflow (`.claude/get-shit-done-reflect/workflows/quick.md:163-173`) supports a `branch_name` variable and will check out a branch if one is configured, but there is no file-path-pattern or git-diff discriminator that decides whether a branch is mandatory. The word "detects" in the requirement names a capability that does not exist.

Concrete pattern still live, post-motivation: quick task `260419-6uf` (commit `ddcf1232`) modified the installed Codex `gsdr-signal` skill — a runtime artifact — direct to main without a PR on 2026-04-19. This is the exact failure the requirement's motivation cites (pattern R08), recurring 24 hours before this audit. GATE-03 is the only gate whose own motivation recurred while it was pending.

The requirement should specify the detection rule explicitly. Candidates: (a) glob-based (`.md`-only → docs; anything else → runtime), (b) git-diff-based (touched files in `get-shit-done/bin/`, `agents/`, `commands/`, `.claude/hooks/`, etc. → runtime), (c) installer-manifest-based (cross-reference against `dist/MANIFEST`). Leaving it as "detects" means the planner gets to choose, which is the scope-narrowing surface §10 describes.

### Finding 2.4 — GATE-04 Has Two Mechanisms Collapsed Into One Requirement

Quote (`.planning/REQUIREMENTS.md:195`):
> "**GATE-04**: `.continue-here` files marked consumed on read and deleted/archived after session start. Staleness check if file predates last session. Adopt upstream's hard stop safety gates and anti-pattern severity levels (blocking/advisory with mandatory understanding checks for blocking items)"

The first sentence is a lifecycle fix. The second (staleness) is a freshness check. The third (upstream hard-stop severity levels) is a different mechanism entirely — severity-tagged anti-pattern enforcement. The requirement collapses three designs into one bullet. Feasibility risk: Plan-phase cannot scope this cleanly; the phase will narrow to lifecycle-only (the easiest) and declare it done, leaving severity levels unshipped. This is precisely the R-pattern Phase 57.7's vision-drop investigation attributes to single requirements carrying multiple commitments (§10).

Split recommendation: **GATE-04a** (lifecycle — consumed-on-read, archive path, staleness); **GATE-04b** (severity level adoption from upstream); **GATE-04c** (blocking/advisory understanding checks). Each is plan-bounded.

### Finding 2.5 — GATE-05 Is Specific Enough but Too Narrow

Quote (`.planning/REQUIREMENTS.md:197`):
> "**GATE-05**: Sensor model selection echoed and logged before dispatch in all delegation workflows"

The wording "all delegation workflows" is good — it generalizes beyond sensors. But the motivation (R10 — "entire sensor batch stopped and relaunched") is sensor-specific, and signal `sig-2026-04-10-researcher-model-override-leak-third-occurrence.md` (three occurrences, verified) shows the same leakage affecting the researcher agent, not just sensors. The requirement as written covers researcher dispatch in principle ("all delegation workflows") but the implementation will follow the motivation line and only wire collect-signals.md.

Specificity fix: either strengthen the requirement list to enumerate delegation sites (`collect-signals.md`, `gsdr-phase-researcher`, `plan-phase.md`, `discuss-phase.md`, `audit.md`) or strengthen the success criterion to require an end-to-end test that dispatches a non-sensor agent and asserts model echo. Leaving "all delegation workflows" as-is is a scope-narrowing surface.

### Finding 2.6 — GATE-06 Requires Hook Infrastructure That No Installer Writes

Quote (`.planning/REQUIREMENTS.md:199`):
> "**GATE-06**: Automation postlude fires structurally — SessionStop hook on Claude Code, workflow-enforced step on Codex — rather than by agent discretion"

Substrate check: `.claude/settings.json` has no `SessionStop` entry (lines 1-54, verified). `bin/install.js:2094` enumerates `['SessionStart', 'PostToolUse', 'AfterTool', 'PreToolUse', 'BeforeTool']` for cleanup, not `SessionStop` for installation. No code path in the installer writes a `SessionStop` entry. On Codex, Agent-1's reading of `cross-runtime-parity-research.md:70-80` confirms SessionStop *can* be configured under a `codex_hooks` feature flag, but the installer does not install it (`bin/install.js:2846-2856`: unconditional skip for Codex hooks).

The requirement as written therefore depends on substrate that the installer does not provide on either runtime. Phase 58 must either (a) add a child requirement "installer wires SessionStop on Claude Code and conditional Codex hook wiring"; (b) rewrite GATE-06 to use an already-present hook (PostToolUse fires on Bash|Task which would catch dispatch but not session end); or (c) adopt a poll-on-next-session pattern that does not need SessionStop. Any of these is fine; silence is not.

### Finding 2.7 — GATE-07 Has No Substrate At All

Quote (`.planning/REQUIREMENTS.md:201`):
> "**GATE-07**: Incident self-signal hook prompts signal creation when session metadata indicates high error rate, direction changes, or destructive events during execution"

Full-codebase grep for `self-signal`, `self_signal`, and incident-detection returned zero matches outside the requirement itself and citing signals (Agent-1 verified). The gsdr-log-sensor can analyze errors retrospectively but only when invoked by `collect-signals`. "Session metadata" is unowned — no sidecar writes error counts during execution. The requirement assumes a telemetry path that does not exist.

This is the most speculative GATE. It should either (a) depend explicitly on Phase 57.7's `session-meta` / facets surface being load-bearing and name the extractor that computes error rate (a PROV-family surface, currently deferred to Phase 60.1); or (b) be re-scoped to a narrower operational trigger (e.g., "if `gh run view` returns failed for any CI check against the current branch and no signal exists, prompt"). Leaving it as "session metadata indicates" invites the same cascade §10 describes.

### Finding 2.8 — GATE-08 Is a Workplan Disguised as a Requirement

Quote (`.planning/REQUIREMENTS.md:203`):
> "**GATE-08**: Discuss-phase three-mode adoption completed — verify current state against upstream's 671-line discuss-phase-assumptions.md, create missing `gsd-assumptions-analyzer` agent, add `docs/workflow-discuss-mode.md`, wire mode-aware gates in plan-phase.md and progress.md where absent. Adopt upstream's richer version with methodology loading"

This is five tasks, not a requirement. "Adopt upstream's richer version" is not a verifiable outcome; it is a direction. The 671-line claim has been stable in REQUIREMENTS.md since April 7 but the fork is at 279 lines on both source and installed copies (`get-shit-done/workflows/discuss-phase-assumptions.md` — 279 lines, verified via `wc -l`; `.claude/get-shit-done-reflect/workflows/discuss-phase-assumptions.md` — 279 lines, verified). Upstream line count (671) was *not* re-verified in this audit; I did not fetch upstream. Chain integrity: I am relying on the REQUIREMENTS.md claim and Agent-2's citation of `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop.md`. If upstream has since diverged, the gap number is off; the adoption gap itself is still attested.

Rewrite: split into enumerated sub-requirements (GATE-08.1 through GATE-08.5) so each is verifiable.

### Finding 2.9 — GATE-09 Mixes Policy with Mechanism

Quote (`.planning/REQUIREMENTS.md:205`):
> "**GATE-09**: Scope-translation ledger — (1) every load-bearing CONTEXT claim mapped at phase close to `implemented_this_phase` / `explicitly_deferred` / `rejected_with_reason` / `left_open_blocking_planning`; (2) any `[open]` scope-boundary question in CONTEXT affecting what the phase is supposed to build must be resolved or deferred with a named downstream phase before planning proceeds; (3) if RESEARCH or PLAN narrows scope relative to CONTEXT, it must cite the originating CONTEXT claim and record the narrowing as a decision; (4) verification checks the ledger — a phase can pass its executable truths but the verifier also confirms whether CONTEXT commitments were explicitly deferred rather than silently disappearing"

Part (1) is the ledger. Part (2) is a gating policy (halts planning until `[open]` scope questions resolve). Part (3) is a decision-provenance rule. Part (4) is a verification contract. This is four mechanisms collapsed into one requirement; the plan will likely ship (1) — the ledger file — and declare the rest "deferred to future phase."

Further: GATE-09's verification depends on role-aware provenance that Phase 57.8 is supposed to deliver (ROADMAP.md:123-124: "Epistemic prerequisite for GATE-09"). Phase 57.8 has shipped on the branch but has not merged and STATE.md still records it as "context gathered" (verified: `.planning/STATE.md:6`). The dependency is real but currently lagging — the 57.8 → 58 handoff is not closed.

The phase-level deliverable for GATE-09 is correctly labeled "meta-fix for the Phase 57 scope-narrowing cascade," and the motivation (measurement-infrastructure-epistemic-foundations §7.4) is strong. The requirement itself needs to be split.

### Finding 2.10 — XRT-01's "Before Implementation Begins" Has No Enforcement Hook

Quote (`.planning/REQUIREMENTS.md:360`):
> "**XRT-01**: Every hook-dependent v1.20 feature specifies its Codex CLI degradation path in phase CONTEXT.md before implementation begins. Cross-runtime capability matrix (`capability-matrix.md`) updated when v1.20 features ship"

The "before implementation begins" clause has no structural gate. Phase 57.7 and 57.8 CONTEXT.md files do not contain Codex degradation sections for the hook-dependent features they touch (per Agent-1; I did not re-verify 57.7 directly, but did verify 57.8-CONTEXT.md lacks a Codex degradation subsection by inspection — see `research/PITFALLS.md:67` quote in Agent-1 output). This is itself a scope-narrowing cascade: XRT-01 was supposed to have been enforced during Phase 57.7 planning, and it was not.

The requirement needs either a plan-phase gate (discuss-phase assertion: "any hook-dependent commitment in CONTEXT has an accompanying Codex degradation claim") or a verifier check ("phase ships → capability-matrix.md diff reviewed in closeout"). Neither exists.

---

## 3. Findings — Missing Requirements (Negative Space)

Here I apply the subject obligation "check for missing requirements (negative space)." Each gap is tied to evidence of a live or recurring failure that no GATE covers.

### Finding 3.1 — No Gate Owns Phase Closeout Reconciliation (STATE/ROADMAP/PR/Release Atomicity)

**Evidence.** Two closeout signals in 72 hours:

- `sig-2026-04-17-phase-closeout-left-state-pr-release-pending.md`, occurrence_count 5
- `sig-2026-04-20-phase-closeout-planning-state-release-lag.md`, occurrence_count 6 (dated 2026-04-20, quoted §103-105, 119-121):
  > "`STATE.md` still described Phase 57.7 as current and still said `Stopped at: Phase 57.8 context gathered`. `ROADMAP.md` still showed Phase 57.5 through 57.8 as `0/TBD | Not started`... there was still no PR for `gsd/phase-57.8-signal-provenance-split-artifact-signature-blocks`, no PR CI gate had been waited on, and no patch-release flow had started from `main`."
  > "No single workflow step currently owns the boundary between 'phase implementation verified' and 'project operationally ready to advance or release.'"

Verified live: `.planning/STATE.md:6` right now says `stopped_at: Phase 57.8 context gathered`, and ROADMAP.md rows at lines 416-424 still show Phase 57.5–57.8 state stale relative to what has actually shipped. The pattern is present in the audit's own repo at the audit moment.

**No GATE covers this.** GATE-01 covers PR creation. No GATE covers STATE.md / ROADMAP.md reconciliation. No GATE covers patch-release tagging. No GATE covers "all three plus the PR mergeable" as an atomic condition.

**Proposed requirement family (GATE-10 / GATE-11):**
- **GATE-10** (reconciliation): phase-closeout asserts STATE.md, ROADMAP.md phase-row (percent, status), plan checkboxes, and FORK-DIVERGENCES (if touched) are reconciled in a single commit or rejected.
- **GATE-11** (release boundary): if a phase's branch has merged to main, the patch-release workflow has fired (tag or explicit defer with reason); if not merged within N days, the reconciliation is flagged.

Both belong inside Phase 58 because both are structural failures with recent empirical evidence.

### Finding 3.2 — No Gate Owns Evidence Preservation for In-Flight Agent Output

**Evidence.** `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving.md`, occurrence_count 2 (quote from Agent-2): "The delete-before-archive response may reflect the absence of a formal 'recover killed agent' path in the workflow." No GATE covers this.

This is either a **GATE-12** ("partial or failed agent output is archived, not rm'd, before retry") or an adjacent WF-02 child requirement. Phase 58 is the natural home because the failure is discretionary (agent chooses `rm`) where the fix is structural (workflow enforces `mv` to archive).

### Finding 3.3 — No Gate Covers Delegation-Arg Drift Under Auto-Compact

**Evidence.** `sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md`, occurrence_count 3. Codex auto-compact can silently compress workflow-execution context, losing delegation conventions. No GATE restates workflow-critical delegation conventions at each spawn.

This ties into GATE-05 ("sensor model selection echoed") but is broader: any delegation whose arguments are context-dependent will drift under compaction. The requirement would read "every delegation workflow re-asserts its dispatch contract (agent type, model, reasoning effort, required inputs) in the spawn block itself, not via reference to earlier workflow text." Phase 58 is the right place because the pattern is structural (compaction) not content-specific.

### Finding 3.4 — No Gate Enforces Cross-Dispatch Model-Scope Isolation

**Evidence.** `sig-2026-04-10-researcher-model-override-leak-third-occurrence.md`, three occurrences over a month. Model overrides intended for sensor agents bleed into researcher agents. GATE-05 names "all delegation workflows" but its motivation and implementation bias toward sensor-only.

Either widen GATE-05 (preferred) or add GATE-13 "dispatch-model scope isolation — a `use X for Y` memory or config override applies to agent type Y only, not to subsequent dispatches." The MEMORY.md already has `feedback_model_override_scope.md` as a written-down preference (cited in memory index); no structural enforcement exists.

### Finding 3.5 — No Gate Addresses CI Status Before Phase Advancement Beyond PR Creation

**Evidence.** `sig-2026-04-10-ci-branch-protection-bypass-recurrence.md`, occurrence_count 3, severity critical. This is the same pattern as the original 2026-03-06 signal but for post-v1.17 commits. "GATE-01 covers PR creation; it does not cover post-PR direct-push or merged-without-green-CI." The signal documents that main branch direct pushes bypassing CI recurred despite earlier remediation.

A gate is needed (could fold into GATE-01 but deserves its own line for testability): **no direct commits to main by a workflow or skill** — verified by either a pre-push hook (Claude Code) or an installer-wired `HUSKY=false` guard check. The session-audit R-pattern that corresponds (original R6 "encode PR workflow in offer_next") is only half-addressed.

### Finding 3.6 — No Gate Covers Release Workflow Completeness at Milestone Close

**Evidence.** `sig-2026-03-30-release-workflow-forgotten-in-milestone-completion.md` (quoted in Agent-2's output §Item 3): "During v1.18 milestone completion, three deployment steps were missed: version bump (`package.json` still at `1.17.5`)... nobody remembered [the publish.yml] workflow existed." This is a `complete-milestone` failure mode, not a per-phase one — but it is part of the same closeout family as §3.1. No GATE addresses it. Candidate requirement: release-boundary assertion that tag, GitHub Release, npm publish, and `package.json` version all agree before milestone marked complete. This is `/gsdr:release` territory but a gate belongs in 58 to keep the milestone workflow honest.

### Finding 3.7 — No Gate Covers Workflow Drift Between Source and Installed Mirror

**Evidence.** CLAUDE.md (`get-shit-done-reflect/CLAUDE.md:15-27`, inline in this audit's context) documents the dual-directory hazard: "v1.15 Phase 22 (agent protocol extraction) edited `.claude/agents/` instead of `agents/`... This went undetected for 23 days." No GATE structurally prevents this. The installer copies source→`.claude/`, but nothing asserts at CI/release that the two mirrors are byte-identical post-install. This is a candidate requirement (could sit in SENS-06's family but the ownership currently wanders).

---

## 4. Findings — Prerequisite Inversions (I2: follow the evidence)

The predecessor audit `v1.20-roadmap-restructure-review-opus.md` (2026-04-07) introduced the term "prerequisite inversion" for work that Phase 58 claims as success criterion but that lives downstream. Per chain integrity (composed obligations), I re-verified its core claims before incorporating them:

### 4.1 — Phase 55.2 Has Remediated Half the Predecessor's Inversions

| Predecessor claim (April 8) | Current state (April 20) |
|---|---|
| `automation.cjs:114-117`: `codex-cli` gets `hasTaskTool = false` | **Remediated.** `automation.cjs:114-130` recognizes `codex-cli` explicitly, sets `hasTaskTool = true`, conditionally detects `codex_hooks` via `.codex/config.toml`. Verified by reading the file. |
| `sensors.cjs:13-25`: `.claude/agents` + `.md` only | **Assumed remediated** per 55.2-CONTEXT.md:37-47 "grounded" decisions. I did not re-read `sensors.cjs` in this audit — chain-integrity note: Phase 55.2 VERIFICATION.md was not opened in this audit. Gap. |
| `init.cjs`: skips `.claude` but not `.codex` | **Assumed remediated** per 55.2-CONTEXT.md:48-50. Not re-verified. |
| `capability-matrix.md` claims hooks=N, agents via AGENTS.md, config=codex.toml | **Remediated.** Current matrix at 195 lines, last updated 2026-04-08 per git log. Agent-1 quoted the updated text. |

**What is NOT remediated and relevant to Phase 58:**
- `signal-detection.md:69-70` still uses `opus-class (claude-opus-*)` / `sonnet-class (claude-sonnet-*)` heuristics (verified by direct grep in this audit). This directly undermines GATE-05 and any measurement that Phase 58 uses to verify gate effectiveness on Codex sessions.
- The 2026-04-08 codex-harness audit's **Finding 5** (Codex signal heuristics are still Claude-model-class) is not addressed by 55.2 and has no GATE in Phase 58 scope. The measurement layer measuring Phase 58 gate effectiveness on Codex will generate false mismatches or miss real ones.

### 4.2 — Remaining Prerequisite Inversions for Phase 58

Per the predecessor audit's own framing (`opus-review.md:197-219`) and post-55.2 state:

**Hard inversions (Phase 58 claims cannot be honest without these):**
1. **SessionStop hook installation.** Required by GATE-06 + GATE-07; not installed on either runtime. Not scoped to any phase. See Finding 2.6.
2. **Role-aware provenance in signals.** Required by GATE-09 verification (the verifier must distinguish planner-miss from executor-miss from verifier-miss from harness-miss when confirming "CONTEXT commitments explicitly deferred"). Phase 57.8 delivers this but has not merged; STATE.md lags; the dependency is technically unbroken but the handoff seam is currently open.
3. **Signal-detection Codex model-effort semantics.** Required by any GATE whose effectiveness is measured via signals on Codex sessions. Not scoped.

**Soft inversions (Phase 58 can ship without these but success claims will be narrower than the text implies):**
4. Ledger tooling for GATE-09. The requirement assumes "implemented_this_phase / explicitly_deferred / rejected_with_reason / left_open_blocking_planning" are a vocabulary. They are a vocabulary only in the deliberation source, not in any CLI/tooling.
5. Per-delegation model echo outside collect-signals. Required by the cross-dispatch leak pattern; GATE-05 claims "all delegation workflows" but only sensor workflows are named.

**Not inversions (predecessor audit was right at the time; remediated):**
- Runtime capability resolver
- Capability-matrix accuracy
- Heuristic fallback to `.codex/config.toml`

---

## 5. Findings — Codex / Cross-Runtime Credibility

The `cross-runtime note` at `REQUIREMENTS.md:10` reads:
> "On Codex CLI (no hook mechanism as of v0.118.0), enforcement degrades to workflow-level checks that depend on agent compliance — the same advisory pattern the audit found unreliable. This is an accepted limitation for v1.20; Codex hook support is tracked as a dependency for full cross-runtime enforcement parity."

Two problems:

**5.1 Factual basis is out of date.** Agent-2's reading of `cross-runtime-parity-research.md:70-80` documents that hooks exist under a `codex_hooks` feature flag at v0.118.0 — the same version the requirement line claims has "no hook mechanism." The research doc was authored during Phase 55.2, after the requirement line was written. Phase 58's own REQUIREMENTS.md note is now falsified by Phase 55.2 research that was produced to inform it. The automation.cjs fix (verified in §4.1) already *uses* this capability.

**5.2 The degradation story is self-defeating.** Accepting "workflow-level checks that depend on agent compliance" as the Codex degradation path is accepting the very pattern the phase proposes to eliminate. For GATE-01, GATE-06, GATE-07 in particular, the Codex degradation path is functionally "the gate does not apply on Codex." The phase should say so explicitly, or it should require installer-wired Codex hooks behind the `codex_hooks` feature flag.

**5.3 Concrete Codex-specific gaps under Phase 58:**
| GATE | Claude Code state | Codex state | Gap |
|---|---|---|---|
| GATE-01 | Advisory (no CI wait) | Advisory (no CI wait) | Blocking mechanism on neither runtime. |
| GATE-02 | Conforming in execute-phase, missing in complete-milestone | Same | Same text, no divergence. |
| GATE-03 | Detection logic absent | Detection logic absent | Same. |
| GATE-04 | Delete-on-read only in resume-project.md | Same | Severity-level framework unshipped on either. |
| GATE-05 | Model resolved but not echoed | Same | Same. |
| GATE-06 | No SessionStop installed | No SessionStop installed (flag-gated possible) | Both runtimes need installer-wired hooks. |
| GATE-07 | No substrate | No substrate | Both runtimes need session-meta + hook. |
| GATE-08 | 279-line workflow, missing agent | 279-line workflow, missing agent | Same. |
| GATE-09 | No ledger tooling | No ledger tooling | Same. |
| XRT-01 | Matrix accurate; CONTEXT degradation sections sparse | Same | Enforcement hook for "before implementation begins" is absent. |

For 7 of 10 requirements, the Codex "degradation" is "same state as Claude Code, not worse." The ones where Codex is genuinely worse (GATE-06, GATE-07) are the two whose Claude Code state is also no substrate at all. This suggests **Phase 58's Codex framing is the wrong level of abstraction**: the gap is not Claude-vs-Codex, it is hook-installer-does-not-wire-the-right-hooks-on-either-runtime.

**Counter-interpretation (I3: competing explanations).** An alternative reading is that Phase 58's framing is correct and my reading over-indexes on the current installer state: if Phase 58 is free to *add* new hook wiring to the installer, then the Claude Code implementation lands naturally and only Codex is a gap. Under this reading, the Codex cross-runtime note is specifically about the residual gap after Phase 58 adds SessionStop on Claude Code. I give this reading roughly equal weight; the evidence does not discriminate. What it changes: the requirement should say explicitly that the installer gains SessionStop wiring as part of Phase 58 scope, which it currently does not.

---

## 6. High-Leverage Enhancements Left on the Table

Structural improvements that would materially strengthen Phase 58, beyond the missing-requirement list in §3.

### 6.1 Make the Gate Pass Condition Measurable via the Existing Measurement Layer

Phase 57.5–57.7 delivered a measurement substrate that can produce `agent_performance_by_role_model_profile` and `phase_57_5_live_registry_query` reports (per Phase 60.1 requirement text, ROADMAP.md:348-354). Phase 58 does not use this to define "gate fires correctly." A gate with no observable fire event is an advisory gate with prose decoration.

**Proposal:** Add a cross-cutting success criterion to Phase 58: "every GATE emits a structural event (hook log entry, workflow-step stdout marker, or session-meta field) that downstream measurement can count." This is trivially implementable (one-line log per gate trip) and lets GATE-09's verifier clause ("verification confirms CONTEXT commitments were explicitly deferred rather than silently disappearing") become a real query, not an aspiration.

### 6.2 Define the GATE-09 Ledger as a Data Structure, Not a Narrative

The four states (`implemented_this_phase` / `explicitly_deferred` / `rejected_with_reason` / `left_open_blocking_planning`) can be a YAML block inside PHASE-SUMMARY.md or a single `.planning/phases/NN-LEDGER.md` file. Naming the file and schema in the requirement turns GATE-09 from an advisory commitment into a checkable artifact. Without it, the plan will produce prose and declare the ledger shipped.

Concrete proposal: add GATE-09 success criterion "A file `NN-LEDGER.md` exists at phase close; it is YAML frontmatter with required fields `context_claim`, `disposition`, `target_phase_if_deferred`, `narrowing_provenance`; verification fails if any CONTEXT claim tagged `load-bearing` has no row."

### 6.3 Install a SessionStop Hook in Phase 58 Explicitly

As §2.6 and §4.2 note, GATE-06 and GATE-07 bottom out on a hook that the installer does not write. The enhancement is small: add to Phase 58 a child requirement "installer writes SessionStop on Claude Code; writes Codex hooks.json (guarded by `codex_hooks` flag) equivalent." This is a 1–2 plan change in `bin/install.js` plus a test; it unblocks two GATEs.

### 6.4 Adopt a "CI-as-structural-gate" Pattern Instead of Workflow Gates

Several GATEs (especially 01, 02, 03) could be enforced at CI with ~10 lines of GitHub Actions rather than workflow-file mechanics:

- GATE-02: `grep -r "gh pr merge.*--squash" || grep -L "gh pr merge.*--merge" <paths>` → fail if squash or if `gh pr merge` without `--merge`.
- GATE-03: `gh pr checks --required --watch` on PR creation.
- GATE-01: branch protection rule enforces `Test` check; CI workflow has this already per `sig-2026-04-10-phase-574-pr45-ci-clean-mergeable-baseline.md`. The gate is configuration-maintenance, not new workflow work.

This reframing would make many GATE-requirements into "verified by CI" rather than "verified by workflow text," which is structurally stronger because CI is not bypassable via `/clear` or context loss.

### 6.5 Add a Self-Audit Gate (the Gate About Gates)

GATE-09 verifies CONTEXT-claim disposition but does not verify that the phase's own GATEs fired during execution. A meta-gate: the phase's own workflow emits a "GATE-NN fired at step X" trace, and phase verification asserts every GATE-NN appears at least once in the trace for the phase that introduced the gate. This catches the "gate installed but not wired" failure mode that §2.6 and §2.7 describe.

### 6.6 Rename the Pattern Catalog Before Phase 58 Plans

Per Agent-2: the session-log-audit opus-synthesis.md originally numbered patterns R1–R23; REQUIREMENTS.md rebinds GATE motivations onto R01, R02, R04, R08, R09, R10, R12 which do not correspond to the original R1..R23 numbering. I re-verified this by checking the opus-synthesis.md structure (grep returned 4 R-pattern headings — file is structured differently from expected; I did not verify all 23). The relevant point for Phase 58: the motivation citations in REQUIREMENTS.md point to an R-pattern numbering that is a parallel re-indexing, not the original document's numbering, so reading the motivation requires knowing which vocabulary is being used. This should be reconciled before Phase 58 planning — either keep the original R1..R23 labels or explicitly note "R## in REQUIREMENTS refers to the fork-specific re-labeling." Leaving it ambiguous costs planner context.

---

## 7. What This Audit Thinks Phase 58 Is Still Not Seeing

Even if Phase 58 ships exactly as currently written, these remain invisible:

### 7.1 The Closeout Seam Cannot Be Named from Inside the Phase

The two most recent signals (§3.1) describe a boundary — "phase implementation verified" vs "project operationally advanced" — that no phase has owned. Phase 58 can add GATE-10/GATE-11 (Findings 3.1) but the seam is between phase-close and milestone-close, which is architecturally a different level of the workflow from GATE-01..08. If Phase 58 treats them as "more gates," it will miss that the problem is **an unowned workflow-boundary, not a missing rule**.

### 7.2 Advisory-by-Composition

Many GATEs are structural only if every workflow that could bypass them also enforces them. GATE-02 is structural in `execute-phase.md` but the `gsd-ship` skill (not audited here — gap) and `complete-milestone.md` are not audited for the same. A gate that fires in one workflow but not in three parallel workflows is advisory by composition. Phase 58 does not treat this as a scope question; it treats each gate as a single file edit.

### 7.3 The GATE-09 Ledger Itself Can Be Narrowed

GATE-09 is the meta-gate against scope narrowing. But GATE-09's own requirement text is narrowable (Finding 2.9 — it collapses 4 mechanisms). If the GATE-09 plan implements the ledger and defers the verifier contract, GATE-09 has suffered the same failure it is supposed to prevent. This is a known-unknown to the roadmap (the "meta-fix" language admits it) but is not reflected in the requirement specificity.

### 7.4 Codex Hooks Timing

The `codex_hooks` feature flag is "under development" at v0.118.0. Phase 58 assumes the feature is either stable or accepts degradation. If the feature flag moves to stable during v1.20, Phase 58's Codex story changes mid-milestone. No gate covers "react to Codex CLI capability changes during a milestone." This is a capability-matrix drift question that spans phases.

### 7.5 The Silent-Recurrence Pattern

Phase 58's motivations all cite "occurrence_count ≥ 3." None of the GATEs fire on re-occurrence signals after phase close. If GATE-01 ships and the offer-next-skip pattern re-occurs six months later, nothing in Phase 58 structurally elevates the recurrence. This is R18 (signal-to-workflow feedback loop) territory, unscoped.

### 7.6 Silence on Quick Tasks as First-Class Citizens

GATE-03 treats quick tasks as a special case of code change detection. But quick tasks now have their own directory structure (`.planning/quick/`), their own skill, and write into REQUIREMENTS.md / ROADMAP.md via `gsdr:quick` paths. Quick `260419-wjj` (2026-04-20, yesterday) *patched REQUIREMENTS.md* as a quick task. "Docs-only" is true in a narrow sense but these are project-governance documents. GATE-03 should decide whether ROADMAP.md/REQUIREMENTS.md are "docs" or "runtime." Current text is ambiguous.

---

## 8. What Should Stay Downstream (Not Pulled Into 58)

These would materially expand Phase 58 but are genuinely better handled later:

| Item | Why downstream |
|---|---|
| **Full Codex hook installer parity** beyond SessionStop | Depends on `codex_hooks` flag shifting to stable; track via XRT-01 dependency note, not Phase 58 scope. |
| **Log sensor incident-detection wiring** for GATE-07 | Sensors + measurement integration is Phase 60 + 60.1. Phase 58 GATE-07 should depend on them explicitly, not re-implement. |
| **Full KB query surface for GATE-09 historical analysis** | Phase 59 (KB query, FTS5) is the natural home. Phase 58 ledger writes; Phase 59 reads. |
| **Cross-model review of GATE designs** | SPIKE-01 / Phase 61 (spike methodology overhaul) is the right methodology home. Phase 58 should note "GATE-01..09 design not yet cross-model reviewed" as an open risk and defer the review to SPIKE-01's first application. |
| **Generalizing dispatch scope isolation across all agent types** | AUT-02 (v1.21) territory. Phase 58 adds a gate; AUT-02 addresses the underlying dispatch-args architecture. |
| **Signal-to-workflow auto-elevation on recurrence (R18)** | Worth a standalone requirement (REC-01 or similar) but requires the measurement→signal→workflow feedback loop Phase 60.1 introduces. Not shippable within Phase 58's time budget. |

---

## 9. Concrete Recommendation

Of the four options in the task spec, the best match is: **expand Phase 58 materially AND split out one prerequisite**.

### 9.1 Split: Insert Phase 57.9 (Installer Hook Surface)

A narrow inserted phase `57.9` whose single job is: "installer writes SessionStop on Claude Code, writes `.codex/hooks.json` for `codex_hooks=true` environments, and exposes a canonical session-meta error-rate field." This unblocks GATE-06, GATE-07, and the GATE-09 "verification" clause. Scope: 1–2 plans, entirely inside `bin/install.js` + one small schema file. This is the same pattern Phase 55.2 used (narrow substrate phase before a claim-heavy phase).

If splitting is too costly, the alternative is to add it as **Plan 01 of Phase 58**, with the remaining GATEs as Plans 02+. That is structurally the same but bundles differently.

### 9.2 Expand Phase 58 to Include

- **GATE-10** phase-closeout reconciliation (§3.1)
- **GATE-11** release-boundary assertion (§3.1, §3.6)
- **GATE-12** evidence preservation / no rm on partial output (§3.2)
- **GATE-13** dispatch-arg restatement under compaction (§3.3) — may fold into GATE-05 expansion
- **GATE-14** no-direct-push enforcement (§3.5) — may fold into GATE-01 expansion
- **GATE-15** source↔installed mirror parity at CI (§3.7) — may fold into SENS-06
- **Split GATE-04** into 04a/04b/04c (§2.4)
- **Split GATE-08** into 08.1–08.5 (§2.8)
- **Split GATE-09** into 09a (ledger) / 09b (planning gate) / 09c (narrowing-decision provenance) / 09d (verifier contract) (§2.9)
- **Rewrite GATE-05** with enumerated delegation sites, not "all delegation workflows" (§2.5)
- **Rewrite XRT-01** with a structural check point (§2.10)
- Add cross-cutting success criterion "every GATE emits a structural event" (§6.1)
- Add meta-gate "GATE-99: every Phase 58 GATE fires at least once in its own phase trace" (§6.5)

### 9.3 Reframe Phase 58's Goal

Current: "The 8 most-recurred advisory failure patterns are replaced with structural enforcement..."
Proposed: "The K most-recurred advisory failure patterns (where K ≥ 12, enumerated below) are replaced with structural enforcement that (a) emits a measurable fire-event, (b) applies across all workflows that could bypass them, (c) has installed substrate (hook, CI rule, or exit-coded workflow step) before phase verification asserts completion, and (d) treats Codex as a first-class runtime where capability exists and as an explicitly-waived surface where it does not."

This reframing makes the commitments testable, addresses framing gap §7.2 (advisory by composition), addresses §7.1 (the closeout seam), and forces Codex handling to be declared per-gate rather than in a blanket cross-runtime note.

### 9.4 Acceptance Test for Phase 58 Planning

Before Phase 58 advances from discuss-phase to plan-phase, the following must be true:

1. Every GATE has either a named substrate (hook, CI rule, exit-coded workflow step) or a named substrate-dependency (pointing to 57.9 / 57.8 / 60.1).
2. Phase 57.8 has merged to main, STATE.md reflects that, and there is no open closeout drift for 57.8 (verified by re-reading `.planning/STATE.md:6` and confirming PR is merged).
3. The GATE-09 ledger schema is a named file or frontmatter block, not a prose convention.
4. Each GATE carries at least one explicit Codex behavior declaration (applies / does-not-apply-with-reason / applies-via-workflow-step).

None of these are expensive. All are concrete.

---

## 10. Chain Integrity Against Predecessor Audits

Per the cross-cutting obligation on chain integrity: every finding that relied on a predecessor claim was re-verified.

**v1.20-roadmap-restructure-review-opus.md (2026-04-07).**
- "Prerequisite inversion" framing: re-verified as meaningful in §4.2, with updated list post-55.2. **Accepted with updates.**
- `automation.cjs:114-117` Codex-caps claim: **re-verified — now remediated.** The cited lines are no longer the blocking code. §4.1.
- `capability-matrix.md` factual errors: **re-verified — now remediated.** §4.1.
- `signal-detection.md:69-70` opus/sonnet-class: **re-verified — STILL PRESENT.** §4.1, §5.
- "Insert Phase 55.2" recommendation: **accepted and implemented by the project.** Phase 55.2 shipped.

**codex-harness-audit-gpt54-2026-04-08.md.**
- Finding 1 (runtime capability resolution): **remediated** per §4.1 direct re-read.
- Finding 2 (installed-agent verification): **NOT re-verified in this audit** — flagged as chain-integrity gap. I did not re-read `core.cjs:1274-1297` or `verify.cjs:702-717`. Treat Finding 2's continued relevance as unknown.
- Finding 3 (sensor introspection): **assumed remediated** per 55.2-CONTEXT.md "grounded" decisions. Not independently re-verified by reading `sensors.cjs`. Chain-integrity gap.
- Finding 4 (init.cjs brownfield): **assumed remediated** per 55.2-CONTEXT.md. Not re-verified. Chain-integrity gap.
- Finding 5 (signal heuristics): **re-verified — STILL PRESENT.**
- Sequencing claim ("cross-runtime adaptation fixes are prerequisites for credible Phase 58"): **accepted — remains structurally true for the fixes Phase 55.2 did not cover (Finding 5, SessionStop, ledger tooling).**

**phase-57-vision-drop-investigation sonnet-output.md.**
- "Scope-narrowing cascade": **quoted and relied on.** Re-read quote at line 126-136 before citing. Accepted.

**signal-provenance-audit-output.md.**
- Findings 1–4 summarized by Agent-2. I read only Agent-2's summary, not the audit output directly in this session. Chain-integrity status: **cited via secondary source.** For the purposes of §2.9 (GATE-09's role-aware provenance dependency), I treat the claim that Phase 57.8 is an epistemic prerequisite for GATE-09 as primary (ROADMAP.md:34 directly asserts it; no predecessor dependency).

**Chain gaps declared.** Findings 2–4 of codex-harness-audit not re-verified; sensors.cjs and init.cjs assumed-remediated. If Phase 58 planning needs them, re-verify before acting.

---

## 11. Competing Interpretations (I3)

For the headline findings, at least two readings:

**On Finding 3.1 (closeout seam as missing gate).** Reading A: Phase 58 should add GATE-10/GATE-11 because the empirical evidence is overwhelming (two signals in 72 hours). Reading B: the closeout seam is fundamentally about workflow ownership (who drives `/gsdr:ship`, who owns the STATE.md update), and adding a gate is the wrong level of intervention — the right move is an orchestrator-level command renaming/re-wiring. I lean toward A because B requires a bigger change and the gate is a cheap, local fix; but B is not wrong.

**On Finding 2.6 (SessionStop not installed).** Reading A: Phase 58 inherits an installer bug. Reading B: Phase 58 is precisely where the installer gets taught to install SessionStop; this is not a bug, it is the scope. I lean toward B (see §9.1) but flag that Phase 58 would need to name this explicitly to preempt the narrowing-cascade.

**On §5 (Codex credibility).** Reading A: Phase 58's Codex story is advisory theater (the harsher reading). Reading B: the story is honest about degradation but the substrate changed between the requirement being written and now, and a one-line update reconciles it. The residual question — whether the installer will wire flag-gated Codex hooks in Phase 58 — distinguishes them. Leaving it open in the requirement makes either reading possible.

---

## 12. Rule 4 — What the Ground Rules Didn't Prepare Me For

The ground rules did not anticipate that Phase 58 **has no phase directory yet**. There is no CONTEXT.md to read for "decisions," no RESEARCH.md, no PLAN.md, no VERIFICATION.md. Every audit convention that treats the phase-internal artifacts as the primary object of critique does not apply. What I substituted: reading the declarative surface as primary, and treating recent signal-file evidence as the "delivered" side of the discrepancy comparison — not code that implements the phase (which does not exist) but current substrate relative to what the declarative surface commits to.

This has a consequence I want to surface: **the audit cannot tell whether Phase 58 will solve its problems, only whether its current declarative surface is strong enough to point planning in the right direction**. A requirements_review can find the gaps; it cannot tell you whether the plan that eventually fills them will be adequate. For that, a plan_review audit would be needed later, after /gsdr:discuss-phase 58 and /gsdr:plan-phase 58 have run.

Second unanticipated element: the "dispatch hygiene" obligation for cross_model delegation tensions against the fact that I am the cross-model auditor (claude-opus-4-7 per the task spec) but I am also operating inside the same vendor family as claude-sonnet-4-6 that authored most of the predecessor audits. I did not treat this as a blocking tension — cross_model in this repo's vocabulary means different model, not different vendor — but I note that the genuinely independent voice in this chain is the predecessor gpt-5.4 audit (2026-04-08), and its findings were the ones most likely to be stale-yet-structurally-important.

---

## 13. Rule 5 — Frame-Reflexivity

### 13.1 If this audit were process_review instead of requirements_review

The process_review frame would have asked: **how did Phase 58's declarative surface come to be written the way it is?** It would have looked at the 2026-04-16 signal-provenance-audit, the 2026-04-15 measurement-signal-inventory, the deliberation that produced GATE-09 (measurement-infrastructure-epistemic-foundations.md §7.4), and the sequence by which GATE-01..08 + GATE-09 got bundled together. Under a process frame, the prerequisite inversions (§4.2) would read as a diagnosis of how the declarative work happens — roadmap text gets written in one phase, predecessor audits update substrate in another, and the requirement text does not get re-verified post-substrate-fix (see REQUIREMENTS.md:10 factual staleness, §5.1).

Concrete finding the process frame would produce and this audit does not: **the motivation lines in REQUIREMENTS.md are one-time writes. They do not track whether the cited signals have since been superseded, whether occurrence_counts have updated, or whether other signals were logged between requirement-writing and phase-planning.** That is a process gap; my frame makes it invisible because I treat the requirement text as the object, not the process that produces and maintains it.

### 13.2 If this audit were `standard` instead of `investigatory`

The standard frame would have accepted the dependency story as declared (57.7 → 58, 57.8 → GATE-09, 55.2 as already-done substrate) and checked the requirements for surface quality. It would not have asked whether 57.8 had actually merged (it has not — STATE.md:6 verified). It would not have re-verified `automation.cjs:114-117` post-55.2. It would have trusted ROADMAP.md's sequencing.

What standard would have held open that I closed: §4.1's remediated-by-55.2 checklist. I treated those as settled; a standard audit would have checked whether 55.2's own verification held (I did not read 55.2-VERIFICATION.md beyond a file-listing; chain gap declared in §10).

What standard would have investigated that I accepted: I accepted the claim that the 279-line fork discuss-phase-assumptions.md is adequately characterized by Agent-1 and Agent-2's grep-driven reads. A standard audit would have read the file. I did not. If its 279 lines already include mode-aware gating that the grep missed, Finding 2.8 is wrong.

### 13.3 What the Current Classification Shapes

**Shapes me to notice:** missing requirements, prerequisite inversions, requirement-text specificity, interaction effects between gates. Because `investigatory` invites following evidence, I did ask "what no-one owns" (§3, §7.1); because `requirements_review` centers declarative text, I spent more time on REQUIREMENTS.md than on workflow files.

**Shapes me not to notice:** how the requirements interact with the harness's own context window. A phase with 12+ gates may overwhelm discuss-phase's context budget; I did not address that. Also: I did not assess whether GATE-01 and GATE-10 together conflict (both act on phase-advancement moments — is there a precedence order?). Requirements_review treats each requirement as an independent surface; the composition risk is invisible to me.

**Concrete example.** I noticed that GATE-04 collapses three mechanisms (Finding 2.4); I did not notice that GATE-05's "all delegation workflows" clause might conflict with GATE-08's discuss-phase three-mode switching if both are implemented naively. A process_review or interaction audit would have caught this; mine does not.

---

## 14. Framework Invisibility — What This Audit Cannot See

A concrete finding this audit could not produce no matter how rigorous: **whether the GATE requirements, once implemented, will change agent behavior**. The audit evaluates requirement quality, substrate feasibility, and motivation coverage. It cannot evaluate whether a gate that fires correctly at the workflow level will actually alter the agent's choice space — agents can in principle read the workflow and internalize its enforcement, but they can also pattern-match past the structural check. That second-order question is unmeasurable from the declarative surface alone; it needs a live behavioral trial post-Phase 58, which belongs to Phase 60.1's intervention-outcome loop.

A second unavailable finding: **whether the audit framework itself is now structurally over-weighting "structural vs advisory" as the live dichotomy**. If the real live failure mode is actually "workflow-enforced but agent doesn't read the workflow," neither my framework nor the phase's framework would surface that. The framework and the phase share a premise (structural > advisory) that might itself be partly wrong. I cannot test this premise from inside a requirements-review, and the tools the audit uses (grep, file reading, predecessor-audit quotes) are precisely the tools that encode that premise.

A third: **the interaction between the audit convention "artifacts outside formal workflows must explain WHY they deviate" and the fact that this audit itself exists outside Phase 58's own workflow, commenting on it pre-plan.** Per the user's memory (feedback_deviation_testimony), this audit should explain its own deviation. It does: the phase has no own-workflow yet, and the `gsdr:audit` dispatch is the designated path for pre-plan critique. But I did not formalize that testimony anywhere except this paragraph. That is a framework gap hiding in plain sight.

---

## 15. Explicit Unknowns (I2 — edge of investigation)

- Upstream discuss-phase-assumptions.md current line count (relied on REQUIREMENTS.md's 671 claim without fetching). Confidence: medium.
- `sensors.cjs` and `init.cjs` current state post-55.2 (relied on 55.2-CONTEXT.md "grounded" markers, did not re-read code). Confidence: medium.
- 55.2-VERIFICATION.md outcomes (did not open). Confidence: low.
- Whether `complete-milestone.md`'s offer_next contains or omits an explicit `gh pr merge --merge` invocation under its `<step>` body (confirmed step exists at line 721; did not re-read body in full). Confidence: medium.
- Whether Phase 57.8 has merged to main by the time this audit is read (at audit time: not merged; STATE.md lags).
- Signal-provenance-audit findings: cited via Agent-2's secondary summary, not re-read in primary.

---

## 16. Summary (one paragraph)

Phase 58's declarative surface is a defensible structural aspiration with nine gate requirements and ten success criteria, but it is load-bearing in ways its text does not own: GATE-06 and GATE-07 require a SessionStop hook the installer does not write, GATE-05's "all delegation workflows" will narrow in planning, GATE-09 collapses four mechanisms into one requirement, and the Codex cross-runtime note (`REQUIREMENTS.md:10`) is factually stale post-55.2. At least five live failure patterns (phase-closeout reconciliation, release-boundary completeness, partial-output archive, compaction-driven delegation drift, direct-push CI bypass) have occurrence_counts ≥ 2–6 but no GATE. One motivating pattern for GATE-03 recurred on 2026-04-19 — 24 hours before this audit — while the gate was pending. Recommended action: (a) insert a narrow substrate phase 57.9 or a substrate-first Plan 01 that wires SessionStop and codex_hooks into the installer; (b) expand Phase 58 with at least GATE-10..15 and split GATE-04, GATE-08, GATE-09; (c) reframe the goal to require every gate emit a measurable fire-event and declare per-gate Codex behavior; (d) block plan-phase entry until Phase 57.8 has actually merged and STATE.md reconciles, closing the open closeout seam the audit has just exemplified.

---

*Audit authored by: claude-opus-4-7 (1M context), dispatched via cross-vendor audit path. Spawned two parallel Explore (sonnet) subagents for substrate ground-truthing. Primary file reads: ROADMAP.md:33-39,116-446; REQUIREMENTS.md:10,19,180-206,360,433-489; STATE.md:1-60; execute-phase.md:780-824; automation.cjs:107-157; .claude/settings.json:1-54; signal-detection.md:67-76; sig-2026-04-20-phase-closeout-planning-state-release-lag.md:1-122; sig-2026-04-17-phase-closeout-left-state-pr-release-pending.md (via Agent-2 quote); v1.20-roadmap-restructure-review-opus.md (full); codex-harness-audit-gpt54-2026-04-08.md (full); 55.2-CONTEXT.md:1-50. Chain gaps declared in §10.*
