# Phase 33: Enhanced Reflector - Research

**Researched:** 2026-02-28
**Domain:** Signal reflection, pattern detection, lifecycle-aware triage, lesson distillation
**Confidence:** HIGH

## Summary

Phase 33 enhances the existing reflector agent (`agents/gsd-reflector.md`) and its workflow (`get-shit-done/workflows/reflect.md`) with lifecycle awareness, confidence-weighted pattern detection, triage proposals, lesson distillation, remediation suggestions, and a reflect-to-spike pipeline. The foundation is solid: Phase 31 established the signal schema with lifecycle fields, triage/remediation/verification objects, evidence structures, and confidence metadata. Phase 32 delivered the multi-sensor orchestrator that produces lifecycle-aware signals. The reflector currently detects patterns using raw count thresholds and distills lessons, but does not read lifecycle state, weight by confidence, propose triage, generate remediation suggestions, or flag spike candidates.

The existing knowledge base contains 50 signal files (35 modern format + 15 legacy SIG-format) for this project, plus 1 lesson. The 50 signals are ALL in `lifecycle_state: detected` (or lacking lifecycle_state entirely for legacy signals). The 15 legacy SIG-format signals use non-standard field values (e.g., `type: positive-pattern` instead of `type: signal`) and will need graceful handling during bulk analysis. Tag analysis reveals clear clusters: deviation/plan-accuracy (7+ signals), extraction/quality (4 signals), tdd/testing (5+ signals), context-bloat/workflow (3 signals), continue-here/cleanup (2 signals), path-resolution/installer (4 signals), and architecture patterns (3+ signals). These clusters provide more than enough material to distill 5+ lessons.

**Primary recommendation:** Enhance the reflector agent spec and reflection-patterns.md with lifecycle-aware analysis, confidence-weighted thresholds, triage proposal generation, and evidence-snapshot lessons -- the core work is agent spec updates and reference doc changes, NOT gsd-tools.js code. The bulk triage of existing signals is the Phase 33 triage constraint from 31-04: when adding lifecycle_state to critical signals, evidence MUST be added first.

## Standard Stack

### Core

This phase modifies agent specs and reference documents, not runtime code. No new libraries are needed.

| Component | File | Purpose | Why It Matters |
|-----------|------|---------|---------------|
| gsd-reflector.md | `agents/gsd-reflector.md` | Reflector agent spec | Primary enhancement target -- all REFLECT-01 through REFLECT-08 requirements |
| reflection-patterns.md | `get-shit-done/references/reflection-patterns.md` | Pattern detection rules | Confidence-weighted thresholds, counter-evidence seeking, spike candidate flagging |
| reflect.md workflow | `get-shit-done/workflows/reflect.md` | Orchestration workflow | Lifecycle dashboard, triage proposal UX, remediation suggestion output |
| knowledge-store.md | `agents/knowledge-store.md` | Signal schema reference | Read-only reference for lifecycle fields, triage object structure, mutability boundary |
| gsd-tools.js | `get-shit-done/bin/gsd-tools.js` | CLI utilities | Frontmatter validation (already built in Phase 31), extractFrontmatter for reading signals |

### Supporting

| Component | File | Purpose | When to Use |
|-----------|------|---------|-------------|
| kb-templates/lesson.md | `agents/kb-templates/lesson.md` | Lesson file template | When distilling lessons (already exists, may need evidence_snapshot field) |
| signal-detection.md | `get-shit-done/references/signal-detection.md` | Signal detection rules | Reference for severity tiers, clustering criteria |
| kb-rebuild-index.sh | `~/.gsd/bin/kb-rebuild-index.sh` | Index rebuilder | After writing lessons or modifying signal lifecycle fields |
| config.json | `.planning/config.json` | Project settings | Mode (yolo/interactive), lifecycle_strictness, rigor_enforcement |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Agent spec pattern detection | gsd-tools.js coded clustering | Agent-driven is more flexible, easier to evolve; coded would be deterministic but rigid |
| Evidence snapshots in lesson frontmatter | External evidence links only | Snapshots are self-contained; links break if signals are archived later |
| Triage proposals in reflect output | Separate /gsd:triage command | Consolidating into reflect keeps workflow simpler; separate command adds ceremony |

## Architecture Patterns

### File Modification Map

```
agents/
  gsd-reflector.md           # Major rewrite -- lifecycle-aware analysis, triage, remediation
get-shit-done/
  references/
    reflection-patterns.md   # Confidence-weighted thresholds, counter-evidence rules, spike pipeline
  workflows/
    reflect.md               # Lifecycle dashboard, triage proposal UX, evidence-snapshot output
agents/kb-templates/
  lesson.md                  # Add evidence_snapshot field for lesson distillation
~/.gsd/knowledge/
  signals/                   # Bulk triage modifies lifecycle_state on existing signals
  lessons/                   # New lessons written here by reflector
```

### Pattern 1: Lifecycle-Aware Signal Analysis (REFLECT-01)

**What:** The reflector reads `lifecycle_state`, `triage`, `remediation`, and `verification` fields from each signal and adjusts analysis behavior based on lifecycle position.

**When to use:** Every reflection run.

**Behavior by lifecycle state:**
- `detected` (or absent): Full analysis candidate. Include in pattern detection, triage proposals, lesson distillation.
- `triaged`: Skip triage proposals (already triaged). Include in pattern detection and lesson distillation. Show triage.decision in report.
- `remediated`: Lower weight in pattern detection (issue is addressed). Track for verification dashboard.
- `verified`: Exclude from active pattern detection. Include in positive pattern analysis (verified resolution is a success signal).
- `invalidated`: Exclude entirely from analysis (archived).

**Legacy signal handling:** 15 SIG-format signals use non-standard field values (`type: positive-pattern`, `status: resolved`). The reflector must gracefully handle these:
- Missing `lifecycle_state`: default to `detected`
- Non-standard `type` field: treat as `signal` for analysis purposes
- Missing `signal_category`: infer from `polarity` field, or from `type: positive-pattern` -> positive
- Missing `signal_type`: infer from context (deviation, positive-pattern -> good-pattern, etc.)

### Pattern 2: Confidence-Weighted Pattern Detection (REFLECT-02)

**What:** Replace raw occurrence count thresholds with confidence-weighted scoring. A cluster of 3 high-confidence signals surfaces a pattern that 5 low-confidence signals would not.

**Threshold model:**

```
weighted_score = sum(weight(signal) for signal in cluster)

where weight(signal) =
  confidence: high -> 2.0, medium -> 1.0, low -> 0.5
  severity_multiplier: critical -> 1.5, notable -> 1.0, minor -> 0.7

weight = confidence_weight * severity_multiplier
```

**Pattern qualification thresholds (by max severity in cluster):**

| Max Severity | Raw Count Threshold (old) | Weighted Score Threshold (new) |
|-------------|--------------------------|-------------------------------|
| critical | 2 occurrences | 3.0 weighted score |
| notable | 3 occurrences | 4.0 weighted score |
| minor | 5 occurrences | 5.0 weighted score |

**Why these thresholds:** 3 high-confidence critical signals produce a score of 3*2.0*1.5 = 9.0 (well above 3.0). But 5 low-confidence minor signals produce 5*0.5*0.7 = 1.75 (below 5.0, correctly filtering noise). The old model treated all 5 minor signals equally regardless of confidence.

### Pattern 3: Counter-Evidence Seeking (REFLECT-03)

**What:** For each candidate pattern, the reflector actively seeks counter-evidence before confirming. Bounded to 3 counter-examples per pattern to prevent analysis paralysis.

**Counter-evidence sources:**
1. Signals with same tags but `signal_category: positive` (good patterns contradict negative patterns)
2. Signals where the same issue occurred but was resolved (remediated/verified lifecycle states)
3. Time-decay: if pattern signals are all old (>30 days) and no recent recurrence, note as potentially stale

**Bounded search:** The reflector examines up to 3 potential counter-examples per pattern. If none found, the pattern is confirmed. If counter-evidence found, the pattern confidence is reduced and the counter-evidence is cited in the report.

### Pattern 4: Triage Proposals (REFLECT-05)

**What:** The reflector generates triage proposals for untriaged signal clusters, using cluster-level decisions.

**Triage proposal structure:**
```yaml
proposal:
  cluster: "{pattern-name}"
  signals: [sig-xxx, sig-yyy, sig-zzz]
  recommended_decision: address | dismiss | defer | investigate
  rationale: "..."
  recommended_priority: critical | high | medium | low
  recommended_action: "..."
```

**Decision logic:**
- `address`: Pattern has clear root cause AND actionable fix
- `dismiss`: Pattern is noise OR already resolved elsewhere
- `defer`: Pattern exists but is low priority / not blocking
- `investigate`: Pattern is unclear, needs spike or further analysis

**User interaction (from workflow):**
- Interactive mode: Present each proposal, user approves/rejects/modifies
- YOLO mode: Auto-apply `address` and `dismiss` decisions; present `investigate` for user

**Writing triage to signals:** When user approves a proposal, the reflector writes triage fields to each signal in the cluster:
```yaml
lifecycle_state: triaged
triage:
  decision: address
  rationale: "Cluster of 4 deviation signals about plan-accuracy"
  priority: medium
  by: reflector
  at: 2026-02-28T10:00:00Z
lifecycle_log:
  - "detected->triaged by reflector at 2026-02-28T10:00:00Z: cluster triage"
```

### Pattern 5: Lesson Distillation with Evidence Snapshots (REFLECT-04)

**What:** Distill lessons from qualifying patterns, including evidence snapshots that capture the key observation from each contributing signal.

**Evidence snapshot format in lesson:**
```yaml
evidence:
  - id: sig-2026-02-22-knowledge-surfacing-silently-removed
    snapshot: "Executor agents silently removed knowledge_surfacing sections from 4 agents during extraction"
  - id: sig-2026-02-22-scope-creep-unauthorized-new-sections
    snapshot: "Executor added unauthorized new sections during extraction that were not in any plan"
```

**Why snapshots matter:** Signals may eventually be archived. The snapshot preserves the essential observation in the lesson itself, making the lesson self-contained even if evidence signals are later archived.

### Pattern 6: Remediation Suggestions (REFLECT-06)

**What:** For triaged signals with `triage.decision: address`, the reflector generates remediation suggestions.

**Suggestion structure:**
```markdown
### Remediation Suggestion: {pattern-name}

**Signals:** {list of triaged signal IDs}
**Suggested approach:** {description of what to do}
**Suggested plan scope:** {which phase/plan could address this}
**Priority:** {from triage.priority}
```

**Note:** The reflector does NOT write remediation fields to signals -- it only suggests. Phase 34 (Signal-Plan Linkage) will handle the remediation.status updates when plans declare `resolves_signals`.

### Pattern 7: Lifecycle Dashboard (REFLECT-07)

**What:** Every reflect output starts with a lifecycle dashboard showing signal distribution across states.

**Format:**
```markdown
## Lifecycle Dashboard

| State | Count | Percentage |
|-------|-------|-----------|
| Untriaged (detected) | 46 | 92% |
| Triaged | 2 | 4% |
| Remediated | 1 | 2% |
| Verified | 0 | 0% |
| Invalidated | 1 | 2% |
| **Total** | **50** | **100%** |

Legacy signals (SIG-format): 15 (treated as detected)
Signals with evidence: 8/50 (16%)
High-confidence signals: 12 (24%)
```

### Pattern 8: Reflect-to-Spike Pipeline (REFLECT-08)

**What:** Patterns flagged as low-confidence or with `triage.decision: investigate` are automatically formatted as spike candidates.

**Spike candidate format:**
```markdown
### Spike Candidate: {pattern-name}

**Confidence:** low ({N} occurrences, weighted score {X})
**Question:** {framed as a testable hypothesis}
**Why a spike:** {why we cannot resolve this through analysis alone}
**Suggested experiment:** {what to test}
```

**Integration:** Spike candidates appear in the reflect report and can be fed into `/gsd:spike` for investigation.

### Anti-Patterns to Avoid

- **Modifying detection payload fields:** The reflector MUST NOT change frozen fields (id, type, project, tags, created, severity, signal_type, etc.). Only lifecycle fields are mutable. See knowledge-store.md Section 10.
- **Adding lifecycle_state to critical signals without evidence:** The Phase 33 triage constraint from 31-04. When bulk triage adds `lifecycle_state: detected` to existing critical signals, it MUST also add `evidence` (with at least one `supporting` entry) OR downgrade `severity`. Otherwise the backward_compat exemption disappears and the signal fails schema validation.
- **Treating positive and negative signals as one cluster:** Positive baselines and negative deviations with overlapping tags must NOT cluster together (reflection-patterns.md Section 2.2).
- **Time-based exclusion:** Signals remain in the pattern detection pool regardless of age. Archive via `status: archived` is the only exclusion mechanism.
- **Auto-promoting to global scope in interactive mode:** Suggest promotion and wait for user confirmation. Auto-promote only in YOLO mode for high-confidence lessons.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Signal frontmatter parsing | Custom YAML parser | `extractFrontmatter()` from gsd-tools.js | Already handles nested objects, edge cases |
| Signal schema validation | Custom validation logic | `frontmatter validate --schema signal` | Phase 31 built this with conditional/backward_compat support |
| Index rebuilding | Manual index construction | `~/.gsd/bin/kb-rebuild-index.sh` | Handles format, sorting, archived exclusion |
| Signal file writing | Ad-hoc frontmatter construction | kb-templates/signal.md as template | Ensures all required fields are present |
| Lesson file writing | Ad-hoc lesson construction | kb-templates/lesson.md as template | Ensures consistent structure |

**Key insight:** Phase 31 and 32 built significant infrastructure (schema validation, templates, index rebuilding). The reflector should USE this infrastructure, not rebuild it. The reflector's value is in analysis and decision-making, not file I/O.

## Common Pitfalls

### Pitfall 1: Phase 33 Triage Constraint Violation

**What goes wrong:** Adding `lifecycle_state` to existing critical signals without simultaneously adding `evidence.supporting` entries. Once `lifecycle_state` is present, the backward_compat exemption in `cmdFrontmatterValidate` no longer applies, and the conditional evidence requirement becomes a hard failure.

**Why it happens:** The 6 existing critical signals (kb-data-loss-migration-gap, kb-script-wrong-location-and-path, local-install-global-kb-model, task-tool-model-enum-no-sonnet-46, codebase-mapper-deleted-during-extraction, knowledge-surfacing-silently-removed) lack both `lifecycle_state` and `evidence` fields.

**How to avoid:** Before writing `lifecycle_state: triaged` to any critical signal, FIRST add `evidence: { supporting: ["...at least one entry..."] }` to the signal. Validate with `frontmatter validate --schema signal` after modification.

**Warning signs:** Post-write validation returns `valid: false, missing: [evidence]`.

### Pitfall 2: Legacy SIG-Format Signal Breakage

**What goes wrong:** Trying to parse or validate legacy SIG-format signals with the standard signal schema. They use `type: positive-pattern` instead of `type: signal`, lack `signal_type`, `signal_category`, `lifecycle_state`, and other Phase 31+ fields.

**Why it happens:** 15 signals predate the standard schema. Knowledge-store.md Section 4.2 notes: "Legacy SIG-format signals (SIG-260222-*, SIG-260223-*) predate the standard schema and may contain non-standard field values."

**How to avoid:** Do NOT run `frontmatter validate --schema signal` on SIG-format signals. Read them for analysis purposes only. Infer missing fields from context. Do NOT modify SIG-format signals to add lifecycle fields (they are outside the mutability boundary scope).

**Warning signs:** Signal ID starts with `SIG-` (uppercase), filename contains `SIG-260` prefix.

### Pitfall 3: Context Budget Overflow During Bulk Analysis

**What goes wrong:** Reading all 50 signal files (some with 50+ lines of body content) into context simultaneously, causing context budget exhaustion before analysis completes.

**Why it happens:** The reflector needs to read signals to detect patterns, but 50 signals at ~40 lines each is ~2000 lines of content.

**How to avoid:** Use a two-pass approach:
1. **Index pass:** Read `index.md` for high-level signal metadata (tags, severity, lifecycle). Identify clusters from metadata alone.
2. **Detail pass:** Read full signal files ONLY for signals in qualifying clusters (typically 10-15 files, not all 50).

**Warning signs:** Agent starts summarizing or skipping signals midway through analysis.

### Pitfall 4: Confidence Field Absence in Legacy Signals

**What goes wrong:** Weighting signals by confidence when many lack the `confidence` field entirely.

**Why it happens:** Only Phase 31+ signals have `confidence` and `confidence_basis` fields. Older signals (including the 35 modern-format ones from before Phase 31) lack these fields.

**How to avoid:** Default missing `confidence` to `medium` (as specified in the signal schema). This gives legacy signals a neutral weight rather than penalizing or boosting them.

### Pitfall 5: Mutability Boundary Violations During Triage

**What goes wrong:** Accidentally modifying frozen detection payload fields while updating lifecycle fields during triage.

**Why it happens:** The reflector writes to signal files to update triage/lifecycle_state. If the write process reconstructs the entire file, it risks changing detection payload fields.

**How to avoid:** Read the complete file content, parse frontmatter with `extractFrontmatter()`, modify ONLY mutable fields (lifecycle_state, lifecycle_log, triage, updated), reconstruct frontmatter, and write back. Validate that frozen fields remain unchanged by comparing before/after.

**Warning signs:** `git diff` on triaged signal shows changes outside of lifecycle/triage fields.

## Code Examples

### Reading and Filtering Signals by Lifecycle State

```bash
# Source: knowledge-store.md Section 4.2, index format Section 9

# From index.md, extract lifecycle state for each signal
grep "^| sig-" ~/.gsd/knowledge/index.md | while read row; do
  id=$(echo "$row" | awk -F'|' '{print $2}' | tr -d ' ')
  lifecycle=$(echo "$row" | awk -F'|' '{print $4}' | tr -d ' ')
  severity=$(echo "$row" | awk -F'|' '{print $3}' | tr -d ' ')
  tags=$(echo "$row" | awk -F'|' '{print $5}' | tr -d ' ')
  echo "$id|$lifecycle|$severity|$tags"
done
```

### Confidence-Weighted Score Calculation

```
# Pseudocode -- reflector agent logic, not gsd-tools.js

for each cluster:
  weighted_score = 0
  for each signal in cluster:
    confidence = signal.confidence or "medium"  # default for legacy
    confidence_weight = { high: 2.0, medium: 1.0, low: 0.5 }[confidence]
    severity_mult = { critical: 1.5, notable: 1.0, minor: 0.7 }[signal.severity]
    weighted_score += confidence_weight * severity_mult

  max_severity = max(signal.severity for signal in cluster)
  threshold = { critical: 3.0, notable: 4.0, minor: 5.0 }[max_severity]

  if weighted_score >= threshold:
    emit_pattern(cluster)
```

### Triage Write Pattern (Respecting Mutability Boundary)

```bash
# Source: knowledge-store.md Section 10

# 1. Read existing signal
SIGNAL_FILE="~/.gsd/knowledge/signals/{project}/{signal-file}.md"
CONTENT=$(cat "$SIGNAL_FILE")

# 2. Parse frontmatter (use extractFrontmatter in agent context)
# 3. Modify ONLY mutable fields:
#    - lifecycle_state: "triaged"
#    - triage: { decision: "address", rationale: "...", priority: "medium", by: "reflector", at: "..." }
#    - lifecycle_log: append "detected->triaged by reflector at ..."
#    - updated: current timestamp
# 4. Keep ALL frozen fields unchanged
# 5. Write back with reconstructed frontmatter + original body
# 6. Validate: node gsd-tools.js frontmatter validate "$SIGNAL_FILE" --schema signal
```

### Lesson with Evidence Snapshot

```yaml
# Source: kb-templates/lesson.md + Phase 33 evidence snapshot extension

---
id: les-2026-02-28-extraction-destroys-content-without-authorization
type: lesson
project: get-shit-done-reflect
tags: [extraction, agent-behavior, quality-control, unauthorized-removal]
created: 2026-02-28T10:00:00Z
updated: 2026-02-28T10:00:00Z
durability: convention
status: active
category: workflow
evidence_count: 4
evidence: [sig-2026-02-22-knowledge-surfacing-silently-removed, sig-2026-02-22-codebase-mapper-deleted-during-extraction, sig-2026-02-22-scope-creep-unauthorized-new-sections, sig-2026-02-22-webfetch-best-practices-lost]
evidence_snapshots:
  - id: sig-2026-02-22-knowledge-surfacing-silently-removed
    snapshot: "Executor agents silently removed knowledge_surfacing sections from 4 agents during extraction"
  - id: sig-2026-02-22-codebase-mapper-deleted-during-extraction
    snapshot: "Codebase mapper agent was deleted entirely during extraction without authorization"
  - id: sig-2026-02-22-scope-creep-unauthorized-new-sections
    snapshot: "Executor added unauthorized new sections to agent specs not specified in any plan"
  - id: sig-2026-02-22-webfetch-best-practices-lost
    snapshot: "WebFetch best practices content was lost during protocol extraction"
confidence: high
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.15.6
---

## Lesson

Extraction-style refactoring plans must explicitly list BOTH sections to keep AND sections to remove; omitting a section from the keep list does not imply permission to remove it.

## When This Applies

- When planning any agent spec refactoring that moves shared content to a common reference
- When writing plans that modify multiple agent specs in a single phase

## Recommendation

1. Plans that restructure agent specs must include an explicit keep-list AND remove-list
2. Verification should diff before/after to confirm no unplanned section deletions
3. Consider running a content-preservation check: grep for key section headers before and after execution

## Evidence

- sig-2026-02-22-knowledge-surfacing-silently-removed: 4 agents lost knowledge_surfacing sections (restored in af34ff3)
- sig-2026-02-22-codebase-mapper-deleted-during-extraction: Entire agent file deleted, not just sections
- sig-2026-02-22-scope-creep-unauthorized-new-sections: Executor added content not in plans while removing planned content
- sig-2026-02-22-webfetch-best-practices-lost: WebFetch best practices disappeared without plan authorization
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Raw count thresholds (2/3/5) | Confidence-weighted scoring | Phase 33 (this phase) | 3 high-confidence signals can surface a pattern that 5 low-confidence cannot |
| Signal = immutable blob | Frozen detection + mutable lifecycle | Phase 31 (v1.16) | Signals can be triaged, remediated, verified without losing original observation |
| Single signal collector | Multi-sensor architecture | Phase 32 (v1.16) | Parallel detection, single KB writer, quality gates |
| No positive signals | Baseline/improvement/good-pattern | Phase 31 (v1.16) | Counter-evidence, regression guards, cross-project transfer |
| Lessons reference signal IDs only | Lessons include evidence snapshots | Phase 33 (this phase) | Self-contained lessons survive signal archival |

## Open Questions

1. **Evidence snapshot storage format**
   - What we know: Snapshots need to be part of the lesson frontmatter for discoverability
   - What's unclear: Whether `evidence_snapshots` should be a new field in the lesson template or embedded within the existing `evidence` array
   - Recommendation: Add `evidence_snapshots` as a new optional field in kb-templates/lesson.md. Keeps backward compatibility with existing lesson format.

2. **Bulk triage scope for existing signals**
   - What we know: All 50 signals are in detected state. The reflector should triage clusters, not individual signals.
   - What's unclear: Should ALL 50 signals be triaged during Phase 33, or only those in qualifying clusters?
   - Recommendation: Triage only signals that appear in qualifying patterns (clusters meeting weighted thresholds). Leave isolated signals in detected state for future analysis.

3. **SIG-format signal lifecycle modification**
   - What we know: 15 SIG-format signals predate the standard schema with non-standard field values.
   - What's unclear: Whether the reflector should attempt to add lifecycle_state/triage fields to these, or leave them as read-only legacy data.
   - Recommendation: Leave SIG-format signals as read-only. Include them in pattern detection (reading), but do not modify their frontmatter. They contribute to lesson distillation evidence but are not themselves triaged.

4. **Remediation suggestions scope**
   - What we know: REFLECT-06 requires remediation suggestions for triaged signals. Phase 34 handles actual remediation tracking.
   - What's unclear: How detailed should remediation suggestions be? Plan-level ("create a plan for X") or action-level ("modify file Y to fix Z")?
   - Recommendation: Plan-level suggestions. The reflector identifies WHAT needs fixing and suggests a plan scope. Phase 34's signal-plan linkage handles the actual `resolves_signals` mechanism.

5. **Triage interaction with reconstructFrontmatter()**
   - What we know: `reconstructFrontmatter()` silently drops null values (Pitfall 6 from knowledge-store.md). Triage/remediation/verification use empty objects `{}` for unset state.
   - What's unclear: Whether `reconstructFrontmatter()` handles nested YAML objects like `triage: { decision: "address", rationale: "..." }` correctly in round-trip (parse-modify-write).
   - Recommendation: Test this early in Phase 33. Write a signal with triage fields, read it back, verify round-trip integrity. This was flagged in STATE.md blockers: "Nested YAML parsing risk: extractFrontmatter() may not handle deep nesting."

## Detectable Pattern Clusters in Existing Signals

Analysis of the 50 existing signals reveals the following clusters that should produce 5+ lessons:

### Cluster 1: Extraction Quality Failures (4 signals, critical+notable)
- sig-2026-02-22-knowledge-surfacing-silently-removed (critical)
- sig-2026-02-22-codebase-mapper-deleted-during-extraction (critical)
- sig-2026-02-22-scope-creep-unauthorized-new-sections (notable)
- sig-2026-02-22-webfetch-best-practices-lost (notable)
- **Weighted score:** ~8.0 (2 critical high + 2 notable medium = 2*2.0*1.5 + 2*1.0*1.0 = 8.0)
- **Lesson:** Extraction plans need explicit keep/remove lists and content-preservation verification

### Cluster 2: Plan Accuracy / Deviation (6+ signals, notable)
- sig-2026-02-28-verification-gap-triggered-unplanned-plan
- sig-2026-02-28-sh-script-path-not-in-agents-dir
- sig-2026-02-28-cross-plan-test-count-not-updated
- sig-2026-02-23-installer-clobbers-force-tracked-files
- sig-2026-02-22-plan-22-03-incomplete-interrupted
- sig-2026-02-22-loadmanifest-source-repo-path-gap
- **Weighted score:** ~6.0+ (6 notable medium = 6*1.0*1.0 = 6.0)
- **Lesson:** Plans need pre-execution validation against existing state (test counts, file existence, path conventions)

### Cluster 3: TDD Discipline (5 signals, notable, mixed polarity)
- SIG-260222-001 (positive: TDD maintained)
- SIG-260222-010 (positive: TDD zero-deviation)
- sig-2026-02-23-planner-skips-tdd-baseline (negative: TDD skipped)
- sig-2026-02-26-skipped-tdd-for-inject-version-scope (negative: TDD skipped)
- SIG-260222-011 (positive: good pattern)
- **Note:** Positive and negative cluster separately. The positive cluster alone has 2-3 signals.
- **Lesson (from negative cluster):** Planner agents must check for TDD applicability when failing tests exist

### Cluster 4: Path Resolution / Installer Issues (4 signals, critical+notable)
- sig-2026-02-11-kb-script-wrong-location-and-path (critical)
- sig-2026-02-11-local-install-global-kb-model (critical)
- sig-2026-02-28-sh-script-path-not-in-agents-dir (minor)
- sig-2026-02-22-loadmanifest-source-repo-path-gap (notable)
- **Weighted score:** ~6.5 (2 critical medium + 1 notable medium + 1 minor medium)
- **Lesson:** Path references must use the project's path convention prefix (~/.claude/ for npm source)

### Cluster 5: Context Bloat / Workflow Overhead (3 signals, notable)
- sig-2026-02-11-signal-workflow-context-bloat (notable)
- sig-2026-02-18-signal-workflow-context-bloat (notable)
- sig-2026-02-11-agent-inline-research-context-bloat (notable)
- **Weighted score:** ~3.0 (3 notable medium = 3.0)
- **Lesson:** Workflows that read full file contents should use progressive disclosure (index first, details on demand)

### Cluster 6: Continue-Here / Cleanup Gaps (3 signals, notable)
- sig-2026-02-16-stale-continue-here-files-not-cleaned (notable)
- sig-2026-02-17-continue-here-not-deleted-after-resume (notable)
- sig-2026-02-17-resume-work-misses-non-phase-handoffs (notable)
- **Weighted score:** ~3.0
- **Lesson:** Resume-work workflow needs cleanup verification for stale continue-here files

### Cluster 7: Agent Behavior Quality (3+ signals, notable)
- sig-2026-02-23-audit-tech-debt-dismissal (notable)
- sig-2026-02-26-delegate-exploration-to-subagents (notable)
- sig-2026-02-18-sonnet-45-quality-concern-phase22 (notable)
- **Weighted score:** ~3.0
- **Lesson:** Agent quality degrades when model does not match plan specification

**Total identifiable lesson candidates: 7 clusters producing 7+ potential lessons.** This exceeds the Phase 33 success criterion of 5 lessons.

## Sources

### Primary (HIGH confidence)
- `agents/knowledge-store.md` v2.0.0 -- Signal schema, lifecycle state machine, mutability boundary, epistemic rigor, backward_compat rules
- `agents/gsd-reflector.md` -- Current reflector agent spec (baseline for enhancement)
- `get-shit-done/references/reflection-patterns.md` v1.1.0 -- Current pattern detection rules, severity-weighted thresholds, lesson distillation criteria
- `get-shit-done/workflows/reflect.md` -- Current reflection workflow orchestration
- `get-shit-done/bin/gsd-tools.js` lines 2227-2326 -- FRONTMATTER_SCHEMAS signal schema, cmdFrontmatterValidate with backward_compat
- Phase 31 verification report (`31-VERIFICATION.md`) -- Confirmed signal schema, backward_compat, 15/15 truths
- Phase 32 verification report (`32-VERIFICATION.md`) -- Multi-sensor architecture, synthesizer as sole KB writer

### Secondary (MEDIUM confidence)
- Phase 31 CONTEXT.md -- User decisions on lifecycle, epistemic rigor, positive signals, severity tiers
- `~/.gsd/knowledge/index.md` -- Current signal inventory (50 signals, 0 spikes, 1 lesson)
- Actual signal files (sampled 5) -- Verified frontmatter structure, legacy SIG-format differences

### Tertiary (LOW confidence)
- Cluster analysis in "Detectable Patterns" section -- Based on tag analysis of 50 signals. Actual clustering may reveal different groupings when full signal context is read. Weighted scores are estimates assuming medium confidence for signals without explicit confidence fields.

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| les-2026-02-16-dynamic-path-resolution-for-install-context | lesson | Path resolution must be dynamic based on install context | Confirmed path-resolution cluster relevance, but lesson not directly applicable to reflector design |

Checked knowledge base (`~/.gsd/knowledge/index.md`). 1 lesson found, tangentially related (path resolution, not reflection). 0 spikes found. 50 signals analyzed for cluster potential -- these ARE the input data for Phase 33, not knowledge to apply.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- All files identified exist and were verified against source
- Architecture: HIGH -- Patterns derived directly from Phase 31 schema decisions and Phase 32 infrastructure
- Pitfalls: HIGH -- Phase 33 triage constraint explicitly documented in 31-04; legacy signal format verified empirically
- Cluster analysis: MEDIUM -- Tag-based clustering is approximate; actual clustering during reflection may differ

**Research date:** 2026-02-28
**Valid until:** 2026-03-30 (30 days -- stable domain, no external dependencies)
