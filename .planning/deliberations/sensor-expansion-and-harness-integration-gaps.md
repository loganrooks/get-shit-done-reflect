# Deliberation: Sensor Expansion & Harness Integration Gaps

<!--
Deliberation template grounded in:
- Dewey's inquiry cycle (situation → problematization → hypothesis → test → warranted assertion)
- Toulmin's argument structure (claim, grounds, warrant, rebuttal)
- Lakatos's progressive vs degenerating programme shifts
- Peirce's fallibilism (no conclusion is permanently settled)

Lifecycle: open → concluded → adopted → evaluated → superseded
-->

**Date:** 2026-03-29
**Status:** Open
**Trigger:** Post-signal-collection observation — after running 12 sensors across phases 49-54 (70 candidates → 47 persisted), user noticed sensors are absent from model profiles and questioned where else fork agent integration is lacking. Combined with: what additional sensors would strengthen the self-improvement feedback loop?
**Affects:** Signal collection pipeline, model profile system, feature manifest, agent registration, v1.19+ scope
**Related:**
- `.planning/deliberations/self-improvement-pipeline-design.md` (Concluded): Designed overall pipeline; cites `cybernetics/requisite-variety` — "Sensor variety must match problem variety"
- `.planning/deliberations/signal-lifecycle-closed-loop-gap.md` (Concluded): All signals stay "detected"; feedback loop doesn't close
- `.planning/deliberations/platform-change-monitoring.md` (Concluded): Two-layer change detection strategy
- `.planning/phases/54-sync-retrospective-governance/54-OUTSTANDING-CHANGES.md`: P1 recommendations: security.cjs, model-profiles.cjs reconciliation, begin-phase fix
- `.planning/phases/54-sync-retrospective-governance/54-FEATURE-OVERLAP.md`: Behind gaps: security, UAT debt, cross-phase regression, requirements coverage
- `.planning/phases/54-sync-retrospective-governance/54-RETROSPECTIVE.md`: 5 sync-round issues, automation inertia, progress telemetry staleness
- `~/workspace/projects/epistemic-agency/knowledge-base/INDEX.md`: 47 findings from 154 agentic AI papers — F09, F14, F16, F21, F35, F36, F40, I09 directly applicable
- `sig-2026-03-04-drop-a-file-sensor-extensibility-pattern` (notable): Drop-a-file sensor design validated
- `sig-2026-03-04-stale-log-sensor-spec-disabled-by-default-text` (minor): Log sensor known stale
- `sig-2026-03-26-model-alias-map-in-core-cjs-contains-stale` (notable): Stale upstream model IDs adopted as dead code
- `spk-2026-03-01-claude-code-session-log-location` (confirmed): Spike confirmed session log location but sensor never built
- philosophy: cybernetics/requisite-variety — Sensor variety must match problem variety
- philosophy: cybernetics/feedback-loops — Actuator must exist for sensor data to matter
- philosophy: praxis/theory-practice-unity — Theory and practice must inform each other

## Situation

The fork's signal pipeline has grown organically across milestones v1.15–v1.18. It now includes 3 active sensors (artifact, git, ci), 1 disabled sensor (log), a signal synthesizer, a reflector, and a spike runner — none of which are registered in the model profile system, the feature manifest, or the model-profiles.md documentation. This creates a shadow agent ecosystem operating outside the harness's governance.

Concretely:

**9 agents have specs but no model profile entry:**
- `gsd-artifact-sensor` — signal sensor (active)
- `gsd-git-sensor` — signal sensor (active)
- `gsd-ci-sensor` — signal sensor (active)
- `gsd-log-sensor` — signal sensor (disabled, pending spike)
- `gsd-signal-synthesizer` — KB writer
- `gsd-signal-collector` — superseded orchestrator
- `gsd-reflector` — pattern distillation
- `gsd-spike-runner` — experiment execution
- `gsd-advisor-researcher` — discuss-phase support (adopted Phase 52)

**3 phantom entries in core.cjs MODEL_PROFILES (no agent spec exists):**
- `gsd-ui-researcher`, `gsd-ui-checker`, `gsd-ui-auditor` — upstream agents never adopted into fork

**model-profiles.md (docs) is stale:**
- Missing the 3 `gsd-ui-*` entries that exist in core.cjs runtime

**feature-manifest.json has zero registered agents:**
- No agent registration mechanism exists at all

**collect-signals workflow says "derive from model_profile via model-profiles.md"** but since sensors aren't in the table, the orchestrator falls through to model inheritance — which caused the user to observe sensors potentially running on the wrong model tier.

**KB state:** 186 signals total after this session's collection. Nearly all remain in "detected" status per the signal-lifecycle deliberation. The pipeline is asymmetric: rich on detection, impoverished on consumption/response.

### Evidence Base

| Source | What it shows | Corroborated? | Signal ID |
|--------|--------------|---------------|-----------|
| `comm` diff: agents/*.md vs core.cjs MODEL_PROFILES | 9 agents missing from profile map | Yes (tool output verified) | informal |
| `comm` diff: core.cjs vs agents/*.md | 3 phantom entries (gsd-ui-*) with no specs | Yes (tool output verified) | informal |
| `comm` diff: model-profiles.md vs core.cjs | Docs missing 3 gsd-ui-* entries from runtime | Yes (tool output verified) | informal |
| feature-manifest.json parse | Zero agents registered in manifest | Yes (node parse returned 0) | informal |
| collect-signals.md line 24 | Workflow claims model derived from profiles table | Yes (read file) | informal |
| KB index count | 186 signals, nearly all "detected" status | Yes (grep count) | sig-2026-03-04 (lifecycle gap) |
| Signal collection session | Sensors ran without explicit model, user had to intervene | Yes (conversation) | informal |
| spike spk-2026-03-01 | Session log location confirmed but sensor never built | Yes (KB entry exists) | spk-2026-03-01 |

## Framing

**Core question:** The fork's self-improvement pipeline has structural integration gaps (9 unregistered agents, no model governance for sensors, empty feature manifest) and potential sensor coverage gaps. How do we close the harness integration debt, expand sensor coverage to match problem variety, and address the consumption asymmetry before adding more detection capacity?

**Sub-questions:**
1. **Integration debt**: What's the minimal fix to register all fork agents in model profiles + manifest?
2. **New sensors**: What additional sensors would strengthen the feedback loop?
3. **Architectural gap**: Is the current sensor→synthesizer→KB pipeline the right architecture, or does it need evolution?
4. **Consumption asymmetry**: The pipeline is currently asymmetric — rich detection (186 signals), impoverished response (nearly all "detected"). Should we invest in closing the loop (signal lifecycle transitions, automated remediation routing) before or alongside expanding sensor coverage?

**Adjacent questions:**
- Should model selection be per-agent-spec (declared in frontmatter) or centralized (model-profiles)?
- The "drop-a-file" sensor extensibility was validated — but extensibility without registration means sensors exist in a shadow system. How do we preserve extensibility while adding governance?
- What does "requisite variety" look like on the response side, not just the detection side?

## Analysis

### Option A: Integration-First — Fix Registration Before Expanding

- **Claim:** Close the 9-agent registration gap, add sensors to model profiles with sonnet-tier defaults, clean up phantom entries, and update docs before adding any new sensors.
- **Grounds:** The current state means model selection is ungoverned for ~40% of fork agents. The user had to manually intervene to set sensor models during this session. The feature manifest has zero entries despite being the declared "agent registration system." Three phantom gsd-ui-* entries create confusion about what actually exists.
- **Warrant:** Adding more sensors to a system that doesn't properly govern existing ones increases the shadow agent surface. Integration debt compounds — each new sensor added without registration makes the next cleanup harder.
- **Rebuttal:** This is pure housekeeping with no new capability. If the harness integration is mechanical (just adding table rows), it could be done as a quick task rather than blocking sensor development.
- **Qualifier:** Certainly needed; question is whether it blocks other work or runs in parallel.

### Option B: Sensor Expansion — Add High-Value Sensors Now

- **Claim:** Build 2-3 new sensors targeting the highest-value gaps: test regression detection, validation coverage probe, and session log analysis. Register all agents (old + new) in model profiles as part of the expansion.
- **Grounds:** The self-improvement pipeline deliberation cited requisite variety. Current sensors cover artifacts and git history but miss: test regressions between phases, validation coverage drift, and session-level execution patterns. The log sensor spike (`spk-2026-03-01`) already confirmed log location but the sensor was never built. Phase 54 identified security hardening as a blind spot — a security-focused sensor could detect dependency vulnerabilities and unsafe patterns.
- **Warrant:** The pipeline's value comes from what it detects. Housekeeping alone adds no detection capability. The best time to add registration is when adding the agents that need it.
- **Rebuttal:** More sensors produce more signals into a pipeline that already has 186 unprocessed signals. Without consumption-side investment, new sensors add noise without closing any loops.
- **Qualifier:** Probably the right medium-term investment, but needs consumption-side work to realize full value.

**Candidate new sensors:**

| Sensor | What it detects | Value | Complexity |
|--------|----------------|-------|------------|
| **test-regression** | Test count decreases, new failures between phases | High — catches quality regression before it compounds | Medium — needs baseline tracking |
| **validation-coverage** | Plans/phases missing verification, low verification scores | High — enforces the "verify what you build" loop | Low — reads existing VERIFICATION.md files |
| **session-log** | Execution patterns, tool call frequency, context bloat, error rates | High — only sensor that sees *how* the agent actually works | High — spike done but sensor unbuilt |
| **security** | Dependency vulnerabilities, unsafe patterns, credential exposure | Medium — Phase 54 identified as blind spot | Medium — integrates with npm audit/similar |
| **plan-accuracy** | Systematic comparison of PLAN.md vs SUMMARY.md file lists, task counts, duration estimates | High — multiple signals this session flagged plan inaccuracy as recurring | Low — structured diff of existing artifacts |
| **upstream-drift** | Detects when upstream moves past our baseline freeze | Medium — Phase 48.1 drift ledger went stale in 4 days | Medium — needs git remote comparison |

### Option C: Consumption-First — Fix the Response Side Before Adding Detection

- **Claim:** Invest in signal lifecycle transitions (detected → triaged → remediated → evaluated), automated remediation routing, and signal-to-action pipelines before adding any new sensors.
- **Grounds:** 186 signals in "detected" state means the system's self-model has diverged from reality. The signal-lifecycle deliberation identified this but the intervention was partial. Adding sensors increases detection volume into a pipeline that doesn't process what it already has.
- **Warrant:** Per cybernetics: a sensor without an actuator is just a thermometer. The feedback loop requires both sensing AND response. The asymmetry means we're measuring the system's health without acting on the measurements.
- **Rebuttal:** The lifecycle gap is a design problem, not a volume problem. Even with 10 signals the loop wouldn't close. The consumption-side fix is independent of sensor count and can proceed in parallel.
- **Qualifier:** Probably the deepest structural issue, but may be too large to block near-term improvements.

### Option D: Parallel Tracks — Integration + Targeted Sensors + Lifecycle Fix

- **Claim:** Run three parallel workstreams: (1) mechanical registration of all agents in model profiles + manifest (quick task), (2) build 2 highest-value sensors (plan-accuracy and test-regression), and (3) design signal lifecycle transitions as a deliberation leading to a future phase.
- **Grounds:** The three problems are loosely coupled. Registration is mechanical housekeeping. New sensors have immediate value. Lifecycle is a deeper design question that benefits from deliberation before implementation.
- **Warrant:** Parallelizing independent workstreams is a core GSD pattern. The integration fix enables proper model governance for the new sensors. The lifecycle deliberation seeds v1.19 scope without blocking near-term value.
- **Rebuttal:** Parallel tracks increase coordination overhead. The lifecycle deliberation might change what sensors are worth building (if the response side needs different detection patterns than the ones proposed).
- **Qualifier:** Presumably the most pragmatic approach, but depends on available capacity.

## Tensions

1. **Detection vs consumption asymmetry**: More sensors → more signals → more unprocessed backlog. But the pipeline's value comes from detection, and consumption-side fixes are independent of sensor count.

2. **Extensibility vs governance**: The "drop-a-file" design makes adding sensors trivial — but that very ease means sensors proliferate without model profiles, manifest registration, or documentation. Governance adds friction to a deliberately frictionless system.

3. **Centralized vs decentralized model selection**: Should sensor model selection live in the central model-profiles table (consistent with other agents) or in the sensor's own frontmatter (closer to the sensor's self-description)? The user's correction during this session suggests centralized governance is expected.

4. **Integration debt as blocking vs parallel**: Registration is mechanical but touches core.cjs (upstream file rule: "never modify directly") and model-profiles.md (reference doc). The question is whether this is a quick task or needs plan-level coordination.

## Recommendation

**Current leaning:** Option D (Parallel Tracks), with this prioritization:

1. **Immediate (quick task):** Register all 9 fork agents in MODEL_PROFILES (core.cjs) and model-profiles.md. Clean up 3 phantom gsd-ui-* entries. Sensor tier: sonnet across all profiles (per user's explicit preference — Opus is overkill for sensor work). Reflector/synthesizer: sonnet for quality, sonnet for balanced, haiku for budget. Spike-runner: sonnet/sonnet/haiku (follows researcher pattern).

2. **Near-term (v1.19 phase):** Build plan-accuracy sensor (lowest complexity, highest signal count this session) and test-regression sensor (catches quality drift). Register both in model profiles at creation time.

3. **Design track (deliberation → v1.19 scope):** Signal lifecycle transitions — how signals move from detected → triaged → remediated → evaluated. This is the consumption-side fix that makes the whole pipeline progressive rather than just accumulative.

### Option E: Research-Informed Harness Evolution (Revised Recommendation)

- **Claim:** v1.19 should be research-informed, not just a sync cycle. Begin with a pre-milestone research phase using arxiv-sanity-mcp and the epistemic-agency knowledge base to identify harness design patterns from the literature, then scope the milestone to address: (1) upstream sync of convergent features (model-profiles.cjs, security.cjs, cross-phase regression gate), (2) harness infrastructure (token/efficiency capture, quality gates for automation, agent registration), (3) fork-only sensors (plan-accuracy, token-efficiency), and (4) v1.18 retrospective issues (scope revision protocol, PR workflow enforcement, automation ungating).
- **Grounds:**
  - The epistemic-agency repo has 47 findings from 154 papers on agentic systems, several directly applicable:
    - F09: Gated behavior trees from logs outperform unconstrained generation → quality gates before ungating
    - F14: Failure-driven curriculum targets knowledge frontiers → sensors should detect *where we fail*
    - F16: Three nested loops (reactive/deliberative/meta-learning) → our meta-learning loop is weak
    - F21: Dual memory (operational + lesson) prevents error cycles → lessons are underused in our KB
    - F35: Verification quality dominates generation quality → invest in verification infra
    - F36: Evaluation infrastructure needs its own testing → our sensors have no tests
    - F40: Confidence-efficiency correlation (fewer tool calls = more accurate) → token sensor value
    - I09: Variety Amplification × Hallucination Barrier → human-in-loop is architecturally necessary, not pragmatically convenient
  - Phase 54 OUTSTANDING-CHANGES recommends security.cjs (P1), model-profiles.cjs reconciliation (P1), begin-phase fix (P1), and cross-phase regression gate (P2)
  - Phase 54 RETROSPECTIVE identifies 5 sync-round issues needing future attention (scope revision protocol, squash merge policy, PR workflow enforcement, deliberation consumption tracking, quick task sprawl threshold)
  - The fork's automation is entirely inert: signal collection 0 fires/6 skips, reflection disabled, all 186 signals stuck in "detected"
  - No token/efficiency tracking exists despite SUMMARY.md and task results containing usage data
- **Warrant:** A sync-only milestone would address upstream convergence but miss the deeper harness evolution opportunity. The epistemic-agency findings suggest specific architectural patterns (gated behavior trees, failure-driven curriculum, three-loop architecture) that could transform the fork's self-improvement pipeline from accumulative (more signals) to progressive (better learning). Research-first ensures the milestone is designed rather than reactive.
- **Rebuttal:** Research adds lead time before implementation begins. The upstream sync items are concrete and ready now. Over-designing from literature risks building theoretical machinery that doesn't match the fork's practical needs. The epistemic-agency findings are from general agentic systems research, not specifically about development harnesses.
- **Qualifier:** Probably the most progressive approach if the research phase is kept focused (1-2 sessions, not a multi-week survey). The risk of over-engineering is real and should be guarded against by scoping research questions narrowly.

**Resolved questions:**
1. Sensor model tier: **Sonnet for all sensors across all profiles** (user confirmed — opus is overkill for sensor work)
2. Token/efficiency sensor: **High priority** — provides feedback on process efficiency, enables data-driven model selection, supports quality gates for automation
3. Automation: **Needs quality gates before ungating** — don't just raise the level, ensure automated actions produce verified-quality output
4. Research phase: **Pre-milestone research using arxiv-sanity-mcp + epistemic-agency KB** to identify harness design patterns before scoping v1.19

**Open questions blocking conclusion:**
1. Should the research phase be a formal GSD research phase (with RESEARCH.md output) or lighter-weight (deliberation-scoped)?
2. How many of the 5 retrospective issues should be v1.19 scope vs deferred?
3. What is the right balance between upstream sync work and fork-original harness evolution?

## Predictions

<!--
Predictions make the deliberation falsifiable (Lakatos). If adopted, what should we
observe? If we don't observe it, the deliberation's reasoning was flawed.
Record predictions BEFORE implementation so they can't be retrofitted.
-->

**If adopted, we predict:**

| ID | Prediction | Observable by | Falsified if |
|----|-----------|---------------|-------------|
| P1 | Registering sensors in model profiles eliminates the need for manual model intervention during signal collection | Next /gsdr:collect-signals run | User still has to manually specify model for sensors |
| P2 | A plan-accuracy sensor would have auto-detected ≥60% of the "files_modified mismatch" signals we collected manually this session | Retrospective analysis of phases 49-54 | Fewer than 5 of the ~8 plan-accuracy signals would have been caught |
| P3 | Adding 2 new sensors without lifecycle fixes increases KB signal count >220 within 2 milestones but "detected" percentage stays >90% | After v1.19 completion | Signal count stays below 220 OR detected percentage drops below 90% |
| P4 | The phantom gsd-ui-* entries in MODEL_PROFILES cause no runtime errors because no workflow spawns agents with those names | Grep for gsd-ui spawning in all workflows | Any workflow or orchestrator references gsd-ui-researcher/checker/auditor |
| P5 | A token/efficiency sensor capturing usage blocks from task results reveals >2x cost difference between opus and sonnet for equivalent sensor output quality | First collection run with both models tracked | Cost difference is <1.5x OR sonnet quality is measurably worse |
| P6 | Pre-milestone research using epistemic-agency findings produces ≥3 concrete harness design changes that would not have been identified from upstream sync alone | Research phase completion | All proposed changes are things we would have identified anyway from upstream analysis |
| P7 | Adding quality gates to automation (signal quality check, efficiency check) enables safe ungating to level 2+ within 1 milestone | After quality gates implemented | Automation still stuck at level 1 OR auto-actions produce low-quality output requiring rollback |

## Decision Record

<!--
Filled when status moves to `concluded` or `adopted`.
-->

**Decision:** Pending
**Decided:** —
**Implemented via:** —
**Signals addressed:** —

## Evaluation

<!--
Filled when status moves to `evaluated`.
-->

**Evaluated:** —
**Evaluation method:** —

| Prediction | Outcome | Match? | Explanation |
|-----------|---------|--------|-------------|

**Was this progressive or degenerating?** (Lakatos)
—

**Lessons for future deliberations:**
—

## Supersession

**Superseded by:** —
**Reason:** —
