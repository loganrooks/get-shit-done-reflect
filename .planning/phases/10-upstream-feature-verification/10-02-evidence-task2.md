# FEAT-05 Update Detection + FEAT-06 JSONC Parsing Verification Evidence

## FEAT-05: Update Command Local/Global Detection

### 1. Fork Package Name in update.md

All npm/npx references use `get-shit-done-reflect-cc` (fork name):
- Line 50: `npm view get-shit-done-reflect-cc version 2>/dev/null`
- Line 57: `npx get-shit-done-reflect-cc --global`
- Line 149: `npx get-shit-done-reflect-cc --local`
- Line 154: `npx get-shit-done-reflect-cc --global`

Zero instances of upstream `get-shit-done-cc` (without `-reflect`).

### 2. Fork Package Name in gsd-check-update.js

- Line 45: `npm view get-shit-done-reflect-cc version` -- correct fork package

### 3. Local/Global Detection Logic

**update.md Step 1:**
- Checks `./.claude/get-shit-done/VERSION` first (local priority)
- Falls back to `~/.claude/get-shit-done/VERSION` (global)
- Uses `--local` or `--global` flag accordingly

**gsd-check-update.js:**
- `projectVersionFile` = `cwd + '.claude/get-shit-done/VERSION'` (local)
- `globalVersionFile` = `homeDir + '.claude/get-shit-done/VERSION'` (global)
- Checks project first (line 36), then global (line 38) -- matches update.md priority

### 4. GitHub URL Points to Fork

Line 182: `https://github.com/loganrooks/get-shit-done-reflect/blob/main/CHANGELOG.md`
- Correct fork owner: `loganrooks`
- Correct fork repo: `get-shit-done-reflect`

### 5. Proactive Update Notification Chain

Complete chain verified:

1. **Hook registration (install.js lines 1464-1486):**
   - Registers `gsd-check-update.js` as `SessionStart` hook
   - Checks for existing hook before adding (prevents duplicates)
   - Uses `detached: true` for background process

2. **Background check (gsd-check-update.js):**
   - Spawns detached child process (line 25)
   - Checks npm registry: `npm view get-shit-done-reflect-cc version`
   - Writes cache to `~/.claude/cache/gsd-update-check.json`
   - Cache structure: `{ update_available, installed, latest, checked }`

3. **Statusline display (gsd-statusline.js lines 69-76):**
   - Reads `~/.claude/cache/gsd-update-check.json`
   - If `cache.update_available` is true: shows `gsd-update` indicator in statusline
   - Display: yellow arrow + `/gsd:update` text

**Chain is complete:** SessionStart hook -> background npm check -> cache file -> statusline reads cache

## FEAT-06: JSONC Parsing

### 6. parseJsonc() Function Analysis

**File:** `bin/install.js` lines 980-1033

**Edge cases handled:**
| Case | Implementation | Line |
|------|---------------|------|
| BOM stripping | `charCodeAt(0) === 0xFEFF` -> `content.slice(1)` | 982-984 |
| Single-line comments | `//` to end of line skipped | 1011-1015 |
| Block comments | `/* ... */` skipped | 1016-1022 |
| Trailing commas | Regex: `/,(\s*[}\]])/g` -> `$1` | 1031 |
| String preservation | `inString` flag tracks `"` boundaries | 994-1005 |
| Escape sequences | `\\` inside strings handled correctly | 997-1001 |

### 7. Functional Test Results

```
PASS basic JSON
PASS single-line comment
PASS block comment
PASS trailing comma
PASS string with //
PASS BOM prefix
PASS string with /* */ inside
PASS multiple trailing commas
8/8 passed
```

All edge cases verified including the critical "string containing //" case (URLs) and "string containing /* */" case.

### 8. Upstream Test Coverage

`grep 'parseJsonc\|jsonc\|JSONC' gsd-tools.test.js` -- zero matches.
No upstream tests exist for JSONC parsing. The functional test above provides coverage.

## Test Suite Verification

```
node --test gsd-tools.test.js: 75/75 passed
npx vitest run: 42/42 passed (4 e2e skipped)
Total: 117 tests passing
```

**VERDICT: ALL CHECKS PASS**
