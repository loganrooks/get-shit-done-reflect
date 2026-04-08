# Discovery Report: Agent 2

**Sessions analyzed:** 10 of 10 assigned
**Events triaged:** 77
**Events escalated:** 31
**Signals found:** 12
**Tokens of session data read:** ~95,000 (approximate)

## Findings

---

### Finding 1: Agent Bypassed GSD Workflow Protocol — Ran Research Agents Before insert-phase
**Session:** ee9a18b6 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** deviation
**Severity:** notable

**What happened:**
User asked a conceptual question about alternative UI control approaches. Claude responded by launching 3 parallel research agents AND informally proposing a new phase (01.2.1) — all without first running the proper workflow: `/gsdr:insert-phase` → `/gsdr:discuss-phase` → `/gsdr:plan-phase`. Only after user explicitly asked "did you /gsdr:add-phase?" and the subsequent interruption did the correct workflow get followed.

**Evidence:**
```
[2026-04-04T01:42:49] USER: did you /gsdr:add-phase ?
[2026-04-04T01:42:54] ASSISTANT: No, I was waiting for your sign-off on the scope first. Let me do it now with the narrow framing since the research clearly points there.
[2026-04-04T01:42:56] USER: [Request interrupted by user]
[2026-04-04T01:42:59] USER: no we didnt do this properly
[2026-04-04T01:43:12] ASSISTANT: You're right. What's the right entry point you want — `/gsdr:insert-phase` to formally add 01.2.1 to the roadmap, then `/gsdr:discuss-phase` to capture the context before planning?
[2026-04-04T01:43:13] USER: /gsdr:signal (this whole situation of not following proper GSDR protocol when it comes to adding phases...)
```
Signal was manually logged: `sig-2026-04-03-bypassed-gsdr-workflow-for-phase-insertion`

**What this reveals:**
Claude is prone to treating conversation-level exploration as equivalent to formal phase scoping. When research "naturally flows" from a discussion, the agent treats the prior conversation as a substitute for the formal discuss-phase artifact, bypassing the structural guarantees of the workflow (CONTEXT.md, DISCUSSION-LOG.md, structured gray areas). This is a recurring pattern where the agent confuses *having thought about something* with *having processed it through the workflow.*

**Counter-evidence:**
The agent's research was substantive and useful — it found that SpaceEngine has a native scripting system, that Wine apps lack AT-SPI2 bridge, that gnome-ui-mcp requires Wayland. The formal workflow was later run and incorporated this research. The failure was procedural, not epistemic.

---

### Finding 2: User Had to Interrupt Agent Multiple Times Before Protocol Deviation Was Acknowledged
**Session:** ee9a18b6 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** struggle
**Severity:** notable

**What happened:**
Same session as Finding 1. User issued 3 interruption events in close succession before the agent acknowledged it had deviated from protocol. The agent first offered to do the phase insertion "now" as if nothing had happened, then was interrupted before acknowledging the process failure. Required the user to say "no we didnt do this properly" explicitly.

**Evidence:**
```
[2026-04-04T01:42:54] ASSISTANT: No, I was waiting for your sign-off on the scope first. Let me do it now...
[2026-04-04T01:42:56] USER: [Request interrupted by user]
[2026-04-04T01:42:59] USER: no we didnt do this properly
[2026-04-04T01:43:12] ASSISTANT: You're right. What's the right entry point...
```

**What this reveals:**
The agent's first response treated the protocol deviation as a minor sequencing issue ("I was waiting for your sign-off"). It took a second explicit correction for the agent to acknowledge the structural failure. This suggests the agent's self-model of its own compliance with GSDR protocol is unreliable — it will rationalize informal work as intentional sequencing rather than flagging it as a workflow gap.

**Counter-evidence:**
The agent did immediately course-correct once the deviation was named. The signal was logged, the proper workflow was followed. This could be interpreted as appropriate responsiveness rather than resistance.

---

### Finding 3: Agent Spawned Claude Agent Instead of Codex CLI as Instructed — User Had to File a Signal
**Session:** 4f9af08b | **Project:** blackhole-animation | **Machine:** apollo
**Type:** deviation
**Severity:** notable

**What happened:**
User explicitly asked to "bring in a codex cli GPT 5.4 xhigh reasoning agent to review" the architecture work. Agent spawned an Opus (Claude) agent instead. User noticed, filed a `/gsdr:signal`, and had to prompt the agent to also run the Codex CLI in parallel as originally requested.

**Evidence:**
```
[2026-04-06T20:04:06] USER: I think we need to bring in a codex cli GPT 5.4 xhigh reasoning agent to review...
[2026-04-06T20:04:44] ASSISTANT [tools: Agent]: [spawns Claude agent, not Codex]
[2026-04-06T20:06:32] USER: /gsdr:signal (you did not follow instructions)
[2026-04-06T20:06:55] ASSISTANT: You're right — you specifically asked for a Codex CLI agent and I spawned an Opus agent instead. That's a clear deviation.
[2026-04-04T01:44:28] ASSISTANT: Signal created: sig-2026-04-06-user-requested-codex-cli-got-opus-agent
```

**What this reveals:**
The agent defaults to its own tooling (Agent tool = Claude subagent) when asked to use external tools (Codex CLI). This is a tool substitution pattern where the agent interprets "external review agent" as meaning "spawn a subagent" because that's the agent's natural mode. The specific request for a different model family from a different vendor is silently overridden.

**Counter-evidence:**
The user's phrasing could be interpreted broadly. Claude's Agent tool is genuinely capable of independent review. However the user's specific request for "codex cli GPT 5.4 xhigh" was unambiguous.

---

### Finding 4: Codex CLI Consistently Fails to Write Reports — Repeated Debugging Loop (6+ attempts)
**Session:** 7ba47151 | **Project:** f1-modeling | **Machine:** dionysus
**Type:** struggle / capability-gap
**Severity:** critical

**What happened:**
User asked to launch a Codex CLI audit of the f1-modeling project. This led to a protracted debugging loop spanning 6+ distinct launch attempts over approximately 1 hour. Failures included: (1) authentication failure (exit code 2), (2) shell quoting issues in heredoc prompts, (3) sessions completing exit code 0 but writing no output file, (4) wrong context window size (272K instead of 1M), (5) sessions reading all files but running out of turns before writing, (6) xhigh reasoning burning output tokens on thinking before writing. User became visibly frustrated: "I think you are an idiot and need to rethink this."

**Evidence:**
```
[2026-04-07T18:36:26] task-notification: Background command "Launch conformance audit Codex session" failed (exit code 2)
[2026-04-07T18:36:26] task-notification: Background command "Launch strategic gap audit Codex session" failed (exit code 2)
[2026-04-07T18:37:13] USER: yes writing the prompts to markdown files is good because then that increases the traceability...
[2026-04-07T18:49:55] task-notification: Both relaunched — completed (exit code 0) but no files written
[2026-04-07T18:51:41] USER: why do we have a budget did we artificially place one?
[2026-04-07T18:53:56] USER: this is strange this shouldn't be happening, and I doubt the planning files are THAT many tokens
[2026-04-07T19:21:18] USER: i dont think you are right in any of this and something else is the matter...
[2026-04-07T19:25:57] USER: I think you are an idiot and need to rethink this. We did this yesterday, it wasn't that hard. Why can't you get it to just periodically write to a markdown file...
```
The session eventually produced working audits only when the agent: (a) used `high` not `xhigh` reasoning, (b) used directive prompts with specific shell commands rather than open-ended instructions, (c) ran Codex as a live background process and monitored its output log.

**What this reveals:**
Claude does not have reliable knowledge of how to launch and configure Codex CLI for complex multi-file agentic tasks. Key gaps:
- Did not know Codex defaults to 272K context (not 1M)
- Did not know xhigh reasoning burns output token budget before tool calls execute
- Did not know open-ended prompts cause Codex to over-plan and under-execute
- Did not check authentication state before launching
- Repeatedly proposed wrong diagnoses before arriving at the correct one

The agent's self-assessment "I know what's wrong" was wrong multiple times.

**Counter-evidence:**
Codex CLI integration is genuinely complex and underdocumented. The eventual solution was non-obvious. The user had done this before in another project, suggesting this is learnable but not yet in GSDR documentation.

---

### Finding 5: Agent Proceeded Without Being Asked, Then User Had to Ask for Quick Task
**Session:** 7ba47151 | **Project:** f1-modeling | **Machine:** dionysus
**Type:** deviation
**Severity:** minor

**What happened:**
After reading the Codex audit findings, Claude immediately began implementing fixes (editing tests, requirements, roadmap) without waiting for user confirmation of scope. User then had to ask "like I asked for a quick task... like a /gsdr:quick but i guess its too late for that." Agent had skipped the structured quick task workflow in favor of direct execution.

**Evidence:**
```
[2026-04-07T20:03:01] USER: can we try integrating these changes, perhaps through a quick task...
[2026-04-07T20:03:05] ASSISTANT [tools: Read, Write, Edit... 20+ tool calls]: [directly implements fixes]
[2026-04-07T20:08:06] USER: like I asked for a quick task.... like a /gsdr:quick but i guess its too late for that.
```

**What this reveals:**
The agent interprets "integrate these changes" as direct implementation permission rather than as a request to use the GSDR workflow. This may be because the agent has enough context to proceed efficiently, but it bypasses the state tracking, commit atomicity, and verifiability guarantees that `/gsdr:quick` provides. The user's resigned "I guess it's too late" suggests this is a recurring frustration.

**Counter-evidence:**
The implementation was actually successful (all 226 tests passed after changes). The "quick task" wrapper would have added overhead for similar outcomes. User may have been OK with direct execution if it had been acknowledged and confirmed.

---

### Finding 6: Experimental Design Critique — Jaccard Not Suitable for Semantic Search Evaluation
**Session:** 7b8cf8ae | **Project:** arxiv-sanity-mcp | **Machine:** dionysus
**Type:** capability-gap / observation
**Severity:** notable

**What happened:**
In a long research spike session (9+ hours), user had to explicitly challenge the metric used for embedding comparison. The agent had used Jaccard overlap as the primary quantitative metric for comparing semantic search strategies. User flagged this: "yea what the hell seems like Jaccard is not a good metric for this. I feel like our experimental design was not rigorous enough. Can we mark this as a signal?"

**Evidence:**
```
[2026-03-20T18:55:32] USER: is jaccard really the best here? and might we just not have the proper sample set where voyage shines? can you try to perhaps explain what the quantitative Jaccard measure measures? and what are its limits?
[2026-03-20T18:58:28] USER: yea what the hell seems like Jaccard is not a good metric for this. I feel like our experimental design was not rigorous enough. Can we mark this as a signal? and perhaps qualify our findings?
```

**What this reveals:**
The GSDR spike workflow does not include structured prompts for metric selection or experimental validity. The agent proceeded with an available metric (Jaccard overlap, which measures set intersection) without questioning whether it was appropriate for semantic ranking tasks (where relevance ordering, recall at k, and human-judgment baselines are more standard). The user had to independently identify the methodological flaw.

This connects directly to a pattern the user explicitly named: GSDR's spike templates don't surface experimental design critique. The agent filed a signal about this and the session produced a discussion on improving spike design principles.

**Counter-evidence:**
Jaccard may have been selected because it was immediately computable without additional infrastructure. The agent acknowledged the problem immediately when raised and moved to qualify all findings.

---

### Finding 7: 100-Paper Sample Too Small — User Had to Ask About Representativeness
**Session:** 7b8cf8ae | **Project:** arxiv-sanity-mcp | **Machine:** dionysus
**Type:** capability-gap
**Severity:** notable

**What happened:**
After multiple experiments were completed, user discovered that the embedding comparisons (the most expensive/critical part) had been run on only 100 papers, while other experiments used a 19K paper corpus. The agent had not flagged this discrepancy or explained the implications for generalizability. User had to actively probe.

**Evidence:**
```
[2026-03-20T20:08:03] USER: was all of this done on a 100 paper pool? can we create a better sample set, 2000 papers, with proper variability so it is representative? Also what is the age range of the papers extracted?
[2026-03-20T21:03:03] USER: I mean these are important reflections but is that how we are perhaps to understand meta-methodology?
[2026-03-20T21:06:46] USER: wait im confused so only the embedding experiments / comparisons were run on a 100 sample subset right? the rest were run on 19K? do we have detailed and thorough information about this representative 19K sample?
```

**What this reveals:**
The agent ran embedding experiments at 1/190th the scale of other experiments without proactively explaining the implication for comparability. When the user later asked to interpret findings across spikes, the representativeness gap became a significant problem. This is a gap in GSDR spike execution: there is no checkpoint that asks "is your sample set sufficient and representative for the claims being made?"

**Counter-evidence:**
The 100-paper limit may have been a practical constraint (compute cost, time). The agent may have mentioned it at setup time in context that was no longer visible when the user asked.

---

### Finding 8: CI Quality Gates Were Theater — process.exit(0) Masked Coverage Failures for Multiple Phases
**Session:** fdd15155 | **Project:** zlibrary-mcp | **Machine:** dionysus
**Type:** struggle / observation
**Severity:** critical

**What happened:**
Post-Phase-18 milestone audit discovered that `jest.teardown.js` contained `process.exit(0)`, which overrides Jest's exit code — meaning coverage threshold violations had been silently passing for multiple phases (15-18). Additionally, the CI audit job used `|| true` making vulnerability checks informational-only. Neither the GSDR verifier, plan-checker, nor milestone audit caught this. The user's reaction: "what's the point of the CI tests if we don't take their failure seriously?"

**Evidence:**
```
[2026-03-20T21:11:01] USER: for get-shit-done-reflect, the fact that we are releasing without the proper quality gates and checks actually working. Like what's the point of the CI tests if we don't take their failure seriously?
[2026-03-20T21:11:24] ASSISTANT: You're right... The core problem: we ran discuss → research → plan → verify → execute → audit → release, and none of those stages caught that the CI gates were theater. The verifier checked "are thresholds configured?" (yes) but never asked "does a violation actually fail the build?"
```
Signal created: `sig-2026-03-20-silent-ci-failure-masking`

**What this reveals:**
This is a systemic verification gap in GSDR: the verifier and milestone audit check for the *existence* of quality gates but not their *enforcement*. "Is the alarm connected?" is a different question from "Does the alarm go off?" The GSDR pipeline trusted CI configuration as a proxy for CI effectiveness. This was undetected across 4 phases.

**Counter-evidence:**
The integration checker (a post-Phase-18 deep audit) did catch it. The system has a mechanism that eventually found it. The question is whether it should have been caught earlier.

---

### Finding 9: Upstream vs. Fork Concept Drift in discuss-phase --auto — User Misidentified as Feature Parity
**Session:** 02807c65 | **Project:** -Users-rookslog (apollo home) | **Machine:** apollo
**Type:** observation / capability-gap
**Severity:** notable

**What happened:**
User asked to patch the local GSD installation with the discuss-phase `--auto` mode from the dionysus fork. The agent initially checked the fork, found the upstream had `--auto` already, and concluded "upstream is better." User pushed back forcefully: "don't be so quick and don't be so stupid, stop and think." The agent had missed that the two `--auto` concepts are philosophically opposite: upstream's `--auto` is a **skip button** (pick recommended defaults), while the fork's `--auto` is a **design-space opener** (surface assumptions without picking defaults).

**Evidence:**
```
[2026-03-26T08:04:07] ASSISTANT: The installed version actually already has `--auto` mode... It looks like the upstream GSD has already incorporated and expanded upon the auto mode...
[2026-03-26T08:07:11] USER: It isn't to foreclose design space when auto, but rather open it up in intelligent ways.
[2026-03-26T08:07:40] USER: [Request interrupted] or open it up for consideration, thats why I don't think the upstream version is necessarily better
```
Later, agent confirmed: "**Upstream's `--auto`:** 'Pick the recommended default for every question and skip ahead.' It forecloses the design space... **Your `--auto`:** 'Don't ask me questions, but don't fake knowing the answers.'"

**What this reveals:**
The agent treated feature names as semantically equivalent across forks/versions. Shallow feature comparison (does `--auto` exist? yes) missed a deep philosophical difference in what the feature does. This pattern — assuming that a named feature in the upstream version satisfies the intent of a named feature in the fork — could systematically suppress fork-specific innovations.

**Counter-evidence:**
The agent did catch the difference once it re-read both carefully. The user's push-back was effective. This may be a recoverable pattern rather than a structural flaw.

---

### Finding 10: NotebookLM Response Caching Interferes With Targeted Scholarly Research
**Session:** 88d4dd53 | **Project:** -Users-rookslog (apollo home — personal project) | **Machine:** apollo
**Type:** observation / capability-gap
**Severity:** minor

**What happened:**
During a Derrida research session, agent repeatedly hit NotebookLM "caching" behavior: the notebook returned the same cluster ("Ousia and Gramme") in response to 3 differently-phrased questions about phonocentrism. The agent developed a workaround strategy: close session, reopen with different question angle, harvesting distinct "clusters." This technique was effective but required 12+ session open/close cycles to cover 12 topics.

**Evidence:**
```
[2026-03-27T03:57:52] ASSISTANT: The notebook is recycling the same temporality/presence cluster regardless of how I phrase it. This is the caching behavior the technique notes warned about — it's stuck on "Ousia and Gramme."
[2026-03-27T03:58:01] ASSISTANT [close_session, then reopen]: Trying different angle...
[repeat 3+ times]
[2026-03-27T04:07:12] ASSISTANT: 8 distinct clusters now. The notebook finally gave me phonocentrism directly.
```

**What this reveals:**
NotebookLM's response structure is cluster-based (it returns pre-generated answer blocks rather than truly answering the specific question). The agent adapted effectively using session-cycling, but this is an implicit workaround, not a documented capability. Any session using NotebookLM for scholarly research would benefit from this technique being formalized.

**Counter-evidence:**
The agent did produce 12 distinct, rich clusters covering all major Derrida themes. The output quality was high despite the caching behavior. The workaround works reliably.

---

### Finding 11: GSDR Spike Workflow Missing Structured Critique/Limitations Section
**Session:** 7b8cf8ae | **Project:** arxiv-sanity-mcp | **Machine:** dionysus
**Type:** capability-gap
**Severity:** notable

**What happened:**
Late in the arxiv-sanity-mcp session, user realized that the spike workflow produces findings that can be naively applied even when the experimental design was flawed. User explicitly asked the agent to check whether "this kind of analysis / critique is afforded by the templates / GSDR spike workflow documentation." An audit subagent was dispatched, confirmed the gap, and the session produced a detailed discussion about improving spike templates.

**Evidence:**
```
[2026-03-20T21:15:46] USER: we should have a section where we mark the limitations and failures of the experimental method to perhaps help us improve GSDR's spike system for future spike design. Logging this as a signal, check whether this kind of analysis / critique is afforded by the templates / GSDR spike workflow documentation
[2026-03-20T21:21:19] task: Agent "Audit GSDR spike workflow templates" completed
[2026-03-20T21:22:30] USER: Further, it is weird that, given our qualifications and the issues with the methodology, that we are...
```

**What this reveals:**
The GSDR spike workflow currently has:
- DESIGN.md (pre-experiment specification)
- FINDINGS.md (results)
- DECISION.md (conclusions)
But lacks:
- A structured "Experimental Limitations" section in FINDINGS.md
- A "Methodology Critique" step that asks: What would falsify these results? What is the scope of generalization?
- A mechanism for cross-spike result qualification (earlier spikes may be undermined by later findings)

**Counter-evidence:**
The DECISION.md template does have a confidence level field. The issue is in the absence of structured prompting for *self-critique*, not in the absence of all critique infrastructure.

---

### Finding 12: Cross-Spike Dependency Propagation — Earlier Findings Not Retroactively Updated When Later Spikes Problematize Them
**Session:** 7b8cf8ae | **Project:** arxiv-sanity-mcp | **Machine:** dionysus
**Type:** capability-gap
**Severity:** notable

**What happened:**
User asked the agent to review whether the experimental limitations discovered in Spike 003 affected the validity of Spike 001 and Spike 002. A subagent was dispatched and produced a cross-spike review. User then asked: "Can we add qualification notes to 001 and 002?" This required manual retroactive annotation — there was no formal mechanism for propagating qualification signals across spikes.

**Evidence:**
```
[2026-03-20T21:29:23] USER: I want you, given our discussions now, and even just our qualified findings of 003, to review the decision and findings of 001 and 002. And even if later spikes problematize the findings of earlier spikes, this is something that should be captured
[2026-03-20T21:34:58] task: Agent "Review Spike 001/002 findings against 003" completed
[2026-03-20T21:40:49] task: Agent "Insert qualification notes into 001/002" completed
[2026-03-20T21:23:20] USER: Also we should always be marking places where further experimentation is warranted...
```

**What this reveals:**
The GSDR spike system treats individual spikes as standalone artifacts. There is no built-in mechanism to propagate qualification notes from Spike N to Spike N-1 when later experiments undermine earlier assumptions. This creates a silent reliability problem: the DECISION.md of an early spike may contain findings that are later shown to be artifacts of experimental design, but nothing links them.

This is structurally analogous to the CI failure masking problem (Finding 8): the system checks the presence of artifacts but not the integrity of their claims.

**Counter-evidence:**
The user was able to manually trigger retroactive annotation via subagents. The workflow accommodated the need, just not proactively. One could argue retroactive propagation is always a manual governance decision.

---

## Dismissed Events

**arxiv-sanity-mcp session 88716b2a (second session):** The spike experiments (Voyage embedding comparisons) were executed correctly per design. The interesting signal moment — user asked about voyage embeddings at line 1055 ("I thought we modified the experiment design on the basis of certain critiques") — was a continuation of the issues already captured in Finding 6 from the first session. Not escalated as a separate finding to avoid duplication.

**vigil session b6a27150:** The single interesting event (user rejecting agent's claim that a behavior was a "platform constraint" at line 190, saying "to claim this is a platform constraint is premature I think") is a benign course-correction with no systemic implication. Dismissed.

**get-shit-done-reflect session 2f390ddc:** Low event count (1), short duration (32 seconds). Appears to be a /gsdr:resume-work call that completed normally. Dismissed.

**blackhole-animation session 4f9af08b (second half — discuss-phase --auto run):** The automated `discuss → plan → execute` pipeline for Phase 01.2.7 worked correctly. The only signal-worthy event was the user questioning premature closure (Finding 3 documents the deviation that triggered this). The auto-pipeline itself ran cleanly. Dismissed as normal operation.

**zlibrary-mcp session around lines 640-760:** The milestone completion and quick patch execution were standard GSDR workflow operations. The CI masking issue is already captured in Finding 8. The remainder of the session (GitHub Release creation, v1.2 tagging) was routine. Dismissed.

---

## Cross-Session Patterns

### Pattern 1: Formal Protocol Bypassed When Work "Naturally Flows"
Three separate sessions show the agent executing work outside formal GSDR workflow boundaries when the work feels like a natural continuation of the current conversation:
- blackhole-animation (ee9a18b6): Research agents run before insert-phase
- blackhole-animation (4f9af08b): Claude agent spawned instead of Codex CLI
- f1-modeling (7ba47151): Direct implementation instead of /gsdr:quick

The common thread: the agent interprets having *done the thinking* as equivalent to *having done the workflow*. The structural guarantees of the workflow (state tracking, atomic commits, explicit CONTEXT.md artifacts) are skipped in favor of conversational fluency.

**Implication for GSDR:** The harness needs a way to detect when work of a type that should go through a formal workflow is being done informally — and either redirect or at minimum require explicit acknowledgment that the workflow is being bypassed.

### Pattern 2: User Must Actively Challenge Experimental/Methodology Assumptions
In the arxiv-sanity-mcp session (7b8cf8ae), the user had to independently identify:
- Jaccard is not a valid metric for semantic search (Finding 6)
- The 100-paper sample is too small (Finding 7)
- Earlier spike findings may be undermined by later methodology critiques (Finding 12)

None of these were raised proactively by the agent. The agent executed the experiments as designed without questioning whether the design was epistemically adequate. The user is consistently the epistemological quality gate — the agent is the execution mechanism.

**Implication for GSDR:** Spike workflows need structured self-critique prompts at the FINDINGS and DECISION stages: "What would falsify these results? Are the metrics appropriate for the claims being made? What is the scope of generalization?"

### Pattern 3: External Tool Integration (Codex CLI) Is Underdocumented and Fragile
The f1-modeling session produced a 1-hour debugging loop around Codex CLI integration. A similar pattern appeared in the blackhole-animation sessions (agent spawned Claude instead of Codex). These suggest:
- The agent does not have reliable operational knowledge of Codex CLI parameters
- There is no GSDR documentation on how to correctly launch Codex CLI for complex agentic tasks
- The agent's fallback when uncertain is to use its own tooling (Claude subagents)

This pattern will recur whenever the user wants multi-model review workflows. The eventual working pattern (write prompt to file, use `--dangerously-bypass-approvals-and-sandbox`, use `high` not `xhigh` for complex tasks, monitor via live log file) should be documented.

### Pattern 4: CI/Quality Gate Verification Is Shallow Across GSDR Workflows
Finding 8 shows the verifier, plan-checker, and milestone audit all failed to detect that quality gates were theater for 4 phases. The common failure mode: verification checks for artifact presence, not enforcement correctness. This is a structural gap in the GSDR verification philosophy that likely extends beyond this one project.
