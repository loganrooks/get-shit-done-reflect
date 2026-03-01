# Phase 35: Spike Audit & Lightweight Mode - Research

**Researched:** 2026-03-01
**Domain:** GSD spike workflow system -- audit, lightweight mode, feature manifest, end-to-end completion
**Confidence:** HIGH

## Summary

Phase 35 addresses the fact that the GSD spike system has comprehensive documentation and spec infrastructure but has never been used end-to-end in practice. One spike was started (001-runtime-capability-verification, Feb 2026) but only reached DESIGN.md -- it was never executed to completion. The root cause of non-use has two dimensions: (1) missing wiring that should connect the spike system to the planning workflow, and (2) excessive ceremony for questions that only need research, not experimentation.

The codebase investigation reveals three concrete gaps. First, plan-phase.md does NOT contain step 5.5 (the spike decision point). The spike-integration.md reference document specifies this step in detail, but it was never wired into the actual plan-phase.md workflow -- a grep for "spike", "5.5", and "SPIKE" in plan-phase.md returns zero matches. Second, the researcher's Open Questions output format uses a flat list structure (`1. **[Question]** - What we know / What's unclear / Recommendation`) that does not match the "Genuine Gaps" table format (`| Question | Criticality | Recommendation |`) that spike-integration.md expects to parse. Third, the feature manifest has no spike section, meaning spike_sensitivity and spike_enabled configuration are undiscoverable by the standard feature manifest machinery.

Phase 33 successfully built the reflect-to-spike pipeline: the reflector agent (gsd-reflector.md Step 8) flags spike candidates based on three triggers (investigate triage, low confidence after counter-evidence, marginal score within 20% of threshold). This output is correctly formatted and ready to feed into `/gsd:spike`. However, this pipeline has not been verified with a real spike candidate from an actual reflection run.

**Primary recommendation:** Fix the three wiring gaps (plan-phase step 5.5, researcher Genuine Gaps format, manifest spike section), implement a lightweight research-only spike mode that skips BUILD/RUN phases, complete at least one spike end-to-end, and verify the reflect-to-spike pipeline with a real candidate.

## Standard Stack

### Core

This phase modifies existing GSD workflow files -- no new libraries or external dependencies.

| File | Path | Purpose | Why It Matters |
|------|------|---------|----------------|
| plan-phase.md | `get-shit-done/workflows/plan-phase.md` | Planning orchestrator | Missing step 5.5 spike decision point |
| run-spike.md | `get-shit-done/workflows/run-spike.md` | Spike orchestrator | Needs lightweight mode branch |
| gsd-phase-researcher.md | `agents/gsd-phase-researcher.md` | Research agent | Open Questions format mismatch |
| spike-integration.md | `get-shit-done/references/spike-integration.md` | Spike wiring spec | Canonical spec for step 5.5 |
| spike-execution.md | `get-shit-done/references/spike-execution.md` | Spike phases/types | May need lightweight type |
| feature-manifest.json | `get-shit-done/feature-manifest.json` | Config schema | Needs spike section |
| gsd-spike-runner.md | `agents/gsd-spike-runner.md` | Spike execution agent | May need research-only path |
| gsd-reflector.md | `agents/gsd-reflector.md` | Reflection agent | Produces spike candidates (already implemented) |

### Supporting

| File | Path | Purpose | When Used |
|------|------|---------|-----------|
| spike-design.md | `agents/kb-templates/spike-design.md` | DESIGN.md template | Creating new spikes |
| spike-decision.md | `agents/kb-templates/spike-decision.md` | DECISION.md template | Documenting spike outcomes |
| spike.md (KB template) | `agents/kb-templates/spike.md` | KB entry template | Persisting spike to knowledge base |
| config.json | `.planning/config.json` | Project config | Reads spike_sensitivity, spike_enabled |
| reflection-patterns.md | `get-shit-done/references/reflection-patterns.md` | Section 12: Reflect-to-Spike | Pipeline trigger criteria |

### No External Dependencies

This phase is entirely internal to the GSD framework. No npm packages, no external tools.

## Architecture Patterns

### Current Spike System Architecture

```
/gsd:spike (command)
    |
    v
run-spike.md (workflow)
    |
    +-- Step 2: Research-First Advisory (already implemented)
    +-- Step 3: Create Workspace (.planning/spikes/{index}-{slug}/)
    +-- Step 4: Draft DESIGN.md
    +-- Step 5: User Confirmation (interactive) / Auto-approve (yolo)
    +-- Step 6: Spawn gsd-spike-runner agent
    |       |
    |       +-- BUILD phase
    |       +-- RUN phase
    |       +-- DOCUMENT phase (DECISION.md)
    |       +-- KB Persistence
    +-- Step 7: Handle Agent Result
    +-- Step 8: Update RESEARCH.md (if phase-linked)
    +-- Step 9: Report Result
```

### Pattern 1: Step 5.5 Spike Decision Point (NOT YET WIRED)

**What:** After research completes and before planning begins, the plan-phase orchestrator checks RESEARCH.md for "Genuine Gaps" and optionally triggers spikes.

**Current state:** spike-integration.md defines this completely but plan-phase.md does not reference it. The wiring is absent.

**Required wiring:** Insert between current Step 5 (research) and Step 6 (check existing plans) in plan-phase.md. The logic should:
1. Read RESEARCH.md for a "### Genuine Gaps" section
2. Parse gaps with criticality and recommendation
3. Apply sensitivity filter (conservative/balanced/aggressive from config)
4. Apply autonomy mode (interactive asks, yolo auto-spikes)
5. Execute approved spikes via run-spike.md
6. Update RESEARCH.md with resolutions

**Implementation pattern from spike-integration.md:**
```markdown
## 5.5. Handle Spike Decision Point

**Check for genuine gaps:**

Read `{PHASE_DIR}/*-RESEARCH.md`. Look for "### Genuine Gaps" section.

If no Genuine Gaps section or section is empty: proceed to planning.

If Genuine Gaps exist:
1. Parse gaps (question, criticality, recommendation)
2. Apply sensitivity filter
3. Apply autonomy mode
4. Execute spikes
5. Proceed to planning with updated RESEARCH.md
```

### Pattern 2: Researcher Genuine Gaps Emission

**What:** The researcher's Open Questions section must include a "Genuine Gaps" subsection with the structured format that step 5.5 expects.

**Current format (WRONG for spike integration):**
```markdown
## Open Questions

1. **[Question]**
   - What we know: [partial info]
   - What's unclear: [the gap]
   - Recommendation: [how to handle]
```

**Required format (matches spike-integration.md):**
```markdown
## Open Questions

### Resolved
- {Question}: {How research answered it}

### Genuine Gaps
| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| {Question} | Critical/Medium/Low | Spike/Defer/Accept-risk |

### Still Open
- {Questions that couldn't be resolved}
```

### Pattern 3: Lightweight Research Spike Mode

**What:** A spike type that skips BUILD and RUN phases entirely. Flow: Question -> Research -> Decision. No experiment code, no workspace experiments/ directory. The spike-runner performs research (web search, doc lookup, codebase analysis) instead of building and running experiments.

**When to use:** Questions answerable through documentation, codebase inspection, or web research rather than empirical experimentation. Examples:
- "Where does Claude Code store session logs?" (SENSOR-07)
- "Does library X support feature Y?"
- "What's the standard approach for problem Z?"

**Implementation approach:**
- Add a `research` mode to run-spike.md (alongside standard full mode)
- When mode is `research`, skip spawning gsd-spike-runner for BUILD/RUN
- Instead, perform research inline (or spawn researcher) and go directly to DECISION.md
- DESIGN.md still created (documents the question), but with `type: Research` or a flag like `lightweight: true`
- DECISION.md still required (documents the answer)
- KB entry still created (persists the finding)

### Pattern 4: Feature Manifest Spike Section

**What:** Add a `spike` feature to feature-manifest.json following the established pattern.

**Schema:**
```json
{
  "spike": {
    "scope": "project",
    "introduced": "1.16.0",
    "config_key": "spike",
    "schema": {
      "enabled": {
        "type": "boolean",
        "default": true,
        "description": "Whether spikes are enabled"
      },
      "sensitivity": {
        "type": "string",
        "enum": ["conservative", "balanced", "aggressive"],
        "default": "balanced",
        "description": "Which gap criticalities trigger spikes"
      },
      "auto_trigger": {
        "type": "boolean",
        "default": false,
        "description": "Whether plan-phase auto-triggers spikes for genuine gaps (vs advisory only)"
      }
    },
    "init_prompts": [
      {
        "field": "_gate",
        "question": "Configure spike settings?",
        "options": [
          { "value": "skip", "label": "Skip (use defaults)" },
          { "value": "configure", "label": "Configure now" }
        ],
        "skip_value": "skip"
      }
    ]
  }
}
```

### Anti-Patterns to Avoid

- **Modifying gsd-tools.js:** This is an upstream file. All spike config should work through the feature manifest and existing config.json patterns -- no gsd-tools.js changes needed.
- **Over-engineering the lightweight mode:** The log sensor spike question (SENSOR-07) is a simple research question. The lightweight mode should be dead simple -- not a complex new workflow.
- **Creating spike candidates without executing them:** Phase 33 built the candidate identification. Phase 35 must actually execute at least one. Don't just add more infrastructure.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Spike config storage | Custom config parsing | Feature manifest pattern | Manifest already handles schema, defaults, auto-detect, init prompts |
| Spike trigger logic | Inline spike checks | spike-integration.md spec | The spec already defines sensitivity matrix, autonomy modes, gap parsing |
| KB persistence | Manual file writes | Existing spike-runner KB step | gsd-spike-runner.md Step 6 already handles KB entry creation and index rebuild |
| Research-first check | New validation layer | Existing run-spike.md Step 2 | Research-First Advisory already implemented; lightweight mode extends it |

**Key insight:** The spike system specs (spike-integration.md, spike-execution.md) are well-designed. The problem is not design but wiring -- connecting specs to actual workflow code.

## Common Pitfalls

### Pitfall 1: Editing .claude/ Instead of Source Directories

**What goes wrong:** Changes to `.claude/agents/` or `.claude/get-shit-done/` get overwritten on next install.
**Why it happens:** The dual-directory architecture is easy to forget (this happened in Phase 22, took 23 days to detect).
**How to avoid:** Always edit `agents/`, `get-shit-done/`, `commands/` (npm source). Then run `node bin/install.js --local` to sync.
**Warning signs:** Files in `.claude/` differ from source directories.

### Pitfall 2: Format Mismatch Between Producer and Consumer

**What goes wrong:** The researcher produces Open Questions in one format, step 5.5 expects to parse a different format. The spike never triggers because the gap data is unparseable.
**Why it happens:** spike-integration.md was written as a standalone reference but the researcher spec was never updated to emit the required format.
**How to avoid:** When fixing the researcher's Open Questions format, verify the exact section headers and table columns match what spike-integration.md's parsing logic expects. Test with a sample RESEARCH.md.
**Warning signs:** Step 5.5 silently proceeds to planning because "no Genuine Gaps section" is found.

### Pitfall 3: Spike Never Completes End-to-End

**What goes wrong:** Spike infrastructure exists on paper but the system has never been exercised. Edge cases, missing fields, and broken flows lurk undiscovered.
**Why it happens:** Each prior phase focused on design and specs. The existing spike (001) stalled at DESIGN.md.
**How to avoid:** SPIKE-04 explicitly requires at least one spike completed end-to-end. Make this a concrete plan task, not a nice-to-have.
**Warning signs:** All spike artifacts are DESIGN.md files with `status: designing`.

### Pitfall 4: Plan-Phase Step Numbering Collision

**What goes wrong:** Inserting step 5.5 could break references to later steps if the plan-phase file uses hardcoded step numbers elsewhere.
**Why it happens:** The plan-phase.md uses numbered steps (1-13). Adding 5.5 is the designed approach (additive insertion), but if any code references "Step 6" by number, the semantic meaning shifts.
**How to avoid:** The spike-integration.md explicitly defines the insertion as "Step 5.5" (between 5 and 6), not renumbering. Follow this convention. Verify no hardcoded step number references break.
**Warning signs:** Comments or cross-references mentioning "Step 6" that should now reference "Step 7".

### Pitfall 5: Premature Spiking Advisory Already Exists

**What goes wrong:** Implementing a research-first gate that duplicates the existing Step 2 advisory in run-spike.md.
**Why it happens:** run-spike.md Step 2 "Research-First Advisory" was added after signal sig-2026-02-11-premature-spiking-no-research-gate. The lightweight mode should be an alternative path FROM that advisory, not a duplicate of it.
**How to avoid:** The lightweight mode integrates with the existing advisory: when the user agrees the question is research-suitable, instead of canceling, offer the lightweight research spike as option 4.
**Warning signs:** Two separate research-first checks in the spike flow.

## Code Examples

### Example 1: Step 5.5 Integration in plan-phase.md

```markdown
## 5.5. Handle Spike Decision Point

**Prerequisite:** Check if spike integration reference exists:

```bash
if [ -f "get-shit-done/references/spike-integration.md" ]; then
  # Apply spike decision point
else
  # Skip -- upstream GSD without reflect fork
fi
```

Read `{PHASE_DIR}/*-RESEARCH.md`. Look for "### Genuine Gaps" section.

If no Genuine Gaps section or section is empty: proceed to step 6.

If Genuine Gaps exist:

1. **Parse gaps:**
   For each row in the Genuine Gaps table:
   - question: the question text
   - criticality: Critical | Medium | Low
   - recommendation: Spike | Defer | Accept-risk

2. **Read spike config:**
   ```bash
   SPIKE_ENABLED=$(cat .planning/config.json 2>/dev/null | grep -o '"enabled"[[:space:]]*:[[:space:]]*[^,}]*' | head -1 | grep -o 'true\|false' || echo "true")
   SENSITIVITY=$(cat .planning/config.json 2>/dev/null | grep -o '"sensitivity"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)
   SENSITIVITY="${SENSITIVITY:-balanced}"
   ```

3. **Apply sensitivity filter** (per spike-integration.md matrix)

4. **Apply autonomy mode** (interactive: ask user; yolo: auto-spike)

5. **Execute approved spikes:**
   For each approved spike, invoke run-spike.md with question and phase

6. **Proceed to step 6** with RESEARCH.md updated
```
Source: spike-integration.md "plan-phase Integration" section

### Example 2: Lightweight Research Spike in run-spike.md

```markdown
### 2b. Lightweight Spike Option

If research-first advisory (Step 2) identifies the question as research-suitable:

**If mode == interactive:**
Present updated options:
1. Proceed with full spike (Build/Run/Document)
2. Cancel -- try research first (/gsd:research-phase)
3. Rephrase question to focus on the empirical aspect
4. **Run as lightweight research spike** (Question -> Research -> Decision, no BUILD/RUN)

If user selects 4: set SPIKE_MODE="research", proceed to workspace creation.

**If SPIKE_MODE == "research":**
- Create workspace and DESIGN.md as normal
- Add `mode: research` to DESIGN.md frontmatter
- SKIP Step 6 (do NOT spawn gsd-spike-runner)
- Instead, perform research:
  - WebSearch, Context7, WebFetch, codebase analysis
  - Gather evidence to answer the question
- Create DECISION.md directly from research findings
- Proceed to KB persistence and reporting as normal
```

### Example 3: Feature Manifest Spike Section

```json
"spike": {
  "scope": "project",
  "introduced": "1.16.0",
  "config_key": "spike",
  "schema": {
    "enabled": {
      "type": "boolean",
      "default": true,
      "description": "Whether the spike system is active"
    },
    "sensitivity": {
      "type": "string",
      "enum": ["conservative", "balanced", "aggressive"],
      "default": "balanced",
      "description": "Which gap criticalities trigger spikes (conservative=Critical only, balanced=Critical+Medium, aggressive=all)"
    },
    "auto_trigger": {
      "type": "boolean",
      "default": false,
      "description": "Whether plan-phase automatically triggers spikes for genuine gaps (false=advisory only)"
    }
  },
  "init_prompts": [
    {
      "field": "_gate",
      "question": "Configure spike experiment settings?",
      "options": [
        { "value": "skip", "label": "Skip (use defaults)" },
        { "value": "configure", "label": "Configure now" }
      ],
      "skip_value": "skip"
    }
  ]
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No spike system | Full spike infrastructure (specs, templates, agent) | Phase 03 (Feb 2026) | Spike system designed but never completed end-to-end |
| No research-first advisory | Step 2 advisory in run-spike.md | Feb 2026 (post-signal) | Addresses premature spiking, but no lightweight alternative |
| No reflect-to-spike pipeline | Reflector Step 8 flags spike candidates | Phase 33 (Feb 2026) | Pipeline outputs candidates but none have been executed |
| No spike config in manifest | spike_sensitivity derivable from depth | Phase 03 spec | Config exists in spike-integration.md spec but not in manifest |
| Step 5.5 designed in reference | Step 5.5 NOT wired in plan-phase.md | Never implemented | The primary orchestrator-triggered spike path does not work |

**Current state of the spike system:**
- **Well-designed:** spike-integration.md, spike-execution.md, gsd-spike-runner.md, templates are thorough
- **Partially wired:** run-spike.md works for standalone /gsd:spike invocation, research-first advisory exists
- **Not wired:** plan-phase.md has no step 5.5, researcher does not emit Genuine Gaps format
- **Never completed:** Only one spike attempted (001-runtime-capability-verification), stopped at DESIGN.md
- **Not configurable:** No spike section in feature manifest

## Open Questions

### Resolved

- **Does plan-phase.md contain step 5.5?** No, confirmed absent. Grep for "spike", "5.5", and "SPIKE" returns zero matches.
- **Does the researcher emit Genuine Gaps?** No. The Open Questions format is a flat numbered list, not the structured table format.
- **Has any spike completed end-to-end?** No. Spike 001 has only DESIGN.md (status: designing). No DECISION.md, no KB entry.
- **Does the feature manifest have a spike section?** No. Confirmed absent.
- **Is the reflect-to-spike pipeline implemented?** Yes, in gsd-reflector.md Step 8 and reflection-patterns.md Section 12. But never verified with real data.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Should the lightweight mode be a new spike type or a mode flag? | Medium | Accept-risk -- recommend mode flag (`mode: research` in DESIGN.md frontmatter) as it's simpler and doesn't require changing spike-execution.md type definitions |
| Should the existing incomplete spike 001 be completed or abandoned? | Low | Accept-risk -- recommend completing it as part of SPIKE-04 if it's still relevant, or creating a new simpler spike (like SENSOR-07 log location) |

### Still Open

- Whether auto_trigger should default to false or true in the manifest. Recommend false (advisory only) to avoid surprising users with automatic spike execution during planning.

## Sources

### Primary (HIGH confidence)

- `get-shit-done/workflows/plan-phase.md` -- Verified step 5.5 is ABSENT (zero grep matches)
- `get-shit-done/references/spike-integration.md` -- Canonical spec for step 5.5 wiring
- `get-shit-done/references/spike-execution.md` -- Spike types, phases, iteration rules
- `agents/gsd-phase-researcher.md` -- Verified Open Questions format lacks Genuine Gaps subsection
- `agents/gsd-spike-runner.md` -- Spike execution agent (BUILD/RUN/DOCUMENT)
- `agents/gsd-reflector.md` -- Verified Step 8 spike candidate flagging (3 triggers)
- `get-shit-done/references/reflection-patterns.md` -- Section 12 spike pipeline criteria
- `get-shit-done/workflows/run-spike.md` -- Current spike flow including research-first advisory
- `get-shit-done/feature-manifest.json` -- Verified no spike section exists
- `.planning/spikes/001-runtime-capability-verification/DESIGN.md` -- Only existing spike, status: designing

### Secondary (MEDIUM confidence)

- `~/.gsd/knowledge/signals/get-shit-done-reflect/2026-02-11-premature-spiking-no-research-gate.md` -- Signal that prompted research-first advisory
- `~/.gsd/knowledge/signals/get-shit-done-reflect/2026-02-11-spike-design-missing-feasibility.md` -- Signal about missing prerequisites in spike design
- `.planning/phases/33-enhanced-reflector/33-VERIFICATION.md` -- Confirms REFLECT-08 spike candidate flagging is verified
- `.planning/STATE.md` -- Confirms Phase 34 complete, Phase 35 next

## Metadata

**Confidence breakdown:**
- Audit findings (step 5.5, researcher format, manifest): HIGH -- direct code inspection, grep-verified
- Lightweight mode design: MEDIUM -- novel implementation, no prior art in codebase
- Reflect-to-spike pipeline: HIGH -- verified in Phase 33, code exists
- End-to-end completion: HIGH -- concrete gap, clear path

**Research date:** 2026-03-01
**Valid until:** 2026-03-31 (internal workflow files, stable)

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-11-premature-spiking-no-research-gate | signal | Standalone /gsd:spike has no research-first check | Architecture Patterns (lightweight mode extends existing advisory) |
| sig-2026-02-11-spike-design-missing-feasibility | signal | Spike design template lacks prerequisites section | Architecture Patterns (template already updated with Prerequisites section) |
| les-2026-02-28-plans-must-verify-system-behavior-not-assume | lesson | Plans must verify assertions through code inspection | Common Pitfalls (format mismatch pitfall -- verify producer/consumer formats match) |

**Spikes avoided:** 0 (no existing KB spike entries to deduplicate against)
