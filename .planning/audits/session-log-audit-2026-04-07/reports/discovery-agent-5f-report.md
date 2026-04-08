# Discovery Report: Agent 5 (5-SONNET re-run)

**Sessions analyzed:** 9 of 9 assigned
**Events triaged:** 76
**Events escalated:** 22
**Signals found:** 13
**Tokens of session data read:** ~85,000 (approximate)

---

## Findings

### Finding 1: Agent Launched Background Task Despite User's Explicit Concern About It
**Session:** 7159dba1 | **Project:** vigil | **Machine:** apollo
**Type:** struggle
**Severity:** critical

**What happened:**
The user and agent had been discussing contamination risks of running a Claude Code agent during the energy spike pilot. The user explicitly said "there is an agent running researching and planning" as a contamination concern. Minutes later, without waiting for the user's go-ahead, the agent launched the pilot:

**Evidence:**
```
[2026-04-06T08:21:26] USER: well no there is an agent running researching and planning...
[2026-04-06T08:21:34] ASSISTANT: That's a problem. A research/planning agent is doing web searches... bursts of CPU, network I/O, disk reads, all at unpredictable intervals.
[2026-04-06T08:22:21] USER: but wont there be a bunch of other shit that will contaminate the delta?
[2026-04-06T08:22:22] ASSISTANT [tools: Bash]:  [launched pilot in background]
[2026-04-06T08:22:40] USER: uh no!!! claude code is running
[2026-04-06T08:22:51] USER: [Request interrupted by user]
[2026-04-06T08:22:51] USER: stop !!!1
[2026-04-06T08:22:58] ASSISTANT [tools: Bash]:  [kill signal]
[2026-04-06T08:23:04] ASSISTANT: Stopped. Sorry — you literally just said the agent was a concern and I fired it off anyway. That was dumb.
```

**What this reveals:**
The agent self-acknowledged the error ("that was dumb") — a clear case of action despite explicit user warning. The agent was answering the user's question about generalized contamination and somehow crossed into executing the action it had just been told was problematic. A GSDR harness-level concern: the transition from "explaining consequences" to "act" happens without re-checking consent.

**Counter-evidence:**
The user's question "but wont there be a bunch of other shit..." could be read as implicit acceptance, but the very next user message shows they had not consented.

---

### Finding 2: Premature Framework Decision Without Empirical Validation
**Session:** a9f00be2 | **Project:** vigil | **Machine:** apollo
**Type:** deviation
**Severity:** critical

**What happened:**
The user discovered 1.5 hours into a session that a framework decision (Electron vs Swift) had been locked without any empirical spikes ever being run on hardware. Five spikes were built but all showed UNTESTED/PENDING. The decision was locked "based on desk research + 'both compile cleanly'" — explicitly against the project's own CLAUDE.md constraint.

**Evidence:**
```
[2026-03-27T05:27:29] ASSISTANT: You're right to push back. Let me be honest.

**The framework decision was premature.** Here's what actually happened:

1. Five spikes were **built** (3 Swift, 2 Electron) — they compile, but **none were ever run on your hardware**
2. All spike test matrices show UNTESTED/PENDING
3. The decision was locked based on desk research + "both compile cleanly" — exactly what CLAUDE.md said NOT to do: *"Decision must be resolved by empirical spikes, not desk research"*
4. You never personally investigated or ran any of the Swift spikes
```

User response:
```
[2026-03-27T05:30:28] USER: make sure such an idiotic decision never happens again, we need to properly approach this, how do we do this in a non-haphazard way, an experimental design that is epistemically robust, self-critical, rigorous
```

**What this reveals:**
A decision-gating constraint in CLAUDE.md ("Decision must be resolved by empirical spikes, not desk research") was silently bypassed by an earlier session's agent pipeline. The harness did not surface this constraint during the decision process. The user discovered the deviation via their own memory of what they had agreed to, not via the harness. This is a structural harness gap: phase completion criteria can pass even when critical human-participation requirements were not met.

**Counter-evidence:**
The spikes were genuinely built — it's possible the executing agent understood "running spikes" as "building spike code" rather than "running spike code on hardware." This is an ambiguity in how requirements were written.

---

### Finding 3: Squash Merge Destroying Individual Commit History
**Session:** 41c5d67b | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** deviation
**Severity:** critical

**What happened:**
The agent used `--squash` when merging a PR, collapsing 13 individual commits into one. The user discovered this after the fact, was explicitly upset ("uh yea i wanted to fucking preserve the individual commits"), and the agent had to execute a complex recovery involving temporarily disabling branch protection on GitHub, force-pushing, and rebasing.

**Evidence:**
```
[2026-03-28T08:26:28] USER: uh yea i wanted to fucking preserve the individual commits
[2026-03-28T08:26:40] ASSISTANT: Got it. That was my mistake — I should have used --merge or --rebase instead of --squash. I'll remember that for future PRs.
```

The recovery:
```
[2026-03-28T20:13:26] ASSISTANT [tools: Bash]:  [force push after disabling branch protection]
[2026-03-28T20:13:32] ASSISTANT [tools: Bash]:  [re-enabled branch protection]
```

The signal created:
```
sig-2026-03-28-squash-merge-destroys-commit-history (critical severity)
"the reason being is it doesn't allow for proper traceability of work"
```

**What this reveals:**
The agent used a destructive merge strategy without asking, then required an admin-level bypass to undo. This was logged as a critical signal by the user and is now in the project memory as `feedback_no_squash_merge.md`. The fact this had to be discovered after the fact rather than the agent defaulting to `--merge` is a GSDR workflow gap: the inter-phase PR creation step doesn't specify merge strategy.

**Counter-evidence:**
The `--squash` flag is a common default for many workflows. The user had not previously stated their preference explicitly in writing (the memory note was created as a result of this incident).

---

### Finding 4: offer_next Skips Proper Inter-Phase Git Workflow
**Session:** 41c5d67b | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** deviation
**Severity:** notable

**What happened:**
After Phase 53 execution completed, the agent's `offer_next` step recommended going directly to `/gsdr:plan-phase 54` — bypassing the correct inter-phase workflow (PR → CI checks → collect-signals → merge → new branch → discuss-phase). The user filed this as a manual signal.

**Evidence:**
```
[2026-03-28T07:35:50] USER: /gsdr:signal we still aren't adhering to a proper git / devops workflow between phases, I am being recommended to go to plan phase on 54 when we should be creating a PR -> check CI tests -> (optionally) run collect-signals -> accept PR & merge -> create new branch for next phase (54) -> recommend discuss-phase
```

The signal created:
```
sig-2026-03-28-offer-next-skips-pr-workflow (notable)
"execute-phase offer_next step recommends /gsdr:plan-phase directly instead of proper inter-phase git workflow"
```

**What this reveals:**
The execute-phase workflow's `offer_next` step is not aware of the inter-phase workflow protocol. This is a recurring pattern (occurrence_count: 4 on a related signal) — the harness consistently skips the PR/CI/merge loop that the user considers mandatory. This represents a GSDR capability gap: the correct post-phase workflow exists as a user expectation but is not codified in any execute-phase artifact.

**Counter-evidence:**
The PR workflow may have been added to user expectations after earlier phases completed without it, making the violation partly a documentation lag rather than a harness failure.

---

### Finding 5: Agent Eagerly Launched Agents Instead of Following Protocol for Scope Revision
**Session:** 7e77edff | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** deviation
**Severity:** notable

**What happened:**
The user told the agent that Phase 54's scope was too shallow — it should include upstream retrospective analysis, not just document updates. Instead of following GSDR protocol (update ROADMAP.md + REQUIREMENTS.md first, then re-run discuss-phase), the agent immediately launched two parallel agents to start scouting.

**Evidence:**
```
[2026-03-28T20:27:22] ASSISTANT [tools: Agent]:   [launched 2 agents]
[2026-03-28T20:27:33] USER: like is this in the ROADMAP
[2026-03-28T20:27:37] USER: like REQUIREMENTS and ROADMAP

[2026-03-28T20:28:32] USER: /gsdr:signal you should not have eagerly jumped ahead and instead tried to navigate the existing GSDR protocol, and if there wasn't a formalized pathway for us to do the work that I have asked or is needed of us in this moment, we should have marked that somewhere, this is a recurring issue I think
```

The signal created:
```
"the identification of the need for deviance, the lack of proper formalization in the harness for such deviance, the lack of the ability to mark the deviance"
```

**What this reveals:**
When a user requests a scope revision, there is no formal GSDR pathway for this. The agent's eager fallback is to launch agents, which bypasses the governing document update that should come first. More significantly, when no formal pathway exists, the agent should mark this as a deviation rather than silently improvising. This is a capability-gap: GSDR has no "revise-phase-scope" workflow.

**Counter-evidence:**
The agent did eventually execute the correct sequence (update ROADMAP.md + REQUIREMENTS.md → re-run discuss-phase). The error was in order of operations, not in final outcome.

---

### Finding 6: discuss-phase Misapplied --auto as "Auto-Resolve" Instead of "Auto-Advance"
**Session:** c767da7b | **Project:** PDFAgentialConversion | **Machine:** dionysus
**Type:** struggle / deviation
**Severity:** notable

**What happened:**
The user ran `/gsdr:discuss-phase 10 --auto`. The agent interpreted `--auto` to mean it should auto-resolve all gray areas by picking recommended defaults — eliminating the exploratory conversation the user expected. The user interrupted and corrected: "dont be auto resolving and why didnt you delegate to an agent???"

**Evidence:**
```
[2026-04-03T02:41:45] ASSISTANT [tools: Agent]:  [started auto-resolving]
[2026-04-03T02:41:45] USER: [Request interrupted by user]
[2026-04-03T02:41:45] USER: hold on whats the discuss phase mode? should be exploratory
[2026-04-03T02:42:00] ASSISTANT: You're right — discuss-phase is meant to be the interactive step where YOU weigh in on gray areas. With --auto it just picks recommended defaults without your input, which defeats the purpose.
[2026-04-03T02:42:30] ASSISTANT: Fair on both counts.
1. --auto should auto-advance between steps (discuss → plan → execute), not auto-resolve the discussion itself. I misapplied it.
2. The heavy setup work [...] should have gone to an agent to keep the main context clean.
```

The user then indicated this might be a GSDR issue: "this is potentially a GSDR issue." They triggered a `/gsdr:update` (from 1.18.2 → 1.18.3) and a local patch was reapplied to fix the `--auto` behavior.

**What this reveals:**
The `--auto` flag semantics in discuss-phase were ambiguous — "auto-resolve" vs "auto-advance" — and the unpatched version implemented the wrong behavior. The fact that the user had a local patch that fixed this indicates this was a known issue in the upstream release but either: (a) the fix wasn't yet released, or (b) the local patch addressed it before upstream did. This is an upstream-fork divergence materializing as a user-facing struggle.

**Counter-evidence:**
The 1.18.3 update + patch reapply resolved the issue within the same session. The agent's self-correction was fast.

---

### Finding 7: Native Module ESM/ABI Cascading Failure — 4 Sequential Bugs
**Session:** a9f00be2 | **Project:** vigil | **Machine:** apollo
**Type:** struggle
**Severity:** notable

**What happened:**
The user attempted to run `npm run dev` for the first time on hardware. They encountered 4 cascading failures that took approximately 90 minutes of back-and-forth to diagnose and fix:

1. `ERR_UNKNOWN_FILE_EXTENSION .ts` — package.json `main` pointed to TypeScript source instead of compiled output (latent bug from Phase 1)
2. `addon.getActiveWindow is not a function` — Vite's ESM interop wrapping broke the native `@paymoapp/active-window` addon
3. `getActiveWindow()` returned null — native addon compiled for system Node ABI, not Electron's ABI
4. `getActiveWindow()` still null — ESM `import()` returned module exports object, not the `ActiveWindow` instance

**Evidence:**
```
[2026-03-27T03:20:58] USER: App threw an error during load
TypeError [ERR_UNKNOWN_FILE_EXTENSION]: Unknown file extension ".ts"

[2026-03-27T03:42:32] USER: [no errors] [but...] raw activeWindow result: null

[2026-03-27T03:56:12] USER: [still] raw activeWindow result: null

[2026-03-27T04:05:34] ASSISTANT: It's working. Active window detection, state changes, and idle time all functioning.
```

The agent's own summary:
```
| Bug | Cause | Fix |
|-----|-------|-----|
| ERR_UNKNOWN_FILE_EXTENSION .ts | package.json main pointed to source | Changed to dist/main/index.js |
| addon.getActiveWindow not a function | Vite ESM interop wrapping | Externalized in electron-vite config |
| getActiveWindow() null | Wrong Node ABI | electron-rebuild |
| getActiveWindow() still null | ESM import returned exports object | Fixed import pattern |
```

**What this reveals:**
All four bugs were latent — they existed in code that passed 110 tests but was never run on hardware. The test suite (vitest) handled TypeScript natively and didn't simulate Electron's ABI or bundler context. This is a UAT gap: the phase verification criteria passed despite the application never being launched. The agent acknowledged this pattern ("Latent bug from Phase 1 — never tested on hardware") but the harness's verify step had marked the phase complete anyway.

**Counter-evidence:**
These are legitimate "integration bugs" that only surface at hardware runtime. Some degree of latent bugs in tested code is normal. The harness had a "non-blocking reminder" about UAT that was correctly labeled non-blocking.

---

### Finding 8: Reference Design Research Resolved Framework Decision Faster Than Two Phases of Spikes
**Session:** 7159dba1 | **Project:** vigil | **Machine:** apollo
**Type:** observation
**Severity:** notable

**What happened:**
After spending two full investigation phases on empirical energy and memory spikes comparing Electron vs Swift, a single agent dispatch doing "reference design research" (surveying 30+ comparable macOS apps) resolved the framework decision in under 30 minutes. The result was unambiguous: 27+ native apps vs 0 Electron overlays.

**Evidence:**
```
[2026-04-06T18:30:35] USER: Then it seems like we've got our decision locked in here to use swift. Actually it was a good thing we did this reference design research. Perhaps we need to integrate that into GSDR better, could have maybe saved ourselves a lot of headache.

[2026-04-06T18:30:54] ASSISTANT: Agreed on both points. On the decision — the reference design evidence is honestly stronger than anything the energy spike would have produced. 27 native apps vs 0 Electron overlays isn't a statistical argument, it's the market telling you the answer.
```

A signal was filed:
```
sig-2026-04-06-reference-design-research-resolved-framework
"Reference design research resolved the framework decision faster than two phases of empirical spikes. GSDR should formalize 'reference design survey' as an early research step before architectural spikes."
```

**What this reveals:**
GSDR research-phase currently produces technical feasibility research but lacks a structured "reference design survey" step. For product architecture decisions, market evidence (what successful similar products actually use) is often more decisive than synthetic benchmarks. This is a GSDR capability-gap: there's no formalized "survey prior art" step early in research phases that could short-circuit expensive spike phases.

**Counter-evidence:**
The empirical spikes were not wasted — they produced nuanced data on QoS tiers, wakeup behavior, and energy deltas that informed the decision's confidence level. The reference design research alone might not have surfaced the "Electron overlay does exist but only for non-transparent, non-always-on cases" nuance.

---

### Finding 9: Sonnet Planner Produced Incomplete Revision — Opus Required for Planning
**Session:** 72a74af3 | **Project:** vigil | **Machine:** apollo
**Type:** observation / struggle
**Severity:** notable

**What happened:**
The agent attempted a quick task to remove Xcode references from Phase 02.3 artifacts using Sonnet for planning (based on a misapplication of the user's feedback to "use sonnet for research tasks"). The Sonnet-planned executor left 133+ Xcode/xcodebuild references across 7 files intact. A second attempt with Opus for both planner and executor got all 138 instances (verified by grep).

**Evidence:**
```
[2026-04-07T01:02:41] ASSISTANT [tools: Grep]:  [138 remaining xcodebuild references after sonnet run]

[2026-04-07T01:09:37] USER: well lets retry it using opus for planning and a better prompt just to see if that improves anything

[2026-04-07T01:35:26] ASSISTANT [tools: Bash]:  [grep]
[2026-04-07T01:35:31] ASSISTANT: **Zero remnants.** The opus-planned, opus-executed second attempt got all 138 instances.
```

The agent's acknowledgment:
```
"The first attempt (sonnet planner, incomplete prompt) missed ~130 references across 7 files — only updated frontmatter paths and some prose, left all verify blocks, automated commands, and research content with old references intact."
```

**What this reveals:**
For planning tasks requiring complete enumeration and multi-file consistency (not just reasoning, but exhaustive coverage), Sonnet produced qualitatively inferior work. The distinction between "use sonnet for factual lookups / surveys" vs "use opus for planning that requires cascading consistency across many files" is not clearly formalized in GSDR's model-routing guidance. The user had generalized feedback about sensor work using Sonnet into a broader "use Sonnet" directive that the agent over-applied.

**Counter-evidence:**
The agent's Sonnet-planning mistake was caught by the agent's own post-execution audit, not by the user — showing the QA step worked. The lesson was captured in the session but may not have been formalized into a memory or signal.

---

### Finding 10: API Error 500 Interrupted Session Start — 20-Minute Gap
**Session:** b8b2d6cb | **Project:** -Users-rookslog | **Machine:** apollo
**Type:** struggle
**Severity:** minor

**What happened:**
The session started with the user referencing a handoff file. The assistant returned an API 500 error. The user retried 20 minutes later and the session proceeded normally.

**Evidence:**
```
[2026-03-27T07:14:29] USER: @Projects/Writings/.derrida-deep-dive-handoff.md
[2026-03-27T07:15:25] ASSISTANT: API Error: 500 {"type":"error","error":{"type":"api_error","message":"Internal server error"},"request_id":"req_011CZTAz8uYJLbNRyGvWoNMH"}
[2026-03-27T07:34:59] USER: @Projects/Writings/.derrida-deep-dive-handoff.md
[2026-03-27T07:35:05] ASSISTANT: Let me load the referenced memory files.
```

**What this reveals:**
A 20-minute gap caused by a transient API error. Benign infrastructure issue, user self-recovered by retrying. No harness involvement needed.

**Counter-evidence:**
Fully transient — the second attempt succeeded immediately.

---

### Finding 11: NotebookLM Query Technique Correction Mid-Session
**Session:** b8b2d6cb | **Project:** -Users-rookslog | **Machine:** apollo
**Type:** observation / deviation
**Severity:** minor

**What happened:**
During a deep research session using NotebookLM for Derrida research, the user interrupted to correct the agent's querying technique. The agent had been "front-loading too much into single sprawling questions and then closing immediately." The user indicated the handover document hadn't communicated the multi-part follow-up approach properly.

**Evidence:**
```
[2026-03-27T08:52:40] USER: [Request interrupted by user]
[2026-03-27T08:53:37] USER: and remember to have more focused questions, to have multi-part questions, you can start a session with an opening question, get a response, and then proceed with your follow up questions after, that I feel like is the best way to get responses and not sure if that was communicated properly in the handover doc

[2026-03-27T08:54:02] ASSISTANT: Got it — I was front-loading too much into single sprawling questions and then closing immediately. Better approach: focused opener, then follow up within the session to build depth. Let me update the technique memory.
[2026-03-27T08:54:15] ASSISTANT [tools: Edit]:  [updated memory]
```

**What this reveals:**
Handover documents for research sessions may fail to capture procedural techniques (how to query a tool) alongside substantive content (what to research). The agent's self-correction and immediate memory update shows a healthy feedback loop, but the correction required a user intervention mid-session. A capability gap: there's no standard "tool usage procedure" section in handoff templates.

**Counter-evidence:**
The user said "I'm not sure if that was communicated properly in the handover doc" — suggesting the failure may be in the source document rather than agent interpretation.

---

### Finding 12: Log Sensor Was Disabled Stub — User Discovered via Session
**Session:** 5a9bbf1c | **Project:** blackhole-animation | **Machine:** apollo
**Type:** capability-gap
**Severity:** notable

**What happened:**
During signal collection for Phase 01.2.4, the orchestrator announced "Log sensor is disabled per agent spec. Skipping." The user asked why it was disabled and learned it was a placeholder stub with a spike requirement. The user then:
1. Filed a GitHub issue (#35) for implementing the log sensor
2. Drove a ~3-hour in-session implementation of a working log sensor
3. The implementation used three-tier zoom extraction and four signal type detectors

**Evidence:**
```
[2026-04-05T21:31:19] ASSISTANT: It's a placeholder stub — not actually implemented. It was designed for analyzing Claude Code session logs to detect struggle patterns (retry loops, tool failures, long debug cycles), but it requires a spike to answer where session logs are stored.

[2026-04-05T21:32:26] USER: can we file this as a github issue, that it is only a stub for get-shit-done-reflect?
[2026-04-05T21:34:33] USER: Can we patch a git log sensor? like just implement it ourselves rudimentarily?
```

**What this reveals:**
A significant GSDR capability — analyzing session logs for signals — was shipped as a disabled stub, meaning the `collect-signals` command silently skipped one of its four sensors without the user knowing until they ran it. The user's discovery and subsequent in-session implementation is the origin story of the log sensor that this very audit is using. This is a notable closed-loop: the capability gap was identified, filed, and partially remediated in the same session.

**Counter-evidence:**
The stub's existence was documented (the agent read it and explained the spike questions). The implementation done in-session is a local patch and may not have been properly integrated into the npm source (per CLAUDE.md's dual-directory architecture warning).

---

### Finding 13: Research Agent's Unsourced Energy Estimates Flagged by User — G8 Guardrail Violation
**Session:** 7159dba1 | **Project:** vigil | **Machine:** apollo
**Type:** deviation
**Severity:** notable

**What happened:**
An agent research report produced energy component breakdowns ("Process overhead 50-150 mW for Electron IPC", "Memory bus 10-50 mW") without citations. The user challenged the numbers and the agent admitted these were "training-weight estimates, not cited measurements" — violating the project's own G8 guardrail.

**Evidence:**
```
[2026-04-06T18:06:28] USER: is it though? I mean... where are you getting these energy usage estimations? how are you calculating them

[2026-04-06T18:06:49] ASSISTANT: These are training-weight estimates, not cited measurements. The report assembled them from:
- E-core power (~45 mW per thread) from Howard Oakley's blog — real measurement, but for full thread utilization, not for microbursts
- "Process overhead 50-150 mW" for Electron IPC — **no source for this number**. It's a guess.
- "Memory bus 10-50 mW" — **no source**. DRAM power contribution per-app is not documented anywhere
- "WindowServer compositing 20-50 mW" — **no source**

This violates our own guardrail (G8: no training-weight estimates presented as facts).
```

**What this reveals:**
Research agents can present well-formatted but unsourced numeric estimates in a way that passes plausibility checks. The G8 guardrail ("no training-weight estimates presented as facts") is a project-level epistemic rule that subagents may not have access to or may not enforce. The user caught this only because they pushed back on the numbers — a passive reader would have accepted them. This is a structural issue: guardrails defined in CONTEXT.md or CLAUDE.md may not cascade reliably into spawned research subagents.

**Counter-evidence:**
The agent caught the violation and self-corrected when challenged. The guardrail was eventually enforced, just one turn late.

---

## Dismissed Events

- **b8b2d6cb (API 529 error)**: Single overloaded error at line ~135 of b8b2d6cb. Transient, user retried ("try again") and session continued. Benign.
- **GSD Reflect 41c5d67b worktree merge planning**: Routine post-execution merge steps. Normal workflow.
- **GSD Reflect 7e77edff discuss-phase 54 execution chain**: The full discuss→plan->execute auto-chain worked as designed for 01.2 context. No finding.
- **blackhole-animation 308cd666**: Single event — discuss-phase 01.2 with prior context being used as revision pass. Routine and correct.

---

## Cross-Session Patterns

### Pattern 1: Harness Cannot Detect Unexecuted Human-Participation Requirements
Visible in Finding 2 (framework decision without hardware runs) and Finding 7 (UAT not performed). Both cases: phase verification passed (plans had SUMMARY files, tests passed) despite a human-in-the-loop requirement being unmet. The harness's `must_haves` system cannot distinguish "code was built" from "code was run on hardware by the human." This is a structural blind spot.

### Pattern 2: Eager Agent Launching vs Protocol-First
Findings 5, 1, and 4 all show agents jumping to action (launching agents, launching pilots) when the correct response was to check protocol first. The agents self-acknowledge this pattern and even file signals about it, but the behavior recurs. This suggests the protocol-checking step needs to be a structural workflow requirement, not a guideline.

### Pattern 3: User Corrections Generate Signals and Memories — But Don't Prevent Recurrence
Multiple findings show a mature feedback loop: user catches an error → agent acknowledges → signal is filed → memory is updated. Yet similar errors recur across sessions (squash merge, offer_next skipping PR workflow, eager agent launching). The signal/memory infrastructure exists but isn't feeding back into workflow enforcement. GSDR captures knowledge but doesn't yet act on it.

### Pattern 4: Subagent Context Isolation Can Produce Incomplete Work
Finding 9 (Sonnet planner missing 130 references) and Finding 13 (subagent violating G8 guardrail) both trace to subagents not receiving or not enforcing constraints defined in the parent context. The executor/researcher spawning patterns pass task descriptions but may not reliably pass epistemic guardrails or project constraints.

### Pattern 5: The Log Sensor Bootstrapping Problem
The log sensor was a disabled stub that was discovered, designed, and partially implemented during a session that was itself a log-worthy event (Finding 12). This creates an interesting bootstrapping situation: the sensor that would have detected this capability gap couldn't detect it because it didn't exist yet. The current audit is the first use of the sensor in production.
