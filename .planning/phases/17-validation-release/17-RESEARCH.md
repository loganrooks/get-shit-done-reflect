# Phase 17: Validation & Release - Research

**Researched:** 2026-02-11
**Domain:** Multi-runtime installer validation, cross-runtime KB interop, end-to-end regression testing
**Confidence:** HIGH

## Summary

Phase 17 is the final validation phase of the v1.14 milestone. Its purpose is to verify that all changes made in Phases 13-16 (path abstraction, KB migration, Codex CLI integration, cross-runtime handoff, signal enrichment) work correctly together across all 4 runtimes: Claude Code, OpenCode, Gemini CLI, and Codex CLI. This is a verification-only phase -- no new features, no new code in the installer or workflows. The deliverables are test scripts, validation reports, and a release readiness assessment.

The existing test suite (`tests/unit/install.test.js`) has 64 tests covering all 4 runtime installers, including an `--all` integration test that verifies all runtimes install alongside each other. The broader test suite has 105 passing tests across 4 test files. However, the existing tests validate the **installer mechanics** (file copying, path replacement, frontmatter conversion), not the **end-to-end workflows** (can you actually install GSD for OpenCode, launch OpenCode, and run /gsd-help?). Phase 17 bridges this gap.

The four requirements (VALID-01 through VALID-04) map to a structured validation approach: (1) per-runtime install-and-verify tests (VALID-01, VALID-02), (2) multi-runtime install test (VALID-03), and (3) cross-runtime KB interop test (VALID-04). The first three can be validated mechanically via enhanced integration tests. The fourth requires actual KB write-read verification across runtime install targets.

**Primary recommendation:** Create two plans: 17-01 for enhanced integration tests covering VALID-01 through VALID-03, and 17-02 for cross-runtime KB validation (VALID-04) plus release readiness checklist.

## Standard Stack

This phase introduces no new libraries. It uses the existing test infrastructure.

### Core (existing project infrastructure)
| Component | Location | Purpose | Relevance to Phase 17 |
|-----------|----------|---------|----------------------|
| Vitest | `devDependencies` (v3.0.0) | Test runner | All new validation tests use Vitest |
| `install.test.js` | `tests/unit/install.test.js` | 64 existing installer tests | New tests extend this file or create companion files |
| `tmpdir.js` helper | `tests/helpers/tmpdir.js` | Isolated temp dirs for tests | All install tests use `tmpdirTest` fixture |
| `vitest.config.js` | Root | Test configuration | 30s timeout, includes `tests/**/*.test.js` |
| `install.js` | `bin/install.js` | Installer (2250 lines) | Subject under test -- NOT modified in this phase |
| `kb-infrastructure.test.js` | `tests/integration/` | KB dir creation, index rebuild tests | Reference pattern for KB validation tests |
| `wiring-validation.test.js` | `tests/integration/` | Cross-file reference validation | Reference pattern for installed file validation |

### Supporting
| Component | Location | Purpose | When Used |
|-----------|----------|---------|-----------|
| `verify-kb.sh` | `tests/smoke/` | KB state assertion helpers (bash) | Reference for KB verification logic |
| `run-smoke.sh` | `tests/smoke/` | End-to-end smoke test orchestrator (requires claude CLI) | Not run in CI -- requires authenticated runtime |
| `kb-create-dirs.sh` | `.claude/agents/` | Creates KB directory structure | Used by smoke tests, referenced for understanding KB paths |
| `kb-rebuild-index.sh` | `.claude/agents/` | Rebuilds KB index.md | Referenced for understanding KB index format |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest integration tests | Shell-based smoke tests (like `run-smoke.sh`) | Vitest is automated, repeatable, runs in CI; smoke tests require authenticated runtimes |
| New test file | Extending `install.test.js` | Prefer new file(s) to separate validation concerns from unit tests; keeps test organization clean |
| Manual validation checklist | Automated tests | Automated tests are repeatable; manual checklist for runtime-specific items that need actual runtime |

**Installation:**
No new packages needed. All tests use existing Vitest + Node.js stdlib.

## Architecture Patterns

### Recommended Test Organization
```
tests/
├── unit/
│   └── install.test.js          # 64 existing tests (NOT modified)
├── integration/
│   ├── kb-infrastructure.test.js # Existing KB tests
│   ├── kb-write.test.js          # Existing KB write tests
│   ├── wiring-validation.test.js # Existing cross-file ref tests
│   └── multi-runtime.test.js     # NEW: VALID-01, VALID-02, VALID-03 tests
├── helpers/
│   └── tmpdir.js                 # Existing tmpdir fixture
└── smoke/
    └── run-smoke.sh              # Existing (not modified)
```

### Pattern 1: Tmpdir-Isolated Full Installer Run

**What:** Run the actual installer (`bin/install.js`) against a temp directory with HOME overridden, then validate the installed file tree matches expectations.

**When to use:** VALID-01, VALID-02, VALID-03 -- verifying each runtime's installation output.

**Example (from existing tests):**
```javascript
// Source: tests/unit/install.test.js lines 170-193
tmpdirTest('--opencode flag installs to opencode config directory', async ({ tmpdir }) => {
  const configHome = path.join(tmpdir, '.config')

  execSync(`node "${installScript}" --opencode --global`, {
    env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
    cwd: tmpdir,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000
  })

  // Verify opencode command directory with flattened gsd-*.md files
  const commandDir = path.join(configHome, 'opencode', 'command')
  const commandExist = await fs.access(commandDir).then(() => true).catch(() => false)
  expect(commandExist).toBe(true)

  const commandFiles = await fs.readdir(commandDir)
  const gsdFiles = commandFiles.filter(f => f.startsWith('gsd-') && f.endsWith('.md'))
  expect(gsdFiles.length).toBeGreaterThan(0)
})
```

This existing pattern runs the real installer in a sandboxed HOME and validates output. The new validation tests extend this with deeper assertions (path content verification, KB directory creation, format-specific checks).

### Pattern 2: Deep File Content Validation Post-Install

**What:** After running the installer for a specific runtime, read installed files and verify:
1. No `~/.claude/` paths remain (should be transformed to runtime-specific prefix)
2. KB paths point to `~/.gsd/knowledge/` (shared, not runtime-specific)
3. Format conversions applied correctly (TOML for Gemini commands, SKILL.md for Codex skills, flat structure for OpenCode)
4. Required files exist in expected locations

**When to use:** VALID-01, VALID-02, VALID-03

**Example:**
```javascript
tmpdirTest('OpenCode install: all paths transformed correctly', async ({ tmpdir }) => {
  const configHome = path.join(tmpdir, '.config')
  execSync(`node "${installScript}" --opencode --global`, {
    env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
    cwd: tmpdir,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 15000
  })

  const gsdDir = path.join(configHome, 'opencode', 'get-shit-done')
  const mdFiles = await fs.readdir(gsdDir, { recursive: true })

  for (const mdFile of mdFiles.filter(f => f.endsWith('.md'))) {
    const content = await fs.readFile(path.join(gsdDir, mdFile), 'utf8')
    // Runtime-specific paths should use ~/.config/opencode/
    expect(content).not.toContain('~/.claude/')
    // KB paths should use shared location
    if (content.includes('knowledge')) {
      expect(content).toContain('~/.gsd/knowledge')
    }
  }
})
```

### Pattern 3: Cross-Runtime KB Write-Read

**What:** Install for multiple runtimes, create a KB entry (signal file) at `~/.gsd/knowledge/` from one runtime's perspective, then verify it is readable from another runtime's installed path references.

**When to use:** VALID-04

**Example:**
```javascript
tmpdirTest('KB accessible from all runtime install paths', async ({ tmpdir }) => {
  const configHome = path.join(tmpdir, '.config')

  // Install all runtimes
  execSync(`node "${installScript}" --all --global`, {
    env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
    cwd: tmpdir,
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 30000
  })

  // Create KB directories (simulate what installer does)
  const kbDir = path.join(tmpdir, '.gsd', 'knowledge')

  // Write a signal from "Claude Code" perspective
  const signalDir = path.join(kbDir, 'signals', 'test-project')
  await fs.mkdir(signalDir, { recursive: true })
  await fs.writeFile(path.join(signalDir, 'sig-test.md'),
    '---\nid: sig-test\ntype: signal\nruntime: claude-code\n---\n\n## What\n\nTest signal.\n')

  // Verify signal is readable via the shared path
  const signalContent = await fs.readFile(
    path.join(kbDir, 'signals', 'test-project', 'sig-test.md'), 'utf8')
  expect(signalContent).toContain('sig-test')

  // Verify Claude symlink works (if Claude is installed, symlink should exist)
  const claudeKb = path.join(tmpdir, '.claude', 'gsd-knowledge')
  const stat = await fs.lstat(claudeKb)
  expect(stat.isSymbolicLink()).toBe(true)

  // Read through symlink -- same content
  const viaSymlink = await fs.readFile(
    path.join(claudeKb, 'signals', 'test-project', 'sig-test.md'), 'utf8')
  expect(viaSymlink).toBe(signalContent)
})
```

### Pattern 4: Per-Runtime File Layout Validation Matrix

**What:** A structured validation matrix that asserts the expected file layout for each runtime.

| Runtime | Commands | References | Agents | Hooks | KB Access |
|---------|----------|------------|--------|-------|-----------|
| Claude Code | `commands/gsd/*.md` | `get-shit-done/**/*.md` | `agents/gsd-*.md` | `hooks/*.js` | `~/.gsd/knowledge/` + `~/.claude/gsd-knowledge` symlink |
| OpenCode | `command/gsd-*.md` (flat) | `get-shit-done/**/*.md` (opencode frontmatter) | `agents/gsd-*.md` (opencode frontmatter) | No hooks | `~/.gsd/knowledge/` |
| Gemini CLI | `commands/gsd/*.toml` | `get-shit-done/**/*.toml` (or `.md` with Gemini frontmatter) | `agents/gsd-*.md` (Gemini frontmatter) | `hooks/*.js` | `~/.gsd/knowledge/` |
| Codex CLI | `skills/gsd-*/SKILL.md` | `get-shit-done/**/*.md` (Codex format) | `AGENTS.md` (marker section) | No hooks | `~/.gsd/knowledge/` |

### Anti-Patterns to Avoid

- **Modifying `install.js` in a validation phase:** This is a READ-ONLY phase for the installer. If validation reveals bugs, document them as findings but do NOT fix the installer here. Fix tasks should be separate, pre-release patches.
- **Testing with real runtime CLIs:** The validation tests run the installer and inspect output. They do NOT launch actual Claude Code, OpenCode, Gemini CLI, or Codex CLI. Runtime-specific testing is a separate concern (documented in the human verification section, carried forward from Phase 16's verification report).
- **Relying on `~/.claude/gsd-knowledge` for non-Claude runtimes:** Only Claude gets the backward-compatibility symlink. OpenCode, Gemini, and Codex all use `~/.gsd/knowledge/` directly.
- **Testing against the user's real home directory:** ALL tests use tmpdir isolation with HOME override. Never touch `~/.gsd/`, `~/.claude/`, or any real runtime configuration.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Test isolation | Custom temp dir management | `tmpdirTest` from `tests/helpers/tmpdir.js` | Automatic cleanup, battle-tested in 64+ existing tests |
| Installer execution | In-process require() of install.js | `execSync('node install.js ...')` with env override | The installer uses `process.argv`, `process.env.HOME`, and has `require.main` guard; subprocess is the correct test harness |
| KB directory structure assertion | Manual fs.existsSync checks | Helper function that validates the full KB tree | Reusable across VALID-01 through VALID-04 |
| Path content scanning | Manual file-by-file reading | Recursive glob + content scan pattern (already used in Codex path replacement test, line 1099-1131) | Comprehensive, catches all files |

**Key insight:** The existing test patterns in `install.test.js` are the correct approach. Phase 17 extends these patterns with deeper content validation, not a different testing paradigm.

## Common Pitfalls

### Pitfall 1: Testing Only Happy Path Installs
**What goes wrong:** Validating that installation "completes" (exit code 0) without checking content correctness.
**Why it happens:** The existing `--all` test (line 1064-1097) already checks that directories exist and runtimes install. It is tempting to think this is sufficient.
**How to avoid:** The new validation tests must open installed files and verify content: path replacement correctness, format conversion (TOML, SKILL.md), KB path preservation, frontmatter transformation.
**Warning signs:** Tests that only check `fs.access()` without reading file contents.

### Pitfall 2: Gemini TOML Format Blindspot
**What goes wrong:** Assuming Gemini gets `.md` files like Claude Code. Gemini CLI commands use TOML format (`.toml` extension).
**Why it happens:** The Gemini conversion happens in `copyWithPathReplacement` (line 1076-1081 of install.js), which converts `.md` to `.toml` for files in the `commands/` directory.
**How to avoid:** For Gemini validation, check for `.toml` files in `commands/gsd/`, not `.md` files. Also verify that `get-shit-done/` reference docs are `.md` with TOML commands, and agents are `.md` with Gemini frontmatter.
**Warning signs:** Test looks for `.md` files in Gemini `commands/gsd/` and finds nothing.

### Pitfall 3: OpenCode XDG Path Sensitivity
**What goes wrong:** Tests pass on one system but fail on another due to XDG_CONFIG_HOME differences.
**Why it happens:** OpenCode uses `~/.config/opencode/` by default (XDG spec) but respects `OPENCODE_CONFIG_DIR`, `OPENCODE_CONFIG`, and `XDG_CONFIG_HOME` env vars.
**How to avoid:** Always set `XDG_CONFIG_HOME` explicitly in test env (as existing tests do, line 171-173). This makes the path deterministic.
**Warning signs:** Tests that rely on default `~/.config/` path without setting XDG_CONFIG_HOME.

### Pitfall 4: Codex CLI Has No settings.json, Hooks, or Agents Directory
**What goes wrong:** Validation test expects `settings.json`, `hooks/`, or `agents/` directory for Codex CLI.
**Why it happens:** Assuming all runtimes have the same file structure.
**How to avoid:** Codex CLI uses: `skills/gsd-*/SKILL.md` (commands), `AGENTS.md` (global instructions), `get-shit-done/` (references). No `settings.json`, no `hooks/`, no `agents/` directory.
**Warning signs:** Tests asserting `agents/gsd-*.md` files exist in `~/.codex/agents/`.

### Pitfall 5: Signal Schema Backward Compatibility Assumption
**What goes wrong:** KB validation test assumes all signals have `runtime:` and `model:` fields.
**Why it happens:** Phase 16 added these fields, but they are optional. Pre-existing signals lack them.
**How to avoid:** KB validation tests should verify signals are READABLE regardless of whether they have the new fields. Test with both old-format and new-format signal fixtures.
**Warning signs:** Tests that require `runtime:` field in signal frontmatter.

### Pitfall 6: Conflating Validation Tests with Smoke Tests
**What goes wrong:** Writing tests that require an authenticated Claude/OpenCode/Gemini/Codex runtime to run.
**Why it happens:** The success criteria mention "GSD commands work" which implies running actual commands.
**How to avoid:** Phase 17 validation tests verify the INSTALLER OUTPUT is correct (files exist, content is right, paths are transformed). Verifying that GSD commands WORK in an actual runtime is a smoke test concern (documented in human verification items). The automated tests verify what can be verified mechanically.
**Warning signs:** Tests that import or exec `claude`, `opencode`, `gemini`, or `codex` CLI binaries.

## Code Examples

### Example 1: Per-Runtime File Layout Verification Helper

```javascript
// Helper: verify expected file layout for a runtime after installation
async function verifyRuntimeLayout(rootDir, runtime) {
  const checks = []

  if (runtime === 'claude') {
    const base = path.join(rootDir, '.claude')
    checks.push(
      dirHasFiles(path.join(base, 'commands', 'gsd'), '.md', 3),
      dirHasFiles(path.join(base, 'get-shit-done'), '.md', 1),
      dirHasGlobFiles(path.join(base, 'agents'), 'gsd-*.md', 1),
      dirHasFiles(path.join(base, 'hooks'), '.js', 1),
      fileExists(path.join(base, 'get-shit-done', 'VERSION')),
      fileExists(path.join(base, 'settings.json')),
    )
  } else if (runtime === 'opencode') {
    const base = path.join(rootDir, '.config', 'opencode')
    checks.push(
      dirHasGlobFiles(path.join(base, 'command'), 'gsd-*.md', 3),
      dirHasFiles(path.join(base, 'get-shit-done'), '.md', 1),
      dirHasGlobFiles(path.join(base, 'agents'), 'gsd-*.md', 1),
      fileExists(path.join(base, 'get-shit-done', 'VERSION')),
    )
  } else if (runtime === 'gemini') {
    const base = path.join(rootDir, '.gemini')
    checks.push(
      dirHasFiles(path.join(base, 'commands', 'gsd'), '.toml', 3),
      dirHasFiles(path.join(base, 'get-shit-done'), null, 1),
      dirHasGlobFiles(path.join(base, 'agents'), 'gsd-*.md', 1),
      dirHasFiles(path.join(base, 'hooks'), '.js', 1),
      fileExists(path.join(base, 'get-shit-done', 'VERSION')),
      fileExists(path.join(base, 'settings.json')),
    )
  } else if (runtime === 'codex') {
    const base = path.join(rootDir, '.codex')
    checks.push(
      dirHasGlobDirs(path.join(base, 'skills'), 'gsd-*', 3),
      dirHasFiles(path.join(base, 'get-shit-done'), null, 1),
      fileExists(path.join(base, 'AGENTS.md')),
      fileExists(path.join(base, 'get-shit-done', 'VERSION')),
      // Codex should NOT have these:
      fileNotExists(path.join(base, 'agents')),
      fileNotExists(path.join(base, 'hooks')),
      fileNotExists(path.join(base, 'settings.json')),
    )
  }

  return Promise.all(checks)
}
```

### Example 2: Cross-Runtime Path Verification

```javascript
// Verify no ~/.claude/ paths leaked into non-Claude runtime installs
async function verifyNoLeakedClaudePaths(runtimeDir, runtime) {
  const allFiles = await fs.readdir(runtimeDir, { recursive: true })
  const mdFiles = allFiles.filter(f =>
    f.endsWith('.md') || f.endsWith('.toml'))

  const violations = []
  for (const file of mdFiles) {
    const filePath = path.join(runtimeDir, file)
    const stat = await fs.stat(filePath)
    if (!stat.isFile()) continue

    const content = await fs.readFile(filePath, 'utf8')

    // Check for leaked ~/.claude/ paths (should be runtime-specific)
    if (content.includes('~/.claude/') && runtime !== 'claude') {
      violations.push({ file, issue: 'contains ~/.claude/ path' })
    }

    // Check KB paths use shared location
    if (content.includes('gsd-knowledge') && !content.includes('.gsd/knowledge')) {
      violations.push({ file, issue: 'uses old gsd-knowledge path instead of .gsd/knowledge' })
    }
  }

  return violations
}
```

### Example 3: KB Cross-Runtime Accessibility

```javascript
tmpdirTest('signal created in shared KB readable from any runtime perspective',
  async ({ tmpdir }) => {
    const configHome = path.join(tmpdir, '.config')

    // Install all runtimes
    execSync(`node "${installScript}" --all --global`, {
      env: { ...process.env, HOME: tmpdir, XDG_CONFIG_HOME: configHome },
      cwd: tmpdir,
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 30000
    })

    // Verify shared KB was created
    const kbDir = path.join(tmpdir, '.gsd', 'knowledge')
    expect(fsSync.existsSync(path.join(kbDir, 'signals'))).toBe(true)
    expect(fsSync.existsSync(path.join(kbDir, 'spikes'))).toBe(true)
    expect(fsSync.existsSync(path.join(kbDir, 'lessons'))).toBe(true)

    // Write a signal to the shared KB
    const signalDir = path.join(kbDir, 'signals', 'cross-runtime-test')
    fsSync.mkdirSync(signalDir, { recursive: true })
    const signalContent = [
      '---',
      'id: sig-2026-02-11-cross-runtime',
      'type: signal',
      'project: cross-runtime-test',
      'tags: [validation, cross-runtime]',
      'runtime: claude-code',
      'model: claude-opus-4-6',
      '---',
      '',
      '## What Happened',
      '',
      'Cross-runtime validation test signal.',
    ].join('\n')
    fsSync.writeFileSync(
      path.join(signalDir, 'sig-cross-runtime.md'), signalContent)

    // Verify the signal is readable at the shared path
    const readBack = fsSync.readFileSync(
      path.join(kbDir, 'signals', 'cross-runtime-test', 'sig-cross-runtime.md'), 'utf8')
    expect(readBack).toContain('cross-runtime')
    expect(readBack).toContain('runtime: claude-code')

    // Verify Claude backward-compat symlink points to shared KB
    const claudeSymlink = path.join(tmpdir, '.claude', 'gsd-knowledge')
    expect(fsSync.lstatSync(claudeSymlink).isSymbolicLink()).toBe(true)
    const viaSymlink = fsSync.readFileSync(
      path.join(claudeSymlink, 'signals', 'cross-runtime-test', 'sig-cross-runtime.md'), 'utf8')
    expect(viaSymlink).toBe(readBack)
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual runtime testing | Automated installer output validation | Phase 17 (this phase) | Repeatable, CI-friendly verification |
| Single-runtime test coverage | 4-runtime validation matrix | Phase 15 (Codex integration) | Tests cover Claude, OpenCode, Gemini, Codex |
| KB at `~/.claude/gsd-knowledge/` | KB at `~/.gsd/knowledge/` (shared) | Phase 14 | All runtimes share one KB, Claude has backward-compat symlink |
| No format conversion tests | Full format validation per runtime | Phase 15 (TOML, SKILL.md, flat structure) | Each runtime format verified |

## Open Questions

1. **Gemini reference doc format**
   - What we know: Gemini commands are `.toml` (converted from `.md`). Gemini agents are `.md` with Gemini-specific frontmatter.
   - What's unclear: Whether `get-shit-done/` reference docs installed for Gemini are `.md` or `.toml`. The `copyWithPathReplacement` function (install.js line 1075-1084) converts `.md` to `.toml` only for the `commands/gsd/` directory, while `get-shit-done/` reference docs appear to stay as `.md` but with `<sub>` tags stripped.
   - Recommendation: Verify during test implementation. The installer code is the source of truth. Read the installed Gemini `get-shit-done/` directory to confirm file extensions.

2. **Scope of "GSD commands work"**
   - What we know: Success criteria say "GSD commands work with the new path system." This cannot be fully validated without running actual runtimes.
   - What's unclear: Whether the user expects automated runtime-level testing or is satisfied with file-level validation plus a manual checklist.
   - Recommendation: Automated tests verify file correctness (paths, format, layout). A manual validation checklist documents what to test with actual runtimes. This matches the "Runtime-specific test suites" item listed as Out of Scope in REQUIREMENTS.md.

3. **Release artifact scope**
   - What we know: The project uses `npm publish` (see `prepublishOnly` script in package.json). Version is 1.13.0.
   - What's unclear: Whether Phase 17 should include version bumping to 1.14.0, CHANGELOG updates, or npm publish preparation.
   - Recommendation: Keep the phase focused on validation. Version bump and release mechanics can be a final step or a separate concern. Document the release readiness state.

## Sources

### Primary (HIGH confidence)
- Direct analysis of `bin/install.js` (2250 lines) -- full installer code including all 4 runtime paths
- Direct analysis of `tests/unit/install.test.js` (1134 lines) -- existing 64 tests, test patterns, helper usage
- Direct analysis of `tests/helpers/tmpdir.js` -- test isolation pattern
- Direct analysis of `tests/integration/kb-infrastructure.test.js` -- KB validation patterns
- Direct analysis of `tests/integration/wiring-validation.test.js` -- cross-file reference validation patterns
- `vitest.config.js` -- test configuration (30s timeout, `tests/**/*.test.js` include pattern)
- `package.json` -- devDependencies (Vitest 3.0.0), scripts (`npm test` = `vitest run`)
- `.planning/REQUIREMENTS.md` lines 52-55 -- VALID-01 through VALID-04 definitions
- `.planning/ROADMAP.md` lines 90-99 -- Phase 17 success criteria
- `.planning/phases/16-cross-runtime-handoff-signal-enrichment/16-VERIFICATION.md` -- Phase 16 completion, human verification items that carry forward
- All 105 tests currently passing (verified via `npx vitest run`)

### Secondary (MEDIUM confidence)
- `tests/smoke/run-smoke.sh` -- smoke test patterns (reference for end-to-end testing approach, not directly reused)

### Tertiary (LOW confidence)
- None. This phase is purely internal validation against the existing codebase.

## Knowledge Applied

Checked knowledge base (`~/.gsd/knowledge/index.md`), no KB directory found at `~/.gsd/knowledge/` on this machine. No relevant entries to surface.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all tools are existing project infrastructure, directly analyzed
- Architecture: HIGH -- test patterns derived from existing tests in the codebase, not external sources
- Pitfalls: HIGH -- identified from direct analysis of installer code and existing test coverage gaps
- Code examples: HIGH -- based on existing test patterns in `install.test.js` with extensions

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable -- no external dependencies, purely internal codebase validation)
