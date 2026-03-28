# Phase 53: Deep Integration - Research

**Researched:** 2026-03-28
**Domain:** Internal integration -- wiring adopted features into fork signal/automation/health/reflection pipeline
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

**Bridge file reading fallback:**
- If no bridge file exists (context-monitor not installed or not yet fired), automation.cjs must fall back gracefully to `options.contextPct` if provided, or skip deferral entirely.
- Grounding: The context-monitor hook fires on PostToolUse. If automation resolves before any tool call in a session, no bridge file will exist yet. The existing `options.contextPct` fallback ensures backward compatibility.

**Signal pipeline flow for VALIDATION.md:**
- VALIDATION.md findings flow through the established sensor -> synthesizer -> KB pipeline, not a separate path.
- Grounding: The single-writer principle (synthesizer owns KB writes) and the sensor contract (JSON with delimiters) are architectural invariants from Phase 34-35. Bypassing them would violate the signal lifecycle model.

**Cleanup exclusion approach:**
- Add an explicit `FORK_PROTECTED_DIRS` constant or list in the cleanup workflow rather than relying on implicit safety-by-construction.
- Grounding: Defense in depth. The cleanup workflow is safe today but could be extended upstream in ways that break the implicit safety. An explicit guard makes the protection visible and testable.

### Claude's Discretion

- Ordering of integration work across plans
- Whether validation-coverage probe threshold defaults to 80% or 90%
- How many KB lessons to surface in discuss-phase (top N by relevance)
- Whether to add a `context_monitor` feature entry to FEATURE_CAPABILITY_MAP or treat it as always-on infrastructure

### Deferred Ideas (OUT OF SCOPE)

- Per-agent model overrides integration with automation framework (FUT-05) -- which agents get which models at which automation level. Beyond INT-08's scope.
- Signal recurrence escalation across phases -- if validation-coverage gaps recur in phase N+1, automatically escalate severity. Beyond INT-02/INT-03's detection scope.
- KB surfacing in other workflows beyond discuss-phase -- plan-phase, execute-phase could also benefit from KB awareness. Out of scope for INT-04.

</user_constraints>

## Summary

Phase 53 is a pure integration phase: no new external dependencies, no new features, no new architectural patterns. Every requirement (INT-01 through INT-08) wires an already-adopted feature into the fork's existing signal/automation/health/reflection pipeline. The codebase investigation confirms that all eight integration points are well-scoped, the target code is accessible, and the contracts are established.

The highest-value integrations are INT-01 (bridge file deferral replacing wave-count estimation) and INT-02/INT-03 (VALIDATION.md artifact sensor integration), because they close the loop between context monitoring and automation behavior, and between nyquist validation and the signal pipeline. INT-04 (KB surfacing in discuss-phase) is additive but constrained by context budget considerations. INT-05 (cleanup guard), INT-06 (namespace verification), and INT-08 (FEATURE_CAPABILITY_MAP expansion) are straightforward defensive and structural changes. INT-07 (validation-coverage health probe) follows the established 3-probe pattern exactly.

Research resolved all five open questions from CONTEXT.md. The session_id for bridge file lookup should use a glob-for-most-recent pattern (avoiding a new CLI parameter). VALIDATION.md fields for artifact sensor signals should focus on per-task status counts (red/yellow/green) and overall compliance_pct. KB querying in discuss-phase should reuse the grep-on-index-then-read-entries pattern from the knowledge-surfacing reference. INT-06 is already satisfied by Phase 52 and needs only re-verification. Only `nyquist_validation` genuinely needs a FEATURE_CAPABILITY_MAP entry.

**Primary recommendation:** Organize plans by dependency order: (1) automation bridge + FEATURE_CAPABILITY_MAP, (2) artifact sensor + health probe, (3) discuss-phase KB surfacing + cleanup guard, (4) verification of INT-06 + integration test.

## Standard Stack

### Core

This phase uses NO external libraries. All changes are within the existing codebase:

| Module | Location | Purpose | Modified By |
|--------|----------|---------|-------------|
| automation.cjs | `get-shit-done/bin/lib/automation.cjs` | resolve-level, FEATURE_CAPABILITY_MAP | INT-01, INT-08 |
| health-probe.cjs | `get-shit-done/bin/lib/health-probe.cjs` | Health probes (signal-metrics, signal-density, automation-watchdog) | INT-07 |
| gsd-artifact-sensor.md | `agents/gsd-artifact-sensor.md` | Artifact sensor agent spec | INT-02, INT-03 |
| cleanup.md | `get-shit-done/workflows/cleanup.md` | Cleanup workflow | INT-05 |
| discuss-phase.md | `get-shit-done/workflows/discuss-phase.md` | Discuss-phase workflow | INT-04 |
| gsd-statusline.js | `hooks/gsd-statusline.js` | Bridge file writer (NOT modified -- consumed) | INT-01 reads its output |
| gsd-context-monitor.js | `hooks/gsd-context-monitor.js` | Context monitor hook (NOT modified -- consumed) | INT-01 reads same bridge file |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| vitest | Test runner (405 tests) | All integration changes need tests |
| gsd-tools.cjs | CLI entry point for automation commands | INT-01 adds new option parsing |

### Alternatives Considered

None -- this is internal integration work. No library choices to make.

## Architecture Patterns

### Pattern 1: Bridge File Reading for Context-Aware Deferral (INT-01)

**What:** Replace wave-count estimation in execute-phase with actual bridge file data from the statusline hook.

**Current state (lines 398-406 of execute-phase.md):**
```javascript
// Wave-count proxy: min(40 + (WAVES_COMPLETED * 10), 80)
// Approximate but functional. Ensures multi-wave phases trigger deferral.
LEVEL=$(node gsd-tools.cjs automation resolve-level signal_collection --context-pct {EST_CONTEXT_PCT} --raw)
```

**Target state:** automation.cjs reads the bridge file directly when `--context-pct` is not provided.

**Bridge file location:** `/tmp/claude-ctx-{session_id}.json`
**Bridge file format (verified from live file):**
```json
{"session_id":"06f30d79-...","remaining_percentage":80,"used_pct":24,"timestamp":1773100978}
```

**Session ID discovery:** The hooks receive `data.session_id` from Claude Code's stdin JSON. The CLI (`gsd-tools.cjs automation resolve-level`) does NOT have session_id. Two approaches researched:

1. **Add `--session-id` CLI flag** -- requires workflow changes to pass session_id
2. **Glob-for-most-recent** -- `fs.readdirSync(os.tmpdir()).filter(f => f.match(/^claude-ctx-.*\.json$/) && !f.includes('-warned'))`, pick most recent by mtime

**Recommendation: Glob-for-most-recent.** Rationale:
- No CLI contract change needed
- Works transparently when called from workflows that lack session ID
- The bridge file is updated on every Notification event (statusline fires frequently)
- Staleness check (timestamp < 60 seconds) prevents using old data from dead sessions
- Multiple concurrent sessions are rare; if they occur, the most-recent file is almost certainly the current session

**Fallback chain (locked decision from CONTEXT.md):**
1. Try bridge file (glob most recent, check staleness)
2. Fall back to `options.contextPct` if explicitly provided via CLI
3. If neither available, skip deferral (do not modify effective level)

**Code location:** `cmdAutomationResolveLevel()` in `automation.cjs`, between Step 2 (per-feature override) and Step 4 (runtime capability cap). Insert new Step 3a before the existing Step 3 (context-aware deferral).

```javascript
// Step 3a: Bridge file context reading (INT-01)
if (options.contextPct === undefined) {
  try {
    const tmpDir = os.tmpdir();
    const bridgeFiles = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith('claude-ctx-') && f.endsWith('.json') && !f.includes('-warned'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(tmpDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    if (bridgeFiles.length > 0) {
      const bridgeData = JSON.parse(fs.readFileSync(path.join(tmpDir, bridgeFiles[0].name), 'utf8'));
      const now = Math.floor(Date.now() / 1000);
      if (bridgeData.timestamp && (now - bridgeData.timestamp) <= 60) {
        options.contextPct = bridgeData.used_pct;
        reasons.push(`bridge_file: used_pct=${bridgeData.used_pct}%`);
      }
    }
  } catch {
    // Silent fail -- bridge is best-effort
  }
}
```

### Pattern 2: Artifact Sensor VALIDATION.md Scanning (INT-02, INT-03)

**What:** Add VALIDATION.md as a fourth scan target in the artifact sensor agent spec, with new detection rules.

**Current scan targets** (from artifact sensor Step 1):
- PLAN.md files
- SUMMARY.md files
- VERIFICATION.md (if exists)

**New target:** `{phase}-VALIDATION.md` (if exists)

**VALIDATION.md structure** (derived from validate-phase workflow Step 6):
```markdown
---
phase: N
phase_name: name
compliance_pct: 85
nyquist_compliant: false
last_audit: 2026-03-28
---
# Phase N: Name - Validation Strategy

## Test Infrastructure
| Component | Value |
|-----------|-------|
| Framework | vitest |
| Config | vitest.config.ts |
| Runner | npx vitest run |

## Per-Task Verification Map
| Task ID | Requirement | Automated Command | Status |
|---------|-------------|-------------------|--------|
| 53-01-T1 | INT-01 | `npx vitest run tests/unit/automation.test.js` | green |
| 53-01-T2 | INT-02 | (none) | red |

## Manual-Only
| Task ID | Requirement | Reason | Manual Instructions |
|---------|-------------|--------|---------------------|
| 53-02-T3 | INT-06 | Runtime-only | Verify namespace in installed files |
```

**New detection rule (SGNL-04: validation-coverage-gap):**

| Field | Signal Details |
|-------|---------------|
| Trigger | `compliance_pct` < 80 (configurable) OR any task with status `red` |
| signal_type | `capability-gap` |
| severity | `notable` if compliance_pct >= 60, `critical` if < 60 |
| tags | `validation-coverage`, `nyquist`, `testing` |
| evidence.supporting | List of red-status tasks, compliance_pct value |

**New detection rule (SGNL-05: validation-escalation):**

| Field | Signal Details |
|-------|---------------|
| Trigger | Manual-Only section has entries (tests that couldn't be automated) |
| signal_type | `epistemic-gap` |
| severity | `minor` (manual-only is expected for some requirements) |
| tags | `validation-coverage`, `manual-verification`, `epistemic-gap` |

### Pattern 3: KB Knowledge Surfacing in Discuss-Phase (INT-04)

**What:** Add a new step in discuss-phase between `scout_codebase` (step 5) and `analyze_phase` (step 6) that queries the KB for relevant lessons, spikes, and signals.

**Approach:** Follow the exact knowledge-surfacing reference pattern:
1. Read `.planning/knowledge/index.md` (or `~/.gsd/knowledge/index.md` fallback)
2. Extract phase goal keywords from ROADMAP.md
3. Grep index for tag matches against those keywords
4. Read up to 5 matching entry files
5. Build internal `<kb_context>` for use alongside `<codebase_context>` in analyze_phase

**Context budget:** Cap at 3-5 surfaced items (per guardrail G3). Each item contributes a one-liner summary, not full entry content. Total KB context should stay under ~500 tokens.

**Integration with steering brief model (DC-6):** KB surfacing adds a new `<kb_context>` internal variable. It does NOT modify the CONTEXT.md sections (Working Model, Derived Constraints, Open Questions, Epistemic Guardrails). Those sections remain intact as fork divergences. KB context flows into `analyze_phase` alongside `prior_decisions` and `codebase_context`.

**Example step to insert after scout_codebase:**
```markdown
<step name="surface_kb_knowledge">
Check for relevant knowledge base entries that might inform gray area identification.

**Step 1: Locate KB index**
```bash
if [ -d ".planning/knowledge" ]; then KB_DIR=".planning/knowledge"; else KB_DIR="$HOME/.gsd/knowledge"; fi
cat "$KB_DIR/index.md" 2>/dev/null || true
```

**Step 2: Extract phase keywords**
From the phase goal in ROADMAP.md, identify 3-5 domain keywords.

**Step 3: Scan for matches**
Grep the index for entries whose tags overlap with phase keywords. Use LLM judgment for semantic relevance.

**Step 4: Read top matches (max 5)**
For matching entries, read the full entry files.

**Step 5: Build internal kb_context**
```
<kb_context>
## Relevant KB Entries
- [les-xxx]: Summary of finding relevant to this phase
- [spk-xxx]: Summary of spike result relevant to this phase
- [sig-xxx]: Summary of signal relevant to this phase
</kb_context>
```

If no relevant entries found: skip silently. No workflow slowdown.
</step>
```

### Pattern 4: Cleanup Workflow Fork Protection (INT-05)

**What:** Add explicit `FORK_PROTECTED_DIRS` guard in cleanup.md.

**Current behavior (verified):** The cleanup workflow ONLY operates on `.planning/phases/{dir}`, moving them to `.planning/milestones/v{X.Y}-phases/`. It does NOT touch `.planning/knowledge/`, `.planning/deliberations/`, or `.planning/backlog/`. This is currently safe by construction.

**Required change (locked decision):** Add explicit protection even though currently safe:

```markdown
<!-- In cleanup.md, before archive_phases step -->
<step name="verify_fork_protection">
FORK_PROTECTED_DIRS = [".planning/knowledge", ".planning/deliberations", ".planning/backlog"]

Before any move operations, verify the move targets:
- List all directories that will be moved
- Assert NONE are in FORK_PROTECTED_DIRS
- If any match, ABORT with error: "SAFETY: Cannot archive fork-protected directory {dir}"
</step>
```

**Test:** Add a test that verifies protected directories are untouched after a simulated cleanup run. The test should:
1. Create a temp project with `.planning/phases/`, `.planning/knowledge/`, `.planning/deliberations/`, `.planning/backlog/`
2. Run the cleanup logic (or simulate it)
3. Assert all three protected directories still exist

### Pattern 5: Validation-Coverage Health Probe (INT-07)

**What:** Add `cmdHealthProbeValidationCoverage()` to health-probe.cjs.

**Follows the existing 3-probe pattern exactly:**
```javascript
function cmdHealthProbeValidationCoverage(cwd, raw) {
  // Scan .planning/phases/ for *-VALIDATION.md files
  // Parse frontmatter: compliance_pct, nyquist_compliant
  // Compute aggregate coverage
  // Return { probe_id, checks, dimension_contribution }
}
```

**Return shape (DC-4):**
```json
{
  "probe_id": "validation-coverage",
  "checks": [{
    "id": "VAL-COVERAGE-01",
    "description": "Nyquist validation coverage across phases",
    "status": "PASS|WARNING",
    "detail": "N/M phases validated, average compliance: X%",
    "data": {
      "phases_scanned": 5,
      "phases_with_validation": 3,
      "average_compliance_pct": 87,
      "below_threshold": ["phase-52"]
    }
  }],
  "dimension_contribution": {
    "type": "quality",
    "signals": { "critical": 0, "notable": 1, "minor": 0 }
  }
}
```

**Threshold recommendation:** 80%. Rationale:
- 90% is aspirational but would trigger warnings on phases with 1-2 manual-only tests
- 80% aligns with the "most requirements should have automated verification" principle
- The threshold should be configurable via `health_check.validation_threshold_pct` in config.json

### Pattern 6: FEATURE_CAPABILITY_MAP Expansion (INT-08)

**What:** Determine which adopted features need entries in FEATURE_CAPABILITY_MAP.

**Analysis of each adopted feature:**

| Feature | Triggered by automation level? | Depends on hooks? | Depends on Task()? | Needs map entry? |
|---------|-------------------------------|-------------------|--------------------|-----------------|
| context_monitor | No -- always-on hook | Yes (IS a hook) | No | No -- hooks run regardless of level |
| nyquist_validation | Yes -- can auto-trigger at level 3 | No | Yes (spawns auditor) | **YES** |
| kb_surfacing | No -- inline in discuss-phase | No | No | No -- controlled by workflow logic |

**Recommendation: Add only `nyquist_validation`:**
```javascript
nyquist_validation: {
  hook_dependent_above: null,  // workflow-triggered, not hook-based
  task_tool_dependent: true,   // spawns gsd-nyquist-auditor as subagent
},
```

The context_monitor should NOT get a map entry because it is infrastructure (a hook that runs on PostToolUse regardless of automation level). KB surfacing should NOT get a map entry because it is inline discuss-phase logic, not an automatable feature.

**Test impact:** The existing test `'FEATURE_CAPABILITY_MAP exports all four automation features'` hardcodes `['signal_collection', 'reflection', 'health_check', 'ci_status']`. This test must be updated to include `nyquist_validation` (5 features total).

### Pattern 7: INT-06 Namespace Verification

**What:** Verify that all adopted workflows/agents use the `gsdr:` namespace correctly.

**Research finding:** DC-7 confirms Phase 52 already verified namespace rewriting for all adopted files. INT-06 does not require new implementation -- only re-verification.

**Verification approach:** Re-run the namespace scan from Phase 52's TST-01 pattern:
1. Check all installed `.claude/commands/gsdr/` stubs reference `gsdr-` prefixed workflows/agents
2. Check all source files in `get-shit-done/workflows/` and `agents/` use `gsd-` prefix
3. Confirm installer's `replacePathsInContent()` rewrites correctly

This can be a verification step in the final plan rather than a standalone plan.

### Anti-Patterns to Avoid

- **Bypassing the sensor contract:** VALIDATION.md signals MUST go through the artifact sensor -> synthesizer pipeline. Do not create a separate signal-writing path.
- **Over-engineering bridge file reading:** Keep it simple -- glob, sort by mtime, read most recent, check staleness. Do not introduce IPC, shared memory, or environment variable passing.
- **Inflating discuss-phase context:** KB surfacing must be conservative (3-5 items max). The discuss-phase is an interactive workflow where context budget matters more than in batch workflows.
- **Adding FEATURE_CAPABILITY_MAP entries for always-on features:** Only add features that genuinely need automation-level gating. context_monitor is infrastructure, not a gated feature.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Signal output format | Custom JSON schema | Existing sensor contract (DC-2) | Established contract, synthesizer expects it |
| Health probe format | Custom response shape | Existing probe return shape (DC-4) | health-check workflow parses this shape |
| KB querying | Custom search engine | grep on index.md + read entries | knowledge-surfacing reference defines this pattern |
| Bridge file format | New IPC mechanism | `/tmp/claude-ctx-{id}.json` (DC-1) | statusline already writes this |

**Key insight:** Phase 53 creates NO new contracts. Every integration point follows an existing pattern. The entire phase is about wiring -- connecting existing outputs to existing inputs through established interfaces.

## Common Pitfalls

### Pitfall 1: Bridge File Staleness from Dead Sessions

**What goes wrong:** Multiple `claude-ctx-*.json` files accumulate in /tmp from different sessions. The glob picks the most recent by mtime, but that file might be from a different, still-running session.
**Why it happens:** The statusline hook writes on every Notification event. If two sessions run simultaneously, both write bridge files.
**How to avoid:** The staleness check (timestamp < 60 seconds ago) prevents using data from dead sessions. For concurrent sessions, the most-recent mtime is almost certainly the calling session because the statusline fires frequently. If this proves insufficient, a future enhancement could add `--session-id` to the CLI.
**Warning signs:** automation deferral triggering unexpectedly or not triggering when it should.

### Pitfall 2: Artifact Sensor Scanning Non-Existent VALIDATION.md

**What goes wrong:** The sensor spec is updated to scan VALIDATION.md, but most phases won't have one (nyquist validation is opt-in and new).
**Why it happens:** The artifact sensor runs on all phases, but VALIDATION.md only exists after `/gsd:validate-phase` is run.
**How to avoid:** The sensor already handles missing VERIFICATION.md gracefully (Step 1: "if it exists"). Apply the same pattern to VALIDATION.md: scan only if the file exists, skip silently if not.
**Warning signs:** Sensor errors on phases without VALIDATION.md.

### Pitfall 3: Test Hardcoding FEATURE_CAPABILITY_MAP Size

**What goes wrong:** Adding `nyquist_validation` to the map breaks the existing test that hardcodes `['signal_collection', 'reflection', 'health_check', 'ci_status']`.
**Why it happens:** The test in `install.test.js` (line 2714) uses an exact array match.
**How to avoid:** Update the test to include `nyquist_validation` in the expected features array. Also verify the manifest-correspondence test handles the new entry.
**Warning signs:** CI test failures after adding the map entry.

### Pitfall 4: Cleanup Workflow Source vs Runtime Path Divergence

**What goes wrong:** The cleanup workflow uses `~/.claude/get-shit-done/` paths (global prefix) in source. After install, these become `./.claude/get-shit-done-reflect/` paths. The `FORK_PROTECTED_DIRS` constant must use relative paths that work in both contexts.
**Why it happens:** The dual-directory architecture with path rewriting.
**How to avoid:** Use relative paths from cwd (`.planning/knowledge/`, `.planning/deliberations/`, `.planning/backlog/`) which are stable regardless of where the workflow file lives.
**Warning signs:** Protection guard not matching because of absolute vs relative path mismatch.

### Pitfall 5: KB Index Missing in Fresh Projects

**What goes wrong:** discuss-phase KB surfacing step reads `.planning/knowledge/index.md` which may not exist in projects that haven't collected signals yet.
**Why it happens:** The KB is created on first signal collection, not on project init.
**How to avoid:** Check existence before reading: `cat "$KB_DIR/index.md" 2>/dev/null || true`. Skip silently if not found. This matches the existing pattern in knowledge-surfacing reference.
**Warning signs:** Error messages in discuss-phase output about missing files.

## Code Examples

### Bridge File Reading in automation.cjs

```javascript
// Source: hooks/gsd-statusline.js lines 37-50 (bridge file writer)
// and hooks/gsd-context-monitor.js lines 62-70 (bridge file reader)

// In cmdAutomationResolveLevel, before existing context-aware deferral:
if (options.contextPct === undefined) {
  try {
    const tmpDir = os.tmpdir();
    const bridgeFiles = fs.readdirSync(tmpDir)
      .filter(f => f.startsWith('claude-ctx-') && f.endsWith('.json') && !f.includes('-warned'))
      .map(f => ({ name: f, mtime: fs.statSync(path.join(tmpDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);

    if (bridgeFiles.length > 0) {
      const bridgeData = JSON.parse(
        fs.readFileSync(path.join(tmpDir, bridgeFiles[0].name), 'utf8')
      );
      const now = Math.floor(Date.now() / 1000);
      const STALE_SECONDS = 120; // 2 minutes -- wider than monitor's 60s
      if (bridgeData.timestamp && (now - bridgeData.timestamp) <= STALE_SECONDS) {
        options.contextPct = bridgeData.used_pct;
        reasons.push(`bridge_file: used_pct=${bridgeData.used_pct}%`);
      }
    }
  } catch {
    // Silent fail -- bridge is best-effort, fall through to existing path
  }
}
// Existing context-aware deferral logic follows unchanged
```

### Validation-Coverage Health Probe

```javascript
// Source: health-probe.cjs existing probe pattern
function cmdHealthProbeValidationCoverage(cwd, raw) {
  const phasesDir = path.join(cwd, '.planning', 'phases');
  if (!fs.existsSync(phasesDir)) {
    const result = {
      probe_id: 'validation-coverage',
      checks: [{
        id: 'VAL-COVERAGE-01',
        description: 'Nyquist validation coverage across phases',
        status: 'PASS',
        detail: 'No phases directory found',
        data: { phases_scanned: 0, phases_with_validation: 0 },
      }],
      dimension_contribution: { type: 'quality', signals: { critical: 0, notable: 0, minor: 0 } },
    };
    if (raw) { process.stdout.write(JSON.stringify(result)); process.exit(0); }
    console.log('Validation Coverage: No phases directory'); process.exit(0);
  }

  // Read threshold from config
  let threshold = 80;
  try {
    const configPath = path.join(cwd, '.planning', 'config.json');
    if (fs.existsSync(configPath)) {
      const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (cfg.health_check?.validation_threshold_pct) {
        threshold = cfg.health_check.validation_threshold_pct;
      }
    }
  } catch { /* use default */ }

  // Scan for VALIDATION.md files
  const phaseDirs = fs.readdirSync(phasesDir, { withFileTypes: true })
    .filter(d => d.isDirectory());

  let scanned = 0, withValidation = 0, totalCompliance = 0;
  const belowThreshold = [];

  for (const dir of phaseDirs) {
    scanned++;
    const valFiles = fs.readdirSync(path.join(phasesDir, dir.name))
      .filter(f => f.endsWith('-VALIDATION.md'));
    if (valFiles.length === 0) continue;

    withValidation++;
    // Parse compliance_pct from frontmatter
    const content = fs.readFileSync(path.join(phasesDir, dir.name, valFiles[0]), 'utf8');
    const match = content.match(/^compliance_pct:\s*(\d+)/m);
    const pct = match ? parseInt(match[1]) : 0;
    totalCompliance += pct;
    if (pct < threshold) belowThreshold.push(dir.name);
  }

  const avgCompliance = withValidation > 0 ? Math.round(totalCompliance / withValidation) : 0;
  const status = belowThreshold.length === 0 ? 'PASS' : 'WARNING';

  // ... build and return result matching probe shape (DC-4)
}
```

### FEATURE_CAPABILITY_MAP with nyquist_validation

```javascript
// Source: automation.cjs FEATURE_CAPABILITY_MAP
const FEATURE_CAPABILITY_MAP = {
  signal_collection: {
    hook_dependent_above: null,
    task_tool_dependent: false,
  },
  reflection: {
    hook_dependent_above: null,
    task_tool_dependent: true,
  },
  health_check: {
    hook_dependent_above: 2,
    task_tool_dependent: false,
  },
  ci_status: {
    hook_dependent_above: 1,
    task_tool_dependent: false,
  },
  // INT-08: Nyquist validation
  nyquist_validation: {
    hook_dependent_above: null,   // workflow-triggered, not hook-based
    task_tool_dependent: true,    // spawns gsd-nyquist-auditor via Task()
  },
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Wave-count estimation for context % | Bridge file from statusline hook | Phase 53 (this phase) | Accurate deferral decisions |
| Artifact sensor scans 3 file types | Artifact sensor scans 4 file types (+ VALIDATION.md) | Phase 53 (this phase) | Validation gaps generate signals |
| discuss-phase lacks KB awareness | discuss-phase surfaces KB entries during scouting | Phase 53 (this phase) | Prior knowledge informs discussion |
| Cleanup implicitly safe | Cleanup explicitly guarded | Phase 53 (this phase) | Defense in depth for fork dirs |
| 4-feature FEATURE_CAPABILITY_MAP | 5-feature map (+ nyquist_validation) | Phase 53 (this phase) | resolve-level handles validation |

## Open Questions

### Resolved

- **Q1 (Session ID for bridge file lookup):** Use glob-for-most-recent pattern on `/tmp/claude-ctx-*.json` files. No CLI parameter change needed. Verified: live bridge files exist at that path with the expected format. Staleness check prevents stale data.

- **Q2 (VALIDATION.md fields for signals):** Focus on `compliance_pct` from frontmatter and per-task status counts (red/yellow/green) from the verification map table. SGNL-04 (coverage-gap) triggers on low compliance or red tasks. SGNL-05 (validation-escalation) triggers on manual-only entries.

- **Q3 (KB querying in discuss-phase):** Use the established knowledge-surfacing pattern: read index.md, grep for tag matches against phase keywords, read top 5 matching entries, build internal `<kb_context>`. Cap at 3-5 items per guardrail G3.

- **Q4 (INT-06 already satisfied):** Yes. Phase 52 verified namespace rewriting for all adopted files. INT-06 needs only re-verification in Phase 53 (not new implementation). The verification should be a checkpoint in the final plan, not a dedicated plan.

- **Q5 (Which features need map entries):** Only `nyquist_validation` needs a FEATURE_CAPABILITY_MAP entry (`task_tool_dependent: true`, `hook_dependent_above: null`). context_monitor is always-on infrastructure. KB surfacing is inline workflow logic.

### Genuine Gaps

| Question | Criticality | Recommendation |
|----------|-------------|----------------|
| Exact VALIDATION.md frontmatter format | Low | Accept first VALIDATION.md produced by validate-phase as ground truth, then tune detection rules |

### Still Open

- None. All material questions resolved through codebase investigation.

## Sources

### Primary (HIGH confidence)

- `get-shit-done/bin/lib/automation.cjs` -- FEATURE_CAPABILITY_MAP structure, resolve-level logic, context-aware deferral
- `get-shit-done/bin/lib/health-probe.cjs` -- existing 3-probe pattern (signal-metrics, signal-density, automation-watchdog)
- `agents/gsd-artifact-sensor.md` -- sensor contract, detection rules SGNL-01/02/03, JSON output format
- `get-shit-done/workflows/cleanup.md` -- 153-line workflow, only operates on `.planning/phases/` dirs
- `get-shit-done/workflows/discuss-phase.md` -- scout_codebase step (lines 299-339), analyze_phase step
- `get-shit-done/workflows/validate-phase.md` -- VALIDATION.md creation (Step 6), auditor spawning
- `hooks/gsd-statusline.js` -- bridge file writer (lines 37-50), format verified
- `hooks/gsd-context-monitor.js` -- bridge file reader (lines 62-70), session_id from stdin
- `get-shit-done/workflows/collect-signals.md` -- sensor orchestration, discovery, output collection
- `tests/unit/install.test.js` -- FEATURE_CAPABILITY_MAP test (lines 2713-2810)
- `tests/unit/automation.test.js` -- resolve-level test pattern
- `/tmp/claude-ctx-*.json` -- live bridge files verified format and contents
- `.planning/config.json` -- current automation config, health_check settings
- `get-shit-done/feature-manifest.json` -- feature definitions, schema declarations
- `.planning/REQUIREMENTS.md` -- INT-01 through INT-08 formal definitions

### Secondary (MEDIUM confidence)

- `get-shit-done/workflows/execute-phase.md` (lines 398-406) -- wave-count estimation context, how resolve-level is called
- `.claude/get-shit-done-reflect/references/knowledge-surfacing.md` -- KB querying pattern for discuss-phase integration

## Knowledge Applied

Checked knowledge base (`.planning/knowledge/index.md`), 137 entries scanned (136 signals, 1 spike).

**Relevant entries examined:**
- `spk-2026-03-01-claude-code-session-log-location` -- spike about Claude Code session log location. Tangentially relevant to Q1 (session ID discovery) but the spike investigated log file paths, not bridge file paths. The spike confirmed Claude Code provides `session_id` in hook input data, which validates our understanding that the statusline hook has access to session_id.

**No lessons exist in the KB yet** -- only signals and one spike. No spike deduplication needed (no spike covers bridge file reading, artifact sensor extension, or discuss-phase KB surfacing).

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| spk-2026-03-01-claude-code-session-log-location | spike | Confirmed session_id available in hook input | Architecture Patterns (INT-01 bridge file) |

Spikes avoided: 0 (no existing spikes overlap with Phase 53 research questions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all source files read and verified, no external dependencies
- Architecture: HIGH -- all patterns follow established codebase conventions, code examples verified against source
- Pitfalls: HIGH -- derived from actual codebase investigation, not hypothetical

**Research date:** 2026-03-28
**Valid until:** 2026-04-28 (stable -- internal codebase, no external dependency drift)
