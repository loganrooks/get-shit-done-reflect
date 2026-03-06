---
probe_id: stale-artifacts
category: Stale Artifacts
tier: default
dimension: infrastructure
execution: inline
depends_on: []
---

# Stale Artifacts Probe

Detects orphaned, abandoned, or incomplete workspace artifacts.

## Checks

### STALE-01: Orphaned .continue-here files

```bash
STALE_THRESHOLD_DAYS=${STALE_DAYS_FLAG:-${CONFIG_STALE_THRESHOLD:-7}}

stale_continue=0
while IFS= read -r file; do
  stale_continue=$((stale_continue + 1))
  age_days=$(( ($(date +%s) - $(stat -f %m "$file" 2>/dev/null || stat -c %Y "$file" 2>/dev/null || echo "0")) / 86400 ))
  echo "  - $file (${age_days} days old)"
done < <(find .planning/phases -name '.continue-here.md' -mtime +$STALE_THRESHOLD_DAYS 2>/dev/null)
[ "$stale_continue" -eq 0 ] && echo "PASS: No orphaned .continue-here files" || echo "WARNING: $stale_continue orphaned .continue-here files"
```

### STALE-02: Abandoned debug sessions

```bash
STALE_THRESHOLD_DAYS=${STALE_DAYS_FLAG:-${CONFIG_STALE_THRESHOLD:-7}}

stale_debug=0
while IFS= read -r file; do
  if ! grep -q "status:.*resolved" "$file" 2>/dev/null; then
    stale_debug=$((stale_debug + 1))
    echo "  - $file (no resolution marker)"
  fi
done < <(find .planning/debug -name '*.md' -mtime +$STALE_THRESHOLD_DAYS 2>/dev/null)
[ "$stale_debug" -eq 0 ] && echo "PASS: No abandoned debug sessions" || echo "WARNING: $stale_debug abandoned debug sessions"
```

### STALE-03: Incomplete spikes

```bash
incomplete_spikes=0
while IFS= read -r file; do
  dir=$(dirname "$file")
  if [ ! -f "$dir/DECISION.md" ]; then
    incomplete_spikes=$((incomplete_spikes + 1))
    echo "  - $dir (DESIGN.md present, no DECISION.md)"
  fi
done < <(find .planning/spikes -name 'DESIGN.md' 2>/dev/null)
[ "$incomplete_spikes" -eq 0 ] && echo "PASS: No incomplete spikes" || echo "WARNING: $incomplete_spikes incomplete spikes"
```

## Configuration

- **STALE_THRESHOLD_DAYS**: Configurable via `health_check.stale_threshold_days` in config.json (default: 7 days). Override with `--stale-days N` flag.
