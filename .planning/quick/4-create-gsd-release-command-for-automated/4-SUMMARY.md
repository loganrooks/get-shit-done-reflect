---
phase: quick-4
plan: 01
subsystem: release-automation
tags: [release, versioning, changelog, github-release, npm-publish]
dependency-graph:
  requires: []
  provides: ["/gsd:release command", "automated release workflow"]
  affects: ["future releases", "npm publish pipeline"]
tech-stack:
  added: []
  patterns: ["thin orchestrator command", "self-contained workflow with LLM steps"]
key-files:
  created:
    - commands/gsd/release.md
    - get-shit-done/workflows/release.md
  modified:
    - get-shit-done/workflows/help.md
decisions:
  - id: "q4-d1"
    decision: "Release command uses AskUserQuestion for bump confirmation and dry-run approval"
    reasoning: "Matches pattern from other GSD commands; prevents accidental releases"
metrics:
  duration: "~2min"
  completed: "2026-02-16"
---

# Quick Task 4: Create /gsd:release Command Summary

**One-liner:** Automated release workflow with pre-flight safety, smart bump detection, changelog formatting, git tagging, and GitHub Release creation

## What Was Done

### Task 1: Create command file and workflow file (17d26ea)

Created the thin orchestrator command at `commands/gsd/release.md`:
- YAML frontmatter with name `gsd:release`, description, argument-hint `[patch|minor|major]`
- Allowed tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion (no Task tool)
- Execution context references `@~/.claude/get-shit-done/workflows/release.md`
- Context includes package.json and CHANGELOG.md
- Process delegates entirely to the workflow file

Created the self-contained workflow at `get-shit-done/workflows/release.md` with 9 steps:
1. **Pre-flight checks** -- clean working tree, main branch, remote sync
2. **Determine bump type** -- from argument or auto-detect via conventional commits
3. **Compute new version** -- semver arithmetic for patch/minor/major
4. **Dry-run summary** -- display release plan, confirm with user
5. **Bump version** -- update package.json via node one-liner
6. **Update CHANGELOG** -- move [Unreleased] content under new version header with date
7. **Commit, tag, push** -- release commit, annotated tag, push both to origin
8. **Create GitHub Release** -- `gh release create` with extracted changelog notes
9. **Completion output** -- summary with links to release and CI monitor

### Task 2: Register release command in help reference (7902519)

Updated `get-shit-done/workflows/help.md`:
- Added "Release" subsection after "Milestone Management" (before "Progress Tracking")
- Follows exact formatting pattern: bold command name, description, bullet list, safety note, usage examples
- 3 occurrences of `gsd:release` in the help file (command name, two usage examples)

## Deviations from Plan

None -- plan executed exactly as written.

## Verification Results

All 8 verification criteria passed:
1. Command file exists at `commands/gsd/release.md` with valid frontmatter
2. Workflow file exists at `get-shit-done/workflows/release.md` with all 9 steps
3. Help reference includes `/gsd:release` entry (3 occurrences)
4. Command file references workflow file correctly (2 references)
5. Workflow contains pre-flight safety checks (clean tree, main branch, remote sync)
6. Workflow contains version bump logic for all three bump types
7. Workflow contains CHANGELOG update logic matching existing format
8. Workflow contains `gh release create` which triggers publish.yml

## Commits

| # | Hash | Message | Files |
|---|------|---------|-------|
| 1 | 17d26ea | feat(quick-4): create /gsd:release command and workflow | commands/gsd/release.md, get-shit-done/workflows/release.md |
| 2 | 7902519 | docs(quick-4): register /gsd:release in help reference | get-shit-done/workflows/help.md |
