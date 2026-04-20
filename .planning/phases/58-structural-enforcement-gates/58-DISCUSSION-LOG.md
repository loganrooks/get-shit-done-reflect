# Phase 58: Structural Enforcement Gates - Discussion Log

> **Justificatory sidecar.** Consumed by gsdr-context-checker for claim verification.
> Also serves as human-readable audit trail of discuss-phase decisions.

**Date:** 2026-04-20
**Phase:** 58-structural-enforcement-gates
**Mode:** exploratory --auto
**Areas discussed:** cross-cutting gate substrate; PR/CI/branch gates; `.continue-here` and anti-pattern severity; delegation hygiene; hook-dependent gates; discuss-phase richer adoption; GATE-09 scope-translation ledger; closeout reconciliation and release boundary; cross-runtime (XRT-01) per-gate declaration; meta-gate proposal

***

## Gray Areas (Audit Trail)

This was an exploratory `--auto` run with no interactive questions; gray areas were identified from the 2026-04-20 requirements_review audit and ROADMAP.md, not from a user selection. All areas were carried forward into the Working Model.

### Selection

| Area | Source | Auto-selected |
|------|--------|---------------|
| Cross-cutting gate substrate | ROADMAP.md:316-328 Success Criterion 1 + audit §6.1, §9.3 | ✓ |
| PR / CI / branch gates (GATE-01, 02, 03, 14) | REQUIREMENTS.md:218-224, 262 + audit Findings 2.1, 2.2, 2.3 + §3.5 | ✓ |
| `.continue-here` lifecycle + severity (GATE-04a/b/c) | REQUIREMENTS.md:224-228 + audit Finding 2.4 | ✓ |
| Delegation hygiene (GATE-05, 13) | REQUIREMENTS.md:230, 260 + audit Finding 2.5 + §3.3, §3.4 | ✓ |
| Hook-dependent gates (GATE-06, 07) — prerequisite-gated | REQUIREMENTS.md:232-234 + audit Findings 2.6, 2.7 + §4.2 | ✓ |
| Discuss-phase richer adoption (GATE-08a–e) | REQUIREMENTS.md:236-244 + audit Finding 2.8 | ✓ |
| GATE-09 scope-translation ledger (09a/b/c/d) | REQUIREMENTS.md:246-252 + audit Finding 2.9 + §6.2 | ✓ |
| Closeout reconciliation / release boundary / archive / parity (GATE-10, 11, 12, 15) | REQUIREMENTS.md:254-264 + audit §3.1, §3.2, §3.6, §3.7 + live in-repo evidence | ✓ |
| Cross-runtime (XRT-01) per-gate declaration | REQUIREMENTS.md:419 + audit Finding 2.10 + §5 | ✓ |
| Meta-gate proposal (GATE-99) | audit §6.5 | ✓ as open question |

No user selection was invoked — `--auto` exploratory mode surfaces all material gray areas and routes `[open]` ones to research rather than collapsing.

### Claude's Discretion

Recorded in CONTEXT.md `<working_model>` section 10:
- CLI shape of reconciliation subcommand
- Archive directory naming / retention
- GitHub Actions YAML structure
- Mandatory-understanding-check copy
- Ledger front-matter key ordering
- Pre-push hook vs branch-protection-only for GATE-14

### Deferred Ideas

Recorded in CONTEXT.md `<deferred>` section per audit §8 — all 8 items traced to named downstream phases (Phase 59, 60, 60.1, 61, or v1.21).

***

## Claim Justifications

### 1. Cross-cutting gate substrate

**[governing:reasoned] Structural enforcement means a mechanism that fires without the agent needing to remember to invoke it**
- **Source:** ROADMAP.md:305 headline commitment + audit §1 ("structural enforcement that cannot be circumvented by agent discretion") + audit §6.4.
- **Scope of governance:** applies to every GATE-01..15 adoption check; filter out candidates that reduce to advisory prose.

**[decided:cited] Every GATE must satisfy the four-property contract (substrate / fire-event / compositional coverage / Codex declaration)**
- **Alternatives considered:** (a) gate-by-gate case-by-case substrate judgment (current state); (b) looser three-property contract without Codex declaration; (c) advisory gates with measurement-only verification.
- **Why rejected:** (a) led to the very advisory-by-composition failures audit §7.2 names; (b) makes the cross-runtime note in REQUIREMENTS.md:10 stale permanently; (c) reduces Phase 58 to a documentation phase per the audit's §1 alternative reading that was explicitly rejected.
- **Citation:** audit §9.3 Acceptance Tests; ROADMAP.md:316-328 Success Criterion 1.

**[decided:cited] Fire-event surface: hook log entry / workflow-step stdout marker / `session-meta` field**
- **Alternatives considered:** bespoke measurement layer for Phase 58 gates; post-hoc signal synthesis only.
- **Why rejected:** Phase 57.5 extractor registry is the measurement seam per MEAS-ARCH-01..07; duplicating it was explicitly rejected in the measurement deliberation. Post-hoc only is what the existing advisory pattern already provides — not structural by DC-1.
- **Citation:** audit §6.1; ROADMAP.md:243-256 Phase 57.5 completion.

### 2. PR / CI / branch gates

**[assumed:reasoned] GATE-01 blocking substrate is best as CI rule (branch protection + required status check)**
- **Challenge protocol:** pre-push hook could be equivalent; hybrid (CI primary + hook fallback) could be stronger. Research must examine fit.
- **Evidence checked:** `sig-2026-04-10-phase-574-pr45-ci-clean-mergeable-baseline.md` shows CI + required checks already operational; audit §6.4 explicitly recommends CI-as-structural.
- **Why reasonable pending research:** CI is not bypassable via `/clear` or context loss, where workflow-file mechanics are bypassable; this is the core argument of audit §6.4.

**[decided:cited] GATE-02 enumerates every `gh pr merge` surface**
- **Alternatives considered:** generic "all merges use --merge" prose rule (the current REQUIREMENTS.md version).
- **Why rejected:** audit Finding 2.2 + §7.2 "advisory by composition" — one conforming site + three un-audited sites is exactly the failure pattern Phase 58 is replacing.
- **Citation:** audit Finding 2.2 (single conforming invocation at `execute-phase.md:793`, un-audited surfaces: `complete-milestone.md`, `gsd-ship` skill, release workflow).

**[decided:cited] GATE-03 ships with explicit detection rule**
- **Alternatives considered:** leave "detects" as text and let planner pick; add all three rules (glob, diff, manifest) simultaneously.
- **Why rejected:** leaving "detects" is exactly the scope-narrowing surface audit §10 describes; all-three is over-engineering before calibration. Research (Q1) picks or composes.
- **Citation:** audit Finding 2.3; pattern recurrence in quick `260419-6uf` 2026-04-19.

**[open] Which GATE-03 detection rule to ship — or how to compose them** (Q1)
- **What's been tried:** audit named three candidates; nothing implemented.
- **Why unresolved:** false-positive / false-negative rates not measured against 60-day quick-task corpus; Q1 defines the research program.
- **Research delegation:** enumerate direct-to-main quick-task commits, classify under each candidate rule, compare rates.

**[decided:reasoned] GATE-03 classifies ROADMAP.md and REQUIREMENTS.md as runtime-adjacent**
- **Alternatives considered:** treat as "pure prose docs" direct-to-main allowed.
- **Why rejected:** quick `260419-wjj` (2026-04-20) patched REQUIREMENTS.md — this is authoritative project state, not commentary. Audit §7.6 flags this ambiguity explicitly.
- **User said:** [none — this is pattern-evidence inference under --auto].

**[decided:cited] GATE-14 folds into GATE-01 CI enforcement**
- **Alternatives considered:** standalone pre-push hook; separate workflow step in every workflow.
- **Why rejected:** GATE-01 CI already blocks; GATE-14 duplication adds maintenance burden without adding strength. Pre-push hook remains an optional secondary defense (Claude's discretion).
- **Citation:** audit Finding 3.5 + §9.2.

### 3. `.continue-here` lifecycle (GATE-04a/b/c)

**[decided:cited] GATE-04a ships consumed-on-read archival (mv, not rm)**
- **Alternatives considered:** current `rm -f`; keep file + mark-as-consumed marker in-file.
- **Why rejected:** `rm -f` is what signal `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving.md` also flags; mark-in-file requires safe concurrent writes which is not the problem this gate solves.
- **Citation:** audit Finding 2.4 split recommendation.

**[decided:cited] GATE-04b hard-stop staleness**
- **Alternatives considered:** warn-only staleness; time-based expiry.
- **Why rejected:** warn-only is advisory (violates G-1); time-based doesn't capture the real staleness signal (newer mainline commits touching STATE.md).
- **Citation:** REQUIREMENTS.md:226; audit Finding 2.4.

**[decided:cited] GATE-04c mandatory understanding checks for blocking severity**
- **Alternatives considered:** just press-enter confirmation; automated acknowledgement.
- **Why rejected:** press-enter is the advisory pattern Phase 58 is replacing; automation defeats the purpose of a blocking gate.
- **Citation:** REQUIREMENTS.md:228; upstream anti-pattern severity precedent.

### 4. Delegation hygiene (GATE-05, GATE-13)

**[decided:cited] GATE-05 enumerates named delegation sites**
- **Alternatives considered:** keep "all delegation workflows" prose.
- **Why rejected:** audit Finding 2.5 — the motivation line biases implementation toward sensor-only; enumeration prevents that narrowing.
- **Citation:** REQUIREMENTS.md:230; signal `sig-2026-04-10-researcher-model-override-leak-third-occurrence.md` three-occurrence pattern affecting researcher, not just sensors.

**[decided:cited] GATE-13 owns compaction resilience (restate dispatch contract inline at spawn)**
- **Alternatives considered:** rely on memory / preferences (current state); rely on auto-compact tooling fixes upstream.
- **Why rejected:** memory is advisory; upstream timing is unknown (audit §7.4). Inline restatement is structural at the spawn site.
- **Citation:** signal `sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md`; REQUIREMENTS.md:260.

**[assumed:reasoned] GATE-05 and GATE-13 are related but distinct**
- **Challenge protocol:** could collapse into one gate if implementation proves redundant; research may find the distinction is cosmetic.
- **Evidence checked:** GATE-05 is visibility-on-echo (user sees misconfiguration); GATE-13 is context-resilience (compaction can't silently drop fields). Different failure modes, same spawn-site edit location.

### 5. Hook-dependent gates (prerequisite-gated)

**[projected:reasoned] Phase 57.9 is the prerequisite phase for GATE-06 / GATE-07**
- **Basis:** audit §9.1 split recommendation; ROADMAP.md:141-150 Phase 57.9 insertion post-audit; audit Findings 2.6, 2.7 show no substrate on either runtime today.
- **Future phase:** Phase 57.9 (no directory yet; no plans) — explicit dependency in ROADMAP.md:317.

**[decided:cited] Phase 58 does not duplicate 57.9 work; consumes the surface**
- **Alternatives considered:** bundle 57.9 work into Phase 58 Plan 01 (audit §9.1 alternative path).
- **Why rejected:** the split-phase pattern (narrow substrate phase before claim-heavy phase) is the same pattern Phase 55.2 used; bundling risks 57.9 hook work being under-scoped when stacked with 25 gate requirements.
- **Citation:** ROADMAP.md:317 dependency declaration; audit §9.1.

**[assumed:reasoned] If 57.9 not complete at plan-phase entry, 58 cannot honestly claim GATE-06/07**
- **Challenge protocol:** Acceptance Test AT-1 in CONTEXT.md formalizes this — either 57.9 complete or Phase 58 plan explicitly defers with GATE-09c provenance.

### 6. Discuss-phase richer adoption (GATE-08a–e)

**[decided:cited] GATE-08 splits into 08a–08e**
- **Alternatives considered:** single GATE-08 with adopt-all mandate.
- **Why rejected:** audit Finding 2.8 — GATE-08 as single requirement is a workplan disguised as a commitment; split enables independent verification.
- **Citation:** REQUIREMENTS.md:236-244 already has the split; audit Finding 2.8.

**[assumed:reasoned] Upstream's richer version will be re-fetched during Phase 58 research**
- **Challenge protocol:** the 671-line claim is 2-week-stale (REQUIREMENTS.md:236 has not been refreshed); upstream may have diverged further.
- **Evidence checked:** fork is at 279 lines on both mirrors (verified by audit); upstream not re-fetched in the audit — explicit chain-integrity gap at audit Finding 2.8 / §15.
- **Why reasonable pending research:** Q2 defines the re-fetch program; no point investing in adoption work against a stale baseline.

**[governing:reasoned] Narrowing requires named rationale under GATE-09c**
- **Source:** REQUIREMENTS.md:244 GATE-08e explicit text + GATE-09c scope-narrowing provenance rule.
- **Scope of governance:** any deviation from upstream's richer surface is a scope narrowing, subject to the same rule Phase 58 is introducing.

### 7. GATE-09 scope-translation ledger

**[decided:cited] GATE-09a ships as named artifact with schema, not prose**
- **Alternatives considered:** prose convention in PHASE-SUMMARY.md; enumeration only in VERIFICATION.md.
- **Why rejected:** audit §6.2 — named artifact enables verifier tooling (GATE-09d); prose convention is exactly the failure GATE-09 is meta-fixing.
- **Citation:** audit §6.2; measurement-infrastructure-epistemic-foundations.md §7.4.

**[open] Where does the ledger live — standalone NN-LEDGER.md / SUMMARY YAML / VERIFICATION frontmatter** (Q3)
- **What's been tried:** three candidate layouts named; none prototyped.
- **Why unresolved:** verifier implementation complexity differs per layout; KB schema additivity differs.
- **Research delegation:** prototype each against existing 57.7 closeout evidence (vision-drop diagnostic revision); check KB rebuild compatibility.

**[decided:cited] GATE-09b is a planning gate**
- **Alternatives considered:** advisory warning in plan-phase; opt-in check.
- **Why rejected:** advisory violates G-1; opt-in defeats reflexive application that Acceptance Test AT-5 requires.
- **Citation:** REQUIREMENTS.md:248.

**[decided:cited] GATE-09c narrowing-decision provenance**
- **Alternatives considered:** convention to cite claims in PR body; no enforcement.
- **Why rejected:** the whole point is structural enforcement of the narrowing-provenance link.
- **Citation:** REQUIREMENTS.md:250.

**[decided:cited] GATE-09d verifier contract uses 57.8 role-split provenance**
- **Alternatives considered:** verifier ignores role attribution; verifier uses flat pre-57.8 schema.
- **Why rejected:** ROADMAP.md:123-124 explicitly states Phase 57.8 is the epistemic prerequisite for GATE-09 attribution; flat schema cannot distinguish planner-miss from executor-miss (audit Finding 2.9 + §2.9).
- **Citation:** REQUIREMENTS.md:252; ROADMAP.md:123-124.

**[assumed:reasoned] "Load-bearing" means [decided:*], [stipulated:*], [governing:*], or tagged load-bearing; [assumed:*] via dependency table**
- **Challenge protocol:** edge cases may invert this — e.g., a [projected] claim may be load-bearing when cross-phase. Research must validate with test cases against existing phase CONTEXTs.
- **Evidence checked:** claim-types.md ontology ranks per-researcher-action; load-bearing semantics align with the action-required claims.
- **Why reasonable pending research:** correct in the typical case; edge cases are why Q defers to research.

### 8. Closeout reconciliation / release boundary / archive / parity

**[decided:cited] GATE-10 ships as structural step with gsd-tools substrate**
- **Alternatives considered:** workflow checklist; post-merge manual reconciliation.
- **Why rejected:** workflow checklist is advisory (violates G-1); manual is precisely the pattern with 5+6 occurrences in the last 72 hours.
- **Citation:** REQUIREMENTS.md:254; signals sig-2026-04-17/sig-2026-04-20; audit §3.1.

**[decided:cited] GATE-11 release-boundary assertion**
- **Alternatives considered:** milestone-close-only check; advisory note in execute-phase.
- **Why rejected:** phase-branch merge is the natural trigger; stale-N-days flagging must be structural per DC-1.
- **Citation:** REQUIREMENTS.md:256; signal `sig-2026-03-30-release-workflow-forgotten-in-milestone-completion.md`; audit Findings 3.1, 3.6.

**[decided:cited] GATE-12 mv-to-archive replaces rm of partial output**
- **Alternatives considered:** keep rm but add pre-rm logging; opt-in archive.
- **Why rejected:** per G-7 "evidence preservation over conservation"; signal shows 2 occurrences of the pattern with discretionary `rm`.
- **Citation:** REQUIREMENTS.md:258; signal `sig-2026-04-10-orchestrator-deletes-partial-output-instead-of-archiving.md`.

**[decided:cited] GATE-15 source↔installed CI check**
- **Alternatives considered:** pre-commit hook; release-time-only check.
- **Why rejected:** pre-commit is bypassable; release-time-only means drift can ship on every un-released commit (CLAUDE.md 23-day incident).
- **Citation:** REQUIREMENTS.md:264; CLAUDE.md:15-27.

**[projected:reasoned] GATE-10 and GATE-11 resolve the closeout seam**
- **Basis:** audit §7.1 names the seam as "phase implementation verified" vs "project operationally advanced"; GATE-10 + GATE-11 cover both sides.
- **Future phase:** Phase 58 ships the gates; post-Phase-58 observation (Phase 60.1 intervention-outcome loop) determines whether the seam is fully closed or whether audit §7.1 Reading B (workflow-ownership reframe) is needed.

### 9. Cross-runtime substrate declaration (XRT-01)

**[decided:cited] XRT-01 plan-phase assertion**
- **Alternatives considered:** advisory cross-runtime note (current state).
- **Why rejected:** "before implementation begins" has no enforcement hook today (audit Finding 2.10); plan-phase gate is the natural enforcement point.
- **Citation:** audit Finding 2.10; REQUIREMENTS.md:419.

**[decided:cited] Rewrite stale cross-runtime note in REQUIREMENTS.md:10**
- **Alternatives considered:** leave note as-is and override in per-gate declarations.
- **Why rejected:** stale note is factually falsified by research that was produced to inform the requirement (audit §5.1); leaving it creates ongoing confusion.
- **Citation:** audit §5.1; `cross-runtime-parity-research.md:70-80`.

**[decided:cited] Per-gate Codex behavior table is part of plan scope**
- **Alternatives considered:** defer to XRT-01 as separate workstream; defer to v1.21.
- **Why rejected:** audit §5.3 table already exists as the 10×3 input; authoring the definitive version is a plan deliverable, not a separate phase.
- **Citation:** audit §5.3, §9.3 Acceptance Test #4.

### 10. Meta-gate proposal

**[open] Adopt meta-gate (GATE-99 or embedded in 09d)?** (Q5)
- **What's been tried:** audit §6.5 proposes; no implementation.
- **Why unresolved:** emission substrate cost is unknown — if Phase 57.5 extractor registry can observe gate events natively, cheap; if not, new sensor work required.
- **Research delegation:** check registry capability for native gate-event extraction; decide cost/benefit.

### Claim Dependencies

See CONTEXT.md `<dependencies>` table. Key vulnerabilities:

| Claim | Depends On | Vulnerability |
|-------|-----------|---------------|
| [projected] GATE-06/07 via 57.9 substrate | [evidenced] 57.9 inserted in ROADMAP.md:141-150 | MEDIUM — 57.9 has no phase directory, no plans; AT-1 in CONTEXT formalizes the check. |
| [decided] GATE-09d uses 57.8 role-split provenance | [evidenced] 57.8 merged `c8a15d95` | LOW — 57.8 merged; STATE.md lag is cosmetic and is itself GATE-10 evidence. |
| [decided] GATE-03 runtime-adjacent classification | [decided] planning-authority files are structural | MEDIUM — classification risk is workflow friction increase; 2026-04-20 REQUIREMENTS.md patch is direct motivation. |
| [decided] GATE-01 CI-based | [assumed] CI rule stronger than workflow mechanic | LOW — audit §6.4 reasoned; pre-push hook is parallel not exclusive. |
| [decided] GATE-08a re-fetch | [open] Q2 upstream shape | MEDIUM — GATE-08 scope unplannable until Q2 resolves; reflexive GATE-09b. |
| [decided] GATE-09a named artifact | [open] Q3 file location | MEDIUM — location affects verifier complexity; not blocking for schema. |
| [decided] GATE-15 CI parity | [evidenced] CLAUDE.md:15-27 dual-directory | LOW — well-known hazard; risk is false-positive rate. |
| [decided] fire-event consumable by 57.5 extractors | [evidenced] extractor registry shipped | LOW — verified via ROADMAP.md:243-256. |
| [governing] structural enforcement (G-1) | [governing] audit §1 headline | LOW — phase's own self-description. |
| [assumed] load-bearing operational definition | [decided] claim-types vocabulary | MEDIUM — edge cases need test cases during research. |

***

## Context-Checker Verification Log

**Checked:** 2026-04-20
**Agent:** gsdr-context-checker

### Typed Claim Verification

| Claim | Type | Verification | Status | Issue |
|-------|------|-------------|--------|-------|
| Structural enforcement = fires without agent needing to remember (§1) | governing | reasoned | PASS | Source: audit §1 + ROADMAP.md:305; governance scope named |
| Every GATE must satisfy four-property contract (§1) | decided | cited | PASS | audit §9.3 exists; ROADMAP.md:316-328 verified lines 319-328 |
| Fire-event surface: hook log / stdout marker / session-meta (§1) | decided | cited | PASS | audit §6.1 section verified at line 280 in audit output |
| GATE-01 blocking substrate best as CI rule (§2) | assumed | reasoned | PASS | Challenge protocol present; CI precedent signal verified |
| GATE-02 must enumerate every gh pr merge surface (§2) | decided | cited | PASS | audit Finding 2.2 verified; execute-phase.md:793 confirmed single conforming site |
| GATE-03 ships with explicit detection rule (§2) | decided | cited | PASS | audit Finding 2.3 verified; ddcf1232 commit confirmed in git log |
| Which GATE-03 rule to ship (§2) | open | — | PASS | Research program named; downstream decisions named |
| GATE-03 classifies ROADMAP.md/REQUIREMENTS.md as runtime-adjacent (§2) | decided | reasoned | PASS | Alternatives considered; pattern motivation cited |
| GATE-14 folds into GATE-01 CI enforcement (§2) | decided | cited | PASS | audit Finding 3.5 + §9.2 verified at line 192, 392 |
| GATE-04a ships consumed-on-read archival (§3) | decided | cited | PASS | audit Finding 2.4 verified; signal file confirmed at correct path |
| GATE-04b hard-stop staleness (§3) | decided | cited | PASS | REQUIREMENTS.md:226 verified (line 226 = GATE-04b text) |
| GATE-04c mandatory understanding checks (§3) | decided | cited | PASS | REQUIREMENTS.md:228 verified |
| GATE-05 enumerates named delegation sites (§4) | decided | cited | PASS | REQUIREMENTS.md:230 verified; signal confirmed |
| GATE-13 owns compaction resilience (§4) | decided | cited | PASS | audit Finding 3.3 verified; REQUIREMENTS.md:260 verified |
| GATE-05 and GATE-13 are related but distinct (§4) | assumed | reasoned | PASS | Challenge protocol present |
| Phase 57.9 is prerequisite for GATE-06/07 (§5) | projected | reasoned | PASS | ROADMAP.md:141-150 confirmed; basis chain present |
| Phase 58 does not duplicate 57.9 work (§5) | decided | cited | PASS | ROADMAP.md:317 verified; audit §9.1 at line 365 |
| If 57.9 not complete, Phase 58 cannot honestly claim GATE-06/07 (§5) | assumed | reasoned | PASS | Challenge protocol = AT-1; formalized |
| GATE-08 splits into 08a-08e (§6) | decided | cited | PASS | REQUIREMENTS.md:236-244 verified; audit Finding 2.8 at line 120 |
| Upstream richer version will be re-fetched during Phase 58 (§6) | assumed | reasoned | PASS | Challenge protocol: 671-line staleness acknowledged; Q2 defines program |
| Narrowing requires named rationale under GATE-09c (§6) | governing | reasoned | PASS | Source: REQUIREMENTS.md:244 + GATE-09c; scope of governance named |
| GATE-09a ships as named artifact with schema (§7) | decided | cited | PASS | audit §6.2 at line 286 verified |
| Where ledger lives (§7) | open | — | PASS | Research program named; three candidates listed |
| GATE-09b is a planning gate (§7) | decided | cited | PASS | REQUIREMENTS.md:248 verified |
| GATE-09c narrowing-decision provenance (§7) | decided | cited | PASS | REQUIREMENTS.md:250 verified |
| GATE-09d verifier contract uses 57.8 role-split provenance (§7) | decided | cited | PASS | REQUIREMENTS.md:252; ROADMAP.md:123-124 verified |
| "Load-bearing" operational definition for GATE-09 (§7) | assumed | reasoned | PASS | Challenge protocol present; edge cases deferred to research |
| GATE-10 ships as structural step with gsd-tools substrate (§8) | decided | cited | PASS | REQUIREMENTS.md:254 verified; signals confirmed at correct path |
| GATE-11 release-boundary assertion (§8) | decided | cited | PASS | REQUIREMENTS.md:256 verified; signal confirmed |
| GATE-12 mv-to-archive replaces rm (§8) | decided | cited | PASS | REQUIREMENTS.md:258 verified; signal confirmed |
| GATE-15 source↔installed CI check (§8) | decided | cited | PASS | REQUIREMENTS.md:264 verified; CLAUDE.md:15-27 confirmed (lines 15-33) |
| GATE-10 and GATE-11 resolve closeout seam (§8) | projected | reasoned | PASS | Future phase (Phase 60.1) named; basis in audit §7.1 |
| XRT-01 plan-phase assertion (§9) | decided | cited | PASS | audit Finding 2.10 at line 140; REQUIREMENTS.md:419 verified |
| Rewrite stale cross-runtime note in REQUIREMENTS.md:10 (§9) | decided | cited | WARN | audit §5.1 verified — but REQUIREMENTS.md:10 has ALREADY been updated to the correct post-55.2 text; the claim that it "is rewritten during Phase 58" is now partially pre-empted by the current file state. Downstream agents should verify before re-writing. Not a citation failure — the citation is accurate; the claim's current-state premise is stale. |
| Per-gate Codex behavior table authored as part of plan (§9) | decided | cited | PASS | audit §5.3 at line 256; §9.3 Acceptance Test #4 at line 394 |
| Meta-gate proposal (§10) | open | — | PASS | Research program named; two branches (cheap vs new sensor work) |
| DC-1: Every GATE must carry named substrate (constraints) | governing | reasoned | PASS | Source: audit §9.3 AT-1 + ROADMAP.md:316-328 |
| DC-2: Every GATE must emit measurable fire-event (constraints) | governing | reasoned | PASS | Source: audit §6.1 + ROADMAP.md SC-1 |
| DC-3: No advisory-by-composition (constraints) | governing | reasoned | PASS | Source: audit §7.2 |
| DC-4: Per-gate Codex behavior required (constraints) | governing | reasoned | PASS | Source: audit §5 + §9.3 |
| DC-5: Phase 57.8 merged, STATE.md:6 lags (constraints) | evidenced | cited | PASS | git log confirmed c8a15d95; STATE.md line 6 reads "Phase 57.8 context gathered" — confirmed |
| DC-6: Phase 58 does not duplicate 57.9 work (constraints) | decided | cited | PASS | ROADMAP.md:317 + audit §9.1 verified |
| DC-7: [open] scope-boundary claims must resolve before plan-phase (constraints) | governing | reasoned | PASS | Source: GATE-09b reflexive application named |
| DC-8: GATE-03 motivation recurred at quick task 260419-6uf (constraints) | evidenced | cited | PASS | commit ddcf1232 confirmed in git log; audit Finding 2.3 line 80 confirmed |
| DC-9: ROADMAP.md/REQUIREMENTS.md classified runtime-adjacent (constraints) | decided | reasoned | PASS | Alternatives considered; motivation cited |
| G-1 through G-7 guardrails | governing | reasoned | PASS | Sources named (audit sections, REQUIREMENTS.md); scope named for each |

### Typed Claim Verification — Citation Path Failures

| Claim | Type | Status | Issue |
|-------|------|--------|-------|
| Signal citations in `<canonical_refs>` (lines 243-250) | evidenced | WARN | All signal file paths in CONTEXT.md use `.planning/signals/sig-*.md` prefix. Actual location is `.planning/knowledge/signals/get-shit-done-reflect/sig-*.md`. Every signal listed in `<canonical_refs>` has a wrong path prefix. The files exist at the correct path; citations are navigable with knowledge of the repo, but downstream agents following the paths literally will hit 404s. |
| `get-shit-done/references/cross-runtime-parity-research.md` (line 237, canonical_refs) | evidenced | WARN | File does not exist at `get-shit-done/references/cross-runtime-parity-research.md`. Actual location: `.planning/research/cross-runtime-parity-research.md`. The content is accurate (lines 70-80 verified at that path); path in CONTEXT.md is wrong. Same file is also cited inline in §9 working model text. |
| `dist/MANIFEST` (lines 154, 268) | assumed | INFO | File does not exist (`dist/MANIFEST` is MISSING). The claim uses "if present" hedging ("candidate ground truth", "`dist/MANIFEST` or equivalent"), which appropriately flags uncertainty. Not a phantom citation — the conditionality is stated. |

### Untyped Claims Surfaced

| Claim Text | Proposed Type | Location | Severity | Rationale |
|-----------|---------------|----------|----------|-----------|
| "Measurement extractor registry (Phase 57.5/57.6/57.7, 17+ extractors): fire-events from gates register as content-derived features without new measurement architecture" (line 263) | assumed:reasoned | `<code_context>` Reusable Assets | WARN | This is a load-bearing assumption: that the existing extractor registry can consume Phase 58 gate fire-events without new measurement architecture. It underpins DC-2 and G-6 directly. If the registry cannot consume gate events natively, a new layer is required. Should be `[assumed:reasoned]` with a challenge protocol naming what would falsify it (e.g., extractor API incompatibility). |
| "gsd-tools CLI surface: `state record-session`, `kb rebuild`, existing `commit`, `init phase-op` primitives compose into reconciliation (GATE-10) and ledger verification (GATE-09d) without new top-level commands — subject to Q6." (line 264) | assumed:reasoned | `<code_context>` Reusable Assets | WARN | Load-bearing for GATE-10 and GATE-09d implementation scope. The claim asserts composability from existing primitives, but this has not been verified (Q6 explicitly defers verification). Should be `[assumed:reasoned]` — reasonable pending Q6 research, but shapes planning scope. |
| "KB schema v2 (Phase 56 + 57.8 role-split extension): ledger entries and gate fire-events inherit the dual-write invariant (files + SQLite index) for free." (line 265) | assumed:reasoned | `<code_context>` Reusable Assets | WARN | "for free" is an untested claim about schema compatibility. GATE-09a ledger schema is not yet designed (Q3 open); asserting it inherits dual-write for free is premature. If the ledger schema adds fields not in the KB schema, a migration is required. Should be `[assumed:reasoned]`. |
| "`resolveModelInternal` (Phase 57.8): model echo for GATE-05 and dispatch contract restatement for GATE-13 both consume this canonical resolver rather than re-deriving." (line 266) | decided:reasoned | `<code_context>` Reusable Assets | INFO | This is a design decision (GATE-05 and GATE-13 will reuse `resolveModelInternal`), not a verified fact about current code. Typing as `[decided:reasoned]` would make the decision visible. Minor — it appears in a "Reusable Assets" section that implies availability, so the misframe is modest. |
| "Audit §6.4's CI-as-structural-gate pattern is preferred for GATE-01, GATE-02, GATE-03, GATE-14, GATE-15 where CI can host the check. Workflow-level mechanics remain for gates tied to per-session state (GATE-04, GATE-12)." (line 288) | decided:reasoned | `<specifics>` | WARN | This is a significant architectural partitioning decision (CI-hosted vs workflow-hosted) that constrains implementation shape for 7 of 25 requirements. It does not carry a type marker. Should be `[decided:reasoned]` — alternatives considered in audit (workflow-file mechanics, pre-push hooks), CI preferred for non-bypassability. |
| "ROADMAP.md:316-328 already uses this frame — Phase 58 plan must not re-collapse it." (line 289) | governing:reasoned | `<specifics>` | INFO | This is a normative constraint on the plan-phase agent, but it's buried in the specifics section without a type marker. The governing constraint it names (plan must not re-collapse the success criterion frame) is materially equivalent to G-2. Could be typed `[governing:reasoned]` or noted as duplicate of G-2. Low priority — G-2 covers the same ground. |

### Dependency Chain Audit

| Chain | Verdict |
|-------|---------|
| [projected] GATE-06/07 via 57.9 substrate -> [evidenced] 57.9 in ROADMAP.md:141-150 | PASS — ROADMAP.md:141-150 confirmed. Vulnerability correctly stated as MEDIUM: 57.9 has no phase directory (confirmed by directory listing). AT-1 formalizes the check. |
| [decided] GATE-09d uses 57.8 role-split provenance -> [evidenced] 57.8 merged c8a15d95 | PASS — commit confirmed in git log. Vulnerability correctly LOW. |
| [decided] GATE-03 runtime-adjacent classification -> [decided] planning-authority files are structural | PASS — dependency is decided-on-decided (LOW), classified as MEDIUM, which is slightly conservative. Not a problem. |
| [decided] GATE-01 CI-based -> [assumed] CI rule stronger than workflow mechanic | WARN — Vulnerability listed as LOW; claim-types.md §5 states decided-on-assumed = HIGH. The audit source (§6.4) provides reasoned justification, but the chain vulnerability should be MEDIUM at minimum per the claim-types ontology. The chain is not circular; marking LOW may understate risk to downstream agents. |
| [decided] GATE-08a re-fetch -> [open] Q2 upstream shape | PASS — MEDIUM vulnerability correctly stated; GATE-09b reflexive application acknowledged. |
| [decided] GATE-09a named artifact -> [open] Q3 file location | PASS — MEDIUM correctly stated; not blocking for schema design as noted. |
| [decided] GATE-15 CI parity -> [evidenced] CLAUDE.md:15-27 dual-directory | PASS — LOW correctly stated; CLAUDE.md:15-27 verified (dual-directory hazard at lines 5-33). |
| [decided] fire-event consumable by 57.5 extractors -> [evidenced] extractor registry shipped | PASS — verified via ROADMAP.md:241-256; Phase 57.5 verification noted. |
| [governing] structural enforcement (G-1) -> [governing] audit §1 headline | PASS — LOW correctly stated; self-grounding governance claim. |
| [assumed] load-bearing operational definition -> [decided] claim-types vocabulary | PASS — MEDIUM correctly stated; edge cases deferred to research. |
| Unrecorded: [assumed] "17+ extractors can consume gate fire-events without new architecture" (line 263) -> [decided] DC-2/G-6 | WARN — This dependency is not in the dependency table. DC-2 and G-6 implicitly depend on the assumption that existing extractors can observe gate events natively. If false, Phase 57.5 measurement architecture must be extended. Should be recorded. |
| Unrecorded: [assumed] "gsd-tools primitives compose into GATE-10/GATE-09d without new top-level commands" (line 264) -> [decided] GATE-10 implementation | WARN — Q6 defers verification but the assumption is load-bearing for GATE-10 plan scope. Not in dependency table. |

### Summary

- **Typed claims checked:** 44
- **Pass:** 40 | **Warn:** 2 | **Fail:** 0
- **Untyped load-bearing claims surfaced:** 6 (3 WARN, 2 INFO, 1 borderline)
- **Citation path failures:** 2 WARN (signals path prefix wrong; cross-runtime-parity-research.md wrong path), 1 INFO (dist/MANIFEST conditional and hedged)
- **Dependency vulnerabilities:** 2 unrecorded WARN chains; 1 vulnerability level understated (GATE-01 chain listed LOW, should be MEDIUM per claim-types.md §5)
- **Overall severity:** WARN

**Rationale for WARN (not FAIL):** No phantom citations — all cited files exist at verifiable paths; path errors in `<canonical_refs>` are navigational friction, not broken evidence. The two largest issues are (a) systematic signal path prefix errors (`<canonical_refs>` lists `.planning/signals/` but files live at `.planning/knowledge/signals/get-shit-done-reflect/`), (b) cross-runtime-parity-research.md cited at wrong source path (`get-shit-done/references/` vs `.planning/research/`), and (c) three load-bearing assumptions in `<code_context>` doing significant epistemic work without type markers. None of these block progression but all should be corrected before the research agent treats the `<canonical_refs>` paths as navigable. The REQUIREMENTS.md:10 stale-note claim additionally has a partially pre-empted premise (the note has already been updated in the current file).
