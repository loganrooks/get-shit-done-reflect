#!/usr/bin/env bash
# scripts/detect-platform-changes.sh
# Platform change detection for GSD Reflect deployment targets
#
# Usage: ./scripts/detect-platform-changes.sh [--upstream] [--codex-schema] [--all]
#
# Exits 0 if no changes detected, 1 if changes found
#
# Baselines cached in ~/.gsd/cache/platform-baselines/
# Run periodically or before starting upstream sync work.
#
# See: get-shit-done/references/platform-monitoring.md

set -euo pipefail

CACHE_DIR="${GSD_HOME:-$HOME/.gsd}/cache/platform-baselines"
CHANGES_FOUND=0

# Cleanup temp files on exit
TMPDIR_CLEANUP=""
cleanup() {
  if [ -n "$TMPDIR_CLEANUP" ] && [ -d "$TMPDIR_CLEANUP" ]; then
    rm -rf "$TMPDIR_CLEANUP"
  fi
}
trap cleanup EXIT

# Create a temp directory for downloads
TMPDIR_CLEANUP=$(mktemp -d)
TMPDIR="$TMPDIR_CLEANUP"

# --- Output helpers ---

banner() {
  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo " GSDR ► PLATFORM CHANGE DETECTION"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

section() {
  echo ""
  echo "── $1 ──"
  echo ""
}

status_ok() {
  echo "  ✓ $1"
}

status_warn() {
  echo "  ⚠ $1"
}

status_change() {
  echo "  ◆ $1"
}

# --- Mode A: Upstream GSD installer diff ---

detect_upstream_changes() {
  section "Upstream GSD Installer (bin/install.js)"

  local url="https://raw.githubusercontent.com/gsd-build/get-shit-done/main/bin/install.js"
  local baseline="$CACHE_DIR/upstream-install.js"
  local baseline_date="$CACHE_DIR/upstream-install.date"
  local downloaded="$TMPDIR/upstream-install.js"

  # Download current version
  if ! curl -sS --fail -o "$downloaded" "$url" 2>/dev/null; then
    status_warn "Failed to download upstream install.js (network error or URL changed)"
    status_warn "Skipping upstream detection"
    return 0
  fi

  # No baseline: initialize
  if [ ! -f "$baseline" ]; then
    cp "$downloaded" "$baseline"
    date -u +"%Y-%m-%d" > "$baseline_date"
    status_ok "Baseline initialized ($(date -u +"%Y-%m-%d"))"
    status_ok "$(wc -l < "$downloaded") lines cached"
    return 0
  fi

  # Compare
  local baseline_dt
  baseline_dt=$(cat "$baseline_date" 2>/dev/null || echo "unknown")

  if diff -q "$baseline" "$downloaded" > /dev/null 2>&1; then
    status_ok "No changes since baseline ($baseline_dt)"
    return 0
  fi

  # Changes found -- analyze for runtime-relevant changes
  local diffout="$TMPDIR/upstream.diff"
  diff -u "$baseline" "$downloaded" > "$diffout" || true

  local today
  today=$(date -u +"%Y-%m-%d")

  status_change "Changes detected!"
  echo "  Baseline: $baseline_dt"
  echo "  Current:  $today"
  echo ""

  # Filter for runtime-relevant patterns
  local runtime_changes="$TMPDIR/runtime-changes.txt"
  > "$runtime_changes"

  # New function definitions with runtime keywords
  grep -E '^\+.*function.*(convert|codex|gemini|opencode|copilot|antigravity|runtime)' "$diffout" \
    | grep -v '^\+\+\+' >> "$runtime_changes" 2>/dev/null || true

  # Path/config changes
  grep -E '^\+.*(getDirName|getConfigDirFromHome|toolMapping|runtimeMapping)' "$diffout" \
    | grep -v '^\+\+\+' >> "$runtime_changes" 2>/dev/null || true

  # New runtime flags
  grep -E '^\+.*(is[A-Z][a-zA-Z]*Runtime|is[A-Z][a-zA-Z]*Agent)' "$diffout" \
    | grep -v '^\+\+\+' >> "$runtime_changes" 2>/dev/null || true

  if [ -s "$runtime_changes" ]; then
    echo "  Runtime-relevant changes:"
    while IFS= read -r line; do
      # Strip leading + for display, mark as addition
      local clean="${line#+}"
      echo "    + ${clean}"
    done < "$runtime_changes"
  else
    echo "  Changes found but none match runtime-relevant patterns."
    echo "  Review full diff manually if needed."
  fi

  echo ""
  echo "  Total lines changed: $(grep -c '^[+-]' "$diffout" | head -1 || echo "?")"

  # Update baseline
  cp "$downloaded" "$baseline"
  date -u +"%Y-%m-%d" > "$baseline_date"
  status_ok "Baseline updated to $today"

  CHANGES_FOUND=1
  return 0
}

# --- Mode B: Codex config schema diff ---

detect_codex_schema_changes() {
  section "Codex Config Schema (config-schema.json)"

  # Check for gh CLI
  if ! command -v gh &> /dev/null; then
    status_warn "gh CLI not available -- skipping Codex schema detection"
    status_warn "Install: https://cli.github.com/"
    return 0
  fi

  # Get latest stable release tag
  local tag
  tag=$(gh api repos/openai/codex/releases \
    --jq '[.[] | select(.tag_name | test("^rust-v[0-9]+\\.[0-9]+\\.[0-9]+$"))][0].tag_name' 2>/dev/null) || true

  if [ -z "$tag" ] || [ "$tag" = "null" ]; then
    status_warn "Failed to fetch Codex release tags (gh auth issue or API error)"
    status_warn "Skipping Codex schema detection"
    return 0
  fi

  echo "  Latest stable release: $tag"

  local url="https://github.com/openai/codex/releases/download/${tag}/config-schema.json"
  local baseline="$CACHE_DIR/codex-config-schema.json"
  local baseline_tag="$CACHE_DIR/codex-config-schema.tag"
  local downloaded="$TMPDIR/codex-config-schema.json"

  # Download schema
  if ! curl -sS -L --fail -o "$downloaded" "$url" 2>/dev/null; then
    status_warn "Failed to download config-schema.json from release $tag"
    status_warn "URL: $url"
    status_warn "Skipping Codex schema detection"
    return 0
  fi

  # Validate it's JSON
  if ! python3 -c "import json; json.load(open('$downloaded'))" 2>/dev/null; then
    status_warn "Downloaded file is not valid JSON -- skipping"
    return 0
  fi

  # No baseline: initialize
  if [ ! -f "$baseline" ]; then
    cp "$downloaded" "$baseline"
    echo "$tag" > "$baseline_tag"
    status_ok "Baseline initialized ($tag)"

    # Show summary of what's in the schema
    local def_count
    def_count=$(python3 -c "
import json, sys
s = json.load(open('$downloaded'))
defs = s.get('\$defs', s.get('definitions', {}))
props = s.get('properties', {})
print(f'{len(defs)} definitions, {len(props)} top-level properties')
" 2>/dev/null || echo "unknown structure")
    status_ok "Schema contains: $def_count"
    return 0
  fi

  # Compare
  local old_tag
  old_tag=$(cat "$baseline_tag" 2>/dev/null || echo "unknown")

  if [ "$old_tag" = "$tag" ] && diff -q "$baseline" "$downloaded" > /dev/null 2>&1; then
    status_ok "No changes since baseline ($old_tag)"
    return 0
  fi

  # Structural JSON diff
  local diff_result
  diff_result=$(python3 << 'PYEOF'
import json, sys

old_path = sys.argv[1]
new_path = sys.argv[2]
old_tag = sys.argv[3]
new_tag = sys.argv[4]

old = json.load(open(old_path))
new = json.load(open(new_path))

changes = []

# Compare $defs (definitions)
old_defs = set(old.get('$defs', old.get('definitions', {})).keys())
new_defs = set(new.get('$defs', new.get('definitions', {})).keys())

added_defs = sorted(new_defs - old_defs)
removed_defs = sorted(old_defs - new_defs)

if added_defs:
    changes.append(f"  New definitions ({len(added_defs)}):")
    for d in added_defs:
        marker = " **AGENT**" if "agent" in d.lower() or "role" in d.lower() else ""
        changes.append(f"    + {d}{marker}")

if removed_defs:
    changes.append(f"  Removed definitions ({len(removed_defs)}):")
    for d in removed_defs:
        changes.append(f"    - {d}")

# Compare top-level properties
old_props = set(old.get('properties', {}).keys())
new_props = set(new.get('properties', {}).keys())

added_props = sorted(new_props - old_props)
removed_props = sorted(old_props - new_props)

if added_props:
    changes.append(f"  New top-level properties ({len(added_props)}):")
    for p in added_props:
        changes.append(f"    + {p}")

if removed_props:
    changes.append(f"  Removed top-level properties ({len(removed_props)}):")
    for p in removed_props:
        changes.append(f"    - {p}")

# Compare enum values in known enum definitions
defs_key = '$defs' if '$defs' in new else 'definitions'
old_defs_dict = old.get(defs_key, old.get('definitions', {}))
new_defs_dict = new.get(defs_key, new.get('definitions', {}))

for def_name in sorted(new_defs_dict.keys() & old_defs_dict.keys()):
    old_enum = old_defs_dict[def_name].get('enum', old_defs_dict[def_name].get('oneOf', []))
    new_enum = new_defs_dict[def_name].get('enum', new_defs_dict[def_name].get('oneOf', []))

    if isinstance(old_enum, list) and isinstance(new_enum, list):
        # For simple enum lists
        if all(isinstance(x, str) for x in old_enum) and all(isinstance(x, str) for x in new_enum):
            old_set = set(old_enum)
            new_set = set(new_enum)
            added = sorted(new_set - old_set)
            removed = sorted(old_set - new_set)
            if added or removed:
                changes.append(f"  Enum changes in {def_name}:")
                for v in added:
                    changes.append(f"    + {v}")
                for v in removed:
                    changes.append(f"    - {v}")

# Flag agent-related definition changes
agent_related = [d for d in (added_defs | removed_defs)
                 if any(kw in d.lower() for kw in ['agent', 'role', 'toml'])]
if agent_related:
    changes.append("")
    changes.append("  *** AGENT-RELATED CHANGES DETECTED ***")
    changes.append("  Review carefully before modifying agent TOML generation.")
    changes.append("  Remember: config-schema.json covers config.toml, NOT agent role files.")

if changes:
    print('\n'.join(changes))
else:
    # Check if the files are actually different (maybe just formatting)
    if old != new:
        print("  Schema content changed but no structural differences in definitions/properties/enums.")
    else:
        print("  NO_CHANGES")
PYEOF
  "$baseline" "$downloaded" "$old_tag" "$tag" 2>/dev/null) || true

  if [ -z "$diff_result" ] || echo "$diff_result" | grep -q "NO_CHANGES"; then
    status_ok "No structural changes since baseline ($old_tag)"
    return 0
  fi

  status_change "Schema changes detected!"
  echo "  Baseline: $old_tag"
  echo "  Current:  $tag"
  echo ""
  echo "$diff_result"

  # Update baseline
  cp "$downloaded" "$baseline"
  echo "$tag" > "$baseline_tag"
  echo ""
  status_ok "Baseline updated to $tag"

  CHANGES_FOUND=1
  return 0
}

# --- Main ---

main() {
  local do_upstream=false
  local do_codex=false

  # Parse arguments
  if [ $# -eq 0 ]; then
    do_upstream=true
    do_codex=true
  fi

  while [ $# -gt 0 ]; do
    case "$1" in
      --upstream)
        do_upstream=true
        ;;
      --codex-schema)
        do_codex=true
        ;;
      --all)
        do_upstream=true
        do_codex=true
        ;;
      --help|-h)
        echo "Usage: $0 [--upstream] [--codex-schema] [--all]"
        echo ""
        echo "Detect changes in platforms GSD Reflect deploys to."
        echo ""
        echo "Flags:"
        echo "  --upstream      Check upstream GSD installer for changes"
        echo "  --codex-schema  Check Codex config schema for changes"
        echo "  --all           Run all checks (default if no flags)"
        echo ""
        echo "Baselines cached in: ${CACHE_DIR}"
        echo "Exit 0 = no changes, Exit 1 = changes detected"
        exit 0
        ;;
      *)
        echo "Unknown flag: $1"
        echo "Run $0 --help for usage"
        exit 2
        ;;
    esac
    shift
  done

  mkdir -p "$CACHE_DIR"

  banner

  if $do_upstream; then
    detect_upstream_changes
  fi

  if $do_codex; then
    detect_codex_schema_changes
  fi

  echo ""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  if [ "$CHANGES_FOUND" -eq 1 ]; then
    echo " ◆ Changes detected -- investigate before acting"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 1
  else
    echo " ✓ No platform changes detected"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    exit 0
  fi
}

main "$@"
