# Phase 6: Production Readiness & Workspace Health - Research

**Researched:** 2026-02-09
**Domain:** Workspace validation, version migration, DevOps onboarding, fork identity
**Confidence:** HIGH

## Summary

Phase 6 is a production hardening phase that operates entirely within the established GSD Reflect codebase patterns. No external libraries are needed -- all deliverables are new markdown command files, workflow files, reference documents, shell scripts, and config extensions. The codebase already provides proven patterns for every file type needed: thin-routing commands (Phase 2), workflow orchestration (Phase 2-5), reference specifications (Phase 1-5), shell scripts for KB operations (Phase 1), and config.json extension (Phase 0-5).

The primary technical challenge is the **fork constraint**: changes must be additive (new files OR additive sections to existing files, not logic changes). This constrains how version migration auto-detection works (cannot modify existing commands to add version checks) and how DevOps questions are added to `/gsd:new-project` (must be an additive section, not restructuring the existing flow).

**Primary recommendation:** Follow established patterns exactly. New commands as thin-routing markdown files, new workflows for orchestration, new references for specifications, additive sections to existing files where needed. No runtime code, no external dependencies.

## Standard Stack

### Core

This phase requires no external libraries. All deliverables are markdown prompt files, shell scripts, and JSON config extensions.

| Component | Technology | Purpose | Why Standard |
|-----------|-----------|---------|--------------|
| Commands | Markdown + YAML frontmatter | User-facing entry points | Established in all prior phases |
| Workflows | Markdown prompt files | Orchestration logic | Used by collect-signals, reflect, run-spike |
| References | Markdown specification files | Reusable spec docs for agents | Used by knowledge-store, signal-detection, etc. |
| Shell scripts | Bash | KB operations, file validation | Established by kb-rebuild-index.sh, kb-create-dirs.sh |
| Config | JSON | Workspace preferences | .planning/config.json extended in every phase |
| Tests | Vitest + tmpdir helper | Validation of shell scripts and config | Phase 0 established test infrastructure |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| `JSON.parse()` | Config validation | Health check config validity checks |
| `grep/sed` | Frontmatter extraction | KB integrity checks (matches kb-rebuild-index.sh pattern) |
| `find` | File discovery | Stale artifact detection, KB file scanning |
| semver string comparison | Version comparison | Migration detection (X.Y.Z format, simple comparison) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Shell scripts for health checks | Node.js script | Shell matches existing KB script pattern; Node.js would be inconsistent |
| New hook for version check | Modify existing commands | Hook is additive; modifying commands violates fork constraint |
| Separate devops.json config | Section in config.json | Single config file is simpler; matches existing pattern |

## Architecture Patterns

### Recommended File Map

```
commands/gsd/
  health-check.md          # NEW - thin routing command
  upgrade-project.md       # NEW - explicit migration command

get-shit-done/workflows/
  health-check.md          # NEW - orchestration logic

get-shit-done/references/
  health-check.md          # NEW - check definitions, thresholds, output format
  version-migration.md     # NEW - migration spec, version comparison, migration log format
  devops-detection.md      # NEW - DevOps file patterns, adaptive question rules

get-shit-done/templates/
  config.json              # ADDITIVE - new fields (gsd_reflect_version, health_check, devops)

commands/gsd/new-project.md   # ADDITIVE - DevOps questions round (Phase 5.7)
commands/gsd/help.md          # ADDITIVE - new commands listed

get-shit-done/templates/codebase/
  concerns.md              # ADDITIVE - DevOps Gaps section

hooks/
  gsd-version-check.js     # NEW - SessionStart hook for auto-detect migration

README.md                  # REPLACE - fork identity
CHANGELOG.md               # REPLACE - GSD Reflect changelog
package.json               # MODIFY - description, keywords
```

### Pattern 1: Thin Routing Command

**What:** Command file that delegates entirely to a workflow
**When to use:** For health-check and upgrade-project commands
**Example (from existing collect-signals.md):**
```markdown
---
name: gsd:health-check
description: Validate workspace state and report actionable findings
argument-hint: "[--full] [--focus kb|planning] [--fix] [--stale-days N]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---

<objective>
Validate workspace state (KB integrity, config validity, stale artifacts)
and report actionable findings. Optionally repair issues.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/health-check.md
@~/.claude/get-shit-done/references/health-check.md
</execution_context>

<process>
Follow the health-check workflow.
</process>
```
Source: Established pattern from `commands/gsd/collect-signals.md`

### Pattern 2: Additive Config Extension

**What:** New fields added to config.json with backward-compatible defaults
**When to use:** For health_check preferences, DevOps context, version tracking
**Example:**
```json
{
  "gsd_reflect_version": "1.12.0",
  "health_check": {
    "frequency": "milestone-only",
    "stale_threshold_days": 7,
    "blocking_checks": false
  },
  "devops": {
    "ci_provider": "none",
    "deploy_target": "none",
    "commit_convention": "freeform",
    "environments": []
  }
}
```
Source: Pattern from every prior phase extending config.json

### Pattern 3: Additive Section in Existing File

**What:** New section appended to an existing markdown file without changing existing content
**When to use:** DevOps questions in new-project.md, DevOps Gaps in concerns template
**Fork constraint compliance:** Adds new content after existing sections; existing behavior unchanged
**Example (adding Phase 5.7 to new-project.md):**
```markdown
## Phase 5.7: DevOps Context (Conditional)

**If brownfield project OR user mentioned deployment/CI during questioning:**

Display stage banner:
...
[DevOps questions round]
...

**If greenfield with no DevOps signals:** Skip this round entirely.
```

### Pattern 4: Health Check Tiered Execution

**What:** Check tiers that mirror the benchmark tiering from Phase 0
**When to use:** Default (quick), full, and focused health checks
**Design:**

| Tier | Flag | Checks | Duration |
|------|------|--------|----------|
| Quick (default) | (none) | KB integrity, config validity, stale artifacts | <5s |
| Full | `--full` | Quick + planning consistency, config drift, version compat | <15s |
| Focused | `--focus kb` | KB-specific checks only | <3s |
| Focused | `--focus planning` | Planning-specific checks only | <3s |

Source: Mirrors benchmark tiering from Phase 0 (00-04-PLAN.md: quick/standard/comprehensive)

### Pattern 5: Migration as Mini-Onboarding

**What:** When migration introduces new configurable features, prompt user for preferences
**When to use:** Version upgrade that adds health_check or devops config sections
**Design:**
```
## Project Migration: 1.11.1 -> 1.12.0

New features available:

1. Health Check preferences
   [AskUserQuestion for health_check.frequency]

2. DevOps Context
   [AskUserQuestion for basic devops settings]

Applying migration:
- Added gsd_reflect_version: "1.12.0"
- Added health_check config with your preferences
- Added devops config with your preferences
- Migration logged to .planning/migration-log.md
```

### Anti-Patterns to Avoid

- **Modifying existing command logic:** Fork constraint. Add new sections, not change existing flow.
- **Deep semantic validation in health check:** Keep checks mechanical (file existence, JSON parsability, schema match). Don't try to assess if plans are "good."
- **Complex migration framework:** For v1, a simple version comparison + additive config patching is sufficient. Don't build a migration runner with versioned scripts.
- **Over-questioning during DevOps init:** One round of 3-5 adaptive questions max. Detect first, ask about gaps, move on.
- **Generating config files during init:** Recommend and suggest, don't generate. "Consider adding .gitignore" is better than generating one.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML frontmatter parsing | Custom parser | `grep/sed` pattern from kb-rebuild-index.sh | Proven, handles edge cases |
| Semver comparison | Full semver library | Simple string split + numeric comparison | Version format is always X.Y.Z |
| JSON validation | Schema validation library | `JSON.parse()` + field existence checks | Config is simple, known structure |
| File system scanning | Custom walker | `find` command + bash | Health check is a shell operation |
| Index rebuild | New rebuild logic | Call existing `kb-rebuild-index.sh` | Already tested, proven correct |

**Key insight:** Phase 6 builds no runtime code. Everything is markdown prompts that instruct Claude. The "code" is the validation logic described in reference documents that agents execute on the fly. Shell scripts handle mechanical operations (like existing KB scripts).

## Common Pitfalls

### Pitfall 1: Fork Constraint Violation

**What goes wrong:** Modifying existing command files in ways that change behavior, not just add sections
**Why it happens:** Natural instinct to "fix" or "improve" existing commands while adding new features
**How to avoid:**
- Every file modification must be reviewed: "Does this change existing behavior or only add new?"
- New DevOps questions in new-project.md: ADD as a new phase (5.7), don't restructure existing phases
- Help.md: ADD new command entries, don't rewrite existing entries
- Config template: ADD new fields, don't change default values of existing fields
**Warning signs:** PR diffs showing changes to existing code blocks, changed default values, restructured flow

### Pitfall 2: Health Check Scope Creep

**What goes wrong:** Health check tries to assess subjective quality (plan completeness, requirement coverage) instead of mechanical validity
**Why it happens:** Desire to make the health check "smart" and comprehensive
**How to avoid:**
- Every check must be binary: pass/fail with a simple rule
- "Does index.md exist?" YES. "Is this plan well-written?" NO.
- Stick to: file existence, JSON validity, schema compliance, timestamp comparison, file count matching
**Warning signs:** Checks that require "judgment" or "assessment" rather than comparison

### Pitfall 3: Version Migration Complexity

**What goes wrong:** Building a versioned migration script system with rollback support
**Why it happens:** Enterprise patterns don't apply to a prompt-file project
**How to avoid:**
- Migrations are additive: add missing fields with defaults, never remove
- Single migration function that patches config.json from any older version to current
- Migration log is append-only documentation, not a transaction log
- No rollback needed (additions are backward-compatible)
**Warning signs:** Migration scripts per version, rollback logic, transaction semantics

### Pitfall 4: DevOps Question Overload

**What goes wrong:** Turning project initialization into a 15-minute questionnaire
**Why it happens:** Trying to capture every possible DevOps context
**How to avoid:**
- Detect first, ask about gaps only
- Maximum 3-5 questions in the DevOps round
- Skip entirely for greenfield projects with no DevOps signals
- Adaptive: fewer questions for personal tools, more for production apps
**Warning signs:** More than 5 DevOps questions, questions about obvious things already detected

### Pitfall 5: README Over-Documentation

**What goes wrong:** README becomes a full user manual instead of an introduction
**Why it happens:** Desire to document every feature in README
**How to avoid:**
- README answers: What is it? How do I install? What's different from GSD?
- Detailed usage goes in /gsd:help (already comprehensive)
- Command reference stays in help.md, not README
- Keep README under 300 lines
**Warning signs:** README > 300 lines, duplicating /gsd:help content

### Pitfall 6: SessionStart Hook Performance

**What goes wrong:** Version check hook adds noticeable delay to session start
**Why it happens:** Synchronous file reads or npm checks in the hook
**How to avoid:**
- Version check reads two local files only (VERSION and config.json) - sub-millisecond
- No npm registry calls (that's /gsd:update's job)
- Hook writes result to cache file, command reads cache
- Follow gsd-check-update.js pattern: background spawn, non-blocking
**Warning signs:** Noticeable delay on session start, npm calls in hook

## Code Examples

### Health Check KB Integrity Validation (Shell)

```bash
# Verify index.md matches actual KB files
# Source: Pattern from kb-rebuild-index.sh

KB_DIR="$HOME/.claude/gsd-knowledge"
INDEX="$KB_DIR/index.md"

# Count entries in index
index_signals=$(grep -c "^| sig-" "$INDEX" 2>/dev/null || echo "0")
index_spikes=$(grep -c "^| spk-" "$INDEX" 2>/dev/null || echo "0")
index_lessons=$(grep -c "^| les-" "$INDEX" 2>/dev/null || echo "0")

# Count actual files (excluding archived)
actual_signals=0
while IFS= read -r -d '' file; do
  status=$(grep "^status:" "$file" 2>/dev/null | head -1 | sed 's/^status:[[:space:]]*//')
  [ "$status" != "archived" ] && actual_signals=$((actual_signals + 1))
done < <(find "$KB_DIR/signals" -name '*.md' -print0 2>/dev/null)

# Compare
if [ "$index_signals" -ne "$actual_signals" ]; then
  echo "MISMATCH: Index has $index_signals signals, filesystem has $actual_signals"
fi
```

### Config Validation Pattern

```bash
# Validate config.json structure
CONFIG=".planning/config.json"

# Check parseable
if ! python3 -c "import json; json.load(open('$CONFIG'))" 2>/dev/null && \
   ! node -e "JSON.parse(require('fs').readFileSync('$CONFIG','utf8'))" 2>/dev/null; then
  echo "FAIL: config.json is not valid JSON"
fi

# Check required fields
REQUIRED_FIELDS="mode depth"
for field in $REQUIRED_FIELDS; do
  if ! grep -q "\"$field\"" "$CONFIG"; then
    echo "WARNING: Missing field: $field"
  fi
done
```

### Stale Artifact Detection

```bash
# Find orphaned .continue-here files
STALE_THRESHOLD_DAYS=${1:-7}

find .planning/phases -name '.continue-here.md' -mtime +$STALE_THRESHOLD_DAYS 2>/dev/null | while read -r file; do
  echo "STALE: $file (older than ${STALE_THRESHOLD_DAYS} days)"
done

# Find abandoned debug sessions (no 'resolved' marker)
find .planning/debug -name '*.md' -mtime +$STALE_THRESHOLD_DAYS 2>/dev/null | while read -r file; do
  if ! grep -q "status:.*resolved" "$file"; then
    echo "STALE: Abandoned debug session: $file"
  fi
done

# Find incomplete spikes (DESIGN.md without DECISION.md)
find .planning/spikes -name 'DESIGN.md' 2>/dev/null | while read -r file; do
  dir=$(dirname "$file")
  if [ ! -f "$dir/DECISION.md" ]; then
    echo "STALE: Incomplete spike: $dir"
  fi
done
```

### Version Comparison (for migration detection)

```bash
# Compare installed version vs project version
INSTALLED=$(cat ~/.claude/get-shit-done/VERSION 2>/dev/null || echo "0.0.0")
PROJECT=$(cat .planning/config.json 2>/dev/null | grep -o '"gsd_reflect_version"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '[0-9][0-9.]*' || echo "0.0.0")

# Simple numeric comparison (split on dots)
IFS='.' read -r inst_major inst_minor inst_patch <<< "$INSTALLED"
IFS='.' read -r proj_major proj_minor proj_patch <<< "$PROJECT"

if [ "$inst_major" -gt "$proj_major" ] 2>/dev/null || \
   ([ "$inst_major" -eq "$proj_major" ] && [ "$inst_minor" -gt "$proj_minor" ]) 2>/dev/null || \
   ([ "$inst_major" -eq "$proj_major" ] && [ "$inst_minor" -eq "$proj_minor" ] && [ "$inst_patch" -gt "$proj_patch" ]) 2>/dev/null; then
  echo "UPGRADE AVAILABLE: $PROJECT -> $INSTALLED"
fi
```

### DevOps Detection Pattern

```bash
# Detect existing DevOps configuration
DEVOPS_SIGNALS=""

# CI/CD
[ -d ".github/workflows" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS github-actions"
[ -f ".gitlab-ci.yml" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS gitlab-ci"
[ -f ".circleci/config.yml" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS circleci"
[ -f "Jenkinsfile" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS jenkins"

# Deployment
[ -f "vercel.json" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS vercel"
[ -f "Dockerfile" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS docker"
[ -f "fly.toml" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS fly-io"
[ -f "railway.json" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS railway"

# Git hygiene
[ ! -f ".gitignore" ] && DEVOPS_SIGNALS="$DEVOPS_SIGNALS NO-GITIGNORE"

# Commit convention (check last 20 commits)
CONVENTIONAL=$(git log --oneline -20 2>/dev/null | grep -cE "^[a-f0-9]+ (feat|fix|chore|docs|style|refactor|test|ci|build|perf)\(" || echo "0")
TOTAL=$(git log --oneline -20 2>/dev/null | wc -l | tr -d ' ')
if [ "$TOTAL" -gt "0" ] && [ "$CONVENTIONAL" -gt "$((TOTAL / 2))" ]; then
  DEVOPS_SIGNALS="$DEVOPS_SIGNALS conventional-commits"
fi

echo "$DEVOPS_SIGNALS"
```

### Health Check Output Format (Hybrid)

```markdown
## Workspace Health Report
**Project:** my-app | **Version:** 1.12.0 | **Date:** 2026-02-09

### KB Integrity [PASS]
- [x] Index exists and is parseable (47 entries)
- [x] Signal count matches: 23 indexed, 23 on disk
- [x] Spike count matches: 12 indexed, 12 on disk
- [x] Lesson count matches: 12 indexed, 12 on disk
- [x] No frontmatter parse errors

### Config Validity [WARNING]
- [x] config.json parseable
- [x] Required fields present (mode, depth, workflow)
- [ ] Missing new field: health_check (use --fix to add defaults)
- [ ] Missing new field: gsd_reflect_version (use --fix to set)

### Stale Artifacts [FAIL]
- [ ] 2 orphaned .continue-here files (older than 7 days)
  - .planning/phases/03-spike-runner/.continue-here.md (14 days old)
  - .planning/phases/04-reflection-engine/.continue-here.md (10 days old)
- [ ] 1 abandoned debug session
  - .planning/debug/auth-loop.md (no resolution, 21 days old)
- [x] No incomplete spikes

### Summary
**4 checks passed** | **1 warning** | **1 failure**

Run `/gsd:health-check --fix` to auto-repair.
```

### Migration Log Format

```markdown
# Migration Log

Tracks version upgrades applied to this project.

## 1.11.1 -> 1.12.0 (2026-02-10T14:30:00Z)

### Changes Applied
- Added `gsd_reflect_version: "1.12.0"` to config.json
- Added `health_check` section to config.json (frequency: milestone-only)
- Added `devops` section to config.json (defaults)

### User Choices
- Health check frequency: milestone-only
- DevOps context: skipped (greenfield project)

---

## Pre-tracking -> 1.11.1 (2026-02-10T14:30:00Z)

### Changes Applied
- Established version tracking (gsd_reflect_version field)
- All existing config preserved, new fields added with defaults

---

*Log is append-only. Each migration is recorded when applied.*
```

## State of the Art

| Concern | Current State | Phase 6 Approach | Impact |
|---------|--------------|-----------------|--------|
| No version tracking | config.json has no version field | Add `gsd_reflect_version` field | Enables migration detection |
| No health validation | Users discover issues manually | Automated health-check command | Proactive issue detection |
| No DevOps context | Initialization skips DevOps | Adaptive DevOps questions round | Better CI-aware planning |
| Upstream README | README is upstream GSD's | Fork-specific README | Clear identity |
| No stale artifact cleanup | .continue-here files accumulate | Health check detects and flags | Cleaner workspace |
| Version upgrade is manual | Users must re-initialize for new features | Auto-detect + mini-onboarding migration | Seamless feature adoption |

## Open Questions

1. **Auto-detect hook vs workflow integration**
   - What we know: A SessionStart hook (like gsd-check-update.js) can check version on every session start. But we also cannot modify existing commands to call a version check.
   - What's unclear: Whether the hook should silently cache the result (and commands check the cache) or actively display a migration prompt.
   - Recommendation: Hook writes to cache file (`~/.claude/cache/gsd-version-check.json`). The statusline or a notification on session start can indicate migration available. The actual migration runs via `/gsd:upgrade-project` or when `/gsd:health-check` detects it. This keeps the hook non-intrusive and follows the gsd-check-update.js pattern exactly.

2. **DevOps context storage location**
   - What we know: PROJECT.md is the canonical project context document. config.json holds preferences. DevOps context is a mix of both (CI provider = factual context; commit convention = preference).
   - What's unclear: Whether to split across both files or consolidate.
   - Recommendation: Store in config.json as a `devops` section. Reasoning: config.json is machine-readable (easy for agents to parse), already extended in every phase, and DevOps context is more "operational preference" than "project vision." PROJECT.md references config.json for operational details.

3. **Codebase mapper DevOps focus**
   - What we know: The concerns mapper already has sections for "Missing Critical Features" and "Test Coverage Gaps." DevOps gaps are similar in nature.
   - What's unclear: Whether to add a new mapper focus or extend concerns.
   - Recommendation: Extend the concerns template with a "## DevOps Gaps" section. Add detection patterns to the concerns mapper's exploration step (additive to the shell commands it runs). This is a natural fit and doesn't require a new mapper focus area.

4. **CHANGELOG.md replacement vs coexistence**
   - What we know: Current CHANGELOG.md is upstream GSD's changelog. The install script copies it to `~/.claude/get-shit-done/CHANGELOG.md`. The `/gsd:update` command reads it.
   - What's unclear: Whether to replace entirely or keep upstream changelog accessible.
   - Recommendation: Replace CHANGELOG.md with GSD Reflect's own changelog. Add a note at the top: "For upstream GSD changelog, see [link]." The /gsd:update command already points to the fork's npm package, so it should show the fork's changelog.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: All files in `/Users/rookslog/Development/get-shit-done-reflect/` examined directly
- Established patterns verified from: `commands/gsd/collect-signals.md`, `commands/gsd/signal.md`, `commands/gsd/settings.md`, `commands/gsd/update.md`, `commands/gsd/new-project.md`
- KB infrastructure verified from: `.claude/agents/kb-rebuild-index.sh`, `.claude/agents/knowledge-store.md`
- Config patterns verified from: `.planning/config.json`, `get-shit-done/templates/config.json`, `get-shit-done/references/planning-config.md`
- Test patterns verified from: `tests/integration/kb-infrastructure.test.js`, `tests/helpers/tmpdir.js`, `vitest.config.js`
- Fork constraint verified from: `.planning/STATE.md` decisions section
- Hook patterns verified from: `hooks/gsd-check-update.js`, `hooks/gsd-statusline.js`
- Install script verified from: `bin/install.js`
- Phase 6 context verified from: `.planning/phases/06-production-readiness/06-CONTEXT.md`

### Secondary (MEDIUM confidence)
- None needed -- all findings derived from direct codebase analysis

### Tertiary (LOW confidence)
- None -- no external research required for this phase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No external libraries; all patterns verified from existing codebase
- Architecture: HIGH - File map derived directly from established patterns in prior phases
- Pitfalls: HIGH - Derived from fork constraint analysis and established project conventions
- Code examples: HIGH - All based on existing shell script patterns (kb-rebuild-index.sh) and config patterns

**Research date:** 2026-02-09
**Valid until:** 2026-03-09 (stable -- internal codebase patterns, no external dependencies)
