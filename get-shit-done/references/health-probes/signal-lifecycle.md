---
probe_id: signal-lifecycle
category: Signal Lifecycle Consistency
tier: default
dimension: infrastructure
execution: inline
depends_on: [kb-integrity]
---

# Signal Lifecycle Probe

Validates that signal lifecycle states are consistent with plan declarations.

## Checks

### SIG-01: Resolved signals updated

```bash
# KB path resolution -- project-local primary, user-global fallback
if [ -d ".planning/knowledge" ]; then
  KB_DIR=".planning/knowledge"
else
  KB_DIR="$HOME/.gsd/knowledge"
fi

inconsistencies=0
while IFS= read -r plan; do
  raw=$(node ~/.claude/get-shit-done/bin/gsd-tools.js frontmatter get "$plan" --field resolves_signals --raw 2>/dev/null || echo "")
  # Skip if not a valid array
  echo "$raw" | grep -q '^\[' || continue
  # Parse signal IDs
  for sig_id in $(echo "$raw" | node -e "process.stdin.on('data',d=>{try{JSON.parse(d).forEach(s=>console.log(s))}catch{}})" 2>/dev/null); do
    sig_file=$(find "$KB_DIR/signals" -name "${sig_id}.md" 2>/dev/null | head -1)
    [ -z "$sig_file" ] && continue
    state=$(grep "^lifecycle_state:" "$sig_file" 2>/dev/null | head -1 | sed 's/^lifecycle_state:[[:space:]]*//')
    if [ "$state" = "detected" ] || [ "$state" = "triaged" ]; then
      echo "  WARNING: Plan $(basename "$plan") declares it resolves $sig_id, but signal is still in '$state' state"
      inconsistencies=$((inconsistencies + 1))
    fi
  done
done < <(find .planning/phases -name '*-PLAN.md' 2>/dev/null)
[ "$inconsistencies" -eq 0 ] && echo "PASS: All declared signal resolutions are consistent" || echo "WARNING: $inconsistencies lifecycle inconsistencies found"
```

### SIG-02: No orphaned resolutions

```bash
# KB path resolution -- project-local primary, user-global fallback
if [ -d ".planning/knowledge" ]; then
  KB_DIR=".planning/knowledge"
else
  KB_DIR="$HOME/.gsd/knowledge"
fi

orphans=0
while IFS= read -r plan; do
  raw=$(node ~/.claude/get-shit-done/bin/gsd-tools.js frontmatter get "$plan" --field resolves_signals --raw 2>/dev/null || echo "")
  echo "$raw" | grep -q '^\[' || continue
  for sig_id in $(echo "$raw" | node -e "process.stdin.on('data',d=>{try{JSON.parse(d).forEach(s=>console.log(s))}catch{}})" 2>/dev/null); do
    sig_file=$(find "$KB_DIR/signals" -name "${sig_id}.md" 2>/dev/null | head -1)
    if [ -z "$sig_file" ]; then
      echo "  WARNING: Plan $(basename "$plan") references signal $sig_id which does not exist in KB"
      orphans=$((orphans + 1))
    fi
  done
done < <(find .planning/phases -name '*-PLAN.md' 2>/dev/null)
[ "$orphans" -eq 0 ] && echo "PASS: No orphaned signal references" || echo "WARNING: $orphans orphaned signal references found"
```

## Dependencies

This probe depends on `kb-integrity` because signal checks require a valid knowledge base. If KB integrity fails, signal lifecycle checks may produce misleading results.
