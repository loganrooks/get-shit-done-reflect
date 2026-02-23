---
phase: quick-3
plan: 3
title: "Fix 6 Critical PR#4 Bugs"
objective: "Fix installer edge cases and add runtime capability guards before merging PR #4"
files_modified:
  - bin/install.js
  - .claude/get-shit-done/workflows/collect-signals.md
  - .claude/get-shit-done/workflows/reflect.md
  - .claude/get-shit-done/workflows/run-spike.md
---

<tasks>

<task id="1" title="C1: migrateKB backup collision check" type="code">
**File:** `bin/install.js` lines 293-296

**Problem:** `fs.renameSync(oldKBDir, backupDir)` will crash if `.migration-backup` already exists (e.g., re-running installer after partial migration).

**Fix:** Before line 294, check if `backupDir` already exists. If it does, append a timestamp suffix.

```javascript
// Replace lines 294-296:
const backupDir = oldKBDir + '.migration-backup';
// Check for existing backup — append timestamp if collision
let finalBackupDir = backupDir;
if (fs.existsSync(backupDir)) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  finalBackupDir = backupDir + '-' + timestamp;
}
fs.renameSync(oldKBDir, finalBackupDir);
fs.symlinkSync(newKBDir, oldKBDir);
```

**Verification:** The variable `backupDir` on line 294 is currently used directly in `renameSync`. After fix, `finalBackupDir` is used instead, with collision detection.
</task>

<task id="2" title="C2: migrateKB dangling symlink handling" type="code">
**File:** `bin/install.js` lines 264-300

**Problem:** `fs.existsSync(oldKBDir)` at line 264 returns `false` for dangling symlinks (symlink exists but target doesn't). This means a dangling symlink at the old KB path will be silently ignored, and the code falls through to Step 3 where it tries to create a NEW symlink — which will fail because the dangling symlink already occupies that path.

**Fix:** Before the `fs.existsSync(oldKBDir)` check, add a dangling symlink check using `fs.lstatSync`. If a dangling symlink is detected, remove it and skip to symlink creation.

Insert before line 264:
```javascript
// Check for dangling symlink at old path (existsSync returns false for dangling symlinks)
try {
  const oldStat = fs.lstatSync(oldKBDir);
  if (oldStat.isSymbolicLink()) {
    // Symlink exists — check if target is valid
    if (!fs.existsSync(oldKBDir)) {
      // Dangling symlink — remove it and create fresh one pointing to new location
      console.log(`  ${yellow}!${reset} Removing dangling symlink at ${oldKBDir}`);
      fs.unlinkSync(oldKBDir);
      fs.symlinkSync(newKBDir, oldKBDir);
      console.log(`  ${green}✓${reset} Knowledge base already at: ${newKBDir}`);
      return;
    }
  }
} catch (e) {
  // lstat failed — path doesn't exist at all, proceed normally
}
```

**Verification:** The dangling symlink case is now handled before the `existsSync` check. Normal flow (real directory, valid symlink, no path) continues unchanged.
</task>

<task id="3" title="C3: Codex @ file reference regex for absolute paths" type="code">
**File:** `bin/install.js`

**Problem:** `convertClaudeToCodexSkill()` at line 809 hardcodes `@~/.codex/` in its regex, but if the pathPrefix used by `replacePathsInContent()` was an absolute path (e.g., `/Users/foo/.codex/`), the `@` references won't match and Codex will try to use `@` syntax which it doesn't support.

**Fix:**
1. Add `pathPrefix` as a 3rd parameter to `convertClaudeToCodexSkill(content, commandName, pathPrefix)`
2. Make the regex at line 809 dynamic: escape the pathPrefix and match `@` followed by it
3. Update the call site at line 904 to pass `pathPrefix`
4. Update the module.exports at the bottom to match the new signature (tests may need updating)

```javascript
// In convertClaudeToCodexSkill, replace line 809:
// Old: converted = converted.replace(/@(~\/\.codex\/[^\s]+)/g, 'Read the file at `$1`');
// New: dynamic regex based on pathPrefix
const escapedPrefix = pathPrefix.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
converted = converted.replace(new RegExp(`@(${escapedPrefix}[^\\s]+)`, 'g'), 'Read the file at `$1`');
// Also keep the tilde variant as fallback
converted = converted.replace(/@(~\/\.codex\/[^\s]+)/g, 'Read the file at `$1`');
```

At call site (line 904): `content = convertClaudeToCodexSkill(content, skillName, pathPrefix);`

**Verification:** Both `@~/.codex/...` and `@/absolute/path/.codex/...` patterns are now converted.
</task>

<task id="4" title="C4: Add capability guard to collect-signals.md" type="code">
**File:** `.claude/get-shit-done/workflows/collect-signals.md` around line 103-129

**Problem:** The `Task()` call at line 106 will fail on runtimes that don't support agent spawning (Codex CLI). Need a runtime capability guard.

**Fix:** Wrap the Task() call in a capability check. If agent spawning is not available, fall back to inline execution guidance.

Before the `Task(` block (line 103), add:

```markdown
**Runtime capability check:**

If the current runtime does not support agent spawning (e.g., Codex CLI — no Task tool available), execute the signal collection inline instead of delegating to a subagent:

1. Read the gsd-signal-collector agent spec for detection rules
2. Follow the detection logic directly in the current context
3. Write signals to `~/.gsd/knowledge/signals/{PROJECT_NAME}/`
4. Return the Signal Collection Report

**If agent spawning is available (Claude Code, OpenCode, Gemini CLI):**
```

After the Task() block closing, add:
```markdown
**End capability check**
```

**Verification:** Runtimes without Task tool get inline fallback instructions.
</task>

<task id="5" title="C5: Add capability guard to reflect.md" type="code">
**File:** `.claude/get-shit-done/workflows/reflect.md` around line 182-228

**Problem:** Same as C4 — `Task()` at line 187 will fail on runtimes without agent spawning.

**Fix:** Same pattern as C4. Wrap the Task() call in a capability check with inline fallback.

Before line 182 (`<step name="spawn_reflector">`), modify the step to include:

```markdown
**Runtime capability check:**

If the current runtime does not support agent spawning (e.g., Codex CLI — no Task tool available), execute the reflection analysis inline instead of delegating to a subagent:

1. Read the gsd-reflector agent spec for analysis rules
2. Follow the reflection logic directly in the current context
3. Write lessons to `~/.gsd/knowledge/lessons/`
4. Return the Reflection Report

**If agent spawning is available (Claude Code, OpenCode, Gemini CLI):**
```

After the Task() block, add closing marker.

**Verification:** Runtimes without Task tool get inline fallback instructions.
</task>

<task id="6" title="C6: Add capability guard to run-spike.md" type="code">
**File:** `.claude/get-shit-done/workflows/run-spike.md` around line 115-127

**Problem:** The spike runner agent spawn at line 118 will fail on runtimes without agent spawning.

**Fix:** Same pattern as C4/C5. The spike workflow uses `@` agent reference syntax rather than `Task()`, but the principle is the same — agent delegation needs a fallback.

Before line 115 ("### 5. Spawn Spike Runner Agent"), add:

```markdown
**Runtime capability check:**

If the current runtime does not support agent spawning (e.g., Codex CLI — no Task tool available), execute the spike Build -> Run -> Document phases inline instead of delegating to a subagent:

1. Read the gsd-spike-runner agent spec
2. Execute the Build phase (create implementation in workspace)
3. Execute the Run phase (run tests/validation defined in DESIGN.md)
4. Execute the Document phase (create DECISION.md with results)
5. Continue to step 6 (Handle Agent Result)

**If agent spawning is available (Claude Code, OpenCode, Gemini CLI):**
```

After the agent spawn block (line 127), add closing marker.

**Verification:** Runtimes without agent spawning get inline execution instructions.
</task>

</tasks>

<verification>
After all tasks:
1. Run `npm test` to verify no regressions
2. Verify install.js changes compile (no syntax errors)
3. Check that all 3 workflow files have capability guards around their agent spawn points
</verification>
