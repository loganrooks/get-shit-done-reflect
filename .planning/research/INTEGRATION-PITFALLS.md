# Integration Pitfalls: Upstream Feature Adoption into GSD Reflect

**Domain:** Fork integration -- adopting upstream features into a philosophically-opinionated self-improvement system
**Researched:** 2026-03-10
**Overall confidence:** HIGH (based on detailed fork audit artifacts, upstream source inspection, and fork codebase analysis)

---

## Executive Summary

GSD Reflect's value proposition is its closed-loop self-improvement pipeline: signals detect problems, reflection distills lessons, health scoring measures system state, automation triggers it all without manual intervention. Upstream GSD builds excellent operational features (context-monitor, Nyquist auditor, code-aware discuss-phase, new workflows) but has zero awareness of this pipeline. Adopting these features as-is creates "alienated patches" -- working code that sits beside the fork's systems without feeding into them.

The core risk is not that adoption will break anything. The features are complementary and the conflict risk is LOW across the board (per the fork audit). The risk is that adopted features become dead-end islands: context-monitor warns agents but its warnings never become signals; Nyquist auditor catches gaps but never feeds validation failures into health scoring; discuss-phase scouts code but never surfaces KB lessons. Shallow adoption creates maintenance burden without epistemic value.

This document catalogs the specific integration touchpoints per feature, anti-patterns to avoid, testing strategies that validate integration depth (not just feature presence), and a per-feature checklist that ensures each adoption strengthens the self-improvement loop rather than creating isolated capabilities.

---

## Part 1: The Alienated Patch Anti-Pattern

### What It Is

An "alienated patch" is an adopted feature that:
1. Works correctly in isolation
2. Has no inputs from or outputs to the host system's feedback mechanisms
3. Duplicates information that the host system already tracks in a different form
4. Creates a maintenance burden proportional to a full feature but delivers value proportional to a point fix

### Why It Happens in This Fork

The fork and upstream have different architectural philosophies:

| Dimension | Upstream | Fork |
|-----------|----------|------|
| **Data flow** | Features produce user-facing output and stop | Features produce output AND feed structured data into KB pipeline |
| **Observation** | Hooks warn users/agents | Hooks warn AND generate signals for pattern detection |
| **Validation** | Auditors verify and report | Auditors verify, report, AND feed results into health scoring |
| **Context** | Code-awareness serves the current session | Code-awareness serves the current session AND retrieves cross-session lessons |

Every upstream feature assumes a "produce output, done" lifecycle. The fork's lifecycle is "produce output, feed into signals, accumulate into patterns, distill into lessons, surface in future sessions." Adopting without extending the lifecycle creates an alienated patch.

### The Litmus Test

For each adopted feature, ask: **"If this feature fires 100 times, does the fork learn anything?"**

- If YES: deep integration achieved. The feature enriches the KB.
- If NO: alienated patch. The feature works but the system is blind to its output.

---

## Part 2: Per-Feature Integration Analysis

### Feature 1: Context Monitor Hook

#### What Upstream Provides
- PostToolUse hook that reads bridge file from statusline
- Injects `additionalContext` warnings to agents at 35% and 25% remaining
- Smart debounce (5 tool uses), severity escalation
- GSD-aware messaging (different advisory for GSD vs non-GSD projects)

#### Alienated Patch Risk: HIGH

If adopted as-is, context-monitor provides agent warnings that evaporate after each session. The fork already has:
- Health scoring (tracks system state)
- Signal detection (captures workflow deviations)
- Automation framework (context-aware deferral via `resolve-level --context-pct`)

The context monitor's data should flow into ALL three of these systems.

#### Required Integration Touchpoints

| Touchpoint | What Happens | Fork System |
|------------|-------------|-------------|
| **Bridge file enrichment** | Statusline writes `/tmp/claude-ctx-{session}.json` with metrics | Statusline hook (already fork-enhanced) |
| **Health scoring input** | Context exhaustion events feed infrastructure health dimension | Health probe architecture |
| **Signal generation** | Repeated context warnings in a phase = signal about plan over-scoping | Signal collection pipeline |
| **Automation deferral source** | Context monitor's remaining% is authoritative source for `resolve-level --context-pct` | Automation framework |
| **Regime tracking** | First activation = regime change entry in KB | Regime change system |

#### Concrete Integration Steps

1. **Bridge file as single source of truth for context%**: Currently execute-phase postludes ESTIMATE context% using wave count as proxy (`min(40 + (WAVES * 10), 80)`). This is acknowledged as approximate. The context-monitor bridge file provides ACTUAL remaining%. Integration: automation's `resolve-level` should read the bridge file when it exists, falling back to wave-based estimation when it does not.

2. **Context exhaustion as health probe**: Create `health-probes/context-exhaustion.md` probe that checks for recent context warnings. If the last N sessions all hit CRITICAL, that is a workflow health problem (plans are too large, or context budget is not being managed).

3. **CRITICAL warnings as signal candidates**: When context-monitor fires CRITICAL, the execute-phase postlude should note this. If CRITICAL fired AND the phase was incomplete (not all plans executed), that is a detectable signal: "Phase X exhausted context before completion."

4. **Deferred actions tracking**: When context-monitor causes automation deferral (level 3 downgraded to level 1), track this as an automation event via `track-event {feature} skip "context_deferred"`. This is already partially implemented in `resolve-level` but the actual context% fed to it is estimated, not measured.

#### Anti-Patterns to Avoid

- **DO NOT** add context-monitor as a hook-only feature with no bridge to the automation framework. The fork already does context-aware deferral -- context-monitor must be the data SOURCE for that deferral, not a parallel system.
- **DO NOT** let context-monitor warnings exist only as ephemeral agent messages. At minimum, track warning counts per session in the bridge file so health probes can read them.
- **DO NOT** duplicate the bridge file format. Upstream's format (`/tmp/claude-ctx-{session_id}.json` with `remaining_percentage`, `used_pct`, `timestamp`) should be adopted as-is and consumed by fork systems.

---

### Feature 2: Nyquist Auditor

#### What Upstream Provides
- Agent spec that generates behavioral tests for phase requirements
- Spawned by `/gsd:validate-phase` workflow
- Classifies gaps as COVERED/PARTIAL/MISSING
- Debug loop (max 3 iterations per failing test)
- Structured returns (GAPS FILLED / PARTIAL / ESCALATE)

#### Alienated Patch Risk: HIGH

The Nyquist auditor is a validation system. The fork has TWO validation-adjacent systems it does not talk to:
1. **Signal collection** -- detects execution problems post-phase
2. **Health scoring** -- measures workflow quality via signal density/resolution ratios

If Nyquist runs and finds 8 gaps in a phase, but those gaps never become signals and never affect the health score, the fork has not learned from the validation.

#### Required Integration Touchpoints

| Touchpoint | What Happens | Fork System |
|------------|-------------|-------------|
| **Validation gaps as signal candidates** | MISSING/PARTIAL gaps are structured data about phase quality | Signal collection pipeline |
| **Escalated gaps as high-severity signals** | ESCALATE results indicate implementation bugs | Signal lifecycle (detected -> triaged) |
| **Gap counts in health scoring** | Phases with many gaps should affect workflow health dimension | Health probe architecture |
| **Nyquist results in SUMMARY.md** | Validation results enrich phase completion artifacts | Execute-phase postlude chain |
| **Pattern detection across phases** | Recurring gap types across phases = lesson candidate | Reflection engine |

#### Concrete Integration Steps

1. **Nyquist-to-signal bridge**: After Nyquist auditor completes, its structured output (GAPS FILLED / PARTIAL / ESCALATE) should be parseable by the artifact sensor. The artifact sensor currently scans PLAN.md, SUMMARY.md, and VERIFICATION.md. Add VALIDATION.md to its scan targets. Gaps classified as MISSING with no test created should generate signals of type `validation_gap`, severity `notable`.

2. **Nyquist as optional postlude step**: Upstream runs Nyquist via explicit `/gsd:validate-phase` command. For fork integration, consider adding Nyquist as a postlude step in execute-phase, BETWEEN verification and signal collection. This way:
   - Verification catches requirement satisfaction
   - Nyquist catches test coverage gaps
   - Signal collection catches everything (including Nyquist findings)

   **CAUTION**: Nyquist is expensive (spawns auditor agent, runs tests). Only enable as postlude when `automation.level >= 3` AND `workflow.nyquist_validation` is not false.

3. **Health probe for Nyquist coverage**: Create `health-probes/nyquist-coverage.md` that reads VALIDATION.md files across recent phases. If test coverage has been declining (more MISSING gaps per phase over time), this is a workflow health degradation signal.

4. **Reflection pattern: "undertested phases"**: The reflector should recognize a pattern where multiple phases have Nyquist ESCALATE results. This pattern suggests systematic under-specification in plans (plans lack testable requirements).

#### Anti-Patterns to Avoid

- **DO NOT** adopt validate-phase as an isolated command with no connection to the postlude chain. The fork's value is in automation -- manually running `/gsd:validate-phase` after every phase defeats the purpose.
- **DO NOT** have Nyquist results exist only in VALIDATION.md without the artifact sensor knowing how to read them. VALIDATION.md must be a recognized artifact type.
- **DO NOT** treat Nyquist as only a test generator. Its output is structured quality data that should flow into the KB.

---

### Feature 3: Code-Aware Discuss-Phase

#### What Upstream Provides
- `load_prior_context` step: reads PROJECT.md, REQUIREMENTS.md, STATE.md, prior CONTEXT.md files
- `scout_codebase` step: reads codebase maps or does targeted grep for reusable assets, patterns
- Code context annotations on gray areas ("Existing `useAuth` hook could serve this")
- Context7 integration for library-specific questions
- `<code_context>` section in CONTEXT.md output with reusable assets and patterns

#### Alienated Patch Risk: MEDIUM

Code-awareness is a pure improvement to discuss-phase. But the fork has a knowledge base full of lessons, spike results, and signals that are directly relevant to implementation decisions. If discuss-phase scouts the codebase but ignores the KB, it misses the fork's primary value: accumulated learning.

#### Required Integration Touchpoints

| Touchpoint | What Happens | Fork System |
|------------|-------------|-------------|
| **KB lesson surfacing** | Relevant lessons from prior phases surface during gray area analysis | Knowledge surfacing (already exists for research-phase) |
| **Spike result retrieval** | Prior spike decisions relevant to this phase's domain surface | Spike workflow results in KB |
| **Signal awareness** | Active signals related to this phase's domain inform gray area identification | Signal collection / KB index |
| **CONTEXT.md -> signal linkage** | Decisions captured in CONTEXT.md that contradict prior lessons = tension signal | Signal detection patterns |

#### Concrete Integration Steps

1. **Add KB surfacing step between `load_prior_context` and `scout_codebase`**: The fork's `knowledge-surfacing.md` reference already defines query patterns for research and planning. Add a discuss-phase query pattern:
   ```
   Query KB index for:
   - Lessons tagged with keywords from the phase goal
   - Signals from prior phases in the same domain
   - Spike decisions relevant to this phase's technology area

   Budget: ~300 tokens (discuss-phase is lightweight, don't bloat)
   ```

2. **Annotate gray areas with KB context**: When the codebase scout finds relevant assets, it annotates gray areas with "Existing `useAuth` hook could serve this." Similarly, when KB surfacing finds relevant lessons, annotate: "Lesson from phase 28: 'Shell scripts are more reliable than agent instructions for state transitions' -- relevant to [gray area]."

3. **CONTEXT.md includes `<kb_context>` section**: Alongside `<code_context>` (reusable assets and patterns), add `<kb_context>` (relevant lessons and spike decisions). This makes the researcher and planner aware of prior learning without them having to independently query the KB.

4. **Decision-lesson tension detection**: If the user makes a decision that contradicts a prior lesson (e.g., lesson says "avoid agent instructions for state transitions" but user decides on agent-instruction-based approach), note this as an "Internal Tension" in CONTEXT.md. This is already a pattern in the fork (TMPL-05: Internal Tensions in feature specs).

#### Anti-Patterns to Avoid

- **DO NOT** adopt code-awareness without KB-awareness. Scouting the codebase but ignoring the knowledge base creates an asymmetry where the system knows what code exists but not what it has learned about using that code.
- **DO NOT** over-load discuss-phase with KB queries. Budget 300 tokens max for KB context. Discuss-phase is a lightweight conversation, not a research phase. Surface the top 3 most relevant lessons, not all 70+ signals.
- **DO NOT** make KB surfacing blocking. If KB index is missing or empty, skip silently. The fork's compatibility guards (`if ! exists, skip`) pattern must apply.

---

### Feature 4: Upstream Workflows (add-tests, cleanup, health, validate-phase)

#### What Upstream Provides
- `add-tests.md`: Post-phase test generation from SUMMARY.md and implementation
- `cleanup.md`: Phase/milestone cleanup
- `health.md`: Simple `.planning/` directory validation
- `validate-phase.md`: Nyquist-based phase validation (analyzed above)

#### Alienated Patch Risk: MEDIUM (varies by workflow)

| Workflow | Risk | Reason |
|----------|------|--------|
| `add-tests.md` | LOW | Test generation is self-contained, produces artifacts sensors can read |
| `cleanup.md` | MEDIUM | Cleanup could delete KB artifacts if not aware of fork's file layout |
| `health.md` | HIGH | Fork already has 11-probe health-check -- two health systems is confusing |
| `validate-phase.md` | HIGH | Must integrate with Nyquist-to-signal bridge (analyzed above) |

#### Required Integration Touchpoints

**add-tests.md:**
- No deep integration needed. Test files it creates will be naturally visible to the CI sensor.
- Consider: after tests are generated, run them. If they fail, that is a signal candidate. The existing CI sensor should catch this on next CI run.

**cleanup.md:**
- CRITICAL: Must be made aware of `.planning/knowledge/` directory. Upstream cleanup knows about `.planning/phases/`, `.planning/STATE.md`, `.planning/ROADMAP.md` but has zero awareness of:
  - `.planning/knowledge/signals/`
  - `.planning/knowledge/spikes/`
  - `.planning/knowledge/reflections/`
  - `.planning/knowledge/index.md`
  - `.planning/deliberations/`
  - `.planning/backlog/`
- If cleanup deletes or moves these directories, the KB is destroyed.
- Integration: add fork-awareness guards. Cleanup should NEVER touch `knowledge/`, `deliberations/`, or `backlog/` directories.

**health.md:**
- DO NOT adopt as a separate command. The fork's `/gsdr:health-check` is a superset (11 probes, scoring, caching, auto-repair). Upstream's `/gsd:health` does simple directory validation.
- Instead: extract any directory checks from upstream's health.md that the fork's probes don't already cover, and add them as new probes to the existing probe architecture.
- If adopted as a separate command, users face confusion: "Do I run `/gsdr:health-check` or `/gsd:health`?"

**validate-phase.md:**
- See Nyquist auditor integration above. Adopt the workflow but wire its output into the signal pipeline.

#### Anti-Patterns to Avoid

- **DO NOT** adopt upstream's `health.md` as a standalone command alongside the fork's health-check. One health system, not two.
- **DO NOT** adopt `cleanup.md` without adding exclusion rules for fork-specific directories. This is the single most dangerous adoption if done carelessly.
- **DO NOT** adopt all four workflows simultaneously. Each has different integration requirements. Adopt sequentially, validating integration depth at each step.

---

## Part 3: Architecture Mismatch Pitfalls

### Monolith vs Modules

**The problem:** Fork's 2,126 lines live in a monolithic `gsd-tools.js`. Upstream modularized into 11 `.cjs` modules. Upstream's new workflows reference `gsd-tools.cjs` (the modular entry point). Fork's workflows reference `gsd-tools.js` (the monolith).

**What breaks:** Adopting upstream workflows verbatim means they call `gsd-tools.cjs` which does not exist in the fork's current structure. The fork has `gsd-tools.js` with different function signatures and different command routing.

**Mitigation:** The modularization migration (redistributing fork's 25 functions across 5 new modules + 2 modified modules) MUST happen before or alongside feature adoption. Without it, every adopted workflow needs path/name translation, creating a fragile compatibility shim.

**Integration order implication:** Modularization should be Phase 1 of the milestone. Feature adoption follows. Attempting to adopt features into the monolith and then modularize later means rewriting integration code twice.

### .js vs .cjs Extension

**The problem:** Upstream renamed `gsd-tools.js` to `gsd-tools.cjs` for ESM compatibility. Fork still uses `.js`. All upstream workflows, commands, and hook scripts reference `.cjs`.

**What breaks:** Every adopted file that calls `gsd-tools.cjs` will fail with `MODULE_NOT_FOUND` in the fork's current state.

**Mitigation:** Adopt the `.cjs` extension as part of modularization. This is a find-and-replace operation but touches every workflow, command, and hook script.

### Hook Architecture Differences

**The problem:** Fork uses dynamic hook discovery (glob for `gsd-*.js` files). Upstream uses a more static approach. The context-monitor hook relies on a bridge file written by the statusline hook. Fork's statusline hook is significantly enhanced (CI status, health traffic light, automation level, DEV indicator) -- it does not write the bridge file that context-monitor needs.

**What breaks:** Adopting context-monitor without updating the fork's statusline hook to write the bridge file means context-monitor reads a non-existent file and silently exits on every tool use.

**Mitigation:** Add bridge file writing to the fork's enhanced statusline hook. This is a ~10 line addition but is easy to miss because the failure mode is silent (hook exits cleanly, no error).

### Namespace Rewriting

**The problem:** Fork uses GSDR namespace with install-time rewriting. Source files reference `~/.claude/get-shit-done/` but installed files reference `./.claude/get-shit-done-reflect/`. Adopted upstream features will reference `~/.claude/get-shit-done/` which the installer must rewrite.

**What breaks:** If the installer's `replacePathsInContent()` does not handle new file types or new path patterns introduced by upstream features, the installed files will reference wrong paths.

**Mitigation:** After adopting each feature, verify its installed version has correct namespace paths. Add test cases to the existing wiring-validation tests for each new file.

---

## Part 4: Testing Strategy for Integration Depth

### The Problem with Feature-Presence Testing

Typical adoption testing verifies: "Does the feature exist? Does it run? Does it produce output?" This catches broken adoptions but NOT alienated patches. A feature can exist, run, and produce output while being completely disconnected from the fork's systems.

### Integration Depth Tests

For each adopted feature, write tests that verify not just presence but FLOW through the fork's pipeline.

#### Context Monitor Integration Tests

```
TEST: "Context monitor bridge file feeds automation resolve-level"
GIVEN: Bridge file exists at /tmp/claude-ctx-{session}.json with remaining_percentage: 30
WHEN: automation resolve-level signal_collection --context-pct from-bridge is called
THEN: effective level is downgraded (e.g., 3 -> 1) due to low context

TEST: "Context exhaustion generates health probe data"
GIVEN: Last 3 sessions all had CRITICAL context warnings (remaining < 25%)
WHEN: health-probes/context-exhaustion.md probe runs
THEN: probe returns WARNING or FAIL finding with context exhaustion pattern

TEST: "Context warning count persisted in bridge file"
GIVEN: Context monitor fired WARNING twice and CRITICAL once
WHEN: Bridge file is read by health probe
THEN: warning_count and critical_count fields are present and accurate
```

#### Nyquist Integration Tests

```
TEST: "Nyquist VALIDATION.md is scanned by artifact sensor"
GIVEN: VALIDATION.md exists with 3 MISSING gaps
WHEN: artifact sensor runs on the phase
THEN: at least one signal candidate of type validation_gap is generated

TEST: "Nyquist gap count feeds health probe"
GIVEN: Last 3 phases each have VALIDATION.md with 5+ MISSING gaps
WHEN: health-probes/nyquist-coverage.md probe runs
THEN: probe returns WARNING finding about declining test coverage

TEST: "Nyquist ESCALATE results become high-severity signals"
GIVEN: Nyquist auditor returned ESCALATE with implementation bug
WHEN: signal synthesizer processes the candidate
THEN: signal is persisted with severity: notable and type: validation_gap
```

#### Discuss-Phase Integration Tests

```
TEST: "Discuss-phase queries KB when index exists"
GIVEN: KB index.md exists with lessons tagged "authentication"
AND: Phase goal mentions "authentication"
WHEN: discuss-phase runs analyze_phase step
THEN: KB lessons are included in internal context (visible in CONTEXT.md kb_context section)

TEST: "Discuss-phase degrades gracefully when KB is empty"
GIVEN: KB index.md does not exist
WHEN: discuss-phase runs
THEN: No error, no KB section in output, workflow completes normally

TEST: "CONTEXT.md includes kb_context section when lessons found"
GIVEN: KB has 2 relevant lessons for phase domain
WHEN: discuss-phase writes CONTEXT.md
THEN: CONTEXT.md contains <kb_context> section with lesson summaries
```

#### Cleanup Integration Tests

```
TEST: "Cleanup never touches knowledge directory"
GIVEN: .planning/knowledge/ exists with signals, spikes, reflections
WHEN: cleanup workflow runs for a milestone
THEN: .planning/knowledge/ is untouched (all files still present)

TEST: "Cleanup never touches deliberations directory"
GIVEN: .planning/deliberations/ exists with 12 deliberation files
WHEN: cleanup workflow runs
THEN: .planning/deliberations/ is untouched

TEST: "Cleanup never touches backlog directory"
GIVEN: .planning/backlog/ exists with items
WHEN: cleanup workflow runs
THEN: .planning/backlog/ is untouched
```

### Wiring Validation Additions

The existing `wiring-validation.test.js` checks path references across agents/workflows/commands. Add checks for each adopted feature:

```
TEST: "context-monitor.js references correct gsd-tools path (namespace-aware)"
TEST: "validate-phase.md references correct agent spec path"
TEST: "add-tests.md references correct gsd-tools path"
TEST: "cleanup.md exclusion list includes knowledge/, deliberations/, backlog/"
```

---

## Part 5: Per-Feature Integration Checklist

### Context Monitor Adoption Checklist

- [ ] Upstream statusline context scaling fix adopted (83.5% vs 80%)
- [ ] Fork's statusline hook writes bridge file (`/tmp/claude-ctx-{session}.json`)
- [ ] Bridge file includes `remaining_percentage`, `used_pct`, `timestamp`
- [ ] Context-monitor hook adopted and registered in installer
- [ ] Stdin timeout guard adopted (3-second guard)
- [ ] CLAUDE_CONFIG_DIR support adopted
- [ ] `automation resolve-level` reads bridge file instead of wave-based estimation
- [ ] Wave-based estimation retained as fallback when bridge file absent
- [ ] Health probe created: `context-exhaustion.md`
- [ ] Context CRITICAL + incomplete phase = signal candidate logic added
- [ ] First activation writes regime-change entry
- [ ] Wiring validation tests cover new hook file
- [ ] Integration depth tests written and passing
- [ ] Namespace rewriting verified for hook file paths

### Nyquist Auditor Adoption Checklist

- [ ] `gsd-nyquist-auditor.md` agent spec adopted
- [ ] `validate-phase.md` workflow adopted
- [ ] `/gsd:validate-phase` command adopted
- [ ] VALIDATION.md template adopted
- [ ] Artifact sensor updated to scan VALIDATION.md
- [ ] Signal type `validation_gap` added to signal schema
- [ ] Nyquist as optional postlude step in execute-phase (behind config gate)
- [ ] Health probe created: `nyquist-coverage.md`
- [ ] Reflector recognizes "undertested phases" pattern
- [ ] `workflow.nyquist_validation` config key added to feature manifest
- [ ] Integration depth tests written and passing
- [ ] Wiring validation tests cover new files

### Code-Aware Discuss-Phase Adoption Checklist

- [ ] `load_prior_context` step adopted from upstream
- [ ] `scout_codebase` step adopted from upstream
- [ ] Code context annotations adopted for gray areas
- [ ] Context7 integration for library choices adopted
- [ ] `<code_context>` section in CONTEXT.md adopted
- [ ] KB surfacing step added between `load_prior_context` and `scout_codebase`
- [ ] KB query budget set (~300 tokens)
- [ ] `<kb_context>` section added to CONTEXT.md output
- [ ] Gray area annotations include relevant lessons
- [ ] Decision-lesson tension detection added
- [ ] Compatibility guard: skip KB surfacing if index missing
- [ ] Integration depth tests written and passing

### Upstream Workflows Adoption Checklist

**add-tests.md:**
- [ ] Workflow adopted
- [ ] Command `/gsd:add-tests` adopted
- [ ] Path references updated for fork (namespace, .js/.cjs)
- [ ] No deep integration needed (CI sensor catches test failures naturally)

**cleanup.md:**
- [ ] Workflow adopted
- [ ] Exclusion list added: `knowledge/`, `deliberations/`, `backlog/`
- [ ] Exclusion tests written and passing
- [ ] Path references updated for fork

**health.md:**
- [ ] DO NOT adopt as separate command
- [ ] Extract unique directory checks not in fork's probes
- [ ] Add as new probes to existing health-check architecture
- [ ] Verify no duplication with existing 11 probes

**validate-phase.md:**
- [ ] See Nyquist auditor checklist above

---

## Part 6: Integration Order and Dependencies

### Recommended Adoption Order

```
Phase 1: Foundation (no feature integration needed)
  - Modularization migration (redistribute 25 functions across modules)
  - .js -> .cjs rename
  - depth -> granularity config rename

Phase 2: Context Monitor (foundational for automation accuracy)
  - Statusline context scaling fix
  - Bridge file writing in statusline hook
  - Context-monitor hook adoption
  - Stdin timeout + CLAUDE_CONFIG_DIR
  - Automation resolve-level reads bridge file
  - Context exhaustion health probe

Phase 3: Nyquist Auditor (depends on modularization for path correctness)
  - Agent spec + workflow + command adoption
  - VALIDATION.md artifact sensor integration
  - Optional postlude step in execute-phase
  - Nyquist coverage health probe

Phase 4: Code-Aware Discuss-Phase (independent, low risk)
  - Upstream code-awareness adoption
  - KB surfacing step addition
  - kb_context section in CONTEXT.md

Phase 5: Supporting Workflows (depends on modularization)
  - add-tests.md adoption
  - cleanup.md adoption WITH exclusion guards
  - health.md probe extraction (not command adoption)
```

### Why This Order

1. **Modularization first** because all upstream workflows reference `gsd-tools.cjs` which does not exist in the fork's current structure. Every subsequent adoption depends on path correctness.

2. **Context monitor second** because it provides accurate context% data that the automation framework currently estimates. Once accurate, all postlude deferral decisions improve.

3. **Nyquist third** because it creates the most complex integration (new artifact type for sensors, new health probe, optional postlude). It benefits from modularization being complete and context-monitor being available for accurate deferral when Nyquist runs as a postlude.

4. **Discuss-phase fourth** because it is the lowest risk adoption (additive-only changes to an existing workflow) and has no dependencies on prior phases.

5. **Supporting workflows last** because they are least critical and some (cleanup) require all prior integration work to be stable before adoption.

---

## Part 7: Pitfalls Specific to This Fork

### Pitfall 1: Silent Bridge File Absence (CRITICAL)

**What goes wrong:** Context-monitor is adopted and registered. It runs on every PostToolUse. But the fork's statusline hook never writes the bridge file. Context-monitor reads a non-existent file and exits silently. No error, no warning, no log. The feature appears to work (it is registered, it runs) but never actually fires.

**Why it happens:** The fork's statusline hook was enhanced independently of upstream. The bridge file writing was added to upstream's statusline AFTER the fork diverged. The two hooks share no code -- they are independent implementations that produce different output.

**Detection:** Test that bridge file exists after statusline runs. If it does not, the entire context-monitor feature is dead code.

**Prevention:** Bridge file writing should be the FIRST step of context-monitor adoption, not an afterthought. Write the bridge file, verify it exists, THEN adopt the consumer.

### Pitfall 2: VALIDATION.md Invisible to Artifact Sensor (CRITICAL)

**What goes wrong:** Nyquist auditor runs, writes VALIDATION.md, reports gaps to the user. But the artifact sensor only scans PLAN.md, SUMMARY.md, and VERIFICATION.md. VALIDATION.md is never read by any sensor. Validation gaps never become signals. The fork never learns from Nyquist findings.

**Why it happens:** The artifact sensor was written before Nyquist existed. Its file scan list is hardcoded to the three artifact types that existed at the time. Adding a new artifact type requires updating the sensor's scan targets.

**Detection:** Run Nyquist on a phase with known gaps. Then run signal collection. If zero signals reference validation gaps, the bridge is missing.

**Prevention:** Artifact sensor update should be in the SAME phase/PR as Nyquist adoption. Never adopt the producer without updating the consumer.

### Pitfall 3: Cleanup Destroys Knowledge Base (CRITICAL)

**What goes wrong:** Upstream's cleanup workflow removes stale phase artifacts. It knows about `.planning/phases/` but not `.planning/knowledge/`, `.planning/deliberations/`, or `.planning/backlog/`. If it applies aggressive cleanup patterns (glob matching, age-based deletion), it could delete KB entries, deliberation documents, or backlog items.

**Why it happens:** Upstream has no knowledge base, no deliberations directory, no backlog directory. Its cleanup is safe for its own file layout but not for the fork's extended layout.

**Detection:** Run cleanup on a test project with full fork directory structure. Verify all fork-specific directories survive.

**Prevention:** Add explicit exclusion rules to cleanup.md BEFORE first use. Test exclusions with fork-specific directory fixtures.

### Pitfall 4: Dual Health Systems Confuse Users (HIGH)

**What goes wrong:** Fork has `/gsdr:health-check` (11 probes, two-dimensional scoring, caching, auto-repair). Upstream adds `/gsd:health` (simple directory validation). Both are available in co-installation. Users do not know which to run. Running upstream's `/gsd:health` gives a simpler (less informative) result. Running both wastes context.

**Why it happens:** The fork's health-check is a superset but has a different command name. Upstream's health command exists in the upstream worktree and will be accessible if co-installation is active.

**Detection:** After adoption, verify that only ONE health command is accessible per namespace.

**Prevention:** DO NOT adopt upstream's `health.md` as a command. Extract any unique checks as probes for the existing system. If upstream checks something the fork's 11 probes miss, add a 12th probe.

### Pitfall 5: Discuss-Phase Code-Awareness Overshadows KB-Awareness (HIGH)

**What goes wrong:** Code-aware discuss-phase is adopted. It scouts the codebase beautifully, finds reusable components, annotates gray areas with code context. But KB surfacing is added as an afterthought or not at all. The system knows what code exists but not what it learned about that code. Users see code suggestions but not "last time we used this pattern, it caused signal X."

**Why it happens:** Upstream's code-awareness is a complete, tested feature. KB-awareness is a fork-specific addition that must be designed and built from scratch. The temptation is to adopt the complete feature now and "add KB surfacing later." Later never comes.

**Detection:** Run discuss-phase on a phase where the KB has relevant lessons. If CONTEXT.md has `<code_context>` but no `<kb_context>`, the integration is incomplete.

**Prevention:** KB surfacing step must be in the SAME PR as code-awareness adoption. Define the test first: "CONTEXT.md has kb_context section when KB has relevant lessons."

### Pitfall 6: Context% Estimation and Measurement Diverge (MEDIUM)

**What goes wrong:** After adopting context-monitor, two sources of context% coexist: the bridge file (measured) and the wave-based estimation (calculated). Some code paths read the bridge file, others still use the estimation. The two values disagree (estimation is systematically conservative). Automation decisions become inconsistent depending on which source a particular code path uses.

**Why it happens:** The wave-based estimation exists in multiple places (execute-phase postludes, resolve-level). Updating all call sites to prefer the bridge file is a thorough but tedious task. Missing one call site creates inconsistency.

**Detection:** Grep for the wave-based estimation pattern (`min(40 + (WAVES`, `min(55 + (WAVES`) across all workflows. Every instance should have a "bridge file fallback" pattern.

**Prevention:** Create a single helper function/pattern for "get current context%" that checks bridge file first, falls back to wave estimation. Use this helper everywhere instead of inline estimation.

### Pitfall 7: Namespace Rewriting Misses New Files (MEDIUM)

**What goes wrong:** New upstream files (context-monitor.js, validate-phase.md, add-tests.md) are adopted. They contain paths like `~/.claude/get-shit-done/bin/gsd-tools.cjs`. The installer's `replacePathsInContent()` handles known path patterns but the new `.cjs` extension or new directory references may not match existing regex patterns.

**Why it happens:** The namespace rewriting system was built and tested against the fork's existing file set. New files from upstream introduce new path patterns that may not be covered.

**Detection:** After installation with `--local`, grep installed files for `~/.claude/get-shit-done/` (the pre-rewrite pattern). Any matches indicate incomplete rewriting.

**Prevention:** After each feature adoption, run `node bin/install.js --local` and verify installed files. Add each new file to the wiring-validation test suite.

### Pitfall 8: Postlude Chain Context Budget Exceeded (MEDIUM)

**What goes wrong:** Adding Nyquist as a postlude step increases the postlude chain from 4 steps (reconcile, collect-signals, health-check, auto-reflect) to 5. Each postlude consumes context. With a multi-wave phase (high context consumption) plus 5 postludes, total context usage exceeds 100%. The last postlude (auto-reflect) gets deferred every time, effectively disabling it.

**Why it happens:** The postlude chain's context budget is calculated per-step with cumulative offsets (+15 base for auto-reflect). Adding another expensive step (Nyquist spawns an auditor agent) shifts all the budget calculations.

**Detection:** Monitor how often auto-reflect gets deferred due to context. If deferral rate jumps after Nyquist adoption, the budget is exceeded.

**Prevention:** Nyquist postlude should only run when explicitly configured (`workflow.nyquist_validation: true`). It should run BEFORE signal collection (so its output feeds into signals) but after verification. Adjust context budget offsets for all subsequent postludes.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Alienated patch risk per feature | HIGH | Based on direct inspection of upstream source and fork's pipeline architecture |
| Integration touchpoints | HIGH | Based on fork audit artifacts and detailed workflow analysis |
| Silent failure modes | HIGH | Based on hook architecture analysis and known bridge file dependency |
| Testing strategy | MEDIUM | Test patterns are sound but execution complexity is untested |
| Adoption order | MEDIUM | Dependencies are clear but actual effort per phase may vary |
| Context budget impact of Nyquist postlude | MEDIUM | Based on analysis of existing budget patterns; real-world measurement needed |

## Sources

- Fork audit artifacts: `.planning/fork-audit/00-SYNTHESIS.md` through `10-workflow-divergence.md`
- Upstream source: `git show upstream/main:{path}` for context-monitor, Nyquist auditor, discuss-phase, validate-phase, add-tests, cleanup, health
- Fork workflows: `get-shit-done/workflows/execute-phase.md`, `collect-signals.md`, `health-check.md`, `reflect.md`, `discuss-phase.md`
- Fork architecture: `.planning/PROJECT.md`, `.planning/deliberations/v1.17-plus-roadmap-deliberation.md`
- Fork design rationale: `.planning/fork-audit/04-design-rationale.md`
