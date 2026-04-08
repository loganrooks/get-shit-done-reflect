# Pre-v1.20 Session Capture (2026-04-07/08)

**Date:** 2026-04-07 to 2026-04-08
**Status:** Open
**Trigger:** User identified urgent need to address patching problems, sensor gaps, KB management, and signal system maturation before next milestone. Session evolved into a comprehensive cross-platform session log audit + model comparison experiment + milestone scoping deliberation.

## Key Deliberation Threads

### Thread 1: Signal vs Issue Ontology

The user identified a gap no existing deliberation explicitly addresses: signals and issues are pragmatically distinct concepts.

| | Signal | Issue |
|---|---|---|
| What it is | An observation — a sensor detected something | A problem statement — synthesis of signals into something actionable |
| Dewey mapping | Indeterminate situation / felt difficulty | Problematic situation — named, bounded, investigable |
| Multiplicity | One signal, one detection event | One issue may compose multiple signals; same signal can participate in multiple issues |
| Depth | Surface (a symptom was noticed) | Can be surface (quick patch) or structural (connected to many signals, requires architectural change) |
| Lifecycle | detected → remediated → verified | filed → triaged → scoped (patch/milestone) → resolved → evaluated |

User uses GitHub Issues because they have triage routing, scoping decisions, and actionable resolution paths — things the signal system lacks. The signal system detects but doesn't synthesize detections into problems worth solving.

**Decision needed:** How to design signal-to-issue promotion. Whether to build this into the KB or integrate with GitHub Issues or both.

### Thread 2: KB Management & Authority

**Problem confirmed by audit:** Signals scattered across:
- Multiple machines (dionysus, apollo — 117 signals on apollo largely invisible from dionysus)
- Multiple locations per machine (global `~/.gsd/knowledge/` vs project-local `.planning/knowledge/`)
- Multiple systems (KB signals, GitHub issues, deliberations)
- No unified discovery mechanism

**Concrete evidence:**
- zlibrary-mcp: 30 signals only in global KB, no project-local KB at all
- get-shit-done-reflect: 9 orphaned signals in global KB alongside 202 in project-local
- Cross-runtime distribution gap: fixes shipped in GSDR don't reach projects running global GSD

**User concern:** Signals in project-local KB could get lost if not committed/pushed. Need proper migration for legacy harness setups.

**Decided direction:** Need a proper developmental MCP tool or similar for signal discovery across locations and machines. GitHub Issues work as a discovery mechanism because they have a single queryable namespace.

### Thread 3: Log/Chat Sensor Design

**Apollo rough patch:** Three-tier zoom (structural metrics → keyword scanning → ±2 line context reads). Fixed heuristic pipeline with thresholds.

**User critique:** Too surface-level. Vague metrics. The real value is finding moments where `/gsdr:signal` should have been invoked but wasn't. Need progressive deepening with decision points at each stage:
1. Structural fingerprinting (cheap)
2. Intelligent triage (agent decides what's interesting)
3. Selective context expansion (read more around promising events)
4. Signal construction (gather enough evidence for a proper entry)
5. At each stage: "is this worth escalating?" — not fixed thresholds

**Key insight from user:** "Once we discover events, we should selectively / progressively expand our context around each. Which of the initial set is worth escalating to a signal? Now let's read more context. Now which remain issues? Do we have enough context to record a proper signal entry or do we need more? Access it in an intelligent way."

**Implemented:** Rewrote `agents/gsd-log-sensor.md` in source with progressive deepening design. Also wrote `extract-session-fingerprints.py` for structural extraction. Both validated by the audit itself (165 findings from 100 sessions).

**Post-audit revision — positive signals and sensor architecture:**

The initial sensor design and the audit's negative discovery pass were both framed around finding problems — struggles, failures, gaps. The positive signal discovery pass (98 findings) revealed that session logs contain equally valuable positive patterns: workflows that worked well, productive deviations, cross-model review successes, effective collaboration moments, and signal-system-working-as-designed events.

**Open design questions for the log sensor:**

1. **Negative + positive: one sensor or two?** The structural fingerprinting stage is shared (interruptions, direction changes, backtracking are event types regardless of valence). But the triage heuristics diverge: negative triage looks for frustration markers, error streaks, corrections; positive triage looks for affirmation language, smooth autonomous runs, effective delegation. Arguments for one sensor: shared extraction infrastructure, events often have both negative and positive aspects in the same exchange (a correction that leads to a better outcome). Arguments for two: different prompt framing, different structural markers, different downstream consumers. The audit ran them as separate agent passes and that worked — but at 2x cost.

2. **What other metrics/measurements should the sensor capture?** Beyond conversation flow analysis:
   - **Token usage reporting:** Session logs contain full usage data per assistant message (input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens, service_tier). This is a first-class signal source for efficiency analysis. Open source token reporting projects exist as reference designs (e.g., claude-token-counter, llm-cost-tracker patterns). Token usage is an important sensor dimension: high token burn with low output may indicate context thrashing; disproportionate cache misses may indicate poor session structure; cost-per-finding ratios inform model selection.
   - **Tool call efficiency:** Ratio of successful tool calls to total, tool diversity per session, repeated identical tool calls (retry patterns)
   - **Delegation patterns:** Agent spawning frequency, background vs foreground, model selection for subagents
   - **Session structure:** Turn-taking ratios, message length distributions, gap patterns as workflow indicators
   - **Context window utilization:** How close to limit, cache hit rates, context thrashing indicators

3. **Infrastructure needed:** The audit demonstrated that the extraction script (`extract-session-fingerprints.py`) is the foundation. It needs:
   - Codex session log adapter (different format from Claude Code JSONL)
   - Cross-machine invocation capability (SSH or staged copies — the audit used staging)
   - Integration with the collect-signals workflow (currently the log sensor is disabled by default)
   - Token usage aggregation and reporting (session-level, phase-level, project-level)

4. **Active vs passive sensing:** The current sensor is retrospective — it analyzes logs after a phase completes. Could some sensing be active (during execution)? The context-monitor hook already exists for bridge-file-based context tracking. Token usage could be tracked in real-time via hooks. The question is whether active sensing adds value or just adds overhead — and whether it changes the user's relationship to the system (Stiegler's pharmacology: monitoring can both enable and constrain).

### Thread 4: CONTEXT.md Future Awareness

Issue #36 from f1-modeling audit. Each phase CONTEXT.md should have a `<future_awareness>` section capturing architectural constraints imposed by future phases and v2 ambitions — distinct from Deferred Ideas (which are features). Future Awareness captures constraints that shape HOW the current phase is implemented.

**Status:** Patches described in issue, not yet merged to source.

### Thread 5: Milestone Structure

**Agreed structure:**
- **v1.20:** Sensor implementation & signal pipeline maturation (urgent, reduces development friction)
- **v1.21:** The automation focus originally planned for v1.20

**Within v1.20, two tiers:**
- **Tier A (plumbing, doesn't need philosophical resolution):** KB authority enforcement, signal lifecycle automation, log/chat sensor, CONTEXT.md future awareness, agent model profile registration
- **Tier B (benefits from research grounding):** Signal/issue ontology, KB organization at scale, signal relational structure, memory model for the KB

**User's position:** Tier A fixes should anticipate Tier B architecture — don't close doors. Tier B may slide to v1.21 if research reveals the problem is bigger than expected.

### Thread 6: Continental Philosophy of Memory

User wants to defer deeper KB architecture until:
1. arxiv-sanity-mcp is operational (for surveying agentic memory systems literature)
2. Proper engagement with continental discourses on memory: Stiegler (tertiary retention), Ricoeur (memory/history/forgetting), Bergson (habit vs pure memory), Derrida (archive structures what can be remembered)

**Practical implications identified:**
- Stiegler: KB schema IS the system's horizon of possible memory. Schema constrains what can be remembered.
- Ricoeur: Signals (memory), reflections (history), and lifecycle/pruning (forgetting) are architecturally interdependent.
- Bergson: Signal system needs both habit memory (automated remediation) and pure memory (available for novel interpretation/re-reading).
- Derrida: Archive structures what can be remembered, not just stores it. Design decisions now shape what future signals can look like.

### Thread 7: Cross-Model Review Formalization

**Emerged as strongest positive pattern in audit (independently confirmed by 5 of 6 positive signal agents).**

User's specific vision:
- Using Codex CLI GPT 5.4 high for code reviews that catch gaps not just in execution but in planning, framing, roadmapping
- Claude agent should respond with structured pushback, not uncritical acceptance
- Back-and-forth with justification demands
- GPT 5.4 high seems good at roadmap-level review specifically

**Audit evidence:**
- GPT-5.4 consistently stricter than Claude, catching secondary code paths Claude accepts as fixed
- Cross-model audit caught verifier systematic optimism across 4 phases
- Codex review caught spike framing bias and methodology gaps human review missed
- Agent 3 recommended: `/gsdr:cross-model-review` with committed audit spec, Codex CLI background launch, findings categorization (agree/agree-with-nuance/dispute-with-evidence)

### Thread 8: Cross-Platform Parity

User will be developing with Codex, so pressing parity issues need addressing. Audit surfaced:
- Agent spawns Claude when user asks for Codex (tool substitution pattern)
- Claude lacks operational knowledge of Codex CLI parameters (context window, reasoning effort, prompt style)
- Codex CLI reliable for read-only analysis but had failures for execution tasks
- PID management unreliable with multiple concurrent Codex sessions
- Patches applied to Claude without checking Codex compatibility
- Cross-runtime distribution gap: GSDR fixes don't reach global GSD installs

### Thread 9: Model Comparison Experiment

**Clean comparison on Assignment 5 (9 sessions, 76 events, identical prompts):**

| Model | Clean Findings |
|-------|---------------|
| Opus 4.6 | 12 |
| Sonnet 4.6 | 11 |
| GPT-5.4 xhigh | 11 |
| GPT-5.4 medium | 8 |
| GPT-5.4 high | 6 |

**Key findings:**
- Model quality matters more than reasoning effort within GPT
- GPT high found FEWER than medium (U-shaped curve: medium 8, high 6, xhigh 11)
- Contamination inflates GPT high +50%, Sonnet +18%, but GPT xhigh slightly deflated
- Sonnet best cost-effectiveness for routine sensors
- Opus recommended for audit mode
- GPT useful for cross-model diversity, not as primary sensor

### Thread 10: Sensor Ecosystem & Active Measurement Systems

Beyond the log/chat sensor, the audit and deliberation surfaced a broader question about what sensing infrastructure the harness needs:

**Existing sensors:** artifact (reads PLAN/SUMMARY/VERIFICATION), git (commit patterns), CI (GitHub Actions). All retrospective, all negative-signal-biased.

**Proposed new sensors from deliberations and audit findings:**
- **Token/efficiency sensor:** Session logs contain full usage data. Open source reference designs exist. Would enable: cost-per-phase tracking, model selection optimization, context thrashing detection, efficiency regression alerts. This is among the most impactful new sensors because it provides data for model selection decisions (the model comparison experiment was manual — this would automate it).
- **Plan-accuracy sensor:** PLAN.md vs SUMMARY.md comparison. Lowest complexity, highest signal count in prior manual collections.
- **Validation-coverage sensor:** Detects missing verification, low verification scores. Already prototyped in sensors.cjs.
- **Test-regression sensor:** Test count decreases between phases. Needs baseline tracking.
- **Upstream-drift sensor:** Detects when upstream moves past baseline freeze. Phase 48.1 drift ledger went stale in 4 days.
- **Patch sensor:** Local patches as signals — differentiate user customization from harness output errors.

**Design questions:**
- Should sensors be purely retrospective (post-phase) or can some be active (during execution)?
- How to handle positive signal detection across all sensors, not just the log sensor?
- What's the governance model for new sensors? Drop-a-file extensibility is validated but creates shadow agents without model profiles or manifest registration (9 unregistered agents per the sensor-expansion deliberation).
- How do sensors on different platforms (Claude Code vs Codex) maintain parity when log formats differ?

**Reference designs to investigate:**
- **claude-spend** (github.com/writetoaniketparihar-collab/claude-spend): Local-first token usage dashboard for Claude Code. Reads `~/.claude/` session files directly, aggregates per-conversation, daily, and model-specific usage, serves localhost dashboard. Key pattern: zero-config CLI (`npx claude-spend`) that auto-discovers session logs without API credentials. Node.js + HTML/JS. All data stays local. Useful as reference for: session log parsing, token aggregation across dimensions, cost analysis per prompt/session/phase.
- **Reddit discussion** (r/ClaudeAI/comments/1r7ydj6): Token usage dashboard with community discussion of approaches and limitations (URL inaccessible from this machine — check from apollo or browser).
- Agentic memory system papers (via arxiv-sanity-mcp when operational)
- LLM observability platforms (LangSmith, Weights & Biases Traces, etc.) for architectural patterns
- The session log JSONL format already contains per-message usage data (input_tokens, cache_creation_input_tokens, cache_read_input_tokens, output_tokens, service_tier, inference_geo) — confirmed in this audit. No external API needed.

## Session Log Audit Results

### Methodology
1. Structural fingerprinting: 100 sessions, 539 events, 2 machines (extract-session-fingerprints.py)
2. Calibration: 1 session, 9 events → 5 signals, ~14K tokens read, validated approach
3. Discovery: 6 agents (3 Sonnet, 3 GPT-5.4 medium), 67 negative findings
4. Model comparison: 10 runs on Assignment 5 (5 clean, 5 contaminated)
5. Synthesis: Opus + GPT xhigh → 42 unique findings, 8 thematic clusters, 23 recommendations
6. Verification: 2 agents → 13 RECURRED, 11 NEW, 17 KNOWN-UNADDRESSED, 10 ADDRESSED, 8-20 PARTIALLY-ADDRESSED
7. Positive discovery: 6 agents → 98 positive findings
8. Positive synthesis: Opus + GPT xhigh (pending)

### Key Structural Finding (from verification)
Every failed intervention (13 RECURRED) used advisory text or documentation as the fix mechanism. None implemented a structural gate, hook, or enforced workflow step. The harness treats almost all quality controls as agent-discretion opt-in rather than enforced opt-out.

### Positive Signal Synthesis Results
98 positive findings consolidated into 35 unique patterns across 8 thematic clusters:
- **Cross-model review** (strongest pattern, 4 projects): GPT-5.4 consistently stricter than Claude; catches secondary code paths Claude accepts as fixed. Top formalization candidate: `/gsdr:cross-model-review` with committed audit spec and structured response protocol (accept/accept-with-nuance/dispute-with-evidence).
- **User epistemic challenges** (most universal, 5 projects): Single-sentence user pushbacks consistently triggered the best quality responses. The user serves as epistemic guardian — the framework should formalize this role.
- **Autonomous pipeline execution** (maturing): discuss→plan→execute runs cleanly when finish conditions are stated upfront and delegation patterns are correct.
- **Signal system working as designed** (intermittent): Real-time KB injection via `/gsdr:signal`, sensor model corrections caught mid-execution and saved to memory.
- **Trial-before-formalize** (emergent methodology): Informal prototype runs before formalizing, with prediction-evaluation cycles. Falsifications most informative.
- **Reference design survey** (high impact, not yet formalized): 30-app survey resolved 2 phases of empirical spikes in 15 minutes. GSDR lacks this as a standard early-phase step.

**Key structural insight from positive synthesis:** The system's failure modes and success modes are not separate — positive patterns frequently emerged as direct responses to failures. Formalization should build the system's capacity to catch and respond to its own failures, not add capabilities from scratch.

**5 pure gaps (negative clusters with NO corresponding positive pattern):**
1. Gate enforcement (all gates are advisory)
2. Signal lifecycle closure (0% remediation)
3. Cross-machine KB sync
4. Abortable orchestration (no abort semantics for wrong-agent dispatch)
5. Proactive protocol compliance (agent doesn't self-check against workflow docs)

### All artifacts persisted at
`.planning/audits/session-log-audit-2026-04-07/` — 32 reports, 6 tool/prompt specs, 8 data files.

## Open Questions for v1.20 Scoping

1. How does signal-to-issue promotion concretely work? KB-native, GitHub integration, or both?
2. How to design Tier A fixes (KB authority, lifecycle) to anticipate Tier B architecture (signal ontology, memory model)?
3. Should the research phase (arxiv-sanity + continental philosophy) be within v1.20 or deferred to v1.21?
4. What is the "phase sensor"? (User mentioned, not yet clarified)
5. How to formalize cross-model review without over-formalizing (the pattern works partly because it's informal)?
6. Which of the 13 RECURRED findings get structural enforcement in v1.20 vs deferred?
7. How to handle the cross-runtime distribution gap (GSDR fixes not reaching global GSD installs)?

## Pending Work

- Positive signal synthesis (Opus + GPT xhigh running)
- Commit all audit artifacts
- Start `/gsdr:new-milestone` with this evidence base
- Deliberations on signal/issue ontology and KB architecture (may be within milestone or pre-milestone)
