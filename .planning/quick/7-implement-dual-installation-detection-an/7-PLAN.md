---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/get-shit-done/bin/gsd-tools.js
  - .claude/hooks/gsd-check-update.js
  - .claude/hooks/gsd-statusline.js
  - .claude/hooks/gsd-version-check.js
  - .claude/get-shit-done/workflows/update.md
  - .claude/get-shit-done/workflows/resume-project.md
  - bin/install.js
  - .claude/get-shit-done/references/dual-installation.md
autonomous: true
must_haves:
  truths:
    - "gsd-tools init outputs dual_install field when both local and global installations exist"
    - "Installer warns user when installing at scope where other scope already exists"
    - "Update workflow asks which scope(s) to update when both exist"
    - "Statusline respects user preference to suppress update indicator for a declined scope"
    - "Command descriptions include version and scope after installation"
    - "Dual-installation topology is documented in a reference doc"
  artifacts:
    - path: ".claude/get-shit-done/bin/gsd-tools.js"
      provides: "dual_install detection in init commands"
      contains: "dual_install"
    - path: "bin/install.js"
      provides: "Cross-scope detection warning + description injection"
      contains: "dual_install"
    - path: ".claude/get-shit-done/workflows/update.md"
      provides: "Multi-scope update choice flow"
      contains: "dual"
    - path: ".claude/hooks/gsd-statusline.js"
      provides: "Scope-aware update indicator"
      contains: "update_declined_scope"
    - path: ".claude/get-shit-done/references/dual-installation.md"
      provides: "Topology documentation"
  key_links:
    - from: ".claude/get-shit-done/bin/gsd-tools.js"
      to: "VERSION files at both paths"
      via: "loadManifest + dual_install detection"
      pattern: "dual_install"
    - from: "bin/install.js"
      to: "VERSION files at other scope"
      via: "cross-scope existence check"
      pattern: "otherScope|other_scope|dual"
    - from: ".claude/hooks/gsd-statusline.js"
      to: "gsd-update-check.json cache"
      via: "reading update_declined_scope preference"
      pattern: "declined_scope|update_declined"
---

<objective>
Implement dual-installation detection and management so that when both local (./.claude/) and global (~/.claude/) GSD installations exist, the system detects, warns, and provides clear user choices.

Purpose: Users who pin a local version for a project while having a global baseline need informed tooling. Without this, update checks are confusing (which gets updated?), commands may duplicate in autocomplete, and users have no guidance.

Output: Modified gsd-tools.js, install.js, hooks, workflows, and a new reference doc.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary-standard.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.claude/get-shit-done/bin/gsd-tools.js (lines 487-501 — loadManifest, lines 4314-4339 — cmdInitResume)
@bin/install.js (lines 1882-2160 — install function, lines 42-148 — arg parsing + getGlobalDir)
@.claude/hooks/gsd-check-update.js
@.claude/hooks/gsd-statusline.js
@.claude/hooks/gsd-version-check.js
@.claude/get-shit-done/workflows/update.md
@.claude/get-shit-done/workflows/resume-project.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add dual_install detection to gsd-tools.js init commands</name>
  <files>
    .claude/get-shit-done/bin/gsd-tools.js
  </files>
  <action>
Create a new helper function `detectDualInstall(cwd)` near the existing `loadManifest(cwd)` function (around line 487). This function should:

1. Check for VERSION file at local path: `path.join(cwd, '.claude', 'get-shit-done', 'VERSION')`
2. Check for VERSION file at global path: `path.join(os.homedir(), '.claude', 'get-shit-done', 'VERSION')`
3. If BOTH exist, return an object:
```js
{
  detected: true,
  local: { path: localPath, version: localVersion },
  global: { path: globalPath, version: globalVersion },
  active_scope: 'local'  // local always takes precedence
}
```
4. If only one exists or neither, return `{ detected: false }`.

Then add `dual_install` to the output of these init functions:
- `cmdInitResume` (line 4314) — add `dual_install: detectDualInstall(cwd)` to result object
- `cmdInitExecutePhase` (line 4016) — add same
- `cmdInitPlanPhase` (line 4088) — add same
- `cmdInitQuick` (line 4267) — add same

This is purely additive — existing fields remain unchanged, and `dual_install` is a new field consumers can optionally read.
  </action>
  <verify>
Run: `node .claude/get-shit-done/bin/gsd-tools.js init resume --raw 2>/dev/null | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log('has dual_install:', 'dual_install' in d);"`

Expected: "has dual_install: true" — the field exists in init output regardless of whether both installs are present.
  </verify>
  <done>All four init commands include `dual_install` field in their JSON output. When both local and global VERSION files exist, `dual_install.detected` is `true` with paths and versions. When only one exists, `dual_install.detected` is `false`.</done>
</task>

<task type="auto">
  <name>Task 2: Add cross-scope detection warning to installer</name>
  <files>
    bin/install.js
  </files>
  <action>
In the `install(isGlobal, runtime)` function (line 1882), immediately after computing `targetDir` and `locationLabel` (around line 1896), add cross-scope detection logic:

1. Compute the "other scope" path:
   - If `isGlobal`, other scope = `path.join(process.cwd(), dirName, 'get-shit-done', 'VERSION')`
   - If local, other scope = `path.join(getGlobalDir(runtime, explicitConfigDir), 'get-shit-done', 'VERSION')`
2. Check if the other scope's VERSION file exists.
3. If it does, read its version and print a warning:

```js
if (fs.existsSync(otherVersionPath)) {
  const otherVersion = fs.readFileSync(otherVersionPath, 'utf8').trim();
  const otherLabel = isGlobal ? 'local (this project)' : 'global';
  const thisLabel = isGlobal ? 'global' : 'local (this project)';
  console.log(`  ${yellow}Note:${reset} GSD is also installed ${otherLabel} (v${otherVersion}).`);
  console.log(`  You will have dual installations after this install.`);
  console.log(`  ${dim}Local always takes precedence. Commands may appear twice in autocomplete.${reset}`);
  console.log(`  ${dim}See /gsd:help for dual-installation details.${reset}\n`);
}
```

This is a non-blocking informational warning. It does NOT prevent installation.

Additionally, in the command copy section (around lines 1951-1964 for Claude/Gemini nested commands), after copying each command file, inject version + scope into the `description:` field in the YAML frontmatter. Create a helper function `injectVersionScope(content, version, scope)`:

```js
function injectVersionScope(content, version, scope) {
  // Only modify if content has YAML frontmatter with description field
  if (!content.startsWith('---')) return content;
  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) return content;
  const frontmatter = content.substring(0, endIdx + 3);
  const body = content.substring(endIdx + 3);
  // Append version+scope to description line
  const modified = frontmatter.replace(
    /^(description:\s*)(.+)$/m,
    `$1$2 (v${version} ${scope})`
  );
  return modified + body;
}
```

Call this in the `copyWithPathReplacement` flow for command files. The `version` comes from `pkg.version`, and `scope` is `isGlobal ? 'global' : 'local'`.

Specifically, modify the command copy section for Claude/Gemini (lines ~1951-1963). After `copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix, runtime)`, walk the copied command .md files in `gsdDest` and apply `injectVersionScope` to each. Same for OpenCode flat commands (lines ~1937-1950) and Codex skills (lines ~1924-1936).

Do NOT modify agent files, workflow files, or any non-command files with version injection.
  </action>
  <verify>
Run the existing test suite to ensure nothing breaks: `cd /Users/rookslog/Development/get-shit-done-reflect && npm test 2>&1 | tail -5`

Also verify the function exists: `node -e "const src = require('fs').readFileSync('bin/install.js','utf8'); console.log('has injectVersionScope:', src.includes('injectVersionScope')); console.log('has otherVersionPath:', src.includes('otherVersionPath') || src.includes('otherScope'));"`
  </verify>
  <done>Installer warns when installing at a scope where the other scope already has GSD installed. Command frontmatter description fields include `(vX.Y.Z scope)` suffix after installation. Tests pass.</done>
</task>

<task type="auto">
  <name>Task 3: Update hooks for dual-install awareness</name>
  <files>
    .claude/hooks/gsd-check-update.js
    .claude/hooks/gsd-version-check.js
    .claude/hooks/gsd-statusline.js
  </files>
  <action>
**gsd-check-update.js** — Currently checks project VERSION first, then falls back to global. Update the spawned background script to detect BOTH versions when both exist, and include scope info in the cache:

In the spawned `-e` script (the string template starting at line 25), modify the version detection logic:

```js
// Detect both installations
let localInstalled = null;
let globalInstalled = null;
try {
  if (fs.existsSync(projectVersionFile)) {
    localInstalled = fs.readFileSync(projectVersionFile, 'utf8').trim();
  }
  if (fs.existsSync(globalVersionFile)) {
    globalInstalled = fs.readFileSync(globalVersionFile, 'utf8').trim();
  }
} catch (e) {}

// Active version is local (priority) or global
const installed = localInstalled || globalInstalled || '0.0.0';
const isDualInstall = !!(localInstalled && globalInstalled);
```

Update the result object to include:
```js
const result = {
  update_available: latest && installed !== latest,
  installed,
  latest: latest || 'unknown',
  checked: Math.floor(Date.now() / 1000),
  // New fields for dual-install awareness
  dual_install: isDualInstall,
  local_version: localInstalled,
  global_version: globalInstalled
};
```

**gsd-version-check.js** — Similarly detect both versions. Add `dual_install`, `local_version`, `global_version` to its cache result object. The existing `project_needs_migration` logic remains unchanged (it compares active installed version to config version).

**gsd-statusline.js** — Read an optional preference from the update cache. After the existing block that reads the cache (lines 70-79), add logic:

```js
// Check for declined update scope preference
// If user declined a specific scope in /gsd:update, respect that
const configFile = path.join(cwd, '.planning', 'config.json');
let updateDeclinedScope = null;
try {
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    updateDeclinedScope = config.update_declined_scope || null;
  }
} catch (e) {}
```

Wait — the statusline runs per-session-frame, not per-project. Reading config.json on every frame would be expensive. Instead, check the update cache itself. Modify the check: if `cache.update_available` is true BUT `cache.update_declined_scope` matches what the user declined (stored in cache by the update workflow), dim or suppress the indicator.

Actually, the simplest approach: when the update workflow stores the user's choice in the update cache (Task 4 will handle that), the statusline just needs to check a new field. Update the statusline logic:

```js
if (cache.update_available) {
  // If user declined update for a specific scope, dim the indicator
  if (cache.update_declined) {
    gsdUpdate = '\x1b[2m\x1b[33m⬆ /gsd:update\x1b[0m │ ';  // dim yellow
  } else {
    gsdUpdate = '\x1b[33m⬆ /gsd:update\x1b[0m │ ';  // bright yellow (existing)
  }
}
```

This keeps the statusline logic minimal. The update workflow (Task 4) will write `update_declined: true` to the cache when the user skips an update.

Note: The hook source files in `.claude/hooks/` are the SOURCE files. The actual installed hooks come from `hooks/dist/` (bundled). But for development, modifying the source is correct — they get bundled during the build step. Check if there's a build script: if `hooks/dist/` just mirrors `hooks/src/` or `.claude/hooks/`, modify the source. If the build is more complex, also check `src/hooks/` or similar.

Actually, looking at the installer (line 2053): `const hooksSrc = path.join(src, 'hooks', 'dist');` — it copies from `hooks/dist/`. So the source files that need modification are likely in a `hooks/src/` or `src/hooks/` directory that gets compiled. Check for this. The `.claude/hooks/` files are the LOCAL dev copies. For the npm package, hooks are in `hooks/dist/`.

Check: `ls hooks/dist/` and `ls hooks/src/` to understand the build pipeline. Modify BOTH the `.claude/hooks/` source files AND the corresponding source files that produce `hooks/dist/` (if they differ). If `.claude/hooks/*.js` ARE the source files that get copied to `hooks/dist/` during build, modify only `.claude/hooks/`.

If the build pipeline is unclear, just modify `.claude/hooks/*.js` and note in the commit that `hooks/dist/` may need rebuilding.
  </action>
  <verify>
Verify the source files have the new fields:
```bash
node -e "
const fs = require('fs');
const cu = fs.readFileSync('.claude/hooks/gsd-check-update.js','utf8');
const vc = fs.readFileSync('.claude/hooks/gsd-version-check.js','utf8');
const sl = fs.readFileSync('.claude/hooks/gsd-statusline.js','utf8');
console.log('check-update has dual_install:', cu.includes('dual_install'));
console.log('version-check has dual_install:', vc.includes('dual_install'));
console.log('statusline has update_declined:', sl.includes('update_declined'));
"
```
All three should print `true`.
  </verify>
  <done>All three hook source files are dual-install aware. gsd-check-update.js and gsd-version-check.js include `dual_install`, `local_version`, `global_version` in their cache output. gsd-statusline.js dims the update indicator when user has declined an update scope.</done>
</task>

<task type="auto">
  <name>Task 4: Update the /gsd:update workflow for dual-install flow</name>
  <files>
    .claude/get-shit-done/workflows/update.md
  </files>
  <action>
Rewrite the `get_installed_version` step to detect both installations:

```markdown
<step name="get_installed_version">
Detect all GSD installations by checking both local and global:

\`\`\`bash
LOCAL_VERSION=""
GLOBAL_VERSION=""
if [ -f "./.claude/get-shit-done/VERSION" ]; then
  LOCAL_VERSION=$(cat "./.claude/get-shit-done/VERSION")
fi
GLOBAL_VERSION_FILE="$HOME/.claude/get-shit-done/VERSION"
if [ -f "$GLOBAL_VERSION_FILE" ]; then
  GLOBAL_VERSION=$(cat "$GLOBAL_VERSION_FILE")
fi
echo "LOCAL=$LOCAL_VERSION"
echo "GLOBAL=$GLOBAL_VERSION"
\`\`\`

Parse output:
- If both LOCAL and GLOBAL have values: Dual installation detected. Show both versions and proceed to dual update flow.
- If only LOCAL: Single local installation
- If only GLOBAL: Single global installation
- If neither: Unknown installation (treat as 0.0.0)

**If dual installation detected:**
\`\`\`
## GSD Update

**Local install:** vX.Y.Z (this project, takes precedence)
**Global install:** vA.B.C (baseline for all projects)

Both installations detected. See /gsd:help for dual-installation docs.
\`\`\`
</step>
```

Add a new step `choose_update_scope` between `compare_versions` and `show_changes_and_confirm`:

```markdown
<step name="choose_update_scope">
**Only applies when dual installation detected.**

If both local and global are installed, ask user which to update:

Use AskUserQuestion:
- Question: "Which installation(s) would you like to update?"
- Options:
  - "Local only (this project)"
  - "Global only (all projects)"
  - "Both"
  - "Skip update"

Store the choice. If "Skip", write `update_declined: true` to the cache file at `~/.claude/cache/gsd-update-check.json` (merge with existing JSON) so the statusline dims the indicator, then exit.

**Single installation:** Skip this step (update the one that exists, as before).
</step>
```

Update the `run_update` step to handle the user's choice:
- "Local only": Run `npx get-shit-done-reflect-cc --local`
- "Global only": Run `npx get-shit-done-reflect-cc --global`
- "Both": Run local first, then global: `npx get-shit-done-reflect-cc --local && npx get-shit-done-reflect-cc --global`

After successful update, clear the declined flag by removing `update_declined` from the cache JSON.

Also update the success criteria at the end of the workflow to include:
- `[ ] Dual installation detected when both exist`
- `[ ] User given choice of which scope(s) to update`
- `[ ] Declined scope dimmed in statusline`
  </action>
  <verify>
Read the workflow and confirm new steps exist:
```bash
node -e "
const fs = require('fs');
const wf = fs.readFileSync('.claude/get-shit-done/workflows/update.md','utf8');
console.log('has choose_update_scope:', wf.includes('choose_update_scope'));
console.log('has dual:', wf.includes('dual'));
console.log('has update_declined:', wf.includes('update_declined'));
"
```
All three should print `true`.
  </verify>
  <done>Update workflow detects dual installations, presents scope choice to user, handles each scope independently, and writes `update_declined` flag to cache when user skips.</done>
</task>

<task type="auto">
  <name>Task 5: Surface dual-install info on resume + create reference doc</name>
  <files>
    .claude/get-shit-done/workflows/resume-project.md
    .claude/get-shit-done/references/dual-installation.md
  </files>
  <action>
**resume-project.md** — In the `present_status` step (line 136), after the main status box and before the "What would you like to do?" options, add a conditional block:

```markdown
[If dual installation detected (from init JSON `dual_install.detected`):]

Note: Dual GSD installation detected.
  Local: vX.Y.Z (this project — takes precedence)
  Global: vA.B.C (baseline)
  Run /gsd:help for dual-installation details.
```

This is a one-line informational note, not a blocking warning. It uses the `dual_install` field from `cmdInitResume` (added in Task 1).

Also, in the `initialize` step (line 19), update the `Parse JSON for:` line to include `dual_install` in the list of fields.

**dual-installation.md** — Create a new reference doc at `.claude/get-shit-done/references/dual-installation.md`:

```markdown
# Dual Installation: Local + Global

## Topology

- **Global install** (`~/.claude/get-shit-done/`): Baseline. GSD available in every project.
- **Local install** (`./.claude/get-shit-done/`): Version pin. Overrides global for this specific project.

## Precedence

Local always takes precedence over global. When both exist:
- Commands execute from local installation
- VERSION from local is the "active" version
- Hooks check local first, then global

## When to use each

| Scenario | Recommended |
|----------|-------------|
| GSD available everywhere | Global only |
| Pin specific version for a project | Local + Global |
| Testing a development build | Local only |

## Autocomplete

Both installations register commands. You may see duplicates in autocomplete. The local version's commands execute. This is a known cosmetic issue with Claude Code's command discovery.

## Updates

When both installations exist, `/gsd:update` asks which to update:
- **Local only**: Updates this project's pinned version
- **Global only**: Updates baseline (affects all projects without local installs)
- **Both**: Updates both to latest

## Cross-project impact

Updating global affects ALL projects that don't have local installs. The version-check hook detects version mismatches and prompts for migration.

## Installing

```bash
# Global (baseline)
npx get-shit-done-reflect-cc --global

# Local (version pin for current project)
npx get-shit-done-reflect-cc --local

# The installer warns if the other scope already has GSD installed
```
```

  </action>
  <verify>
Verify files exist and contain expected content:
```bash
test -f .claude/get-shit-done/references/dual-installation.md && echo "ref doc exists"
node -e "
const fs = require('fs');
const resume = fs.readFileSync('.claude/get-shit-done/workflows/resume-project.md','utf8');
const ref = fs.readFileSync('.claude/get-shit-done/references/dual-installation.md','utf8');
console.log('resume has dual_install:', resume.includes('dual_install'));
console.log('ref has Topology:', ref.includes('Topology'));
console.log('ref has Precedence:', ref.includes('Precedence'));
"
```
  </verify>
  <done>Resume workflow surfaces dual-install status when detected. Reference doc explains topology (global=baseline, local=pin), precedence rules, update behavior, and autocomplete notes.</done>
</task>

</tasks>

<verification>
After all tasks complete:

1. **gsd-tools.js init** outputs `dual_install` field:
   ```bash
   node .claude/get-shit-done/bin/gsd-tools.js init resume --raw 2>/dev/null | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(JSON.stringify(d.dual_install, null, 2));"
   ```

2. **Installer** has cross-scope warning and version injection:
   ```bash
   grep -c 'injectVersionScope\|otherVersion' bin/install.js
   ```
   Should return >= 2.

3. **Hooks** have dual-install fields:
   ```bash
   grep -l 'dual_install' .claude/hooks/*.js | wc -l
   ```
   Should return 2 (check-update + version-check).

4. **Update workflow** has scope choice:
   ```bash
   grep -c 'choose_update_scope\|update_declined' .claude/get-shit-done/workflows/update.md
   ```
   Should return >= 2.

5. **Tests pass**: `npm test`

6. **Reference doc** exists: `test -f .claude/get-shit-done/references/dual-installation.md`
</verification>

<success_criteria>
- gsd-tools.js init commands include dual_install detection in JSON output
- Installer warns about dual installation when cross-scope install detected
- Command frontmatter descriptions include version + scope suffix
- Update workflow presents scope choice for dual installations
- Statusline dims update indicator when user declines a scope
- Resume workflow surfaces dual-install status
- Reference doc explains topology, precedence, and update behavior
- Existing tests pass (no regressions)
</success_criteria>

<output>
After completion, create `.planning/quick/7-implement-dual-installation-detection-an/7-SUMMARY.md`
</output>
