---
probe_id: kb-integrity
category: KB Integrity
tier: default
dimension: infrastructure
execution: inline
depends_on: []
---

# KB Integrity Probe

Validates the knowledge base at `.planning/knowledge/` (or `~/.gsd/knowledge/` fallback) is structurally sound.

## Checks

### KB-01: Index file exists

```bash
# KB path resolution -- project-local primary, user-global fallback
if [ -d ".planning/knowledge" ]; then
  KB_DIR=".planning/knowledge"
else
  KB_DIR="$HOME/.gsd/knowledge"
fi
INDEX="$KB_DIR/index.md"

test -f "$INDEX" && echo "PASS" || echo "FAIL"
```

**blocks:** [KB-02, KB-03, KB-04, KB-05, KB-06]

### KB-02: Index is parseable

```bash
grep -q "## Signals" "$INDEX" && grep -q "## Spikes" "$INDEX" && grep -q "## Lessons" "$INDEX" && echo "PASS" || echo "FAIL"
```

### KB-03: Signal count matches

```bash
index_signals=$(grep -c "^| sig-" "$INDEX" 2>/dev/null || echo "0")
actual_signals=0
while IFS= read -r -d '' file; do
  status=$(grep "^status:" "$file" 2>/dev/null | head -1 | sed 's/^status:[[:space:]]*//')
  [ "$status" != "archived" ] && actual_signals=$((actual_signals + 1))
done < <(find "$KB_DIR/signals" -name '*.md' -print0 2>/dev/null)
[ "$index_signals" -eq "$actual_signals" ] && echo "PASS: $index_signals indexed, $actual_signals on disk" || echo "WARNING: $index_signals indexed, $actual_signals on disk"
```

### KB-04: Spike count matches

```bash
index_spikes=$(grep -c "^| spk-" "$INDEX" 2>/dev/null || echo "0")
actual_spikes=0
while IFS= read -r -d '' file; do
  status=$(grep "^status:" "$file" 2>/dev/null | head -1 | sed 's/^status:[[:space:]]*//')
  [ "$status" != "archived" ] && actual_spikes=$((actual_spikes + 1))
done < <(find "$KB_DIR/spikes" -name '*.md' -print0 2>/dev/null)
[ "$index_spikes" -eq "$actual_spikes" ] && echo "PASS: $index_spikes indexed, $actual_spikes on disk" || echo "WARNING: $index_spikes indexed, $actual_spikes on disk"
```

### KB-05: Lesson count matches

```bash
index_lessons=$(grep -c "^| les-" "$INDEX" 2>/dev/null || echo "0")
actual_lessons=0
while IFS= read -r -d '' file; do
  status=$(grep "^status:" "$file" 2>/dev/null | head -1 | sed 's/^status:[[:space:]]*//')
  [ "$status" != "archived" ] && actual_lessons=$((actual_lessons + 1))
done < <(find "$KB_DIR/lessons" -name '*.md' -print0 2>/dev/null)
[ "$index_lessons" -eq "$actual_lessons" ] && echo "PASS: $index_lessons indexed, $actual_lessons on disk" || echo "WARNING: $index_lessons indexed, $actual_lessons on disk"
```

### KB-06: No frontmatter errors

```bash
errors=0
while IFS= read -r file; do
  head_lines=$(head -20 "$file" 2>/dev/null)
  first_line=$(echo "$head_lines" | head -1)
  if [ "$first_line" != "---" ]; then
    errors=$((errors + 1))
  fi
done < <(find "$KB_DIR" -name '*.md' ! -name 'index.md' -print 2>/dev/null | shuf -n 5 2>/dev/null || find "$KB_DIR" -name '*.md' ! -name 'index.md' -print 2>/dev/null | head -5)
[ "$errors" -eq 0 ] && echo "PASS: No frontmatter errors in sampled files" || echo "WARNING: $errors files with frontmatter issues"
```

## Edge Cases

If neither `.planning/knowledge/` nor `~/.gsd/knowledge/` directory exists, KB-01 through KB-06 all FAIL. Report as "KB not initialized" and suggest user runs initialization.
