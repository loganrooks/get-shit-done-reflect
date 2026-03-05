#!/usr/bin/env bash
set -euo pipefail

SRC="$HOME/.gsd/knowledge"
DEST=".planning/knowledge"

if [ ! -d "$SRC" ]; then
  echo "No source KB at $SRC -- nothing to migrate"
  exit 0
fi

if [ ! -d "$DEST" ]; then
  echo "Destination $DEST does not exist. Run installer first."
  exit 1
fi

# Copy signals (preserve directory structure)
if [ -d "$SRC/signals" ] && [ "$(ls -A "$SRC/signals/" 2>/dev/null)" ]; then
  cp -r "$SRC/signals/"* "$DEST/signals/" 2>/dev/null || true
  echo "Migrated signals"
fi

# Copy reflections
if [ -d "$SRC/reflections" ] && [ "$(ls -A "$SRC/reflections/" 2>/dev/null)" ]; then
  cp -r "$SRC/reflections/"* "$DEST/reflections/" 2>/dev/null || true
  echo "Migrated reflections"
fi

# Copy spikes
if [ -d "$SRC/spikes" ] && [ "$(ls -A "$SRC/spikes/" 2>/dev/null)" ]; then
  cp -r "$SRC/spikes/"* "$DEST/spikes/" 2>/dev/null || true
  echo "Migrated spikes"
fi

# Lessons are NOT migrated (deprecated)
echo "Note: Lessons NOT migrated (deprecated). Historical lessons remain at $SRC/lessons/"

echo ""
echo "Migration complete. Run kb-rebuild-index.sh to generate index at $DEST/index.md"
