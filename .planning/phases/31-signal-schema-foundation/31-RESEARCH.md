# Phase 31: Signal Schema Foundation - Research

**Researched:** 2026-02-27
**Domain:** YAML frontmatter schema design, signal lifecycle metadata, epistemic rigor enforcement
**Confidence:** HIGH

## Summary

Phase 31 extends the existing signal YAML frontmatter schema with lifecycle fields (triage, remediation, verification), epistemic rigor fields (evidence.supporting, evidence.counter, confidence, confidence_basis), a mutability boundary (detection payload frozen, lifecycle fields mutable), positive signal support, and severity tiers. The critical constraint is backward compatibility: all 46 existing signals must remain valid without migration -- missing new fields default gracefully.

The codebase has well-understood infrastructure for this work. The `extractFrontmatter()` and `reconstructFrontmatter()` functions in `gsd-tools.js` already handle nested YAML objects (up to 3 levels deep), which is exactly what the new `evidence`, `triage`, `remediation`, and `verification` sub-objects need. The `FRONTMATTER_SCHEMAS` validation system currently validates plan, summary, and verification schemas -- extending it for signal schemas is the natural integration point (SCHEMA-08). The `kb-rebuild-index.sh` script reads frontmatter fields with simple `grep` extraction, so the index format must remain compatible with its grep-based parsing (no deeply nested fields in index-visible data).

**Primary recommendation:** Design schema extensions as additive optional fields with defaults that match current signal behavior (e.g., `lifecycle_state` defaults to `detected`, confidence defaults to `medium`, evidence object defaults to empty). Enforce rigor requirements at write-time in the signal-collector and reflector agents, not in the schema parser itself. Keep the index script's simple field extraction working by ensuring new lifecycle state is a top-level field, not buried in a nested object.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- Four core lifecycle states: detected -> triaged -> remediated -> verified
- Stage skipping is a project setting (configurable per-project)
- Signals can regress (remediated signal that recurs moves back to detected)
- Invalidation state with audit trail (terminal state)
- Existing 46 signals default to detected state; bulk triage in Phase 33
- Verification rigor scales with severity (naive temporal absence insufficient for critical)
- Recurrence escalation depends on original severity
- Signals at any lifecycle state can contribute to lesson distillation
- Multi-factor qualification system for signal weight in lesson creation
- Five epistemic principles: proportional rigor, epistemic humility, evidence independence, mandatory counter-evidence, meta-epistemic reflection
- Counter-evidence is a hard requirement for critical signals (system refuses to save without it)
- Invalidation with audit trail
- Evidence types are extensible (core set + custom types)
- Validation depth scales with signal criticality and evidence source reliability
- Evidence source reliability tracked multi-dimensionally
- Epistemic gap signals (system explicitly acknowledges blind spots)
- System annotates evidence quality (meta-epistemic reflection)
- Evidence independence matters (repeated citations of same fact != corroboration)
- Severity-dependent ceremony (trace: fast/low ceremony; critical: full rigor)
- Three types of positive signals: baselines, improvements, good patterns
- Positive signals serve triple purpose: lesson inputs, regression guards, cross-project transfer
- Severity disagreements recorded (sensor vs triage assessments both kept)
- Severity conflict handling is a project setting
- Five project settings identified: lifecycle strictness, manual signal trust level, rigor calibration guardrails, severity conflict handling, recurrence escalation rules

### Claude's Discretion
Claude has broad discretion on implementation details across all areas. Key areas of discretion:
- Lifecycle: audit trail format, transition actors, dismissed state, stage skip rules
- Evidence: format, mutability, confidence representation, aggregation rules, sufficiency model, decay
- Positive signals: lifecycle fit, detection approach, rigor levels, counter-evidence interaction
- Severity: tier design, assignment flow, classification criteria, downstream behavior
- All implementation/architecture decisions

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope

</user_constraints>

## Standard Stack

### Core
| Component | Location | Purpose | Why It Matters |
|-----------|----------|---------|----------------|
| `gsd-tools.js` | `get-shit-done/bin/gsd-tools.js` (5,472 lines) | CLI runtime with frontmatter parsing, reconstruction, validation | ALL schema changes flow through this file's `extractFrontmatter()`, `reconstructFrontmatter()`, and `FRONTMATTER_SCHEMAS` |
| `knowledge-store.md` | `agents/knowledge-store.md` | Knowledge base specification (the spec doc we update for SCHEMA-09) | Defines signal schema, mutability rules, lifecycle rules -- this is the authoritative schema document |
| `signal-detection.md` | `get-shit-done/references/signal-detection.md` | Signal detection rules, severity classification, schema extensions | Defines signal_type enum values, severity levels, polarity, existing extension fields |
| `signal.md` template | `agents/kb-templates/signal.md` | Signal creation template | Template that agents copy-and-fill when creating signals |
| `kb-rebuild-index.sh` | `~/.gsd/bin/kb-rebuild-index.sh` | Index rebuilder (bash, grep-based field extraction) | Must remain compatible with new fields; reads top-level frontmatter only |

### Supporting
| Component | Location | Purpose | When Relevant |
|-----------|----------|---------|---------------|
| `gsd-signal-collector.md` | `agents/gsd-signal-collector.md` | Signal collector agent spec | Must understand new schema fields; emits signals with lifecycle fields |
| `gsd-reflector.md` | `agents/gsd-reflector.md` | Reflector agent spec | Reads lifecycle state, updates triage/remediation; Phase 33 expands this |
| `reflection-patterns.md` | `get-shit-done/references/reflection-patterns.md` | Pattern detection reference | References signal severity levels and confidence; may need updates |
| `feature-manifest.json` | `get-shit-done/feature-manifest.json` | Declarative feature/config schema | New project settings (lifecycle strictness, rigor calibration, etc.) go here |
| `gsd-tools.test.js` | `get-shit-done/bin/gsd-tools.test.js` | Test suite for gsd-tools | Tests for FRONTMATTER_SCHEMAS validation, frontmatter extraction/reconstruction |
| `kb-infrastructure.test.js` | `tests/integration/kb-infrastructure.test.js` | KB integration tests | Test fixtures for signal/spike/lesson creation and index rebuild |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| YAML frontmatter | JSON sidecar files | YAML is established convention; JSON would break every existing signal file and all grep-based tools |
| Top-level lifecycle_state field | Nested lifecycle.state | Top-level is grep-friendly for kb-rebuild-index.sh; nesting adds parsing complexity for index |
| gsd-tools.js validation | External YAML schema validator | External dependency contradicts zero-runtime-dependency design principle |

## Architecture Patterns

### Recommended Schema Extension Structure

The extended signal frontmatter should be organized as follows:

```yaml
---
# === DETECTION PAYLOAD (FROZEN after creation) ===
id: sig-2026-02-27-example-signal
type: signal
project: get-shit-done-reflect
tags: [auth, retry, deviation]
created: 2026-02-27T14:30:00Z
updated: 2026-02-27T14:30:00Z
durability: convention
severity: critical
signal_type: deviation
signal_category: negative
phase: 31
plan: 1
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0

# === LIFECYCLE FIELDS (MUTABLE) ===
lifecycle_state: detected
lifecycle_log:
  - transition: created
    from: null
    to: detected
    by: artifact-sensor
    at: 2026-02-27T14:30:00Z

# === EPISTEMIC FIELDS (detection-time: frozen; triage-time additions: mutable) ===
evidence:
  supporting: ["SUMMARY.md shows 3 auto-fixes in plan 31-01"]
  counter: ["Auto-fixes were all Rule 1 (bugs), not plan quality issues"]
confidence: medium
confidence_basis: "3 auto-fixes is threshold, but all were minor bugs"

# === TRIAGE FIELDS (MUTABLE, populated during triage) ===
triage:
  decision: address
  rationale: "3rd recurrence of planning gap"
  priority: high
  by: reflector
  at: 2026-02-28T10:00:00Z

# === REMEDIATION FIELDS (MUTABLE, populated during remediation) ===
remediation:
  status: planned
  resolved_by_plan: "34-02"
  approach: "Add pre-execution validation step"
  at: 2026-03-01T12:00:00Z

# === VERIFICATION FIELDS (MUTABLE, populated during verification) ===
verification:
  status: pending
  method: absence-of-recurrence
  evidence_required: active-retest
  at: null

# === RECURRENCE TRACKING (FROZEN at creation) ===
recurrence_of: null
---
```

### Mutability Boundary Design

```
FROZEN (detection payload):        MUTABLE (lifecycle fields):
---------------------------------  ---------------------------------
id, type, project, tags            lifecycle_state
created, durability                lifecycle_log[]
severity (initial), signal_type    triage.*
phase, plan, polarity              remediation.*
source, occurrence_count           verification.*
related_signals, runtime, model    updated (timestamp)
gsd_version
evidence.supporting (initial)
evidence.counter (initial)
confidence (initial)
confidence_basis (initial)
```

**Key insight:** The `updated` field becomes meaningful now -- it was always equal to `created` under full immutability. With lifecycle mutations, `updated` tracks the most recent lifecycle change.

**Enforcement approach:** The mutability boundary is enforced by agent instructions and validation functions, not by file system permissions. The `cmdFrontmatterSet` and `cmdFrontmatterMerge` functions in gsd-tools.js could optionally check a frozen-fields list before writing, but the primary enforcement is in the agent specs that define which fields each agent may modify.

### Severity Tier Design (Claude's Discretion Recommendation)

Four tiers to match the four lifecycle states and existing severity vocabulary:

| Tier | Name | Rigor Requirements | Downstream Behavior |
|------|------|-------------------|---------------------|
| 1 | `critical` | Counter-evidence REQUIRED. Active verification required. | Blocks lesson distillation without full evidence. Recurrence triggers immediate escalation. |
| 2 | `notable` | Counter-evidence RECOMMENDED. Passive verification acceptable. | Standard pattern detection threshold. Recurrence escalates to critical. |
| 3 | `minor` | Evidence summary sufficient. No counter-evidence required. | Higher pattern detection threshold. Recurrence escalates to notable. |
| 4 | `trace` | Minimal. Detection context only. | Not persisted to KB (current behavior preserved). Logged in collection reports only. |

**Note on existing signals:** The current schema has only `critical` and `notable` as severity values. Adding `minor` gives a middle ground between "always persist" and "never persist." The existing 46 signals retain their current severity; reclassification happens in Phase 33 bulk triage.

### Positive Signal Design (Claude's Discretion Recommendation)

Positive signals use the SAME schema with different field values:

```yaml
signal_category: positive    # NEW field (replaces use of polarity for this purpose)
signal_type: baseline        # Extended enum: baseline | improvement | good-pattern
polarity: positive           # Existing field, now semantically aligned
severity: notable            # Proportional rigor applies
lifecycle_state: detected    # Same lifecycle, different verification semantics
```

**Rationale for same lifecycle:** A positive baseline signal goes through:
- `detected` -- baseline observed (e.g., "all 35 commands have correct paths")
- `triaged` -- confirmed as meaningful baseline (not noise)
- `remediated` -- N/A for positives; skip this state or use as "baseline reinforced"
- `verified` -- baseline confirmed stable over time

**Alternative considered:** Separate lifecycle for positives. Rejected because it doubles the state machine complexity and the four-state lifecycle works with semantic reinterpretation for each category.

### Epistemic Gap Signal Design (Claude's Discretion Recommendation)

Epistemic gap signals are full signals with a dedicated signal_type:

```yaml
signal_type: epistemic-gap    # Extended enum value
signal_category: negative     # They represent missing knowledge (a gap)
severity: notable             # At minimum; can be critical if the gap is high-stakes
evidence:
  supporting: ["No test coverage exists for cross-runtime KB operations"]
  counter: ["The KB format is simple enough that cross-runtime issues are unlikely"]
confidence: low               # Inherently low -- we're flagging what we DON'T know
confidence_basis: "Gap identified by absence of evidence, not presence of counter-evidence"
```

### Lifecycle State Machine

```
                    +--> invalidated (terminal, with audit)
                    |
detected --> triaged --> remediated --> verified
   ^           |            |              |
   |           |            |              |
   +-----------+            +--------------+
   (regression: recurrence    (regression: recurrence
    resets to detected)        resets to detected)
```

**State transitions:**

| From | To | Trigger | Who Can Trigger |
|------|-----|---------|----------------|
| detected | triaged | Triage decision made | reflector, human |
| detected | invalidated | Counter-evidence overwhelms supporting | reflector, human |
| triaged | remediated | Plan with resolves_signals completes | executor (auto), human |
| triaged | detected | (regression) Recurrence detected | synthesizer |
| triaged | invalidated | Counter-evidence overwhelms supporting | reflector, human |
| remediated | verified | Verification criteria met | synthesizer (passive), human |
| remediated | detected | (regression) Recurrence detected | synthesizer |
| verified | detected | (regression) Recurrence detected (severity escalated) | synthesizer |
| any | invalidated | Audit-trailed invalidation | reflector, human |

**Skip rules (project setting: lifecycle_strictness):**
- `strict`: All transitions must go through each intermediate state
- `flexible` (default): detected -> remediated is allowed (fix without formal triage); detected -> verified is NOT allowed (must have remediation evidence)
- `minimal`: Any forward transition allowed

### Project Settings Schema (for feature-manifest.json)

```json
{
  "signal_lifecycle": {
    "scope": "project",
    "introduced": "1.16.0",
    "config_key": "signal_lifecycle",
    "schema": {
      "lifecycle_strictness": {
        "type": "string",
        "enum": ["strict", "flexible", "minimal"],
        "default": "flexible",
        "description": "How strictly lifecycle state transitions are enforced"
      },
      "manual_signal_trust": {
        "type": "string",
        "enum": ["full", "standard", "cautious"],
        "default": "standard",
        "description": "Rigor expected from user-submitted signals"
      },
      "rigor_enforcement": {
        "type": "string",
        "enum": ["strict", "warn", "permissive"],
        "default": "warn",
        "description": "What happens when rigor requirements are not met"
      },
      "severity_conflict_handling": {
        "type": "string",
        "enum": ["sensor-wins", "triage-wins", "record-both"],
        "default": "record-both",
        "description": "How sensor vs triage severity disagreements are handled"
      },
      "recurrence_escalation": {
        "type": "boolean",
        "default": true,
        "description": "Whether signal recurrence automatically escalates severity"
      }
    }
  }
}
```

### FRONTMATTER_SCHEMAS Extension Pattern

Current schemas in gsd-tools.js (line 2227):
```javascript
const FRONTMATTER_SCHEMAS = {
  plan: { required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'] },
  summary: { required: ['phase', 'plan', 'subsystem', 'tags', 'duration', 'completed'] },
  verification: { required: ['phase', 'verified', 'status', 'score'] },
};
```

Extended for signals (SCHEMA-08):
```javascript
const FRONTMATTER_SCHEMAS = {
  plan: { required: [...] },
  summary: { required: [...] },
  verification: { required: [...] },
  // NEW: Signal schema with tiered validation
  signal: {
    required: ['id', 'type', 'project', 'tags', 'created', 'severity', 'signal_type'],
    conditional: {
      // When severity is critical, these become required
      critical: ['evidence'],
    },
    recommended: ['confidence', 'confidence_basis', 'lifecycle_state'],
  },
};
```

**Important:** The current `cmdFrontmatterValidate` function only checks `required` fields. The conditional and recommended logic requires extending this function. This is a code change in gsd-tools.js (an upstream file) -- but SCHEMA-08 explicitly requires it.

**Note on upstream file modification:** CLAUDE.md says "Never modify get-shit-done/bin/gsd-tools.js directly (upstream file)." However, SCHEMA-08 explicitly requires extending FRONTMATTER_SCHEMAS in gsd-tools.js. This is a deliberate, planned modification that was written into the requirements. The modification should be minimal and additive (adding a new schema entry and extending the validation function).

### Backward Compatibility Strategy (SCHEMA-04)

The 46 existing signals have this field set:
- `status: active` -- always present
- `severity: critical | notable` -- always present
- `signal_type: deviation | struggle | config-mismatch | quality-issue | custom` -- always present
- NO `lifecycle_state` field
- NO `evidence` object
- NO `confidence` field
- NO `triage`, `remediation`, `verification` objects

**Default strategy:**
1. When `lifecycle_state` is absent, default to `detected`
2. When `evidence` is absent, treat as `{ supporting: [], counter: [] }`
3. When `confidence` is absent, default to `medium`
4. When `triage`, `remediation`, `verification` are absent, treat as empty/not-yet-populated
5. The `extractFrontmatter()` function already handles missing fields gracefully (returns `undefined` for absent keys)
6. The index rebuild script ignores fields it doesn't extract -- new fields are invisible to it until we add extraction

**No migration needed:** Existing files are never modified. When an agent reads an old signal and finds no lifecycle_state, it knows the signal is in `detected` state. The schema extension is purely additive.

### Index Script Compatibility

The `kb-rebuild-index.sh` script (at `~/.gsd/bin/`) uses simple `grep` to extract fields:
```bash
get_field() {
  local file="$1" field="$2"
  grep "^${field}:" "$file" 2>/dev/null | head -1 | sed "s/^${field}:[[:space:]]*//"
}
```

This works for TOP-LEVEL fields only. Nested fields like `evidence.supporting` or `triage.decision` cannot be extracted by this script. Two options:

1. **Add top-level lifecycle_state field** (recommended): The index can extract `lifecycle_state` with the existing grep pattern. The index table gains a new column.
2. **Don't change the index format yet**: Phase 31 defines the schema; Phase 33 (enhanced reflector) may need a richer index. Keep the index script unchanged now.

**Recommendation:** Add `lifecycle_state` as a top-level field AND add it to the index table. This is minimal, non-breaking, and immediately useful for agents scanning the index. The index table for signals becomes:

```markdown
| ID | Project | Severity | Lifecycle | Tags | Date | Status |
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Custom recursive parser | Existing `extractFrontmatter()` in gsd-tools.js | Already handles 3-level nesting, arrays, objects. Proven across 5,400-line codebase. |
| YAML writing | Custom serializer | Existing `reconstructFrontmatter()` in gsd-tools.js | Handles arrays, nested objects, string quoting. |
| Schema validation | New validation framework | Extend existing `FRONTMATTER_SCHEMAS` + `cmdFrontmatterValidate` | Pattern established, tested, understood. Just add signal schema entry. |
| Index generation | New index generator | Extend existing `kb-rebuild-index.sh` | Adding a column to the grep-based script is simpler than rewriting. |
| Config management | Manual config parsing | Extend existing `feature-manifest.json` + config system | Proven pattern for project settings with defaults and prompts. |

**Key insight:** Every piece of infrastructure this phase needs already exists in some form. The work is extending, not building from scratch. This is a schema-definition and spec-update phase with targeted code modifications, not a greenfield implementation.

## Common Pitfalls

### Pitfall 1: Breaking Existing Signal Parsing
**What goes wrong:** New nested fields (evidence, triage, etc.) cause `extractFrontmatter()` to misbehave on old signals that don't have them.
**Why it happens:** The parser encounters unexpected field structures when roundtripping old signals through new code.
**How to avoid:** Never modify existing signal files. New fields are additive. The parser already returns `undefined` for absent fields. Test with actual existing signal files from `~/.gsd/knowledge/signals/get-shit-done-reflect/`.
**Warning signs:** Existing tests failing, `extractFrontmatter()` returning different results for old signals.

### Pitfall 2: Index Script Incompatibility
**What goes wrong:** `kb-rebuild-index.sh` breaks because it encounters nested YAML it can't parse with simple grep.
**Why it happens:** Adding nested objects to frontmatter that the grep-based `get_field()` function tries to extract.
**How to avoid:** Keep index-relevant fields at the top level. The `lifecycle_state` field should be top-level, not `lifecycle.state`. Nested objects (evidence, triage, remediation, verification) are NOT extracted by the index script -- they're read by agents via `extractFrontmatter()`.
**Warning signs:** Index rebuild produces empty or garbled rows.

### Pitfall 3: Overengineering the Schema
**What goes wrong:** Designing an elaborate schema that downstream phases (32-35) find unusable because it's too rigid or too complex for agents to populate correctly.
**Why it happens:** This phase defines data model without building behavior. Easy to optimize for theoretical completeness rather than practical agent usability.
**How to avoid:** Keep the schema simple enough that a signal-collector agent can emit a valid signal in a single Write call. Every field must have a sensible default. Test by mentally walking through "what does an agent need to write to create a valid critical signal? A valid trace signal?"
**Warning signs:** More than 10 new required fields, deeply nested conditional logic, fields that require multi-step computation to populate.

### Pitfall 4: Editing .claude/ Instead of Source
**What goes wrong:** Changes made to `.claude/agents/knowledge-store.md` instead of `agents/knowledge-store.md` get overwritten on next install.
**Why it happens:** The dual-directory architecture (CLAUDE.md explicitly warns about this, citing a 23-day undetected bug from v1.15 Phase 22).
**How to avoid:** Always edit files in `agents/`, `get-shit-done/`, `commands/` directories. Run `node bin/install.js --local` after editing to sync to `.claude/`.
**Warning signs:** `git diff` shows changes in `.claude/` paths, not source paths.

### Pitfall 5: Forgetting the Mutability Boundary is Agent-Enforced
**What goes wrong:** Assuming gsd-tools.js will prevent frozen field modifications, but it doesn't -- enforcement is in agent specs.
**Why it happens:** The mutability boundary is a design constraint, not a runtime guard in the current architecture. Adding runtime enforcement in gsd-tools.js is possible but scope-expanding.
**How to avoid:** Document the frozen/mutable field lists clearly in knowledge-store.md. Agent specs (signal-collector, reflector) must reference these lists. Consider adding a lightweight validation function to gsd-tools.js that warns (not blocks) when frozen fields are modified.
**Warning signs:** Agent modifying detection payload fields during triage, losing original observation data.

### Pitfall 6: reconstructFrontmatter Null Skipping
**What goes wrong:** Fields set to `null` are silently dropped when `reconstructFrontmatter()` writes YAML back.
**Why it happens:** Line 335: `if (value === null || value === undefined) continue;` -- null values are skipped during reconstruction. This is documented as signal SIG-260222-009 in the KB.
**How to avoid:** Use empty strings or sentinel values instead of null for "not yet set" lifecycle fields. Or set fields to explicit empty objects/arrays. Example: `verification: { status: "pending" }` instead of `verification: null`.
**Warning signs:** Fields disappearing after a read-modify-write cycle.

## Code Examples

### Example 1: New Signal with Full Lifecycle Fields

```yaml
---
id: sig-2026-02-27-auth-retry-loop
type: signal
project: my-project
tags: [auth, retry, deviation]
created: 2026-02-27T14:30:00Z
updated: 2026-02-27T14:30:00Z
durability: convention
status: active
severity: critical
signal_type: deviation
signal_category: negative
phase: 31
plan: 1
polarity: negative
source: auto
occurrence_count: 1
related_signals: []
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.16.0
lifecycle_state: detected
evidence:
  supporting: ["SUMMARY.md shows 5 retry attempts in auth flow"]
  counter: ["Retries may be expected for OAuth token refresh"]
confidence: medium
confidence_basis: "5 retries exceeds normal threshold of 2, but OAuth refresh is inherently retry-heavy"
triage: {}
remediation: {}
verification: {}
recurrence_of: null
---
```

### Example 2: Existing Signal (Backward Compatible, No Changes)

```yaml
---
id: sig-2026-02-22-knowledge-surfacing-silently-removed
type: signal
project: get-shit-done-reflect
tags: [extraction, quality, agent-specs, knowledge-surfacing, unauthorized-removal]
created: 2026-02-22T00:00:00Z
updated: 2026-02-22T00:00:00Z
durability: convention
status: active
severity: critical
signal_type: quality-issue
phase: 22
plan: 0
polarity: negative
source: automated
occurrence_count: 1
related_signals: [sig-2026-02-18-sonnet-45-quality-concern-phase22]
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.12.2
---
```

When read by lifecycle-aware code: `lifecycle_state` is absent -> defaults to `detected`. `evidence` absent -> treated as empty. `confidence` absent -> defaults to `medium`. No migration, no file modification needed.

### Example 3: Positive Baseline Signal

```yaml
---
id: sig-2026-02-27-all-commands-correct-paths
type: signal
project: get-shit-done-reflect
tags: [installer, paths, baseline, validation]
created: 2026-02-27T16:00:00Z
updated: 2026-02-27T16:00:00Z
durability: convention
status: active
severity: notable
signal_type: baseline
signal_category: positive
phase: 31
plan: 0
polarity: positive
source: auto
occurrence_count: 1
related_signals: []
lifecycle_state: detected
evidence:
  supporting: ["All 35 command files have correct path prefixes after install"]
  counter: ["Only checked local install, not global"]
confidence: high
confidence_basis: "Exhaustive check of all command files in installed directory"
---

## What Happened

Post-install validation confirmed all 35 slash command files have correct
./.claude/ path prefixes. This establishes a regression guard baseline.

## Context

Checked during Phase 31 signal schema work. This baseline enables future
detection of path conversion regressions.

## Baseline Value

All commands correctly converted from ~/.claude/ to ./.claude/ prefixes.
```

### Example 4: Extending FRONTMATTER_SCHEMAS (SCHEMA-08)

```javascript
// Source: get-shit-done/bin/gsd-tools.js, line ~2227
const FRONTMATTER_SCHEMAS = {
  plan: { required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'] },
  summary: { required: ['phase', 'plan', 'subsystem', 'tags', 'duration', 'completed'] },
  verification: { required: ['phase', 'verified', 'status', 'score'] },
  signal: {
    required: ['id', 'type', 'project', 'tags', 'created', 'severity', 'signal_type'],
    // Tiered: conditional requirements based on severity
    conditional: [
      {
        when: { field: 'severity', value: 'critical' },
        require: ['evidence'],
        recommend: ['confidence', 'confidence_basis'],
      },
      {
        when: { field: 'severity', value: 'notable' },
        recommend: ['evidence', 'confidence'],
      },
    ],
    optional: ['lifecycle_state', 'triage', 'remediation', 'verification',
               'signal_category', 'recurrence_of', 'phase', 'plan',
               'polarity', 'source', 'occurrence_count', 'related_signals',
               'runtime', 'model', 'gsd_version', 'durability', 'status'],
  },
};
```

### Example 5: Updated Index Format

```markdown
## Signals (47)

| ID | Project | Severity | Lifecycle | Tags | Date | Status |
|----|---------|----------|-----------|------|------|--------|
| sig-2026-02-27-auth-retry | my-project | critical | detected | auth,retry | 2026-02-27 | active |
| sig-2026-02-26-skipped-tdd | get-shit-done-reflect | notable | detected | tdd,testing | 2026-02-26 | active |
```

The `Lifecycle` column is extracted from the top-level `lifecycle_state` field. For existing signals without this field, the column shows empty (or the index script defaults to "detected").

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Signals immutable (full file) | Detection payload frozen, lifecycle fields mutable | Phase 31 (now) | Enables triage, remediation, verification without creating new files |
| `status: active \| archived` only | `lifecycle_state: detected \| triaged \| remediated \| verified \| invalidated` | Phase 31 (now) | Full lifecycle tracking in frontmatter |
| No counter-evidence | `evidence.supporting` + `evidence.counter` required for critical | Phase 31 (now) | Epistemic rigor as structural requirement |
| Only negative signals | `signal_category: positive \| negative` with `signal_type: baseline \| improvement \| good-pattern` | Phase 31 (now) | Baselines enable regression detection |
| Count-based severity (`critical \| notable`) | Four-tier severity with tiered rigor requirements | Phase 31 (now) | Proportional ceremony |

**Deprecated/outdated after Phase 31:**
- **`polarity` field as primary positive/negative indicator:** Replaced by `signal_category` for clarity, though `polarity` is retained for backward compatibility
- **Signal full immutability rule** in knowledge-store.md Section 10: Updated to "detection payload immutable, lifecycle fields mutable"

## Open Questions

1. **Lifecycle audit trail format**
   - What we know: User wants audit trail for lifecycle transitions. Claude has discretion on format.
   - Options: (a) `lifecycle_log` array in YAML frontmatter, (b) rely on git history, (c) separate log file per signal
   - Recommendation: Use `lifecycle_log` array in frontmatter. It's self-contained (no git dependency), agents can read it without shell commands, and `extractFrontmatter()` already handles arrays of strings. Git history is supplementary, not primary. Keep entries as compact strings: `"detected->triaged by reflector at 2026-02-28T10:00:00Z: 3rd recurrence"`.

2. **Should `evidence` be frozen or mutable?**
   - What we know: User said "split by type" is discretion. Initial detection evidence should be frozen. But triage might add new counter-evidence.
   - Recommendation: Freeze `evidence.supporting` and `evidence.counter` as set at detection time. Add `triage.additional_evidence` for triage-time additions. This preserves the original observation while allowing enrichment.

3. **Plan-linkage fields in Phase 31 or Phase 34?**
   - What we know: Claude's discretion. Phase 34 is "Signal-Plan Linkage."
   - Recommendation: Include `remediation.resolved_by_plan` as a schema-defined field in Phase 31 (the field exists in the schema), but don't implement the automated population flow until Phase 34. This lets Phase 34 focus on behavior, not schema changes.

4. **Dismissed/won't-fix state**
   - What we know: Claude's discretion on whether to add a dismissed state or rely on triage priority.
   - Recommendation: Add `dismissed` as a triage decision value (not a lifecycle state). A dismissed signal stays in `triaged` state with `triage.decision: dismiss`. This avoids adding a 6th lifecycle state while preserving the information. If needed, a `dismissed` convenience alias for `triaged + dismiss decision` can be added later.

5. **Confidence representation**
   - What we know: REQUIREMENTS.md explicitly says "Numeric confidence scores (0.0-1.0)" is out of scope (false precision). User wants categorical.
   - Recommendation: Three tiers: `high`, `medium`, `low`. Always paired with `confidence_basis` text explaining why. This matches the existing reflection-patterns.md confidence system.

## Files Modified by This Phase

| File | Change Type | Requirement |
|------|-------------|-------------|
| `agents/knowledge-store.md` | Major update -- lifecycle fields, mutability boundary, epistemic requirements | SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-05, SCHEMA-09 |
| `agents/kb-templates/signal.md` | Update template with new fields | SCHEMA-01 |
| `get-shit-done/references/signal-detection.md` | Update schema extensions section, add signal_category, update severity tiers | SCHEMA-03, SCHEMA-06, SCHEMA-07 |
| `get-shit-done/bin/gsd-tools.js` | Extend FRONTMATTER_SCHEMAS with signal schema, extend validation function | SCHEMA-08 |
| `get-shit-done/bin/gsd-tools.test.js` | Tests for signal schema validation | SCHEMA-08 |
| `get-shit-done/feature-manifest.json` | Add signal_lifecycle project settings | SCHEMA-01 (project settings) |
| `~/.gsd/bin/kb-rebuild-index.sh` | Add lifecycle_state column extraction | SCHEMA-03 (index update) |
| `get-shit-done/references/reflection-patterns.md` | Update severity references, confidence model | SCHEMA-06 |

**After source edits:** Run `node bin/install.js --local` to sync to `.claude/` directory.

## Sources

### Primary (HIGH confidence)
- `agents/knowledge-store.md` -- Authoritative signal schema specification (read in full)
- `get-shit-done/bin/gsd-tools.js` lines 257-394 -- `extractFrontmatter()`, `reconstructFrontmatter()` implementation
- `get-shit-done/bin/gsd-tools.js` lines 2227-2244 -- `FRONTMATTER_SCHEMAS` and `cmdFrontmatterValidate()`
- `get-shit-done/references/signal-detection.md` -- Current signal extension fields, severity rules
- `agents/gsd-signal-collector.md` -- Signal creation flow and field population
- `agents/gsd-reflector.md` -- Reflection agent reading signals
- `~/.gsd/bin/kb-rebuild-index.sh` -- Index rebuild implementation (grep-based)
- Existing signal files at `~/.gsd/knowledge/signals/get-shit-done-reflect/` -- 46 signals examined for schema patterns

### Secondary (MEDIUM confidence)
- `.planning/deliberations/v1.16-signal-lifecycle-and-beyond.md` -- Design deliberation with proposed schema extensions
- `get-shit-done/references/reflection-patterns.md` -- Pattern detection rules, confidence expression
- `get-shit-done/feature-manifest.json` -- Feature configuration pattern for project settings

### Tertiary (LOW confidence)
- None -- all findings verified against source code and existing files

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are in the existing codebase, thoroughly examined
- Architecture: HIGH -- schema design follows established patterns, verified against parser capabilities
- Pitfalls: HIGH -- based on documented bugs (SIG-260222-009 null skipping, v1.15 Phase 22 dual-directory), and parser behavior verified from source code

**Research date:** 2026-02-27
**Valid until:** 2026-04-27 (60 days -- stable domain, schema design doesn't change externally)

## Knowledge Applied

Checked knowledge base (`~/.gsd/knowledge/index.md`). Scanned 46 signals, 0 spikes, 1 lesson.

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| SIG-260222-009 | signal | `reconstructFrontmatter` null-skipping footgun | Common Pitfalls (Pitfall 6) |
| sig-2026-02-22-knowledge-surfacing-silently-removed | signal | Unauthorized removal of agent sections during extraction | Common Pitfalls (Pitfall 4, dual-directory) |
| sig-2026-02-22-codebase-mapper-deleted-during-extraction | signal | File deletion during refactoring | Common Pitfalls (scope awareness) |

The lesson `les-2026-02-16-dynamic-path-resolution-for-install-context` (architecture/path-resolution) was checked but is not directly relevant to schema design -- it concerns installer path resolution, not signal schema.

Spikes avoided: 0 (no existing spikes in KB)
