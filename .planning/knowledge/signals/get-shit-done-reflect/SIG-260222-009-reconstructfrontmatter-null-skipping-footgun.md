---
id: SIG-260222-009-reconstructfrontmatter-null-skipping-footgun
type: architecture
severity: notable
polarity: negative
phase: 25
plan: 01
project: get-shit-done-reflect
created: 2026-02-22T00:00:00Z
tags: [frontmatter, serialization, null-handling, footgun, backlog]
status: active
source: automated
runtime: claude-code
model: claude-sonnet-4-6
---

# reconstructFrontmatter Silently Drops JavaScript null Values

## Observation

The `reconstructFrontmatter` function in `gsd-tools.js` silently skips any field whose value is JavaScript `null`. This means a frontmatter field set to `null` will not appear in the serialized output file at all — not as `null`, not as an empty string, simply absent.

Discovered during Phase 25-01 implementation when `promoted_to: null` was assigned as the default for new backlog items. After serialization and re-read, the `promoted_to` field was missing from the frontmatter entirely.

**Workaround applied:** Store optional nullable fields as the string `'null'` instead of JavaScript `null`. When reading, `readBacklogItems` converts `'null'` back to `null`:

```javascript
promoted_to: fm.promoted_to === 'null' ? null : (fm.promoted_to || null),
```

## Context

- File: `get-shit-done/bin/gsd-tools.js`, line 335
- Affected field: `promoted_to` in backlog item frontmatter
- Fix commit: `a0d297f` (Phase 25-01 Task 2)
- The SUMMARY classified this as an "auto-fixed" deviation (caught and corrected within Task 2)

## Impact

Any future developer adding a new optional frontmatter field that legitimately needs a null state (e.g., `resolved_at`, `parent_id`, `assigned_to`) will hit the same bug silently. The field will serialize to nothing, and re-reads will either use a default or return `undefined`. No error is raised — the data silently vanishes.

This affects all commands that use `reconstructFrontmatter` to write files: backlog add, backlog update, backlog promote, and any future write-path commands.

## Recommendation

Two options:

1. **Short-term (current workaround):** Document the `'null'` string convention in the codebase near the `reconstructFrontmatter` function. Add a code comment: `// Note: null values are skipped by reconstructFrontmatter. Use string 'null' for fields that must appear as null in YAML.`

2. **Long-term (fix the root cause):** Modify `reconstructFrontmatter` to emit `fieldName: null` when the value is JavaScript `null`, matching standard YAML conventions. This would remove the need for the `'null'` string workaround. Apply the fix carefully — check if any existing fields rely on null-skipping behavior as a feature (e.g., fields that should be omitted when unset rather than serialized as `null`).
