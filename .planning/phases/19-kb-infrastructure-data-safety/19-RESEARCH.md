# Phase 19: KB Infrastructure & Data Safety - Research

**Researched:** 2026-02-14
**Domain:** Shell scripting, installer integration, YAML frontmatter schema, data backup/recovery
**Confidence:** HIGH

## Summary

Phase 19 addresses four discrete gaps from the post-v1.14 analysis (Gaps 5-6, 13-14): (1) KB management scripts are mislocated and improperly referenced, (2) KB migration has no pre-migration backup or recovery mechanism, (3) KB entries lack a `gsd_version` provenance field, and (4) spike and lesson templates lack the runtime/model provenance fields that signals already have.

The current state is well-understood. The two KB shell scripts (`kb-rebuild-index.sh`, `kb-create-dirs.sh`) live at `.claude/agents/` in the source repo but are never installed to `~/.gsd/bin/` by the installer. Workflow files reference them at `~/.claude/agents/kb-rebuild-index.sh` which is wrong for two reasons: (a) KB scripts should live with the KB, not with runtime-specific agents, and (b) the path breaks for non-Claude runtimes and local installs. The `migrateKB()` function in `install.js` copies data and creates a backup (`*.migration-backup`), but there is no pre-migration safety net (the backup only exists AFTER successful migration -- if migration itself corrupts data, the original is already gone). Signal templates were enriched with `runtime:` and `model:` fields in Phase 16, but spike and lesson templates were not. No entry type carries `gsd_version`.

All four work items are additive changes to existing infrastructure with no external library dependencies. The work is shell scripting, installer JS modifications, template YAML additions, and workflow path reference updates.

**Primary recommendation:** Treat this as 2 plans -- (1) script relocation + path reference updates + installer `~/.gsd/bin/` installation, (2) backup/recovery mechanism + `gsd_version` field + provenance field additions to spike/lesson templates.

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| Bash | 3.2+ (macOS default) | KB management scripts | Already used by kb-rebuild-index.sh and kb-create-dirs.sh |
| Node.js fs module | Built-in | Installer file operations, backup/recovery | Already used by install.js migrateKB() |
| YAML frontmatter | N/A | KB entry metadata schema | Already the schema format for all KB entries |

### Supporting
| Tool | Version | Purpose | When to Use |
|------|---------|---------|-------------|
| Vitest | 3.x | Test framework | For new backup/recovery and provenance tests |
| tmpdirTest helper | Local | Temp directory test fixtures | Already used by kb-infrastructure.test.js |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shell scripts at `~/.gsd/bin/` | Node.js scripts at `~/.gsd/bin/` | Shell is simpler, no dependency, matches existing pattern |
| Copying scripts to `~/.gsd/bin/` | Symlinking from install target | Copy is portable, symlink breaks if install target moves |
| `tar` for backup | `cp -r` for backup | tar creates single-file archive (easier to manage), but cp -r matches existing pattern |

## Architecture Patterns

### Current KB Script Location (WRONG)
```
Source repo:
  .claude/agents/kb-rebuild-index.sh    <-- wrong directory (agents/ is for LLM specs)
  .claude/agents/kb-create-dirs.sh      <-- wrong directory

Workflow references:
  bash ~/.claude/agents/kb-rebuild-index.sh   <-- wrong path for non-Claude runtimes
```

### Target KB Script Location (CORRECT)
```
Source repo:
  .claude/agents/kb-rebuild-index.sh    <-- keep here for source organization
  .claude/agents/kb-create-dirs.sh      <-- keep here for source organization

Installed at runtime:
  ~/.gsd/bin/kb-rebuild-index.sh        <-- global, runtime-agnostic
  ~/.gsd/bin/kb-create-dirs.sh          <-- global, runtime-agnostic

Workflow references:
  bash ~/.gsd/bin/kb-rebuild-index.sh   <-- correct path, works for all runtimes
```

### Pattern 1: Installer Copies KB Scripts to ~/.gsd/bin/
**What:** The installer creates `~/.gsd/bin/` and copies KB scripts there during the migrateKB() or a new installKBScripts() step.
**When to use:** Every install/reinstall -- scripts should always be current.
**Example:**
```javascript
// In install.js, after migrateKB() or as part of it
function installKBScripts(gsdHome) {
  const binDir = path.join(gsdHome, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  const scripts = ['kb-rebuild-index.sh', 'kb-create-dirs.sh'];
  const scriptSrc = path.join(__dirname, '..', '.claude', 'agents');

  for (const script of scripts) {
    const src = path.join(scriptSrc, script);
    const dest = path.join(binDir, script);
    fs.copyFileSync(src, dest);
    fs.chmodSync(dest, 0o755); // Ensure executable
  }
}
```

### Pattern 2: Pre-Migration Backup with Recovery
**What:** Before migrateKB() touches anything, create a timestamped backup of the entire KB directory. Provide a recovery script or documented recovery procedure.
**When to use:** Before any destructive KB operation (migration, schema changes).
**Example:**
```javascript
// Pre-migration backup (before any data operations)
function backupKB(kbDir) {
  if (!fs.existsSync(kbDir)) return null;

  const entries = countKBEntries(kbDir);
  if (entries === 0) return null;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupDir = kbDir + '.backup-' + timestamp;
  fs.cpSync(kbDir, backupDir, { recursive: true });

  // Verify backup integrity
  const backupEntries = countKBEntries(backupDir);
  if (backupEntries !== entries) {
    throw new Error(`Backup verification failed: ${entries} entries in source, ${backupEntries} in backup`);
  }

  console.log(`  Backed up ${entries} KB entries to ${backupDir}`);
  return backupDir;
}
```

### Pattern 3: Schema Extension with gsd_version
**What:** Add `gsd_version` as an optional field to the common base schema in knowledge-store.md. Populate it from the VERSION file or package.json at creation time.
**When to use:** Every KB entry creation (signal, spike, lesson).
**Example:**
```yaml
---
id: sig-2026-02-14-example
type: signal
project: my-project
tags: [example]
created: 2026-02-14T10:00:00Z
updated: 2026-02-14T10:00:00Z
durability: convention
status: active
severity: notable
signal_type: deviation
phase: 19
plan: 1
runtime: claude-code
model: claude-opus-4-6
gsd_version: 1.13.0
---
```

### Anti-Patterns to Avoid
- **Moving scripts out of source repo:** Keep scripts in `.claude/agents/` for source organization. The installer COPIES them to `~/.gsd/bin/`. Do not remove them from the source repo.
- **Hardcoding version strings:** Read version from VERSION file at `~/.claude/get-shit-done/VERSION` (or equivalent runtime path), not from a hardcoded string.
- **Breaking backward compatibility:** `gsd_version`, `runtime`, and `model` on spikes/lessons MUST be optional. Existing entries without these fields remain valid.
- **Deleting backup after successful migration:** Keep timestamped backups. Let users clean them up manually. Automatic deletion defeats the safety purpose.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom JS parser | Existing grep/sed pattern in kb-rebuild-index.sh | Proven pattern already used by 14 tests |
| File backup | Custom archival system | `fs.cpSync(src, dest, { recursive: true })` | Node.js built-in, handles symlinks, verified |
| Version detection | Reading package.json at build time | Read VERSION file at runtime | VERSION file is already installed per-runtime, always current |
| Path reference updating | Manual find-and-replace | Systematic grep + targeted edit | Same pattern used successfully in Phase 14 (54 references) |

**Key insight:** All four work items are small additions to existing infrastructure. No new libraries, no new patterns. The risk is in completeness (missing a reference), not in complexity.

## Common Pitfalls

### Pitfall 1: Missing Workflow References
**What goes wrong:** KB scripts are relocated to `~/.gsd/bin/` but some workflow files still reference the old `~/.claude/agents/` path.
**Why it happens:** There are 12+ references across 9 files in two directory trees (`get-shit-done/` and `.claude/`). Missing even one breaks that workflow's index rebuild.
**How to avoid:** Use grep to identify ALL references before making changes. Verify with post-change grep that zero old-path references remain.
**Warning signs:** `kb-rebuild-index.sh: No such file or directory` errors during signal/reflect/spike workflows.

**Specific files requiring path updates (from codebase analysis):**

Source files (get-shit-done/ -- these get installed):
- `get-shit-done/workflows/reflect.md` (line 350)
- `get-shit-done/workflows/signal.md` (line 207)
- `get-shit-done/workflows/health-check.md` (lines 184, 215)
- `get-shit-done/workflows/collect-signals.md` (line 173 -- uses bare name, may not need update)
- `get-shit-done/references/health-check.md` (line 328 -- uses bare name)
- `get-shit-done/references/spike-execution.md` (line 275)
- `get-shit-done/references/reflection-patterns.md` (lines 240, 579)

Agent specs (.claude/agents/ -- these also get installed):
- `.claude/agents/gsd-signal-collector.md` (line 151)
- `.claude/agents/gsd-spike-runner.md` (line 276)
- `.claude/agents/gsd-reflector.md` (line 151)

Local-install copies (.claude/get-shit-done/ -- these are the local-install versions):
- `.claude/get-shit-done/workflows/health-check.md` (lines 184, 215)
- `.claude/get-shit-done/workflows/reflect.md` (line 350)
- `.claude/get-shit-done/references/spike-execution.md` (line 275)
- `.claude/get-shit-done/references/health-check.md` (line 328)
- `.claude/get-shit-done/references/reflection-patterns.md` (lines 240, 579)
- `.claude/commands/gsd/signal.md` (line 191)

### Pitfall 2: Backup Path Collision
**What goes wrong:** Running the installer twice creates conflicting backup directories.
**Why it happens:** The existing `migrateKB()` uses a fixed name `*.migration-backup`. If run twice, the second run could overwrite the first backup.
**How to avoid:** Use timestamped backup names. The existing `*.migration-backup` is fine for migration-specific backups; the new pre-migration backup should use `*.backup-YYYY-MM-DDTHHMMSS`.
**Warning signs:** Missing backup data after a second migration attempt.

### Pitfall 3: Executable Permission Loss
**What goes wrong:** KB scripts copied to `~/.gsd/bin/` are not executable.
**Why it happens:** `fs.copyFileSync()` copies content but does not preserve Unix permissions on all platforms.
**How to avoid:** Explicitly call `fs.chmodSync(dest, 0o755)` after each copy.
**Warning signs:** `Permission denied` errors when workflows try to run `bash ~/.gsd/bin/kb-rebuild-index.sh`.

### Pitfall 4: Version Detection Complexity
**What goes wrong:** `gsd_version` field populated incorrectly because VERSION file is in different locations depending on install type (global vs local).
**Why it happens:** Global install: `~/.claude/get-shit-done/VERSION`. Local install: `./.claude/get-shit-done/VERSION`. Runtime-specific: `~/.config/opencode/get-shit-done/VERSION`, etc.
**How to avoid:** The `gsd_version` field in KB entries is populated by the LLM agent at entry-creation time, not by the shell script. The agent reads the VERSION file from the appropriate runtime-specific path (which it already knows from runtime detection). Alternatively, read from `package.json` version field or the `gsd_reflect_version` in `.planning/config.json`.
**Warning signs:** `gsd_version` showing "unknown" or wrong version across entries.

### Pitfall 5: Local Install Path Discrepancy
**What goes wrong:** For local installs, the scripts are at `.claude/agents/kb-rebuild-index.sh` (relative), but the new path `~/.gsd/bin/` is global. If a user does a local install without running the global installer, `~/.gsd/bin/` scripts won't exist.
**How to avoid:** KB scripts should ALWAYS be installed to `~/.gsd/bin/` regardless of whether the rest of the install is local or global. The `migrateKB()` function already operates on the global `~/.gsd/` directory, so `installKBScripts()` should follow the same pattern -- it runs once globally before the per-runtime loop.
**Warning signs:** Scripts exist only in project-local `.claude/agents/` but not at `~/.gsd/bin/`.

## Code Examples

### Example 1: installKBScripts() Function
```javascript
// Source: Pattern derived from existing migrateKB() in bin/install.js
function installKBScripts(gsdHome) {
  const binDir = path.join(gsdHome, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  // Scripts are in source repo at .claude/agents/
  const scriptSrc = path.join(__dirname, '..', '.claude', 'agents');
  const scripts = ['kb-rebuild-index.sh', 'kb-create-dirs.sh'];

  for (const script of scripts) {
    const src = path.join(scriptSrc, script);
    if (fs.existsSync(src)) {
      const dest = path.join(binDir, script);
      fs.copyFileSync(src, dest);
      fs.chmodSync(dest, 0o755);
    }
  }

  console.log(`  ${green}+${reset} Installed KB scripts to ${binDir}`);
}
```

### Example 2: Pre-Migration Backup in migrateKB()
```javascript
// Source: Enhancement to existing migrateKB() in bin/install.js
function migrateKB(gsdHome, runtimes) {
  const newKBDir = path.join(gsdHome, 'knowledge');

  // PRE-MIGRATION BACKUP: Back up existing new-location KB before any operations
  if (fs.existsSync(newKBDir)) {
    const existingEntries = countKBEntries(newKBDir);
    if (existingEntries > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupDir = newKBDir + '.backup-' + timestamp;
      fs.cpSync(newKBDir, backupDir, { recursive: true });

      const backupEntries = countKBEntries(backupDir);
      if (backupEntries < existingEntries) {
        console.error(`  Backup verification failed. Aborting migration.`);
        return;
      }
      console.log(`  Backed up ${existingEntries} entries to ${path.basename(backupDir)}`);
    }
  }

  // ... rest of existing migrateKB() logic unchanged ...
}
```

### Example 3: Updated Signal Template with gsd_version
```yaml
---
id: sig-{YYYY-MM-DD}-{slug}
type: signal
project: {project-name}
tags: [{tag1}, {tag2}]
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
durability: {workaround|convention|principle}
status: active
severity: {critical|notable}
signal_type: {deviation|struggle|config-mismatch|capability-gap|custom}
phase: {phase-number}
plan: {plan-number}
runtime: {claude-code|opencode|gemini-cli|codex-cli}
model: {model-identifier}
gsd_version: {version-string}
---
```

### Example 4: Updated Spike Template with Provenance Fields
```yaml
---
id: spk-{YYYY-MM-DD}-{slug}
type: spike
project: {project-name}
tags: [{tag1}, {tag2}]
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
durability: {workaround|convention|principle}
status: active
hypothesis: "{testable claim}"
outcome: {confirmed|rejected|partial|inconclusive}
rounds: {number}
runtime: {claude-code|opencode|gemini-cli|codex-cli}
model: {model-identifier}
gsd_version: {version-string}
---
```

### Example 5: Updated Lesson Template with Provenance Fields
```yaml
---
id: les-{YYYY-MM-DD}-{slug}
type: lesson
project: {project-name|_global}
tags: [{tag1}, {tag2}]
created: {YYYY-MM-DDTHH:MM:SSZ}
updated: {YYYY-MM-DDTHH:MM:SSZ}
durability: {workaround|convention|principle}
status: active
category: {architecture|workflow|tooling|testing|debugging|performance|other}
evidence_count: {number}
evidence: [{entry-id-1}, {entry-id-2}]
runtime: {claude-code|opencode|gemini-cli|codex-cli}
model: {model-identifier}
gsd_version: {version-string}
---
```

### Example 6: Version Detection in LLM Agents
```markdown
### Version Detection

Determine the GSD version for the `gsd_version` field:

1. Read the VERSION file from the current runtime's install directory:
   - ~/.claude/get-shit-done/VERSION (Claude Code)
   - ~/.config/opencode/get-shit-done/VERSION (OpenCode)
   - ~/.gemini/get-shit-done/VERSION (Gemini CLI)
   - ~/.codex/get-shit-done/VERSION (Codex CLI)
   - Or ./.claude/get-shit-done/VERSION (local install)

2. If VERSION file not found, read `gsd_reflect_version` from `.planning/config.json`.

3. If neither available, use "unknown".

Store the version string for inclusion in all KB entries created during this session.
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| KB scripts in `~/.claude/agents/` | KB scripts at `~/.gsd/bin/` | Phase 19 (this phase) | Scripts accessible from all runtimes |
| No pre-migration backup | Timestamped backup before migration | Phase 19 (this phase) | Data loss safety net |
| No version tracking in KB entries | `gsd_version` field on all entry types | Phase 19 (this phase) | Version provenance for debugging |
| Provenance only on signals | Provenance on signals, spikes, and lessons | Phase 19 (this phase) | Complete provenance across entry types |

**Deprecated/outdated:**
- `~/.claude/agents/kb-rebuild-index.sh` path: Will be replaced by `~/.gsd/bin/kb-rebuild-index.sh`
- `~/.claude/gsd-knowledge/` path: Already deprecated in Phase 14, symlinked to `~/.gsd/knowledge/`

## Open Questions

1. **Should old backup directories be automatically cleaned up?**
   - What we know: Timestamped backups will accumulate over time at `~/.gsd/knowledge.backup-*`
   - What's unclear: Whether to implement automatic cleanup (e.g., keep last 3) or leave manual
   - Recommendation: Do NOT auto-clean in this phase. Let backups accumulate. Users can manually clean. Add a note in documentation about cleanup. Auto-cleanup is a future convenience, not a safety requirement.

2. **Should the `.claude/agents/` copies of KB scripts be deleted from the source repo?**
   - What we know: After Phase 19, the installer copies scripts to `~/.gsd/bin/`. The source copies at `.claude/agents/` remain.
   - What's unclear: Whether keeping them in `agents/` causes confusion or path ambiguity
   - Recommendation: Keep scripts in `.claude/agents/` in the source repo for now. They are the source of truth that the installer copies from. Moving them to a different source location (e.g., `scripts/kb/`) would be a separate refactor. The key change is that WORKFLOWS reference `~/.gsd/bin/` not `~/.claude/agents/`.

3. **How should version detection work for entries created from non-installed contexts?**
   - What we know: During development (no install), VERSION file may not exist at the runtime path
   - What's unclear: Whether to fall back to `package.json` version or `config.json` gsd_reflect_version
   - Recommendation: Fall back chain: VERSION file -> config.json gsd_reflect_version -> "unknown". The LLM agent populating the field can use best judgment.

## Sources

### Primary (HIGH confidence)
- **Source code analysis** -- `bin/install.js` migrateKB() function (lines 233-294), installAllRuntimes() (lines 2154-2164)
- **Source code analysis** -- `.claude/agents/kb-rebuild-index.sh` (167 lines, full script read)
- **Source code analysis** -- `.claude/agents/kb-create-dirs.sh` (15 lines, full script read)
- **Source code analysis** -- `tests/integration/kb-infrastructure.test.js` (336 lines, 14 tests)
- **Source code analysis** -- All 5 KB templates in `.claude/agents/kb-templates/`
- **Source code analysis** -- `knowledge-store.md` agent spec (356 lines)

### Secondary (MEDIUM confidence)
- **KB signals** -- sig-2026-02-11-kb-data-loss-migration-gap (critical, directly describes the data loss incident)
- **KB signals** -- sig-2026-02-11-kb-script-wrong-location-and-path (critical, documents the three problems with script location)
- **KB signals** -- sig-2026-02-11-local-install-global-kb-model (critical, documents the local vs global install tension)
- **Planning docs** -- `.planning/phases/17-validation-release/.continue-here.md` (combined gap list with Gaps 5-6, 13-14)

### Tertiary (LOW confidence)
- None. All findings are based on direct source code analysis and KB signals from the same project.

## Knowledge Applied

| Entry | Type | Summary | Applied To |
|-------|------|---------|------------|
| sig-2026-02-11-kb-data-loss-migration-gap | signal | 13 signals + 3 lessons lost due to migration-only-in-installer with no backup | Architecture Patterns (backup), Common Pitfalls |
| sig-2026-02-11-kb-script-wrong-location-and-path | signal | Scripts in wrong directory, path breaks for non-Claude runtimes | Architecture Patterns (script relocation), Pitfall 1 |
| sig-2026-02-11-local-install-global-kb-model | signal | Local install + global KB creates path resolution issues | Common Pitfalls (Pitfall 5) |

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No external dependencies, all existing tools
- Architecture: HIGH - Direct source code analysis, clear gap definitions
- Pitfalls: HIGH - Informed by actual data loss incident and KB signals
- Code examples: HIGH - Based on existing codebase patterns

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (stable domain, no external dependencies)
