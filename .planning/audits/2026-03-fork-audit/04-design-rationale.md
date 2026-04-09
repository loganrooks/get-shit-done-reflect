# Design Rationale & Decision Records

> Agent: Internal Docs Analysis | Source: deliberations, ADRs, spikes, strategy docs

---

## 1. Core Fork Thesis: The Automation Problem

**What the fork adds:** A complete self-improvement loop that detects problems, triages them, fixes them, verifies the fixes work, and learns from the process.

```
Upstream GSD: Plan → Execute → Done
Fork adds:   Detect (signals) → Triage → Remediate → Verify → Learn
```

**Key documents:**
- `.planning/deliberations/v1.16-signal-lifecycle-and-beyond.md` — Original milestone framing
- `.planning/deliberations/v1.17-plus-roadmap-deliberation.md` — The 5-milestone vision (M-A through M-E)
- `.planning/PROJECT.md` — Value statement: "The system never makes the same mistake twice"

---

## 2. Architectural Decisions (Chronological)

### A. Signals (v1.12) — Detection Foundation

**Why:** Capture workflow problems as structured data.

- Markdown files with YAML frontmatter (detection method, severity, pattern, evidence)
- Multi-sensor collection: artifact, git, CI, logs
- Mirrors GSD's multi-agent pattern

### B. Signal Lifecycle (v1.16) — Closed-Loop Remediation

**Why:** Signals must progress through states, not just accumulate.

**Critical deliberation:** `signal-lifecycle-closed-loop-gap.md`
- **Problem discovered:** All 127 signals remained in "detected" state despite fixes
- **Root cause:** Lifecycle transitions were "agent instructions" — agents skip steps under context pressure
- **Solution:** Programmatic hooks/scripts (deterministic) replace agent instructions (unreliable)
- **Schema:** `lifecycle_state: [detected | triaged | remediated | verified | invalidated]`

### C. Reflection (v1.16) — Pattern Detection with Epistemic Rigor

**Why:** Raw signal accumulation is noise; need distilled lessons with tracked confidence.

- Confidence-weighted pattern detection (critical=1.0, notable=0.3, minor=0.1)
- Counter-evidence seeking before proposing lessons
- Tiered validation (confidence earned through corroboration, never starting high)
- Per `reflection-output-ontology.md`: Lessons are outputs with confidence, not certainties

### D. Automation Loop (v1.17) — Self-Triggering

**Why:** Manual invocation of feedback loop commands defeats the purpose.

- 4-level system: manual (0) / nudge (1) / prompt (2) / auto (3)
- Per-feature overrides + context-aware deferral
- Trigger points: post-phase (signals), session-start (health), threshold (reflection)

### E. Health Scoring (v1.17) — Meta-Observability

**Why:** System needs to measure its own state.

**Decision document:** `health-check-maintainability.md` → Option C: Hybrid Probe Architecture

- Infrastructure Health: binary aggregate (HEALTHY / DEGRADED / UNHEALTHY)
- Workflow Health: continuous metrics from signals (density, resolution ratio)
- **Key principle:** "Scores as attention guides, not decision gates"
- Standing caveat: "Absence of findings does not mean absence of problems"

---

## 3. Philosophical Foundations (18 Frameworks)

Located in `.planning/deliberations/philosophy/`

| Framework | Core Question | Fork Application |
|-----------|--------------|-----------------|
| **Popper (Falsificationism)** | How do we test improvements? | Predictions before implementation; passive verification-by-absence |
| **Dewey (Pragmatism)** | When does a lesson stop being warranted? | Corroboration earns confidence; confidence never starts high |
| **Lakatos (Research Programs)** | Is program progressive or degenerating? | Monitor whether improvements create more problems |
| **Cybernetics (Ashby, von Foerster)** | Self-observation effects? | Health scores guide attention, don't create mechanical authority |
| **Hegel (Dialectics)** | How do improvements create contradictions? | Each fix generates new problems (determination-negation); tracked explicitly |
| **Toulmin (Argumentation)** | What makes arguments well-formed? | Deliberations state claim + grounds + warrant + rebuttal |
| **Habermas (Discourse Ethics)** | When is automated deliberation legitimate? | Multi-agent debate capped at advisory level (simulation, not discourse) |
| **Gadamer (Hermeneutics)** | Understanding across contexts? | Cross-project lesson surfacing = hermeneutic fusion of horizons |
| **Aristotle (Phronesis)** | Limits of formalizing judgment? | Thresholds start conservative; phronesis not techne |
| **Cartwright (Capacities)** | Are lessons universal laws? | Lessons are scope-conditional capacity statements |

**Meta-principle from `deliberation-system-design.md`:**
> "Deliberation should be a structured convention, not an automated multi-agent process... The human does the actual deliberating."

---

## 4. Spike Results (Empirical Decisions)

| Spike | Hypothesis | Outcome |
|-------|-----------|---------|
| Signal lifecycle hooks | Can programmatic hooks reliably transition signal states? | Confirmed — deterministic vs agent instructions |
| KB migration paths | Can KB migrate safely between directory structures? | Confirmed — backup+verify+symlink approach |
| Namespace isolation | Can fork co-exist with upstream GSD? | Confirmed — 4-pass rewrite system |

---

## 5. Documented Trade-Offs

| Decision | Cost | Benefit |
|----------|------|---------|
| Advisory thresholds | User calibration needed | No false-positive automation; respects phronesis |
| Multi-sensor architecture | Coordination complexity | Extensible (new sensor = new file) |
| File-based KB | Less performant at scale | Zero-dep; VCS-auditable; matches GSD philosophy |
| Project-local KB | Breaks cross-project learning by default | Solves remote execution; knowledge versioned with code |
| Programmatic state transitions | More code to maintain | Deterministic; doesn't depend on agent behavior |
| Tracked modifications (not additive-only) | More merge complexity | Enables branding, features, deeper integration |
| 4-level automation + per-feature overrides | Complex config surface | Handles full spectrum (manual ↔ auto) |

---

## 6. Fork Maintenance Strategy

**Key documents:** FORK-STRATEGY.md, FORK-DIVERGENCES.md

**Merge stance strategy:**
- Identity files (README, CHANGELOG): Fork wins
- Templates/configs (config.json): Hybrid merge
- Command specs: Adopt upstream thin stub + fork novelty
- Runtime (gsd-tools.js): Keep fork additions (additive, non-overlapping)

**v1.18.0 sync validated this strategy:** 8 conflicts, all resolved cleanly using these stances.

---

## 7. Recommended Reading Order

1. `.planning/FORK-STRATEGY.md` — Fork maintenance philosophy
2. `.planning/deliberations/v1.17-plus-roadmap-deliberation.md` — 5-milestone vision
3. `.planning/deliberations/signal-lifecycle-closed-loop-gap.md` — Agent reliability gap
4. `.planning/deliberations/health-check-maintainability.md` — Probe architecture
5. `.planning/deliberations/deliberation-system-design.md` — Human-led deliberation
6. `.planning/deliberations/philosophy/INDEX.md` — Philosophical framework index
