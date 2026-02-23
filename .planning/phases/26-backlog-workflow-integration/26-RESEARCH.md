# Phase 26: Backlog Workflow Integration - Research

**Researched:** 2026-02-23
**Domain:** Workflow integration (new-milestone, check-todos, complete-milestone) with existing backlog CLI, schema extension, data reader audit
**Confidence:** HIGH

## Summary

Phase 26 connects the backlog system (built in Phase 25) into three existing GSD workflows: `/gsd:new-milestone`, `/gsd:check-todos`, and `/gsd:complete-milestone`. The backlog CLI (`backlog add`, `list`, `group`, `promote`, `update`, `stats`, `index`) already provides all CRUD primitives. Phase 26's work is: (1) extend the backlog schema with a `milestone` field so promoted items track which milestone they belong to, (2) extend `cmdBacklogPromote` to accept `--milestone` alongside `--to`, (3) modify three workflow `.md` files to read backlog data and present it at the right integration points, and (4) enumerate and verify every code path that reads todo/backlog data to prevent the v1.14 data-loss pattern.

The implementation is split between gsd-tools.js code changes (schema extension, promote enhancement -- testable via TDD) and workflow instruction file changes (Markdown files that direct agent behavior -- not unit-testable but verifiable via smoke runs). The workflow changes follow existing patterns: AskUserQuestion with multiSelect for the new-milestone backlog picker, additional action options in check-todos, and a new step in complete-milestone.

**Primary recommendation:** Implement as 3 plans: Plan 01 (TDD) extends gsd-tools.js with `milestone` field and promote enhancements; Plan 02 modifies the three workflow .md files for BINT-01/03/04; Plan 03 handles BINT-05 (full reader enumeration and verification with tests).

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | N/A | File read/write for backlog item updates | Already used in all Phase 25 backlog commands |
| `extractFrontmatter()` | In-tree (line 252) | Parse YAML frontmatter when reading backlog items | Handles all needed types, battle-tested |
| `reconstructFrontmatter()` | In-tree (line 327) | Serialize frontmatter back when updating items | Handles null-as-string pattern for `promoted_to` |
| `readBacklogItems()` | In-tree (line 3679) | Shared reader returning parsed backlog items | Central reader -- extend, don't duplicate |
| `cmdBacklogPromote()` | In-tree (line 3891) | Set status to `planned` and link to requirement | Extend with `--milestone` parameter |
| `node:test` + `node:assert` | N/A | Test framework for TDD | Already used, 143 tests passing (28 backlog) |

### Supporting

| Library | Purpose | When to Use |
|---------|---------|-------------|
| `cmdBacklogGroup()` (line 3856) | Group items by theme/tags for milestone scoping UX | Called from new-milestone workflow to display grouped backlog |
| `cmdBacklogList()` (line 3762) | Filter items by priority/status/tags | Called from check-todos workflow to show promotable items |
| `cmdBacklogUpdate()` (line 3779) | Update individual item fields | Called when deferring/discarding items during milestone completion |
| `regenerateBacklogIndex()` (line 3945) | Silent index rebuild after mutations | Auto-called by promote/update -- no workflow change needed |
| `cmdBacklogStats()` (line 3833) | Aggregate counts by status/priority | Useful for complete-milestone backlog summary display |
| `getMilestoneInfo()` (line 3995) | Extract current milestone version from ROADMAP.md | Needed when auto-populating milestone field during promote |
| `AskUserQuestion` | Agent tool for interactive user input | Used in all three workflow integration points |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `milestone` field in frontmatter | Storing milestone association in ROADMAP.md | Keeping it in the backlog item is self-contained; ROADMAP.md association would couple two systems and require cross-file parsing. Use frontmatter field. |
| Batch promote gsd-tools command | Sequential individual `backlog promote` calls from workflow | A batch command would be more efficient for multi-select, but individual calls are simpler, already tested, and N is small (typically <10 items). Use sequential promotes from workflow instructions. |
| New `init backlog` gsd-tools command | Calling `backlog list` and `backlog group` separately from workflow | A combined init command would reduce tool calls, but adds code for a one-time use. The workflow can call `backlog group --by theme` then `backlog group --by tags` with existing commands. Keep it simple. |
| Filter backlog in workflow instructions | New `backlog list --status captured,triaged` multi-status filter | Current `backlog list --status X` only accepts one status. Could extend to accept comma-separated statuses. Worth doing for complete-milestone backlog review (BINT-04). |

## Architecture Patterns

### Integration Point Map

```
/gsd:new-milestone (new-milestone.md)
  Step 1: Load Context         (existing)
  Step 1b: Read Backlog  <<<   (NEW - BINT-01)
  Step 2: Gather Goals         (existing, now backlog-aware)
  ...
  Step 9: Define Requirements  (existing)
  Step 9b: Promote Selected <<< (NEW - BINT-02, after REQ-IDs exist)
  ...

/gsd:check-todos (check-todos.md)
  offer_actions step:
    + "Promote to backlog" <<< (NEW - BINT-03)
  parse_filter step:
    + priority/status filter <<< (NEW - BINT-03)

/gsd:complete-milestone (complete-milestone.md)
  After evolve_project step:
    + Backlog Review     <<<   (NEW - BINT-04)
    (before archive/git steps)
```

### Pattern 1: Backlog-Aware Milestone Scoping (BINT-01)

**What:** During `/gsd:new-milestone`, after loading project context but before gathering goals, read and display backlog items grouped by theme/tags so the user can select items for the new milestone scope.

**When to use:** Every new-milestone workflow execution (Step 1b, before Step 2).

**Workflow instruction pattern:**
```markdown
## 1b. Review Backlog Items

Read backlog items to inform milestone scoping:

\`\`\`bash
BACKLOG_GROUPS=$(node ~/.claude/get-shit-done/bin/gsd-tools.js backlog group --by theme --raw)
BACKLOG_STATS=$(node ~/.claude/get-shit-done/bin/gsd-tools.js backlog stats --raw)
\`\`\`

Parse BACKLOG_STATS for `total` count. If total is 0, skip to Step 2.

If items exist, present grouped by theme:

\`\`\`
## Backlog Items ([total] items)

### [Theme 1]
- [HIGH] [Title 1] (tags: auth, security)
- [MEDIUM] [Title 2] (tags: auth)

### [Theme 2]
- [LOW] [Title 3] (tags: ui)

### (no theme)
- [MEDIUM] [Title 4]
\`\`\`

Use AskUserQuestion (multiSelect: true):
- header: "Milestone Scope"
- question: "Select backlog items to include in this milestone:"
- options: [one per item, formatted as "[PRIORITY] Title (theme/tags)"]
- Include "None — start fresh" option

Track selected item IDs for Step 9b.
```

**Critical ordering note:** Selected items are NOT promoted yet. They are tracked as "selected for milestone scope" and used to inform requirement definition in Step 9. Promotion (BINT-02) happens AFTER requirement IDs are generated.

### Pattern 2: Two-Phase Promote (BINT-02)

**What:** After requirements are defined (Step 9), promote each selected backlog item by setting `status: planned`, `milestone: vX.Y`, and `promoted_to: <REQ-ID>`.

**When to use:** During Step 9b of new-milestone, after REQUIREMENTS.md is written.

**Workflow instruction pattern:**
```markdown
## 9b. Promote Selected Backlog Items

For each backlog item selected in Step 1b:

1. Match item to the generated requirement it most closely maps to
2. Promote with milestone version and requirement ID:

\`\`\`bash
node ~/.claude/get-shit-done/bin/gsd-tools.js backlog promote <item-id> --to <REQ-ID> --milestone v[X.Y]
\`\`\`

Present mapping for confirmation:

\`\`\`
## Backlog Items Promoted

| Backlog Item | Requirement | Milestone |
|--------------|-------------|-----------|
| [Title 1] | AUTH-01 | v1.2 |
| [Title 2] | NOTIF-03 | v1.2 |
\`\`\`
```

**gsd-tools.js change required:** `cmdBacklogPromote` must accept `--milestone` parameter and write it to frontmatter.

### Pattern 3: Todo-to-Backlog Promotion (BINT-03)

**What:** In `/gsd:check-todos`, add a "Promote to backlog" action that creates a backlog item from a todo and optionally marks the todo as done.

**When to use:** When the user selects a todo and wants to elevate it to the backlog system.

**Workflow instruction pattern:**
```markdown
## In offer_actions step, add option:

**If todo is pending:**

- "Promote to backlog" — create structured backlog item from this todo

**Promote to backlog action:**

\`\`\`bash
node ~/.claude/get-shit-done/bin/gsd-tools.js backlog add \
  --title "[todo title]" \
  --tags "[todo area]" \
  --priority [todo priority or MEDIUM] \
  --source "command" \
  --theme "[inferred from area]"
\`\`\`

Use AskUserQuestion:
- header: "Todo Status"
- question: "Todo promoted to backlog. Mark original todo as done?"
- options:
  - "Yes — mark done" → mv to done/
  - "No — keep in pending" → leave as-is

Report: "Backlog item created: [id]. Todo [kept/completed]."
```

### Pattern 4: Milestone Backlog Review (BINT-04)

**What:** During `/gsd:complete-milestone`, surface un-promoted backlog items and ask the user to keep, defer, or discard each.

**When to use:** After evolving PROJECT.md, before archiving and git operations.

**Workflow instruction pattern:**
```markdown
## Post-Evolve: Backlog Review

\`\`\`bash
BACKLOG_LIST=$(node ~/.claude/get-shit-done/bin/gsd-tools.js backlog list --raw)
\`\`\`

Filter items where status is NOT `planned` and NOT `done` (i.e., captured or triaged items).

If unpromoted items exist:

\`\`\`
## Backlog Review

[N] backlog items were not promoted during this milestone:

| # | Priority | Title | Status | Tags |
|---|----------|-------|--------|------|
| 1 | HIGH | [title] | captured | [tags] |
| 2 | MEDIUM | [title] | triaged | [tags] |
\`\`\`

For each item (or batch), AskUserQuestion:
- "Keep" — no change, carries forward
- "Defer" — status: deferred
- "Discard" — status: done (marks as handled)

Apply updates:
\`\`\`bash
node ~/.claude/get-shit-done/bin/gsd-tools.js backlog update <id> --status deferred
\`\`\`
```

### Anti-Patterns to Avoid

- **Promoting backlog items before requirement IDs exist:** The promote must happen AFTER Step 9 generates REQUIREMENTS.md with REQ-IDs. If done in Step 2, there are no REQ-IDs to link to. Use two-phase approach: select in Step 1b, promote in Step 9b.
- **Replacing the todo system with backlog promotion:** BINT-03 adds an OPTION to promote, not a requirement. Todos remain the quick-capture system. Backlog is the structured idea system. Users choose when to bridge them.
- **Making backlog review blocking in complete-milestone:** The review should be skippable. If user says "skip" or there are 0 unpromoted items, proceed to archive. Don't gate milestone completion on backlog triage.
- **Duplicating readBacklogItems logic in workflows:** The workflow should call existing CLI commands (`backlog list`, `backlog group`, `backlog stats`) rather than reimplementing file reads in bash. Phase 25 built these commands specifically for programmatic consumption.
- **Modifying the installed copy:** Per Phase 24/25 pattern, ALL code changes go to `get-shit-done/bin/gsd-tools.js` (source), NOT `.claude/get-shit-done/bin/gsd-tools.js` (installed). Similarly, workflow changes go to `get-shit-done/workflows/*.md` (source), not `.claude/get-shit-done/workflows/*.md`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Backlog item reading | Custom file scanner in workflow | `backlog list --raw` / `backlog group --raw` | Already tested, handles all edge cases, outputs JSON |
| Milestone version detection | Parse ROADMAP.md in bash | `getMilestoneInfo()` in gsd-tools.js | Already implemented, handles missing files gracefully |
| Priority sorting/grouping | Sort in workflow instructions | `backlog group --by theme` / `backlog group --by tags` | Already sorts by priority within groups |
| Backlog stats aggregation | Count files manually | `backlog stats --raw` | Already aggregates local + global, by status/priority |
| Todo-to-backlog conversion | Manual frontmatter construction | `backlog add --title X --tags Y --priority Z` | Already handles slug generation, collision avoidance, index regeneration |
| Item status updates | Direct file editing in workflow | `backlog update <id> --status deferred` | Already handles frontmatter reconstruction, index regeneration |

**Key insight:** Phase 25 built a complete CLI API specifically so Phase 26 could integrate via shell commands from workflow instructions. The code changes in Phase 26 are minimal (add `milestone` field, extend promote). The bulk of the work is workflow instruction editing.

## Common Pitfalls

### Pitfall 1: Promote Timing in new-milestone Workflow
**What goes wrong:** Backlog items are promoted to `status: planned` with `promoted_to: <REQ-ID>` before requirements are defined, resulting in null/undefined REQ-IDs.
**Why it happens:** Intuition says "select items and promote immediately." But requirement IDs don't exist until Step 9 of new-milestone.
**How to avoid:** Two-phase approach: (1) SELECT items in Step 1b, storing their IDs temporarily; (2) PROMOTE items in Step 9b, after REQUIREMENTS.md is written and REQ-IDs are generated.
**Warning signs:** `promoted_to: null` or `promoted_to: undefined` in backlog items after milestone creation.

### Pitfall 2: String 'null' for New milestone Field
**What goes wrong:** The new `milestone` field is stored as JavaScript `null`, which `reconstructFrontmatter()` skips entirely, resulting in the field being silently dropped from the file.
**Why it happens:** Phase 25 documented this: `reconstructFrontmatter` null-skipping behavior. `promoted_to` uses string `'null'` to survive serialization. The new `milestone` field must follow the same pattern.
**How to avoid:** In `cmdBacklogAdd`, set `milestone: 'null'` (string). In `cmdBacklogPromote`, set `milestone: version` (actual value). In `readBacklogItems`, handle both `'null'` string and actual values.
**Warning signs:** Missing `milestone` key in backlog item files after add/update operations.

### Pitfall 3: Duplicate Items in Multi-Select from Tag Grouping
**What goes wrong:** When displaying backlog items grouped by tags, an item with multiple tags appears in multiple groups. User selects it from two groups, causing a duplicate promote attempt.
**Why it happens:** Phase 25 decision: "Items appear in multiple tag groups when they have multiple tags (not deduplicated)."
**How to avoid:** After collecting multi-select responses, deduplicate by item ID before promoting. The workflow instructions must explicitly state: "Deduplicate selected items by ID before promotion."
**Warning signs:** Same backlog item promoted twice, or promote error "item already planned."

### Pitfall 4: check-todos Workflow Missing Backlog Init Data
**What goes wrong:** The check-todos workflow calls `init todos` which returns todo data but no backlog data. The "promote to backlog" action needs to create a backlog item, but the workflow doesn't know if backlog directories exist.
**Why it happens:** `cmdInitTodos` doesn't include any backlog context.
**How to avoid:** Either (a) extend `cmdInitTodos` to include `backlog_exists` flag, or (b) rely on `backlog add` creating directories automatically (it already calls `fs.mkdirSync(itemsDir, { recursive: true })`). Option (b) is simpler and already works. No init change needed.
**Warning signs:** None -- `backlog add` handles directory creation. This pitfall is already mitigated by Phase 25's implementation.

### Pitfall 5: Backlog Review Blocking Milestone Completion
**What goes wrong:** The backlog review step in complete-milestone becomes a mandatory gate, and users with many backlog items can't complete the milestone without triaging every item.
**Why it happens:** Implementing the review as a blocking step without a "skip" option.
**How to avoid:** Always offer "Skip backlog review" as the first option. Only present items if total > 0. If count is high (>10), offer batch options ("Defer all", "Keep all") instead of per-item triage.
**Warning signs:** User frustration during milestone completion, long review cycles.

### Pitfall 6: Source vs Installed Copy Confusion (Inherited from Phase 25)
**What goes wrong:** Changes made to `.claude/get-shit-done/` (installed) instead of `get-shit-done/` (source) get lost on next install.
**Why it happens:** Two copies of every file exist in the repo.
**How to avoid:** ALL changes go to `get-shit-done/bin/gsd-tools.js`, `get-shit-done/bin/gsd-tools.test.js`, and `get-shit-done/workflows/*.md` (source copies). Never edit `.claude/` copies.
**Warning signs:** Test files referencing `.claude/get-shit-done/`.

## Code Examples

### Extending cmdBacklogPromote with --milestone

```javascript
// Source: extend existing cmdBacklogPromote (gsd-tools.js:3891)
function cmdBacklogPromote(cwd, itemId, target, milestone, raw) {
  if (!itemId) { error('item ID required for backlog promote'); }

  const itemsDir = resolveBacklogDir(cwd, false);
  let targetFile = null;
  let targetPath = null;

  try {
    const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.md'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(itemsDir, file), 'utf-8');
      const fm = extractFrontmatter(content);
      if (fm.id === itemId) {
        targetFile = file;
        targetPath = path.join(itemsDir, file);
        break;
      }
    }
  } catch {}

  if (!targetPath) { error(`Backlog item not found: ${itemId}`); }

  const content = fs.readFileSync(targetPath, 'utf-8');
  const fm = extractFrontmatter(content);

  fm.status = 'planned';
  if (target) { fm.promoted_to = target; }
  if (milestone) { fm.milestone = milestone; }
  fm.updated = new Date().toISOString();

  const bodyMatch = content.match(/^---\n[\s\S]+?\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1] : '\n\n## Description\n\n_No description provided._\n';
  const fmStr = reconstructFrontmatter(fm);
  const newContent = `---\n${fmStr}\n---\n${body}`;

  fs.writeFileSync(targetPath, newContent, 'utf-8');

  try { regenerateBacklogIndex(cwd, false); } catch {}

  output({
    promoted: true,
    id: itemId,
    status: 'planned',
    promoted_to: target || null,
    milestone: milestone || null,
    file: targetFile,
  }, raw, itemId);
}
```

### Extending cmdBacklogAdd with milestone Field

```javascript
// Source: extend cmdBacklogAdd frontmatter (gsd-tools.js:3732)
const frontmatter = {
  id,
  title,
  tags: tagArray,
  theme: theme || 'null',
  priority: (priority || 'MEDIUM').toUpperCase(),
  status: 'captured',
  source: source || 'command',
  promoted_to: 'null',
  milestone: 'null',  // NEW: added for BINT-02
  created: now.toISOString(),
  updated: now.toISOString(),
};
```

### Extending readBacklogItems with milestone Field

```javascript
// Source: extend readBacklogItems (gsd-tools.js:3688)
items.push({
  id: fm.id || file.replace('.md', ''),
  title: fm.title || 'Untitled',
  priority: fm.priority || 'MEDIUM',
  status: fm.status || 'captured',
  tags: Array.isArray(fm.tags) ? fm.tags : [],
  theme: fm.theme || null,
  source: fm.source || 'unknown',
  promoted_to: fm.promoted_to === 'null' ? null : (fm.promoted_to || null),
  milestone: fm.milestone === 'null' ? null : (fm.milestone || null),  // NEW
  created: fm.created || 'unknown',
  updated: fm.updated || 'unknown',
  file,
});
```

### CLI Dispatch Extension for --milestone

```javascript
// Source: extend backlog promote dispatch (gsd-tools.js:5444)
} else if (subcommand === 'promote') {
  const itemId = args[2];
  const toIdx = args.indexOf('--to');
  const milestoneIdx = args.indexOf('--milestone');
  cmdBacklogPromote(
    cwd,
    itemId,
    toIdx !== -1 ? args[toIdx + 1] : null,
    milestoneIdx !== -1 ? args[milestoneIdx + 1] : null,  // NEW
    raw
  );
```

### Test: Promote with --milestone

```javascript
// Source: follows existing backlog promote test pattern (gsd-tools.test.js:3458)
test('updates milestone field when --milestone provided', () => {
  const { id } = createBacklogItem(tmpDir, { title: 'Milestone item', status: 'captured' });

  const result = runGsdTools(`backlog promote ${id} --to AUTH-01 --milestone v1.2`, tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  const output = JSON.parse(result.output);
  assert.strictEqual(output.milestone, 'v1.2', 'milestone should be v1.2');

  // Read file and verify
  const itemsDir = path.join(tmpDir, '.planning', 'backlog', 'items');
  const files = fs.readdirSync(itemsDir);
  const content = fs.readFileSync(path.join(itemsDir, files[0]), 'utf-8');
  assert.ok(content.includes('milestone: v1.2'), 'file should have milestone: v1.2');
  assert.ok(content.includes('promoted_to: AUTH-01'), 'file should have promoted_to: AUTH-01');
});
```

### Test: New items include milestone field with default

```javascript
test('backlog add creates item with milestone field defaulting to null', () => {
  const result = runGsdTools('backlog add --title "New idea"', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  const itemsDir = path.join(tmpDir, '.planning', 'backlog', 'items');
  const files = fs.readdirSync(itemsDir).filter(f => f.endsWith('.md'));
  const content = fs.readFileSync(path.join(itemsDir, files[0]), 'utf-8');
  assert.ok(content.includes('milestone: null'), 'should have milestone: null');
});
```

### Test: readBacklogItems returns milestone field

```javascript
test('backlog list includes milestone field', () => {
  createBacklogItem(tmpDir, {
    title: 'With milestone',
    // Note: createBacklogItem helper also needs milestone field added
  });

  const result = runGsdTools('backlog list --raw', tmpDir);
  assert.ok(result.success, `Command failed: ${result.error}`);

  const output = JSON.parse(result.output);
  assert.strictEqual(output.items[0].milestone, null, 'milestone should default to null');
});
```

## Enumeration of All Todo/Backlog Data Readers (BINT-05)

Complete inventory of every code path that reads todo or backlog data, organized by system. Phase 26 must verify each after changes.

### Todo System Readers

| # | Reader | Location | What It Reads | Data Returned |
|---|--------|----------|---------------|---------------|
| T1 | `cmdListTodos` | gsd-tools.js:628 | `.planning/todos/pending/*.md` | `{count, todos[{file, created, title, area, priority, source, status, path}]}` |
| T2 | `cmdInitTodos` | gsd-tools.js:4395 | `.planning/todos/pending/*.md` | Same as T1 plus config, timestamps, path existence flags |
| T3 | `check-todos.md` init_context | workflow:15-18 | Calls `init todos` (T2) | Extracts `todo_count`, `todos`, `pending_dir` |
| T4 | `add-todo.md` init_context | workflow:14-18 | Calls `init todos` (T2) | Extracts `commit_docs`, `date`, `timestamp`, `todo_count`, `todos`, `pending_dir`, `todos_dir_exists` |
| T5 | `resume-project.md` load_state | workflow:64 | Reads STATE.md `### Pending Todos` section | Count and summary |
| T6 | `resume-project.md` reconstruction | workflow:310 | Counts files in `.planning/todos/pending/` | Count for STATE.md rebuild |
| T7 | `progress.md` display | workflow:123 | STATE.md `### Pending Todos` section | Count for status display |
| T8 | `STATE.md` template | template:57-59 | References `.planning/todos/pending/` | Template text (not a reader per se, but defines the format) |

### Backlog System Readers

| # | Reader | Location | What It Reads | Data Returned |
|---|--------|----------|---------------|---------------|
| B1 | `readBacklogItems` | gsd-tools.js:3679 | `.planning/backlog/items/*.md` or `~/.gsd/backlog/items/*.md` | `[{id, title, priority, status, tags, theme, source, promoted_to, created, updated, file}]` |
| B2 | `cmdBacklogList` | gsd-tools.js:3762 | Via B1 | Filtered `{count, items}` |
| B3 | `cmdBacklogGroup` | gsd-tools.js:3856 | Via B1 | `{group_by, group_count, total_items, groups}` |
| B4 | `cmdBacklogStats` | gsd-tools.js:3833 | Via B1 (both local + global) | `{total, local, global, by_status, by_priority}` |
| B5 | `cmdBacklogUpdate` | gsd-tools.js:3779 | Direct `fs.readFileSync` + `extractFrontmatter` | Individual item for mutation |
| B6 | `cmdBacklogPromote` | gsd-tools.js:3891 | Direct `fs.readFileSync` + `extractFrontmatter` | Individual item for promotion |
| B7 | `regenerateBacklogIndex` | gsd-tools.js:3945 | Direct `fs.readdirSync` + `extractFrontmatter` | All items for index generation |

### Readers that Phase 26 ADDS (new integration points)

| # | Reader | Location | What It Reads | Phase 26 Requirement |
|---|--------|----------|---------------|---------------------|
| N1 | `new-milestone.md` Step 1b | workflow | Via `backlog group` + `backlog stats` CLI | BINT-01: Display grouped backlog for milestone scoping |
| N2 | `new-milestone.md` Step 9b | workflow | Via `backlog promote` CLI | BINT-02: Promote selected items with REQ-ID + milestone |
| N3 | `check-todos.md` promote action | workflow | Via `backlog add` CLI | BINT-03: Create backlog item from todo |
| N4 | `complete-milestone.md` review step | workflow | Via `backlog list` CLI | BINT-04: Surface un-promoted items for triage |

### Cross-Reader Impact Analysis

When adding the `milestone` field:

| Reader | Impact | Action Required |
|--------|--------|-----------------|
| B1 (`readBacklogItems`) | Must return `milestone` field | Add `milestone: fm.milestone === 'null' ? null : (fm.milestone \|\| null)` |
| B2-B4 (via B1) | Automatically get milestone from B1 | None -- data flows through |
| B5 (`cmdBacklogUpdate`) | Must allow updating milestone | Add `milestone` to CLI dispatch update args |
| B6 (`cmdBacklogPromote`) | Must accept `--milestone` param | Extend function signature and CLI dispatch |
| B7 (`regenerateBacklogIndex`) | Should show milestone in index table | Add `Milestone` column to generated markdown table |
| T1-T8 (todo readers) | No impact | Todo files don't have milestone field; no change needed |
| `createBacklogItem` test helper | Must include milestone field | Add `milestone: ${overrides.milestone || 'null'}` |

## Recommended Plan Structure

### Plan 01 (TDD): Schema Extension and Promote Enhancement
**Requirements:** BINT-02 (primary), BINT-05 (partial -- code readers)
**Files:** `get-shit-done/bin/gsd-tools.js`, `get-shit-done/bin/gsd-tools.test.js`
**Scope:**
- Add `milestone: 'null'` to `cmdBacklogAdd` frontmatter
- Add `milestone` to `readBacklogItems` return value
- Extend `cmdBacklogPromote` to accept `milestone` parameter
- Extend CLI dispatch for `backlog promote --milestone`
- Extend `cmdBacklogUpdate` CLI dispatch to allow `--milestone` update
- Add `Milestone` column to `regenerateBacklogIndex` table
- Update `createBacklogItem` test helper with milestone field
- Write tests first (RED), then implement (GREEN)
- Estimated: ~8 tests (promote with milestone, add includes milestone, list returns milestone, update milestone, index shows milestone, existing items without milestone default correctly, createBacklogItem helper, backward compat)

### Plan 02: Workflow Integration
**Requirements:** BINT-01, BINT-03, BINT-04
**Files:** `get-shit-done/workflows/new-milestone.md`, `get-shit-done/workflows/check-todos.md`, `get-shit-done/workflows/complete-milestone.md`, `commands/gsd/check-todos.md`
**Scope:**
- Insert Step 1b (backlog review) into new-milestone.md between Steps 1 and 2
- Insert Step 9b (promote selected items) into new-milestone.md after Step 9
- Add "Promote to backlog" option to check-todos.md offer_actions step
- Add priority/status filter support to check-todos.md parse_filter step
- Insert backlog review step into complete-milestone.md after evolve_project
- Update check-todos command .md if needed for new capabilities
- Workflow .md files only -- no code changes

### Plan 03: Reader Enumeration and Verification
**Requirements:** BINT-05
**Files:** `get-shit-done/bin/gsd-tools.test.js` (primarily), verification documentation
**Scope:**
- Add integration tests verifying every reader in the enumeration table above
- Test that old items WITHOUT milestone field still parse correctly (backward compat)
- Test that all backlog CLI commands return milestone field in output
- Test that index.md includes Milestone column
- Verify todo readers (T1-T8) are unaffected by backlog schema changes
- Document full reader inventory in verification report

## Open Questions

1. **Should "promote to backlog" from check-todos mark the original todo as done?**
   - What we know: The user has a todo in pending/. They promote it to backlog. The backlog item now carries the structured idea.
   - What's unclear: Is the todo now redundant? Or should it stay pending as a separate quick-reference?
   - Recommendation: Ask the user with AskUserQuestion ("Mark original todo as done?" yes/no). The todo and backlog serve different purposes (quick capture vs. structured idea), so the user should decide. Default to "yes, mark done" since the backlog item replaces it.

2. **Should complete-milestone backlog review include global items?**
   - What we know: `backlog list` defaults to project-local. `backlog list --global` shows global. Global items are cross-project and may not relate to the current milestone.
   - What's unclear: Should milestone completion review global items too?
   - Recommendation: Review project-local items only. Global items span projects and don't have a natural milestone lifecycle. If user wants to review global items, they can use `backlog list --global` separately.

3. **Should backlog list support comma-separated multi-status filtering?**
   - What we know: Current `backlog list --status X` accepts one status. BINT-04 needs to filter "captured OR triaged" (i.e., not planned/done/deferred).
   - What's unclear: Is extending the CLI better than filtering in the workflow?
   - Recommendation: Extend `backlog list` to accept `--status captured,triaged` (comma-separated). This is a small code change and makes the CLI more useful generally. Add to Plan 01.

4. **What happens to the milestone field when a backlog item's milestone is completed?**
   - What we know: BINT-04 reviews un-promoted items during complete-milestone. But what about items that WERE promoted (status: planned) -- should their milestone field persist?
   - What's unclear: Should milestone completion update any backlog items' status (e.g., planned -> done)?
   - Recommendation: During complete-milestone, after the review of un-promoted items, also offer to mark `status: planned` items as `status: done` (since the milestone shipped). This is a natural lifecycle step. Add to BINT-04 workflow instructions.

## Sources

### Primary (HIGH confidence)
- `get-shit-done/bin/gsd-tools.js` (5462 lines) -- backlog commands at lines 3669-3993, CLI dispatch at lines 5398-5455, todo readers at lines 628-669 and 4395-4458
- `get-shit-done/bin/gsd-tools.test.js` (3669 lines) -- 143 tests, 28 backlog tests, createBacklogItem helper at line 2993
- `get-shit-done/workflows/new-milestone.md` -- current milestone workflow, 11 steps, AskUserQuestion multiSelect pattern in Step 9
- `get-shit-done/workflows/check-todos.md` -- current todo workflow, 8 steps, offer_actions pattern at step 6
- `get-shit-done/workflows/complete-milestone.md` -- current milestone completion, 11 steps, evolve_project at step 5
- `get-shit-done/workflows/add-todo.md` -- todo creation workflow, frontmatter template with priority/source/status
- `get-shit-done/workflows/resume-project.md` -- session resume, reads pending todo count and STATE.md
- `get-shit-done/templates/state.md` -- STATE.md template, `### Pending Todos` section at line 57
- `.planning/REQUIREMENTS.md` -- BINT-01 through BINT-05 specification
- `.planning/phases/25-backlog-system-core/25-RESEARCH.md` -- Phase 25 architecture decisions, prior decisions
- `.planning/phases/25-backlog-system-core/25-VERIFICATION.md` -- Phase 25 verification, 143 tests passing

### Secondary (MEDIUM confidence)
- `.planning/phases/25-backlog-system-core/25-01-PLAN.md` through `25-03-PLAN.md` -- Phase 25 execution plans (TDD approach)
- `get-shit-done/workflows/progress.md` -- displays pending todo count from STATE.md
- `get-shit-done/workflows/discuss-phase.md` -- references "roadmap backlog" for scope creep items

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies; extends existing Phase 25 code with minimal additions
- Architecture: HIGH -- integration points clearly identified in existing workflows; patterns (AskUserQuestion, CLI dispatch) are well-established
- Pitfalls: HIGH -- documented from Phase 25 experience (string 'null', source vs installed, tag deduplication); promote timing is novel but well-analyzed
- Code examples: HIGH -- based on reading actual source code at specific line numbers, extending proven patterns

**Research date:** 2026-02-23
**Valid until:** 2026-03-23 (stable domain -- internal tool, no external dependencies to drift)
