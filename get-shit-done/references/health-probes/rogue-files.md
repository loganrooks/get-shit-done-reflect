---
probe_id: rogue-files
category: Rogue File Detection
tier: default
dimension: infrastructure
execution: inline
depends_on: []
---

# Rogue File Detection Probe

Detects files in .planning/ that do not match expected directory patterns or have expired lifecycle markers.

## Checks

### ROGUE-01: Unexpected top-level files in .planning/

```bash
# Expected top-level files (known legitimate files)
EXPECTED_FILES="config\.json|STATE\.md|ROADMAP\.md|PROJECT\.md|REQUIREMENTS\.md|MILESTONES\.md|FORK-DIVERGENCES\.md|FORK-STRATEGY\.md|migration-log\.md"

rogue_count=0
rogue_list=""
while IFS= read -r file; do
  basename=$(basename "$file")
  echo "$basename" | grep -qE "^($EXPECTED_FILES)$" && continue
  rogue_count=$((rogue_count + 1))
  rogue_list="$rogue_list $basename"
done < <(find .planning -maxdepth 1 -type f ! -name '.*' 2>/dev/null)

if [ "$rogue_count" -eq 0 ]; then
  echo "PASS: No unexpected top-level files"
else
  echo "WARNING: $rogue_count unexpected file(s):$rogue_list"
fi
```

### ROGUE-02: Unexpected directories in .planning/

```bash
# Expected directories
EXPECTED_DIRS="phases|deliberations|knowledge|milestones|codebase|research|spikes|quick|todos|debug"

rogue_dirs=0
rogue_dir_list=""
while IFS= read -r dir; do
  dirname=$(basename "$dir")
  echo "$dirname" | grep -qE "^($EXPECTED_DIRS)$" && continue
  rogue_dirs=$((rogue_dirs + 1))
  rogue_dir_list="$rogue_dir_list $dirname"
done < <(find .planning -maxdepth 1 -type d ! -path .planning 2>/dev/null)

if [ "$rogue_dirs" -eq 0 ]; then
  echo "PASS: No unexpected directories"
else
  echo "WARNING: $rogue_dirs unexpected dir(s):$rogue_dir_list"
fi
```

### ROGUE-03: Lifecycle-expired files

```bash
# Check for stale .continue-here markers (older than 7 days)
stale_markers=0
while IFS= read -r file; do
  stale_markers=$((stale_markers + 1))
done < <(find .planning/phases -name '.continue-here*.md' -mtime +7 2>/dev/null)

# Check for stale resume files (older than 7 days)
stale_resume=0
while IFS= read -r file; do
  stale_resume=$((stale_resume + 1))
done < <(find .planning -name 'RESUME-*.md' -mtime +7 2>/dev/null)

total_stale=$((stale_markers + stale_resume))
if [ "$total_stale" -eq 0 ]; then
  echo "PASS: No lifecycle-expired files"
else
  echo "WARNING: $total_stale lifecycle-expired file(s) ($stale_markers markers, $stale_resume resume files)"
fi
```

## Pattern Registry

The EXPECTED_FILES and EXPECTED_DIRS patterns cover all known legitimate files and directories in the GSD workflow. If false positives occur, expand the allowlist rather than removing detection.

**Pitfall avoidance:** Start with a generous allowlist. Known legitimate files and directories are maintained as regex alternations. New workflow additions should be added to the registry.
