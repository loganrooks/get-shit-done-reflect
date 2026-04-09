#!/bin/bash
# Spike 008: Claude Code OTel test session
# Run this to launch Claude Code with OTel console exporter enabled.
# Output goes to both terminal and log file for analysis.
#
# Usage: bash .planning/spikes/008-cross-runtime-otel-and-bridge-validation/run-claude-otel.sh

set -euo pipefail

LOGFILE=".planning/spikes/008-cross-runtime-otel-and-bridge-validation/claude-otel-output.log"

echo "=== Spike 008: Claude Code OTel Test ==="
echo "Log file: $LOGFILE"
echo ""
echo "In the session, do these steps to trigger different event types:"
echo "  1. Ask a simple question (triggers api_request + token.usage)"
echo "  2. Run a Bash command (triggers tool_result)"
echo "  3. Edit a file (triggers code_edit_tool.decision)"
echo "  4. Type /cost to see cost data"
echo "  5. Exit"
echo ""
echo "Press Enter to launch..."
read

CLAUDE_CODE_ENABLE_TELEMETRY=1 \
OTEL_METRICS_EXPORTER=console \
OTEL_LOGS_EXPORTER=console \
OTEL_METRIC_EXPORT_INTERVAL=10000 \
OTEL_LOG_TOOL_DETAILS=1 \
claude 2>&1 | tee "$LOGFILE"

echo ""
echo "=== OTel output saved to: $LOGFILE ==="
echo "Analyze with: grep -E 'claude_code\.|codex\.' $LOGFILE"
