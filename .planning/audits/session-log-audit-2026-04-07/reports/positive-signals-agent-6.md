# Positive Signal Discovery: Agent 6

**Sessions analyzed:** 10
**Positive patterns found:** 9

---

## Findings

### Finding 1: Trial-Before-Formalize as Emergent Methodology
**Session:** 7c46a5cd | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** productive-deviation

**What worked:**
The user explicitly introduced a principle mid-session: before creating a formal sensor workflow, perform the sensing task informally with a raw agent dispatch, observe what it returns, and use that as a proof-of-concept to determine whether formalization is warranted. The session then did exactly that — cross-project audit agents were dispatched without a formal sensor command, produced a synthesized artifact (`cross-project-gsdr-adoption-audit-2026-04-02.md`), and the artifact itself carried a "deviation testimony" header explaining why it was placed in `.planning/` root rather than a structured location.

The user's prompt at turn 69: "before we even create it, perhaps we perform the task informally, we just assign such and such a task to an agent, send it off and see what it returns."

The agent immediately accepted this and reframed the prior work: "treat the audit we just performed as the proof-of-concept it is: an informal prototype of what a cross-project sensor or audit workflow might eventually formalize."

This produced a different artifact than the standard workflow would: a qualified document with exposed assumptions, situated critique, and explicit deviation reasoning — not a dry phase output.

**Why it worked:**
The informal dispatch revealed what the formal workflow couldn't predict: the sensor's value, failure modes, and placement problems. The results were concrete enough (33 predictions, 6 trials, 21 evaluated) to ground decisions about formalization rather than theorize about them in the abstract.

**Formalization potential:**
This is now the `feedback_trial_before_formalize` memory entry. Formalization path: a `gsdr:trial` command that runs an informal agent dispatch with explicit "this is a proof-of-concept" framing, and produces a qualified artifact automatically marked as a deviation. The trial roadmap pattern (predictions, method, thread connections, explicit assumptions) could be templated.

---

### Finding 2: Prediction-Evaluation Cycle as Epistemic Discipline
**Session:** 7c46a5cd | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** workflow-success

**What worked:**
The session ran 6 sensor trials across cross-project data with explicit upfront predictions for each trial (25 total), then evaluated each prediction against actual findings. The agent tracked a running scorecard: "14 confirmed (67%), 5 falsified (24%), 2 partial (10%)." Crucially, the agent noted in the synthesis: "Falsifications were the most informative findings every time."

The prediction cycle prevented premature closure. When Trial B evaluated only one deliberation and called it "worth formalizing," the user pushed back ("wait trial B evaluated only one deliberation?"), and the agent admitted: "We chose the 'most evaluable' (zlibrary-mcp) — a convenience sample. We never evaluated... the signal that's directly about the harness's biggest confirmed gap."

**Why it worked:**
Forcing predictions before dispatch created a reference point that survived the session. Without the prediction table, the convenience sampling error in Trial B would have gone unnoticed. The predictions also created an epistemic audit trail that made gaps visible to the user.

**Formalization potential:**
The sensor trial roadmap format (predictions per trial, evaluation column, falsification notes) could become a template invoked by `gsdr:trial`. Auto-proceed mode in long sessions should be required to record predictions before dispatching agents, not just after.

---

### Finding 3: Auto-Proceed with Self-Deliberation Marking
**Session:** 7c46a5cd | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** workflow-success

**What worked:**
When the user left ("I am going to the store and leaving this to run"), the agent continued executing 3 remaining trials (C, B, and the synthesis), recording findings, updating the roadmap, saving memories about methodological practices, and committing artifacts — all without user prompts. The agent marked all self-deliberations as automated in the trail. When the user returned and found gaps (Trial B's convenience sampling), the artifact trail was rich enough to make the gap visible: the prediction table showed what was and wasn't evaluated.

The agent also proactively saved memories during the auto-proceed period: "Four new memories saved capturing the methodological practices established this session." This is an instance of the harness learning from its own operation while the user is absent.

**Why it worked:**
The session had a clear structure (trials + predictions + roadmap updates) that gave the agent enough context to proceed autonomously. The commit discipline (every trial checkpoint committed) meant the user could review what happened on return rather than relying on agent summary.

**Formalization potential:**
Auto-proceed mode should require: (1) predictions before dispatch, (2) checkpoint commits after each trial, (3) deliberations marked as automated. The memory-saving behavior during auto-proceed is particularly valuable and should be explicitly encouraged in the workflow spec.

---

### Finding 4: Headless Claude Session for Emergency Patch Release
**Session:** 7c46a5cd | **Project:** get-shit-done-reflect | **Machine:** dionysus
**Type:** productive-deviation

**What worked:**
When the user discovered a stale GitHub issue (#26 — discuss-mode feature gap) mid-session and wanted it shipped immediately, the orchestrating agent spawned a headless `claude` process (using `-p` flag and `--dangerously-skip-permissions`) with a comprehensive prompt that included all necessary context, references to apollo patches, all critical rules, and instructions to go all the way through implementation → PR → CI → merge → release. The headless session completed the full flow in ~15 minutes: implemented three-mode discuss system, created PR #34, merged it, and published v1.19.0 to npm.

The orchestrating session continued other work (interpretive writing, Round 2 roadmap planning) while the headless session ran in parallel. The main context stayed clean.

The failure mode was also documented: the headless session used `feat:` prefix instead of `fix:`, burning the v1.19 version number. This became a signal immediately.

**Why it worked:**
The prompt engineering was thorough enough that the headless session could proceed without interruptions. The `-p` flag runs as a single long turn with all tools available — appropriate for a well-scoped task with complete instructions. The parallel execution kept the main session's flow intact.

**Formalization potential:**
This pattern is already semi-formalized as the "headless patch" workflow. The missing piece: the prompt template should explicitly specify `fix:` prefix for patch releases (this gap is now a saved signal and memory). A `gsdr:headless-patch` command that enforces prefix semantics would prevent the version-number burn.

---

### Finding 5: Wave-Based Parallel Execution with Sonnet Executor Override
**Session:** 3de8caf1 (home, plan-phase) + e75f3f5f (vigil, execute-phase) | **Machine:** dionysus / apollo
**Type:** workflow-success

**What worked:**
In two independent sessions, the user caught that the `quality` profile defaults executor agents to Opus, which is wasteful for read-only or well-scoped tasks. In both cases, the user asked to override to Sonnet at the orchestrator level ("can we just like, ensure we launch the execute-phase workflow with sonnet, i mean we are the orchestrators?"), and the agent immediately confirmed this is valid: "we're the orchestrator — the `executor_model` from init is just a suggestion. We control the `model` parameter when we spawn Agent calls."

The home session (3de8caf1) then executed Phase 7.1 with 11 Sonnet agents across 3 waves, producing: 701-line Claude JSONL format reference, 699-line Codex SQLite format reference, 10 intermediate analysis reports, and a 37KB synthesis report — all verified (11/11 SUMMARYs, 14+ commits, zero self-check failures).

**Why it worked:**
The orchestrator-level model override is architecturally correct (executors are spawned by the orchestrator, which controls the `model` parameter). The user understanding this gave them accurate cost/quality control. The tasks (log parsing, format reverse-engineering, git pattern analysis) were well within Sonnet's capability.

**Formalization potential:**
The execute-phase workflow could expose a `--executor-model` flag that lets users explicitly override without needing to understand the internal model parameter. The progress output ("11 Sonnet agents across 3 waves") already communicates this — the gap is just making the override discoverable in the command interface.

---

### Finding 6: Deliberation-First Project as Positive Template (f1-modeling)
**Session:** f91ab5d9 | **Project:** f1-modeling | **Machine:** dionysus
**Type:** workflow-success

**What worked:**
The f1-modeling project used deliberation-first design: all 7 deliberations were properly templated and concluded before significant code was written, covering scope, architecture, pedagogy, data strategy, and infrastructure. When the session surfaced a roadmap/requirements gap (21 action items across 6 categories including remote access, new model requirements, and data strategy), the agent dispatched 3 parallel deliberation agents to write formal deliberation files before updating the roadmap.

The session also produced a `gap-analysis-2026-03-26.md` artifact, updated REQUIREMENTS.md (42 requirements up from 34), updated ROADMAP.md, created a project-level CLAUDE.md, and updated the phase context — all in one session without the user needing to direct each step.

The user's final instruction captured the self-improvement intent: "to adhere to the gsdr best practices as well, to auto-proceed through the different stages and phases with proper checks, and adhering to best practice protocols."

**Why it worked:**
The project's deliberation-first culture meant the gap analysis had a place to land: each gap could route to either a new requirement (REQUIREMENTS.md), a new deliberation, or a roadmap adjustment, with clear rationale. The 3 parallel deliberation agents worked simultaneously on different domains, completing the full update in a single session.

**Formalization potential:**
The "gap analysis → parallel deliberation dispatch → requirements update → roadmap update → CLAUDE.md → context update" sequence is a strong onboarding/review pattern. It could be formalized as `gsdr:gap-analysis` that runs this pipeline when significant requirements drift is detected.

---

### Finding 7: Handshake + Working Plan Protocol for Inherited Context
**Session:** a1a7cc42 | **Project:** blackhole-animation | **Machine:** apollo
**Type:** collaboration-pattern

**What worked:**
The session opened with a user prompt that established a structured inheritance protocol: immediately write a handshake file at `.planning/.tmp/claude_opus_inheritance_handshake.md` confirming receipt of the task, then create a working plan at `.planning/.tmp/claude_opus_inheritance_plan.md` and update it at least twice during the review.

The agent complied immediately, then launched parallel research agents to investigate candidate repositories while reading project documents in parallel (20+ documents read). When agents returned, their findings were integrated into the framework document in real-time. The session produced a comprehensive `REFERENCE_INHERITANCE_FRAMEWORK.md` with 10 required sections including: math-to-inherit vs architecture-to-inherit distinction, repo-specific assessments enriched by agent findings, and a falsification-aware decision framework.

40 satisfaction-signal hits with only 5 user turns — the ratio suggests the deliverable landed without significant correction cycles.

**Why it worked:**
The handshake/working-plan protocol gave the user immediate confirmation that the task was received and properly understood, without requiring a response before work began. The plan updates served as audit trail that the agent was working coherently through the problem. The parallel research agents were used correctly: the framework was written from existing documentation, then agent findings were integrated to enrich specific sections — not blocked on agents to start.

**Formalization potential:**
The inheritance handshake pattern is worth capturing as a standard practice for cross-session complex analysis tasks. A `gsdr:inherit` command could automate the handshake + working-plan creation, ensuring the receiving agent always documents its interpretation before proceeding.

---

### Finding 8: Framing Correction Before Synthesis (tain project)
**Session:** 473146be | **Project:** tain | **Machine:** dionysus
**Type:** collaboration-pattern

**What worked:**
During a `gsd:new-project --auto` initialization for a new adversarial prose improvement system (tain), the research agents collapsed an open design question into a two-agent model. The user caught the framing error before the synthesis: "the architecture is not determined. 'Generator' and 'discriminator' are functional roles, not necessarily single agents — each could be a subsystem, an ecology of specialists, a pipeline that grows its own complexity."

The agent acknowledged the framing leak immediately and assessed the damage to each research file before redoing what needed redoing. ARCHITECTURE.md was fully redone. STACK.md, FEATURES.md, and PITFALLS.md were surgically corrected. The contamination problem (AI models having memorized training texts) was elevated from a mitigation concern to a foundational design constraint incorporated across all four files.

**Why it worked:**
The user's interruption came at the right point — after research, before synthesis. Catching the framing at synthesis would have been much more expensive. The agent's damage assessment (which files were fully affected vs. lightly affected) was accurate and prevented unnecessary rework.

**Formalization potential:**
The `gsd:new-project --auto` workflow could include an explicit "framing checkpoint" after research completes but before synthesis begins, surfacing the key architectural assumptions the researchers made for user review. This catches collapsed design spaces before they propagate into requirements.

---

### Finding 9: CI Repair as Systematic Root-Cause Debugging (zlibrary-mcp)
**Session:** 3d2f2bc6 | **Project:** zlibrary-mcp | **Machine:** dionysus
**Type:** workflow-success

**What worked:**
The session opened with the user asking "all CI tests passing? deployed to NPM?" — a single question that became a full CI debugging session. The agent found that CI was failing (pip-audit not installed in UV environment) and NPM publish was blocked (coverage 52.96% < 53% threshold by 0.04%). Rather than making minimal fixes, the agent addressed root causes systematically: added pip-audit to dev deps, ran it, found 11 vulnerabilities, upgraded dependencies, hit a new test failure from a PyMuPDF version change, constrained the version, verified locally, then hit a CI-specific failure from the same version on a different platform.

The session demonstrates systematic backtracking: when the PyMuPDF upgrade caused cascading test failures, the agent reverted to 1.26.5 with a CVE ignore rather than playing "whack-a-mole" with individual test fixes.

**Why it worked:**
The agent correctly identified that the underlying tests were already passing — the failures were infrastructure issues (missing dev dep, coverage threshold, version compatibility). The fix sequence was: minimal viable fix → run full validation → discover secondary failures → root-cause secondary failures → decide whether to fix or revert. The revert decision when cascading failures emerged was correct.

**Formalization potential:**
The "CI repair" debugging sequence is a natural candidate for `gsdr:debug`. The key practice — "check whether tests pass independently before attributing failure to test quality" — could be documented as a debugging heuristic in the workflow spec.

---

## Cross-Session Patterns

### Pattern 1: User-as-Framing-Corrector, Agent-as-Executor
Across the tain session (framing correction), the home session (wrong directory initialization, then "theres a whole ass folder for it"), and the vigil session (automation regression caught), the user's most effective contributions were brief framing corrections that reoriented significant amounts of agent work. The agents accepted these corrections quickly and assessed the damage before redoing work. This asymmetry — user provides direction, agent provides execution depth — appears to be the session dynamic that works best.

### Pattern 2: Parallel Agent Dispatch with Background Integration
Four separate sessions used parallel agent dispatch (blackhole a1a7cc42: 4 research agents on repo analysis; f1-modeling: 3 parallel deliberation agents; get-shit-done-reflect 7c46a5cd: 4-6 audit agents; home 3de8caf1: 11 wave-parallel execution agents). In each case, the orchestrator continued productive work (writing framework sections, updating context, committing intermediates) while agents ran. The sessions that got this right treated agent completions as enrichment to existing work, not blockers.

### Pattern 3: Artifact-First Documentation
The best sessions created artifacts immediately (handshake files, working plans, deviation testimony headers, prediction tables) rather than relying on session memory. Sessions with artifact discipline had better recovery when context ran out (vigil 84be1fa4 continued seamlessly from a context summary) or when users returned from absence (get-shit-done-reflect 7c46a5cd — the artifacts made gaps visible).

### Pattern 4: Signal Logging at Point of Occurrence
Multiple sessions showed in-session signal logging: the vigil session logged the missing `main.swift` entry point as a signal immediately after discovering it; the get-shit-done-reflect session logged the `feat:` prefix burn immediately after the headless session completed. Both signals were logged before the next action, not during a post-session collection run. This real-time logging is more accurate than retrospective collection.

### Pattern 5: Executor Model Selection as Conscious Decision
Two sessions independently surfaced the insight that executor model selection is an orchestrator decision, not a profile default. In both cases, Sonnet was the right choice for the actual tasks (log parsing, read-only analysis). The pattern suggests the `quality` profile's default of Opus for executors is frequently wasteful for the actual work being done.

---

## Recommendations for Formalization

### High priority

**1. Trial roadmap template** — The prediction-evaluation format from the sensor trials session is mature enough to template. Include: trial name, method, thread connections, explicit assumptions to expose, upfront predictions, evaluation column, falsification notes. This alone could change how informal experiments are conducted across all projects.

**2. Handshake + working plan protocol** — The inheritance handshake pattern (`.planning/.tmp/claude_opus_inheritance_handshake.md` + `.planning/.tmp/claude_opus_inheritance_plan.md` updated 2x) is a strong standard for any complex analysis task. Should be documented in GSDR agent guidance.

**3. Headless session prompt template with semver rules** — The headless dispatch pattern works but needs a standard prompt template that enforces `fix:` vs `feat:` prefix discipline. The v1.19 version burn was preventable with one line in the prompt.

### Medium priority

**4. Framing checkpoint in `gsd:new-project --auto`** — After research completes, before synthesis, surface the key architectural assumptions researchers made for user review. Prevents collapsed design spaces from propagating.

**5. `--executor-model` flag for execute-phase** — Make Sonnet override discoverable without requiring users to understand internal model parameter mechanics. The "we're the orchestrators" insight shouldn't require explanation each time.

**6. Auto-proceed requirements** — When entering auto-proceed mode (user leaving), require: predictions before each dispatch, checkpoint commits after each trial, deliberations marked as automated, memories saved for methodological practices. This makes the artifact trail useful when the user returns.

### Lower priority

**7. Signal logging at point of occurrence** — The gap between real-time signal logging (seen in vigil and get-shit-done-reflect) and end-of-session `collect-signals` is significant. Sessions that logged in real time produced more accurate signals. Consider prompting for signal creation immediately when a notable deviation or finding occurs, not just at session end.
