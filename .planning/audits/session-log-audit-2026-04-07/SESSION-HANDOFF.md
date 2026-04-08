# Session Handoff: Cross-Platform Audit & v1.20 Milestone Preparation

**Session dates:** 2026-04-07 to 2026-04-08
**Machine:** dionysus (with SSH access to apollo)
**Next action:** `/gsdr:new-milestone` for v1.20, informed by this document

## What This Session Did

This session began with a concern about patching problems and sensor gaps, evolved into the most comprehensive cross-platform audit the project has conducted, and produced the evidence base for scoping v1.20. The arc:

1. **Problem identification** — patches applied on Apollo never made it to source; log sensor is a disabled stub; KB signals scattered across machines; GitHub Issues used as workaround because signals aren't discoverable.

2. **Landscape mapping** — inventoried all signal locations (596 files across 2 machines), all GitHub issues (3 open), all deliberations (72 across 6 projects), and all session logs (605 Claude sessions + 1,223 Codex entries in last 2 weeks).

3. **Log sensor rewrite** — replaced the disabled stub (`agents/gsd-log-sensor.md`) with a progressive deepening design. Key insight from user: the sensor should exercise judgment at each stage about what deserves more attention, not run a fixed heuristic pipeline. Five stages: structural fingerprinting → intelligent triage → selective context expansion → evidence gathering → signal construction.

4. **Cross-platform session log audit** — the audit itself was a proof-of-concept for the sensor:
   - Structural fingerprinting extracted 539 candidate events from 100 sessions
   - Calibration run on 1 session validated the approach (14K tokens read → 5 signals)
   - 6 discovery agents (3 Sonnet, 3 GPT-5.4 medium) found 67 negative findings
   - 6 positive signal agents found 98 positive findings
   - Dual synthesis (Opus + GPT xhigh) consolidated into 42 unique negative and 35 unique positive patterns
   - Verification analysis cross-referenced against git, KB, and GitHub: 13 RECURRED, 11 NEW, 17 KNOWN-UNADDRESSED

5. **Model comparison experiment** — same 9 sessions given to 5 models with identical prompts (clean) + 3 contaminated runs. Found: Opus (12) ≈ Sonnet (11) >> GPT medium (8) > GPT high (6). Contamination inflates GPT 50%, Sonnet 18%. Recommendation: Sonnet for routine sensors, Opus for audits.

6. **Telemetry research** — discovered Claude Code's undocumented `~/.claude/usage-data/session-meta/` (268 sessions of pre-computed analytics including user_interruptions, tool_errors, token counts) and mapped the full data model for both platforms. Identified 10 computable-now derived metrics and 6 requiring minor instrumentation.

7. **Deliberation capture** — 11 threads documented in `pre-v1.20-session-capture.md` covering signal/issue ontology, KB management, continental philosophy of memory, cross-model review formalization, cross-platform parity, and the workflow gap for informal research.

## How We Deliberated

### The progressive deepening insight

The user rejected the Apollo sensor's fixed heuristic approach (grep counts → thresholds → ±2 line context). The argument: "why else read the logs?" The value isn't in counting keywords — it's in finding moments where `/gsdr:signal` should have been invoked but wasn't. The sensor should read like a researcher, not scan like a lint tool. Each stage should be a decision point: "is this worth reading more?" This became the design for both the sensor spec and the audit methodology.

### The positive signal corrective

After the negative discovery pass (67 findings), the user identified systematic bias: the entire audit was framed around failure. The positive signal pass (98 findings) revealed that the system's success modes and failure modes aren't separate — positive patterns frequently emerged as direct responses to the failures. The strongest positive pattern (cross-model review) directly addresses the strongest negative pattern (quality gates being advisory). Formalization should build the system's capacity to catch and respond to its own failures, not add capabilities from scratch.

### The contamination experiment

When running model comparisons, the user caught that early prompts told agents they were being compared and gave them target finding counts. This contaminated the results. The user insisted on clean re-runs with identical prompts, and also requested a contaminated Sonnet run to measure the effect across model families. The result: GPT is more susceptible to framing than Sonnet (50% vs 18% inflation). This has practical implications for prompt hygiene in sensor design.

### The signal vs issue distinction

The user identified a gap no existing deliberation addresses: signals (observations) are distinct from issues (actionable problem statements synthesized from multiple signals). The pragmatist framing (Dewey): signals are indeterminate situations; issues are problematic situations that have been named, bounded, and made investigable. The user uses GitHub Issues because they have what the signal system lacks — triage routing, scoping decisions, actionable resolution paths. This is a design question for v1.20.

### The epistemological caution on metrics

When the telemetry survey revealed rich data sources (interruption counts, token usage, tool errors), the user pushed back on treating these as self-evident: "fewer interruptions doesn't necessarily mean the quality is better — there are many hypotheses that can explain that metric." Every metric in the survey now carries an epistemological caveat. The continental philosophy of memory (Stiegler, Ricoeur, Bergson, Derrida) was deferred as a research topic for when arxiv-sanity-mcp is operational — the user wants to ground KB architecture decisions in proper philosophical and empirical research.

### The workflow gap recognition

This session performed substantial pre-milestone research (telemetry survey, platform investigation) that doesn't fit any existing GSDR workflow. The user explicitly flagged this as a gap worth addressing: "mark this as a gap, this need, that our workflow doesn't properly handle." Captured as Thread 11 in the deliberation.

## Key Artifacts to Read

### Essential (read before scoping v1.20)

| Artifact | Path | What it contains |
|----------|------|------------------|
| **Opus negative synthesis** | `reports/opus-synthesis.md` | 42 unique findings, 8 thematic clusters, 23 recommendations across 5 tiers, cross-milestone roadmap implications, divergence analysis |
| **Opus positive synthesis** | `reports/positive-opus-synthesis.md` | 35 unique positive patterns, 8 clusters, 7 formalization recommendations, cross-platform review protocol design, relationship to negative findings |
| **Verification analysis A** | `reports/verification-analysis.md` | 13 RECURRED (failed interventions), 11 NEW, 17 KNOWN-UNADDRESSED. Key structural finding: every failed fix was advisory text, not structural enforcement |
| **Verification analysis B** | `reports/verification-analysis-b.md` | 8 RECURRED, 12 NEW, 22 KNOWN-UNADDRESSED, 20 PARTIALLY-ADDRESSED. Key finding: cross-runtime distribution gap explains why discuss-mode fix "recurred" |
| **Pre-v1.20 deliberation** | `.planning/deliberations/pre-v1.20-session-capture.md` | 11 deliberation threads from this session |
| **Telemetry survey** | `reports/telemetry-survey.md` | Complete data source inventory, derived metrics, open questions, spike candidates |

### Reference (for specific questions)

| Artifact | Path | What it contains |
|----------|------|------------------|
| GPT negative synthesis | `reports/gpt-xhigh-synthesis.md` | Alternative synthesis — compare with Opus for divergences |
| GPT positive synthesis | `reports/positive-gpt-xhigh-synthesis.md` | Alternative positive synthesis |
| Calibration report | `reports/calibration-report.md` | Proof-of-concept for progressive deepening, token cost estimates |
| Telemetry research (Claude) | `reports/telemetry-research-claude.md` | Effort persistence, undocumented dirs, hook payloads |
| Telemetry research (Codex) | `reports/telemetry-research-codex.md` | Per-turn granularity, pricing, config capture |
| Model comparison reports | `reports/discovery-agent-5{b,c,d,e}-report.md` | Clean runs for Assignment 5 comparison |
| 6 negative discovery reports | `reports/discovery-agent-{1-6}-report.md` | Raw findings per agent |
| 6 positive discovery reports | `reports/positive-signals-agent-{1-6}.md` | Raw positive patterns per agent |

### Also relevant (existing deliberations)

| Artifact | Path | Connection |
|----------|------|------------|
| Sensor expansion deliberation | `.planning/deliberations/sensor-expansion-and-harness-integration-gaps.md` | Open — 9 unregistered agents, candidate new sensors |
| Signal lifecycle gap | `.planning/deliberations/signal-lifecycle-closed-loop-gap.md` | Concluded — adopted reconciliation script never built |
| Pre-v1.19 session capture | `.planning/deliberations/pre-v1.19-session-capture.md` | 22 threads, many still relevant (especially 4, 11, 13, 14, 19) |
| Cross-runtime KB authority | `.planning/deliberations/cross-runtime-upgrade-install-and-kb-authority.md` | Open — Issue #17 |

## What the Evidence Suggests for v1.20

### The dominant finding

**Every failed intervention used advisory text, not structural enforcement.** 13 out of 59 verified findings recurred after supposed fixes. All 13 fixes were documentation changes or workflow prose updates. None implemented hooks, scripts, programmatic gates, or enforced workflow steps. The harness treats quality controls as agent-discretion opt-in.

### The dominant positive pattern

**Cross-model review is the most effective quality gate observed.** GPT-5.4 reviewing Claude's work caught systematic verifier optimism across 4 phases, spike framing bias, and methodology gaps that human+Claude review missed. GPT-5.4 is consistently stricter than Claude, catching secondary code paths Claude accepts as fixed. The user wants this formalized with a structured pushback protocol (accept / accept-with-nuance / dispute-with-evidence).

### Proposed v1.20 themes (grounded in evidence)

**Theme 1: Structural gate enforcement**
Replace advisory quality controls with enforced ones. Based on: 13 RECURRED findings, "quality gates are advisory" cluster (Opus synthesis Cluster 2), verification systematic optimism (Agents 1, 3).

**Theme 2: Signal system maturation**
KB authority hardening (Issue #17 subset), signal lifecycle automation (the adopted-but-never-built reconciliation script), signal-to-issue promotion mechanism. Based on: 0% remediation rate, KB scattered across machines, user using GitHub Issues as workaround.

**Theme 3: Sensor pipeline**
Log/chat sensor implementation (progressive deepening, already in source), token/efficiency sensor (telemetry survey shows data is available), positive signal detection. Based on: disabled log sensor stub, 165 findings from the audit validating the approach, undocumented `session-meta/` discovery.

**Theme 4: Cross-model review formalization**
`/gsdr:cross-model-review` command with committed audit spec, Codex CLI background launch, structured response protocol. Based on: strongest positive pattern across 5 of 6 agents, empirical model comparison data.

**Theme 5: Cross-platform parity**
Codex CLI operational knowledge, PID management, patch compatibility checking, cross-runtime distribution gap. Based on: 6+ attempt debugging loops, wrong process killed, patches applied without compatibility checks.

### What should wait for research

- Signal/issue ontology (how promotion works, KB vs GitHub integration)
- KB organization at scale (how to structure/prune/relate signals as they grow)
- Memory model grounded in continental philosophy (Stiegler, Ricoeur, Bergson, Derrida)
- Agentic memory systems literature survey (via arxiv-sanity-mcp)

### Quick fixes identified (high impact, low effort)

From the Opus synthesis, 7 quick fixes:
1. Merge default → `--merge` not `--squash` (5th recurrence of this deviation)
2. Signal lifecycle states → add "proposed", "delegated", "in-progress" to schema
3. Dev version hash → include git hash in +dev version for traceability
4. Decimal phase parser → fix edge cases in phase number parsing
5. Backup namespacing → prevent GSD/GSDR patch backup collisions
6. offer_next encoding → encode inter-phase PR/CI/merge requirements
7. Quick task branch detection → distinguish code changes from docs-only

## What Changed in Source

| File | Change |
|------|--------|
| `agents/gsd-log-sensor.md` | Full rewrite: disabled stub → progressive deepening design with 5-stage approach, audit mode, token usage metrics |

Installed locally via `node bin/install.js --local`. The `.claude/agents/gsdr-log-sensor.md` runtime copy is updated.

## How to Proceed

1. **Read the essential artifacts** listed above (especially the two synthesis reports and the verification analysis)
2. **`/gsdr:new-milestone`** — scope v1.20 with this document and the audit evidence as input
3. The 5 themes above are a starting sketch, not a prescription — the milestone workflow should validate and refine them against requirements
4. The telemetry survey's open questions (Section "Research Questions — Still Open") need deliberation, not just investigation — they may become a research phase within v1.20 or be deferred

## Forward Orientation: v1.21 and Beyond

This section captures what we're deferring from v1.20 and why, so future milestones can plan with awareness of what's coming. This is itself an instance of the future awareness pattern (Issue #36) we intend to implement.

### v1.21 Sketch: Automation & Research-Grounded Architecture

**Theme: "Making existing tools fire automatically" (originally planned for v1.20, deferred because sensor/signal infrastructure needed first)**

Items deferred from v1.20 that belong here:
- **Signal/issue ontology** — the pragmatist distinction between signals (observations) and issues (actionable problem statements). Requires deliberation informed by v1.20 experience with the improved signal system. How does promotion work? KB-native, GitHub integration, or both?
- **KB organization at scale** — how to structure, prune, relate, and re-read signals as the KB grows beyond 200+ entries per project. The current flat-file model with `related_signals` lists doesn't support the relational readings the user described.
- **Signal lifecycle automation at scale** — v1.20 builds the reconciliation script; v1.21 makes it fire automatically with quality gates.
- **Automation loop ungating** — the v1.17 automation framework has 0% fire rate. v1.21 should address quality gates for safe ungating (the "Stiegler gradient" — execution-safe vs judgment-dangerous automation).
- **Full Issue #17 completion** — cross-runtime upgrade/install drift hardening (9 acceptance criteria). v1.20 addresses the KB authority subset; v1.21 completes the runtime-neutral preflight/resolution path.
- **Deliberation lifecycle fixes** — 32 deliberations, 7 concluded, 0 evaluated. Predictions never checked. v1.21 should build deliberation lifecycle completion.

### v1.22+ Sketch: Research-Grounded KB Architecture

**Theme: "Memory as a philosophical and empirical design question"**

These items require proper research grounding and should not be designed without it:
- **Continental philosophy of memory** — how Stiegler (tertiary retention), Ricoeur (memory/history/forgetting), Bergson (habit vs pure memory), Derrida (archive structures what can be remembered) reshape KB architecture. Requires arxiv-sanity-mcp to be operational for literature survey.
- **Agentic memory systems literature** — what do the 47 findings from the epistemic-agency repo and the broader agentic AI literature say about how systems should remember? F21 (dual memory), F09 (contextual retrieval), F14 (knowledge graphs) are directly relevant.
- **Signal graph structure** — typed edges (analytical, thematic, causal, temporal) between signals, as described in pre-v1.19 Thread 19. Possibly integrates with philograph-mcp's knowledge graph approach.
- **Signal hermeneutics** — the user's framework from Thread 11/18: signals can be read multiple ways, the reading evolves as context accumulates, the KB should support re-reading as response. This is a deep architectural question that shouldn't be implemented without philosophical grounding.
- **Cross-project signal propagation** — the Apollo ↔ Dionysus bridge problem (Thread 13). 117+ signals on Apollo invisible from Dionysus. SyncThing broken. Need a propagation mechanism that preserves signal interpretability across contexts.

### How v1.20 Design Should Anticipate Future Work

These are constraints on v1.20 implementation — things we must NOT do because they'd close doors:

1. **Don't bake flat-file KB assumptions into the sensor pipeline.** The log sensor, token sensor, etc. should output signal candidates in a format that a future graph-based KB could consume. Don't assume signals are isolated documents.
2. **Don't hardcode single-machine paths.** KB authority work in v1.20 should use an abstraction layer that a future cross-machine bridge can extend, not direct `~/.gsd/knowledge/` reads.
3. **Don't merge signal and issue concepts prematurely.** v1.20 can add GitHub Issues integration (filing issues from signals), but shouldn't collapse the conceptual distinction — that requires the deliberation deferred to v1.21.
4. **Don't design the token sensor around current pricing.** Token usage tracking should capture raw counts and model identifiers; cost calculation should be a separate, swappable layer that can adapt as pricing changes.
5. **Don't formalize cross-model review as a rigid workflow.** The positive signal agents found it works partly *because* it's informal. v1.20 should add the command and infrastructure but keep the protocol flexible — over-formalization is a risk the Opus synthesis explicitly flagged.

## Session Statistics

- ~30 subagent launches (discovery, comparison, synthesis, verification, positive, research)
- ~48 files committed across 3 commits
- 2 machines, ~10 projects, 100 sessions analyzed
- Model comparison: 10 runs on same input, 4-way clean grid
- Artifacts: 32 reports + 6 prompts + 8 data files + 1 deliberation + 1 handoff
