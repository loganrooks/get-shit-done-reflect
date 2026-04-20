---
phase: 58-structural-enforcement-gates
plan: 02
artifact_type: gate_design
gate: GATE-13
generated: 2026-04-20
codex_behavior: applies
codex_motivating_scenario: auto-compact-prompt-parity-gap
fire_event_gate05: .planning/delegation-log.jsonl line-append per spawn
fire_event_gate13: CI grep returns 0 hits for templated model= inside Task()
consumed_by: 58-12-PLAN.md (Wave 3 Plan 12)
resolves_signals:
  - sig-2026-04-10-researcher-model-override-leak-third-occurrence
  - sig-2026-04-17-codex-auto-compact-prompt-parity-gap
---

# GATE-13 Dispatch-Contract Design: echo_delegation Macro + Inline Contract Restatement

This artifact is the single source of truth for the transformation Wave 3
Plan 12 performs on every row of `58-02-gate05-enumeration.md`. Two pattern
blocks are defined:

1. A **shell-native echo macro** that fires `.planning/delegation-log.jsonl`
   (the GATE-05 fire-event).
2. An **inline dispatch-contract comment block** that sits immediately above
   every `Task(` invocation and survives auto-compact (the GATE-13 resilience
   property).

Both blocks are inserted at every live spawn site listed in
`58-02-gate05-enumeration.md` §4.2 rows 1–45.

---

## 1. Echo Macro (GATE-05)

### 1.1 Exact shell block

This is the literal text Plan 12 inserts immediately before every `Task(`
block. It is **copy-paste identical** across every insertion site — the only
variables that change per site are the values assigned to the six env vars.

```bash
# GATE-05 echo_delegation macro — prints to user + appends to delegation log.
# Fire-event: one line appended to .planning/delegation-log.jsonl per spawn.
SUBAGENT_TYPE="<agent-type-from-enumeration>"
MODEL="<literal-model-from-resolveModelInternal-or-template-if-dynamic>"
REASONING_EFFORT="<literal-or-default>"
ISOLATION="<isolation-mode-or-'none'>"
SESSION_ID="${GSD_SESSION_ID:-$(date +%Y%m%d-%H%M%S)-$$}"
WORKFLOW_FILE="<relative-path-of-this-file>"
WORKFLOW_STEP="<named-step-of-this-spawn>"
RUNTIME="${GSD_RUNTIME:-claude-code}"

echo "[DELEGATION] agent=${SUBAGENT_TYPE} model=${MODEL} reasoning_effort=${REASONING_EFFORT} isolation=${ISOLATION:-none} session=${SESSION_ID}"

mkdir -p .planning 2>/dev/null || true
printf '{"ts":"%s","agent":"%s","model":"%s","reasoning_effort":"%s","isolation":"%s","session_id":"%s","workflow_file":"%s","workflow_step":"%s","runtime":"%s"}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "${SUBAGENT_TYPE}" \
  "${MODEL}" \
  "${REASONING_EFFORT}" \
  "${ISOLATION:-none}" \
  "${SESSION_ID}" \
  "${WORKFLOW_FILE}" \
  "${WORKFLOW_STEP}" \
  "${RUNTIME}" \
  >> .planning/delegation-log.jsonl || true
```

### 1.2 Properties

- **Idempotent on failure.** The `|| true` on the `printf >> …jsonl` line
  ensures a write-permission or disk-full error on the log file does NOT
  block the spawn that follows. A failed append leaves the log shorter than
  reality but preserves spawn semantics. The workflow continues.
- **Creates only `.planning/`.** The `mkdir -p .planning` runs only for the
  one directory the macro needs. No sibling directories created.
- **Stdout to user.** The first `echo` line prints to the user so misconfig
  is visible BEFORE the spawn — addresses
  `sig-2026-04-10-researcher-model-override-leak-third-occurrence` directly.
- **JSONL line structure.** One line per spawn, parseable by Phase 57.5's
  extractor registry once Plan 19 registers the `delegation_log` extractor.
- **UTC timestamp.** `date -u +%Y-%m-%dT%H:%M:%SZ` matches the canonical
  extractor timestamp format used elsewhere.
- **Runtime attribution.** The `GSD_RUNTIME` env var lets Codex sessions
  override to `codex-cli`; default `claude-code` for Claude Code sessions.
  Plan 19 can filter the JSONL by runtime for cross-runtime measurement.
- **Session id fallback.** `GSD_SESSION_ID` is populated when available
  (hook provides it); fallback uses timestamp+pid so two spawns in the same
  second get distinct ids.

### 1.3 Per-site variable assignment

The enumeration artifact already names the values for each site. For example,
row 3 (`research-phase.md:63`):

```bash
SUBAGENT_TYPE="gsd-phase-researcher"
MODEL="claude-opus-4-6"       # literal from resolveModelInternal at edit time
REASONING_EFFORT="high"        # from MODEL_PROFILES default
ISOLATION="none"
WORKFLOW_FILE="get-shit-done/workflows/research-phase.md"
WORKFLOW_STEP="Spawn Researcher"
```

### 1.4 Macro placement

**Insert immediately above the existing `Task(` block** — inside the same
fenced shell code block if one exists, or in a new fenced shell block directly
above the fenced `Task(` block if the workflow alternates prose→`Task()`.

For markdown workflows that show `Task(` inside a fenced code block with no
surrounding shell, Plan 12 wraps the macro in its own fenced `bash` block and
adds a one-line prose cue (e.g., "Before spawning, run the GATE-05 echo
macro:") to preserve readability.

---

## 2. Inline Dispatch-Contract Restatement (GATE-13)

### 2.1 Exact comment block

This is the literal text Plan 12 inserts immediately above (or as the first
lines inside) every `Task(` block. Every `#` comment line survives
auto-compact verbatim because the compacter treats them as literal prose, not
template expressions.

```
# DISPATCH CONTRACT (restated inline per GATE-13 — compaction-resilient)
# Agent: gsd-phase-researcher
# Model: claude-opus-4-6          (resolved from {researcher_model} at workflow expansion via resolveModelInternal)
# Reasoning effort: high
# Isolation: none
# Required inputs:
#   - .planning/phases/{PHASE}-*/{PHASE}-CONTEXT.md
#   - @.planning/PROJECT.md
#   - @.planning/ROADMAP.md
# Output path: .planning/phases/{PHASE}-*/{PHASE}-RESEARCH.md
# Codex behavior: applies-via-workflow-step
# Fire-event: delegation-log.jsonl line appended by GATE-05 macro above
Task(
  subagent_type="gsd-phase-researcher",
  model="claude-opus-4-6",   # BAKED IN at workflow expansion — was {researcher_model}
  reasoning_effort="high",
  description="Research Phase {phase}",
  prompt="<...>"
)
```

### 2.2 Field contract

Every dispatch-contract block MUST contain all nine fields:

| Field | Required | Source |
|-------|----------|--------|
| Agent | yes | literal, from enumeration `agent_type` column |
| Model | yes | literal string, resolved from enumeration `model_source` via `resolveModelInternal` at edit time |
| Reasoning effort | yes | literal or "default" |
| Isolation | yes | "none" / "worktree" / "branch" — matches the `Task()` call |
| Required inputs | yes | explicit `@`-path list (one per line) |
| Output path | yes | explicit relative path or "N/A" |
| Codex behavior | yes | "applies" / "does-not-apply-with-reason" / "applies-via-workflow-step" |
| Fire-event | yes | reference to the GATE-05 macro immediately above |
| (optional) Originating signal | no | if the spawn exists because of a signal, cite it |

### 2.3 Baking in literals

**The literal model string MUST replace the template variable at workflow
expansion time** (when Plan 12 runs). The runtime `Task()` call retains its
template variable on the `model=` argument (so a future model-profile change
propagates through `resolveModelInternal` normally) — the resilience property
lives in the **comment block**.

Plan 12 executes:

```
literal_model = resolveModelInternal(cwd, agent_type_from_enumeration)
```

at edit time, pastes `literal_model` into the `# Model:` comment line, and
leaves the `Task()` body's `model=` attribute unchanged.

If the runtime config changes profile later, the comment drifts from the
runtime binding — but the comment was never the dispatch authority. It is
the **compaction-survival record** of what the dispatch was at authorship
time. The GATE-13 CI grep (Section 4) and a Plan 12-owned unit test keep the
comment and the runtime binding consistent; drift is audited on every CI
run, not silently accumulated.

### 2.4 Placement semantics

Place the comment block **directly above** the `Task(` call. A blank line
before and after the comment block improves readability.

For workflow files that render `Task()` inside markdown fenced code blocks,
the comment block goes **inside the same fenced block** (so it travels with
the call under compaction).

For workflow files that render `Task()` as part of a multi-step markdown
narrative (e.g., `new-project.md`'s single-line `Task(...)` invocations),
Plan 12 splits the call across multiple lines and inserts the comment block
above.

---

## 3. `resolveModelInternal` Integration

### 3.1 Interface contract

From `get-shit-done/bin/lib/core.cjs:1463`:

```js
function resolveModelInternal(cwd, agentType)
```

- `cwd` — project root; Plan 12 passes `process.cwd()` since edits run in
  repo root.
- `agentType` — string matching one of:
  - `gsd-<name>` (canonical form — e.g., `gsd-phase-researcher`)
  - `gsdr-<name>` (fork variant — the function strips the `gsdr-` prefix
    internally and looks up by canonical form)
  - `general-purpose` — Plan 12 must map this to a concrete agent type
    before calling (see §3.3 below); calling with `general-purpose` directly
    returns `sonnet` from the fallback branch, which is wrong for research /
    planner sites.
- Returns: a model alias string (e.g., `opus`, `sonnet`, `haiku`, `inherit`)
  OR a concrete model id (when `resolve_model_ids` is truthy) OR empty string
  (when `resolve_model_ids === 'omit'`).

### 3.2 Three resolution cases

**Case A — `resolve_model_ids` unset or `aliases`:**
Returns an alias. The inline comment records the alias verbatim, e.g.,
`# Model: opus (alias; claude-opus-4-6 at 2026-04-20)`.

**Case B — `resolve_model_ids === 'ids'`:**
Returns a concrete id (per the `MODEL_ALIAS_MAP` in core.cjs:1457). The
inline comment records the id verbatim, e.g., `# Model: claude-opus-4-6`.

**Case C — `resolve_model_ids === 'omit'`:**
Returns an empty string — the runtime will use its own default. The inline
comment MUST record this condition explicitly:
`# Model: <omitted — runtime default> (resolve_model_ids=omit)`.
The GATE-13 CI grep (Section 4) treats this form as **valid** (it is not a
`{...}` template) while still keeping the attribution honest.

### 3.3 Mapping `general-purpose` proxy sites

Eleven enumeration rows use `subagent_type="general-purpose"` as a proxy for
a canonical GSD agent. Plan 12 MUST consult the enumeration's parenthetical
annotation (e.g., "proxy for `gsd-phase-researcher`") and pass the **canonical
agent type** to `resolveModelInternal`. Mapping table:

| Enumeration row | Literal agent_type | Proxy for (passes to resolveModelInternal) |
|-----------------|--------------------|--------------------------------------------|
| 11 | `general-purpose` | `gsd-phase-researcher` |
| 12 | `general-purpose` | `gsd-planner` |
| 14 | `general-purpose` | `gsd-planner` |
| 22 | `general-purpose` | `gsd-advisor-researcher` |
| 27 | `general-purpose` | `gsd-project-researcher` |
| 28 | `general-purpose` | `gsd-project-researcher` |
| 29 | `general-purpose` | `gsd-project-researcher` |
| 30 | `general-purpose` | `gsd-project-researcher` |
| 38 | `general-purpose` | (ambiguous — Plan 12 deviation) |
| 39 | `general-purpose` | `gsd-phase-researcher` |
| 40 | `general-purpose` | `gsd-phase-researcher` |
| 41 | `general-purpose` | `gsd-phase-researcher` |
| 42 | `general-purpose` | `gsd-phase-researcher` |

Row 38 (`diagnose-issues.md:111`) is the ambiguous case — the enumeration
classified it as `other` with no proxy annotation. Plan 12 deviation: treat
it as `gsd-debugger` proxy (the enclosing workflow purpose is diagnosis) OR
skip the baked-in model and record `# Model: sonnet (general-purpose default)`
with explicit rationale. Either choice is honest as long as it's recorded.

### 3.4 Expansion-time vs runtime

- **Expansion time** = Plan 12 runs `node -e "..."` or a dedicated CLI
  subcommand (see §3.5) during its task execution. This is where literals
  get baked into the comment blocks.
- **Runtime** = the workflow file is read during an actual session and the
  `Task()` body executes. The runtime still resolves `{researcher_model}`
  through the standard template substitution path — the comment is purely a
  record of what the expansion-time resolution was.

If a future runtime (Codex auto-compact) compresses the workflow context and
drops the `{researcher_model}` binding, the inline comment has already
recorded the literal, so the runtime can recover the correct model by
reading its own file. This is the **compaction-survival property**.

### 3.5 Suggested CLI surface for Plan 12

Plan 12 MAY register a helper subcommand (decision up to Plan 12 authorship
— not required here):

```bash
node get-shit-done/bin/gsd-tools.cjs resolve-model gsd-phase-researcher
# → "opus"   (or concrete id, or "")
```

If not registered as a subcommand, Plan 12 invokes via Node one-liner:

```bash
node -e '
  const { resolveModelInternal } = require("./get-shit-done/bin/lib/core.cjs");
  console.log(resolveModelInternal(process.cwd(), process.argv[1]));
' gsd-phase-researcher
```

---

## 4. CI Grep Specification for GATE-13

### 4.1 The grep

Wave 2 Plan 07 registers this exact CI check:

```bash
grep -rn --include='*.md' -A 5 'Task(' \
  agents/ get-shit-done/ commands/ .codex/skills/ \
  2>/dev/null \
  | grep -E 'model\s*=\s*"\{[^}]+\}"'
```

**Any hit = FAIL.** The grep finds lines inside the 5-line window after a
`Task(` call where `model=` is bound to a `{...}` template expression. If
the grep returns zero hits, GATE-13 is green.

### 4.2 Allowlist for transitional period

Plan 07 initially creates `.github/gate-13-allowlist.txt` listing the 45
spawn sites that have NOT yet been edited by Plan 12. During the transition:

```bash
grep -rn --include='*.md' -A 5 'Task(' \
  agents/ get-shit-done/ commands/ .codex/skills/ \
  2>/dev/null \
  | grep -E 'model\s*=\s*"\{[^}]+\}"' \
  | grep -vFf .github/gate-13-allowlist.txt \
  || echo "GATE-13 PASS (non-allowlisted sites clean)"
```

Plan 12 removes lines from the allowlist as each site gets edited. When the
allowlist is empty, Plan 12a deletes the allowlist file and the CI step
falls through to the plain grep from §4.1.

### 4.3 Scope

The grep targets `agents/`, `get-shit-done/`, `commands/`, `.codex/skills/`.
It does NOT scan:

- `get-shit-done/templates/` — prompt templates, NOT live dispatch sites.
- `get-shit-done/references/` — documentation examples.
- `.planning/` — project artifacts (not installer-shipped).
- `node_modules/` — third-party.
- `.sonnet-run-archive/` — frozen session archive.

Matches the enumeration scope from `58-02-gate05-enumeration.md` §1.1.

### 4.4 Edge cases

- **Literal `model="gsd-phase-researcher"` (no braces)** — passes grep, as
  expected.
- **Empty string `model=""`** — passes grep (this is the
  `resolve_model_ids=omit` case from §3.2 Case C).
- **Model split across lines** — `model=\n "{foo}"` — the `-A 5` context
  window catches it if the brace appears within 5 lines of `Task(`; Plan 12
  should collapse split `model=` to a single line as part of its edits.
- **Commented-out Task()** — if `Task(` is inside a `<!-- -->` HTML comment
  or inside a markdown code fence labeled as example, grep still hits. Plan
  07 owner should either keep the allowlist permanent for example-blocks or
  add a secondary filter like `grep -v '^<!--'`. Deferred to Plan 07.

---

## 5. Per-Gate Codex Behavior and Fire-Event Mechanism

### 5.1 GATE-05 Codex behavior

**`applies`** (both runtimes).

The echo macro is shell-native — `echo`, `printf`, `date`, `mkdir` all exist
on both Claude Code's shell and Codex CLI's shell. `.planning/delegation-log.jsonl`
is a plain filesystem append that works identically. No runtime-specific
substrate.

The `RUNTIME` env var lets Codex sessions self-label (`export
GSD_RUNTIME=codex-cli` in Codex skill prelude) so the extractor can stratify
later.

### 5.2 GATE-13 Codex behavior

**`applies`** (both runtimes) — with explicit note that Codex auto-compact is
the **motivating runtime-specific failure mode** per
`sig-2026-04-17-codex-auto-compact-prompt-parity-gap.md` (3 occurrences).

The inline comment block survives auto-compact verbatim because:

1. Comments are treated as literal prose by the compacter.
2. The baked-in literal value has no template variable to drop.
3. The comment block is adjacent to the `Task()` call, so compaction-
   preserving proximity rules treat them as one semantic unit.

Claude Code does not experience auto-compact in the same way but can still
lose template-variable bindings when the workflow context is large (audit
§1). The same inline pattern fixes both.

### 5.3 Fire-event summary

| Gate | Fire-event | Substrate |
|------|------------|-----------|
| GATE-05 | 1 line appended to `.planning/delegation-log.jsonl` per spawn | Plan 19 extractor reads JSONL, counts spawn density, stratifies by agent/model/runtime |
| GATE-13 | CI grep returns 0 hits for `model="{...}"` inside `Task(` | `::notice::gate_fired=GATE-13 result=pass` emitted by CI on zero-hit; `::notice::gate_fired=GATE-13 result=block` on any hit |

Plan 19 registers both as `DERIVED` family extractors (per Phase 57.5
taxonomy). The GATE-05 extractor produces `delegation_log_lines_per_session`,
`distinct_models_per_session`, and `runtime_split` facets. The GATE-13
extractor produces `gate13_fire_pass` / `gate13_fire_block` boolean per CI
run.

---

## 6. Wave 3 Plan 12 Insertion Procedure (Summary)

For each row in `58-02-gate05-enumeration.md` §4.2:

1. Read the workflow file; locate the `Task(` block at `file:line`.
2. Resolve the literal model via `resolveModelInternal(cwd, agent_type)`
   (using the `general-purpose` proxy mapping from §3.3 if applicable).
3. Insert the GATE-05 echo macro (Section 1.1) immediately above the spawn.
4. Insert the GATE-13 dispatch-contract comment block (Section 2.1)
   immediately above the `Task(` call (or as the first lines inside the
   fenced code block containing the call).
5. Leave the runtime `Task()` body's `model=` attribute UNCHANGED (still
   uses the template variable).
6. Remove the site from `.github/gate-13-allowlist.txt`.
7. Commit per-row (or per-file, if multiple rows share a file).

After all 45 rows are processed, delete the allowlist file (Plan 12a tail
task) and confirm the CI grep from §4.1 returns zero hits.
