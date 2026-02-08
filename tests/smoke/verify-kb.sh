#!/usr/bin/env bash
# verify-kb.sh -- Helper functions for KB state checks in smoke tests.
# Source this file: source tests/smoke/verify-kb.sh

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

log_pass() {
  echo -e "  ${GREEN}PASS${NC} $1"
  PASS_COUNT=$((PASS_COUNT + 1))
}

log_fail() {
  echo -e "  ${RED}FAIL${NC} $1"
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

log_skip() {
  echo -e "  ${YELLOW}SKIP${NC} $1"
  SKIP_COUNT=$((SKIP_COUNT + 1))
}

log_info() {
  echo -e "\n${YELLOW}$1${NC}"
}

# Check that a file exists
# Usage: assert_file_exists "path" "description"
assert_file_exists() {
  local file_path="$1"
  local desc="${2:-$file_path}"
  if [ -f "$file_path" ]; then
    log_pass "$desc exists"
    return 0
  else
    log_fail "$desc does not exist: $file_path"
    return 1
  fi
}

# Check that a directory exists
# Usage: assert_dir_exists "path" "description"
assert_dir_exists() {
  local dir_path="$1"
  local desc="${2:-$dir_path}"
  if [ -d "$dir_path" ]; then
    log_pass "$desc exists"
    return 0
  else
    log_fail "$desc does not exist: $dir_path"
    return 1
  fi
}

# Check that a file contains a string
# Usage: assert_file_contains "path" "needle" "description"
assert_file_contains() {
  local file_path="$1"
  local needle="$2"
  local desc="${3:-$file_path contains '$needle'}"
  if [ ! -f "$file_path" ]; then
    log_fail "$desc (file not found: $file_path)"
    return 1
  fi
  if grep -q "$needle" "$file_path" 2>/dev/null; then
    log_pass "$desc"
    return 0
  else
    log_fail "$desc"
    return 1
  fi
}

# Check that a file does NOT contain a string
# Usage: assert_file_not_contains "path" "needle" "description"
assert_file_not_contains() {
  local file_path="$1"
  local needle="$2"
  local desc="${3:-$file_path does not contain '$needle'}"
  if [ ! -f "$file_path" ]; then
    log_pass "$desc (file does not exist)"
    return 0
  fi
  if grep -qi "$needle" "$file_path" 2>/dev/null; then
    log_fail "$desc"
    return 1
  else
    log_pass "$desc"
    return 0
  fi
}

# Check KB signal count
# Usage: assert_signal_count KB_DIR expected_count "description"
assert_signal_count() {
  local kb_dir="$1"
  local expected="$2"
  local desc="${3:-Signal count is $expected}"
  local count
  count=$(find "$kb_dir/signals" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$count" -eq "$expected" ]; then
    log_pass "$desc (found $count)"
    return 0
  else
    log_fail "$desc (expected $expected, found $count)"
    return 1
  fi
}

# Check that KB index exists and has expected total
# Usage: assert_index_total KB_DIR expected_total "description"
assert_index_total() {
  local kb_dir="$1"
  local expected="$2"
  local desc="${3:-Index total is $expected}"
  local index="$kb_dir/index.md"
  if [ ! -f "$index" ]; then
    log_fail "$desc (index.md not found)"
    return 1
  fi
  local total
  total=$(grep 'Total entries:' "$index" | sed 's/.*Total entries:[[:space:]]*//' | tr -d ' ')
  if [ "$total" = "$expected" ]; then
    log_pass "$desc"
    return 0
  else
    log_fail "$desc (expected $expected, found '$total')"
    return 1
  fi
}

# Check that a signal file has valid frontmatter
# Usage: assert_signal_valid "path" "description"
assert_signal_valid() {
  local file_path="$1"
  local desc="${2:-Signal $file_path is valid}"
  if [ ! -f "$file_path" ]; then
    log_fail "$desc (file not found)"
    return 1
  fi

  local errors=""
  grep -q '^id:' "$file_path" || errors="${errors}missing id; "
  grep -q '^type: signal' "$file_path" || errors="${errors}missing type:signal; "
  grep -q '^severity:' "$file_path" || errors="${errors}missing severity; "
  grep -q '^signal_type:' "$file_path" || errors="${errors}missing signal_type; "
  grep -q '## What Happened' "$file_path" || errors="${errors}missing 'What Happened' section; "

  if [ -z "$errors" ]; then
    log_pass "$desc"
    return 0
  else
    log_fail "$desc ($errors)"
    return 1
  fi
}

# Print summary
print_summary() {
  local total=$((PASS_COUNT + FAIL_COUNT + SKIP_COUNT))
  echo ""
  echo "================================="
  echo -e "Results: ${GREEN}${PASS_COUNT} passed${NC}, ${RED}${FAIL_COUNT} failed${NC}, ${YELLOW}${SKIP_COUNT} skipped${NC} (${total} total)"
  echo "================================="

  if [ "$FAIL_COUNT" -gt 0 ]; then
    return 1
  fi
  return 0
}
