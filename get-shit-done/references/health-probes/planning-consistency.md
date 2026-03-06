---
probe_id: planning-consistency
category: Planning Consistency
tier: full
dimension: infrastructure
execution: inline
depends_on: []
---

# Planning Consistency Probe

Validates planning artifact consistency across the project. Only runs with `--full` or `--focus planning`.

## Checks

### PLAN-01: Phase directories exist

```bash
grep -oE "Phase [0-9]+" .planning/ROADMAP.md 2>/dev/null | sort -u | while read -r line; do
  phase_num=$(echo "$line" | grep -oE "[0-9]+")
  padded=$(printf "%02d" "$phase_num")
  dir_match=$(ls -d .planning/phases/${padded}-* 2>/dev/null | head -1)
  [ -n "$dir_match" ] && echo "PASS: Phase $phase_num -> $dir_match" || echo "WARNING: Phase $phase_num has no directory"
done
```

### PLAN-02: Completed plans have summaries

```bash
find .planning/phases -name '*-PLAN.md' 2>/dev/null | while read -r plan; do
  summary="${plan/PLAN.md/SUMMARY.md}"
  dir=$(dirname "$plan")
  has_any_summary=$(ls "$dir"/*-SUMMARY.md 2>/dev/null | head -1)
  if [ -n "$has_any_summary" ]; then
    [ -f "$summary" ] && echo "PASS: $plan has summary" || echo "WARNING: $plan missing summary (phase has other summaries)"
  fi
done
```

### PLAN-03: STATE.md exists

```bash
test -f .planning/STATE.md && grep -q "Current Position" .planning/STATE.md && echo "PASS" || echo "FAIL: STATE.md missing or malformed"
```
