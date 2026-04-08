---
id: SIG-260223-013
date: 2026-02-23
type: struggle
severity: notable
polarity: negative
phase: 26
status: open
tags: [testing, isolation, environment]
detection_method: automated
origin: plan-summary
---

# GSD_HOME isolation required for stats/global-directory tests

## Signal

The `backlog stats` command aggregates items from both local (`.planning/backlog/items/`) and global (`~/.gsd/backlog/items/`) directories. On developer machines with real backlog items in `~/.gsd/`, this causes test pollution — stats counts include real items alongside test fixtures.

## Impact

Tests pass in CI (clean `~/.gsd/`) but fail on developer machines with existing global backlog items. Two pre-existing stats tests remain affected.

## Pattern

Use `runGsdToolsWithEnv({ GSD_HOME: '/nonexistent' })` to isolate any test that reads from the global GSD directory:

```javascript
const result = runGsdToolsWithEnv({ GSD_HOME: '/nonexistent/path' }, 'backlog', 'stats', ...args);
```

This forces `getGsdHome()` to return a nonexistent path, preventing global directory reads.

## Applies To

Any gsd-tools command that reads from `~/.gsd/`: `backlog stats`, `backlog list --global`, `backlog group --global`, future commands with global scope.
