# FEAT-01 Reapply-Patches Verification Evidence

## 1. writeManifest() -- Manifest Generation

**File:** `bin/install.js` lines 1180-1206

**Covers three directory types:**
- `get-shit-done/` -- via `generateManifest(gsdDir)` (line 1186)
- `commands/gsd/` -- via `generateManifest(commandsDir)` (line 1191)
- `agents/gsd-*` -- via filtered `readdirSync(agentsDir)` matching `gsd-` prefix (line 1198)

**Manifest structure:** `{ version, timestamp, files: { [relPath]: sha256hash } }`
- version: from `pkg.version` (package.json)
- timestamp: ISO 8601 via `new Date().toISOString()`
- files: SHA256 hashes keyed by relative path

**Hash function:** `fileHash()` at line 1152 uses `crypto.createHash('sha256').update(content).digest('hex')` -- CONFIRMED SHA256.

**Output:** Written to `configDir/gsd-file-manifest.json` (MANIFEST_NAME constant, line 1147).

## 2. saveLocalPatches() -- Patch Detection

**File:** `bin/install.js` lines 1212-1247

**Behavior:**
- Reads manifest from `configDir/gsd-file-manifest.json`
- Returns `[]` (not error) when no manifest exists (line 1214)
- Returns `[]` (not error) when manifest parse fails (line 1217)
- Iterates `manifest.files`, compares `fileHash(fullPath)` against stored hash
- Modified files copied to `configDir/gsd-local-patches/{relPath}`
- Creates parent directories via `fs.mkdirSync(dirname, { recursive: true })`

**backup-meta.json structure:**
```json
{
  "backed_up_at": "ISO timestamp",
  "from_version": "manifest.version",
  "files": ["array", "of", "modified", "relPaths"]
}
```

## 3. reportLocalPatches() -- User Notification

**File:** `bin/install.js` lines 1252-1273

**Key output:** `Run /gsd:reapply-patches to merge them into the new version.` (line 1268)
- Uses `/gsd:reapply-patches` -- correct fork command syntax
- No upstream branding found (`get-shit-done-cc` without `-reflect` returns zero matches in install.js)

## 4. reapply-patches.md -- Command Spec

**File:** `commands/gsd/reapply-patches.md` (111 lines)

**Path checking:** Step 1 checks global `$HOME/.claude/gsd-local-patches` first, falls back to local `./.claude/gsd-local-patches`

**Merge strategy (Step 3):**
1. Read backed-up version (user's modified copy)
2. Read newly installed version (current file after update)
3. If identical: skip (modification incorporated upstream)
4. If different: identify user modifications, apply to new version
5. Conflict handling: flag conflicts, show both versions, ask user which to keep

**Cleanup (Step 5):** Offers user choice to keep or remove `gsd-local-patches/`

## 5. Functional Test

```
VERSION hash: 5247d3c62de6f71f4b6c502b7fa0d2aec207d7cd471d5093efeb9d86ddfdf19c
VERSION content: 1.12.2
No manifest found (expected if install did not run writeManifest yet)
```

SHA256 hash generation works correctly. No manifest present because this is a development checkout, not an npm install -- expected behavior.

## 6. Fork Branding Check

- `grep 'get-shit-done-cc' bin/install.js` -- zero matches (no upstream package name)
- `grep 'get-shit-done-cc[^-]' bin/install.js` -- zero matches (no upstream branding at all)
- User-visible messages use generic names (PATCHES_DIR_NAME, /gsd:reapply-patches)

**VERDICT: PASS** -- All 6 checks verified.
