---
description: Reapply local modifications after a GSD update
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion
---

<purpose>
After a GSD update wipes and reinstalls files, this command merges user's previously saved local modifications back into the new version. Uses intelligent comparison to handle cases where the upstream file also changed.
</purpose>

<process>

## Step 1: Enumerate backed-up patches (both legacy and current directory names)

`reapply-patches` scans both `gsd-local-patches/` (legacy, pre-v1.18) and
`gsdr-local-patches/` (current) under the target runtime's install directory.
Use the shared `scanPatchesDirectories(runtimeInstallDir)` helper from
`get-shit-done/bin/lib/patch-classifier.cjs` so the dual-directory probe stays
in one place.

```bash
RUNTIME_INSTALL_DIR="${HOME}/.claude"   # or "${HOME}/.codex" for Codex
PATCH_ENTRIES=$(node -e "
const { scanPatchesDirectories } = require('./get-shit-done/bin/lib/patch-classifier.cjs');
console.log(JSON.stringify(scanPatchesDirectories('$RUNTIME_INSTALL_DIR')));
")
```

Each returned entry includes:
- `relPath` / `filename`
- `backupDir`
- `legacyNaming: true|false`
- `fromVersion`
- `metaEntry`

Read `backup-meta.json` from the entry's `backupDir` when you need per-backup
metadata such as the source runtime or capture version.

**If no patches found:**
```
No local patches found. Nothing to reapply.

Local patches are automatically saved when you run /gsd:update
after modifying any GSD workflow, command, or agent files.
```
Exit.

## Step 2: Show patch summary

```
## Local Patches to Reapply

**Backed up from:** v{from_version}
**Current version:** {read VERSION file}
**Files modified:** {count}

| # | File | Status |
|---|------|--------|
| 1 | {file_path} | Pending |
| 2 | {file_path} | Pending |
```

## Step 3: Merge each file

### Stage 3A: XRT-02 Patch Compatibility Check (Phase 60)

Before applying each backed-up patch, validate it against the target runtime.
This is the pre-apply gate for cross-runtime patch safety.

```bash
PATCH_CONTENT=$(cat "$PATCH_PATH")
TARGET_RUNTIME="<claude|codex>"
SOURCE_RUNTIME="<runtime captured in backup-meta.json>"
REL_PATH="<patch relPath within the runtime scope>"
TARGET_VERSION=$(cat "$TARGET_RUNTIME_DIR/get-shit-done-reflect/VERSION" 2>/dev/null || echo "")
PATCH_SOURCE_VERSION="<fromVersion from backup-meta.json if present>"

VERDICT=$(node -e "
const fs = require('fs');
const { validatePatchForRuntime } = require('./get-shit-done/bin/lib/xrt02-validator.cjs');
const result = validatePatchForRuntime({
  patchContent: fs.readFileSync('$PATCH_PATH', 'utf8'),
  patchSourceRuntime: '$SOURCE_RUNTIME',
  targetRuntime: '$TARGET_RUNTIME',
  relPath: '$REL_PATH',
  patchSourceVersion: '$PATCH_SOURCE_VERSION',
  targetVersion: '$TARGET_VERSION',
  targetRuntimeDir: '$TARGET_RUNTIME_DIR',
});
console.log(JSON.stringify(result));
")

COMPATIBLE=$(printf '%s' "$VERDICT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).compatible)")
REMEDIATION=$(printf '%s' "$VERDICT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).remediation || '')")
LOW_CONFIDENCE=$(printf '%s' "$VERDICT" | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).low_confidence ? 'true' : '')")
```

Branch on the verdict:
- If `compatible=true` and `remediation` is empty: apply the raw patch content.
- If `compatible=true` and `remediation=convert-and-apply`: extract `converted`
  from the verdict and apply that content instead of the raw patch.
- If `compatible=false` and `remediation=convert-and-apply`: show the evidence
  and let the user choose `[convert-and-apply]`, `[skip this patch]`, or
  `[abort the reapply session]`.
- If `compatible=false` and `remediation=skip`: report
  `Skipping <relPath>: feature-gap on <target-runtime>` and continue to the next
  patch. When `low_confidence=true`, surface the evidence and let the user
  confirm the skip instead of silently continuing.
- If `compatible=false` and `remediation=abort`: report the issue and ask the
  user whether to `[skip this patch]` or `[abort the reapply session]`.

The validator uses the shared classification vocabulary from the patch sensor:
`format-drift` means the target runtime has a surface but the patch needs
conversion; `feature-gap` means the target runtime has no surface for what the
patch references.

For each file in `backup-meta.json`:

1. **Read the backed-up version** (user's modified copy from `gsd-local-patches/`)
2. **Read the newly installed version** (current file after update)
3. **Compare and merge:**

   - If the new file is identical to the backed-up file: skip (modification was incorporated upstream)
   - If the new file differs: identify the user's modifications and apply them to the new version

   **Merge strategy:**
   - Read both versions fully
   - Identify sections the user added or modified (look for additions, not just differences from path replacement)
   - Apply user's additions/modifications to the new version
   - If a section the user modified was also changed upstream: flag as conflict, show both versions, ask user which to keep

4. **Write merged result** to the installed location
5. **Report status:**
   - `Merged` — user modifications applied cleanly
   - `Skipped` — modification already in upstream
   - `Conflict` — user chose resolution

## Step 4: Update manifest

After reapplying, regenerate the file manifest so future updates correctly detect these as user modifications:

```bash
# The manifest will be regenerated on next /gsd:update
# For now, just note which files were modified
```

## Step 5: Cleanup option

Ask user:
- "Keep patch backups for reference?" → preserve `gsd-local-patches/`
- "Clean up patch backups?" → remove `gsd-local-patches/` directory

## Step 6: Report

```
## Patches Reapplied

| # | File | Status |
|---|------|--------|
| 1 | {file_path} | ✓ Merged |
| 2 | {file_path} | ○ Skipped (already upstream) |
| 3 | {file_path} | ⚠ Conflict resolved |

{count} file(s) updated. Your local modifications are active again.
```

</process>

<success_criteria>
- [ ] All backed-up patches processed
- [ ] User modifications merged into new version
- [ ] Conflicts resolved with user input
- [ ] Status reported for each file
</success_criteria>
