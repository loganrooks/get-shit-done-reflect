# GPT-xhigh Synthesis: Cross-Platform Session Log Audit

## Executive Summary

- The 6 primary discovery reports (67 findings) plus the calibration report (5 signals) collapse to **71 unique findings**. The only direct duplicate is the PDFAgentialConversion `discuss-phase --auto` failure reported in both `A5-F2` and `Cal-S1`.
- The broadest pattern is not a single bug but a regime: **the harness repeatedly prefers closure/action over inquiry/verification**. It appears in `discuss-phase` semantics, premature framework decisions, falsification spikes, and research claims across at least 6 projects (`A5-F2`, `A3-F2`, `A1-F10`, `A4-F9`, `A2-F6`, `A2-F12`, `A6-F6`).
- **Verification is structurally optimistic.** Plan checker skips, CI theater, verifier overclaims, and "shipped" status without deployability all show the same problem: the system checks whether process artifacts exist, not whether reality matches the claim (`A1-F1`, `A2-F8`, `A3-F8`, `A5-F8`, `A6-F5`, `A1-F2`).
- **Workflow transitions are under-specified.** Mid-phase scope revision, inter-phase PR/CI/merge, quick-task branching, release intent, and handoff cleanup all leak responsibility back to the user (`A5-F3`, `A5-F7`, `A3-F6`, `A6-F4`, `A6-F2`, `A5-F6`, `A2-F1`).
- **The signal system is not closing the loop.** It can detect issues, but not reliably self-signal, track remediation, distinguish states, or expose a stable log-sensor capability (`A1-F4`, `A1-F7`, `A1-F13`, `A5-F4`, `A4-F1`, `A4-F3`).
- **Unsafe orchestration remains a product risk.** Wrong-agent dispatch, no abort semantics, Codex CLI harness uncertainty, PID mixups, and headless launch failures all caused real user-facing breakdowns and in one case a destructive cascade (`A1-F3`, `A2-F4`, `A3-F3`, `A3-F5`, `A6-F3`).
- Immediate v1.20 work should focus on four things: lawful workflow transitions, verification gates that test enforcement/reality, signal lifecycle basics, and explicit exploratory-vs-decision-capture semantics.
- Longer-horizon roadmap work should mature the signal system, build retroactive qualification/traceability across spikes and phases, establish authoritative cross-machine runtime state, and harden multi-agent/headless orchestration.
- In Assignment 5, the clean runs suggest **GPT-5.4 xhigh** had the best balance of coverage and synthesis, **GPT-5.4 medium** was the best cheap first pass, **Sonnet clean** produced the deepest evidence, and **prompt contamination mostly changed selection/recall rather than creating obviously fake findings**.

## 1. Finding Synthesis

### 1a. Deduplicated Finding Registry

72 reported items became 71 unique findings. The only direct duplicate was the PDFAgentialConversion `discuss-phase --auto` failure (`A5-F2`, `Cal-S1`). Project names below are normalized for readability, and session IDs are shown as unique 8-character prefixes. Citation key: `A3-F8` = Agent 3, Finding 8; `Cal-S3` = Calibration Signal 3.

| ID | Source(s) | Session | Project | Type | Severity | Canonical description |
| --- | --- | --- | --- | --- | --- | --- |
| U01 | Cal-S2 | c767da7b | PDFAgentialConversion | deviation | medium | heavy discuss-phase setup stayed in main context instead of delegating to a scout |
| U02 | Cal-S3 | c767da7b | PDFAgentialConversion | struggle | medium | agent made three wrong concessions before checking the workflow and diagnosing the real gap |
| U03 | Cal-S4 | c767da7b | PDFAgentialConversion | observation | low | hallucinated `todo match-phase` command caused a small parallel error cascade |
| U04 | Cal-S5 | c767da7b | PDFAgentialConversion | observation | low/insight | user patched GSDR locally and resumed, documenting a patch-and-return workflow pattern |
| U05 | A3-F9 | aa35375e | ZionismGenealogy | observation / capability-gap | minor | ad-hoc session-history lookup became a workaround for missing non-GSD continuity |
| U06 | A2-F11 | 7b8cf8ae | arxiv-sanity-mcp | capability-gap | notable | spike workflow lacks structured limitations and methodology-critique sections |
| U07 | A2-F12 | 7b8cf8ae | arxiv-sanity-mcp | capability-gap | notable | later spikes cannot automatically qualify or update earlier spike conclusions |
| U08 | A2-F6 | 7b8cf8ae | arxiv-sanity-mcp | capability-gap / observation | notable | Jaccard was used as a weak semantic-search metric until the user challenged it |
| U09 | A2-F7 | 7b8cf8ae | arxiv-sanity-mcp | capability-gap | notable | a 100-paper sample was too small for the claims being made |
| U10 | A4-F5 | 00ea5720 | blackhole-animation | struggle | minor | `insert`/`add` phase-command semantics were close enough to cause a wrong roadmap edit |
| U11 | A4-F6 | 00ea5720 | blackhole-animation | observation | notable | a spike framed as open exploration silently drifted into surveying existing solutions |
| U12 | A5-F6 | 308cd666 | blackhole-animation | deviation | notable | auto-advance skipped explicit `.continue-here` preflight tasks |
| U13 | A3-F13 | 4e94f656 | blackhole-animation | struggle | notable | remote-machine disk exhaustion blocked execution mid-wave |
| U14 | A2-F3 | 4f9af08b | blackhole-animation | deviation | notable | assistant spawned a Claude subagent instead of the requested Codex CLI reviewer |
| U15 | A5-F4 | 5a9bbf1c | blackhole-animation | capability-gap | notable | `collect-signals` advertised a log sensor that did not actually exist in runtime use |
| U16 | A4-F1 | 622b1a8d | blackhole-animation | deviation | notable | working log sensor was skipped because runtime metadata still said it was disabled |
| U17 | A4-F2 | 622b1a8d | blackhole-animation | capability-gap | notable | the log-sensor fix stayed conversational; shipped source still contained the stub |
| U18 | A3-F1 | 7f423906 | blackhole-animation | struggle / deviation | critical | a subagent closed SpaceEngine Gate 2 without asking the user for required facts |
| U19 | A5-F2; Cal-S1 | c767da7b | PDFAgentialConversion | capability-gap | notable/high | `discuss-phase --auto` auto-resolved decisions instead of supporting exploratory discussion |
| U20 | A3-F11 | 7f423906 | blackhole-animation | capability-gap | notable | `/gsdr:quick` lacked a research-only mode |
| U21 | A3-F2 | 7f423906 | blackhole-animation | struggle / observation | critical | repeated premature closure required multiple user push-backs in the same session |
| U22 | A2-F1 | ee9a18b6 | blackhole-animation | deviation | notable | agent ran research and informal scoping before formal phase-insertion workflow |
| U23 | A2-F2 | ee9a18b6 | blackhole-animation | struggle | notable | user needed multiple interruptions before protocol drift was acknowledged |
| U24 | A3-F3 | fb3a0a76 | blackhole-animation | struggle / deviation | critical | PID-based Codex CLI cleanup killed the wrong project session |
| U25 | A3-F4 | fb3a0a76 | blackhole-animation | observation (positive signal) | notable | independent cross-model audit caught bugs that self-verification missed |
| U26 | A3-F5 | fb3a0a76 | blackhole-animation | capability-gap / struggle | notable | Codex CLI execution hung silently at stdin initialization |
| U27 | A3-F8 | fb3a0a76 | blackhole-animation | observation / capability-gap | critical | `gsdr:verifier` systematically overclaimed spec conformance across four phases |
| U28 | A3-F14 | 291fb270 | epistemic-agency | observation / capability-gap | notable | installed `discuss-phase --auto` still behaved as decision-locking rather than exploratory |
| U29 | A3-F7 | 291fb270 | epistemic-agency | deviation / capability-gap | notable | upstream discuss-mode adoption silently dropped dependent files/features |
| U30 | A2-F4 | 7ba47151 | f1-modeling | struggle / capability-gap | critical | Codex CLI audit launch went through a 6+ attempt debugging loop before it wrote reports |
| U31 | A2-F5 | 7ba47151 | f1-modeling | deviation | minor | assistant implemented fixes directly instead of routing through a quick-task workflow |
| U32 | A4-F11 | b6fa8e41 | f1-modeling | observation | minor | browser verification capability was missing at checkpoint time and required opportunistic install |
| U33 | A1-F1 | bb8a9df5 | f1-modeling | deviation | notable | plan checker was skipped because the phase looked small, and it later found a real blocker |
| U34 | A1-F2 | bb8a9df5 | f1-modeling | struggle | critical | executor ignored research pitfall warnings and generated invalid circuit geometry |
| U35 | A3-F12 | 081de5ed | get-shit-done-reflect | capability-gap / observation | minor | dev version strings lacked commit-level traceability |
| U36 | A3-F6 | 081de5ed | get-shit-done-reflect | deviation | critical | `gsdr:quick` committed runtime code directly to `main` without CI gate |
| U37 | A5-F7 | 41c5d67b | get-shit-done-reflect | deviation | critical | squash merge destroyed atomic commit history |
| U38 | A6-F2 | 7c46a5cd | get-shit-done-reflect | deviation | notable | resume logic trusted a stale `.continue-here` file that should have been deleted |
| U39 | A6-F3 | 7c46a5cd | get-shit-done-reflect | struggle | critical | headless execution launch mode was wrong, then retried repeatedly under user pressure |
| U40 | A6-F4 | 7c46a5cd | get-shit-done-reflect | deviation | critical | commit wording implicitly caused a minor release where the user intended a patch |
| U41 | A5-F3 | 7e77edff | get-shit-done-reflect | capability-gap | critical | there was no lawful workflow for mid-phase scope revision / justified deviance |
| U42 | A4-F3 | 9b4aa82a | get-shit-done-reflect | deviation | notable | background sensor model selection was implicit and not runtime-verifiable |
| U43 | A4-F4 | 9b4aa82a | get-shit-done-reflect | struggle | notable | assistant speculated before verifying upstream source facts |
| U44 | A1-F12 | cb3ee1b7 | get-shit-done-reflect | observation | critical | source and local-patched `discuss-phase` embodied opposite philosophies of `--auto` |
| U45 | A1-F13 | cb3ee1b7 | get-shit-done-reflect | capability-gap | notable | signal lifecycle lacked states such as proposed/delegated/in-progress/blocked |
| U46 | A1-F3 | cb3ee1b7 | get-shit-done-reflect | struggle | critical | wrong agent type plus no abort plus installer bug caused a 91-file destructive cascade |
| U47 | A1-F4 | cb3ee1b7 | get-shit-done-reflect | capability-gap | critical | cascade failure did not trigger any self-signal until the user asked for one |
| U48 | A1-F5 | cb3ee1b7 | get-shit-done-reflect | deviation | notable | emergency fix was treated as done without proper PR/CI/release workflow |
| U49 | A1-F6 | cb3ee1b7 | get-shit-done-reflect | observation | notable | automation postlude was proposed for extension despite a 0% observed success rate |
| U50 | A1-F7 | cb3ee1b7 | get-shit-done-reflect | capability-gap | critical | signal lifecycle had near-zero remediation/verification closure and high staleness |
| U51 | A1-F8 | eb9541ff | get-shit-done-reflect | observation | notable | plan checker treated "workaround available" as equivalent to low severity |
| U52 | A2-F9 | 02807c65 | home-level GSD install | observation / capability-gap | notable | upstream/fork feature names looked similar while meaning opposite things |
| U53 | A6-F1 | 3de8caf1 | home-level planning | capability-gap | notable | wrong workspace plus decimal-phase parser weakness produced a false "phase missing" error |
| U54 | A6-F7 | e75f3f5f | multiple | observation | minor | parallel execution repeatedly generated expected planning-file merge conflicts |
| U55 | A1-F10 | 2c1aa264 | vigil | struggle | notable | a 100% failure result was accepted before the agent investigated methodological alternatives |
| U56 | A1-F11 | 2c1aa264 | vigil | struggle | notable | user message truncation forced ~45 minutes of reconstruction work |
| U57 | A1-F14 | 2e41c1ff | vigil | observation | notable | adversarial Codex review caught spike-design flaws missed by the main process |
| U58 | A1-F9 | 2e41c1ff | vigil | capability-gap | notable | spike workflow performed research inline instead of delegating to a spike researcher |
| U59 | A5-F1 | 7159dba1 | vigil | struggle | notable | pilot energy measurement was launched after contamination risk was explicitly acknowledged |
| U60 | A5-F5 | 72a74af3 | vigil | observation | minor | feasibility research answered "possible" before answering the adversarial tradeoff question |
| U61 | A6-F6 | 84be1fa4 | vigil | observation | notable | framework conclusions flipped after the agent recognized measurement/setup contamination |
| U62 | A3-F10 | 8c2cdf8a | vigil | struggle / deviation | notable | same roadmap addendum had to be reconsidered twice because `--auto` ran ahead |
| U63 | A5-F8 | a9f00be2 | vigil | observation | notable | first live hardware run exposed multiple latent bugs from earlier phases |
| U64 | A4-F9 | c4c15beb | vigil | deviation | critical | falsification testing almost produced a false "Swift is fundamentally broken" conclusion |
| U65 | A4-F7 | c82e801b | vigil | capability-gap | critical | GSD and GSDR shared a backup directory and overwrote each other's local patch backups |
| U66 | A4-F8 | c82e801b | vigil | deviation | notable | Claude-side patches were copied into Codex before compatibility had been checked |
| U67 | A4-F12 | e044f032 | vigil | struggle | notable | macOS GUI automation constraints kept breaking "full automation" promises |
| U68 | A4-F10 | 51d08d98 | writings/notebooklm | capability-gap | notable | NotebookLM entered a canned-response loop until the user discovered a workaround |
| U69 | A2-F10 | 88d4dd53 | writings/notebooklm | observation / capability-gap | minor | NotebookLM caching behavior interfered with targeted scholarly research |
| U70 | A6-F5 | 3d2f2bc6 | zlibrary-mcp | observation | notable | `/gsdr:progress` declared "shipped" while CI and npm release were still broken |
| U71 | A2-F8 | fdd15155 | zlibrary-mcp | struggle / observation | critical | CI quality gates were theater because failures did not actually fail the build |

### 1b. Thematic Clusters

#### C1. Closure Beats Inquiry

- Findings: `A5-F2`, `Cal-S1`, `A3-F2`, `A3-F14`, `A1-F12`, `A1-F10`, `A4-F9`, `A6-F6`, `A2-F6`, `A2-F7`, `A2-F11`, `A2-F12`, `A4-F6`, `A5-F5`, `A5-F8`.
- Cluster insight: across workflows, spikes, and research sessions, the default move is to settle, narrow, or narrate rather than keep uncertainty open long enough to test it. Sometimes this is semantic (`discuss-phase --auto`), sometimes epistemic (accepting 100% failure, weak metrics, too-small samples, feasibility without adversarial comparison), and sometimes architectural (locking framework decisions before live validation). The same closure bias shows up in both design-time workflows and empirical testing.
- Breadth: at least 6 projects (`PDFAgentialConversion`, `blackhole-animation`, `vigil`, `arxiv-sanity-mcp`, `epistemic-agency`, `get-shit-done-reflect`) across at least 11 sessions.

#### C2. Workflow Transitions Are Under-Specified

- Findings: `A2-F1`, `A2-F2`, `A4-F5`, `A5-F6`, `A2-F5`, `A3-F6`, `A5-F7`, `A6-F2`, `A6-F3`, `A6-F4`, `A5-F3`, `A1-F5`, `A6-F1`, `A3-F10`, `A6-F5`.
- Cluster insight: the system has detailed artifacts inside phases, but its transition points are weak: add/insert phase semantics, consume-and-delete handoffs, revise a phase after scope changes, complete a phase and move through PR/CI/merge, branch safely for quick tasks, and interpret release semantics. The user repeatedly had to act as transition governor because the harness did not encode those boundaries strongly enough.
- Breadth: at least 6 projects/contexts (`blackhole-animation`, `f1-modeling`, `get-shit-done-reflect`, `vigil`, `zlibrary-mcp`, home-level planning/install).

#### C3. Verification Checks Process Presence, Not Reality

- Findings: `A1-F1`, `A1-F2`, `A3-F4`, `A3-F8`, `A2-F8`, `A4-F11`, `A5-F8`, `A4-F9`, `A6-F5`, `A1-F8`.
- Cluster insight: the harness is good at proving that steps happened and artifacts exist, but weak at proving that gates fail closed, claims conform to spec, runtime behavior matches assumptions, or releases are actually deployable. This is the deepest single risk because it can certify wrong work as complete.
- Breadth: at least 5 projects (`f1-modeling`, `blackhole-animation`, `vigil`, `zlibrary-mcp`, `get-shit-done-reflect`) across both product and harness work.

#### C4. Signal Collection Detects Problems but Cannot Close the Loop

- Findings: `A5-F4`, `A4-F1`, `A4-F2`, `A4-F3`, `A1-F4`, `A1-F6`, `A1-F7`, `A1-F13`.
- Cluster insight: the signal system is half-built in exactly the dangerous way. It can announce capabilities that are missing, collect observations that never get closed, leave stale signals active after fixes, and require user intervention to create the very signals that the session obviously warranted. Even the model used for sensors was insufficiently observable.
- Breadth: concentrated in the platform itself, but it affects every project because signal collection is meant to be the cross-project learning loop.

#### C5. Unsafe Orchestration and External Tooling

- Findings: `A1-F3`, `A2-F3`, `A2-F4`, `A3-F3`, `A3-F5`, `A6-F3`, `A4-F8`, `A5-F1`.
- Cluster insight: when work leaves the main conversational loop and enters subagents, background tasks, headless launches, or external CLIs, the system loses safety and observability. Wrong tool selection, no reliable abort, PID ambiguity, silent hangs, incompatible patch copying, and execution under known contamination constraints all share the same pattern: the system can initiate orchestration more easily than it can supervise it.
- Breadth: at least 4 projects (`get-shit-done-reflect`, `blackhole-animation`, `f1-modeling`, `vigil`).

#### C6. Artifact Authority and Context Hygiene Drift Over Time

- Findings: `Cal-S2`, `Cal-S4`, `Cal-S5`, `A3-F7`, `A2-F9`, `A4-F2`, `A6-F2`, `A3-F9`, `A1-F9`, `A1-F11`, `A4-F10`, `A2-F10`, `A6-F7`.
- Cluster insight: source, installed copy, local patch, state file, notebook output, and live session history all compete to become the authoritative artifact. When the system guesses wrong, it bloats main context, trusts stale state, or silently carries forward old assumptions. This cluster is less catastrophic than C2/C3, but it is a major multiplier for recurrence.
- Breadth: at least 6 contexts (`PDFAgentialConversion`, `get-shit-done-reflect`, `blackhole-animation`, `ZionismGenealogy`, `writings/notebooklm`, `multiple`).

### 1c. Actionable Recommendations

#### C1. Closure Beats Inquiry

- `Quick fix, high impact (v1.20)`: add mandatory "why might this be wrong?" checkpoints to spikes and discuss flows when any of the following occur: 100% success/failure, framework choice, feasibility claim, weak sample size, or user challenge. Force at least one alternative explanation, one external-source check, and one "what evidence is still missing?" block. Evidence: `A1-F10`, `A4-F9`, `A2-F6`, `A2-F7`, `A5-F5`. Effort: low-medium. Impact: high across research-heavy projects.
- `Fix now, requires planning (v1.20)`: formalize an exploratory `discuss_mode` separate from decision-capture mode, and make `--auto` an auto-advance mechanism rather than a semantic shortcut. Evidence: `A5-F2`, `Cal-S1`, `A3-F14`, `A1-F12`, `A2-F9`. Effort: medium. Impact: foundational; touches multiple core workflows.
- `Fix now, requires planning (v1.20)`: add a required reference-design survey step for architectural decisions and a required limitations/qualification section for spikes. Evidence: `A5-F5`, `A1-F14`, `A2-F11`, `A2-F12`, `A5-F8`. Effort: medium. Impact: high; likely reduces wasted spike work.
- `Research needed`: investigate how best to represent retroactive qualification and evolving confidence across agentic experiments/memory artifacts before building automatic cross-spike propagation. Evidence: `A2-F12`, `A1-F7`. This likely deserves a research/design phase before implementation.

#### C2. Workflow Transitions Are Under-Specified

- `Quick fix, high impact (v1.20)`: make `--squash` opt-in rather than default in project workflows, and make quick tasks touching runtime code fail closed unless they are on a branch with a PR path. Evidence: `A5-F7`, `A3-F6`, `A6-F4`. Effort: low-medium. Impact: immediate reduction in irreversible mistakes.
- `Quick fix, high impact (v1.20)`: make `/gsdr:progress` headline status depend on CI/release truth, not plan completion alone. Evidence: `A6-F5`, `A2-F8`. Effort: low. Impact: high because it corrects operator-facing state authority.
- `Fix now, requires planning (v1.20)`: add a lawful `/gsdr:revise-phase-scope` (or equivalent) workflow that updates `ROADMAP.md`, `REQUIREMENTS.md`, and phase artifacts before new scouting begins. Evidence: `A5-F3`, `A2-F1`, `A2-F2`, `A3-F10`. Effort: medium. Impact: high; affects ongoing milestone steering.
- `Fix now, requires planning (v1.20)`: encode explicit inter-phase PR/CI/merge/rebranch workflow and handoff-consumption/cleanup rules into the system rather than leaving them to operator memory. Evidence: `A5-F6`, `A6-F2`, `A6-F3`, `A1-F5`. Effort: medium. Impact: high across all code projects.
- `Design needed (v1.20)`: move release intent, merge policy, and phase-transition state out of prompt wording and into machine-readable workflow state. Evidence: `A6-F4`, `A5-F7`, `A6-F1`. Without this, the same semantic mistakes will recur in headless or delegated runs.

#### C3. Verification Checks Process Presence, Not Reality

- `Quick fix, high impact (v1.20)`: add explicit fail-closed enforcement checks to CI and verifier audits. Example pattern: do not merely verify that thresholds/configs exist; verify that a failing condition would actually fail the run. Evidence: `A2-F8`, `A3-F8`, `A6-F5`. Effort: low-medium. Impact: very high.
- `Quick fix, high impact (v1.20)`: add a required "real runtime / hardware smoke test performed or explicitly missing" field for projects with GUI, native modules, browser flows, or external execution. Evidence: `A5-F8`, `A4-F11`, `A4-F12`, `A1-F2`. Effort: low. Impact: high for Electron/native/browser work.
- `Fix now, requires planning (v1.20)`: redesign `gsdr:verifier` around spec conformance and evidence traceability, not just "seems to work." Evidence: `A3-F4`, `A3-F8`, `A1-F8`. Effort: medium-high. Impact: foundational.
- `Fix now, requires planning (v1.20)`: ensure execution prompts import RESEARCH pitfall warnings and anti-patterns into downstream executor context. Evidence: `A1-F2`, `A1-F1`. Effort: medium. Impact: high for complex build/execution phases.
- `Design needed (v1.20)`: create an evidence ledger linking each acceptance claim to proof type: local test, live hardware run, browser validation, external audit, or configuration enforcement check. This would also support future signal staleness checks.

#### C4. Signal Collection Detects Problems but Cannot Close the Loop

- `Quick fix, high impact (v1.20)`: stop advertising unavailable sensors. Either hide disabled sensors from user-facing output or make the registry authoritative and current. Evidence: `A5-F4`, `A4-F1`, `A4-F2`. Effort: low. Impact: high because it removes misleading affordances.
- `Quick fix, high impact (v1.20)`: add explicit sensor `model` recording and echo it back in launch output. Evidence: `A4-F3`. Effort: low. Impact: medium-high.
- `Quick fix, high impact (v1.20)`: add an incident self-signal hook or explicit "this session likely warrants a signal" checkpoint after destructive failures, reverted releases, or verifier/audit contradictions. Evidence: `A1-F4`, `A1-F3`. Effort: low-medium. Impact: high for learning loops.
- `Fix now, requires planning (v1.20)`: add lifecycle states such as `proposed`, `in_progress`, `blocked`, `verified`, and `stale`, and build a minimal remediation/closure loop. Evidence: `A1-F7`, `A1-F13`. Effort: medium. Impact: very high.
- `Design needed (v1.20)`: create a single source of truth for sensor implementation state across registry text, installed runtime, and source repo. Evidence: `A4-F1`, `A4-F2`, `A5-F4`. This needs design because source/install divergence is already present.
- `Future milestone`: build automated staleness detection and KB cleanup after the new state model exists. Evidence: `A1-F7`. It is real and important, but it should sit on top of lifecycle basics rather than precede them.

#### C5. Unsafe Orchestration and External Tooling

- `Quick fix, high impact (v1.20)`: require explicit preflight for external/headless runs: auth check, output path check, launch mode check, and process tag/PID capture. Evidence: `A2-F4`, `A3-F3`, `A3-F5`, `A6-F3`. Effort: low-medium. Impact: high.
- `Quick fix, high impact (v1.20)`: echo the chosen tool/model/agent type before dispatching work and require confirmation for destructive or non-local actions. Evidence: `A1-F3`, `A2-F3`, `A4-F8`. Effort: low. Impact: high.
- `Fix now, requires planning (v1.20)`: design an abortable subagent/headless execution wrapper with watchdogs, heartbeat logging, and safe kill semantics. Evidence: `A1-F3`, `A3-F3`, `A3-F5`, `A6-F3`. Effort: medium-high. Impact: very high.
- `Research needed`: review external literature and existing harness patterns for process supervision, kill semantics, and delegated-execution contracts before building deeper multi-agent orchestration. Evidence: the failures are clear, but the right abstraction is not yet obvious.

#### C6. Artifact Authority and Context Hygiene Drift Over Time

- `Quick fix, high impact (v1.20)`: enforce handoff-file consumption and deletion; surface a warning when stale `.continue-here` or authority artifacts are still present. Evidence: `A5-F6`, `A6-F2`. Effort: low. Impact: medium-high.
- `Quick fix, high impact (v1.20)`: add a message-length / truncation guard and a "session state may be incomplete" warning when very long user inputs are likely to be cut. Evidence: `A1-F11`. Effort: low. Impact: medium.
- `Fix now, requires planning (v1.20)`: make installed-vs-source-vs-local-patch authority explicit in runtime metadata, and surface when the running copy differs materially from source. Evidence: `A2-F9`, `A3-F7`, `A4-F2`, `A4-F7`, `A4-F8`. Effort: medium. Impact: high for cross-machine correctness.
- `Fix now, requires planning (v1.20)`: add a spike researcher delegate path so exploratory spikes do not bloat main context. Evidence: `Cal-S2`, `A1-F9`, `A1-F14`. Effort: medium. Impact: medium-high.
- `Future milestone`: reconsider shared mutable planning artifacts (`STATE.md` etc.) if parallel execution remains central. Evidence: `A6-F7`. This is real friction, but it is lower urgency than the state-truth and verification issues above.

### 1d. Severity Assessment

| Rank | Cluster / issue | Why it ranks here |
| --- | --- | --- |
| 1 | C3. Verification checks process presence, not reality | Highest depth and high breadth. It can ship broken work, accept false findings, and silently mislead milestone planning (`A2-F8`, `A3-F8`, `A5-F8`, `A6-F5`). |
| 2 | C1. Closure beats inquiry | Broadest epistemic pattern. It drives wrong design locks, weak spikes, and wasted implementation work across many projects (`A5-F2`, `A3-F2`, `A4-F9`, `A2-F6`). |
| 3 | C2. Workflow transitions are under-specified | Very fixable and highly disruptive. It causes wrong edits, wrong releases, unsafe merges, and scope confusion (`A5-F3`, `A5-F7`, `A3-F6`, `A6-F4`). |
| 4 | C4. Signal system cannot close the loop | Central platform problem. The whole audit-and-learn promise is weakened if signals remain stale or missing (`A1-F4`, `A1-F7`, `A5-F4`, `A4-F1`). |
| 5 | C5. Unsafe orchestration and external tooling | Lower breadth than C1-C4 but severe when it happens, including destructive incidents and long debugging loops (`A1-F3`, `A2-F4`, `A3-F3`, `A6-F3`). |
| 6 | C6. Artifact authority and context hygiene drift | Moderate depth but a major recurrence multiplier; it causes confusion, duplicate work, and source/install divergence (`A2-F9`, `A3-F7`, `A6-F2`, `A1-F11`). |
| 7 | Parallel metadata conflicts / environment-specific constraints | Real friction (`A6-F7`, `A4-F12`, `A3-F13`) but less central to v1.20 milestone scoping than the systemic workflow and verification gaps above. |

Most impactful individual findings for milestone planning:

1. `A2-F8`: CI gates existed but did not fail closed.
2. `A3-F8`: verifier systematically overclaimed across four phases.
3. `A1-F7`: signal lifecycle had near-zero remediation closure.
4. `A1-F3`: wrong-agent destructive cascade broke 91 files.
5. `A5-F3`: no lawful path for mid-phase scope revision.
6. `A5-F7`: squash merge destroyed atomic history in the flagship repo.
7. `A4-F7`: backup namespace collision created real patch-loss risk.
8. `A1-F2`: executor ignored explicit research pitfall warnings.
9. `A5-F2` / `Cal-S1`: discuss-phase `--auto` semantics were wrong enough to require a local patch mid-session.
10. `A5-F8` / `A4-F9`: live hardware and falsification runs exposed how far results could drift before reality intervened.

### 1e. Cross-Milestone Roadmap Implications

- `Workflow state authority` is the first prerequisite theme. Before deeper automation, the system needs authoritative semantics for `discuss-phase`, scope revision, inter-phase release transitions, and runtime/source/install truth. v1.20 should establish this foundation rather than layering more agent behavior on top of ambiguous state.
- `Epistemic quality gates` is the second theme. Once transitions are lawful, verification must become claim-aware: fail-closed CI checks, explicit hardware/runtime evidence, reference-design survey before architecture spikes, and spike qualification/limitations. This spans v1.20 and likely a follow-on milestone.
- `Signal system maturation` is the third theme. v1.20 should do the basics: stable sensor registry, explicit sensor model selection, incident self-signal prompts, and lifecycle states. Automatic staleness detection, remediation automation, and KB denoising should follow in a later milestone after the evidence/state model is settled.
- `Cross-machine/runtime authority` is a fourth theme. Several findings (`A1-F12`, `A2-F9`, `A3-F7`, `A4-F2`, `A4-F7`) show that source, npm release, local patch, and installed copy can diverge philosophically as well as textually. Longer-term work needs authoritative manifests and explicit compatibility/version routing.
- `Safe orchestration and memory` is a fifth theme. Abortable subagents, PID-safe headless wrappers, session-memory continuity, and conflict-resistant planning metadata all matter, but they depend on the earlier state/evidence foundations if they are not to become another source of silent drift.

Natural ordering dependencies:

1. Fix state authority and workflow transitions first.
2. Redesign verification/evidence gates on top of that state model.
3. Stabilize signal lifecycle and sensor truth on top of the new evidence/state model.
4. Extend into orchestration safety, retroactive qualification propagation, and broader memory systems.

Immediate v1.20 fixes should avoid closing doors on future work:

- Do not hard-code a single philosophy into `--auto`; separate exploratory and decision-capture modes explicitly.
- Do not implement a one-off log sensor against stale registry text; define a source-of-truth sensor contract first.
- Do not continue encoding release semantics in prompts or commit prefixes alone; make release intent a first-class workflow state.
- Do not build retroactive spike qualification as ad-hoc note edits; keep room for a future cross-artifact evidence graph.

### 1f. Divergence and Verification

| Issue | Divergent readings | Assessment | Verification task |
| --- | --- | --- | --- |
| `discuss-phase --auto` failure | `A5-F2` and `A3-F14` frame it as a workflow capability gap; `Cal-S1` and `Cal-S3` show concrete misbehavior and wrong concessions; `A1-F12` and `A2-F9` add source-vs-patch philosophical divergence. | Substantive divergence, but convergent root: semantics were ambiguous and cross-runtime state made it worse. | Diff pre-patch vs patched `discuss-phase` text, then verify current installed/source semantics on each runtime. |
| Log sensor status | `A5-F4` says the capability is a stub; `A4-F1` says the actual agent spec exists but registry text disabled it; `A4-F2` says the source repo still had stale stub text. | Substantive and time-sensitive. This is not just wording drift; it is source/install/runtime authority drift. | Verify fresh install behavior from source, registry metadata, and installed runtime. Confirm whether the shipped product exposes a real log sensor. |
| Delegation in the calibration session | `Cal-S2` treats main-context scouting as a deviation; the counter-evidence notes that pre-patch workflow text may not have required delegation yet. | Evidence is thinner than for the `--auto` semantic problem. It may be version-specific rather than a timeless workflow bug. | Check the exact pre-patch workflow around delegation requirements before scoping product work around this finding. |
| Feature adoption gap in `discuss_mode` | `A3-F7` frames it as a silent multi-file adoption drop; counter-evidence says some confusion came from upstream/main vs released npm state. | Substantive. It could be both: version confusion and incomplete adoption verification. | Compare the adoption PR, release tag, and installed runtime to determine whether files were dropped or simply never meant to ship in that version. |
| Codex CLI failures | `A2-F4` diagnoses auth/prompt/context-window/reasoning problems; `A3-F3` shows PID confusion; `A3-F5` shows stdin hang. | Not conflicting. These are multiple real failure modes in the same broader harness gap. | Run controlled harness experiments on launch mode, prompt style, auth preflight, PID tagging, and watchdog behavior before codifying any single diagnosis as "the" root cause. |
| Progress/shipping semantics | `A6-F5` says progress overclaimed "shipped" while release reality was broken; counter-evidence notes pending todos were still visible. | Substantive. The headline state is the problem, not the existence of lower-level debt fields. | Define canonical "shipped" criteria and unit-test `/gsdr:progress` against CI failure, secret absence, and unpublished release states. |

Findings that are real but should be verified before driving major scope:

- `Cal-S5` is a useful workflow insight, but it is not itself a defect.
- `A6-F7` (merge conflicts in planning metadata) is a structural tradeoff; quantify actual time cost before a large redesign.
- `A4-F10` and `A2-F10` are mostly external NotebookLM behavior; documentation/workarounds may be enough unless it becomes a wider dependency.
- `A3-F13` (disk full) is an operational constraint, not a strong milestone-scope driver by itself.

## 2. Model Comparison Analysis

Citation key for this section: `5` = `discovery-agent-5-report.md` (GPT-5.4 medium clean), `5b` = GPT-5.4 high clean, `5c` = Sonnet 4.6 clean, `5d` = Opus 4.6 clean, `5e` = GPT-5.4 xhigh clean, `5-high` = GPT-5.4 high contaminated, `5-xhigh` = GPT-5.4 xhigh contaminated, `5f` = Sonnet contaminated.

### 2a. Quantitative Comparison

| Run | Model / config | Prompt type | Assignment | Findings | Tokens read | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `5` | GPT-5.4 medium | clean | Assignment 5 | 8 | ~12k | baseline |
| `5b` | GPT-5.4 high | clean | Assignment 5 | 6 | ~28k | sparsest clean run |
| `5e` | GPT-5.4 xhigh | clean | Assignment 5 | 11 | ~46k | strong coverage with compressed synthesis |
| `5c` | Sonnet 4.6 | clean | Assignment 5 | 11 | ~85k | deepest evidence writing |
| `5d` | Opus 4.6 | clean | Assignment 5 | 12 | ~45k | broadest clean count, but different selection profile |
| `5-high` | GPT-5.4 high | contaminated | Assignment 5 | 9 | ~18k | prompt mentioned comparison / prior counts / thoroughness |
| `5-xhigh` | GPT-5.4 xhigh | contaminated | Assignment 5 | 10 | ~43.5k | prompt contaminated |
| `5f` | Sonnet 4.6 | contaminated | Assignment 5 | 13 | ~85k | prompt contaminated |
| `2-opus` | Opus 4.6 | contaminated | Assignment 2 | 18 | ~85k | different assignment; qualitative only |

Confounds:

- Clean vs contaminated runs differ in prompt framing, not just model awareness.
- `2-opus` is on Assignment 2, not Assignment 5, so its count is not comparable.
- There is only one run per condition. This is suggestive evidence, not statistically strong evidence.

### 2b. Qualitative Comparison

#### Overlap among the 5 clean Assignment 5 runs

Most structurally obvious signals:

| Canonical Assignment 5 signal | Clean models that found it |
| --- | --- |
| `discuss-phase --auto` behaved as decision-locking rather than exploratory discussion (`c767da7b`) | `5`, `5b`, `5c`, `5d`, `5e` |
| The log sensor was not real/usable as advertised (`5a9bbf1c`) | `5`, `5b`, `5c`, `5d`, `5e` |
| Late/live hardware validation exposed that earlier vigil work was over-trusted (`a9f00be2`) | `5`, `5b`, `5c`, `5d`, `5e` |
| The energy-measurement session contained a real epistemic/procedural failure (`7159dba1`) | all 5, though `5e` bundled contamination with unsourced estimates rather than isolating contamination alone |

Signals found by some but not most:

| Signal | Frequency | Notes |
| --- | --- | --- |
| Mid-phase scope revision had no formal path (`7e77edff`) | 3/5 | `5`, `5d`, `5e` |
| Squash merge destroyed commit history (`41c5d67b`) | 3/5 | `5`, `5c`, `5e` |
| Framework decision locked before hardware validation (`a9f00be2`) | 3/5 | `5c`, `5d`, `5e`; medium/high clean noticed the runtime bug cluster but not always the earlier decision lock |
| Source-verification / writing-drift issue (`b8b2d6cb`) | 3/5 | `5c`, `5d`, `5e` |
| Inter-phase PR/CI workflow skip separate from squash merge (`41c5d67b`) | 2/5 | `5c`, `5e` |
| Handoff preflight skipped (`308cd666`) | 2/5 | `5`, `5e` |
| Reference-design survey outperformed spikes (`7159dba1`) | 2/5 clean | `5c`, `5d` |

#### Unique findings and model-specific strengths

- `GPT-5.4 medium clean (5)` uniquely emphasized the 72a session as a **feasibility-vs-adversarial-comparison** failure. It was good at surfacing obvious workflow/product mismatches cheaply, but it rarely split a session into multiple distinct signals.
- `GPT-5.4 high clean (5b)` uniquely focused on the **wrong planner profile / incomplete handoff** diagnosis for the 72a doc-migration quick task. In this sample it was selective to a fault; higher reasoning effort did not improve recall.
- `Sonnet clean (5c)` uniquely separated the `41c5d67b` session into **squash-merge** and **inter-phase git workflow** findings and split the writings session into API error, query-technique, and source-verification findings. It was best at operational granularity.
- `Opus clean (5d)` uniquely surfaced the **idle-wait script can never trigger in an always-on workflow** constraint and the **writing repo structure false start**. It also elevated the reference-design survey insight to critical importance.
- `GPT-5.4 xhigh clean (5e)` uniquely combined the 7159 energy-session failures into a stronger **epistemic-fragility** synthesis, linking uncited numeric estimates and the contamination-violating pilot launch.

#### Missed findings and likely blind spots

- `GPT-5.4 medium clean` missed the separate inter-phase git workflow problem, the explicit framework-decision-lock diagnosis, the writings/source-verification issue, and the reference-design-survey lesson. It appears weaker at extracting second-order or philosophically framed signals from the same session.
- `GPT-5.4 high clean` missed the scope-revision gap, the squash-merge/inter-phase workflow cluster, and the reference-design lesson, despite reading more tokens than medium. In this sample it was the least attractive clean configuration.
- `Sonnet clean` missed the formal scope-revision gap (`7e77edff`) and the 72a planner/doc-migration issue, even while producing richer evidence elsewhere.
- `Opus clean` missed the `41c5d67b` git-workflow cluster entirely and did not surface the `308cd666` handoff-preflight issue. It seems more drawn to conceptual or cross-session abstractions than to some concrete workflow regressions.
- `GPT-5.4 xhigh clean` missed the reference-design-survey lesson as a separate finding and did not split the writings session into API/query-technique subfindings. It preferred higher-level synthesis over operational splitting.

#### Evidence quality

- `5c` (Sonnet clean) had the deepest writeups: longest report bodies, the highest reported transcript read volume (~85k), and the most detailed evidence/counter-evidence structure. It is the strongest "show me the receipts" model in this sample.
- `5e` (GPT-5.4 xhigh clean) was more compressed than Sonnet but had the best balance of breadth, causal synthesis, and restraint. It often turned several turns of evidence into a tighter system-level diagnosis.
- `5d` (Opus clean) was also evidence-rich, but it was more willing to elevate meta-lessons and low-salience side findings, so its count advantage over `5c` should not be read as pure recall advantage.
- `5` (GPT-5.4 medium clean) wrote concise findings with lower evidence depth. It is useful as a first-pass sensor, not as the last word.
- `5b` (GPT-5.4 high clean) was the weakest cost/depth tradeoff in this experiment.

#### Finding types by model

- `GPT-5.4 medium clean`: mostly workflow/capability gaps and obvious runtime failures.
- `GPT-5.4 high clean`: similar distribution, but even more conservative/selective.
- `GPT-5.4 xhigh clean`: strongest on system-level capability gaps and multi-cause syntheses.
- `Sonnet clean`: strongest on operational splits, human-collaboration nuance, and multi-step evidentiary narration.
- `Opus clean`: strongest on meta-methodological and architecture-lesson framing, but more willing to spend findings on side observations.

### 2c. Contamination Effect Analysis

#### GPT-5.4 high: clean 6 vs contaminated 9

- Extra contaminated findings: scope-revision gap, handoff-preflight skip, squash-merge history loss, and writings/source-verification emphasis.
- Missing from contaminated relative to clean: query-technique correction and the narrower planner-profile diagnosis.
- Assessment: the extra contaminated findings all map to signals that other clean models also found, so this does **not** look like obvious hallucinated inflation. It looks more like prompt contamination steering the model toward "comparison-worthy" workflow failures and away from quieter tool-use nuance.

#### GPT-5.4 xhigh: clean 11 vs contaminated 10

- Contaminated added: the reference-design-survey lesson as an explicit finding.
- Contaminated dropped: the late-hardware-validation runtime-bug cluster and the uncited-energy-estimate subfinding as separate items.
- Assessment: xhigh looks relatively stable under contamination. The count barely changed; selection changed more than recall. Prompt contamination pushed it toward a bigger architectural lesson and away from lower-level operational splits.

#### Sonnet 4.6: clean 11 vs contaminated 13

- Extra contaminated findings: scope-revision gap, quick-mode planner/doc-migration gap, and unsourced energy estimates.
- Missing from contaminated relative to clean: the writings/source-verification issue as a standalone finding.
- Assessment: again, the extra contaminated findings are corroborated elsewhere, so this is not obvious fabrication. It is a recall/selection shift toward already-salient audit themes.

#### Overall contamination effect

- In this dataset, contaminated prompts mostly **changed what the models prioritized** rather than causing obviously false findings.
- The risk is still serious: contaminated prompts make counts uninterpretable because they encourage models to search for missing categories, split sessions more aggressively, or favor benchmark-style findings over quieter but real issues.
- Conclusion: prompt hygiene matters enough that contaminated and clean runs should not be mixed in a scorecard.

### 2d. Recommendations for Sensor Model Selection

- `Normal operation`: use **GPT-5.4 medium with a clean prompt** as the default log sensor. It delivered the best rough findings-per-token ratio in this sample, found the most structurally obvious/high-value issues, and is suitable for broad first-pass coverage.
- `Audit mode`: use **GPT-5.4 xhigh with the same clean prompt** for deeper cross-project audit passes. In this sample it matched Sonnet clean on finding count, produced stronger synthesis than medium/high, and was more stable under prompt contamination than the other compared models.
- `Optional adjudicator`: when a session is philosophically dense, methodologically subtle, or likely to affect milestone design, run **Sonnet clean as a second reader**, not as the default primary sensor. Its evidence depth is excellent, but its token cost is materially higher.
- `Do not default to GPT-5.4 high clean`. It underperformed medium and xhigh on both coverage and cost-effectiveness in this experiment.
- `Prompt hygiene`: keep prompts blind. Do not mention comparison, prior finding counts, model rankings, or "be maximally thorough." Log prompt version, model, reasoning setting, assignment, and whether the run was clean/contaminated in the report header.
- `Cost-effectiveness`: if report-header token counts are used as a rough proxy, medium clean had the strongest cheap-screening profile, xhigh clean and Opus clean were mid-tier, and Sonnet clean traded much higher cost for richer evidence. Counts are not quality scores, so use this only as directional planning input.

