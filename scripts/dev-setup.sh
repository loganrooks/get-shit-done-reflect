#!/bin/bash
# Development setup script for GSD Reflect
# Creates symlinks from ~/.claude/ to repo files for instant hot reload
# Mac/Linux only (per CONTEXT.md decision)

set -e

CLAUDE_DIR="$HOME/.claude"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "GSD Reflect Development Setup"
echo "=============================="
echo ""
echo "Repo: $REPO_DIR"
echo "Target: $CLAUDE_DIR"
echo ""

# Ensure base directory exists
mkdir -p "$CLAUDE_DIR"
mkdir -p "$CLAUDE_DIR/commands"

# Check for and backup existing non-symlink directories
backup_if_needed() {
  local target="$1"
  local name="$2"

  if [ -d "$target" ] && [ ! -L "$target" ]; then
    echo "Backing up existing $name to ${name}.bak"
    mv "$target" "${target}.bak"
  elif [ -L "$target" ]; then
    echo "Removing existing symlink: $name"
    rm "$target"
  fi
}

backup_if_needed "$CLAUDE_DIR/commands/gsd" "commands/gsd"
backup_if_needed "$CLAUDE_DIR/get-shit-done" "get-shit-done"
backup_if_needed "$CLAUDE_DIR/agents" "agents"

# Create symlinks
echo ""
echo "Creating symlinks..."

ln -sfn "$REPO_DIR/commands/gsd" "$CLAUDE_DIR/commands/gsd"
echo "  $CLAUDE_DIR/commands/gsd -> $REPO_DIR/commands/gsd"

ln -sfn "$REPO_DIR/get-shit-done" "$CLAUDE_DIR/get-shit-done"
echo "  $CLAUDE_DIR/get-shit-done -> $REPO_DIR/get-shit-done"

ln -sfn "$REPO_DIR/agents" "$CLAUDE_DIR/agents"
echo "  $CLAUDE_DIR/agents -> $REPO_DIR/agents"

echo ""
echo "Development setup complete!"
echo ""
echo "Changes to files in the repo now reflect immediately in Claude Code."
echo "To restore original state, run: scripts/dev-teardown.sh"
echo ""
