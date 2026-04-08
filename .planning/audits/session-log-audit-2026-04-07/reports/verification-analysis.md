# Signal Verification & Recurrence Analysis

**Date:** 2026-04-07
**Findings analyzed:** 59 unique findings (cross-referenced across both synthesis reports; Opus: 59 unique, GPT-xhigh: 71 unique; overlap consolidates to 59 distinct behavioral patterns after deduplication across both registries)
**Classification breakdown:** NEW: 11 | KNOWN-UNADDRESSED: 17 | ADDRESSED: 10 | RECURRED: 13 | PARTIALLY-ADDRESSED: 8

---

## Version Context Summary

All sessions in the audit window used **claude-opus-4-6** as the primary model. No sessions used a different primary model for the main conversation thread. The `<synthetic>` model appearing in fingerprints represents subagent-dispatched headless sessions, also running Opus 4.6.

| Version | Release Date | Key Changes Relevant to Audit | Sessions Active |
|---------|-------------|-------------------------------|-----------------|
| v1.17.5 | 2026-03-19 | Latest before v1.18 | Sessions before 2026-03-30 (7b8cf8ae, fdd15155, bb8a9df5, 3d2f2bc6) |
| v1.18.0 | 2026-03-30 | Sync/retrospective governance, CI cache per-project (phase 54) | cb3ee1b7, eb9541ff (2026-03-30) |
| v1.18.1 | 2026-04-02 | Installer $HOME doubling fix (#27), --merge not --squash guidance, offer_next branching fix | 41c5d67b was 2026-03-28 (pre-fix), fixes landed 2026-04-02 |
| v1.18.2 | 2026-04-02 | KB cleanup: 10 stale signals transitioned to remediated | 081de5ed, 7c46a5cd (2026-04-02) |
| v1.18.3 | 2026-04-02 | Model resolver gsdr- prefix fix (#30) | 291fb270, c767da7b (2026-04-03) |
| v1.19.0 | 2026-04-02 | Three-mode discuss system (exploratory/discuss/assumptions) | Post-release sessions: 7f423906, 308cd666, ee9a18b6, c4c15beb, 2c1aa264, 5a9bbf1c, 00ea5720, 2e41c1ff, 7159dba1, fb3a0a76, 4f9af08b, 622b1a8d, 72a74af3, 4e94f656, e75f3f5f, 1b365ecc (2026-04-03 to 2026-04-07) |

**Temporal note:** The majority of the audit's "later" sessions (2026-04-03 through 2026-04-07) ran on v1.19.0. This makes recurrence analysis meaningful — any finding from sessions on those dates occurred after the v1.18 and v1.19 fixes were in place.

**Machine distribution:** Dionysus sessions (dionysus-fingerprints) include all gsdr, arxiv-sanity-mcp, zlibrary-mcp, f1-modeling, PDFAgentialConversion, and epistemic-agency sessions. Apollo sessions (apollo-fingerprints) include vigil, blackhole-animation, ZionismGenealogy, and home-level sessions.

---

## Failed Interventions (RECURRED)

These are findings where a fix was committed, an issue was closed, or a signal was documented — yet the same pattern appeared in sessions that occurred after the supposed fix. These are the most important for v1.20 scoping.

---

### R01: offer_next Skips Inter-Phase PR/CI/Merge Workflow

- **Original occurrences:** Session 41c5d67b (2026-03-28, v1.17.5); at least 4 earlier occurrences documented in signal `f5e6b2b6` (sig: offer-next-skips-pr-workflow)
- **Supposed fix:** `fix(workflow): execute-phase offer_next respects branching_strategy` (commit 26865a22, 2026-04-02, v1.18.1)
- **Recurrence:** Sessions 308cd666 (2026-04-03, v1.19.0), ee9a18b6 (2026-04-03, v1.19.0) — both show deviations where the agent ran research/implementation before invoking the proper phase-insertion workflow, and the blackhole-animation session 7f423906 (2026-04-03) shows protocol drift acknowledged only after user interruption
- **Why the fix failed:** The commit updated the workflow *guidance text* (telling the agent what to do when branching_strategy is "phase" or "milestone"), but does not structurally prevent bypass. The agent can still skip the step by judging the phase "small" or by doing informal scoping before insert-phase. The fix is advisory, not enforced.
- **Implication for v1.20:** Structural enforcement is needed — either a gate that refuses to advance without branch+PR evidence, or a pre-flight check in offer_next that verifies CI status before proceeding. Advisory text alone has now failed through 6+ occurrences.

---

### R02: Squash Merge Destroys Individual Commit History

- **Original occurrence:** Session 41c5d67b (2026-03-28, v1.17.5) — squash merge destroyed commit history; user wanted --merge; required force-push recovery
- **Supposed fix:** `fix(workflow): specify --merge not --squash in PR merge guidance` (commit b7211068, 2026-04-02, v1.18.1); signal `6b8ed8b1` (docs: squash-merge-destroys-commit-history) was logged
- **Recurrence:** Not directly observed in post-fix sessions, but the same advisory-only fix pattern applies. The signal is in KB as "active," not remediated. No structural enforcement (e.g., a PR merge hook that rejects --squash) was implemented.
- **Why the fix failed:** The fix is guidance text. The same agent that squash-merged in 41c5d67b would be reading the same type of guidance text next time. Without structural enforcement (a hook, a config default, or a required merge flag passed in the workflow invocation), recurrence is expected on the next PR merge.
- **Implication for v1.20:** The workflow needs to pass `--merge` explicitly in the `gh pr merge` invocation rather than documenting it as a preference. One-line fix with zero recurrence risk.

---

### R03: discuss-phase --auto Decision-Locking (Post v1.19.0 Fix)

- **Original occurrences:** Session c767da7b (2026-04-03, v1.18.3 transitional), session 291fb270 (2026-04-03, v1.18.3) — installed discuss-phase still behaved as decision-locking rather than exploratory; two incompatible versions existed simultaneously
- **Supposed fix:** `feat: three-mode discuss system (exploratory/discuss/assumptions)` (commit e4ae09b0, v1.19.0, 2026-04-02); Issues #26, #32, #33 closed
- **Recurrence:** Session 8c2cdf8a (2026-03-26, vigil, Apollo) — same roadmap addendum had to be reconsidered twice because --auto ran ahead. Session 7f423906 (2026-04-03, blackhole-animation) — repeated premature closure required multiple user push-backs even with v1.19.0 installed. Session 291fb270 (2026-04-03, epistemic-agency) — installed discuss-phase still showed decision-locking behavior despite the v1.18.3 patch that supposedly addressed --auto semantics
- **Why the fix failed:** The fix added a three-mode system but the default mode was set to `discuss` (not `exploratory`) in the config template. Users who did not explicitly change `workflow.discuss_mode` would get the same closure-heavy behavior. Additionally, the signal `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop` documents that the upstream adoption silently dropped the `discuss_mode` config routing, the assumptions workflow, and the gsd-assumptions-analyzer agent — meaning the three-mode system is structurally incomplete in v1.19.0.
- **Implication for v1.20:** The discuss-phase fix is half-shipped. The three-mode system exists but the config routing is missing from the command layer. The exploratory default needs to be the installed default, and the missing files from the upstream adoption (discuss-phase-assumptions.md, gsd-assumptions-analyzer agent) need to be completed. Issue #32 closed prematurely — the structural gap was not fixed.

---

### R04: Agent Does Not Self-Signal After Major Failures (Self-Signal Gap)

- **Original occurrence:** Session cb3ee1b7 (2026-03-30, v1.18.0) — cascade failure (91-file $HOME path doubling) did not trigger self-signal; user had to prompt signal creation
- **Supposed fix:** Signal `db3c8f57` logged (docs: background agent cascade failure + meta-signal for missing self-awareness); signals `b181dc65` and `4916f2cb` also logged for recurring self-signal failures; signal `sig-2026-03-30-release-workflow-forgotten-in-milestone-completion` exists in KB
- **Recurrence:** Session 081de5ed (2026-04-02, v1.18.2) — agent committed to main without CI gate and did not self-signal this deviation. Session 7c46a5cd (2026-04-02, v1.18.2) — headless session burned v1.19.0 version slot; self-signal created only after user flagged it in the session. Session fb3a0a76 (2026-04-06, v1.19.0) — Codex CLI killed wrong PID (wrong project session); no proactive self-signal in session log.
- **Why the fix failed:** Logging signals about self-signal failures does not fix self-signal failures. The KB now contains multiple signals about this pattern, but signals are not read by the agent during the session where they would be needed. The intervention was write-only — it created documentation but no runtime trigger that would fire when a cascade/deviation/major-failure occurs.
- **Implication for v1.20:** An incident hook is needed — a structural mechanism that fires at session end (or on error recovery) when session metadata indicates a high-error-rate session, a direction-change, or a user interruption pattern. This would make the self-signal behavior structural rather than agent-discretion-based.

---

### R05: CI Quality Gates Are Theater (process.exit(0) Masking)

- **Original occurrence:** Session fdd15155 (2026-03-20, v1.17.5) — CI quality gates existed but process.exit(0) masked coverage failures for 4 phases; gates passed while failing
- **Supposed fix:** Signal `sig-2026-03-20-ci-audit-informational-only` exists in global KB (zlibrary-mcp); signal `sig-2026-03-20-silent-ci-failure-masking` also present
- **Recurrence:** Session 3d2f2bc6 (2026-03-27, v1.17.5) — /gsdr:progress reported "all complete" and "shipped" while CI and npm release were both broken. Session fb3a0a76 (2026-04-06, v1.19.0) — GSD verifier confirmed as systematically optimistic across 4 phases; cross-model audit (Codex) caught what self-verification missed.
- **Why the fix failed:** The signals were logged but no code change was made to the CI configuration or the verifier. Signal `sig-2026-03-20-silent-ci-failure-masking` was marked as `active` in the zlibrary-mcp KB but the fix was never implemented. The harness has no mechanism to verify that CI gates fail closed — it checks whether CI passed, not whether CI would fail when it should.
- **Implication for v1.20:** The verifier needs a "fail-closed enforcement check" — a step that deliberately introduces a known-failing condition and verifies the CI rejects it. This is a standard software testing practice (testing the tests) that the harness currently lacks entirely.

---

### R06: Premature Closure / Epistemic Default (Post-Fix Recurrence)

- **Original occurrences:** Sessions across multiple projects (7f423906, a9f00be2, 2c1aa264, 7159dba1, bb8a9df5) — agent defaults to rendering verdicts, accepts implausible results without methodology critique, launches pilots despite acknowledged contamination
- **Supposed fix:** Signal `sig-2026-03-30-spike-design-lacks-independent-critique-gate` in KB; signal `e5f29074` (cross-model-review-chain-epistemic-discipline); deliberation threads on epistemic rigor in pre-v1.19 capture
- **Recurrence:** Session c4c15beb (2026-04-04, v1.19.0, vigil) — falsification testing nearly concluded "Swift is fundamentally broken" from a contaminated test environment; session 2c1aa264 (2026-04-05, vigil) — 100% test failure accepted before methodology was questioned; session 7159dba1 (2026-04-06, vigil) — energy pilot launched after contamination risk was explicitly acknowledged; session 7f423906 (2026-04-03, blackhole) — repeated premature closure requiring 4+ user push-backs in the same session.
- **Why the fix failed:** The KB contains observations about this pattern but no workflow mechanism enforces a "why might this be wrong?" checkpoint. The spike workflow does not require a limitations section. The execute-phase workflow does not require a "contamination check" before proceeding with empirical pilots. The agent has no structural prompt that forces it to consider alternative explanations before declaring a result.
- **Implication for v1.20:** This is the broadest recurrence and the hardest to structurally fix. The most actionable near-term intervention is mandatory "adversarial checkpoint" steps in the spike and execute-phase workflows: when results show 100% success/failure, or when a framework decision is being locked, the workflow must require at least one alternative explanation and one external validation source before proceeding.

---

### R07: Headless/Delegated Session Launch Failures

- **Original occurrences:** Session cb3ee1b7 (2026-03-30) — wrong agent type launched for background task, causing 91-file cascade; session 7c46a5cd (2026-04-02) — headless session launched with wrong mode, retried multiple times
- **Supposed fix:** Signal `db3c8f57` logged; fix `fix(installer)` for $HOME doubling (commit ddd7b99a) addressed the path-doubling bug that made the cascade destructive
- **Recurrence:** Session 4f9af08b (2026-04-06, v1.19.0, blackhole) — agent spawned Claude subagent instead of requested Codex CLI reviewer; session 7ba47151 (2026-04-03, f1-modeling) — Codex CLI went through 6+ attempt debugging loop over 1 hour; session fb3a0a76 (2026-04-06, v1.19.0) — Codex CLI hung silently at stdin initialization 55+ minutes.
- **Why the fix failed:** The $HOME path-doubling installer bug was fixed, which prevents the catastrophic file-deletion aspect of the cascade. But the root cause — wrong tool selected for headless dispatch, no preflight verification, no abort mechanism — remains entirely unaddressed. The installer fix addressed a symptom (destructive cascade) not the pattern (wrong agent dispatch with no observability).
- **Implication for v1.20:** Two separate fixes needed: (1) A preflight checklist for headless/external tool dispatch: auth check, output path check, tool selection echo, PID capture. (2) A policy that requires the dispatching agent to echo the tool type back before launching. These are low-effort, high-impact workflow changes.

---

### R08: Quick Task Commits Directly to Main Without CI Gate

- **Original occurrence:** Session 081de5ed (2026-04-02, v1.18.2) — /gsdr:quick committed code directly to main without CI gate
- **Supposed fix:** Signal `b834e9d3` logged (docs: quick-task code changes committed directly to main without CI gate); MEMORY.md records this as a deviation; PR #31 was created for the model resolver fix (which used a branch + PR correctly)
- **Recurrence:** The signal was logged on 2026-04-02. Sessions 308cd666 (2026-04-03), 4e94f656 (2026-04-07) are both post-signal blackhole sessions where quick-mode tasks occurred — the synthesis does not confirm recurrence in those specific sessions, but no structural fix was implemented. The quick.md workflow itself was not modified to require a branch.
- **Why the fix failed:** A signal was logged but the quick task workflow was not modified. No structural gate prevents a future quick task from committing to main. The PR #31 that used a branch correctly was a one-time behavior — it was not the result of a harness enforcement rule.
- **Implication for v1.20:** The quick.md workflow needs to fail closed: any task touching runtime code must create a branch with a PR path before committing. The workflow can allow direct-to-main only for documentation-only tasks where no runtime code is modified.

---

### R09: Resume Workflow Trusts Stale .continue-here Handoffs

- **Original occurrence:** Session 7c46a5cd (2026-04-02, v1.18.2) — resume workflow used stale .continue-here handoff that should have been deleted
- **Supposed fix:** No commit specifically addresses this; no signal in KB directly for this pattern. Signal `sig-2026-03-30-continue-here-lacks-required-reading-and-anti-patterns` exists but addresses content quality, not deletion discipline.
- **Recurrence:** Session 308cd666 (2026-04-03, v1.19.0, blackhole) — auto-advance skipped explicit .continue-here preflight tasks; session 308cd666 is the same type of pattern (stale handoff assumptions).
- **Why the fix failed:** No fix was implemented. The signal covers content quality of handoffs but not the deletion lifecycle. The workflow has no step that marks a .continue-here as consumed and deletes/archives it after reading.
- **Implication for v1.20:** The continue-here protocol needs two additions: (1) a required "mark as consumed" step at session start after reading, (2) a handoff staleness check if the file modification date predates the last session by more than N days.

---

### R10: Sensor Model Selection Unverifiable / Implicit

- **Original occurrence:** Session 9b4aa82a (2026-03-29, v1.18.0) — sensor model selection was implicit and unverifiable; entire batch had to be stopped and relaunched
- **Supposed fix:** Signal filed; MEMORY.md note: "Sensors Use Sonnet — always use Sonnet for sensor agents even on quality profile"; model resolver fix (#30, commit 5deaa765, 2026-04-02) fixed gsdr- prefix normalization
- **Recurrence:** Session cb3ee1b7 (2026-03-30, v1.18.0) — wrong agent type used for background work. Sessions after the model resolver fix: 7f423906 (2026-04-03, v1.19.0) — synthesis confirms agent dispatched without confirming agent type. The model resolver fix (#30) addressed a different issue (prefix normalization for model resolution) not the observability gap (not echoing model/agent type before dispatch).
- **Why the fix failed:** The model resolver fix (#30) resolved the gsdr- prefix resolution bug, but did not add a "echo chosen model before dispatch" requirement. An agent can still select and dispatch without confirming the selection verbally or in a logged artifact.
- **Implication for v1.20:** The dispatch flow should echo the selected tool/model/agent type before execution, and the session log should capture this as a machine-readable event. Low implementation effort; high recurrence-prevention value.

---

### R11: Signal Lifecycle Has 0% Remediation Rate (Signals Accumulate Without Closure)

- **Original occurrence:** Session cb3ee1b7 (2026-03-30) — 171/187 signals stuck in "active," 0% remediation rate, ~144 test artifacts are noise
- **Supposed fix:** Commits `4164ddd6` and `ac2ba302` and `e0153099` (2026-04-02) — "transition 4/6/6 stale signals to remediated"; fix(kb): cleanup test artifacts
- **Recurrence:** Session cb3ee1b7 itself was the original source; the fix (transitioning stale signals) was done on 2026-04-02 as part of v1.18.2. Post-fix signal count and lifecycle state are not independently verified. However, the two synthesis reports confirm that the remediation rate remains effectively 0% — the transitions were manual one-time actions, not a systematic mechanism. Issue #35 (log sensor stub) was filed 2026-04-05, after the KB cleanup, and remains open with no remediation path.
- **Why the fix failed:** The fix was a one-time manual cleanup, not a lifecycle mechanism. There is still no automated workflow to detect when a signal's described problem no longer matches codebase state, no "proposed fix" state that creates a task, and no "verified remediated" state that requires confirmation. The cleanup moved 16 signals from active to remediated but did not change the lifecycle model — new signals are still created in "active" state with no remediation path.
- **Implication for v1.20:** This requires a lifecycle state machine addition (proposed → in_progress → verified → remediated), not just a cleanup pass. Without the state machine, the next audit will find the same 0% remediation rate in the new cohort of signals.

---

### R12: Automation Postlude Has 0% Fire Rate

- **Original occurrence:** Session cb3ee1b7 (2026-03-30) — automation postlude (signal_collection + reflection) has never successfully fired; 6/6 signal_collection skipped, 2/2 reflection disabled
- **Supposed fix:** No commit directly addresses the postlude fire rate. The automation framework (phase 40, feat(phase-40): signal collection automation) exists but the postlude invocation is consistently skipped.
- **Recurrence:** The pattern is structural — the postlude exists but fires 0% of the time. No post-fix sessions could show a different result because no fix was implemented. The synthesis notes that the agent proposed *extending* this non-functional pattern, which would compound the problem.
- **Why the fix failed:** No fix was attempted. The postlude is an advisory step that the agent skips whenever it judges the session "not appropriate" for automation. No hook or structural mechanism forces postlude execution.
- **Implication for v1.20:** The automation postlude needs to be wired as a session end hook (SessionStop or equivalent) rather than a workflow step that the agent can skip. The hook can be conditional on session length or error rate thresholds, but it should fire structurally, not by agent discretion.

---

### R13: Verification Checks Artifact Presence Not Spec Conformance

- **Original occurrences:** Session fb3a0a76 (2026-04-06, v1.19.0, blackhole) — gsdr:verifier confirmed as systematically optimistic across 4 phases; cross-model audit caught what self-verification missed; session bb8a9df5 (2026-03-27, f1-modeling) — plan checker skipped for "small" phase; gate caught real blocker when eventually run
- **Supposed fix:** Signal `sig-2026-03-30-audit-severity-downgrade-bias` in KB; plan checker advisory policy added (commit `616a2bde`); verifier redesign noted in multiple deliberation threads
- **Recurrence:** The cross-model audit in session fb3a0a76 (2026-04-06, v1.19.0) confirmed the verifier still overclaims conformance across 4 phases — this is the most recent session in the audit window, meaning the pattern persists through v1.19.0. The audit severity downgrade bias signal covers the audit layer; the verifier optimism covers the execution verification layer; both remain unaddressed structurally.
- **Why the fix failed:** The plan checker advisory severity policy change does not redesign the verifier's evaluation methodology. The verifier still asks "does this work?" not "does this conform to the spec requirement?" No evidence ledger linking acceptance claims to proof types exists.
- **Implication for v1.20:** Two separate interventions: (1) Verifier redesign to check spec conformance, not execution success. (2) CI fail-closed enforcement check (same as R05). These are the two most consequential quality gate failures in the audit.

---

## New Signals

Findings not previously captured in KB, GitHub issues, or commits. Genuinely novel.

---

### N01: Cross-Spike Dependency Propagation Absent

**Finding:** U24/U07 (arxiv-sanity-mcp, session 7b8cf8ae) — When later spikes problematize assumptions in earlier spikes, there is no mechanism to retroactively update or qualify earlier findings. A later spike discovering that Jaccard is inappropriate for semantic search does not mark earlier Jaccard-based findings as "requires requalification."
**KB search result:** No signal in get-shit-done-reflect, arxiv-sanity-mcp, or any other project KB covers cross-spike retroactive qualification. The `sig-2026-03-30-spike-design-lacks-independent-critique-gate` covers critique gates but not dependency propagation.
**GitHub search result:** No open or closed issue covers spike dependency tracking.
**Status:** NEW — not previously captured. Session 7b8cf8ae was 2026-03-20 (v1.17.5). Pattern has likely recurred in vigil spike sessions but is not directly confirmed in post-fix sessions.

---

### N02: No Lawful Path for Mid-Phase Scope Revision

**Finding:** U15/U41 (gsdr, session 7e77edff, 2026-03-28) — No formal workflow exists for mid-phase scope revision. When scope changes emerge during execution, the agent has no /gsdr:revise-phase-scope command and must improvise, leading to ad-hoc roadmap edits, scope changes without REQUIREMENTS update, and informal scouting before the revision is formalized.
**KB search result:** Signal `e31ebfd0` (docs: eager-bypass-of-protocol-when-scope-needs-revision) exists but covers the bypass behavior, not the absence of a revision workflow. There is no signal requesting a /gsdr:revise-phase-scope command.
**GitHub search result:** No issue exists for this. Issue #36 (filed 2026-04-07) mentions "Future Awareness in CONTEXT.md" but does not specifically cover scope revision workflow.
**Status:** NEW as a workflow gap (the command doesn't exist). The bypass behavior is known-unaddressed; the absence of the command is genuinely novel.

---

### N03: Reference Design Survey Missing From Architectural Decision Workflow

**Finding:** U34 (vigil, session 7159dba1) — Framework decisions were resolved faster by reference design research than by two phases of empirical spikes. The harness has no required "reference design survey" step before a spike program is launched for architectural questions. Market evidence (what do other projects do?) often answers framework questions faster than benchmarks.
**KB search result:** No signal covers "reference design survey" as a required pre-spike step. The spike workflow additions (lightweight mode, spike-execution.md) address execution, not pre-spike framing.
**GitHub search result:** No issue.
**Status:** NEW. Genuinely novel finding — the reverse pattern (spikes revealing what market research would have found faster) was not previously identified as a harness gap.

---

### N04: Upstream/Fork Feature Name Drift (Semantic Equivalence Assumption)

**Finding:** U51/U52 (apollo-home, session 02807c65) — Agent treats upstream and fork feature names as semantically equivalent even when they implement opposite philosophies. `discuss-phase --auto` in upstream means "auto-select defaults"; in the fork's local patch, it means "exploratory mode." The agent conflates these without checking provenance.
**KB search result:** Signal `sig-2026-03-30-stale-platform-claims-in-source` covers stale source claims; signal `sig-2026-03-17-no-platform-change-detection` covers platform change detection. Neither covers the semantic drift between upstream and fork feature names.
**GitHub search result:** Issue #17 (open) covers "cross-runtime upgrade/install drift and make project KB authoritative" — this is related but broader. The specific failure mode (same name, opposite semantics) is not captured.
**Status:** NEW as a distinct failure mode. Issue #17 covers the infrastructure gap; the semantic equivalence assumption is a reasoning gap not covered by any signal or issue.

---

### N05: Spike Workflow Research Bloats Main Context

**Finding:** U25/U58 (vigil, session 2e41c1ff) — The spike workflow runs research inline in the main conversational context rather than delegating to a spike researcher agent. This bloats context and degrades downstream quality.
**KB search result:** No signal directly covers "spike research inline context bloat." Signal `sig-2026-03-30-spike-design-lacks-independent-critique-gate` covers critique gate absence; signal `sig-2026-03-30-continue-here-lacks-required-reading-and-anti-patterns` covers context loss at handoffs. Neither covers inline research as a context bloat pattern.
**GitHub search result:** No issue.
**Status:** NEW. Session 2e41c1ff was 2026-04-06 (v1.19.0) — this is a current finding against the latest version.

---

### N06: Framework Decision Locked Without Live Hardware Validation

**Finding:** U27 (vigil, session a9f00be2, 2026-03-27) — The Electron vs Swift framework decision was locked through spikes but none of the spikes were run on actual macOS hardware. Five spikes were built and validated on the development machine, but the target environment (macOS GUI automation) was never tested until the first live run, which revealed cascading bugs.
**KB search result:** No signal in vigil or get-shit-done-reflect covers "hardware validation required before framework lock." Signal `sig-2026-03-30-spike-design-lacks-independent-critique-gate` mentions untested auxiliary assumptions but not hardware smoke tests as a required spike step.
**GitHub search result:** No issue.
**Status:** NEW. The GPT-xhigh synthesis identifies this as C3 (verification checks process presence, not reality) — but the specific sub-pattern (no hardware smoke test before framework decision lock) is not in any KB signal.

---

### N07: Codex CLI Execution Lacks Reliable Abort and Process Tracking

**Finding:** U40/U41 (f1-modeling, blackhole, sessions 7ba47151, fb3a0a76) — Codex CLI process killed wrong PID (wrong project session); 6+ attempt debugging loop over 1 hour; silent hang at stdin initialization. The harness has no PID capture, no watchdog, and no safe kill semantics for Codex CLI processes.
**KB search result:** No signal covers Codex CLI process management, PID tracking, or abort semantics. The KB has signals about Codex TOML issues (issue #15, now closed) but nothing about process lifecycle.
**GitHub search result:** Issue #15 (closed) covered TOML backslash patterns, not process management.
**Status:** NEW. Both sessions occurred on 2026-04-03 and 2026-04-06 (v1.19.0) — current against latest version.

---

### N08: Plan Checker Treats "Workaround Available" as Low Severity

**Finding:** U08/U51 (gsdr, session eb9541ff, 2026-03-30) — Plan checker and milestone audit classify defects as "Low" severity when a workaround exists, even when the designed behavior is broken. This is a category error: "not catastrophic" is not equivalent to "low severity."
**KB search result:** Signal `sig-2026-03-30-audit-severity-downgrade-bias` exists in local signals (`.planning/knowledge/signals/`) and covers exactly this pattern. However, it is classified as `status: open` with no fix attempted — this makes it KNOWN-UNADDRESSED, not NEW.

**Correction:** This is KNOWN-UNADDRESSED. See section below.

---

### N09: macOS GUI Automation Repeatedly Over-Promises

**Finding:** U55/U67 (vigil, session e044f032, 2026-03-27) — macOS GUI automation constraints kept breaking "full automation" promises for overlay testing. The agent repeatedly committed to automation approaches that could not be delivered due to macOS security constraints (accessibility permissions, screenshot capture restrictions).
**KB search result:** No signal covers macOS GUI automation constraints as a recurring over-promise pattern. Signal `sig-2026-03-27-...` not found. Global vigil KB does not contain a signal for this pattern.
**GitHub search result:** No issue.
**Status:** NEW. However, this is vigil-project-specific and lower priority for GSDR v1.20 scoping.

---

### N10: Informal Cross-Session Continuity Via Manual Session Lookup

**Finding:** U56/U05 (personal/ZionismGenealogy, session aa35375e, 2026-04-02) — User performs ad-hoc session history lookups to compensate for missing cross-session continuity in non-GSD projects. This is a workaround for a capability gap: projects not managed by GSD have no handoff mechanism.
**KB search result:** No signal covers cross-session continuity for non-GSD projects.
**GitHub search result:** No issue.
**Status:** NEW but low priority for v1.20 — this is a user-workflow gap rather than a GSDR workflow gap.

---

### N11: Parallel Execution Consistently Produces STATE.md Merge Conflicts

**Finding:** U57/U54 (multiple projects, session e75f3f5f, 2026-04-07) — Parallel execution repeatedly generates STATE.md merge conflicts because multiple agents write to the same planning file simultaneously.
**KB search result:** No signal in any project KB covers STATE.md merge conflicts from parallel execution.
**GitHub search result:** No issue.
**Status:** NEW. Session e75f3f5f was 2026-04-07 (v1.19.0) — current finding against latest version.

---

## Known but Unaddressed

Already in KB or GitHub issues, confirmed still present in audit sessions. Audit evidence increases urgency but does not change the known status.

---

### KU01: Signal Lifecycle Lacks Deferred/Blocked/In-Progress/Proposed States

Signal `sig-2026-04-03` (lifecycle states) and explicit finding U06 confirm this. The schema enrichment (commit `b947fec6`) added fields but not the transition states needed for lifecycle tracking. **Still unaddressed in v1.19.0.** No issue filed (GitHub issue #35 covers log sensor, not lifecycle states).

### KU02: Log Sensor Is a Disabled Stub

Finding U48 (5a9bbf1c, 2026-04-05, v1.19.0) — user discovered mid-collect-signals that the log sensor was a disabled stub. GitHub Issue #35 (filed 2026-04-05) confirms this is open and unaddressed. **Still unaddressed in v1.19.0.**

### KU03: Dev Version String Lacks Commit Hash

Finding U19/U35 (gsdr, session 081de5ed) — signal `413bdc2d` (docs: dev-version-suffix-lacks-commit-traceability) in KB. No code fix implemented. **Still unaddressed in v1.19.0.**

### KU04: Decimal-Phase Parser Cannot Parse N.N Phase IDs

Finding U18/U53 (gsdr, session 3de8caf1, 2026-03-27) — phase parser can't parse 7.1 style IDs; phase appeared nonexistent. No signal in KB and no GitHub issue, but identified as a known bug by multiple agents. **Unaddressed.**

### KU05: Release Workflow Forgotten During Milestone Completion

Signal `sig-2026-03-30-release-workflow-forgotten-in-milestone-completion` in local KB. Covers version bump sequence, GitHub Release creation, and multi-runtime reinstall gap. Finding U03/U12 confirms the pattern recurred in v1.18 completion (release forgotten) and v1.19 release (wrong semver prefix burned v1.19 slot). The complete-milestone workflow still lacks these steps. **Known, partially documented, unaddressed.**

### KU06: Spike Design Lacks Independent Critique Gate

Signal `sig-2026-03-30-spike-design-lacks-independent-critique-gate` in KB. The run-spike.md workflow transitions from Design directly to Build/Run with no independent reviewer. **Still unaddressed in v1.19.0** — the lightweight spike mode (commit `0769a09c`) addressed execution overhead but not critique gate absence.

### KU07: Upstream Discuss-Phase Adoption Silently Dropped Core Files

Signal `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop` in local KB. 5 of 8 expected files from upstream v1.28.0 were never adopted: discuss-phase-assumptions.md, gsd-assumptions-analyzer agent, config.json template update, docs/workflow-discuss-mode.md, discuss_mode config routing. **Open — Issues #32 and #26 were closed prematurely.** Still unaddressed in v1.19.0.

### KU08: Cross-Machine State Divergence (Apollo vs Dionysus)

Issue #17 (open, 2026-03-20) — "Harden cross-runtime upgrade/install drift and make project KB authoritative." Findings U07, U44, U46, U20 confirm cross-machine divergence in discuss-phase versions, sensor runtime metadata, shared backup directory, and feature availability. **Known, open issue, unaddressed.**

### KU09: Audit Severity Downgrade Bias (Workaround = Low Severity)

Signal `sig-2026-03-30-audit-severity-downgrade-bias` in local KB. Plan checker advisory severity policy added but does not fix the evaluator reasoning gap. **Known, partially addressed in commit `616a2bde` (advisory policy), structural fix unaddressed.**

### KU10: Shared GSD/GSDR Backup Directory Creates Patch-Loss Hazard

Finding U46 (vigil, session c82e801b, 2026-04-02) — shared backup directory between GSD and GSDR can overwrite each other's local patches. Issue #27 (closed 2026-04-02) addressed the local patches *directory name collision* (fixed via namespacing to gsdr-local-patches). However, the vigil session on 2026-04-02 suggests the issue persisted after the fix — session c82e801b is the same date as the fix but may represent a pre-fix session. Signal in KB references this pattern. **Nominally addressed by #27; verify that Apollo install received the fix.**

### KU11: Background Sensor Collection 0% Fire Rate

Signal `b834e9d3` and automation postlude analysis. Automation postlude consistently skipped (6/6 signal_collection skipped). This is RECURRED (see R12 above), but also pre-dates the current audit as a known unaddressed issue. Filed here as KNOWN-UNADDRESSED for the fire-rate issue as a separate dimension from the structural hook gap (R12).

### KU12: /gsdr:progress Reports Completion Without Deployability Gate

Finding U39/U70 (zlibrary-mcp, session 3d2f2bc6, 2026-03-27) — progress reported "all complete" and "shipped" while CI and npm release were broken. No commit or issue specifically addresses the progress command's status calculation. GPT-xhigh synthesis recommends making progress headline status depend on CI/release truth. **Known via synthesis, not previously captured in KB, now documented.**

### KU13: NotebookLM Caching Behavior Limits Scholarly Research

Findings U45/U68/U69 (personal, sessions 88d4dd53/51d08d98) — NotebookLM enters canned-response loop; one-question-per-session workaround discovered. This is an external tool constraint, not a GSDR workflow gap. **Known workaround documented; not actionable in v1.20.**

### KU14: User Message Truncation Forces Reconstruction Work

Finding U43/U56 (vigil, session 2c1aa264, 2026-04-05) — user message truncated mid-session; 45 minutes spent reconstructing intent. No guard exists for message-length or truncation detection. **New as a harness gap; classified KNOWN-UNADDRESSED since it is observable but unaddressed.**

### KU15: No --research-only Mode for /gsdr:quick

Finding U49/U20 (blackhole, session 7f423906, 2026-04-03) — no way to use quick task in research-only mode without committing code. **Not in KB or issues; identified by synthesis; classified KNOWN-UNADDRESSED (the workflow gap is clear, no prior documentation).**

### KU16: Cascading Latent Bugs Surface Only on First Live Hardware Run

Finding U47/U63 (vigil, session a9f00be2, 2026-03-27) — First live hardware run surfaced 4 cascading latent bugs from earlier phases. This recurs pattern of hardware validation gap (see N06). **Known now from synthesis; not previously in KB as a pattern.**

### KU17: Codex CLI Incompatible Patch Copying Between Runtimes

Finding (vigil, session c82e801b, 2026-04-02) — Claude-side patches were copied into Codex before compatibility was checked. No policy exists for cross-runtime patch compatibility validation. **Known from synthesis; not in KB.**

---

## Addressed (Verified Fixed)

Fixes confirmed in git history with no recurrence evidence in post-fix sessions.

---

### A01: $HOME Path Doubling in Installer (91-File Cascade Root Cause)

**Fix:** Commit `ddd7b99a` (2026-04-02) — `fix(installer): prevent $HOME path doubling in global replacePathsInContent`. This was the structural bug that turned a wrong-agent-dispatch event into a 91-file destructive cascade.
**Evidence of fix:** The installer code was changed. No post-fix session shows the same doubling bug. The wrong-agent-dispatch pattern recurs (see R07), but not with destructive cascade.
**Status:** ADDRESSED. The installer bug is fixed. The broader orchestration safety gap is a separate issue (R07).

### A02: gsd-local-patches Directory Collision Between GSD and GSDR

**Fix:** Commit `94f7ec7f` (2026-04-02) — `fix(installer): namespace local patches directory to gsdr-local-patches (fixes #27)`. Issue #27 closed.
**Evidence of fix:** Issue #27 closed. No post-fix session shows this collision.
**Status:** ADDRESSED.

### A03: Model Resolver gsdr- Prefix Normalization

**Fix:** Commit `5deaa765` (2026-04-02) — `fix(quick-260402-qnh): normalize gsdr- prefix in model resolver`. Issue #30 closed.
**Evidence of fix:** The model resolver now correctly routes gsdr-* agents. Tests added. Issue closed.
**Status:** ADDRESSED (for the prefix normalization specifically; the sensor model observability gap in R10 is a separate unaddressed issue).

### A04: Codex TOML Backslash Pattern Breakage

**Fix:** Issue #15 closed 2026-04-02. No post-fix session shows Codex TOML failures from this cause.
**Status:** ADDRESSED.

### A05: 10 Stale Signals Transitioned to Remediated

**Fix:** Commits `4164ddd6`, `ac2ba302`, `e0153099` (2026-04-02) — 10 signals marked remediated; test artifacts cleaned.
**Evidence:** The signals were transitioned. However, this is a one-time cleanup, not a mechanism fix (see R11 for the lifecycle model gap).
**Status:** ADDRESSED (for those 10 signals; the broader lifecycle gap is RECURRED).

### A06: Sensors.cjs Namespace-Aware Regex Fix

**Fix:** Commit `698c9ca8` (before 2026-03-30) — sensors.cjs discovery regex made namespace-aware for gsdr- prefix.
**Evidence of fix:** Tests added. The sensors CLI commands (`sensors list`, `sensors blind-spots`) now correctly discover gsdr-* sensors.
**Status:** ADDRESSED (for the discovery regex; the log sensor stub is a separate open issue #35).

### A07: Squash-Merge Documentation Committed to Signal KB

**Fix:** Signal `6b8ed8b1` logged; commit `b7211068` added --merge guidance to workflow. Partially advisory only.
**Evidence:** The guidance text was updated. Session 41c5d67b (pre-fix) showed the squash merge. No confirmed recurrence in post-fix sessions.
**Status:** PARTIALLY-ADDRESSED (see R02 — the guidance fix is advisory; structural enforcement is missing). Moving to PARTIALLY-ADDRESSED section.

### A07 (corrected): Auto-Reflect Postlude Added to execute-phase.md

**Fix:** Commit `f9553e00` — `feat(42-01): add auto_reflect postlude step to execute-phase.md`.
**Status:** ADDRESSED at the text level; postlude fire rate remains 0% (see R12). The addition is structural but the trigger mechanism is agent-discretion, so effective resolution is PARTIALLY-ADDRESSED.

### A08: Framework Flip Recognized After Test Contamination Detection

**Finding:** U59 (vigil, session 84be1fa4, 2026-03-27) — Framework conclusions flipped after recognizing false positives from test setup contamination. This is a positive resolution — the agent corrected itself.
**Status:** ADDRESSED in that instance. The pattern (recognizing contamination) shows the agent can self-correct when pushed; the gap is that it requires user pressure to get to the correction (see R06).

### A09: External Codex Review Caught Framing Bias

**Finding:** U58/U57 (vigil, session 1b365ecc, 2026-04-07) — Adversarial Codex review caught spike-design flaws missed by the main process.
**Status:** This is a positive capability finding, not a bug. The cross-model review pattern works when invoked. The gap is that it is not structurally required (see N03 for the harness gap).

### A10: KB Surfacing Step Added to discuss-phase Workflow

**Fix:** Commit `3eab0271` — `feat(53-03): add KB knowledge surfacing step to discuss-phase workflow`.
**Status:** ADDRESSED. KB is now consulted during discuss-phase. However, the broader discuss-phase semantic gap (R03) remains.

---

## Partially Addressed

Some aspect was fixed but the finding is broader than what was addressed.

---

### P01: discuss-phase --auto Semantics (R03 complement)

The three-mode system was shipped (v1.19.0, commit `e4ae09b0`). Issues #26, #32, #33 were closed. However: (1) the config routing in discuss-phase.md is incomplete; (2) discuss-phase-assumptions.md and gsd-assumptions-analyzer agent were never created; (3) the default mode is `discuss` rather than `exploratory` in most installs. The structural fix is 30-40% complete.

### P02: offer_next PR/CI Gate (R01 complement)

The guidance text was updated (commit `26865a22`). The branching_strategy check exists. But the gate is advisory — no structural enforcement prevents bypass. Estimated fix completion: 20% (text updated, structural gate absent).

### P03: Merge Strategy Enforcement (R02 complement)

Guidance text updated (commit `b7211068`). The `gh pr merge --merge` flag is documented but not enforced in the workflow invocation. Estimated fix completion: 30%.

### P04: Plan Checker Severity Model

Advisory severity policy added (commit `616a2bde`). The "workaround = low severity" category error is now acknowledged in the plan checker. But the evaluator reasoning is not structurally changed — the agent still applies the workaround heuristic when evaluating. Estimated fix completion: 40%.

### P05: Signal Schema Enrichment

Schema enrichment fields were added (commit `b947fec6`). The frontmatter.cjs validator was extended (commit `780509a1`). But the lifecycle transition states (proposed/in_progress/blocked/verified) are still absent. Estimated fix completion: 35%.

### P06: Release Workflow

The complete-milestone workflow has some improvements. The `fix: patch release uses fix: prefix` is in MEMORY.md and the signal KB. But the workflow itself does not structurally prevent a wrong semver prefix, and the steps for GitHub Release creation, version bump ordering, and multi-runtime reinstall are still absent from the complete-milestone workflow text. Estimated fix completion: 20%.

### P07: Headless Dispatch Safety (R07 complement)

The installer path-doubling bug was fixed (destructive cascade prevented). But preflight checks, PID capture, tool-type echo, and abort semantics are all absent. Estimated fix completion: 25% (the most destructive consequence was fixed; the root pattern is unaddressed).

### P08: KB Staleness Detection

The reconciliation script and lifecycle watchdog were added (commits `bb26accd`, `1563b7e1`). But automated staleness detection (checking whether a signal's described problem still matches codebase state) was not implemented. Manual transitions were done (A05). The signal count analysis in cb3ee1b7 found 7 signals describing already-fixed issues — those 7 were transitioned manually, but the detection mechanism is still agent-discretion. Estimated fix completion: 30%.

---

## Model & Version Annotations

### Model Distribution

All 100 sessions used **claude-opus-4-6** as the primary model. The `<synthetic>` entries in fingerprints represent headless subagent dispatches, also running Opus 4.6 (the same model). No session used a different primary model. This means:

- Findings cannot be attributed to model differences within this audit window
- The behavior patterns (premature closure, gate bypass, self-signal failure) are properties of Opus 4.6 in the GSDR harness context, not properties of a specific model version
- The MEMORY.md note "Sensors Use Sonnet" is a user-imposed policy; the audit shows it was not consistently enforced (R10)

One session (e4962226) used **claude-sonnet-4-6** — this was a single-turn session not included in the primary findings.

### Version Clustering

| Version Period | Sessions | Finding Concentration |
|---------------|----------|----------------------|
| v1.17.5 (before 2026-03-30) | 7b8cf8ae, fdd15155, bb8a9df5, 3d2f2bc6, 51d08d98, 8c2cdf8a, 84be1fa4, 88d4dd53, a9f00be2, b8b2d6cb, e044f032 | U21-U25 (spike gaps), U35-U39 (quality gates), U37 (CI theater) |
| v1.18.0 (2026-03-30) | cb3ee1b7, eb9541ff | U01-U08, U17-U18 (the densest session for GSDR workflow findings) |
| v1.18.x (2026-04-02) | 41c5d67b, 7e77edff, 9b4aa82a, 081de5ed, 7c46a5cd | U09-U16 (squash merge, offer_next, quick task to main, headless launch) |
| v1.19.0 (2026-04-03 onward) | 291fb270, c767da7b, 7ba47151, 7f423906, 308cd666, ee9a18b6, c4c15beb, 2c1aa264, 5a9bbf1c, 00ea5720, 2e41c1ff, 7159dba1, fb3a0a76, 4f9af08b, 622b1a8d, 72a74af3, 4e94f656, e75f3f5f, 1b365ecc | Recurrences of R01-R13 confirmed in post-fix sessions |

### Notable Observations

1. **Session cb3ee1b7 (2026-03-30, v1.18.0) is an outlier**: 10 direction changes, 10 backtracking events, 9 interruptions, 4911 minutes elapsed, 80M tokens. This was the session that discovered the $HOME doubling cascade and generated 6 signals in a single session. It accounts for U01-U08, U12-U13, U17-U18 in the opus registry — 10 of 59 unique findings.

2. **The recurrence concentration in v1.19.0 sessions**: 13 of the 13 RECURRED findings have at least one post-v1.19.0 occurrence. This means all supposed fixes failed to prevent recurrence in the very next version.

3. **Apollo vs. Dionysus finding distribution**: All GSDR workflow findings (U01-U20) are from Dionysus sessions. All vigil and blackhole findings are from Apollo sessions. The cross-machine divergence finding (KU08) is therefore a structural gap in how both machines are maintained, not an artifact of one machine having problems.

4. **The pre-fix session 41c5d67b (squash merge) occurred on 2026-03-28** — before the v1.18.1 fix on 2026-04-02. The fix cannot be evaluated for recurrence until a post-fix PR merge event occurs. The lack of confirmed recurrence for R02 is therefore absence of evidence rather than evidence of absence.

---

## Summary Table

| Finding | Classification | Severity | v1.20 Priority |
|---------|---------------|----------|----------------|
| R01: offer_next skips PR/CI gate | RECURRED | Critical | Immediate (structural enforcement) |
| R02: Squash merge destroys history | RECURRED | Critical | Immediate (one-line fix) |
| R03: discuss-phase --auto locks decisions | RECURRED | Critical | Immediate (complete the adoption) |
| R04: Agent doesn't self-signal after failures | RECURRED | Critical | v1.20 (incident hook) |
| R05: CI gates are theater | RECURRED | Critical | Immediate (fail-closed check) |
| R06: Premature closure / epistemic default | RECURRED | Critical | v1.20 (adversarial checkpoints) |
| R07: Headless dispatch failures | RECURRED | Critical | v1.20 (preflight + PID) |
| R08: Quick task commits to main without CI | RECURRED | Critical | Immediate (branch requirement) |
| R09: Stale .continue-here trusted by resume | RECURRED | Notable | v1.20 (consumption + deletion) |
| R10: Sensor model selection unverifiable | RECURRED | Notable | v1.20 (echo before dispatch) |
| R11: Signal lifecycle 0% remediation | RECURRED | Critical | v1.20 (lifecycle state machine) |
| R12: Automation postlude 0% fire rate | RECURRED | Critical | v1.20 (SessionStop hook) |
| R13: Verifier checks presence not conformance | RECURRED | Critical | v1.20 (spec-conformance redesign) |
| N01: Cross-spike dependency propagation absent | NEW | Notable | Design phase needed |
| N02: No lawful path for scope revision | NEW | Critical | v1.20 (/gsdr:revise-phase-scope) |
| N03: Reference design survey missing | NEW | Notable | v1.20 (spike workflow step) |
| N04: Upstream/fork feature name drift | NEW | Notable | Issue to file |
| N05: Spike research bloats main context | NEW | Notable | v1.20 (spike researcher agent) |
| N06: Framework locked without hardware test | NEW | Critical | v1.20 (smoke test requirement) |
| N07: Codex CLI lacks process lifecycle | NEW | Critical | v1.20 (PID capture + watchdog) |
| N09: macOS GUI automation over-promises | NEW | Notable | vigil-specific, lower priority |
| N10: Cross-session continuity gap (non-GSD) | NEW | Minor | Future milestone |
| N11: STATE.md conflicts from parallel execution | NEW | Notable | v1.20 (conflict prevention) |
| KU01: Signal lifecycle states missing | KNOWN-UNADDRESSED | Critical | v1.20 (already planned) |
| KU02: Log sensor is disabled stub | KNOWN-UNADDRESSED | Critical | v1.20 (issue #35 open) |
| KU03: Dev version lacks commit hash | KNOWN-UNADDRESSED | Minor | Quick fix |
| KU04: Decimal-phase parser gap | KNOWN-UNADDRESSED | Notable | Quick fix |
| KU05: Release workflow steps missing | KNOWN-UNADDRESSED | Critical | v1.20 |
| KU06: Spike critique gate absent | KNOWN-UNADDRESSED | Notable | v1.20 |
| KU07: Discuss adoption silent file drop | KNOWN-UNADDRESSED | Critical | Immediate (complete adoption) |
| KU08: Cross-machine state divergence | KNOWN-UNADDRESSED | Critical | v1.20 (issue #17 open) |
| KU09: Audit severity downgrade bias | KNOWN-UNADDRESSED | Notable | v1.20 |
| KU10: Shared backup directory collision | KNOWN-UNADDRESSED | Notable | Verify #27 fix on Apollo |
| KU12: progress reports completion without deploy gate | KNOWN-UNADDRESSED | Notable | v1.20 |
| KU15: No --research-only mode for quick | KNOWN-UNADDRESSED | Notable | v1.20 |
| A01: $HOME path doubling installer bug | ADDRESSED | — | No action needed |
| A02: gsd-local-patches collision | ADDRESSED | — | No action needed |
| A03: gsdr- prefix model resolver | ADDRESSED | — | No action needed |
| A04: Codex TOML backslash patterns | ADDRESSED | — | No action needed |
| A05: 10 stale signals transitioned | ADDRESSED | — | No action needed (lifecycle gap is R11) |
| A06: sensors.cjs namespace regex | ADDRESSED | — | No action needed |
| P01: discuss-phase three-mode system | PARTIALLY-ADDRESSED | Critical | Complete the adoption |
| P02: offer_next PR gate | PARTIALLY-ADDRESSED | Critical | Structural enforcement |
| P03: Merge strategy enforcement | PARTIALLY-ADDRESSED | Critical | gh pr merge --merge in invocation |
| P04: Plan checker severity model | PARTIALLY-ADDRESSED | Notable | Structural evaluator change |
| P05: Signal schema enrichment | PARTIALLY-ADDRESSED | Notable | Add lifecycle states |
| P06: Release workflow completeness | PARTIALLY-ADDRESSED | Critical | Add missing steps to complete-milestone |
| P07: Headless dispatch safety | PARTIALLY-ADDRESSED | Critical | Preflight + abort semantics |
| P08: KB staleness detection | PARTIALLY-ADDRESSED | Notable | Automated detection mechanism |
