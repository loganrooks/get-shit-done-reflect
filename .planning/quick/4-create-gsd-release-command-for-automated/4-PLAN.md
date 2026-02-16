---
phase: quick-4
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - commands/gsd/release.md
  - get-shit-done/workflows/release.md
  - get-shit-done/workflows/help.md
autonomous: true

must_haves:
  truths:
    - "User can run /gsd:release patch and get version bumped, changelog updated, tag created, and GitHub Release published without manual steps"
    - "User can run /gsd:release with no argument and get a smart recommendation based on commit history"
    - "Dirty working tree or wrong branch aborts with clear error before any mutations"
  artifacts:
    - path: "commands/gsd/release.md"
      provides: "Thin orchestrator command entry point"
      contains: "gsd:release"
    - path: "get-shit-done/workflows/release.md"
      provides: "Self-contained release workflow with all steps"
      contains: "gh release create"
    - path: "get-shit-done/workflows/help.md"
      provides: "Updated command reference including release"
      contains: "gsd:release"
  key_links:
    - from: "commands/gsd/release.md"
      to: "get-shit-done/workflows/release.md"
      via: "execution_context @reference"
      pattern: "workflows/release\\.md"
    - from: "get-shit-done/workflows/release.md"
      to: "package.json"
      via: "node -p to read version, node -e to write version"
      pattern: "package\\.json"
    - from: "get-shit-done/workflows/release.md"
      to: ".github/workflows/publish.yml"
      via: "gh release create triggers publish workflow"
      pattern: "gh release create"
---

<objective>
Create the `/gsd:release` command for automated version bump, changelog update, git tag, and GitHub Release creation.

Purpose: Eliminate manual release steps. Currently releasing requires editing package.json, updating CHANGELOG.md, creating a tag, pushing, and creating a GitHub Release by hand. This command automates the entire flow with safety checks.

Output: Two new files (command + workflow) and one updated file (help reference).
</objective>

<execution_context>
@./.claude/get-shit-done/workflows/execute-plan.md
@./.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md

Existing patterns to follow:
@commands/gsd/quick.md (command file pattern: frontmatter + objective + execution_context + process)
@get-shit-done/workflows/quick.md (workflow file pattern: purpose + required_reading + process steps + success_criteria)
@commands/gsd/new-milestone.md (another command example with argument-hint)

Key references for workflow logic:
@package.json (current version: 1.14.1, version field location)
@CHANGELOG.md (format: ## [X.Y.Z] - YYYY-MM-DD with ### Added/Changed/Fixed sections, [Unreleased] section at top)
@.github/workflows/publish.yml (triggered by GitHub Release publish event, verifies package.json version matches tag)
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create command file and workflow file</name>
  <files>
    commands/gsd/release.md
    get-shit-done/workflows/release.md
  </files>
  <action>
Create the thin orchestrator command file at `commands/gsd/release.md` following the exact pattern from `commands/gsd/new-milestone.md`:

**Command file (`commands/gsd/release.md`):**
- Frontmatter: name `gsd:release`, description "Bump version, update changelog, tag, and create GitHub Release", argument-hint "[patch|minor|major]"
- allowed-tools: Read, Write, Edit, Bash, Glob, Grep, AskUserQuestion (NO Task tool -- this is a direct-execution workflow, not an orchestrator that spawns subagents)
- Objective: Automate the full release cycle. Usage: `/gsd:release [patch|minor|major]`. If bump type provided, skip recommendation. If omitted, analyze commits and recommend.
- execution_context: `@~/.claude/get-shit-done/workflows/release.md`
- context: `@package.json`, `@CHANGELOG.md`
- process: "Execute the release workflow from @~/.claude/get-shit-done/workflows/release.md end-to-end. Pass $ARGUMENTS as bump type (may be empty)."

**Workflow file (`get-shit-done/workflows/release.md`):**

Create a self-contained workflow (NO large reference file imports) with these steps:

Step 1 - Pre-flight checks:
- Verify working tree is clean: `git status --porcelain` must be empty. If dirty, abort with: "Working tree is dirty. Commit or stash changes first."
- Verify current branch: `git branch --show-current` must be `main`. If not, abort with: "Must be on main branch to release. Current branch: {branch}"
- Verify remote is up to date: `git fetch origin main && git diff HEAD origin/main --quiet`. If diverged, abort with: "Local main is behind origin. Pull first."

Step 2 - Determine bump type:
- Read current version from package.json: `node -p "require('./package.json').version"`
- If $ARGUMENTS contains "patch", "minor", or "major", use that directly as bump type.
- If $ARGUMENTS is empty: analyze commits since last tag using `git log $(git describe --tags --abbrev=0)..HEAD --oneline`. Categorize:
  - Commits starting with `fix:` or `fix(` count toward patch
  - Commits starting with `feat:` or `feat(` count toward minor
  - Commits containing `BREAKING CHANGE` or starting with `feat!:` or `fix!:` count toward major
  - Default to patch if no conventional commits found
  - Show the categorized commits and recommendation to user via AskUserQuestion: "Recommended bump: {type}. Commits since last tag:\n{commit list}\n\nProceed with {type}? (yes/patch/minor/major/abort)"
  - If user says "abort", stop immediately.
  - If user specifies a different bump type, use that instead.

Step 3 - Compute new version:
- Parse current version X.Y.Z
- Apply bump: patch increments Z, minor increments Y and resets Z to 0, major increments X and resets Y and Z to 0
- Store as NEW_VERSION

Step 4 - Dry-run summary:
- Display to user (NOT via AskUserQuestion, just output):
  ```
  Release Summary:
    Current version: X.Y.Z
    New version:     A.B.C
    Bump type:       {type}
    Tag:             vA.B.C
    Branch:          main
  ```
- Then use AskUserQuestion to confirm: "Proceed with release vA.B.C? (yes/abort)"
- If abort, stop.

Step 5 - Bump version in package.json:
- Use `node -e "const p=require('./package.json'); p.version='${NEW_VERSION}'; require('fs').writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n')"` to update version
- Verify with `node -p "require('./package.json').version"` -- must match NEW_VERSION

Step 6 - Update CHANGELOG.md:
- Read CHANGELOG.md
- Find the `## [Unreleased]` line
- Find the content between `## [Unreleased]` and the next `## [` line -- this is the unreleased content
- Replace `## [Unreleased]` section with:
  ```
  ## [Unreleased]

  ## [A.B.C] - YYYY-MM-DD
  ```
  where YYYY-MM-DD is today's date
- The unreleased content goes under the new version header (between `## [A.B.C]` and the previous version header)
- If unreleased content is empty (no changes listed), add a placeholder: extract key commits from `git log` and create appropriate ### sections
- Use Edit tool to make these changes

Step 7 - Commit, tag, push:
- `git add package.json CHANGELOG.md`
- `git commit -m "release: v${NEW_VERSION}"`
- `git tag -a "v${NEW_VERSION}" -m "v${NEW_VERSION}"`
- `git push origin main`
- `git push origin "v${NEW_VERSION}"`

Step 8 - Create GitHub Release:
- Extract the changelog section for this version (content between `## [A.B.C]` and next `## [` header) into a temp file
- `gh release create "v${NEW_VERSION}" --title "v${NEW_VERSION}" --notes-file /tmp/release-notes-${NEW_VERSION}.md`
- This triggers publish.yml which handles npm publish

Step 9 - Completion output:
```
---
Release v${NEW_VERSION} complete!

  package.json: ${NEW_VERSION}
  CHANGELOG.md: updated
  Git tag:      v${NEW_VERSION}
  GitHub Release: https://github.com/loganrooks/get-shit-done-reflect/releases/tag/v${NEW_VERSION}

  npm publish will be triggered automatically by the GitHub Release.
  Monitor: https://github.com/loganrooks/get-shit-done-reflect/actions
---
```

Success criteria in the workflow:
- [ ] Pre-flight checks pass (clean tree, main branch, up to date)
- [ ] Version bumped in package.json
- [ ] CHANGELOG.md updated with new version section and today's date
- [ ] Git commit created with message "release: vX.Y.Z"
- [ ] Annotated git tag vX.Y.Z created
- [ ] Commit and tag pushed to origin
- [ ] GitHub Release created (triggers npm publish via publish.yml)
  </action>
  <verify>
    Verify both files exist and have correct structure:
    - `test -f commands/gsd/release.md` succeeds
    - `test -f get-shit-done/workflows/release.md` succeeds
    - Command file has frontmatter with name, description, argument-hint, allowed-tools
    - Command file references workflow via execution_context
    - Workflow file has all 9 steps
    - Workflow file contains `git tag`, `gh release create`, `git push` commands
    - Workflow file contains pre-flight checks (clean tree, main branch)
    - Workflow file is self-contained (no @references to large files)
  </verify>
  <done>
    Both files exist with complete content. Command file follows thin orchestrator pattern. Workflow file contains all 9 steps: pre-flight, determine bump, compute version, dry-run summary, bump package.json, update CHANGELOG, commit+tag+push, create GitHub Release, completion output.
  </done>
</task>

<task type="auto">
  <name>Task 2: Register release command in help reference</name>
  <files>get-shit-done/workflows/help.md</files>
  <action>
Update `get-shit-done/workflows/help.md` to include the release command. Commands are auto-discovered by Claude Code from the `commands/gsd/` directory, but the help workflow contains a manually-maintained command reference that users see when they run `/gsd:help`.

Add the release command in a logical location. The best spot is after the "Milestone Management" section (after `/gsd:complete-milestone`) since releasing is closely related to milestone completion. Add a new subsection:

```markdown
### Release

**`/gsd:release [patch|minor|major]`**
Automate version bump, changelog update, git tag, and GitHub Release.

- Bumps version in package.json (patch/minor/major)
- Moves [Unreleased] changelog content under new version header
- Creates annotated git tag and pushes to origin
- Creates GitHub Release (triggers npm publish via CI)
- If bump type omitted, analyzes commits and recommends

Safety: Verifies clean working tree, main branch, and up-to-date remote before any mutations.

Usage: `/gsd:release patch` (explicit bump)
Usage: `/gsd:release` (auto-detect from commits)
```

Use the Edit tool to insert this section. Ensure it follows the exact formatting pattern of other command entries in the file (bold command name, description line, bullet list of features, usage examples).
  </action>
  <verify>
    - `grep -c "gsd:release" get-shit-done/workflows/help.md` returns at least 1
    - The help file still renders correctly (no broken markdown)
    - The release command section follows the same formatting as other command entries
  </verify>
  <done>
    Help reference includes `/gsd:release` command entry with description, feature bullets, safety note, and usage examples. Entry is positioned after Milestone Management section.
  </done>
</task>

</tasks>

<verification>
1. Command file exists at `commands/gsd/release.md` with valid frontmatter
2. Workflow file exists at `get-shit-done/workflows/release.md` with all 9 steps
3. Help reference at `get-shit-done/workflows/help.md` includes `/gsd:release` entry
4. Command file references workflow file correctly
5. Workflow contains pre-flight safety checks (clean tree, main branch, remote sync)
6. Workflow contains version bump logic for all three bump types
7. Workflow contains CHANGELOG update logic matching existing format
8. Workflow contains `gh release create` which triggers publish.yml
</verification>

<success_criteria>
- `/gsd:release patch` would successfully: validate pre-flight, bump version, update changelog, commit, tag, push, create GitHub Release
- `/gsd:release` (no arg) would: analyze commits, recommend bump type, confirm with user, then execute same flow
- `/gsd:help` output includes the release command with usage examples
- All three files pass structural validation (frontmatter, step numbering, markdown formatting)
</success_criteria>

<output>
After completion, create `.planning/quick/4-create-gsd-release-command-for-automated/4-SUMMARY.md`
</output>
