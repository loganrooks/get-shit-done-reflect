#!/usr/bin/env bash
# Spike 010 retry: re-dispatch the 6 cells that failed with exit_code=1 during the initial run.
# Failed cells: 9, 12, 21, 31, 35, 36 — all Opus (hit Anthropic 529 overloads).
#
# Strategy: pairs of 2 in parallel, 3 waves, bash `&` + `wait`.
# Successful retries are APPENDED to session_id_map.csv with cell_id prefixed "R_"
# so the extractor can distinguish and prefer the retry row per cell_id.

set -u

SPIKE_DIR="/home/rookslog/workspace/projects/get-shit-done-reflect/.planning/spikes/010-parent-session-thinking-summary-proxy"
EXPERIMENTS_DIR="$SPIKE_DIR/experiments"
SESSION_MAP="$SPIKE_DIR/session_id_map.csv"
PROJECT_CWD="/home/rookslog/workspace/projects/get-shit-done-reflect"
JSONL_DIR="$HOME/.claude/projects/-home-rookslog-workspace-projects-get-shit-done-reflect"
LOG_FILE="$EXPERIMENTS_DIR/retry.log"

PROMPT_A='In one sentence, what does the Unix `ls` command do? Reply directly with one sentence and stop. Do not use any tools.'
PROMPT_BNOTOOLS='Without using any tools or external references, design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. Do not use any tools — respond directly with your reasoning and conclusions.'
PROMPT_BTOOLS="Design an epistemology for an AI agent that must make consequential decisions under persistent uncertainty. Propose four foundational principles, describe how they interact (including where they conflict), and identify the strongest objection to each. Think carefully before answering. You may use tools (such as web search) if helpful, but don't feel obligated to. Provide your reasoning and conclusions."

CLAUDE_VERSION="$(claude --version 2>&1 | head -1)"
echo "[$(date -u +%FT%TZ)] retry_failed.sh starting — claude=$CLAUDE_VERSION" | tee -a "$LOG_FILE"

dispatch_one() {
  local cell_id="$1" model="$2" prompt_cell="$3" effort="$4" replicate="$5"
  local prompt tools_flag_allowed
  case "$prompt_cell" in
    A)         prompt="$PROMPT_A";         tools_flag_allowed="false" ;;
    B-notools) prompt="$PROMPT_BNOTOOLS";  tools_flag_allowed="false" ;;
    B-tools)   prompt="$PROMPT_BTOOLS";    tools_flag_allowed="true"  ;;
    *) echo "unknown prompt_cell: $prompt_cell" >&2; return 1 ;;
  esac

  local started_at ended_at duration_s exit_code session_id jsonl_path stdout_file error_note=""
  stdout_file="$EXPERIMENTS_DIR/stdout_cell_${cell_id}_retry.json"
  started_at="$(date -u +%FT%TZ)"
  local t0 t1
  t0="$(date +%s)"

  echo "[$started_at] RETRY cell=$cell_id model=$model prompt=$prompt_cell effort=$effort rep=$replicate" | tee -a "$LOG_FILE"

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
    error_note="retry_exit_code=$exit_code"
    if grep -qiE '529|overload|rate.?limit|429|too many requests' "$stdout_file" 2>/dev/null; then
      error_note="$error_note;overload_or_rate_limit"
    fi
  fi

  # Append retry row with cell_id prefixed "R_"
  local error_note_csv="${error_note//,/ }"
  printf 'R_%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s\n' \
    "$cell_id" "$model" "$prompt_cell" "$effort" "$replicate" "$tools_flag_allowed" \
    "$session_id" "$jsonl_path" "$started_at" "$ended_at" "$duration_s" "$exit_code" \
    "$CLAUDE_VERSION" "$error_note_csv" >> "$SESSION_MAP"

  echo "[$ended_at] RETRY cell=$cell_id exit=$exit_code dur=${duration_s}s session_id=$session_id note='$error_note'" | tee -a "$LOG_FILE"
}

# Failed cells per session_id_map.csv:
#   9  opus A         low  3
#   12 opus A         high 3
#   21 opus B-notools low  3
#   31 opus B-tools   low  1
#   35 opus B-tools   high 2
#   36 opus B-tools   high 3

# Wave 1: 9 + 12 (both Opus A)
echo "[$(date -u +%FT%TZ)] Wave 1: cells 9 + 12" | tee -a "$LOG_FILE"
dispatch_one  9 opus A         low  3 &
dispatch_one 12 opus A         high 3 &
wait
sleep 5

# Wave 2: 21 + 31
echo "[$(date -u +%FT%TZ)] Wave 2: cells 21 + 31" | tee -a "$LOG_FILE"
dispatch_one 21 opus B-notools low  3 &
dispatch_one 31 opus B-tools   low  1 &
wait
sleep 5

# Wave 3: 35 + 36 (both Opus B-tools high)
echo "[$(date -u +%FT%TZ)] Wave 3: cells 35 + 36" | tee -a "$LOG_FILE"
dispatch_one 35 opus B-tools   high 2 &
dispatch_one 36 opus B-tools   high 3 &
wait

echo "[$(date -u +%FT%TZ)] retry_failed.sh done" | tee -a "$LOG_FILE"
