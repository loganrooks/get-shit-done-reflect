# Signal Verification & Recurrence Analysis

**Date:** 2026-04-07
**Verifier:** claude-sonnet-4-6 (verification-agent-b)
**Primary input:** gpt-xhigh-synthesis.md (71 unique findings, U01–U71)
**Secondary input:** opus-synthesis.md (59 unique findings, cross-referenced for gap-fill)
**Findings analyzed:** 71 unique findings (GPT primary) + 6 Opus-exclusive findings
**Classification breakdown:** NEW: 12 | KNOWN-UNADDRESSED: 22 | ADDRESSED: 9 | RECURRED: 8 | PARTIALLY-ADDRESSED: 20

---

## Version Context Summary

| Version | Released | Key changes relevant to audit |
|---------|----------|-------------------------------|
| v1.17.5 | 2026-03-19 | Pre-audit baseline |
| v1.18.0 | 2026-03-30 | Milestone release; CI cache per-project scoped; upstream adopt |
| v1.18.1 | 2026-04-02 | fix(installer): $HOME path doubling; gsdr-local-patches namespace |
| v1.18.2 | 2026-04-02 | fix(workflow): `--merge` in offer_next; execute-phase branching |
| v1.18.3 | 2026-04-02 | fix: model resolver prefix normalization (Issue #30) |
| v1.19.0 | 2026-04-02 | feat: three-mode discuss system (exploratory/discuss/assumptions) |

**Audit period sessions span:** 2026-03-20 to 2026-04-07

**Version mapping for key sessions:**
- Sessions 2026-03-20 to 2026-03-27: running v1.17.x (pre-fix for most issues)
- Sessions 2026-03-27 to 2026-03-30: running v1.17.5–v1.18.0 transition
- Sessions 2026-04-02 (pre-23:45): running v1.18.x before day's releases
- Sessions 2026-04-02 23:45+ and later: v1.19.0 available but only picks up automatically if reinstalled

**Model pattern:** All sessions across both machines used `claude-opus-4-6` as the primary model. One dionysus session (e4962226, installer fix worktree) used `claude-sonnet-4-6`. Synthetic tool calls (`<synthetic>`) appear in multi-agent/headless sessions.

**Cross-machine note:** Apollo runs projects out of `/Users/rookslog/` with local GSDR installs per project. Dionysus runs projects out of `/home/rookslog/workspace/projects/` and `/home/rookslog/workspace/projects/` — most projects there do NOT have local GSDR installs and rely on the global GSD (v1.30.0 upstream, no GSDR three-mode discuss). This explains why sessions 291fb270 (epistemic-agency, 2026-04-03) and c767da7b (PDFAgentialConversion, 2026-04-03) exhibited discuss-phase --auto decision-locking even after v1.19.0 was released: those projects were running unpatched global GSD, not GSDR.

---

## Failed Interventions (RECURRED)

These are findings where a fix was committed but the pattern reappeared in a later session. They represent the highest-priority items for v1.20.

### R1 — offer_next Skips Inter-Phase PR/CI/Merge Workflow (U10 / Opus-U10)

- **Original occurrence:** Session 41c5d67b, 2026-03-28, v1.17.5. After Phase 53 completed, offer_next jumped directly to `/gsdr:plan-phase 54` without prompting PR creation, CI verification, or merge.
- **Supposed fix:** `fix(workflow): execute-phase offer_next respects branching_strategy` (commit 26865a22, 2026-04-02, v1.18.2). The step now routes through PR creation and merge when `branching_strategy` is `"phase"` or `"milestone"`.
- **Recurrence evidence:** Signal `sig-2026-03-28-offer-next-skips-pr-workflow.md` retains `status: active` (not transitioned to remediated) as of today. The GPT synthesis counts 5+ occurrences of this pattern (A5c-F10, A5d-F2, A5e-F2, A5c-F4) across sessions that overlap or postdate the fix. The Opus synthesis explicitly marks this as "5+ occurrences" occurring after v1.18.1.
- **Why the fix likely failed:** The fix added the correct wording to the `offer_next` step, but (a) it only fires when `branching_strategy` is non-`"none"` — projects that have never configured `branching_strategy` default to `"none"` and still get the old behavior; (b) the signal was never transitioned to remediated, suggesting the team recognized the fix was incomplete; (c) the Codex runtime reads a different installed copy of execute-phase.md and may not have had this propagated.
- **Implication for v1.20:** The fix is partial. `offer_next` needs a mandatory PR/CI checkpoint regardless of `branching_strategy`, or the default needs to change. This is one of the highest-recurrence patterns in the audit.

---

### R2 — Squash Merge Destroys Commit History (U37 / Opus-U09)

- **Original occurrence:** Session 41c5d67b, 2026-03-28, v1.17.5. Squash merge of a PR destroyed individual commit history; user required force-push recovery.
- **Supposed fix:** `fix(workflow): specify --merge not --squash in PR merge guidance` (commit b7211068, 2026-04-02, v1.18.2). The execute-phase `offer_next` step now explicitly uses `gh pr merge --merge`.
- **Recurrence evidence:** Signal `sig-2026-03-28-squash-merge-destroys-commit-history.md` remains `status: active`. The Opus synthesis notes this was corrected in the workflow doc but the behavioral pattern is not enforced — it depends on agent compliance. There is no structural enforcement (no hook, no CI check) that prevents `--squash` from being used.
- **Why the fix likely failed:** The fix is instructional, not structural. The agent can still deviate if it judges the situation differently. In headless mode (which is increasingly used), the agent may not read or recall this specific guidance. The memory note "No Squash Merge" exists in project MEMORY.md but was still violated in the original incident.
- **Implication for v1.20:** The fix needs to be structural — either a git hook rejecting squash merges on this repo, or a shell wrapper that overrides `gh pr merge` to add `--merge` by default.

---

### R3 — discuss-phase --auto Acts as Decision-Locking (U19, U28 / Opus-U26, U27)

- **Original occurrence:** Session c767da7b (PDFAgentialConversion, 2026-04-03, dionysus) and session 291fb270 (epistemic-agency, 2026-04-03, dionysus). `--auto` collapsed exploration into premature decisions; the local apollo patch added exploratory semantics that the npm source lacked.
- **Supposed fix:** `feat: three-mode discuss system (exploratory/discuss/assumptions)` (commit e4ae09b0, PR #34, v1.19.0, 2026-04-02 23:41). Added `workflow.discuss_mode` routing; `exploratory` is now default. Issues #26, #32, #33 closed.
- **Recurrence evidence:** Sessions 291fb270 and c767da7b both ran on dionysus AFTER v1.19.0 was released (at 02:17 and 02:35 on 2026-04-03 respectively). However, both projects (epistemic-agency, PDFAgentialConversion) do not have local GSDR installs on dionysus — they use the global GSD (v1.30.0 upstream) which does NOT contain the three-mode routing. The fix shipped in GSDR v1.19.0 but only applies to projects where GSDR is locally installed.
- **Why the fix failed (scoped):** The fix is real and complete for projects with GSDR installed. The recurrence is a cross-runtime distribution failure: the fix must be installed per-project, and non-GSDR projects on dionysus will continue to see old behavior. Additionally, Opus finding U28 specifically notes that even the installed version of discuss-phase --auto "still behaved as decision-locking rather than exploratory" — suggesting the `exploratory` default may not have propagated correctly to the installed copy when the sessions ran.
- **Implication for v1.20:** Two separate issues: (1) distribution gap — the fix doesn't reach projects without GSDR local installs; (2) installation lag — projects need to run `node bin/install.js` after each release to pick up changes. An auto-update check on session start would close this.

---

### R4 — Agent Fails to Self-Signal After Cascade Failure (U47 / Opus-U02)

- **Original occurrence:** Session cb3ee1b7, 2026-03-30, v1.18.0. After a 91-file destructive cascade (wrong agent + installer bug), the agent did not generate any signal until the user explicitly asked for one.
- **Supposed fix:** Signal `sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade.md` was created, documenting the gap. Signal `sig-2026-04-02-repeated-failure-to-self-signal-cleanup-hygiene.md` was also created (same session). Multiple `docs(signal)` commits.
- **Recurrence evidence:** Documenting a failure in the KB is not a fix. No code change, hook, or structural checkpoint was introduced that would cause an agent to self-signal after cascade failures. The signals remain `status: active`. The GPT synthesis (C4 cluster) identifies this as a systemic capability gap. Issue #36 (open as of today) references related work but does not specifically address the self-signal trigger.
- **Why the fix failed:** No structural intervention was made. KB signals document the gap but do not close it. There is no checkpoint in any workflow that says "if N files were modified unexpectedly or N errors occurred, generate a signal."
- **Implication for v1.20:** Needs a post-phase signal checkpoint: "Did this execution produce unexpected scope (error rate > threshold, files modified outside declared scope)? If so, trigger signal creation."

---

### R5 — Premature Closure / Accepting Implausible Results Without Methodological Challenge (U55, U64, U21 / Opus-U28, U33, U21)

- **Original occurrence:** Multiple sessions across vigil and arxiv-sanity-mcp. Session 2c1aa264 (vigil, 2026-04-05): accepted 100% test failure without questioning methodology. Session c4c15beb (vigil, 2026-04-04): falsification testing nearly produced "Swift fundamentally broken" conclusion. Session 7b8cf8ae (arxiv-sanity-mcp, 2026-03-20): used Jaccard as semantic metric without questioning appropriateness.
- **Supposed fix:** Signal `sig-2026-03-30-spike-design-lacks-independent-critique-gate.md` in global KB. Multiple deliberation threads on epistemic discipline.
- **Recurrence evidence:** The pattern appears in sessions spanning the entire audit period (2026-03-20 through 2026-04-07). Sessions after the signals were created (e.g., c4c15beb on 2026-04-04, 2c1aa264 on 2026-04-05) still exhibit the pattern. The GPT synthesis identifies this as the second-broadest cluster (C1), appearing in at least 6 projects and 11 sessions.
- **Why the fix failed:** The signals document the pattern but the spike workflow itself has no mandatory methodological checkpoints. There is no "what would falsify this result?" step, no "is this sample representative?" step, and no adversarial comparison step. Knowledge in the KB does not propagate into workflow enforcement without code changes.
- **Implication for v1.20:** Highest-effort fix with broad impact. The spike workflow needs embedded methodological checkpoints: `(a) Is your metric valid for your claim? (b) What would falsify these results? (c) What evidence is still missing?`

---

### R6 — Workflow Transitions Left to Operator Memory / No Lawful Scope-Revision Path (U41, U22 / Opus-U15, U50)

- **Original occurrence:** Session 7e77edff (GSDR, 2026-03-28, v1.17.5). No formal path for mid-phase scope revision. Session ee9a18b6 (blackhole, 2026-04-03): agent ran research and informal scoping before formal phase-insertion workflow.
- **Supposed fix:** Signal `sig-2026-03-28-eager-bypass-of-protocol-when-scope-needs-revision.md` created. No `/gsdr:revise-phase-scope` command was added.
- **Recurrence evidence:** Sessions ee9a18b6 (2026-04-03), 7f423906 (2026-04-03), and others show the pattern recurring after the signal was filed. No structural fix was ever shipped.
- **Why the fix failed:** No fix was shipped. The signal was filed but no workflow command or enforcement was added. User had to act as transition governor in every subsequent session where scope changed.
- **Implication for v1.20:** `/gsdr:revise-phase-scope` needs to be scoped and shipped. This is the highest-impact "missing command" finding.

---

### R7 — CI Quality Gates Theater — Failures Don't Fail the Build (U71 / Opus-U37)

- **Original occurrence:** Session fdd15155 (zlibrary-mcp, 2026-03-20, v1.17.5). CI used `process.exit(0)` in coverage check, meaning coverage failures passed silently for 4 phases.
- **Supposed fix:** Signal `sig-2026-03-02-ci-failures-ignored-throughout-v116.md` was transitioned to `lifecycle_state: remediated` (this is the CI failures during v1.16 signal). The zlibrary-mcp `process.exit(0)` issue was reported in session fdd15155. There is no evidence of a fix commit for the zlibrary-mcp CI theater specifically.
- **Recurrence evidence:** Session 3d2f2bc6 (zlibrary-mcp, 2026-03-27) showed `/gsdr:progress` reporting "shipped" while CI and npm release were both broken (U70). This is a different project (GSDR) but demonstrates the same pattern of progress tools trusting process artifacts over deployment reality.
- **Why the fix likely failed:** The CI theater in zlibrary-mcp was identified but no fix was shipped to that project. GSDR's own progress reporting overclaim (U70) suggests the root pattern — checking process presence not reality — was not addressed system-wide.
- **Implication for v1.20:** `gsdr:progress` needs to resolve CI status from GitHub Actions, not plan completion. The verifier needs a "fail-closed" enforcement check.

---

### R8 — Stale .continue-here Files Trusted Without Validation (U38 / Opus-U14)

- **Original occurrence:** Session 7c46a5cd (GSDR, 2026-04-02). Resume workflow trusted a stale `.continue-here.md` that should have been deleted.
- **Supposed fix:** Signals `2026-02-16-stale-continue-here-files-not-cleaned.md`, `2026-02-17-continue-here-not-deleted-after-resume.md`, `sig-2026-03-30-continue-here-lacks-required-reading-and-anti-patterns.md` all filed. The GPT recommendation (C6) calls for enforcing handoff-file deletion.
- **Recurrence evidence:** The 7c46a5cd session (2026-04-02) represents a recurrence of a pattern first documented in February 2026. The session 308cd666 (blackhole, 2026-04-03, U12) also shows auto-advance skipping `.continue-here` preflight tasks. Despite 3+ signals filed over multiple months, no structural enforcement was added.
- **Why the fix failed:** This pattern has the longest recurrence tail (Feb → April, 3 months). Signals were filed but no code change was ever made to the resume-work workflow to enforce consumption and deletion of `.continue-here` files.
- **Implication for v1.20:** Resume-work should fail closed if `.continue-here.md` exists but hasn't been explicitly consumed. A post-session hook should delete it.

---

## New Signals

Findings not previously captured in the KB, issues, or commits. Verified by searching all signal directories and GitHub issues.

### N1 — Wrong Agent Type Plus No Abort Caused 91-File Destructive Cascade (U46)

**Finding:** Session cb3ee1b7 (GSDR, 2026-03-30). Background agent was dispatched with wrong agent type; no abort mechanism existed; an installer bug caused `$HOME` path doubling; 91 files were destructively modified. The path-doubling bug was fixed (v1.18.1), but the larger issue — no abort semantics for subagent execution and no pre-dispatch agent-type verification — was not captured as a signal.

**KB check:** `sig-2026-04-02-background-agent-bypassed-quality-gates-broke-global-install.md` exists and covers the installer cascade. However, no signal specifically covers the absence of abort semantics or the wrong-agent-type dispatch verification gap.

**Classification: NEW** (the no-abort / wrong-agent-type dispatch gap is uncaptured; the installer bug is captured and fixed).

**Severity:** Critical. The absence of abort semantics for subagents means any mis-dispatched agent runs to completion.

---

### N2 — gsdr:verifier Systematically Overclaimed Spec Conformance (U27 / Opus-U38)

**Finding:** Session fb3a0a76 (blackhole, 2026-04-06). Cross-model audit confirmed the GSDR verifier rubber-stamped 4 consecutive phases without checking spec conformance. The verifier checks "does it work?" not "does it match the spec?"

**KB check:** Signal `2026-03-06-plan-verification-misses-architectural-gaps.md` covers plan-checker gaps. Signal `2026-03-01-plan-checker-misses-second-order-effects.md` covers second-order failures. None specifically covers the verifier's spec-conformance blindspot confirmed by cross-model audit.

**Classification: NEW** (the specific verifier-vs-spec-conformance gap, confirmed by cross-model evidence, is uncaptured).

**Severity:** Critical. The verifier is the last line of defense before accepting phase completion. If it checks presence not conformance, bad work ships.

---

### N3 — Log Sensor Runtime State vs. Registry Text Divergence (U16, U17 / Opus-U44, U48)

**Finding:** Session 622b1a8d (blackhole, 2026-04-06). A working log sensor agent existed in the runtime, but the registry metadata still said it was disabled, causing `collect-signals` to skip it. Session 5a9bbf1c (blackhole, 2026-04-05): the sensor was a disabled stub at source level despite being advertised.

**KB check:** Signal `2026-03-04-stale-log-sensor-spec-disabled-by-default-text.md` exists in GSDR project signals. GitHub Issue #35 (open) covers the log sensor stub. However, the source/runtime/registry three-way divergence (different truths at each layer) is not captured as a distinct pattern — only the end-state stub is captured.

**Classification: PARTIALLY-ADDRESSED** — the stub is captured (#35, signal) but the source-of-truth authority gap (which layer wins?) is new. Reclassifying the authority gap aspect as NEW.

---

### N4 — PID-Based Process Cleanup Killed Wrong Project Session (U24 / Opus-U41)

**Finding:** Session fb3a0a76 (blackhole, 2026-04-06). PID-based Codex CLI cleanup killed a process belonging to a different project session.

**KB check:** No signal found for PID confusion in multi-project headless execution. The broader Codex CLI reliability signals exist but not PID-specific disambiguation.

**Classification: NEW.** Severity: Critical (destructive, caused work loss).

---

### N5 — Spike Workflow Lacks Cross-Spike Dependency Propagation (U07 / Opus-U24)

**Finding:** Session 7b8cf8ae (arxiv-sanity-mcp). Later spikes cannot automatically update earlier spike conclusions when methodology problems are discovered.

**KB check:** `sig-2026-03-30-spike-design-lacks-independent-critique-gate.md` covers the single-agent design/execute/interpret problem. No signal covers the cross-spike qualification propagation gap.

**Classification: NEW.** Severity: Notable. This is a research-infrastructure gap with compounding effects.

---

### N6 — GSD and GSDR Share Backup Directory, Causing Mutual Overwrite Risk (U65 / Opus-U46)

**Finding:** Session c82e801b (vigil, 2026-04-02). GSD and GSDR shared the `gsd-local-patches/` directory, creating patch-loss risk when both were installed.

**KB check:** Fix was committed (94f7ec7f, v1.18.1 — renamed to `gsdr-local-patches/`). **However:** the fix only addresses the directory name collision on the GSDR side. If a project still has an old install from pre-v1.18.1, the old path persists. And if both tools use `backup-meta.json` under their respective directories, the collision is fixed. This one appears addressed.

**Classification: ADDRESSED** (reclassified below in Addressed section). Moving N6 to addressed.

---

### N7 — headless Session Version Burn: feat: Prefix Triggered Minor Bump (U40 / Opus-U12)

**Finding:** Session 7c46a5cd (GSDR, 2026-04-02). Headless session was prompted with `feat:` prefix for what was intended as a patch release. The release workflow correctly followed conventional commits semver, burning v1.19.0 on a patch. Signal `sig-2026-04-03-headless-session-wrong-commit-prefix-burned-version.md` was created.

**KB check:** Signal exists (`status: active`). Memory note in MEMORY.md: "Patch Release Uses fix: Prefix." No code change to add a confirmation gate before npm publish.

**Classification: KNOWN-UNADDRESSED** (signal exists, no structural fix). The release workflow still relies entirely on commit prefix conventions with no confirmation gate. **Moved to Known-Unaddressed.**

---

### N8 — Decimal Phase Parser Cannot Parse Phase IDs Like "7.1" (U53 / Opus-U18)

**Finding:** Session 3de8caf1 (home-level planning). Phase `7.1` was unparseable, causing a false "phase missing" error.

**KB check:** No signal found for decimal-phase parsing. No GitHub issue filed.

**Classification: NEW.** Severity: Notable (causes false errors in phase management).

---

### N9 — No Research-Only Mode for /gsdr:quick (U20 / Opus-U49)

**Finding:** Session 7f423906 (blackhole, 2026-04-03). `/gsdr:quick` lacked a research-only mode, forcing ad-hoc workarounds.

**KB check:** No signal found for this specific gap. The signal `2026-02-11-premature-spiking-no-research-gate.md` exists but covers a different angle (premature spike creation, not quick-task research mode).

**Classification: NEW.** Severity: Notable.

---

### N10 — Parallel Planning Artifacts Produce Predictable STATE.md Merge Conflicts (U54 / Opus-U57)

**Finding:** Session e75f3f5f+ (multiple, 2026-04-07). Parallel execution repeatedly generates expected STATE.md merge conflicts.

**KB check:** No specific signal found for STATE.md merge conflicts under parallel execution, though the broader parallel execution concurrency issue is hinted at in multiple signals.

**Classification: NEW.** Severity: Minor (operational friction, not a correctness failure).

---

### N11 — user message truncation Mid-Session Caused 45-Minute Reconstruction (U56 / Opus-U43)

**Finding:** Session 2c1aa264 (vigil, 2026-04-05). User message truncation forced ~45 minutes of reconstruction work.

**KB check:** No signal found for message truncation or session-state recovery after truncation.

**Classification: NEW.** Severity: Notable (significant time loss).

---

### N12 — Adversarial External Review Catches Flaws Missed by Main Process (U57, U25 / Opus-U58, U34)

**Finding:** Sessions 2e41c1ff and fb3a0a76. Independent cross-model audit caught bugs and framing bias that self-verification and the main process missed. This is a positive capability observation that points to a structural gap: no formal adversarial review step in workflows.

**KB check:** Signal `sig-2026-03-30-spike-design-lacks-independent-critique-gate.md` covers the single-agent spike problem. `sig-2026-03-23-cross-model-review-chain-epistemic-discipline.md` exists and is positive evidence. However, no workflow requires adversarial external review before acceptance.

**Classification: NEW** (positive finding / structural gap in enforcement). Severity: Notable.

---

## Known but Unaddressed

Findings already in the KB or as open GitHub issues, confirmed still present by the audit.

### KU1 — Signal Lifecycle Has Near-Zero Remediation/Verification Closure (U50 / Opus-U05)

**Evidence of prior capture:** Signal `sig-2026-03-04-signal-lifecycle-representation-gap.md` (status: active, created 2026-03-04). `sig-2026-04-02-agent-failed-to-self-signal-on-failure-cascade.md` (status: active). The GPT synthesis reports 171/187 signals stuck in "active," 0% remediation rate.

**Still present:** No lifecycle states (proposed/in-progress/blocked/verified) were added in any v1.18.x or v1.19.0 release. The signal schema remains unchanged.

**Severity:** Critical. The entire signal system's value proposition is undermined by the lack of closure mechanics.

---

### KU2 — Automation Postlude Has 0% Observed Fire Rate (U49 / Opus-U04)

**Evidence of prior capture:** Signal `sig-2026-03-02-step-55-auto-trigger-never-exercised.md` (status: active, created 2026-03-02). Confirmed by GPT synthesis: signal_collection skipped 6/6 times, reflection disabled 2/2 times.

**Still present:** The automation postlude (collect-signals, reflect) has not been made reliable. No hook or enforcement was added. The agent proposed extending this non-functional pattern rather than fixing it.

**Severity:** Notable. The learning loop that was supposed to make the system self-improving is not running.

---

### KU3 — Plan Checker Treats "Workaround Available" as Low Severity (U51 / Opus-U08)

**Evidence of prior capture:** Signal `sig-2026-03-30-audit-severity-downgrade-bias.md` (status: open, local signals). Confirmed by session eb9541ff (GSDR, 2026-03-30).

**Still present:** The plan checker severity logic was not changed in any release. The same classification bias persists.

**Severity:** Notable. This systematically deprioritizes broken designed behaviors.

---

### KU4 — Dev Version String Lacks Commit-Level Traceability (U35 / Opus-U19)

**Evidence of prior capture:** Signal `2026-04-02-dev-version-suffix-lacks-commit-traceability.md` (project signals, 2026-04-02). Also `docs(signal): dev-version-suffix-lacks-commit-traceability` (commit 413bdc2d, 2026-04-02).

**Still present:** No code change was made to the version-string generation. The `+dev` suffix still lacks commit hash.

**Severity:** Minor. But affects traceability for all development installs.

---

### KU5 — Cross-Runtime Upgrade / Install Drift Is Not Detected (Opus-U08 / Issue #17)

**Evidence of prior capture:** `sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift.md` (status: active, critical). GitHub Issue #17 open ("Harden cross-runtime upgrade/install drift").

**Still present:** No detection or synchronization mechanism was added in v1.18.x or v1.19.0. Sessions 291fb270 and c767da7b confirmed that projects without local GSDR installs run old behavior even after v1.19.0 ships.

**Severity:** Critical. Affects every project that doesn't have a local GSDR install, which is many.

---

### KU6 — No Platform Change Detection (Multiple sessions)

**Evidence of prior capture:** `sig-2026-03-17-no-platform-change-detection.md` (global KB, status: active). Stale platform claims confirmed by `sig-2026-03-19-stale-platform-claims-in-source.md` (status: active, critical).

**Still present:** AGENTS.md still contains stale Codex capability claims. No monitoring was added.

**Severity:** Critical (stale claims produce incorrect agent behavior).

---

### KU7 — Sensor Model Selection Is Implicit and Not Runtime-Verifiable (U42 / Opus-U16)

**Evidence of prior capture:** No signal found directly, but `sig-2026-03-02-quality-profile-sonnet-executor-mismatch.md` exists. Memory note "Sensors Use Sonnet" captures the user preference.

**Still present:** No explicit sensor model echo was added. The batch had to be stopped and relaunched in session 9b4aa82a (GSDR, 2026-03-29) because model selection was wrong and unverifiable.

**Severity:** Notable. Affects all sensor runs — silent wrong-model selection wastes compute and produces different-quality results.

---

### KU8 — Release Workflow Forgotten / Fragile Manual Steps (U48 / Multiple)

**Evidence of prior capture:** `sig-2026-03-30-release-workflow-forgotten-in-milestone-completion.md` (status: open, local signals). `sig-2026-02-17-release-process-fragile-manual-steps.md` (GSDR signals).

**Still present:** The version bump and GitHub Release creation steps are still not automated in the milestone completion workflow beyond what's already in `/gsdr:release`. Session 7c46a5cd (2026-04-02) demonstrated that the release workflow can still be triggered incorrectly via headless dispatch.

**Severity:** Notable (confirmed recurrence — see also RECURRED section).

---

### KU9 — Source and Installed discuss-phase Embody Incompatible Philosophies (U44 / Opus-U07)

**Evidence of prior capture:** `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop.md` (status: open). GitHub Issues #26, #32, #33 (all closed with v1.19.0 fix).

**Still present:** v1.19.0 shipped the three-mode system. However, the cross-runtime distribution gap (see RECURRED R3) means projects without local GSDR still run the old behavior. The local apollo patch that added exploratory semantics was the basis for the v1.19.0 fix, but projects that don't install GSDR still get upstream GSD without mode routing.

**Classification:** PARTIALLY-ADDRESSED for GSDR-installed projects; KNOWN-UNADDRESSED for non-GSDR projects.

---

### KU10 — Spike Workflow Lacks Structured Limitations and Critique Sections (U06 / Opus-U23)

**Evidence of prior capture:** `sig-2026-03-30-spike-design-lacks-independent-critique-gate.md` (global KB, status: detected). `sig-2026-03-30-no-artifact-type-for-standing-methodology.md` (global KB).

**Still present:** The spike DESIGN.md template was not updated to include mandatory limitations or critique sections. No workflow change was made.

**Severity:** Notable. Affects every spike-heavy project (arxiv-sanity-mcp, vigil, blackhole).

---

### KU11 — Quick-Task Commits Runtime Code Directly to Main Without CI Gate (U36 / Opus-U11)

**Evidence of prior capture:** Signal `2026-04-02-quick-task-code-changes-committed-directly-to-main.md` (project signals, 2026-04-02). Signal `2026-03-06-agent-bypassed-quick-cycle-for-coinstall-fix.md` (global KB).

**Still present:** No structural enforcement was added to prevent quick-tasks from committing runtime code changes directly to main. The signal exists; no fix was shipped.

**Severity:** Critical. Any quick-task touching runtime code can ship unreviewed, unverified changes.

---

### KU12 — Upstream/Fork Feature Name Confusion (U52 / Opus-U51)

**Evidence of prior capture:** `sig-2026-03-26-codex-signal-semantics-confusion.md` (project signals, related). The `--auto` semantic confusion between upstream GSD and GSDR is documented.

**Still present:** Session 02807c65 (2026-03-26) showed the agent treating upstream `--auto` as semantically equivalent to GSDR `--auto`. No disambiguation mechanism or nomenclature diff was added.

**Severity:** Notable. Affects any session working across GSD/GSDR boundaries.

---

### KU13 — Codex CLI Reliability: Auth, Hang, Wrong Invocation (U30, U26 / Opus-U40, U42)

**Evidence of prior capture:** Multiple signals about Codex CLI issues exist. No specific signal for the 6+-attempt debugging loop or stdin hang found.

**Still present:** Sessions fb3a0a76 (2026-04-06), 7ba47151 (2026-04-03), and 4f9af08b (2026-04-06) all show Codex CLI reliability failures. No harness changes were made to add preflight checks.

**Severity:** Critical. Multi-hour debugging loops and wrong-process kills are high user-cost failures.

---

### KU14 — Handoffs Convey Content Not Weight / Context Loss After Pause (U05, related / Global KB)

**Evidence of prior capture:** `sig-2026-03-30-handoffs-convey-content-not-weight.md` (global KB). `sig-2026-03-30-continue-here-lacks-required-reading-and-anti-patterns.md` (global KB).

**Still present:** The pause-work / resume-work workflow was not updated to enforce weight signals or require anti-pattern acknowledgment.

**Severity:** Notable. Recurs across multiple projects.

---

### KU15 — Emergency Fix Bypasses PR/CI/Release Workflow (U48 / Opus-U03)

**Evidence of prior capture:** `sig-2026-02-17-release-process-fragile-manual-steps.md`. `sig-2026-03-30-release-workflow-forgotten-in-milestone-completion.md`.

**Still present:** Session cb3ee1b7 (2026-03-30) and surrounding sessions show emergency fixes bypassing the release workflow. No structural enforcement.

**Severity:** Notable. Creates inconsistency between what's in git and what's actually shipped.

---

### KU16 — Inline Research Bloats Main Context (U58 / Opus-U25)

**Evidence of prior capture:** `2026-02-11-agent-inline-research-context-bloat.md` (GSDR signals). `2026-02-11-signal-workflow-context-bloat.md`. `sig-2026-03-30-pause-work-assumes-phase-scoped-work.md`.

**Still present:** Sessions 2e41c1ff (vigil, 2026-04-06) and 7f423906 (blackhole, 2026-04-03) confirm spike workflow research still runs inline. No delegate path was added.

**Severity:** Notable. Context exhaustion affects session quality and forces truncation.

---

### KU17 — macOS GUI Automation Constraints Repeatedly Break Promises (U67 / Opus-U55)

**Evidence of prior capture:** Multiple vigil session signals about macOS GUI automation limitations. Not a GSDR gap per se but a recurring user expectation mismatch.

**Still present:** Session e044f032 (vigil, 2026-03-27) and follow-on vigil sessions show the pattern persisting.

**Severity:** Notable (project-specific, but high recurrence cost).

---

### KU18 — NotebookLM Caching Behavior Interferes With Research (U69, U68 / Opus-U45)

**Evidence of prior capture:** No GSDR signal found. External tool behavior, not a GSDR gap.

**Still present:** Sessions 88d4dd53 and 51d08d98 both show the issue. The one-question-per-session workaround was discovered but not formalized.

**Classification:** KNOWN-UNADDRESSED (user workaround exists; no GSDR signal was filed to track the tooling dependency risk).

**Severity:** Minor. External tool, but affects research workflow reliability.

---

### KU19 — Upstream Feature Adoption Verification Did Not Check File Completeness (U29 / Opus-U20)

**Evidence of prior capture:** `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop.md`. `2026-03-27-wholesale-workflow-adoption-did-not-include-a-depe.md`. Signal `2026-03-27-plan-03-adopted-discuss-phase-md-without-detecting.md`.

**Still present:** No file-completeness check was added to the upstream adoption workflow. Session 291fb270 (2026-04-03) confirmed that discuss_mode feature files were still missing after the adoption was supposedly complete.

**Severity:** Notable. Adoption verification checks pass/fail not completeness/correctness.

---

### KU20 — Background Sensor Model Selection Is Implicit (U42 / Opus-U16)

Already covered in KU7. Merged.

---

### KU21 — Agent Speculates Before Verifying Facts (U43 / Opus-U17)

**Evidence of prior capture:** `sig-2026-03-04-deliberation-skill-lacks-epistemic-verification.md` (GSDR signals, related). Multiple signals about epistemic gaps.

**Still present:** Session 9b4aa82a (GSDR, 2026-03-29) showed speculation about model-history facts before verification. No protocol or checkpoint forces verification-first.

**Severity:** Notable. Affects any session where historical or factual claims are made.

---

### KU22 — Add/Insert Phase Command Semantics Confusion (U10 / Opus note)

**Evidence of prior capture:** No specific signal found. Related to phase management workflow specification gaps.

**Still present:** Session 00ea5720 (blackhole, 2026-04-05) showed insert/add confusion causing wrong roadmap edits.

**Severity:** Minor. Rare but produces incorrect roadmap state.

---

## Addressed (Verified Fixed)

Fixes committed; no evidence of recurrence after the fix date.

### A1 — $HOME Path Doubling in Global Install (U46 component / Opus-U01)

- **Fix:** commit ddd7b99a (v1.18.1, 2026-04-02). `fix(installer): prevent $HOME path doubling in global replacePathsInContent`.
- **Verification:** The 91-file destructive cascade was caused by a combination of wrong agent type AND this installer bug. The installer bug is fixed. No post-fix recurrence observed in sessions after 2026-04-02.
- **Note:** The wrong-agent-type dispatch gap (no abort semantics) is still unaddressed — classified NEW (N1).

---

### A2 — gsdr-local-patches Directory Collision Between GSD and GSDR (U65 / Opus-U46)

- **Fix:** commit 94f7ec7f (v1.18.1, 2026-04-02). `fix(installer): namespace local patches directory to gsdr-local-patches`.
- **Verification:** Collision was the concrete failure mode in session c82e801b (vigil, 2026-04-02). Fix shipped same day. No post-fix session shows the directory conflict. GitHub Issue #27 closed.

---

### A3 — Model Resolver gsdr- Prefix Normalization (Issue #30)

- **Fix:** commit 5deaa765 (v1.18.3, 2026-04-02). PR #31 merged.
- **Verification:** Session 9b4aa82a (GSDR, 2026-03-29) showed models falling back to sonnet. Fix shipped 2026-04-02. No post-fix recurrence observed.

---

### A4 — Squash Merge: Workflow Doc Updated (U37, partial)

- **Fix:** commit b7211068 (v1.18.2, 2026-04-02). `--merge` now specified in offer_next.
- **Verification:** The instructional fix is in place. However, behavioral recurrence is possible (see RECURRED R2). Classified PARTIALLY-ADDRESSED.
- **Note for this section:** The doc fix is addressed. The structural enforcement gap remains.

---

### A5 — CI Cache Cross-Project Pollution (sig-2026-03-28-ci-cache-cross-project-pollution-bug-inf-01)

- **Fix:** commit ecaa854d (2026-03-28, v1.18.0). `fix(54-01): scope CI cache per-project to prevent cross-project pollution`.
- **Verification:** The fix was shipped in v1.18.0. No post-fix recurrence observed.

---

### A6 — Upstream discuss-phase --auto Decision-Locking (for GSDR-installed projects)

- **Fix:** commit e4ae09b0 (v1.19.0, 2026-04-02). Three-mode discuss system. Issues #26, #32, #33 closed.
- **Verification:** The GSDR local install now has exploratory mode as default. Confirmed in `.claude/get-shit-done-reflect/workflows/discuss-phase.md` — DISCUSS_MODE routing is present.
- **Note:** This is ADDRESSED for GSDR-installed projects only. Projects without local GSDR remain RECURRED (see R3).

---

### A7 — execute-phase offer_next respects branching_strategy (partial)

- **Fix:** commit 26865a22 (v1.18.2, 2026-04-02).
- **Verification:** The workflow doc is updated. Partially addressed — see RECURRED R1 for the incomplete enforcement aspect.

---

### A8 — Independent cross-model audit capability demonstrated (U25 / Opus-U38)

This is a positive observation, not a defect. The cross-model audit in session fb3a0a76 (2026-04-06) demonstrated that adversarial external review works and catches bugs self-verification misses. This is ADDRESSED as a capability (though N12 captures the gap of not requiring it).

---

### A9 — Log Sensor Agent Implemented (from disabled stub)

- **Context:** Issues #35 (open) covers the log sensor stub. However, reading `agents/gsd-log-sensor.md` in the current source shows a fully implemented sensor spec — not a stub. The sensor contract (EXT-02), progressive deepening strategy, and tool use instructions are all present.
- **Caveat:** The source has an implementation but `# [Extraction logic — see extract-session-fingerprints.py...]` comment at line 84 suggests there may be a runtime dependency on external scripts. Issue #35 remains open, suggesting this is not yet fully deployable.
- **Classification:** PARTIALLY-ADDRESSED (see Partially Addressed section).

---

## Partially Addressed

Fixes exist but the finding is broader than what was addressed, or the fix is instructional not structural.

### PA1 — discuss-phase --auto Semantics (U19, U28, U44)

The three-mode discuss system was shipped (v1.19.0). This fixes the semantics for projects with GSDR locally installed. But:
- Projects without local GSDR installs run unpatched global GSD (no mode routing).
- The installation lag means new GSDR versions only apply after `node bin/install.js` is run.
- No auto-update mechanism exists.

**What's still needed:** Auto-update check on session start; or a cross-project install broadcast mechanism.

---

### PA2 — Squash Merge Prevention (U37)

The workflow doc now says `--merge`. But:
- No git hook enforces this.
- Headless sessions may not read this guidance.
- The `status: active` signal shows the team hasn't closed this as fixed.

**What's still needed:** Structural enforcement (git hook or wrapper alias).

---

### PA3 — Signal Lifecycle: 6+4 Stale Signals Transitioned (U50)

Commits ac2ba302 and 4164ddd6 (v1.18.2) transitioned 10 stale signals to remediated. But:
- 171/187 signals remain in "active" state.
- No new lifecycle states (proposed/in-progress/blocked) were added.
- The 0% remediation closure rate is a schema/process problem, not a data problem.

**What's still needed:** New lifecycle states + tooling to track remediation, not just manual bulk transitions.

---

### PA4 — Log Sensor Implementation (U15, U16, U17)

The `gsd-log-sensor.md` agent spec exists and is substantive. But:
- GitHub Issue #35 remains open ("Log sensor (gsdr-log-sensor) is only a disabled stub").
- The `collect-signals` workflow may not be correctly routing to this sensor.
- Source/registry/runtime divergence noted in the GPT synthesis (1f divergence table) is unresolved.

**What's still needed:** Close the source-of-truth gap; confirm sensor runs in `collect-signals`; close Issue #35.

---

### PA5 — offer_next Branching Strategy (U10)

The execute-phase workflow was updated to respect `branching_strategy`. But the fix only fires when the config value is non-`"none"`. Projects on `"none"` (the default for most projects) still get the old skip-PR behavior.

**What's still needed:** Either change the default or make the PR checkpoint unconditional.

---

### PA6 — Quick-Task CI Gate (U36)

Signal was filed. No structural enforcement was added. The signal captures the pattern but `/gsdr:quick` still allows direct-to-main commits for runtime code.

**What's still needed:** `/gsdr:quick` should detect when changes touch runtime code paths and require a branch + PR flow.

---

### PA7 — Upstream Adoption Verification (U29)

The adoption verification ran and passed for the discuss-phase adoption in Phase 52. But 5/8 files were silently dropped. The verification checked "are the files present?" at a coarse level, not "are all dependent files present and correctly wired?"

**What's still needed:** Upstream adoption checklist that enumerates dependent files and verifies each is present in the installed/source copy.

---

### PA8 — Cross-Runtime Upgrade / Install Drift (Issue #17, KU5)

Issue #17 is open. Some patches were shipped (installer namespace fix, $HOME path doubling). But the broader drift problem — cross-machine state synchronization, divergence detection, authority manifests — remains completely unaddressed.

**What's still needed:** Authoritative version manifest; divergence detection on session start; upgrade-project automation for cross-machine consistency.

---

### PA9 — Agent Protocol Compliance (Opus Theme 5)

Memory notes and workflow docs capture the "protocol before action" principle. But the agent compliance is reactive: it agrees when caught but doesn't proactively check. No structural mechanism (pre-dispatch protocol verification, required confirmation for known-risky actions) was added.

**What's still needed:** Pre-dispatch checklist for high-risk actions (releases, headless launches, destructive operations).

---

### PA10 — Verifier / Progress Status Claims (U70, U27, U71)

`gsdr:progress` was not changed. The verifier redesign was recommended but not scoped or shipped. CI quality gate enforcement was not added. The pattern of checking process presence not deployment reality persists.

**What's still needed:** `/gsdr:progress` to resolve CI status from GitHub Actions; verifier to require evidence traceability; CI enforcement check (verify that failures actually fail).

---

## Model & Version Annotations

**Session-to-version mapping (key sessions):**

| Session | Date | Machine | GSDR version at time | Model | Finding(s) |
|---------|------|---------|---------------------|-------|-----------|
| fdd15155 | 2026-03-20 | dionysus | v1.17.4 | claude-opus-4-6 | U71 (CI theater) |
| 7b8cf8ae | 2026-03-20 | dionysus | v1.17.4 | claude-opus-4-6 | U06-U09 (spike methodology) |
| bb8a9df5 | 2026-03-27 | dionysus | v1.17.5 | claude-opus-4-6 | U33-U34 (plan checker skip, pitfall ignored) |
| 41c5d67b | 2026-03-28 | dionysus | v1.17.5 | claude-opus-4-6 | U37 (squash merge), U10 (offer_next skip) |
| 7e77edff | 2026-03-28 | dionysus | v1.17.5 | claude-opus-4-6 | U41 (no scope-revision path) |
| 9b4aa82a | 2026-03-29 | dionysus | v1.17.5 | claude-opus-4-6 | U42 (sensor model implicit), U43 (speculation) |
| cb3ee1b7 | 2026-03-30 | dionysus | v1.18.0 | claude-opus-4-6 | U46 (91-file cascade), U47 (no self-signal), U50 (signal lifecycle) |
| eb9541ff | 2026-03-30 | dionysus | v1.18.0 | claude-opus-4-6 | U51 (plan checker severity bias) |
| 081de5ed | 2026-04-02 | dionysus | v1.18.x pre-release | claude-opus-4-6 | U36 (quick-task to main) |
| 7c46a5cd | 2026-04-02 | dionysus | v1.18.x → v1.19.0 | claude-opus-4-6 | U38 (stale .continue-here), U39 (wrong headless mode), U40 (version burn) |
| c767da7b | 2026-04-03 | dionysus | global GSD 1.30.0* | claude-opus-4-6 | U19 (discuss --auto decision-locking) |
| 291fb270 | 2026-04-03 | dionysus | global GSD 1.30.0* | claude-opus-4-6 | U28-U29 (discuss-mode post-fix recurrence) |
| 7ba47151 | 2026-04-03 | dionysus | v1.19.0 | claude-opus-4-6 | U30 (Codex CLI 6-attempt loop) |
| c82e801b | 2026-04-02 | apollo | v1.17.5 | claude-opus-4-6 | U65 (shared backup dir) |
| fb3a0a76 | 2026-04-06 | apollo | v1.19.0 | claude-opus-4-6 | U24 (wrong PID), U27 (verifier overclaim), U26 (Codex hang) |
| 5a9bbf1c | 2026-04-05 | apollo | v1.19.0 | claude-opus-4-6 | U15 (log sensor stub) |
| 622b1a8d | 2026-04-06 | apollo | v1.19.0 | claude-opus-4-6 | U16-U17 (log sensor registry divergence) |
| 7f423906 | 2026-04-03 | apollo | v1.19.0 | claude-opus-4-6 | U18 (SpaceEngine gate unilateral), U21 (repeated premature closure) |
| 4f9af08b | 2026-04-06 | apollo | v1.19.0 | claude-opus-4-6 | U14 (Claude spawned instead of Codex) |
| 2c1aa264 | 2026-04-05 | apollo | v1.19.0 | claude-opus-4-6 | U55 (100% failure accepted), U56 (message truncation) |
| c4c15beb | 2026-04-04 | apollo | v1.19.0 | claude-opus-4-6 | U64 (false falsification conclusion) |
| 7159dba1 | 2026-04-06 | apollo | v1.19.0 | claude-opus-4-6 | U59 (contamination-aware pilot launched anyway) |
| a9f00be2 | 2026-03-27 | apollo | v1.17.5 | claude-opus-4-6 | U63 (framework locked without hardware validation) |

*Projects without local GSDR installs on dionysus run global GSD (v1.30.0 upstream), not GSDR.

**Model patterns:**
- All sessions used `claude-opus-4-6`. This means model-level behaviors (premature closure, protocol-reactive-not-proactive compliance) are not model-selection artifacts — they are consistent behaviors of Opus 4.6 in this harness.
- The single sonnet session (e4962226) was a short installer-fix worktree session with no findings.
- The `<synthetic>` entries are tool-call result injections in multi-agent sessions, not separate model invocations.

**Cluster-by-version analysis:**
- Pre-v1.18.0 (before 2026-03-30): Most workflow-transition and installer bugs (U36, U37, U38, U40, U41, U46, U65) cluster in this period. Many were fixed.
- v1.18.0 → v1.19.0 (2026-03-30 to 2026-04-02): The destructive cascade (U46, U47) occurred at v1.18.0. Emergency fixes shipped same day as multiple patch releases.
- Post-v1.19.0 (2026-04-02+): The unaddressed patterns dominate — premature closure (U55, U59, U64), Codex CLI failures (U24, U26, U30), log sensor authority (U15-U17), verifier overclaim (U27). None of these were addressed by any release.
- The "closure beats inquiry" cluster (C1 in GPT synthesis) appears in every version period, confirming it is a model-level behavioral pattern not a version-specific bug.

---

## Summary and v1.20 Prioritization

**Highest priority (RECURRED — thought fixed, actually not):**
1. R4 (no self-signal after cascade) — needs a structural checkpoint
2. R6 (no lawful scope-revision path) — `/gsdr:revise-phase-scope` is missing
3. R8 (stale .continue-here trusted) — 3 months of recurrence, 3+ signals, no fix
4. R3 (discuss-mode distribution gap) — fix is real but unreachable without auto-update
5. R1/R5 (offer_next skip / premature closure) — behavioral patterns needing structural countermeasures

**Highest priority (NEW — not yet captured at all):**
1. N1 (no abort semantics for wrong-agent dispatch)
2. N2 (verifier checks presence not spec conformance)
3. N4 (PID-based kill hits wrong project)
4. N8 (decimal-phase parser failure)

**Highest priority (KNOWN-UNADDRESSED — confirmed still present):**
1. KU1 (signal lifecycle 0% remediation closure)
2. KU5 (cross-runtime install drift not detected)
3. KU3 (plan checker severity downgrade bias)
4. KU11 (quick-task to main without CI gate)
5. KU13 (Codex CLI reliability)
