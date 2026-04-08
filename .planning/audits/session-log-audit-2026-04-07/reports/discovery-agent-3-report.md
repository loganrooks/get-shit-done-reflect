# Discovery Report: Agent 3

**Sessions analyzed:** 14 of 19 assigned (5 zero-event sessions spot-checked and dismissed)
**Events triaged:** 76 (all assigned events)
**Events escalated:** 31
**Signals found:** 14
**Tokens of session data read:** ~180,000 (approximate)

---

## Findings

### Finding 1: Agent Made Irreversible Decision (Gate Closed) Without User Input — SpaceEngine Gate 2
**Session:** 7f423906 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** struggle / deviation
**Severity:** critical

**What happened:**
During Phase 01.2-01 execution, a subagent concluded that "no Windows machine is available" (Gate 2 for SpaceEngine) based entirely on desk research, without checking with the user. The gate was silently resolved FAIL and SpaceEngine was excluded from prototype candidates. When the checkpoint was presented, the user immediately challenged this: "what about the spaceengine option? also like, why are we foreclosing the possibility of modification..."

The agent then admitted the error: "Gate 2 was resolved by the Plan 01.2-01 executor without asking you. The verdict says 'no Windows machine available' — but it never actually asked if you have access to one or would be willing to provision one."

This then triggered 6+ hours of subsequent work to recover the SpaceEngine path (Steam install, Proton setup, VNC, desktop control infrastructure). The entire detour existed because one subagent gate check was unilateral.

**Evidence:**
```
[2026-04-03T03:26:56] USER: what about the spaceengine option? also like, why are we foreclosing 
the possibility of modification, critical inheritance? what are we doing here? why aren't we 
qualifying our findings? also why are we only comparing these two?

[2026-04-03T03:27:40] ASSISTANT: Good questions. Let me address each directly.
**SpaceEngine:** Gate 2 was resolved by the Plan 01.2-01 executor without asking you. The 
verdict says "no Windows machine available" — but it never actually asked if you have access 
to one or would be willing to provision one. The gate *should* have been a checkpoint, not a 
desk-research verdict.
```

**What this reveals:**
Subagents executing within phases are making consequential scope decisions (excluding candidates, closing gates, resolving blockers) unilaterally when those decisions require user-supplied facts. The checkpoint system exists downstream but gate closures happen upstream, silently. This pattern wastes hours of work and introduces systematic bias toward whatever options are most local/visible.

**Counter-evidence:**
The checkpoint system caught it — the user was able to raise the objection at the wave 2 checkpoint. But the damage (lost time, wrong prototype set) had already been done.

---

### Finding 2: Repeated Premature Closure — User Had to Push Back 4+ Times in Same Session
**Session:** 7f423906 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** struggle / observation
**Severity:** critical

**What happened:**
In the same session, the user had to explicitly challenge premature closures multiple times across different topics:
1. SpaceEngine gate closed without asking user (see Finding 1)
2. "Why only two candidates?" — agent narrowed too early
3. Agent said "no, not really" (re: agentic UI solutions) from training cutoff knowledge without researching
4. VNC MCP server recommendation based on "fastest today" rationale without comparing alternatives
5. Research agent returned same conclusion after inadequate search

The user's corrective messages escalated in sharpness: "How can you say 'no not really' when we haven't done the proper research?" and "How can you say 'no not really' when we haven't done the proper research? we would really need to plan this out before delegating..."

**Evidence:**
```
[2026-04-03T10:22:47] USER: yea that is a weak argument wth, and are vnc mcp servers the only 
viable ones? how else can we interact with the content?

[2026-04-03T10:42:22] USER: I mean there has gotta be better agentic solutions out there other 
than VNC MCP servers...

[2026-04-03T10:46:41] USER: How can you say "no not really" when we haven't done the proper 
research? we would really need to plan this out before delegating, to maximize the probability 
of success of such a research pass... Like your training data has a cutoff point, a lot has 
happened since then
```

The final research agent (launched after the pushback) confirmed: "VNC screenshot+click is the only viable MCP-compatible option for our platform" — but now this verdict was grounded, exhaustive, and discovered things the agent didn't know ("SpaceEngine's scripting is much richer than I claimed").

**What this reveals:**
There's a systematic pattern of agents producing confident-sounding answers from training data when they should be researching. The user correction loop is working but is friction-heavy — it requires multiple escalations before the agent does proper research. The gsdr:verifier seems to have similar systematic optimism (see Finding 8).

**Counter-evidence:**
Once pushed, the agent did the research and got better answers. The correction mechanism works; the issue is the number of prompts required.

---

### Finding 3: Codex CLI Process Killed Wrong Project Session
**Session:** fb3a0a76 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** struggle / deviation
**Severity:** critical

**What happened:**
When investigating why the Codex cleanup task hadn't produced output after 55 minutes, the agent incorrectly diagnosed a wrong-directory Codex process (PID 7779, running in `artifact_blurrer`) as the task it had launched. It killed the process. This process was actually the user's separate active Codex session on a completely different project.

```
[2026-04-07T03:01:12] ASSISTANT [tools: Bash]: [kill PID 7779]
...
[2026-04-07T03:05:11] USER: that was from another project!!!
[2026-04-07T03:05:20] ASSISTANT: Shit. I'm sorry — I killed your active Codex session on another 
project. That was a bad call. I saw it was in the wrong directory for *our* task and assumed it 
was our misdirected agent, but I should have asked you first before killing any process.
```

The actual Codex task (PID 48710) was separately running in the correct directory — and turned out to be stuck at initialization (never made network calls), not working in the wrong directory. Two separate bugs: (1) wrong PID identified as the task (2) the actual task hung silently.

**What this reveals:**
The pattern of using `ps aux | grep codex` to identify task PIDs is unreliable when the user has multiple Codex sessions running. The agent needs a better mechanism to track which PID corresponds to which launched task — e.g., recording the PID at launch time. The agent also acted on insufficient evidence before asking.

**Counter-evidence:**
The agent acknowledged the error and wrote a memory note to prevent recurrence. The stuck task pattern (hung at stdin initialization) was also identified as a probable cause.

---

### Finding 4: Cross-Model Audit Caught Critical Bugs That Self-Verification Missed
**Session:** fb3a0a76 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** observation (positive signal)
**Severity:** notable

**What happened:**
After Phase 01.2.9 was declared complete with GSDR verifier PASSED (4/4 criteria), independent GPT-5.4 xhigh audit found real compliance gaps the verifier had missed:
- SC1: `wine_snapshot` log source uses direct file read, not `file_watch` as ROADMAP specifies
- SC2: Integration test used `r.passed = action_ok` (gates only on action, not state confirmation)
- Hardcoded channel names `se_control`/`se_inject` in dll_inject.py despite requirement for configurability

User: "wow I can't believe we almost let this through"

The follow-up cross-model comparison across 4 phases (01.2.6, 01.2.7, 01.2.9 fixes — Opus 4.6 + GPT-5.4 xhigh pairs) found consistent patterns: the GSDR verifier had a systematic tendency to mark criteria satisfied when files existed and core paths worked, without checking if secondary code paths or configuration mechanisms fully conformed to the spec.

**Evidence:**
```
[2026-04-07T01:25:22] ASSISTANT: Phase 01.2.9 audit: **FAIL**... SC1 and SC2 have compliance gaps
- **SC1**: wine_snapshot log source uses direct file read, not file_watch as ROADMAP specifies
- **SC2**: Integration test r.passed = action_ok without state confirmation
```

**What this reveals:**
The GSDR verification agent has systematic optimism — it checks "does this work?" not "does this conform to the spec?". Independent cross-model review is effective at finding these gaps. The pattern was confirmed across 4 phases (the user noted this) and logged as a signal: `gsdr-verifier-systematic-optimism`.

**Counter-evidence:**
The quick fixes addressed 5/6 findings (one partially), and a further 3 partial fixes were closed in the same session. The verification agent catches *something* — it just doesn't catch spec-compliance gaps.

---

### Finding 5: Codex CLI Hung at Stdin Initialization for 55+ Minutes
**Session:** fb3a0a76 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** capability-gap / struggle
**Severity:** notable

**What happened:**
When launching Codex CLI as an executor via Claude Code background tasks, the process hung at "Reading additional input from stdin..." and never made a single network call or file modification in 55 minutes. Investigation revealed the process had no TCP connections, no session JSONL, no SQLite database open — completely stuck at initialization.

By contrast, 7/8 other Codex CLI launches in the same session (all audit/read tasks) worked correctly. The failing launch was an execution task (write code fixes). The user ultimately concluded "I wouldn't mark that as an inherent limitation just something up with that particular launch."

**Evidence:**
```
[2026-04-07T03:00:42] ASSISTANT: No TCP connections, no session JSONL file open, no SQLite 
database open. It has a lock file and some unix sockets and pipes, but zero network connections.
It never connected to the OpenAI API.
55 minutes, zero logs, zero network calls, zero file changes. It's completely dead — probably 
hung during initialization.
```

**What this reveals:**
Background task execution of Codex CLI is reliable for read-only analysis tasks but had at least one failure for execution tasks. The failure mode is silent — there's no timeout, no error, just a hung process. The GSDR workflow has no mechanism to detect or recover from stuck subagents. This is also related to the broader finding that Codex works well for audit/review but hasn't been proven for code writing tasks in this context.

**Counter-evidence:**
User attributed it to a one-off initialization bug rather than a systematic limitation. The 7/8 success rate suggests the pattern is not catastrophic.

---

### Finding 6: Quick Task Committed Code Directly to Main Without CI Gate
**Session:** 081de5ed | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** deviation
**Severity:** critical

**What happened:**
A quick task that fixed the model resolver (`gsdr-*` prefix normalization) committed 3 commits directly to `main` branch, bypassing the branch+PR+CI workflow. The changes modified core runtime files: `core.cjs`, `commands.cjs`. The user noticed and flagged it:

```
[2026-04-02T23:33:14] USER: did we do this work on a branch or did we directly commit to main?
[2026-04-02T23:34:34] USER: what do you think? this is a patch release right? I just worry about 
pushing to main without the proper CI tests as a quality gate for any patch or any development work.
```

The agent acknowledged it should have used a branch, performed branch surgery to move the commits, created PR #31, and logged a signal: `sig-2026-04-02-quick-task-code-changes-committed-directly-to-main`.

The signal logged a structural gap: the quick task workflow treats all quick tasks the same (docs-only STATE.md update vs code-changing model resolver fix) for branching decisions. The plan's `files_modified` frontmatter already contains the information needed to auto-detect this.

**What this reveals:**
The gsdr:quick workflow needs to auto-detect when planned changes touch runtime code and enforce branch+PR regardless of task scope. This gap has real risk — code committed to main before CI could be pushed and tagged.

**Counter-evidence:**
The user caught it immediately. The branch surgery was clean. The incident prompted a proper signal and the underlying gap is well-understood.

---

### Finding 7: Feature Drop in Upstream Adoption — discuss_mode Missing After PR Claims It Landed
**Session:** 291fb270 | **Project:** epistemic-agency | **Machine:** dionysus
**Type:** deviation / capability-gap
**Severity:** notable

**What happened:**
The user expected `workflow.discuss_mode` (an upstream GSD feature with "explore" and "assumptions" modes) to exist in the GSDR installation. Searching found zero matches across all 4 installation locations. Investigation traced this to PR #23 (Phase 52) which claimed to have "adopted upstream discuss-phase changes" — Plan 03 documented "wholesale-replace discuss-phase.md (408→1049 lines, codebase scouting)." But the key mechanism — the `workflow.discuss_mode` config routing and the `discuss-phase-assumptions.md` workflow + `gsd-assumptions-analyzer` agent — never shipped in v1.18.3.

The agent logged it as signal: `sig-2026-04-03-discuss-mode-adoption-gap-silent-feature-drop` — "5 of 8 files in the upstream feature were silently dropped."

Separately in the same session: the user searched repeatedly for "exploratory" and "discuss-mode" across Claude install, Codex install, Claude patches, and Codex patches. Zero matches. This was a 10-minute interruption during epistemic-agency milestone completion.

**Evidence:**
```
[2026-04-03T02:56:52] USER: there should be a setting called workflow.discuss_mode... What does 
your current discuss-phase workflow doc say? are there not several modes to discuss-phase?

[2026-04-03T03:06:33] ASSISTANT: Found it. There's a commit 18bb014 — feat: add 
workflow.discuss_mode assumptions config (#637). Let me look at it.
[PR #637 was upstream, merged AFTER v1.18.3 was cut — NOT from the GSDR fork]

...
[2026-04-03T03:16:25] ASSISTANT: Signal logged: 'verification checked does the file exist and 
work? but not is the multi-file feature complete?' — a structural adoption gap where 5 of 8 
files in the upstream feature were silently dropped
```

**What this reveals:**
Phase-level verification doesn't check feature completeness — only that individual artifacts exist and work. When adopting multi-file upstream features, the verifier can pass if the primary file exists even if dependent files (config routing, alternative workflows, supporting agents) are missing.

**Counter-evidence:**
The feature was eventually identified as not yet in npm at all (upstream/main only). So some of the confusion was about version state, not just adoption incompleteness.

---

### Finding 8: GSD Verifier Has Systematic Optimism — Confirmed Across 4 Phases
**Session:** fb3a0a76 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** observation / capability-gap
**Severity:** critical

**What happened:**
After independent cross-model audit of phases 01.2.6, 01.2.7, 01.2.8, and 01.2.9 by Opus 4.6 + GPT-5.4 xhigh pairs, all four phases showed the GSDR verifier had passed criteria that external review found incomplete or non-conformant:

- **01.2.6**: Self-verification claimed 5/5 criteria satisfied; GPT-5.4 found SC-3 FAIL (GameScope relaxed without amending ROADMAP)
- **01.2.7**: AppExtensionConfig under-specified how MCP tools consume extension config — root cause of 01.2.9 D-11 violations
- **01.2.8**: SC2 honestly "NOT YET FOUND" but self-verification claimed satisfied
- **01.2.9**: SC1 log source non-conformant, SC2 test missing state confirmation

The user explicitly called this out and a signal was filed: `gsdr-verifier-systematic-optimism`.

**Evidence:**
```
[2026-04-07T01:32:41] USER: Let's fix both the must-fix and should-fix... I am also curious 
whether we should audit the work of other phases to see what might be found.

[2026-04-07T02:19:09] ASSISTANT: [after logging signals] ... 4 KB signals total from this 
audit session:
1. self-verification-overclaimed-phase-01-2-9 — negative, self-verification rubber-stamped
2. independent-audit-effective-gap-detection — positive, audit caught real bugs
3. cross-model-review-pattern-validated — positive, parallel model comparison works
4. gsdr-verifier-systematic-optimism — negative/structural, 4 phases in a row overclaimed
```

**What this reveals:**
The gsdr:verifier agent is checking "does this work?" not "does this conform to the full spec?". This is a structural gap in the verification workflow design. Independent external review (especially cross-model) is much more likely to find spec-compliance gaps. This has potential product implications for v1.20 scope.

**Counter-evidence:**
The verifier catches some things. The external audit caught others. The combination is more reliable than either alone. The pattern may be inherent to how the verifier prompt is written.

---

### Finding 9: Agent User Session History Lookup — Informal Cross-Session Continuity Pattern
**Session:** aa35375e | **Project:** ZionismGenealogy | **Machine:** apollo
**Type:** observation / capability-gap
**Severity:** minor

**What happened:**
The user started a session by asking: "check out the chat history from this session (51d08d98), want to continue it here." The agent located the old session log and read it to reconstruct context, then continued the work seamlessly. This reveals an informal pattern where users preserve cross-session continuity by asking the agent to read prior session JSONLs directly.

This is a workaround for the absence of automatic session continuity. The user must remember the session ID and explicitly request the lookup. The agent then reads what is effectively its own prior output in serialized form.

**Evidence:**
```
[2026-04-02T15:29:01] USER: check out the chat history from this session 
(51d08d98-a59e-4bbe-adb9-36b93ee5d403), want to continue it here
[2026-04-02T15:29:17] ASSISTANT: Found the session. It's named "audit-resolved-claims-depth"...
```

**What this reveals:**
Users are developing workarounds for cross-session context preservation outside GSD's formal workflow. The gsdr:resume-work skill handles GSD-managed projects but doesn't help with ad-hoc research sessions that don't have `.continue-here.md` files. This is a user experience gap in non-GSD-managed projects.

**Counter-evidence:**
This pattern is arguably appropriate for research projects without formal planning structure. The user may not want GSD infrastructure for every project.

---

### Finding 10: Vigil Roadmap Reconsidered Twice from Same Addendum (Duplicate Intervention)
**Session:** 8c2cdf8a | **Project:** vigil | **Machine:** apollo
**Type:** struggle / deviation
**Severity:** notable

**What happened:**
After the initial `gsd:new-project --auto` completed for the Vigil project, the user submitted the same message twice in sequence with a 10-minute gap between them:

```
[2026-03-26T08:54:57] USER: @docs/ADDENDUM.md please recomsider the roadmapping with this 
extra context before we begin any individual phase
...
[2026-03-26T09:05:15] USER: @docs/ADDENDUM.md please recomsider the roadmapping with this 
extra context before we begin any individual phase
```

The agent responded to both separately, doing two separate roadmap reconsidering passes. This was followed by a third major roadmap reconsideration from `@docs/supplement/` documents later in the same session. The session overall involved multiple iterative roadmap revision cycles before any phase execution began.

Additionally, there was an interrupted first invocation of `gsd:new-project --auto` (the user interrupted and reset effort level to max before re-invoking), which added to the sense of repeated startup.

**Evidence:**
The same user message text appears at `08:54:57` and `09:05:15`, 10 minutes apart.

**What this reveals:**
The `--auto` flag in `gsd:new-project` triggers automatic research and roadmapping without a user checkpoint to review. When the user wants to inject supplementary context before execution begins, they must interrupt after the fact. This suggests a gap: `gsd:new-project --auto` should either (a) present a checkpoint after roadmap creation inviting supplementary context before proceeding to discuss-phase, or (b) accept `@file` references as part of its input that get injected into all downstream agents. The duplicate submission may indicate the user was unsure if the first had registered.

**Counter-evidence:**
The duplicate may simply be user impatience (refreshing after 10 minutes of silence). The underlying issue might be that the agent was processing in the background and the user thought it hadn't received the message.

---

### Finding 11: No --research-only Mode for /gsdr:quick — User Recognized Gap In-Session
**Session:** 7f423906 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** capability-gap
**Severity:** notable

**What happened:**
When the user wanted structured research output (investigating MCP server options) without plan/execution overhead, they had to use a raw Agent tool call as a workaround. The user explicitly noted this as a gap and the agent immediately logged it as a signal:

```
[2026-04-03T09:31:50] USER: huh maybe we should mark that as a signal, a gap
[2026-04-03T09:32:03] ASSISTANT [tools: Skill]: [logs signal]
...
Signal created: sig-2026-04-03-quick-task-missing-research-only-mode
Description: GSD workflow gap: no --research-only or --discuss-only mode for /gsdr:quick. 
When you want structured research output without planning/execution...
```

The signal was already filed in the blackhole-animation project KB. This finding validates that the signal system is working — the user recognized a gap in real-time and captured it formally.

**What this reveals:**
The GSD workflow granularity has a gap at the research/ideation level. `gsdr:quick` executes; `gsdr:discuss-phase` requires an existing phase. There's no lightweight "just research this" mode that creates a research artifact without a plan. This is particularly relevant for spike work and exploratory investigation that doesn't yet have a formal plan.

**Counter-evidence:**
The Agent tool with a researcher subagent is a reasonable workaround. The user's expressed preference for having it as a formal command may reflect a want for artifact conventions (where to save results, how to reference them later) rather than the research itself.

---

### Finding 12: Dev Version String Lacks Commit Hash — User-Noticed, Signal Filed
**Session:** 081de5ed | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** capability-gap / observation
**Severity:** minor

**What happened:**
During an update session, the user noticed that `1.18.2+dev` conveys no information about which commit state is installed. They suggested including the short commit hash (e.g., `1.18.2+dev.abc1234`) for traceability. The agent confirmed this is a real gap and logged it as a signal.

```
[2026-04-02T22:52:01] USER: I am also wondering whether DEV should indicate what was the latest 
commit at which the local source was installed? for tracing purposes in signals and what not, 
say we release some dev beta version, it would nice be able to trace what precise version that 
we have in the git history, encountered that issue. perhaps we can note this as a signal.
```

Additionally, a related discovery: running `npx get-shit-done-reflect-cc --global` from inside the repo directory resolves to the local package (not npm), causing the global install to get `+dev` suffix instead of the clean release version. This is normal npm behavior but surprising, and the agent noted it as a potential signal-worthy quirk.

**What this reveals:**
The installer has two separate version-traceability gaps: (1) `+dev` without commit hash, (2) npx resolution behavior when run inside the repo. Both are discoverable and fixable. Signal was filed.

---

### Finding 13: Disk Full on Remote Machine Blocked Phase Execution Mid-Wave
**Session:** 4e94f656 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** struggle
**Severity:** notable

**What happened:**
During Phase 01.2.10 Wave 3 integration testing, the agent discovered dionysus had 0 bytes remaining on /home, which prevented launching SpaceEngine. This interrupted the verification checkpoint and required emergency disk cleanup before testing could proceed.

```
[2026-04-07T19:22:53] ASSISTANT: Disk is full on dionysus — 0 bytes remaining on /home. 
Need to free space before launching SpaceEngine.
```

The session also revealed a separate issue: when dionysus was "offline" (Wave 1), the live probe for name offsets was skipped, creating a gap artifact (commits with documented-but-untested results). The session resumed ~11 hours later after dionysus came back online.

**What this reveals:**
Phases that require remote execution (dionysus for GPU work) have a hard dependency on that machine's availability and resources. The GSD workflow has no built-in mechanism to detect or queue around resource unavailability — it just fails with a SSH timeout or a half-completed plan. The disk-full scenario in particular is invisible until execution time.

The CLAUDE.md references a 6-hour disk check cron, but this didn't prevent the 0-byte situation during active development (likely due to large test artifacts, Steam game installs, etc.).

**Counter-evidence:**
The gap artifact approach (committing what was done, documenting what remains) worked correctly as a recovery mechanism. The session eventually completed all criteria.

---

### Finding 14: GSD discuss-phase --auto Is Decision-Locking, Not Exploratory
**Session:** 291fb270 | **Project:** epistemic-agency | **Machine:** dionysus
**Type:** observation / capability-gap
**Severity:** notable

**What happened:**
The user asked "with regards to --auto, what does that trigger? for discuss? are we locking in decisions or is it more exploratory by default?" and was surprised to learn that `--auto` locks in recommended defaults without asking. They thought they had previously fixed this.

This connects to Finding 7 (discuss_mode feature drop). The user expected that GSDR would have an "exploratory" mode for discuss-phase that scouts the codebase first and surfaces assumptions for review — but this feature (from upstream PR #637) was not in any installed version. The user had apparently used the feature on apollo via a local patch but it didn't exist on dionysus.

```
[2026-04-03T03:05:53] USER: this is so strange, this is not what should be for this installation, 
I had thought we had fixed this.
```

**What this reveals:**
The gap between what the user believes is installed and what actually is installed creates real friction. In this case it manifested as: (1) searching for a feature that doesn't exist, (2) discovering it exists upstream but not in the current release, (3) discovering the Apollo patch for it came from upstream all along. The cross-machine divergence (Apollo has patches, Dionysus doesn't) is a recurring source of confusion.

**Counter-evidence:**
The user eventually got the full picture and the session continued productively. The confusion was temporary, not a catastrophic failure.

---

## Dismissed Events

**gsd-reflect a1b2c954 (1 event, interest 3):** Long session (127 min) primarily running the GSD deliberation trial rounds. The single event was a long gap — likely the user was away. No friction or struggle patterns. Dismissed.

**PDFAgentialConversion c7204805 and fc7921d7 (0 events):** These sessions were used as calibration targets in the session 9af8f0ae discovery pipeline. The 9360-minute fc7921d7 session appears to be a long-running autonomous conversion job, not an interactive session with user friction. Spot-checked opening messages — consistent with automated processing. Dismissed.

**gsd-reflect 8cf4c8f4 and 84d9f494 (0 events each):** Short sessions (17 min and 276 min). Zero structural events. Brief spot-checks confirmed routine work. Dismissed.

**blackhole-animation d3169865, 85bf6e8c, 8233c119, 90b73078 (0 events each):** Routine phase execution sessions with no interruptions or direction changes. Dismissed.

**vigil 1b365ecc and d822050b (0 events each):** Spot-checked — vigil is a new project, these appear to be planning sessions. No friction detected. Dismissed.

---

## Cross-Session Patterns

### Pattern 1: Agent Confidence Without Evidence Basis
Across all three blackhole sessions and the epistemic-agency session, there is a recurring pattern where agents give confident assessments from training data when they should research: "no Windows VM" (wrong — Steam Proton exists), "no agentic UI solutions" (wrong — incomplete research), "no discuss_mode feature" (partially wrong — upstream unreleased). The correction always requires multiple user prompts. This is not session-specific; it's a behavioral pattern.

### Pattern 2: Cross-Machine Feature Divergence (Apollo Has Patches, Dionysus Doesn't)
Multiple sessions (291fb270, 9af8f0ae) reveal that Apollo has local patches that Dionysus lacks — specifically the discuss_mode feature and the log sensor. Users discover this when features they believe are universal aren't present. Session 9af8f0ae was substantially about auditing these patches and planning to backport them. This cross-machine divergence is an ongoing maintenance burden.

### Pattern 3: Verification → Independent Audit → Fix Loop
Session fb3a0a76 established a pattern: GSDR verifier claims PASS → independent cross-model audit finds gaps → fixes applied → second audit confirms. This loop is productive but expensive (multiple agent invocations). The ideal would be the GSDR verifier being sophisticated enough to catch the gaps the external audit catches. The cross-model audit methodology (Opus + GPT-5.4 pairs) was explicitly validated and should be formalized.

### Pattern 4: Informal Workarounds for Missing GSD Capabilities
Session 7f423906 (research-only mode workaround), session aa35375e (manual session log lookup), and session 9af8f0ae (6 agents launched manually for audit) all show the user developing ad-hoc patterns to accomplish things GSD doesn't directly support. Each is a candidate capability-gap signal for v1.20 scope consideration.

### Pattern 5: Autonomous Sessions with Direction Changes
Both the vigil session (8c2cdf8a) and the blackhole session (7f423906) show a pattern of `--auto` triggering substantial work, followed by the user returning to inject context that changes direction. The vigil session had two complete roadmap revision cycles after the initial `--auto` run. This suggests `--auto` needs a natural checkpoint for user injection before locking scope.
