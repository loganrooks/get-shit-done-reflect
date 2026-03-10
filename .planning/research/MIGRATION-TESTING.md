# Migration Testing Patterns for Upstream Sync

**Domain:** Config migration, file restructuring, namespace rewriting, KB data migration
**Researched:** 2026-03-10
**Overall confidence:** HIGH (grounded in current codebase analysis + established testing literature)

---

## Executive Summary

GSD Reflect has three distinct migration systems that need thorough testing for the v1.18 upstream sync: (1) **manifest-driven config migration** (schema evolution for `.planning/config.json`), (2) **KB data migration** (file copy + symlink bridge from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/`), and (3) **namespace rewriting** (4-pass regex transformation of `gsd` -> `gsdr` during install). Additionally, the v1.18 milestone introduces (4) **monolith-to-module redistribution** of 2,126 lines from `gsd-tools.js` into 5 new CJS modules plus 3 module extensions.

The current test suite (278 tests) covers these systems unevenly. Config migration has 10 tests for `apply-migration` but no tests for interrupted/partial migration or multi-version upgrade chains. KB migration has strong idempotency and data-loss tests but no tests for corrupted state recovery or concurrent migration. Namespace rewriting has excellent false-positive protection (15+ tests) but no end-to-end content integrity tests across the full file corpus. The module redistribution has zero tests since it is forthcoming work.

This document catalogs specific test patterns, concrete test cases, and a coverage matrix tailored to these four systems.

---

## Table of Contents

1. [Current Coverage Audit](#1-current-coverage-audit)
2. [Config Migration Testing](#2-config-migration-testing)
3. [KB Data Migration Testing](#3-kb-data-migration-testing)
4. [Namespace Rewriting Testing](#4-namespace-rewriting-testing)
5. [Module Redistribution Testing](#5-module-redistribution-testing)
6. [Cross-Cutting Test Patterns](#6-cross-cutting-test-patterns)
7. [Recommended Test Matrix](#7-recommended-test-matrix)
8. [Anti-Patterns to Avoid](#8-anti-patterns-to-avoid)
9. [Sources](#9-sources)

---

## 1. Current Coverage Audit

### What Exists

| Migration System | Test File(s) | Test Count | Patterns Used |
|------------------|-------------|------------|---------------|
| Config migration (`apply-migration`) | `gsd-tools.test.js` | ~10 | Happy path, field addition, type coercion, version bump, preserves-existing |
| Config migration (`log-migration`) | `gsd-tools.test.js` | ~4 | Create new log, append, JSON formatting |
| Config migration (`diff-config`, `validate`) | `gsd-tools.test.js` | ~15 | Missing fields, type mismatches, enum violations |
| KB migration (`migrateKB`) | `install.test.js` | ~8 | Fresh install, data copy, symlink creation, idempotency, backup verification |
| KB migration (pre-migration backup) | `kb-infrastructure.test.js` | ~4 | Timestamped backup, entry preservation, skip-when-empty |
| KB scripts | `kb-infrastructure.test.js` | ~12 | Create dirs, rebuild index, idempotency, atomic writes |
| Cross-runtime KB | `cross-runtime-kb.test.js` | ~8 | Shared path, symlink access, format compat, multi-runtime coexistence |
| Namespace rewriting | `install.test.js` | ~30 | 4-pass rewrites, false-positive protection, double-replacement safety, cross-runtime composition |
| Full installer | `install.test.js` | ~15 | Flag combinations, runtime installs, path preservation |
| Module redistribution | (none) | 0 | N/A |

### Critical Gaps

1. **No multi-version upgrade chain tests** -- `apply-migration` is tested for v0->v1 but not v0->v1->v2 or skip-version scenarios
2. **No interrupted migration tests** -- What if the process dies between writing config and writing the migration log?
3. **No config corruption recovery** -- What if `config.json` contains invalid JSON after a crash?
4. **No concurrent migration tests** -- Two sessions running `apply-migration` simultaneously
5. **No KB migration with nested subdirectories** -- Real KB has `signals/project-name/` nesting
6. **No symlink-points-to-wrong-target test** -- What if symlink exists but points to deleted directory?
7. **No full-corpus namespace integrity test** -- Tests verify individual patterns but not that ALL installed files are clean
8. **No behavioral equivalence tests for module redistribution** -- The monolith-to-modules split needs functional parity validation
9. **No property-based tests for namespace rewriting** -- Regex edge cases are hard to enumerate exhaustively

---

## 2. Config Migration Testing

### 2.1 Schema Evolution Tests

The manifest system uses an additive-only schema (never remove fields, never change field semantics). This constrains the problem space but still requires testing:

**Multi-version upgrade chains:**
```javascript
// Test: v0 config -> v1 manifest -> v2 manifest applied sequentially
describe('multi-version upgrade chain', () => {
  it('upgrades v0 config through v1 and v2 manifest versions', () => {
    // Start with minimal v0 config
    const v0Config = { mode: 'yolo', manifest_version: 0 }

    // Apply v1 manifest (adds health_check, devops)
    applyMigration(v1Manifest, v0Config)
    // Verify v1 fields present

    // Apply v2 manifest (adds automation, signal_lifecycle)
    applyMigration(v2Manifest, resultConfig)
    // Verify ALL fields from both v1 and v2 present
    // Verify v1 fields NOT overwritten with defaults
  })
})
```

**Skip-version upgrade:**
```javascript
// Test: user at manifest_version 0 installs version that has manifest_version 2
it('handles skip-version upgrade (v0 directly to v2)', () => {
  const ancientConfig = { mode: 'yolo', manifest_version: 0 }
  applyMigration(v2Manifest, ancientConfig)
  // All features from v1 AND v2 should be populated with defaults
})
```

**Unknown fields preserved:**
```javascript
// Test: config has fields not in manifest (user customization or future fields)
it('preserves unknown config fields not in manifest', () => {
  const config = {
    manifest_version: 1,
    health_check: { frequency: 'every-phase', custom_plugin: 'my-checker' },
    my_custom_section: { enabled: true }
  }
  applyMigration(manifest, config)
  expect(config.health_check.custom_plugin).toBe('my-checker')
  expect(config.my_custom_section).toEqual({ enabled: true })
})
```

### 2.2 Backward Compatibility Tests

**Old config with new manifest:**
```javascript
describe('backward compatibility', () => {
  it('v1.12 config works with v1.17 manifest (only health_check, devops)', () => {
    const oldConfig = {
      manifest_version: 1,
      health_check: { frequency: 'milestone-only', stale_threshold_days: 7, blocking_checks: false },
      devops: { ci_provider: 'github-actions' }
    }
    const result = applyMigration(currentManifest, oldConfig)
    // New features added with defaults
    expect(result.config.automation).toBeDefined()
    expect(result.config.signal_lifecycle).toBeDefined()
    // Old values untouched
    expect(result.config.devops.ci_provider).toBe('github-actions')
  })
})
```

### 2.3 Idempotency Tests

The current test for "no changes when config is complete" covers basic idempotency. Additional cases needed:

```javascript
describe('idempotency', () => {
  it('apply-migration twice produces identical config', () => {
    const config = minimalConfig()
    applyMigration(manifest, config)
    const afterFirst = JSON.parse(JSON.stringify(config))

    applyMigration(manifest, config)
    const afterSecond = JSON.parse(JSON.stringify(config))

    expect(afterSecond).toEqual(afterFirst)
  })

  it('apply-migration on already-complete config reports zero changes', () => {
    const completeConfig = buildCompleteConfig(manifest)
    const result = applyMigration(manifest, completeConfig)
    expect(result.total_changes).toBe(0)
  })

  it('migration log is append-only (re-run does not duplicate entries)', () => {
    logMigration('1.12.0', '1.15.0', changes)
    logMigration('1.12.0', '1.15.0', changes) // Same migration again
    const log = readMigrationLog()
    // Should have 2 entries (both logged) -- log is append-only, not deduped
    // But verify format is still valid
    expect(log).toMatch(/^# Migration Log/)
  })
})
```

### 2.4 Partial Migration / Crash Recovery

This is the most important gap. The `apply-migration` command uses `atomicWriteJson()` (write to .tmp then rename), which provides crash safety for the config write itself. But the log write is separate:

```javascript
describe('crash recovery', () => {
  it('config.json is valid JSON even if migration log write fails', () => {
    // Mock fs to fail on migration-log.md write
    // Run apply-migration
    // Verify config.json was written correctly
    // Verify config.json contains the migrated fields
  })

  it('recovers from corrupted config.json (invalid JSON)', () => {
    writeFile(configPath, '{ broken json !!!!')
    // apply-migration should either:
    // a) Report error clearly and not corrupt further, or
    // b) Use backup to recover
    const result = runGsdTools('manifest apply-migration --raw', tmpDir)
    expect(result.success).toBe(false)
    expect(result.error).toContain('parse') // Should mention JSON parse error
  })

  it('atomic write leaves no .tmp residue on success', () => {
    // Already tested -- but verify across all migration paths
    applyMigration(manifest, config)
    const tmpFiles = readdirSync(planningDir).filter(f => f.endsWith('.tmp'))
    expect(tmpFiles).toHaveLength(0)
  })

  it('atomic write leaves no .tmp residue on failure', () => {
    // Mock rename to fail
    // Verify .tmp is cleaned up
  })
})
```

### 2.5 Type Coercion Edge Cases

The manifest system coerces `"true"` -> `true` and `"7"` -> `7`. Test edge cases:

```javascript
describe('type coercion edge cases', () => {
  it('coerces "false" string to boolean false', () => { /* ... */ })
  it('coerces "0" string to number 0 (not boolean false)', () => { /* ... */ })
  it('does NOT coerce "yes" to boolean true (not a valid boolean string)', () => { /* ... */ })
  it('does NOT coerce "7.5" to integer when schema expects integer', () => { /* ... */ })
  it('preserves null values (does not coerce to string "null")', () => { /* ... */ })
  it('handles empty string field (does not coerce to 0 or false)', () => { /* ... */ })
  it('handles array fields (does not attempt to coerce)', () => { /* ... */ })
  it('handles nested object fields (does not flatten)', () => { /* ... */ })
})
```

---

## 3. KB Data Migration Testing

### 3.1 Data Integrity Tests

The migrateKB() function copies files from `~/.claude/gsd-knowledge/` to `~/.gsd/knowledge/`, creates a backup, and sets up a symlink. Current tests verify entry count and content. Additional tests needed:

**Nested directory structure preservation:**
```javascript
describe('data integrity', () => {
  it('preserves nested project directories (signals/project-name/file.md)', () => {
    // Real KB has: signals/get-shit-done-reflect/SIG-260222-005-*.md
    setupOldKB({
      'signals/project-a/sig-001.md': 'content-a1',
      'signals/project-a/sig-002.md': 'content-a2',
      'signals/project-b/sig-001.md': 'content-b1',
      'spikes/project-a/spk-001.md': 'content-spk',
      'lessons/category-1/les-001.md': 'content-les',
    })
    migrateKB(gsdHome)
    // Verify all paths preserved including intermediate directories
    expect(readFile(newKB('signals/project-a/sig-001.md'))).toBe('content-a1')
    expect(readFile(newKB('signals/project-b/sig-001.md'))).toBe('content-b1')
    expect(readFile(newKB('lessons/category-1/les-001.md'))).toBe('content-les')
  })

  it('preserves file permissions during migration', () => {
    setupOldKB({ 'signals/sig-001.md': 'content' })
    chmodSync(oldKBPath('signals/sig-001.md'), 0o644)
    migrateKB(gsdHome)
    const mode = statSync(newKB('signals/sig-001.md')).mode
    expect(mode & 0o777).toBe(0o644)
  })

  it('preserves YAML frontmatter integrity (no content transformation)', () => {
    const content = `---
id: sig-2026-01-15-test
type: signal
tags: [testing, "special chars: colons"]
created: 2026-01-15T10:00:00Z
evidence: |
  Multi-line
  evidence block
---

## What Happened

Content with special chars: \`backticks\`, *asterisks*, [brackets]
`
    setupOldKB({ 'signals/test-project/complex.md': content })
    migrateKB(gsdHome)
    expect(readFile(newKB('signals/test-project/complex.md'))).toBe(content)
  })
})
```

**Entry count verification (before vs after):**
```javascript
it('source entry count equals destination entry count after migration', () => {
  const sourceCount = countKBEntries(oldKBDir)
  migrateKB(gsdHome)
  const destCount = countKBEntries(newKBDir)
  expect(destCount).toBe(sourceCount)
})
```

### 3.2 Symlink Edge Cases

```javascript
describe('symlink edge cases', () => {
  it('replaces broken symlink pointing to deleted directory', () => {
    // Symlink exists but target was deleted
    mkdirSync(path.join(tmpdir, '.claude'), { recursive: true })
    symlinkSync('/nonexistent/path', oldKBDir)

    migrateKB(gsdHome, ['claude'])

    // Symlink should now point to correct location
    expect(readlinkSync(oldKBDir)).toBe(path.join(gsdHome, 'knowledge'))
    expect(existsSync(path.join(gsdHome, 'knowledge', 'signals'))).toBe(true)
  })

  it('replaces regular directory with symlink when data already migrated', () => {
    // Old KB dir is a real directory (not symlink) but new KB already has data
    // This simulates: user ran migration, then something recreated the old dir
    setupNewKB({ 'signals/sig-001.md': 'migrated' })
    mkdirSync(path.join(oldKBDir, 'signals'), { recursive: true })
    // Old dir is empty (data already migrated)

    migrateKB(gsdHome, ['claude'])

    expect(lstatSync(oldKBDir).isSymbolicLink()).toBe(true)
  })

  it('handles symlink when .claude directory does not exist', () => {
    // Fresh system, no .claude/ directory at all
    migrateKB(gsdHome, ['claude'])

    // Should create .claude/ and symlink within it
    expect(existsSync(path.join(tmpdir, '.claude', 'gsd-knowledge'))).toBe(true)
  })
})
```

### 3.3 Backup Verification

```javascript
describe('backup integrity', () => {
  it('backup has identical content to source (byte-for-byte)', () => {
    const entries = {
      'signals/p1/sig-001.md': 'content with\nlines\n',
      'spikes/p1/spk-001.md': 'spike\n',
    }
    setupOldKB(entries)
    migrateKB(gsdHome, [])

    // Find backup directory
    const backups = readdirSync(gsdHome).filter(e => e.startsWith('knowledge.backup-'))
    expect(backups).toHaveLength(1)

    // Compare every file
    for (const [relPath, expectedContent] of Object.entries(entries)) {
      const backupContent = readFileSync(path.join(gsdHome, backups[0], relPath), 'utf8')
      expect(backupContent).toBe(expectedContent)
    }
  })

  it('backup timestamp is within 1 second of migration time', () => {
    const before = Date.now()
    setupOldKB({ 'signals/sig.md': 'x' })
    migrateKB(gsdHome, [])
    const after = Date.now()

    const backups = readdirSync(gsdHome).filter(e => e.startsWith('knowledge.backup-'))
    const timestamp = backups[0].replace('knowledge.backup-', '')
    const backupTime = new Date(timestamp).getTime()

    expect(backupTime).toBeGreaterThanOrEqual(before - 1000)
    expect(backupTime).toBeLessThanOrEqual(after + 1000)
  })
})
```

---

## 4. Namespace Rewriting Testing

### 4.1 Current Strength

The existing tests are strong for `replacePathsInContent()` unit testing. They cover:
- All 4 passes (3a: directory, 3b: command prefix, 3c: agent prefix, 3d: banner)
- False-positive protection (gsd-tools exemption, underscore names, prose text)
- Double-replacement safety (gsdr- does not become gsdrr-)
- Cross-runtime composition (OpenCode, Gemini, local prefixes)
- Realistic multi-pattern content

### 4.2 Missing: Full Corpus Integrity Tests

The unit tests verify individual regex patterns. What is missing is a test that runs the full installer and then verifies EVERY installed file has no stale namespace references:

```javascript
describe('full corpus namespace integrity', () => {
  tmpdirTest('no installed file contains stale /gsd: command prefix', async ({ tmpdir }) => {
    execSync(`node "${installScript}" --claude --global`, {
      env: { ...process.env, HOME: tmpdir },
      cwd: tmpdir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 15000
    })

    const allFiles = await readdir(
      path.join(tmpdir, '.claude'),
      { recursive: true }
    )
    const textFiles = allFiles.filter(f =>
      f.endsWith('.md') || f.endsWith('.js') || f.endsWith('.toml')
    )

    const violations = []
    for (const file of textFiles) {
      const filePath = path.join(tmpdir, '.claude', file)
      const stat = await fsStat(filePath)
      if (!stat.isFile()) continue

      const content = await readFile(filePath, 'utf8')

      // Check for stale /gsd: (but not /gsdr:)
      const staleCommands = content.match(/\/gsd:(?!r)/g)
      if (staleCommands) {
        violations.push({ file, pattern: '/gsd:', count: staleCommands.length })
      }

      // Check for stale gsd- agent names (but not gsdr- or gsd-tools)
      const staleAgents = content.match(/\bgsd-(?!tools|reflect|knowledge)(?!r)\w+/g)
      if (staleAgents) {
        violations.push({ file, pattern: 'gsd-*', matches: staleAgents })
      }

      // Check for stale get-shit-done/ (but not get-shit-done-reflect/)
      const staleDirs = content.match(/get-shit-done\/(?!reflect)/g)
      if (staleDirs) {
        violations.push({ file, pattern: 'get-shit-done/', count: staleDirs.length })
      }
    }

    expect(violations, `Stale namespace references found:\n${JSON.stringify(violations, null, 2)}`).toHaveLength(0)
  })
})
```

### 4.3 Missing: Snapshot-Based Regression Testing

Use Vitest's `toMatchFileSnapshot()` to catch unexpected namespace changes:

```javascript
describe('namespace rewriting regression', () => {
  // Golden file approach: snapshot the output of key files after install
  tmpdirTest('agent-protocol.md after install matches snapshot', async ({ tmpdir }) => {
    execSync(`node "${installScript}" --claude --global`, { ... })

    const content = await readFile(
      path.join(tmpdir, '.claude', 'get-shit-done-reflect', 'references', 'agent-protocol.md'),
      'utf8'
    )

    // Vitest file snapshot -- stored in __snapshots__/
    await expect(content).toMatchFileSnapshot(
      '__snapshots__/installed-agent-protocol.md'
    )
  })

  // Repeat for other high-value files:
  // - execute-phase.md (workflow with most command references)
  // - reflect.md (workflow with KB paths)
  // - feature-manifest.json (config paths)
})
```

This catches regressions where a source file change introduces a new `gsd-` reference that the rewriter misses or over-rewrites.

### 4.4 Missing: Property-Based Testing for Regex Safety

Use `@fast-check/vitest` to fuzz the namespace rewriter with arbitrary content:

```javascript
import { test } from '@fast-check/vitest'
import fc from 'fast-check'

describe('namespace rewriting properties', () => {
  test.prop([fc.string()])('never produces double-reflect', (input) => {
    const result = replacePathsInContent(input, '~/.claude/')
    expect(result).not.toContain('reflect-reflect')
  })

  test.prop([fc.string()])('never produces gsdrr-', (input) => {
    const result = replacePathsInContent(input, '~/.claude/')
    expect(result).not.toContain('gsdrr-')
  })

  test.prop([fc.string()])('never corrupts gsd-tools', (input) => {
    // If input contains gsd-tools, output must also contain gsd-tools
    if (input.includes('gsd-tools')) {
      const result = replacePathsInContent(input, '~/.claude/')
      expect(result).toContain('gsd-tools')
    }
  })

  test.prop([fc.string()])('output is idempotent (applying twice = applying once)', (input) => {
    const once = replacePathsInContent(input, '~/.claude/')
    const twice = replacePathsInContent(once, '~/.claude/')
    expect(twice).toBe(once)
  })
})
```

The idempotency property is particularly valuable -- it catches cases where first-pass output matches a second-pass regex.

---

## 5. Module Redistribution Testing

### 5.1 Behavioral Equivalence (Strangler Fig Pattern)

When extracting functions from the monolith (`gsd-tools.js`) into modules (`lib/backlog.cjs`, `lib/manifest.cjs`, etc.), the critical property is **behavioral equivalence**: the new module must produce identical output for identical input.

**Test pattern: Parallel execution comparison**
```javascript
describe('module extraction equivalence', () => {
  // For each extracted function, test that:
  // 1. The new module version produces the same output as the monolith version
  // 2. Side effects (file writes) are identical

  it('backlog.cmdBacklogAdd produces same output as monolith version', () => {
    const tmpDir = createTempProject()

    // Run via monolith (current)
    const monolithResult = runGsdTools('backlog add --title "Test" --priority high --raw', tmpDir)

    // Run via extracted module (new)
    const moduleResult = runModuleFunction('backlog', 'cmdBacklogAdd', tmpDir, {
      title: 'Test', priority: 'high'
    })

    // Compare structured output (ignore timestamps)
    expect(normalizeOutput(moduleResult)).toEqual(normalizeOutput(monolithResult))
  })
})
```

### 5.2 Import/Export Contract Tests

```javascript
describe('module contracts', () => {
  // Verify each new module exports exactly the expected functions
  it('backlog.cjs exports all 7 command functions', () => {
    const backlog = require('../../get-shit-done/bin/lib/backlog.cjs')
    expect(typeof backlog.cmdBacklogAdd).toBe('function')
    expect(typeof backlog.cmdBacklogList).toBe('function')
    expect(typeof backlog.cmdBacklogUpdate).toBe('function')
    expect(typeof backlog.cmdBacklogStats).toBe('function')
    expect(typeof backlog.cmdBacklogGroup).toBe('function')
    expect(typeof backlog.cmdBacklogPromote).toBe('function')
    expect(typeof backlog.cmdBacklogIndex).toBe('function')
  })

  // Verify dispatcher wiring
  it('dispatcher routes backlog commands to backlog module', () => {
    const result = runGsdTools('backlog list --raw', tmpDir)
    expect(result.success).toBe(true) // Reaches the module, not "unknown command"
  })
})
```

### 5.3 No-Regression Test Suite

The existing 278 tests serve as the regression baseline. The key discipline:

1. **Run full test suite BEFORE extraction** -- capture green baseline
2. **Extract one module at a time** -- each extraction is independently verifiable
3. **Run full test suite AFTER each extraction** -- any regression is attributable to the just-extracted module
4. **Add module-specific tests** -- cover internal helpers not exposed through CLI

Follow the suggested migration order from the module mapping audit:
1. `sensors.cjs` + `backlog.cjs` (no deps)
2. `manifest.cjs` + `core.cjs` extensions (config deps)
3. `health-probe.cjs` + signal helpers
4. `automation.cjs` + regime tracking
5. Dispatcher update + test migration

---

## 6. Cross-Cutting Test Patterns

### 6.1 The Idempotency Pattern

**Rule: Every migration operation must be safe to run N times.**

For each migration function, create a dedicated `is idempotent` test:

```javascript
it('is idempotent (running N times produces same result as once)', () => {
  const initialState = captureState()

  runMigration()
  const afterFirst = captureState()

  runMigration()
  const afterSecond = captureState()

  expect(afterSecond).toEqual(afterFirst)
})
```

Current coverage: KB scripts (kb-create-dirs), installKBScripts, createProjectLocalKB, migrateKB (existing symlink) all have idempotency tests. Missing: `apply-migration` explicit N-times test, full installer re-run test.

### 6.2 The Before/After Invariant Pattern

**Rule: Assert properties that must hold before AND after migration.**

```javascript
describe('before/after invariants', () => {
  it('total KB entry count is preserved across migration', () => {
    const beforeCount = countKBEntries(sourceDir)
    migrateKB(gsdHome)
    const afterCount = countKBEntries(destDir)
    expect(afterCount).toBe(beforeCount)
  })

  it('total config keys are non-decreasing across migration', () => {
    const beforeKeys = Object.keys(readConfig()).length
    applyMigration(manifest, config)
    const afterKeys = Object.keys(readConfig()).length
    expect(afterKeys).toBeGreaterThanOrEqual(beforeKeys)
  })

  it('no config field changes value during migration (only additions)', () => {
    const before = JSON.parse(JSON.stringify(readConfig()))
    applyMigration(manifest, config)
    const after = readConfig()

    for (const [key, value] of Object.entries(before)) {
      if (key === 'manifest_version') continue // Expected to change
      if (typeof value === 'object') {
        for (const [subKey, subValue] of Object.entries(value)) {
          expect(after[key][subKey], `${key}.${subKey} changed`).toEqual(subValue)
        }
      }
    }
  })
})
```

### 6.3 The Golden File / Snapshot Pattern

Use Vitest's snapshot testing for config migration output. Store expected config states as golden files:

```javascript
describe('config migration golden files', () => {
  it('v0 config + current manifest = expected golden output', () => {
    const v0Config = { mode: 'yolo', manifest_version: 0 }
    applyMigration(currentManifest, v0Config)
    expect(v0Config).toMatchSnapshot()
  })

  it('v1.12 config + current manifest = expected golden output', () => {
    const v112Config = buildV112Config()
    applyMigration(currentManifest, v112Config)
    expect(v112Config).toMatchSnapshot()
  })
})
```

Snapshots catch unintentional manifest changes. When a developer adds a new feature to the manifest, the snapshot test fails, forcing them to review the migration output.

### 6.4 The Fixture Matrix Pattern

For testing across multiple starting states, use parameterized tests:

```javascript
describe.each([
  ['fresh install (no KB)', {}, []],
  ['old KB with signals only', { 'signals/p/s.md': 'x' }, []],
  ['old KB with all types', { 'signals/p/s.md': 'x', 'spikes/p/k.md': 'y', 'lessons/c/l.md': 'z' }, []],
  ['old KB with nested dirs', { 'signals/p1/s1.md': 'a', 'signals/p2/s2.md': 'b' }, []],
  ['already migrated (symlink exists)', {}, ['pre-migrated']],
])('migrateKB from state: %s', (name, files, flags) => {
  it('completes without error', () => { /* ... */ })
  it('produces valid KB structure', () => { /* ... */ })
  it('is idempotent', () => { /* ... */ })
})
```

### 6.5 Error Injection Pattern

Simulate filesystem errors to test resilience:

```javascript
describe('filesystem error handling', () => {
  it('reports EACCES when config.json is read-only', () => {
    writeConfig(config)
    chmodSync(configPath, 0o444)
    const result = applyMigration(manifest, config)
    // Should fail gracefully with actionable error
    expect(result.error).toContain('permission')
  })

  it('reports ENOSPC when disk is full during atomic write', () => {
    // Mock fs.renameSync to throw ENOSPC
    // Verify .tmp file is cleaned up
    // Verify original config.json is untouched
  })

  it('safeFs wrapper provides actionable hints for common errors', () => {
    // Already tested in install.test.js but verify for migration-specific paths
    const result = safeFs('writeFileSync', () => {
      throw Object.assign(new Error('EACCES'), { code: 'EACCES' })
    }, '/path/to/config.json')
    // Should throw with enhanced message including hint
  })
})
```

---

## 7. Recommended Test Matrix

### Priority 1: Ship-Blockers (must have before v1.18)

| Test Category | Specific Test | Effort | Why Critical |
|---------------|--------------|--------|--------------|
| Config: multi-version | v0 -> current manifest upgrade | 1h | Users upgrading from v1.12 |
| Config: unknown fields | Preserves user-added config fields | 30m | Data loss if custom config removed |
| Config: idempotency | N-times produces same result | 30m | Re-running install is common |
| KB: nested directories | Preserves signals/project-name/ nesting | 1h | Real KB structure has nesting |
| KB: broken symlink | Handles symlink to deleted target | 30m | Common after manual cleanup |
| Namespace: full corpus | Zero stale references in installed files | 2h | Stale gsd: in installed files breaks commands |
| Module: behavioral equiv | Each extracted function matches monolith output | 4h | Core correctness of modularization |
| Module: dispatcher wiring | All 5 new commands route correctly | 1h | Commands must be reachable |

### Priority 2: Robustness (should have)

| Test Category | Specific Test | Effort | Why Important |
|---------------|--------------|--------|---------------|
| Config: crash recovery | Invalid JSON config.json handled | 1h | Corrupted state after crash |
| Config: type coercion edges | "0", "false", null, empty string | 1h | Subtle data loss |
| KB: content integrity | YAML frontmatter preserved byte-for-byte | 1h | Special chars in evidence fields |
| KB: backup byte-parity | Backup content matches source | 30m | Backup useless if corrupted |
| Namespace: snapshot regression | Key files match golden snapshots | 2h | Catches regression from source changes |
| Namespace: idempotency | Applying rewriter twice = once | 30m | Catches double-replacement bugs |

### Priority 3: Thoroughness (nice to have)

| Test Category | Specific Test | Effort | Why Useful |
|---------------|--------------|--------|------------|
| Config: concurrent access | Two simultaneous apply-migrations | 2h | Race condition prevention |
| KB: large corpus | 100+ entries migration performance | 1h | Performance regression detection |
| Namespace: property-based | fast-check fuzzing of rewriter | 2h | Catches unforeseen regex edge cases |
| Module: helper internals | Unit tests for extracted helper functions | 3h | Catch extraction copy errors |
| Cross-cutting: fixture matrix | Parameterized across all starting states | 2h | Combinatorial coverage |

### Estimated Total Effort

| Priority | Tests | Effort |
|----------|-------|--------|
| P1 (ship-blockers) | ~8 test groups | ~10h |
| P2 (robustness) | ~6 test groups | ~7h |
| P3 (thoroughness) | ~5 test groups | ~10h |
| **Total** | **~19 test groups** | **~27h** |

Recommendation: P1 is mandatory for v1.18. P2 should be completed within the milestone. P3 can be deferred to subsequent milestones.

---

## 8. Anti-Patterns to Avoid

### Anti-Pattern 1: Testing the Migration Log Instead of the Migration
**What goes wrong:** Tests verify `migration-log.md` content but not that config.json was actually modified.
**Why it happens:** Log testing is easy; config state testing requires setup/teardown.
**Detection:** If a test suite passes but migration is broken, logs are being tested instead of state.
**Prevention:** Always assert on the actual migrated state (config.json content, KB file content), not on logging artifacts.

### Anti-Pattern 2: Snapshot Over-Reliance
**What goes wrong:** Snapshots become rubber-stamped. Developer updates snapshot without reviewing diff.
**Why it happens:** Snapshot diffs are long and tedious to review.
**Detection:** Snapshot update commits with no explanation in commit message.
**Prevention:** Use snapshots for regression detection, not as primary correctness tests. Primary tests should be explicit assertions on specific fields/values. Snapshots catch unintentional changes.

### Anti-Pattern 3: Testing Only Happy Path Idempotency
**What goes wrong:** Idempotency tested only for "already complete" state. Partial states not tested.
**Why it happens:** "Already complete" is the easiest fixture to build.
**Detection:** Migration fails when run on partially-migrated state (e.g., config has some new fields but not all).
**Prevention:** Test idempotency from multiple starting states: empty, partial, complete, over-complete (extra fields).

### Anti-Pattern 4: Regex Tests Without Corpus Validation
**What goes wrong:** All unit regex tests pass, but installed files contain stale references.
**Why it happens:** Unit tests test the function in isolation. But the function is called with file content that may contain patterns the unit tests didn't anticipate.
**Detection:** User reports `/gsd:` commands not found (because file has stale `/gsd:` that should be `/gsdr:`).
**Prevention:** Always pair regex unit tests with full-corpus integration tests that scan every installed file.

### Anti-Pattern 5: Testing Migration Without Testing Rollback Awareness
**What goes wrong:** Migration succeeds but if something goes wrong afterward, there's no way to recover.
**Why it happens:** GSD Reflect's design decision is "migrations always additive" and "no rollback scripts" (per PROJECT.md out-of-scope).
**Detection:** Not applicable as a bug -- but test that backups exist and are usable.
**Prevention:** Even without automated rollback, test that: (a) backups are created, (b) backups are complete, (c) documentation explains manual recovery.

### Anti-Pattern 6: Mocking the Filesystem in Integration Tests
**What goes wrong:** Tests pass with mocked fs but fail with real filesystem (permissions, symlinks, atomic rename semantics).
**Why it happens:** Mocking is faster and avoids cleanup.
**Detection:** Tests pass in CI but migration fails on user machines.
**Prevention:** Use real tmpdir-based tests (the `tmpdirTest` helper already does this). Reserve mocking for error injection only (simulating EACCES, ENOSPC).

---

## 9. Sources

### Migration Testing General
- [Defacto: How we make database schema migrations safe and robust](https://www.getdefacto.com/article/database-schema-migrations) -- idempotency and safe migration patterns
- [QASource: Data Migration Testing in 2026](https://blog.qasource.com/a-guide-to-data-migration-testing) -- testing strategy and techniques
- [BrowserStack: Complete Guide to Data Migration Testing](https://www.browserstack.com/guide/data-migration-testing-guide) -- edge case testing strategies
- [Datalark: Data Migration Testing Guide](https://datalark.com/blog/data-migration-testing-guide) -- data integrity verification patterns
- [DQOps: How to Perform Data Migration Testing](https://dqops.com/data-migration-testing-definition-examples/) -- count verification, checksum comparison

### Monolith to Module Restructuring
- [Monolith to Modular Monolith to Microservices (DEV Community)](https://dev.to/sepehr/from-monolith-to-modular-monolith-to-microservices-realistic-migration-patterns-36f2) -- strangler fig pattern, parallel run validation
- [JetBrains: Migrating to Modular Monolith](https://blog.jetbrains.com/idea/2026/02/migrating-to-modular-monolith-using-spring-modulith-and-intellij-idea/) -- modular restructuring testing

### Property-Based Testing
- [fast-check: Property based testing for JavaScript](https://github.com/dubzzz/fast-check) -- the recommended library for JS/TS
- [@fast-check/vitest (npm)](https://www.npmjs.com/package/@fast-check/vitest) -- Vitest integration for property-based testing
- [Beyond Flaky Tests: Controlled Randomness in Vitest](https://fast-check.dev/blog/2025/03/28/beyond-flaky-tests-bringing-controlled-randomness-to-vitest/) -- practical integration patterns

### Snapshot/Golden File Testing
- [Vitest Snapshot Guide](https://vitest.dev/guide/snapshot) -- `toMatchSnapshot()` and `toMatchFileSnapshot()`
- [Snapshot Benchmarking with Vitest](https://www.thecandidstartup.org/2025/08/25/snapshot-benchmarking.html) -- snapshot testing best practices

### Regex Testing
- [InfiniteJS: Navigating Edge Cases in Node.js Regex](https://infinitejs.com/posts/navigating-edge-cases-nodejs-regex-pitfalls/) -- common regex pitfalls
- [InfiniteJS: Avoiding Edge Cases in Node.js Regex Challenges](https://infinitejs.com/posts/avoiding-edge-cases-nodejs-regex-challenges/) -- false positive/negative prevention

---

## Appendix: Test Helper Recommendations

### Recommended New Test Helpers

```javascript
// tests/helpers/migration-fixtures.js

/**
 * Build a config.json at a specific "era" of GSD Reflect
 */
export function buildConfigForVersion(version) {
  const configs = {
    '1.12.0': { mode: 'yolo', manifest_version: 0 },
    '1.14.0': { mode: 'yolo', manifest_version: 0, health_check: { frequency: 'milestone-only' } },
    '1.15.0': { manifest_version: 1, health_check: { /* full */ }, devops: { /* full */ }, release: { /* full */ } },
    '1.16.0': { manifest_version: 1, /* + signal_lifecycle, signal_collection, spike */ },
    '1.17.0': { manifest_version: 1, /* + automation */ },
  }
  return JSON.parse(JSON.stringify(configs[version]))
}

/**
 * Set up an old-format KB in tmpdir for migration testing
 */
export function setupOldKB(tmpdir, fileMap) {
  const oldKBDir = path.join(tmpdir, '.claude', 'gsd-knowledge')
  for (const [relPath, content] of Object.entries(fileMap)) {
    const fullPath = path.join(oldKBDir, relPath)
    mkdirSync(path.dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, content)
  }
  return oldKBDir
}

/**
 * Capture full state of a directory tree for comparison
 */
export function captureDirectoryState(dir) {
  const state = {}
  const walk = (d, prefix = '') => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name
      if (entry.isDirectory()) {
        walk(path.join(d, entry.name), relPath)
      } else if (entry.isFile()) {
        state[relPath] = readFileSync(path.join(d, entry.name), 'utf8')
      } else if (entry.isSymbolicLink()) {
        state[relPath] = `SYMLINK -> ${readlinkSync(path.join(d, entry.name))}`
      }
    }
  }
  walk(dir)
  return state
}

/**
 * Assert two directory states are equivalent
 */
export function expectDirectoryStatesEqual(actual, expected) {
  expect(Object.keys(actual).sort()).toEqual(Object.keys(expected).sort())
  for (const [path, content] of Object.entries(expected)) {
    expect(actual[path], `Content mismatch at ${path}`).toBe(content)
  }
}
```

### Recommended Dev Dependencies

```bash
# Property-based testing for namespace rewriter fuzzing
npm install -D @fast-check/vitest
```

No other new dependencies recommended. The existing `vitest` + `tmpdirTest` pattern is sufficient for all other test types.
