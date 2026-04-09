#!/bin/bash
# Spike 008: Codex CLI OTel test session
# Adds temporary OTel config, runs a test, then removes it.
#
# Usage: bash .planning/spikes/008-cross-runtime-otel-and-bridge-validation/run-codex-otel.sh

set -euo pipefail

LOGFILE=".planning/spikes/008-cross-runtime-otel-and-bridge-validation/codex-otel-output.log"
CONFIG="$HOME/.codex/config.toml"
BACKUP="$HOME/.codex/config.toml.pre-spike-backup"

echo "=== Spike 008: Codex CLI OTel Test ==="
echo "Log file: $LOGFILE"
echo ""

# Backup config
cp "$CONFIG" "$BACKUP"
echo "Backed up config to: $BACKUP"

# Check if [otel] section already exists
if grep -q '^\[otel\]' "$CONFIG"; then
    echo "WARNING: [otel] section already exists in config. Skipping append."
else
    echo "" >> "$CONFIG"
    echo "# Spike 008: temporary OTel test config (remove after spike)" >> "$CONFIG"
    echo '[otel]' >> "$CONFIG"
    echo 'environment = "spike-test"' >> "$CONFIG"
    echo 'exporter = "console"' >> "$CONFIG"
    echo 'log_user_prompt = false' >> "$CONFIG"
    echo "Added [otel] section to config."
fi

echo ""
echo "Running: codex exec 'List the files in the current directory and show git status'"
echo ""

codex exec "List the files in the current directory and show git status" 2>&1 | tee "$LOGFILE"

echo ""
echo "=== Restoring original config ==="
cp "$BACKUP" "$CONFIG"
rm "$BACKUP"
echo "Config restored. OTel section removed."
echo ""
echo "=== Codex OTel output saved to: $LOGFILE ==="
echo "Analyze with: grep -E 'codex\.\|otel\|metric\|event' $LOGFILE"
