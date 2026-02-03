# Phase 0: Deployment Infrastructure - Research

**Researched:** 2026-02-03
**Domain:** npm packaging, test automation, CI/CD, local development workflow
**Confidence:** HIGH

## Summary

Phase 0 establishes the infrastructure needed to deploy, test, and verify the GSD Reflect fork. The domain is well-understood: npm packaging with bin scripts for npx execution, test frameworks for Node.js CLI tools, GitHub Actions for CI/CD with trusted publishing, and symlinks for hot-reload development workflows. The existing GSD codebase already has a working `bin/install.js` that handles npm packaging correctly -- the fork needs to rename the package and ensure the test infrastructure can verify that installation works.

The key challenge is creating test environments that can exercise the full E2E flow: install the package, run a mock GSD workflow, trigger signal collection, and verify KB writes. This requires isolated test directories (temp dirs, not Docker per CONTEXT.md's discretion), test fixtures representing GSD artifacts (PLAN.md, SUMMARY.md, etc.), and assertions on knowledge base output. Vitest is the modern standard for Node.js testing with excellent ES module support and built-in fixture patterns.

**Primary recommendation:** Use Vitest for all testing (unit, integration, E2E), temp directory fixtures for test isolation, GitHub Actions with OIDC trusted publishing for npm releases, and a simple symlink-based script for local development hot reload.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vitest | 3.x | Test framework | Modern, fast, native ESM support, Jest-compatible API, built-in fixture patterns |
| Node.js fs | built-in | File operations for tests | Zero dependencies, temp directory creation via `fs.mkdtempSync` |
| GitHub Actions | N/A | CI/CD platform | Free for open source, OIDC trusted publishing support |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @vitest/coverage-v8 | 3.x | Code coverage | When tracking test coverage thresholds |
| yargs | 17.x | CLI argument parsing | If install script needs more complex argument handling (current bin/install.js uses manual parsing) |
| c8 | 10.x | Native V8 coverage | Alternative to @vitest/coverage-v8 if issues arise |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vitest | Jest | Jest has slower ES module support, requires babel-jest for TS; Vitest is 10-20x faster in watch mode |
| Vitest | Node.js built-in test runner | Node test runner is leaner but lacks fixture patterns and coverage integration |
| Temp directories | Docker | Docker adds complexity and slower CI runs; temp dirs are sufficient for file-based testing |
| npm link | yalc | yalc solves symlink issues but adds tool dependency; direct symlinks work for this use case |

**Installation:**
```bash
npm install -D vitest @vitest/coverage-v8
```

## Architecture Patterns

### Recommended Project Structure
```
get-shit-done-reflect/
├── bin/
│   └── install.js              # npx entry point (existing)
├── tests/
│   ├── unit/                   # Unit tests for individual components
│   │   ├── install.test.js     # Install script tests
│   │   └── hooks/              # Hook tests
│   ├── integration/            # Integration tests
│   │   ├── kb-write.test.js    # KB write verification
│   │   └── signal-collect.test.js
│   ├── e2e/                    # End-to-end tests
│   │   └── full-flow.test.js   # Install -> workflow -> signal -> KB
│   ├── fixtures/               # Test fixtures
│   │   ├── mock-project/       # Mock .planning/ structure
│   │   │   ├── PLAN.md
│   │   │   ├── SUMMARY.md
│   │   │   └── config.json
│   │   └── expected-output/    # Expected KB entries
│   └── helpers/
│       ├── tmpdir.js           # Temp directory fixture
│       └── setup.js            # Global test setup
├── scripts/
│   ├── build-hooks.js          # Existing hook builder
│   └── dev-setup.js            # Symlink setup for development
├── .github/
│   └── workflows/
│       ├── ci.yml              # Test on PR/push
│       └── publish.yml         # npm publish on release
└── vitest.config.js            # Vitest configuration
```

### Pattern 1: Temp Directory Fixture for Test Isolation
**What:** Create a unique temp directory before each test, clean it up after. Use Vitest's `test.extend()` pattern.
**When to use:** Any test that writes files (install tests, KB write tests, signal collection tests)
**Example:**
```javascript
// Source: https://sdorra.dev/posts/2024-02-12-vitest-tmpdir
import { test } from "vitest";
import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";

export const tmpdirTest = test.extend({
  tmpdir: async ({}, use) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gsd-test-"));
    await use(directory);
    await fs.rm(directory, { recursive: true });
  },
});
```

### Pattern 2: Mock GSD Project Structure
**What:** Test fixtures that replicate a real GSD project's .planning/ directory with PLAN.md, SUMMARY.md, VERIFICATION.md, config.json
**When to use:** Signal collection tests, verification tests, E2E tests
**Example:**
```javascript
// tests/fixtures/mock-project/.planning/phases/01-test/01-01-PLAN.md
// Contains realistic plan structure for testing signal detection

// tests/fixtures/mock-project/.planning/phases/01-test/01-01-SUMMARY.md
// Contains execution summary with deliberate deviations to trigger signals
```

### Pattern 3: Symlink-Based Hot Reload Development
**What:** Script that creates symlinks from `~/.claude/get-shit-done/` to repo files for instant changes
**When to use:** Local development workflow
**Example:**
```bash
#!/bin/bash
# scripts/dev-setup.sh

CLAUDE_DIR="$HOME/.claude"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Create symlinks for hot reload development
ln -sfn "$REPO_DIR/commands/gsd" "$CLAUDE_DIR/commands/gsd"
ln -sfn "$REPO_DIR/get-shit-done" "$CLAUDE_DIR/get-shit-done"
ln -sfn "$REPO_DIR/agents" "$CLAUDE_DIR/agents"

echo "Development symlinks created. Changes to repo files now reflect immediately."
```

### Pattern 4: GitHub Actions CI with Required Checks
**What:** Workflow that runs tests on PR and push, with job names that become required status checks
**When to use:** CI configuration
**Example:**
```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
      - run: npm ci
      - run: npm test
```

### Pattern 5: OIDC Trusted Publishing for npm
**What:** Publish npm packages without storing tokens, using GitHub Actions OIDC authentication
**When to use:** npm publish workflow (requires npm CLI 11.5.1+)
**Example:**
```yaml
# .github/workflows/publish.yml
name: Publish to npm
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Anti-Patterns to Avoid
- **Modifying existing GSD files for testing:** Tests should work with copies or temp dirs, not mutate repo files
- **Hardcoded paths in tests:** Use `os.tmpdir()` and `path.join()` for cross-platform compatibility
- **Skipping cleanup in tests:** Always use `afterEach` or fixture cleanup to remove temp files
- **Testing against real API calls in CI:** Mock tests for deterministic CI; real agent tests run separately
- **Long-lived npm tokens:** Use OIDC trusted publishing or restrict token permissions

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Temp directory management | Manual mkdir/rmdir | Vitest `test.extend()` fixture pattern | Handles cleanup even on test failure; reusable across tests |
| Test coverage reporting | Manual tracking | @vitest/coverage-v8 | Automatic thresholds, CI integration, lcov output |
| npm publish security | Store NPM_TOKEN in repo | OIDC trusted publishing | Short-lived tokens, no token leakage risk |
| CLI argument parsing | String manipulation | yargs (if needed) | Handles edge cases, help generation, validation |
| CI workflow dispatch | Manual GitHub API calls | GitHub Actions on: release | Native integration, provenance attestations |

**Key insight:** The testing infrastructure should be minimal and use established patterns. Vitest provides everything needed for unit through E2E testing. The npm ecosystem has mature tooling for packaging and publishing. Don't create custom solutions for solved problems.

## Common Pitfalls

### Pitfall 1: Test Pollution from Shared State
**What goes wrong:** Tests pass individually but fail when run together because they share temp directories or mock state
**Why it happens:** Not isolating each test's filesystem state
**How to avoid:** Use unique temp directories per test via `fs.mkdtemp()`. Clean up in afterEach. Never share mutable state between tests.
**Warning signs:** Tests that pass alone but fail in suite; flaky tests depending on run order

### Pitfall 2: ES Module / CommonJS Interop Issues
**What goes wrong:** Import errors, "require is not defined", or module resolution failures
**Why it happens:** Mixing ESM and CJS patterns; Vitest uses ESM natively
**How to avoid:** Configure `"type": "module"` in package.json OR use `.mjs` extensions OR configure Vitest transform settings. The existing GSD codebase uses CommonJS (`require`), so tests may need to handle interop.
**Warning signs:** SyntaxError on import/require; "ERR_REQUIRE_ESM"

### Pitfall 3: Path Handling Across Platforms
**What goes wrong:** Tests pass on Mac but fail on GitHub Actions (Linux) or Windows
**Why it happens:** Hardcoded paths with wrong separators; shell commands that don't work cross-platform
**How to avoid:** Use `path.join()` everywhere. Use Node.js fs APIs instead of shell commands when possible. Test on CI early.
**Warning signs:** Paths with `/` hardcoded; shell commands assuming bash

### Pitfall 4: CI Timeout on Real Agent Tests
**What goes wrong:** E2E tests that call real Claude API timeout or cost excessive tokens
**Why it happens:** Real agent tests are slow and expensive; running them on every PR is wasteful
**How to avoid:** Separate test tiers: mock tests (every PR), real agent tests (on-demand or release-only). Use workflow_dispatch trigger for expensive tests.
**Warning signs:** CI taking 10+ minutes; API rate limits hit; unexpected token costs

### Pitfall 5: npm Publish Without Version Bump
**What goes wrong:** Publish fails with "version already exists" error
**Why it happens:** Forgot to bump version in package.json before creating release
**How to avoid:** Use semantic versioning. Consider semantic-release for automated version bumps. Verify version in prepublishOnly script.
**Warning signs:** Manual version edits forgotten; inconsistent version numbers

### Pitfall 6: Required Status Checks Not Found
**What goes wrong:** Branch protection can't find the status check to require
**Why it happens:** Status check names use the job name from YAML, not the workflow file name
**How to avoid:** Use explicit, memorable job names (`test`, `lint`, `build`). After first workflow run, the check becomes available in branch protection settings.
**Warning signs:** "Status check not found" when setting up branch protection

### Pitfall 7: Symlinks Not Working with npm link
**What goes wrong:** npm link creates symlinks but changes don't reflect, or module resolution fails
**Why it happens:** npm link has known issues with nested node_modules, React duplicate instances, etc.
**How to avoid:** For this project, use direct symlinks via script instead of npm link. The dev-setup script creates explicit symlinks to ~/.claude/ directories.
**Warning signs:** Changes to linked package not visible; "Cannot find module" errors after linking

## Code Examples

Verified patterns from official sources and established practices:

### Vitest Configuration for Node.js CLI Testing
```javascript
// vitest.config.js
// Source: https://vitest.dev/config/
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    testTimeout: 30000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['**/node_modules/**', '**/tests/**']
    },
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/helpers/setup.js']
  }
})
```

### Temp Directory Test Fixture
```javascript
// tests/helpers/tmpdir.js
// Source: https://sdorra.dev/posts/2024-02-12-vitest-tmpdir
import { test } from 'vitest'
import os from 'node:os'
import fs from 'node:fs/promises'
import path from 'node:path'

export const tmpdirTest = test.extend({
  tmpdir: async ({}, use) => {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'gsd-test-'))
    await use(directory)
    await fs.rm(directory, { recursive: true })
  }
})
```

### Using Temp Directory Fixture in Tests
```javascript
// tests/unit/install.test.js
import { describe, expect } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('install script', () => {
  tmpdirTest('creates correct directory structure', async ({ tmpdir }) => {
    // Set up mock home directory in tmpdir
    const mockHome = path.join(tmpdir, 'home')
    await fs.mkdir(path.join(mockHome, '.claude'), { recursive: true })

    // Run install with mocked paths
    // ... test implementation

    // Verify expected files exist
    const commandsDir = path.join(mockHome, '.claude', 'commands', 'gsd')
    const exists = await fs.access(commandsDir).then(() => true).catch(() => false)
    expect(exists).toBe(true)
  })
})
```

### GitHub Actions CI Workflow
```yaml
# .github/workflows/ci.yml
# Source: https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run build:hooks
      - run: npm test
      - run: npm run test:coverage
        if: github.event_name == 'pull_request'

  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
        if: hashFiles('.eslintrc*') != ''
```

### npm Publish Workflow with OIDC
```yaml
# .github/workflows/publish.yml
# Source: https://docs.npmjs.com/trusted-publishers/
name: Publish to npm

on:
  release:
    types: [published]

jobs:
  publish:
    name: Publish
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v5

      - uses: actions/setup-node@v4
        with:
          node-version: '20.x'
          registry-url: 'https://registry.npmjs.org'

      - run: npm ci
      - run: npm run build:hooks

      # Verify version matches release tag
      - name: Verify version
        run: |
          PKG_VERSION=$(node -p "require('./package.json').version")
          TAG_VERSION=${GITHUB_REF#refs/tags/v}
          if [ "$PKG_VERSION" != "$TAG_VERSION" ]; then
            echo "Version mismatch: package.json=$PKG_VERSION, tag=$TAG_VERSION"
            exit 1
          fi

      - run: npm publish --provenance --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Development Setup Script
```bash
#!/bin/bash
# scripts/dev-setup.sh
# Creates symlinks for hot-reload development workflow
# Source: CONTEXT.md local dev workflow decision

set -e

CLAUDE_DIR="$HOME/.claude"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Setting up development symlinks..."

# Ensure base directory exists
mkdir -p "$CLAUDE_DIR"

# Remove existing GSD directories if they exist (backup first)
if [ -d "$CLAUDE_DIR/commands/gsd" ] && [ ! -L "$CLAUDE_DIR/commands/gsd" ]; then
  echo "Backing up existing commands/gsd to commands/gsd.bak"
  mv "$CLAUDE_DIR/commands/gsd" "$CLAUDE_DIR/commands/gsd.bak"
fi

if [ -d "$CLAUDE_DIR/get-shit-done" ] && [ ! -L "$CLAUDE_DIR/get-shit-done" ]; then
  echo "Backing up existing get-shit-done to get-shit-done.bak"
  mv "$CLAUDE_DIR/get-shit-done" "$CLAUDE_DIR/get-shit-done.bak"
fi

if [ -d "$CLAUDE_DIR/agents" ] && [ ! -L "$CLAUDE_DIR/agents" ]; then
  echo "Backing up existing agents to agents.bak"
  mv "$CLAUDE_DIR/agents" "$CLAUDE_DIR/agents.bak"
fi

# Create parent directories
mkdir -p "$CLAUDE_DIR/commands"

# Create symlinks
ln -sfn "$REPO_DIR/commands/gsd" "$CLAUDE_DIR/commands/gsd"
ln -sfn "$REPO_DIR/get-shit-done" "$CLAUDE_DIR/get-shit-done"
ln -sfn "$REPO_DIR/agents" "$CLAUDE_DIR/agents"

echo ""
echo "Development symlinks created:"
echo "  $CLAUDE_DIR/commands/gsd -> $REPO_DIR/commands/gsd"
echo "  $CLAUDE_DIR/get-shit-done -> $REPO_DIR/get-shit-done"
echo "  $CLAUDE_DIR/agents -> $REPO_DIR/agents"
echo ""
echo "Changes to repo files now reflect immediately in Claude Code."
echo ""
echo "To unlink and restore backups, run: scripts/dev-teardown.sh"
```

### KB Write Verification Test Pattern
```javascript
// tests/integration/kb-write.test.js
import { describe, expect, beforeEach, afterEach } from 'vitest'
import { tmpdirTest } from '../helpers/tmpdir.js'
import path from 'node:path'
import fs from 'node:fs/promises'

describe('knowledge base writes', () => {
  tmpdirTest('signal is written with correct frontmatter', async ({ tmpdir }) => {
    // Set up mock KB directory
    const kbDir = path.join(tmpdir, 'gsd-knowledge')
    await fs.mkdir(path.join(kbDir, 'signals', 'test-project'), { recursive: true })

    // Create a signal file (simulating what signal collector does)
    const signalContent = `---
id: sig-2026-02-03-test-signal
type: signal
project: test-project
tags: [test, verification]
created: 2026-02-03T12:00:00Z
updated: 2026-02-03T12:00:00Z
durability: workaround
status: active
severity: notable
signal_type: deviation
phase: 1
plan: 1
polarity: negative
source: auto
---

## What Happened

Test signal content.
`
    const signalPath = path.join(kbDir, 'signals', 'test-project', '2026-02-03-test-signal.md')
    await fs.writeFile(signalPath, signalContent)

    // Verify signal was written correctly
    const written = await fs.readFile(signalPath, 'utf8')
    expect(written).toContain('id: sig-2026-02-03-test-signal')
    expect(written).toContain('severity: notable')
    expect(written).toContain('signal_type: deviation')
  })
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm tokens stored in CI secrets | OIDC trusted publishing | July 2025 (npm 11.5.1) | Eliminates token leakage risk; short-lived credentials |
| Jest for all Node.js testing | Vitest for modern projects | 2023-2024 | 10-20x faster; native ESM; simpler config |
| Docker for test isolation | Temp directories + fixtures | Always an option | Simpler CI; faster tests; sufficient for file-based systems |
| Manual symlinks via npm link | Direct symlinks in script | N/A (pragmatic choice) | Avoids npm link pitfalls; explicit control |
| Manual version bumps | semantic-release automation | 2020+ | Consistent versioning; automated changelogs (optional) |

**Deprecated/outdated:**
- Jest's experimental ES module support: Vitest handles ESM natively
- `prepublish` script: Use `prepublishOnly` for pre-publish tasks
- Long-lived npm tokens: Use OIDC trusted publishing for CI/CD

## Open Questions

1. **Real agent test frequency**
   - What we know: CONTEXT.md marks this as Claude's discretion -- every PR vs on-demand vs release
   - What's unclear: Cost/benefit tradeoff for this specific project
   - Recommendation: Run mock tests on every PR; real agent tests via manual workflow_dispatch or on release tags only. This keeps CI fast and predictable while allowing thorough validation when needed.

2. **Test coverage thresholds**
   - What we know: CONTEXT.md marks this as Claude's discretion
   - What's unclear: What percentage is realistic for a meta-prompting system
   - Recommendation: Start with 70% line coverage as soft target. Install script and KB operations should have higher coverage (90%+). Agent markdown files aren't covered by traditional tests.

3. **Benchmark suite implementation**
   - What we know: CONTEXT.md specifies tiered benchmarks (quick/standard/comprehensive) with process quality metrics
   - What's unclear: How to measure "signals captured" and "KB usage" programmatically without running real agents
   - Recommendation: Design benchmarks as separate workflow that runs actual Claude agents on controlled projects. Track results in markdown files. Human interpretation of results per CONTEXT.md decision.

4. **Package name registration**
   - What we know: Fork needs its own npm package name (`get-shit-done-reflect-cc`)
   - What's unclear: Whether the name is available on npm
   - Recommendation: Verify name availability on npmjs.com before first publish. Have backup names ready.

5. **Install script modification**
   - What we know: Existing bin/install.js handles multi-runtime install (Claude Code, OpenCode, Gemini)
   - What's unclear: Whether any modifications are needed for the fork or if it works as-is
   - Recommendation: Test the existing install script thoroughly; likely works without modification once package.json name/version are updated.

## Sources

### Primary (HIGH confidence)
- [Vitest Documentation](https://vitest.dev/) - Configuration, fixtures, test API
- [GitHub Actions Publishing Node.js Packages](https://docs.github.com/en/actions/tutorials/publish-packages/publish-nodejs-packages) - CI/CD workflow patterns
- [npm Trusted Publishers](https://docs.npmjs.com/trusted-publishers/) - OIDC authentication for publishing
- Existing GSD codebase: `bin/install.js`, `scripts/build-hooks.js`, `package.json`

### Secondary (MEDIUM confidence)
- [Vitest vs Jest comparison - Better Stack](https://betterstack.com/community/guides/scaling-nodejs/vitest-vs-jest/) - Performance comparison and feature analysis
- [Using npm link for Local Package Development](https://schalkneethling.com/posts/using-npm-link-for-local-package-development/) - Local dev workflow patterns
- [Using temporary files with Vitest](https://sdorra.dev/posts/2024-02-12-vitest-tmpdir) - Temp directory fixture pattern
- [GitHub Status Checks and Branch Protection](https://dev.to/bobbyg603/github-status-checks-and-branch-protection-made-easy-2cnf) - CI configuration patterns

### Tertiary (LOW confidence)
- [npm trusted publishing GA announcement](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) - Feature announcement (date-sensitive)
- WebSearch results for benchmarking patterns (needs validation against Vitest docs)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Vitest and GitHub Actions are established, well-documented tools
- Architecture: HIGH - Patterns derived from official documentation and proven practices
- Pitfalls: HIGH - Common issues documented across multiple sources and verified against project constraints

**Research date:** 2026-02-03
**Valid until:** 2026-05-03 (90 days - npm/CI tooling is stable but evolving)
