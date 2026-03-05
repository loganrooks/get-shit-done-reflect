---
id: SIG-260222-011-silent-helper-pattern-for-auto-regeneration
type: positive-pattern
severity: notable
polarity: positive
phase: 25
plan: 02
project: get-shit-done-reflect
created: 2026-02-22T00:00:00Z
tags: [architecture, silent-helper, auto-regeneration, index, backlog, output-control]
status: active
source: automated
runtime: claude-code
model: claude-sonnet-4-6
---

# Silent Helper Pattern for Auto-Triggered Side Effects Without Double Output

## Observation

Phase 25-02 introduced a clean architectural pattern for commands that must trigger a side effect (index regeneration) after completing their primary operation. The solution: extract core logic into a silent helper function that does not call `output()`, then wrap it in the user-facing command that adds `output()`.

```javascript
// Silent helper: no output() call, can be invoked by other commands
function regenerateBacklogIndex(cwd, isGlobal) {
  // ... builds index.md content and writes it atomically ...
}

// User-facing command: adds output() wrapper
function cmdBacklogIndex(cwd, isGlobal, raw) {
  regenerateBacklogIndex(cwd, isGlobal);
  output({ generated, total, path }, raw, `Index rebuilt: ${total} items`);
}

// Write commands call the silent helper to auto-regenerate
function cmdBacklogAdd(cwd, options, raw) {
  // ... creates item file ...
  try { regenerateBacklogIndex(cwd, isGlobal); } catch {} // silent, non-fatal
  output({ created: true, id, file }, raw, id); // only add's output appears
}
```

Auto-regeneration is wired into: `cmdBacklogAdd`, `cmdBacklogUpdate`, `cmdBacklogPromote` — all write operations that change the item set.

## Context

The problem being solved: `cmdBacklogIndex` calls `output()` to report index generation status. If `cmdBacklogAdd` called `cmdBacklogIndex` directly, the caller would see two JSON outputs — the index report and then the add report — breaking the single-output contract. The silent helper pattern resolves this by separating the "do the work" logic from the "report the work" logic.

The `try { } catch {}` wrapper makes auto-regeneration non-fatal: if index rebuild fails (e.g., permissions issue), the primary operation still succeeds and reports correctly.

## Impact

This pattern is directly applicable to any future feature where:
- A command produces output that would be redundant when triggered as a side effect
- Multiple write commands need to trigger the same maintenance operation
- The side effect should be silent and non-fatal

Existing candidates for this pattern in gsd-tools.js: any future command that modifies the manifest, todo index, or STATE.md derived views.

## Recommendation

Establish the silent helper pattern as a convention in `gsd-tools.js`:

1. **Naming convention:** Prefix with `regenerate`, `sync`, or `rebuild` for silent helpers that maintain derived artifacts
2. **Signature:** Silent helpers take `(cwd, isGlobal)` and return void — no `raw` parameter, no `output()` call
3. **Error handling:** Write commands always wrap silent helper calls in `try { } catch {}` to prevent side-effect failures from masking primary operation failures
4. **Testability:** Test the silent helper indirectly by checking the artifact it creates (e.g., verify `index.md` exists after `backlog add`)

The pattern was tested for --global flag compatibility: `regenerateBacklogIndex(cwd, isGlobal)` correctly routes to project-local or global index based on the flag, making it compatible with the two-tier storage model.
