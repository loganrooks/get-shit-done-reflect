# Phase 10: Upstream Feature Verification - Research

**Researched:** 2026-02-11
**Domain:** Upstream feature verification in fork context (7 features from v1.13-v1.18 upstream)
**Confidence:** HIGH

## Summary

Phase 10 verifies that 7 upstream features (FEAT-01 through FEAT-07) adopted during Phase 8 merge work correctly within the fork context. This is a verification phase -- confirming things already merged work, not building new features. Fixes are in scope when features do not work correctly.

All 7 features have been researched by reading their actual source code in the repo. The codebase is in good shape: 42 fork tests + 75 upstream tests all pass, fork branding is clean across workflow files, and the npm package (`get-shit-done-reflect-cc@1.12.2`) is correctly branded. The primary work is verification testing (manual and/or scripted) for each feature, with targeted fixes where fork context creates issues.

**Primary recommendation:** Verify each feature end-to-end in the fork context, grouping by complexity. Three features need no fork adaptation (FEAT-03, FEAT-04, FEAT-06). Three need fork branding verification (FEAT-01, FEAT-05, FEAT-07). One needs a targeted fix (FEAT-02: --auto mode must include fork config fields).

## Standard Stack

This phase does not introduce new libraries. The existing stack is sufficient.

### Core
| Tool | Location | Purpose | Why Standard |
|------|----------|---------|--------------|
| `gsd-tools.js` | `get-shit-done/bin/gsd-tools.js` | CLI utility for all GSD workflow operations | 4,597-line upstream file with 75 passing tests; foundation for init, config-set, --include, websearch |
| `install.js` | `bin/install.js` | Installer with patch persistence, JSONC parsing, manifest generation | Contains FEAT-01 (reapply-patches) and FEAT-06 (JSONC) implementations |
| `vitest` | `devDependencies` | Fork test framework (42 tests) | Already used for unit + integration tests |
| `node:test` | Built-in | Upstream test framework (75 tests) | Already used via `npm run test:upstream` |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| `npm view get-shit-done-reflect-cc version` | Version checking | Verifying FEAT-05 update detection |
| `node gsd-tools.js config-set` | Config persistence | Verifying FEAT-07 research decision |
| `node gsd-tools.js websearch` | Brave Search API | Verifying FEAT-04 integration |

### Alternatives Considered
None -- this is a verification phase, not a build phase.

## Architecture Patterns

### Feature Verification Structure
```
Per feature:
1. Identify source code (already merged in Phase 8)
2. Test in fork context (manual or scripted)
3. Check fork branding (if user-visible)
4. Fix if broken
5. Document result
```

### Pattern: Manual Verification with Documented Evidence
**What:** Run each feature's workflow manually and document the result
**When to use:** For LLM-guided features (reapply-patches) and interactive features (--auto mode)
**Why:** These features involve LLM behavior that cannot be unit-tested deterministically

### Pattern: Programmatic Verification
**What:** Run node commands and verify output
**When to use:** For gsd-tools.js features (--include, config-set, websearch, init)
**Example:**
```bash
# FEAT-03: --include flag
node get-shit-done/bin/gsd-tools.js init execute-phase 10 --include state,config
# Verify JSON output contains state_content and config_content fields

# FEAT-04: Brave Search graceful fallback
unset BRAVE_API_KEY && node get-shit-done/bin/gsd-tools.js websearch "test query"
# Verify { available: false, reason: "BRAVE_API_KEY not set" }

# FEAT-07: Config persistence
node get-shit-done/bin/gsd-tools.js config-set workflow.research false
cat .planning/config.json | grep -A1 '"workflow"'
# Verify workflow.research is false
```

### Anti-Patterns to Avoid
- **Testing in isolation from fork context:** Always verify with fork's config.json (which has health_check, devops, gsd_reflect_version fields that upstream's loadConfig() drops)
- **Skipping branding checks:** Every user-visible output must show GSD Reflect branding, not upstream branding
- **Conflating fork maintenance with end-user workflows:** reapply-patches is for downstream users of the fork, NOT for fork-to-upstream sync

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Config field validation | Custom config validator | Existing gsd-tools.js config-set + loadConfig() | Already handles dot notation, type coercion, nested objects |
| File hash comparison | Manual diff | install.js fileHash() + generateManifest() | SHA256-based, handles recursive directories |
| Version comparison | String comparison | Existing semver logic in update workflow | Handles major.minor.patch correctly |

**Key insight:** Every feature already has working implementation in the codebase. The work is verification and targeted fixes, not reimplementation.

## Feature-by-Feature Analysis

### FEAT-01: Reapply-Patches Command (ca03a06)

**Source files:**
- `bin/install.js` lines 1146-1273: Manifest generation, patch detection, backup
- `commands/gsd/reapply-patches.md`: LLM-guided merge command

**How it works:**
1. `writeManifest()` creates SHA256 hashes of all installed files as `gsd-file-manifest.json`
2. On next install, `saveLocalPatches()` compares current hashes against manifest
3. Modified files are backed up to `gsd-local-patches/` with `backup-meta.json`
4. `/gsd:reapply-patches` command reads backups and merges modifications into new version

**Fork context issues:**
- Patches directory checked at `$HOME/.claude/gsd-local-patches` (global) and `./.claude/gsd-local-patches` (local) -- correct for fork
- The manifest covers `get-shit-done/`, `commands/gsd/`, and `agents/gsd-*` -- correct for fork
- The backup reports say "Run `/gsd:reapply-patches`" -- uses correct command syntax

**Verification approach:**
1. Verify manifest is created after install (`gsd-file-manifest.json` exists with correct structure)
2. Modify a GSD file, re-run installer, verify backup is created
3. Run `/gsd:reapply-patches` and verify merge flow

**Fork adaptation needed:** None identified. The mechanism is generic and works for any GSD installation.

**Relationship to tracked-modifications strategy:** These are separate concerns. Reapply-patches is for end-users who modify installed GSD files between updates. FORK-DIVERGENCES.md tracks the fork's modifications to upstream files for git merge purposes. They do not conflict. (Confidence: HIGH -- FORK-STRATEGY.md explicitly states this at lines 153-156)

**Recommendation for future upstream syncs:** The reapply-patches mechanism helps fork downstream users, but does not directly simplify fork-to-upstream sync. For the fork maintainer, the mechanism's value is that it reduces support burden -- users who customize their GSD Reflect installation can upgrade without losing changes.

### FEAT-02: --auto Flag for Unattended Initialization (7f49083)

**Source files:**
- `commands/gsd/new-project.md`: Command stub with `--auto` argument hint
- `get-shit-done/workflows/new-project.md`: Full workflow with auto mode logic

**How it works:**
- `--auto` flag skips brownfield mapping, deep questioning, and approval gates
- Requires idea document via `@` reference
- Config questions (Step 5) are still asked
- Steps 6-9 run automatically with smart defaults (research=yes, auto-approve)

**Fork context issues -- FIX NEEDED:**
- Step 5 creates `config.json` with these fields: mode, depth, parallelization, commit_docs, model_profile, workflow (research, plan_check, verifier)
- But the fork's config template (`templates/config.json`) also includes: `gsd_reflect_version`, `health_check`, `devops`
- The `gsd-tools.js` `config-ensure-section` command also creates config WITHOUT these fork fields
- **Decision from CONTEXT.md:** "Include health_check and devops config fields when --auto initializes a project"
- This means the workflow Step 5 must be updated to include these fields in the generated config.json

**Fix scope:**
- Update `new-project.md` workflow Step 5 to include `health_check` and `devops` sections with defaults when creating config.json
- Verify the same for `new-milestone.md` (reuses similar config creation)
- This is a fork adaptation -- upstream doesn't have these fields
- The `upgrade-project.md` workflow already handles adding these fields to existing configs, so new projects that skip this will get them via upgrade

**Auto-mode verification:**
1. Verify `--auto` skips interactive prompts (no AskUserQuestion calls)
2. Verify config.json includes health_check and devops after --auto init
3. Verify error message when no document provided

### FEAT-03: --include Flag for Eliminating Redundant File Reads (fa81821 + 01c9115)

**Source files:**
- `get-shit-done/bin/gsd-tools.js` line 141-147: `parseIncludeFlag()` function
- Lines 3623-3632, 3675-3728, 4195+: Include logic in init commands

**How it works:**
- `--include state,config,roadmap` adds file contents to init JSON output
- Supports: state, config, roadmap, requirements, context, research, verification, uat
- Eliminates need for agent to make separate file reads after init call
- Used by execute-phase, plan-phase, progress init commands

**Fork context issues:** None. This is infrastructure-level optimization that works identically regardless of fork context. The included files (.planning/STATE.md, config.json, etc.) are the same files the fork uses.

**Verification approach:**
```bash
node get-shit-done/bin/gsd-tools.js init execute-phase 10 --include state,config
# Verify JSON output contains state_content and config_content keys with actual file contents
```

### FEAT-04: Brave Search Integration for Researchers (60ccba9)

**Source files:**
- `get-shit-done/bin/gsd-tools.js` lines 2000-2062: `cmdWebsearch()` function
- `agents/gsd-phase-researcher.md` lines 100-114: Brave Search integration docs
- `agents/gsd-project-researcher.md` lines 94-108: Same integration

**How it works:**
- Checks `BRAVE_API_KEY` env var or `~/.gsd/brave_api_key` file
- Makes requests to `https://api.search.brave.com/res/v1/web/search`
- Returns structured results (title, url, description, age)
- Graceful fallback when no API key: returns `{ available: false, reason: "BRAVE_API_KEY not set" }`
- Integrated into init new-project (reports `brave_search_available`) and config creation (sets `brave_search: true/false`)

**Fork context issues:** None. The Brave Search integration is completely generic. It does not reference any package names, URLs, or branding. The researcher agents correctly document the fallback to built-in WebSearch.

**Verification approach:**
1. Without API key: verify graceful fallback (returns available: false)
2. Config detection: verify `brave_search_available` field in init output
3. Agent docs: verify researchers mention both paths (Brave and built-in WebSearch)

### FEAT-05: Local vs Global Install Detection in Update Command (8384575)

**Source files:**
- `commands/gsd/update.md`: Thin orchestrator stub routing to workflow
- `get-shit-done/workflows/update.md`: Full update workflow with install detection
- `hooks/gsd-check-update.js`: Background update check hook

**How it works:**
1. Checks `./claude/get-shit-done/VERSION` (local) then `~/.claude/get-shit-done/VERSION` (global)
2. Determines install type and uses appropriate flag (`--local` or `--global`) for update
3. Checks latest version via `npm view get-shit-done-reflect-cc version`
4. Shows changelog, warns about clean install, asks confirmation
5. Runs `npx get-shit-done-reflect-cc --local` or `npx get-shit-done-reflect-cc --global`
6. Clears update cache after successful update

**Fork branding status -- VERIFIED CLEAN:**
- `workflows/update.md` line 50: `npm view get-shit-done-reflect-cc version` -- correct
- `workflows/update.md` line 57: `npx get-shit-done-reflect-cc --global` -- correct
- `workflows/update.md` line 149: `npx get-shit-done-reflect-cc --local` -- correct
- `workflows/update.md` line 154: `npx get-shit-done-reflect-cc --global` -- correct
- `workflows/update.md` line 182: GitHub URL `loganrooks/get-shit-done-reflect` -- correct
- `hooks/gsd-check-update.js` line 45: `npm view get-shit-done-reflect-cc version` -- correct
- No upstream package name (`get-shit-done-cc` without `-reflect`) found in any of these files

**Proactive update notifications:**
- `gsd-check-update.js` runs on SessionStart hook, spawns background process
- Writes result to `~/.claude/cache/gsd-update-check.json`
- Statusline reads this cache to show "New version available" indicator
- Already configured in `install.js` hook registration (line 1473-1504)

**npm registry status -- VERIFIED:**
- `npm view get-shit-done-reflect-cc` shows correct fork branding
- Version 1.12.2 published, description and URLs correct
- No branding issue with current npm version

**Verification approach:**
1. Check VERSION file exists in installed location
2. Run update workflow, verify correct package name used
3. Verify local vs global detection logic works

### FEAT-06: JSONC Parsing in Installer (6cf4a4e)

**Source files:**
- `bin/install.js` lines 980-1034: `parseJsonc()` function

**How it works:**
- Strips BOM, single-line comments (//), block comments (/* */), and trailing commas
- Preserves strings (comments inside strings are not stripped)
- Used in `configureOpencodePermissions()` when reading `opencode.json`
- Prevents crash when OpenCode users have JSONC-formatted config files

**Fork context issues:** None. This is a parsing utility for OpenCode runtime compatibility. The fork inherits it directly from upstream without modification needed.

**Verification approach:**
1. Verify parseJsonc handles: BOM, `//` comments, `/* */` comments, trailing commas
2. Verify it does not corrupt strings containing `//` or `/*`
3. The existing upstream test suite (75 tests) likely covers this -- check via `npm run test:upstream`

### FEAT-07: Persist Research Decision from new-milestone to Config (767bef6)

**Source files:**
- `get-shit-done/workflows/new-milestone.md` Step 8: Research Decision with config-set
- `get-shit-done/bin/gsd-tools.js` lines 622-665: `cmdConfigSet()` function

**How it works:**
- new-milestone workflow asks user: "Research the domain ecosystem for new features?"
- Choice is persisted via: `node gsd-tools.js config-set workflow.research true/false`
- `config-set` supports dot notation, handles booleans, numbers, strings
- Subsequent `/gsd:plan-phase` reads `workflow.research` from config via `loadConfig()`

**Fork context issues:** None. The config-set mechanism is generic. The fork's extra config fields (health_check, devops, gsd_reflect_version) are not affected by setting workflow.research.

**Important note:** `loadConfig()` in gsd-tools.js drops fork-specific fields (health_check, devops, gsd_reflect_version) from its return value. This is by design (STATE.md decision: "Do not modify gsd-tools.js for fork config"). Fork reads these fields directly via JSON.parse. This does NOT affect FEAT-07 because `workflow.research` is a standard field that loadConfig() handles.

**Verification approach:**
```bash
# Set research to false
node get-shit-done/bin/gsd-tools.js config-set workflow.research false
# Verify config.json has workflow.research = false
cat .planning/config.json | python3 -c "import json,sys; print(json.load(sys.stdin)['workflow']['research'])"
# Should print: False

# Set it back to true
node get-shit-done/bin/gsd-tools.js config-set workflow.research true
```

## Common Pitfalls

### Pitfall 1: Testing Features Without Fork Config Context
**What goes wrong:** Testing features against a vanilla config.json that lacks fork fields (health_check, devops, gsd_reflect_version)
**Why it happens:** gsd-tools.js creates config without fork fields, so test environments may not match real fork projects
**How to avoid:** Always use the fork's actual .planning/config.json for testing, which includes fork-specific fields
**Warning signs:** Config created during test missing gsd_reflect_version field

### Pitfall 2: Confusing reapply-patches with Fork Maintenance
**What goes wrong:** Trying to use reapply-patches for fork-to-upstream sync, or worrying it conflicts with FORK-DIVERGENCES.md
**Why it happens:** Both deal with "tracking file modifications" but serve different purposes
**How to avoid:** Remember: reapply-patches = end-user tool for preserving customizations across GSD updates. FORK-DIVERGENCES.md = fork maintainer tool for tracking what the fork changed in upstream files for git merge purposes.
**Warning signs:** Attempting to use reapply-patches during upstream sync workflow

### Pitfall 3: Missing Fork Branding in User-Visible Output
**What goes wrong:** An upstream feature produces output showing "get-shit-done-cc" or upstream URLs
**Why it happens:** Upstream code references upstream package name; fork branding was applied in Phase 8/9 but may have gaps
**How to avoid:** Grep for `get-shit-done-cc[^-]` in all files touched by each feature. Verify workflows/update.md, hooks/gsd-check-update.js, and help.md all use fork package name.
**Warning signs:** User sees "get-shit-done-cc" in terminal output

### Pitfall 4: --auto Mode Still Prompting
**What goes wrong:** --auto mode creates interactive prompts that break CI/CD or unattended workflows
**Why it happens:** Not all code paths check for auto mode flag
**How to avoid:** Trace through the entire --auto workflow path, verify no AskUserQuestion calls on the auto path except config questions (which are documented as still required)
**Warning signs:** AskUserQuestion calls that don't check for auto mode first

### Pitfall 5: loadConfig() Dropping Fork Fields
**What goes wrong:** Code assumes loadConfig() returns all config.json fields, but it only returns upstream-defined fields
**Why it happens:** gsd-tools.js loadConfig() has an explicit field list and drops unknown fields
**How to avoid:** For fork-specific fields (health_check, devops, gsd_reflect_version), read config.json directly via JSON.parse, not via loadConfig(). This is documented in STATE.md decisions.
**Warning signs:** Fork config fields returning undefined when accessed through loadConfig()

## Code Examples

### Verifying FEAT-03: --include Flag
```bash
# Source: gsd-tools.js lines 141-147, 3623-3632
node get-shit-done/bin/gsd-tools.js init execute-phase 10 --include state,config

# Expected: JSON with state_content and config_content fields populated
# {
#   "state_content": "# Project State\n...",
#   "config_content": "{\"mode\":\"yolo\",...}",
#   ...
# }
```

### Verifying FEAT-04: Brave Search Fallback
```bash
# Source: gsd-tools.js lines 2000-2062
unset BRAVE_API_KEY
node get-shit-done/bin/gsd-tools.js websearch "test query"

# Expected: {"available":false,"reason":"BRAVE_API_KEY not set"}
```

### Verifying FEAT-07: Config Persistence
```bash
# Source: gsd-tools.js lines 622-665, new-milestone.md Step 8
node get-shit-done/bin/gsd-tools.js config-set workflow.research false
node -e "const c=JSON.parse(require('fs').readFileSync('.planning/config.json','utf8')); console.log(c.workflow.research)"
# Expected: false

# Restore
node get-shit-done/bin/gsd-tools.js config-set workflow.research true
```

### Fix for FEAT-02: Adding Fork Config Fields to --auto Init
```json
// After Step 5 creates config.json, add these fork-specific fields:
{
  "gsd_reflect_version": "1.12.2",
  "health_check": {
    "frequency": "milestone-only",
    "stale_threshold_days": 7,
    "blocking_checks": false
  },
  "devops": {
    "ci_provider": "none",
    "deploy_target": "none",
    "commit_convention": "freeform",
    "environments": []
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Inline bash for init context | `gsd-tools.js init` with JSON output + `--include` | Phase 8 merge (v1.18) | Eliminates separate file reads, reduces tool calls |
| Manual update check | Background hook + cache + statusline | Phase 8 merge (v1.18) | Non-blocking update notifications |
| JSON-only config parsing | JSONC parsing (comments + trailing commas) | Phase 8 merge (v1.18) | OpenCode compatibility, prevents data loss |
| No patch persistence | SHA256 manifest + backup + LLM-guided restore | Phase 8 merge (v1.18) | Users can customize GSD files without fear of losing changes |

**Deprecated/outdated:**
- None -- all 7 features are current upstream additions

## Verification Priority Matrix

| Feature | Complexity | Fork Adaptation | Risk | Priority |
|---------|-----------|----------------|------|----------|
| FEAT-02 (--auto) | Medium | FIX needed (add fork config fields) | HIGH | 1 |
| FEAT-01 (reapply-patches) | High | None needed, but complex to verify | MEDIUM | 2 |
| FEAT-05 (update detection) | Medium | Branding verified clean | MEDIUM | 3 |
| FEAT-07 (config persist) | Low | None needed | LOW | 4 |
| FEAT-03 (--include) | Low | None needed | LOW | 5 |
| FEAT-04 (Brave Search) | Low | None needed | LOW | 6 |
| FEAT-06 (JSONC) | Low | None needed | LOW | 7 |

## Discretion Recommendations

### Relationship between reapply-patches and tracked-modifications strategy
**Recommendation: Keep separate.** These serve different purposes and different audiences. Reapply-patches is for downstream users of the fork who modify installed GSD files. Tracked-modifications (FORK-DIVERGENCES.md) is for the fork maintainer tracking what the fork changed in upstream files. They do not conflict and should not be integrated.

### Backup location for reapply-patches
**Recommendation: Keep upstream default** (`gsd-local-patches/` in the config directory). No integration with `.planning/` needed -- the patches directory is transient (exists only between update and reapply), while `.planning/` is permanent project state.

### Whether FORK-DIVERGENCES.md should inform reapply-patches behavior
**Recommendation: No.** FORK-DIVERGENCES.md documents fork-to-upstream changes. Reapply-patches handles user-to-fork changes. Different dimensions entirely.

### Role of reapply-patches in future merge workflow
**Recommendation: Complement, not simplify.** Reapply-patches helps downstream users, reducing support burden. For the fork maintainer, future upstream syncs still use git merge with the FORK-STRATEGY.md runbook. Reapply-patches does not participate in that workflow.

### Fix vs defer for reapply-patches issues
**Recommendation: Fix data safety issues immediately, defer polish.** Any issue that could cause data loss (failed backup, missed modification) should be fixed in Phase 10. Cosmetic issues (output formatting, messaging) can be deferred.

### Auto-mode defaults
**Recommendation:**
- Fork feature defaults: health_check enabled (milestone-only), devops with "none" defaults
- Output verbosity: Match upstream --auto verbosity (minimal, no banners in auto mode)
- Error handling: Fail fast with clear error message if document not provided
- Template selection: Standard defaults (same as interactive mode)
- DevOps detection: Skip in --auto mode (already specified in workflow: "If auto mode: Skip entirely")

### Update command recommendations
**Recommendation:**
- npm vs git detection: Use VERSION file approach (already implemented correctly)
- Version checking source: npm registry (already uses `npm view get-shit-done-reflect-cc version`)
- Local/global install handling: Already implemented correctly in workflow
- gsd-check-update.js: Keep fork version (already references `get-shit-done-reflect-cc`)
- Changelog display: From fork's GitHub (already uses `loganrooks/get-shit-done-reflect`)
- Rollback support: Not needed for Phase 10 (defer to Phase 12)

### Per-feature adaptation level
**Recommendation:** Apply proportionally:
- FEAT-01 (reapply-patches): Full verification -- data safety critical
- FEAT-02 (--auto): Fix + verify -- serves CI/CD use case
- FEAT-03 (--include): Quick verify -- infrastructure, no user-facing impact
- FEAT-04 (Brave Search): Quick verify -- optional feature, graceful fallback already works
- FEAT-05 (update): Branding sweep + verify -- user-visible, already clean
- FEAT-06 (JSONC): Quick verify -- OpenCode-specific, covered by upstream tests
- FEAT-07 (config persist): Quick verify -- deterministic, testable

## Open Questions

### Resolved (from CONTEXT.md)

1. **What are FEAT-04 and FEAT-06 specifically?**
   - FEAT-04: Brave Search integration for researchers via gsd-tools.js websearch command
   - FEAT-06: JSONC parsing in install.js to prevent opencode.json deletion when it contains comments
   - **Status: Resolved**

2. **Why does npm registry version lack fork branding?**
   - It doesn't -- `npm view get-shit-done-reflect-cc` shows correct fork branding (version 1.12.2, correct description, URLs, and bin name)
   - The concern may have been about pre-sync state, but current npm is correct
   - **Status: Resolved -- not an issue**

3. **Does reapply-patches conflict with tracked-modifications strategy?**
   - No. They serve different purposes and audiences. Reapply-patches = end-user patch persistence. Tracked-modifications = fork maintainer change tracking. FORK-STRATEGY.md explicitly documents this separation (lines 153-156).
   - **Status: Resolved -- no conflict**

### New Questions

1. **Should --auto mode in new-project also run DevOps detection?**
   - Current workflow says "If auto mode: Skip entirely (DevOps context can be added later)"
   - But CONTEXT.md says "Include health_check and devops config fields when --auto initializes"
   - Recommendation: Add default fields to config.json but skip interactive DevOps detection (consistent with both requirements)
   - **Criticality: LOW** -- upgrade-project catches this gap

2. **How to verify reapply-patches end-to-end without destructive operations?**
   - The full flow requires: install, modify file, reinstall, reapply
   - This is disruptive to the current development environment
   - Recommendation: Verify components (manifest creation, hash comparison, backup logic) individually, then do one full manual test at the end
   - **Criticality: MEDIUM** -- data safety matters

## Sources

### Primary (HIGH confidence)
- `bin/install.js` -- Direct source code analysis: reapply-patches mechanism (FEAT-01), JSONC parser (FEAT-06)
- `get-shit-done/bin/gsd-tools.js` -- Direct source code analysis: --include (FEAT-03), Brave Search (FEAT-04), config-set (FEAT-07), init commands (FEAT-02)
- `get-shit-done/workflows/new-project.md` -- Direct source code analysis: --auto mode workflow (FEAT-02)
- `get-shit-done/workflows/update.md` -- Direct source code analysis: update detection (FEAT-05)
- `get-shit-done/workflows/new-milestone.md` -- Direct source code analysis: research decision persistence (FEAT-07)
- `hooks/gsd-check-update.js` -- Direct source code analysis: background update check (FEAT-05)
- `commands/gsd/reapply-patches.md` -- Direct source code analysis: reapply-patches command spec (FEAT-01)
- `.planning/FORK-STRATEGY.md` -- Fork's documented strategy on reapply-patches vs tracked-modifications
- `npm view get-shit-done-reflect-cc` -- Live npm registry check confirming fork branding
- Test results: 42 fork tests + 75 upstream tests all passing

### Secondary (MEDIUM confidence)
- `.planning/phases/09-architecture-adoption/09-AUDIT-REPORT.md` -- Post-Phase 9 audit confirming branding cleanup
- `.planning/phases/09-architecture-adoption/09-VERIFICATION.md` -- Phase 9 verification confirming zero upstream refs in workflows

### Tertiary (LOW confidence)
- None -- all findings based on direct source code analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified by running actual test suites (117 tests passing)
- Architecture: HIGH -- based on direct source code reading of all 7 features
- Pitfalls: HIGH -- based on analyzing actual fork config behavior and FORK-STRATEGY.md decisions

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable -- codebase is post-merge, no active changes expected)
