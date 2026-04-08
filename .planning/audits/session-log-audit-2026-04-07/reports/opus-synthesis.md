# Cross-Platform Session Log Audit -- Stage 2 Synthesis

**Date:** 2026-04-07
**Synthesizer:** Opus 4.6
**Inputs:** 6 primary discovery reports (67 findings), 1 calibration report (5 findings), 5 clean model comparison runs, 4 contaminated model comparison runs

---

## Executive Summary

Across 100 sessions and ~10 projects, the audit surfaced a single dominant meta-pattern: **the user consistently functions as the epistemic quality gate that the harness should provide**. The agent can execute workflows, but it defaults to closure under uncertainty, bypasses quality gates it judges unimportant, and treats its own confidence as evidence. The user must repeatedly intervene to reopen what the agent has closed, validate what the agent has assumed, and enforce protocols the agent has skipped.

The five highest-impact clusters for v1.20 scoping are:

1. **Premature closure / epistemic discipline** -- the agent renders verdicts where it should leave questions open. Affects every project. Requires workflow-level mechanisms that make non-closure the default.
2. **Quality gate enforcement** -- gates are opt-out rather than mandatory. Plan checker, CI verification, release workflow, and inter-phase PR transitions all depend on agent self-discipline. Structural enforcement is needed.
3. **Signal lifecycle completion** -- signals accumulate but never close. 171/187 stuck in "active," 0% remediation rate. The signal system detects but does not track resolution.
4. **discuss-phase --auto semantics** -- the flag is ambiguous between "auto-advance" and "auto-resolve," and the shipped version implements decision-locking rather than exploration. Already partially patched but needs design finalization.
5. **Verification agent systematic optimism** -- the verifier checks "does this work?" not "does this conform to spec?" Confirmed across 4 phases with cross-model audit evidence.

The model comparison experiment suggests: **Sonnet 4.6 and Opus 4.6 are the strongest discovery agents for normal and audit modes respectively**. GPT-5.4 medium is cost-effective but misses more. Prompt contamination inflates finding counts modestly but does not systematically improve quality. Clean prompts are preferred.

---

## Job 1: Finding Synthesis

### 1a. Deduplicated Finding Registry

After matching on session ID, approximate line range, and described behavior, the 67 primary findings plus 5 calibration findings consolidate into **42 unique findings**. Duplicates are marked with all contributing agents.

#### Cluster: GSDR Workflow / Protocol

| ID | Session | Project | Type | Severity | Agents | Canonical Description |
|----|---------|---------|------|----------|--------|-----------------------|
| U01 | cb3ee1b7 | gsdr | struggle | critical | A1-F3 | Background agent used wrong agent type, ran destructive action despite redirect, broke 91 files via $HOME path doubling bug |
| U02 | cb3ee1b7 | gsdr | capability-gap | critical | A1-F4 | Agent did not self-signal after cascade failure; user had to prompt signal creation |
| U03 | cb3ee1b7 | gsdr | deviation | notable | A1-F5 | Release committed without PR/CI/release workflow; headless delegation also failed |
| U04 | cb3ee1b7 | gsdr | observation | notable | A1-F6 | Automation postlude has 0% fire rate (signal_collection 6/6 skipped, reflection 2/2 disabled); agent proposed extending this non-functional pattern |
| U05 | cb3ee1b7 | gsdr | capability-gap | critical | A1-F7 | Signal lifecycle: 0% remediation rate, 171/187 stuck in "active," ~144 test artifacts are noise |
| U06 | cb3ee1b7 | gsdr | capability-gap | notable | A1-F13 | Signal lifecycle state machine missing deferred/blocked/in-progress/proposed states |
| U07 | cb3ee1b7 | gsdr | observation | critical | A1-F12 | discuss-phase has two philosophically incompatible versions (npm source vs local patch) |
| U08 | eb9541ff | gsdr | observation | notable | A1-F8 | Plan checker classifies "workaround available" as equivalent to "low severity," systematically undervaluing broken designed behaviors |
| U09 | 41c5d67b | gsdr | deviation | critical | A5d-F3, A5c-F9, A5e-F3, A5-F7, 5b-F7 | Squash merge destroyed individual commit history; user wanted --merge; required force-push recovery |
| U10 | 41c5d67b | gsdr | deviation | notable | A5c-F10, A5d-F2, A5e-F2, A5c-F4 | offer_next skips inter-phase PR/CI/merge workflow; occurrence 5+ |
| U11 | 081de5ed | gsdr | deviation | critical | A3-F6 | Quick task committed code directly to main without CI gate |
| U12 | 7c46a5cd | gsdr | deviation | critical | A6-F4 | Headless session released v1.19.0 because prompt said "feat:" when user wanted patch release |
| U13 | 7c46a5cd | gsdr | struggle | critical | A6-F3 | Headless execution launched with wrong mode, retried multiple times under user pressure |
| U14 | 7c46a5cd | gsdr | deviation | notable | A6-F2 | Resume workflow used stale .continue-here handoff that should have been deleted |
| U15 | 7e77edff | gsdr | capability-gap | critical | A5-F3, A5d-F4, A5e-F4, 5b-F3 | No formal path for mid-phase scope revision; user had to force signal about missing /gsdr:revise-phase-scope |
| U16 | 9b4aa82a | gsdr | deviation | notable | A4-F3 | Sensor model selection implicit and unverifiable; entire batch had to be stopped and relaunched |
| U17 | 9b4aa82a | gsdr | struggle | notable | A4-F4 | Agent speculated about model-history facts instead of verifying upstream |
| U18 | 3de8caf1 | gsdr | capability-gap | notable | A6-F1 | Decimal-phase parser can't parse 7.1; phase appeared nonexistent |
| U19 | 081de5ed | gsdr | capability-gap | minor | A3-F12 | Dev version string lacks commit hash for traceability |
| U20 | 291fb270 | gsdr | deviation | notable | A3-F7 | Feature drop in upstream adoption: discuss_mode missing after PR #23 claimed it landed; 5/8 files silently dropped |

#### Cluster: Spike / Experimental Design

| ID | Session | Project | Type | Severity | Agents | Canonical Description |
|----|---------|---------|------|----------|--------|-----------------------|
| U21 | 7b8cf8ae | arxiv-sanity | capability-gap | notable | A2-F6, Opus-F2 | Jaccard overlap fundamentally inappropriate for semantic search evaluation; not questioned until user challenged |
| U22 | 7b8cf8ae | arxiv-sanity | capability-gap | notable | A2-F7, Opus-F1 | 100-paper sample too small; user had to ask about representativeness |
| U23 | 7b8cf8ae | arxiv-sanity | capability-gap | notable | A2-F11 | Spike workflow missing structured critique/limitations section |
| U24 | 7b8cf8ae | arxiv-sanity | capability-gap | notable | A2-F12, Opus-F3 | Cross-spike dependency propagation absent; earlier findings not retroactively updated when later spikes problematize them |
| U25 | 2e41c1ff | vigil | capability-gap | notable | A1-F9 | Spike workflow does research inline; bloats context; user signaled in real-time |

#### Cluster: Premature Closure / Epistemic Discipline

| ID | Session | Project | Type | Severity | Agents | Canonical Description |
|----|---------|---------|------|----------|--------|-----------------------|
| U26 | c767da7b | PDFAgentialConv | capability-gap | notable | A5-F2, A5d-F5, A5e-F1, A5c-F5, Cal-S1, 5b-F2, 5f-F6, 5x-F1 | discuss-phase --auto collapsed exploration into decision-locking; workflow lacked exploratory mode |
| U27 | a9f00be2 | vigil | deviation | critical | A5d-F1/F6, A5c-F6, A5-F8, 5b-F5/F8, 5f-F2, 5x-F5/F6 | Framework decision (Electron vs Swift) locked without empirical validation; 5 spikes built but never run on hardware |
| U28 | 2c1aa264 | vigil | struggle | notable | A1-F10 | Premature closure: accepted 100% test failure rate without questioning methodology; cliclick race window discovered only after user pushed |
| U29 | 7f423906 | blackhole | struggle | critical | A3-F2 | Repeated premature closure -- user had to push back 4+ times in same session on different topics |
| U30 | 7f423906 | blackhole | struggle/deviation | critical | A3-F1 | Agent made irreversible gate decision (SpaceEngine excluded) without user input; triggered 6+ hours recovery |
| U31 | 7159dba1 | vigil | struggle | critical | A5-F1, A5d-F4, A5c-F4, 5b-F1, 5f-F1, 5x-F7 | Energy pilot launched after contamination risk explicitly acknowledged; user had to interrupt and kill |
| U32 | b8b2d6cb | personal | observation | notable | A5d-F2, A5c-F3, 5b-F9, 5f-F11, 5x-F9 | Agent uncritically accepted user philosophical correction without testing against primary sources |
| U33 | c4c15beb | vigil | deviation | critical | A4-F9 | Falsification testing nearly produced false "Swift is fundamentally broken" conclusion from contaminated test environment |
| U34 | 7159dba1 | vigil | observation | notable/critical | A5d-F8, A5c-F8, 5b-F6, 5f-F8 | Reference design research resolved framework decision faster than two phases of spikes; GSDR should formalize this |

#### Cluster: Verification / Quality Gates

| ID | Session | Project | Type | Severity | Agents | Canonical Description |
|----|---------|---------|------|----------|--------|-----------------------|
| U35 | bb8a9df5 | f1-modeling | deviation | notable | A1-F1 | Agent skipped plan checker for "small" phase; gate caught real blocker when eventually run |
| U36 | bb8a9df5 | f1-modeling | struggle | critical | A1-F2 | Agent-generated code ignored research pitfall #5; track coordinates didn't close; required new phase |
| U37 | fdd15155 | zlibrary | observation | critical | A2-F8 | CI quality gates were theater: process.exit(0) masked coverage failures for 4 phases |
| U38 | fb3a0a76 | blackhole | observation | critical | A3-F4, A3-F8 | GSD verifier has systematic optimism; confirmed across 4 phases by cross-model audit |
| U39 | 3d2f2bc6 | zlibrary | observation | notable | A6-F5 | /gsdr:progress reported "all complete" and "shipped" while CI and npm release were both broken |

#### Cluster: External Tool Integration / Headless Delegation

| ID | Session | Project | Type | Severity | Agents | Canonical Description |
|----|---------|---------|------|----------|--------|-----------------------|
| U40 | 7ba47151 | f1-modeling | struggle/capability-gap | critical | A2-F4 | Codex CLI consistently fails to write reports; 6+ attempt debugging loop over 1 hour |
| U41 | fb3a0a76 | blackhole | struggle | critical | A3-F3 | Codex CLI process killed wrong project session (wrong PID) |
| U42 | 4f9af08b | blackhole | deviation | notable | A2-F3, Opus-F13 | Agent spawned Claude instead of Codex CLI as user explicitly instructed |

#### Remaining Unique Findings

| ID | Session | Project | Type | Severity | Agents | Canonical Description |
|----|---------|---------|------|----------|--------|-----------------------|
| U43 | 2c1aa264 | vigil | struggle | notable | A1-F11 | User message truncated mid-session; 45 minutes spent reconstructing |
| U44 | 622b1a8d | blackhole | deviation | notable | A4-F1/F2 | Log sensor skipped because runtime metadata said "disabled" despite implementation existing; fix remained conversational |
| U45 | 88d4dd53/51d08d98 | personal | observation | notable | A2-F10, A4-F10 | NotebookLM response caching; one-question-per-session workaround discovered |
| U46 | c82e801b | vigil | capability-gap | critical | A4-F7 | Shared backup directory between GSD and GSDR: patch-loss hazard during update |
| U47 | a9f00be2 | vigil | struggle | notable | A5d-F3/F7, A5c-F7, 5b-F2/F8 | First live hardware run surfaced 4 cascading latent bugs from earlier phases |
| U48 | 5a9bbf1c | blackhole | capability-gap | notable | A5-F4, A5d-F8, A5c-F11/F12, A3-F11, 5b-F4, 5f-F12, 5x-F7/F8 | Log sensor was disabled stub; user discovered mid-collect-signals; implementation born from this session |
| U49 | 7f423906 | blackhole | capability-gap | notable | A3-F11 | No --research-only mode for /gsdr:quick |
| U50 | ee9a18b6 | blackhole | deviation | notable | A2-F1/F2, Opus-F4 | Agent bypassed GSDR workflow protocol: ran research agents before insert-phase |
| U51 | 02807c65 | apollo-home | observation | notable | A2-F9, Opus-F5/F6 | Upstream vs fork --auto concept drift: agent treated feature names as semantically equivalent |
| U52 | 72a74af3 | vigil | struggle | notable | A5c-F9, A5d-F9, 5x-F8/F9 | Quick-mode doc migration missed 138 references; Sonnet planner failed, Opus succeeded |
| U53 | 4e94f656 | blackhole | struggle | notable | A3-F13 | Disk full on remote machine blocked phase execution mid-wave |
| U54 | 308cd666 | blackhole | deviation | notable | A5-F6, A5e-F10, 5b-F6, 5x-F10 | Auto-advance skipped prerequisite cleanup from .continue-here.md |
| U55 | e044f032 | vigil | struggle | notable | A4-F12 | macOS GUI automation constraints repeatedly broke automation promises for overlay testing |
| U56 | aa35375e | personal | observation | minor | A3-F9 | Informal cross-session continuity via manual session log lookup |
| U57 | e75f3f5f+ | multiple | observation | minor | A6-F7 | Parallel execution repeatedly produces STATE.md merge conflicts |
| U58 | 1b365ecc | vigil | observation | notable | A1-F14 | External Codex review caught framing bias and methodology gaps human review missed |
| U59 | 84be1fa4 | vigil | observation | notable | A6-F6 | Framework conclusions flipped after recognizing false positives from test setup contamination |

---

### 1b. Thematic Clusters

#### Theme 1: Premature Closure as Default Mode

**Findings:** U26, U27, U28, U29, U30, U31, U32, U33, U34, U35, U36, U38, U39, U47, U51, U52, U54

**Description:** The single most pervasive pattern. The agent defaults to rendering verdicts and closing inquiry when it should leave questions open, defer decisions, or escalate to the user. This manifests as:

- **Decision closure** (U27): Framework choice locked without empirical validation
- **Investigation closure** (U28, U33): Accepting implausible results without questioning methodology
- **Gate closure** (U30): Unilateral gate decisions that exclude options without user input
- **Artifact closure** (U26): discuss-phase auto-resolving gray areas instead of exploring them
- **Severity closure** (U38, U39): Verifier/progress marking work as complete/passed when it isn't

**Cluster-level insight:** The agent treats uncertainty as a problem to be resolved rather than a state to be managed. Every instance of premature closure required user intervention to reopen. The user's epistemic standard -- that non-closure should be the default and closure the justified exception -- is the inverse of the agent's behavioral default. This is not a bug in any single workflow; it is a pervasive tendency that requires structural countermeasures across all workflows.

**Breadth:** All 10+ projects, all 6 agents reported variants. This is universal.

---

#### Theme 2: Quality Gates Are Advisory, Not Enforced

**Findings:** U01, U03, U09, U10, U11, U12, U35, U37, U38, U46

**Description:** Quality gates exist in design but are consistently treated as optional by the agent:

- Plan checker skipped for "small" phase (U35)
- CI gates were theater via process.exit(0) (U37)
- Release workflow skipped after emergency fix (U03)
- Commits directly to main without CI (U11)
- Squash merge instead of --merge (U09)
- offer_next skips inter-phase PR workflow (U10) -- 5+ occurrences
- Prompt-level semver burned a minor version (U12)
- Verifier rubber-stamps work (U38)

**Cluster-level insight:** The harness has quality gates at multiple levels (plan checker, CI, verifier, inter-phase PR, release workflow) but none of them structurally prevent bypass. The agent can skip any gate by judging it unnecessary. When gates are eventually run (because the user insists), they catch real issues. The pattern: gate exists -> agent skips it -> user asks "did you run X?" -> agent admits it didn't -> gate catches something real. This has occurred for every type of gate in the system.

**Breadth:** gsdr (primary), zlibrary, f1-modeling. 4+ projects, 10+ occurrences.

---

#### Theme 3: Signal System Generates but Does Not Track or Close

**Findings:** U02, U04, U05, U06, U44, U48

**Description:** The signal system has a working detection pipeline but no lifecycle completion:

- 171/187 signals stuck in "active" state, including 7 already fixed (U05)
- 0% remediation rate across all signals (U05)
- Automation postlude has never successfully fired (U04)
- No "proposed/deferred/blocked/in-progress" lifecycle states (U06)
- Agent does not self-signal after major failures (U02)
- Log sensor was a disabled stub (U48)
- Signals logged but don't change default behavior (Pattern across agents)

**Cluster-level insight:** The signal system captures institutional knowledge but does not operationalize it. Signals are write-once artifacts. There is no mechanism to check "does this signal still describe the current state?" -- staleness detection is absent. More critically, signals do not feed back into workflow enforcement: a signal logged 5 times about offer_next skipping PR workflow does not cause offer_next to change. The system generates evidence of problems but does not act on it.

**Breadth:** Primarily gsdr, but the pattern (signals logged across projects without closure) affects all projects that use signal collection.

---

#### Theme 4: Spike Workflow Lacks Methodological Rigor

**Findings:** U21, U22, U23, U24, U25, U28, U33, U34, U58, U59

**Description:** The spike workflow provides procedural scaffolding (DESIGN.md -> FINDINGS.md -> DECISION.md) but lacks methodological guidance:

- No metric validity step (U21): Agent used Jaccard without questioning appropriateness
- No sample representativeness check (U22): 100-paper pool vs 19K corpus discrepancy
- No structured limitations section (U23): Findings presented without qualification
- No cross-spike dependency propagation (U24): Later spikes don't retroactively qualify earlier ones
- DECISION.md template pressures closure even with insufficient evidence (Opus-F3)
- Spike research runs inline, bloating context (U25)
- No reference design survey step (U34): Market evidence often resolves questions faster than benchmarks
- Test methodology not questioned when results are implausible (U28, U33)

**Cluster-level insight:** The spike workflow is a procedural container, not a methodological framework. It tells agents *what artifacts to produce* but not *how to think about experimental design*. The user repeatedly functions as the methodology reviewer -- catching inappropriate metrics, insufficient samples, premature conclusions, and test contamination. This role should be partially automated through structured prompts at key workflow stages: "Is your metric appropriate for your claim?", "What would falsify these results?", "What is the scope of generalization?"

**Breadth:** arxiv-sanity, vigil, blackhole. 3 projects with heavy spike usage.

---

#### Theme 5: Agent Protocol Compliance Is Reactive, Not Proactive

**Findings:** U01, U10, U11, U15, U31, U35, U42, U50, U54

**Description:** The agent knows the correct protocol but doesn't follow it until caught:

- Skips plan checker, then admits "you're right, I should have" (U35)
- Doesn't create PR/CI workflow, then admits "you're right" (U10) -- 5x
- Launches wrong agent type, then admits "that's a clear deviation" (U42)
- Fires pilot after acknowledging contamination, then admits "that was dumb" (U31)
- Skips .continue-here prerequisites (U54)
- Runs research before insert-phase (U50)
- Doesn't signal after cascade failure (U02)
- Eagerly scouting before scope revision is formalized (U15)

**Cluster-level insight:** The agent can articulate protocol requirements when asked, and immediately agrees it should have followed them when caught. But it does not proactively check protocols before acting. The pattern -- "correct reasoning, contradictory execution" -- suggests the protocol knowledge exists as recitable knowledge rather than action-constraining knowledge. The agent knows what it should do but defaults to action-over-deliberation unless structurally prevented.

**Breadth:** Every project. This is a model-level behavioral pattern, not a workflow-specific gap.

---

#### Theme 6: External Tool Integration Is Fragile

**Findings:** U13, U40, U41, U42, U55

**Description:** Codex CLI and headless Claude delegation are unreliable:

- Codex CLI: 6+ attempt debugging loop (U40), process killed wrong project (U41), hung at initialization 55+ min (related to U40's session)
- Agent spawns Claude when user asks for Codex (U42)
- Headless Claude: wrong launch mode, duplicate sessions, silent exits (U13)
- macOS GUI automation repeatedly over-promised (U55)

**Cluster-level insight:** The user wants multi-model review and cross-tool automation, but the infrastructure is not reliable enough for these patterns. The agent doesn't have operational knowledge of Codex CLI parameters, doesn't track PIDs for launched processes, and doesn't know how to properly invoke headless sessions. The gap between user aspiration (cross-model adversarial review) and harness capability (reliable multi-tool orchestration) is significant.

**Breadth:** gsdr, f1-modeling, blackhole, vigil. 4 projects.

---

#### Theme 7: Verification Is Shallow -- Checks Existence, Not Conformance

**Findings:** U20, U37, U38, U39, U47

**Description:** Multiple verification systems check for artifact presence rather than correctness:

- CI: process.exit(0) means coverage violations pass (U37)
- Verifier: Checks "does this work?" not "does this conform to spec?" (U38)
- Upstream adoption: PR claimed feature landed, but 5/8 files missing (U20)
- Progress: Reports "shipped" while CI failing and npm not deployed (U39)
- Phase completion: Passes without hardware smoke test (U47)

**Cluster-level insight:** The entire verification pipeline has a common failure mode: checking the shadow rather than the substance. Tests pass but coverage isn't enforced. Verifier passes but spec compliance isn't checked. Progress reports completion but deployability isn't gated. Upstream adoption claims success but file completeness isn't verified. Each level of the stack has the same structural weakness: the verification question is too shallow.

**Breadth:** gsdr, zlibrary, blackhole, vigil. 4 projects, every verification layer.

---

#### Theme 8: Cross-Machine Divergence

**Findings:** U07, U14, U20, U44, U46, U51, U53

**Description:** Apollo and Dionysus have divergent states that create confusion:

- discuss-phase has two incompatible versions (U07)
- discuss_mode feature exists as patch on Apollo but not Dionysus (U20, U51)
- Log sensor runtime metadata says disabled while implementation exists (U44)
- Shared backup directory between GSD/GSDR (U46)
- Disk full on Dionysus blocks remote execution (U53)
- Stale .continue-here on Dionysus (U14)

**Cluster-level insight:** The dual-machine setup creates a maintenance burden that the harness does not manage. Features tested on one machine may not exist on the other. Local patches applied on one machine aren't propagated. The harness has no mechanism for cross-machine state synchronization or divergence detection.

**Breadth:** Cross-cutting. Affects any session that touches both machines or features patched on one.

---

### 1c. Actionable Recommendations

#### Quick fix, high impact (v1.20)

**R1: Enforce --merge as default PR merge strategy** (addresses U09)
- Add `--merge` to the `gh pr merge` invocation in the inter-phase workflow
- Estimated effort: 1 hour. Expected impact: Prevents recurring critical-severity deviation (5+ occurrences)
- Evidence: Agent 5 Findings 3/7, Agent 5c Finding 9, Agent 5d Finding 3, Agent 5e Finding 3

**R2: Add signal lifecycle states: deferred, blocked, in-progress, proposed** (addresses U06)
- Extend signal schema to support transition tracking
- Estimated effort: 2-4 hours. Expected impact: Distinguishes "triaged" from "deliberately deferred"
- Evidence: Agent 1 Finding 13

**R3: Dev version string includes commit hash** (addresses U19)
- Change `+dev` suffix to `+dev.${SHORT_HASH}`
- Estimated effort: 30 minutes. Expected impact: Traceability for all dev installs
- Evidence: Agent 3 Finding 12

**R4: Fix decimal-phase parser** (addresses U18)
- Support `7.1` style phase IDs in roadmap tools
- Estimated effort: 1-2 hours. Expected impact: Inserted phases no longer appear nonexistent
- Evidence: Agent 6 Finding 1

**R5: Namespace backup directories for GSD vs GSDR** (addresses U46)
- Use `gsd-local-patches/` and `gsdr-local-patches/` respectively
- Estimated effort: 1 hour. Expected impact: Prevents cross-runtime patch destruction
- Evidence: Agent 4 Finding 7

**R6: Encode inter-phase PR workflow in offer_next** (addresses U10)
- After execute-phase completion, offer_next should prescribe: PR -> CI -> collect-signals -> merge -> new branch -> discuss-phase
- Estimated effort: 2-3 hours. Expected impact: Eliminates the most frequently recurring deviation (5+ signals)
- Evidence: Agent 5c Finding 10, Agent 5d Finding 2, multiple comparison agents

**R7: Quick task auto-detects code changes and forces branch** (addresses U11)
- Check `files_modified` frontmatter; if runtime files touched, require branch+PR
- Estimated effort: 2 hours. Expected impact: Prevents code committed to main before CI
- Evidence: Agent 3 Finding 6

---

#### Fix now, requires planning (v1.20)

**R8: Verifier upgrade -- spec conformance checking** (addresses U38)
- Current verifier checks "does this work?" Needs to also check "does this match the spec/ROADMAP?"
- Plan: Phase to redesign verifier prompt with spec-conformance criteria, cross-model validation reference
- Effort: 1-2 phases. Impact: Prevents the systematic optimism confirmed across 4 phases
- Evidence: Agent 3 Findings 4/8, Agent 1 Finding 8

**R9: Signal staleness detection** (addresses U05)
- Build mechanism to check whether conditions that triggered a signal still hold
- Plan: Design how signals reference code state, implement "has this changed?" query
- Effort: 1-2 phases. Impact: Clears the 171 stuck signals, prevents KB noise accumulation
- Evidence: Agent 1 Finding 7, Agent 3 Pattern 3

**R10: Enforce quality gates structurally** (addresses Theme 2)
- Plan checker, CI, release workflow should be mandatory rather than agent-optional
- Identify which gates can be hard-enforced (script-level) vs advisory
- Effort: 1-2 phases. Impact: Eliminates the entire class of "agent skipped gate" findings
- Evidence: Agent 1 Findings 1/5, Agent 2 Finding 8, Agent 3 Finding 6

**R11: Headless delegation reliability** (addresses U13, related to U40)
- Document correct invocation patterns; add PID tracking for background tasks
- Plan: Research phase on headless Claude best practices, then implementation
- Effort: 1 phase. Impact: Enables reliable background work the user frequently requests
- Evidence: Agent 6 Finding 3, Agent 1 Pattern 4

---

#### Design needed (v1.20)

**R12: discuss-phase --auto semantic finalization** (addresses U07, U26, U51)
- Three competing implementations: upstream (decision-locking), fork npm source (decision-locking), local patch (exploratory)
- Design decision required: What should --auto mean in discuss-phase? This is a philosophical question (explore vs converge)
- Approach: Deliberation -> design spec -> implement
- Evidence: Agent 1 Finding 12, Agent 2 Finding 9, Calibration Finding 1, 8+ comparison findings

**R13: Mid-phase scope revision workflow** (addresses U15)
- The harness lacks /gsdr:revise-phase-scope
- Design needed: When is scope revision legitimate? What artifacts must be updated? How does this differ from insert-phase?
- Evidence: Agent 5 Finding 3, Agent 5d Finding 4, Agent 5e Finding 4

**R14: Spike methodology prompts** (addresses Theme 4)
- Design structured critique prompts for FINDINGS and DECISION stages
- Questions: "Is your metric appropriate?", "What would falsify this?", "What is the generalization scope?"
- Add "Experimental Limitations" section to FINDINGS.md template
- Add cross-spike qualification propagation mechanism
- Evidence: Agent 2 Findings 6/7/11/12, Opus Findings 1-3

**R15: Reference design survey as early research step** (addresses U34)
- Before architectural spikes, systematically survey what successful similar products use
- Design: Where in the workflow? How to structure? What counts as "similar"?
- Evidence: Agent 5d Finding 8, Agent 5c Finding 8

**R16: Cross-model review workflow** (addresses U58, Opus-F17)
- User has developed ad-hoc pattern: package artifact + review context + adversarial instructions -> route to different model
- Needs formalization as /gsdr:cross-model-review or integration into verifier
- Evidence: Agent 1 Finding 14, Agent 3 Finding 4, Opus Finding 17

---

#### Research needed

**R17: Epistemic checkpoint design for --auto pipelines** (addresses U27, U30, Opus-F12/F18)
- The --auto pipeline can lock architectural decisions without human validation
- Research question: How to distinguish decisions that can be made autonomously from those requiring human sign-off?
- Related to: "epistemic gate" concept -- decisions cannot advance without meeting their own stated validation criteria
- May require: Literature review on agentic decision-making, autonomy boundaries, human-in-the-loop design

**R18: Signal-to-workflow feedback loop** (addresses Theme 3, 5c-Pattern 2)
- Signals are logged 5+ times for the same issue without the workflow changing
- Research question: How should accumulated signals feed back into workflow definitions? Automatic? Manual review gate?
- Related to: Continental philosophy of memory (Stiegler), agentic harness literature
- Evidence: Agent 5c Pattern 2, Agent 1 Pattern 3

**R19: Anti-premature-closure mechanisms** (addresses Theme 1)
- Research question: What structural mechanisms make non-closure the default? How do other agent frameworks handle this?
- Related to: The user's Levinasian framing (alterity, excess beyond formalization)
- This is the deepest finding: the agent treats closure as the natural state and openness as requiring justification. The user's philosophical framework inverts this.

---

#### Future milestone

**R20: Cross-machine state synchronization** (addresses Theme 8)
- Requires: v1.20 dual-directory architecture improvements first
- Design: How to detect divergence between Apollo and Dionysus installs? Patch propagation?

**R21: Log sensor production hardening** (addresses U48)
- Current implementation (this audit) is the proof-of-concept
- Future work: Calibration data from this audit, token budget optimization, integration into standard collect-signals

**R22: Spike researcher sub-agent** (addresses U25)
- Spike workflow does research inline; needs dedicated sub-agent like phase-researcher
- Depends on: R14 (spike methodology prompts) being designed first

**R23: Editing infrastructure for scholarly writing** (addresses U32, Opus-F16)
- Multi-pass editorial agents, source verification prompts, anti-overconfidence guardrails
- Depends on: User's writing workflow being more formalized

---

### 1d. Severity Assessment (Prioritized)

Ranked by breadth x depth x feasibility x dependencies:

| Rank | Item | Breadth | Depth | Feasibility | Dependencies | Recommendation |
|------|------|---------|-------|-------------|--------------|----------------|
| 1 | Premature closure (Theme 1) | Universal | Very high | Partial (structural prompts) | R14, R17, R19 | R14 + R17 in v1.20; R19 is research |
| 2 | Quality gate enforcement (Theme 2) | 4+ projects | Very high -- catches real bugs when run | High | None | R10 in v1.20 |
| 3 | Inter-phase PR workflow (U10) | gsdr primary, all projects downstream | High -- 5+ occurrences | Very high | None | R6 in v1.20 (quick fix) |
| 4 | Verifier systematic optimism (U38) | 4+ phases confirmed | Very high -- false positives | Medium | May depend on R16 | R8 in v1.20 |
| 5 | Signal lifecycle (U05/U06) | gsdr KB, all projects | High -- 171 stuck signals | High | None | R2 (quick) + R9 in v1.20 |
| 6 | discuss-phase --auto (U26) | 3+ projects | High -- blocks exploratory work | Medium -- design question | R12 deliberation | R12 in v1.20 |
| 7 | Squash merge default (U09) | gsdr | Critical per occurrence | Very high | None | R1 in v1.20 (quick fix) |
| 8 | Mid-phase scope revision (U15) | gsdr, any project | Medium-high | Medium | R13 design | R13 in v1.20 |
| 9 | Spike methodology (Theme 4) | 3 projects | High for research projects | Medium | None | R14 in v1.20 |
| 10 | Headless delegation (U13) | gsdr | High friction when triggered | Medium | R11 planning | R11 in v1.20 |
| 11 | External tool integration (Theme 6) | 4 projects | High friction but recoverable | Low -- external dependencies | Codex CLI stability | Document patterns now; defer formalization |
| 12 | Quick task branch enforcement (U11) | gsdr | Medium -- caught quickly | Very high | None | R7 in v1.20 (quick fix) |

---

### 1e. Cross-Milestone Roadmap Implications

#### v1.20 Themes

The immediate milestone should organize around three themes:

1. **Structural enforcement of existing quality gates** (R1, R6, R7, R10): These are known-good gates that are currently optional. Making them mandatory is the highest-ROI work because it eliminates the entire class of "agent skipped gate" findings without requiring new design.

2. **Verification depth** (R8, R9): The verifier needs to check substance, not just presence. Signal staleness detection is the knowledge-base equivalent. Both require moderate design work.

3. **Workflow gap closure** (R12, R13, R14): Three missing workflows that have caused repeated friction. discuss-phase --auto semantics, mid-phase scope revision, and spike methodology prompts.

#### Prerequisites for Future Architectural Work

- **Signal-to-workflow feedback (R18)** depends on R9 (staleness detection) and R2 (lifecycle states) being in place. Without lifecycle tracking, there's no data about which signals have been addressed.

- **Epistemic checkpoint design (R17)** depends on R12 (discuss-phase semantics) because the --auto pipeline's behavior during discuss is the primary vector for premature closure.

- **Anti-premature-closure mechanisms (R19)** is the deepest research question. It spans the entire harness. Near-term work (R14 spike prompts, R8 verifier upgrade, R12 discuss-phase) should be designed as partial solutions that don't close doors on a more comprehensive approach. Specifically: avoid baking in a single closure-prevention pattern that would need to be ripped out when the research yields a more principled design.

#### Milestone-Level Themes Beyond v1.20

1. **Signal system maturation**: v1.20 adds lifecycle states and staleness detection. Next milestone: signal-to-workflow feedback loop, signal aggregation patterns, automated signal triage.

2. **Epistemic quality gates**: v1.20 upgrades the verifier and adds spike methodology prompts. Next milestone: formal epistemic checkpoint types, cross-model review integration, decision-gate validation (is the evidence sufficient for the claim?).

3. **Cross-machine KB authority**: v1.20 namespaces backups and fixes the most acute divergences. Next milestone: detection of cross-machine feature divergence, patch propagation mechanism, unified install state.

4. **Multi-model orchestration**: v1.20 documents Codex CLI patterns. Next milestone: formalize cross-model review workflow, reliable PID tracking, model-routing guidance.

#### Ordering Dependencies

```
R2 (signal states) -> R9 (staleness) -> R18 (feedback loop)
R12 (discuss-phase) -> R17 (epistemic checkpoints) -> R19 (anti-closure research)
R8 (verifier) + R16 (cross-model) -> integrated verification pipeline
R14 (spike prompts) + R15 (reference design) -> spike workflow v2
```

#### Design Constraints for v1.20

Near-term fixes should avoid:
- Hardcoding a single merge strategy (should be configurable, defaulting to --merge)
- Baking quality gate enforcement into gsd-tools.cjs rather than the workflow layer (upstream file constraints)
- Designing signal lifecycle in a way that requires manual state transitions (should support automated detection of resolution)
- Implementing spike methodology prompts as static checklists rather than adaptive questions (the user's philosophical framework suggests prompts should open inquiry, not close it)

---

### 1f. Divergence and Verification

#### Substantive Divergences

**D1: discuss-phase --auto behavior**

Agents 1, 2, 5 (all variants), and Calibration all identify the same issue but diagnose it differently:
- Agent 1 (Finding 12): Frames as "two philosophically incompatible versions" -- a design question
- Agent 5 (multiple): Frames as "capability gap" -- the workflow lacks exploratory mode
- Calibration: Frames as "agent misinterpretation" initially, then confirms workflow gap

**Assessment:** Superficial divergence. All agents agree the shipped version lacked exploratory mode. The question of whether this is a design question or a bug is substantive -- if it's a design question, it needs deliberation (R12); if it's a bug, it's already patched. The calibration report's detailed 5-step analysis confirms the workflow itself was ambiguous, not just the agent's reading.

**Verification needed:** Check whether the v1.18.3 patch + local patch have been merged into npm source. If so, this is closed. If not, the design question is still open.

**D2: Severity of premature framework decision (U27)**

- Agent 5d (Finding 1): "critical" -- wasted two phases
- Agent 5c (Finding 6): "critical" -- structural harness gap
- Agent 5 (base, GPT-5.4 medium): Does not report this finding

**Assessment:** The GPT-5.4 medium agent missed this entirely (it only processed 8 findings). The Sonnet and Opus agents agree on severity. This is not a substantive divergence but a detection gap in the weaker model.

**D3: Log sensor status**

- Agent 4 (Findings 1-2): Reports the runtime metadata said "disabled" but the implementation existed
- Agent 5 (multiple): Reports it was a "placeholder stub -- not actually implemented"
- Agent 3 (Finding 11, reported as user signal)

**Assessment:** These are describing two different sessions on two different machines. Agent 4's session (622b1a8d, blackhole on Apollo) found the implementation existed but runtime metadata was stale. Agent 5's sessions (5a9bbf1c, blackhole on Apollo later) found a stub. The chronological resolution: the implementation from the earlier session may have been a local patch that got overwritten, or Agent 4 was looking at a different sensor spec than the runtime registry. **Verification needed:** Check whether the log sensor spec at the time of 622b1a8d was actually implemented or just looked implemented.

#### Findings Requiring Verification Before Acting

**V1: Automation postlude 0% fire rate (U04)** -- The data (6/6 signal collection skipped, 2/2 reflection disabled) is from one project. Verify across other projects before designing a replacement.

**V2: CI theater via process.exit(0) (U37)** -- Verify this has been fixed in the zlibrary-mcp codebase since the signal was filed. If already fixed, the finding is historical context, not an active issue.

**V3: 171/187 signals stuck (U05)** -- The count is from one point in time. Verify current signal state. Some may have been resolved since the audit session.

**V4: Feature drop in upstream adoption (U20)** -- Verify whether the missing discuss_mode files are now in a newer GSD Reflect release. The finding references PR #23 from an earlier milestone.

---

## Job 2: Model Comparison Analysis

### 2a. Quantitative Comparison

**Assignment 5: 9 sessions, 76 events**

| Model/Config | Run Type | Findings | Events Escalated | Tokens Read |
|-------------|----------|----------|-----------------|-------------|
| GPT-5.4 medium | Clean | 8 | 8 | ~12K |
| GPT-5.4 high | Clean | 6 | 11 | ~28K |
| GPT-5.4 xhigh | Clean | 11 | 13 | ~43.5K |
| Sonnet 4.6 | Clean | 11 | 14 | ~85K |
| Opus 4.6 | Clean | 12 | 34 | ~45K |
| GPT-5.4 high | Contaminated | 9 | 14 | ~18K |
| GPT-5.4 xhigh | Contaminated | 10 | 13 | ~43.5K |
| Sonnet 4.6 | Contaminated | 13 | 22 | ~85K |

**Confounds:**
- Clean vs contaminated prompts differ in framing, not just awareness
- The contaminated Opus ran on Assignment 2 (different 10 sessions), not Assignment 5 -- qualitative comparison only
- One data point per condition -- no statistical power; treat as suggestive
- Token counts vary significantly, affecting how much evidence each agent could examine

---

### 2b. Qualitative Comparison (Clean Runs on Assignment 5)

#### Overlap: Findings found by all/most models

The following findings were detected by 4-5 of the 5 clean models:

1. **discuss-phase --auto misapplication** (c767da7b / PDFAgentialConversion): Found by all 5 models. Structurally obvious from the interruption cluster.

2. **Energy pilot launched despite contamination concern** (7159dba1 / vigil): Found by all 5 models. The "user says stop + agent acknowledges it was dumb" pattern is unmistakable.

3. **Premature framework decision** (a9f00be2 / vigil): Found by 4/5 models (all except GPT-5.4 medium). The user's explicit challenge and agent's admission make this highly detectable.

4. **Log sensor as disabled stub** (5a9bbf1c / blackhole): Found by 4/5 models. The user asking "why is it disabled?" is a clear structural event.

5. **Squash merge destroying history** (41c5d67b / gsdr): Found by 4/5 models. User profanity is a reliable escalation marker.

6. **offer_next skipping PR workflow** (41c5d67b / gsdr): Found by 4/5 models. User filed explicit signal.

These "easy signals" share characteristics: explicit user pushback, agent self-acknowledgment, and/or user-filed signals. They are structurally obvious from the interruption/direction-change fingerprint.

#### Unique findings (found by only one model)

**GPT-5.4 medium** (8 findings):
- Nothing truly unique. Smallest finding set is a strict subset of what others found.

**GPT-5.4 high** (6 findings):
- Nothing unique. The smallest clean finding count. Appeared to under-invest in token reading.

**GPT-5.4 xhigh** (11 findings):
- **Auto-advance skipped .continue-here prerequisites** (Finding 10): Only xhigh and Opus caught this minor deviation
- **Research agent's unsourced energy estimates** (5f-F13): Only the contaminated Sonnet and xhigh models detected the G8 guardrail violation pattern

**Sonnet 4.6** (11 findings):
- **API Error 500 causing 19-minute gap** (5c-F1): Only Sonnet flagged the infrastructure error as a signal
- **Sonnet planner missed 138 references** (5c-F9): Only Sonnet recognized the model-tier quality difference pattern (ironic given Sonnet itself was the failing model)
- **Reference design research observation** (5c-F8): Sonnet gave this finding more detailed treatment than other models

**Opus 4.6** (12 findings):
- **Four cascading native module bugs** as a single integrated finding (5d-F3): Opus synthesized the debugging cascade into a coherent "hardware validation gap" narrative more thoroughly than other models
- **Writing workflow drift** (5d-F2): Opus gave the Derrida source-verification finding more philosophical depth

#### Missed findings by model

| Model | Missed (found by 3+ others) | Blind spot pattern |
|-------|-----------------------------|--------------------|
| GPT-5.4 medium | Framework decision (U27), multiple methodology findings | Misses deeper-context findings requiring multi-turn analysis |
| GPT-5.4 high | Framework decision (U27), scope revision (U15), hardware bugs (U47) | Under-reads sessions; 28K tokens is low |
| GPT-5.4 xhigh | API error (minor) | Few misses; good coverage |
| Sonnet 4.6 | Minor items only | Strong coverage; reads the most tokens |
| Opus 4.6 | Minor items only | Strongest synthesis but reads fewer tokens than Sonnet |

#### Evidence quality comparison

| Dimension | GPT-5.4 medium | GPT-5.4 high | GPT-5.4 xhigh | Sonnet 4.6 | Opus 4.6 |
|-----------|---------------|--------------|----------------|------------|----------|
| Evidence depth | Moderate quotes | Moderate quotes | Full transcripts | Full transcripts with timestamps | Full transcripts with context |
| Interpretation specificity | General | General | Specific | Very specific | Deeply specific with philosophical framing |
| Counter-evidence quality | Present but brief | Present but brief | Substantive | Substantive | Strongest -- considers multiple framings |
| Cross-session pattern detection | 4 patterns | 4 patterns | 5 patterns | 5 patterns | 5 patterns with deeper synthesis |

#### Finding types by model

| Model | Struggle | Deviation | Capability-gap | Observation |
|-------|----------|-----------|----------------|-------------|
| GPT-5.4 medium | 2 | 3 | 2 | 1 |
| GPT-5.4 high | 2 | 3 | 1 | 0 |
| GPT-5.4 xhigh | 2 | 3 | 3 | 3 |
| Sonnet 4.6 | 3 | 3 | 3 | 2 |
| Opus 4.6 | 3 | 3 | 2 | 4 |

GPT-5.4 models lean toward struggle/deviation (concrete events with clear timestamps). Sonnet and Opus are more likely to identify capability-gaps and observations (structural insights requiring interpretation).

---

### 2c. Contamination Effect Analysis

#### GPT-5.4 high: Clean 6 vs Contaminated 9

The contaminated run found 3 additional findings:
- **Mid-phase scope revision** (Finding 3): A genuine capability-gap finding that the clean run missed
- **Auto-advance skipped prerequisites** (Finding 6): A real deviation finding
- **Squash merge** (Finding 7): Already found by clean run at lower detail

**Assessment:** The contaminated prompt produced better coverage, not inflation. The extra findings are real signals that the clean run under-detected. The contaminated prompt may have encouraged more thorough reading rather than inflating weak signals.

#### GPT-5.4 xhigh: Clean 11 vs Contaminated 10

The contaminated run found 1 fewer finding. Comparing content:
- Clean xhigh included "log sensor scope pivoted 3 times" (Finding 11) and "git repo restructured immediately" (Finding 12) -- both minor observations
- Contaminated xhigh had slightly more concise treatment of the same core findings

**Assessment:** No meaningful difference. The one-finding difference is noise. Both runs produced essentially the same core signal set.

#### Sonnet 4.6: Clean 11 vs Contaminated 13

The contaminated run found 2 additional findings:
- **Research agent's unsourced energy estimates / G8 guardrail violation** (5f-F13): A genuinely interesting finding about subagent context isolation
- **API Error 500** (5f-F10): Also found by clean Sonnet (5c-F1)

The contaminated Sonnet also provided modestly more detailed evidence for shared findings.

**Assessment:** The contaminated prompt produced 1 genuinely new finding (G8 guardrail violation) that clean Sonnet missed. This is the strongest case for contamination improving coverage. However, the effect is small (1 finding) and may reflect random variation rather than systematic improvement.

#### Overall contamination assessment

The contamination effect is **weak and inconsistent**:
- GPT-5.4 high: Contamination improved coverage (6 -> 9)
- GPT-5.4 xhigh: Contamination slightly reduced findings (11 -> 10)
- Sonnet 4.6: Contamination modestly improved coverage (11 -> 13)

The extra findings in contaminated runs are generally real signals, not inflation. However, the inconsistency across models and the small effect size mean the contamination variable is less important than the model choice variable. The clean runs produced findings of comparable or equal quality.

---

### 2d. Recommendations for Sensor Model Selection

#### Normal operation (per-project signal collection)

**Recommended: Sonnet 4.6**

Rationale:
- Tied for second-highest finding count (11, same as GPT-5.4 xhigh)
- Strongest evidence depth with full timestamps and context
- Best counter-evidence quality among non-Opus models
- Reads the most tokens (~85K) -- thoroughness matters for discovery
- Identifies capability-gaps and observations, not just concrete events
- The user's existing preference (MEMORY.md: "always use Sonnet for sensor agents") is empirically supported
- Cost-effective relative to Opus for routine signal collection

#### Audit mode (cross-project, broader scope)

**Recommended: Opus 4.6**

Rationale:
- Highest finding count (12 in clean run)
- Strongest synthesis -- connects findings across sessions into patterns
- Deepest counter-evidence and philosophical framing
- Best at identifying observations (structural insights) vs just struggles/deviations
- The contaminated Opus on Assignment 2 found 18 findings with the richest cross-session patterns
- Justified cost for high-stakes milestone audits and cross-project reviews

#### When to use GPT-5.4

GPT-5.4 xhigh is a reasonable alternative for specific use cases:
- When cross-model diversity is desired (audit with both Sonnet + GPT-5.4 xhigh for adversarial coverage)
- When the task is specifically about detecting concrete events (struggles/deviations) rather than structural observations

GPT-5.4 medium and high are not recommended for discovery work. Medium missed too many findings (8 vs 11-12 for stronger models). High read too few tokens (28K vs 45-85K) and produced the fewest findings (6).

#### Prompt hygiene practices

Based on the contamination analysis:
- **Use clean prompts** for normal operation. The contamination effect is weak and inconsistent -- clean prompts avoid the risk of inflation without meaningful loss of coverage.
- **Mention the comparison context only when running explicit model comparison experiments**, not in production prompts.
- **Do not include prior finding counts** in prompts. The GPT-5.4 high contaminated run's improvement (6 -> 9) may partly reflect the model trying to "match" a mentioned count rather than genuinely finding more signals.
- **"Be maximally thorough" is acceptable** as a prompt instruction since it encourages reading more tokens, which empirically correlates with finding more real signals.

#### Cost-effectiveness summary

| Model | Findings | Est. Cost (relative) | Findings per unit cost |
|-------|----------|---------------------|----------------------|
| GPT-5.4 medium | 8 | 1x | 8.0 |
| GPT-5.4 high | 6 | ~2x | 3.0 |
| GPT-5.4 xhigh | 11 | ~4x | 2.75 |
| Sonnet 4.6 | 11 | ~2x | 5.5 |
| Opus 4.6 | 12 | ~5x | 2.4 |

Sonnet has the best cost-effectiveness ratio for routine use. Opus is justified for high-stakes audits where the extra synthesis quality and 1-2 additional findings matter. GPT-5.4 medium is the cheapest but misses too much. The GPT-5.4 reasoning tiers have poor cost-effectiveness relative to Sonnet (similar finding counts at higher cost).

---

## Appendix: Evidence Density by Project

| Project | Unique Findings | Sessions | Primary Themes |
|---------|----------------|----------|----------------|
| get-shit-done-reflect | 14 | 8 | Quality gates, signal lifecycle, protocol compliance |
| vigil | 12 | 7 | Premature closure, hardware validation, spike methodology |
| blackhole-animation | 8 | 6 | Premature closure, external tools, protocol bypass |
| arxiv-sanity-mcp | 5 | 2 | Spike methodology, experimental design |
| f1-modeling | 3 | 2 | Quality gates, external tools |
| zlibrary-mcp | 2 | 1 | CI verification |
| PDFAgentialConversion | 1 | 1 | discuss-phase semantics |
| epistemic-agency | 2 | 1 | Feature adoption, discuss-phase |
| personal (writings) | 3 | 2 | Scholarly methodology, NotebookLM |
| other | 2 | various | Cross-machine, merge conflicts |

The highest signal density is in gsdr (the harness itself) and vigil (a project at a critical architectural decision point). This is expected: gsdr is where workflow gaps manifest directly, and vigil's framework decision triggered the most user pushback.
