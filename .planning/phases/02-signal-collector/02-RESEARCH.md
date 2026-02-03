# Phase 2: Signal Collector - Research

**Researched:** 2026-02-02
**Domain:** Automated deviation detection and signal persistence in a Markdown/YAML agent system
**Confidence:** HIGH

## Summary

The Signal Collector phase adds automated detection of workflow deviations, debugging struggles, and config mismatches during GSD execution, persisting them as structured signal files in the Phase 1 knowledge base at `~/.claude/gsd-knowledge/signals/`. The domain is well-understood because the entire system is specification-driven Markdown -- detection is text comparison between PLAN.md and SUMMARY.md artifacts, and persistence uses the signal template and schema already defined in Phase 1.

The critical architectural challenge is the wrapper pattern (SGNL-08): signal collection must integrate with execution without modifying `execute-phase.md` or any upstream files. The research identifies two complementary integration points: (1) a post-execution signal analysis workflow invoked automatically after phase verification, and (2) a standalone `/gsd:signal` command for manual signal logging. Both write to the same KB using the Phase 1 signal template and rebuild the index after writes.

Detection itself is straightforward text analysis: compare PLAN.md task lists against SUMMARY.md results for deviations, check config.json `model_profile` against executor spawn records for config mismatches, and scan SUMMARY.md "Issues Encountered" and "Deviations from Plan" sections for struggle indicators. No NLP libraries or external dependencies are needed -- the structured Markdown format makes grep/string matching sufficient.

**Primary recommendation:** Build the signal collector as a set of new Markdown files (one agent, one workflow, one command, one reference doc) that perform post-execution text analysis of existing PLAN.md/SUMMARY.md artifacts and write signal entries to the Phase 1 knowledge base. Use a wrapper command pattern where a new command delegates to execute-phase then runs signal collection.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Bash string matching | built-in | PLAN vs SUMMARY comparison, pattern detection | Structured Markdown makes grep/diff sufficient; no NLP needed |
| Phase 1 KB schema | 1.0.0 | Signal file format (YAML frontmatter + Markdown body) | Already defined in `.claude/agents/knowledge-store.md` |
| Phase 1 signal template | 1.0.0 | Copy-and-fill template for signal entries | Already exists at `.claude/agents/kb-templates/signal.md` |
| Phase 1 index rebuild | 1.0.0 | Update index after signal writes | Already exists at `.claude/agents/kb-rebuild-index.sh` |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GSD agent pattern | existing | Signal collector agent definition | Agent performs detection and writes signals |
| GSD command pattern | existing | `/gsd:signal` manual command | User-facing signal creation |
| GSD workflow pattern | existing | Post-execution signal analysis | Wrapper workflow after execute-phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Text comparison | Embeddings/semantic similarity | Massive overkill; PLAN and SUMMARY share explicit structure (task names, file lists) making string matching precise |
| Post-execution analysis | Real-time monitoring | Real-time requires hooks into execute-phase (violates wrapper constraint); post-execution reads the same artifacts |
| Bash-based detection | Node.js detection script | Adds runtime code; agents already use Bash for everything; structured Markdown is trivially parseable |

**Installation:**
```bash
# No installation needed -- zero new dependencies
# All deliverables are new Markdown files following existing patterns
```

## Architecture Patterns

### Recommended Project Structure
```
# New files only (fork constraint)
commands/gsd/
├── signal.md                           # /gsd:signal manual command (SGNL-10)

agents/
├── gsd-signal-collector.md             # Signal detection agent

get-shit-done/
├── workflows/
│   └── collect-signals.md              # Post-execution signal analysis workflow
├── references/
│   └── signal-detection.md             # Detection rules and severity classification

# Phase 1 infrastructure (already exists, used as-is)
.claude/agents/
├── knowledge-store.md                  # KB schema reference
├── kb-templates/signal.md              # Signal entry template
├── kb-rebuild-index.sh                 # Index rebuild script
├── kb-create-dirs.sh                   # Directory initialization
```

### Pattern 1: Wrapper Command (SGNL-08 compliance)
**What:** A new workflow `collect-signals.md` that runs after execute-phase completes. The execute-phase command itself is NOT modified. Signal collection is triggered by:
- Option A: A new wrapper command `/gsd:execute-phase-r` that runs execute-phase then collect-signals
- Option B: The execute-phase verification step (`verify_phase_goal`) is followed by a signal collection step that's added as a natural extension -- but this requires editing execute-phase.md
- Option C (RECOMMENDED): Signal collection is invoked automatically by the verifier agent or as a final step in the existing execute-phase flow... but again requires edits.

**Resolution:** The cleanest fork-friendly approach is to make signal collection a standalone workflow that reads existing artifacts. It can be invoked:
1. Automatically from a wrapper command that orchestrates execute-phase + signal-collect
2. Standalone via `/gsd:collect-signals N` after any execution
3. As part of verification (if we create a wrapper verifier)

**Recommendation:** Create a wrapper command `/gsd:execute-phase-r` (or simply override by creating the file at the same path in the fork) that delegates to the standard execute-phase workflow then runs signal collection. Alternatively, if the fork already replaces commands during install, the existing `execute-phase.md` in the fork's `commands/gsd/` can include the signal collection step since **the fork owns these files**. The "no upstream edit" constraint means not editing files in the UPSTREAM repo -- but this IS the fork repo.

**Critical clarification:** Re-reading the fork constraint: "user does not maintain upstream repo, so no upstream file edits." This means the user's fork IS the repo. The constraint is about not modifying files that came from upstream so that `git merge upstream/main` remains clean. Therefore: we CANNOT edit `commands/gsd/execute-phase.md` or `get-shit-done/workflows/execute-phase.md` because those came from upstream. We CAN add entirely new files.

**Final recommendation:** Create a new command `commands/gsd/collect-signals.md` that is invoked after execute-phase. The execute-phase output already suggests next steps -- the user would run `/gsd:collect-signals N` after execution. To make it feel automatic, the planner should structure the task descriptions so the signal collection agent reads the same artifacts the verifier reads and runs in parallel or sequentially after verification.

**When to use:** After every phase execution.
**Example flow:**
```
User: /gsd:execute-phase 2
  → execute-phase runs normally (unchanged)
  → Phase complete, verified

User: /gsd:collect-signals 2
  → Signal collector reads all PLANs and SUMMARYs in phase 2
  → Detects deviations, struggles, config mismatches
  → Writes signal files to ~/.claude/gsd-knowledge/signals/{project}/
  → Rebuilds index
  → Reports: "3 signals detected (1 critical, 2 notable)"
```

### Pattern 2: Detection-by-Comparison (SGNL-01)
**What:** Compare structured sections of PLAN.md against SUMMARY.md to detect deviations.
**When to use:** Post-execution analysis of every completed plan.
**Detection points:**

| PLAN.md Section | SUMMARY.md Section | Signal Type |
|-----------------|-------------------|-------------|
| `<tasks>` list (task names, counts) | `## Task Commits` (completed tasks) | deviation: missing/added/reordered tasks |
| `files_modified:` frontmatter | `## Files Created/Modified` | deviation: unexpected files touched |
| `<verification>` criteria | `## Deviations from Plan` | deviation: auto-fixes indicate plan gaps |
| `must_haves:` truths | VERIFICATION.md gaps | deviation: goal not fully met |
| (no expected issues) | `## Issues Encountered` | struggle: problems encountered |
| `autonomous: true` | checkpoint returns | struggle: needed human intervention |

**Example detection logic (pseudo-bash):**
```bash
# Count tasks in PLAN vs SUMMARY
PLAN_TASK_COUNT=$(grep -c '<task ' "$PLAN_FILE")
SUMMARY_TASK_COUNT=$(grep -c '^\d\+\.' "$SUMMARY_FILE" | head -1)

# Check for deviations section content
DEVIATIONS=$(sed -n '/## Deviations from Plan/,/## Issues/p' "$SUMMARY_FILE")
if echo "$DEVIATIONS" | grep -q "Auto-fixed Issues"; then
  # Signal: plan had gaps that required auto-fixes
fi

# Check for issues encountered
ISSUES=$(sed -n '/## Issues Encountered/,/## /p' "$SUMMARY_FILE")
if ! echo "$ISSUES" | grep -q "None"; then
  # Signal: execution encountered problems
fi
```

### Pattern 3: Severity Auto-Assignment (SGNL-04)
**What:** Automatically classify signal severity based on detection source and impact.
**When to use:** Every signal creation, with manual override via `/gsd:signal`.

| Condition | Severity | Rationale |
|-----------|----------|-----------|
| Verification failed (gaps_found) | critical | Phase goal not met |
| Config mismatch (wrong model spawned) | critical | Resource misallocation |
| 3+ auto-fixes in single plan | notable | Plan quality issue |
| Issues encountered (non-trivial) | notable | Execution friction |
| Task order changed / files differ | trace | Minor deviation, don't persist |
| Single auto-fix | trace | Normal course correction, don't persist |

Per SGNL-04: only `critical` and `notable` are persisted to KB. `trace` is logged in the collection report but not written to disk.

### Pattern 4: Deduplication (SGNL-05)
**What:** Before writing a signal, check existing signals for duplicates. If found, increment count rather than creating new file.
**When to use:** Every signal write.

**Match criteria (recommended):**
- Same `signal_type` (deviation/struggle/config-mismatch)
- Same `project`
- Similar slug (fuzzy: same key terms)
- Within same phase OR across phases for recurring patterns

**Implementation:** Read existing signals for the project from the index, compare `signal_type` and tags. If a match is found:
- Add `occurrence_count: N` field to the existing signal's frontmatter (this is an update to an "immutable" signal -- BUT the CONTEXT.md says duplicate collapsing is Claude's discretion)
- Append occurrence date and context to the signal body
- Do NOT create a new file

**Alternative (simpler, recommended):** Signals are immutable per Phase 1 spec. Instead of updating existing signals, create the new signal but add a `related_signals: [sig-id-1, sig-id-2]` field linking to duplicates. The reflection engine (Phase 4) handles pattern detection across related signals. This respects immutability while tracking recurrence.

**Signal cap (SGNL-09):** Max 10 persistent signals per phase. If limit reached, only persist if new signal severity >= lowest existing severity. Replace lowest-severity signal if so. This prevents noise accumulation.

### Pattern 5: Polarity Field (from CONTEXT.md)
**What:** Signals include a `polarity` field: positive/negative/neutral.
**When to use:** All signals.

| Detection | Polarity |
|-----------|----------|
| Verification gaps, struggles, config mismatches | negative |
| Unexpected improvements, ahead-of-schedule, cleaner-than-planned | positive |
| Task reordering with no impact, minor file differences | neutral |

This captures "happy accidents" -- the CONTEXT.md specifically calls out positive deviations as signals worth capturing.

### Anti-Patterns to Avoid
- **Modifying execute-phase.md:** Violates fork constraint. All signal collection is new files only.
- **Real-time detection during execution:** Executor agents run in fresh contexts; intercepting their output requires modifying their spawn. Use post-execution analysis instead.
- **Over-signaling:** Logging every minor deviation creates noise. The trace severity level + per-phase cap (10) prevent this.
- **Complex NLP for detection:** PLAN.md and SUMMARY.md have structured sections with predictable format. String matching is sufficient and reliable.
- **Signal files without index rebuild:** Every write to KB must be followed by index rebuild. Use `kb-rebuild-index.sh` after batch signal creation.
- **Editing existing signals for dedup:** Signals are immutable per Phase 1 spec. Use `related_signals` field instead of updating existing entries.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Signal file creation | Custom file writer | Copy Phase 1 signal template + fill fields | Template already has correct schema |
| Index update after signals | Custom index updater | `kb-rebuild-index.sh` | Already atomic, handles all entry types |
| YAML frontmatter parsing | Custom parser | Line-by-line grep (existing pattern) | Pattern proven in codebase, zero deps |
| Signal severity classification | ML classifier | Rule-based lookup table | Structured input makes rules sufficient |
| Frustration detection | Sentiment analysis library | Pattern matching on known phrases | "this is broken", "still not working", "tried everything" -- finite list works |
| Duplicate detection | Embedding similarity | Tag + signal_type matching via index | Index already has all fields needed for matching |

**Key insight:** The entire signal collector is a text analysis pipeline with structured inputs (PLAN.md, SUMMARY.md, VERIFICATION.md, config.json) and structured outputs (signal.md files in KB). No libraries needed because the document formats are controlled and predictable.

## Common Pitfalls

### Pitfall 1: Detection False Positives
**What goes wrong:** Signal collector flags normal variations as deviations (e.g., executor added a helpful comment, reformatted a file).
**Why it happens:** Overly strict comparison between PLAN and SUMMARY.
**How to avoid:** Focus detection on STRUCTURAL deviations (missing tasks, unexpected files, auto-fixes, issues encountered) not CONTENT differences. The SUMMARY.md "Deviations from Plan" section is already curated by the executor -- use it as primary signal source rather than doing independent comparison.
**Warning signs:** More than 5 signals per plan execution; most signals are trace-level.

### Pitfall 2: Signal Noise Overwhelming KB
**What goes wrong:** Knowledge base fills with low-value signals that obscure important ones.
**Why it happens:** No filtering or severity thresholds.
**How to avoid:** Three-tier severity (critical/notable/trace) with only top two persisted. Per-phase cap of 10 signals. Trace-level signals logged in collection report but not written to KB.
**Warning signs:** More than 20 signals per phase; index.md signals section exceeds 100 rows.

### Pitfall 3: Wrapper Pattern Coupling
**What goes wrong:** Signal collector depends on specific execute-phase internal behavior that changes in upstream.
**Why it happens:** Reading executor output format, wave structure, or verification internals.
**How to avoid:** Signal collector should ONLY read stable output artifacts: PLAN.md, SUMMARY.md, VERIFICATION.md, config.json. These are documented formats (templates exist). Never depend on execute-phase's internal workflow steps or variables.
**Warning signs:** Signal collector breaks after GSD upstream update; collector reads workflow files instead of output artifacts.

### Pitfall 4: Forgetting Phase 1 Immutability Rule
**What goes wrong:** Deduplication logic updates existing signal files, violating the immutability rule.
**Why it happens:** Natural impulse to increment a count field on existing signals.
**How to avoid:** Use `related_signals` cross-references on new signals instead of updating existing ones. Let Phase 4 (Reflection Engine) handle pattern detection across related signals.
**Warning signs:** Existing signal files have `updated` timestamps different from `created`.

### Pitfall 5: Config Mismatch Detection Scope
**What goes wrong:** Flagging every config mismatch including harmless ones (e.g., model fallback from opus to sonnet when opus unavailable).
**Why it happens:** Strict equality check between config and actual without understanding intent.
**How to avoid:** Only flag mismatches where the outcome was likely affected. If `model_profile: quality` and executor ran with sonnet, that's a signal. If model_profile is balanced and sonnet was used, that's expected. Compare against the model lookup table in execute-phase.md.
**Warning signs:** Config mismatch signals on every execution even when expected models were used.

### Pitfall 6: Manual Signal Command Complexity
**What goes wrong:** `/gsd:signal` becomes a complex multi-step wizard that discourages use.
**Why it happens:** Over-engineering the "hybrid interaction" pattern.
**How to avoid:** Accept all info in one line: `/gsd:signal "Auth retry loop detected" --severity critical`. If args missing, ask ONE follow-up question (severity). Write signal immediately. Show confirmation.
**Warning signs:** More than 2 interaction rounds to create a manual signal.

## Code Examples

### Signal Detection Agent Pattern
```markdown
# Example: gsd-signal-collector.md agent structure
---
name: gsd-signal-collector
description: Detects workflow deviations, struggles, and config mismatches from execution artifacts
tools: Read, Write, Bash, Glob, Grep
color: yellow
---

<role>
You are a signal detection agent. You analyze execution artifacts (PLAN.md, SUMMARY.md,
VERIFICATION.md) to detect and persist workflow deviations, debugging struggles, and
config mismatches as signal entries in the knowledge base.
</role>

<detection_rules>
## 1. Deviation Detection (SGNL-01)
Read each PLAN.md and its corresponding SUMMARY.md:
- Compare task counts (plan vs completed)
- Check "Deviations from Plan" section for auto-fixes
- Check VERIFICATION.md for gaps_found status
- Compare files_modified in plan frontmatter vs Files Created/Modified in summary

## 2. Config Mismatch Detection (SGNL-02)
Read config.json model_profile and compare against SUMMARY.md executor information:
- quality profile should use opus for executor
- balanced profile should use sonnet for executor
- Flag if mismatch detected

## 3. Struggle Detection (SGNL-03)
Scan SUMMARY.md for:
- "Issues Encountered" section with non-trivial content
- Multiple auto-fixes (3+) indicating plan quality problems
- Duration significantly exceeding plan complexity
- Checkpoint returns on autonomous plans
</detection_rules>
```

### Signal File Creation
```bash
# Source: Phase 1 knowledge-store.md schema + signal template
# Create a signal entry from detected deviation

PROJECT_NAME=$(basename "$(pwd)" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')
KB_DIR="$HOME/.claude/gsd-knowledge"
DATE=$(date -u +"%Y-%m-%d")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
SLUG="auth-retry-loop"  # derived from detection

mkdir -p "$KB_DIR/signals/$PROJECT_NAME"

cat > "$KB_DIR/signals/$PROJECT_NAME/${DATE}-${SLUG}.md" << 'SIGNAL'
---
id: sig-2026-02-02-auth-retry-loop
type: signal
project: get-shit-done-reflect
tags: [retry, error-handling, deviation]
created: 2026-02-02T14:30:00Z
updated: 2026-02-02T14:30:00Z
durability: workaround
status: active
severity: notable
signal_type: struggle
polarity: negative
phase: 3
plan: 2
source: auto
occurrence_count: 1
---

## What Happened

OAuth token refresh logic entered retry loop during Phase 3 Plan 2 execution.

## Context

Executor attempted token refresh 7 times before task timed out. SUMMARY.md
logged this under "Issues Encountered" as a non-trivial problem requiring workaround.

## Potential Cause

Missing check for refresh token expiry -- only access token expiry was handled in plan.
SIGNAL

# Rebuild index after write
bash "$HOME/.claude/agents/kb-rebuild-index.sh"
```

### Frustration Detection Patterns (SGNL-06)
```bash
# Pattern matching for implicit frustration in conversation context
# These are indicators, not definitive -- agent uses judgment

FRUSTRATION_PATTERNS=(
  "still not working"
  "this is broken"
  "tried everything"
  "keeps failing"
  "doesn't work"
  "same error"
  "again"
  "frustrated"
  "why won't"
  "makes no sense"
  "how is this still"
  "wasting time"
)

# Agent scans conversation context for these patterns
# If 2+ patterns found in recent messages, log frustration signal
```

### Deduplication Check
```bash
# Before writing a new signal, check for related existing signals
KB_DIR="$HOME/.claude/gsd-knowledge"
PROJECT="get-shit-done-reflect"
SIGNAL_TYPE="deviation"
NEW_TAGS="retry,error-handling"

# Search existing signals for same type and overlapping tags
EXISTING=$(grep -l "^signal_type: $SIGNAL_TYPE" "$KB_DIR/signals/$PROJECT/"*.md 2>/dev/null)
for sig in $EXISTING; do
  SIG_TAGS=$(grep "^tags:" "$sig" | head -1)
  # Check for tag overlap
  for tag in $(echo "$NEW_TAGS" | tr ',' '\n'); do
    if echo "$SIG_TAGS" | grep -q "$tag"; then
      SIG_ID=$(grep "^id:" "$sig" | head -1 | sed 's/^id:[[:space:]]*//')
      echo "RELATED: $SIG_ID"
      break
    fi
  done
done
# If related signals found, add related_signals field to new signal frontmatter
```

### Per-Phase Signal Cap (SGNL-09)
```bash
# Count existing signals for this phase
KB_DIR="$HOME/.claude/gsd-knowledge"
PROJECT="get-shit-done-reflect"
PHASE=2
MAX_SIGNALS=10

PHASE_SIGNAL_COUNT=$(grep -l "^phase: $PHASE" "$KB_DIR/signals/$PROJECT/"*.md 2>/dev/null | wc -l | tr -d ' ')

if [ "$PHASE_SIGNAL_COUNT" -ge "$MAX_SIGNALS" ]; then
  # Only persist if new signal severity is higher than lowest existing
  # Find lowest severity signal for this phase
  LOWEST_SEVERITY="critical"  # start high, find lower
  for sig in $(grep -l "^phase: $PHASE" "$KB_DIR/signals/$PROJECT/"*.md 2>/dev/null); do
    SEV=$(grep "^severity:" "$sig" | head -1 | sed 's/^severity:[[:space:]]*//')
    # severity ordering: critical > notable (trace already filtered)
    if [ "$SEV" = "notable" ]; then
      LOWEST_SEVERITY="notable"
    fi
  done
  echo "Phase $PHASE at signal cap ($MAX_SIGNALS). Lowest: $LOWEST_SEVERITY"
fi
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual post-mortem reviews | Automated artifact comparison | 2024+ (AI agent era) | Detection happens every execution, not just when humans remember |
| Unstructured error logs | Structured signal files with severity and type | Phase 2 design | Enables pattern analysis in Phase 4 |
| Modify existing workflows for monitoring | Wrapper/additive pattern | GSD fork design constraint | Clean upstream merges, independent evolution |

**Deprecated/outdated:**
- None -- this domain is being designed fresh for the GSD system

## Open Questions

1. **Wrapper invocation timing**
   - What we know: Signal collection must happen after execute-phase completes, reading its output artifacts
   - What's unclear: Whether users will remember to run `/gsd:collect-signals` after every execution, or if this needs to be more automatic
   - Recommendation: Start with manual invocation (`/gsd:collect-signals N`). If adoption is low, consider adding a reminder in execute-phase's "offer next steps" output (which would require one small edit to execute-phase.md -- discuss with user if needed)

2. **Frustration detection scope (SGNL-06)**
   - What we know: Pattern match user messages for frustration signals
   - What's unclear: The signal collector runs POST-execution, reading artifacts. User messages during execution are not captured in SUMMARY.md. How does frustration detection work?
   - Recommendation: Frustration detection via `/gsd:signal` (manual) during conversation, NOT post-execution. The SGNL-06 pattern matching should be implemented in the `/gsd:signal` command's context extraction -- when a user runs `/gsd:signal`, the agent scans recent conversation for frustration indicators to auto-populate context. Alternatively, frustration detection could be added to executor agent instructions as an additive reference doc.

3. **Signal schema extensions beyond Phase 1**
   - What we know: Phase 1 signal schema has severity, signal_type, phase, plan fields
   - What's unclear: Phase 2 needs additional fields: `polarity`, `source` (auto/manual), `occurrence_count`, `related_signals`
   - Recommendation: Add these as optional fields in the signal entries. The Phase 1 schema is extensible (agents can add freeform fields). Document the new fields in the signal-detection reference doc. Consider updating knowledge-store.md in a later plan to formalize them.

4. **Detection timing: phase-end only or mid-execution**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: Whether mid-execution detection is possible without modifying executor agents
   - Recommendation: Phase-end only for automatic detection (wrapper pattern). Mid-execution signals come from `/gsd:signal` manual command only. This keeps the architecture clean and avoids modifying executor agents.

5. **Default behavior: opt-in or opt-out**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: Whether signal collection should run automatically or require explicit invocation
   - Recommendation: Opt-in for Phase 2 (explicit `/gsd:collect-signals N` invocation). The system is new and users should see what it produces before it runs automatically. Can make it opt-out in a future iteration.

## Sources

### Primary (HIGH confidence)
- `.claude/agents/knowledge-store.md` -- Phase 1 KB schema, signal type definition, directory layout
- `.claude/agents/kb-templates/signal.md` -- Signal entry template with frontmatter fields
- `.claude/agents/kb-rebuild-index.sh` -- Index rebuild script for post-write updates
- `get-shit-done/workflows/execute-phase.md` -- Execution workflow showing artifacts produced
- `get-shit-done/templates/summary.md` -- SUMMARY.md template with structured sections for detection
- `commands/gsd/execute-phase.md` -- Command structure showing wave execution pattern
- `.planning/phases/02-signal-collector/02-CONTEXT.md` -- User decisions constraining implementation
- `.planning/codebase/ARCHITECTURE.md` -- Multi-layer architecture (command/workflow/agent/template/reference)
- `.planning/codebase/CONVENTIONS.md` -- File naming, code style, fork conventions
- `.planning/codebase/STRUCTURE.md` -- Directory layout showing where new files go

### Secondary (MEDIUM confidence)
- Phase 1 PLAN.md + SUMMARY.md artifacts -- Confirmed exact structure of detection inputs
- `.planning/phases/01-knowledge-store/01-VERIFICATION.md` -- Verification format showing gaps_found detection source

### Tertiary (LOW confidence)
- None -- all findings derived from codebase analysis of existing artifacts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; uses existing Phase 1 infrastructure exclusively
- Architecture: HIGH -- wrapper pattern well-defined by codebase constraints; all new files follow existing patterns
- Pitfalls: HIGH -- derived from concrete codebase analysis (structured document formats, fork constraint, immutability rules)

**Research date:** 2026-02-02
**Valid until:** 2026-04-02 (stable domain -- internal specification system, not external dependency)
