---
phase: quick-7
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - .claude/get-shit-done/bin/gsd-tools.js
  - .claude/get-shit-done/workflows/resume-project.md
  - .claude/get-shit-done/references/dual-installation.md
  - bin/install.js
autonomous: true
must_haves:
  truths:
    - "gsd-tools init outputs dual_install field when both local and global installations exist"
    - "Installer warns user when installing at scope where other scope already exists"
    - "Command descriptions include version and scope after installation"
    - "Dual-installation topology is documented in a reference doc"
    - "Resume workflow surfaces dual-install status"
  artifacts:
    - path: ".claude/get-shit-done/bin/gsd-tools.js"
      provides: "dual_install detection in init commands"
      contains: "dual_install"
    - path: "bin/install.js"
      provides: "Cross-scope detection warning + description injection"
      contains: "injectVersionScope"
    - path: ".claude/get-shit-done/references/dual-installation.md"
      provides: "Topology documentation"
    - path: ".claude/get-shit-done/workflows/resume-project.md"
      provides: "Dual-install status surfacing on resume"
      contains: "dual_install"
  key_links:
    - from: ".claude/get-shit-done/bin/gsd-tools.js"
      to: "VERSION files at both paths"
      via: "detectDualInstall helper"
      pattern: "dual_install"
    - from: "bin/install.js"
      to: "VERSION files at other scope"
      via: "cross-scope existence check"
      pattern: "otherVersion|injectVersionScope"
---

<objective>
Implement dual-installation detection and awareness (Phase 1 of 2). When both local (./.claude/) and global (~/.claude/) GSD installations exist, the system detects them, warns during installation, differentiates commands in autocomplete, and documents the topology.

Phase 2 (deferred): Update workflow scope choice, hook awareness with scope-aware indicators, version-pinned suppression, per-scope changelog deliberation.

Output: Modified gsd-tools.js, install.js, resume workflow, and a new reference doc.
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
3. If BOTH exist AND the paths are different (avoid false positive when cwd IS the home dir), return:
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
  <name>Task 2: Add cross-scope detection warning and version/scope injection to installer</name>
  <files>
    bin/install.js
  </files>
  <action>
**Part A: Cross-scope warning**

In the `install(isGlobal, runtime)` function (line 1882), immediately after computing `targetDir` and `locationLabel` (around line 1896), add cross-scope detection logic:

1. Compute the "other scope" path:
   - If `isGlobal`, other scope = `path.join(process.cwd(), dirName, 'get-shit-done', 'VERSION')`
   - If local, other scope = `path.join(getGlobalDir(runtime, explicitConfigDir), 'get-shit-done', 'VERSION')`
2. Check if the other scope's VERSION file exists.
3. If it does, read its version and print a warning:

```js
const otherVersionPath = isGlobal
  ? path.join(process.cwd(), dirName, 'get-shit-done', 'VERSION')
  : path.join(getGlobalDir(runtime, explicitConfigDir), 'get-shit-done', 'VERSION');

if (fs.existsSync(otherVersionPath)) {
  const otherVersion = fs.readFileSync(otherVersionPath, 'utf8').trim();
  const otherLabel = isGlobal ? 'local (this project)' : 'global';
  console.log(`\n  ${yellow}Note:${reset} GSD is also installed ${otherLabel} (v${otherVersion}).`);
  console.log(`  You will have dual installations after this install.`);
  console.log(`  ${dim}Local always takes precedence. Commands may appear twice in autocomplete.${reset}`);
  console.log(`  ${dim}See: .claude/get-shit-done/references/dual-installation.md${reset}\n`);
}
```

This is a non-blocking informational warning. It does NOT prevent installation.

**Part B: Version/scope injection into command descriptions**

Create a helper function `injectVersionScope(content, version, scope)`:

```js
function injectVersionScope(content, version, scope) {
  // Only modify if content has YAML frontmatter with description field
  if (!content.startsWith('---')) return content;
  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) return content;
  const frontmatter = content.substring(0, endIdx + 3);
  const body = content.substring(endIdx + 3);
  // Strip any existing version/scope suffix before adding new one
  const modified = frontmatter.replace(
    /^(description:\s*)(.+?)(\s*\(v[\d.]+ (?:local|global)\))?$/m,
    `$1$2 (v${version} ${scope})`
  );
  return modified + body;
}
```

After command files are copied to their destination, walk the copied .md files and apply `injectVersionScope` to each:

- For Claude/Gemini nested commands (lines ~1951-1963): after `copyWithPathReplacement(gsdSrc, gsdDest, pathPrefix, runtime)`, iterate `.md` files in `gsdDest` and rewrite each with `injectVersionScope(content, pkg.version, isGlobal ? 'global' : 'local')`
- For OpenCode flat commands (lines ~1937-1950): same pattern after copying
- For Codex skills (lines ~1924-1936): same pattern after copying

Do NOT modify agent files, workflow files, or any non-command files with version injection.
  </action>
  <verify>
Run the existing test suite to ensure nothing breaks: `cd /Users/rookslog/Development/get-shit-done-reflect && npm test 2>&1 | tail -5`

Also verify the functions exist: `node -e "const src = require('fs').readFileSync('bin/install.js','utf8'); console.log('has injectVersionScope:', src.includes('injectVersionScope')); console.log('has otherVersionPath:', src.includes('otherVersionPath') || src.includes('otherScope'));"`
  </verify>
  <done>Installer warns when installing at a scope where the other scope already has GSD installed. Command frontmatter description fields include `(vX.Y.Z scope)` suffix after installation. Tests pass.</done>
</task>

<task type="auto">
  <name>Task 3: Surface dual-install info on resume + create reference doc</name>
  <files>
    .claude/get-shit-done/workflows/resume-project.md
    .claude/get-shit-done/references/dual-installation.md
  </files>
  <action>
**resume-project.md** — In the `present_status` step (line 136), after the main status box and before the "What would you like to do?" options, add a conditional block:

```markdown
[If dual installation detected (from init JSON `dual_install.detected`):]

ℹ️  Dual GSD installation detected:
    Local: vX.Y.Z (this project — active)
    Global: vA.B.C (baseline)
    See: references/dual-installation.md
```

This is a one-line informational note, not a blocking warning. It uses the `dual_install` field from `cmdInitResume` (added in Task 1).

Also, in the `initialize` step (line 19), update the `Parse JSON for:` line to include `dual_install` in the list of fields.

**dual-installation.md** — Create a new reference doc at `.claude/get-shit-done/references/dual-installation.md`:

```markdown
# Dual Installation: Local + Global

## Intended Topology

- **Global install** (`~/.claude/get-shit-done/`): Baseline. Makes GSD available in every project by default.
- **Local install** (`./.claude/get-shit-done/`): Version pin. Overrides global for a specific project that needs stability or a particular version.

This mirrors the npm global vs local package model.

## Precedence Rules

Local always takes precedence over global. When both exist:
- Commands execute from the local installation
- VERSION from local is the "active" version
- Hooks check local first, fall back to global
- gsd-tools.js init reports the local version as active

## When to Use Each

| Scenario | Recommended Setup |
|----------|-------------------|
| GSD available everywhere, no version pinning needed | Global only |
| Specific project needs a pinned GSD version | Local (project) + Global (baseline) |
| Testing a development build of GSD | Local only (in the GSD repo itself) |
| New to GSD, just getting started | Global only |

## Autocomplete Behavior

When both installations exist, Claude Code discovers commands from both `./.claude/commands/` and `~/.claude/commands/`. This may cause duplicate entries in autocomplete. The version and scope are appended to each command's description (e.g., "Create execution plan (v1.15.2 local)") to help differentiate them.

The local installation's commands take precedence for execution.

## Cross-Project Impact

Updating the **global** installation affects ALL projects that rely on it (i.e., projects without their own local install). Before updating global:
- Consider which projects use it
- The version-check hook detects version mismatches on session start
- Projects with local installs are unaffected by global updates

Updating a **local** installation only affects that specific project.

## Installing

\`\`\`bash
# Global (baseline — available in all projects)
npx get-shit-done-reflect-cc --global

# Local (version pin — this project only)
npx get-shit-done-reflect-cc --local

# The installer warns if the other scope already has GSD installed
\`\`\`

## Related

- `/gsd:update` — handles both scopes when dual installation detected
- `.planning/config.json` — project-level GSD version tracking
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
  <done>Resume workflow surfaces dual-install status when detected. Reference doc explains topology (global=baseline, local=pin), precedence rules, autocomplete behavior, cross-project impact, and installation guidance.</done>
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
   grep -c 'injectVersionScope\|otherVersionPath' bin/install.js
   ```
   Should return >= 2.

3. **Resume workflow** surfaces dual-install:
   ```bash
   grep -c 'dual_install' .claude/get-shit-done/workflows/resume-project.md
   ```
   Should return >= 1.

4. **Reference doc** exists with key sections:
   ```bash
   test -f .claude/get-shit-done/references/dual-installation.md && echo "exists"
   ```

5. **Tests pass**: `npm test`
</verification>

<success_criteria>
- gsd-tools.js init commands include dual_install detection in JSON output
- Installer warns about dual installation when cross-scope install detected
- Command frontmatter descriptions include version + scope suffix after installation
- Resume workflow surfaces dual-install status with versions
- Reference doc explains topology, precedence, autocomplete, and cross-project impact
- Existing tests pass (no regressions)
</success_criteria>

<output>
After completion, create `.planning/quick/7-implement-dual-installation-detection-an/7-SUMMARY.md`
</output>
