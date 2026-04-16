#!/usr/bin/env bash
# Spike 010 dispatcher: 36 headless `claude -p` calls in a single linear pass.
#
# Matrix: 3 prompts × 2 models × 2 effort levels × 3 replicates
# Effort level is passed per-dispatch via --effort <level>; it overrides settings.json
# for that session. showThinkingSummaries=true is verified globally before launch.
#
# Each dispatch:
#   - claude -p "<PROMPT>" --model <m> --effort <e> [--tools ""] --output-format json
#   - stdout JSON parsed for session_id
#   - JSONL resolved at ~/.claude/projects/<cwd-slug>/<session_id>.jsonl
#   - appended to session_id_map.csv
#
# Rate-limit strategy: if a dispatch fails with exit != 0, log the error and continue
# to the next cell (do not retry — duration is a measured variable).
# Between dispatches: sleep 2s (minimizes rate-limit risk, preserves wall-clock measurement).

set -u  # undefined var is error; don't set -e (we want to continue past failures)

SPIKE_DIR="/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/spikes/010-parent-session-thinking-summary-proxy"
EXPERIMENTS_DIR="$SPIKE_DIR/experiments"
SESSION_MAP="$SPIKE_DIR/session_id_map.csv"
PROJECT_CWD="/home/rookslog/workspace/projects/get-shit-done-reflect"
JSONL_DIR="$HOME/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect"
LOG_FILE="$EXPERIMENTS_DIR/dispatch.log"

PROMPT_A='In one sentence, what does the Unix `ls` command do? Reply directly with one sentence and stop. Do not use any tools.'
PROMPT_BNOTOOLS='Without using any tools or external references, design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. Do not use any tools — respond directly with your reasoning and conclusions.'
PROMPT_BTOOLS="Design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. You may use tools (such as web search) if helpful, but don't feel obligated to. Provide your reasoning and conclusions."

# --- Prerequisites ---
CLAUDE_VERSION="$(claude --version 2>&1 | head -1)"
echo "[$(date -u +%FT%TZ)] dispatch.sh starting — claude=$CLAUDE_VERSION" | tee -a "$LOG_FILE"

STS="$(python3 -c 'import json,os; print(json.load(open(os.path.expanduser("~/.claude/settings.json"))).get("showThinkingSummaries"))' 2>/dev/null)"
echo "[$(date -u +%FT%TZ)] settings.json showThinkingSummaries=$STS" | tee -a "$LOG_FILE"
if [[ "$STS" != "True" ]]; then
  echo "ERROR: showThinkingSummaries is not True in ~/.claude/settings.json (got: $STS). Aborting." | tee -a "$LOG_FILE"
  exit 2
fi

# Write session_id_map.csv header (fresh)
echo "cell_id,model,prompt_cell,effort,replicate,tools_allowed,session_id,jsonl_path,started_at,ended_at,duration_s,exit_code,claude_version,error_note" > "$SESSION_MAP"

# --- Dispatch helper ---
# $1 cell_id, $2 model, $3 prompt_cell (A / B-notools / B-tools), $4 effort, $5 replicate
dispatch_one() {
  local cell_id="$1" model="$2" prompt_cell="$3" effort="$4" replicate="$5"
  local prompt tools_flag_allowed tools_args
  case "$prompt_cell" in
    A)         prompt="$PROMPT_A";         tools_flag_allowed="false" ;;
    B-notools) prompt="$PROMPT_BNOTOOLS";  tools_flag_allowed="false" ;;
    B-tools)   prompt="$PROMPT_BTOOLS";    tools_flag_allowed="true"  ;;
    *) echo "unknown prompt_cell: $prompt_cell" >&2; return 1 ;;
  esac

  local started_at ended_at duration_s exit_code session_id jsonl_path stdout_file error_note=""
  stdout_file="$EXPERIMENTS_DIR/stdout_cell_${cell_id}.json"
  started_at="$(date -u +%FT%TZ)"
  local t0 t1
  t0="$(date +%s)"

  echo "[$started_at] cell=$cell_id model=$model prompt=$prompt_cell effort=$effort rep=$replicate tools_allowed=$tools_flag_allowed DISPATCH" | tee -a "$LOG_FILE"

  # Build + invoke
  if [[ "$tools_flag_allowed" == "true" ]]; then
    (cd "$PROJECT_CWD" && claude -p "$prompt" \
      --model "$model" \
      --effort "$effort" \
      --output-format json) > "$stdout_file" 2>>"$LOG_FILE"
    exit_code=$?
  else
    (cd "$PROJECT_CWD" && claude -p "$prompt" \
      --model "$model" \
      --effort "$effort" \
      --tools "" \
      --output-format json) > "$stdout_file" 2>>"$LOG_FILE"
    exit_code=$?
  fi

  t1="$(date +%s)"
  duration_s=$((t1 - t0))
  ended_at="$(date -u +%FT%TZ)"

  if [[ $exit_code -eq 0 ]]; then
    session_id="$(python3 -c "import json,sys; d=json.load(open('$stdout_file')); print(d.get('session_id',''))" 2>/dev/null || echo "")"
    jsonl_path="$JSONL_DIR/${session_id}.jsonl"
    if [[ -z "$session_id" ]]; then
      error_note="no session_id in stdout"
    elif [[ ! -f "$jsonl_path" ]]; then
      error_note="jsonl missing at expected path"
    fi
  else
    session_id=""
    jsonl_path=""
    error_note="exit_code=$exit_code"
    # Detect common rate-limit signatures in stdout
    if grep -qiE 'rate.?limit|429|too many requests' "$stdout_file" 2>/dev/null; then
      error_note="$error_note;rate_limit_suspected"
      echo "[$ended_at] cell=$cell_id rate-limit suspected; backing off 30s" | tee -a "$LOG_FILE"
      sleep 30
    fi
  fi

  # CSV-safe error_note
  local error_note_csv="${error_note//,/ }"
  printf '%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' \
    "$cell_id" "$model" "$prompt_cell" "$effort" "$replicate" "$tools_flag_allowed" \
    "$session_id" "$jsonl_path" "$started_at" "$ended_at" "$duration_s" "$exit_code" \
    "$CLAUDE_VERSION" "$error_note_csv" >> "$SESSION_MAP"

  echo "[$ended_at] cell=$cell_id exit=$exit_code dur=${duration_s}s session_id=$session_id note='$error_note'" | tee -a "$LOG_FILE"
}

# --- Matrix (per DESIGN.md §Dispatch Matrix; 36 cells) ---
# Groups: (model, prompt) - 6 cells per group - effort alternates low then high; each replicated 3×.
# Order of groups arranged so B-tools (tool calls) runs last, matching the matrix in DESIGN.md.

# Group 1: sonnet / A
dispatch_one  1 sonnet A        low  1; sleep 2
dispatch_one  2 sonnet A        low  2; sleep 2
dispatch_one  3 sonnet A        low  3; sleep 2
dispatch_one  4 sonnet A        high 1; sleep 2
dispatch_one  5 sonnet A        high 2; sleep 2
dispatch_one  6 sonnet A        high 3; sleep 2
# Group 2: opus / A
dispatch_one  7 opus   A        low  1; sleep 2
dispatch_one  8 opus   A        low  2; sleep 2
dispatch_one  9 opus   A        low  3; sleep 2
dispatch_one 10 opus   A        high 1; sleep 2
dispatch_one 11 opus   A        high 2; sleep 2
dispatch_one 12 opus   A        high 3; sleep 2
# Group 3: sonnet / B-notools
dispatch_one 13 sonnet B-notools low  1; sleep 2
dispatch_one 14 sonnet B-notools low  2; sleep 2
dispatch_one 15 sonnet B-notools low  3; sleep 2
dispatch_one 16 sonnet B-notools high 1; sleep 2
dispatch_one 17 sonnet B-notools high 2; sleep 2
dispatch_one 18 sonnet B-notools high 3; sleep 2
# Group 4: opus / B-notools
dispatch_one 19 opus   B-notools low  1; sleep 2
dispatch_one 20 opus   B-notools low  2; sleep 2
dispatch_one 21 opus   B-notools low  3; sleep 2
dispatch_one 22 opus   B-notools high 1; sleep 2
dispatch_one 23 opus   B-notools high 2; sleep 2
dispatch_one 24 opus   B-notools high 3; sleep 2
# Group 5: sonnet / B-tools
dispatch_one 25 sonnet B-tools  low  1; sleep 2
dispatch_one 26 sonnet B-tools  low  2; sleep 2
dispatch_one 27 sonnet B-tools  low  3; sleep 2
dispatch_one 28 sonnet B-tools  high 1; sleep 2
dispatch_one 29 sonnet B-tools  high 2; sleep 2
dispatch_one 30 sonnet B-tools  high 3; sleep 2
# Group 6: opus / B-tools
dispatch_one 31 opus   B-tools  low  1; sleep 2
dispatch_one 32 opus   B-tools  low  2; sleep 2
dispatch_one 33 opus   B-tools  low  3; sleep 2
dispatch_one 34 opus   B-tools  high 1; sleep 2
dispatch_one 35 opus   B-tools  high 2; sleep 2
dispatch_one 36 opus   B-tools  high 3

echo "[$(date -u +%FT%TZ)] dispatch.sh done" | tee -a "$LOG_FILE"
