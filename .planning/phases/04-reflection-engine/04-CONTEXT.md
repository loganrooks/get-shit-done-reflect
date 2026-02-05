# Phase 4: Reflection Engine - Context

**Gathered:** 2026-02-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Analyze accumulated signals, detect patterns, distill actionable lessons, and store them in the knowledge base. This closes the self-improvement loop — signals become patterns become lessons that prevent future mistakes.

**In scope:** Pattern detection, lesson distillation, `/gsd:reflect` command, phase-end reflection, cross-project analysis, milestone integration.

**Out of scope:** Knowledge surfacing during research (Phase 5), installer/first-run experience (deferred).

</domain>

<decisions>
## Implementation Decisions

### Pattern Detection Thresholds

- **Severity-weighted thresholds** — not a single number
  - Critical/high-severity signals: 2 occurrences enough to surface pattern (can't risk missing something dangerous)
  - Lower-severity/annoying signals: 5+ occurrences needed (filter noise, must be truly recurring)
- Rationale: Wide variety of scenarios — must catch critical issues early while not drowning in noise from minor friction

### Time Windows and Persistence

- **No simple rolling window** — too simplistic for real-world patterns
- Must handle infrequent but persistent issues (e.g., library bug that recurs across versions over months)
- Recency factors into priority, but old signals with same root cause should still cluster
- Smarter heuristics needed — Claude's discretion on implementation, but must not lose persistent cross-version issues

### Scope Determination

- **Signals start project-scoped** (that's where they live)
- **Scope determined at lesson distillation** when we understand the pattern
- **Early global detection** via optional `likely_scope: global` hint at signal creation time
  - Signals clearly affecting external tools/libraries can be flagged early
  - Examples: "npm has bug X", "Claude API returns unexpected format", "ESM resolution broken in Node 20"
- **Heuristics for global scope:**
  - References named library/framework
  - Root cause is external (library bug, documentation gap, tool limitation)
  - Would affect any project using similar tech stack
- **Heuristics for project scope:**
  - References specific file paths, project structure, local config
  - Root cause is internal (our code, our choices)
- **When uncertain:** Default to project-scoped (safer, less global noise)
- **Autonomy tie-in:**
  - YOLO mode: High-confidence global signals auto-promote
  - Interactive mode: Suggest promotion, user confirms

### Cross-Project Signal Access

- KB is user-level (`~/.claude/gsd-knowledge/`) — cross-project is natural model
- Pattern detection scans across all project directories via index
- User-level default in `/gsd:settings`: opt-in or opt-out for cross-project signal sharing
- Per-project override available in `.planning/config.json`
- Lessons from private projects stay scoped; lessons from shared signals are global

### Signal-to-Pattern Relationship

- **Signals can contribute to multiple patterns** — one timeout error might be evidence for both "CI flakiness" and "network reliability" patterns
- **Patterns become evidence in lessons but stay active** — new signals can still accumulate to strengthen or update lessons
- Lessons evolve with evidence (per Phase 1: lessons update-in-place)

### Lesson Categories

- **Hierarchical:** Predefined top-level + emergent subcategories
- **Top-level categories:**
  - `tooling` — build tools, test runners, linters
  - `architecture` — code structure, patterns, design
  - `testing` — strategies, fixtures, mocking
  - `workflow` — GSD workflow, CI/CD, automation
  - `external` — third-party services, APIs, libraries
  - `environment` — OS, runtime, configuration
- **Subcategories emerge as needed:** `tooling/vitest`, `external/claude-api`, etc.
- Maps to retrieval: "I'm about to use Vitest — any lessons?" → query `tooling/vitest`

### Reflection Frequency

- Can be configured as project setting in `/gsd:settings`
- Options likely: on-demand only, auto after milestone, auto after phase

### Claude's Discretion

The following areas are delegated to Claude's judgment during implementation:

**Pattern Detection:**
- Grouping logic (surface symptom vs root cause inference)
- Pattern output format (summary, evidence links, full analysis)
- False positive handling (dismiss, deprioritize, ignore)
- Signal source weighting (manual vs auto-detected)
- Pattern urgency flagging
- Pattern relationships (causal links, soft grouping)
- Resolution tracking approach
- Pattern naming/description generation
- Confidence expression (numeric, categorical, evidence-count)
- Manual adjustment capabilities

**Lesson Structure:**
- Actionability level (observation vs recommendation vs directive)
- Staleness/expiration mechanism
- Evidence linking format
- Update mechanism details (per Phase 1: update-in-place)

**Trigger Behavior:**
- Default scope for `/gsd:reflect` (current project vs all)
- Milestone integration approach (required vs optional vs separate)
- Output format (terminal summary vs interactive vs silent)
- Lesson confirmation flow
- Empty-state behavior (no patterns found)
- Dry-run/preview capability
- Depth/thoroughness settings
- Phase-end comparison granularity (task vs goal vs deviation-focused)

**Cross-Project:**
- Project matching approach for cross-project detection
- Attribution in cross-project lessons
- Conflict handling (conditional, separate, or flag)
- Cross-project analysis trigger default
- Surfacing priority (local vs cross-project)

</decisions>

<specifics>
## Specific Ideas

- The system should never make the same mistake twice — that's the core value proposition
- Lessons should be actionable enough that downstream agents can use them without asking the user again
- Cross-project lessons should capture "this library has this bug" type knowledge that transfers

</specifics>

<deferred>
## Deferred Ideas

- **Installer/First-Run Experience** — A phase to handle KB initialization timing (install time vs lazy), first-run preference prompts, user-level defaults setup, and upgrade paths for existing users. Doesn't block Phase 4 (infrastructure exists via Phase 1), but would improve UX of getting to a working state. Consider: when does KB get created? Where do user-level defaults get set initially?

</deferred>

---

*Phase: 04-reflection-engine*
*Context gathered: 2026-02-05*
