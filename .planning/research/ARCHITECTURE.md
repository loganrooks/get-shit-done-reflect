# Architecture Research: Signal Lifecycle & Reflection Integration

**Domain:** Multi-agent signal lifecycle, enhanced reflection, lightweight spikes, epistemic rigor
**Researched:** 2026-02-27
**Confidence:** HIGH (analysis of existing codebase architecture -- all components read and mapped)

## System Overview: Current Architecture

```
                      COMMAND LAYER (thin orchestrators)
┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ /gsd:collect-  │  │ /gsd:reflect   │  │ /gsd:spike     │  │ /gsd:signal    │
│   signals      │  │                │  │                │  │   (manual)     │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │                   │
        v                   v                   v                   │
                    WORKFLOW LAYER                                   │
┌────────────────┐  ┌────────────────┐  ┌────────────────┐          │
│ collect-       │  │ reflect.md     │  │ run-spike.md   │          │
│   signals.md   │  │                │  │                │          │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘          │
        │                   │                   │                   │
        v                   v                   v                   v
                     AGENT LAYER                                  (inline)
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ gsd-signal-    │  │ gsd-reflector  │  │ gsd-spike-     │
│   collector    │  │                │  │   runner       │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        v                   v                   v
                    KNOWLEDGE STORE
┌─────────────────────────────────────────────────────────┐
│  ~/.gsd/knowledge/                                      │
│  ├── signals/{project}/         (YAML frontmatter .md)  │
│  ├── spikes/{project}/                                  │
│  ├── lessons/{category}/                                │
│  └── index.md                   (auto-generated)        │
└─────────────────────────────────────────────────────────┘
```

### Current Single-Sensor Signal Flow

```
/gsd:collect-signals {phase}
    │
    ├── validate phase directory
    ├── locate PLAN.md + SUMMARY.md + VERIFICATION.md artifacts
    ├── read .planning/config.json
    │
    └── Task(gsd-signal-collector)
         │
         ├── Step 1: Load phase artifacts
         ├── Step 2: Load configuration
         ├── Step 3: Detect signals (3 detection types)
         │    ├── 3a: Deviation detection (PLAN vs SUMMARY)
         │    ├── 3b: Config mismatch detection
         │    └── 3c: Struggle detection
         ├── Step 4: Classify (severity, polarity, source)
         ├── Step 5: Filter trace signals
         ├── Step 6: Dedup check
         ├── Step 7: Cap check (10 per phase per project)
         ├── Step 8: Write signals to KB
         ├── Step 9: Rebuild index
         └── Step 10: Report
```

**Key constraint:** The signal collector agent is a single Task() spawn. All detection happens in one agent context. This limits what can be detected (only PLAN/SUMMARY/VERIFICATION artifacts and config.json).

---

## Target Architecture: Multi-Sensor Signal Collection

### Design Decision: Parallel Sensor Pattern

Use the same parallel agent pattern as `/gsd:map-codebase`, which spawns 4 `gsd-codebase-mapper` agents with `run_in_background=true`. The collect-signals workflow becomes a multi-sensor orchestrator that spawns specialized sensor agents in parallel, then a synthesizer agent for dedup and correlation.

**Why this pattern:** It is already proven in the codebase (map-codebase), keeps orchestrator context lean (~10-15%), gives each sensor fresh context for its detection domain, and naturally supports adding new sensors later.

### Target System Diagram

```
/gsd:collect-signals {phase}
    │
    ├── validate phase, locate artifacts (unchanged)
    ├── read config including sensor settings
    │
    ├── PARALLEL SENSOR SPAWN ─────────────────────────────────────────┐
    │                                                                   │
    │   Task(artifact-sensor)      Task(git-sensor)    Task(log-sensor) │
    │   ┌──────────────────┐      ┌──────────────┐   ┌──────────────┐  │
    │   │ PLAN vs SUMMARY  │      │ commit churn  │   │ conversation │  │
    │   │ VERIFICATION     │      │ fix-fix-fix   │   │ patterns     │  │
    │   │ config mismatch  │      │ scope creep   │   │ interrupts   │  │
    │   │ (today's agent)  │      │ revert freq   │   │ undetected   │  │
    │   └───────┬──────────┘      └──────┬───────┘   └──────┬───────┘  │
    │           │                        │                  │           │
    │           ├── raw signals ─────────┤──────────────────┤           │
    │           v                        v                  v           │
    │   ┌──────────────────────────────────────────────────────────┐    │
    │   │              signal-synthesizer agent                    │    │
    │   │                                                          │    │
    │   │  1. Merge raw signals from all sensors                   │    │
    │   │  2. Cross-sensor dedup (same root cause, different view) │    │
    │   │  3. Cross-sensor correlation (git churn + artifact dev)  │    │
    │   │  4. Apply severity, polarity, source tracking            │    │
    │   │  5. Cap enforcement                                      │    │
    │   │  6. Write final signals to KB                            │    │
    │   │  7. Rebuild index                                        │    │
    │   └──────────────────────────────────────────────────────────┘    │
    │                                                                   │
    └───────────────────────────────────────────────────────────────────┘
    │
    └── Present results (unchanged format)
```

### Component Responsibilities

| Component | Responsibility | New vs Modified | Integration Point |
|-----------|---------------|-----------------|-------------------|
| `collect-signals.md` (workflow) | Orchestrate parallel sensors, pass raw signals to synthesizer | **Modified** -- major rewrite of spawn logic | Replaces single Task(gsd-signal-collector) with parallel spawns |
| `gsd-artifact-sensor.md` (agent) | **NEW** -- PLAN vs SUMMARY, VERIFICATION, config mismatch detection | **New** agent | Extracted from current gsd-signal-collector Steps 3a-3c |
| `gsd-git-sensor.md` (agent) | **NEW** -- git log analysis, commit churn, fix patterns, scope creep | **New** agent | Reads git log for phase commit range |
| `gsd-log-sensor.md` (agent) | **NEW** -- conversation/session log pattern detection | **New** agent | Reads Claude Code session logs (if accessible) |
| `gsd-signal-synthesizer.md` (agent) | **NEW** -- dedup, merge, correlation, write to KB | **New** agent | Receives raw signals from all sensors, writes final signals |
| `gsd-signal-collector.md` (agent) | **Deprecated** -- replaced by artifact-sensor + synthesizer | **Removed** | Functionality split across new agents |
| `signal-detection.md` (reference) | Detection rules shared by sensors | **Modified** -- add git/log detection rules, epistemic fields | Sensors reference it for rules |
| `collect-signals.md` (command) | Thin orchestrator, unchanged pattern | **Minor modification** -- sensor config parsing | Passes sensor config to workflow |

### Sensor Architecture: Shared Conventions

Each sensor agent follows a common contract:

**Input:** Phase context (phase directory, project name, config) + sensor-specific data sources

**Output:** Array of raw signal candidates in a standard intermediate format:

```yaml
# Raw signal candidate (sensor output, NOT final KB format)
- detection_id: "artifact-dev-01"
  sensor: artifact
  signal_type: deviation
  severity_suggestion: notable
  polarity_suggestion: negative
  confidence: medium
  confidence_basis: "3 tasks planned, 4 executed -- clear count mismatch"
  evidence:
    supporting: ["PLAN.md lists 3 <task> elements", "SUMMARY.md shows 4 task commits"]
    counter: ["Extra task may be an auto-fix, not a true deviation"]
  description: "Task count mismatch: planned 3, executed 4"
  context: "Phase 05, Plan 02"
  tags_suggestion: [deviation, task-count]
```

**Critical epistemic rigor requirement:** Every raw signal candidate MUST include `confidence`, `confidence_basis`, and both `evidence.supporting` and `evidence.counter`. This is a structural schema requirement, not advisory. The synthesizer rejects candidates missing these fields.

### Sensor Agent Specifications

#### Artifact Sensor (extracted from current gsd-signal-collector)

**Source files:** PLAN.md, SUMMARY.md, VERIFICATION.md, config.json
**Detection types:** SGNL-01 (deviation), SGNL-02 (config mismatch), SGNL-03 (struggle)
**What changes from current agent:** Emits raw candidates instead of writing to KB. Does not perform dedup, cap, or index rebuild. Adds epistemic fields (confidence, counter-evidence) to each candidate.

#### Git Sensor (new)

**Source files:** `git log`, `git diff --stat`, commit messages for the phase
**Detection types:**
- **Fix-fix-fix pattern:** 3+ consecutive fix commits on the same file or feature (signals struggle)
- **Scope creep:** Files modified that aren't in PLAN.md `files_modified` (signals deviation)
- **Churn detection:** Files with >3 modifications in a phase (signals instability)
- **Revert frequency:** `git revert` or `Revert:` commit messages (signals quality issues)
- **Positive patterns:** Clean single-pass commits, consistent naming (positive signals)

**Key design consideration:** The git sensor needs the commit range for the phase. The orchestrator should pass the first and last commit hashes from SUMMARY.md task commit tables, or the sensor can derive them from git log grep on `{phase}-{plan}` patterns.

#### Log Sensor (new -- requires investigation)

**Source files:** Claude Code session logs (location TBD)
**Detection types:**
- Repeated retry patterns (same command run 3+ times)
- Long gaps between actions (stalled/stuck indicator)
- Conversation interruptions (context window exhaustion)
- Undetected issues (errors in output that weren't flagged by the user or agent)

**CRITICAL CAVEAT -- LOW CONFIDENCE:** The log sensor depends on Claude Code session log accessibility. As of this research, the exact location and format of Claude Code session logs has not been verified. The deliberation document flags this as a spike candidate. If logs are inaccessible, this sensor should be **deferred** to a future milestone with a stub agent that reports "log analysis unavailable in this runtime."

**Recommendation:** Build the sensor framework to support log analysis, but ship this sensor as `"enabled": false` in default config. Make it a spike question before implementation.

#### Metrics Sensor (future -- stub only)

**Source files:** Token usage data, session counts (when available)
**Status:** Not implemented in v1.16. The sensor architecture should support adding it later. Ship as `"enabled": false` in config.

### Sensor Configuration Integration

Add to feature-manifest.json:

```json
{
  "signal_collection": {
    "scope": "project",
    "introduced": "1.16.0",
    "config_key": "signal_collection",
    "schema": {
      "sensors": {
        "type": "object",
        "default": {
          "artifact": { "enabled": true, "model": "auto" },
          "git": { "enabled": true, "model": "auto" },
          "log": { "enabled": false, "model": "auto" },
          "metrics": { "enabled": false }
        },
        "description": "Sensor configuration for signal collection"
      }
    }
  }
}
```

The orchestrator reads `signal_collection.sensors` from config and only spawns enabled sensors. Model "auto" uses the configured model for the current profile. Specific model overrides allow cost optimization (e.g., git analysis doesn't need opus).

---

## Signal Schema Extensions: Lifecycle Metadata

### Design Decision: Relaxed Immutability

The current knowledge-store.md spec says signals are immutable after creation (except `status: archived` for cap management). v1.16 must relax this: detection data stays frozen, but lifecycle fields (triage, remediation, verification) are mutable.

**Approach: Additive field extension with lifecycle fields.** Existing signals without lifecycle fields remain valid. New signals include them. Lifecycle updates modify ONLY the lifecycle fields, never the detection payload.

### Extended Signal Schema

```yaml
---
# === DETECTION PAYLOAD (immutable after creation) ===
id: sig-2026-02-27-installer-path-bug
type: signal
project: get-shit-done-reflect
tags: [installer, path-conversion, dual-directory]
created: 2026-02-27T14:30:00Z
durability: convention
severity: critical
signal_type: deviation
phase: 31
plan: 2
polarity: negative
source:
  sensor: artifact          # NEW: which sensor detected this
  evidence:                 # NEW: detection evidence (epistemic rigor)
    supporting:
      - "PLAN.md specifies 35 path conversions"
      - "SUMMARY.md reports only 32 conversions applied"
    counter:
      - "3 missing conversions may be in files not modified by this plan"
    confidence: high
    confidence_basis: "Diff confirms 3 specific files lack conversion"
occurrence_count: 3
related_signals: [sig-2026-02-20-path-conversion-miss, sig-2026-02-15-installer-gap]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0

# === LIFECYCLE FIELDS (mutable, updated as signal progresses) ===
updated: 2026-02-27T16:00:00Z    # existing field, now updated on lifecycle changes
status: active                    # existing field, expanded states below

# Triage (NEW)
triage:
  decision: address               # address | defer | dismiss | investigate | needs-data
  rationale: "3rd recurrence of path conversion issue, systemic root cause"
  by: reflect                     # human | reflect
  at: 2026-02-27T15:00:00Z

# Remediation tracking (NEW)
remediation:
  ref:
    milestone: v1.16
    phase: 31
    plan: 2
    commit: abc123
  approach: "Refactor replacePathsInContent() to use glob pattern matching"
  expected_outcome: "All path conversions apply to all files in source directories"
  status: completed               # planned | in-progress | completed | failed

# Verification (NEW)
verification:
  status: confirmed               # pending | confirmed | failed | inconclusive
  method: absence-of-recurrence   # manual | automated | absence-of-recurrence
  at: 2026-02-28T10:00:00Z
  evidence_for:
    - "Phase 32 collect-signals found zero path conversion signals"
    - "npm pack includes all expected files"
  evidence_against:
    - "Only 1 phase tested post-fix -- may recur in edge cases"

# Recurrence tracking (NEW)
recurrence_of: sig-2026-02-15-installer-gap
previous_remediations:
  - signal: sig-2026-02-15-installer-gap
    fix: "Manual file copy in Phase 22"
    outcome: "Recurred in Phase 28"
---
```

### Backward Compatibility Strategy

**Existing signals (without lifecycle fields) remain valid.** The design uses additive fields:

| Scenario | Behavior |
|----------|----------|
| Old signal read by new agent | Missing lifecycle fields = untriaged, no remediation, unverified |
| New signal read by old agent | Old agent ignores unrecognized YAML fields (per YAML spec) |
| Old signal gets triaged | Agent adds `triage:` block, updates `updated:` timestamp |
| Index rebuild | New index format includes lifecycle summary columns |

**Migration approach:** No batch migration needed. Signals gain lifecycle fields organically as they're triaged/remediated/verified. The reflector agent can set `triage.decision: needs-data` on old signals during reflection runs to mark them as reviewed but not yet actionable.

### Updated Status States

Current: `active | archived`

Extended: `active | triaged | remediated | verified | archived`

| Status | Meaning | Set By |
|--------|---------|--------|
| `active` | Detected, not yet triaged | Sensor/synthesizer |
| `triaged` | Decision made (address/defer/dismiss) | Reflector or human |
| `remediated` | Fix implemented, awaiting verification | Executor (via plan linkage) |
| `verified` | Fix confirmed working | Collect-signals (recurrence check) |
| `archived` | No longer relevant | Manual or lifecycle completion |

**Note:** `status` is used for both the old cap-management archival AND the new lifecycle tracking. This is fine because the states are a superset. Old behavior (only `active`/`archived`) still works. New behavior adds intermediate states.

---

## Signal-Plan Linkage: resolves_signals

### Where It Fits

The planner workflow (`plan-phase.md`) creates PLAN.md files. These plans should optionally declare which signals they intend to resolve:

```yaml
# In PLAN.md frontmatter
---
phase: 31
plan: 2
wave: 1
resolves_signals:
  - sig-2026-02-27-installer-path-bug
  - sig-2026-02-20-path-conversion-miss
---
```

### Integration Points

| Component | Modification | What Changes |
|-----------|-------------|--------------|
| `gsd-planner.md` (agent) | **Modified** -- add signal awareness | Planner reads active signals for project, recommends `resolves_signals` in plan frontmatter when plan tasks align with signal root causes |
| `plan-phase.md` (workflow) | **Modified** -- pass signals context to planner | Workflow reads KB index, filters active/triaged signals, includes in planner prompt context |
| `execute-plan.md` (workflow) | **Modified** -- update signal remediation on completion | After SUMMARY.md created, if plan has `resolves_signals`, update those signals' `remediation` fields |
| `gsd-executor.md` (agent) | **No change** | Executor doesn't need signal awareness -- it executes plan tasks. Signal updates happen at the workflow level after execution. |
| Signal template | **Modified** -- add `remediation.ref` field pattern | Template includes remediation block for agents to fill |

### Data Flow: Signal Resolution

```
1. /gsd:reflect identifies pattern, triages signals
   └── Signals gain triage.decision: address

2. /gsd:plan-phase reads triaged signals from KB
   └── Planner includes resolves_signals in PLAN.md frontmatter
   └── Plan tasks address signal root causes

3. /gsd:execute-phase runs plans
   └── After each plan completes (SUMMARY.md written):
       For each sig-id in resolves_signals:
         Update signal file:
           remediation.ref = { milestone, phase, plan, commit }
           remediation.status = completed
           status = remediated
           updated = now

4. /gsd:collect-signals runs for NEXT phase
   └── Artifact sensor checks: are any remediated signals recurring?
       If recurrence detected:
         New signal links via recurrence_of: sig-id
         Old signal verification.status = failed
       If no recurrence:
         Old signal verification.status = confirmed (after N phases)
         status = verified
```

### Passive Verification Inside Collect-Signals

The deliberation document proposes that verification is a passive check, not a separate command. This is the right architecture. When sensors run:

1. Read all signals with `status: remediated` for this project
2. For each remediated signal, check if the same pattern recurs in the current phase artifacts
3. If recurrence found: create new signal with `recurrence_of` link, update old signal verification to `failed`
4. If no recurrence found AND 2+ phases have passed since remediation: update old signal verification to `confirmed`

**Where this logic lives:** In the synthesizer agent, after merging raw signals from all sensors. The synthesizer has access to both new raw signals and existing remediated signals from the KB index. It performs the recurrence check as part of its correlation step.

---

## Enhanced Reflector Architecture

### Current Reflector Capabilities (gsd-reflector.md)

The existing reflector agent already handles:
- Load signals from KB index (project or cross-project scope)
- Pattern detection with severity-weighted thresholds
- Phase-end PLAN vs SUMMARY comparison
- Lesson distillation with scope determination
- Semantic drift detection
- Structured output format

### What Changes in v1.16

| Enhancement | What Changes | Backward Compatible |
|-------------|-------------|---------------------|
| Lifecycle awareness | Reflector reads triage/remediation/verification fields | Yes -- missing fields = untriaged |
| Confidence-weighted patterns | Pattern threshold considers signal confidence, not just count | Yes -- old signals without confidence default to "medium" |
| Counter-evidence seeking | Reflector actively looks for evidence against emerging patterns | Yes -- additive analysis step |
| Triage output | Reflector proposes triage decisions for untriaged signals | Yes -- new output section |
| Remediation tracking | Reflector reports on remediation outcomes | Yes -- new output section |
| Positive pattern detection | Amplify what works, not just what breaks | Yes -- existing polarity field supports this |
| Agent protocol reference | Add `<required_reading>` for agent-protocol.md | Yes -- tech debt fix |

### Modified Reflector Execution Flow

```
EXISTING FLOW                          NEW ADDITIONS
─────────────────────────────────────────────────────────
Step 1: Load config                    (unchanged)
Step 2: Load signals                   + Load lifecycle metadata
Step 3: Detect patterns                + Confidence-weighted thresholds
                                       + Counter-evidence seeking
                                       + Positive pattern amplification
Step 4: Phase-end reflection           (unchanged)
Step 5: Distill lessons                + Only from verified complete cycles
                                         (signal->remediation->verified)
                                       NEW Step 5.5: Triage untriaged signals
                                       NEW Step 5.6: Check remediation outcomes
Step 6: Semantic drift                 (unchanged)
Step 7: Report                         + Triage proposals section
                                       + Remediation status section
                                       + Confidence in pattern assessments
```

### Confidence-Weighted Pattern Detection

Current threshold logic (from reflection-patterns.md):
```
critical: 2+ occurrences = pattern
notable:  2+ occurrences = pattern
medium:   4+ occurrences = pattern
low:      5+ occurrences = pattern
```

Enhanced logic factors in signal confidence:

```
For each signal cluster:
  weighted_count = sum(confidence_weight * 1 for each signal)
  where confidence_weight = { high: 1.0, medium: 0.7, low: 0.3 }

  Apply threshold against weighted_count instead of raw count.

Example:
  2 high-confidence signals: weighted = 2.0 (meets critical threshold)
  3 low-confidence signals:  weighted = 0.9 (does NOT meet threshold)
  5 low-confidence signals:  weighted = 1.5 (still below 2.0 threshold)
  3 medium + 1 high signals: weighted = 3.1 (meets medium threshold)
```

**Backward compatibility:** Signals without a confidence field default to `medium` (weight 0.7). This means old signals require slightly MORE occurrences to form patterns, which is conservative and appropriate -- old signals lack evidence metadata.

### Counter-Evidence Seeking in Pattern Detection

When the reflector identifies a candidate pattern, it must ask:

1. **Are these truly the same root cause?** Check if signals share specific root cause text, not just tags. Tag overlap + different root causes = superficially similar, not a pattern.

2. **Is there contrary evidence?** Check for positive signals in the same domain. If there are 3 negative installer signals AND 5 positive installer signals, the pattern is weaker than 3 negatives with 0 positives.

3. **Are these independent observations?** Signals from the same phase/plan may be symptoms of one event, not a recurring pattern. Cluster by phase and count cross-phase occurrences separately from within-phase occurrences.

This analysis is documented in the pattern output:

```markdown
### Pattern: installer-path-conversion-failure

**Confidence:** HIGH (3 high-confidence signals, weighted 3.0)

**Supporting evidence:**
- 3 signals across phases 22, 28, 31 with same root cause
- Each mentions replacePathsInContent() specifically

**Counter-evidence considered:**
- No positive path conversion signals (no evidence of it working correctly)
- All 3 from same project (could be project-specific, not systemic)
- Pattern DOES span 3 milestones (reduces project-specificity concern)

**Assessment:** Strong pattern. Counter-evidence insufficient to dismiss.
```

---

## Lightweight Spike Architecture

### Current Problem

The spike system (Phase 3, v1.12) has extensive infrastructure but near-zero usage. Only one spike ever created, stuck at `designing` status. The full DESIGN -> BUILD -> RUN -> DOCUMENT flow is heavyweight for questions that need investigation but not code experiments.

### Design Decision: Two-Tier Spike System

**Tier 1: Research Spike (lightweight, new)**
- For questions answerable through documentation research + structured analysis
- No workspace, no experiment code, no BUILD/RUN phases
- Output: A structured decision document (similar to DECISION.md but lighter)
- Estimated cost: ~5-10% context (vs 30-50% for full spike)

**Tier 2: Experiment Spike (full, existing)**
- For questions requiring empirical measurement
- Full DESIGN -> BUILD -> RUN -> DOCUMENT flow (unchanged)
- Workspace isolation, throwaway code
- Estimated cost: 30-50% context

### Architecture Changes

| Component | Modification |
|-----------|-------------|
| `run-spike.md` (workflow) | **Modified** -- add tier detection and routing |
| `gsd-spike-runner.md` (agent) | **No change** -- still handles Tier 2 |
| `spike-execution.md` (reference) | **Modified** -- add lightweight spike spec |
| `/gsd:spike` (command) | **Minor modification** -- pass tier hint |
| Feature manifest | **Modified** -- add `spike_sensitivity` config |

### Lightweight Spike Flow

```
/gsd:spike "Does Claude Code expose session logs?"
    │
    ├── Tier detection (in workflow):
    │   Question analysis:
    │     "Does X support Y?" → research-suitable → Tier 1
    │     "Is X faster than Y?" → experiment-needed → Tier 2
    │
    ├── TIER 1: Research Spike
    │   │
    │   ├── No workspace creation (inline in workflow)
    │   ├── Research: WebSearch + official docs + Context7
    │   ├── Structured analysis: evidence for/against
    │   ├── Decision: answer + confidence + rationale
    │   ├── KB entry: spk-{date}-{slug} with outcome
    │   └── Return to orchestrator
    │
    └── TIER 2: Experiment Spike (existing flow)
        │
        ├── Create workspace
        ├── Draft DESIGN.md
        ├── Spawn gsd-spike-runner
        ├── BUILD -> RUN -> DOCUMENT
        └── KB entry + return
```

### Integration with Reflect

When the reflector identifies patterns with uncertainty, it should suggest spikes:

```markdown
### Suggested Investigations

1. **"Is the installer path conversion fragile by design?"** (Tier 2 recommended)
   - Pattern recurs despite fixes — may need architectural change
   - Needs empirical testing of alternative approaches

2. **"Does Claude Code expose session logs for analysis?"** (Tier 1 recommended)
   - Needed for log-sensor implementation
   - Documentation research should suffice
```

The reflector's output includes a `suggested_spikes` section that the user can act on with `/gsd:spike`.

---

## Epistemic Rigor Integration

### Structural Modifications Across Components

The epistemic rigor design principle from the deliberation document requires structural changes to schemas and templates, not just advisory guidelines. Here is how it integrates with each component:

#### 1. Sensor Output Schema (signal candidates)

Every raw signal candidate emitted by any sensor MUST include:

```yaml
confidence: high | medium | low
confidence_basis: "what the confidence level is based on"
evidence:
  supporting: ["specific data points"]
  counter: ["alternative explanations considered"]
```

**Enforcement:** The synthesizer agent validates these fields. Candidates missing them are logged as "incomplete detection" and not written to KB.

#### 2. Signal KB Schema

Final signals written to KB include the confidence and evidence fields from the sensor output. These are part of the immutable detection payload.

#### 3. Verifier Template

The existing VERIFICATION.md template needs both evidence directions:

```markdown
### Criterion: {name}

**Status:** {passed | failed | partial}

**Evidence For:**
- {specific observations supporting the claim}

**Evidence Against:**
- {specific observations that could contradict, and why they don't}
- {or: "No counter-evidence identified" -- this is itself a flag}

**Confidence:** {level} based on {basis}
```

#### 4. Reflector Pattern Output

Pattern assessments include supporting and counter-evidence (detailed in the Enhanced Reflector section above).

#### 5. Health-Check Belief Verification

`/gsd:health-check` should spot-check claims from STATE.md and recent audits. This is a future enhancement -- document it in the architecture but don't build it in v1.16 unless scope allows.

#### 6. Positive Signal Emission

Sensors should emit positive signals that establish baselines:
- Artifact sensor: "All 35 path conversions applied correctly"
- Git sensor: "Clean single-pass implementation, zero fix commits"
- These are `polarity: positive, severity: trace` (logged but not persisted by default)

The synthesizer may promote positive signals to `notable` severity when they establish a baseline that's important for regression detection (configurable).

---

## Data Flow: Complete Signal Lifecycle

```
                    DETECT
                      │
     ┌────────────────┼────────────────┐
     v                v                v
 artifact-       git-sensor       log-sensor
  sensor                              │
     │                │                │
     └────────┬───────┘────────────────┘
              v
        synthesizer
              │
              ├── dedup across sensors
              ├── cross-sensor correlation
              ├── epistemic validation
              ├── recurrence check (against remediated signals)
              ├── write to KB
              │
              v
           KB signals/
              │
              │                    TRIAGE
              ├──────────────────────┐
              v                      v
         /gsd:reflect          /gsd:signal (human)
              │                      │
              ├── pattern detection   ├── manual triage
              ├── auto-triage         │
              ├── lesson candidates   │
              │                      │
              v                      v
         triage decisions     signal status updated
              │
              │                  REMEDIATE
              ├──────────────────────┐
              v                      v
         /gsd:plan-phase       resolves_signals
              │                  in PLAN.md
              v
         /gsd:execute-phase
              │
              ├── plan completes
              ├── update signal remediation fields
              │
              v                    VERIFY
         /gsd:collect-signals (next phase)
              │
              ├── recurrence check
              ├── absence = evidence toward confirmed
              ├── recurrence = verification failed
              │
              v                   LESSON
         /gsd:reflect
              │
              ├── verified signals -> lesson candidates
              ├── failed verifications -> re-triage
              └── output: REFLECTION.md + lessons
```

---

## Component Inventory: New vs Modified

### New Components (create from scratch)

| File | Type | Purpose |
|------|------|---------|
| `agents/gsd-artifact-sensor.md` | Agent spec | Artifact-based signal detection (extracted from gsd-signal-collector) |
| `agents/gsd-git-sensor.md` | Agent spec | Git history-based signal detection |
| `agents/gsd-log-sensor.md` | Agent spec | Session log-based signal detection (stub if logs inaccessible) |
| `agents/gsd-signal-synthesizer.md` | Agent spec | Cross-sensor dedup, correlation, epistemic validation, KB write |

### Modified Components (extend existing)

| File | Type | What Changes |
|------|------|-------------|
| `get-shit-done/workflows/collect-signals.md` | Workflow | Rewrite: parallel sensor spawn, synthesizer spawn, sensor config |
| `agents/gsd-reflector.md` | Agent spec | Add lifecycle awareness, confidence-weighted patterns, counter-evidence, triage output, agent-protocol ref |
| `agents/gsd-signal-collector.md` | Agent spec | **Deprecated** -- functionality moves to artifact-sensor + synthesizer |
| `agents/knowledge-store.md` | Reference | Schema extensions: lifecycle fields, expanded status, source.sensor |
| `get-shit-done/references/signal-detection.md` | Reference | Add git/log detection rules, epistemic fields, positive signal spec |
| `get-shit-done/references/reflection-patterns.md` | Reference | Add confidence-weighted thresholds, counter-evidence methodology |
| `get-shit-done/workflows/run-spike.md` | Workflow | Add tier detection, lightweight spike path |
| `get-shit-done/references/spike-execution.md` | Reference | Add lightweight spike spec |
| `get-shit-done/workflows/plan-phase.md` | Workflow | Pass active signals context to planner |
| `get-shit-done/workflows/execute-plan.md` | Workflow | Post-completion signal remediation update |
| `get-shit-done/feature-manifest.json` | Config | Add `signal_collection.sensors` and `spike_sensitivity` |

### Unchanged Components

| File | Why Unchanged |
|------|--------------|
| `commands/gsd/collect-signals.md` | Already thin orchestrator -- delegates to workflow |
| `commands/gsd/reflect.md` | Already thin orchestrator -- delegates to workflow |
| `commands/gsd/spike.md` | Already thin orchestrator -- delegates to workflow |
| `commands/gsd/signal.md` | Manual signal path independent of multi-sensor changes |
| `agents/gsd-spike-runner.md` | Tier 2 spike execution unchanged |
| `agents/gsd-executor.md` | Executor doesn't need signal awareness |
| `get-shit-done/workflows/signal.md` | Already consolidated into command |

---

## Build Order: Dependency-Aware Phasing

### Phase Dependency Graph

```
Signal Schema Extensions ──────────────────┐
  (knowledge-store.md)                      │
       │                                    │
       v                                    v
Artifact Sensor ─────────┐         Epistemic Fields
  (agent spec)           │         (signal-detection.md)
       │                 │                  │
       v                 v                  v
Git Sensor         Signal Synthesizer ──────┘
  (agent spec)       (agent spec)
       │                 │
       └────────┬────────┘
                v
Multi-Sensor Orchestrator
  (collect-signals workflow)
                │
                v
Enhanced Reflector ──────────────> Signal-Plan Linkage
  (reflector agent)                 (plan-phase, execute-plan)
       │                                    │
       v                                    v
Lightweight Spikes                Verification Passive Check
  (run-spike workflow)             (synthesizer recurrence logic)
```

### Recommended Build Order

1. **Signal schema extensions + epistemic fields** (foundation -- everything depends on this)
   - Modify knowledge-store.md with lifecycle fields
   - Modify signal-detection.md with epistemic requirements
   - Update signal template in kb-templates/

2. **Artifact sensor extraction** (break apart existing agent)
   - Create gsd-artifact-sensor.md from gsd-signal-collector.md
   - Sensor emits raw candidates with epistemic fields
   - Does NOT write to KB (synthesizer does that)

3. **Signal synthesizer** (new agent, replaces collector's write logic)
   - Receives raw candidates from sensors
   - Cross-sensor dedup and correlation
   - Epistemic validation (reject incomplete candidates)
   - Cap enforcement, write to KB, index rebuild
   - Includes recurrence check logic (passive verification)

4. **Git sensor** (new detection surface)
   - Commit pattern analysis
   - Uses same raw candidate format as artifact sensor

5. **Multi-sensor orchestrator** (workflow rewrite)
   - Modify collect-signals.md workflow
   - Parallel sensor spawn with sensor config
   - Synthesizer spawn with merged candidates
   - Feature manifest config for sensors

6. **Enhanced reflector** (lifecycle awareness)
   - Confidence-weighted patterns
   - Counter-evidence seeking
   - Triage output for untriaged signals
   - Remediation status reporting
   - Positive pattern amplification
   - Agent protocol reference (tech debt fix)

7. **Signal-plan linkage** (cross-workflow integration)
   - Plan-phase passes signals context to planner
   - Planner recommends resolves_signals
   - Execute-plan updates signal remediation on completion

8. **Lightweight spikes** (reduced friction spike system)
   - Tier detection in run-spike workflow
   - Research spike flow (no workspace, inline)
   - Spike config in feature manifest

9. **Log sensor** (conditional on spike results)
   - Requires spike: "Does Claude Code expose session logs?"
   - If yes: implement log analysis sensor
   - If no: ship as disabled stub with TODO

### Why This Order

- **Schema first:** Every component depends on the schema. Changing it later means rework across all sensors and the synthesizer.
- **Artifact sensor before git sensor:** The artifact sensor is an extraction of existing logic (lower risk). Get the sensor interface right with known behavior before building new detection.
- **Synthesizer before orchestrator:** The synthesizer can be tested with manually-provided candidate data before the orchestrator exists. This validates the merge/dedup/write logic independently.
- **Reflector after sensors:** The reflector needs to read the new schema fields. Building it after sensors means the KB will have signals with lifecycle metadata to analyze.
- **Signal-plan linkage late:** This touches the planner and executor workflows, which are mature and stable. Modify them only after the signal schema and lifecycle flow are proven.
- **Lightweight spikes late:** This is the least coupled to the core signal lifecycle. It can be built independently.
- **Log sensor last:** It depends on investigation results that may not be available until other work is done.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Sensor Explosion

**What people do:** Create a sensor for every possible signal source, leading to dozens of sensor agents.
**Why it's wrong:** Each sensor is a Task() spawn consuming tokens and time. More sensors = more cost per collection run without proportional value.
**Do this instead:** Start with 2-3 high-value sensors (artifact, git). Add sensors only when there's demonstrated detection gap. The sensor architecture supports growth -- don't prematurely optimize for it.

### Anti-Pattern 2: Synthesizer as God Agent

**What people do:** Put all intelligence in the synthesizer -- dedup, correlation, triage, pattern detection, lesson creation.
**Why it's wrong:** Conflates synthesis (combining sensor outputs) with analysis (finding patterns). The synthesizer becomes an unmanageably large agent spec.
**Do this instead:** Synthesizer handles dedup, correlation, and KB write. Pattern detection and lesson creation stay in the reflector. Clear boundary: synthesizer = "what happened" (per-run), reflector = "what does it mean" (cross-run).

### Anti-Pattern 3: Breaking Signal Immutability Broadly

**What people do:** Allow any field on signals to be updated by any agent.
**Why it's wrong:** Signals lose their value as point-in-time observations. Agents might "clean up" detection data, losing the original context.
**Do this instead:** Only lifecycle fields (triage, remediation, verification, status, updated) are mutable. Detection payload (id, severity, signal_type, tags, source.evidence, description, body sections) is frozen after creation. Enforce this in the synthesizer and reflector agent specs.

### Anti-Pattern 4: Mandatory Lifecycle for All Signals

**What people do:** Require every signal to go through triage -> remediation -> verification -> lesson.
**Why it's wrong:** Many signals are informational. Not everything needs remediation. Forcing the full lifecycle creates busywork.
**Do this instead:** Lifecycle fields are optional. A signal can stay `active` forever if it's informational. The reflector SUGGESTS triage decisions -- they're not required. Only signals triaged as `address` enter the remediation pipeline.

### Anti-Pattern 5: Tight Coupling Between Plan Frontmatter and KB

**What people do:** Make the planner agent directly modify signal files when creating plans.
**Why it's wrong:** The planner writes PLAN.md files. It shouldn't also be writing to ~/.gsd/knowledge/. This creates a confusing ownership model.
**Do this instead:** The planner declares `resolves_signals` in PLAN.md frontmatter (its domain). The execute-plan workflow reads this declaration and updates signal files (separation of concerns). The planner never touches the KB directly.

---

## Integration Points Summary

| Integration | Source Component | Target Component | Data Exchanged | When |
|-------------|-----------------|-----------------|----------------|------|
| Sensor -> Synthesizer | Sensor agents | Signal synthesizer | Raw signal candidates (YAML array) | During collect-signals |
| Synthesizer -> KB | Signal synthesizer | Knowledge store files | Final signal .md files | During collect-signals |
| KB -> Reflector | Knowledge store | Reflector agent | Signal files with lifecycle metadata | During /gsd:reflect |
| Reflector -> KB | Reflector agent | Knowledge store | Lesson files, triage updates on signals | During /gsd:reflect |
| KB -> Planner | Knowledge store | Planner agent (via workflow) | Active/triaged signals for context | During /gsd:plan-phase |
| Planner -> PLAN.md | Planner agent | Plan file frontmatter | resolves_signals: [sig-ids] | During /gsd:plan-phase |
| PLAN.md -> KB | Execute-plan workflow | Signal files | remediation.ref, remediation.status | After plan completion |
| KB -> Synthesizer | Knowledge store | Signal synthesizer | Remediated signals for recurrence check | During collect-signals |
| Reflector -> Spike | Reflector output | User action | suggested_spikes section | During /gsd:reflect |
| Config -> Orchestrator | feature-manifest | Collect-signals workflow | sensor enable/disable, model config | During collect-signals |

---

## Scalability Considerations

| Concern | At 50 signals | At 500 signals | At 5000 signals |
|---------|---------------|----------------|-----------------|
| KB index size | ~5KB, fast scan | ~50KB, still fast | ~500KB, may need optimization |
| Sensor context | No issue | No issue | Consider pagination |
| Synthesizer dedup | Trivial | Linear scan OK | May need tag-indexed approach |
| Reflector load | Fast | Pattern detection scales linearly | Consider incremental reflection |
| Index rebuild | <1s | ~2-3s | Consider incremental rebuild |

**Recommendation for v1.16:** Design for 500-signal scale. Don't prematurely optimize for 5000+. The flat-file KB with index.md is sufficient for current usage patterns (46 signals after 4 milestones). If growth exceeds expectations, evolve the storage layer (as knowledge-store.md already suggests).

---

## Sources

- Existing codebase analysis (all files listed in Component Inventory)
- `.planning/deliberations/v1.16-signal-lifecycle-and-beyond.md` -- primary design input
- `agents/knowledge-store.md` -- KB schema and lifecycle rules
- `get-shit-done/references/signal-detection.md` -- current detection rules
- `get-shit-done/references/reflection-patterns.md` -- current pattern detection
- `get-shit-done/workflows/map-codebase.md` -- parallel agent pattern reference
- `get-shit-done/workflows/collect-signals.md` -- current orchestrator implementation
- `get-shit-done/workflows/plan-phase.md` -- planner integration point
- `get-shit-done/workflows/execute-plan.md` -- executor integration point

---
*Architecture research for: Signal Lifecycle & Reflection Integration (v1.16)*
*Researched: 2026-02-27*
