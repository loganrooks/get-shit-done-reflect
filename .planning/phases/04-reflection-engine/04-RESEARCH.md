# Phase 4: Reflection Engine - Research

**Researched:** 2026-02-05
**Domain:** Pattern detection, lesson distillation, and self-reflection for a Markdown/YAML agent knowledge base
**Confidence:** HIGH

## Summary

The Reflection Engine is the closing loop of the GSD self-improvement cycle. It analyzes accumulated signals from Phase 2, detects recurring patterns, compares planned vs actual execution at phase-end, distills actionable lessons, and stores them in the knowledge base for future surfacing. The domain is well-understood because the entire system operates on structured Markdown artifacts with predictable formats -- signals, spikes, PLAN.md, and SUMMARY.md files all follow defined schemas, making pattern detection a text comparison and aggregation task rather than requiring NLP or ML.

The core technical challenge is implementing severity-weighted pattern detection thresholds (per CONTEXT.md: 2 occurrences for critical/high signals, 5+ for lower severity) while avoiding time-based rolling windows that would lose infrequent-but-persistent issues. Cross-project detection leverages the existing user-level KB structure at `~/.claude/gsd-knowledge/` -- the index already tracks project names, making cross-project signal scanning straightforward.

Semantic drift detection (RFLC-06) is the most novel requirement. Unlike embedding-based drift detection used in production ML systems, this implementation can use simpler heuristics: track verification gap trends, auto-fix frequency, deviation-to-plan ratios, and signal severity distributions over time. No external ML dependencies needed.

**Primary recommendation:** Build the reflection engine as a set of new Markdown files (one agent, one workflow, one command, one reference doc) that perform post-hoc analysis of signal files and phase artifacts, detect patterns via tag/type clustering and occurrence counting, distill lessons using the Phase 1 lesson template, and optionally integrate with the complete-milestone workflow. Use Claude's judgment for pattern grouping, confidence expression, and actionability level -- these are marked as Claude's discretion in CONTEXT.md.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Phase 1 KB schema | 1.0.0 | Lesson file format (YAML frontmatter + Markdown body) | Already defined in `knowledge-store.md` |
| Phase 1 lesson template | 1.0.0 | Copy-and-fill template for lesson entries | Already exists at `.claude/agents/kb-templates/lesson.md` |
| Phase 2 signal schema | 1.0.0 | Signal file format with severity, tags, polarity | Already defined and in use |
| Phase 1 index rebuild | 1.0.0 | Update index after lesson writes | Already exists at `.claude/agents/kb-rebuild-index.sh` |
| Bash text processing | built-in | Tag extraction, occurrence counting, pattern matching | Structured frontmatter makes grep/awk sufficient |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| GSD agent pattern | existing | Reflection agent definition | Agent performs pattern detection and lesson distillation |
| GSD command pattern | existing | `/gsd:reflect` command | User-facing reflection trigger |
| GSD workflow pattern | existing | Reflection workflow, milestone integration | Orchestration layer |
| Phase artifacts | PLAN.md, SUMMARY.md, VERIFICATION.md | Phase-end reflection inputs | Compare planned vs actual execution |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tag/type clustering | Embeddings/semantic similarity | Massive overkill; signals share explicit tags in frontmatter making string matching precise |
| Occurrence counting | Time-series anomaly detection | Adds ML dependency; simple counts with severity weighting are sufficient per CONTEXT.md |
| Heuristic drift detection | LLM-as-judge evaluation | Would require external API calls; heuristics on structured artifacts are self-contained |
| File-based pattern detection | Database queries | Breaks zero-dependency philosophy; grep on index.md is fast enough for expected scale |

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
├── reflect.md                           # /gsd:reflect command (RFLC-03)

agents/
├── gsd-reflector.md                     # Reflection and pattern detection agent

get-shit-done/
├── workflows/
│   └── reflect.md                       # Reflection workflow
├── references/
│   └── reflection-patterns.md           # Pattern detection rules and lesson distillation

# Phase 1/2 infrastructure (already exists, used as-is)
.claude/agents/
├── knowledge-store.md                   # KB schema reference
├── kb-templates/lesson.md               # Lesson entry template
├── kb-rebuild-index.sh                  # Index rebuild script
├── gsd-signal-collector.md              # Signal schema reference
```

### Pattern 1: Severity-Weighted Pattern Detection (CONTEXT.md Decision)
**What:** Different occurrence thresholds based on signal severity. Critical/high signals surface as patterns after 2 occurrences; lower severity requires 5+ occurrences.
**When to use:** Every pattern detection run.
**Rationale:** Wide variety of scenarios -- must catch critical issues early while not drowning in noise from minor friction.

**Detection logic:**
```bash
# Pseudocode for pattern detection
SIGNALS=$(cat ~/.claude/gsd-knowledge/index.md | grep "^| sig-")

# Group by signal_type + tag combination
for pattern in $(extract_patterns "$SIGNALS"); do
  count=$(count_occurrences "$pattern")
  max_severity=$(get_max_severity "$pattern")

  case "$max_severity" in
    critical|high)
      [ "$count" -ge 2 ] && emit_pattern "$pattern" "$count" ;;
    medium|low)
      [ "$count" -ge 5 ] && emit_pattern "$pattern" "$count" ;;
  esac
done
```

### Pattern 2: Signal Clustering for Pattern Detection
**What:** Group signals by shared characteristics to identify recurring issues.
**When to use:** Pattern detection phase of reflection.

**Clustering criteria (priority order):**
1. **Same signal_type + 2+ overlapping tags** -- strongest match
2. **Same project + same signal_type + similar slug** -- project-specific recurrence
3. **Cross-project: same tags + same signal_type** -- potential global pattern

**Existing signal schema fields used for clustering:**
- `signal_type`: deviation, struggle, config-mismatch, custom
- `tags`: [array of searchable tags]
- `project`: project name or `_global`
- `severity`: critical, high, medium, low
- `related_signals`: already captures some cross-references

**Pattern output structure:**
```markdown
## Pattern: {pattern-name}

**Signal type:** {deviation|struggle|config-mismatch}
**Occurrences:** {count}
**Severity:** {highest severity among grouped signals}
**Confidence:** {HIGH|MEDIUM|LOW based on occurrence count and consistency}

**Signals in pattern:**
| ID | Project | Date | Tags |
|----|---------|------|------|
| sig-X | project-a | 2026-02-01 | tag1, tag2 |
| sig-Y | project-b | 2026-02-03 | tag1, tag3 |

**Root cause hypothesis:** {Claude's assessment of why this pattern recurs}
**Recommended action:** {What to do about it}
```

### Pattern 3: Phase-End Reflection (RFLC-01)
**What:** Compare PLAN.md vs SUMMARY.md at phase completion to identify systemic deviations.
**When to use:** After phase verification completes (can be triggered by `/gsd:reflect {phase}` or milestone workflow).

**Comparison points:**
| PLAN.md Source | SUMMARY.md Source | Deviation Type |
|----------------|-------------------|----------------|
| Task list (count, order) | Task Commits (count, order) | Task mismatch |
| `files_modified` frontmatter | Files Created/Modified | File scope creep/shrink |
| Estimated duration (if present) | Actual duration | Time estimation error |
| `must_haves` truths | VERIFICATION.md gaps | Goal achievement failure |
| `autonomous: true` | Checkpoint returns | Autonomy failure |
| Empty "Issues Encountered" | Non-trivial issues | Unexpected friction |

**Reflection output:**
```markdown
## Phase {N} Reflection

**Plan:** {phase}-{plan}-PLAN.md
**Summary:** {phase}-{plan}-SUMMARY.md
**Overall alignment:** {HIGH|MEDIUM|LOW}

### Deviations Found

| Category | Planned | Actual | Impact |
|----------|---------|--------|--------|
| Task count | 5 | 6 | +1 auto-fix |
| File scope | 4 files | 7 files | +3 supporting files |
| Duration | ~30min | 48min | +60% (blocking issue) |

### Patterns Detected

{List of patterns from this phase's signals}

### Lessons Suggested

{Draft lessons based on deviations and patterns}
```

### Pattern 4: Lesson Distillation (RFLC-02)
**What:** Convert signal patterns into actionable lesson entries in the knowledge base.
**When to use:** When a pattern meets distillation criteria (occurrence threshold + confidence).

**Distillation criteria:**
1. Pattern meets severity-weighted threshold (2 for critical/high, 5 for others)
2. Pattern has consistent root cause hypothesis across occurrences
3. Actionable recommendation can be derived

**Lesson creation flow:**
1. Identify qualifying pattern
2. Draft lesson content:
   - `category`: From CONTEXT.md hierarchy (tooling, architecture, testing, workflow, external, environment)
   - `insight`: One-sentence actionable lesson
   - `evidence`: List of signal IDs that support this lesson
   - `confidence`: Based on occurrence count and consistency
   - `durability`: workaround, convention, or principle (inferred from pattern nature)
3. Determine scope:
   - Project-scoped if signals reference specific file paths, project structure
   - Global if signals reference named library/framework or external root cause
4. Write lesson file using Phase 1 template
5. Rebuild index

**Scope determination heuristics (from CONTEXT.md):**
- **Global scope indicators:** References named library/framework, root cause is external (library bug, documentation gap, tool limitation)
- **Project scope indicators:** References specific file paths, project structure, local config, root cause is internal
- **Default:** Project-scoped when uncertain (safer, less global noise)

### Pattern 5: Cross-Project Pattern Detection (SGNL-07)
**What:** Scan signals across all projects to identify recurring issues that transcend individual projects.
**When to use:** During reflection with cross-project scope enabled.

**Implementation approach:**
1. Read index.md (already contains all projects' signals)
2. Group signals by tag + signal_type, ignoring project field
3. Apply severity-weighted thresholds
4. For matching patterns, check `likely_scope: global` hints on individual signals
5. If pattern spans 2+ projects with same root cause: candidate for global lesson

**Cross-project signal access (from CONTEXT.md):**
- KB is user-level (`~/.claude/gsd-knowledge/`) -- cross-project is natural model
- User-level default in `/gsd:settings`: opt-in or opt-out for cross-project signal sharing
- Per-project override available in `.planning/config.json`

### Pattern 6: Milestone Integration (RFLC-04)
**What:** Optional reflection step as part of milestone completion workflow.
**When to use:** When user runs `/gsd:complete-milestone` (integration point identified).

**Integration approach (additive, not modifying upstream):**
1. Create reference doc `get-shit-done/references/milestone-reflection.md`
2. In reflection workflow, detect if called from milestone context
3. If milestone context: run full reflection across all milestone phases
4. Output: reflection summary included in milestone archive

**Trigger behavior (Claude's discretion per CONTEXT.md):**
- Default: Optional -- user can skip reflection during milestone completion
- Output: Terminal summary with pattern counts and lesson suggestions
- Depth: Medium -- check all phases in milestone, don't drill into individual tasks

### Pattern 7: Semantic Drift Detection (RFLC-06)
**What:** Track whether agent output quality degrades over time.
**When to use:** Periodic check during reflection, can be triggered by recurring quality signals.

**Heuristic indicators (no ML required):**
1. **Verification gap trend:** Track `gaps_found` rate across phases
2. **Auto-fix frequency trend:** Track auto-fixes per plan over time
3. **Signal severity trend:** Track critical/high signal rate over time
4. **Deviation-to-plan ratio trend:** Are deviations increasing?

**Detection logic:**
```bash
# Compare recent N phases against baseline
RECENT_PHASES=5
BASELINE_PHASES=10

recent_gap_rate=$(calculate_gap_rate recent $RECENT_PHASES)
baseline_gap_rate=$(calculate_gap_rate baseline $BASELINE_PHASES)

# Flag if recent is significantly worse
if (( $(echo "$recent_gap_rate > $baseline_gap_rate * 1.5" | bc -l) )); then
  emit_drift_warning "Verification gaps increased by 50%+ in last $RECENT_PHASES phases"
fi
```

**Drift report:**
```markdown
## Semantic Drift Check

**Period:** Last {N} phases
**Baseline:** Previous {M} phases

| Metric | Baseline | Recent | Trend |
|--------|----------|--------|-------|
| Verification gaps | 12% | 28% | +133% (concerning) |
| Auto-fixes/plan | 1.2 | 2.8 | +133% (concerning) |
| Critical signals | 0.4/phase | 0.9/phase | +125% (concerning) |

**Assessment:** {STABLE|DRIFTING|CONCERNING}
**Recommendation:** {Action if drift detected}
```

### Anti-Patterns to Avoid
- **Modifying upstream files:** All reflection components are new files only
- **Time-based rolling windows:** Per CONTEXT.md, must handle infrequent but persistent issues. Recency factors into priority but old signals with same root cause should still cluster.
- **Automatic lesson promotion to global:** Per CONTEXT.md autonomy tie-in: YOLO mode auto-promotes high-confidence global signals, interactive mode suggests and user confirms
- **ML-based classification:** Adds dependencies and opacity; heuristic rules on structured data are sufficient and debuggable
- **Editing existing lessons without user awareness:** Lessons update-in-place per Phase 1 spec, but user should be informed when lessons evolve
- **Pattern detection on every signal write:** Too expensive. Pattern detection runs on reflection trigger, not continuously.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Lesson file creation | Custom file writer | Copy Phase 1 lesson template + fill fields | Template already has correct schema |
| Index update after lessons | Custom index updater | `kb-rebuild-index.sh` | Already atomic, handles all entry types |
| YAML frontmatter parsing | Custom parser | Line-by-line grep (existing pattern) | Pattern proven in codebase, zero deps |
| Signal clustering | Embedding similarity | Tag + signal_type matching via index | Index already has all fields needed |
| Root cause inference | Complex NLP | Claude's judgment with structured input | Agent can read signal context and infer |
| Cross-project scanning | Custom project discovery | Read index.md project column | Index already tracks all projects |

**Key insight:** The reflection engine is a text analysis and aggregation layer. Signals, spikes, and phase artifacts are all structured Markdown with predictable schemas. Pattern detection is tag matching and occurrence counting. Lesson distillation is template filling. No libraries needed because document formats are controlled and predictable.

## Common Pitfalls

### Pitfall 1: Over-Engineering Pattern Detection
**What goes wrong:** Building a complex ML-based pattern detection system when simple heuristics suffice.
**Why it happens:** Pattern detection sounds like an ML problem.
**How to avoid:** Signals have explicit tags and types in frontmatter. Grouping by tag + signal_type with occurrence counting is sufficient. Claude's judgment fills gaps.
**Warning signs:** Considering embedding models, semantic similarity libraries, or database query engines.

### Pitfall 2: Losing Infrequent Persistent Patterns
**What goes wrong:** Using a simple rolling time window that discards old signals, losing patterns that recur across long periods (e.g., library bug that appears every few months with new versions).
**Why it happens:** Time-based windows are the obvious solution.
**How to avoid:** Per CONTEXT.md: no simple rolling window. Use recency for priority ranking, not exclusion. Signals with same tags/type should cluster regardless of age.
**Warning signs:** "Delete signals older than X days" logic; patterns disappearing after time cutoff.

### Pitfall 3: Noisy Global Lessons
**What goes wrong:** Promoting too many lessons to global scope, making the knowledge base noisy for unrelated projects.
**Why it happens:** Over-aggressive pattern matching across projects.
**How to avoid:** Default to project-scoped when uncertain. Global scope requires clear indicators: named library/framework references, external root cause. YOLO mode for high-confidence auto-promotion; interactive mode requires user confirmation.
**Warning signs:** More than 20% of lessons are global-scoped; users complaining about irrelevant lesson suggestions.

### Pitfall 4: Reflection Running Too Frequently
**What goes wrong:** Reflection triggered on every signal write or plan completion, causing performance overhead.
**Why it happens:** Continuous improvement sounds appealing.
**How to avoid:** Reflection is event-driven: explicit `/gsd:reflect` command, phase-end trigger, or milestone integration. Not continuous background process.
**Warning signs:** Pattern detection running during task execution; noticeable slowdown in workflows.

### Pitfall 5: Circular Evidence in Lessons
**What goes wrong:** A lesson references signals that were created based on that lesson's existence, creating circular evidence.
**Why it happens:** Signals can reference lessons; lessons reference signals.
**How to avoid:** Signals are immutable after creation. Lessons update-in-place but evidence links point to signal IDs created BEFORE the lesson. New signals after lesson creation are new evidence, not circular.
**Warning signs:** Lesson evidence list contains signals created after the lesson's `created` timestamp.

### Pitfall 6: Phase-End Reflection Blocking Execution
**What goes wrong:** Phase cannot complete until reflection runs, even when user wants to proceed.
**Why it happens:** Mandatory reflection step.
**How to avoid:** Reflection is optional by default. Can be configured as required in `/gsd:settings`. Never blocks phase verification -- verification determines goal achievement; reflection is retrospective analysis.
**Warning signs:** Users skipping reflection every time; complaints about workflow friction.

## Code Examples

### Pattern Detection Agent Pattern
```markdown
# Example: gsd-reflector.md agent structure
---
name: gsd-reflector
description: Analyzes accumulated signals, detects patterns, compares plan vs execution, distills lessons
tools: Read, Write, Bash, Glob, Grep
color: magenta
---

<role>
You are a reflection agent. You analyze accumulated signals from the knowledge base,
detect recurring patterns using severity-weighted thresholds, compare PLAN.md vs
SUMMARY.md for phase-end reflection, and distill qualifying patterns into actionable
lessons.

Your job: Turn signal noise into signal patterns into actionable knowledge that
prevents the same mistakes from recurring.
</role>

<references>
Pattern detection rules and thresholds:
@get-shit-done/references/reflection-patterns.md

Knowledge base schema and lesson template:
@.claude/agents/knowledge-store.md
@.claude/agents/kb-templates/lesson.md
</references>
```

### Pattern Detection Logic
```bash
# Count signals by signal_type + primary tag combination
KB_DIR="$HOME/.claude/gsd-knowledge"
PROJECT="$1"  # Optional: filter by project

# Extract patterns from index (signal_type + first two tags)
extract_patterns() {
  local index="$KB_DIR/index.md"

  # Parse signal rows from index
  grep "^| sig-" "$index" | while read -r row; do
    # Extract: ID, Project, Severity, Tags
    id=$(echo "$row" | cut -d'|' -f2 | tr -d ' ')
    project=$(echo "$row" | cut -d'|' -f3 | tr -d ' ')
    severity=$(echo "$row" | cut -d'|' -f4 | tr -d ' ')
    tags=$(echo "$row" | cut -d'|' -f5 | tr -d ' ')

    # Read signal file for signal_type
    signal_file=$(find "$KB_DIR/signals" -name "${id#sig-}*.md" 2>/dev/null | head -1)
    [ -f "$signal_file" ] || continue

    signal_type=$(grep "^signal_type:" "$signal_file" | head -1 | sed 's/signal_type:[[:space:]]*//')

    # Emit pattern key: signal_type + first two tags
    primary_tags=$(echo "$tags" | cut -d',' -f1-2)
    echo "${signal_type}:${primary_tags}:${severity}:${id}"
  done
}

# Count occurrences per pattern and apply thresholds
detect_patterns() {
  local patterns=$(extract_patterns | sort)

  # Group by pattern key (signal_type:tags)
  echo "$patterns" | cut -d':' -f1-2 | sort | uniq -c | while read count pattern; do
    # Get max severity for this pattern
    max_severity=$(echo "$patterns" | grep "^$pattern:" | cut -d':' -f3 | sort -r | head -1)

    # Apply severity-weighted threshold
    case "$max_severity" in
      critical|high)
        threshold=2 ;;
      medium)
        threshold=4 ;;
      low)
        threshold=5 ;;
    esac

    if [ "$count" -ge "$threshold" ]; then
      echo "PATTERN: $pattern (count: $count, severity: $max_severity)"
    fi
  done
}
```

### Phase-End Reflection Logic
```bash
# Compare PLAN.md vs SUMMARY.md for a phase
PHASE_DIR=".planning/phases/02-signal-collector"
PHASE_NUM="02"

# Find all plan/summary pairs
for plan_file in "$PHASE_DIR"/*-PLAN.md; do
  [ -f "$plan_file" ] || continue

  plan_num=$(basename "$plan_file" | grep -o "$PHASE_NUM-[0-9]*" | cut -d'-' -f2)
  summary_file="${plan_file%-PLAN.md}-SUMMARY.md"

  [ -f "$summary_file" ] || continue

  echo "## Plan $PHASE_NUM-$plan_num Reflection"

  # Task count comparison
  plan_tasks=$(grep -c '<task ' "$plan_file" 2>/dev/null || echo 0)
  summary_tasks=$(grep -c '^[0-9]\. \*\*Task' "$summary_file" 2>/dev/null || echo 0)

  if [ "$plan_tasks" -ne "$summary_tasks" ]; then
    echo "- Task count mismatch: planned $plan_tasks, executed $summary_tasks"
  fi

  # Files scope comparison
  plan_files=$(grep "^files_modified:" "$plan_file" | sed 's/.*\[//' | sed 's/\]//' | tr ',' '\n' | wc -l)
  summary_files=$(grep -c '^\- `' "$summary_file" 2>/dev/null || echo 0)

  if [ "$summary_files" -gt "$((plan_files + 2))" ]; then
    echo "- File scope creep: planned $plan_files, touched $summary_files (+$((summary_files - plan_files)))"
  fi

  # Auto-fix count
  auto_fixes=$(grep -c '\*\*Rule [0-9]' "$summary_file" 2>/dev/null || echo 0)
  if [ "$auto_fixes" -gt 0 ]; then
    echo "- Auto-fixes applied: $auto_fixes"
  fi

  # Issues encountered
  issues=$(sed -n '/## Issues Encountered/,/## /p' "$summary_file" | grep -v "^#" | grep -v "^$" | grep -v "None")
  if [ -n "$issues" ]; then
    echo "- Issues encountered (non-trivial)"
  fi
done
```

### Lesson Creation from Pattern
```bash
# Create lesson file from detected pattern
KB_DIR="$HOME/.claude/gsd-knowledge"
DATE=$(date -u +"%Y-%m-%d")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

PATTERN_NAME="auth-retry-failures"
CATEGORY="external"
SUBCATEGORY="claude-api"
SCOPE="_global"  # or project name

SLUG="handle-auth-retry-exhaustion"
LESSON_ID="les-$DATE-$SLUG"

# Collect evidence (signal IDs in this pattern)
EVIDENCE='["sig-2026-02-01-auth-timeout", "sig-2026-02-03-api-retry", "sig-2026-02-05-token-expired"]'
EVIDENCE_COUNT=3

mkdir -p "$KB_DIR/lessons/$CATEGORY"

cat > "$KB_DIR/lessons/$CATEGORY/$SLUG.md" << LESSON
---
id: $LESSON_ID
type: lesson
project: $SCOPE
tags: [auth, retry, api, rate-limiting]
created: $TIMESTAMP
updated: $TIMESTAMP
durability: workaround
status: active
category: $CATEGORY
subcategory: $SUBCATEGORY
evidence_count: $EVIDENCE_COUNT
evidence: $EVIDENCE
confidence: high
---

## Lesson

Implement exponential backoff with jitter for API authentication retries, with a maximum of 3 attempts before failing gracefully.

## When This Applies

- Any API integration with authentication tokens
- OAuth refresh flows
- Rate-limited external services
- Claude API calls with potential throttling

## Recommendation

1. Use exponential backoff: 1s, 2s, 4s (base * 2^attempt)
2. Add jitter: random 0-500ms to avoid thundering herd
3. Cap at 3 retries maximum
4. On exhaustion: log signal, fail with clear error message
5. Do NOT retry indefinitely -- it masks the real issue

## Evidence

Distilled from 3 recurring auth retry signals across 2 projects:
- sig-2026-02-01-auth-timeout: Token refresh entered infinite loop
- sig-2026-02-03-api-retry: Claude API 429 responses with no backoff
- sig-2026-02-05-token-expired: Refresh token invalid, retry pointless
LESSON

# Rebuild index
bash "$KB_DIR/../agents/kb-rebuild-index.sh"
```

### Semantic Drift Detection
```bash
# Calculate drift metrics across phases
PLANNING_DIR=".planning/phases"

# Count verification gaps in recent vs baseline phases
count_gaps() {
  local start=$1
  local end=$2
  local total=0
  local gaps=0

  for i in $(seq $start $end); do
    phase_dir=$(printf "%02d" $i)
    verify_file=$(ls "$PLANNING_DIR/$phase_dir-"*/*-VERIFICATION.md 2>/dev/null | head -1)
    [ -f "$verify_file" ] || continue

    total=$((total + 1))
    if grep -q "Status: gaps_found" "$verify_file"; then
      gaps=$((gaps + 1))
    fi
  done

  [ $total -gt 0 ] && echo "$gaps $total" || echo "0 0"
}

# Compare recent (last 3 phases) vs baseline (phases 1-5)
recent=$(count_gaps 3 5)
baseline=$(count_gaps 1 2)

recent_gaps=$(echo $recent | cut -d' ' -f1)
recent_total=$(echo $recent | cut -d' ' -f2)
baseline_gaps=$(echo $baseline | cut -d' ' -f1)
baseline_total=$(echo $baseline | cut -d' ' -f2)

if [ $recent_total -gt 0 ] && [ $baseline_total -gt 0 ]; then
  recent_rate=$(echo "scale=2; $recent_gaps / $recent_total * 100" | bc)
  baseline_rate=$(echo "scale=2; $baseline_gaps / $baseline_total * 100" | bc)

  echo "Verification gap rate: baseline ${baseline_rate}%, recent ${recent_rate}%"

  # Flag if recent is 50%+ worse
  threshold=$(echo "$baseline_rate * 1.5" | bc)
  if (( $(echo "$recent_rate > $threshold" | bc -l) )); then
    echo "WARNING: Drift detected - gap rate increased by $(echo "$recent_rate - $baseline_rate" | bc)%"
  fi
fi
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual post-mortems | Automated signal collection + pattern detection | 2024+ (AI agent era) | Patterns detected every reflection, not just when humans remember |
| Time-based rolling windows | Severity-weighted thresholds with persistence | Phase 4 design | Catches critical issues early while handling infrequent persistent patterns |
| ML-based classification | Heuristic rules on structured data | GSD design constraint | Zero dependencies, debuggable, predictable behavior |
| Embedding-based drift detection | Metric trend analysis on structured artifacts | Phase 4 design | Self-contained, no external model calls |

**Deprecated/outdated:**
- None -- this domain is being designed fresh for the GSD system

## Open Questions

1. **Lesson update notification**
   - What we know: Lessons update-in-place per Phase 1 spec when new evidence strengthens them
   - What's unclear: Should users be notified when a lesson they relied on has been updated?
   - Recommendation: Track lesson `updated` timestamp changes. If lesson is retrieved within 7 days of update, note "Recently updated with new evidence from [signal IDs]". Claude's discretion on notification format.

2. **Pattern confidence expression**
   - What we know: CONTEXT.md marks confidence expression as Claude's discretion (numeric, categorical, evidence-count)
   - What's unclear: Which format is most useful for downstream consumers
   - Recommendation: Use categorical (HIGH/MEDIUM/LOW) with occurrence count in parentheses. Example: "HIGH (7 occurrences across 3 projects)". Evidence count is explicit, categorical is digestible.

3. **Reflection scope defaults**
   - What we know: CONTEXT.md marks default scope for `/gsd:reflect` as Claude's discretion
   - What's unclear: Should default be current project or cross-project?
   - Recommendation: Default to current project (faster, less noise). Cross-project via explicit flag: `/gsd:reflect --all`. Most reflections are project-focused.

4. **Lesson actionability levels**
   - What we know: CONTEXT.md marks actionability level as Claude's discretion (observation vs recommendation vs directive)
   - What's unclear: How to classify lessons by actionability
   - Recommendation: Three levels based on confidence and evidence strength:
     - **Observation** (LOW confidence, <3 evidence): "Pattern observed: X tends to cause Y"
     - **Recommendation** (MEDIUM confidence, 3-5 evidence): "Consider X when encountering Y"
     - **Directive** (HIGH confidence, 6+ evidence): "Always do X when Y occurs"

5. **Milestone reflection depth**
   - What we know: RFLC-04 requires optional reflection step in milestone completion
   - What's unclear: How deep should milestone reflection go? All phases? Summary only?
   - Recommendation: Summary depth -- analyze all phases in milestone but only report aggregate patterns and top 3 lessons suggested. Full detail available via `/gsd:reflect --phase N` for specific phases.

## Sources

### Primary (HIGH confidence)
- `.claude/agents/knowledge-store.md` -- Phase 1 KB schema, lesson type definition, directory layout
- `.claude/agents/kb-templates/lesson.md` -- Lesson entry template with frontmatter fields
- `.claude/agents/gsd-signal-collector.md` -- Signal schema with severity, tags, polarity
- `get-shit-done/references/signal-detection.md` -- Signal detection rules, severity classification
- `.claude/get-shit-done/workflows/verify-phase.md` -- Verification workflow showing gap detection
- `.claude/get-shit-done/workflows/complete-milestone.md` -- Milestone workflow integration point
- `.planning/phases/04-reflection-engine/04-CONTEXT.md` -- User decisions constraining implementation
- `.planning/codebase/ARCHITECTURE.md` -- Multi-layer architecture (command/workflow/agent/template/reference)

### Secondary (MEDIUM confidence)
- [Agentic Design Patterns Part 2: Reflection](https://www.deeplearning.ai/the-batch/agentic-design-patterns-part-2-reflection/) -- Andrew Ng's agentic workflow patterns
- [AI Trends 2026: Reflective Agents](https://huggingface.co/blog/aufklarer/ai-trends-2026-test-time-reasoning-reflective-agen) -- Industry trends on reflective AI
- [Lifelong Learning of Large Language Model based Agents](https://arxiv.org/abs/2501.07278) -- Research on LLM agent learning from experience
- [The Hidden Cost of LLM Drift](https://insightfinder.com/blog/hidden-cost-llm-drift-detection/) -- Drift detection approaches (adapted for heuristic use)

### Tertiary (LOW confidence)
- [LogCluster algorithm](https://ristov.github.io/publications/cnsm15-logcluster-web.pdf) -- Frequency-based log pattern mining (conceptual reference only)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; uses existing Phase 1/2 infrastructure exclusively
- Architecture: HIGH -- pattern detection on structured Markdown is well-defined; all new files follow existing patterns
- Pitfalls: HIGH -- derived from concrete CONTEXT.md decisions (severity-weighted thresholds, no time windows, scope determination rules)

**Research date:** 2026-02-05
**Valid until:** 2026-04-05 (stable domain -- internal specification system, not external dependency)
