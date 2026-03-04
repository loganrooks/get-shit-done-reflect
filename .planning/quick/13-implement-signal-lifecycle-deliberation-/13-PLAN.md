---
phase: quick-13
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/bin/reconcile-signal-lifecycle.sh
  - get-shit-done/workflows/execute-phase.md
  - get-shit-done/references/health-check.md
  - get-shit-done/workflows/health-check.md
  - .planning/PROJECT.md
autonomous: true
must_haves:
  truths:
    - "reconcile-signal-lifecycle.sh exists, is executable, and can parse resolves_signals from PLAN.md files"
    - "execute-phase.md calls reconcile-signal-lifecycle.sh between verify_phase_goal and update_roadmap steps"
    - "health-check.md includes lifecycle consistency checks that flag plans declaring resolves_signals for signals still in detected state"
    - "PROJECT.md Key Decisions table includes the programmatic-over-instructions design principle"
  artifacts:
    - path: "get-shit-done/bin/reconcile-signal-lifecycle.sh"
      provides: "Signal lifecycle reconciliation script"
    - path: "get-shit-done/workflows/execute-phase.md"
      provides: "Reconciliation integration point"
      contains: "reconcile-signal-lifecycle"
    - path: "get-shit-done/references/health-check.md"
      provides: "Lifecycle consistency watchdog checks"
      contains: "lifecycle_state"
    - path: ".planning/PROJECT.md"
      provides: "Design principle decision record"
      contains: "programmatic"
  key_links:
    - from: "get-shit-done/workflows/execute-phase.md"
      to: "get-shit-done/bin/reconcile-signal-lifecycle.sh"
      via: "bash call after verify_phase_goal"
      pattern: "reconcile-signal-lifecycle\\.sh"
    - from: "get-shit-done/references/health-check.md"
      to: "resolves_signals frontmatter"
      via: "cross-reference check"
      pattern: "resolves_signals"
---

<objective>
Implement signal lifecycle deliberation conclusions: programmatic reconciliation script, health check watchdog, and design principle.

Purpose: Close the gap where signal lifecycle transitions were agent-instruction-based (unreliable) by making them programmatic (shell script called from execute-phase.md). Add a health check watchdog to detect when plans claim to resolve signals but the signals remain in detected state. Record the design principle in PROJECT.md.

Output: One new shell script, two edited workflow/reference files, one edited PROJECT.md.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary-standard.md
</execution_context>

<context>
@.planning/STATE.md
@get-shit-done/workflows/execute-phase.md
@get-shit-done/references/health-check.md
@get-shit-done/workflows/health-check.md
@.planning/PROJECT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create reconciliation script and integrate into execute-phase</name>
  <files>
    get-shit-done/bin/reconcile-signal-lifecycle.sh
    get-shit-done/workflows/execute-phase.md
  </files>
  <action>
    Create `get-shit-done/bin/reconcile-signal-lifecycle.sh` (make executable with chmod +x):

    - Shebang: `#!/usr/bin/env bash`, `set -euo pipefail`
    - Accept one argument: phase directory path (e.g., `.planning/phases/38-extensible-sensor-architecture`)
    - Validate argument exists and is a directory
    - Find all `*-PLAN.md` files in the directory
    - For each PLAN.md:
      - Extract resolves_signals using: `node ~/.claude/get-shit-done/bin/gsd-tools.js frontmatter get "$plan" --field resolves_signals --raw`
      - Validate the output starts with `[` (is a JSON array, not an error object like `{"error":...}`)
      - If not a valid array or field not found, skip this plan silently
      - Parse the JSON array to extract each signal ID (use node -e inline for JSON parsing)
    - For each signal ID found:
      - Locate signal file: find in `~/.gsd/knowledge/signals/` recursively by filename matching `${sig_id}.md` (signals may be in project subdirs)
      - If signal file not found, print warning and continue
      - Update the signal file:
        - Change `lifecycle_state: detected` (or `triaged`) to `lifecycle_state: remediated` using sed
        - Append a `lifecycle_log` entry after existing lifecycle_log entries (or at end of frontmatter if no lifecycle_log exists):
          ```
          lifecycle_log:
            - event: remediated
              resolved_by_plan: "{plan_basename}"
              approach: "programmatic reconciliation"
              timestamp: "{ISO 8601 timestamp}"
          ```
        - If lifecycle_log already exists (grep for `lifecycle_log:`), append the new entry as an additional list item under the existing ones
    - After all signals processed, rebuild KB index: `~/.gsd/bin/kb-rebuild-index.sh`
    - Print summary: "Reconciled N signals from M plans in {phase_dir}"

    Edit `get-shit-done/workflows/execute-phase.md`:
    - Add a new step `reconcile_signal_lifecycle` between `verify_phase_goal` (line ~297) and `update_roadmap` (line ~357)
    - The step should:
      - Only run if verification passed (`status: passed` or `human_needed` that was approved)
      - Call: `bash ~/.claude/get-shit-done/bin/reconcile-signal-lifecycle.sh "${PHASE_DIR}"`
      - Note that this is a best-effort step -- if it fails, log the error but do not block phase completion
    - Use the `~/.claude/` prefix (runtime path, not npm source path) since this is a workflow file

    Note: The script itself uses `~/.claude/get-shit-done/bin/gsd-tools.js` for the frontmatter command (runtime path). For the KB rebuild it uses `~/.gsd/bin/kb-rebuild-index.sh` (already installed there by the installer).
  </action>
  <verify>
    - `test -x get-shit-done/bin/reconcile-signal-lifecycle.sh` (executable)
    - `bash -n get-shit-done/bin/reconcile-signal-lifecycle.sh` (valid syntax)
    - `grep -q "reconcile-signal-lifecycle" get-shit-done/workflows/execute-phase.md` (integration point exists)
    - Verify the new step appears AFTER verify_phase_goal and BEFORE update_roadmap in execute-phase.md
  </verify>
  <done>
    reconcile-signal-lifecycle.sh is a valid, executable shell script that extracts resolves_signals from PLAN.md files and updates signal lifecycle_state to remediated. execute-phase.md calls it after verification passes. Script is also runnable standalone for backfill.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add lifecycle watchdog to health check and record design principle</name>
  <files>
    get-shit-done/references/health-check.md
    get-shit-done/workflows/health-check.md
    .planning/PROJECT.md
  </files>
  <action>
    Edit `get-shit-done/references/health-check.md`:

    Add a new check category section `### 2.6 Signal Lifecycle Consistency (Default Tier)` after section 2.5 (Config Drift).

    Add these checks:

    | # | Check | Pass Condition | Fail Severity |
    |---|-------|----------------|---------------|
    | SIG-01 | Resolved signals updated | For each plan with `resolves_signals`, referenced signals have `lifecycle_state: remediated` or later | WARNING |
    | SIG-02 | No orphaned resolutions | No plan references a signal ID that doesn't exist in the KB | WARNING |

    Include shell patterns:

    ```bash
    # SIG-01: Resolved signals updated
    # Find all PLAN.md files with resolves_signals declarations
    inconsistencies=0
    while IFS= read -r plan; do
      raw=$(node ~/.claude/get-shit-done/bin/gsd-tools.js frontmatter get "$plan" --field resolves_signals --raw 2>/dev/null || echo "")
      # Skip if not a valid array
      echo "$raw" | grep -q '^\[' || continue
      # Parse signal IDs
      for sig_id in $(echo "$raw" | node -e "process.stdin.on('data',d=>{try{JSON.parse(d).forEach(s=>console.log(s))}catch{}})" 2>/dev/null); do
        sig_file=$(find ~/.gsd/knowledge/signals -name "${sig_id}.md" 2>/dev/null | head -1)
        [ -z "$sig_file" ] && continue
        state=$(grep "^lifecycle_state:" "$sig_file" 2>/dev/null | head -1 | sed 's/^lifecycle_state:[[:space:]]*//')
        if [ "$state" = "detected" ] || [ "$state" = "triaged" ]; then
          echo "  WARNING: Plan $(basename "$plan") declares it resolves $sig_id, but signal is still in '$state' state"
          inconsistencies=$((inconsistencies + 1))
        fi
      done
    done < <(find .planning/phases -name '*-PLAN.md' 2>/dev/null)
    [ "$inconsistencies" -eq 0 ] && echo "PASS: All declared signal resolutions are consistent" || echo "WARNING: $inconsistencies lifecycle inconsistencies found"
    ```

    Add SIG-01 to the repairable issues table in Section 5:
    | Signal lifecycle mismatch (SIG-01) | Run `reconcile-signal-lifecycle.sh` on affected phase directories | Low -- updates lifecycle metadata only |

    Update the mode table in Section 1 to include Signal Lifecycle Consistency in Default tier checks.

    Edit `get-shit-done/workflows/health-check.md`:

    In the `execute_checks` step, add Signal Lifecycle Consistency (SIG-01, SIG-02) to the category execution order list (after Stale Artifacts, position 4, shifting Planning Consistency to 5 and Config Drift to 6). Also add it to the `determine_scope` step's default categories list: `categories = [KB Integrity, Config Validity, Stale Artifacts, Signal Lifecycle Consistency]`.

    Edit `.planning/PROJECT.md`:

    Add a new row to the Key Decisions table (at the end, before the `---` separator):

    | Critical state transitions must be programmatic (scripts/hooks), not agent instructions | Agent instructions are unreliable at ensuring every step fires in long sequences -- executor skipped update_resolved_signals despite code existing in execute-plan.md | Deliberation concluded -- reconcile-signal-lifecycle.sh replaces agent-instruction-based transitions |
  </action>
  <verify>
    - `grep -q "SIG-01" get-shit-done/references/health-check.md` (lifecycle checks added)
    - `grep -q "Signal Lifecycle" get-shit-done/workflows/health-check.md` (workflow updated)
    - `grep -q "programmatic" .planning/PROJECT.md` (design principle recorded)
    - `grep -q "reconcile-signal-lifecycle" get-shit-done/references/health-check.md` (repair action references script)
  </verify>
  <done>
    Health check reference includes SIG-01 and SIG-02 lifecycle consistency checks at WARNING severity. Health check workflow references the new checks in execution order and default scope. PROJECT.md records the design principle that critical state transitions must be programmatic.
  </done>
</task>

<task type="auto">
  <name>Task 3: Install locally and run tests</name>
  <files></files>
  <action>
    Run `node bin/install.js --local` to sync npm source files to .claude/ directory.

    Run `npm test` to verify all 329+ tests still pass.

    If any tests fail, diagnose and fix. The changes are to Markdown workflow files and a new shell script, so test failures would indicate an unrelated pre-existing issue or an accidental file corruption during editing.

    Also verify the script was correctly installed:
    - `test -x .claude/get-shit-done/bin/reconcile-signal-lifecycle.sh`
    - `grep -q "reconcile-signal-lifecycle" .claude/get-shit-done/workflows/execute-phase.md`
  </action>
  <verify>
    - `npm test` passes
    - `.claude/get-shit-done/bin/reconcile-signal-lifecycle.sh` exists and is executable
    - `.claude/get-shit-done/workflows/execute-phase.md` contains the reconciliation step
    - `.claude/get-shit-done/references/health-check.md` contains SIG-01
  </verify>
  <done>
    Local install completed, all files synced to .claude/, and full test suite passes. The reconciliation script, execute-phase integration, health check watchdog, and design principle are all in place.
  </done>
</task>

</tasks>

<verification>
1. `bash -n get-shit-done/bin/reconcile-signal-lifecycle.sh` -- script has valid syntax
2. `grep -A2 "reconcile_signal_lifecycle" get-shit-done/workflows/execute-phase.md` -- step exists between verify_phase_goal and update_roadmap
3. `grep "SIG-01" get-shit-done/references/health-check.md` -- lifecycle check defined
4. `grep "Signal Lifecycle" get-shit-done/workflows/health-check.md` -- workflow references new checks
5. `grep "programmatic" .planning/PROJECT.md` -- design principle in Key Decisions
6. `npm test` passes
</verification>

<success_criteria>
- reconcile-signal-lifecycle.sh is executable, has valid bash syntax, extracts resolves_signals from PLAN.md files, updates signal lifecycle_state, and rebuilds KB index
- execute-phase.md calls the script after verification passes (between verify_phase_goal and update_roadmap)
- health-check.md defines SIG-01 (resolved signals updated) and SIG-02 (no orphaned resolutions) at WARNING severity
- health-check.md workflow includes Signal Lifecycle Consistency in default execution scope
- PROJECT.md Key Decisions table has the "programmatic over agent instructions" design principle
- All tests pass after local install
</success_criteria>

<output>
After completion, create `.planning/quick/13-implement-signal-lifecycle-deliberation-/13-SUMMARY.md`
</output>
