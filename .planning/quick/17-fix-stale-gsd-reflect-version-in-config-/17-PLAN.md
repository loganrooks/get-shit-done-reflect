---
phase: quick-17
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - get-shit-done/templates/config.json
  - scripts/stamp-version.js
  - package.json
  - get-shit-done/workflows/release.md
autonomous: true
must_haves:
  truths:
    - "config.json template contains the current version (1.16.0) not a stale one"
    - "Running prepublishOnly automatically updates config.json template version from package.json"
    - "The release workflow stamps config.json before committing the release"
  artifacts:
    - path: "get-shit-done/templates/config.json"
      provides: "Config template with current gsd_reflect_version"
      contains: '"gsd_reflect_version": "1.16.0"'
    - path: "scripts/stamp-version.js"
      provides: "Version stamping script"
      exports: "standalone script"
    - path: "package.json"
      provides: "Updated prepublishOnly script"
      contains: "stamp-version"
  key_links:
    - from: "scripts/stamp-version.js"
      to: "package.json"
      via: "reads version field"
      pattern: "require.*package\\.json.*version"
    - from: "scripts/stamp-version.js"
      to: "get-shit-done/templates/config.json"
      via: "writes gsd_reflect_version field"
      pattern: "gsd_reflect_version"
    - from: "package.json"
      to: "scripts/stamp-version.js"
      via: "prepublishOnly script chain"
      pattern: "stamp-version"
---

<objective>
Fix the stale gsd_reflect_version in config.json template (currently 1.13.0, should be 1.16.0) and add automated version stamping so it never goes stale again.

Purpose: Every new install gets the wrong version in their config, and every release since v1.13 has shipped with a stale template. This creates a systemic drift that compounds with each release.
Output: Updated config template, new stamp-version.js script, wired into both prepublishOnly and the release workflow.
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary-standard.md
</execution_context>

<context>
@get-shit-done/templates/config.json
@package.json
@scripts/build-hooks.js
@get-shit-done/workflows/release.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create stamp-version.js and wire into prepublishOnly</name>
  <files>scripts/stamp-version.js, package.json, get-shit-done/templates/config.json</files>
  <action>
1. Create `scripts/stamp-version.js` following the same pattern as `scripts/build-hooks.js` (Node.js, require fs/path, no dependencies):
   - Read version from `package.json` (via require)
   - Read `get-shit-done/templates/config.json` as JSON
   - Update the `gsd_reflect_version` field to match package.json version
   - Write back with JSON.stringify(data, null, 2) + '\n' for consistent formatting
   - Log what it did: `Stamped gsd_reflect_version: {old} -> {new}` (or `already up to date` if same)

2. Update `package.json` prepublishOnly script from:
   `"prepublishOnly": "npm run build:hooks"`
   to:
   `"prepublishOnly": "node scripts/stamp-version.js && npm run build:hooks"`

   Put stamp-version FIRST so the version is stamped before hooks are built.

3. Run `node scripts/stamp-version.js` to immediately fix the stale version (1.13.0 -> 1.16.0) in `get-shit-done/templates/config.json`.
  </action>
  <verify>
Run `node scripts/stamp-version.js` and verify output says "1.16.0". Then verify with:
`node -p "require('./get-shit-done/templates/config.json').gsd_reflect_version"` returns "1.16.0".
Verify prepublishOnly in package.json contains "stamp-version".
  </verify>
  <done>config.json template has gsd_reflect_version "1.16.0", stamp-version.js exists and works, prepublishOnly runs it before build:hooks</done>
</task>

<task type="auto">
  <name>Task 2: Add stamp-version step to release workflow</name>
  <files>get-shit-done/workflows/release.md</files>
  <action>
In `get-shit-done/workflows/release.md`, modify Step 5 ("Bump version in package.json") to also stamp the config template. After the existing version bump and verification commands, add:

```
Then stamp the version into the config template:
```bash
node scripts/stamp-version.js
```

This ensures the template's `gsd_reflect_version` matches the new version before the release commit.

Also update Step 7 ("Commit, tag, and push") to stage the config template. Change the git add line from:
```bash
git add package.json CHANGELOG.md
```
to:
```bash
git add package.json CHANGELOG.md get-shit-done/templates/config.json
```

This ensures the stamped config.json is included in the release commit.

IMPORTANT: Also update the corresponding installed copy. After editing `get-shit-done/workflows/release.md`, the same change must be made to `commands/gsd/release.md` -- but only the execution_context reference path, which already points to the workflow file. The command file itself does not need content changes since it delegates to the workflow. No changes needed to `commands/gsd/release.md`.
  </action>
  <verify>
Read `get-shit-done/workflows/release.md` and confirm:
1. Step 5 includes `node scripts/stamp-version.js` after version bump
2. Step 7 git add includes `get-shit-done/templates/config.json`
  </verify>
  <done>Release workflow stamps config template version and includes it in the release commit, so future releases will never ship with a stale gsd_reflect_version</done>
</task>

</tasks>

<verification>
1. `node scripts/stamp-version.js` runs without error and reports correct version
2. `node -p "require('./get-shit-done/templates/config.json').gsd_reflect_version"` returns "1.16.0"
3. `node -p "require('./package.json').scripts.prepublishOnly"` contains "stamp-version"
4. `grep -c 'stamp-version' get-shit-done/workflows/release.md` returns at least 1
5. `grep 'templates/config.json' get-shit-done/workflows/release.md` shows it in git add
6. `npm test` passes (no regressions)
</verification>

<success_criteria>
- config.json template has gsd_reflect_version "1.16.0" (not "1.13.0")
- scripts/stamp-version.js exists and correctly reads version from package.json and writes to config template
- prepublishOnly runs stamp-version before build:hooks
- Release workflow stamps and stages config.json as part of the release commit
- All existing tests pass
</success_criteria>

<output>
After completion, create `.planning/quick/17-fix-stale-gsd-reflect-version-in-config-/17-SUMMARY.md`
</output>
