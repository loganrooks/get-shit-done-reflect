---
phase: quick-30
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .planning/STATE.md
  - scripts/detect-platform-changes.sh
  - get-shit-done/references/platform-monitoring.md
autonomous: true
must_haves:
  truths:
    - "STATE.md row 29 reflects the QT29 revert with explanation"
    - "detect-platform-changes.sh runs without errors with --all flag"
    - "First run initializes baselines in ~/.gsd/cache/platform-baselines/"
    - "Second run reports no changes (baselines just set)"
    - "platform-monitoring.md documents why monitoring matters and how to use the script"
  artifacts:
    - path: "scripts/detect-platform-changes.sh"
      provides: "Platform change detection for upstream GSD installer and Codex schema"
      contains: "detect_upstream_changes"
    - path: "get-shit-done/references/platform-monitoring.md"
      provides: "Reference documentation for platform monitoring strategy"
      contains: "QT29"
    - path: ".planning/STATE.md"
      provides: "Updated quick tasks table with QT29 revert note"
      contains: "reverted"
  key_links:
    - from: "get-shit-done/references/platform-monitoring.md"
      to: "scripts/detect-platform-changes.sh"
      via: "documentation references script usage"
      pattern: "detect-platform-changes"
    - from: "get-shit-done/references/platform-monitoring.md"
      to: ".planning/deliberations/platform-change-monitoring.md"
      via: "links to source deliberation"
      pattern: "platform-change-monitoring"
---

<objective>
Implement Layer 1 platform change detection (upstream GSD diff + Codex schema diff) from the platform-change-monitoring deliberation, update STATE.md to reflect the QT29 revert, and add reference documentation.

Purpose: GSD Reflect deploys to 4 platforms. When those platforms change, our artifacts can silently break. QT22-28 exposed three undetected platform changes, and QT29 demonstrated the danger of acting on a single source of truth (schema validation false positive). This script enables periodic detection of platform changes before they reach users.

Output: Executable detection script, updated STATE.md, reference documentation.
</objective>

<execution_context>
@./.claude/get-shit-done-reflect/workflows/execute-plan.md
@./.claude/get-shit-done-reflect/templates/summary-standard.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/deliberations/platform-change-monitoring.md
@get-shit-done/references/ui-brand.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Update STATE.md QT29 row and create platform change detection script</name>
  <files>
    .planning/STATE.md
    scripts/detect-platform-changes.sh
  </files>
  <action>
**Part A: STATE.md update**

In the Quick Tasks Completed table, update row 29 to reflect the revert:
- Change description to: "Fix Codex agent TOML description field (REVERTED ec54886 - validated against wrong schema)"
- Keep original date and commit (425903d) but append revert info

Also update:
- `last_updated` to 2026-03-19
- `last_activity` to reference QT30
- `Stopped at` in Session Continuity to reference QT30

**Part B: Create scripts/detect-platform-changes.sh**

Create the script with the following structure:

```bash
#!/usr/bin/env bash
# scripts/detect-platform-changes.sh
# Platform change detection for GSD Reflect deployment targets
#
# Usage: ./scripts/detect-platform-changes.sh [--upstream] [--codex-schema] [--all]
#
# Exits 0 if no changes detected, 1 if changes found
#
# Baselines cached in ~/.gsd/cache/platform-baselines/
# Run periodically or before starting upstream sync work.

set -euo pipefail

CACHE_DIR="${GSD_HOME:-$HOME/.gsd}/cache/platform-baselines"
```

**Mode A function (`detect_upstream_changes`):**
1. Download upstream's `bin/install.js` from `https://raw.githubusercontent.com/gsd-build/get-shit-done/main/bin/install.js` using `curl -sS`
2. Compare against cached baseline at `$CACHE_DIR/upstream-install.js`
3. If no baseline: save current as baseline, report "Baseline initialized", return 0
4. If baseline exists: diff against downloaded version
5. If no diff: report "No changes since baseline", return 0
6. If diff found: filter for runtime-relevant changes using grep patterns:
   - Lines matching `function.*\(convert\|codex\|gemini\|opencode\|copilot\|antigravity\|runtime\)` (new function defs with runtime keywords)
   - Lines matching `getDirName\|getConfigDirFromHome\|toolMapping\|runtimeMapping` (path/config changes)
   - Lines matching `is[A-Z][a-zA-Z]*Runtime\|is[A-Z][a-zA-Z]*Agent` (new runtime flags)
7. Format output showing date of baseline vs current, and list of runtime-relevant changes with `+` for additions, `~` for modifications (derive from diff output: lines starting with `+` that aren't `+++` are additions, context lines near changes are modifications)
8. Update baseline (copy downloaded to cache), return 1

**Mode B function (`detect_codex_schema_changes`):**
1. Get latest stable Codex release tag using: `gh api repos/openai/codex/releases --jq '[.[] | select(.tag_name | test("^rust-v[0-9]+\\.[0-9]+\\.[0-9]+$"))][0].tag_name'`
2. If `gh` command fails, print warning and skip (not all environments have gh)
3. Download schema from: `https://github.com/openai/codex/releases/download/${TAG}/config-schema.json` using `curl -sS -L`
4. Compare against cached baseline at `$CACHE_DIR/codex-config-schema.json`
5. If no baseline: save, store tag in `$CACHE_DIR/codex-config-schema.tag`, report "Baseline initialized", return 0
6. If baseline exists: use inline Python3 to do structural JSON diff:
   ```python
   import json, sys
   old = json.load(open(sys.argv[1]))
   new = json.load(open(sys.argv[2]))
   # Compare $defs (definitions) - new/removed keys
   # Compare properties - new/removed keys
   # Compare enum values in known enums (SandboxMode, etc.)
   # Flag changes to agent-related definitions (AgentRoleToml, AgentsToml)
   ```
7. Format output showing baseline tag vs current tag, definition/property/enum changes
8. Update baseline + tag file, return 1

**Main function:**
- Parse flags: `--upstream`, `--codex-schema`, `--all` (default if no flags)
- `mkdir -p "$CACHE_DIR"`
- Print banner using GSDR branding (see ui-brand.md reference):
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GSDR ► PLATFORM CHANGE DETECTION
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ```
- Run selected detections, track whether any returned changes
- Exit 0 if no changes found anywhere, exit 1 if any changes found

Make the script executable (`chmod +x`).

**Important implementation details:**
- Use temp files for downloads (cleaned up in trap), not piping directly to diff
- Store baseline date in a sidecar file (`$CACHE_DIR/upstream-install.date`) so output can show "Baseline: 2026-03-17"
- The Python inline for JSON diffing should be a heredoc passed to `python3 -c` or `python3 << 'PYEOF'`
- Handle network errors gracefully: if curl fails, warn and skip that detection rather than crashing
- Handle missing `gh` CLI gracefully for Mode B
  </action>
  <verify>
1. `bash -n scripts/detect-platform-changes.sh` (syntax check passes)
2. `bash scripts/detect-platform-changes.sh --upstream` (first run initializes baseline)
3. `bash scripts/detect-platform-changes.sh --upstream` (second run shows no changes, exits 0)
4. Verify `~/.gsd/cache/platform-baselines/upstream-install.js` exists
5. Verify STATE.md row 29 contains "REVERTED"
  </verify>
  <done>
- STATE.md row 29 updated with revert information
- detect-platform-changes.sh is executable and runs both modes without errors
- First run initializes baselines, second run reports no changes
- Script exits 0 when no changes, 1 when changes detected
  </done>
</task>

<task type="auto">
  <name>Task 2: Add platform monitoring reference documentation</name>
  <files>
    get-shit-done/references/platform-monitoring.md
  </files>
  <action>
Create `get-shit-done/references/platform-monitoring.md` as a reference document for GSD Reflect agents and the user. Structure:

**Section 1: Why Platform Monitoring Matters**
- GSD Reflect deploys to 4 platforms (Claude, OpenCode, Gemini CLI, Codex)
- During v1.17.2-v1.17.3 (QT22-28), three platform changes went undetected: Codex adding multi-agent support, Gemini changing template processing, OpenCode adding .jsonc config format
- All were discovered reactively (user reports or ad-hoc investigation)
- Without monitoring, changes accumulate silently until deployment artifacts break

**Section 2: The QT29 Lesson**
- QT29 validated Codex agent TOML against published `config.schema.json`
- Schema said `description` was invalid (`additionalProperties: false`)
- Fix was shipped: removed `description` from agent TOML output
- Discovery: `config.schema.json` describes `config.toml`, NOT agent role files
- Agent role files have their own Rust-defined schema (`RawAgentRoleFileToml`) that explicitly accepts `description`
- Codex's own test suite exercises `description` in agent files
- QT29 was reverted (ec54886)
- **Lesson: No single artifact (schema, source code, docs) is a complete source of truth. Triangulate across sources before acting.**

**Section 3: How to Run Detection**
- `./scripts/detect-platform-changes.sh --all` (both checks)
- `./scripts/detect-platform-changes.sh --upstream` (upstream GSD installer only)
- `./scripts/detect-platform-changes.sh --codex-schema` (Codex schema only)
- First run initializes baselines; subsequent runs compare against baselines
- Exit code 0 = no changes, 1 = changes detected
- Recommended: run before starting upstream sync work or periodically

**Section 4: When Changes Are Detected**
1. Read the summary output carefully
2. **Investigate before acting** -- do NOT immediately "fix" based on monitoring output
3. Triangulate: check platform source code, test suites, and documentation
4. For Codex specifically: the published JSON Schema covers `config.toml` only; agent role files have a separate schema defined in Rust source
5. If uncertain, create a deliberation in `.planning/deliberations/` before shipping changes

**Section 5: Architecture**
- Layer 1 (implemented): Change detection scripts -- early warning, low cost
- Layer 2 (future): Integration testing against actual platform CLIs -- highest reliability
- Source deliberation: `.planning/deliberations/platform-change-monitoring.md`
- Signal: sig-2026-03-17-no-platform-change-detection

Keep the document concise -- aim for ~80-120 lines. This is a reference, not an essay.

After creating the npm source file, run `node bin/install.js --local` to sync it to `.claude/get-shit-done-reflect/references/`.
  </action>
  <verify>
1. File exists at `get-shit-done/references/platform-monitoring.md`
2. `node bin/install.js --local` completes without errors
3. `.claude/get-shit-done-reflect/references/platform-monitoring.md` exists (installed copy)
4. File mentions QT29, detect-platform-changes.sh, triangulation principle, and the deliberation link
  </verify>
  <done>
- platform-monitoring.md exists in npm source directory and installed copy
- Documents the why (v1.17.2-v1.17.3 story), the lesson (QT29), the how (script usage), and the response protocol (investigate before acting)
- Links to source deliberation
  </done>
</task>

</tasks>

<verification>
1. `bash scripts/detect-platform-changes.sh --all` runs without errors (first run: baselines initialized)
2. `bash scripts/detect-platform-changes.sh --all` second run exits 0 (no changes)
3. `grep -q "REVERTED" .planning/STATE.md` confirms QT29 update
4. `test -f get-shit-done/references/platform-monitoring.md` confirms reference doc
5. `npm test` still passes (no existing code modified beyond STATE.md)
</verification>

<success_criteria>
- STATE.md accurately reflects the QT29 revert history
- Platform change detection script runs both modes (upstream diff + Codex schema diff)
- Baselines are cached in ~/.gsd/cache/platform-baselines/
- Reference documentation explains the motivation, usage, and response protocol
- All 350 existing tests still pass
</success_criteria>

<output>
After completion, create `.planning/quick/30-platform-change-detection-scripts-qt29-r/30-SUMMARY.md`
</output>
