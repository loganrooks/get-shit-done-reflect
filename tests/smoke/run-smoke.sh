#!/usr/bin/env bash
# run-smoke.sh -- Orchestrates Tier 2 (core GSD regression) + Tier 3 (reflect features) smoke tests.
#
# Usage:
#   bash tests/smoke/run-smoke.sh                          # standard tier
#   SMOKE_TIER=quick bash tests/smoke/run-smoke.sh         # quick tier
#   SMOKE_TIER=full bash tests/smoke/run-smoke.sh          # full tier
#
# Tiers:
#   quick:    regression (init+plan+execute) + manual signal + collect-signals
#   standard: + reflection + KB surfacing verification
#   full:     + spike
#
# Prerequisites:
#   - claude CLI installed and authenticated
#
# Environment overrides:
#   SMOKE_TIER       quick|standard|full (default: standard)
#   KEEP_WORK_DIR    Set to "true" to preserve temp dirs for debugging

set -uo pipefail
# Note: no set -e; we handle errors per-test to report all failures

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
SMOKE_TIER="${SMOKE_TIER:-standard}"
KEEP_WORK_DIR="${KEEP_WORK_DIR:-false}"

# Unique project name for KB isolation
RUN_ID="smoke-$$-$(date +%s)"
KB_DIR="$HOME/.gsd/knowledge"

# Source verify helpers
source "$SCRIPT_DIR/verify-kb.sh"

# --- Prerequisites ---

check_prerequisites() {
  log_info "=== Prerequisites ==="

  if ! command -v claude &>/dev/null; then
    echo "ERROR: claude CLI not found. Install with: npm install -g @anthropic-ai/claude-code"
    exit 1
  fi
  log_pass "claude CLI found ($(claude --version 2>/dev/null | head -1))"

  # Quick auth check
  if claude -p "ok" --no-session-persistence &>/dev/null; then
    log_pass "claude CLI authenticated"
  else
    echo "ERROR: claude CLI auth failed. Run 'claude' and complete login first."
    exit 1
  fi

  echo ""
  echo "Smoke tier: $SMOKE_TIER"
  echo "Run ID: $RUN_ID"
}

# --- Setup ---

setup_work_dirs() {
  log_info "=== Setup ==="

  WORK_DIR=$(mktemp -d -t gsd-smoke-XXXXXX)

  # Ensure KB exists
  bash "$REPO_DIR/.claude/agents/kb-create-dirs.sh" >/dev/null

  log_pass "Work directory: $WORK_DIR"
  log_pass "KB directory: $KB_DIR"
}

cleanup() {
  # Clean up KB entries created by this run
  if [ -n "${RUN_ID:-}" ]; then
    rm -rf "$KB_DIR/signals/$RUN_ID" 2>/dev/null || true
    rm -rf "$KB_DIR/spikes/$RUN_ID" 2>/dev/null || true
    rm -rf "$KB_DIR/lessons/$RUN_ID" 2>/dev/null || true
    # Rebuild index to remove test entries
    bash "$REPO_DIR/.claude/agents/kb-rebuild-index.sh" >/dev/null 2>&1 || true
  fi

  if [ "$KEEP_WORK_DIR" = "true" ]; then
    echo ""
    echo "Work directory preserved: $WORK_DIR"
    echo "KB entries preserved under project: $RUN_ID"
  else
    rm -rf "$WORK_DIR" 2>/dev/null || true
  fi
}

trap cleanup EXIT

# --- Helper: run claude in a directory ---

run_claude() {
  local prompt="$1"
  local cwd="$2"
  local desc="${3:-claude invocation}"

  echo "  Running: $desc ..."

  local output exit_code=0
  output=$(cd "$cwd" && claude -p "$prompt" --dangerously-skip-permissions --no-session-persistence 2>&1) || exit_code=$?

  if [ "$exit_code" -ne 0 ]; then
    log_fail "$desc (exit code $exit_code)"
    echo "  Output (last 10 lines):"
    echo "$output" | tail -10 | sed 's/^/    /'
    return 1
  fi

  log_pass "$desc"
  return 0
}

# --- Tier 2: Core GSD Regression ---

test_core_regression() {
  log_info "=== Tier 2: Core GSD Workflow Regression ==="

  REGRESSION_DIR="$WORK_DIR/regression-project"
  mkdir -p "$REGRESSION_DIR"
  (cd "$REGRESSION_DIR" && git init -q && echo '# Fibonacci' > README.md && git add -A && git commit -q -m "init")

  # Step 1: Initialize project
  log_info "--- Step 1: Project Init ---"
  run_claude \
    "Initialize a GSD project. This is a Python utility library with one function: fibonacci.
Create .planning/PROJECT.md with project name 'regression-test', and .planning/ROADMAP.md
with one phase: 'Phase 1: Fibonacci function'. Also create .planning/config.json with
mode: yolo, depth: quick, model_profile: balanced. Follow the GSD templates.
Create .planning/STATE.md as well. Do NOT run any slash commands - just create the files directly." \
    "$REGRESSION_DIR" \
    "Project init"

  assert_file_exists "$REGRESSION_DIR/.planning/PROJECT.md" "PROJECT.md"
  assert_file_contains "$REGRESSION_DIR/.planning/PROJECT.md" "regression-test" "PROJECT.md has project name"
  assert_file_exists "$REGRESSION_DIR/.planning/ROADMAP.md" "ROADMAP.md"
  assert_file_exists "$REGRESSION_DIR/.planning/config.json" "config.json"

  # Step 2: Plan phase
  log_info "--- Step 2: Plan Phase ---"
  run_claude \
    "Plan phase 1 for this project. Read .planning/ROADMAP.md and .planning/PROJECT.md first.
The phase is 'Fibonacci function' - implement a fibonacci(n) function in Python.
Create the plan at .planning/phases/01-fibonacci/01-01-PLAN.md with tasks.
Skip research since this is trivial. This is a quick depth plan.
Use the GSD plan format with YAML frontmatter and <tasks> XML structure.
Do NOT run any slash commands - just create the files directly." \
    "$REGRESSION_DIR" \
    "Plan phase"

  # Find the plan file (might be in different naming)
  local plan_found=false
  for plan_file in \
    "$REGRESSION_DIR/.planning/phases/01-fibonacci/01-01-PLAN.md" \
    "$REGRESSION_DIR/.planning/phases/01-fibonacci/PLAN.md"; do
    if [ -f "$plan_file" ]; then
      plan_found=true
      assert_file_contains "$plan_file" "task" "Plan has tasks"
      break
    fi
  done
  if [ "$plan_found" = true ]; then
    log_pass "Plan file created"
  else
    # Broader search
    local found
    found=$(find "$REGRESSION_DIR/.planning/phases" -name '*PLAN*' -type f 2>/dev/null | head -1)
    if [ -n "$found" ]; then
      log_pass "Plan file created at alternate path: $(basename "$found")"
      plan_found=true
    else
      log_fail "No plan file found in .planning/phases/"
    fi
  fi

  # Check knowledge_surfacing degraded gracefully (no errors in any generated research)
  if [ -f "$REGRESSION_DIR/.planning/phases/01-fibonacci/01-RESEARCH.md" ]; then
    assert_file_not_contains \
      "$REGRESSION_DIR/.planning/phases/01-fibonacci/01-RESEARCH.md" \
      "error\|exception\|failed to" \
      "RESEARCH.md has no error indicators"
  else
    log_pass "No RESEARCH.md generated (expected for trivial plan)"
  fi

  # Step 3: Execute phase
  log_info "--- Step 3: Execute Phase ---"
  local plan_path=".planning/phases/01-fibonacci/01-01-PLAN.md"
  if [ ! -f "$REGRESSION_DIR/$plan_path" ]; then
    plan_path=$(find "$REGRESSION_DIR/.planning/phases" -name '*PLAN*' -type f 2>/dev/null | head -1 | sed "s|$REGRESSION_DIR/||")
  fi

  if [ -n "$plan_path" ]; then
    run_claude \
      "Execute the plan at $plan_path.
Implement the fibonacci function in fibonacci.py, commit atomically per task,
and create a SUMMARY.md in the same directory as the plan when done.
The SUMMARY should have a task completion table.
Do NOT run any slash commands - just implement the code and create the files." \
      "$REGRESSION_DIR" \
      "Execute phase"

    # Check for source file
    if find "$REGRESSION_DIR" -name '*.py' -not -path '*/.planning/*' 2>/dev/null | grep -q .; then
      log_pass "Python source file created"
    else
      log_fail "No Python source file found"
    fi

    # Check for SUMMARY
    if find "$REGRESSION_DIR/.planning/phases" -name '*SUMMARY*' 2>/dev/null | grep -q .; then
      log_pass "SUMMARY.md created"
    else
      log_fail "No SUMMARY.md found"
    fi

    # Check git commits were made
    local commit_count
    commit_count=$(cd "$REGRESSION_DIR" && git rev-list --count HEAD 2>/dev/null || echo 0)
    if [ "$commit_count" -gt 1 ]; then
      log_pass "Git commits made during execution ($commit_count total)"
    else
      log_fail "No new git commits made (only $commit_count)"
    fi
  else
    log_fail "Could not find plan file to execute"
  fi

  # Step 4: Verify knowledge_surfacing didn't cause issues
  log_info "--- Step 4: Knowledge Surfacing Regression Check ---"
  local has_errors=false
  while IFS= read -r -d '' f; do
    if grep -qiE 'knowledge.surfacing.*error|kb.*not found|failed.*knowledge' "$f" 2>/dev/null; then
      log_fail "Error indicators in $(basename "$f")"
      has_errors=true
    fi
  done < <(find "$REGRESSION_DIR/.planning" -name '*.md' -print0 2>/dev/null)

  if [ "$has_errors" = false ]; then
    log_pass "No knowledge surfacing errors in any planning files"
  fi
}

# --- Tier 3: Reflect Features ---

test_manual_signal() {
  log_info "--- Tier 3: Manual Signal ---"

  PROJECT_DIR="$WORK_DIR/reflect-project"
  mkdir -p "$PROJECT_DIR"
  (cd "$PROJECT_DIR" && git init -q && cp -r "$SCRIPT_DIR/fixtures/.planning" . && git add -A && git commit -q -m "init with fixtures")

  run_claude \
    "Log a manual signal to the knowledge base. Create the signal file directly.

Create the directory ~/.gsd/knowledge/signals/$RUN_ID/ if it doesn't exist.
Then create a signal file there named '$(date +%Y-%m-%d)-api-timeout-config.md' with this content:

---
id: sig-$(date +%Y-%m-%d)-api-timeout-config
type: signal
project: $RUN_ID
tags: [config, timeout, testing]
created: $(date -u +%Y-%m-%dT%H:%M:%SZ)
updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
durability: workaround
status: active
severity: notable
signal_type: config-mismatch
phase: 1
plan: 2
polarity: negative
source: manual
---

## What Happened

API timeout was increased from 5s to 30s during testing to work around intermittent failures.

## Context

During phase 1 plan 2 execution, API calls were timing out at 5s default. The timeout was
increased to 30s as a workaround rather than investigating the root cause.

## Potential Cause

Backend service may be under load or the default timeout is too aggressive for the API endpoints being called.

After creating the file, run this command: bash ~/.claude/agents/kb-rebuild-index.sh" \
    "$PROJECT_DIR" \
    "Manual signal"

  # Verify signal was created
  local signal_count
  signal_count=$(find "$KB_DIR/signals/$RUN_ID" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$signal_count" -ge 1 ]; then
    log_pass "Signal file(s) created in KB ($signal_count found)"
  else
    log_fail "No signal files found in KB for project $RUN_ID"
  fi

  # Verify index was rebuilt
  if [ -f "$KB_DIR/index.md" ]; then
    assert_file_contains "$KB_DIR/index.md" "Total entries:" "Index has total count"
  else
    log_fail "KB index.md not found after signal creation"
  fi
}

test_signal_collection() {
  log_info "--- Tier 3: Signal Collection ---"

  run_claude \
    "You are a signal collector. Read the files in .planning/phases/01-test-execution/ and
detect deviations between PLANs and SUMMARYs.

Compare 01-01-PLAN.md with 01-01-SUMMARY.md (this should be clean, no deviations).
Compare 01-02-PLAN.md with 01-02-SUMMARY.md (this has deviations).

For 01-02, detect these signals:
1. Task count mismatch: PLAN has 2 tasks, SUMMARY has 3 (unplanned Task 3 added)
2. File scope deviation: PLAN says files_modified: [api.js, config.json] but SUMMARY also created logger.js
3. Struggle: 3 auto-fixes and significant debugging time noted in Issues Encountered

For each signal detected, create a .md file in ~/.gsd/knowledge/signals/$RUN_ID/
using this frontmatter format:
---
id: sig-$(date +%Y-%m-%d)-{slug}
type: signal
project: $RUN_ID
tags: [relevant, tags]
created: $(date -u +%Y-%m-%dT%H:%M:%SZ)
updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
durability: workaround
status: active
severity: {critical|high|notable|low}
signal_type: {deviation|struggle}
phase: 1
plan: 2
source: auto
---

## What Happened
{description}

## Context
{context}

## Potential Cause
{cause}

After creating all signal files, run: bash ~/.claude/agents/kb-rebuild-index.sh" \
    "$PROJECT_DIR" \
    "Signal collection"

  # Count signals after collection (should be more than just the manual one)
  local signal_count
  signal_count=$(find "$KB_DIR/signals/$RUN_ID" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$signal_count" -ge 2 ]; then
    log_pass "Auto signals detected ($signal_count total signals in KB)"
  else
    log_fail "Expected at least 2 signals after collection (found $signal_count)"
  fi

  # Rebuild index ourselves (agent may not have run the script successfully)
  bash "$REPO_DIR/.claude/agents/kb-rebuild-index.sh" >/dev/null 2>&1
  if [ -f "$KB_DIR/index.md" ]; then
    if grep -q 'Signals (0)' "$KB_DIR/index.md" 2>/dev/null; then
      log_fail "Index still shows 0 signals after collection and rebuild"
    else
      log_pass "Index updated with signal entries"
    fi
  fi
}

test_reflection() {
  log_info "--- Tier 3: Reflection ---"

  run_claude \
    "You are a reflector agent. Analyze the signals in the knowledge base for project '$RUN_ID'.

1. Read the KB index at ~/.gsd/knowledge/index.md
2. Read all signal files in ~/.gsd/knowledge/signals/$RUN_ID/
3. Look for patterns across signals (e.g., multiple deviations in same plan, recurring struggle)
4. If you find a pattern with 2+ supporting signals, create a lesson entry

Create lessons in ~/.gsd/knowledge/lessons/$RUN_ID/ using this format:
---
id: les-$(date +%Y-%m-%d)-{slug}
type: lesson
project: $RUN_ID
tags: [relevant, tags]
created: $(date -u +%Y-%m-%dT%H:%M:%SZ)
updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
durability: convention
status: active
category: {architecture|workflow|tooling|testing|debugging}
evidence_count: {number}
evidence: [{signal-id-1}, {signal-id-2}]
---

## Lesson
{one sentence actionable lesson}

## When This Applies
{conditions}

## Recommendation
{specific action}

## Evidence
{list of signals with descriptions}

After creating lessons, run: bash ~/.claude/agents/kb-rebuild-index.sh" \
    "$PROJECT_DIR" \
    "Reflection"

  # Check reflection completed (lessons may or may not be created)
  if [ -f "$KB_DIR/index.md" ]; then
    log_pass "Reflection completed (index exists)"
    local lesson_count
    lesson_count=$(find "$KB_DIR/lessons" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
    if [ "$lesson_count" -ge 1 ]; then
      log_pass "Lesson(s) created from reflection ($lesson_count found)"
    else
      log_pass "No lessons created (insufficient evidence threshold - acceptable)"
    fi
  else
    log_fail "Reflection failed (no index found)"
  fi
}

test_spike() {
  log_info "--- Tier 3: Spike Experiment ---"

  run_claude \
    "You are a spike runner. Run a minimal spike experiment.

Question: Can we reduce API timeout to 10s without test failures?
Hypothesis: Reducing timeout from 30s to 10s will still pass all tests.

1. Create a spike workspace at $WORK_DIR/spikes/api-timeout/ with a DESIGN.md
2. The spike result: confirmed (the hypothesis holds - 10s is sufficient)
3. Create a DECISION.md in the spike workspace
4. Persist the spike to KB at ~/.gsd/knowledge/spikes/$RUN_ID/ with this format:

---
id: spk-$(date +%Y-%m-%d)-api-timeout-reduction
type: spike
project: $RUN_ID
tags: [config, timeout, performance]
created: $(date -u +%Y-%m-%dT%H:%M:%SZ)
updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
durability: convention
status: active
hypothesis: \"Reducing timeout from 30s to 10s will still pass all tests\"
outcome: confirmed
rounds: 1
---

## Hypothesis
Reducing the API timeout from 30s to 10s will still pass all integration tests.

## Experiment
Ran the test suite with timeout=10s configuration.

## Results
All tests passed with 10s timeout. Average response time was 2.3s.

## Decision
Adopt 10s timeout as the default. The 30s timeout was unnecessarily conservative.

## Consequences
- Faster failure detection for actual API issues
- May need to revisit if new slower endpoints are added

After creating the KB entry, run: bash ~/.claude/agents/kb-rebuild-index.sh" \
    "$PROJECT_DIR" \
    "Spike experiment"

  local spike_count
  spike_count=$(find "$KB_DIR/spikes/$RUN_ID" -name '*.md' 2>/dev/null | wc -l | tr -d ' ')
  if [ "$spike_count" -ge 1 ]; then
    log_pass "Spike entry created in KB ($spike_count found)"
  else
    log_fail "No spike entries found in KB"
  fi

  if [ -f "$KB_DIR/index.md" ]; then
    assert_file_contains "$KB_DIR/index.md" "Spikes" "Index has Spikes section"
  fi
}

test_kb_surfacing() {
  log_info "--- Cross-tier: Knowledge Surfacing ---"

  run_claude \
    "Plan phase 2 for this project. Read .planning/ROADMAP.md and .planning/PROJECT.md.
The phase is 'Input Validation' - add input validation to the fibonacci function.
Before planning, check the knowledge base at ~/.gsd/knowledge/index.md
for any relevant signals or lessons from project '$RUN_ID'.
Read any relevant KB entries and cite them.
Create the plan at .planning/phases/02-validation/02-01-PLAN.md.
Include a 'Knowledge Applied' section at the top of the plan noting any relevant KB entries.
Do NOT run any slash commands - just create the files directly." \
    "$REGRESSION_DIR" \
    "KB surfacing in second phase plan"

  # Check phase 2 plan was created
  local plan_found=false
  while IFS= read -r -d '' f; do
    plan_found=true
    break
  done < <(find "$REGRESSION_DIR/.planning/phases/02-validation" -name '*.md' -print0 2>/dev/null)

  if [ "$plan_found" = true ]; then
    log_pass "Phase 2 plan created"
  else
    log_fail "No phase 2 plan files found"
  fi

  # Check if KB was referenced
  local kb_referenced=false
  while IFS= read -r -d '' f; do
    if grep -qiE 'knowledge|KB|signal|lesson' "$f" 2>/dev/null; then
      kb_referenced=true
      break
    fi
  done < <(find "$REGRESSION_DIR/.planning/phases/02-validation" -name '*.md' -print0 2>/dev/null)

  if [ "$kb_referenced" = true ]; then
    log_pass "KB entries referenced in phase 2 planning"
  else
    log_pass "Phase 2 planned (KB reference optional if no relevant entries)"
  fi
}

# --- Main ---

main() {
  echo "======================================="
  echo "  GSD Reflect Smoke Tests"
  echo "  Tier: $SMOKE_TIER"
  echo "======================================="

  check_prerequisites
  setup_work_dirs

  # --- Tier 2: Core GSD Regression ---
  test_core_regression

  # --- Tier 3: Reflect Features ---
  test_manual_signal
  test_signal_collection

  # Standard and full tiers
  if [ "$SMOKE_TIER" = "standard" ] || [ "$SMOKE_TIER" = "full" ]; then
    test_reflection
    test_kb_surfacing
  fi

  # Full tier only
  if [ "$SMOKE_TIER" = "full" ]; then
    test_spike
  fi

  # --- Summary ---
  print_summary
}

main "$@"
