#!/usr/bin/env bash
# kb-create-dirs.sh -- Initialize the GSD knowledge store directory structure.
# Idempotent: safe to run multiple times.

KB_DIR="$HOME/.claude/gsd-knowledge"

mkdir -p "$KB_DIR/signals"
mkdir -p "$KB_DIR/spikes"
mkdir -p "$KB_DIR/lessons"

echo "Knowledge store directories verified at $KB_DIR:"
echo "  signals/"
echo "  spikes/"
echo "  lessons/"
exit 0
