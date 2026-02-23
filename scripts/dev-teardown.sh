#!/usr/bin/env bash
# Development teardown script for GSD Reflect
# Removes symlinks and optionally restores backups

set -eo pipefail

CLAUDE_DIR="$HOME/.claude"

echo "GSD Reflect Development Teardown"
echo "================================="
echo ""

restore_backup() {
  local target="$1"
  local name="$2"

  if [ -L "$target" ]; then
    echo "Removing symlink: $name"
    rm "$target"

    if [ -d "${target}.bak" ]; then
      echo "Restoring backup: ${name}.bak"
      mv "${target}.bak" "$target"
    fi
  elif [ -d "$target" ]; then
    echo "Not a symlink, skipping: $name"
  else
    echo "Not found: $name"
  fi
}

restore_backup "$CLAUDE_DIR/commands/gsd" "commands/gsd"
restore_backup "$CLAUDE_DIR/get-shit-done" "get-shit-done"
restore_backup "$CLAUDE_DIR/agents" "agents"

echo ""
echo "Development teardown complete!"
echo ""
echo "To reinstall GSD normally, run: npx get-shit-done-reflect-cc --global"
echo ""
