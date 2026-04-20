# Phase 58: Structural Enforcement Gates - Context

**Gathered:** 2026-04-20
**Status:** Ready for planning (gated on 57.9 prerequisite completion per §Dependencies)
**Mode:** Exploratory --auto — preserving uncertainty for researcher; auto-progression by type rules per `references/claim-types.md`

<domain>
## Phase Boundary

Phase 58 replaces advisory workflow controls with **structural enforcement** for high-recurrence failure patterns, and ships the **GATE-09 scope-translation ledger** as meta-fix for the Phase 57 scope-narrowing cascade.

Every shipped gate must satisfy four cross-cutting properties (audit §9.3):
1. **Named substrate** (hook / CI rule / exit-coded workflow step) or named substrate-dependency.
2. **Measurable fire-event** that downstream measurement can count.
3. **Applies across every workflow that could bypass it** (not advisory-by-composition).
4. **Per-gate Codex behavior declaration** (applies / does-not-apply-with-reason / applies-via-workflow-step).

**Requirements in scope:** GATE-01, GATE-02, GATE-03, GATE-04a, GATE-04b, GATE-04c, GATE-05, GATE-06, GATE-07, GATE-08a, GATE-08b, GATE-08c, GATE-08d, GATE-08e, GATE-09a, GATE-09b, GATE-09c, GATE-09d, GATE-10, GATE-11, GATE-12, GATE-13, GATE-14, GATE-15, XRT-01 (25 requirements total).

**Explicitly NOT in scope** (see `<deferred>`): Codex hook parity beyond SessionStop, live log-sensor incident wiring for GATE-07, full KB query for GATE-09 historical analysis, cross-model review of the gate designs themselves, generalized dispatch-scope isolation across all agent types, and signal→workflow auto-elevation on recurrence.

</domain>

<working_model>
## Working Model & Assumptions

### 1. Cross-cutting gate substrate

**Current state:** `.claude/settings.json` has `SessionStart` hooks + one `PostToolUse` hook; no `SessionStop`, no `PreToolUse` (audit §1). The runtime enforcement surface today is mostly advisory workflow prose with interactive prompts (audit Findings 2.1, 2.3).

- [governing:reasoned] Structural enforcement means a mechanism that fires **without the agent needing to remember to invoke it** — a hook, an installer-wired workflow step, an exit-coded CLI subcommand, or a CI rule. Prose requests do not count.
- [decided:cited] Every GATE in this phase must satisfy the four-property contract in `<domain>`; a gate with no named substrate or no measurable fire-event is not structural, regardless of what the workflow text says. (Source: audit §9.3 + ROADMAP.md:316-328 Success Criterion 1.)
- [decided:cited] Fire-event surface: each gate emits either (a) a hook log entry, (b) a workflow-step stdout marker parseable by measurement, or (c) a `session-meta` / installed-KB field consumable by the Phase 57.5 extractor registry. (Source: audit §6.1.)

### 2. PR / CI / branch gates (GATE-01, GATE-02, GATE-03, GATE-14)

**Current state:** `offer_next` asks "Create PR? [y/n]" / "Merge now? [y/n]" with no CI-wait and no exit-non-zero on failure; the advancement branch fires unconditionally (audit Finding 2.1). Exactly one conforming `gh pr merge ... --merge` invocation exists (`get-shit-done/workflows/execute-phase.md:793`); `complete-milestone.md` and `gsd-ship` surfaces are un-audited (audit Finding 2.2, §7.2). Quick task has no file-path or git-diff discriminator for runtime-facing changes (audit Finding 2.3); pattern recurred 2026-04-19 in quick `260419-6uf`.

- [assumed:reasoned] GATE-01's blocking substrate is best implemented as a **CI rule** (branch protection + required status check) rather than as a workflow-file mechanic — CI is not bypassable via `/clear` or context loss, and branch protection already exists per `sig-2026-04-10-phase-574-pr45-ci-clean-mergeable-baseline.md`. (Source: audit §6.4.) Research must confirm the fit and examine the alternate of a pre-push hook.
- [decided:cited] GATE-02 must enumerate every workflow / skill / agent surface that invokes `gh pr merge` — not "all merges" in prose. Known surfaces: `execute-phase.md`, `complete-milestone.md`, `gsd-ship` skill, any release workflow. CI verifies grep-level conformance. (Source: audit Finding 2.2 + §7.2 "advisory by composition.")
- [decided:cited] GATE-03 ships with an **explicit detection rule**, not the word "detects". Three candidate rules named in the audit: (a) glob-based (`.md`-only → docs), (b) git-diff-based (touched paths in `get-shit-done/bin/`, `agents/`, `commands/`, `.claude/hooks/`, installer, workflows, or planning-authority files → runtime), (c) installer-manifest-based cross-check. (Source: audit Finding 2.3.)
- [open] Which of the three GATE-03 detection rules to ship — or whether to compose them (e.g., manifest primary, diff fallback). See Q1.
- [decided:reasoned] GATE-03 classifies `ROADMAP.md` and `REQUIREMENTS.md` as **runtime-adjacent** (planning-authority files), not as pure prose docs — the `260419-wjj` quick task on 2026-04-20 patched REQUIREMENTS.md and is precisely the ambiguity audit §7.6 flags. Pure-prose direct-to-main is reserved for comments, README updates, non-authoritative docs.
- [decided:cited] GATE-14 (no direct pushes to main for gated work) folds into GATE-01's CI enforcement; implemented via branch protection + optional pre-push hook, not a duplicate workflow step. (Source: audit Finding 3.5 + §9.2.)

### 3. `.continue-here` and anti-pattern severity (GATE-04a / 04b / 04c)

**Current state:** `resume-project.md:127-135` uses `rm -f` consume-on-read, no archive and no staleness check (audit Finding 2.4). Upstream's blocking / advisory severity framework is not adopted.

- [decided:cited] GATE-04a ships **consumed-on-read archival** — `.continue-here` moves to a dated archive path (e.g., `.planning/handoff/archive/YYYYMMDD-HHMMSS.continue-here`) rather than being deleted. Reversible, audit-trail-preserving. (Source: audit Finding 2.4 split recommendation + signal `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving.md`.)
- [decided:cited] GATE-04b ships **hard-stop staleness** — if `.continue-here` predates the last session's STATE.md `last_updated` or the most recent mainline commit touching STATE.md, the workflow halts and forces explicit triage. Not advisory. (Source: audit Finding 2.4; REQUIREMENTS.md:226.)
- [decided:cited] GATE-04c adopts upstream's blocking / advisory severity framework for anti-pattern checks, with **mandatory understanding checks** for blocking-severity items (i.e., the user must echo back the anti-pattern name, not just press enter). (Source: REQUIREMENTS.md:228, audit Finding 2.4 split.)

### 4. Delegation hygiene (GATE-05, GATE-13)

**Current state:** Sensor dispatch in `collect-signals.md:249-251` does not echo model to user before spawn loop (audit §1). Researcher-model-override leak signal `sig-2026-04-10-researcher-model-override-leak-third-occurrence.md` has three occurrences over a month. Codex auto-compact can silently drop workflow context (signal `sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md`, 3 occurrences).

- [decided:cited] GATE-05 enumerates the named delegation sites — `collect-signals.md`, `gsdr-phase-researcher` dispatch sites, `plan-phase.md`, `discuss-phase.md`, `audit.md`, and any other spawned batch workflows. "All delegation workflows" as prose is rejected per audit Finding 2.5. (Source: REQUIREMENTS.md:230.)
- [decided:cited] GATE-13 owns the compaction-resilience property: every delegation spawn block **restates its full dispatch contract** (agent type, model, reasoning effort, required inputs, output path) inline at the spawn site, not by reference to earlier workflow text. (Source: audit Finding 3.3 + REQUIREMENTS.md:260.)
- [assumed:reasoned] GATE-05 and GATE-13 are related but distinct: GATE-05 is about *echoing* the selected values so misconfiguration is visible; GATE-13 is about *restating the contract* so compaction cannot silently change dispatch semantics. They can be co-implemented in the same workflow edits but verified separately.

### 5. Hook-dependent gates (GATE-06, GATE-07) — **prerequisite-gated on Phase 57.9**

**Current state:** No `SessionStop` entry in `.claude/settings.json`; `bin/install.js:2094` enumerates other hook lifecycle events but not `SessionStop` for installation; Codex hook installation is unconditionally skipped at `bin/install.js:2846-2856` (audit Finding 2.6). Session-level error-rate / direction-change / destructive-event markers have zero source hits (audit Finding 2.7).

- [projected:reasoned] Phase 57.9 (Hook & Closeout Substrate, inserted per ROADMAP.md:141-150) is the **prerequisite phase** for GATE-06 and GATE-07; Phase 58 depends on 57.9 delivering: (a) installer-wired `SessionStop` on Claude Code, (b) Codex hook surface under `codex_hooks` flag with explicit waiver path when unavailable, (c) session-level canonical markers / counters for postlude-fired and incident conditions. (Source: ROADMAP.md:317, Finding 2.6, Finding 2.7, audit §9.1.)
- [decided:cited] Phase 58 does **not** re-do the 57.9 work; it consumes the installed hook surface and the canonical markers. If 57.9 ships the surface as "not_available" on Codex, GATE-06/07 declare that as the Codex behavior explicitly — not as silent degradation. (Source: audit §5 + XRT-01.)
- [assumed:reasoned] If Phase 57.9 is not yet complete at Phase 58 plan-phase entry, the Phase 58 plan cannot honestly claim GATE-06 / GATE-07 completion. See Acceptance Test AT-1.

### 6. Discuss-phase richer mode adoption (GATE-08a / 08b / 08c / 08d / 08e)

**Current state:** `discuss-phase-assumptions.md` is 279 lines on both source and installed mirrors; no `gsd-assumptions-analyzer` agent exists; `docs/workflow-discuss-mode.md` does not exist; no mode-aware gate in `plan-phase.md` or `progress.md` (audit Finding 2.8). Upstream's claimed 671-line version was not re-fetched in the audit — the line-count gap is medium-confidence.

- [decided:cited] GATE-08 splits into five enumerated sub-requirements 08a–08e (verify current-state, build analyzer agent, author mode docs, wire downstream gates, adopt richer version with explicit narrowing rationale if narrowed). (Source: audit Finding 2.8 + REQUIREMENTS.md:236-244.)
- [assumed:reasoned] Upstream's richer version **will be re-fetched and diffed** during Phase 58 research before the adoption work begins — the 671-line number is stale in REQUIREMENTS.md:236 relative to a 2026-04-07 read, not a current read. See Q2.
- [governing:reasoned] If the fork narrows the upstream richer version, the narrowing requires **named rationale** recorded under GATE-09c's narrowing-decision provenance rule. Not silent simplification.

### 7. GATE-09 scope-translation ledger (GATE-09a / 09b / 09c / 09d)

**Current state:** Zero source-code hits for the ledger vocabulary (`implemented_this_phase`, `explicitly_deferred`, `rejected_with_reason`, `left_open_blocking_planning`); the terminology lives only in the measurement deliberation (audit Finding 2.9). Phase 57.8 (role-aware provenance) **has merged** (commit `c8a15d95`, 2026-04-20) so GATE-09's attribution prerequisite is now satisfied — STATE.md:6 still lags and is itself GATE-10 evidence.

- [decided:cited] GATE-09a ships the ledger as a **named artifact with a schema**, not a prose convention. Candidate form: YAML frontmatter block in each phase's `NN-LEDGER.md` with required fields `context_claim`, `disposition` (enum: `implemented_this_phase` | `explicitly_deferred` | `rejected_with_reason` | `left_open_blocking_planning`), `target_phase_if_deferred`, `narrowing_provenance`. (Source: audit §6.2.)
- [open] Whether the ledger lives as a standalone `NN-LEDGER.md` file or as a YAML block inside existing `NN-SUMMARY.md` / `NN-VERIFICATION.md`. See Q3.
- [decided:cited] GATE-09b is a **planning gate**: any `[open]` scope-boundary claim in CONTEXT.md that affects what the phase builds must resolve or defer with a named downstream phase before plan-phase proceeds. (Source: REQUIREMENTS.md:248.)
- [decided:cited] GATE-09c requires RESEARCH.md / PLAN.md to cite the originating CONTEXT claim when narrowing scope relative to CONTEXT — recorded as a decision with provenance. (Source: REQUIREMENTS.md:250.)
- [decided:cited] GATE-09d is the **verifier contract**: phase verification reads the ledger and fails if a load-bearing CONTEXT claim silently disappears, even when executable tasks pass. This uses Phase 57.8's role-split provenance (`about_work` / `detected_by` / `written_by`) to attribute which role lost the claim. (Source: REQUIREMENTS.md:252 + ROADMAP.md:123-124.)
- [assumed:reasoned] "Load-bearing" in GATE-09 means a CONTEXT claim that is `[decided:*]`, `[stipulated:*]`, `[governing:*]`, or any claim tagged `load-bearing` by the author; `[assumed:*]` claims are load-bearing if they underpin a `[decided]` claim per the `<dependencies>` table. Exact operational definition is refined during research.

### 8. Phase-closeout reconciliation & release boundary (GATE-10, GATE-11, GATE-12, GATE-15)

**Current state:** `sig-2026-04-17-phase-closeout-left-state-pr-release-pending.md` (occurrences=5) and `sig-2026-04-20-phase-closeout-planning-state-release-lag.md` (occurrences=6) are live in-repo. STATE.md:6 still says "Phase 57.8 context gathered" despite Phase 57.8 having merged on 2026-04-17. This audit is being discussed on the same branch where the pattern it names is present.

- [decided:cited] GATE-10 ships phase-closeout reconciliation as a **structural step**: STATE.md, the active ROADMAP phase row (percent, status, last activity), phase plan checkboxes, and any touched planning-authority sidecars are reconciled in a single commit or rejected with a blocking message. The reconciliation substrate is a `gsd-tools` subcommand invoked by phase-close workflow step, not prose. (Source: REQUIREMENTS.md:254 + audit Finding 3.1.)
- [decided:cited] GATE-11 ships release-boundary assertion: when a phase branch merges to main, the PR/CI/merge/tag/release boundary is either advanced (release workflow fired) or explicitly deferred with reason; stale release lag is surfaced by a workflow check, not silently tolerated. (Source: REQUIREMENTS.md:256 + audit Findings 3.1, 3.6.)
- [decided:cited] GATE-12 replaces `rm` of partial / failed agent output with `mv` to an archive path (e.g., `.planning/phases/NN-*/.archive/YYYYMMDDHHMMSS-failed-agent-id/`). Structural substrate: workflow-level envelope around agent dispatch that captures any written files on non-zero exit before redispatch. (Source: REQUIREMENTS.md:258 + signal `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving.md`.)
- [decided:cited] GATE-15 ships source↔installed mirror parity as a **CI check** (byte-identical post-install for files under `agents/`, `get-shit-done/`, `commands/` vs `.claude/...`), with the installer manifest as ground truth. Fires on every PR that touches those paths. (Source: REQUIREMENTS.md:264 + `CLAUDE.md:15-27` dual-directory hazard.)
- [projected:reasoned] GATE-10 and GATE-11 together resolve the "closeout seam" that audit §7.1 names — the boundary between "phase implementation verified" and "project operationally advanced." Phase 58 treats them as structural gates; framework-invisibility note Q4 records that this may be wrong level of intervention.

### 9. Cross-runtime substrate declaration (XRT-01, Codex per-gate behavior)

**Current state:** REQUIREMENTS.md:10 cross-runtime note is factually stale post-55.2 — it claims "no hook mechanism as of v0.118.0" but `cross-runtime-parity-research.md:70-80` documents `codex_hooks` flag availability (audit §5.1). Phase 57.7 and 57.8 CONTEXT.md files do not contain explicit Codex degradation sections for hook-dependent features (audit Finding 2.10). No structural gate enforces "before implementation begins."

- [decided:cited] XRT-01 ships with a **plan-phase assertion**: any hook-dependent commitment in CONTEXT.md has an accompanying Codex degradation claim before plan-phase begins; verifier checks `capability-matrix.md` diff in closeout. (Source: audit Finding 2.10 + REQUIREMENTS.md:419.)
- [decided:cited] The cross-runtime stale-note in REQUIREMENTS.md:10 is rewritten during Phase 58 to reflect the post-55.2 reality — Codex hooks exist under `codex_hooks` flag at v0.118.0; degradation is per-gate, not blanket. (Source: audit §5.1, §5.3.)
- [decided:cited] Per-gate Codex behavior table (audit §5.3) is authored as part of the plan: every GATE-01..15 carries an explicit `applies` / `does-not-apply-with-reason` / `applies-via-workflow-step` marker for Codex; blanket "Codex has no hooks" is rejected. (Source: audit §5.3, §9.3.)

### 10. Meta-gate (proposed; not yet a requirement)

- [open] A meta-gate (working title GATE-99 or embedded in GATE-09d) that asserts **every Phase 58 gate fires at least once in the phase trace that introduced it** — catches the "gate installed but not wired" failure mode that Finding 2.6 / 2.7 describe. See Q5. If adopted, it is a requirement addition worked into REQUIREMENTS.md during Phase 58; if not, the risk is recorded in the phase's own ledger entry.

### Claude's Discretion

- Exact CLI shape of the reconciliation subcommand (GATE-10)
- Archive directory naming conventions and retention (GATE-04a, GATE-12)
- GitHub Actions YAML structure for CI-enforced gates (GATE-01, GATE-02, GATE-15)
- Exact copy / prompt wording for blocking-severity mandatory understanding (GATE-04c)
- Ledger front-matter key ordering and optional-fields policy (GATE-09a)
- Pre-push hook vs branch-protection-only implementation of GATE-14 (within the named-substrate constraint)

</working_model>

<constraints>
## Derived Constraints

- **DC-1:** [governing:reasoned] Every GATE must carry a **named substrate** (hook / CI rule / exit-coded workflow step) or a named substrate-dependency — derived from audit §9.3 Acceptance Test #1 and ROADMAP.md:316-328 Success Criterion 1.
- **DC-2:** [governing:reasoned] Every GATE must emit a **measurable fire-event** that downstream measurement can count — derived from audit §6.1 and ROADMAP.md Success Criterion 1.
- **DC-3:** [governing:reasoned] Every GATE that could be bypassed by a parallel workflow must be implemented in **every such workflow** (no "advisory by composition") — derived from audit §7.2.
- **DC-4:** [governing:reasoned] Every GATE must carry a **per-gate Codex behavior declaration** (applies / does-not-apply-with-reason / applies-via-workflow-step); blanket "Codex has no hooks" is rejected — derived from audit §5 + §9.3.
- **DC-5:** [evidenced:cited] Phase 57.8 has merged (commit `c8a15d95` in `git log --oneline -5`); STATE.md:6 still says "Phase 57.8 context gathered". The closeout-seam signal this audit names is live in the repo during this very discuss-phase — direct evidence for GATE-10 and GATE-11 scope.
- **DC-6:** [decided:cited] Phase 58 does not duplicate Phase 57.9's work (installer-wired `SessionStop` + Codex hook surface + session-level incident markers). GATE-06 and GATE-07 are consumers, not implementers — ROADMAP.md:317 + audit §9.1.
- **DC-7:** [governing:reasoned] `[open]` scope-boundary claims in this CONTEXT — the places where we do not know what the phase is supposed to build — must be resolved or deferred to a named downstream phase **before plan-phase proceeds**. This is GATE-09b applied reflexively to Phase 58's own CONTEXT. See `<questions>` Q1, Q3, Q5.
- **DC-8:** [evidenced:cited] GATE-03's motivating pattern recurred at quick task `260419-6uf` (commit `ddcf1232`, 2026-04-19) — touching the installed Codex `gsdr-signal` skill direct to main without PR, 24 hours before the audit. GATE-03 is the only gate whose motivation recurred while pending (audit Finding 2.3). Pre-GATE-03 landing this phase is not speculative.
- **DC-9:** [decided:reasoned] `ROADMAP.md` and `REQUIREMENTS.md` are classified as **runtime-adjacent** (planning-authority files) under GATE-03. Direct-to-main on these is **not** the "pure prose docs" exception — they are authoritative project state. The quick `260419-wjj` 2026-04-20 patch to REQUIREMENTS.md is precisely the ambiguity audit §7.6 flags.

</constraints>

<guardrails>
## Epistemic Guardrails

- **G-1:** [governing:reasoned] **Structural ≠ legible-advisory.** A gate that merely asks the agent more clearly is still advisory. Research and planning must check each proposed gate against DC-1 (named substrate) before accepting it. Audit §1's "the failure mode is not 'Phase 58 is wrong'; it is 'Phase 58 can be declared complete against the requirement text without actually achieving structural enforcement'" is the failure mode this guardrail prevents.
- **G-2:** [governing:reasoned] **Every requirement that looks like a workplan gets split.** Audit Findings 2.4 (GATE-04), 2.8 (GATE-08), 2.9 (GATE-09) all describe requirements carrying 3–5 mechanisms. ROADMAP.md:318-324 has already split them into letter-suffixed sub-requirements; research and plan must check that no further collapsing happens during planning.
- **G-3:** [governing:reasoned] **Scope-narrowing cascade check (reflexive GATE-09).** During Phase 58 planning, every narrowing of a CONTEXT claim must cite the originating claim and record the narrowing as a decision — this CONTEXT itself is subject to GATE-09c during this phase, not after.
- **G-4:** [governing:reasoned] **No prose-only Codex framing.** Every gate declaration must either (a) include an explicit Codex behavior marker per DC-4, or (b) name the Phase 57.9 / future phase that delivers the Codex substrate. Blanket cross-runtime notes in REQUIREMENTS.md are a known failure mode (audit §5.1).
- **G-5:** [governing:reasoned] **Audit framework is visible, not invisible.** This CONTEXT is informed by a specific requirements_review × investigatory × cross_model audit. Its strengths (§6, §9) and its admitted framework-invisibility (§14) are both load-bearing; research must preserve the investigatory frame and not silently re-collapse into standard requirements hygiene. See Q4.
- **G-6:** [governing:reasoned] **Fire-event events feed Phase 57.5 extractors, not a bespoke sensor.** GATE emissions are structured to be consumable by the existing measurement registry (ARCH-01..07). New extractors may be registered; no new measurement architecture is introduced in Phase 58.
- **G-7:** [governing:reasoned] **Evidence preservation over conservation of artifacts.** Every failed or interrupted agent output under GATE-12 is archived; when in doubt, prefer to archive. `rm` is the exception path, not the default.

</guardrails>

<questions>
## Open Questions

### Q1: Which GATE-03 detection rule to ship — glob-based, git-diff-based, installer-manifest-based, or a composition?
**Research program:** Enumerate all direct-to-main quick-task commits in the last 60 days; for each, classify whether the touched files would have been caught by (a) a glob rule (`.md`-only → docs), (b) a git-diff rule (paths under `get-shit-done/bin/`, `agents/`, `commands/`, `.claude/hooks/`, installer, workflows, or planning-authority files → runtime), or (c) the installer manifest cross-check. Compare false-positive rates (docs blocked that shouldn't be) and false-negative rates (runtime slipped past). Use the manifest at `dist/MANIFEST` if present as the authoritative path set.
**Downstream decisions affected:** Implementation shape of `quick.md` detection step; whether installer needs to expose a public manifest read path; whether GATE-03 is a workflow-step check or a pre-push hook.
**Reversibility:** MEDIUM — detection rule is swappable but affects the false-positive rate seen by every quick-task. Under-blocking re-opens the R08 pattern; over-blocking trains users to bypass.

### Q2: What is upstream's current discuss-phase-assumptions.md size and shape, and what specifically is the fork narrowing if we narrow it?
**Research program:** Fetch upstream HEAD `get-shit-done/workflows/discuss-phase-assumptions.md` (not cached — the 671-line REQUIREMENTS.md:236 figure is 2-week-stale). Diff against fork's 279-line version. Categorize the delta: (a) methodology loading, (b) assumptions-analyzer agent invocation, (c) mode-aware gating, (d) other. For each category, decide adopt-as-is / narrow-with-rationale / reject-with-rationale. Produce a diff artifact consumed by GATE-08a.
**Downstream decisions affected:** Scope of GATE-08a–08e; whether `gsd-assumptions-analyzer` matches upstream's equivalent or is fork-specific; whether narrowing needs a named rationale under GATE-09c.
**Reversibility:** HIGH — narrowing decisions are reversible in future patches; but shipping with silent narrowing (the historical failure mode) is what GATE-08e explicitly rejects.

### Q3: Where does the GATE-09 ledger live — standalone `NN-LEDGER.md`, YAML block inside `NN-SUMMARY.md`, or frontmatter on `NN-VERIFICATION.md`?
**Research program:** Inspect existing phase artifacts (57.4, 57.5, 57.6, 57.7, 57.8) for natural host locations — where are the "explicit deferrals" and "narrowings" already being written in prose today? Prototype the three candidate layouts against the existing 57.7 closeout evidence (the vision-drop diagnostic revision is a real narrowing precedent). Test whether the existing `gsd-tools` KB rebuild path can consume YAML frontmatter additions without a schema-breaking migration. Default bias: a standalone `NN-LEDGER.md` is cleaner for verifier tooling (GATE-09d) but creates a new artifact class.
**Downstream decisions affected:** `frontmatter.cjs` validation scope, KB schema extension (per PROV-05 precedent), verifier implementation.
**Reversibility:** MEDIUM — file location is refactorable; schema additions to KB are additive.

### Q4: Is "structural vs advisory" the right live dichotomy, or is the real failure mode "workflow-enforced but agent doesn't read the workflow"?
**Research program:** This is explicitly named as framework-invisibility in audit §14. Research cannot answer it from the declarative surface alone; it needs a post-Phase-58 behavioral trial. Under GATE-09 discipline: **record this as an open question carried into Phase 60.1's intervention-outcome loop** rather than trying to collapse it here. Research establishes the measurement substrate (per-gate fire-events) so Phase 60.1 can answer it empirically.
**Downstream decisions affected:** Whether Phase 58 over-commits to structural gating; whether Phase 60.1 needs an adversarial-agent test harness.
**Reversibility:** LOW — if the premise is partially wrong, structural gates remain useful but are not the full fix; reversal would mean adding a second enforcement layer in a later milestone.

### Q5: Adopt the proposed meta-gate (GATE-99 / embedded in GATE-09d) that asserts every Phase 58 gate fires at least once in the phase trace that introduced it?
**Research program:** Check whether the existing Phase 57.5 extractor registry can observe gate fire-events as native measurements without new instrumentation. If yes, the meta-gate is cheap — one verifier step reading the phase's measurement trace. If no, the meta-gate requires new sensor work and belongs in Phase 60 or 60.1 instead. Audit §6.5 proposes this explicitly; §7.3 flags that GATE-09 itself is narrow-able and this meta-gate is the guard against that narrowing.
**Downstream decisions affected:** Whether Phase 58 has 25 requirements or 26; whether phase verification includes an emission-count assertion per gate; scope of sensor work required.
**Reversibility:** MEDIUM — adding a meta-gate mid-phase is doable; retrofitting a meta-gate post-Phase-58 is harder because the emission substrate decisions are locked during planning.

### Q6: Does GATE-10's reconciliation substrate reuse `gsd-tools state` or introduce a new subcommand?
**Research program:** Read the current `gsd-tools state` surface; determine whether `state record-session` + related subcommands can be composed into a reconciliation primitive, or whether a new `gsd-tools phase reconcile` is warranted. Check the 38.1-project-local-knowledge-base precedent (per phase directory listing) for schema conventions.
**Downstream decisions affected:** Substrate file edits; developer-facing CLI surface; whether GATE-10 is one plan or two.
**Reversibility:** MEDIUM — CLI shape is refactorable but affects user-facing surface.

</questions>

<dependencies>
## Claim Dependencies

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| [projected] GATE-06/07 via 57.9 substrate (§5) | [evidenced] 57.9 inserted in ROADMAP.md:141-150 | MEDIUM — 57.9 has no phase directory yet and no plans; if 57.9 slips, Phase 58 cannot honestly ship GATE-06/07 under DC-1. Acceptance Test AT-1 below checks this. |
| [decided] GATE-09d uses 57.8 role-split provenance | [evidenced] 57.8 merged commit `c8a15d95` | LOW — 57.8 has merged; STATE.md:6 lag is cosmetic and is itself GATE-10 evidence, not a blocker. |
| [decided] GATE-03 runtime-adjacent classification of ROADMAP/REQUIREMENTS | [decided] planning-authority files are structural | MEDIUM — if the classification is wrong, quick-task workflow friction increases; but the 2026-04-20 REQUIREMENTS.md patch is direct motivation. |
| [decided] GATE-01 CI-based enforcement | [assumed] CI rule is stronger than workflow-file mechanic | LOW — audit §6.4 is reasoned; alternative (pre-push hook) is parallel, not exclusive. |
| [decided] GATE-08a re-fetch of upstream | [open] Q2 (what upstream looks like now) | MEDIUM — until Q2 resolves, GATE-08a–08e scope cannot be planned; this is GATE-09b territory for Phase 58 itself. |
| [decided] GATE-09a ledger as named artifact | [open] Q3 (where it lives) | MEDIUM — file location affects verifier implementation complexity; not a blocking unknown for schema design. |
| [decided] GATE-15 CI parity check | [evidenced] dual-directory hazard in CLAUDE.md:15-27 | LOW — the evidence is load-bearing and the hazard is well-known; implementation risk is in false-positive rate on legitimate divergences. |
| [decided] fire-event consumable by Phase 57.5 extractors | [evidenced] extractor registry shipped in Phase 57.5 | LOW — verified via ROADMAP.md:243-256 completion and `.planning/phases/57.5-*` artifacts. |
| [governing] structural enforcement (G-1) | [governing] audit §1 headline commitment | LOW — the phase's own self-description is the source; no external premise. |
| [assumed] "load-bearing" operational definition for GATE-09 | [decided] claim-types vocabulary | MEDIUM — operational edge cases around `[assumed]` dependencies need test cases during research. |

</dependencies>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Primary audit authority (Phase 58 declarative surface)
- `.planning/audits/2026-04-20-phase-58-structural-gates-gap-audit/phase-58-structural-gates-gap-audit-output.md` — the 2026-04-20 requirements_review × investigatory × cross_model audit; every finding cited above traces back here.
- `.planning/audits/2026-04-20-phase-58-structural-gates-gap-audit/phase-58-structural-gates-gap-audit-task-spec.md` — the audit's own dispatch contract, including composed obligations.

### Roadmap and requirements (declarative scope)
- `.planning/ROADMAP.md` §Phase 58 (lines 315-328) — goal, dependencies, success criteria, 25 requirements.
- `.planning/ROADMAP.md` §Phase 57.9 (lines 141-150) — hook substrate prerequisite for GATE-06/07.
- `.planning/ROADMAP.md` §Phase 57.8 (lines 123-138) — role-split provenance prerequisite for GATE-09d (merged 2026-04-17, commit `c8a15d95`).
- `.planning/REQUIREMENTS.md` §GATE-01..15 + XRT-01 + HOOK-01..03 (lines 187-265, 419) — canonical text + motivation citations.

### Predecessor audits (chain integrity)
- `.planning/audits/2026-04-07-v1.20-roadmap-restructure/v1.20-roadmap-restructure-review-opus.md` — source of "prerequisite inversion" framing; §4.1 of this audit re-verified post-55.2.
- `.planning/audits/2026-04-08-codex-drift-audit/codex-harness-audit-gpt54-2026-04-08.md` — source of Finding 5 (Codex signal heuristics); `signal-detection.md:67-76` still stale.
- `.planning/audits/2026-04-10-phase-57-vision-drop-investigation/sonnet-output.md` — scope-narrowing cascade analysis that GATE-09 is the meta-fix for.
- `.planning/audits/2026-04-16-signal-provenance-audit/signal-provenance-audit-output.md` — source of Phase 57.8's role-split provenance; GATE-09d depends on it.

### Deliberations (design authority)
- `.planning/deliberations/measurement-infrastructure-epistemic-foundations.md` §7.4 — original source for GATE-09 "implemented_this_phase / explicitly_deferred / rejected_with_reason / left_open_blocking_planning" vocabulary.
- `.planning/deliberations/phase-scope-translation-loss-audit-capability-gap.md` — triggering deliberation for Phase 57.4, relevant frame for scope-narrowing.

### Substrate files (code context)
- `.claude/settings.json` (lines 1-54) — current hook surface; `SessionStop` absent.
- `bin/install.js` (lines ~2094 hook enumeration; ~2846-2856 Codex hook skip) — installer substrate Phase 57.9 modifies.
- `get-shit-done/workflows/execute-phase.md` (lines 777-824) — `offer_next` + `gh pr merge --merge`; GATE-01, GATE-02 substrate.
- `get-shit-done/workflows/complete-milestone.md` (line 721) — second `offer_next` surface audit §7.2 flags as un-audited for GATE-02 coverage.
- `get-shit-done/workflows/quick.md` (lines 163-173) — `branch_name` variable; GATE-03 substrate.
- `get-shit-done/workflows/resume-project.md` (lines 127-135) — `.continue-here` `rm -f` consume; GATE-04a/04b substrate.
- `get-shit-done/workflows/collect-signals.md` (lines 249-251) — sensor dispatch; GATE-05 substrate.
- `get-shit-done/workflows/discuss-phase-assumptions.md` (279 lines) — GATE-08 scope delta input.
- `get-shit-done/references/cross-runtime-parity-research.md` (lines 70-80) — Codex `codex_hooks` flag at v0.118.0; falsifies REQUIREMENTS.md:10.
- `get-shit-done/references/signal-detection.md` (lines 67-76) — Codex model-class heuristics; unremediated; XRT-01 + GATE-05 measurement-effectiveness concern.
- `get-shit-done/references/capability-matrix.md` — XRT-01 target; audit §4.1 re-verified as accurate post-55.2.
- `.planning/measurement/extractors/` (Phase 57.5 registry) — fire-event consumer surface for DC-2.

### Live evidence signals (motivating failure patterns)
- `.planning/signals/sig-2026-04-17-phase-closeout-left-state-pr-release-pending.md` (occurrences=5) — GATE-10 motivation.
- `.planning/signals/sig-2026-04-20-phase-closeout-planning-state-release-lag.md` (occurrences=6) — GATE-10 + GATE-11 motivation; live in-repo during this CONTEXT.
- `.planning/signals/sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving.md` — GATE-12 motivation.
- `.planning/signals/sig-2026-04-10-researcher-model-override-leak-third-occurrence.md` (3 occurrences) — GATE-05 + GATE-13 motivation.
- `.planning/signals/sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md` (3 occurrences) — GATE-13 motivation.
- `.planning/signals/sig-2026-04-10-ci-branch-protection-bypass-recurrence.md` (3 occurrences, severity critical) — GATE-14 motivation.
- `.planning/signals/sig-2026-03-30-release-workflow-forgotten-in-milestone-completion.md` — GATE-11 motivation.
- `.planning/signals/sig-2026-04-10-phase-574-pr45-ci-clean-mergeable-baseline.md` — GATE-01 CI enforcement precedent.

### Project conventions and memory
- `CLAUDE.md` (lines 15-27) — dual-directory hazard; GATE-15 motivation.
- `.planning/FORK-DIVERGENCES.md` — reconciliation scope for GATE-10.
- `~/.claude/.../memory/feedback_model_override_scope.md` — project memory on dispatch scope isolation (relevant to GATE-05 / GATE-13).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Measurement extractor registry** (Phase 57.5/57.6/57.7, 17+ extractors): fire-events from gates register as content-derived features without new measurement architecture (DC-2 / G-6).
- **`gsd-tools` CLI surface**: `state record-session`, `kb rebuild`, existing `commit`, `init phase-op` primitives compose into reconciliation (GATE-10) and ledger verification (GATE-09d) without new top-level commands — subject to Q6.
- **KB schema v2** (Phase 56 + 57.8 role-split extension): ledger entries and gate fire-events inherit the dual-write invariant (files + SQLite index) for free.
- **`resolveModelInternal`** (Phase 57.8): model echo for GATE-05 and dispatch contract restatement for GATE-13 both consume this canonical resolver rather than re-deriving.
- **`frontmatter.cjs`**: candidate validator for GATE-09a ledger schema if YAML-block layout wins Q3.
- **Installer manifest** (`dist/MANIFEST` or equivalent): candidate ground truth for GATE-15 parity and GATE-03 detection (Q1 option c).
- **Existing `gh pr merge $CURRENT_BRANCH --merge`** at `execute-phase.md:793`: the one conforming site; copy-pattern for GATE-02 enumeration.

### Established Patterns
- **Consume-on-read with audit trail**: already followed elsewhere for `.planning/todos/`; GATE-04a mirrors the pattern for `.continue-here`.
- **YAML frontmatter + markdown body**: used across signals, spikes, phases, CONTEXT, LEDGER naturally fits.
- **Dual-write invariant (files + SQLite)**: Phase 56/57.8 precedent; ledger entries should respect it.
- **Per-runtime capability resolver in `automation.cjs`**: GATE-06/07 Codex behavior consumes the resolved capability, not hardcoded assumptions.

### Integration Points
- Hook substrate surface (Phase 57.9 output): GATE-06 / GATE-07 read from this.
- CI workflow (`.github/workflows/`): GATE-01, GATE-02, GATE-14, GATE-15 extend CI with new checks.
- `quick.md`, `execute-phase.md`, `complete-milestone.md` workflow files: primary targets for structural insertions.
- `bin/install.js`: source↔installed parity assertion (GATE-15) emits at installer end; installer doesn't modify hook surface in Phase 58 (that's 57.9).

</code_context>

<specifics>
## Specific Ideas

- Audit §6.4's "CI-as-structural-gate" pattern is preferred for GATE-01, GATE-02, GATE-03, GATE-14, GATE-15 where CI can host the check. Workflow-level mechanics remain for gates tied to per-session state (GATE-04, GATE-12).
- Audit §9.3's goal rewrite (K ≥ 12 gates, enumerated; four cross-cutting properties) is adopted as the Phase 58 success-criterion frame. ROADMAP.md:316-328 already uses this frame — Phase 58 plan must not re-collapse it.
- The live-evidence dimension matters: every GATE cites a current-in-repo signal or substrate gap, not a hypothetical failure. This is what audit §7.5 calls "silent-recurrence pattern" — GATE-03's motivation recurring 24h before the audit is the canonical example.
- Audit §11 competing interpretations are **not collapsed** into the CONTEXT — they are carried forward to research as live options:
  - Finding 3.1 (closeout seam): Reading A (add gates) leads; Reading B (workflow-ownership reframe) flagged.
  - Finding 2.6 (SessionStop): Reading B (Phase 58 teaches installer) adopted via 57.9 split.
  - §5 (Codex credibility): one-line REQUIREMENTS.md:10 update + per-gate declarations in the plan.

</specifics>

<deferred>
## Deferred Ideas

Per audit §8 "what should stay downstream":

- **Full Codex hook installer parity beyond SessionStop** — tracked under XRT-01 + Phase 57.9 dependency note; Phase 60.1 or later milestone completes the parity matrix.
- **Log-sensor live incident-detection wiring for GATE-07** — Phase 60 + 60.1 own sensor integration; Phase 58 GATE-07 depends on 57.9 markers + 60.1 wiring rather than re-implementing.
- **Full KB query surface for historical GATE-09 ledger analysis** — Phase 59 (KB query / FTS5 / lifecycle) is the natural home; Phase 58 writes ledger entries, Phase 59 queries them.
- **Cross-model review of GATE designs themselves** — Phase 61 (Spike Methodology Overhaul) / SPIKE-01 is the methodology home; Phase 58 flags "GATE-01..15 design not yet cross-model reviewed" as an open risk rather than doing the review here.
- **Generalized dispatch-scope isolation across all agent types** — AUT-02 (v1.21) territory; Phase 58 adds GATE-05/13 for the observable surface, AUT-02 addresses the underlying dispatch-args architecture.
- **Signal-to-workflow auto-elevation on recurrence (R18 pattern)** — requires Phase 60.1's measurement→signal→workflow feedback loop; a future REC-01 requirement.
- **Audit §7.4 Codex hooks timing (feature-flag stabilization mid-milestone)** — a capability-matrix drift question that spans phases; not scope-ownable by Phase 58.
- **Audit §14 framework-invisibility reframe ("structural vs advisory" as wrong dichotomy)** — carried as Q4 into Phase 60.1 intervention-outcome loop, not answered here.

---

*Phase: 58-structural-enforcement-gates*
*Context gathered: 2026-04-20*
</deferred>

---

## Acceptance Tests for Plan-Phase Entry

Per audit §9.4 and GATE-09b applied reflexively to this CONTEXT:

- **AT-1** (prerequisite sequencing): Phase 57.9 phase directory exists with plans at `ready_to_execute` or `complete`, **OR** Phase 58 plan explicitly defers GATE-06 / GATE-07 to post-57.9 with named rationale per GATE-09c.
- **AT-2** (substrate declaration): Every GATE in the plan names either a substrate (hook / CI rule / exit-coded workflow step) or a substrate-dependency (pointing to 57.9 / 57.8 / 60.1). No GATE has prose-only mechanism.
- **AT-3** (Codex per-gate declaration): Per-gate Codex behavior table authored as part of planning scope; every GATE-01..15 carries an explicit `applies` / `does-not-apply-with-reason` / `applies-via-workflow-step` marker.
- **AT-4** (ledger schema before verifier): GATE-09a schema (Q3 resolved or deferred) is decided before GATE-09d verifier implementation begins.
- **AT-5** (reflexive GATE-09): This CONTEXT's `[open]` claims (Q1, Q3, Q5 — and Q2, Q4, Q6 tracked here) are resolved or deferred with named downstream phase before plan-phase proceeds. Q4 is deferred to Phase 60.1 at this stage.
- **AT-6** (closeout seam live evidence): STATE.md is reconciled with current Phase 57.8 merged state (GATE-10 applied reflexively to the current session) before Phase 58 plan-phase is considered entered.

---

*Phase: 58-structural-enforcement-gates*
*Context gathered: 2026-04-20*
