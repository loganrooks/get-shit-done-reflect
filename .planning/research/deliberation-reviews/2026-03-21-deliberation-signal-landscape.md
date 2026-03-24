# Review: Signal Landscape Relevant to the Deliberation Constellation

**Date:** 2026-03-21
**Status:** Provisional
**Purpose:** Record the cross-knowledge-base signal field used to review the four active deliberations, so later roadmap discussion is grounded in recurring evidence rather than only in the deliberations' own arguments.

## 1. Knowledge bases reviewed

This survey looked at signals in:

- `get-shit-done-reflect/.planning/knowledge`
- `~/.gsd/knowledge/signals/get-shit-done-reflect`
- `arxiv-sanity-mcp/.planning/knowledge`
- `~/.gsd/knowledge/signals/arxiv-sanity-mcp`
- `epistemic-agency/.planning/knowledge`
- `~/.gsd/knowledge/signals/epistemic-agency`

Not every signal was equally relevant. The aim was to identify the recurring signal clusters that materially bear on the four deliberations under review.

## 2. Why these other projects matter

The four deliberations live in `get-shit-done-reflect`, but they were not generated in a vacuum:

- the spike and methodology concerns came from the `arxiv-sanity-mcp` spike program
- the cross-runtime, Codex, and orchestration questions were stress-tested later in `epistemic-agency`
- the global `~/.gsd/knowledge` store still contains project-scoped signals due to KB-authority drift

So a review that ignored those other KBs would miss part of the actual evidence chain.

## 3. Signal cluster A: Spike rigor, premature closure, and inquiry quality

### Strongest signals

- `sig-2026-03-19-spike-framework-scope-gap.md`
- `sig-2026-03-20-spike-experimental-design-rigor.md`
- `sig-2026-03-20-premature-spike-decisions.md`
- `2026-03-18-premature-spike002-closure.md`
- `2026-03-19-circular-evaluation-bias.md`
- `2026-03-19-gaps-not-proactively-identified.md`
- `2026-03-19-measuring-wrong-thing-filtering.md`
- `2026-03-19-untested-hypotheses-as-findings.md`
- `2026-02-11-premature-spiking-no-research-gate.md`
- `2026-02-11-spike-design-missing-feasibility.md`

### What this cluster supports

This cluster strongly supports the claim that the current spike workflow has a real inquiry-quality weakness, not only an isolated one-off execution mistake.

The recurring problems include:

- direct-to-design spiking without adequate research or feasibility checking
- weak pre-execution methodological challenge
- closure pressure even when the evidence base is too narrow
- metric substitution for actual evaluative understanding
- treating generated explanations as findings without sufficient falsification
- bounded spike form being a poor fit for multi-wave or campaign-shaped investigation

### What it does not yet prove

- that a brand-new subsystem is required
- that all spike work should be redesigned around the same pattern
- that template pressure is the dominant cause rather than one interacting cause among several

## 4. Signal cluster B: Deliberation, traceability, and routing gaps

### Strongest signals

- `2026-03-04-deliberation-skill-lacks-epistemic-verification.md`
- `2026-03-04-signal-lifecycle-representation-gap.md`
- `sig-2026-03-02-requirements-lack-motivation-traceability.md`
- `2026-03-06-planner-deliberation-auto-reference-gap.md`
- `sig-2026-03-20-deliberation-naming-convention.md`
- `2026-03-06-plan-verification-misses-architectural-gaps.md`

### What this cluster supports

This cluster strongly supports the claim that the framework's current artifact ecology is weak on:

- preserving how a judgment or shift in framing actually emerged
- linking motivations to requirements and plans
- surfacing relevant deliberations into planning without relying on human memory
- distinguishing observed reality from the framework's own stale or incomplete self-description

This is the signal basis for the forms/excess deliberation and for the deliberation-frontmatter/discovery work already underway.

### What it does not yet prove

- that sidecar artifacts are necessary rather than just stronger primary artifacts
- that every artifact type needs the same reflexive machinery

## 5. Signal cluster C: Cross-runtime authority, KB drift, and memory instability

### Strongest signals

- `sig-2026-03-20-cross-runtime-upgrade-install-and-kb-drift.md`
- `2026-02-11-local-install-global-kb-model.md`
- `sig-2026-03-17-no-platform-change-detection.md`
- `sig-2026-03-19-stale-platform-claims-in-source.md`
- `sig-2026-03-19-codex-model-profile-mapping-missing.md`
- `sig-2026-03-20-init-did-not-confirm-model-profile.md`

### What this cluster supports

This cluster supports the claim that even when the framework produces useful critical artifacts, the infrastructure for locating, migrating, and reusing them is still unstable across runtimes and installs.

That matters directly to the deliberations because:

- external critique cannot reliably enter planning if project memory is split across global and local stores
- cross-runtime parity is required if the same repo is meant to be workable from Claude and Codex
- any future community or deliberation pathway is weaker if the system cannot reliably decide where authoritative project memory lives

### What it does not yet prove

- that the authority problem should be solved before every other next-milestone concern

But it does suggest that community and deliberation-system design should not ignore runtime/storage authority.

## 6. Signal cluster D: Orchestration discipline and evaluation methodology in later Codex work

### Strongest signals

- `sig-2026-03-19-long-running-agent-monitoring-needed.md`
- `sig-2026-03-20-benchmark-comparison-needs-post-checker-plans.md`

### What this cluster supports

This cluster supports a narrower but still useful claim: when the framework is stressed under another runtime and with reasoning-level experiments, it still reproduces a familiar pattern of methodological slippage:

- comparing at the wrong checkpoint
- interpreting silence as failure too early
- confusing draft-stage quality with workflow-stage quality

This matters to the deliberation set because it shows the same general issue outside the arxiv spike context:

- the framework often needs better discipline about when judgments are made
- review gates matter
- process shape affects what counts as a valid finding

## 7. What the signal landscape currently supports about the four deliberations

### Strongly supported

- the spike deliberation's concern about premature closure and under-challenged inquiry
- the forms/excess deliberation's concern that artifacts often misrepresent or flatten the actual process
- the claim that deliberations need better metadata, discovery, and routing
- the claim that framework memory currently has unstable authority across installations and KB roots

### Moderately supported

- the responsibility/praxis deliberation's pressure toward stronger scope qualification and excluded-case awareness

This one is supported more indirectly. The signal field shows recurring harms from overreach and narrow evidence, but it does not independently prove the full philosophical framing.

### Weakly supported

- the community-feedback deliberation's more ambitious venue design implications

The signal field supports the claim that some critique currently only arrives through unusually rich dialogue. It does not yet support a strong conclusion about which public community pathways should be built.

## 8. Current constraints the roadmap should respect

If these signals are taken seriously, any roadmap response should currently preserve the following:

- do not treat the spike problem as only a template problem
- do not treat the artifact/trace problem as only a naming problem
- do not expand community intake before internal routing and memory authority are more reliable
- do not assume one runtime's workflow behavior generalizes to the others

## 9. Current provisional judgment

The signal field currently points toward this priority order:

1. Artifact/discovery/authority stability
2. Reflexive trace and qualification support
3. Spike challenge and qualified-outcome redesign
4. Community pathway design later, after the first three become more dependable

That ordering may change if new evidence appears, especially about actual community demand or about spike redesign working with thinner interventions than currently expected.
