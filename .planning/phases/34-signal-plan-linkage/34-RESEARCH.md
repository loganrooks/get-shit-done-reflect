# Phase 34: Signal-Plan Linkage - Research

**Researched:** 2026-03-01
**Domain:** Signal lifecycle management, agent spec modifications, workflow integration
**Confidence:** HIGH

## Summary

Phase 34 closes the signal lifecycle end-to-end by wiring four capabilities together: (1) plans declare `resolves_signals` in PLAN.md frontmatter, (2) the planner agent recommends signal IDs based on active triaged signals, (3) execution completion auto-updates signal remediation status, and (4) the synthesizer detects recurrence and handles passive verification-by-absence. This is entirely an internal architecture phase -- no external libraries, no npm dependencies, no new commands. All work modifies existing agent specs, workflows, and the feature manifest.

The infrastructure from Phases 31-33 provides all the building blocks: the signal schema already defines `remediation`, `verification`, `recurrence_of`, and `lifecycle_log` fields (Phase 31); the synthesizer is already the sole KB writer with dedup and cap enforcement (Phase 32); and the reflector produces triage proposals and remediation suggestions (Phase 33). Phase 34 connects these pieces: the planner reads what the reflector suggests, plans declare what they fix, execution updates the signals, and the synthesizer checks for recurrence on subsequent collection runs.

The primary risk area is signal file mutation during execution -- the executor workflow must update signal files using `extractFrontmatter()` / `spliceFrontmatter()` while respecting the mutability boundary. Phase 33's roundtrip validation protocol (tested empirically and covered by unit tests) provides the safety pattern to follow. A prior lesson [les-2026-02-28-plans-must-verify-system-behavior-not-assume] reminds us that any plan asserting existing tool behavior must verify it first, which is critical for the execute-plan workflow hooks.

**Primary recommendation:** Implement as 4 plans: (1) schema + manifest additions for `resolves_signals` and `verification_window`, (2) planner agent signal awareness, (3) executor/workflow lifecycle transitions + synthesizer recurrence detection, (4) end-to-end lifecycle demonstration with a real signal + installer sync.

## Standard Stack

### Core

This phase has no external dependencies. All work is internal to the GSD framework.

| Component | Version | Purpose | Why Standard |
|-----------|---------|---------|--------------|
| `gsd-tools.js` | current | Frontmatter validation, state management | Existing CLI -- `FRONTMATTER_SCHEMAS.plan` needs `resolves_signals` added as optional |
| `feature-manifest.json` | 1.16.0 | Feature configuration schema | Existing manifest -- `signal_lifecycle` section needs `verification_window` setting |
| `agents/gsd-planner.md` | current | Plan creation agent | Existing agent -- needs signal awareness added to execution flow |
| `agents/gsd-signal-synthesizer.md` | current | KB writer agent | Existing agent -- needs recurrence detection and passive verification steps |
| `get-shit-done/workflows/execute-plan.md` | current | Plan execution orchestrator | Existing workflow -- needs post-completion signal update step |
| `agents/knowledge-store.md` | 2.0.0 | KB schema reference | Existing spec -- already defines all lifecycle fields needed |

### Supporting

| Component | Version | Purpose | When to Use |
|-----------|---------|---------|-------------|
| `kb-rebuild-index.sh` | current | Index regeneration after signal mutations | After any signal file is modified during remediation or verification updates |
| `extractFrontmatter()` / `spliceFrontmatter()` | in gsd-tools.js | YAML frontmatter read/write | For all signal file mutations -- proven safe via Phase 33 roundtrip tests |
| `frontmatter validate --schema signal` | in gsd-tools.js | Post-write validation | After every signal mutation to catch YAML corruption |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Workflow-level signal updates in execute-plan.md | Executor agent-level updates in gsd-executor.md | Workflow-level is correct: executor doesn't need signal awareness, separation of concerns. The executor runs tasks; the workflow manages the lifecycle transition after completion. This matches the ARCHITECTURE.md design. |
| New gsd-tools.js command for signal remediation | Agent-driven spliceFrontmatter calls | A gsd-tools.js `signal remediate` command would be cleaner long-term, but agent-driven splice is adequate for v1 and avoids modifying the upstream-owned gsd-tools.js file. |
| Separate `/gsd:verify-signals` command | Passive verification inside synthesizer | Passive verification-by-absence embedded in collect-signals requires zero extra ceremony. This is the deliberated design. |

## Architecture Patterns

### Files Modified (Estimated)

```
agents/
├── gsd-planner.md              # Add signal awareness to execution flow
├── gsd-signal-synthesizer.md   # Add recurrence detection + passive verification
├── knowledge-store.md          # Minor: document resolves_signals in plan schema
get-shit-done/
├── bin/gsd-tools.js            # Add resolves_signals to FRONTMATTER_SCHEMAS.plan optional
├── feature-manifest.json       # Add verification_window to signal_lifecycle schema
├── workflows/
│   ├── execute-plan.md         # Add post-completion signal remediation step
│   ├── plan-phase.md           # Pass triaged signals to planner context
│   └── reflect.md              # Remove Phase 34 dependency note (it shipped)
.claude/                        # Installer sync of all modified files
```

### Pattern 1: resolves_signals in PLAN.md Frontmatter (LIFECYCLE-01)

**What:** An optional array field in PLAN.md frontmatter linking plans to signal IDs they intend to resolve.
**When to use:** When a plan's tasks directly address the root cause of one or more triaged signals.

```yaml
# PLAN.md frontmatter
---
phase: 34-signal-plan-linkage
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [agents/knowledge-store.md, get-shit-done/bin/gsd-tools.js]
autonomous: true
resolves_signals:                    # NEW optional field
  - sig-2026-02-22-knowledge-surfacing-silently-removed
  - sig-2026-02-22-codebase-mapper-deleted-during-extraction
must_haves:
  truths: [...]
---
```

**Schema addition in gsd-tools.js:**
```javascript
// In FRONTMATTER_SCHEMAS.plan
plan: {
  required: ['phase', 'plan', 'type', 'wave', 'depends_on', 'files_modified', 'autonomous', 'must_haves'],
  optional: ['resolves_signals', 'gap_closure', 'user_setup']  // NEW: add optional field list
},
```

**Validation:** `resolves_signals` should be an array of strings matching the `sig-YYYY-MM-DD-*` pattern. The planner validates that referenced signal IDs exist in the KB index before including them. Non-existent IDs produce a warning but do not block plan creation (signals could be archived between planning and execution).

### Pattern 2: Planner Signal Awareness (LIFECYCLE-02)

**What:** The planner agent reads active triaged signals and recommends `resolves_signals` when creating plans whose tasks address signal root causes.
**When to use:** During standard plan creation (not gap closure or revision mode).

**Integration into planner execution flow:**

The `plan-phase.md` workflow adds a new step after `gather_phase_context`:

```markdown
<step name="load_triaged_signals">
Read active triaged signals for the current project:

1. Read ~/.gsd/knowledge/index.md
2. Filter signals where:
   - Project matches current project name
   - Lifecycle column shows "triaged"
   - Status is "active"
3. For matching signals, read triage.decision from index context
4. Filter to signals with triage.decision = "address" (skip dismiss/defer/investigate)
5. Read full signal files (max 10) to get root cause and remediation suggestion
6. Pass to planner as <triaged_signals> context
</step>
```

The planner agent gets a new section in its spec:

```markdown
<signal_awareness>
## Signal Awareness (resolves_signals)

When <triaged_signals> context is provided:

1. For each triaged signal, assess: "Does any task in this plan address the root cause?"
2. If YES: add the signal ID to resolves_signals in the plan frontmatter
3. Include a note in the relevant task's <action>: "This task addresses signal {sig-id}: {root cause summary}"

Do NOT force-fit signals. Only declare resolves_signals when the plan genuinely addresses the root cause.
Do NOT create tasks solely to resolve signals -- the primary planning objective takes precedence.
</signal_awareness>
```

### Pattern 3: Automatic Remediation on Plan Completion (LIFECYCLE-03)

**What:** When a plan with `resolves_signals` completes execution, the referenced signals automatically update to `remediated` status.
**When to use:** In the execute-plan workflow, after SUMMARY.md is created and self-check passes.

**New step in execute-plan.md (after `create_summary`, before `update_current_position`):**

```markdown
<step name="update_resolved_signals">
If the completed plan has resolves_signals in frontmatter:

1. Read resolves_signals array from PLAN.md frontmatter
2. For each signal ID:
   a. Read the signal file from ~/.gsd/knowledge/signals/{project}/{date}-{slug}.md
   b. Parse frontmatter with extractFrontmatter()
   c. Verify lifecycle_state is triaged or detected (skip if already remediated/verified/invalidated)
   d. Update ONLY mutable fields:
      - lifecycle_state: "remediated"
      - remediation:
          status: "complete"
          resolved_by_plan: "{phase}-{plan}"
          approach: "{plan objective from PLAN.md}"
          at: "{current ISO timestamp}"
      - lifecycle_log: append "triaged->remediated by executor at {timestamp}: plan {phase}-{plan} completed"
      - updated: "{current ISO timestamp}"
   e. Write back using spliceFrontmatter()
   f. Validate with: node gsd-tools.js frontmatter validate {file} --schema signal
   g. If validation fails, revert the file and log warning
3. Rebuild KB index: bash ~/.gsd/bin/kb-rebuild-index.sh
4. Log: "Updated {N} signals to remediated status"
</step>
```

**Key constraint:** The executor agent does NOT need modification. Signal updates happen at the workflow level (execute-plan.md), not in the executor agent. This is the correct separation: the executor focuses on task execution, the workflow manages lifecycle transitions.

### Pattern 4: Recurrence Detection in Synthesizer (LIFECYCLE-04)

**What:** The synthesizer checks new signals against remediated signals and links recurrences via `recurrence_of`.
**When to use:** During signal collection (collect-signals workflow), as part of the synthesizer's within-KB dedup step (Step 4).

**Extended Step 4 in gsd-signal-synthesizer.md:**

```markdown
### Step 4b: Recurrence Detection

After within-KB dedup (Step 4), check for recurrences:

1. Read remediated and verified signals from the KB index
   (lifecycle_state = "remediated" or "verified", same project)
2. For each new candidate signal:
   - Check against each remediated/verified signal:
     Same signal_type + 2+ overlapping tags = potential recurrence
   - If match found:
     a. Set candidate's recurrence_of = matched signal ID
     b. Apply recurrence_escalation (if enabled in config):
        - First recurrence of remediated: escalate severity one tier (minor->notable, notable->critical)
        - Recurrence of verified: always escalate to critical
     c. Log: "Recurrence detected: {new-summary} matches remediated signal {sig-id}"
     d. Regress the matched signal:
        - lifecycle_state: "detected" (regression)
        - verification.status: "failed" (if was verified)
        - lifecycle_log: append "remediated->detected by synthesizer at {timestamp}: recurrence detected in phase {N}"
        - updated: current timestamp
```

### Pattern 5: Passive Verification-by-Absence (LIFECYCLE-05)

**What:** After N phases with no recurrence, remediated signals move to `verified` status.
**When to use:** During signal collection, as part of the synthesizer's post-write phase.

**New Step in gsd-signal-synthesizer.md (after recurrence detection):**

```markdown
### Step 4c: Passive Verification Check

After recurrence detection:

1. Read verification_window from config:
   ```bash
   # Default: 3 phases
   WINDOW=$(cat .planning/config.json | jq -r '.signal_lifecycle.verification_window // 3')
   ```

2. Read all remediated signals (lifecycle_state = "remediated", same project)

3. For each remediated signal:
   a. Extract phase from remediation.at timestamp or remediation.resolved_by_plan
   b. Calculate phases_since_remediation = current_phase - remediation_phase
   c. If phases_since_remediation >= verification_window:
      - Check: was any recurrence detected for this signal in Step 4b?
      - If NO recurrence:
        Update signal:
        - lifecycle_state: "verified"
        - verification:
            status: "passed"
            method: "absence-of-recurrence"
            at: current timestamp
        - lifecycle_log: append "remediated->verified by synthesizer at {timestamp}: no recurrence in {N} phases"
        - updated: current timestamp
      - If recurrence found: signal already regressed in Step 4b, skip
```

**Configuration in feature-manifest.json:**

```json
"signal_lifecycle": {
  "schema": {
    "verification_window": {
      "type": "number",
      "default": 3,
      "min": 1,
      "max": 10,
      "description": "Number of phases with no recurrence before remediated signal is verified"
    }
  }
}
```

### Anti-Patterns to Avoid

- **Executor writing to KB directly:** The executor agent must NOT write to signal files. Signal updates happen in the execute-plan WORKFLOW, after the executor completes. This preserves the single-writer model (synthesizer for new signals, workflow for remediation updates).

- **Planner force-fitting signals:** The planner should NOT create tasks solely to resolve signals or contort plan structure to match signals. Signal resolution is opportunistic -- when plan tasks naturally address a signal's root cause, declare it. Otherwise, leave it for a future plan.

- **Modifying frozen detection payload fields:** When updating signals for remediation or verification, ONLY mutable lifecycle fields may change. The `spliceFrontmatter()` approach preserves the original YAML structure; the mutation code must explicitly limit itself to the mutable field set from knowledge-store.md Section 10.

- **Skipping post-write validation:** Every signal file mutation MUST be followed by `frontmatter validate --schema signal`. The Phase 33 roundtrip tests confirmed the serialization pipeline works, but production data may have edge cases (special characters in evidence strings, nested objects with colons in timestamps).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing/writing | Custom YAML parser | `extractFrontmatter()` / `spliceFrontmatter()` from gsd-tools.js | These functions handle YAML edge cases (quoted strings, nested objects, arrays). Phase 33 roundtrip tests validated their correctness. |
| Signal file validation | Custom field checker | `gsd-tools.js frontmatter validate --schema signal` | FRONTMATTER_SCHEMAS already encodes required/conditional/optional rules with backward_compat handling. |
| Index rebuilding | Manual index.md construction | `kb-rebuild-index.sh` | Script handles format, sorting, archived exclusion, lifecycle column extraction atomically. |
| Recurrence matching | Exact slug/title comparison | Same `signal_type` + 2+ overlapping tags (existing dedup algorithm) | This is the same matching algorithm used in synthesizer cross-sensor dedup and reflector pattern detection. Consistency matters. |

**Key insight:** Phase 34 is an integration phase. Nearly all the building blocks exist. The work is wiring, not creating. Use existing functions, patterns, and conventions rather than inventing new ones.

## Common Pitfalls

### Pitfall 1: Mutability Boundary Violation

**What goes wrong:** Updating a signal for remediation status accidentally modifies frozen detection payload fields (severity, tags, evidence, confidence).
**Why it happens:** `spliceFrontmatter()` replaces the entire frontmatter block. If the mutation code constructs a new object from scratch rather than modifying the parsed object in place, frozen fields could be lost or altered.
**How to avoid:** Read -> parse -> modify ONLY mutable fields -> splice. Never construct a new object. Verify frozen fields unchanged after write (before/after comparison on frozen field subset).
**Warning signs:** git diff on signal files shows changes outside the lifecycle/triage/remediation/verification sections.

### Pitfall 2: Race Between Remediation and Recurrence

**What goes wrong:** A plan completes and marks signals as remediated, then the synthesizer runs in the same session and checks for recurrence against signals that were just remediated moments ago.
**Why it happens:** Remediation happens in execute-plan workflow; recurrence detection happens in collect-signals workflow. If both run in the same session or very close together, timing matters.
**How to avoid:** This is not actually a race condition because the workflows run sequentially in practice: execute-plan runs first (completing the plan), then collect-signals runs later (analyzing the phase). The synthesizer reads the KB at collection time, so it will see the remediated state. No special handling needed, but document that collect-signals should run AFTER execution for the phase, not during.
**Warning signs:** Signals showing up as both remediated and having recurrence_of pointing to themselves.

### Pitfall 3: Signal ID References Breaking on Archival

**What goes wrong:** A plan declares `resolves_signals: [sig-xxx]`, but by the time execution runs, the signal has been archived (status: archived) and excluded from the index.
**Why it happens:** There can be time between planning and execution. Signals could be invalidated/archived during that gap.
**How to avoid:** When the execute-plan workflow processes `resolves_signals`, treat missing/archived signals as warnings, not errors. Log "Signal sig-xxx not found or archived, skipping remediation update" and continue.
**Warning signs:** Execution failures or crashes when processing resolves_signals with stale references.

### Pitfall 4: Lifecycle Strictness Mismatch

**What goes wrong:** Under `lifecycle_strictness: strict`, a signal must go detected -> triaged -> remediated (no skipping). But `lifecycle_strictness: flexible` allows detected -> remediated (fix without formal triage). The remediation step in execute-plan must respect the project's strictness setting.
**Why it happens:** The feature manifest has `lifecycle_strictness` with three modes. Plans might declare `resolves_signals` for signals that haven't been formally triaged.
**How to avoid:** In the execute-plan remediation step, check the signal's current `lifecycle_state` against the project's `lifecycle_strictness`:
- `strict`: Only update if lifecycle_state == "triaged"
- `flexible` (default): Update if lifecycle_state == "detected" OR "triaged"
- `minimal`: Update from any non-terminal state

**Warning signs:** Remediation updates silently failing because the signal is in `detected` state under `strict` mode.

### Pitfall 5: Planner Context Bloat from Signal Loading

**What goes wrong:** Loading full signal files for 20+ triaged signals into planner context exhausts the context budget before planning even begins.
**Why it happens:** The KB could have many triaged "address" signals. Reading all of them is O(n) in context tokens.
**How to avoid:** Cap at 10 signal files read. Use index metadata for initial filtering (project match, lifecycle=triaged, severity priority). Only read full files for top candidates. The plan-phase workflow should include a signal budget note.
**Warning signs:** Planner producing low-quality plans because most of its context was consumed by signal data.

### Pitfall 6: Verification Window Phase Counting

**What goes wrong:** Calculating "N phases since remediation" requires knowing the current phase number and the phase when remediation occurred. Phase numbering can be non-contiguous (31, 32, 33, not necessarily 1,2,3).
**Why it happens:** `remediation.resolved_by_plan` stores "34-01" but the synthesizer needs to know how many phases have elapsed since then.
**How to avoid:** Store the phase number in `remediation.resolved_by_plan` (already done -- format is "{phase}-{plan}"). Extract the phase number, compare to current phase number. The verification window counts completed phases, not elapsed time.
**Warning signs:** Signals never reaching "verified" status because the phase delta calculation is wrong.

## Code Examples

### Remediation Update Pattern (execute-plan.md)

```bash
# Source: execute-plan.md post-completion step
# Read resolves_signals from plan frontmatter
RESOLVES=$(node ~/.claude/get-shit-done/bin/gsd-tools.js frontmatter extract "$PLAN_PATH" --field resolves_signals 2>/dev/null)

if [ -n "$RESOLVES" ] && [ "$RESOLVES" != "null" ] && [ "$RESOLVES" != "[]" ]; then
  echo "Processing resolves_signals..."
  # Signal updates handled by executor subagent or main context via spliceFrontmatter
fi
```

### Signal File Mutation Pattern

```javascript
// Pattern used by both remediation (execute-plan) and verification (synthesizer)
// 1. Read file
const content = fs.readFileSync(signalPath, 'utf-8');
const fm = extractFrontmatter(content);

// 2. Verify current state allows transition
if (fm.lifecycle_state === 'remediated' || fm.lifecycle_state === 'verified') {
  console.log(`Signal ${fm.id} already ${fm.lifecycle_state}, skipping`);
  return;
}

// 3. Modify ONLY mutable fields
fm.lifecycle_state = 'remediated';
fm.remediation = {
  status: 'complete',
  resolved_by_plan: `${phase}-${plan}`,
  approach: planObjective,
  at: new Date().toISOString()
};
fm.lifecycle_log = fm.lifecycle_log || [];
fm.lifecycle_log.push(`triaged->remediated by executor at ${timestamp}: plan ${phase}-${plan} completed`);
fm.updated = new Date().toISOString();

// 4. Splice back and validate
const updated = spliceFrontmatter(content, fm);
fs.writeFileSync(signalPath, updated, 'utf-8');

// 5. Post-write validation
const result = cmdFrontmatterValidate(cwd, signalPath, 'signal', true);
if (!result.valid) {
  // Revert
  fs.writeFileSync(signalPath, content, 'utf-8');
  console.error(`Validation failed for ${signalPath}, reverted`);
}
```

### Recurrence Detection Pattern

```markdown
# In synthesizer Step 4b
For each new candidate signal:
  For each remediated/verified signal in KB (same project):
    IF same signal_type AND len(intersection(candidate.tags, existing.tags)) >= 2:
      candidate.recurrence_of = existing.id
      IF config.recurrence_escalation:
        candidate.severity = escalate(candidate.severity)  # minor->notable, notable->critical
      Regress existing signal:
        existing.lifecycle_state = "detected"
        existing.lifecycle_log.append("remediated->detected by synthesizer: recurrence detected")
```

### PLAN.md Frontmatter with resolves_signals

```yaml
---
phase: 34-signal-plan-linkage
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - agents/knowledge-store.md
  - get-shit-done/bin/gsd-tools.js
  - get-shit-done/feature-manifest.json
autonomous: true
resolves_signals:
  - sig-2026-02-22-knowledge-surfacing-silently-removed
  - sig-2026-02-22-codebase-mapper-deleted-during-extraction

must_haves:
  truths:
    - "PLAN.md frontmatter can include resolves_signals array"
  artifacts:
    - path: "get-shit-done/bin/gsd-tools.js"
      provides: "resolves_signals in FRONTMATTER_SCHEMAS.plan optional"
  key_links: []
---
```

## State of the Art

| Existing State | Phase 34 Addition | Impact |
|----------------|-------------------|--------|
| Plans have no signal awareness | `resolves_signals` optional field in PLAN.md frontmatter | Plans declare intent to fix signals |
| Planner has no signal context | Planner reads triaged signals, recommends resolves_signals | Plans are informed by reflector output |
| Signal lifecycle stops at "triaged" | Execute-plan workflow updates to "remediated" on completion | Lifecycle progresses automatically |
| No recurrence detection | Synthesizer checks new signals against remediated ones | Regressions caught passively |
| No verification mechanism | Passive verification-by-absence after N phases | Remediated signals confirmed or flagged |
| Phase 34 dependency notes in reflector/workflow | Notes removed (Phase 34 shipped) | Clean output without "coming soon" notes |

**Currently blocked items that Phase 34 unblocks:**
- Reflector remediation suggestions become actionable (plans can declare `resolves_signals`)
- Lifecycle dashboard will show movement beyond "triaged"
- Lessons can be distilled from fully verified signal cycles

## Open Questions

1. **Signal file mutation in execute-plan: agent or workflow?**
   - What we know: ARCHITECTURE.md says execute-plan workflow handles it, executor agent does NOT touch signals
   - What's clear: The workflow dispatches a subagent (executor) for task execution. Signal updates happen AFTER the subagent returns, in the main workflow context.
   - Recommendation: Signal updates in the main workflow context (Pattern A in execute-plan.md). The workflow reads the PLAN.md, executes via subagent, and then processes resolves_signals. This is the cleanest separation.

2. **Should the planner ALWAYS load signals or only when relevant?**
   - What we know: Loading signals costs context tokens. Not all phases relate to triaged signals.
   - What's clear: Loading should be conditional -- only when triaged "address" signals exist for the project.
   - Recommendation: The plan-phase workflow checks the KB index for triaged signals. If none exist (or none match the current phase's domain), skip signal loading entirely. Pass an empty `<triaged_signals>` to the planner, which then omits `resolves_signals`.

3. **How to handle the end-to-end lifecycle demonstration (LIFECYCLE-07)?**
   - What we know: At least one signal must complete detected -> triaged -> remediated -> verified during Phase 34.
   - What's clear: This requires: (a) a signal that's already triaged from Phase 33, (b) a plan that resolves it, (c) execution that marks it remediated, (d) enough phases for verification (or manual verification trigger).
   - Recommendation: Use a real triaged signal from the existing KB. If Phase 33 has triaged signals with `decision: address`, declare one in a Phase 34 plan's `resolves_signals`. For the `verified` step, since we can't wait 3 phases, either: (a) set `verification_window: 0` temporarily for the demo, or (b) manually trigger verification in the final plan's verification step.

## Sources

### Primary (HIGH confidence)
- `agents/knowledge-store.md` (v2.0.0) -- Signal schema, lifecycle state machine, mutability boundary, field definitions
- `.planning/research/ARCHITECTURE.md` -- Detailed `resolves_signals` design, integration points, data flow
- `.planning/research/FEATURES.md` -- Feature analysis with resolves_signals implementation details
- `.planning/REQUIREMENTS.md` -- LIFECYCLE-01 through LIFECYCLE-07 formal requirements
- `agents/gsd-planner.md` -- Current planner execution flow (no signal awareness yet)
- `agents/gsd-signal-synthesizer.md` -- Current synthesizer flow (no recurrence detection yet)
- `get-shit-done/workflows/execute-plan.md` -- Current execution workflow (no signal updates yet)
- `agents/gsd-reflector.md` -- Phase 33 reflector with remediation suggestions and Phase 34 dependency notes
- `.planning/phases/33-enhanced-reflector/33-VERIFICATION.md` -- Phase 33 completion confirmation

### Secondary (MEDIUM confidence)
- `.planning/deliberations/v1.16-signal-lifecycle-and-beyond.md` -- Original deliberation on resolves_signals design
- `.planning/research/STACK.md` -- Signal resolution data flow description
- `.planning/research/PITFALLS.md` -- Known pitfall: resolves_signals -> lifecycle requires verification

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| les-2026-02-28-plans-must-verify-system-behavior-not-assume | lesson | Plans asserting existing tool behavior must verify first | Common Pitfalls, Architecture Patterns |

Checked knowledge base (`~/.gsd/knowledge/index.md`): 50 signals scanned, 0 spikes found, 3 lessons reviewed. One lesson directly relevant (plans must verify system behavior). The other two lessons (extraction keep-lists, dynamic path resolution) are not directly relevant to Phase 34's signal lifecycle domain.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are internal and fully documented in the codebase
- Architecture: HIGH -- detailed design exists in ARCHITECTURE.md, FEATURES.md, and deliberation docs; Phase 33 built all prerequisite infrastructure
- Pitfalls: HIGH -- signal mutation has been empirically validated (Phase 33 roundtrip tests); lifecycle state machine is formally specified in knowledge-store.md

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (stable internal architecture, no external dependencies)
