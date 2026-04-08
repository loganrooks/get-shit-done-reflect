# Discovery Report: Agent 5

**Sessions analyzed:** 9 of 9 assigned
**Events triaged:** 76
**Events escalated:** 11
**Signals found:** 6
**Tokens of session data read:** ~28K

## Findings

### Finding 1: Pilot launched after contamination risk was explicitly acknowledged
**Session:** 7159dba1-3122-4391-b0eb-3096d2f4f31c | **Project:** -Users-rookslog-Development-vigil | **Machine:** apollo
**Type:** deviation
**Severity:** notable

**What happened:**
The agent correctly identified that another active research/planning agent would contaminate the energy measurement, then launched the 55-minute pilot anyway two turns later. The user had to interrupt and explicitly stop it.

**Evidence:**
`USER:` "well no there is an agent running researching and planning..."

`ASSISTANT:` "That's a problem. A research/planning agent is doing web searches, reading files, spawning subagents... That's exactly the kind of variable background load that contaminates the delta."

`ASSISTANT:` "Pilot is running in the background. ~55 minutes."

`USER:` "uh no!!! claude code is running" / "stop !!!1"

`ASSISTANT:` "Stopped. Sorry — you literally just said the agent was a concern and I fired it off anyway."

**What this reveals:**
The workflow had no hard preflight gate between "constraint understood" and "long-running action started." Once the conversation shifted back toward getting the pilot running, the agent acted on momentum instead of its own freshly stated measurement conditions.

**Counter-evidence:**
The agent stopped quickly and owned the mistake. The user was also actively exploring whether "noisy real world" measurement might still be acceptable, so the context was not purely one-directional.

---

### Finding 2: "Healthy, no blockers" masked a stack of real runtime bugs
**Session:** a9f00be2-46e5-4fa5-aea8-13f5bd1f4fd3 | **Project:** -Users-rookslog-Development-vigil | **Machine:** apollo
**Type:** observation
**Severity:** notable

**What happened:**
The resumed session presented VIGIL as effectively healthy, with Phase 2 complete and no blockers. The first real `npm run dev` on hardware immediately surfaced multiple latent bugs: wrong Electron entrypoint, broken native addon loading, and a CSP-blocked debug window.

**Evidence:**
`ASSISTANT:` "Health: 110/110 tests passing, clean build, no blockers. Non-blocking reminder: You haven't visually verified Phase 2 on hardware yet."

`USER:` "App threw an error during load TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension '.ts'"

`ASSISTANT:` "How it happened: This was likely a latent bug from Phase 1 scaffolding... If nobody ran `npm run dev` on hardware... this never surfaced."

`ASSISTANT:` "Two issues found: 1. `@paymoapp/active-window` native addon is broken..."

`ASSISTANT:` "That's the bug. `script-src 'self'` blocks inline scripts."

**What this reveals:**
Desktop/runtime work was being marked effectively complete off tests plus artifact inspection, with hardware verification treated as advisory. That let three independent runtime defects survive phase completion.

**Counter-evidence:**
These are the kinds of issues that unit tests and static review often miss, and the agent did diagnose and fix them once the user ran the app. The signal is about the gate, not the debugging itself.

---

### Finding 3: Quick-mode revision used the wrong planner profile and incomplete handoff
**Session:** 72a74af3-f694-492b-a6ba-7a418880fd80 | **Project:** -Users-rookslog-Development-vigil | **Machine:** apollo
**Type:** deviation
**Severity:** notable

**What happened:**
The agent treated a documentation revision as a straightforward quick task, spawned a planner, executed it, and only afterward admitted the planner should have been Opus and the handoff was incomplete. Manual audit then found the revision had left dozens of `xcodebuild` references behind.

**Evidence:**
`ASSISTANT:` "This task is straightforward — I know exactly what needs to change. Spawning planner in quick mode."

`ASSISTANT:` "Sonnet for the planner was wrong... Context handover was incomplete."

`ASSISTANT:` "The revision was badly incomplete. Dozens of `xcodebuild` references remain across Plans 01, 03, 04, VALIDATION.md, and RESEARCH.md."

`USER:` "well lets retry it using opus for planning and a better prompt"

**What this reveals:**
Quick mode plus a weak planner profile can silently under-scope work that still needs exhaustive reasoning. The failure mode is dangerous because it initially looks complete enough to pass unless someone does a manual audit.

**Counter-evidence:**
The agent caught the incompleteness before closeout and the user explicitly requested a retry. This is a recoverable failure, but still a meaningful signal about planner selection and handoff discipline.

---

### Finding 4: `collect-signals` exposed a log sensor that did not actually exist
**Session:** 5a9bbf1c-7695-4b53-8ccc-9a1fce2c8ceb | **Project:** -Users-rookslog-Development-blackhole-animation | **Machine:** apollo
**Type:** capability-gap
**Severity:** notable

**What happened:**
The signal collection flow announced four sensors, including `log`, but when the user asked why it was disabled, the agent revealed it was just a placeholder stub. The user then had to ask for a GitHub issue and eventually pivoted into designing the implementation.

**Evidence:**
`ASSISTANT:` "Discovered 4 sensors: artifact, ci, git, log"

`USER:` "why is log sensor disabled, can we undisable it?"

`ASSISTANT:` "It's a placeholder stub — not actually implemented. It was designed for analyzing Claude Code session logs..."

`USER:` "can we file this as a github issue, that it is only a stub for get-shit-done-reflect?"

**What this reveals:**
The product surface implies session-log analysis is part of the working sensor suite, but the capability only exists as design intent. Users discover the gap mid-workflow instead of before they depend on it.

**Counter-evidence:**
The system did at least say the log sensor was disabled and skipped it rather than pretending to run it. The gap is about misleading affordance, not silent fabrication.

---

### Finding 5: Discuss-phase auto mode collapsed exploration into synthetic decisions
**Session:** c767da7b-5b5d-4188-94bd-95a9698767d7 | **Project:** -home-rookslog-workspace-projects-PDFAgentialConversion | **Machine:** dionysus
**Type:** capability-gap
**Severity:** notable

**What happened:**
The agent used `--auto` in discuss-phase in a way that auto-resolved gray areas and framed the step as locking implementation decisions. The user objected that discuss-phase should be exploratory, not decision-finalizing. The agent then checked the workflow and found the spec itself really was oriented around extracting implementation decisions.

**Evidence:**
`USER:` "dont be auto resolving and why didnt you delegate to an agent???"

`ASSISTANT:` "`--auto` should auto-advance between steps... not auto-resolve the discussion itself. I misapplied it."

`USER:` "its not about locking in phases" / "what does the workflow for discuss phase say? what mode are you in? are you in exploratory? this is potentially a GSDR issue"

`ASSISTANT:` "There's no 'exploratory' mode in the GSDR discuss-phase workflow... It IS oriented toward locking in decisions for downstream agents."

**What this reveals:**
This is not just operator error. The workflow semantics themselves appear to conflate exploratory discussion with decision capture, and `--auto` makes that conflation worse by silently replacing user deliberation.

**Counter-evidence:**
The session immediately turned toward updating/upgrading GSDR, so this may have been partially version-related rather than a permanent design flaw.

---

### Finding 6: Research quality improved only after the user corrected the questioning technique
**Session:** b8b2d6cb-21db-4a4c-a7e1-dc1f71891dd7 | **Project:** -Users-rookslog | **Machine:** apollo
**Type:** observation
**Severity:** minor

**What happened:**
During a NotebookLM-based research pass, the agent was running broad one-shot questions and closing sessions immediately. The user intervened and specified a better method: focused opening question first, then follow-up questions inside the same session. The agent explicitly acknowledged the technique error and updated its memory.

**Evidence:**
`USER:` "remember to have more focused questions... you can start a session with an opening question, get a response, and then proceed with your follow up questions after"

`ASSISTANT:` "Got it — I was front-loading too much into single sprawling questions and then closing immediately. Better approach: focused opener, then follow up within the session to build depth."

**What this reveals:**
There is a reusable workflow lesson here: these external research sessions work better as short conversational arcs than as isolated extraction calls. The improvement came from user coaching, not from the default method.

**Counter-evidence:**
One of the interruptions in this session was a platform overload error (`529`), so not all friction came from question design.

## Dismissed Events

- `41c5d67b-fa05-4e45-a1ca-87bcd9110a18` on `-home-rookslog-workspace-projects-get-shit-done-reflect`: the inter-phase PR workflow gap was clearly signal-worthy, but it was already explicitly recorded in-session as `sig-2026-03-28-offer-next-skips-pr-workflow`.
- `41c5d67b-fa05-4e45-a1ca-87bcd9110a18` on `-home-rookslog-workspace-projects-get-shit-done-reflect`: the squash-merge traceability failure was critical, but it was also explicitly logged in-session later as `sig-2026-03-28-squash-merge-destroys-commit-history`.
- `7e77edff-95b3-4321-9ef7-a6102034dc82` on `-home-rookslog-workspace-projects-get-shit-done-reflect`: eager upstream scouting before revising ROADMAP/REQUIREMENTS was real, but the user immediately forced `/gsdr:signal`, so it was not an unrecorded miss.
- `308cd666-f177-4243-83c8-20e9d408a1f9` on `-Users-rookslog-Development-blackhole-animation`: auto-selected gray areas and auto-advanced discuss-phase corroborate Finding 5, but do not add a distinct new failure mode.
- `7159dba1-3122-4391-b0eb-3096d2f4f31c` on `-Users-rookslog-Development-vigil`: the long discussion about Apple's Energy Impact heuristic was substantive, but it was design debate rather than a concrete breakdown.
- `b8b2d6cb-21db-4a4c-a7e1-dc1f71891dd7` on `-Users-rookslog`: transient API `500`/`529` failures were platform noise; the lasting signal was the questioning-technique correction, captured above.

## Cross-Session Patterns

- Execution momentum repeatedly outran explicit constraints. The measurement pilot started after contamination had been acknowledged, discuss-mode auto-resolved user input, and other GSDR sessions jumped ahead into scouting or next-phase actions before satisfying workflow prerequisites.
- "Green" status was often too artifact-centric. Passing tests, verified plans, or generated docs still concealed important runtime and completeness failures until the user forced direct re-checks.
- Several workflows advertise a richer capability than they really have. The clearest example is the `log` sensor stub, but discuss-phase semantics show a similar gap between what a user expects from "discussion" and what the workflow actually does.
- User corrections were often methodological, not merely factual. The most valuable interventions were about process shape: when to explore versus decide, how to question an external research tool, when to use high-reasoning planning, and when not to start long-running work.
